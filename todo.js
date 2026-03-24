const STORAGE_KEY = "todo-system-data-v1";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const defaultTodos = [
  {
    id: uid(),
    title: "準備統計期中考",
    category: "考試",
    priority: "高",
    dueDate: "2026-04-10",
    note: "範圍第1~5章",
    status: "未完成"
  },
  {
    id: uid(),
    title: "繳交英文報告",
    category: "報告",
    priority: "中",
    dueDate: "2026-04-15",
    note: "上傳到教學平台",
    status: "未完成"
  },
  {
    id: uid(),
    title: "確認英文門檻替代方案",
    category: "畢業門檻",
    priority: "高",
    dueDate: "2026-05-01",
    note: "查系上公告",
    status: "未完成"
  },
  {
    id: uid(),
    title: "完成選課確認",
    category: "選課",
    priority: "中",
    dueDate: "",
    note: "檢查是否衝堂",
    status: "已完成"
  }
];

let todos = loadData();

const totalTodoCountEl = document.getElementById("totalTodoCount");
const doneTodoCountEl = document.getElementById("doneTodoCount");
const pendingTodoCountEl = document.getElementById("pendingTodoCount");
const todayDueCountEl = document.getElementById("todayDueCount");
const highPriorityCountEl = document.getElementById("highPriorityCount");

const todoForm = document.getElementById("todoForm");
const titleInput = document.getElementById("titleInput");
const categoryInput = document.getElementById("categoryInput");
const priorityInput = document.getElementById("priorityInput");
const dueDateInput = document.getElementById("dueDateInput");
const noteInput = document.getElementById("noteInput");

const batchImportInput = document.getElementById("batchImportInput");
const importBtn = document.getElementById("importBtn");
const fillExampleBtn = document.getElementById("fillExampleBtn");
const clearImportBtn = document.getElementById("clearImportBtn");
const resetDemoBtn = document.getElementById("resetDemoBtn");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const priorityFilter = document.getElementById("priorityFilter");

const todoList = document.getElementById("todoList");
const emptyText = document.getElementById("emptyText");

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...defaultTodos];
  } catch {
    return [...defaultTodos];
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[s]));
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getFilteredTodos() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const status = statusFilter.value;
  const priority = priorityFilter.value;

  return todos.filter(item => {
    const matchKeyword =
      item.title.toLowerCase().includes(keyword) ||
      item.note.toLowerCase().includes(keyword);

    const matchCategory = category === "全部" || item.category === category;
    const matchStatus = status === "全部" || item.status === status;
    const matchPriority = priority === "全部" || item.priority === priority;

    return matchKeyword && matchCategory && matchStatus && matchPriority;
  });
}

function renderOverview() {
  const total = todos.length;
  const done = todos.filter(item => item.status === "已完成").length;
  const pending = todos.filter(item => item.status === "未完成").length;
  const today = getTodayDateString();
  const todayDue = todos.filter(item => item.dueDate === today && item.status === "未完成").length;
  const highPriority = todos.filter(item => item.priority === "高" && item.status === "未完成").length;

  totalTodoCountEl.textContent = total;
  doneTodoCountEl.textContent = done;
  pendingTodoCountEl.textContent = pending;
  todayDueCountEl.textContent = todayDue;
  highPriorityCountEl.textContent = highPriority;
}

function getStatusBadge(status) {
  if (status === "已完成") {
    return `<span class="badge badge-status-done">已完成</span>`;
  }
  return `<span class="badge badge-status-pending">未完成</span>`;
}

function getPriorityBadge(priority) {
  if (priority === "高") {
    return `<span class="badge badge-priority-high">高優先</span>`;
  }
  if (priority === "中") {
    return `<span class="badge badge-priority-medium">中優先</span>`;
  }
  return `<span class="badge badge-priority-low">低優先</span>`;
}

function renderTodoList() {
  const filtered = getFilteredTodos();

  const sorted = [...filtered].sort((a, b) => {
    const statusScore = (a.status === "未完成" ? 0 : 1) - (b.status === "未完成" ? 0 : 1);
    if (statusScore !== 0) return statusScore;

    const priorityOrder = { "高": 0, "中": 1, "低": 2 };
    const priorityScore = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityScore !== 0) return priorityScore;

    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.localeCompare(b.dueDate);
  });

  todoList.innerHTML = sorted.map(item => `
    <article class="todo-card ${item.status === "已完成" ? "done" : ""}">
      <div class="todo-card__top">
        <h3 class="todo-card__title">${escapeHtml(item.title)}</h3>
        ${getStatusBadge(item.status)}
      </div>

      <div class="todo-card__meta">
        分類：${escapeHtml(item.category)}<br>
        優先順序：${getPriorityBadge(item.priority)}<br>
        截止日期：${item.dueDate || "未設定"}<br>
        備註：${escapeHtml(item.note || "無")}
      </div>

      <div class="todo-card__actions">
        <button class="action-btn" data-action="toggle" data-id="${item.id}">
          ${item.status === "已完成" ? "改成未完成" : "標記完成"}
        </button>
        <button class="delete-btn" data-action="delete" data-id="${item.id}">
          刪除
        </button>
      </div>
    </article>
  `).join("");

  emptyText.style.display = sorted.length === 0 ? "block" : "none";

  document.querySelectorAll('[data-action="toggle"]').forEach(btn => {
    btn.addEventListener("click", () => toggleTodoStatus(btn.dataset.id));
  });

  document.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener("click", () => deleteTodo(btn.dataset.id));
  });
}

function addTodo(event) {
  event.preventDefault();

  const newTodo = {
    id: uid(),
    title: titleInput.value.trim(),
    category: categoryInput.value,
    priority: priorityInput.value,
    dueDate: dueDateInput.value,
    note: noteInput.value.trim(),
    status: "未完成"
  };

  if (!newTodo.title || !newTodo.category || !newTodo.priority) {
    alert("請完整填寫待辦資料。");
    return;
  }

  todos.unshift(newTodo);
  saveData();
  todoForm.reset();
  refreshAll();
}

function toggleTodoStatus(id) {
  todos = todos.map(item => {
    if (item.id === id) {
      return {
        ...item,
        status: item.status === "已完成" ? "未完成" : "已完成"
      };
    }
    return item;
  });

  saveData();
  refreshAll();
}

function deleteTodo(id) {
  todos = todos.filter(item => item.id !== id);
  saveData();
  refreshAll();
}

function parseBatchImport(text) {
  const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
  const parsed = [];
  const errors = [];

  lines.forEach((line, index) => {
    const parts = line.split(",").map(part => part.trim());

    if (parts.length !== 5) {
      errors.push(`第 ${index + 1} 行格式錯誤，應為：事項名稱,分類,優先順序,截止日期,備註`);
      return;
    }

    const [title, category, priority, dueDate, note] = parts;

    if (!title) {
      errors.push(`第 ${index + 1} 行事項名稱不可空白`);
      return;
    }

    if (!["課業", "考試", "報告", "畢業門檻", "選課", "其他"].includes(category)) {
      errors.push(`第 ${index + 1} 行分類錯誤：${category}`);
      return;
    }

    if (!["高", "中", "低"].includes(priority)) {
      errors.push(`第 ${index + 1} 行優先順序錯誤：${priority}`);
      return;
    }

    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      errors.push(`第 ${index + 1} 行截止日期格式錯誤，請使用 YYYY-MM-DD`);
      return;
    }

    parsed.push({
      id: uid(),
      title,
      category,
      priority,
      dueDate,
      note,
      status: "未完成"
    });
  });

  return { parsed, errors };
}

function importBatchTodos() {
  const text = batchImportInput.value.trim();

  if (!text) {
    alert("請先貼上待辦資料。");
    return;
  }

  const { parsed, errors } = parseBatchImport(text);

  if (errors.length > 0) {
    alert("匯入失敗：\n" + errors.join("\n"));
    return;
  }

  todos = [...parsed, ...todos];
  saveData();
  batchImportInput.value = "";
  refreshAll();
  alert(`成功匯入 ${parsed.length} 筆待辦事項。`);
}

function fillImportExample() {
  batchImportInput.value = `準備統計期中考,考試,高,2026-04-10,範圍第1~5章
繳交英文報告,報告,中,2026-04-15,上傳到教學平台
確認英文門檻,畢業門檻,高,2026-05-01,查詢替代方案`;
}

function clearImportText() {
  batchImportInput.value = "";
}

function resetDemoData() {
  todos = [...defaultTodos];
  saveData();
  refreshAll();
}

function refreshAll() {
  renderOverview();
  renderTodoList();
}

todoForm.addEventListener("submit", addTodo);

searchInput.addEventListener("input", renderTodoList);
categoryFilter.addEventListener("change", renderTodoList);
statusFilter.addEventListener("change", renderTodoList);
priorityFilter.addEventListener("change", renderTodoList);

importBtn.addEventListener("click", importBatchTodos);
fillExampleBtn.addEventListener("click", fillImportExample);
clearImportBtn.addEventListener("click", clearImportText);
resetDemoBtn.addEventListener("click", resetDemoData);

refreshAll();