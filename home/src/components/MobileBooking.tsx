import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { Calendar, Users, Minus, Plus, CreditCard, ArrowLeft } from "lucide-react";
import { countries } from "@/data/countries";

interface MobileBookingProps {
  hotel: any;
  checkIn: Date;
  checkOut: Date;
  guests: string;
  rooms: string;
  avgPricePerNight: number | null;
  guestName: string;
  setGuestName: (name: string) => void;
  guestPhone: string;
  setGuestPhone: (phone: string) => void;
  guestCountryCode: string;
  setGuestCountryCode: (code: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  extraMeals: number;
  setExtraMeals: (meals: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  fieldErrors: {[key: string]: boolean};
  paymentMethods: any[];
  children: number;
  setChildren: (children: number) => void;
  setGuests: (guests: number) => void;
  setRooms: (rooms: number) => void;
}

export function MobileBooking(props: MobileBookingProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [numGuests, setNumGuests] = useState(parseInt(props.guests) || 2);
  const [numChildren, setNumChildren] = useState(props.children);
  const [numRooms, setNumRooms] = useState(parseInt(props.rooms) || 1);

  // Update parent state when local state changes
  useEffect(() => {
    props.setGuests(numGuests);
  }, [numGuests, props.setGuests]);

  useEffect(() => {
    props.setChildren(numChildren);
  }, [numChildren, props.setChildren]);

  useEffect(() => {
    props.setRooms(numRooms);
  }, [numRooms, props.setRooms]);
 
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
  const meal = normalizeMealPlan(props.hotel?.meal_plans);

  const calculateTotal = () => {
    if (!props.hotel) return { total: 0, nights: 0, extraMealsPerNight: 0, extraGuestCharge: 0, extraGuestsCount: 0, extraMealCharge: 0, tax: 0, subtotal: 0 };
    const nights = Math.ceil((props.checkOut.getTime() - props.checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights <= 0) return { total: 0, nights: 0, extraMealsPerNight: 0, extraGuestCharge: 0, extraGuestsCount: 0, extraMealCharge: 0, tax: 0, subtotal: 0 };
    const roomsCount = numRooms;
    const guestsCount = numGuests + numChildren;
    const taxRate = (props.hotel.tax_percentage && props.hotel.tax_percentage > 0) ? props.hotel.tax_percentage : 0;
    const pricePerNight = props.avgPricePerNight !== null ? props.avgPricePerNight : props.hotel.price_per_night;
    const basePrice = pricePerNight * nights * roomsCount;
    
    const maxGuestsIncluded = (props.hotel.max_guests_per_room || 2) * roomsCount;
    let extraGuestCharge = 0;
    
    if (guestsCount > maxGuestsIncluded) {
      const extraGuestsCount = guestsCount - maxGuestsIncluded;
      extraGuestCharge = extraGuestsCount * (props.hotel.extra_guest_price || 0) * nights;
    }
    
    // Calculate extra meals based on guests exceeding meal plan coverage
    let extraMealCharge = 0;
    let extraMealsPerNight = 0;
    
    if (meal && meal.max_persons > 0 && meal.extra_meal_price > 0) {
      const maxMealsIncluded = meal.max_persons * roomsCount;
      if (guestsCount > maxMealsIncluded) {
        extraMealsPerNight = guestsCount - maxMealsIncluded;
        const mealsToCharge = props.extraMeals > 0 ? props.extraMeals : extraMealsPerNight;
        extraMealCharge = mealsToCharge * (meal.extra_meal_price || 0) * nights;
      }
    }
    
    const subtotalBeforeTax = basePrice + extraGuestCharge + extraMealCharge;
    const tax = taxRate > 0 ? (subtotalBeforeTax * taxRate / 100) : 0;
    const total = subtotalBeforeTax + tax;
    
    return { total, nights, extraMealsPerNight };
  };

  const { total, nights, extraMealsPerNight } = calculateTotal();
  
  // Auto-set extraMeals when guests exceed meal coverage
  useEffect(() => {
    if (extraMealsPerNight > 0 && props.extraMeals === 0) {
      props.setExtraMeals(extraMealsPerNight);
    }
  }, [extraMealsPerNight, props.extraMeals]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary-glow pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">
            {t({ ar: 'تفاصيل الحجز', en: 'Booking Details' })}
          </h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Hotel Card */}
        <Card className="overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="flex gap-3 p-4">
              {props.hotel.location_url ? (
                <button
                  type="button"
                  onClick={() => window.open(props.hotel.location_url, '_blank')}
                  className="flex flex-col items-center justify-center gap-0.5 w-20 h-20 bg-primary/10 hover:bg-primary/20 rounded-lg transition-all flex-shrink-0 group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary group-hover:scale-110 transition-transform">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span className="text-[9px] text-primary font-semibold leading-tight text-center px-1">
                    {t({ ar: 'موقع الفندق', en: 'Location' })}
                  </span>
                </button>
              ) : (
                <img
                  src={props.hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
                  alt={language === 'ar' ? props.hotel.name_ar : props.hotel.name_en}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="font-bold text-sm mb-1">
                  {language === 'ar' ? props.hotel.name_ar : props.hotel.name_en}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">{props.hotel.location}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-primary font-bold">
                    ${props.avgPricePerNight !== null ? Math.round(props.avgPricePerNight) : props.hotel.price_per_night}
                  </span>
                  <span className="text-muted-foreground">
                    {t({ ar: `${nights} ليالي`, en: `${nights} nights` })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Schedule */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">
              {t({ ar: 'جدول الحجز', en: 'Booking Schedule' })}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  {t({ ar: 'تسجيل الدخول', en: 'Check In' })}
                </p>
                <p className="text-sm font-semibold">{format(props.checkIn, "dd MMM yyyy")}</p>
              </div>
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">
                  {t({ ar: 'تسجيل الخروج', en: 'Check Out' })}
                </p>
                <p className="text-sm font-semibold">{format(props.checkOut, "dd MMM yyyy")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guest & Room */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">
              {t({ ar: 'الضيوف والغرف', en: 'Guest & Room' })}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t({ ar: 'البالغون', en: 'Adults' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t({ ar: 'فوق 14 سنة', en: 'Over 14 years' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNumGuests(Math.max(1, numGuests - 1))}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{numGuests}</span>
                  <button
                    type="button"
                    onClick={() => setNumGuests(numGuests + 1)}
                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t({ ar: 'الأطفال', en: 'Child' })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t({ ar: 'تحت 14 سنة', en: 'Under 14 years' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNumChildren(Math.max(0, numChildren - 1))}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{numChildren}</span>
                  <button
                    type="button"
                    onClick={() => setNumChildren(numChildren + 1)}
                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {t({ ar: 'الغرف', en: 'Room' })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setNumRooms(Math.max(1, numRooms - 1))}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold">{numRooms}</span>
                  <button
                    type="button"
                    onClick={() => setNumRooms(numRooms + 1)}
                    className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meals Section */}
        {meal && meal.max_persons > 0 && (
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">
                {t({ ar: 'الوجبات', en: 'Meals' })}
              </h3>
              <div className="space-y-3">
                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">
                    {language === 'ar' 
                      ? meal.max_persons === 1
                        ? `يشمل ${meal.name_ar} لشخص واحد في كل غرفة (${numRooms} ${numRooms === 1 ? 'غرفة' : 'غرف'} = ${meal.max_persons * numRooms} ${meal.max_persons * numRooms === 1 ? 'وجبة' : meal.max_persons * numRooms === 2 ? 'وجبتين' : 'وجبات'})`
                        : meal.max_persons === 2
                        ? `يشمل ${meal.name_ar} لشخصين في كل غرفة (${numRooms} ${numRooms === 1 ? 'غرفة' : 'غرف'} = ${meal.max_persons * numRooms} ${meal.max_persons * numRooms === 1 ? 'وجبة' : meal.max_persons * numRooms === 2 ? 'وجبتين' : 'وجبات'})`
                        : meal.max_persons >= 3 && meal.max_persons <= 10
                        ? `يشمل ${meal.name_ar} لـ ${meal.max_persons} أشخاص في كل غرفة (${numRooms} ${numRooms === 1 ? 'غرفة' : 'غرف'} = ${meal.max_persons * numRooms} ${meal.max_persons * numRooms === 1 ? 'وجبة' : meal.max_persons * numRooms === 2 ? 'وجبتين' : 'وجبات'})`
                        : `يشمل ${meal.name_ar} لـ ${meal.max_persons} شخص في كل غرفة (${numRooms} ${numRooms === 1 ? 'غرفة' : 'غرف'} = ${meal.max_persons * numRooms} ${meal.max_persons * numRooms === 1 ? 'وجبة' : meal.max_persons * numRooms === 2 ? 'وجبتين' : 'وجبات'})`
                      : `Includes ${meal.name_en} for ${meal.max_persons} person(s) per room (${numRooms} room(s) = ${meal.max_persons * numRooms} meal(s))`
                    }
                  </p>
                  {meal.extra_meal_price > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      {t({ 
                        ar: `قيمة الوجبة الإضافية: ${meal.extra_meal_price} ر.س/للشخص/لليلة`, 
                        en: `Extra meal price: ${meal.extra_meal_price} SAR/per person/night` 
                      })}
                    </p>
                  )}
                </div>
                {meal.extra_meal_price > 0 && extraMealsPerNight > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-2">
                      ⚠️ {t({ ar: 'وجبات إضافية مطلوبة', en: 'Extra meals required' })}
                    </p>
                    <p className="text-xs text-muted-foreground mb-2">
                      {t({ ar: `لديك ${numGuests + numChildren} ضيوف ولكن الوجبات تشمل ${meal.max_persons * numRooms} فقط`, 
                           en: `You have ${numGuests + numChildren} guests but meals include only ${meal.max_persons * numRooms}` })}
                    </p>
                    <Select 
                      value={props.extraMeals > 6 ? "custom" : (props.extraMeals > 0 ? props.extraMeals.toString() : extraMealsPerNight.toString())}
                      onValueChange={(value) => {
                        if (value !== "custom") {
                          props.setExtraMeals(parseInt(value));
                        }
                      }}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {extraMealsPerNight > 0 && extraMealsPerNight <= 6 && (
                          <SelectItem value={extraMealsPerNight.toString()}>
                            {t({ ar: `${extraMealsPerNight} وجبات (مطلوب)`, en: `${extraMealsPerNight} meals (required)` })} - {extraMealsPerNight * meal.extra_meal_price * nights} SAR
                          </SelectItem>
                        )}
                        {[1, 2, 3, 4, 5, 6].map((num) => {
                          if (num === extraMealsPerNight) return null;
                          return (
                            <SelectItem key={num} value={num.toString()}>
                              +{num} {t({ ar: 'وجبات', en: 'meals' })} - {num * meal.extra_meal_price * nights} SAR
                            </SelectItem>
                          );
                        })}
                        <SelectItem value="custom">{t({ ar: 'إدخال عدد آخر', en: 'Enter another number' })}</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {props.extraMeals > 6 && (
                      <Input
                        type="number"
                        min={extraMealsPerNight}
                        value={props.extraMeals}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value >= extraMealsPerNight) {
                            props.setExtraMeals(value);
                          }
                        }}
                        placeholder={t({ ar: 'أدخل عدد الوجبات', en: 'Enter number of meals' })}
                        className="mt-2 text-xs"
                      />
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Details */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">
              {t({ ar: 'تفاصيل الاتصال', en: 'Contact Details' })}
            </h3>
            <div className="space-y-3">
              <div>
                <Label className="text-xs mb-1.5 block">
                  {t({ ar: 'الاسم الكامل', en: 'Full Name' })}
                </Label>
                <Input
                  value={props.guestName}
                  onChange={(e) => props.setGuestName(e.target.value)}
                  className={`h-10 ${props.fieldErrors.guestName ? 'border-destructive' : ''}`}
                  placeholder={language === 'ar' ? 'أدخل اسمك' : 'Enter your name'}
                />
              </div>

              <div>
                <Label className="text-xs mb-1.5 block">
                  {t({ ar: 'رقم الهاتف', en: 'Phone Number' })}
                </Label>
                <div className="flex gap-2">
                  <Select value={props.guestCountryCode} onValueChange={props.setGuestCountryCode}>
                    <SelectTrigger className="w-24 h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country.code} value={country.dialCode}>
                          {country.dialCode}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={props.guestPhone}
                    onChange={(e) => props.setGuestPhone(e.target.value)}
                    className="flex-1 h-10"
                    placeholder="123456789"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">
              {t({ ar: 'طريقة الدفع', en: 'Payment Method' })}
            </h3>
            <Select value={props.paymentMethod} onValueChange={props.setPaymentMethod}>
              <SelectTrigger className={`h-10 ${props.fieldErrors.paymentMethod ? 'border-destructive' : ''}`}>
                <SelectValue placeholder={language === 'ar' ? 'اختر طريقة الدفع' : 'Select payment method'} />
              </SelectTrigger>
              <SelectContent>
                {props.paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {language === 'ar' ? method.name : method.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <Label className="text-xs mb-1.5 block">
              {t({ ar: 'ملاحظات إضافية', en: 'Additional Notes' })}
            </Label>
            <Textarea
              value={props.notes}
              onChange={(e) => props.setNotes(e.target.value)}
              className="min-h-20 resize-none"
              placeholder={language === 'ar' ? 'أضف أي ملاحظات...' : 'Add any notes...'}
            />
          </CardContent>
        </Card>

        {/* Price Summary */}
        <Card className="shadow-lg">
          <CardContent className="p-4 space-y-2 text-sm">
            {calculateTotal().extraGuestsCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t({ ar: `ضيوف إضافيين (${calculateTotal().extraGuestsCount})`, en: `Extra guests (${calculateTotal().extraGuestsCount})` })}</span>
                <span className="font-semibold">+{Math.round(calculateTotal().extraGuestCharge)} {t({ ar: 'ر.س', en: 'SAR' })}</span>
              </div>
            )}
            {meal && calculateTotal().extraMealsPerNight > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t({ ar: 'وجبات إضافية', en: 'Extra meals' })}</span>
                <span className="font-semibold">+{Math.round((props.extraMeals > 0 ? props.extraMeals : calculateTotal().extraMealsPerNight) * (meal?.extra_meal_price || 0) * calculateTotal().nights)} {t({ ar: 'ر.س', en: 'SAR' })}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span className="text-muted-foreground">{t({ ar: 'المجموع قبل الضريبة', en: 'Subtotal' })}</span>
              <span>{Math.round(calculateTotal().subtotal + calculateTotal().extraGuestCharge + calculateTotal().extraMealCharge)} {t({ ar: 'ر.س', en: 'SAR' })}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">
            {t({ ar: 'المجموع', en: 'Total' })}
          </span>
          <span className="text-xl font-bold text-primary">
            ${Math.round(total)}
          </span>
        </div>
        <Button
          onClick={props.onSubmit}
          disabled={props.loading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl"
        >
          {props.loading ? t({ ar: 'جاري الحجز...', en: 'Booking...' }) : t({ ar: 'احجز الآن', en: 'Book Now' })}
        </Button>
      </div>
    </div>
  );
}