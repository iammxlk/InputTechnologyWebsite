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

  function toggleLessonsContainers(isDirectory) {
    if (isDirectory) {
      setQuizFocusMode(false);
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
        window.AuthManager.updateSessionData(res.user, res.unit_progress, null);
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
    const bannerEl = document.getElementById("lessons-selected-unit-banner");
    if (bannerEl) {
      bannerEl.innerHTML = `
        <div class="selected-unit-banner-inner">
          <div style="min-width: 0; max-width: 720px;">
            <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 8px;">
              <span class="unit-number-badge ${isPassed ? "is-done" : ""}">${esc(currentUnit.code)}</span>
              <span class="status-pill is-neutral">${esc(currentMod ? currentMod.title : "")}</span>
              <span class="status-pill ${
                isPassed
                  ? "is-pass"
                  : isContentRead
                  ? "is-info"
                  : isAvailable
                  ? stepsDone > 0
                    ? "is-warn"
                    : "is-neutral"
                  : "is-warn"
              }">
                ${
                  isPassed
                    ? `สอบผ่านแล้ว (${currentProg.best_quiz_score}/10)`
                    : isContentRead
                    ? "เรียนครบแล้ว • พร้อมทำควิซ"
                    : isAvailable
                    ? stepsDone > 0
                      ? `ยังเรียนไม่ครบหน่วย (${stepsDone}/${totalSteps} สเต็ป)`
                      : "ยังเรียนไม่ครบหน่วย"
                    : "รออัปเดตเนื้อหา"
                }
              </span>
            </div>

            <h2 style="font-size: 1.28rem; font-weight: 600; margin-top: 12px; line-height: 1.38;">
              หน่วยที่ ${currentUnit.no}: ${esc(currentUnit.title)}
            </h2>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.6;">
              ${esc(currentUnit.subtitle)}
            </p>
          </div>

          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px;">
            ${
              isAvailable
                ? `
                  ${
                    isContentRead
                      ? `
                        <button type="button" class="btn-secondary" data-start-unit-quiz="${currentUnit.no}">
                          ทำแบบทดสอบ (10 ข้อ)
                        </button>
                      `
                      : ""
                  }
                  <button type="button" class="btn-primary" data-enter-unit="${currentUnit.no}">
                    ${
                      isPassed || isContentRead
                        ? "ทบทวนเนื้อหาบทเรียน"
                        : stepsDone > 0
                        ? `เรียนต่อสเต็ปที่ ${Math.min(totalSteps, stepsDone + 1)}`
                        : "เริ่มเรียนเนื้อหาทีละสเต็ป"
                    }
                  </button>
                `
                : `
                  <span style="font-size: 0.84rem; color: var(--text-muted);">
                    กำลังเตรียมข้อมูลเนื้อหาหน่วยนี้
                  </span>
                `
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
        .map((u) => {
          const prog = unitMap[u.no] || {};
          const passed = Boolean(prog.is_passed);
          const isContentRead = Boolean(prog.is_content_read || passed);
          const attempts = Number(prog.attempts_count || 0);
          const available = hasUnitCurriculum(u.no);
          const uData = getUnitCurriculum(u.no);
          const uTotalSteps = uData ? uData.steps.length : 5;
          const uStepsDone = Math.min(
            uTotalSteps,
            isContentRead ? uTotalSteps : Number(prog.steps_completed || 0)
          );
          const isSelected = u.no === activeUnitNo;

          let statusClass = "is-neutral";
          let statusLabel = available ? "ยังเรียนไม่ครบหน่วย" : "รออัปเดต";
          if (passed) {
            statusClass = "is-pass";
            statusLabel = `ผ่านเกณฑ์ (${prog.best_quiz_score}/10)`;
          } else if (attempts > 0) {
            statusClass = "is-warn";
            statusLabel = `สูงสุด ${prog.best_quiz_score}/10`;
          } else if (isContentRead) {
            statusClass = "is-info";
            statusLabel = "เรียนครบแล้ว • พร้อมทำควิซ";
          } else if (uStepsDone > 0) {
            statusClass = "is-warn";
            statusLabel = `ยังเรียนไม่ครบหน่วย (${uStepsDone}/${uTotalSteps} สเต็ป)`;
          } else if (available) {
            statusClass = "is-neutral";
            statusLabel = "ยังเรียนไม่ครบหน่วย";
          }

          const unitCardHtml = `
            <article class="module-overview-card module-theme-${u.moduleId} ${isSelected ? "is-selected-unit" : ""}" data-unit-no="${u.no}" style="cursor: pointer;">
              <div>
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                  <span class="unit-number-badge ${passed ? "is-done" : ""}">${esc(u.code)}</span>
                  <span class="status-pill ${statusClass}">${esc(statusLabel)}</span>
                </div>

                <h3 style="font-size: 1.03rem; font-weight: 600; margin-top: 12px; line-height: 1.4;">
                  หน่วยที่ ${u.no}: ${esc(u.title)}
                </h3>
                <p style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.56;">
                  ${esc(u.subtitle)}
                </p>
              </div>

              <div style="padding-top: 12px; border-top: 1px solid var(--border-subtle); display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap;">
                <span class="font-notch tabular-nums" style="font-size: 0.8rem; color: var(--text-muted);">
                  ${
                    attempts > 0 && prog.best_quiz_time_sec > 0
                      ? `เวลาเร็วสุด ${window.AppUtils.formatDuration(prog.best_quiz_time_sec)}`
                      : available
                      ? `${uTotalSteps} สเต็ป • ควิซ 10 ข้อ`
                      : "รออัปเดตเนื้อหา"
                  }
                </span>

                <div style="display: flex; align-items: center; gap: 8px;">
                  ${
                    available
                      ? `
                        ${
                          isContentRead
                            ? `
                              <button
                                type="button"
                                class="btn-secondary"
                                style="min-height: 36px; padding: 6px 12px; font-size: 0.8rem;"
                                data-start-unit-quiz="${u.no}"
                              >
                                ทำควิซ
                              </button>
                            `
                            : ""
                        }
                        <button
                          type="button"
                          class="btn-primary"
                          style="min-height: 36px; padding: 6px 14px; font-size: 0.82rem;"
                          data-enter-unit="${u.no}"
                        >
                          ${
                            passed || isContentRead
                              ? "ทบทวน"
                              : uStepsDone > 0
                              ? "เรียนต่อ"
                              : "เข้าเรียน"
                          }
                        </button>
                      `
                      : `
                        <button
                          type="button"
                          class="btn-secondary"
                          style="min-height: 36px; padding: 6px 14px; font-size: 0.8rem;"
                          data-select-lesson-unit="${u.no}"
                        >
                          ดูรายละเอียด
                        </button>
                      `
                  }
                </div>
              </div>
            </article>
          `;

          return unitCardHtml;
        })
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
        return `${p1}<strong class="lesson-subheading font-notch">${clean}</strong>`;
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
        .map((h) => `<th>${esc(h)}</th>`)
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
              <span class="lesson-flow-num font-notch tabular-nums">${idx + 1}</span>
              <div style="min-width: 0; flex: 1;">
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

    if (block.type === "ean13-guide") {
      return window.Ean13GuideEngine ? window.Ean13GuideEngine.renderRootHtml() : "";
    }

    return "";
  }

  function renderWorkspaceTopBar(activeTab) {
    const esc = window.AppUtils.escapeHtml;
    const meta = getUnitMeta(activeUnitNo);
    const mod = CFG.MODULES_SYLLABUS.find((m) => m.id === meta.moduleId);
    const unitData = getUnitCurriculum(activeUnitNo);
    const unitMap = window.AuthManager?.getUnitProgressMap() || {};
    const prog = unitMap[activeUnitNo] || {};
    const isPassed = Boolean(prog.is_passed);
    const isContentRead = Boolean(prog.is_content_read || isPassed);
    const totalSteps = unitData ? unitData.steps.length : 5;

    return `
      <div class="lesson-workspace-topbar surface-card">
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px;">
          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px; min-width: 0;">
            <button type="button" class="btn-secondary lesson-back-btn" id="btn-back-to-directory">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
              <span>หน้ารวมบทเรียน</span>
            </button>
            <span class="unit-number-badge ${isPassed ? "is-done" : ""}">${esc(meta.code)}</span>
            <span class="status-pill ${isPassed ? "is-pass" : isContentRead ? "is-info" : "is-warn"}">
              ${
                isPassed
                  ? `ผ่านเกณฑ์แล้ว (${prog.best_quiz_score}/10)`
                  : isContentRead
                  ? "เรียนครบแล้ว • พร้อมทำควิซ"
                  : `ยังเรียนไม่ครบหน่วย (${currentStepIdx + 1}/${totalSteps} สเต็ป)`
              }
            </span>
          </div>

          <div class="filter-pills-row" role="tablist" aria-label="สลับโหมดการเรียน">
            <button
              type="button"
              class="filter-pill-btn ${activeTab === "reader" ? "is-active" : ""}"
              id="tab-switch-reader"
            >
              เนื้อหาบทเรียน (${totalSteps} สเต็ป)
            </button>
            ${
              isContentRead
                ? `
                  <button
                    type="button"
                    class="filter-pill-btn ${activeTab !== "reader" ? "is-active" : ""}"
                    id="tab-switch-quiz"
                  >
                    แบบทดสอบท้ายหน่วย (10 ข้อ)
                  </button>
                `
                : ""
            }
          </div>
        </div>

        <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border-subtle); display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 8px;">
          <div style="min-width: 0;">
            <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">
              ${esc(mod ? mod.title : "")}
            </span>
            <h1 style="font-size: 1.32rem; font-weight: 600; margin-top: 2px; line-height: 1.35;">
              หน่วยที่ ${meta.no}: ${esc(meta.title)}
            </h1>
          </div>
        </div>
      </div>
    `;
  }

  function renderReaderWorkspace() {
    const workspace = document.getElementById("lesson-workspace");
    const unitData = getUnitCurriculum(activeUnitNo);
    if (!workspace || !unitData) return;

    const esc = window.AppUtils.escapeHtml;
    const totalSteps = unitData.steps.length;
    const stepObj = unitData.steps[currentStepIdx] || unitData.steps[0];
    const stepPercent = Math.round(((currentStepIdx + 1) / totalSteps) * 100);
    const isFirstStep = currentStepIdx === 0;
    const isLastStep = currentStepIdx === totalSteps - 1;
    const unitMap = window.AuthManager?.getUnitProgressMap() || {};
    const prog = unitMap[activeUnitNo] || {};
    const isContentRead = Boolean(prog.is_content_read || prog.is_passed);

    const stepPillsHtml = unitData.steps
      .map((s, idx) => {
        const isCurrent = idx === currentStepIdx;
        const isLocked = idx > maxStepReachedInSession;
        const isVisited = idx <= maxStepReachedInSession;
        const stateCls = isCurrent
          ? "is-current"
          : isVisited
          ? "is-visited"
          : "is-locked";
        return `
          <button
            type="button"
            class="step-rail-btn ${stateCls}"
            data-goto-step="${idx}"
            ${isLocked ? 'disabled title="ไม่อนุญาตให้กดข้ามสเต็ป กรุณาเรียนตามลำดับ"' : `title="ไปยังสเต็ปที่ ${idx + 1}"`}
          >
            <span class="font-notch tabular-nums">${isLocked ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline-block; vertical-align:middle; margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>` : ""}สเต็ปที่ ${idx + 1}</span>
          </button>
        `;
      })
      .join("");

    const blocksHtml = (stepObj.blocks || []).map(renderStepBlockHtml).join("");

    workspace.innerHTML = `
      ${renderWorkspaceTopBar("reader")}

      <!-- Step Progress Rail Card -->
      <div class="surface-card lesson-step-rail-card">
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px;">
          <span style="font-size: 0.85rem; font-weight: 500; color: var(--text-secondary);">
            ความคืบหน้าการอ่านเนื้อหาหน่วยที่ ${activeUnitNo}
          </span>
          <span class="font-notch tabular-nums" style="font-size: 0.86rem; font-weight: 600; color: var(--blue-600);">
            สเต็ปที่ ${currentStepIdx + 1} จาก ${totalSteps} (${stepPercent}%)
          </span>
        </div>

        <div class="progress-track" style="height: 8px; margin-top: 10px;">
          <div class="progress-fill" style="width: ${stepPercent}%;"></div>
        </div>

        <div class="step-rail-pills" style="margin-top: 14px;">
          ${stepPillsHtml}
        </div>
      </div>

      <!-- Main Bite-sized Step Content Card -->
      <article class="surface-card lesson-reader-card">
        <div class="lesson-step-header">
          <span class="font-notch lesson-step-tag">${esc(stepObj.tag)}</span>
          <h2 class="lesson-step-title">${esc(stepObj.title)}</h2>
          <p class="lesson-step-lead">${esc(stepObj.lead)}</p>
        </div>

        <div class="lesson-step-body">
          ${blocksHtml}
        </div>

        <div class="lesson-takeaway-box">
          <span class="font-notch lesson-takeaway-badge">KEY TAKEAWAY • สรุปประเด็นสำคัญประจำสเต็ป</span>
          <p class="lesson-takeaway-text">${esc(stepObj.keyTakeaway)}</p>
        </div>

        <!-- Step Navigation Footer -->
        <div class="lesson-step-footer">
          <button
            type="button"
            class="btn-secondary"
            id="btn-prev-step"
            ${isFirstStep ? "disabled" : ""}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <span>สเต็ปก่อนหน้า</span>
          </button>

          <span class="font-notch tabular-nums" style="font-size: 0.84rem; color: var(--text-muted);">
            Step ${currentStepIdx + 1} / ${totalSteps}
          </span>

          ${
            !isLastStep
              ? `
                <button type="button" class="btn-primary" id="btn-next-step">
                  <span>ถัดไป (Next): สเต็ปที่ ${currentStepIdx + 2}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              `
              : `
                <button type="button" class="btn-primary" id="btn-finish-steps-start-quiz">
                  <span>เรียนครบเนื้อหาแล้ว • เริ่มทำแบบทดสอบ (10 ข้อ)</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </button>
              `
          }
        </div>
      </article>
    `;
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
    const meta = getUnitMeta(quizState.unitNo);

    workspace.innerHTML = `
      ${renderWorkspaceTopBar("quiz")}

      <div class="surface-card quiz-countdown-card">
        <div class="quiz-countdown-badge-row">
          <span class="status-pill is-info font-notch">SPEEDRUN CHALLENGE • 10 QUESTIONS</span>
          <span class="status-pill is-pass font-notch">เกณฑ์ผ่าน 8 / 10 (80%)</span>
          <span class="status-pill is-neutral font-notch">จับเวลาความเร็วและบันทึกสถิติ</span>
        </div>

        <div class="quiz-countdown-meta">
          <span class="unit-number-badge font-notch">${esc(meta.code)}</span>
          <h2 class="quiz-countdown-title">เตรียมพร้อมทำแบบทดสอบ: หน่วยที่ ${meta.no}</h2>
          <p class="quiz-countdown-subtitle">${esc(meta.title)} — ${esc(meta.subtitle)}</p>
        </div>

        <div class="quiz-countdown-display-wrap">
          <div class="quiz-countdown-ring" id="quiz-countdown-ring">
            <span class="quiz-countdown-number font-notch animate-pop" id="quiz-countdown-num">5</span>
          </div>
          <span class="quiz-countdown-hint font-notch" id="quiz-countdown-hint">แบบทดสอบจะเริ่มในอีก 5 วินาที...</span>
        </div>

        <div class="quiz-countdown-tips">
          <div class="quiz-countdown-tip-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            <span><strong>เวลาเริ่มนับหลังครบ 5 วิ:</strong> เวลาทำข้อสอบจะไม่ถูกหักระหว่างนับถอยหลัง</span>
          </div>
          <div class="quiz-countdown-tip-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            <span><strong>ตรวจผลทันที:</strong> รู้คะแนนข้อต่อข้อ พร้อมคำอธิบายและแนวคิดทางเทคนิค</span>
          </div>
        </div>

        <div class="quiz-countdown-actions">
          <button type="button" class="btn-primary" id="btn-skip-countdown">
            <span>เริ่มทำทันที (Skip)</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
          <button type="button" class="btn-secondary" id="btn-cancel-countdown">
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
    } else {
      window.SoundEngine?.playError();
      const qCard = document.querySelector("#lesson-workspace .quiz-question-card");
      window.MotionEngine?.shakeElement(qCard);
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
        if (ans) {
          cls = ans.isCorrect ? "is-correct" : "is-wrong";
        } else if (idx === qIdx) {
          cls = "is-current";
        }
        return `<span class="quiz-progress-dot font-notch tabular-nums ${cls}">${idx + 1}</span>`;
      })
      .join("");

    const choicesHtml = qObj.choices
      .map((choiceText, idx) => {
        let stateCls = "";
        let badgeNote = "";

        if (hasAnswered) {
          if (idx === answerRecord.correctIdx) {
            stateCls = "is-correct";
            badgeNote = `<span class="quiz-choice-verdict is-correct">เฉลยที่ถูกต้อง</span>`;
          } else if (idx === answerRecord.chosenIdx && !answerRecord.isCorrect) {
            stateCls = "is-wrong";
            badgeNote = `<span class="quiz-choice-verdict is-wrong">คำตอบที่เลือก</span>`;
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
            <span class="quiz-option-prefix font-notch">${CHOICE_LABELS[idx]}</span>
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
        <div class="quiz-feedback-box ${answerRecord.isCorrect ? "is-correct" : "is-wrong"}" id="quiz-feedback-banner">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;">
            <div style="min-width: 0;">
              <strong style="font-size: 1.25rem; font-weight: 800; display: block;">
                ${
                  answerRecord.isCorrect
                    ? "คำตอบถูกต้อง (+1 คะแนน)"
                    : `ยังไม่ถูกต้อง • คำตอบที่ถูกคือข้อ ${correctLetter}`
                }
              </strong>
              <span style="font-size: 0.92rem; opacity: 0.90; font-weight: 600; display: block; margin-top: 2px;">
                หยุดเวลาชั่วคราวขณะอ่านคำอธิบาย
              </span>
            </div>

            <button type="button" class="btn-primary quiz-advance-btn" id="btn-quiz-advance-inline" style="min-height: 48px; padding: 10px 22px; font-size: 1.08rem; font-weight: 800; border: 2px solid var(--border-ink); box-shadow: 2.5px 2.5px 0px var(--shadow-ink); margin-left: auto;">
              <span>${nextBtnText}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
          <p style="font-size: 1.12rem; margin-top: 10px; line-height: 1.6; font-weight: 500;">
            ${esc(qObj.explanation)}
          </p>
        </div>
      `;
    }

    setQuizFocusMode(true);
    workspace.innerHTML = `
      <div class="quiz-cockpit-shell">
        <!-- Compact HUD Bar -->
        <div class="surface-card quiz-cockpit-hud">
          <div class="quiz-cockpit-hud-top">
            <div class="quiz-cockpit-hud-left">
              <button type="button" class="btn-secondary quiz-back-btn" id="btn-abort-quiz" title="ออกจากการทำข้อสอบ">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>ออก</span>
              </button>
              <span class="unit-number-badge font-notch">UNIT ${quizState.unitNo}</span>
              <span class="quiz-hud-tag font-notch">ข้อที่ ${qIdx + 1}/${totalQ}</span>
            </div>

            <div class="quiz-cockpit-hud-center">
              <div class="quiz-hud-timer-badge font-notch tabular-nums">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <circle cx="12" cy="13" r="8"></circle>
                  <path d="M12 9v4l2.5 2.5"></path>
                  <path d="M9 2h6"></path>
                </svg>
                <span id="quiz-live-timer">${elapsedFormatted}</span>
              </div>
            </div>

            <div class="quiz-cockpit-hud-right">
              <span class="quiz-hud-score-badge font-notch">
                คะแนน: <strong>${quizState.score}/${totalQ}</strong>
              </span>
            </div>
          </div>

          <!-- 10 Slim Progress Dots -->
          <div class="quiz-dots-row quiz-cockpit-dots">
            ${dotsHtml}
          </div>
        </div>

        <!-- Question & Options Cockpit Card -->
        <article class="surface-card quiz-cockpit-card">
          <div class="quiz-cockpit-q-header">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <span class="font-notch quiz-q-chip">QUESTION ${qIdx + 1} OF ${totalQ} • เกณฑ์ผ่าน 8/10</span>
              <span class="status-pill is-info font-notch" style="font-size: 0.90rem; font-weight: 700; padding: 4px 12px; border: 2px solid var(--border-ink);">ตรวจคำตอบทันที</span>
            </div>
            <h2 class="quiz-cockpit-question-title">
              ข้อที่ ${qIdx + 1}. ${esc(qObj.q)}
            </h2>
          </div>

          <!-- 2x2 Options on Desktop/Tablet, 4 Rows on Mobile -->
          <div class="quiz-cockpit-options-grid">
            ${choicesHtml}
          </div>

          ${feedbackHtml ? `<div class="quiz-cockpit-feedback-wrap">${feedbackHtml}</div>` : ""}

          <div class="quiz-cockpit-footer">
            <span class="quiz-hint-text">
              ${
                hasAnswered
                  ? "ตรวจคำอธิบายแล้ว กดปุ่มเพื่อไปข้อถัดไป (หรือกดปุ่ม Space / Enter บนแป้นพิมพ์)"
                  : "คลิกตัวเลือกที่ถูกต้องที่สุดเพียงข้อเดียว หรือกดแป้นพิมพ์ 1–4 (เกณฑ์ผ่าน 8/10 คะแนน)"
              }
            </span>

            ${
              hasAnswered
                ? `
                  <button type="button" class="btn-primary" id="btn-quiz-next-question" style="min-height: 52px; padding: 12px 28px; font-size: 1.15rem; font-weight: 800; border: 2.5px solid var(--border-ink); box-shadow: 3.5px 3.5px 0 var(--border-ink);">
                    <span>${
                      qIdx < totalQ - 1
                        ? `ข้อถัดไป (${qIdx + 2}/${totalQ})`
                        : "ตรวจผลสอบและบันทึกคะแนน"
                    }</span>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </button>
                `
                : ""
            }
          </div>
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
        window.AuthManager.updateSessionData(res.user, res.unit_progress, null);
      }
      quizState.isSubmitting = false;
      quizState.savedResult = res;
      renderQuizResultWorkspace();

      const passed = quizState.score >= CFG.PASS_SCORE_PER_UNIT;
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
        <div class="quiz-save-banner is-saving">
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <svg class="btn-spinner-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.4" opacity="0.28"></circle>
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path>
            </svg>
            <span>กำลังบันทึกคะแนน (${score}/10) และเวลา (${quizState.finalTimeSec} วินาที) ไปยังฐานข้อมูล...</span>
          </span>
        </div>
      `;
    } else if (quizState.saveError) {
      saveBannerHtml = `
        <div class="quiz-save-banner is-error">
          <span>${esc(quizState.saveError)}</span>
          <button type="button" class="btn-secondary" id="btn-retry-save-quiz" style="min-height: 32px; padding: 4px 12px; font-size: 0.78rem;">
            ลองบันทึกอีกครั้ง
          </button>
        </div>
      `;
    } else {
      saveBannerHtml = `
        <div class="quiz-save-banner is-saved">
          บันทึกคะแนน (${score}/10 คะแนน) และเวลาที่ใช้ (${quizState.finalTimeSec} วินาที) ลงฐานข้อมูลเรียบร้อยแล้ว
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
          <div class="quiz-review-item">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
              <span style="font-size: 0.88rem; font-weight: 500; color: var(--text-main);">
                ข้อ ${idx + 1}. ${esc(qObj.q)}
              </span>
              <span class="status-pill ${ok ? "is-pass" : "is-fail"}" style="flex-shrink: 0;">
                ${ok ? `ถูก (ข้อ ${correctLabel})` : `เลือก ${chosenLabel} • เฉลย ${correctLabel}`}
              </span>
            </div>
          </div>
        `;
      })
      .join("");

    workspace.innerHTML = `
      ${renderWorkspaceTopBar("quiz")}

      <div class="surface-card quiz-result-card">
        <div style="display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 14px;">
          <div>
            <span class="status-pill ${passedAttempt ? "is-pass" : "is-warn"}">
              ${
                passedAttempt
                  ? "ผ่านเกณฑ์การประเมินประจำหน่วย (80% ขึ้นไป)"
                  : "ยังไม่ผ่านเกณฑ์ 80% (ต้องทำได้ตั้งแต่ 8/10 คะแนน)"
              }
            </span>
            <h2 style="font-size: 1.42rem; font-weight: 600; margin-top: 10px;">
              ${
                passedAttempt
                  ? `ยอดเยี่ยม คุณสอบผ่านหน่วยที่ ${quizState.unitNo} เรียบร้อยแล้ว`
                  : `ทำได้ ${score} จาก ${totalQ} คะแนน ลองทบทวนเนื้อหาแล้วสอบใหม่อีกครั้ง`
              }
            </h2>
            <p style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 4px;">
              ระบบเก็บคะแนนสูงสุดและเวลาที่เร็วที่สุดของคุณเพื่อนำไปคำนวณความคืบหน้าและปลดล็อกเกียรติบัตร
            </p>
          </div>
        </div>

        ${saveBannerHtml}

        <!-- Divided 3-Column KPI Result Strip -->
        <div class="metric-strip quiz-result-metrics">
          <div class="metric-cell">
            <span class="metric-label">คะแนนที่ทำได้รอบนี้</span>
            <span class="metric-value" style="color: ${
              passedAttempt ? "var(--status-pass-ink)" : "var(--blue-600)"
            };">
              ${score} / ${totalQ} (${percent}%)
            </span>
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

        <!-- Compact Answer Summary -->
        <div style="margin-top: 20px;">
          <h3 style="font-size: 0.96rem; font-weight: 600; margin-bottom: 10px;">
            สรุปผลการตอบรายข้อ (${totalQ} ข้อ)
          </h3>
          <div class="quiz-review-list">
            ${reviewRowsHtml}
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="lesson-step-footer" style="margin-top: 22px;">
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <button type="button" class="btn-secondary" id="btn-result-back-directory">
              กลับหน้ารวมบทเรียน
            </button>
            <button type="button" class="btn-secondary" id="btn-result-review-steps">
              ทบทวนเนื้อหา 5 สเต็ป
            </button>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <button
              type="button"
              class="${passedAttempt ? "btn-secondary" : "btn-primary"}"
              id="btn-result-retake-quiz"
            >
              ${passedAttempt ? "ทำซ้ำเพื่อทำเวลาให้ไวขึ้น" : "ทำแบบทดสอบใหม่อีกครั้ง"}
            </button>

            ${
              passedAttempt
                ? canOpenNextUnit
                  ? `
                    <button type="button" class="btn-primary" data-enter-unit="${nextUnitNo}">
                      <span>เรียนหน่วยถัดไป (หน่วยที่ ${nextUnitNo})</span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                  `
                  : `
                    <button type="button" class="btn-primary" data-nav-view="progress">
                      ดูหน้าความคืบหน้าทั้ง 16 หน่วย
                    </button>
                  `
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

      // Click card to open unit in reader mode directly
      const cardEl = e.target.closest(".module-overview-card, [data-unit-no]");
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
