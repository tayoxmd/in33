import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SYNC_API_URL = 'http://localhost:3001/update-files';

/**
 * دالة مساعدة لإرسال التحديثات من AI إلى النظام
 */
export async function syncFilesFromAI(files) {
  try {
    const response = await fetch(SYNC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: files,
        source: 'ai'
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('✓ تم مزامنة الملفات من AI');
    return result;
  } catch (error) {
    console.error('خطأ في مزامنة الملفات من AI:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * تحديث ملف واحد من AI
 */
export async function updateFileFromAI(filePath, content) {
  return await syncFilesFromAI([{
    path: filePath,
    content: content,
    action: 'update'
  }]);
}

/**
 * إنشاء ملف جديد من AI
 */
export async function createFileFromAI(filePath, content) {
  return await syncFilesFromAI([{
    path: filePath,
    content: content,
    action: 'create'
  }]);
}

/**
 * حذف ملف من AI
 */
export async function deleteFileFromAI(filePath) {
  return await syncFilesFromAI([{
    path: filePath,
    action: 'delete'
  }]);
}




