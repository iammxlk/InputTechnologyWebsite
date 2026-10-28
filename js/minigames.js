/**
 * ============================================================================
 * js/minigames.js — Interactive Endless Time-Attack Arcade Engine & Modals
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * สถาปัตยกรรม:
 *   - โหมด Endless Time-Attack: แข่งกับเวลาสะสมคะแนนไม่จำกัด ตอบถูก +3s ตอบผิด -3s
 *   - Combo Multiplier (1.5x, 2.0x, 3.0x FEVER MODE)
 *   - Procedural Web Audio API สำหรับเสียงสังเคราะห์ความเร็วสูงแบบ Zero-Asset
 *   - Zero-Emoji Anti-Slop Policy (ใช้ SVG Vector Icons & Clean Badges เท่านั้น)
 *   - ภาพอุปกรณ์เวกเตอร์เทคนิคและการจำลองสัญญาณฮาร์ดแวร์จริง
 * ============================================================================
 */

(function () {
  "use strict";

  const CFG = window.APP_CONFIG;

  // Anti-Slop Clean Inline SVG Icons (No Emojis)
  const SVG = {
    clock: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    spark: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>',
    trophy: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2"></path><path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H7c-.55 0-1 .45-1 1v1h12v-1c0-.55-.45-1-1-1h-2c-.55 0-1-.45-1-1v-2.34"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>',
    target: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>',
    refresh: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
    arrowLeft: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>',
    check: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    cross: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>',
    flame: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>',
    chip: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>'
  };

  /* ==========================================================================
     1. PROCEDURAL WEB AUDIO SUBSYSTEM (SAFE ZERO-ASSET ARCADE FEEDBACK)
     ========================================================================== */

  let audioCtx = null;
  let isSoundEnabled = true;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  const GameAudio = {
    playStart() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      [330, 440, 660, 880].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.0001, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.05 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.13);
      });
    },

    playHit(streak = 1) {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const baseFreq = 520 + Math.min(680, streak * 50);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = streak >= 5 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.22, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    },

    playMiss() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.2);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.23);
    },

    playTick() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.05, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    },

    playFinish(isStrongScore) {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = isStrongScore ? [523.25, 659.25, 783.99, 1046.5] : [440, 370, 330];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = isStrongScore ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.0001, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.32);
      });
    }
  };

  /* ==========================================================================
     2. G01 CHALLENGES POOL (32 CURATED QUESTIONS FOR ENDLESS STREAMING)
     ========================================================================== */

  const G01_CHALLENGES = [
    {
      badge: "UNIT 1 • DATA VS INFORMATION",
      image: "images/units/unit-01-raw-data-vs-info.jpg",
      consoleLabel: "RAW STREAM: คะแนนดิบรายคน [7, 8, 5, 9, 6] ยังไม่ผ่านการคำนวณสรุปผล",
      prompt: "ตัวเลขคะแนนรายคนที่เพิ่งเก็บรวบรวมมาและยังไม่ผ่านการประมวลผล จัดเป็นข้อใด?",
      options: ["ข้อมูลดิบ (Raw Data)", "สารสนเทศ (Information)", "หน่วยแสดงผล (Output)", "ซอฟต์แวร์ระบบ"],
      answer: 0,
      explanation: "ข้อเท็จจริงหรือตัวเลขที่เพิ่งเก็บรวบรวมโดยยังไม่ผ่านการประมวลผล เรียกว่าข้อมูลดิบ (Raw Data)"
    },
    {
      badge: "UNIT 1 • DATA VS INFORMATION",
      image: "images/units/unit-01-raw-data-vs-info.jpg",
      consoleLabel: "REPORT: รายงานสรุปค่าเฉลี่ยคะแนนสอบทั้งห้อง = 8.45 คะแนน",
      prompt: "ผลลัพธ์ที่ผ่านการคำนวณหาค่าเฉลี่ยเพื่อใช้ตัดสินใจวางแผนการสอน จัดเป็นข้อใด?",
      options: ["สารสนเทศ (Information)", "ข้อมูลดิบ (Raw Data)", "สัญญาณแอนะล็อก", "ฮาร์ดแวร์นำเข้า"],
      answer: 0,
      explanation: "ข้อมูลที่ผ่านการประมวลผลจนมีความหมายและนำไปใช้ตัดสินใจได้ เรียกว่าสารสนเทศ (Information)"
    },
    {
      badge: "UNIT 1 • IPO CYCLE ARCHITECTURE",
      image: "images/units/unit-01-raw-data-vs-info.jpg",
      consoleLabel: "ARCHITECTURE: ลำดับการไหลของข้อมูลในระบบคอมพิวเตอร์",
      prompt: "ลำดับขั้นตอนการทำงานพื้นฐานตามวงจร IPO ที่ถูกต้องคือข้อใด?",
      options: [
        "รับเข้า → ประมวลผล → แสดงผล → จัดเก็บ",
        "แสดงผล → ประมวลผล → รับเข้า → จัดเก็บ",
        "จัดเก็บ → รับเข้า → แสดงผล → ประมวลผล",
        "ประมวลผล → รับเข้า → แสดงผล → จัดเก็บ"
      ],
      answer: 0,
      explanation: "วงจร IPO ทำงานเรียงลำดับจาก Input → Process → Output และส่งเข้าสู่ Storage"
    },
    {
      badge: "UNIT 2 • COMPUTER INPUT SYSTEMS",
      image: "images/units/unit-02-input-devices.jpg",
      consoleLabel: "BUS SIGNAL: พอร์ต USB/HID เชื่อมต่ออุปกรณ์เข้าสู่ Motherboard",
      prompt: "กลุ่มอุปกรณ์ในข้อใดทำหน้าที่เป็น 'อุปกรณ์รับเข้า (Input Devices)' ทั้งหมด?",
      options: [
        "คีย์บอร์ด, เมาส์, สแกนเนอร์, ไมโครโฟน",
        "จอภาพ, เครื่องพิมพ์, ลำโพง, หูฟัง",
        "ซีพียู, แรม, การ์ดจอ, ฮาร์ดดิสก์",
        "พาวเวอร์ซัพพลาย, พัดลมระบายความร้อน, เมนบอร์ด"
      ],
      answer: 0,
      explanation: "คีย์บอร์ด เมาส์ สแกนเนอร์ และไมโครโฟน เป็นอุปกรณ์นำสัญญาณกายภาพเข้าสู่ระบบคอมพิวเตอร์"
    },
    {
      badge: "UNIT 2 • ANALOG TO DIGITAL (ADC)",
      image: "images/units/unit-02-input-devices.jpg",
      consoleLabel: "SIGNAL CONVERTER: คลื่นเสียงต่อเนื่องแปลงเป็นบิต 0 และ 1",
      prompt: "วงจรที่ทำหน้าที่แปลงสัญญาณคลื่นกายภาพแอนะล็อกให้กลายเป็นข้อมูลดิจิทัลคืออะไร?",
      options: [
        "ADC (Analog-to-Digital Converter)",
        "DAC (Digital-to-Analog Converter)",
        "GPU (Graphics Processing Unit)",
        "ROM (Read-Only Memory)"
      ],
      answer: 0,
      explanation: "ADC ทำหน้าที่สุ่มตัวอย่าง (Sampling) และแปลงสัญญาณแอนะล็อกเป็นบิตดิจิทัล 0 และ 1"
    },
    {
      badge: "UNIT 2 • DIRECT MEMORY ACCESS (DMA)",
      image: "images/units/unit-02-input-devices.jpg",
      consoleLabel: "MEMORY BUS: ถ่ายโอนข้อมูลสแกนเนอร์ความเร็วสูงเข้าสู่ RAM",
      prompt: "เทคโนโลยี DMA (Direct Memory Access) มีประโยชน์หลักอย่างไรต่อการนำเข้าข้อมูล?",
      options: [
        "ส่งข้อมูลเข้าสู่ RAM โดยตรงโดยไม่ต้องรบกวนการทำงานของ CPU",
        "เพิ่มความละเอียดของภาพสแกนเนอร์ให้สูงขึ้น 2 เท่า",
        "ป้องกันไฟฟ้าลัดวงจรบนแผงวงจรคีย์บอร์ด",
        "เปลี่ยนสัญญาณภาพขาวดำให้เป็นภาพสีอัตโนมัติ"
      ],
      answer: 0,
      explanation: "DMA ช่วยให้อุปกรณ์ฮาร์ดแวร์ส่งข้อมูลเข้า RAM ได้โดยตรง ช่วยลดภาระของ CPU ได้อย่างมาก"
    },
    {
      badge: "UNIT 3 • MECHANICAL KEYBOARD SWITCH",
      image: "images/minigames/g01-mech-switch.jpg",
      consoleLabel: "HARDWARE CUTAWAY: ชิ้นส่วนกลไกภายในสวิตช์คีย์บอร์ด",
      prompt: "ชิ้นส่วนใดภายในสวิตช์แมคคานิคอลทำหน้าที่ดีดแกนสวิตช์ (Stem) ให้เด้งกลับตำแหน่งเดิมเมื่อปล่อยนิ้ว?",
      options: [
        "สปริงโลหะ (Return Spring)",
        "แผ่นหน้าสัมผัสทองคำ (Leaf Contacts)",
        "ฝาครอบสวิตช์บน (Upper Housing)",
        "แผ่นไดโอดเมทริกซ์ (Matrix Diode)"
      ],
      answer: 0,
      explanation: "สปริงโลหะขดลวด (Spring) ทำหน้าที่ต้านแรงกดและดันแกนสวิตช์กลับคืนตำแหน่งตั้งต้น"
    },
    {
      badge: "UNIT 3 • KEYBOARD CONTACTS",
      image: "images/minigames/g01-mech-switch.jpg",
      consoleLabel: "METALLURGY: แผ่นโลหะนำกระแสไฟฟ้าเมื่อถูกกดชนกัน",
      prompt: "แผ่นหน้าสัมผัสภายในสวิตช์แมคคานิคอลมักชุบด้วยโลหะชนิดใดเพื่อป้องกันสนิมและนำไฟฟ้าได้ฉับไว?",
      options: [
        "ทองคำ (Gold-plated Contacts)",
        "อะลูมิเนียม (Aluminium)",
        "เหล็กกล้าคาร์บอน (Carbon Steel)",
        "ตะกั่วบัดกรี (Lead Solder)"
      ],
      answer: 0,
      explanation: "ทองคำไม่เกิดออกไซด์สนิมและมีความต้านทานสัมผัสต่ำ จึงถูกใช้ชุบบนหน้าสัมผัสสวิตช์ระดับพรีเมียม"
    },
    {
      badge: "UNIT 3 • CONTACT DEBOUNCING",
      image: "images/minigames/g01-mech-switch.jpg",
      consoleLabel: "SIGNAL BOUNCE: สัญญาณไฟฟ้ากระดอนหลายครั้งภายใน 5ms ขณะหน้าสัมผัสแตะกัน",
      prompt: "กระบวนการป้องกันไม่ให้แป้นพิมพ์ส่งตัวอักษรซ้ำเบิ้ลจากการกระดอนของหน้าสัมผัสโลหะ เรียกว่าอะไร?",
      options: [
        "การดีบาวน์ (Debouncing Filter 5ms)",
        "การโอเวอร์คล็อก (Overclocking)",
        "การบีบอัดข้อมูล (Compression)",
        "การมอดูเลตคลื่น (Modulation)"
      ],
      answer: 0,
      explanation: "Debouncing เป็นวงจรหรือเฟิร์มแวร์ที่หน่วงเวลา 5ms เพื่อรอให้สัญญาณโลหะนิ่งสนิทก่อนบันทึกการกด"
    },
    {
      badge: "UNIT 3 • KEYBOARD GHOSTING & NKRO",
      image: "images/units/unit-03-keyboard-mouse.jpg",
      consoleLabel: "MATRIX SCAN: กดปุ่มพร้อมกันมากกว่า 6 ปุ่มในเกมมิ่ง",
      prompt: "คุณสมบัติ N-Key Rollover (NKRO) ในคีย์บอร์ดมีความหมายตรงกับข้อใด?",
      options: [
        "สามารถกดปุ่มพร้อมกันได้ไม่จำกัดจำนวนปุ่มโดยไม่มีปุ่มตกหล่น",
        "ปุ่มกดมีไฟ RGB ปรับแต่งได้ 16.8 ล้านสี",
        "สามารถพิมพ์ภาษาไทยและอังกฤษได้พร้อมกัน",
        "คีย์บอร์ดมีแป้นตัวเลขแยกด้านขวา"
      ],
      answer: 0,
      explanation: "NKRO อาศัยไดโอดประจำทุกปุ่ม ทำให้กดปุ่มพร้อมกันกี่ปุ่มระบบก็บันทึกได้ครบหมดโดยไม่เกิด Ghosting"
    },
    {
      badge: "UNIT 3 • OPTICAL MOUSE SENSOR",
      image: "images/units/unit-03-keyboard-mouse.jpg",
      consoleLabel: "SURFACE IMAGER: ถ่ายภาพความเร็วสูง 12,000 เฟรม/วินาที ใต้ท้องเมาส์",
      prompt: "เซนเซอร์ถ่ายภาพพื้นผิวความเร็วสูงที่ติดตั้งอยู่ใต้ตัวเมาส์ออปติคัลคือเซนเซอร์ประเภทใด?",
      options: [
        "เซนเซอร์ภาพ CMOS (Optoelectronic Sensor)",
        "เซนเซอร์สั่นสะเทือนแบบเพียโซ",
        "เซนเซอร์สนามแม่เหล็ก Hall Effect",
        "เซนเซอร์อินฟราเรดตรวจจับควัน"
      ],
      answer: 0,
      explanation: "เมาส์ออปติคัลใช้เซนเซอร์กล้อง CMOS จิ๋วถ่ายภาพพื้นผิวต่อเนื่องนับหมื่นเฟรมต่อวินาที"
    },
    {
      badge: "UNIT 3 • MOUSE DSP PROCESSOR",
      image: "images/units/unit-03-keyboard-mouse.jpg",
      consoleLabel: "VECTOR ENGINE: เปรียบเทียบภาพเฟรมปัจจุบันกับเฟรมก่อนหน้า",
      prompt: "ชิปประมวลผล DSP (Digital Signal Processor) ในเมาส์ออปติคัลทำหน้าที่คำนวณสิ่งใด?",
      options: [
        "เวกเตอร์การเคลื่อนที่บนแกน X และแกน Y (ΔX, ΔY)",
        "อุณหภูมิความร้อนของฝ่ามือผู้ใช้",
        "แรงดันไฟฟ้าของพอร์ต USB",
        "ความสว่างของหน้าจอคอมพิวเตอร์"
      ],
      answer: 0,
      explanation: "DSP นำภาพพิกเซลมาเทียบความเลื่อนเพื่อคำนวณระยะการเคลื่อนที่ในแกน X และ Y ส่งไปยัง OS"
    },
    {
      badge: "UNIT 3 • MOUSE SENSITIVITY DPI",
      image: "images/units/unit-03-keyboard-mouse.jpg",
      consoleLabel: "RESOLUTION METRIC: ตั้งค่าเมาส์ 16,000 DPI สำหรับจอภาพ 4K",
      prompt: "ค่า DPI (Dots Per Inch) หรือ CPI ในเมาส์คอมพิวเตอร์ใช้วัดสิ่งใด?",
      options: [
        "ความละเอียดความไวในการตรวจจับพิกัดต่อนิ้วที่เคลื่อนที่ไป",
        "น้ำหนักตัวเมาส์รวมสายสัญญาณ",
        "ความดังเสียงคลิกของสวิตช์เมาส์",
        "ปริมาณการกินพลังงานไฟฟ้ากระแสตรง"
      ],
      answer: 0,
      explanation: "DPI (Counts Per Inch) ระบุว่าเมื่อเลื่อนเมาส์ไป 1 นิ้ว เซนเซอร์จะรายงานพิกัดกี่หน่วยนับ"
    },
    {
      badge: "UNIT 3 • POLLING RATE LATENCY",
      image: "images/units/unit-03-keyboard-mouse.jpg",
      consoleLabel: "USB REPORT RATE: รายงานพิกัด 1000 ครั้งต่อวินาที (1000 Hz)",
      prompt: "เมาส์ที่มี Polling Rate 1000 Hz จะมีความหน่วงในการส่งสัญญาณ (Latency) เท่าใด?",
      options: [
        "1 มิลลิวินาที (1 ms)",
        "8 มิลลิวินาที (8 ms)",
        "100 มิลลิวินาที (100 ms)",
        "1 วินาที (1 s)"
      ],
      answer: 0,
      explanation: "ความถี่ 1000 Hz หมายถึงส่งข้อมูล 1000 ครั้งใน 1 วินาที จึงมีความหน่วงเพียง 1/1000 = 1 ms"
    },
    {
      badge: "UNIT 4 • FLATBED SCANNER CCD",
      image: "images/units/unit-04-scanner-camera-mic.jpg",
      consoleLabel: "OPTICAL BENCH: กระจกสะท้อนและเลนส์ลดขนาดรวมแสงเข้าสู่ชิปเซนเซอร์",
      prompt: "สแกนเนอร์แบบแท่นกระจก CCD อาศัยชิ้นส่วนใดในการรวมแสงจากเอกสารลงสู่ตัวรับสัญญาณ?",
      options: [
        "เลนส์ลดขนาดและกระจกสะท้อนหลายบาน (Reduction Mirrors)",
        "หัวอ่านแม่เหล็กความเหนี่ยวนำสูง",
        "เสาอากาศรับคลื่นวิทยุไมโครเวฟ",
        "ไดอะแฟรมแผ่นฟิล์มโลหะ"
      ],
      answer: 0,
      explanation: "สแกนเนอร์ CCD รวมแสงจากหลอดไฟสะท้อนผ่านกระจกและเลนส์ลดขนาดลงสู่แถวเซนเซอร์ CCD"
    },
    {
      badge: "UNIT 4 • SCANNER CCD VS CIS",
      image: "images/units/unit-04-scanner-camera-mic.jpg",
      consoleLabel: "SENSOR COMPARISON: เซนเซอร์สัมผัสแนบชิดเอกสาร Contact Image Sensor",
      prompt: "ข้อใดคือจุดเด่นสำคัญของสแกนเนอร์ที่ใช้เซนเซอร์แบบ CIS (Contact Image Sensor)?",
      options: [
        "ขนาดกะทัดรัด ตัวเครื่องบางเบา ประหยัดพลังงาน ใช้ไฟ LED RGB",
        "มีระยะชัดลึก (Depth of Field) สูงมากสแกนวัตถุหนาได้คมชัด",
        "ใช้หลอดไฟนีออนแรงดันสูงและเลนส์ขยายกระจกสะท้อน",
        "มีราคาสูงที่สุดในอุตสาหกรรมโรงพิมพ์ระดับมืออาชีพ"
      ],
      answer: 0,
      explanation: "CIS จัดวางเซนเซอร์ติดชิดกระจกทำให้เครื่องบางเบาและกินไฟน้อย แต่ระยะชัดลึกจะน้อยกว่า CCD"
    },
    {
      badge: "UNIT 4 • OPTICAL RESOLUTION",
      image: "images/units/unit-04-scanner-camera-mic.jpg",
      consoleLabel: "HARDWARE SPECS: ความละเอียดเซนเซอร์ฮาร์ดแวร์จริง 1200 x 2400 DPI",
      prompt: "ความละเอียดในการสแกนภาพที่แท้จริงซึ่งเกิดจากฮาร์ดแวร์ตัวรับภาพ เรียกว่าอะไร?",
      options: [
        "ความละเอียดเชิงแสงจริง (Optical Hardware DPI)",
        "ความละเอียดแบบสอดแทรกซอฟต์แวร์ (Interpolated DPI)",
        "ความถี่ในการสุ่มสัญญาณเสียง (Sampling Rate)",
        "ความเร็วในการหมุนรอบของมอเตอร์สเต็ป"
      ],
      answer: 0,
      explanation: "Optical DPI คือความละเอียดจริงจากจำนวนเม็ดพิกเซลบนแถบเซนเซอร์ CCD/CIS"
    },
    {
      badge: "UNIT 4 • CAMERA CMOS & BAYER FILTER",
      image: "images/units/unit-04-scanner-camera-mic.jpg",
      consoleLabel: "COLOR MATRIX: แผ่นฟิลเตอร์แม่สีจัดเรียงแบบ RGGB บนเซนเซอร์กล้อง",
      prompt: "กล้องดิจิทัลใช้แผ่นกรองสีชนิดใดจัดวางบนเซนเซอร์รับภาพเพื่อแยกแม่สี แดง เขียว น้ำเงิน?",
      options: [
        "Bayer Color Filter Array (RGGB Matrix)",
        "Polaroid Linear Filter",
        "Prism Dispersion Array",
        "Infrared Cut-off Filter"
      ],
      answer: 0,
      explanation: "Bayer Filter วางแผ่นกรองแม่สีเขียว แดง น้ำเงิน บนแต่ละพิกเซลเพื่อคำนวณสีภาพที่สมบูรณ์"
    },
    {
      badge: "UNIT 4 • CONDENSER MICROPHONE",
      image: "images/units/unit-04-scanner-camera-mic.jpg",
      consoleLabel: "ACOUSTIC CAPSULE: แผ่นไดอะแฟรมทองคำสั่นไหวเมื่อถูกคลื่นเสียงตกกระทบ",
      prompt: "ไมโครโฟนประเภทคอนเดนเซอร์ (Condenser Microphone) ผลิตสัญญาณไฟฟ้าด้วยหลักการใด?",
      options: [
        "การเปลี่ยนแปลงค่าความจุไฟฟ้า (Capacitance) ระหว่างแผ่นขั้วโลหะ",
        "การเหนี่ยวนำแม่เหล็กผ่านขดลวดเคลื่อนที่",
        "การหักเหแสงผ่านเลนส์แก้วคริสตัล",
        "การหมุนของเฟืองจักรกลสปริง"
      ],
      answer: 0,
      explanation: "ไมค์คอนเดนเซอร์ใช้แผ่นไดอะแฟรมสั่นเปลี่ยนระยะห่างขั้วประจุ ทำให้ค่าความจุไฟฟ้าเปลี่ยนเป็นสัญญาณเสียง"
    },
    {
      badge: "UNIT 4 • PHANTOM POWER 48V",
      image: "images/units/unit-04-scanner-camera-mic.jpg",
      consoleLabel: "POWER SUPPLY: สวิตช์ +48V บน Audio Interface สำหรับไมค์สตูดิโอ",
      prompt: "ไฟเลี้ยงแรงดัน 48 โวลต์ที่จ่ายผ่านสายสัญญาณ XLR เพื่อเลี้ยงวงจรไมค์คอนเดนเซอร์ เรียกว่าอะไร?",
      options: [
        "ไฟเลี้ยงแฟนท่อม (48V Phantom Power)",
        "ไฟฟ้ากระแสสลับสำรอง (AC Power)",
        "สัญญาณคลื่นวิทยุความถี่สูง",
        "แรงดันสนามแม่เหล็กเหนี่ยวนำ"
      ],
      answer: 0,
      explanation: "48V Phantom Power เป็นไฟเลี้ยงมาตรฐานจ่ายผ่านสาย XLR สำหรับโพลาไรซ์แผ่นประจุไมค์คอนเดนเซอร์"
    },
    {
      badge: "UNIT 4 • AUDIO SAMPLING RATE",
      image: "images/units/unit-04-scanner-camera-mic.jpg",
      consoleLabel: "NYQUIST THEOREM: การสุ่มตัวอย่างคลื่นเสียงความถี่สูงสุด 20,000 Hz",
      prompt: "ตามทฤษฎีการสุ่มตัวอย่างของไนควิสต์ หากต้องการบันทึกเสียงความถี่ 20 kHz ต้องใช้อัตราสุ่มตัวอย่างเท่าใด?",
      options: [
        "อย่างน้อย 40 kHz (อย่างน้อย 2 เท่าของความถี่สูงสุด)",
        "อย่างน้อย 10 kHz (ครึ่งหนึ่งของความถี่)",
        "เท่ากับ 20 kHz พอดี",
        "ไม่จำกัดอัตราความถี่ใดๆ"
      ],
      answer: 0,
      explanation: "ทฤษฎี Nyquist-Shannon ระบุว่า Sampling Rate ต้องมากกว่าหรือเท่ากับ 2 เท่าของความถี่สูงสุด"
    },
    {
      badge: "UNIT 4 • AUDIO BIT DEPTH",
      image: "images/units/unit-04-scanner-camera-mic.jpg",
      consoleLabel: "QUANTIZATION: สัญญาณเสียงขนาด 24-bit ความละเอียดสตูดิโอ",
      prompt: "การสุ่มตัวอย่างระดับเสียงดิจิทัลขนาด 24-bit มีจำนวนระดับขั้นแรงดัน (Quantization Levels) เท่าใด?",
      options: [
        "16,777,216 ระดับ (2 ยกกำลัง 24)",
        "65,536 ระดับ (2 ยกกำลัง 16)",
        "256 ระดับ (2 ยกกำลัง 8)",
        "24 ระดับ"
      ],
      answer: 0,
      explanation: "ความลึกบิต 24-bit สามารถแบ่งขั้นความดังเสียงได้ละเอียดถึง 2^24 = 16,777,216 ระดับ"
    },
    {
      badge: "UNIT 2 • SCAN CODE PROTOCOL",
      image: "images/units/unit-02-input-devices.jpg",
      consoleLabel: "KEYSTROKE PACKET: รหัสที่ส่งเมื่อนิ้วกดปุ่มและยกนิ้วปล่อยปุ่ม",
      prompt: "รหัสคำสั่งที่แป้นพิมพ์ส่งออกไปเมื่อกดปุ่มลงและปล่อยปุ่มขึ้น เรียกว่าอะไร?",
      options: [
        "Make Code (เมื่อกด) และ Break Code (เมื่อปล่อย)",
        "Upload Code และ Download Code",
        "Start Bit และ Stop Bit",
        "Syntax Code และ Error Code"
      ],
      answer: 0,
      explanation: "คีย์บอร์ดส่ง Make Code เมื่อแป้นถูกกดลง และส่ง Break Code เมื่อปล่อยนิ้วออกจากแป้น"
    },
    {
      badge: "UNIT 2 • MOTHERBOARD CHIPSET",
      image: "images/units/unit-02-input-devices.jpg",
      consoleLabel: "I/O CONTROLLER: จัดการควบคุมพอร์ต USB, SATA และ Audio บนเมนบอร์ด",
      prompt: "ชิปเซ็ตบนเมนบอร์ดที่ทำหน้าที่ควบคุมการรับส่งข้อมูลของอุปกรณ์ต่อพ่วง I/O คือชิปส่วนใด?",
      options: [
        "Southbridge / PCH (Platform Controller Hub)",
        "Northbridge / Memory Controller",
        "L1 Cache Processor",
        "BIOS ROM Chip"
      ],
      answer: 0,
      explanation: "Southbridge หรือ PCH ทำหน้าที่เป็นศูนย์กลางควบคุมบัสอุปกรณ์ต่อพ่วง Input/Output ทั้งหมด"
    }
  ];

  /* ==========================================================================
     2.1 G02 CHALLENGES POOL (MODULE 2: UNITS 5–8 BARCODE & QR CODE)
     ========================================================================== */
// Challenge pools for G02, G03, and G04

const G02_CHALLENGES = [
  {
    badge: "UNIT 5 • 1D BARCODE PHYSICS",
    image: "images/units/unit-05-1d-barcode.jpg",
    consoleLabel: "OPTICAL SENSOR: ลำแสงเลเซอร์ 650nm สะท้อนกลับจากแท่งบาร์โค้ด",
    prompt: "ในกระบวนการอ่านบาร์โค้ด 1 มิติ แถบสีขาวและแถบสีดำทำหน้าที่สะท้อนแสงอย่างไร?",
    options: [
      "แถบขาวสะท้อนแสงมาก แถบดำดูดกลืนแสง",
      "แถบดำสะท้อนแสงมาก แถบขาวดูดกลืนแสง",
      "ทั้งสองแถบสะท้อนแสงในปริมาณเท่ากัน",
      "แถบดำสะท้อนแสงเฉพาะคลื่นอินฟราเรด"
    ],
    answer: 0,
    explanation: "แถบขาวจะสะท้อนลำแสงเลเซอร์กลับไปยังโฟโต้ไดโอดมาก ส่วนแถบดำจะดูดกลืนแสง เกิดเป็นพัลส์คลื่นไฟฟ้าเพื่อถอดรหัส"
  },
  {
    badge: "UNIT 5 • BARCODE SENSORS",
    image: "images/devices/device-05-barcode-scanner.jpg",
    consoleLabel: "HARDWARE DECODE: เปรียบเทียบเทคโนโลยีหัวอ่านบาร์โค้ด",
    prompt: "หัวอ่านบาร์โค้ดแบบ CCD แตกต่างจากหัวอ่านแบบเลเซอร์ (Laser Scanner) ในข้อใด?",
    options: [
      "CCD ใช้แถวเซนเซอร์รับภาพและไม่มีชิ้นส่วนกลไกเคลื่อนไหว",
      "CCD ใช้กระจกหมุน Polygon Mirror เพื่อกวาดแสง",
      "CCD ยิงลำแสงเลเซอร์ได้ระยะไกลกว่า 10 เมตร",
      "CCD ใช้อ่านได้เฉพาะแถบแม่เหล็กเท่านั้น"
    ],
    answer: 0,
    explanation: "หัวอ่าน CCD ใช้แถวโฟโต้ไดโอดจับภาพแสงสะท้อนพร้อมกัน จึงทนทานเพราะไม่มีชิ้นส่วนกลไกหมุนสั่นไหว"
  },
  {
    badge: "UNIT 5 • EAN-13 STANDARDS",
    image: "images/units/unit-05-1d-barcode.jpg",
    consoleLabel: "STANDARDS: โครงสร้างรหัสบาร์โค้ดสากลบนสินค้าอุปโภคบริโภค",
    prompt: "บาร์โค้ดมาตรฐาน EAN-13 ประกอบด้วยตัวเลขทั้งหมดกี่หลัก?",
    options: [
      "13 หลัก",
      "12 หลัก",
      "10 หลัก",
      "16 หลัก"
    ],
    answer: 0,
    explanation: "EAN-13 มีตัวเลขทั้งหมด 13 หลัก โดยหลักที่ 13 สุดท้ายทำหน้าที่เป็น Check Digit เพื่อตรวจความถูกต้อง"
  },
  {
    badge: "UNIT 5 • CHECK DIGIT CALCULATION",
    image: "images/units/unit-05-1d-barcode.jpg",
    consoleLabel: "ALGORITHM: การคำนวณเลขตรวจสอบความถูกต้องของ EAN-13",
    prompt: "ในการคำนวณ Check Digit ของบาร์โค้ด EAN-13 ตัวเลขในตำแหน่งคู่จะถูกคูณด้วยน้ำหนักเท่าใด?",
    options: [
      "คูณด้วย 3",
      "คูณด้วย 1",
      "คูณด้วย 5",
      "คูณด้วย 7"
    ],
    answer: 0,
    explanation: "สูตร EAN-13 กำหนดให้นำตัวเลขตำแหน่งคี่คูณ 1 และตำแหน่งคู่คูณ 3 ก่อนนำผลรวมมาคำนวณ Modulo 10"
  },
  {
    badge: "UNIT 5 • EAN-13 COUNTRY PREFIX",
    image: "images/units/unit-05-1d-barcode.jpg",
    consoleLabel: "PREFIX LOOKUP: รหัส GS1 Prefix ประจำประเทศไทย",
    prompt: "บาร์โค้ด EAN-13 ที่ขึ้นต้นด้วยตัวเลข '885' บ่งบอกถึงประเทศใด?",
    options: [
      "ประเทศไทย (Thailand)",
      "ประเทศญี่ปุ่น (Japan)",
      "ประเทศสิงคโปร์ (Singapore)",
      "ประเทศมาเลเซีย (Malaysia)"
    ],
    answer: 0,
    explanation: "รหัส 885 คือ GS1 Country Code ของประเทศไทย"
  },
  {
    badge: "UNIT 6 • WIRELESS TRANSMISSION",
    image: "images/devices/device-05-barcode-scanner.jpg",
    consoleLabel: "RF PROTOCOL: การส่งสัญญาณข้อมูลแบบไร้สายของเครื่องอ่านบาร์โค้ด",
    prompt: "เครื่องสแกนบาร์โค้ดไร้สายแบบพกพานิยมเชื่อมต่อกับสถานีฐาน (Cradle) ด้วยคลื่นความถี่ใด?",
    options: [
      "Bluetooth หรือคลื่น 2.4 GHz RF",
      "คลื่นวิทยุ AM / FM",
      "คลื่นเสียงอัลตราซาวด์",
      "สายแลนไฟเบอร์ออปติก"
    ],
    answer: 0,
    explanation: "เครื่องสแกนเนอร์ไร้สายส่วนใหญ่สื่อสารผ่าน Bluetooth หรือคลื่น 2.4 GHz RF ไปยัง Cradle หรือคอมพิวเตอร์"
  },
  {
    badge: "UNIT 6 • BATCH MODE BUFFER",
    image: "images/devices/device-05-barcode-scanner.jpg",
    consoleLabel: "INVENTORY WORKFLOW: การตรวจนับสต็อกสินค้านอกระยะสัญญาณไร้สาย",
    prompt: "เมื่อนำเครื่องสแกนไปใช้งานนอกระยะสัญญาณไร้สาย ฟังก์ชัน 'Batch Mode' ทำงานอย่างไร?",
    options: [
      "บันทึกข้อมูลเก็บไว้ในหน่วยความจำของเครื่อง แล้วส่งออกทีเดียวเมื่อเชื่อมต่อ",
      "หยุดการทำงานทันทีและส่งเสียงแจ้งเตือนความผิดพลาด",
      "ลบข้อมูลที่สแกนทิ้งเพื่อป้องกันข้อมูลซ้ำซ้อน",
      "ส่งสัญญาณขอความช่วยเหลือไปยังเซิร์ฟเวอร์สำรอง"
    ],
    answer: 0,
    explanation: "Batch Mode (โหมดพักข้อมูล) จะจัดเก็บรหัสบาร์โค้ดลงในหน่วยความจำภายในเครื่อง และถ่ายโอนทั้งหมดเมื่อกลับเข้าแท่นเชื่อมต่อ"
  },
  {
    badge: "UNIT 6 • OMNIDIRECTIONAL SCANNER",
    image: "images/devices/device-06-omni-scanner.svg",
    consoleLabel: "POLYGON MIRROR: เครื่องสแกนแบบหลายทิศทางในซูเปอร์มาร์เก็ต",
    prompt: "ข้อดีสำคัญของเครื่องอ่านบาร์โค้ดแบบหลายทิศทาง (Omnidirectional Scanner) คือข้อใด?",
    options: [
      "อ่านบาร์โค้ดได้ทุกทิศทางโดยไม่ต้องหมุนสินค้าให้ตรงแนวระนาบ",
      "ประหยัดพลังงานมากกว่าเครื่องสแกนเลเซอร์มือถือ",
      "สามารถซ่อมแซมบาร์โค้ดที่ฉีกขาดได้ 100%",
      "ไม่ต้องใช้กระแสไฟฟ้าในการทำงาน"
    ],
    answer: 0,
    explanation: "ลำแสงเลเซอร์หลายเส้นที่ตัดกันเป็นตาข่าย ช่วยให้อ่านรหัสสินค้าได้รวดเร็วทันทีไม่ว่าจะหันบาร์โค้ดในมุมใด"
  },
  {
    badge: "UNIT 6 • 2D AREA IMAGER",
    image: "images/devices/device-07-2d-imager.svg",
    consoleLabel: "SCREEN SCANNING: การอ่านบาร์โค้ดและ QR Code บนหน้าจอสมาร์ทโฟน",
    prompt: "เหตุใดเครื่องอ่านแบบ 2D Area Imager จึงอ่านคิวอาร์โค้ดบนจอมือถือได้ดีกว่าเครื่องอ่านเลเซอร์ 1D?",
    options: [
      "ใช้เซนเซอร์กล้องดิจิทัล CMOS ถ่ายภาพและประมวลผล ไม่สะท้อนหลอกตาจากกระจกหน้าจอ",
      "ยิงลำแสงเลเซอร์ที่มีความเข้มข้นสูงกว่า",
      "หน้าจอมือถือปล่อยคลื่นวิทยุไปกระตุ้นเซนเซอร์",
      "เครื่องอ่านเลเซอร์อ่านได้เฉพาะกระดาษมันเงาเท่านั้น"
    ],
    answer: 0,
    explanation: "Area Imager ใช้เซนเซอร์ CMOS ถ่ายภาพเมทริกซ์ 2 มิติ จึงอ่านภาพโค้ดบนจอสมาร์ทโฟนและบาร์โค้ดทุกประเภทได้อย่างแม่นยำ"
  },
  {
    badge: "UNIT 7 • QR CODE ORIGIN",
    image: "images/units/unit-06-2d-qr-matrix.jpg",
    consoleLabel: "HISTORY: กำเนิดและประวัติความเป็นมาของเทคโนโลยี QR Code",
    prompt: "รหัสคิวอาร์โค้ด (QR Code) ถูกประดิษฐ์ขึ้นครั้งแรกโดยบริษัทใดในประเทศญี่ปุ่น?",
    options: [
      "Denso Wave (ปี 1994)",
      "Sony Corporation",
      "Toyota Motors",
      "Panasonic"
    ],
    answer: 0,
    explanation: "บริษัท Denso Wave นำโดย Masahiro Hara ประดิษฐ์ QR Code ในปี 1994 เพื่อติดตามชิ้นส่วนยานยนต์ในโรงงาน"
  },
  {
    badge: "UNIT 7 • FINDER PATTERNS",
    image: "images/units/unit-06-2d-qr-matrix.jpg",
    consoleLabel: "GEOMETRY RATIO: จุดตรวจจับตำแหน่ง 3 มุมของ QR Code",
    prompt: "จุด Finder Pattern ที่มุมทั้งสามของ QR Code มีสัดส่วนความกว้างของโมดูล (ดำ:ขาว:ดำ:ขาว:ดำ) เท่ากับเท่าใด?",
    options: [
      "1:1:3:1:1",
      "1:2:3:2:1",
      "2:2:4:2:2",
      "1:1:1:1:1"
    ],
    answer: 0,
    explanation: "สัดส่วน 1:1:3:1:1 เป็นอัตราส่วนทองคำเฉพาะตัว ช่วยให้กล้องตรวจพบทิศทางของ QR Code ได้รอบทิศ 360 องศา"
  },
  {
    badge: "UNIT 7 • ALIGNMENT PATTERN",
    image: "images/units/unit-06-2d-qr-matrix.jpg",
    consoleLabel: "SURFACE DISTORTION: การแก้ไขความบิดเบี้ยวบนพื้นผิวโค้ง",
    prompt: "ชิ้นส่วนโครงสร้างใดใน QR Code ทำหน้าที่ช่วยปรับชดเชยระนาบเมื่อสแกนบนพื้นผิวโค้งหรือบิดเบี้ยว?",
    options: [
      "Alignment Pattern (จุดปรับแนว)",
      "Timing Pattern (เส้นกำหนดจังหวะ)",
      "Quiet Zone (พื้นที่ว่างรอบนอก)",
      "Format Information"
    ],
    answer: 0,
    explanation: "Alignment Pattern คือสี่เหลี่ยมจุดเล็กๆ ที่กระจายอยู่ภายในเพื่อดัดแก้สัดส่วนภาพที่บิดเบี้ยวบนวัสดุผิวโค้ง"
  },
  {
    badge: "UNIT 7 • TIMING PATTERN",
    image: "images/units/unit-06-2d-qr-matrix.jpg",
    consoleLabel: "COORDINATE GRID: การกำหนดระยะแถวและคอลัมน์ของเมทริกซ์",
    prompt: "Timing Pattern ในโครงสร้าง QR Code มีลักษณะอย่างไร?",
    options: [
      "เส้นแถบจุดสลับดำ-ขาวเชื่อมระหว่าง Finder Patterns เพื่อบอกพิกัดกริด",
      "เส้นทึบสีดำล้อมรอบขอบนอกของภาพ",
      "สี่เหลี่ยมทึบขนาดใหญ่ตรงจุดกึ่งกลาง",
      "แถบรหัสสีรุ้งเพื่อบอกเวอร์ชัน"
    ],
    answer: 0,
    explanation: "Timing Pattern ประกอบด้วยโมดูลดำและขาวเรียงสลับกันเป็นแนวตรง เพื่อช่วยกำหนดขนาดและพิกัดของแต่ละเซลล์ในเมทริกซ์"
  },
  {
    badge: "UNIT 7 • ERROR CORRECTION LEVELS",
    image: "images/units/unit-06-2d-qr-matrix.jpg",
    consoleLabel: "REED-SOLOMON: ระดับการกู้คืนข้อมูลที่เสียหายของ QR Code",
    prompt: "การกู้คืนข้อผิดพลาดระดับ H (Level H) ในอัลกอริทึม Reed-Solomon สามารถฟื้นฟูข้อมูลที่สูญหายได้สูงสุดกี่เปอร์เซ็นต์?",
    options: [
      "ประมาณ 30%",
      "ประมาณ 15%",
      "ประมาณ 7%",
      "ประมาณ 50%"
    ],
    answer: 0,
    explanation: "ระดับ H (High) สามารถกู้คืนข้อมูลจากโค้ดที่เปรอะเปื้อนหรือฉีกขาดได้สูงสุดถึง 30%"
  },
  {
    badge: "UNIT 7 • LOGO EMBEDDING",
    image: "images/units/unit-06-2d-qr-matrix.jpg",
    consoleLabel: "BRANDING: การวางตราสัญลักษณ์หรือโลโก้ตรงกลางแผ่น QR Code",
    prompt: "หากต้องการวางภาพโลโก้ตรงกลางของแผ่น QR Code ควรกำหนดระดับการแก้ไขข้อผิดพลาดเป็นระดับใด?",
    options: [
      "ระดับ H (High - 30%)",
      "ระดับ L (Low - 7%)",
      "ระดับ M (Medium - 15%)",
      "ไม่ต้องเปิดใช้งาน Error Correction"
    ],
    answer: 0,
    explanation: "การแปะโลโก้ตรงกลางจะบดบังข้อมูลบางส่วน จึงต้องใช้ระดับ H (30%) เพื่อให้ระบบคำนวณกู้คืนข้อมูลและอ่านได้สมบูรณ์"
  },
  {
    badge: "UNIT 7 • QUIET ZONE",
    image: "images/units/unit-06-2d-qr-matrix.jpg",
    consoleLabel: "MARGIN SPEC: ระยะขอบปลอดภัยรอบนอกของรหัส QR Code",
    prompt: "Quiet Zone หรือพื้นที่ว่างสีขาวรอบนอกของ QR Code ต้องมีความกว้างอย่างน้อยกี่โมดูล?",
    options: [
      "อย่างน้อย 4 โมดูล",
      "อย่างน้อย 1 โมดูล",
      "อย่างน้อย 8 โมดูล",
      "ไม่จำเป็นต้องเว้นพื้นที่ว่าง"
    ],
    answer: 0,
    explanation: "มาตรฐานกำหนดให้มี Quiet Zone ว่างสีขาวอย่างน้อย 4 โมดูลรอบด้าน เพื่อป้องกันไม่ให้พื้นหลังรบกวนการประมวลผลภาพ"
  },
  {
    badge: "UNIT 8 • QR FAMILY VARIATIONS",
    image: "images/devices/device-08-dynamic-qr-terminal.svg",
    consoleLabel: "MICRO QR CODE: รหัสภาพขนาดกะทัดรัดสำหรับชิ้นส่วนอิเล็กทรอนิกส์",
    prompt: "Micro QR Code แตกต่างจาก QR Code มาตรฐานในเรื่องโครงสร้างจุดสังเกตอย่างไร?",
    options: [
      "มี Finder Pattern เพียง 1 มุมเท่านั้น",
      "มี Finder Pattern ครบทั้ง 4 มุม",
      "ไม่มี Timing Pattern",
      "ต้องใช้สีแดงในการพิมพ์เท่านั้น"
    ],
    answer: 0,
    explanation: "Micro QR Code ได้รับการออกแบบให้ประหยัดพื้นที่ โดยมี Finder Pattern เพียงมุมเดียวเพื่อติดบนชิ้นส่วนขนาดเล็กมาก"
  },
  {
    badge: "UNIT 8 • RMQR CODE",
    image: "images/devices/device-08-dynamic-qr-terminal.svg",
    consoleLabel: "RECTANGULAR MATRIX: รหัสสี่เหลี่ยมผืนผ้าสำหรับพื้นที่แคบยาว",
    prompt: "รหัส rMQR Code (Rectangular Micro QR Code) เหมาะสมที่สุดสำหรับสถานการณ์ใด?",
    options: [
      "พิมพ์ติดบนหลอดแก้วทดลอง สายไฟ หรือพื้นที่แนวยาวที่แคบ",
      "แสดงผลบนป้ายบิลบอร์ดขนาดใหญ่ริมทางด่วน",
      "บันทึกไฟล์วิดีโอความคมชัดสูง",
      "ส่งสัญญาณคลื่นแม่เหล็กไฟฟ้าข้ามทวีป"
    ],
    answer: 0,
    explanation: "rMQR ออกแบบเป็นสี่เหลี่ยมผืนผ้า เพื่อให้พิมพ์ลงบนแถบแคบยาว เช่น หลอดทดลองวิทยาศาสตร์หรือสายเคเบิล"
  },
  {
    badge: "UNIT 8 • SQRC RESTRICTED ACCESS",
    image: "images/devices/device-08-dynamic-qr-terminal.svg",
    consoleLabel: "CONFIDENTIAL DATA: รหัสคิวอาร์พร้อมฟังก์ชันรักษาความลับเฉพาะองค์กร",
    prompt: "คุณสมบัติพิเศษของรหัส SQRC (Secret Function QR Code) คือข้อใด?",
    options: [
      "สามารถซ่อนข้อมูลลับที่ต้องใช้เครื่องอ่านเฉพาะและรหัสถอดรหัสจึงจะมองเห็น",
      "สามารถทำลายตัวเองได้หลังเปิดอ่าน 1 ครั้ง",
      "เชื่อมต่ออินเทอร์เน็ตได้โดยไม่ต้องใช้ Wi-Fi",
      "เปลี่ยนรูปภาพสีได้ตามอุณหภูมิห้อง"
    ],
    answer: 0,
    explanation: "SQRC เก็บข้อมูลได้ 2 ส่วน: ข้อมูลสาธารณะที่เครื่องทั่วไปอ่านได้ และข้อมูลลับที่ต้องใช้กุญแจถอดรหัสเฉพาะ"
  },
  {
    badge: "UNIT 8 • STATIC QR CODE",
    image: "images/units/unit-08-static-vs-dynamic-qr.jpg",
    consoleLabel: "FIXED PAYLOAD: สถาปัตยกรรมการทำงานของคิวอาร์โค้ดแบบคงที่",
    prompt: "ข้อจำกัดหลักของ Static QR Code (คิวอาร์โค้ดแบบคงที่) คือข้อใด?",
    options: [
      "ไม่สามารถแก้ไข URL ปลายทางและไม่สามารถเก็บสถิติจำนวนครั้งที่สแกนได้",
      "ต้องจ่ายค่าบริการเซิร์ฟเวอร์เป็นรายเดือน",
      "ไม่สามารถสั่งพิมพ์ลงบนกระดาษได้",
      "อ่านได้เฉพาะบนโทรศัพท์ระบบ Android เท่านั้น"
    ],
    answer: 0,
    explanation: "Static QR ทำการฝังข้อมูลปลายทางลงในเมทริกซ์โดยตรง จึงแก้ไขไม่ได้หลังจากพิมพ์ออกมาแล้ว และไม่มีการเก็บสถิติ"
  },
  {
    badge: "UNIT 8 • DYNAMIC QR CODE",
    image: "images/units/unit-08-static-vs-dynamic-qr.jpg",
    consoleLabel: "CLOUD REDIRECTION: สถาปัตยกรรมคลาวด์พร็อกซีและการวิเคราะห์ข้อมูล",
    prompt: "Dynamic QR Code ทำงานเชื่อมโยงไปยังปลายทางผ่านกลไกใดเป็นหลัก?",
    options: [
      "วิ่งผ่าน URL ย่อบนคลาวด์เซิร์ฟเวอร์ ทำการบันทึกสถิติแล้ว Redirect ไปยังปลายทาง",
      "ส่งสัญญาณบลูทูธไปยังเสาสัญญาณที่ใกล้ที่สุด",
      "บันทึกเว็บไซต์ทั้งเว็บลงในจุดสีดำของเมทริกซ์",
      "ใช้ชิปดาวเทียม GPS นำทาง"
    ],
    answer: 0,
    explanation: "Dynamic QR ชี้ไปยังเซิร์ฟเวอร์คลาวด์ ซึ่งสามารถเปลี่ยนเป้าหมายปลายทางได้ตลอดเวลา และเก็บข้อมูลสถิติการสแกนได้ครบถ้วน"
  },
  {
    badge: "UNIT 8 • SCAN TROUBLESHOOTING",
    image: "images/units/unit-07-scanner-types.jpg",
    consoleLabel: "CONTRAST & INVERSION: ปัญหาการสแกนโค้ดที่ไม่สามารถอ่านได้",
    prompt: "หากพิมพ์ QR Code ด้วยสีขาวบนพื้นหลังสีดำทึบ (Inverted QR) อุปกรณ์รุ่นเก่ามักสแกนไม่ติดเพราะสาเหตุใด?",
    options: [
      "อัลกอริทึมมาตรฐานคาดหวังให้ Finder Pattern มีสีเข้มบนพื้นหลังสีสว่าง",
      "สีดำดูดกลืนคลื่นแม่เหล็กไฟฟ้าทั้งหมด",
      "กระดาษสีดำมีความหนาเกินมาตรฐานสากล",
      "แสงไฟ LED ไม่สะท้อนจากวัตถุสีขาว"
    ],
    answer: 0,
    explanation: "ซอฟต์แวร์ถอดรหัสรุ่นพื้นฐานจะค้นหาสัดส่วน 1:1:3:1:1 ของแถบสีเข้มบนพื้นสว่างเท่านั้น หากกลับสีอาจทำให้ตรวจจับ Finder Pattern ล้มเหลว"
  },
  {
    badge: "UNIT 8 • DYNAMIC QR TERMINAL",
    image: "images/devices/device-08-dynamic-qr-terminal.svg",
    consoleLabel: "POS INTEGRATION: จุดรับชำระเงินดิจิทัล ณ จุดขาย",
    prompt: "แท่นแสดงผล Dynamic QR สำหรับรับชำระเงินที่เคาน์เตอร์แคชเชียร์ช่วยเพิ่มความปลอดภัยอย่างไร?",
    options: [
      "สร้างคิวอาร์โค้ดใหม่ที่มีระบุยอดเงินตรงกับบิลและหมดอายุอัตโนมัติ ป้องกันการโกงยอดเงิน",
      "ปิดกั้นสัญญาณโทรศัพท์มือถือของลูกค้า",
      "บังคับให้พิมพ์สลิปกระดาษอย่างน้อย 3 แผ่น",
      "ตัดสัญญาณอินเทอร์เน็ตของร้านค้าชั่วคราว"
    ],
    answer: 0,
    explanation: "Dynamic QR บนเครื่องคิดเงินจะผูกยอดเงินที่ถูกต้องและมีเวลากำหนดหมดอายุ ช่วยลดข้อผิดพลาดในการโอนเงินของลูกค้า"
  },
  {
    badge: "UNIT 6 • SCANNER SELECTION",
    image: "images/units/unit-07-scanner-types.jpg",
    consoleLabel: "HARDWARE DEPLOYMENT: การเลือกอุปกรณ์สำหรับคลังสินค้าขนาดใหญ่",
    prompt: "ในคลังสินค้าพาเลทสูงที่ต้องการยิงสแกนสินค้าจากระยะ 5-8 เมตร ควรเลือกใช้อุปกรณ์ประเภทใด?",
    options: [
      "เครื่องสแกนเลเซอร์ระยะไกลพิเศษ (Extended Range Laser Scanner)",
      "สแกนเนอร์แท่นราบตั้งโต๊ะ (Flatbed Scanner)",
      "กล้องเว็บแคมความละเอียด 720p",
      "เครื่องอ่านการ์ดแม่เหล็กแบบรูดผ่าน"
    ],
    answer: 0,
    explanation: "เครื่องสแกนเลเซอร์แบบ Extended Range มีเลนส์ปรับโฟกัสพิเศษและกำลังแสงเลเซอร์ที่สามารถยิงอ่านแท็กบนชั้นวางสินค้าสูงได้แม่นยำ"
  }
];

const G03_CHALLENGES = [
  {
    badge: "UNIT 9 • INPUT SECURITY THREATS",
    image: "images/units/unit-09-data-validation.jpg",
    consoleLabel: "THREAT TAXONOMY: การจำแนกความเสี่ยงด้านการนำเข้าข้อมูล 4 ประการ",
    prompt: "ข้อใดจัดเป็นความเสี่ยงในการนำเข้าข้อมูลที่เกิดจาก 'ปัจจัยด้านบุคคล (Human Factor)'?",
    options: [
      "การพิมพ์รหัสผิดพลาดโดยไม่ได้ตั้งใจ (Typo / Data Entry Error)",
      "สายเคเบิลพอร์ต USB เสื่อมสภาพทำให้ข้อมูลหลุดหาย",
      "สัญญาณไฟตกชั่วขณะทำให้เซิร์ฟเวอร์ดับ",
      "คลื่นวิทยุรบกวนในอากาศทำให้บิตข้อมูลกลับด้าน"
    ],
    answer: 0,
    explanation: "ความเสี่ยงด้านบุคคลเกิดจากความประมาท พิมพ์ผิด ขาดทักษะ หรือถูกหลอกลวงแบบ Social Engineering"
  },
  {
    badge: "UNIT 9 • DATA VALIDATION PIPELINE",
    image: "images/units/unit-09-data-validation.jpg",
    consoleLabel: "VALIDATION PIPELINE: ขั้นตอนการตรวจสอบความถูกต้องของข้อมูล",
    prompt: "การตรวจสอบว่าข้อมูลที่กรอกในช่อง 'วันเกิด' อยู่ในรูปแบบวันที่ที่ถูกต้อง จัดเป็นการตรวจสอบประเภทใด?",
    options: [
      "การตรวจสอบรูปแบบ (Format / Pattern Check)",
      "การคำนวณ Check Digit",
      "การสแกนหาไวรัสในไฟล์",
      "การเข้ารหัสลับ AES-256"
    ],
    answer: 0,
    explanation: "Format Check คือการตรวจสอบว่าข้อความตรงตามแม่แบบที่กำหนดหรือไม่ เช่น วัน/เดือน/ปี หรือรูปแบบอีเมล"
  },
  {
    badge: "UNIT 9 • REGEX VALIDATION",
    image: "images/units/unit-09-data-validation.jpg",
    consoleLabel: "REGEX ENGINE: การใช้ Regular Expression กรองข้อมูลนำเข้า",
    prompt: "เครื่องมือ Regular Expression (Regex) มีบทบาทสำคัญที่สุดในขั้นตอนใดของระบบนำเข้าข้อมูล?",
    options: [
      "ตรวจสอบแพทเทิร์นโครงสร้างตัวอักษร เช่น อีเมล หรือเบอร์โทรศัพท์",
      "เพิ่มความเร็วในการพิมพ์ข้อความบนแป้นพิมพ์",
      "ทำความเย็นให้แก่โปรเซสเซอร์ของเครื่องอ่าน",
      "ลดขนาดไฟล์เสียงเพลงที่บันทึกจากไมโครโฟน"
    ],
    answer: 0,
    explanation: "Regex ช่วยกรองและยืนยันว่าข้อมูลที่ผู้ใช้พิมพ์เข้ามามีโครงสร้างตัวอักษรและตัวเลขถูกต้องตามเกณฑ์สากล"
  },
  {
    badge: "UNIT 9 • LUHN ALGORITHM",
    image: "images/units/unit-09-data-validation.jpg",
    consoleLabel: "ALGORITHM: อัลกอริทึม Modulo 10 ตรวจสอบหมายเลขบัตรเครดิต",
    prompt: "อัลกอริทึม Luhn Algorithm (Modulo 10) ถูกนำมาใช้ในชีวิตประจำวันเพื่อจุดประสงค์ใด?",
    options: [
      "ตรวจสอบความถูกต้องของหมายเลขบัตรเครดิตและเลขประจำตัวประชาชน",
      "ถอดรหัสผ่านของระบบปฏิบัติการวินโดวส์",
      "บีบอัดไฟล์ภาพกราฟิกให้มีขนาดเล็กลง",
      "คำนวณเส้นทางขับรถด้วยสัญญาณดาวเทียม"
    ],
    answer: 0,
    explanation: "Luhn Algorithm ใช้น้ำหนักคูณ 2 ในตำแหน่งสลับกันเพื่อสร้าง Check Digit สำหรับตรวจจับข้อผิดพลาดจากการพิมพ์เลขผิด"
  },
  {
    badge: "UNIT 9 • QUISHING ATTACK",
    image: "images/devices/device-09-security-key.svg",
    consoleLabel: "CYBER THREAT: ภัยคุกคามรูปแบบใหม่บนรหัสคิวอาร์",
    prompt: "ภัยคุกคามทางไซเบอร์ที่เรียกว่า 'Quishing (QR Phishing)' มีลักษณะการโจมตีอย่างไร?",
    options: [
      "การนำสติกเกอร์ QR Code ปลอมมาแปะทับของจริงเพื่อลวงผู้ใช้เข้าสู่เว็บไซต์อันตราย",
      "การส่งคลื่นไมโครเวฟไปทำลายเซนเซอร์กล้อง",
      "การดักฟังเสียงแป้นพิมพ์ขณะกรอกรหัสผ่าน",
      "การขโมยหมึกพิมพ์ในเครื่องพิมพ์บาร์โค้ด"
    ],
    answer: 0,
    explanation: "Quishing คือการหลอกลวงโดยใช้ QR Code พาเหยื่อไปยังเว็บไซต์ฟิชชิ่ง เพื่อดักจับรหัสผ่านหรือข้อมูลบัตรเครดิต"
  },
  {
    badge: "UNIT 10 • SYMMETRIC VS ASYMMETRIC",
    image: "images/units/unit-10-encryption-ssl.jpg",
    consoleLabel: "CRYPTOGRAPHY: เปรียบเทียบการเข้ารหัสกุญแจสมมาตรและอสมมาตร",
    prompt: "การเข้ารหัสแบบสมมาตร (Symmetric Encryption เช่น AES) มีลักษณะเด่นอย่างไรเมื่อเทียบกับแบบอสมมาตร?",
    options: [
      "ใช้กุญแจดอกเดียวกันทั้งเข้ารหัสและถอดรหัส ประมวลผลได้รวดเร็วมาก",
      "ใช้กุญแจคนละดอกระหว่าง Public Key และ Private Key",
      "สามารถถอดรหัสได้โดยไม่ต้องมีกุญแจลับ",
      "ใช้เฉพาะกับข้อมูลที่เป็นข้อความตัวเลขเท่านั้น"
    ],
    answer: 0,
    explanation: "Symmetric Encryption ใช้ Shared Key ดอกเดียวในการเข้ารหัสและถอดรหัส จึงมีความเร็วสูงและกินพลังงานประมวลผลน้อย"
  },
  {
    badge: "UNIT 10 • SSL/TLS HANDSHAKE",
    image: "images/units/unit-10-encryption-ssl.jpg",
    consoleLabel: "HANDSHAKE: ขั้นตอนการเจรจาสร้างอุโมงค์ความปลอดภัย HTTPS",
    prompt: "ในกระบวนการจับมือ TLS Handshake ขั้นตอน 'Client Hello' ฝั่งไคลเอนต์จะส่งข้อมูลใดไปยังเซิร์ฟเวอร์?",
    options: [
      "เวอร์ชัน TLS ที่รองรับและชุดอัลกอริทึมการเข้ารหัส (Cipher Suites)",
      "รหัสผ่านของผู้ดูแลระบบเครือข่าย",
      "ไฟล์ข้อมูลฐานข้อมูลทั้งหมดของเครื่อง",
      "ใบรับรองดิจิทัลของธนาคารแห่งประเทศไทย"
    ],
    answer: 0,
    explanation: "Client Hello จะส่งเวอร์ชันโปรโตคอล TLS, สตริงสุ่ม Client Random และรายชื่อ Cipher Suites ที่เครื่องรองรับเพื่อตกลงกัน"
  },
  {
    badge: "UNIT 10 • DIGITAL CERTIFICATE",
    image: "images/units/unit-10-encryption-ssl.jpg",
    consoleLabel: "PKI TRUST: บทบาทขององค์กรผู้ออกใบรับรองดิจิทัล (CA)",
    prompt: "ใบรับรองดิจิทัล (SSL Certificate) บนเว็บไซต์ HTTPS ทำหน้าที่หลักในข้อใด?",
    options: [
      "ยืนยันตัวตนความถูกต้องของเซิร์ฟเวอร์และส่งมอบ Public Key ที่น่าเชื่อถือ",
      "ป้องกันไม่ให้เครื่องคอมพิวเตอร์ติดไวรัส 100%",
      "เพิ่มความเร็วการดาวน์โหลดวิดีโอบนยูทูบ",
      "ตรวจสอบยอดเงินคงเหลือในบัญชีธนาคาร"
    ],
    answer: 0,
    explanation: "ใบรับรองดิจิทัลออกโดย Certificate Authority (CA) เพื่อรับรองว่าเว็บเซิร์ฟเวอร์นั้นเป็นตัวจริงและส่งมอบ Public Key อย่างปลอดภัย"
  },
  {
    badge: "UNIT 10 • SHA-256 HASHING",
    image: "images/devices/device-10-hsm-appliance.svg",
    consoleLabel: "ONE-WAY FUNCTION: คุณสมบัติทางคณิตศาสตร์ของฟังก์ชันแฮชทางเดียว",
    prompt: "คุณสมบัติสำคัญที่สุดของอัลกอริทึม SHA-256 Hashing คือข้อใด?",
    options: [
      "เป็นฟังก์ชันทางเดียว (One-way) ไม่สามารถคำนวณย้อนกลับเพื่อดูข้อมูลต้นฉบับได้",
      "สามารถคลายการบีบอัดกลับมาเป็นไฟล์เดิมได้เสมอ",
      "ผลลัพธ์ที่ได้จะมีขนาดความยาวแปรผันตามข้อความต้นฉบับ",
      "ต้องใช้รหัสผ่าน Private Key ทุกครั้งในการคำนวณ"
    ],
    answer: 0,
    explanation: "การแฮชด้วย SHA-256 มีผลลัพธ์ขนาด 256 บิตเสมอ และไม่สามารถแปลงย้อนกลับได้ จึงใช้ตรวจความถูกต้องและเก็บรหัสผ่าน"
  },
  {
    badge: "UNIT 10 • SALT IN HASHING",
    image: "images/devices/device-10-hsm-appliance.svg",
    consoleLabel: "DEFENSE IN DEPTH: การเติมเกลือสุ่มเพื่อเสริมความปลอดภัยรหัสผ่าน",
    prompt: "การเติมค่า 'Salt' (สตริงสุ่ม) ต่อท้ายรหัสผ่านก่อนนำไปแฮช ช่วยป้องกันภัยคุกคามใด?",
    options: [
      "ป้องกันการเทียบตารางคำนวณล่วงหน้าแบบ Rainbow Table Attack",
      "ป้องกันสายแลนชำรุดเสียหายจากไฟฟ้าสถิต",
      "ป้องกันการลืมรหัสผ่านของผู้ใช้งาน",
      "ป้องกันไม่ให้เซิร์ฟเวอร์เกิดความร้อนสะสม"
    ],
    answer: 0,
    explanation: "Salt ทำให้รหัสผ่านที่เหมือนกันกลายเป็นค่าแฮชที่ต่างกันโดยสิ้นเชิง ทำให้ตาราง Rainbow Table ไม่สามารถเทียบหารหัสเดิมได้"
  },
  {
    badge: "UNIT 11 • RFID SYSTEM COMPONENTS",
    image: "images/units/unit-11-rfid-technology.jpg",
    consoleLabel: "HARDWARE TOPOLOGY: ส่วนประกอบพื้นฐานของระบบระบุตัวตนด้วยคลื่นวิทยุ",
    prompt: "แท็กระบุตัวตน RFID Tag ประกอบด้วยสองส่วนประกอบสำคัญข้อใด?",
    options: [
      "ไมโครชิปซิลิคอน (Microchip) และขดลวดเสาอากาศ (Antenna Coil)",
      "แบตเตอรี่ลิเธียมและหน้าจอ LCD",
      "เลนส์รวมแสงและกระจกสะท้อนเลเซอร์",
      "แม่เหล็กนีโอไดเมียมและลำโพงขยายเสียง"
    ],
    answer: 0,
    explanation: "RFID Tag ประกอบด้วย Microchip สำหรับเก็บรหัสข้อมูล และ Antenna Coil สำหรับรับ-ส่งสัญญาณคลื่นวิทยุ"
  },
  {
    badge: "UNIT 11 • PASSIVE VS ACTIVE RFID",
    image: "images/units/unit-11-rfid-technology.jpg",
    consoleLabel: "POWER HARVESTING: การเปรียบเทียบแหล่งพลังงานของแท็ก RFID",
    prompt: "แท็กแบบ Passive RFID แตกต่างจาก Active RFID อย่างไร?",
    options: [
      "Passive RFID ไม่มีแบตเตอรี่ในตัว แต่อาศัยการเหนี่ยวนำพลังงานจากคลื่นของเครื่องอ่าน",
      "Passive RFID มีแบตเตอรี่ในตัวและส่งสัญญาณได้ไกลกว่า 100 เมตร",
      "Passive RFID ผลิตจากโลหะทองคำบริสุทธิ์เท่านั้น",
      "Passive RFID ต้องเสียบปลั๊กไฟบ้านขณะใช้งาน"
    ],
    answer: 0,
    explanation: "Passive Tag จะตื่นขึ้นมาทำงานเมื่อได้รับพลังงานเหนี่ยวนำแม่เหล็กไฟฟ้าจาก Reader ทำให้แท็กมีขนาดเล็กและราคาประหยัด"
  },
  {
    badge: "UNIT 11 • RFID FREQUENCY BANDS",
    image: "images/devices/device-11-rfid-reader.svg",
    consoleLabel: "SPECTRUM ALLOCATION: ย่านความถี่มาตรฐานของเทคโนโลยี RFID",
    prompt: "ย่านความถี่คลื่น 13.56 MHz (High Frequency - HF) นิยมใช้งานในระบบใดมากที่สุด?",
    options: [
      "บัตรสมาร์ทการ์ดแตะเข้าออกอาคาร และระบบ NFC บนสมาร์ทโฟน",
      "การติดตามขีปนาวุธทางทหารระยะไกล",
      "รีโมตคอนโทรลโทรทัศน์ระบบอินฟราเรด",
      "เสาส่งสัญญาณสถานีวิทยุชุมชน"
    ],
    answer: 0,
    explanation: "ย่านความถี่ HF 13.56 MHz เป็นมาตรฐานสากลของบัตรสมาร์ทการ์ดไร้สัมผัส, บัตรพนักงาน และเทคโนโลยี NFC"
  },
  {
    badge: "UNIT 11 • UHF LOGISTICS ADVANTAGE",
    image: "images/devices/device-11-rfid-reader.svg",
    consoleLabel: "MASS INVENTORY: การตรวจนับสต็อกสินค้ายกลังในคลังสินค้า",
    prompt: "เหตุใดคลื่นย่าน UHF (860-960 MHz) จึงนิยมใช้ในงานโลจิสติกส์และคลังสินค้าขนาดใหญ่?",
    options: [
      "อ่านได้ระยะไกลหลายเมตรและอ่านแท็กพร้อมกันได้หลายร้อยชิ้นในเสี้ยววินาที",
      "มีราคาถูกกว่ากระดาษพิมพ์บาร์โค้ดทั่วไป",
      "สามารถมองเห็นทะลุแผ่นเหล็กหนา 1 เมตรได้",
      "ไม่ถูกรบกวนโดยคลื่นวิทยุใดๆ ในจักรวาล"
    ],
    answer: 0,
    explanation: "UHF RFID มีระยะอ่านไกล 3-10 เมตร และมีอัลกอริทึม Anti-collision ช่วยให้อ่านสินค้าทั้งพาเลทพร้อมกันได้ทันที"
  },
  {
    badge: "UNIT 11 • RFID PHYSICAL LIMITATIONS",
    image: "images/units/unit-11-rfid-technology.jpg",
    consoleLabel: "PROPAGATION OBSTACLE: ข้อจำกัดทางกายภาพของคลื่นความถี่วิทยุ",
    prompt: "สสารสองชนิดใดที่ส่งผลกระทบต่อสัญญาณคลื่น UHF RFID มากที่สุดในการทำงานจริง?",
    options: [
      "โลหะ (สะท้อนคลื่น) และของเหลว/น้ำ (ดูดกลืนพลังงานคลื่น)",
      "พลาสติกและกระดาษลูกฟูก",
      "อากาศแห้งและก๊าซไนโตรเจน",
      "แสงแดดธรรมชาติและหลอดไฟนีออน"
    ],
    answer: 0,
    explanation: "โลหะจะสะท้อนคลื่นวิทยุจนเกิดการรบกวน ส่วนน้ำหรือของเหลวจะดูดกลืนคลื่น UHF ทำให้ระยะการอ่านลดลงอย่างมาก"
  },
  {
    badge: "UNIT 12 • PHYSIOLOGICAL BIOMETRICS",
    image: "images/units/unit-12-biometrics.jpg",
    consoleLabel: "BIOMETRIC TAXONOMY: การจำแนกประเภทข้อมูลอัตลักษณ์ทางกายภาพ",
    prompt: "ลักษณะข้อใดจัดเป็นข้อมูลชีวมิติทางกายภาพ (Physiological Biometrics)?",
    options: [
      "ลายนิ้วมือ และม่านตา (Fingerprint & Iris)",
      "จังหวะความเร็วในการพิมพ์คีย์บอร์ด (Keystroke)",
      "ท่าทางการเดินก้าวเท้า (Gait analysis)",
      "ความเร็วในการเซ็นชื่อบนแท็บเล็ต"
    ],
    answer: 0,
    explanation: "ลายนิ้วมือ ม่านตา และโครงสร้างใบหน้าเป็นลักษณะทางกายภาพที่ไม่เปลี่ยนแปลงตามอารมณ์หรือกาลเวลาสั้นๆ"
  },
  {
    badge: "UNIT 12 • FINGERPRINT MINUTIAE",
    image: "images/units/unit-12-biometrics.jpg",
    consoleLabel: "RIDGE GEOMETRY: การสกัดจุดเอกลักษณ์ของเส้นลายนิ้วมือ",
    prompt: "จุดเอกลักษณ์ 'Minutiae' ของลายนิ้วมือที่ใช้ในการเปรียบเทียบ ได้แก่อะไรเป็นหลัก?",
    options: [
      "จุดสิ้นสุดของเส้น (Ridge Ending) และจุดแยกสองแฉก (Bifurcation)",
      "รอยเปื้อนหมึกและเหงื่อบนปลายนิ้ว",
      "สีผิวและความหยาบกร้านของนิ้วมือ",
      "ขนาดความยาวของเล็บมือ"
    ],
    answer: 0,
    explanation: "อัลกอริทึมลายนิ้วมือจะบันทึกพิกัดและทิศทางของจุดปลายเส้นนูน (Ridge Ending) และจุดแตกกิ่งสองแฉก (Bifurcation)"
  },
  {
    badge: "UNIT 12 • BIOMETRIC ENROLLMENT",
    image: "images/devices/device-12-biometric-scanner.svg",
    consoleLabel: "TEMPLATE EXTRACTION: กระบวนการลงทะเบียนอัตลักษณ์บุคคล",
    prompt: "ในกระบวนการ Enrollment ข้อมูลชีวมิติจะถูกบันทึกลงฐานข้อมูลในรูปแบบใดเพื่อความปลอดภัย?",
    options: [
      "ชุดข้อมูลเวกเตอร์หรือค่าแฮชทางคณิตศาสตร์ (Mathematical Template)",
      "ไฟล์ภาพถ่ายสีความละเอียดสูงแบบดิบ (RAW Image)",
      "ไฟล์วิดีโอนามสกุล MP4 ที่ไม่ได้ใส่รหัสผ่าน",
      "ข้อความตัวอักษรชื่อ-นามสกุลธรรมดา"
    ],
    answer: 0,
    explanation: "ระบบชีวมิติที่มีความปลอดภัยสูงจะไม่เก็บภาพลายนิ้วมือจริง แต่จะสกัดพิกัดเป็น Template เวกเตอร์ตัวเลขทางคณิตศาสตร์"
  },
  {
    badge: "UNIT 12 • 3D FACE DEPTH MESH",
    image: "images/units/unit-12-biometrics.jpg",
    consoleLabel: "INFRARED DOT PROJECTION: การตรวจจับโครงหน้าสามมิติ",
    prompt: "เทคโนโลยีตรวจจับใบหน้า 3 มิติ (เช่น Face ID) ป้องกันการถูกหลอกด้วยภาพถ่าย 2D ได้อย่างไร?",
    options: [
      "ยิงจุดโครงข่ายแสงอินฟราเรดหลายหมื่นจุดเพื่อวัดระยะความลึกและความนูนของใบหน้า",
      "ใช้ไมโครโฟนตรวจจับเสียงหายใจของผู้ใช้งาน",
      "ตรวจสอบว่าผู้ใช้ยิ้มกว้างพอหรือไม่",
      "วิเคราะห์สีของเสื้อผ้าที่สวมใส่"
    ],
    answer: 0,
    explanation: "การยิงแสงอินฟราเรดสร้างแผนที่ความลึก (Depth Map) ทำให้ระบบแยกแยะใบหน้าจริงที่มีมิติออกจากรูปถ่ายบนกระดาษหรือหน้าจอได้"
  },
  {
    badge: "UNIT 12 • FAR VS FRR TRADE-OFF",
    image: "images/devices/device-12-biometric-scanner.svg",
    consoleLabel: "SYSTEM THRESHOLD: การปรับสมดุลความปลอดภัยของระบบชีวมิติ",
    prompt: "ค่า FAR (False Acceptance Rate) หมายถึงอะไรในการประเมินระบบชีวมิติ?",
    options: [
      "อัตราที่ระบบยินยอมให้บุคคลที่ไม่ใช่เจ้าของตัวจริงผ่านเข้าใช้งานได้",
      "อัตราที่ระบบปฏิเสธเจ้าของตัวจริงที่ถูกต้อง",
      "ระยะเวลาที่ใช้ในการประมวลผลต่อหนึ่งครั้ง",
      "ปริมาณไฟฟ้าที่เซนเซอร์ใช้ในการอ่านข้อมูล"
    ],
    answer: 0,
    explanation: "FAR คืออัตราความผิดพลาดที่ระบบยอมรับผู้บุกรุก (False Accept) ส่วน FRR คืออัตราที่ระบบปฏิเสธผู้ใช้ตัวจริง (False Reject)"
  },
  {
    badge: "UNIT 9 • SQL INJECTION DEFENSE",
    image: "images/devices/device-09-security-key.svg",
    consoleLabel: "INPUT SANITIZATION: การป้องกันการแทรกแซงคำสั่งฐานข้อมูล",
    prompt: "การกรองข้อมูลนำเข้าเพื่อป้องกัน SQL Injection ควรใช้วิธีการใดเป็นมาตรฐานสากล?",
    options: [
      "ใช้ Prepared Statements และ Parameterized Queries",
      "ปิดการทำงานของฐานข้อมูลเมื่อมีผู้ใช้งานเข้าชม",
      "ลบสระและพยัญชนะทั้งหมดออกจากข้อความ",
      "จำกัดให้ผู้ใช้ล็อกอินได้เฉพาะเวลากลางวัน"
    ],
    answer: 0,
    explanation: "Parameterized Queries ช่วยแยกข้อมูลที่ผู้ใช้พิมพ์ออกจากโครงสร้างคำสั่ง SQL ทำให้ไม่สามารถแทรกคำสั่งทำลายระบบได้"
  },
  {
    badge: "UNIT 10 • HSM CRYPTO ACCELERATOR",
    image: "images/devices/device-10-hsm-appliance.svg",
    consoleLabel: "HARDWARE SECURITY MODULE: ฮาร์ดแวร์เก็บรักษากุญแจลับระดับธนาคาร",
    prompt: "อุปกรณ์ฮาร์ดแวร์ความปลอดภัยสูง HSM (Hardware Security Module) มีหน้าที่ใดในระบบศูนย์ข้อมูล?",
    options: [
      "สร้าง จัดเก็บ และประมวลผลกุญแจเข้ารหัสลับในระดับฮาร์ดแวร์ที่มีกลไกป้องกันการงัดแงะ",
      "ทำหน้าที่เป็นจอภาพสำหรับแสดงผลข้อมูลธุรกรรม",
      "สำรองไฟฟ้าฉุกเฉินให้แก่เครื่องคอมพิวเตอร์ทั้งตึก",
      "สแกนบาร์โค้ดบนบัตรเดบิตของลูกค้า"
    ],
    answer: 0,
    explanation: "HSM เป็นอุปกรณ์เฉพาะทางที่มีการรักษาความปลอดภัยทางกายภาพ เพื่อประมวลผลและเก็บรักษากุญแจเข้ารหัสลับไม่ให้ถูกขโมย"
  },
  {
    badge: "UNIT 11 • RFID EPC ENCODING",
    image: "images/devices/device-11-rfid-reader.svg",
    consoleLabel: "EPC STANDARD: โครงสร้างรหัสประจำตัวสินค้าอิเล็กทรอนิกส์",
    prompt: "มาตรฐานรหัส EPC (Electronic Product Code) ความยาว 96 บิตบน RFID มีข้อดีเหนือกว่าบาร์โค้ดธรรมดาอย่างไร?",
    options: [
      "สามารถระบุหมายเลขประจำตัวสินค้าแต่ละชิ้นได้อย่างเฉพาะเจาะจง (Serial Number รายตัว)",
      "ไม่มีวันเสียหายแม้โดนความร้อนสูง 2,000 องศา",
      "มองเห็นด้วยตาเปล่าได้ในที่มืดสนิท",
      "ไม่จำเป็นต้องมีซอฟต์แวร์ในการอ่านข้อมูล"
    ],
    answer: 0,
    explanation: "บาร์โค้ดระบุได้เฉพาะประเภทสินค้า แต่ EPC บน RFID ระบุได้ถึงเลขซีเรียลเฉพาะของสินค้าแต่ละกล่องได้อย่างแม่นยำ"
  },
  {
    badge: "UNIT 12 • FIDO2 HARDWARE KEY",
    image: "images/devices/device-09-security-key.svg",
    consoleLabel: "PASSWORDLESS AUTH: กุญแจความปลอดภัยฮาร์ดแวร์มาตรฐาน FIDO2",
    prompt: "กุญแจฮาร์ดแวร์นิรภัย FIDO2 (เช่น YubiKey) ป้องกันการโจมตีแบบ Phishing ได้อย่างไร?",
    options: [
      "ผูกการยืนยันตัวตนด้วยการเข้ารหัสลับเข้ากับโดเมนเนมของเว็บไซต์จริงเท่านั้น",
      "มีสัญญาณเตือนภัยไซเรนดังเมื่อพบเว็บปลอม",
      "ถ่ายภาพใบหน้าของแฮกเกอร์ส่งให้ตำรวจ",
      "บล็อกสัญญาณอินเทอร์เน็ตของบ้านแฮกเกอร์"
    ],
    answer: 0,
    explanation: "FIDO2 จะลงนามด้วยกุญแจลับเฉพาะกับ Origin URL ของเว็บที่ลงทะเบียนไว้ หากเหยื่อเข้าเว็บฟิชชิ่ง กุญแจจะไม่ตอบสนองเด็ดขาด"
  }
];

const G04_CHALLENGES = [
  {
    badge: "UNIT 13 • RELATIONAL DATABASE (RDBMS)",
    image: "images/units/unit-13-dbms-tables.svg",
    consoleLabel: "DATA TOPOLOGY: โครงสร้างตารางในระบบจัดการฐานข้อมูลเชิงสัมพันธ์",
    prompt: "ในระบบจัดการฐานข้อมูลเชิงสัมพันธ์ (RDBMS) ข้อมูลแนวนอนหนึ่งแถวเรียกว่าอะไร?",
    options: [
      "ระเบียน หรือ ทูเพิล (Record / Tuple)",
      "เขตข้อมูล หรือ คุณลักษณะ (Field / Attribute)",
      "ดัชนีการค้นหา (Index)",
      "ชนิดข้อมูล (Data Type)"
    ],
    answer: 0,
    explanation: "แถวแนวนอนในตารางเรียกว่า Record หรือ Tuple แทนข้อมูลหนึ่งรายการ ส่วนคอลัมน์แนวตั้งเรียกว่า Field หรือ Attribute"
  },
  {
    badge: "UNIT 13 • PRIMARY KEY CONSTRAINT",
    image: "images/units/unit-13-dbms-tables.svg",
    consoleLabel: "INTEGRITY RULES: กฎเกณฑ์ความสมบูรณ์ของคีย์หลักในฐานข้อมูล",
    prompt: "คุณสมบัติที่สำคัญที่สุดของ 'Primary Key (คีย์หลัก)' ในตารางฐานข้อมูลคือข้อใด?",
    options: [
      "ต้องมีค่าไม่ซ้ำกันในตาราง และห้ามมีค่าว่าง (NOT NULL)",
      "ต้องเป็นตัวเลขจำนวนเต็มบวกที่มีค่าไม่เกิน 100",
      "ต้องมีค่าเท่ากับตารางอื่นเสมอ",
      "สามารถเปลี่ยนแปลงค่าได้ตลอดเวลาโดยไม่มีผลกระทบ"
    ],
    answer: 0,
    explanation: "Primary Key ใช้ระบุแต่ละระเบียนในตารางได้อย่างเฉพาะเจาะจง จึงต้องมีค่าไม่ซ้ำกันและห้ามเป็นค่าว่างเด็ดขาด"
  },
  {
    badge: "UNIT 13 • FOREIGN KEY RELATION",
    image: "images/units/unit-13-dbms-tables.svg",
    consoleLabel: "REFERENTIAL INTEGRITY: การเชื่อมโยงความสัมพันธ์ระหว่างตาราง",
    prompt: "Foreign Key (คีย์นอก) มีหน้าที่สำคัญอย่างไรในฐานข้อมูลเชิงสัมพันธ์?",
    options: [
      "เชื่อมโยงความสัมพันธ์ไปยัง Primary Key ของอีกตารางหนึ่งเพื่อรักษาความถูกต้อง",
      "ใช้ในการเข้ารหัสลับไฟล์ฐานข้อมูล",
      "ใช้สำหรับจัดเรียงข้อมูลตามลำดับตัวอักษร",
      "กำหนดสิทธิ์ในการเข้าถึงของผู้ดูแลระบบ"
    ],
    answer: 0,
    explanation: "Foreign Key ใช้สร้างความสัมพันธ์ข้ามตาราง และบังคับกฎ Referential Integrity ไม่ให้มีข้อมูลอ้างอิงลอยๆ"
  },
  {
    badge: "UNIT 13 • TEXT FILE IMPORT DELIMITERS",
    image: "images/devices/device-13-dbms-server.svg",
    consoleLabel: "INGESTION: การนำเข้าข้อมูลรูปแบบไฟล์ข้อความกึ่งโครงสร้าง",
    prompt: "ไฟล์รูปแบบ CSV (Comma-Separated Values) ใช้อักขระใดเป็นตัวคั่นระหว่างเขตข้อมูล?",
    options: [
      "เครื่องหมายจุลภาค (Comma ,)",
      "เครื่องหมายดอกจัน (*)",
      "เครื่องหมายทับ (/)",
      "เครื่องหมายเปอร์เซ็นต์ (%)"
    ],
    answer: 0,
    explanation: "CSV ใช้เครื่องหมายจุลภาค (Comma) ในการแบ่งคอลัมน์ข้อมูล ทำให้โปรแกรมตารางคำนวณและฐานข้อมูลนำเข้าได้ง่าย"
  },
  {
    badge: "UNIT 13 • POWER QUERY ETL",
    image: "images/units/unit-14-data-cleaning.svg",
    consoleLabel: "DATA TRANSFORMATION: การทำความสะอาดข้อมูลก่อนการนำเข้า",
    prompt: "คำสั่ง 'Trim' ในขั้นตอนการทำความสะอาดข้อมูล (Data Cleaning) มีหน้าที่อะไร?",
    options: [
      "ตัดช่องว่างส่วนเกินที่อยู่หน้าและหลังข้อความออก",
      "แปลงตัวอักษรพิมพ์เล็กเป็นพิมพ์ใหญ่",
      "ลบแถวข้อมูลที่มีค่าผิดพลาดทิ้งทั้งหมด",
      "คำนวณผลรวมของตัวเลขในคอลัมน์"
    ],
    answer: 0,
    explanation: "คำสั่ง Trim จะลบ Spacebars ที่ติดมาข้างหน้าหรือข้างหลังข้อความ ซึ่งเป็นสาเหตุหลักที่ทำให้การค้นหาข้อมูลไม่ตรงกัน"
  },
  {
    badge: "UNIT 14 • ENCODING VS ENCRYPTION",
    image: "images/units/unit-15-data-encoding.svg",
    consoleLabel: "CONCEPT CLARITY: ความแตกต่างระหว่างการแปลงรหัสกับการเข้ารหัสลับ",
    prompt: "ข้อใดอธิบายความแตกต่างระหว่าง 'Encoding' และ 'Encryption' ได้ถูกต้องที่สุด?",
    options: [
      "Encoding แปลงรูปแบบเพื่อให้อุปกรณ์เข้าใจตรงกันโดยไม่ต้องมีรหัสลับ ส่วน Encryption มีเป้าหมายรักษาความลับและต้องมีคีย์ถอดรหัส",
      "Encoding ต้องใช้กุญแจลับเสมอ ส่วน Encryption เปิดเผยให้ทุกคนดูได้",
      "Encoding ใช้สำหรับไฟล์วิดีโอเท่านั้น ส่วน Encryption ใช้กับข้อความสั้น",
      "ทั้งสองคำมีความหมายเหมือนกันทุกประการในทางคอมพิวเตอร์"
    ],
    answer: 0,
    explanation: "Encoding มีไว้เพื่อให้ระบบสื่อสารเข้าใจรูปแบบข้อมูลร่วมกัน ส่วน Encryption มุ่งเน้นการรักษาความลับโดยต้องมีกุญแจถอดรหัส"
  },
  {
    badge: "UNIT 14 • ASCII LIMITATIONS",
    image: "images/units/unit-15-data-encoding.svg",
    consoleLabel: "CHARACTER SET: ประวัติและข้อจำกัดของรหัสมาตรฐาน ASCII",
    prompt: "รหัสมาตรฐาน ASCII แบบดั้งเดิมใช้พื้นที่ขนาด 7 บิต สามารถแทนอักขระที่แตกต่างกันได้ทั้งหมดกี่ตัว?",
    options: [
      "128 ตัวอักษร",
      "256 ตัวอักษร",
      "64 ตัวอักษร",
      "1,024 ตัวอักษร"
    ],
    answer: 0,
    explanation: "7 บิตคำนวณได้ 2 ยกกำลัง 7 = 128 ตัวอักษร (รหัส 0 ถึง 127) ซึ่งเพียงพอสำหรับภาษาอังกฤษและสัญลักษณ์ควบคุมเท่านั้น"
  },
  {
    badge: "UNIT 14 • TIS-620 THAI ENCODING",
    image: "images/units/unit-15-data-encoding.svg",
    consoleLabel: "LOCALIZATION: รหัสมาตรฐานภาษาไทยสำหรับคอมพิวเตอร์",
    prompt: "รหัสมาตรฐาน TIS-620 พัฒนาขึ้นโดยสถาบันใดเพื่อรองรับภาษาไทยในระบบ 8 บิต?",
    options: [
      "สำนักงานมาตรฐานผลิตภัณฑ์อุตสาหกรรม (สมอ.)",
      "ราชบัณฑิตยสภา",
      "กรมการปกครอง กระทรวงมหาดไทย",
      "สมาคมคอมพิวเตอร์แห่งประเทศไทย"
    ],
    answer: 0,
    explanation: "TIS-620 คือมาตรฐานอุตสาหกรรมไทย (Thai Industrial Standard) กำหนดขึ้นโดย สมอ. เพื่อใช้อักขระไทยในระบบ 8 บิต"
  },
  {
    badge: "UNIT 14 • UNICODE UTF-8 ADVANTAGE",
    image: "images/units/unit-15-data-encoding.svg",
    consoleLabel: "GLOBAL ENCODING: สถาปัตยกรรมรหัสอักขระสากลของโลกอินเทอร์เน็ต",
    prompt: "ข้อได้เปรียบที่ทำให้ Unicode UTF-8 กลายเป็นมาตรฐานหลักของเว็บไซต์ทั่วโลกคือข้อใด?",
    options: [
      "รองรับภาษาทั่วโลกและใช้วิธีเข้ารหัสแบบความยาวผันแปร (1 ถึง 4 ไบต์) ประหยัดพื้นที่",
      "สามารถบีบอัดไฟล์วิดีโอ 4K ให้เหลือขนาด 1 กิโลไบต์ได้",
      "ไม่จำเป็นต้องใช้ระบบปฏิบัติการในการเปิดอ่าน",
      "ทำให้เครื่องคอมพิวเตอร์ทำงานเร็วขึ้น 10 เท่า"
    ],
    answer: 0,
    explanation: "UTF-8 ปรับขนาดไบต์ตามตัวอักษร (อังกฤษ 1 ไบต์, ไทย 3 ไบต์) รองรับทุกภาษาในโลก และเข้ากันได้กับ ASCII ย้อนหลัง"
  },
  {
    badge: "UNIT 14 • MOJIBAKE RESOLUTION",
    image: "images/devices/device-14-data-workstation.svg",
    consoleLabel: "CHARACTER CORRUPTION: ปัญหาข้อความภาษาไทยกลายเป็นตัวอักษรต่างดาว",
    prompt: "อาการ 'ภาษาต่างดาว (Mojibake)' เช่น ข้อความกลายเป็น 'เธ—เธ”เธชเธญเธ' เกิดจากสาเหตุใด?",
    options: [
      "เปิดไฟล์ด้วยตารางรหัสอักขระ (Encoding) คนละชนิดกับที่บันทึกไว้ เช่น เซฟเป็น UTF-8 แต่เปิดด้วย Windows-874",
      "เครื่องคอมพิวเตอร์ติดไวรัสทำลายระบบปฏิบัติการ",
      "สายหน้าจอเชื่อมต่อสัญญาณไม่แน่น",
      "แป้นพิมพ์ภาษาไทยชำรุดเสียหาย"
    ],
    answer: 0,
    explanation: "Mojibake เกิดจากซอฟต์แวร์ถอดรหัสไบต์ข้อมูลผิดตาราง เช่น นำไบต์ของ UTF-8 ไปแปลความหมายด้วยตาราง TIS-620/Windows-874"
  },
  {
    badge: "UNIT 14 • BASE64 BINARY-TO-TEXT",
    image: "images/devices/device-14-data-workstation.svg",
    consoleLabel: "PAYLOAD CONVERSION: การแปลงไฟล์ไบนารีเป็นสายอักขระ ASCII ปลอดภัย",
    prompt: "การเข้ารหัสแบบ Base64 มีประโยชน์หลักในข้อใดของระบบนำเข้าข้อมูล?",
    options: [
      "แปลงข้อมูลไบนารี (เช่น ไฟล์ภาพ) ให้เป็นข้อความ ASCII 64 ตัวอักษร เพื่อส่งผ่านเครือข่ายข้อความได้โดยไม่เสียหาย",
      "ป้องกันการแฮกข้อมูลด้วยรหัสผ่านควอนตัม",
      "ลดขนาดไฟล์ข้อมูลลง 75%",
      "แปลงไฟล์เสียงพูดให้เป็นข้อความอัตโนมัติ"
    ],
    answer: 0,
    explanation: "Base64 ใช้ 6 บิตแทนอักขระที่พิมพ์ได้ เพื่อให้ข้อมูลไบนารีสามารถส่งผ่านช่องทางข้อความ เช่น JSON, XML หรืออีเมลได้อย่างปลอดภัย"
  },
  {
    badge: "UNIT 15 • LOSSLESS VS LOSSY",
    image: "images/units/unit-16-rle-compression.svg",
    consoleLabel: "COMPRESSION METRICS: การเปรียบเทียบการบีบอัดแบบไม่สูญเสียและสูญเสียข้อมูล",
    prompt: "การบีบอัดข้อมูลแบบสูญเสียข้อมูล (Lossy Compression เช่น JPEG, MP3) เหมาะสมกับงานประเภทใด?",
    options: [
      "ไฟล์ภาพถ่ายและไฟล์เสียงที่ยอมรับการลดทอนรายละเอียดที่สายตาหรือหูมนุษย์แยกไม่ออกได้",
      "ซอร์สโค้ดโปรแกรมและไฟล์ฐานข้อมูลทางการเงิน",
      "ข้อความสัญญาทางกฎหมายและเอกสารทางราชการ",
      "ไฟล์รหัสผ่านของระบบความปลอดภัย"
    ],
    answer: 0,
    explanation: "Lossy บีบอัดได้ขนาดเล็กมากโดยตัดรายละเอียดที่ประสาทสัมผัสมนุษย์จับไม่ได้ จึงเหมาะกับมัลติมีเดีย แต่ห้ามใช้กับเอกสารหรือโค้ด"
  },
  {
    badge: "UNIT 15 • COMPRESSION RATIO",
    image: "images/devices/device-15-compression-card.svg",
    consoleLabel: "EFFICIENCY FORMULA: การคำนวณอัตราส่วนการบีบอัดข้อมูล",
    prompt: "หากไฟล์ต้นฉบับขนาด 100 MB ถูกบีบอัดจนเหลือขนาด 20 MB อัตราส่วนการบีบอัด (Compression Ratio) คือข้อใด?",
    options: [
      "5:1 (หรือ 5 เท่า)",
      "2:1 (หรือ 2 เท่า)",
      "10:1 (หรือ 10 เท่า)",
      "80:1 (หรือ 80 เท่า)"
    ],
    answer: 0,
    explanation: "อัตราส่วนการบีบอัดคำนวณจาก ขนาดต้นฉบับ / ขนาดหลังบีบอัด = 100 MB / 20 MB = 5:1 (ลดลง 80%)"
  },
  {
    badge: "UNIT 15 • RLE STRING CALCULATION",
    image: "images/units/unit-16-rle-compression.svg",
    consoleLabel: "RUN-LENGTH ENCODING: การคำนวณการบีบอัดข้อความซ้ำต่อเนื่อง",
    prompt: "ข้อความ 'AAAAABBBCC' เมื่อบีบอัดด้วยอัลกอริทึม Run-Length Encoding (RLE) จะได้ผลลัพธ์ข้อใด?",
    options: [
      "5A3B2C",
      "A5B3C2",
      "ABC10",
      "10ABC"
    ],
    answer: 0,
    explanation: "RLE นับจำนวนตัวอักษรซ้ำที่อยู่ติดกัน: 'AAAAA' = 5A, 'BBB' = 3B, 'CC' = 2C ได้ผลลัพธ์เป็น 5A3B2C"
  },
  {
    badge: "UNIT 15 • RLE BITMAP APPLICATION",
    image: "images/units/unit-16-rle-compression.svg",
    consoleLabel: "MONOCHROME IMAGING: การบีบอัดภาพขาวดำและเอกสารสแกน",
    prompt: "อัลกอริทึม RLE มีประสิทธิภาพการบีบอัดสูงสุดกับรูปภาพประเภทใด?",
    options: [
      "ภาพการ์ตูนลายเส้นหรือเอกสารสแกนขาวดำที่มีพื้นที่สีขาวต่อเนื่องกันมากๆ",
      "ภาพถ่ายวิวทิวทัศน์ธรรมชาติที่มีการไล่เฉดสีนับล้านสี",
      "ภาพถ่ายดาวเทียมความละเอียดสูง",
      "วิดีโอเกมกราฟิก 3 มิติที่มีการเคลื่อนไหวตลอดเวลา"
    ],
    answer: 0,
    explanation: "RLE ทำงานได้ดีเลิศกับภาพที่มีพิกเซลสีเดียวกันติดต่อกันยาวๆ เช่น แถบสีขาวกว้างในเอกสารสแกนหรือภาพไอคอน"
  },
  {
    badge: "UNIT 15 • HUFFMAN CODING",
    image: "images/devices/device-15-compression-card.svg",
    consoleLabel: "FREQUENCY TREE: อัลกอริทึมการบีบอัดตามความถี่การปรากฏของข้อมูล",
    prompt: "หลักการสำคัญของอัลกอริทึมบีบอัดแบบ Huffman Coding คือข้อใด?",
    options: [
      "กำหนดรหัสบิตสั้นให้กับตัวอักษรที่ปรากฏบ่อย และกำหนดรหัสบิตยาวให้กับตัวอักษรที่พบน้อย",
      "ลบตัวอักษรภาษาอังกฤษทั้งหมดออกจากไฟล์",
      "เรียงลำดับตัวอักษรตามตัวอักษร A ถึง Z",
      "สลับตำแหน่งข้อมูลแบบสุ่มเพื่อลดขนาดไฟล์"
    ],
    answer: 0,
    explanation: "Huffman Coding สร้างต้นไม้ความถี่ โดยตัวที่พบบ่อย (เช่น ตัว e หรือช่องว่าง) จะได้รหัสบิตสั้นมาก ช่วยลดขนาดไฟล์โดยรวม"
  },
  {
    badge: "UNIT 16 • SELF-CHECKOUT ARCHITECTURE",
    image: "images/devices/device-16-self-checkout-kiosk.svg",
    consoleLabel: "KIOSK INTEGRATION: กลไกตรวจสอบการชำระเงินตนเองในซูเปอร์มาร์เก็ต",
    prompt: "ในตู้ชำระเงินตนเอง (Self-Checkout Kiosk) แป้นชั่งน้ำหนัก Security Scale Platter มีหน้าที่ป้องกันทุจริตอย่างไร?",
    options: [
      "ตรวจสอบว่าน้ำหนักสินค้าที่วางในถุงตรงกับน้ำหนักมาตรฐานของรหัสบาร์โค้ดที่เพิ่งสแกนไปหรือไม่",
      "คำนวณอัตราภาษีมูลค่าเพิ่มของสินค้า",
      "ตรวจสอบว่าลูกค้าสวมรองเท้าแตะหรือไม่",
      "ชั่งน้ำหนักตัวของลูกค้าที่ยืนอยู่หน้าตู้"
    ],
    answer: 0,
    explanation: "ระบบจะเทียบน้ำหนักของสินค้าที่วางลงบนแท่นวางถุงกับข้อมูลในฐานข้อมูลสินค้า หากน้ำหนักไม่ตรงกันจะแจ้งเตือนพนักงานทันที"
  },
  {
    badge: "UNIT 16 • BIOPTIC DUAL-PLANE SCANNER",
    image: "images/devices/device-16-self-checkout-kiosk.svg",
    consoleLabel: "ERGONOMICS & SPEED: หัวอ่านบาร์โค้ดสองระนาบ ณ จุดชำระเงิน",
    prompt: "เครื่องสแกนบาร์โค้ดแบบ Bioptic สองระนาบ (แนวนอนและแนวตั้ง) ช่วยเพิ่มความเร็วในการคิดเงินอย่างไร?",
    options: [
      "สแกนบาร์โค้ดได้พร้อมกันหลายมุมในครั้งเดียวโดยผู้ใช้ไม่ต้องพลิกหงายสินค้า",
      "สามารถสแกนสินค้าที่อยู่ในรถเข็นได้จากระยะ 10 เมตร",
      "พิมพ์ใบเสร็จออกมาได้พร้อมกับการสแกนสินค้า",
      "ลดอุณหภูมิห้องบริเวณเคาน์เตอร์แคชเชียร์"
    ],
    answer: 0,
    explanation: "หัวอ่านสองระนาบมีหน้าต่างเลเซอร์ทั้งแนวนอนและแนวตั้ง ทำให้กวาดอ่านบาร์โค้ดได้เกือบทุกทิศทางเพียงแค่รูดสินค้าผ่าน"
  },
  {
    badge: "UNIT 16 • SYSTEM DESIGN CRITERIA",
    image: "images/devices/device-16-self-checkout-kiosk.svg",
    consoleLabel: "DECISION MATRIX: 4 คำถามสำคัญก่อนเลือกเทคโนโลยีนำเข้าข้อมูล",
    prompt: "ข้อใดคือ 4 เกณฑ์หลักในการพิจารณาเลือกระบบนำเข้าข้อมูลตามบทเรียน?",
    options: [
      "ความเร็ว, ความแม่นยำ, สภาพแวดล้อมทางกายภาพ และงบประมาณความคุ้มค่า",
      "ยี่ห้อสินค้า, ประเทศผู้ผลิต, สีของอุปกรณ์ และน้ำหนักเครื่อง",
      "ความยาวสายไฟ, จำนวนปุ่มกด, ความดังของลำโพง และขนาดกล่องบรรจุ",
      "ความนิยมในโซเชียลมีเดีย, การรีวิวบนยูทูบ, ของแถม และโปรโมชั่นลดราคา"
    ],
    answer: 0,
    explanation: "การเลือกเทคโนโลยีต้องคำนึงถึง Throughput (ความเร็ว), Accuracy (ความถูกต้อง), Environment (สภาพแวดล้อม) และ Budget/TCO"
  },
  {
    badge: "UNIT 16 • WAREHOUSE RFID PORTAL",
    image: "images/devices/device-13-dbms-server.svg",
    consoleLabel: "LOGISTICS DEPLOYMENT: ซุ้มประตูสแกนสินค้าอัตโนมัติในคลังสินค้า",
    prompt: "การติดตั้งซุ้มประตู RFID Portal ที่ประตูคลังสินค้า มีข้อได้เปรียบเหนือการใช้พนักงานยิงบาร์โค้ดอย่างไร?",
    options: [
      "อ่านรายการสินค้าทั้งหมดบนพาเลทได้ทันทีขณะรถโฟล์กลิฟต์แล่นผ่าน โดยไม่ต้องแกะกล่องสแกนทีละชิ้น",
      "กำจัดฝุ่นละอองในอากาศได้โดยอัตโนมัติ",
      "ลดการใช้พลังงานไฟฟ้าของรถโฟล์กลิฟต์",
      "เปลี่ยนสีกล่องพัสดุให้เป็นระเบียบสวยงาม"
    ],
    answer: 0,
    explanation: "RFID Portal สามารถสแกนอ่านแท็กสินค้าหลายร้อยชิ้นได้พร้อมกันแบบไร้สัมผัสในเสี้ยววินาที ทำให้บันทึกสต็อกเข้า-ออกได้รวดเร็วมาก"
  },
  {
    badge: "UNIT 13 • ACID PROPERTIES IN DBMS",
    image: "images/units/unit-13-dbms-tables.svg",
    consoleLabel: "TRANSACTION INTEGRITY: คุณสมบัติ ACID ในการประมวลผลธุรกรรมข้อมูล",
    prompt: "คุณสมบัติ 'Atomicity' ในระบบฐานข้อมูลหมายความว่าอย่างไร?",
    options: [
      "ธุรกรรมต้องสำเร็จทั้งหมด หรือไม่สำเร็จเลย (All or Nothing) ป้องกันข้อมูลค้างคาครึ่งๆ กลางๆ",
      "ข้อมูลต้องถูกแบ่งออกเป็นอะตอมขนาดเล็กที่สุด",
      "ห้ามใช้พลังงานนิวเคลียร์ในการจ่ายไฟให้เซิร์ฟเวอร์",
      "ข้อมูลสามารถรั่วไหลได้ไม่เกิน 1 บิตต่อวัน"
    ],
    answer: 0,
    explanation: "Atomicity รับประกันว่าทุกคำสั่งใน Transaction เดียวกันต้องทำงานสำเร็จครบถ้วน หากมีข้อผิดพลาดระบบจะ Rollback ยกเลิกทั้งหมด"
  },
  {
    badge: "UNIT 14 • BASE64 DATA EXPANSION",
    image: "images/devices/device-14-data-workstation.svg",
    consoleLabel: "OVERHEAD CALCULATION: ขนาดข้อมูลที่เพิ่มขึ้นจากการแปลง Base64",
    prompt: "เมื่อแปลงข้อมูลไบนารีเป็นข้อความ Base64 ขนาดข้อมูลจะเพิ่มขึ้นโดยประมาณเท่าใด?",
    options: [
      "เพิ่มขึ้นประมาณ 33% (อัตราส่วน 4 ไบต์ต่อทุกๆ 3 ไบต์เดิม)",
      "ลดลง 50%",
      "ขนาดเท่าเดิมพอดี 100%",
      "เพิ่มขึ้น 300%"
    ],
    answer: 0,
    explanation: "Base64 นำข้อมูล 3 ไบต์ (24 บิต) มาแบ่งเป็น 4 กลุ่ม กลุ่มละ 6 บิต ทำให้ขนาดข้อมูลขยายตัวขึ้นประมาณ 33% (4/3 เท่า)"
  },
  {
    badge: "UNIT 15 • LZ DICTIONARY COMPRESSION",
    image: "images/devices/device-15-compression-card.svg",
    consoleLabel: "ALGORITHM INSIGHT: การทำงานของอัลกอริทึมพจนานุกรมตระกูล Lempel-Ziv",
    prompt: "อัลกอริทึมบีบอัดข้อมูลแบบพจนานุกรม LZ (เช่น ในไฟล์ ZIP และ GZIP) ทำงานด้วยวิธีใด?",
    options: [
      "สร้างดัชนีพจนานุกรมสำหรับวลีหรือชุดข้อความที่พบบ่อย และแทนที่ด้วยพอยน์เตอร์อ้างอิงตำแหน่งสั้นๆ",
      "ลบตัวสระทั้งหมดทิ้งเพื่อประหยัดเนื้อที่",
      "แปลงข้อมูลตัวอักษรทั้งหมดให้เป็นรหัสมอร์ส",
      "สุ่มลดทอนความละเอียดของข้อความลงครึ่งหนึ่ง"
    ],
    answer: 0,
    explanation: "LZ ค้นหาคำหรือแพทเทิร์นข้อความที่เคยปรากฏมาก่อน แล้วแทนที่การปรากฏซ้ำด้วย [ระยะย้อนกลับ, ความยาว] ในตารางพจนานุกรม"
  },
  {
    badge: "UNIT 16 • SMART TRANSIT TICKETING",
    image: "images/devices/device-16-self-checkout-kiosk.svg",
    consoleLabel: "TRANSPORTATION TECH: ประตูกั้นชานชาลารถไฟฟ้าความเร็วสูง",
    prompt: "ระบบบัตรโดยสารรถไฟฟ้าขนส่งมวลชนเลือกใช้เทคโนโลยี RFID HF 13.56 MHz (Contactless) เพราะเหตุผลใดเป็นหลัก?",
    options: [
      "ความเร็วในการแตะผ่านเข้า-ออกรวดเร็ว (ต่ำกว่า 0.3 วินาที) และระยะอ่านที่ปลอดภัยไม่ชนกับผู้โดยสารคนอื่น",
      "สามารถอ่านบัตรได้จากระยะทางไกล 1 กิโลเมตร",
      "บัตรโดยสารสามารถใช้เป็นไฟฉายส่องทางได้",
      "ไม่ต้องมีการเชื่อมต่อเครือข่ายคอมพิวเตอร์ใดๆ ทั้งสิ้น"
    ],
    answer: 0,
    explanation: "HF 13.56 MHz มีระยะแตะที่พอดี (3-5 ซม.) ป้องกันการตัดเงินผิดคน และตอบสนองไวมาก ช่วยระบายผู้โดยสารนับหมื่นคนในชั่วโมงเร่งด่วน"
  }
];


  /* ==========================================================================
     3. OFFICIAL 4 MINI-GAMES CATALOG ALIGNED WITH CURRICULUM
     ========================================================================== */

  const GAMES_CATALOG = {
    G01: {
      id: "G01",
      moduleId: 1,
      afterUnitNo: 4,
      nextUnitNo: 5,
      title: "Input Device Speed Match",
      thaiTitle: "เกมจับคู่ความไวข้อมูล วงจร IPO และอุปกรณ์รับข้อมูล",
      checkpointLabel: "คั่นหลังหน่วยที่ 4 (จบหมวดที่ 1)",
      isEndless: true,
      timeLimitInitialSec: 45,
      timeBonusSec: 3.0,
      timePenaltySec: 3.0,
      basePoints: 100,
      rules: [
        "โหมด ENDLESS TIME-ATTACK: เริ่มต้นด้วยเวลา 45 วินาที แข่งสะสมคะแนนต่อเนื่องไม่จำกัดจำนวนข้อ!",
        "ตอบถูกรับคะแนนฐาน + โบนัสความเร็ว พร้อมยืดเวลาเพิ่มทันที +3.0 วินาทีในนาฬิกา",
        "สะสม COMBO STREAK เพื่อปลดล็อกตัวคูณคะแนนมหาศาล (1.5x, 2.0x และ 3.0x FEVER MODE)",
        "ตอบผิดจะถูก หักเวลาลงทันที -3.0 วินาที และรีเซ็ตคอมโบเป็นศูนย์",
        "คลิกปุ่มตัวเลือกโดยตรง หรือกดแป้นพิมพ์ตัวเลข 1 – 4 เพื่อทำความเร็วสูงสุด เมื่อเวลาหมดจะบันทึกคะแนนจัดอันดับทันที"
      ],
      challenges: G01_CHALLENGES
    },
    G02: {
      id: "G02",
      moduleId: 2,
      afterUnitNo: 8,
      nextUnitNo: 9,
      title: "Barcode & QR Rapid Decoder",
      thaiTitle: "ถอดรหัสบาร์โค้ด 1D และคิวอาร์โค้ด 2D ความไวสูง",
      checkpointLabel: "คั่นหลังหน่วยที่ 8 (จบหมวดที่ 2)",
      isEndless: true,
      timeLimitInitialSec: 45,
      timeBonusSec: 3.0,
      timePenaltySec: 3.0,
      basePoints: 100,
      rules: [
        "โหมด ENDLESS TIME-ATTACK: ตรวจจับแสงเลเซอร์ 650nm, คำนวณ Check Digit EAN-13, โครงสร้าง QR 1:1:3:1:1 และ Dynamic QR",
        "ตอบถูกรับคะแนนฐาน + ยืดเวลาเพิ่มทันที +3.0 วินาทีในนาฬิกา",
        "สะสม COMBO STREAK เพื่อปลดล็อกตัวคูณคะแนนมหาศาล (1.5x, 2.0x และ 3.0x FEVER MODE)",
        "ตอบผิดจะถูก หักเวลาลงทันที -3.0 วินาที และรีเซ็ตคอมโบเป็นศูนย์",
        "คลิกปุ่มตัวเลือกโดยตรง หรือกดแป้นพิมพ์ตัวเลข 1 – 4 เพื่อทำสปีด"
      ],
      challenges: G02_CHALLENGES
    },
    G03: {
      id: "G03",
      moduleId: 3,
      afterUnitNo: 12,
      nextUnitNo: 13,
      title: "Cyber & Biometric Shield",
      thaiTitle: "เกราะป้องกันภัยไซเบอร์ ตรวจสอบความถูกต้อง RFID และชีวมิติ",
      checkpointLabel: "คั่นหลังหน่วยที่ 12 (จบหมวดที่ 3)",
      isEndless: true,
      timeLimitInitialSec: 45,
      timeBonusSec: 3.0,
      timePenaltySec: 3.0,
      basePoints: 100,
      rules: [
        "โหมด ENDLESS TIME-ATTACK: ตรวจสอบความปลอดภัย Data Validation, Luhn Modulo 10, TLS Handshake, RFID และชีวมิติ Minutiae",
        "ตอบถูกรับคะแนนฐาน + ยืดเวลาเพิ่มทันที +3.0 วินาทีในนาฬิกา",
        "สะสม COMBO STREAK เพื่อปลดล็อกตัวคูณคะแนนมหาศาล (1.5x, 2.0x และ 3.0x FEVER MODE)",
        "ตอบผิดจะถูก หักเวลาลงทันที -3.0 วินาที และรีเซ็ตคอมโบเป็นศูนย์",
        "คลิกปุ่มตัวเลือกโดยตรง หรือกดแป้นพิมพ์ตัวเลข 1 – 4 เพื่อทำสปีด"
      ],
      challenges: G03_CHALLENGES
    },
    G04: {
      id: "G04",
      moduleId: 4,
      afterUnitNo: 16,
      nextUnitNo: null,
      title: "Data Encoding & RLE Sprint",
      thaiTitle: "แปลงรหัสข้อมูล บีบอัดภาพ RLE และจัดการฐานข้อมูล",
      checkpointLabel: "คั่นหลังหน่วยที่ 16 (จบหมวดที่ 4)",
      isEndless: true,
      timeLimitInitialSec: 45,
      timeBonusSec: 3.0,
      timePenaltySec: 3.0,
      basePoints: 100,
      rules: [
        "โหมด ENDLESS TIME-ATTACK: คำนวณบีบอัด RLE, ตรวจสอบ RDBMS Primary/Foreign Key, รหัสอักขระ UTF-8 และระบบ Kiosk สองระนาบ",
        "ตอบถูกรับคะแนนฐาน + ยืดเวลาเพิ่มทันที +3.0 วินาทีในนาฬิกา",
        "สะสม COMBO STREAK เพื่อปลดล็อกตัวคูณคะแนนมหาศาล (1.5x, 2.0x และ 3.0x FEVER MODE)",
        "ตอบผิดจะถูก หักเวลาลงทันที -3.0 วินาที และรีเซ็ตคอมโบเป็นศูนย์",
        "คลิกปุ่มตัวเลือกโดยตรง หรือกดแป้นพิมพ์ตัวเลข 1 – 4 เพื่อทำสปีด"
      ],
      challenges: G04_CHALLENGES
    }
  };

  

  /* ==========================================================================
     4. GAME ENGINE STATE & RUNTIME HELPERS
     ========================================================================== */

  let gameState = null;
  let gameLoopRafId = 0;
  let transitionTimeoutId = 0;
  let pendingRuleGameId = "G01";

  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getNextEndlessRound(gameDef, usedIndices = []) {
    const pool = gameDef.challenges;
    let availableIndices = pool.map((_, i) => i).filter((i) => !usedIndices.includes(i));
    if (availableIndices.length === 0) {
      usedIndices.length = 0; // reset pool cycle
      availableIndices = pool.map((_, i) => i);
    }

    const randIdx = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    usedIndices.push(randIdx);

    const ch = pool[randIdx];
    const correctText = ch.options[ch.answer];
    const shuffledOpts = shuffleArray(ch.options);
    const newAnswerIdx = shuffledOpts.indexOf(correctText);

    return {
      poolIndex: randIdx,
      badge: ch.badge,
      image: ch.image || "",
      consoleLabel: ch.consoleLabel || "",
      prompt: ch.prompt,
      options: shuffledOpts,
      answer: newAnswerIdx,
      correctText: correctText,
      explanation: ch.explanation
    };
  }

  function clearGameTimers() {
    if (gameLoopRafId) {
      cancelAnimationFrame(gameLoopRafId);
      gameLoopRafId = 0;
    }
    if (transitionTimeoutId) {
      clearTimeout(transitionTimeoutId);
      transitionTimeoutId = 0;
    }
  }

  function setMiniGameFocusMode(enable) {
    document.body.classList.toggle("minigame-focus-mode", Boolean(enable));
  }

  /* ==========================================================================
     5. MODAL SYSTEM (RULE POPUP & WORKSPACE INITIATION)
     ========================================================================== */

  function openRuleModal(gameId) {
    const gameDef = GAMES_CATALOG[gameId] || GAMES_CATALOG.G01;
    pendingRuleGameId = gameDef.id;

    const modal = document.getElementById("minigame-rule-modal");
    if (!modal) return;

    const esc = window.AppUtils?.escapeHtml || ((s) => String(s));
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

    if (badgeEl) badgeEl.textContent = "ENDLESS TIME-ATTACK • " + gameDef.id;
    if (checkpointEl) checkpointEl.textContent = gameDef.checkpointLabel;
    if (titleEl) titleEl.textContent = gameDef.id + ": " + gameDef.title;
    if (subtitleEl) subtitleEl.textContent = gameDef.thaiTitle;
    if (timeLimitEl) timeLimitEl.textContent = gameDef.timeLimitInitialSec + " วินาที (สะสมเวลาเพิ่มได้เรื่อยๆ)";
    if (maxScoreEl) maxScoreEl.textContent = "โหมด Endless (ไม่จำกัดจำนวนข้อ)";
    if (personalBestEl) {
      personalBestEl.textContent = hasPlayed
        ? rec.best_score + " คะแนน • " + window.AppUtils.formatDuration(rec.best_time_sec)
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
      startBtn.textContent = "เริ่มการแข่งขัน Endless Time-Attack (45 วินาที)";
    }

    if (window.MotionEngine) {
      window.MotionEngine.animateModalOpen(modal);
    } else {
      modal.classList.remove("hidden");
    }
  }

  function closeRuleModal() {
    const modal = document.getElementById("minigame-rule-modal");
    if (!modal) return;
    modal.classList.add("hidden");
    modal.classList.remove("is-modal-entering");
    if (window.MotionEngine && typeof window.MotionEngine.animateModalClose === "function") {
      window.MotionEngine.animateModalClose(modal);
    }
  }

  /* ==========================================================================
     6. GAME START, GAME LOOP & REAL-TIME CONTROLS
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

    const nowMs = Date.now();
    const initialSec = gameDef.timeLimitInitialSec || 45;
    const usedIndices = [];
    const firstRound = getNextEndlessRound(gameDef, usedIndices);

    gameState = {
      gameDef: gameDef,
      phase: "playing",
      isEndless: true,
      roundNumber: 1,
      score: 0,
      streak: 0,
      maxStreak: 0,
      multiplier: 1.0,
      correctCount: 0,
      wrongCount: 0,
      startedAtMs: nowMs,
      roundStartedAtMs: nowMs,
      timeLimitInitialSec: initialSec,
      maxTimeCapMs: 65000, // Maximum allowed clock capacity (65 seconds)
      remainingMs: initialSec * 1000,
      deadlineMs: nowMs + initialSec * 1000,
      lockedInput: false,
      lastChoiceIdx: null,
      recentFeedback: null,
      recentFeedbackUntilMs: 0,
      currentRound: firstRound,
      usedIndices: usedIndices,
      history: [],
      finalTimeSec: 0,
      finishReason: "completed",
      isSaving: false,
      saveError: ""
    };

    setMiniGameFocusMode(true);
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
    const remSecCeil = Math.ceil(gameState.remainingMs / 1000);
    const remSecDecimal = (gameState.remainingMs / 1000).toFixed(1);
    const scaleRatio = Math.max(0, Math.min(1, gameState.remainingMs / (gameState.timeLimitInitialSec * 1000)));

    const clockEl = document.getElementById("mg-countdown-clock");
    const fillEl = document.getElementById("mg-time-bar-fill");

    const stateClass =
      remSecCeil <= 8 ? "is-danger" : remSecCeil <= 18 ? "is-warn" : "";

    if (clockEl) {
      clockEl.textContent = remSecDecimal + "s";
      clockEl.className = "mg-countdown-value font-notch tabular-nums " + stateClass;
    }
    if (fillEl) {
      fillEl.style.transform = "scaleX(" + scaleRatio.toFixed(4) + ")";
      fillEl.className = "mg-timer-fill " + stateClass;
    }
  }

  /* ==========================================================================
     7. CHOICE SELECTION & TIME-ATTACK LOGIC
     ========================================================================== */

  function handleSelectChoice(choiceIdx) {
    if (!gameState || gameState.phase !== "playing" || gameState.lockedInput) return;

    const round = gameState.currentRound;
    if (!round || choiceIdx < 0 || choiceIdx >= round.options.length) return;

    gameState.lockedInput = true;
    gameState.lastChoiceIdx = choiceIdx;

    const isCorrect = choiceIdx === round.answer;
    const now = Date.now();
    const responseTimeMs = now - (gameState.roundStartedAtMs || now);

    if (isCorrect) {
      // Speed bonus: faster answer yields higher bonus
      const speedBonus = Math.max(10, Math.round(50 * Math.max(0, 1 - responseTimeMs / 3500)));

      gameState.streak += 1;
      gameState.maxStreak = Math.max(gameState.maxStreak, gameState.streak);

      // Multiplier tiers: 1.0x -> 1.5x (streak 3) -> 2.0x (streak 5) -> 3.0x (streak 8+ FEVER)
      if (gameState.streak >= 8) gameState.multiplier = 3.0;
      else if (gameState.streak >= 5) gameState.multiplier = 2.0;
      else if (gameState.streak >= 3) gameState.multiplier = 1.5;
      else gameState.multiplier = 1.0;

      const earned = Math.round((gameState.gameDef.basePoints + speedBonus) * gameState.multiplier);
      gameState.score += earned;
      gameState.correctCount += 1;

      // Time Bonus (+3.0s)
      const bonusMs = (gameState.gameDef.timeBonusSec || 3.0) * 1000;
      gameState.remainingMs = Math.min(gameState.maxTimeCapMs, gameState.remainingMs + bonusMs);
      gameState.deadlineMs = Date.now() + gameState.remainingMs;

      gameState.recentFeedback = {
        type: "bonus",
        text: "+3.0s  •  +" + earned + " PTS",
        mult: gameState.multiplier
      };
      gameState.recentFeedbackUntilMs = Date.now() + 1100;

      GameAudio.playHit(gameState.streak);
    } else {
      // Time Penalty (-3.0s) & Combo Reset
      gameState.streak = 0;
      gameState.multiplier = 1.0;
      gameState.wrongCount += 1;

      const penaltyMs = (gameState.gameDef.timePenaltySec || 3.0) * 1000;
      gameState.remainingMs = Math.max(0, gameState.remainingMs - penaltyMs);
      gameState.deadlineMs = Date.now() + gameState.remainingMs;

      gameState.recentFeedback = {
        type: "penalty",
        text: "-3.0s PENALTY",
        mult: 1.0
      };
      gameState.recentFeedbackUntilMs = Date.now() + 1100;

      GameAudio.playMiss();
    }

    gameState.history.push({
      roundNum: gameState.roundNumber,
      prompt: round.prompt,
      isCorrect: isCorrect,
      chosenText: round.options[choiceIdx],
      correctText: round.correctText,
      explanation: round.explanation
    });

    renderArenaWorkspace();

    if (!isCorrect) {
      const arenaCard = document.getElementById("mg-active-arena-card");
      if (arenaCard) {
        arenaCard.classList.add("mg-arena-shake");
        setTimeout(() => arenaCard.classList.remove("mg-arena-shake"), 450);
      }
    }

    // Fast arcade transition delay (240ms)
    transitionTimeoutId = setTimeout(() => {
      if (!gameState || gameState.phase !== "playing") return;

      if (gameState.remainingMs <= 0) {
        finishMiniGame("timeout");
        return;
      }

      // Next endless round
      gameState.roundNumber += 1;
      gameState.currentRound = getNextEndlessRound(gameState.gameDef, gameState.usedIndices);
      gameState.roundStartedAtMs = Date.now();
      gameState.lockedInput = false;
      gameState.lastChoiceIdx = null;

      renderArenaWorkspace();
    }, 240);
  }

  /* ==========================================================================
     8. ARENA WORKSPACE RENDERING
     ========================================================================== */

  function renderArenaWorkspace() {
    const ws = document.getElementById("minigame-workspace");
    if (!ws || !gameState) return;

    const lessonWs = document.getElementById("lesson-workspace");
    if (lessonWs && !lessonWs.classList.contains("hidden")) {
      clearGameTimers();
      setMiniGameFocusMode(false);
      gameState = null;
      ws.classList.add("hidden");
      ws.innerHTML = "";
      return;
    }

    const esc = window.AppUtils?.escapeHtml || ((s) => String(s));
    const def = gameState.gameDef;
    const round = gameState.currentRound;
    const remSecCeil = Math.ceil(gameState.remainingMs / 1000);
    const remSecDecimal = (gameState.remainingMs / 1000).toFixed(1);
    const scaleRatio = Math.max(0, Math.min(1, gameState.remainingMs / (gameState.timeLimitInitialSec * 1000)));
    const stateClass = remSecCeil <= 8 ? "is-danger" : remSecCeil <= 18 ? "is-warn" : "";

    // Multiplier badge styling
    let comboBadgeClass = "mg-combo-badge";
    let comboLabel = "COMBO x1.0";
    if (gameState.streak >= 8) {
      comboBadgeClass += " is-fever-mode";
      comboLabel = "FEVER MODE x3.0!";
    } else if (gameState.streak >= 5) {
      comboBadgeClass += " is-combo-active";
      comboLabel = "SUPER x2.0 (" + gameState.streak + " STREAK)";
    } else if (gameState.streak >= 3) {
      comboBadgeClass += " is-combo-active";
      comboLabel = "COMBO x1.5 (" + gameState.streak + " STREAK)";
    }

    // Floating feedback banner
    let feedbackHtml = "";
    if (gameState.recentFeedback && Date.now() < gameState.recentFeedbackUntilMs) {
      const fb = gameState.recentFeedback;
      feedbackHtml = `
        <div class="mg-floating-feedback is-${fb.type} font-notch">
          <span>${esc(fb.text)}</span>
        </div>
      `;
    }

    // Question Image Stage
    let imageStageHtml = "";
    if (round.image) {
      imageStageHtml = `
        <div class="mg-illustration-stage">
          <img src="${esc(round.image)}" alt="Technical Diagram" class="mg-illustration-img" loading="eager" />
        </div>
      `;
    }

    // 4 Options Fast-Tap Pads
    const padsHtml = round.options
      .map((optText, optIdx) => {
        let padStateClass = "";
        if (gameState.lockedInput) {
          if (optIdx === round.answer) {
            padStateClass = "is-correct";
          } else if (optIdx === gameState.lastChoiceIdx) {
            padStateClass = "is-wrong";
          }
        }

        return `
          <button
            type="button"
            class="mg-pad-btn ${padStateClass}"
            data-mg-choice="${optIdx}"
            ${gameState.lockedInput ? "disabled" : ""}
          >
            <span class="mg-pad-key font-notch">[${optIdx + 1}]</span>
            <span class="mg-pad-text" style="font-size: 1.20rem; font-weight: 600; line-height: 1.45;">${esc(optText)}</span>
          </button>
        `;
      })
      .join("");

    ws.innerHTML = `
      <div class="mg-arena-card surface-card" style="position: relative;">
        ${feedbackHtml}

        <!-- Top Endless HUD Strip -->
        <div class="mg-hud-endless-grid">
          <!-- Left: Combo & Multiplier -->
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="${comboBadgeClass} font-notch">
              ${SVG.spark}
              <span>${comboLabel}</span>
            </span>
          </div>

          <!-- Center: Countdown Clock & Progress Fill -->
          <div style="text-align: center; min-width: 140px;">
            <div style="display: inline-flex; align-items: center; gap: 6px;">
              ${SVG.clock}
              <span id="mg-countdown-clock" class="mg-countdown-value font-notch tabular-nums ${stateClass}">
                ${remSecDecimal}s
              </span>
            </div>
            <div class="mg-timer-track" aria-hidden="true" style="height: 6px; margin-top: 6px;">
              <div id="mg-time-bar-fill" class="mg-timer-fill ${stateClass}" style="width: 100%; transform: scaleX(${scaleRatio.toFixed(4)});"></div>
            </div>
          </div>

          <!-- Right: Total Score & Rounds Count -->
          <div style="text-align: right;">
            <div style="display: inline-flex; align-items: center; gap: 6px;">
              ${SVG.trophy}
              <span class="font-notch tabular-nums" style="font-size: 1.35rem; font-weight: 800; color: var(--blue-600);">
                ${gameState.score.toLocaleString()} PTS
              </span>
            </div>
            <span class="font-notch tabular-nums" style="display: block; font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
              ROUND ${gameState.roundNumber}  •  ถูก ${gameState.correctCount} ข้อ
            </span>
          </div>
        </div>

        <!-- Main Challenge Stage Card -->
        <div id="mg-active-arena-card" class="surface-card mg-cockpit-card" style="margin-top: 16px;">
          <!-- Technical Badge & Context Scenario -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
            <span class="font-notch" style="font-size: 0.82rem; font-weight: 800; padding: 4px 10px; border-radius: 6px; background: #e0f2fe; color: #0369a1; border: 1.5px solid #0284c7;">
              ${esc(round.badge)}
            </span>
            <button type="button" class="btn-secondary" id="btn-abort-minigame" style="padding: 4px 12px; font-size: 0.80rem; min-height: 30px;">
              ออกจากการเล่น
            </button>
          </div>

          ${imageStageHtml}

          <div class="mg-specimen-box" style="margin-bottom: 16px; padding: 14px 18px;">
            <p style="font-size: 1.05rem; font-weight: 700; color: var(--text-secondary); line-height: 1.5; margin: 0;">
              ${esc(round.consoleLabel)}
            </p>
          </div>

          <div class="mg-prompt-row" style="margin-bottom: 18px;">
            <h2 class="mg-prompt-title" style="font-size: 1.48rem; font-weight: 800; line-height: 1.45; color: var(--text-primary); margin: 0 0 6px 0;">
              ${esc(round.prompt)}
            </h2>
            <span class="mg-prompt-sub" style="font-size: 0.95rem; color: var(--text-muted); display: block; margin-top: 6px;">
              เลือกคำตอบที่ถูกต้องให้ไวที่สุด (คลิกเมาส์ หรือกด 1–4 บนแป้นพิมพ์)
            </span>
          </div>

          <!-- 2x2 Fast-Tap Pads -->
          <div class="mg-pads-grid">
            ${padsHtml}
          </div>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     9. FINISH GAME & RESULTS WORKSPACE
     ========================================================================== */

  async function finishMiniGame(reason = "completed") {
    if (!gameState || gameState.phase === "result") return;
    clearGameTimers();
    setMiniGameFocusMode(false);

    const elapsedSec = Math.max(1, Math.round((Date.now() - gameState.startedAtMs) / 1000));
    gameState.phase = "result";
    gameState.finishReason = reason;
    gameState.finalTimeSec = elapsedSec;
    gameState.isSaving = true;
    gameState.saveError = "";

    const isStrongScore = gameState.score >= 1200;
    GameAudio.playFinish(isStrongScore);
    if (isStrongScore) {
      window.MotionEngine?.burstCelebration?.();
    }

    renderResultWorkspace();
    window.scrollTo({ top: 0, behavior: "smooth" });

    await persistMiniGameScore();
  }

  async function persistMiniGameScore() {
    if (!gameState) return;
    let user = window.AuthManager?.getCurrentUser();
    if (!user || !user.student_id) {
      try {
        const raw = localStorage.getItem(window.APP_CONFIG?.STORAGE_KEYS?.SESSION_USER || "cdti_session_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.student_id) {
            user = parsed;
          }
        }
      } catch (e) {}
    }

    if (!user || !user.student_id) {
      gameState.isSaving = false;
      gameState.saveError = "ไม่พบข้อมูลผู้เรียนในระบบ กรุณาเข้าสู่ระบบก่อนบันทึกคะแนน";
      renderResultWorkspace();
      window.AppUtils?.showToast?.("กรุณาเข้าสู่ระบบก่อนบันทึกคะแนน", "warning");
      return;
    }

    gameState.isSaving = true;
    gameState.saveError = "";
    renderResultWorkspace();
    window.MotionEngine?.startTopLoader?.();

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

      if (res.user) {
        window.AuthManager.updateSessionData(res.user, null, res.minigame_records);
      }
      gameState.isSaving = false;
      renderResultWorkspace();

      window.AppUtils?.showToast?.(
        "บันทึกผลมินิเกม " + gameState.gameDef.id + " สำเร็จ (" + gameState.score.toLocaleString() + " คะแนน • " + gameState.finalTimeSec + " วินาที)",
        "success"
      );
    } catch (err) {
      gameState.isSaving = false;
      const rawMsg = (err && err.message) ? err.message : String(err);
      if (rawMsg.includes("Cannot read properties of null") || rawMsg.includes("student_id")) {
        gameState.saveError = "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณากดลองบันทึกซ้ำ";
      } else {
        gameState.saveError = rawMsg || "เกิดข้อผิดพลาดขณะบันทึกคะแนนมินิเกม";
      }
      renderResultWorkspace();
      window.AppUtils?.showToast?.(gameState.saveError, "error");
    } finally {
      window.MotionEngine?.doneTopLoader?.();
    }
  }

  function renderResultWorkspace() {
    const ws = document.getElementById("minigame-workspace");
    if (!ws || !gameState) return;

    const lessonWs = document.getElementById("lesson-workspace");
    if (lessonWs && !lessonWs.classList.contains("hidden")) {
      ws.classList.add("hidden");
      ws.innerHTML = "";
      return;
    }

    const esc = window.AppUtils?.escapeHtml || ((s) => String(s));
    const def = gameState.gameDef;
    const totalAnswered = gameState.history.length;
    const accuracy = totalAnswered > 0 ? Math.round((gameState.correctCount / totalAnswered) * 100) : 0;

    // Rank Tier calculation
    let rankBadgeClass = "rank-c";
    let rankTitle = "C-RANK TRAINEE";
    if (gameState.score >= 2500) {
      rankBadgeClass = "rank-s";
      rankTitle = "S-RANK MASTER";
    } else if (gameState.score >= 1800) {
      rankBadgeClass = "rank-a";
      rankTitle = "A-RANK EXPERT";
    } else if (gameState.score >= 1000) {
      rankBadgeClass = "rank-b";
      rankTitle = "B-RANK SKILLED";
    }

    let saveBannerHtml = "";
    if (gameState.isSaving) {
      saveBannerHtml = `
        <div class="quiz-save-banner is-saving" style="margin-top: 16px;">
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <svg class="btn-spinner-svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2.4" opacity="0.28"></circle><path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"></path></svg>
            <span>กำลังบันทึกคะแนน (${gameState.score.toLocaleString()} PTS) และเวลา (${gameState.finalTimeSec} วินาที) ไปยังฐานข้อมูล...</span>
          </span>
        </div>
      `;
    } else if (gameState.saveError) {
      saveBannerHtml = `
        <div class="quiz-save-banner is-error" style="margin-top: 16px;">
          <span>${esc(gameState.saveError)}</span>
          <button type="button" class="btn-secondary" id="btn-retry-save-minigame" style="min-height: 32px; padding: 4px 12px; font-size: 0.78rem;">
            ลองบันทึกซ้ำ
          </button>
        </div>
      `;
    } else {
      saveBannerHtml = `
        <div class="quiz-save-banner is-success" style="margin-top: 16px;">
          ${SVG.check}
          <span>บันทึกลงฐานข้อมูลเรียบร้อย • คะแนนอัปเดตบนหน้าประวัติผลงานและการจัดอันดับ</span>
        </div>
      `;
    }

    ws.innerHTML = `
      <div class="mg-arena-card surface-card">
        <div style="text-align: center; padding: 14px 0 20px 0; border-bottom: 2px solid var(--border-subtle, #e2e8f0);">
          <span class="status-pill is-info font-notch" style="font-size: 0.78rem; letter-spacing: 0.04em;">
            TIME-ATTACK ENDLESS RUN COMPLETED
          </span>
          <h2 style="font-size: 1.55rem; font-weight: 800; margin: 10px 0 6px 0; color: var(--text-primary);">
            สรุปผลคะแนนโหมด Endless (${esc(def.id)})
          </h2>
          <p style="font-size: 0.92rem; color: var(--text-secondary); margin: 0;">
            ${esc(def.title)} • เอาชีวิตรอดแข่งกับเวลา
          </p>
        </div>

        <!-- Big Score & Rank Banner -->
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; background: var(--surface-secondary, #f8fafc); border: 2px solid var(--border-ink, #111827); border-radius: 10px; margin: 20px 0; box-shadow: 3px 3px 0 var(--border-ink, #111827);">
          <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.05em;">FINAL ARCADE SCORE</span>
          <span class="font-notch tabular-nums" style="font-size: 2.8rem; font-weight: 900; color: var(--blue-600); line-height: 1.1; margin: 6px 0 12px 0;">
            ${gameState.score.toLocaleString()} PTS
          </span>
          <span class="mg-rank-badge ${rankBadgeClass} font-notch">
            ${SVG.spark}
            <span>${rankTitle}</span>
          </span>
        </div>

        <!-- 4-Metric Grid -->
        <div class="metric-strip" style="box-shadow: none; border: 2px solid var(--border-ink, #111827); border-radius: 10px; padding: 14px; background: var(--surface-card, #ffffff);">
          <div class="metric-cell">
            <span class="metric-label">จำนวนข้อที่ตอบ</span>
            <strong class="metric-value font-notch tabular-nums">${totalAnswered} ข้อ</strong>
            <span class="metric-sub">ตอบถูก ${gameState.correctCount} • ผิด ${gameState.wrongCount}</span>
          </div>
          <div class="metric-cell">
            <span class="metric-label">ความแม่นยำ</span>
            <strong class="metric-value font-notch tabular-nums">${accuracy}%</strong>
            <span class="metric-sub">Accuracy Rate</span>
          </div>
          <div class="metric-cell">
            <span class="metric-label">คอมโบต่อเนื่องสูงสุด</span>
            <strong class="metric-value font-notch tabular-nums">${gameState.maxStreak}x</strong>
            <span class="metric-sub">Max Streak Combo</span>
          </div>
          <div class="metric-cell">
            <span class="metric-label">เวลาที่เอาชีวิตรอดได้</span>
            <strong class="metric-value font-notch tabular-nums">${window.AppUtils.formatDuration(gameState.finalTimeSec)}</strong>
            <span class="metric-sub">Survival Time</span>
          </div>
        </div>

        ${saveBannerHtml}

        <!-- Action Buttons -->
        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-top: 24px; padding-top: 18px; border-top: 2px solid var(--border-subtle, #e2e8f0);">
          <button type="button" class="btn-secondary" id="btn-mg-back-directory">
            ${SVG.arrowLeft}
            <span>กลับสู่บทเรียน (Exit)</span>
          </button>
          <button type="button" class="btn-primary" data-open-minigame="${esc(def.id)}">
            ${SVG.refresh}
            <span>เล่นใหม่อีกครั้ง (Retry Run)</span>
          </button>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     10. EVENT BINDINGS & KEYBOARD CONTROLS
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

        if (e.target.closest("#btn-abort-minigame") || e.target.closest("#btn-mg-back-directory")) {
          e.preventDefault();
          clearGameTimers();
          setMiniGameFocusMode(false);
          gameState = null;
          ws.classList.add("hidden");
          ws.innerHTML = "";
          document.getElementById("lessons-directory-shell")?.classList.remove("hidden");
          if (window.AppController && window.AppController.switchView) {
            window.AppController.switchView("lessons");
          }
          return;
        }

        if (e.target.closest("#btn-retry-save-minigame")) {
          e.preventDefault();
          persistMiniGameScore();
        }
      });
    }

    // Keyboard Shortcuts (1-4 for fast-tap answers)
    window.addEventListener("keydown", (e) => {
      if (
        !gameState ||
        gameState.phase !== "playing" ||
        gameState.lockedInput ||
        e.repeat ||
        e.ctrlKey ||
        e.altKey ||
        e.metaKey
      ) {
        return;
      }

      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (activeTag === "input" || activeTag === "textarea") return;

      const key = e.key;
      if (key === "1" || key === "2" || key === "3" || key === "4") {
        e.preventDefault();
        const choiceIdx = Number(key) - 1;
        handleSelectChoice(choiceIdx);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindMiniGameEvents);
  } else {
    bindMiniGameEvents();
  }

  /* ==========================================================================
     11. PUBLIC CONTROLLER API
     ========================================================================== */

  window.MiniGameEngine = {
    openRuleModal,
    closeRuleModal,
    startMiniGame,
    finishMiniGame,
    getGameState: () => gameState,
    stopActiveGame: () => {
      clearGameTimers();
      setMiniGameFocusMode(false);
      gameState = null;
      const ws = document.getElementById("minigame-workspace");
      if (ws) {
        ws.classList.add("hidden");
        ws.innerHTML = "";
      }
    },
    isMiniGameActive: () =>
      Boolean(
        gameState &&
        gameState.phase === "playing" &&
        !document.getElementById("minigame-workspace")?.classList.contains("hidden")
      ),
    getGameForMilestoneUnit(unitNo) {
      const u = Number(unitNo);
      if (u === 4) return GAMES_CATALOG.G01;
      if (u === 8) return GAMES_CATALOG.G02;
      if (u === 12) return GAMES_CATALOG.G03;
      if (u === 16) return GAMES_CATALOG.G04;
      return null;
    }
  };
})();
