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

function logout() {
  localStorage.removeItem('loggedInAs');
  document.getElementById('adminPanel').style.display = 'none';
  document.getElementById('userPanel').style.display = 'none';
  document.getElementById('authPanel').style.display = 'block';
  renderAuth();
}
