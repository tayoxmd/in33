import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Check, X, ArrowRight } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Hotel {
  id: string;
  name_ar: string;
  name_en: string;
  location: string;
  price_per_night: number;
  rating: number;
  images: any;
  amenities?: any;
  meal_plans?: any;
  max_guests_per_room: number;
  tax_percentage: number;
}

export default function HotelComparison() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  const hotelIds = searchParams.get('ids')?.split(',') || [];

  useEffect(() => {
    const fetchHotels = async () => {
      if (hotelIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from('hotels')
        .select('*')
        .in('id', hotelIds);

      if (data) {
        setHotels(data);
      }
      setLoading(false);
    };

    fetchHotels();
  }, []);

  const amenitiesList = [
    { key: 'wifi', label: { ar: 'واي فاي', en: 'WiFi' } },
    { key: 'parking', label: { ar: 'مواقف سيارات', en: 'Parking' } },
    { key: 'restaurant', label: { ar: 'مطعم', en: 'Restaurant' } },
    { key: 'cafe', label: { ar: 'مقهى', en: 'Cafe' } },
    { key: 'shuttle', label: { ar: 'خدمة النقل', en: 'Shuttle' } },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (hotels.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4">
            {t('لم يتم اختيار فنادق للمقارنة', 'No hotels selected for comparison')}
          </h1>
          <Button onClick={() => navigate('/search')}>
            {t('البحث عن فنادق', 'Search Hotels')}
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-24">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowRight className="ml-2 w-4 h-4" />
          {t('العودة', 'Back')}
        </Button>

        <h1 className="text-3xl font-bold mb-8">
          {t('مقارنة الفنادق', 'Hotel Comparison')}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <Card key={hotel.id} className="card-luxury">
              <CardHeader>
                <img
                  src={hotel.images?.[0] || "https://images.unsplash.com/photo-1566073771259-6a8506099945"}
                  alt={language === 'ar' ? hotel.name_ar : hotel.name_en}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <CardTitle className="text-xl">
                  {language === 'ar' ? hotel.name_ar : hotel.name_en}
                </CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {hotel.location}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-primary fill-primary" />
                    <span className="font-semibold">{hotel.rating}</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {hotel.price_per_night} {t('ر.س', 'SAR')}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">
                    {t('المرافق', 'Amenities')}
                  </h3>
                  <div className="space-y-2">
                    {amenitiesList.map((amenity) => (
                      <div key={amenity.key} className="flex items-center gap-2">
                        {hotel.amenities?.[amenity.key] ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm">
                          {language === 'ar' ? amenity.label.ar : amenity.label.en}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {hotel.meal_plans && (
                  <div>
                    <h3 className="font-semibold mb-2">
                      {t('خطة الوجبات', 'Meal Plan')}
                    </h3>
                    <Badge variant="secondary">
                      {language === 'ar' 
                        ? hotel.meal_plans.regular_ar 
                        : hotel.meal_plans.regular_en}
                    </Badge>
                  </div>
                )}

                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">{t('سعة الغرفة', 'Room Capacity')}:</span>{' '}
                    <span className="font-medium">{hotel.max_guests_per_room} {t('أشخاص', 'persons')}</span>
                  </p>
                  {hotel.tax_percentage > 0 && (
                    <p>
                      <span className="text-muted-foreground">{t('الضريبة', 'Tax')}:</span>{' '}
                      <span className="font-medium">{hotel.tax_percentage}%</span>
                    </p>
                  )}
                </div>

                <Button
                  className="w-full btn-luxury"
                  onClick={() => navigate(`/hotel/${hotel.id}`)}
                >
                  {t('عرض التفاصيل', 'View Details')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}