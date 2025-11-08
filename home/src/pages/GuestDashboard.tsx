import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Home, Download } from "lucide-react";
import { downloadBookingPDF } from "@/utils/pdfGenerator";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GuestOTPVerification } from "@/components/GuestOTPVerification";
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
  guest_phone?: string;
  hotel_confirmation_number?: string;
  booking_number?: number;
  discount_amount?: number;
  manual_total?: number;
  notes?: string;
  user_id: string | null;
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
}

export default function GuestDashboard() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);

  const fetchGuestBookings = async (phone: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_guest_bookings', { p_phone: phone });
      if (error) throw error;

      const mapped = (data || []).map((row: any) => ({
        id: row.id,
        check_in: row.check_in,
        check_out: row.check_out,
        guests: row.guests,
        rooms: row.rooms,
        total_amount: row.total_amount,
        status: row.status,
        payment_status: row.payment_status,
        amount_paid: row.amount_paid,
        payment_method: row.payment_method,
        guest_name: row.guest_name,
        guest_phone: row.guest_phone,
        hotel_confirmation_number: row.hotel_confirmation_number,
        booking_number: row.booking_number,
        discount_amount: row.discount_amount,
        manual_total: row.manual_total,
        notes: row.notes,
        user_id: row.user_id,
        hotels: {
          name_ar: row.hotel_name_ar,
          name_en: row.hotel_name_en,
          location: row.hotel_location,
          location_url: row.hotel_location_url,
          price_per_night: row.hotel_price_per_night,
          max_guests_per_room: row.hotel_max_guests_per_room,
          tax_percentage: row.hotel_tax_percentage,
          room_type: row.hotel_room_type,
        },
      }));

      setBookings(mapped as Booking[]);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = (phone: string) => {
    setVerifiedPhone(phone);
    fetchGuestBookings(phone);
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {!verifiedPhone ? (
          <GuestOTPVerification onVerified={handleVerified} />
        ) : loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8">
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="w-4 h-4 mr-2" />
                {t({ ar: "الرئيسية", en: "Home" })}
              </Button>
              <h1 className="text-3xl font-bold">
                {t({ ar: "حجوزاتي", en: "My Bookings" })}
              </h1>
            </div>

            {bookings.length === 0 ? (
              <Card className="card-luxury">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {t({ ar: "لا توجد حجوزات", en: "No bookings found" })}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="card-luxury">
                    <CardHeader>
                      <div className="flex justify-between items-start flex-wrap gap-3">
                        <CardTitle className="text-lg sm:text-xl flex-1 min-w-0">
                          {language === 'ar' ? booking.hotels?.name_ar : booking.hotels?.name_en}
                        </CardTitle>
                        <div className="flex gap-2 flex-wrap items-center">
                          <Badge 
                            className="text-white px-3 py-1.5 min-w-[100px] justify-center text-xs sm:text-sm rounded-sm" 
                            style={{ backgroundColor: getStatusColor(booking.status) }}
                          >
                            {language === 'ar' ? getStatusText(booking.status).ar : getStatusText(booking.status).en}
                          </Badge>
                          <Badge 
                            className="text-white px-3 py-1.5 min-w-[100px] justify-center text-xs sm:text-sm rounded-sm" 
                            style={{ backgroundColor: getPaymentStatusColor(booking.payment_status) }}
                          >
                            {language === 'ar' ? getPaymentStatusText(booking.payment_status).ar : getPaymentStatusText(booking.payment_status).en}
                          </Badge>
                        </div>
                      </div>
                      {booking.booking_number && (
                        <div className="mt-2">
                          <span className="text-sm text-muted-foreground">
                            {t({ ar: "رقم الحجز:", en: "Booking #:" })} {booking.booking_number}
                          </span>
                        </div>
                      )}
                      {booking.hotel_confirmation_number && (
                        <div className="mt-2">
                          <div className="inline-block px-3 py-1.5 bg-white border-2 border-purple-600 rounded-md">
                            <span className="text-xs font-semibold text-black">
                              {t({ ar: "رقم حجز الفندق:", en: "Hotel Booking#:" })} {booking.hotel_confirmation_number}
                            </span>
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t({ ar: "تاريخ الوصول:", en: "Check-in:" })}</span>
                          <span className="font-medium">{format(new Date(booking.check_in), 'yyyy-MM-dd')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t({ ar: "تاريخ المغادرة:", en: "Check-out:" })}</span>
                          <span className="font-medium">{format(new Date(booking.check_out), 'yyyy-MM-dd')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t({ ar: "عدد النزلاء:", en: "Guests:" })}</span>
                          <span className="font-medium">{booking.guests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t({ ar: "عدد الغرف:", en: "Rooms:" })}</span>
                          <span className="font-medium">{booking.rooms}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t({ ar: "المبلغ الإجمالي:", en: "Total Amount:" })}</span>
                          <span className="font-medium">{booking.total_amount} {t({ ar: "ر.س", en: "SAR" })}</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24));
                            const taxRate = booking.hotels?.tax_percentage || 0;
                            
                            const totalAfterDiscount = (booking.manual_total || booking.total_amount) - (booking.discount_amount || 0);
                            const subtotalBeforeTax = taxRate > 0 ? totalAfterDiscount / (1 + taxRate / 100) : totalAfterDiscount;
                            const vatAmount = totalAfterDiscount - subtotalBeforeTax;
                            
                            downloadBookingPDF({
                              bookingNumber: booking.booking_number || 0,
                              hotelConfirmationNumber: booking.hotel_confirmation_number,
                              guestName: booking.guest_name || '',
                              clientName: booking.guest_name || '',
                              clientEmail: '',
                              clientPhone: booking.guest_phone || '',
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
                              customerPageUrl: `${window.location.origin}/guest-dashboard`,
                            });
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t({ ar: "تحميل PDF", en: "Download PDF" })}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
