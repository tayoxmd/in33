import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { TaskInsert } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

interface TaskCategory {
  id: string;
  name_ar: string;
  name_en: string;
  color: string;
}
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Loader2, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialStatus?: 'todo' | 'in_progress' | 'done' | 'rejected';
  onTaskCreated: () => void;
}

export function CreateTaskDialog({
  open,
  onOpenChange,
  initialStatus = 'todo',
  onTaskCreated,
}: CreateTaskDialogProps) {
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    status: initialStatus,
    assigned_to: '',
    due_date: undefined as Date | undefined,
    tags: [] as string[],
    category: 'general',
    is_financial: false,
    voucher_type: '' as 'receipt' | 'payment' | '',
    amount_total: '',
    amount_paid: '',
    payment_due_date: undefined as Date | undefined,
  });

  useEffect(() => {
    if (open) {
      fetchEmployees();
      fetchCategories();
    }
  }, [open]);

  const fetchEmployees = async () => {
    try {
      // Step 1: get staff user ids from roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, active')
        .in('role', ['employee', 'admin', 'manager', 'company'])
        .eq('active', true);
      if (rolesError) throw rolesError;

      const ids = (rolesData || []).map(r => r.user_id).filter(Boolean);
      if (ids.length === 0) {
        setEmployees([]);
        return;
      }

      // Step 2: fetch profiles for those ids
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', ids);
      if (profilesError) throw profilesError;

      const list = (profilesData || []).map((p: any) => ({ user_id: p.id, full_name: p.full_name }));
      setEmployees(list);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    }
  };
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('id, name_ar, name_en, color')
        .eq('active', true)
        .order('name_en', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as TaskCategory[]);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error(t({ ar: 'يرجى إدخال عنوان المهمة', en: 'Please enter task title' }));
      return;
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

        const assignedTo = !formData.assigned_to || formData.assigned_to === '' ? null : formData.assigned_to;
        const taskData: TaskInsert = {
          title: formData.title,
          description: formData.description,
          task_type: 'administrative',
          priority: formData.priority,
          status: formData.status,
          assigned_to: assignedTo,
          due_date: formData.due_date ? formData.due_date.toISOString() : null,
          tags: formData.tags.length > 0 ? formData.tags : null,
          created_by: userData.user.id,
          category: formData.category,
          is_financial: formData.is_financial,
          amount_total: formData.is_financial && formData.amount_total ? parseFloat(formData.amount_total) : null,
          amount_paid: formData.is_financial && formData.amount_paid ? parseFloat(formData.amount_paid) : null,
          payment_due_date: formData.is_financial && formData.payment_due_date ? formData.payment_due_date.toISOString().split('T')[0] : null,
        };

      const { error } = await supabase.from('tasks').insert([taskData]);

      if (error) throw error;

      toast.success(t({ ar: 'تم إنشاء المهمة بنجاح', en: 'Task created successfully' }));
      onTaskCreated();
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        status: initialStatus,
        assigned_to: '',
        due_date: undefined,
        tags: [],
        category: 'general',
        is_financial: false,
        voucher_type: '',
        amount_total: '',
        amount_paid: '',
        payment_due_date: undefined,
      });
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(t({ ar: 'حدث خطأ أثناء إنشاء المهمة', en: 'Error creating task' }));
    } finally {
      setLoading(false);
    }
  };

  const amountRemaining = formData.is_financial && formData.amount_total && formData.amount_paid
    ? parseFloat(formData.amount_total) - parseFloat(formData.amount_paid)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t({ ar: 'إنشاء مهمة جديدة', en: 'Create New Task' })}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {t({ ar: 'عنوان المهمة', en: 'Task Title' })} *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t({ ar: 'أدخل عنوان المهمة', en: 'Enter task title' })}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {t({ ar: 'الوصف', en: 'Description' })}
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t({ ar: 'أدخل وصف المهمة', en: 'Enter task description' })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label>{t({ ar: 'التصنيف', en: 'Category' })}</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {language === 'ar' ? cat.name_ar : cat.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>{t({ ar: 'الأولوية', en: 'Priority' })}</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    {t({ ar: 'منخفضة', en: 'Low' })}
                  </SelectItem>
                  <SelectItem value="medium">
                    {t({ ar: 'متوسطة', en: 'Medium' })}
                  </SelectItem>
                  <SelectItem value="high">
                    {t({ ar: 'عالية', en: 'High' })}
                  </SelectItem>
                  <SelectItem value="urgent">
                    {t({ ar: 'عاجلة', en: 'Urgent' })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>{t({ ar: 'الحالة', en: 'Status' })}</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">
                    {t({ ar: 'جديدة', en: 'New' })}
                  </SelectItem>
                  <SelectItem value="in_progress">
                    {t({ ar: 'قيد التنفيذ', en: 'In Progress' })}
                  </SelectItem>
                  <SelectItem value="done">
                    {t({ ar: 'مكتملة', en: 'Done' })}
                  </SelectItem>
                  <SelectItem value="rejected">
                    {t({ ar: 'ملغية', en: 'Cancelled' })}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assign To */}
            <div className="space-y-2">
              <Label>{t({ ar: 'تعيين إلى', en: 'Assign To' })}</Label>
              <Select
                value={formData.assigned_to || undefined}
                onValueChange={(value) => setFormData({ ...formData, assigned_to: value || '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t({ ar: 'غير معين - اختر موظف', en: 'Unassigned - Select employee' })} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.user_id} value={emp.user_id}>
                      {emp.full_name || t({ ar: 'غير معروف', en: 'Unknown' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label>{t({ ar: 'تاريخ الاستحقاق', en: 'Due Date' })}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.due_date ? (
                    format(formData.due_date, 'PPP', {
                      locale: language === 'ar' ? ar : undefined,
                    })
                  ) : (
                    <span>{t({ ar: 'اختر التاريخ', en: 'Pick a date' })}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.due_date}
                  onSelect={(date) => setFormData({ ...formData, due_date: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">
              {t({ ar: 'الوسوم (افصل بفاصلة)', en: 'Tags (comma separated)' })}
            </Label>
            <Input
              id="tags"
              value={formData.tags.join(', ')}
              onChange={(e) => 
                setFormData({ 
                  ...formData, 
                  tags: e.target.value.split(',').map(t => t.trim()).filter(t => t) 
                })
              }
              placeholder={t({ ar: 'حجوزات, عاجل, متابعة', en: 'bookings, urgent, follow-up' })}
            />
          </div>

          {/* Financial Task Toggle */}
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <Label htmlFor="is_financial" className="text-base font-semibold">
                  {t({ ar: 'مهمة مالية', en: 'Financial Task' })}
                </Label>
              </div>
              <Switch
                id="is_financial"
                checked={formData.is_financial}
                onCheckedChange={(checked) => setFormData({ ...formData, is_financial: checked })}
              />
            </div>

          {formData.is_financial && (
              <div className="space-y-4 pt-2 border-t">
                {/* Voucher Type Selection */}
                <div className="space-y-2">
                  <Label>{t({ ar: 'نوع السند', en: 'Voucher Type' })}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      type="button"
                      variant={formData.voucher_type === 'receipt' ? 'default' : 'outline'}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setFormData({ ...formData, voucher_type: 'receipt' })}
                    >
                      <DollarSign className="h-6 w-6" />
                      <span>{t({ ar: 'سند قبض', en: 'Receipt Voucher' })}</span>
                    </Button>
                    <Button
                      type="button"
                      variant={formData.voucher_type === 'payment' ? 'default' : 'outline'}
                      className="h-20 flex flex-col gap-2"
                      onClick={() => setFormData({ ...formData, voucher_type: 'payment' })}
                    >
                      <DollarSign className="h-6 w-6" />
                      <span>{t({ ar: 'سند صرف', en: 'Payment Voucher' })}</span>
                    </Button>
                  </div>
                </div>

                {/* Show fields only after voucher type is selected */}
                {formData.voucher_type && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Total Amount */}
                      <div className="space-y-2">
                        <Label htmlFor="amount_total">
                          {t({ ar: 'المبلغ الإجمالي', en: 'Total Amount' })}
                        </Label>
                        <Input
                          id="amount_total"
                          type="number"
                          step="0.01"
                          value={formData.amount_total}
                          onChange={(e) => setFormData({ ...formData, amount_total: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>

                      {/* Paid Amount */}
                      <div className="space-y-2">
                        <Label htmlFor="amount_paid">
                          {t({ ar: 'المبلغ المدفوع', en: 'Paid Amount' })}
                        </Label>
                        <Input
                          id="amount_paid"
                          type="number"
                          step="0.01"
                          value={formData.amount_paid}
                          onChange={(e) => setFormData({ ...formData, amount_paid: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Remaining Amount Display */}
                    {formData.amount_total && (
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">
                            {t({ ar: 'المبلغ المتبقي:', en: 'Remaining Amount:' })}
                          </span>
                          <span className="text-lg font-bold text-primary">
                            {amountRemaining.toFixed(2)} {t({ ar: 'ر.س', en: 'SAR' })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Payment Due Date */}
                    <div className="space-y-2">
                      <Label>{t({ ar: 'تاريخ استحقاق الدفع', en: 'Payment Due Date' })}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.payment_due_date ? (
                              format(formData.payment_due_date, 'PPP', {
                                locale: language === 'ar' ? ar : undefined,
                              })
                            ) : (
                              <span>{t({ ar: 'اختر التاريخ', en: 'Pick a date' })}</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.payment_due_date}
                            onSelect={(date) => setFormData({ ...formData, payment_due_date: date })}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t({ ar: 'إلغاء', en: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t({ ar: 'إنشاء المهمة', en: 'Create Task' })}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}