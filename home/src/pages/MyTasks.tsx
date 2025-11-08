import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { KanbanTask } from '@/components/kanban/KanbanTask';
import { TaskDetailDialog } from '@/components/kanban/TaskDetailDialog';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { TaskWithDetails } from '@/types/kanban';

type Task = TaskWithDetails;

export default function MyTasks() {
  const { t } = useLanguage();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 120,
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    checkAccess();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('my-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${user.id}`,
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const checkAccess = async () => {
    if (!user) return;
    
    try {
      // Check if user has task access through full_access_users table or by role
      const hasAdminAccess = ['admin', 'manager'].includes(userRole || '');
      
      if (!hasAdminAccess) {
        const { data, error } = await supabase
          .from('task_full_access_users')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking access:', error);
        }

        if (!data && !hasAdminAccess) {
          // User doesn't have access, redirect to home
          toast.error(t({ ar: 'ليس لديك صلاحية الوصول للمهام', en: 'You do not have access to tasks' }));
          navigate('/');
          return;
        }
      }

      // User has access, fetch tasks
      fetchTasks();
    } catch (error) {
      console.error('Error checking access:', error);
      navigate('/');
    }
  };

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', user.id)
        .neq('status', 'archived')
        .order('order_index', { ascending: true });

      if (error) throw error;

      const assigneeIds = Array.from(new Set((data || []).map((t: any) => t.assigned_to).filter(Boolean))) as string[];
      let assigneeMap: Record<string, string> = {};
      if (assigneeIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', assigneeIds);
        profilesData?.forEach((p: any) => {
          assigneeMap[p.id] = p.full_name;
        });
      }

      const tasksWithCounts = await Promise.all(
        (data || []).map(async (task: any) => {
          const [commentsResult, attachmentsResult] = await Promise.all([
            supabase
              .from('task_comments')
              .select('id', { count: 'exact', head: true })
              .eq('task_id', task.id),
            supabase
              .from('task_attachments')
              .select('id', { count: 'exact', head: true })
              .eq('task_id', task.id),
          ]);

          return {
            ...task,
            assignee_name: task.assigned_to ? assigneeMap[task.assigned_to] : undefined,
            comments_count: commentsResult.count || 0,
            attachments_count: attachmentsResult.count || 0,
          };
        })
      );

      setTasks(tasksWithCounts as Task[]);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error(t({ ar: 'حدث خطأ أثناء تحميل المهام', en: 'Error loading tasks' }));
    } finally {
      setLoading(false);
    }
  };

  const columns = useMemo(() => {
    return [
      {
        id: 'todo',
        title: t({ ar: 'جديدة', en: 'New' }),
        color: '#3b82f6',
        tasks: tasks.filter((t) => t.status === 'todo'),
      },
      {
        id: 'in_progress',
        title: t({ ar: 'قيد التنفيذ', en: 'In Progress' }),
        color: '#f59e0b',
        tasks: tasks.filter((t) => t.status === 'in_progress'),
      },
      {
        id: 'done',
        title: t({ ar: 'مكتملة', en: 'Done' }),
        color: '#10b981',
        tasks: tasks.filter((t) => t.status === 'done'),
      },
      {
        id: 'rejected',
        title: t({ ar: 'ملغية', en: 'Cancelled' }),
        color: '#ef4444',
        tasks: tasks.filter((t) => t.status === 'rejected'),
      },
    ];
  }, [tasks, t]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveTask(null);
      return;
    }

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) {
      setActiveTask(null);
      return;
    }

    // Check if dropped on a column
    const overColumn = columns.find((col) => col.id === over.id);
    if (overColumn) {
      if (activeTask.status !== overColumn.id) {
        await updateTaskStatus(activeTask.id, overColumn.id as any, activeTask.status as any);
      }
      setActiveTask(null);
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask && active.id !== over.id) {
      if (activeTask.status !== overTask.status) {
        await updateTaskStatus(activeTask.id, overTask.status as any, activeTask.status as any);
      } else {
        // Reorder tasks within the same column
        const oldIndex = tasks.findIndex((t) => t.id === active.id);
        const newIndex = tasks.findIndex((t) => t.id === over.id);
        const newTasks = arrayMove(tasks, oldIndex, newIndex);

        // Update order_index for all tasks in the affected column
        const statusTasks = newTasks.filter((t) => t.status === activeTask.status);
        const updates = statusTasks.map((task, index) => ({
          id: task.id,
          order_index: index,
        }));

        setTasks(newTasks);

        await Promise.all(
          updates.map((update) =>
            supabase
              .from('tasks')
              .update({ order_index: update.order_index })
              .eq('id', update.id)
          )
        );
      }
    }

    setActiveTask(null);
  };

  const updateTaskStatus = async (
    taskId: string,
    newStatus: 'todo' | 'in_progress' | 'done' | 'rejected',
    oldStatus?: 'todo' | 'in_progress' | 'done' | 'rejected'
  ) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      // Send WhatsApp notification via automation
      await sendWhatsAppNotification(taskId, newStatus);

      toast.success(t({ ar: 'تم تحديث حالة المهمة', en: 'Task status updated' }));
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error(t({ ar: 'حدث خطأ', en: 'An error occurred' }));
      if (oldStatus) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: oldStatus } : t)));
      }
    }
  };

  const sendWhatsAppNotification = async (taskId: string, status: string) => {
    try {
      // Get task sharing settings
      const { data: settings } = await supabase
        .from('task_sharing_settings')
        .select('*')
        .single();

      if (!settings?.share_via_whatsapp_group || !settings?.notify_on_status_change) {
        return;
      }

      // Call edge function to send WhatsApp message
      await supabase.functions.invoke('notify-whatsapp-group', {
        body: {
          task_id: taskId,
          event_type: 'status_change',
          new_status: status,
        },
      });
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setDetailDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-background via-muted/30 to-background overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Compact Header */}
        <div className="flex-shrink-0 px-3 md:px-6 py-2 md:py-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-6 w-6"
              >
                <ArrowLeft className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="h-6 w-6"
              >
                <Home className="w-3 h-3" />
              </Button>
              <h1 className="text-base md:text-lg font-semibold">
                {t({ ar: 'المهام', en: 'Tasks' })}
              </h1>
            </div>
          </div>
        </div>

        {/* Kanban Board - Full remaining space */}
        <div className="flex-1 overflow-hidden">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="h-full overflow-x-hidden overflow-y-auto px-2 md:px-4 py-3">
              <div className="h-full grid grid-cols-2 lg:grid-cols-4 grid-rows-2 lg:grid-rows-1 gap-3 md:gap-4 min-w-0">
                {columns.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    id={column.id}
                    title={column.title}
                    tasks={column.tasks}
                    color={column.color}
                    onTaskClick={handleTaskClick}
                    showAddButton={false}
                    onTaskDeleted={fetchTasks}
                  />
                ))}
              </div>
            </div>

            <DragOverlay dropAnimation={null}>
              {activeTask && (
                <div className="opacity-90 rotate-3 scale-105">
                  <KanbanTask task={activeTask} onClick={() => {}} />
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onTaskUpdated={fetchTasks}
        />
      )}
    </div>
  );
}
