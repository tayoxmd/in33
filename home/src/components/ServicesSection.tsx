import { Card } from "@/components/ui/card";
import { Plane, Bus, Building2, Luggage } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const services = [
  {
    icon: Plane,
    titleAr: "خدمات العمرة والحج",
    titleEn: "Umrah & Hajj Services",
    descriptionAr: "باقات شاملة لأداء مناسك العمرة والحج بكل يسر وراحة",
    descriptionEn: "Comprehensive packages for performing Umrah and Hajj rituals with ease and comfort",
    gradientFrom: "#a7f3d0",
    gradientTo: "#d1fae5",
    iconColor: "#10b981"
  },
  {
    icon: Bus,
    titleAr: "خدمات النقل والمواصلات",
    titleEn: "Transportation Services",
    descriptionAr: "نوفر خدمات نقل موثوقة ومريحة من وإلى المطار والفنادق",
    descriptionEn: "We provide reliable and comfortable transportation services to and from the airport and hotels",
    gradientFrom: "#c4b5fd",
    gradientTo: "#e9d5ff",
    iconColor: "#8b5cf6"
  },
  {
    icon: Building2,
    titleAr: "خدمات الفنادق والإقامة",
    titleEn: "Hotel and Accommodation Services",
    descriptionAr: "أفضل الفنادق والشقق الفندقية بأسعار تنافسية وخدمة استثنائية",
    descriptionEn: "Best hotels and hotel apartments at competitive prices and exceptional service",
    gradientFrom: "#fed7aa",
    gradientTo: "#ffedd5",
    iconColor: "#f97316"
  },
  {
    icon: Luggage,
    titleAr: "السياحة الداخلية والخارجية",
    titleEn: "Domestic and International Tourism",
    descriptionAr: "برامج سياحية متنوعة داخل وخارج المملكة لتجربة لا تنسى",
    descriptionEn: "Diverse tourism programs inside and outside the Kingdom for an unforgettable experience",
    gradientFrom: "#bfdbfe",
    gradientTo: "#dbeafe",
    iconColor: "#3b82f6"
  }
];

export function ServicesSection() {
  const { language, t } = useLanguage();

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          <span className="text-gradient-luxury">{t("خدماتنا", "Our Services")}</span>
        </h2>
        <p className="text-muted-foreground">
          {t("نقدم مجموعة متكاملة من الخدمات السياحية المتميزة", "We offer a complete range of distinguished tourism services")}
        </p>
      </div>

      {/* Desktop & Tablet: 4 cards in one row */}
      <div className="hidden md:grid grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <Card 
              key={index}
              className="group p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-0 rounded-2xl overflow-hidden"
              style={{ 
                background: `linear-gradient(to bottom, ${service.gradientFrom}, ${service.gradientTo})`,
                animationDelay: `${index * 100}ms` 
              }}
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="flex-shrink-0">
                  <Icon 
                    className="w-12 h-12" 
                    style={{ color: service.iconColor }}
                    strokeWidth={1.5}
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-gray-900">
                    {language === "ar" ? service.titleAr : service.titleEn}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                    {language === "ar" ? service.descriptionAr : service.descriptionEn}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Mobile: 4 cards vertically filling the page */}
      <div className="md:hidden space-y-2 px-2">
        {services.map((service, index) => {
          const Icon = service.icon;
          return (
            <Card 
              key={index}
              className="group p-6 hover:shadow-lg transition-all duration-300 cursor-pointer border-0 rounded-xl overflow-hidden h-[calc(25vh-0.5rem)] min-h-[140px] flex items-center"
              style={{ 
                background: `linear-gradient(to bottom, ${service.gradientFrom}, ${service.gradientTo})`,
                animationDelay: `${index * 100}ms` 
              }}
            >
              <div className="flex items-center gap-4 w-full">
                <div className="flex-shrink-0">
                  <Icon 
                    className="w-12 h-12" 
                    style={{ color: service.iconColor }}
                    strokeWidth={1.5}
                  />
                </div>
                <div className="flex-1 space-y-2 text-right">
                  <h3 className="font-bold text-base text-gray-900">
                    {language === "ar" ? service.titleAr : service.titleEn}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                    {language === "ar" ? service.descriptionAr : service.descriptionEn}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}