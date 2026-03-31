const STORAGE_KEY = 'rutinas-casa-v1';

const defaultState = {
  fixed: [
    { id: crypto.randomUUID(), name: 'Tender la cama', done: false },
    { id: crypto.randomUUID(), name: 'Cepillar dientes', done: false },
  ],
  family: [{ id: crypto.randomUUID(), name: 'Sacar basura', points: 5, done: false }],
  big: [{ id: crypto.randomUUID(), name: 'Ordenar cuarto', points: 15, done: false }],
  rewards: [{ id: crypto.randomUUID(), name: 'Helado en familia', cost: 25 }],
  points: 0,
};

let state = loadState();

const fixedList = document.getElementById('fixed-list');
const familyList = document.getElementById('family-list');
const bigList = document.getElementById('big-list');
const rewardList = document.getElementById('reward-list');
const totalPointsEl = document.getElementById('total-points');
const lockStatusEl = document.getElementById('lock-status');

const taskTemplate = document.getElementById('task-item-template');
const rewardTemplate = document.getElementById('reward-item-template');

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : structuredClone(defaultState);
  } catch {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function fixedComplete() {
  return state.fixed.length > 0 && state.fixed.every((task) => task.done);
}

function lockRewardStatus() {
  const unlocked = fixedComplete();
  lockStatusEl.textContent = unlocked
    ? '🔓 Desbloqueado: puedes usar tus puntos'
    : '🔒 Bloqueado (faltan rutinas fijas)';
  lockStatusEl.classList.toggle('open', unlocked);
  lockStatusEl.classList.toggle('lock', !unlocked);
}

function createTaskItem(task, type) {
  const fragment = taskTemplate.content.cloneNode(true);
  const li = fragment.querySelector('li');
  const checkbox = fragment.querySelector('.task-check');
  const nameEl = fragment.querySelector('.task-name');
  const pointsEl = fragment.querySelector('.task-points');
  const editBtn = fragment.querySelector('.edit-btn');
  const deleteBtn = fragment.querySelector('.delete-btn');

  checkbox.checked = task.done;
  nameEl.textContent = task.name;

  pointsEl.textContent = task.points ? `+${task.points} pts` : '';

  checkbox.addEventListener('change', () => {
    const target = state[type].find((item) => item.id === task.id);
    if (!target) return;

    const wasDone = target.done;
    target.done = checkbox.checked;

    if (type !== 'fixed' && !wasDone && target.done) {
      state.points += target.points;
    }

    saveState();
    render();
  });

  editBtn.addEventListener('click', () => {
    const target = state[type].find((item) => item.id === task.id);
    if (!target) return;

    const nextName = prompt('Editar rutina:', target.name);
    if (nextName === null) return;

    const cleanName = nextName.trim();
    if (!cleanName) {
      alert('El nombre no puede estar vacío.');
      return;
    }
    target.name = cleanName;

    if (type !== 'fixed') {
      const nextPoints = prompt('Editar puntos:', String(target.points));
      if (nextPoints === null) {
        saveState();
        render();
        return;
      }

      const pointsNumber = Number(nextPoints);
      if (!Number.isFinite(pointsNumber) || pointsNumber < 1) {
        alert('Los puntos deben ser un número mayor o igual a 1.');
        return;
      }
      target.points = pointsNumber;
    }

    saveState();
    render();
  });

  deleteBtn.addEventListener('click', () => {
    state[type] = state[type].filter((item) => item.id !== task.id);
    saveState();
    render();
  });

  return li;
}

function createRewardItem(reward) {
  const fragment = rewardTemplate.content.cloneNode(true);
  const li = fragment.querySelector('li');
  const nameEl = fragment.querySelector('.reward-name');
  const costEl = fragment.querySelector('.reward-cost');
  const redeemBtn = fragment.querySelector('.redeem-btn');
  const editBtn = fragment.querySelector('.edit-btn');
  const deleteBtn = fragment.querySelector('.delete-btn');

  nameEl.textContent = reward.name;
  costEl.textContent = `${reward.cost} puntos`;

  redeemBtn.disabled = state.points < reward.cost || !fixedComplete();

  redeemBtn.addEventListener('click', () => {
    if (!fixedComplete()) {
      alert('Primero deben completar todas las rutinas fijas.');
      return;
    }

    if (state.points < reward.cost) {
      alert('No hay puntos suficientes.');
      return;
    }

    state.points -= reward.cost;
    saveState();
    render();
  });

  editBtn.addEventListener('click', () => {
    const target = state.rewards.find((item) => item.id === reward.id);
    if (!target) return;

    const nextName = prompt('Editar recompensa:', target.name);
    if (nextName === null) return;

    const cleanName = nextName.trim();
    if (!cleanName) {
      alert('El nombre no puede estar vacío.');
      return;
    }

    const nextCost = prompt('Editar costo en puntos:', String(target.cost));
    if (nextCost === null) return;
    const costNumber = Number(nextCost);
    if (!Number.isFinite(costNumber) || costNumber < 1) {
      alert('El costo debe ser un número mayor o igual a 1.');
      return;
    }

    target.name = cleanName;
    target.cost = costNumber;
    saveState();
    render();
  });

  deleteBtn.addEventListener('click', () => {
    state.rewards = state.rewards.filter((item) => item.id !== reward.id);
    saveState();
    render();
  });

  return li;
}

function renderTaskList(listEl, tasks, type) {
  listEl.innerHTML = '';
  tasks.forEach((task) => listEl.appendChild(createTaskItem(task, type)));
}

function renderRewards() {
  rewardList.innerHTML = '';
  state.rewards.forEach((reward) => rewardList.appendChild(createRewardItem(reward)));
}

function render() {
  renderTaskList(fixedList, state.fixed, 'fixed');
  renderTaskList(familyList, state.family, 'family');
  renderTaskList(bigList, state.big, 'big');
  renderRewards();

  totalPointsEl.textContent = String(state.points);
  lockRewardStatus();
}

function addTask(type, name, points = null) {
  if (!name) {
    return;
  }

  const task = {
    id: crypto.randomUUID(),
    name,
    done: false,
  };

  if (typeof points === 'number') {
    task.points = points;
  }

  state[type].push(task);
  saveState();
  render();
}

function setupForms() {
  document.getElementById('fixed-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('fixed-name');
    addTask('fixed', nameInput.value.trim());
    nameInput.value = '';
  });

  document.getElementById('family-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('family-name');
    const pointsInput = document.getElementById('family-points');
    addTask('family', nameInput.value.trim(), Number(pointsInput.value));
    nameInput.value = '';
    pointsInput.value = '5';
  });

  document.getElementById('big-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('big-name');
    const pointsInput = document.getElementById('big-points');
    addTask('big', nameInput.value.trim(), Number(pointsInput.value));
    nameInput.value = '';
    pointsInput.value = '15';
  });

  document.getElementById('reward-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('reward-name');
    const costInput = document.getElementById('reward-cost');

    const rewardName = nameInput.value.trim();
    if (!rewardName) {
      return;
    }

    state.rewards.push({
      id: crypto.randomUUID(),
      name: rewardName,
      cost: Number(costInput.value),
    });

    saveState();
    render();

    nameInput.value = '';
    costInput.value = '20';
  });
}

setupForms();
render();
