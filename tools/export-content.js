/**
 * tools/export-content.js
 * รวมเนื้อหาบทเรียนทั้ง 16 หน่วย พร้อมข้อสอบและเฉลย เป็นเอกสาร Markdown ไฟล์เดียวสำหรับอ่านและตรวจทาน
 *
 *   node tools/export-content.js            -> docs/เนื้อหาบทเรียนทั้งหมด.md
 *
 * ไฟล์ที่ได้เป็นสำเนาสำหรับอ่านเท่านั้น เว็บไซต์ยังใช้ข้อมูลจาก js/curriculum-part1.js และ js/curriculum-part2.js
 */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const win = {};
win.window = win;
const ctx = vm.createContext({ window: win, console });
for (const f of ["js/config.js", "js/curriculum-part1.js", "js/curriculum-part2.js"]) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx);
}
const CFG = win.APP_CONFIG;
const DATA = win.CURRICULUM_DATA;

const plain = (t) => String(t == null ? "" : t).replace(/\*\*/g, "").trim();
const cell = (t) => plain(t).replace(/\|/g, "/").replace(/\n/g, "<br>");
const para = (t) => plain(t).split("\n").join("  \n");
const LETTERS = ["ก", "ข", "ค", "ง"];

function renderBlock(b) {
  switch (b.type) {
    case "paragraph":
      return para(b.text);
    case "callout":
      return `> **${plain(b.title)}**  \n> ${plain(b.text).split("\n").join("  \n> ")}`;
    case "table": {
      const head = `| ${b.headers.map(cell).join(" | ")} |\n|${b.headers.map(() => "---").join("|")}|`;
      const rows = b.rows.map((r) => `| ${r.map(cell).join(" | ")} |`).join("\n");
      return `${b.caption ? `*${plain(b.caption)}*\n\n` : ""}${head}\n${rows}`;
    }
    case "cards":
      return b.items.map((it) => `- **${plain(it.label)}**  \n  ${plain(it.detail).split("\n").join("  \n  ")}`).join("\n");
    case "flow":
      return b.steps.map((st, i) => `${i + 1}. **${plain(st.stepTitle)}** ${plain(st.stepDesc)}`).join("\n");
    case "image":
      return `*[ภาพประกอบ] ${plain(b.caption || b.alt)}*`;
    case "video":
      return `*[วิดีโอ] ${plain(b.caption || b.title || b.src)}*`;
    case "ean13-guide":
      return "*[กิจกรรมโต้ตอบบนเว็บ] คู่มือคำนวณตัวเลขตรวจสอบ EAN-13 ทีละขั้น*";
    default:
      return b.text ? para(b.text) : `*[บล็อกชนิด ${b.type}]*`;
  }
}

const out = [];
out.push(`# เนื้อหาบทเรียนทั้งหมด รายวิชา ${CFG.COURSE_CODE || "21901-2017"}`);
out.push("");
out.push("เอกสารนี้สร้างอัตโนมัติจากไฟล์เนื้อหาของเว็บไซต์ ใช้สำหรับอ่านและตรวจทาน ถ้าต้องการแก้เนื้อหาบนเว็บ ต้องแก้ที่ไฟล์ `js/curriculum-part1.js` และ `js/curriculum-part2.js` แล้วสร้างเอกสารนี้ใหม่");
out.push("");

let steps = 0;
let questions = 0;
out.push("## สารบัญ");
out.push("");
for (const u of CFG.UNITS_METADATA) out.push(`- หน่วยที่ ${u.no} ${plain(u.title)}`);
out.push("");

for (const u of CFG.UNITS_METADATA) {
  const unit = DATA[u.no];
  if (!unit) continue;
  out.push("---");
  out.push("");
  out.push(`# หน่วยที่ ${u.no} ${plain(u.title)}`);
  out.push("");
  out.push(plain(u.subtitle));
  out.push("");
  for (const s of unit.steps) {
    steps++;
    out.push(`## ${u.no}.${s.stepNo} ${plain(s.title)}`);
    out.push("");
    out.push(`*${plain(s.lead)}*`);
    out.push("");
    for (const b of s.blocks) {
      out.push(renderBlock(b));
      out.push("");
    }
    out.push(`**สรุปประเด็นสำคัญ** ${plain(s.keyTakeaway)}`);
    out.push("");
  }
  out.push(`## แบบทดสอบท้ายหน่วยที่ ${u.no} (คลังข้อสอบ ${unit.quiz.length} ข้อ สุ่มครั้งละ ${CFG.QUESTIONS_PER_UNIT} ข้อ)`);
  out.push("");
  unit.quiz.forEach((q, i) => {
    questions++;
    out.push(`**ข้อ ${i + 1}** ${plain(q.q)}`);
    out.push("");
    q.choices.forEach((c, ci) => out.push(`- ${LETTERS[ci]}. ${plain(c)}${ci === q.answer ? " **(เฉลย)**" : ""}`));
    out.push("");
    out.push(`คำอธิบาย ${plain(q.explanation)}`);
    out.push("");
  });
}

const file = path.join(ROOT, "docs", "เนื้อหาบทเรียนทั้งหมด.md");
fs.writeFileSync(file, out.join("\n"));
console.log(`เขียนไฟล์แล้ว ${path.relative(ROOT, file)} (${CFG.UNITS_METADATA.length} หน่วย ${steps} สเต็ป ${questions} ข้อ)`);
