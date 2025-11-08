import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, addDays } from "date-fns";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Hotel {
  id: string;
  name_ar: string;
  name_en: string;
  location: string;
  price_per_night: number;
  rating: number;
  images: any;
  city_name_ar: string;
  city_name_en: string;
}

export default function NoResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [nearbyHotels, setNearbyHotels] = useState<Hotel[]>([]);
  const [alternateDateHotels, setAlternateDateHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  const cityId = searchParams.get('city');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');
  const rooms = searchParams.get('rooms');

  useEffect(() => {
    fetchAlternatives();
  }, [cityId]);

  const fetchAlternatives = async () => {
    // Fetch nearby hotels in the same city
    const { data: nearbyData } = await supabase.rpc('get_public_hotels', {
      p_city_id: cityId || null,
      p_active_only: true
    });
    
    if (nearbyData) {
      setNearbyHotels(nearbyData.slice(0, 3));
    }

    // Fetch hotels with alternate dates (a few days later)
    const alternateCheckIn = checkIn ? format(addDays(new Date(checkIn), 3), 'yyyy-MM-dd') : null;
    const alternateCheckOut = checkOut ? format(addDays(new Date(checkOut), 3), 'yyyy-MM-dd') : null;
    
    const { data: alternateData } = await supabase.rpc('get_public_hotels', {
      p_city_id: cityId || null,
      p_active_only: true
    });
    
    if (alternateData) {
      setAlternateDateHotels(alternateData.slice(0, 3));
    }

    setLoading(false);
  };

  const handleHotelClick = (hotelId: string, useAlternateDates: boolean = false) => {
    const params = new URLSearchParams();
    if (useAlternateDates) {
      const alternateCheckIn = checkIn ? format(addDays(new Date(checkIn), 3), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      const alternateCheckOut = checkOut ? format(addDays(new Date(checkOut), 3), 'yyyy-MM-dd') : format(addDays(new Date(), 1), 'yyyy-MM-dd');
      params.set('checkIn', alternateCheckIn);
      params.set('checkOut', alternateCheckOut);
    } else {
      if (checkIn) params.set('checkIn', checkIn);
      if (checkOut) params.set('checkOut', checkOut);
    }
    if (guests) params.set('guests', guests);
    if (rooms) params.set('rooms', rooms);
    navigate(`/hotel/${hotelId}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const renderHotelCard = (hotel: Hotel, useAlternateDates: boolean = false) => {
    const mainImage = hotel.images && hotel.images[0] 
      ? hotel.images[0] 
      : "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000";

    return (
      <Card key={hotel.id} className="card-luxury hover-lift cursor-pointer overflow-hidden">
        <div className="relative h-48">
          <img
            src={mainImage}
            alt={language === 'ar' ? hotel.name_ar : hotel.name_en}
            className="w-full h-full object-cover"
          />
          <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
            <Star className="w-3 h-3 ml-1 fill-current" />
            {hotel.rating}
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="text-xl font-bold mb-2">
            {language === 'ar' ? hotel.name_ar : hotel.name_en}
          </h3>
          <div className="flex items-center text-muted-foreground mb-3">
            <MapPin className="w-4 h-4 ml-1" />
            <span className="text-sm">{language === 'ar' ? hotel.city_name_ar : hotel.city_name_en}</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-primary">{hotel.price_per_night}</span>
              <span className="text-sm text-muted-foreground mr-1">
                {t({ ar: 'ر.س / ليلة', en: 'SAR / night' })}
              </span>
            </div>
            <Button 
              className="btn-luxury"
              onClick={() => handleHotelClick(hotel.id, useAlternateDates)}
            >
              {t({ ar: 'عرض التفاصيل', en: 'View Details' })}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* No Results Message */}
        <div className="text-center mb-12">
          <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-bold mb-4">
            {t({ ar: 'عذراً، لم نتمكن من العثور على نتائج', en: 'Sorry, we couldn\'t find any results' })}
          </h1>
          <p className="text-muted-foreground">
            {t({ ar: 'لكن لدينا بعض الاقتراحات البديلة لك', en: 'But we have some alternative suggestions for you' })}
          </p>
        </div>

        {/* Alternate Dates Section */}
        <div className="mb-12">
          <Card className="card-luxury mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-2">
                {t({ ar: 'جرب إمكانية في تواريخ أخرى', en: 'Try alternative dates' })}
              </h2>
              <p className="text-muted-foreground">
                {t({ ar: 'فنادق متاحة في تواريخ قريبة من اختيارك', en: 'Hotels available in dates close to your selection' })}
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {alternateDateHotels.map((hotel) => renderHotelCard(hotel, true))}
          </div>
        </div>

        {/* Nearby Hotels Section */}
        <div>
          <Card className="card-luxury mb-6">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-2">
                {t({ ar: 'إمكانية في فنادق قريبة', en: 'Nearby hotels available' })}
              </h2>
              <p className="text-muted-foreground">
                {t({ ar: 'فنادق أخرى في نفس المدينة', en: 'Other hotels in the same city' })}
              </p>
            </CardContent>
          </Card>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyHotels.map((hotel) => renderHotelCard(hotel, false))}
          </div>
        </div>

        {/* No alternatives available */}
        {nearbyHotels.length === 0 && alternateDateHotels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {t({ ar: 'لا توجد فنادق متاحة حالياً', en: 'No hotels available at the moment' })}
            </p>
            <Button 
              onClick={() => navigate('/')} 
              className="btn-luxury mt-4"
            >
              {t({ ar: 'العودة للصفحة الرئيسية', en: 'Back to Home' })}
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}