// api/send-email.js
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, code, type = 'confirmation', newPassword } = req.body;
        
        console.log('📧 Processing email request for:', email);
        
        // Логируем наличие переменных (без значений для безопасности)
        console.log('🔑 Environment variables status:', {
            hasPublicKey: !!process.env.EMAILJS_PUBLIC_KEY,
            hasServiceId: !!process.env.EMAILJS_SERVICE_ID,
            hasTemplateId: !!process.env.EMAILJS_TEMPLATE_ID
        });

        // EmailJS API call
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service_id: process.env.EMAILJS_SERVICE_ID,
                template_id: process.env.EMAILJS_TEMPLATE_ID,
                user_id: process.env.EMAILJS_PUBLIC_KEY,
                template_params: {
                    to_name: name,
                    to_email: email,
                    confirmation_code: code,
                    type: type,
                    new_password: newPassword || ''
                }
            })
        });

        if (response.ok) {
            console.log('✅ Email sent successfully via EmailJS to:', email);
            res.status(200).json({ 
                success: true, 
                message: 'Email sent successfully',
                email: email
            });
        } else {
            const errorText = await response.text();
            console.error('❌ EmailJS API error:', response.status, errorText);
            res.status(500).json({ 
                success: false, 
                error: 'Email service error',
                details: `Status: ${response.status}`
            });
        }
        
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send email',
            details: error.message
        });
    }
};
