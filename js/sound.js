/**
 * ============================================================================
 * js/sound.js — Procedural Web Audio Click SFX & Dark/Light Theme System
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * คุณสมบัติ:
 *   1. Zero-Asset Procedural Audio (Web Audio API, ไม่ต้องโหลดไฟล์ MP3/WAV)
 *   2. เสียงคลิกตอบสนองสมจริง (Tactile Micro-click, Toggle Chime, Success, Pop)
 *   3. สวิตช์เปิด/ปิดเสียง (Sound FX Toggle) บันทึกลง localStorage
 *   4. ระบบสลับ Dark Mode / Light Mode พร้อมบันทึกสถานะและตรวจจับ System Preference
 * ============================================================================
 */

(function () {
  "use strict";

  const STORAGE_KEYS = {
    SOUND_MUTED: "cdti_sound_muted",
    THEME_MODE: "cdti_theme"
  };

  /* ==========================================================================
     1. PROCEDURAL WEB AUDIO SYNTHESIZER
     ========================================================================== */

  let audioCtx = null;
  let isMutedState = false;
  let lastClickTime = 0;

  function initAudioContext() {
    if (audioCtx) {
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    }
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioCtx = new AudioCtor();
      return audioCtx;
    } catch (e) {
      return null;
    }
  }

  function playTone(freq, durationSec, type = "sine", gainPeak = 0.045, delaySec = 0) {
    if (isMutedState) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime + Math.max(0, delaySec);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    } catch (e) {
      // Ignore audio synthesis errors on locked environments
    }
  }

  function playChirp(startFreq, endFreq, durationSec, type = "sine", gainPeak = 0.05) {
    if (isMutedState) return;
    const ctx = initAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + durationSec);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec + 0.015);
    } catch (e) {
      // Silent fail
    }
  }

  const SoundEngine = {
    /**
     * Tactile micro-click sound (crisp, subtle, modern tactile switch feel)
     */
    playClick() {
      const now = Date.now();
      if (now - lastClickTime < 30) return; // Prevent double trigger
      lastClickTime = now;
      playChirp(960, 320, 0.024, "triangle", 0.048);
    },

    /**
     * Subtle bubbly pop for tabs, steps, filters
     */
    playPop() {
      const now = Date.now();
      if (now - lastClickTime < 30) return;
      lastClickTime = now;
      playChirp(520, 840, 0.032, "sine", 0.042);
    },

    /**
     * Two-tone snappy switch sound (theme toggle, sound toggle, visibility)
     */
    playToggle() {
      playTone(660, 0.025, "sine", 0.04, 0);
      playTone(990, 0.035, "sine", 0.045, 0.026);
    },

    /**
     * Uplifting musical triad chime (C5 -> E5 -> G5) for success/pass
     */
    playSuccess() {
      playTone(523.25, 0.08, "triangle", 0.05, 0);
      playTone(659.25, 0.09, "triangle", 0.05, 0.07);
      playTone(783.99, 0.16, "triangle", 0.055, 0.14);
    },

    /**
     * Soft low notification bump for wrong answer or notice
     */
    playError() {
      playTone(220, 0.09, "sawtooth", 0.032, 0);
      playTone(165, 0.12, "sawtooth", 0.028, 0.05);
    },

    /**
     * Short crisp countdown tick (pitch rises on 2 and 1)
     */
    playCountdownTick(count = 1) {
      const freq = count <= 2 ? 880 : 700;
      playTone(freq, 0.055, "sine", 0.055);
    },

    /**
     * Bright energetic chime when countdown reaches 0 / START
     */
    playCountdownGo() {
      playTone(1046.5, 0.06, "triangle", 0.06, 0);
      playTone(1318.5, 0.07, "triangle", 0.065, 0.05);
      playTone(1567.98, 0.16, "triangle", 0.07, 0.11);
    },

    /**
     * Smooth page/modal whoosh
     */
    playWhoosh() {
      playChirp(360, 140, 0.055, "sine", 0.032);
    },

    isMuted() {
      return isMutedState;
    },

    setMuted(muted) {
      isMutedState = Boolean(muted);
      try {
        localStorage.setItem(STORAGE_KEYS.SOUND_MUTED, isMutedState ? "true" : "false");
      } catch (e) {}
      syncSoundButtonsUi();
    },

    toggleSound() {
      this.setMuted(!isMutedState);
      if (!isMutedState) {
        // Play confirming click if now unmuted
        this.playToggle();
      }
      return !isMutedState;
    }
  };

  /* ==========================================================================
     2. DARK MODE & LIGHT MODE THEME SYSTEM
     ========================================================================== */

  let currentTheme = "light";

  function getSystemPreferredTheme() {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }

  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
      if (saved === "dark" || saved === "light") return saved;
    } catch (e) {}
    return getSystemPreferredTheme();
  }

  const ThemeManager = {
    getTheme() {
      return currentTheme;
    },

    isDark() {
      return currentTheme === "dark";
    },

    setTheme(theme, skipStorage = false) {
      const target = theme === "dark" ? "dark" : "light";
      currentTheme = target;

      document.documentElement.setAttribute("data-theme", target);
      if (document.body) {
        document.body.setAttribute("data-theme", target);
      }

      if (!skipStorage) {
        try {
          localStorage.setItem(STORAGE_KEYS.THEME_MODE, target);
        } catch (e) {}
      }

      syncThemeButtonsUi();
      window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: target } }));
    },

    toggleTheme() {
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      SoundEngine.playToggle();
      this.setTheme(nextTheme);
      return nextTheme;
    }
  };

  /* ==========================================================================
     3. UI SYNCHRONIZATION (ICONS & TOOLTIPS)
     ========================================================================== */

  function syncSoundButtonsUi() {
    const muted = SoundEngine.isMuted();
    const soundBtns = document.querySelectorAll("#sound-toggle-btn, #auth-sound-toggle-btn");

    soundBtns.forEach((btn) => {
      btn.setAttribute("aria-pressed", muted ? "false" : "true");
      btn.setAttribute(
        "title",
        muted ? "คลิกเพื่อเปิดเสียงเอฟเฟกต์ (Sound FX Off)" : "คลิกเพื่อปิดเสียงเอฟเฟกต์ (Sound FX On)"
      );

      const iconOn = btn.querySelector(".sound-icon-on");
      const iconOff = btn.querySelector(".sound-icon-off");
      if (iconOn && iconOff) {
        iconOn.classList.toggle("hidden", muted);
        iconOff.classList.toggle("hidden", !muted);
      }
      btn.classList.toggle("is-muted", muted);
    });
  }

  function syncThemeButtonsUi() {
    const isDark = ThemeManager.isDark();
    const themeBtns = document.querySelectorAll("#theme-toggle-btn, #auth-theme-toggle-btn");

    themeBtns.forEach((btn) => {
      btn.setAttribute("aria-label", isDark ? "เปลี่ยนเป็นโหมดสว่าง (Light Mode)" : "เปลี่ยนเป็นโหมดมืด (Dark Mode)");
      btn.setAttribute("title", isDark ? "เปลี่ยนเป็นโหมดสว่าง (Light Mode)" : "เปลี่ยนเป็นโหมดมืด (Dark Mode)");

      const iconSun = btn.querySelector(".theme-icon-sun");
      const iconMoon = btn.querySelector(".theme-icon-moon");
      if (iconSun && iconMoon) {
        iconSun.classList.toggle("hidden", !isDark);
        iconMoon.classList.toggle("hidden", isDark);
      }
      btn.classList.toggle("is-dark-active", isDark);
    });
  }

  /* ==========================================================================
     4. GLOBAL CLICK LISTENER FOR PROCEDURAL SOUND
     ========================================================================== */

  const CLICK_SOUND_SELECTOR = [
    "button:not([data-sound-silent])",
    "[role='button']",
    ".nav-btn",
    ".btn-primary",
    ".btn-secondary",
    ".btn-danger-outline",
    ".segmented-tab-btn",
    ".filter-pill-btn",
    ".quiz-option-btn",
    ".module-unit-link",
    ".step-rail-btn",
    ".pwd-toggle-btn",
    ".mg-pad-btn",
    ".cert-action-btn",
    ".floating-action-btn"
  ].join(", ");

  function initGlobalSoundDelegation() {
    document.addEventListener(
      "pointerdown",
      (e) => {
        // Unlock Web Audio context seamlessly on first interaction
        initAudioContext();

        if (e.button && e.button !== 0) return;
        const target = e.target.closest && e.target.closest(CLICK_SOUND_SELECTOR);
        if (!target || target.disabled || target.classList.contains("is-loading")) return;

        // Skip if target is the mute toggle itself (it plays playToggle)
        if (target.id === "sound-toggle-btn" || target.id === "auth-sound-toggle-btn") {
          return;
        }
        if (target.id === "theme-toggle-btn" || target.id === "auth-theme-toggle-btn") {
          return;
        }

        // Quiz option buttons play their own success/fail tones on answer
        if (target.hasAttribute("data-quiz-choice")) {
          SoundEngine.playClick();
          return;
        }

        if (target.classList.contains("segmented-tab-btn") || target.classList.contains("filter-pill-btn")) {
          SoundEngine.playPop();
          return;
        }

        SoundEngine.playClick();
      },
      { passive: true }
    );
  }

  /* ==========================================================================
     5. INITIALIZATION & BINDINGS
     ========================================================================== */

  function init() {
    // 1. Initialize Muted State
    try {
      isMutedState = localStorage.getItem(STORAGE_KEYS.SOUND_MUTED) === "true";
    } catch (e) {
      isMutedState = false;
    }

    // 2. Initialize Theme
    const initialTheme = getSavedTheme();
    ThemeManager.setTheme(initialTheme, true);

    // 3. Listen to system preference changes if user hasn't set explicit preference
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
        try {
          if (!localStorage.getItem(STORAGE_KEYS.THEME_MODE)) {
            ThemeManager.setTheme(e.matches ? "dark" : "light", true);
          }
        } catch (err) {}
      });
    }

    // 4. Bind Toggle Buttons
    document.addEventListener("click", (e) => {
      const soundBtn = e.target.closest && e.target.closest("#sound-toggle-btn, #auth-sound-toggle-btn");
      if (soundBtn) {
        e.preventDefault();
        SoundEngine.toggleSound();
        return;
      }

      const themeBtn = e.target.closest && e.target.closest("#theme-toggle-btn, #auth-theme-toggle-btn");
      if (themeBtn) {
        e.preventDefault();
        ThemeManager.toggleTheme();
        return;
      }
    });

    // 5. Setup UI sync
    syncSoundButtonsUi();
    syncThemeButtonsUi();

    // 6. Global Click Delegation
    initGlobalSoundDelegation();
  }

  // Expose Globally
  window.SoundEngine = SoundEngine;
  window.ThemeManager = ThemeManager;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
