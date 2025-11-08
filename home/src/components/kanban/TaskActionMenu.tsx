import { useState } from 'react';
import { MoreVertical, MessageCircle, Archive } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

import type { TaskWithDetails } from '@/types/kanban';

interface TaskActionMenuProps {
  task: TaskWithDetails;
  onTaskDeleted: () => void;
  taskRef?: React.RefObject<HTMLDivElement>;
}

export function TaskActionMenu({ task, onTaskDeleted, taskRef }: TaskActionMenuProps) {
  const { t } = useLanguage();
  const [isArchiving, setIsArchiving] = useState(false);

  const shareToWhatsApp = async () => {
    try {
      // Get assignee phone number
      const { data: profileData } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', task.assigned_to)
        .single();

      if (!profileData?.phone) {
        toast.error(t({ ar: 'رقم هاتف المسؤول غير متوفر', en: 'Assignee phone number not available' }));
        return;
      }

      const taskDetails = `
${t({ ar: 'مهمة جديدة', en: 'New Task' })}
${t({ ar: 'العنوان', en: 'Title' })}: ${task.title}
${t({ ar: 'الوصف', en: 'Description' })}: ${task.description || '-'}
${t({ ar: 'الحالة', en: 'Status' })}: ${task.status}
${t({ ar: 'الأولوية', en: 'Priority' })}: ${task.priority}
      `.trim();

      const whatsappUrl = `https://wa.me/${profileData.phone}?text=${encodeURIComponent(taskDetails)}`;
      window.open(whatsappUrl, '_blank');
      
      toast.success(t({ ar: 'تم فتح واتساب', en: 'WhatsApp opened' }));
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast.error(t({ ar: 'خطأ في المشاركة', en: 'Error sharing task' }));
    }
  };

  const archiveTask = async () => {
    if (isArchiving) return;
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'archived' })
        .eq('id', task.id);

      if (error) throw error;

      toast.success(t({ ar: 'تمت أرشفة المهمة', en: 'Task archived successfully' }));
      onTaskDeleted();
    } catch (error) {
      console.error('Error archiving task:', error);
      toast.error(t({ ar: 'خطأ في أرشفة المهمة', en: 'Error archiving task' }));
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-5 w-5 absolute top-1 left-1 z-10 hover:bg-accent"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-[1000]">
          <DropdownMenuItem 
            onSelect={(e) => { e.preventDefault(); shareToWhatsApp(); }}
            onClick={(e) => { e.preventDefault(); shareToWhatsApp(); }}
            className="gap-2 cursor-pointer"
          >
            <MessageCircle className="h-4 w-4 text-green-500" />
            {t({ ar: 'مشاركة عبر واتساب', en: 'Share via WhatsApp' })}
          </DropdownMenuItem>
          <DropdownMenuItem 
            onSelect={(e) => { e.preventDefault(); archiveTask(); }}
            onClick={(e) => { e.preventDefault(); archiveTask(); }}
            className="gap-2 text-orange-600 cursor-pointer"
          >
            <Archive className="h-4 w-4" />
            {t({ ar: 'أرشفة المهمة', en: 'Archive Task' })}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
