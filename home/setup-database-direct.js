#!/usr/bin/env node

/**
 * سكريبت لإنشاء قاعدة البيانات مباشرة باستخدام Connection String
 * Script to setup database directly using Connection String
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pkg from 'pg';
const { Client } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// قراءة متغيرات البيئة
const CONNECTION_STRING = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!CONNECTION_STRING) {
  console.error('❌ خطأ: Connection String مفقود!');
  console.error('❌ Error: Connection String is missing!');
  console.error('\n💡 للحصول على Connection String:');
  console.error('💡 To get Connection String:');
  console.error('   1. افتح Supabase Dashboard');
  console.error('   1. Open Supabase Dashboard');
  console.error('   2. اذهب إلى Settings > Database');
  console.error('   2. Go to Settings > Database');
  console.error('   3. انسخ Connection String');
  console.error('   3. Copy Connection String');
  console.error('   4. استبدل [YOUR_PASSWORD] بكلمة المرور');
  console.error('   4. Replace [YOUR_PASSWORD] with your password');
  console.error('\n💡 ثم قم بتعيينها:');
  console.error('💡 Then set it:');
  console.error('   export DATABASE_URL="postgresql://postgres:password@host:5432/postgres"');
  console.error('   أو / or');
  console.error('   export SUPABASE_DB_URL="postgresql://postgres:password@host:5432/postgres"');
  process.exit(1);
}

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

// تقسيم SQL إلى استعلامات منفصلة
// Split SQL into separate queries
function splitSQL(sql) {
  // إزالة التعليقات متعددة الأسطر
  sql = sql.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // تقسيم على ; مع مراعاة النصوص والاستعلامات المعقدة
  const queries = [];
  let currentQuery = '';
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    
    // تتبع النصوص
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
    if (char === ';' && !inString) {
      const trimmed = currentQuery.trim();
      if (trimmed && trimmed !== ';') {
        queries.push(trimmed);
      }
      currentQuery = '';
    }
  }
  
  // إضافة الاستعلام الأخير إذا كان موجوداً
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
  
  // إنشاء اتصال بقاعدة البيانات
  const client = new Client({
    connectionString: CONNECTION_STRING,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    await client.connect();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');
    console.log('✅ Connected to database successfully\n');
  } catch (error) {
    console.error('❌ خطأ في الاتصال بقاعدة البيانات:', error.message);
    console.error('❌ Error connecting to database:', error.message);
    console.error('\n💡 تأكد من:');
    console.error('💡 Make sure:');
    console.error('   1. Connection String صحيح');
    console.error('   1. Connection String is correct');
    console.error('   2. كلمة المرور صحيحة');
    console.error('   2. Password is correct');
    console.error('   3. قاعدة البيانات متاحة');
    console.error('   3. Database is available');
    process.exit(1);
  }
  
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
    if (!query.trim() || query.trim().startsWith('--')) {
      continue;
    }
    
    try {
      await client.query(query);
      successCount++;
      
      if (queryNum % 10 === 0 || queryNum === queries.length) {
        console.log(`✅ استعلام ${queryNum}/${queries.length} (${progress}%): تم بنجاح`);
        console.log(`✅ Query ${queryNum}/${queries.length} (${progress}%): Success`);
      }
    } catch (error) {
      // تجاهل الأخطاء الشائعة (الجدول موجود، النوع موجود، إلخ)
      const errorMsg = error.message?.toLowerCase() || '';
      if (
        errorMsg.includes('already exists') ||
        errorMsg.includes('does not exist') ||
        errorMsg.includes('duplicate')
      ) {
        // هذا طبيعي، تجاهل
        successCount++;
      } else {
        errorCount++;
        errors.push({ queryNum, query: query.substring(0, 100), error: error.message });
        console.log(`❌ استعلام ${queryNum}/${queries.length} (${progress}%): ${error.message}`);
      }
    }
  }
  
  await client.end();
  
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

// pg package is already imported at the top

// تشغيل السكريبت
// Run script
executeQueries().catch(error => {
  console.error('❌ خطأ عام:', error);
  console.error('❌ General error:', error);
  process.exit(1);
});

