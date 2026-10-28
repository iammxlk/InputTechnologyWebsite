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
        "โหมด ENDLESS: สังเกตแถบรหัส 1D เลเซอร์ และเมทริกซ์ 2D Imager ตอบคำถามให้ไวที่สุดก่อนหมดเวลา",
        "ตอบถูกรับคะแนน + ยืดเวลาเพิ่ม +3.0 วินาที ยิ่งคอมโบต่อเนื่องยิ่งได้แต้มทวีคูณ",
        "ตอบผิดถูกหักเวลา -3.0 วินาที และรีเซ็ตคอมโบ",
        "คลิกตัวเลือก หรือกดแป้น 1 – 4 บนคีย์บอร์ดเพื่อทำสปีด"
      ],
      challenges: G01_CHALLENGES
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
        "โหมด ENDLESS: ตรวจสอบความปลอดภัย Data Validation, แฮชชิ่ง, คลื่น RFID และระบบชีวมิติ",
        "ตอบถูกรับคะแนน + ยืดเวลาเพิ่ม +3.0 วินาที",
        "ตอบผิดถูกหักเวลา -3.0 วินาที และรีเซ็ตคอมโบ",
        "คลิกตัวเลือก หรือกดแป้น 1 – 4 บนคีย์บอร์ด"
      ],
      challenges: G01_CHALLENGES
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
        "โหมด ENDLESS: คำนวณการบีบอัดข้อมูล RLE, แปลงรหัสอักขระ UTF-8/ASCII และเทคนิคฐานข้อมูล",
        "ตอบถูกรับคะแนน + ยืดเวลาเพิ่ม +3.0 วินาที",
        "ตอบผิดถูกหักเวลา -3.0 วินาที และรีเซ็ตคอมโบ",
        "คลิกตัวเลือก หรือกดแป้น 1 – 4 บนคีย์บอร์ด"
      ],
      challenges: G01_CHALLENGES
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
            <span class="mg-pad-text">${esc(optText)}</span>
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
            <span class="font-notch" style="font-size: 0.74rem; font-weight: 800; padding: 2px 8px; border-radius: 4px; background: #e0f2fe; color: #0369a1; border: 1.5px solid #0284c7;">
              ${esc(round.badge)}
            </span>
            <button type="button" class="btn-secondary" id="btn-abort-minigame" style="padding: 2px 10px; font-size: 0.74rem; min-height: 28px;">
              ออกจากการเล่น
            </button>
          </div>

          ${imageStageHtml}

          <div class="mg-specimen-box" style="margin-bottom: 16px; padding: 12px 16px;">
            <p style="font-size: 0.88rem; font-weight: 600; color: var(--text-secondary); line-height: 1.5; margin: 0;">
              ${esc(round.consoleLabel)}
            </p>
          </div>

          <div class="mg-prompt-row" style="margin-bottom: 16px;">
            <h2 class="mg-prompt-title" style="font-size: 1.15rem; font-weight: 700; line-height: 1.45; color: var(--text-primary);">
              ${esc(round.prompt)}
            </h2>
            <span class="mg-prompt-sub" style="font-size: 0.8rem; color: var(--text-muted); display: block; margin-top: 4px;">
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
    const user = window.AuthManager?.getCurrentUser();
    if (!user) return;

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

      window.AuthManager.updateSessionData(res.user, null, res.minigame_records);
      gameState.isSaving = false;
      renderResultWorkspace();

      window.AppUtils?.showToast?.(
        "บันทึกผลมินิเกม " + gameState.gameDef.id + " สำเร็จ (" + gameState.score + " คะแนน • " + gameState.finalTimeSec + " วินาที)",
        "success"
      );
    } catch (err) {
      gameState.isSaving = false;
      gameState.saveError = err.message || "เกิดข้อผิดพลาดขณะบันทึกคะแนนมินิเกม";
      renderResultWorkspace();
      window.AppUtils?.showToast?.(gameState.saveError, "error");
    } finally {
      window.MotionEngine?.doneTopLoader?.();
    }
  }

  function renderResultWorkspace() {
    const ws = document.getElementById("minigame-workspace");
    if (!ws || !gameState) return;

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
