// api/test-emailjs.js
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();

    const testData = {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        template_params: {
            to_name: 'Test User',
            confirmation_code: 'TEST456'
        }
    };

    console.log('🔧 Testing EmailJS with:', {
        service_id: testData.service_id,
        template_id: testData.template_id,
        user_id: testData.user_id
    });

    try {
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const result = await response.text();
        
        console.log('📧 EmailJS Response:', {
            status: response.status,
            statusText: response.statusText,
            body: result
        });

        res.json({
            success: response.ok,
            status: response.status,
            statusText: response.statusText,
            response: result,
            debug: {
                service_id: testData.service_id,
                template_id: testData.template_id,
                user_id: testData.user_id
            }
        });
        
    } catch (error) {
        console.error('❌ EmailJS Test Error:', error);
        res.json({ 
            error: error.message,
            stack: error.stack
        });
    }
};
