import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Edit, Trash2, Users, Search, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface Owner {
  id: string;
  name_ar: string;
  name_en: string;
  phone: string;
  email?: string;
  national_id?: string;
  address?: string;
  notes?: string;
  active: boolean;
  is_contract?: boolean;
  is_temporary?: boolean;
  created_at: string;
}

export default function PrivateOwners() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOwner, setEditingOwner] = useState<Owner | null>(null);
const [formData, setFormData] = useState({
  name_ar: '',
  name_en: '',
  phone: '',
  email: '',
  national_id: '',
  address: '',
  notes: '',
  active: true,
  is_contract: false,
  is_temporary: false
});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadOwners();
  }, [user]);

  const loadOwners = async () => {
    try {
      const { data, error } = await supabase
        .from('private_owners' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOwners((data as any) || []);
      setFilteredOwners((data as any) || []);
    } catch (error: any) {
      console.error('Error loading owners:', error);
      toast.error(t({ ar: 'خطأ في تحميل الملاك', en: 'Error loading owners' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredOwners(owners);
    } else {
      const filtered = owners.filter(owner =>
        owner.name_ar.toLowerCase().includes(query.toLowerCase()) ||
        owner.name_en.toLowerCase().includes(query.toLowerCase()) ||
        owner.phone.includes(query) ||
        owner.email?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredOwners(filtered);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name_ar || !formData.phone) {
        toast.error(t({ ar: 'الاسم والهاتف مطلوبان', en: 'Name and phone are required' }));
        return;
      }

      if (editingOwner) {
        const { error } = await supabase
          .from('private_owners' as any)
          .update(formData)
          .eq('id', editingOwner.id);

        if (error) throw error;
        toast.success(t({ ar: 'تم تحديث المالك بنجاح', en: 'Owner updated successfully' }));
      } else {
        const { error } = await supabase
          .from('private_owners' as any)
          .insert([formData]);

        if (error) throw error;
        toast.success(t({ ar: 'تم إضافة المالك بنجاح', en: 'Owner added successfully' }));
      }

      setIsDialogOpen(false);
      setEditingOwner(null);
      resetForm();
      loadOwners();
    } catch (error: any) {
      console.error('Error saving owner:', error);
      toast.error(t({ ar: 'خطأ في حفظ المالك', en: 'Error saving owner' }));
    }
  };

  const handleEdit = (owner: Owner) => {
setEditingOwner(owner);
setFormData({
  name_ar: owner.name_ar,
  name_en: owner.name_en,
  phone: owner.phone,
  email: owner.email || '',
  national_id: owner.national_id || '',
  address: owner.address || '',
  notes: owner.notes || '',
  active: owner.active,
  is_contract: !!owner.is_contract,
  is_temporary: !!owner.is_temporary
});
setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t({ ar: 'هل أنت متأكد من حذف هذا المالك؟', en: 'Are you sure you want to delete this owner?' }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('private_owners' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t({ ar: 'تم حذف المالك بنجاح', en: 'Owner deleted successfully' }));
      loadOwners();
    } catch (error: any) {
      console.error('Error deleting owner:', error);
      toast.error(t({ ar: 'خطأ في حذف المالك', en: 'Error deleting owner' }));
    }
  };

  const resetForm = () => {
setFormData({
  name_ar: '',
  name_en: '',
  phone: '',
  email: '',
  national_id: '',
  address: '',
  notes: '',
  active: true,
  is_contract: false,
  is_temporary: false
});
  };

  const exportToCSV = () => {
const headers = ['الاسم عربي', 'الاسم انجليزي', 'الهاتف', 'البريد', 'رقم الهوية', 'العنوان', 'بعقد', 'مؤقت'];
const csvContent = [
  headers.join(','),
  ...filteredOwners.map(o => 
    [o.name_ar, o.name_en, o.phone, o.email || '', o.national_id || '', o.address || '', o.is_contract ? 'نعم' : 'لا', o.is_temporary ? 'نعم' : 'لا'].join(',')
  )
].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `private_owners_${new Date().toISOString()}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4">{t({ ar: 'جاري التحميل...', en: 'Loading...' })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/private-accounting')}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {t({ ar: 'إدارة المُلاّك', en: 'Manage Owners' })}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t({ ar: 'إدارة مُلاّك الفنادق الخاصة', en: 'Manage private hotel owners' })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              {t({ ar: 'تصدير', en: 'Export' })}
            </Button>
            <Button onClick={() => {
              setEditingOwner(null);
              resetForm();
              setIsDialogOpen(true);
            }} className="gap-2">
              <Plus className="h-4 w-4" />
              {t({ ar: 'إضافة مالك', en: 'Add Owner' })}
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t({ ar: 'ابحث عن مالك...', en: 'Search for an owner...' })}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="grid gap-4">
          {filteredOwners.map(owner => (
            <Card key={owner.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
<h3 className="text-lg font-bold mb-2 flex items-center gap-2">
  {language === 'ar' ? owner.name_ar : owner.name_en}
  {owner.is_contract && (
    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">{t({ ar: 'بعقد', en: 'Contract' })}</span>
  )}
  {owner.is_temporary && (
    <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">{t({ ar: 'مؤقت', en: 'Temporary' })}</span>
  )}
</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><span className="font-medium">{t({ ar: 'الهاتف:', en: 'Phone:' })}</span> {owner.phone}</p>
                    {owner.email && (
                      <p><span className="font-medium">{t({ ar: 'البريد:', en: 'Email:' })}</span> {owner.email}</p>
                    )}
                    {owner.national_id && (
                      <p><span className="font-medium">{t({ ar: 'رقم الهوية:', en: 'National ID:' })}</span> {owner.national_id}</p>
                    )}
                    {owner.address && (
                      <p><span className="font-medium">{t({ ar: 'العنوان:', en: 'Address:' })}</span> {owner.address}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(owner)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(owner.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredOwners.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t({ ar: 'لا يوجد مُلاّك', en: 'No owners found' })}
              </p>
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOwner 
                  ? t({ ar: 'تعديل مالك', en: 'Edit Owner' })
                  : t({ ar: 'إضافة مالك جديد', en: 'Add New Owner' })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t({ ar: 'الاسم بالعربي', en: 'Name (Arabic)' })} *</Label>
                  <Input
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t({ ar: 'الاسم بالإنجليزي', en: 'Name (English)' })}</Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t({ ar: 'رقم الهاتف', en: 'Phone Number' })} *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label>{t({ ar: 'البريد الإلكتروني', en: 'Email' })}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
<div>
  <Label>{t({ ar: 'رقم الهوية', en: 'National ID' })}</Label>
  <Input
    value={formData.national_id}
    onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
  />
</div>
<div className="flex items-center gap-6">
  <label className="flex items-center gap-2 text-sm">
    <input
      type="checkbox"
      checked={formData.is_contract}
      onChange={(e) => setFormData({ ...formData, is_contract: e.target.checked })}
    />
    {t({ ar: 'مالك بعقد', en: 'Contract Owner' })}
  </label>
  <label className="flex items-center gap-2 text-sm">
    <input
      type="checkbox"
      checked={formData.is_temporary}
      onChange={(e) => setFormData({ ...formData, is_temporary: e.target.checked })}
    />
    {t({ ar: 'مالك مؤقت', en: 'Temporary Owner' })}
  </label>
</div>
              <div>
                <Label>{t({ ar: 'العنوان', en: 'Address' })}</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>{t({ ar: 'ملاحظات', en: 'Notes' })}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t({ ar: 'إلغاء', en: 'Cancel' })}
              </Button>
              <Button onClick={handleSubmit}>
                {editingOwner 
                  ? t({ ar: 'تحديث', en: 'Update' })
                  : t({ ar: 'إضافة', en: 'Add' })}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}