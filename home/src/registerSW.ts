import { registerSW } from 'virtual:pwa-register';
import { offlineSync } from './utils/offlineSync';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('تحديث جديد متاح - سيتم تحديث التطبيق تلقائياً');
    // تحديث التطبيق تلقائياً
    updateSW(true);
  },
  onOfflineReady() {
    console.log('التطبيق جاهز للعمل بدون اتصال بالإنترنت');
  },
  onRegistered(registration) {
    console.log('Service Worker مسجل بنجاح');
    
    // فحص التحديثات كل دقيقة
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60000);
    }
  },
  immediate: true,
});

// مزامنة البيانات عند التحديث
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('تم تحديث الكاش - إعادة تحميل البيانات');
      window.location.reload();
    }
  });
}

// بدء المزامنة عند فتح التطبيق
offlineSync.init().then(() => {
  if (navigator.onLine) {
    offlineSync.syncPendingOperations().catch(console.error);
  }
}).catch(console.error);

export { updateSW };
