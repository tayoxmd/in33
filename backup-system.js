import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';
import chokidar from 'chokidar';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// الإعدادات
const CONFIG = {
  HOME_DIR: path.join(__dirname, 'home'),
  BACKUP_DIR: path.join(__dirname, 'backup'),
  CHECK_INTERVAL: 20 * 60 * 1000, // 20 دقيقة
  EXCLUDE_PATTERNS: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    'bun.lockb',
    'backup/**'
  ]
};

let hasChanges = false;
let lastBackupHash = null;
let changeLog = [];
let watcher = null;

/**
 * حساب hash للمجلد
 */
async function calculateDirectoryHash(dir) {
  const files = [];
  
  function walkDir(currentPath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(dir, fullPath);
      
      // استبعاد الأنماط المحددة
      if (CONFIG.EXCLUDE_PATTERNS.some(pattern => {
        const glob = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
        return new RegExp(glob).test(relativePath);
      })) {
        continue;
      }
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        try {
          const stats = fs.statSync(fullPath);
          const content = fs.readFileSync(fullPath);
          files.push({
            path: relativePath,
            size: stats.size,
            mtime: stats.mtime.getTime(),
            hash: crypto.createHash('md5').update(content).digest('hex')
          });
        } catch (err) {
          console.error(`خطأ في قراءة الملف ${fullPath}:`, err.message);
        }
      }
    }
  }
  
  walkDir(dir);
  
  const combined = files.map(f => `${f.path}:${f.hash}:${f.mtime}`).sort().join('|');
  return crypto.createHash('md5').update(combined).digest('hex');
}

/**
 * إنشاء نسخة احتياطية
 */
async function createBackup() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const dateTime = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  
  const backupFolderName = `backup_${dateTime}`;
  const backupFolderPath = path.join(CONFIG.BACKUP_DIR, backupFolderName);
  
  fs.mkdirSync(backupFolderPath, { recursive: true });
  
  // إنشاء ملف سجل التغييرات
  const changelogPath = path.join(backupFolderPath, 'changelog.txt');
  const changelogContent = `نسخة احتياطية - Backup Report
تاريخ ووقت النسخة الاحتياطية: ${now.toLocaleString('ar-SA', { dateStyle: 'full', timeStyle: 'long' })}
========================================

التغييرات والاضافات:
${changeLog.length > 0 ? changeLog.map((log, idx) => `${idx + 1}. ${log}`).join('\n') : 'لا توجد تغييرات محددة'}

تفاصيل النسخة الاحتياطية:
- تم نسخ جميع الملفات
- جاهز للرفع على cPanel
- الملف المضغوط: backup_${dateTime}.zip

========================================
`;
  
  fs.writeFileSync(changelogPath, changelogContent, 'utf8');
  
  // إنشاء ملف مضغوط
  const zipFileName = `backup_${dateTime}.zip`;
  const zipFilePath = path.join(backupFolderPath, zipFileName);
  
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    output.on('close', () => {
      console.log(`✓ تم إنشاء النسخة الاحتياطية: ${zipFilePath} (${archive.pointer()} bytes)`);
      resolve({
        folder: backupFolderPath,
        zip: zipFilePath,
        changelog: changelogPath,
        timestamp: now
      });
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    
    // إضافة جميع الملفات من مجلد home
    archive.directory(CONFIG.HOME_DIR, 'home', {
      filter: (filePath) => {
        const relativePath = path.relative(CONFIG.HOME_DIR, filePath);
        return !CONFIG.EXCLUDE_PATTERNS.some(pattern => {
          const glob = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
          return new RegExp(glob).test(relativePath);
        });
      }
    });
    
    // إضافة ملف سجل التغييرات
    archive.file(changelogPath, { name: 'changelog.txt' });
    
    archive.finalize();
  });
}

/**
 * فحص التغييرات وإنشاء نسخة احتياطية
 */
async function checkAndBackup() {
  console.log('\n=== فحص التغييرات ===');
  
  try {
    const currentHash = await calculateDirectoryHash(CONFIG.HOME_DIR);
    
    if (lastBackupHash === null) {
      console.log('الفحص الأول - تحديد hash الأولي');
      lastBackupHash = currentHash;
      hasChanges = false;
      return;
    }
    
    if (currentHash !== lastBackupHash || hasChanges) {
      console.log('✓ تم اكتشاف تغييرات!');
      console.log('جاري إنشاء النسخة الاحتياطية...');
      
      const backupInfo = await createBackup();
      
      console.log('\n✓ تم إنشاء النسخة الاحتياطية بنجاح!');
      console.log(`الموقع: ${backupInfo.folder}`);
      console.log(`الملف المضغوط: ${backupInfo.zip}`);
      console.log(`سجل التغييرات: ${backupInfo.changelog}`);
      
      lastBackupHash = currentHash;
      hasChanges = false;
      changeLog = [];
      
      return backupInfo;
    } else {
      console.log('✗ لا توجد تغييرات');
      hasChanges = false;
      return null;
    }
  } catch (error) {
    console.error('خطأ أثناء فحص النسخة الاحتياطية:', error);
    return null;
  }
}

/**
 * إعداد مراقب الملفات
 */
function setupWatcher() {
  console.log('جاري إعداد مراقب الملفات...');
  
  watcher = chokidar.watch(CONFIG.HOME_DIR, {
    ignored: CONFIG.EXCLUDE_PATTERNS,
    persistent: true,
    ignoreInitial: true
  });
  
  watcher
    .on('add', (filePath) => {
      hasChanges = true;
      const relativePath = path.relative(CONFIG.HOME_DIR, filePath);
      changeLog.push(`تمت إضافة ملف جديد: ${relativePath}`);
      console.log(`تمت إضافة: ${relativePath}`);
    })
    .on('change', (filePath) => {
      hasChanges = true;
      const relativePath = path.relative(CONFIG.HOME_DIR, filePath);
      changeLog.push(`تم تعديل ملف: ${relativePath}`);
      console.log(`تم تعديل: ${relativePath}`);
    })
    .on('unlink', (filePath) => {
      hasChanges = true;
      const relativePath = path.relative(CONFIG.HOME_DIR, filePath);
      changeLog.push(`تم حذف ملف: ${relativePath}`);
      console.log(`تم حذف: ${relativePath}`);
    })
    .on('error', (error) => {
      console.error('خطأ في المراقب:', error);
    });
  
  console.log('مراقب الملفات يعمل الآن');
}

/**
 * بدء النظام
 */
async function start() {
  console.log('=== نظام النسخ الاحتياطي التلقائي ===');
  console.log(`مجلد الملفات الرئيسية: ${CONFIG.HOME_DIR}`);
  console.log(`مجلد النسخ الاحتياطي: ${CONFIG.BACKUP_DIR}`);
  console.log(`فترة الفحص: ${CONFIG.CHECK_INTERVAL / 1000 / 60} دقيقة`);
  
  if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
    fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
    console.log('تم إنشاء مجلد النسخ الاحتياطي');
  }
  
  setupWatcher();
  
  console.log('\n=== إنشاء النسخة الاحتياطية الأولى ===');
  await checkAndBackup();
  
  setInterval(async () => {
    await checkAndBackup();
  }, CONFIG.CHECK_INTERVAL);
  
  console.log(`\n✓ النظام يعمل الآن`);
  console.log(`سيتم فحص التغييرات كل ${CONFIG.CHECK_INTERVAL / 1000 / 60} دقيقة`);
  console.log('اضغط Ctrl+C لإيقاف النظام...\n');
}

// بدء النظام
start().catch(console.error);

// إيقاف النظام بشكل صحيح
process.on('SIGINT', () => {
  console.log('\n\nإيقاف النظام...');
  if (watcher) {
    watcher.close();
  }
  process.exit(0);
});




