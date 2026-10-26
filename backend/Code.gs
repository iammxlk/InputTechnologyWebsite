/**
 * ============================================================================
 * Code.gs — Backend Server for Course 21901-2017 E-Learning Platform
 * รายวิชา: เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์ (21901-2017)
 * สถาบันเทคโนโลยีจิตรลดา (Chitralada Technology Institute)
 *
 * หน้าที่หลัก:
 *   1. จัดการฐานข้อมูล Google Sheets ทั้ง 4 แท็บอัตโนมัติ:
 *      - Users
 *      - Unit_Progress
 *      - MiniGame_Records
 *      - Activity_Logs
 *   2. รับไฟล์รูปโปรไฟล์ Base64 แปลงเป็นไฟล์ภาพบันทึกลง Google Drive
 *      พร้อมตั้งค่าสิทธิ์การเข้าถึงและคืนค่า Direct URL ลง Google Sheets
 *   3. ระบบสมัครสมาชิก (Register), เข้าสู่ระบบ (Login), เปลี่ยนรหัสผ่าน (SHA-256 + Salt)
 *   4. บันทึกความคืบหน้า 16 หน่วย, คะแนนสอบ (เกณฑ์ผ่าน 8/10 = 80%) และเวลา (วินาที)
 *   5. ดึงข้อมูลจัดอันดับ Real-time Leaderboard Top 10 (เรียงตาม Score DESC, Time ASC)
 * ============================================================================
 */

const CONFIG = {
  // หากวางสคริปต์นี้แบบ Container-bound ใน Google Sheets สามารถเว้นว่าง SPREADSHEET_ID ได้
  // หากแยกไฟล์สคริปต์ ให้วาง Spreadsheet ID ลงในเครื่องหมายคำพูดด้านล่าง
  SPREADSHEET_ID: "",

  // โฟลเดอร์ Google Drive สำหรับเก็บรูปโปรไฟล์นักเรียน
  // หากเว้นว่าง ระบบจะสร้างโฟลเดอร์ชื่อ DRIVE_FOLDER_NAME ให้อัตโนมัติใน Google Drive ของคุณ
  DRIVE_FOLDER_ID: "",
  DRIVE_FOLDER_NAME: "CDTI_21901_2017_Profile_Pictures",

  TOTAL_UNITS: 16,
  QUIZ_PASS_SCORE: 8,

  SHEETS: {
    USERS: "Users",
    UNIT_PROGRESS: "Unit_Progress",
    MINIGAME_RECORDS: "MiniGame_Records",
    ACTIVITY_LOGS: "Activity_Logs"
  }
};

/* ============================================================================
   1. HTTP ENTRY POINTS (GET / POST — CORS SAFE)
   ============================================================================ */

function doGet(e) {
  try {
    ensureAllSheetsInitialized_();
    const action = (e && e.parameter && e.parameter.action) || "ping";

    if (action === "ping") {
      return jsonResponse_({
        ok: true,
        service: "CDTI-21901-2017-Backend",
        timestamp: new Date().toISOString()
      });
    }

    if (action === "leaderboard") {
      const studentId = (e && e.parameter && e.parameter.student_id) || "";
      return jsonResponse_(handleGetLeaderboard_({ student_id: studentId }));
    }

    return jsonResponse_({ ok: false, error: "ไม่รู้จักคำสั่ง GET ที่ร้องขอ" });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let hasLock = false;

  try {
    ensureAllSheetsInitialized_();

    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const payload = JSON.parse(rawBody);
    const action = String(payload.action || "").trim();

    // ใช้ ScriptLock เฉพาะคำสั่งที่มีการเขียนข้อมูล เพื่อรองรับการส่งพร้อมกันทั้งห้องเรียน
    const writeActions = [
      "register",
      "change_password",
      "update_profile",
      "save_step_progress",
      "submit_unit_quiz",
      "submit_minigame",
      "claim_certificate"
    ];

    if (writeActions.indexOf(action) !== -1) {
      lock.waitLock(15000);
      hasLock = true;
    }

    let result;
    switch (action) {
      case "register":
        result = handleRegister_(payload);
        break;
      case "login":
        result = handleLogin_(payload);
        break;
      case "get_session":
        result = handleGetSession_(payload);
        break;
      case "change_password":
        result = handleChangePassword_(payload);
        break;
      case "update_profile":
        result = handleUpdateProfile_(payload);
        break;
      case "save_step_progress":
        result = handleSaveStepProgress_(payload);
        break;
      case "submit_unit_quiz":
        result = handleSubmitUnitQuiz_(payload);
        break;
      case "submit_minigame":
        result = handleSubmitMiniGame_(payload);
        break;
      case "claim_certificate":
        result = handleClaimCertificate_(payload);
        break;
      case "get_leaderboard":
        result = handleGetLeaderboard_(payload);
        break;
      default:
        result = { ok: false, error: "ไม่พบ Action ที่ระบุ: " + action };
    }

    return jsonResponse_(result);
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  } finally {
    if (hasLock) {
      lock.releaseLock();
    }
  }
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/* ============================================================================
   2. DATABASE INITIALIZATION (4 GOOGLE SHEETS TABS)
   ============================================================================ */

/**
 * สามารถกดรันฟังก์ชัน setupDatabase() ครั้งแรกในหน้า Editor ของ Apps Script
 * เพื่ออนุมัติสิทธิ์ Google Sheets + Google Drive และสร้างตารางทั้ง 4 แท็บล่วงหน้า
 */
function setupDatabase() {
  ensureAllSheetsInitialized_();
  getOrCreateAvatarFolder_();
  return "สร้างฐานข้อมูลทั้ง 4 แท็บและโฟลเดอร์ Google Drive สำเร็จเรียบร้อย";
}

function getSpreadsheet_() {
  if (CONFIG.SPREADSHEET_ID && CONFIG.SPREADSHEET_ID.trim() !== "") {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID.trim());
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function ensureAllSheetsInitialized_() {
  const ss = getSpreadsheet_();

  ensureSheetWithHeaders_(ss, CONFIG.SHEETS.USERS, [
    "student_id",
    "password_hash",
    "salt",
    "full_name",
    "avatar_url",
    "avatar_file_id",
    "passed_units_count",
    "progress_percent",
    "total_quiz_score",
    "total_game_score",
    "grand_total_score",
    "total_time_sec",
    "cert_unlocked",
    "cert_issued_at",
    "created_at",
    "updated_at"
  ]);

  ensureSheetWithHeaders_(ss, CONFIG.SHEETS.UNIT_PROGRESS, [
    "record_id",
    "student_id",
    "unit_no",
    "steps_completed",
    "is_content_read",
    "best_quiz_score",
    "best_quiz_time_sec",
    "is_passed",
    "attempts_count",
    "updated_at"
  ]);

  ensureSheetWithHeaders_(ss, CONFIG.SHEETS.MINIGAME_RECORDS, [
    "record_id",
    "student_id",
    "game_id",
    "best_score",
    "best_time_sec",
    "play_count",
    "updated_at"
  ]);

  ensureSheetWithHeaders_(ss, CONFIG.SHEETS.ACTIVITY_LOGS, [
    "log_id",
    "timestamp",
    "student_id",
    "action_type",
    "target_id",
    "score",
    "time_sec",
    "is_passed"
  ]);
}

function ensureSheetWithHeaders_(ss, sheetName, headers) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#EFF6FF");
    headerRange.setFontColor("#1E3A8A");
  }
  return sheet;
}

/* ============================================================================
   3. GOOGLE DRIVE PROFILE PICTURE STORAGE
   ============================================================================ */

function getOrCreateAvatarFolder_() {
  if (CONFIG.DRIVE_FOLDER_ID && CONFIG.DRIVE_FOLDER_ID.trim() !== "") {
    return DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID.trim());
  }
  const folders = DriveApp.getFoldersByName(CONFIG.DRIVE_FOLDER_NAME);
  if (folders.hasNext()) {
    return folders.next();
  }
  const created = DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
  created.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return created;
}

function saveBase64AvatarToDrive_(studentId, base64DataUrl, oldFileId) {
  if (!base64DataUrl || typeof base64DataUrl !== "string") {
    return { avatarUrl: "", fileId: "" };
  }

  const matches = base64DataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  const mimeType = matches ? matches[1] : "image/jpeg";
  const rawBase64 = matches ? matches[2] : base64DataUrl;

  const bytes = Utilities.base64Decode(rawBase64);
  const ext = mimeType.indexOf("png") !== -1 ? "png" : mimeType.indexOf("webp") !== -1 ? "webp" : "jpg";
  const safeId = String(studentId).replace(/[^a-zA-Z0-9_-]/g, "");
  const fileName = "avatar_" + safeId + "_" + new Date().getTime() + "." + ext;

  const folder = getOrCreateAvatarFolder_();
  const blob = Utilities.newBlob(bytes, mimeType, fileName);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // ลบไฟล์รูปเก่าออกเพื่อประหยัดพื้นที่ Google Drive
  if (oldFileId && String(oldFileId).trim() !== "") {
    try {
      DriveApp.getFileById(String(oldFileId).trim()).setTrashed(true);
    } catch (ignoreErr) {
      // ข้ามได้หากไฟล์ถูกลบไปแล้ว
    }
  }

  const fileId = file.getId();
  const avatarUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w400";
  return { avatarUrl: avatarUrl, fileId: fileId };
}

/* ============================================================================
   4. CRYPTOGRAPHY & AUTHENTICATION HANDLERS
   ============================================================================ */

function generateSalt_() {
  return Utilities.getUuid().replace(/-/g, "").slice(0, 16);
}

function hashPassword_(plainPassword, salt) {
  const raw = String(plainPassword) + "::" + String(salt);
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    raw,
    Utilities.Charset.UTF_8
  );
  return digest
    .map(function (byte) {
      const v = byte < 0 ? byte + 256 : byte;
      return ("0" + v.toString(16)).slice(-2);
    })
    .join("");
}

function findUserRowByStudentId_(usersSheet, studentId) {
  const lastRow = usersSheet.getLastRow();
  if (lastRow < 2) return null;

  const values = usersSheet.getRange(2, 1, lastRow - 1, 16).getValues();
  const target = String(studentId || "").trim().toLowerCase();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim().toLowerCase() === target) {
      return {
        rowIndex: i + 2,
        row: values[i]
      };
    }
  }
  return null;
}

function mapUserRowToPublicProfile_(row) {
  return {
    student_id: String(row[0] || ""),
    full_name: String(row[3] || ""),
    avatar_url: String(row[4] || ""),
    passed_units_count: Number(row[6] || 0),
    progress_percent: Number(row[7] || 0),
    total_quiz_score: Number(row[8] || 0),
    total_game_score: Number(row[9] || 0),
    grand_total_score: Number(row[10] || 0),
    total_time_sec: Number(row[11] || 0),
    cert_unlocked: row[12] === true || String(row[12]).toUpperCase() === "TRUE",
    cert_issued_at: String(row[13] || ""),
    created_at: String(row[14] || ""),
    updated_at: String(row[15] || "")
  };
}

function handleRegister_(payload) {
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

  const ss = getSpreadsheet_();
  const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);

  const existing = findUserRowByStudentId_(usersSheet, studentId);
  if (existing) {
    return { ok: false, error: "รหัสนักเรียน " + studentId + " มีในระบบแล้ว กรุณาเข้าสู่ระบบ" };
  }

  const salt = generateSalt_();
  const passwordHash = hashPassword_(password, salt);
  const uploaded = saveBase64AvatarToDrive_(studentId, avatarBase64, "");
  const nowIso = new Date().toISOString();

  const newRow = [
    studentId,
    passwordHash,
    salt,
    fullName,
    uploaded.avatarUrl,
    uploaded.fileId,
    0,
    0,
    0,
    0,
    0,
    0,
    false,
    "",
    nowIso,
    nowIso
  ];

  usersSheet.appendRow(newRow);
  appendActivityLog_(ss, studentId, "REGISTER", "ACCOUNT", 0, 0, true);

  return {
    ok: true,
    user: mapUserRowToPublicProfile_(newRow),
    unit_progress: {},
    minigame_records: {}
  };
}

function handleLogin_(payload) {
  const studentId = String(payload.student_id || "").trim();
  const password = String(payload.password || "");

  if (!studentId || !password) {
    return { ok: false, error: "กรุณากรอกรหัสนักเรียนและรหัสผ่านให้ครบถ้วน" };
  }

  const ss = getSpreadsheet_();
  const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  const found = findUserRowByStudentId_(usersSheet, studentId);

  if (!found) {
    return { ok: false, error: "ไม่พบรหัสนักเรียนนี้ในระบบ กรุณาสมัครสมาชิกก่อน" };
  }

  const storedHash = String(found.row[1] || "");
  const salt = String(found.row[2] || "");
  const checkHash = hashPassword_(password, salt);

  if (checkHash !== storedHash) {
    return { ok: false, error: "รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" };
  }

  const realId = String(found.row[0]);
  appendActivityLog_(ss, realId, "LOGIN", "SESSION", 0, 0, true);

  return {
    ok: true,
    user: mapUserRowToPublicProfile_(found.row),
    unit_progress: getUserUnitProgressMap_(ss, realId),
    minigame_records: getUserMiniGameMap_(ss, realId)
  };
}

function handleGetSession_(payload) {
  const studentId = String(payload.student_id || "").trim();
  if (!studentId) {
    return { ok: false, error: "ไม่พบรหัสนักเรียนในเซสชัน" };
  }

  const ss = getSpreadsheet_();
  const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  const found = findUserRowByStudentId_(usersSheet, studentId);
  if (!found) {
    return { ok: false, error: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" };
  }

  const realId = String(found.row[0]);
  return {
    ok: true,
    user: mapUserRowToPublicProfile_(found.row),
    unit_progress: getUserUnitProgressMap_(ss, realId),
    minigame_records: getUserMiniGameMap_(ss, realId)
  };
}

function handleChangePassword_(payload) {
  const studentId = String(payload.student_id || "").trim();
  const currentPassword = String(payload.current_password || "");
  const newPassword = String(payload.new_password || "");

  if (!studentId || !currentPassword || !newPassword) {
    return { ok: false, error: "กรุณากรอกข้อมูลรหัสผ่านให้ครบทุกช่อง" };
  }
  if (newPassword.length < 4) {
    return { ok: false, error: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 4 ตัวอักษร" };
  }

  const ss = getSpreadsheet_();
  const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  const found = findUserRowByStudentId_(usersSheet, studentId);

  if (!found) {
    return { ok: false, error: "ไม่พบบัญชีผู้ใช้งาน" };
  }

  const storedHash = String(found.row[1] || "");
  const storedSalt = String(found.row[2] || "");
  if (hashPassword_(currentPassword, storedSalt) !== storedHash) {
    return { ok: false, error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" };
  }

  const newSalt = generateSalt_();
  const newHash = hashPassword_(newPassword, newSalt);
  const nowIso = new Date().toISOString();

  usersSheet.getRange(found.rowIndex, 2, 1, 2).setValues([[newHash, newSalt]]);
  usersSheet.getRange(found.rowIndex, 16).setValue(nowIso);

  appendActivityLog_(ss, String(found.row[0]), "PASS_CHANGE", "SECURITY", 0, 0, true);
  return { ok: true, message: "เปลี่ยนรหัสผ่านเรียบร้อยแล้ว" };
}

function handleUpdateProfile_(payload) {
  const studentId = String(payload.student_id || "").trim();
  const fullName = String(payload.full_name || "").trim();
  const avatarBase64 = String(payload.avatar_base64 || "");

  const ss = getSpreadsheet_();
  const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  const found = findUserRowByStudentId_(usersSheet, studentId);

  if (!found) {
    return { ok: false, error: "ไม่พบบัญชีผู้ใช้งาน" };
  }

  const row = found.row.slice();
  if (fullName) {
    row[3] = fullName;
  }
  if (avatarBase64) {
    const uploaded = saveBase64AvatarToDrive_(row[0], avatarBase64, row[5]);
    row[4] = uploaded.avatarUrl;
    row[5] = uploaded.fileId;
  }
  row[15] = new Date().toISOString();

  usersSheet.getRange(found.rowIndex, 1, 1, 16).setValues([row]);
  return {
    ok: true,
    user: mapUserRowToPublicProfile_(row)
  };
}

/* ============================================================================
   5. LEARNING PROGRESS, QUIZ & TIME-ATTACK MINIGAME HANDLERS
   ============================================================================ */

function getUserUnitProgressMap_(ss, studentId) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.UNIT_PROGRESS);
  const lastRow = sheet.getLastRow();
  const map = {};
  if (lastRow < 2) return map;

  const rows = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
  const target = String(studentId).trim().toLowerCase();

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1]).trim().toLowerCase() === target) {
      const unitNo = Number(rows[i][2]);
      map[unitNo] = {
        unit_no: unitNo,
        steps_completed: Number(rows[i][3] || 0),
        is_content_read: rows[i][4] === true || String(rows[i][4]).toUpperCase() === "TRUE",
        best_quiz_score: Number(rows[i][5] || 0),
        best_quiz_time_sec: Number(rows[i][6] || 0),
        is_passed: rows[i][7] === true || String(rows[i][7]).toUpperCase() === "TRUE",
        attempts_count: Number(rows[i][8] || 0),
        updated_at: String(rows[i][9] || "")
      };
    }
  }
  return map;
}

function getUserMiniGameMap_(ss, studentId) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MINIGAME_RECORDS);
  const lastRow = sheet.getLastRow();
  const map = {};
  if (lastRow < 2) return map;

  const rows = sheet.getRange(2, 1, lastRow - 1, 7).getValues();
  const target = String(studentId).trim().toLowerCase();

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][1]).trim().toLowerCase() === target) {
      const gameId = String(rows[i][2]);
      map[gameId] = {
        game_id: gameId,
        best_score: Number(rows[i][3] || 0),
        best_time_sec: Number(rows[i][4] || 0),
        play_count: Number(rows[i][5] || 0),
        updated_at: String(rows[i][6] || "")
      };
    }
  }
  return map;
}

function handleSaveStepProgress_(payload) {
  const studentId = String(payload.student_id || "").trim();
  const unitNo = Number(payload.unit_no || 0);
  const stepsCompleted = Number(payload.steps_completed || 0);
  const isContentRead = Boolean(payload.is_content_read);

  if (!studentId || unitNo < 1 || unitNo > CONFIG.TOTAL_UNITS) {
    return { ok: false, error: "ข้อมูลหน่วยการเรียนไม่ถูกต้อง" };
  }

  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.UNIT_PROGRESS);
  const recordId = studentId + "_U" + ("0" + unitNo).slice(-2);
  const nowIso = new Date().toISOString();

  const existing = findRecordRowById_(sheet, recordId, 10);
  if (existing) {
    const r = existing.row;
    const mergedSteps = Math.max(Number(r[3] || 0), stepsCompleted);
    const mergedRead =
      r[4] === true || String(r[4]).toUpperCase() === "TRUE" || isContentRead;
    const bestScore = Number(r[5] || 0);
    const isPassed = mergedRead && bestScore >= CONFIG.QUIZ_PASS_SCORE;

    const updatedRow = [
      recordId,
      studentId,
      unitNo,
      mergedSteps,
      mergedRead,
      bestScore,
      Number(r[6] || 0),
      isPassed,
      Number(r[8] || 0),
      nowIso
    ];
    sheet.getRange(existing.rowIndex, 1, 1, 10).setValues([updatedRow]);
  } else {
    sheet.appendRow([
      recordId,
      studentId,
      unitNo,
      stepsCompleted,
      isContentRead,
      0,
      0,
      false,
      0,
      nowIso
    ]);
  }

  const updatedUser = recalculateUserSummary_(ss, studentId);
  return {
    ok: true,
    user: updatedUser,
    unit_progress: getUserUnitProgressMap_(ss, studentId)
  };
}

function handleSubmitUnitQuiz_(payload) {
  const studentId = String(payload.student_id || "").trim();
  const unitNo = Number(payload.unit_no || 0);
  const score = Math.max(0, Math.min(10, Number(payload.score || 0)));
  const timeSec = Math.max(1, Math.round(Number(payload.time_sec || 1)));

  if (!studentId || unitNo < 1 || unitNo > CONFIG.TOTAL_UNITS) {
    return { ok: false, error: "ข้อมูลการส่งแบบทดสอบไม่ถูกต้อง" };
  }

  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.UNIT_PROGRESS);
  const recordId = studentId + "_U" + ("0" + unitNo).slice(-2);
  const nowIso = new Date().toISOString();

  const existing = findRecordRowById_(sheet, recordId, 10);
  const passedThisAttempt = score >= CONFIG.QUIZ_PASS_SCORE;

  if (existing) {
    const r = existing.row;
    const prevBestScore = Number(r[5] || 0);
    const prevBestTime = Number(r[6] || 0);
    const attempts = Number(r[8] || 0) + 1;

    let newBestScore = prevBestScore;
    let newBestTime = prevBestTime;

    if (
      prevBestTime === 0 ||
      score > prevBestScore ||
      (score === prevBestScore && timeSec < prevBestTime)
    ) {
      newBestScore = score;
      newBestTime = timeSec;
    }

    const isPassed = newBestScore >= CONFIG.QUIZ_PASS_SCORE;
    const updatedRow = [
      recordId,
      studentId,
      unitNo,
      Math.max(Number(r[3] || 0), 1),
      true,
      newBestScore,
      newBestTime,
      isPassed,
      attempts,
      nowIso
    ];
    sheet.getRange(existing.rowIndex, 1, 1, 10).setValues([updatedRow]);
  } else {
    sheet.appendRow([
      recordId,
      studentId,
      unitNo,
      1,
      true,
      score,
      timeSec,
      passedThisAttempt,
      1,
      nowIso
    ]);
  }

  appendActivityLog_(
    ss,
    studentId,
    "QUIZ_SUBMIT",
    "U" + ("0" + unitNo).slice(-2),
    score,
    timeSec,
    passedThisAttempt
  );

  const updatedUser = recalculateUserSummary_(ss, studentId);
  return {
    ok: true,
    passed_attempt: passedThisAttempt,
    user: updatedUser,
    unit_progress: getUserUnitProgressMap_(ss, studentId)
  };
}

function handleSubmitMiniGame_(payload) {
  const studentId = String(payload.student_id || "").trim();
  const gameId = String(payload.game_id || "").trim();
  const score = Math.max(0, Number(payload.score || 0));
  const timeSec = Math.max(1, Math.round(Number(payload.time_sec || 1)));

  if (!studentId || !gameId) {
    return { ok: false, error: "ข้อมูลมินิเกมไม่ครบถ้วน" };
  }

  const ss = getSpreadsheet_();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.MINIGAME_RECORDS);
  const recordId = studentId + "_" + gameId;
  const nowIso = new Date().toISOString();

  const existing = findRecordRowById_(sheet, recordId, 7);
  if (existing) {
    const r = existing.row;
    const prevScore = Number(r[3] || 0);
    const prevTime = Number(r[4] || 0);
    const playCount = Number(r[5] || 0) + 1;

    let bestScore = prevScore;
    let bestTime = prevTime;

    if (
      prevTime === 0 ||
      score > prevScore ||
      (score === prevScore && timeSec < prevTime)
    ) {
      bestScore = score;
      bestTime = timeSec;
    }

    sheet
      .getRange(existing.rowIndex, 1, 1, 7)
      .setValues([[recordId, studentId, gameId, bestScore, bestTime, playCount, nowIso]]);
  } else {
    sheet.appendRow([recordId, studentId, gameId, score, timeSec, 1, nowIso]);
  }

  appendActivityLog_(ss, studentId, "GAME_SUBMIT", gameId, score, timeSec, score > 0);
  const updatedUser = recalculateUserSummary_(ss, studentId);

  return {
    ok: true,
    user: updatedUser,
    minigame_records: getUserMiniGameMap_(ss, studentId)
  };
}

function handleClaimCertificate_(payload) {
  const studentId = String(payload.student_id || "").trim();
  if (!studentId) return { ok: false, error: "ไม่พบรหัสนักเรียน" };

  const ss = getSpreadsheet_();
  const updatedUser = recalculateUserSummary_(ss, studentId);
  if (!updatedUser || !updatedUser.cert_unlocked) {
    return {
      ok: false,
      error: "ต้องเรียนและสอบผ่านเกณฑ์ 80% ครบทั้ง 16 หน่วย (100%) ก่อนรับเกียรติบัตร"
    };
  }

  appendActivityLog_(ss, studentId, "CERT_CLAIM", "CERT_21901_2017", updatedUser.grand_total_score, updatedUser.total_time_sec, true);
  return { ok: true, user: updatedUser };
}

function recalculateUserSummary_(ss, studentId) {
  const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  const found = findUserRowByStudentId_(usersSheet, studentId);
  if (!found) return null;

  const unitMap = getUserUnitProgressMap_(ss, found.row[0]);
  const gameMap = getUserMiniGameMap_(ss, found.row[0]);

  let passedCount = 0;
  let totalQuizScore = 0;
  let totalTimeSec = 0;

  Object.keys(unitMap).forEach(function (k) {
    const u = unitMap[k];
    if (u.is_passed) {
      passedCount += 1;
    }
    totalQuizScore += Number(u.best_quiz_score || 0);
    if (u.attempts_count > 0) {
      totalTimeSec += Number(u.best_quiz_time_sec || 0);
    }
  });

  let totalGameScore = 0;
  Object.keys(gameMap).forEach(function (k) {
    const g = gameMap[k];
    totalGameScore += Number(g.best_score || 0);
    if (g.play_count > 0) {
      totalTimeSec += Number(g.best_time_sec || 0);
    }
  });

  const progressPercent = Math.round((passedCount / CONFIG.TOTAL_UNITS) * 100);
  const grandTotalScore = totalQuizScore + totalGameScore;
  const certUnlocked = passedCount >= CONFIG.TOTAL_UNITS;
  const nowIso = new Date().toISOString();

  const row = found.row.slice();
  row[6] = passedCount;
  row[7] = progressPercent;
  row[8] = totalQuizScore;
  row[9] = totalGameScore;
  row[10] = grandTotalScore;
  row[11] = totalTimeSec;
  row[12] = certUnlocked;
  if (certUnlocked && !row[13]) {
    row[13] = nowIso;
  }
  row[15] = nowIso;

  usersSheet.getRange(found.rowIndex, 1, 1, 16).setValues([row]);
  return mapUserRowToPublicProfile_(row);
}

/* ============================================================================
   6. REAL-TIME LEADERBOARD TOP 10 (1. SCORE DESC, 2. TIME ASC)
   ============================================================================ */

function handleGetLeaderboard_(payload) {
  const ss = getSpreadsheet_();
  const usersSheet = ss.getSheetByName(CONFIG.SHEETS.USERS);
  const lastRow = usersSheet.getLastRow();
  const requesterId = String((payload && payload.student_id) || "").trim().toLowerCase();

  if (lastRow < 2) {
    return { ok: true, top10: [], my_rank: null, total_students: 0 };
  }

  const rows = usersSheet.getRange(2, 1, lastRow - 1, 16).getValues();
  const entries = rows
    .filter(function (r) {
      return String(r[0] || "").trim() !== "";
    })
    .map(function (r) {
      return mapUserRowToPublicProfile_(r);
    });

  entries.sort(function (a, b) {
    if (b.grand_total_score !== a.grand_total_score) {
      return b.grand_total_score - a.grand_total_score;
    }
    // ถ้าได้คะแนนเท่ากัน (และมีคะแนน > 0) คนที่ใช้เวลาน้อยกว่าจะได้อันดับสูงกว่า
    const aTime = a.grand_total_score > 0 && a.total_time_sec > 0 ? a.total_time_sec : 9999999;
    const bTime = b.grand_total_score > 0 && b.total_time_sec > 0 ? b.total_time_sec : 9999999;
    if (aTime !== bTime) {
      return aTime - bTime;
    }
    return String(a.created_at).localeCompare(String(b.created_at));
  });

  const ranked = entries.map(function (item, idx) {
    return Object.assign({ rank: idx + 1 }, item);
  });

  let myRankObj = null;
  if (requesterId) {
    for (let i = 0; i < ranked.length; i++) {
      if (ranked[i].student_id.toLowerCase() === requesterId) {
        myRankObj = ranked[i];
        break;
      }
    }
  }

  return {
    ok: true,
    top10: ranked.slice(0, 10),
    my_rank: myRankObj,
    total_students: ranked.length,
    fetched_at: new Date().toISOString()
  };
}

/* ============================================================================
   7. UTILITY HELPERS
   ============================================================================ */

function findRecordRowById_(sheet, recordId, colCount) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return null;

  const rows = sheet.getRange(2, 1, lastRow - 1, colCount).getValues();
  const target = String(recordId).trim().toLowerCase();

  for (let i = 0; i < rows.length; i++) {
    if (String(rows[i][0]).trim().toLowerCase() === target) {
      return {
        rowIndex: i + 2,
        row: rows[i]
      };
    }
  }
  return null;
}

function appendActivityLog_(ss, studentId, actionType, targetId, score, timeSec, isPassed) {
  const sheet = ss.getSheetByName(CONFIG.SHEETS.ACTIVITY_LOGS);
  const nowIso = new Date().toISOString();
  const logId = "LOG_" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000);
  sheet.appendRow([
    logId,
    nowIso,
    studentId,
    actionType,
    targetId,
    Number(score || 0),
    Number(timeSec || 0),
    Boolean(isPassed)
  ]);
}
