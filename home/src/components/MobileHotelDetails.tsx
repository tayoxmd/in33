import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, MapPin, ArrowLeft, Wifi, Car, Waves, Wind, Dumbbell } from "lucide-react";
import { format } from "date-fns";
import { ImageGallery } from "@/components/ImageGallery";

interface MobileHotelDetailsProps {
  hotel: any;
  checkIn: string;
  checkOut: string;
  guests: string;
  rooms: string;
  avgPricePerNight: number | null;
  mealBadgeSettings: any;
}

export function MobileHotelDetails({
  hotel,
  checkIn,
  checkOut,
  guests,
  rooms,
  avgPricePerNight,
  mealBadgeSettings,
}: MobileHotelDetailsProps) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const mainImage = hotel.images && hotel.images[0] 
    ? hotel.images[0] 
    : "https://images.unsplash.com/photo-1566073771259-6a8506099945";

  const hotelImages = hotel.images && Array.isArray(hotel.images) && hotel.images.length > 0 
    ? hotel.images 
    : [mainImage];

  const calculateTotal = () => {
    const nights = Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
    const roomsCount = parseInt(rooms) || 1;
    const guestsCount = parseInt(guests) || 2;
    const maxGuestsIncluded = (hotel.max_guests_per_room || 2) * roomsCount;
    const taxRate = (hotel.tax_percentage && hotel.tax_percentage > 0) ? hotel.tax_percentage : 0;
    const pricePerNight = avgPricePerNight !== null ? avgPricePerNight : hotel.price_per_night;
    let subtotal = pricePerNight * nights * roomsCount;
    
    let extraGuestCharge = 0;
    if (guestsCount > maxGuestsIncluded) {
      const extraGuests = guestsCount - maxGuestsIncluded;
      extraGuestCharge = extraGuests * (hotel.extra_guest_price || 0) * nights;
    }
    
    const totalBeforeTax = subtotal + extraGuestCharge;
    const tax = taxRate > 0 ? (totalBeforeTax * taxRate / 100) : 0;
    return totalBeforeTax + tax;
  };

  const facilities = [
    { icon: Wifi, label: language === 'ar' ? 'واي فاي' : 'WiFi' },
    { icon: Car, label: language === 'ar' ? 'موقف سيارات' : 'Parking' },
    { icon: Waves, label: language === 'ar' ? 'مسبح' : 'Pool' },
    { icon: Wind, label: language === 'ar' ? 'تكييف' : 'AC' },
    { icon: Dumbbell, label: language === 'ar' ? 'صالة رياضية' : 'Gym' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Image Header with Back Button */}
      <div className="relative">
        <img
          src={mainImage}
          alt={language === 'ar' ? hotel.name_ar : hotel.name_en}
          className="w-full h-80 object-cover"
          onClick={() => {
            setGalleryIndex(0);
            setGalleryOpen(true);
          }}
        />
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
          <span>Virtual Tour</span>
        </div>
        {hotelImages.length > 1 && (
          <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
            {hotelImages.length} {t({ ar: 'صورة', en: 'images' })}
          </div>
        )}
      </div>

      {/* Hotel Info Card */}
      <div className="px-4 -mt-6 relative z-10">
        <Card className="shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h1 className="text-xl font-bold flex-1">
                {language === 'ar' ? hotel.name_ar : hotel.name_en}
              </h1>
              <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="font-bold text-sm">{hotel.rating}</span>
              </div>
            </div>

            <div className="flex items-center text-muted-foreground text-sm mb-3">
              <MapPin className="w-4 h-4 ml-1" />
              <span>{hotel.location}</span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-2xl font-bold text-primary">
                  ${avgPricePerNight !== null ? Math.round(avgPricePerNight) : hotel.price_per_night}
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  {t({ ar: '/لليلة', en: 'Per Night' })}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span>{hotel.rating} (86 {t({ ar: 'تقييم', en: 'Reviews' })})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      <div className="px-4 mt-4 space-y-4">
        {/* Description */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center justify-between">
            <span>{t({ ar: 'الوصف', en: 'Description' })}</span>
            <button className="text-sm text-primary">
              {t({ ar: 'المراجعات', en: 'Reviews' })}
            </button>
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {language === 'ar' ? hotel.description_ar : hotel.description_en}
          </p>
        </div>

        {/* Facilities */}
        <div>
          <h3 className="font-semibold mb-3">{t({ ar: 'المرافق', en: 'Facilities' })}</h3>
          <div className="grid grid-cols-5 gap-3">
            {facilities.map((facility, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center">
                  <facility.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-center">{facility.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground p-4 shadow-lg rounded-t-3xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs opacity-80">{t({ ar: 'السعر الإجمالي', en: 'Total Price' })}</p>
            <p className="text-2xl font-bold">${Math.round(calculateTotal())}</p>
          </div>
          <Button
            onClick={() => {
              if (!hotel?.id) {
                console.error('Hotel ID is missing');
                return;
              }
              navigate(`/booking/${hotel.id}?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}&rooms=${rooms}`)
            }}
            className="bg-card text-primary hover:bg-card/90 h-12 px-8 rounded-xl font-semibold"
          >
            {t({ ar: 'احجز الآن', en: 'Book Now' })}
          </Button>
        </div>
      </div>

      <ImageGallery
        images={hotelImages}
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        initialIndex={galleryIndex}
      />
    </div>
  );
}
