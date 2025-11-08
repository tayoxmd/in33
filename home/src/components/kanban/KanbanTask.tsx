import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MessageSquare, Paperclip, User, DollarSign, Tag } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRef } from 'react';
import { TaskActionMenu } from './TaskActionMenu';
import type { TaskWithDetails } from '@/types/kanban';

interface KanbanTaskProps {
  task: TaskWithDetails;
  onClick: (task: TaskWithDetails) => void;
  onTaskDeleted?: () => void;
}

export function KanbanTask({ task, onClick, onTaskDeleted }: KanbanTaskProps) {
  const { language } = useLanguage();
  const taskRef = useRef<HTMLDivElement>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColors = {
    low: 'bg-slate-400',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-600',
  };

  const categoryIcons = {
    general: Tag,
    financial: DollarSign,
    booking: Calendar,
    support: MessageSquare,
    maintenance: Paperclip,
  };

  const CategoryIcon = task.category ? categoryIcons[task.category as keyof typeof categoryIcons] || Tag : Tag;

  const priorityColorMap: Record<string, string> = {
    low: '#94a3b8',
    medium: '#3b82f6',
    high: '#fb923c',
    urgent: '#dc2626',
  };

  return (
    <Card
      ref={(node) => {
        setNodeRef(node);
        if (taskRef.current === null && node) {
          taskRef.current = node;
        }
      }}
      style={{ ...style, borderLeftColor: priorityColorMap[task.priority] }}
      {...attributes}
      {...listeners}
      className="relative p-2 md:p-3 cursor-grab active:cursor-grabbing hover:shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-all mb-2.5 border-l-4 bg-card/80 backdrop-blur-sm"
      onClick={() => onClick(task)}
    >
      {onTaskDeleted && (
        <TaskActionMenu 
          task={task} 
          onTaskDeleted={onTaskDeleted}
          taskRef={taskRef}
        />
      )}
      <div className="space-y-1.5">
        {/* Header: title only */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-xs md:text-sm line-clamp-2 leading-tight">{task.title}</h4>
          </div>
          {task.category && (
            <CategoryIcon className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
          )}
        </div>

        {/* Description - Added */}
        {task.description && (
          <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2 leading-snug">
            {task.description}
          </p>
        )}

        {/* Assignee name directly under title */}
        {task.assignee_name && (
          <div className="flex items-center gap-1 text-[10px] md:text-xs text-muted-foreground">
            <User className="h-2.5 w-2.5 md:h-3 md:w-3" />
            <span className="truncate">{task.assignee_name}</span>
          </div>
        )}

        {/* Financial Info */}
        {task.is_financial && task.amount_total && (
          <div className="flex items-center gap-2 text-[10px] md:text-xs bg-primary/5 rounded p-1.5 md:p-2">
            <DollarSign className="h-3 w-3 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-primary truncate">
                {task.amount_remaining?.toFixed(2) || '0.00'} {language === 'ar' ? 'ر.س' : 'SAR'}
              </div>
              <div className="text-muted-foreground text-[9px] md:text-[10px] truncate">
                {language === 'ar' ? 'متبقي من' : 'remaining of'} {task.amount_total.toFixed(2)}
              </div>
            </div>
          </div>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-[9px] md:text-[10px] px-1 py-0">
                {tag}
              </Badge>
            ))}
            {task.tags.length > 2 && (
              <Badge variant="outline" className="text-[9px] md:text-[10px] px-1 py-0">
                +{task.tags.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Footer: icons only */}
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1.5 border-t">
          <div className="flex items-center gap-1.5">
            {task.due_date && (
              <div className="flex items-center gap-0.5">
                <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                <span className="text-[9px] md:text-[10px]">
                  {format(new Date(task.due_date), 'd MMM', {
                    locale: language === 'ar' ? ar : undefined,
                  })}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {(task.comments_count || 0) > 0 && (
              <div className="flex items-center gap-0.5">
                <MessageSquare className="h-2.5 w-2.5 md:h-3 md:w-3" />
                <span className="text-[9px] md:text-[10px]">{task.comments_count}</span>
              </div>
            )}
            {(task.attachments_count || 0) > 0 && (
              <div className="flex items-center gap-0.5">
                <Paperclip className="h-2.5 w-2.5 md:h-3 md:w-3" />
                <span className="text-[9px] md:text-[10px]">{task.attachments_count}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}