import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Edit, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface TaskCategory {
  id: string;
  name_ar: string;
  name_en: string;
  icon: string;
  color: string;
  active: boolean;
}

export default function TaskCategoriesSettings() {
  const { userRole } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TaskCategory | null>(null);
  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    icon: 'tag',
    color: '#6b7280'
  });

  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'manager') {
      navigate('/');
      return;
    }
    fetchCategories();
  }, [userRole, navigate]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCategories((data || []) as TaskCategory[]);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error(t({ ar: 'حدث خطأ أثناء تحميل التصنيفات', en: 'Error loading categories' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('task_categories')
          .update({
            name_ar: formData.name_ar,
            name_en: formData.name_en,
            icon: formData.icon,
            color: formData.color,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success(t({ ar: 'تم تحديث التصنيف', en: 'Category updated' }));
      } else {
        const { error } = await supabase
          .from('task_categories')
          .insert([{
            name_ar: formData.name_ar,
            name_en: formData.name_en,
            icon: formData.icon,
            color: formData.color
          }]);

        if (error) throw error;
        toast.success(t({ ar: 'تم إضافة التصنيف', en: 'Category added' }));
      }

      setDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name_ar: '', name_en: '', icon: 'tag', color: '#6b7280' });
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(t({ ar: 'حدث خطأ', en: 'An error occurred' }));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t({ ar: 'هل أنت متأكد من حذف هذا التصنيف؟', en: 'Are you sure you want to delete this category?' }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('task_categories')
        .update({ active: false })
        .eq('id', id);

      if (error) throw error;
      toast.success(t({ ar: 'تم حذف التصنيف', en: 'Category deleted' }));
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(t({ ar: 'حدث خطأ', en: 'An error occurred' }));
    }
  };

  const openEditDialog = (category: TaskCategory) => {
    setEditingCategory(category);
    setFormData({
      name_ar: category.name_ar,
      name_en: category.name_en,
      icon: category.icon,
      color: category.color
    });
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setEditingCategory(null);
    setFormData({ name_ar: '', name_en: '', icon: 'tag', color: '#6b7280' });
    setDialogOpen(true);
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
      <div className="container mx-auto p-4 pt-16 md:pt-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/task-manager')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Tag className="w-8 h-8" />
                {t({ ar: 'إدارة تصنيفات المهام', en: 'Task Categories Management' })}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t({ ar: 'إضافة وتعديل تصنيفات المهام', en: 'Add and edit task categories' })}
              </p>
            </div>
          </div>
          <Button onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            {t({ ar: 'إضافة تصنيف', en: 'Add Category' })}
          </Button>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {t({ ar: 'لا توجد فئات حالياً', en: 'No categories available' })}
              </p>
              <Button onClick={openAddDialog}>
                <Plus className="w-4 h-4 mr-2" />
                {t({ ar: 'إضافة أول فئة', en: 'Add First Category' })}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categories.filter(c => c.active !== false).map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: category.color }}
                    />
                    <span>{language === 'ar' ? category.name_ar : category.name_en}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(category)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(category.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t({ ar: 'العربي:', en: 'Arabic:' })} {category.name_ar}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t({ ar: 'الإنجليزي:', en: 'English:' })} {category.name_en}
                </p>
              </CardContent>
            </Card>
            ))}
          </div>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory
                  ? t({ ar: 'تعديل التصنيف', en: 'Edit Category' })
                  : t({ ar: 'إضافة تصنيف جديد', en: 'Add New Category' })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t({ ar: 'الاسم بالعربي', en: 'Arabic Name' })}</Label>
                <Input
                  value={formData.name_ar}
                  onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  placeholder={t({ ar: 'أدخل الاسم بالعربي', en: 'Enter Arabic name' })}
                />
              </div>
              <div>
                <Label>{t({ ar: 'الاسم بالإنجليزي', en: 'English Name' })}</Label>
                <Input
                  value={formData.name_en}
                  onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  placeholder={t({ ar: 'أدخل الاسم بالإنجليزي', en: 'Enter English name' })}
                />
              </div>
              <div>
                <Label>{t({ ar: 'اللون', en: 'Color' })}</Label>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                {t({ ar: 'إلغاء', en: 'Cancel' })}
              </Button>
              <Button onClick={handleSave}>
                {t({ ar: 'حفظ', en: 'Save' })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
