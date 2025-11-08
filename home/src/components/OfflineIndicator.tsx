import { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { offlineSync } from '@/utils/offlineSync';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setShowIndicator(true);
      setIsSyncing(true);
      
      try {
        await offlineSync.syncPendingOperations();
      } catch (error) {
        console.error('فشلت المزامنة:', error);
      } finally {
        setIsSyncing(false);
        setTimeout(() => setShowIndicator(false), 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // عرض المؤشر لمدة 3 ثواني عند التحميل إذا كان غير متصل
    if (!navigator.onLine) {
      setShowIndicator(true);
      setTimeout(() => setShowIndicator(false), 3000);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [t]);

  if (!showIndicator && isOnline) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-all duration-300',
        isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-orange-500 text-white'
      )}
      dir="rtl"
    >
      {isSyncing ? (
        <RefreshCw className="w-5 h-5 animate-spin" />
      ) : isOnline ? (
        <Wifi className="w-5 h-5" />
      ) : (
        <WifiOff className="w-5 h-5" />
      )}
      
      <span className="text-sm font-medium">
        {isSyncing 
          ? t({ ar: 'جاري المزامنة...', en: 'Syncing...' })
          : isOnline 
            ? t({ ar: 'متصل بالإنترنت', en: 'Online' })
            : t({ ar: 'غير متصل - البيانات محفوظة', en: 'Offline - Data saved' })
        }
      </span>
    </div>
  );
}
