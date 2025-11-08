import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Calendar as CalendarIcon, Users, Hotel, Mail, MessageCircle, Edit, Share2, FileText, Download } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import { downloadBookingPDF, sharePDFViaEmail, sharePDFViaWhatsApp } from "@/utils/pdfGenerator";
import { generateCustomerPageUrl } from "@/utils/customerLinks";
import { logAuditEvent } from "@/utils/auditLogger";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { calculateSeasonalPrice } from "@/utils/seasonalPricing";

interface Booking {
  id: string;
  user_id: string;
  hotel_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  rooms: number;
  total_amount: number;
  status: 'new' | 'pending' | 'confirmed' | 'cancelled' | 'rejected';
  payment_status: 'paid' | 'partially_paid' | 'unpaid';
  amount_paid: number;
  payment_method: string;
  notes: string | null;
  guest_name?: string;
  hotel_confirmation_number?: string;
  booking_number?: number;
  created_at: string;
  discount_amount?: number;
  manual_total?: number;
  meal_plan_name_ar?: string;
  meal_plan_name_en?: string;
  meal_plan_price?: number;
  meal_plan_max_persons?: number;
  extra_meals?: number;
  profiles?: {
    full_name: string;
    phone: string;
  };
  hotels?: {
    name_ar: string;
    name_en: string;
    location: string;
    location_url?: string;
    price_per_night: number;
    max_guests_per_room: number;
    extra_guest_price: number;
    tax_percentage: number;
    room_type?: 'hotel_rooms' | 'owner_rooms';
  };
}

interface BookingManagementProps {
  bookings: Booking[];
  onUpdate: () => void;
}

export function BookingManagement({ bookings, onUpdate }: BookingManagementProps) {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [highlightColors, setHighlightColors] = useState<{ owner: string; hotel: string | null }>({ owner: '#e0f2fe', hotel: null });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [hotelConfNumber, setHotelConfNumber] = useState<string>("");
  const [showConfNumberInput, setShowConfNumberInput] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [rows, setRows] = useState<Booking[]>([]);
  useEffect(() => { setRows(bookings); }, [bookings]);
  const [editFormData, setEditFormData] = useState({
    check_in: "",
    check_out: "",
    guests: "",
    rooms: "",
    notes: "",
    total_amount: "",
    discount_amount: "",
    manual_total: "",
    amount_paid: "",
    room_type: "hotel_rooms" as 'hotel_rooms' | 'owner_rooms',
    meal_plan_name_ar: "",
    meal_plan_name_en: "",
    meal_plan_price: "",
    meal_plan_max_persons: "",
    meal_plan_extra_price: "",
    extra_meals: "",
  });

  const handleDayClick = async (day: Date) => {
    // 1st click: start, 2nd: end, 3rd: restart from clicked day
    if (!dateRange?.from || (dateRange?.from && dateRange?.to)) {
      setDateRange({ from: day, to: undefined });
      setEditFormData({
        ...editFormData,
        check_in: format(day, 'yyyy-MM-dd'),
        check_out: ""
      });
      return;
    }

    if (day < dateRange.from || day.getTime() === dateRange.from.getTime()) {
      setDateRange({ from: day, to: undefined });
      setEditFormData({
        ...editFormData,
        check_in: format(day, 'yyyy-MM-dd'),
        check_out: ""
      });
    } else {
      setDateRange({ from: dateRange.from, to: day });
      const newTotal = selectedBooking ? await calculateTotal(
        format(dateRange.from, 'yyyy-MM-dd'),
        format(day, 'yyyy-MM-dd'),
        parseInt(editFormData.guests || '0'),
        parseInt(editFormData.rooms || '0'),
        selectedBooking.hotels
      ) : 0;
      setEditFormData({
        ...editFormData,
        check_in: format(dateRange.from, 'yyyy-MM-dd'),
        check_out: format(day, 'yyyy-MM-dd'),
        manual_total: newTotal.toString(),
        total_amount: newTotal.toString()
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return '#007dff';
      case 'pending': return '#ffbf00';
      case 'confirmed': return '#40f086';
      case 'cancelled': return '#e71963';
      case 'rejected': return '#dc2626'; // red-700
      default: return '#000000';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'paid': return '#40f086';
      case 'partially_paid': return '#67606a';
      case 'unpaid': return '#000000';
      default: return '#000000';
    }
  };

  const statusColors = {
    new: "text-white",
    pending: "text-white",
    confirmed: "text-white",
    cancelled: "text-white",
    rejected: "bg-red-700 text-white",
  };

  const paymentStatusColors = {
    paid: "text-white",
    partially_paid: "text-white",
    unpaid: "text-white",
  };

  const statusLabels = {
    new: { ar: "جديد", en: "New" },
    pending: { ar: "قيد الانتظار", en: "Pending" },
    confirmed: { ar: "مؤكد", en: "Confirmed" },
    cancelled: { ar: "ملغى", en: "Cancelled" },
    rejected: { ar: "مرفوض", en: "Rejected" },
  };

  const paymentStatusLabels = {
    paid: { ar: "مدفوع", en: "Paid" },
    partially_paid: { ar: "مدفوع جزئيًا", en: "Partially Paid" },
    unpaid: { ar: "غير مدفوع", en: "Unpaid" },
  };

  const calculateTotal = async (checkIn: string, checkOut: string, guests: number, rooms: number, hotel: Booking['hotels']) => {
    if (!hotel) return 0;
    
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const nights = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) return 0;
    
    // Get tax rate (0 means no tax)
    const taxRate = (hotel.tax_percentage && hotel.tax_percentage > 0) ? hotel.tax_percentage : 0;
    
    // Calculate seasonal price
    const avgPricePerNight = await calculateSeasonalPrice(
      selectedBooking!.hotel_id,
      startDate,
      endDate,
      hotel.price_per_night
    );
    
    // Calculate base room price using seasonal pricing
    let subtotal = nights * avgPricePerNight * rooms;
    
    // Calculate extra guests charge
    const maxGuestsIncluded = (hotel.max_guests_per_room || 2) * rooms;
    if (guests > maxGuestsIncluded) {
      const extraGuests = guests - maxGuestsIncluded;
      subtotal += extraGuests * (hotel.extra_guest_price || 0) * nights;
    }
    
    // Add tax
    const tax = taxRate > 0 ? (subtotal * taxRate / 100) : 0;
    return subtotal + tax;
  };

  const handleStatusChange = async (bookingId: string, newStatus: 'new' | 'pending' | 'confirmed' | 'cancelled' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Log audit event (non-blocking)
      logAuditEvent(
        'update_booking_status',
        'booking',
        bookingId,
        { new_status: newStatus }
      ).catch(() => {}); // Ignore audit logging errors

      // Optimistic update
      setRows(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } as Booking : b));
      // Then refresh from server
      await onUpdate();

      toast({
        title: t({ ar: "تم التحديث", en: "Updated" }),
        description: t({ ar: "تم تحديث حالة الطلب", en: "Booking status updated" }),
      });
    } catch (error: any) {
      console.error('Error updating booking status:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message || t({ ar: "حدث خطأ أثناء التحديث", en: "An error occurred during update" }),
        variant: "destructive",
      });
    }
  };

  const handlePaymentStatusChange = async (bookingId: string, newPaymentStatus: 'paid' | 'partially_paid' | 'unpaid') => {
    try {
      // Get the booking to update amount_paid if status is 'paid'
      const booking = bookings.find(b => b.id === bookingId);
      const updateData: any = { payment_status: newPaymentStatus };
      
      // If status is 'paid', set amount_paid to total_amount
      if (newPaymentStatus === 'paid' && booking) {
        updateData.amount_paid = booking.total_amount;
      }
      
      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId);

      if (error) throw error;

      // Log audit event (non-blocking)
      logAuditEvent(
        'update_payment_status',
        'booking',
        bookingId,
        { 
          new_payment_status: newPaymentStatus,
          amount_paid: updateData.amount_paid
        }
      ).catch(() => {}); // Ignore audit logging errors

      // Optimistic update
      setRows(prev => prev.map(b => b.id === bookingId ? { ...b, payment_status: newPaymentStatus, amount_paid: updateData.amount_paid ?? b.amount_paid } as Booking : b));
      // Then refresh from server
      await onUpdate();

      toast({
        title: t({ ar: "تم التحديث", en: "Updated" }),
        description: t({ ar: "تم تحديث حالة الدفع", en: "Payment status updated" }),
      });
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message || t({ ar: "حدث خطأ أثناء التحديث", en: "An error occurred during update" }),
        variant: "destructive",
      });
    }
  };

  const openEditDialog = async (booking: Booking) => {
    setSelectedBooking(booking);
    const calculatedTotal = await calculateTotal(booking.check_in, booking.check_out, booking.guests, booking.rooms, booking.hotels);
    setEditFormData({
      check_in: booking.check_in,
      check_out: booking.check_out,
      guests: booking.guests.toString(),
      rooms: booking.rooms.toString(),
      notes: booking.notes || "",
      total_amount: (booking.manual_total || calculatedTotal).toString(),
      discount_amount: (booking.discount_amount || 0).toString(),
      manual_total: (booking.manual_total || calculatedTotal).toString(),
      amount_paid: (booking.amount_paid || 0).toString(),
      room_type: booking.hotels?.room_type || 'hotel_rooms',
      meal_plan_name_ar: (booking as any).meal_plan_name_ar || "",
      meal_plan_name_en: (booking as any).meal_plan_name_en || "",
      meal_plan_price: ((booking as any).meal_plan_price || 0).toString(),
      meal_plan_max_persons: ((booking as any).meal_plan_max_persons || 0).toString(),
      meal_plan_extra_price: ((booking as any).meal_plan_extra_price || 0).toString(),
      extra_meals: ((booking as any).extra_meals || 0).toString(),
    });
    setDateRange({
      from: new Date(booking.check_in),
      to: new Date(booking.check_out)
    });
    setIsEditDialogOpen(true);
  };

  const handleEditBooking = async () => {
    if (!selectedBooking) return;

    const startDate = new Date(editFormData.check_in);
    const endDate = new Date(editFormData.check_out);
    
    if (endDate <= startDate) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول", en: "Check-out date must be after check-in date" }),
        variant: "destructive",
      });
      return;
    }

    try {
      const discountAmount = parseFloat(editFormData.discount_amount) || 0;
      const manualTotal = parseFloat(editFormData.manual_total) || 0;
      const amountPaid = parseFloat(editFormData.amount_paid) || 0;
      const finalTotal = manualTotal - discountAmount;

      // Determine payment status based on amount paid
      let paymentStatus: 'paid' | 'partially_paid' | 'unpaid' = 'unpaid';
      if (amountPaid >= finalTotal) {
        paymentStatus = 'paid';
      } else if (amountPaid > 0) {
        paymentStatus = 'partially_paid';
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          check_in: editFormData.check_in,
          check_out: editFormData.check_out,
          guests: parseInt(editFormData.guests),
          rooms: parseInt(editFormData.rooms),
          notes: editFormData.notes || null,
          total_amount: finalTotal,
          discount_amount: discountAmount,
          manual_total: manualTotal,
          amount_paid: amountPaid,
          payment_status: paymentStatus,
          meal_plan_name_ar: editFormData.meal_plan_name_ar || null,
          meal_plan_name_en: editFormData.meal_plan_name_en || null,
          meal_plan_price: parseFloat(editFormData.meal_plan_price) || 0,
          meal_plan_max_persons: parseInt(editFormData.meal_plan_max_persons) || 0,
          meal_plan_extra_price: parseFloat(editFormData.meal_plan_extra_price) || 0,
          extra_meals: parseInt(editFormData.extra_meals) || 0,
        })
        .eq('id', selectedBooking.id);

      if (error) throw error;

      // Log audit event (non-blocking)
      logAuditEvent(
        'update_booking',
        'booking',
        selectedBooking.id,
        { 
          check_in: editFormData.check_in,
          check_out: editFormData.check_out,
          guests: parseInt(editFormData.guests),
          rooms: parseInt(editFormData.rooms),
          total_amount: finalTotal,
          discount_amount: discountAmount,
          amount_paid: amountPaid,
          payment_status: paymentStatus
        }
      ).catch(() => {}); // Ignore audit logging errors

      setIsEditDialogOpen(false);
      setSelectedBooking(null);
      
      // Update immediately then show toast
      await onUpdate();

      toast({
        title: t({ ar: "تم التحديث", en: "Updated" }),
        description: t({ ar: "تم تحديث معلومات الحجز", en: "Booking information updated" }),
      });
    } catch (error: any) {
      console.error('Error updating booking:', error);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: error.message || t({ ar: "حدث خطأ أثناء تحديث الحجز", en: "An error occurred while updating the booking" }),
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .rpc('get_public_site_settings');
      if (data && data.length > 0) {
        setHighlightColors({ owner: data[0]?.owner_room_color || '#87CEEB', hotel: data[0]?.hotel_room_color || null });
      }
    })();
  }, []);

  const shareGeneral = async (booking: Booking) => {
    const hotelName = language === 'ar' ? booking.hotels?.name_ar : booking.hotels?.name_en;
    const statusText = t(statusLabels[booking.status]);
    const paymentStatusText = t(paymentStatusLabels[booking.payment_status]);
    
    let paymentInfo = '';
    if (booking.payment_status === 'partially_paid') {
      const remaining = booking.total_amount - booking.amount_paid;
      paymentInfo = `\n${t({ ar: "المبلغ المدفوع:", en: "Amount Paid:" })} ${booking.amount_paid} ${t({ ar: "ر.س", en: "SAR" })}\n${t({ ar: "المبلغ المتبقي:", en: "Remaining Amount:" })} ${remaining} ${t({ ar: "ر.س", en: "SAR" })}`;
    }
    
    const message = `${t({ ar: "تفاصيل الحجز", en: "Booking Details" })}

${t({ ar: "الفندق:", en: "Hotel:" })} ${hotelName}
${t({ ar: "الموقع:", en: "Location:" })} ${booking.hotels?.location}
${booking.guest_name ? `${t({ ar: "اسم الضيف:", en: "Guest Name:" })} ${booking.guest_name}\n` : ''}${t({ ar: "تاريخ الوصول:", en: "Check-in:" })} ${format(new Date(booking.check_in), "dd/MM/yyyy")}
${t({ ar: "تاريخ المغادرة:", en: "Check-out:" })} ${format(new Date(booking.check_out), "dd/MM/yyyy")}
${t({ ar: "عدد النزلاء:", en: "Guests:" })} ${booking.guests}
${t({ ar: "المبلغ الإجمالي:", en: "Total Amount:" })} ${booking.total_amount} ${t({ ar: "ر.س", en: "SAR" })}
${t({ ar: "الحالة:", en: "Status:" })} ${statusText}
${t({ ar: "حالة الدفع:", en: "Payment Status:" })} ${paymentStatusText}${paymentInfo}
${t({ ar: "طريقة الدفع:", en: "Payment Method:" })} ${booking.payment_method}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: t({ ar: "تفاصيل الحجز", en: "Booking Details" }),
          text: message.trim(),
        });
      } catch (error) {
        console.log('Share cancelled or failed', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(message.trim());
      toast({
        title: t({ ar: "تم النسخ", en: "Copied" }),
        description: t({ ar: "تم نسخ التفاصيل إلى الحافظة", en: "Details copied to clipboard" }),
      });
    }
  };

  const shareViaWhatsApp = (booking: Booking) => {
    const hotelName = language === 'ar' ? booking.hotels?.name_ar : booking.hotels?.name_en;
    const statusText = t(statusLabels[booking.status]);
    const paymentStatusText = t(paymentStatusLabels[booking.payment_status]);
    
    let paymentInfo = '';
    if (booking.payment_status === 'partially_paid') {
      const remaining = booking.total_amount - booking.amount_paid;
      paymentInfo = `\n${t({ ar: "المبلغ المدفوع:", en: "Amount Paid:" })} ${booking.amount_paid} ${t({ ar: "ر.س", en: "SAR" })}\n${t({ ar: "المبلغ المتبقي:", en: "Remaining Amount:" })} ${remaining} ${t({ ar: "ر.س", en: "SAR" })}`;
    }
    
    const message = `
${t({ ar: "تفاصيل الحجز", en: "Booking Details" })}

${t({ ar: "الفندق:", en: "Hotel:" })} ${hotelName}
${t({ ar: "الموقع:", en: "Location:" })} ${booking.hotels?.location}
${booking.guest_name ? `${t({ ar: "اسم الضيف:", en: "Guest Name:" })} ${booking.guest_name}\n` : ''}${t({ ar: "تاريخ الوصول:", en: "Check-in:" })} ${format(new Date(booking.check_in), "dd/MM/yyyy")}
${t({ ar: "تاريخ المغادرة:", en: "Check-out:" })} ${format(new Date(booking.check_out), "dd/MM/yyyy")}
${t({ ar: "عدد النزلاء:", en: "Guests:" })} ${booking.guests}
${t({ ar: "المبلغ الإجمالي:", en: "Total Amount:" })} ${booking.total_amount} ${t({ ar: "ر.س", en: "SAR" })}
${t({ ar: "الحالة:", en: "Status:" })} ${statusText}
${t({ ar: "حالة الدفع:", en: "Payment Status:" })} ${paymentStatusText}${paymentInfo}
${t({ ar: "طريقة الدفع:", en: "Payment Method:" })} ${booking.payment_method}
`;

    const encodedMessage = encodeURIComponent(message.trim());
    const phoneNumber = booking.profiles?.phone || "";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = (booking: Booking) => {
    const hotelName = language === 'ar' ? booking.hotels?.name_ar : booking.hotels?.name_en;
    const statusText = t(statusLabels[booking.status]);
    const paymentStatusText = t(paymentStatusLabels[booking.payment_status]);
    const subject = t({ ar: "تفاصيل حجز الفندق", en: "Hotel Booking Details" });
    
    let paymentInfo = '';
    if (booking.payment_status === 'partially_paid') {
      const remaining = booking.total_amount - booking.amount_paid;
      paymentInfo = `\n${t({ ar: "المبلغ المدفوع:", en: "Amount Paid:" })} ${booking.amount_paid} ${t({ ar: "ر.س", en: "SAR" })}\n${t({ ar: "المبلغ المتبقي:", en: "Remaining Amount:" })} ${remaining} ${t({ ar: "ر.س", en: "SAR" })}`;
    }
    
    const body = `
${t({ ar: "تفاصيل الحجز", en: "Booking Details" })}

${t({ ar: "الفندق:", en: "Hotel:" })} ${hotelName}
${t({ ar: "الموقع:", en: "Location:" })} ${booking.hotels?.location}
${booking.guest_name ? `${t({ ar: "اسم الضيف:", en: "Guest Name:" })} ${booking.guest_name}\n` : ''}${t({ ar: "تاريخ الوصول:", en: "Check-in:" })} ${format(new Date(booking.check_in), "dd/MM/yyyy")}
${t({ ar: "تاريخ المغادرة:", en: "Check-out:" })} ${format(new Date(booking.check_out), "dd/MM/yyyy")}
${t({ ar: "عدد النزلاء:", en: "Guests:" })} ${booking.guests}
${t({ ar: "المبلغ الإجمالي:", en: "Total Amount:" })} ${booking.total_amount} ${t({ ar: "ر.س", en: "SAR" })}
${t({ ar: "الحالة:", en: "Status:" })} ${statusText}
${t({ ar: "حالة الدفع:", en: "Payment Status:" })} ${paymentStatusText}${paymentInfo}
${t({ ar: "طريقة الدفع:", en: "Payment Method:" })} ${booking.payment_method}

${t({ ar: "اسم العميل:", en: "Customer Name:" })} ${booking.profiles?.full_name}
${t({ ar: "رقم الهاتف:", en: "Phone Number:" })} ${booking.profiles?.phone}
`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.trim())}`;
    window.location.href = mailtoUrl;
  };

  if (bookings.length === 0) {
    return (
      <Card className="card-luxury">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            {t({ ar: "لا توجد طلبات", en: "No bookings" })}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {rows.map((booking) => (
          <Card 
            key={booking.id}
            className="card-luxury w-full max-w-full"
            style={(booking.hotels?.room_type === 'owner_rooms' ? (highlightColors.owner ? { backgroundColor: highlightColors.owner } : undefined) : (highlightColors.hotel ? { backgroundColor: highlightColors.hotel } : undefined))}
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <Hotel className="w-6 h-6 text-primary flex-shrink-0" />
                  <span className="text-lg sm:text-xl md:text-2xl">
                    {language === 'ar' ? booking.hotels?.name_ar : booking.hotels?.name_en}
                  </span>
                </div>
                {/* Mobile: Keep original layout */}
                <div className="flex flex-col md:hidden gap-3 w-full">
                  <Select
                    value={booking.status}
                    onValueChange={(value) => handleStatusChange(booking.id, value as any)}
                  >
                    <SelectTrigger 
                      className={`flex-1 h-10 text-sm sm:text-base ${statusColors[booking.status]}`}
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">{t(statusLabels.new)}</SelectItem>
                      <SelectItem value="pending">{t(statusLabels.pending)}</SelectItem>
                      <SelectItem value="confirmed">{t(statusLabels.confirmed)}</SelectItem>
                      <SelectItem value="cancelled">{t(statusLabels.cancelled)}</SelectItem>
                      <SelectItem value="rejected">{t(statusLabels.rejected)}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={booking.payment_status}
                    onValueChange={(value) => handlePaymentStatusChange(booking.id, value as any)}
                  >
                    <SelectTrigger 
                      className={`flex-1 h-10 text-sm sm:text-base ${paymentStatusColors[booking.payment_status]}`}
                      style={{ backgroundColor: getPaymentStatusColor(booking.payment_status) }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">{t(paymentStatusLabels.paid)}</SelectItem>
                      <SelectItem value="partially_paid">{t(paymentStatusLabels.partially_paid)}</SelectItem>
                      <SelectItem value="unpaid">{t(paymentStatusLabels.unpaid)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Desktop & Tablet: Smaller, side by side, aligned to left */}
                <div className="hidden md:flex gap-3 justify-start items-center">
                  <Select
                    value={booking.status}
                    onValueChange={(value) => handleStatusChange(booking.id, value as any)}
                  >
                    <SelectTrigger 
                      className={`w-[25%] min-w-[120px] h-10 text-sm ${statusColors[booking.status]}`}
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">{t(statusLabels.new)}</SelectItem>
                      <SelectItem value="pending">{t(statusLabels.pending)}</SelectItem>
                      <SelectItem value="confirmed">{t(statusLabels.confirmed)}</SelectItem>
                      <SelectItem value="cancelled">{t(statusLabels.cancelled)}</SelectItem>
                      <SelectItem value="rejected">{t(statusLabels.rejected)}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={booking.payment_status}
                    onValueChange={(value) => handlePaymentStatusChange(booking.id, value as any)}
                  >
                    <SelectTrigger 
                      className={`w-[25%] min-w-[120px] h-10 text-sm ${paymentStatusColors[booking.payment_status]}`}
                      style={{ backgroundColor: getPaymentStatusColor(booking.payment_status) }}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">{t(paymentStatusLabels.paid)}</SelectItem>
                      <SelectItem value="partially_paid">{t(paymentStatusLabels.partially_paid)}</SelectItem>
                      <SelectItem value="unpaid">{t(paymentStatusLabels.unpaid)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold whitespace-nowrap">{t({ ar: "تاريخ الوصول:", en: "Check-in:" })}</span>
                    </div>
                    <span>{format(new Date(booking.check_in), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold whitespace-nowrap">{t({ ar: "تاريخ المغادرة:", en: "Check-out:" })}</span>
                    </div>
                    <span>{format(new Date(booking.check_out), "dd/MM/yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold whitespace-nowrap">{t({ ar: "عدد النزلاء:", en: "Guests:" })}</span>
                    </div>
                    <span>{booking.guests}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="font-semibold whitespace-nowrap">{t({ ar: "عدد الغرف:", en: "Rooms:" })}</span>
                    </div>
                    <span>{booking.rooms}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-base sm:text-lg pt-2 border-t">
                    <span className="font-bold whitespace-nowrap">{t({ ar: "المبلغ الإجمالي:", en: "Total Amount:" })}</span>
                    <span className="text-primary font-bold">{booking.total_amount} {t({ ar: "ر.س", en: "SAR" })}</span>
                  </div>
                  {(booking.payment_status === 'partially_paid' || booking.payment_status === 'paid') && (
                    <>
                      <div className="flex items-center justify-between gap-3 text-sm sm:text-base">
                        <span className="font-semibold whitespace-nowrap">{t({ ar: "المبلغ المدفوع:", en: "Amount Paid:" })}</span>
                        <span className={`font-bold ${booking.payment_status === 'paid' ? 'text-green-600' : ''}`}>
                          {booking.amount_paid} {t({ ar: "ر.س", en: "SAR" })}
                        </span>
                      </div>
                      {booking.payment_status === 'partially_paid' && (
                        <div className="flex items-center justify-between gap-3 text-sm sm:text-base">
                          <span className="font-semibold whitespace-nowrap">{t({ ar: "المبلغ المتبقي:", en: "Remaining:" })}</span>
                          <span className="text-red-600 font-bold">{booking.total_amount - booking.amount_paid} {t({ ar: "ر.س", en: "SAR" })}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex items-center justify-between gap-3 text-sm sm:text-base">
                    <span className="font-semibold whitespace-nowrap">{t({ ar: "طريقة الدفع:", en: "Payment Method:" })}</span>
                    <span className="break-words text-right">{booking.payment_method}</span>
                  </div>
                  {booking.notes && (
                    <div className="text-sm sm:text-base space-y-1">
                      <span className="font-semibold">{t({ ar: "ملاحظات:", en: "Notes:" })}</span>
                      <p className="text-muted-foreground">{booking.notes}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold mb-3 text-base sm:text-lg">{t({ ar: "معلومات العميل", en: "Customer Information" })}</h4>
                    <div className="space-y-3 text-sm sm:text-base">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold whitespace-nowrap">{t({ ar: "الاسم:", en: "Name:" })}</span>
                        <span className="break-words text-right">{booking.profiles?.full_name}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold whitespace-nowrap">{t({ ar: "الهاتف:", en: "Phone:" })}</span>
                        <span className="break-words text-right" dir="ltr">{booking.profiles?.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hotel Confirmation Number - Editable */}
                  <div>
                    {showConfNumberInput === booking.id ? (
                      <div className="flex flex-col gap-3">
                        <Input
                          value={hotelConfNumber}
                          onChange={(e) => setHotelConfNumber(e.target.value)}
                          placeholder={t({ ar: "رقم حجز الفندق", en: "Hotel Booking Number" })}
                          className="w-full text-sm sm:text-base"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('bookings')
                                  .update({ hotel_confirmation_number: hotelConfNumber || null })
                                  .eq('id', booking.id);
                                
                                if (error) throw error;
                                
                                toast({
                                  title: t({ ar: "تم التحديث", en: "Updated" }),
                                  description: t({ ar: "تم تحديث رقم حجز الفندق", en: "Hotel booking number updated" }),
                                });
                                
                                setHotelConfNumber("");
                                setShowConfNumberInput(null);
                                onUpdate();
                              } catch (error: any) {
                                toast({
                                  title: t({ ar: "خطأ", en: "Error" }),
                                  description: error.message,
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            {t({ ar: "حفظ", en: "Save" })}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1"
                            onClick={() => {
                              setShowConfNumberInput(null);
                              setHotelConfNumber("");
                            }}
                          >
                            {t({ ar: "إلغاء", en: "Cancel" })}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <div className="w-full px-4 py-3 bg-white border-4 border-purple-600 rounded-md">
                          <p className="text-sm sm:text-base font-bold text-black break-words">
                            {t({ ar: "رقم حجز الفندق:", en: "Hotel Booking#:" })} {booking.hotel_confirmation_number || t({ ar: "غير متوفر", en: "N/A" })}
                          </p>
                        </div>
                        <Button
                          size="default"
                          variant="ghost"
                          className="w-full"
                          onClick={() => {
                            setHotelConfNumber(booking.hotel_confirmation_number || '');
                            setShowConfNumberInput(booking.id);
                          }}
                        >
                          <Edit className="w-4 h-4 ml-1" />
                          {t({ ar: "تعديل", en: "Edit" })}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full"
                      onClick={() => openEditDialog(booking)}
                    >
                      <Edit className="w-4 h-4 ml-1" />
                      {t({ ar: "تعديل", en: "Edit" })}
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full"
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
                      <Download className="w-4 h-4 ml-1" />
                      {t({ ar: "PDF", en: "PDF" })}
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full"
                      onClick={() => shareGeneral(booking)}
                    >
                      <Share2 className="w-4 h-4 ml-1" />
                      {t({ ar: "مشاركة", en: "Share" })}
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full"
                      onClick={() => {
                        const customerPageUrl = generateCustomerPageUrl(booking.user_id);
                        const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24));
                        const taxRate = booking.hotels?.tax_percentage || 0;
                        
                        // Calculate amounts correctly
                        const totalAfterDiscount = (booking.manual_total || booking.total_amount) - (booking.discount_amount || 0);
                        const subtotalBeforeTax = taxRate > 0 ? totalAfterDiscount / (1 + taxRate / 100) : totalAfterDiscount;
                        const vatAmount = totalAfterDiscount - subtotalBeforeTax;
                        
                        sharePDFViaWhatsApp({
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
                        }, {
                          language: 'en',
                          mealPlanNameAr: booking.meal_plan_name_ar,
                          mealPlanNameEn: booking.meal_plan_name_en,
                          mealPlanPrice: booking.meal_plan_price,
                          mealPlanMaxPersons: booking.meal_plan_max_persons,
                          extraMeals: booking.extra_meals,
                          paymentStatus: booking.payment_status,
                          amountPaid: booking.amount_paid,
                        });
                      }}
                    >
                      <FileText className="w-4 h-4 ml-1" />
                      {t({ ar: "PDF واتساب EN", en: "PDF WhatsApp EN" })}
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full"
                      onClick={() => {
                        const customerPageUrl = generateCustomerPageUrl(booking.user_id);
                        const nights = Math.ceil((new Date(booking.check_out).getTime() - new Date(booking.check_in).getTime()) / (1000 * 60 * 60 * 24));
                        const taxRate = booking.hotels?.tax_percentage || 0;
                        
                        // Calculate amounts correctly
                        const totalAfterDiscount = (booking.manual_total || booking.total_amount) - (booking.discount_amount || 0);
                        const subtotalBeforeTax = taxRate > 0 ? totalAfterDiscount / (1 + taxRate / 100) : totalAfterDiscount;
                        const vatAmount = totalAfterDiscount - subtotalBeforeTax;
                        
                        sharePDFViaWhatsApp({
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
                        }, {
                          language: 'ar',
                          mealPlanNameAr: booking.meal_plan_name_ar,
                          mealPlanNameEn: booking.meal_plan_name_en,
                          mealPlanPrice: booking.meal_plan_price,
                          mealPlanMaxPersons: booking.meal_plan_max_persons,
                          extraMeals: booking.extra_meals,
                          paymentStatus: booking.payment_status,
                          amountPaid: booking.amount_paid,
                        });
                      }}
                    >
                      <FileText className="w-4 h-4 ml-1" />
                      {t({ ar: "PDF واتساب AR", en: "PDF WhatsApp AR" })}
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full"
                      onClick={() => shareViaWhatsApp(booking)}
                    >
                      <MessageCircle className="w-4 h-4 ml-1" />
                      {t({ ar: "واتساب", en: "WhatsApp" })}
                    </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t({ ar: "تعديل تفاصيل الحجز", en: "Edit Booking Details" })}</DialogTitle>
            <DialogDescription>
              {t({ ar: "عدل معلومات الحجز", en: "Modify the booking information" })}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{t({ ar: "تاريخ الوصول والمغادرة", en: "Check-in & Check-out" })}</Label>
              <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-right font-normal",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {dateRange?.from && dateRange?.to
                      ? `${format(dateRange.from, "dd MMM yyyy", { locale: ar })} - ${format(dateRange.to, "dd MMM yyyy", { locale: ar })}`
                      : t({ ar: "اختر التواريخ", en: "Pick dates" })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onDayClick={handleDayClick}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                    locale={ar}
                    className="pointer-events-auto"
                    numberOfMonths={1}
                  />
                  <div className="px-3 pb-3 border-t flex items-center justify-between">
                    <span className="text-sm">
                      {t({ ar: 'عدد الأيام', en: 'Number of days' })}: <strong>{dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) : 0}</strong>
                    </span>
                    <Button 
                      size="default"
                      className="min-w-28 h-10 px-6 text-base rounded-xl"
                      onClick={() => setIsDatePickerOpen(false)}
                    >
                      {t({ ar: 'موافق', en: 'OK' })}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>{t({ ar: "عدد النزلاء", en: "Number of Guests" })}</Label>
              <Input
                type="number"
                min="1"
                value={editFormData.guests}
                onChange={(e) => {
                  const newTotal = selectedBooking ? calculateTotal(
                    editFormData.check_in,
                    editFormData.check_out,
                    parseInt(e.target.value),
                    parseInt(editFormData.rooms),
                    selectedBooking.hotels
                  ) : 0;
                  setEditFormData({ ...editFormData, guests: e.target.value, manual_total: newTotal.toString(), total_amount: newTotal.toString() });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t({ ar: "عدد الغرف", en: "Number of Rooms" })}</Label>
              <Input
                type="number"
                min="1"
                value={editFormData.rooms}
                onChange={(e) => {
                  const newTotal = selectedBooking ? calculateTotal(
                    editFormData.check_in,
                    editFormData.check_out,
                    parseInt(editFormData.guests),
                    parseInt(e.target.value),
                    selectedBooking.hotels
                  ) : 0;
                  setEditFormData({ ...editFormData, rooms: e.target.value, manual_total: newTotal.toString(), total_amount: newTotal.toString() });
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t({ ar: "مبلغ الخصم", en: "Discount Amount" })}</Label>
              <Input
                type="number"
                value={editFormData.discount_amount}
                onChange={(e) => setEditFormData({ ...editFormData, discount_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t({ ar: "المبلغ الإجمالي", en: "Total Amount" })}</Label>
              <Input
                type="number"
                value={editFormData.manual_total}
                onChange={(e) => setEditFormData({ ...editFormData, manual_total: e.target.value, total_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>{t({ ar: "المبلغ المدفوع", en: "Amount Paid" })}</Label>
              <Input
                type="number"
                value={editFormData.amount_paid}
                onChange={(e) => setEditFormData({ ...editFormData, amount_paid: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">{t({ ar: "الإجمالي بعد الخصم (شامل الضريبة)", en: "Total After Discount (Including Tax)" })}</Label>
              <div className="text-lg font-bold text-primary p-2 bg-muted rounded-md">
                {(parseFloat(editFormData.manual_total || "0") - parseFloat(editFormData.discount_amount || "0")).toFixed(2)} {t({ ar: "ر.س", en: "SAR" })}
              </div>
            </div>
            
            {/* Meal Plans Section */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold">{t({ ar: "معلومات الوجبات", en: "Meal Information" })}</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t({ ar: "اسم الوجبة (عربي)", en: "Meal Name (Arabic)" })}</Label>
                  <Input
                    value={editFormData.meal_plan_name_ar}
                    onChange={(e) => setEditFormData({ ...editFormData, meal_plan_name_ar: e.target.value })}
                    placeholder={t({ ar: "مثال: إفطار", en: "Example: Breakfast" })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{t({ ar: "اسم الوجبة (إنجليزي)", en: "Meal Name (English)" })}</Label>
                  <Input
                    value={editFormData.meal_plan_name_en}
                    onChange={(e) => setEditFormData({ ...editFormData, meal_plan_name_en: e.target.value })}
                    placeholder="Example: Breakfast"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t({ ar: "سعر الوجبة", en: "Meal Price" })}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editFormData.meal_plan_price}
                    onChange={(e) => setEditFormData({ ...editFormData, meal_plan_price: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{t({ ar: "مشمولة لـ (أشخاص)", en: "Included for (persons)" })}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editFormData.meal_plan_max_persons}
                    onChange={(e) => setEditFormData({ ...editFormData, meal_plan_max_persons: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>{t({ ar: "سعر الوجبة الإضافية", en: "Extra Meal Price" })}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editFormData.meal_plan_extra_price}
                    onChange={(e) => setEditFormData({ ...editFormData, meal_plan_extra_price: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>{t({ ar: "عدد الوجبات الإضافية", en: "Number of Extra Meals" })}</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editFormData.extra_meals}
                    onChange={(e) => setEditFormData({ ...editFormData, extra_meals: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>{t({ ar: "ملاحظات", en: "Notes" })}</Label>
              <Textarea
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              {t({ ar: "إلغاء", en: "Cancel" })}
            </Button>
            <Button onClick={handleEditBooking} className="btn-luxury">
              {t({ ar: "حفظ التغييرات", en: "Save Changes" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}