// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { backup } = await req.json();
    if (!backup || typeof backup !== 'object') {
      return new Response('Invalid backup payload', { status: 400, headers: corsHeaders });
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const BackupData = backup || {};
    
    // Helper function to safely upsert data
    const upsert = async (table: string, rows: any[], onConflict?: string) => {
      if (!Array.isArray(rows) || rows.length === 0) {
        console.log(`Skipping ${table}: no data`);
        return;
      }
      console.log(`Restoring ${rows.length} rows to ${table}`);
      const { error } = await supabase.from(table).upsert(rows, { onConflict });
      if (error) {
        console.error(`Error restoring ${table}:`, error);
        throw error;
      }
    };

    // Restore data in correct order (respecting foreign key dependencies)
    await upsert('cities', BackupData.cities, 'id');
    await upsert('profiles', BackupData.profiles, 'id');
    await upsert('user_roles', BackupData.user_roles, 'id');
    await upsert('hotel_owners', BackupData.hotel_owners, 'id');
    await upsert('hotels', BackupData.hotels, 'id');
    await upsert('hotel_seasonal_pricing', BackupData.hotel_seasonal_pricing, 'id');
    await upsert('hotel_responsible_persons', BackupData.hotel_responsible_persons, 'id');
    await upsert('bookings', BackupData.bookings, 'id');
    await upsert('room_availability', BackupData.room_availability, 'id');
    await upsert('booking_actions_log', BackupData.booking_actions_log, 'id');
    await upsert('reviews', BackupData.reviews, 'id');
    await upsert('complaints', BackupData.complaints, 'id');
    await upsert('coupons', BackupData.coupons, 'id');
    await upsert('coupon_hotels', BackupData.coupon_hotels, 'id');
    await upsert('coupon_users', BackupData.coupon_users, 'id');
    await upsert('loyalty_points', BackupData.loyalty_points, 'id');
    await upsert('referrals', BackupData.referrals, 'id');
    await upsert('employee_attendance', BackupData.employee_attendance, 'id');
    await upsert('employee_salaries', BackupData.employee_salaries, 'id');
    await upsert('financial_transactions', BackupData.financial_transactions, 'id');
    await upsert('chat_sessions', BackupData.chat_sessions, 'id');
    await upsert('chat_messages', BackupData.chat_messages, 'id');
    await upsert('notifications', BackupData.notifications, 'id');
    await upsert('company_requests', BackupData.company_requests, 'id');
    await upsert('audit_logs', BackupData.audit_logs, 'id');
    await upsert('customer_access_logs', BackupData.customer_access_logs, 'id');
    await upsert('api_settings', BackupData.api_settings, 'id');
    await upsert('api_requests', BackupData.api_requests, 'id');
    await upsert('whatsapp_settings', BackupData.whatsapp_settings, 'id');
    await upsert('pdf_settings', BackupData.pdf_settings, 'id');
    await upsert('site_settings', BackupData.site_settings, 'id');

    return new Response(JSON.stringify({ ok: true, message: 'Backup restored successfully' }), { 
      headers: { 'Content-Type': 'application/json', ...corsHeaders } 
    });
  } catch (e: any) {
    console.error('restore-backup error', e);
    return new Response(e?.message || 'Internal error', { status: 500, headers: corsHeaders });
  }
});