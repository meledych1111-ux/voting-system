function renderAdminPanel() {
  const container = document.getElementById('adminContent');
  container.innerHTML = `
    <div class="tabs">
      <button onclick="showAdminTab('create')">📝 Создать</button>
      <button onclick="showAdminTab('list')">📋 Опросы</button>
      <button onclick="showAdminTab('history')">📊 История</button>
      <button onclick="showAdminTab('settings')">⚙️ Настройки</button>
      <button onclick="logout()">🚪 Выйти</button>
    </div>
    <div id="adminTabContent"></div>
  `;
  showAdminTab('create');
}

function showAdminTab(tab) {
  const container = document.getElementById('adminTabContent');
  if (tab === 'create') renderPollCreator(container);
  if (tab === 'list') renderPollList(container);
  if (tab === 'history') renderVoteHistory(container);
  if (tab === 'settings') renderAdminSettings(container);
}

function renderPollCreator(container) {
  container.innerHTML = `
    <h3>📝 Новый опрос</h3>
    <input id="pollQuestion" type="text" placeholder="Вопрос" /><br/>
    <div id="optionFields"></div>
    <button onclick="addOptionField()">➕ Добавить вариант</button>
    <button onclick="addOtherOption()">➕ Добавить "Иное"</button><br/><br/>
    <button onclick="createPoll()">✅ Создать опрос</button>
  `;
  addOptionField();
  addOptionField();
}

function addOptionField() {
  const container = document.getElementById('optionFields');
  const index = container.children.length + 1;
  const div = document.createElement('div');
  div.innerHTML = `
    <input type="text" placeholder="Вариант ${index}" class="pollOption" />
    <button onclick="this.parentElement.remove()">❌</button>
  `;
  container.appendChild(div);
}

function addOtherOption() {
  const container = document.getElementById('optionFields');
  const exists = Array.from(container.querySelectorAll('.pollOption'))
    .some(input => input.value.trim().toLowerCase() === 'иное');
  if (exists) return alert("«Иное» уже добавлено");

  const div = document.createElement('div');
  div.innerHTML = `
    <input type="text" value="Иное" class="pollOption" readonly />
    <button onclick="this.parentElement.remove()">❌</button>
  `;
  container.appendChild(div);
}

function createPoll() {
  const question = document.getElementById('pollQuestion').value.trim();
  const optionInputs = document.querySelectorAll('.pollOption');
  const options = Array.from(optionInputs)
    .map(input => input.value.trim())
    .filter(opt => opt);

  const allowOther = options.includes('Иное');

  if (!question || options.length < 1) {
    alert("Введите вопрос и хотя бы один вариант");
    return;
  }

  const poll = {
    id: Date.now(),
    question,
    options,
    votes: {},
    created: new Date().toLocaleString(),
    allowOther
  };

  const list = JSON.parse(localStorage.getItem('pollList')) || [];
  list.push(poll);
  localStorage.setItem('pollList', JSON.stringify(list));
  localStorage.setItem('activePoll', JSON.stringify(poll));
  alert("Опрос создан");
  renderPollList(document.getElementById('adminTabContent'));
}

function renderPollList(container) {
  const list = JSON.parse(localStorage.getItem('pollList')) || [];
  const active = JSON.parse(localStorage.getItem('activePoll'))?.id;
  container.innerHTML = `<h3>📋 Все опросы</h3>`;
  list.forEach(poll => {
    container.innerHTML += `
      <div class="pollCard">
        <strong>${poll.question}</strong><br/>
        Вариантов: ${poll.options.length}, Голосов: ${Object.keys(poll.votes || {}).length}<br/>
        ${poll.id === active ? '<span>🟢 Активен</span>' : `<button onclick="activatePoll(${poll.id})">🟢 Активировать</button>`}
        <button onclick="deletePoll(${poll.id})">🗑️ Удалить</button>
      </div>
    `;
  });
}

function activatePoll(id) {
  const list = JSON.parse(localStorage.getItem('pollList')) || [];
  const poll = list.find(p => p.id === id);
  if (!poll) return alert("Опрос не найден");
  localStorage.setItem('activePoll', JSON.stringify(poll));
  alert("Опрос активирован");
  renderPollList(document.getElementById('adminTabContent'));
}

function deletePoll(id) {
  let list = JSON.parse(localStorage.getItem('pollList')) || [];
  list = list.filter(p => p.id !== id);
  localStorage.setItem('pollList', JSON.stringify(list));
  const active = JSON.parse(localStorage.getItem('activePoll'));
  if (active?.id === id) localStorage.removeItem('activePoll');
  alert("Опрос удалён");
  renderPollList(document.getElementById('adminTabContent'));
}

function renderVoteHistory(container) {
  const poll = JSON.parse(localStorage.getItem('activePoll'));
  if (!poll) {
    container.innerHTML = `<p>Нет активного опроса</p>`;
    return;
  }

  container.innerHTML = `<h3>📊 История голосов</h3>`;
  const votes = poll.votes || {};
  const summary = {};

  Object.values(votes).forEach(v => {
    summary[v] = (summary[v] || 0) + 1;
  });

  container.innerHTML += `<strong>${poll.question}</strong><br/>`;
  Object.entries(summary).forEach(([opt, count]) => {
    container.innerHTML += `${opt}: ${count}<br/>`;
  });

  container.innerHTML += `<hr/><h4>Индивидуальные голоса:</h4>`;
  Object.entries(votes).forEach(([user, answer]) => {
    container.innerHTML += `${user}: ${answer}<br/>`;
  });
}

function renderAdminSettings(container) {
  container.innerHTML = `
    <h3>⚙️ Настройки</h3>
    <button onclick="resetPoll()">🔄 Сбросить активный опрос</button><br/>
    <button onclick="clearAllPolls()">🗑️ Очистить все опросы</button><br/>
    <button onclick="changeAdminPassword()">🔐 Сменить пароль</button>
    <button onclick="wipeAllData()">🧹 Очистить всё</button>
  `;
}

function resetPoll() {
  const poll = JSON.parse(localStorage.getItem('activePoll'));
  if (!poll) return alert("Нет активного опроса");
  poll.votes = {};
  localStorage.setItem('activePoll', JSON.stringify(poll));
  alert("Голоса сброшены");
  renderVoteHistory(document.getElementById('adminTabContent'));
}

function clearAllPolls() {
  if (!confirm("Удалить все опросы?")) return;
  localStorage.removeItem('pollList');
  localStorage.removeItem('activePoll');
  alert("Все опросы удалены");
  renderPollList(document.getElementById('adminTabContent'));
}

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
        new_password: newPass
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

function wipeAllData() {
  if (!confirm("Удалить ВСЕ данные?")) return;
  localStorage.clear();
  alert("Все данные очищены.");
  window.location.reload();
}

// Функции для регистрации администратора (ДОБАВЛЕНО)
function startAdminRegistration() {
  const email = document.getElementById('adminEmail').value.trim();
  const password = document.getElementById('adminPassword').value.trim();
  const admins = JSON.parse(localStorage.getItem('admins')) || {};
  
  if (admins[email]) return alert("Уже зарегистрирован");
  if (!email || !password) return alert("Заполните все поля");

  const code = generateConfirmationCode();
  const hashedPassword = btoa(password);
  
  localStorage.setItem('pendingAdmin', JSON.stringify({ 
    email, 
    password: hashedPassword, 
    code 
  }));

  // Отправка кода подтверждения
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
  admins[pending.email] = { 
    password: pending.password,
    created: new Date().toISOString()
  };
  
  localStorage.setItem('admins', JSON.stringify(admins));
  localStorage.setItem('loggedInAs', 'admin');
  localStorage.setItem('adminLoggedIn', pending.email);
  localStorage.removeItem('pendingAdmin');
  
  alert("✅ Регистрация завершена!");
  renderAuth();
}

// Вспомогательные функции (ДОБАВЛЕНО)
function generateConfirmationCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function sendConfirmationCode(toName, toEmail, code) {
  if (!window.EMAILJS_KEYS) {
    alert(`Код подтверждения: ${code}`);
    return;
  }

  emailjs.send(
    window.EMAILJS_KEYS.serviceId,
    window.EMAILJS_KEYS.templateId,
    {
      to_name: toName,
      to_email: toEmail,
      confirmation_code: code
    }
  ).then(() => {
    console.log("✅ Код отправлен");
  }).catch((error) => {
    console.error("❌ Ошибка отправки:", error);
    alert(`Код подтверждения: ${code}`);
  });
}

function logout() {
  localStorage.removeItem('loggedInAs');
  localStorage.removeItem('adminLoggedIn');
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('userPanel').style.display = 'none';
  document.getElementById('authPanel').style.display = 'block';
  renderAuth();
}
