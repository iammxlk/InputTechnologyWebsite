/**
 * ============================================================================
 * js/api.js — Backend Transport Layer (Google Apps Script + Local Sandbox Mirror)
 * รองรับ:
 *   1. ย่อขนาดและครอปรูปโปรไฟล์เป็นจัตุรัส 256x256 px แปลงเป็น Base64
 *   2. ส่งข้อมูลไปยัง Code.gs แบบ CORS-Safe (Content-Type: text/plain;charset=utf-8)
 *   3. โหมดจำลองฐานข้อมูล 4 แท็บอัตโนมัติในเบราว์เซอร์เมื่อยังไม่ได้ตั้งค่า GAS_WEB_APP_URL
 * ============================================================================
 */

(function () {
  const CFG = window.APP_CONFIG;

  function isCloudConfigured() {
    const url = String(CFG.GAS_WEB_APP_URL || "").trim();
    return url.startsWith("https://script.google.com/macros/s/");
  }

  /**
   * ย่อและครอปรูปภาพกึ่งกลางให้เป็นสี่เหลี่ยมจัตุรัส แปลงเป็น Data URL (Base64)
   */
  function compressImageToBase64(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || !file.type.startsWith("image/")) {
        reject(new Error("กรุณาเลือกไฟล์รูปภาพ (.JPG, .PNG หรือ .WEBP) เท่านั้น"));
        return;
      }

      const reader = new FileReader();
      reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์รูปภาพได้"));
      reader.onload = (ev) => {
        const img = new Image();
        img.onerror = () => reject(new Error("ไฟล์รูปภาพไม่สมบูรณ์"));
        img.onload = () => {
          const targetSize = CFG.AVATAR_SIZE_PX || 256;
          const canvas = document.createElement("canvas");
          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext("2d");

          // Center-crop square
          const minSide = Math.min(img.width, img.height);
          const sx = Math.floor((img.width - minSide) / 2);
          const sy = Math.floor((img.height - minSide) / 2);

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, targetSize, targetSize);
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, targetSize, targetSize);

          const base64Url = canvas.toDataURL(
            "image/jpeg",
            CFG.AVATAR_JPEG_QUALITY || 0.84
          );
          resolve(base64Url);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ==========================================================================
     LOCAL SANDBOX MIRROR (จำลอง Google Sheets 4 แท็บเมื่อยังไม่ได้ผูก URL จริง)
     ========================================================================== */

  async function sha256HexBrowser(text) {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    // Fallback hash สำหรับสภาพแวดล้อมที่ไม่ใช่ HTTPS
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16).padStart(8, "0");
  }

  function loadLocalDb() {
    const now = new Date().toISOString();
    try {
      const raw = localStorage.getItem(CFG.STORAGE_KEYS.LOCAL_DB_MIRROR);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore corrupted storage
    }

    // สร้างฐานข้อมูลเริ่มต้นพร้อมข้อมูลตัวอย่างเพื่อนร่วมชั้นเพื่อทดสอบในโหมด sandbox
    const seeded = {
      users: [
        {
          student_id: "6720101001",
          password_hash: "addf43303d1baaebaa4c046b078561ba8e687a5f4a8db3ea81093b6071fe632a",
          salt: "seed1",
          full_name: "นางสาวพิมพ์ชนก วัฒนากูล",
          avatar_url: window.AppUtils.buildInitialsAvatarDataUrl("พิมพ์ชนก วัฒนากูล"),
          passed_units_count: 10,
          progress_percent: 63,
          total_quiz_score: 92,
          total_game_score: 28,
          grand_total_score: 120,
          total_time_sec: 485,
          cert_unlocked: false,
          cert_issued_at: "",
          created_at: now,
          updated_at: now
        },
        {
          student_id: "6720101002",
          password_hash: "6cb1215605eba93b9e528e09219f2098480e68d2d78a45136a942c3fd9af9c42",
          salt: "seed2",
          full_name: "นายธนภัทร ศรีสุวรรณ",
          avatar_url: window.AppUtils.buildInitialsAvatarDataUrl("ธนภัทร ศรีสุวรรณ"),
          passed_units_count: 10,
          progress_percent: 63,
          total_quiz_score: 90,
          total_game_score: 30,
          grand_total_score: 120,
          total_time_sec: 512,
          cert_unlocked: false,
          cert_issued_at: "",
          created_at: now,
          updated_at: now
        },
        {
          student_id: "6720101003",
          password_hash: "c68cd4383638886f66044327b367f8734356b0c7c14a0659a3a180d5e028a132",
          salt: "seed3",
          full_name: "นายกิตติพงศ์ อินทร์จันทร์",
          avatar_url: window.AppUtils.buildInitialsAvatarDataUrl("กิตติพงศ์ อินทร์จันทร์"),
          passed_units_count: 7,
          progress_percent: 44,
          total_quiz_score: 64,
          total_game_score: 18,
          grand_total_score: 82,
          total_time_sec: 390,
          cert_unlocked: false,
          cert_issued_at: "",
          created_at: now,
          updated_at: now
        },
        {
          student_id: "6720101004",
          password_hash: "1a1b5e650cfe0c74f6188834820cbfe63ca16f748582b03292e298d4a95cee18",
          salt: "seed4",
          full_name: "นางสาวณัฐณิชา โพธิ์ทอง",
          avatar_url: window.AppUtils.buildInitialsAvatarDataUrl("ณัฐณิชา โพธิ์ทอง"),
          passed_units_count: 6,
          progress_percent: 38,
          total_quiz_score: 54,
          total_game_score: 16,
          grand_total_score: 70,
          total_time_sec: 342,
          cert_unlocked: false,
          cert_issued_at: "",
          created_at: now,
          updated_at: now
        },
        {
          student_id: "6720101005",
          password_hash: "1e8669c7cd73d3a533faf55abe2c2856a09a84cbce9b66dc9642168f48ad9343",
          salt: "seed5",
          full_name: "นายภูวดล วงศ์สวัสดิ์",
          avatar_url: window.AppUtils.buildInitialsAvatarDataUrl("ภูวดล วงศ์สวัสดิ์"),
          passed_units_count: 4,
          progress_percent: 25,
          total_quiz_score: 36,
          total_game_score: 10,
          grand_total_score: 46,
          total_time_sec: 228,
          cert_unlocked: false,
          cert_issued_at: "",
          created_at: now,
          updated_at: now
        }
      ],
      unit_progress: {
        "6720101001": {
          1: { unit_no: 1, steps_completed: 6, is_content_read: true, best_quiz_score: 10, best_quiz_time_sec: 42, is_passed: true, attempts_count: 1, updated_at: now },
          2: { unit_no: 2, steps_completed: 6, is_content_read: true, best_quiz_score: 9, best_quiz_time_sec: 45, is_passed: true, attempts_count: 1, updated_at: now },
          3: { unit_no: 3, steps_completed: 6, is_content_read: true, best_quiz_score: 10, best_quiz_time_sec: 48, is_passed: true, attempts_count: 1, updated_at: now },
          4: { unit_no: 4, steps_completed: 6, is_content_read: true, best_quiz_score: 9, best_quiz_time_sec: 50, is_passed: true, attempts_count: 1, updated_at: now },
          5: { unit_no: 5, steps_completed: 6, is_content_read: true, best_quiz_score: 10, best_quiz_time_sec: 44, is_passed: true, attempts_count: 1, updated_at: now },
          6: { unit_no: 6, steps_completed: 6, is_content_read: true, best_quiz_score: 9, best_quiz_time_sec: 46, is_passed: true, attempts_count: 1, updated_at: now },
          7: { unit_no: 7, steps_completed: 6, is_content_read: true, best_quiz_score: 9, best_quiz_time_sec: 52, is_passed: true, attempts_count: 1, updated_at: now },
          8: { unit_no: 8, steps_completed: 6, is_content_read: true, best_quiz_score: 10, best_quiz_time_sec: 49, is_passed: true, attempts_count: 1, updated_at: now },
          9: { unit_no: 9, steps_completed: 6, is_content_read: true, best_quiz_score: 8, best_quiz_time_sec: 54, is_passed: true, attempts_count: 1, updated_at: now },
          10: { unit_no: 10, steps_completed: 6, is_content_read: true, best_quiz_score: 8, best_quiz_time_sec: 55, is_passed: true, attempts_count: 1, updated_at: now }
        }
      },
      activity_logs: []
    };
    saveLocalDb(seeded);
    return seeded;
  }

  function saveLocalDb(db) {
    try {
      localStorage.setItem(CFG.STORAGE_KEYS.LOCAL_DB_MIRROR, JSON.stringify(db));
    } catch (e) {
      // พื้นที่เก็บข้อมูลเต็มหรือถูกปิด: ทำงานต่อด้วยข้อมูลในหน่วยความจำ
    }
  }

  function sanitizeUser(u) {
    if (!u) return null;
    return {
      student_id: String(u.student_id || ""),
      full_name: u.full_name || "นักเรียน",
      avatar_url: u.avatar_url || (u.full_name ? window.AppUtils.buildInitialsAvatarDataUrl(u.full_name) : ""),
      passed_units_count: Number(u.passed_units_count || 0),
      progress_percent: Number(u.progress_percent || 0),
      total_quiz_score: Number(u.total_quiz_score || 0),
      total_game_score: Number(u.total_game_score || 0),
      grand_total_score: Number(u.grand_total_score || 0),
      total_time_sec: Number(u.total_time_sec || 0),
      cert_unlocked: Boolean(u.cert_unlocked),
      cert_issued_at: u.cert_issued_at || "",
      created_at: u.created_at || "",
      updated_at: u.updated_at || ""
    };
  }

  function recalculateLocalUser(db, studentId) {
    const key = String(studentId || "").trim().toLowerCase();
    if (!key) return null;
    let user = db.users.find((x) => x && x.student_id && x.student_id.toLowerCase() === key);
    if (!user) {
      const current = window.AuthManager?.getCurrentUser();
      if (current && current.student_id && current.student_id.toLowerCase() === key) {
        user = {
          student_id: current.student_id,
          full_name: current.full_name || "นักเรียน " + current.student_id,
          avatar_url: current.avatar_url || "",
          password_hash: "",
          salt: "",
          passed_units_count: Number(current.passed_units_count || 0),
          progress_percent: Number(current.progress_percent || 0),
          total_quiz_score: Number(current.total_quiz_score || 0),
          total_game_score: Number(current.total_game_score || 0),
          grand_total_score: Number(current.grand_total_score || 0),
          total_time_sec: Number(current.total_time_sec || 0),
          cert_unlocked: Boolean(current.cert_unlocked),
          cert_issued_at: current.cert_issued_at || "",
          created_at: current.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.users.push(user);
      } else {
        user = {
          student_id: String(studentId).trim(),
          full_name: "นักเรียน " + String(studentId).trim(),
          avatar_url: "",
          password_hash: "",
          salt: "",
          passed_units_count: 0,
          progress_percent: 0,
          total_quiz_score: 0,
          total_game_score: 0,
          grand_total_score: 0,
          total_time_sec: 0,
          cert_unlocked: false,
          cert_issued_at: "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.users.push(user);
      }
    }

    if (!db.unit_progress[user.student_id]) db.unit_progress[user.student_id] = {};

    const uMap = db.unit_progress[user.student_id] || {};

    let passedCount = 0;
    let totalQuiz = 0;
    let totalTime = 0;

    Object.keys(uMap).forEach((uNo) => {
      const item = uMap[uNo];
      if (item && item.is_passed) passedCount += 1;
      totalQuiz += Number((item && item.best_quiz_score) || 0);
      if (item && item.attempts_count > 0) {
        totalTime += Number(item.best_quiz_time_sec || 0);
      }
    });

    user.passed_units_count = passedCount;
    user.progress_percent = Math.round((passedCount / CFG.TOTAL_UNITS) * 100);
    user.total_quiz_score = totalQuiz;
    user.total_game_score = 0;
    user.grand_total_score = totalQuiz;
    user.total_time_sec = totalTime;
    user.cert_unlocked = passedCount >= CFG.TOTAL_UNITS;
    if (user.cert_unlocked && !user.cert_issued_at) {
      user.cert_issued_at = new Date().toISOString();
    }
    user.updated_at = new Date().toISOString();
    return user;
  }

  async function executeLocalRequest(payload) {
    const db = loadLocalDb();
    const action = payload.action;
    const now = new Date().toISOString();

    if (action === "register") {
      const studentId = String(payload.student_id || "").trim();
      const password = String(payload.password || "");
      const fullName = String(payload.full_name || "").trim();
      const avatarBase64 = String(payload.avatar_base64 || "");

      if (!studentId || !/^\d+$/.test(studentId)) {
        return { ok: false, error: "รหัสนักเรียน (Username) ต้องเป็นตัวเลขเท่านั้น" };
      }
      if (studentId.length < 3) {
        return { ok: false, error: "รหัสนักเรียนต้องมีอย่างน้อย 3 ตัวเลข" };
      }
      if (!password || password.length < 8) {
        return { ok: false, error: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" };
      }
      if (!/[A-Z]/.test(password)) {
        return { ok: false, error: "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว" };
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
        return { ok: false, error: "รหัสผ่านต้องมีอักขระพิเศษ (เช่น !@#$%^&*) อย่างน้อย 1 ตัว" };
      }
      if (!fullName) {
        return { ok: false, error: "กรุณากรอกชื่อ-นามสกุลจริง" };
      }
      if (!avatarBase64) {
        return { ok: false, error: "กรุณาอัปโหลดรูปโปรไฟล์ก่อนสมัครสมาชิก" };
      }

      const dup = db.users.find(
        (u) => u.student_id.toLowerCase() === studentId.toLowerCase()
      );
      if (dup && dup.password_hash) {
        return { ok: false, error: `รหัสนักเรียน ${studentId} มีในระบบแล้ว กรุณาเข้าสู่ระบบ` };
      }

      const salt = (dup && dup.salt) || Math.random().toString(36).slice(2, 12);
      const passwordHash = await sha256HexBrowser(`${password}::${salt}`);

      let targetUser = dup;
      if (targetUser) {
        targetUser.password_hash = passwordHash;
        targetUser.salt = salt;
        targetUser.full_name = fullName;
        targetUser.avatar_url = avatarBase64;
        targetUser.updated_at = now;
      } else {
        targetUser = {
          student_id: studentId,
          password_hash: passwordHash,
          salt: salt,
          full_name: fullName,
          avatar_url: avatarBase64,
          passed_units_count: 0,
          progress_percent: 0,
          total_quiz_score: 0,
          total_game_score: 0,
          grand_total_score: 0,
          total_time_sec: 0,
          cert_unlocked: false,
          cert_issued_at: "",
          created_at: now,
          updated_at: now
        };
        db.users.push(targetUser);
        if (!db.unit_progress[studentId]) db.unit_progress[studentId] = {};
      }

      db.activity_logs.push({
        timestamp: now,
        student_id: studentId,
        action_type: "REGISTER",
        target_id: "ACCOUNT",
        score: 0,
        time_sec: 0,
        is_passed: true
      });
      saveLocalDb(db);

      return {
        ok: true,
        user: sanitizeUser(targetUser),
        unit_progress: db.unit_progress[studentId] || {}
      };
    }

    if (action === "login") {
      const studentId = String(payload.student_id || "").trim();
      const password = String(payload.password || "");
      const found = db.users.find(
        (u) => u.student_id.toLowerCase() === studentId.toLowerCase()
      );

      if (!found) {
        return { ok: false, error: "ไม่พบรหัสนักเรียนนี้ในระบบ กรุณาสมัครสมาชิกก่อน" };
      }

      if (!found.password_hash) {
        if (password === "1234" || password === studentId) {
          const newSalt = found.salt || Math.random().toString(36).slice(2, 12);
          found.salt = newSalt;
          found.password_hash = await sha256HexBrowser(`${password}::${newSalt}`);
          found.updated_at = now;
          saveLocalDb(db);
        } else {
          return { ok: false, error: "รหัสผ่านไม่ถูกต้อง (บัญชีจำลองเริ่มต้นใช้รหัสผ่าน 1234)" };
        }
      } else {
        const checkHash = await sha256HexBrowser(`${password}::${found.salt}`);
        if (checkHash !== found.password_hash) {
          return { ok: false, error: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" };
        }
      }

      const updated = recalculateLocalUser(db, found.student_id);
      saveLocalDb(db);

      return {
        ok: true,
        user: sanitizeUser(updated || found),
        unit_progress: db.unit_progress[found.student_id] || {}
      };
    }

    if (action === "get_session") {
      const studentId = String(payload.student_id || "").trim();
      const found = db.users.find(
        (u) => u.student_id.toLowerCase() === studentId.toLowerCase()
      );
      if (!found) {
        return { ok: false, error: "ไม่พบบัญชีผู้ใช้งานในระบบ" };
      }
      return {
        ok: true,
        user: sanitizeUser(found),
        unit_progress: db.unit_progress[found.student_id] || {}
      };
    }

    if (action === "change_password") {
      const studentId = String(payload.student_id || "").trim();
      const currentPwd = String(payload.current_password || "");
      const newPwd = String(payload.new_password || "");

      if (!newPwd || newPwd.length < 8) {
        return { ok: false, error: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร" };
      }
      if (!/[A-Z]/.test(newPwd)) {
        return { ok: false, error: "รหัสผ่านใหม่ต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว" };
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPwd)) {
        return { ok: false, error: "รหัสผ่านใหม่ต้องมีอักขระพิเศษ (เช่น !@#$%^&*) อย่างน้อย 1 ตัว" };
      }

      const found = db.users.find(
        (u) => u.student_id.toLowerCase() === studentId.toLowerCase()
      );
      if (!found) return { ok: false, error: "ไม่พบบัญชีผู้ใช้งาน" };

      const currentHash = await sha256HexBrowser(`${currentPwd}::${found.salt}`);
      if (currentHash !== found.password_hash) {
        return { ok: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
      }

      const newSalt = Math.random().toString(36).slice(2, 12);
      found.salt = newSalt;
      found.password_hash = await sha256HexBrowser(`${newPwd}::${newSalt}`);
      found.updated_at = now;
      saveLocalDb(db);

      return { ok: true, message: "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว" };
    }

    if (action === "update_profile") {
      const studentId = String(payload.student_id || "").trim();
      const found = db.users.find(
        (u) => u.student_id.toLowerCase() === studentId.toLowerCase()
      );
      if (!found) return { ok: false, error: "ไม่พบบัญชีผู้ใช้งาน" };

      if (payload.full_name && String(payload.full_name).trim()) {
        found.full_name = String(payload.full_name).trim();
      }
      if (payload.avatar_base64) {
        found.avatar_url = payload.avatar_base64;
      }
      found.updated_at = now;
      saveLocalDb(db);

      return { ok: true, user: sanitizeUser(found) };
    }

    if (action === "save_step_progress") {
      const studentId = String(payload.student_id || "").trim();
      const unitNo = Number(payload.unit_no || 0);
      if (!db.unit_progress[studentId]) db.unit_progress[studentId] = {};
      const prev = db.unit_progress[studentId][unitNo] || {
        unit_no: unitNo,
        steps_completed: 0,
        is_content_read: false,
        best_quiz_score: 0,
        best_quiz_time_sec: 0,
        is_passed: false,
        attempts_count: 0
      };

      prev.steps_completed = Math.max(prev.steps_completed, Number(payload.steps_completed || 0));
      prev.is_content_read = Boolean(prev.is_content_read || payload.is_content_read);
      prev.is_passed = prev.is_content_read && prev.best_quiz_score >= CFG.PASS_SCORE_PER_UNIT;
      prev.updated_at = now;

      db.unit_progress[studentId][unitNo] = prev;
      const updated = recalculateLocalUser(db, studentId);
      saveLocalDb(db);

      return {
        ok: true,
        user: sanitizeUser(updated),
        unit_progress: db.unit_progress[studentId]
      };
    }

    if (action === "submit_unit_quiz") {
      const studentId = String(payload.student_id || "").trim();
      const unitNo = Number(payload.unit_no || 0);
      const score = Math.max(0, Math.min(10, Number(payload.score || 0)));
      const timeSec = Math.max(1, Math.round(Number(payload.time_sec || 1)));

      if (!db.unit_progress[studentId]) db.unit_progress[studentId] = {};
      const prev = db.unit_progress[studentId][unitNo] || {
        unit_no: unitNo,
        steps_completed: 1,
        is_content_read: true,
        best_quiz_score: 0,
        best_quiz_time_sec: 0,
        is_passed: false,
        attempts_count: 0
      };

      prev.is_content_read = true;
      prev.attempts_count += 1;

      if (
        prev.best_quiz_time_sec === 0 ||
        score > prev.best_quiz_score ||
        (score === prev.best_quiz_score && timeSec < prev.best_quiz_time_sec)
      ) {
        prev.best_quiz_score = score;
        prev.best_quiz_time_sec = timeSec;
      }
      prev.is_passed = prev.best_quiz_score >= CFG.PASS_SCORE_PER_UNIT;
      prev.updated_at = now;

      db.unit_progress[studentId][unitNo] = prev;
      const updated = recalculateLocalUser(db, studentId);
      saveLocalDb(db);

      return {
        ok: true,
        passed_attempt: score >= CFG.PASS_SCORE_PER_UNIT,
        user: sanitizeUser(updated) || { student_id: studentId },
        unit_progress: db.unit_progress[studentId]
      };
    }

    if (action === "claim_certificate") {
      const studentId = String(payload.student_id || "").trim();
      const updated = recalculateLocalUser(db, studentId);
      if (!updated || !updated.cert_unlocked) {
        return {
          ok: false,
          error: "ต้องเรียนและสอบผ่านเกณฑ์ 80% ครบทั้ง 16 หน่วย (100%) ก่อนรับเกียรติบัตร"
        };
      }
      saveLocalDb(db);
      return { ok: true, user: sanitizeUser(updated) || { student_id: studentId } };
    }

    return { ok: false, error: `ไม่รองรับคำสั่ง ${action}` };
  }

  /* ==========================================================================
     UNIFIED REQUEST DISPATCHER
     ========================================================================== */

  // Apps Script ตอบช้าได้เมื่อมีผู้ใช้พร้อมกันทั้งห้อง (รอคิวล็อกและอัปโหลดรูปขึ้น Drive)
  const CLOUD_TIMEOUT_MS = 20000;
  const OFFLINE_ERROR = "เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง";

  async function postAction(action, data = {}) {
    const payload = Object.assign({ action: action }, data);
    const sid = String(data.student_id || payload.student_id || "").trim().toLowerCase();

    // โหมดจำลอง (ไม่ได้ตั้งค่า Google Apps Script): ทำงานกับฐานข้อมูลในเครื่องทั้งหมด
    if (!isCloudConfigured()) {
      return executeLocalRequest(payload);
    }

    // เมื่อเชื่อมต่อคลาวด์แล้ว เซิร์ฟเวอร์เป็นผู้ตัดสินเพียงผู้เดียว
    // ห้ามใช้ฐานข้อมูลในเครื่องตรวจรหัสผ่านหรือรับคะแนนแทน เพราะจะเข้าบัญชีคนอื่นได้และคะแนนจะหายภายหลัง
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CLOUD_TIMEOUT_MS);

      const response = await fetch(CFG.GAS_WEB_APP_URL.trim(), {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      // Keep local DB mirror seamlessly synced with cloud state
      if (data && data.ok && data.user) {
        try {
          const db = loadLocalDb();
          const sid = String(data.user.student_id || "").toLowerCase();
          const idx = db.users.findIndex((u) => u && u.student_id && u.student_id.toLowerCase() === sid);
          if (idx >= 0) {
            db.users[idx] = Object.assign(db.users[idx], data.user);
          } else {
            db.users.push(Object.assign({}, data.user));
          }
          if (data.unit_progress && data.user.student_id) {
            db.unit_progress[data.user.student_id] = data.unit_progress;
          }
          saveLocalDb(db);
        } catch (syncErr) {
          console.warn("[Local DB Mirror Sync]", syncErr);
        }
      }

      return data;
    } catch (err) {
      console.warn(`[Cloud API] ${action} failed: ${err.message}`);
      // ตรวจเซสชันตอนเปิดหน้า: โยนข้อผิดพลาดให้ผู้เรียกใช้ข้อมูลแคชต่อ ไม่ถือว่าเซสชันหมดอายุ
      if (action === "get_session") throw err;
      // ความคืบหน้าการอ่านเก็บในเครื่องไว้ก่อนได้ สเต็ปถัดไปจะส่งค่าสะสมขึ้นเซิร์ฟเวอร์อีกครั้ง
      if (action === "save_step_progress") {
        try {
          return await executeLocalRequest(payload);
        } catch (localErr) {
          return { ok: false, error: OFFLINE_ERROR };
        }
      }
      return { ok: false, offline: true, error: OFFLINE_ERROR };
    }
  }

  window.BackendAPI = {
    isCloudConfigured,
    compressImageToBase64,
    register: (data) => postAction("register", data),
    login: (data) => postAction("login", data),
    getSession: (studentId) => postAction("get_session", { student_id: studentId }),
    changePassword: (data) => postAction("change_password", data),
    updateProfile: (data) => postAction("update_profile", data),
    saveStepProgress: (data) => postAction("save_step_progress", data),
    submitUnitQuiz: (data) => postAction("submit_unit_quiz", data),
    claimCertificate: (studentId) => postAction("claim_certificate", { student_id: studentId })
  };
})();
