import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Star, MapPin, ChevronDown, ChevronUp, SlidersHorizontal } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { HotelCard } from "@/components/HotelCard";
import { SearchBox } from "@/components/SearchBox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { calculateSeasonalPrice } from "@/utils/seasonalPricing";

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
  location_url?: string;
  bed_type_single?: string;
  bed_type_double?: string;
  max_guests_per_room?: number;
  seasonal_price?: number;
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [filteredHotels, setFilteredHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const cityId = searchParams.get('city');
  const checkIn = searchParams.get('checkIn');
  const checkOut = searchParams.get('checkOut');
  const guests = searchParams.get('guests');
  const rooms = searchParams.get('rooms');

  // Filter states
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  
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
      
      if (data) {
        // Calculate seasonal prices for all hotels
        const checkInDate = checkIn ? new Date(checkIn) : new Date();
        const checkOutDate = checkOut ? new Date(checkOut) : new Date(Date.now() + 86400000);
        
        const hotelsWithSeasonalPrice = await Promise.all(
          data.map(async (hotel: Hotel) => {
            const seasonalPrice = await calculateSeasonalPrice(
              hotel.id,
              checkInDate,
              checkOutDate,
              hotel.price_per_night
            );
            return {
              ...hotel,
              seasonal_price: seasonalPrice
            };
          })
        );
        
        setHotels(hotelsWithSeasonalPrice);
        setFilteredHotels(hotelsWithSeasonalPrice);
        
        // Set initial price range based on seasonal prices
        if (hotelsWithSeasonalPrice.length > 0) {
          const prices = hotelsWithSeasonalPrice.map((h: Hotel) => h.seasonal_price || h.price_per_night);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          setPriceRange([minPrice, maxPrice]);
        }
      }
      setLoading(false);
    }
    fetchHotels();
  }, [cityId, checkIn, checkOut]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...hotels];

    // Filter by price (use seasonal price if available)
    result = result.filter(h => {
      const price = h.seasonal_price || h.price_per_night;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Filter by rating
    if (minRating > 0) {
      result = result.filter(h => h.rating >= minRating);
    }

    // Filter by amenities
    if (selectedAmenities.length > 0) {
      result = result.filter(h => {
        if (!h.amenities) return false;
        return selectedAmenities.every(amenity => h.amenities[amenity] === true);
      });
    }

    // Filter by meal plans
    if (selectedAmenities.includes('meal_plans')) {
      result = result.filter(h => h.meal_plans !== null);
    }

    // Sort (use seasonal price if available)
    switch (sortBy) {
      case 'price_low':
        result.sort((a, b) => (a.seasonal_price || a.price_per_night) - (b.seasonal_price || b.price_per_night));
        break;
      case 'price_high':
        result.sort((a, b) => (b.seasonal_price || b.price_per_night) - (a.seasonal_price || a.price_per_night));
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'distance':
        // Would need distance calculation - placeholder for now
        break;
      default:
        // Keep original order (recommended)
        break;
    }

    setFilteredHotels(result);
  }, [hotels, sortBy, priceRange, selectedAmenities, minRating]);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

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
                  {t({ ar: 'نتائج البحث', en: 'Search Results' })}
                </h1>
                <p className="text-muted-foreground">
                  {t({ ar: `تم العثور على ${filteredHotels.length} فندق`, en: `Found ${filteredHotels.length} hotels` })}
                </p>
              </div>
              <CollapsibleTrigger asChild>
                <Button className="flex items-center gap-2 text-white" style={{ backgroundColor: '#237bff' }}>
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
                    searchBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Compact Filters Bar */}
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">{t({ ar: 'موصى به', en: 'Recommended' })}</SelectItem>
                <SelectItem value="price_low">{t({ ar: 'السعر ↑', en: 'Price ↑' })}</SelectItem>
                <SelectItem value="price_high">{t({ ar: 'السعر ↓', en: 'Price ↓' })}</SelectItem>
                <SelectItem value="rating">{t({ ar: 'التقييم', en: 'Rating' })}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range Badge */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <span className="text-xs">{priceRange[0]}-{priceRange[1]} {t({ ar: 'ريال', en: 'SAR' })}</span>
          </Button>

          {/* Rating Filter */}
          <Select value={minRating.toString()} onValueChange={(v) => setMinRating(Number(v))}>
            <SelectTrigger className="w-[120px] h-9">
              <SelectValue placeholder={t({ ar: 'التقييم', en: 'Rating' })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">{t({ ar: 'الكل', en: 'All' })}</SelectItem>
              <SelectItem value="3">3+ ⭐</SelectItem>
              <SelectItem value="4">4+ ⭐</SelectItem>
              <SelectItem value="4.5">4.5+ ⭐</SelectItem>
            </SelectContent>
          </Select>

          {/* Amenity Icons */}
          <div className="flex items-center gap-2">
            <Button
              variant={selectedAmenities.includes('wifi') ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
              onClick={() => toggleAmenity('wifi')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
              </svg>
            </Button>
            
            <Button
              variant={selectedAmenities.includes('parking') ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
              onClick={() => toggleAmenity('parking')}
            >
              <span className="text-sm font-bold">P</span>
            </Button>

            <Button
              variant={selectedAmenities.includes('restaurant') ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
              onClick={() => toggleAmenity('restaurant')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 6v8h3v8h2V2c-2.76 0-5 2.24-5 4zm-5 3H9V2H7v7H5V2H3v7c0 2.21 1.79 4 4 4v9h2v-9c2.21 0 4-1.79 4-4V2h-2v7z"/>
              </svg>
            </Button>

            <Button
              variant={selectedAmenities.includes('meal_plans') ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
              onClick={() => toggleAmenity('meal_plans')}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z"/>
              </svg>
            </Button>
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-1"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
            <span className="text-xs">{t({ ar: 'المزيد', en: 'More' })}</span>
          </Button>

          {/* Reset Button - Only show when filters are active */}
          {(sortBy !== 'recommended' || minRating > 0 || selectedAmenities.length > 0 || priceRange[0] !== 0 || priceRange[1] !== 5000) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-9 text-xs text-muted-foreground"
              onClick={() => {
                setSortBy('recommended');
                setPriceRange([0, 5000]);
                setSelectedAmenities([]);
                setMinRating(0);
              }}
            >
              {t({ ar: 'إعادة تعيين', en: 'Reset' })}
            </Button>
          )}
        </div>

        {/* Advanced Filters Panel */}
        {isFilterOpen && (
          <Card className="mb-6">
            <CardContent className="pt-6 space-y-6">
              {/* Price Range */}
              <div>
                <Label>{t({ ar: 'نطاق السعر', en: 'Price Range' })}</Label>
                <div className="pt-4 pb-2">
                  <Slider
                    min={0}
                    max={5000}
                    step={50}
                    value={priceRange}
                    onValueChange={(value) => setPriceRange(value as [number, number])}
                  />
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{priceRange[0]} {t({ ar: 'ريال', en: 'SAR' })}</span>
                  <span>{priceRange[1]} {t({ ar: 'ريال', en: 'SAR' })}</span>
                </div>
              </div>

              {/* Additional Amenities */}
              <div>
                <Label className="mb-3 block">{t({ ar: 'المرافق الإضافية', en: 'Additional Amenities' })}</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="cafe"
                      checked={selectedAmenities.includes('cafe')}
                      onCheckedChange={() => toggleAmenity('cafe')}
                    />
                    <label htmlFor="cafe" className="cursor-pointer">
                      {t({ ar: 'مقهى', en: 'Cafe' })}
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="shuttle"
                      checked={selectedAmenities.includes('shuttle')}
                      onCheckedChange={() => toggleAmenity('shuttle')}
                    />
                    <label htmlFor="shuttle" className="cursor-pointer">
                      {t({ ar: 'خدمة النقل', en: 'Shuttle Service' })}
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {filteredHotels.map((hotel) => (
            <div key={hotel.id} className="w-full">
              <HotelCard
              key={hotel.id}
              id={hotel.id}
              name={language === 'ar' ? hotel.name_ar : hotel.name_en}
              nameEn={hotel.name_en}
              location={hotel.location}
              price={Number(hotel.seasonal_price || hotel.price_per_night)}
              rating={Number(hotel.rating)}
              image={hotel.images && hotel.images[0] ? hotel.images[0] : "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000"}
              images={hotel.images}
              meal_plans={hotel.meal_plans}
              amenities={hotel.amenities}
              bed_type_single={hotel.bed_type_single as any}
              bed_type_double={hotel.bed_type_double as any}
              max_guests_per_room={hotel.max_guests_per_room}
            />
            </div>
          ))}
        </div>

        {filteredHotels.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {t({ ar: 'لم يتم العثور على نتائج تطابق معايير البحث', en: 'No results found matching your criteria' })}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSortBy('recommended');
                setPriceRange([0, 5000]);
                setSelectedAmenities([]);
                setMinRating(0);
              }}
            >
              {t({ ar: 'إعادة تعيين الفلاتر', en: 'Reset Filters' })}
            </Button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
