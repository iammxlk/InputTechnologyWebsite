/**
 * ============================================================================
 * js/motion.js — 60fps Composite Motion, Micro-Interactions & Parallax Engine
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * รองรับระบบแอนิเมชันครบทั้ง 7 หมวดตามหลัก Animation Performance:
 *   1. Hover Animations (Composite transform & explicit color transitions)
 *   2. Loading Animations (Top progress bar, inline SVG button spinner, skeleton pulse)
 *   3. Scroll Animations (IntersectionObserver staggered reveal + scroll progress bar)
 *   4. Button Animations (Press scale, pointer-origin ripple, anti-double-click guard)
 *   5. Page Transition Animations (Directional view, step & modal transitions)
 *   6. Parallax Animations (rAF-throttled multi-layer SVG depth scenes)
 *   7. Input Field Animations (Floating placeholder labels, focus bar & error shake)
 * ============================================================================
 */

(function () {
  function isReducedMotion() {
    return document.documentElement.getAttribute("data-motion") === "reduced";
  }

  /* ==========================================================================
     1. TOP NETWORK / ROUTE LOADING BAR & INLINE BUTTON SPINNER
     ========================================================================== */

  let activeLoadCount = 0;
  let loaderTrickleTimer = null;
  let loaderHideTimer = null;
  let currentLoaderProgress = 0;

  function setLoaderScale(value, visible) {
    const bar = document.getElementById("top-loading-bar");
    if (!bar) return;
    currentLoaderProgress = value;
    bar.style.transform = `scaleX(${Math.max(0, Math.min(1, value)).toFixed(3)})`;
    bar.style.opacity = visible ? "1" : "0";
  }

  function startTopLoader() {
    activeLoadCount += 1;
    if (loaderHideTimer) {
      clearTimeout(loaderHideTimer);
      loaderHideTimer = null;
    }
    if (activeLoadCount === 1) {
      setLoaderScale(0.18, true);
      if (loaderTrickleTimer) clearInterval(loaderTrickleTimer);
      loaderTrickleTimer = setInterval(() => {
        if (currentLoaderProgress < 0.86) {
          const next = currentLoaderProgress + (0.9 - currentLoaderProgress) * 0.18;
          setLoaderScale(next, true);
        }
      }, 160);
    }
  }

  function doneTopLoader() {
    activeLoadCount = Math.max(0, activeLoadCount - 1);
    if (activeLoadCount > 0) return;

    if (loaderTrickleTimer) {
      clearInterval(loaderTrickleTimer);
      loaderTrickleTimer = null;
    }
    setLoaderScale(1, true);
    loaderHideTimer = setTimeout(() => {
      setLoaderScale(0, false);
    }, 240);
  }

  function getInlineSpinnerSvg() {
    return `
      <svg class="btn-spinner-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.4" opacity="0.28"></circle>
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path>
      </svg>
    `;
  }

  function setButtonLoading(btn, isLoading, loadingText) {
    if (!btn) return;
    if (isLoading) {
      if (!btn.hasAttribute("data-orig-html")) {
        btn.setAttribute("data-orig-html", btn.innerHTML);
      }
      btn.disabled = true;
      btn.classList.add("is-loading");
      btn.setAttribute("aria-busy", "true");
      const safeLabel = window.AppUtils
        ? window.AppUtils.escapeHtml(loadingText || "กำลังประมวลผล...")
        : loadingText || "กำลังประมวลผล...";
      btn.innerHTML = `${getInlineSpinnerSvg()}<span>${safeLabel}</span>`;
      startTopLoader();
    } else {
      const origHtml = btn.getAttribute("data-orig-html");
      if (origHtml !== null) {
        btn.innerHTML = origHtml;
        btn.removeAttribute("data-orig-html");
      }
      btn.disabled = false;
      btn.classList.remove("is-loading");
      btn.removeAttribute("aria-busy");
      doneTopLoader();
    }
  }

  function buildLeaderboardSkeletonRows(rowCount = 5) {
    let html = "";
    for (let i = 0; i < rowCount; i++) {
      html += `
        <tr class="skeleton-table-row" aria-hidden="true">
          <td><span class="skeleton-block" style="width: 30px; height: 30px; border-radius: 50%;"></span></td>
          <td>
            <div style="display: flex; align-items: center; gap: 12px;">
              <span class="skeleton-block" style="width: 34px; height: 34px; border-radius: 50%;"></span>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                <span class="skeleton-block" style="width: 140px; height: 13px;"></span>
                <span class="skeleton-block" style="width: 96px; height: 10px;"></span>
              </div>
            </div>
          </td>
          <td><span class="skeleton-block" style="width: 84px; height: 13px;"></span></td>
          <td class="num"><span class="skeleton-block" style="width: 42px; height: 13px; margin-left: auto;"></span></td>
          <td class="num"><span class="skeleton-block" style="width: 42px; height: 13px; margin-left: auto;"></span></td>
          <td class="num"><span class="skeleton-block" style="width: 52px; height: 15px; margin-left: auto;"></span></td>
          <td class="num"><span class="skeleton-block" style="width: 56px; height: 13px; margin-left: auto;"></span></td>
        </tr>
      `;
    }
    return html;
  }

  /* ==========================================================================
     2. POINTER-ORIGIN BUTTON RIPPLE & TACTILE FEEDBACK
     ========================================================================== */

  const RIPPLE_SELECTOR = [
    ".btn-primary",
    ".btn-secondary",
    ".btn-danger-outline",
    ".nav-btn",
    ".segmented-tab-btn",
    ".filter-pill-btn",
    ".quiz-option-btn",
    ".mg-pad-btn",
    ".step-rail-btn"
  ].join(", ");

  function initRippleSystem() {
    document.addEventListener(
      "pointerdown",
      (e) => {
        if (isReducedMotion()) return;
        if (e.button && e.button !== 0) return;

        const btn = e.target.closest(RIPPLE_SELECTOR);
        if (!btn || btn.disabled || btn.classList.contains("is-loading")) return;

        const rect = btn.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const size = Math.max(rect.width, rect.height) * 1.15;
        const x = (e.clientX || rect.left + rect.width / 2) - rect.left - size / 2;
        const y = (e.clientY || rect.top + rect.height / 2) - rect.top - size / 2;

        const wave = document.createElement("span");
        const isDarkSurface = btn.classList.contains("btn-primary") || btn.classList.contains("is-current");
        wave.className = `btn-ripple-wave ${isDarkSurface ? "is-light" : "is-tint"}`;
        wave.style.width = `${size}px`;
        wave.style.height = `${size}px`;
        wave.style.left = `${x}px`;
        wave.style.top = `${y}px`;

        btn.appendChild(wave);
        const cleanup = () => {
          if (wave.parentNode) wave.parentNode.removeChild(wave);
        };
        wave.addEventListener("animationend", cleanup, { once: true });
        setTimeout(cleanup, 600);
      },
      { passive: true }
    );
  }

  /* ==========================================================================
     3. FLOATING INPUT PLACEHOLDERS & ERROR SHAKE ANIMATION
     ========================================================================== */

  function syncFloatingFieldState(inputEl) {
    if (!inputEl) return;
    const wrapper = inputEl.closest(".floating-field");
    if (!wrapper) return;
    const hasVal = String(inputEl.value || "").length > 0;
    wrapper.classList.toggle("has-value", hasVal);
  }

  function syncAllFloatingFields(root = document) {
    root.querySelectorAll(".floating-field .input-control").forEach(syncFloatingFieldState);
  }

  function initFloatingInputs() {
    document.addEventListener("focusin", (e) => {
      const input = e.target.closest && e.target.closest(".floating-field .input-control");
      if (!input) return;
      input.closest(".floating-field")?.classList.add("is-focused");
      syncFloatingFieldState(input);
    });

    document.addEventListener("focusout", (e) => {
      const input = e.target.closest && e.target.closest(".floating-field .input-control");
      if (!input) return;
      input.closest(".floating-field")?.classList.remove("is-focused");
      syncFloatingFieldState(input);
    });

    document.addEventListener("input", (e) => {
      const input = e.target.closest && e.target.closest(".floating-field .input-control");
      if (input) syncFloatingFieldState(input);
    });

    document.addEventListener("change", (e) => {
      const input = e.target.closest && e.target.closest(".floating-field .input-control");
      if (input) syncFloatingFieldState(input);
    });

    document.addEventListener("reset", (e) => {
      const form = e.target;
      setTimeout(() => {
        if (form && form.querySelectorAll) {
          syncAllFloatingFields(form);
        }
      }, 0);
    });

    syncAllFloatingFields();
  }

  function shakeElement(el) {
    if (!el || isReducedMotion()) return;
    el.classList.remove("is-shaking");
    // Trigger composite keyframe replay cleanly
    void el.offsetWidth;
    el.classList.add("is-shaking");
    setTimeout(() => {
      el.classList.remove("is-shaking");
    }, 440);
  }

  /* ==========================================================================
     4. SCROLL REVEAL (INTERSECTION OBSERVER) & SCROLL PROGRESS BAR
     ========================================================================== */

  const REVEAL_SELECTOR = [
    ".home-hero-main",
    ".home-cert-showcase",
    ".metric-strip",
    ".surface-card",
    ".module-overview-card",
    ".minigame-checkpoint-card",
    ".podium-strip",
    ".my-rank-banner",
    ".lesson-flow-item",
    ".lesson-info-card",
    ".lesson-callout-box"
  ].join(", ");

  let revealObserver = null;
  let scrollTicking = false;

  function updateScrollProgressBar() {
    const bar = document.getElementById("scroll-progress-bar");
    if (!bar) return;
    const docEl = document.documentElement;
    const scrollTop = window.scrollY || docEl.scrollTop || 0;
    const maxScroll = Math.max(0, docEl.scrollHeight - window.innerHeight);
    const ratio = maxScroll > 24 ? Math.min(1, Math.max(0, scrollTop / maxScroll)) : 0;
    bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    bar.style.opacity = ratio > 0.01 ? "1" : "0";
  }

  function refreshScrollReveal(root = document) {
    const nodes = root.querySelectorAll
      ? root.querySelectorAll(REVEAL_SELECTOR)
      : [];
    if (!nodes.length) return;

    if (isReducedMotion() || typeof IntersectionObserver === "undefined") {
      nodes.forEach((el) => {
        el.classList.add("reveal-ready", "is-revealed");
      });
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        {
          root: null,
          rootMargin: "0px 0px -24px 0px",
          threshold: 0.05
        }
      );
    }

    let siblingBatchIndex = 0;
    let lastParent = null;

    nodes.forEach((el) => {
      if (el.classList.contains("is-revealed")) return;
      if (el.closest(".modal-overlay")) return;

      if (el.parentElement !== lastParent) {
        lastParent = el.parentElement;
        siblingBatchIndex = 0;
      } else {
        siblingBatchIndex = Math.min(5, siblingBatchIndex + 1);
      }

      el.style.setProperty("--stagger-ms", `${siblingBatchIndex * 42}ms`);
      el.classList.add("reveal-ready");

      const rect = el.getBoundingClientRect();
      const inInitialViewport =
        rect.height > 0 && rect.top < window.innerHeight * 0.96 && rect.bottom >= 0;

      if (inInitialViewport) {
        requestAnimationFrame(() => {
          el.classList.add("is-revealed");
        });
      } else {
        revealObserver.observe(el);
      }
    });
  }

  function initScrollAnimations() {
    window.addEventListener(
      "scroll",
      () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => {
          updateScrollProgressBar();
          scheduleParallaxRender();
          scrollTicking = false;
        });
      },
      { passive: true }
    );

    const appShell = document.getElementById("app-shell");
    if (appShell && typeof MutationObserver !== "undefined") {
      let mutRaf = 0;
      const mutObs = new MutationObserver(() => {
        if (mutRaf) return;
        mutRaf = requestAnimationFrame(() => {
          mutRaf = 0;
          refreshScrollReveal(appShell);
          updateScrollProgressBar();
          cacheParallaxLayers();
        });
      });
      mutObs.observe(appShell, { childList: true, subtree: true });
    }

    refreshScrollReveal(document);
    updateScrollProgressBar();
  }

  /* ==========================================================================
     5. MULTI-LAYER PARALLAX ENGINE (COMPOSITE TRANSLATE3D)
     ========================================================================== */

  let parallaxLayers = [];
  let pointerNormX = 0;
  let pointerNormY = 0;
  let currentParallaxX = 0;
  let currentParallaxY = 0;
  let parallaxRafId = 0;

  function cacheParallaxLayers() {
    parallaxLayers = Array.from(document.querySelectorAll("[data-parallax-depth]"));
  }

  function renderParallaxFrame() {
    parallaxRafId = 0;
    if (isReducedMotion() || parallaxLayers.length === 0) return;

    currentParallaxX += (pointerNormX - currentParallaxX) * 0.18;
    currentParallaxY += (pointerNormY - currentParallaxY) * 0.18;

    const scrollOffset = window.scrollY || 0;

    for (let i = 0; i < parallaxLayers.length; i++) {
      const layer = parallaxLayers[i];
      const rect = layer.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      const depth = parseFloat(layer.getAttribute("data-parallax-depth") || "0.03");
      const moveX = currentParallaxX * depth * 420;
      const moveY = currentParallaxY * depth * 320 - scrollOffset * depth * 0.55;
      layer.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
    }

    if (
      Math.abs(pointerNormX - currentParallaxX) > 0.004 ||
      Math.abs(pointerNormY - currentParallaxY) > 0.004
    ) {
      parallaxRafId = requestAnimationFrame(renderParallaxFrame);
    }
  }

  function scheduleParallaxRender() {
    if (isReducedMotion()) return;
    if (!parallaxRafId) {
      parallaxRafId = requestAnimationFrame(renderParallaxFrame);
    }
  }

  function initParallaxSystem() {
    cacheParallaxLayers();
    window.addEventListener(
      "pointermove",
      (e) => {
        if (isReducedMotion()) return;
        const vw = window.innerWidth || 1;
        const vh = window.innerHeight || 1;
        pointerNormX = (e.clientX / vw - 0.5) * 2;
        pointerNormY = (e.clientY / vh - 0.5) * 2;
        scheduleParallaxRender();
      },
      { passive: true }
    );
  }

  /* ==========================================================================
     6. PAGE, STEP & MODAL TRANSITION ANIMATIONS
     ========================================================================== */

  function animateViewEnter(sectionEl) {
    if (!sectionEl || isReducedMotion()) return;
    sectionEl.classList.remove("is-view-entering");
    void sectionEl.offsetWidth;
    sectionEl.classList.add("is-view-entering");
    refreshScrollReveal(sectionEl);
    updateScrollProgressBar();
  }

  function animateStepSlide(cardEl, direction = "next") {
    if (!cardEl || isReducedMotion()) return;
    const cls = direction === "prev" ? "is-step-sliding-prev" : "is-step-sliding-next";
    cardEl.classList.remove("is-step-sliding-next", "is-step-sliding-prev");
    void cardEl.offsetWidth;
    cardEl.classList.add(cls);
  }

  function animateModalOpen(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("hidden");
    syncAllFloatingFields(modalEl);
    if (isReducedMotion()) return;
    modalEl.classList.remove("is-modal-entering");
    void modalEl.offsetWidth;
    modalEl.classList.add("is-modal-entering");
  }

  /* ==========================================================================
     7. NUMBER TICKER & GEOMETRIC CANVAS CELEBRATION (ZERO EMOJIS)
     ========================================================================== */

  const activeTickers = new WeakMap();

  function animateNumber(el, targetValue, formatter) {
    if (!el) return;
    const finalNum = Number(targetValue) || 0;
    const formatFn =
      typeof formatter === "function" ? formatter : (n) => String(Math.round(n));

    if (isReducedMotion()) {
      el.textContent = formatFn(finalNum);
      el.setAttribute("data-last-num", String(finalNum));
      return;
    }

    const prevAttr = el.getAttribute("data-last-num");
    const startNum = prevAttr !== null ? Number(prevAttr) || 0 : 0;
    el.setAttribute("data-last-num", String(finalNum));

    if (startNum === finalNum) {
      el.textContent = formatFn(finalNum);
      return;
    }

    const prevRaf = activeTickers.get(el);
    if (prevRaf) cancelAnimationFrame(prevRaf);

    const durationMs = 460;
    const startTime = performance.now();

    function step(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 4);
      const current = startNum + (finalNum - startNum) * eased;
      el.textContent = formatFn(current);
      if (t < 1) {
        activeTickers.set(el, requestAnimationFrame(step));
      } else {
        el.textContent = formatFn(finalNum);
        activeTickers.delete(el);
      }
    }

    activeTickers.set(el, requestAnimationFrame(step));
  }

  function burstCelebration() {
    if (isReducedMotion()) return;
    const existing = document.getElementById("celebration-fx-canvas");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }

    const canvas = document.createElement("canvas");
    canvas.id = "celebration-fx-canvas";
    canvas.className = "celebration-fx-canvas";
    canvas.setAttribute("aria-hidden", "true");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    canvas.width = vw * dpr;
    canvas.height = vh * dpr;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      canvas.remove();
      return;
    }
    ctx.scale(dpr, dpr);

    const palette = ["#15499F", "#1B5BC4", "#166534", "#0284C7", "#DCE8FA"];
    const pieces = [];
    for (let i = 0; i < 42; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.35;
      const speed = 6 + Math.random() * 7.5;
      pieces.push({
        x: vw * 0.5 + (Math.random() - 0.5) * 140,
        y: vh * 0.28,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        w: 6 + Math.random() * 5,
        h: 4 + Math.random() * 4,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.22,
        color: palette[i % palette.length],
        alpha: 1
      });
    }

    const startMs = performance.now();
    function frame(now) {
      const elapsed = now - startMs;
      ctx.clearRect(0, 0, vw, vh);
      let alive = 0;
      for (let i = 0; i < pieces.length; i++) {
        const p = pieces[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.26;
        p.vx *= 0.985;
        p.rot += p.vRot;
        p.alpha = Math.max(0, 1 - elapsed / 1150);
        if (p.alpha > 0.02 && p.y < vh + 24) {
          alive += 1;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }
      if (alive > 0 && elapsed < 1200) {
        requestAnimationFrame(frame);
      } else if (canvas.parentNode) {
        canvas.parentNode.removeChild(canvas);
      }
    }
    requestAnimationFrame(frame);
  }

  /* ==========================================================================
     8. BOOTSTRAP MOTION ENGINE
     ========================================================================== */

  function initMotionEngine() {
    document.documentElement.classList.add("motion-ready");
    initRippleSystem();
    initFloatingInputs();
    initScrollAnimations();
    initParallaxSystem();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initMotionEngine);
  } else {
    initMotionEngine();
  }

  window.MotionEngine = {
    isReducedMotion,
    startTopLoader,
    doneTopLoader,
    setButtonLoading,
    buildLeaderboardSkeletonRows,
    syncAllFloatingFields,
    shakeElement,
    refreshScrollReveal,
    updateScrollProgressBar,
    cacheParallaxLayers,
    animateViewEnter,
    animateStepSlide,
    animateModalOpen,
    animateNumber,
    burstCelebration
  };
})();
