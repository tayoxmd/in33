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

interface Customer {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  national_id?: string;
  address?: string;
  notes?: string;
  created_at: string;
}

export default function PrivateCustomers() {
  const { t, language } = useLanguage();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    national_id: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    checkAccess();
    loadCustomers();
  }, [user]);

  const checkAccess = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('private_customers' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers((data as any) || []);
      setFilteredCustomers((data as any) || []);
    } catch (error: any) {
      console.error('Error loading customers:', error);
      toast.error(t({ ar: 'خطأ في تحميل العملاء', en: 'Error loading customers' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.full_name.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.includes(query) ||
        customer.email?.toLowerCase().includes(query.toLowerCase()) ||
        customer.national_id?.includes(query)
      );
      setFilteredCustomers(filtered);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.full_name || !formData.phone) {
        toast.error(t({ ar: 'الاسم والهاتف مطلوبان', en: 'Name and phone are required' }));
        return;
      }

      if (editingCustomer) {
        const { error } = await supabase
          .from('private_customers' as any)
          .update(formData)
          .eq('id', editingCustomer.id);

        if (error) throw error;
        toast.success(t({ ar: 'تم تحديث العميل بنجاح', en: 'Customer updated successfully' }));
      } else {
        const { error } = await supabase
          .from('private_customers' as any)
          .insert([formData]);

        if (error) throw error;
        toast.success(t({ ar: 'تم إضافة العميل بنجاح', en: 'Customer added successfully' }));
      }

      setIsDialogOpen(false);
      setEditingCustomer(null);
      resetForm();
      loadCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast.error(t({ ar: 'خطأ في حفظ العميل', en: 'Error saving customer' }));
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      full_name: customer.full_name,
      phone: customer.phone,
      email: customer.email || '',
      national_id: customer.national_id || '',
      address: customer.address || '',
      notes: customer.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t({ ar: 'هل أنت متأكد من حذف هذا العميل؟', en: 'Are you sure you want to delete this customer?' }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('private_customers' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t({ ar: 'تم حذف العميل بنجاح', en: 'Customer deleted successfully' }));
      loadCustomers();
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      toast.error(t({ ar: 'خطأ في حذف العميل', en: 'Error deleting customer' }));
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      phone: '',
      email: '',
      national_id: '',
      address: '',
      notes: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['الاسم', 'الهاتف', 'البريد الإلكتروني', 'رقم الهوية', 'العنوان', 'الملاحظات'];
    const csvContent = [
      headers.join(','),
      ...filteredCustomers.map(c => 
        [c.full_name, c.phone, c.email || '', c.national_id || '', c.address || '', c.notes || ''].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `customers_${new Date().toISOString()}.csv`;
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
        {/* Header */}
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
                {t({ ar: 'إدارة العملاء', en: 'Manage Customers' })}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t({ ar: 'إدارة عملاء الحسابات الخاصة', en: 'Manage private customers' })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              {t({ ar: 'تصدير', en: 'Export' })}
            </Button>
            <Button onClick={() => {
              setEditingCustomer(null);
              resetForm();
              setIsDialogOpen(true);
            }} className="gap-2">
              <Plus className="h-4 w-4" />
              {t({ ar: 'إضافة عميل', en: 'Add Customer' })}
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t({ ar: 'ابحث عن عميل...', en: 'Search for a customer...' })}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Customers Grid */}
        <div className="grid gap-4">
          {filteredCustomers.map(customer => (
            <Card key={customer.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-2">{customer.full_name}</h3>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><span className="font-medium">{t({ ar: 'الهاتف:', en: 'Phone:' })}</span> {customer.phone}</p>
                    {customer.email && (
                      <p><span className="font-medium">{t({ ar: 'البريد:', en: 'Email:' })}</span> {customer.email}</p>
                    )}
                    {customer.national_id && (
                      <p><span className="font-medium">{t({ ar: 'رقم الهوية:', en: 'National ID:' })}</span> {customer.national_id}</p>
                    )}
                    {customer.address && (
                      <p><span className="font-medium">{t({ ar: 'العنوان:', en: 'Address:' })}</span> {customer.address}</p>
                    )}
                    {customer.notes && (
                      <p><span className="font-medium">{t({ ar: 'ملاحظات:', en: 'Notes:' })}</span> {customer.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(customer)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(customer.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t({ ar: 'لا يوجد عملاء', en: 'No customers found' })}
              </p>
            </div>
          )}
        </div>

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCustomer 
                  ? t({ ar: 'تعديل عميل', en: 'Edit Customer' })
                  : t({ ar: 'إضافة عميل جديد', en: 'Add New Customer' })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t({ ar: 'الاسم الكامل', en: 'Full Name' })} *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder={t({ ar: 'أدخل الاسم الكامل', en: 'Enter full name' })}
                />
              </div>
              <div>
                <Label>{t({ ar: 'رقم الهاتف', en: 'Phone Number' })} *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder={t({ ar: 'أدخل رقم الهاتف', en: 'Enter phone number' })}
                />
              </div>
              <div>
                <Label>{t({ ar: 'البريد الإلكتروني', en: 'Email' })}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder={t({ ar: 'أدخل البريد الإلكتروني', en: 'Enter email' })}
                />
              </div>
              <div>
                <Label>{t({ ar: 'رقم الهوية', en: 'National ID' })}</Label>
                <Input
                  value={formData.national_id}
                  onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                  placeholder={t({ ar: 'أدخل رقم الهوية', en: 'Enter national ID' })}
                />
              </div>
              <div>
                <Label>{t({ ar: 'العنوان', en: 'Address' })}</Label>
                <Textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder={t({ ar: 'أدخل العنوان', en: 'Enter address' })}
                  rows={3}
                />
              </div>
              <div>
                <Label>{t({ ar: 'ملاحظات', en: 'Notes' })}</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={t({ ar: 'أدخل ملاحظات', en: 'Enter notes' })}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t({ ar: 'إلغاء', en: 'Cancel' })}
              </Button>
              <Button onClick={handleSubmit}>
                {editingCustomer 
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
