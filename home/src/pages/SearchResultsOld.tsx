import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { HotelCard } from "@/components/HotelCard";
import { SearchBox } from "@/components/SearchBox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Hotel {
  id: string;
  name_ar: string;
  name_en: string;
  location: string;
  price_per_night: number;
  rating: number;
  images: any;
  description_ar: string;
  description_en: string;
  meal_plans?: any;
  amenities?: any;
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const cityId = searchParams.get('city');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');
  const rooms = searchParams.get('rooms');
  
  // Store search params in localStorage for persistence
  useEffect(() => {
    if (checkIn) localStorage.setItem('searchCheckIn', checkIn);
    if (checkOut) localStorage.setItem('searchCheckOut', checkOut);
    if (guests) localStorage.setItem('searchGuests', guests);
    if (rooms) localStorage.setItem('searchRooms', rooms);
  }, [checkIn, checkOut, guests, rooms]);

  useEffect(() => {
    async function fetchHotels() {
      const { data, error } = await supabase.rpc('get_public_hotels', {
        p_city_id: cityId || null,
        p_active_only: true
      });

      if (error) {
        console.error('Error fetching hotels:', error);
      }
      
      if (data) setHotels(data);
      setLoading(false);
    }
    fetchHotels();
  }, [cityId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6" ref={searchBoxRef}>
          <Collapsible open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {t({ ar: 'نتائج البحث', en: 'Search Results', fr: 'Résultats de recherche', es: 'Resultados de búsqueda', ru: 'Результаты поиска', id: 'Hasil Pencarian', ms: 'Hasil Carian' })}
                </h1>
                <p className="text-muted-foreground">
                  {t({ ar: `تم العثور على ${hotels.length} فندق`, en: `Found ${hotels.length} hotels`, fr: `${hotels.length} hôtels trouvés`, es: `Se encontraron ${hotels.length} hoteles`, ru: `Найдено отелей: ${hotels.length}`, id: `Ditemukan ${hotels.length} hotel`, ms: `Ditemui ${hotels.length} hotel` })}
                </p>
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  {isSearchOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {t({ ar: 'تعديل خيارات البحث', en: 'Edit Search Options' })}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="mb-8">
              <div className="scale-95 origin-top">
                <SearchBox 
                  initialValues={{ 
                    city: cityId,
                    checkIn,
                    checkOut,
                    guests,
                    rooms
                  }}
                  onSearch={() => {
                    // Scroll to the search box (top of collapsible)
                    searchBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              id={hotel.id}
              name={language === 'ar' ? hotel.name_ar : hotel.name_en}
              nameEn={hotel.name_en}
              location={hotel.location}
              price={Number(hotel.price_per_night)}
              rating={Number(hotel.rating)}
              image={hotel.images && hotel.images[0] ? hotel.images[0] : "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000"}
              images={hotel.images}
              meal_plans={hotel.meal_plans}
              amenities={hotel.amenities}
            />
          ))}
        </div>

        {hotels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {t({ ar: 'لم يتم العثور على نتائج', en: 'No results found', fr: 'Aucun résultat trouvé', es: 'No se encontraron resultados', ru: 'Результаты не найдены', id: 'Tidak ada hasil ditemukan', ms: 'Tiada hasil ditemui' })}
            </p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
