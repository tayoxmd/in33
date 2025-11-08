import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Wifi, Coffee, Utensils, ChevronLeft, ChevronRight, Bus, MapPinned, Bed } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { BedIcon } from "@/components/BedIcons";
import { useMealSettings } from "@/contexts/MealSettingsContext";

interface HotelCardProps {
  id: string;
  name: string;
  nameEn: string;
  location: string;
  price: number;
  rating: number;
  image: string;
  images?: string[];
  featured?: boolean;
  meal_plans?: {
    regular_ar?: string;
    regular_en?: string;
    ramadan_ar?: string;
    ramadan_en?: string;
    price?: number;
    max_persons?: number;
    extra_meal_price?: number;
    name_ar?: string;
    name_en?: string;
  } | any[] | null;
  amenities?: {
    wifi?: boolean;
    cafe?: boolean;
    restaurant?: boolean;
    parking?: boolean;
    shuttle?: boolean;
    walking_distance?: number | null;
    walking_distance_unit?: 'm' | 'km';
  };
  bed_type_single?: 'single' | 'king' | 'twin' | 'double' | string;
  bed_type_double?: 'king' | 'twin' | 'double' | string;
  max_guests_per_room?: number;
}

export function HotelCard({ 
  id, name, nameEn, location, price, rating, image, images, featured, 
  meal_plans, amenities, bed_type_single, bed_type_double, max_guests_per_room 
}: HotelCardProps) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const isMobile = useIsMobile();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { mealBadgeSettings, mealDescriptionSettings } = useMealSettings();
  
  const hotelImages = images && Array.isArray(images) && images.length > 0 ? images : [image];
  
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + hotelImages.length) % hotelImages.length);
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % hotelImages.length);
  };

  const getBedTypeLabel = () => {
    const arOrEn = (ar: string, en: string) => (language === 'ar' ? ar : en);

    if (max_guests_per_room === 1) {
      return arOrEn('سرير مفرد', 'Single Bed');
    }

    if (max_guests_per_room === 2) {
      const labels: Record<string, { ar: string; en: string }> = {
        king: { ar: 'سرير كينج', en: 'King Bed' },
        twin: { ar: 'سريرين مفردين', en: 'Twin Beds' },
      };
      const key = String(bed_type_double || '').toLowerCase();
      const found = labels[key];
      return found ? arOrEn(found.ar, found.en) : arOrEn('سرير مزدوج', 'Double Bed');
    }

    if (max_guests_per_room === 3) {
      return arOrEn('3 أسرّة مفردة', '3 Single Beds');
    }

    if (max_guests_per_room === 4) {
      return arOrEn('4 أسرّة مفردة', '4 Single Beds');
    }

    return null;
  };

  const getBedTypeIcon = () => {
    if (max_guests_per_room === 1) {
      return <BedIcon type="single" className="w-4 h-4" />;
    }

    if (max_guests_per_room === 2) {
      const key = String(bed_type_double || '').toLowerCase();
      if (key === 'twin') return <BedIcon type="twin" className="w-4 h-4" />;
      return <BedIcon type="king" className="w-4 h-4" />;
    }

    if (max_guests_per_room === 3) {
      return <BedIcon type="triple" className="w-4 h-4" />;
    }

    if (max_guests_per_room === 4) {
      return <BedIcon type="quad" className="w-4 h-4" />;
    }

    return null;
  };

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
        };
      }
      if (typeof mp === 'object') {
        return {
          name_ar: mp.regular_ar || mp.name_ar || '',
          name_en: mp.regular_en || mp.name_en || '',
          max_persons: Number(mp.max_persons || 0),
          extra_meal_price: Number((mp.extra_meal_price ?? mp.extra_price) || 0),
        };
      }
    } catch {}
    return null;
  };

  const meal = normalizeMealPlan(meal_plans);
  const mealIncluded = !!(meal && ((meal.name_ar && meal.name_ar.trim() !== '' && !meal.name_ar.includes('بدون') && !meal.name_ar.includes('لا يتضمن')) || (meal.name_en && meal.name_en.trim() !== '' && !/room only/i.test(meal.name_en))));

  // Mobile Layout (horizontal card with image on left)
  if (isMobile) {
    return (
      <Card 
        className="overflow-hidden hover-lift cursor-pointer group animate-fade-in bg-card shadow-card border border-border/50 rounded-2xl"
        onClick={() => {
          if (!id) {
            console.error('Hotel ID is missing');
            return;
          }
          const checkIn = localStorage.getItem('searchCheckIn') || new Date().toISOString().split('T')[0];
          const checkOut = localStorage.getItem('searchCheckOut') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
          const guests = localStorage.getItem('searchGuests') || '2';
          const rooms = localStorage.getItem('searchRooms') || '1';
          navigate(`/booking/${id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`);
        }}
      >
        <div className="flex h-40">
          {/* Image Section - Left Side */}
          <div className="relative w-1/3 flex-shrink-0">
            <img
              src={hotelImages[currentImageIndex]}
              alt={name}
              className="w-full h-full object-cover"
            />
            
            {/* Meal Badge - Top Right on Image */}
            {mealIncluded && (
              <div 
                className="font-bold flex items-center gap-1 justify-center"
                style={{ 
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  backgroundColor: mealBadgeSettings.color,
                  color: mealBadgeSettings.textColor,
                  width: mealBadgeSettings.autoWidthMobile ? 'auto' : `${mealBadgeSettings.widthMobile}px`,
                  height: `${mealBadgeSettings.heightMobile}px`,
                  fontSize: `${mealBadgeSettings.fontSize}px`,
                  borderRadius: `${mealBadgeSettings.borderRadius}px`,
                  minWidth: mealBadgeSettings.autoWidthMobile ? '60px' : `${mealBadgeSettings.widthMobile}px`,
                  maxWidth: mealBadgeSettings.autoWidthMobile ? 'calc(100% - 16px)' : undefined,
                  padding: mealBadgeSettings.autoWidthMobile ? '0 8px' : '0 4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Utensils className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{language === 'ar' ? (meal?.name_ar || 'يشمل وجبة') : (meal?.name_en || 'Meal Included')}</span>
              </div>
            )}

            {/* Image Counter - Bottom Left */}
            {hotelImages.length > 1 && (
              <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-foreground px-2 py-0.5 rounded text-xs font-semibold">
                {currentImageIndex + 1}/{hotelImages.length}
              </div>
            )}
          </div>

          {/* Content Section - Right Side */}
          <CardContent className="p-3 flex-1 flex flex-col justify-between">
            {/* Title & Rating */}
            <div>
              <h3 className="text-sm font-bold text-primary mb-0.5 line-clamp-1">{name}</h3>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">{location}</span>
                </div>
                <div className="flex items-center gap-0.5 bg-card/95 px-1.5 py-0.5 rounded-full">
                  <Star className="w-3 h-3 fill-primary text-primary" />
                  <span className="text-xs font-bold">{rating}</span>
                </div>
              </div>

              {/* Bed Type */}
              {(max_guests_per_room === 1 || max_guests_per_room === 2) && getBedTypeLabel() && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  {getBedTypeIcon()}
                  <span>{getBedTypeLabel()}</span>
                </div>
              )}
            </div>

            {/* Price & CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-primary">{price}</span>
                <span className="text-[10px] text-muted-foreground">ريال/ليلة</span>
              </div>
              <Button 
                size="sm" 
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-7 text-xs px-3"
              >
                احجز
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }
  
  // Desktop/Tablet Layout (vertical card)
  return (
    <Card className="overflow-hidden hover-lift cursor-pointer group animate-fade-in w-full max-w-md mx-auto bg-card shadow-card border border-border/50 rounded-2xl flex flex-col min-h-[520px]">
      {/* Image */}
      <div className="relative h-64 overflow-hidden flex-shrink-0" onClick={() => {
        if (!id) {
          console.error('Hotel ID is missing');
          return;
        }
        const checkIn = localStorage.getItem('searchCheckIn') || new Date().toISOString().split('T')[0];
        const checkOut = localStorage.getItem('searchCheckOut') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const guests = localStorage.getItem('searchGuests') || '2';
        const rooms = localStorage.getItem('searchRooms') || '1';
        navigate(`/hotel/${id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`);
      }}>
        <img
          src={hotelImages[currentImageIndex]}
          alt={name}
          className="w-full h-full object-cover transition-all duration-300"
        />
        
        {/* Meal Badge - Prominent Badge on Image */}
        {mealIncluded && (
          <div 
            className="font-bold items-center gap-2 shadow-xl md:hidden lg:flex justify-center"
            style={{ 
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: mealBadgeSettings.color,
              color: mealBadgeSettings.textColor,
              width: mealBadgeSettings.autoWidthDesktop ? 'auto' : `${mealBadgeSettings.widthDesktop}px`,
              height: `${mealBadgeSettings.heightDesktop}px`,
              fontSize: `${mealBadgeSettings.fontSize}px`,
              borderRadius: `${mealBadgeSettings.borderRadius}px`,
              minWidth: mealBadgeSettings.autoWidthDesktop ? '80px' : `${mealBadgeSettings.widthDesktop}px`,
              maxWidth: mealBadgeSettings.autoWidthDesktop ? '90%' : undefined,
              padding: mealBadgeSettings.autoWidthDesktop ? '0 12px' : '0 8px',
              display: 'flex',
            }}
          >
            <Utensils className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{language === 'ar' ? (meal?.name_ar || 'يشمل وجبة') : (meal?.name_en || 'Meal Included')}</span>
          </div>
        )}
        {mealIncluded && (
          <div 
            className="font-bold items-center gap-2 shadow-xl hidden md:flex lg:hidden justify-center"
            style={{ 
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: mealBadgeSettings.color,
              color: mealBadgeSettings.textColor,
              width: mealBadgeSettings.autoWidthTablet ? 'auto' : `${mealBadgeSettings.widthTablet}px`,
              height: `${mealBadgeSettings.heightTablet}px`,
              fontSize: `${mealBadgeSettings.fontSize}px`,
              borderRadius: `${mealBadgeSettings.borderRadius}px`,
              minWidth: mealBadgeSettings.autoWidthTablet ? '70px' : `${mealBadgeSettings.widthTablet}px`,
              maxWidth: mealBadgeSettings.autoWidthTablet ? '90%' : undefined,
              padding: mealBadgeSettings.autoWidthTablet ? '0 12px' : '0 8px',
              display: 'flex',
            }}
          >
            <Utensils className="w-5 h-5 flex-shrink-0" />
            <span className="truncate">{language === 'ar' ? (meal?.name_ar || 'يشمل وجبة') : (meal?.name_en || 'Meal Included')}</span>
          </div>
        )}

        {/* Image Counter - Bottom Left */}
        {hotelImages.length > 1 && (
          <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm text-foreground px-3 py-1 rounded-lg text-sm font-semibold">
            {String(currentImageIndex + 1).padStart(2, '0')}
            <span className="text-muted-foreground text-xs"> / {String(hotelImages.length).padStart(2, '0')}</span>
          </div>
        )}
        
        <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
          <Star className="w-4 h-4 fill-primary text-primary" />
          <span className="text-sm font-bold">{rating}</span>
        </div>
        
        {/* Navigation Buttons - Only if multiple images */}
        {hotelImages.length > 1 && (
          <>
            {/* Previous Image Button */}
            <button
              className={`absolute ${language === 'ar' ? 'right-2' : 'left-2'} top-1/2 -translate-y-1/2 h-10 w-10 bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg transition-all flex items-center justify-center`}
              style={{ borderRadius: '3px' }}
              onClick={handlePrevImage}
            >
              {language === 'ar' ? (
                <ChevronRight className="w-5 h-5 text-foreground" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-foreground" />
              )}
            </button>
            
            {/* Next Image Button */}
            <button
              className={`absolute ${language === 'ar' ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 h-10 w-10 bg-white/90 hover:bg-white backdrop-blur-sm shadow-lg transition-all flex items-center justify-center`}
              style={{ borderRadius: '3px' }}
              onClick={handleNextImage}
            >
              {language === 'ar' ? (
                <ChevronLeft className="w-5 h-5 text-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-foreground" />
              )}
            </button>
          </>
        )}
      </div>

      <CardContent className="p-4 flex flex-col flex-1">
        {/* Title */}
        <div className="mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-primary mb-0.5 truncate">{name}</h3>
            <p className="text-xs text-muted-foreground truncate">{nameEn}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-muted-foreground mb-3">
          <MapPin className="w-3.5 h-3.5" />
          <span className="text-xs">{location}</span>
        </div>

        {/* Bed Type - Only show if 2 guests */}
        {bed_type_double && max_guests_per_room === 2 && (
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            {getBedTypeIcon()}
            <span>{getBedTypeLabel()}</span>
          </div>
        )}

        {/* Amenities */}
        <div className="flex items-center gap-2.5 mb-3 flex-wrap">
          {amenities?.wifi && <Wifi className="w-4 h-4 text-muted-foreground" />}
          {amenities?.cafe && <Coffee className="w-4 h-4 text-muted-foreground" />}
          {amenities?.restaurant && <Utensils className="w-4 h-4 text-muted-foreground" />}
          {amenities?.parking && (
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs font-bold">
              P
            </div>
          )}
          {amenities?.shuttle && <Bus className="w-4 h-4 text-muted-foreground" />}
          {amenities?.walking_distance && amenities.walking_distance > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPinned className="w-4 h-4" />
              <span>{amenities.walking_distance} {amenities.walking_distance_unit === 'km' ? (language === 'ar' ? 'كم' : 'km') : (language === 'ar' ? 'م' : 'm')}</span>
            </div>
          )}
        </div>

        {/* Meal Details Badge - Under Amenities */}
        {mealIncluded && meal && (
          <div 
            className="mb-3 p-2 rounded-lg border" 
            style={{
              backgroundColor: mealDescriptionSettings.bgColor,
              borderColor: mealDescriptionSettings.borderColor,
              borderRadius: `${mealDescriptionSettings.borderRadius}px`,
            }}
          >
            <div 
              className="flex items-center gap-2"
              style={{
                fontSize: `${mealDescriptionSettings.fontSize}px`,
                color: mealDescriptionSettings.textColor,
              }}
            >
              <Utensils 
                className="w-4 h-4 flex-shrink-0" 
                style={{ color: mealDescriptionSettings.textColor }}
              />
              <div>
                <p className="font-semibold">
                  {language === 'ar' 
                    ? meal.max_persons === 1 
                      ? `يشمل ${meal.name_ar} لشخص واحد`
                      : meal.max_persons === 2
                      ? `يشمل ${meal.name_ar} لشخصين`
                      : meal.max_persons >= 3 && meal.max_persons <= 10
                      ? `يشمل ${meal.name_ar} لـ ${meal.max_persons} أشخاص`
                      : `يشمل ${meal.name_ar} لـ ${meal.max_persons} شخص`
                    : `Includes ${meal.name_en} for ${meal.max_persons} ${meal.max_persons === 1 ? 'person' : 'persons'}`
                  }
                </p>
                {meal.extra_meal_price > 0 && (
                  <p 
                    className="mt-0.5 opacity-90"
                    style={{
                      fontSize: `${mealDescriptionSettings.fontSize - 2}px`,
                    }}
                  >
                    {language === 'ar' 
                      ? `قيمة الوجبة الإضافية: ${meal.extra_meal_price} ر.س/لليلة`
                      : `Extra meal price: ${meal.extra_meal_price} SAR/night`
                    }
                  </p>
                )}
              </div>
            </div>
          </div>
        )}


        {/* Price & CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-primary">{price}</span>
              <span className="text-xs text-muted-foreground">ريال / ليلة</span>
            </div>
          </div>
          <Button 
            size="sm" 
            className="bg-secondary hover:bg-secondary/90 text-secondary-foreground h-8 text-sm px-4"
            onClick={(e) => {
              e.stopPropagation();
              if (!id) {
                console.error('Hotel ID is missing');
                return;
              }
              const checkIn = localStorage.getItem('searchCheckIn') || new Date().toISOString().split('T')[0];
              const checkOut = localStorage.getItem('searchCheckOut') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
              const guests = localStorage.getItem('searchGuests') || '2';
              const rooms = localStorage.getItem('searchRooms') || '1';
              navigate(`/booking/${id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`);
            }}
          >
            احجز الآن
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}