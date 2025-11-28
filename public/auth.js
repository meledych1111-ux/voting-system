// ====== ОСНОВНЫЕ ФУНКЦИИ АУТЕНТИФИКАЦИИ ======
function renderAuth() {
  const container = document.getElementById('authContent');
  const loggedIn = localStorage.getItem('loggedInAs');

  document.getElementById('authPanel').style.display = loggedIn ? 'none' : 'block';
  document.getElementById('adminPanel').style.display = loggedIn === 'admin' ? 'block' : 'none';
  document.getElementById('userPanel').style.display = loggedIn && loggedIn !== 'admin' ? 'block' : 'none';

  if (loggedIn === 'admin') return renderAdminPanel();
  if (loggedIn && loggedIn !== 'admin') return renderVoteUI();

  container.innerHTML = `
    <div class="auth-section">
      <h3>👤 Вход пользователя</h3>
      <input id="userNameInput" type="text" placeholder="Ваше имя" />
      <button onclick="loginUser()">➡️ Войти как пользователь</button>
    </div>
    
    <hr/>
    
    <div class="auth-section">
      <h3>🔐 Вход администратора</h3>
      <input id="adminEmail" type="email" placeholder="Email" />
      <input id="adminPassword" type="password" placeholder="Пароль" />
      <button onclick="loginAdmin()">➡️ Войти как админ</button>
      <button onclick="startAdminRegistration()">📝 Регистрация админа</button>
    </div>
    
    <hr/>
    
    <div class="auth-section">
      <h3>🔑 Восстановление пароля</h3>
      <input id="resetEmail" type="email" placeholder="Email для восстановления" />
      <button onclick="startPasswordReset()">🔄 Восстановить пароль</button>
    </div>
  `;
}

// ====== ПОЛЬЗОВАТЕЛЬ ======
function loginUser() {
  const name = document.getElementById('userNameInput').value.trim();
  if (!name) return alert("Введите имя");
  localStorage.setItem('loggedInAs', name);
  renderAuth();
  updateVoteHeader();
}

// ====== АДМИН ВХОД ======
function loginAdmin() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  
  if (!admins[email]) return alert("Администратор не найден");
  if (admins[email].password !== btoa(password)) return alert("Неверный пароль");
  
  localStorage.setItem('loggedInAs', 'admin');
  localStorage.setItem('adminLoggedIn', email);
  renderAuth();
  updateVoteHeader();
}

// ====== РЕГИСТРАЦИЯ С ПОДТВЕРЖДЕНИЕМ ======
function startAdminRegistration() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  
  if (admins[email]) return alert("Администратор с таким email уже зарегистрирован");
  if (!email || !password) return alert("Заполните все поля");
  if (password.length < 6) return alert("Пароль должен быть не менее 6 символов");

  const code = generateConfirmationCode();
  const hashedPassword = btoa(password);
  
  localStorage.setItem('pendingAdmin', JSON.stringify({ 
    email, 
    password: hashedPassword, 
    code 
  }));
  
  sendConfirmationCode("Администратор", email, code, 'registration');

  document.getElementById('authContent').innerHTML = `
    <h3>📧 Подтверждение регистрации</h3>
    <p>Код подтверждения отправлен на ${email}</p>
    <input id="confirmCodeInput" type="text" placeholder="Введите 6-значный код" maxlength="6" />
    <button onclick="completeAdminRegistration()">✅ Подтвердить регистрацию</button>
    <button onclick="renderAuth()">↩️ Назад</button>
  `;
}

function completeAdminRegistration() {
  const inputCode = document.getElementById('confirmCodeInput').value.trim();
  const pending = JSON.parse(localStorage.getItem('pendingAdmin'));
  
  if (!pending) return alert("Нет данных для подтверждения");
  if (inputCode !== pending.code) return alert("Неверный код подтверждения");

  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  admins[pending.email] = { 
    password: pending.password,
    created: new Date().toISOString()
  };
  
  localStorage.setItem('admins', JSON.stringify(admins));
  localStorage.setItem('loggedInAs', 'admin');
  localStorage.setItem('adminLoggedIn', pending.email);
  localStorage.removeItem('pendingAdmin');
  
  alert("✅ Регистрация администратора завершена!");
  renderAuth();
  updateVoteHeader();
}

// ====== ВОССТАНОВЛЕНИЕ ПАРОЛЯ С ПОДТВЕРЖДЕНИЕМ ======
function startPasswordReset() {
  const email = document.getElementById('resetEmail').value.trim();
  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  
  if (!admins[email]) return alert("Администратор с таким email не найден");

  const newPass = generateRandomPassword();
  const code = generateConfirmationCode();
  
  localStorage.setItem('pendingReset', JSON.stringify({ 
    email, 
    newPass, 
    code 
  }));
  
  sendConfirmationCode("Администратор", email, code, 'password_reset');

  document.getElementById('authContent').innerHTML = `
    <h3>📧 Подтверждение восстановления</h3>
    <p>Код подтверждения отправлен на ${email}</p>
    <input id="confirmCodeInput" type="text" placeholder="Введите 6-значный код" maxlength="6" />
    <button onclick="completePasswordReset()">✅ Подтвердить восстановление</button>
    <button onclick="renderAuth()">↩️ Назад</button>
  `;
}

function completePasswordReset() {
  const inputCode = document.getElementById('confirmCodeInput').value.trim();
  const pending = JSON.parse(localStorage.getItem('pendingReset'));
  
  if (!pending) return alert("Нет данных для восстановления");
  if (inputCode !== pending.code) return alert("Неверный код подтверждения");

  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  admins[pending.email].password = btoa(pending.newPass);
  admins[pending.email].lastPasswordReset = new Date().toISOString();
  
  localStorage.setItem('admins', JSON.stringify(admins));
  localStorage.removeItem('pendingReset');
  
  alert(`✅ Пароль успешно обновлён!\n\nНовый пароль: ${pending.newPass}\n\nСохраните его в надежном месте!`);
  renderAuth();
}

// ====== ОТПРАВКА КОДА ПОДТВЕРЖДЕНИЯ ======
async function sendConfirmationCode(toName, toEmail, code, type = 'registration') {
    console.log("📧 Отправка кода:", { toName, toEmail, code, type });
    
    try {
        if (!window.EMAILJS_KEYS) {
            await initializeEmailJS();
        }

        if (!window.EMAILJS_KEYS || !window.EMAILJS_KEYS.serviceId) {
            throw new Error("EmailJS не настроен");
        }

        console.log("🔄 Отправка через EmailJS...");

        // Определяем заголовок в зависимости от типа
        const title = type === 'registration' 
            ? "Регистрация в системе голосования" 
            : "Восстановление пароля";

        // Все поля должны совпадать с шаблоном EmailJS!
        const templateParams = {
            to_name: toName,
            to_email: toEmail,
            confirmation_code: code,
            title: title  // ДОБАВЛЕНО ПОЛЕ TITLE
        };

        console.log("📨 Параметры отправки:", templateParams);

        const result = await emailjs.send(
            window.EMAILJS_KEYS.serviceId,
            window.EMAILJS_KEYS.templateId,
            templateParams
        );
        
        console.log("✅ Email отправлен успешно!");
        alert("✅ Код подтверждения отправлен на вашу почту!");
        return true;
        
    } catch (error) {
        console.error("❌ Ошибка отправки email:", error);
        console.error("Детали ошибки:", error.text || error.message);
        alert(`❌ Ошибка отправки email\n\nКод подтверждения: ${code}`);
        return false;
    }
}

// ====== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ======
function generateConfirmationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function generateRandomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ====== ВЫХОД ======
function logout() {
  localStorage.removeItem('loggedInAs');
  localStorage.removeItem('adminLoggedIn');
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('userPanel').style.display = 'none';
  document.getElementById('authPanel').style.display = 'block';
  renderAuth();
  updateVoteHeader();
}

// ====== ОБНОВЛЕНИЕ ЗАГОЛОВКА ГОЛОСОВАНИЯ ======
function updateVoteHeader() {
  const role = localStorage.getItem('loggedInAs');
  const header = document.getElementById('voteHeader');
  const controls = document.getElementById('voteControls');

  if (role === 'admin') {
    header.style.display = 'none';
    return;
  }

  if (role) {
    header.style.display = 'flex';
    controls.innerHTML = `
      <button onclick="castVote()">🗳️ Голосовать</button>
      <button onclick="viewResults()">📊 Результаты</button>
      <button onclick="logout()">🚪 Выйти</button>
    `;
  } else {
    header.style.display = 'none';
  }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
  renderAuth();
  updateVoteHeader();
});
