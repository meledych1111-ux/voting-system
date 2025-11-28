// api/send-email.js
module.exports = async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { name, email, code, type = 'confirmation', newPassword } = req.body;
        
        console.log('📧 Sending email to:', email, 'Code:', code);

        // Проверяем наличие всех переменных
        const missingVars = [];
        if (!process.env.EMAILJS_PUBLIC_KEY) missingVars.push('EMAILJS_PUBLIC_KEY');
        if (!process.env.EMAILJS_SERVICE_ID) missingVars.push('EMAILJS_SERVICE_ID');
        if (!process.env.EMAILJS_TEMPLATE_ID) missingVars.push('EMAILJS_TEMPLATE_ID');

        if (missingVars.length > 0) {
            console.log('❌ Missing variables:', missingVars);
            return res.status(500).json({ 
                success: false, 
                error: 'Missing environment variables',
                missing: missingVars
            });
        }

        // Подготавливаем данные
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

        console.log('🔄 Sending to EmailJS API...');

        // Отправляем запрос
        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
            console.error('❌ EmailJS API error:', response.status, responseText);
            
            // Анализируем ошибку
            let errorMessage = `EmailJS error: ${response.status}`;
            if (responseText.includes('Invalid user ID')) {
                errorMessage = 'Invalid EMAILJS_PUBLIC_KEY';
            } else if (responseText.includes('Invalid service ID')) {
                errorMessage = 'Invalid EMAILJS_SERVICE_ID';
            } else if (responseText.includes('Invalid template ID')) {
                errorMessage = 'Invalid EMAILJS_TEMPLATE_ID';
            }

            return res.status(500).json({ 
                success: false, 
                error: errorMessage,
                details: responseText
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
