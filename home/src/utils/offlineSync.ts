import { supabase } from '@/integrations/supabase/client';

interface PendingOperation {
  id: string;
  type: 'insert' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
}

const DB_NAME = 'in33_offline';
const STORE_NAME = 'pending_operations';
const VERSION = 1;

class OfflineSync {
  private db: IDBDatabase | null = null;

  async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  async addOperation(operation: Omit<PendingOperation, 'id' | 'timestamp'>) {
    if (!this.db) await this.init();

    const pendingOp: PendingOperation = {
      ...operation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(pendingOp);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async removeOperation(id: string) {
    if (!this.db) await this.init();

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async syncPendingOperations() {
    if (!navigator.onLine) return;

    const operations = await this.getPendingOperations();
    
    for (const op of operations) {
      try {
        switch (op.type) {
          case 'insert':
            await (supabase as any).from(op.table).insert(op.data);
            break;
          case 'update':
            await (supabase as any).from(op.table).update(op.data).eq('id', op.data.id);
            break;
          case 'delete':
            await (supabase as any).from(op.table).delete().eq('id', op.data.id);
            break;
        }
        await this.removeOperation(op.id);
      } catch (error) {
        console.error('فشل في مزامنة العملية:', error);
      }
    }
  }

  // تخزين البيانات المهمة محلياً
  async cacheData(key: string, data: any) {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('فشل في تخزين البيانات:', error);
    }
  }

  // استرجاع البيانات المخزنة
  getCachedData(key: string, maxAge: number = 5 * 60 * 1000): any | null {
    try {
      const cached = localStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp > maxAge) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return data;
    } catch (error) {
      console.error('فشل في استرجاع البيانات:', error);
      return null;
    }
  }

  // مسح البيانات القديمة
  clearOldCache(maxAge: number = 24 * 60 * 60 * 1000) {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const { timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp > maxAge) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          console.error('خطأ في مسح البيانات:', error);
        }
      }
    });
  }
}

export const offlineSync = new OfflineSync();

// بدء المزامنة عند الاتصال بالإنترنت
if (typeof window !== 'undefined') {
  offlineSync.init().catch(console.error);
  
  window.addEventListener('online', () => {
    console.log('تم الاتصال بالإنترنت - جاري المزامنة...');
    offlineSync.syncPendingOperations().catch(console.error);
  });

  window.addEventListener('offline', () => {
    console.log('انقطع الاتصال بالإنترنت - الوضع غير المتصل نشط');
  });

  // مزامنة دورية كل 5 دقائق
  setInterval(() => {
    if (navigator.onLine) {
      offlineSync.syncPendingOperations().catch(console.error);
    }
  }, 5 * 60 * 1000);

  // مسح البيانات القديمة كل ساعة
  setInterval(() => {
    offlineSync.clearOldCache();
  }, 60 * 60 * 1000);
}
