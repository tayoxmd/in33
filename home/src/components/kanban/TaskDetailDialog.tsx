import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TaskComment, TaskActivityLog, TaskCommentInsert } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  User, 
  Flag, 
  MessageSquare, 
  Send,
  Clock,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TaskDetailDialogProps {
  task: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

export function TaskDetailDialog({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
}: TaskDetailDialogProps) {
  const { language, t } = useLanguage();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [activityLog, setActivityLog] = useState<TaskActivityLog[]>([]);

  useEffect(() => {
    if (open && task) {
      fetchComments();
      fetchActivityLog();
    }
  }, [open, task]);

  const fetchComments = async () => {
    try {
      const { data, error} = await (supabase as any)
        .from('task_comments')
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq('task_id', task.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (error) throw error;
      setComments((data || []) as unknown as TaskComment[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('task_activity_log')
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq('task_id', task.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setActivityLog((data || []) as unknown as TaskActivityLog[]);
    } catch (error) {
      console.error('Error fetching activity log:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const commentData: TaskCommentInsert = {
        task_id: task.id,
        user_id: userData.user.id,
        comment: newComment,
      };

      // @ts-ignore - Supabase types will update automatically
      const { error } = await supabase.from('task_comments').insert([commentData]);

      if (error) throw error;

      toast.success(t({ ar: 'تم إضافة التعليق', en: 'Comment added' }));
      setNewComment('');
      fetchComments();
    } catch (error: any) {
      console.error('Error adding comment:', error);
      toast.error(t({ ar: 'حدث خطأ', en: 'An error occurred' }));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm(t({ ar: 'هل أنت متأكد من حذف هذه المهمة؟', en: 'Are you sure you want to delete this task?' }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks' as any)
        .delete()
        .eq('id', task.id);

      if (error) throw error;

      toast.success(t({ ar: 'تم حذف المهمة', en: 'Task deleted' }));
      onTaskUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast.error(t({ ar: 'حدث خطأ', en: 'An error occurred' }));
    }
  };

  if (!task) return null;

  const priorityLabels = {
    ar: { low: 'منخفضة', medium: 'متوسطة', high: 'عالية', urgent: 'عاجلة' },
    en: { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' },
  };

  const statusLabels = {
    ar: { todo: 'قيد الانتظار', in_progress: 'قيد التنفيذ', done: 'مكتمل' },
    en: { todo: 'To Do', in_progress: 'In Progress', done: 'Done' },
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* Task Info */}
            <div className="space-y-4">
              {/* Priority & Status */}
              <div className="flex gap-2">
                <Badge variant="outline">
                  <Flag className="w-3 h-3 mr-1" />
                  {priorityLabels[language][task.priority]}
                </Badge>
                <Badge>
                  {statusLabels[language][task.status]}
                </Badge>
                {task.tags?.map((tag: string, index: number) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <Label className="text-sm text-muted-foreground">
                    {t({ ar: 'الوصف', en: 'Description' })}
                  </Label>
                  <p className="mt-1 text-sm">{task.description}</p>
                </div>
              )}

              {/* Financial Info */}
              {task.is_financial && task.amount_total && (
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    {t({ ar: 'المعلومات المالية', en: 'Financial Information' })}
                  </Label>
                  <div className="p-3 md:p-4 bg-primary/5 rounded-lg space-y-2">
                    {/* Total & Paid */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {t({ ar: 'المبلغ الإجمالي:', en: 'Total Amount:' })}
                      </span>
                      <span className="text-sm md:text-base font-medium">
                        {task.amount_total.toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-muted-foreground">
                        {t({ ar: 'المبلغ المدفوع:', en: 'Paid Amount:' })}
                      </span>
                      <span className="text-sm md:text-base font-medium text-green-600">
                        {(task.amount_paid || 0).toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-xs md:text-sm font-medium">
                        {t({ ar: 'المبلغ المتبقي:', en: 'Remaining Amount:' })}
                      </span>
                      <span className="text-base md:text-lg font-bold text-primary">
                        {(task.amount_remaining || 0).toFixed(2)} {language === 'ar' ? 'ر.س' : 'SAR'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-4">
                {task.assignee_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {t({ ar: 'معين إلى', en: 'Assigned to' })}
                      </Label>
                      <p className="text-sm font-medium">{task.assignee_name}</p>
                    </div>
                  </div>
                )}

                {task.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        {t({ ar: 'تاريخ الاستحقاق', en: 'Due date' })}
                      </Label>
                      <p className="text-sm font-medium">
                        {format(new Date(task.due_date), 'PPP', {
                          locale: language === 'ar' ? ar : undefined,
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Activity Log */}
            {activityLog.length > 0 && (
              <>
                <div>
                  <Label className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4" />
                    {t({ ar: 'سجل النشاط', en: 'Activity Log' })}
                  </Label>
                  <div className="space-y-2">
                    {activityLog.map((log) => (
                      <div key={log.id} className="text-xs text-muted-foreground flex items-start gap-2">
                        <Avatar className="w-5 h-5">
                          <AvatarFallback className="text-[10px]">
                            {getInitials(log.profiles?.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="font-medium">{log.profiles?.full_name}</span>
                          {' '}
                          {log.action === 'status_changed' && t({ ar: 'غير الحالة', en: 'changed status' })}
                          {log.action === 'assigned_to_changed' && t({ ar: 'غير التعيين', en: 'changed assignment' })}
                          {log.action === 'priority_changed' && t({ ar: 'غير الأولوية', en: 'changed priority' })}
                          {' • '}
                          {format(new Date(log.created_at), 'PPp', {
                            locale: language === 'ar' ? ar : undefined,
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Comments */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4" />
                {t({ ar: 'التعليقات', en: 'Comments' })} ({comments.length})
              </Label>

              <div className="space-y-3 mb-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(comment.profiles?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {comment.profiles?.full_name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'PPp', {
                            locale: language === 'ar' ? ar : undefined,
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.comment}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t({ ar: 'أضف تعليق...', en: 'Add a comment...' })}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={loading || !newComment.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteTask}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {t({ ar: 'حذف المهمة', en: 'Delete Task' })}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t({ ar: 'إغلاق', en: 'Close' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}