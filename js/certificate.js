/**
 * ============================================================================
 * js/certificate.js — Official E-Certificate Preview & High-DPI PNG Generator
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * สถานศึกษา: โรงเรียนจิตรลดาวิชาชีพ สถาบันเทคโนโลยีจิตรลดา
 * ============================================================================
 */

(function () {
  const CFG = window.APP_CONFIG;
  let cachedLogoImg = null;

  function loadInstituteLogo() {
    if (cachedLogoImg) return Promise.resolve(cachedLogoImg);
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        cachedLogoImg = img;
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = "cdti-logo.png";
    });
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  /**
   * วาดใบเกียรติบัตรลงบน <canvas> ความละเอียดสูง (1600 x 1131 px อัตราส่วน A4 แนวนอน)
   */
  async function renderCertificateCanvas(canvas, user, isPreview = false) {
    if (!canvas) return;
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {
        // ignore font wait error
      }
    }

    const logo = await loadInstituteLogo();
    const W = 1600;
    const H = 1131;
    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext("2d");

    // 1. Paper Ground
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    // Subtle Outer Academic Margin Tint
    ctx.fillStyle = "#F4F7FB";
    ctx.fillRect(0, 0, W, 38);
    ctx.fillRect(0, H - 38, W, 38);
    ctx.fillRect(0, 0, 38, H);
    ctx.fillRect(W - 38, 0, 38, H);

    // 2. Royal Blue Double Frame
    ctx.strokeStyle = "#15499F";
    ctx.lineWidth = 6;
    drawRoundedRect(ctx, 48, 48, W - 96, H - 96, 24);
    ctx.stroke();

    ctx.strokeStyle = "#DCE8FA";
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, 66, 66, W - 132, H - 132, 16);
    ctx.stroke();

    // Top Royal Blue Accent Ribbon
    ctx.save();
    drawRoundedRect(ctx, 51, 51, W - 102, 18, 12);
    ctx.clip();
    ctx.fillStyle = "#15499F";
    ctx.fillRect(48, 48, W - 96, 16);
    ctx.restore();

    // Corner Architectural Marks
    const corners = [
      [88, 88, 1, 1],
      [W - 88, 88, -1, 1],
      [88, H - 88, 1, -1],
      [W - 88, H - 88, -1, -1]
    ];
    ctx.strokeStyle = "#15499F";
    ctx.lineWidth = 3;
    corners.forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * 34);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * 34, cy);
      ctx.stroke();
    });

    // 3. Institute Logo
    const centerX = W / 2;
    if (logo) {
      const logoH = 128;
      const logoW = (logo.width / logo.height) * logoH;
      ctx.drawImage(logo, centerX - logoW / 2, 108, logoW, logoH);
    }

    // 4. Institute Header
    ctx.textAlign = "center";
    ctx.fillStyle = "#15499F";
    ctx.font = "600 32px 'Mitr', sans-serif";
    ctx.fillText(CFG.SCHOOL_NAME_TH, centerX, 282);

    ctx.fillStyle = "#64748B";
    ctx.font = "600 19px 'Stack Sans Notch', sans-serif";
    ctx.fillText("CERTIFICATE OF COURSE COMPLETION  •  COURSE 21901-2017", centerX, 318);

    // 5. Presentation Line
    ctx.fillStyle = "#334155";
    ctx.font = "400 26px 'Mitr', sans-serif";
    ctx.fillText("เกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า", centerX, 388);

    // 6. Student Full Name Highlight Box
    const studentName = (user && user.full_name) || "ชื่อ-นามสกุลผู้เรียน";
    const studentId = (user && user.student_id) || "67201010XX";

    ctx.fillStyle = "#EEF4FC";
    drawRoundedRect(ctx, centerX - 450, 418, 900, 108, 20);
    ctx.fill();
    ctx.strokeStyle = "#DCE8FA";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#0F172A";
    ctx.font = "600 50px 'Mitr', sans-serif";
    ctx.fillText(studentName, centerX, 488);

    ctx.fillStyle = "#475569";
    ctx.font = "500 22px 'Mitr', 'Stack Sans Notch', sans-serif";
    ctx.fillText(`รหัสนักเรียน ${studentId}  •  ${CFG.LEVEL_PROGRAM_TH}`, centerX, 568);

    // 7. Course Achievement Statement
    ctx.fillStyle = "#334155";
    ctx.font = "400 26px 'Mitr', sans-serif";
    ctx.fillText(
      "ได้ผ่านการเรียนรู้เนื้อหาและแบบทดสอบครบทั้ง 16 หน่วยการเรียนรู้ (เกณฑ์ผ่านร้อยละ 80)",
      centerX,
      632
    );

    ctx.fillStyle = "#15499F";
    ctx.font = "600 32px 'Mitr', 'Stack Sans Notch', sans-serif";
    ctx.fillText(
      `รายวิชา ${CFG.COURSE_NAME_TH} (${CFG.COURSE_CODE})`,
      centerX,
      684
    );

    // 8. Achievement Summary Strip
    const passedUnits = user ? Number(user.passed_units_count || 0) : 0;
    const totalScore = user ? Number(user.grand_total_score || 0) : 0;
    const totalTime = window.AppUtils.formatDuration(user ? user.total_time_sec : 0);

    const stripY = 730;
    const stripW = 860;
    const stripX = centerX - stripW / 2;

    ctx.fillStyle = "#F8FAFC";
    drawRoundedRect(ctx, stripX, stripY, stripW, 92, 16);
    ctx.fill();
    ctx.strokeStyle = "#E2E8F0";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Vertical dividers
    ctx.beginPath();
    ctx.moveTo(stripX + stripW / 3, stripY + 18);
    ctx.lineTo(stripX + stripW / 3, stripY + 74);
    ctx.moveTo(stripX + (stripW * 2) / 3, stripY + 18);
    ctx.lineTo(stripX + (stripW * 2) / 3, stripY + 74);
    ctx.stroke();

    const cols = [
      {
        label: "สถานะหน่วยการเรียน",
        val: isPreview && passedUnits < 16 ? "16 / 16 หน่วย (ตัวอย่าง)" : `${passedUnits} / 16 หน่วย (100%)`
      },
      {
        label: "คะแนนสะสมรวมสุทธิ",
        val: isPreview && totalScore === 0 ? "คะแนนตามจริงเมื่อเรียนจบ" : `${totalScore} คะแนน`
      },
      {
        label: "เวลาทำกิจกรรมรวม",
        val: `${totalTime} นาที`
      }
    ];

    cols.forEach((c, idx) => {
      const cx = stripX + (stripW / 3) * idx + stripW / 6;
      ctx.fillStyle = "#64748B";
      ctx.font = "400 18px 'Mitr', sans-serif";
      ctx.fillText(c.label, cx, stripY + 36);

      ctx.fillStyle = "#0F172A";
      ctx.font = "600 23px 'Stack Sans Notch', 'Mitr', sans-serif";
      ctx.fillText(c.val, cx, stripY + 68);
    });

    // 9. Footer Signatures & Issue Date
    const issueDateText = window.AppUtils.formatThaiDate(
      user && user.cert_issued_at ? user.cert_issued_at : new Date().toISOString()
    );

    // Left: Issue Date & Verification Code
    ctx.textAlign = "left";
    ctx.fillStyle = "#475569";
    ctx.font = "400 20px 'Mitr', sans-serif";
    ctx.fillText(`ให้ไว้ ณ วันที่ ${issueDateText}`, 140, 935);

    ctx.fillStyle = "#64748B";
    ctx.font = "500 17px 'Stack Sans Notch', sans-serif";
    const verifyCode = `VERIFY: CDTI-21901-${studentId}`;
    ctx.fillText(verifyCode, 140, 968);

    // Right: Instructor Signature Line
    const sigCenterX = W - 320;
    ctx.strokeStyle = "#94A3B8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sigCenterX - 150, 912);
    ctx.lineTo(sigCenterX + 150, 912);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#0F172A";
    ctx.font = "500 21px 'Mitr', sans-serif";
    ctx.fillText(`(${CFG.INSTRUCTOR_NAME_TH})`, sigCenterX, 946);

    ctx.fillStyle = "#64748B";
    ctx.font = "400 18px 'Mitr', sans-serif";
    ctx.fillText("ผู้สอนประจำรายวิชา 21901-2017", sigCenterX, 976);

    // 10. Clean Preview Badge (Below Achievement Strip so Student Name stays 100% crisp)
    const isUnlocked = Boolean(user && user.passed_units_count >= CFG.TOTAL_UNITS);
    if (isPreview && !isUnlocked) {
      ctx.save();
      const badgeW = 680;
      const badgeH = 44;
      const badgeX = centerX - badgeW / 2;
      const badgeY = 842;

      ctx.fillStyle = "#FEF3C7";
      drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, 22);
      ctx.fill();

      ctx.strokeStyle = "#FDE68A";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#9A5B08";
      ctx.font = "500 18px 'Mitr', 'Stack Sans Notch', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("ตัวอย่างเกียรติบัตร (PREVIEW)  •  ปลดล็อกไฟล์จริงเมื่อสอบผ่านครบ 16 หน่วย (100%)", centerX, badgeY + 28);
      ctx.restore();
    }
  }

  /**
   * สร้างและดาวน์โหลดไฟล์ PNG ความละเอียดสูง (เฉพาะผู้ที่ผ่านครบ 16 หน่วย 100% เท่านั้น)
   */
  async function downloadOfficialCertificate() {
    const user = window.AuthManager?.getCurrentUser();
    if (!user) return;

    if (Number(user.passed_units_count || 0) < CFG.TOTAL_UNITS) {
      window.AppUtils.showToast(
        `ยังดาวน์โหลดไม่ได้ ต้องสอบผ่านครบทั้ง ${CFG.TOTAL_UNITS} หน่วยก่อน`,
        "error"
      );
      return;
    }

    try {
      const claimRes = await window.BackendAPI.claimCertificate(user.student_id);
      if (claimRes && claimRes.ok && claimRes.user) {
        window.AuthManager.updateSessionData(claimRes.user, null, null);
      }
    } catch (e) {
      // allow download if already verified in session
    }

    const latestUser = window.AuthManager.getCurrentUser();
    const exportCanvas = document.createElement("canvas");
    await renderCertificateCanvas(exportCanvas, latestUser, false);

    const dataUrl = exportCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    const safeId = String(latestUser.student_id || "student").replace(/[^a-zA-Z0-9_-]/g, "");
    link.download = `Certificate_21901-2017_${safeId}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    link.remove();

    window.AppUtils.showToast("ดาวน์โหลดเกียรติบัตร (.PNG) เรียบร้อยแล้ว", "success");
  }

  window.CertificateEngine = {
    renderCertificateCanvas,
    downloadOfficialCertificate
  };
})();
