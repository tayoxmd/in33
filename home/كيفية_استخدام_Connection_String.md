# 🔗 كيفية استخدام Connection String لإنشاء قاعدة البيانات

## 📋 الخطوات

### الخطوة 1: الحصول على Connection String
1. من الصورة التي أرسلتها، أرى نافذة "Connect to your project"
2. انسخ Connection String من الحقل الموجود
3. يجب أن يكون بالشكل:
   ```
   postgresql://postgres:[YOUR_PASSWORD]@db.gkhgfcfdylleuweeigsn.supabase.co:5432/postgres
   ```
4. **استبدل `[YOUR_PASSWORD]` بكلمة المرور الفعلية**

### الخطوة 2: تعيين Connection String
افتح PowerShell أو Command Prompt في مجلد `home` وقم بتعيين المتغير:

**PowerShell:**
```powershell
$env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@db.gkhgfcfdylleuweeigsn.supabase.co:5432/postgres"
```

**Command Prompt:**
```cmd
set DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.gkhgfcfdylleuweeigsn.supabase.co:5432/postgres
```

**أو أنشئ ملف `.env` في مجلد `home`:**
```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.gkhgfcfdylleuweeigsn.supabase.co:5432/postgres
```

### الخطوة 3: تشغيل السكريبت
```bash
cd home
npm run setup-db
```

أو مباشرة:
```bash
node setup-database-direct.js
```

## ⚠️ ملاحظات مهمة

1. **كلمة المرور**: تأكد من استبدال `[YOUR_PASSWORD]` بكلمة المرور الفعلية
2. **الأمان**: لا تشارك Connection String مع أي شخص
3. **IPv4**: إذا كنت على شبكة IPv4 فقط، قد تحتاج إلى استخدام Pooler

## 🔒 الأمان

- لا تضع Connection String في ملفات Git
- استخدم متغيرات البيئة
- أضف `.env` إلى `.gitignore`

## ✅ بعد التشغيل

بعد تشغيل السكريبت بنجاح:
- ✅ جميع الجداول تم إنشاؤها
- ✅ جميع الإعدادات تم تفعيلها
- ✅ جميع السياسات تم إنشاؤها
- ✅ جميع البيانات الافتراضية تم إدراجها

## 🆘 إذا واجهت مشاكل

### خطأ: "Connection refused"
- تأكد من أن Connection String صحيح
- تأكد من أن كلمة المرور صحيحة
- تحقق من أن قاعدة البيانات متاحة

### خطأ: "SSL required"
- السكريبت يستخدم SSL تلقائياً
- إذا استمرت المشكلة، تحقق من إعدادات Supabase

### خطأ: "pg package not found"
- قم بتثبيت الحزمة: `npm install pg`

