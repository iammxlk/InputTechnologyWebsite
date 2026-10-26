/**
 * ============================================================================
 * app.js — ลอจิกหลักของระบบจัดการเรียนรู้ รายวิชา 21901-2017 (ปวช.1)
 * สถาบันเทคโนโลยีจิตรลดา | รายวิชา: เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * ธีม: Neo-Brutalism (Stwedy x CDTI) | ฟอนต์: Stack Sans Notch + Mitr | Zero-Emoji
 * ============================================================================
 */

/**
 * [สำหรับครูผู้สอน] วางลิงก์ Web App URL ที่ได้จากการ Deploy Google Apps Script (backend/Code.gs) ที่นี่
 * นักเรียนจะไม่เห็นช่องกรอก API Key หรือลิงก์หลังบ้านใดๆ บนหน้าเว็บเลย
 */
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID_HERE/exec";

/**
 * [ทางเลือกเสริมสำหรับครูผู้สอน] หากมี Google OAuth Client ID สามารถวางที่นี่เพื่อเปิดปุ่ม Google Sign-In 1-Click
 */
const GOOGLE_CLIENT_ID = "";

const STORAGE_KEY = "stwedy_21901_2017_state_v2";
const THEME_STORAGE_KEY = "stwedy_21901_2017_theme";

/* ============================================================================
   1. APPLICATION STATE
   ============================================================================ */
const appState = {
  student: {
    studentId: "",
    fullName: "",
    email: ""
  },
  readUnits: [], // Array of unit IDs [1..15] -> หน่วยละ 1 คะแนน (เต็ม 15)
  interactedUnits: [], // Array of unit IDs ที่กดทดลองใช้อุปกรณ์จำลองแล้ว
  quizScores: {}, // { [unitId]: 0..3 } -> หน่วยละ 3 คะแนน (เต็ม 45)
  gameScores: {
    cashier_rush: 0,
    cyber_detective: 0,
    vault_hacker: 0,
    pixel_compressor: 0
  },
  activeView: "home", // 'home' | 'lessons' | 'unit-step' | 'games' | 'progress'
  activeModuleFilter: "all", // 'all' | '1' | '2' | '3' | '4' | '5'
  activeUnitId: 1,
  activeStepIndex: 0, // 0: Step 1, 1: Step 2, 2: Step 3 Simulator, 3: Step 4 Quiz
  celebratedCertificate: false
};

/* ============================================================================
   2. INITIALIZATION & THEME SETUP
   ============================================================================ */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  loadStateFromLocalStorage();
  bindGlobalEvents();
  initGoogleIdentityIfConfigured();

  renderNavQuickUnits();
  renderHomeSyllabus();
  renderLessonsCatalog();
  renderMiniGamesCards();
  updateAllScoreDashboards();

  // บังคับเข้าสู่ระบบด้วยบัญชี Google ก่อนเข้าใช้งานเว็บไซต์
  enforceMandatoryAuthGate();
});

function initTheme() {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY) || "light";
    applyTheme(savedTheme);
  } catch (_) {
    applyTheme("light");
  }
}

function applyTheme(theme) {
  const normalized = theme === "dark" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", normalized);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, normalized);
  } catch (_) {
    // Ignore storage error
  }

  const sunIcon = document.getElementById("theme-icon-sun");
  const moonIcon = document.getElementById("theme-icon-moon");
  const labelEl = document.getElementById("theme-toggle-label");

  if (normalized === "dark") {
    sunIcon?.classList.remove("hidden");
    moonIcon?.classList.add("hidden");
    if (labelEl) labelEl.textContent = "โหมดสว่าง";
  } else {
    sunIcon?.classList.add("hidden");
    moonIcon?.classList.remove("hidden");
    if (labelEl) labelEl.textContent = "โหมดมืด";
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "light";
  applyTheme(current === "dark" ? "light" : "dark");
}

/* ============================================================================
   3. LOCAL STORAGE & STRICT SCORE / CERTIFICATE CALCULATION
   ============================================================================ */
function loadStateFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);

    if (parsed.student && typeof parsed.student === "object") {
      appState.student.studentId = String(parsed.student.studentId || "").trim();
      appState.student.fullName = String(parsed.student.fullName || "").trim();
      appState.student.email = String(parsed.student.email || "").trim().toLowerCase();
    }
    if (Array.isArray(parsed.readUnits)) {
      appState.readUnits = Array.from(
        new Set(parsed.readUnits.map(Number).filter((n) => n >= 1 && n <= 15))
      );
    }
    if (Array.isArray(parsed.interactedUnits)) {
      appState.interactedUnits = Array.from(
        new Set(parsed.interactedUnits.map(Number).filter((n) => n >= 1 && n <= 15))
      );
    }
    if (parsed.quizScores && typeof parsed.quizScores === "object") {
      appState.quizScores = { ...parsed.quizScores };
    }
    if (parsed.gameScores && typeof parsed.gameScores === "object") {
      appState.gameScores = {
        ...appState.gameScores,
        ...parsed.gameScores
      };
    }
  } catch (err) {
    console.warn("Could not load state from localStorage:", err);
  }
}

function saveStateToLocalStorage() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        student: appState.student,
        readUnits: appState.readUnits,
        interactedUnits: appState.interactedUnits,
        quizScores: appState.quizScores,
        gameScores: appState.gameScores
      })
    );
  } catch (err) {
    console.warn("Could not save state to localStorage:", err);
  }
}

function isStudentAuthenticated() {
  return Boolean(
    appState.student.email &&
      appState.student.email.includes("@") &&
      appState.student.studentId &&
      appState.student.fullName
  );
}

/**
 * คำนวณคะแนนทั้ง 3 ส่วน และตรวจสอบเงื่อนไขการปลดล็อกเกียรติบัตรอย่างเข้มงวด:
 * 1. ต้องเรียนและทดลองอุปกรณ์ครบทั้ง 15 หน่วย (readScore === 15)
 * 2. ต้องทำแบบทดสอบท้ายหน่วยครบทั้ง 15 หน่วย (completedQuizzesCount === 15)
 * 3. ต้องได้คะแนนรวมสุทธิตั้งแต่ 70 / 100 คะแนนขึ้นไป (totalScore >= 70)
 */
function calculateScores() {
  const readScore = Math.min(15, appState.readUnits.length);

  let quizScore = 0;
  let completedQuizzesCount = 0;
  for (let uid = 1; uid <= 15; uid++) {
    if (Object.prototype.hasOwnProperty.call(appState.quizScores, uid)) {
      completedQuizzesCount += 1;
      quizScore += Math.min(3, Math.max(0, Number(appState.quizScores[uid]) || 0));
    }
  }
  quizScore = Math.min(45, quizScore);

  let gameScore = 0;
  Object.values(appState.gameScores).forEach((pts) => {
    gameScore += Math.min(10, Math.max(0, Number(pts) || 0));
  });
  gameScore = Math.min(40, gameScore);

  const totalScore = Math.min(100, readScore + quizScore + gameScore);

  const allUnitsRead = readScore >= 15;
  const allQuizzesDone = completedQuizzesCount >= 15;
  const scorePassed = totalScore >= 70;
  const certificateUnlocked = allUnitsRead && allQuizzesDone && scorePassed;

  return {
    readScore,
    quizScore,
    completedQuizzesCount,
    gameScore,
    totalScore,
    allUnitsRead,
    allQuizzesDone,
    scorePassed,
    certificateUnlocked
  };
}

/* ============================================================================
   4. MANDATORY GOOGLE LOGIN GATE & CLOUD PROGRESS RESTORATION
   ============================================================================ */
function enforceMandatoryAuthGate() {
  const authGate = document.getElementById("auth-gate");
  const appShell = document.getElementById("app-shell");

  const emailInput = document.getElementById("student-email-input");
  const idInput = document.getElementById("student-id-input");
  const nameInput = document.getElementById("student-name-input");

  if (emailInput) emailInput.value = appState.student.email || "";
  if (idInput) idInput.value = appState.student.studentId || "";
  if (nameInput) nameInput.value = appState.student.fullName || "";

  if (isStudentAuthenticated()) {
    authGate?.classList.add("hidden");
    appShell?.classList.remove("hidden");
    appShell?.classList.add("flex");
    updateProfileAndHomeWelcomeUI();
    fetchStudentProgressFromBackend(true);
  } else {
    authGate?.classList.remove("hidden");
    appShell?.classList.add("hidden");
    appShell?.classList.remove("flex");
  }
}

function initGoogleIdentityIfConfigured() {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_ID.trim()) return;
  const gsiContainer = document.getElementById("google-gsi-container");
  const gsiBtnMount = document.getElementById("google-gsi-button");

  const tryInitGsi = () => {
    if (!window.google || !window.google.accounts || !window.google.accounts.id) return;
    gsiContainer?.classList.remove("hidden");
    gsiContainer?.classList.add("flex");
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID.trim(),
      callback: handleGoogleCredentialResponse
    });
    if (gsiBtnMount) {
      window.google.accounts.id.renderButton(gsiBtnMount, {
        theme: "outline",
        size: "large",
        shape: "rectangular",
        text: "signin_with"
      });
    }
  };

  setTimeout(tryInitGsi, 600);
}

function handleGoogleCredentialResponse(response) {
  try {
    const token = response.credential;
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(decodeURIComponent(escape(window.atob(base64))));

    const emailInput = document.getElementById("student-email-input");
    const nameInput = document.getElementById("student-name-input");
    if (emailInput && payload.email) emailInput.value = payload.email;
    if (nameInput && payload.name && !nameInput.value) nameInput.value = payload.name;

    showGateStatus(`เชื่อมต่อบัญชี Google (${payload.email}) สำเร็จ กรุณาตรวจสอบรหัสนักศึกษาแล้วกดปุ่มเข้าสู่ระบบ`, "success");
  } catch (err) {
    console.warn("Failed to decode Google JWT:", err);
  }
}

function showGateStatus(message, type = "info") {
  const statusEl = document.getElementById("login-gate-status");
  if (!statusEl) return;
  statusEl.classList.remove("hidden", "bg-amber-200", "bg-emerald-200", "bg-red-200");
  if (type === "error") {
    statusEl.classList.add("bg-red-200");
  } else if (type === "success") {
    statusEl.classList.add("bg-emerald-200");
  } else {
    statusEl.classList.add("bg-amber-200");
  }
  statusEl.textContent = message;
}

function updateProfileAndHomeWelcomeUI() {
  const fullName = appState.student.fullName || "ผู้เรียน";
  const studentId = appState.student.studentId || "-";
  const email = appState.student.email || "-";

  // Update Home Welcome Hero
  const homeNameEl = document.getElementById("home-welcome-name");
  const homeIdEl = document.getElementById("home-welcome-id");
  if (homeNameEl) homeNameEl.textContent = fullName;
  if (homeIdEl) homeIdEl.textContent = `รหัส: ${studentId}`;

  // Update Profile Card in Progress View
  const nameEl = document.getElementById("profile-student-name");
  const metaEl = document.getElementById("profile-student-meta");
  const avatarEl = document.getElementById("profile-avatar-initials");

  if (nameEl) nameEl.textContent = fullName;
  if (metaEl) {
    metaEl.textContent = `รหัสนักศึกษา: ${studentId} | บัญชี Google: ${email}`;
  }
  if (avatarEl) {
    const emailPrefix = (email !== "-" ? email : "ST").slice(0, 2).toUpperCase();
    avatarEl.textContent = emailPrefix;
  }
}

/* ============================================================================
   5. VIEW SWITCHING & NAVBAR DROPDOWN
   ============================================================================ */
function switchView(viewName) {
  if (!isStudentAuthenticated()) {
    enforceMandatoryAuthGate();
    return;
  }

  appState.activeView = viewName;

  const views = {
    home: document.getElementById("view-home"),
    lessons: document.getElementById("view-lessons"),
    "unit-step": document.getElementById("view-unit-step"),
    games: document.getElementById("view-games"),
    progress: document.getElementById("view-progress")
  };

  Object.entries(views).forEach(([key, section]) => {
    if (!section) return;
    if (key === viewName) {
      section.classList.remove("hidden");
    } else {
      section.classList.add("hidden");
    }
  });

  // Update active state on Navbar buttons
  const tabHome = document.getElementById("nav-tab-home");
  const tabGames = document.getElementById("nav-tab-games");
  const tabProgress = document.getElementById("nav-tab-progress");
  const dropdownTrigger = document.getElementById("nav-dropdown-trigger");

  if (tabHome) {
    tabHome.className = `brutal-btn ${
      viewName === "home" ? "bg-amber-300 text-black" : "bg-white text-black hover:bg-amber-200"
    } px-3.5 py-2 rounded-xl text-xs sm:text-sm font-thai`;
  }
  if (dropdownTrigger) {
    dropdownTrigger.className = `brutal-btn ${
      viewName === "lessons" || viewName === "unit-step"
        ? "bg-emerald-400 text-black"
        : "bg-white text-black hover:bg-emerald-200"
    } px-3.5 py-2 rounded-xl text-xs sm:text-sm font-thai`;
  }
  if (tabGames) {
    tabGames.className = `brutal-btn ${
      viewName === "games" ? "bg-pink-300 text-black" : "bg-white text-black hover:bg-pink-200"
    } px-3.5 py-2 rounded-xl text-xs sm:text-sm font-thai`;
  }
  if (tabProgress) {
    tabProgress.className = `brutal-btn ${
      viewName === "progress" ? "bg-sky-300 text-black" : "bg-white text-black hover:bg-sky-200"
    } px-3.5 py-2 rounded-xl text-xs sm:text-sm font-thai`;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function toggleNavDropdown(forceClose = false) {
  const menu = document.getElementById("nav-dropdown-menu");
  const caret = document.getElementById("nav-dropdown-caret");
  if (!menu) return;

  const isHidden = menu.classList.contains("hidden");
  if (forceClose || !isHidden) {
    menu.classList.add("hidden");
    if (caret) caret.style.transform = "rotate(0deg)";
  } else {
    menu.classList.remove("hidden");
    if (caret) caret.style.transform = "rotate(180deg)";
  }
}

function renderNavQuickUnits() {
  const grid = document.getElementById("nav-quick-units-grid");
  if (!grid || !Array.isArray(window.COURSE_UNITS)) return;

  grid.innerHTML = window.COURSE_UNITS.map((unit) => {
    const isRead = appState.readUnits.includes(unit.id);
    const shortCode = `U${String(unit.id).padStart(2, "0")}`;
    return `
      <button
        type="button"
        data-quick-unit="${unit.id}"
        class="brutal-btn ${
          isRead ? "bg-emerald-300 text-black" : "bg-amber-100 text-black hover:bg-amber-300"
        } py-1.5 rounded-lg font-notch font-bold text-xs"
        title="${unit.title}"
      >
        ${shortCode}
      </button>
    `;
  }).join("");

  grid.querySelectorAll("[data-quick-unit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = Number(btn.getAttribute("data-quick-unit"));
      toggleNavDropdown(true);
      openUnitReader(uid, 0);
    });
  });
}

/* ============================================================================
   6. VIEW 0: HOME PAGE COURSE SYLLABUS RENDERER
   ============================================================================ */
function renderHomeSyllabus() {
  const container = document.getElementById("home-syllabus-container");
  if (!container || !Array.isArray(window.COURSE_UNITS)) return;

  const modulesMeta = [
    {
      id: 1,
      code: "MODULE 01",
      title: "หมวดที่ 1: พื้นฐานข้อมูลและอุปกรณ์นำเข้าทั่วไป (หน่วยที่ 1 - 4)",
      desc: "ข้อมูลดิบ vs สารสนเทศ, วงจร IPO, หลักการ GIGO, แป้นพิมพ์ (Key Matrix & Scan Code), เมาส์ (DPI), กล้องดิจิทัล (CCD/CMOS) และไมโครโฟน (ADC)",
      headerBg: "bg-emerald-300",
      tintClass: "module-card-tint-1"
    },
    {
      id: 2,
      code: "MODULE 02",
      title: "หมวดที่ 2: เทคโนโลยีบาร์โค้ดและระบบสแกนไร้สาย (หน่วยที่ 5 - 6)",
      desc: "โครงสร้างบาร์โค้ด EAN-13 (รหัส 885), หัวอ่าน CCD Linear Imager vs 2D Area CMOS, ปืนสแกนไร้สาย (2.4GHz/Bluetooth) โหมด Instant & Batch และมินิเกม Cashier Rush",
      headerBg: "bg-amber-300",
      tintClass: "module-card-tint-2"
    },
    {
      id: 3,
      code: "MODULE 03",
      title: "หมวดที่ 3: รหัสภาพ QR Code และความปลอดภัยของข้อมูล (หน่วยที่ 7 - 10)",
      desc: "โครงสร้าง QR Code 3 มุม, การกู้คืนข้อมูล Reed-Solomon (L/M/Q/H), ตระกูล QR 4 แบบ, การคำนวณ Check Digit หลักที่ 13, การป้องกัน Quishing และการเข้ารหัส SHA-256 + Salt",
      headerBg: "bg-sky-300",
      tintClass: "module-card-tint-3"
    },
    {
      id: 4,
      code: "MODULE 04",
      title: "หมวดที่ 4: ระบบระบุตัวตนด้วยคลื่นวิทยุและชีวมิติ (หน่วยที่ 11 - 12)",
      desc: "องค์ประกอบ RFID (Tag/Reader/Antenna), Passive vs Active Tag, คลื่น LF/HF/UHF, ลายนิ้วมือ Minutiae และการปรับสมดุลค่า FAR, FRR และจุดสมดุล EER",
      headerBg: "bg-pink-300",
      tintClass: "module-card-tint-4"
    },
    {
      id: 5,
      code: "MODULE 05",
      title: "หมวดที่ 5: ซอฟต์แวร์จัดการข้อมูล การแปลงรหัส และการบีบอัด (หน่วยที่ 13 - 15)",
      desc: "โครงสร้างไฟล์ CSV vs JSON, การคลีนข้อมูลด้วย Power Query, การคำนวณไบต์ UTF-8 vs TIS-620, Base64 และการบีบอัดข้อมูล Lossless/Lossy ด้วยวิธี Run-Length Encoding (RLE)",
      headerBg: "bg-amber-300",
      tintClass: "module-card-tint-5"
    }
  ];

  container.innerHTML = modulesMeta
    .map((mod) => {
      const modUnits = window.COURSE_UNITS.filter((u) => Number(u.moduleId) === mod.id);
      const readInMod = modUnits.filter((u) => appState.readUnits.includes(u.id)).length;

      return `
        <div class="brutal-card ${mod.tintClass} rounded-2xl p-5 space-y-4">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-black pb-3">
            <div class="space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-notch font-bold text-xs ${mod.headerBg} text-black px-2.5 py-0.5 rounded border-2 border-black">
                  ${mod.code}
                </span>
                <span class="font-notch font-bold text-xs bg-white text-black px-2.5 py-0.5 rounded border border-black">
                  ความคืบหน้าหมวดนี้: ${readInMod} / ${modUnits.length} หน่วย
                </span>
              </div>
              <h3 class="font-thai font-bold text-lg sm:text-xl">
                ${mod.title}
              </h3>
              <p class="font-thai text-xs sm:text-sm theme-text-muted">
                ${mod.desc}
              </p>
            </div>

            <button
              type="button"
              data-syllabus-module="${mod.id}"
              class="brutal-btn ${mod.headerBg} text-black px-4 py-2.5 rounded-xl text-xs sm:text-sm font-thai shrink-0"
            >
              เปิดดูเฉพาะหมวดที่ ${mod.id}
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 ${
            modUnits.length === 2
              ? "lg:grid-cols-2"
              : modUnits.length === 3
              ? "lg:grid-cols-3"
              : "lg:grid-cols-4"
          } gap-3">
            ${modUnits
              .map((u) => {
                const isRead = appState.readUnits.includes(u.id);
                const hasQuiz = Object.prototype.hasOwnProperty.call(appState.quizScores, u.id);
                const qPts = Number(appState.quizScores[u.id] || 0);
                return `
                  <button
                    type="button"
                    data-syllabus-unit="${u.id}"
                    class="calc-step-box rounded-xl p-3 text-left flex flex-col justify-between gap-2 cursor-pointer"
                  >
                    <div>
                      <div class="flex items-center justify-between gap-1">
                        <span class="font-notch font-bold text-xs ${mod.headerBg} text-black px-2 py-0.5 rounded border border-black">
                          ${u.code}
                        </span>
                        <span class="font-notch font-bold text-[11px] px-2 py-0.5 rounded border border-black ${
                          isRead && hasQuiz ? "bg-emerald-300 text-black" : "bg-amber-100 text-black"
                        }">
                          ${isRead ? "อ่านแล้ว" : "รอเรียน"} • ควิซ ${qPts}/3
                        </span>
                      </div>
                      <p class="font-thai font-semibold text-xs sm:text-sm mt-2 line-clamp-2">
                        ${u.title}
                      </p>
                    </div>
                    <span class="font-thai text-xs font-bold underline">คลิกเข้าเรียนหน่วยนี้ &rarr;</span>
                  </button>
                `;
              })
              .join("")}
          </div>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll("[data-syllabus-module]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const modId = btn.getAttribute("data-syllabus-module");
      selectModuleFilter(modId);
      switchView("lessons");
    });
  });

  container.querySelectorAll("[data-syllabus-unit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const uid = Number(btn.getAttribute("data-syllabus-unit"));
      openUnitReader(uid, 0);
    });
  });
}

/* ============================================================================
   7. VIEW 1: LESSONS CATALOG BY MODULE
   ============================================================================ */
function selectModuleFilter(moduleId) {
  appState.activeModuleFilter = String(moduleId);

  const labelMap = {
    all: "หมวดหมู่หน่วยการเรียน (ทั้งหมด)",
    "1": "หมวดที่ 1 (หน่วย 1-4)",
    "2": "หมวดที่ 2 (หน่วย 5-6)",
    "3": "หมวดที่ 3 (หน่วย 7-10)",
    "4": "หมวดที่ 4 (หน่วย 11-12)",
    "5": "หมวดที่ 5 (หน่วย 13-15)"
  };

  const titleMap = {
    all: "บทเรียนทั้งหมด 5 หมวดหมู่ (ครบ 15 หน่วยการเรียนรู้)",
    "1": "หมวดที่ 1: พื้นฐานข้อมูลและอุปกรณ์นำเข้าทั่วไป (หน่วยที่ 1 - 4)",
    "2": "หมวดที่ 2: เทคโนโลยีบาร์โค้ดและระบบสแกนไร้สาย (หน่วยที่ 5 - 6)",
    "3": "หมวดที่ 3: รหัสภาพ QR Code และความปลอดภัยของข้อมูล (หน่วยที่ 7 - 10)",
    "4": "หมวดที่ 4: ระบบระบุตัวตนด้วยคลื่นวิทยุและชีวมิติ (หน่วยที่ 11 - 12)",
    "5": "หมวดที่ 5: ซอฟต์แวร์จัดการข้อมูล การแปลงรหัส และการบีบอัด (หน่วยที่ 13 - 15)"
  };

  const navLabel = document.getElementById("nav-current-module-label");
  const tagEl = document.getElementById("lessons-module-tag");
  const titleEl = document.getElementById("lessons-view-title");

  if (navLabel) navLabel.textContent = labelMap[appState.activeModuleFilter] || "หมวดหมู่หน่วยการเรียน";
  if (tagEl) {
    tagEl.textContent =
      appState.activeModuleFilter === "all"
        ? "ALL 5 MODULES • 15 UNITS"
        : `MODULE 0${appState.activeModuleFilter} SELECTED`;
  }
  if (titleEl) {
    titleEl.textContent = titleMap[appState.activeModuleFilter] || titleMap.all;
  }

  document.querySelectorAll(".module-filter-btn").forEach((btn) => {
    const m = btn.getAttribute("data-module-pill");
    btn.className = `module-filter-btn brutal-btn ${
      m === appState.activeModuleFilter ? "bg-amber-300 text-black" : "bg-white text-black hover:bg-amber-100"
    } px-3.5 py-2 rounded-xl text-xs font-thai`;
  });

  renderLessonsCatalog();
}

function renderLessonsCatalog() {
  const grid = document.getElementById("units-grid");
  const readCounter = document.getElementById("lessons-read-counter");
  if (!grid || !Array.isArray(window.COURSE_UNITS)) return;

  if (readCounter) {
    readCounter.textContent = `READ: ${appState.readUnits.length} / 15`;
  }

  const units =
    appState.activeModuleFilter === "all"
      ? window.COURSE_UNITS
      : window.COURSE_UNITS.filter((u) => String(u.moduleId) === String(appState.activeModuleFilter));

  grid.innerHTML = units
    .map((unit) => {
      const isRead = appState.readUnits.includes(unit.id);
      const hasQuiz = Object.prototype.hasOwnProperty.call(appState.quizScores, unit.id);
      const qScore = Number(appState.quizScores[unit.id] || 0);
      const totalUnitPts = (isRead ? 1 : 0) + qScore;
      const stepCount = (Array.isArray(unit.steps) ? unit.steps.length : 2) + 2;
      const descText = unit.summary || unit.subtitle || unit.simLabel || "";

      return `
        <article
          data-open-unit="${unit.id}"
          class="brutal-card brutal-card-interactive module-card-tint-${unit.moduleId} rounded-3xl p-6 flex flex-col justify-between cursor-pointer"
        >
          <div class="space-y-3.5">
            <div class="flex items-center justify-between gap-2">
              <span class="font-notch font-bold text-xs px-3 py-1 rounded-lg border-2 border-black ${unit.accentBg} text-black">
                ${unit.code} • หมวดที่ ${unit.moduleId}
              </span>
              <span class="font-notch font-bold text-xs px-2.5 py-1 rounded-lg border-2 border-black ${
                totalUnitPts === 4 ? "bg-emerald-400 text-black" : "bg-amber-200 text-black"
              }">
                ${totalUnitPts} / 4 PTS
              </span>
            </div>

            <h3 class="font-thai font-bold text-lg sm:text-xl leading-snug">
              ${unit.title}
            </h3>

            <p class="font-thai text-xs sm:text-sm theme-text-muted">
              ${descText}
            </p>
          </div>

          <div class="pt-5 mt-5 border-t-2 border-dashed border-zinc-400 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs font-thai">
              <span class="px-2.5 py-1 rounded-md border border-black ${
                isRead ? "bg-emerald-300 text-black font-semibold" : "bg-amber-100 text-black"
              }">
                ${isRead ? "[READ OK] เรียนครบแล้ว (+1)" : "ยังไม่ได้เรียน (0/1)"}
              </span>
              <span class="px-2.5 py-1 rounded-md border border-black ${
                hasQuiz ? "bg-sky-200 text-black font-semibold" : "bg-amber-100 text-black"
              }">
                ${hasQuiz ? `สอบแล้ว (${qScore}/3)` : "ยังไม่สอบ (0/3)"}
              </span>
            </div>

            <button
              type="button"
              class="w-full brutal-btn hover-arrow-shift bg-emerald-400 hover:bg-emerald-300 text-black py-2.5 px-4 rounded-xl text-xs sm:text-sm font-thai"
            >
              <span>เข้าสู่บทเรียนทีละขั้น (${stepCount} สเต็ป)</span>
              <svg class="w-4 h-4 arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </article>
      `;
    })
    .join("");

  grid.querySelectorAll("[data-open-unit]").forEach((card) => {
    card.addEventListener("click", () => {
      const uid = Number(card.getAttribute("data-open-unit"));
      openUnitReader(uid, 0);
    });
  });
}

/* ============================================================================
   8. VIEW 2: STEP-BY-STEP PAGINATED UNIT READER
   ============================================================================ */
function openUnitReader(unitId, stepIndex = 0) {
  const unit = (window.COURSE_UNITS || []).find((u) => u.id === Number(unitId));
  if (!unit) return;

  appState.activeUnitId = unit.id;
  appState.activeStepIndex = Math.max(0, Math.min(3, Number(stepIndex) || 0));

  switchView("unit-step");
  renderCurrentUnitStep();
}

function renderCurrentUnitStep() {
  const unit = (window.COURSE_UNITS || []).find((u) => u.id === Number(appState.activeUnitId));
  if (!unit) return;

  const contentSteps = Array.isArray(unit.steps) ? unit.steps : [];
  const totalSteps = 4;
  const sIdx = appState.activeStepIndex;

  const isRead = appState.readUnits.includes(unit.id);
  const isInteracted = appState.interactedUnits.includes(unit.id) || isRead;

  const codeEl = document.getElementById("reader-unit-code");
  const counterEl = document.getElementById("reader-step-counter");
  const modNameEl = document.getElementById("reader-module-name");
  const titleEl = document.getElementById("reader-unit-title");
  const tabsEl = document.getElementById("reader-step-tabs");
  const stageEl = document.getElementById("reader-step-stage");
  const prevBtn = document.getElementById("reader-prev-btn");
  const nextLabel = document.getElementById("reader-next-label");
  const markReadBtn = document.getElementById("reader-mark-read-btn");
  const centerStatus = document.getElementById("reader-center-status");

  const modNameText = unit.moduleName || unit.moduleTitle || `หมวดที่ ${unit.moduleId}`;
  const subText = unit.summary || unit.subtitle || "";

  if (codeEl) codeEl.textContent = unit.code;
  if (counterEl) counterEl.textContent = `STEP ${sIdx + 1} / ${totalSteps}`;
  if (modNameEl) modNameEl.textContent = `${modNameText} • ${subText}`;
  if (titleEl) titleEl.textContent = `${unit.code}: ${unit.title}`;

  const stepMeta = [
    { idx: 0, code: "STEP 01", label: "แนวคิดหลัก" },
    { idx: 1, code: "STEP 02", label: "เจาะลึก / วิธีคำนวณ" },
    { idx: 2, code: "STEP 03", label: "ทดลองอุปกรณ์จำลอง" },
    { idx: 3, code: "STEP 04", label: "แบบทดสอบ 3 ข้อ" }
  ];

  if (tabsEl) {
    tabsEl.innerHTML = stepMeta
      .map((st) => {
        const active = st.idx === sIdx;
        return `
          <button
            type="button"
            data-step-tab="${st.idx}"
            class="brutal-btn ${
              active
                ? "bg-amber-300 text-black"
                : "bg-white text-black hover:bg-amber-100"
            } px-3 py-2 rounded-xl text-left flex flex-col items-start justify-center"
          >
            <span class="font-notch font-bold text-[10px] opacity-80">${st.code}</span>
            <span class="font-thai font-semibold text-xs truncate w-full">${st.label}</span>
          </button>
        `;
      })
      .join("");

    tabsEl.querySelectorAll("[data-step-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetIdx = Number(btn.getAttribute("data-step-tab"));
        appState.activeStepIndex = targetIdx;
        renderCurrentUnitStep();
      });
    });
  }

  if (stageEl) {
    if (sIdx === 0 || sIdx === 1) {
      const stepObj = contentSteps[sIdx] || contentSteps[0] || {
        badge: `STEP 0${sIdx + 1}`,
        title: unit.title,
        html: ""
      };
      stageEl.innerHTML = `
        <div class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
            <span class="font-notch font-bold text-xs bg-emerald-400 text-black px-3 py-1 rounded-lg border-2 border-black">
              ${stepObj.badge || `STEP 0${sIdx + 1}`}
            </span>
            <span class="font-thai text-xs theme-text-muted">
              เนื้อหาส่วนที่ ${sIdx + 1} จาก 2 (แบ่งย่อยอ่านสบายตา)
            </span>
          </div>

          <h3 class="font-thai font-bold text-xl sm:text-2xl">
            ${stepObj.title}
          </h3>

          <div class="font-thai text-sm sm:text-base leading-relaxed space-y-4">
            ${stepObj.html}
          </div>
        </div>

        <div class="mt-8 pt-4 border-t-2 border-dashed border-zinc-400 flex items-center justify-between text-xs font-thai theme-text-muted">
          <span>ศึกษาเนื้อหาหน้านี้เสร็จแล้ว กดปุ่ม "ถัดไป" ด้านล่างเพื่อไปต่อได้เลย</span>
          <span class="font-notch font-bold">PAGE ${sIdx + 1} OF 4</span>
        </div>
      `;
    } else if (sIdx === 2) {
      const simTitle = unit.simLabel || unit.simulatorTitle || "ห้องทดลองอุปกรณ์เสมือนจริง";
      stageEl.innerHTML = `
        <div class="space-y-5">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
            <div class="flex items-center gap-2">
              <span class="font-notch font-bold text-xs bg-amber-300 text-black px-3 py-1 rounded-lg border-2 border-black">
                STEP 03 • INTERACTIVE LAB SIMULATOR
              </span>
              <span class="font-thai font-bold text-sm sm:text-base">
                ${simTitle}
              </span>
            </div>

            <span id="lab-status-pill" class="font-thai text-xs font-semibold px-3 py-1 rounded-full border-2 border-black ${
              isInteracted ? "bg-emerald-300 text-black" : "bg-amber-200 text-black"
            }">
              ${
                isInteracted
                  ? "[UNLOCKED] ทดลองอุปกรณ์สำเร็จแล้ว"
                  : "[ACTION REQUIRED] คลิกทดลองใช้อุปกรณ์ด้านล่างเพื่อปลดล็อกคะแนน"
              }
            </span>
          </div>

          <div id="unit-simulator-mount"></div>
        </div>
      `;

      const simMount = stageEl.querySelector("#unit-simulator-mount");
      if (simMount && typeof window.renderUnitSimulator === "function") {
        window.renderUnitSimulator(unit.id, simMount);
      }
    } else if (sIdx === 3) {
      renderStep4Quiz(stageEl, unit, isInteracted);
    }
  }

  if (prevBtn) {
    prevBtn.disabled = sIdx === 0;
  }

  if (markReadBtn) {
    if (isRead) {
      markReadBtn.classList.remove("hidden");
      markReadBtn.disabled = true;
      markReadBtn.className =
        "brutal-btn bg-emerald-300 text-black px-4 py-3 rounded-xl text-xs sm:text-sm font-thai";
      markReadBtn.textContent = "[READ +1 OK] บันทึกคะแนนอ่านหน่วยนี้แล้ว";
    } else if (sIdx >= 2 && isInteracted) {
      markReadBtn.classList.remove("hidden");
      markReadBtn.disabled = false;
      markReadBtn.className =
        "brutal-btn bg-amber-300 text-black hover:bg-amber-200 px-4 py-3 rounded-xl text-xs sm:text-sm font-thai";
      markReadBtn.textContent = "ยืนยันการอ่านและรับ +1 คะแนน";
    } else {
      markReadBtn.classList.add("hidden");
    }
  }

  if (centerStatus) {
    if (sIdx === 0) {
      centerStatus.textContent = "ขั้นที่ 1/4: ศึกษาแนวคิดหลัก แล้วกดถัดไปเพื่อดูวิธีคำนวณและตัวอย่าง";
    } else if (sIdx === 1) {
      centerStatus.textContent = "ขั้นที่ 2/4: ดูขั้นตอน Step-by-Step แล้วกดถัดไปเพื่อทดลองใช้อุปกรณ์จำลอง";
    } else if (sIdx === 2) {
      centerStatus.textContent = isInteracted
        ? "ขั้นที่ 3/4: ทดลองอุปกรณ์แล้ว กดรับคะแนนอ่าน (+1) หรือกดถัดไปเพื่อทำควิซ"
        : "ขั้นที่ 3/4: ลองคลิกปุ่มหรือเลื่อนแถบในอุปกรณ์จำลองด้านบนอย่างน้อย 1 ครั้ง";
    } else {
      centerStatus.textContent = "ขั้นที่ 4/4: ตอบคำถาม 3 ข้อเพื่อเก็บคะแนนสอบประจำหน่วย (+3 คะแนน)";
    }
  }

  if (nextLabel) {
    if (sIdx < 3) {
      nextLabel.textContent = `ถัดไป (STEP ${sIdx + 2}/4)`;
    } else {
      nextLabel.textContent =
        unit.id < 15 ? `ไปหน่วยถัดไป (U${String(unit.id + 1).padStart(2, "0")})` : "กลับหน้าหลักสูตร";
    }
  }
}

function renderStep4Quiz(stageEl, unit, isInteracted) {
  const savedScore = Number(appState.quizScores[unit.id] || 0);

  if (!isInteracted) {
    stageEl.innerHTML = `
      <div class="my-auto text-center space-y-4 py-10">
        <div class="inline-block font-notch font-bold text-xs bg-amber-300 text-black px-3 py-1 rounded-lg border-2 border-black">
          QUIZ LOCKED • STEP 03 REQUIRED
        </div>
        <h3 class="font-thai font-bold text-xl sm:text-2xl">
          กรุณาทดลองใช้อุปกรณ์จำลองใน STEP 03 ก่อนทำแบบทดสอบ
        </h3>
        <p class="font-thai text-sm theme-text-muted max-w-md mx-auto">
          เพื่อให้เข้าใจหลักการทำงานจริงของอุปกรณ์และวิธีคำนวณ กรุณาย้อนกลับไปที่ STEP 03 แล้วลองกดปุ่มทดลองอย่างน้อย 1 ครั้ง ระบบจะปลดล็อกข้อสอบทั้ง 3 ข้อทันที
        </p>
        <div class="pt-2">
          <button
            type="button"
            id="jump-back-to-sim-btn"
            class="brutal-btn bg-emerald-400 text-black hover:bg-emerald-300 px-6 py-3 rounded-xl text-sm font-thai"
          >
            กลับไปทดลองอุปกรณ์ใน STEP 03
          </button>
        </div>
      </div>
    `;
    stageEl.querySelector("#jump-back-to-sim-btn")?.addEventListener("click", () => {
      appState.activeStepIndex = 2;
      renderCurrentUnitStep();
    });
    return;
  }

  stageEl.innerHTML = `
    <div class="space-y-5">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-3">
        <div class="flex items-center gap-2">
          <span class="font-notch font-bold text-xs bg-amber-300 text-black px-3 py-1 rounded-lg border-2 border-black">
            STEP 04 • UNIT QUIZ (3 QUESTIONS)
          </span>
          <h3 class="font-thai font-bold text-lg sm:text-xl">
            แบบทดสอบท้าย ${unit.code} (ข้อละ 1 คะแนน)
          </h3>
        </div>
        <span id="quiz-unit-score-badge" class="font-notch font-bold text-xs bg-emerald-300 text-black px-3 py-1 rounded-lg border-2 border-black">
          BEST SCORE: ${savedScore} / 3 PTS
        </span>
      </div>

      <div id="unit-quiz-questions" class="space-y-4">
        ${(unit.quiz || [])
          .map(
            (q, qIdx) => `
          <div class="calc-step-box rounded-2xl p-4 sm:p-5 space-y-3" data-q-block="${qIdx}">
            <p class="font-thai font-bold text-sm sm:text-base">
              ข้อที่ ${qIdx + 1}: ${q.q}
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              ${q.options
                .map(
                  (optText, optIdx) => `
                <button
                  type="button"
                  data-q-idx="${qIdx}"
                  data-opt-idx="${optIdx}"
                  class="quiz-option-btn brutal-btn bg-white text-black px-3.5 py-2.5 rounded-xl font-thai text-xs sm:text-sm text-left justify-start"
                >
                  <span class="font-notch font-bold bg-amber-200 text-black px-2 py-0.5 rounded border border-black text-xs shrink-0">
                    ${["A", "B", "C", "D"][optIdx]}
                  </span>
                  <span>${optText}</span>
                </button>
              `
                )
                .join("")}
            </div>
            <div id="quiz-explain-${qIdx}" class="hidden rounded-xl p-3 font-thai text-xs sm:text-sm border-2 border-black"></div>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div id="unit-quiz-summary" class="font-thai text-sm font-semibold">
          เลือกคำตอบให้ครบทั้ง 3 ข้อ แล้วกดปุ่ม "ส่งคำตอบตรวจคะแนน"
        </div>
        <button
          id="submit-unit-quiz-btn"
          type="button"
          class="brutal-btn bg-emerald-400 text-black hover:bg-emerald-300 px-6 py-3 rounded-2xl text-sm sm:text-base font-thai"
        >
          ส่งคำตอบตรวจคะแนน (+3 คะแนน)
        </button>
      </div>
    </div>
  `;

  const selectedAnswers = {};
  stageEl.querySelectorAll(".quiz-option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const qIdx = Number(btn.getAttribute("data-q-idx"));
      const optIdx = Number(btn.getAttribute("data-opt-idx"));
      selectedAnswers[qIdx] = optIdx;

      stageEl.querySelectorAll(`.quiz-option-btn[data-q-idx="${qIdx}"]`).forEach((b) => {
        b.classList.remove("selected", "correct", "wrong");
      });
      btn.classList.add("selected");
    });
  });

  const submitBtn = stageEl.querySelector("#submit-unit-quiz-btn");
  submitBtn?.addEventListener("click", () => {
    const questions = unit.quiz || [];
    if (Object.keys(selectedAnswers).length < questions.length) {
      showToast("กรุณาเลือกคำตอบให้ครบทั้ง 3 ข้อก่อนส่งตรวจคะแนน", "warning");
      return;
    }

    let correctCount = 0;
    questions.forEach((q, qIdx) => {
      const picked = selectedAnswers[qIdx];
      const isCorrect = picked === q.answer;
      if (isCorrect) correctCount += 1;

      stageEl.querySelectorAll(`.quiz-option-btn[data-q-idx="${qIdx}"]`).forEach((b) => {
        const oIdx = Number(b.getAttribute("data-opt-idx"));
        b.classList.remove("selected", "correct", "wrong");
        if (oIdx === q.answer) {
          b.classList.add("correct");
        } else if (oIdx === picked && !isCorrect) {
          b.classList.add("wrong");
        }
      });

      const explainEl = stageEl.querySelector(`#quiz-explain-${qIdx}`);
      if (explainEl) {
        explainEl.className = `rounded-xl p-3 font-thai text-xs sm:text-sm border-2 border-black ${
          isCorrect ? "bg-emerald-200 text-black" : "bg-red-200 text-black"
        }`;
        explainEl.innerHTML = isCorrect
          ? `<strong>[CORRECT +1] ถูกต้อง:</strong> ${q.explain}`
          : `<strong>[INCORRECT] คำตอบที่ถูกคือข้อ ${["A", "B", "C", "D"][q.answer]}:</strong> ${q.explain}`;
      }
    });

    if (!appState.readUnits.includes(unit.id)) {
      appState.readUnits.push(unit.id);
    }

    const prevBest = Number(appState.quizScores[unit.id] || 0);
    appState.quizScores[unit.id] = Math.max(prevBest, correctCount);

    saveStateToLocalStorage();
    renderNavQuickUnits();
    renderHomeSyllabus();
    renderLessonsCatalog();
    updateAllScoreDashboards();

    const badgeEl = stageEl.querySelector("#quiz-unit-score-badge");
    if (badgeEl) {
      badgeEl.textContent = `BEST SCORE: ${appState.quizScores[unit.id]} / 3 PTS`;
    }

    const summaryEl = stageEl.querySelector("#unit-quiz-summary");
    if (summaryEl) {
      summaryEl.innerHTML = `<span class="bg-emerald-300 text-black px-3 py-1 rounded-lg border-2 border-black">ตรวจคำตอบแล้ว: ทำได้ ${correctCount} / 3 คะแนน (บันทึกคะแนนสูงสุด ${appState.quizScores[unit.id]}/3)</span>`;
    }

    showToast(
      `ทำแบบทดสอบ ${unit.code} ได้ ${correctCount}/3 คะแนน`,
      correctCount === 3 ? "success" : "info"
    );

    syncProgressToBackend(
      "QUIZ",
      `Quiz_Unit_${String(unit.id).padStart(2, "0")}`,
      correctCount,
      3,
      `ทำแบบทดสอบ ${unit.code} ได้ ${correctCount}/3 คะแนน`
    );
  });
}

window.onUnitSimulatorInteracted = function (unitId) {
  const id = Number(unitId);
  if (!appState.interactedUnits.includes(id)) {
    appState.interactedUnits.push(id);
    saveStateToLocalStorage();
  }

  const labPill = document.getElementById("lab-status-pill");
  if (labPill) {
    labPill.className =
      "font-thai text-xs font-semibold px-3 py-1 rounded-full border-2 border-black bg-emerald-300 text-black";
    labPill.textContent = "[UNLOCKED] ทดลองอุปกรณ์สำเร็จแล้ว สามารถกดรับคะแนนอ่าน (+1) หรือไปทำควิซได้เลย";
  }

  const markReadBtn = document.getElementById("reader-mark-read-btn");
  if (markReadBtn && !appState.readUnits.includes(id)) {
    markReadBtn.classList.remove("hidden");
    markReadBtn.disabled = false;
    markReadBtn.className =
      "brutal-btn bg-amber-300 text-black hover:bg-amber-200 px-4 py-3 rounded-xl text-xs sm:text-sm font-thai";
    markReadBtn.textContent = "ยืนยันการอ่านและรับ +1 คะแนน";
  }
};

function handleMarkUnitRead(unitId) {
  const id = Number(unitId);
  if (appState.readUnits.includes(id)) return;

  appState.readUnits.push(id);
  saveStateToLocalStorage();
  renderNavQuickUnits();
  renderHomeSyllabus();
  renderLessonsCatalog();
  renderCurrentUnitStep();
  updateAllScoreDashboards();

  showToast(`บันทึกคะแนนอ่านหน่วยที่ ${id} (+1 คะแนน) เรียบร้อยแล้ว`, "success");

  syncProgressToBackend(
    "READ_UNIT",
    `Read_Unit_${String(id).padStart(2, "0")}`,
    1,
    1,
    `ศึกษาและทดลองอุปกรณ์หน่วยที่ ${id} สำเร็จ (+1 คะแนน)`
  );
}

/* ============================================================================
   9. VIEW 3: ARCADE MINI-GAMES (4 GAMES = 40 POINTS)
   ============================================================================ */
function renderMiniGamesCards() {
  const grid = document.getElementById("games-grid");
  const sectionScore = document.getElementById("games-section-score");
  if (!grid || !Array.isArray(window.MINI_GAMES_META)) return;

  const { gameScore } = calculateScores();
  if (sectionScore) {
    sectionScore.textContent = `${gameScore} / 40 PTS`;
  }

  const tintClasses = [
    "module-card-tint-2",
    "module-card-tint-3",
    "module-card-tint-4",
    "module-card-tint-5"
  ];

  grid.innerHTML = window.MINI_GAMES_META.map((game, idx) => {
    const best = Number(appState.gameScores[game.id] || 0);
    return `
      <article class="brutal-card brutal-card-interactive ${tintClasses[idx % tintClasses.length]} rounded-3xl p-6 flex flex-col justify-between">
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2">
            <span class="font-notch font-bold text-xs px-3 py-1 rounded-lg border-2 border-black ${game.accentBg} text-black">
              ${game.moduleBadge}
            </span>
            <span class="font-notch font-bold text-xs px-3 py-1 rounded-lg border-2 border-black ${
              best === 10 ? "bg-emerald-400 text-black" : "bg-amber-200 text-black"
            }">
              BEST: ${best} / 10 PTS
            </span>
          </div>

          <div class="flex items-start gap-3.5 pt-1">
            <div class="w-14 h-14 rounded-2xl ${game.accentBg} text-black brutal-border brutal-shadow-sm flex items-center justify-center font-notch font-bold text-lg shrink-0">
              ${game.codeBadge || "GAME"}
            </div>
            <div>
              <h3 class="font-thai font-bold text-lg sm:text-xl leading-snug">
                ${game.title}
              </h3>
              <p class="font-thai text-xs sm:text-sm theme-text-muted mt-1">
                ${game.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div class="pt-5 mt-5 border-t-2 border-dashed border-zinc-400">
          <button
            type="button"
            data-launch-game="${game.id}"
            class="w-full brutal-btn hover-arrow-shift bg-amber-300 hover:bg-emerald-400 text-black py-3 px-4 rounded-2xl text-sm font-thai"
          >
            <span>เข้าเล่นเกมเก็บคะแนน (${best}/10 คะแนน)</span>
            <svg class="w-4 h-4 arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </article>
    `;
  }).join("");

  grid.querySelectorAll("[data-launch-game]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const gameId = btn.getAttribute("data-launch-game");
      openMiniGameStage(gameId);
    });
  });
}

function openMiniGameStage(gameId) {
  const gameMeta = (window.MINI_GAMES_META || []).find((g) => g.id === gameId);
  if (!gameMeta) return;

  const wrapper = document.getElementById("active-game-wrapper");
  const badgeEl = document.getElementById("game-stage-badge");
  const titleEl = document.getElementById("game-stage-title");
  const bodyEl = document.getElementById("game-stage-body");

  if (badgeEl) badgeEl.textContent = gameMeta.moduleBadge;
  if (titleEl) titleEl.textContent = gameMeta.title;

  if (wrapper) {
    wrapper.classList.remove("hidden");
    wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (bodyEl && typeof window.launchMiniGame === "function") {
    window.launchMiniGame(gameId, bodyEl, (earnedScore, noteText) => {
      const prevBest = Number(appState.gameScores[gameId] || 0);
      appState.gameScores[gameId] = Math.max(prevBest, Number(earnedScore) || 0);

      saveStateToLocalStorage();
      renderMiniGamesCards();
      updateAllScoreDashboards();

      showToast(
        `จบภารกิจ ${gameMeta.title} ได้ ${earnedScore}/10 คะแนน`,
        earnedScore >= 7 ? "success" : "info"
      );

      syncProgressToBackend(
        "MINIGAME",
        gameMeta.activityId,
        earnedScore,
        10,
        noteText || `${gameMeta.title}: ${earnedScore}/10`
      );
    });
  }
}

/* ============================================================================
   10. VIEW 4: PROGRESS DASHBOARD & MANDATORY CERTIFICATE COMPLETION GATE
   ============================================================================ */
function updateAllScoreDashboards() {
  const {
    readScore,
    quizScore,
    completedQuizzesCount,
    gameScore,
    totalScore,
    allUnitsRead,
    allQuizzesDone,
    scorePassed,
    certificateUnlocked
  } = calculateScores();

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(val);
  };
  const setWidth = (id, pct) => {
    const el = document.getElementById(id);
    if (el) el.style.width = `${Math.min(100, Math.max(0, pct))}%`;
  };

  // Navbar & Progress Bento
  setTxt("nav-total-score", totalScore);
  setTxt("dash-read-score", readScore);
  setTxt("dash-quiz-score", quizScore);
  setTxt("dash-game-score", gameScore);
  setTxt("dash-total-score", totalScore);

  setWidth("dash-read-bar", (readScore / 15) * 100);
  setWidth("dash-quiz-bar", (quizScore / 45) * 100);
  setWidth("dash-game-bar", (gameScore / 40) * 100);
  setWidth("dash-total-bar", totalScore);

  // Home Quick Summary Card
  setTxt("home-total-score-pill", `${totalScore} / 100 PTS`);
  setTxt("home-read-stat", `${readScore} / 15 หน่วย`);
  setTxt("home-quiz-stat", `${quizScore} / 45 คะแนน (${completedQuizzesCount}/15 หน่วย)`);
  setTxt("home-game-stat", `${gameScore} / 40 คะแนน`);

  // Update Home Continue Button Label
  const continueLabel = document.getElementById("home-continue-label");
  if (continueLabel) {
    let nextUnit = 1;
    for (let i = 1; i <= 15; i++) {
      if (!appState.readUnits.includes(i) || !Object.prototype.hasOwnProperty.call(appState.quizScores, i)) {
        nextUnit = i;
        break;
      }
    }
    if (allUnitsRead && allQuizzesDone) {
      continueLabel.textContent = "ทบทวนบทเรียน (เรียนครบทั้ง 15 หน่วยแล้ว)";
    } else if (readScore === 0 && completedQuizzesCount === 0) {
      continueLabel.textContent = "เริ่มเรียนหน่วยที่ 1 ทันที";
    } else {
      continueLabel.textContent = `เรียนต่อหน่วยที่ ${nextUnit} (U${String(nextUnit).padStart(2, "0")})`;
    }
  }

  // Certificate Preview Update
  setTxt("cert-student-name", appState.student.fullName || "ชื่อ-นามสกุลนักเรียน");
  setTxt(
    "cert-student-id",
    `รหัสนักศึกษา: ${appState.student.studentId || "-"} | บัญชี Google: ${appState.student.email || "-"}`
  );
  setTxt("cert-read-pts", `${readScore} / 15`);
  setTxt("cert-quiz-pts", `${quizScore} / 45`);
  setTxt("cert-game-pts", `${gameScore} / 40`);
  setTxt("cert-total-pts", `${totalScore} / 100`);

  const dateEl = document.getElementById("cert-issue-date");
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  // Render Mandatory 3-Requirement Checklist
  const reqGrid = document.getElementById("cert-requirements-grid");
  if (reqGrid) {
    const reqs = [
      {
        done: allUnitsRead,
        code: "REQ 01 • STUDY 15 UNITS",
        title: "1. เรียนและทดลองอุปกรณ์ครบ 15 หน่วย",
        detail: `สถานะปัจจุบัน: เรียนแล้ว ${readScore} / 15 หน่วย`
      },
      {
        done: allQuizzesDone,
        code: "REQ 02 • COMPLETE 15 QUIZZES",
        title: "2. ทำแบบทดสอบท้ายหน่วยครบทั้ง 15 หน่วย",
        detail: `สถานะปัจจุบัน: ส่งข้อสอบแล้ว ${completedQuizzesCount} / 15 หน่วย (${quizScore}/45 คะแนน)`
      },
      {
        done: scorePassed,
        code: "REQ 03 • PASSING SCORE 70+",
        title: "3. คะแนนรวมสุทธิตั้งแต่ 70 / 100 ขึ้นไป",
        detail: `สถานะปัจจุบัน: คะแนนรวม ${totalScore} / 100 คะแนน`
      }
    ];

    reqGrid.innerHTML = reqs
      .map(
        (r) => `
        <div class="brutal-card ${
          r.done ? "bg-emerald-200" : "bg-amber-100"
        } text-black rounded-2xl p-4 space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <span class="font-notch font-bold text-[11px] bg-zinc-950 text-white px-2 py-0.5 rounded">
              ${r.code}
            </span>
            <span class="font-notch font-bold text-xs px-2 py-0.5 rounded border border-black ${
              r.done ? "bg-emerald-400 text-black" : "bg-red-300 text-black"
            }">
              ${r.done ? "PASSED" : "INCOMPLETE"}
            </span>
          </div>
          <h4 class="font-thai font-bold text-sm sm:text-base">${r.title}</h4>
          <p class="font-thai text-xs">${r.detail}</p>
        </div>
      `
      )
      .join("");
  }

  const certPill = document.getElementById("dash-cert-pill");
  const certBanner = document.getElementById("cert-status-banner");
  const downloadBtn = document.getElementById("download-cert-btn");
  const lockedOverlay = document.getElementById("cert-locked-overlay");
  const lockedReason = document.getElementById("cert-locked-reason");

  if (certificateUnlocked) {
    if (certPill) {
      certPill.textContent = "CERT: UNLOCKED";
      certPill.className =
        "font-notch font-bold text-xs bg-emerald-400 text-black px-2.5 py-0.5 rounded border-2 border-black self-start";
    }
    if (certBanner) {
      certBanner.innerHTML = `<strong class="text-emerald-500">[PASSED] ยินดีด้วย คุณเรียนครบทั้ง 15 หน่วย ทำแบบทดสอบครบทุกหน่วย และได้คะแนนรวม ${totalScore}/100 คะแนน สามารถกดดาวน์โหลดเกียรติบัตร (.PNG) ได้ทันที</strong>`;
    }
    if (downloadBtn) {
      downloadBtn.disabled = false;
    }
    lockedOverlay?.classList.add("hidden");

    if (!appState.celebratedCertificate && typeof window.confetti === "function") {
      appState.celebratedCertificate = true;
      window.confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  } else {
    if (certPill) {
      certPill.textContent = "CERT: LOCKED";
      certPill.className =
        "font-notch font-bold text-xs bg-zinc-900 text-white px-2.5 py-0.5 rounded border-2 border-black self-start";
    }
    const missingList = [];
    if (!allUnitsRead) missingList.push(`เรียนบทเรียนอีก ${15 - readScore} หน่วย`);
    if (!allQuizzesDone) missingList.push(`ทำแบบทดสอบท้ายหน่วยอีก ${15 - completedQuizzesCount} หน่วย`);
    if (!scorePassed) missingList.push(`ทำคะแนนเพิ่มอีก ${70 - totalScore} คะแนน`);

    const reasonText = `สิ่งที่ต้องทำเพิ่มก่อนรับเกียรติบัตร: ต้อง${missingList.join(", ")}`;
    if (certBanner) {
      certBanner.textContent = reasonText;
    }
    if (lockedReason) {
      lockedReason.textContent = reasonText;
    }
    if (downloadBtn) {
      downloadBtn.disabled = true;
    }
    lockedOverlay?.classList.remove("hidden");
  }
}

async function downloadCertificateAsPng() {
  const { certificateUnlocked } = calculateScores();
  if (!certificateUnlocked) {
    showToast("กรุณาเรียนและทำแบบทดสอบให้ครบทั้ง 15 หน่วย (และได้ 70 คะแนนขึ้นไป) ก่อนดาวน์โหลดเกียรติบัตร", "warning");
    return;
  }

  const certNode = document.getElementById("certificate-render-node");
  if (!certNode) return;

  if (typeof window.html2canvas !== "function") {
    showToast("กำลังโหลดไลบรารีสร้างรูปภาพ กรุณาลองอีกครั้งในอีกสักครู่", "warning");
    return;
  }

  try {
    showToast("กำลังสร้างไฟล์ภาพเกียรติบัตรความละเอียดสูง (.PNG)...", "info");
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const canvas = await window.html2canvas(certNode, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#FEFCE8"
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    const safeId = (appState.student.studentId || "Student").replace(/[^a-zA-Z0-9_-]/g, "");
    link.download = `Certificate_CDTI_21901-2017_${safeId}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (typeof window.confetti === "function") {
      window.confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
    }
    showToast("ดาวน์โหลดเกียรติบัตร (.PNG) สำเร็จแล้ว", "success");
  } catch (err) {
    console.error("Certificate export error:", err);
    showToast("เกิดข้อผิดพลาดในการสร้างไฟล์รูปภาพ", "error");
  }
}

/* ============================================================================
   11. GOOGLE SHEETS CLOUD SYNC (Text/Plain CORS-Safe)
   ============================================================================ */
function setSyncIndicator(state, text) {
  const dot = document.getElementById("sync-status-dot");
  const label = document.getElementById("sync-status-text");
  if (label) label.textContent = text;
  if (!dot) return;

  dot.className = "w-2.5 h-2.5 rounded-full border border-black ";
  if (state === "syncing") {
    dot.className += "bg-amber-400";
  } else if (state === "ok") {
    dot.className += "bg-emerald-500";
  } else {
    dot.className += "bg-zinc-400";
  }
}

async function syncProgressToBackend(activityType, activityId, scoreEarned, maxScore, detailNote) {
  const scores = calculateScores();

  if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.includes("YOUR_DEPLOYMENT_ID_HERE")) {
    setSyncIndicator("local", "บันทึกในเครื่องแล้ว (รอผูก Sheets)");
    return;
  }

  if (!isStudentAuthenticated()) return;

  setSyncIndicator("syncing", "กำลังซิงก์ข้อมูลขึ้นคลาวด์...");

  const payload = {
    action: "syncProgress",
    studentId: appState.student.studentId,
    fullName: appState.student.fullName,
    email: appState.student.email,
    readUnits: appState.readUnits,
    readScore: scores.readScore,
    quizScore: scores.quizScore,
    gameScore: scores.gameScore,
    quizScoresMap: appState.quizScores,
    gameScoresMap: appState.gameScores,
    certificateUnlocked: scores.certificateUnlocked,
    activityLog: {
      activityType: activityType || "SYNC",
      activityId: activityId || "Progress_Sync",
      scoreEarned: Number(scoreEarned) || 0,
      maxScore: Number(maxScore) || 0,
      detailNote: detailNote || ""
    }
  };

  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data && data.status === "success") {
      applyRestoredCloudData(data.data);
      setSyncIndicator("ok", "ซิงก์ Google Sheets สำเร็จ");
    } else {
      setSyncIndicator("local", "บันทึกในเครื่องแล้ว");
    }
  } catch (err) {
    console.warn("GAS sync warning:", err);
    setSyncIndicator("local", "โหมดออฟไลน์ (บันทึกในเครื่อง)");
  }
}

async function fetchStudentProgressFromBackend(silent = false) {
  if (!GAS_WEB_APP_URL || GAS_WEB_APP_URL.includes("YOUR_DEPLOYMENT_ID_HERE")) {
    return false;
  }
  if (!appState.student.email && !appState.student.studentId) {
    return false;
  }

  try {
    setSyncIndicator("syncing", "กำลังดึงความคืบหน้าเดิม...");
    const url = `${GAS_WEB_APP_URL}?action=getProgress&studentId=${encodeURIComponent(
      appState.student.studentId
    )}&email=${encodeURIComponent(appState.student.email)}`;

    const res = await fetch(url, { method: "GET" });
    const json = await res.json();
    if (json && json.status === "success" && json.found && json.data) {
      applyRestoredCloudData(json.data);
      setSyncIndicator("ok", "กู้คืนความคืบหน้าจากคลาวด์แล้ว");
      if (!silent) {
        showToast("โหลดความคืบหน้าเดิมจากบัญชี Google ของคุณเรียบร้อยแล้ว", "success");
      }
      return true;
    } else {
      setSyncIndicator("ok", "บัญชีใหม่ พร้อมบันทึกความคืบหน้า");
      return false;
    }
  } catch (_) {
    setSyncIndicator("local", "ใช้งานโหมดบันทึกในเครื่อง");
    return false;
  }
}

function applyRestoredCloudData(cloudData) {
  if (!cloudData) return;

  if (Array.isArray(cloudData.readUnits)) {
    appState.readUnits = Array.from(
      new Set([...appState.readUnits, ...cloudData.readUnits.map(Number).filter((n) => n >= 1 && n <= 15)])
    );
    appState.interactedUnits = Array.from(
      new Set([...appState.interactedUnits, ...appState.readUnits])
    );
  }

  if (cloudData.quizScoresMap && typeof cloudData.quizScoresMap === "object") {
    Object.entries(cloudData.quizScoresMap).forEach(([k, val]) => {
      const cur = Number(appState.quizScores[k] || 0);
      appState.quizScores[k] = Math.max(cur, Number(val) || 0);
    });
  }

  if (cloudData.gameScoresMap && typeof cloudData.gameScoresMap === "object") {
    Object.entries(cloudData.gameScoresMap).forEach(([k, val]) => {
      const cur = Number(appState.gameScores[k] || 0);
      appState.gameScores[k] = Math.max(cur, Number(val) || 0);
    });
  }

  saveStateToLocalStorage();
  renderNavQuickUnits();
  renderHomeSyllabus();
  renderLessonsCatalog();
  renderMiniGamesCards();
  updateAllScoreDashboards();
}

/* ============================================================================
   12. GLOBAL EVENT BINDINGS
   ============================================================================ */
function bindGlobalEvents() {
  // 1. Theme Toggle (Dark / Light)
  document.getElementById("theme-toggle-btn")?.addEventListener("click", toggleTheme);

  // 2. Mandatory Login Form Submit
  const loginForm = document.getElementById("student-login-form");
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const emailEl = document.getElementById("student-email-input");
    const idEl = document.getElementById("student-id-input");
    const nameEl = document.getElementById("student-name-input");
    const submitBtn = document.getElementById("login-submit-btn");

    const email = (emailEl ? emailEl.value : "").trim().toLowerCase();
    const studentId = (idEl ? idEl.value : "").trim();
    const fullName = (nameEl ? nameEl.value : "").trim();

    if (!email || !email.includes("@")) {
      showGateStatus("กรุณากรอกอีเมลบัญชี Google (เช่น student@cdti.ac.th หรือ gmail.com) ให้ถูกต้อง", "error");
      return;
    }
    if (!studentId || !fullName) {
      showGateStatus("กรุณากรอกรหัสนักศึกษาและชื่อ-นามสกุลจริงให้ครบถ้วน", "error");
      return;
    }

    appState.student = { email, studentId, fullName };
    saveStateToLocalStorage();

    if (submitBtn) submitBtn.disabled = true;
    showGateStatus("กำลังตรวจสอบบัญชี Google และโหลดความคืบหน้าจากระบบคลาวด์...", "info");

    await fetchStudentProgressFromBackend(true);
    await syncProgressToBackend("LOGIN", "Auth_Google_Login", 0, 0, "เข้าสู่ระบบด้วยบัญชี Google");

    if (submitBtn) submitBtn.disabled = false;
    enforceMandatoryAuthGate();
    switchView("home");
    showToast(`ยินดีต้อนรับ ${fullName} เข้าสู่รายวิชา 21901-2017`, "success");
  });

  // 3. Home Continue / Start Learning Button
  document.getElementById("home-continue-btn")?.addEventListener("click", () => {
    let targetUnit = 1;
    for (let i = 1; i <= 15; i++) {
      if (!appState.readUnits.includes(i) || !Object.prototype.hasOwnProperty.call(appState.quizScores, i)) {
        targetUnit = i;
        break;
      }
    }
    openUnitReader(targetUnit, 0);
  });

  // 4. Navbar Dropdown Toggle & Module Selection
  const dropdownWrapper = document.getElementById("nav-dropdown-wrapper");
  const dropdownTrigger = document.getElementById("nav-dropdown-trigger");

  dropdownTrigger?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleNavDropdown();
  });

  document.addEventListener("click", (e) => {
    if (dropdownWrapper && !dropdownWrapper.contains(e.target)) {
      toggleNavDropdown(true);
    }
  });

  document.querySelectorAll("[data-dropdown-module]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mod = btn.getAttribute("data-dropdown-module");
      toggleNavDropdown(true);
      selectModuleFilter(mod);
      switchView("lessons");
    });
  });

  // 5. Module Filter Pills inside Lessons View
  document.querySelectorAll("[data-module-pill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const mod = btn.getAttribute("data-module-pill");
      selectModuleFilter(mod);
    });
  });

  // 6. View Switchers (Home, Brand Logo, Games Tab, Progress Tab, Score Pill)
  document.querySelectorAll("[data-switch-view]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetView = btn.getAttribute("data-switch-view");
      const targetMod = btn.getAttribute("data-select-module");
      if (targetMod) selectModuleFilter(targetMod);
      switchView(targetView);
    });
  });

  // 7. Step-by-Step Reader Navigation Buttons
  document.getElementById("back-to-lessons-btn")?.addEventListener("click", () => {
    switchView("lessons");
  });

  document.getElementById("reader-prev-btn")?.addEventListener("click", () => {
    if (appState.activeStepIndex > 0) {
      appState.activeStepIndex -= 1;
      renderCurrentUnitStep();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  document.getElementById("reader-next-btn")?.addEventListener("click", () => {
    if (appState.activeStepIndex < 3) {
      appState.activeStepIndex += 1;
      renderCurrentUnitStep();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (appState.activeUnitId < 15) {
        openUnitReader(appState.activeUnitId + 1, 0);
      } else {
        switchView("lessons");
      }
    }
  });

  document.getElementById("reader-mark-read-btn")?.addEventListener("click", () => {
    handleMarkUnitRead(appState.activeUnitId);
  });

  // 8. Close Active Game Stage
  document.getElementById("close-game-stage-btn")?.addEventListener("click", () => {
    const wrapper = document.getElementById("active-game-wrapper");
    const bodyEl = document.getElementById("game-stage-body");
    wrapper?.classList.add("hidden");
    if (bodyEl) bodyEl.innerHTML = "";
  });

  // 9. Profile & Sync Controls
  document.getElementById("sync-now-btn")?.addEventListener("click", async () => {
    showToast("กำลังซิงก์ความคืบหน้ากับ Google Sheets...", "info");
    await syncProgressToBackend("MANUAL_SYNC", "Manual_Cloud_Sync", 0, 0, "กดซิงก์ความคืบหน้าด้วยตนเอง");
    showToast("ซิงก์ข้อมูลเรียบร้อยแล้ว", "success");
  });

  document.getElementById("switch-account-btn")?.addEventListener("click", () => {
    const authGate = document.getElementById("auth-gate");
    authGate?.classList.remove("hidden");
  });

  // 10. Certificate PNG Download
  document.getElementById("download-cert-btn")?.addEventListener("click", () => {
    downloadCertificateAsPng();
  });
}

/* ============================================================================
   13. TOAST NOTIFICATION HELPER (Zero-Emoji)
   ============================================================================ */
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const bgMap = {
    success: "bg-emerald-300 text-black",
    warning: "bg-amber-300 text-black",
    error: "bg-red-300 text-black",
    info: "bg-sky-200 text-black"
  };

  const badgeMap = {
    success: "OK",
    warning: "NOTICE",
    error: "ERROR",
    info: "INFO"
  };

  const toast = document.createElement("div");
  toast.className = `pointer-events-auto brutal-border brutal-shadow-sm rounded-2xl px-4 py-3 font-thai text-xs sm:text-sm flex items-center gap-2.5 modal-animate-in ${
    bgMap[type] || bgMap.info
  }`;
  toast.innerHTML = `
    <span class="font-notch font-bold text-[11px] bg-zinc-950 text-white px-2 py-0.5 rounded shrink-0">${
      badgeMap[type] || "INFO"
    }</span>
    <span class="font-medium">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";
    toast.style.transition = "opacity 0.2s ease, transform 0.2s ease";
    setTimeout(() => toast.remove(), 220);
  }, 3400);
}
