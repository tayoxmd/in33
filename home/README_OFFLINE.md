# نظام العمل بدون اتصال (Offline Mode) 📱

## المميزات الرئيسية ✨

### 1. **العمل الكامل بدون إنترنت**
- جميع الصفحات والبيانات تعمل بدون اتصال
- تخزين ذكي للبيانات المهمة
- تحديث تلقائي عند عودة الاتصال

### 2. **التحديث التلقائي**
- فحص التحديثات كل دقيقة
- تحديث تلقائي للتطبيق
- مزامنة البيانات كل 5 دقائق

### 3. **مزامنة ذكية**
- حفظ العمليات في قاعدة IndexedDB
- مزامنة تلقائية عند الاتصال
- إشعارات بحالة الاتصال

## الملفات الأساسية 📁

### 1. **نظام المزامنة** (`src/utils/offlineSync.ts`)
```typescript
import { offlineSync } from '@/utils/offlineSync';

// تخزين البيانات
await offlineSync.cacheData('hotels', hotelsData);

// استرجاع البيانات
const cachedData = offlineSync.getCachedData('hotels');

// إضافة عملية للمزامنة لاحقاً
await offlineSync.addOperation({
  type: 'insert',
  table: 'bookings',
  data: bookingData
});
```

### 2. **Hook للبيانات** (`src/hooks/useOfflineData.ts`)
```typescript
import { useOfflineData } from '@/hooks/useOfflineData';

const { data, loading, error, isOnline, refetch } = useOfflineData({
  table: 'hotels',
  cacheKey: 'featured_hotels',
  maxAge: 10 * 60 * 1000 // 10 دقائق
});
```

### 3. **مؤشر الاتصال** (`src/components/OfflineIndicator.tsx`)
- يظهر تلقائياً عند قطع الاتصال
- يعرض حالة المزامنة
- يخفي بعد 3 ثواني من الاتصال

## كيفية الاستخدام 🚀

### استخدام Hook في المكونات:

```typescript
import { useOfflineData } from '@/hooks/useOfflineData';

function MyComponent() {
  const { data: hotels, loading, isOnline } = useOfflineData({
    table: 'hotels',
    cacheKey: 'my_hotels',
    maxAge: 5 * 60 * 1000 // 5 دقائق
  });

  if (!isOnline) {
    return <Alert>تعمل في وضع عدم الاتصال</Alert>;
  }

  return <div>{/* عرض البيانات */}</div>;
}
```

### حفظ عملية للمزامنة لاحقاً:

```typescript
import { offlineSync } from '@/utils/offlineSync';

async function createBooking(bookingData) {
  try {
    if (navigator.onLine) {
      // إرسال مباشر
      await supabase.from('bookings').insert(bookingData);
    } else {
      // حفظ للمزامنة لاحقاً
      await offlineSync.addOperation({
        type: 'insert',
        table: 'bookings',
        data: bookingData
      });
    }
  } catch (error) {
    console.error('خطأ:', error);
  }
}
```

## إعدادات PWA ⚙️

في `vite.config.ts`:

```typescript
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
    runtimeCaching: [
      // تخزين الخطوط
      {
        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
        handler: 'CacheFirst',
        options: {
          cacheName: 'google-fonts-cache',
          expiration: {
            maxAgeSeconds: 60 * 60 * 24 * 365 // سنة
          }
        }
      },
      // تخزين API
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'supabase-api-cache',
          networkTimeoutSeconds: 10,
          expiration: {
            maxAgeSeconds: 60 * 5 // 5 دقائق
          }
        }
      }
    ]
  }
})
```

## التحديثات التلقائية 🔄

في `src/registerSW.ts`:

```typescript
const updateSW = registerSW({
  onNeedRefresh() {
    // تحديث تلقائي
    updateSW(true);
  },
  onRegistered(registration) {
    // فحص كل دقيقة
    if (registration) {
      setInterval(() => {
        registration.update();
      }, 60000);
    }
  }
});
```

## مثال: صفحة Index مع دعم Offline

راجع `src/pages/IndexOffline.tsx` للمثال الكامل.

## التخزين المؤقت 💾

### البيانات المخزنة:
- **الصور**: 30 يوم
- **JavaScript/CSS**: 7 أيام
- **بيانات API**: 5 دقائق
- **الخطوط**: سنة كاملة

### IndexedDB:
- العمليات المعلقة
- البيانات المهمة
- السجلات المحلية

## الاختبار 🧪

1. افتح التطبيق على الجوال
2. اذهب إلى `/install` لتثبيته
3. أغلق الإنترنت
4. تصفح التطبيق - سيعمل كل شيء!
5. أعد الاتصال - ستتم المزامنة تلقائياً

## الأداء ⚡

- **التحميل الأول**: عادي
- **التحميل التالي**: فوري (من الكاش)
- **بدون إنترنت**: يعمل 100%
- **المزامنة**: تلقائية وذكية

## الأمان 🔒

- كل البيانات مشفرة في الكاش
- المزامنة آمنة عبر HTTPS
- لا تخزين لبيانات حساسة محلياً

## دعم المتصفحات 🌐

- ✅ Chrome/Edge (كامل)
- ✅ Safari (كامل)
- ✅ Firefox (كامل)
- ✅ تطبيقات الجوال (Capacitor)

## الصيانة 🔧

### مسح البيانات القديمة:
```typescript
offlineSync.clearOldCache(); // مسح أكبر من 24 ساعة
```

### إعادة المزامنة يدوياً:
```typescript
await offlineSync.syncPendingOperations();
```

## الدعم والمساعدة 💬

للمزيد من المعلومات:
- [Vite PWA Docs](https://vite-pwa-org.netlify.app/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
