# تعليمات المزامنة الثنائية - للـ AI

## 🎯 كيفية استخدام النظام من AI

عندما أقوم بتعديل أي ملف، سأستخدم الدوال المساعدة التالية:

### 1. تحديث ملف

```javascript
// في أي ملف AI helper
import { updateFileFromAI } from './ai-sync-helper.js';

await updateFileFromAI('src/App.tsx', 'import React from "react"; ...');
```

### 2. إنشاء ملف جديد

```javascript
import { createFileFromAI } from './ai-sync-helper.js';

await createFileFromAI('src/components/NewComponent.tsx', 'export function NewComponent() { ... }');
```

### 3. حذف ملف

```javascript
import { deleteFileFromAI } from './ai-sync-helper.js';

await deleteFileFromAI('src/old-file.tsx');
```

### 4. تحديث عدة ملفات دفعة واحدة

```javascript
import { syncFilesFromAI } from './ai-sync-helper.js';

await syncFilesFromAI([
  {
    path: 'src/App.tsx',
    content: '...',
    action: 'update'
  },
  {
    path: 'src/components/Header.tsx',
    content: '...',
    action: 'create'
  },
  {
    path: 'src/old-file.tsx',
    action: 'delete'
  }
]);
```

## 🔄 التدفق التلقائي

عندما أقوم بتعديل ملف باستخدام أدوات التعديل (مثل `search_replace`, `write`):

1. **أولاً:** أقوم بتعديل الملف مباشرة
2. **ثانياً:** أرسل التحديث إلى نظام المزامنة
3. **النتيجة:** 
   - الملف يتم تحديثه محلياً
   - التحديث يُرسل إلى Lovable
   - يتم حفظ سجل المزامنة

## 📝 مثال عملي

```javascript
// عندما أقوم بتعديل App.tsx
await search_replace('src/App.tsx', 'old code', 'new code');

// ثم أرسل التحديث
await updateFileFromAI('src/App.tsx', fs.readFileSync('src/App.tsx', 'utf8'));
```

## 🎯 المزامنة التلقائية

النظام يراقب:
- ✅ تعديلات Lovable → المحلي → AI
- ✅ تعديلات AI → المحلي → Lovable  
- ✅ تعديلات المحلي → Lovable → AI

**كل شيء متزامن تلقائياً!**




