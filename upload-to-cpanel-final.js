import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FtpClient from 'basic-ftp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعدادات cPanel
const CPANEL_CONFIG = {
  host: 'ftp.u2890132.cp.regruhosting.ru',
  user: 'in@in33.in',
  password: '@@@Tayo0991',
  secure: false,
  port: 21
};

const DIST_DIR = path.join(__dirname, 'home', 'dist');
const REMOTE_PATH = '/public_html/in33.in';

/**
 * رفع ملفات dist إلى cPanel
 */
async function uploadDistToCpanel() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('❌ مجلد dist غير موجود. قم ببناء المشروع أولاً: npm run build');
    return false;
  }

  console.log('🔄 جاري الاتصال بـ cPanel...');
  console.log(`📁 المسار المحلي: ${DIST_DIR}`);
  console.log(`📁 المسار على السيرفر: ${REMOTE_PATH}`);
  
  const client = new FtpClient.Client();
  
  try {
    await client.access({
      host: CPANEL_CONFIG.host,
      user: CPANEL_CONFIG.user,
      password: CPANEL_CONFIG.password,
      secure: CPANEL_CONFIG.secure,
      port: CPANEL_CONFIG.port
    });
    
    console.log('✅ تم الاتصال بنجاح');
    
    // الانتقال إلى public_html
    try {
      await client.cd('/public_html');
      console.log('✅ تم الانتقال إلى /public_html');
      
      // إنشاء مجلد in33.in إذا لم يكن موجوداً
      try {
        await client.cd('in33.in');
        console.log('✅ مجلد in33.in موجود');
      } catch (e) {
        console.log('📁 جاري إنشاء مجلد in33.in...');
        await client.ensureDir('in33.in');
        await client.cd('in33.in');
        console.log('✅ تم إنشاء مجلد in33.in');
      }
    } catch (error) {
      console.log('⚠️  محاولة المسارات البديلة...');
      // محاولة مسارات بديلة
      const altPaths = ['/www', '/httpdocs', '/'];
      let found = false;
      
      for (const altPath of altPaths) {
        try {
          await client.cd(altPath);
          console.log(`✅ تم الانتقال إلى ${altPath}`);
          
          // إنشاء مجلد in33.in
          try {
            await client.cd('in33.in');
            console.log('✅ مجلد in33.in موجود');
          } catch (e) {
            console.log('📁 جاري إنشاء مجلد in33.in...');
            await client.ensureDir('in33.in');
            await client.cd('in33.in');
            console.log('✅ تم إنشاء مجلد in33.in');
          }
          
          found = true;
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!found) {
        throw new Error('لم يتم العثور على مسار صحيح');
      }
    }
    
    console.log('📤 جاري رفع الملفات...');
    
    // رفع جميع الملفات من dist
    await uploadDirectory(client, DIST_DIR, '.');
    
    console.log('');
    console.log('✅ تم رفع جميع الملفات بنجاح إلى cPanel');
    console.log(`🌐 الموقع متاح على: https://in33.in`);
    console.log(`📁 المسار على السيرفر: ${REMOTE_PATH}`);
    
    return true;
  } catch (error) {
    console.error('❌ خطأ أثناء الرفع:', error.message);
    console.log('');
    console.log('💡 نصائح:');
    console.log('1. تأكد من صحة بيانات FTP');
    console.log('2. تأكد من أن FTP مفعل في cPanel');
    console.log('3. تحقق من المسار الصحيح في cPanel');
    console.log('4. يمكنك استخدام File Manager في cPanel للرفع اليدوي');
    return false;
  } finally {
    client.close();
  }
}

/**
 * رفع مجلد بشكل متكرر
 */
async function uploadDirectory(client, localDir, remoteDir) {
  const files = fs.readdirSync(localDir, { withFileTypes: true });
  let uploadedCount = 0;
  
  for (const file of files) {
    const localPath = path.join(localDir, file.name);
    const remotePath = remoteDir === '.' ? file.name : `${remoteDir}/${file.name}`;
    
    if (file.isDirectory()) {
      // إنشاء المجلد على السيرفر
      try {
        await client.ensureDir(remotePath);
        console.log(`  📁 مجلد: ${remotePath}`);
        await uploadDirectory(client, localPath, remotePath);
      } catch (e) {
        // المجلد موجود بالفعل
        await uploadDirectory(client, localPath, remotePath);
      }
    } else {
      // رفع الملف
      try {
        await client.uploadFrom(localPath, remotePath);
        uploadedCount++;
        if (uploadedCount % 10 === 0) {
          process.stdout.write(`  📄 تم رفع ${uploadedCount} ملف...\r`);
        }
      } catch (error) {
        console.error(`  ❌ خطأ في رفع: ${remotePath} - ${error.message}`);
      }
    }
  }
  
  if (uploadedCount > 0 && uploadedCount % 10 !== 0) {
    console.log(`  ✅ تم رفع ${uploadedCount} ملف`);
  }
}

// تشغيل الرفع
console.log('🚀 بدء رفع الملفات إلى cPanel...');
console.log('');
uploadDistToCpanel().then(success => {
  if (success) {
    console.log('');
    console.log('🎉 تم إكمال العملية بنجاح!');
  } else {
    console.log('');
    console.log('⚠️  فشلت العملية. راجع الأخطاء أعلاه.');
  }
  process.exit(success ? 0 : 1);
});

