/**
 * ============================================================================
 * js/ean13-guide.js — EAN-13 Interactive Step-by-Step Learning Lab & Validator
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * ออกแบบตามหลัก Neo-Brutalism (Stwedy) ผสาน Composite Animation 60fps
 *
 * ฟังก์ชันหลัก:
 * 1. ตัวอย่างที่ 1: คำนวณทีละขั้นตอนอย่างละเอียด (885123456789 -> Check Digit 8)
 * 2. ตัวอย่างที่ 2: กรณีพิเศษเศษเป็นศูนย์ (885135790246 -> Check Digit 0)
 * 3. ตัวอย่างที่ 3: ตรวจสอบความถูกต้องของบาร์โค้ด (8850010020037 -> INVALID)
 * 4. เครื่องมือทดลองคำนวณ & ตรวจสอบบาร์โค้ดสด (Live Validator & Barcode SVG Generator)
 * ============================================================================
 */

(function () {
  "use strict";

  // EAN-13 Standard Barcode Encoding Tables (GS1 Specifications)
  const L_CODE = [
    "0001101", "0011001", "0010011", "0111101", "0100011",
    "0110001", "0101111", "0111011", "0110111", "0001011"
  ];
  const G_CODE = [
    "0100111", "0110011", "0011011", "0100001", "0011101",
    "0111001", "0000101", "0010001", "0001001", "0010111"
  ];
  const R_CODE = [
    "1110010", "1100110", "1101100", "1000010", "1011100",
    "1001100", "1010000", "1000100", "1001000", "1110100"
  ];
  const FIRST_DIGIT_STRUCTURE = [
    "LLLLLL", "LLGLGG", "LLGGLG", "LLGGGL", "LGLLGG",
    "LGGLLG", "LGGGLL", "LGLGLG", "LGLGGL", "LGGLGL"
  ];

  // Mathematical Calculation Engine
  function calculateEan13(digits12) {
    const raw = String(digits12 || "").replace(/\D/g, "").slice(0, 12);
    if (raw.length !== 12) return null;

    const digits = raw.split("").map(Number);
    const weights = [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3];
    const products = digits.map((num, idx) => num * weights[idx]);

    const oddDigits = [0, 2, 4, 6, 8, 10].map((i) => digits[i]);
    const evenDigits = [1, 3, 5, 7, 9, 11].map((i) => digits[i]);

    const oddSum = oddDigits.reduce((s, v) => s + v, 0);
    const evenSum = evenDigits.reduce((s, v) => s + v, 0);
    const totalSum = products.reduce((s, v) => s + v, 0);

    const remainder = totalSum % 10;
    const checkDigit = remainder === 0 ? 0 : 10 - remainder;
    const nextMultiple10 = Math.ceil(totalSum / 10) * 10;

    return {
      digits12: raw,
      digits,
      weights,
      products,
      oddDigits,
      evenDigits,
      oddSum,
      evenSum,
      totalSum,
      remainder,
      checkDigit,
      nextMultiple10,
      fullCode: raw + checkDigit
    };
  }

  // Generate Real High-Resolution SVG Barcode
  function generateBarcodeSvg(code13, isInvalid = false) {
    const esc = window.AppUtils?.escapeHtml || ((s) => String(s));
    if (!code13 || code13.length !== 13) {
      return `
        <div class="ean13-barcode-placeholder">
          <span>กรุณากรอกตัวเลข 12 หรือ 13 หลักเพื่อสร้างภาพบาร์โค้ด</span>
        </div>
      `;
    }

    const first = Number(code13[0]);
    const struct = FIRST_DIGIT_STRUCTURE[first] || "LLLLLL";
    let pattern = "101"; // Left Guard

    for (let i = 0; i < 6; i++) {
      const d = Number(code13[i + 1]);
      pattern += struct[i] === "L" ? L_CODE[d] : G_CODE[d];
    }
    pattern += "01010"; // Center Guard
    for (let i = 6; i < 12; i++) {
      const d = Number(code13[i + 1]);
      pattern += R_CODE[d];
    }
    pattern += "101"; // Right Guard

    let rects = "";
    const barW = 2.4;
    const startX = 26;

    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === "1") {
        const isGuard = i < 3 || (i >= 45 && i < 50) || i >= 92;
        const h = isGuard ? 74 : 64;
        rects += `<rect x="${(startX + i * barW).toFixed(1)}" y="10" width="${barW}" height="${h}" fill="${isInvalid ? "#ef4444" : "#111827"}" />`;
      }
    }

    return `
      <div class="ean13-barcode-card ${isInvalid ? "is-invalid-barcode" : ""}">
        <svg viewBox="0 0 285 106" class="ean13-barcode-svg" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="EAN-13 Barcode ${esc(code13)}">
          <rect width="285" height="106" fill="white" rx="4" />
          <g fill="${isInvalid ? "#b91c1c" : "#111827"}">
            ${rects}
            <text x="12" y="86" font-family="'Stack Sans Notch', monospace" font-size="14" font-weight="700">${code13[0]}</text>
            <text x="76" y="94" font-family="'Stack Sans Notch', monospace" font-size="13" font-weight="600" letter-spacing="2.8">${code13.slice(1, 7)}</text>
            <text x="174" y="94" font-family="'Stack Sans Notch', monospace" font-size="13" font-weight="600" letter-spacing="2.8">${code13.slice(7, 12)}<tspan fill="${isInvalid ? "#ef4444" : "#2563eb"}" font-weight="800">${code13[12]}</tspan></text>
          </g>
        </svg>
        <div class="ean13-barcode-meta">
          <span class="ean13-meta-tag is-country" title="รหัสประเทศ 3 หลักแรก">🇹🇭 ประเทศ: ${esc(code13.slice(0, 3))}</span>
          <span class="ean13-meta-tag is-product" title="รหัสผู้ผลิตและสินค้า 9 หลักถัดมา">📦 รหัสสินค้า: ${esc(code13.slice(3, 12))}</span>
          <span class="ean13-meta-tag ${isInvalid ? "is-err" : "is-check"}" title="เลขตรวจสอบหลักสุดท้าย">
            ${isInvalid ? "❌" : "🔑"} Check Digit: <strong>${esc(code13[12])}</strong>
          </span>
        </div>
      </div>
    `;
  }

  // Pre-configured Examples Data
  const EXAMPLES_DATA = [
    {
      id: "ex1",
      tabTitle: "ตัวอย่างที่ 1: คำนวณทีละขั้นตอนอย่างละเอียด",
      shortTitle: "ตัวอย่างที่ 1 (885123456789)",
      badge: "ตัวอย่างมาตรฐาน • ละเอียดครบ 7 สเต็ป",
      digits12: "885123456789",
      totalSteps: 7,
      steps: [
        {
          stepNo: 1,
          badge: "ขั้นตอนที่ 1 จาก 7",
          title: "จัดวางตัวเลข 12 หลักตามลำดับตำแหน่ง",
          desc: "นำตัวเลข 12 หลักแรกของรหัสสินค้ามาจัดเรียงในตารางตามตำแหน่งหลักที่ 1 ถึง 12 จากซ้ายไปขวา (ยังไม่รวมหลักที่ 13 ซึ่งเป็น Check Digit ที่เราต้องการหา)",
          focus: "digits",
          revealWeight: false,
          revealProduct: false,
          callout: {
            type: "info",
            title: "ที่มาของตัวเลข 12 หลักแรก",
            text: "ตัวเลข 885123456789 ประกอบด้วย 3 หลักแรก '885' คือรหัสประจำประเทศไทย (GS1 Thailand) และอีก 9 หลักถัดมาคือรหัสประจำตัวผู้ผลิตและรหัสสินค้า"
          }
        },
        {
          stepNo: 2,
          badge: "ขั้นตอนที่ 2 จาก 7",
          title: "กำหนดน้ำหนักตัวคูณประจำตำแหน่ง (คี่ ×1, คู่ ×3)",
          desc: "ตามมาตรฐานสากล GS1 EAN-13 กำหนดให้นำตัวเลขในตำแหน่งคี่คูณด้วย 1 และนำตัวเลขในตำแหน่งคู่คูณด้วย 3 เสมอ",
          focus: "weights",
          revealWeight: true,
          revealProduct: false,
          callout: {
            type: "rule",
            title: "กฎเหล็กการคูณประจำตำแหน่ง (Positional Weighting)",
            text: "• ตำแหน่งคี่ (หลักที่ 1, 3, 5, 7, 9, 11) ให้คูณด้วย 1\n• ตำแหน่งคู่ (หลักที่ 2, 4, 6, 8, 10, 12) ให้คูณด้วย 3 เสมอ\n(เหตุผลทางคณิตศาสตร์: เพื่อให้ตรวจจับความผิดพลาดกรณีพิมพ์ตัวเลขสลับหลัก เช่น พิมพ์ 15 กลายเป็น 51 ได้อย่างแม่นยำ)"
          }
        },
        {
          stepNo: 3,
          badge: "ขั้นตอนที่ 3 จาก 7",
          title: "คำนวณผลคูณของแต่ละหลัก (Digit × Weight)",
          desc: "นำตัวเลขในแต่ละหลักคูณกับน้ำหนักประจำตำแหน่งทีละคู่จนครบทั้ง 12 หลัก จะได้ผลคูณ 12 ค่า",
          focus: "products",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "calc",
            title: "แสดงรายการผลคูณทั้ง 12 หลัก",
            text: "หลัก 1: 8×1 = 8 | หลัก 2: 8×3 = 24 | หลัก 3: 5×1 = 5 | หลัก 4: 1×3 = 3 | หลัก 5: 2×1 = 2 | หลัก 6: 3×3 = 9\nหลัก 7: 4×1 = 4 | หลัก 8: 5×3 = 15 | หลัก 9: 6×1 = 6 | หลัก 10: 7×3 = 21 | หลัก 11: 8×1 = 8 | หลัก 12: 9×3 = 27"
          }
        },
        {
          stepNo: 4,
          badge: "ขั้นตอนที่ 4 จาก 7",
          title: "หาผลรวมของผลคูณทั้งหมด (Sum of Products)",
          desc: "นำผลคูณทั้ง 12 หลักมาบวกรวมกัน หรือใช้วิธีคิดแยกกลุ่มตำแหน่งคี่และตำแหน่งคู่เพื่อความรวดเร็วและตรวจสอบทานง่าย",
          focus: "sum",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "sum",
            title: "การคำนวณผลรวม (เลือกใช้วิธีใดวิธีหนึ่ง)",
            text: "• วิธีที่ 1 (บวกเรียงทีละหลัก): 8 + 24 + 5 + 3 + 2 + 9 + 4 + 15 + 6 + 21 + 8 + 27 = 132\n• วิธีที่ 2 (คิดแยกกลุ่ม): ผลรวมตำแหน่งคี่ (8+5+2+4+6+8)×1 = 33 บวกกับ ผลรวมตำแหน่งคู่ (8+1+3+5+7+9)×3 = 33×3 = 99 -> รวมทั้งหมด 33 + 99 = 132"
          }
        },
        {
          stepNo: 5,
          badge: "ขั้นตอนที่ 5 จาก 7",
          title: "นำผลรวมหารด้วย 10 เพื่อหาเศษ (Modulo 10)",
          desc: "นำผลรวม 132 ไปหารด้วย 10 เพื่อดู 'เศษที่เหลือจากการหาร' (Remainder)",
          focus: "mod",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "mod",
            title: "การหาเศษจากการหารด้วย 10 (Modulo 10)",
            text: "นำ 132 หารด้วย 10: ได้ 13 เศษ 2\n(ข้อสังเกต: เศษจากการหารด้วย 10 จะตรงกับเลขหลักหน่วยของผลรวมเสมอ คือ 132 ลงท้ายด้วย 2 ดังนั้น เศษ = 2)"
          }
        },
        {
          stepNo: 6,
          badge: "ขั้นตอนที่ 6 จาก 7",
          title: "คำนวณหาเลขตรวจสอบ Check Digit (10 - เศษ)",
          desc: "นำ 10 ลบด้วยเศษที่ได้ จะได้ค่าเลขตรวจสอบหลักสุดท้าย พร้อมวิธีคิดลัดจำง่าย",
          focus: "checkDigit",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "success",
            title: "สูตรคำนวณ Check Digit และวิธีคิดลัด",
            text: "• สูตรมาตรฐาน: 10 - เศษ = 10 - 2 = 8\n• 💡 วิธีคิดลัด (Short Cut): ปัดผลรวม 132 ขึ้นเป็นจำนวนเต็มสิบถัดไป คือ 140 แล้วนำ 140 - 132 = 8 ได้ผลลัพธ์เท่ากันทันที!"
          }
        },
        {
          stepNo: 7,
          badge: "ขั้นตอนที่ 7 จาก 7",
          title: "ประกอบเป็นรหัสบาร์โค้ด EAN-13 ที่สมบูรณ์ 13 หลัก",
          desc: "นำเลข Check Digit ที่ได้ (เลข 8) ไปต่อท้ายเป็นหลักที่ 13 ได้รหัสบาร์โค้ดสากล 13 หลักที่ถูกต้องสมบูรณ์ พร้อมพิมพ์บนสินค้าจริง",
          focus: "complete",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "final",
            title: "รหัสบาร์โค้ด EAN-13 สมบูรณ์: 8851234567898",
            text: "ตัวเลข 12 หลักแรก: 885123456789 + หลักตรวจสอบที่ 13: 8 รวมเป็น 8851234567898 เมื่อเครื่องสแกนบาร์โค้ดยิงผ่าน จะคำนวณได้ 8 ตรงกับเลขหลักที่ 13 ทันที ถือว่าข้อมูลสมบูรณ์และถูกต้อง"
          }
        }
      ]
    },
    {
      id: "ex2",
      tabTitle: "ตัวอย่างที่ 2: กรณีเศษเป็นศูนย์ (Remainder 0)",
      shortTitle: "ตัวอย่างที่ 2 (เศษเป็นศูนย์)",
      badge: "กรณีพิเศษที่พบบ่อยและมักตอบผิด",
      digits12: "885135790246",
      totalSteps: 7,
      steps: [
        {
          stepNo: 1,
          badge: "ขั้นตอนที่ 1 จาก 7",
          title: "จัดวางตัวเลข 12 หลักตามลำดับตำแหน่ง",
          desc: "โจทย์: จงคำนวณหา Check Digit ของรหัส 885135790246 จัดวางลงในตารางหลักที่ 1 ถึง 12",
          focus: "digits",
          revealWeight: false,
          revealProduct: false,
          callout: {
            type: "info",
            title: "ตัวเลขตั้งต้น 12 หลัก",
            text: "รหัส 12 หลักแรกคือ 885135790246 เตรียมจัดสรรน้ำหนักการคูณตามมาตรฐาน EAN-13"
          }
        },
        {
          stepNo: 2,
          badge: "ขั้นตอนที่ 2 จาก 7",
          title: "กำหนดน้ำหนักตัวคูณประจำตำแหน่ง (คี่ ×1, คู่ ×3)",
          desc: "ตำแหน่งคี่คูณด้วย 1, ตำแหน่งคู่คูณด้วย 3",
          focus: "weights",
          revealWeight: true,
          revealProduct: false,
          callout: {
            type: "rule",
            title: "น้ำหนักประจำหลัก",
            text: "คี่ (1, 3, 5, 7, 9, 11) × 1 | คู่ (2, 4, 6, 8, 10, 12) × 3"
          }
        },
        {
          stepNo: 3,
          badge: "ขั้นตอนที่ 3 จาก 7",
          title: "คำนวณผลคูณของแต่ละหลัก",
          desc: "นำตัวเลขแต่ละหลักคูณกับน้ำหนักประจำตำแหน่ง",
          focus: "products",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "calc",
            title: "แสดงรายการผลคูณ",
            text: "8×1=8 | 8×3=24 | 5×1=5 | 1×3=3 | 3×1=3 | 5×3=15\n7×1=7 | 9×3=27 | 0×1=0 | 2×3=6 | 4×1=4 | 6×3=18"
          }
        },
        {
          stepNo: 4,
          badge: "ขั้นตอนที่ 4 จาก 7",
          title: "หาผลรวมของผลคูณทั้งหมด",
          desc: "นำผลคูณทั้ง 12 หลักมาบวกรวมกัน",
          focus: "sum",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "sum",
            title: "การคำนวณผลรวม",
            text: "8 + 24 + 5 + 3 + 3 + 15 + 7 + 27 + 0 + 6 + 4 + 18 = 120\n(หรือคิดแยกกลุ่ม: ตำแหน่งคี่ 27×1 = 27 รวมกับ ตำแหน่งคู่ 31×3 = 93 -> 27 + 93 = 120)"
          }
        },
        {
          stepNo: 5,
          badge: "ขั้นตอนที่ 5 จาก 7",
          title: "นำผลรวมหารด้วย 10 เพื่อหาเศษ",
          desc: "นำผลรวม 120 ไปหารด้วย 10 พบว่า 'หารลงตัวพอดี ไม่มีเศษ' (เศษ = 0)",
          focus: "mod",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "warn",
            title: "ผลการหาร: 120 ÷ 10 = 12 เศษ 0",
            text: "ผลรวม 120 หารด้วย 10 ลงตัวพอดี มีค่าเศษเหลือเท่ากับ 0 (สังเกตหลักหน่วยลงท้ายด้วย 0)"
          }
        },
        {
          stepNo: 6,
          badge: "ขั้นตอนที่ 6 จาก 7",
          title: "กฎพิเศษเมื่อเศษเป็นศูนย์ (CRITICAL RULE)",
          desc: "เมื่อหารด้วย 10 แล้วได้เศษเป็น 0 ค่า Check Digit จะเท่ากับ 0 ทันที! (ห้ามตอบ 10 เด็ดขาด)",
          focus: "checkDigit",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "danger",
            title: "⚠️ ข้อควรระวังสำคัญมากที่ผู้เรียนมักพลาด!",
            text: "• เมื่อเศษเป็น 0 ให้ตอบ Check Digit = 0 ทันที!\n• ❌ ห้ามนำ 10 - 0 = 10 เด็ดขาด! เพราะ Check Digit ของระบบบาร์โค้ดจะต้องเป็นเลขโดดหลักเดียว (0 ถึง 9) เท่านั้น ไม่มีช่องสำหรับเลข 10\n• 💡 วิธีคิดลัด: ผลรวม 120 เป็นจำนวนเต็มสิบอยู่แล้ว ผลต่างคือ 120 - 120 = 0"
          }
        },
        {
          stepNo: 7,
          badge: "ขั้นตอนที่ 7 จาก 7",
          title: "ประกอบเป็นรหัสบาร์โค้ด EAN-13 สมบูรณ์ (ลงท้ายด้วย 0)",
          desc: "นำเลข Check Digit (เลข 0) ไปต่อท้าย ได้รหัสบาร์โค้ดสมบูรณ์ 8851357902460",
          focus: "complete",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "final",
            title: "รหัสบาร์โค้ดสมบูรณ์: 8851357902460",
            text: "รหัส 13 หลักที่ถูกต้องคือ 8851357902460 โดยมี Check Digit หลักที่ 13 เป็นเลข 0 สแกนติดและตรวจสอบผ่านฉลุย"
          }
        }
      ]
    },
    {
      id: "ex3",
      tabTitle: "ตัวอย่างที่ 3: ตรวจสอบความถูกต้องของบาร์โค้ด (Validation)",
      shortTitle: "ตัวอย่างที่ 3 (ตรวจสอบบาร์โค้ด)",
      badge: "โจทย์ตรวจสอบบาร์โค้ดจริง • จับผิดรหัสเพี้ยน",
      barcode13: "8850010020037",
      digits12: "885001002003",
      givenCheckDigit: 7,
      totalSteps: 5,
      steps: [
        {
          stepNo: 1,
          badge: "ขั้นตอนที่ 1 จาก 5",
          title: "แยก 12 หลักแรก ออกจากหลักตรวจสอบที่ 13",
          desc: "โจทย์: สินค้ามีรหัสพิมพ์บนกล่องว่า 8850010020037 จงตรวจสอบว่า 'ถูกต้องหรือไม่?'",
          focus: "split",
          revealWeight: false,
          revealProduct: false,
          callout: {
            type: "info",
            title: "การแยกองค์ประกอบเพื่อตรวจสอบ",
            text: "• รหัส 12 หลักแรกที่จะนำมาคำนวณ: 885001002003\n• เลขหลักที่ 13 ที่ระบุมาบนตัวสินค้า: 7 (เก็บไว้เป็นตัวเปรียบเทียบ)"
          }
        },
        {
          stepNo: 2,
          badge: "ขั้นตอนที่ 2 จาก 5",
          title: "กำหนดน้ำหนักคูณและหาผลคูณของ 12 หลักแรก",
          desc: "ตำแหน่งคี่คูณ 1, ตำแหน่งคู่คูณ 3 สำหรับ 12 หลักแรก",
          focus: "products",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "calc",
            title: "คำนวณผลคูณแต่ละหลัก",
            text: "8×1=8 | 8×3=24 | 5×1=5 | 0×3=0 | 0×1=0 | 1×3=3\n0×1=0 | 0×3=0 | 2×1=2 | 0×3=0 | 0×1=0 | 3×3=9"
          }
        },
        {
          stepNo: 3,
          badge: "ขั้นตอนที่ 3 จาก 5",
          title: "หาผลรวมและคำนวณเศษจากการหารด้วย 10",
          desc: "รวมผลคูณทั้งหมดและนำไปหาเศษด้วย Modulo 10",
          focus: "sum_mod",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "sum",
            title: "ผลรวมและเศษเหลือ",
            text: "• ผลรวม: 8 + 24 + 5 + 0 + 0 + 3 + 0 + 0 + 2 + 0 + 0 + 9 = 51\n(หรือแยกกลุ่ม: คี่ 15 + คู่ 12×3 = 36 -> 15 + 36 = 51)\n• นำ 51 หารด้วย 10: ได้ 5 เศษ 1"
          }
        },
        {
          stepNo: 4,
          badge: "ขั้นตอนที่ 4 จาก 5",
          title: "คำนวณค่า Check Digit ที่แท้จริง (10 - 1 = 9)",
          desc: "นำ 10 ลบด้วยเศษ เพื่อหาค่าเลขตรวจสอบที่ถูกต้องตามหลักคณิตศาสตร์",
          focus: "checkDigit",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "calc",
            title: "Check Digit ที่ถูกต้องทางคณิตศาสตร์",
            text: "สูตร: 10 - เศษ = 10 - 1 = 9\n(หรือคิดลัด: ปัด 51 ขึ้นเป็น 60 แล้วนำ 60 - 51 = 9)\nดังนั้น Check Digit ที่แท้จริงที่ควรจะเป็นคือเลข 9"
          }
        },
        {
          stepNo: 5,
          badge: "ขั้นตอนที่ 5 จาก 5",
          title: "เปรียบเทียบผลลัพธ์และสรุปผล: รหัสไม่ถูกต้อง (INVALID)!",
          desc: "นำ Check Digit ที่คำนวณได้จริง มาเทียบกับหลักที่ 13 ที่พิมพ์อยู่บนตัวสินค้า",
          focus: "verdict",
          revealWeight: true,
          revealProduct: true,
          callout: {
            type: "danger",
            title: "🚨 ผลการตรวจสอบ: รหัสนี้ 'ไม่ถูกต้อง' (INVALID)!",
            text: "• Check Digit ที่คำนวณได้จริง: 9\n• เลขหลักที่ 13 ที่พิมพ์มาบนสินค้า: 7\n• การเปรียบเทียบ: 9 ≠ 7 (ไม่ตรงกัน!)\n\n📌 บทวิเคราะห์: บาร์โค้ดนี้เกิดข้อผิดพลาด อาจเกิดจากผู้ใช้งานคีย์ข้อมูลสลับหลัก พิมพ์ผิด หรือเครื่องอ่านอ่านแถบเส้นบาร์โค้ดที่ชำรุด ระบบ POS จะปฏิเสธการทำรายการทันทีเพื่อป้องกันข้อมูลผิดพลาด!"
          }
        }
      ]
    }
  ];

  // Engine State
  const state = {
    activeTab: 0, // 0: Ex 1, 1: Ex 2, 2: Ex 3, 3: Live Validator
    exSteps: [0, 0, 0], // Current step for each example
    customInput: "885123456789", // Live Validator Input
    isCustomTouched: false
  };

  // Render 12-Column Calculation Matrix Table
  function renderCalculationMatrix(calc, currentStepObj, highlightRow) {
    const esc = window.AppUtils?.escapeHtml || ((s) => String(s));
    if (!calc) return "";

    const { digits, weights, products } = calc;
    const isStepWeight = currentStepObj.revealWeight;
    const isStepProd = currentStepObj.revealProduct;

    const colsHtml = digits
      .map((d, idx) => {
        const pos = idx + 1;
        const isOdd = pos % 2 !== 0;
        const w = weights[idx];
        const p = products[idx];

        let colCls = "ean13-matrix-col";
        if (highlightRow === "digits") colCls += " is-highlight-digit";
        if (highlightRow === "weights") colCls += " is-highlight-weight";
        if (highlightRow === "products") colCls += " is-highlight-prod";
        if (highlightRow === "sum") colCls += " is-highlight-sum";

        return `
          <div class="${colCls}" data-col="${pos}">
            <div class="ean13-cell cell-pos" title="ตำแหน่งหลักที่ ${pos}">
              <span class="font-notch">#${pos}</span>
              <span class="cell-sub">${isOdd ? "คี่" : "คู่"}</span>
            </div>
            <div class="ean13-cell cell-digit font-notch" title="ตัวเลขหลักที่ ${pos}: ${d}">
              ${d}
            </div>
            <div class="ean13-cell cell-weight ${isOdd ? "is-odd-weight" : "is-even-weight"} ${isStepWeight ? "is-visible" : "is-dim"}">
              <span class="weight-badge font-notch">×${w}</span>
            </div>
            <div class="ean13-cell cell-prod font-notch ${isStepProd ? "is-visible" : "is-dim"}">
              ${isStepProd ? p : "—"}
            </div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="ean13-matrix-wrapper">
        <div class="ean13-matrix-legend">
          <span class="legend-chip"><strong class="font-notch">#</strong> ตำแหน่งหลัก</span>
          <span class="legend-chip is-digit">🔢 ตัวเลข (Digits)</span>
          <span class="legend-chip is-weight">⚖️ ตัวคูณ (คี่ ×1, คู่ ×3)</span>
          <span class="legend-chip is-prod">✖️ ผลคูณ (Product)</span>
        </div>
        <div class="ean13-matrix-scroll-pane">
          <div class="ean13-matrix-grid">
            ${colsHtml}
          </div>
        </div>
        <div class="ean13-scroll-hint">
          <span>👈 เลื่อนแนวนอนเพื่อตรวจดูหลักที่ 1 ถึง 12 👉</span>
        </div>
      </div>
    `;
  }

  // Render Step Detail Board with Visual Formulas
  function renderStepDetailBoard(example, stepIdx) {
    const esc = window.AppUtils?.escapeHtml || ((s) => String(s));
    const step = example.steps[stepIdx];
    const calc = calculateEan13(example.digits12);
    if (!step || !calc) return "";

    const callout = step.callout;
    let badgeClass = "badge-info";
    if (callout.type === "danger") badgeClass = "badge-danger";
    if (callout.type === "warn") badgeClass = "badge-warn";
    if (callout.type === "success" || callout.type === "final") badgeClass = "badge-success";

    // Dynamic Visual Formula Cards based on current step
    let visualMathHtml = "";

    if (step.focus === "digits") {
      visualMathHtml = `
        <div class="ean13-formula-card">
          <div class="formula-header">
            <span class="font-notch">INPUT DATA • ข้อมูลรหัสบาร์โค้ด 12 หลัก</span>
          </div>
          <div class="formula-body">
            <div class="digits-strip font-notch">
              ${calc.digits12.split("").map((ch, i) => `<span class="digit-box ${i < 3 ? "is-country" : ""}">${ch}</span>`).join("")}
              <span class="digit-box is-unknown" title="หลักที่ 13 (Check Digit ที่ต้องการหา)">?</span>
            </div>
            <p class="formula-caption">
              3 หลักแรก (<strong style="color:var(--blue-600);">885</strong>) = รหัสประเทศไทย | 9 หลักถัดมา = รหัสสินค้า | หลักที่ 13 = <strong style="color:var(--accent-orange, #f97316);">Check Digit (?)</strong>
            </p>
          </div>
        </div>
      `;
    } else if (step.focus === "weights") {
      visualMathHtml = `
        <div class="ean13-formula-card">
          <div class="formula-header">
            <span class="font-notch">WEIGHTING RULE • กฎการถ่วงน้ำหนักคูณตำแหน่งคู่และคี่</span>
          </div>
          <div class="formula-body weights-summary-grid">
            <div class="weights-rule-box is-odd">
              <span class="badge-pill is-odd font-notch">ตำแหน่งคี่ (หลัก 1, 3, 5, 7, 9, 11)</span>
              <strong class="rule-math font-notch">คูณด้วย 1 (× 1)</strong>
              <span class="rule-desc">คงค่าเดิมไว้ ไม่เพิ่มน้ำหนัก</span>
            </div>
            <div class="weights-rule-box is-even">
              <span class="badge-pill is-even font-notch">ตำแหน่งคู่ (หลัก 2, 4, 6, 8, 10, 12)</span>
              <strong class="rule-math font-notch">คูณด้วย 3 (× 3)</strong>
              <span class="rule-desc">เพิ่มน้ำหนัก 3 เท่า เพื่อดักจับการพิมพ์สลับหลัก</span>
            </div>
          </div>
        </div>
      `;
    } else if (step.focus === "products") {
      visualMathHtml = `
        <div class="ean13-formula-card">
          <div class="formula-header">
            <span class="font-notch">MULTIPLICATION PHASE • ตัวอย่างการคำนวณผลคูณ</span>
          </div>
          <div class="formula-body">
            <div class="products-compact-grid font-notch">
              ${calc.digits
                .map(
                  (d, i) => `
                  <div class="prod-item">
                    <span class="prod-pos">#${i + 1}</span>
                    <span class="prod-math">${d} × ${calc.weights[i]} = <strong>${calc.products[i]}</strong></span>
                  </div>
                `
                )
                .join("")}
            </div>
          </div>
        </div>
      `;
    } else if (step.focus === "sum") {
      visualMathHtml = `
        <div class="ean13-formula-card is-highlight">
          <div class="formula-header">
            <span class="font-notch">SUM OF PRODUCTS • การรวมผลคูณทั้งหมด</span>
          </div>
          <div class="formula-body">
            <div class="math-equation-row font-notch">
              <span class="math-label">ผลรวม (Total Sum) =</span>
              <span class="math-expr">${calc.products.join(" + ")}</span>
              <span class="math-res is-accent">= ${calc.totalSum}</span>
            </div>
            <div class="math-split-box">
              <span class="split-pill">กลุ่มคี่: (${calc.oddDigits.join("+")}) × 1 = <strong>${calc.oddSum}</strong></span>
              <span class="split-plus">+</span>
              <span class="split-pill">กลุ่มคู่: (${calc.evenDigits.join("+")}) × 3 = <strong>${calc.evenSum * 3}</strong></span>
              <span class="split-equal">=</span>
              <span class="split-total font-notch">ผลรวม = ${calc.totalSum}</span>
            </div>
          </div>
        </div>
      `;
    } else if (step.focus === "mod") {
      visualMathHtml = `
        <div class="ean13-formula-card is-highlight">
          <div class="formula-header">
            <span class="font-notch">MODULO 10 DIVISION • การหารหาเศษด้วย 10</span>
          </div>
          <div class="formula-body">
            <div class="division-board font-notch">
              <div class="div-cell is-dividend">
                <span class="div-label">ผลรวม</span>
                <span class="div-val">${calc.totalSum}</span>
              </div>
              <span class="div-op">÷</span>
              <div class="div-cell is-divisor">
                <span class="div-label">ตัวหาร</span>
                <span class="div-val">10</span>
              </div>
              <span class="div-op">=</span>
              <div class="div-cell is-quotient">
                <span class="div-label">ผลหาร</span>
                <span class="div-val">${Math.floor(calc.totalSum / 10)}</span>
              </div>
              <div class="div-cell is-remainder">
                <span class="div-label">เศษเหลือ (Remainder)</span>
                <span class="div-val is-neon">${calc.remainder}</span>
              </div>
            </div>
            <p class="formula-caption">
              นำผลรวม ${calc.totalSum} ไปหารด้วย 10 จะได้เศษเหลือเท่ากับ <strong style="color:var(--accent-red, #dc2626); font-size:1.1rem;">${calc.remainder}</strong>
            </p>
          </div>
        </div>
      `;
    } else if (step.focus === "checkDigit") {
      const isZeroCase = calc.remainder === 0;
      visualMathHtml = `
        <div class="ean13-formula-card ${isZeroCase ? "is-zero-card" : "is-highlight"}">
          <div class="formula-header">
            <span class="font-notch">CHECK DIGIT FORMULA • การหาเลขตรวจสอบหลักสุดท้าย</span>
          </div>
          <div class="formula-body">
            ${
              isZeroCase
                ? `
                  <div class="zero-case-banner">
                    <span class="zero-alert-icon">⚡</span>
                    <div>
                      <strong class="zero-alert-title font-notch">กรณีเศษเป็น 0 (Remainder = 0)</strong>
                      <p class="zero-alert-text">กฎสากลระบุว่า: ถ้าเศษจากการหารด้วย 10 เท่ากับ 0 ให้ Check Digit มีค่าเท่ากับ <strong>0</strong> ทันที!</p>
                      <span class="zero-math-pill font-notch">Check Digit = 0 (ห้ามคิด 10 - 0 = 10)</span>
                    </div>
                  </div>
                `
                : `
                  <div class="standard-check-banner">
                    <div class="formula-math-display font-notch">
                      <span class="f-part">Check Digit</span>
                      <span class="f-part">=</span>
                      <span class="f-part">10 - เศษ</span>
                      <span class="f-part">=</span>
                      <span class="f-part">10 - ${calc.remainder}</span>
                      <span class="f-part is-target">= ${calc.checkDigit}</span>
                    </div>
                    <div class="shortcut-tip-box">
                      <span class="shortcut-icon">💡</span>
                      <span><strong>วิธีคิดลัด (Short Cut):</strong> ปัดผลรวม ${calc.totalSum} ขึ้นเป็นจำนวนเต็มสิบถัดไปคือ <strong>${calc.nextMultiple10}</strong> แล้วนำ <strong>${calc.nextMultiple10} - ${calc.totalSum} = ${calc.checkDigit}</strong> ได้ผลลัพธ์ตรงกันทันที!</span>
                    </div>
                  </div>
                `
            }
          </div>
        </div>
      `;
    } else if (step.focus === "complete") {
      visualMathHtml = `
        <div class="ean13-formula-card is-success">
          <div class="formula-header">
            <span class="font-notch">COMPLETED BARCODE • รหัสบาร์โค้ด EAN-13 สมบูรณ์</span>
          </div>
          <div class="formula-body">
            <div class="complete-code-banner">
              <span class="complete-label">รหัสบาร์โค้ด 13 หลักพร้อมใช้งาน:</span>
              <div class="complete-code-string font-notch">
                <span class="c-segment">${calc.digits12.slice(0, 3)}</span>
                <span class="c-sep">·</span>
                <span class="c-segment">${calc.digits12.slice(3, 9)}</span>
                <span class="c-sep">·</span>
                <span class="c-segment">${calc.digits12.slice(9, 12)}</span>
                <span class="c-sep">·</span>
                <span class="c-digit-badge">${calc.checkDigit}</span>
              </div>
            </div>
            ${generateBarcodeSvg(calc.fullCode, false)}
          </div>
        </div>
      `;
    } else if (step.focus === "split") {
      visualMathHtml = `
        <div class="ean13-formula-card">
          <div class="formula-header">
            <span class="font-notch">BARCODE VERIFICATION • การแยกองค์ประกอบเพื่อตรวจสอบ</span>
          </div>
          <div class="formula-body">
            <div class="verification-split-view">
              <div class="split-target-box is-12 font-notch">
                <span class="st-label">12 หลักแรกที่จะนำมาคำนวณ</span>
                <span class="st-code">${example.digits12}</span>
              </div>
              <span class="split-vs font-notch">VS</span>
              <div class="split-target-box is-check font-notch">
                <span class="st-label">หลักที่ 13 บนสินค้า (Check Digit ที่ระบุมา)</span>
                <span class="st-code is-given">${example.givenCheckDigit}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (step.focus === "sum_mod") {
      visualMathHtml = `
        <div class="ean13-formula-card is-highlight">
          <div class="formula-header">
            <span class="font-notch">CALCULATING CHECK DIGIT • คำนวณหาเลขตรวจสอบที่แท้จริง</span>
          </div>
          <div class="formula-body">
            <div class="math-split-box">
              <span class="split-pill">ผลรวม 12 หลักแรก = <strong>${calc.totalSum}</strong></span>
              <span class="split-plus">➔</span>
              <span class="split-pill">หารด้วย 10: ${calc.totalSum} ÷ 10 = ${Math.floor(calc.totalSum / 10)} <strong>เศษ ${calc.remainder}</strong></span>
            </div>
          </div>
        </div>
      `;
    } else if (step.focus === "verdict") {
      visualMathHtml = `
        <div class="ean13-formula-card is-danger">
          <div class="formula-header">
            <span class="font-notch">VERDICT AUDIT • เปรียบเทียบผลลัพธ์และสรุปการตรวจสอบ</span>
          </div>
          <div class="formula-body">
            <div class="verdict-comparison-grid">
              <div class="verdict-comp-box is-calculated">
                <span class="comp-label">Check Digit ที่คำนวณได้จริง</span>
                <strong class="comp-num font-notch">${calc.checkDigit}</strong>
                <span class="comp-note">(จากสูตร 10 - 1 = 9)</span>
              </div>
              <div class="verdict-symbol font-notch">≠</div>
              <div class="verdict-comp-box is-given">
                <span class="comp-label">หลักที่ 13 ที่พิมพ์มาบนสินค้า</span>
                <strong class="comp-num font-notch is-err">${example.givenCheckDigit}</strong>
                <span class="comp-note">(เลขที่พิมพ์มาผิด)</span>
              </div>
            </div>
            <div class="verdict-banner-invalid">
              <div class="v-icon">❌</div>
              <div>
                <strong class="v-title font-notch">รหัสบาร์โค้ดนี้ไม่ถูกต้อง (INVALID)!</strong>
                <p class="v-desc">เลขตรวจสอบที่ถูกต้องคือ <strong>9</strong> แต่บนสินค้ากลับพิมพ์ <strong>7</strong> ระบบนำเข้าข้อมูลจะปฏิเสธการสแกนทันที</p>
              </div>
            </div>
            ${generateBarcodeSvg(example.barcode13, true)}
          </div>
        </div>
      `;
    }

    return `
      <div class="ean13-step-board surface-card">
        <div class="ean13-board-header">
          <span class="ean13-step-badge ${badgeClass} font-notch">${esc(step.badge)}</span>
          <h3 class="ean13-board-title">${esc(step.title)}</h3>
          <p class="ean13-board-desc">${esc(step.desc)}</p>
        </div>

        ${visualMathHtml}

        <div class="ean13-callout-box is-${callout.type}">
          <strong class="ean13-callout-title">${esc(callout.title)}</strong>
          <p class="ean13-callout-text">${esc(callout.text).replace(/\n/g, "<br/>")}</p>
        </div>
      </div>
    `;
  }

  // Render Stepper Navigation Controls
  function renderStepperControls(example, currentStepIdx) {
    const totalSteps = example.totalSteps;
    const isFirst = currentStepIdx === 0;
    const isLast = currentStepIdx === totalSteps - 1;

    const dotsHtml = Array.from({ length: totalSteps }, (_, idx) => {
      const isCurrent = idx === currentStepIdx;
      const isDone = idx < currentStepIdx;
      let dotCls = "ean13-step-dot font-notch";
      if (isCurrent) dotCls += " is-current";
      if (isDone) dotCls += " is-done";

      return `
        <button
          type="button"
          class="${dotCls}"
          data-ean13-step-dot="${idx}"
          title="ไปยังขั้นตอนที่ ${idx + 1}"
          aria-label="ขั้นตอนที่ ${idx + 1}"
        >
          <span>${isDone ? "✓" : idx + 1}</span>
        </button>
      `;
    }).join("");

    return `
      <div class="ean13-stepper-nav">
        <button
          type="button"
          class="btn-secondary ean13-nav-btn"
          id="ean13-btn-prev"
          ${isFirst ? "disabled" : ""}
          title="ย้อนกลับขั้นตอนก่อนหน้า"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          <span>ย้อนกลับ (Prev)</span>
        </button>

        <div class="ean13-dots-group">
          ${dotsHtml}
        </div>

        <button
          type="button"
          class="btn-primary ean13-nav-btn is-next"
          id="ean13-btn-next"
          ${isLast ? "disabled" : ""}
          title="${isLast ? "สิ้นสุดขั้นตอนตัวอย่างนี้แล้ว" : "ดูขั้นตอนถัดไป (Next Step)"}"
        >
          <span>${isLast ? "ครบทุกขั้นตอนแล้ว ✓" : "ขั้นตอนถัดไป (Next) >"}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    `;
  }

  // Render Tab 4: Live Barcode Tester & Validator
  function renderLiveTester() {
    const esc = window.AppUtils?.escapeHtml || ((s) => String(s));
    const inputClean = String(state.customInput || "").replace(/\D/g, "").slice(0, 13);
    const len = inputClean.length;

    let calc = null;
    let is13Digits = len === 13;
    let isValid13 = false;
    let given13th = "";
    let calculated13th = "";
    let alertHtml = "";

    if (len >= 12) {
      calc = calculateEan13(inputClean.slice(0, 12));
      if (calc) {
        calculated13th = String(calc.checkDigit);
        if (is13Digits) {
          given13th = inputClean[12];
          isValid13 = given13th === calculated13th;

          if (isValid13) {
            alertHtml = `
              <div class="live-verdict-banner is-valid">
                <span class="lv-icon">✅</span>
                <div style="flex:1;">
                  <strong class="lv-title font-notch">รหัสบาร์โค้ดถูกต้องสมบูรณ์ (VALID BARCODE)</strong>
                  <p class="lv-desc">เลขตรวจสอบหลักที่ 13 ที่ป้อนมา (<strong class="font-notch">${given13th}</strong>) ตรงกับค่าที่คำนวณได้จริงจาก 12 หลักแรก (<strong class="font-notch">${calculated13th}</strong>)</p>
                </div>
                <span class="lv-tag is-pass font-notch">100% VALID</span>
              </div>
            `;
          } else {
            alertHtml = `
              <div class="live-verdict-banner is-invalid">
                <span class="lv-icon">❌</span>
                <div style="flex:1;">
                  <strong class="lv-title font-notch">รหัสบาร์โค้ดไม่ถูกต้อง (INVALID BARCODE)</strong>
                  <p class="lv-desc">เลขหลักที่ 13 ที่ป้อนมาคือ <strong class="font-notch" style="color:#ef4444;">${given13th}</strong> แต่ค่าที่คำนวณได้จริงคือ <strong class="font-notch" style="color:#2563eb;">${calculated13th}</strong> (ระบบจะไม่อนุญาตให้ผ่าน)</p>
                </div>
                <span class="lv-tag is-fail font-notch">ERROR MISMATCH</span>
              </div>
            `;
          }
        } else {
          alertHtml = `
            <div class="live-verdict-banner is-info">
              <span class="lv-icon">🔑</span>
              <div style="flex:1;">
                <strong class="lv-title font-notch">คำนวณ Check Digit หลักที่ 13 สำเร็จ!</strong>
                <p class="lv-desc">จากรหัส 12 หลักที่ป้อนมา เลขตรวจสอบที่ต้องใช้ต่อท้ายคือ <strong class="font-notch" style="color:var(--blue-600); font-size:1.15rem;">${calc.checkDigit}</strong> (รหัสสมบูรณ์คือ ${calc.fullCode})</p>
              </div>
              <span class="lv-tag is-calc font-notch">CALCULATED</span>
            </div>
          `;
        }
      }
    } else {
      alertHtml = `
        <div class="live-verdict-banner is-pending">
          <span class="lv-icon">⌨️</span>
          <div style="flex:1;">
            <strong class="lv-title font-notch">กรุณาพิมพ์ตัวเลขให้ครบอย่างน้อย 12 หลัก</strong>
            <p class="lv-desc">ปัจจุบันพิมพ์แล้ว ${len} หลัก (พิมพ์ 12 หลักเพื่อคำนวณ Check Digit หรือพิมพ์ 13 หลักเพื่อตรวจสอบความถูกต้อง)</p>
          </div>
          <span class="lv-tag is-pending font-notch">${len} / 12</span>
        </div>
      `;
    }

    const dummyStep = { revealWeight: true, revealProduct: true };

    return `
      <div class="ean13-live-tester-pane">
        <div class="surface-card live-input-card">
          <div class="live-input-header">
            <div>
              <span class="ean13-step-badge badge-accent font-notch">LIVE VALIDATOR & SIMULATOR</span>
              <h3 style="font-size:1.15rem; font-weight:700; margin-top:4px;">เครื่องมือทดลองคำนวณ & ตรวจสอบบาร์โค้ดด้วยตนเอง</h3>
              <p style="font-size:0.88rem; color:var(--text-muted); margin-top:2px;">
                พิมพ์ตัวเลข 12 หลักเพื่อหา Check Digit หรือพิมพ์ 13 หลักเพื่อตรวจจับความถูกต้อง พร้อมภาพบาร์โค้ดสเกลจริง
              </p>
            </div>
          </div>

          <!-- Input Box & Preset Buttons -->
          <div class="live-input-row">
            <div class="live-field-group">
              <label for="ean13-live-input" class="live-field-label">
                <span>ป้อนตัวเลขบาร์โค้ด (12 หรือ 13 หลัก):</span>
                <span class="font-notch tabular-nums live-char-count">${len} / 13 หลัก</span>
              </label>
              <div class="live-input-wrap">
                <input
                  type="text"
                  id="ean13-live-input"
                  class="live-barcode-input font-notch"
                  value="${esc(inputClean)}"
                  placeholder="เช่น 885123456789 หรือ 8850010020037"
                  maxlength="13"
                  inputmode="numeric"
                  autocomplete="off"
                />
                <button type="button" class="btn-secondary live-random-btn" id="ean13-btn-random" title="สุ่มรหัสบาร์โค้ด 12 หลักเพื่อทดสอบ">
                  <span>🎲 สุ่มเลข</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Quick Presets Pills -->
          <div class="live-presets-wrap">
            <span class="presets-label">เลือกตัวอย่างโจทย์คลิกเดียว:</span>
            <div class="presets-buttons-row">
              <button type="button" class="preset-pill-btn" data-ean13-preset="885123456789">
                <span>📘 ตัวอย่าง 1 (885123456789)</span>
              </button>
              <button type="button" class="preset-pill-btn" data-ean13-preset="885135790246">
                <span>⚡ ตัวอย่าง 2 เศษ 0 (885135790246)</span>
              </button>
              <button type="button" class="preset-pill-btn is-wrong" data-ean13-preset="8850010020037">
                <span>🔍 ตัวอย่าง 3 รหัสผิด (8850010020037)</span>
              </button>
              <button type="button" class="preset-pill-btn" data-ean13-preset="8850987101014">
                <span>🍜 มาม่าต้มยำกุ้ง (8850987101014)</span>
              </button>
              <button type="button" class="preset-pill-btn" data-ean13-preset="8850188800051">
                <span>🥛 นมโฟร์โมสต์ (8850188800051)</span>
              </button>
            </div>
          </div>

          <!-- Alert / Verdict Result -->
          ${alertHtml}

          <!-- Live Matrix Display -->
          ${
            calc
              ? `
                <div style="margin-top:20px;">
                  <span class="live-section-title font-notch">ตารางคำนวณและแจกแจงน้ำหนัก 12 หลักแรก:</span>
                  ${renderCalculationMatrix(calc, dummyStep, "all")}
                  
                  <div class="live-summary-cards-row">
                    <div class="live-summary-box">
                      <span class="ls-label">ผลรวมทั้งหมด (Sum):</span>
                      <strong class="ls-val font-notch">${calc.totalSum}</strong>
                      <span class="ls-sub">คี่ ${calc.oddSum} + คู่ ${calc.evenSum * 3}</span>
                    </div>
                    <div class="live-summary-box">
                      <span class="ls-label">เศษจากการหาร 10 (Remainder):</span>
                      <strong class="ls-val font-notch is-mod">${calc.remainder}</strong>
                      <span class="ls-sub">${calc.totalSum} ÷ 10 = ${Math.floor(calc.totalSum / 10)} เศษ ${calc.remainder}</span>
                    </div>
                    <div class="live-summary-box is-primary">
                      <span class="ls-label">Check Digit ที่ถูกต้อง:</span>
                      <strong class="ls-val font-notch is-check">${calc.checkDigit}</strong>
                      <span class="ls-sub">${calc.remainder === 0 ? "เศษ 0 -> Check Digit 0" : `10 - ${calc.remainder} = ${calc.checkDigit}`}</span>
                    </div>
                  </div>

                  <!-- Live Barcode SVG Rendering -->
                  <div style="margin-top:20px;">
                    <span class="live-section-title font-notch">ภาพจำลองแถบรหัสบาร์โค้ด EAN-13:</span>
                    ${generateBarcodeSvg(is13Digits ? inputClean : calc.fullCode, is13Digits && !isValid13)}
                  </div>
                </div>
              `
              : ""
          }
        </div>
      </div>
    `;
  }

  // Render Root HTML for the whole EAN-13 Component
  function renderRootHtml() {
    const esc = window.AppUtils?.escapeHtml || ((s) => String(s));
    const activeTab = state.activeTab;

    // Tabs Header
    const tabs = [
      { id: 0, title: "📘 ตัวอย่างที่ 1: คำนวณทีละขั้นตอน (885123456789)" },
      { id: 1, title: "⚡ ตัวอย่างที่ 2: กรณีเศษเป็นศูนย์ (885135790246)" },
      { id: 2, title: "🔍 ตัวอย่างที่ 3: ตรวจสอบความถูกต้อง (8850010020037)" },
      { id: 3, title: "🛠️ เครื่องมือคำนวณ & ตรวจสอบบาร์โค้ดสด" }
    ];

    const tabsHtml = tabs
      .map(
        (t) => `
        <button
          type="button"
          class="ean13-tab-btn ${t.id === activeTab ? "is-active" : ""}"
          data-ean13-tab="${t.id}"
          role="tab"
          aria-selected="${t.id === activeTab ? "true" : "false"}"
        >
          <span>${esc(t.title)}</span>
        </button>
      `
      )
      .join("");

    let tabContentHtml = "";

    if (activeTab < 3) {
      const example = EXAMPLES_DATA[activeTab];
      const curStepIdx = state.exSteps[activeTab] || 0;
      const curStep = example.steps[curStepIdx] || example.steps[0];
      const calc = calculateEan13(example.digits12);

      tabContentHtml = `
        <div class="ean13-example-pane" data-example-id="${example.id}">
          <!-- Example Header Info -->
          <div class="ean13-pane-header">
            <div style="flex:1;">
              <span class="ean13-step-badge badge-accent font-notch">${esc(example.badge)}</span>
              <h2 class="ean13-example-title">${esc(example.tabTitle)}</h2>
            </div>
            <span class="ean13-step-progress-pill font-notch tabular-nums">
              Step ${curStepIdx + 1} / ${example.totalSteps}
            </span>
          </div>

          <!-- Stepper Navigation Controls (Prev, Dots, Next) -->
          ${renderStepperControls(example, curStepIdx)}

          <!-- Dynamic 12-Column Calculation Matrix -->
          ${renderCalculationMatrix(calc, curStep, curStep.focus)}

          <!-- Step Detail Board -->
          ${renderStepDetailBoard(example, curStepIdx)}
        </div>
      `;
    } else {
      tabContentHtml = renderLiveTester();
    }

    return `
      <div class="ean13-lab-card surface-card" id="ean13-guide-root">
        <div class="ean13-lab-header">
          <div class="ean13-lab-tag-row">
            <span class="ean13-lab-badge font-notch">EAN-13 CHECK DIGIT INTERACTIVE LAB</span>
            <span class="ean13-lab-status-dot"></span>
            <span class="ean13-lab-live-text font-notch">INTERACTIVE WALKTHROUGH</span>
          </div>
          <h2 class="ean13-lab-main-title">คู่มือคำนวณและตรวจสอบเลข Check Digit บาร์โค้ด EAN-13 ทีละขั้นตอน</h2>
          <p class="ean13-lab-lead">
            เรียนรู้ที่มาของตัวเลข การคูณตามน้ำหนัก (คี่ ×1, คู่ ×3), การหาเศษด้วย Modulo 10, กฎกรณีเศษเป็นศูนย์ และการตรวจจับบาร์โค้ดที่ผิดพลาด พร้อมเครื่องมือคำนวณสด
          </p>
        </div>

        <!-- Tab Selection Row -->
        <div class="ean13-tabs-track" role="tablist">
          ${tabsHtml}
        </div>

        <!-- Tab Body Content -->
        <div class="ean13-tab-content-area">
          ${tabContentHtml}
        </div>
      </div>
    `;
  }

  // Update DOM in-place without rebuilding the whole reader
  function updateDom() {
    const root = document.getElementById("ean13-guide-root");
    if (!root) return;

    // Preserve focused input cursor if in Tab 4
    const liveInput = document.getElementById("ean13-live-input");
    let cursorStart = 0;
    let cursorEnd = 0;
    let hadFocus = false;
    if (liveInput && document.activeElement === liveInput) {
      hadFocus = true;
      cursorStart = liveInput.selectionStart;
      cursorEnd = liveInput.selectionEnd;
    }

    const temp = document.createElement("div");
    temp.innerHTML = renderRootHtml();
    const newRoot = temp.firstElementChild;

    root.replaceWith(newRoot);

    if (hadFocus) {
      const reInput = document.getElementById("ean13-live-input");
      if (reInput) {
        reInput.focus();
        try {
          reInput.setSelectionRange(cursorStart, cursorEnd);
        } catch (_) {}
      }
    }
  }

  // Public Controller API
  const Ean13GuideEngine = {
    getState() {
      return state;
    },
    renderRootHtml,
    updateDom,

    setTab(tabIdx) {
      const idx = Number(tabIdx);
      if (idx >= 0 && idx <= 3) {
        state.activeTab = idx;
        window.SoundEngine?.playButtonClick?.();
        updateDom();
      }
    },

    nextStep() {
      const activeTab = state.activeTab;
      if (activeTab < 3) {
        const example = EXAMPLES_DATA[activeTab];
        const cur = state.exSteps[activeTab] || 0;
        if (cur < example.totalSteps - 1) {
          state.exSteps[activeTab] = cur + 1;
          window.SoundEngine?.playButtonClick?.();
          if (cur + 1 === example.totalSteps - 1) {
            window.SoundEngine?.playQuizCorrect?.();
          }
          updateDom();
        }
      }
    },

    prevStep() {
      const activeTab = state.activeTab;
      if (activeTab < 3) {
        const cur = state.exSteps[activeTab] || 0;
        if (cur > 0) {
          state.exSteps[activeTab] = cur - 1;
          window.SoundEngine?.playButtonClick?.();
          updateDom();
        }
      }
    },

    goToStep(stepIdx) {
      const activeTab = state.activeTab;
      if (activeTab < 3) {
        const example = EXAMPLES_DATA[activeTab];
        const target = Number(stepIdx);
        if (target >= 0 && target < example.totalSteps) {
          state.exSteps[activeTab] = target;
          window.SoundEngine?.playButtonClick?.();
          updateDom();
        }
      }
    },

    setCustomBarcode(code) {
      state.customInput = String(code || "").replace(/\D/g, "").slice(0, 13);
      window.SoundEngine?.playButtonClick?.();
      updateDom();
    },

    onCustomInputChange(value) {
      state.customInput = String(value || "").replace(/\D/g, "").slice(0, 13);
      updateDom();
    },

    generateRandomBarcode() {
      // 885 prefix for Thailand + 9 random digits
      let rand = "885";
      for (let i = 0; i < 9; i++) {
        rand += Math.floor(Math.random() * 10);
      }
      state.customInput = rand;
      window.SoundEngine?.playButtonClick?.();
      updateDom();
    }
  };

  // Expose to window
  window.Ean13GuideEngine = Ean13GuideEngine;
})();
