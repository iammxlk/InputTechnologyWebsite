/**
 * ============================================================================
 * js/app.js — SPA Router & Core View Controller (Home, Lessons Directory & Progress)
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * สถานศึกษา: โรงเรียนจิตรลดาวิชาชีพ สถาบันเทคโนโลยีจิตรลดา
 * ============================================================================
 */

(function () {
  const CFG = window.APP_CONFIG;
  const VALID_VIEWS = ["home", "lessons", "progress"];

  let activeView = "home";
  let selectedUnitNo = 1;
  let lessonsModuleFilter = "all";
  let progressStatusFilter = "all";

  /* ==========================================================================
     1. ROUTING & NAVIGATION
     ========================================================================== */

  function switchView(viewName, options = {}) {
    if (!window.AuthManager || !window.AuthManager.isAuthenticated()) {
      window.AuthManager?.enforceRouteGuard();
      return;
    }

    const target = VALID_VIEWS.includes(viewName) ? viewName : "home";
    if (activeView !== target && !options.silent) {
      window.SoundEngine?.playPop();
    }
    if (target !== "lessons") {
      window.LearningEngine?.stopActiveTimer();
      document.body.classList.remove("is-reader-open", "is-drawer-open");
    }
    activeView = target;

    if (options.unitNo) {
      selectedUnitNo = Number(options.unitNo) || 1;
    }

    VALID_VIEWS.forEach((v) => {
      const section = document.getElementById(`view-${v}`);
      if (section) {
        section.classList.toggle("hidden", v !== target);
      }
    });

    const activeSection = document.getElementById(`view-${target}`);

    document.querySelectorAll(".sticky-navbar [data-nav-view]").forEach((btn) => {
      const v = btn.getAttribute("data-nav-view");
      btn.classList.toggle("is-active", v === target);
    });

    if (target === "lessons" && options.openReaderUnit) {
      window.LearningEngine?.openUnit(options.openReaderUnit, options.startSubMode || "reader");
    } else if (target === "lessons" && options.resetToDirectory) {
      window.LearningEngine?.openDirectory({ unitNo: selectedUnitNo });
    } else {
      renderActiveView();
    }

    if (activeSection) {
      window.MotionEngine?.animateViewEnter(activeSection);
    }

    if (options.scrollTop !== false) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function openUnitInLessons(unitNo, startSubMode = "reader") {
    selectedUnitNo = Math.max(1, Math.min(CFG.TOTAL_UNITS, Number(unitNo) || 1));
    lessonsModuleFilter = "all";
    switchView("lessons", {
      unitNo: selectedUnitNo,
      openReaderUnit: selectedUnitNo,
      startSubMode: startSubMode
    });
  }

  function renderActiveView() {
    if (!window.AuthManager || !window.AuthManager.isAuthenticated()) return;

    if (activeView === "home") {
      renderHomeView();
    } else if (activeView === "lessons") {
      renderLessonsDirectoryView();
    } else if (activeView === "progress") {
      renderProgressView();
    }
  }

  function getNextRecommendedUnitNo(unitMap) {
    for (let i = 1; i <= CFG.TOTAL_UNITS; i++) {
      const rec = unitMap[i];
      if (!rec || !rec.is_passed) {
        return i;
      }
    }
    return 1;
  }

  /* ==========================================================================
     2. VIEW 1: HOME (OVERVIEW + LIVE CERTIFICATE PREVIEW + 4-MODULE SYLLABUS)
     ========================================================================== */

  function renderHomeView() {
    const user = window.AuthManager.getCurrentUser();
    if (!user) return;

    const unitMap = window.AuthManager.getUnitProgressMap() || {};
    const esc = window.AppUtils.escapeHtml;

    // 1. Greeting & KPI Metrics
    const welcomeEl = document.getElementById("home-welcome-name");
    const metricUnits = document.getElementById("home-metric-units");
    const metricPercent = document.getElementById("home-metric-percent");
    const metricScore = document.getElementById("home-metric-score");
    const metricTime = document.getElementById("home-metric-time");

    if (welcomeEl) welcomeEl.textContent = user.full_name;
    if (metricUnits) metricUnits.textContent = `${user.passed_units_count} / ${CFG.TOTAL_UNITS}`;
    if (metricPercent) {
      if (window.MotionEngine) {
        window.MotionEngine.animateNumber(metricPercent, user.progress_percent, (n) => `${Math.round(n)}%`);
      } else {
        metricPercent.textContent = `${user.progress_percent}%`;
      }
    }
    if (metricScore) {
      if (window.MotionEngine) {
        window.MotionEngine.animateNumber(metricScore, user.total_quiz_score, (n) => `${Math.round(n)}`);
      } else {
        metricScore.textContent = `${user.total_quiz_score}`;
      }
    }
    if (metricTime) metricTime.textContent = window.AppUtils.formatDuration(user.total_time_sec);

    const homeFill = document.getElementById("home-progress-fill");
    const homeTrack = document.getElementById("home-progress-track");
    const homePercent = Math.min(100, Math.max(0, Number(user.progress_percent || 0)));
    if (homeFill) homeFill.style.width = `${homePercent}%`;
    if (homeTrack) homeTrack.setAttribute("aria-valuenow", String(homePercent));

    // 2. Continue Learning CTA
    const continueBtn = document.getElementById("home-cta-continue-btn");
    const nextNo = getNextRecommendedUnitNo(unitMap);
    const nextMeta = CFG.UNITS_METADATA.find((u) => u.no === nextNo) || CFG.UNITS_METADATA[0];

    if (continueBtn) {
      const labelEl = continueBtn.querySelector("[data-label]") || continueBtn;
      if (user.passed_units_count >= CFG.TOTAL_UNITS) {
        labelEl.textContent = "ทบทวนบทเรียนทั้ง 16 หน่วย";
        continueBtn.onclick = () => openUnitInLessons(1);
      } else {
        labelEl.textContent = `เริ่มเรียนหน่วยที่ ${nextMeta.no}: ${nextMeta.title}`;
        continueBtn.onclick = () => openUnitInLessons(nextMeta.no);
      }
    }

    // 3. Live Certificate Preview Card
    const certCanvas = document.getElementById("home-cert-preview-canvas");
    const certStatusPill = document.getElementById("home-cert-status-pill");
    const certCaption = document.getElementById("home-cert-caption");
    const certPrimaryBtn = document.getElementById("home-cert-primary-btn");
    const isUnlocked = Number(user.passed_units_count || 0) >= CFG.TOTAL_UNITS;

    if (certCanvas && window.CertificateEngine) {
      window.CertificateEngine.renderCertificateCanvas(certCanvas, user, true);
    }

    if (certStatusPill) {
      certStatusPill.className = isUnlocked ? "status-pill is-pass" : "status-pill is-warn";
      certStatusPill.textContent = isUnlocked ? "ปลดล็อกแล้ว 100%" : "รอปลดล็อก 100%";
    }

    if (certCaption) {
      const remaining = Math.max(0, CFG.TOTAL_UNITS - Number(user.passed_units_count || 0));
      certCaption.textContent = isUnlocked
        ? "ยินดีด้วย คุณเรียนและสอบผ่านครบทั้ง 16 หน่วยแล้ว สามารถดาวน์โหลดไฟล์เกียรติบัตรความละเอียดสูงได้ทันที"
        : `เรียนเนื้อหาและสอบผ่านเกณฑ์ร้อยละ 80 ครบทั้ง 16 หน่วย (เหลืออีก ${remaining} หน่วย) เพื่อปลดล็อกปุ่มดาวน์โหลดเกียรติบัตร`;
    }

    if (certPrimaryBtn) {
      if (isUnlocked) {
        certPrimaryBtn.textContent = "ดาวน์โหลดเกียรติบัตร";
        certPrimaryBtn.onclick = () => window.CertificateEngine.downloadOfficialCertificate();
      } else {
        certPrimaryBtn.textContent = "ดูเงื่อนไขการรับ";
        certPrimaryBtn.onclick = () => switchView("progress");
      }
    }

    // 4. บทเรียนทั้งหมด: 4 หมวด หมวดละ 4 การ์ดหน่วย (ครบ 16 หน่วยตามแผนการจัดการเรียนรู้)
    const syllabusGrid = document.getElementById("home-syllabus-grid");
    if (syllabusGrid) {
      syllabusGrid.innerHTML = CFG.MODULES_SYLLABUS.map((mod) => {
        const modUnits = CFG.UNITS_METADATA.filter((u) => u.moduleId === mod.id);
        const passedInMod = modUnits.filter((u) => unitMap[u.no]?.is_passed).length;
        const cardsHtml = modUnits
          .map((u) => window.AppUtils.renderLessonCard(u, unitMap, { mode: "home" }))
          .join("");

        return `
          <section class="module-group" aria-label="${esc(mod.title)}">
            <header class="module-group-head">
              <span class="module-group-num" aria-hidden="true">${String(mod.id).padStart(2, "0")}</span>
              <div>
                <h3 class="module-group-title">${esc(mod.title)}</h3>
                <p class="module-group-desc">${esc(mod.description)}</p>
              </div>
              <span class="module-group-count ${passedInMod === modUnits.length ? "is-complete" : ""}">
                ${esc(mod.unitRange)} ผ่านแล้ว ${passedInMod} / ${modUnits.length} หน่วย
              </span>
            </header>
            <div class="lesson-card-grid">${cardsHtml}</div>
          </section>
        `;
      }).join("");
      window.GlassGrid?.refresh();
      window.UiFx?.playHomeIntro();
    }
  }

  /* ==========================================================================
     3. VIEW 2: LESSONS DIRECTORY & BITE-SIZED STEP READER (DELEGATED TO LEARNING ENGINE)
     ========================================================================== */

  function renderLessonsDirectoryView() {
    if (window.LearningEngine) {
      window.LearningEngine.renderCurrentLessonsView();
    }
  }

  /* ==========================================================================
     4. VIEW 3: PROGRESS (0–100% BAR, 16 UNITS STATUS & STRICT CERT GATE)
     ========================================================================== */

  function renderProgressView() {
    const user = window.AuthManager.getCurrentUser();
    if (!user) return;

    const unitMap = window.AuthManager.getUnitProgressMap() || {};
    const esc = window.AppUtils.escapeHtml;

    const passedCount = Number(user.passed_units_count || 0);
    const percent = Number(user.progress_percent || 0);
    const isUnlocked = passedCount >= CFG.TOTAL_UNITS;
    const remainingUnits = Math.max(0, CFG.TOTAL_UNITS - passedCount);

    // 1. Summary Header & Progress Track
    const subtitleEl = document.getElementById("progress-summary-subtitle");
    const bigPercentEl = document.getElementById("progress-big-percent");
    const barFillEl = document.getElementById("progress-bar-fill");
    const statUnitsEl = document.getElementById("progress-stat-units");
    const statQuizEl = document.getElementById("progress-stat-quiz");
    const statTimeEl = document.getElementById("progress-stat-time");

    if (subtitleEl) {
      subtitleEl.textContent = isUnlocked
        ? `ผ่านเกณฑ์ครบทั้ง ${CFG.TOTAL_UNITS} หน่วยการเรียนรู้เรียบร้อยแล้ว`
        : `ผ่านเกณฑ์แล้ว ${passedCount} จาก ${CFG.TOTAL_UNITS} หน่วยการเรียนรู้ (เหลืออีก ${remainingUnits} หน่วยเพื่อปลดล็อกเกียรติบัตร)`;
    }
    if (bigPercentEl) bigPercentEl.textContent = `${percent}%`;
    const ringArcEl = document.getElementById("progress-ring-arc");
    if (ringArcEl) ringArcEl.setAttribute("stroke-dasharray", `${Math.min(100, Math.max(0, percent))} 100`);

    // แผนที่ความคืบหน้า: หนึ่งช่องต่อหนึ่งหน่วย กดเพื่อเปิดหน่วยนั้น
    const unitMapEl = document.getElementById("progress-unit-map");
    if (unitMapEl && window.AppUtils.getUnitState) {
      unitMapEl.innerHTML = CFG.UNITS_METADATA.map((u) => {
        const st = window.AppUtils.getUnitState(u.no, unitMap);
        const cls = st.passed ? "is-pass" : st.stepsDone > 0 || st.attempts > 0 ? "is-progress" : "is-idle";
        const label = st.passed ? "ผ่านเกณฑ์แล้ว" : cls === "is-progress" ? "กำลังเรียน" : "ยังไม่เริ่ม";
        return `<button type="button" class="unit-map-cell ${cls}" data-open-unit="${u.no}" aria-label="หน่วยที่ ${u.no} ${label}" title="หน่วยที่ ${u.no} ${label}">${String(u.no).padStart(2, "0")}</button>`;
      }).join("");
    }
    if (barFillEl) barFillEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    if (statUnitsEl) statUnitsEl.textContent = `${passedCount} / ${CFG.TOTAL_UNITS} หน่วย`;
    if (statQuizEl) {
      statQuizEl.textContent = `${user.total_quiz_score} / ${CFG.TOTAL_UNITS * CFG.QUESTIONS_PER_UNIT} คะแนน`;
    }
    if (statTimeEl) {
      statTimeEl.textContent = `${window.AppUtils.formatDuration(user.total_time_sec)} นาที`;
    }

    // 2. Strict Certificate Unlock Gate
    const gateBox = document.getElementById("progress-cert-gate-box");
    const gateTitle = document.getElementById("progress-cert-gate-title");
    const gatePill = document.getElementById("progress-cert-gate-pill");
    const gateDesc = document.getElementById("progress-cert-gate-desc");
    const downloadBtn = document.getElementById("progress-download-cert-btn");

    if (downloadBtn) {
      downloadBtn.disabled = !isUnlocked;
    }

    if (gateBox) {
      gateBox.classList.toggle("is-unlocked", isUnlocked);
      gateBox.style.removeProperty("background-color");
      gateBox.style.removeProperty("border-color");
    }

    if (isUnlocked) {
      if (gateTitle) {
        gateTitle.textContent = "สถานะเกียรติบัตร: ปลดล็อกแล้ว พร้อมดาวน์โหลด";
      }
      if (gatePill) {
        gatePill.className = "status-pill is-pass";
        gatePill.textContent = "ผ่านครบ 16/16 หน่วย (100%)";
      }
      if (gateDesc) {
        const issueDate = window.AppUtils.formatThaiDate(
          user.cert_issued_at || new Date().toISOString()
        );
        gateDesc.textContent = `คุณผ่านเกณฑ์การประเมินครบถ้วนทุกหน่วยแล้ว รหัสยืนยันเกียรติบัตร CDTI-21901-${user.student_id} (ออกให้ ณ วันที่ ${issueDate})`;
      }
    } else {
      if (gateTitle) {
        gateTitle.textContent = "สถานะเกียรติบัตร: ยังไม่ปลดล็อกการดาวน์โหลด";
      }
      if (gatePill) {
        gatePill.className = "status-pill is-warn";
        gatePill.textContent = `ยังขาดอีก ${remainingUnits} หน่วย`;
      }
      if (gateDesc) {
        gateDesc.textContent =
          "ระบบบังคับให้เรียนเนื้อหาและทำแบบทดสอบท้ายหน่วยได้คะแนนตั้งแต่ 8/10 (80%) ขึ้นไปครบทั้ง 16 หน่วยก่อน จึงจะสามารถกดดาวน์โหลดเกียรติบัตรได้";
      }
    }

    // 3. Filter Pills Counts
    document.querySelectorAll("[data-progress-filter]").forEach((btn) => {
      const f = btn.getAttribute("data-progress-filter");
      btn.classList.toggle("is-active", f === progressStatusFilter);
      if (f === "all") btn.textContent = `ทั้งหมด (${CFG.TOTAL_UNITS})`;
      if (f === "passed") btn.textContent = `ผ่านเกณฑ์แล้ว (${passedCount})`;
      if (f === "pending") btn.textContent = `ยังไม่ผ่านเกณฑ์ (${remainingUnits})`;
    });

    // 4. 16-Unit Status Rows
    const tbody = document.getElementById("progress-units-tbody");
    if (tbody) {
      const filtered = CFG.UNITS_METADATA.filter((u) => {
        const passed = Boolean(unitMap[u.no] && unitMap[u.no].is_passed);
        if (progressStatusFilter === "passed") return passed;
        if (progressStatusFilter === "pending") return !passed;
        return true;
      });

      if (filtered.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" class="table-empty">
              ${
                progressStatusFilter === "passed"
                  ? "ยังไม่มีหน่วยการเรียนรู้ที่สอบผ่านเกณฑ์ 80% เริ่มต้นเรียนหน่วยที่ 1 ได้ทันที"
                  : "ยอดเยี่ยม คุณสอบผ่านครบทุกหน่วยการเรียนรู้เรียบร้อยแล้ว"
              }
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = filtered
          .map((u) => {
            const prog = unitMap[u.no] || {};
            const isPassed = Boolean(prog.is_passed);
            const isRead = Boolean(prog.is_content_read);
            const stepsDone = Number(prog.steps_completed || 0);
            const attempts = Number(prog.attempts_count || 0);
            const bestScore = Number(prog.best_quiz_score || 0);
            const bestTime = Number(prog.best_quiz_time_sec || 0);

            let readLabel = "ยังเรียนไม่ครบหน่วย";
            let readClass = "";
            if (isRead) {
              readLabel = "เรียนครบแล้ว";
              readClass = "is-done";
            } else if (stepsDone > 0) {
              readLabel = `ยังเรียนไม่ครบ (${stepsDone} สเต็ป)`;
              readClass = "is-partial";
            }

            let statusPillClass = "is-neutral";
            let statusPillText = "รอเข้าเรียน";
            if (isPassed) {
              statusPillClass = "is-pass";
              statusPillText = "ผ่านเกณฑ์ 80%";
            } else if (attempts > 0) {
              statusPillClass = "is-warn";
              statusPillText = "ยังไม่ผ่านเกณฑ์";
            }

            return `
              <tr>
                <td>
                  <span class="unit-number-badge ${isPassed ? "is-done" : ""}">${esc(u.code)}</span>
                </td>
                <td>
                  <strong class="progress-unit-title">
                    ${window.AppUtils.formatUnitTitleHtml(u.title)}
                  </strong>
                  <span class="progress-unit-subtitle">
                    ${esc(u.subtitle)}
                  </span>
                </td>
                <td>
                  <span class="progress-read-state ${readClass}">${esc(readLabel)}</span>
                </td>
                <td class="num">
                  ${attempts > 0 ? `<strong>${bestScore}</strong> / 10` : `<span class="text-muted">- / 10</span>`}
                  <span class="score-dots" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<span class="score-dot ${attempts > 0 && i < bestScore ? (isPassed ? "is-pass" : "is-on") : ""}"></span>`).join("")}</span>
                </td>
                <td class="num">
                  ${
                    attempts > 0 && bestTime > 0
                      ? window.AppUtils.formatDuration(bestTime)
                      : `<span class="text-muted">--:--</span>`
                  }
                </td>
                <td>
                  <span class="status-pill ${statusPillClass}">${isPassed ? window.AppUtils.icon("check") : ""}${esc(statusPillText)}</span>
                </td>
                <td class="num">
                  <button
                    type="button"
                    class="${isPassed ? "btn-secondary" : "btn-primary"} btn-sm"
                    data-open-unit="${u.no}"
                  >
                    ${isPassed ? "ทบทวน" : "เข้าเรียน"}
                  </button>
                </td>
              </tr>
            `;
          })
          .join("");
      }
    }
  }

  /* ==========================================================================
     5. CERTIFICATE PREVIEW MODAL
     ========================================================================== */

  function openCertificateModal() {
    const user = window.AuthManager?.getCurrentUser();
    if (!user) return;

    const modal = document.getElementById("cert-preview-modal");
    const canvas = document.getElementById("modal-cert-preview-canvas");
    const lockNote = document.getElementById("modal-cert-lock-note");
    const dlBtn = document.getElementById("modal-cert-download-btn");
    if (!modal) return;

    const isUnlocked = Number(user.passed_units_count || 0) >= CFG.TOTAL_UNITS;
    const remaining = Math.max(0, CFG.TOTAL_UNITS - Number(user.passed_units_count || 0));

    if (window.MotionEngine) {
      window.MotionEngine.animateModalOpen(modal);
    } else {
      modal.classList.remove("hidden");
      document.body.classList.add("is-modal-open");
    }

    if (canvas && window.CertificateEngine) {
      window.CertificateEngine.renderCertificateCanvas(canvas, user, true);
    }

    if (dlBtn) {
      dlBtn.disabled = !isUnlocked;
    }

    if (lockNote) {
      lockNote.textContent = isUnlocked
        ? "ปลดล็อกครบ 100% แล้ว กดปุ่มดาวน์โหลดเพื่อบันทึกไฟล์ภาพเกียรติบัตร (.PNG)"
        : `ตัวอย่างเกียรติบัตรของคุณ (ต้องสอบผ่านอีก ${remaining} หน่วยจึงจะสามารถดาวน์โหลดได้)`;
    }
  }

  function closeCertificateModal() {
    const modal = document.getElementById("cert-preview-modal");
    if (modal) {
      if (window.MotionEngine) {
        window.MotionEngine.animateModalClose(modal);
      } else {
        modal.classList.add("hidden");
        const anyModalOpen = Boolean(document.querySelector(".modal-overlay:not(.hidden)"));
        if (!anyModalOpen) {
          document.body.classList.remove("is-modal-open");
        }
      }
    }
  }

  /* ==========================================================================
     7. GLOBAL EVENT DELEGATION & BOOTSTRAP
     ========================================================================== */

  function bindGlobalEvents() {
    // Delegated clicks for [data-nav-view], [data-open-unit], [data-progress-filter]
    document.addEventListener("click", (e) => {
      const navTrigger = e.target.closest("[data-nav-view]");
      if (navTrigger) {
        e.preventDefault();
        const targetView = navTrigger.getAttribute("data-nav-view");
        switchView(targetView, {
          resetToDirectory: targetView === "lessons"
        });
        return;
      }

      const openUnitBtn = e.target.closest("[data-open-unit]");
      if (openUnitBtn) {
        e.preventDefault();
        openUnitInLessons(Number(openUnitBtn.getAttribute("data-open-unit")));
        return;
      }

      const progFilterBtn = e.target.closest("[data-progress-filter]");
      if (progFilterBtn) {
        progressStatusFilter = progFilterBtn.getAttribute("data-progress-filter") || "all";
        renderProgressView();
        return;
      }

      const scannerModeBtn = e.target.closest("[data-scanner-mode]");
      if (scannerModeBtn) {
        e.preventDefault();
        setScannerMode(scannerModeBtn.getAttribute("data-scanner-mode") || "laser", true);
        return;
      }

      const scanTriggerBtn = e.target.closest("#scanner-scan-trigger-btn");
      if (scanTriggerBtn) {
        e.preventDefault();
        setScannerMode(activeScannerMode, true);
        return;
      }
    });

    // Brand Home Link
    document.getElementById("navbar-brand-home")?.addEventListener("click", (e) => {
      e.preventDefault();
      switchView("home");
    });

    // Certificate Modal Triggers
    document
      .getElementById("home-open-cert-modal-btn")
      ?.addEventListener("click", openCertificateModal);
    document
      .getElementById("home-cert-frame-trigger")
      ?.addEventListener("click", openCertificateModal);
    document
      .getElementById("home-cert-frame-trigger")
      ?.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openCertificateModal();
        }
      });
    document
      .getElementById("progress-preview-cert-btn")
      ?.addEventListener("click", openCertificateModal);
    document
      .getElementById("close-cert-modal-btn")
      ?.addEventListener("click", closeCertificateModal);
    document
      .getElementById("modal-cert-close-secondary")
      ?.addEventListener("click", closeCertificateModal);
    document.getElementById("cert-preview-modal")?.addEventListener("click", (e) => {
      if (e.target && e.target.id === "cert-preview-modal") {
        closeCertificateModal();
      }
    });

    // Certificate Download Buttons (Progress View + Modal)
    document
      .getElementById("progress-download-cert-btn")
      ?.addEventListener("click", () => {
        window.CertificateEngine?.downloadOfficialCertificate();
      });
    document
      .getElementById("modal-cert-download-btn")
      ?.addEventListener("click", () => {
        window.CertificateEngine?.downloadOfficialCertificate();
      });

    // Escape key closes open modals + Number keys [1-3] switch views when outside inputs/games
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCertificateModal();
        window.AuthManager?.closeProfileModal?.();
        return;
      }

      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable) {
        return;
      }
      if (!window.AuthManager?.isAuthenticated()) return;
      if (document.querySelector(".modal-overlay:not(.hidden)")) return;
      // Avoid interfering with quiz 1-4 answer keys when quiz is open
      const lessonWs = document.getElementById("lesson-workspace");
      if (activeView === "lessons" && lessonWs && !lessonWs.classList.contains("hidden")) {
        return;
      }

      if (e.key === "1") switchView("home");
      else if (e.key === "2") switchView("lessons", { resetToDirectory: true });
      else if (e.key === "3") switchView("progress");
    });
  }

  /* ==========================================================================
     8. 8-BIT CYBER DATA INPUT SIMULATOR & OPTICAL SCANNER CONTROLLER
     ========================================================================== */

  const SCANNER_PRESETS = {
    laser: {
      id: "laser",
      badge: "650nm RED LASER",
      fpsBadge: "OPTICAL 60FPS",
      sensorTitle: "650nm Laser Photodiode",
      adcTitle: "Light/Dark Pulse to Binary",
      busTitle: "USB-HID Barcode Stream",
      latency: "1.2ms",
      raw: "REFLECTANCE_PULSE: [1,0,1,1,0,0,1,0] @ 650nm RED BEAM",
      bin: "UPC-A: 885012345678  |  MOD10 CHECK_DIGIT: 8 [VALID]",
      out: "ยิงสแกนแถบรหัสแท่ง 1 มิติสำเร็จ: แปลงแถบสว่าง-มืดเป็นชุดรหัสตัวเลขส่งเข้าบัสระบบทันที"
    },
    qr: {
      id: "qr",
      badge: "2D CMOS IMAGER",
      fpsBadge: "MATRIX 30FPS",
      sensorTitle: "CMOS Matrix Sensor (2D)",
      adcTitle: "Finder Reticle & RS-ECC",
      busTitle: "Payload Byte Matrix Buffer",
      latency: "2.8ms",
      raw: "FINDER_DETECT(3/3) -> TIMING_ALIGN(OK) -> MASK_PATTERN(010)",
      bin: "PAYLOAD: https://cdti.ac.th/course/21901-2017  |  ECC: Level-H (30%)",
      out: "จับภาพรหัสสองมิติ 33x33 โมดูลและกู้คืนความผิดพลาดด้วย Reed-Solomon สำเร็จ 100%"
    },
    rfid: {
      id: "rfid",
      badge: "13.56MHz INDUCTION",
      fpsBadge: "WIRELESS FIELD",
      sensorTitle: "Copper Coil Antenna",
      adcTitle: "Backscatter Demodulation",
      busTitle: "Wiegand / SPI Buffer",
      latency: "0.8ms",
      raw: "EM_INDUCTION_13.56MHz -> LOAD_MODULATION -> ANTI_COLLISION(OK)",
      bin: "EPC_UID: 04:A2:9C:81:F0:22:80  |  AUTH_TOKEN: SHA256_PASS",
      out: "เหนี่ยวนำสนามแม่เหล็กไฟฟ้าไร้สาย สแกนสมาร์ตการ์ดผ่านอากาศโดยไม่ต้องสัมผัสพื้นผิว"
    },
    bio: {
      id: "bio",
      badge: "CAPACITIVE MESH",
      fpsBadge: "508 DPI HIGH-RES",
      sensorTitle: "Capacitive Ridge Array",
      adcTitle: "Minutiae Vector Coordinates",
      busTitle: "Secure Enclave Template",
      latency: "4.1ms",
      raw: "RIDGE_COUNT: 48  |  BIFURCATIONS: 14  |  ENDINGS: 22",
      bin: "MINUTIAE_HASH: 7a8f9c1b3e4d5678  |  MATCH_SCORE: 99.6%",
      out: "ประมวลผลจุดแยกและจุดสิ้นสุดของลายนิ้วมือ แปลงเป็นเวกเตอร์ไบโอเมตริกยืนยันตัวตนสำเร็จ"
    }
  };

  let activeScannerMode = "laser";

  function setScannerMode(mode, triggerBeep = true) {
    activeScannerMode = mode;
    const preset = SCANNER_PRESETS[mode] || SCANNER_PRESETS.laser;

    // Update active tab buttons
    document.querySelectorAll("[data-scanner-mode]").forEach((btn) => {
      const isActive = btn.getAttribute("data-scanner-mode") === mode;
      btn.classList.toggle("is-active", isActive);
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    // Update target view
    document.querySelectorAll(".cyber-target-item").forEach((item) => {
      item.classList.remove("is-active");
    });
    const targetItem = document.getElementById(`target-view-${mode}`);
    if (targetItem) targetItem.classList.add("is-active");

    // Update laser beam color/glow
    const beam = document.getElementById("cyber-laser-beam");
    if (beam) {
      beam.classList.remove("is-beaming");
      void beam.offsetWidth;
      beam.classList.add("is-beaming");
    }

    // Update Telemetry & Pipeline nodes
    const fpsBadge = document.getElementById("scanner-fps-badge");
    const latBadge = document.getElementById("scanner-latency-badge");
    const sensorNode = document.getElementById("p-sensor-type");
    const adcNode = document.getElementById("p-adc-type");
    const busNode = document.getElementById("p-bus-type");
    const rawEl = document.getElementById("scanner-stream-raw");
    const binEl = document.getElementById("scanner-stream-binary");
    const outEl = document.getElementById("scanner-stream-output");

    if (fpsBadge) fpsBadge.textContent = preset.fpsBadge;
    if (latBadge) latBadge.textContent = `LATENCY: ${preset.latency}`;
    if (sensorNode) sensorNode.textContent = preset.sensorTitle;
    if (adcNode) adcNode.textContent = preset.adcTitle;
    if (busNode) busNode.textContent = preset.busTitle;
    if (rawEl) rawEl.textContent = preset.raw;
    if (binEl) binEl.textContent = preset.bin;
    if (outEl) outEl.textContent = preset.out;

    if (triggerBeep && window.SoundEngine) {
      window.SoundEngine.playLaserScan?.();
    }

    // Flash chamber frame
    const frame = document.getElementById("scanner-target-frame");
    if (frame) {
      frame.classList.remove("is-scanning-pulse");
      void frame.offsetWidth;
      frame.classList.add("is-scanning-pulse");
    }
  }

  async function bootstrap() {
    bindGlobalEvents();
    const loggedIn = await window.AuthManager.initAuth();
    if (loggedIn) {
      switchView("home", { scrollTop: false });
    }
    // Initialize default scanner state
    setScannerMode("laser", false);
  }

  window.AppController = {
    switchView,
    openUnitInLessons,
    refreshActiveView: renderActiveView,
    onAuthSuccess() {
      switchView("home");
    },
    getActiveView: () => activeView,
    getSelectedUnitNo: () => selectedUnitNo
  };

  document.addEventListener("DOMContentLoaded", bootstrap);
})();
