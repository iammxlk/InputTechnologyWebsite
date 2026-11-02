/* ==========================================================================
   CREATIVE STUDIO POP — INTERACTIVE CHIBI MASCOT COMPANION & REACTIONS
   Course 21901-2017: Data Input Technology (CDTI)
   ========================================================================== */

(function () {
  "use strict";

  const POSES = {
    keyboard: "images/mascot/mascot-keyboard.png",
    scanner: "images/mascot/mascot-scanner.png",
    cheer: "images/mascot/mascot-cheer.png",
    study: "images/mascot/mascot-study.png",
    cert: "images/mascot/mascot-cert.png"
  };

  const INTERACTIVE_TIPS = [
    {
      pose: "scanner",
      text: "บาร์โค้ด EAN-13 ใช้หลักที่ 13 เป็น Check Digit คอยดักจับการพิมพ์ผิดนะ!"
    },
    {
      pose: "study",
      text: "QR Code ระดับ H กู้คืนข้อมูลกลับมาได้แม้ป้ายฉีกขาดหรือเปื้อนถึง 30% เลย"
    },
    {
      pose: "keyboard",
      text: "กดปุ่มลัดตัวเลข 1-3 บนแป้นพิมพ์เพื่อสลับหน้าเมนูหลักได้ไวทันใจ"
    },
    {
      pose: "cheer",
      text: "ทำแบบทดสอบท้ายหน่วยให้ได้ 8/10 คะแนนขึ้นไป (80%) เพื่อผ่านเกณฑ์แต่ละหน่วยนะ!"
    },
    {
      pose: "cert",
      text: "เรียนและสอบผ่านครบทั้ง 16 หน่วยเมื่อไหร่ ดาวน์โหลดเกียรติบัตรออนไลน์ได้ทันที!"
    }
  ];

  const CONTEXT_STATES = {
    auth: {
      pose: "keyboard",
      text: "สวัสดี! ลงชื่อเข้าใช้ด้วยรหัสนักเรียนเพื่อเริ่มบทเรียนได้เลย"
    },
    home: {
      pose: "scanner",
      text: "ลองกดปุ่ม สแกนทันที บนเครื่องจำลองด้านบนเพื่อดูการแปลงสัญญาณสิ!"
    },
    lessons: {
      pose: "study",
      text: "เลือกหน่วยการเรียนรู้ที่ต้องการ แล้วค่อยๆ อ่านทีละสเต็ปได้เลย"
    },
    reader: {
      pose: "study",
      text: "อ่านครบทุกสเต็ปในหน่วยนี้แล้ว ปุ่มทำแบบทดสอบ 10 ข้อจะปลดล็อกทันที!"
    },
    quiz: {
      pose: "study",
      text: "ตั้งใจอ่านโจทย์นะ ตอบถูก 8 ข้อขึ้นไปผ่านฉลุยแน่นอน!"
    },
    quiz_correct: {
      pose: "cheer",
      text: "เยี่ยมมาก! ตอบถูกต้องแม่นยำ ไปลุยข้อถัดไปกันเลย"
    },
    quiz_wrong: {
      pose: "study",
      text: "ไม่เป็นไรนะ ลองอ่านคำอธิบายเฉลยด้านล่างเพื่อเก็บเทคนิคกัน!"
    },
    quiz_pass: {
      pose: "cheer",
      text: "สุดยอดไปเลย! สอบผ่านเกณฑ์ 80% ประจำหน่วยเรียบร้อยแล้ว"
    },
    quiz_retry: {
      pose: "study",
      text: "เกือบผ่านแล้ว! ทบทวนจุดสำคัญอีกนิดแล้วกดสอบใหม่ได้เลย"
    },
    progress: {
      pose: "cert",
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
    if (!root || !imgEl || !textEl || !bubbleEl) return;

    const nextSrc = POSES[cfg.pose] || POSES.keyboard;
    if (imgEl.getAttribute("src") !== nextSrc) {
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
        if (ws.querySelector(".quiz-cockpit-shell")) {
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
      const tip = INTERACTIVE_TIPS[tipCursor % INTERACTIVE_TIPS.length];
      tipCursor += 1;
      saveBubblePref(false);
      if (bubbleEl) bubbleEl.classList.remove("is-collapsed");
      if (imgEl) imgEl.setAttribute("src", POSES[tip.pose] || POSES.cheer);
      if (textEl) textEl.textContent = tip.text;
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
        syncFromDomRoute();
      }
    });

    ["auth-screen", "app-shell", "view-home", "view-lessons", "view-progress", "lesson-workspace", "minigame-workspace"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    });

    document.addEventListener("click", (e) => {
      const navTrigger = e.target.closest("[data-nav-view], #btn-back-to-directory, #tab-switch-reader, #tab-switch-quiz, #logout-btn");
      if (navTrigger) {
        setTimeout(syncFromDomRoute, 100);
      }
    });

    syncFromDomRoute();
  }

  function getPoseForModule(moduleId) {
    const id = Number(moduleId) || 1;
    if (id === 1) return POSES.keyboard;
    if (id === 2) return POSES.scanner;
    if (id === 3) return POSES.study;
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
