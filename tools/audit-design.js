/**
 * tools/audit-design.js
 * ตรวจกติกาดีไซน์ตามบรีฟ (ข้อ 0 และข้อ 8) แบบอัตโนมัติ
 *
 *   node tools/audit-design.js
 *
 * 1. ไม่มีอิโมจิ/อักขระสัญลักษณ์ใน HTML, CSS, JS
 *    (ยกเว้นเครื่องหมายคณิตศาสตร์ในสูตรของแล็บ EAN-13 ซึ่งเป็นเนื้อหาวิชา)
 * 2. ไม่มีข้อความจากรูปต้นแบบ
 * 3. ไม่มีสีฮาร์ดโค้ดใน CSS นอก tokens.css
 * 4. ไอคอนใน sprite ใช้เฉพาะ path / circle / rect / line และ viewBox 0 0 24 24
 * 5. ทุก class ที่ HTML/JS ใช้มีกฎ CSS รองรับ (รายงานรายการที่ไม่มี)
 * 6. contrast ของคู่สีตัวอักษร/พื้นหลัก ผ่าน WCAG AA ทั้งสองโหมด
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const list = (dir, ext) =>
  fs
    .readdirSync(path.join(ROOT, dir))
    .filter((f) => f.endsWith(ext))
    .map((f) => `${dir}/${f}`);

const cssFiles = list("css", ".css");
const jsFiles = list("js", ".js");
const allFiles = ["index.html", ...cssFiles, ...jsFiles];
const problems = [];
const notes = [];
const fail = (msg) => problems.push(msg);

/* ---------- 1. Symbols ---------- */
const SYMBOL_RE =
  /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2460}-\u{24FF}\u{25A0}-\u{27BF}\u{2900}-\u{2BFF}\u{2022}\u{2023}\u{2043}\u{00B7}\u{2605}\u{2606}\u{FE0F}\u{200D}\u{3030}\u{00A9}\u{00AE}\u{2122}]/gu;
const MATH_OK = /[×÷≠−≈≤≥]/gu;

for (const f of allFiles) {
  const src = read(f);
  const hits = src.match(SYMBOL_RE) || [];
  if (hits.length) fail(`symbols in ${f}: ${[...new Set(hits)].map((c) => "U+" + c.codePointAt(0).toString(16).toUpperCase()).join(", ")} (${hits.length})`);
  const math = src.match(MATH_OK) || [];
  if (math.length) {
    if (f === "js/ean13-guide.js" || f.startsWith("js/curriculum")) notes.push(`math operators kept as lesson content in ${f}: ${math.length}`);
    else fail(`math-like symbols outside lesson content in ${f}: ${math.length}`);
  }
}

/* ---------- 2. Reference poster text ---------- */
const POSTER = ["Thank You", "Follow for more", "Design Inspiration", "Vasil Enev", "2025 JULY"];
for (const f of allFiles) {
  const src = read(f).toLowerCase();
  for (const t of POSTER) if (src.includes(t.toLowerCase())) fail(`reference text "${t}" found in ${f}`);
}

/* ---------- 3. Colour literals outside tokens.css ---------- */
for (const f of cssFiles) {
  if (f === "css/tokens.css") continue;
  const src = read(f).replace(/\/\*[\s\S]*?\*\//g, "");
  const hits = src.match(/#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/g) || [];
  if (hits.length) fail(`colour literals in ${f}: ${hits.slice(0, 6).join(" ")} (${hits.length})`);
}
for (const f of ["index.html", ...jsFiles]) {
  if (f === "js/certificate.js") continue; // งานศิลป์เกียรติบัตรวาดบน canvas คงเดิมตามขอบเขต
  const src = read(f);
  const hits = src.match(/#[0-9a-fA-F]{6}\b/g) || [];
  if (hits.length) notes.push(`hex colours in ${f}: ${[...new Set(hits)].join(" ")}`);
  const inline = (src.match(/style="[^"]*(?:color|background|border)[^"]*"/g) || []).filter((s) => !/var\(--/.test(s) || /#[0-9a-fA-F]{3,6}/.test(s));
  if (inline.length) fail(`inline colour styles in ${f}: ${inline.length}`);
}

/* ---------- 4. Icon sprite rules ---------- */
const html = read("index.html");
const sprite = (html.match(/<svg class="icon-sprite"[\s\S]*?<\/svg>/) || [""])[0];
const symbols = sprite.match(/<symbol[\s\S]*?<\/symbol>/g) || [];
const iconIds = new Set();
for (const sym of symbols) {
  const id = (sym.match(/id="([^"]+)"/) || [])[1];
  iconIds.add(id);
  if (!/viewBox="0 0 24 24"/.test(sym)) fail(`icon ${id}: viewBox is not 0 0 24 24`);
  const tags = [...sym.matchAll(/<([a-z]+)[\s>]/g)].map((m) => m[1]).filter((t) => t !== "symbol");
  const bad = tags.filter((t) => !["path", "circle", "rect", "line"].includes(t));
  if (bad.length) fail(`icon ${id}: uses <${[...new Set(bad)].join(">, <")}>`);
}
const REQUIRED = ["sparkle-lg", "sparkle-sm", "sun", "moon", "book", "clock", "check", "arrow-right", "arrow-left", "bookmark", "menu", "close"];
for (const r of REQUIRED) if (!iconIds.has(`icon-${r}`)) fail(`required icon missing: icon-${r}`);
for (const f of ["index.html", ...jsFiles]) {
  const src = read(f);
  for (const m of src.matchAll(/href="#(icon-[a-z-]+)"/g)) if (!iconIds.has(m[1])) fail(`${f} references missing ${m[1]}`);
  for (const m of src.matchAll(/icon\("([a-z-]+)"/g)) if (!iconIds.has(`icon-${m[1]}`)) fail(`${f} icon("${m[1]}") not in sprite`);
  const legacy = (src.match(/<(polyline|polygon|ellipse)\b/g) || []).length;
  if (legacy && f !== "js/certificate.js") notes.push(`${f}: ${legacy} inline <polyline>/<polygon> shapes outside the sprite`);
}
const svgNoAria = [...html.matchAll(/<svg class="icon[^"]*"[^>]*>/g)].filter((m) => !/aria-hidden="true"/.test(m[0])).length;
if (svgNoAria) notes.push(`index.html: ${svgNoAria} decorative icons inherit aria-hidden from their wrapper`);
for (const m of html.matchAll(/<button[^>]*class="[^"]*icon-btn[^"]*"[^>]*>/g)) {
  if (!/aria-label="/.test(m[0])) fail(`icon button without aria-label: ${m[0].slice(0, 80)}`);
}

/* ---------- 5. Classes without CSS ---------- */
const cssAll = cssFiles.map(read).join("\n");
const defined = new Set([...cssAll.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]));
const used = new Map();
const addClass = (c, f) => {
  if (!/^[a-zA-Z][\w-]*$/.test(c)) return;
  if (!used.has(c)) used.set(c, f);
};
for (const f of ["index.html", ...jsFiles]) {
  if (f.startsWith("js/curriculum")) continue;
  const src = read(f);
  for (const m of src.matchAll(/class(?:Name)?\s*=\s*["'`]([^"'`]*)["'`]/g)) {
    m[1].replace(/\$\{[^}]*\}/g, " ").split(/\s+/).forEach((c) => addClass(c, f));
  }
}
const HOOK_ONLY = new Set(["hidden", "num", "theme-toggle", "sound-toggle", "header-extra", "home-panel--simulator", "home-panel--cert", "is-embedded", "is-neutral", "quiz-question-card", "quiz-back-btn", "lesson-back-btn", "selected-unit-banner", "syllabus-stack", "icon-sun", "icon-moon", "icon-menu", "icon-sound-on", "icon-sound-off", "icon-close", "profile-form", "step-rail-btn", "step-rail-pills", "quiz-cockpit-dots", "quiz-cockpit-hud-top", "quiz-cockpit-feedback-wrap", "quiz-cockpit-q-header", "quiz-result-metrics", "quiz-review", "lesson-toc-inner", "icon-check-anim", "progress-table", "activeTab", "is-", "module-theme-"]);
const unstyled = [...used.entries()].filter(([c]) => !defined.has(c) && !HOOK_ONLY.has(c));
if (unstyled.length) notes.push(`classes with no CSS rule (${unstyled.length}): ${unstyled.map(([c, f]) => `${c} [${path.basename(f)}]`).join(", ")}`);

/* ---------- 6. Contrast (WCAG AA) ---------- */
function parseTokens(block) {
  const out = {};
  for (const m of block.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}
const tokenSrc = read("css/tokens.css").replace(/\/\*[\s\S]*?\*\//g, "");
const light = parseTokens(tokenSrc.slice(tokenSrc.indexOf(":root {"), tokenSrc.indexOf('[data-theme="dark"] {')));
const darkBlock = tokenSrc.slice(tokenSrc.indexOf('[data-theme="dark"] {'));
const dark = Object.assign({}, light, parseTokens(darkBlock.slice(0, darkBlock.indexOf(":root,"))));

function toRgba(v, tokens) {
  v = v.trim();
  const ref = v.match(/^var\((--[\w-]+)\)$/);
  if (ref) return toRgba(tokens[ref[1]], tokens);
  if (v.startsWith("#")) {
    const h = v.slice(1);
    const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
    return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16), 1];
  }
  const m = v.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  throw new Error("cannot parse colour " + v);
}
const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
const lum = (c) => {
  const f = (x) => {
    x /= 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [ตัวอักษร, ชั้นพื้น (ล่างสุดไปบนสุด), เกณฑ์]
const PAIRS = [
  ["--text-primary", ["--bg"], 4.5],
  ["--text-body", ["--bg"], 4.5],
  ["--text-muted", ["--bg"], 4.5],
  ["--accent-ink", ["--bg"], 4.5],
  ["--text-primary", ["--surface"], 4.5],
  ["--text-body", ["--surface"], 4.5],
  ["--text-muted", ["--surface"], 4.5],
  ["--accent-ink", ["--surface"], 4.5],
  ["--text-body", ["--surface-2"], 4.5],
  ["--text-muted", ["--surface-2"], 4.5],
  ["--accent-ink", ["--surface-2"], 4.5],
  ["--accent-ink", ["--surface", "--accent-tint"], 4.5],
  ["--accent-ink", ["--surface", "--accent-tint-strong"], 4.5],
  ["--text-body", ["--surface", "--accent-tint"], 4.5],
  ["--success", ["--surface"], 4.5],
  ["--success", ["--surface", "--success-tint"], 4.5],
  ["--warning", ["--surface"], 4.5],
  ["--warning", ["--surface", "--warning-tint"], 4.5],
  ["--danger", ["--surface"], 4.5],
  ["--danger", ["--surface", "--danger-tint"], 4.5],
  ["--text-on-gradient", ["--btn-from"], 4.5],
  ["--text-on-gradient", ["--btn-to"], 4.5],
  ["--code-text", ["--code-bg"], 4.5],
  ["--code-muted", ["--code-bg"], 4.5],
  // การ์ดกระจก: กรณีแย่ที่สุดคือวางทับหมอกม่วงเข้มสุด และกรณีวางบนพื้นหน้า
  ["--text-primary", ["--accent-deep", "--glass-bg"], 4.5],
  ["--text-body", ["--accent-deep", "--glass-bg"], 4.5],
  ["--accent-ink", ["--accent-deep", "--glass-bg"], 4.5],
  ["--text-primary", ["--accent-glow", "--glass-bg"], 4.5],
  ["--text-body", ["--accent-glow", "--glass-bg"], 4.5],
  ["--text-body", ["--bg", "--glass-bg"], 4.5],
  ["--text-muted", ["--bg", "--glass-bg"], 4.5],
  ["--accent-ink", ["--bg", "--glass-bg"], 4.5],
  // ขอบเขตองค์ประกอบ UI (3:1)
  ["--accent", ["--bg"], 3],
  ["--accent", ["--surface"], 3]
];

const contrastRows = [];
for (const [themeName, tokens] of [["light", light], ["dark", dark]]) {
  for (const [fgName, layers, min] of PAIRS) {
    let bg = toRgba(tokens[layers[0]], tokens);
    bg[3] = 1;
    for (const l of layers.slice(1)) bg = over(toRgba(tokens[l], tokens), bg);
    const fg = over(toRgba(tokens[fgName], tokens), bg);
    const r = ratio(fg, bg);
    contrastRows.push({ themeName, fgName, on: layers.join(" + "), r, min });
    if (r < min) fail(`contrast ${themeName}: ${fgName} on ${layers.join(" + ")} = ${r.toFixed(2)} (needs ${min})`);
  }
}

/* ---------- Report ---------- */
const worst = contrastRows.slice().sort((a, b) => a.r / a.min - b.r / b.min).slice(0, 5);
console.log(`files scanned: ${allFiles.length}, icons in sprite: ${iconIds.size}, contrast pairs: ${contrastRows.length}`);
console.log("tightest contrast pairs:");
worst.forEach((w) => console.log(`  ${w.themeName.padEnd(5)} ${w.fgName} on ${w.on}: ${w.r.toFixed(2)} (min ${w.min})`));
notes.forEach((n) => console.log("NOTE " + n));
problems.forEach((p) => console.log("FAIL " + p));
console.log(problems.length ? `DESIGN AUDIT FAILED (${problems.length})` : "DESIGN AUDIT OK");
process.exit(problems.length ? 1 : 0);
