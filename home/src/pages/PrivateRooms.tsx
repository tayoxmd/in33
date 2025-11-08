import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Edit, Trash2, BedDouble, Search, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';

interface Room {
  id: string;
  hotel_id: string;
  hotel_name?: string;
  room_number: string;
  room_type?: string;
  price_per_night: number;
  status: string;
  notes?: string;
  created_at: string;
}

export default function PrivateRooms() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [hotels, setHotels] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    hotel_id: '',
    room_number: '',
    room_type: '',
    price_per_night: '',
    status: 'available' as 'available' | 'occupied' | 'maintenance',
    notes: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadRooms();
    loadHotels();
  }, [user]);

  const loadHotels = async () => {
    try {
      const { data, error } = await supabase
        .from('private_hotels' as any)
        .select('id, name_ar, name_en')
        .eq('active', true);

      if (error) throw error;
      setHotels((data as any) || []);
    } catch (error: any) {
      console.error('Error loading hotels:', error);
    }
  };

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('private_rooms' as any)
        .select('*, private_hotels(name_ar, name_en)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const roomsData = (data as any || []).map((r: any) => ({
        ...r,
        hotel_name: r.private_hotels ? 
          (language === 'ar' ? r.private_hotels.name_ar : r.private_hotels.name_en) : 
          undefined
      }));
      
      setRooms(roomsData);
      setFilteredRooms(roomsData);
    } catch (error: any) {
      console.error('Error loading rooms:', error);
      toast.error(t({ ar: 'خطأ في تحميل الغرف', en: 'Error loading rooms' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredRooms(rooms);
    } else {
      const filtered = rooms.filter(room =>
        room.room_number.toLowerCase().includes(query.toLowerCase()) ||
        room.hotel_name?.toLowerCase().includes(query.toLowerCase()) ||
        room.room_type?.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredRooms(filtered);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.room_number || !formData.hotel_id) {
        toast.error(t({ ar: 'رقم الغرفة والفندق مطلوبان', en: 'Room number and hotel are required' }));
        return;
      }

      const roomData = {
        ...formData,
        price_per_night: parseFloat(formData.price_per_night) || 0
      };

      if (editingRoom) {
        const { error } = await supabase
          .from('private_rooms' as any)
          .update(roomData)
          .eq('id', editingRoom.id);

        if (error) throw error;
        toast.success(t({ ar: 'تم تحديث الغرفة بنجاح', en: 'Room updated successfully' }));
      } else {
        const { error } = await supabase
          .from('private_rooms' as any)
          .insert([roomData]);

        if (error) throw error;
        toast.success(t({ ar: 'تم إضافة الغرفة بنجاح', en: 'Room added successfully' }));
      }

      setIsDialogOpen(false);
      setEditingRoom(null);
      resetForm();
      loadRooms();
    } catch (error: any) {
      console.error('Error saving room:', error);
      toast.error(t({ ar: 'خطأ في حفظ الغرفة', en: 'Error saving room' }));
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      hotel_id: room.hotel_id,
      room_number: room.room_number,
      room_type: room.room_type || '',
      price_per_night: room.price_per_night.toString(),
      status: room.status as any,
      notes: room.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t({ ar: 'هل أنت متأكد من حذف هذه الغرفة؟', en: 'Are you sure you want to delete this room?' }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('private_rooms' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success(t({ ar: 'تم حذف الغرفة بنجاح', en: 'Room deleted successfully' }));
      loadRooms();
    } catch (error: any) {
      console.error('Error deleting room:', error);
      toast.error(t({ ar: 'خطأ في حذف الغرفة', en: 'Error deleting room' }));
    }
  };

  const resetForm = () => {
    setFormData({
      hotel_id: '',
      room_number: '',
      room_type: '',
      price_per_night: '',
      status: 'available',
      notes: ''
    });
  };

  const exportToCSV = () => {
    const headers = ['الفندق', 'رقم الغرفة', 'النوع', 'السعر', 'الحالة'];
    const csvContent = [
      headers.join(','),
      ...filteredRooms.map(r => 
        [r.hotel_name || '', r.room_number, r.room_type || '', r.price_per_night, r.status].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `private_rooms_${new Date().toISOString()}.csv`;
    link.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'occupied':
        return 'bg-red-100 text-red-700';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      available: { ar: 'متاحة', en: 'Available' },
      occupied: { ar: 'محجوزة', en: 'Occupied' },
      maintenance: { ar: 'صيانة', en: 'Maintenance' }
    };
    return t(labels[status] || { ar: status, en: status });
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
                {t({ ar: 'إدارة الغرف', en: 'Manage Rooms' })}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t({ ar: 'إدارة غرف الفنادق الخاصة', en: 'Manage private hotel rooms' })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              {t({ ar: 'تصدير', en: 'Export' })}
            </Button>
            <Button onClick={() => {
              setEditingRoom(null);
              resetForm();
              setIsDialogOpen(true);
            }} className="gap-2">
              <Plus className="h-4 w-4" />
              {t({ ar: 'إضافة غرفة', en: 'Add Room' })}
            </Button>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder={t({ ar: 'ابحث عن غرفة...', en: 'Search for a room...' })}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="pr-10"
          />
        </div>

        <div className="grid gap-4">
          {filteredRooms.map(room => (
            <Card key={room.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold">{room.room_number}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(room.status)}`}>
                      {getStatusLabel(room.status)}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><span className="font-medium">{t({ ar: 'الفندق:', en: 'Hotel:' })}</span> {room.hotel_name}</p>
                    {room.room_type && (
                      <p><span className="font-medium">{t({ ar: 'النوع:', en: 'Type:' })}</span> {room.room_type}</p>
                    )}
                    <p><span className="font-medium">{t({ ar: 'السعر:', en: 'Price:' })}</span> {room.price_per_night} {t({ ar: 'ر.س', en: 'SAR' })}</p>
                    {room.notes && (
                      <p><span className="font-medium">{t({ ar: 'ملاحظات:', en: 'Notes:' })}</span> {room.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(room)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(room.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredRooms.length === 0 && (
            <div className="text-center py-12">
              <BedDouble className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t({ ar: 'لا يوجد غرف', en: 'No rooms found' })}
              </p>
            </div>
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingRoom 
                  ? t({ ar: 'تعديل غرفة', en: 'Edit Room' })
                  : t({ ar: 'إضافة غرفة جديدة', en: 'Add New Room' })}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{t({ ar: 'الفندق', en: 'Hotel' })} *</Label>
                <Select
                  value={formData.hotel_id}
                  onValueChange={(value) => setFormData({ ...formData, hotel_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t({ ar: 'اختر الفندق', en: 'Select Hotel' })} />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {language === 'ar' ? hotel.name_ar : hotel.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{t({ ar: 'رقم الغرفة', en: 'Room Number' })} *</Label>
                  <Input
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label>{t({ ar: 'نوع الغرفة', en: 'Room Type' })}</Label>
                  <Input
                    value={formData.room_type}
                    onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
                    placeholder={t({ ar: 'مثال: مفردة، مزدوجة', en: 'e.g: Single, Double' })}
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
                  <Label>{t({ ar: 'الحالة', en: 'Status' })}</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">{t({ ar: 'متاحة', en: 'Available' })}</SelectItem>
                      <SelectItem value="occupied">{t({ ar: 'محجوزة', en: 'Occupied' })}</SelectItem>
                      <SelectItem value="maintenance">{t({ ar: 'صيانة', en: 'Maintenance' })}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                {editingRoom 
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