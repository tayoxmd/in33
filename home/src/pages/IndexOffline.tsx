import { Header } from "@/components/Header";
import { SearchBox } from "@/components/SearchBox";
import { HotelCard } from "@/components/HotelCard";
import { Footer } from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { LiveChatButton } from "@/components/LiveChatButton";
import { HeroSlideshow } from "@/components/HeroSlideshow";
import { useOfflineData } from "@/hooks/useOfflineData";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  meal_plans?: any;
  amenities?: any;
  bed_type_single?: string;
  bed_type_double?: string;
  max_guests_per_room?: number;
}

const IndexOffline = () => {
  const { language } = useLanguage();
  
  const { data: hotels, loading, error, isOnline } = useOfflineData<Hotel[]>({
    table: 'hotels',
    cacheKey: 'featured_hotels',
    maxAge: 10 * 60 * 1000, // 10 دقائق
  });

  const displayHotels = hotels?.slice(0, 10) || [];

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <LiveChatButton />

      {/* Hero Section */}
      <section className="relative min-h-[500px] md:min-h-[650px] flex items-center justify-center pt-20 overflow-hidden">
        <HeroSlideshow />

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold text-primary mb-6 drop-shadow-lg">جوار الحرم</h1>
            <p className="text-xl text-primary/90 max-w-2xl mx-auto drop-shadow-md">
              احجز أفضل الفنادق والشقق الفندقية بأسعار تنافسية وخدمة استثنائية
            </p>
          </div>

          <div className="mt-32">
            <SearchBox />
          </div>
        </div>
      </section>

      {/* Featured Hotels Section */}
      <section className="container mx-auto px-4 py-16" id="hotels">
        <div className="text-center mb-12 animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            <span className="text-gradient-luxury">الفنادق المميزة</span>
          </h2>
          <p className="text-muted-foreground text-lg">اختر من بين مجموعة مختارة من أفضل الفنادق والشقق الفندقية</p>
          
          {!isOnline && (
            <Alert className="mt-4 max-w-2xl mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                تعمل حالياً في وضع عدم الاتصال - يتم عرض البيانات المحفوظة
              </AlertDescription>
            </Alert>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
            {displayHotels.map((hotel, index) => (
              <div key={hotel.id} style={{ animationDelay: `${index * 100}ms` }} className="animate-fade-in-up w-full">
                <HotelCard
                  id={hotel.id}
                  name={language === "ar" ? hotel.name_ar : hotel.name_en}
                  nameEn={hotel.name_en}
                  location={`${language === "ar" ? hotel.city_name_ar : hotel.city_name_en}`}
                  price={Number(hotel.price_per_night)}
                  rating={Number(hotel.rating)}
                  image={
                    hotel.images && hotel.images[0]
                      ? hotel.images[0]
                      : "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000"
                  }
                  images={hotel.images}
                  featured={index < 2}
                  meal_plans={hotel.meal_plans}
                  amenities={hotel.amenities}
                  bed_type_single={hotel.bed_type_single as any}
                  bed_type_double={hotel.bed_type_double as any}
                  max_guests_per_room={hotel.max_guests_per_room}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="container mx-auto px-4 py-16" id="about">
        <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            <span className="text-gradient-luxury">لماذا IN33؟</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed mb-8">
            نحن في IN33 نؤمن بأن إدارة النقل يجب أن تكون فعالة وموثوقة. نوفر لك أفضل الحلول لإدارة عمليات النقل
            الفاخرة بأسعار تنافسية وخدمة عملاء متميزة على مدار الساعة.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-6 mt-12 max-w-2xl mx-auto">
            <div className="card-luxury p-6">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <p className="text-muted-foreground">فندق وشقة فندقية</p>
            </div>
            <div className="card-luxury p-6">
              <div className="text-4xl font-bold text-primary mb-2">4.8</div>
              <p className="text-muted-foreground">تقييم العملاء</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IndexOffline;
