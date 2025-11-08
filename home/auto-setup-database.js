#!/usr/bin/env node

/**
 * سكريبت تلقائي لإنشاء قاعدة البيانات في Supabase
 * Automatic script to setup Supabase database
 * 
 * يستخدم Supabase Management API مباشرة
 * Uses Supabase Management API directly
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// قراءة متغيرات البيئة
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_URL) {
  console.error('❌ خطأ: SUPABASE_URL مفقود!');
  console.error('❌ Error: SUPABASE_URL is missing!');
  console.error('\nيرجى إضافة: VITE_SUPABASE_URL أو SUPABASE_URL');
  console.error('Please add: VITE_SUPABASE_URL or SUPABASE_URL');
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

// استخراج project_id من URL
// Extract project_id from URL
const projectIdMatch = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/);
const projectId = projectIdMatch ? projectIdMatch[1] : null;

if (!projectId) {
  console.error('❌ خطأ: لا يمكن استخراج project_id من URL');
  console.error('❌ Error: Cannot extract project_id from URL');
  console.error('URL:', SUPABASE_URL);
  process.exit(1);
}

console.log('📊 Project ID:', projectId);
console.log('');

// Supabase Management API endpoint
const MANAGEMENT_API_URL = `https://api.supabase.com/v1/projects/${projectId}`;

// دالة لتنفيذ SQL عبر Supabase Management API
// Function to execute SQL via Supabase Management API
async function executeSQL() {
  console.log('🚀 بدء إنشاء قاعدة البيانات...');
  console.log('🚀 Starting database setup...\n');
  
  if (!SUPABASE_ACCESS_TOKEN && !SUPABASE_SERVICE_KEY) {
    console.error('❌ خطأ: تحتاج إلى SUPABASE_ACCESS_TOKEN أو SUPABASE_SERVICE_ROLE_KEY');
    console.error('❌ Error: You need SUPABASE_ACCESS_TOKEN or SUPABASE_SERVICE_ROLE_KEY');
    console.error('\n💡 للحصول على Access Token:');
    console.error('💡 To get Access Token:');
    console.error('   1. افتح https://supabase.com/dashboard');
    console.error('   1. Open https://supabase.com/dashboard');
    console.error('   2. اذهب إلى Settings > Access Tokens');
    console.error('   2. Go to Settings > Access Tokens');
    console.error('   3. أنشئ token جديد');
    console.error('   3. Create new token');
    console.error('\n💡 أو استخدم Service Role Key:');
    console.error('💡 Or use Service Role Key:');
    console.error('   1. اذهب إلى Settings > API');
    console.error('   1. Go to Settings > API');
    console.error('   2. انسخ service_role key');
    console.error('   2. Copy service_role key');
    console.error('\n💡 ثم قم بتعيينها:');
    console.error('💡 Then set it:');
    console.error('   export SUPABASE_ACCESS_TOKEN="your-token"');
    console.error('   أو / or');
    console.error('   export SUPABASE_SERVICE_ROLE_KEY="your-key"');
    process.exit(1);
  }
  
  const token = SUPABASE_ACCESS_TOKEN || SUPABASE_SERVICE_KEY;
  
  try {
    // استخدام Supabase Management API لتنفيذ SQL
    // Use Supabase Management API to execute SQL
    const response = await fetch(`${MANAGEMENT_API_URL}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'apikey': token
      },
      body: JSON.stringify({
        query: sqlContent
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ خطأ في تنفيذ SQL:', response.status, response.statusText);
      console.error('❌ Error executing SQL:', response.status, response.statusText);
      console.error('Response:', errorText);
      
      // إذا فشل، نوجه المستخدم لاستخدام Dashboard
      // If failed, guide user to use Dashboard
      console.error('\n💡 الحل البديل: استخدم Supabase Dashboard');
      console.error('💡 Alternative solution: Use Supabase Dashboard');
      console.error('   1. افتح https://supabase.com/dashboard');
      console.error('   1. Open https://supabase.com/dashboard');
      console.error('   2. اذهب إلى SQL Editor');
      console.error('   2. Go to SQL Editor');
      console.error('   3. الصق محتويات ملف setup_supabase_complete.sql');
      console.error('   3. Paste contents of setup_supabase_complete.sql');
      console.error('   4. انقر على Run');
      console.error('   4. Click Run');
      
      process.exit(1);
    }
    
    const result = await response.json();
    console.log('✅ تم تنفيذ SQL بنجاح!');
    console.log('✅ SQL executed successfully!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message);
    console.error('❌ Connection error:', error.message);
    
    // إذا فشل، نوجه المستخدم لاستخدام Dashboard
    // If failed, guide user to use Dashboard
    console.error('\n💡 الحل البديل: استخدم Supabase Dashboard');
    console.error('💡 Alternative solution: Use Supabase Dashboard');
    console.error('   1. افتح https://supabase.com/dashboard');
    console.error('   1. Open https://supabase.com/dashboard');
    console.error('   2. اذهب إلى SQL Editor');
    console.error('   2. Go to SQL Editor');
    console.error('   3. الصق محتويات ملف setup_supabase_complete.sql');
    console.error('   3. Paste contents of setup_supabase_complete.sql');
    console.error('   4. انقر على Run');
    console.error('   4. Click Run');
    
    process.exit(1);
  }
}

// تشغيل السكريبت
// Run script
executeSQL().catch(error => {
  console.error('❌ خطأ عام:', error);
  console.error('❌ General error:', error);
  process.exit(1);
});

