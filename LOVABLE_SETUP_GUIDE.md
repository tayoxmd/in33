# دليل إعداد Lovable - الحل البديل ✅

## 🎯 الحل: صفحة إعدادات في المشروع

بما أن Lovable لا يحتوي على صفحة Webhook Settings عامة، قمت بإنشاء **صفحة إعدادات داخل المشروع** يمكنك الوصول إليها مباشرة.

## 📍 الوصول إلى صفحة الإعدادات

### من الموقع:
1. سجل الدخول كـ Admin
2. اذهب إلى: **Site Settings** → **إعدادات ربط Lovable**
3. أو افتح مباشرة: `http://localhost:8080/lovable-webhook-settings`

### الرابط المباشر:
```
http://localhost:8080/lovable-webhook-settings
```

## 🔧 الإعداد في Lovable

### الطريقة 1: استخدام Secrets في Lovable (موصى به)

1. **في Lovable:**
   - اذهب إلى **Settings** → **Cloud** → **Secrets**
   - اضغط **Add New Secret**

2. **أدخل المعلومات:**
   - **Name**: `LOVABLE_WEBHOOK_URL`
   - **Value**: `http://10.88.50.181:3001/webhook`
   - اضغط **Save**

3. **استخدم في الكود:**
```javascript
// في Lovable - بعد التعديل على أي ملف
const webhookUrl = process.env.LOVABLE_WEBHOOK_URL;

const syncToLocal = async (filePath, content) => {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: 'push',
      files: [{
        path: filePath,
        content: content,
        action: 'update'
      }]
    })
  });
  return await response.json();
};

// استخدام
await syncToLocal('src/App.tsx', 'import React from "react"; ...');
```

### الطريقة 2: API مباشر في Lovable

إذا لم يكن Secrets متاحاً، استخدم API مباشر:

```javascript
// في Lovable - بعد التعديل على أي ملف
const syncToLocal = async (filePath, content) => {
  const response = await fetch('http://10.88.50.181:3001/update-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      path: filePath, 
      content: content 
    })
  });
  return await response.json();
};

// استخدام
await syncToLocal('src/App.tsx', 'import React from "react"; ...');
```

## 📋 المعلومات المطلوبة

### Webhook URL:
```
http://10.88.50.181:3001/webhook
```

### API Endpoints المتاحة:

1. **Webhook (من Lovable):**
   ```
   POST http://10.88.50.181:3001/webhook
   Body: { "event": "push", "files": [...] }
   ```

2. **تحديث ملف واحد:**
   ```
   POST http://10.88.50.181:3001/update-file
   Body: { "path": "src/App.tsx", "content": "..." }
   ```

3. **تحديث عدة ملفات:**
   ```
   POST http://10.88.50.181:3001/update-files
   Body: { "files": [{ "path": "...", "content": "...", "action": "update" }] }
   ```

4. **مزامنة قاعدة البيانات:**
   ```
   POST http://10.88.50.181:3001/database-sync
   Body: { "operation": { "type": "add_user", "table": "users", "data": {...} } }
   ```

## 🧪 اختبار الاتصال

### من صفحة الإعدادات:
1. افتح: `http://localhost:8080/lovable-webhook-settings`
2. اضغط **اختبار الاتصال**
3. إذا نجح، ستظهر رسالة نجاح ✅

### من Lovable:
قم بتعديل ملف بسيط واستخدم الكود أعلاه لإرسال التحديث.

## ✅ الخطوات الكاملة

1. ✅ **السيرفر يعمل** - `npm run sync:bidirectional`
2. ✅ **صفحة الإعدادات جاهزة** - `/lovable-webhook-settings`
3. ⏳ **إضافة Secret في Lovable** - `LOVABLE_WEBHOOK_URL`
4. ⏳ **استخدام في الكود** - إرسال التحديثات عند التعديل
5. ⏳ **اختبار المزامنة** - تعديل ملف والتحقق من المزامنة

## 🎉 جاهز!

الآن لديك:
- ✅ صفحة إعدادات في المشروع
- ✅ معلومات Webhook جاهزة
- ✅ كود للاستخدام في Lovable
- ✅ نظام مزامنة يعمل

**ابدأ بإضافة Secret في Lovable واستخدم الكود أعلاه! 🚀**

