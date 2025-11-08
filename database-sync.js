import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYNC_API_URL = 'http://localhost:3001/database-sync';

/**
 * مزامنة قاعدة البيانات
 */
export async function syncDatabase(operation) {
  try {
    const response = await fetch(SYNC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation,
        source: 'ai',
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log(`✓ تم مزامنة قاعدة البيانات: ${operation.type}`);
    return result;
  } catch (error) {
    console.error('خطأ في مزامنة قاعدة البيانات:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * إضافة مستخدم
 */
export async function syncAddUser(userData) {
  return await syncDatabase({
    type: 'add_user',
    table: 'users',
    data: userData
  });
}

/**
 * تحديث مستخدم
 */
export async function syncUpdateUser(userId, userData) {
  return await syncDatabase({
    type: 'update_user',
    table: 'users',
    id: userId,
    data: userData
  });
}

/**
 * حذف مستخدم
 */
export async function syncDeleteUser(userId) {
  return await syncDatabase({
    type: 'delete_user',
    table: 'users',
    id: userId
  });
}

/**
 * إضافة طلب
 */
export async function syncAddBooking(bookingData) {
  return await syncDatabase({
    type: 'add_booking',
    table: 'bookings',
    data: bookingData
  });
}

/**
 * تحديث طلب
 */
export async function syncUpdateBooking(bookingId, bookingData) {
  return await syncDatabase({
    type: 'update_booking',
    table: 'bookings',
    id: bookingId,
    data: bookingData
  });
}

/**
 * حذف طلب
 */
export async function syncDeleteBooking(bookingId) {
  return await syncDatabase({
    type: 'delete_booking',
    table: 'bookings',
    id: bookingId
  });
}

/**
 * تحديث جدول عام
 */
export async function syncTableUpdate(table, operation, data) {
  return await syncDatabase({
    type: `${operation}_${table}`,
    table: table,
    operation: operation,
    data: data
  });
}




