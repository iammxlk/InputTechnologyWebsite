/**
 * tools/smoke-test.js
 * ทดสอบเส้นทางใช้งานจริงทั้งระบบในเบราว์เซอร์ (sandbox ไม่แตะ Google Sheets)
 *
 *   node tools/smoke-test.js
 *
 * ครอบคลุม: สมัครสมาชิก, หน้าแรก, ตัวจำลองการนำเข้าข้อมูล 4 โหมด, รายการบทเรียนและตัวกรอง,
 * อ่านครบ 16 หน่วยทุกขั้น, กติกาห้ามข้ามขั้น, แบบทดสอบท้ายหน่วย (ตก/ผ่าน), แล็บ EAN-13,
 * หน้าความคืบหน้า, เกียรติบัตร, โปรไฟล์, เปลี่ยนรหัสผ่าน, ออก/เข้าระบบ, คงสถานะหลังรีโหลด,
 * สลับธีม เสียง และโหมดลดแอนิเมชัน
 */
const path = require("path");
const { launch, ROOT } = require("./lib/harness");

const IN_PAGE = String.raw`
(async () => {
  const fails = [];
  const passes = [];
  const check = (name, cond, detail) => {
    if (cond) passes.push(name);
    else fails.push(name + (detail ? " :: " + detail : ""));
  };
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitFor = async (fn, ms = 6000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      try { if (fn()) return true; } catch (e) {}
      await sleep(40);
    }
    return false;
  };
  const shown = (el) => {
    if (!el) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden" && el.getClientRects().length > 0;
  };
  const setVal = (id, v) => {
    const el = document.getElementById(id);
    el.value = v;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const submit = (id) =>
    document.getElementById(id).dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  const click = (sel) => {
    const el = typeof sel === "string" ? $(sel) : sel;
    if (!el) throw new Error("click target missing: " + sel);
    el.click();
  };
  const CFG = window.APP_CONFIG;
  const DATA = window.CURRICULUM_DATA;
  const STUDENT = "6999900001";
  const NAME = "ผู้ทดสอบ ระบบอัตโนมัติ";
  const PWD1 = "Test@1234";
  const PWD2 = "Next@5678";
  const phase = window.__SMOKE_PHASE__;

  /* ---------- PHASE B: หลังรีโหลด ตรวจว่าสถานะคงอยู่ ---------- */
  if (phase === "after-reload") {
    await waitFor(() => shown($("#app-shell")));
    check("reload: session restored", shown($("#app-shell")) && !shown($("#auth-screen")));
    const u = window.AuthManager.getCurrentUser();
    check("reload: user kept", u && u.student_id === STUDENT, JSON.stringify(u && u.student_id));
    check("reload: 16 units still passed", u && Number(u.passed_units_count) === 16, String(u && u.passed_units_count));
    check("reload: theme persisted", document.documentElement.getAttribute("data-theme") === window.__SMOKE_THEME__,
      document.documentElement.getAttribute("data-theme"));
    return { passes, fails };
  }

  /* ---------- 1. สถานะเริ่มต้น ---------- */
  check("sandbox: backend url disabled", CFG.GAS_WEB_APP_URL === "");
  check("init: auth screen visible", shown($("#auth-screen")));
  check("init: app shell hidden", !shown($("#app-shell")));
  check("init: modals hidden", $$(".modal-overlay").every((m) => !shown(m)));

  /* ---------- 2. ล็อกอินผิดต้องแจ้งเตือน ---------- */
  setVal("login-student-id", "6720101001");
  setVal("login-password", "wrong-password");
  submit("login-form");
  await waitFor(() => shown($("#login-alert")));
  check("login: wrong password shows alert", shown($("#login-alert")) && $("#login-alert").textContent.trim().length > 0);
  check("login: wrong password stays on auth", shown($("#auth-screen")));

  /* ---------- 3. สมัครสมาชิก ---------- */
  click("#tab-btn-register");
  check("register: form shown", shown($("#register-form")) && !shown($("#login-form")));
  setVal("reg-student-id", "69abc99900001");
  check("register: id digits only", $("#reg-student-id").value === "6999900001", $("#reg-student-id").value);
  setVal("reg-student-id", STUDENT);
  setVal("reg-full-name", NAME);
  setVal("reg-password", "weak");
  setVal("reg-confirm-password", "weak");
  submit("register-form");
  await waitFor(() => shown($("#register-alert")));
  check("register: weak password rejected", shown($("#register-alert")) && shown($("#auth-screen")));
  check("register: avatar preview loaded", await waitFor(() => shown($("#reg-avatar-preview-img"))));
  setVal("reg-password", PWD1);
  setVal("reg-confirm-password", PWD1);
  submit("register-form");
  check("register: enters app", await waitFor(() => shown($("#app-shell")) && !shown($("#auth-screen")), 9000),
    $("#register-alert") ? $("#register-alert").textContent.trim() : "");
  if (!shown($("#app-shell"))) return { passes, fails };

  /* ---------- 4. หน้าแรก ---------- */
  await waitFor(() => $$("#home-syllabus-grid [data-open-unit]").length > 0);
  check("home: view visible", shown($("#view-home")));
  check("home: user name in navbar", $("#navbar-user-name").textContent.includes("ผู้ทดสอบ"));
  check("home: student id in navbar", $("#navbar-user-id").textContent.includes(STUDENT));
  const homeUnitNos = new Set($$("#home-syllabus-grid [data-open-unit]").map((b) => b.getAttribute("data-open-unit")));
  check("home: all 16 units reachable", homeUnitNos.size === 16, String(homeUnitNos.size));
  const homeText = $("#view-home").textContent;
  check("home: every unit title listed", CFG.UNITS_METADATA.every((u) => homeText.replace(/\s+/g, "").includes(u.title.replace(/\s+/g, "").slice(0, 12))));
  check("home: 4 modules listed", CFG.MODULES_SYLLABUS.every((m) => homeText.includes(m.title)));
  check("home: metrics start at zero", $("#home-metric-units").textContent.replace(/\s/g, "") === "0/16", $("#home-metric-units").textContent);
  check("home: continue button targets unit 1", $("#home-cta-continue-btn").textContent.includes("1"));
  check("home: course facts present", ["21901-2017", "จิตรลดา", "อนุพงศ์", "2569"].every((t) => homeText.includes(t)));
  const canvasDrawn = (canvas) => {
    try {
      const d = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height).data;
      const seen = new Set();
      for (let i = 0; i < d.length; i += 4 * 997) seen.add(d[i] + "," + d[i + 1] + "," + d[i + 2] + "," + d[i + 3]);
      return seen.size > 8;
    } catch (e) { return false; }
  };
  check("home: certificate preview drawn", await waitFor(() => canvasDrawn($("#home-cert-preview-canvas")), 5000));

  /* ---------- 5. ตัวจำลองการนำเข้าข้อมูล 4 โหมด ---------- */
  const modes = ["laser", "qr", "rfid", "bio"];
  const outputs = new Set();
  for (const m of modes) {
    click('[data-scanner-mode="' + m + '"]');
    await sleep(30);
    check("simulator: " + m + " tab active", $('[data-scanner-mode="' + m + '"]').classList.contains("is-active"));
    check("simulator: " + m + " target shown", $("#target-view-" + m).classList.contains("is-active") && shown($("#target-view-" + m)));
    outputs.add($("#scanner-fps-badge").textContent.trim());
  }
  check("simulator: each mode changes readout", outputs.size === 4, String(outputs.size));
  click("#scanner-scan-trigger-btn");
  check("simulator: scan trigger works", $("#cyber-laser-beam").classList.contains("is-beaming"));

  /* ---------- 6. รายการบทเรียนและตัวกรองหมวด ---------- */
  click('.sticky-navbar [data-nav-view="lessons"]');
  await waitFor(() => shown($("#lessons-directory-shell")));
  check("lessons: directory visible", shown($("#view-lessons")) && !shown($("#view-home")));
  check("lessons: 16 unit cards", $$("#lessons-units-grid [data-unit-no]").length === 16, String($$("#lessons-units-grid [data-unit-no]").length));
  for (const mod of [1, 2, 3, 4]) {
    click('[data-module-filter="' + mod + '"]');
    await sleep(120);
    const nos = $$("#lessons-units-grid [data-unit-no]").map((c) => Number(c.getAttribute("data-unit-no")));
    const expected = CFG.UNITS_METADATA.filter((u) => u.moduleId === mod).map((u) => u.no);
    check("lessons: filter module " + mod, JSON.stringify(nos) === JSON.stringify(expected), JSON.stringify(nos));
  }
  click('[data-module-filter="all"]');
  await sleep(120);
  check("lessons: no quiz button before reading", $$("#lessons-directory-shell [data-start-unit-quiz]").length === 0);

  /* ---------- 7. อ่านครบ 16 หน่วย + แบบทดสอบท้ายหน่วย ---------- */
  const ws = () => $("#lesson-workspace");
  const answerQuiz = async (unitNo, wrongCount) => {
    // ข้อสอบสุ่มจากคลังของหน่วย จึงหาข้อที่แสดงอยู่จากข้อความคำถาม
    const pool = DATA[unitNo].quiz;
    const norm = (t) => String(t).replace(/[\s*]+/g, "");
    const seen = new Set();
    for (let i = 0; i < 10; i++) {
      await waitFor(() => $$("[data-quiz-choice]", ws()).length === 4 && !$("[data-quiz-choice]", ws()).disabled);
      const qText = $(".quiz-cockpit-question-title", ws()).textContent;
      const q = pool.find((x) => norm(qText).includes(norm(x.q))) || pool[i];
      if (seen.has(q.id)) fails.push("quiz u" + unitNo + " q" + (i + 1) + ": question repeated");
      seen.add(q.id);
      if (!norm(qText).includes(norm(q.q))) {
        fails.push("quiz u" + unitNo + " q" + (i + 1) + ": question text mismatch");
      }
      const choiceTexts = $$(".quiz-option-text", ws()).map((e) => e.textContent.trim());
      if (JSON.stringify(choiceTexts) !== JSON.stringify(q.choices.map((c) => String(c).replace(/\*\*/g, "").trim()))) {
        fails.push("quiz u" + unitNo + " q" + (i + 1) + ": choices mismatch");
      }
      if (/\*\*/.test(ws().querySelector(".quiz-cockpit-card").textContent)) fails.push("quiz u" + unitNo + " q" + (i + 1) + ": stray markdown asterisks shown");
      const correct = Number(q.answer);
      const pick = i < wrongCount ? (correct + 1) % 4 : correct;
      click($('[data-quiz-choice="' + pick + '"]', ws()));
      await waitFor(() => $("#quiz-feedback-banner"));
      const fb = $("#quiz-feedback-banner");
      if (!fb) { fails.push("quiz u" + unitNo + " q" + (i + 1) + ": no feedback"); return; }
      const wantCls = i < wrongCount ? "is-wrong" : "is-correct";
      if (!fb.classList.contains(wantCls)) fails.push("quiz u" + unitNo + " q" + (i + 1) + ": verdict not " + wantCls);
      if (!fb.textContent.replace(/[\s*]+/g, "").includes(String(q.explanation).replace(/[\s*]+/g, "").slice(0, 24))) {
        fails.push("quiz u" + unitNo + " q" + (i + 1) + ": explanation missing");
      }
      if (!$$("[data-quiz-choice]", ws()).every((b) => b.disabled)) fails.push("quiz u" + unitNo + " q" + (i + 1) + ": choices not locked");
      click($("#btn-quiz-next-question", ws()) || $("#btn-quiz-advance-inline", ws()));
      await sleep(20);
    }
    await waitFor(() => $(".quiz-result-card", ws()) && $(".quiz-save-banner.is-saved", ws()), 9000);
  };

  let renderedBlocks = 0;
  for (let unitNo = 1; unitNo <= CFG.TOTAL_UNITS; unitNo++) {
    const unit = DATA[unitNo];
    const meta = CFG.UNITS_METADATA.find((u) => u.no === unitNo);
    window.AppController.switchView("lessons", { resetToDirectory: true });
    await waitFor(() => shown($("#lessons-directory-shell")));
    click('#lessons-units-grid [data-enter-unit="' + unitNo + '"]');
    await waitFor(() => shown(ws()) && $(".lesson-reader-card", ws()));
    const tag = "u" + unitNo;
    check(tag + ": reader opens", shown(ws()) && !shown($("#lessons-directory-shell")));
    check(tag + ": unit title shown", ws().textContent.replace(/\s+/g, "").includes(meta.title.replace(/\s+/g, "").slice(0, 12)));
    check(tag + ": step rail count", $$("[data-goto-step]", ws()).length === unit.steps.length, String($$("[data-goto-step]", ws()).length));

    if (unitNo === 1) {
      check("lock: later steps disabled at start", $$("[data-goto-step]", ws()).slice(1).every((b) => b.disabled));
      check("lock: quiz tab hidden before reading", !$("#tab-switch-quiz"));
      window.LearningEngine.openUnit(1, "quiz");
      await sleep(150);
      check("lock: quiz refused before reading", !$("[data-quiz-choice]") && !$(".quiz-countdown-card") && !!$(".lesson-reader-card", ws()));
    }

    for (let s = 0; s < unit.steps.length; s++) {
      const step = unit.steps[s];
      await waitFor(() => $(".lesson-step-title", ws()) && $(".lesson-step-title", ws()).textContent.trim() === String(step.title).replace(/\*\*/g, "").trim());
      const card = $(".lesson-reader-card", ws());
      const body = $(".lesson-step-body", ws());
      const flat = card.textContent.replace(/[\s*]+/g, "");
      const needles = [step.title, step.lead, step.keyTakeaway];
      for (const b of step.blocks) {
        if (b.type === "paragraph") needles.push(b.text);
        if (b.type === "callout") needles.push(b.title, b.text);
        if (b.type === "table") { needles.push(...b.headers); b.rows.forEach((r) => needles.push(...r)); }
        if (b.type === "cards") b.items.forEach((it) => needles.push(it.label, it.detail));
        if (b.type === "flow") b.steps.forEach((st) => needles.push(st.stepTitle, st.stepDesc));
        if (b.type === "image" && b.caption) needles.push(b.caption);
      }
      const missing = needles.filter((n) => n && !flat.includes(String(n).replace(/[\s*]+/g, "")));
      if (missing.length) fails.push(tag + " step " + (s + 1) + ": " + missing.length + " text piece(s) not rendered, e.g. " + String(missing[0]).slice(0, 40));
      if (body.children.length < step.blocks.length) fails.push(tag + " step " + (s + 1) + ": blocks " + body.children.length + "/" + step.blocks.length);
      renderedBlocks += step.blocks.length;

      const imgs = $$("img.lesson-figure-img", body);
      if (imgs.length !== step.blocks.filter((b) => b.type === "image").length) fails.push(tag + " step " + (s + 1) + ": image count");
      for (const img of imgs) {
        img.loading = "eager";
        const ok = await waitFor(() => img.complete && img.naturalWidth > 0, 5000);
        if (!ok) fails.push(tag + " step " + (s + 1) + ": image failed " + img.getAttribute("src"));
      }

      if (step.blocks.some((b) => b.type === "ean13-guide")) {
        const root = $("#ean13-guide-root");
        check("ean13: lab rendered", !!root && shown(root));
        const before = root.textContent;
        $("#ean13-btn-next").focus();
        click("#ean13-btn-next");
        await sleep(80);
        check("ean13: next step changes content", $("#ean13-guide-root").textContent !== before);
        check("ean13: focus stays on the next button after re-render", document.activeElement && document.activeElement.id === "ean13-btn-next", document.activeElement && document.activeElement.tagName);
        click("#ean13-btn-prev");
        await sleep(80);
        const tabs = $$("[data-ean13-tab]");
        check("ean13: has tabs", tabs.length >= 2, String(tabs.length));
        for (const t of tabs) {
          const sel = '[data-ean13-tab="' + t.getAttribute("data-ean13-tab") + '"]';
          $(sel).focus();
          click(sel);
          await sleep(60);
          if (document.activeElement !== $(sel)) fails.push("ean13: focus lost after choosing tab " + t.getAttribute("data-ean13-tab"));
        }
        const digits = $$(".ean13-barcode-svg text");
        if (digits.length) check("ean13: barcode shows 13 digits", digits.length === 13 && digits.map((d) => d.textContent).join("").length === 13, String(digits.length));
        const live = $("#ean13-live-input");
        check("ean13: live validator input present", !!live);
        if (live) {
          setVal("ean13-live-input", "8850123456781");
          await sleep(80);
          const t1 = $("#ean13-guide-root").textContent;
          setVal("ean13-live-input", "8850123456789");
          await sleep(80);
          check("ean13: validator reacts to input", $("#ean13-guide-root").textContent !== t1);
          if ($("#ean13-btn-random")) {
            click("#ean13-btn-random");
            await sleep(80);
            check("ean13: random barcode works", /^\d{12,13}$/.test(($("#ean13-live-input") || {}).value || ""), ($("#ean13-live-input") || {}).value);
          }
        }
      }

      if (s < unit.steps.length - 1) {
        if (unitNo === 1 && s === 0) {
          check("lock: step 3 locked while on step 1", $('[data-goto-step="2"]', ws()).disabled);
          window.LearningEngine && 0;
        }
        click("#btn-next-step");
      }
    }
    check(tag + ": finish button on last step", !!$("#btn-finish-steps-start-quiz"));
    if (unitNo === 1) {
      click('[data-goto-step="0"]');
      await waitFor(() => $(".lesson-step-title", ws()).textContent.trim() === String(unit.steps[0].title).replace(/\*\*/g, "").trim());
      check("reader: can jump back to visited step", !$("#btn-next-step").disabled && $("#btn-prev-step").disabled);
      click('[data-goto-step="' + (unit.steps.length - 1) + '"]');
      await waitFor(() => $("#btn-finish-steps-start-quiz"));
      click("#btn-prev-step");
      await waitFor(() => $("#btn-next-step"));
      check("reader: previous button works", $(".lesson-step-title", ws()).textContent.trim() === String(unit.steps[unit.steps.length - 2].title).replace(/\*\*/g, "").trim());
      click("#btn-next-step");
      await waitFor(() => $("#btn-finish-steps-start-quiz"));
    }

    click("#btn-finish-steps-start-quiz");
    await waitFor(() => $(".quiz-countdown-card", ws()));
    check(tag + ": quiz countdown shown", !!$(".quiz-countdown-card", ws()));
    if (unitNo === 1) {
      click("#btn-cancel-countdown");
      await waitFor(() => shown($("#lessons-directory-shell")));
      check("quiz: countdown can be cancelled", shown($("#lessons-directory-shell")));
      check("lessons: quiz button appears after reading", !!$('#lessons-units-grid [data-start-unit-quiz="1"]'));
      click('#lessons-units-grid [data-start-unit-quiz="1"]');
      await waitFor(() => $(".quiz-countdown-card", ws()));
    }
    click("#btn-skip-countdown");
    await waitFor(() => $$("[data-quiz-choice]", ws()).length === 4);
    check(tag + ": quiz starts with 4 choices", $$("[data-quiz-choice]", ws()).length === 4);
    check(tag + ": 10 progress dots", $$(".quiz-progress-dot", ws()).length === 10, String($$(".quiz-progress-dot", ws()).length));

    if (unitNo === 1) {
      click("#btn-abort-quiz");
      await waitFor(() => $(".lesson-reader-card", ws()));
      check("quiz: abort returns to reader", !!$(".lesson-reader-card", ws()) && !document.body.classList.contains("is-quiz-active"));
      click("#tab-switch-quiz");
      await waitFor(() => $(".quiz-countdown-card", ws()));
      click("#btn-skip-countdown");
      await waitFor(() => $$("[data-quiz-choice]", ws()).length === 4);
    }

    if (unitNo === 2) {
      await answerQuiz(unitNo, 3);
      const u = window.AuthManager.getCurrentUser();
      check("quiz: 7/10 does not pass", Number(u.passed_units_count) === 1, String(u.passed_units_count));
      check("quiz: fail result shows 7 / 10", /7\s*\/\s*10/.test($(".quiz-result-card", ws()).textContent));
      check("quiz: review lists 10 answers", $$(".quiz-review-item", ws()).length === 10);
      check("quiz: no next-unit button on fail", !$('[data-enter-unit="3"]', ws()));
      click("#btn-result-retake-quiz");
      await waitFor(() => $(".quiz-countdown-card", ws()));
      click("#btn-skip-countdown");
      await waitFor(() => $$("[data-quiz-choice]", ws()).length === 4);
    }

    if (unitNo === 3) {
      window.dispatchEvent(new KeyboardEvent("keydown", { key: String(Number(DATA[3].quiz[0].answer) + 1), bubbles: true }));
      await waitFor(() => $("#quiz-feedback-banner"));
      check("quiz: number key answers", !!$("#quiz-feedback-banner") && $("#quiz-feedback-banner").classList.contains("is-correct"));
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
      await sleep(80);
      check("quiz: Enter advances", /2\s*\/\s*10/.test($(".quiz-hud-tag", ws()).textContent), $(".quiz-hud-tag", ws()).textContent);
      const rest = DATA[3].quiz;
      for (let i = 1; i < rest.length; i++) {
        await waitFor(() => $$("[data-quiz-choice]", ws()).length === 4 && !$("[data-quiz-choice]", ws()).disabled);
        click($('[data-quiz-choice="' + Number(rest[i].answer) + '"]', ws()));
        await waitFor(() => $("#quiz-feedback-banner"));
        click($("#btn-quiz-next-question", ws()));
        await sleep(20);
      }
      await waitFor(() => $(".quiz-result-card", ws()) && $(".quiz-save-banner.is-saved", ws()), 9000);
    } else {
      await answerQuiz(unitNo, unitNo === 4 ? 2 : 0);
    }

    const user = window.AuthManager.getCurrentUser();
    check(tag + ": passed and saved", Number(user.passed_units_count) === unitNo, "passed=" + user.passed_units_count);
    const rec = window.AuthManager.getUnitProgressMap()[unitNo] || {};
    check(tag + ": best score recorded", Number(rec.best_quiz_score) === (unitNo === 4 ? 8 : 10) && rec.is_passed === true, JSON.stringify(rec.best_quiz_score));
    if (unitNo < 16) check(tag + ": next-unit button offered", !!$('[data-enter-unit="' + (unitNo + 1) + '"]', ws()));
  }
  const expectedBlocks = Object.keys(DATA).reduce((n, k) => n + DATA[k].steps.reduce((m, st) => m + st.blocks.length, 0), 0);
  check("content: every lesson block rendered", renderedBlocks === expectedBlocks && expectedBlocks >= 300, renderedBlocks + "/" + expectedBlocks);

  /* ---------- 8. หน้าความคืบหน้าและเกียรติบัตร ---------- */
  click('.sticky-navbar [data-nav-view="progress"]');
  await waitFor(() => shown($("#view-progress")));
  await sleep(200);
  check("progress: view visible", shown($("#view-progress")));
  check("progress: 16 rows", $$("#progress-units-tbody tr").length === 16, String($$("#progress-units-tbody tr").length));
  check("progress: 100 percent", $("#progress-big-percent").textContent.trim() === "100%", $("#progress-big-percent").textContent);
  check("progress: quiz total 158/160", /158\s*\/\s*160/.test($("#progress-stat-quiz").textContent), $("#progress-stat-quiz").textContent);
  check("progress: certificate unlocked", $("#progress-download-cert-btn").disabled === false);
  click('[data-progress-filter="pending"]');
  await sleep(80);
  check("progress: pending filter empty", $$("#progress-units-tbody [data-open-unit]").length === 0);
  click('[data-progress-filter="passed"]');
  await sleep(80);
  check("progress: passed filter 16", $$("#progress-units-tbody [data-open-unit]").length === 16);
  click('[data-progress-filter="all"]');

  click("#progress-preview-cert-btn");
  await waitFor(() => shown($("#cert-preview-modal")));
  check("certificate: modal opens", shown($("#cert-preview-modal")));
  check("certificate: modal canvas drawn", await waitFor(() => canvasDrawn($("#modal-cert-preview-canvas")), 5000));
  check("certificate: download enabled in modal", $("#modal-cert-download-btn").disabled === false);
  let downloaded = null;
  const origClick = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    if (this.download) downloaded = { name: this.download, href: String(this.href).slice(0, 30), size: String(this.href).length };
    else origClick.call(this);
  };
  click("#modal-cert-download-btn");
  await waitFor(() => downloaded, 8000);
  HTMLAnchorElement.prototype.click = origClick;
  check("certificate: PNG download produced", !!downloaded && /\.png$/i.test(downloaded.name) && downloaded.size > 20000, JSON.stringify(downloaded));
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  await waitFor(() => !shown($("#cert-preview-modal")));
  check("certificate: Escape closes modal", !shown($("#cert-preview-modal")));

  click('.sticky-navbar [data-nav-view="home"]');
  await waitFor(() => shown($("#view-home")));
  await sleep(900);
  check("home: metrics updated", $("#home-metric-units").textContent.replace(/\s/g, "") === "16/16", $("#home-metric-units").textContent);
  check("home: certificate pill unlocked", $("#home-cert-status-pill").classList.contains("is-pass"));

  /* ---------- 9. คีย์ลัดเปลี่ยนหน้า ---------- */
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "3", bubbles: true }));
  await sleep(120);
  check("shortcut: key 3 opens progress", shown($("#view-progress")));
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "1", bubbles: true }));
  await sleep(120);
  check("shortcut: key 1 opens home", shown($("#view-home")));

  /* ---------- 10. ธีม เสียง ลดแอนิเมชัน ---------- */
  const html = document.documentElement;
  const t0 = html.getAttribute("data-theme");
  click("#theme-toggle-btn");
  await sleep(60);
  const t1 = html.getAttribute("data-theme");
  check("theme: toggles", t0 !== t1 && ["light", "dark"].includes(t1), t0 + "->" + t1);
  check("theme: aria-label reflects state", /มืด|สว่าง|Dark|Light/.test($("#theme-toggle-btn").getAttribute("aria-label") || ""));
  const m0 = html.getAttribute("data-motion");
  click("#motion-toggle-btn");
  await sleep(60);
  check("motion: toggles", html.getAttribute("data-motion") !== m0, m0 + "->" + html.getAttribute("data-motion"));
  click("#motion-toggle-btn");
  const sBefore = window.SoundEngine && window.SoundEngine.isEnabled ? window.SoundEngine.isEnabled() : null;
  click("#sound-toggle-btn");
  await sleep(60);
  const sAfter = window.SoundEngine && window.SoundEngine.isEnabled ? window.SoundEngine.isEnabled() : null;
  check("sound: toggles", sBefore === null ? true : sBefore !== sAfter, sBefore + "->" + sAfter);
  click("#sound-toggle-btn");

  /* ---------- 11. โปรไฟล์ เปลี่ยนรหัสผ่าน ออก/เข้าระบบ ---------- */
  click("#navbar-profile-btn");
  await waitFor(() => shown($("#profile-modal")));
  check("profile: modal opens", shown($("#profile-modal")));
  check("profile: shows name and id", $("#modal-profile-name").textContent.includes("ผู้ทดสอบ") && $("#modal-profile-id").textContent.includes(STUDENT));
  check("profile: shows progress", /16\s*\/\s*16/.test($("#modal-profile-progress").textContent), $("#modal-profile-progress").textContent);
  check("profile: avatar set", ($("#modal-profile-avatar").getAttribute("src") || "").startsWith("data:image"));
  setVal("pwd-current", "Wrong@000");
  setVal("pwd-new", PWD2);
  setVal("pwd-confirm", PWD2);
  submit("change-password-form");
  await waitFor(() => shown($("#profile-modal-alert")));
  check("profile: wrong current password rejected", shown($("#profile-modal-alert")));
  setVal("pwd-current", PWD1);
  setVal("pwd-new", PWD2);
  setVal("pwd-confirm", PWD2);
  submit("change-password-form");
  await sleep(900);
  click("#navbar-profile-btn");
  await waitFor(() => shown($("#profile-modal")));
  click("#logout-btn");
  await waitFor(() => shown($("#auth-screen")));
  check("logout: returns to auth screen", shown($("#auth-screen")) && !shown($("#app-shell")));
  check("logout: session cleared", !window.AuthManager.isAuthenticated());

  click("#tab-btn-login");
  setVal("login-student-id", STUDENT);
  setVal("login-password", PWD1);
  submit("login-form");
  await waitFor(() => shown($("#login-alert")));
  check("login: old password rejected after change", shown($("#auth-screen")) && shown($("#login-alert")));
  setVal("login-password", PWD2);
  submit("login-form");
  check("login: new password accepted", await waitFor(() => shown($("#app-shell")), 9000));
  check("login: progress restored", Number(window.AuthManager.getCurrentUser().passed_units_count) === 16);

  /* ---------- 12. มินิเกมต้องไม่เหลือในหน้าเว็บ (หลัง Phase 1) ---------- */
  if (window.__SMOKE_NO_MINIGAME__) {
    check("minigame: engine removed", typeof window.MiniGameEngine === "undefined");
    check("minigame: no entry points", $$("[data-open-minigame],[data-open-minigame-mod],#minigame-workspace,#minigame-rule-modal").length === 0);
    check("minigame: no wording left", !/มินิเกม|Leaderboard|จัดอันดับ/i.test(document.body.textContent));
  }

  return { passes, fails, theme: document.documentElement.getAttribute("data-theme") };
})()
`;


const MOBILE_PAGE = String.raw`
(async () => {
  const fails = [];
  const passes = [];
  const check = (name, cond, detail) => (cond ? passes : fails).push(name + (cond || !detail ? "" : " :: " + detail));
  const $ = (s) => document.querySelector(s);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const waitFor = async (fn, ms = 6000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { if (fn()) return true; } catch (e) {} await sleep(40); }
    return false;
  };
  const shown = (el) => !!el && getComputedStyle(el).display !== "none" && getComputedStyle(el).visibility !== "hidden" && el.getClientRects().length > 0;
  const setVal = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };
  const key = (k, opts) => document.dispatchEvent(new KeyboardEvent("keydown", Object.assign({ key: k, bubbles: true, cancelable: true }, opts || {})));
  const noOverflow = () => document.documentElement.scrollWidth <= window.innerWidth + 1;

  check("theme: follows system dark preference by default", document.documentElement.getAttribute("data-theme") === "dark", document.documentElement.getAttribute("data-theme"));
  check("theme: toggle label matches state", ($("#auth-theme-toggle-btn").getAttribute("aria-label") || "").includes("สว่าง"), $("#auth-theme-toggle-btn").getAttribute("aria-label"));
  check("layout: no horizontal overflow on auth", noOverflow(), String(document.documentElement.scrollWidth));

  setVal("login-student-id", "6999900001");
  setVal("login-password", "Next@5678");
  document.getElementById("login-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  check("mobile: login works", await waitFor(() => shown($("#app-shell")), 9000));
  await sleep(400);
  check("mobile: bottom navigation visible", shown($(".mobile-nav-bar")) && !shown($(".nav-links")));
  check("mobile: menu button hidden outside reader", !shown($("#toc-menu-btn")));
  check("layout: no horizontal overflow on home", noOverflow(), String(document.documentElement.scrollWidth));
  check("grid: 6 glass columns on mobile", getComputedStyle($("#home-glass-grid")).getPropertyValue("--glass-cols").trim() === "6", getComputedStyle($("#home-glass-grid")).getPropertyValue("--glass-cols"));
  const cardLink = $("#home-syllabus-grid .lesson-card-link");
  cardLink.focus();
  check("keyboard: lesson card is focusable", document.activeElement === cardLink);

  window.AppController.openUnitInLessons(2);
  await waitFor(() => $("#lesson-toc"));
  await sleep(300);
  const menu = $("#toc-menu-btn");
  const toc = () => $("#lesson-toc");
  check("drawer: menu button shown in reader", shown(menu));
  check("drawer: closed by default", getComputedStyle(toc()).visibility === "hidden" && menu.getAttribute("aria-expanded") === "false");
  menu.focus();
  menu.click();
  await sleep(350);
  check("drawer: opens", document.body.classList.contains("is-drawer-open") && getComputedStyle(toc()).visibility === "visible");
  check("drawer: aria-expanded true", menu.getAttribute("aria-expanded") === "true");
  check("drawer: focus moves inside", toc().contains(document.activeElement), document.activeElement && document.activeElement.className);
  const focusables = Array.from(toc().querySelectorAll("button:not([disabled])")).filter((el) => el.offsetParent !== null);
  focusables[focusables.length - 1].focus();
  key("Tab");
  check("drawer: Tab wraps to first item", document.activeElement === focusables[0]);
  key("Tab", { shiftKey: true });
  check("drawer: Shift+Tab wraps to last item", document.activeElement === focusables[focusables.length - 1]);
  key("Escape");
  await sleep(350);
  check("drawer: Escape closes", !document.body.classList.contains("is-drawer-open") && getComputedStyle(toc()).visibility === "hidden");
  check("drawer: focus returns to menu button", document.activeElement === menu);
  menu.click();
  await sleep(350);
  document.querySelector(".toc-overlay").click();
  await sleep(350);
  check("drawer: overlay click closes", !document.body.classList.contains("is-drawer-open"));
  menu.click();
  await sleep(300);
  document.querySelector('#lesson-toc [data-goto-step="3"]').click();
  await sleep(350);
  check("drawer: choosing a step closes it and navigates", !document.body.classList.contains("is-drawer-open") && /4\s*\/\s*6/.test(document.querySelector(".lesson-step-counter").textContent));

  const bm = () => document.querySelector("[data-toggle-bookmark]");
  check("bookmark: starts unsaved", bm().getAttribute("aria-pressed") === "false");
  bm().click();
  await sleep(80);
  check("bookmark: saves", bm().getAttribute("aria-pressed") === "true" && bm().classList.contains("is-saved"));
  document.getElementById("btn-next-step").click();
  await sleep(200);
  check("bookmark: kept across steps", bm().getAttribute("aria-pressed") === "true");
  window.AppController.switchView("lessons", { resetToDirectory: true });
  await sleep(300);
  check("bookmark: shown on the unit card", !!document.querySelector('#lessons-units-grid [data-unit-no="2"] .icon-fill'));
  check("mobile: menu button hidden after leaving reader", !shown($("#toc-menu-btn")));
  check("layout: no horizontal overflow in directory", noOverflow(), String(document.documentElement.scrollWidth));
  window.AppController.openUnitInLessons(2);
  await sleep(400);
  bm().click();
  await sleep(80);
  check("bookmark: can be removed", bm().getAttribute("aria-pressed") === "false");
  check("layout: no horizontal overflow in reader", noOverflow(), String(document.documentElement.scrollWidth));

  // ปุ่มชื่อบทบนการ์ดขยายพื้นที่แตะเต็มการ์ดด้วย ::after จึงไม่นับขนาดกล่องข้อความ
  const small = Array.from(document.querySelectorAll("button, a, [role=button]"))
    .filter((el) => shown(el) && !el.disabled && !el.classList.contains("lesson-card-link"))
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter((x) => x.r.width > 0 && (x.r.height < 43.5 || x.r.width < 43.5))
    .map((x) => (x.el.id || x.el.className) + " " + Math.round(x.r.width) + "x" + Math.round(x.r.height));
  check("touch: visible controls are at least 44px", small.length === 0, small.slice(0, 6).join(" ; "));

  window.AppController.switchView("home");
  await sleep(400);
  const smallHome = Array.from(document.querySelectorAll("button, a, [role=button]"))
    .filter((el) => shown(el) && !el.disabled && !el.classList.contains("lesson-card-link"))
    .map((el) => ({ el, r: el.getBoundingClientRect() }))
    .filter((x) => x.r.width > 0 && (x.r.height < 43.5 || x.r.width < 43.5))
    .map((x) => (x.el.id || x.el.className) + " " + Math.round(x.r.width) + "x" + Math.round(x.r.height));
  check("touch: home controls are at least 44px", smallHome.length === 0, smallHome.slice(0, 6).join(" ; "));

  window.AppController.switchView("progress");
  await sleep(300);
  check("layout: no horizontal overflow on progress", noOverflow(), String(document.documentElement.scrollWidth));

  return { passes, fails };
})()
`;

(async () => {
  const noMinigame = !require("fs").existsSync(path.join(ROOT, "js", "minigames.js"));
  const page = await launch({ width: 1440, height: 900 });
  let exitCode = 0;
  try {
    await page.goto("/index.html", 1500);
    await page.setFiles("#reg-avatar-input", [path.join(ROOT, "images", "mascot", "star-1-smile.png")]);
    await page.eval(`document.getElementById("reg-avatar-input").dispatchEvent(new Event("change", { bubbles: true }))`);
    await page.eval(`window.__SMOKE_NO_MINIGAME__ = ${noMinigame}; window.__SMOKE_PHASE__ = "main";`);
    const a = await page.eval(IN_PAGE);

    let b = { passes: [], fails: [] };
    if (a.theme) {
      await page.goto("/index.html", 1500);
      await page.eval(`window.__SMOKE_PHASE__ = "after-reload"; window.__SMOKE_THEME__ = ${JSON.stringify(a.theme)};`);
      b = await page.eval(IN_PAGE);
    }

    // Phase C: จอมือถือ + ระบบตั้งค่าโหมดมืด (ลิ้นชักสารบัญ บุ๊กมาร์ก ค่าเริ่มต้นของธีม)
    let c = { passes: [], fails: [] };
    if (a.theme) {
      await page.eval(
        `localStorage.removeItem("cdti_theme"); localStorage.removeItem("cdti_21901_session_v3"); localStorage.removeItem("cdti_motion_mode");`
      );
      await page.setViewport(390, 844, true);
      await page.emulateMedia({ "prefers-color-scheme": "dark" });
      await page.goto("/index.html", 1500);
      c = await page.eval(MOBILE_PAGE);
    }

    const fails = [...a.fails, ...b.fails, ...c.fails];
    const passes = [...a.passes, ...b.passes, ...c.passes];
    const errors = page.errors.filter((e) => !/favicon/.test(e));
    const notFound = page.notFound.filter((p) => !/favicon/.test(p));

    console.log(`checks passed: ${passes.length}`);
    console.log(`checks failed: ${fails.length}`);
    fails.forEach((f) => console.log("  FAIL " + f));
    console.log(`console errors: ${errors.length}`);
    errors.slice(0, 15).forEach((e) => console.log("  ERR  " + e.slice(0, 300)));
    console.log(`missing files (404): ${notFound.length}`);
    notFound.slice(0, 15).forEach((p) => console.log("  404  " + p));
    console.log(`minigame-free assertions: ${noMinigame ? "on" : "off (minigames.js still present)"}`);

    if (fails.length || errors.length || notFound.length) exitCode = 1;
    console.log(exitCode ? "SMOKE TEST FAILED" : "SMOKE TEST OK");
  } catch (err) {
    console.log("SMOKE TEST CRASHED: " + err.message);
    page.errors.slice(0, 10).forEach((e) => console.log("  ERR  " + e.slice(0, 300)));
    exitCode = 2;
  } finally {
    await page.close();
  }
  process.exit(exitCode);
})();
