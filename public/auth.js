// ДОБАВЬТЕ ЭТУ ФУНКЦИЮ В НАЧАЛО ФАЙЛА
function sendConfirmationCode(toName, toEmail, code) {
  if (!window.EMAILJS_KEYS) {
    alert('Код подтверждения: ' + code);
    return;
  }

  emailjs.send(
    window.EMAILJS_KEYS.serviceId,
    window.EMAILJS_KEYS.templateId,
    {
      to_name: toName,
      confirmation_code: code
    }
  ).then(() => {
    console.log("✅ Код отправлен");
  }).catch((error) => {
    console.error("❌ Ошибка отправки:", error);
    alert("Код подтверждения: " + code);
  });
}

// ОСТАЛЬНОЙ ВАШ КОД ОСТАВЬТЕ БЕЗ ИЗМЕНЕНИЙ
function renderAuth() {
  // ваш существующий код
}

function loginUser() {
  // ваш существующий код
}

function renderAuth() {
  const container = document.getElementById('authContent');
  const loggedIn = localStorage.getItem('loggedInAs');

  document.getElementById('authPanel').style.display = loggedIn ? 'none' : 'block';
  document.getElementById('adminPanel').style.display = loggedIn === 'admin' ? 'block' : 'none';
  document.getElementById('userPanel').style.display = loggedIn && loggedIn !== 'admin' ? 'block' : 'none';

  if (loggedIn === 'admin') return renderAdminPanel();
  if (loggedIn && loggedIn !== 'admin') return renderVoteUI();

  container.innerHTML = `
    <h3>👤 Вход пользователя</h3>
    <input id="userNameInput" type="text" placeholder="Ваше имя" />
    <button onclick="loginUser()">➡️ Войти как пользователь</button>
    <hr/>
    <h3>🔐 Вход администратора</h3>
    <input id="adminEmail" type="email" placeholder="Email" /><br/>
    <input id="adminPassword" type="password" placeholder="Пароль" /><br/>
    <button onclick="loginAdmin()">➡️ Войти как админ</button>
    <button onclick="startAdminRegistration()">📝 Регистрация админа</button>
    <hr/>
    <h3>🔑 Восстановление пароля</h3>
    <input id="resetEmail" type="email" placeholder="Email для восстановления" />
    <button onclick="startPasswordReset()">🔄 Восстановить пароль</button>
  `;
}

// ====== Пользователь ======
function loginUser() {
  const name = document.getElementById('userNameInput').value.trim();
  if (!name) return alert("Введите имя");
  localStorage.setItem('loggedInAs', name);
  renderAuth();
}

// ====== Админ вход ======
function loginAdmin() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  if (!admins[email]) return alert("Админ не найден");
  if (admins[email].password !== btoa(password)) return alert("Неверный пароль");
  localStorage.setItem('loggedInAs', 'admin');
  renderAuth();
}

// ====== Регистрация с подтверждением ======
function startAdminRegistration() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  if (admins[email]) return alert("Уже зарегистрирован");

  const code = generateConfirmationCode();
  localStorage.setItem('pendingAdmin', JSON.stringify({ email, password, code }));
  sendConfirmationCode("Администратор", email, code);

  document.getElementById('authContent').innerHTML = `
    <h3>📧 Подтверждение регистрации</h3>
    <p>Код отправлен на ${email}</p>
    <input id="confirmCodeInput" type="text" placeholder="Введите код" />
    <button onclick="completeAdminRegistration()">✅ Подтвердить</button>
    <button onclick="renderAuth()">↩️ Назад</button>
  `;
}

function completeAdminRegistration() {
  const inputCode = document.getElementById('confirmCodeInput').value.trim();
  const pending = JSON.parse(localStorage.getItem('pendingAdmin'));
  if (!pending) return alert("Нет данных для подтверждения");

  if (inputCode !== pending.code) return alert("Неверный код");

  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  admins[pending.email] = { password: btoa(pending.password) };
  localStorage.setItem('admins', JSON.stringify(admins));
  localStorage.setItem('loggedInAs', 'admin');
  localStorage.removeItem('pendingAdmin');
  alert("Регистрация завершена");
  renderAuth();
}

// ====== Восстановление с подтверждением ======
function startPasswordReset() {
  const email = document.getElementById('resetEmail').value.trim();
  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  if (!admins[email]) return alert("Админ не найден");

  const newPass = Math.random().toString(36).slice(-8);
  const code = generateConfirmationCode();
  localStorage.setItem('pendingReset', JSON.stringify({ email, newPass, code }));
  sendConfirmationCode("Администратор", email, code);

  document.getElementById('authContent').innerHTML = `
    <h3>📧 Подтверждение восстановления</h3>
    <p>Код отправлен на ${email}</p>
    <input id="confirmCodeInput" type="text" placeholder="Введите код" />
    <button onclick="completePasswordReset()">✅ Подтвердить</button>
    <button onclick="renderAuth()">↩️ Назад</button>
  `;
}

function completePasswordReset() {
  const inputCode = document.getElementById('confirmCodeInput').value.trim();
  const pending = JSON.parse(localStorage.getItem('pendingReset'));
  if (!pending) return alert("Нет данных для восстановления");

  if (inputCode !== pending.code) return alert("Неверный код");

  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  admins[pending.email].password = btoa(pending.newPass);
  localStorage.setItem('admins', JSON.stringify(admins));
  localStorage.removeItem('pendingReset');
  alert(`Пароль обновлён: ${pending.newPass}`);
  renderAuth();
}

// ====== Отправка кода ======
function generateConfirmationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function sendConfirmationCode(toName, toEmail, code) {
  emailjs.send("service_sj7db1v", "template_tsz83er", {
    to_name: toName,
    confirmation_code: code
  }).then(() => {
    console.log("Код подтверждения отправлен");
  }).catch(() => {
    alert("Ошибка при отправке кода");
  });
}

// ====== Выход ======
function logout() {
  localStorage.removeItem('loggedInAs');
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('userPanel').style.display = 'none';
  document.getElementById('authPanel').style.display = 'block';
  renderAuth();
}
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
      <button onclick="castVote()">Голосовать</button>
      <button onclick="viewResults()">Результаты</button>
      <button onclick="logout()">Выйти</button>
    `;
  } else {
    header.style.display = 'none';
  }
}

