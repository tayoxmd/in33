import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Edit, Trash2, Hotel, Search, FileDown } from 'lucide-react';
import { toast } from 'sonner';

interface PrivateHotel {
  id: string;
  name_ar: string;
  name_en: string;
  location: string;
  city: string;
  price_per_night: number;
  owner_id?: string;
  owner_name?: string;
  total_rooms: number;
  active: boolean;
  is_contract: boolean;
  is_temporary: boolean;
  created_at: string;
}

export default function PrivateHotels() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [hotels, setHotels] = useState<PrivateHotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<PrivateHotel[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<PrivateHotel | null>(null);
  const [owners, setOwners] = useState<any[]>([]);
const [formData, setFormData] = useState({
  name_ar: '',
  name_en: '',
  location: '',
  city: '',
  price_per_night: '',
  owner_id: '',
  total_rooms: '10',
  active: true,
  is_contract: false,
  is_temporary: false
});

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadHotels();
    loadOwners();
  }, [user]);

  const loadOwners = async () => {
    try {
      const { data, error } = await supabase
        .from('private_owners' as any)
        .select('*')
        .eq('active', true);

      if (error) throw error;
      setOwners((data as any) || []);
    } catch (error: any) {
      console.error('Error loading owners:', error);
    }
  };

  const loadHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('private_hotels' as any)
        .select('*, private_owners(name_ar, name_en)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const hotelsData = (data as any || []).map((h: any) => ({
        ...h,
        owner_name: h.private_owners ? 
          (language === 'ar' ? h.private_owners.name_ar : h.private_owners.name_en) : 
          undefined
      }));
      
      setHotels(hotelsData);
      setFilteredHotels(hotelsData);
    } catch (error: any) {
      console.error('Error loading hotels:', error);
      toast.error(t({ ar: 'خطأ في تحميل الفنادق', en: 'Error loading hotels' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredHotels(hotels);
    } else {
      const filtered = hotels.filter(hotel =>
        hotel.name_ar.toLowerCase().includes(query.toLowerCase()) ||
        hotel.name_en.toLowerCase().includes(query.toLowerCase()) ||
        hotel.location.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredHotels(filtered);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name_ar || !formData.name_en) {
        toast.error(t({ ar: 'الاسم مطلوب', en: 'Name is required' }));
        return;
      }

const hotelData = {
  name_ar: formData.name_ar,
  name_en: formData.name_en,
  location: formData.location,
  city: formData.city,
  price_per_night: parseFloat(formData.price_per_night) || 0,
  owner_id: formData.owner_id || null,
  total_rooms: parseInt(formData.total_rooms) || 10,
  active: formData.active,
  is_contract: formData.is_contract,
  is_temporary: formData.is_temporary
};

      if (editingHotel) {
        const { error } = await supabase
          .from('private_hotels' as any)
          .update(hotelData)
          .eq('id', editingHotel.id);

        if (error) throw error;
        toast.success(t({ ar: 'تم تحديث الفندق بنجاح', en: 'Hotel updated successfully' }));
      } else {
        const { error } = await supabase
          .from('private_hotels' as any)
          .insert([hotelData]);

        if (error) throw error;
        toast.success(t({ ar: 'تم إضافة الفندق بنجاح', en: 'Hotel added successfully' }));
      }

      setIsDialogOpen(false);
      setEditingHotel(null);
      resetForm();
      loadHotels();
    } catch (error: any) {
      console.error('Error saving hotel:', error);
      toast.error(t({ ar: 'خطأ في حفظ الفندق', en: 'Error saving hotel' }));
    }
  };

  const handleEdit = (hotel: PrivateHotel) => {
setEditingHotel(hotel);
setFormData({
  name_ar: hotel.name_ar,
  name_en: hotel.name_en,
  location: hotel.location,
  city: hotel.city,
  price_per_night: hotel.price_per_night?.toString() || '',
  owner_id: hotel.owner_id || '',
  total_rooms: hotel.total_rooms?.toString() || '10',
  active: hotel.active,
  is_contract: !!hotel.is_contract,
  is_temporary: !!hotel.is_temporary
});
setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t({ ar: 'هل أنت متأكد من حذف هذا الفندق؟', en: 'Are you sure you want to delete this hotel?' }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('private_hotels' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t({ ar: 'تم حذف الفندق بنجاح', en: 'Hotel deleted successfully' }));
      loadHotels();
    } catch (error: any) {
      console.error('Error deleting hotel:', error);
      toast.error(t({ ar: 'خطأ في حذف الفندق', en: 'Error deleting hotel' }));
    }
  };

  const resetForm = () => {
setFormData({
  name_ar: '',
  name_en: '',
  location: '',
  city: '',
  price_per_night: '',
  owner_id: '',
  total_rooms: '10',
  active: true,
  is_contract: false,
  is_temporary: false
});
  };

  const exportToCSV = () => {
const headers = ['الاسم عربي', 'الاسم انجليزي', 'الموقع', 'المدينة', 'بعقد', 'مؤقت', 'السعر', 'المالك'];
const csvContent = [
  headers.join(','),
  ...filteredHotels.map(h => 
    [h.name_ar, h.name_en, h.location, h.city, h.is_contract ? 'نعم' : 'لا', h.is_temporary ? 'نعم' : 'لا', h.price_per_night, h.owner_name || ''].join(',')
  )
].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `private_hotels_${new Date().toISOString()}.csv`;
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
                {t({ ar: 'إدارة الفنادق', en: 'Manage Hotels' })}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t({ ar: 'إدارة فنادق الحسابات الخاصة', en: 'Manage private hotels' })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              {t({ ar: 'تصدير', en: 'Export' })}
            </Button>
            <Button onClick={() => {
              setEditingHotel(null);
              resetForm();
              setIsDialogOpen(true);
            }} className="gap-2">
              <Plus className="h-4 w-4" />
              {t({ ar: 'إضافة فندق', en: 'Add Hotel' })}
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t({ ar: 'ابحث عن فندق...', en: 'Search for a hotel...' })}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="grid gap-4">
          {filteredHotels.map(hotel => (
            <Card key={hotel.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
<div className="flex items-center gap-2 mb-2">
  <h3 className="text-lg font-bold">
    {language === 'ar' ? hotel.name_ar : hotel.name_en}
  </h3>
  {hotel.is_contract && (
    <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
      {t({ ar: 'بعقد', en: 'Contract' })}
    </span>
  )}
  {hotel.is_temporary && (
    <span className="text-xs px-2 py-1 rounded bg-orange-100 text-orange-700">
      {t({ ar: 'مؤقت', en: 'Temporary' })}
    </span>
  )}
</div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><span className="font-medium">{t({ ar: 'الموقع:', en: 'Location:' })}</span> {hotel.location}</p>
                    <p><span className="font-medium">{t({ ar: 'المدينة:', en: 'City:' })}</span> {hotel.city}</p>
                    <p><span className="font-medium">{t({ ar: 'السعر:', en: 'Price:' })}</span> {hotel.price_per_night} {t({ ar: 'ر.س', en: 'SAR' })}</p>
                    <p><span className="font-medium">{t({ ar: 'عدد الغرف:', en: 'Rooms:' })}</span> {hotel.total_rooms}</p>
                    {hotel.owner_name && (
                      <p><span className="font-medium">{t({ ar: 'المالك:', en: 'Owner:' })}</span> {hotel.owner_name}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(hotel)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(hotel.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredHotels.length === 0 && (
            <div className="text-center py-12">
              <Hotel className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t({ ar: 'لا يوجد فنادق', en: 'No hotels found' })}
              </p>
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingHotel 
                  ? t({ ar: 'تعديل فندق', en: 'Edit Hotel' })
                  : t({ ar: 'إضافة فندق جديد', en: 'Add New Hotel' })}
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
                  <Label>{t({ ar: 'الاسم بالإنجليزي', en: 'Name (English)' })} *</Label>
                  <Input
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                  />
                </div>
              </div>
<div>
  <Label>{t({ ar: 'نوع الفندق', en: 'Hotel Type' })}</Label>
  <div className="flex items-center gap-6 py-2">
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        checked={formData.is_contract}
        onCheckedChange={(checked) => setFormData({ ...formData, is_contract: Boolean(checked) })}
      />
      {t({ ar: 'بعقد', en: 'Contract' })}
    </label>
    <label className="flex items-center gap-2 text-sm">
      <Checkbox
        checked={formData.is_temporary}
        onCheckedChange={(checked) => setFormData({ ...formData, is_temporary: Boolean(checked) })}
      />
      {t({ ar: 'مؤقت', en: 'Temporary' })}
    </label>
  </div>
</div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t({ ar: 'الموقع', en: 'Location' })}</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t({ ar: 'المدينة', en: 'City' })}</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t({ ar: 'السعر لليلة', en: 'Price per Night' })}</Label>
                  <Input
                    type="number"
                    value={formData.price_per_night}
                    onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t({ ar: 'عدد الغرف', en: 'Total Rooms' })}</Label>
                  <Input
                    type="number"
                    value={formData.total_rooms}
                    onChange={(e) => setFormData({ ...formData, total_rooms: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>{t({ ar: 'المالك', en: 'Owner' })}</Label>
                <Select
                  value={formData.owner_id}
                  onValueChange={(value) => setFormData({ ...formData, owner_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t({ ar: 'اختر المالك', en: 'Select Owner' })} />
                  </SelectTrigger>
<SelectContent>
  {(owners as any[])
    .filter((owner: any) => {
      if (!formData.is_contract && !formData.is_temporary) return true;
      return (formData.is_contract && owner.is_contract) || (formData.is_temporary && owner.is_temporary);
    })
    .map(owner => (
      <SelectItem key={owner.id} value={owner.id}>
        {language === 'ar' ? owner.name_ar : owner.name_en}
      </SelectItem>
    ))}
</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                {t({ ar: 'إلغاء', en: 'Cancel' })}
              </Button>
              <Button onClick={handleSubmit}>
                {editingHotel 
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