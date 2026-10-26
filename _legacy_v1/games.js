/**
 * ============================================================================
 * games.js — ระบบมินิเกมประจำหมวดทั้ง 4 เกม (เกมละ 10 คะแนน รวม 40 คะแนน)
 * รายวิชา: เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์ (รหัสวิชา 21901-2017)
 * ระดับชั้น: ปวช.1 | ธีม: Neo-Brutalism (Stwedy Arcade) | Zero-Emoji Edition
 * ============================================================================
 * รายชื่อมินิเกมทั้ง 4 เกม:
 * 1. Cashier Rush (ท้ายหมวดบาร์โค้ด)       — เลือกหัวสแกนให้ตรงกับสินค้าและสถานการณ์ทันเวลา
 * 2. Cyber Detective (ท้ายหมวด QR & ความปลอดภัย) — ส่องแว่นขยายจับผิด Quishing & กู้ระบบด้วย Check Digit
 * 3. Vault Hacker (ท้ายหมวด RFID & ชีวมิติ) — จูนค่า Threshold (FAR/FRR) & เลือกย่านความถี่ RFID (LF/HF/UHF)
 * 4. Pixel Compressor (ท้ายหมวดฐานข้อมูล & การบีบอัด) — แปลงตารางพิกเซลขาว-ดำเป็นรหัส RLE ก่อนหมดเวลา
 * ============================================================================
 */

(function () {
  window.MINI_GAMES_META = [
    {
      id: "cashier_rush",
      activityId: "Game_Cashier_Rush",
      moduleBadge: "GAME 01 • ท้ายหมวดบาร์โค้ด (หน่วย 5-6)",
      title: "Cashier Rush: แคชเชียร์สายฟ้าเลือกหัวสแกน",
      subtitle:
        "สินค้าไหลมาต่อเนื่อง คลิกเลือกอุปกรณ์สแกน (1D CCD, 2D Imager, Wireless, Fixed Scanner) ให้ถูกงานก่อนหมดเวลา",
      codeBadge: "G01",
      accentBg: "bg-emerald-300",
      maxScore: 10
    },
    {
      id: "cyber_detective",
      activityId: "Game_Cyber_Detective",
      moduleBadge: "GAME 02 • ท้ายหมวด QR & ความปลอดภัย (หน่วย 7-10)",
      title: "Cyber Detective: นักสืบส่อง QR ปลอม & กู้รหัส Check Digit",
      subtitle:
        "ใช้แว่นขยายส่องตรวจ URL แฝงในป้าย QR Code จับผิดเว็บปลอม (Quishing) และคำนวณเลข Check Digit หลักที่ 13 กู้คืนระบบ",
      codeBadge: "G02",
      accentBg: "bg-sky-300",
      maxScore: 10
    },
    {
      id: "vault_hacker",
      activityId: "Game_Vault_Hacker",
      moduleBadge: "GAME 03 • ท้ายหมวด RFID & ชีวมิติ (หน่วย 11-12)",
      title: "Vault Hacker: จูนคลื่น RFID & สแกนนิ้วรักษาความปลอดภัย",
      subtitle:
        "ปรับแถบเลื่อนตั้งค่า Threshold ของเครื่องสแกนชีวมิติ (ควบคุม FAR/FRR) และเลือกคลื่นความถี่ RFID (LF/HF/UHF) ให้ตรงภารกิจ",
      codeBadge: "G03",
      accentBg: "bg-pink-300",
      maxScore: 10
    },
    {
      id: "pixel_compressor",
      activityId: "Game_Pixel_Compressor",
      moduleBadge: "GAME 04 • ท้ายหมวดฐานข้อมูล & การบีบอัด (หน่วย 13-15)",
      title: "Pixel Compressor: นักบีบอัดพิกเซล RLE สายฟ้าแลบ",
      subtitle:
        "แปลงแถวตารางภาพพิกเซลขาว-ดำ (W/B) ให้เป็นรหัสบีบอัด Run-Length Encoding (เช่น 4W2B2W) ให้ถูกต้องก่อนหมดเวลา",
      codeBadge: "G04",
      accentBg: "bg-amber-300",
      maxScore: 10
    }
  ];

  let activeTimerInterval = null;

  function clearGameTimer() {
    if (activeTimerInterval) {
      clearInterval(activeTimerInterval);
      activeTimerInterval = null;
    }
  }

  /**
   * เสียงเอฟเฟกต์สไตล์ตู้เกม Arcade ด้วย Web Audio API
   */
  function playArcadeSound(type = "correct") {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "correct") {
        osc.type = "square";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1174.66, now + 0.07);
        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "combo") {
        osc.type = "square";
        osc.frequency.setValueAtTime(784, now);
        osc.frequency.setValueAtTime(987.77, now + 0.06);
        osc.frequency.setValueAtTime(1318.5, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        osc.start(now);
        osc.stop(now + 0.24);
      } else if (type === "wrong") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.setValueAtTime(170, now + 0.08);
        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "win") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.08);
        osc.frequency.setValueAtTime(783.99, now + 0.16);
        osc.frequency.setValueAtTime(1046.5, now + 0.24);
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
        osc.start(now);
        osc.stop(now + 0.42);
      }
    } catch (_) {
      // Ignore audio block
    }
  }

  /**
   * ฟังก์ชันหลักสำหรับเปิดมินิเกมในหน้าต่าง #game-modal
   */
  window.launchMiniGame = function (gameId, container, onCompleteCallback) {
    clearGameTimer();
    if (!container) return;

    switch (gameId) {
      case "cashier_rush":
        runCashierRushGame(container, onCompleteCallback);
        break;
      case "cyber_detective":
        runCyberDetectiveGame(container, onCompleteCallback);
        break;
      case "vault_hacker":
        runVaultHackerGame(container, onCompleteCallback);
        break;
      case "pixel_compressor":
        runPixelCompressorGame(container, onCompleteCallback);
        break;
      default:
        runCashierRushGame(container, onCompleteCallback);
    }
  };

  /* ==========================================================================
     GAME 1: CASHIER RUSH (ท้ายหมวดบาร์โค้ด — 10 คะแนนเต็ม)
     ========================================================================== */
  function runCashierRushGame(container, onComplete) {
    const stages = [
      {
        itemTitle: "ด่านที่ 1: ลูกค้ายื่นคูปองส่วนลดเป็น QR Code บนหน้าจอมือถือ",
        itemDesc: "หน้าจอมือถือเป็นกระจกสะท้อนแสงและเป็นรหัส 2 มิติ ต้องเลือกหัวสแกนตัวไหนยิงถึงจะติดชัวร์?",
        badge: "ORDER #01 • MOBILE SCREEN",
        correctTool: "imager2d",
        explain: "หัวอ่าน 2D Area Imager ใช้เซนเซอร์ถ่ายภาพ จึงอ่าน QR Code และยิงบาร์โค้ดบนหน้าจอมือถือได้ทันที"
      },
      {
        itemTitle: "ด่านที่ 2: ลังเครื่องจักรหนัก 200 กก. วางอยู่ท้ายโกดังห่างจากคอมฯ 40 เมตร",
        itemDesc: "ยกกล่องมาหน้าคอมพิวเตอร์ไม่ได้ และต้องเดินเช็กสต๊อกหลายชั้นวาง ต้องใช้เครื่องสแกนแบบไหน?",
        badge: "ORDER #02 • WAREHOUSE HEAVY BOX",
        correctTool: "wireless",
        explain: "เครื่องสแกนไร้สาย (Wireless 2.4GHz / Bluetooth พร้อมโหมด Batch) ช่วยให้เดินไปยิงสินค้าไกลจากโต๊ะคอมได้"
      },
      {
        itemTitle: "ด่านที่ 3: คิวจ่ายเงินซูเปอร์มาร์เก็ตตอนเย็น สินค้าบนสายพาน 80 ชิ้น",
        itemDesc: "แคชเชียร์ต้องใช้สองมือหยิบของใส่ถุงอย่างไวโดยไม่ต้องเสียเวลายกปืนขึ้นมากดยิงทีละชิ้น",
        badge: "ORDER #03 • EXPRESS CHECKOUT LANE",
        correctTool: "fixed",
        explain: "เครื่องสแกนแบบฝังโต๊ะ/ตั้งโต๊ะ (Fixed Scanner) ยิงลำแสงอัตโนมัติ ช่วยให้ใช้สองมือหยิบสินค้าผ่านหน้ากระจกได้เลย"
      },
      {
        itemTitle: "ด่านที่ 4: ป้ายสติกเกอร์บาร์โค้ด 1 มิติ (EAN-13) บนสมุดรายงานในร้านเครื่องเขียน",
        itemDesc: "ร้านเล็กๆ งบประหยัด ต้องการหัวอ่านที่ยิงบาร์โค้ดแท่ง 1 มิติบนกระดาษได้แม่นยำและทนทาน",
        badge: "ORDER #04 • PAPER 1D BARCODE",
        correctTool: "ccd1d",
        explain: "หัวอ่าน 1D CCD Linear Imager ราคาประหยัด ทนทาน และอ่านบาร์โค้ดแท่ง 1 มิติบนกระดาษได้ดีเยี่ยม"
      },
      {
        itemTitle: "ด่านที่ 5: ลูกค้ายื่น E-Ticket คอนเสิร์ตเป็น QR Code บนหน้าปัดนาฬิกาสมาร์ตวอตช์",
        itemDesc: "หน้าปัดเล็กและเอียง 45 องศา ต้องใช้หัวอ่านที่สแกนได้ 360 องศาและอ่านจากจอดิจิทัลได้",
        badge: "ORDER #05 • SMARTWATCH QR TICKET",
        correctTool: "imager2d",
        explain: "2D Area Imager สแกนได้ทุกองศา 360 องศา และอ่านรหัส 2 มิติจากหน้าจอนาฬิกาหรือมือถือได้ทันที"
      }
    ];

    const scannerTools = [
      {
        id: "ccd1d",
        name: "1D CCD Linear",
        desc: "ยิงบาร์โค้ดแท่ง 1D บนกระดาษ",
        color: "bg-amber-200",
        code: "1D"
      },
      {
        id: "imager2d",
        name: "2D Area Imager",
        desc: "ถ่ายภาพ 2D อ่านจอมือถือ & QR ได้",
        color: "bg-emerald-300",
        code: "2D"
      },
      {
        id: "wireless",
        name: "Wireless Scanner",
        desc: "ปืนไร้สายเดินเช็กของในโกดัง",
        color: "bg-sky-200",
        code: "WL"
      },
      {
        id: "fixed",
        name: "Fixed Scanner",
        desc: "เครื่องฝังโต๊ะแคชเชียร์สองมือว่าง",
        color: "bg-pink-200",
        code: "FX"
      }
    ];

    let currentIdx = 0;
    let score = 0;
    let combo = 0;
    let timeLeft = 45;

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 bg-zinc-950 text-white brutal-border rounded-2xl p-3.5">
          <div class="flex items-center gap-3">
            <span class="font-notch font-bold text-xs sm:text-sm bg-emerald-400 text-black px-3 py-1 rounded-lg">
              STAGE <span id="cr-stage-num">1</span> / ${stages.length}
            </span>
            <span id="cr-combo-pill" class="hidden combo-bounce bg-pink-400 text-black font-notch font-bold text-xs sm:text-sm px-3 py-1 rounded-full border-2 border-white">
              COMBO x2
            </span>
          </div>

          <div class="flex items-center gap-3">
            <div class="font-notch font-bold text-sm text-amber-300">
              TIME: <span id="cr-timer">${timeLeft}</span>s
            </div>
            <div class="font-notch font-bold text-sm bg-white text-black px-3 py-1 rounded-lg">
              SCORE: <span id="cr-score">0</span> / 10
            </div>
          </div>
        </div>

        <div id="cr-item-card" class="brutal-card bg-amber-50 rounded-2xl p-5 space-y-2 relative overflow-hidden">
          <span id="cr-item-badge" class="font-notch font-bold text-xs bg-amber-300 px-2.5 py-0.5 rounded border border-black">
            ORDER #01
          </span>
          <h4 id="cr-item-title" class="font-thai font-bold text-lg sm:text-xl text-zinc-950"></h4>
          <p id="cr-item-desc" class="font-thai text-xs sm:text-sm text-zinc-700"></p>
        </div>

        <div>
          <p class="font-thai font-semibold text-xs sm:text-sm mb-2">
            คลิกเลือกอุปกรณ์สแกนที่เหมาะกับงานนี้ที่สุด:
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3" id="cr-tools-grid">
            ${scannerTools
              .map(
                (t) => `
              <button
                type="button"
                data-tool="${t.id}"
                class="brutal-btn ${t.color} hover:brightness-105 p-3.5 rounded-2xl text-left flex items-center gap-3 justify-start"
              >
                <span class="w-11 h-11 rounded-xl bg-zinc-950 text-white brutal-border flex items-center justify-center font-notch font-bold text-sm shrink-0">
                  ${t.code}
                </span>
                <div>
                  <div class="font-notch font-bold text-sm text-black">${t.name}</div>
                  <div class="font-thai text-xs text-zinc-800 font-normal">${t.desc}</div>
                </div>
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <div id="cr-feedback-box" class="hidden rounded-xl p-3 brutal-border font-thai text-xs sm:text-sm"></div>
      </div>
    `;

    const stageNumEl = container.querySelector("#cr-stage-num");
    const comboPill = container.querySelector("#cr-combo-pill");
    const timerEl = container.querySelector("#cr-timer");
    const scoreEl = container.querySelector("#cr-score");
    const itemBadge = container.querySelector("#cr-item-badge");
    const itemTitle = container.querySelector("#cr-item-title");
    const itemDesc = container.querySelector("#cr-item-desc");
    const feedbackBox = container.querySelector("#cr-feedback-box");

    const renderStage = () => {
      if (currentIdx >= stages.length) {
        finishGame();
        return;
      }
      const st = stages[currentIdx];
      if (stageNumEl) stageNumEl.textContent = String(currentIdx + 1);
      if (itemBadge) itemBadge.textContent = st.badge;
      if (itemTitle) itemTitle.textContent = st.itemTitle;
      if (itemDesc) itemDesc.textContent = st.itemDesc;
    };

    const finishGame = () => {
      clearGameTimer();
      playArcadeSound("win");
      if (typeof onComplete === "function") {
        onComplete(score, `Cashier Rush ได้ ${score}/10 คะแนน`);
      }
      renderGameSummaryScreen(container, "Cashier Rush", score, 10, () => {
        runCashierRushGame(container, onComplete);
      });
    };

    activeTimerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timerEl) timerEl.textContent = String(Math.max(0, timeLeft));
      if (timeLeft <= 0) {
        finishGame();
      }
    }, 1000);

    container.querySelectorAll("[data-tool]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (currentIdx >= stages.length) return;
        const picked = btn.getAttribute("data-tool");
        const st = stages[currentIdx];

        if (picked === st.correctTool) {
          score += 2;
          combo += 1;
          playArcadeSound(combo >= 2 ? "combo" : "correct");
          if (feedbackBox) {
            feedbackBox.className = "rounded-xl p-3 brutal-border bg-emerald-200 font-thai text-xs sm:text-sm";
            feedbackBox.innerHTML = `<span class="font-notch font-bold bg-emerald-400 px-2 py-0.5 rounded border border-black text-xs mr-1">+2 PTS</span> <strong>เลือกถูกต้อง:</strong> ${st.explain}`;
          }
        } else {
          combo = 0;
          playArcadeSound("wrong");
          if (feedbackBox) {
            feedbackBox.className = "rounded-xl p-3 brutal-border bg-red-200 font-thai text-xs sm:text-sm";
            feedbackBox.innerHTML = `<span class="font-notch font-bold bg-red-500 text-white px-2 py-0.5 rounded border border-black text-xs mr-1">MISS</span> <strong>เลือกผิดอุปกรณ์:</strong> ${st.explain}`;
          }
        }

        if (scoreEl) scoreEl.textContent = String(score);
        if (comboPill) {
          if (combo >= 2) {
            comboPill.textContent = `COMBO x${combo}`;
            comboPill.classList.remove("hidden");
          } else {
            comboPill.classList.add("hidden");
          }
        }

        currentIdx += 1;
        setTimeout(renderStage, 750);
      });
    });

    renderStage();
  }

  /* ==========================================================================
     GAME 2: CYBER DETECTIVE (ท้ายหมวด QR & ความปลอดภัย — 10 คะแนนเต็ม)
     ========================================================================== */
  function runCyberDetectiveGame(container, onComplete) {
    const cases = [
      {
        mode: "quishing",
        title: "คดีที่ 1: ป้าย QR Code รับชำระเงินที่ลานจอดรถมีรอยสติกเกอร์แปะทับ",
        clueUrl: "http://parking-pay-freebonus-login.xyz/steal-card",
        hint: "สังเกตโพรโทคอล http:// (ไม่มี s) และโดเมน .xyz ที่ขอให้กรอกเลขบัตรเครดิต",
        options: [
          "[BLOCK] บล็อกทันที เป็นป้าย QR ปลอมหลอกขโมยข้อมูล (Quishing)",
          "[ALLOW] ปลอดภัย 100% กดกรอกรหัสบัตรเครดิตได้เลย"
        ],
        correct: 0,
        explain: "สติกเกอร์แปะทับที่พาไปโดเมนแปลกปลอมและใช้ http:// คือการโจมตีแบบ Quishing"
      },
      {
        mode: "quishing",
        title: "คดีที่ 2: ป้าย QR Code ลงทะเบียนเข้างานของวิทยาลัยบนบอร์ดประชาสัมพันธ์",
        clueUrl: "https://reg.vec.go.th/student-checkin",
        hint: "ใช้โพรโทคอล https:// มีการเข้ารหัส SSL/TLS และเป็นโดเมนทางการ .go.th",
        options: [
          "[BLOCK] อันตราย เป็นไวรัสทำลายฮาร์ดดิสก์",
          "[ALLOW] ปลอดภัย เป็นลิงก์ HTTPS ทางการของหน่วยงาน"
        ],
        correct: 1,
        explain: "ลิงก์ใช้ HTTPS เข้ารหัสปลอดภัยและชื่อโดเมนตรงกับหน่วยงานจริง"
      },
      {
        mode: "quishing",
        title: "คดีที่ 3: อีเมลแจ้งเตือนพัสดุตกค้างแนบ QR Code ให้สแกนรับเงินคืนด่วน",
        clueUrl: "https://thai-post-refund-vip99.top/login-bank",
        hint: "อ้างเป็นไปรษณีย์แต่ใช้โดเมน .top และหลอกให้กรอกรหัสผ่านแอปธนาคาร",
        options: [
          "[BLOCK] บล็อกทันที เป็นเว็บฟิชชิ่งแอบอ้างหลอกดูดเงิน (Quishing)",
          "[ALLOW] ปลอดภัย รีบกรอกรหัสผ่านธนาคารเพื่อรับเงินคืน"
        ],
        correct: 0,
        explain: "มิจฉาชีพชอบตั้งชื่อเว็บให้คล้ายของจริงแต่ลงท้ายด้วยโดเมนแปลกๆ เพื่อหลอกเอาข้อมูล"
      },
      {
        mode: "checkdigit",
        title: "คดีที่ 4: กู้คืนฐานข้อมูลสินค้าไทย รหัส EAN-12 คือ 885012345678",
        clueUrl: "ผลรวมถ่วงน้ำหนัก (คูณ 1 และคูณ 3 สลับกัน) คำนวณได้ = 132",
        hint: "จำนวนเต็มสิบถัดไปของ 132 คือ 140 ดังนั้นเลข Check Digit หลักที่ 13 คือ 140 - 132",
        options: [
          "เลขตรวจสอบหลักที่ 13 คือ เลข 8 (เพราะ 140 - 132 = 8)",
          "เลขตรวจสอบหลักที่ 13 คือ เลข 2 (เพราะลงท้ายด้วย 2)",
          "เลขตรวจสอบหลักที่ 13 คือ เลข 0",
          "เลขตรวจสอบหลักที่ 13 คือ เลข 5"
        ],
        correct: 0,
        explain: "ผลรวมคือ 132 ขาดอีก 8 จะครบ 140 ดังนั้น Check Digit หลักที่ 13 คือ 8"
      },
      {
        mode: "checkdigit",
        title: "คดีที่ 5: ปลดล็อกประตูคลังสินค้า รหัส 12 หลักคำนวณผลรวมถ่วงน้ำหนักได้ = 150 พอดี",
        clueUrl: "ผลรวมถ่วงน้ำหนัก (Sum) = 150 (หารด้วย 10 ลงตัวอยู่แล้ว)",
        hint: "ถ้าผลรวมหารด้วย 10 ลงตัวเป๊ะ (เศษเป็น 0) เลข Check Digit หลักที่ 13 จะเป็นเลขอะไร?",
        options: [
          "เลข 9",
          "เลข 5",
          "เลข 0 (เพราะผลรวมหาร 10 ลงตัวพอดี)",
          "เลข 1"
        ],
        correct: 2,
        explain: "เมื่อผลรวมหารด้วย 10 ลงตัวอยู่แล้ว เลข Check Digit หลักที่ 13 จะเท่ากับ 0 เสมอ"
      }
    ];

    let idx = 0;
    let score = 0;

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between bg-zinc-950 text-white brutal-border rounded-2xl p-3.5">
          <span class="font-notch font-bold text-xs sm:text-sm bg-sky-300 text-black px-3 py-1 rounded-lg">
            CASE <span id="cd-case-num">1</span> / ${cases.length}
          </span>
          <span class="font-notch font-bold text-sm bg-amber-300 text-black px-3 py-1 rounded-lg">
            SCORE: <span id="cd-score">0</span> / 10 PTS
          </span>
        </div>

        <div class="brutal-card bg-white rounded-2xl p-5 space-y-3">
          <h4 id="cd-title" class="font-thai font-bold text-base sm:text-lg text-zinc-950"></h4>

          <div class="bg-sky-50 border-2 border-black rounded-xl p-3.5 space-y-2">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <span class="font-notch font-bold text-xs bg-white px-2 py-0.5 rounded border border-black">
                URL & CHECKSUM INSPECTOR
              </span>
              <button id="cd-inspect-btn" type="button" class="brutal-btn bg-amber-300 hover:bg-amber-200 px-3 py-1 rounded-lg text-xs font-thai">
                [INSPECT] กดส่องดูคำใบ้เชิงลึก
              </button>
            </div>
            <div id="cd-url-box" class="bg-zinc-950 text-emerald-400 font-notch text-xs sm:text-sm p-3 rounded-lg break-all"></div>
            <p id="cd-hint-text" class="hidden font-thai text-xs text-amber-950 bg-amber-200 p-2 rounded-lg border border-black"></p>
          </div>

          <div id="cd-options" class="grid grid-cols-1 gap-2.5 pt-1"></div>
          <div id="cd-feedback" class="hidden rounded-xl p-3 brutal-border font-thai text-xs sm:text-sm"></div>
        </div>
      </div>
    `;

    const caseNumEl = container.querySelector("#cd-case-num");
    const scoreEl = container.querySelector("#cd-score");
    const titleEl = container.querySelector("#cd-title");
    const urlBox = container.querySelector("#cd-url-box");
    const hintText = container.querySelector("#cd-hint-text");
    const inspectBtn = container.querySelector("#cd-inspect-btn");
    const optionsEl = container.querySelector("#cd-options");
    const feedbackEl = container.querySelector("#cd-feedback");

    const loadCase = () => {
      if (idx >= cases.length) {
        playArcadeSound("win");
        if (typeof onComplete === "function") {
          onComplete(score, `Cyber Detective ได้ ${score}/10 คะแนน`);
        }
        renderGameSummaryScreen(container, "Cyber Detective", score, 10, () => {
          runCyberDetectiveGame(container, onComplete);
        });
        return;
      }

      const c = cases[idx];
      if (caseNumEl) caseNumEl.textContent = String(idx + 1);
      if (titleEl) titleEl.textContent = c.title;
      if (urlBox) urlBox.textContent = c.clueUrl;
      if (hintText) {
        hintText.textContent = `[CLUE]: ${c.hint}`;
        hintText.classList.add("hidden");
      }

      if (optionsEl) {
        optionsEl.innerHTML = c.options
          .map(
            (opt, oIdx) => `
          <button
            type="button"
            data-cd-opt="${oIdx}"
            class="brutal-btn bg-zinc-50 hover:bg-emerald-200 p-3 rounded-xl font-thai text-xs sm:text-sm text-left justify-start"
          >
            ${opt}
          </button>
        `
          )
          .join("");

        optionsEl.querySelectorAll("[data-cd-opt]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const pick = Number(btn.getAttribute("data-cd-opt"));
            if (pick === c.correct) {
              score += 2;
              playArcadeSound("correct");
              if (feedbackEl) {
                feedbackEl.className = "rounded-xl p-3 brutal-border bg-emerald-200 font-thai text-xs sm:text-sm";
                feedbackEl.innerHTML = `<span class="font-notch font-bold bg-emerald-400 px-2 py-0.5 rounded border border-black text-xs mr-1">+2 PTS</span> <strong>วินิจฉัยถูกต้อง:</strong> ${c.explain}`;
              }
            } else {
              playArcadeSound("wrong");
              if (feedbackEl) {
                feedbackEl.className = "rounded-xl p-3 brutal-border bg-red-200 font-thai text-xs sm:text-sm";
                feedbackEl.innerHTML = `<span class="font-notch font-bold bg-red-500 text-white px-2 py-0.5 rounded border border-black text-xs mr-1">WRONG</span> <strong>พลาดไปนิด:</strong> ${c.explain}`;
              }
            }
            if (scoreEl) scoreEl.textContent = String(score);
            idx += 1;
            setTimeout(loadCase, 900);
          });
        });
      }
    };

    inspectBtn?.addEventListener("click", () => {
      playArcadeSound("correct");
      hintText?.classList.remove("hidden");
    });

    loadCase();
  }

  /* ==========================================================================
     GAME 3: VAULT HACKER (ท้ายหมวด RFID & ชีวมิติ — 10 คะแนนเต็ม)
     ========================================================================== */
  function runVaultHackerGame(container, onComplete) {
    const missions = [
      {
        title: "ภารกิจที่ 1: ห้องนิรภัยทองคำธนาคารแห่งชาติ (ต้องการความปลอดภัยสูงสุด)",
        brief:
          "ห้ามคนแปลกหน้าสแกนนิ้วผ่านเด็ดขาด (ต้องกดค่า FAR ให้ต่ำที่สุด) และใช้บัตรแตะระยะประชิดหน้าประตูเท่านั้น",
        minThresh: 75,
        maxThresh: 95,
        targetFreq: "HF",
        explain: "ห้องนิรภัยต้องตั้ง Threshold สูง (75%-95%) เพื่อป้องกันคนปลอม (FAR ต่ำสุด) คู่กับบัตรสมาร์ตการ์ด HF/NFC 13.56MHz"
      },
      {
        title: "ภารกิจที่ 2: ด่านเก็บเงินทางด่วนอัตโนมัติ (รถวิ่งผ่านเร็ว 60 กม./ชม.)",
        brief:
          "ต้องอ่านแท็กจากหน้ารถในระยะไกลหลายเมตร และตั้งค่าความเข้มงวดชีวมิติของพนักงานคุมด่านให้อยู่ในจุดสมดุล (EER 45% - 60%)",
        minThresh: 45,
        maxThresh: 60,
        targetFreq: "UHF",
        explain: "ระยะไกลหลายเมตรและอ่านไวต้องใช้คลื่น UHF (860-960 MHz) และตั้งค่าสมดุล EER ประมาณ 50%"
      },
      {
        title: "ภารกิจที่ 3: คลินิกสัตวแพทย์สแกนไมโครชิปที่ฝังใต้ผิวหนังสัตว์เลี้ยง",
        brief:
          "ต้องใช้คลื่นความถี่ต่ำที่ทะลุผ่านน้ำและเนื้อเยื่อร่างกายได้ดีในระยะประชิด และตั้งค่า Threshold มาตรฐาน (45% - 65%)",
        minThresh: 45,
        maxThresh: 65,
        targetFreq: "LF",
        explain: "ไมโครชิปฝังสัตว์เลี้ยงใช้คลื่นความถี่ต่ำ LF (125-134 kHz) เพราะไม่ถูกรบกวนโดยน้ำและเนื้อเยื่อ"
      },
      {
        title: "ภารกิจที่ 4: ประตูโรงอาหารโรงเรียนตอนพักเที่ยง (นักเรียนต่อคิว 800 คน)",
        brief:
          "ต้องเน้นความรวดเร็ว ลดโอกาสที่นักเรียนตัวจริงจะสแกนไม่ผ่าน (ลด FRR โดยตั้ง Threshold ผ่อนปรน 20% - 40%) และแตะบัตรนักศึกษาระยะใกล้",
        minThresh: 20,
        maxThresh: 40,
        targetFreq: "HF",
        explain: "การลดค่า FRR เพื่อให้เจ้าของตัวจริงสแกนผ่านไวต้องปรับ Threshold ลงมาช่วง 20%-40% คู่กับบัตร HF 13.56MHz"
      },
      {
        title: "ภารกิจที่ 5: ประตูคลังสินค้าอัจฉริยะสแกนพัสดุ 150 กล่องพร้อมกันบนรถโฟล์คลิฟต์",
        brief:
          "ต้องอ่านแท็กจำนวนมากพร้อมกันในระยะ 5 เมตร และตั้งค่าความปลอดภัยห้องควบคุมระดับสูง (70% - 90%)",
        minThresh: 70,
        maxThresh: 90,
        targetFreq: "UHF",
        explain: "การอ่านพัสดุหลายร้อยชิ้นพร้อมกันในระยะหลายเมตรคือจุดเด่นของ RFID ย่าน UHF"
      }
    ];

    let mIdx = 0;
    let score = 0;
    let selectedFreq = "HF";

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between bg-zinc-950 text-white brutal-border rounded-2xl p-3.5">
          <span class="font-notch font-bold text-xs sm:text-sm bg-pink-300 text-black px-3 py-1 rounded-lg">
            MISSION <span id="vh-num">1</span> / ${missions.length}
          </span>
          <span class="font-notch font-bold text-sm bg-emerald-400 text-black px-3 py-1 rounded-lg">
            SCORE: <span id="vh-score">0</span> / 10 PTS
          </span>
        </div>

        <div class="brutal-card bg-white rounded-2xl p-5 space-y-4">
          <div class="bg-pink-50 border-2 border-black rounded-xl p-3.5">
            <h4 id="vh-title" class="font-thai font-bold text-base sm:text-lg text-zinc-950"></h4>
            <p id="vh-brief" class="font-thai text-xs sm:text-sm text-zinc-700 mt-1"></p>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="font-thai font-bold text-xs sm:text-sm">
                STEP 1: ปรับแถบเลื่อนความเข้มงวดชีวมิติ (Security Threshold):
              </label>
              <span id="vh-thresh-badge" class="font-notch font-bold text-sm bg-amber-300 px-2.5 py-0.5 rounded border border-black">
                50%
              </span>
            </div>
            <input id="vh-slider" type="range" min="15" max="90" value="50" class="brutal-slider" />
            <div class="flex justify-between text-[11px] font-thai text-zinc-600">
              <span>&larr; ต่ำ (20-40%: ลด FRR ผ่านไว)</span>
              <span>สมดุล EER (45-60%)</span>
              <span>สูง (70-90%: กด FAR ปลอดภัยสูงสุด) &rarr;</span>
            </div>
          </div>

          <div class="space-y-2">
            <label class="block font-thai font-bold text-xs sm:text-sm">
              STEP 2: เลือกย่านความถี่คลื่น RFID ให้เหมาะกับหน้างาน:
            </label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button type="button" data-vh-freq="LF" class="vh-freq-btn brutal-btn bg-white py-2.5 px-3 rounded-xl font-thai text-xs">
                <strong>[LF] 125 kHz</strong><br/>ทะลุเนื้อเยื่อ/ชิปสัตว์เลี้ยง
              </button>
              <button type="button" data-vh-freq="HF" class="vh-freq-btn brutal-btn bg-amber-300 py-2.5 px-3 rounded-xl font-thai text-xs">
                <strong>[HF] NFC 13.56 MHz</strong><br/>บัตรแตะระยะใกล้/สมาร์ตการ์ด
              </button>
              <button type="button" data-vh-freq="UHF" class="vh-freq-btn brutal-btn bg-white py-2.5 px-3 rounded-xl font-thai text-xs">
                <strong>[UHF] 860-960 MHz</strong><br/>ระยะไกล/ทางด่วน/โกดัง
              </button>
            </div>
          </div>

          <div id="vh-feedback" class="hidden rounded-xl p-3 brutal-border font-thai text-xs sm:text-sm"></div>

          <button id="vh-submit-btn" type="button" class="w-full brutal-btn bg-emerald-400 hover:bg-emerald-300 py-3 rounded-2xl text-sm sm:text-base font-thai">
            [CONFIRM SECURITY CONFIG] ยืนยันการตั้งค่าระบบ
          </button>
        </div>
      </div>
    `;

    const numEl = container.querySelector("#vh-num");
    const scoreEl = container.querySelector("#vh-score");
    const titleEl = container.querySelector("#vh-title");
    const briefEl = container.querySelector("#vh-brief");
    const slider = container.querySelector("#vh-slider");
    const threshBadge = container.querySelector("#vh-thresh-badge");
    const feedbackEl = container.querySelector("#vh-feedback");
    const submitBtn = container.querySelector("#vh-submit-btn");

    const loadMission = () => {
      if (mIdx >= missions.length) {
        playArcadeSound("win");
        if (typeof onComplete === "function") {
          onComplete(score, `Vault Hacker ได้ ${score}/10 คะแนน`);
        }
        renderGameSummaryScreen(container, "Vault Hacker", score, 10, () => {
          runVaultHackerGame(container, onComplete);
        });
        return;
      }
      const m = missions[mIdx];
      if (numEl) numEl.textContent = String(mIdx + 1);
      if (titleEl) titleEl.textContent = m.title;
      if (briefEl) briefEl.textContent = m.brief;
    };

    slider?.addEventListener("input", () => {
      if (threshBadge) threshBadge.textContent = `${slider.value}%`;
    });

    container.querySelectorAll(".vh-freq-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedFreq = btn.getAttribute("data-vh-freq");
        playArcadeSound("correct");
        container.querySelectorAll(".vh-freq-btn").forEach((b) => {
          b.className = `vh-freq-btn brutal-btn ${
            b === btn ? "bg-amber-300" : "bg-white"
          } py-2.5 px-3 rounded-xl font-thai text-xs`;
        });
      });
    });

    submitBtn?.addEventListener("click", () => {
      if (mIdx >= missions.length) return;
      const m = missions[mIdx];
      const tVal = Number(slider ? slider.value : 50);
      const isThreshOk = tVal >= m.minThresh && tVal <= m.maxThresh;
      const isFreqOk = selectedFreq === m.targetFreq;

      if (isThreshOk && isFreqOk) {
        score += 2;
        playArcadeSound("combo");
        if (feedbackEl) {
          feedbackEl.className = "rounded-xl p-3 brutal-border bg-emerald-200 font-thai text-xs sm:text-sm";
          feedbackEl.innerHTML = `<span class="font-notch font-bold bg-emerald-400 px-2 py-0.5 rounded border border-black text-xs mr-1">+2 PTS</span> <strong>ตั้งค่าระบบสมบูรณ์แบบ:</strong> ${m.explain}`;
        }
      } else if (isThreshOk || isFreqOk) {
        score += 1;
        playArcadeSound("correct");
        if (feedbackEl) {
          feedbackEl.className = "rounded-xl p-3 brutal-border bg-amber-200 font-thai text-xs sm:text-sm";
          feedbackEl.innerHTML = `<span class="font-notch font-bold bg-amber-300 px-2 py-0.5 rounded border border-black text-xs mr-1">+1 PT</span> <strong>ถูกครึ่งหนึ่ง:</strong> ${m.explain}`;
        }
      } else {
        playArcadeSound("wrong");
        if (feedbackEl) {
          feedbackEl.className = "rounded-xl p-3 brutal-border bg-red-200 font-thai text-xs sm:text-sm";
          feedbackEl.innerHTML = `<span class="font-notch font-bold bg-red-500 text-white px-2 py-0.5 rounded border border-black text-xs mr-1">MISS</span> <strong>ยังไม่ตรงภารกิจ:</strong> ${m.explain}`;
        }
      }

      if (scoreEl) scoreEl.textContent = String(score);
      mIdx += 1;
      setTimeout(loadMission, 950);
    });

    loadMission();
  }

  /* ==========================================================================
     GAME 4: PIXEL COMPRESSOR (ท้ายหมวดฐานข้อมูล & การบีบอัด — 10 คะแนนเต็ม)
     ========================================================================== */
  function runPixelCompressorGame(container, onComplete) {
    const puzzles = [
      {
        pixels: ["W", "W", "W", "W", "B", "B", "W", "W"],
        answer: "4W2B2W",
        choices: ["4W2B2W", "2W4B2W", "6W2B", "4B2W2B"]
      },
      {
        pixels: ["B", "B", "B", "W", "W", "W", "W", "W"],
        answer: "3B5W",
        choices: ["5B3W", "3B5W", "8BW", "3W5B"]
      },
      {
        pixels: ["W", "W", "B", "B", "B", "B", "W", "W"],
        answer: "2W4B2W",
        choices: ["4W4B", "2W4B2W", "2B4W2B", "8W"]
      },
      {
        pixels: ["B", "B", "W", "W", "B", "B", "W", "W"],
        answer: "2B2W2B2W",
        choices: ["4B4W", "2B2W2B2W", "2W2B2W2B", "8BW"]
      },
      {
        pixels: ["W", "W", "W", "W", "W", "W", "B", "B"],
        answer: "6W2B",
        choices: ["6W2B", "2W6B", "8WB", "5W3B"]
      }
    ];

    let pIdx = 0;
    let score = 0;
    let timeLeft = 45;

    container.innerHTML = `
      <div class="space-y-4">
        <div class="flex items-center justify-between bg-zinc-950 text-white brutal-border rounded-2xl p-3.5">
          <span class="font-notch font-bold text-xs sm:text-sm bg-amber-300 text-black px-3 py-1 rounded-lg">
            PATTERN <span id="pc-num">1</span> / ${puzzles.length}
          </span>
          <div class="flex items-center gap-3">
            <span class="font-notch font-bold text-sm text-amber-300">
              TIME: <span id="pc-timer">${timeLeft}</span>s
            </span>
            <span class="font-notch font-bold text-sm bg-emerald-400 text-black px-3 py-1 rounded-lg">
              SCORE: <span id="pc-score">0</span> / 10
            </span>
          </div>
        </div>

        <div class="brutal-card bg-white rounded-2xl p-5 space-y-4">
          <p class="font-thai font-bold text-sm sm:text-base text-zinc-900">
            นับจำนวนช่องสีขาว (W) และสีดำ (B) ที่เรียงซ้ำติดกัน แล้วเลือกรหัสบีบอัด <strong>Run-Length Encoding (RLE)</strong> ที่ถูกต้อง:
          </p>

          <div id="pc-pixel-grid" class="grid grid-cols-8 gap-2 p-3 bg-zinc-100 brutal-border rounded-2xl"></div>

          <div id="pc-choices" class="grid grid-cols-2 gap-3"></div>

          <div id="pc-feedback" class="hidden rounded-xl p-3 brutal-border font-thai text-xs sm:text-sm"></div>
        </div>
      </div>
    `;

    const numEl = container.querySelector("#pc-num");
    const timerEl = container.querySelector("#pc-timer");
    const scoreEl = container.querySelector("#pc-score");
    const gridEl = container.querySelector("#pc-pixel-grid");
    const choicesEl = container.querySelector("#pc-choices");
    const feedbackEl = container.querySelector("#pc-feedback");

    const finishGame = () => {
      clearGameTimer();
      playArcadeSound("win");
      if (typeof onComplete === "function") {
        onComplete(score, `Pixel Compressor ได้ ${score}/10 คะแนน`);
      }
      renderGameSummaryScreen(container, "Pixel Compressor", score, 10, () => {
        runPixelCompressorGame(container, onComplete);
      });
    };

    const loadPuzzle = () => {
      if (pIdx >= puzzles.length) {
        finishGame();
        return;
      }
      const pz = puzzles[pIdx];
      if (numEl) numEl.textContent = String(pIdx + 1);

      if (gridEl) {
        gridEl.innerHTML = pz.pixels
          .map(
            (px, i) => `
          <div class="h-14 rounded-xl border-2 border-black flex flex-col items-center justify-center font-notch font-bold ${
            px === "W" ? "bg-white text-black" : "bg-zinc-950 text-white"
          }">
            <span class="text-sm">${px}</span>
            <span class="text-[10px] opacity-60">#${i + 1}</span>
          </div>
        `
          )
          .join("");
      }

      if (choicesEl) {
        choicesEl.innerHTML = pz.choices
          .map(
            (ch) => `
          <button
            type="button"
            data-rle="${ch}"
            class="brutal-btn bg-amber-200 hover:bg-emerald-300 py-3 rounded-xl font-notch font-bold text-base"
          >
            ${ch}
          </button>
        `
          )
          .join("");

        choicesEl.querySelectorAll("[data-rle]").forEach((btn) => {
          btn.addEventListener("click", () => {
            const val = btn.getAttribute("data-rle");
            if (val === pz.answer) {
              score += 2;
              playArcadeSound("combo");
              if (feedbackEl) {
                feedbackEl.className = "rounded-xl p-3 brutal-border bg-emerald-200 font-thai text-xs sm:text-sm";
                feedbackEl.innerHTML = `<span class="font-notch font-bold bg-emerald-400 px-2 py-0.5 rounded border border-black text-xs mr-1">+2 PTS</span> <strong>บีบอัดสำเร็จ:</strong> แถวพิกเซล <code>${pz.pixels.join(
                  ""
                )}</code> ยุบเป็น <strong>${pz.answer}</strong>`;
              }
            } else {
              playArcadeSound("wrong");
              if (feedbackEl) {
                feedbackEl.className = "rounded-xl p-3 brutal-border bg-red-200 font-thai text-xs sm:text-sm";
                feedbackEl.innerHTML = `<span class="font-notch font-bold bg-red-500 text-white px-2 py-0.5 rounded border border-black text-xs mr-1">MISS</span> <strong>ยังไม่ถูก:</strong> คำตอบที่ถูกคือ <strong>${pz.answer}</strong>`;
              }
            }
            if (scoreEl) scoreEl.textContent = String(score);
            pIdx += 1;
            setTimeout(loadPuzzle, 650);
          });
        });
      }
    };

    activeTimerInterval = setInterval(() => {
      timeLeft -= 1;
      if (timerEl) timerEl.textContent = String(Math.max(0, timeLeft));
      if (timeLeft <= 0) {
        finishGame();
      }
    }, 1000);

    loadPuzzle();
  }

  /* ==========================================================================
     SHARED END-OF-GAME SUMMARY SCREEN
     ========================================================================== */
  function renderGameSummaryScreen(container, gameTitle, earnedScore, maxScore, onReplay) {
    const passed = earnedScore >= 7;
    container.innerHTML = `
      <div class="brutal-card ${
        passed ? "bg-emerald-100" : "bg-amber-100"
      } rounded-3xl p-6 sm:p-8 text-center space-y-4">
        <div class="inline-block bg-white brutal-border brutal-shadow-sm px-4 py-1 rounded-full font-notch font-bold text-xs">
          ARCADE MISSION COMPLETE
        </div>
        <h3 class="font-thai font-bold text-2xl sm:text-3xl text-zinc-950">
          ${passed ? "ยอดเยี่ยมมาก เคลียร์ภารกิจสำเร็จ" : "เกือบเต็มแล้ว ลองแก้มืออีกรอบได้เลย"}
        </h3>
        <p class="font-thai text-sm text-zinc-700">
          คะแนนที่คุณทำได้ในเกม <strong>${gameTitle}</strong> รอบนี้:
        </p>
        <div class="inline-block bg-amber-300 brutal-border-thick brutal-shadow px-8 py-4 rounded-2xl font-notch font-bold text-4xl">
          ${earnedScore} / ${maxScore} PTS
        </div>
        <p class="font-thai text-xs sm:text-sm text-zinc-700 max-w-md mx-auto">
          ระบบได้บันทึกคะแนนสูงสุดของคุณเข้าสู่แดชบอร์ด 100 คะแนนและซิงก์ไปยัง Google Sheets เรียบร้อยแล้ว
        </p>
        <div class="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button id="replay-arcade-btn" type="button" class="brutal-btn bg-emerald-400 hover:bg-emerald-300 px-6 py-3 rounded-2xl text-sm sm:text-base font-thai">
            [REPLAY] เล่นซ้ำเพื่อทำคะแนนเต็ม 10
          </button>
        </div>
      </div>
    `;

    container.querySelector("#replay-arcade-btn")?.addEventListener("click", () => {
      if (typeof onReplay === "function") onReplay();
    });
  }
})();
