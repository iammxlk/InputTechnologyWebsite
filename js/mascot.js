/* ==========================================================================
   CREATIVE STUDIO POP — CHIBI BOY & PIXEL STAR MASCOT CHOREOGRAPHY ENGINE
   Course 21901-2017: Data Input Technology (CDTI)
   Zero-Duplicate Viewport Guard + Route-Aware Ambient & Companion Reactions
   ========================================================================== */

(function () {
  "use strict";

  const POSES = {
    // Chibi Vocational Boy Mascot Set (5 Poses)
    keyboard: "images/mascot/mascot-keyboard.png",
    scanner: "images/mascot/mascot-scanner.png",
    cheer: "images/mascot/mascot-cheer.png",
    study: "images/mascot/mascot-study.png",
    cert: "images/mascot/mascot-cert.png",

    // Pixel-Art Golden Star Character Sheet Set (9 Poses)
    starSmile: "images/mascot/star-1-smile.png",
    starLook: "images/mascot/star-2-look.png",
    starBack: "images/mascot/star-3-back.png",
    starWave: "images/mascot/star-4-wave.png",
    starExcited: "images/mascot/star-5-excited.png",
    starShy: "images/mascot/star-6-shy.png",
    starIdea: "images/mascot/star-7-idea.png",
    starSleep: "images/mascot/star-8-sleep.png",
    starCongrats: "images/mascot/star-9-congrats.png"
  };

  const FALLBACK_ROTATION_ORDER = [
    "starWave",
    "starSmile",
    "starIdea",
    "starLook",
    "starExcited",
    "starShy",
    "starSleep",
    "starBack",
    "cheer",
    "study",
    "scanner",
    "keyboard",
    "cert",
    "starCongrats"
  ];

  const AMBIENT_ROUTE_SETS = {
    auth: ["starWave", "starSmile", "starExcited", "starIdea"],
    home: ["starWave", "starIdea", "starExcited", "starLook"],
    lessons: ["starWave", "starSmile", "starLook", "starSleep"],
    reader: ["starSmile", "starShy", "starWave", "starLook"],
    quiz: ["starWave", "starSmile", "starLook", "starBack"],
    progress: ["starWave", "starSmile", "starExcited", "starLook"]
  };

  const INTERACTIVE_TIPS = [
    {
      pose: "starIdea",
      text: "บาร์โค้ด EAN-13 ใช้หลักที่ 13 เป็น Check Digit คอยดักจับการพิมพ์ผิดนะ!"
    },
    {
      pose: "starSmile",
      text: "QR Code ระดับ H กู้คืนข้อมูลกลับมาได้แม้ป้ายฉีกขาดหรือเปื้อนถึง 30% เลย"
    },
    {
      pose: "starWave",
      text: "กดปุ่มลัดตัวเลข 1-3 บนแป้นพิมพ์เพื่อสลับหน้าเมนูหลักได้ไวทันใจ"
    },
    {
      pose: "cheer",
      text: "ทำแบบทดสอบท้ายหน่วยให้ได้ 8/10 คะแนนขึ้นไป (80%) เพื่อผ่านเกณฑ์แต่ละหน่วยนะ!"
    },
    {
      pose: "starExcited",
      text: "คลื่น RFID ย่าน 13.56 MHz อ่านบัตรสมาร์ตการ์ดได้โดยไม่ต้องสัมผัสตัวอ่านเลย!"
    },
    {
      pose: "starSleep",
      text: "แวะพักสายตาสักนิดได้นะ ระบบบันทึกสเต็ปที่อ่านค้างไว้ให้อัตโนมัติเลย"
    },
    {
      pose: "cert",
      text: "เรียนและสอบผ่านครบทั้ง 16 หน่วยเมื่อไหร่ ดาวน์โหลดเกียรติบัตรออนไลน์ได้ทันที!"
    }
  ];

  const CONTEXT_STATES = {
    auth: {
      pose: "study",
      ambientRoute: "auth",
      text: "สวัสดี! ลงชื่อเข้าใช้ด้วยรหัสนักเรียนเพื่อเริ่มบทเรียนได้เลย"
    },
    home: {
      pose: "cheer",
      ambientRoute: "home",
      text: "ลองกดปุ่ม สแกนทันที บนเครื่องจำลองด้านบนเพื่อดูการแปลงสัญญาณสิ!"
    },
    lessons: {
      pose: "starIdea",
      ambientRoute: "lessons",
      text: "เลือกหน่วยการเรียนรู้ที่ต้องการ แล้วค่อยๆ อ่านทีละสเต็ปได้เลย"
    },
    reader: {
      pose: "starIdea",
      ambientRoute: "reader",
      text: "อ่านครบทุกสเต็ปในหน่วยนี้แล้ว ปุ่มทำแบบทดสอบ 10 ข้อจะปลดล็อกทันที!"
    },
    quiz: {
      pose: "starIdea",
      ambientRoute: "quiz",
      text: "ตั้งใจอ่านโจทย์นะ ตอบถูก 8 ข้อขึ้นไปผ่านฉลุยแน่นอน!"
    },
    quiz_correct: {
      pose: "starExcited",
      ambientRoute: "quiz",
      text: "เยี่ยมมาก! ตอบถูกต้องแม่นยำ ไปลุยข้อถัดไปกันเลย"
    },
    quiz_wrong: {
      pose: "study",
      ambientRoute: "quiz",
      text: "ไม่เป็นไรนะ ลองอ่านคำอธิบายเฉลยด้านล่างเพื่อเก็บเทคนิคกัน!"
    },
    quiz_pass: {
      pose: "cheer",
      ambientRoute: "quiz",
      text: "สุดยอดไปเลย! สอบผ่านเกณฑ์ 80% ประจำหน่วยเรียบร้อยแล้ว"
    },
    quiz_retry: {
      pose: "starShy",
      ambientRoute: "quiz",
      text: "เกือบผ่านแล้ว! ทบทวนจุดสำคัญอีกนิดแล้วกดสอบใหม่ได้เลย"
    },
    progress: {
      pose: "cheer",
      ambientRoute: "progress",
      text: "สะสมครบทั้ง 16 หน่วย (100%) รับใบเกียรติบัตรประจำรายวิชาได้เลย!"
    }
  };

  let tipCursor = 0;
  let bubbleDismissed = false;
  let autoCollapseTimer = null;
  let lastAuthHidden = null;

  function isReducedMotion() {
    return (
      document.documentElement.getAttribute("data-motion") === "reduced" ||
      (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    );
  }

  function normalizeMascotSrc(src) {
    if (!src) return "";
    const idx = src.indexOf("images/mascot/");
    return idx >= 0 ? src.slice(idx).split("?")[0] : src.split("?")[0];
  }

  function isElementRenderedVisible(el) {
    if (!el || !el.isConnected) return false;
    let cur = el;
    while (cur && cur !== document.documentElement) {
      if (cur.classList && cur.classList.contains("hidden")) return false;
      const st = window.getComputedStyle(cur);
      if (st.display === "none" || st.visibility === "hidden") {
        return false;
      }
      cur = cur.parentElement;
    }
    return true;
  }

  /**
   * Collects normalized `images/mascot/...` paths currently visible on screen,
   * optionally excluding specific `<img>` elements being reassigned.
   */
  function collectVisibleMascotSet(excludeEls = []) {
    const excluded = new Set(excludeEls.filter(Boolean));
    const used = new Set();

    document.querySelectorAll('img[src*="images/mascot/"]').forEach((img) => {
      if (excluded.has(img)) return;
      if (isElementRenderedVisible(img)) {
        used.add(normalizeMascotSrc(img.getAttribute("src") || ""));
      }
    });

    // Reserve star-9-congrats when any E-Certificate canvas is visible on screen
    const homeCertCanvas = document.getElementById("home-cert-preview-canvas");
    const modalCertCanvas = document.getElementById("modal-cert-preview-canvas");
    if (isElementRenderedVisible(homeCertCanvas) || isElementRenderedVisible(modalCertCanvas)) {
      used.add(POSES.starCongrats);
    }

    return used;
  }

  function pickNonDuplicateSrc(preferredPoseKey, usedSet) {
    const preferredSrc = POSES[preferredPoseKey] || POSES.starWave;
    if (!usedSet.has(preferredSrc)) {
      return preferredSrc;
    }
    for (let i = 0; i < FALLBACK_ROTATION_ORDER.length; i++) {
      const candidateSrc = POSES[FALLBACK_ROTATION_ORDER[i]];
      if (candidateSrc && !usedSet.has(candidateSrc)) {
        return candidateSrc;
      }
    }
    return preferredSrc;
  }

  function syncAmbientMascots(routeKey, extraUsedSet) {
    const ambientEls = [
      document.getElementById("ambient-mascot-1"),
      document.getElementById("ambient-mascot-2"),
      document.getElementById("ambient-mascot-3"),
      document.getElementById("ambient-mascot-4")
    ].filter(Boolean);

    if (ambientEls.length === 0) return;

    const desiredPoses = AMBIENT_ROUTE_SETS[routeKey] || AMBIENT_ROUTE_SETS.home;
    const used = extraUsedSet
      ? new Set(extraUsedSet)
      : collectVisibleMascotSet(ambientEls);

    ambientEls.forEach((imgEl, idx) => {
      const poseKey = desiredPoses[idx] || FALLBACK_ROTATION_ORDER[idx];
      const chosenSrc = pickNonDuplicateSrc(poseKey, used);
      used.add(chosenSrc);
      if (normalizeMascotSrc(imgEl.getAttribute("src") || "") !== chosenSrc) {
        imgEl.setAttribute("src", chosenSrc);
      }
    });
  }

  function loadBubblePref() {
    try {
      bubbleDismissed = sessionStorage.getItem("cdti_mascot_bubble_hidden") === "1";
    } catch (e) {
      bubbleDismissed = false;
    }
  }

  function saveBubblePref(hidden) {
    bubbleDismissed = Boolean(hidden);
    try {
      sessionStorage.setItem("cdti_mascot_bubble_hidden", bubbleDismissed ? "1" : "0");
    } catch (e) {}
  }

  function scheduleBubbleAutoTuck(ms = 4800) {
    if (autoCollapseTimer) clearTimeout(autoCollapseTimer);
    autoCollapseTimer = setTimeout(() => {
      const bubbleEl = document.getElementById("mascot-companion-bubble");
      const root = document.getElementById("studio-mascot-companion");
      if (bubbleEl && (!root || !root.matches(":hover"))) {
        bubbleEl.classList.add("is-collapsed");
      }
    }, ms);
  }

  function bounceAvatar(imgEl) {
    if (!imgEl || isReducedMotion()) return;
    imgEl.classList.remove("is-bouncing");
    void imgEl.offsetWidth;
    imgEl.classList.add("is-bouncing");
  }

  function setState(stateKey, options = {}) {
    const cfg = CONTEXT_STATES[stateKey] || CONTEXT_STATES.home;

    const root = document.getElementById("studio-mascot-companion");
    const imgEl = document.getElementById("mascot-companion-img");
    const textEl = document.getElementById("mascot-companion-text");
    const bubbleEl = document.getElementById("mascot-companion-bubble");
    const ambientEls = [
      document.getElementById("ambient-mascot-1"),
      document.getElementById("ambient-mascot-2"),
      document.getElementById("ambient-mascot-3"),
      document.getElementById("ambient-mascot-4")
    ].filter(Boolean);

    // 1. Gather inline mascots currently visible on screen (excluding companion + ambient)
    const usedInline = collectVisibleMascotSet([imgEl, ...ambientEls]);

    // 2. Pick non-duplicate companion pose
    if (root && imgEl && textEl && bubbleEl) {
      const nextSrc = pickNonDuplicateSrc(cfg.pose, usedInline);
      if (isElementRenderedVisible(root)) {
        usedInline.add(nextSrc);
      }
      if (normalizeMascotSrc(imgEl.getAttribute("src") || "") !== nextSrc) {
        imgEl.setAttribute("src", nextSrc);
      }
      textEl.textContent = options.customText || cfg.text;

      if (options.forceShowBubble || (!bubbleDismissed && options.showBubble !== false)) {
        bubbleEl.classList.remove("is-collapsed");
        scheduleBubbleAutoTuck(options.durationMs || 4600);
      } else {
        bubbleEl.classList.add("is-collapsed");
      }

      if (options.bounce !== false) {
        bounceAvatar(imgEl);
      }
    }

    // 3. Sync wide-margin ambient mascots with zero overlap against inline + companion
    syncAmbientMascots(cfg.ambientRoute || "home", usedInline);
  }

  function syncFromDomRoute() {
    const authScreen = document.getElementById("auth-screen");
    if (authScreen && !authScreen.classList.contains("hidden")) {
      setState("auth", { bounce: false });
      return;
    }

    const viewHome = document.getElementById("view-home");
    const viewLessons = document.getElementById("view-lessons");
    const viewProgress = document.getElementById("view-progress");

    if (viewProgress && !viewProgress.classList.contains("hidden")) {
      setState("progress", { bounce: false });
    } else if (viewLessons && !viewLessons.classList.contains("hidden")) {
      const ws = document.getElementById("lesson-workspace");
      if (ws && !ws.classList.contains("hidden")) {
        if (ws.querySelector(".quiz-result-card")) {
          const passed = Boolean(ws.querySelector(".quiz-result-card .status-pill.is-pass"));
          setState(passed ? "quiz_pass" : "quiz_retry", { bounce: false });
        } else if (ws.querySelector(".quiz-cockpit-shell") || ws.querySelector(".quiz-countdown-card")) {
          setState("quiz", { bounce: false });
        } else {
          setState("reader", { bounce: false });
        }
      } else {
        setState("lessons", { bounce: false });
      }
    } else if (viewHome && !viewHome.classList.contains("hidden")) {
      setState("home", { bounce: false });
    }
  }

  function initCompanion() {
    loadBubblePref();
    const root = document.getElementById("studio-mascot-companion");
    const avatarBtn = document.getElementById("mascot-companion-trigger");
    const closeBtn = document.getElementById("mascot-companion-close");
    const bubbleEl = document.getElementById("mascot-companion-bubble");
    const imgEl = document.getElementById("mascot-companion-img");
    const textEl = document.getElementById("mascot-companion-text");

    if (!root || !avatarBtn) return;

    avatarBtn.addEventListener("mouseenter", () => {
      if (!bubbleDismissed && bubbleEl) {
        bubbleEl.classList.remove("is-collapsed");
      }
    });

    root.addEventListener("mouseleave", () => {
      scheduleBubbleAutoTuck(2400);
    });

    avatarBtn.addEventListener("click", () => {
      const usedOthers = collectVisibleMascotSet([imgEl]);
      let chosenTip = INTERACTIVE_TIPS[tipCursor % INTERACTIVE_TIPS.length];
      for (let attempt = 0; attempt < INTERACTIVE_TIPS.length; attempt++) {
        const candidate = INTERACTIVE_TIPS[(tipCursor + attempt) % INTERACTIVE_TIPS.length];
        if (!usedOthers.has(POSES[candidate.pose])) {
          chosenTip = candidate;
          tipCursor = (tipCursor + attempt + 1) % INTERACTIVE_TIPS.length;
          break;
        }
      }

      const safeSrc = pickNonDuplicateSrc(chosenTip.pose, usedOthers);
      saveBubblePref(false);
      if (bubbleEl) bubbleEl.classList.remove("is-collapsed");
      if (imgEl) imgEl.setAttribute("src", safeSrc);
      if (textEl) textEl.textContent = chosenTip.text;
      bounceAvatar(imgEl);
      scheduleBubbleAutoTuck(5500);
      window.SoundEngine?.playPop?.();

      if (!isReducedMotion() && window.MotionEngine?.burstQuizConfetti) {
        const rect = avatarBtn.getBoundingClientRect();
        window.MotionEngine.burstQuizConfetti(rect.left + rect.width * 0.5, rect.top + 18);
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        saveBubblePref(true);
        if (bubbleEl) bubbleEl.classList.add("is-collapsed");
        window.SoundEngine?.playClick?.();
      });
    }

    const authEl = document.getElementById("auth-screen");
    lastAuthHidden = authEl ? authEl.classList.contains("hidden") : false;

    const observer = new MutationObserver(() => {
      const mgWs = document.getElementById("minigame-workspace");
      const isPlayingMinigame = mgWs && !mgWs.classList.contains("hidden");
      root.classList.toggle("is-minigame-hidden", Boolean(isPlayingMinigame));

      const nowAuthHidden = authEl ? authEl.classList.contains("hidden") : false;
      if (nowAuthHidden !== lastAuthHidden) {
        lastAuthHidden = nowAuthHidden;
      }
      syncFromDomRoute();
    });

    [
      "auth-screen",
      "app-shell",
      "view-home",
      "view-lessons",
      "view-progress",
      "lesson-workspace",
      "minigame-workspace",
      "cert-preview-modal"
    ].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    });

    document.addEventListener("click", (e) => {
      const navTrigger = e.target.closest(
        "[data-nav-view], [data-module-filter], [data-open-unit], [data-enter-unit], [data-start-unit-quiz], #btn-back-to-directory, #tab-switch-reader, #tab-switch-quiz, #logout-btn"
      );
      if (navTrigger) {
        setTimeout(syncFromDomRoute, 90);
      }
    });

    syncFromDomRoute();
  }

  function getPoseForModule(moduleId) {
    const id = Number(moduleId) || 1;
    if (id === 1) return POSES.keyboard;
    if (id === 2) return POSES.scanner;
    if (id === 3) return POSES.cheer;
    return POSES.cert;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCompanion);
  } else {
    initCompanion();
  }

  window.MascotCompanion = {
    POSES,
    setState,
    syncFromDomRoute,
    getPoseForModule
  };
})();
