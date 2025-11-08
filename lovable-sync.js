import http from 'http';
import https from 'https';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const CONFIG = {
  HOME_DIR: path.join(__dirname, 'home'),
  SYNC_LOG: path.join(__dirname, 'lovable-sync-log.json'),
  WEBHOOK_SECRET: process.env.LOVABLE_WEBHOOK_SECRET || 'your-secret-key-here'
};

// حفظ سجل المزامنة
function logSync(action, data) {
  const logs = fs.existsSync(CONFIG.SYNC_LOG) 
    ? JSON.parse(fs.readFileSync(CONFIG.SYNC_LOG, 'utf8'))
    : [];
  
  logs.push({
    action,
    data,
    timestamp: new Date().toISOString()
  });
  
  // الاحتفاظ بآخر 1000 سجل فقط
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
  
  fs.writeFileSync(CONFIG.SYNC_LOG, JSON.stringify(logs, null, 2));
}

/**
 * تحديث ملف من Lovable
 */
async function updateFile(filePath, content) {
  const fullPath = path.join(CONFIG.HOME_DIR, filePath);
  const dir = path.dirname(fullPath);
  
  // إنشاء المجلد إذا لم يكن موجوداً
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // كتابة الملف
  fs.writeFileSync(fullPath, content, 'utf8');
  logSync('file_updated', { filePath, size: content.length });
  
  return { success: true, message: `تم تحديث الملف: ${filePath}` };
}

/**
 * حذف ملف
 */
async function deleteFile(filePath) {
  const fullPath = path.join(CONFIG.HOME_DIR, filePath);
  
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    logSync('file_deleted', { filePath });
    return { success: true, message: `تم حذف الملف: ${filePath}` };
  }
  
  return { success: false, message: `الملف غير موجود: ${filePath}` };
}

/**
 * إنشاء ملف جديد
 */
async function createFile(filePath, content) {
  const fullPath = path.join(CONFIG.HOME_DIR, filePath);
  const dir = path.dirname(fullPath);
  
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(fullPath, content, 'utf8');
  logSync('file_created', { filePath, size: content.length });
  
  return { success: true, message: `تم إنشاء الملف: ${filePath}` };
}

/**
 * تحديث عدة ملفات دفعة واحدة
 */
async function updateMultipleFiles(files) {
  const results = [];
  
  for (const file of files) {
    const { path: filePath, content, action } = file;
    
    try {
      if (action === 'delete') {
        results.push(await deleteFile(filePath));
      } else if (action === 'create') {
        results.push(await createFile(filePath, content || ''));
      } else {
        results.push(await updateFile(filePath, content || ''));
      }
    } catch (error) {
      results.push({ 
        success: false, 
        filePath, 
        error: error.message 
      });
    }
  }
  
  return { success: true, results };
}

/**
 * قراءة ملف
 */
async function readFile(filePath) {
  const fullPath = path.join(CONFIG.HOME_DIR, filePath);
  
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    return { success: true, content, size: content.length };
  }
  
  return { success: false, message: `الملف غير موجود: ${filePath}` };
}

/**
 * الحصول على قائمة الملفات
 */
async function listFiles(directory = '') {
  const fullPath = path.join(CONFIG.HOME_DIR, directory);
  
  if (!fs.existsSync(fullPath)) {
    return { success: false, message: 'المجلد غير موجود' };
  }
  
  const files = [];
  
  function walkDir(currentPath, relativePath) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const entryPath = path.join(currentPath, entry.name);
      const entryRelative = path.join(relativePath, entry.name).replace(/\\/g, '/');
      
      // استبعاد node_modules وملفات النظام
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue;
      }
      
      if (entry.isDirectory()) {
        walkDir(entryPath, entryRelative);
      } else {
        const stats = fs.statSync(entryPath);
        files.push({
          path: entryRelative,
          size: stats.size,
          modified: stats.mtime.toISOString()
        });
      }
    }
  }
  
  walkDir(fullPath, directory);
  
  return { success: true, files, count: files.length };
}

/**
 * معالجة طلبات HTTP
 */
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // التحقق من التوكن (اختياري)
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.replace('Bearer ', '') : parsedUrl.query.token;
  
  // صفحة البداية
  if (pathname === '/' || pathname === '/help') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>نظام مزامنة Lovable</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 900px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
          h1 { color: #333; }
          .endpoint { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; border-right: 4px solid #007dff; }
          .endpoint strong { color: #007dff; display: block; margin-bottom: 5px; }
          code { background: #e9e9e9; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
          .example { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 10px 0; }
          .method { background: #007dff; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>نظام مزامنة Lovable - Ithraa</h1>
          <p>هذا النظام يسمح لموقع Lovable بالمزامنة مع الملفات المحلية</p>
          
          <h2>API Endpoints:</h2>
          
          <div class="endpoint">
            <strong><span class="method">POST</span> /update-file</strong>
            تحديث ملف واحد
            <br><code>POST /update-file?token=YOUR_TOKEN</code>
            <div class="example">
              Body: { "path": "src/App.tsx", "content": "..." }
            </div>
          </div>
          
          <div class="endpoint">
            <strong><span class="method">POST</span> /update-files</strong>
            تحديث عدة ملفات دفعة واحدة
            <br><code>POST /update-files?token=YOUR_TOKEN</code>
            <div class="example">
              Body: { "files": [{ "path": "...", "content": "...", "action": "update" }] }
            </div>
          </div>
          
          <div class="endpoint">
            <strong><span class="method">GET</span> /read-file</strong>
            قراءة ملف
            <br><code>GET /read-file?path=src/App.tsx&token=YOUR_TOKEN</code>
          </div>
          
          <div class="endpoint">
            <strong><span class="method">GET</span> /list-files</strong>
            عرض قائمة الملفات
            <br><code>GET /list-files?directory=src&token=YOUR_TOKEN</code>
          </div>
          
          <div class="endpoint">
            <strong><span class="method">POST</span> /webhook</strong>
            Webhook من Lovable
            <br><code>POST /webhook</code>
            <div class="example">
              Body: { "event": "push", "files": [...] }
            </div>
          </div>
          
          <h2>إعداد Lovable:</h2>
          <div class="example">
            <strong>Webhook URL:</strong><br>
            <code>http://[YOUR-IP]:${PORT}/webhook</code><br><br>
            <strong>أو استخدام API مباشر:</strong><br>
            <code>http://[YOUR-IP]:${PORT}/update-files?token=YOUR_TOKEN</code>
          </div>
        </div>
      </body>
      </html>
    `);
    return;
  }
  
  // قراءة body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });
  
  req.on('end', async () => {
    let data = {};
    if (body) {
      try {
        data = JSON.parse(body);
      } catch (e) {
        // ignore
      }
    }
    
    // Webhook من Lovable
    if (pathname === '/webhook' && req.method === 'POST') {
      try {
        logSync('webhook_received', data);
        
        if (data.event === 'push' || data.files) {
          const files = data.files || [];
          const result = await updateMultipleFiles(files);
          
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(result, null, 2));
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Webhook received' }, null, 2));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: error.message }, null, 2));
      }
      return;
    }
    
    // تحديث ملف واحد
    if (pathname === '/update-file' && req.method === 'POST') {
      try {
        const { path: filePath, content } = data;
        
        if (!filePath) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'يجب تحديد path' }, null, 2));
          return;
        }
        
        const result = await updateFile(filePath, content || '');
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result, null, 2));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: error.message }, null, 2));
      }
      return;
    }
    
    // تحديث عدة ملفات
    if (pathname === '/update-files' && req.method === 'POST') {
      try {
        const { files } = data;
        
        if (!files || !Array.isArray(files)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'يجب تحديد files كقائمة' }, null, 2));
          return;
        }
        
        const result = await updateMultipleFiles(files);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result, null, 2));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: error.message }, null, 2));
      }
      return;
    }
    
    // قراءة ملف
    if (pathname === '/read-file' && req.method === 'GET') {
      try {
        const filePath = parsedUrl.query.path;
        
        if (!filePath) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'يجب تحديد path' }, null, 2));
          return;
        }
        
        const result = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result, null, 2));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: error.message }, null, 2));
      }
      return;
    }
    
    // عرض قائمة الملفات
    if (pathname === '/list-files' && req.method === 'GET') {
      try {
        const directory = parsedUrl.query.directory || '';
        const result = await listFiles(directory);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(result, null, 2));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: error.message }, null, 2));
      }
      return;
    }
    
    // 404
    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: false, error: 'Not Found' }, null, 2));
  });
});

server.listen(PORT, () => {
  console.log(`\n=== نظام مزامنة Lovable يعمل الآن ===`);
  console.log(`الرابط المحلي: http://localhost:${PORT}`);
  console.log(`Webhook URL: http://localhost:${PORT}/webhook`);
  console.log(`للمساعدة: http://localhost:${PORT}/help`);
  console.log(`\nملاحظة: النسخ الاحتياطي يعمل بشكل مستقل ولن يتأثر بالمزامنة`);
  console.log(`لإيقاف السيرفر: اضغط Ctrl+C\n`);
});




