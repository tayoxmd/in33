import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KanbanTask } from './KanbanTask';
import type { TaskWithDetails } from '@/types/kanban';

interface KanbanColumnProps {
  id: string;
  title: string;
  tasks: TaskWithDetails[];
  color: string;
  onAddTask?: () => void;
  onTaskClick: (task: TaskWithDetails) => void;
  showAddButton?: boolean;
  onTaskDeleted?: () => void;
}

export function KanbanColumn({ 
  id, 
  title, 
  tasks, 
  color, 
  onAddTask, 
  onTaskClick,
  showAddButton = true,
  onTaskDeleted
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <Card className="flex-1 min-w-[160px] md:min-w-[200px] lg:min-w-[240px] bg-muted/30 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <CardHeader className="pb-2 md:pb-3 p-3 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 md:gap-2">
            <div 
              className="w-2 h-2 md:w-3 md:h-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <h3 className="font-semibold text-xs md:text-base">{title}</h3>
            <Badge variant="secondary" className="text-[10px] md:text-xs px-1 md:px-2 py-0 bg-blue-500/90 text-white">
              {tasks.length}
            </Badge>
          </div>
          {showAddButton && onAddTask && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 w-6 md:h-8 md:w-8 p-0"
              onClick={onAddTask}
            >
              <Plus className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent 
        ref={setNodeRef}
        className="min-h-[200px] md:min-h-[calc(100vh-180px)] max-h-[50vh] md:max-h-[calc(100vh-180px)] overflow-y-auto p-2 md:p-4 space-y-2"
      >
        <SortableContext 
          items={tasks.map(t => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="text-center text-muted-foreground text-xs md:text-sm py-4 md:py-8">
              لا توجد مهام
            </div>
          ) : (
            tasks.map(task => (
              <KanbanTask 
                key={task.id} 
                task={task} 
                onClick={() => onTaskClick(task)}
                onTaskDeleted={onTaskDeleted}
              />
            ))
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}