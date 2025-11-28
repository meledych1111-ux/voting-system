// Инициализация приложения
document.addEventListener('DOMContentLoaded', async () => {
  // Получаем ключи EmailJS из переменных окружения
  try {
    const response = await fetch('/api/get-emailjs-keys');
    const keys = await response.json();
    
    if (keys.publicKey) {
      emailjs.init(keys.publicKey);
      window.EMAILJS_KEYS = keys;
      console.log('✅ EmailJS инициализирован');
    } else {
      console.error('❌ Ключи EmailJS не получены');
    }
  } catch (error) {
    console.error('❌ Ошибка получения ключей:', error);
  }
  
  // Инициализация интерфейса
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('userPanel').style.display = 'none';
  document.getElementById('authPanel').style.display = 'block';
  renderAuth();
});
