import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import AdmZip from 'adm-zip';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  HOME_DIR: path.join(__dirname, 'home'),
  BACKUP_DIR: path.join(__dirname, 'backup')
};

/**
 * عرض قائمة النسخ الاحتياطية المتاحة
 */
function listBackups() {
  if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
    console.log('لا يوجد مجلد نسخ احتياطي');
    return [];
  }
  
  const backups = fs.readdirSync(CONFIG.BACKUP_DIR)
    .filter(item => {
      const itemPath = path.join(CONFIG.BACKUP_DIR, item);
      return fs.statSync(itemPath).isDirectory() && item.startsWith('backup_');
    })
    .map(item => {
      const itemPath = path.join(CONFIG.BACKUP_DIR, item);
      const zipFiles = fs.readdirSync(itemPath).filter(f => f.endsWith('.zip'));
      const changelogPath = path.join(itemPath, 'changelog.txt');
      
      return {
        name: item,
        path: itemPath,
        zip: zipFiles.length > 0 ? path.join(itemPath, zipFiles[0]) : null,
        changelog: fs.existsSync(changelogPath) ? changelogPath : null,
        date: fs.statSync(itemPath).mtime
      };
    })
    .sort((a, b) => b.date - a.date);
  
  return backups;
}

/**
 * استعادة نسخة احتياطية
 */
async function restoreBackup(backupName) {
  const backups = listBackups();
  const backup = backups.find(b => b.name === backupName);
  
  if (!backup) {
    console.error(`لم يتم العثور على النسخة الاحتياطية: ${backupName}`);
    return false;
  }
  
  if (!backup.zip || !fs.existsSync(backup.zip)) {
    console.error(`لم يتم العثور على الملف المضغوط في النسخة الاحتياطية: ${backupName}`);
    return false;
  }
  
  console.log(`جاري استعادة النسخة الاحتياطية: ${backupName}`);
  console.log('⚠️ تحذير: سيتم استبدال جميع الملفات في مجلد home');
  
  try {
    // إنشاء نسخة احتياطية من الملفات الحالية قبل الاستعادة
    const tempBackupPath = path.join(__dirname, 'temp_backup_before_restore');
    if (fs.existsSync(CONFIG.HOME_DIR)) {
      console.log('جاري إنشاء نسخة احتياطية من الملفات الحالية...');
      const tempZip = new AdmZip();
      tempZip.addLocalFolder(CONFIG.HOME_DIR, 'home');
      tempZip.writeZip(path.join(tempBackupPath, 'before_restore.zip'));
    }
    
    // استخراج الملفات من النسخة الاحتياطية
    const zip = new AdmZip(backup.zip);
    const extractPath = path.join(__dirname, 'temp_extract');
    
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    
    fs.mkdirSync(extractPath, { recursive: true });
    zip.extractAllTo(extractPath, true);
    
    // العثور على مجلد home في الملف المستخرج
    const extractedHome = path.join(extractPath, 'home');
    
    if (!fs.existsSync(extractedHome)) {
      console.error('لم يتم العثور على مجلد home في النسخة الاحتياطية');
      return false;
    }
    
    // نسخ الملفات إلى مجلد home
    if (fs.existsSync(CONFIG.HOME_DIR)) {
      console.log('جاري حذف الملفات الحالية...');
      fs.rmSync(CONFIG.HOME_DIR, { recursive: true, force: true });
    }
    
    console.log('جاري نسخ الملفات من النسخة الاحتياطية...');
    fs.cpSync(extractedHome, CONFIG.HOME_DIR, { recursive: true });
    
    // تنظيف الملفات المؤقتة
    if (fs.existsSync(extractPath)) {
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    
    console.log('✓ تم استعادة النسخة الاحتياطية بنجاح!');
    
    // عرض سجل التغييرات
    if (backup.changelog && fs.existsSync(backup.changelog)) {
      console.log('\nسجل التغييرات:');
      console.log('='.repeat(50));
      const changelog = fs.readFileSync(backup.changelog, 'utf8');
      console.log(changelog);
      console.log('='.repeat(50));
    }
    
    return true;
  } catch (error) {
    console.error('خطأ أثناء الاستعادة:', error);
    return false;
  }
}

// عرض قائمة النسخ الاحتياطية
const backups = listBackups();

if (backups.length === 0) {
  console.log('لا توجد نسخ احتياطية متاحة');
  process.exit(0);
}

console.log('\n=== النسخ الاحتياطية المتاحة ===\n');
backups.forEach((backup, index) => {
  console.log(`${index + 1}. ${backup.name}`);
  console.log(`   التاريخ: ${backup.date.toLocaleString('ar-SA')}`);
  if (backup.changelog) {
    console.log(`   ✓ يوجد سجل تغييرات`);
  }
  console.log('');
});

// يمكن استخدام الأمر: node restore-backup.js backup_2025-11-06_08-52-08
const backupName = process.argv[2];

if (backupName) {
  restoreBackup(backupName).then(success => {
    process.exit(success ? 0 : 1);
  });
} else {
  console.log('لاستعادة نسخة احتياطية، استخدم:');
  console.log(`node restore-backup.js backup_YYYY-MM-DD_HH-MM-SS`);
  console.log('\nمثال:');
  console.log(`node restore-backup.js ${backups[0].name}`);
}




