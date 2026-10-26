/**
 * ============================================================================
 * data.js — คลังเนื้อหาบทเรียนทั้ง 15 หน่วย (แบ่งเป็นสเต็ปย่อย Step-by-Step) และข้อสอบ 45 ข้อ
 * รายวิชา: เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์ (รหัสวิชา 21901-2017)
 * ระดับชั้น: ปวช.1 | ธีม: Neo-Brutalism (Stwedy) — ไร้การใช้อิโมจิ (Zero Emoji)
 * ============================================================================
 */

window.COURSE_MODULES = [
  {
    id: 1,
    title: "หมวดที่ 1: พื้นฐานและอุปกรณ์นำเข้าทั่วไป",
    unitRange: "หน่วยที่ 1 - 4",
    badgeColor: "bg-emerald-300"
  },
  {
    id: 2,
    title: "หมวดที่ 2: เทคโนโลยีบาร์โค้ดและไร้สาย",
    unitRange: "หน่วยที่ 5 - 6",
    badgeColor: "bg-amber-300"
  },
  {
    id: 3,
    title: "หมวดที่ 3: รหัสภาพ QR Code และความปลอดภัย",
    unitRange: "หน่วยที่ 7 - 10",
    badgeColor: "bg-sky-300"
  },
  {
    id: 4,
    title: "หมวดที่ 4: ระบบระบุตัวตนและชีวมิติ",
    unitRange: "หน่วยที่ 11 - 12",
    badgeColor: "bg-pink-300"
  },
  {
    id: 5,
    title: "หมวดที่ 5: ซอฟต์แวร์ การแปลงรหัส และการบีบอัดข้อมูล",
    unitRange: "หน่วยที่ 13 - 15",
    badgeColor: "bg-amber-300"
  }
];

window.COURSE_UNITS = [
  /* ==========================================================================
     หมวดที่ 1: พื้นฐานและอุปกรณ์นำเข้าทั่วไป (หน่วยที่ 1 - 4)
     ========================================================================== */
  {
    id: 1,
    moduleId: 1,
    moduleName: "หมวดที่ 1: พื้นฐานและอุปกรณ์นำเข้าทั่วไป",
    code: "UNIT 01",
    title: "ข้อมูลดิบ (Raw Data) สารสนเทศ (Information) และวงจร IPO",
    summary: "แยกความแตกต่างระหว่างข้อมูลดิบกับสารสนเทศ รู้จักข้อมูลทั้ง 5 ประเภท และขั้นตอนการทำงานของวงจร IPO",
    simType: "ipo_cycle_lab",
    simLabel: "LAB 01: จำลองการป้อนข้อมูลดิบเข้าสู่วงจร IPO",
    accentBg: "bg-emerald-200",
    steps: [
      {
        badge: "PART 01 • CONCEPT",
        title: "ความแตกต่างระหว่าง ข้อมูลดิบ (Raw Data) กับ สารสนเทศ (Information)",
        html: `
          <div class="space-y-4">
            <p class="text-sm sm:text-base">
              ในระบบคอมพิวเตอร์ ข้อมูลที่วิ่งเข้ามาในระบบตอนเริ่มต้นกับผลลัพธ์ที่สรุปออกมาให้ผู้บริหารหรือครูใช้งาน มีชื่อเรียกและสถานะต่างกันอย่างชัดเจน 2 ระดับ ดังนี้:
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="calc-step-box rounded-2xl p-4">
                <span class="font-notch font-bold text-xs bg-emerald-300 px-2.5 py-0.5 rounded border border-black">1. RAW DATA</span>
                <h5 class="font-bold text-base mt-2">ข้อมูลดิบ (Raw Data)</h5>
                <p class="text-xs sm:text-sm mt-1 text-zinc-700">
                  คือข้อเท็จจริง ตัวเลข หรือข้อความที่เพิ่งเก็บรวบรวมมาสดๆ <strong>ยังไม่ผ่านการคำนวณหรือจัดกลุ่ม</strong> เช่น คะแนนสอบรายคน <code>72, 85, 64</code> หรือรายการยิงบาร์โค้ดน้ำดื่ม 1 ขวด
                </p>
              </div>
              <div class="calc-step-box rounded-2xl p-4">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2.5 py-0.5 rounded border border-black">2. INFORMATION</span>
                <h5 class="font-bold text-base mt-2">สารสนเทศ (Information)</h5>
                <p class="text-xs sm:text-sm mt-1 text-zinc-700">
                  คือข้อมูลดิบที่นำมา<strong>ประมวลผล คำนวณ หรือเรียงลำดับเรียบร้อยแล้ว</strong> จนนำไปใช้ตัดสินใจต่อได้ทันที เช่น <em>"คะแนนเฉลี่ยของห้องคือ 73.67 คะแนน"</em> หรือ <em>"ตารางสินค้าขายดี 5 อันดับแรก"</em>
                </p>
              </div>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • DATA TYPES & IPO",
        title: "ประเภทข้อมูล 5 ลักษณะ และลำดับการทำงานของวงจร IPO",
        html: `
          <div class="space-y-4">
            <div class="calc-step-box rounded-2xl p-4 space-y-2">
              <h5 class="font-bold text-base">ประเภทของข้อมูล 5 ลักษณะที่นำเข้าสู่คอมพิวเตอร์</h5>
              <ul class="list-disc pl-5 text-xs sm:text-sm space-y-1 text-zinc-800">
                <li><strong>1. ข้อมูลตัวเลข (Numeric Data):</strong> ตัวเลขที่ใช้คำนวณบวกลบคูณหารได้ เช่น ราคาสินค้า <code>45.50</code> บาท, จำนวนสต๊อก <code>120</code> ชิ้น</li>
                <li><strong>2. ข้อมูลตัวอักษร/ข้อความ (Text / String Data):</strong> ตัวหนังสือหรือตัวเลขที่ไม่ได้นำไปคำนวณ เช่น ชื่อ-นามสกุล, รหัสไปรษณีย์ <code>10110</code>, เบอร์โทรศัพท์ (ต้องเก็บเป็นข้อความเพื่อรักษาเลข 0 นำหน้า)</li>
                <li><strong>3. ข้อมูลภาพ (Image Data):</strong> ภาพนิ่งจากกล้องหรือสแกนเนอร์ที่ประกอบด้วยจุดสี (Pixel)</li>
                <li><strong>4. ข้อมูลเสียง (Audio Data):</strong> คลื่นเสียงพูดหรือเสียงดนตรีที่รับผ่านไมโครโฟน</li>
                <li><strong>5. ข้อมูลวิดีโอ (Video Data):</strong> ภาพเคลื่อนไหวที่เกิดจากภาพนิ่งหลายเฟรมเรียงต่อกันพร้อมเสียง</li>
              </ul>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box bg-emerald-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-emerald-400 px-2 py-0.5 rounded border border-black">STEP 1: INPUT</span>
                <p class="mt-2 font-semibold">การนำเข้าข้อมูลดิบ</p>
                <p class="text-xs text-zinc-700 mt-0.5">รับข้อมูลผ่านอุปกรณ์นำเข้า เช่น คีย์บอร์ด เมาส์ หรือเครื่องอ่านบาร์โค้ด</p>
              </div>
              <div class="calc-step-box bg-amber-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">STEP 2: PROCESS</span>
                <p class="mt-2 font-semibold">การประมวลผล</p>
                <p class="text-xs text-zinc-700 mt-0.5">CPU ทำการคำนวณ เปรียบเทียบ คัดกรอง หรือจัดเรียงข้อมูล</p>
              </div>
              <div class="calc-step-box bg-sky-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-sky-300 px-2 py-0.5 rounded border border-black">STEP 3: OUTPUT</span>
                <p class="mt-2 font-semibold">การแสดงผลสารสนเทศ</p>
                <p class="text-xs text-zinc-700 mt-0.5">ส่งผลลัพธ์ออกทางหน้าจอ เครื่องพิมพ์ใบเสร็จ หรือบันทึกลงฐานข้อมูล</p>
              </div>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "ข้อใดจัดเป็น 'สารสนเทศ (Information)' ที่ผ่านการประมวลผลเรียบร้อยแล้ว?",
        options: [
          "ตัวเลขเวลาที่พนักงานสแกนนิ้วเข้างานรายคน",
          "รหัสบาร์โค้ดข้างกล่องนม 1 กล่อง",
          "ตารางสรุปยอดขายรายเดือนเรียงลำดับสินค้าขายดี 5 อันดับแรก",
          "รายชื่อนักเรียนที่เพิ่งกรอกลงในใบสมัคร"
        ],
        answer: 2,
        explain: "ตารางสรุปยอดขายและจัดอันดับสินค้าขายดี ผ่านการคำนวณและเปรียบเทียบมาแล้ว จึงเป็นสารสนเทศ (Information)"
      },
      {
        q: "รหัสไปรษณีย์ '10110' และเบอร์โทรศัพท์ '081-234-5678' ควรจัดเก็บเป็นข้อมูลประเภทใดจึงจะเหมาะสมที่สุด?",
        options: [
          "ข้อมูลตัวเลขสำหรับคำนวณ (Numeric Data)",
          "ข้อมูลตัวอักษร/ข้อความ (Text / String Data)",
          "ข้อมูลภาพนิ่ง (Image Data)",
          "ข้อมูลคลื่นเสียง (Audio Data)"
        ],
        answer: 1,
        explain: "เราไม่ได้นำรหัสไปรษณีย์หรือเบอร์โทรไปบวกลบคูณหาร และต้องรักษาเลข 0 นำหน้าไว้ จึงต้องเก็บเป็นข้อความ (Text/String)"
      },
      {
        q: "เมื่อแคชเชียร์ใช้ปืนยิงบาร์โค้ดสแกนสินค้า แล้วโปรแกรมคำนวณราคารวมก่อนพิมพ์ใบเสร็จออกมา ขั้นตอน 'การใช้ปืนยิงบาร์โค้ด' คือส่วนใดของวงจร IPO?",
        options: [
          "Input (การนำเข้าข้อมูล)",
          "Process (การประมวลผล)",
          "Output (การแสดงผล)",
          "Formatting (การจัดหน้ากระดาษ)"
        ],
        answer: 0,
        explain: "ปืนยิงบาร์โค้ดทำหน้าที่รับรหัสสินค้าจากภายนอกเข้าสู่ระบบคอมพิวเตอร์ จึงเป็นขั้นตอน Input"
      }
    ]
  },

  {
    id: 2,
    moduleId: 1,
    moduleName: "หมวดที่ 1: พื้นฐานและอุปกรณ์นำเข้าทั่วไป",
    code: "UNIT 02",
    title: "เทคโนโลยีการนำข้อมูลเข้า หลักการ GIGO และ Manual vs Automatic Input",
    summary: "ทำความเข้าใจกฎเหล็ก GIGO (ขยะเข้า-ขยะออก) และเปรียบเทียบการป้อนข้อมูลด้วยมือ (Manual) กับระบบอัตโนมัติ (AIDC)",
    simType: "manual_vs_auto_lab",
    simLabel: "LAB 02: ทดสอบความเร็ว Manual vs Automatic Input และจำลอง GIGO",
    accentBg: "bg-emerald-200",
    steps: [
      {
        badge: "PART 01 • GIGO PRINCIPLE",
        title: "หลักการ GIGO (Garbage In, Garbage Out) ทำไมข้อมูลขาเข้าต้องแม่นยำ",
        html: `
          <div class="space-y-4">
            <div class="calc-step-box bg-amber-100 rounded-2xl p-5">
              <span class="font-notch font-bold text-xs bg-zinc-900 text-white px-2.5 py-1 rounded">CORE RULE: GIGO</span>
              <h5 class="font-bold text-lg mt-2">Garbage In, Garbage Out (ขยะเข้า ขยะก็ออก)</h5>
              <p class="text-xs sm:text-sm mt-1.5 text-zinc-800">
                ต่อให้เครื่องคอมพิวเตอร์จะประมวลผลเร็วแค่ไหนหรือซอฟต์แวร์เขียนมาดีเพียงใด แต่ถ้าเราป้อนข้อมูลขาเข้า (Input) ที่ผิดพลาดเข้าไป เช่น พิมพ์ราคาสินค้าจาก <code>50</code> เป็น <code>500</code> บาท ผลลัพธ์ที่คำนวณออกมาก็จะผิดพลาดทั้งหมด ดังนั้นด่านการนำเข้าข้อมูลจึงสำคัญที่สุด
              </p>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • MANUAL VS AUTOMATIC",
        title: "เปรียบเทียบการนำเข้าข้อมูลแบบ Manual กับแบบ Automatic (AIDC)",
        html: `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="calc-step-box rounded-2xl p-4 space-y-2">
              <span class="font-notch font-bold text-xs bg-zinc-200 px-2.5 py-0.5 rounded border border-black">TYPE 01 • MANUAL INPUT</span>
              <h5 class="font-bold text-base">การนำเข้าข้อมูลด้วยมือ (Manual Data Entry)</h5>
              <p class="text-xs sm:text-sm text-zinc-700">
                ใช้พนักงานเป็นคนพิมพ์ กดปุ่ม หรือเขียนข้อมูลเข้าเครื่องเองโดยตรง เช่น พิมพ์ชื่อลูกค้าผ่านคีย์บอร์ด หรือจิ้มเลือกเมนูบนจอสัมผัส
              </p>
              <ul class="list-disc pl-5 text-xs space-y-1 text-zinc-700">
                <li><strong>ข้อดี:</strong> ยืดหยุ่นสูง รับข้อมูลใหม่ๆ ที่ไม่เคยมีในระบบมาก่อนได้</li>
                <li><strong>ข้อจำกัด:</strong> ช้าเมื่อมีข้อมูลจำนวนมาก และเกิดความผิดพลาดจากคน (Human Error) ได้ง่ายเมื่อเหนื่อยล้า</li>
              </ul>
            </div>

            <div class="calc-step-box rounded-2xl p-4 space-y-2">
              <span class="font-notch font-bold text-xs bg-emerald-400 px-2.5 py-0.5 rounded border border-black">TYPE 02 • AUTOMATIC INPUT (AIDC)</span>
              <h5 class="font-bold text-base">การนำเข้าข้อมูลอัตโนมัติ (Automatic Data Entry)</h5>
              <p class="text-xs sm:text-sm text-zinc-700">
                ใช้อุปกรณ์อ่านข้อมูลจากสื่อหรือวัตถุเข้าสู่ระบบโดยตรง (AIDC) เช่น บาร์โค้ด, QR Code, RFID, ซอฟต์แวร์ OCR, สแกนลายนิ้วมือ
              </p>
              <ul class="list-disc pl-5 text-xs space-y-1 text-zinc-700">
                <li><strong>ข้อดี:</strong> รวดเร็วมาก (เสี้ยววินาที) แม่นยำสูง ลดการพิมพ์ผิดเกือบ 100%</li>
                <li><strong>ข้อจำกัด:</strong> ต้องมีการเตรียมสื่อล่วงหน้า (เช่น ต้องพิมพ์ป้ายบาร์โค้ดหรือผูกบัตร RFID ไว้ก่อน)</li>
              </ul>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "คำกล่าวที่ว่า 'GIGO (Garbage In, Garbage Out)' สอนให้ผู้ปฏิบัติงานตระหนักถึงความสำคัญของเรื่องใดมากที่สุด?",
        options: [
          "การทำความสะอาดเคสคอมพิวเตอร์ไม่ให้มีฝุ่นเกาะ",
          "การตรวจสอบความถูกต้องของข้อมูลตั้งแต่ขั้นตอนการนำเข้า (Input)",
          "การเลือกซื้อหน้าจอมอนิเตอร์ที่มีความละเอียดสูง",
          "การลบไฟล์ในถังขยะ (Recycle Bin) ทุกวัน"
        ],
        answer: 1,
        explain: "GIGO เตือนว่าหากข้อมูลที่ป้อนเข้าสู่ระบบ (Input) ผิดพลาด ผลลัพธ์ที่ได้จากการประมวลผลก็จะผิดพลาดตามไปด้วย"
      },
      {
        q: "ข้อใดเป็นการนำเข้าข้อมูลแบบอัตโนมัติ (Automatic Data Entry / AIDC) ทั้งหมด?",
        options: [
          "การพิมพ์เอกสารด้วยคีย์บอร์ด และการวาดภาพด้วยเมาส์ปากกา",
          "การยิงบาร์โค้ดสินค้า การแตะบัตร RFID และการสแกนใบหน้าเข้างาน",
          "การกรอกแบบฟอร์มสมัครงานออนไลน์ด้วยตนเอง",
          "การจดยอดขายใส่สมุดแล้วนำมาคีย์เข้าโปรแกรม Excel ตอนเย็น"
        ],
        answer: 1,
        explain: "บาร์โค้ด, RFID และระบบสแกนใบหน้า ล้วนใช้หัวอ่านหรือเซนเซอร์ดึงข้อมูลเข้าสู่ระบบโดยอัตโนมัติ"
      },
      {
        q: "หากต้องการเช็กสต๊อกสินค้าในคลังสินค้าจำนวน 50,000 ชิ้น ภายในเวลาครึ่งวัน ควรเลือกวิธีนำเข้าข้อมูลแบบใดเพื่อลด Human Error?",
        options: [
          "ให้พนักงานช่วยกันจดรหัสตัวเลข 13 หลักลงกระดาษแล้วพิมพ์เข้าเครื่อง",
          "ใช้ระบบ Automatic Input เช่น เครื่องอ่านบาร์โค้ดหรืออ่านแท็ก RFID",
          "ใช้การอ่านออกเสียงใส่ไมโครโฟนทีละชิ้น",
          "ถ่ายรูปชั้นวางสินค้าแล้วมานั่งนับจากภาพทีละกล่อง"
        ],
        answer: 1,
        explain: "งานที่มีปริมาณข้อมูลจำนวนมากและต้องการความแม่นยำสูง ต้องใช้ Automatic Input เพื่อความรวดเร็วและลดการพิมพ์ผิด"
      }
    ]
  },

  {
    id: 3,
    moduleId: 1,
    moduleName: "หมวดที่ 1: พื้นฐานและอุปกรณ์นำเข้าทั่วไป",
    code: "UNIT 03",
    title: "อุปกรณ์นำเข้าพื้นฐาน: แป้นพิมพ์ (Key Matrix & Scan Code), เมาส์ (DPI) และสแกนเนอร์",
    summary: "เจาะลึกแผงวงจร Key Matrix ที่แปลงปุ่มกดเป็นรหัส Scan Code พร้อมวิธีคำนวณความไวเมาส์ (DPI) แบบ Step-by-Step",
    simType: "keyboard_matrix_lab",
    simLabel: "LAB 03: กดปุ่มคีย์บอร์ดจำลองดู Key Matrix & ทดสอบความไวเมาส์ DPI",
    accentBg: "bg-emerald-200",
    steps: [
      {
        badge: "PART 01 • KEY MATRIX & SCAN CODE",
        title: "หลักการทำงานของแป้นพิมพ์: จากแผงวงจร Key Matrix สู่รหัส Scan Code",
        html: `
          <div class="space-y-3">
            <p class="text-xs sm:text-sm">
              ด้านใต้ปุ่มคีย์บอร์ดใช้ตารางเส้นลวดแนวนอน (Row) และแนวตั้ง (Column) วางตัดกันเรียกว่า <strong>Key Matrix</strong> โดยทำงานตามลำดับ 3 ขั้นตอนดังนี้:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">ขั้นตอนที่ 1</span>
                <h6 class="font-bold mt-1.5">กดปุ่มให้วงจรสัมผัสกัน</h6>
                <p class="text-xs text-zinc-700 mt-1">เมื่อกดปุ่มลงไป เส้น Row และ Column ณ พิกัดนั้นจะเชื่อมต่อกันจนกระแสไฟไหลผ่านได้</p>
              </div>
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">ขั้นตอนที่ 2</span>
                <h6 class="font-bold mt-1.5">สร้างรหัส Scan Code</h6>
                <p class="text-xs text-zinc-700 mt-1">ไมโครคอนโทรลเลอร์อ่านพิกัดแถว-คอลัมน์ แล้วแปลงเป็นรหัสตำแหน่งปุ่ม (Scan Code เช่น ปุ่ม A คือ <code>0x1E</code>)</p>
              </div>
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-sky-300 px-2 py-0.5 rounded border border-black">ขั้นตอนที่ 3</span>
                <h6 class="font-bold mt-1.5">แปลงเป็นตัวอักษรบนจอ</h6>
                <p class="text-xs text-zinc-700 mt-1">ระบบปฏิบัติการนำ Scan Code ไปเทียบกับภาษาที่เปิดอยู่ (เช่น อังกฤษ = A, ไทย = ฟ) แล้วแสดงผล</p>
              </div>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • STEP-BY-STEP CALCULATION",
        title: "วิธีคำนวณระยะเคลื่อนที่ของเมาส์จากค่า DPI และสแกนเนอร์ OCR",
        html: `
          <div class="space-y-4">
            <div class="calc-step-box bg-amber-50 rounded-2xl p-4 space-y-2.5">
              <span class="font-notch font-bold text-xs bg-amber-300 px-2.5 py-0.5 rounded border border-black">STEP-BY-STEP • การคำนวณระยะพิกเซลจากค่า DPI</span>
              <p class="text-xs sm:text-sm">
                <strong>โจทย์ตัวอย่าง:</strong> หากตั้งค่าความไวเมาส์ไว้ที่ <code>1,600 DPI (Dots Per Inch)</code> แล้วเลื่อนเมาส์บนแผ่นรองเมาส์ไปทางขวาเป็นระยะทาง <code>2.5 นิ้ว</code> ตัวชี้เมาส์บนหน้าจอจะเคลื่อนที่ไปกี่พิกเซล?
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div class="bg-white border-2 border-black rounded-xl p-3">
                  <strong>ขั้นที่ 1: ตั้งสูตรความสัมพันธ์</strong><br/>
                  <code>ระยะพิกเซลบนจอ = ค่า DPI × ระยะที่เลื่อนเมาส์ (นิ้ว)</code>
                </div>
                <div class="bg-white border-2 border-black rounded-xl p-3">
                  <strong>ขั้นที่ 2: แทนค่าตัวเลข</strong><br/>
                  <code>ระยะพิกเซล = 1,600 × 2.5</code>
                </div>
                <div class="bg-emerald-200 border-2 border-black rounded-xl p-3">
                  <strong>ขั้นที่ 3: ผลลัพธ์สุดท้าย</strong><br/>
                  ตัวชี้เมาส์จะวิ่งไป <strong><code>4,000 พิกเซล</code></strong>
                </div>
              </div>
            </div>

            <div class="calc-step-box rounded-2xl p-4">
              <h5 class="font-bold text-sm sm:text-base">สแกนเนอร์เอกสาร (Image Scanner) และซอฟต์แวร์ OCR</h5>
              <p class="text-xs sm:text-sm text-zinc-700 mt-1">
                สแกนเนอร์ทำหน้าที่กวาดแสงส่องเอกสารกระดาษแล้วแปลงเป็นไฟล์ภาพดิจิทัล หากต้องการนำภาพเอกสารที่สแกนมาไปแก้ไขข้อความต่อในโปรแกรม Word ต้องใช้ร่วมกับซอฟต์แวร์ <strong>OCR (Optical Character Recognition)</strong> เพื่อวิเคราะห์รูปทรงตัวอักษรจากภาพให้กลายเป็นข้อความ Text
              </p>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "เมื่อเรากดปุ่มหนึ่งปุ่มบนแป้นพิมพ์ วงจร Key Matrix จะส่งรหัสใดไปยังเครื่องคอมพิวเตอร์เป็นอันดับแรกเพื่อระบุว่าปุ่มตำแหน่งใดถูกกด?",
        options: ["Scan Code", "QR Code", "Source Code", "Zip Code"],
        answer: 0,
        explain: "ไมโครคอนโทรลเลอร์ในคีย์บอร์ดจะอ่านพิกัดจากแผงวงจร Key Matrix แล้วส่งรหัสตำแหน่งปุ่มที่เรียกว่า Scan Code ไปให้ระบบปฏิบัติการ"
      },
      {
        q: "ค่า DPI (Dots Per Inch) ของเมาส์คอมพิวเตอร์ บ่งบอกถึงคุณสมบัติใด?",
        options: [
          "น้ำหนักของตัวเมาส์ในหน่วยกรัม",
          "ความไวและความละเอียดในการตรวจจับการเคลื่อนที่ของเมาส์",
          "จำนวนปุ่มคลิกทั้งหมดที่มีบนตัวเมาส์",
          "อายุการใช้งานของแบตเตอรี่เมาส์ไร้สาย"
        ],
        answer: 1,
        explain: "ค่า DPI บอกจำนวนจุดที่ตัวชี้เมาส์จะเลื่อนไปบนหน้าจอเมื่อขยับเมาส์จริงเป็นระยะทาง 1 นิ้ว"
      },
      {
        q: "หากต้องการสแกนหนังสือเรียนที่เป็นกระดาษเข้าไปในคอมพิวเตอร์ แล้วแปลงให้เป็นข้อความที่พิมพ์แก้ไขต่อในโปรแกรม Word ได้ ต้องใช้สแกนเนอร์ร่วมกับเทคโนโลยีซอฟต์แวร์ใด?",
        options: [
          "OCR (Optical Character Recognition)",
          "RFID (Radio Frequency Identification)",
          "BIOS (Basic Input/Output System)",
          "DHCP (Dynamic Host Configuration Protocol)"
        ],
        answer: 0,
        explain: "ซอฟต์แวร์ OCR ทำหน้าที่วิเคราะห์รูปทรงตัวอักษรจากไฟล์ภาพที่สแกนมา แล้วแปลงให้เป็นข้อมูลข้อความ (Text)"
      }
    ]
  },

  {
    id: 4,
    moduleId: 1,
    moduleName: "หมวดที่ 1: พื้นฐานและอุปกรณ์นำเข้าทั่วไป",
    code: "UNIT 04",
    title: "กล้องดิจิทัล (Image Sensor CCD/CMOS) กับไมโครโฟน (Diaphragm & ADC)",
    summary: "เรียนรู้การเปลี่ยนแสงเป็นภาพพิกเซลผ่านเซนเซอร์ CCD/CMOS และขั้นตอนการแปลงคลื่นเสียง Analog เป็นดิจิทัลผ่านวงจร ADC",
    simType: "camera_mic_lab",
    simLabel: "LAB 04: ทดลองกดชัตเตอร์เซนเซอร์ CMOS & แปลงคลื่นเสียงผ่าน ADC",
    accentBg: "bg-emerald-200",
    steps: [
      {
        badge: "PART 01 • IMAGE SENSORS",
        title: "กล้องดิจิทัล และความแตกต่างระหว่างเซนเซอร์รับภาพ CCD กับ CMOS",
        html: `
          <div class="space-y-4">
            <p class="text-xs sm:text-sm">
              เมื่อแสงสะท้อนจากวัตถุผ่านเลนส์กล้องเข้ามา จะตกกระทบลงบนแผ่น <strong>Image Sensor (เซนเซอร์รับภาพ)</strong> เพื่อเปลี่ยนค่าแสงสีแดง-เขียว-น้ำเงิน (RGB) ของแต่ละจุดพิกเซลให้เป็นสัญญาณดิจิทัล โดยเซนเซอร์หลักมี 2 ชนิด:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box bg-emerald-50 rounded-xl p-4">
                <span class="font-notch font-bold text-xs bg-white px-2 py-0.5 rounded border border-black">1. CCD SENSOR</span>
                <h6 class="font-bold mt-2">CCD (Charge-Coupled Device)</h6>
                <p class="text-zinc-700 mt-1">ส่งประจุไฟฟ้าจากทุกพิกเซลไปแปลงที่มุมแผ่นจุดเดียว ให้คุณภาพภาพเนียน สัญญาณรบกวนต่ำ แต่<strong>กินไฟมากและต้นทุนการผลิตสูง</strong></p>
              </div>
              <div class="calc-step-box bg-amber-50 rounded-xl p-4">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">2. CMOS SENSOR</span>
                <h6 class="font-bold mt-2">CMOS (Complementary Metal-Oxide-Semiconductor)</h6>
                <p class="text-zinc-700 mt-1">แต่ละพิกเซลมีวงจรแปลงสัญญาณของตัวเอง <strong>ประหยัดไฟ อ่านภาพเร็วมาก ราคาประหยัด</strong> จึงนิยมใช้ในสมาร์ตโฟน กล้องยุคใหม่ และหัวอ่านบาร์โค้ด 2D</p>
              </div>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • AUDIO & ADC STEP-BY-STEP",
        title: "ขั้นตอนการแปลงเสียงพูดจากแผ่นสั่น Diaphragm สู่วงจร ADC",
        html: `
          <div class="space-y-3">
            <p class="text-xs sm:text-sm">
              เสียงพูดของมนุษย์เป็นคลื่นความดันอากาศแบบต่อเนื่อง (<strong>Analog</strong>) เมื่อพูดใส่ไมโครโฟน ระบบจะแปลงเป็นข้อมูลดิจิทัลตามลำดับ 3 ขั้นตอนดังนี้:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">STEP 1: DIAPHRAGM</span>
                <p class="font-bold mt-1.5">แผ่นไดอะแฟรมสั่นสะเทือน</p>
                <p class="text-xs text-zinc-700 mt-1">คลื่นเสียงในอากาศปะทะแผ่นบางๆ ที่เรียกว่า Diaphragm ในไมโครโฟนให้สั่นตามความถี่เสียง</p>
              </div>
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">STEP 2: ANALOG SIGNAL</span>
                <p class="font-bold mt-1.5">เกิดกระแสไฟฟ้า Analog</p>
                <p class="text-xs text-zinc-700 mt-1">การสั่นสะเทือนเหนี่ยวนำให้เกิดสัญญาณไฟฟ้าที่มีรูปคลื่นต่อเนื่องตามจังหวะเสียงพูด</p>
              </div>
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-sky-300 px-2 py-0.5 rounded border border-black">STEP 3: ADC CONVERSION</span>
                <p class="font-bold mt-1.5">แปลงเป็นเลขฐานสองผ่าน ADC</p>
                <p class="text-xs text-zinc-700 mt-1">วงจร <strong>ADC (Analog-to-Digital Converter)</strong> สุ่มวัดระดับคลื่นไฟฟ้าแล้วแปลงเป็นรหัส <code>0</code> และ <code>1</code></p>
              </div>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "เซนเซอร์รับภาพชนิดใดที่นิยมใช้ในกล้องสมาร์ตโฟนและเว็บแคมยุคปัจจุบันมากที่สุด เนื่องจากกินไฟน้อยและอ่านข้อมูลภาพได้รวดเร็ว?",
        options: [
          "CMOS (Complementary Metal-Oxide-Semiconductor)",
          "CRT (Cathode Ray Tube)",
          "HDD (Hard Disk Drive)",
          "LCD (Liquid Crystal Display)"
        ],
        answer: 0,
        explain: "เซนเซอร์ CMOS มีวงจรแปลงสัญญาณในแต่ละพิกเซล ทำให้ใช้พลังงานต่ำ ทำงานเร็ว และมีต้นทุนการผลิตที่คุ้มค่า"
      },
      {
        q: "ชิ้นส่วนใดภายในไมโครโฟนที่ทำหน้าที่รับแรงสั่นสะเทือนจากคลื่นเสียงในอากาศเป็นด่านแรก?",
        options: [
          "แผ่นไดอะแฟรม (Diaphragm)",
          "แผ่นฮีตซิงก์ระบายความร้อน (Heat Sink)",
          "เลนส์รวมแสง (Optical Lens)",
          "หัวอ่านเลเซอร์ (Laser Diode)"
        ],
        answer: 0,
        explain: "เมื่อมีคลื่นเสียงเดินทางมากระทบ แผ่นไดอะแฟรม (Diaphragm) ในไมโครโฟนจะสั่นสะเทือนตามความถี่และความดังของเสียง"
      },
      {
        q: "วงจร ADC (Analog-to-Digital Converter) ในระบบรับเสียงของคอมพิวเตอร์มีหน้าที่สำคัญอย่างไร?",
        options: [
          "ขยายเสียงจากลำโพงให้ดังขึ้น 2 เท่า",
          "แปลงสัญญาณคลื่นเสียงแบบต่อเนื่อง (Analog) ให้เป็นข้อมูลตัวเลขฐานสอง (Digital)",
          "ลบไฟล์เสียงที่ไม่ใช้ออกจากฮาร์ดดิสก์อัตโนมัติ",
          "เปลี่ยนข้อความภาษาไทยให้เป็นภาษาอังกฤษ"
        ],
        answer: 1,
        explain: "วงจร ADC ทำหน้าที่แปลงคลื่นไฟฟ้าแบบ Analog จากไมโครโฟนให้เป็นค่าตัวเลขดิจิทัล (0 และ 1) ที่คอมพิวเตอร์ประมวลผลได้"
      }
    ]
  },

  /* ==========================================================================
     หมวดที่ 2: เทคโนโลยีบาร์โค้ดและไร้สาย (หน่วยที่ 5 - 6)
     ========================================================================== */
  {
    id: 5,
    moduleId: 2,
    moduleName: "หมวดที่ 2: เทคโนโลยีบาร์โค้ดและไร้สาย",
    code: "UNIT 05",
    title: "อุปกรณ์อ่านบาร์โค้ด 1 มิติ (EAN-13): หัวอ่าน CCD Linear Imager vs Image-based (2D Area CMOS)",
    summary: "เข้าใจหลักการสะท้อนแสงของบาร์โค้ด EAN-13 (รหัสไทย 885) และความต่างระหว่างหัวอ่าน CCD Linear กับ 2D Area CMOS",
    simType: "barcode_scanner_lab",
    simLabel: "LAB 05: ทดลองยิงบาร์โค้ด EAN-13 ด้วยหัวอ่าน CCD เทียบกับ 2D Imager",
    accentBg: "bg-amber-200",
    steps: [
      {
        badge: "PART 01 • EAN-13 STRUCTURE",
        title: "หลักการสะท้อนแสงและโครงสร้างบาร์โค้ด 1 มิติ มาตรฐาน EAN-13",
        html: `
          <div class="space-y-4">
            <p class="text-xs sm:text-sm">
              บาร์โค้ด 1 มิติ (1D Barcode) เก็บรหัสข้อมูลตามแนวนอนด้วยความหนาของ<strong>เส้นทึบสีดำ (ดูดกลืนแสง)</strong> และ<strong>ช่องว่างสีขาว (สะท้อนแสงกลับเข้าหัวอ่าน)</strong> โดยมาตรฐานสินค้าอุปโภคบริโภคทั่วโลกคือ <strong>EAN-13 (13 หลัก)</strong>:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
              <div class="calc-step-box bg-amber-50 rounded-xl p-3">
                <span class="font-notch font-bold">หลักที่ 1 - 3</span>
                <p class="font-bold mt-1">Country Prefix</p>
                <p class="text-zinc-700 mt-0.5">รหัสประเทศที่จดทะเบียน เช่น <code>885</code> คือประเทศไทย</p>
              </div>
              <div class="calc-step-box bg-white rounded-xl p-3">
                <span class="font-notch font-bold">หลักที่ 4 - 7</span>
                <p class="font-bold mt-1">Manufacturer Code</p>
                <p class="text-zinc-700 mt-0.5">รหัสประจำโรงงานหรือบริษัทเจ้าของแบรนด์สินค้า</p>
              </div>
              <div class="calc-step-box bg-white rounded-xl p-3">
                <span class="font-notch font-bold">หลักที่ 8 - 12</span>
                <p class="font-bold mt-1">Product Item Code</p>
                <p class="text-zinc-700 mt-0.5">รหัสจำแนกรุ่น ขนาด สี หรือรสชาติของสินค้า</p>
              </div>
              <div class="calc-step-box bg-emerald-50 rounded-xl p-3">
                <span class="font-notch font-bold">หลักที่ 13</span>
                <p class="font-bold mt-1">Check Digit</p>
                <p class="text-zinc-700 mt-0.5">ตัวเลขตรวจสอบความถูกต้องของการอ่านรหัส</p>
              </div>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • CCD VS 2D IMAGER",
        title: "เปรียบเทียบหัวอ่าน 1D CCD Linear Imager กับ 2D Area CMOS Imager",
        html: `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="calc-step-box rounded-2xl p-4 space-y-2">
              <span class="font-notch font-bold text-xs bg-amber-300 px-2.5 py-0.5 rounded border border-black">1D CCD LINEAR IMAGER</span>
              <h5 class="font-bold text-base">หัวอ่านแบบแถวเดียว (CCD Linear Imager)</h5>
              <ul class="list-disc pl-5 text-xs sm:text-sm space-y-1 text-zinc-700">
                <li>ใช้แถวไฟ LED ส่องไปที่ป้ายกระดาษแล้วรับแสงด้วยเซนเซอร์เรียงแถวเดียว</li>
                <li>ทนทานและราคาประหยัด เหมาะกับบาร์โค้ดแท่ง 1 มิติบนกระดาษ</li>
                <li><strong>ข้อจำกัด:</strong> อ่าน QR Code (2 มิติ) ไม่ได้ และมักยิงบาร์โค้ดบนกระจกหน้าจอมือถือไม่ติด</li>
              </ul>
            </div>

            <div class="calc-step-box rounded-2xl p-4 space-y-2">
              <span class="font-notch font-bold text-xs bg-emerald-400 px-2.5 py-0.5 rounded border border-black">2D IMAGE-BASED (AREA CMOS)</span>
              <h5 class="font-bold text-base">หัวอ่านแบบถ่ายภาพ 2 มิติ (2D Area CMOS)</h5>
              <ul class="list-disc pl-5 text-xs sm:text-sm space-y-1 text-zinc-700">
                <li>ใช้เซนเซอร์กล้อง CMOS ถ่ายภาพบาร์โค้ดแล้วใช้ซอฟต์แวร์ถอดรหัสจากภาพ</li>
                <li><strong>จุดเด่น:</strong> อ่านได้ทั้งบาร์โค้ด 1 มิติ และ 2 มิติ (QR Code)</li>
                <li>สแกนได้ทุกองศา 360 องศา และ<strong>สแกนบาร์โค้ดหรือคูปองจากหน้าจอสมาร์ตโฟนได้ทันที</strong></li>
              </ul>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "หลักการทางแสงข้อใดที่ทำให้หัวอ่านบาร์โค้ดสามารถแยกแยะรหัสจากเส้นสีดำและช่องว่างสีขาวบนป้ายบาร์โค้ดได้?",
        options: [
          "เส้นสีดำสะท้อนแสงได้ดีกว่าช่องว่างสีขาว",
          "เส้นสีดำดูดกลืนแสง ส่วนช่องว่างสีขาวสะท้อนแสงกลับเข้าสู่เซนเซอร์รับแสง",
          "หมึกสีดำปล่อยคลื่นแม่เหล็กไฟฟ้าออกมาเองตลอดเวลา",
          "ช่องว่างสีขาวเปลี่ยนแสงสีแดงให้กลายเป็นคลื่นเสียง"
        ],
        answer: 1,
        explain: "พื้นที่สีขาวจะสะท้อนแสงกลับเข้าเซนเซอร์มาก ส่วนเส้นสีดำจะดูดกลืนแสงไว้ เซนเซอร์จึงแปลงความต่างของแสงเป็นสัญญาณดิจิทัลได้"
      },
      {
        q: "ข้อใดคือจุดเด่นสำคัญของเครื่องอ่านบาร์โค้ดแบบ Image-based (2D Area CMOS Imager) เมื่อเปรียบเทียบกับหัวอ่านแบบ 1D CCD รุ่นเดิม?",
        options: [
          "อ่านได้เฉพาะบาร์โค้ดที่พิมพ์ลงบนกระดาษขาวเท่านั้น",
          "อ่านได้ทั้งบาร์โค้ด 1 มิติ และ QR Code (2 มิติ) รวมถึงสแกนจากหน้าจอสมาร์ตโฟนได้ทุกทิศทาง",
          "ต้องวางปืนสแกนให้แนบสนิทติดกับกระดาษห้ามห่างเกิน 1 มิลลิเมตร",
          "ไม่ต้องใช้พลังงานไฟฟ้าในการทำงาน"
        ],
        answer: 1,
        explain: "หัวอ่าน 2D Area CMOS Imager ใช้การถ่ายภาพดิจิทัลแล้ววิเคราะห์ภาพ จึงอ่านได้ทั้ง 1D/2D และอ่านจากหน้าจอมือถือได้ดีเยี่ยม"
      },
      {
        q: "เมื่อสังเกตบาร์โค้ดมาตรฐาน EAN-13 บนซองขนมพบว่าขึ้นต้นด้วยตัวเลข '885' ตัวเลข 3 หลักแรกนี้สื่อถึงข้อมูลใด?",
        options: [
          "ราคาขายปลีกแนะนำ 885 บาท",
          "รหัสประจำประเทศผู้ผลิตหรือจดทะเบียนสินค้า (ประเทศไทย)",
          "วันหมดอายุของสินค้า",
          "จำนวนชิ้นสินค้าที่มีในกล่อง"
        ],
        answer: 1,
        explain: "ตัวเลข 3 หลักแรกของ EAN-13 คือ GS1 Country Prefix ซึ่งรหัส 885 เป็นรหัสมาตรฐานของสินค้าที่จดทะเบียนในประเทศไทย"
      }
    ]
  },

  {
    id: 6,
    moduleId: 2,
    moduleName: "หมวดที่ 2: เทคโนโลยีบาร์โค้ดและไร้สาย",
    code: "UNIT 06",
    title: "เครื่องอ่านบาร์โค้ดไร้สาย (2.4GHz / Bluetooth, Instant vs Batch) กับแบบฝังตัว (Fixed Scanner)",
    summary: "การเลือกใช้ปืนสแกนไร้สาย 2.4GHz vs Bluetooth โหมดส่งทันที (Instant) เทียบกับโหมดเก็บเข้าเมมโมรี่ (Batch) และเครื่องสแกนฝังโต๊ะ",
    simType: "wireless_fixed_scanner_lab",
    simLabel: "LAB 06: ทดลองสแกนสะสมในโหมด Batch Inventory แล้วอัปโหลดเข้าคอมพิวเตอร์",
    accentBg: "bg-amber-200",
    steps: [
      {
        badge: "PART 01 • WIRELESS CONNECTION",
        title: "การเชื่อมต่อไร้สาย 2.4GHz vs Bluetooth และเครื่องสแกนแบบฝังตัว (Fixed Scanner)",
        html: `
          <div class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box rounded-xl p-4">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">2.4GHz USB DONGLE</span>
                <h6 class="font-bold mt-2">คลื่นความถี่ 2.4GHz (ใช้หัวรับสัญญาณ USB)</h6>
                <p class="text-zinc-700 mt-1">เสียบตัวรับสัญญาณ USB เข้ากับคอมพิวเตอร์ตั้งโต๊ะแล้วใช้งานได้ทันที ส่งสัญญาณได้ไกล (30-100 เมตรในที่โล่ง)</p>
              </div>
              <div class="calc-step-box rounded-xl p-4">
                <span class="font-notch font-bold text-xs bg-sky-300 px-2 py-0.5 rounded border border-black">BLUETOOTH PAIRING</span>
                <h6 class="font-bold mt-2">ระบบ Bluetooth (เชื่อมต่อมือถือ/แท็บเล็ต)</h6>
                <p class="text-zinc-700 mt-1">จับคู่กับสมาร์ตโฟน แท็บเล็ต iPad หรือโน้ตบุ๊กได้โดยตรงโดยไม่ต้องใช้พอร์ต USB ระยะทำการประมาณ 10-30 เมตร</p>
              </div>
            </div>

            <div class="calc-step-box bg-emerald-50 rounded-2xl p-4">
              <h6 class="font-bold text-sm sm:text-base">เครื่องสแกนแบบฝังตัว / ตั้งโต๊ะ (Fixed-Mount / Presentation Scanner)</h6>
              <p class="text-xs sm:text-sm text-zinc-700 mt-1">
                ติดตั้งอยู่กับที่ เช่น ฝังบนเคาน์เตอร์แคชเชียร์ซูเปอร์มาร์เก็ตหรือติดริมสายพานโรงงาน จุดเด่นคือ <strong>ปล่อยมือทั้งสองข้างให้ว่าง (Hands-free)</strong> พนักงานหยิบสินค้าปาดผ่านหน้ากระจกสแกนได้รวดเร็วต่อเนื่อง
              </p>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • INSTANT VS BATCH MODE",
        title: "โหมดการทำงานของปืนสแกนไร้สาย: Instant Mode เทียบกับ Batch Inventory Mode",
        html: `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="calc-step-box rounded-2xl p-4 space-y-2">
              <span class="font-notch font-bold text-xs bg-emerald-300 px-2.5 py-0.5 rounded border border-black">MODE 01 • INSTANT MODE</span>
              <h5 class="font-bold text-base">โหมดส่งข้อมูลทันที (Real-time / Instant Mode)</h5>
              <p class="text-xs sm:text-sm text-zinc-700">
                เมื่อกดยิงบาร์โค้ดปุ๊บ รหัสจะถูกส่งผ่านคลื่นไร้สายเข้าสู่หน้าจอคอมพิวเตอร์ในวินาทีนั้นทันที เหมาะกับการทำงานในระยะที่สัญญาณไร้สายไปถึง
              </p>
            </div>

            <div class="calc-step-box rounded-2xl p-4 space-y-2">
              <span class="font-notch font-bold text-xs bg-amber-300 px-2.5 py-0.5 rounded border border-black">MODE 02 • BATCH INVENTORY MODE</span>
              <h5 class="font-bold text-base">โหมดเก็บสะสมในหน่วยความจำ (Batch Mode)</h5>
              <p class="text-xs sm:text-sm text-zinc-700">
                เมื่อต้องเดินไปเช็กสต๊อกท้ายโกดังหรือชั้นใต้ดินที่<strong>อยู่นอกระยะสัญญาณไร้สาย</strong> ปืนสแกนจะบันทึกรหัสบาร์โค้ดนับพันรายการเก็บไว้ในหน่วยความจำในตัวปืนก่อน แล้วค่อยกดอัปโหลดเข้าคอมพิวเตอร์รวดเดียวเมื่อเดินกลับมาที่โต๊ะ
              </p>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "พนักงานคลังสินค้าต้องเดินไปนับสต๊อกในห้องเก็บของชั้นใต้ดินซึ่งสัญญาณไร้สายไปไม่ถึง ควรตั้งค่าปืนสแกนบาร์โค้ดไร้สายให้อยู่ในโหมดใด?",
        options: [
          "Instant Mode (ส่งข้อมูลทันทีเท่านั้น)",
          "Batch / Inventory Mode (บันทึกรหัสไว้ในหน่วยความจำเครื่องก่อนแล้วค่อยซิงก์ภายหลัง)",
          "Sleep Mode (โหมดประหยัดพลังงานปิดการทำงาน)",
          "Audio Mute Mode (โหมดปิดเสียง)"
        ],
        answer: 1,
        explain: "โหมด Batch หรือ Inventory จะเก็บรหัสบาร์โค้ดที่ยิงทั้งหมดไว้ในหน่วยความจำภายในตัวปืนสแกน แล้วค่อยส่งข้อมูลเข้าคอมพิวเตอร์เมื่อกลับมาอยู่ในระยะสัญญาณ"
      },
      {
        q: "หากต้องการนำเครื่องสแกนบาร์โค้ดไร้สายไปเชื่อมต่อกับแท็บเล็ต iPad หรือสมาร์ตโฟน Android ที่ไม่มีช่องเสียบ USB ขนาดปกติ ควรเลือกการเชื่อมต่อแบบใดสะดวกที่สุด?",
        options: [
          "เชื่อมต่อไร้สายผ่านระบบ Bluetooth",
          "เชื่อมต่อผ่านพอร์ตขนาน (Parallel Port รุ่นเก่า)",
          "เชื่อมต่อผ่านสาย VGA",
          "เชื่อมต่อผ่านสายไฟบ้าน 220V"
        ],
        answer: 0,
        explain: "สมาร์ตโฟนและแท็บเล็ตมีตัวรับสัญญาณ Bluetooth ในตัวอยู่แล้ว จึงจับคู่กับปืนสแกน Bluetooth ได้ทันทีโดยไม่ต้องใช้พอร์ต USB"
      },
      {
        q: "เหตุใดจุดชำระเงินในห้างสรรพสินค้าขนาดใหญ่จึงนิยมใช้เครื่องสแกนบาร์โค้ดแบบฝังโต๊ะ (Fixed / Presentation Scanner) มากกว่าปืนสแกนแบบถือยิง?",
        options: [
          "เพราะเครื่องแบบฝังโต๊ะสามารถพิมพ์ใบเสร็จออกมาจากกระจกสแกนได้เอง",
          "ช่วยให้แคชเชียร์ใช้สองมือหยิบสินค้าผ่านหน้าเครื่องได้ต่อเนื่องรวดเร็ว (Hands-free) ไม่ต้องคอยยกปืนขึ้นมากด",
          "เพราะเครื่องแบบฝังโต๊ะอ่านได้เฉพาะสินค้าราคาแพงเท่านั้น",
          "เพราะไม่ต้องเชื่อมต่อกับคอมพิวเตอร์แคชเชียร์"
        ],
        answer: 1,
        explain: "เครื่องสแกนแบบฝังโต๊ะเปิดลำแสงสแกนหลายทิศทางตลอดเวลา ช่วยให้พนักงานใช้สองมือหยิบและบรรจุสินค้าลงถุงได้เร็วขึ้นมาก"
      }
    ]
  },

  /* ==========================================================================
     หมวดที่ 3: รหัสภาพ QR Code และความปลอดภัย (หน่วยที่ 7 - 10)
     ========================================================================== */
  {
    id: 7,
    moduleId: 3,
    moduleName: "หมวดที่ 3: รหัสภาพ QR Code และความปลอดภัย",
    code: "UNIT 07",
    title: "QR Code ตอนที่ 1: โครงสร้าง Finder Pattern 3 มุม และระดับกู้ข้อมูล Reed-Solomon",
    summary: "ผ่าโครงสร้าง QR Code ทั้ง Finder Pattern 3 มุม และวิธีคำนวณขีดจำกัดการกู้คืนข้อมูลด้วย Reed-Solomon ทั้ง 4 ระดับ (L, M, Q, H)",
    simType: "qr_damage_reed_solomon_lab",
    simLabel: "LAB 07: ทดลองทำรอยเปื้อนบน QR Code แล้วทดสอบกู้ข้อมูล Reed-Solomon",
    accentBg: "bg-sky-200",
    steps: [
      {
        badge: "PART 01 • QR ANATOMY",
        title: "โครงสร้างสำคัญของ QR Code ทำไมสแกนตีลังกา 360 องศาก็อ่านออก",
        html: `
          <div class="space-y-3">
            <p class="text-xs sm:text-sm">
              QR Code (Quick Response Code) เป็นบาร์โค้ด 2 มิติที่เก็บข้อมูลทั้งแนวนอนและแนวตั้ง โดยมีองค์ประกอบหลัก 4 ส่วนที่ช่วยให้กล้องสแกนได้รวดเร็ว:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-sky-300 px-2 py-0.5 rounded border border-black">1. FINDER PATTERN</span>
                <p class="font-bold mt-1.5">กรอบสี่เหลี่ยมใหญ่ 3 มุม</p>
                <p class="text-zinc-700 mt-0.5">อยู่มุมบนซ้าย บนขวา และล่างซ้าย ช่วยให้กล้องรู้ขอบเขตและทิศทางด้านบนของ QR Code ทันทีแม้สแกนเอียงหรือกลับหัว</p>
              </div>
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">2. ALIGNMENT PATTERN</span>
                <p class="font-bold mt-1.5">กรอบสี่เหลี่ยมเล็กปรับสมดุล</p>
                <p class="text-zinc-700 mt-0.5">อยู่มุมล่างขวา ช่วยชดเชยความบิดเบี้ยวของภาพเมื่อป้าย QR Code ถูกแปะอยู่บนพื้นผิวโค้ง เช่น ข้างขวดน้ำ</p>
              </div>
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">3. TIMING PATTERN</span>
                <p class="font-bold mt-1.5">เส้นประจุดดำ-ขาวสลับกัน</p>
                <p class="text-zinc-700 mt-0.5">ช่วยบอกขนาดพิกัดแถวและคอลัมน์ของตารางโมดูลข้อมูล</p>
              </div>
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-pink-200 px-2 py-0.5 rounded border border-black">4. QUIET ZONE</span>
                <p class="font-bold mt-1.5">ขอบพื้นที่ว่างสีขาวรอบนอก</p>
                <p class="text-zinc-700 mt-0.5">กันไม่ให้ตัวหนังสือหรือลวดลายรอบข้างมารบกวนการตรวจจับขอบเขตของกล้อง</p>
              </div>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • STEP-BY-STEP REED-SOLOMON",
        title: "ระดับการกู้คืนข้อมูล Reed-Solomon (L, M, Q, H) และวิธีคำนวณความเสียหายที่รับได้",
        html: `
          <div class="space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
              <div class="calc-step-box bg-emerald-50 rounded-xl p-3">
                <strong class="font-notch text-base">Level L</strong><br/>กู้ข้อมูลได้สูงสุด <strong>7%</strong>
              </div>
              <div class="calc-step-box bg-sky-50 rounded-xl p-3">
                <strong class="font-notch text-base">Level M</strong><br/>กู้ข้อมูลได้สูงสุด <strong>15%</strong>
              </div>
              <div class="calc-step-box bg-amber-50 rounded-xl p-3">
                <strong class="font-notch text-base">Level Q</strong><br/>กู้ข้อมูลได้สูงสุด <strong>25%</strong>
              </div>
              <div class="calc-step-box bg-pink-50 rounded-xl p-3">
                <strong class="font-notch text-base">Level H</strong><br/>กู้ข้อมูลได้สูงสุด <strong>30%</strong>
              </div>
            </div>

            <div class="calc-step-box bg-amber-50 rounded-2xl p-4 space-y-2">
              <span class="font-notch font-bold text-xs bg-amber-300 px-2.5 py-0.5 rounded border border-black">STEP-BY-STEP • การคำนวณจำนวนจุดโมดูลที่เสียหายได้สูงสุด</span>
              <p class="text-xs sm:text-sm">
                <strong>โจทย์ตัวอย่าง:</strong> หากตาราง QR Code มีจุดข้อมูลทั้งหมด <code>400 โมดูล</code> และต้องการนำโลโก้ร้านขนาด <code>100 โมดูล</code> ไปแปะทับตรงกลาง ต้องเลือกตั้งค่า Error Correction ระดับใดจึงจะยังสแกนติด?
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div class="bg-white border-2 border-black rounded-xl p-2.5">
                  <strong>ขั้นที่ 1: คำนวณเปอร์เซ็นต์ที่ถูกบัง</strong><br/>
                  <code>(100 ÷ 400) × 100 = 25%</code>
                </div>
                <div class="bg-white border-2 border-black rounded-xl p-2.5">
                  <strong>ขั้นที่ 2: เทียบตาราง Reed-Solomon</strong><br/>
                  Level L (7%) และ M (15%) ไม่พอ ต้องใช้ระดับที่รองรับได้ตั้งแต่ 25% ขึ้นไป
                </div>
                <div class="bg-emerald-200 border-2 border-black rounded-xl p-2.5">
                  <strong>ขั้นที่ 3: สรุปการเลือกใช้งาน</strong><br/>
                  เลือก <strong>Level Q (25%)</strong> หรือ <strong>Level H (30%)</strong> เพื่อความชัวร์สูงสุด
                </div>
              </div>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "กรอบสี่เหลี่ยมขนาดใหญ่ที่ปรากฏอยู่มุมทั้ง 3 ด้านของ QR Code (ยกเว้นมุมล่างขวา) มีชื่อเรียกว่าอะไร และมีหน้าที่ใด?",
        options: [
          "Finder Pattern ทำหน้าที่ช่วยให้หัวอ่านตรวจจับตำแหน่งและทิศทางของ QR Code ได้อย่างรวดเร็วแม้สแกนแบบเอียงหรือกลับหัว",
          "Price Pattern ทำหน้าที่แสดงราคาสินค้าเป็นตัวเลข",
          "Battery Indicator ทำหน้าที่บอกระดับพลังงานของป้าย",
          "Color Calibration ทำหน้าที่ปรับแสงสีของหน้าจอมือถือ"
        ],
        answer: 0,
        explain: "Finder Pattern ทั้ง 3 มุมช่วยให้ซอฟต์แวร์สแกนรู้ทันทีว่ามุมไหนคือด้านบนและขอบเขตอยู่ตรงไหน"
      },
      {
        q: "หากต้องการออกแบบ QR Code โดยนำโลโก้ของวิทยาลัยไปวางทับตรงกึ่งกลางภาพ ควรตั้งค่า Error Correction ด้วยอัลกอริทึม Reed-Solomon ที่ระดับใดจึงจะสแกนติดได้ชัวร์ที่สุด?",
        options: [
          "ระดับ L (กู้ข้อมูลได้ประมาณ 7%)",
          "ระดับ M (กู้ข้อมูลได้ประมาณ 15%)",
          "ระดับ Q (กู้ข้อมูลได้ประมาณ 25%)",
          "ระดับ H (กู้ข้อมูลได้สูงสุดประมาณ 30%)"
        ],
        answer: 3,
        explain: "การวางโลโก้ทับตรงกลางจะบดบังจุดข้อมูลบางส่วน จึงควรใช้ระดับ H (High - กู้คืนได้ถึง 30%)"
      },
      {
        q: "ข้อใดกล่าวถูกต้องเกี่ยวกับผลกระทบของการตั้งค่า Error Correction ของ QR Code ในระดับสูงสุด (Level H)?",
        options: [
          "ทำให้ตารางจุดสี่เหลี่ยมมีความหนาแน่นและซับซ้อนมากขึ้น เพราะต้องเพิ่มพื้นที่เก็บข้อมูลสำรอง",
          "ทำให้จุดในตารางลดลงจนเหลือแค่สี่เหลี่ยมมุมเดียว",
          "ทำให้ QR Code เปลี่ยนสีได้เองตามอุณหภูมิห้อง",
          "ทำให้สแกนผ่านกล้องสมาร์ตโฟนไม่ได้"
        ],
        answer: 0,
        explain: "เมื่อตั้งค่าระดับการกู้คืนข้อมูลสูงขึ้น (Level H) ระบบต้องสร้างรหัสสำรองเพิ่มขึ้น ทำให้ตารางจุดมีความละเอียดและแน่นขึ้น"
      }
    ]
  },

  {
    id: 8,
    moduleId: 3,
    moduleName: "หมวดที่ 3: รหัสภาพ QR Code และความปลอดภัย",
    code: "UNIT 08",
    title: "QR Code ตอนที่ 2: ครอบครัว QR (Model 2, Micro QR, rMQR, SQRC) และ Static vs Dynamic QR",
    summary: "รู้จักตระกูล QR ทั้ง 4 แบบสำหรับงานเฉพาะทาง และเปรียบเทียบการทำงานของ Static QR เทียบกับ Dynamic QR",
    simType: "qr_family_static_dynamic_lab",
    simLabel: "LAB 08: สำรวจตระกูล QR Code ทั้ง 4 แบบ & ทดลองเปลี่ยนลิงก์ Dynamic QR",
    accentBg: "bg-sky-200",
    steps: [
      {
        badge: "PART 01 • QR CODE FAMILY",
        title: "ครอบครัวตระกูล QR Code ทั้ง 4 รูปแบบในงานอุตสาหกรรม",
        html: `
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div class="calc-step-box rounded-xl p-4">
              <span class="font-notch font-bold text-xs bg-sky-300 px-2 py-0.5 rounded border border-black">1. QR CODE MODEL 2</span>
              <h6 class="font-bold mt-2">รุ่นมาตรฐานสากลทั่วไป</h6>
              <p class="text-zinc-700 mt-1">มี Finder Pattern 3 มุม และมี Alignment Pattern ช่วยให้อ่านบนพื้นผิวโค้งได้ดี ใช้ในงานจ่ายเงินและเว็บไซต์ทั่วไป</p>
            </div>
            <div class="calc-step-box rounded-xl p-4">
              <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">2. MICRO QR CODE</span>
              <h6 class="font-bold mt-2">รุ่นจิ๋วประหยัดพื้นที่ (มี Finder แค่ 1 มุม)</h6>
              <p class="text-zinc-700 mt-1">ลดกรอบสี่เหลี่ยมระบุตำแหน่งเหลือเพียง <strong>1 มุมเท่านั้น</strong> เพื่อพิมพ์ลงบนชิปไอซีหรือแผงวงจรอิเล็กทรอนิกส์ขนาดเล็ก</p>
            </div>
            <div class="calc-step-box rounded-xl p-4">
              <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">3. rMQR CODE</span>
              <h6 class="font-bold mt-2">Rectangular Micro QR (ทรงสี่เหลี่ยมผืนผ้า)</h6>
              <p class="text-zinc-700 mt-1">ออกแบบเป็นแถบแนวยาวสำหรับพิมพ์ลงพื้นที่แคบยาว เช่น ขอบหลอดเก็บตัวอย่างเลือดในโรงพยาบาล หรือสันชิ้นงานบางๆ</p>
            </div>
            <div class="calc-step-box rounded-xl p-4">
              <span class="font-notch font-bold text-xs bg-pink-300 px-2 py-0.5 rounded border border-black">4. SQRC (SECURE QR)</span>
              <h6 class="font-bold mt-2">QR Code เข้ารหัสลับเฉพาะองค์กร</h6>
              <p class="text-zinc-700 mt-1">หน้าตาเหมือน QR ปกติ แต่ซ่อนข้อมูลลับที่ต้องใช้เครื่องสแกนที่มีกุญแจถอดรหัสตรงกันเท่านั้นจึงจะเปิดอ่านข้อมูลภายในได้</p>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • STATIC VS DYNAMIC QR",
        title: "เปรียบเทียบ Static QR Code (คงที่) กับ Dynamic QR Code (ปรับเปลี่ยนลิงก์ได้)",
        html: `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="calc-step-box bg-amber-50 rounded-2xl p-4 space-y-2">
              <span class="font-notch font-bold text-xs bg-amber-300 px-2.5 py-0.5 rounded border border-black">STATIC QR CODE</span>
              <h5 class="font-bold text-base">แบบคงที่ (แก้ไขปลายทางไม่ได้)</h5>
              <p class="text-xs sm:text-sm text-zinc-700">
                ฝังข้อความหรือ URL จริงลงในตารางจุดโดยตรง เมื่อพิมพ์สติกเกอร์ออกไปแล้ว<strong>ไม่สามารถเปลี่ยนลิงก์ปลายทางได้อีก</strong> แต่มีข้อดีคือสแกนใช้งานได้ถาวรโดยไม่ต้องพึ่งเซิร์ฟเวอร์ตัวกลาง
              </p>
            </div>
            <div class="calc-step-box bg-emerald-50 rounded-2xl p-4 space-y-2">
              <span class="font-notch font-bold text-xs bg-emerald-400 px-2.5 py-0.5 rounded border border-black">DYNAMIC QR CODE</span>
              <h5 class="font-bold text-base">แบบไดนามิก (แก้ไขลิงก์ปลายทางทีหลังได้)</h5>
              <p class="text-xs sm:text-sm text-zinc-700">
                ตัวป้าย QR จะเก็บเฉพาะ <strong>Short URL ตัวกลาง</strong> เวลาคนสแกนจะวิ่งไปที่เซิร์ฟเวอร์ตัวกลางก่อนส่งต่อไปเว็บจริง ทำให้<strong>เจ้าของสามารถเปลี่ยนลิงก์ปลายทางในระบบหลังบ้านได้ตลอดโดยไม่ต้องพิมพ์ป้าย QR ใหม่</strong>
              </p>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "โรงงานผลิตชิ้นส่วนคอมพิวเตอร์ต้องการพิมพ์รหัสลงบนชิปไอซีที่มีพื้นที่เล็กมาก จึงเลือกใช้ 'Micro QR Code' จุดสังเกตเด่นที่สุดของ Micro QR Code คือข้อใด?",
        options: [
          "มีกรอบสี่เหลี่ยมใหญ่ระบุตำแหน่ง (Finder Pattern) เพียง 1 มุมเท่านั้น เพื่อประหยัดพื้นที่",
          "มีกรอบสี่เหลี่ยมใหญ่ครบทั้ง 4 มุม",
          "เป็นรูปวงกลมเหมือนเหรียญบาท",
          "ต้องมีความกว้างอย่างน้อย 20 เซนติเมตรขึ้นไป"
        ],
        answer: 0,
        explain: "Micro QR Code ลดจำนวน Finder Pattern จาก 3 มุมเหลือเพียง 1 มุม เพื่อให้ใช้พื้นที่ในการพิมพ์น้อยที่สุด"
      },
      {
        q: "หากต้องการพิมพ์รหัส 2 มิติลงบน 'หลอดเก็บตัวอย่างเลือดในโรงพยาบาล' ที่มีพื้นที่แคบและยาวมาก ควรเลือกใช้ QR Code ตระกูลใดจึงจะเหมาะสมที่สุด?",
        options: [
          "rMQR (Rectangular Micro QR Code ทรงสี่เหลี่ยมผืนผ้าแนวยาว)",
          "บาร์โค้ดกล่องลังขนาดใหญ่ ITF-14",
          "QR Code Model 1 รุ่นดั้งเดิมขนาดใหญ่",
          "แผ่นดิสก์แม่เหล็ก Floppy Disk"
        ],
        answer: 0,
        explain: "rMQR ออกแบบให้มีรูปทรงสี่เหลี่ยมผืนผ้าแนวยาว จึงพิมพ์ลงบนขอบแคบๆ ได้พอดี"
      },
      {
        q: "ร้านอาหารพิมพ์ป้าย QR Code เมนูอาหารติดไว้ที่โต๊ะทุกตัว ต่อมาอยากเปลี่ยนลิงก์ไปยังเว็บเมนูโปรโมชั่นเดือนใหม่โดย 'ไม่ต้องแกะสติกเกอร์ QR เดิมออกแล้วพิมพ์ใหม่' ร้านอาหารต้องใช้ QR Code รูปแบบใดตั้งแต่แรก?",
        options: [
          "Static QR Code",
          "Dynamic QR Code",
          "Paper Barcode 1D",
          "Offline Text QR"
        ],
        answer: 1,
        explain: "Dynamic QR Code เก็บลิงก์ตัวกลางไว้ในป้าย ทำให้ผู้ดูแลสามารถเปลี่ยนลิงก์ปลายทางในระบบหลังบ้านได้ตลอดเวลาโดยไม่ต้องพิมพ์ป้ายใหม่"
      }
    ]
  },

  {
    id: 9,
    moduleId: 3,
    moduleName: "หมวดที่ 3: รหัสภาพ QR Code และความปลอดภัย",
    code: "UNIT 09",
    title: "ความปลอดภัยในการนำเข้าข้อมูล: ภัย Quishing, กฎหมาย PDPA, Data Validation และ Check Digit (EAN-13)",
    summary: "ป้องกันภัยสติกเกอร์ QR ปลอม (Quishing), กฎหมาย PDPA และวิธีคำนวณเลขตรวจสอบ Check Digit ของ EAN-13 แบบ Step-by-Step",
    simType: "ean13_check_digit_calc",
    simLabel: "LAB 09: เครื่องคิดเลขคำนวณ Check Digit (EAN-13) แสดงวิธีทำทีละขั้น",
    accentBg: "bg-sky-200",
    steps: [
      {
        badge: "PART 01 • QUISHING, PDPA & VALIDATION",
        title: "ภัยคุกคาม Quishing, กฎหมาย PDPA และการตรวจสอบข้อมูล (Data Validation)",
        html: `
          <div class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box bg-red-50 rounded-xl p-4">
                <span class="font-notch font-bold text-xs bg-red-300 px-2 py-0.5 rounded border border-black">QUISHING ATTACK</span>
                <h6 class="font-bold mt-1.5">ภัยมืดจากสติกเกอร์ QR Code ปลอม</h6>
                <p class="text-zinc-700 mt-1">มาจากคำว่า <strong>QR Code + Phishing</strong> มิจฉาชีพนำสติกเกอร์ QR ปลอมไปแปะทับป้ายร้านค้า เพื่อหลอกให้เหยื่อสแกนเข้าเว็บปลอมขโมยรหัสผ่าน ก่อนกดตกลงจึงต้องสังเกตชื่อโดเมน URL เสมอ</p>
              </div>
              <div class="calc-step-box bg-amber-50 rounded-xl p-4">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">PDPA COMPLIANCE</span>
                <h6 class="font-bold mt-1.5">พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)</h6>
                <p class="text-zinc-700 mt-1">การรับข้อมูลส่วนบุคคล (เช่น ชื่อ เบอร์โทร อีเมล ลายนิ้วมือ) ต้องแจ้งวัตถุประสงค์ให้ชัดเจน ขอความยินยอม (Consent) เก็บเท่าที่จำเป็น และดูแลไม่ให้ข้อมูลรั่วไหล</p>
              </div>
            </div>

            <div class="calc-step-box rounded-xl p-3.5 text-xs sm:text-sm">
              <h6 class="font-bold">การตรวจสอบความถูกต้องของข้อมูลขาเข้า (Data Validation 4 รูปแบบ)</h6>
              <p class="text-zinc-700 mt-1">
                1. <strong>Presence Check:</strong> ห้ามเว้นว่างในช่องสำคัญ | 2. <strong>Format Check:</strong> ตรวจรูปแบบ เช่น อีเมลต้องมี <code>@</code> | 3. <strong>Range Check:</strong> ตรวจช่วงตัวเลข เช่น คะแนนต้องอยู่ระหว่าง <code>0 - 100</code> | 4. <strong>Length Check:</strong> ตรวจจำนวนหลัก เช่น เลขบัตรประชาชนต้องครบ <code>13</code> หลัก
              </p>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • STEP-BY-STEP CHECK DIGIT",
        title: "วิธีคำนวณหาเลขตรวจสอบ Check Digit (หลักที่ 13 ของบาร์โค้ด EAN-13) แบบ Step-by-Step",
        html: `
          <div class="space-y-3">
            <p class="text-xs sm:text-sm">
              <strong>โจทย์ตัวอย่าง:</strong> จงคำนวณหาเลขตรวจสอบหลักที่ 13 ของรหัสบาร์โค้ด 12 หลักแรกต่อไปนี้: <code>8 8 5 0 1 2 3 4 5 6 7 8</code>
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box bg-emerald-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">STEP 1: หลักคี่คูณ 1</span>
                <p class="mt-1.5">นำตัวเลขในตำแหน่งที่ 1, 3, 5, 7, 9, 11 มาคูณด้วย <code>1</code> แล้วบวกกัน:</p>
                <code class="block mt-1 bg-white p-1.5 rounded border border-black font-bold">(8 + 5 + 1 + 3 + 5 + 7) × 1 = 29</code>
              </div>

              <div class="calc-step-box bg-amber-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">STEP 2: หลักคู่คูณ 3</span>
                <p class="mt-1.5">นำตัวเลขในตำแหน่งที่ 2, 4, 6, 8, 10, 12 มาคูณด้วย <code>3</code> แล้วบวกกัน:</p>
                <code class="block mt-1 bg-white p-1.5 rounded border border-black font-bold">(8 + 0 + 2 + 4 + 6 + 8) × 3 = 28 × 3 = 84</code>
              </div>

              <div class="calc-step-box bg-sky-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-sky-300 px-2 py-0.5 rounded border border-black">STEP 3: รวมผลลัพธ์ทั้งหมด (Sum)</span>
                <p class="mt-1.5">นำผลลัพธ์จากขั้นที่ 1 และขั้นที่ 2 มาบวกเข้าด้วยกัน:</p>
                <code class="block mt-1 bg-white p-1.5 rounded border border-black font-bold">Sum = 29 + 84 = 113</code>
              </div>

              <div class="calc-step-box bg-pink-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-pink-300 px-2 py-0.5 rounded border border-black">STEP 4: เทียบจำนวนเต็มสิบถัดไป</span>
                <p class="mt-1.5">ดูว่า <code>113</code> ขาดอีกเท่าไหร่จะครบจำนวนเต็มสิบถัดไป (<code>120</code>):</p>
                <code class="block mt-1 bg-white p-1.5 rounded border border-black font-bold">120 - 113 = 7 (Check Digit คือเลข 7)</code>
              </div>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "มิจฉาชีพแอบนำสติกเกอร์ QR Code ที่สร้างเองไปแปะทับป้าย QR รับบริจาคของโรงพยาบาล เพื่อหลอกให้ผู้สแกนเข้าสู่หน้าเว็บไซต์ปลอมแล้วกรอกข้อมูลบัตรเครดิต ภัยคุกคามนี้เรียกว่าอะไร?",
        options: [
          "Quishing (QR Code Phishing)",
          "Defragmentation",
          "Data Compression",
          "Overclocking"
        ],
        answer: 0,
        explain: "Quishing มาจากคำว่า QR Code ผสมกับ Phishing คือการใช้ QR Code เป็นเหยื่อล่อพาผู้ใช้งานไปยังเว็บไซต์ปลอม"
      },
      {
        q: "ในการคำนวณเลขตรวจสอบ (Check Digit หลักที่ 13) ของบาร์โค้ดมาตรฐาน EAN-13 หากนำตัวเลข 12 หลักแรกมาคูณค่าถ่วงน้ำหนัก (คูณ 1 และคูณ 3 สลับกัน) แล้วได้ผลรวมเท่ากับ '126' เลข Check Digit หลักที่ 13 จะมีค่าเท่าใด?",
        options: ["เลข 0", "เลข 4", "เลข 6", "เลข 9"],
        answer: 1,
        explain: "ผลรวมคือ 126 จำนวนเต็มสิบถัดไปคือ 130 ดังนั้น 130 - 126 = 4 (เลข Check Digit หลักที่ 13 คือเลข 4)"
      },
      {
        q: "ตามหลักกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) เมื่อเราออกแบบหน้าเว็บรับสมัครสมาชิกของนักเรียน ข้อใดคือสิ่งที่ควรปฏิบัติ?",
        options: [
          "แอบเก็บข้อมูลพิกัด GPS และรายชื่อเพื่อนทั้งหมดในเครื่องโดยไม่ต้องแจ้งให้ทราบ",
          "เก็บข้อมูลเฉพาะเท่าที่จำเป็นต่อการใช้งาน แจ้งวัตถุประสงค์ให้ชัดเจน และขอความยินยอมจากเจ้าของข้อมูล",
          "นำรายชื่อและเบอร์โทรของนักเรียนทุกคนไปโพสต์ขายต่อในโซเชียลมีเดีย",
          "บังคับให้นักเรียนกรอกรหัสผ่านบัตรเอทีเอ็มลงในช่องหมายเหตุ"
        ],
        answer: 1,
        explain: "หลักสำคัญของ PDPA คือการเก็บข้อมูลส่วนบุคคลเท่าที่จำเป็น แจ้งวัตถุประสงค์อย่างโปร่งใส และรักษาความปลอดภัยของข้อมูล"
      }
    ]
  },

  {
    id: 10,
    moduleId: 3,
    moduleName: "หมวดที่ 3: รหัสภาพ QR Code และความปลอดภัย",
    code: "UNIT 10",
    title: "การเข้ารหัสข้อมูล: Symmetric (AES) vs Asymmetric (RSA), HTTPS (SSL/TLS) และ Hashing (SHA-256 + Salt)",
    summary: "เปรียบเทียบการเข้ารหัสแบบกุญแจเดี่ยว (AES) กับกุญแจคู่ (RSA), โพรโทคอล HTTPS และขั้นตอนการทำ Password Hashing + Salt",
    simType: "crypto_hash_lab",
    simLabel: "LAB 10: ทดลองผสมค่า Salt กับรหัสผ่านแล้วแปลงเป็น SHA-256 Hash",
    accentBg: "bg-sky-200",
    steps: [
      {
        badge: "PART 01 • ENCRYPTION & HTTPS",
        title: "การเข้ารหัสข้อมูล Symmetric (AES) vs Asymmetric (RSA) และ HTTPS",
        html: `
          <div class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box rounded-xl p-4">
                <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">SYMMETRIC (AES)</span>
                <h6 class="font-bold mt-2">กุญแจสมมาตร (ใช้กุญแจดอกเดียวกัน)</h6>
                <p class="text-zinc-700 mt-1">ใช้ <strong>Secret Key ดอกเดียวกัน</strong>ทั้งตอนล็อกข้อมูล (Encrypt) และตอนไขเปิดอ่าน (Decrypt) ทำงานเร็วมาก เหมาะกับการเข้ารหัสไฟล์ขนาดใหญ่</p>
              </div>
              <div class="calc-step-box rounded-xl p-4">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">ASYMMETRIC (RSA)</span>
                <h6 class="font-bold mt-2">กุญแจอสมมาตร (ใช้กุญแจคู่ 2 ดอก)</h6>
                <p class="text-zinc-700 mt-1">ใช้ <strong>Public Key (กุญแจสาธารณะ)</strong> แจกให้ผู้ส่งใช้ล็อกข้อมูล และใช้ <strong>Private Key (กุญแจส่วนตัว)</strong> ที่ผู้รับถือไว้คนเดียวในการไขเปิดอ่าน</p>
              </div>
            </div>

            <div class="calc-step-box bg-sky-50 rounded-xl p-4 text-xs sm:text-sm">
              <h6 class="font-bold">โพรโทคอล HTTPS (SSL/TLS) ป้องกันการดักฟังข้อมูล</h6>
              <p class="text-zinc-700 mt-1">
                เว็บไซต์ที่ขึ้นต้นด้วย <code>https://</code> จะเข้ารหัสข้อมูลที่รับ-ส่งระหว่างเบราว์เซอร์กับเซิร์ฟเวอร์ตลอดเส้นทาง ทำให้ผู้ไม่หวังดีที่ดักฟังสัญญาณ Wi-Fi ไม่สามารถแอบอ่านรหัสผ่านได้
              </p>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • STEP-BY-STEP HASHING + SALT",
        title: "ขั้นตอนการจัดเก็บรหัสผ่านอย่างปลอดภัยด้วย SHA-256 Hashing + Salt",
        html: `
          <div class="space-y-3">
            <p class="text-xs sm:text-sm">
              ระบบฐานข้อมูลมาตรฐานจะไม่เก็บรหัสผ่านจริงของลูกค้าเป็นข้อความตรงๆ เด็ดขาด แต่จะผ่านกระบวนการ <strong>Hash + Salt</strong> ตาม 3 ขั้นตอนนี้:
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box bg-white rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">STEP 1: GENERATE SALT</span>
                <p class="font-bold mt-1.5">สร้างค่าสุ่มเฉพาะตัว (Salt)</p>
                <p class="text-zinc-700 mt-1">สุ่มชุดอักขระขึ้นมา เช่น <code>#k9P2x</code> แล้วนำไปต่อท้ายรหัสผ่านของผู้ใช้ เช่น <code>123456#k9P2x</code></p>
              </div>
              <div class="calc-step-box bg-white rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">STEP 2: SHA-256 HASH</span>
                <p class="font-bold mt-1.5">แปลงเป็นรหัสทางเดียว (One-way)</p>
                <p class="text-zinc-700 mt-1">ส่งเข้าฟังก์ชัน SHA-256 ได้เป็นรหัสเลขฐานสิบหก 64 ตัวอักษร ซึ่งไม่สามารถย้อนกลับเป็นคำเดิมได้</p>
              </div>
              <div class="calc-step-box bg-sky-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-sky-300 px-2 py-0.5 rounded border border-black">STEP 3: ANTI-RAINBOW TABLE</span>
                <p class="font-bold mt-1.5">ป้องกันการเดารหัสซ้ำ</p>
                <p class="text-zinc-700 mt-1">แม้ผู้ใช้ 2 คนจะตั้งรหัสว่า <code>123456</code> เหมือนกัน แต่เพราะมี Salt ต่างกัน ค่า Hash ในฐานข้อมูลจึงไม่ซ้ำกันเลย</p>
              </div>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "การเข้ารหัสข้อมูลแบบอสมมาตร (Asymmetric Encryption เช่นอัลกอริทึม RSA) มีหลักการใช้กุญแจในการเข้ารหัสและถอดรหัสอย่างไร?",
        options: [
          "ใช้กุญแจดอกเดียวกันทั้งตอนเข้ารหัสและถอดรหัส",
          "ใช้ Public Key (กุญแจสาธารณะ) ในการเข้ารหัสล็อกข้อมูล และใช้ Private Key (กุญแจส่วนตัวของผู้รับ) ในการถอดรหัสเปิดอ่าน",
          "ไม่ต้องใช้กุญแจใดๆ เพียงแค่เปลี่ยนนามสกุลไฟล์เป็น .TXT",
          "ใช้รหัสไปรษณีย์ของผู้ส่งเป็นกุญแจเปิดอ่านเสมอ"
        ],
        answer: 1,
        explain: "Asymmetric Encryption ใช้กุญแจคู่ คือ Public Key สำหรับเข้ารหัส และ Private Key ที่ผู้รับเก็บไว้เป็นความลับคนเดียวสำหรับถอดรหัส"
      },
      {
        q: "เหตุใดเว็บไซต์ที่มีระบบล็อกอินหรือทำธุรกรรมการเงินจึงต้องใช้โพรโทคอล HTTPS (SSL/TLS) แทน HTTP ธรรมดา?",
        options: [
          "เพื่อให้รูปภาพในเว็บไซต์มีสีสันสดใสขึ้น",
          "เพื่อเข้ารหัสข้อมูลที่รับ-ส่งระหว่างเบราว์เซอร์กับเซิร์ฟเวอร์ ป้องกันผู้ไม่หวังดีดักฟังข้อมูลรหัสผ่านระหว่างทาง",
          "เพื่อให้เว็บไซต์สามารถเปิดใช้งานได้โดยไม่ต้องต่ออินเทอร์เน็ต",
          "เพื่อลดขนาดหน้าจอของเว็บไซต์ให้เล็กลงครึ่งหนึ่ง"
        ],
        answer: 1,
        explain: "HTTPS ใช้ SSL/TLS ในการเข้ารหัสข้อมูลระหว่างเครื่องผู้ใช้งานกับเซิร์ฟเวอร์ ป้องกันการถูกดักจับข้อมูลระหว่างทาง"
      },
      {
        q: "ในการจัดเก็บรหัสผ่านของผู้ใช้งานลงฐานข้อมูล การนำค่าสุ่มที่เรียกว่า 'Salt' ไปผสมกับรหัสผ่านก่อนเข้าฟังก์ชัน Hash (เช่น SHA-256) มีประโยชน์หลักเพื่ออะไร?",
        options: [
          "ทำให้รหัสผ่านสั้นลงเหลือเพียง 2 ตัวอักษร",
          "ช่วยให้แอดมินสามารถเปิดดูรหัสผ่านจริงของลูกค้าได้ง่ายขึ้น",
          "ทำให้ผู้ใช้ที่ตั้งรหัสผ่านซ้ำกันได้ค่า Hash ที่แตกต่างกัน ป้องกันการถูกโจมตีด้วยตารางสำเร็จรูป (Rainbow Table Attack)",
          "ทำให้คีย์บอร์ดพิมพ์ได้เร็วขึ้น"
        ],
        answer: 2,
        explain: "การเติม Salt เฉพาะรายบุคคลเข้าไปก่อนทำ Hash ทำให้ผู้ใช้ที่ตั้งรหัสผ่านเหมือนกันได้ค่า Hash ที่ไม่ซ้ำกัน ป้องกัน Rainbow Table Attack"
      }
    ]
  },

  /* ==========================================================================
     หมวดที่ 4: ระบบระบุตัวตนและชีวมิติ (หน่วยที่ 11 - 12)
     ========================================================================== */
  {
    id: 11,
    moduleId: 4,
    moduleName: "หมวดที่ 4: ระบบระบุตัวตนและชีวมิติ",
    code: "UNIT 11",
    title: "ระบบระบุตัวตนด้วยคลื่นความถี่วิทยุ (RFID): องค์ประกอบ 5 ส่วน, Passive vs Active และย่าน LF / HF (NFC) / UHF",
    summary: "รู้จักองค์ประกอบทั้ง 5 ส่วนของ RFID ความต่างของบัตร Passive (ไร้ถ่าน) กับ Active (มีถ่าน) และการเลือกใช้ย่านความถี่ LF, HF, UHF",
    simType: "rfid_reader_lab",
    simLabel: "LAB 11: จำลองการแตะบัตร RFID เหนี่ยวนำคลื่นวิทยุและอ่านรหัส UID",
    accentBg: "bg-pink-200",
    steps: [
      {
        badge: "PART 01 • 5 COMPONENTS & TAG TYPES",
        title: "องค์ประกอบ 5 ส่วนของระบบ RFID และแท็กแบบ Passive เทียบกับ Active",
        html: `
          <div class="space-y-3">
            <div class="calc-step-box rounded-xl p-4 text-xs sm:text-sm">
              <h6 class="font-bold">องค์ประกอบครบวงจร 5 ส่วนของระบบ RFID</h6>
              <p class="text-zinc-700 mt-1">
                1. <strong>RFID Tag (ป้าย/บัตรไมโครชิป)</strong> &rarr; 2. <strong>Antenna (ขดลวดสายอากาศส่งคลื่น)</strong> &rarr; 3. <strong>RFID Reader (เครื่องอ่านและปล่อยคลื่นวิทยุ)</strong> &rarr; 4. <strong>Middleware (ซอฟต์แวร์ตัวกลางกรองสัญญาณ)</strong> &rarr; 5. <strong>Backend Database (ฐานข้อมูลหลัก)</strong>
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box bg-pink-50 rounded-xl p-4">
                <span class="font-notch font-bold text-xs bg-pink-300 px-2 py-0.5 rounded border border-black">PASSIVE TAG (NO BATTERY)</span>
                <h6 class="font-bold mt-2">แท็กแบบไม่มีแบตเตอรี่ในตัว</h6>
                <p class="text-zinc-700 mt-1">รับ<strong>พลังงานเหนี่ยวนำจากคลื่นวิทยุของเครื่องอ่าน</strong>มาปลุกชิปให้ส่งรหัสกลับ ขนาดบาง ราคาถูก อายุใช้งานยาวนาน เช่น บัตรนักศึกษา บัตรรถไฟฟ้า (ระยะอ่านใกล้)</p>
              </div>
              <div class="calc-step-box bg-amber-50 rounded-xl p-4">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">ACTIVE TAG (BATTERY POWERED)</span>
                <h6 class="font-bold mt-2">แท็กแบบมีแบตเตอรี่ในตัว</h6>
                <p class="text-zinc-700 mt-1">มีถ่านจ่ายไฟในตัวแท็ก จึงส่งสัญญาณออกไปเองได้ไกลมาก (<strong>ระยะ 30 - 100+ เมตร</strong>) นิยมใช้กับบัตรผ่านทางด่วนอัตโนมัติ (Easy Pass / M-Pass) และติดตามตู้คอนเทนเนอร์</p>
              </div>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • FREQUENCY BANDS",
        title: "เปรียบเทียบย่านความถี่คลื่นวิทยุ RFID ทั้ง 3 ย่าน: LF, HF (NFC) และ UHF",
        html: `
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div class="calc-step-box bg-emerald-50 rounded-xl p-4">
              <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">1. LF (125 - 134 kHz)</span>
              <h6 class="font-bold mt-2">ความถี่ต่ำ (Low Frequency)</h6>
              <p class="text-zinc-700 mt-1">ระยะอ่านประชิด (&lt;10 ซม.) จุดเด่นคือ<strong>คลื่นทะลุผ่านน้ำและเนื้อเยื่อร่างกายได้ดี</strong> จึงใช้ทำไมโครชิปฝังตัวสัตว์เลี้ยง</p>
            </div>
            <div class="calc-step-box bg-sky-50 rounded-xl p-4">
              <span class="font-notch font-bold text-xs bg-sky-300 px-2 py-0.5 rounded border border-black">2. HF / NFC (13.56 MHz)</span>
              <h6 class="font-bold mt-2">ความถี่สูง (High Frequency)</h6>
              <p class="text-zinc-700 mt-1">ระยะอ่าน 1-10 ซม. เป็นย่านความถี่มาตรฐานเดียวกับ <strong>NFC บนสมาร์ตโฟน</strong> ใช้ในบัตรแตะจ่ายเงิน บัตรรถไฟฟ้า และบัตรผ่านประตูอาคาร</p>
            </div>
            <div class="calc-step-box bg-pink-50 rounded-xl p-4">
              <span class="font-notch font-bold text-xs bg-pink-300 px-2 py-0.5 rounded border border-black">3. UHF (860 - 960 MHz)</span>
              <h6 class="font-bold mt-2">ความถี่สูงยิ่งยวด (Ultra-High)</h6>
              <p class="text-zinc-700 mt-1">อ่านได้ไกลหลายเมตรและ<strong>สแกนอ่านแท็กหลายร้อยชิ้นพร้อมกันได้ในเสี้ยววินาที</strong> ใช้ในคลังสินค้าโลจิสติกส์และด่านทางด่วน</p>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "บัตรแตะเข้าอาคารเรียนหรือบัตรโดยสารรถไฟฟ้าที่มีลักษณะเป็นบัตรพลาสติกบางๆ ไม่ต้องเปลี่ยนถ่านตลอดอายุการใช้งาน จัดเป็นแท็ก RFID ชนิดใด?",
        options: [
          "Passive RFID Tag (รับพลังงานเหนี่ยวนำจากคลื่นวิทยุของเครื่องอ่าน)",
          "Active RFID Tag (มีแบตเตอรี่ลิเทียมขนาดใหญ่ในตัวบัตร)",
          "Nuclear Tag",
          "Optical Laser Card"
        ],
        answer: 0,
        explain: "Passive RFID Tag ไม่มีแบตเตอรี่ภายในตัว แต่ใช้ขดลวดสายอากาศรับคลื่นแม่เหล็กไฟฟ้าจากเครื่องอ่านมาแปลงเป็นพลังงานชั่วขณะ"
      },
      {
        q: "เทคโนโลยี NFC บนสมาร์ตโฟนที่ใช้แตะชำระเงินหรือแตะอ่านข้อมูลระยะใกล้ ทำงานอยู่ในย่านความถี่ใดของระบบ RFID?",
        options: [
          "ย่าน LF (125 kHz)",
          "ย่าน HF (High Frequency 13.56 MHz)",
          "ย่านคลื่นแสงเลเซอร์สีแดง",
          "ย่านคลื่นเสียงอัลตราโซนิก"
        ],
        answer: 1,
        explain: "NFC พัฒนาต่อยอดมาจากมาตรฐาน RFID ย่านความถี่สูง HF ที่ความถี่ 13.56 MHz"
      },
      {
        q: "หากต้องการติดแท็ก RFID กับกล่องสินค้าในคลังสินค้า เพื่อให้เมื่อเข็นรถเข็นผ่านประตูโกดังแล้วเครื่องสามารถสแกนเช็กสินค้าทั้ง 200 กล่องได้พร้อมกันในระยะ 5 เมตร ควรเลือกใช้ RFID ย่านความถี่ใด?",
        options: [
          "ย่าน UHF (Ultra-High Frequency 860 - 960 MHz)",
          "ย่าน LF (Low Frequency 125 kHz)",
          "บาร์โค้ดแท่ง 1 มิติธรรมดา",
          "สแกนเนอร์แผ่นเรียบ (Flatbed Scanner)"
        ],
        answer: 0,
        explain: "ย่านความถี่ UHF สามารถส่งสัญญาณได้ไกลหลายเมตรและรองรับการอ่านแท็กจำนวนมากพร้อมกันด้วยความเร็วสูง"
      }
    ]
  },

  {
    id: 12,
    moduleId: 4,
    moduleName: "หมวดที่ 4: ระบบระบุตัวตนและชีวมิติ",
    code: "UNIT 12",
    title: "การนำเข้าข้อมูลชีวมิติ (Biometric Input): กายภาพ vs พฤติกรรม, Minutiae, 1:1 vs 1:N และค่า FAR / FRR / EER",
    summary: "เข้าใจชีวมิติทางกายภาพและพฤติกรรม จุดตัดลายนิ้วมือ Minutiae การเปรียบเทียบ 1:1 vs 1:N และการวิเคราะห์ค่า FAR, FRR, EER แบบ Step-by-Step",
    simType: "biometric_threshold_lab",
    simLabel: "LAB 12: สแกนจุดตัดลายนิ้วมือ Minutiae และปรับค่า Threshold ดูกราฟ FAR / FRR",
    accentBg: "bg-pink-200",
    steps: [
      {
        badge: "PART 01 • BIOMETRICS & MINUTIAE",
        title: "ชีวมิติทางกายภาพ vs พฤติกรรม, จุดตัด Minutiae และการตรวจสอบ 1:1 vs 1:N",
        html: `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div class="calc-step-box rounded-xl p-4 space-y-1.5">
              <span class="font-notch font-bold text-xs bg-pink-300 px-2 py-0.5 rounded border border-black">PHYSIOLOGICAL VS BEHAVIORAL</span>
              <h6 class="font-bold">1. กายภาพ เทียบกับ พฤติกรรม</h6>
              <p class="text-zinc-700">
                • <strong>ทางกายภาพ:</strong> ลายนิ้วมือ, โครงหน้า, ลวดลายม่านตา (Iris), เส้นเลือดในฝ่ามือ<br/>
                • <strong>ทางพฤติกรรม:</strong> น้ำเสียงการพูด, จังหวะการกดแป้นพิมพ์ (Keystroke), ลักษณะการลงน้ำหนักเซ็นลายเซ็น
              </p>
            </div>
            <div class="calc-step-box rounded-xl p-4 space-y-1.5">
              <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">MINUTIAE & 1:1 VS 1:N</span>
              <h6 class="font-bold">2. จุดตัด Minutiae และการเทียบ 1:1 vs 1:N</h6>
              <p class="text-zinc-700">
                เครื่องสแกนนิ้วจะสกัดพิกัด<strong>จุดสิ้นสุดเส้นและจุดแยกสองง่าม (Minutiae Points)</strong> เก็บเป็นรหัสตัวเลข:<br/>
                • <strong>1:1 (Verification):</strong> แตะบัตรก่อนแล้ววางนิ้วเทียบเฉพาะเจ้าของบัตร<br/>
                • <strong>1:N (Identification):</strong> วางนิ้วอย่างเดียวแล้วค้นหาจากฐานข้อมูลทั้งองค์กร
              </p>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • STEP-BY-STEP FAR / FRR / EER",
        title: "วิเคราะห์ความสัมพันธ์ของค่า Threshold ต่ออัตราความผิดพลาด FAR, FRR และจุดสมดุล EER",
        html: `
          <div class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box bg-red-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-red-300 px-2 py-0.5 rounded border border-black">STEP 1: ค่า FAR</span>
                <p class="font-bold mt-1.5">False Acceptance Rate (รับคนผิดเข้าประตู)</p>
                <p class="text-zinc-700 mt-1">เกิดเมื่อตั้งค่าความเข้มงวด (Threshold) <strong>ต่ำเกินไป</strong> ทำให้คนแปลกหน้าสแกนผ่านเข้ามาได้ (อันตรายต่อความปลอดภัย)</p>
              </div>
              <div class="calc-step-box bg-amber-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">STEP 2: ค่า FRR</span>
                <p class="font-bold mt-1.5">False Rejection Rate (ปฏิเสธเจ้าของตัวจริง)</p>
                <p class="text-zinc-700 mt-1">เกิดเมื่อตั้งค่า Threshold <strong>สูง/เข้มงวดเกินไป</strong> ทำให้เจ้าของตัวจริงสแกนไม่ค่อยผ่าน ต้องวางนิ้วซ้ำหลายรอบ</p>
              </div>
              <div class="calc-step-box bg-emerald-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">STEP 3: จุดตัด EER</span>
                <p class="font-bold mt-1.5">Equal Error Rate (จุดสมดุล)</p>
                <p class="text-zinc-700 mt-1">คือจุดที่กราฟ <code>FAR = FRR</code> พอดี ยิ่งเครื่องสแกนรุ่นไหนมีค่า EER ต่ำ แสดงว่ามีความแม่นยำสูงมาก</p>
              </div>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "ข้อใดจัดเป็นข้อมูลชีวมิติประเภท 'ลักษณะทางพฤติกรรม (Behavioral Biometrics)' ทั้งหมด?",
        options: [
          "ลายนิ้วมือ และ ลวดลายม่านตา (Iris)",
          "จังหวะการกดแป้นพิมพ์ (Keystroke Dynamics) และ ลักษณะการลงน้ำหนักมือขณะเซ็นลายเซ็น",
          "โครงสร้างใบหน้า และ เส้นเลือดดำในฝ่ามือ",
          "รหัสผ่านตัวเลข 6 หลัก และ บัตรสมาร์ตการ์ด"
        ],
        answer: 1,
        explain: "จังหวะการพิมพ์คีย์บอร์ด น้ำเสียงการพูด และจังหวะการเซ็นชื่อ เป็นพฤติกรรมการกระทำของบุคคล จึงจัดเป็น Behavioral Biometrics"
      },
      {
        q: "หากผู้ดูแลระบบตั้งค่าความเข้มงวด (Security Threshold) ของเครื่องสแกนลายนิ้วมือหน้าห้องเรียนไว้ 'ต่ำมากๆ' จะส่งผลให้เกิดความเสี่ยงในข้อใด?",
        options: [
          "ค่า FAR (False Acceptance Rate) จะสูงขึ้น คือคนอื่นที่ไม่ได้ลงทะเบียนอาจสแกนผ่านเข้ามาได้ง่ายขึ้น",
          "ค่า FRR จะพุ่งเป็น 100% จนไม่มีใครเข้าห้องได้เลย",
          "เครื่องสแกนจะเปลี่ยนไปอ่านบาร์โค้ดแทนลายนิ้วมือ",
          "ข้อมูลลายนิ้วมือจะกลายเป็นไฟล์เสียง MP3"
        ],
        answer: 0,
        explain: "เมื่อตั้งค่า Threshold ต่ำเกินไป เครื่องจะยอมให้ลายนิ้วมือที่มีความคล้ายกันเพียงเล็กน้อยผ่านได้ ทำให้ค่า FAR สูงขึ้น"
      },
      {
        q: "การที่พนักงานเดินไปที่เครื่องสแกนใบหน้าแล้วมองกล้องทันทีโดยไม่ต้องแตะบัตรหรือกดรหัสพนักงานใดๆ เพื่อให้ระบบค้นหาจากฐานข้อมูลพนักงานทั้ง 500 คนว่าคือใคร เรียกว่าการประมวลผลแบบใด?",
        options: [
          "การระบุตัวตนแบบ 1:N (One-to-Many Identification)",
          "การยืนยันตัวตนแบบ 1:1 (One-to-One Verification)",
          "การบีบอัดข้อมูลแบบ Lossy",
          "การเข้ารหัสแบบ Base64"
        ],
        answer: 0,
        explain: "ระบบต้องนำใบหน้าที่สแกนได้ 1 ภาพ ไปเปรียบเทียบกับข้อมูลใบหน้าทั้งหมด N คนในฐานข้อมูล จึงเรียกว่า 1:N (Identification)"
      }
    ]
  },

  /* ==========================================================================
     หมวดที่ 5: ซอฟต์แวร์ การแปลงรหัส และการบีบอัดข้อมูล (หน่วยที่ 13 - 15)
     ========================================================================== */
  {
    id: 13,
    moduleId: 5,
    moduleName: "หมวดที่ 5: ซอฟต์แวร์ การแปลงรหัส และการบีบอัดข้อมูล",
    code: "UNIT 13",
    title: "ซอฟต์แวร์และโปรโตคอลนำเข้าข้อมูล: DBMS, โครงสร้างไฟล์ CSV/JSON และ Power Query",
    summary: "เข้าใจระบบจัดการฐานข้อมูล DBMS โครงสร้างไฟล์แลกเปลี่ยนข้อมูล CSV เทียบกับ JSON และขั้นตอนการคลีนข้อมูลด้วย Power Query",
    simType: "csv_json_powerquery_lab",
    simLabel: "LAB 13: ทดลองคลีนข้อมูลด้วย Power Query และสลับดูโครงสร้าง CSV / JSON",
    accentBg: "bg-amber-200",
    steps: [
      {
        badge: "PART 01 • DBMS, CSV & JSON",
        title: "ระบบฐานข้อมูล DBMS และความแตกต่างของไฟล์ CSV กับ JSON",
        html: `
          <div class="space-y-3">
            <div class="calc-step-box rounded-xl p-4 text-xs sm:text-sm">
              <h6 class="font-bold">ซอฟต์แวร์จัดการฐานข้อมูล (DBMS: Database Management System)</h6>
              <p class="text-zinc-700 mt-1">
                ทำหน้าที่จัดเก็บ ค้นหา และรักษาความถูกต้องของตารางข้อมูล โดยประกอบด้วย <strong>Field (คอลัมน์)</strong>, <strong>Record (แถวข้อมูลรายคน)</strong> และ <strong>Primary Key (คีย์หลักห้ามซ้ำ เช่น รหัสนักศึกษา)</strong>
              </p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box bg-emerald-50 rounded-xl p-3.5 space-y-1.5">
                <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">CSV FORMAT</span>
                <h6 class="font-bold">ไฟล์ .CSV (Comma-Separated Values)</h6>
                <p class="text-zinc-700">ใช้เครื่องหมายจุลภาค (ลูกน้ำ <code>,</code>) คั่นระหว่างคอลัมน์ เปิดใน Excel ได้ง่าย:</p>
                <pre class="bg-white border border-black rounded p-2 text-xs">id,name,score
67001,สมชาย,85</pre>
              </div>
              <div class="calc-step-box bg-amber-50 rounded-xl p-3.5 space-y-1.5">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">JSON FORMAT</span>
                <h6 class="font-bold">ไฟล์ .JSON (JavaScript Object Notation)</h6>
                <p class="text-zinc-700">เก็บในรูปคู่ <code>"Key": Value</code> นิยมใช้ส่งข้อมูลผ่าน Web API:</p>
                <pre class="bg-white border border-black rounded p-2 text-xs">{"id": "67001", "name": "สมชาย", "score": 85}</pre>
              </div>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • STEP-BY-STEP POWER QUERY",
        title: "ขั้นตอนการทำความสะอาดข้อมูล (Data Cleaning / ETL) ด้วย Power Query",
        html: `
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
            <div class="calc-step-box rounded-xl p-3.5">
              <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">STEP 1: EXTRACT</span>
              <h6 class="font-bold mt-1.5">ดึงข้อมูลดิบจากแหล่งต่างๆ</h6>
              <p class="text-zinc-700 mt-1">นำเข้าไฟล์ CSV, Excel หรือฐานข้อมูลภายนอกเข้ามาในเครื่องมือ Power Query</p>
            </div>
            <div class="calc-step-box rounded-xl p-3.5">
              <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">STEP 2: TRANSFORM</span>
              <h6 class="font-bold mt-1.5">คลีนและจัดระเบียบข้อมูล</h6>
              <p class="text-zinc-700 mt-1">ใช้คำสั่ง <strong>Trim</strong> (ตัดช่องว่างหน้า-หลังชื่อ) และ <strong>Remove Duplicates</strong> (ลบแถวข้อมูลที่ซ้ำกัน)</p>
            </div>
            <div class="calc-step-box rounded-xl p-3.5">
              <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">STEP 3: LOAD</span>
              <h6 class="font-bold mt-1.5">โหลดลงตารางพร้อมใช้งาน</h6>
              <p class="text-zinc-700 mt-1">ส่งข้อมูลที่สะอาดและเป็นมาตรฐานเดียวกันเข้าสู่ตาราง Excel หรือฐานข้อมูลหลัก</p>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "ไฟล์ข้อมูลชนิดใดที่จัดเก็บข้อมูลตารางเป็นข้อความธรรมดา โดยใช้เครื่องหมายจุลภาค (Comma ',') คั่นระหว่างคอลัมน์ และนิยมใช้แลกเปลี่ยนข้อมูลกับโปรแกรม Excel?",
        options: [
          "ไฟล์ .CSV (Comma-Separated Values)",
          "ไฟล์ .MP3 (Audio Layer 3)",
          "ไฟล์ .EXE (Executable Program)",
          "ไฟล์ .BMP (Bitmap Image)"
        ],
        answer: 0,
        explain: "ไฟล์ CSV ย่อมาจาก Comma-Separated Values คือไฟล์ข้อความที่ใช้เครื่องหมายลูกน้ำ (,) คั่นข้อมูลแต่ละคอลัมน์"
      },
      {
        q: "ในการส่งข้อมูลคะแนนของนักเรียนจากหน้าเว็บไปยังเซิร์ฟเวอร์ผ่าน Web API นิยมจัดรูปแบบข้อความให้อยู่ในโครงสร้างคู่ของ 'Key: Value' ในวงเล็บปีกกา เช่น {\"id\":\"6701\", \"score\":90} รูปแบบนี้เรียกว่าอะไร?",
        options: ["JSON (JavaScript Object Notation)", "BIOS Setup", "HTML Heading", "JPEG Image"],
        answer: 0,
        explain: "JSON เป็นรูปแบบการแลกเปลี่ยนข้อมูลมาตรฐานบนเว็บที่จัดเก็บในรูป Key-Value"
      },
      {
        q: "เมื่อนำเข้าข้อมูลรายชื่อลูกค้าจากไฟล์ภายนอก พบว่ามีช่องว่างเคาะวรรคเกินมาข้างหน้าชื่อและมีแถวรายชื่อซ้ำกันจำนวนมาก หากใช้เครื่องมือ Power Query ใน Excel ควรใช้คำสั่งใดเพื่อแก้ปัญหานี้?",
        options: [
          "ใช้คำสั่ง Trim (ตัดช่องว่างส่วนเกิน) และ Remove Duplicates (ลบแถวข้อมูลที่ซ้ำกัน)",
          "ใช้คำสั่ง Format C: เพื่อล้างคอมพิวเตอร์ใหม่",
          "ใช้คำสั่ง Print Preview เพื่อพิมพ์ออกทางกระดาษ",
          "ใช้คำสั่ง Zoom In เพื่อขยายหน้าจอให้ใหญ่ขึ้น"
        ],
        answer: 0,
        explain: "ใน Power Query คำสั่ง Trim ช่วยตัดช่องว่างส่วนเกิน และ Remove Duplicates ช่วยลบแถวที่ซ้ำกัน"
      }
    ]
  },

  {
    id: 14,
    moduleId: 5,
    moduleName: "หมวดที่ 5: ซอฟต์แวร์ การแปลงรหัส และการบีบอัดข้อมูล",
    code: "UNIT 14",
    title: "การแปลงรหัสข้อมูล (Encoding & Decoding): ASCII, TIS-620, Unicode (UTF-8), ปัญหาภาษาต่างดาว และ Base64",
    summary: "เรียนรู้รหัสอักขระ ASCII, TIS-620, UTF-8 พร้อมวิธีคำนวณขนาดไบต์ของข้อความภาษาไทยและอังกฤษแบบ Step-by-Step",
    simType: "utf8_byte_base64_calc",
    simLabel: "LAB 14: เครื่องคำนวณขนาดไบต์ UTF-8 เทียบกับ TIS-620 และตัวแปลง Base64",
    accentBg: "bg-amber-200",
    steps: [
      {
        badge: "PART 01 • CHARACTER ENCODING",
        title: "รหัสอักขระ ASCII, TIS-620, Unicode (UTF-8) และสาเหตุของปัญหาภาษาต่างดาว",
        html: `
          <div class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">1. ASCII</span>
                <p class="font-bold mt-1.5">ภาษาอังกฤษพื้นฐาน (1 Byte)</p>
                <p class="text-zinc-700 mt-1">เก็บเฉพาะอักษรภาษาอังกฤษ <code>A-Z, a-z, 0-9</code> ใช้พื้นที่ตัวละ <strong>1 ไบต์</strong> (ไม่รองรับภาษาไทย)</p>
              </div>
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">2. TIS-620</span>
                <p class="font-bold mt-1.5">รหัสภาษาไทยยุคเก่า (1 Byte)</p>
                <p class="text-zinc-700 mt-1">เก็บภาษาอังกฤษและภาษาไทยโดยใช้พื้นที่ตัวละ <strong>1 ไบต์</strong> เท่ากัน แต่ไม่รองรับภาษาอื่นในโลก</p>
              </div>
              <div class="calc-step-box rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-sky-300 px-2 py-0.5 rounded border border-black">3. UNICODE (UTF-8)</span>
                <p class="font-bold mt-1.5">มาตรฐานสากลปัจจุบัน</p>
                <p class="text-zinc-700 mt-1">รองรับทุกภาษาทั่วโลก โดย<strong>ภาษาอังกฤษใช้ 1 ไบต์</strong> และ<strong>ภาษาไทยใช้ตัวละ 3 ไบต์</strong></p>
              </div>
            </div>

            <div class="calc-step-box bg-amber-50 rounded-xl p-3.5 text-xs sm:text-sm">
              <strong>ทำไมถึงเกิดปัญหา "ภาษาต่างดาว" (Mojibake) และการแปลง Base64:</strong><br/>
              • <strong>ภาษาต่างดาว:</strong> เกิดเมื่อตอนบันทึกไฟล์ (Encode เช่น UTF-8) กับตอนเปิดอ่าน (Decode เช่น TIS-620) ใช้ตารางรหัสไม่ตรงกัน<br/>
              • <strong>Base64:</strong> คือการแปลงข้อมูลไบนารี (เช่น รูปภาพ) ให้เป็นข้อความตัวอักษร ASCII เพื่อแนบส่งไปกับไฟล์ JSON หรือ HTML ได้โดยข้อมูลไม่เพี้ยน
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • STEP-BY-STEP UTF-8 BYTE CALCULATION",
        title: "วิธีคำนวณขนาดไบต์ (Bytes) ของข้อความในมาตรฐาน UTF-8 แบบ Step-by-Step",
        html: `
          <div class="space-y-3">
            <p class="text-xs sm:text-sm">
              <strong>โจทย์ตัวอย่าง:</strong> หากบันทึกข้อความคำว่า <code>"ปวช1IT"</code> ด้วยมาตรฐานรหัส <strong>UTF-8</strong> จะต้องใช้พื้นที่จัดเก็บทั้งหมดกี่ไบต์ (Bytes)?
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
              <div class="calc-step-box bg-emerald-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-emerald-300 px-2 py-0.5 rounded border border-black">STEP 1: นับอักษรไทย (×3 Bytes)</span>
                <p class="mt-1.5">ตัวอักษรไทยมี 3 ตัว คือ <code>ป</code>, <code>ว</code>, <code>ช</code> (ตัวละ 3 ไบต์):</p>
                <code class="block mt-1 bg-white p-1.5 rounded border border-black font-bold">3 ตัว × 3 ไบต์ = 9 ไบต์</code>
              </div>

              <div class="calc-step-box bg-amber-50 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-amber-300 px-2 py-0.5 rounded border border-black">STEP 2: นับอังกฤษ/ตัวเลข (×1 Byte)</span>
                <p class="mt-1.5">ตัวเลขอารบิกและอักษรอังกฤษมี 3 ตัว คือ <code>1</code>, <code>I</code>, <code>T</code> (ตัวละ 1 ไบต์):</p>
                <code class="block mt-1 bg-white p-1.5 rounded border border-black font-bold">3 ตัว × 1 ไบต์ = 3 ไบต์</code>
              </div>

              <div class="calc-step-box bg-sky-100 rounded-xl p-3.5">
                <span class="font-notch font-bold text-xs bg-sky-300 px-2 py-0.5 rounded border border-black">STEP 3: รวมขนาดไบต์ทั้งหมด</span>
                <p class="mt-1.5">นำขนาดไบต์จากขั้นที่ 1 และขั้นที่ 2 มารวมกัน:</p>
                <code class="block mt-1 bg-white p-1.5 rounded border border-black font-bold">9 + 3 = 12 ไบต์ (Bytes)</code>
              </div>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "หากบันทึกข้อความคำว่า 'ปวช1' (ประกอบด้วยตัวอักษรไทย 3 ตัว คือ ป-ว-ช และตัวเลขอารบิก 1 ตัว คือเลข 1) ด้วยมาตรฐานรหัสอักขระ UTF-8 ข้อความนี้จะมีขนาดกี่ไบต์ (Bytes)?",
        options: ["4 ไบต์", "8 ไบต์", "10 ไบต์", "12 ไบต์"],
        answer: 2,
        explain: "ในมาตรฐาน UTF-8 ตัวอักษรภาษาไทยใช้ตัวละ 3 ไบต์ (3 × 3 = 9 ไบต์) และตัวเลขอารบิกใช้ 1 ไบต์ รวมเป็น 9 + 1 = 10 ไบต์"
      },
      {
        q: "เมื่อนักเรียนดาวน์โหลดไฟล์รายชื่อ .CSV ที่บันทึกด้วยรหัส UTF-8 มาเปิดในโปรแกรมที่ตั้งค่าการอ่านรหัสเป็น TIS-620 แล้วพบว่าชื่อภาษาไทยกลายเป็นตัวอักษรประหลาดอ่านไม่ออก (ภาษาต่างดาว) สาเหตุเกิดจากอะไร?",
        options: [
          "ไฟล์ติดไวรัสเรียกค่าไถ่ (Ransomware)",
          "มาตรฐานการเข้ารหัสตอนบันทึก (Encoding) ไม่ตรงกับมาตรฐานการถอดรหัสตอนเปิดอ่าน (Decoding)",
          "สายสัญญาณหน้าจอมอนิเตอร์หลวม",
          "หน่วยความจำแรม (RAM) ของเครื่องคอมพิวเตอร์เสีย"
        ],
        answer: 1,
        explain: "ปัญหาภาษาต่างดาวเกิดจากการใช้ตารางรหัสอักขระตอนเปิดอ่านไม่ตรงกับตอนบันทึก"
      },
      {
        q: "การแปลงไฟล์รูปภาพไอคอนขนาดเล็กให้อยู่ในรูปแบบข้อความตัวอักษรด้วยวิธี 'Base64' มีวัตถุประสงค์หลักเพื่ออะไร?",
        options: [
          "เพื่อให้สามารถแนบข้อมูลไบนารี (เช่น รูปภาพ) ไปกับระบบที่รับส่งเฉพาะข้อความ Text เช่น JSON, HTML หรืออีเมลได้โดยข้อมูลไม่เสียหาย",
          "เพื่อบีบอัดขนาดไฟล์รูปภาพให้เล็กลงเหลือเพียง 10% ของขนาดเดิม",
          "เพื่อล็อกรหัสผ่านรูปภาพไม่ให้แฮกเกอร์เปิดดูได้ตลอดกาล",
          "เพื่อเปลี่ยนภาพขาว-ดำให้กลายเป็นภาพสีอัตโนมัติ"
        ],
        answer: 0,
        explain: "Base64 แปลงข้อมูลไบนารีให้เป็นตัวอักษร ASCII ที่ปลอดภัยต่อการส่งผ่านระบบข้อความ เช่น JSON หรือ HTML"
      }
    ]
  },

  {
    id: 15,
    moduleId: 5,
    moduleName: "หมวดที่ 5: ซอฟต์แวร์ การแปลงรหัส และการบีบอัดข้อมูล",
    code: "UNIT 15",
    title: "การบีบอัดข้อมูล (Data Compression): สูตรคำนวณพื้นที่ประหยัด, Lossless vs Lossy และอัลกอริทึม RLE / Huffman",
    summary: "แยกแยะการบีบอัดแบบ Lossless vs Lossy และเรียนรู้วิธีคำนวณเปอร์เซ็นต์พื้นที่ประหยัดและการเข้ารหัส RLE แบบ Step-by-Step",
    simType: "rle_compression_calc",
    simLabel: "LAB 15: เครื่องคำนวณการบีบอัดข้อมูล RLE และคำนวณเปอร์เซ็นต์พื้นที่ที่ประหยัดได้",
    accentBg: "bg-amber-200",
    steps: [
      {
        badge: "PART 01 • LOSSLESS VS LOSSY",
        title: "การบีบอัดแบบไม่สูญเสียข้อมูล (Lossless) เทียบกับ แบบสูญเสียบางส่วน (Lossy)",
        html: `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div class="calc-step-box bg-sky-50 rounded-2xl p-4 space-y-1.5">
              <span class="font-notch font-bold text-xs bg-sky-300 px-2.5 py-0.5 rounded border border-black">LOSSLESS COMPRESSION</span>
              <h5 class="font-bold text-base">1. บีบอัดแบบไม่สูญเสียข้อมูล (Lossless)</h5>
              <p class="text-zinc-700">
                เมื่อคลายไฟล์กลับมาจะได้ข้อมูล<strong>ตรงกับต้นฉบับเดิม 100% ทุกตัวอักษร</strong> ใช้กับงานเอกสาร โค้ดโปรแกรม และตัวเลขการเงิน เช่น ไฟล์ <code>.ZIP</code>, รูปภาพ <code>.PNG</code>
              </p>
            </div>
            <div class="calc-step-box bg-pink-50 rounded-2xl p-4 space-y-1.5">
              <span class="font-notch font-bold text-xs bg-pink-300 px-2.5 py-0.5 rounded border border-black">LOSSY COMPRESSION</span>
              <h5 class="font-bold text-base">2. บีบอัดแบบสูญเสียรายละเอียดบางส่วน (Lossy)</h5>
              <p class="text-zinc-700">
                ตัดรายละเอียดขอบสีหรือความถี่เสียงที่มนุษย์แยกแยะไม่ค่อยออกทิ้งไป ทำให้<strong>ขนาดไฟล์เล็กลงมาก</strong> เหมาะกับงานมัลติมีเดีย เช่น รูปภาพ <code>.JPEG</code>, เพลง <code>.MP3</code>, วิดีโอ <code>.MP4</code>
              </p>
            </div>
          </div>
        `
      },
      {
        badge: "PART 02 • STEP-BY-STEP COMPRESSION & RLE",
        title: "วิธีคำนวณเปอร์เซ็นต์พื้นที่ที่ประหยัดได้ และการเข้ารหัส RLE แบบ Step-by-Step",
        html: `
          <div class="space-y-4">
            <div class="calc-step-box bg-emerald-50 rounded-2xl p-4 space-y-2">
              <span class="font-notch font-bold text-xs bg-emerald-300 px-2.5 py-0.5 rounded border border-black">STEP-BY-STEP 1 • การคำนวณเปอร์เซ็นต์พื้นที่ที่ประหยัดได้ (Space Savings)</span>
              <p class="text-xs sm:text-sm">
                <strong>โจทย์ตัวอย่าง:</strong> ไฟล์ต้นฉบับขนาด <code>200 MB</code> เมื่อบีบอัดแล้วเหลือขนาด <code>50 MB</code> ประหยัดพื้นที่ไปกี่เปอร์เซ็นต์?
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div class="bg-white border-2 border-black rounded-xl p-2.5">
                  <strong>ขั้นที่ 1: หาพื้นที่ที่ลดลงไปได้</strong><br/>
                  <code>ขนาดเดิม - ขนาดใหม่ = 200 - 50 = 150 MB</code>
                </div>
                <div class="bg-white border-2 border-black rounded-xl p-2.5">
                  <strong>ขั้นที่ 2: หารด้วยขนาดต้นฉบับเดิม</strong><br/>
                  <code>150 ÷ 200 = 0.75</code>
                </div>
                <div class="bg-amber-200 border-2 border-black rounded-xl p-2.5">
                  <strong>ขั้นที่ 3: คูณ 100 เพื่อทำเป็นเปอร์เซ็นต์</strong><br/>
                  <code>0.75 × 100 = ประหยัดพื้นที่ไป 75%</code>
                </div>
              </div>
            </div>

            <div class="calc-step-box bg-amber-50 rounded-2xl p-4 space-y-2">
              <span class="font-notch font-bold text-xs bg-amber-300 px-2.5 py-0.5 rounded border border-black">STEP-BY-STEP 2 • การบีบอัดข้อมูลซ้ำด้วย Run-Length Encoding (RLE)</span>
              <p class="text-xs sm:text-sm">
                <strong>โจทย์ตัวอย่าง:</strong> จงบีบอัดข้อมูลแถวพิกเซล <code>"AAAAABBBCCCCCC"</code> (14 ตัวอักษร) ด้วยวิธี RLE:
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div class="bg-white border-2 border-black rounded-xl p-2.5">
                  <strong>ขั้นที่ 1: แยกกลุ่มตัวอักษรที่เรียงซ้ำติดกัน</strong><br/>
                  แบ่งได้เป็น <code>[AAAAA]</code> + <code>[BBB]</code> + <code>[CCCCCC]</code>
                </div>
                <div class="bg-white border-2 border-black rounded-xl p-2.5">
                  <strong>ขั้นที่ 2: นับจำนวนในแต่ละกลุ่ม</strong><br/>
                  กลุ่มแรกมี <code>A 5 ตัว (5A)</code>, กลุ่มสองมี <code>B 3 ตัว (3B)</code>, กลุ่มสามมี <code>C 6 ตัว (6C)</code>
                </div>
                <div class="bg-emerald-200 border-2 border-black rounded-xl p-2.5">
                  <strong>ขั้นที่ 3: เขียนรหัส RLE ต่อกัน</strong><br/>
                  ได้ผลลัพธ์คือ <strong><code>5A3B6C</code></strong> (ลดจาก 14 เหลือ 6 ตัวอักษร)
                </div>
              </div>
            </div>
          </div>
        `
      }
    ],
    quiz: [
      {
        q: "ไฟล์วิดีโอบันทึกการสอนมีขนาดต้นฉบับ 200 MB เมื่อนำมาบีบอัดแล้วเหลือขนาดเพียง 50 MB อยากทราบว่าประหยัดพื้นที่จัดเก็บไปได้กี่เปอร์เซ็นต์ (Space Savings)?",
        options: ["ประหยัดไป 25%", "ประหยัดไป 50%", "ประหยัดไป 75%", "ประหยัดไป 150%"],
        answer: 2,
        explain: "ใช้สูตร ((200 - 50) ÷ 200) × 100 = (150 ÷ 200) × 100 = 75%"
      },
      {
        q: "หากต้องการบีบอัด 'ไฟล์ซอร์สโค้ดโปรแกรมและฐานข้อมูลบัญชีรายชื่อนักเรียน' เพื่อส่งอีเมลให้ครู โดยเมื่อแตกไฟล์ออกมาแล้วข้อมูลห้ามเพี้ยนหรือตกหล่นแม้แต่ตัวอักษรเดียว ต้องเลือกการบีบอัดแบบใด?",
        options: [
          "Lossless Compression (เช่น การบีบอัดเป็นไฟล์ .ZIP)",
          "Lossy Compression (เช่น การแปลงเป็น .JPEG)",
          "การลดความละเอียดเสียงแบบ .MP3",
          "การตัดครึ่งไฟล์ท้ายตารางทิ้ง"
        ],
        answer: 0,
        explain: "ข้อมูลตัวอักษร โค้ดโปรแกรม และตัวเลขการเงิน ต้องใช้การบีบอัดแบบไม่สูญเสียข้อมูล (Lossless Compression เช่น .ZIP)"
      },
      {
        q: "ข้อมูลสายอักขระ 'AAAAABBBCCCCCC' (14 ตัวอักษร) เมื่อนำมาบีบอัดด้วยอัลกอริทึม Run-Length Encoding (RLE) จะได้ผลลัพธ์ตรงกับข้อใด และใช้หลักการต่างจาก Huffman Coding อย่างไร?",
        options: [
          "ได้รหัส '5A3B6C' โดย RLE ยุบข้อมูลที่เรียงซ้ำติดกัน ส่วน Huffman Coding กำหนดรหัสฐานสองสั้นๆ ให้ตัวอักษรที่มีความถี่ปรากฏบ่อยที่สุด",
          "ได้รหัส 'ABC14' โดย RLE ลบตัวซ้ำทิ้งทั้งหมด",
          "ได้รหัส '6C5A3B' โดยเรียงจากมากไปน้อยเสมอ",
          "ไม่สามารถบีบอัดได้เพราะไม่มีตัวเลขปนอยู่"
        ],
        answer: 0,
        explain: "RLE นับตัวอักษรที่เรียงซ้ำติดกันได้เป็น 5A3B6C ในขณะที่ Huffman Coding จะใช้ความถี่รวมทั้งไฟล์มาสร้างรหัสบิตสั้น-ยาว"
      }
    ]
  }
];
