const STORAGE_KEY = "credit-system-data-v1";

const categoryTargets = {
  "共同必修": 30,
  "專業必修": 45,
  "專業選修": 24,
  "共同選修": 12,
  "通識": 17
};

const defaultCourses = [
  { id: uid(), semester: "113-1", courseName: "微積分", credits: 3, category: "共同必修", status: "已通過" },
  { id: uid(), semester: "113-1", courseName: "程式設計", credits: 3, category: "專業必修", status: "已通過" },
  { id: uid(), semester: "113-1", courseName: "經濟學", credits: 3, category: "共同必修", status: "已通過" },
  { id: uid(), semester: "113-2", courseName: "統計學", credits: 3, category: "專業必修", status: "已通過" },
  { id: uid(), semester: "113-2", courseName: "管理學", credits: 3, category: "共同選修", status: "已通過" },
  { id: uid(), semester: "114-1", courseName: "財務管理", credits: 3, category: "專業必修", status: "正在修" },
  { id: uid(), semester: "114-1", courseName: "投資學", credits: 3, category: "專業選修", status: "已通過" },
  { id: uid(), semester: "114-1", courseName: "英文聽講", credits: 2, category: "共同選修", status: "未通過" },
  { id: uid(), semester: "114-1", courseName: "通識藝術欣賞", credits: 2, category: "通識", status: "已通過" }
];

let courses = loadCourses();

const earnedCreditsEl = document.getElementById("earnedCredits");
const requiredCreditsEl = document.getElementById("requiredCredits");
const overallProgressBarEl = document.getElementById("overallProgressBar");
const overallPercentEl = document.getElementById("overallPercent");
const remainingCreditsEl = document.getElementById("remainingCredits");
const passedCourseCountEl = document.getElementById("passedCourseCount");
const ongoingCourseCountEl = document.getElementById("ongoingCourseCount");

const categoryListEl = document.getElementById("categoryList");
const alertListEl = document.getElementById("alertList");
const courseTableBodyEl = document.getElementById("courseTableBody");
const emptyTextEl = document.getElementById("emptyText");

const courseForm = document.getElementById("courseForm");
const semesterInput = document.getElementById("semester");
const courseNameInput = document.getElementById("courseName");
const creditsInput = document.getElementById("credits");
const categoryInput = document.getElementById("category");
const statusInput = document.getElementById("status");

const searchInput = document.getElementById("searchInput");
const semesterFilter = document.getElementById("semesterFilter");
const categoryFilter = document.getElementById("categoryFilter");
const statusFilter = document.getElementById("statusFilter");
const resetDemoBtn = document.getElementById("resetDemoBtn");
const batchImportInput = document.getElementById("batchImportInput");
const importBtn = document.getElementById("importBtn");
const fillExampleBtn = document.getElementById("fillExampleBtn");
const clearImportBtn = document.getElementById("clearImportBtn");

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function saveCourses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

function loadCourses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...defaultCourses];
  } catch {
    return [...defaultCourses];
  }
}

function calcPercent(value, total) {
  if (total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

function getPassedCourses() {
  return courses.filter(course => course.status === "已通過");
}

function getOngoingCourses() {
  return courses.filter(course => course.status === "正在修");
}

function getTotalRequiredCredits() {
  return Object.values(categoryTargets).reduce((sum, value) => sum + value, 0);
}

function getEarnedCredits() {
  return getPassedCourses().reduce((sum, course) => sum + Number(course.credits), 0);
}

function renderOverview() {
  const earned = getEarnedCredits();
  const required = getTotalRequiredCredits();
  const percent = calcPercent(earned, required);
  const remaining = Math.max(required - earned, 0);

  earnedCreditsEl.textContent = earned;
  requiredCreditsEl.textContent = required;
  overallPercentEl.textContent = `${percent}%`;
  remainingCreditsEl.textContent = remaining;
  overallProgressBarEl.style.width = `${percent}%`;
  passedCourseCountEl.textContent = getPassedCourses().length;
  ongoingCourseCountEl.textContent = getOngoingCourses().length;
}

function getCategoryColorClass(category) {
  const map = {
    "共同必修": ["progress__fill--green", "badge-green"],
    "專業必修": ["progress__fill--orange", "badge-orange"],
    "專業選修": ["progress__fill--blue", "badge-blue"],
    "共同選修": ["progress__fill--cyan", "badge-cyan"],
    "通識": ["progress__fill--dark", "badge-blue"]
  };
  return map[category] || ["progress__fill--dark", "badge-blue"];
}

function renderCategoryProgress() {
  const passedCourses = getPassedCourses();

  categoryListEl.innerHTML = Object.entries(categoryTargets).map(([category, target]) => {
    const earned = passedCourses
      .filter(course => course.category === category)
      .reduce((sum, course) => sum + Number(course.credits), 0);

    const remaining = Math.max(target - earned, 0);
    const percent = calcPercent(earned, target);
    const [fillClass, badgeClass] = getCategoryColorClass(category);

    return `
      <article class="category-item">
        <div class="category-item__top">
          <div>
            <h3 class="category-item__name">${category}</h3>
            <p class="category-item__detail">尚缺 ${remaining} 學分</p>
          </div>
          <div class="category-item__value">
            <strong>${earned} / ${target}</strong>
            <span>學分</span>
          </div>
        </div>

        <div class="progress">
          <div class="progress__fill ${fillClass}" style="width:${percent}%"></div>
        </div>

        <div class="category-item__bottom">
          <span class="category-item__detail">完成進度</span>
          <span class="badge ${badgeClass}">${percent}%</span>
        </div>
      </article>
    `;
  }).join("");
}

function renderAlerts() {
  const alerts = [];
  const passedCourses = getPassedCourses();
  const failedCourses = courses.filter(course => course.status === "未通過");
  const ongoingCourses = getOngoingCourses();

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
    alerts.push(`目前有 ${failedCourses.length} 門課未通過，建議優先確認補修安排。`);
  }

  if (ongoingCourses.length > 0) {
    alerts.push(`目前有 ${ongoingCourses.length} 門課正在修習，尚未列入正式畢業學分。`);
  }

  if (alerts.length === 0) {
    alerts.push("目前沒有需要特別提醒的學分項目。");
  }

  alertListEl.innerHTML = alerts.map(item => `<li>${item}</li>`).join("");
}

function renderSemesterFilterOptions() {
  const semesters = [...new Set(courses.map(course => course.semester))].sort();
  const currentValue = semesterFilter.value;

  semesterFilter.innerHTML = `<option value="全部">全部</option>` +
    semesters.map(semester => `<option value="${semester}">${semester}</option>`).join("");

  if (semesters.includes(currentValue)) {
    semesterFilter.value = currentValue;
  } else {
    semesterFilter.value = "全部";
  }
}

function getFilteredCourses() {
  const searchText = searchInput.value.trim().toLowerCase();
  const selectedSemester = semesterFilter.value;
  const selectedCategory = categoryFilter.value;
  const selectedStatus = statusFilter.value;

  return courses.filter(course => {
    const matchSearch = course.courseName.toLowerCase().includes(searchText);
    const matchSemester = selectedSemester === "全部" || course.semester === selectedSemester;
    const matchCategory = selectedCategory === "全部" || course.category === selectedCategory;
    const matchStatus = selectedStatus === "全部" || course.status === selectedStatus;

    return matchSearch && matchSemester && matchCategory && matchStatus;
  });
}

function getStatusPill(status) {
  if (status === "已通過") {
    return `<span class="status-pill status-pill--passed">已通過</span>`;
  }
  if (status === "正在修") {
    return `<span class="status-pill status-pill--ongoing">正在修</span>`;
  }
  return `<span class="status-pill status-pill--failed">未通過</span>`;
}

function renderCourseTable() {
  const filtered = getFilteredCourses();

  courseTableBodyEl.innerHTML = filtered.map(course => `
    <tr>
      <td>${course.semester}</td>
      <td>${escapeHtml(course.courseName)}</td>
      <td>${course.credits}</td>
      <td>${course.category}</td>
      <td>${getStatusPill(course.status)}</td>
      <td>
        <button class="delete-btn" data-id="${course.id}">刪除</button>
      </td>
    </tr>
  `).join("");

  emptyTextEl.style.display = filtered.length === 0 ? "block" : "none";

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      deleteCourse(btn.dataset.id);
    });
  });
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
function isValidCategory(category) {
  return Object.keys(categoryTargets).includes(category);
}

function isValidStatus(status) {
  return ["已通過", "正在修", "未通過"].includes(status);
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

    if (parts.length !== 5) {
      errors.push(`第 ${index + 1} 行格式錯誤，應為：學期,課名,學分,分類,狀態`);
      return;
    }

    const [semester, courseName, creditsText, category, status] = parts;
    const credits = Number(creditsText);

    if (!semester) {
      errors.push(`第 ${index + 1} 行學期不可空白`);
      return;
    }

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

    if (!isValidStatus(status)) {
      errors.push(`第 ${index + 1} 行狀態錯誤：${status}`);
      return;
    }

    parsedCourses.push({
      id: uid(),
      semester,
      courseName,
      credits,
      category,
      status
    });
  });

  return { parsedCourses, errors };
}

function addCourse(event) {
  event.preventDefault();

  const newCourse = {
    id: uid(),
    semester: semesterInput.value.trim(),
    courseName: courseNameInput.value.trim(),
    credits: Number(creditsInput.value),
    category: categoryInput.value,
    status: statusInput.value
  };

  if (!newCourse.semester || !newCourse.courseName || !newCourse.credits || !newCourse.category || !newCourse.status) {
    alert("請完整填寫課程資料。");
    return;
  }

  courses.unshift(newCourse);
  saveCourses();
  courseForm.reset();
  refreshAll();
}

function deleteCourse(id) {
  courses = courses.filter(course => course.id !== id);
  saveCourses();
  refreshAll();
}

function resetDemoData() {
  courses = [...defaultCourses];
  saveCourses();
  refreshAll();
}

function importBatchCourses() {
  const rawText = batchImportInput.value.trim();

  if (!rawText) {
    alert("請先貼上課程資料。");
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

  courses = [...parsedCourses, ...courses];
  saveCourses();
  batchImportInput.value = "";
  refreshAll();

  function saveCourses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}
  alert(`成功匯入 ${parsedCourses.length} 筆課程資料。`);
}

function fillImportExample() {
  batchImportInput.value = `114-1,財務管理,3,專業必修,已通過
114-1,投資學,3,專業選修,正在修
114-1,英文聽講,2,共同選修,未通過`;
}

function clearImportText() {
  batchImportInput.value = "";
}

function refreshAll() {
  renderOverview();
  renderCategoryProgress();
  renderAlerts();
  renderSemesterFilterOptions();
  renderCourseTable();
}

courseForm.addEventListener("submit", addCourse);
resetDemoBtn.addEventListener("click", resetDemoData);

searchInput.addEventListener("input", renderCourseTable);
semesterFilter.addEventListener("change", renderCourseTable);
categoryFilter.addEventListener("change", renderCourseTable);
statusFilter.addEventListener("change", renderCourseTable);
importBtn.addEventListener("click", importBatchCourses);
fillExampleBtn.addEventListener("click", fillImportExample);
clearImportBtn.addEventListener("click", clearImportText);

refreshAll();