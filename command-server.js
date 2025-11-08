import http from 'http';
import url from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const COMMAND_LOG = path.join(__dirname, 'command-log.json');

// قائمة الأوامر المسموحة
const ALLOWED_COMMANDS = {
  'backup': {
    description: 'إنشاء نسخة احتياطية',
    handler: async () => {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      await execAsync('node backup-once.js', { cwd: __dirname });
      return { success: true, message: 'تم إنشاء النسخة الاحتياطية بنجاح' };
    }
  },
  'backup-start': {
    description: 'بدء نظام النسخ الاحتياطي التلقائي',
    handler: async () => {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      execAsync('node backup-system.js', { cwd: __dirname });
      return { success: true, message: 'تم بدء نظام النسخ الاحتياطي التلقائي' };
    }
  },
  'list-backups': {
    description: 'عرض قائمة النسخ الاحتياطية',
    handler: async () => {
      const backupDir = path.join(__dirname, 'backup');
      if (!fs.existsSync(backupDir)) {
        return { success: false, message: 'لا يوجد مجلد نسخ احتياطي' };
      }
      const backups = fs.readdirSync(backupDir)
        .filter(item => {
          const itemPath = path.join(backupDir, item);
          return fs.statSync(itemPath).isDirectory() && item.startsWith('backup_');
        })
        .map(item => {
          const itemPath = path.join(backupDir, item);
          return {
            name: item,
            date: fs.statSync(itemPath).mtime.toISOString()
          };
        });
      return { success: true, data: backups };
    }
  },
  'dev': {
    description: 'تشغيل المشروع على localhost',
    handler: async () => {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);
      execAsync('npm run dev', { cwd: path.join(__dirname, 'home') });
      return { success: true, message: 'تم تشغيل المشروع على localhost:8080' };
    }
  },
  'status': {
    description: 'حالة النظام',
    handler: async () => {
      return {
        success: true,
        data: {
          homeDir: fs.existsSync(path.join(__dirname, 'home')),
          backupDir: fs.existsSync(path.join(__dirname, 'backup')),
          backupsCount: fs.existsSync(path.join(__dirname, 'backup')) 
            ? fs.readdirSync(path.join(__dirname, 'backup')).length 
            : 0
        }
      };
    }
  }
};

// حفظ سجل الأوامر
function logCommand(command, result) {
  const logs = fs.existsSync(COMMAND_LOG) 
    ? JSON.parse(fs.readFileSync(COMMAND_LOG, 'utf8'))
    : [];
  
  logs.push({
    command,
    result,
    timestamp: new Date().toISOString()
  });
  
  fs.writeFileSync(COMMAND_LOG, JSON.stringify(logs, null, 2));
}

// إنشاء السيرفر
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  // صفحة البداية
  if (pathname === '/' || pathname === '/help') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>نظام إدارة الأوامر</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; }
          h1 { color: #333; }
          .command { background: #f9f9f9; padding: 10px; margin: 10px 0; border-radius: 5px; }
          .command strong { color: #007dff; }
          code { background: #e9e9e9; padding: 2px 5px; border-radius: 3px; }
          .example { background: #e8f4f8; padding: 15px; border-radius: 5px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>نظام إدارة الأوامر - Ithraa</h1>
          <p>استخدم هذا النظام لإرسال الأوامر إلى المشروع</p>
          
          <h2>الأوامر المتاحة:</h2>
          ${Object.entries(ALLOWED_COMMANDS).map(([cmd, info]) => `
            <div class="command">
              <strong>${cmd}</strong>: ${info.description}
              <br><code>http://localhost:${PORT}/command?cmd=${cmd}</code>
            </div>
          `).join('')}
          
          <h2>أمثلة:</h2>
          <div class="example">
            <strong>إنشاء نسخة احتياطية:</strong><br>
            <code>http://localhost:${PORT}/command?cmd=backup</code>
          </div>
          <div class="example">
            <strong>عرض قائمة النسخ الاحتياطية:</strong><br>
            <code>http://localhost:${PORT}/command?cmd=list-backups</code>
          </div>
          
          <h2>استخدام من الجوال:</h2>
          <p>افتح هذا الرابط من المتصفح على الجوال:</p>
          <code>http://[IP-الكمبيوتر]:${PORT}/command?cmd=backup</code>
          <p>استبدل [IP-الكمبيوتر] بعنوان IP الخاص بجهازك</p>
        </div>
      </body>
      </html>
    `);
    return;
  }
  
  // معالجة الأوامر
  if (pathname === '/command') {
    const command = query.cmd;
    
    if (!command) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: 'لم يتم تحديد الأمر' }, null, 2));
      return;
    }
    
    if (!ALLOWED_COMMANDS[command]) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: `الأمر غير معروف: ${command}` }, null, 2));
      return;
    }
    
    try {
      const result = await ALLOWED_COMMANDS[command].handler();
      logCommand(command, result);
      
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        success: true,
        command,
        result,
        timestamp: new Date().toISOString()
      }, null, 2));
    } catch (error) {
      const errorResult = { success: false, error: error.message };
      logCommand(command, errorResult);
      
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(errorResult, null, 2));
    }
    return;
  }
  
  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`\n=== نظام إدارة الأوامر يعمل الآن ===`);
  console.log(`الرابط المحلي: http://localhost:${PORT}`);
  console.log(`للأوامر: http://localhost:${PORT}/command?cmd=<command>`);
  console.log(`للمساعدة: http://localhost:${PORT}/help`);
  console.log(`\nلإيقاف السيرفر: اضغط Ctrl+C\n`);
});




