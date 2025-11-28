// api/send-email.js - ПЕРЕМЕННЫЕ КАК В ВАШЕМ ШАБЛОНЕ
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
        
        console.log('📧 Starting EmailJS send for:', email);

        // Проверяем обязательные поля
        if (!email || !code) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields'
            });
        }

        // Проверяем переменные окружения
        if (!process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID) {
            return res.status(500).json({ 
                success: false, 
                error: 'EmailJS configuration missing'
            });
        }

        // ВАЖНО: Переменные должны ТОЧНО совпадать с вашим шаблоном!
        const templateParams = {
            to_name: name || 'Администратор',
            confirmation_code: code  // ← именно так как в вашем шаблоне!
        };

        // Добавляем пароль если это восстановление (может не использоваться в шаблоне)
        if (type === 'password_reset' && newPassword) {
            templateParams.new_password = newPassword;
        }

        const emailData = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            template_params: templateParams
        };

        console.log('🔄 Sending to EmailJS API with template params:', templateParams);

        // Отправка в EmailJS
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(emailData)
        });

        const responseText = await response.text();

        if (response.ok) {
            console.log('✅ Email sent successfully to:', email);
            return res.status(200).json({ 
                success: true, 
                message: 'Email sent successfully'
            });
        } else {
            console.error('❌ EmailJS error:', response.status, responseText);
            return res.status(500).json({ 
                success: false, 
                error: `Email service error: ${response.status}`,
                details: responseText
            });
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Network error'
        });
    }
};
