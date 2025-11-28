// api/send-email.js - СИНХРОННАЯ ОТПРАВКА ЧЕРЕЗ EMAILJS
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { name, email, code, type = 'confirmation', newPassword } = req.body;
        
        console.log('📧 Sending email to:', email);

        // Проверяем наличие переменных
        if (!process.env.EMAILJS_PUBLIC_KEY || !process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID) {
            console.log('❌ Missing EmailJS environment variables');
            return res.status(500).json({ 
                success: false, 
                error: 'EmailJS configuration missing'
            });
        }

        // Подготавливаем данные для EmailJS
        const templateParams = {
            to_name: name || 'User',
            confirmation_code: code
        };

        if (newPassword) {
            templateParams.new_password = newPassword;
        }

        const emailData = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            template_params: templateParams
        };

        console.log('🔄 Calling EmailJS API synchronously...');

        // СИНХРОННАЯ отправка через EmailJS
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });

        const responseText = await response.text();

        if (response.ok) {
            console.log('✅ Email sent successfully via EmailJS to:', email);
            return res.status(200).json({ 
                success: true, 
                message: 'Email sent successfully'
            });
        } else {
            console.error('❌ EmailJS API error:', response.status, responseText);
            
            // Анализируем ошибку
            let errorMessage = 'Email service error';
            if (responseText.includes('Invalid user ID')) errorMessage = 'Invalid Public Key';
            else if (responseText.includes('Invalid service ID')) errorMessage = 'Invalid Service ID';
            else if (responseText.includes('Invalid template ID')) errorMessage = 'Invalid Template ID';
            
            return res.status(500).json({ 
                success: false, 
                error: errorMessage,
                details: responseText.substring(0, 100) // первые 100 символов ошибки
            });
        }
        
    } catch (error) {
        console.error('❌ Network error:', error);
        return res.status(500).json({ 
            success: false, 
            error: 'Network error',
            details: error.message
        });
    }
};
