const form = document.getElementById('taskForm');
const titleInput = document.getElementById('title');
const titleError = document.getElementById('titleError');
const categoryInput = document.getElementById('category');
const dueDateInput = document.getElementById('dueDate');
const priorityInput = document.getElementById('priority');
const taskList = document.getElementById('taskList');
const statsLine = document.getElementById('statsLine');
const statusButtons = document.querySelectorAll('.status-btn');
const categoryFilter = document.getElementById('categoryFilter');

const STORAGE_KEY = 'tasks';

// ---- State ----
let currentStatusFilter = 'All';   // 'All' | 'Active' | 'Completed'
let currentCategoryFilter = 'All'; // 'All' | 'Personal' | 'Work' | 'School'
let editingId = null;              // id of the task currently being edited, or null

// ---- Load ----
function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Could not load tasks, starting empty:', error);
    return [];
  }
}

let tasks = loadTasks();

// ---- Save ----
function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// ---- Validation ----
function validateTitle(value) {
  if (value.trim() === '') {
    return 'Title is required.';
  }
  return null;
}

// ---- Derive the list to actually display, based on current filters ----
function getFilteredTasks() {
  return tasks.filter((task) => {
    const matchesStatus =
      currentStatusFilter === 'All' ||
      (currentStatusFilter === 'Active' && !task.completed) ||
      (currentStatusFilter === 'Completed' && task.completed);

    const matchesCategory =
      currentCategoryFilter === 'All' || task.category === currentCategoryFilter;

    return matchesStatus && matchesCategory;
  });
}

// ---- Stats (always based on the FULL list, not the filtered one) ----
function renderStats() {
  const completedCount = tasks.filter((t) => t.completed).length;
  statsLine.textContent = `${completedCount} of ${tasks.length} tasks completed`;
}

// ---- Render ----
function renderTasks() {
  taskList.innerHTML = '';
  renderStats();

  const visibleTasks = getFilteredTasks();

  if (visibleTasks.length === 0) {
    const emptyMsg = document.createElement('li');
    emptyMsg.id = 'emptyMessage';
    emptyMsg.textContent = tasks.length === 0
      ? 'No tasks yet — add one above.'
      : 'No tasks match the current filters.';
    taskList.appendChild(emptyMsg);
    return;
  }

  visibleTasks.forEach((task) => {
    const li = document.createElement('li');
    li.dataset.id = task.id;

    const infoDiv = document.createElement('div');
    infoDiv.classList.add('task-info');

    if (editingId === task.id) {
      // --- Editing mode: show an input instead of plain text ---
      const editInput = document.createElement('input');
      editInput.type = 'text';
      editInput.classList.add('edit-input');
      editInput.value = task.title;
      editInput.dataset.role = 'edit-input';
      infoDiv.appendChild(editInput);
    } else {
      // --- Normal mode: show plain text ---
      const titleEl = document.createElement('span');
      titleEl.classList.add('task-title');
      if (task.completed) {
        titleEl.classList.add('completed');
      }
      titleEl.textContent = task.title;

      const metaEl = document.createElement('span');
      metaEl.classList.add('task-meta');
      metaEl.textContent = `${task.category} • Due: ${task.dueDate || 'No date'} • Priority: ${task.priority}`;

      infoDiv.appendChild(titleEl);
      infoDiv.appendChild(metaEl);
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.classList.add('task-actions');

    if (editingId === task.id) {
      const saveBtn = document.createElement('button');
      saveBtn.textContent = 'Save';
      saveBtn.classList.add('save-btn');
      saveBtn.dataset.action = 'save';
      actionsDiv.appendChild(saveBtn);
    } else {
      const toggleBtn = document.createElement('button');
      toggleBtn.textContent = task.completed ? 'Undo' : 'Complete';
      toggleBtn.classList.add('toggle-btn');
      toggleBtn.dataset.action = 'toggle';

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.classList.add('edit-btn');
      editBtn.dataset.action = 'edit';

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.classList.add('delete-btn');
      deleteBtn.dataset.action = 'delete';

      actionsDiv.appendChild(toggleBtn);
      actionsDiv.appendChild(editBtn);
      actionsDiv.appendChild(deleteBtn);
    }

    li.appendChild(infoDiv);
    li.appendChild(actionsDiv);
    taskList.appendChild(li);
  });
}

// ---- Add a task ----
form.addEventListener('submit', function (e) {
  e.preventDefault();

  const titleValue = titleInput.value;
  const error = validateTitle(titleValue);

  if (error) {
    titleInput.classList.add('invalid');
    titleError.textContent = error;
    return;
  }

  titleInput.classList.remove('invalid');
  titleError.textContent = '';

  const newTask = {
    id: Date.now(),
    title: titleValue.trim(),
    category: categoryInput.value,
    dueDate: dueDateInput.value,
    priority: priorityInput.value,
    completed: false
  };

  tasks.push(newTask);
  saveTasks();
  renderTasks();

  form.reset();
  priorityInput.value = 'Medium';
});

// ---- Delete + Toggle + Edit + Save (event delegation) ----
taskList.addEventListener('click', function (e) {
  const button = e.target.closest('button');
  if (!button) return;

  const li = button.closest('li');
  if (!li || !li.dataset.id) return;

  const taskId = Number(li.dataset.id);
  const action = button.dataset.action;

  if (action === 'delete') {
    tasks = tasks.filter((t) => t.id !== taskId);
    if (editingId === taskId) editingId = null;
  }

  if (action === 'toggle') {
    const task = tasks.find((t) => t.id === taskId);
    if (task) task.completed = !task.completed;
  }

  if (action === 'edit') {
    editingId = taskId; // enter edit mode for this task
  }

  if (action === 'save') {
    const input = li.querySelector('[data-role="edit-input"]');
    const newTitle = input.value;
    const error = validateTitle(newTitle);

    if (error) {
      // simple inline feedback for the edit case
      input.classList.add('invalid');
      return;
    }

    const task = tasks.find((t) => t.id === taskId);
    if (task) task.title = newTitle.trim();
    editingId = null; // exit edit mode
  }

  saveTasks();
  renderTasks();
});

// ---- Status filter buttons ----
statusButtons.forEach((btn) => {
  btn.addEventListener('click', function () {
    currentStatusFilter = btn.dataset.status;

    statusButtons.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    renderTasks();
  });
});

// ---- Category filter dropdown ----
categoryFilter.addEventListener('change', function () {
  currentCategoryFilter = categoryFilter.value;
  renderTasks();
});

// ---- Initial render on page load ----
renderTasks();