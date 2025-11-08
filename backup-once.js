import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONFIG = {
  HOME_DIR: path.join(__dirname, 'home'),
  BACKUP_DIR: path.join(__dirname, 'backup'),
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
  
  const changelogPath = path.join(backupFolderPath, 'changelog.txt');
  const changelogContent = `نسخة احتياطية - Backup Report
تاريخ ووقت النسخة الاحتياطية: ${now.toLocaleString('ar-SA', { dateStyle: 'full', timeStyle: 'long' })}
========================================

تفاصيل النسخة الاحتياطية:
- تم نسخ جميع الملفات
- جاهز للرفع على cPanel
- الملف المضغوط: backup_${dateTime}.zip

========================================
`;
  
  fs.writeFileSync(changelogPath, changelogContent, 'utf8');
  
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
    archive.directory(CONFIG.HOME_DIR, 'home', {
      filter: (filePath) => {
        const relativePath = path.relative(CONFIG.HOME_DIR, filePath);
        return !CONFIG.EXCLUDE_PATTERNS.some(pattern => {
          const glob = pattern.replace(/\*\*/g, '.*').replace(/\*/g, '[^/]*');
          return new RegExp(glob).test(relativePath);
        });
      }
    });
    
    archive.file(changelogPath, { name: 'changelog.txt' });
    archive.finalize();
  });
}

(async () => {
  console.log('=== إنشاء نسخة احتياطية واحدة ===');
  
  if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
    fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
  }
  
  try {
    const backupInfo = await createBackup();
    console.log('\n✓ تم إنشاء النسخة الاحتياطية بنجاح!');
    console.log(`الموقع: ${backupInfo.folder}`);
    console.log(`الملف المضغوط: ${backupInfo.zip}`);
    console.log(`سجل التغييرات: ${backupInfo.changelog}`);
  } catch (error) {
    console.error('خطأ في إنشاء النسخة الاحتياطية:', error);
    process.exit(1);
  }
})();




