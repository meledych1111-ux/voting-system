const emailjs = require('emailjs-com');

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
        
        console.log('📧 Email request received:', {
            to: email,
            name: name,
            type: type,
            code: code
        });

        // Инициализация EmailJS с ключами из переменных окружения Vercel
        emailjs.init(process.env.EMAILJS_PUBLIC_KEY);

        // Определяем параметры шаблона в зависимости от типа
        const templateParams = {
            to_name: name,
            to_email: email,
            confirmation_code: code,
            type: type
        };

        // Добавляем пароль для восстановления
        if (type === 'password_reset' && newPassword) {
            templateParams.new_password = newPassword;
        }

        // Отправка email через EmailJS
        const result = await emailjs.send(
            process.env.EMAILJS_SERVICE_ID,
            process.env.EMAILJS_TEMPLATE_ID,
            templateParams
        );

        console.log('✅ Email sent successfully to:', email);
        
        res.status(200).json({ 
            success: true, 
            message: 'Email sent successfully',
            email: email,
            type: type
        });
        
    } catch (error) {
        console.error('❌ Email sending error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to send email',
            details: error.text || error.message
        });
    }
};
