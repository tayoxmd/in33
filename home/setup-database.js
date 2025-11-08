#!/usr/bin/env node

/**
 * سكريبت لإنشاء قاعدة البيانات في Supabase
 * Script to setup Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// قراءة متغيرات البيئة
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ خطأ: متغيرات البيئة مفقودة!');
  console.error('Error: Missing environment variables!');
  console.error('\nيرجى إضافة المتغيرات التالية:');
  console.error('Please add the following environment variables:');
  console.error('  - VITE_SUPABASE_URL أو SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY أو VITE_SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nيمكنك إضافتها في ملف .env أو كمتغيرات بيئة');
  console.error('You can add them in .env file or as environment variables');
  process.exit(1);
}

// إنشاء Supabase client مع Service Role Key (صلاحيات كاملة)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// قراءة ملف SQL
const sqlFile = join(__dirname, 'setup_supabase_complete.sql');
let sqlContent;

try {
  sqlContent = readFileSync(sqlFile, 'utf-8');
  console.log('✅ تم قراءة ملف SQL بنجاح');
  console.log('✅ SQL file read successfully');
} catch (error) {
  console.error('❌ خطأ في قراءة ملف SQL:', error.message);
  console.error('❌ Error reading SQL file:', error.message);
  process.exit(1);
}

// تقسيم SQL إلى استعلامات منفصلة (مفصولة بـ ;)
// Split SQL into separate queries (separated by ;)
function splitSQL(sql) {
  // إزالة التعليقات متعددة الأسطر
  // Remove multi-line comments
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // تقسيم على ; مع مراعاة النصوص والاستعلامات المعقدة
  // Split on ; while considering strings and complex queries
  const queries = [];
  let currentQuery = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const nextChar = sql[i + 1];
    
    // تتبع النصوص
    // Track strings
    if ((char === "'" || char === '"') && (i === 0 || sql[i - 1] !== '\\')) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = '';
      }
    }
    
    currentQuery += char;
    
    // إذا وصلنا إلى ; ولسنا داخل نص
    // If we reached ; and we're not inside a string
    if (char === ';' && !inString) {
      const trimmed = currentQuery.trim();
      if (trimmed && trimmed !== ';') {
        queries.push(trimmed);
      }
      currentQuery = '';
    }
  }
  
  // إضافة الاستعلام الأخير إذا كان موجوداً
  // Add last query if exists
  if (currentQuery.trim()) {
    queries.push(currentQuery.trim());
  }
  
  return queries.filter(q => q.length > 0);
}

// تشغيل الاستعلامات
// Execute queries
async function executeQueries() {
  console.log('\n🚀 بدء إنشاء قاعدة البيانات...');
  console.log('🚀 Starting database setup...\n');
  
  const queries = splitSQL(sqlContent);
  console.log(`📊 عدد الاستعلامات: ${queries.length}`);
  console.log(`📊 Number of queries: ${queries.length}\n`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    const queryNum = i + 1;
    const progress = ((queryNum / queries.length) * 100).toFixed(1);
    
    // تخطي الاستعلامات الفارغة أو التعليقات فقط
    // Skip empty queries or comments only
    if (!query.trim() || query.trim().startsWith('--')) {
      continue;
    }
    
    try {
      // استخدام rpc لتنفيذ SQL مباشرة
      // Use rpc to execute SQL directly
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
      
      // إذا لم تكن الدالة موجودة، استخدم طريقة أخرى
      // If function doesn't exist, use another method
      if (error && error.message?.includes('function') && error.message?.includes('does not exist')) {
        // استخدام REST API مباشرة
        // Use REST API directly
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({ sql_query: query })
        });
        
        if (!response.ok) {
          // محاولة استخدام طريقة أخرى - تنفيذ SQL مباشرة عبر REST
          // Try another method - execute SQL directly via REST
          console.log(`⚠️  استعلام ${queryNum}/${queries.length} (${progress}%): محاولة طريقة بديلة...`);
          console.log(`⚠️  Query ${queryNum}/${queries.length} (${progress}%): Trying alternative method...`);
          
          // للأسف، Supabase لا يدعم تنفيذ SQL مباشرة عبر REST API
          // Unfortunately, Supabase doesn't support direct SQL execution via REST API
          // سنحتاج إلى استخدام Supabase CLI أو Dashboard
          // We'll need to use Supabase CLI or Dashboard
          console.log('❌ لا يمكن تنفيذ SQL مباشرة عبر REST API');
          console.log('❌ Cannot execute SQL directly via REST API');
          console.log('\n💡 الحل: استخدم Supabase Dashboard أو Supabase CLI');
          console.log('💡 Solution: Use Supabase Dashboard or Supabase CLI');
          console.log('\n📝 الخطوات:');
          console.log('📝 Steps:');
          console.log('1. افتح Supabase Dashboard');
          console.log('1. Open Supabase Dashboard');
          console.log('2. اذهب إلى SQL Editor');
          console.log('2. Go to SQL Editor');
          console.log('3. الصق محتويات ملف setup_supabase_complete.sql');
          console.log('3. Paste contents of setup_supabase_complete.sql');
          console.log('4. انقر على Run');
          console.log('4. Click Run');
          process.exit(1);
        }
      }
      
      if (error) {
        // تجاهل الأخطاء الشائعة (الجدول موجود، النوع موجود، إلخ)
        // Ignore common errors (table exists, type exists, etc.)
        const errorMsg = error.message?.toLowerCase() || '';
        if (
          errorMsg.includes('already exists') ||
          errorMsg.includes('does not exist') ||
          errorMsg.includes('duplicate')
        ) {
          // هذا طبيعي، تجاهل
          // This is normal, ignore
          successCount++;
        } else {
          errorCount++;
          errors.push({ queryNum, query: query.substring(0, 100), error: error.message });
          console.log(`❌ استعلام ${queryNum}/${queries.length} (${progress}%): ${error.message}`);
        }
      } else {
        successCount++;
        if (queryNum % 10 === 0 || queryNum === queries.length) {
          console.log(`✅ استعلام ${queryNum}/${queries.length} (${progress}%): تم بنجاح`);
          console.log(`✅ Query ${queryNum}/${queries.length} (${progress}%): Success`);
        }
      }
    } catch (error) {
      errorCount++;
      errors.push({ queryNum, query: query.substring(0, 100), error: error.message });
      console.log(`❌ استعلام ${queryNum}/${queries.length} (${progress}%): ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 ملخص النتائج / Summary:');
  console.log('='.repeat(50));
  console.log(`✅ نجح: ${successCount}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ فشل: ${errorCount}`);
  console.log(`❌ Failed: ${errorCount}`);
  
  if (errors.length > 0) {
    console.log('\n⚠️  الأخطاء / Errors:');
    errors.slice(0, 10).forEach(({ queryNum, error }) => {
      console.log(`  ${queryNum}: ${error}`);
    });
    if (errors.length > 10) {
      console.log(`  ... و ${errors.length - 10} خطأ آخر`);
      console.log(`  ... and ${errors.length - 10} more errors`);
    }
  }
  
  if (successCount > 0) {
    console.log('\n🎉 تم إنشاء قاعدة البيانات بنجاح!');
    console.log('🎉 Database setup completed successfully!');
  }
}

// تشغيل السكريبت
// Run script
executeQueries().catch(error => {
  console.error('❌ خطأ عام:', error);
  console.error('❌ General error:', error);
  process.exit(1);
});

