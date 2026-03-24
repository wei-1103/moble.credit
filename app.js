const CREDIT_STORAGE_KEY = "credit-system-data-v1";

const REQUIREMENT_STORAGE_KEY = "graduation-requirements-v1";
const SCHEDULE_STORAGE_KEY = "schedule-data-v1";
const SELECTED_COURSE_STORAGE_KEY = "course-selection-selected-v1";
const TODO_STORAGE_KEY = "todo-system-data-v1";

const categoryTargets = {
  "共同必修": 30,
  "專業必修": 45,
  "專業選修": 24,
  "共同選修": 12,
  "通識": 17
};

const defaultRequirementData = {
  english: {
    done: false,
    method: "未設定",
    note: "尚未完成英文能力門檻"
  },
  cpe: {
    done: false,
    note: "目前累積 2 題"
  },
  hours: {
    done: false,
    note: "尚差 10 小時"
  },
  license: {
    done: true,
    name: "TQC Excel",
    date: "2025-12-20"
  }
};

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

function calcPercent(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
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

function escapeHtml(str = "") {
  return str.replace(/[&<>"']/g, s => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[s]));
}

function getCreditData() {
  return loadData(CREDIT_STORAGE_KEY, []);
}

function getRequirementData() {
  return loadData(REQUIREMENT_STORAGE_KEY, defaultRequirementData);
}

function getScheduleData() {
  return loadData(SCHEDULE_STORAGE_KEY, []);
}

function getSelectedCourses() {
  return loadData(SELECTED_COURSE_STORAGE_KEY, []);
}

function getTodoData() {
  return loadData(TODO_STORAGE_KEY, []);
}

function renderOverview() {
  const courses = getCreditData();
  const passedCourses = courses.filter(course => course.status === "已通過");
  const earnedCredits = passedCourses.reduce((sum, course) => sum + Number(course.credits), 0);
  const totalCredits = Object.values(categoryTargets).reduce((sum, num) => sum + num, 0);
  const remainingCredits = Math.max(totalCredits - earnedCredits, 0);
  const percent = calcPercent(earnedCredits, totalCredits);

  document.getElementById("earnedCredits").textContent = earnedCredits;
  document.getElementById("totalCredits").textContent = totalCredits;
  document.getElementById("remainingCredits").textContent = remainingCredits;
  document.getElementById("overallPercent").textContent = `${percent}%`;
  document.getElementById("overallPercentText").textContent = `${percent}%`;
  document.getElementById("overallProgressBar").style.width = `${percent}%`;
}

function getCategoryFillClass(category) {
  const map = {
    "共同必修": "fill-green",
    "專業必修": "fill-orange",
    "專業選修": "fill-blue",
    "共同選修": "fill-cyan",
    "通識": "fill-blue"
  };
  return map[category] || "fill-blue";
}

function getCategoryBadgeClass(category) {
  const map = {
    "共同必修": "badge-green",
    "專業必修": "badge-orange",
    "專業選修": "badge-blue",
    "共同選修": "badge-cyan",
    "通識": "badge-blue"
  };
  return map[category] || "badge-blue";
}

function renderCredits() {
  const creditList = document.getElementById("creditList");
  const courses = getCreditData();
  const passedCourses = courses.filter(course => course.status === "已通過");

  creditList.innerHTML = Object.entries(categoryTargets).map(([category, total]) => {
    const earned = passedCourses
      .filter(course => course.category === category)
      .reduce((sum, course) => sum + Number(course.credits), 0);

    const percent = calcPercent(earned, total);
    const remaining = Math.max(total - earned, 0);

    return `
      <article class="credit-item">
        <div class="credit-item__top">
          <div>
            <h3 class="credit-item__name">${category}</h3>
            <p class="credit-item__note">尚缺 ${remaining} 學分</p>
          </div>

          <div class="credit-item__value">
            <strong>${earned} / ${total}</strong>
            <span>學分</span>
          </div>
        </div>

        <div class="progress">
          <div class="progress__fill ${getCategoryFillClass(category)}" style="width:${percent}%"></div>
        </div>

        <div class="credit-item__bottom">
          <span>完成進度</span>
          <span class="badge ${getCategoryBadgeClass(category)}">${percent}%</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderRequirements() {
  const requirementGrid = document.getElementById("requirementGrid");
  const req = getRequirementData();

  const items = [
    {
      title: "英文能力門檻",
      desc: `${req.english.method}｜${req.english.note || "尚未填寫"}`,
      done: req.english.done,
      state: req.english.done ? "完成" : "未完成"
    },
    {
      title: "CPE 門檻",
      desc: req.cpe.note || "尚未填寫",
      done: req.cpe.done,
      state: req.cpe.done ? "完成" : "未達標"
    },
    {
      title: "服務時數",
      desc: req.hours.note || "尚未填寫",
      done: req.hours.done,
      state: req.hours.done ? "完成" : "待完成"
    },
    {
      title: "證照條件",
      desc: `${req.license.name || "尚未填寫"}${req.license.date ? "｜" + req.license.date : ""}`,
      done: req.license.done,
      state: req.license.done ? "完成" : "未完成"
    }
  ];

  requirementGrid.innerHTML = items.map(item => `
    <article class="requirement-card">
      <div>
        <h3 class="requirement-card__title">${item.title}</h3>
        <p class="requirement-card__desc">${item.desc}</p>
      </div>
      <span class="requirement-state ${item.done ? "done" : "pending"}">
        ${item.state}
      </span>
    </article>
  `).join("");
}

function getConflictPairs(selectedCourses) {
  const pairs = [];

  for (let i = 0; i < selectedCourses.length; i++) {
    for (let j = i + 1; j < selectedCourses.length; j++) {
      const a = selectedCourses[i];
      const b = selectedCourses[j];

      if (a.day !== b.day) continue;
      if (a.startTime < b.endTime && b.startTime < a.endTime) {
        pairs.push([a, b]);
      }
    }
  }

  return pairs;
}

function renderAlerts() {
  const alertList = document.getElementById("alertList");
  const alerts = [];

  const creditCourses = getCreditData();
  const passedCourses = creditCourses.filter(course => course.status === "已通過");
  const failedCourses = creditCourses.filter(course => course.status === "未通過");
  const ongoingCourses = creditCourses.filter(course => course.status === "正在修");

  for (const [category, target] of Object.entries(categoryTargets)) {
    const earned = passedCourses
      .filter(course => course.category === category)
      .reduce((sum, course) => sum + Number(course.credits), 0);

    const remaining = Math.max(target - earned, 0);
    if (remaining > 0) {
      alerts.push(`${category}尚缺 ${remaining} 學分。`);
    }
  }

  if (failedCourses.length > 0) {
    alerts.push(`目前有 ${failedCourses.length} 門課未通過，建議優先安排補修。`);
  }

  if (ongoingCourses.length > 0) {
    alerts.push(`目前有 ${ongoingCourses.length} 門課正在修習，尚未列入正式畢業學分。`);
  }

  const req = getRequirementData();
  if (!req.english.done) alerts.push("英文能力門檻尚未完成。");
  if (!req.cpe.done) alerts.push("CPE 門檻尚未達標。");
  if (!req.hours.done) alerts.push("服務時數尚未完成。");
  if (!req.license.done) alerts.push("證照條件尚未完成。");

  const selectedCourses = getSelectedCourses();
  const selectedCredits = selectedCourses.reduce((sum, course) => sum + Number(course.credits), 0);
  if (selectedCourses.length > 0) {
    alerts.push(`目前選課清單共有 ${selectedCourses.length} 門，合計 ${selectedCredits} 學分。`);
  }

  const conflicts = getConflictPairs(selectedCourses);
  if (conflicts.length > 0) {
    alerts.push(`目前選課清單有 ${conflicts.length} 組衝堂。`);
  }

  const todaySchedule = getScheduleData().filter(item => item.day === getTodayLabel());
  if (todaySchedule.length > 0) {
    alerts.push(`今天有 ${todaySchedule.length} 堂課。`);
  }

  const todoData = getTodoData();
  const pendingTodos = todoData.filter(item => item.status === "未完成");
  if (pendingTodos.length > 0) {
    alerts.push(`目前尚有 ${pendingTodos.length} 項待辦事項。`);
  }

  if (alerts.length === 0) {
    alerts.push("目前沒有需要特別提醒的項目。");
  }

  alertList.innerHTML = alerts.map(item => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderSemesterSummary() {
  const ongoingCount = getCreditData().filter(course => course.status === "正在修").length;
  const selectedCourses = getSelectedCourses();
  const selectedCredits = selectedCourses.reduce((sum, c) => sum + Number(c.credits), 0);

  const passedCourses = getCreditData().filter(course => course.status === "已通過");
  const categoryRemaining = Object.entries(categoryTargets).map(([category, target]) => {
    const earned = passedCourses
      .filter(course => course.category === category)
      .reduce((sum, course) => sum + Number(course.credits), 0);

    return {
      category,
      remaining: Math.max(target - earned, 0)
    };
  }).sort((a, b) => b.remaining - a.remaining);

  document.getElementById("miniOngoingCount").textContent = `${ongoingCount} 門`;
  document.getElementById("miniSelectedCredits").textContent = `${selectedCredits} 學分`;
  document.getElementById("miniPriorityCategory").textContent = categoryRemaining[0]?.category || "無";
}

function renderSummaryCards() {
  const selectedCourses = getSelectedCourses();
  const selectedCredits = selectedCourses.reduce((sum, c) => sum + Number(c.credits), 0);

  const req = getRequirementData();
  const doneCount =
    Number(req.english.done) +
    Number(req.cpe.done) +
    Number(req.hours.done) +
    Number(req.license.done);

  document.getElementById("summarySelectedCredits").textContent = `${selectedCredits} 學分`;
  document.getElementById("summarySelectedCount").textContent = `共 ${selectedCourses.length} 門課程`;
  document.getElementById("summaryRequirementDone").textContent = `${doneCount} / 4`;
  document.getElementById("summaryRequirementText").textContent =
    doneCount === 4 ? "皆已完成" : "仍有項目待完成";
}

function renderOverviewText() {
  const todoData = getTodoData();
  const pendingTodos = todoData.filter(item => item.status === "未完成").length;

  const req = getRequirementData();
  const reqDone =
    Number(req.english.done) +
    Number(req.cpe.done) +
    Number(req.hours.done) +
    Number(req.license.done);

  let text = "目前整體進度穩定。";

  if (reqDone < 4) {
    text += " 建議優先完成尚未達成的畢業門檻。";
  }

  if (pendingTodos > 0) {
    text += ` 另外目前還有 ${pendingTodos} 項待辦事項需要安排。`;
  }

  document.getElementById("overviewText").textContent = text;
}


const NAME_KEY = "user-name";

const nameDisplay = document.getElementById("userNameDisplay");
const nameInput = document.getElementById("nameInput");
const editBtn = document.getElementById("editNameBtn");
const saveBtn = document.getElementById("saveNameBtn");
const editBox = document.getElementById("nameEditBox");

// 載入名字
function loadName() {
  const savedName = localStorage.getItem(NAME_KEY);

  if (savedName) {
    nameDisplay.textContent = `你好，${savedName}`;
  }
}

// 顯示輸入框
editBtn.addEventListener("click", () => {
  editBox.classList.remove("hidden");
  nameInput.focus();
});

// 儲存名字
saveBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();

  if (!name) return;

  localStorage.setItem(NAME_KEY, name);
  nameDisplay.textContent = `你好，${name}`;

  editBox.classList.add("hidden");
  nameInput.value = "";
});

loadName();
document.addEventListener("click", (e) => {
  if (!editBox.contains(e.target) && e.target !== editBtn) {
    editBox.classList.add("hidden");
  }
});

nameInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    saveBtn.click();
  }
});


 const fabMenuBtn = document.getElementById("fabMenuBtn");
const iphoneMenu = document.getElementById("iphoneMenu");
const menuBackdrop = document.getElementById("menuBackdrop");

function openMenu() {
  iphoneMenu.classList.add("show");
  menuBackdrop.classList.add("show");
  fabMenuBtn.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  iphoneMenu.classList.remove("show");
  menuBackdrop.classList.remove("show");
  fabMenuBtn.setAttribute("aria-expanded", "false");
}

function toggleMenu(e) {
  e.stopPropagation();
  if (iphoneMenu.classList.contains("show")) {
    closeMenu();
  } else {
    openMenu();
  }
}

fabMenuBtn.addEventListener("click", toggleMenu);

menuBackdrop.addEventListener("click", closeMenu);

iphoneMenu.addEventListener("click", (e) => {
  e.stopPropagation();
});

document.querySelectorAll("#iphoneMenu a").forEach(link => {
  link.addEventListener("click", () => {
    closeMenu();
  });
});



function initDashboard() {
  renderOverview();
  renderCredits();
  renderRequirements();
  renderAlerts();
  renderSemesterSummary();
  renderSummaryCards();
  renderOverviewText();
}

initDashboard();