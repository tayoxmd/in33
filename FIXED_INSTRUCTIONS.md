# ✅ تم إصلاح المشكلة!

## المشكلة
كنت تحاول تشغيل `npm run setup-db` من المجلد الرئيسي `ithraa`، لكن السكريبت موجود في مجلد `home`.

## الحل
تم إضافة السكريبت إلى `package.json` في المجلد الرئيسي.

---

## 🚀 كيفية التشغيل الآن

### الخطوة 1: تعيين Connection String
في PowerShell (من المجلد الرئيسي `ithraa`):

```powershell
$env:DATABASE_URL = "postgresql://postgres:@Tayo0991@db.gkhgfcfdylleuweeigsn.supabase.co:5432/postgres"
```

**ملاحظة**: لاحظ أن كلمة المرور في Connection String هي `@Tayo0991` (يجب أن تكون بدون `@` في البداية)

**الصحيح:**
```powershell
$env:DATABASE_URL = "postgresql://postgres:Tayo0991@db.gkhgfcfdylleuweeigsn.supabase.co:5432/postgres"
```

### الخطوة 2: تشغيل السكريبت
```powershell
npm run setup-db
```

---

## ⚠️ ملاحظة مهمة

في Connection String الذي استخدمته:
```
postgresql://postgres:@Tayo0991@db.gkhgfcfdylleuweeigsn.supabase.co:5432/postgres
```

يوجد `@` إضافي قبل كلمة المرور. يجب أن يكون:
```
postgresql://postgres:Tayo0991@db.gkhgfcfdylleuweeigsn.supabase.co:5432/postgres
```

---

## ✅ الخطوات الصحيحة

1. **تعيين Connection String:**
   ```powershell
   $env:DATABASE_URL = "postgresql://postgres:Tayo0991@db.gkhgfcfdylleuweeigsn.supabase.co:5432/postgres"
   ```

2. **تشغيل السكريبت:**
   ```powershell
   npm run setup-db
   ```

---

## 🎯 النتيجة المتوقعة

بعد التشغيل الصحيح:
- ✅ رسالة "Success" أو "تم إنشاء قاعدة البيانات بنجاح"
- ✅ جميع الجداول تم إنشاؤها
- ✅ جميع الإعدادات تم تفعيلها

---

## 🆘 إذا واجهت مشاكل

### خطأ: "Connection refused"
- تأكد من أن Connection String صحيح
- تأكد من أن كلمة المرور صحيحة (بدون `@` في البداية)

### خطأ: "pg package not found"
- السكريبت سيقوم بتثبيتها تلقائياً
- أو قم بتثبيتها يدوياً: `cd home && npm install pg`

