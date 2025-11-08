import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useMealSettings } from "@/contexts/MealSettingsContext";
import { toast } from "@/hooks/use-toast";
import { CreditCard, Calendar as CalendarIcon, Users, Hotel as HotelIcon, Utensils, ChevronLeft, ChevronRight } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DateRange } from "react-day-picker";
import { bookingSchema } from "@/lib/validations";
import { cn } from "@/lib/utils";
import { BookingAuthDialog } from "@/components/BookingAuthDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PostBookingAuthDialog } from "@/components/PostBookingAuthDialog";
import { countries } from "@/data/countries";
import { calculateSeasonalPrice } from "@/utils/seasonalPricing";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileBooking } from "@/components/MobileBooking";
import { useTheme } from "@/contexts/ThemeContext";
import { BedIcon } from "@/components/BedIcons";

const paymentMethods = [
  { id: 'cash', name: 'نقدي', nameEn: 'Cash' },
  { id: 'cash-electronic', name: 'نقدي + دفع إلكتروني', nameEn: 'Cash + Electronic Payment' },
  { id: 'cash-transfer', name: 'نقدي + تحويل بنكي', nameEn: 'Cash + Bank Transfer' },
  { id: 'apple-pay', name: 'Apple Pay', nameEn: 'Apple Pay' },
  { id: 'stc-pay', name: 'STC Pay', nameEn: 'STC Pay' },
  { id: 'google-pay', name: 'Google Pay', nameEn: 'Google Pay' },
  { id: 'mada', name: 'مدى', nameEn: 'Mada' },
  { id: 'mada-pay', name: 'تطبيق مدى', nameEn: 'Mada Pay' },
  { id: 'visa', name: 'فيزا', nameEn: 'Visa' },
  { id: 'mastercard', name: 'ماستر كارد', nameEn: 'Mastercard' },
  { id: 'bank-transfer', name: 'تحويل بنكي', nameEn: 'Bank Transfer' },
];

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const { userTheme } = useTheme();
  const { mealBadgeSettings, mealDescriptionSettings } = useMealSettings();
  const [hotel, setHotel] = useState<any>(null);
  
  // Get booking details from URL params and make them editable
  const searchParams = new URLSearchParams(location.search);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const checkInParam = searchParams.get('checkIn');
    const checkOutParam = searchParams.get('checkOut');
    if (checkInParam && checkOutParam) {
      return {
        from: new Date(checkInParam),
        to: new Date(checkOutParam)
      };
    }
    return {
      from: new Date(),
      to: new Date(Date.now() + 86400000)
    };
  });

  const handleDayClick = (day: Date) => {
    // 1st click: pick start, 2nd: pick end, 3rd: restart from clicked day, then repeat
    if (!dateRange?.from || (dateRange?.from && dateRange?.to)) {
      setDateRange({ from: day, to: undefined });
      return;
    }

    // Only start selected
    if (day < dateRange.from || day.getTime() === dateRange.from.getTime()) {
      // If clicked before or same as start -> restart from clicked day
      setDateRange({ from: day, to: undefined });
    } else {
      // Set end date
      setDateRange({ from: dateRange.from, to: day });
    }
  };
  const [guests, setGuests] = useState<number>(parseInt(searchParams.get('guests') || "2"));
  const [children, setChildren] = useState<number>(0);
  const [rooms, setRooms] = useState<number>(parseInt(searchParams.get('rooms') || "1"));
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Computed values from dateRange for backwards compatibility
  const checkIn = dateRange?.from || new Date();
  const checkOut = dateRange?.to || new Date(Date.now() + 86400000);
  
  const [paymentMethod, setPaymentMethod] = useState("");
  const [notes, setNotes] = useState("");
  const [guestName, setGuestName] = useState("");
  const [useCustomerName, setUseCustomerName] = useState(user ? true : false);
  const [loading, setLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showPostBookingDialog, setShowPostBookingDialog] = useState(false);
  const [guestPhone, setGuestPhone] = useState("");
  const [guestCountryCode, setGuestCountryCode] = useState("+966");
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});
  const guestNameRef = useRef<HTMLInputElement>(null);
  const paymentMethodRef = useRef<HTMLButtonElement>(null);
  const [extraMeals, setExtraMeals] = useState(0);
  const [savedGuests, setSavedGuests] = useState<any[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string>("");
  const [showNewGuestInput, setShowNewGuestInput] = useState(false);
  const [avgPricePerNight, setAvgPricePerNight] = useState<number | null>(null);
  const [loadingHotel, setLoadingHotel] = useState(true);
  const [customerFullName, setCustomerFullName] = useState("");
  const [availableRooms, setAvailableRooms] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Fetch customer's full name if logged in
  useEffect(() => {
    async function fetchCustomerName() {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single();
        
        if (data?.full_name) {
          setCustomerFullName(data.full_name);
          if (useCustomerName) {
            setGuestName(data.full_name);
          }
        }
      }
    }
    fetchCustomerName();
  }, [user]);

  // Update guest name when useCustomerName changes
  useEffect(() => {
    if (useCustomerName && customerFullName) {
      setGuestName(customerFullName);
    } else if (!useCustomerName) {
      setGuestName("");
    }
  }, [useCustomerName, customerFullName]);

  // Recalculate seasonal pricing when dates change
  useEffect(() => {
    if (hotel && id) {
      calculateSeasonalPrice(
        id,
        checkIn,
        checkOut,
        hotel.price_per_night
      ).then(avgPrice => {
        setAvgPricePerNight(avgPrice);
      });
    }
  }, [checkIn, checkOut, hotel?.price_per_night, id]);

  useEffect(() => {
    let mounted = true;
    
    async function fetchHotel() {
      if (!id) {
        navigate('/');
        return;
      }
      
      setLoadingHotel(true);
      
      try {
        const { data, error } = await supabase.rpc('get_public_hotel', {
          p_hotel_id: id
        });

        if (!mounted) return;

        if (error) {
          console.error('Error fetching hotel:', error);
          setLoadingHotel(false);
          navigate('/');
          return;
        }
        
        if (data && data.length > 0) {
          setHotel(data[0]);
          
          // Calculate seasonal pricing
          const avgPrice = await calculateSeasonalPrice(
            id!,
            checkIn,
            checkOut,
            data[0].price_per_night
          );
          
          if (mounted) {
            setAvgPricePerNight(avgPrice);
            setLoadingHotel(false);
          }
        } else {
          setLoadingHotel(false);
          navigate('/');
        }
      } catch (err) {
        console.error('Unexpected error fetching hotel:', err);
        if (mounted) {
          setLoadingHotel(false);
          navigate('/');
        }
      }
    }
    
    async function fetchSavedGuests() {
      if (user) {
        const { data, error } = await supabase
          .from('user_guests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (!error && data && mounted) {
          setSavedGuests(data);
        }
      }
    }

    fetchHotel();
    fetchSavedGuests();
    
    return () => {
      mounted = false;
    };
  }, [id, navigate, user]);

  // Normalize meal plans to a consistent shape
  const normalizeMealPlan = (mp: any) => {
    if (!mp) return null;
    try {
      if (Array.isArray(mp)) {
        const m = mp[0];
        if (!m) return null;
        return {
          name_ar: m.name_ar || m.regular_ar || '',
          name_en: m.name_en || m.regular_en || '',
          max_persons: Number(m.max_persons || 0),
          extra_meal_price: Number((m.extra_price ?? m.extra_meal_price) || 0),
          price: Number(m.price || 0),
        };
      }
      if (typeof mp === 'object') {
        return {
          name_ar: mp.regular_ar || mp.name_ar || '',
          name_en: mp.regular_en || mp.name_en || '',
          max_persons: Number(mp.max_persons || 0),
          extra_meal_price: Number((mp.extra_meal_price ?? mp.extra_price) || 0),
          price: Number(mp.price || 0),
        };
      }
    } catch {}
    return null;
  };
  const meal = normalizeMealPlan(hotel?.meal_plans);

  const calculateTotal = () => {
    if (!hotel) return { subtotal: 0, extraGuestCharge: 0, extraMealCharge: 0, tax: 0, total: 0, extraGuestsCount: 0, requiredExtraMeals: 0, extraMealsPerNight: 0 };
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    
    // Check for invalid dates
    if (nights <= 0) return { subtotal: 0, extraGuestCharge: 0, extraMealCharge: 0, tax: 0, total: 0, extraGuestsCount: 0, requiredExtraMeals: 0, extraMealsPerNight: 0 };
    
    const roomsCount = rooms;
    const guestsCount = guests + children;
    
    // Get tax rate (0 means no tax)
    const taxRate = (hotel.tax_percentage && hotel.tax_percentage > 0) ? hotel.tax_percentage : 0;
    
    // Calculate base room price using seasonal pricing if available
    const pricePerNight = avgPricePerNight !== null ? avgPricePerNight : hotel.price_per_night;
    const basePrice = pricePerNight * nights * roomsCount;
    
    // Calculate extra guests charge
    const maxGuestsIncluded = (hotel.max_guests_per_room || 2) * roomsCount;
    let extraGuestCharge = 0;
    let extraGuestsCount = 0;
    
    if (guestsCount > maxGuestsIncluded) {
      extraGuestsCount = guestsCount - maxGuestsIncluded;
      extraGuestCharge = extraGuestsCount * (hotel.extra_guest_price || 0) * nights;
    }
    
    // Calculate extra meals charge based on guests exceeding meal plan coverage
    let extraMealCharge = 0;
    let requiredExtraMeals = 0;
    let extraMealsPerNight = 0;
    
    if (meal && meal.max_persons > 0 && meal.extra_meal_price > 0) {
      const maxMealsIncluded = meal.max_persons * roomsCount;
      
      // Calculate how many extra meals are needed per night
      if (guestsCount > maxMealsIncluded) {
        extraMealsPerNight = guestsCount - maxMealsIncluded;
        requiredExtraMeals = extraMealsPerNight * nights;
        
        // Use extraMeals state only if it's greater than or equal to extraMealsPerNight
        // This prevents showing 0 SAR when extra meals are actually needed
        const mealsToCharge = extraMeals >= extraMealsPerNight ? extraMeals : extraMealsPerNight;
        extraMealCharge = mealsToCharge * (meal.extra_meal_price || 0) * nights;
      }
    }
    
    // Calculate subtotal before tax
    const subtotalBeforeTax = basePrice + extraGuestCharge + extraMealCharge;
    
    // Calculate tax amount
    const tax = taxRate > 0 ? (subtotalBeforeTax * taxRate / 100) : 0;
    
    // Calculate total
    const total = subtotalBeforeTax + tax;
    
    return { subtotal: basePrice, extraGuestCharge, extraMealCharge, tax, total, extraGuestsCount, requiredExtraMeals, extraMealsPerNight };
  };

  const initiateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    
    // Validate dates
    if (checkOut <= checkIn) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "تاريخ المغادرة يجب أن يكون بعد تاريخ الوصول", en: "Check-out date must be after check-in date" }),
        variant: "destructive",
      });
      return;
    }

    // Check room availability before booking
    try {
      const { data: isAvailable, error } = await supabase.rpc('check_room_availability', {
        p_hotel_id: id!,
        p_check_in: format(checkIn, 'yyyy-MM-dd'),
        p_check_out: format(checkOut, 'yyyy-MM-dd'),
        p_rooms_needed: rooms
      });

      if (error) {
        console.error('Error checking availability:', error);
        toast({
          title: t({ ar: "خطأ", en: "Error" }),
          description: t({ ar: "حدث خطأ في التحقق من التوفر", en: "Error checking availability" }),
          variant: "destructive",
        });
        return;
      }

      if (!isAvailable) {
        // Get available rooms count
        const { data: roomsData } = await supabase.rpc('get_available_rooms_count' as any, {
          p_hotel_id: id!,
          p_check_in: format(checkIn, 'yyyy-MM-dd'),
          p_check_out: format(checkOut, 'yyyy-MM-dd')
        });
        
        const availableCount = Number(roomsData) || 0;
        toast({
          title: t({ ar: "غير متوفر", en: "Not Available" }),
          description: availableCount > 0
            ? t({ ar: `عدد الغرف المطلوبة غير متوفر. الغرف المتاحة: ${availableCount}`, en: `The requested number of rooms is not available. Available rooms: ${availableCount}` })
            : t({ ar: "عدد الغرف المطلوبة غير متوفر في التواريخ المحددة", en: "The requested number of rooms is not available for the selected dates" }),
          variant: "destructive",
        });
        return;
      }
    } catch (err) {
      console.error('Error checking availability:', err);
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "حدث خطأ في التحقق من التوفر", en: "Error checking availability" }),
        variant: "destructive",
      });
      return;
    }
    
    if (!guestName.trim()) {
      setFieldErrors({ guestName: true });
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "لم تقم بإدخال اسم الضيف", en: "Guest name is required" }),
        variant: "destructive",
      });
      // Scroll to the error field
      setTimeout(() => {
        guestNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        guestNameRef.current?.focus();
      }, 100);
      return;
    }
    
    if (!paymentMethod) {
      setFieldErrors({ paymentMethod: true });
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "يرجى اختيار طريقة الدفع", en: "Please select payment method" }),
        variant: "destructive",
      });
      // Scroll to the error field
      setTimeout(() => {
        paymentMethodRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return;
    }

    // إذا كان المستخدم مسجل دخول، قم بالحجز مباشرة
    if (user) {
      handleSubmit();
    } else {
      // إظهار نافذة خيارات المصادقة
      setShowAuthDialog(true);
    }
  };

  const handleGuestContinue = (phone: string, countryCode: string) => {
    setGuestPhone(phone);
    setGuestCountryCode(countryCode);
    // Use setTimeout to ensure state is updated before submission
    setTimeout(() => {
      handleSubmit(phone, countryCode);
    }, 0);
  };

  const handleSubmit = async (phone?: string, countryCode?: string) => {
    setLoading(true);

    const totalData = calculateTotal();
    
    // Format guest name: uppercase if English, keep as is if Arabic
    const formattedGuestName = /^[a-zA-Z\s]+$/.test(guestName.trim()) 
      ? guestName.trim().toUpperCase() 
      : guestName.trim();
    
    const bookingData: any = {
      hotel_id: id!,
      check_in: format(checkIn, 'yyyy-MM-dd'),
      check_out: format(checkOut, 'yyyy-MM-dd'),
      guests: guests + children,
      rooms: rooms,
      total_amount: totalData.total,
      payment_method: paymentMethod,
      notes: notes || null,
      guest_name: formattedGuestName,
      status: 'new' as const,
      payment_status: 'unpaid',
      amount_paid: 0,
      extra_meals: extraMeals,
      meal_plan_name_ar: meal?.name_ar || hotel?.meal_plans?.regular_ar || null,
      meal_plan_name_en: meal?.name_en || hotel?.meal_plans?.regular_en || null,
      meal_plan_price: meal?.price || hotel?.meal_plans?.price || 0,
      meal_plan_max_persons: meal?.max_persons || hotel?.meal_plans?.max_persons || 0,
      meal_plan_extra_price: meal?.extra_meal_price || hotel?.meal_plans?.extra_meal_price || 0,
    };

    // إضافة معلومات المستخدم أو الضيف
    if (user) {
      bookingData.user_id = user.id;
    } else {
      // Use parameters if provided (from handleGuestContinue), otherwise use state
      const phoneToUse = phone || guestPhone;
      const countryCodeToUse = countryCode || guestCountryCode;
      
      if (phoneToUse) {
        bookingData.guest_phone = phoneToUse;
        bookingData.guest_country_code = countryCodeToUse;
      }
    }
    
    let data: any = null;
    let error: any = null;
    let bookingId: string | null = null;
    
    if (user) {
      const res = await supabase
        .from('bookings')
        .insert([bookingData])
        .select('id')
        .single();
      data = res.data;
      error = res.error;
      bookingId = res.data?.id || null;
    } else {
      // Guest booking - insert without returning ID (RLS limitation)
      const res = await supabase
        .from('bookings')
        .insert([bookingData]);
      error = res.error;
      // For guests, we won't have the booking ID immediately
      bookingId = null;
    }

    setLoading(false);

    if (error) {
      toast({
        title: t({ ar: "خطأ", en: "Error" }),
        description: t({ ar: "حدث خطأ في الحجز", en: "Booking failed" }),
        variant: "destructive",
      });
    } else {
      toast({
        title: t({ ar: "تم بنجاح", en: "Success" }),
        description: t({ ar: "تم إرسال حجزك بنجاح وفي انتظار التأكيد", en: "Your booking has been sent successfully and is awaiting confirmation" }),
      });
      
      // Send WhatsApp notification for authenticated user bookings only
      if (user && bookingId) {
        try {
          await supabase.functions.invoke('notify-whatsapp-group', {
            body: { bookingId }
          });
        } catch (whatsappError) {
          console.error('WhatsApp notification error:', whatsappError);
        }
      }
      
      // التوجيه بناءً على نوع المستخدم
      if (user) {
        // للمستخدمين المسجلين - إظهار شاشة التحميل ثم التحويل الفوري
        setIsRedirecting(true);
        navigate('/customer-dashboard');
      } else {
        // للضيوف - عرض dialog لتشجيعهم على إنشاء حساب
        setTimeout(() => {
          setShowPostBookingDialog(true);
        }, 1000);
      }
    }
  };

  if (loadingHotel || isRedirecting) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <LoadingSpinner size="lg" />
        {isRedirecting && (
          <p className="text-lg text-muted-foreground animate-pulse">
            {t({ ar: "جاري التحويل إلى صفحة الطلبات...", en: "Redirecting to your bookings..." })}
          </p>
        )}
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
  const hotelImages = hotel?.images && Array.isArray(hotel.images) && hotel.images.length > 0 
    ? hotel.images 
    : [];

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + hotelImages.length) % hotelImages.length);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % hotelImages.length);
  };

  // Render mobile version if on mobile device and theme is design2
  if (isMobile && userTheme === 'design2') {
    return (
      <MobileBooking
        hotel={hotel}
        checkIn={checkIn}
        checkOut={checkOut}
        guests={guests.toString()}
        rooms={rooms.toString()}
        avgPricePerNight={avgPricePerNight}
        guestName={guestName}
        setGuestName={setGuestName}
        guestPhone={guestPhone}
        setGuestPhone={setGuestPhone}
        guestCountryCode={guestCountryCode}
        setGuestCountryCode={setGuestCountryCode}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
        notes={notes}
        setNotes={setNotes}
        extraMeals={extraMeals}
        setExtraMeals={setExtraMeals}
        onSubmit={initiateBooking}
        loading={loading}
        fieldErrors={fieldErrors}
        paymentMethods={paymentMethods}
        children={children}
        setChildren={setChildren}
        setGuests={setGuests}
        setRooms={setRooms}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <h1 className="text-3xl font-bold mb-8">
          {t({ ar: 'إكمال الحجز', en: 'Complete Booking', fr: 'Finaliser la réservation', es: 'Completar reserva', ru: 'Завершить бронирование', id: 'Selesaikan Pemesanan', ms: 'Lengkapkan Tempahan' })}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={initiateBooking} className="space-y-6">
              {/* Booking Summary Card */}
              <Card className="card-luxury">
                <CardHeader>
                  <CardTitle>{t({ ar: 'ملخص الحجز', en: 'Booking Summary', fr: 'Résumé de la réservation', es: 'Resumen de reserva', ru: 'Резюме бронирования', id: 'Ringkasan Pemesanan', ms: 'Ringkasan Tempahan' })}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Hotel Images Gallery */}
                  {hotelImages.length > 0 && (
                    <div className="relative rounded-lg overflow-hidden group">
                      <div className="aspect-video w-full">
                        <img
                          src={hotelImages[currentImageIndex]}
                          alt={language === 'ar' ? hotel.name_ar : hotel.name_en}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Meal Badge */}
                      {meal && (meal.name_ar || meal.name_en) && (
          <div 
            className="font-semibold shadow-lg flex items-center gap-1.5 z-10"
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              padding: '4px 12px',
              backgroundColor: mealBadgeSettings.color,
              color: mealBadgeSettings.textColor,
              fontSize: `${mealBadgeSettings.fontSize}px`,
              borderRadius: `${mealBadgeSettings.borderRadius}px`,
              width: mealBadgeSettings.autoWidthMobile ? 'auto' : `${mealBadgeSettings.widthMobile}px`,
              height: `${mealBadgeSettings.heightMobile}px`,
              minWidth: mealBadgeSettings.autoWidthMobile ? '60px' : undefined,
              maxWidth: mealBadgeSettings.autoWidthMobile ? 'calc(100% - 16px)' : `${mealBadgeSettings.widthMobile}px`,
            }}
          >
            <Utensils className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">
              {language === 'ar' ? meal.name_ar : meal.name_en}
            </span>
          </div>
                      )}
                      
                      {/* Navigation Arrows */}
                      {hotelImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all z-10"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          
                          {/* Image counter */}
                          <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-full text-xs z-10">
                            {currentImageIndex + 1} / {hotelImages.length}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Hotel Info */}
                  <div className="flex items-start gap-4 pb-4 border-b">
                    {hotel.location_url ? (
                      <button
                        type="button"
                        onClick={() => window.open(hotel.location_url, '_blank')}
                        className="flex flex-col items-center justify-center gap-0.5 w-14 h-14 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all flex-shrink-0 group"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary group-hover:scale-110 transition-transform">
                          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        <span className="text-[8px] text-primary font-medium leading-tight text-center">
                          {t({ ar: 'موقع الفندق', en: 'Hotel Location' })}
                        </span>
                      </button>
                    ) : (
                      <HotelIcon className="w-10 h-10 text-primary flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">
                        {language === 'ar' ? hotel.name_ar : hotel.name_en}
                      </h3>
                      <p className="text-sm text-muted-foreground">{hotel.location}</p>
                    </div>
                  </div>

                  {/* Booking Details - Editable */}
                  <div className="space-y-3">
                    {/* Dates - Single Popover */}
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        {t({ ar: 'تاريخ الوصول والمغادرة', en: 'Check-in & Check-out' })}
                      </Label>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full h-9 justify-start text-right font-normal",
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
                          <div>
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
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>

                     {/* Guests Row - Editable */}
                     <div className="grid grid-cols-2 gap-3">
                       <div className="p-3 bg-muted/50 rounded-lg">
                         <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                           <Users className="w-4 h-4" />
                           {t({ ar: 'عدد البالغين', en: 'Adults' })}
                         </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-md"
                              onClick={() => setGuests(Math.max(1, guests - 1))}
                            >
                              -
                            </Button>
                            <span className="flex-1 text-center font-semibold">{guests}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-md"
                              onClick={() => setGuests(guests + 1)}
                            >
                              +
                            </Button>
                          </div>
                       </div>

                       <div className="p-3 bg-muted/50 rounded-lg">
                         <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                           <Users className="w-4 h-4" />
                           {t({ ar: 'عدد الأطفال', en: 'Children' })}
                         </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-md"
                              onClick={() => setChildren(Math.max(0, children - 1))}
                            >
                              -
                            </Button>
                            <span className="flex-1 text-center font-semibold">{children}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-md"
                              onClick={() => setChildren(children + 1)}
                            >
                              +
                            </Button>
                          </div>
                       </div>
                     </div>

                     {/* Rooms & Meals - Editable */}
                     <div className="grid grid-cols-2 gap-3">
                       <div className="p-3 bg-muted/50 rounded-lg">
                         <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                           <HotelIcon className="w-4 h-4" />
                           {t({ ar: 'عدد الغرف', en: 'Rooms' })}
                         </Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-md"
                              onClick={() => setRooms(Math.max(1, rooms - 1))}
                            >
                              -
                            </Button>
                            <span className="flex-1 text-center font-semibold">{rooms}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-md"
                              onClick={() => setRooms(rooms + 1)}
                            >
                              +
                            </Button>
                          </div>
                       </div>

                      {hotel?.meal_plans && hotel.meal_plans.max_persons > 0 && (
                        <div 
                          className="flex flex-col gap-2 p-3 rounded-lg border"
                          style={{
                            backgroundColor: mealDescriptionSettings.bgColor,
                            borderColor: mealDescriptionSettings.borderColor,
                            borderRadius: `${mealDescriptionSettings.borderRadius}px`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <Utensils 
                              className="w-5 h-5 flex-shrink-0" 
                              style={{ color: mealDescriptionSettings.textColor }}
                            />
                            <div className="min-w-0 flex-1">
                              <p 
                                className="font-semibold"
                                style={{
                                  fontSize: `${mealDescriptionSettings.fontSize}px`,
                                  color: mealDescriptionSettings.textColor,
                                }}
                              >
                                {language === 'ar' 
                                  ? hotel.meal_plans.max_persons === 1
                                    ? `يشمل ${hotel.meal_plans.regular_ar} لشخص واحد في كل غرفة (${rooms} ${rooms === 1 ? 'غرفة' : 'غرف'} = ${hotel.meal_plans.max_persons * rooms} ${hotel.meal_plans.max_persons * rooms === 1 ? 'وجبة' : hotel.meal_plans.max_persons * rooms === 2 ? 'وجبتين' : 'وجبات'})`
                                    : hotel.meal_plans.max_persons === 2
                                    ? `يشمل ${hotel.meal_plans.regular_ar} لشخصين في كل غرفة (${rooms} ${rooms === 1 ? 'غرفة' : 'غرف'} = ${hotel.meal_plans.max_persons * rooms} ${hotel.meal_plans.max_persons * rooms === 1 ? 'وجبة' : hotel.meal_plans.max_persons * rooms === 2 ? 'وجبتين' : 'وجبات'})`
                                    : hotel.meal_plans.max_persons >= 3 && hotel.meal_plans.max_persons <= 10
                                    ? `يشمل ${hotel.meal_plans.regular_ar} لـ ${hotel.meal_plans.max_persons} أشخاص في كل غرفة (${rooms} ${rooms === 1 ? 'غرفة' : 'غرف'} = ${hotel.meal_plans.max_persons * rooms} ${hotel.meal_plans.max_persons * rooms === 1 ? 'وجبة' : hotel.meal_plans.max_persons * rooms === 2 ? 'وجبتين' : 'وجبات'})`
                                    : `يشمل ${hotel.meal_plans.regular_ar} لـ ${hotel.meal_plans.max_persons} شخص في كل غرفة (${rooms} ${rooms === 1 ? 'غرفة' : 'غرف'} = ${hotel.meal_plans.max_persons * rooms} ${hotel.meal_plans.max_persons * rooms === 1 ? 'وجبة' : hotel.meal_plans.max_persons * rooms === 2 ? 'وجبتين' : 'وجبات'})`
                                  : `Includes ${hotel.meal_plans.regular_en} for ${hotel.meal_plans.max_persons} person(s) per room (${rooms} room(s) = ${hotel.meal_plans.max_persons * rooms} meal(s))`
                                }
                              </p>
                              {hotel.meal_plans.extra_meal_price > 0 && (
                                <p 
                                  className="mt-1 opacity-90"
                                  style={{
                                    fontSize: `${mealDescriptionSettings.fontSize - 2}px`,
                                    color: mealDescriptionSettings.textColor,
                                  }}
                                >
                                  {t({ 
                                    ar: `قيمة الوجبة الإضافية: ${hotel.meal_plans.extra_meal_price} ر.س/للشخص/لليلة`, 
                                    en: `Extra meal price: ${hotel.meal_plans.extra_meal_price} SAR/per person/night` 
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {hotel.meal_plans.extra_meal_price > 0 && calculateTotal().extraMealsPerNight > 0 && (
                            <div className="pt-2 border-t border-green-200 dark:border-green-800">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-orange-600 dark:text-orange-400 font-semibold">
                                  {t({ ar: `⚠️ الأشخاص الإضافيين يحتاجون إلى وجبات`, en: `⚠️ Extra guests need meals` })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">
                                {t({ ar: `لديك ${guests + children} ${guests + children === 1 ? 'شخص' : guests + children === 2 ? 'شخصين' : 'أشخاص'} ولكن الوجبات تشمل ${hotel.meal_plans.max_persons * rooms} فقط`, 
                                     en: `You have ${guests + children} guest(s) but meals include only ${hotel.meal_plans.max_persons * rooms}` })}
                              </p>
                              <div className="space-y-2">
                                <Select 
                                  value={extraMeals > 6 ? "custom" : (extraMeals > 0 ? extraMeals.toString() : calculateTotal().extraMealsPerNight.toString())}
                                  onValueChange={(value) => {
                                    if (value !== "custom") {
                                      setExtraMeals(parseInt(value));
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs bg-white dark:bg-background">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {calculateTotal().extraMealsPerNight > 0 && calculateTotal().extraMealsPerNight <= 6 && (
                                      <SelectItem value={calculateTotal().extraMealsPerNight.toString()}>
                                        {t({ ar: `${calculateTotal().extraMealsPerNight} وجبات (مطلوب)`, en: `${calculateTotal().extraMealsPerNight} meals (required)` })} - {calculateTotal().extraMealsPerNight * hotel.meal_plans.extra_meal_price * nights} {t({ ar: 'ر.س', en: 'SAR' })}
                                      </SelectItem>
                                    )}
                                    {[1, 2, 3, 4, 5, 6].map((num) => {
                                      if (num === calculateTotal().extraMealsPerNight) return null;
                                      return (
                                        <SelectItem key={num} value={num.toString()}>
                                          +{num} {t({ ar: num === 1 ? 'وجبة' : num === 2 ? 'وجبتين' : 'وجبات', en: num === 1 ? 'meal' : 'meals' })} - {num * hotel.meal_plans.extra_meal_price * nights} {t({ ar: 'ر.س', en: 'SAR' })}
                                        </SelectItem>
                                      );
                                    })}
                                    <SelectItem value="custom">{t({ ar: 'إدخال عدد آخر', en: 'Enter another number' })}</SelectItem>
                                  </SelectContent>
                                </Select>
                                
                                {extraMeals > 6 && (
                                  <Input
                                    type="number"
                                    min={calculateTotal().extraMealsPerNight}
                                    value={extraMeals}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 0;
                                      if (value >= calculateTotal().extraMealsPerNight) {
                                        setExtraMeals(value);
                                      }
                                    }}
                                    placeholder={t({ ar: 'أدخل عدد الوجبات', en: 'Enter number of meals' })}
                                    className="h-8 text-xs"
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                   {/* Price Breakdown - Enhanced */}
                   <div className="space-y-3 pt-4 border-t">
                     <h4 className="font-semibold text-sm mb-2">{t({ ar: 'تفاصيل السعر', en: 'Price Details' })}</h4>
                     
                     <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">{t({ ar: 'السعر لليلة', en: 'Price per night' })}</span>
                       <span>{avgPricePerNight || hotel.price_per_night} {t({ ar: 'ر.س', en: 'SAR' })}</span>
                     </div>
                     
                     <div className="flex justify-between text-sm">
                       <span className="text-muted-foreground">{t({ ar: 'عدد الليالي', en: 'Number of nights' })}</span>
                       <span>{nights} {t({ ar: nights === 1 ? 'ليلة' : nights === 2 ? 'ليلتين' : 'ليالي', en: nights === 1 ? 'night' : 'nights' })}</span>
                     </div>
                     
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t({ ar: 'عدد الغرف', en: 'Number of rooms' })}</span>
                        <span>{rooms} {t({ ar: rooms === 1 ? 'غرفة' : rooms === 2 ? 'غرفتين' : 'غرف', en: rooms === 1 ? 'room' : 'rooms' })}</span>
                      </div>
                      
                       <div className="p-2 bg-muted/50 rounded-lg space-y-1.5">
                         <div className="flex justify-between text-xs">
                           <span className="text-muted-foreground">{t({ ar: 'الأشخاص الأساسيين', en: 'Base guests included' })}</span>
                           <span className="font-medium">
                             {(hotel.max_guests_per_room || 2) * rooms}{' '}
                             {t({ ar: 'شخص', en: 'person(s)' })}
                           </span>
                         </div>
                        
                        {hotel?.extra_guest_price > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{t({ ar: 'سعر الشخص الإضافي', en: 'Extra guest price' })}</span>
                            <span className="font-medium">
                              {hotel.extra_guest_price} {t({ ar: 'ر.س/لليلة', en: 'SAR/night' })}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {calculateTotal().extraGuestsCount > 0 && (
                        <div className="flex justify-between text-sm text-orange-600 dark:text-orange-400">
                          <span className="font-medium">
                            {t({ ar: `ضيوف إضافيين (${calculateTotal().extraGuestsCount})`, en: `Extra guests (${calculateTotal().extraGuestsCount})` })}
                          </span>
                          <span className="font-semibold">+{Math.round(calculateTotal().extraGuestCharge)} {t({ ar: 'ر.س', en: 'SAR' })}</span>
                        </div>
                      )}
                      
                     
                     <div className="flex justify-between text-sm pt-2 border-t">
                       <span className="text-muted-foreground">{t({ ar: 'المجموع قبل الضريبة', en: 'Subtotal' })}</span>
                       <span>{Math.round(calculateTotal().subtotal + calculateTotal().extraGuestCharge + calculateTotal().extraMealCharge)} {t({ ar: 'ر.س', en: 'SAR' })}</span>
                     </div>
                     
                     {calculateTotal().tax > 0 && (
                       <div className="flex justify-between text-sm">
                         <span className="text-muted-foreground">{t({ ar: `الضريبة (${hotel.tax_percentage}%)`, en: `Tax (${hotel.tax_percentage}%)` })}</span>
                         <span>+{Math.round(calculateTotal().tax)} {t({ ar: 'ر.س', en: 'SAR' })}</span>
                       </div>
                     )}
                     
                     <div className="flex justify-between font-bold text-lg pt-3 border-t-2">
                       <span className="text-primary">{t({ ar: 'الإجمالي', en: 'Total Amount' })}</span>
                       <div className="flex flex-col items-end">
                         <span className="text-primary text-xl">
                           {Math.round(calculateTotal().total)} {t({ ar: 'ر.س', en: 'SAR' })}
                         </span>
                         <span className="text-[10px] font-normal text-muted-foreground">{t({ ar: 'شامل جميع الرسوم', en: 'All fees included' })}</span>
                       </div>
                     </div>
                   </div>
                </CardContent>
              </Card>

              {/* Extra Meals Section - Enhanced */}
              {hotel.meal_plans && hotel.meal_plans.max_persons && (
                <Card className="card-luxury">
                  <CardHeader>
                    <CardTitle>{t({ ar: 'الوجبات', en: 'Meals' })}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">
                          {language === 'ar' ? hotel.meal_plans.regular_ar : hotel.meal_plans.regular_en}
                        </span>
                        {hotel.meal_plans.price > 0 && (
                          <span className="text-sm text-muted-foreground">
                            +{hotel.meal_plans.price} {t({ ar: 'ر.س/لليلة', en: 'SAR/night' })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' 
                          ? hotel.meal_plans.max_persons === 1
                            ? 'يشمل الوجبة لشخص واحد'
                            : hotel.meal_plans.max_persons === 2
                            ? 'يشمل الوجبة لشخصين'
                            : hotel.meal_plans.max_persons >= 3 && hotel.meal_plans <= 10
                            ? `يشمل الوجبة لـ ${hotel.meal_plans.max_persons} أشخاص`
                            : `يشمل الوجبة لـ ${hotel.meal_plans.max_persons} شخص`
                          : `Includes meal for ${hotel.meal_plans.max_persons} ${hotel.meal_plans.max_persons === 1 ? 'person' : 'persons'}`
                        }
                      </p>
                      
                      {hotel.meal_plans.extra_meal_price > 0 && (
                        <p className="text-xs text-muted-foreground pt-2 border-t">
                          {t({ 
                            ar: `قيمة الوجبة الإضافية: ${hotel.meal_plans.extra_meal_price} ر.س/للشخص/لليلة`, 
                            en: `Extra meal price: ${hotel.meal_plans.extra_meal_price} SAR/per person/night` 
                          })}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Guest Name */}
              <Card className="card-luxury">
                <CardHeader>
                  <CardTitle>{t({ ar: 'اسم الضيف', en: 'Guest Name' })}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="use-customer-name"
                          checked={useCustomerName}
                          onChange={(e) => {
                            setUseCustomerName(e.target.checked);
                            setShowNewGuestInput(false);
                            setSelectedGuestId("");
                          }}
                          className="w-4 h-4"
                        />
                        <label htmlFor="use-customer-name" className="text-sm text-muted-foreground cursor-pointer">
                          {t({ ar: 'هل اسم العميل هو نفسه اسم الضيف؟', en: 'Is the customer name the same as the guest name?' })}
                        </label>
                      </div>
                      
                      {useCustomerName && guestName && (
                        <div className="px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg">
                          <p className="text-base font-semibold text-foreground">{guestName}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {user && !useCustomerName && savedGuests.length > 0 && (
                    <div className="space-y-2">
                      <Label>{t({ ar: 'اختر ضيف', en: 'Select Guest' })}</Label>
                      <Select
                        value={selectedGuestId}
                        onValueChange={(value) => {
                          if (value === "new") {
                            setShowNewGuestInput(true);
                            setSelectedGuestId("");
                            setGuestName("");
                          } else {
                            setShowNewGuestInput(false);
                            setSelectedGuestId(value);
                            const guest = savedGuests.find(g => g.id === value);
                            if (guest) {
                              setGuestName(guest.guest_name);
                              setGuestPhone(guest.guest_phone || "");
                              setGuestCountryCode(guest.guest_country_code || "+966");
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t({ ar: 'اختر ضيف', en: 'Select guest' })} />
                        </SelectTrigger>
                        <SelectContent>
                          {savedGuests.map((guest) => (
                            <SelectItem key={guest.id} value={guest.id}>
                              {guest.guest_name}
                            </SelectItem>
                          ))}
                          <SelectItem value="new">
                            {t({ ar: '+ إضافة ضيف جديد', en: '+ Add new guest' })}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {(!user || !useCustomerName) && (user ? showNewGuestInput || savedGuests.length === 0 : true) && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="guestName">
                          {t({ ar: 'اسم الضيف', en: 'Guest Name' })}
                        </Label>
                        <Input
                          ref={guestNameRef}
                          id="guestName"
                          value={guestName}
                          onChange={(e) => {
                            setGuestName(e.target.value);
                            if (fieldErrors.guestName) {
                              setFieldErrors({ ...fieldErrors, guestName: false });
                            }
                          }}
                          placeholder={t({ ar: 'أدخل اسم الضيف', en: 'Enter guest name' })}
                          required
                          className={fieldErrors.guestName ? "border-2 border-destructive focus-visible:ring-destructive" : ""}
                        />
                      </div>
                      
                      {user && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="guestPhone">
                              {t({ ar: 'رقم جوال الضيف', en: 'Guest Phone Number' })}
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              ({t({ ar: 'اختياري', en: 'Optional' })})
                            </span>
                          </div>
                          <div className="flex gap-2" dir="ltr">
                            <Select
                              value={guestCountryCode}
                              onValueChange={setGuestCountryCode}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map((country) => (
                                  <SelectItem key={country.dialCode} value={country.dialCode}>
                                    {country.dialCode}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              id="guestPhone"
                              className="flex-1"
                              value={guestPhone}
                              onChange={(e) => setGuestPhone(e.target.value)}
                              placeholder={t({ ar: 'رقم الجوال', en: 'Phone number' })}
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Additional Notes */}
              <Card className="card-luxury">
                <CardHeader>
                  <CardTitle>{t({ ar: 'ملاحظات إضافية', en: 'Additional Notes', fr: 'Notes supplémentaires', es: 'Notas adicionales', ru: 'Дополнительные заметки', id: 'Catatan Tambahan', ms: 'Nota Tambahan' })}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t({ ar: 'أي ملاحظات خاصة...', en: 'Any special requests...', fr: 'Demandes spéciales...', es: 'Solicitudes especiales...', ru: 'Особые пожелания...', id: 'Permintaan khusus...', ms: 'Permintaan khas...' })}
                    rows={4}
                  />
                </CardContent>
              </Card>

              {/* Payment Method */}
              <Card className="card-luxury">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="ml-2 w-5 h-5" />
                    {t({ ar: 'طريقة الدفع', en: 'Payment Method', fr: 'Mode de paiement', es: 'Método de pago', ru: 'Способ оплаты', id: 'Metode Pembayaran', ms: 'Kaedah Pembayaran' })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={paymentMethod} 
                    onValueChange={(value) => {
                      setPaymentMethod(value);
                      if (fieldErrors.paymentMethod) {
                        setFieldErrors({ ...fieldErrors, paymentMethod: false });
                      }
                    }} 
                    required
                  >
                    <SelectTrigger 
                      ref={paymentMethodRef}
                      className={fieldErrors.paymentMethod ? "border-2 border-destructive focus:ring-destructive" : ""}
                    >
                      <SelectValue placeholder={t({ ar: 'اختر طريقة الدفع', en: 'Select payment method', fr: 'Sélectionner le mode de paiement', es: 'Seleccionar método de pago', ru: 'Выберите способ оплаты', id: 'Pilih metode pembayaran', ms: 'Pilih kaedah pembayaran' })} />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
                        <SelectItem key={method.id} value={method.id}>
                          {language === 'ar' ? method.name : method.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Confirm Button */}
              <Button 
                type="submit" 
                className="w-full btn-luxury h-14 text-lg"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" className="text-white" />
                  </div>
                ) : t({ ar: 'تأكيد الحجز', en: 'Confirm Booking' })}
              </Button>
            </form>
          </div>

          {/* Side Summary (Desktop) */}
...
        </div>
      </div>

      <BookingAuthDialog 
        open={showAuthDialog}
        onClose={() => setShowAuthDialog(false)}
        onGuestContinue={handleGuestContinue}
      />

      <PostBookingAuthDialog
        open={showPostBookingDialog}
        onOpenChange={setShowPostBookingDialog}
        onSkip={() => navigate('/guest-dashboard')}
      />

      <Footer />
    </div>
  );
}
