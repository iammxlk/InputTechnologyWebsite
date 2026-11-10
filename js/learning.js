/**
 * ============================================================================
 * js/learning.js — Bite-sized Step Reader & 10-Question Instant-Grading Timed Quiz
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * รองรับ:
 *   1. หน้ารวมบทเรียนทั้ง 16 หน่วย พร้อมตัวกรอง 4 หมวดหมู่
 *   2. ระบบอ่านเนื้อหาแบบย่อยทีละสเต็ป (Bite-sized Steps) พร้อมปุ่มถัดไป (Next)
 *   3. แบบทดสอบท้ายหน่วย 10 ข้อ ตรวจคำตอบทันที (Instant Grading) พร้อมจับเวลา
 *   4. เกณฑ์ผ่านร้อยละ 80 (8/10 คะแนน) และบันทึกคะแนน + เวลา (วินาที) อัตโนมัติทันที
 * ============================================================================
 */

(function () {
  const CFG = window.APP_CONFIG;
  const CHOICE_LABELS = ["ก", "ข", "ค", "ง"];

  let currentMode = "directory"; // "directory" | "reader" | "quiz" | "result"
  let activeUnitNo = 1;
  let moduleFilter = "all";

  // Reader state
  let currentStepIdx = 0;
  let maxStepReachedInSession = 1;

  // Quiz & Countdown state
  let quizState = null;
  let quizTimerId = null;
  let countdownTimerId = null;
  let countdownSecondsLeft = 5;

  /* ==========================================================================
     1. HELPERS & TIMER MANAGEMENT
     ========================================================================== */

  function hasUnitCurriculum(unitNo) {
    return Boolean(window.CURRICULUM_DATA && window.CURRICULUM_DATA[Number(unitNo)]);
  }

  function getUnitCurriculum(unitNo) {
    return (window.CURRICULUM_DATA && window.CURRICULUM_DATA[Number(unitNo)]) || null;
  }

  function getUnitMeta(unitNo) {
    return (
      CFG.UNITS_METADATA.find((u) => u.no === Number(unitNo)) || CFG.UNITS_METADATA[0]
    );
  }

  function stopCountdownTimer() {
    if (countdownTimerId) {
      clearInterval(countdownTimerId);
      countdownTimerId = null;
    }
  }

  function stopQuizTimer() {
    stopCountdownTimer();
    setQuizFocusMode(false);
    if (quizTimerId) {
      clearInterval(quizTimerId);
      quizTimerId = null;
    }
    if (quizState && quizState.questionStartedAtMs) {
      const deltaMs = Date.now() - quizState.questionStartedAtMs;
      quizState.accumulatedMs += Math.max(0, deltaMs);
      quizState.questionStartedAtMs = 0;
    }
  }

  function startQuizTimer() {
    stopQuizTimer();
    if (!quizState) return;
    quizState.questionStartedAtMs = Date.now();
    quizTimerId = setInterval(() => {
      updateQuizTimerDom();
    }, 250);
  }

  function getQuizElapsedSeconds() {
    if (!quizState) return 0;
    let totalMs = quizState.accumulatedMs;
    if (quizState.questionStartedAtMs) {
      totalMs += Math.max(0, Date.now() - quizState.questionStartedAtMs);
    }
    const answeredCount = quizState.answers.filter(Boolean).length;
    const rawSec = Math.round(totalMs / 1000);
    return Math.max(answeredCount > 0 ? 1 : 0, rawSec);
  }

  function updateQuizTimerDom() {
    const timerEl = document.getElementById("quiz-live-timer");
    if (!timerEl || !quizState) return;
    timerEl.textContent = window.AppUtils.formatDuration(getQuizElapsedSeconds());
  }

  function setQuizFocusMode(active) {
    if (active) {
      if (!document.body.classList.contains("is-quiz-active")) {
        document.body.classList.add("is-quiz-active");
        window.scrollTo({ top: 0, behavior: "auto" });
      }
    } else {
      document.body.classList.remove("is-quiz-active");
    }
  }

  function setReaderChrome(isReader) {
    document.body.classList.toggle("is-reader-open", Boolean(isReader));
    if (!isReader) closeTocDrawer(false);
  }

  function toggleLessonsContainers(isDirectory) {
    if (isDirectory) {
      setQuizFocusMode(false);
      setReaderChrome(false);
    }
    const dirShell = document.getElementById("lessons-directory-shell");
    const workspace = document.getElementById("lesson-workspace");
    if (dirShell) dirShell.classList.toggle("hidden", !isDirectory);
    if (workspace) workspace.classList.toggle("hidden", isDirectory);
  }

  /* ==========================================================================
     2. BACKGROUND PROGRESS SYNC (STEPS & QUIZ SUBMISSION)
     ========================================================================== */

  async function syncStepProgress(unitNo, stepsCompleted, isContentRead) {
    const user = window.AuthManager?.getCurrentUser();
    if (!user) return;

    // Immediately update in-memory AuthManager unitProgressMap so UI checks are instantaneous
    const unitMap = window.AuthManager.getUnitProgressMap();
    if (unitMap) {
      if (!unitMap[unitNo]) {
        unitMap[unitNo] = {
          unit_no: unitNo,
          steps_completed: stepsCompleted,
          is_content_read: Boolean(isContentRead),
          best_quiz_score: 0,
          best_quiz_time_sec: 0,
          is_passed: false,
          attempts_count: 0
        };
      } else {
        unitMap[unitNo].steps_completed = Math.max(
          Number(unitMap[unitNo].steps_completed || 0),
          stepsCompleted
        );
        if (isContentRead) {
          unitMap[unitNo].is_content_read = true;
        }
      }
    }

    try {
      const res = await window.BackendAPI.saveStepProgress({
        student_id: user.student_id,
        unit_no: unitNo,
        steps_completed: stepsCompleted,
        is_content_read: Boolean(isContentRead)
      });
      if (res && res.ok) {
        window.AuthManager.updateSessionData(res.user, res.unit_progress);
      }
    } catch (err) {
      // เงียบไว้หากเครือข่ายสะดุดชั่วคราว เพื่อไม่ขัดจังหวะการอ่าน
    }
  }

  /* ==========================================================================
     3. DIRECTORY VIEW (ALL 16 UNITS + MODULE FILTERS)
     ========================================================================== */

  function openDirectory(options = {}) {
    stopQuizTimer();
    currentMode = "directory";
    if (options.unitNo) {
      activeUnitNo = Math.max(1, Math.min(CFG.TOTAL_UNITS, Number(options.unitNo) || 1));
    }
    if (options.moduleFilter) {
      moduleFilter = options.moduleFilter;
      if (!options.unitNo) {
        if (moduleFilter === "all") {
          activeUnitNo = 1;
        } else {
          const modUnits = CFG.UNITS_METADATA.filter(
            (u) => String(u.moduleId) === String(moduleFilter)
          );
          if (modUnits.length > 0) {
            activeUnitNo = modUnits[0].no;
          }
        }
      }
    }
    toggleLessonsContainers(true);
    renderDirectory();
  }

  function renderDirectory() {
    const user = window.AuthManager?.getCurrentUser();
    if (!user) return;

    const unitMap = window.AuthManager.getUnitProgressMap() || {};
    const esc = window.AppUtils.escapeHtml;

    // Sync filter buttons active state
    document.querySelectorAll("[data-module-filter]").forEach((btn) => {
      btn.classList.toggle(
        "is-active",
        (btn.getAttribute("data-module-filter") || "all") === String(moduleFilter)
      );
    });

    const currentUnit = getUnitMeta(activeUnitNo);
    const currentMod = CFG.MODULES_SYLLABUS.find((m) => m.id === currentUnit.moduleId);
    const currentProg = unitMap[currentUnit.no] || {};
    const isPassed = Boolean(currentProg.is_passed);
    const isContentRead = Boolean(currentProg.is_content_read || isPassed);
    const isAvailable = hasUnitCurriculum(currentUnit.no);
    const unitData = getUnitCurriculum(currentUnit.no);
    const totalSteps = unitData ? unitData.steps.length : 5;
    const stepsDone = Math.min(
      totalSteps,
      isContentRead ? totalSteps : Number(currentProg.steps_completed || 0)
    );

    // 1. Selected Unit Banner
    const icon = window.AppUtils.icon;
    const st = window.AppUtils.getUnitState(currentUnit.no, unitMap);
    const bannerEl = document.getElementById("lessons-selected-unit-banner");
    if (bannerEl) {
      bannerEl.innerHTML = `
        <div class="selected-unit-banner-inner">
          <div class="selected-unit-copy">
            <div class="selected-unit-tags">
              <span class="unit-number-badge ${isPassed ? "is-done" : ""}">${esc(currentUnit.code)}</span>
              <span class="status-pill is-neutral is-wrap">${esc(currentMod ? currentMod.title : "")}</span>
              <span class="status-pill ${st.statusClass}">${st.statusIcon}${esc(st.statusLabel)}</span>
            </div>
            <h2 class="selected-unit-title">
              หน่วยที่ ${currentUnit.no}: ${window.AppUtils.formatUnitTitleHtml(currentUnit.title)}
            </h2>
            <p class="selected-unit-desc">${esc(currentUnit.subtitle)}</p>
          </div>

          <div class="btn-row">
            ${
              isAvailable
                ? `
                  ${
                    isContentRead
                      ? `<button type="button" class="btn-secondary" data-start-unit-quiz="${currentUnit.no}">ทำแบบทดสอบ (10 ข้อ)</button>`
                      : ""
                  }
                  <button type="button" class="btn-primary" data-enter-unit="${currentUnit.no}">
                    <span>${
                      isPassed || isContentRead
                        ? "ทบทวนเนื้อหาบทเรียน"
                        : stepsDone > 0
                        ? `เรียนต่อสเต็ปที่ ${Math.min(totalSteps, stepsDone + 1)}`
                        : "เริ่มเรียนเนื้อหาทีละสเต็ป"
                    }</span>
                    ${icon("arrow-right", "icon-nudge-right")}
                  </button>
                `
                : `<span class="text-muted">กำลังเตรียมข้อมูลเนื้อหาหน่วยนี้</span>`
            }
          </div>
        </div>
      `;
    }

    // 2. All Units Grid (16 Units)
    const gridEl = document.getElementById("lessons-units-grid");
    if (gridEl) {
      const filteredUnits =
        moduleFilter === "all"
          ? CFG.UNITS_METADATA
          : CFG.UNITS_METADATA.filter((u) => String(u.moduleId) === String(moduleFilter));

      gridEl.innerHTML = filteredUnits
        .map((u) =>
          window.AppUtils.renderLessonCard(u, unitMap, { mode: "lessons", selected: u.no === activeUnitNo })
        )
        .join("");
    }
  }

  /* ==========================================================================
     4. BITE-SIZED STEP READER MODE
     ========================================================================== */

  function openUnit(unitNo, startSubMode = "reader") {
    const targetNo = Math.max(1, Math.min(CFG.TOTAL_UNITS, Number(unitNo) || 1));
    activeUnitNo = targetNo;

    if (!hasUnitCurriculum(targetNo)) {
      openDirectory({ unitNo: targetNo });
      window.AppUtils?.showToast(
        `ไม่พบข้อมูลเนื้อหาของหน่วยที่ ${targetNo}`,
        "info"
      );
      return;
    }

    stopQuizTimer();
    const unitData = getUnitCurriculum(targetNo);
    const unitMap = window.AuthManager?.getUnitProgressMap() || {};
    const prog = unitMap[targetNo] || {};
    const totalSteps = unitData.steps.length;
    const isContentRead = Boolean(prog.is_content_read || prog.is_passed);

    if (startSubMode === "quiz") {
      if (!isContentRead) {
        window.AppUtils?.showToast(
          `กรุณาเรียนเนื้อหาหน่วยที่ ${targetNo} ให้ครบทุกสเต็ปก่อนทำแบบทดสอบ`,
          "warn"
        );
        startSubMode = "reader";
      } else {
        startUnitQuiz(targetNo);
        return;
      }
    }

    currentMode = "reader";

    // Always start at step 0 (Step 1)
    currentStepIdx = 0;

    // Highest step unlocked:
    // If unit was already passed or fully read, user can review all steps
    // Otherwise, start strictly with ONLY step 0 (Step 1) unlocked, or up to partially completed steps
    if (isContentRead) {
      maxStepReachedInSession = totalSteps - 1;
    } else {
      const savedSteps = Math.max(0, Number(prog.steps_completed || 0));
      maxStepReachedInSession = Math.max(0, Math.min(totalSteps - 1, savedSteps > 0 ? savedSteps - 1 : 0));
    }

    toggleLessonsContainers(false);
    renderReaderWorkspace();

    const reachedAll = maxStepReachedInSession >= totalSteps - 1 || isContentRead;
    syncStepProgress(targetNo, maxStepReachedInSession + 1, reachedAll);
  }

  function goToStep(stepIdx, isAdvancing = false) {
    const unitData = getUnitCurriculum(activeUnitNo);
    if (!unitData) return;

    const unitMap = window.AuthManager?.getUnitProgressMap() || {};
    const prog = unitMap[activeUnitNo] || {};
    const isContentRead = Boolean(prog.is_content_read || prog.is_passed);

    const prevIdx = currentStepIdx;
    const totalSteps = unitData.steps.length;
    const bounded = Math.max(0, Math.min(totalSteps - 1, Number(stepIdx) || 0));

    // If advancing forward via Next Step button, unlock the next step
    if (isAdvancing && bounded === currentStepIdx + 1) {
      maxStepReachedInSession = Math.max(maxStepReachedInSession, bounded);
    }

    // STRICT CHECK: Cannot skip ahead past unlocked steps
    if (bounded > maxStepReachedInSession) {
      window.AppUtils?.showToast("ไม่อนุญาตให้กดข้ามสเต็ป กรุณาเรียนเนื้อหาตามลำดับทีละขั้นตอน", "warn");
      window.SoundEngine?.playError?.();
      return;
    }

    if (bounded !== prevIdx) {
      window.SoundEngine?.playPop?.();
    }
    const direction = bounded < prevIdx ? "prev" : "next";
    currentStepIdx = bounded;

    const isAllRead = maxStepReachedInSession >= totalSteps - 1 || isContentRead;
    renderReaderWorkspace();
    const readerCard = document.querySelector("#lesson-workspace .lesson-reader-card");
    window.MotionEngine?.animateStepSlide(readerCard, direction);
    syncStepProgress(activeUnitNo, maxStepReachedInSession + 1, isAllRead);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function formatLessonText(text) {
    if (!text) return "";
    const esc = window.AppUtils.escapeHtml;
    let safe = esc(text);

    // 1. Transform subheadings (หัวข้อย่อย) prominently:
    safe = safe.replace(
      /(^|\n)((?:\*\*)?(?:ตัวอย่างที่\s*\d+|ตัวอย่าง|กรณีศึกษา|ข้อสังเกตสำคัญ|ข้อควรระวัง|สาเหตุที่พบบ่อย|แนวทางการแก้ไข|วิธีตรวจสอบ[^\n:]*|ขั้นตอนการปฏิบัติ[^\n:]*):[^\n*]+(?:\*\*)?)/g,
      (m, p1, p2) => {
        const clean = p2.replace(/\*\*/g, '');
        return `${p1}<strong class="lesson-subheading">${clean}</strong>`;
      }
    );

    // 2. Transform markdown bold **word** -> <strong class="lesson-term-emphasis">word</strong>
    safe = safe.replace(/\*\*(.+?)\*\*/g, '<strong class="lesson-term-emphasis">$1</strong>');

    // 3. Transform newlines into <br />
    safe = safe.replace(/\n/g, '<br />');

    return safe;
  }

  function renderStepBlockHtml(block) {
    const esc = window.AppUtils.escapeHtml;
    if (!block || !block.type) return "";

    if (block.type === "paragraph") {
      return `<p class="lesson-paragraph">${formatLessonText(block.text)}</p>`;
    }

    if (block.type === "table") {
      const headersHtml = (block.headers || [])
        .map((h) => `<th scope="col">${esc(String(h).replace(/\*\*/g, ""))}</th>`)
        .join("");
      const rowsHtml = (block.rows || [])
        .map(
          (row) =>
            `<tr>${row
              .map((cell, idx) =>
                idx === 0
                  ? `<td class="lesson-table-key">${esc(cell)}</td>`
                  : `<td>${esc(cell)}</td>`
              )
              .join("")}</tr>`
        )
        .join("");

      return `
        <div class="lesson-block-wrap">
          ${
            block.caption
              ? `<span class="lesson-block-caption">${esc(block.caption)}</span>`
              : ""
          }
          <div class="clean-table-wrap lesson-table-frame">
            <table class="clean-table lesson-data-table">
              <thead><tr>${headersHtml}</tr></thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </div>
        </div>
      `;
    }

    if (block.type === "flow") {
      const itemsHtml = (block.steps || [])
        .map(
          (st, idx) => `
            <div class="lesson-flow-item">
              <span class="lesson-flow-num">${idx + 1}</span>
              <div class="lesson-flow-copy">
                <strong class="lesson-flow-title">${esc(st.stepTitle)}</strong>
                <p class="lesson-flow-desc">${formatLessonText(st.stepDesc)}</p>
              </div>
            </div>
          `
        )
        .join("");
      return `<div class="lesson-flow-list">${itemsHtml}</div>`;
    }

    if (block.type === "cards") {
      const cardsHtml = (block.items || [])
        .map(
          (item) => `
            <div class="lesson-info-card">
              <strong class="lesson-info-card-title">${formatLessonText(item.label)}</strong>
              <p class="lesson-info-card-desc">${formatLessonText(item.detail)}</p>
            </div>
          `
        )
        .join("");
      return `<div class="lesson-cards-grid">${cardsHtml}</div>`;
    }

    if (block.type === "callout") {
      return `
        <div class="lesson-callout-box">
          <strong class="lesson-callout-title">${esc(block.title)}</strong>
          <p class="lesson-callout-text">${formatLessonText(block.text)}</p>
        </div>
      `;
    }

    if (block.type === "image") {
      return `
        <figure class="lesson-figure-wrap">
          <div class="lesson-figure-img-box">
            <img src="${esc(block.src)}" alt="${esc(block.alt || block.caption || '')}" class="lesson-figure-img" loading="lazy" />
          </div>
          ${
            block.caption
              ? `<figcaption class="lesson-figure-caption">${esc(block.caption)}</figcaption>`
              : ""
          }
        </figure>
      `;
    }

    if (block.type === "video") {
      const isYouTube =
        typeof block.src === "string" &&
        (block.src.includes("youtube.com") || block.src.includes("youtu.be"));
      return `
        <div class="lesson-video-wrap">
          <div class="lesson-video-frame">
            ${
              isYouTube
                ? `<iframe class="lesson-video-embed" src="${esc(block.src)}" title="${esc(block.title || "สื่อวิดีโอการเรียนรู้")}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
                : `<video class="lesson-video-player" src="${esc(block.src)}" controls preload="metadata"></video>`
            }
          </div>
          ${
            block.caption
              ? `<span class="lesson-figure-caption">${esc(block.caption)}</span>`
              : ""
          }
        </div>
      `;
    }

    if (block.type === "code") {
      return `
        <figure class="lesson-code-box">
          <figcaption class="lesson-code-head">
            <span>${esc(block.language || block.caption || "ตัวอย่างโค้ด")}</span>
            <button type="button" class="lesson-code-copy" data-copy-code aria-label="คัดลอกโค้ด">
              ${window.AppUtils.icon("copy")}
              <span data-copy-label>คัดลอก</span>
            </button>
          </figcaption>
          <pre><code>${esc(block.code || block.text || "")}</code></pre>
        </figure>
      `;
    }

    if (block.type === "ean13-guide") {
      return window.Ean13GuideEngine ? window.Ean13GuideEngine.renderRootHtml() : "";
    }

    return "";
  }

  function renderWorkspaceTopBar(activeTab) {
    const esc = window.AppUtils.escapeHtml;
    const icon = window.AppUtils.icon;
    const meta = getUnitMeta(activeUnitNo);
    const mod = CFG.MODULES_SYLLABUS.find((m) => m.id === meta.moduleId);
    const unitData = getUnitCurriculum(activeUnitNo);
    const unitMap = window.AuthManager?.getUnitProgressMap() || {};
    const prog = unitMap[activeUnitNo] || {};
    const isPassed = Boolean(prog.is_passed);
    const isContentRead = Boolean(prog.is_content_read || isPassed);
    const totalSteps = unitData ? unitData.steps.length : 5;
    const isReader = activeTab === "reader";

    return `
      <header class="lesson-workspace-topbar">
        <div class="lesson-topbar-row">
          <button type="button" class="btn-secondary btn-sm lesson-back-btn" id="btn-back-to-directory">
            ${icon("arrow-left", "icon-nudge-left")}
            <span>หน้ารวมบทเรียน</span>
          </button>
          <span class="unit-number-badge ${isPassed ? "is-done" : ""}">${esc(meta.code)}</span>
          <span class="status-pill ${isPassed ? "is-pass" : isContentRead ? "is-info" : "is-warn"}">
            ${isPassed ? icon("check") : ""}
            ${
              isPassed
                ? `เรียนจบ (${prog.best_quiz_score}/10)`
                : isContentRead
                ? "เรียนครบแล้ว พร้อมทำแบบทดสอบ"
                : `กำลังเรียน (${currentStepIdx + 1}/${totalSteps} สเต็ป)`
            }
          </span>
          ${
            isReader
              ? ""
              : `<button type="button" class="btn-secondary btn-sm lesson-topbar-switch" id="tab-switch-reader">
                   ${icon("book")}
                   <span>เนื้อหาบทเรียน (${totalSteps} สเต็ป)</span>
                 </button>`
          }
        </div>
        <p class="lesson-topbar-module">${esc(mod ? mod.title : "")}</p>
        <h1 class="lesson-topbar-title">หน่วยที่ ${meta.no}: ${window.AppUtils.formatUnitTitleHtml(meta.title)}</h1>
      </header>
    `;
  }

  // ชื่อสเต็ปบางรายการในข้อมูลมีเครื่องหมายตัวหนาแบบ markdown ครอบอยู่
  function cleanTitle(text) {
    return String(text || "").replace(/\*\*/g, "").trim();
  }

  function splitStepTag(tag) {
    const parts = String(tag || "")
      .split(/\s*[:|]\s*/)
      .filter(Boolean);
    return { code: parts[0] || "", topic: parts.slice(1).join(" ") };
  }

  function renderReaderWorkspace() {
    const workspace = document.getElementById("lesson-workspace");
    const unitData = getUnitCurriculum(activeUnitNo);
    if (!workspace || !unitData) return;

    const esc = window.AppUtils.escapeHtml;
    const icon = window.AppUtils.icon;
    const meta = getUnitMeta(activeUnitNo);
    const totalSteps = unitData.steps.length;
    const stepObj = unitData.steps[currentStepIdx] || unitData.steps[0];
    const stepPercent = Math.round(((currentStepIdx + 1) / totalSteps) * 100);
    const isFirstStep = currentStepIdx === 0;
    const isLastStep = currentStepIdx === totalSteps - 1;
    const unitMap = window.AuthManager?.getUnitProgressMap() || {};
    const prog = unitMap[activeUnitNo] || {};
    const isPassed = Boolean(prog.is_passed);
    const isContentRead = Boolean(prog.is_content_read || isPassed);
    const tag = splitStepTag(stepObj.tag);
    const bookmarked = window.Bookmarks ? window.Bookmarks.has(activeUnitNo) : false;

    const tocItemsHtml = unitData.steps
      .map((s, idx) => {
        const isCurrent = idx === currentStepIdx;
        const isLocked = idx > maxStepReachedInSession;
        const stateCls = isCurrent ? "is-current" : isLocked ? "is-locked" : "is-visited";
        const stateIcon = isLocked ? icon("lock") : isCurrent ? "" : icon("check");
        return `
          <li>
            <button
              type="button"
              class="toc-item step-rail-btn ${stateCls}"
              data-goto-step="${idx}"
              ${isCurrent ? 'aria-current="step"' : ""}
              ${
                isLocked
                  ? 'disabled title="ไม่อนุญาตให้กดข้ามสเต็ป กรุณาเรียนตามลำดับ"'
                  : `title="ไปยังสเต็ปที่ ${idx + 1}"`
              }
            >
              <span class="toc-item-index">${idx + 1}</span>
              <span class="toc-item-title">${esc(cleanTitle(s.title))}</span>
              <span class="toc-item-state">${stateIcon}</span>
            </button>
          </li>
        `;
      })
      .join("");

    const blocksHtml = (stepObj.blocks || []).map(renderStepBlockHtml).join("");

    setReaderChrome(true);
    workspace.innerHTML = `
      <div class="reader-layout">
        <div class="toc-overlay" data-close-toc></div>

        <aside id="lesson-toc" class="lesson-toc" aria-label="สารบัญบทเรียน">
          <div class="lesson-toc-head">
            <span class="eyebrow">สารบัญหน่วยที่ ${activeUnitNo}</span>
            <button type="button" class="icon-btn toc-close-btn" data-close-toc aria-label="ปิดสารบัญบทเรียน">
              ${icon("close")}
            </button>
          </div>

          <div class="toc-progress">
            <div class="toc-progress-row">
              <span>ความคืบหน้าการอ่านเนื้อหาหน่วยที่ ${activeUnitNo}</span>
              <strong>สเต็ปที่ ${currentStepIdx + 1} จาก ${totalSteps} (${stepPercent}%)</strong>
            </div>
            <div class="progress-track is-thin">
              <div class="progress-fill" style="width: ${stepPercent}%;"></div>
            </div>
          </div>

          <ol class="toc-list step-rail-pills">
            ${tocItemsHtml}
          </ol>

          <div class="toc-quiz">
            ${
              isContentRead
                ? `<button type="button" class="toc-item toc-item--quiz is-visited" id="tab-switch-quiz">
                     <span class="toc-item-index">${icon("timer")}</span>
                     <span class="toc-item-title">แบบทดสอบท้ายหน่วย (10 ข้อ)</span>
                     <span class="toc-item-state">${isPassed ? icon("check") : icon("arrow-right")}</span>
                   </button>`
                : `<p class="toc-item toc-item--quiz is-locked">
                     <span class="toc-item-index">${icon("timer")}</span>
                     <span class="toc-item-title">แบบทดสอบท้ายหน่วย (ปลดล็อกเมื่อเรียนครบทุกสเต็ป)</span>
                     <span class="toc-item-state">${icon("lock")}</span>
                   </p>`
            }
          </div>
        </aside>

        <div class="reader-main">
          ${renderWorkspaceTopBar("reader")}

          <article class="surface-card lesson-reader-card">
            <div class="lesson-step-header">
              <div class="lesson-step-meta">
                <p class="lesson-step-tag">
                  <span>${esc(tag.code)}</span>
                  ${tag.topic ? `<span class="dot-sep" aria-hidden="true"></span><span>${esc(tag.topic)}</span>` : ""}
                  <span class="dot-sep" aria-hidden="true"></span>
                  <span>สเต็ปที่ ${currentStepIdx + 1} จาก ${totalSteps}</span>
                </p>
                <button
                  type="button"
                  class="bookmark-btn ${bookmarked ? "is-saved" : ""}"
                  data-toggle-bookmark="${activeUnitNo}"
                  aria-pressed="${bookmarked ? "true" : "false"}"
                  aria-label="${bookmarked ? "ยกเลิกการบันทึก" : "บันทึก"}หน่วยที่ ${meta.no}"
                >
                  ${icon("bookmark")}
                  <span data-bookmark-label>${bookmarked ? "บันทึกแล้ว" : "บันทึก"}</span>
                </button>
              </div>
              <h2 class="lesson-step-title">${esc(cleanTitle(stepObj.title))}</h2>
              <p class="lesson-step-lead">${esc(stepObj.lead)}</p>
            </div>

            <div class="lesson-step-body">
              ${blocksHtml}
            </div>

            <div class="lesson-takeaway-box">
              <span class="lesson-takeaway-badge">Key takeaway<span class="dot-sep" aria-hidden="true"></span>สรุปประเด็นสำคัญประจำสเต็ป</span>
              <p class="lesson-takeaway-text">${esc(stepObj.keyTakeaway)}</p>
            </div>

            <div class="lesson-step-footer">
              <button type="button" class="btn-secondary" id="btn-prev-step" ${isFirstStep ? "disabled" : ""}>
                ${icon("arrow-left", "icon-nudge-left")}
                <span>สเต็ปก่อนหน้า</span>
              </button>

              <span class="lesson-step-counter">Step ${currentStepIdx + 1} / ${totalSteps}</span>

              ${
                !isLastStep
                  ? `
                    <button type="button" class="btn-primary" id="btn-next-step">
                      <span>ถัดไป (Next): สเต็ปที่ ${currentStepIdx + 2}</span>
                      ${icon("arrow-right", "icon-nudge-right")}
                    </button>
                  `
                  : `
                    <button type="button" class="btn-primary" id="btn-finish-steps-start-quiz">
                      <span>เรียนครบเนื้อหาแล้ว เริ่มทำแบบทดสอบ (10 ข้อ)</span>
                      ${icon("arrow-right", "icon-nudge-right")}
                    </button>
                  `
              }
            </div>
          </article>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     4.1 TOC DRAWER (MOBILE) + FOCUS MANAGEMENT
     ========================================================================== */

  function getTocFocusables() {
    const toc = document.getElementById("lesson-toc");
    if (!toc) return [];
    return Array.from(toc.querySelectorAll("button:not([disabled]), a[href], [tabindex]:not([tabindex='-1'])")).filter(
      (el) => el.offsetParent !== null
    );
  }

  function openTocDrawer() {
    const toc = document.getElementById("lesson-toc");
    const btn = document.getElementById("toc-menu-btn");
    if (!toc) return;
    document.body.classList.add("is-drawer-open");
    if (btn) {
      btn.setAttribute("aria-expanded", "true");
      btn.setAttribute("aria-label", "ปิดสารบัญบทเรียน");
    }
    // บังคับคำนวณสไตล์ใหม่ก่อน เพื่อให้ลิ้นชักพ้นสถานะ visibility: hidden แล้วจึงรับ focus ได้
    void toc.offsetWidth;
    const current = toc.querySelector(".toc-item.is-current") || getTocFocusables()[0];
    if (current) current.focus({ preventScroll: true });
  }

  function closeTocDrawer(restoreFocus = true) {
    if (!document.body.classList.contains("is-drawer-open")) return;
    const btn = document.getElementById("toc-menu-btn");
    document.body.classList.remove("is-drawer-open");
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
      btn.setAttribute("aria-label", "เปิดสารบัญบทเรียน");
      if (restoreFocus) btn.focus({ preventScroll: true });
    }
  }

  function bindTocDrawerEvents() {
    document.getElementById("toc-menu-btn")?.addEventListener("click", () => {
      if (document.body.classList.contains("is-drawer-open")) closeTocDrawer(true);
      else openTocDrawer();
    });

    document.addEventListener("keydown", (e) => {
      if (!document.body.classList.contains("is-drawer-open")) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeTocDrawer(true);
        return;
      }
      if (e.key !== "Tab") return;
      const items = getTocFocusables();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!document.getElementById("lesson-toc").contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }, true);

    window.matchMedia("(min-width: 1024px)").addEventListener?.("change", (ev) => {
      if (ev.matches) closeTocDrawer(false);
    });
  }

  /* ==========================================================================
     5. 10-QUESTION TIMED INSTANT-GRADING QUIZ MODE (WITH 5-SEC COUNTDOWN)
     ========================================================================== */

  function startUnitQuiz(unitNo) {
    const targetNo = Number(unitNo) || activeUnitNo;
    if (!hasUnitCurriculum(targetNo)) return;

    activeUnitNo = targetNo;
    const unitData = getUnitCurriculum(targetNo);
    const unitMap = window.AuthManager?.getUnitProgressMap() || {};
    const prog = unitMap[targetNo] || {};
    const totalSteps = unitData ? unitData.steps.length : 5;

    // Check if user has completed content:
    const isCompleted = Boolean(
      prog.is_content_read ||
      prog.is_passed ||
      (targetNo === activeUnitNo && maxStepReachedInSession >= totalSteps - 1)
    );

    if (!isCompleted) {
      window.AppUtils?.showToast(
        `กรุณาเรียนเนื้อหาหน่วยที่ ${targetNo} ให้ครบทุกสเต็ปก่อนทำแบบทดสอบ`,
        "warn"
      );
      openUnit(targetNo, "reader");
      return;
    }

    stopQuizTimer();

    currentMode = "quiz-countdown";
    countdownSecondsLeft = 5;
    quizState = {
      unitNo: targetNo,
      questions: unitData.quiz.slice(0, CFG.QUESTIONS_PER_UNIT),
      currentIdx: 0,
      score: 0,
      answers: new Array(CFG.QUESTIONS_PER_UNIT).fill(null),
      accumulatedMs: 0,
      questionStartedAtMs: 0,
      finalTimeSec: 0,
      isSubmitting: false,
      savedResult: null,
      saveError: ""
    };

    toggleLessonsContainers(false);
    renderQuizCountdownWorkspace();
    startCountdownSequence();

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startCountdownSequence() {
    stopCountdownTimer();
    countdownSecondsLeft = 5;
    updateCountdownDom(5);
    window.SoundEngine?.playCountdownTick(5);

    countdownTimerId = setInterval(() => {
      countdownSecondsLeft -= 1;
      if (countdownSecondsLeft > 0) {
        updateCountdownDom(countdownSecondsLeft);
        window.SoundEngine?.playCountdownTick(countdownSecondsLeft);
      } else {
        stopCountdownTimer();
        showCountdownGoAndLaunch();
      }
    }, 1000);
  }

  function updateCountdownDom(secondsLeft) {
    const numEl = document.getElementById("quiz-countdown-num");
    const hintEl = document.getElementById("quiz-countdown-hint");
    if (numEl) {
      numEl.textContent = String(secondsLeft);
      numEl.classList.remove("animate-pop");
      void numEl.offsetWidth; // Reflow for restart animation
      numEl.classList.add("animate-pop");
    }
    if (hintEl) {
      hintEl.textContent = `แบบทดสอบจะเริ่มในอีก ${secondsLeft} วินาที...`;
    }
  }

  function showCountdownGoAndLaunch() {
    const ringEl = document.getElementById("quiz-countdown-ring");
    const numEl = document.getElementById("quiz-countdown-num");
    const hintEl = document.getElementById("quiz-countdown-hint");

    if (ringEl) ringEl.classList.add("is-go");
    if (numEl) {
      numEl.textContent = "GO!";
      numEl.classList.add("is-go");
      numEl.classList.remove("animate-pop");
      void numEl.offsetWidth;
      numEl.classList.add("animate-pop");
    }
    if (hintEl) {
      hintEl.textContent = "ลุยเลย! เริ่มทำแบบทดสอบ";
    }

    window.SoundEngine?.playCountdownGo();

    setTimeout(() => {
      if (currentMode !== "quiz-countdown") return;
      currentMode = "quiz";
      renderQuizWorkspace();
      startQuizTimer();
    }, 450);
  }

  function renderQuizCountdownWorkspace() {
    const workspace = document.getElementById("lesson-workspace");
    if (!workspace || !quizState) return;

    const esc = window.AppUtils.escapeHtml;
    const icon = window.AppUtils.icon;
    const meta = getUnitMeta(quizState.unitNo);

    setReaderChrome(false);
    workspace.innerHTML = `
      ${renderWorkspaceTopBar("quiz")}

      <div class="surface-card quiz-countdown-card">
        <div class="quiz-countdown-badge-row">
          <span class="status-pill is-info">แบบทดสอบท้ายหน่วย 10 ข้อ</span>
          <span class="status-pill is-pass">เกณฑ์ผ่าน 8 / 10 (80%)</span>
          <span class="status-pill is-neutral">จับเวลาความเร็วและบันทึกสถิติ</span>
        </div>

        <div class="quiz-countdown-meta">
          <span class="unit-number-badge">${esc(meta.code)}</span>
          <h2 class="quiz-countdown-title">เตรียมพร้อมทำแบบทดสอบ: หน่วยที่ ${meta.no}</h2>
          <p class="quiz-countdown-subtitle">${window.AppUtils.formatUnitTitleHtml(meta.title)}: ${esc(meta.subtitle)}</p>
        </div>

        <div class="quiz-countdown-display-wrap">
          <div class="quiz-countdown-ring" id="quiz-countdown-ring">
            <span class="quiz-countdown-number animate-pop" id="quiz-countdown-num">5</span>
          </div>
          <span class="quiz-countdown-hint" id="quiz-countdown-hint" aria-live="polite">แบบทดสอบจะเริ่มในอีก 5 วินาที...</span>
        </div>

        <ul class="quiz-countdown-tips">
          <li class="quiz-countdown-tip-item">
            ${icon("clock")}
            <span><strong>เวลาเริ่มนับหลังครบ 5 วิ:</strong> เวลาทำข้อสอบจะไม่ถูกหักระหว่างนับถอยหลัง</span>
          </li>
          <li class="quiz-countdown-tip-item">
            ${icon("check")}
            <span><strong>ตรวจผลทันที:</strong> รู้คะแนนข้อต่อข้อ พร้อมคำอธิบายและแนวคิดทางเทคนิค</span>
          </li>
        </ul>

        <div class="quiz-countdown-actions">
          <button type="button" class="btn-primary btn-lg" id="btn-skip-countdown">
            <span>เริ่มทำทันที (Skip)</span>
            ${icon("play")}
          </button>
          <button type="button" class="btn-secondary btn-lg" id="btn-cancel-countdown">
            <span>ย้อนกลับหน้ารวม</span>
          </button>
        </div>
      </div>
    `;
  }

  function handleSelectQuizChoice(choiceIdx) {
    if (!quizState || currentMode !== "quiz") return;
    const qIdx = quizState.currentIdx;
    if (quizState.answers[qIdx] !== null) return; // ล็อกคำตอบแล้ว ตรวจทันทีเพียงครั้งเดียวต่อข้อ

    const qObj = quizState.questions[qIdx];
    if (!qObj) return;

    // หยุดเวลาชั่วคราวเพื่อให้ผู้เรียนอ่านคำอธิบายเฉลยได้เต็มที่โดยไม่เสียเปรียบเวลา
    stopQuizTimer();
    const minExpectedMs = (qIdx + 1) * 1000;
    if (quizState.accumulatedMs < minExpectedMs) {
      quizState.accumulatedMs = minExpectedMs;
    }

    const chosen = Number(choiceIdx);
    const isCorrect = chosen === Number(qObj.answer);
    if (isCorrect) {
      quizState.score += 1;
    }

    quizState.answers[qIdx] = {
      chosenIdx: chosen,
      correctIdx: Number(qObj.answer),
      isCorrect: isCorrect
    };

    renderQuizWorkspace();
    if (isCorrect) {
      window.SoundEngine?.playSuccess();
      window.MotionEngine?.burstQuizConfetti?.();
      window.MascotCompanion?.setState?.("quiz_correct");
    } else {
      window.SoundEngine?.playError();
      const qCard =
        document.querySelector("#lesson-workspace .quiz-cockpit-card") ||
        document.querySelector("#lesson-workspace .quiz-question-card");
      window.MotionEngine?.shakeElement(qCard);
      window.MascotCompanion?.setState?.("quiz_wrong");
    }

    setTimeout(() => {
      const banner = document.getElementById("quiz-feedback-banner") || document.getElementById("btn-quiz-advance-inline");
      if (banner) {
        banner.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 60);
  }

  function advanceQuizOrSubmit() {
    if (!quizState || currentMode !== "quiz") return;
    const totalQ = quizState.questions.length;

    if (quizState.currentIdx < totalQ - 1) {
      quizState.currentIdx += 1;
      renderQuizWorkspace();
      const qCard = document.querySelector("#lesson-workspace .quiz-question-card");
      window.MotionEngine?.animateStepSlide(qCard, "next");
      startQuizTimer();
    } else {
      finishAndSaveUnitQuiz();
    }
  }

  function renderQuizWorkspace() {
    const workspace = document.getElementById("lesson-workspace");
    if (!workspace || !quizState) return;

    const esc = window.AppUtils.escapeHtml;
    const icon = window.AppUtils.icon;
    const totalQ = quizState.questions.length;
    const qIdx = quizState.currentIdx;
    const qObj = quizState.questions[qIdx];
    const answerRecord = quizState.answers[qIdx];
    const hasAnswered = answerRecord !== null;
    const elapsedFormatted = window.AppUtils.formatDuration(getQuizElapsedSeconds());

    const dotsHtml = quizState.questions
      .map((_, idx) => {
        const ans = quizState.answers[idx];
        let cls = "";
        let label = `ข้อ ${idx + 1} ยังไม่ได้ตอบ`;
        if (ans) {
          cls = ans.isCorrect ? "is-correct" : "is-wrong";
          label = `ข้อ ${idx + 1} ${ans.isCorrect ? "ตอบถูก" : "ตอบผิด"}`;
        } else if (idx === qIdx) {
          cls = "is-current";
          label = `ข้อ ${idx + 1} กำลังทำ`;
        }
        return `<li class="quiz-progress-dot ${cls}" aria-label="${label}">${idx + 1}</li>`;
      })
      .join("");

    const choicesHtml = qObj.choices
      .map((choiceText, idx) => {
        let stateCls = "";
        let badgeNote = "";

        if (hasAnswered) {
          if (idx === answerRecord.correctIdx) {
            stateCls = "is-correct";
            badgeNote = `<span class="quiz-choice-verdict is-correct">${icon("tick")}เฉลยที่ถูกต้อง</span>`;
          } else if (idx === answerRecord.chosenIdx && !answerRecord.isCorrect) {
            stateCls = "is-wrong";
            badgeNote = `<span class="quiz-choice-verdict is-wrong">${icon("close")}คำตอบที่เลือก</span>`;
          } else {
            stateCls = "is-muted";
          }
        }

        return `
          <button
            type="button"
            class="quiz-option-btn ${stateCls}"
            data-quiz-choice="${idx}"
            ${hasAnswered ? "disabled" : ""}
          >
            <span class="quiz-option-prefix">${CHOICE_LABELS[idx]}</span>
            <span class="quiz-option-text">${esc(choiceText)}</span>
            ${badgeNote}
          </button>
        `;
      })
      .join("");

    let feedbackHtml = "";
    if (hasAnswered) {
      const correctLetter = CHOICE_LABELS[answerRecord.correctIdx];
      const isLastQ = qIdx >= totalQ - 1;
      const nextBtnText = isLastQ ? "ตรวจผลสอบและบันทึกคะแนน" : `ข้อถัดไป (${qIdx + 2}/${totalQ})`;
      feedbackHtml = `
        <div class="quiz-feedback-box ${answerRecord.isCorrect ? "is-correct" : "is-wrong"}" id="quiz-feedback-banner" role="status">
          <div class="quiz-feedback-head">
            <span class="quiz-status-icon" aria-hidden="true">${icon(answerRecord.isCorrect ? "check" : "x-circle")}</span>
            <div>
              <strong class="quiz-feedback-title">${
                answerRecord.isCorrect
                  ? "คำตอบถูกต้อง (+1 คะแนน)"
                  : `ยังไม่ถูกต้อง คำตอบที่ถูกคือข้อ ${correctLetter}`
              }</strong>
              <span class="quiz-feedback-note">หยุดเวลาชั่วคราวขณะอ่านคำอธิบาย</span>
            </div>
          </div>
          <p class="quiz-feedback-text">${formatLessonText(qObj.explanation)}</p>
          <div class="quiz-feedback-actions">
            <button type="button" class="btn-primary btn-lg" id="btn-quiz-next-question">
              <span>${nextBtnText}</span>
              ${icon("arrow-right", "icon-nudge-right")}
            </button>
          </div>
        </div>
      `;
    }

    setQuizFocusMode(true);
    setReaderChrome(false);
    workspace.innerHTML = `
      <div class="quiz-cockpit-shell">
        <div class="quiz-cockpit-hud">
          <div class="quiz-cockpit-hud-top">
            <div class="quiz-cockpit-hud-left">
              <button type="button" class="btn-secondary btn-sm quiz-back-btn" id="btn-abort-quiz" title="ออกจากการทำข้อสอบ">
                ${icon("arrow-left", "icon-nudge-left")}
                <span>ออก</span>
              </button>
              <span class="unit-number-badge">Unit ${quizState.unitNo}</span>
              <span class="quiz-hud-tag">ข้อที่ ${qIdx + 1}/${totalQ}</span>
            </div>

            <div class="quiz-hud-timer-badge" aria-label="เวลาที่ใช้">
              ${icon("timer")}
              <span id="quiz-live-timer">${elapsedFormatted}</span>
            </div>

            <span class="quiz-hud-score-badge">คะแนน: <strong>${quizState.score}/${totalQ}</strong></span>
          </div>

          <ol class="quiz-dots-row quiz-cockpit-dots" aria-label="ความคืบหน้าแบบทดสอบ">
            ${dotsHtml}
          </ol>
        </div>

        <article class="surface-card quiz-cockpit-card quiz-question-card">
          <div class="quiz-cockpit-q-header">
            <p class="quiz-q-chip">
              <span>Question ${qIdx + 1} of ${totalQ}</span>
              <span class="dot-sep" aria-hidden="true"></span>
              <span>เกณฑ์ผ่าน 8/10</span>
              <span class="dot-sep" aria-hidden="true"></span>
              <span>ตรวจคำตอบทันที</span>
            </p>
            <h2 class="quiz-cockpit-question-title">ข้อที่ ${qIdx + 1}. ${esc(qObj.q)}</h2>
          </div>

          <div class="quiz-cockpit-options-grid">
            ${choicesHtml}
          </div>

          ${feedbackHtml ? `<div class="quiz-cockpit-feedback-wrap">${feedbackHtml}</div>` : ""}

          <p class="quiz-hint-text">
            ${
              hasAnswered
                ? "ตรวจคำอธิบายแล้ว กดปุ่มเพื่อไปข้อถัดไป (หรือกดปุ่ม Space / Enter บนแป้นพิมพ์)"
                : "คลิกตัวเลือกที่ถูกต้องที่สุดเพียงข้อเดียว หรือกดแป้นพิมพ์ 1 ถึง 4 (เกณฑ์ผ่าน 8/10 คะแนน)"
            }
          </p>
        </article>
      </div>
    `;
  }

  /* ==========================================================================
     6. QUIZ RESULT & IMMEDIATE AUTO-SAVE TO GOOGLE SHEETS
     ========================================================================== */

  async function finishAndSaveUnitQuiz() {
    if (!quizState) return;
    stopQuizTimer();

    const finalTimeSec = Math.max(1, getQuizElapsedSeconds());
    quizState.finalTimeSec = finalTimeSec;
    quizState.isSubmitting = true;
    quizState.saveError = "";
    currentMode = "result";

    renderQuizResultWorkspace();
    window.scrollTo({ top: 0, behavior: "smooth" });

    let user = window.AuthManager?.getCurrentUser();
    if (!user || !user.student_id) {
      try {
        const raw = localStorage.getItem(window.APP_CONFIG?.STORAGE_KEYS?.SESSION_USER || "cdti_session_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.student_id) {
            user = parsed;
          }
        }
      } catch (e) {}
    }

    if (!user || !user.student_id) {
      quizState.isSubmitting = false;
      quizState.saveError = "ไม่พบข้อมูลผู้เรียนในระบบ กรุณาเข้าสู่ระบบก่อนบันทึกคะแนน";
      renderQuizResultWorkspace();
      window.AppUtils?.showToast?.("กรุณาเข้าสู่ระบบก่อนบันทึกคะแนน", "warning");
      return;
    }

    window.MotionEngine?.startTopLoader();
    try {
      const res = await window.BackendAPI.submitUnitQuiz({
        student_id: user.student_id,
        unit_no: quizState.unitNo,
        score: quizState.score,
        time_sec: finalTimeSec
      });

      if (!res || !res.ok) {
        throw new Error((res && res.error) || "บันทึกผลคะแนนไม่สำเร็จ");
      }

      if (res.user) {
        window.AuthManager.updateSessionData(res.user, res.unit_progress);
      }
      quizState.isSubmitting = false;
      quizState.savedResult = res;
      renderQuizResultWorkspace();

      const passed = quizState.score >= CFG.PASS_SCORE_PER_UNIT;
      window.MascotCompanion?.setState?.(passed ? "quiz_pass" : "quiz_retry");
      if (passed) {
        window.MotionEngine?.burstCelebration();
        window.SoundEngine?.playSuccess();
      }
      window.AppUtils.showToast(
        passed
          ? `บันทึกคะแนนหน่วยที่ ${quizState.unitNo} สำเร็จ (${quizState.score}/10 ผ่านเกณฑ์ 80%)`
          : `บันทึกคะแนนหน่วยที่ ${quizState.unitNo} แล้ว (${quizState.score}/10 ลองทบทวนและสอบใหม่อีกครั้ง)`,
        passed ? "success" : "info"
      );
    } catch (err) {
      quizState.isSubmitting = false;
      const rawMsg = (err && err.message) ? err.message : String(err);
      if (rawMsg.includes("Cannot read properties of null") || rawMsg.includes("student_id")) {
        quizState.saveError = "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณากดลองบันทึกซ้ำ";
      } else {
        quizState.saveError = rawMsg || "เกิดข้อผิดพลาดในการบันทึกคะแนน";
      }
      renderQuizResultWorkspace();
      window.AppUtils.showToast(quizState.saveError, "error");
    } finally {
      window.MotionEngine?.doneTopLoader();
    }
  }

  function renderQuizResultWorkspace() {
    const workspace = document.getElementById("lesson-workspace");
    if (!workspace || !quizState) return;

    const esc = window.AppUtils.escapeHtml;
    const icon = window.AppUtils.icon;
    const score = quizState.score;
    const totalQ = quizState.questions.length;
    const percent = Math.round((score / totalQ) * 100);
    const passedAttempt = score >= CFG.PASS_SCORE_PER_UNIT;
    const timeFormatted = window.AppUtils.formatDuration(quizState.finalTimeSec);

    const unitMap = window.AuthManager?.getUnitProgressMap() || {};
    const unitRecord = unitMap[quizState.unitNo] || {};
    const bestScore = Number(unitRecord.best_quiz_score || score);
    const bestTime = Number(unitRecord.best_quiz_time_sec || quizState.finalTimeSec);

    const nextUnitNo = quizState.unitNo + 1;
    const canOpenNextUnit = nextUnitNo <= CFG.TOTAL_UNITS && hasUnitCurriculum(nextUnitNo);

    let saveBannerHtml = "";
    if (quizState.isSubmitting) {
      saveBannerHtml = `
        <div class="quiz-save-banner is-saving" role="status">
          <svg class="btn-spinner-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.4" opacity="0.28"></circle>
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path>
          </svg>
          <span>กำลังบันทึกคะแนน (${score}/10) และเวลา (${quizState.finalTimeSec} วินาที) ไปยังฐานข้อมูล...</span>
        </div>
      `;
    } else if (quizState.saveError) {
      saveBannerHtml = `
        <div class="quiz-save-banner is-error" role="alert">
          ${icon("alert")}
          <span>${esc(quizState.saveError)}</span>
          <button type="button" class="btn-secondary btn-sm" id="btn-retry-save-quiz">ลองบันทึกอีกครั้ง</button>
        </div>
      `;
    } else {
      saveBannerHtml = `
        <div class="quiz-save-banner is-saved" role="status">
          ${icon("check", "icon-check-anim")}
          <span>บันทึกคะแนน (${score}/10 คะแนน) และเวลาที่ใช้ (${quizState.finalTimeSec} วินาที) ลงฐานข้อมูลเรียบร้อยแล้ว</span>
        </div>
      `;
    }

    const reviewRowsHtml = quizState.questions
      .map((qObj, idx) => {
        const ans = quizState.answers[idx];
        const ok = Boolean(ans && ans.isCorrect);
        const chosenLabel = ans ? CHOICE_LABELS[ans.chosenIdx] : "-";
        const correctLabel = CHOICE_LABELS[qObj.answer];
        return `
          <li class="quiz-review-item">
            <span class="quiz-review-question">ข้อ ${idx + 1}. ${esc(qObj.q)}</span>
            <span class="status-pill ${ok ? "is-pass" : "is-fail"}">
              ${icon(ok ? "tick" : "close")}
              ${ok ? `ถูก (ข้อ ${correctLabel})` : `เลือก ${chosenLabel} เฉลย ${correctLabel}`}
            </span>
          </li>
        `;
      })
      .join("");

    setReaderChrome(false);
    workspace.innerHTML = `
      ${renderWorkspaceTopBar("quiz")}

      <div class="surface-card quiz-result-card">
        <div class="quiz-result-head">
          <span class="mascot-plate" aria-hidden="true">
            <img
              src="images/mascot/${passedAttempt ? "star-9-congrats.png" : "mascot-study.png"}"
              alt=""
              class="mascot-sticker"
            />
          </span>
          <div>
            <span class="status-pill is-wrap ${passedAttempt ? "is-pass" : "is-warn"}">
              ${passedAttempt ? icon("check") : icon("alert")}
              ${
                passedAttempt
                  ? "ผ่านเกณฑ์การประเมินประจำหน่วย (80% ขึ้นไป)"
                  : "ยังไม่ผ่านเกณฑ์ 80% (ต้องทำได้ตั้งแต่ 8/10 คะแนน)"
              }
            </span>
            <h2 class="quiz-result-title">
              ${
                passedAttempt
                  ? `ยอดเยี่ยม คุณสอบผ่านหน่วยที่ ${quizState.unitNo} เรียบร้อยแล้ว`
                  : `ทำได้ ${score} จาก ${totalQ} คะแนน ลองทบทวนเนื้อหาแล้วสอบใหม่อีกครั้ง`
              }
            </h2>
            <p class="quiz-result-desc">
              ระบบเก็บคะแนนสูงสุดและเวลาที่เร็วที่สุดของคุณเพื่อนำไปคำนวณความคืบหน้าและปลดล็อกเกียรติบัตร
            </p>
          </div>
        </div>

        ${saveBannerHtml}

        <div class="metric-strip quiz-result-metrics">
          <div class="metric-cell">
            <span class="metric-label">คะแนนที่ทำได้รอบนี้</span>
            <span class="metric-value ${passedAttempt ? "is-success" : "is-accent"}">${score} / ${totalQ} (${percent}%)</span>
            <span class="metric-sub">เกณฑ์ผ่านขั้นต่ำ 8 / 10 (80%)</span>
          </div>
          <div class="metric-cell">
            <span class="metric-label">เวลาที่ใช้ทำควิซรอบนี้</span>
            <span class="metric-value">${timeFormatted}</span>
            <span class="metric-sub">คิดเป็น ${quizState.finalTimeSec} วินาที</span>
          </div>
          <div class="metric-cell">
            <span class="metric-label">สถิติสูงสุดของหน่วยนี้</span>
            <span class="metric-value">${bestScore} / ${totalQ}</span>
            <span class="metric-sub">เวลาเร็วสุด ${window.AppUtils.formatDuration(bestTime)}</span>
          </div>
        </div>

        <div class="quiz-review">
          <h3 class="quiz-review-heading">สรุปผลการตอบรายข้อ (${totalQ} ข้อ)</h3>
          <ol class="quiz-review-list">
            ${reviewRowsHtml}
          </ol>
        </div>

        <div class="lesson-step-footer">
          <div class="btn-row">
            <button type="button" class="btn-secondary" id="btn-result-back-directory">กลับหน้ารวมบทเรียน</button>
            <button type="button" class="btn-secondary" id="btn-result-review-steps">ทบทวนเนื้อหาบทเรียน</button>
          </div>

          <div class="btn-row">
            <button type="button" class="${passedAttempt ? "btn-secondary" : "btn-primary"}" id="btn-result-retake-quiz">
              ${passedAttempt ? "ทำซ้ำเพื่อทำเวลาให้ไวขึ้น" : "ทำแบบทดสอบใหม่อีกครั้ง"}
            </button>
            ${
              passedAttempt
                ? canOpenNextUnit
                  ? `
                    <button type="button" class="btn-primary" data-enter-unit="${nextUnitNo}">
                      <span>เรียนหน่วยถัดไป (หน่วยที่ ${nextUnitNo})</span>
                      ${icon("arrow-right", "icon-nudge-right")}
                    </button>
                  `
                  : `<button type="button" class="btn-primary" data-nav-view="progress">ดูหน้าความคืบหน้าทั้ง 16 หน่วย</button>`
                : ""
            }
          </div>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     7. EVENT DELEGATION FOR LESSONS VIEW
     ========================================================================== */

  function bindLearningEvents() {
    const lessonsSection = document.getElementById("view-lessons");
    if (!lessonsSection) return;
    bindTocDrawerEvents();

    lessonsSection.addEventListener("click", (e) => {
      // Module filter buttons in Directory
      const modBtn = e.target.closest("[data-module-filter]");
      if (modBtn) {
        e.preventDefault();
        window.SoundEngine?.playClick();
        moduleFilter = modBtn.getAttribute("data-module-filter") || "all";
        if (moduleFilter === "all") {
          activeUnitNo = 1;
        } else {
          const modUnits = CFG.UNITS_METADATA.filter(
            (u) => String(u.moduleId) === String(moduleFilter)
          );
          if (modUnits.length > 0) {
            activeUnitNo = modUnits[0].no;
          }
        }
        renderDirectory();

        // Animate the updated banner to give instant visual feedback
        const bannerEl = document.getElementById("lessons-selected-unit-banner");
        if (bannerEl) {
          bannerEl.style.transition = "transform 0.16s ease, opacity 0.16s ease";
          bannerEl.style.transform = "scale(0.97)";
          bannerEl.style.opacity = "0.7";
          setTimeout(() => {
            bannerEl.style.transform = "scale(1)";
            bannerEl.style.opacity = "1";
          }, 80);
        }
        return;
      }

      // Mobile TOC drawer: close on overlay / close button
      if (e.target.closest("[data-close-toc]")) {
        e.preventDefault();
        closeTocDrawer(true);
        return;
      }

      // Bookmark the current unit (stored locally)
      const bookmarkBtn = e.target.closest("[data-toggle-bookmark]");
      if (bookmarkBtn && window.Bookmarks) {
        e.preventDefault();
        const saved = window.Bookmarks.toggle(bookmarkBtn.getAttribute("data-toggle-bookmark"));
        bookmarkBtn.classList.toggle("is-saved", saved);
        bookmarkBtn.setAttribute("aria-pressed", saved ? "true" : "false");
        const labelEl = bookmarkBtn.querySelector("[data-bookmark-label]");
        if (labelEl) labelEl.textContent = saved ? "บันทึกแล้ว" : "บันทึก";
        window.AppUtils?.showToast(saved ? "บันทึกหน่วยนี้ไว้แล้ว" : "ยกเลิกการบันทึกหน่วยนี้แล้ว", "info");
        return;
      }

      // Copy code sample
      const copyBtn = e.target.closest("[data-copy-code]");
      if (copyBtn) {
        e.preventDefault();
        const codeEl = copyBtn.closest(".lesson-code-box")?.querySelector("code");
        const labelEl = copyBtn.querySelector("[data-copy-label]");
        const done = () => {
          if (labelEl) {
            labelEl.textContent = "คัดลอกแล้ว";
            setTimeout(() => (labelEl.textContent = "คัดลอก"), 1600);
          }
        };
        if (codeEl && navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(codeEl.textContent || "").then(done, () => {});
        }
        return;
      }

      // Click card to open unit in reader mode directly
      const cardEl = e.target.closest(".lesson-card, [data-unit-no]");
      if (cardEl && !e.target.closest("button")) {
        const uNo = Number(cardEl.getAttribute("data-unit-no"));
        if (uNo) {
          e.preventDefault();
          openUnit(uNo, "reader");
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
      }

      // Select unit preview in Directory
      const selectBtn = e.target.closest("[data-select-lesson-unit]");
      if (selectBtn) {
        e.preventDefault();
        activeUnitNo = Number(selectBtn.getAttribute("data-select-lesson-unit")) || 1;
        renderDirectory();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Enter Unit Reader
      const enterBtn = e.target.closest("[data-enter-unit]");
      if (enterBtn) {
        e.preventDefault();
        const uNo = Number(enterBtn.getAttribute("data-enter-unit")) || 1;
        openUnit(uNo, "reader");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Start Unit Quiz directly
      const startQuizBtn = e.target.closest("[data-start-unit-quiz]");
      if (startQuizBtn) {
        e.preventDefault();
        const uNo = Number(startQuizBtn.getAttribute("data-start-unit-quiz")) || 1;
        openUnit(uNo, "quiz");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      // Workspace Topbar Controls
      if (
        e.target.closest("#btn-back-to-directory") ||
        e.target.closest("#btn-result-back-directory")
      ) {
        e.preventDefault();
        openDirectory({ unitNo: activeUnitNo });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      if (e.target.closest("#tab-switch-reader") || e.target.closest("#btn-result-review-steps")) {
        e.preventDefault();
        openUnit(activeUnitNo, "reader");
        return;
      }

      if (e.target.closest("#btn-finish-steps-start-quiz")) {
        e.preventDefault();
        const unitData = getUnitCurriculum(activeUnitNo);
        const totalSteps = unitData ? unitData.steps.length : 5;
        syncStepProgress(activeUnitNo, totalSteps, true);
        startUnitQuiz(activeUnitNo);
        return;
      }

      if (e.target.closest("#tab-switch-quiz")) {
        e.preventDefault();
        startUnitQuiz(activeUnitNo);
        return;
      }

      // Quiz Countdown Controls (Skip to start or Cancel back)
      if (e.target.closest("#btn-skip-countdown")) {
        e.preventDefault();
        stopCountdownTimer();
        window.SoundEngine?.playCountdownGo();
        currentMode = "quiz";
        renderQuizWorkspace();
        startQuizTimer();
        return;
      }

      if (e.target.closest("#btn-cancel-countdown")) {
        e.preventDefault();
        stopCountdownTimer();
        openDirectory({ unitNo: activeUnitNo });
        return;
      }

      // Step Rail jump (strictly cannot jump ahead to unreached steps)
      const stepBtn = e.target.closest("[data-goto-step]");
      if (stepBtn) {
        e.preventDefault();
        const targetIdx = Number(stepBtn.getAttribute("data-goto-step"));
        if (targetIdx > maxStepReachedInSession) {
          window.AppUtils?.showToast("ไม่อนุญาตให้กดข้ามสเต็ป กรุณาเรียนตามลำดับทีละขั้นตอน", "warn");
          window.SoundEngine?.playError?.();
          return;
        }
        closeTocDrawer(false);
        goToStep(targetIdx, false);
        return;
      }

      // Previous Step button (always allowed to go backward)
      if (e.target.closest("#btn-prev-step")) {
        e.preventDefault();
        goToStep(currentStepIdx - 1, false);
        return;
      }

      // Next Step button (advances and unlocks next step)
      if (e.target.closest("#btn-next-step")) {
        e.preventDefault();
        goToStep(currentStepIdx + 1, true);
        return;
      }

      // EAN-13 Interactive Stepper & Validator Events
      const eanTab = e.target.closest("[data-ean13-tab]");
      if (eanTab) {
        e.preventDefault();
        const tabIdx = Number(eanTab.getAttribute("data-ean13-tab"));
        window.Ean13GuideEngine?.setTab(tabIdx);
        return;
      }

      if (e.target.closest("#ean13-btn-prev")) {
        e.preventDefault();
        window.Ean13GuideEngine?.prevStep();
        return;
      }

      if (e.target.closest("#ean13-btn-next")) {
        e.preventDefault();
        window.Ean13GuideEngine?.nextStep();
        return;
      }

      const eanDot = e.target.closest("[data-ean13-step-dot]");
      if (eanDot) {
        e.preventDefault();
        const dotIdx = Number(eanDot.getAttribute("data-ean13-step-dot"));
        window.Ean13GuideEngine?.goToStep(dotIdx);
        return;
      }

      const eanPreset = e.target.closest("[data-ean13-preset]");
      if (eanPreset) {
        e.preventDefault();
        const code = eanPreset.getAttribute("data-ean13-preset");
        window.Ean13GuideEngine?.setCustomBarcode(code);
        return;
      }

      if (e.target.closest("#ean13-btn-random")) {
        e.preventDefault();
        window.Ean13GuideEngine?.generateRandomBarcode();
        return;
      }

      // Abort Quiz Back to Reader / Directory
      if (e.target.closest("#btn-abort-quiz")) {
        e.preventDefault();
        stopQuizTimer();
        setQuizFocusMode(false);
        openUnit(activeUnitNo, "reader");
        return;
      }

      // Quiz Choice Instant Answer
      const choiceBtn = e.target.closest("[data-quiz-choice]");
      if (choiceBtn) {
        e.preventDefault();
        handleSelectQuizChoice(Number(choiceBtn.getAttribute("data-quiz-choice")));
        return;
      }

      // Next Question / Finish Quiz
      if (
        e.target.closest("#btn-quiz-next-question") ||
        e.target.closest("#btn-quiz-advance-inline")
      ) {
        e.preventDefault();
        advanceQuizOrSubmit();
        return;
      }

      // Retake Quiz or Retry Save
      if (e.target.closest("#btn-result-retake-quiz")) {
        e.preventDefault();
        startUnitQuiz(activeUnitNo);
        return;
      }

      if (e.target.closest("#btn-retry-save-quiz")) {
        e.preventDefault();
        finishAndSaveUnitQuiz();
      }
    });

    // Real-time input handling for EAN-13 Live Barcode Validator
    lessonsSection.addEventListener("input", (e) => {
      if (e.target && e.target.id === "ean13-live-input") {
        window.Ean13GuideEngine?.onCustomInputChange(e.target.value);
      }
    });

    // Keyboard navigation for Quiz Cockpit (1-4 for fast-tap answers, Space/Enter to advance)
    window.addEventListener("keydown", (e) => {
      if (currentMode !== "quiz" || !quizState) return;

      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (activeTag === "input" || activeTag === "textarea") return;

      if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;

      const qIdx = quizState.currentIdx;
      const hasAnswered = quizState.answers && quizState.answers[qIdx] !== null;

      if (!hasAnswered) {
        if (e.key === "1" || e.key.toLowerCase() === "a") {
          e.preventDefault();
          handleSelectQuizChoice(0);
        } else if (e.key === "2" || e.key.toLowerCase() === "b") {
          e.preventDefault();
          handleSelectQuizChoice(1);
        } else if (e.key === "3" || e.key.toLowerCase() === "c") {
          e.preventDefault();
          handleSelectQuizChoice(2);
        } else if (e.key === "4" || e.key.toLowerCase() === "d") {
          e.preventDefault();
          handleSelectQuizChoice(3);
        }
      } else {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          advanceQuizOrSubmit();
        }
      }
    });
  }

  document.addEventListener("DOMContentLoaded", bindLearningEvents);

  window.LearningEngine = {
    hasUnitCurriculum,
    openDirectory,
    openUnit,
    startUnitQuiz,
    stopActiveTimer: stopQuizTimer,
    renderCurrentLessonsView() {
      if (currentMode === "reader") {
        toggleLessonsContainers(false);
        renderReaderWorkspace();
      } else if (currentMode === "quiz-countdown") {
        toggleLessonsContainers(false);
        renderQuizCountdownWorkspace();
      } else if (currentMode === "quiz") {
        toggleLessonsContainers(false);
        renderQuizWorkspace();
      } else if (currentMode === "result") {
        toggleLessonsContainers(false);
        renderQuizResultWorkspace();
      } else {
        toggleLessonsContainers(true);
        renderDirectory();
      }
    },
    getSelectedUnitNo: () => activeUnitNo
  };
})();
