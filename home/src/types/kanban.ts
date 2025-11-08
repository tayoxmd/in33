import { Database } from '@/integrations/supabase/types';

// Local types for Kanban system until Supabase types update
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done' | 'rejected' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  created_by: string;
  due_date?: string;
  order_index: number;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  is_financial?: boolean;
  amount_total?: number;
  amount_paid?: number;
  amount_remaining?: number;
  payment_due_date?: string;
}

export interface TaskInsert {
  title: string;
  description?: string;
  task_type?: 'administrative' | 'financial' | 'scheduling';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'done' | 'rejected';
  assigned_to?: string | null;
  due_date?: string | null;
  tags?: string[] | null;
  created_by: string;
  category?: string | null;
  is_financial?: boolean;
  amount_total?: number | null;
  amount_paid?: number | null;
  payment_due_date?: string | null;
}

export interface TaskUpdate {
  status?: 'todo' | 'in_progress' | 'done' | 'rejected';
  order_index?: number;
  amount_paid?: number;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name?: string;
  };
}

export interface TaskCommentInsert {
  task_id: string;
  user_id: string;
  comment: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_by: string;
  created_at: string;
}

export interface TaskActivityLog {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  old_value?: string;
  new_value?: string;
  created_at: string;
  profiles?: {
    full_name?: string;
  };
}

export interface TaskWithDetails extends Task {
  assignee_name?: string;
  comments_count?: number;
  attachments_count?: number;
  profiles?: {
    full_name?: string;
  };
}
