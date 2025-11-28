export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const keys = {
    publicKey: process.env.EMAILJS_PUBLIC_KEY || '',
    serviceId: process.env.EMAILJS_SERVICE_ID || '',
    templateId: process.env.EMAILJS_TEMPLATE_ID || ''
  };

  console.log('🔑 Ключи EmailJS:', {
    hasPublicKey: !!keys.publicKey,
    hasServiceId: !!keys.serviceId,
    hasTemplateId: !!keys.templateId
  });

  res.json(keys);
}
