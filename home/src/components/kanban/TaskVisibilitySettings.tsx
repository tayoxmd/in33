import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface TaskVisibilitySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_ROLES = [
  { value: 'admin', label_ar: 'مدير', label_en: 'Admin' },
  { value: 'manager', label_ar: 'مدير عام', label_en: 'Manager' },
  { value: 'employee', label_ar: 'موظف', label_en: 'Employee' },
  { value: 'company', label_ar: 'شركة', label_en: 'Company' },
];

export function TaskVisibilitySettings({ open, onOpenChange }: TaskVisibilitySettingsProps) {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('task_visible_roles')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      const roles = (data?.task_visible_roles as string[]) || ['admin', 'manager', 'employee'];
      setSelectedRoles(roles);
    } catch (error: any) {
      console.error('Error loading visibility settings:', error);
      // Default to all roles
      setSelectedRoles(['admin', 'manager', 'employee']);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = (role: string) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Check if settings exist
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .limit(1)
        .single();

      if (existing) {
        // Update
        const { error } = await supabase
          .from('site_settings')
          .update({ task_visible_roles: selectedRoles })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase
          .from('site_settings')
          .insert({ task_visible_roles: selectedRoles });
        if (error) throw error;
      }

      toast.success(t({ ar: 'تم حفظ الإعدادات', en: 'Settings saved' }));
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving visibility settings:', error);
      toast.error(t({ ar: 'حدث خطأ أثناء الحفظ', en: 'Error saving settings' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t({ ar: 'إعدادات ظهور المهام', en: 'Task Visibility Settings' })}
          </DialogTitle>
          <DialogDescription>
            {t({ 
              ar: 'اختر الأدوار التي يمكنها رؤية زر "مهامي" في القائمة', 
              en: 'Select roles that can see "My Tasks" button in the menu' 
            })}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {AVAILABLE_ROLES.map((role) => (
              <div key={role.value} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={role.value}
                  checked={selectedRoles.includes(role.value)}
                  onCheckedChange={() => handleToggleRole(role.value)}
                />
                <Label
                  htmlFor={role.value}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {language === 'ar' ? role.label_ar : role.label_en}
                </Label>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t({ ar: 'إلغاء', en: 'Cancel' })}
          </Button>
          <Button onClick={handleSave} disabled={saving || selectedRoles.length === 0}>
            {saving ? <LoadingSpinner size="sm" /> : t({ ar: 'حفظ', en: 'Save' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
