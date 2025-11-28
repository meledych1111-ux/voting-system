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
        
        console.log('📧 Email request for:', email, 'Type:', type);

        // Проверяем переменные окружения
        if (!process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID) {
            console.log('❌ Missing EmailJS environment variables');
            return res.status(500).json({ 
                success: false, 
                error: 'EmailJS configuration missing'
            });
        }

        // Данные для EmailJS API - ТОЧНО как в вашем шаблоне
        const templateParams = {
            to_name: name || 'Пользователь',
            confirmation_code: code  // именно так как в вашем шаблоне
            // to_email не нужен, если не используется в шаблоне
        };

        // Добавляем пароль только если он есть (для восстановления)
        if (newPassword) {
            templateParams.new_password = newPassword;
        }

        const emailData = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            template_params: templateParams
        };

        console.log('🔄 Calling EmailJS API...', {
            service_id: process.env.EMAILJS_SERVICE_ID ? '✅' : '❌',
            template_id: process.env.EMAILJS_TEMPLATE_ID ? '✅' : '❌',
            user_id: process.env.EMAILJS_PUBLIC_KEY ? '✅' : '❌'
        });

        // Вызов EmailJS API
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });

        if (response.ok) {
            console.log('✅ Email sent successfully to:', email);
            return res.status(200).json({ 
                success: true, 
                message: 'Email sent successfully'
            });
        } else {
            const errorText = await response.text();
            console.error('❌ EmailJS API error:', response.status, errorText);
            
            // Детальная информация об ошибке
            return res.status(500).json({ 
                success: false, 
                error: `EmailJS error: ${response.status}`,
                details: errorText,
                debug: {
                    service_id: process.env.EMAILJS_SERVICE_ID?.substring(0, 10) + '...',
                    template_id: process.env.EMAILJS_TEMPLATE_ID?.substring(0, 10) + '...',
                    user_id: process.env.EMAILJS_PUBLIC_KEY?.substring(0, 10) + '...'
                }
            });
        }
        
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Network error',
            details: error.message
        });
    }
};
