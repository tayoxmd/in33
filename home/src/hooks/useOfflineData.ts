import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineSync } from '@/utils/offlineSync';

interface UseOfflineDataOptions {
  table: string;
  query?: any;
  cacheKey: string;
  maxAge?: number; // بالميلي ثانية
}

export function useOfflineData<T>({
  table,
  query,
  cacheKey,
  maxAge = 5 * 60 * 1000, // 5 دقائق افتراضياً
}: UseOfflineDataOptions) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // محاولة الحصول على البيانات من الكاش أولاً
        const cachedData = offlineSync.getCachedData(cacheKey, maxAge);
        
        if (cachedData && !isOnline) {
          // إذا كان الكاش موجود وغير متصل، استخدم الكاش
          setData(cachedData);
          setLoading(false);
          return;
        }

        if (isOnline) {
          // إذا كان متصلاً، اجلب البيانات الجديدة
          const supabaseQuery = (supabase as any).from(table).select(query || '*');
          
          const { data: freshData, error: fetchError } = await supabaseQuery;

          if (fetchError) throw fetchError;

          // تخزين البيانات في الكاش
          await offlineSync.cacheData(cacheKey, freshData);
          setData(freshData as T);
        } else if (cachedData) {
          // إذا كان غير متصل ويوجد كاش (حتى لو قديم)
          setData(cachedData);
        } else {
          // لا يوجد كاش وغير متصل
          throw new Error('لا يوجد اتصال بالإنترنت ولا توجد بيانات مخزنة');
        }

        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('خطأ في جلب البيانات:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [table, query, cacheKey, maxAge, isOnline]);

  const refetch = async () => {
    setLoading(true);
    const cachedData = offlineSync.getCachedData(cacheKey, maxAge);
    
    if (isOnline) {
      try {
        const supabaseQuery = (supabase as any).from(table).select(query || '*');
        const { data: freshData, error: fetchError } = await supabaseQuery;

        if (fetchError) throw fetchError;

        await offlineSync.cacheData(cacheKey, freshData);
        setData(freshData as T);
        setError(null);
      } catch (err) {
        setError(err as Error);
      }
    } else if (cachedData) {
      setData(cachedData);
    }
    
    setLoading(false);
  };

  return { data, loading, error, isOnline, refetch };
}
