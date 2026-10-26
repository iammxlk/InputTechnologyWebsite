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
    try {
      const raw = localStorage.getItem(CFG.STORAGE_KEYS.LOCAL_DB_MIRROR);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users)) return parsed;
      }
    } catch (e) {
      // ignore corrupted storage
    }

    // สร้างฐานข้อมูลเริ่มต้นพร้อมข้อมูลตัวอย่างเพื่อนร่วมชั้นเพื่อทดสอบ Leaderboard
    const now = new Date().toISOString();
    const seeded = {
      users: [
        {
          student_id: "6720101001",
          password_hash: "",
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
          password_hash: "",
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
          password_hash: "",
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
          password_hash: "",
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
          password_hash: "",
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
      unit_progress: {},
      minigame_records: {},
      activity_logs: []
    };
    saveLocalDb(seeded);
    return seeded;
  }

  function saveLocalDb(db) {
    localStorage.setItem(CFG.STORAGE_KEYS.LOCAL_DB_MIRROR, JSON.stringify(db));
  }

  function sanitizeUser(u) {
    return {
      student_id: u.student_id,
      full_name: u.full_name,
      avatar_url: u.avatar_url || window.AppUtils.buildInitialsAvatarDataUrl(u.full_name),
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
    const key = String(studentId).trim().toLowerCase();
    const user = db.users.find((x) => x.student_id.toLowerCase() === key);
    if (!user) return null;

    const uMap = db.unit_progress[user.student_id] || {};
    const gMap = db.minigame_records[user.student_id] || {};

    let passedCount = 0;
    let totalQuiz = 0;
    let totalTime = 0;

    Object.keys(uMap).forEach((uNo) => {
      const item = uMap[uNo];
      if (item.is_passed) passedCount += 1;
      totalQuiz += Number(item.best_quiz_score || 0);
      if (item.attempts_count > 0) {
        totalTime += Number(item.best_quiz_time_sec || 0);
      }
    });

    let totalGame = 0;
    Object.keys(gMap).forEach((gId) => {
      const item = gMap[gId];
      totalGame += Number(item.best_score || 0);
      if (item.play_count > 0) {
        totalTime += Number(item.best_time_sec || 0);
      }
    });

    user.passed_units_count = passedCount;
    user.progress_percent = Math.round((passedCount / CFG.TOTAL_UNITS) * 100);
    user.total_quiz_score = totalQuiz;
    user.total_game_score = totalGame;
    user.grand_total_score = totalQuiz + totalGame;
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

      if (!studentId || studentId.length < 3) {
        return { ok: false, error: "กรุณากรอกรหัสนักเรียนอย่างน้อย 3 ตัวอักษร" };
      }
      if (!password || password.length < 4) {
        return { ok: false, error: "กรุณาตั้งรหัสผ่านอย่างน้อย 4 ตัวอักษร" };
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
      if (dup) {
        return { ok: false, error: `รหัสนักเรียน ${studentId} มีในระบบแล้ว กรุณาเข้าสู่ระบบ` };
      }

      const salt = Math.random().toString(36).slice(2, 12);
      const passwordHash = await sha256HexBrowser(`${password}::${salt}`);

      const newUser = {
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

      db.users.push(newUser);
      db.unit_progress[studentId] = {};
      db.minigame_records[studentId] = {};
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
        user: sanitizeUser(newUser),
        unit_progress: {},
        minigame_records: {}
      };
    }

    if (action === "login") {
      const studentId = String(payload.student_id || "").trim();
      const password = String(payload.password || "");
      const found = db.users.find(
        (u) => u.student_id.toLowerCase() === studentId.toLowerCase()
      );

      if (!found || !found.password_hash) {
        return { ok: false, error: "ไม่พบรหัสนักเรียนนี้ในระบบ กรุณาสมัครสมาชิกก่อน" };
      }

      const checkHash = await sha256HexBrowser(`${password}::${found.salt}`);
      if (checkHash !== found.password_hash) {
        return { ok: false, error: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" };
      }

      return {
        ok: true,
        user: sanitizeUser(found),
        unit_progress: db.unit_progress[found.student_id] || {},
        minigame_records: db.minigame_records[found.student_id] || {}
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
        unit_progress: db.unit_progress[found.student_id] || {},
        minigame_records: db.minigame_records[found.student_id] || {}
      };
    }

    if (action === "change_password") {
      const studentId = String(payload.student_id || "").trim();
      const currentPwd = String(payload.current_password || "");
      const newPwd = String(payload.new_password || "");

      if (newPwd.length < 4) {
        return { ok: false, error: "รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร" };
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
        user: sanitizeUser(updated),
        unit_progress: db.unit_progress[studentId]
      };
    }

    if (action === "submit_minigame") {
      const studentId = String(payload.student_id || "").trim();
      const gameId = String(payload.game_id || "").trim();
      const score = Math.max(0, Number(payload.score || 0));
      const timeSec = Math.max(1, Math.round(Number(payload.time_sec || 1)));

      if (!db.minigame_records[studentId]) db.minigame_records[studentId] = {};
      const prev = db.minigame_records[studentId][gameId] || {
        game_id: gameId,
        best_score: 0,
        best_time_sec: 0,
        play_count: 0
      };

      prev.play_count += 1;
      if (
        prev.best_time_sec === 0 ||
        score > prev.best_score ||
        (score === prev.best_score && timeSec < prev.best_time_sec)
      ) {
        prev.best_score = score;
        prev.best_time_sec = timeSec;
      }
      prev.updated_at = now;

      db.minigame_records[studentId][gameId] = prev;
      const updated = recalculateLocalUser(db, studentId);
      saveLocalDb(db);

      return {
        ok: true,
        user: sanitizeUser(updated),
        minigame_records: db.minigame_records[studentId]
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
      return { ok: true, user: sanitizeUser(updated) };
    }

    if (action === "get_leaderboard") {
      const reqId = String(payload.student_id || "").trim().toLowerCase();
      const sorted = db.users
        .map((u) => sanitizeUser(u))
        .sort((a, b) => {
          if (b.grand_total_score !== a.grand_total_score) {
            return b.grand_total_score - a.grand_total_score;
          }
          const aTime =
            a.grand_total_score > 0 && a.total_time_sec > 0 ? a.total_time_sec : 9999999;
          const bTime =
            b.grand_total_score > 0 && b.total_time_sec > 0 ? b.total_time_sec : 9999999;
          return aTime - bTime;
        })
        .map((item, idx) => Object.assign({ rank: idx + 1 }, item));

      const myRank = reqId
        ? sorted.find((x) => x.student_id.toLowerCase() === reqId) || null
        : null;

      return {
        ok: true,
        top10: sorted.slice(0, 10),
        my_rank: myRank,
        total_students: sorted.length,
        fetched_at: now
      };
    }

    return { ok: false, error: `ไม่รองรับคำสั่ง ${action}` };
  }

  /* ==========================================================================
     UNIFIED REQUEST DISPATCHER
     ========================================================================== */

  async function postAction(action, data = {}) {
    const payload = Object.assign({ action: action }, data);

    if (!isCloudConfigured()) {
      return executeLocalRequest(payload);
    }

    const response = await fetch(CFG.GAS_WEB_APP_URL.trim(), {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`เชื่อมต่อเซิร์ฟเวอร์ไม่สำเร็จ (HTTP ${response.status})`);
    }
    return response.json();
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
    submitMiniGame: (data) => postAction("submit_minigame", data),
    claimCertificate: (studentId) => postAction("claim_certificate", { student_id: studentId }),
    getLeaderboard: (studentId) => postAction("get_leaderboard", { student_id: studentId })
  };
})();
