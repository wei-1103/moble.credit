const STORAGE_KEY = "schedule-data-v1";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const defaultClasses = [
  { id: uid(), day: "星期一", courseName: "財務管理", startTime: "09:00", endTime: "12:00", room: "M201", teacher: "王老師" },
  { id: uid(), day: "星期一", courseName: "統計學", startTime: "13:00", endTime: "15:00", room: "A302", teacher: "陳老師" },
  { id: uid(), day: "星期二", courseName: "投資學", startTime: "10:00", endTime: "12:00", room: "B105", teacher: "林老師" },
  { id: uid(), day: "星期三", courseName: "經濟學", startTime: "08:00", endTime: "10:00", room: "C203", teacher: "張老師" },
  { id: uid(), day: "星期四", courseName: "英文聽講", startTime: "14:00", endTime: "16:00", room: "L401", teacher: "李老師" },
  { id: uid(), day: "星期五", courseName: "專題討論", startTime: "09:00", endTime: "11:00", room: "P501", teacher: "黃老師" }
];

let classData = loadData();

const todayCountEl = document.getElementById("todayCount");
const todayLabelEl = document.getElementById("todayLabel");
const weekCountEl = document.getElementById("weekCount");
const busiestDayEl = document.getElementById("busiestDay");

const todayListEl = document.getElementById("todayList");
const todayEmptyEl = document.getElementById("todayEmpty");
const scheduleTableBodyEl = document.getElementById("scheduleTableBody");
const tableEmptyEl = document.getElementById("tableEmpty");

const classForm = document.getElementById("classForm");
const courseNameEl = document.getElementById("courseName");
const dayEl = document.getElementById("day");
const startTimeEl = document.getElementById("startTime");
const endTimeEl = document.getElementById("endTime");
const roomEl = document.getElementById("room");
const teacherEl = document.getElementById("teacher");
const dayFilterEl = document.getElementById("dayFilter");
const resetBtn = document.getElementById("resetBtn");

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...defaultClasses];
  } catch {
    return [...defaultClasses];
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(classData));
}

function getTodayLabel() {
  const map = {
    1: "星期一",
    2: "星期二",
    3: "星期三",
    4: "星期四",
    5: "星期五",
    6: "星期六",
    0: "星期日"
  };
  return map[new Date().getDay()];
}

function getTodayClasses() {
  const today = getTodayLabel();
  return classData
    .filter(item => item.day === today)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function getFilteredClasses() {
  const filter = dayFilterEl.value;
  const result = filter === "全部"
    ? [...classData]
    : classData.filter(item => item.day === filter);

  return result.sort((a, b) => {
    const dayOrder = ["星期一", "星期二", "星期三", "星期四", "星期五"];
    const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });
}

function getBusiestDay() {
  const days = ["星期一", "星期二", "星期三", "星期四", "星期五"];
  let maxDay = "-";
  let maxCount = 0;

  days.forEach(day => {
    const count = classData.filter(item => item.day === day).length;
    if (count > maxCount) {
      maxCount = count;
      maxDay = day;
    }
  });

  return maxDay;
}

function renderOverview() {
  const todayClasses = getTodayClasses();

  todayCountEl.textContent = todayClasses.length;
  todayLabelEl.textContent = getTodayLabel();
  weekCountEl.textContent = classData.length;
  busiestDayEl.textContent = getBusiestDay();
}

function renderTodayList() {
  const todayClasses = getTodayClasses();

  todayListEl.innerHTML = todayClasses.map(item => `
    <article class="today-card">
      <div class="today-card__top">
        <h3 class="today-card__name">${escapeHtml(item.courseName)}</h3>
        <span class="today-card__time">${item.startTime} - ${item.endTime}</span>
      </div>
      <div class="today-card__meta">
        教室：${escapeHtml(item.room)}<br>
        老師：${escapeHtml(item.teacher)}
      </div>
    </article>
  `).join("");

  todayEmptyEl.style.display = todayClasses.length === 0 ? "block" : "none";
}

function renderTable() {
  const list = getFilteredClasses();

  scheduleTableBodyEl.innerHTML = list.map(item => `
    <tr>
      <td>${item.day}</td>
      <td>${escapeHtml(item.courseName)}</td>
      <td>${item.startTime} - ${item.endTime}</td>
      <td>${escapeHtml(item.room)}</td>
      <td>${escapeHtml(item.teacher)}</td>
      <td><button class="delete-btn" data-id="${item.id}">刪除</button></td>
    </tr>
  `).join("");

  tableEmptyEl.style.display = list.length === 0 ? "block" : "none";

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteClass(btn.dataset.id);
    });
  });
}

function addClass(event) {
  event.preventDefault();

  const item = {
    id: uid(),
    courseName: courseNameEl.value.trim(),
    day: dayEl.value,
    startTime: startTimeEl.value,
    endTime: endTimeEl.value,
    room: roomEl.value.trim(),
    teacher: teacherEl.value.trim()
  };

  if (!item.courseName || !item.day || !item.startTime || !item.endTime || !item.room || !item.teacher) {
    alert("請完整填寫課程資料。");
    return;
  }

  if (item.startTime >= item.endTime) {
    alert("結束時間必須晚於開始時間。");
    return;
  }

  classData.push(item);
  saveData();
  classForm.reset();
  refreshAll();
}

function deleteClass(id) {
  classData = classData.filter(item => item.id !== id);
  saveData();
  refreshAll();
}

function resetData() {
  classData = [...defaultClasses];
  saveData();
  refreshAll();
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

function refreshAll() {
  renderOverview();
  renderTodayList();
  renderTable();
}

classForm.addEventListener("submit", addClass);
dayFilterEl.addEventListener("change", renderTable);
resetBtn.addEventListener("click", resetData);

refreshAll();