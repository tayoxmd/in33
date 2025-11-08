import http from 'http';
import https from 'https';
import url from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import chokidar from 'chokidar';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const CONFIG = {
  HOME_DIR: path.join(__dirname, 'home'),
  SYNC_LOG: path.join(__dirname, 'sync-log.json'),
  LOVABLE_API_URL: process.env.LOVABLE_API_URL || '', // URL لـ Lovable API
  WEBHOOK_SECRET: process.env.LOVABLE_WEBHOOK_SECRET || 'your-secret-key-here',
  SYNC_ENABLED: true
};

let fileWatcher = null;
let syncQueue = [];
let isProcessingQueue = false;

// حفظ سجل المزامنة
function logSync(action, source, data) {
  const logs = fs.existsSync(CONFIG.SYNC_LOG) 
    ? JSON.parse(fs.readFileSync(CONFIG.SYNC_LOG, 'utf8'))
    : [];
  
  logs.push({
    action,
    source, // 'lovable', 'local', 'ai'
    data,
    timestamp: new Date().toISOString()
  });
  
  // الاحتفاظ بآخر 1000 سجل فقط
  if (logs.length > 1000) {
    logs.splice(0, logs.length - 1000);
  }
  
  fs.writeFileSync(CONFIG.SYNC_LOG, JSON.stringify(logs, null, 2));
}

// إرسال تحديث إلى Lovable
async function sendToLovable(files) {
  if (!CONFIG.LOVABLE_API_URL) {
    console.log('⚠️ Lovable API URL غير محدد - لن يتم إرسال التحديثات');
    return { success: false, message: 'Lovable API URL not configured' };
  }
  
  try {
    const response = await fetch(CONFIG.LOVABLE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.WEBHOOK_SECRET}`
      },
      body: JSON.stringify({
        event: 'sync_from_local',
        files: files,
        timestamp: new Date().toISOString()
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    logSync('sent_to_lovable', 'local', { filesCount: files.length, result });
    return { success: true, result };
  } catch (error) {
    console.error('خطأ في إرسال التحديث إلى Lovable:', error.message);
    logSync('sync_error', 'local', { error: error.message });
    return { success: false, error: error.message };
  }
}

// تحديث ملف محلي من Lovable
async function updateLocalFile(filePath, content, action = 'update') {
  const fullPath = path.join(CONFIG.HOME_DIR, filePath);
  const dir = path.dirname(fullPath);
  
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (action === 'delete') {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logSync('file_deleted', 'lovable', { filePath });
        return { success: true, message: `تم حذف الملف: ${filePath}` };
      }
    } else if (action === 'create' || action === 'update') {
      fs.writeFileSync(fullPath, content, 'utf8');
      logSync('file_updated', 'lovable', { filePath, size: content.length, action });
      return { success: true, message: `تم تحديث الملف: ${filePath}` };
    }
    
    return { success: false, message: 'إجراء غير معروف' };
  } catch (error) {
    console.error(`خطأ في تحديث الملف ${filePath}:`, error.message);
    return { success: false, error: error.message };
  }
}

// تحديث عدة ملفات دفعة واحدة
async function updateMultipleFiles(files) {
  const results = [];
  
  for (const file of files) {
    const { path: filePath, content, action = 'update' } = file;
    const result = await updateLocalFile(filePath, content || '', action);
    results.push({ filePath, ...result });
  }
  
  return { success: true, results };
}

// إعداد مراقب الملفات المحلية
function setupFileWatcher() {
  console.log('جاري إعداد مراقب الملفات المحلية...');
  
  fileWatcher = chokidar.watch(CONFIG.HOME_DIR, {
    ignored: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/build/**',
      '**/*.log',
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/bun.lockb'
    ],
    persistent: true,
    ignoreInitial: true
  });
  
  fileWatcher
    .on('add', async (filePath) => {
      if (!CONFIG.SYNC_ENABLED) return;
      
      const relativePath = path.relative(CONFIG.HOME_DIR, filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      syncQueue.push({
        action: 'create',
        path: relativePath,
        content,
        source: 'local',
        timestamp: new Date().toISOString()
      });
      
      console.log(`📝 ملف جديد: ${relativePath}`);
      processSyncQueue();
    })
    .on('change', async (filePath) => {
      if (!CONFIG.SYNC_ENABLED) return;
      
      const relativePath = path.relative(CONFIG.HOME_DIR, filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      syncQueue.push({
        action: 'update',
        path: relativePath,
        content,
        source: 'local',
        timestamp: new Date().toISOString()
      });
      
      console.log(`✏️ ملف معدل: ${relativePath}`);
      processSyncQueue();
    })
    .on('unlink', async (filePath) => {
      if (!CONFIG.SYNC_ENABLED) return;
      
      const relativePath = path.relative(CONFIG.HOME_DIR, filePath);
      
      syncQueue.push({
        action: 'delete',
        path: relativePath,
        source: 'local',
        timestamp: new Date().toISOString()
      });
      
      console.log(`🗑️ ملف محذوف: ${relativePath}`);
      processSyncQueue();
    })
    .on('error', (error) => {
      console.error('خطأ في مراقب الملفات:', error);
    });
  
  console.log('✓ مراقب الملفات يعمل الآن');
}

// معالجة قائمة المزامنة
async function processSyncQueue() {
  if (isProcessingQueue || syncQueue.length === 0) return;
  
  isProcessingQueue = true;
  
  // انتظر قليلاً لتجميع التغييرات
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const filesToSync = [...syncQueue];
  syncQueue = [];
  
  if (filesToSync.length > 0) {
    console.log(`🔄 جاري مزامنة ${filesToSync.length} ملف...`);
    await sendToLovable(filesToSync);
  }
  
  isProcessingQueue = false;
  
  // معالجة أي ملفات جديدة في القائمة
  if (syncQueue.length > 0) {
    processSyncQueue();
  }
}

// معالجة طلبات HTTP
const server = http.createServer(async (req, res) => {
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
  
  // صفحة البداية
  if (pathname === '/' || pathname === '/help') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>نظام المزامنة الثنائي - Ithraa</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 1000px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; }
          h1 { color: #007dff; }
          .status { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .endpoint { background: #f9f9f9; padding: 15px; margin: 10px 0; border-radius: 5px; border-right: 4px solid #007dff; }
          .endpoint strong { color: #007dff; display: block; margin-bottom: 5px; }
          code { background: #e9e9e9; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
          .method { background: #007dff; color: white; padding: 2px 8px; border-radius: 3px; font-size: 12px; }
          .sync-status { display: inline-block; padding: 5px 10px; border-radius: 3px; margin: 5px 0; }
          .sync-active { background: #4caf50; color: white; }
          .sync-inactive { background: #f44336; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔄 نظام المزامنة الثنائي - Ithraa</h1>
          
          <div class="status">
            <h2>حالة المزامنة:</h2>
            <span class="sync-status ${CONFIG.SYNC_ENABLED ? 'sync-active' : 'sync-inactive'}">
              ${CONFIG.SYNC_ENABLED ? '✓ مفعّل' : '✗ معطّل'}
            </span>
            <p>المزامنة بين Lovable ↔ الملفات المحلية ↔ AI</p>
          </div>
          
          <h2>API Endpoints:</h2>
          
          <div class="endpoint">
            <strong><span class="method">POST</span> /webhook (من Lovable)</strong>
            استقبال تحديثات من Lovable
            <br><code>POST /webhook</code>
            <div style="background: #fff3cd; padding: 10px; margin-top: 10px; border-radius: 3px;">
              Body: { "event": "push", "files": [{ "path": "...", "content": "...", "action": "update" }] }
            </div>
          </div>
          
          <div class="endpoint">
            <strong><span class="method">POST</span> /update-files</strong>
            تحديث عدة ملفات من Lovable أو AI
            <br><code>POST /update-files</code>
          </div>
          
          <div class="endpoint">
            <strong><span class="method">GET</span> /sync-status</strong>
            حالة المزامنة
            <br><code>GET /sync-status</code>
          </div>
          
          <div class="endpoint">
            <strong><span class="method">GET</span> /sync-log</strong>
            عرض سجل المزامنة
            <br><code>GET /sync-log?limit=50</code>
          </div>
          
          <div class="endpoint">
            <strong><span class="method">POST</span> /sync-enable</strong>
            تفعيل/تعطيل المزامنة
            <br><code>POST /sync-enable?enabled=true</code>
          </div>
          
          <div class="endpoint">
            <strong><span class="method">POST</span> /database-sync</strong>
            مزامنة قاعدة البيانات (مستخدمين، طلبات، إلخ)
            <br><code>POST /database-sync</code>
            <div style="background: #fff3cd; padding: 10px; margin-top: 10px; border-radius: 3px;">
              Body: { "operation": { "type": "add_user", "table": "users", "data": {...} }, "source": "ai" }
            </div>
          </div>
          
          <h2>كيف يعمل النظام:</h2>
          <ol>
            <li><strong>من Lovable:</strong> أي تعديل → Webhook → تحديث الملفات المحلية → إشعار AI</li>
            <li><strong>من AI:</strong> أي تعديل → تحديث الملفات المحلية → إرسال إلى Lovable → إشعار</li>
            <li><strong>من الملفات المحلية:</strong> أي تعديل → إرسال إلى Lovable → إشعار AI</li>
          </ol>
          
          <h2>إعداد Lovable:</h2>
          <div style="background: #e8f4f8; padding: 15px; border-radius: 5px;">
            <strong>Webhook URL:</strong><br>
            <code>http://10.88.50.181:${PORT}/webhook</code><br><br>
            <strong>أو من الإنترنت:</strong> (إذا كان متاحاً)<br>
            <code>https://your-domain.com/webhook</code>
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
    
    // Webhook من Lovable - GET (عرض صفحة معلومات)
    if (pathname === '/webhook' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Webhook Endpoint - Ithraa Sync</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              padding: 40px; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              margin: 0;
            }
            .container { 
              max-width: 800px; 
              margin: 0 auto; 
              background: white; 
              padding: 40px; 
              border-radius: 15px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            h1 { 
              color: #667eea; 
              margin-bottom: 10px;
            }
            .status { 
              background: #4caf50; 
              color: white; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 20px 0;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
            }
            .info-box { 
              background: #f5f5f5; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 20px 0;
              border-right: 4px solid #667eea;
            }
            .info-box h3 {
              color: #667eea;
              margin-top: 0;
            }
            code { 
              background: #e9e9e9; 
              padding: 10px; 
              border-radius: 5px; 
              font-family: monospace;
              display: block;
              margin: 10px 0;
              word-break: break-all;
            }
            .endpoint { 
              background: #fff3cd; 
              padding: 15px; 
              border-radius: 8px; 
              margin: 15px 0;
              border-right: 4px solid #ffc107;
            }
            .endpoint strong {
              color: #856404;
              display: block;
              margin-bottom: 5px;
            }
            .method {
              background: #667eea;
              color: white;
              padding: 3px 8px;
              border-radius: 3px;
              font-size: 12px;
              margin-left: 5px;
            }
            .example {
              background: #e8f4f8;
              padding: 15px;
              border-radius: 8px;
              margin: 15px 0;
            }
            .btn {
              background: #667eea;
              color: white;
              padding: 12px 24px;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              font-size: 16px;
              margin: 10px 5px;
              text-decoration: none;
              display: inline-block;
            }
            .btn:hover {
              background: #5568d3;
            }
            .btn-secondary {
              background: #6c757d;
            }
            .btn-secondary:hover {
              background: #5a6268;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔗 Webhook Endpoint - Ithraa Sync</h1>
            
            <div class="status">
              ✅ Webhook يعمل بشكل صحيح
            </div>
            
            <div class="info-box">
              <h3>📋 معلومات Webhook</h3>
              <p><strong>URL:</strong></p>
              <code>http://10.88.50.181:3001/webhook</code>
              <p><strong>Method:</strong> <span class="method">POST</span></p>
              <p><strong>Content-Type:</strong> application/json</p>
            </div>
            
            <div class="endpoint">
              <strong><span class="method">POST</span> /webhook</strong>
              <p>استقبال تحديثات من Lovable</p>
              <p><strong>Body Example:</strong></p>
              <div class="example">
                <code>{
  "event": "push",
  "files": [
    {
      "path": "src/App.tsx",
      "content": "...",
      "action": "update"
    }
  ]
}</code>
              </div>
            </div>
            
            <div class="info-box">
              <h3>📝 كيفية الاستخدام في Lovable</h3>
              <ol>
                <li>في Lovable، اذهب إلى <strong>Settings → Cloud → Secrets</strong></li>
                <li>أضف Secret جديد:
                  <ul>
                    <li><strong>Name:</strong> LOVABLE_WEBHOOK_URL</li>
                    <li><strong>Value:</strong> http://10.88.50.181:3001/webhook</li>
                  </ul>
                </li>
                <li>استخدم في الكود:
                  <code>const webhookUrl = process.env.LOVABLE_WEBHOOK_URL;
await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 'push', files: [...] })
});</code>
                </li>
              </ol>
            </div>
            
            <div class="info-box">
              <h3>🔗 روابط مفيدة</h3>
              <a href="/help" class="btn">📖 المساعدة الكاملة</a>
              <a href="/sync-status" class="btn btn-secondary">📊 حالة المزامنة</a>
              <a href="/sync-log" class="btn btn-secondary">📝 سجل المزامنة</a>
            </div>
            
            <div class="info-box">
              <h3>✅ حالة النظام</h3>
              <p><strong>المزامنة:</strong> ${CONFIG.SYNC_ENABLED ? '✅ مفعّلة' : '❌ معطّلة'}</p>
              <p><strong>الملفات في قائمة الانتظار:</strong> ${syncQueue.length}</p>
              <p><strong>آخر تحديث:</strong> ${new Date().toLocaleString('ar-SA')}</p>
            </div>
          </div>
        </body>
        </html>
      `);
      return;
    }
    
    // Webhook من Lovable - POST (استقبال التحديثات)
    if (pathname === '/webhook' && req.method === 'POST') {
      try {
        console.log('📥 استقبال تحديثات من Lovable...');
        logSync('webhook_received', 'lovable', data);
        
        if (data.event === 'push' || data.files) {
          const files = data.files || [];
          const result = await updateMultipleFiles(files);
          
          // إرسال إشعار إلى AI (يمكن إضافة Webhook للـ AI هنا)
          console.log(`✓ تم تحديث ${files.length} ملف من Lovable`);
          
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, ...result }, null, 2));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: true, message: 'Webhook received' }, null, 2));
        }
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: error.message }, null, 2));
      }
      return;
    }
    
    // تحديث ملفات (من Lovable أو AI)
    if (pathname === '/update-files' && req.method === 'POST') {
      try {
        const { files, source = 'ai' } = data;
        
        if (!files || !Array.isArray(files)) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'يجب تحديد files كقائمة' }, null, 2));
          return;
        }
        
        console.log(`📝 تحديث ${files.length} ملف من ${source}...`);
        
        // تحديث الملفات المحلية
        const result = await updateMultipleFiles(files);
        
        // إرسال إلى Lovable (إذا كان المصدر ليس Lovable)
        if (source !== 'lovable') {
          await sendToLovable(files);
        }
        
        logSync('files_updated', source, { filesCount: files.length });
        
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, ...result }, null, 2));
      } catch (error) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: error.message }, null, 2));
      }
      return;
    }
    
    // حالة المزامنة
    if (pathname === '/sync-status' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        enabled: CONFIG.SYNC_ENABLED,
        queueLength: syncQueue.length,
        isProcessing: isProcessingQueue,
        timestamp: new Date().toISOString()
      }, null, 2));
      return;
    }
    
    // سجل المزامنة
    if (pathname === '/sync-log' && req.method === 'GET') {
      const limit = parseInt(parsedUrl.query.limit) || 50;
      const logs = fs.existsSync(CONFIG.SYNC_LOG) 
        ? JSON.parse(fs.readFileSync(CONFIG.SYNC_LOG, 'utf8'))
        : [];
      
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        logs: logs.slice(-limit).reverse(),
        total: logs.length
      }, null, 2));
      return;
    }
    
    // تفعيل/تعطيل المزامنة
    if (pathname === '/sync-enable' && req.method === 'POST') {
      const enabled = parsedUrl.query.enabled === 'true';
      CONFIG.SYNC_ENABLED = enabled;
      
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        enabled: CONFIG.SYNC_ENABLED,
        message: enabled ? 'تم تفعيل المزامنة' : 'تم تعطيل المزامنة'
      }, null, 2));
      return;
    }
    
    // مزامنة قاعدة البيانات
    if (pathname === '/database-sync' && req.method === 'POST') {
      try {
        const { operation, source } = data;
        
        if (!operation) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ success: false, error: 'يجب تحديد operation' }, null, 2));
          return;
        }
        
        console.log(`📊 مزامنة قاعدة البيانات: ${operation.type} من ${source}`);
        
        // حفظ سجل المزامنة
        logSync('database_sync', source || 'unknown', operation);
        
        // إرسال إلى Lovable (إذا كان المصدر ليس Lovable)
        if (source !== 'lovable' && CONFIG.LOVABLE_API_URL) {
          try {
            await fetch(CONFIG.LOVABLE_API_URL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.WEBHOOK_SECRET}`
              },
              body: JSON.stringify({
                event: 'database_update',
                operation: operation,
                timestamp: new Date().toISOString()
              })
            });
          } catch (error) {
            console.error('خطأ في إرسال تحديث قاعدة البيانات إلى Lovable:', error.message);
          }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({
          success: true,
          message: `تم مزامنة قاعدة البيانات: ${operation.type}`,
          operation: operation
        }, null, 2));
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

// بدء النظام
function start() {
  console.log('\n=== نظام المزامنة الثنائي - Ithraa ===');
  console.log(`مجلد الملفات: ${CONFIG.HOME_DIR}`);
  console.log(`المنفذ: ${PORT}`);
  console.log(`المزامنة: ${CONFIG.SYNC_ENABLED ? 'مفعّلة' : 'معطّلة'}`);
  
  if (!fs.existsSync(CONFIG.HOME_DIR)) {
    fs.mkdirSync(CONFIG.HOME_DIR, { recursive: true });
  }
  
  // إعداد مراقب الملفات
  setupFileWatcher();
  
  // بدء السيرفر
  server.listen(PORT, () => {
    console.log(`\n✓ السيرفر يعمل الآن`);
    console.log(`الرابط المحلي: http://localhost:${PORT}`);
    console.log(`Webhook URL: http://10.88.50.181:${PORT}/webhook`);
    console.log(`للمساعدة: http://localhost:${PORT}/help`);
    console.log(`\nالمزامنة الثنائية جاهزة!`);
    console.log(`اضغط Ctrl+C لإيقاف النظام\n`);
  });
}

start();

// إيقاف النظام بشكل صحيح
process.on('SIGINT', () => {
  console.log('\n\nإيقاف النظام...');
  if (fileWatcher) {
    fileWatcher.close();
  }
  process.exit(0);
});

