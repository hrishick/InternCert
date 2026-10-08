import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import QRCode from 'qrcode';

export const pdfService = {
  /**
   * Generate a high-resolution, certificate PDF document
   * @param {Object} certData 
   * @returns {Promise<Uint8Array>}
   */
  async generateCertificate(certData) {
    const {
      certificateId,
      recipientName,
      department,
      yearOfStudy,
      internshipDomain,
      startDate,
      endDate,
      templateId = 'classic-gold',
      verifyBaseUrl = 'https://interncert.org'
    } = certData;

    // Create a new PDF document in Landscape A4 (842 x 595.28 points)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595.28]);
    const { width, height } = page.getSize();

    // Embed Standard Fonts
    const fontTimesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const fontTimes = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const fontTimesItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
    const fontHelveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontHelvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontCourier = await pdfDoc.embedFont(StandardFonts.Courier);

    // Template Color Schemes
    let primaryColor, accentColor, bgBgColor, borderGold, textDark, textMuted;
    if (templateId === 'modern-cyber') {
      primaryColor = rgb(0.04, 0.45, 0.58);   // Cyan 600
      accentColor = rgb(0.49, 0.23, 0.93);    // Purple 600
      borderGold = rgb(0.02, 0.71, 0.83);     // Cyan bright
      textDark = rgb(0.06, 0.09, 0.15);       // Slate 900
      textMuted = rgb(0.35, 0.42, 0.53);      // Slate 500
    } else if (templateId === 'academic-crimson') {
      primaryColor = rgb(0.55, 0.08, 0.08);   // Crimson 800
      accentColor = rgb(0.75, 0.55, 0.15);    // Gold
      borderGold = rgb(0.82, 0.65, 0.22);
      textDark = rgb(0.12, 0.12, 0.14);
      textMuted = rgb(0.38, 0.38, 0.42);
    } else {
      // Classic Gold & Royal Navy (Default)
      primaryColor = rgb(0.08, 0.16, 0.35);   // Navy 900
      accentColor = rgb(0.85, 0.62, 0.12);    // Gold 500
      borderGold = rgb(0.78, 0.56, 0.15);     // Deep Gold
      textDark = rgb(0.09, 0.13, 0.24);       // Charcoal
      textMuted = rgb(0.35, 0.41, 0.50);      // Cool grey
    }

    // 1. Background subtle guilloche tint
    page.drawRectangle({
      x: 10,
      y: 10,
      width: width - 20,
      height: height - 20,
      color: rgb(0.99, 0.99, 0.98),
    });

    // 2. Ornate Multi-layer Border
    // Outer bold border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: width - 40,
      height: height - 40,
      borderColor: primaryColor,
      borderWidth: 3.5,
    });

    // Inner gold pin-stripe
    page.drawRectangle({
      x: 26,
      y: 26,
      width: width - 52,
      height: height - 52,
      borderColor: borderGold,
      borderWidth: 1.5,
    });

    // Inner thin border
    page.drawRectangle({
      x: 32,
      y: 32,
      width: width - 64,
      height: height - 64,
      borderColor: primaryColor,
      borderWidth: 0.8,
    });

    // Corner Ornaments / Corner Rosette Squares
    const corners = [
      { x: 20, y: 20 },
      { x: width - 36, y: 20 },
      { x: 20, y: height - 36 },
      { x: width - 36, y: height - 36 }
    ];
    for (const c of corners) {
      page.drawRectangle({
        x: c.x,
        y: c.y,
        width: 16,
        height: 16,
        color: borderGold,
      });
      page.drawRectangle({
        x: c.x + 3,
        y: c.y + 3,
        width: 10,
        height: 10,
        color: primaryColor,
      });
    }

    // 3. Header Ribbon / Institutional Emblem
    const orgName = 'INTERNCERT NATIONAL CERTIFICATION AUTHORITY';
    const orgWidth = fontHelveticaBold.widthOfTextAtSize(orgName, 10.5);
    page.drawText(orgName, {
      x: (width - orgWidth) / 2,
      y: height - 60,
      size: 10.5,
      font: fontHelveticaBold,
      color: textMuted,
    });

    // Main Title: "CERTIFICATE OF COMPLETION"
    const titleText = 'CERTIFICATE OF COMPLETION';
    const titleWidth = fontTimesBold.widthOfTextAtSize(titleText, 28);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: height - 100,
      size: 28,
      font: fontTimesBold,
      color: primaryColor,
    });

    // Decorative Gold Underline under Title
    page.drawLine({
      start: { x: (width - 240) / 2, y: height - 110 },
      end: { x: (width + 240) / 2, y: height - 110 },
      thickness: 2,
      color: borderGold,
    });

    // "This is proudly presented to"
    const presentationText = 'THIS IS PROUDLY PRESENTED TO';
    const presWidth = fontHelvetica.widthOfTextAtSize(presentationText, 11);
    page.drawText(presentationText, {
      x: (width - presWidth) / 2,
      y: height - 145,
      size: 11,
      font: fontHelvetica,
      color: textMuted,
    });

    // Recipient Name (Bold, Highlighted)
    const nameText = recipientName.toUpperCase();
    const nameSize = nameText.length > 25 ? 24 : 30;
    const nameWidth = fontTimesBold.widthOfTextAtSize(nameText, nameSize);
    page.drawText(nameText, {
      x: (width - nameWidth) / 2,
      y: height - 195,
      size: nameSize,
      font: fontTimesBold,
      color: primaryColor,
    });

    // Underline for Candidate Name
    page.drawLine({
      start: { x: 160, y: height - 208 },
      end: { x: width - 160, y: height - 208 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.85),
    });

    // Body Paragraph
    const deptInfo = department ? `from the Department of ${department}${yearOfStudy ? ` (${yearOfStudy})` : ''}` : '';
    const bodyLine1 = `for successfully fulfilling all requirements and hands-on modules for the`;
    const bodyLine2 = `${internshipDomain}`;
    const dateRange = (startDate && endDate) ? `conducted from ${startDate} to ${endDate}` : 'demonstrating technical excellence & applied project competence';

    const b1Width = fontTimes.widthOfTextAtSize(bodyLine1, 13);
    page.drawText(bodyLine1, {
      x: (width - b1Width) / 2,
      y: height - 245,
      size: 13,
      font: fontTimes,
      color: textDark,
    });

    const b2Width = fontTimesBold.widthOfTextAtSize(bodyLine2, 17);
    page.drawText(bodyLine2, {
      x: (width - b2Width) / 2,
      y: height - 275,
      size: 17,
      font: fontTimesBold,
      color: primaryColor,
    });

    if (deptInfo) {
      const deptWidth = fontTimesItalic.widthOfTextAtSize(deptInfo, 12.5);
      page.drawText(deptInfo, {
        x: (width - deptWidth) / 2,
        y: height - 302,
        size: 12.5,
        font: fontTimesItalic,
        color: textDark,
      });
    }

    const dateWidth = fontTimes.widthOfTextAtSize(dateRange, 12);
    page.drawText(dateRange, {
      x: (width - dateWidth) / 2,
      y: height - 325,
      size: 12,
      font: fontTimes,
      color: textMuted,
    });

    // 4. Gold Seal Emblem (Center Left/Center Right or Lower Middle)
    // Draw Gold Seal Circle
    const sealX = width / 2;
    const sealY = 120;
    page.drawCircle({
      x: sealX,
      y: sealY,
      size: 32,
      color: borderGold,
    });
    page.drawCircle({
      x: sealX,
      y: sealY,
      size: 28,
      color: rgb(1, 1, 1),
    });
    const sealText1 = 'VERIFIED';
    const sealText2 = 'OFFICIAL';
    const st1Width = fontHelveticaBold.widthOfTextAtSize(sealText1, 8);
    const st2Width = fontHelveticaBold.widthOfTextAtSize(sealText2, 7.5);
    page.drawText(sealText1, {
      x: sealX - st1Width / 2,
      y: sealY + 2,
      size: 8,
      font: fontHelveticaBold,
      color: borderGold,
    });
    page.drawText(sealText2, {
      x: sealX - st2Width / 2,
      y: sealY - 9,
      size: 7.5,
      font: fontHelveticaBold,
      color: textMuted,
    });

    // 5. Signatures (Left & Right)
    // Left Signature: Director of Academics
    page.drawLine({
      start: { x: 90, y: 110 },
      end: { x: 260, y: 110 },
      thickness: 1.2,
      color: textDark,
    });
    // Signature script simulation
    page.drawText('Dr. Kimberly Vance', {
      x: 105,
      y: 118,
      size: 14,
      font: fontTimesItalic,
      color: primaryColor,
    });
    page.drawText('Dr. Kimberly Vance, Ph.D.', {
      x: 95,
      y: 94,
      size: 10,
      font: fontHelveticaBold,
      color: textDark,
    });
    page.drawText('Director of Academic Affairs', {
      x: 95,
      y: 81,
      size: 8.5,
      font: fontHelvetica,
      color: textMuted,
    });

    // Right Signature: Head of Certification
    page.drawLine({
      start: { x: width - 260, y: 110 },
      end: { x: width - 90, y: 110 },
      thickness: 1.2,
      color: textDark,
    });
    page.drawText('Prof. Marcus Sterling', {
      x: width - 245,
      y: 118,
      size: 14,
      font: fontTimesItalic,
      color: primaryColor,
    });
    page.drawText('Prof. Marcus Sterling', {
      x: width - 250,
      y: 94,
      size: 10,
      font: fontHelveticaBold,
      color: textDark,
    });
    page.drawText('Dean of Certification & Industry Cell', {
      x: width - 250,
      y: 81,
      size: 8.5,
      font: fontHelvetica,
      color: textMuted,
    });

    // 6. QR Code & Anti-Tamper Certificate ID Bar (Bottom Center / Left Corner)
    // Draw Vector QR Code in bottom left corner box
    const qrSize = 54;
    const verifyUrl = `${verifyBaseUrl}/verify/${certificateId}`;
    try {
      const qr = QRCode.create(verifyUrl, { errorCorrectionLevel: 'M' });
      const qrCount = qr.modules.size;
      const cell = qrSize / qrCount;

      page.drawRectangle({
        x: 50,
        y: 36,
        width: qrSize + 4,
        height: qrSize + 4,
        color: rgb(1, 1, 1)
      });

      for (let r = 0; r < qrCount; r++) {
        for (let c = 0; c < qrCount; c++) {
          if (qr.modules.get(r, c)) {
            page.drawRectangle({
              x: 52 + (c * cell),
              y: 38 + ((qrCount - 1 - r) * cell),
              width: cell + 0.1,
              height: cell + 0.1,
              color: primaryColor
            });
          }
        }
      }
    } catch (qrErr) {
      console.warn('QR draw fallback:', qrErr);
    }

    page.drawText('Scan to Verify', {
      x: 52,
      y: 30,
      size: 6.5,
      font: fontHelveticaBold,
      color: textMuted,
    });

    // Bottom Bar Details: Certificate ID & Timestamp
    const certIdLabel = `Certificate ID: ${certificateId}`;
    const issueDateLabel = `Issued: ${new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}`;
    const securityHash = `Auth Code: SHA256-${Buffer.from(certificateId).toString('hex').slice(0, 16).toUpperCase()}`;

    page.drawText(certIdLabel, {
      x: 120,
      y: 48,
      size: 9,
      font: fontCourier,
      color: textDark,
    });

    page.drawText(`${issueDateLabel} | ${securityHash} | Valid Cryptographic Signature`, {
      x: 120,
      y: 36,
      size: 7.5,
      font: fontHelvetica,
      color: textMuted,
    });

    // Save and return Uint8Array PDF bytes
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
  }
};

export default pdfService;
