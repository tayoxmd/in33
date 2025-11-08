# 🎯 ابدأ من هنا - إنشاء قاعدة البيانات

## ✅ ما تم إعداده

1. ✅ ملف SQL شامل (`setup_supabase_complete.sql`)
2. ✅ سكريبت Node.js (`setup-database-direct.js`)
3. ✅ حزمة `pg` مثبتة
4. ✅ سكريبت `setup-db` في `package.json`

---

## 🚀 الطريقة السريعة (موصى بها)

### الخطوة 1: الحصول على Connection String
من Supabase Dashboard:
1. انسخ Connection String من نافذة "Connect to your project"
2. يجب أن يكون بالشكل:
   ```
   postgresql://postgres:[YOUR_PASSWORD]@db.gkhgfcfdylleuweeigsn.supabase.co:5432/postgres
   ```
3. **استبدل `[YOUR_PASSWORD]` بكلمة المرور الفعلية**

### الخطوة 2: تعيين Connection String وتشغيل السكريبت
في PowerShell (من مجلد `home`):

```powershell
# تعيين Connection String
$env:DATABASE_URL = "postgresql://postgres:YOUR_PASSWORD@db.gkhgfcfdylleuweeigsn.supabase.co:5432/postgres"

# تشغيل السكريبت
npm run setup-db
```

**أو مباشرة:**
```powershell
node setup-database-direct.js
```

---

## 🎯 الطريقة البديلة (الأسهل)

إذا لم تكن متأكداً من Connection String:

### الخطوة 1: فتح Supabase Dashboard
1. افتح [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. اختر مشروعك

### الخطوة 2: فتح SQL Editor
1. من الشريط الجانبي، انقر على **"SQL Editor"**
2. انقر على زر **`+`** (Create a new snippet)

### الخطوة 3: نسخ ولصق الكود
1. افتح ملف `setup_supabase_complete.sql` من مجلد `home`
2. انسخ جميع محتوياته (Ctrl+A ثم Ctrl+C)
3. الصق الكود في Supabase SQL Editor (Ctrl+V)

### الخطوة 4: تشغيل الاستعلام
1. انقر على زر **"Run"** أو اضغط **Ctrl+Enter**
2. انتظر رسالة **"Success"**

---

## ✅ بعد الانتهاء

بعد تشغيل أي من الطريقتين:
1. ✅ جميع الجداول تم إنشاؤها (40+ جدول)
2. ✅ جميع الإعدادات تم تفعيلها
3. ✅ جميع السياسات (RLS) تم إنشاؤها
4. ✅ جميع البيانات الافتراضية تم إدراجها

### التحقق من النتائج:
1. من Supabase Dashboard، اذهب إلى **"Table Editor"**
2. تحقق من وجود الجداول:
   - `profiles`, `user_roles`, `cities`, `hotels`
   - `bookings`, `emails`, `email_settings`
   - `tasks`, `task_categories`, `site_settings`
   - وغيرها...

---

## 📁 الملفات المتاحة

- `setup_supabase_complete.sql` - ملف SQL شامل
- `setup-database-direct.js` - سكريبت Node.js
- `QUICK_START.md` - دليل سريع
- `SETUP_SUPABASE_GUIDE.md` - دليل تفصيلي
- `كيفية_استخدام_Connection_String.md` - دليل Connection String

---

## ⚠️ ملاحظات مهمة

1. **كلمة المرور**: تأكد من استبدال `[YOUR_PASSWORD]` بكلمة المرور الفعلية
2. **الأمان**: لا تشارك Connection String مع أي شخص
3. **IPv4**: إذا كنت على شبكة IPv4 فقط، قد تحتاج إلى Pooler

---

## 🆘 إذا واجهت مشاكل

### خطأ: "Connection String مفقود"
```powershell
# تأكد من تعيين DATABASE_URL
$env:DATABASE_URL = "postgresql://postgres:password@host:5432/postgres"
```

### خطأ: "Connection refused"
- تأكد من أن Connection String صحيح
- تأكد من أن كلمة المرور صحيحة
- تحقق من أن قاعدة البيانات متاحة

### خطأ: "pg package not found"
```powershell
npm install pg
```

---

## 🎉 جاهز للبدء!

اختر إحدى الطريقتين أعلاه وابدأ الآن!

**الطريقة 1**: أسرع (يستخدم Connection String)  
**الطريقة 2**: أسهل (يستخدم Supabase Dashboard)

