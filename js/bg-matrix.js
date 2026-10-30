/**
 * ============================================================================
 * js/bg-matrix.js — Interactive Data Input Telemetry & Signal Background Canvas
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * ฟีเจอร์ลูกเล่นพื้นหลัง:
 *   1. Optical Sensor Cursor Beam: ลำแสงเซนเซอร์และพิกัดดิจิทัลเคลื่อนตามเมาส์
 *   2. Data Packets & Binary Bits: ละอองสัญญาณดิจิทัล (0, 1, รหัสฐานสอง) ลอยละล่อง
 *   3. RFID Electromagnetic Ripple: คลื่นกระจายสัญญาณเมื่อคลิกหรือแตะหน้าจอ
 *   4. Periodic Optical Scanline Sweep: แสงกวาดบาร์โค้ดแนวนอนเป็นระยะ
 *   5. Theme-Aware & Battery-Friendly: ปรับสีตามโหมดมืด-สว่าง และหยุดทำงานเมื่อสลับแท็บ
 * ============================================================================
 */

(function () {
  "use strict";

  const STORAGE_KEY = "cdti_bg_effect_mode"; // 'active' | 'subtle' | 'off'
  let currentMode = localStorage.getItem(STORAGE_KEY) || "active";

  const canvas = document.createElement("canvas");
  canvas.id = "bg-interactive-canvas";
  canvas.className = "bg-interactive-canvas";
  canvas.setAttribute("aria-hidden", "true");

  let ctx = null;
  let animFrameId = null;
  let width = 0;
  let height = 0;
  let dpr = 1;

  // Mouse / Pointer State
  const mouse = {
    x: -9999,
    y: -9999,
    targetX: -9999,
    targetY: -9999,
    active: false,
    radius: 140
  };

  // Ripples pool
  const ripples = [];

  // Data Particles pool
  const particles = [];
  const PARTICLE_COUNT = 32;
  const DATA_SYMBOLS = ["0", "1", "0", "1", "•", "+", "0", "1", "::"];

  // Scanline state
  let scanlineY = -50;
  let scanlineSpeed = 1.6;
  let scanlineCooldown = 0;

  function isDarkMode() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function isReducedMotion() {
    return (
      document.documentElement.getAttribute("data-motion") === "reduced" ||
      (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches)
    );
  }

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }
  }

  function initParticles() {
    particles.length = 0;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: -0.2 - Math.random() * 0.4, // float gently upwards
        symbol: DATA_SYMBOLS[Math.floor(Math.random() * DATA_SYMBOLS.length)],
        size: 9 + Math.random() * 4,
        alpha: 0.15 + Math.random() * 0.35,
        baseAlpha: 0.15 + Math.random() * 0.35,
        pulseSpeed: 0.02 + Math.random() * 0.03,
        pulseAngle: Math.random() * Math.PI * 2
      });
    }
  }

  function spawnRipple(x, y) {
    if (currentMode === "off" || isReducedMotion()) return;
    ripples.push({
      x,
      y,
      radius: 8,
      maxRadius: Math.min(width, height) * 0.32,
      alpha: isDarkMode() ? 0.45 : 0.35,
      speed: 3.8
    });
    // Keep max 6 ripples at a time
    if (ripples.length > 6) ripples.shift();
  }

  function render(time) {
    if (!ctx) return;

    if (currentMode === "off" || isReducedMotion()) {
      ctx.clearRect(0, 0, width, height);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    const dark = isDarkMode();
    // Color Palette
    const colorAccent = dark ? "#38BDF8" : "#FF4814"; // Cyan in dark, Signal Orange in light
    const colorSubtle = dark ? "rgba(56, 189, 248, " : "rgba(20, 23, 31, ";
    const colorBeam = dark ? "rgba(56, 189, 248, 0.07)" : "rgba(255, 72, 20, 0.06)";

    // Smooth mouse interpolation
    mouse.x += (mouse.targetX - mouse.x) * 0.15;
    mouse.y += (mouse.targetY - mouse.y) * 0.15;

    // 1. Draw Optical Barcode Scanline Sweep
    if (currentMode === "active") {
      scanlineY += scanlineSpeed;
      if (scanlineY > height + 40) {
        scanlineCooldown += 1;
        if (scanlineCooldown > 180) { // ~3 seconds gap
          scanlineY = -30;
          scanlineCooldown = 0;
          scanlineSpeed = 1.4 + Math.random() * 0.8;
        }
      } else if (scanlineY >= -30) {
        const grad = ctx.createLinearGradient(0, scanlineY - 18, 0, scanlineY + 18);
        grad.addColorStop(0, "rgba(255, 255, 255, 0)");
        grad.addColorStop(0.5, colorBeam);
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, scanlineY - 18, width, 36);

        // Scanline center laser thread
        ctx.strokeStyle = dark ? "rgba(56, 189, 248, 0.18)" : "rgba(255, 72, 20, 0.14)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanlineY);
        ctx.lineTo(width, scanlineY);
        ctx.stroke();
      }
    }

    // 2. Draw Interactive RFID Ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += r.speed;
      r.alpha *= 0.965;

      if (r.alpha <= 0.01 || r.radius >= r.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.strokeStyle = dark
        ? `rgba(56, 189, 248, ${r.alpha.toFixed(3)})`
        : `rgba(255, 72, 20, ${r.alpha.toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner faint secondary ring
      if (r.radius > 20) {
        ctx.strokeStyle = dark
          ? `rgba(129, 140, 248, ${(r.alpha * 0.5).toFixed(3)})`
          : `rgba(20, 23, 31, ${(r.alpha * 0.4).toFixed(3)})`;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius * 0.65, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 3. Draw Floating Binary & Data Particles
    ctx.font = "500 11px 'Stack Sans Notch', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.y < -20) {
        p.y = height + 10;
        p.x = Math.random() * width;
      }
      if (p.x < -20) p.x = width + 10;
      if (p.x > width + 20) p.x = -10;

      // Pulse alpha
      p.pulseAngle += p.pulseSpeed;
      const currentAlpha = p.baseAlpha + Math.sin(p.pulseAngle) * 0.12;

      // Distance to cursor
      let distToMouse = 9999;
      if (mouse.active) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        distToMouse = Math.sqrt(dx * dx + dy * dy);
      }

      if (distToMouse < mouse.radius) {
        // Light up and connect with laser line to cursor
        const proximity = 1 - distToMouse / mouse.radius;
        ctx.fillStyle = colorAccent;
        ctx.globalAlpha = Math.min(0.85, currentAlpha + proximity * 0.6);

        // Faint laser tether line
        if (currentMode === "active" && proximity > 0.35) {
          ctx.strokeStyle = dark
            ? `rgba(56, 189, 248, ${(proximity * 0.22).toFixed(3)})`
            : `rgba(255, 72, 20, ${(proximity * 0.18).toFixed(3)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      } else {
        ctx.fillStyle = colorSubtle + Math.max(0.06, currentAlpha).toFixed(3) + ")";
        ctx.globalAlpha = 1;
      }

      ctx.fillText(p.symbol, p.x, p.y);
    }
    ctx.globalAlpha = 1;

    // 4. Draw Cursor Optical Scanner Beam / Target Aura
    if (mouse.active && currentMode === "active") {
      ctx.save();
      // Outer subtle scanner ring
      const ringGrad = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        10,
        mouse.x,
        mouse.y,
        mouse.radius
      );
      ringGrad.addColorStop(0, dark ? "rgba(56, 189, 248, 0.08)" : "rgba(255, 72, 20, 0.07)");
      ringGrad.addColorStop(0.7, dark ? "rgba(56, 189, 248, 0.02)" : "rgba(255, 72, 20, 0.02)");
      ringGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = ringGrad;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, mouse.radius, 0, Math.PI * 2);
      ctx.fill();

      // Precision crosshair ticks around cursor
      ctx.strokeStyle = dark ? "rgba(56, 189, 248, 0.28)" : "rgba(255, 72, 20, 0.25)";
      ctx.lineWidth = 1;
      const tick = 6;
      const offset = 14;

      // Left tick
      ctx.beginPath();
      ctx.moveTo(mouse.x - offset - tick, mouse.y);
      ctx.lineTo(mouse.x - offset, mouse.y);
      // Right tick
      ctx.moveTo(mouse.x + offset, mouse.y);
      ctx.lineTo(mouse.x + offset + tick, mouse.y);
      // Top tick
      ctx.moveTo(mouse.x, mouse.y - offset - tick);
      ctx.lineTo(mouse.x, mouse.y - offset);
      // Bottom tick
      ctx.moveTo(mouse.x, mouse.y + offset);
      ctx.lineTo(mouse.x, mouse.y + offset + tick);
      ctx.stroke();

      ctx.restore();
    }

    animFrameId = requestAnimationFrame(render);
  }

  function startAnimation() {
    if (!animFrameId && currentMode !== "off" && !isReducedMotion()) {
      animFrameId = requestAnimationFrame(render);
    }
  }

  function stopAnimation() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    if (ctx) {
      ctx.clearRect(0, 0, width, height);
    }
  }

  // Pointer event listeners
  function onPointerMove(e) {
    if (currentMode === "off") return;
    mouse.targetX = e.clientX;
    mouse.targetY = e.clientY;
    if (!mouse.active) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }
  }

  function onPointerLeave() {
    mouse.active = false;
    mouse.targetX = -9999;
    mouse.targetY = -9999;
  }

  function onPointerDown(e) {
    if (e.target && e.target.closest("button, a, input, select, textarea")) {
      return; // don't obstruct direct clicks
    }
    spawnRipple(e.clientX, e.clientY);
  }

  // Visibility and resize handlers
  function handleVisibilityChange() {
    if (document.hidden) {
      stopAnimation();
    } else {
      startAnimation();
    }
  }

  // Toggle Mode API
  function setMode(mode) {
    if (mode !== "active" && mode !== "subtle" && mode !== "off") mode = "active";
    currentMode = mode;
    localStorage.setItem(STORAGE_KEY, mode);
    updateToggleButtons();
    if (mode === "off") {
      stopAnimation();
    } else {
      startAnimation();
    }
  }

  function cycleMode() {
    if (currentMode === "active") setMode("subtle");
    else if (currentMode === "subtle") setMode("off");
    else setMode("active");
  }

  function updateToggleButtons() {
    const btns = document.querySelectorAll("[data-bg-effect-toggle]");
    btns.forEach((btn) => {
      const modeLabel =
        currentMode === "active"
          ? "FX: เรดาร์สัญญาณ"
          : currentMode === "subtle"
          ? "FX: ระดับเบา"
          : "FX: ปิดเอฟเฟกต์";
      btn.setAttribute("title", `ลูกเล่นพื้นหลัง: ${modeLabel} (คลิกเพื่อเปลี่ยน)`);
      btn.setAttribute("aria-label", `ลูกเล่นพื้นหลัง: ${modeLabel}`);
      const textSpan = btn.querySelector(".bg-fx-label");
      if (textSpan) textSpan.textContent = modeLabel;

      if (currentMode === "off") {
        btn.classList.add("is-disabled");
      } else {
        btn.classList.remove("is-disabled");
      }
    });
  }

  // Mount system
  function mount() {
    if (document.getElementById("bg-interactive-canvas")) return;

    // Insert canvas as first child of body so it sits behind all content
    document.body.insertBefore(canvas, document.body.firstChild);
    ctx = canvas.getContext("2d", { alpha: true });

    resizeCanvas();
    initParticles();

    window.addEventListener("resize", () => {
      resizeCanvas();
      initParticles();
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Watch theme changes
    const observer = new MutationObserver(() => {
      // Re-render immediately on theme change
      if (ctx && currentMode !== "off") {
        render(performance.now());
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-motion"]
    });

    updateToggleButtons();

    // Attach click handler to any toggle button on the page
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-bg-effect-toggle]");
      if (btn) {
        cycleMode();
        if (window.SoundFX && window.SoundFX.playBlip) {
          window.SoundFX.playBlip();
        }
      }
    });

    startAnimation();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }

  window.BgMatrixEngine = {
    setMode,
    cycleMode,
    getMode: () => currentMode,
    spawnRipple
  };
})();
