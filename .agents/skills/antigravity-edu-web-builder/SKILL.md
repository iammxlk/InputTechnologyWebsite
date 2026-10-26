---
name: antigravity-edu-web-builder
description: สกิลหลักสำหรับสั่งงาน Antigravity เพื่อสร้างเว็บการศึกษารายวิชา 21901-2017 ในธีม Neo-Brutalism (Stwedy) ใช้ฟอนต์ Stack Sans Notch คู่กับฟอนต์ไทย Mitr พร้อมภาพอุปกรณ์กดทดลองใช้ในเว็บ มินิเกมประจำหมวด เกียรติบัตรออนไลน์ และระบบหลังบ้าน Google Sheets แบบไร้ API Key บนหน้าล็อกอินนักเรียน
---
# Antigravity Edu Web Builder (Master Orchestrator Skill)

สกิลแม่บทสำหรับส่งงานต่อให้ระบบ AI Coding Agent (**Antigravity**) พัฒนาเว็บแอปพลิเคชันเพื่อการศึกษารายวิชา **เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์ (21901-2017)** แบบครบวงจร โดยทำงานประสานกับ 3 สกิลย่อย (`neo-brutalist-ui-designer`, `gamified-quiz-certificate`, `gas-sheets-backend-auth`)

## 1. กฎเหล็กสำหรับ Antigravity Agent (Strict Agent Directives)
1. **Font Stack บังคับใช้:**
   - ภาษาอังกฤษ / ตัวเลข / หัวข้อแบรนด์: **`Stack Sans Notch`**
   - ภาษาไทยทั้งหมด (หัวข้อ, เนื้อหา, ปุ่ม, เกียรติบัตร): **`Mitr`**
   - ต้องใส่ `<link>` ดึงฟอนต์ทั้ง `Stack Sans Notch` และ `Mitr` จาก Google Fonts ใน `<head>` ทุกครั้ง
2. **ห้ามย่อโค้ด (Zero Placeholder Policy):**
   - Antigravity ต้องเขียนข้อมูลทั้ง **15 หน่วยการเรียนรู้**, **ภาพจำลองอุปกรณ์ (Interactive SVG Simulators)**, **คำถามท้ายหน่วย 45 ข้อ (หน่วยละ 3 ข้อ)**, และ **มินิเกมประจำหมวด 4 เกม** ให้ครบถ้วน 100% ห้ามใช้คอมเมนต์ `// TODO: Add remaining units` เด็ดขาด
3. **ความปลอดภัยหน้าล็อกอินนักเรียน (Zero API Key UI):**
   - หน้าล็อกอินของเด็กมีแค่ **รหัสนักศึกษา/เลขที่, ชื่อ-นามสกุล, และอีเมล** เท่านั้น ห้ามสร้างช่องกรอก API Key หรือ Web App URL บนหน้าเว็บฝั่งนักเรียนเด็ดขาด
4. **ภาษาไทยธรรมชาติ (No AI Jargon):**
   - ใช้คำพูดสั้น กระชับ เป็นกันเองเหมือนครูวัยรุ่นคุยกับนักเรียน ปวช. ห้ามใช้สำนวนแปลไทยแบบ AI ที่เว่อร์วัง

## 2. โครงสร้างไฟล์ในโปรเจกต์สำหรับ Antigravity
เมื่อสั่งงานใน Antigravity ให้จัดโครงสร้างไฟล์ดังนี้:
- `index.html` — โครงสร้างหน้าเว็บหลัก, โหลด Google Fonts (`Stack Sans Notch` & `Mitr`), Tailwind CSS, และ `html2canvas`
- `styles.css` — คลาส Neo-Brutalism (`.brutal-border`, `.brutal-shadow`, Tactile Button Motion, และ Keyframes แอนิเมชันอุปกรณ์)
- `data.js` — คลังเนื้อหา 15 หน่วย, ข้อมูล Interactive Simulators, และคลังข้อสอบท้ายหน่วย 45 ข้อ
- `simulators.js` — ลอจิกภาพอุปกรณ์เสมือนจริงให้เด็กกดทดลองใช้ในเว็บ (ยิงบาร์โค้ดพร้อมเสียงติ๊ด, กดปุ่มคีย์บอร์ดดู Scan Code, ทำรอยเปื้อน QR Code, แตะบัตร RFID, ปรับค่า Threshold สแกนนิ้ว, เครื่องคิดเลข Check Digit & RLE)
- `games.js` — ลอจิกมินิเกมประจำหมวด 4 เกม (Cashier Rush, Cyber Detective, Vault Hacker, Pixel Compressor)
- `app.js` — ระบบจัดการสถานะผู้เรียน (`localStorage` + ซิงก์ข้อมูลไป Google Sheets), ระบบคำนวณคะแนนเต็ม 100 (อ่าน 15 + ควิซ 45 + เกม 40), และระบบสร้างเกียรติบัตร `.PNG`
- `backend/Code.gs` — สคริปต์หลังบ้านสำหรับนำไปวางใน Google Apps Script ที่ผูกกับ Google Sheets (`Students_Progress` และ `Score_Logs`)