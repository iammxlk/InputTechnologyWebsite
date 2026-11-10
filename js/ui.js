/**
 * ============================================================================
 * js/ui.js — Shared UI helpers for the Glass Grid design system
 *   1. AppUtils.icon()            ไอคอน SVG จาก sprite ใน index.html
 *   2. AppUtils.renderLessonCard() การ์ดบทเรียนกระจกฝ้า (ใช้ทั้งหน้าแรกและหน้ารวมบทเรียน)
 *   3. GlassGrid                  กริดกระจกขอบบนขั้นบันไดแบบ seeded random
 *   4. Motion polish              เล่น intro ครั้งเดียว, แสงตามเคอร์เซอร์, แสงใต้กระจก, การ์ดเอียงตามเมาส์
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
  const STAIR_ROWS = 5; // แถวบนที่มีขั้นบันได แถวถัดลงไปเต็มทุกช่อง

  function tileHtml(r, cols, offsets, holes) {
    let html = "";
    for (let c = 0; c < cols; c++) {
      const isVoid = r < offsets[c] || holes.has(`${r}:${c}`);
      const isEdge = !isVoid && r <= offsets[c] + 2;
      html += `<span class="glass-tile${isVoid ? " is-void" : ""}${isEdge ? " is-edge" : ""}" style="--wave:${Math.min(14, r)}"></span>`;
    }
    return html;
  }

  /**
   * สร้างกริดครั้งเดียว ถ้าพื้นที่สูงขึ้นภายหลัง (ฟอนต์โหลดเสร็จ, เนื้อหาเพิ่ม) จะเติมแถวต่อท้ายเท่านั้น
   * ไม่ล้างของเดิม จึงไม่มีการเล่นแอนิเมชันซ้ำจนดูเหมือนหน้าจอกระพริบ
   */
  function buildGlassGrid(gridEl) {
    const zone = gridEl.parentElement;
    if (!zone) return;
    const width = zone.clientWidth;
    const height = zone.clientHeight;
    if (!width || !height) return;

    const cols = window.matchMedia("(max-width: 639px)").matches ? 6 : 10;
    const tile = (width - GAP * (cols - 1)) / cols;
    const rowsNeeded = Math.ceil(height / (tile + GAP)) + 1;
    const state = gridEl.__grid || (gridEl.__grid = { cols: 0, rows: 0, offsets: [], holes: new Set() });

    if (state.cols !== cols) {
      const rand = mulberry32(GLASS_SEED + cols);
      state.offsets = [];
      for (let c = 0; c < cols; c++) state.offsets.push(Math.floor(rand() * 4));
      state.holes = new Set();
      for (let c = 0; c < cols; c++) {
        if (rand() < 0.3) state.holes.add(`${state.offsets[c] + 1}:${c}`);
      }
      state.cols = cols;
      state.rows = 0;
      gridEl.style.setProperty("--glass-cols", String(cols));
      gridEl.innerHTML = "";
    }

    if (rowsNeeded <= state.rows) return;
    let html = "";
    for (let r = state.rows; r < rowsNeeded; r++) html += tileHtml(r, cols, state.offsets, state.holes);
    gridEl.insertAdjacentHTML("beforeend", html);
    state.rows = rowsNeeded;
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
     4. MOTION POLISH: intro once, cursor glow, glass spotlight, card tilt
     ========================================================================== */

  const isReducedMotion = () => document.documentElement.getAttribute("data-motion") === "reduced";
  const canHover = () => window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  // แอนิเมชันเปิดตัวของหน้าแรกเล่นครั้งเดียวต่อการโหลดหน้า กลับมาหน้าแรกอีกครั้งจะไม่เล่นซ้ำ
  let introPlayed = false;
  function playHomeIntro() {
    if (introPlayed) return;
    introPlayed = true;
    const home = document.getElementById("view-home");
    if (!home || isReducedMotion()) return;
    home.classList.add("is-intro");
    setTimeout(() => home.classList.remove("is-intro"), 2200);
  }

  function trackPointer(el, onMove) {
    let raf = 0;
    let last = null;
    el.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType === "touch" || isReducedMotion()) return;
        last = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (last) onMove(last);
        });
      },
      { passive: true }
    );
  }

  function initHeroGlow() {
    const hero = document.getElementById("home-hero");
    if (!hero) return;
    trackPointer(hero, (e) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", `${(e.clientX - rect.left).toFixed(1)}px`);
      hero.style.setProperty("--my", `${(e.clientY - rect.top).toFixed(1)}px`);
    });
  }

  // แสงใต้กระจก: ช่องกระจกใกล้เคอร์เซอร์สว่างขึ้นเหมือนมีแสงส่องจากด้านหลัง
  function initGlassSpotlight() {
    document.querySelectorAll(".glass-zone").forEach((zone) => {
      trackPointer(zone, (e) => {
        const rect = zone.getBoundingClientRect();
        zone.style.setProperty("--gx", `${(e.clientX - rect.left).toFixed(1)}px`);
        zone.style.setProperty("--gy", `${(e.clientY - rect.top).toFixed(1)}px`);
        zone.classList.add("is-lit");
      });
      zone.addEventListener("pointerleave", () => zone.classList.remove("is-lit"));
    });
  }

  // การ์ดบทเรียนเอียงตามเคอร์เซอร์เล็กน้อย และมีแสงเงาวิ่งตามตำแหน่งเมาส์
  function initCardTilt() {
    if (!canHover()) return;
    let active = null;
    let raf = 0;
    let last = null;
    const reset = (card) => {
      card.style.removeProperty("--rx");
      card.style.removeProperty("--ry");
      card.classList.remove("is-tilting");
    };
    document.addEventListener(
      "pointermove",
      (e) => {
        if (isReducedMotion() || e.pointerType === "touch") return;
        const card = e.target.closest && e.target.closest(".lesson-card");
        if (active && active !== card) {
          reset(active);
          active = null;
        }
        if (!card) return;
        active = card;
        last = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (!active || !last) return;
          const rect = active.getBoundingClientRect();
          const px = (last.clientX - rect.left) / rect.width;
          const py = (last.clientY - rect.top) / rect.height;
          active.style.setProperty("--rx", `${((0.5 - py) * 5).toFixed(2)}deg`);
          active.style.setProperty("--ry", `${((px - 0.5) * 6).toFixed(2)}deg`);
          active.style.setProperty("--px", `${(px * 100).toFixed(1)}%`);
          active.style.setProperty("--py", `${(py * 100).toFixed(1)}%`);
          active.classList.add("is-tilting");
        });
      },
      { passive: true }
    );
    document.addEventListener("pointerleave", () => active && reset(active));
  }

  function initHeaderScrollState() {
    let ticking = false;
    const apply = () => {
      ticking = false;
      document.documentElement.classList.toggle("is-scrolled", (window.scrollY || 0) > 8);
    };
    window.addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(apply);
      },
      { passive: true }
    );
    apply();
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
  window.UiFx = { playHomeIntro };

  function init() {
    initGlassGrids();
    initHeroGlow();
    initGlassSpotlight();
    initCardTilt();
    initHeaderScrollState();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
