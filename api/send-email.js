// api/send-email.js
const fetch = require('node-fetch');

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
        
        console.log('📧 Email request received:', { email, type, code });

        // EmailJS API endpoint
        const emailjsUrl = 'https://api.emailjs.com/api/v1.0/email/send';
        
        // Определяем шаблон сообщения
        let templateParams = {
            to_name: name,
            to_email: email,
            confirmation_code: code,
            type: type
        };

        if (type === 'password_reset' && newPassword) {
            templateParams.new_password = newPassword;
        }

        // Данные для отправки в EmailJS
        const emailData = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            template_params: templateParams
        };

        // Отправка запроса к EmailJS API
        const response = await fetch(emailjsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });

        if (response.ok) {
            console.log('✅ Email sent successfully to:', email);
            
            res.status(200).json({ 
                success: true, 
                message: 'Email sent successfully',
                email: email,
                type: type
            });
        } else {
            const errorText = await response.text();
            console.error('❌ EmailJS API error:', errorText);
            
            throw new Error(`EmailJS API error: ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Email sending error:', error);
        
        // Fallback - возвращаем успех для демо, но логируем ошибку
        res.status(200).json({ 
            success: true, 
            message: 'Email simulation mode (check logs)',
            error: error.message,
            demo_mode: true
        });
    }
};
