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
        console.log('✅ Инициализировано хранилище администраторов');
    }
    if (!localStorage.getItem('pollList')) {
        localStorage.setItem('pollList', JSON.stringify([]));
        console.log('✅ Инициализировано хранилище опросов');
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
        <div class="info-message">
            Добро пожаловать в систему голосования!
        </div>

        <h3>👤 Участие в голосовании</h3>
        <input id="userNameInput" type="text" placeholder="Введите ваше имя" />
        <button onclick="loginUser()">➡️ Войти как участник</button>
        
        <hr/>
        
        <h3>🔐 Панель администратора</h3>
        <input id="adminEmail" type="email" placeholder="Email администратора" />
        <input id="adminPassword" type="password" placeholder="Пароль" />
        <button onclick="loginAdmin()">➡️ Войти как администратор</button>
        <button onclick="startAdminRegistration()" class="btn-secondary">📝 Зарегистрировать администратора</button>
        
        <hr/>
        
        <h3>🔑 Восстановление доступа</h3>
        <input id="resetEmail" type="email" placeholder="Email для восстановления" />
        <button onclick="startPasswordReset()" class="btn-secondary">🔄 Восстановить пароль</button>
    `;
}

function loginUser() {
    const name = document.getElementById('userNameInput').value.trim();
    if (!name) {
        alert("⚠️ Пожалуйста, введите ваше имя");
        return;
    }
    if (name.toLowerCase() === 'admin') {
        alert("⚠️ Имя 'admin' зарезервировано для системы");
        return;
    }
    
    localStorage.setItem('loggedInAs', name);
    showUserPanel();
}

function loginAdmin() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    const admins = JSON.parse(localStorage.getItem('admins')) || {};
    
    if (!email || !password) {
        alert("⚠️ Заполните все поля");
        return;
    }
    
    if (!admins[email]) {
        alert("❌ Администратор с таким email не найден");
        return;
    }
    
    const hashedPassword = btoa(unescape(encodeURIComponent(password + 'salt_' + password.length)));
    if (admins[email].password !== hashedPassword) {
        alert("❌ Неверный пароль");
        return;
    }
    
    localStorage.setItem('loggedInAs', 'admin');
    localStorage.setItem('adminLoggedIn', email);
    showAdminPanel();
}

function startAdminRegistration() {
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value.trim();
    const admins = JSON.parse(localStorage.getItem('admins')) || {};
    
    if (!email || !password) {
        alert("⚠️ Заполните все поля");
        return;
    }
    
    if (admins[email]) {
        alert("❌ Администратор с таким email уже зарегистрирован");
        return;
    }

    if (password.length < 6) {
        alert("⚠️ Пароль должен содержать не менее 6 символов");
        return;
    }

    const code = generateConfirmationCode();
    const hashedPassword = btoa(unescape(encodeURIComponent(password + 'salt_' + password.length)));
    
    localStorage.setItem('pendingAdmin', JSON.stringify({ 
        email, 
        password: hashedPassword, 
        code,
        timestamp: Date.now()
    }));

    sendConfirmationEmail("Администратор", email, code, 'registration');

    document.getElementById('authContent').innerHTML = `
        <div class="info-message">
            📧 Код подтверждения отправлен на ${email}
        </div>
        <h3>📧 Подтверждение регистрации</h3>
        <p>Введите 6-значный код из письма:</p>
        <input id="confirmCodeInput" type="text" placeholder="Введите код подтверждения" maxlength="6" />
        <button onclick="completeAdminRegistration()">✅ Завершить регистрацию</button>
        <button onclick="renderAuth()" class="btn-secondary">↩️ Назад к авторизации</button>
    `;
}

function completeAdminRegistration() {
    const inputCode = document.getElementById('confirmCodeInput').value.trim().toUpperCase();
    const pending = JSON.parse(localStorage.getItem('pendingAdmin'));
    
    if (!pending) {
        alert("❌ Нет данных для подтверждения. Начните регистрацию заново.");
        renderAuth();
        return;
    }
    
    // Проверяем срок действия кода (1 час)
    if (Date.now() - pending.timestamp > 60 * 60 * 1000) {
        alert("❌ Срок действия кода истек. Начните регистрацию заново.");
        localStorage.removeItem('pendingAdmin');
        renderAuth();
        return;
    }
    
    if (inputCode !== pending.code) {
        alert("❌ Неверный код подтверждения");
        return;
    }

    const admins = JSON.parse(localStorage.getItem('admins')) || {};
    admins[pending.email] = { 
        password: pending.password,
        created: new Date().toISOString(),
        lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('admins', JSON.stringify(admins));
    localStorage.setItem('loggedInAs', 'admin');
    localStorage.setItem('adminLoggedIn', pending.email);
    localStorage.removeItem('pendingAdmin');
    
    alert("✅ Регистрация администратора завершена!");
    showAdminPanel();
}

function startPasswordReset() {
    const email = document.getElementById('resetEmail').value.trim();
    const admins = JSON.parse(localStorage.getItem('admins')) || {};
    
    if (!email) {
        alert("⚠️ Введите email для восстановления");
        return;
    }
    
    if (!admins[email]) {
        alert("❌ Администратор с таким email не найден");
        return;
    }

    const newPass = generateRandomPassword();
    const code = generateConfirmationCode();
    
    localStorage.setItem('pendingReset', JSON.stringify({ 
        email, 
        newPass, 
        code,
        timestamp: Date.now()
    }));

    sendConfirmationEmail("Администратор", email, code, 'password_reset', newPass);

    document.getElementById('authContent').innerHTML = `
        <div class="info-message">
            📧 Письмо с новым паролем и кодом подтверждения отправлено на ${email}
        </div>
        <h3>📧 Подтверждение восстановления</h3>
        <p>Введите 6-значный код из письма:</p>
        <input id="confirmCodeInput" type="text" placeholder="Введите код подтверждения" maxlength="6" />
        <button onclick="completePasswordReset()">✅ Подтвердить восстановление</button>
        <button onclick="renderAuth()" class="btn-secondary">↩️ Назад к авторизации</button>
    `;
}

function completePasswordReset() {
    const inputCode = document.getElementById('confirmCodeInput').value.trim().toUpperCase();
    const pending = JSON.parse(localStorage.getItem('pendingReset'));
    
    if (!pending) {
        alert("❌ Нет данных для восстановления. Начните процесс заново.");
        renderAuth();
        return;
    }
    
    // Проверяем срок действия кода (1 час)
    if (Date.now() - pending.timestamp > 60 * 60 * 1000) {
        alert("❌ Срок действия кода истек. Начните восстановление заново.");
        localStorage.removeItem('pendingReset');
        renderAuth();
        return;
    }
    
    if (inputCode !== pending.code) {
        alert("❌ Неверный код подтверждения");
        return;
    }

    const admins = JSON.parse(localStorage.getItem('admins')) || {};
    const hashedPassword = btoa(unescape(encodeURIComponent(pending.newPass + 'salt_' + pending.newPass.length)));
    
    admins[pending.email].password = hashedPassword;
    admins[pending.email].lastPasswordReset = new Date().toISOString();
    
    localStorage.setItem('admins', JSON.stringify(admins));
    localStorage.removeItem('pendingReset');
    
    alert(`✅ Пароль успешно обновлён!\n\nНовый пароль: ${pending.newPass}\n\nСохраните его в надежном месте!`);
    renderAuth();
}

// ====== АДМИН-ПАНЕЛЬ ======
function renderAdminPanel() {
    const email = localStorage.getItem('adminLoggedIn') || 'Администратор';
    const container = document.getElementById('adminContent');
    
    container.innerHTML = `
        <div class="admin-header">
            <p>👤 Вы вошли как: <strong>${email}</strong></p>
            <button onclick="logout()" class="btn-logout">🚪 Выйти</button>
        </div>
        
        <div class="tabs">
            <button onclick="showAdminTab('create')" class="active">📝 Создать опрос</button>
            <button onclick="showAdminTab('polls')">📋 Мои опросы</button>
            <button onclick="showAdminTab('stats')">📊 Статистика</button>
            <button onclick="showAdminTab('settings')">⚙️ Настройки</button>
        </div>
        
        <div id="adminTabContent"></div>
    `;
    
    showAdminTab('create');
}

function showAdminTab(tabName) {
    const container = document.getElementById('adminTabContent');
    const tabs = document.querySelectorAll('.tabs button');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.textContent.includes(tabName === 'create' ? 'Создать' : 
                                   tabName === 'polls' ? 'Опросы' :
                                   tabName === 'stats' ? 'Статистика' : 'Настройки')) {
            tab.classList.add('active');
        }
    });
    
    if (tabName === 'create') {
        container.innerHTML = `
            <h3>Создание нового опроса</h3>
            <div class="form-group">
                <label>Вопрос опроса:</label>
                <input type="text" id="pollQuestion" placeholder="Введите вопрос для голосования">
            </div>
            
            <div class="form-group">
                <label>Варианты ответов:</label>
                <div id="pollOptions">
                    <input type="text" class="poll-option" placeholder="Вариант ответа 1">
                    <input type="text" class="poll-option" placeholder="Вариант ответа 2">
                </div>
            </div>
            
            <button onclick="addPollOption()">➕ Добавить вариант ответа</button>
            <button onclick="createPoll()" class="btn-secondary">✅ Создать и активировать опрос</button>
        `;
    } else if (tabName === 'polls') {
        renderPollList(container);
    } else if (tabName === 'stats') {
        renderStats(container);
    } else if (tabName === 'settings') {
        container.innerHTML = `
            <h3>Настройки системы</h3>
            <div class="info-message">
                Все данные хранятся локально в вашем браузере
            </div>
            <button onclick="exportData()">💾 Экспорт данных</button>
            <button onclick="clearAllData()" class="btn-logout">🗑️ Очистить все данные</button>
        `;
    }
}

function addPollOption() {
    const container = document.getElementById('pollOptions');
    const optionCount = container.children.length + 1;
    const newInput = document.createElement('input');
    newInput.type = 'text';
    newInput.className = 'poll-option';
    newInput.placeholder = `Вариант ответа ${optionCount}`;
    container.appendChild(newInput);
}

function createPoll() {
    const question = document.getElementById('pollQuestion').value.trim();
    const optionInputs = document.querySelectorAll('.poll-option');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(opt => opt.length > 0);
    
    if (!question) {
        alert('⚠️ Введите вопрос опроса');
        return;
    }
    
    if (options.length < 2) {
        alert('⚠️ Добавьте хотя бы 2 варианта ответа');
        return;
    }

    // Проверяем уникальность вариантов
    const uniqueOptions = [...new Set(options)];
    if (uniqueOptions.length !== options.length) {
        alert('⚠️ Удалите повторяющиеся варианты ответов');
        return;
    }
    
    const poll = {
        id: Date.now(),
        question: question,
        options: options,
        votes: {},
        created: new Date().toLocaleString('ru-RU'),
        createdBy: localStorage.getItem('adminLoggedIn'),
        active: true,
        totalVotes: 0
    };
    
    const polls = JSON.parse(localStorage.getItem('pollList')) || [];
    // Деактивируем старые опросы
    polls.forEach(p => p.active = false);
    polls.push(poll);
    
    localStorage.setItem('pollList', JSON.stringify(polls));
    localStorage.setItem('activePoll', JSON.stringify(poll));
    
    alert('✅ Опрос создан и активирован!');
    showAdminTab('polls');
}

function renderPollList(container) {
    const polls = JSON.parse(localStorage.getItem('pollList')) || [];
    const activePoll = JSON.parse(localStorage.getItem('activePoll'));
    
    container.innerHTML = '<h3>Мои опросы</h3>';
    
    if (polls.length === 0) {
        container.innerHTML += '<div class="info-message">У вас пока нет созданных опросов</div>';
        return;
    }
    
    // Сортируем по дате создания (новые сверху)
    polls.sort((a, b) => b.id - a.id);
    
    polls.forEach(poll => {
        const voteCount = Object.keys(poll.votes || {}).length;
        const isActive = activePoll && activePoll.id === poll.id;
        
        container.innerHTML += `
            <div class="poll-item">
                <strong>${poll.question}</strong><br>
                <small>📅 Создан: ${poll.created} | 🗳️ Голосов: ${voteCount}</small><br>
                <small>📋 Вариантов: ${poll.options.length}</small><br>
                <div class="poll-actions">
                    ${isActive ? 
                        '<span class="success-message">✅ Активен</span>' : 
                        `<button onclick="activatePoll(${poll.id})" class="btn-secondary">🟢 Активировать</button>`
                    }
                    <button onclick="viewPollResults(${poll.id})">📊 Результаты</button>
                    <button onclick="deletePoll(${poll.id})" class="btn-logout">🗑️ Удалить</button>
                </div>
            </div>
        `;
    });
}

function activatePoll(pollId) {
    const polls = JSON.parse(localStorage.getItem('pollList')) || [];
    const poll = polls.find(p => p.id === pollId);
    
    if (poll) {
        // Деактивируем все опросы
        polls.forEach(p => p.active = false);
        poll.active = true;
        
        localStorage.setItem('pollList', JSON.stringify(polls));
        localStorage.setItem('activePoll', JSON.stringify(poll));
        
        alert('✅ Опрос активирован!');
        showAdminTab('polls');
    }
}

function viewPollResults(pollId) {
    const polls = JSON.parse(localStorage.getItem('pollList')) || [];
    const poll = polls.find(p => p.id === pollId);
    
    if (!poll) return;
    
    const container = document.getElementById('adminTabContent');
    const voteCount = Object.keys(poll.votes || {}).length;
    
    let resultsHTML = `
        <h3>📊 Результаты: ${poll.question}</h3>
        <p>Всего голосов: <strong>${voteCount}</strong></p>
    `;
    
    if (voteCount > 0) {
        const voteCounts = {};
        Object.values(poll.votes).forEach(vote => {
            voteCounts[vote] = (voteCounts[vote] || 0) + 1;
        });
        
        resultsHTML += '<div class="results-container">';
        Object.entries(voteCounts).forEach(([option, count]) => {
            const percentage = ((count / voteCount) * 100).toFixed(1);
            resultsHTML += `
                <div class="result-item">
                    <div class="option">${option}</div>
                    <div class="bar-container">
                        <div class="bar" style="width: ${percentage}%">${percentage}%</div>
                    </div>
                    <div class="count">${count}</div>
                </div>
            `;
        });
        resultsHTML += '</div>';
    } else {
        resultsHTML += '<div class="info-message">Пока нет голосов</div>';
    }
    
    resultsHTML += `<button onclick="showAdminTab('polls')">← Назад к списку опросов</button>`;
    container.innerHTML = resultsHTML;
}

function deletePoll(pollId) {
    if (!confirm('❌ Вы уверены, что хотите удалить этот опрос? Все данные о голосах будут утеряны.')) {
        return;
    }
    
    let polls = JSON.parse(localStorage.getItem('pollList')) || [];
    polls = polls.filter(p => p.id !== pollId);
    
    localStorage.setItem('pollList', JSON.stringify(polls));
    
    const activePoll = JSON.parse(localStorage.getItem('activePoll'));
    if (activePoll && activePoll.id === pollId) {
        localStorage.removeItem('activePoll');
    }
    
    alert('✅ Опрос удалён!');
    showAdminTab('polls');
}

function renderStats(container) {
    const polls = JSON.parse(localStorage.getItem('pollList')) || [];
    const admins = JSON.parse(localStorage.getItem('admins')) || {};
    const activePoll = JSON.parse(localStorage.getItem('activePoll'));
    
    const totalPolls = polls.length;
    const totalVotes = polls.reduce((sum, poll) => sum + Object.keys(poll.votes || {}).length, 0);
    const totalAdmins = Object.keys(admins).length;
    
    container.innerHTML = `
        <h3>📊 Статистика системы</h3>
        <div class="stats-grid">
            <div class="stat-item">
                <div class="stat-number">${totalPolls}</div>
                <div class="stat-label">Всего опросов</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${totalVotes}</div>
                <div class="stat-label">Всего голосов</div>
            </div>
            <div class="stat-item">
                <div class="stat-number">${totalAdmins}</div>
                <div class="stat-label">Администраторов</div>
            </div>
        </div>
        
        ${activePoll ? `
            <div class="info-message">
                <strong>Активный опрос:</strong> ${activePoll.question}<br>
                <strong>Голосов:</strong> ${Object.keys(activePoll.votes || {}).length}
            </div>
        ` : ''}
        
        <button onclick="showAdminTab('create')">📝 Создать новый опрос</button>
    `;
}

// ====== ГОЛОСОВАНИЕ ======
function renderVoteUI() {
    const container = document.getElementById('userContent');
    const poll = JSON.parse(localStorage.getItem('activePoll'));
    const userName = localStorage.getItem('loggedInAs');
    
    if (!poll) {
        container.innerHTML = `
            <div class="info-message">
                В настоящее время нет активных опросов для голосования.
                Обратитесь к администратору системы.
            </div>
            <button onclick="logout()">🚪 Выйти</button>
        `;
        return;
    }
    
    const userVote = poll.votes && poll.votes[userName];
    
    container.innerHTML = `
        <h3>${poll.question}</h3>
        <p>Выберите один вариант:</p>
        
        <div id="voteOptions">
            ${poll.options.map(option => `
                <label>
                    <input type="radio" name="vote" value="${option}" 
                           ${userVote === option ? 'checked disabled' : ''}>
                    ${option}
                </label>
            `).join('')}
        </div>
        
        ${userVote ? `
            <div class="success-message">
                ✅ Вы уже проголосовали за: <strong>${userVote}</strong>
            </div>
            <button onclick="resetVote()">🔄 Изменить свой голос</button>
            <button onclick="showResults()">📊 Посмотреть текущие результаты</button>
        ` : `
            <button onclick="submitVote()">🗳️ Отправить голос</button>
            <button onclick="showResults()" class="btn-secondary">📊 Посмотреть результаты</button>
        `}
        
        <button onclick="logout()">🚪 Выйти</button>
    `;
}

function submitVote() {
    const selectedOption = document.querySelector('input[name="vote"]:checked');
    const userName = localStorage.getItem('loggedInAs');
    const poll = JSON.parse(localStorage.getItem('activePoll'));
    
    if (!selectedOption) {
        alert('⚠️ Пожалуйста, выберите вариант ответа');
        return;
    }
    
    if (!poll.votes) poll.votes = {};
    poll.votes[userName] = selectedOption.value;
    poll.totalVotes = Object.keys(poll.votes).length;
    
    localStorage.setItem('activePoll', JSON.stringify(poll));
    
    // Обновляем в общем списке
    const polls = JSON.parse(localStorage.getItem('pollList')) || [];
    const pollIndex = polls.findIndex(p => p.id === poll.id);
    if (pollIndex !== -1) {
        polls[pollIndex].votes = poll.votes;
        polls[pollIndex].totalVotes = poll.totalVotes;
        localStorage.setItem('pollList', JSON.stringify(polls));
    }
    
    alert('✅ Ваш голос учтён! Спасибо за участие.');
    renderVoteUI();
}

function resetVote() {
    const userName = localStorage.getItem('loggedInAs');
    const poll = JSON.parse(localStorage.getItem('activePoll'));
    
    if (!confirm('Вы уверены, что хотите изменить свой голос?')) {
        return;
    }
    
    if (poll.votes && poll.votes[userName]) {
        delete poll.votes[userName];
        poll.totalVotes = Object.keys(poll.votes).length;
        localStorage.setItem('activePoll', JSON.stringify(poll));
        
        // Обновляем в общем списке
        const polls = JSON.parse(localStorage.getItem('pollList')) || [];
        const pollIndex = polls.findIndex(p => p.id === poll.id);
        if (pollIndex !== -1) {
            polls[pollIndex].votes = poll.votes;
            polls[pollIndex].totalVotes = poll.totalVotes;
            localStorage.setItem('pollList', JSON.stringify(polls));
        }
        
        alert('✅ Ваш голос сброшен! Теперь вы можете проголосовать заново.');
        renderVoteUI();
    }
}

function showResults() {
    const poll = JSON.parse(localStorage.getItem('activePoll'));
    const container = document.getElementById('userContent');
    const userName = localStorage.getItem('loggedInAs');
    const userVote = poll.votes && poll.votes[userName];
    
    if (!poll || !poll.votes) {
        container.innerHTML = '<div class="info-message">Пока нет результатов для отображения</div>';
        return;
    }
    
    const voteCounts = {};
    Object.values(poll.votes).forEach(vote => {
        voteCounts[vote] = (voteCounts[vote] || 0) + 1;
    });
    
    const totalVotes = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
    
    container.innerHTML = `
        <h3>📊 Результаты голосования</h3>
        <p><strong>Вопрос:</strong> ${poll.question}</p>
        <p><strong>Всего голосов:</strong> ${totalVotes}</p>
        
        ${userVote ? `<div class="success-message">Ваш голос: <strong>${userVote}</strong></div>` : ''}
        
        <div class="results-container">
            ${Object.entries(voteCounts).map(([option, count]) => {
                const percentage = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
                return `
                    <div class="result-item">
                        <div class="option">${option}</div>
                        <div class="bar-container">
                            <div class="bar" style="width: ${percentage}%">${percentage}%</div>
                        </div>
                        <div class="count">${count}</div>
                    </div>
                `;
            }).join('')}
        </div>
        
        <button onclick="renderVoteUI()">← Назад к голосованию</button>
        <button onclick="logout()">🚪 Выйти</button>
    `;
}

// ====== УТИЛИТЫ ======
function updateVoteHeader() {
    const role = localStorage.getItem('loggedInAs');
    const header = document.getElementById('voteHeader');
    const controls = document.getElementById('voteControls');
    
    if (role && role !== 'admin') {
        header.style.display = 'flex';
        controls.innerHTML = `
            <button onclick="renderVoteUI()">🗳️ Голосовать</button>
            <button onclick="showResults()">📊 Результаты</button>
            <button onclick="logout()" class="btn-logout">🚪 Выйти</button>
        `;
    } else {
        header.style.display = 'none';
    }
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти?')) {
        localStorage.removeItem('loggedInAs');
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('userPanel').style.display = 'none';
        document.getElementById('authPanel').style.display = 'block';
        document.getElementById('voteHeader').style.display = 'none';
        renderAuth();
    }
}

function clearAllData() {
    if (confirm('❌ ВНИМАНИЕ! Это действие удалит ВСЕ данные:\n\n• Все опросы и результаты голосований\n• Всех администраторов\n• Всю историю голосований\n\nВы уверены?')) {
        localStorage.clear();
        alert('✅ Все данные системы очищены');
        initializeApp();
    }
}

function exportData() {
    const data = {
        admins: JSON.parse(localStorage.getItem('admins') || '{}'),
        polls: JSON.parse(localStorage.getItem('pollList') || '[]'),
        activePoll: JSON.parse(localStorage.getItem('activePoll') || 'null'),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `voting-system-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    alert('✅ Данные экспортированы в файл');
}

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

async function sendConfirmationEmail(name, email, code, type = 'confirmation', newPassword = null) {
    try {
        const payload = {
            name: name,
            email: email,
            code: code,
            type: type
        };
        
        if (type === 'password_reset' && newPassword) {
            payload.newPassword = newPassword;
        }

        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Email sent successfully to:', email);
            return true;
        } else {
            console.error('❌ Email sending failed:', result.error);
            // Fallback - показываем информацию пользователю
            if (type === 'password_reset') {
                alert(`📧 Сервис email временно недоступен.\n\nНовый пароль: ${newPassword}\nКод подтверждения: ${code}`);
            } else {
                alert(`📧 Сервис email временно недоступен.\nКод подтверждения: ${code}`);
            }
            return false;
        }
    } catch (error) {
        console.error('❌ Network error:', error);
        // Fallback - показываем информацию пользователю
        if (type === 'password_reset') {
            alert(`📧 Ошибка отправки email.\n\nНовый пароль: ${newPassword}\nКод подтверждения: ${code}\n\nСохраните эту информацию!`);
        } else {
            alert(`📧 Ошибка отправки email.\nКод подтверждения: ${code}\n\nИспользуйте этот код для подтверждения.`);
        }
        return false;
    }
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
window.submitVote = submitVote;
window.resetVote = resetVote;
window.showResults = showResults;
window.showAdminTab = showAdminTab;
window.addPollOption = addPollOption;
window.createPoll = createPoll;
window.activatePoll = activatePoll;
window.deletePoll = deletePoll;
window.viewPollResults = viewPollResults;
window.clearAllData = clearAllData;
window.exportData = exportData;

// Добавляем стили для статистики
const additionalStyles = `
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 15px;
        margin: 20px 0;
    }
    .stat-item {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
    }
    .stat-number {
        font-size: 2em;
        font-weight: bold;
        color: #1e3a8a;
    }
    .stat-label {
        color: #64748b;
        font-size: 0.9em;
    }
    .admin-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        padding: 15px;
        background: #f0f9ff;
        border-radius: 8px;
        border: 1px solid #bae6fd;
    }
    .poll-actions {
        display: flex;
        gap: 8px;
        margin-top: 10px;
        flex-wrap: wrap;
    }
    .poll-actions button {
        width: auto;
        padding: 6px 12px;
        font-size: 0.9em;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
