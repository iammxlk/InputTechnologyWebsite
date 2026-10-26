---
name: gas-sheets-backend-auth
description: ระบบหลังบ้าน Google Apps Script (Code.gs) และโครงสร้าง Google Sheets สำหรับบันทึกคะแนนรวม 100 คะแนน (อ่าน+ควิซ+มินิเกม) โดยห้ามมีช่องกรอก API Key บนหน้าล็อกอินของนักเรียนเด็ดขาด
---
# GAS & Sheets Backend Auth Skill

สกิลสำหรับจัดการระบบหลังบ้านและความปลอดภัยของเว็บการศึกษารายวิชา 21901-2017:

## 1. กฎเหล็กหน้าล็อกอินนักเรียน (Zero API Key Exposure on Student UI)
- หน้าจอล็อกอินของนักเรียน (Student Login Modal) ต้องสะอาด ปลอดภัย และใช้งานจริงได้ทันที
- รับข้อมูลจากนักเรียนเพียง 3 ช่องเท่านั้น:
  1. **รหัสนักศึกษา / เลขที่**
  2. **ชื่อ-นามสกุล**
  3. **อีเมล**
- **ห้ามมีช่องกรอก API Key, Web App URL, Secret Key หรือปุ่มตั้งค่าหลังบ้านใดๆ โผล่มาให้เด็กเห็นเด็ดขาด**
- ตัวแปร `GAS_WEB_APP_URL` ต้องถูกฝังไว้ในตัวแปรระดับโค้ด (`const GAS_WEB_APP_URL = "..."`) เพื่อให้ครูผู้สอนเป็นคนใส่ลิงก์เองที่หลังบ้านเท่านั้น

## 2. โครงสร้างฐานข้อมูล Google Sheets (2 แท็บหลัก)
1. **แท็บ `Students_Progress` (เก็บสถานะและคะแนนล่าสุดของนักเรียนรายบุคคล - เต็ม 100 คะแนน):**
   - คอลัมน์: `Timestamp` | `Student_ID` | `Full_Name` | `Email` | `Read_Units_JSON` (15 คะแนน) | `Unit_Quiz_Score` (45 คะแนน) | `Mini_Game_Score` (40 คะแนน) | `Total_Score` (100 คะแนน) | `Cert_Status` (`Unlocked` เมื่อ >= 70)
   - ใช้ `Email` หรือ `Student_ID` เป็นคีย์หลัก หากมีข้อมูลอยู่แล้วให้ทำการอัปเดตแถวเดิม (Upsert) ไม่ให้ข้อมูลซ้ำซ้อน
2. **แท็บ `Score_Logs` (เก็บประวัติการทำควิซและเล่นมินิเกมทุกครั้ง):**
   - คอลัมน์: `Timestamp` | `Student_ID` | `Full_Name` | `Activity_ID` (เช่น `Unit_05_Quiz`, `Game_Cashier_Rush`) | `Score` | `Details`

## 3. การรับ-ส่งข้อมูลไร้ปัญหา CORS (CORS-Safe Fetching)
- ฝั่งหน้าบ้าน (Frontend) ส่งข้อมูลแบบ `POST` ไปยัง Google Apps Script Web App โดยกำหนด `headers: { 'Content-Type': 'text/plain;charset=utf-8' }` และแปลงข้อมูลด้วย `JSON.stringify(payload)` เพื่อหลีกเลี่ยงปัญหา CORS Preflight
- มีระบบ Fallback เก็บข้อมูลลง `localStorage` ควบคู่กันเสมอ เพื่อให้เว็บทำงานได้ลื่นไหลทันทีแม้เน็ตโรงเรียนจะหน่วง แล้วค่อยซิงก์ข้อมูลขึ้น Google Sheets เบื้องหลัง
