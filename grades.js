const STORAGE_KEY = "grade-system-data-v1";

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const defaultGrades = [
  { id: uid(), semester: "113-1", courseName: "微積分", credits: 3, score: 88, category: "共同必修" },
  { id: uid(), semester: "113-1", courseName: "程式設計", credits: 3, score: 84, category: "專業必修" },
  { id: uid(), semester: "113-2", courseName: "統計學", credits: 3, score: 86, category: "專業必修" },
  { id: uid(), semester: "114-1", courseName: "投資學", credits: 3, score: 91, category: "專業選修" },
  { id: uid(), semester: "114-1", courseName: "英文聽講", credits: 2, score: 79, category: "共同選修" }
];

let grades = loadData();

const overallAverageEl = document.getElementById("overallAverage");
const overallGPAEl = document.getElementById("overallGPA");
const courseCountEl = document.getElementById("courseCount");
const filteredAverageEl = document.getElementById("filteredAverage");

const gradeForm = document.getElementById("gradeForm");
const semesterInput = document.getElementById("semesterInput");
const courseNameInput = document.getElementById("courseNameInput");
const creditsInput = document.getElementById("creditsInput");
const scoreInput = document.getElementById("scoreInput");
const categoryInput = document.getElementById("categoryInput");

const searchInput = document.getElementById("searchInput");
const semesterFilter = document.getElementById("semesterFilter");
const categoryFilter = document.getElementById("categoryFilter");

const gradeTableBody = document.getElementById("gradeTableBody");
const emptyText = document.getElementById("emptyText");

const batchImportInput = document.getElementById("batchImportInput");
const importBtn = document.getElementById("importBtn");
const fillExampleBtn = document.getElementById("fillExampleBtn");
const clearImportBtn = document.getElementById("clearImportBtn");
const resetDemoBtn = document.getElementById("resetDemoBtn");

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [...defaultGrades];
  } catch {
    return [...defaultGrades];
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(grades));
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

function getGPA(score) {
  if (score >= 90) return 4.3;
  if (score >= 85) return 4.0;
  if (score >= 80) return 3.7;
  if (score >= 77) return 3.3;
  if (score >= 73) return 3.0;
  if (score >= 70) return 2.7;
  if (score >= 67) return 2.3;
  if (score >= 63) return 2.0;
  if (score >= 60) return 1.7;
  return 0;
}

function calcWeightedAverage(list) {
  const totalCredits = list.reduce((sum, item) => sum + Number(item.credits), 0);
  if (totalCredits === 0) return 0;
  const total = list.reduce((sum, item) => sum + Number(item.score) * Number(item.credits), 0);
  return total / totalCredits;
}

function calcWeightedGPA(list) {
  const totalCredits = list.reduce((sum, item) => sum + Number(item.credits), 0);
  if (totalCredits === 0) return 0;
  const total = list.reduce((sum, item) => sum + getGPA(Number(item.score)) * Number(item.credits), 0);
  return total / totalCredits;
}

function renderOverview() {
  const overallAverage = calcWeightedAverage(grades);
  const overallGPA = calcWeightedGPA(grades);
  const filtered = getFilteredGrades();
  const filteredAverage = calcWeightedAverage(filtered);

  overallAverageEl.textContent = overallAverage.toFixed(1);
  overallGPAEl.textContent = overallGPA.toFixed(2);
  courseCountEl.textContent = grades.length;
  filteredAverageEl.textContent = filteredAverage.toFixed(1);
}

function renderSemesterOptions() {
  const semesters = [...new Set(grades.map(item => item.semester))].sort();
  const current = semesterFilter.value;

  semesterFilter.innerHTML = `<option value="全部">全部</option>` +
    semesters.map(item => `<option value="${item}">${item}</option>`).join("");

  semesterFilter.value = semesters.includes(current) ? current : "全部";
}

function getFilteredGrades() {
  const keyword = searchInput.value.trim().toLowerCase();
  const semester = semesterFilter.value;
  const category = categoryFilter.value;

  return grades.filter(item => {
    const matchKeyword = item.courseName.toLowerCase().includes(keyword);
    const matchSemester = semester === "全部" || item.semester === semester;
    const matchCategory = category === "全部" || item.category === category;
    return matchKeyword && matchSemester && matchCategory;
  });
}

function renderTable() {
  const filtered = getFilteredGrades();

  gradeTableBody.innerHTML = filtered.map(item => `
    <tr>
      <td>${item.semester}</td>
      <td>${escapeHtml(item.courseName)}</td>
      <td>${item.credits}</td>
      <td>${item.score}</td>
      <td>${getGPA(Number(item.score)).toFixed(1)}</td>
      <td>${item.category}</td>
      <td><button class="delete-btn" data-id="${item.id}">刪除</button></td>
    </tr>
  `).join("");

  emptyText.style.display = filtered.length === 0 ? "block" : "none";

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteGrade(btn.dataset.id));
  });
}

function addGrade(event) {
  event.preventDefault();

  const newGrade = {
    id: uid(),
    semester: semesterInput.value.trim(),
    courseName: courseNameInput.value.trim(),
    credits: Number(creditsInput.value),
    score: Number(scoreInput.value),
    category: categoryInput.value
  };

  if (!newGrade.semester || !newGrade.courseName || !newGrade.credits || !newGrade.category) {
    alert("請完整填寫資料。");
    return;
  }

  if (newGrade.score < 0 || newGrade.score > 100) {
    alert("成績請輸入 0 到 100。");
    return;
  }

  grades.unshift(newGrade);
  saveData();
  gradeForm.reset();
  refreshAll();
}

function deleteGrade(id) {
  grades = grades.filter(item => item.id !== id);
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
      errors.push(`第 ${index + 1} 行格式錯誤，應為：學期,課名,學分,成績,分類`);
      return;
    }

    const [semester, courseName, creditsText, scoreText, category] = parts;
    const credits = Number(creditsText);
    const score = Number(scoreText);

    if (!semester || !courseName) {
      errors.push(`第 ${index + 1} 行學期或課名不可空白`);
      return;
    }

    if (!Number.isFinite(credits) || credits <= 0) {
      errors.push(`第 ${index + 1} 行學分格式錯誤`);
      return;
    }

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      errors.push(`第 ${index + 1} 行成績格式錯誤`);
      return;
    }

    if (!["共同必修", "專業必修", "專業選修", "共同選修", "通識"].includes(category)) {
      errors.push(`第 ${index + 1} 行分類錯誤：${category}`);
      return;
    }

    parsed.push({
      id: uid(),
      semester,
      courseName,
      credits,
      score,
      category
    });
  });

  return { parsed, errors };
}

function importBatchGrades() {
  const text = batchImportInput.value.trim();
  if (!text) {
    alert("請先貼上成績資料。");
    return;
  }

  const { parsed, errors } = parseBatchImport(text);
  if (errors.length > 0) {
    alert("匯入失敗：\n" + errors.join("\n"));
    return;
  }

  grades = [...parsed, ...grades];
  saveData();
  batchImportInput.value = "";
  refreshAll();
  alert(`成功匯入 ${parsed.length} 筆成績資料。`);
}

function fillImportExample() {
  batchImportInput.value = `113-1,微積分,3,88,共同必修
113-1,程式設計,3,84,專業必修
114-1,投資學,3,91,專業選修`;
}

function clearImportText() {
  batchImportInput.value = "";
}

function resetDemoData() {
  grades = [...defaultGrades];
  saveData();
  refreshAll();
}

function refreshAll() {
  renderSemesterOptions();
  renderOverview();
  renderTable();
}

gradeForm.addEventListener("submit", addGrade);
searchInput.addEventListener("input", () => {
  renderOverview();
  renderTable();
});
semesterFilter.addEventListener("change", () => {
  renderOverview();
  renderTable();
});
categoryFilter.addEventListener("change", () => {
  renderOverview();
  renderTable();
});

importBtn.addEventListener("click", importBatchGrades);
fillExampleBtn.addEventListener("click", fillImportExample);
clearImportBtn.addEventListener("click", clearImportText);
resetDemoBtn.addEventListener("click", resetDemoData);

refreshAll();