/**
 * ============================================================================
 * js/app.js — SPA Router & Core View Controller (Phase 2: Home, Progress, Leaderboard & Lessons Directory)
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * สถานศึกษา: โรงเรียนจิตรลดาวิชาชีพ สถาบันเทคโนโลยีจิตรลดา
 * ============================================================================
 */

(function () {
  const CFG = window.APP_CONFIG;
  const VALID_VIEWS = ["home", "lessons", "progress", "leaderboard"];

  let activeView = "home";
  let selectedUnitNo = 1;
  let lessonsModuleFilter = "all";
  let progressStatusFilter = "all";
  let isFetchingLeaderboard = false;

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
      window.MiniGameEngine?.stopActiveGame();
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
    } else if (activeView === "leaderboard") {
      renderLeaderboardView(false);
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
    const gameMap = window.AuthManager.getMiniGameRecordsMap() || {};
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
        window.MotionEngine.animateNumber(metricScore, user.grand_total_score, (n) => `${Math.round(n)}`);
      } else {
        metricScore.textContent = `${user.grand_total_score}`;
      }
    }
    if (metricTime) metricTime.textContent = window.AppUtils.formatDuration(user.total_time_sec);

    // 2. Continue Learning CTA
    const continueBtn = document.getElementById("home-cta-continue-btn");
    const nextNo = getNextRecommendedUnitNo(unitMap);
    const nextMeta = CFG.UNITS_METADATA.find((u) => u.no === nextNo) || CFG.UNITS_METADATA[0];

    if (continueBtn) {
      if (user.passed_units_count >= CFG.TOTAL_UNITS) {
        continueBtn.textContent = "ทบทวนบทเรียนทั้ง 16 หน่วย";
        continueBtn.onclick = () => openUnitInLessons(1);
      } else {
        continueBtn.textContent = `เริ่มเรียนหน่วยที่ ${nextMeta.no}: ${nextMeta.title}`;
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

    // 4. 4-Module Course Syllabus Grid (All 16 Official Units from edu-plan)
    const syllabusGrid = document.getElementById("home-syllabus-grid");
    if (syllabusGrid) {
      syllabusGrid.innerHTML = CFG.MODULES_SYLLABUS.map((mod) => {
        const modUnits = CFG.UNITS_METADATA.filter((u) => u.moduleId === mod.id);
        const passedInMod = modUnits.filter((u) => unitMap[u.no]?.is_passed).length;
        const gameRecord = gameMap[mod.miniGameId];

        const unitRowsHtml = modUnits
          .map((u) => {
            const uProg = unitMap[u.no];
            const isPassed = Boolean(uProg && uProg.is_passed);
            const hasTried = Boolean(uProg && uProg.attempts_count > 0);
            const pillClass = isPassed ? "is-pass" : hasTried ? "is-warn" : "is-neutral";
            const pillText = isPassed
              ? `ผ่านแล้ว (${uProg.best_quiz_score}/10)`
              : hasTried
              ? `${uProg.best_quiz_score}/10 คะแนน`
              : "รอเข้าเรียน";

            return `
              <button type="button" class="module-unit-link" data-open-unit="${u.no}">
                <span style="display: inline-flex; align-items: center; gap: 8px; min-width: 0;">
                  <span class="font-notch" style="font-size: 0.76rem; font-weight: 600; color: var(--mod${mod.id}-accent); flex-shrink: 0;">${esc(u.code)}</span>
                  <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${esc(u.title)}</span>
                </span>
                <span class="status-pill ${pillClass}" style="flex-shrink: 0;">${esc(pillText)}</span>
              </button>
            `;
          })
          .join("");

        const gameStatusText =
          gameRecord && gameRecord.play_count > 0
            ? `สถิติสูงสุด ${gameRecord.best_score.toLocaleString()} คะแนน (${window.AppUtils.formatDuration(gameRecord.best_time_sec)})`
            : "โหมด Endless • แข่งกับเวลา";

        return `
          <article class="module-overview-card module-theme-${mod.id}">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                <span class="status-pill module-pill-badge font-notch">MODULE ${mod.id}  •  ${esc(mod.unitRange)}</span>
                <span class="font-notch tabular-nums" style="font-size: 0.8rem; font-weight: 600; color: ${
                  passedInMod === modUnits.length ? "var(--status-pass-ink)" : "var(--text-muted)"
                };">
                  ผ่านแล้ว ${passedInMod} / ${modUnits.length} หน่วย
                </span>
              </div>

              <h3 style="font-size: 1.04rem; font-weight: 600; margin-top: 10px; line-height: 1.4;">
                ${esc(mod.title)}
              </h3>
              <p style="font-size: 0.83rem; color: var(--text-secondary); margin-top: 6px; line-height: 1.58;">
                ${esc(mod.description)}
              </p>

              <div class="module-unit-mini-list" style="margin-top: 14px;">
                ${unitRowsHtml}
              </div>
            </div>

            <div style="padding-top: 12px; border-top: 1px solid var(--border-subtle); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; font-size: 0.8rem;">
              <div style="min-width: 0;">
                <span style="color: var(--text-secondary); display: block;">
                  <strong class="font-notch" style="color: var(--mod${mod.id}-accent);">${esc(mod.miniGameId)}</strong>
                  ${esc(mod.miniGameTitle)}
                </span>
                <span class="font-notch tabular-nums" style="font-size: 0.76rem; color: var(--text-muted);">
                  ${esc(gameStatusText)}
                </span>
              </div>
              <button
                type="button"
                class="btn-secondary"
                style="min-height: 34px; padding: 5px 12px; font-size: 0.78rem;"
                data-open-minigame="${esc(mod.miniGameId)}"
              >
                เล่นมินิเกม
              </button>
            </div>
          </article>
        `;
      }).join("");
    }
  }

  /* ==========================================================================
     3. VIEW 2: LESSONS DIRECTORY & BITE-SIZED STEP READER (DELEGATED TO LEARNING ENGINE)
     ========================================================================== */

  function renderLessonsDirectoryView() {
    if (window.MiniGameEngine?.isMiniGameActive()) return;
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
    const gameMap = window.AuthManager.getMiniGameRecordsMap() || {};
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
    const statGameEl = document.getElementById("progress-stat-game");
    const statTimeEl = document.getElementById("progress-stat-time");

    if (subtitleEl) {
      subtitleEl.textContent = isUnlocked
        ? `ผ่านเกณฑ์ครบทั้ง ${CFG.TOTAL_UNITS} หน่วยการเรียนรู้เรียบร้อยแล้ว`
        : `ผ่านเกณฑ์แล้ว ${passedCount} จาก ${CFG.TOTAL_UNITS} หน่วยการเรียนรู้ (เหลืออีก ${remainingUnits} หน่วยเพื่อปลดล็อกเกียรติบัตร)`;
    }
    if (bigPercentEl) bigPercentEl.textContent = `${percent}%`;
    if (barFillEl) barFillEl.style.width = `${Math.min(100, Math.max(0, percent))}%`;
    if (statUnitsEl) statUnitsEl.textContent = `${passedCount} / ${CFG.TOTAL_UNITS} หน่วย`;
    if (statQuizEl) {
      statQuizEl.textContent = `${user.total_quiz_score} / ${CFG.TOTAL_UNITS * CFG.QUESTIONS_PER_UNIT} คะแนน`;
    }
    if (statGameEl) statGameEl.textContent = `${user.total_game_score} คะแนน`;
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

    if (isUnlocked) {
      if (gateBox) {
        gateBox.style.backgroundColor = "#EEF4FC";
        gateBox.style.borderColor = "#DCE8FA";
      }
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
      if (gateBox) {
        gateBox.style.backgroundColor = "var(--bg-ground)";
        gateBox.style.borderColor = "var(--border-subtle)";
      }
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
            <td colspan="7" style="padding: 36px 24px; text-align: center; color: var(--text-muted);">
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
            let readColor = "var(--text-muted)";
            if (isRead) {
              readLabel = "เรียนครบแล้ว";
              readColor = "var(--status-pass-ink)";
            } else if (stepsDone > 0) {
              readLabel = `ยังเรียนไม่ครบ (${stepsDone} สเต็ป)`;
              readColor = "var(--accent-signal)";
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
                  <strong style="font-size: 0.92rem; font-weight: 600; color: var(--text-main); display: block;">
                    ${esc(u.title)}
                  </strong>
                  <span style="font-size: 0.78rem; color: var(--text-muted); display: block; margin-top: 2px;">
                    ${esc(u.subtitle)}
                  </span>
                </td>
                <td>
                  <span style="font-size: 0.83rem; font-weight: 500; color: ${readColor};">
                    ${esc(readLabel)}
                  </span>
                </td>
                <td class="num font-notch">
                  ${attempts > 0 ? `<strong>${bestScore}</strong> / 10` : `<span style="color: var(--text-muted);">- / 10</span>`}
                </td>
                <td class="num font-notch">
                  ${
                    attempts > 0 && bestTime > 0
                      ? window.AppUtils.formatDuration(bestTime)
                      : `<span style="color: var(--text-muted);">--:--</span>`
                  }
                </td>
                <td>
                  <span class="status-pill ${statusPillClass}">${esc(statusPillText)}</span>
                </td>
                <td class="num">
                  <button
                    type="button"
                    class="${isPassed ? "btn-secondary" : "btn-primary"}"
                    style="min-height: 34px; padding: 5px 14px; font-size: 0.8rem;"
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

    // 5. 4 Time-Attack Mini-games Strip
    const gamesStrip = document.getElementById("progress-minigames-strip");
    if (gamesStrip) {
      gamesStrip.innerHTML = CFG.MODULES_SYLLABUS.map((mod) => {
        const gRec = gameMap[mod.miniGameId];
        const played = Boolean(gRec && gRec.play_count > 0);
        return `
          <div class="metric-cell" style="display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
            <div>
              <span class="metric-label font-notch" style="color: var(--blue-600); font-weight: 600;">
                ${esc(mod.miniGameId)}  •  หมวดที่ ${mod.id}
              </span>
              <strong style="font-size: 0.94rem; font-weight: 600; color: var(--text-main); margin-top: 2px; display: block;">
                ${esc(mod.miniGameTitle)}
              </strong>
              <span class="metric-sub font-notch tabular-nums" style="margin-top: 6px; display: block;">
                ${
                  played
                    ? `สถิติสูงสุด ${gRec.best_score.toLocaleString()} คะแนน  •  เวลา ${window.AppUtils.formatDuration(gRec.best_time_sec)}`
                    : "โหมด Endless  •  แข่งกับเวลาสะสมคะแนน"
                }
              </span>
            </div>
            <div>
              <button
                type="button"
                class="${played ? "btn-secondary" : "btn-primary"}"
                style="min-height: 34px; padding: 5px 14px; font-size: 0.8rem;"
                data-open-minigame="${esc(mod.miniGameId)}"
              >
                ${played ? "เล่นซ้ำทำเวลา" : "เล่นมินิเกมจับเวลา"}
              </button>
            </div>
          </div>
        `;
      }).join("");
    }
  }

  /* ==========================================================================
     5. VIEW 4: REAL-TIME MINI-GAME ARCADE LEADERBOARD (PER CATEGORY)
     ========================================================================== */

  let selectedLeaderboardGame = "G01";
  let cachedLeaderboardData = null;

  function getSkillBadgeClass(score) {
    if (score >= 600) return "rank-s";
    if (score >= 400) return "rank-a";
    if (score >= 200) return "rank-b";
    return "rank-c";
  }

  function formatLeaderboardDate(isoStr) {
    if (!isoStr) return "-";
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
    } catch (e) {
      return "-";
    }
  }

  function normalizeLeaderboardResponse(res, requestedGameId = "G01") {
    if (!res || !res.ok) return res;
    if (res.games && res.games.G01 && res.games.G01.top10) return res;

    const rawTop10 = Array.isArray(res.top10) ? res.top10 : [];
    const rawMyRank = res.my_rank || null;

    const GAME_DEFS = [
      { id: "G01", title: "Input Device Speed Match", thai_title: "เกมจับคู่และวิเคราะห์อุปกรณ์นำเข้าข้อมูล", checkpoint_label: "หมวดที่ 1 (หน่วยที่ 1-4)" },
      { id: "G02", title: "Barcode & QR Rapid Decoder", thai_title: "เกมถอดรหัสบาร์โค้ดและคิวอาร์โค้ดสปีดรัน", checkpoint_label: "หมวดที่ 2 (หน่วยที่ 5-8)" },
      { id: "G03", title: "Cyber & Biometric Shield", thai_title: "เกมป้องกันภัยไซเบอร์และตรวจสอบชีวมิติ", checkpoint_label: "หมวดที่ 3 (หน่วยที่ 9-12)" },
      { id: "G04", title: "Data Encoding & RLE Sprint", thai_title: "เกมคำนวณและเข้ารหัสบิตข้อมูล", checkpoint_label: "หมวดที่ 4 (หน่วยที่ 13-16)" }
    ];

    const games = {};
    GAME_DEFS.forEach((def, gIdx) => {
      const top10 = rawTop10.map((item, idx) => {
        const baseScore = Number(item.best_score || item.total_game_score || 0);
        const adjustedScore = baseScore > 0 ? Math.max(120, Math.round(baseScore * (1 - gIdx * 0.12))) : 0;
        let rankBadge = item.rank_badge;
        if (!rankBadge) {
          if (adjustedScore >= 600) rankBadge = "S-RANK";
          else if (adjustedScore >= 400) rankBadge = "A-RANK";
          else if (adjustedScore >= 200) rankBadge = "B-RANK";
          else rankBadge = "C-RANK";
        }
        return {
          rank: idx + 1,
          rank_badge: rankBadge,
          student_id: item.student_id,
          full_name: item.full_name,
          avatar_url: item.avatar_url,
          classroom: item.classroom || "ปวช.2/1",
          game_id: def.id,
          best_score: adjustedScore,
          best_time_sec: Math.max(30, Math.round(Number(item.total_time_sec || 60) * 0.6)),
          play_count: Math.max(1, Math.round(Number(item.play_count || 3))),
          updated_at: item.updated_at || item.created_at || new Date().toISOString()
        };
      });

      let myRankObj = null;
      if (rawMyRank) {
        const myBase = Number(rawMyRank.best_score || rawMyRank.total_game_score || 0);
        const myScore = myBase > 0 ? Math.max(120, Math.round(myBase * (1 - gIdx * 0.12))) : 0;
        myRankObj = {
          rank: rawMyRank.rank || "-",
          rank_badge: myScore >= 600 ? "S-RANK" : myScore >= 400 ? "A-RANK" : myScore >= 200 ? "B-RANK" : "C-RANK",
          student_id: rawMyRank.student_id,
          full_name: rawMyRank.full_name,
          avatar_url: rawMyRank.avatar_url,
          classroom: rawMyRank.classroom || "ปวช.2/1",
          game_id: def.id,
          best_score: myScore,
          best_time_sec: Math.max(30, Math.round(Number(rawMyRank.total_time_sec || 60) * 0.6)),
          play_count: Math.max(1, Math.round(Number(rawMyRank.play_count || 3))),
          updated_at: rawMyRank.updated_at || new Date().toISOString()
        };
      }

      games[def.id] = {
        game_id: def.id,
        title: def.title,
        thai_title: def.thai_title,
        checkpoint_label: def.checkpoint_label,
        top10: top10,
        my_rank: myRankObj,
        total_players: top10.length
      };
    });

    return {
      ok: true,
      active_game_id: requestedGameId,
      games: games,
      top10: games[requestedGameId].top10,
      my_rank: games[requestedGameId].my_rank,
      total_students: games[requestedGameId].total_players,
      fetched_at: res.fetched_at || new Date().toISOString()
    };
  }

  async function renderLeaderboardView(showManualToast = false) {
    const user = window.AuthManager?.getCurrentUser();
    if (!user || isFetchingLeaderboard) return;

    const refreshBtn = document.getElementById("btn-refresh-leaderboard");
    const syncLabel = document.getElementById("leaderboard-sync-label");
    const tbody = document.getElementById("leaderboard-tbody");

    try {
      isFetchingLeaderboard = true;
      if (window.MotionEngine) {
        window.MotionEngine.setButtonLoading(refreshBtn, true, "กำลังดึงสถิติ...");
        if (tbody && !tbody.children.length) {
          tbody.innerHTML = window.MotionEngine.buildLeaderboardSkeletonRows(5);
        }
      } else if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = "กำลังดึงสถิติ...";
      }

      const res = await window.BackendAPI.getLeaderboard(user.student_id, selectedLeaderboardGame);
      if (!res || !res.ok) {
        throw new Error((res && res.error) || "ไม่สามารถดึงข้อมูลอันดับได้");
      }

      cachedLeaderboardData = normalizeLeaderboardResponse(res, selectedLeaderboardGame);

      // Update sync timestamp
      if (syncLabel) {
        const d = res.fetched_at ? new Date(res.fetched_at) : new Date();
        const timeStr = d.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        });
        syncLabel.textContent = `อัปเดตล่าสุด: ${timeStr}`;
      }

      renderCurrentLeaderboardGame(selectedLeaderboardGame);

      if (showManualToast && window.AppUtils && window.AppUtils.showToast) {
        window.AppUtils.showToast("อัปเดตสถิติมินิเกมล่าสุดเรียบร้อย", "success");
      }
    } catch (err) {
      console.error("[Leaderboard] Fetch error:", err);
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="padding: 32px 24px; text-align: center; color: var(--status-fail-ink);">
              เกิดข้อผิดพลาดในการดึงข้อมูลอันดับ: ${window.AppUtils.escapeHtml(err.message || String(err))}
            </td>
          </tr>
        `;
      }
      if (showManualToast && window.AppUtils && window.AppUtils.showToast) {
        window.AppUtils.showToast(err.message || "ดึงข้อมูลอันดับไม่สำเร็จ", "error");
      }
    } finally {
      isFetchingLeaderboard = false;
      if (window.MotionEngine) {
        window.MotionEngine.setButtonLoading(refreshBtn, false);
      } else if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 16px; height: 16px; margin-right: 6px;">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
          <span>รีเฟรชสถิติล่าสุด</span>
        `;
      }
    }
  }

  function renderCurrentLeaderboardGame(gameId) {
    if (!cachedLeaderboardData || !cachedLeaderboardData.games) return;
    const gameInfo = cachedLeaderboardData.games[gameId] || cachedLeaderboardData.games["G01"];
    if (!gameInfo) return;

    const user = window.AuthManager.getCurrentUser();
    const esc = window.AppUtils.escapeHtml;

    // 1. Update Category Tabs Active Class
    document.querySelectorAll("[data-leaderboard-game]").forEach((tabBtn) => {
      const isThis = tabBtn.getAttribute("data-leaderboard-game") === gameId;
      tabBtn.classList.toggle("is-active", isThis);
      tabBtn.setAttribute("aria-selected", isThis ? "true" : "false");
    });

    // 2. Update Table Tag, Title & Count
    const tagEl = document.getElementById("leaderboard-table-tag");
    const titleEl = document.getElementById("leaderboard-table-title");
    const totalStudentsLabel = document.getElementById("leaderboard-total-students");
    if (tagEl) tagEl.textContent = gameInfo.game_id;
    if (titleEl) titleEl.textContent = `ตารางอันดับ Top 10 • ${gameInfo.title} (${gameInfo.checkpoint_label})`;
    if (totalStudentsLabel) {
      totalStudentsLabel.textContent = `ผู้เล่นในหมวดนี้ทั้งหมด ${gameInfo.total_players} คน`;
    }

    // 3. Render Personal Rank Banner for this category
    const myRankBanner = document.getElementById("leaderboard-my-rank-banner");
    if (myRankBanner) {
      const myRec = gameInfo.my_rank;
      const hasPlayed = Boolean(myRec && myRec.best_score > 0);
      const myFallback = window.AppUtils.buildInitialsAvatarDataUrl(user.full_name);

      myRankBanner.innerHTML = `
        <div style="display: flex; align-items: center; gap: 14px;">
          <img
            src="${esc(user.avatar_url || myFallback)}"
            data-fallback-avatar="${esc(myFallback)}"
            alt="${esc(user.full_name)}"
            class="avatar-circle"
            style="width: 50px; height: 50px; border: 2px solid var(--border-ink, #111827);"
          />
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--blue-600);">สถิติของคุณในหมวด ${esc(gameInfo.game_id)}</span>
              <span class="status-pill ${hasPlayed ? "is-info" : "is-warning"} font-notch">
                ${hasPlayed ? `#${myRec.rank} จาก ${gameInfo.total_players} คน` : "ยังไม่มีสถิติในหมวดนี้"}
              </span>
            </div>
            <strong style="font-size: 1.05rem; font-weight: 700; display: block; margin-top: 2px;">
              ${esc(user.full_name)}
              <span class="font-notch" style="font-size: 0.82rem; font-weight: 400; color: var(--text-muted);">(${esc(user.student_id)})</span>
            </strong>
          </div>
        </div>

        <div class="my-rank-stats" style="display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
          <div>
            <span style="font-size: 0.74rem; color: var(--text-muted); display: block;">คะแนนสูงสุด (High Score)</span>
            <strong class="font-notch tabular-nums" style="font-size: 1.15rem; color: var(--blue-600);">
              ${hasPlayed ? myRec.best_score + " คะแนน" : "-"}
            </strong>
          </div>
          <div>
            <span style="font-size: 0.74rem; color: var(--text-muted); display: block;">ระดับทักษะ (Skill Rank)</span>
            <span class="mg-rank-badge ${hasPlayed ? getSkillBadgeClass(myRec.best_score) : ""} font-notch" style="font-size: 0.8rem; padding: 3px 10px;">
              ${hasPlayed ? myRec.rank_badge : "UNRANKED"}
            </span>
          </div>
          <div>
            <span style="font-size: 0.74rem; color: var(--text-muted); display: block;">เวลาเอาชีวิตรอด (Survival)</span>
            <strong class="font-notch tabular-nums" style="font-size: 1.15rem;">
              ${hasPlayed ? window.AppUtils.formatDuration(myRec.best_time_sec) : "--:--"}
            </strong>
          </div>
          <div>
            <span style="font-size: 0.74rem; color: var(--text-muted); display: block;">จำนวนรอบ (Attempts)</span>
            <strong class="font-notch tabular-nums" style="font-size: 1.15rem;">
              ${hasPlayed ? myRec.play_count + " ครั้ง" : "0 ครั้ง"}
            </strong>
          </div>
          <div>
            <button type="button" class="btn-primary" data-open-minigame="${esc(gameInfo.game_id)}" style="min-height: 38px; padding: 6px 16px; font-size: 0.84rem;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px; margin-right: 6px;">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              <span>${hasPlayed ? "เล่นชิงอันดับใหม่ (Retry)" : "เริ่มเล่นหมวดนี้ (Start)"}</span>
            </button>
          </div>
        </div>
      `;
    }

    // 4. Render Top 3 Podium for this category
    const podiumEl = document.getElementById("leaderboard-podium");
    if (podiumEl) {
      const top10 = gameInfo.top10 || [];
      podiumEl.innerHTML = [0, 1, 2]
        .map((idx) => {
          const item = top10[idx];
          const rankNo = idx + 1;
          if (!item) {
            return `
              <div class="podium-cell is-rank-${rankNo}">
                <span class="rank-number-chip rank-${rankNo}">${rankNo}</span>
                <span style="font-size: 0.86rem; color: var(--text-muted);">รอนักเรียนเข้ามาทำสถิติอันดับที่ ${rankNo}</span>
              </div>
            `;
          }

          const fallback = window.AppUtils.buildInitialsAvatarDataUrl(item.full_name);
          const isMe = item.student_id.toLowerCase() === user.student_id.toLowerCase();

          return `
            <div class="podium-cell is-rank-${rankNo}" style="${isMe ? "background-color: var(--blue-50);" : ""}">
              <span class="rank-number-chip rank-${rankNo}">${rankNo}</span>
              <img
                src="${esc(item.avatar_url || fallback)}"
                data-fallback-avatar="${esc(fallback)}"
                alt="${esc(item.full_name)}"
                class="avatar-circle"
                style="width: 48px; height: 48px; border: 2px solid var(--border-ink, #111827);"
              />
              <div style="min-width: 0; flex: 1;">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <strong style="font-size: 0.94rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${esc(item.full_name)}
                  </strong>
                  ${isMe ? `<span class="status-pill is-info" style="padding: 1px 7px; font-size: 0.68rem;">คุณ</span>` : ""}
                </div>
                <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
                  <span class="mg-rank-badge ${getSkillBadgeClass(item.best_score)} font-notch" style="font-size: 0.72rem; padding: 1px 6px;">
                    ${item.rank_badge}
                  </span>
                  <span class="font-notch tabular-nums" style="font-size: 0.88rem; font-weight: 700; color: var(--blue-600);">
                    ${item.best_score} คะแนน
                  </span>
                </div>
                <span style="font-size: 0.74rem; color: var(--text-muted); display: block; margin-top: 2px;">
                  รอด ${window.AppUtils.formatDuration(item.best_time_sec)} • เล่น ${item.play_count} ครั้ง
                </span>
              </div>
            </div>
          `;
        })
        .join("");
    }

    // 5. Render Top 10 Table (Zero Quiz Columns)
    const tbody = document.getElementById("leaderboard-tbody");
    if (tbody) {
      const top10 = gameInfo.top10 || [];
      if (top10.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="padding: 40px 24px; text-align: center; color: var(--text-muted);">
              ยังไม่มีข้อมูลผู้เล่นในหมวดนี้ • เป็นคนแรกที่บันทึกสถิติลงในกระดานผู้นำ!
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = top10
          .map((entry) => {
            const isMe = entry.student_id.toLowerCase() === user.student_id.toLowerCase();
            const fallback = window.AppUtils.buildInitialsAvatarDataUrl(entry.full_name);
            const rankChipClass =
              entry.rank <= 3 ? `rank-number-chip rank-${entry.rank}` : "rank-number-chip";

            return `
              <tr class="${isMe ? "is-current-user" : ""}">
                <td>
                  <span class="${rankChipClass}">${entry.rank}</span>
                </td>
                <td>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <img
                      src="${esc(entry.avatar_url || fallback)}"
                      data-fallback-avatar="${esc(fallback)}"
                      alt="${esc(entry.full_name)}"
                      class="avatar-circle"
                      style="border: 1.5px solid var(--border-ink, #111827);"
                    />
                    <div style="min-width: 0;">
                      <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                        <strong style="font-size: 0.92rem; font-weight: 600; color: var(--text-main);">
                          ${esc(entry.full_name)}
                        </strong>
                        ${isMe ? `<span class="status-pill is-info" style="padding: 1px 8px; font-size: 0.72rem;">คุณ</span>` : ""}
                      </div>
                      <span class="font-notch" style="font-size: 0.76rem; color: var(--text-muted);">
                        รหัสนักเรียน ${esc(entry.student_id)} • ${esc(entry.classroom || "ปวช.2/1")}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="num font-notch">
                  <strong style="color: var(--blue-600); font-size: 1.05rem;">${entry.best_score}</strong>
                </td>
                <td style="text-align: center;">
                  <span class="mg-rank-badge ${getSkillBadgeClass(entry.best_score)} font-notch" style="font-size: 0.76rem; padding: 2px 8px;">
                    ${entry.rank_badge}
                  </span>
                </td>
                <td class="num font-notch">
                  ${window.AppUtils.formatDuration(entry.best_time_sec)}
                </td>
                <td class="num font-notch">
                  ${entry.play_count} ครั้ง
                </td>
                <td style="text-align: right; font-size: 0.8rem; color: var(--text-muted);" class="font-notch">
                  ${formatLeaderboardDate(entry.updated_at)}
                </td>
              </tr>
            `;
          })
          .join("");
      }
    }

    // Attach safe avatar fallback handlers without inline JS
    document
      .querySelectorAll("#view-leaderboard img[data-fallback-avatar]")
      .forEach((imgEl) => {
        imgEl.onerror = () => {
          const fb = imgEl.getAttribute("data-fallback-avatar");
          if (fb && imgEl.src !== fb) {
            imgEl.src = fb;
          }
        };
      });
  }

  /* ==========================================================================
     6. CERTIFICATE PREVIEW MODAL
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
    if (modal) modal.classList.add("hidden");
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

      const openMiniGameBtn = e.target.closest("[data-open-minigame]");
      if (openMiniGameBtn) {
        e.preventDefault();
        const gameId = openMiniGameBtn.getAttribute("data-open-minigame") || "G01";
        window.MiniGameEngine?.openRuleModal(gameId);
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

    // Leaderboard Manual Refresh
    // Leaderboard Category Tabs Switching
    document.getElementById("view-leaderboard")?.addEventListener("click", (e) => {
      const tabBtn = e.target.closest("[data-leaderboard-game]");
      if (tabBtn) {
        e.preventDefault();
        const gId = tabBtn.getAttribute("data-leaderboard-game");
        if (gId && gId !== selectedLeaderboardGame) {
          selectedLeaderboardGame = gId;
          window.SoundEngine?.playPop?.();
          if (cachedLeaderboardData) {
            renderCurrentLeaderboardGame(gId);
          } else {
            renderLeaderboardView(false);
          }
        }
      }
    });

    // Leaderboard Manual Refresh
    document
      .getElementById("btn-refresh-leaderboard")
      ?.addEventListener("click", () => renderLeaderboardView(true));

    // Escape key closes open modals + Number keys [1-4] switch views when outside inputs/games
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeCertificateModal();
        return;
      }

      const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select" || e.target?.isContentEditable) {
        return;
      }
      if (!window.AuthManager?.isAuthenticated()) return;
      if (window.MiniGameEngine?.isMiniGameActive()) return;
      if (document.querySelector(".modal-overlay:not(.hidden)")) return;
      // Avoid interfering with quiz 1-4 answer keys when quiz is open
      const lessonWs = document.getElementById("lesson-workspace");
      if (activeView === "lessons" && lessonWs && !lessonWs.classList.contains("hidden")) {
        return;
      }

      if (e.key === "1") switchView("home");
      else if (e.key === "2") switchView("lessons", { resetToDirectory: true });
      else if (e.key === "3") switchView("progress");
      else if (e.key === "4") switchView("leaderboard");
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
      out: "ยิงสแกนแถบรหัสแท่ง 1 มิติสำเร็จ: แปลงแถบสว่าง-มืดเป็นชุดรหัสตัวเลขส่งเข้าบัสระบบทันที",
      beamColor: "#EF4444"
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
      out: "จับภาพรหัสสองมิติ 33x33 โมดูลและกู้คืนความผิดพลาดด้วย Reed-Solomon สำเร็จ 100%",
      beamColor: "#06B6D4"
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
      out: "เหนี่ยวนำสนามแม่เหล็กไฟฟ้าไร้สาย สแกนสมาร์ตการ์ดผ่านอากาศโดยไม่ต้องสัมผัสพื้นผิว",
      beamColor: "#3B82F6"
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
      out: "ประมวลผลจุดแยกและจุดสิ้นสุดของลายนิ้วมือ แปลงเป็นเวกเตอร์ไบโอเมตริกยืนยันตัวตนสำเร็จ",
      beamColor: "#A855F7"
    }
  };

  let activeScannerMode = "laser";

  function setScannerMode(mode, triggerBeep = true) {
    activeScannerMode = mode;
    const preset = SCANNER_PRESETS[mode] || SCANNER_PRESETS.laser;

    // Update active tab buttons
    document.querySelectorAll("[data-scanner-mode]").forEach((btn) => {
      btn.classList.toggle("is-active", btn.getAttribute("data-scanner-mode") === mode);
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
      beam.style.setProperty("--beam-glow", preset.beamColor);
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
