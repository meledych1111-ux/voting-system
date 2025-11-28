function changeAdminPassword() {
  const email = localStorage.getItem('adminLoggedIn') || prompt("Введите email администратора");
  const newPass = prompt("Введите новый пароль");
  if (!email || !newPass) return;
  
  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  if (!admins[email]) return alert("Админ не найден");
  
  admins[email].password = btoa(newPass);
  localStorage.setItem('admins', JSON.stringify(admins));
  
  // Отправка email с новым паролем
  if (window.EMAILJS_KEYS) {
    emailjs.send(
      window.EMAILJS_KEYS.serviceId,
      window.EMAILJS_KEYS.templateId,
      {
        to_name: "Администратор",
        to_email: email,
        confirmation_code: "Пароль изменен",
        new_password: newPass,
        title: "Смена пароля в системе голосования"  // ДОБАВЛЕНО TITLE
      }
    ).then(() => {
      console.log("✅ Пароль отправлен на email");
    }).catch((error) => {
      console.error("❌ Ошибка отправки:", error);
      alert("Пароль обновлён: " + newPass);
    });
  } else {
    alert("Пароль обновлён: " + newPass);
  }
  
  alert("Пароль обновлён");
}
