import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { format } from "date-fns";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, ArrowRight, Navigation, ChevronLeft, ChevronRight, Utensils } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { calculateSeasonalPrice } from "@/utils/seasonalPricing";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileHotelDetails } from "@/components/MobileHotelDetails";
import { useTheme } from "@/contexts/ThemeContext";

interface Hotel {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  location: string;
  location_url?: string;
  price_per_night: number;
  rating: number;
  images: any;
  city_name_ar?: string;
  city_name_en?: string;
  meal_plans?: any;
  amenities?: any;
}

export default function HotelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const { userTheme } = useTheme();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [mealBadgeSettings, setMealBadgeSettings] = useState<any>(null);
  const [avgPricePerNight, setAvgPricePerNight] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Get search parameters from URL or localStorage
  const searchParams = new URLSearchParams(location.search);
  const checkIn = searchParams.get('checkIn') || localStorage.getItem('searchCheckIn') || format(new Date(), 'yyyy-MM-dd');
  const checkOut = searchParams.get('checkOut') || localStorage.getItem('searchCheckOut') || format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');
  const guests = searchParams.get('guests') || localStorage.getItem('searchGuests') || '2';
  const rooms = searchParams.get('rooms') || localStorage.getItem('searchRooms') || '1';

  useEffect(() => {
    async function fetchHotel() {
      const { data, error } = await supabase.rpc('get_public_hotel', {
        p_hotel_id: id
      });

      if (error) {
        console.error('Error fetching hotel:', error);
      }
      
      if (data && data.length > 0) {
        setHotel(data[0]);
        
        // Calculate seasonal pricing
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const avgPrice = await calculateSeasonalPrice(
          id!,
          checkInDate,
          checkOutDate,
          data[0].price_per_night
        );
        setAvgPricePerNight(avgPrice);
      }
      setLoading(false);
    }
    
    async function fetchMealBadgeSettings() {
      const { data } = await supabase
        .from('site_settings')
        .select('meal_badge_color, meal_badge_width_mobile, meal_badge_height_mobile, meal_badge_auto_width_mobile, meal_badge_width_tablet, meal_badge_height_tablet, meal_badge_auto_width_tablet, meal_badge_width_desktop, meal_badge_height_desktop, meal_badge_auto_width_desktop, meal_badge_font_size, meal_badge_border_radius')
        .order('created_at', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (data) {
        setMealBadgeSettings(data);
      }
    }
    
    fetchHotel();
    fetchMealBadgeSettings();
  }, [id, checkIn, checkOut]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {t('الفندق غير موجود', 'Hotel not found')}
      </div>
    );
  }

  const mainImage = hotel.images && hotel.images[0] 
    ? hotel.images[0] 
    : "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000";

  const hotelImages = hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0 
    ? hotel.images 
    : [mainImage];

  // Render mobile version if on mobile device and theme is design2
  if (isMobile && userTheme === 'design2') {
    return (
      <MobileHotelDetails
        hotel={hotel}
        checkIn={checkIn}
        checkOut={checkOut}
        guests={guests}
        rooms={rooms}
        avgPricePerNight={avgPricePerNight}
        mealBadgeSettings={mealBadgeSettings}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowRight className="ml-2 w-4 h-4" />
          {t('العودة', 'Back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            {/* Image Carousel */}
            <div className="relative group">
              <img
                src={hotelImages[currentImageIndex]}
                alt={language === 'ar' ? hotel.name_ar : hotel.name_en}
                className="w-full h-[400px] object-cover rounded-2xl shadow-luxury"
              />
              
              {/* Image Counter */}
              {hotelImages.length > 1 && (
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-foreground px-3 py-1 rounded-lg text-sm font-semibold">
                  {String(currentImageIndex + 1).padStart(2, '0')}
                  <span className="text-muted-foreground text-xs"> / {String(hotelImages.length).padStart(2, '0')}</span>
                </div>
              )}
              
              {/* Meal Badge */}
              {hotel.meal_plans && mealBadgeSettings && (
                <div 
                  className="absolute top-4 px-3 py-1 text-white font-semibold shadow-lg flex items-center gap-2"
                  style={{
                    [language === 'ar' ? 'left' : 'right']: '16px',
                    backgroundColor: mealBadgeSettings.meal_badge_color || '#007dff',
                    width: window.innerWidth >= 1024
                      ? (mealBadgeSettings.meal_badge_auto_width_desktop ? 'auto' : `${mealBadgeSettings.meal_badge_width_desktop || 180}px`)
                      : window.innerWidth >= 768
                      ? (mealBadgeSettings.meal_badge_auto_width_tablet ? 'auto' : `${mealBadgeSettings.meal_badge_width_tablet || 150}px`)
                      : (mealBadgeSettings.meal_badge_auto_width_mobile ? 'auto' : `${mealBadgeSettings.meal_badge_width_mobile || 120}px`),
                    height: window.innerWidth >= 1024
                      ? `${mealBadgeSettings.meal_badge_height_desktop || 36}px`
                      : window.innerWidth >= 768
                      ? `${mealBadgeSettings.meal_badge_height_tablet || 32}px`
                      : `${mealBadgeSettings.meal_badge_height_mobile || 24}px`,
                    fontSize: `${mealBadgeSettings.meal_badge_font_size || 12}px`,
                    borderRadius: `${mealBadgeSettings.meal_badge_border_radius || 8}px`,
                    minWidth: window.innerWidth >= 1024 && mealBadgeSettings.meal_badge_auto_width_desktop ? '80px' :
                              window.innerWidth >= 768 && mealBadgeSettings.meal_badge_auto_width_tablet ? '70px' :
                              mealBadgeSettings.meal_badge_auto_width_mobile ? '60px' : undefined,
                    maxWidth: window.innerWidth >= 1024 && mealBadgeSettings.meal_badge_auto_width_desktop ? 'calc(100% - 32px)' :
                              window.innerWidth >= 768 && mealBadgeSettings.meal_badge_auto_width_tablet ? 'calc(100% - 32px)' :
                              mealBadgeSettings.meal_badge_auto_width_mobile ? 'calc(100% - 32px)' : undefined,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <Utensils className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{language === 'ar' ? hotel.meal_plans.regular_ar : hotel.meal_plans.regular_en}</span>
                </div>
              )}
              
              {/* Navigation Buttons */}
              {hotelImages.length > 1 && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-md bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg transition-all"
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % hotelImages.length)}
                  >
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-md bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg transition-all"
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + hotelImages.length) % hotelImages.length)}
                  >
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold mb-4">
              {language === 'ar' ? hotel.name_ar : hotel.name_en}
            </h1>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center">
                <Star className="w-5 h-5 text-primary fill-primary ml-1" />
                <span className="font-semibold">{hotel.rating}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <MapPin className="w-4 h-4 ml-1" />
                <span>{hotel.location}</span>
              </div>
              {hotel.location_url && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(hotel.location_url, '_blank')}
                  className="gap-2"
                >
                  <Navigation className="w-4 h-4" />
                  {t('عرض الموقع', 'View Location')}
                </Button>
              )}
            </div>

            <p className="text-muted-foreground mb-6 leading-relaxed">
              {language === 'ar' ? hotel.description_ar : hotel.description_en}
            </p>

            {hotel.meal_plans && mealBadgeSettings && (
              <div 
                className="mb-4 px-4 py-2 text-white font-medium rounded-lg inline-block"
                style={{
                  backgroundColor: mealBadgeSettings.meal_badge_color || '#007dff',
                  fontSize: `${(mealBadgeSettings.meal_badge_font_size || 12) + 2}px`,
                  width: window.innerWidth >= 1024 && mealBadgeSettings.meal_badge_auto_width_desktop ? 'auto' :
                         window.innerWidth >= 768 && mealBadgeSettings.meal_badge_auto_width_tablet ? 'auto' :
                         mealBadgeSettings.meal_badge_auto_width_mobile ? 'auto' : 'fit-content',
                  whiteSpace: 'nowrap',
                }}
              >
                {language === 'ar' 
                  ? hotel.meal_plans.max_persons === 1
                    ? `يشمل ${hotel.meal_plans.regular_ar} لشخص واحد`
                    : hotel.meal_plans.max_persons === 2
                    ? `يشمل ${hotel.meal_plans.regular_ar} لشخصين`
                    : hotel.meal_plans.max_persons >= 3 && hotel.meal_plans.max_persons <= 10
                    ? `يشمل ${hotel.meal_plans.regular_ar} لـ ${hotel.meal_plans.max_persons} أشخاص`
                    : `يشمل ${hotel.meal_plans.regular_ar} لـ ${hotel.meal_plans.max_persons} شخص`
                  : `Includes ${hotel.meal_plans.regular_en} for ${hotel.meal_plans.max_persons} ${hotel.meal_plans.max_persons === 1 ? 'person' : 'persons'}`
                }
                {hotel.meal_plans.extra_meal_price > 0 && (
                  <span className="mr-2">
                    {' • '}
                    {language === 'ar' 
                      ? `قيمة الوجبة الإضافية: ${hotel.meal_plans.extra_meal_price} ر.س/لليلة`
                      : `Extra meal price: ${hotel.meal_plans.extra_meal_price} SAR/night`
                    }
                  </span>
                )}
              </div>
            )}

            <Card className="card-luxury mb-6">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">
                      {avgPricePerNight !== null ? Math.round(avgPricePerNight) : hotel.price_per_night} {t('ر.س', 'SAR')}
                    </span>
                    <span className="text-muted-foreground">
                      {t('لليلة الواحدة', 'per night')}
                    </span>
                  </div>

                  {checkIn && checkOut && rooms && (() => {
                    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
                    const roomsCount = parseInt(rooms) || 1;
                    const guestsCount = parseInt(guests) || 2;
                    const maxGuestsIncluded = ((hotel as any).max_guests_per_room || 2) * roomsCount;
                    
                    // Get tax rate (0 means no tax)
                    const taxRate = ((hotel as any).tax_percentage && (hotel as any).tax_percentage > 0) ? (hotel as any).tax_percentage : 0;
                    
                    // Calculate base price using seasonal pricing
                    const pricePerNight = avgPricePerNight !== null ? avgPricePerNight : hotel.price_per_night;
                    let subtotal = pricePerNight * nights * roomsCount;
                    
                    let extraGuestCharge = 0;
                    let extraGuests = 0;
                    
                    // Calculate extra guests charge
                    if (guestsCount > maxGuestsIncluded) {
                      extraGuests = guestsCount - maxGuestsIncluded;
                      const extraGuestPrice = (hotel as any).extra_guest_price || 0;
                      extraGuestCharge = extraGuests * extraGuestPrice * nights;
                    }
                    
                    // Calculate tax on total before tax
                    const totalBeforeTax = subtotal + extraGuestCharge;
                    const tax = taxRate > 0 ? (totalBeforeTax * taxRate / 100) : 0;
                    const finalTotal = totalBeforeTax + tax;
                    
                    return (
                      <div className="pt-2 border-t space-y-1">
                        <p className="text-xs text-foreground/70">
                          {t('السعر الأساسي', 'Base Price')}: {Math.round(subtotal)} {t('ر.س', 'SAR')}
                        </p>
                        {extraGuests > 0 && (
                          <p className="text-xs text-foreground/70">
                            {t('أشخاص إضافيين', 'Extra Guests')}: +{Math.round(extraGuestCharge)} {t('ر.س', 'SAR')} ({extraGuests} {extraGuests === 1 ? t('شخص', 'person') : t('أشخاص', 'persons')})
                          </p>
                        )}
                        {tax > 0 && (
                          <p className="text-xs text-foreground/70">
                            {t('الضريبة', 'Tax')} ({taxRate}%): +{Math.round(tax)} {t('ر.س', 'SAR')}
                          </p>
                        )}
                        <p className="text-sm font-bold text-primary pt-1 border-t">
                          {t('الإجمالي', 'Total')}: {Math.round(finalTotal)} {t('ر.س', 'SAR')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          ({nights} {t('ليلة', 'nights')} × {roomsCount} {t('غرفة', 'rooms')})
                        </p>
                      </div>
                    );
                  })()}
                </div>

                <Button 
                  className="w-full btn-luxury mt-4"
                  onClick={() => {
                    if (!hotel?.id) {
                      console.error('Hotel ID is missing');
                      return;
                    }
                    navigate(`/booking/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`)
                  }}
                >
                  {t({ ar: 'احجز الآن', en: 'Book Now' })}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
