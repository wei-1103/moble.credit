const AVAILABLE_STORAGE_KEY = "course-selection-available-v1";
const SELECTED_STORAGE_KEY = "course-selection-selected-v1";
const MAX_CREDITS = 25;

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const defaultAvailableCourses = [
  { id: uid(), courseName: "財務管理", credits: 3, category: "專業必修", day: "星期一", startTime: "09:00", endTime: "12:00", room: "M201", teacher: "王老師" },
  { id: uid(), courseName: "投資學", credits: 3, category: "專業選修", day: "星期二", startTime: "10:00", endTime: "12:00", room: "B105", teacher: "林老師" },
  { id: uid(), courseName: "英文聽講", credits: 2, category: "共同選修", day: "星期四", startTime: "14:00", endTime: "16:00", room: "L401", teacher: "李老師" },
  { id: uid(), courseName: "統計學", credits: 3, category: "專業必修", day: "星期一", startTime: "13:00", endTime: "15:00", room: "A302", teacher: "陳老師" },
  { id: uid(), courseName: "經濟學", credits: 3, category: "共同必修", day: "星期三", startTime: "08:00", endTime: "10:00", room: "C203", teacher: "張老師" },
  { id: uid(), courseName: "通識藝術欣賞", credits: 2, category: "通識", day: "星期五", startTime: "10:00", endTime: "12:00", room: "G201", teacher: "周老師" }
];

let availableCourses = loadData(AVAILABLE_STORAGE_KEY, defaultAvailableCourses);
let selectedCourses = loadData(SELECTED_STORAGE_KEY, []);

const selectedCreditsEl = document.getElementById("selectedCredits");
const maxCreditsEl = document.getElementById("maxCredits");
const creditProgressBarEl = document.getElementById("creditProgressBar");
const selectedCountEl = document.getElementById("selectedCount");
const remainingCreditsEl = document.getElementById("remainingCredits");
const conflictStatusEl = document.getElementById("conflictStatus");
const creditStatusEl = document.getElementById("creditStatus");

const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const dayFilter = document.getElementById("dayFilter");

const availableTableBody = document.getElementById("availableTableBody");
const availableEmpty = document.getElementById("availableEmpty");
const selectedList = document.getElementById("selectedList");
const selectedEmpty = document.getElementById("selectedEmpty");
const alertList = document.getElementById("alertList");

const addCourseForm = document.getElementById("addCourseForm");
const courseNameInput = document.getElementById("courseNameInput");
const creditsInput = document.getElementById("creditsInput");
const categoryInput = document.getElementById("categoryInput");
const dayInput = document.getElementById("dayInput");
const startTimeInput = document.getElementById("startTimeInput");
const endTimeInput = document.getElementById("endTimeInput");
const roomInput = document.getElementById("roomInput");
const teacherInput = document.getElementById("teacherInput");
const resetAvailableBtn = document.getElementById("resetAvailableBtn");

const batchImportInput = document.getElementById("batchImportInput");
const importBtn = document.getElementById("importBtn");
const fillExampleBtn = document.getElementById("fillExampleBtn");
const clearImportBtn = document.getElementById("clearImportBtn");

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function saveData() {
  localStorage.setItem(AVAILABLE_STORAGE_KEY, JSON.stringify(availableCourses));
  localStorage.setItem(SELECTED_STORAGE_KEY, JSON.stringify(selectedCourses));
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

function getSelectedCredits() {
  return selectedCourses.reduce((sum, course) => sum + Number(course.credits), 0);
}

function calcPercent(value, total) {
  if (total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function isTimeConflict(courseA, courseB) {
  if (courseA.day !== courseB.day) return false;
  return courseA.startTime < courseB.endTime && courseB.startTime < courseA.endTime;
}

function getConflictPairs() {
  const pairs = [];

  for (let i = 0; i < selectedCourses.length; i++) {
    for (let j = i + 1; j < selectedCourses.length; j++) {
      if (isTimeConflict(selectedCourses[i], selectedCourses[j])) {
        pairs.push([selectedCourses[i], selectedCourses[j]]);
      }
    }
  }

  return pairs;
}

function renderOverview() {
  const selectedCredits = getSelectedCredits();
  const remaining = Math.max(MAX_CREDITS - selectedCredits, 0);
  const percent = calcPercent(selectedCredits, MAX_CREDITS);
  const conflicts = getConflictPairs();

  selectedCreditsEl.textContent = selectedCredits;
  maxCreditsEl.textContent = MAX_CREDITS;
  creditProgressBarEl.style.width = `${percent}%`;
  selectedCountEl.textContent = selectedCourses.length;
  remainingCreditsEl.textContent = remaining;

  conflictStatusEl.textContent = conflicts.length > 0 ? "有衝堂" : "無衝堂";
  creditStatusEl.textContent = selectedCredits > MAX_CREDITS ? "超過上限" : "正常";
}

function getFilteredAvailableCourses() {
  const keyword = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const day = dayFilter.value;

  return availableCourses.filter(course => {
    const matchKeyword = course.courseName.toLowerCase().includes(keyword);
    const matchCategory = category === "全部" || course.category === category;
    const matchDay = day === "全部" || course.day === day;
    return matchKeyword && matchCategory && matchDay;
  });
}

function renderAvailableCourses() {
  const filtered = getFilteredAvailableCourses();

  availableTableBody.innerHTML = filtered.map(course => {
    const alreadySelected = selectedCourses.some(item => item.id === course.id);

    return `
      <tr>
        <td>${escapeHtml(course.courseName)}</td>
        <td>${course.credits}</td>
        <td>${course.category}</td>
        <td>${course.day}</td>
        <td>${course.startTime} - ${course.endTime}</td>
        <td>${escapeHtml(course.room)}</td>
        <td>${escapeHtml(course.teacher)}</td>
        <td>
          <button
            class="action-btn action-btn--add"
            data-id="${course.id}"
            ${alreadySelected ? "disabled" : ""}
          >
            ${alreadySelected ? "已加入" : "加入"}
          </button>
        </td>
      </tr>
    `;
  }).join("");

  availableEmpty.style.display = filtered.length === 0 ? "block" : "none";

  document.querySelectorAll(".action-btn--add").forEach(btn => {
    if (!btn.disabled) {
      btn.addEventListener("click", () => addCourseToSelection(btn.dataset.id));
    }
  });
}

function renderSelectedCourses() {
  const sorted = [...selectedCourses].sort((a, b) => {
    const dayOrder = ["星期一", "星期二", "星期三", "星期四", "星期五"];
    const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
    if (dayDiff !== 0) return dayDiff;
    return a.startTime.localeCompare(b.startTime);
  });

  selectedList.innerHTML = sorted.map(course => `
    <article class="selected-card">
      <div class="selected-card__top">
        <h3 class="selected-card__name">${escapeHtml(course.courseName)}</h3>
        <span class="selected-card__credits">${course.credits} 學分</span>
      </div>
      <div class="selected-card__meta">
        ${course.day}｜${course.startTime} - ${course.endTime}<br>
        ${escapeHtml(course.room)}｜${escapeHtml(course.teacher)}<br>
        ${course.category}
      </div>
      <button class="action-btn action-btn--remove" data-id="${course.id}">移除課程</button>
    </article>
  `).join("");

  selectedEmpty.style.display = sorted.length === 0 ? "block" : "none";

  document.querySelectorAll(".action-btn--remove").forEach(btn => {
    btn.addEventListener("click", () => removeCourseFromSelection(btn.dataset.id));
  });
}

function renderAlerts() {
  const alerts = [];
  const selectedCredits = getSelectedCredits();
  const conflicts = getConflictPairs();

  if (selectedCredits > MAX_CREDITS) {
    alerts.push(`目前已選 ${selectedCredits} 學分，已超過上限 ${MAX_CREDITS} 學分。`);
  } else {
    alerts.push(`目前已選 ${selectedCredits} 學分，尚未超過上限。`);
  }

  if (conflicts.length > 0) {
    conflicts.forEach(([a, b]) => {
      alerts.push(`課程「${a.courseName}」與「${b.courseName}」發生衝堂。`);
    });
  } else {
    alerts.push("目前未檢測到衝堂。");
  }

  if (selectedCourses.length === 0) {
    alerts.push("目前尚未加入任何課程。");
  }

  alertList.innerHTML = alerts.map(item => `<li>${escapeHtml(item)}</li>`).join("");
}

function addCourseToSelection(id) {
  const course = availableCourses.find(item => item.id === id);
  if (!course) return;

  const alreadySelected = selectedCourses.some(item => item.id === id);
  if (alreadySelected) return;

  selectedCourses.push(course);
  saveData();
  refreshAll();
}

function removeCourseFromSelection(id) {
  selectedCourses = selectedCourses.filter(item => item.id !== id);
  saveData();
  refreshAll();
}

function addAvailableCourse(event) {
  event.preventDefault();

  const newCourse = {
    id: uid(),
    courseName: courseNameInput.value.trim(),
    credits: Number(creditsInput.value),
    category: categoryInput.value,
    day: dayInput.value,
    startTime: startTimeInput.value,
    endTime: endTimeInput.value,
    room: roomInput.value.trim(),
    teacher: teacherInput.value.trim()
  };

  if (
    !newCourse.courseName ||
    !newCourse.credits ||
    !newCourse.category ||
    !newCourse.day ||
    !newCourse.startTime ||
    !newCourse.endTime ||
    !newCourse.room ||
    !newCourse.teacher
  ) {
    alert("請完整填寫開課資料。");
    return;
  }

  if (newCourse.startTime >= newCourse.endTime) {
    alert("結束時間必須晚於開始時間。");
    return;
  }

  availableCourses.unshift(newCourse);
  saveData();
  addCourseForm.reset();
  refreshAll();
}

function resetAvailableCourses() {
  availableCourses = structuredClone(defaultAvailableCourses);
  selectedCourses = [];
  saveData();
  refreshAll();
}

function isValidCategory(category) {
  return ["共同必修", "專業必修", "專業選修", "共同選修", "通識"].includes(category);
}

function isValidDay(day) {
  return ["星期一", "星期二", "星期三", "星期四", "星期五"].includes(day);
}

function isValidTimeFormat(time) {
  return /^\d{2}:\d{2}$/.test(time);
}

function parseBatchImport(text) {
  const lines = text
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "");

  const parsedCourses = [];
  const errors = [];

  lines.forEach((line, index) => {
    const parts = line.split(",").map(part => part.trim());

    if (parts.length !== 8) {
      errors.push(`第 ${index + 1} 行格式錯誤，應為：課名,學分,分類,星期,開始時間,結束時間,教室,老師`);
      return;
    }

    const [courseName, creditsText, category, day, startTime, endTime, room, teacher] = parts;
    const credits = Number(creditsText);

    if (!courseName) {
      errors.push(`第 ${index + 1} 行課名不可空白`);
      return;
    }

    if (!Number.isFinite(credits) || credits <= 0) {
      errors.push(`第 ${index + 1} 行學分格式錯誤`);
      return;
    }

    if (!isValidCategory(category)) {
      errors.push(`第 ${index + 1} 行分類錯誤：${category}`);
      return;
    }

    if (!isValidDay(day)) {
      errors.push(`第 ${index + 1} 行星期錯誤：${day}`);
      return;
    }

    if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
      errors.push(`第 ${index + 1} 行時間格式錯誤，請使用 HH:MM`);
      return;
    }

    if (startTime >= endTime) {
      errors.push(`第 ${index + 1} 行開始時間不可晚於或等於結束時間`);
      return;
    }

    if (!room || !teacher) {
      errors.push(`第 ${index + 1} 行教室或老師不可空白`);
      return;
    }

    parsedCourses.push({
      id: uid(),
      courseName,
      credits,
      category,
      day,
      startTime,
      endTime,
      room,
      teacher
    });
  });

  return { parsedCourses, errors };
}

function importBatchCourses() {
  const rawText = batchImportInput.value.trim();

  if (!rawText) {
    alert("請先貼上開課資料。");
    return;
  }

  const { parsedCourses, errors } = parseBatchImport(rawText);

  if (errors.length > 0) {
    alert("匯入失敗：\n" + errors.join("\n"));
    return;
  }

  if (parsedCourses.length === 0) {
    alert("沒有可匯入的資料。");
    return;
  }

  availableCourses = [...parsedCourses, ...availableCourses];
  saveData();
  batchImportInput.value = "";
  refreshAll();
  alert(`成功匯入 ${parsedCourses.length} 筆開課資料。`);
}

function fillImportExample() {
  batchImportInput.value = `財務管理,3,專業必修,星期一,09:00,12:00,M201,王老師
投資學,3,專業選修,星期二,10:00,12:00,B105,林老師
英文聽講,2,共同選修,星期四,14:00,16:00,L401,李老師`;
}

function clearImportText() {
  batchImportInput.value = "";
}

function refreshAll() {
  renderOverview();
  renderAvailableCourses();
  renderSelectedCourses();
  renderAlerts();
}

searchInput.addEventListener("input", renderAvailableCourses);
categoryFilter.addEventListener("change", renderAvailableCourses);
dayFilter.addEventListener("change", renderAvailableCourses);

addCourseForm.addEventListener("submit", addAvailableCourse);
resetAvailableBtn.addEventListener("click", resetAvailableCourses);

importBtn.addEventListener("click", importBatchCourses);
fillExampleBtn.addEventListener("click", fillImportExample);
clearImportBtn.addEventListener("click", clearImportText);

refreshAll();