// Загрузка ключей EmailJS с Vercel
async function initializeEmailJS() {
    try {
        const response = await fetch('/api/get-emailjs-keys');
        const keys = await response.json();
        
        if (keys.publicKey && keys.serviceId && keys.templateId) {
            window.EMAILJS_KEYS = keys;
            emailjs.init(keys.publicKey);
            console.log("✅ EmailJS инициализирован");
            return true;
        } else {
            console.warn("❌ Ключи EmailJS не настроены в Vercel");
            return false;
        }
    } catch (error) {
        console.error("❌ Ошибка загрузки ключей:", error);
        return false;
    }
}

// Автоматическая инициализация
document.addEventListener('DOMContentLoaded', initializeEmailJS);
