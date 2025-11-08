import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Archive, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ArchivedTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  assigned_to: string;
  assignee_name: string;
}

export default function TaskArchive() {
  const { t, language } = useLanguage();
  const { userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ArchivedTask[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canManage = userRole === 'admin';

  useEffect(() => {
    if (!canManage) {
      navigate('/task-settings');
      return;
    }
    fetchArchivedTasks();
  }, [canManage, navigate]);

  const fetchArchivedTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          description,
          status,
          priority,
          created_at,
          assigned_to
        `)
        .eq('status', 'archived')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get assignee names separately
      const assigneeIds = [...new Set(data?.map(t => t.assigned_to).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', assigneeIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      const formattedTasks = data?.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        created_at: task.created_at,
        assigned_to: task.assigned_to || '',
        assignee_name: task.assigned_to ? profileMap.get(task.assigned_to) || t({ ar: 'غير محدد', en: 'Not assigned' }) : t({ ar: 'غير محدد', en: 'Not assigned' })
      })) || [];

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching archived tasks:', error);
      toast.error(t({ ar: 'خطأ في جلب المهام المؤرشفة', en: 'Error fetching archived tasks' }));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskToDelete);

      if (error) throw error;

      toast.success(t({ ar: 'تم حذف المهمة نهائياً', en: 'Task permanently deleted' }));
      setTasks(tasks.filter(t => t.id !== taskToDelete));
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error(t({ ar: 'خطأ في حذف المهمة', en: 'Error deleting task' }));
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="container mx-auto p-4 md:p-6 pt-10 md:pt-14">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/task-settings')}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Archive className="w-6 h-6 md:w-8 md:h-8 text-orange-500" />
              {t({ ar: 'أرشيف المهام', en: 'Task Archive' })}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t({ 
                ar: 'جميع المهام المؤرشفة',
                en: 'All archived tasks'
              })}
            </p>
          </div>
        </div>

        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>
              {t({ ar: 'المهام المؤرشفة', en: 'Archived Tasks' })}
            </CardTitle>
            <CardDescription>
              {t({ 
                ar: `عدد المهام: ${tasks.length}`,
                en: `Total tasks: ${tasks.length}`
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t({ ar: 'لا توجد مهام مؤرشفة', en: 'No archived tasks' })}
              </p>
            ) : (
              <div className="space-y-3">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{task.title}</h3>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{t({ ar: 'المسؤول:', en: 'Assigned to:' })} {task.assignee_name}</span>
                        <span>{t({ ar: 'الأولوية:', en: 'Priority:' })} {task.priority}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setTaskToDelete(task.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            onClick={() => navigate('/task-settings')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {t({ ar: 'العودة', en: 'Back' })}
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t({ ar: 'حذف المهمة نهائياً', en: 'Permanently Delete Task' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t({ 
                ar: 'هل أنت متأكد من حذف هذه المهمة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
                en: 'Are you sure you want to permanently delete this task? This action cannot be undone.'
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t({ ar: 'إلغاء', en: 'Cancel' })}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTask}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? t({ ar: 'جاري الحذف...', en: 'Deleting...' }) : t({ ar: 'حذف نهائياً', en: 'Delete Permanently' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
