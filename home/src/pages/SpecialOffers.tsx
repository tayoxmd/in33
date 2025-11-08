import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Tag, Clock, Percent } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  valid_from: string;
  valid_to: string;
  min_booking_amount: number;
  applicable_to: string;
}

export default function SpecialOffers() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveCoupons();
  }, []);

  const fetchActiveCoupons = async () => {
    const { data } = await supabase
      .from('coupons')
      .select('*')
      .eq('active', true)
      .gte('valid_to', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (data) {
      setCoupons(data);
    }
    setLoading(false);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy', {
      locale: language === 'ar' ? ar : undefined,
    });
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
      
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-gradient-luxury">
              {t('العروض الخاصة', 'Special Offers')}
            </span>
          </h1>
          <p className="text-muted-foreground text-lg">
            {t('استفد من عروضنا الحصرية ووفر على حجوزاتك', 'Take advantage of our exclusive offers and save on your bookings')}
          </p>
        </div>

        {coupons.length === 0 ? (
          <Card className="card-luxury text-center py-12">
            <CardContent>
              <Tag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">
                {t('لا توجد عروض متاحة حالياً', 'No offers available at the moment')}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('تحقق مرة أخرى قريباً للحصول على عروض جديدة', 'Check back soon for new offers')}
              </p>
              <Button onClick={() => navigate('/search')}>
                {t('تصفح الفنادق', 'Browse Hotels')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <Card key={coupon.id} className="card-luxury hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="default" className="gap-1">
                      <Percent className="w-3 h-3" />
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}%` 
                        : `${coupon.discount_value} ${t('ر.س', 'SAR')}`}
                    </Badge>
                    <Tag className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-primary">
                    {coupon.code}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {t('ساري حتى', 'Valid until')}: {formatDate(coupon.valid_to)}
                      </span>
                    </div>
                    {coupon.min_booking_amount > 0 && (
                      <p className="text-muted-foreground">
                        {t('الحد الأدنى للحجز', 'Minimum booking')}: {coupon.min_booking_amount} {t('ر.س', 'SAR')}
                      </p>
                    )}
                    <p className="text-muted-foreground">
                      {t('ينطبق على', 'Applies to')}: {
                        coupon.applicable_to === 'all' 
                          ? t('جميع الفنادق', 'All hotels')
                          : t('فنادق مختارة', 'Selected hotels')
                      }
                    </p>
                  </div>
                  <Button
                    className="w-full btn-luxury"
                    onClick={() => navigate('/search')}
                  >
                    {t('احجز الآن', 'Book Now')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}