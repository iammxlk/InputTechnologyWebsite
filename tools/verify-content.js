/**
 * tools/verify-content.js
 * ตรวจว่าเนื้อหาบทเรียนและข้อสอบไม่หายหรือเปลี่ยนระหว่างรีดีไซน์
 *
 *   node tools/verify-content.js            เทียบกับ baseline (exit 1 ถ้าไม่ตรง)
 *   node tools/verify-content.js --write    บันทึก baseline ใหม่
 *
 * ลายนิ้วมือ "text" นับเฉพาะตัวอักษร ตัวเลข และสระ/วรรณยุกต์
 * จึงไม่เปลี่ยนเมื่อแทนลูกศรหรือสัญลักษณ์ตกแต่งด้วยไอคอน แต่เปลี่ยนทันทีถ้าข้อความหาย
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");
const crypto = require("crypto");

const ROOT = path.resolve(__dirname, "..");
const BASELINE = path.join(__dirname, "content-baseline.json");
const FILES = ["js/config.js", "js/curriculum-part1.js", "js/curriculum-part2.js"];

const sha = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex").slice(0, 16);
const textOnly = (v) => JSON.stringify(v).replace(/[^\p{L}\p{N}\p{M}]/gu, "");

function load() {
  const win = {};
  win.window = win;
  const ctx = vm.createContext({ window: win, console, document: undefined });
  for (const f of FILES) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), "utf8"), ctx, { filename: f });
  }
  return win;
}

function snapshot() {
  const w = load();
  const cfg = w.APP_CONFIG;
  const data = w.CURRICULUM_DATA;
  const units = {};
  let steps = 0;
  let blocks = 0;
  let questions = 0;

  for (const key of Object.keys(data).sort((a, b) => a - b)) {
    const u = data[key];
    const quiz = u.quiz || [];
    const blockCount = u.steps.reduce((n, s) => n + (s.blocks || []).length, 0);
    steps += u.steps.length;
    blocks += blockCount;
    questions += quiz.length;
    units[key] = {
      steps: u.steps.length,
      blocks: blockCount,
      questions: quiz.length,
      lessonText: sha(textOnly(u.steps)),
      quizText: sha(textOnly(quiz)),
      answers: quiz.map((q) => q.answer).join("")
    };
  }

  return {
    totals: { units: Object.keys(data).length, steps, blocks, questions },
    config: {
      totalUnits: cfg.TOTAL_UNITS,
      questionsPerUnit: cfg.QUESTIONS_PER_UNIT,
      passScore: cfg.PASS_SCORE_PER_UNIT,
      unitsMeta: sha(textOnly(cfg.UNITS_METADATA)),
      modules: sha(textOnly(cfg.MODULES_SYLLABUS)),
      course: sha(
        textOnly([
          cfg.COURSE_CODE,
          cfg.COURSE_NAME_TH,
          cfg.COURSE_CREDITS_TH,
          cfg.LEVEL_PROGRAM_TH,
          cfg.SCHOOL_NAME_TH,
          cfg.INSTITUTE_NAME_TH,
          cfg.INSTRUCTOR_NAME_TH,
          cfg.ACADEMIC_YEAR_TH
        ])
      )
    },
    units
  };
}

function missingImages() {
  const out = [];
  for (const f of FILES.slice(1)) {
    const src = fs.readFileSync(path.join(ROOT, f), "utf8");
    for (const m of src.match(/images\/[A-Za-z0-9_\-./]+\.(?:jpg|png|svg)/g) || []) {
      if (!fs.existsSync(path.join(ROOT, m))) out.push(m);
    }
  }
  return [...new Set(out)];
}

const snap = snapshot();
const missing = missingImages();

if (process.argv.includes("--write")) {
  fs.writeFileSync(BASELINE, JSON.stringify(snap, null, 2) + "\n");
  console.log("baseline written:", JSON.stringify(snap.totals));
  process.exit(0);
}

const base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
const problems = [];
const cmp = (label, a, b) => {
  if (JSON.stringify(a) !== JSON.stringify(b)) problems.push(`${label}: baseline ${JSON.stringify(a)} -> now ${JSON.stringify(b)}`);
};

cmp("totals", base.totals, snap.totals);
for (const k of Object.keys(base.config)) cmp(`config.${k}`, base.config[k], snap.config[k]);
for (const k of Object.keys(base.units)) {
  if (!snap.units[k]) {
    problems.push(`unit ${k}: missing`);
    continue;
  }
  for (const f of Object.keys(base.units[k])) cmp(`unit ${k}.${f}`, base.units[k][f], snap.units[k][f]);
}
for (const m of missing) problems.push(`missing image: ${m}`);

if (problems.length) {
  console.log("CONTENT CHECK FAILED");
  problems.forEach((p) => console.log(" - " + p));
  process.exit(1);
}
console.log("CONTENT OK:", JSON.stringify(snap.totals), "images ok");
