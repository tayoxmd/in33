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
import { KanbanColumn } from './KanbanColumn';
import { KanbanTask } from './KanbanTask';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskDetailDialog } from './TaskDetailDialog';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { TaskWithDetails } from '@/types/kanban';

type Task = TaskWithDetails;

export function KanbanBoard() {
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<'todo' | 'in_progress' | 'done' | 'rejected'>('todo');

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
    fetchTasks();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        () => {
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
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
        // Update task status immediately (optimistic)
        await updateTaskStatus(activeTask.id, overColumn.id as any, activeTask.status as any);
      }
      setActiveTask(null);
      return;
    }

    // Check if dropped on another task
    const overTask = tasks.find((t) => t.id === over.id);
  if (overTask && active.id !== over.id) {
    // If task is moved to a different column
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

        // Optimistic update
        setTasks(newTasks);

        // Update in database
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
    // Optimistic update first to avoid visual bounce
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;

      toast.success(t({ ar: 'تم تحديث حالة المهمة', en: 'Task status updated' }));
      // Do not fetch immediately; realtime subscription will sync
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error(t({ ar: 'حدث خطأ', en: 'An error occurred' }));
      // Revert on failure if we know previous
      if (oldStatus) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: oldStatus } : t)));
      }
    }
  };

  const handleAddTask = (columnId: 'todo' | 'in_progress' | 'done' | 'rejected') => {
    setInitialStatus(columnId);
    setCreateDialogOpen(true);
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
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Full height scrollable container */}
        <div className="h-full overflow-x-hidden overflow-y-auto px-2 md:px-4 py-3">
          <div className="h-full grid grid-cols-2 lg:grid-cols-4 grid-rows-2 lg:grid-rows-1 gap-3 md:gap-4 min-w-0">
            {columns.map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={column.tasks}
                color={column.color}
                onAddTask={() => handleAddTask(column.id as any)}
                onTaskClick={handleTaskClick}
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

      <CreateTaskDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialStatus={initialStatus}
        onTaskCreated={fetchTasks}
      />

      {selectedTask && (
        <TaskDetailDialog
          task={selectedTask}
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          onTaskUpdated={fetchTasks}
        />
      )}
    </>
  );
}