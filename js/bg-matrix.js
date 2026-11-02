/**
 * ============================================================================
 * js/bg-matrix.js — Creative Studio Pop Interactive Background Canvas (60fps)
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * ฟีเจอร์พื้นหลังสไตล์ Creative Studio Pop:
 *   1. CMY Pixel Swatches & Vector Anchor Nodes: พิกเซลสี่เหลี่ยมและจุดยึดเวกเตอร์ลอยตัวนุ่มนวล
 *   2. Desktop Cursor CMY Sparkles: ประกายสีสวอตช์ CMY ตามเคอร์เซอร์ (เฉพาะเดสก์ท็อป)
 *   3. Interactive Color Swatch Ripple: คลื่นวงแหวนสีเมื่อคลิกพื้นที่ว่าง
 *   4. Reduced-Motion & Tab-Visibility Safe: เคารพ prefers-reduced-motion และประหยัดพลังงาน
 * ============================================================================
 */

(function () {
  "use strict";

  const STORAGE_KEY = "cdti_bg_effect_mode"; // 'active' | 'subtle' | 'off'
  let currentMode = "active";
  try {
    currentMode = localStorage.getItem(STORAGE_KEY) || "active";
  } catch (e) {}

  const canvas = document.createElement("canvas");
  canvas.id = "bg-interactive-canvas";
  canvas.className = "bg-interactive-canvas";
  canvas.setAttribute("aria-hidden", "true");

  let ctx = null;
  let animFrameId = null;
  let width = 0;
  let height = 0;
  let dpr = 1;

  // CMY + Studio Pop Palette
  const POP_COLORS = [
    "#FF3D9A", // Magenta
    "#00C6E0", // Cyan
    "#FFD23F", // Yellow
    "#7B4DFF", // Purple
    "#2EE59D", // Mint
    "#FF7A45"  // Coral
  ];

  const mouse = {
    x: -9999,
    y: -9999,
    lastSparkleX: -9999,
    lastSparkleY: -9999,
    active: false,
    isFinePointer: false
  };

  const ripples = [];
  const sparkles = [];
  const particles = [];
  const PARTICLE_COUNT = 26;
  const MAX_SPARKLES = 20;

  function isDarkMode() {
    return document.documentElement.getAttribute("data-theme") === "dark";
  }

  function isReducedMotion() {
    return (
      document.documentElement.getAttribute("data-motion") === "reduced" ||
      (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
        document.documentElement.getAttribute("data-motion") !== "full")
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
    const shapes = ["pixel", "anchor", "swatch", "dot"];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.36,
        vy: -0.18 - Math.random() * 0.34,
        shape: shapes[i % shapes.length],
        color: POP_COLORS[i % POP_COLORS.length],
        size: 6 + Math.random() * 6,
        rot: Math.random() * Math.PI,
        vRot: (Math.random() - 0.5) * 0.012,
        baseAlpha: 0.2 + Math.random() * 0.25,
        pulseAngle: Math.random() * Math.PI * 2,
        pulseSpeed: 0.018 + Math.random() * 0.02
      });
    }
  }

  function spawnSparkle(x, y) {
    if (currentMode !== "active" || isReducedMotion()) return;
    if (sparkles.length >= MAX_SPARKLES) sparkles.shift();
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.6 + Math.random() * 1.4;
    sparkles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.35,
      size: 4 + Math.random() * 4.5,
      color: POP_COLORS[Math.floor(Math.random() * POP_COLORS.length)],
      alpha: 0.85,
      rot: Math.random() * Math.PI
    });
  }

  function spawnRipple(x, y) {
    if (currentMode === "off" || isReducedMotion()) return;
    ripples.push({
      x,
      y,
      radius: 8,
      maxRadius: Math.min(width, height) * 0.26,
      alpha: 0.55,
      speed: 3.6,
      color: POP_COLORS[Math.floor(Math.random() * POP_COLORS.length)]
    });
    if (ripples.length > 5) ripples.shift();
  }

  function render() {
    if (!ctx) return;

    if (currentMode === "off" || isReducedMotion()) {
      ctx.clearRect(0, 0, width, height);
      animFrameId = null;
      return;
    }

    ctx.clearRect(0, 0, width, height);
    const dark = isDarkMode();
    const inkColor = dark ? "#FFFBF2" : "#1B1340";

    // 1. Draw Floating Studio Pop Motifs (Pixels, Vector Anchor Nodes, Swatches)
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vRot;
      p.pulseAngle += p.pulseSpeed;

      if (p.y < -24) {
        p.y = height + 16;
        p.x = Math.random() * width;
      }
      if (p.x < -24) p.x = width + 16;
      if (p.x > width + 24) p.x = -16;

      const alpha = Math.max(0.08, p.baseAlpha + Math.sin(p.pulseAngle) * 0.08);
      ctx.save();
      ctx.globalAlpha = currentMode === "subtle" ? alpha * 0.6 : alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);

      if (p.shape === "pixel") {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.strokeStyle = inkColor;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
      } else if (p.shape === "anchor") {
        // Bezier vector anchor point handle motif
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.lineTo(p.size, 0);
        ctx.stroke();
        ctx.fillStyle = dark ? "#1E1642" : "#FFFFFF";
        ctx.strokeStyle = inkColor;
        ctx.fillRect(-3.5, -3.5, 7, 7);
        ctx.strokeRect(-3.5, -3.5, 7, 7);
      } else if (p.shape === "swatch") {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.7, -p.size * 0.4, p.size * 1.4, p.size * 0.8);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.42, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Draw Interactive Click Swatch Ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const r = ripples[i];
      r.radius += r.speed;
      r.alpha *= 0.955;

      if (r.alpha <= 0.015 || r.radius >= r.maxRadius) {
        ripples.splice(i, 1);
        continue;
      }

      ctx.save();
      ctx.globalAlpha = r.alpha;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Draw Desktop Cursor CMY Sparkles
    if (mouse.isFinePointer && sparkles.length > 0) {
      for (let i = sparkles.length - 1; i >= 0; i--) {
        const s = sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.032;
        s.rot += 0.06;

        if (s.alpha <= 0.02) {
          sparkles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.fillStyle = s.color;
        ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
        ctx.restore();
      }
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

  function onPointerMove(e) {
    if (currentMode === "off" || isReducedMotion()) return;
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
    mouse.isFinePointer = e.pointerType === "mouse" || (!e.pointerType && window.innerWidth >= 900);

    if (mouse.isFinePointer && currentMode === "active") {
      const dx = e.clientX - mouse.lastSparkleX;
      const dy = e.clientY - mouse.lastSparkleY;
      if (dx * dx + dy * dy > 520) {
        mouse.lastSparkleX = e.clientX;
        mouse.lastSparkleY = e.clientY;
        spawnSparkle(e.clientX, e.clientY);
      }
    }
  }

  function onPointerLeave() {
    mouse.active = false;
  }

  function onPointerDown(e) {
    if (e.target && e.target.closest("button, a, input, select, textarea")) {
      return;
    }
    spawnRipple(e.clientX, e.clientY);
  }

  function handleVisibilityChange() {
    if (document.hidden) {
      stopAnimation();
    } else {
      startAnimation();
    }
  }

  function setMode(mode) {
    if (mode !== "active" && mode !== "subtle" && mode !== "off") mode = "active";
    currentMode = mode;
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {}
    updateToggleButtons();
    if (mode === "off" || isReducedMotion()) {
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
          ? "FX: สตูดิโอเต็มรูปแบบ"
          : currentMode === "subtle"
          ? "FX: ระดับเบา"
          : "FX: ปิดเอฟเฟกต์";
      btn.setAttribute("title", `ลูกเล่นพื้นหลัง: ${modeLabel} (คลิกเพื่อเปลี่ยน)`);
      btn.setAttribute("aria-label", `ลูกเล่นพื้นหลัง: ${modeLabel}`);
      const textSpan = btn.querySelector(".bg-fx-label");
      if (textSpan) textSpan.textContent = modeLabel;
      btn.classList.toggle("is-disabled", currentMode === "off");
    });
  }

  function mount() {
    if (document.getElementById("bg-interactive-canvas")) return;

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

    const observer = new MutationObserver(() => {
      if (isReducedMotion() || currentMode === "off") {
        stopAnimation();
      } else {
        startAnimation();
      }
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-motion"]
    });

    updateToggleButtons();

    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-bg-effect-toggle]");
      if (btn) {
        cycleMode();
        window.SoundEngine?.playClick?.();
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
