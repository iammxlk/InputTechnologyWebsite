/**
 * ============================================================================
 * js/minigames.js — Interactive Time-Attack Arcade Engine & Rule Pop-up Modal
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * พัฒนาด้วยสถาปัตยกรรม Game Loop (requestAnimationFrame + Delta Time),
 * Combo Streak, Procedural Web Audio SFX และอุปกรณ์จำลองอินเทอร์แอคทีฟประจำหมวด:
 *   - G01: Input Device Speed Match (IPO Pipeline & Analog/Digital Signal Dock)
 *   - G02: Barcode & QR Rapid Decoder (Live 1D Laser vs 2D Matrix Viewfinder)
 *   - G03: Cyber & Biometric Shield (Interactive FAR/FRR Slider & RF Wave Tester)
 *   - G04: Data Encoding & RLE Sprint (Visual RLE Block Strip & UTF-8 Byte Meter)
 * ============================================================================
 */

(function () {
  const CFG = window.APP_CONFIG;

  /* ==========================================================================
     1. PROCEDURAL WEB AUDIO SUBSYSTEM (SAFE ZERO-ASSET ARCADE FEEDBACK)
     ========================================================================== */

  let audioCtx = null;
  let sfxEnabled = true;

  function ensureAudioContext() {
    if (!sfxEnabled) return null;
    try {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      if (!audioCtx) {
        audioCtx = new AudioCtor();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
      return audioCtx;
    } catch (e) {
      return null;
    }
  }

  function playTone(freq, durationSec, type = "sine", gainPeak = 0.055, delaySec = 0) {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    } catch (e) {
      // Ignore audio errors on headless or restricted environments
    }
  }

  const GameAudio = {
    playStart() {
      playTone(523.25, 0.09, "triangle", 0.05, 0);
      playTone(659.25, 0.12, "triangle", 0.05, 0.07);
    },
    playHit(streak = 1) {
      const boost = Math.min(6, Math.max(0, streak - 1)) * 38;
      playTone(587.33 + boost, 0.08, "triangle", 0.055, 0);
      playTone(880 + boost, 0.11, "sine", 0.045, 0.055);
    },
    playMiss() {
      playTone(210, 0.14, "sawtooth", 0.04, 0);
      playTone(165, 0.16, "sawtooth", 0.035, 0.06);
    },
    playFinish(isStrongScore) {
      if (isStrongScore) {
        playTone(523.25, 0.1, "triangle", 0.05, 0);
        playTone(659.25, 0.1, "triangle", 0.05, 0.08);
        playTone(783.99, 0.16, "triangle", 0.055, 0.16);
      } else {
        playTone(440, 0.12, "sine", 0.045, 0);
        playTone(523.25, 0.15, "sine", 0.045, 0.09);
      }
    }
  };

  /* ==========================================================================
     2. PROCEDURAL SVG SPECIMENS & INTERACTIVE WORKBENCH RENDERERS
     ========================================================================== */

  function renderSpecimenSvg(specimenKey, scanMode = "2d") {
    const is2D = scanMode === "2d";
    const beamOverlay = is2D
      ? `
        <g class="mg-scan-reticle" stroke="#15499F" stroke-width="2" fill="none">
          <path d="M6 16V6h10"/><path d="M150 16V6h-10"/>
          <path d="M6 48v10h10"/><path d="M150 48v10h-10"/>
        </g>
        <rect class="mg-scan-matrix-sweep" x="8" y="8" width="140" height="4" fill="#1B5BC4" fill-opacity="0.28"/>
      `
      : `<line class="mg-scan-laser-line" x1="8" y1="30" x2="148" y2="30" stroke="#DC2626" stroke-width="2"/>`;

    if (specimenKey === "barcode_1d") {
      return `
        <svg width="156" height="64" viewBox="0 0 156 64" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="152" height="60" rx="6" fill="#FFFFFF" stroke="#DCE5F2"/>
          <g fill="#0F172A">
            <rect x="16" y="10" width="3" height="36"/><rect x="22" y="10" width="1.5" height="36"/>
            <rect x="27" y="10" width="4" height="36"/><rect x="35" y="10" width="2" height="36"/>
            <rect x="40" y="10" width="1.5" height="36"/><rect x="45" y="10" width="5" height="36"/>
            <rect x="54" y="10" width="2" height="36"/><rect x="59" y="10" width="3.5" height="36"/>
            <rect x="66" y="10" width="1.5" height="36"/><rect x="71" y="10" width="4" height="36"/>
            <rect x="79" y="10" width="2" height="36"/><rect x="85" y="10" width="5" height="36"/>
            <rect x="94" y="10" width="1.5" height="36"/><rect x="99" y="10" width="3" height="36"/>
            <rect x="106" y="10" width="4" height="36"/><rect x="114" y="10" width="2" height="36"/>
            <rect x="119" y="10" width="1.5" height="36"/><rect x="124" y="10" width="4.5" height="36"/>
            <rect x="132" y="10" width="2" height="36"/><rect x="137" y="10" width="3" height="36"/>
          </g>
          ${beamOverlay}
          <text x="78" y="56" text-anchor="middle" font-family="Stack Sans Notch, sans-serif" font-size="9" font-weight="600" fill="#475569">8 850123 456789</text>
        </svg>
      `;
    }

    const squareBeam = is2D
      ? `<rect class="mg-scan-matrix-sweep" x="8" y="10" width="72" height="4" fill="#1B5BC4" fill-opacity="0.3"/>`
      : `<line class="mg-scan-laser-line" x1="6" y1="44" x2="82" y2="44" stroke="#DC2626" stroke-width="2"/>`;

    if (specimenKey === "qr_finder") {
      return `
        <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="84" height="84" rx="8" fill="#FFFFFF" stroke="#DCE5F2"/>
          <rect x="10" y="10" width="22" height="22" stroke="#15499F" stroke-width="4" fill="#FFFFFF"/>
          <rect x="16" y="16" width="10" height="10" fill="#15499F"/>
          <rect x="56" y="10" width="22" height="22" stroke="#15499F" stroke-width="4" fill="#FFFFFF"/>
          <rect x="62" y="16" width="10" height="10" fill="#15499F"/>
          <rect x="10" y="56" width="22" height="22" stroke="#15499F" stroke-width="4" fill="#FFFFFF"/>
          <rect x="16" y="62" width="10" height="10" fill="#15499F"/>
          <g fill="#94A3B8">
            <rect x="38" y="14" width="6" height="6"/><rect x="38" y="24" width="6" height="6"/>
            <rect x="38" y="38" width="10" height="10"/><rect x="54" y="40" width="6" height="6"/>
            <rect x="66" y="42" width="8" height="8"/><rect x="40" y="58" width="8" height="8"/>
            <rect x="56" y="58" width="16" height="16" stroke="#64748B" stroke-width="2" fill="none"/>
            <rect x="62" y="64" width="4" height="4" fill="#64748B"/>
          </g>
          ${squareBeam}
        </svg>
      `;
    }

    if (specimenKey === "qr_logo") {
      return `
        <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
          <rect x="2" y="2" width="84" height="84" rx="8" fill="#FFFFFF" stroke="#DCE5F2"/>
          <rect x="10" y="10" width="18" height="18" stroke="#0F172A" stroke-width="3.5" fill="#FFFFFF"/>
          <rect x="15" y="15" width="8" height="8" fill="#0F172A"/>
          <rect x="60" y="10" width="18" height="18" stroke="#0F172A" stroke-width="3.5" fill="#FFFFFF"/>
          <rect x="65" y="15" width="8" height="8" fill="#0F172A"/>
          <rect x="10" y="60" width="18" height="18" stroke="#0F172A" stroke-width="3.5" fill="#FFFFFF"/>
          <rect x="15" y="65" width="8" height="8" fill="#0F172A"/>
          <rect x="31" y="31" width="26" height="26" rx="5" fill="#15499F"/>
          <text x="44" y="47" text-anchor="middle" font-family="Stack Sans Notch, sans-serif" font-size="8.5" font-weight="700" fill="#FFFFFF">LOGO</text>
          ${squareBeam}
        </svg>
      `;
    }

    if (specimenKey === "micro_qr") {
      return `
        <svg width="88" height="88" viewBox="0 0 88 88" fill="none" aria-hidden="true">
          <rect x="8" y="8" width="72" height="72" rx="8" fill="#FFFFFF" stroke="#DCE5F2"/>
          <rect x="16" y="16" width="24" height="24" stroke="#15499F" stroke-width="4" fill="#FFFFFF"/>
          <rect x="22" y="22" width="12" height="12" fill="#15499F"/>
          <g fill="#334155">
            <rect x="46" y="16" width="6" height="6"/><rect x="58" y="16" width="6" height="6"/>
            <rect x="16" y="46" width="6" height="6"/><rect x="16" y="58" width="6" height="6"/>
            <rect x="46" y="32" width="8" height="8"/><rect x="60" y="44" width="10" height="10"/>
            <rect x="34" y="56" width="12" height="8"/><rect x="54" y="60" width="8" height="8"/>
          </g>
          ${squareBeam}
        </svg>
      `;
    }

    if (specimenKey === "rmqr") {
      return `
        <svg width="164" height="58" viewBox="0 0 164 58" fill="none" aria-hidden="true">
          <rect x="2" y="6" width="160" height="46" rx="6" fill="#FFFFFF" stroke="#DCE5F2"/>
          <rect x="10" y="14" width="22" height="22" stroke="#15499F" stroke-width="3.5" fill="#FFFFFF"/>
          <rect x="16" y="20" width="10" height="10" fill="#15499F"/>
          <g fill="#334155">
            <rect x="40" y="14" width="8" height="8"/><rect x="54" y="14" width="6" height="6"/>
            <rect x="66" y="14" width="10" height="6"/><rect x="84" y="14" width="6" height="8"/>
            <rect x="98" y="14" width="12" height="6"/><rect x="118" y="14" width="8" height="8"/>
            <rect x="42" y="28" width="12" height="8"/><rect x="62" y="26" width="8" height="10"/>
            <rect x="78" y="28" width="14" height="8"/><rect x="100" y="26" width="10" height="10"/>
            <rect x="118" y="28" width="12" height="8"/><rect x="140" y="30" width="12" height="12" stroke="#15499F" stroke-width="2.5" fill="none"/>
          </g>
          ${beamOverlay}
        </svg>
      `;
    }

    return "";
  }

  function renderInteractiveWorkbench(gameId, round, labState) {
    const esc = window.AppUtils.escapeHtml;

    // G01: Interactive IPO Pipeline & Signal Probe
    if (gameId === "G01") {
      const sigMode = labState.signalMode || "digital";
      const waveSvg =
        sigMode === "analog"
          ? `<svg width="136" height="36" viewBox="0 0 136 36" fill="none" aria-hidden="true">
               <path d="M4 18 Q 18 2, 34 18 T 68 18 T 102 18 T 132 18" stroke="#15499F" stroke-width="2.2" fill="none"/>
             </svg>`
          : `<svg width="136" height="36" viewBox="0 0 136 36" fill="none" aria-hidden="true">
               <path d="M4 28 H20 V8 H38 V28 H54 V8 H76 V28 H94 V8 H114 V28 H132" stroke="#166534" stroke-width="2.2" fill="none"/>
             </svg>`;

      return `
        <div class="mg-workbench-bar">
          <div class="mg-ipo-pipeline" aria-hidden="true">
            <span class="mg-ipo-node is-active">1. INPUT</span>
            <span class="mg-ipo-arrow">-&gt;</span>
            <span class="mg-ipo-node">2. PROCESS</span>
            <span class="mg-ipo-arrow">-&gt;</span>
            <span class="mg-ipo-node">3. OUTPUT</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <div class="mg-wave-preview">${waveSvg}</div>
            <button type="button" class="btn-secondary mg-lab-toggle-btn" data-mg-lab-action="toggle-signal">
              ทดลองสลับสัญญาณ: ${sigMode === "analog" ? "Analog Wave" : "Digital 0/1"}
            </button>
          </div>
        </div>
      `;
    }

    // G02: Interactive 1D Laser vs 2D Matrix Optical Scanner Switcher
    if (gameId === "G02") {
      const scanMode = labState.scanMode || "2d";
      const statusText =
        scanMode === "2d"
          ? "โหมด 2D Area Imager: อ่านได้ทั้งบาร์โค้ด 1D, QR 2D และหน้าจอมือถือ"
          : "โหมด 1D Red Laser: ยิงเส้นเดียว อ่านได้เฉพาะบาร์โค้ดแท่ง 1 มิติบนป้ายกระดาษ";
      return `
        <div class="mg-workbench-bar">
          <span class="font-thai" style="font-size: 0.8rem; color: var(--text-secondary);">
            <strong>สถานะหัวอ่านจำลอง:</strong> ${esc(statusText)}
          </span>
          <button type="button" class="btn-secondary mg-lab-toggle-btn" data-mg-lab-action="toggle-scanner">
            สลับหัวอ่านทดลองสแกน (${scanMode === "2d" ? "2D Imager" : "1D Laser"})
          </button>
        </div>
      `;
    }

    // G03: Interactive Biometric Threshold (FAR / FRR) & RF Material Shield Simulator
    if (gameId === "G03") {
      const isRfidRound = round.badge.includes("RFID") || round.badge.includes("NFC");
      if (isRfidRound) {
        const mat = labState.rfMaterial || "paper";
        const signalPct = mat === "metal" ? 8 : mat === "plastic" ? 92 : 96;
        const signalColor = mat === "metal" ? "var(--status-fail-ink)" : "var(--status-pass-ink)";
        return `
          <div class="mg-workbench-bar">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 0.8rem; font-weight: 500; color: var(--text-secondary);">ทดลองกั้นคลื่น RFID:</span>
              <button type="button" class="filter-pill-btn ${mat === "paper" ? "is-active" : ""}" data-mg-rf-mat="paper">กล่องกระดาษ</button>
              <button type="button" class="filter-pill-btn ${mat === "plastic" ? "is-active" : ""}" data-mg-rf-mat="plastic">ซองพลาสติก</button>
              <button type="button" class="filter-pill-btn ${mat === "metal" ? "is-active" : ""}" data-mg-rf-mat="metal">แผ่นโลหะ / น้ำ</button>
            </div>
            <span class="font-notch tabular-nums" style="font-size: 0.82rem; font-weight: 700; color: ${signalColor};">
              RF SIGNAL: ${signalPct}% ${mat === "metal" ? "(สัญญาณสะท้อน/ถูกดูดกลืน)" : "(อ่านผ่านปกติ)"}
            </span>
          </div>
        `;
      }

      const th = Number(labState.threshold != null ? labState.threshold : 75);
      const farVal = Math.max(0.01, ((100 - th) * 0.18)).toFixed(2);
      const frrVal = Math.max(0.2, ((th - 20) * 0.14)).toFixed(2);
      return `
        <div class="mg-workbench-bar">
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; flex: 1; min-width: 220px;">
            <label for="mg-bio-threshold-slider" class="font-notch" style="font-size: 0.78rem; font-weight: 600; color: var(--blue-700);">
              THRESHOLD LAB: <span id="mg-th-val">${th}%</span>
            </label>
            <input
              id="mg-bio-threshold-slider"
              type="range"
              min="25"
              max="95"
              step="5"
              value="${th}"
              class="mg-threshold-slider"
              aria-label="ทดลองปรับค่าเกณฑ์ตัดสินชีวมิติ Threshold"
            />
          </div>
          <div class="font-notch tabular-nums" style="display: flex; align-items: center; gap: 12px; font-size: 0.78rem;">
            <span id="mg-far-readout" style="color: var(--status-fail-ink); font-weight: 600;">FAR (คนอื่นผ่าน): ${farVal}%</span>
            <span id="mg-frr-readout" style="color: var(--blue-600); font-weight: 600;">FRR (ปฏิเสธเจ้าของ): ${frrVal}%</span>
          </div>
        </div>
      `;
    }

    // G04: Visual RLE Run Strip or Byte Meter
    if (gameId === "G04") {
      if (round.rleCells && round.rleCells.length) {
        const cellsHtml = round.rleCells
          .map(
            (ch, idx) =>
              `<span class="mg-rle-cell ${ch === "S" || ch === "B" ? "is-dark" : ch === "G" ? "is-accent" : "is-light"}" title="ตำแหน่งที่ ${idx + 1}: ${esc(ch)}">${esc(ch)}</span>`
          )
          .join("");
        return `
          <div class="mg-workbench-bar">
            <span style="font-size: 0.78rem; font-weight: 500; color: var(--text-secondary);">
              แถบข้อมูลเรียงลำดับ (${round.rleCells.length} ช่อง • นับจำนวนตัวซ้ำติดกัน):
            </span>
            <div class="mg-rle-strip font-notch">${cellsHtml}</div>
          </div>
        `;
      }

      const sampleMode = labState.encodingSample || "utf8";
      return `
        <div class="mg-workbench-bar">
          <span class="font-notch tabular-nums" style="font-size: 0.8rem; color: var(--text-secondary);">
            ${
              sampleMode === "utf8"
                ? "UTF-8 SPEC: อังกฤษ 1 Byte/ตัว  •  ไทย 3 Bytes/ตัว  •  Pipeline: Compress -&gt; Encrypt"
                : "ASCII SPEC: อังกฤษ 7-8 Bits (1 Byte/ตัว)  •  Space = Hex %20 (Dec 32)"
            }
          </span>
          <button type="button" class="btn-secondary mg-lab-toggle-btn" data-mg-lab-action="toggle-encoding">
            สลับตารางเทียบ (${sampleMode === "utf8" ? "UTF-8 / Pipeline" : "ASCII / URL Hex"})
          </button>
        </div>
      `;
    }

    return "";
  }

  /* ==========================================================================
     3. OFFICIAL 4 MINI-GAMES CATALOG (G01 – G04) ALIGNED WITH EDU-PLAN
     ========================================================================== */

  const GAMES_CATALOG = {
    G01: {
      id: "G01",
      moduleId: 1,
      afterUnitNo: 4,
      nextUnitNo: 5,
      title: "Input Device Speed Match",
      thaiTitle: "จับคู่ความไวข้อมูล วงจร IPO และอุปกรณ์รับข้อมูล",
      checkpointLabel: "คั่นหลังหน่วยที่ 4 (จบหมวดที่ 1)",
      timeLimitSec: 60,
      roundsPerPlay: 10,
      pointsPerCorrect: 2,
      rules: [
        "สังเกตแผงจำลองสัญญาณ IPO และอ่านสถานการณ์หน้างาน แล้วเลือกคำตอบที่ตรงที่สุดภายในเวลา 60 วินาที",
        "สุ่มโจทย์ความไว 10 ด่าน ตอบถูกรับด่านละ +2 คะแนน (คะแนนเต็ม 20 คะแนน) สะสมสถิติ Combo ต่อเนื่องได้",
        "คลิกปุ่มตัวเลือกโดยตรง หรือกดปุ่มตัวเลข 1 – 4 บนแป้นพิมพ์เพื่อตอบอย่างรวดเร็ว",
        "เมื่อครบ 10 ด่านหรือหมดเวลา ระบบจะบันทึกคะแนนและเวลาที่ใช้จริง (วินาที) ลงฐานข้อมูลทันทีเพื่อจัดอันดับ Top 10"
      ],
      challenges: [
        {
          badge: "UNIT 1 • DATA VS INFORMATION",
          consoleLabel: "RAW STREAM: คะแนนดิบรายคน [7, 8, 5, 9, 6] ยังไม่หาค่าเฉลี่ย",
          prompt: "ตัวเลขคะแนนรายคนที่เพิ่งเก็บรวบรวมมาและยังไม่ผ่านการประมวลผล จัดเป็นข้อใด",
          options: ["ข้อมูลดิบ (Raw Data)", "สารสนเทศ (Information)", "หน่วยแสดงผล (Output)", "ซอฟต์แวร์ระบบ"],
          answer: 0,
          explanation: "ข้อเท็จจริงหรือตัวเลขที่เพิ่งเก็บรวบรวมโดยยังไม่ผ่านการคำนวณสรุปผล เรียกว่าข้อมูลดิบ (Data)"
        },
        {
          badge: "UNIT 1 • DATA VS INFORMATION",
          consoleLabel: "REPORT: รายงานสรุปค่าเฉลี่ยคะแนนสอบทั้งห้อง = 8.45 คะแนน",
          prompt: "ผลลัพธ์ที่ผ่านการคำนวณหาค่าเฉลี่ยเพื่อใช้ตัดสินใจวางแผนการสอน จัดเป็นข้อใด",
          options: ["สารสนเทศ (Information)", "ข้อมูลดิบ (Raw Data)", "สัญญาณแอนะล็อก", "ฮาร์ดแวร์นำเข้า"],
          answer: 0,
          explanation: "ข้อมูลที่ผ่านการประมวลผลจนมีความหมายและนำไปใช้ตัดสินใจได้ เรียกว่าสารสนเทศ (Information)"
        },
        {
          badge: "UNIT 1 • GIGO PRINCIPLE",
          consoleLabel: "ALERT: พนักงานกรอกราคาสินค้าผิดจาก 150 เป็น 1,500 บาท",
          prompt: "หลักการที่ระบุว่าหากนำเข้าข้อมูลผิดพลาด ผลลัพธ์ย่อมผิดพลาดตามไปด้วย ตรงกับข้อใด",
          options: ["GIGO (Garbage In, Garbage Out)", "FIFO (First In, First Out)", "WYSIWYG", "Plug and Play"],
          answer: 0,
          explanation: "Garbage In, Garbage Out หมายถึงข้อมูลขยะหรือข้อมูลผิดพลาดที่ป้อนเข้าไป ย่อมให้ผลลัพธ์ที่ผิดพลาด"
        },
        {
          badge: "UNIT 2 • IPO CYCLE",
          consoleLabel: "STAGE CHECK: สแกนบาร์โค้ดรหัสสินค้าเข้าสู่เครื่องขายหน้าร้าน POS",
          prompt: "จังหวะที่หัวอ่านรับรหัสสินค้าเข้าสู่เครื่องคอมพิวเตอร์ อยู่ในขั้นตอนใดของวงจร IPO",
          options: ["Input (การนำเข้าข้อมูล)", "Process (การประมวลผล)", "Output (การแสดงผล)", "Backup (การสำรองข้อมูล)"],
          answer: 0,
          explanation: "การรับรหัสจากป้ายสินค้าเข้าสู่ระบบเป็นขั้นตอน Input ก่อนส่งไปค้นราคาในขั้นตอน Process"
        },
        {
          badge: "UNIT 2 • MANUAL VS AUTOMATIC",
          consoleLabel: "SCENARIO: แคชเชียร์คิดเงินลูกค้า 200 คนช่วงพักเที่ยงอย่างรวดเร็ว",
          prompt: "การนำเข้าข้อมูลรูปแบบใดช่วยลดความผิดพลาดจากการพิมพ์และรองรับคิวยาวได้ดีที่สุด",
          options: ["Automatic Input (เช่น สแกนบาร์โค้ด)", "Manual Input พิมพ์รหัสทีละหลัก", "เขียนลงสมุดแล้วคีย์ตอนเย็น", "บอกปากเปล่าให้จำราคา"],
          answer: 0,
          explanation: "Automatic Input อ่านค่าจากต้นทางเข้าเครื่องโดยตรง รวดเร็วและลด Human Error จากการพิมพ์ผิด"
        },
        {
          badge: "UNIT 3 • KEYBOARD TECH",
          consoleLabel: "HARDWARE: แป้นพิมพ์สำนักงาน เสียงเงียบ น้ำหนักเบา ใช้แผ่นยางโดม",
          prompt: "แป้นพิมพ์ทั่วไปในห้องเรียนและสำนักงานที่ใช้แผ่นยางกดทับแผงวงจร คือแป้นพิมพ์ชนิดใด",
          options: ["Membrane Keyboard", "Mechanical Switch แยกทุกปุ่ม", "Laser Projection Keyboard", "Braille Terminal"],
          answer: 0,
          explanation: "Membrane Keyboard ใช้แผ่นยางโดมและแผงวงจรแผ่นฟิล์ม ราคาประหยัดและเสียงกดเงียบ"
        },
        {
          badge: "UNIT 3 • POINTING DEVICE",
          consoleLabel: "SPEC CHECK: ค่าความไวการเคลื่อนตัวชี้ของเมาส์ Optical (800 / 1600 / 3200)",
          prompt: "หน่วยที่ใช้บอกความละเอียดในการตรวจจับการเคลื่อนที่ของเมาส์คือหน่วยใด",
          options: ["DPI / CPI", "Hz (เฮิรตซ์)", "dB (เดซิเบล)", "Mbps"],
          answer: 0,
          explanation: "DPI (Dots Per Inch) หรือ CPI บอกจำนวนจุดที่ตัวชี้เลื่อนไปเมื่อขยับเมาส์เป็นระยะทาง 1 นิ้ว"
        },
        {
          badge: "UNIT 3 • SCANNER & OCR",
          consoleLabel: "WORKFLOW: สแกนหนังสือเก่าเป็นภาพ แล้วแปลงเป็นข้อความแก้ไขใน Word ได้",
          prompt: "ซอฟต์แวร์ที่ใช้แปลงภาพถ่ายตัวอักษรจากเครื่องสแกนให้เป็นข้อความดิจิทัลแก้ไขได้คือข้อใด",
          options: ["เทคโนโลยี OCR", "เทคโนโลยี OMR", "เทคโนโลยี RFID", "เทคโนโลยี MIDI"],
          answer: 0,
          explanation: "OCR (Optical Character Recognition) วิเคราะห์รูปทรงตัวอักษรในไฟล์ภาพให้กลายเป็นข้อความตัวอักษร"
        },
        {
          badge: "UNIT 3 • EXAM SHEET",
          consoleLabel: "EXAM GRADING: ตรวจกระดาษคำตอบปรนัยที่นักเรียนใช้ดินสอ 2B ระบายในวงกลม",
          prompt: "การตรวจจับรอยดินสอในตำแหน่งช่องคำตอบที่กำหนดไว้ ตรงกับเทคโนโลยีใด",
          options: ["OMR (Optical Mark Recognition)", "OCR (Optical Character Recognition)", "MICR น้ำหมึกแม่เหล็ก", "NFC แตะระยะใกล้"],
          answer: 0,
          explanation: "OMR ตรวจจับความเข้มของรอยเครื่องหมายหรือดินสอในพิกัดช่องที่กำหนดบนกระดาษคำตอบ"
        },
        {
          badge: "UNIT 4 • DIGITAL CAMERA",
          consoleLabel: "OPTICS -> ELECTRONIC: แสงสะท้อนจากวัตถุผ่านเลนส์ตกกระทบแผ่นรับภาพ",
          prompt: "ชิ้นส่วนสำคัญในกล้องดิจิทัลที่ทำหน้าที่แปลงแสงให้เป็นสัญญาณไฟฟ้าคือข้อใด",
          options: ["เซนเซอร์รับภาพ CMOS / CCD", "แผ่นไดอะแฟรมรับแรงอัดอากาศ", "ขดลวดเหนี่ยวนำคลื่นวิทยุ", "หัวอ่านเลเซอร์สีแดง"],
          answer: 0,
          explanation: "เซนเซอร์รับภาพ CMOS หรือ CCD ประกอบด้วยพิกเซลรับแสงที่แปลงความเข้มแสงเป็นค่าดิจิทัล"
        },
        {
          badge: "UNIT 4 • MICROPHONE TYPE",
          consoleLabel: "AUDIO INPUT: งานพากย์เสียงในห้องเงียบ ต้องการรายละเอียดเสียงคมชัดสูงและใช้ไฟเลี้ยง",
          prompt: "งานบันทึกเสียงพูดในสตูดิโอที่ต้องการความไวรับเสียงสูง เหมาะกับไมโครโฟนชนิดใด",
          options: ["ไมโครโฟนแบบ Condenser", "ไมโครโฟนไร้สายย่าน UHF กลางแจ้ง", "ลำโพงมอนิเตอร์กำลังขับสูง", "เครื่องอ่านแถบแม่เหล็ก"],
          answer: 0,
          explanation: "ไมโครโฟนแบบ Condenser มีความไวต่อรายละเอียดเสียงสูง เหมาะกับห้องอัดที่ควบคุมเสียงรบกวนแล้ว"
        },
        {
          badge: "UNIT 4 • SOUND DIGITIZATION",
          consoleLabel: "ADC CONVERSION: สัญญาณคลื่นเสียงแอนะล็อก -> สุ่มวัดค่าระดับเสียง 44,100 ครั้ง/วินาที",
          prompt: "จำนวนครั้งต่อวินาทีในการสุ่มเก็บตัวอย่างคลื่นเสียงแอนะล็อกเป็นดิจิทัล เรียกว่าค่าใด",
          options: ["Sampling Rate (หน่วยเป็น Hz)", "Resolution (หน่วยเป็น DPI)", "Frame Rate (หน่วยเป็น FPS)", "Compression Ratio"],
          answer: 0,
          explanation: "Sampling Rate คืออัตราการสุ่มวัดค่าระดับสัญญาณเสียงต่อวินาที มีหน่วยเป็นเฮิรตซ์ (Hz) เช่น 44.1 kHz"
        }
      ]
    },

    G02: {
      id: "G02",
      moduleId: 2,
      afterUnitNo: 8,
      nextUnitNo: 9,
      title: "Barcode & QR Rapid Decoder",
      thaiTitle: "ถอดรหัสด่วนบาร์โค้ด 1 มิติ รหัส QR Code และอุปกรณ์สแกน",
      checkpointLabel: "คั่นหลังหน่วยที่ 8 (จบหมวดที่ 2)",
      timeLimitSec: 60,
      roundsPerPlay: 10,
      pointsPerCorrect: 2,
      rules: [
        "ทดลองสลับโหมดหัวอ่านจำลองและสังเกตแผนภาพบาร์โค้ด / QR Code แล้วเลือกคำตอบที่ถูกต้องใน 60 วินาที",
        "สุ่มโจทย์ 10 ด่าน ตอบถูกรับด่านละ +2 คะแนน (เต็ม 20 คะแนน) ตอบผิดได้ 0 คะแนนและไปด่านถัดไปทันที",
        "ใช้เมาส์คลิก แตะหน้าจอ หรือกดปุ่มตัวเลข 1 – 4 บนแป้นพิมพ์เพื่อทำความเร็วสูงสุด",
        "จบเกมแล้วระบบบันทึกคะแนนและเวลา (วินาที) เข้าสู่ฐานข้อมูลทันทีเพื่อคำนวณอันดับ Leaderboard"
      ],
      challenges: [
        {
          badge: "UNIT 5 • SCANNER ENGINE",
          specimenSvg: "barcode_1d",
          consoleLabel: "TARGET: สแกนทั้งบาร์โค้ด 1 มิติ และ QR Code บนหน้าจอมือถือลูกค้า",
          prompt: "ร้านค้ายุคใหม่ที่ต้องสแกนคูปองและจ่ายเงินจากหน้าจอมือถือได้ ต้องเลือกหัวอ่านชนิดใด",
          options: ["เครื่องอ่านแบบ Image-based (2D Imager)", "เครื่องอ่านเลเซอร์เส้นเดียวรุ่นเก่า", "เครื่องอ่านน้ำหมึกแม่เหล็ก MICR", "เครื่องตรวจรอยดินสอ OMR"],
          answer: 0,
          explanation: "หัวอ่าน Image-based ใช้เซนเซอร์รับภาพถ่ายรหัส จึงอ่านได้ทั้ง 1D, 2D และรหัสที่แสดงบนหน้าจอมือถือ"
        },
        {
          badge: "UNIT 5 • HID KEYBOARD MODE",
          specimenSvg: "barcode_1d",
          consoleLabel: "EXCEL INPUT: ยิงบาร์โค้ดปุ๊บ ตัวเลขพิมพ์ลงเซลล์แล้วเลื่อนขึ้นบรรทัดใหม่อัตโนมัติ",
          prompt: "เครื่องสแกนส่งรหัสปุ่มใดต่อท้ายข้อมูล (Suffix) เพื่อให้เคอร์เซอร์เลื่อนลงแถวถัดไปเอง",
          options: ["รหัสปุ่ม Enter (Carriage Return)", "รหัสปุ่ม Escape (ESC)", "รหัสปุ่ม Backspace", "รหัสปุ่ม Caps Lock"],
          answer: 0,
          explanation: "การตั้งค่า Suffix เป็น Enter ช่วยให้หลังยิงบาร์โค้ดแต่ละชิ้น เคอร์เซอร์ในตารางคำนวณจะขึ้นแถวใหม่ทันที"
        },
        {
          badge: "UNIT 6 • WIRELESS INVENTORY",
          consoleLabel: "WAREHOUSE: เดินนับสต็อกท้ายโกดังที่อับสัญญาณ แล้วค่อยกลับมาเสียบแท่นส่งข้อมูลทีเดียว",
          prompt: "โหมดพักรหัสบาร์โค้ดไว้ในหน่วยความจำในตัวเครื่องอ่านไร้สาย เรียกว่าโหมดใด",
          options: ["Batch Mode (โหมดพักข้อมูลในเครื่อง)", "Streaming Video Mode", "Sleep Standby Mode", "Airplane Lock Mode"],
          answer: 0,
          explanation: "Batch Mode บันทึกรหัสที่ยิงเก็บไว้ในหน่วยความจำของสแกนเนอร์ก่อน แล้วจึงอัปโหลดรวดเดียวเมื่อกลับมาที่ฐานรับ"
        },
        {
          badge: "UNIT 6 • FIXED MOUNT SCANNER",
          consoleLabel: "CONVEYOR BELT: กล่องพัสดุวิ่งผ่านสายพานคัดแยกด้วยความเร็วต่อเนื่องโดยไม่มีคนถือยิง",
          prompt: "สายพานคัดแยกพัสดุอัตโนมัติในศูนย์กระจายสินค้า ควรติดตั้งเครื่องอ่านบาร์โค้ดรูปแบบใด",
          options: ["เครื่องอ่านแบบฝังตัวหรือติดตั้งประจำจุด (Fixed-mount)", "เครื่องอ่านแบบปากกาลากผ่านทีละเส้น", "เว็บแคมโน้ตบุ๊กปรับโฟกัสมือหมุน", "สแกนเนอร์แท่นกระจกวางกระดาษ Flatbed"],
          answer: 0,
          explanation: "Fixed-mount Scanner ติดตั้งยึดกับโครงสายพานและตรวจจับอ่านรหัสอัตโนมัติทันทีที่กล่องเคลื่อนผ่าน"
        },
        {
          badge: "UNIT 7 • QR ANATOMY",
          specimenSvg: "qr_finder",
          consoleLabel: "STRUCTURE: กรอบสี่เหลี่ยมจัตุรัสขนาดใหญ่ที่ปรากฏอยู่ทั้ง 3 มุมของ QR Code",
          prompt: "กรอบสี่เหลี่ยม 3 มุมที่ช่วยให้กล้องรู้ขอบเขตและทิศทางการเอียงแม้สแกนกลับหัว เรียกว่าส่วนใด",
          options: ["Finder Pattern (รูปแบบค้นหาตำแหน่ง)", "Quiet Zone (ขอบว่างรอบนอก)", "Timing Pattern (เส้นจังหวะ)", "Data Payload (เนื้อหาข้อมูล)"],
          answer: 0,
          explanation: "Finder Pattern อยู่ 3 มุม (ซ้ายบน ขวาบน ซ้ายล่าง) ช่วยให้กล้องตรวจจับตำแหน่งและมุมหมุนได้ 360 องศา"
        },
        {
          badge: "UNIT 7 • QUIET ZONE",
          specimenSvg: "qr_finder",
          consoleLabel: "PRINT ISSUE: พิมพ์กรอบข้อความชิดติดโมดูลสีดำของ QR Code จนกล้องสแกนไม่ติด",
          prompt: "พื้นที่ขอบว่างสีอ่อนรอบนอกทั้ง 4 ด้านที่ต้องเว้นไว้เพื่อให้กล้องแยก QR ออกจากพื้นหลังคือส่วนใด",
          options: ["Quiet Zone", "Alignment Pattern", "Format Information", "Version Block"],
          answer: 0,
          explanation: "Quiet Zone คือขอบว่างรอบนอก (อย่างน้อย 4 โมดูล) หากพิมพ์ลวดลายทับชิดเกินไปกล้องจะแยกขอบเขต QR ไม่ได้"
        },
        {
          badge: "UNIT 7 • ERROR CORRECTION",
          specimenSvg: "qr_logo",
          consoleLabel: "DESIGN: วางโลโก้โรงเรียนทับกึ่งกลางป้าย QR Code ประชาสัมพันธ์งาน",
          prompt: "เพื่อให้สแกนติดได้แม่นยำแม้มีโลโก้บังตรงกลาง ควรตั้งระดับ Error Correction ที่ระดับสูงสุดใด",
          options: ["ระดับ H (กู้คืนได้ประมาณ 30%)", "ระดับ L (กู้คืนได้ประมาณ 7%)", "ระดับ M (กู้คืนได้ประมาณ 15%)", "ปิดระบบ Error Correction"],
          answer: 0,
          explanation: "Error Correction ระดับ H ชดเชยความเสียหายได้สูงสุดประมาณ 30% จึงเหมาะกับป้ายที่มีโลโก้ตรงกลางหรือติดกลางแจ้ง"
        },
        {
          badge: "UNIT 8 • QR CODE FAMILY",
          specimenSvg: "micro_qr",
          consoleLabel: "SMALL PCB: พื้นที่บนแผงวงจรอิเล็กทรอนิกส์เล็กจิ๋ว มี Finder Pattern เพียงมุมเดียว",
          prompt: "รหัสตระกูล QR ที่มีกรอบค้นหาตำแหน่งเพียง 1 มุมสำหรับติดชิ้นส่วนขนาดเล็กมาก คือรหัสชนิดใด",
          options: ["Micro QR Code", "QR Code Model 1", "Code 39", "EAN-13"],
          answer: 0,
          explanation: "Micro QR Code ลด Finder Pattern เหลือเพียง 1 มุมและใช้ขอบว่างแคบลง เพื่อพิมพ์ลงบนชิ้นส่วนอิเล็กทรอนิกส์จิ๋ว"
        },
        {
          badge: "UNIT 8 • RECTANGULAR QR",
          specimenSvg: "rmqr",
          consoleLabel: "NARROW SPACE: พิมพ์รหัส 2 มิติลงบนขอบหลอดทดลองหรือสันป้ายที่แคบแต่ยาว",
          prompt: "รหัส QR ทรงสี่เหลี่ยมผืนผ้าแนวยาวสำหรับพื้นที่แคบของ Denso Wave คือรหัสชนิดใด",
          options: ["rMQR Code (Rectangular Micro QR)", "MaxiCode", "UPC-A", "ITF-14"],
          answer: 0,
          explanation: "rMQR มีรูปทรงสี่เหลี่ยมผืนผ้าแนวยาว ออกแบบมาเพื่อติดขอบฉลากแคบ ๆ โดยยังเก็บข้อมูลได้มากเหมือน QR ปกติ"
        },
        {
          badge: "UNIT 8 • STATIC VS DYNAMIC QR",
          consoleLabel: "CAMPAIGN: พิมพ์โปสเตอร์ติดทั่วโรงเรียนไปแล้ว แต่อยากเปลี่ยนลิงก์ปลายทางในภายหลัง",
          prompt: "รหัส QR ที่เก็บลิงก์สั้นตัวกลาง ทำให้แก้ไข URL ปลายทางทีหลังได้โดยไม่ต้องพิมพ์ป้ายใหม่คือแบบใด",
          options: ["Dynamic QR Code", "Static QR Code", "1D Barcode EAN-8", "Plain Text Offline QR"],
          answer: 0,
          explanation: "Dynamic QR Code ชี้ผ่าน Short URL ตัวกลาง จึงเปลี่ยนลิงก์ปลายทางและเก็บสถิติจำนวนครั้งที่สแกนได้"
        },
        {
          badge: "UNIT 8 • CONTRAST TROUBLESHOOTING",
          consoleLabel: "SCAN FAIL: พิมพ์ตัวรหัสเป็นสีขาวลงบนพื้นกระดาษสีดำทึบ (Inverted Contrast)",
          prompt: "หลักการออกแบบสีป้าย QR Code ที่ช่วยให้กล้องทั่วไปทุกเครื่องอ่านผ่านได้เสถียรที่สุดคือข้อใด",
          options: ["พิมพ์จุดรหัสสีเข้มบนพื้นหลังสีอ่อนที่มีความต่างสีชัดเจน", "พิมพ์จุดรหัสสีเหลืองอ่อนบนพื้นสีขาว", "ใช้พื้นหลังภาพถ่ายลวดลายสลับซับซ้อนโดยไม่มีกรอบขาว", "ย่อขนาดป้ายบนโปสเตอร์ให้เล็กกว่า 5 มิลลิเมตร"],
          answer: 0,
          explanation: "มาตรฐาน QR Code กำหนดให้ตัวโมดูลมีสีเข้ม (เช่น ดำหรือน้ำเงินเข้ม) บนพื้นหลังสีอ่อนเรียบเพื่อให้ค่าความเปรียบต่างชัดเจน"
        },
        {
          badge: "UNIT 8 • PRIVACY QR",
          consoleLabel: "SECURITY: ป้าย QR ที่มีทั้งข้อมูลสาธารณะและข้อมูลลับที่อ่านได้เฉพาะเครื่องที่มีกุญแจ",
          prompt: "รหัส QR พิเศษของ Denso Wave ที่จำกัดสิทธิ์การอ่านข้อมูลลับเฉพาะเครื่องอ่านที่มีกุญแจตรงกันคือข้อใด",
          options: ["SQRC (Secure QR Code)", "Micro QR Code", "EAN-13", "Code 128"],
          answer: 0,
          explanation: "SQRC ดูภายนอกเหมือน QR ปกติแต่เข้ารหัสข้อมูลส่วนลับไว้ ต้องใช้เครื่องสแกนที่มีกุญแจรหัสตรงกันจึงถอดอ่านได้"
        }
      ]
    },

    G03: {
      id: "G03",
      moduleId: 3,
      afterUnitNo: 12,
      nextUnitNo: 13,
      title: "Cyber & Biometric Shield",
      thaiTitle: "เกราะป้องกันข้อมูล เข้ารหัสลับ คลื่น RFID และระบบชีวมิติ",
      checkpointLabel: "คั่นหลังหน่วยที่ 12 (จบหมวดที่ 3)",
      timeLimitSec: 60,
      roundsPerPlay: 10,
      pointsPerCorrect: 2,
      rules: [
        "ทดลองเลื่อนแถบ Threshold FAR/FRR หรือทดสอบวัสดุกั้นคลื่น RFID แล้วเลือกคำตอบที่ถูกต้องใน 60 วินาที",
        "สุ่มโจทย์ 10 ด่าน ตอบถูกรับด่านละ +2 คะแนน (เต็ม 20 คะแนน) ตอบผิดได้ 0 คะแนนและเข้าสู่ด่านต่อไปทันที",
        "คลิกตัวเลือกหรือกดปุ่มคีย์ลัดตัวเลข 1 – 4 บนแป้นพิมพ์เพื่อโต้ตอบอย่างฉับไว",
        "เมื่อจบเกม ระบบบันทึกคะแนนและเวลาที่ใช้จริง (วินาที) ลงฐานข้อมูลทันทีเพื่ออัปเดตอันดับ Top 10"
      ],
      challenges: [
        {
          badge: "UNIT 9 • DEVICE THREAT",
          consoleLabel: "INCIDENT: พบหัวต่อตัวเล็กแปลกปลอมเสียบคั่นอยู่ระหว่างสายคีย์บอร์ดกับช่อง USB หลังเครื่อง",
          prompt: "อุปกรณ์แอบดักบันทึกทุกปุ่มที่ผู้ใช้กดรวมถึงรหัสผ่านที่เสียบคั่นสายแป้นพิมพ์ คือภัยคุกคามใด",
          options: ["Hardware Keylogger", "แผ่นกรองแสงหน้าจอ Privacy Filter", "ระบบสำรองไฟ UPS", "ตัวอ่านกระดาษคำตอบ OMR"],
          answer: 0,
          explanation: "Hardware Keylogger เป็นอุปกรณ์ดักจับสัญญาณการกดแป้นพิมพ์ทางกายภาพที่แอบเสียบคั่นพอร์ตคีย์บอร์ด"
        },
        {
          badge: "UNIT 9 • QR PHISHING",
          consoleLabel: "INCIDENT: มิจฉาชีพนำสติกเกอร์ QR Code ปลอมมาแปะทับป้ายรับชำระเงินของร้านค้า",
          prompt: "การหลอกลวงให้เหยื่อสแกน QR Code ปลอมเพื่อโอนเงินผิดบัญชีหรือเข้าเว็บปลอม เรียกว่าอะไร",
          options: ["Quishing (QR Code Phishing)", "Anti-collision", "Lossless Compression", "Liveness Detection"],
          answer: 0,
          explanation: "Quishing มาจากคำว่า QR Code ผสมกับ Phishing คือการใช้รหัส QR ปลอมล่อลวงผู้สแกน"
        },
        {
          badge: "UNIT 9 • BACKUP STRATEGY",
          consoleLabel: "RESILIENCE: สำรองข้อมูล 3 ชุด เก็บในสื่อ 2 ชนิด และแยกเก็บนอกสถานที่อย่างน้อย 1 ชุด",
          prompt: "แนวปฏิบัติมาตรฐานสากลในการสำรองข้อมูลเพื่อรับมือเหตุไฟล์เสียหายหรือมัลแวร์เรียกค่าไถ่ คือกฎใด",
          options: ["กฎการสำรองข้อมูล 3-2-1", "กฎการแปลงรหัส 7-8-16", "กฎความถี่ 125-13-900", "กฎการเทียบ 1 ต่อ N"],
          answer: 0,
          explanation: "กฎ 3-2-1 คือมีข้อมูลอย่างน้อย 3 ชุด ในสื่อต่างกัน 2 ประเภท และแยกเก็บนอกสถานที่หรือคลาวด์ 1 ชุด"
        },
        {
          badge: "UNIT 10 • PASSWORD STORAGE",
          consoleLabel: "AUTH DB: จัดเก็บรหัสผ่านผู้ใช้ในฐานข้อมูลโดยห้ามแปลงย้อนกลับมาเป็นรหัสผ่านเดิมได้",
          prompt: "วิธีที่ปลอดภัยตามมาตรฐานในการจัดเก็บรหัสผ่านลงฐานข้อมูลคือวิธีใด",
          options: ["แปลงเป็นค่าแฮชทางเดียวร่วมกับค่า Salt (เช่น SHA-256 + Salt)", "แปลงเป็นข้อความ Base64 ธรรมดา", "บันทึกเป็นข้อความปกติ Plaintext ในตาราง", "บีบอัดเป็นไฟล์ ZIP โดยไม่ตั้งรหัส"],
          answer: 0,
          explanation: "การทำ Hashing ทางเดียวคู่กับค่าสุ่ม Salt ช่วยป้องกันไม่ให้ใครถอดรหัสผ่านเดิมออกมาได้แม้ฐานข้อมูลรั่วไหล"
        },
        {
          badge: "UNIT 10 • WEB SECURITY",
          consoleLabel: "LOGIN FORM: ส่งรหัสนักเรียนและรหัสผ่านจากเว็บเบราว์เซอร์ไปยังเซิร์ฟเวอร์อย่างปลอดภัย",
          prompt: "โปรโตคอลมาตรฐานที่เข้ารหัสลับข้อมูลระหว่างส่งบนเว็บไซต์และตรวจสอบใบรับรองเซิร์ฟเวอร์คือข้อใด",
          options: ["HTTPS (HTTP ร่วมกับ SSL/TLS)", "HTTP แบบข้อความเปิดเผย", "FTP พอร์ต 21 แบบดั้งเดิม", "Telnet ไม่เข้ารหัส"],
          answer: 0,
          explanation: "HTTPS ใช้โปรโตคอล TLS เข้ารหัสลับข้อมูลระหว่างเบราว์เซอร์กับเซิร์ฟเวอร์ ป้องกันการดักฟังบนเครือข่าย"
        },
        {
          badge: "UNIT 11 • RFID POWER SOURCE",
          consoleLabel: "SMART CARD: บัตรแตะเข้าอาคารและสติกเกอร์ติดหนังสือห้องสมุด บางเบา ไม่มีแบตเตอรี่ในตัว",
          prompt: "แท็ก RFID ที่อาศัยพลังงานเหนี่ยวนำจากคลื่นของเครื่องอ่านโดยไม่มีแบตเตอรี่ในตัว คือแท็กชนิดใด",
          options: ["Passive Tag", "Active Tag มีแบตเตอรี่ส่งสัญญาณเอง", "Optical Laser Tag", "Capacitive Sensor"],
          answer: 0,
          explanation: "Passive Tag ไม่มีแบตเตอรี่ในตัว จึงมีขนาดบาง ราคาประหยัด และทำงานเมื่อได้รับคลื่นจากเครื่องอ่าน"
        },
        {
          badge: "UNIT 11 • NFC FREQUENCY",
          consoleLabel: "MOBILE TAP: แตะสมาร์ตโฟนชำระเงินและอ่านบัตรสมาร์ตการ์ดในระยะใกล้ไม่เกินไม่กี่เซนติเมตร",
          prompt: "เทคโนโลยี NFC ทำงานอยู่ในย่านความถี่วิทยุมาตรฐานใดของระบบ RFID",
          options: ["13.56 MHz (ย่านความถี่สูง HF)", "125 kHz (ย่านความถี่ต่ำ LF)", "920 MHz (ย่านความถี่สูงยิ่ง UHF)", "5.8 GHz Wi-Fi"],
          answer: 0,
          explanation: "NFC พัฒนาบนมาตรฐาน RFID ย่านความถี่สูง HF ที่ความถี่ 13.56 MHz สำหรับการสื่อสารระยะประชิด"
        },
        {
          badge: "UNIT 11 • MULTI-TAG & INTERFERENCE",
          consoleLabel: "RF PHYSICS: ทดลองห่อแท็ก RFID ด้วยแผ่นวัสดุชนิดหนึ่ง ปรากฏว่าคลื่นวิทยุสะท้อนและอ่านค่าไม่ได้เลย",
          prompt: "วัสดุในข้อใดกั้นและรบกวนคลื่นวิทยุของระบบ RFID มากที่สุด",
          options: ["แผ่นโลหะและของเหลว (น้ำ)", "กล่องกระดาษลูกฟูกแห้ง", "ซองพลาสติกใส", "ผ้าฝ้ายบาง"],
          answer: 0,
          explanation: "โลหะสะท้อนคลื่นวิทยุทำให้เกิดจุดบอดสัญญาณ ส่วนน้ำดูดกลืนพลังงานคลื่นวิทยุโดยเฉพาะในย่านความถี่สูง"
        },
        {
          badge: "UNIT 12 • BIOMETRIC TEMPLATE",
          consoleLabel: "FINGERPRINT: สกัดจุดปลายเส้นและจุดแยกเส้น (Minutiae) แทนการเก็บรูปถ่ายลายนิ้วมือดิบ",
          prompt: "ชุดข้อมูลตัวเลขที่ได้จากการสกัดลักษณะเด่นเพื่อใช้เปรียบเทียบยืนยันตัวตน เรียกว่าอะไร",
          options: ["แม่แบบข้อมูลชีวมิติ (Biometric Template)", "ไฟล์ภาพถ่าย Bitmap ดิบ", "รหัสสำรอง OTP รายครั้ง", "คุกกี้ของเว็บเบราว์เซอร์"],
          answer: 0,
          explanation: "ระบบชีวมิติที่ปลอดภัยจะจัดเก็บเฉพาะ Template ตัวเลขที่สกัดจากจุดเด่น Minutiae และเข้ารหัสไว้เท่านั้น"
        },
        {
          badge: "UNIT 12 • ANTI-SPOOFING",
          consoleLabel: "SPOOF TEST: ป้องกันไม่ให้ผู้บุกรุกนำรูปถ่ายใบหน้าหรือนิ้วซิลิโคนปลอมมาหลอกเครื่องสแกน",
          prompt: "กลไกตรวจสอบว่าเป็นอวัยวะของผู้ที่มีชีวิตจริงขณะสแกน เรียกว่าเทคโนโลยีใด",
          options: ["Liveness Detection (การตรวจความมีชีวิต)", "Run-Length Encoding", "Batch Mode Sync", "URL Percent-encoding"],
          answer: 0,
          explanation: "Liveness Detection ตรวจสัญญาณของสิ่งมีชีวิต เช่น การกะพริบตา ความลึกสามมิติ หรือการไหลเวียนเลือด"
        },
        {
          badge: "UNIT 12 • THRESHOLD TUNING",
          consoleLabel: "VAULT ROOM: ปรับค่าเกณฑ์ตัดสิน (Threshold) ของเครื่องสแกนหน้าห้องเซิร์ฟเวอร์ให้สูงและเข้มงวดขึ้น",
          prompt: "เมื่อปรับค่า Threshold ให้สูงขึ้น อัตราความผิดพลาด FAR และ FRR จะเปลี่ยนแปลงอย่างไร",
          options: ["FAR ลดลง (คนอื่นสวมรอยยากขึ้น) แต่ FRR เพิ่มขึ้น", "FAR เพิ่มขึ้น และ FRR ลดลง", "คนแปลกหน้าผ่านง่ายขึ้นกว่าเดิม", "ไม่มีผลต่อความปลอดภัยใด ๆ"],
          answer: 0,
          explanation: "เกณฑ์ยิ่งสูง คนอื่นยิ่งปลอมผ่านยาก (FAR ลดลง) แต่เจ้าของตัวจริงอาจถูกปฏิเสธบ่อยขึ้นหากวางนิ้วเบี้ยว (FRR เพิ่มขึ้น)"
        },
        {
          badge: "UNIT 12 • 1:1 VS 1:N MATCHING",
          consoleLabel: "DEVICE AUTH: เจ้าของแตะนิ้วเข้าใช้งานสมาร์ตโฟนส่วนตัวของตนเอง (เทียบกับแม่แบบเจ้าของเครื่อง)",
          prompt: "การตรวจสอบเทียบกับแม่แบบของเจ้าของที่ระบุไว้เพียงชุดเดียว จัดเป็นรูปแบบใด",
          options: ["การยืนยันตัวตนแบบ 1:1 (Verification)", "การระบุตัวตนค้นทั้งฐานข้อมูล 1:N (Identification)", "การสำรองข้อมูลแบบคลาวด์", "การบีบอัดข้อมูลแบบสูญเสีย"],
          answer: 0,
          explanation: "การเทียบข้อมูลชีวมิติกับแม่แบบของเจ้าของเครื่องโดยเฉพาะ เป็นการยืนยันตัวตนแบบ 1 ต่อ 1 (Verification)"
        }
      ]
    },

    G04: {
      id: "G04",
      moduleId: 4,
      afterUnitNo: 16,
      nextUnitNo: null,
      title: "Data Encoding & RLE Sprint",
      thaiTitle: "สปรินต์แปลงรหัสอักขระ คำนวณไบต์ บีบอัด RLE และเส้นทางข้อมูล",
      checkpointLabel: "คั่นหลังหน่วยที่ 16 (ภารกิจสรุปหมวดที่ 4)",
      timeLimitSec: 60,
      roundsPerPlay: 10,
      pointsPerCorrect: 2,
      rules: [
        "อ่านข้อมูลในหน้าจอเทอร์มินัลและแถบบล็อก RLE แล้วคำนวณไบต์หรือเลือกคำสั่งจัดการข้อมูลให้ไวที่สุดใน 60 วินาที",
        "สุ่มโจทย์ 10 ด่าน ตอบถูกรับด่านละ +2 คะแนน (เต็ม 20 คะแนน) ตอบผิดได้ 0 คะแนนและไปด่านถัดไปทันที",
        "คลิกปุ่มคำตอบ หรือกดปุ่มตัวเลข 1 – 4 บนแป้นพิมพ์เพื่อเร่งสปีดทำเวลา",
        "เมื่อจบเกม ระบบบันทึกคะแนนและเวลาที่ใช้จริง (วินาที) ลงฐานข้อมูลทันทีเพื่อชิงอันดับ Top 10 Leaderboard"
      ],
      challenges: [
        {
          badge: "UNIT 13 • DBMS INTEGRITY",
          terminalCode: "TABLE Products -> Field: product_code (ห้ามว่าง และห้ามซ้ำกันในตาราง)",
          prompt: "ฟิลด์ที่ใช้ระบุแต่ละระเบียนในตารางฐานข้อมูลโดยห้ามมีค่าซ้ำกันเลย เรียกว่าอะไร",
          options: ["Primary Key (คีย์หลัก)", "Delimiter (ตัวคั่นคอลัมน์)", "Padding (อักขระเติมท้าย)", "Keyframe (เฟรมหลัก)"],
          answer: 0,
          explanation: "Primary Key บังคับให้ข้อมูลในฟิลด์นั้นไม่ว่างและไม่ซ้ำกัน เพื่อใช้อ้างอิงแต่ละระเบียนได้อย่างแม่นยำ"
        },
        {
          badge: "UNIT 13 • POWER QUERY CLEANING",
          terminalCode: 'RAW CELL: "  สมุดปกอ่อน  " vs "สมุดปกอ่อน" -> ต้องตัดช่องว่างก่อนลบซ้ำ',
          prompt: "คำสั่งใดใน Power Query ที่ใช้ตัดช่องว่างส่วนเกินหน้าและหลังข้อความออก",
          options: ["คำสั่ง Trim", "คำสั่ง Transpose", "คำสั่ง Group By", "คำสั่ง Append"],
          answer: 0,
          explanation: "Transform > Format > Trim จะลบช่องว่างหน้า-หลังข้อความออก ซึ่งต้องทำก่อนสั่ง Remove Duplicates"
        },
        {
          badge: "UNIT 13 • IOT PROTOCOL",
          terminalCode: "SENSOR NET: เซนเซอร์วัดอุณหภูมิ 50 จุด ส่งข้อความสั้น ๆ เข้าเซิร์ฟเวอร์ทุก 1 นาที",
          prompt: "โปรโตคอลน้ำหนักเบาที่เหมาะกับการรับส่งข้อมูลขนาดเล็กถี่ ๆ จากอุปกรณ์ IoT คือข้อใด",
          options: ["MQTT", "SMTP", "POP3", "IMAP"],
          answer: 0,
          explanation: "MQTT มีส่วนหัวข้อมูลขนาดเล็กมาก ใช้พลังงานและแบนด์วิดท์ต่ำ จึงเหมาะกับระบบเซนเซอร์ IoT"
        },
        {
          badge: "UNIT 14 • ASCII & UTF-8",
          terminalCode: 'TEXT FILE (UTF-8 without BOM): "สวัสดี" (อักขระไทยรวมสระ 6 ตัว x 3 ไบต์)',
          prompt: "คำว่า 'สวัสดี' เมื่อบันทึกด้วยรหัสมาตรฐาน UTF-8 (ไม่มี BOM) จะมีขนาดไฟล์กี่ไบต์",
          options: ["18 ไบต์", "6 ไบต์", "9 ไบต์", "36 ไบต์"],
          answer: 0,
          explanation: "ในมาตรฐาน UTF-8 อักษรไทยและสระใช้ตัวละ 3 ไบต์ คำว่า 'สวัสดี' มี 6 ตัวอักษร จึงใช้ 6 x 3 = 18 ไบต์"
        },
        {
          badge: "UNIT 14 • MOJIBAKE FIX",
          terminalCode: 'CSV PREVIEW: "เธชเธงเธฑเธชเธ”เธต" (ภาษาไทยแสดงผลเพี้ยนตอนเปิดไฟล์)',
          prompt: "อาการภาษาไทยเพี้ยนเป็นตัว 'เธ' นำหน้า เกิดจากสาเหตุใดและควรเลือก Encoding ใดตอนนำเข้า",
          options: ["ไฟล์เป็น UTF-8 แต่ถูกเปิดแบบเก่า แก้โดยเลือก Unicode (UTF-8)", "ไฟล์ติดไวรัส แก้โดยฟอร์แมตฮาร์ดดิสก์", "ไฟล์เป็นภาพ PNG แก้โดยแปลงเป็น MP3", "สายจอภาพหลวม แก้โดยเปลี่ยนความละเอียดจอ"],
          answer: 0,
          explanation: "เกิดจากไฟล์ UTF-8 ถูกโปรแกรมอ่านด้วยรหัสไทยรุ่นเก่า Windows-874 แก้ได้ทันทีโดยเลือก File Origin เป็น 65001: UTF-8"
        },
        {
          badge: "UNIT 14 • URL & BASE64",
          terminalCode: 'QUERY URL: https://cdti.ac.th/search?q=data input -> แปลงช่องว่าง (Space)',
          prompt: "เมื่อทำ URL Encoding (Percent-encoding) เครื่องหมายช่องว่างจะถูกแปลงเป็นรหัสใด",
          options: ["%20", "%00", "%65", "%FF"],
          answer: 0,
          explanation: "ช่องว่างมีค่ารหัส ASCII เท่ากับ 32 ในฐานสิบ หรือ 20 ในเลขฐานสิบหก เมื่อทำ Percent-encoding จึงได้ %20"
        },
        {
          badge: "UNIT 15 • RLE COMPRESSION",
          terminalCode: 'INPUT STRING: "SSSSSSGGDD" -> บีบอัดด้วย Run-Length Encoding (RLE)',
          rleCells: ["S", "S", "S", "S", "S", "S", "G", "G", "D", "D"],
          prompt: "ผลลัพธ์ของการบีบอัดข้อความ 'SSSSSSGGDD' ด้วยเทคนิค RLE ตรงกับข้อใด",
          options: ["6S2G2D", "S6G2D20", "10SGD", "SGD622"],
          answer: 0,
          explanation: "S เรียงติดกัน 6 ตัว (6S), G เรียงกัน 2 ตัว (2G) และ D เรียงกัน 2 ตัว (2D) ยุบรวมได้เป็น 6S2G2D"
        },
        {
          badge: "UNIT 15 • RLE PIXEL STRIP",
          terminalCode: 'PIXEL ROW: "WWWWBBBBWW" (ขาว 4 จุด, ดำ 4 จุด, ขาว 2 จุด) -> แปลงเป็น RLE',
          rleCells: ["W", "W", "W", "W", "B", "B", "B", "B", "W", "W"],
          prompt: "แถวพิกเซลขาว-ดำ 'WWWWBBBBWW' เมื่อเข้ารหัสด้วย RLE จะได้ผลลัพธ์ข้อใด",
          options: ["4W4B2W", "6W4B", "W4B4W20", "10WB"],
          answer: 0,
          explanation: "RLE นับจำนวนข้อมูลที่ซ้ำติดกันตามลำดับจริง จึงได้ 4W ตามด้วย 4B และปิดท้ายด้วย 2W (ห้ามนำ W หน้าและหลังมารวมกัน)"
        },
        {
          badge: "UNIT 15 • COMPRESSION METRICS",
          terminalCode: "ARCHIVE: ไฟล์ CSV ขนาดเดิม 800 KB -> บีบอัดเป็น .zip เหลือขนาด 200 KB",
          prompt: "อัตราส่วนการบีบอัด (Compression Ratio) และพื้นที่ที่ประหยัดได้ตรงกับข้อใด",
          options: ["อัตราส่วน 4 : 1 (ประหยัดพื้นที่ 75%)", "อัตราส่วน 1 : 4 (ประหยัดพื้นที่ 25%)", "อัตราส่วน 2 : 1 (ประหยัดพื้นที่ 50%)", "อัตราส่วน 8 : 1 (ประหยัดพื้นที่ 90%)"],
          answer: 0,
          explanation: "800 / 200 = 4 : 1 และประหยัดพื้นที่ได้ (1 - 200/800) x 100 = 75%"
        },
        {
          badge: "UNIT 15 • LOSSLESS VS LOSSY",
          terminalCode: "ACCOUNTING DB: ส่งมอบไฟล์ตารางบัญชีการเงินและซอร์สโค้ดโปรแกรมข้ามแผนก",
          prompt: "ไฟล์ตัวเลขทางบัญชีและซอร์สโค้ดต้องเลือกบีบอัดด้วยรูปแบบใดเพื่อห้ามข้อมูลเพี้ยนแม้แต่บิตเดียว",
          options: ["Lossless Compression (เช่น .zip หรือ .7z)", "Lossy Compression คุณภาพต่ำ", "แปลงเป็นภาพ .jpg คุณภาพ 10%", "ตัดทศนิยมทิ้งทั้งหมด"],
          answer: 0,
          explanation: "Lossless รับประกันว่าเมื่อคลายไฟล์แล้วจะได้ทุกบิตและทุกตัวอักษรตรงกับต้นฉบับครบ 100%"
        },
        {
          badge: "UNIT 16 • PIPELINE ORDERING",
          terminalCode: "DATA PIPELINE: ต้องการทั้งบีบอัดขนาดไฟล์ (Compress) และเข้ารหัสลับ (Encrypt) ก่อนส่ง",
          prompt: "ลำดับการดำเนินการข้อใดถูกต้องและทำให้ขนาดไฟล์ลดลงได้จริง",
          options: ["ต้องบีบอัด (Compress) ก่อน แล้วจึงนำไปเข้ารหัสลับ (Encrypt)", "ต้องเข้ารหัสลับให้เป็นค่าสุ่มก่อน แล้วค่อยนำไปบีบอัด", "ไม่ต้องตรวจความถูกต้องของข้อมูลก่อนจัดเก็บ", "ลบคีย์หลักออกก่อนส่งเข้าฐานข้อมูล"],
          answer: 0,
          explanation: "ข้อมูลที่เข้ารหัสลับแล้วจะกระจายตัวคล้ายข้อมูลสุ่มจนไม่เหลือรูปแบบซ้ำให้บีบอัด จึงต้องบีบอัดให้เล็กลงก่อนเสมอ"
        },
        {
          badge: "UNIT 16 • EXCEL VALIDATION BYPASS",
          terminalCode: "FORM AUDIT: ตั้งกฎห้ามพิมพ์จำนวนติดลบไว้ใน Excel แต่กลับพบค่า -25 หลุดเข้ามาในตาราง",
          prompt: "การกระทำใดของผู้ใช้ที่มักข้ามกฎ Data Validation ใน Excel ได้โดยไม่เด้งหน้าต่างเตือน",
          options: ["การคัดลอกค่าจากที่อื่นมาวางทับ (Copy & Paste)", "การพิมพ์ตัวเลขช้า ๆ ทีละหลักแล้วกด Enter", "การเปลี่ยนสีพื้นหลังหัวตาราง", "การกดปุ่มตรวจคำสะกด"],
          answer: 0,
          explanation: "การ Copy & Paste จากเซลล์อื่นสามารถทับกฎ Data Validation ได้ จึงต้องตรวจซ้ำด้วย Circle Invalid Data ก่อนนำเข้า DBMS"
        },
        {
          badge: "UNIT 16 • SHA-256 INTEGRITY",
          terminalCode: "HASH CHECK: ค่าแฮช SHA-256 ของไฟล์ใบสั่งซื้อปลายทางไม่ตรงกับค่าแฮชต้นฉบับ",
          prompt: "ข้อสรุปใดถูกต้องเกี่ยวกับผลลัพธ์ค่าแฮชที่ไม่ตรงกันนี้",
          options: ["ยืนยันได้ว่าไฟล์ถูกเปลี่ยนแปลงไปจากต้นฉบับ แต่ไม่บอกว่าแก้ตรงบรรทัดใด", "ระบบจะซ่อมแซมเนื้อหาไฟล์กลับเป็นค่าเดิมให้อัตโนมัติทันที", "ระบุชื่อและรหัสพนักงานที่แอบแก้ไขไฟล์ออกมาได้ทันที", "เกิดจากการเปลี่ยนชื่อโฟลเดอร์โดยไม่ได้แตะต้องเนื้อหาในไฟล์"],
          answer: 0,
          explanation: "ค่าแฮชพิสูจน์ความสมบูรณ์ของเนื้อหาไฟล์ว่ามีการเปลี่ยนแปลงหรือไม่ แต่ไม่ได้บอกตำแหน่งที่แก้และกู้คืนข้อมูลเองไม่ได้"
        }
      ]
    }
  };

  /* ==========================================================================
     4. RUNTIME STATE, GAME LOOP (rAF) & SHUFFLE HELPERS
     ========================================================================== */

  let pendingRuleGameId = "G01";
  let gameState = null;
  let gameLoopRafId = 0;
  let transitionTimeoutId = null;

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function buildShuffledRounds(gameDef) {
    const picked = shuffleArray(gameDef.challenges).slice(0, gameDef.roundsPerPlay);
    return picked.map((ch) => {
      const correctText = ch.options[ch.answer];
      const shuffledOpts = shuffleArray(ch.options);
      const newAnswerIdx = shuffledOpts.indexOf(correctText);
      return {
        badge: ch.badge,
        specimenSvg: ch.specimenSvg || "",
        consoleLabel: ch.consoleLabel || "",
        terminalCode: ch.terminalCode || "",
        rleCells: ch.rleCells || null,
        prompt: ch.prompt,
        options: shuffledOpts,
        answer: newAnswerIdx,
        correctText: correctText,
        explanation: ch.explanation
      };
    });
  }

  function clearGameTimers() {
    if (gameLoopRafId) {
      cancelAnimationFrame(gameLoopRafId);
      gameLoopRafId = 0;
    }
    if (transitionTimeoutId) {
      clearTimeout(transitionTimeoutId);
      transitionTimeoutId = null;
    }
  }

  function setMiniGameFocusMode(active) {
    if (active) {
      document.body.classList.add("is-minigame-active");
      window.scrollTo({ top: 0, behavior: "auto" });
    } else {
      document.body.classList.remove("is-minigame-active");
    }
  }

  function stopActiveGame() {
    clearGameTimers();
    setMiniGameFocusMode(false);
    if (gameState && gameState.phase === "playing") {
      gameState.phase = "aborted";
    }
    const ws = document.getElementById("minigame-workspace");
    if (ws) ws.classList.add("hidden");
  }

  /* ==========================================================================
     5. MANDATORY RULE POP-UP MODAL (SHOWN BEFORE STARTING 60S TIMER)
     ========================================================================== */

  function openRuleModal(gameId) {
    const gameDef = GAMES_CATALOG[gameId] || GAMES_CATALOG.G01;
    pendingRuleGameId = gameDef.id;

    const modal = document.getElementById("minigame-rule-modal");
    if (!modal) return;

    const esc = window.AppUtils.escapeHtml;
    const gameMap = window.AuthManager?.getMiniGameRecordsMap() || {};
    const rec = gameMap[gameDef.id];
    const hasPlayed = Boolean(rec && rec.play_count > 0);

    const badgeEl = document.getElementById("mg-rule-badge");
    const checkpointEl = document.getElementById("mg-rule-checkpoint");
    const titleEl = document.getElementById("mg-rule-modal-title");
    const subtitleEl = document.getElementById("mg-rule-subtitle");
    const timeLimitEl = document.getElementById("mg-rule-time-limit");
    const maxScoreEl = document.getElementById("mg-rule-max-score");
    const personalBestEl = document.getElementById("mg-rule-personal-best");
    const ruleListEl = document.getElementById("mg-rule-list");
    const startBtn = document.getElementById("btn-confirm-start-minigame");

    if (badgeEl) badgeEl.textContent = `TIME-ATTACK  •  ${gameDef.id}`;
    if (checkpointEl) checkpointEl.textContent = gameDef.checkpointLabel;
    if (titleEl) titleEl.textContent = `${gameDef.id}: ${gameDef.title}`;
    if (subtitleEl) subtitleEl.textContent = gameDef.thaiTitle;
    if (timeLimitEl) timeLimitEl.textContent = `${gameDef.timeLimitSec} วินาที`;
    if (maxScoreEl) {
      maxScoreEl.textContent = `${gameDef.roundsPerPlay} ด่าน (${
        gameDef.roundsPerPlay * gameDef.pointsPerCorrect
      } คะแนน)`;
    }
    if (personalBestEl) {
      personalBestEl.textContent = hasPlayed
        ? `${rec.best_score} คะแนน • ${window.AppUtils.formatDuration(rec.best_time_sec)}`
        : "ยังไม่เคยเล่น";
      personalBestEl.style.color = hasPlayed ? "var(--status-pass-ink)" : "var(--text-muted)";
    }

    if (ruleListEl) {
      ruleListEl.innerHTML = gameDef.rules
        .map(
          (rText, idx) => `
            <li>
              <span class="game-rule-step-chip">${idx + 1}</span>
              <span>${esc(rText)}</span>
            </li>
          `
        )
        .join("");
    }

    if (startBtn) {
      startBtn.textContent = `รับทราบกติกา • เริ่มจับเวลา ${gameDef.timeLimitSec} วินาที`;
    }

    if (window.MotionEngine) {
      window.MotionEngine.animateModalOpen(modal);
    } else {
      modal.classList.remove("hidden");
    }
  }

  function closeRuleModal() {
    const modal = document.getElementById("minigame-rule-modal");
    if (modal) modal.classList.add("hidden");
  }

  /* ==========================================================================
     6. LIVE 60-SECOND TIME-ATTACK ARENA (60FPS rAF LOOP + COMBO STREAK)
     ========================================================================== */

  function startMiniGame(gameId) {
    const gameDef = GAMES_CATALOG[gameId] || GAMES_CATALOG.G01;
    closeRuleModal();
    clearGameTimers();
    GameAudio.playStart();

    window.LearningEngine?.stopActiveTimer();
    if (window.AppController && window.AppController.getActiveView() !== "lessons") {
      window.AppController.switchView("lessons", { scrollTop: false });
    }

    document.getElementById("lessons-directory-shell")?.classList.add("hidden");
    document.getElementById("lesson-workspace")?.classList.add("hidden");
    const ws = document.getElementById("minigame-workspace");
    if (ws) ws.classList.remove("hidden");

    const rounds = buildShuffledRounds(gameDef);
    const nowMs = Date.now();

    gameState = {
      gameDef: gameDef,
      phase: "playing",
      rounds: rounds,
      currentIdx: 0,
      score: 0,
      streak: 0,
      maxStreak: 0,
      startedAtMs: nowMs,
      deadlineMs: nowMs + gameDef.timeLimitSec * 1000,
      remainingMs: gameDef.timeLimitSec * 1000,
      lockedInput: false,
      lastChoiceIdx: null,
      lastHitDelta: null,
      labState: {
        signalMode: "digital",
        scanMode: "2d",
        threshold: 75,
        rfMaterial: "paper",
        encodingSample: "utf8"
      },
      history: new Array(rounds.length).fill(null),
      finalTimeSec: 0,
      finishReason: "completed",
      isSaving: false,
      saveError: ""
    };

    renderArenaWorkspace();
    window.scrollTo({ top: 0, behavior: "smooth" });
    runGameLoop();
  }

  function runGameLoop() {
    if (!gameState || gameState.phase !== "playing") {
      gameLoopRafId = 0;
      return;
    }

    const rem = Math.max(0, gameState.deadlineMs - Date.now());
    gameState.remainingMs = rem;
    updateLiveCountdownDom();

    if (rem <= 0) {
      finishMiniGame("timeout");
      return;
    }

    gameLoopRafId = requestAnimationFrame(runGameLoop);
  }

  function updateLiveCountdownDom() {
    if (!gameState) return;
    const totalMs = gameState.gameDef.timeLimitSec * 1000;
    const remSecCeil = Math.ceil(gameState.remainingMs / 1000);
    const scaleRatio = Math.max(0, Math.min(1, gameState.remainingMs / totalMs));

    const clockEl = document.getElementById("mg-countdown-clock");
    const fillEl = document.getElementById("mg-time-bar-fill");

    const stateClass =
      remSecCeil <= 7 ? "is-danger" : remSecCeil <= 15 ? "is-warn" : "";

    if (clockEl) {
      const formatted = window.AppUtils.formatDuration(remSecCeil);
      const span = clockEl.querySelector("span");
      if (span) {
        if (span.textContent !== formatted) span.textContent = formatted;
      } else if (clockEl.textContent !== formatted) {
        clockEl.textContent = formatted;
      }
      clockEl.className = `mg-countdown-clock-badge font-notch tabular-nums ${stateClass}`.trim();
    }
    if (fillEl) {
      fillEl.style.transform = `scaleX(${scaleRatio.toFixed(4)})`;
      fillEl.className = `mg-timer-fill ${stateClass}`.trim();
    }
  }

  function renderSfxToggleIcon() {
    if (sfxEnabled) {
      return `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <span>เสียง: เปิด</span>
      `;
    }
    return `
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
        <line x1="23" y1="9" x2="17" y2="15"></line>
        <line x1="17" y1="9" x2="23" y2="15"></line>
      </svg>
      <span>เสียง: ปิด</span>
    `;
  }

  function renderArenaWorkspace() {
    const ws = document.getElementById("minigame-workspace");
    if (!ws || !gameState) return;

    const esc = window.AppUtils.escapeHtml;
    const def = gameState.gameDef;
    const round = gameState.rounds[gameState.currentIdx];
    const maxScore = def.roundsPerPlay * def.pointsPerCorrect;
    const remSecCeil = Math.ceil(gameState.remainingMs / 1000);
    const scaleRatio = Math.max(
      0,
      Math.min(1, gameState.remainingMs / (def.timeLimitSec * 1000))
    );
    const stateClass =
      remSecCeil <= 7 ? "is-danger" : remSecCeil <= 15 ? "is-warn" : "";

    const dotsHtml = gameState.rounds
      .map((_, idx) => {
        const rec = gameState.history[idx];
        const isCurrent = idx === gameState.currentIdx;
        let cls = "";
        if (rec) {
          cls = rec.isCorrect ? "is-correct" : "is-wrong";
        } else if (isCurrent) {
          cls = "is-current";
        }
        return `<span class="quiz-progress-dot font-notch ${cls}">${idx + 1}</span>`;
      })
      .join("");

    // Specimen box + Animated Scanner / Console
    let specimenHtml = "";
    if (round.specimenSvg || round.consoleLabel || round.terminalCode) {
      const svgMarkup = round.specimenSvg
        ? renderSpecimenSvg(round.specimenSvg, gameState.labState.scanMode)
        : "";
      specimenHtml = `
        <div class="mg-specimen-box">
          <div style="min-width: 0; flex: 1;">
            <span class="font-notch" style="font-size: 0.74rem; font-weight: 700; color: var(--blue-600); display: block; margin-bottom: 6px;">
              ${esc(round.badge)}
            </span>
            ${
              round.terminalCode
                ? `<code class="mg-terminal-code">${esc(round.terminalCode)}</code>`
                : `<p style="font-size: 0.9rem; font-weight: 500; color: var(--text-main); line-height: 1.55;">${esc(round.consoleLabel)}</p>`
            }
          </div>
          ${
            svgMarkup
              ? `<div id="mg-specimen-svg-container" class="mg-specimen-svg-wrap">${svgMarkup}</div>`
              : ""
          }
        </div>
      `;
    }

    const workbenchHtml = renderInteractiveWorkbench(def.id, round, gameState.labState);

    const padsHtml = round.options
      .map((optText, idx) => {
        let stateCls = "";
        if (gameState.lockedInput && gameState.lastChoiceIdx !== null) {
          if (idx === round.answer) {
            stateCls = "is-correct";
          } else if (idx === gameState.lastChoiceIdx) {
            stateCls = "is-wrong";
          }
        }

        return `
          <button
            type="button"
            class="mg-pad-btn ${stateCls}"
            data-mg-choice="${idx}"
            ${gameState.lockedInput ? "disabled" : ""}
          >
            <span class="mg-pad-key">${idx + 1}</span>
            <span style="flex: 1; min-width: 0; line-height: 1.48;">${esc(optText)}</span>
          </button>
        `;
      })
      .join("");

    const streakHtml =
      gameState.streak >= 2
        ? `<span class="mg-streak-pill font-notch">COMBO x${gameState.streak}</span>`
        : "";

    const hitFloatHtml =
      gameState.lastHitDelta !== null
        ? `<span class="mg-score-float font-notch ${
            gameState.lastHitDelta > 0 ? "is-plus" : "is-miss"
          }">${gameState.lastHitDelta > 0 ? `+${gameState.lastHitDelta} PTS` : "MISS"}</span>`
        : "";

    setMiniGameFocusMode(true);
    ws.innerHTML = `
      <div class="mg-cockpit-shell">
        <!-- Compact HUD Bar -->
        <div class="surface-card mg-cockpit-hud">
          <div class="mg-cockpit-hud-top">
            <div class="mg-cockpit-hud-left">
              <button type="button" class="btn-secondary mg-back-btn" id="btn-abort-minigame" title="ออกจากมินิเกม">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                <span>ออก</span>
              </button>
              <span class="unit-number-badge font-notch">${esc(def.id)}</span>
              <span class="mg-hud-round-tag font-notch">ด่าน ${gameState.currentIdx + 1}/${def.roundsPerPlay}</span>
            </div>

            <div class="mg-cockpit-hud-center">
              <div id="mg-countdown-clock" class="mg-countdown-clock-badge font-notch tabular-nums ${stateClass}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="13" r="8"></circle>
                  <path d="M12 9v4l2.5 2.5"></path>
                  <path d="M9 2h6"></path>
                </svg>
                <span>${window.AppUtils.formatDuration(remSecCeil)}</span>
              </div>
            </div>

            <div class="mg-cockpit-hud-right">
              <span class="mg-hud-score-badge font-notch">
                คะแนน: <strong id="mg-live-score">${gameState.score}/${maxScore}</strong>
              </span>
              ${streakHtml}
              ${hitFloatHtml}
              <button type="button" class="btn-secondary mg-sfx-btn" id="btn-mg-sfx-toggle" title="เปิด/ปิดเสียง">
                ${renderSfxToggleIcon()}
              </button>
            </div>
          </div>

          <div class="mg-timer-track" aria-hidden="true" style="height: 5px; margin: 6px 0;">
            <div id="mg-time-bar-fill" class="mg-timer-fill ${stateClass}" style="width: 100%; transform: scaleX(${scaleRatio.toFixed(4)});"></div>
          </div>

          <div class="quiz-dots-row mg-cockpit-dots">
            ${dotsHtml}
          </div>
        </div>

        <!-- Main Challenge Stage Card -->
        <div id="mg-active-arena-card" class="surface-card mg-cockpit-card">
          ${specimenHtml}
          ${workbenchHtml}

          <div class="mg-prompt-row">
            <h2 class="mg-prompt-title">
              ด่านที่ ${gameState.currentIdx + 1}: ${esc(round.prompt)}
            </h2>
            <span class="mg-prompt-sub">เลือกคำตอบที่ถูกต้องให้ไวที่สุด (คลิก หรือกด 1–4 บนแป้นพิมพ์)</span>
          </div>

          <!-- 2x2 Fast-Tap Pads -->
          <div class="mg-pads-grid">
            ${padsHtml}
          </div>
        </div>
      </div>
    `;
    `;
  }

  function handleSelectChoice(choiceIdx) {
    if (!gameState || gameState.phase !== "playing" || gameState.lockedInput) return;

    const round = gameState.rounds[gameState.currentIdx];
    if (!round || choiceIdx < 0 || choiceIdx >= round.options.length) return;

    gameState.lockedInput = true;
    gameState.lastChoiceIdx = choiceIdx;

    const isCorrect = choiceIdx === round.answer;
    if (isCorrect) {
      gameState.score += gameState.gameDef.pointsPerCorrect;
      gameState.streak += 1;
      gameState.maxStreak = Math.max(gameState.maxStreak, gameState.streak);
      gameState.lastHitDelta = gameState.gameDef.pointsPerCorrect;
      GameAudio.playHit(gameState.streak);
    } else {
      gameState.streak = 0;
      gameState.lastHitDelta = 0;
      GameAudio.playMiss();
    }

    gameState.history[gameState.currentIdx] = {
      chosenIdx: choiceIdx,
      chosenText: round.options[choiceIdx],
      isCorrect: isCorrect
    };

    renderArenaWorkspace();
    if (!isCorrect) {
      const arenaCard = document.getElementById("mg-active-arena-card");
      window.MotionEngine?.shakeElement(arenaCard);
    }

    const isLastRound = gameState.currentIdx >= gameState.rounds.length - 1;
    if (isLastRound) {
      transitionTimeoutId = setTimeout(() => {
        finishMiniGame("completed");
      }, 230);
    } else {
      transitionTimeoutId = setTimeout(() => {
        if (!gameState || gameState.phase !== "playing") return;
        gameState.currentIdx += 1;
        gameState.lockedInput = false;
        gameState.lastChoiceIdx = null;
        gameState.lastHitDelta = null;
        renderArenaWorkspace();
        const arenaCard = document.getElementById("mg-active-arena-card");
        window.MotionEngine?.animateStepSlide(arenaCard, "next");
      }, 260);
    }
  }

  /* ==========================================================================
     7. IMMEDIATE SCORE + TIME SAVING & POST-GAME SUMMARY
     ========================================================================== */

  async function finishMiniGame(reason = "completed") {
    if (!gameState || gameState.phase === "result") return;
    clearGameTimers();
    setMiniGameFocusMode(false);

    const def = gameState.gameDef;
    const maxScore = def.roundsPerPlay * def.pointsPerCorrect;
    const elapsedSec =
      reason === "timeout"
        ? def.timeLimitSec
        : Math.max(
            1,
            Math.min(def.timeLimitSec, Math.round((Date.now() - gameState.startedAtMs) / 1000))
          );

    gameState.phase = "result";
    gameState.finishReason = reason;
    gameState.finalTimeSec = elapsedSec;
    gameState.isSaving = true;
    gameState.saveError = "";

    const isStrongScore = gameState.score >= Math.round(maxScore * 0.7);
    GameAudio.playFinish(isStrongScore);
    if (isStrongScore) {
      window.MotionEngine?.burstCelebration();
    }

    renderResultWorkspace();
    window.scrollTo({ top: 0, behavior: "smooth" });

    await persistMiniGameScore();
  }

  async function persistMiniGameScore() {
    if (!gameState) return;
    const user = window.AuthManager?.getCurrentUser();
    if (!user) return;

    gameState.isSaving = true;
    gameState.saveError = "";
    renderResultWorkspace();
    window.MotionEngine?.startTopLoader();

    try {
      const res = await window.BackendAPI.submitMiniGame({
        student_id: user.student_id,
        game_id: gameState.gameDef.id,
        score: gameState.score,
        time_sec: gameState.finalTimeSec
      });

      if (!res || !res.ok) {
        throw new Error((res && res.error) || "บันทึกคะแนนมินิเกมไม่สำเร็จ");
      }

      window.AuthManager.updateSessionData(res.user, null, res.minigame_records);
      gameState.isSaving = false;
      renderResultWorkspace();

      window.AppUtils.showToast(
        `บันทึกผลมินิเกม ${gameState.gameDef.id} สำเร็จ (${gameState.score} คะแนน • เวลา ${gameState.finalTimeSec} วินาที)`,
        "success"
      );
    } catch (err) {
      gameState.isSaving = false;
      gameState.saveError = err.message || "เกิดข้อผิดพลาดขณะบันทึกคะแนนมินิเกม";
      renderResultWorkspace();
      window.AppUtils.showToast(gameState.saveError, "error");
    } finally {
      window.MotionEngine?.doneTopLoader();
    }
  }

  function renderResultWorkspace() {
    const ws = document.getElementById("minigame-workspace");
    if (!ws || !gameState) return;

    const esc = window.AppUtils.escapeHtml;
    const def = gameState.gameDef;
    const maxScore = def.roundsPerPlay * def.pointsPerCorrect;
    const answeredCount = gameState.history.filter(Boolean).length;
    const correctCount = gameState.history.filter((h) => h && h.isCorrect).length;

    const user = window.AuthManager?.getCurrentUser();
    const gameMap = window.AuthManager?.getMiniGameRecordsMap() || {};
    const rec = gameMap[def.id] || {};
    const bestScore = Number(rec.best_score != null ? rec.best_score : gameState.score);
    const bestTime = Number(rec.best_time_sec || gameState.finalTimeSec);
    const grandTotal = Number(user?.grand_total_score || 0);

    let saveBannerHtml = "";
    if (gameState.isSaving) {
      saveBannerHtml = `
        <div class="quiz-save-banner is-saving">
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <svg class="btn-spinner-svg" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.4" opacity="0.28"></circle>
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path>
            </svg>
            <span>กำลังบันทึกคะแนน (${gameState.score}/${maxScore}) และเวลา (${gameState.finalTimeSec} วินาที) ไปยังฐานข้อมูล...</span>
          </span>
        </div>
      `;
    } else if (gameState.saveError) {
      saveBannerHtml = `
        <div class="quiz-save-banner is-error">
          <span>${esc(gameState.saveError)}</span>
          <button type="button" class="btn-secondary" id="btn-retry-save-minigame" style="min-height: 32px; padding: 4px 12px; font-size: 0.78rem;">
            ลองบันทึกซ้ำ
          </button>
        </div>
      `;
    } else {
      saveBannerHtml = `
        <div class="quiz-save-banner is-saved">
          บันทึกคะแนน (${gameState.score}/${maxScore} คะแนน) และเวลาที่ใช้จริง (${gameState.finalTimeSec} วินาที) ลงฐานข้อมูลเรียบร้อยแล้ว
        </div>
      `;
    }

    const reviewHtml = gameState.rounds
      .map((rObj, idx) => {
        const h = gameState.history[idx];
        const isOk = Boolean(h && h.isCorrect);
        const statusText = !h
          ? "หมดเวลาก่อนตอบ"
          : isOk
          ? `ถูกต้อง (+${def.pointsPerCorrect})`
          : "ตอบผิด (0)";
        const statusCls = isOk ? "is-pass" : "is-warn";

        return `
          <div class="quiz-review-item">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
              <div style="min-width: 0;">
                <span class="font-notch" style="font-size: 0.76rem; font-weight: 700; color: var(--text-muted);">
                  ROUND ${idx + 1}  •  ${esc(rObj.badge)}
                </span>
                <p style="font-size: 0.88rem; font-weight: 500; color: var(--text-main); margin-top: 2px;">
                  ${esc(rObj.prompt)}
                </p>
                <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px;">
                  คำตอบที่ถูกต้อง: <strong>${esc(rObj.correctText)}</strong> (${esc(rObj.explanation)})
                </p>
              </div>
              <span class="status-pill ${statusCls}" style="flex-shrink: 0;">
                ${esc(statusText)}
              </span>
            </div>
          </div>
        `;
      })
      .join("");

    const nextActionHtml = def.nextUnitNo
      ? `
          <button type="button" class="btn-primary" data-open-unit="${def.nextUnitNo}">
            <span>เรียนต่อหมวดถัดไป (หน่วยที่ ${def.nextUnitNo})</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        `
      : `
          <button type="button" class="btn-primary" data-nav-view="progress">
            <span>ดูความคืบหน้าและเกียรติบัตร</span>
          </button>
        `;

    ws.innerHTML = `
      <div class="surface-card quiz-result-card">
        <div style="display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span class="status-pill ${gameState.finishReason === "timeout" ? "is-warn" : "is-pass"}">
                ${
                  gameState.finishReason === "timeout"
                    ? `หมดเวลา 60 วินาที (ตอบทัน ${answeredCount}/${def.roundsPerPlay} ด่าน)`
                    : `จบภารกิจครบ ${def.roundsPerPlay} ด่านทันเวลา`
                }
              </span>
              ${
                gameState.maxStreak >= 2
                  ? `<span class="status-pill is-info font-notch">MAX COMBO x${gameState.maxStreak}</span>`
                  : ""
              }
            </div>
            <h2 style="font-size: 1.44rem; font-weight: 600; margin-top: 10px; line-height: 1.36;">
              สรุปผลมินิเกม ${esc(def.id)}: ${esc(def.title)}
            </h2>
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px;">
              ตอบถูก ${correctCount} จาก ${def.roundsPerPlay} ด่าน คะแนนจะถูกนำไปรวมกับคะแนนแบบทดสอบเพื่อจัดอันดับ Top 10
            </p>
          </div>
        </div>

        ${saveBannerHtml}

        <!-- Divided 4-KPI Summary -->
        <div class="metric-strip mg-result-metrics" style="box-shadow: none; border: 1px solid var(--border-subtle);">
          <div class="metric-cell">
            <span class="metric-label">คะแนนที่ได้รอบนี้</span>
            <span class="metric-value" style="color: var(--blue-600);">
              ${gameState.score} / ${maxScore}
            </span>
            <span class="metric-sub">ตอบถูก ${correctCount} ด่าน (ด่านละ +2)</span>
          </div>

          <div class="metric-cell">
            <span class="metric-label">เวลาที่ใช้จริง</span>
            <span class="metric-value">${window.AppUtils.formatDuration(gameState.finalTimeSec)}</span>
            <span class="metric-sub">คิดเป็น ${gameState.finalTimeSec} วินาที</span>
          </div>

          <div class="metric-cell">
            <span class="metric-label">สถิติสูงสุดของคุณใน ${esc(def.id)}</span>
            <span class="metric-value">${bestScore} / ${maxScore}</span>
            <span class="metric-sub">เวลาเร็วสุด ${window.AppUtils.formatDuration(bestTime)}</span>
          </div>

          <div class="metric-cell">
            <span class="metric-label">คะแนนสะสมรวมสุทธิ</span>
            <span class="metric-value" style="color: var(--status-pass-ink);">${grandTotal}</span>
            <span class="metric-sub">คะแนนรวมบน Leaderboard</span>
          </div>
        </div>

        <!-- Compact Round Review -->
        <div style="margin-top: 6px;">
          <h3 style="font-size: 0.96rem; font-weight: 600; margin-bottom: 10px;">
            เฉลยและสรุปผลรายด่าน (${def.roundsPerPlay} ด่าน)
          </h3>
          <div class="quiz-review-list">
            ${reviewHtml}
          </div>
        </div>

        <!-- Action Footer -->
        <div class="lesson-step-footer" style="margin-top: 10px;">
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <button type="button" class="btn-secondary" id="btn-mg-back-directory">
              กลับหน้ารวมบทเรียน
            </button>
            <button type="button" class="btn-secondary" data-nav-view="leaderboard">
              ดูอันดับ Top 10 Leaderboard
            </button>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <button type="button" class="btn-secondary" data-open-minigame="${esc(def.id)}">
              เล่นซ้ำเพื่อทำเวลาให้ไวขึ้น
            </button>
            ${nextActionHtml}
          </div>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     8. EVENT LISTENERS (MODAL, INTERACTIVE WORKBENCH, PADS & KEYBOARD 1–4)
     ========================================================================== */

  function bindMiniGameEvents() {
    document
      .getElementById("close-mg-rule-modal-btn")
      ?.addEventListener("click", closeRuleModal);
    document
      .getElementById("cancel-mg-rule-btn")
      ?.addEventListener("click", closeRuleModal);
    document
      .getElementById("btn-confirm-start-minigame")
      ?.addEventListener("click", () => {
        startMiniGame(pendingRuleGameId);
      });
    document.getElementById("minigame-rule-modal")?.addEventListener("click", (e) => {
      if (e.target && e.target.id === "minigame-rule-modal") {
        closeRuleModal();
      }
    });

    const ws = document.getElementById("minigame-workspace");
    if (ws) {
      ws.addEventListener("click", (e) => {
        const padBtn = e.target.closest("[data-mg-choice]");
        if (padBtn) {
          e.preventDefault();
          handleSelectChoice(Number(padBtn.getAttribute("data-mg-choice")));
          return;
        }

        // SFX Mute/Unmute Toggle
        const sfxBtn = e.target.closest("#btn-mg-sfx-toggle");
        if (sfxBtn) {
          e.preventDefault();
          sfxEnabled = !sfxEnabled;
          sfxBtn.innerHTML = renderSfxToggleIcon();
          return;
        }

        // Interactive Lab Controls inside Arena
        const labToggle = e.target.closest("[data-mg-lab-action]");
        if (labToggle && gameState && gameState.phase === "playing") {
          e.preventDefault();
          const act = labToggle.getAttribute("data-mg-lab-action");
          if (act === "toggle-signal") {
            gameState.labState.signalMode =
              gameState.labState.signalMode === "analog" ? "digital" : "analog";
          } else if (act === "toggle-scanner") {
            gameState.labState.scanMode =
              gameState.labState.scanMode === "2d" ? "1d" : "2d";
          } else if (act === "toggle-encoding") {
            gameState.labState.encodingSample =
              gameState.labState.encodingSample === "utf8" ? "ascii" : "utf8";
          }
          renderArenaWorkspace();
          return;
        }

        const rfMatBtn = e.target.closest("[data-mg-rf-mat]");
        if (rfMatBtn && gameState && gameState.phase === "playing") {
          e.preventDefault();
          gameState.labState.rfMaterial = rfMatBtn.getAttribute("data-mg-rf-mat") || "paper";
          renderArenaWorkspace();
          return;
        }

        if (
          e.target.closest("#btn-abort-minigame") ||
          e.target.closest("#btn-mg-back-directory")
        ) {
          e.preventDefault();
          stopActiveGame();
          window.LearningEngine?.openDirectory({
            unitNo: gameState?.gameDef?.afterUnitNo || 1
          });
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }

        if (e.target.closest("#btn-retry-save-minigame")) {
          e.preventDefault();
          persistMiniGameScore();
        }
      });

      // Live Biometric Threshold Slider Input inside G03
      ws.addEventListener("input", (e) => {
        if (e.target && e.target.id === "mg-bio-threshold-slider" && gameState) {
          const th = Number(e.target.value) || 75;
          gameState.labState.threshold = th;
          const farVal = Math.max(0.01, (100 - th) * 0.18).toFixed(2);
          const frrVal = Math.max(0.2, (th - 20) * 0.14).toFixed(2);
          const thEl = document.getElementById("mg-th-val");
          const farEl = document.getElementById("mg-far-readout");
          const frrEl = document.getElementById("mg-frr-readout");
          if (thEl) thEl.textContent = `${th}%`;
          if (farEl) farEl.textContent = `FAR (คนอื่นผ่าน): ${farVal}%`;
          if (frrEl) frrEl.textContent = `FRR (ปฏิเสธเจ้าของ): ${frrVal}%`;
        }
      });
    }

    document.addEventListener("keydown", (e) => {
      const ruleModal = document.getElementById("minigame-rule-modal");
      if (e.key === "Escape" && ruleModal && !ruleModal.classList.contains("hidden")) {
        closeRuleModal();
        return;
      }

      if (!gameState || gameState.phase !== "playing" || gameState.lockedInput) return;
      if (ruleModal && !ruleModal.classList.contains("hidden")) return;
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "1" || e.key === "2" || e.key === "3" || e.key === "4") {
        e.preventDefault();
        handleSelectChoice(Number(e.key) - 1);
      }
    });
  }

  document.addEventListener("DOMContentLoaded", bindMiniGameEvents);

  window.MiniGameEngine = {
    openRuleModal,
    closeRuleModal,
    startMiniGame,
    stopActiveGame,
    isMiniGameActive: () =>
      Boolean(
        gameState &&
          (gameState.phase === "playing" || gameState.phase === "result") &&
          !document.getElementById("minigame-workspace")?.classList.contains("hidden")
      ),
    getGameForMilestoneUnit(unitNo) {
      const num = Number(unitNo);
      return (
        Object.values(GAMES_CATALOG).find((g) => g.afterUnitNo === num) || null
      );
    },
    getGameMeta(id) {
      return GAMES_CATALOG[id] || null;
    },
    getCatalog: () => GAMES_CATALOG
  };
})();
