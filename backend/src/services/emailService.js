import nodemailer from 'nodemailer';
import db from '../database/db.js';

/**
 * Configure Nodemailer Transporter
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || (process.env.SMTP_USER?.includes('gmail') ? 'smtp.gmail.com' : null);
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || process.env.GMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;

  if (user && pass) {
    const isGmail = host === 'smtp.gmail.com' || (!process.env.SMTP_HOST && user.includes('@gmail.com'));
    
    if (isGmail) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user,
          pass: pass.replace(/\s+/g, '') // remove spaces from Gmail app passwords
        }
      });
    }

    return nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  return null;
}

export const emailService = {
  /**
   * Test SMTP connection status
   */
  async testConnection() {
    const transporter = createTransporter();
    if (!transporter) {
      return {
        configured: false,
        message: 'SMTP credentials not configured in .env. Simulator mode is active.'
      };
    }

    try {
      await transporter.verify();
      return {
        configured: true,
        success: true,
        message: `Connected successfully to SMTP server as ${process.env.SMTP_USER || process.env.GMAIL_USER}`
      };
    } catch (error) {
      return {
        configured: true,
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Send certificate email to recipient with PDF attachment
   * @param {Object} params
   * @returns {Promise<{success: boolean, messageId?: string, error?: string, simulated?: boolean}>}
   */
  async sendCertificateEmail({
    certificateId,
    recipientEmail,
    recipientName,
    internshipDomain,
    pdfBuffer,
    pdfFilename
  }) {
    const logId = `elog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const subject = `Congratulations! Your ${internshipDomain || 'Internship'} Certificate`;
    const verifyUrl = `http://localhost:5173/verify/${certificateId}`;
    const safeFilename = pdfFilename || `${recipientName.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { margin: 8px 0 0; font-size: 14px; opacity: 0.85; }
          .content { padding: 32px 24px; }
          .badge { display: inline-block; background-color: #eff6ff; color: #1d4ed8; padding: 6px 14px; border-radius: 9999px; font-weight: 600; font-size: 13px; margin-bottom: 16px; border: 1px solid #dbeafe; }
          .card { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0; }
          .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
          .card-row:last-child { margin-bottom: 0; }
          .card-label { color: #64748b; }
          .card-value { font-weight: 600; color: #0f172a; }
          .btn { display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px; text-align: center; margin: 16px 0; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25); }
          .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div style="font-size: 32px; margin-bottom: 8px;">🎓</div>
            <h1>Internship Certificate Awarded</h1>
            <p>Official Verification & Credential Delivery</p>
          </div>
          <div class="content">
            <span class="badge">Official Credential</span>
            <p style="font-size: 16px;">Dear <strong>${recipientName}</strong>,</p>
            <p>Congratulations on successfully completing your <strong>${internshipDomain}</strong>! The academic and evaluation committee has reviewed your assessments and verified your completion credentials.</p>
            
            <div class="card">
              <div class="card-row">
                <span class="card-label">Certificate ID:</span>
                <span class="card-value" style="font-family: monospace; color: #1d4ed8;">${certificateId}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Program:</span>
                <span class="card-value">${internshipDomain}</span>
              </div>
              <div class="card-row">
                <span class="card-label">Status:</span>
                <span class="card-value" style="color: #16a34a;">Verified & Active</span>
              </div>
            </div>

            <p>Your high-resolution PDF certificate has been generated and is attached to this email. You may also view and verify your credential publicly at any time:</p>
            
            <div style="text-align: center;">
              <a href="${verifyUrl}" class="btn" target="_blank">Verify Credential Online</a>
            </div>

            <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
              You can add this verifiable credential to your LinkedIn profile, resume, and portfolio using Certificate ID <strong>${certificateId}</strong>.
            </p>
          </div>
          <div class="footer">
            <p>© 2026 InternCert Platform • National Internship & Certification Cell</p>
            <p>This is an automated system notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Find matching certificate database ID
    const certRow = db.prepare('SELECT id FROM certificates WHERE certificate_id = ?').get(certificateId);
    const certDbId = certRow ? certRow.id : null;

    const transporter = createTransporter();

    // 1. LIVE DISPATCH VIA NODEMAILER (if SMTP configured)
    if (transporter) {
      try {
        const senderAddress = process.env.SMTP_FROM || `"InternCert Certification Cell" <${process.env.SMTP_USER || process.env.GMAIL_USER}>`;
        
        const mailOptions = {
          from: senderAddress,
          to: recipientEmail,
          subject,
          html: htmlBody,
          attachments: pdfBuffer ? [
            {
              filename: safeFilename,
              content: Buffer.from(pdfBuffer),
              contentType: 'application/pdf'
            }
          ] : []
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[Email] Live email sent via SMTP to ${recipientEmail} (Message ID: ${info.messageId})`);

        // Record successful dispatch in database logs
        if (certDbId) {
          const existingLog = db.prepare('SELECT id FROM email_logs WHERE certificate_id = ?').get(certDbId);
          if (existingLog) {
            db.prepare(`
              UPDATE email_logs 
              SET status = 'sent', sent_at = datetime('now'), error_message = NULL, retry_count = retry_count + 1
              WHERE id = ?
            `).run(existingLog.id);
          } else {
            db.prepare(`
              INSERT INTO email_logs (id, certificate_id, recipient_email, recipient_name, status, subject, sent_at, retry_count)
              VALUES (?, ?, ?, ?, 'sent', ?, datetime('now'), 0)
            `).run(logId, certDbId, recipientEmail, recipientName, subject);
          }
        }

        return {
          success: true,
          messageId: info.messageId,
          recipientEmail,
          live: true
        };
      } catch (liveError) {
        console.error('[Email] SMTP live dispatch failed:', liveError.message);

        // Record failure in DB
        if (certDbId) {
          db.prepare(`
            INSERT INTO email_logs (id, certificate_id, recipient_email, recipient_name, status, subject, error_message, sent_at, retry_count)
            VALUES (?, ?, ?, ?, 'failed', ?, ?, datetime('now'), 0)
          `).run(logId, certDbId, recipientEmail, recipientName, subject, liveError.message);
        }

        return { success: false, error: liveError.message, live: true };
      }
    }

    // 2. SIMULATED DISPATCH FALLBACK (when SMTP credentials not provided in .env)
    const isSimulatedFail = recipientEmail.includes('fail') || recipientEmail.includes('timeout');

    if (isSimulatedFail) {
      const errorMsg = 'SMTP connection timeout to recipient mail server (421 Rate limit exceeded)';
      if (certDbId) {
        db.prepare(`
          INSERT INTO email_logs (id, certificate_id, recipient_email, recipient_name, status, subject, error_message, sent_at, retry_count)
          VALUES (?, ?, ?, ?, 'failed', ?, ?, datetime('now'), 0)
        `).run(logId, certDbId, recipientEmail, recipientName, subject, errorMsg);
      }
      return { success: false, error: errorMsg, simulated: true };
    }

    if (certDbId) {
      const existingLog = db.prepare('SELECT id FROM email_logs WHERE certificate_id = ?').get(certDbId);
      if (existingLog) {
        db.prepare(`
          UPDATE email_logs 
          SET status = 'sent', sent_at = datetime('now'), error_message = NULL, retry_count = retry_count + 1
          WHERE id = ?
        `).run(existingLog.id);
      } else {
        db.prepare(`
          INSERT INTO email_logs (id, certificate_id, recipient_email, recipient_name, status, subject, sent_at, retry_count)
          VALUES (?, ?, ?, ?, 'sent', ?, datetime('now'), 0)
        `).run(logId, certDbId, recipientEmail, recipientName, subject);
      }
    }

    console.log(`[Email] [Simulator] Certificate email logged for ${recipientEmail} (ID: ${certificateId})`);
    return {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      recipientEmail,
      simulated: true
    };
  },

  /**
   * Retry sending a failed email log
   */
  async retryEmail(logId) {
    const log = db.prepare(`
      SELECT el.*, cert.certificate_id, cert.recipient_name, cert.internship_domain, cert.pdf_path
      FROM email_logs el
      JOIN certificates cert ON el.certificate_id = cert.id
      WHERE el.id = ?
    `).get(logId);

    if (!log) {
      throw new Error('Email log record not found');
    }

    // Re-dispatch using storage PDF
    let pdfBuffer = null;
    if (log.pdf_path) {
      const storageService = (await import('./storageService.js')).default;
      pdfBuffer = await storageService.getCertificate(log.pdf_path);
    }

    const res = await this.sendCertificateEmail({
      certificateId: log.certificate_id,
      recipientEmail: log.recipient_email,
      recipientName: log.recipient_name,
      internshipDomain: log.internship_domain,
      pdfBuffer
    });

    return {
      success: res.success,
      message: res.success 
        ? `Email successfully re-dispatched to ${log.recipient_email}`
        : `Email retry failed: ${res.error}`
    };
  }
};

export default emailService;
