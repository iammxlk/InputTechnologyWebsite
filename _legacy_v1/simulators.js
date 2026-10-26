/**
 * ============================================================================
 * simulators.js — ห้องทดลองอุปกรณ์เสมือนจริงและเครื่องคำนวณทีละขั้นครบ 15 หน่วย
 * รายวิชา: เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์ (รหัสวิชา 21901-2017)
 * ระดับชั้น: ปวช.1 | ธีม: Neo-Brutalism (Stwedy) | Zero-Emoji Edition
 * ============================================================================
 * กฎเหล็ก:
 * - ห้ามใช้อิโมจิในโค้ดและป้ายข้อความเด็ดขาด ใช้ป้าย Typography และไอคอน SVG เส้นขอบดำแทน
 * - ทุกหน่วยการเรียนรู้ (หน่วยที่ 1 - 15) มี Interactive Simulator (Custom SVG + CSS/JS + Web Audio)
 * - หน้าที่มีการคำนวณ แสดงวิธีทำแบบ Step-by-Step ชัดเจนทีละขั้น
 * - เมื่อนักเรียนคลิกหรือทดลองใช้งานอุปกรณ์ในหน่วยนั้น ระบบจะเรียก notifyLabInteraction(unitId)
 *   เพื่อปลดล็อกปุ่มรับคะแนนอ่าน (+1 คะแนน) และเปิดให้ทำแบบทดสอบท้ายหน่วย 3 ข้อ (+3 คะแนน) ทันที
 * ============================================================================
 */

(function () {
  /**
   * สร้างเสียงเอฟเฟกต์ด้วย Web Audio API (เสียงติ๊ดสแกนเนอร์, เสียงคลิกปุ่ม, เสียงคลื่นความถี่)
   */
  function playSimSound(type = "beep") {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc = new OscillatorNode(ctx);
      const gain = new GainNode(ctx);
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "beep") {
        osc.type = "square";
        osc.frequency.setValueAtTime(1046.5, now);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "double_beep") {
        osc.type = "square";
        osc.frequency.setValueAtTime(987.77, now);
        osc.frequency.setValueAtTime(1318.5, now + 0.09);
        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === "error") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, now);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "click") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(620, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "shutter") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        osc.start(now);
        osc.stop(now + 0.09);
      }
    } catch (_) {
      // Ignore audio restriction if blocked
    }
  }

  /**
   * แจ้งไปยัง app.js ว่านักเรียนได้กดทดลองใช้อุปกรณ์ในหน่วยนี้แล้ว
   */
  function notifyLabInteraction(unitId) {
    if (typeof window.onUnitSimulatorInteracted === "function") {
      window.onUnitSimulatorInteracted(Number(unitId));
    }
  }

  /**
   * ฟังก์ชันหลักที่ app.js เรียกใช้เมื่อเปิดหน้าต่างบทเรียนแต่ละหน่วย (Step 3)
   */
  window.renderUnitSimulator = function (unitId, container) {
    if (!container) return;
    const id = Number(unitId);

    switch (id) {
      case 1:
        renderUnit01IpoLab(container, id);
        break;
      case 2:
        renderUnit02GigoSpeedLab(container, id);
        break;
      case 3:
        renderUnit03KeyboardMouseLab(container, id);
        break;
      case 4:
        renderUnit04CameraMicLab(container, id);
        break;
      case 5:
        renderUnit05BarcodeCcdImagerLab(container, id);
        break;
      case 6:
        renderUnit06WirelessBatchScannerLab(container, id);
        break;
      case 7:
        renderUnit07QrDamageReedSolomonLab(container, id);
        break;
      case 8:
        renderUnit08QrFamilyDynamicLab(container, id);
        break;
      case 9:
        renderUnit09CheckDigitCalculatorLab(container, id);
        break;
      case 10:
        renderUnit10CryptoHashSaltLab(container, id);
        break;
      case 11:
        renderUnit11RfidReaderLab(container, id);
        break;
      case 12:
        renderUnit12BiometricMinutiaeThresholdLab(container, id);
        break;
      case 13:
        renderUnit13CsvJsonPowerQueryLab(container, id);
        break;
      case 14:
        renderUnit14Utf8ByteCalculatorLab(container, id);
        break;
      case 15:
        renderUnit15CompressionRleLab(container, id);
        break;
      default:
        renderUnit01IpoLab(container, id);
    }
  };

  /* ==========================================================================
     UNIT 1: วงจร IPO & ประเภทข้อมูล 5 ลักษณะ
     ========================================================================== */
  function renderUnit01IpoLab(container, unitId) {
    const samples = [
      {
        code: "NUMERIC",
        type: "Numeric (ตัวเลข)",
        raw: "คะแนนดิบ: 78, 82, 95",
        proc: "บวกกันแล้วหารด้วย 3 (หาค่าเฉลี่ย)",
        info: "สารสนเทศ: คะแนนเฉลี่ย = 85.00 คะแนน (เกรด A)"
      },
      {
        code: "TEXT",
        type: "Text (ตัวอักษร)",
        raw: "รหัส: 67201010012 ชื่อ: สมชาย",
        proc: "จัดรูปแบบตารางทะเบียนนักเรียน",
        info: "สารสนเทศ: บัตรประจำตัวนักศึกษา ปวช.1 แผนกไอที"
      },
      {
        code: "IMAGE",
        type: "Image (ภาพ)",
        raw: "พิกเซลภาพใบเสร็จที่ถ่ายจากกล้อง",
        proc: "ใช้ OCR แกะตัวอักษรและรวมยอดเงิน",
        info: "สารสนเทศ: รายงานค่าใช้จ่ายประจำวัน 450 บาท"
      },
      {
        code: "AUDIO",
        type: "Audio (เสียง)",
        raw: "คลื่นเสียงพูด 'เปิดไฟห้องคอม'",
        proc: "แปลงเสียงผ่าน ADC + วิเคราะห์คำสั่งเสียง",
        info: "สารสนเทศ: สั่งสวิตช์สมาร์ตโฮมเปิดไฟสำเร็จ"
      }
    ];

    container.innerHTML = `
      <div class="space-y-4">
        <p class="font-thai text-xs sm:text-sm text-zinc-700">
          <strong>ลองกดเลือกชนิดข้อมูลดิบ (Raw Data)</strong> ด้านล่างเพื่อเดินเครื่องวงจร <strong>INPUT &rarr; PROCESS &rarr; OUTPUT</strong> ดูว่าข้อมูลดิบเปลี่ยนเป็นสารสนเทศได้อย่างไร:
        </p>

        <div class="flex flex-wrap gap-2">
          ${samples
            .map(
              (s, i) => `
            <button type="button" data-ipo-idx="${i}" class="brutal-btn ${
                i === 0 ? "bg-amber-300" : "bg-white hover:bg-amber-100"
              } px-3.5 py-2 rounded-xl text-xs sm:text-sm font-thai">
              <span class="font-notch font-bold text-[11px] bg-zinc-900 text-white px-1.5 py-0.5 rounded">${s.code}</span>
              ทดลอง: ${s.type}
            </button>
          `
            )
            .join("")}
        </div>

        <!-- SVG IPO Pipeline Diagram -->
        <div class="bg-white brutal-border rounded-2xl p-4">
          <svg viewBox="0 0 680 130" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
            <line id="ipo-pipe-1" x1="200" y1="65" x2="255" y2="65" stroke="#000" stroke-width="6" stroke-dasharray="8 6"/>
            <line id="ipo-pipe-2" x1="425" y1="65" x2="480" y2="65" stroke="#000" stroke-width="6" stroke-dasharray="8 6"/>

            <rect x="12" y="18" width="188" height="94" rx="14" fill="#A7F3D0" stroke="#000" stroke-width="3"/>
            <text x="106" y="45" text-anchor="middle" font-family="Stack Sans Notch, sans-serif" font-weight="700" font-size="14" fill="#000">1. INPUT (RAW DATA)</text>
            <text id="ipo-svg-raw" x="106" y="75" text-anchor="middle" font-family="Mitr, sans-serif" font-size="11" fill="#000">คลิกปุ่มด้านบนเพื่อป้อนข้อมูล</text>

            <rect x="255" y="18" width="170" height="94" rx="14" fill="#FDE047" stroke="#000" stroke-width="3"/>
            <text x="340" y="45" text-anchor="middle" font-family="Stack Sans Notch, sans-serif" font-weight="700" font-size="14" fill="#000">2. CPU PROCESS</text>
            <text id="ipo-svg-proc" x="340" y="75" text-anchor="middle" font-family="Mitr, sans-serif" font-size="11" fill="#000">รอประมวลผล...</text>

            <rect x="480" y="18" width="188" height="94" rx="14" fill="#7DD3FC" stroke="#000" stroke-width="3"/>
            <text x="574" y="45" text-anchor="middle" font-family="Stack Sans Notch, sans-serif" font-weight="700" font-size="14" fill="#000">3. OUTPUT (INFO)</text>
            <text id="ipo-svg-info" x="574" y="75" text-anchor="middle" font-family="Mitr, sans-serif" font-size="11" fill="#000">รอแสดงผลสารสนเทศ...</text>
          </svg>

          <div id="ipo-detail-banner" class="mt-3 bg-emerald-100 border-2 border-black rounded-xl p-3 font-thai text-xs sm:text-sm">
            [SYSTEM READY] กดปุ่มเลือกประเภทข้อมูลด้านบนเพื่อเริ่มจำลองการประมวลผลได้เลย
          </div>
        </div>
      </div>
    `;

    const rawText = container.querySelector("#ipo-svg-raw");
    const procText = container.querySelector("#ipo-svg-proc");
    const infoText = container.querySelector("#ipo-svg-info");
    const banner = container.querySelector("#ipo-detail-banner");
    const buttons = container.querySelectorAll("[data-ipo-idx]");

    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-ipo-idx"));
        const item = samples[idx];
        playSimSound("double_beep");
        notifyLabInteraction(unitId);

        buttons.forEach((b) => {
          b.className = `brutal-btn ${
            b === btn ? "bg-amber-300" : "bg-white hover:bg-amber-100"
          } px-3.5 py-2 rounded-xl text-xs sm:text-sm font-thai`;
        });

        if (rawText) rawText.textContent = item.raw.slice(0, 24);
        if (procText) procText.textContent = "กำลังคำนวณ...";
        if (infoText) infoText.textContent = "...";

        setTimeout(() => {
          if (procText) procText.textContent = item.proc.slice(0, 22);
          if (infoText) infoText.textContent = "แปลงสำเร็จ [OK]";
          if (banner) {
            banner.innerHTML = `<span class="font-notch font-bold bg-zinc-900 text-white px-2 py-0.5 rounded text-xs mr-1">IPO RESULT</span> <strong>(${item.type}):</strong> รับ <em>"${item.raw}"</em> &rarr; ประมวลผล <em>"${item.proc}"</em> &rarr; ได้ <strong>${item.info}</strong>`;
          }
        }, 220);
      });
    });
  }

  /* ==========================================================================
     UNIT 2: หลักการ GIGO & ทดสอบความไว Manual vs Automatic Input
     ========================================================================== */
  function renderUnit02GigoSpeedLab(container, unitId) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white brutal-border rounded-2xl p-4 space-y-2.5">
            <span class="font-notch font-bold text-xs bg-zinc-200 px-2.5 py-0.5 rounded border border-black">
              1. MANUAL ENTRY (พิมพ์ด้วยมือ)
            </span>
            <p class="font-thai text-xs text-zinc-700">
              ลองพิมพ์รหัสสินค้า <code class="font-bold bg-amber-200 px-1 rounded">8850999321004</code> ลงในช่อง หรือกดปุ่มจำลองป้อนข้อมูลผิด (GIGO):
            </p>
            <input id="u2-manual-input" type="text" placeholder="พิมพ์ 8850999321004" class="brutal-input w-full px-3 py-2 rounded-xl font-notch text-sm" />
            <div class="flex flex-wrap gap-2">
              <button id="u2-manual-check-btn" type="button" class="brutal-btn bg-amber-300 hover:bg-amber-200 px-3 py-1.5 rounded-xl text-xs font-thai">
                [KEY] ส่งข้อมูลที่พิมพ์มือ
              </button>
              <button id="u2-gigo-btn" type="button" class="brutal-btn bg-red-200 hover:bg-red-300 px-3 py-1.5 rounded-xl text-xs font-thai">
                [GIGO] ลองป้อนข้อมูลขยะ
              </button>
            </div>
          </div>

          <div class="bg-emerald-50 brutal-border rounded-2xl p-4 space-y-2.5 flex flex-col justify-between">
            <div>
              <span class="font-notch font-bold text-xs bg-emerald-400 px-2.5 py-0.5 rounded border border-black">
                2. AUTOMATIC INPUT (AIDC SCAN)
              </span>
              <p class="font-thai text-xs text-zinc-700 mt-1.5">
                ใช้หัวอ่านสแกนรหัสสินค้า <code class="font-bold">8850999321004</code> เข้าเครื่องอัตโนมัติในคลิกเดียว:
              </p>
            </div>
            <button id="u2-auto-scan-btn" type="button" class="w-full brutal-btn bg-emerald-400 hover:bg-emerald-300 py-3 rounded-xl text-sm font-thai">
              [SCAN] กดสแกนอัตโนมัติ (ใช้เวลา 0.05 วินาที)
            </button>
          </div>
        </div>

        <div id="u2-result-box" class="bg-white brutal-border rounded-xl p-3.5 font-thai text-xs sm:text-sm">
          [TIP] ลองกดเทียบระหว่าง <strong>พิมพ์ด้วยมือ</strong>, <strong>ป้อนข้อมูลขยะ (GIGO)</strong> และ <strong>กดสแกนอัตโนมัติ</strong> ดูได้เลย
        </div>
      </div>
    `;

    const manualInput = container.querySelector("#u2-manual-input");
    const manualBtn = container.querySelector("#u2-manual-check-btn");
    const gigoBtn = container.querySelector("#u2-gigo-btn");
    const autoBtn = container.querySelector("#u2-auto-scan-btn");
    const resultBox = container.querySelector("#u2-result-box");

    if (manualBtn) {
      manualBtn.addEventListener("click", () => {
        notifyLabInteraction(unitId);
        const val = (manualInput ? manualInput.value : "").trim();
        if (val === "8850999321004") {
          playSimSound("beep");
          resultBox.className = "bg-emerald-100 brutal-border rounded-xl p-3.5 font-thai text-xs sm:text-sm";
          resultBox.innerHTML = "<span class='font-notch font-bold bg-emerald-400 px-2 py-0.5 rounded border border-black text-xs mr-1'>PASS</span> <strong>Manual Input ถูกต้อง:</strong> แต่ต้องใช้เวลาพิมพ์ทีละตัวถึง 13 หลัก ถ้ามีสินค้า 1,000 ชิ้นจะล่าช้ามาก";
        } else {
          playSimSound("error");
          resultBox.className = "bg-red-100 brutal-border rounded-xl p-3.5 font-thai text-xs sm:text-sm";
          resultBox.innerHTML = `<span class="font-notch font-bold bg-red-400 text-white px-2 py-0.5 rounded border border-black text-xs mr-1">ERROR</span> <strong>เกิด Human Error:</strong> คุณพิมพ์ว่า <code>"${val || "(ว่างเปล่า)"}"</code> ซึ่งไม่ตรงกับ <code>8850999321004</code> เห็นได้ชัดว่าการพิมพ์มือมีโอกาสพลาดได้ง่าย`;
        }
      });
    }

    if (gigoBtn) {
      gigoBtn.addEventListener("click", () => {
        notifyLabInteraction(unitId);
        playSimSound("error");
        if (manualInput) manualInput.value = "ราคา -9999 บาท";
        resultBox.className = "bg-amber-200 brutal-border rounded-xl p-3.5 font-thai text-xs sm:text-sm";
        resultBox.innerHTML = "<span class='font-notch font-bold bg-zinc-900 text-white px-2 py-0.5 rounded text-xs mr-1'>GIGO ALERT</span> <strong>ตัวอย่าง Garbage In, Garbage Out:</strong> ป้อนราคาติดลบ <code>-9999 บาท</code> เข้าไป ระบบจึงคำนวณยอดขายรวมติดลบผิดพลาดทั้งตาราง";
      });
    }

    if (autoBtn) {
      autoBtn.addEventListener("click", () => {
        notifyLabInteraction(unitId);
        playSimSound("double_beep");
        if (manualInput) manualInput.value = "8850999321004";
        resultBox.className = "bg-emerald-200 brutal-border rounded-xl p-3.5 font-thai text-xs sm:text-sm";
        resultBox.innerHTML = "<span class='font-notch font-bold bg-emerald-400 px-2 py-0.5 rounded border border-black text-xs mr-1'>AIDC 0.05s</span> <strong>Automatic Input สำเร็จทันที:</strong> ได้รหัส <code>8850999321004</code> (น้ำดื่มตราไอที 15 บาท) แม่นยำ 100% ไม่ต้องกลัวพิมพ์ผิด";
      });
    }
  }

  /* ==========================================================================
     UNIT 3: คีย์บอร์ด (Key Matrix & Scan Code) และเมาส์ (DPI Switcher)
     ========================================================================== */
  function renderUnit03KeyboardMouseLab(container, unitId) {
    const keysData = [
      { label: "A (ฟ)", row: 1, col: 0, scanCode: "0x1E", bin: "0001 1110" },
      { label: "S (ห)", row: 1, col: 1, scanCode: "0x1F", bin: "0001 1111" },
      { label: "D (ก)", row: 1, col: 2, scanCode: "0x20", bin: "0010 0000" },
      { label: "SPACE", row: 2, col: 1, scanCode: "0x39", bin: "0011 1001" },
      { label: "ENTER", row: 0, col: 2, scanCode: "0x1C", bin: "0001 1100" }
    ];

    container.innerHTML = `
      <div class="space-y-5">
        <div class="bg-white brutal-border rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="font-notch font-bold text-xs bg-emerald-400 px-2.5 py-0.5 rounded border border-black">
              LAB 3.1 • KEYBOARD MATRIX & SCAN CODE
            </span>
            <span class="font-thai text-xs text-zinc-600">
              กดปุ่มคีย์บอร์ดเพื่อดูเส้นทางไฟวิ่งผ่านตาราง Key Matrix
            </span>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div class="lg:col-span-5 space-y-2">
              <p class="font-thai text-xs font-semibold">กดปุ่มคีย์บอร์ดจำลองด้านล่าง:</p>
              <div class="flex flex-wrap gap-2">
                ${keysData
                  .map(
                    (k, idx) => `
                  <button type="button" data-key-idx="${idx}" class="brutal-btn bg-amber-300 hover:bg-amber-200 px-3.5 py-2.5 rounded-xl font-notch font-bold text-xs sm:text-sm">
                    [KEY] ${k.label}
                  </button>
                `
                  )
                  .join("")}
              </div>
              <div id="u3-scancode-screen" class="bg-zinc-950 text-emerald-400 border-2 border-black rounded-xl p-3 font-notch text-xs space-y-1">
                <div>KEY PRESSED: <span class="text-white">รอการกดปุ่ม...</span></div>
                <div>SCAN CODE: <span class="text-amber-300 font-bold">--</span></div>
                <div>BINARY: <span class="text-sky-300">--</span></div>
              </div>
            </div>

            <div class="lg:col-span-7 bg-zinc-50 border-2 border-black rounded-xl p-3">
              <svg viewBox="0 0 420 175" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
                <text x="12" y="20" font-family="Stack Sans Notch, sans-serif" font-weight="700" font-size="12" fill="#000">KEY MATRIX CIRCUIT (ROW x COL)</text>

                <line id="u3-row-0" x1="55" y1="50" x2="290" y2="50" stroke="#71717A" stroke-width="4"/>
                <line id="u3-row-1" x1="55" y1="95" x2="290" y2="95" stroke="#71717A" stroke-width="4"/>
                <line id="u3-row-2" x1="55" y1="140" x2="290" y2="140" stroke="#71717A" stroke-width="4"/>
                <text x="16" y="54" font-family="Stack Sans Notch" font-size="11" font-weight="700">ROW 0</text>
                <text x="16" y="99" font-family="Stack Sans Notch" font-size="11" font-weight="700">ROW 1</text>
                <text x="16" y="144" font-family="Stack Sans Notch" font-size="11" font-weight="700">ROW 2</text>

                <line id="u3-col-0" x1="105" y1="30" x2="105" y2="160" stroke="#71717A" stroke-width="4"/>
                <line id="u3-col-1" x1="180" y1="30" x2="180" y2="160" stroke="#71717A" stroke-width="4"/>
                <line id="u3-col-2" x1="255" y1="30" x2="255" y2="160" stroke="#71717A" stroke-width="4"/>
                <text x="90" y="24" font-family="Stack Sans Notch" font-size="11" font-weight="700">COL 0</text>
                <text x="165" y="24" font-family="Stack Sans Notch" font-size="11" font-weight="700">COL 1</text>
                <text x="240" y="24" font-family="Stack Sans Notch" font-size="11" font-weight="700">COL 2</text>

                <circle id="u3-matrix-node" cx="105" cy="95" r="11" fill="#34D399" stroke="#000" stroke-width="3" opacity="0"/>

                <rect x="305" y="55" width="102" height="80" rx="10" fill="#FDE047" stroke="#000" stroke-width="3"/>
                <text x="356" y="85" text-anchor="middle" font-family="Stack Sans Notch" font-weight="700" font-size="11" fill="#000">MCU CHIP</text>
                <text id="u3-chip-code" x="356" y="110" text-anchor="middle" font-family="Stack Sans Notch" font-weight="700" font-size="14" fill="#000">IDLE</text>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-amber-50 brutal-border rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <span class="font-notch font-bold text-xs bg-amber-300 px-2.5 py-0.5 rounded border border-black">
              LAB 3.2 • MOUSE DPI SPEED SWITCHER
            </span>
            <span id="u3-dpi-badge" class="font-notch font-bold text-xs bg-zinc-900 text-white px-2.5 py-0.5 rounded">
              CURRENT: 800 DPI
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span class="font-thai text-xs font-semibold">สวิตช์ปรับ DPI เมาส์:</span>
            <button type="button" data-dpi="400" class="u3-dpi-btn brutal-btn bg-white px-3 py-1 rounded-lg font-notch text-xs">400 DPI (ช้า-แม่นยำ)</button>
            <button type="button" data-dpi="800" class="u3-dpi-btn brutal-btn bg-amber-300 px-3 py-1 rounded-lg font-notch text-xs">800 DPI (มาตรฐาน)</button>
            <button type="button" data-dpi="1600" class="u3-dpi-btn brutal-btn bg-white px-3 py-1 rounded-lg font-notch text-xs">1600 DPI (ไว)</button>
            <button type="button" data-dpi="3200" class="u3-dpi-btn brutal-btn bg-white px-3 py-1 rounded-lg font-notch text-xs">3200 DPI (ไวสูงสุด)</button>
          </div>

          <div class="space-y-1.5">
            <label class="block font-thai text-xs text-zinc-700">
              ลองเลื่อนแถบจำลองการขยับเมาส์บนโต๊ะเพียงเล็กน้อย เพื่อดูว่าลูกศรบนจอวิ่งไปไกลแค่ไหน:
            </label>
            <input id="u3-mouse-hand-slider" type="range" min="0" max="25" value="10" class="brutal-slider" />
            <div class="w-full h-10 bg-white brutal-border rounded-xl relative overflow-hidden flex items-center px-3">
              <div id="u3-cursor-pointer" class="px-2.5 py-0.5 rounded-md bg-emerald-400 border-2 border-black font-notch font-bold text-xs transition-transform duration-150" style="transform: translateX(40px);">
                [CURSOR]
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const screen = container.querySelector("#u3-scancode-screen");
    const chipCode = container.querySelector("#u3-chip-code");
    const nodeCircle = container.querySelector("#u3-matrix-node");
    const rowY = [50, 95, 140];
    const colX = [105, 180, 255];

    container.querySelectorAll("[data-key-idx]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const k = keysData[Number(btn.getAttribute("data-key-idx"))];
        playSimSound("click");
        notifyLabInteraction(unitId);

        [0, 1, 2].forEach((i) => {
          const rEl = container.querySelector(`#u3-row-${i}`);
          const cEl = container.querySelector(`#u3-col-${i}`);
          if (rEl) rEl.setAttribute("stroke", i === k.row ? "#EF4444" : "#71717A");
          if (cEl) cEl.setAttribute("stroke", i === k.col ? "#EF4444" : "#71717A");
        });

        if (nodeCircle) {
          nodeCircle.setAttribute("cx", String(colX[k.col]));
          nodeCircle.setAttribute("cy", String(rowY[k.row]));
          nodeCircle.setAttribute("opacity", "1");
        }
        if (chipCode) chipCode.textContent = k.scanCode;
        if (screen) {
          screen.innerHTML = `
            <div>KEY PRESSED: <span class="text-white font-bold">${k.label}</span> (Row ${k.row}, Col ${k.col})</div>
            <div>SCAN CODE: <span class="text-amber-300 font-bold">${k.scanCode}</span></div>
            <div>BINARY: <span class="text-sky-300">${k.bin}</span></div>
          `;
        }
      });
    });

    let currentDpi = 800;
    const dpiBadge = container.querySelector("#u3-dpi-badge");
    const handSlider = container.querySelector("#u3-mouse-hand-slider");
    const cursorEl = container.querySelector("#u3-cursor-pointer");

    const updateCursorPos = () => {
      const handDist = Number(handSlider ? handSlider.value : 10);
      const multiplier = currentDpi / 400;
      const px = Math.min(260, Math.round(handDist * multiplier * 3.2));
      if (cursorEl) {
        cursorEl.style.transform = `translateX(${px}px)`;
        cursorEl.textContent = `[CURSOR] ${px} px (${currentDpi} DPI)`;
      }
    };

    container.querySelectorAll(".u3-dpi-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentDpi = Number(btn.getAttribute("data-dpi"));
        playSimSound("click");
        notifyLabInteraction(unitId);
        if (dpiBadge) dpiBadge.textContent = `CURRENT: ${currentDpi} DPI`;
        container.querySelectorAll(".u3-dpi-btn").forEach((b) => {
          b.className = `u3-dpi-btn brutal-btn ${
            b === btn ? "bg-amber-300" : "bg-white"
          } px-3 py-1 rounded-lg font-notch text-xs`;
        });
        updateCursorPos();
      });
    });

    if (handSlider) {
      handSlider.addEventListener("input", () => {
        notifyLabInteraction(unitId);
        updateCursorPos();
      });
    }
  }

  /* ==========================================================================
     UNIT 4: กล้อง CMOS (RGB Pixel Grid) & ไมโครโฟน (Diaphragm + ADC)
     ========================================================================== */
  function renderUnit04CameraMicLab(container, unitId) {
    const scenes = [
      {
        name: "SCENE 01: ภาพต้นไม้สีเขียว",
        pixels: [
          ["#38BDF8", "#34D399", "#38BDF8"],
          ["#34D399", "#10B981", "#34D399"],
          ["#FDE047", "#92400E", "#FDE047"]
        ],
        rgbSample: "R: 16, G: 185, B: 129 (#10B981)"
      },
      {
        name: "SCENE 02: ภาพพระอาทิตย์ตก",
        pixels: [
          ["#FB923C", "#EF4444", "#FB923C"],
          ["#FDE047", "#F97316", "#FDE047"],
          ["#1E3A8A", "#1D4ED8", "#1E3A8A"]
        ],
        rgbSample: "R: 239, G: 68, B: 68 (#EF4444)"
      }
    ];

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white brutal-border rounded-2xl p-4 space-y-3">
          <span class="font-notch font-bold text-xs bg-emerald-400 px-2.5 py-0.5 rounded border border-black">
            LAB 4.1 • CMOS IMAGE SENSOR (RGB PIXELS)
          </span>
          <p class="font-thai text-xs text-zinc-700">
            กดปุ่มชัตเตอร์เพื่อรับแสงผ่านเลนส์เข้าสู่ตารางเซนเซอร์ CMOS แล้วแปลงเป็นค่าสี RGB:
          </p>

          <div id="u4-cmos-grid" class="grid grid-cols-3 gap-2 max-w-[180px] mx-auto p-2.5 bg-zinc-900 brutal-border rounded-xl">
            ${scenes[0].pixels
              .flat()
              .map(
                (color) => `
              <div class="h-11 rounded-lg border-2 border-black transition-colors duration-300" style="background-color: ${color}"></div>
            `
              )
              .join("")}
          </div>

          <div id="u4-cmos-readout" class="bg-zinc-100 border-2 border-black rounded-xl p-2.5 font-notch text-xs text-center">
            PIXEL RGB: ${scenes[0].rgbSample}
          </div>

          <button id="u4-shutter-btn" type="button" class="w-full brutal-btn bg-amber-300 hover:bg-amber-200 py-2.5 rounded-xl text-xs sm:text-sm font-thai">
            [SHUTTER] กดปุ่มชัตเตอร์ถ่ายภาพ (สลับซีนรับแสง)
          </button>
        </div>

        <div class="bg-white brutal-border rounded-2xl p-4 space-y-3 flex flex-col justify-between">
          <div class="space-y-2">
            <span class="font-notch font-bold text-xs bg-sky-300 px-2.5 py-0.5 rounded border border-black">
              LAB 4.2 • MICROPHONE DIAPHRAGM & ADC
            </span>
            <p class="font-thai text-xs text-zinc-700">
              กดปุ่มส่งเสียงพูดเพื่อดูแผ่น Diaphragm สั่นและแปลงคลื่นเสียง Analog เป็นรหัสฐานสองผ่านวงจร ADC:
            </p>

            <svg viewBox="0 0 320 110" class="w-full h-auto bg-zinc-950 rounded-xl border-2 border-black p-2">
              <rect id="u4-diaphragm" x="18" y="25" width="12" height="60" rx="6" fill="#FDE047" stroke="#000" stroke-width="2"/>
              <text x="24" y="18" text-anchor="middle" font-family="Stack Sans Notch" font-size="9" fill="#FDE047">MIC</text>

              <path id="u4-analog-wave" d="M 42 55 Q 62 20, 82 55 T 122 55 T 162 55" fill="none" stroke="#34D399" stroke-width="3"/>
              <text x="100" y="98" text-anchor="middle" font-family="Stack Sans Notch" font-size="10" fill="#34D399">ANALOG WAVE</text>

              <rect x="175" y="30" width="52" height="50" rx="8" fill="#38BDF8" stroke="#000" stroke-width="2"/>
              <text x="201" y="59" text-anchor="middle" font-family="Stack Sans Notch" font-weight="700" font-size="12" fill="#000">ADC</text>

              <text id="u4-adc-bits" x="275" y="52" text-anchor="middle" font-family="Stack Sans Notch" font-weight="700" font-size="12" fill="#FDE047">010110</text>
              <text x="275" y="72" text-anchor="middle" font-family="Stack Sans Notch" font-size="9" fill="#FFF">DIGITAL</text>
            </svg>

            <div id="u4-mic-status" class="bg-sky-50 border-2 border-black rounded-xl p-2.5 font-thai text-xs">
              สถานะไมค์: รอรับคลื่นเสียง...
            </div>
          </div>

          <button id="u4-mic-btn" type="button" class="w-full brutal-btn bg-emerald-400 hover:bg-emerald-300 py-2.5 rounded-xl text-xs sm:text-sm font-thai">
            [VOICE INPUT] กดส่งเสียงพูด "สวัสดี ปวช.1" เข้าไมโครโฟน
          </button>
        </div>
      </div>
    `;

    let sceneIdx = 0;
    const shutterBtn = container.querySelector("#u4-shutter-btn");
    const cmosGrid = container.querySelector("#u4-cmos-grid");
    const cmosReadout = container.querySelector("#u4-cmos-readout");

    if (shutterBtn) {
      shutterBtn.addEventListener("click", () => {
        sceneIdx = (sceneIdx + 1) % scenes.length;
        const sc = scenes[sceneIdx];
        playSimSound("shutter");
        notifyLabInteraction(unitId);

        if (cmosGrid) {
          cmosGrid.innerHTML = sc.pixels
            .flat()
            .map(
              (c) => `<div class="h-11 rounded-lg border-2 border-black transition-transform duration-300 scale-95" style="background-color: ${c}"></div>`
            )
            .join("");
        }
        if (cmosReadout) {
          cmosReadout.textContent = `${sc.name} • ${sc.rgbSample}`;
        }
      });
    }

    const micBtn = container.querySelector("#u4-mic-btn");
    const micStatus = container.querySelector("#u4-mic-status");
    const adcBits = container.querySelector("#u4-adc-bits");
    const diaphragm = container.querySelector("#u4-diaphragm");

    if (micBtn) {
      micBtn.addEventListener("click", () => {
        playSimSound("double_beep");
        notifyLabInteraction(unitId);
        const randomBits = Array.from({ length: 8 }, () => (Math.random() > 0.5 ? "1" : "0")).join("");
        if (adcBits) adcBits.textContent = randomBits;
        if (diaphragm) {
          diaphragm.setAttribute("x", "22");
          setTimeout(() => diaphragm.setAttribute("x", "18"), 200);
        }
        if (micStatus) {
          micStatus.innerHTML = `<span class="font-notch font-bold bg-emerald-400 px-1.5 py-0.5 rounded border border-black text-[11px] mr-1">ADC OK</span> <strong>แปลงเสียงสำเร็จ:</strong> แผ่น Diaphragm สั่น &rarr; วงจร ADC สุ่มวัดค่าคลื่นไฟฟ้าแปลงเป็นเลขฐานสอง <code class="font-notch font-bold">${randomBits}</code>`;
        }
      });
    }
  }

  /* ==========================================================================
     UNIT 5: ปืนสแกนเนอร์ยิงบาร์โค้ด EAN-13 (CCD Linear vs 2D Area CMOS)
     ========================================================================== */
  function renderUnit05BarcodeCcdImagerLab(container, unitId) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap gap-2">
            <button type="button" data-u5-scanner="ccd" class="u5-scanner-btn brutal-btn bg-amber-300 px-3.5 py-1.5 rounded-xl text-xs font-thai">
              [1D CCD] หัวอ่าน 1D CCD Linear Imager
            </button>
            <button type="button" data-u5-scanner="cmos2d" class="u5-scanner-btn brutal-btn bg-white px-3.5 py-1.5 rounded-xl text-xs font-thai">
              [2D CMOS] หัวอ่าน 2D Area CMOS (แบบถ่ายภาพ)
            </button>
          </div>

          <div class="flex flex-wrap gap-2">
            <button type="button" data-u5-target="paper" class="u5-target-btn brutal-btn bg-emerald-300 px-3 py-1.5 rounded-xl text-xs font-thai">
              [PAPER] ป้ายกระดาษ EAN-13
            </button>
            <button type="button" data-u5-target="phone" class="u5-target-btn brutal-btn bg-white px-3 py-1.5 rounded-xl text-xs font-thai">
              [SCREEN] บาร์โค้ดบนหน้าจอมือถือ
            </button>
          </div>
        </div>

        <div class="bg-white brutal-border rounded-2xl p-4 relative overflow-hidden">
          <div id="u5-laser-overlay" class="laser-line hidden"></div>
          <svg viewBox="0 0 600 150" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
            <g transform="translate(20, 20)">
              <path d="M15 20 H110 L125 55 H65 L80 110 H40 L25 55 H15 Z" fill="#34D399" stroke="#000" stroke-width="3.5" stroke-linejoin="round"/>
              <rect x="110" y="24" width="18" height="26" fill="#000"/>
              <rect x="62" y="56" width="16" height="18" rx="3" fill="#EF4444" stroke="#000" stroke-width="2"/>
              <text x="65" y="14" font-family="Stack Sans Notch" font-weight="700" font-size="11" fill="#000" id="u5-gun-label">1D CCD SCANNER</text>
            </g>

            <polygon id="u5-svg-beam" points="148,56 355,20 355,125" fill="rgba(239, 68, 68, 0.22)" stroke="#EF4444" stroke-width="2" stroke-dasharray="6 4" opacity="0"/>

            <g transform="translate(355, 16)">
              <rect id="u5-target-bg" x="0" y="0" width="220" height="118" rx="14" fill="#FAFAFA" stroke="#000" stroke-width="3"/>
              <g transform="translate(28, 18)">
                <rect x="0" y="0" width="4" height="62" fill="#000"/>
                <rect x="8" y="0" width="4" height="62" fill="#000"/>
                <rect x="18" y="0" width="8" height="52" fill="#000"/>
                <rect x="32" y="0" width="3" height="52" fill="#000"/>
                <rect x="40" y="0" width="6" height="52" fill="#000"/>
                <rect x="52" y="0" width="10" height="52" fill="#000"/>
                <rect x="68" y="0" width="4" height="52" fill="#000"/>
                <rect x="78" y="0" width="4" height="62" fill="#000"/>
                <rect x="86" y="0" width="4" height="62" fill="#000"/>
                <rect x="96" y="0" width="8" height="52" fill="#000"/>
                <rect x="110" y="0" width="3" height="52" fill="#000"/>
                <rect x="118" y="0" width="7" height="52" fill="#000"/>
                <rect x="130" y="0" width="5" height="52" fill="#000"/>
                <rect x="142" y="0" width="4" height="52" fill="#000"/>
                <rect x="152" y="0" width="4" height="62" fill="#000"/>
                <rect x="160" y="0" width="4" height="62" fill="#000"/>
                <text x="82" y="78" text-anchor="middle" font-family="Stack Sans Notch" font-weight="700" font-size="14" fill="#000">8 850123 456788</text>
              </g>
            </g>
          </svg>

          <div class="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div id="u5-scan-output" class="flex-1 bg-zinc-100 border-2 border-black rounded-xl p-3 font-thai text-xs sm:text-sm">
              กดปุ่ม <strong>"ยิงลำแสงสแกนบาร์โค้ด"</strong> เพื่อทดสอบการอ่านรหัส EAN-13
            </div>
            <button id="u5-fire-btn" type="button" class="brutal-btn bg-amber-300 hover:bg-amber-200 px-5 py-3 rounded-xl text-sm font-thai shrink-0">
              [TRIGGER] ยิงลำแสงสแกนบาร์โค้ด
            </button>
          </div>
        </div>
      </div>
    `;

    let scannerType = "ccd";
    let targetType = "paper";

    const gunLabel = container.querySelector("#u5-gun-label");
    const svgBeam = container.querySelector("#u5-svg-beam");
    const targetBg = container.querySelector("#u5-target-bg");
    const output = container.querySelector("#u5-scan-output");
    const fireBtn = container.querySelector("#u5-fire-btn");

    container.querySelectorAll(".u5-scanner-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        scannerType = btn.getAttribute("data-u5-scanner");
        playSimSound("click");
        notifyLabInteraction(unitId);
        if (gunLabel) {
          gunLabel.textContent = scannerType === "ccd" ? "1D CCD LINEAR" : "2D AREA CMOS";
        }
        container.querySelectorAll(".u5-scanner-btn").forEach((b) => {
          b.className = `u5-scanner-btn brutal-btn ${
            b === btn ? "bg-amber-300" : "bg-white"
          } px-3.5 py-1.5 rounded-xl text-xs font-thai`;
        });
      });
    });

    container.querySelectorAll(".u5-target-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        targetType = btn.getAttribute("data-u5-target");
        playSimSound("click");
        notifyLabInteraction(unitId);
        if (targetBg) {
          targetBg.setAttribute("fill", targetType === "phone" ? "#E0F2FE" : "#FAFAFA");
        }
        container.querySelectorAll(".u5-target-btn").forEach((b) => {
          b.className = `u5-target-btn brutal-btn ${
            b === btn ? "bg-emerald-300" : "bg-white"
          } px-3 py-1.5 rounded-xl text-xs font-thai`;
        });
      });
    });

    if (fireBtn) {
      fireBtn.addEventListener("click", () => {
        notifyLabInteraction(unitId);
        if (svgBeam) {
          svgBeam.setAttribute("opacity", "1");
          setTimeout(() => svgBeam.setAttribute("opacity", "0"), 650);
        }

        if (scannerType === "ccd" && targetType === "phone") {
          playSimSound("error");
          output.className = "flex-1 bg-red-100 border-2 border-black rounded-xl p-3 font-thai text-xs sm:text-sm";
          output.innerHTML = "<span class='font-notch font-bold bg-red-400 text-white px-2 py-0.5 rounded border border-black text-xs mr-1'>SCAN FAILED</span> <strong>ยิงไม่ติด:</strong> หัวอ่าน 1D CCD รุ่นธรรมดาเจอแสงสะท้อนจากกระจกหน้าจอมือถือ ต้องสลับเป็นหัวอ่าน <strong>2D Area CMOS (แบบถ่ายภาพ)</strong> ถึงจะยิงจอมือถือติด";
        } else {
          playSimSound("beep");
          output.className = "flex-1 bg-emerald-200 border-2 border-black rounded-xl p-3 font-thai text-xs sm:text-sm";
          output.innerHTML = `<span class="font-notch font-bold bg-emerald-400 px-2 py-0.5 rounded border border-black text-xs mr-1">BEEP OK</span> <strong>สแกนสำเร็จ (${scannerType.toUpperCase()}):</strong> อ่านรหัส <code>8850123456788</code> (885 = สินค้าไทย, เลขตรวจสอบหลักสุดท้าย = 8)`;
        }
      });
    }
  }

  /* ==========================================================================
     UNIT 6: ปืนสแกนเนอร์ไร้สาย (Instant vs Batch Inventory Mode)
     ========================================================================== */
  function renderUnit06WirelessBatchScannerLab(container, unitId) {
    let mode = "batch";
    let memoryBuffer = [];
    let pcReceived = [];

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap gap-2">
            <button type="button" data-u6-mode="batch" class="u6-mode-btn brutal-btn bg-amber-300 px-3.5 py-1.5 rounded-xl text-xs font-thai">
              [BATCH MODE] เก็บสะสมในความจำปืน
            </button>
            <button type="button" data-u6-mode="instant" class="u6-mode-btn brutal-btn bg-white px-3.5 py-1.5 rounded-xl text-xs font-thai">
              [INSTANT MODE] ส่งเข้าคอมพิวเตอร์ทันที
            </button>
          </div>
          <span class="font-notch font-bold text-xs bg-zinc-900 text-white px-2.5 py-1 rounded">
            2.4GHz / BLUETOOTH LAB
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-white brutal-border rounded-2xl p-4 space-y-2.5">
            <div class="flex items-center justify-between">
              <h5 class="font-thai font-bold text-sm">หน่วยความจำในปืนสแกนไร้สาย</h5>
              <span id="u6-mem-count" class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">
                0 รายการ
              </span>
            </div>
            <div id="u6-mem-list" class="min-h-[68px] bg-zinc-50 border-2 border-dashed border-zinc-400 rounded-xl p-2.5 font-notch text-xs text-zinc-700">
              ยังไม่มีรหัสในหน่วยความจำปืน
            </div>
            <div class="flex flex-wrap gap-2">
              <button id="u6-scan-item-btn" type="button" class="flex-1 brutal-btn bg-emerald-400 hover:bg-emerald-300 py-2 rounded-xl text-xs font-thai">
                [SCAN +1] ยิงบาร์โค้ดสินค้าในโกดัง
              </button>
              <button id="u6-upload-batch-btn" type="button" class="brutal-btn bg-sky-300 hover:bg-sky-200 px-3 py-2 rounded-xl text-xs font-thai">
                [SYNC] อัปโหลดเข้าคอมทีเดียว
              </button>
            </div>
          </div>

          <div class="bg-zinc-950 text-white brutal-border rounded-2xl p-4 space-y-2.5">
            <div class="flex items-center justify-between">
              <h5 class="font-thai font-bold text-sm text-emerald-400">หน้าจอคอมพิวเตอร์รับสต๊อก</h5>
              <span id="u6-pc-count" class="font-notch font-bold text-xs bg-emerald-400 text-black px-2 py-0.5 rounded">
                รับแล้ว 0 ชิ้น
              </span>
            </div>
            <div id="u6-pc-list" class="min-h-[96px] bg-zinc-900 border border-zinc-700 rounded-xl p-2.5 font-notch text-xs text-emerald-300 space-y-1">
              รอรับข้อมูลจากปืนสแกนไร้สาย...
            </div>
          </div>
        </div>
      </div>
    `;

    const memCount = container.querySelector("#u6-mem-count");
    const memList = container.querySelector("#u6-mem-list");
    const pcCount = container.querySelector("#u6-pc-count");
    const pcList = container.querySelector("#u6-pc-list");
    const scanBtn = container.querySelector("#u6-scan-item-btn");
    const uploadBtn = container.querySelector("#u6-upload-batch-btn");

    const updateView = () => {
      if (memCount) memCount.textContent = `${memoryBuffer.length} รายการ`;
      if (memList) {
        memList.innerHTML =
          memoryBuffer.length > 0
            ? memoryBuffer.map((c) => `<span class="inline-block bg-amber-200 border border-black px-1.5 py-0.5 rounded m-0.5">${c}</span>`).join("")
            : "ว่างเปล่า (พร้อมสแกนสะสมใหม่)";
      }
      if (pcCount) pcCount.textContent = `รับแล้ว ${pcReceived.length} ชิ้น`;
      if (pcList) {
        pcList.innerHTML =
          pcReceived.length > 0
            ? pcReceived.map((c, i) => `<div>#${i + 1} &rarr; RECEIVED: ${c} [OK]</div>`).join("")
            : "รอรับข้อมูลจากปืนสแกนไร้สาย...";
      }
    };

    container.querySelectorAll(".u6-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        mode = btn.getAttribute("data-u6-mode");
        playSimSound("click");
        notifyLabInteraction(unitId);
        container.querySelectorAll(".u6-mode-btn").forEach((b) => {
          b.className = `u6-mode-btn brutal-btn ${
            b === btn ? "bg-amber-300" : "bg-white"
          } px-3.5 py-1.5 rounded-xl text-xs font-thai`;
        });
      });
    });

    if (scanBtn) {
      scanBtn.addEventListener("click", () => {
        notifyLabInteraction(unitId);
        playSimSound("beep");
        const code = `88500${Math.floor(1000 + Math.random() * 8999)}`;
        if (mode === "instant") {
          pcReceived.push(code);
        } else {
          memoryBuffer.push(code);
        }
        updateView();
      });
    }

    if (uploadBtn) {
      uploadBtn.addEventListener("click", () => {
        notifyLabInteraction(unitId);
        if (memoryBuffer.length === 0) {
          playSimSound("error");
          return;
        }
        playSimSound("double_beep");
        pcReceived.push(...memoryBuffer);
        memoryBuffer = [];
        updateView();
      });
    }
  }

  /* ==========================================================================
     UNIT 7: ห้องทดลองทำรอยเปื้อน QR Code & Reed-Solomon (L, M, Q, H)
     ========================================================================== */
  function renderUnit07QrDamageReedSolomonLab(container, unitId) {
    let damagePercent = 0;
    let ecLevel = "M";
    const maxRecoverable = { L: 7, M: 15, Q: 25, H: 30 };

    container.innerHTML = `
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div class="md:col-span-5 flex flex-col items-center bg-white brutal-border rounded-2xl p-4 space-y-2.5">
            <span class="font-notch font-bold text-xs bg-sky-300 px-2.5 py-0.5 rounded border border-black">
              CLICK QR TO ADD DAMAGE
            </span>

            <div id="u7-qr-box" class="w-44 h-44 bg-white border-4 border-black p-2 relative cursor-pointer select-none" title="คลิกเพื่อทำรอยเปื้อนบน QR Code">
              <svg viewBox="0 0 100 100" class="w-full h-full">
                <rect x="4" y="4" width="26" height="26" fill="none" stroke="#000" stroke-width="6"/>
                <rect x="11" y="11" width="12" height="12" fill="#000"/>

                <rect x="70" y="4" width="26" height="26" fill="none" stroke="#000" stroke-width="6"/>
                <rect x="77" y="11" width="12" height="12" fill="#000"/>

                <rect x="4" y="70" width="26" height="26" fill="none" stroke="#000" stroke-width="6"/>
                <rect x="11" y="77" width="12" height="12" fill="#000"/>

                <rect x="38" y="10" width="8" height="8" fill="#000"/>
                <rect x="52" y="18" width="8" height="8" fill="#000"/>
                <rect x="38" y="36" width="10" height="10" fill="#000"/>
                <rect x="54" y="42" width="10" height="10" fill="#000"/>
                <rect x="20" y="44" width="10" height="10" fill="#000"/>
                <rect x="74" y="44" width="10" height="10" fill="#000"/>
                <rect x="42" y="64" width="10" height="10" fill="#000"/>
                <rect x="64" y="72" width="16" height="16" fill="none" stroke="#000" stroke-width="4"/>
                <rect x="70" y="78" width="4" height="4" fill="#000"/>

                <circle id="u7-splat-1" cx="48" cy="48" r="12" fill="#EF4444" opacity="0"/>
                <circle id="u7-splat-2" cx="62" cy="35" r="13" fill="#EF4444" opacity="0"/>
                <circle id="u7-splat-3" cx="38" cy="68" r="14" fill="#EF4444" opacity="0"/>
                <circle id="u7-splat-4" cx="56" cy="62" r="15" fill="#EF4444" opacity="0"/>
              </svg>
            </div>

            <div class="flex gap-2 w-full">
              <button id="u7-add-damage-btn" type="button" class="flex-1 brutal-btn bg-pink-300 hover:bg-pink-200 py-1.5 rounded-xl text-xs font-thai">
                [+8% DAMAGE] ป้ายรอยเปื้อน
              </button>
              <button id="u7-clean-btn" type="button" class="brutal-btn bg-white hover:bg-zinc-100 px-3 py-1.5 rounded-xl text-xs font-thai">
                [RESET] ล้างคราบ
              </button>
            </div>
          </div>

          <div class="md:col-span-7 space-y-3">
            <div class="bg-white brutal-border rounded-2xl p-4 space-y-3">
              <div class="flex items-center justify-between">
                <span class="font-thai font-bold text-sm">ระดับความเสียหายของป้าย QR:</span>
                <span id="u7-damage-badge" class="font-notch font-bold text-sm bg-red-200 px-2.5 py-0.5 rounded border border-black">
                  0% DAMAGED
                </span>
              </div>

              <div class="space-y-1.5">
                <p class="font-thai text-xs text-zinc-700">
                  เลือกตั้งค่าระดับการกู้คืนข้อมูล <strong>Reed-Solomon Error Correction</strong>:
                </p>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button type="button" data-ec="L" class="u7-ec-btn brutal-btn bg-white py-2 rounded-xl font-notch text-xs">Level L (7%)</button>
                  <button type="button" data-ec="M" class="u7-ec-btn brutal-btn bg-amber-300 py-2 rounded-xl font-notch text-xs">Level M (15%)</button>
                  <button type="button" data-ec="Q" class="u7-ec-btn brutal-btn bg-white py-2 rounded-xl font-notch text-xs">Level Q (25%)</button>
                  <button type="button" data-ec="H" class="u7-ec-btn brutal-btn bg-white py-2 rounded-xl font-notch text-xs">Level H (30%)</button>
                </div>
              </div>

              <button id="u7-test-scan-btn" type="button" class="w-full brutal-btn bg-emerald-400 hover:bg-emerald-300 py-2.5 rounded-xl text-sm font-thai">
                [TEST SCAN] กดทดสอบสแกนกู้คืนข้อมูล QR Code
              </button>

              <div id="u7-scan-result" class="bg-zinc-100 border-2 border-black rounded-xl p-3 font-thai text-xs sm:text-sm">
                ลองกดปุ่ม <strong>"ป้ายรอยเปื้อน"</strong> แล้วกดสแกนเทียบระหว่างระดับ L, M, Q, H ดูได้เลย
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const damageBadge = container.querySelector("#u7-damage-badge");
    const resultEl = container.querySelector("#u7-scan-result");

    const updateSplats = () => {
      if (damageBadge) damageBadge.textContent = `${damagePercent}% DAMAGED`;
      const s1 = container.querySelector("#u7-splat-1");
      const s2 = container.querySelector("#u7-splat-2");
      const s3 = container.querySelector("#u7-splat-3");
      const s4 = container.querySelector("#u7-splat-4");
      if (s1) s1.setAttribute("opacity", damagePercent >= 8 ? "0.88" : "0");
      if (s2) s2.setAttribute("opacity", damagePercent >= 16 ? "0.88" : "0");
      if (s3) s3.setAttribute("opacity", damagePercent >= 24 ? "0.88" : "0");
      if (s4) s4.setAttribute("opacity", damagePercent >= 32 ? "0.88" : "0");
    };

    const runQrScan = () => {
      notifyLabInteraction(unitId);
      const limit = maxRecoverable[ecLevel];
      if (damagePercent <= limit) {
        playSimSound("beep");
        resultEl.className = "bg-emerald-200 border-2 border-black rounded-xl p-3 font-thai text-xs sm:text-sm";
        resultEl.innerHTML = `<span class="font-notch font-bold bg-emerald-400 px-2 py-0.5 rounded border border-black text-xs mr-1">RECOVERED</span> <strong>กู้ข้อมูลสำเร็จ:</strong> (เสียหาย ${damagePercent}% &le; ขีดจำกัดระดับ ${ecLevel} ที่รับได้ ${limit}%) อ่านข้อมูลได้ครบถ้วน`;
      } else {
        playSimSound("error");
        resultEl.className = "bg-red-200 border-2 border-black rounded-xl p-3 font-thai text-xs sm:text-sm";
        resultEl.innerHTML = `<span class="font-notch font-bold bg-red-500 text-white px-2 py-0.5 rounded border border-black text-xs mr-1">UNREADABLE</span> <strong>สแกนไม่ติด:</strong> ป้ายเสียหาย ${damagePercent}% เกินกว่าระดับ ${ecLevel} (${limit}%) จะรับไหว ลองเปลี่ยนเป็นระดับ <strong>Q (25%)</strong> หรือ <strong>H (30%)</strong>`;
      }
    };

    const addDamage = () => {
      damagePercent = Math.min(32, damagePercent + 8);
      playSimSound("click");
      notifyLabInteraction(unitId);
      updateSplats();
      runQrScan();
    };

    container.querySelector("#u7-qr-box")?.addEventListener("click", addDamage);
    container.querySelector("#u7-add-damage-btn")?.addEventListener("click", addDamage);
    container.querySelector("#u7-clean-btn")?.addEventListener("click", () => {
      damagePercent = 0;
      playSimSound("click");
      notifyLabInteraction(unitId);
      updateSplats();
      runQrScan();
    });

    container.querySelectorAll(".u7-ec-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        ecLevel = btn.getAttribute("data-ec");
        container.querySelectorAll(".u7-ec-btn").forEach((b) => {
          b.className = `u7-ec-btn brutal-btn ${
            b === btn ? "bg-amber-300" : "bg-white"
          } py-2 rounded-xl font-notch text-xs`;
        });
        runQrScan();
      });
    });

    container.querySelector("#u7-test-scan-btn")?.addEventListener("click", runQrScan);
  }

  /* ==========================================================================
     UNIT 8: ครอบครัว QR 4 ตระกูล & Dynamic QR Redirector
     ========================================================================== */
  function renderUnit08QrFamilyDynamicLab(container, unitId) {
    const familyInfo = {
      model2: {
        title: "QR Code Model 2 (รุ่นมาตรฐาน)",
        desc: "มีสี่เหลี่ยม Finder Pattern ครบ 3 มุม และมี Alignment Pattern มุมล่างขวา ใช้สแกนจ่ายเงินและเข้าเว็บทั่วไป"
      },
      micro: {
        title: "Micro QR Code (มี Finder แค่ 1 มุม)",
        desc: "ลดเหลือสี่เหลี่ยมมุมบนซ้ายแค่ 1 มุม ประหยัดพื้นที่มาก ใช้พิมพ์บนชิป IC หรืออะไหล่คอมพิวเตอร์ขนาดจิ๋ว"
      },
      rmqr: {
        title: "rMQR (ทรงสี่เหลี่ยมผืนผ้าแนวยาว)",
        desc: "ออกแบบเป็นแถบแนวยาว พิมพ์ติดขอบหลอดทดลองทางการแพทย์หรือสันอุปกรณ์แคบๆ ได้พอดี"
      },
      sqrc: {
        title: "SQRC (Secure QR เข้ารหัสลับ)",
        desc: "ภายนอกเหมือน QR ปกติ แต่ซ่อนข้อมูลลับที่ต้องใช้เครื่องอ่านที่มีกุญแจรหัสตรงกันเท่านั้นถึงจะเปิดอ่านได้"
      }
    };

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <button type="button" data-qrfam="model2" class="u8-fam-btn brutal-btn bg-amber-300 px-3 py-1.5 rounded-xl text-xs font-thai">1. Model 2 (3 มุม)</button>
          <button type="button" data-qrfam="micro" class="u8-fam-btn brutal-btn bg-white px-3 py-1.5 rounded-xl text-xs font-thai">2. Micro QR (1 มุม)</button>
          <button type="button" data-qrfam="rmqr" class="u8-fam-btn brutal-btn bg-white px-3 py-1.5 rounded-xl text-xs font-thai">3. rMQR (ทรงผืนผ้า)</button>
          <button type="button" data-qrfam="sqrc" class="u8-fam-btn brutal-btn bg-white px-3 py-1.5 rounded-xl text-xs font-thai">4. SQRC (เข้ารหัสลับ)</button>
        </div>

        <div id="u8-family-box" class="bg-white brutal-border rounded-2xl p-4 font-thai text-xs sm:text-sm">
          <strong>${familyInfo.model2.title}:</strong> ${familyInfo.model2.desc}
        </div>

        <div class="bg-emerald-50 brutal-border rounded-2xl p-4 space-y-2.5">
          <span class="font-notch font-bold text-xs bg-emerald-400 px-2.5 py-0.5 rounded border border-black">
            DYNAMIC QR REDIRECT TESTER
          </span>
          <p class="font-thai text-xs text-zinc-700">
            ป้าย Dynamic QR เก็บลิงก์สั้น <code>https://stwedy.qr/menu</code> ลองเปลี่ยนเว็บปลายทางด้านล่างแล้วกดอัปเดตโดยไม่ต้องพิมพ์ป้าย QR ใหม่:
          </p>
          <div class="flex flex-wrap gap-2">
            <input id="u8-dyn-input" type="text" value="https://college.ac.th/promo-october" class="brutal-input flex-1 px-3 py-1.5 rounded-xl font-notch text-xs" />
            <button id="u8-dyn-btn" type="button" class="brutal-btn bg-amber-300 hover:bg-amber-200 px-4 py-1.5 rounded-xl text-xs font-thai">
              [UPDATE URL] เปลี่ยนลิงก์ปลายทางทันที
            </button>
          </div>
          <div id="u8-dyn-output" class="bg-white border-2 border-black rounded-xl p-2.5 font-thai text-xs">
            สถานะปัจจุบัน: สแกนป้ายเดิมจะพาไปที่ <code>https://college.ac.th/promo-october</code>
          </div>
        </div>
      </div>
    `;

    const famBox = container.querySelector("#u8-family-box");
    container.querySelectorAll(".u8-fam-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-qrfam");
        const info = familyInfo[key];
        playSimSound("click");
        notifyLabInteraction(unitId);
        container.querySelectorAll(".u8-fam-btn").forEach((b) => {
          b.className = `u8-fam-btn brutal-btn ${
            b === btn ? "bg-amber-300" : "bg-white"
          } px-3 py-1.5 rounded-xl text-xs font-thai`;
        });
        if (famBox && info) {
          famBox.innerHTML = `<strong>${info.title}:</strong> ${info.desc}`;
        }
      });
    });

    const dynInput = container.querySelector("#u8-dyn-input");
    const dynBtn = container.querySelector("#u8-dyn-btn");
    const dynOut = container.querySelector("#u8-dyn-output");
    if (dynBtn && dynInput && dynOut) {
      dynBtn.addEventListener("click", () => {
        notifyLabInteraction(unitId);
        playSimSound("double_beep");
        const url = dynInput.value.trim() || "https://college.ac.th/new";
        dynOut.innerHTML = `<span class="font-notch font-bold bg-emerald-400 px-1.5 py-0.5 rounded border border-black text-[11px] mr-1">REDIRECT OK</span> <strong>อัปเดต Dynamic QR สำเร็จ:</strong> ป้าย QR บนโต๊ะยังเป็นรูปเดิม แต่เมื่อสแกนจะวิ่งไปที่ <code class="bg-amber-200 px-1 rounded font-bold">${url}</code> ทันที`;
      });
    }
  }

  /* ==========================================================================
     UNIT 9: เครื่องคำนวณ Check Digit บาร์โค้ด EAN-13 แบบ Step-by-Step ทีละขั้น
     ========================================================================== */
  function renderUnit09CheckDigitCalculatorLab(container, unitId) {
    container.innerHTML = `
      <div class="space-y-4">
        <p class="font-thai text-xs sm:text-sm text-zinc-700">
          พิมพ์ตัวเลขบาร์โค้ด <strong>12 หลักแรก</strong> (หรือกดสุ่มตัวอย่าง) เพื่อดูวิธีทำแบบ <strong>Step-by-Step 4 ขั้นตอน</strong> ในการหาเลขตรวจสอบ <strong>Check Digit (หลักที่ 13)</strong>:
        </p>

        <div class="flex flex-wrap items-center gap-2">
          <input
            id="u9-ean12-input"
            type="text"
            maxlength="12"
            value="885012345678"
            class="brutal-input px-3.5 py-2 rounded-xl font-notch font-bold text-base w-52 tracking-wider"
          />
          <button id="u9-calc-btn" type="button" class="brutal-btn bg-emerald-400 hover:bg-emerald-300 px-4 py-2 rounded-xl text-xs sm:text-sm font-thai">
            [CALCULATE] คำนวณหลักที่ 13 ทีละขั้น
          </button>
          <button id="u9-random-btn" type="button" class="brutal-btn bg-amber-300 hover:bg-amber-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-thai">
            [RANDOM 885] สุ่มรหัสใหม่
          </button>
        </div>

        <div id="u9-steps-box" class="bg-white brutal-border rounded-2xl p-4 space-y-3 font-thai text-xs sm:text-sm"></div>
      </div>
    `;

    const inputEl = container.querySelector("#u9-ean12-input");
    const calcBtn = container.querySelector("#u9-calc-btn");
    const randBtn = container.querySelector("#u9-random-btn");
    const stepsBox = container.querySelector("#u9-steps-box");

    const computeSteps = (triggerSound = false) => {
      const digits = (inputEl ? inputEl.value : "").replace(/\D/g, "");
      if (digits.length !== 12) {
        if (stepsBox) {
          stepsBox.innerHTML = `<span class="text-red-600 font-semibold">[INPUT ERROR] กรุณาป้อนตัวเลขให้ครบ 12 หลักพอดี (ตอนนี้มี ${digits.length} หลัก)</span>`;
        }
        return;
      }

      if (triggerSound) {
        playSimSound("beep");
        notifyLabInteraction(unitId);
      }

      let oddSum = 0;
      let evenSum = 0;
      const oddParts = [];
      const evenParts = [];
      const cellHtml = [];

      for (let i = 0; i < 12; i++) {
        const d = Number(digits[i]);
        const pos = i + 1;
        const isOddPos = pos % 2 === 1;
        const weight = isOddPos ? 1 : 3;
        const prod = d * weight;
        if (isOddPos) {
          oddSum += prod;
          oddParts.push(d);
        } else {
          evenSum += prod;
          evenParts.push(`${d}x3=${prod}`);
        }

        cellHtml.push(`
          <div class="border-2 border-black rounded-lg p-1.5 text-center ${
            isOddPos ? "bg-emerald-50" : "bg-amber-100"
          }">
            <div class="text-[10px] text-zinc-500 font-notch">#${pos}</div>
            <div class="font-notch font-bold text-sm">${d}</div>
            <div class="text-[10px] font-notch">x${weight} = <strong>${prod}</strong></div>
          </div>
        `);
      }

      const totalSum = oddSum + evenSum;
      const rem = totalSum % 10;
      const checkDigit = rem === 0 ? 0 : 10 - rem;
      const nextTen = rem === 0 ? totalSum : totalSum + checkDigit;

      if (stepsBox) {
        stepsBox.innerHTML = `
          <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-1.5">
            ${cellHtml.join("")}
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
            <div class="calc-step-box bg-emerald-50 border-2 border-black rounded-xl p-3">
              <div class="font-notch font-bold text-xs bg-zinc-900 text-white inline-block px-2 py-0.5 rounded mb-1">STEP 01 • ODD POSITIONS (x1)</div>
              <div>รวมเลขตำแหน่งคี่ (หลัก 1,3,5,7,9,11): <code>${oddParts.join(" + ")}</code> = <strong class="font-notch text-base">${oddSum}</strong></div>
            </div>
            <div class="calc-step-box bg-amber-50 border-2 border-black rounded-xl p-3">
              <div class="font-notch font-bold text-xs bg-zinc-900 text-white inline-block px-2 py-0.5 rounded mb-1">STEP 02 • EVEN POSITIONS (x3)</div>
              <div>คูณ 3 ตำแหน่งคู่แล้วบวกกัน: <strong class="font-notch text-base">${evenSum}</strong></div>
            </div>
            <div class="calc-step-box bg-sky-50 border-2 border-black rounded-xl p-3">
              <div class="font-notch font-bold text-xs bg-zinc-900 text-white inline-block px-2 py-0.5 rounded mb-1">STEP 03 • TOTAL WEIGHTED SUM</div>
              <div>นำผลลัพธ์มารวมกัน: <strong class="font-notch">${oddSum} + ${evenSum} = ${totalSum}</strong> (จำนวนเต็มสิบถัดไปคือ <strong class="font-notch">${nextTen}</strong>)</div>
            </div>
            <div class="calc-step-box bg-emerald-200 border-2 border-black rounded-xl p-3 flex flex-col justify-center">
              <div class="font-notch font-bold text-xs bg-zinc-900 text-white inline-block px-2 py-0.5 rounded mb-1 w-fit">STEP 04 • CHECK DIGIT (13th DIGIT)</div>
              <div><strong>หลักที่ 13:</strong> <code class="font-notch font-bold">${nextTen} - ${totalSum} = ${checkDigit}</code> &rarr; รหัสสมบูรณ์: <span class="font-notch font-bold">${digits}<span class="bg-amber-300 px-1.5 rounded border border-black">${checkDigit}</span></span></div>
            </div>
          </div>
        `;
      }
    };

    calcBtn?.addEventListener("click", () => computeSteps(true));
    inputEl?.addEventListener("input", () => computeSteps(true));
    randBtn?.addEventListener("click", () => {
      const random9 = Math.floor(100000000 + Math.random() * 899999999);
      if (inputEl) inputEl.value = `885${random9}`;
      computeSteps(true);
    });

    computeSteps(false);
  }

  /* ==========================================================================
     UNIT 10: ห้องทดลองเข้ารหัส SHA-256 + Salt & HTTPS vs HTTP
     ========================================================================== */
  function renderUnit10CryptoHashSaltLab(container, unitId) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block font-thai font-semibold text-xs mb-1">1. รหัสผ่านของผู้ใช้ (Password):</label>
            <input id="u10-pass-input" type="text" value="123456" class="brutal-input w-full px-3 py-2 rounded-xl font-notch text-sm" />
          </div>
          <div>
            <label class="block font-thai font-semibold text-xs mb-1">2. ค่าเกลือสุ่มเฉพาะคน (Salt):</label>
            <div class="flex gap-2">
              <input id="u10-salt-input" type="text" value="x9#kP2" class="brutal-input flex-1 px-3 py-2 rounded-xl font-notch text-sm" />
              <button id="u10-rand-salt-btn" type="button" class="brutal-btn bg-amber-300 px-3 py-2 rounded-xl text-xs font-thai">
                [SALT] สุ่มค่า Salt
              </button>
            </div>
          </div>
        </div>

        <div class="bg-zinc-950 text-white brutal-border rounded-2xl p-4 space-y-2 font-notch text-xs">
          <div class="text-zinc-400">STEP 1 • COMBINED INPUT: <span id="u10-combined" class="text-amber-300 font-bold">123456 + x9#kP2</span></div>
          <div class="break-all">STEP 2 • SHA-256 HASH DIGEST (64 HEX): <span id="u10-hash-out" class="text-emerald-400 font-bold"></span></div>
        </div>

        <p class="font-thai text-xs text-zinc-600">
          สังเกตว่าต่อให้ตั้งรหัสซ้ำกันว่า <code>123456</code> แต่เมื่อเติม <strong>Salt</strong> ต่างกันเพียงตัวอักษรเดียว ค่า Hash ที่ได้จะเปลี่ยนไปทั้งหมด
        </p>
      </div>
    `;

    const passInp = container.querySelector("#u10-pass-input");
    const saltInp = container.querySelector("#u10-salt-input");
    const randBtn = container.querySelector("#u10-rand-salt-btn");
    const combEl = container.querySelector("#u10-combined");
    const hashEl = container.querySelector("#u10-hash-out");

    const pseudoSha256 = (str) => {
      let h1 = 0xdeadbeef ^ str.length;
      let h2 = 0x41c6ce57 ^ str.length;
      for (let i = 0; i < str.length; i++) {
        const ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      let hex = "";
      for (let round = 0; round < 8; round++) {
        h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507 ^ round);
        h2 = Math.imul(h2 ^ (h2 >>> 13), 3266489909 ^ round);
        hex += ((h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0")).slice(0, 8);
      }
      return hex.slice(0, 64);
    };

    const updateHash = (interacted = false) => {
      if (interacted) {
        playSimSound("click");
        notifyLabInteraction(unitId);
      }
      const p = passInp ? passInp.value : "";
      const s = saltInp ? saltInp.value : "";
      if (combEl) combEl.textContent = `${p}${s}`;
      if (hashEl) hashEl.textContent = pseudoSha256(`${p}::${s}`);
    };

    passInp?.addEventListener("input", () => updateHash(true));
    saltInp?.addEventListener("input", () => updateHash(true));
    randBtn?.addEventListener("click", () => {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
      let s = "";
      for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
      if (saltInp) saltInp.value = s;
      updateHash(true);
    });

    updateHash(false);
  }

  /* ==========================================================================
     UNIT 11: เครื่องจำลองแตะบัตร RFID (Passive vs Active & ย่านความถี่)
     ========================================================================== */
  function renderUnit11RfidReaderLab(container, unitId) {
    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-thai text-xs sm:text-sm font-semibold">
            เลื่อนระยะห่างของบัตร RFID เข้าหาเครื่องอ่าน (Reader) หรือกดปุ่มแตะบัตร:
          </span>
          <div class="flex gap-2">
            <button type="button" data-rfid-tag="passive" class="u11-tag-btn brutal-btn bg-pink-300 px-3 py-1 rounded-xl text-xs font-thai">
              [PASSIVE] 13.56 MHz NFC (ระยะใกล้)
            </button>
            <button type="button" data-rfid-tag="active" class="u11-tag-btn brutal-btn bg-white px-3 py-1 rounded-xl text-xs font-thai">
              [ACTIVE] UHF มีแบตเตอรี่ (ระยะไกล)
            </button>
          </div>
        </div>

        <div class="bg-white brutal-border rounded-2xl p-4">
          <svg viewBox="0 0 600 145" class="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="20" width="135" height="105" rx="16" fill="#18181B" stroke="#000" stroke-width="3"/>
            <circle id="u11-reader-led" cx="87" cy="48" r="10" fill="#FDE047" stroke="#000" stroke-width="2"/>
            <text x="87" y="82" text-anchor="middle" font-family="Stack Sans Notch" font-weight="700" font-size="12" fill="#FFF">RFID READER</text>
            <text x="87" y="102" text-anchor="middle" font-family="Stack Sans Notch" font-size="10" fill="#34D399">ANTENNA COIL</text>

            <path d="M 168 42 Q 192 72 168 102" fill="none" stroke="#34D399" stroke-width="3" stroke-dasharray="4 4"/>
            <path d="M 186 30 Q 218 72 186 114" fill="none" stroke="#34D399" stroke-width="3" stroke-dasharray="4 4"/>
            <path d="M 204 20 Q 242 72 204 124" fill="none" stroke="#38BDF8" stroke-width="2.5" stroke-dasharray="4 4"/>

            <g id="u11-card-group" transform="translate(360, 26)">
              <rect x="0" y="0" width="165" height="92" rx="12" fill="#F472B6" stroke="#000" stroke-width="3"/>
              <rect x="10" y="10" width="145" height="72" rx="8" fill="none" stroke="#FDE047" stroke-width="2.5" stroke-dasharray="6 3"/>
              <rect x="24" y="32" width="28" height="26" rx="4" fill="#FDE047" stroke="#000" stroke-width="2"/>
              <text x="102" y="45" text-anchor="middle" font-family="Stack Sans Notch" font-weight="700" font-size="11" fill="#000" id="u11-card-title">PASSIVE TAG</text>
              <text x="102" y="64" text-anchor="middle" font-family="Stack Sans Notch" font-size="10" fill="#000">UID: 04:A2:9F:1B</text>
            </g>
          </svg>

          <div class="space-y-2 mt-2">
            <div class="flex items-center justify-between text-xs font-thai">
              <span>&larr; เลื่อนเข้าใกล้เครื่องอ่าน (0 ซม.)</span>
              <span id="u11-dist-label" class="font-notch font-bold">ระยะห่าง: 25 ซม.</span>
              <span>ห่างออกไป (50 ซม.) &rarr;</span>
            </div>
            <input id="u11-dist-slider" type="range" min="2" max="50" value="25" class="brutal-slider" />
          </div>

          <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
            <div id="u11-status-box" class="flex-1 bg-zinc-100 border-2 border-black rounded-xl p-2.5 font-thai text-xs sm:text-sm">
              ลองเลื่อนแถบระยะห่างให้น้อยลง หรือกดปุ่ม <strong>"แตะบัตรทันที"</strong> เพื่ออ่านรหัส UID
            </div>
            <button id="u11-tap-btn" type="button" class="brutal-btn bg-emerald-400 hover:bg-emerald-300 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-thai">
              [TAP CARD] แตะบัตร RFID ทันที
            </button>
          </div>
        </div>
      </div>
    `;

    let tagType = "passive";
    const slider = container.querySelector("#u11-dist-slider");
    const distLabel = container.querySelector("#u11-dist-label");
    const cardGroup = container.querySelector("#u11-card-group");
    const cardTitle = container.querySelector("#u11-card-title");
    const readerLed = container.querySelector("#u11-reader-led");
    const statusBox = container.querySelector("#u11-status-box");
    const tapBtn = container.querySelector("#u11-tap-btn");

    const evaluateRfid = (playAudio = false) => {
      const dist = Number(slider ? slider.value : 25);
      if (distLabel) distLabel.textContent = `ระยะห่าง: ${dist} ซม.`;

      const xPos = 185 + dist * 4.5;
      if (cardGroup) cardGroup.setAttribute("transform", `translate(${xPos}, 26)`);

      const maxRange = tagType === "passive" ? 10 : 45;
      const isRead = dist <= maxRange;

      if (readerLed) {
        readerLed.setAttribute("fill", isRead ? "#34D399" : "#FDE047");
      }

      if (isRead) {
        if (playAudio) playSimSound("beep");
        statusBox.className = "flex-1 bg-emerald-200 border-2 border-black rounded-xl p-2.5 font-thai text-xs sm:text-sm";
        statusBox.innerHTML = `<span class="font-notch font-bold bg-emerald-400 px-2 py-0.5 rounded border border-black text-xs mr-1">UID READ</span> <strong>อ่านบัตรสำเร็จ (ระยะ ${dist} ซม.):</strong> คลื่นวิทยุเหนี่ยวนำชิปส่งค่า <code>UID: 04:A2:9F:1B</code> เข้าฐานข้อมูลเรียบร้อย`;
      } else {
        statusBox.className = "flex-1 bg-amber-100 border-2 border-black rounded-xl p-2.5 font-thai text-xs sm:text-sm";
        statusBox.innerHTML = `<span class="font-notch font-bold bg-amber-300 px-2 py-0.5 rounded border border-black text-xs mr-1">OUT OF RANGE</span> <strong>อยู่นอกระยะอ่าน (${dist} ซม.):</strong> ${
          tagType === "passive"
            ? "บัตร Passive HF/NFC ไม่มีถ่านในตัว ต้องเลื่อนเข้ามาใกล้ไม่เกิน 10 ซม."
            : "เลื่อนเข้ามาในระยะ 45 ซม. เพื่อรับสัญญาณ Active Tag"
        }`;
      }
    };

    container.querySelectorAll(".u11-tag-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        tagType = btn.getAttribute("data-rfid-tag");
        notifyLabInteraction(unitId);
        playSimSound("click");
        if (cardTitle) {
          cardTitle.textContent = tagType === "passive" ? "PASSIVE TAG" : "ACTIVE TAG [BAT]";
        }
        container.querySelectorAll(".u11-tag-btn").forEach((b) => {
          b.className = `u11-tag-btn brutal-btn ${
            b === btn ? "bg-pink-300" : "bg-white"
          } px-3 py-1 rounded-xl text-xs font-thai`;
        });
        evaluateRfid(true);
      });
    });

    slider?.addEventListener("input", () => {
      notifyLabInteraction(unitId);
      evaluateRfid(true);
    });

    tapBtn?.addEventListener("click", () => {
      notifyLabInteraction(unitId);
      if (slider) slider.value = "4";
      evaluateRfid(true);
    });
  }

  /* ==========================================================================
     UNIT 12: เครื่องสแกนลายนิ้วมือ (Minutiae) & แถบปรับค่า Threshold (FAR / FRR / EER)
     ========================================================================== */
  function renderUnit12BiometricMinutiaeThresholdLab(container, unitId) {
    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div class="md:col-span-5 bg-zinc-950 text-white brutal-border rounded-2xl p-4 flex flex-col items-center space-y-3 relative overflow-hidden">
          <span class="font-notch font-bold text-xs bg-emerald-400 text-black px-2.5 py-0.5 rounded">
            MINUTIAE EXTRACTOR
          </span>

          <div class="w-36 h-36 bg-zinc-900 border-2 border-emerald-400 rounded-2xl p-3 relative overflow-hidden">
            <div id="u12-scan-beam" class="laser-line hidden" style="background:#34D399; box-shadow: 0 0 12px #34D399;"></div>
            <svg viewBox="0 0 100 100" class="w-full h-full">
              <path d="M25 80 C20 45, 35 20, 50 20 C65 20, 80 45, 75 80" fill="none" stroke="#52525B" stroke-width="3" stroke-linecap="round"/>
              <path d="M33 78 C30 50, 40 30, 50 30 C60 30, 70 50, 67 78" fill="none" stroke="#52525B" stroke-width="3" stroke-linecap="round"/>
              <path d="M41 75 C40 55, 45 40, 50 40 C55 40, 60 55, 59 75" fill="none" stroke="#52525B" stroke-width="3" stroke-linecap="round"/>
              <path d="M50 72 L50 52" fill="none" stroke="#52525B" stroke-width="3" stroke-linecap="round"/>

              <g id="u12-minutiae-dots" opacity="0.25">
                <circle cx="35" cy="36" r="4" fill="#34D399" stroke="#000" stroke-width="1.5"/>
                <circle cx="64" cy="40" r="4" fill="#34D399" stroke="#000" stroke-width="1.5"/>
                <circle cx="50" cy="52" r="4" fill="#FDE047" stroke="#000" stroke-width="1.5"/>
                <circle cx="41" cy="64" r="4" fill="#34D399" stroke="#000" stroke-width="1.5"/>
                <circle cx="59" cy="62" r="4" fill="#FDE047" stroke="#000" stroke-width="1.5"/>
              </g>
            </svg>
          </div>

          <button id="u12-finger-btn" type="button" class="w-full brutal-btn bg-emerald-400 hover:bg-emerald-300 text-black py-2 rounded-xl text-xs sm:text-sm font-thai">
            [SCAN FINGER] วางนิ้วสกัดจุดตัด Minutiae
          </button>
        </div>

        <div class="md:col-span-7 bg-white brutal-border rounded-2xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <span class="font-thai font-bold text-sm">ปรับค่าความเข้มงวด (Security Threshold):</span>
            <span id="u12-thresh-val" class="font-notch font-bold text-sm bg-amber-300 px-2.5 py-0.5 rounded border border-black">
              50% (จุดสมดุล EER)
            </span>
          </div>

          <input id="u12-thresh-slider" type="range" min="10" max="90" value="50" class="brutal-slider" />

          <div class="space-y-2 pt-1">
            <div>
              <div class="flex justify-between text-xs font-thai mb-1">
                <span><strong>FAR (False Acceptance - รับคนปลอมเข้า):</strong></span>
                <span id="u12-far-label" class="font-notch font-bold text-red-600">8%</span>
              </div>
              <div class="w-full h-3.5 bg-zinc-100 border-2 border-black rounded-full overflow-hidden">
                <div id="u12-far-bar" class="h-full bg-red-400 transition-[width] duration-150" style="width: 16%"></div>
              </div>
            </div>

            <div>
              <div class="flex justify-between text-xs font-thai mb-1">
                <span><strong>FRR (False Rejection - ปฏิเสธเจ้าของตัวจริง):</strong></span>
                <span id="u12-frr-label" class="font-notch font-bold text-amber-700">8%</span>
              </div>
              <div class="w-full h-3.5 bg-zinc-100 border-2 border-black rounded-full overflow-hidden">
                <div id="u12-frr-bar" class="h-full bg-amber-400 transition-[width] duration-150" style="width: 16%"></div>
              </div>
            </div>
          </div>

          <div id="u12-explain-box" class="bg-emerald-100 border-2 border-black rounded-xl p-2.5 font-thai text-xs">
            <strong>จุดสมดุล EER (Equal Error Rate):</strong> ตอนนี้ค่า FAR และ FRR สมดุลกันที่ 8% เหมาะกับการใช้งานทั่วไป
          </div>
        </div>
      </div>
    `;

    const fingerBtn = container.querySelector("#u12-finger-btn");
    const beam = container.querySelector("#u12-scan-beam");
    const dots = container.querySelector("#u12-minutiae-dots");
    const slider = container.querySelector("#u12-thresh-slider");
    const threshVal = container.querySelector("#u12-thresh-val");
    const farLabel = container.querySelector("#u12-far-label");
    const frrLabel = container.querySelector("#u12-frr-label");
    const farBar = container.querySelector("#u12-far-bar");
    const frrBar = container.querySelector("#u12-frr-bar");
    const explainBox = container.querySelector("#u12-explain-box");

    if (fingerBtn) {
      fingerBtn.addEventListener("click", () => {
        notifyLabInteraction(unitId);
        playSimSound("double_beep");
        if (beam) {
          beam.classList.remove("hidden");
          setTimeout(() => beam.classList.add("hidden"), 1100);
        }
        if (dots) dots.setAttribute("opacity", "1");
        if (explainBox) {
          explainBox.innerHTML = "<span class='font-notch font-bold bg-emerald-400 px-1.5 py-0.5 rounded border border-black text-[11px] mr-1'>TEMPLATE OK</span> <strong>สกัดจุด Minutiae สำเร็จ:</strong> พบจุดตัดและจุดสิ้นสุดเส้นลายนิ้วมือ 5 พิกัด แปลงเป็นรหัส Template พร้อมเปรียบเทียบ";
        }
      });
    }

    if (slider) {
      slider.addEventListener("input", () => {
        notifyLabInteraction(unitId);
        const t = Number(slider.value);
        const far = Math.max(1, Math.round(((95 - t) * (95 - t)) / 180));
        const frr = Math.max(1, Math.round(((t - 5) * (t - 5)) / 180));

        if (farLabel) farLabel.textContent = `${far}%`;
        if (frrLabel) frrLabel.textContent = `${frr}%`;
        if (farBar) farBar.style.width = `${Math.min(100, far * 2)}%`;
        if (frrBar) frrBar.style.width = `${Math.min(100, frr * 2)}%`;

        if (Math.abs(t - 50) <= 5) {
          if (threshVal) threshVal.textContent = `${t}% (ใกล้จุดสมดุล EER)`;
          explainBox.className = "bg-emerald-100 border-2 border-black rounded-xl p-2.5 font-thai text-xs";
          explainBox.innerHTML = "<strong>สมดุลดีเยี่ยม (EER):</strong> ค่า FAR และ FRR ใกล้เคียงกัน เหมาะกับระบบสแกนเข้างานทั่วไป";
        } else if (t < 45) {
          if (threshVal) threshVal.textContent = `${t}% (หย่อนเกินไป)`;
          explainBox.className = "bg-red-100 border-2 border-black rounded-xl p-2.5 font-thai text-xs";
          explainBox.innerHTML = `<strong>[WARNING] ตั้งค่าต่ำเกินไป:</strong> ค่า <strong>FAR พุ่งสูงถึง ${far}%</strong> คนแปลกหน้าอาจแอบสแกนผ่านเข้าประตูได้`;
        } else {
          if (threshVal) threshVal.textContent = `${t}% (เข้มงวดสูง)`;
          explainBox.className = "bg-amber-100 border-2 border-black rounded-xl p-2.5 font-thai text-xs";
          explainBox.innerHTML = `<strong>[STRICT MODE] ตั้งค่าเข้มงวดมาก:</strong> ปลอดภัยจากคนปลอม (FAR=${far}%) แต่ค่า <strong>FRR สูงถึง ${frr}%</strong> เจ้าของตัวจริงอาจต้องวางนิ้วสแกนซ้ำหลายรอบ`;
        }
      });
    }
  }

  /* ==========================================================================
     UNIT 13: ห้องทดลอง Power Query Cleaner & แปลงตารางเป็น CSV / JSON
     ========================================================================== */
  function renderUnit13CsvJsonPowerQueryLab(container, unitId) {
    let isCleaned = false;
    let currentFormat = "csv";

    const rawRows = [
      { id: "67001", name: "  นายสมชาย สายไอที   ", score: 85 },
      { id: "67001", name: "  นายสมชาย สายไอที   ", score: 85 },
      { id: "67002", name: "นางสาวสมหญิง   โค้ดเก่ง", score: 92 }
    ];

    const cleanRows = [
      { id: "67001", name: "นายสมชาย สายไอที", score: 85 },
      { id: "67002", name: "นางสาวสมหญิง โค้ดเก่ง", score: 92 }
    ];

    container.innerHTML = `
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <button id="u13-clean-btn" type="button" class="brutal-btn bg-emerald-400 hover:bg-emerald-300 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-thai">
            [POWER QUERY] กดรัน Trim ช่องว่าง & ลบแถวซ้ำ
          </button>

          <div class="flex gap-2">
            <button type="button" data-fmt="csv" class="u13-fmt-btn brutal-btn bg-amber-300 px-3 py-1.5 rounded-xl font-notch text-xs">ดูไฟล์ .CSV</button>
            <button type="button" data-fmt="json" class="u13-fmt-btn brutal-btn bg-white px-3 py-1.5 rounded-xl font-notch text-xs">ดูไฟล์ .JSON</button>
          </div>
        </div>

        <pre id="u13-code-preview" class="bg-zinc-950 text-emerald-400 brutal-border rounded-2xl p-4 font-notch text-xs overflow-x-auto"></pre>
      </div>
    `;

    const preview = container.querySelector("#u13-code-preview");
    const cleanBtn = container.querySelector("#u13-clean-btn");

    const renderCode = () => {
      const rows = isCleaned ? cleanRows : rawRows;
      if (!preview) return;
      if (currentFormat === "csv") {
        const lines = ["student_id,full_name,score"];
        rows.forEach((r) => lines.push(`${r.id},"${r.name}",${r.score}`));
        preview.textContent =
          (isCleaned ? "# [CLEANED] คลีนข้อมูลแล้ว (Trim + Remove Duplicates)\n" : "# [RAW DATA] ข้อมูลดิบ (มีช่องว่างเกินและแถว 67001 ซ้ำ)\n") +
          lines.join("\n");
      } else {
        preview.textContent = JSON.stringify(rows, null, 2);
      }
    };

    cleanBtn?.addEventListener("click", () => {
      isCleaned = !isCleaned;
      playSimSound("double_beep");
      notifyLabInteraction(unitId);
      cleanBtn.textContent = isCleaned
        ? "[CLEANED OK] คลีนข้อมูลเรียบร้อย (กดเพื่อดูข้อมูลดิบก่อนคลีน)"
        : "[POWER QUERY] กดรัน Trim ช่องว่าง & ลบแถวซ้ำ";
      renderCode();
    });

    container.querySelectorAll(".u13-fmt-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentFormat = btn.getAttribute("data-fmt");
        playSimSound("click");
        notifyLabInteraction(unitId);
        container.querySelectorAll(".u13-fmt-btn").forEach((b) => {
          b.className = `u13-fmt-btn brutal-btn ${
            b === btn ? "bg-amber-300" : "bg-white"
          } px-3 py-1.5 rounded-xl font-notch text-xs`;
        });
        renderCode();
      });
    });

    renderCode();
  }

  /* ==========================================================================
     UNIT 14: เครื่องคำนวณไบต์ UTF-8 vs TIS-620 & ตัวแปลง Base64 แบบ Step-by-Step
     ========================================================================== */
  function renderUnit14Utf8ByteCalculatorLab(container, unitId) {
    container.innerHTML = `
      <div class="space-y-4">
        <div>
          <label class="block font-thai font-semibold text-xs sm:text-sm mb-1">
            พิมพ์ข้อความภาษาไทยผสมภาษาอังกฤษ เพื่อดูขั้นตอนการคำนวณขนาดไบต์ใน UTF-8 (ไทย 3 ไบต์ / อังกฤษและตัวเลข 1 ไบต์):
          </label>
          <input id="u14-text-input" type="text" value="ปวช1สายIT" class="brutal-input w-full px-3.5 py-2 rounded-xl font-thai text-base" />
        </div>

        <div id="u14-char-breakdown" class="flex flex-wrap gap-1.5"></div>

        <div id="u14-step-breakdown" class="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs sm:text-sm"></div>
      </div>
    `;

    const inp = container.querySelector("#u14-text-input");
    const breakdown = container.querySelector("#u14-char-breakdown");
    const stepBreakdown = container.querySelector("#u14-step-breakdown");

    const calcBytes = (interacted = false) => {
      if (interacted) {
        playSimSound("click");
        notifyLabInteraction(unitId);
      }

      const text = inp ? inp.value : "";
      const chars = Array.from(text);
      let utf8Total = 0;
      let thaiCount = 0;
      let asciiCount = 0;
      let otherCount = 0;
      let tisTotal = chars.length;

      const pills = chars.map((ch) => {
        const code = ch.codePointAt(0);
        let b = 1;
        let bg = "bg-white";
        if (code >= 0x0e00 && code <= 0x0e7f) {
          b = 3;
          thaiCount++;
          bg = "bg-amber-200";
        } else if (code > 0xffff) {
          b = 4;
          otherCount++;
          bg = "bg-pink-200";
        } else if (code > 0x7f) {
          b = 2;
          otherCount++;
          bg = "bg-sky-200";
        } else {
          asciiCount++;
        }
        utf8Total += b;
        return `<span class="${bg} border-2 border-black rounded-lg px-2 py-1 font-thai text-xs"><strong>${ch}</strong> <span class="font-notch text-[10px]">(${b}B)</span></span>`;
      });

      if (breakdown) breakdown.innerHTML = pills.join("");

      let encoded = "-";
      try {
        encoded = btoa(unescape(encodeURIComponent(text))) || "-";
      } catch (_) {
        encoded = "-";
      }

      if (stepBreakdown) {
        stepBreakdown.innerHTML = `
          <div class="calc-step-box bg-emerald-100 border-2 border-black rounded-xl p-3">
            <div class="font-notch font-bold text-xs bg-zinc-900 text-white inline-block px-2 py-0.5 rounded mb-1">STEP 01 • UTF-8 BYTE CALC</div>
            <div class="font-thai text-xs text-zinc-800">ไทย ${thaiCount} ตัว (x3 = ${thaiCount * 3}B) + อังกฤษ/เลข ${asciiCount} ตัว (x1 = ${asciiCount}B)</div>
            <div class="font-notch font-bold text-xl text-emerald-950 mt-1">= ${utf8Total} Bytes</div>
          </div>
          <div class="calc-step-box bg-amber-100 border-2 border-black rounded-xl p-3">
            <div class="font-notch font-bold text-xs bg-zinc-900 text-white inline-block px-2 py-0.5 rounded mb-1">STEP 02 • TIS-620 (1 BYTE/CHAR)</div>
            <div class="font-thai text-xs text-zinc-800">นับจำนวนอักขระทั้งหมด ${chars.length} ตัว x 1 Byte</div>
            <div class="font-notch font-bold text-xl text-amber-950 mt-1">= ${tisTotal} Bytes</div>
          </div>
          <div class="calc-step-box bg-sky-100 border-2 border-black rounded-xl p-3">
            <div class="font-notch font-bold text-xs bg-zinc-900 text-white inline-block px-2 py-0.5 rounded mb-1">STEP 03 • BASE64 ENCODED</div>
            <div class="font-notch font-bold text-xs text-blue-950 mt-1 break-all">${encoded}</div>
          </div>
        `;
      }
    };

    inp?.addEventListener("input", () => calcBytes(true));
    calcBytes(false);
  }

  /* ==========================================================================
     UNIT 15: เครื่องคำนวณเปอร์เซ็นต์การบีบอัดข้อมูล & ตัวเข้ารหัส RLE แบบ Step-by-Step
     ========================================================================== */
  function renderUnit15CompressionRleLab(container, unitId) {
    let pixelRow = ["W", "W", "W", "W", "W", "B", "B", "B", "W", "W", "W", "W"];

    container.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white brutal-border rounded-2xl p-4 space-y-3">
          <span class="font-notch font-bold text-xs bg-emerald-400 px-2.5 py-0.5 rounded border border-black">
            INTERACTIVE RLE PIXEL STRIP & STEP-BY-STEP MATH
          </span>
          <p class="font-thai text-xs text-zinc-700">
            <strong>คลิกที่ช่องพิกเซลด้านล่าง</strong> เพื่อสลับสีขาว (W) / ดำ (B) แล้วดูวิธีคำนวณการบีบอัดแบบ <strong>Run-Length Encoding (RLE)</strong> และเปอร์เซ็นต์พื้นที่ที่ประหยัดได้ทีละขั้น:
          </p>

          <div id="u15-pixel-strip" class="grid grid-cols-6 sm:grid-cols-12 gap-1.5"></div>

          <div id="u15-rle-summary" class="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 font-thai text-xs sm:text-sm"></div>
        </div>
      </div>
    `;

    const stripEl = container.querySelector("#u15-pixel-strip");
    const summaryEl = container.querySelector("#u15-rle-summary");

    const updateRle = (interacted = false) => {
      if (interacted) {
        playSimSound("click");
        notifyLabInteraction(unitId);
      }

      if (stripEl) {
        stripEl.innerHTML = pixelRow
          .map(
            (val, idx) => `
          <button
            type="button"
            data-px-idx="${idx}"
            class="h-11 rounded-lg border-2 border-black font-notch font-bold text-xs transition-transform active:scale-95 ${
              val === "W" ? "bg-white text-black" : "bg-zinc-900 text-white"
            }"
          >
            ${val}
          </button>
        `
          )
          .join("");

        stripEl.querySelectorAll("[data-px-idx]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const i = Number(btn.getAttribute("data-px-idx"));
            pixelRow[i] = pixelRow[i] === "W" ? "B" : "W";
            updateRle(true);
          });
        });
      }

      const rawStr = pixelRow.join("");
      const rleStr = rawStr.replace(/(.)\1*/g, (m, c) => `${m.length}${c}`);
      const origSize = rawStr.length;
      const compSize = rleStr.length;
      const savedChars = origSize - compSize;
      const savings = Math.round((savedChars / origSize) * 100);
      const ratio = (origSize / compSize).toFixed(2);

      if (summaryEl) {
        summaryEl.innerHTML = `
          <div class="calc-step-box bg-amber-50 border-2 border-black rounded-xl p-3">
            <div class="font-notch font-bold text-xs bg-zinc-900 text-white inline-block px-2 py-0.5 rounded mb-1">STEP 01 • RAW DATA</div>
            <div>ข้อมูลดิบ (${origSize} ตัวอักษร):</div>
            <code class="font-notch font-bold bg-white px-1.5 py-0.5 rounded border border-black inline-block mt-1">${rawStr}</code>
          </div>
          <div class="calc-step-box bg-emerald-50 border-2 border-black rounded-xl p-3">
            <div class="font-notch font-bold text-xs bg-zinc-900 text-white inline-block px-2 py-0.5 rounded mb-1">STEP 02 • RLE ENCODING</div>
            <div>ยุบตัวซ้ำเหลือ (${compSize} ตัวอักษร):</div>
            <code class="font-notch font-bold bg-emerald-300 px-2 py-0.5 rounded border border-black inline-block mt-1">${rleStr}</code>
          </div>
          <div class="calc-step-box bg-sky-100 border-2 border-black rounded-xl p-3">
            <div class="font-notch font-bold text-xs bg-zinc-900 text-white inline-block px-2 py-0.5 rounded mb-1">STEP 03 • SPACE SAVINGS %</div>
            <div>สูตร: <code>((${origSize} - ${compSize}) / ${origSize}) x 100</code></div>
            <div class="mt-1">อัตราส่วน <strong class="font-notch">${ratio} : 1</strong> • ประหยัด <strong class="font-notch text-emerald-900">${savings}%</strong></div>
          </div>
        `;
      }
    };

    updateRle(false);
  }
})();
