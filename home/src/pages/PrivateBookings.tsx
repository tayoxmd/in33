import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Plus, Search, FileDown, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Booking {
  id: string;
  booking_number: number;
  customer_id: string;
  hotel_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  rooms: number;
  total_amount: number;
  amount_paid: number;
  discount_amount: number;
  status: string;
  payment_status: string;
  payment_method?: string;
  notes?: string;
  created_at: string;
  customer_name?: string;
  hotel_name?: string;
}

export default function PrivateBookings() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('private_bookings' as any)
        .select(`
          *,
          private_customers (full_name),
          private_hotels (name_ar, name_en)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedBookings = (bookingsData || []).map((booking: any) => ({
        ...booking,
        customer_name: booking.private_customers?.full_name,
        hotel_name: language === 'ar' ? booking.private_hotels?.name_ar : booking.private_hotels?.name_en
      }));

      setBookings(formattedBookings);
      setFilteredBookings(formattedBookings);
    } catch (error: any) {
      console.error('Error loading bookings:', error);
      toast.error(t({ ar: 'خطأ في تحميل الطلبات', en: 'Error loading bookings' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    filterBookings(query, statusFilter, paymentFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    filterBookings(searchQuery, status, paymentFilter);
  };

  const handlePaymentFilter = (payment: string) => {
    setPaymentFilter(payment);
    filterBookings(searchQuery, statusFilter, payment);
  };

  const filterBookings = (query: string, status: string, payment: string) => {
    let filtered = bookings;

    if (query.trim() !== '') {
      filtered = filtered.filter(booking =>
        booking.booking_number.toString().includes(query) ||
        booking.customer_name?.toLowerCase().includes(query.toLowerCase()) ||
        booking.hotel_name?.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (status !== 'all') {
      filtered = filtered.filter(booking => booking.status === status);
    }

    if (payment !== 'all') {
      filtered = filtered.filter(booking => booking.payment_status === payment);
    }

    setFilteredBookings(filtered);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500',
      confirmed: 'bg-green-500',
      cancelled: 'bg-red-500',
      completed: 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-orange-500',
      partial: 'bg-yellow-500',
      paid: 'bg-green-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const exportToCSV = () => {
    const headers = ['رقم الطلب', 'العميل', 'الفندق', 'تاريخ الدخول', 'تاريخ الخروج', 'الضيوف', 'الغرف', 'المبلغ الإجمالي', 'المدفوع', 'الحالة', 'حالة الدفع'];
    const csvContent = [
      headers.join(','),
      ...filteredBookings.map(b => 
        [
          b.booking_number,
          b.customer_name || '',
          b.hotel_name || '',
          b.check_in,
          b.check_out,
          b.guests,
          b.rooms,
          b.total_amount,
          b.amount_paid,
          b.status,
          b.payment_status
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `bookings_${new Date().toISOString()}.csv`;
    link.click();
  };

  const calculateStats = () => {
    return {
      total: filteredBookings.length,
      revenue: filteredBookings.reduce((sum, b) => sum + Number(b.total_amount), 0),
      paid: filteredBookings.reduce((sum, b) => sum + Number(b.amount_paid), 0),
      pending: filteredBookings.reduce((sum, b) => sum + (Number(b.total_amount) - Number(b.amount_paid)), 0)
    };
  };

  const stats = calculateStats();

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
                {t({ ar: 'إدارة الطلبات', en: 'Manage Bookings' })}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t({ ar: 'إدارة طلبات الحسابات الخاصة', en: 'Manage private bookings' })}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <FileDown className="h-4 w-4" />
              {t({ ar: 'تصدير', en: 'Export' })}
            </Button>
            <Button onClick={() => navigate('/private-accounting/bookings/new')} className="gap-2">
              <Plus className="h-4 w-4" />
              {t({ ar: 'إضافة طلب', en: 'Add Booking' })}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t({ ar: 'إجمالي الطلبات', en: 'Total Bookings' })}</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t({ ar: 'الإيرادات', en: 'Revenue' })}</p>
                <p className="text-2xl font-bold">{stats.revenue.toLocaleString()} {t({ ar: 'ر.س', en: 'SAR' })}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t({ ar: 'المدفوع', en: 'Paid' })}</p>
                <p className="text-2xl font-bold">{stats.paid.toLocaleString()} {t({ ar: 'ر.س', en: 'SAR' })}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t({ ar: 'المتبقي', en: 'Pending' })}</p>
                <p className="text-2xl font-bold">{stats.pending.toLocaleString()} {t({ ar: 'ر.س', en: 'SAR' })}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t({ ar: 'ابحث عن طلب...', en: 'Search for a booking...' })}
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t({ ar: 'حالة الطلب', en: 'Booking Status' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t({ ar: 'الكل', en: 'All' })}</SelectItem>
              <SelectItem value="new">{t({ ar: 'جديد', en: 'New' })}</SelectItem>
              <SelectItem value="confirmed">{t({ ar: 'مؤكد', en: 'Confirmed' })}</SelectItem>
              <SelectItem value="cancelled">{t({ ar: 'ملغي', en: 'Cancelled' })}</SelectItem>
              <SelectItem value="completed">{t({ ar: 'مكتمل', en: 'Completed' })}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={paymentFilter} onValueChange={handlePaymentFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t({ ar: 'حالة الدفع', en: 'Payment Status' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t({ ar: 'الكل', en: 'All' })}</SelectItem>
              <SelectItem value="pending">{t({ ar: 'معلق', en: 'Pending' })}</SelectItem>
              <SelectItem value="partial">{t({ ar: 'جزئي', en: 'Partial' })}</SelectItem>
              <SelectItem value="paid">{t({ ar: 'مدفوع', en: 'Paid' })}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings Grid */}
        <div className="grid gap-4">
          {filteredBookings.map(booking => (
            <Card key={booking.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">#{booking.booking_number}</h3>
                    <Badge className={getStatusColor(booking.status)}>
                      {t({ ar: booking.status === 'new' ? 'جديد' : booking.status === 'confirmed' ? 'مؤكد' : booking.status === 'cancelled' ? 'ملغي' : 'مكتمل', en: booking.status })}
                    </Badge>
                    <Badge className={getPaymentStatusColor(booking.payment_status)}>
                      {t({ ar: booking.payment_status === 'pending' ? 'معلق' : booking.payment_status === 'partial' ? 'جزئي' : 'مدفوع', en: booking.payment_status })}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <p><span className="font-medium">{t({ ar: 'العميل:', en: 'Customer:' })}</span> {booking.customer_name}</p>
                    <p><span className="font-medium">{t({ ar: 'الفندق:', en: 'Hotel:' })}</span> {booking.hotel_name}</p>
                    <p><span className="font-medium">{t({ ar: 'الدخول:', en: 'Check-in:' })}</span> {new Date(booking.check_in).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                    <p><span className="font-medium">{t({ ar: 'الخروج:', en: 'Check-out:' })}</span> {new Date(booking.check_out).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US')}</p>
                    <p><span className="font-medium">{t({ ar: 'الضيوف:', en: 'Guests:' })}</span> {booking.guests}</p>
                    <p><span className="font-medium">{t({ ar: 'الغرف:', en: 'Rooms:' })}</span> {booking.rooms}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t({ ar: 'الإجمالي', en: 'Total' })}</p>
                    <p className="text-xl font-bold text-primary">{booking.total_amount.toLocaleString()} {t({ ar: 'ر.س', en: 'SAR' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t({ ar: 'المدفوع', en: 'Paid' })}</p>
                    <p className="text-lg font-semibold">{booking.amount_paid.toLocaleString()} {t({ ar: 'ر.س', en: 'SAR' })}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/private-accounting/bookings/${booking.id}`)}
                  >
                    {t({ ar: 'عرض التفاصيل', en: 'View Details' })}
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {filteredBookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {t({ ar: 'لا يوجد طلبات', en: 'No bookings found' })}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
