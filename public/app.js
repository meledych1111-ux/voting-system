// ====== КОНФИГУРАЦИЯ ======
const CONFIG = {
    appName: "Система голосования",
    version: "1.0.0"
};

// ====== ИНИЦИАЛИЗАЦИЯ ======
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log(`🚀 ${CONFIG.appName} v${CONFIG.version} запущена`);
    
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('userPanel').style.display = 'none';
    document.getElementById('authPanel').style.display = 'block';
    document.getElementById('voteHeader').style.display = 'none';
    
    initializeStorage();
    checkExistingAuth();
}

function initializeStorage() {
    if (!localStorage.getItem('admins')) {
        localStorage.setItem('admins', JSON.stringify({}));
    }
    if (!localStorage.getItem('pollList')) {
        localStorage.setItem('pollList', JSON.stringify([]));
    }
}

function checkExistingAuth() {
    const loggedInAs = localStorage.getItem('loggedInAs');
    
    if (loggedInAs === 'admin') {
        showAdminPanel();
    } else if (loggedInAs && loggedInAs !== 'admin') {
        showUserPanel();
    } else {
        renderAuth();
    }
}

function showAdminPanel() {
    document.getElementById('authPanel').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('userPanel').style.display = 'none';
    renderAdminPanel();
}

function showUserPanel() {
    document.getElementById('authPanel').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('userPanel').style.display = 'block';
    updateVoteHeader();
    renderVoteUI();
}

// ====== АУТЕНТИФИКАЦИЯ ======
function renderAuth() {
    const container = document.getElementById('authContent');
    const loggedIn = localStorage.getItem('loggedInAs');

    if (loggedIn === 'admin') {
        showAdminPanel();
        return;
    }
    
    if (loggedIn && loggedIn !== 'admin') {
        showUserPanel();
        return;
    }

    container.innerHTML = `
        <h3>👤 Вход пользователя</h3>
        <input id="userNameInput" type="text" placeholder="Ваше имя" />
        <button onclick="loginUser()">➡️ Войти как пользователь</button>
        
        <hr/>
        
        <h3>🔐 Вход администратора</h3>
        <input id="adminEmail" type="email" placeholder="Email" />
        <input id="adminPassword" type="password" placeholder="Пароль" />
        <button onclick="loginAdmin()">➡️ Войти как админ</button>
        <button onclick="startAdminRegistration()">📝 Регистрация админа</button>
        
        <hr/>
        
        <h3>🔑 Восстановление пароля</h3>
        <input id="resetEmail" type="email" placeholder="Email для восстановления" />
        <button onclick="startPasswordReset()">🔄 Восстановить пароль</button>
    `;
}

function loginUser() {
    const name = document.getElementById('userNameInput').value.trim();
    if (!name) return alert("Введите имя");
    localStorage.setItem('loggedInAs', name);
    renderAuth();
}

function loginAdmin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    const admins = JSON.parse(localStorage.getItem('admins')) || {};
    if (!admins[email]) return alert("Админ не найден");
    if (admins[email].password !== btoa(password)) return alert("Неверный пароль");
    localStorage.setItem('loggedInAs', 'admin');
    localStorage.setItem('adminLoggedIn', email);
    renderAuth();
}

function startAdminRegistration() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    const admins = JSON.parse(localStorage.getItem('admins')) || {};
    if (admins[email]) return alert("Уже зарегистрирован");

    const code = generateConfirmationCode();
    const hashedPassword = btoa(password);
    
    localStorage.setItem('pendingAdmin', JSON.stringify({ email, password: hashedPassword, code }));

    // Отправка email
    sendConfirmationEmail("Администратор", email, code, 'registration');

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
    admins[pending.email] = { password: pending.password };
    localStorage.setItem('admins', JSON.stringify(admins));
    localStorage.setItem('loggedInAs', 'admin');
    localStorage.setItem('adminLoggedIn', pending.email);
    localStorage.removeItem('pendingAdmin');
    alert("Регистрация завершена");
    renderAuth();
}

function startPasswordReset() {
    const email = document.getElementById('resetEmail').value.trim();
    const admins = JSON.parse(localStorage.getItem('admins')) || {};
    if (!admins[email]) return alert("Админ не найден");

    const newPass = generateRandomPassword();
    const code = generateConfirmationCode();
    
    localStorage.setItem('pendingReset', JSON.stringify({ email, newPass, code }));

    sendConfirmationEmail("Администратор", email, code, 'password_reset', newPass);

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

// ====== АДМИН-ПАНЕЛЬ ======
function renderAdminPanel() {
    const email = localStorage.getItem('adminLoggedIn');
    const container = document.getElementById('adminContent');
    if (!email) { container.innerHTML = "<p>Нет данных админа.</p>"; return; }

    container.innerHTML = `
        <p>👤 Админ: <strong>${email}</strong> <button onclick="logout()">🚪 Выйти</button></p>
        <div class="tabs">
            <button data-tab="create" class="active">Создание</button>
            <button data-tab="history">История</button>
            <button data-tab="settings">Настройки</button>
        </div>
        <div id="adminTabContent"></div>
    `;

    const tabs = container.querySelectorAll('.tabs button');
    const content = document.getElementById('adminTabContent');
    function renderTab(tab) {
        tabs.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
        if (tab === 'create') renderPollCreator(content);
        else if (tab === 'history') renderVoteHistory(content);
        else if (tab === 'settings') renderAdminSettings(content);
    }
    tabs.forEach(b => b.addEventListener('click', () => renderTab(b.dataset.tab)));
    renderTab('create');
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
        <button onclick="changeAdminPassword()">🔑 Сменить пароль</button>
        <button onclick="wipeAllData()">🧹 Очистить всё</button>
    `;
}

function changeAdminPassword() {
    const email = localStorage.getItem('adminLoggedIn');
    const newPass = prompt("Введите новый пароль:");
    if (!newPass) return;
    const admins = JSON.parse(localStorage.getItem('admins')) || {};
    admins[email].password = btoa(newPass);
    localStorage.setItem('admins', JSON.stringify(admins));
    
    // Безопасная отправка через переменные окружения
    sendEmailWithPassword(email, newPass);
    
    alert("Пароль обновлён");
}

function wipeAllData() {
    localStorage.clear();
    alert("Все данные очищены.");
    renderAuth();
}

// ====== EMAILJS ФУНКЦИИ ======
async function sendConfirmationEmail(name, email, code, type = 'confirmation', newPassword = null) {
    try {
        const templateParams = {
            to_name: name,
            confirmation_code: code
        };

        if (newPassword) {
            templateParams.new_password = newPassword;
        }

        // Получаем ключи из переменных окружения
        const emailData = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            template_params: templateParams
        };

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });

        if (response.ok) {
            console.log('✅ Email sent successfully');
            return true;
        } else {
            throw new Error('Email sending failed');
        }
    } catch (error) {
        console.log('📧 Email simulation:', { email, code, newPassword });
        // Fallback - показываем данные пользователю
        if (newPassword) {
            alert(`Новый пароль: ${newPassword}\nКод: ${code}`);
        } else {
            alert(`Код подтверждения: ${code}`);
        }
        return false;
    }
}

async function sendEmailWithPassword(email, newPassword) {
    try {
        const templateParams = {
            to_name: "Администратор",
            to_email: email,
            new_password: newPassword
        };

        const emailData = {
            service_id: process.env.EMAILJS_SERVICE_ID,
            template_id: process.env.EMAILJS_TEMPLATE_ID,
            user_id: process.env.EMAILJS_PUBLIC_KEY,
            template_params: templateParams
        };

        const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData)
        });

        if (response.ok) {
            console.log('✅ Password email sent');
        }
    } catch (error) {
        console.log('📧 Password email simulation');
    }
}

// ====== УТИЛИТЫ ======
function generateRandomPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 10; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

function generateConfirmationCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function updateVoteHeader() {
    const role = localStorage.getItem('loggedInAs');
    const header = document.getElementById('voteHeader');
    const controls = document.getElementById('voteControls');

    if (role && role !== 'admin') {
        header.style.display = 'flex';
        controls.innerHTML = `
            <button onclick="renderVoteUI()">🗳️ Голосовать</button>
            <button onclick="showResults()">📊 Результаты</button>
            <button onclick="logout()">🚪 Выйти</button>
        `;
    } else {
        header.style.display = 'none';
    }
}

function renderVoteUI() {
    const container = document.getElementById('userContent');
    const poll = JSON.parse(localStorage.getItem('activePoll'));
    const name = localStorage.getItem('loggedInAs');

    if (!poll || !name || name === 'admin') {
        container.innerHTML = `<p>Нет активного опроса или вы не пользователь</p>`;
        container.innerHTML += `<button onclick="logout()">🚪 Выйти</button>`;
        return;
    }

    container.innerHTML = `<h3>${poll.question}</h3>`;

    poll.options.forEach(opt => {
        container.innerHTML += `<button onclick="castVote('${opt}')">${opt}</button><br/>`;
    });

    if (poll.allowOther && poll.options.includes('Иное')) {
        container.innerHTML += `<input id="customAnswer" type="text" placeholder="Ваш вариант" /><br/>`;
    }

    const currentVote = poll.votes?.[name];
    if (currentVote) {
        container.innerHTML += `<p>🔄 Вы выбрали: <strong>${currentVote}</strong></p>`;
        container.innerHTML += `<button onclick="resetMyVote()">🧹 Сбросить голос</button>`;
    }

    container.innerHTML += `<button onclick="logout()">🚪 Выйти</button>`;
}

function castVote(option) {
    const poll = JSON.parse(localStorage.getItem('activePoll'));
    const name = localStorage.getItem('loggedInAs');

    if (option === 'Иное') {
        if (!poll.allowOther) return alert("Вариант 'Иное' не разрешён");
        const custom = document.getElementById('customAnswer').value.trim();
        if (!custom) return alert("Введите свой вариант");
        option = custom;
    }

    poll.votes = poll.votes || {};
    poll.votes[name] = option;
    localStorage.setItem('activePoll', JSON.stringify(poll));
    alert("Голос учтён");
    renderVoteUI();
}

function resetMyVote() {
    const poll = JSON.parse(localStorage.getItem('activePoll'));
    const name = localStorage.getItem('loggedInAs');
    if (!poll || !poll.votes?.[name]) return alert("Нет голоса для сброса");

    delete poll.votes[name];
    localStorage.setItem('activePoll', JSON.stringify(poll));
    alert("Голос сброшен");
    renderVoteUI();
}

function showResults() {
    const poll = JSON.parse(localStorage.getItem('activePoll'));
    const container = document.getElementById('userContent');
    
    if (!poll) {
        container.innerHTML = '<p>Нет активного опроса</p>';
        return;
    }

    const votes = poll.votes || {};
    const summary = {};
    Object.values(votes).forEach(v => {
        summary[v] = (summary[v] || 0) + 1;
    });

    container.innerHTML = `<h3>📊 Результаты: ${poll.question}</h3>`;
    Object.entries(summary).forEach(([opt, count]) => {
        container.innerHTML += `${opt}: ${count}<br/>`;
    });
    container.innerHTML += `<button onclick="renderVoteUI()">← Назад</button>`;
}

function logout() {
    localStorage.removeItem('loggedInAs');
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('userPanel').style.display = 'none';
    document.getElementById('authPanel').style.display = 'block';
    document.getElementById('voteHeader').style.display = 'none';
    renderAuth();
}

// Делаем функции глобальными для HTML
window.loginUser = loginUser;
window.loginAdmin = loginAdmin;
window.startAdminRegistration = startAdminRegistration;
window.startPasswordReset = startPasswordReset;
window.completeAdminRegistration = completeAdminRegistration;
window.completePasswordReset = completePasswordReset;
window.logout = logout;
window.renderVoteUI = renderVoteUI;
window.castVote = castVote;
window.resetMyVote = resetMyVote;
window.showResults = showResults;
window.renderAdminPanel = renderAdminPanel;
window.addOptionField = addOptionField;
window.addOtherOption = addOtherOption;
window.createPoll = createPoll;
window.activatePoll = activatePoll;
window.deletePoll = deletePoll;
window.changeAdminPassword = changeAdminPassword;
window.wipeAllData = wipeAllData;
