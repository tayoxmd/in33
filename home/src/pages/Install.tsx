import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Smartphone, Wifi, WifiOff } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Install() {
  const { t, language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsInstallable(false);
    });

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', () => {});
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Smartphone className="w-20 h-20 mx-auto mb-4 text-primary" />
            <h1 className="text-4xl font-bold mb-4">
              {t({ ar: 'ثبّت تطبيق جوار الحرم', en: 'Install Jawaar Al Haram App' })}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t({ 
                ar: 'استمتع بتجربة أفضل مع التطبيق على جوالك', 
                en: 'Enjoy a better experience with the app on your phone' 
              })}
            </p>
          </div>

          {/* Installation Status */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-orange-500" />
                )}
                {t({ ar: 'حالة التطبيق', en: 'App Status' })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span>{t({ ar: 'حالة الاتصال', en: 'Connection Status' })}</span>
                <span className={isOnline ? 'text-green-600' : 'text-orange-600'}>
                  {isOnline 
                    ? t({ ar: 'متصل', en: 'Online' })
                    : t({ ar: 'غير متصل (يعمل)', en: 'Offline (Working)' })
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span>{t({ ar: 'حالة التثبيت', en: 'Installation Status' })}</span>
                <span className={isInstalled ? 'text-green-600' : 'text-blue-600'}>
                  {isInstalled 
                    ? t({ ar: 'مثبت ✓', en: 'Installed ✓' })
                    : t({ ar: 'غير مثبت', en: 'Not Installed' })
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Install Button */}
          {!isInstalled && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  {t({ ar: 'تثبيت التطبيق', en: 'Install App' })}
                </CardTitle>
                <CardDescription>
                  {t({ 
                    ar: 'اضغط على الزر أدناه لتثبيت التطبيق على جهازك', 
                    en: 'Click the button below to install the app on your device' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isInstallable ? (
                  <Button 
                    onClick={handleInstallClick} 
                    size="lg" 
                    className="w-full"
                  >
                    <Download className="ml-2 h-5 w-5" />
                    {t({ ar: 'تثبيت التطبيق الآن', en: 'Install App Now' })}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-muted-foreground text-center">
                      {t({ 
                        ar: 'للتثبيت على جهازك:', 
                        en: 'To install on your device:' 
                      })}
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="p-4 bg-muted rounded-lg">
                        <strong className="block mb-2">
                          {t({ ar: 'على آيفون (Safari):', en: 'On iPhone (Safari):' })}
                        </strong>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>{t({ ar: 'اضغط على زر المشاركة', en: 'Tap the Share button' })} 📤</li>
                          <li>{t({ ar: 'اختر "إضافة إلى الشاشة الرئيسية"', en: 'Choose "Add to Home Screen"' })}</li>
                          <li>{t({ ar: 'اضغط "إضافة"', en: 'Tap "Add"' })}</li>
                        </ol>
                      </div>
                      
                      <div className="p-4 bg-muted rounded-lg">
                        <strong className="block mb-2">
                          {t({ ar: 'على أندرويد (Chrome):', en: 'On Android (Chrome):' })}
                        </strong>
                        <ol className="list-decimal list-inside space-y-1">
                          <li>{t({ ar: 'اضغط على قائمة المتصفح (⋮)', en: 'Tap browser menu (⋮)' })}</li>
                          <li>{t({ ar: 'اختر "إضافة إلى الشاشة الرئيسية"', en: 'Choose "Add to Home Screen"' })}</li>
                          <li>{t({ ar: 'اضغط "إضافة"', en: 'Tap "Add"' })}</li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t({ ar: 'مميزات التطبيق', en: 'App Features' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <WifiOff className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      {t({ ar: 'يعمل بدون إنترنت', en: 'Works Offline' })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t({ 
                        ar: 'تصفح الفنادق وحجوزاتك حتى بدون اتصال بالإنترنت', 
                        en: 'Browse hotels and bookings even without internet' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      {t({ ar: 'تجربة أفضل', en: 'Better Experience' })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t({ 
                        ar: 'واجهة سريعة وسلسة مثل التطبيقات الأصلية', 
                        en: 'Fast and smooth interface like native apps' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-1 flex-shrink-0">
                    <Download className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      {t({ ar: 'تحديث تلقائي', en: 'Auto Updates' })}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {t({ 
                        ar: 'يتم تحديث التطبيق تلقائياً بأحدث المميزات', 
                        en: 'App updates automatically with latest features' 
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
