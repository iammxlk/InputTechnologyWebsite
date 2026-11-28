/**
 * ============================================================================
 * js/certificate.js — Official E-Certificate Preview & High-DPI PNG Generator
 * Editorial Asymmetric "Prismatic Signal" Edition (1600 x 1131 px, A4 Landscape)
 * รายวิชา: 21901-2017 เทคโนโลยีการนำเข้าข้อมูลสู่ระบบคอมพิวเตอร์
 * สถานศึกษา: โรงเรียนจิตรลดาวิชาชีพ สถาบันเทคโนโลยีจิตรลดา
 * ============================================================================
 */

(function () {
  const CFG = window.APP_CONFIG;

  function drawRoundedRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x + w - rad, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
    ctx.lineTo(x + w, y + h - rad);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
    ctx.lineTo(x + rad, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
    ctx.lineTo(x, y + rad);
    ctx.quadraticCurveTo(x, y, x + rad, y);
    ctx.closePath();
  }

  function drawFourPointSparkle(ctx, cx, cy, outerR, innerR, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI / 4) * i - Math.PI / 2;
      const r = i % 2 === 0 ? outerR : innerR;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  /**
   * Helper to draw horizontally centered text consistently across browsers
   * (Avoids WebKit/Safari Thai complex-script textAlign="center" drift)
   */
  function drawCenteredText(ctx, text, x, y, maxWidth) {
    if (!text) return;
    ctx.textAlign = "left";
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    if (maxWidth && textWidth > maxWidth) {
      ctx.fillText(text, x - maxWidth / 2, y, maxWidth);
    } else {
      ctx.fillText(text, x - textWidth / 2, y);
    }
  }

  function drawLeftText(ctx, text, x, y, maxWidth) {
    if (!text) return;
    ctx.textAlign = "left";
    if (maxWidth) {
      ctx.fillText(text, x, y, maxWidth);
    } else {
      ctx.fillText(text, x, y);
    }
  }

  /**
   * Draw an abstract geometric optical-aperture / 2D-matrix crest
   * (Replaces the school logo with bespoke course-inspired precision art)
   */
  function drawOpticalCrest(ctx, cx, cy) {
    ctx.save();

    // Soft glowing aura behind crest
    const glow = ctx.createRadialGradient(cx, cy, 8, cx, cy, 98);
    glow.addColorStop(0, "rgba(184, 139, 255, 0.34)");
    glow.addColorStop(0.55, "rgba(139, 63, 224, 0.12)");
    glow.addColorStop(1, "rgba(139, 63, 224, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, 98, 0, Math.PI * 2);
    ctx.fill();

    // Outer dashed orbital precision ring
    ctx.strokeStyle = "rgba(214, 196, 255, 0.28)";
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 7]);
    ctx.beginPath();
    ctx.arc(cx, cy, 68, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Architectural diamond rotated 45 deg
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = "rgba(230, 198, 135, 0.65)";
    ctx.lineWidth = 1.6;
    drawRoundedRect(ctx, -40, -40, 80, 80, 14);
    ctx.stroke();

    // Translucent glass square plate inside
    const plateGrad = ctx.createLinearGradient(-32, -32, 32, 32);
    plateGrad.addColorStop(0, "rgba(184, 139, 255, 0.26)");
    plateGrad.addColorStop(1, "rgba(91, 31, 196, 0.34)");
    ctx.fillStyle = plateGrad;
    drawRoundedRect(ctx, -31, -31, 62, 62, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.36)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // Optical scanner corner brackets around the crest
    const b = 52;
    const arm = 13;
    ctx.strokeStyle = "#E8C882";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1]
    ].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + sx * b, cy + sy * (b - arm));
      ctx.lineTo(cx + sx * b, cy + sy * b);
      ctx.lineTo(cx + sx * (b - arm), cy + sy * b);
      ctx.stroke();
    });

    // Center luminous 4-point star + orbital micro-dots
    drawFourPointSparkle(ctx, cx, cy, 20, 6.2, "#F6E3B4");
    drawFourPointSparkle(ctx, cx, cy, 10, 3.2, "#FFFFFF");

    ctx.fillStyle = "rgba(232, 200, 130, 0.9)";
    [
      [0, -68],
      [68, 0],
      [0, 68],
      [-68, 0]
    ].forEach(([dx, dy]) => {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + dy, 2.8, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Draw the 16-Unit Luminous Glass Matrix Sculpture (4x4 grid symbolizing 16 completed units)
   */
  function drawSixteenUnitMatrix(ctx, startX, startY, passedUnits, isPreview) {
    ctx.save();
    const cell = 64;
    const gap = 14;
    const activeCount = isPreview && passedUnits < 16 ? 16 : Math.min(16, Math.max(0, passedUnits));

    // Subtle container glass card behind the 4x4 matrix
    const pad = 22;
    const total = cell * 4 + gap * 3;
    const frameX = startX - pad;
    const frameY = startY - pad;
    const frameS = total + pad * 2;

    const bgGrad = ctx.createLinearGradient(frameX, frameY, frameX + frameS, frameY + frameS);
    bgGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
    bgGrad.addColorStop(1, "rgba(166, 107, 255, 0.04)");
    ctx.fillStyle = bgGrad;
    drawRoundedRect(ctx, frameX, frameY, frameS, frameS, 24);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
    ctx.lineWidth = 1.25;
    ctx.stroke();

    // Accent shimmer line along top of glass panel
    const topShimmer = ctx.createLinearGradient(frameX + 24, frameY, frameX + frameS - 24, frameY);
    topShimmer.addColorStop(0, "rgba(255,255,255,0)");
    topShimmer.addColorStop(0.5, "rgba(232, 200, 130, 0.55)");
    topShimmer.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = topShimmer;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(frameX + 28, frameY + 0.8);
    ctx.lineTo(frameX + frameS - 28, frameY + 0.8);
    ctx.stroke();

    // 4x4 geometric matrix tiles (subtle QR Finder echo on 3 corners!)
    const finderIndices = new Set([0, 3, 12]);
    for (let i = 0; i < 16; i++) {
      const r = Math.floor(i / 4);
      const c = i % 4;
      const x = startX + c * (cell + gap);
      const y = startY + r * (cell + gap);
      const lit = i < activeCount;

      if (lit) {
        const tileGrad = ctx.createLinearGradient(x, y, x + cell, y + cell);
        if (finderIndices.has(i)) {
          tileGrad.addColorStop(0, "rgba(238, 204, 132, 0.30)");
          tileGrad.addColorStop(1, "rgba(166, 107, 255, 0.24)");
        } else {
          tileGrad.addColorStop(0, "rgba(196, 152, 255, 0.26)");
          tileGrad.addColorStop(1, "rgba(122, 43, 217, 0.20)");
        }
        ctx.fillStyle = tileGrad;
        drawRoundedRect(ctx, x, y, cell, cell, 13);
        ctx.fill();

        ctx.strokeStyle = finderIndices.has(i)
          ? "rgba(238, 204, 132, 0.62)"
          : "rgba(215, 190, 255, 0.34)";
        ctx.lineWidth = 1.3;
        ctx.stroke();

        // Inner micro-geometry representing optical modules / finder nests
        if (finderIndices.has(i)) {
          ctx.strokeStyle = "rgba(246, 227, 180, 0.72)";
          ctx.lineWidth = 1.4;
          drawRoundedRect(ctx, x + 13, y + 13, cell - 26, cell - 26, 6);
          ctx.stroke();

          ctx.fillStyle = "#F6E3B4";
          drawRoundedRect(ctx, x + 24, y + 24, cell - 48, cell - 48, 3);
          ctx.fill();
        } else if (i === 15) {
          // Bottom-right Alignment Pattern echo
          ctx.strokeStyle = "rgba(200, 91, 232, 0.85)";
          ctx.lineWidth = 1.6;
          drawRoundedRect(ctx, x + 15, y + 15, cell - 30, cell - 30, 6);
          ctx.stroke();
          drawFourPointSparkle(ctx, x + cell / 2, y + cell / 2, 8.5, 2.8, "#F6E3B4");
        } else {
          // Clean subtle diagonal signal bar & micro-dot inside tile
          ctx.fillStyle = "rgba(255, 255, 255, 0.52)";
          ctx.beginPath();
          ctx.arc(x + cell / 2, y + cell / 2, (i % 3 === 0 ? 5.5 : 3.8), 0, Math.PI * 2);
          ctx.fill();
          if (i % 2 === 1) {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
            ctx.lineWidth = 1.1;
            ctx.beginPath();
            ctx.arc(x + cell / 2, y + cell / 2, 13, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
        drawRoundedRect(ctx, x, y, cell, cell, 13);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.10)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Draw deterministic decorative optical barcode bars seeded by studentId
   * (Subtle conceptual nod to barcode / data input technology)
   */
  function drawDecorativeBarcode(ctx, x, y, width, height, seedStr) {
    ctx.save();
    let hash = 2166136261;
    const str = String(seedStr || "219012017");
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619) >>> 0;
    }

    let cursor = x;
    const endX = x + width;
    let idx = 0;
    while (cursor < endX - 4) {
      hash = (Math.imul(hash, 1664525) + 1013904223) >>> 0;
      const barW = idx < 2 || cursor > endX - 18 ? 2.5 : (hash % 4 === 0 ? 5 : hash % 2 === 0 ? 3 : 1.8);
      const gapW = (hash >>> 4) % 3 === 0 ? 4.5 : 3;
      const isGuard = idx < 2 || cursor > endX - 18 || Math.abs(cursor - (x + width / 2)) < 6;
      const barH = isGuard ? height : height - 7;

      ctx.fillStyle = isGuard
        ? "rgba(232, 200, 130, 0.56)"
        : "rgba(225, 214, 255, 0.34)";
      ctx.fillRect(cursor, y, Math.min(barW, endX - cursor), barH);

      cursor += barW + gapW;
      idx++;
    }
    ctx.restore();
  }

  /**
   * Draw bespoke procedural metallic-gold & violet Guilloche Verification Seal
   */
  function drawPrecisionSeal(ctx, cx, cy) {
    ctx.save();

    // Soft ambient halo
    const halo = ctx.createRadialGradient(cx, cy, 10, cx, cy, 74);
    halo.addColorStop(0, "rgba(139, 63, 224, 0.14)");
    halo.addColorStop(0.6, "rgba(216, 170, 82, 0.10)");
    halo.addColorStop(1, "rgba(216, 170, 82, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, 74, 0, Math.PI * 2);
    ctx.fill();

    // Outer scalloped rosette ring (24 waves)
    const petals = 24;
    ctx.beginPath();
    for (let i = 0; i <= 144; i++) {
      const a = (i / 144) * Math.PI * 2;
      const r = 56 + Math.sin(a * petals) * 3.2;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();

    const goldGrad = ctx.createLinearGradient(cx - 58, cy - 58, cx + 58, cy + 58);
    goldGrad.addColorStop(0, "#E9C97B");
    goldGrad.addColorStop(0.48, "#C69742");
    goldGrad.addColorStop(1, "#9B6D26");
    ctx.fillStyle = "rgba(233, 201, 123, 0.14)";
    ctx.fill();
    ctx.strokeStyle = goldGrad;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Fine radial precision ticks (36 marks)
    ctx.strokeStyle = "rgba(139, 63, 224, 0.34)";
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      const r1 = i % 3 === 0 ? 41 : 44;
      const r2 = 49;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
      ctx.stroke();
    }

    // Inner violet-obsidian medallion
    const coreGrad = ctx.createLinearGradient(cx - 34, cy - 34, cx + 34, cy + 34);
    coreGrad.addColorStop(0, "#351A6E");
    coreGrad.addColorStop(0.55, "#6D28D9");
    coreGrad.addColorStop(1, "#9B4DF0");
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, 35, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#F2D590";
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Delicate inner hairline ring
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.stroke();

    // Crisp gold 4-point star emblem inside medallion
    drawFourPointSparkle(ctx, cx, cy, 17, 5.4, "#F8E5B8");
    drawFourPointSparkle(ctx, cx, cy, 8, 2.6, "#FFFFFF");

    ctx.restore();
  }

  /**
   * วาดใบเกียรติบัตรลงบน <canvas> ความละเอียดสูง (1600 x 1131 px อัตราส่วน A4 แนวนอน)
   * สไตล์ Editorial Asymmetric "Prismatic Signal" ไม่มีโลโก้โรงเรียน แต่คงข้อความครบทุกบรรทัด
   */
  async function renderCertificateCanvas(canvas, user, isPreview = false) {
    if (!canvas) return;

    if (document.fonts) {
      try {
        await Promise.all([
          document.fonts.load("400 24px 'IBM Plex Sans Thai'"),
          document.fonts.load("600 32px 'IBM Plex Sans Thai'"),
          document.fonts.load("700 56px 'IBM Plex Sans Thai'"),
          document.fonts.load("600 18px 'Inter Tight'"),
          document.fonts.load("500 17px 'IBM Plex Mono'"),
          document.fonts.ready
        ]);
      } catch (e) {
        // ignore font wait error
      }
    }

    const W = 1600;
    const H = 1131;
    const SPINE_W = 424;
    const CONTENT_X = 504;
    const CONTENT_R = 1520;
    const CONTENT_W = CONTENT_R - CONTENT_X;

    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const studentName = (user && user.full_name) || "ชื่อ-นามสกุลผู้เรียน";
    const studentId = (user && user.student_id) || "67201010XX";
    const passedUnits = user ? Number(user.passed_units_count || 0) : 0;
    const totalScore = user ? Number(user.total_quiz_score || 0) : 0;
    const totalTime = window.AppUtils.formatDuration(user ? user.total_time_sec : 0);
    const issueDateText = window.AppUtils.formatThaiDate(
      user && user.cert_issued_at ? user.cert_issued_at : new Date().toISOString()
    );

    // =========================================================================
    // 1. RIGHT EDITORIAL PAPER CANVAS (Pearl-Ivory + Swiss Guide Lines)
    // =========================================================================
    const paperGrad = ctx.createLinearGradient(SPINE_W, 0, W, H);
    paperGrad.addColorStop(0, "#FFFFFF");
    paperGrad.addColorStop(0.55, "#FCFBFD");
    paperGrad.addColorStop(1, "#F4F0FA");
    ctx.fillStyle = paperGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle soft violet ambient glow in top-right & bottom-right corners
    const trGlow = ctx.createRadialGradient(W - 60, 40, 20, W - 60, 40, 480);
    trGlow.addColorStop(0, "rgba(185, 140, 240, 0.22)");
    trGlow.addColorStop(0.55, "rgba(200, 91, 232, 0.07)");
    trGlow.addColorStop(1, "rgba(200, 91, 232, 0)");
    ctx.fillStyle = trGlow;
    ctx.fillRect(SPINE_W, 0, W - SPINE_W, H);

    const brGlow = ctx.createRadialGradient(W - 120, H - 40, 10, W - 120, H - 40, 380);
    brGlow.addColorStop(0, "rgba(232, 200, 130, 0.16)");
    brGlow.addColorStop(1, "rgba(232, 200, 130, 0)");
    ctx.fillStyle = brGlow;
    ctx.fillRect(SPINE_W, 0, W - SPINE_W, H);

    // Whisper-fine architectural vertical guide grid on right canvas
    ctx.save();
    ctx.strokeStyle = "rgba(122, 43, 217, 0.045)";
    ctx.lineWidth = 1;
    for (let gx = CONTENT_X; gx <= CONTENT_R; gx += 169.33) {
      ctx.beginPath();
      ctx.moveTo(gx, 46);
      ctx.lineTo(gx, H - 46);
      ctx.stroke();
    }
    ctx.restore();

    // Subtle outer hairline editorial frame on right panel + corner viewfinder ticks
    ctx.save();
    ctx.strokeStyle = "rgba(122, 43, 217, 0.14)";
    ctx.lineWidth = 1.25;
    ctx.strokeRect(SPINE_W + 32, 36, W - SPINE_W - 68, H - 72);

    ctx.strokeStyle = "#8B3FE0";
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    const rightCorners = [
      [W - 36, 36, -1, 1],
      [W - 36, H - 36, -1, -1]
    ];
    rightCorners.forEach(([cx, cy, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(cx + dx * 32, cy);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx, cy + dy * 32);
      ctx.stroke();
    });
    ctx.restore();

    // =========================================================================
    // 2. LEFT OBSIDIAN-VIOLET MONOLITH SPINE (Glassmorphism Grid DNA)
    // =========================================================================
    ctx.save();
    const spineGrad = ctx.createLinearGradient(0, 0, SPINE_W, H);
    spineGrad.addColorStop(0, "#0D0A1A");
    spineGrad.addColorStop(0.45, "#191130");
    spineGrad.addColorStop(0.82, "#241347");
    spineGrad.addColorStop(1, "#120B24");
    ctx.fillStyle = spineGrad;
    ctx.fillRect(0, 0, SPINE_W, H);

    // Clip decorative aurora & glass tiles inside left spine
    ctx.beginPath();
    ctx.rect(0, 0, SPINE_W, H);
    ctx.clip();

    // Aurora radial fogs inside obsidian spine
    const fog1 = ctx.createRadialGradient(80, 140, 20, 80, 140, 340);
    fog1.addColorStop(0, "rgba(166, 107, 255, 0.36)");
    fog1.addColorStop(0.55, "rgba(122, 43, 217, 0.14)");
    fog1.addColorStop(1, "rgba(122, 43, 217, 0)");
    ctx.fillStyle = fog1;
    ctx.fillRect(0, 0, SPINE_W, H);

    const fog2 = ctx.createRadialGradient(SPINE_W - 20, 620, 10, SPINE_W - 20, 620, 360);
    fog2.addColorStop(0, "rgba(200, 91, 232, 0.34)");
    fog2.addColorStop(0.5, "rgba(122, 43, 217, 0.14)");
    fog2.addColorStop(1, "rgba(122, 43, 217, 0)");
    ctx.fillStyle = fog2;
    ctx.fillRect(0, 0, SPINE_W, H);

    const fog3 = ctx.createRadialGradient(140, H - 100, 10, 140, H - 100, 280);
    fog3.addColorStop(0, "rgba(232, 200, 130, 0.18)");
    fog3.addColorStop(1, "rgba(232, 200, 130, 0)");
    ctx.fillStyle = fog3;
    ctx.fillRect(0, 0, SPINE_W, H);

    // Subtle glass grid tiles along spine background
    ctx.strokeStyle = "rgba(255, 255, 255, 0.045)";
    ctx.lineWidth = 1;
    const tileStep = 53;
    for (let tx = 0; tx < SPINE_W; tx += tileStep) {
      for (let ty = 0; ty < H; ty += tileStep) {
        drawRoundedRect(ctx, tx + 2, ty + 2, tileStep - 4, tileStep - 4, 8);
        ctx.stroke();
      }
    }

    // Fine vertical metallic-gold & violet seam separating Spine and Paper
    const seamGrad = ctx.createLinearGradient(0, 0, 0, H);
    seamGrad.addColorStop(0, "#E8C882");
    seamGrad.addColorStop(0.35, "#A66BFF");
    seamGrad.addColorStop(0.75, "#C85BE8");
    seamGrad.addColorStop(1, "#E8C882");
    ctx.fillStyle = seamGrad;
    ctx.fillRect(SPINE_W - 5, 0, 5, H);

    ctx.restore();

    // =========================================================================
    // 3. LEFT SPINE VISUAL SCULPTURE & AUTHENTICATION FOOTER
    // =========================================================================
    const spineCenterX = (SPINE_W - 5) / 2;

    // 3.1 Top Optical Aperture Crest (zero school logo!)
    drawOpticalCrest(ctx, spineCenterX, 174);

    // Subtle hairline divider below crest
    const spineDiv = ctx.createLinearGradient(44, 294, SPINE_W - 49, 294);
    spineDiv.addColorStop(0, "rgba(255,255,255,0)");
    spineDiv.addColorStop(0.5, "rgba(218, 198, 255, 0.35)");
    spineDiv.addColorStop(1, "rgba(255,255,255,0)");
    ctx.strokeStyle = spineDiv;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(44, 294);
    ctx.lineTo(SPINE_W - 49, 294);
    ctx.stroke();

    // 3.2 Centerpiece 16-Unit Luminous Crystal Matrix Sculpture
    const matrixTotal = 64 * 4 + 14 * 3;
    const matrixX = Math.round(spineCenterX - matrixTotal / 2);
    drawSixteenUnitMatrix(ctx, matrixX, 360, passedUnits, isPreview);

    // Decorative 4-point sparkles accenting the sculpture
    drawFourPointSparkle(ctx, 48, 328, 9, 3, "rgba(238, 204, 132, 0.85)");
    drawFourPointSparkle(ctx, SPINE_W - 44, 710, 8, 2.6, "rgba(200, 152, 255, 0.85)");

    // 3.3 Bottom Optical Barcode Motif + Issue Date + Verification Code
    drawDecorativeBarcode(ctx, 46, 804, SPINE_W - 97, 50, studentId);

    ctx.fillStyle = "rgba(255, 255, 255, 0.16)";
    ctx.fillRect(46, 880, SPINE_W - 97, 1);

    ctx.fillStyle = "#E8E3F6";
    ctx.font = "400 20px 'IBM Plex Sans Thai', sans-serif";
    drawLeftText(ctx, `ให้ไว้ ณ วันที่ ${issueDateText}`, 46, 932, SPINE_W - 86);

    ctx.fillStyle = "#E8C882";
    ctx.font = "500 17px 'IBM Plex Mono', 'Inter Tight', monospace";
    const verifyCode = `VERIFY: CDTI-21901-${studentId}`;
    drawLeftText(ctx, verifyCode, 46, 970, SPINE_W - 86);

    // =========================================================================
    // 4. RIGHT EDITORIAL HEADER (Zero Logo — Pure Typography & Precision Marks)
    // =========================================================================
    // Accent pill marker before English certificate header
    const eyebrowPillGrad = ctx.createLinearGradient(CONTENT_X, 94, CONTENT_X + 34, 94);
    eyebrowPillGrad.addColorStop(0, "#8B3FE0");
    eyebrowPillGrad.addColorStop(1, "#C85BE8");
    ctx.fillStyle = eyebrowPillGrad;
    drawRoundedRect(ctx, CONTENT_X, 100, 32, 6, 3);
    ctx.fill();

    ctx.fillStyle = "#7A2BD9";
    ctx.font = "600 18px 'Inter Tight', 'IBM Plex Mono', sans-serif";
    drawLeftText(
      ctx,
      "CERTIFICATE OF COURSE COMPLETION  |  COURSE 21901-2017",
      CONTENT_X + 46,
      109,
      CONTENT_W - 110
    );

    // Top-right minimal sparkle pair (echoing website signature sparkles)
    drawFourPointSparkle(ctx, CONTENT_R - 14, 102, 13, 3.8, "#8B3FE0");
    drawFourPointSparkle(ctx, CONTENT_R - 36, 118, 7.5, 2.2, "#C69742");

    // School / Institute Name
    ctx.fillStyle = "#1E1636";
    ctx.font = "600 32px 'IBM Plex Sans Thai', sans-serif";
    drawLeftText(ctx, CFG.SCHOOL_NAME_TH, CONTENT_X, 174, CONTENT_W);

    // Editorial two-tone hairline divider
    ctx.fillStyle = "#E2DAF2";
    ctx.fillRect(CONTENT_X, 206, CONTENT_W, 1.5);
    const leadLineGrad = ctx.createLinearGradient(CONTENT_X, 206, CONTENT_X + 180, 206);
    leadLineGrad.addColorStop(0, "#8B3FE0");
    leadLineGrad.addColorStop(1, "#C69742");
    ctx.fillStyle = leadLineGrad;
    ctx.fillRect(CONTENT_X, 205, 180, 3.5);

    // =========================================================================
    // 5. PRESENTATION LINE & MONUMENTAL STUDENT NAME BLOCK
    // =========================================================================
    ctx.fillStyle = "#5C586E";
    ctx.font = "400 25px 'IBM Plex Sans Thai', sans-serif";
    drawLeftText(ctx, "เกียรติบัตรฉบับนี้ให้ไว้เพื่อแสดงว่า", CONTENT_X, 286, CONTENT_W);

    // Architectural Student Showcase Card (Left-anchored pillar, crisp glass tint)
    const nameCardY = 316;
    const nameCardH = 158;
    const nameBg = ctx.createLinearGradient(CONTENT_X, nameCardY, CONTENT_R, nameCardY + nameCardH);
    nameBg.addColorStop(0, "#F6F2FE");
    nameBg.addColorStop(0.7, "#FAF8FE");
    nameBg.addColorStop(1, "#FFFFFF");

    ctx.save();
    ctx.shadowColor = "rgba(74, 40, 140, 0.07)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = nameBg;
    drawRoundedRect(ctx, CONTENT_X, nameCardY, CONTENT_W, nameCardH, 18);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "#E2D8F7";
    ctx.lineWidth = 1.5;
    drawRoundedRect(ctx, CONTENT_X, nameCardY, CONTENT_W, nameCardH, 18);
    ctx.stroke();

    // Left vertical gradient pillar bar inside showcase card
    ctx.save();
    drawRoundedRect(ctx, CONTENT_X, nameCardY, CONTENT_W, nameCardH, 18);
    ctx.clip();
    const pillarGrad = ctx.createLinearGradient(CONTENT_X, nameCardY, CONTENT_X, nameCardY + nameCardH);
    pillarGrad.addColorStop(0, "#8B3FE0");
    pillarGrad.addColorStop(0.55, "#6D28D9");
    pillarGrad.addColorStop(1, "#C69742");
    ctx.fillStyle = pillarGrad;
    ctx.fillRect(CONTENT_X, nameCardY, 8, nameCardH);
    ctx.restore();

    // Student Full Name (Gradient Deep Ink -> Royal Violet)
    const nameInkGrad = ctx.createLinearGradient(CONTENT_X + 36, nameCardY + 30, CONTENT_X + 760, nameCardY + 102);
    nameInkGrad.addColorStop(0, "#141024");
    nameInkGrad.addColorStop(0.65, "#26144D");
    nameInkGrad.addColorStop(1, "#5B21B6");
    ctx.fillStyle = nameInkGrad;
    ctx.font = "700 54px 'IBM Plex Sans Thai', sans-serif";
    drawLeftText(ctx, studentName, CONTENT_X + 38, nameCardY + 82, CONTENT_W - 68);

    // Student ID & Program Level
    ctx.fillStyle = "#524C66";
    ctx.font = "500 21px 'IBM Plex Sans Thai', 'Inter Tight', sans-serif";
    drawLeftText(
      ctx,
      `รหัสนักเรียน ${studentId}  |  ${CFG.LEVEL_PROGRAM_TH}`,
      CONTENT_X + 38,
      nameCardY + 128,
      CONTENT_W - 68
    );

    // =========================================================================
    // 6. COURSE ACHIEVEMENT STATEMENT
    // =========================================================================
    ctx.fillStyle = "#322F42";
    ctx.font = "400 24px 'IBM Plex Sans Thai', sans-serif";
    drawLeftText(
      ctx,
      "ได้ผ่านการเรียนรู้เนื้อหาและแบบทดสอบครบทั้ง 16 หน่วยการเรียนรู้ (เกณฑ์ผ่านร้อยละ 80)",
      CONTENT_X,
      542,
      CONTENT_W
    );

    ctx.fillStyle = "#6D28D9";
    ctx.font = "700 30px 'IBM Plex Sans Thai', 'Inter Tight', sans-serif";
    drawLeftText(
      ctx,
      `รายวิชา ${CFG.COURSE_NAME_TH} (${CFG.COURSE_CODE})`,
      CONTENT_X,
      594,
      CONTENT_W
    );

    // =========================================================================
    // 7. ACHIEVEMENT SUMMARY TELEMETRY CARDS (3 Crisp Columns)
    // =========================================================================
    const cols = [
      {
        label: "สถานะหน่วยการเรียน",
        val: isPreview && passedUnits < 16 ? "16 / 16 หน่วย (ตัวอย่าง)" : `${passedUnits} / 16 หน่วย (100%)`,
        accent: "#8B3FE0"
      },
      {
        label: "คะแนนสะสมรวมสุทธิ",
        val: isPreview && totalScore === 0 ? "คะแนนตามจริงเมื่อเรียนจบ" : `${totalScore} คะแนน`,
        accent: "#C69742"
      },
      {
        label: "เวลาทำกิจกรรมรวม",
        val: `${totalTime} นาที`,
        accent: "#6D28D9"
      }
    ];

    const stripY = 644;
    const stripH = 104;
    const cardGap = 18;
    const cardW = (CONTENT_W - cardGap * 2) / 3;

    cols.forEach((c, idx) => {
      const cx = CONTENT_X + idx * (cardW + cardGap);

      ctx.save();
      ctx.shadowColor = "rgba(25, 17, 48, 0.05)";
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.fillStyle = "#FFFFFF";
      drawRoundedRect(ctx, cx, stripY, cardW, stripH, 14);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = "#E5DFF2";
      ctx.lineWidth = 1.3;
      drawRoundedRect(ctx, cx, stripY, cardW, stripH, 14);
      ctx.stroke();

      // Short colored accent bar inside top of each telemetry card
      ctx.fillStyle = c.accent;
      drawRoundedRect(ctx, cx + 22, stripY + 14, 34, 4, 2);
      ctx.fill();

      ctx.fillStyle = "#625D75";
      ctx.font = "500 17px 'IBM Plex Sans Thai', sans-serif";
      drawLeftText(ctx, c.label, cx + 22, stripY + 46, cardW - 44);

      ctx.fillStyle = "#161226";
      ctx.font = "700 22px 'IBM Plex Sans Thai', 'Inter Tight', sans-serif";
      drawLeftText(ctx, c.val, cx + 22, stripY + 82, cardW - 44);
    });

    // =========================================================================
    // 8. CLEAN PREVIEW BANNER (Only when previewing before 100% completion)
    // =========================================================================
    const isUnlocked = Boolean(user && user.passed_units_count >= CFG.TOTAL_UNITS);
    if (isPreview && !isUnlocked) {
      ctx.save();
      const badgeY = 776;
      const badgeH = 46;

      ctx.fillStyle = "#FFFBEB";
      drawRoundedRect(ctx, CONTENT_X, badgeY, CONTENT_W, badgeH, 12);
      ctx.fill();

      ctx.strokeStyle = "#F0C86B";
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = "#92570A";
      ctx.font = "500 18px 'IBM Plex Sans Thai', 'Inter Tight', sans-serif";
      drawCenteredText(
        ctx,
        "ตัวอย่างเกียรติบัตร (PREVIEW)  |  ปลดล็อกไฟล์จริงเมื่อสอบผ่านครบ 16 หน่วย (100%)",
        CONTENT_X + CONTENT_W / 2,
        badgeY + 29,
        CONTENT_W - 28
      );
      ctx.restore();
    }

    // =========================================================================
    // 9. BOTTOM PRECISION SEAL & INSTRUCTOR SIGNATURE
    // =========================================================================
    const sealCy = isPreview && !isUnlocked ? 948 : 930;
    const sigLineY = isPreview && !isUnlocked ? 934 : 916;

    // Left of right panel: Bespoke Guilloche Credential Seal
    drawPrecisionSeal(ctx, CONTENT_X + 66, sealCy);

    // Subtle geometric accent lines beside the seal
    ctx.strokeStyle = "rgba(139, 63, 224, 0.22)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(CONTENT_X + 150, sealCy);
    ctx.lineTo(CONTENT_X + 410, sealCy);
    ctx.stroke();
    drawFourPointSparkle(ctx, CONTENT_X + 422, sealCy, 6.5, 2, "#C69742");

    // Right of right panel: Instructor Signature Block
    const sigCenterX = CONTENT_R - 175;

    ctx.strokeStyle = "#A39BB8";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sigCenterX - 165, sigLineY);
    ctx.lineTo(sigCenterX + 165, sigLineY);
    ctx.stroke();

    // Subtle centered diamond accent on signature line
    drawFourPointSparkle(ctx, sigCenterX, sigLineY, 6, 2.2, "#8B3FE0");

    ctx.fillStyle = "#161226";
    ctx.font = "600 22px 'IBM Plex Sans Thai', sans-serif";
    drawCenteredText(ctx, `(${CFG.INSTRUCTOR_NAME_TH})`, sigCenterX, sigLineY + 40, 340);

    ctx.fillStyle = "#5C586E";
    ctx.font = "400 18px 'IBM Plex Sans Thai', sans-serif";
    drawCenteredText(ctx, "ผู้สอนประจำรายวิชา 21901-2017", sigCenterX, sigLineY + 72, 340);
  }

  /**
   * สร้างและดาวน์โหลดไฟล์ PNG ความละเอียดสูง (เฉพาะผู้ที่ผ่านครบ 16 หน่วย 100% เท่านั้น)
   */
  let isDownloadingCertificate = false;

  async function downloadOfficialCertificate() {
    const user = window.AuthManager?.getCurrentUser();
    if (!user || isDownloadingCertificate) return;

    if (Number(user.passed_units_count || 0) < CFG.TOTAL_UNITS) {
      window.AppUtils.showToast(
        `ยังดาวน์โหลดไม่ได้ ต้องสอบผ่านครบทั้ง ${CFG.TOTAL_UNITS} หน่วยก่อน`,
        "error"
      );
      return;
    }

    isDownloadingCertificate = true;
    window.MotionEngine?.startTopLoader();
    try {
      let claimRes = null;
      try {
        claimRes = await window.BackendAPI.claimCertificate(user.student_id);
      } catch (e) {
        // เครือข่ายขัดข้อง: อนุญาตให้ดาวน์โหลดจากข้อมูลที่ยืนยันแล้วในเซสชัน
      }
      if (claimRes && claimRes.ok && claimRes.user) {
        window.AuthManager.updateSessionData(claimRes.user, null, { silent: true });
      } else if (claimRes && claimRes.ok === false && !claimRes.offline) {
        // เซิร์ฟเวอร์ยืนยันว่ายังไม่ผ่านเกณฑ์: ไม่ออกเกียรติบัตร
        window.AppUtils.showToast(claimRes.error || "เซิร์ฟเวอร์ยังไม่ยืนยันสิทธิ์รับเกียรติบัตร", "error");
        return;
      }

      const latestUser = window.AuthManager.getCurrentUser() || user;
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
    } catch (err) {
      console.warn("[Certificate] download failed:", err);
      window.AppUtils.showToast("สร้างไฟล์เกียรติบัตรไม่สำเร็จ กรุณาลองอีกครั้ง", "error");
    } finally {
      isDownloadingCertificate = false;
      window.MotionEngine?.doneTopLoader();
    }
  }

  window.CertificateEngine = {
    renderCertificateCanvas,
    downloadOfficialCertificate
  };
})();
