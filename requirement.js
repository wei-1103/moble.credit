const STORAGE_KEY = "graduation-requirements-v1";

const defaultData = {
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

let requirementData = loadData();

const doneCountEl = document.getElementById("doneCount");
const totalCountEl = document.getElementById("totalCount");
const overallProgressBarEl = document.getElementById("overallProgressBar");
const overallPercentEl = document.getElementById("overallPercent");
const remainingCountEl = document.getElementById("remainingCount");
const doneCountSmallEl = document.getElementById("doneCountSmall");
const pendingCountSmallEl = document.getElementById("pendingCountSmall");

const statusGridEl = document.getElementById("statusGrid");
const alertListEl = document.getElementById("alertList");

const requirementForm = document.getElementById("requirementForm");
const resetBtn = document.getElementById("resetBtn");

const englishDoneEl = document.getElementById("englishDone");
const englishMethodEl = document.getElementById("englishMethod");
const englishNoteEl = document.getElementById("englishNote");

const cpeDoneEl = document.getElementById("cpeDone");
const cpeNoteEl = document.getElementById("cpeNote");

const hoursDoneEl = document.getElementById("hoursDone");
const hoursNoteEl = document.getElementById("hoursNote");

const licenseDoneEl = document.getElementById("licenseDone");
const licenseNameEl = document.getElementById("licenseName");
const licenseDateEl = document.getElementById("licenseDate");

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : structuredClone(defaultData);
  } catch {
    return structuredClone(defaultData);
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requirementData));
}

function calcDoneCount() {
  let count = 0;
  if (requirementData.english.done) count++;
  if (requirementData.cpe.done) count++;
  if (requirementData.hours.done) count++;
  if (requirementData.license.done) count++;
  return count;
}

function calcPercent(value, total) {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

function renderOverview() {
  const total = 4;
  const done = calcDoneCount();
  const pending = total - done;
  const percent = calcPercent(done, total);

  doneCountEl.textContent = done;
  totalCountEl.textContent = total;
  overallPercentEl.textContent = `${percent}%`;
  remainingCountEl.textContent = pending;
  doneCountSmallEl.textContent = done;
  pendingCountSmallEl.textContent = pending;
  overallProgressBarEl.style.width = `${percent}%`;
}

function statusPill(done) {
  return done
    ? `<span class="status-pill status-pill--done">已完成</span>`
    : `<span class="status-pill status-pill--pending">未完成</span>`;
}

function renderStatusGrid() {
  const items = [
    {
      title: "英文能力門檻",
      desc: `${requirementData.english.method}｜${requirementData.english.note || "尚未填寫"}`,
      done: requirementData.english.done
    },
    {
      title: "CPE 門檻",
      desc: requirementData.cpe.note || "尚未填寫",
      done: requirementData.cpe.done
    },
    {
      title: "服務時數",
      desc: requirementData.hours.note || "尚未填寫",
      done: requirementData.hours.done
    },
    {
      title: "證照條件",
      desc: `${requirementData.license.name || "尚未填寫"}${requirementData.license.date ? "｜" + requirementData.license.date : ""}`,
      done: requirementData.license.done
    }
  ];

  statusGridEl.innerHTML = items.map(item => `
    <article class="status-card">
      <div class="status-card__top">
        <div>
          <h3 class="status-card__title">${item.title}</h3>
          <p class="status-card__desc">${item.desc}</p>
        </div>
        ${statusPill(item.done)}
      </div>
    </article>
  `).join("");
}

function renderAlerts() {
  const alerts = [];

  if (!requirementData.english.done) {
    alerts.push("英文能力門檻尚未完成，建議提早規劃檢定或替代方案。");
  }

  if (!requirementData.cpe.done) {
    alerts.push("CPE 門檻尚未達標，請先確認系上規定的題數或通過方式。");
  }

  if (!requirementData.hours.done) {
    alerts.push("服務時數尚未完成，建議確認還差多少時數。");
  }

  if (!requirementData.license.done) {
    alerts.push("證照條件尚未完成，請確認可認列的證照項目。");
  }

  if (alerts.length === 0) {
    alerts.push("目前四項畢業門檻皆已完成。");
  }

  alertListEl.innerHTML = alerts.map(item => `<li>${item}</li>`).join("");
}

function fillForm() {
  englishDoneEl.value = String(requirementData.english.done);
  englishMethodEl.value = requirementData.english.method;
  englishNoteEl.value = requirementData.english.note;

  cpeDoneEl.value = String(requirementData.cpe.done);
  cpeNoteEl.value = requirementData.cpe.note;

  hoursDoneEl.value = String(requirementData.hours.done);
  hoursNoteEl.value = requirementData.hours.note;

  licenseDoneEl.value = String(requirementData.license.done);
  licenseNameEl.value = requirementData.license.name;
  licenseDateEl.value = requirementData.license.date;
}

function readForm() {
  requirementData = {
    english: {
      done: englishDoneEl.value === "true",
      method: englishMethodEl.value,
      note: englishNoteEl.value.trim()
    },
    cpe: {
      done: cpeDoneEl.value === "true",
      note: cpeNoteEl.value.trim()
    },
    hours: {
      done: hoursDoneEl.value === "true",
      note: hoursNoteEl.value.trim()
    },
    license: {
      done: licenseDoneEl.value === "true",
      name: licenseNameEl.value.trim(),
      date: licenseDateEl.value
    }
  };
}

function refreshAll() {
  renderOverview();
  renderStatusGrid();
  renderAlerts();
  fillForm();
}

requirementForm.addEventListener("submit", (event) => {
  event.preventDefault();
  readForm();
  saveData();
  renderOverview();
  renderStatusGrid();
  renderAlerts();
  alert("資料已儲存");
});

resetBtn.addEventListener("click", () => {
  requirementData = structuredClone(defaultData);
  saveData();
  refreshAll();
});

refreshAll();