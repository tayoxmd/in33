import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { task_id, event_type, new_status } = await req.json();

      if (!task_id) {
        return new Response(
          JSON.stringify({ error: 'Missing task_id' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get task sharing settings
      const { data: settings, error: settingsError } = await supabase
        .from('task_sharing_settings')
        .select('*')
        .single();

      if (settingsError || !settings?.share_via_whatsapp_group || !settings?.whatsapp_group_link) {
        console.log('WhatsApp task notifications disabled');
        return new Response(
          JSON.stringify({ message: 'WhatsApp task notifications disabled' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if we should send notification based on event type
      const shouldNotify = 
        (event_type === 'create' && settings.notify_on_create) ||
        (event_type === 'update' && settings.notify_on_update) ||
        (event_type === 'status_change' && settings.notify_on_status_change);

      if (!shouldNotify) {
        return new Response(
          JSON.stringify({ message: 'Notification not enabled for this event' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch task details
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select(`
          *,
          assignee:assigned_to(full_name, phone),
          creator:created_by(full_name)
        `)
        .eq('id', task_id)
        .single();

      if (taskError || !task) {
        console.error('Error fetching task:', taskError);
        return new Response(
          JSON.stringify({ error: 'Task not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Format message in Arabic
      const statusLabels: Record<string, string> = {
        todo: 'جديدة',
        in_progress: 'قيد التنفيذ',
        done: 'مكتملة',
        rejected: 'ملغية'
      };

      const priorityLabels: Record<string, string> = {
        low: 'منخفضة',
        medium: 'متوسطة',
        high: 'عالية',
        urgent: 'عاجلة'
      };

      let message = '';
      
      if (event_type === 'create') {
        message = `🆕 *مهمة جديدة*\n\n`;
        message += `📝 *العنوان:* ${task.title}\n`;
        if (task.description) message += `📄 *الوصف:* ${task.description}\n`;
        message += `⚡ *الأولوية:* ${priorityLabels[task.priority]}\n`;
        message += `👤 *المسؤول:* ${task.assignee?.full_name || 'غير معين'}\n`;
        message += `📊 *الحالة:* ${statusLabels[task.status]}\n`;
      } else if (event_type === 'status_change') {
        message = `🔄 *تحديث حالة المهمة*\n\n`;
        message += `📝 *المهمة:* ${task.title}\n`;
        message += `📊 *الحالة الجديدة:* ${statusLabels[new_status]}\n`;
        message += `👤 *المسؤول:* ${task.assignee?.full_name || 'غير معين'}\n`;
      } else {
        message = `✏️ *تحديث المهمة*\n\n`;
        message += `📝 *العنوان:* ${task.title}\n`;
        message += `📊 *الحالة:* ${statusLabels[task.status]}\n`;
        message += `👤 *المسؤول:* ${task.assignee?.full_name || 'غير معين'}\n`;
      }

      if (task.due_date) {
        const dueDate = new Date(task.due_date).toLocaleDateString('ar-SA');
        message += `📅 *تاريخ الاستحقاق:* ${dueDate}\n`;
      }

      // Note: For actual WhatsApp integration, you would need WhatsApp Business API
      console.log('Task WhatsApp message:', message);
      console.log('Group link:', settings.whatsapp_group_link);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Task notification prepared',
          content: message,
          groupLink: settings.whatsapp_group_link
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
    console.error('Error in notify-whatsapp-group function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
