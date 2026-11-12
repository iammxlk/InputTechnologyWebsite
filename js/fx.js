/**
 * ============================================================================
 * js/fx.js — ชั้นแอนิเมชันและของตกแต่ง (คู่กับ css/fx.css)
 *   1. ฉากหลัง: แสงฟุ้งดวงที่สอง + พัลส์ข้อมูลไหลตามเส้นไกด์
 *   2. ลำแสงสแกนเปิดหัวข้อหน้าแรก
 *   3. ช่องกระจกติดสว่างแบบสุ่ม (เฉพาะตอนมองเห็นและแท็บเปิดอยู่)
 *   4. แคปซูลเมนูเลื่อนตามหน้าที่เลือก
 *   5. จังหวะเปิดหน้าเข้าสู่ระบบ
 * ทุกอย่างเป็นของตกแต่ง ถ้าไฟล์นี้โหลดไม่ได้ หน้าเว็บยังใช้งานได้ครบ
 * ============================================================================
 */

(function () {
  const root = document.documentElement;
  const isReduced = () => root.getAttribute("data-motion") === "reduced";

  /* ---------- 1. ฉากหลัง ---------- */
  function initBackdrop() {
    const backdrop = document.querySelector(".page-backdrop");
    if (!backdrop || backdrop.querySelector(".fx-ambient-b")) return;
    const frag = document.createDocumentFragment();
    const blob = document.createElement("span");
    blob.className = "fx-ambient-b";
    frag.appendChild(blob);

    // คอลัมน์เส้นไกด์ที่มีพัลส์วิ่ง: [คอลัมน์, ระยะเวลา(วินาที), หน่วงเริ่ม(วินาที)]
    const streams = [
      [0, 11, 0.5],
      [2, 8.5, 3.2],
      [3, 13, 6.4],
      [5, 9.5, 1.6],
      [7, 12, 4.8],
      [8, 8, 7.5],
      [9, 10.5, 2.4]
    ];
    streams.forEach(([col, dur, delay]) => {
      const s = document.createElement("span");
      s.className = "fx-stream";
      s.style.setProperty("--col", String(col));
      s.style.setProperty("--dur", `${dur}s`);
      s.style.setProperty("--delay", `${delay}s`);
      frag.appendChild(s);
    });
    backdrop.appendChild(frag);
  }

  /* ---------- 2. ลำแสงสแกนหัวข้อ ---------- */
  function initScanBeam() {
    const title = document.querySelector("#view-home .hero-title");
    if (!title || title.querySelector(".fx-scan-beam")) return;
    const beam = document.createElement("span");
    beam.className = "fx-scan-beam";
    beam.setAttribute("aria-hidden", "true");
    title.appendChild(beam);
  }

  /* ---------- 3. ช่องกระจกติดสว่าง ---------- */
  function initTilePulse() {
    const zones = Array.from(document.querySelectorAll(".glass-zone"));
    if (!zones.length || typeof IntersectionObserver === "undefined") return;
    const visible = new Set();
    let timer = 0;

    function tick() {
      if (isReduced() || document.hidden || !visible.size) return;
      visible.forEach((zone) => {
        const tiles = zone.querySelectorAll(".glass-tile:not(.is-void):not(.is-pulse)");
        if (!tiles.length) return;
        // เลือกจากแถวบน ๆ ที่ยังไม่ถูกการ์ดบัง
        const pool = Math.min(tiles.length, 60);
        const tile = tiles[Math.floor(Math.random() * pool)];
        tile.classList.add("is-pulse");
        setTimeout(() => tile.classList.remove("is-pulse"), 1850);
      });
    }

    function sync() {
      const shouldRun = visible.size > 0 && !document.hidden;
      if (shouldRun && !timer) timer = setInterval(tick, 520);
      if (!shouldRun && timer) {
        clearInterval(timer);
        timer = 0;
      }
    }

    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      sync();
    });
    zones.forEach((z) => io.observe(z));
    document.addEventListener("visibilitychange", sync);
  }

  /* ---------- 4. แคปซูลเมนูเลื่อนตามหน้าที่เลือก ---------- */
  function initNavIndicator(nav) {
    if (!nav || nav.querySelector(".nav-indicator")) return;
    const indicator = document.createElement("span");
    indicator.className = "nav-indicator is-instant";
    indicator.setAttribute("aria-hidden", "true");
    nav.insertBefore(indicator, nav.firstChild);
    let placed = false;

    function place() {
      const active = nav.querySelector(".nav-btn.is-active");
      if (!active || !active.offsetWidth) {
        // ยังไม่ถูกวาด (เช่น เมนูซ่อนอยู่): คงสีพื้นของปุ่มเดิมไว้
        nav.classList.remove("has-nav-indicator");
        placed = false;
        return;
      }
      if (!placed || isReduced()) indicator.classList.add("is-instant");
      indicator.style.setProperty("--ind-x", `${active.offsetLeft}px`);
      indicator.style.setProperty("--ind-y", `${active.offsetTop}px`);
      indicator.style.setProperty("--ind-w", `${active.offsetWidth}px`);
      indicator.style.setProperty("--ind-h", `${active.offsetHeight}px`);
      nav.classList.add("has-nav-indicator");
      if (!placed || isReduced()) {
        void indicator.offsetWidth;
        indicator.classList.remove("is-instant");
      }
      placed = true;
    }

    if (typeof MutationObserver !== "undefined") {
      // สนใจเฉพาะปุ่มเมนู ไม่นับคลาสที่ฟังก์ชันนี้เปลี่ยนเองบน nav และตัวแคปซูล
      new MutationObserver((records) => {
        if (records.some((r) => r.target.classList && r.target.classList.contains("nav-btn"))) place();
      }).observe(nav, { attributes: true, attributeFilter: ["class"], subtree: true });
    }
    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(() => {
        placed = false;
        place();
      }).observe(nav);
    } else {
      window.addEventListener("resize", () => {
        placed = false;
        place();
      });
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        placed = false;
        place();
      });
    }
    place();
  }

  /* ---------- 5. จังหวะเปิดหน้าเข้าสู่ระบบ ---------- */
  function initAuthIntro() {
    const auth = document.getElementById("auth-screen");
    if (!auth || isReduced()) return;
    auth.classList.add("fx-auth-intro");
    setTimeout(() => auth.classList.remove("fx-auth-intro"), 1900);
  }

  // คลาสแอนิเมชันเข้าหน้าถูกถอดออกเมื่อเล่นจบ เนื้อหาที่วาดใหม่ภายหลังจึงไม่เล่นซ้ำ
  function initViewEnterCleanup() {
    document.addEventListener("animationend", (e) => {
      const el = e.target;
      if (!el.classList || !el.classList.contains("is-view-entering")) return;
      setTimeout(() => el.classList.remove("is-view-entering"), 900);
    });
  }

  function init() {
    initBackdrop();
    initScanBeam();
    initTilePulse();
    initNavIndicator(document.querySelector(".nav-links"));
    initNavIndicator(document.querySelector(".mobile-nav-bar"));
    initAuthIntro();
    initViewEnterCleanup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
