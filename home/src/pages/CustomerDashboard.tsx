import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Home, FileText, User, Download } from "lucide-react";
import { downloadBookingPDF } from "@/utils/pdfGenerator";
import { generateCustomerPageUrl, validateCustomerAccess } from "@/utils/customerLinks";
import { logAuditEvent } from "@/utils/auditLogger";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Booking {
  id: string;
  check_in: string;
  check_out: string;
  guests: number;
  rooms: number;
  total_amount: number;
  status: string;
  payment_status: 'paid' | 'partially_paid' | 'unpaid';
  amount_paid: number;
  payment_method: string;
  guest_name?: string;
  hotel_confirmation_number?: string;
  booking_number?: number;
  discount_amount?: number;
  manual_total?: number;
  notes?: string;
  user_id: string;
  meal_plan_name_ar?: string;
  meal_plan_name_en?: string;
  meal_plan_price?: number;
  meal_plan_max_persons?: number;
  meal_plan_extra_price?: number;
  extra_meals?: number;
  hotels: {
    name_ar: string;
    name_en: string;
    location: string;
    location_url?: string;
    price_per_night: number;
    max_guests_per_room: number;
    tax_percentage: number;
    room_type?: 'hotel_rooms' | 'owner_rooms';
  };
  profiles?: {
    full_name: string;
    phone: string;
  };
}

export default function CustomerDashboard() {
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile'>('bookings');

  useEffect(() => {
    const checkAccess = async () => {
      // Check if accessing via permanent link
      const requestedUserId = searchParams.get('uid');
      
      if (requestedUserId) {
        const hasAccess = await validateCustomerAccess(requestedUserId);
        if (!hasAccess) {
          navigate('/auth');
          return;
        }
        fetchBookings(requestedUserId);
      } else if (!loading && !user) {
        navigate('/auth');
      } else if (user) {
        fetchBookings(user.id);
      }
    };
    
    checkAccess();
  }, [user, loading, navigate, searchParams]);

  const fetchBookings = async (userId: string) => {
    const { data } = await supabase
      .from('bookings')
      .select('*, hotels(name_ar, name_en, location, location_url, price_per_night, max_guests_per_room, tax_percentage, room_type), profiles(full_name, phone)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) setBookings(data as Booking[]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#007dff';
      case 'pending':
        return '#ffbf00';
      case 'confirmed':
        return '#40f086';
      case 'cancelled':
        return '#e71963';
      case 'rejected':
        return '#dc2626';
      default:
        return '#6b7280';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#40f086';
      case 'partially_paid':
        return '#67606a';
      case 'unpaid':
        return '#000000';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: { ar: string; en: string } } = {
      'new': { ar: 'جديد', en: 'New' },
      'confirmed': { ar: 'مؤكد', en: 'Confirmed' },
      'pending': { ar: 'قيد المعالجة', en: 'Pending' },
      'cancelled': { ar: 'ملغي', en: 'Cancelled' },
      'rejected': { ar: 'مرفوض', en: 'Rejected' },
    };
    return statusMap[status] || { ar: status, en: status };
  };

  const getPaymentStatusText = (status: string) => {
    const statusMap: { [key: string]: { ar: string; en: string } } = {
      'paid': { ar: 'مدفوع', en: 'Paid' },
      'partially_paid': { ar: 'مدفوع جزئياً', en: 'Partially Paid' },
      'unpaid': { ar: 'غير مدفوع', en: 'Unpaid' },
    };
    return statusMap[status] || { ar: status, en: status };
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4 pt-28">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="w-4 h-4 mr-2" />
            {t({ ar: "الرئيسية", en: "Home", fr: "Accueil", es: "Inicio", ru: "Главная", id: "Beranda", ms: "Laman Utama" })}
          </Button>
          <h1 className="text-3xl font-bold text-gradient-luxury">{t({ ar: "لوحة التحكم", en: "Dashboard", fr: "Tableau de bord", es: "Panel", ru: "Панель", id: "Dasbor", ms: "Papan Pemuka" })}</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Button 
            variant={activeTab === 'bookings' ? 'default' : 'outline'}
            onClick={() => setActiveTab('bookings')}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            {t({ ar: "حجوزاتي", en: "My Bookings", fr: "Mes réservations", es: "Mis reservas", ru: "Мои бронирования", id: "Pemesanan Saya", ms: "Tempahan Saya" })}
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/profile')}
            className="gap-2"
          >
            <User className="w-4 h-4" />
            {t({ ar: "الملف الشخصي", en: "Profile", fr: "Profil", es: "Perfil", ru: "Профиль", id: "Profil", ms: "Profil" })}
          </Button>
        </div>

        {activeTab === 'bookings' ? (
          bookings.length === 0 ? (
            <Card className="card-luxury">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">{t({ ar: "لا توجد حجوزات حتى الآن", en: "No bookings yet", fr: "Aucune réservation pour le moment", es: "Aún no hay reservas", ru: "Пока нет бронирований", id: "Belum ada pemesanan", ms: "Tiada tempahan lagi" })}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <Card key={booking.id} className="card-luxury w-full max-w-full">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                      <CardTitle className="text-lg sm:text-xl md:text-2xl w-full sm:flex-1">
                        {language === 'ar' ? booking.hotels?.name_ar : booking.hotels?.name_en}
                      </CardTitle>
                      <div className="flex gap-2 flex-wrap items-center w-full sm:w-auto">
                        <Badge className="text-white px-4 py-2 min-w-[120px] justify-center text-sm rounded-sm flex-1 sm:flex-initial" style={{ backgroundColor: getStatusColor(booking.status) }}>
                          {language === 'ar' ? getStatusText(booking.status).ar : getStatusText(booking.status).en}
                        </Badge>
                        <Badge className="text-white px-4 py-2 min-w-[120px] justify-center text-sm rounded-sm flex-1 sm:flex-initial" style={{ backgroundColor: getPaymentStatusColor(booking.payment_status) }}>
                          {language === 'ar' ? getPaymentStatusText(booking.payment_status).ar : getPaymentStatusText(booking.payment_status).en}
                        </Badge>
                      </div>
                    </div>
                    {booking.hotel_confirmation_number && (
                      <div className="mt-3">
                        <div className="inline-block w-full sm:w-auto px-4 py-2 bg-white border-2 border-purple-600 rounded-md">
                          <span className="text-sm font-semibold text-black">
                            {t({ ar: "رقم حجز الفندق:", en: "Hotel Booking#:" })} {booking.hotel_confirmation_number}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground text-sm sm:text-base whitespace-nowrap">{t({ ar: "تاريخ الوصول:", en: "Check-in:", fr: "Arrivée:", es: "Entrada:", ru: "Заезд:", id: "Check-in:", ms: "Daftar masuk:" })}</span>
                          <span className="font-semibold text-sm sm:text-base">{format(new Date(booking.check_in), 'yyyy-MM-dd')}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground text-sm sm:text-base whitespace-nowrap">{t({ ar: "تاريخ المغادرة:", en: "Check-out:", fr: "Départ:", es: "Salida:", ru: "Выезд:", id: "Check-out:", ms: "Daftar keluar:" })}</span>
                          <span className="font-semibold text-sm sm:text-base">{format(new Date(booking.check_out), 'yyyy-MM-dd')}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground text-sm sm:text-base whitespace-nowrap">{t({ ar: "عدد النزلاء:", en: "Guests:", fr: "Invités:", es: "Huéspedes:", ru: "Гости:", id: "Tamu:", ms: "Tetamu:" })}</span>
                          <span className="font-semibold text-sm sm:text-base">{booking.guests}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-muted-foreground text-sm sm:text-base whitespace-nowrap">{t({ ar: "عدد الغرف:", en: "Rooms:" })}</span>
                          <span className="font-semibold text-sm sm:text-base">{booking.rooms}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Guests Section */}
                    {(() => {
                      const maxGuestsPerRoom = booking.hotels?.max_guests_per_room || 2;
                      const totalMaxGuests = maxGuestsPerRoom * booking.rooms;
                      const extraGuests = Math.max(0, booking.guests - totalMaxGuests);
                      
                      return extraGuests > 0 && (
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground font-semibold text-sm sm:text-base whitespace-nowrap">{t({ ar: "عدد الأشخاص:", en: "Number of Persons:" })}</span>
                            <span className="font-medium text-sm sm:text-base">{booking.guests} {t({ ar: "أشخاص", en: "persons" })}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-2">
                            <span className="text-muted-foreground text-sm whitespace-nowrap">{t({ ar: "أشخاص إضافيين:", en: "Extra Guests:" })}</span>
                            <span className="font-medium text-sm">+{extraGuests} {t({ ar: "أشخاص", en: "persons" })}</span>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Meal Plan Section */}
                    {booking.meal_plan_name_ar && (
                      <div className="pt-4 border-t">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-muted-foreground font-semibold text-sm sm:text-base whitespace-nowrap">{t({ ar: "الوجبات:", en: "Meals:" })}</span>
                              <span className="font-medium text-sm sm:text-base text-right">{language === 'ar' ? booking.meal_plan_name_ar : booking.meal_plan_name_en}</span>
                            </div>
{(booking.meal_plan_price ?? 0) > 0 && (
  <div className="flex items-center justify-between gap-2 text-sm">
    <span className="text-muted-foreground whitespace-nowrap">{t({ ar: "مدفوعة", en: "Paid" })}</span>
    <span className="font-medium">+{booking.meal_plan_price} {t({ ar: "ر.س", en: "SAR" })}</span>
  </div>
)}
                          </div>
                          <div className="space-y-2">
                            {(() => {
                              const includedPersons = (booking.meal_plan_max_persons || 0) * booking.rooms;
                              const extraMealsRequired = Math.max(0, booking.guests - includedPersons);
                              return (
                                <>
{(booking.meal_plan_max_persons ?? 0) > 0 && (
  <div className="flex items-center justify-between gap-2 text-sm">
    <span className="text-muted-foreground whitespace-nowrap">{t({ ar: "عدد الأشخاص:", en: "Persons:" })}</span>
    <span className="font-medium">{includedPersons} {t({ ar: "أشخاص", en: "persons" })}</span>
  </div>
)}
                                  {((booking.extra_meals && booking.extra_meals > 0) || extraMealsRequired > 0) && (
                                    <div className="flex items-center justify-between gap-2 text-sm">
                                      <span className="text-muted-foreground whitespace-nowrap">{t({ ar: "وجبات إضافية:", en: "Extra Meals:" })}</span>
                                      <span className="font-medium">+{booking.extra_meals && booking.extra_meals > 0 ? booking.extra_meals : extraMealsRequired}</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between gap-2 pt-4 border-t">
                      <span className="text-muted-foreground font-semibold text-base sm:text-lg whitespace-nowrap">{t({ ar: "المبلغ الإجمالي:", en: "Total Amount:" })}</span>
                      <span className="font-bold text-xl sm:text-2xl text-primary">{booking.total_amount} {t({ ar: "ر.س", en: "SAR" })}</span>
                    </div>
                    
                    <div className="mt-6">
                      <Button
                        size="default"
                        className="w-full sm:w-auto sm:min-w-[200px]"
                        onClick={() => {
                          const customerPageUrl = generateCustomerPageUrl(booking.user_id);
                          const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24));
                          const taxRate = booking.hotels?.tax_percentage || 0;
                          
                          // Calculate amounts correctly
                          // total_amount already includes tax, so we need to reverse calculate
                          const totalAfterDiscount = (booking.manual_total || booking.total_amount) - (booking.discount_amount || 0);
                          const subtotalBeforeTax = taxRate > 0 ? totalAfterDiscount / (1 + taxRate / 100) : totalAfterDiscount;
                          const vatAmount = totalAfterDiscount - subtotalBeforeTax;
                          
                          downloadBookingPDF({
                            bookingNumber: booking.booking_number || 0,
                            hotelConfirmationNumber: booking.hotel_confirmation_number,
                            guestName: booking.guest_name || booking.profiles?.full_name || '',
                            clientName: booking.profiles?.full_name || '',
                            clientEmail: user?.email || '',
                            clientPhone: booking.profiles?.phone || '',
                            hotelNameEn: booking.hotels?.name_en || '',
                            hotelNameAr: booking.hotels?.name_ar || '',
                            hotelLocation: booking.hotels?.location || '',
                            hotelLocationUrl: booking.hotels?.location_url,
                            checkIn: new Date(booking.check_in),
                            checkOut: new Date(booking.check_out),
                            nights,
                            rooms: booking.rooms,
                            guests: booking.guests,
                            baseGuests: (booking.hotels?.max_guests_per_room || 2) * booking.rooms,
                            extraGuests: Math.max(0, booking.guests - ((booking.hotels?.max_guests_per_room || 2) * booking.rooms)),
                            roomType: booking.hotels?.room_type === 'owner_rooms' ? 'Owner Room' : 'Hotel Room',
                            pricePerNight: booking.hotels?.price_per_night || 0,
                            subtotal: subtotalBeforeTax,
                            extraGuestCharge: 0,
                            discountAmount: booking.discount_amount,
                            netAmount: subtotalBeforeTax - (booking.discount_amount || 0),
                            vatAmount,
                            totalAmount: booking.total_amount,
                            paymentMethod: booking.payment_method || '',
                            notes: booking.notes,
                            customerPageUrl,
                          });
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t({ ar: "تحميل PDF", en: "Download PDF", fr: "Télécharger PDF", es: "Descargar PDF", ru: "Скачать PDF", id: "Unduh PDF", ms: "Muat turun PDF" })}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card className="card-luxury">
            <CardHeader>
              <CardTitle>{t({ ar: "معلوماتي الشخصية", en: "Personal Information", fr: "Informations personnelles", es: "Información personal", ru: "Личная информация", id: "Informasi Pribadi", ms: "Maklumat Peribadi" })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t({ ar: "البريد الإلكتروني", en: "Email", fr: "E-mail", es: "Correo electrónico", ru: "Электронная почта", id: "Email", ms: "E-mel" })}</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <Button onClick={() => navigate('/reset-password')} className="w-full btn-luxury">
                {t({ ar: "تغيير كلمة المرور", en: "Change Password", fr: "Changer le mot de passe", es: "Cambiar contraseña", ru: "Изменить пароль", id: "Ubah Kata Sandi", ms: "Tukar Kata Laluan" })}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
