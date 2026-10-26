/**
 * ============================================================================
 * js/config.js — Application Constants & Official 16-Unit Syllabus Metadata
 * อ้างอิงจากแผนการจัดการเรียนรู้ทั้ง 16 หน่วย (โฟลเดอร์ edu-plan)
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * สถานศึกษา: โรงเรียนจิตรลดาวิชาชีพ สถาบันเทคโนโลยีจิตรลดา
 * ============================================================================
 */

window.APP_CONFIG = {
  COURSE_CODE: "21901-2017",
  COURSE_NAME_TH: "เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์",
  COURSE_CREDITS_TH: "2 หน่วยกิต (3 ชั่วโมง/สัปดาห์)",
  LEVEL_PROGRAM_TH: "ระดับ ปวช.1 สาขาวิชาเทคโนโลยีสารสนเทศ",
  SCHOOL_NAME_TH: "โรงเรียนจิตรลดาวิชาชีพ สถาบันเทคโนโลยีจิตรลดา",
  INSTITUTE_NAME_TH: "สถาบันเทคโนโลยีจิตรลดา",
  INSTITUTE_NAME_EN: "Chitralada Technology Institute",
  INSTRUCTOR_NAME_TH: "นายอนุพงศ์ พลายรักษา",
  ACADEMIC_YEAR_TH: "2569",

  // วาง URL ที่ได้จากการ Deploy Google Apps Script (Web App -> Anyone) ลงในช่องด้านล่าง
  // หากเว้นว่าง ระบบจะจำลองฐานข้อมูล 4 แท็บในเบราว์เซอร์ให้อัตโนมัติเพื่อทดสอบทุกฟีเจอร์ได้ทันที
  GAS_WEB_APP_URL: "https://script.google.com/macros/s/AKfycbxTWYDzJ_lKa2n4RIt9yFDZep4qzXs6WxESuinSPIpylmobNDjwAxO8Zgfo3dUEJWHn/exec",

  TOTAL_UNITS: 16,
  QUESTIONS_PER_UNIT: 10,
  PASS_SCORE_PER_UNIT: 8, // เกณฑ์ผ่าน 80% (8 จาก 10 ข้อ)
  PASS_PERCENTAGE: 80,

  AVATAR_SIZE_PX: 256,
  AVATAR_JPEG_QUALITY: 0.84,

  STORAGE_KEYS: {
    SESSION_USER: "cdti_21901_session_v3",
    LOCAL_DB_MIRROR: "cdti_21901_local_db_v3"
  },

  MODULES_SYLLABUS: [
    {
      id: 1,
      title: "หมวดที่ 1: พื้นฐานข้อมูลดิบ สารสนเทศ และอุปกรณ์นำเข้าข้อมูล",
      unitRange: "หน่วยที่ 1 – 4",
      description:
        "ความแตกต่างระหว่างข้อมูลดิบกับสารสนเทศ วงจร IPO การนำเข้าข้อมูลแบบ Manual กับ Automatic และการทำงานของแป้นพิมพ์ เมาส์ สแกนเนอร์ กล้องดิจิทัล และไมโครโฟน",
      miniGameId: "G01",
      miniGameTitle: "Input Device Speed Match"
    },
    {
      id: 2,
      title: "หมวดที่ 2: เทคโนโลยีบาร์โค้ด 1 มิติ และรหัสภาพ 2 มิติ (QR Code)",
      unitRange: "หน่วยที่ 5 – 8",
      description:
        "หัวอ่านบาร์โค้ด CCD และ Image-based เครื่องอ่านไร้สายและฝังตัว โครงสร้าง QR Code การกู้คืนข้อมูล ตระกูล QR ของ Denso Wave และการใช้งาน Static / Dynamic QR",
      miniGameId: "G02",
      miniGameTitle: "Barcode & QR Rapid Decoder"
    },
    {
      id: 3,
      title: "หมวดที่ 3: ความปลอดภัย การเข้ารหัสข้อมูล RFID และชีวมิติ",
      unitRange: "หน่วยที่ 9 – 12",
      description:
        "ความเสี่ยงในการนำเข้าข้อมูล Data Validation และ Check Digit การเข้ารหัส SSL/TLS และ SHA-256 Hashing ระบบคลื่นความถี่วิทยุ RFID และระบบชีวมิติ Biometric Input",
      miniGameId: "G03",
      miniGameTitle: "Cyber & Biometric Shield"
    },
    {
      id: 4,
      title: "หมวดที่ 4: ซอฟต์แวร์ฐานข้อมูล การแปลงรหัส การบีบอัด และการประยุกต์ใช้งาน",
      unitRange: "หน่วยที่ 13 – 16",
      description:
        "การจัดการฐานข้อมูล DBMS การทำความสะอาดข้อมูลด้วย Power Query มาตรฐานรหัสอักขระ UTF-8 / TIS-620 / Base64 การบีบอัดข้อมูล RLE / Lossless / Lossy และการประยุกต์ใช้งานจริง",
      miniGameId: "G04",
      miniGameTitle: "Data Encoding & RLE Sprint"
    }
  ],

  UNITS_METADATA: [
    {
      no: 1,
      moduleId: 1,
      code: "Unit 1",
      title: "ข้อมูลดิบและสารสนเทศ",
      subtitle: "ความแตกต่างข้อมูลดิบกับสารสนเทศ ประเภทข้อมูล 5 รูปแบบ และคุณสมบัติของสารสนเทศที่ดี"
    },
    {
      no: 2,
      moduleId: 1,
      code: "Unit 2",
      title: "เทคโนโลยีการนำข้อมูลเข้าสู่ระบบคอมพิวเตอร์",
      subtitle: "ความสำคัญของการนำเข้าข้อมูล วงจร IPO และเปรียบเทียบ Manual Input กับ Automatic Input"
    },
    {
      no: 3,
      moduleId: 1,
      code: "Unit 3",
      title: "อุปกรณ์นำเข้าข้อมูล (Input Device)",
      subtitle: "หลักการทำงานและการเลือกใช้งานแป้นพิมพ์ (Keyboard) เมาส์ (Mouse) และสแกนเนอร์ (Scanner)"
    },
    {
      no: 4,
      moduleId: 1,
      code: "Unit 4",
      title: "กล้องดิจิทัลกับไมโครโฟน",
      subtitle: "เซนเซอร์รับภาพดิจิทัล การแปลงคลื่นเสียงเป็นสัญญาณดิจิทัล และการเลือกใช้อุปกรณ์ภาพและเสียง"
    },
    {
      no: 5,
      moduleId: 2,
      code: "Unit 5",
      title: "อุปกรณ์อ่านบาร์โค้ด (CCD และ Image-based)",
      subtitle: "หลักการทำงานของเครื่องอ่าน CCD และ Image-based การอ่านบาร์โค้ด 1 มิติ/2 มิติ และการบันทึกเข้าตารางคำนวณ"
    },
    {
      no: 6,
      moduleId: 2,
      code: "Unit 6",
      title: "อุปกรณ์อ่านบาร์โค้ดแบบไร้สายและแบบฝังตัว (Wireless / Fixed)",
      subtitle: "การจับคู่ไร้สาย โหมดพักข้อมูลตรวจนับสินค้า (Batch Mode) และเครื่องอ่านฝังตัวอัตโนมัติ"
    },
    {
      no: 7,
      moduleId: 2,
      code: "Unit 7",
      title: "การนำเข้าด้วยรหัสภาพ 2 มิติ (QR Code โครงสร้างและการกู้คืนข้อมูล)",
      subtitle: "โครงสร้าง Finder / Alignment / Timing Pattern ระดับการแก้ไขข้อผิดพลาด L, M, Q, H และการใส่โลโก้"
    },
    {
      no: 8,
      moduleId: 2,
      code: "Unit 8",
      title: "การนำเข้าด้วยรหัสภาพ 2 มิติ (ประเภท อุปกรณ์อ่าน และการใช้งาน)",
      subtitle: "ตระกูล QR Code (Model 2, Micro QR, rMQR, SQRC) Static vs Dynamic QR และการแก้ปัญหาการสแกน"
    },
    {
      no: 9,
      moduleId: 3,
      code: "Unit 9",
      title: "ความปลอดภัยในการนำเข้าข้อมูล",
      subtitle: "ความเสี่ยงด้านบุคคล อุปกรณ์ ข้อมูล และความเป็นส่วนตัว การตั้งค่า Data Validation การคำนวณ Check Digit และภัย Quishing"
    },
    {
      no: 10,
      moduleId: 3,
      code: "Unit 10",
      title: "การเข้ารหัสข้อมูล SSL/TLS กับ Hashing",
      subtitle: "หลักการ Data Encryption โปรโตคอล HTTPS/TLS 6 ขั้นตอน การตรวจใบรับรองเว็บไซต์ และ SHA-256 Hashing"
    },
    {
      no: 11,
      moduleId: 3,
      code: "Unit 11",
      title: "เทคโนโลยีระบุตัวตนด้วยคลื่นความถี่วิทยุ (RFID)",
      subtitle: "องค์ประกอบ Tag / Reader แหล่งพลังงาน Passive / Active ย่านความถี่ LF, HF (13.56 MHz), UHF และปัจจัยที่มีผลต่อการอ่าน"
    },
    {
      no: 12,
      moduleId: 3,
      code: "Unit 12",
      title: "เทคโนโลยีชีวมิติ (Biometric Input)",
      subtitle: "ชีวมิติทางกายภาพและพฤติกรรม ลักษณะเด่นลายนิ้วมือ Minutiae ขั้นตอน Enrollment และการปรับเกณฑ์ FAR / FRR"
    },
    {
      no: 13,
      moduleId: 4,
      code: "Unit 13",
      title: "ซอฟต์แวร์และโปรโตคอลที่ใช้ในการนำเข้าข้อมูล",
      subtitle: "ซอฟต์แวร์จัดการฐานข้อมูล DBMS การนำเข้าไฟล์ CSV/JSON การทำความสะอาดข้อมูลด้วย Power Query และโปรโตคอลรับส่งข้อมูล"
    },
    {
      no: 14,
      moduleId: 4,
      code: "Unit 14",
      title: "การแปลงรหัสข้อมูล (Encoding & Decoding)",
      subtitle: "ความแตกต่าง Encoding กับ Encryption มาตรฐาน ASCII, TIS-620, Unicode UTF-8 ปัญหาอักขระเพี้ยน Mojibake และ Base64"
    },
    {
      no: 15,
      moduleId: 4,
      code: "Unit 15",
      title: "การบีบอัดข้อมูล (Data Compression)",
      subtitle: "การวัดอัตราส่วนการบีบอัด Lossless vs Lossy วิธี Run-Length Encoding (RLE) พจนานุกรม LZ และ Huffman Coding"
    },
    {
      no: 16,
      moduleId: 4,
      code: "Unit 16",
      title: "การประยุกต์ใช้งานเทคโนโลยีการนำเข้าข้อมูล",
      subtitle: "แผนที่เปรียบเทียบเทคโนโลยีทั้งรายวิชา สี่คำถามก่อนเลือกเทคโนโลยี และการออกแบบระบบนำเข้าข้อมูลในสถานการณ์จริง"
    }
  ]
};

window.AppUtils = {
  /**
   * แปลงวินาทีเป็นข้อความเวลา MM:SS เช่น 125 -> "02:05"
   */
  formatDuration(totalSec) {
    const sec = Math.max(0, Math.round(Number(totalSec || 0)));
    const mins = Math.floor(sec / 60);
    const rem = sec % 60;
    const mm = String(mins).padStart(2, "0");
    const ss = String(rem).padStart(2, "0");
    return `${mm}:${ss}`;
  },

  /**
   * แปลงวันที่ ISO เป็นรูปแบบวันที่ภาษาไทยที่อ่านสวยงาม
   */
  formatThaiDate(isoStr) {
    const d = isoStr ? new Date(isoStr) : new Date();
    const safeDate = Number.isNaN(d.getTime()) ? new Date() : d;
    return safeDate.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  },

  /**
   * สร้างรูป SVG ตัวอักษรย่อกรณีรูปจาก Drive โหลดไม่ได้ชั่วคราว
   */
  buildInitialsAvatarDataUrl(fullName) {
    const clean = String(fullName || "ผู้เรียน").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    let initials = "ST";
    if (parts.length >= 2) {
      initials = (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    } else if (parts.length === 1 && parts[0].length > 0) {
      initials = parts[0].slice(0, 2).toUpperCase();
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <rect width="128" height="128" rx="64" fill="#DCE8FA"/>
      <text x="64" y="74" text-anchor="middle" font-family="Mitr, sans-serif" font-size="40" font-weight="600" fill="#10397E">${initials}</text>
    </svg>`;
    return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
  },

  escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  },

  showToast(message, type = "info") {
    const stack = document.getElementById("toast-stack");
    if (!stack) return;

    const item = document.createElement("div");
    item.className = "toast-item";
    const dotClass =
      type === "success" ? "is-success" : type === "error" ? "is-error" : "is-info";

    item.innerHTML = `
      <span class="toast-dot ${dotClass}"></span>
      <span>${window.AppUtils.escapeHtml(message)}</span>
    `;
    stack.appendChild(item);

    setTimeout(() => {
      item.style.opacity = "0";
      item.style.transform = "translateY(6px)";
      setTimeout(() => item.remove(), 220);
    }, 3400);
  }
};
