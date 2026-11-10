/**
 * ============================================================================
 * js/ui.js — Shared UI helpers for the Glass Grid design system
 *   1. AppUtils.icon()            ไอคอน SVG จาก sprite ใน index.html
 *   2. AppUtils.renderLessonCard() การ์ดบทเรียนกระจกฝ้า (ใช้ทั้งหน้าแรกและหน้ารวมบทเรียน)
 *   3. GlassGrid                  กริดกระจกขอบบนขั้นบันไดแบบ seeded random
 *   4. Hero cursor glow           แสงม่วงเรืองตามเคอร์เซอร์
 *   5. Bookmarks                  บันทึกหน่วยที่สนใจ (เก็บในเครื่อง ไม่ซิงก์ขึ้นเซิร์ฟเวอร์)
 * ============================================================================
 */

(function () {
  const CFG = window.APP_CONFIG;
  const Utils = window.AppUtils;

  /* ==========================================================================
     1. ICONS
     ========================================================================== */

  function icon(name, extraClass) {
    const cls = extraClass ? `icon ${extraClass}` : "icon";
    return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#icon-${name}"></use></svg>`;
  }

  /* ==========================================================================
     2. LESSON CARD
     ========================================================================== */

  function getUnitState(unitNo, unitMap) {
    const prog = (unitMap && unitMap[unitNo]) || {};
    const unitData = window.CURRICULUM_DATA && window.CURRICULUM_DATA[unitNo];
    const available = Boolean(unitData);
    const totalSteps = unitData ? unitData.steps.length : 0;
    const passed = Boolean(prog.is_passed);
    const contentRead = Boolean(prog.is_content_read || passed);
    const attempts = Number(prog.attempts_count || 0);
    const stepsDone = Math.min(totalSteps, contentRead ? totalSteps : Number(prog.steps_completed || 0));

    let statusClass = "is-neutral";
    let statusLabel = available ? "ยังไม่เริ่ม" : "รออัปเดตเนื้อหา";
    let statusIcon = "";
    if (passed) {
      statusClass = "is-pass";
      statusLabel = `เรียนจบ (${prog.best_quiz_score}/10)`;
      statusIcon = icon("check");
    } else if (attempts > 0) {
      statusClass = "is-warn";
      statusLabel = `สูงสุด ${prog.best_quiz_score}/10`;
    } else if (contentRead) {
      statusClass = "is-info";
      statusLabel = "เรียนครบแล้ว พร้อมทำแบบทดสอบ";
    } else if (stepsDone > 0) {
      statusClass = "is-warn";
      statusLabel = `กำลังเรียน (${stepsDone}/${totalSteps} ขั้น)`;
    }

    return { prog, available, totalSteps, passed, contentRead, attempts, stepsDone, statusClass, statusLabel, statusIcon };
  }

  /**
   * @param {object} unit    รายการจาก APP_CONFIG.UNITS_METADATA
   * @param {object} unitMap ความคืบหน้ารายหน่วยของผู้เรียน
   * @param {object} opts    { mode: "home" | "lessons", selected: boolean }
   */
  function renderLessonCard(unit, unitMap, opts = {}) {
    const esc = Utils.escapeHtml;
    const st = getUnitState(unit.no, unitMap);
    const openAttr = opts.mode === "lessons" ? "data-enter-unit" : "data-open-unit";
    const actionLabel = st.passed || st.contentRead ? "ทบทวน" : st.stepsDone > 0 ? "เรียนต่อ" : "เข้าเรียน";

    const metaHtml =
      st.attempts > 0 && Number(st.prog.best_quiz_time_sec) > 0
        ? `${icon("clock")}<span>เวลาเร็วสุด ${Utils.formatDuration(st.prog.best_quiz_time_sec)}</span>`
        : st.available
        ? `${icon("book")}<span>${st.totalSteps} ขั้น</span><span class="dot-sep" aria-hidden="true"></span><span>แบบทดสอบ 10 ข้อ</span>`
        : `<span>รออัปเดตเนื้อหา</span>`;

    const quizBtn =
      opts.mode === "lessons" && st.available && st.contentRead
        ? `<button type="button" class="btn-secondary btn-sm" data-start-unit-quiz="${unit.no}">ทำแบบทดสอบ</button>`
        : "";

    const bookmarked = Bookmarks.has(unit.no);

    return `
      <article class="lesson-card ${opts.selected ? "is-selected-unit" : ""}" data-unit-no="${unit.no}">
        <span class="lesson-card-number" aria-hidden="true">${String(unit.no).padStart(2, "0")}</span>
        <div class="lesson-card-top">
          <span class="unit-number-badge ${st.passed ? "is-done" : ""}">หมวด ${unit.moduleId}</span>
          <span class="status-pill ${st.statusClass}">${st.statusIcon}${esc(st.statusLabel)}</span>
          ${bookmarked ? `<span class="status-pill is-info" title="บันทึกไว้">${icon("bookmark", "icon-fill")}<span class="sr-only">บันทึกไว้</span></span>` : ""}
        </div>
        <h3 class="lesson-card-title">
          <button type="button" class="lesson-card-link" ${openAttr}="${unit.no}">
            หน่วยที่ ${unit.no}: ${Utils.formatUnitTitleHtml(unit.title)}
          </button>
        </h3>
        <p class="lesson-card-desc">${esc(unit.subtitle)}</p>
        <div class="lesson-card-foot">
          <span class="lesson-card-meta">${metaHtml}</span>
          <div class="lesson-card-actions">
            ${quizBtn}
            <button type="button" class="btn-primary btn-sm" ${openAttr}="${unit.no}" aria-label="${actionLabel}หน่วยที่ ${unit.no}">
              <span>${actionLabel}</span>
              ${icon("arrow-right", "icon-nudge-right")}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  /* ==========================================================================
     3. GLASS GRID (SEEDED STAIRCASE)
     ========================================================================== */

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const GLASS_SEED = 21901;
  const GAP = 2;

  function buildGlassGrid(gridEl) {
    const zone = gridEl.parentElement;
    if (!zone) return;
    const width = zone.clientWidth;
    const height = zone.clientHeight;
    if (!width || !height) return;

    const cols = window.matchMedia("(max-width: 639px)").matches ? 6 : 10;
    const tile = (width - GAP * (cols - 1)) / cols;
    const rows = Math.ceil(height / (tile + GAP)) + 1;
    const key = `${cols}x${rows}`;
    if (gridEl.dataset.layout === key) return;
    gridEl.dataset.layout = key;
    gridEl.style.setProperty("--glass-cols", String(cols));

    // ความสูงขั้นบันไดของแต่ละคอลัมน์ สุ่มแบบ seed คงที่ จึงได้รูปเดิมทุกครั้งที่โหลด
    const rand = mulberry32(GLASS_SEED + cols);
    const offsets = [];
    for (let c = 0; c < cols; c++) offsets.push(Math.floor(rand() * 4));
    const holes = new Set();
    for (let c = 0; c < cols; c++) {
      if (rand() < 0.3) holes.add(`${offsets[c] + 1}:${c}`);
    }

    const waveCap = 18;
    let html = "";
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isVoid = r < offsets[c] || holes.has(`${r}:${c}`);
        const isEdge = !isVoid && r <= offsets[c] + 2;
        const wave = Math.min(waveCap, rows - 1 - r);
        html += `<span class="glass-tile${isVoid ? " is-void" : ""}${isEdge ? " is-edge" : ""}" style="--wave:${wave}"></span>`;
      }
    }
    gridEl.innerHTML = html;
  }

  function initGlassGrids() {
    const grids = document.querySelectorAll(".glass-grid");
    if (!grids.length) return;
    grids.forEach((g) => buildGlassGrid(g));

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", () => grids.forEach((g) => buildGlassGrid(g)));
      return;
    }
    let raf = 0;
    const ro = new ResizeObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        grids.forEach((g) => buildGlassGrid(g));
      });
    });
    grids.forEach((g) => g.parentElement && ro.observe(g.parentElement));
  }

  /* ==========================================================================
     4. HERO CURSOR GLOW
     ========================================================================== */

  function initHeroGlow() {
    const hero = document.getElementById("home-hero");
    if (!hero) return;
    hero.addEventListener(
      "pointermove",
      (e) => {
        if (document.documentElement.getAttribute("data-motion") === "reduced") return;
        if (e.pointerType === "touch") return;
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty("--mx", `${(e.clientX - rect.left).toFixed(1)}px`);
        hero.style.setProperty("--my", `${(e.clientY - rect.top).toFixed(1)}px`);
      },
      { passive: true }
    );
  }

  /* ==========================================================================
     5. BOOKMARKS (LOCAL ONLY)
     ========================================================================== */

  const Bookmarks = {
    _key() {
      const user = window.AuthManager && window.AuthManager.getCurrentUser && window.AuthManager.getCurrentUser();
      return `cdti_21901_bookmarks_${user && user.student_id ? user.student_id : "guest"}`;
    },
    _read() {
      try {
        const raw = localStorage.getItem(this._key());
        const arr = raw ? JSON.parse(raw) : [];
        return Array.isArray(arr) ? arr.map(Number).filter((n) => n >= 1 && n <= CFG.TOTAL_UNITS) : [];
      } catch (e) {
        return [];
      }
    },
    has(unitNo) {
      return this._read().includes(Number(unitNo));
    },
    toggle(unitNo) {
      const no = Number(unitNo);
      const list = this._read();
      const idx = list.indexOf(no);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(no);
      try {
        localStorage.setItem(this._key(), JSON.stringify(list));
      } catch (e) {}
      return idx < 0;
    }
  };

  Utils.icon = icon;
  Utils.getUnitState = getUnitState;
  Utils.renderLessonCard = renderLessonCard;
  window.Bookmarks = Bookmarks;
  window.GlassGrid = { refresh: () => document.querySelectorAll(".glass-grid").forEach((g) => buildGlassGrid(g)) };

  function init() {
    initGlassGrids();
    initHeroGlow();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
