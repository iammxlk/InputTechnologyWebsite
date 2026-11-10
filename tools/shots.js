/**
 * tools/shots.js
 * ถ่ายภาพหน้าจอทุกหน้าหลัก ทั้งโหมดสว่าง/มืด เดสก์ท็อป/มือถือ (sandbox)
 *
 *   node tools/shots.js <label> [scene,scene] [light|dark|both] [desktop|mobile|tablet|all]
 *
 * ผลลัพธ์: scratch/shots/<label>/<viewport>-<theme>-<scene>.png
 */
const path = require("path");
const { launch, sleep, ROOT } = require("./lib/harness");

const label = process.argv[2] || "current";
const onlyScenes = process.argv[3] && process.argv[3] !== "all" ? process.argv[3].split(",") : null;
const themeArg = process.argv[4] || "both";
const vpArg = process.argv[5] || "all";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, mobile: false },
  tablet: { width: 820, height: 1100, mobile: true },
  mobile: { width: 390, height: 844, mobile: true }
};

const HELPERS = `
  window.__w = (fn, ms = 5000) => new Promise((res) => {
    const t0 = Date.now();
    (function tick() {
      let ok = false;
      try { ok = fn(); } catch (e) {}
      if (ok || Date.now() - t0 > ms) res(ok); else setTimeout(tick, 40);
    })();
  });
  window.__login = async () => {
    if (window.AuthManager.isAuthenticated()) return;
    const ID = "6999900002", PWD = "Shot@1234", API = window.BackendAPI;
    const reg = await API.register({
      student_id: ID,
      full_name: "นางสาวตัวอย่าง ภาพหน้าจอ",
      password: PWD,
      avatar_base64: window.AppUtils.buildInitialsAvatarDataUrl("ตัวอย่าง")
    });
    if (reg && reg.ok) {
      const seed = [[1, 10, 95], [2, 9, 120], [3, 8, 141], [4, 6, 160]];
      for (const [unit_no, score, time_sec] of seed) {
        await API.saveStepProgress({ student_id: ID, unit_no, steps_completed: 6, is_content_read: true });
        await API.submitUnitQuiz({ student_id: ID, unit_no, score, time_sec });
      }
      await API.saveStepProgress({ student_id: ID, unit_no: 5, steps_completed: 6, is_content_read: true });
      await API.saveStepProgress({ student_id: ID, unit_no: 6, steps_completed: 3, is_content_read: false });
    }
    const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };
    set("login-student-id", ID);
    set("login-password", PWD);
    document.getElementById("login-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    await window.__w(() => !document.getElementById("app-shell").classList.contains("hidden"), 8000);
    await new Promise((r) => setTimeout(r, 500));
  };
  window.__readAll = async (unitNo) => {
    window.LearningEngine.openUnit(unitNo, "reader");
    await window.__w(() => document.querySelector("#lesson-workspace .lesson-reader-card"));
    for (let i = 0; i < 8 && document.getElementById("btn-next-step"); i++) {
      document.getElementById("btn-next-step").click();
      await new Promise((r) => setTimeout(r, 60));
    }
  };
`;

const SCENES = [
  { name: "auth-login", auth: false, run: `0` },
  { name: "auth-register", auth: false, run: `document.getElementById("tab-btn-register").click()` },
  { name: "home", run: `window.AppController.switchView("home")` },
  { name: "lessons", run: `window.AppController.switchView("lessons", { resetToDirectory: true })` },
  { name: "reader-u1", run: `window.AppController.openUnitInLessons(1)` },
  { name: "reader-u6-partial", run: `window.AppController.openUnitInLessons(6)` },
  {
    name: "reader-u9-ean13",
    run: `(async () => {
      await window.__readAll(9);
      const idx = window.CURRICULUM_DATA[9].steps.findIndex((s) => s.blocks.some((b) => b.type === "ean13-guide"));
      window.AppController.switchView("lessons", { openReaderUnit: 9 });
      await new Promise((r) => setTimeout(r, 200));
      const btn = document.querySelector('[data-goto-step="' + idx + '"]');
      if (btn) btn.click();
    })()`
  },
  {
    name: "quiz-countdown",
    run: `(async () => { await window.__readAll(1); window.AppController.switchView("lessons", { openReaderUnit: 1, startSubMode: "quiz" }); })()`
  },
  {
    name: "quiz-question",
    run: `(async () => {
      await window.__readAll(7);
      window.AppController.switchView("lessons", { openReaderUnit: 7, startSubMode: "quiz" });
      await window.__w(() => document.getElementById("btn-skip-countdown"));
      document.getElementById("btn-skip-countdown").click();
    })()`
  },
  {
    name: "quiz-answered-wrong",
    run: `(async () => {
      await window.__readAll(7);
      window.AppController.switchView("lessons", { openReaderUnit: 7, startSubMode: "quiz" });
      await window.__w(() => document.getElementById("btn-skip-countdown"));
      document.getElementById("btn-skip-countdown").click();
      await window.__w(() => document.querySelector("[data-quiz-choice]"));
      const a = Number(window.CURRICULUM_DATA[7].quiz[0].answer);
      document.querySelector('[data-quiz-choice="' + ((a + 1) % 4) + '"]').click();
    })()`
  },
  {
    name: "quiz-result",
    run: `(async () => {
      await window.__readAll(7);
      window.AppController.switchView("lessons", { openReaderUnit: 7, startSubMode: "quiz" });
      await window.__w(() => document.getElementById("btn-skip-countdown"));
      document.getElementById("btn-skip-countdown").click();
      const quiz = window.CURRICULUM_DATA[7].quiz;
      for (let i = 0; i < quiz.length; i++) {
        await window.__w(() => { const b = document.querySelector("[data-quiz-choice]"); return b && !b.disabled; });
        document.querySelector('[data-quiz-choice="' + Number(quiz[i].answer) + '"]').click();
        await window.__w(() => document.getElementById("btn-quiz-next-question"));
        document.getElementById("btn-quiz-next-question").click();
        await new Promise((r) => setTimeout(r, 30));
      }
      await window.__w(() => document.querySelector(".quiz-save-banner.is-saved"), 8000);
    })()`
  },
  { name: "progress", run: `window.AppController.switchView("progress")` },
  {
    name: "modal-cert",
    viewportOnly: true,
    run: `(async () => { window.AppController.switchView("progress"); await new Promise((r) => setTimeout(r, 200)); document.getElementById("progress-preview-cert-btn").click(); })()`
  },
  { name: "modal-profile", viewportOnly: true, run: `document.getElementById("navbar-profile-btn").click()` }
];

(async () => {
  const themes = themeArg === "both" ? ["light", "dark"] : [themeArg];
  const vps = vpArg === "all" ? Object.keys(VIEWPORTS) : vpArg.split(",");
  const scenes = SCENES.filter((s) => !onlyScenes || onlyScenes.includes(s.name));
  const outDir = path.join(ROOT, "scratch", "shots", label);
  let count = 0;

  for (const vpName of vps) {
    const vp = VIEWPORTS[vpName];
    const page = await launch(vp);
    await page.emulateMedia({ "prefers-reduced-motion": "reduce" });
    try {
      for (const theme of themes) {
        for (const scene of scenes) {
          await page.goto("/index.html", 900);
          await page.eval(
            `localStorage.setItem("cdti_theme", ${JSON.stringify(theme)}); localStorage.setItem("cdti_motion_mode", "reduced");`
          );
          await page.goto("/index.html", 1100);
          await page.eval(HELPERS);
          if (scene.auth !== false) await page.eval(`window.__login()`);
          await page.eval(scene.run);
          await sleep(900);
          await page.eval(`window.scrollTo(0, 0)`);
          await sleep(150);
          const file = path.join(outDir, `${vpName}-${theme}-${scene.name}.png`);
          await page.screenshot(file, !scene.viewportOnly);
          count++;
          await page.eval(`localStorage.removeItem("cdti_21901_session_v3")`);
        }
      }
      if (page.errors.length) console.log(`[${vpName}] errors:`, page.errors.slice(0, 5));
    } finally {
      await page.close();
    }
  }
  console.log(`${count} screenshots -> ${path.relative(ROOT, outDir)}`);
})();
