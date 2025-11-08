# سكريبت PowerShell لإنشاء قاعدة البيانات في Supabase
# PowerShell script to setup Supabase database

Write-Host "🚀 سكريبت إنشاء قاعدة البيانات في Supabase" -ForegroundColor Cyan
Write-Host "🚀 Supabase Database Setup Script" -ForegroundColor Cyan
Write-Host ""

# قراءة متغيرات البيئة
$SUPABASE_URL = $env:VITE_SUPABASE_URL
if (-not $SUPABASE_URL) {
    $SUPABASE_URL = $env:SUPABASE_URL
}

$SUPABASE_SERVICE_KEY = $env:SUPABASE_SERVICE_ROLE_KEY
if (-not $SUPABASE_SERVICE_KEY) {
    $SUPABASE_SERVICE_KEY = $env:VITE_SUPABASE_SERVICE_ROLE_KEY
}

if (-not $SUPABASE_URL -or -not $SUPABASE_SERVICE_KEY) {
    Write-Host "❌ خطأ: متغيرات البيئة مفقودة!" -ForegroundColor Red
    Write-Host "❌ Error: Missing environment variables!" -ForegroundColor Red
    Write-Host ""
    Write-Host "يرجى إضافة المتغيرات التالية:" -ForegroundColor Yellow
    Write-Host "Please add the following environment variables:" -ForegroundColor Yellow
    Write-Host "  - VITE_SUPABASE_URL أو SUPABASE_URL" -ForegroundColor Yellow
    Write-Host "  - SUPABASE_SERVICE_ROLE_KEY أو VITE_SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 للحصول على Service Role Key:" -ForegroundColor Cyan
    Write-Host "💡 To get Service Role Key:" -ForegroundColor Cyan
    Write-Host "   1. افتح Supabase Dashboard" -ForegroundColor White
    Write-Host "   1. Open Supabase Dashboard" -ForegroundColor White
    Write-Host "   2. اذهب إلى Settings > API" -ForegroundColor White
    Write-Host "   2. Go to Settings > API" -ForegroundColor White
    Write-Host "   3. انسخ 'service_role' key (مخفية)" -ForegroundColor White
    Write-Host "   3. Copy 'service_role' key (hidden)" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 ثم قم بتعيينها:" -ForegroundColor Cyan
    Write-Host "💡 Then set it:" -ForegroundColor Cyan
    Write-Host "   `$env:SUPABASE_SERVICE_ROLE_KEY = 'your-key-here'" -ForegroundColor White
    Write-Host ""
    exit 1
}

# قراءة ملف SQL
$sqlFile = Join-Path $PSScriptRoot "setup_supabase_complete.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ خطأ: ملف SQL غير موجود: $sqlFile" -ForegroundColor Red
    Write-Host "❌ Error: SQL file not found: $sqlFile" -ForegroundColor Red
    exit 1
}

$sqlContent = Get-Content $sqlFile -Raw -Encoding UTF8
Write-Host "✅ تم قراءة ملف SQL بنجاح" -ForegroundColor Green
Write-Host "✅ SQL file read successfully" -ForegroundColor Green
Write-Host ""

# Supabase لا يدعم تنفيذ SQL مباشرة عبر REST API
# Supabase doesn't support direct SQL execution via REST API
# سنستخدم Supabase Management API أو نوجه المستخدم لاستخدام Dashboard
# We'll use Supabase Management API or guide user to use Dashboard

Write-Host "⚠️  ملاحظة مهمة:" -ForegroundColor Yellow
Write-Host "⚠️  Important note:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Supabase لا يدعم تنفيذ SQL مباشرة عبر REST API بدون دالة مخصصة." -ForegroundColor Yellow
Write-Host "Supabase doesn't support direct SQL execution via REST API without a custom function." -ForegroundColor Yellow
Write-Host ""
Write-Host "💡 الحلول المتاحة:" -ForegroundColor Cyan
Write-Host "💡 Available solutions:" -ForegroundColor Cyan
Write-Host ""
Write-Host "الطريقة 1: استخدام Supabase Dashboard (الأسهل)" -ForegroundColor Green
Write-Host "Method 1: Use Supabase Dashboard (Easiest)" -ForegroundColor Green
Write-Host "  1. افتح https://supabase.com/dashboard" -ForegroundColor White
Write-Host "  1. Open https://supabase.com/dashboard" -ForegroundColor White
Write-Host "  2. اختر مشروعك" -ForegroundColor White
Write-Host "  2. Select your project" -ForegroundColor White
Write-Host "  3. اذهب إلى SQL Editor" -ForegroundColor White
Write-Host "  3. Go to SQL Editor" -ForegroundColor White
Write-Host "  4. انقر على زر + (Create a new snippet)" -ForegroundColor White
Write-Host "  4. Click + button (Create a new snippet)" -ForegroundColor White
Write-Host "  5. الصق محتويات ملف setup_supabase_complete.sql" -ForegroundColor White
Write-Host "  5. Paste contents of setup_supabase_complete.sql" -ForegroundColor White
Write-Host "  6. انقر على Run" -ForegroundColor White
Write-Host "  6. Click Run" -ForegroundColor White
Write-Host ""
Write-Host "الطريقة 2: استخدام Supabase CLI" -ForegroundColor Green
Write-Host "Method 2: Use Supabase CLI" -ForegroundColor Green
Write-Host "  1. ثبت Supabase CLI: npm install -g supabase" -ForegroundColor White
Write-Host "  1. Install Supabase CLI: npm install -g supabase" -ForegroundColor White
Write-Host "  2. سجل الدخول: supabase login" -ForegroundColor White
Write-Host "  2. Login: supabase login" -ForegroundColor White
Write-Host "  3. ربط المشروع: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor White
Write-Host "  3. Link project: supabase link --project-ref YOUR_PROJECT_REF" -ForegroundColor White
Write-Host "  4. شغّل الاستعلام: supabase db execute -f setup_supabase_complete.sql" -ForegroundColor White
Write-Host "  4. Run query: supabase db execute -f setup_supabase_complete.sql" -ForegroundColor White
Write-Host ""

# فتح ملف SQL في محرر النصوص
$openFile = Read-Host "هل تريد فتح ملف SQL في محرر النصوص؟ (y/n) / Do you want to open SQL file in text editor? (y/n)"

if ($openFile -eq 'y' -or $openFile -eq 'Y') {
    Write-Host "📂 فتح ملف SQL..." -ForegroundColor Cyan
    Write-Host "📂 Opening SQL file..." -ForegroundColor Cyan
    Start-Process notepad.exe -ArgumentList $sqlFile
    Write-Host ""
    Write-Host "✅ تم فتح الملف. انسخ المحتوى والصقه في Supabase Dashboard" -ForegroundColor Green
    Write-Host "✅ File opened. Copy the content and paste it in Supabase Dashboard" -ForegroundColor Green
}

Write-Host ""
Write-Host "📝 موقع ملف SQL:" -ForegroundColor Cyan
Write-Host "📝 SQL file location:" -ForegroundColor Cyan
Write-Host "   $sqlFile" -ForegroundColor White
Write-Host ""

