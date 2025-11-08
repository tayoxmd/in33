import fetch from 'node-fetch';

// اختبار الاتصال مع Webhook
async function testWebhook() {
  const webhookUrl = 'http://localhost:3001/webhook';
  
  console.log('🧪 اختبار Webhook...\n');
  
  // اختبار GET (صفحة المعلومات)
  try {
    console.log('1. اختبار GET /webhook...');
    const getResponse = await fetch(webhookUrl);
    const getText = await getResponse.text();
    
    if (getResponse.ok && getText.includes('Webhook يعمل')) {
      console.log('✅ GET /webhook يعمل بشكل صحيح');
    } else {
      console.log('❌ GET /webhook لا يعمل');
    }
  } catch (error) {
    console.log('❌ خطأ في GET /webhook:', error.message);
  }
  
  // اختبار POST (استقبال التحديثات)
  try {
    console.log('\n2. اختبار POST /webhook...');
    const testData = {
      event: 'push',
      files: [{
        path: 'test-file.txt',
        content: 'This is a test file',
        action: 'update'
      }]
    };
    
    const postResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const postResult = await postResponse.json();
    
    if (postResponse.ok && postResult.success) {
      console.log('✅ POST /webhook يعمل بشكل صحيح');
      console.log('النتيجة:', postResult);
    } else {
      console.log('❌ POST /webhook لا يعمل');
      console.log('النتيجة:', postResult);
    }
  } catch (error) {
    console.log('❌ خطأ في POST /webhook:', error.message);
  }
  
  // اختبار حالة المزامنة
  try {
    console.log('\n3. اختبار /sync-status...');
    const statusResponse = await fetch('http://localhost:3001/sync-status');
    const statusResult = await statusResponse.json();
    
    if (statusResponse.ok) {
      console.log('✅ حالة المزامنة:');
      console.log('  - مفعّلة:', statusResult.enabled ? '✅' : '❌');
      console.log('  - الملفات في قائمة الانتظار:', statusResult.queueLength);
      console.log('  - جاري المعالجة:', statusResult.isProcessing ? 'نعم' : 'لا');
    }
  } catch (error) {
    console.log('❌ خطأ في /sync-status:', error.message);
  }
  
  console.log('\n✅ انتهى الاختبار');
}

testWebhook();



