export default function handler(req, res) {
  console.log('🔑 Получен запрос на ключи EmailJS');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const keys = {
    publicKey: process.env.EMAILJS_PUBLIC_KEY || '',
    serviceId: process.env.EMAILJS_SERVICE_ID || '',
    templateId: process.env.EMAILJS_TEMPLATE_ID || '' // ← ИСПРАВЛЕНО!
  };

  console.log('🔑 Ключи из environment variables:', {
    publicKey: keys.publicKey ? 'SET' : 'NOT SET',
    serviceId: keys.serviceId ? 'SET' : 'NOT SET', 
    templateId: keys.templateId ? 'SET' : 'NOT SET'
  });

  // Диагностика всех переменных
  console.log('🔍 Все EmailJS переменные:', {
    EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY ? 'SET' : 'NOT SET',
    EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID ? 'SET' : 'NOT SET',
    EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID ? 'SET' : 'NOT SET',
    EMAILJS_TEMPLATE: process.env.EMAILJS_TEMPLATE ? 'SET' : 'NOT SET' // ← Проверяем старую переменную
  });

  res.json(keys);
}
