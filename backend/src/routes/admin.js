import express from 'express';
import multer from 'multer';
import JSZip from 'jszip';
import path from 'path';
import fs from 'fs';
import db from '../database/db.js';
import excelService from '../services/excelService.js';
import pdfService from '../services/pdfService.js';
import storageService from '../services/storageService.js';
import emailService from '../services/emailService.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// 1. GET /api/admin/stats - Analytics Dashboard metrics & chart data
router.get('/stats', (req, res) => {
  try {
    const totalCandidates = db.prepare('SELECT COUNT(*) as count FROM candidates').get().count;
    const totalInternships = db.prepare("SELECT COUNT(*) as count FROM internships WHERE status = 'active'").get().count;
    const completedInternships = db.prepare("SELECT COUNT(*) as count FROM candidates WHERE status = 'certified'").get().count;
    const totalCertificates = db.prepare("SELECT COUNT(*) as count FROM certificates WHERE status = 'valid'").get().count;
    const emailsSent = db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE status = 'sent'").get().count;
    const failedEmails = db.prepare("SELECT COUNT(*) as count FROM email_logs WHERE status = 'failed'").get().count;
    const pendingCandidates = db.prepare("SELECT COUNT(*) as count FROM candidates WHERE status = 'pending'").get().count;

    // Charts: Certificates by domain
    const certsByDomain = db.prepare(`
      SELECT internship_domain as domain, COUNT(*) as count 
      FROM certificates 
      GROUP BY internship_domain
    `).all();

    // Charts: Monthly timeline (last 6 months or recent generation dates)
    const recentActivity = db.prepare(`
      SELECT 
        c.recipient_name as candidateName,
        c.recipient_email as candidateEmail,
        c.internship_domain as internshipDomain,
        c.certificate_id as certificateId,
        c.generated_at as date,
        COALESCE(el.status, 'queued') as emailStatus
      FROM certificates c
      LEFT JOIN email_logs el ON c.id = el.certificate_id
      ORDER BY c.generated_at DESC
      LIMIT 10
    `).all();

    // Email delivery breakdown
    const emailBreakdown = [
      { name: 'Delivered', value: emailsSent, color: '#10b981' },
      { name: 'Failed', value: failedEmails, color: '#ef4444' },
      { name: 'Queued', value: Math.max(0, totalCertificates - (emailsSent + failedEmails)), color: '#f59e0b' }
    ];

    res.json({
      metrics: {
        totalCandidates,
        totalInternships,
        completedInternships,
        totalCertificates,
        emailsSent,
        failedEmails,
        pendingCandidates,
        deliveryRate: totalCertificates > 0 ? Math.round((emailsSent / totalCertificates) * 100) : 100
      },
      charts: {
        certsByDomain,
        emailBreakdown
      },
      recentActivity
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve admin analytics' });
  }
});

// 2. GET /api/admin/candidates - List candidates with search, filter, pagination
router.get('/candidates', (req, res) => {
  try {
    const { search = '', domain = '', status = '', page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let query = `
      SELECT 
        c.id,
        c.name,
        c.email,
        c.department,
        c.year_of_study,
        c.internship_domain,
        c.start_date,
        c.end_date,
        c.source,
        c.created_at,
        CASE 
          WHEN cert.certificate_id IS NOT NULL THEN 'certified' 
          ELSE c.status 
        END as status,
        cert.certificate_id,
        cert.id as cert_db_id,
        COALESCE(cert.pdf_url, '/api/certificates/' || cert.certificate_id || '/download') as pdf_url,
        el.status as email_status,
        el.id as email_log_id
      FROM candidates c
      LEFT JOIN certificates cert ON (c.id = cert.candidate_id OR LOWER(c.email) = LOWER(cert.recipient_email))
      LEFT JOIN email_logs el ON cert.id = el.certificate_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.department LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (domain) {
      query += ` AND c.internship_domain = ?`;
      params.push(domain);
    }

    if (status) {
      if (status === 'certified') {
        query += ` AND (c.status = 'certified' OR cert.certificate_id IS NOT NULL)`;
      } else {
        query += ` AND c.status = ? AND cert.certificate_id IS NULL`;
        params.push(status);
      }
    }

    query += ` GROUP BY c.id ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const candidates = db.prepare(query).all(...params);
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM candidates').get().count;

    res.json({
      candidates,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Candidates list error:', error);
    res.status(500).json({ error: 'Failed to fetch candidates' });
  }
});

// 3. POST /api/admin/candidates - Add candidate manually & auto-create User ID
router.post('/candidates', async (req, res) => {
  try {
    const { name, email, department, yearOfStudy, internshipDomain, startDate, endDate } = req.body;

    if (!name || !email || !department || !internshipDomain) {
      return res.status(400).json({ error: 'Name, email, department, and domain are required' });
    }

    const candidateId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const lowerEmail = email.toLowerCase().trim();

    // 1. Insert Candidate
    db.prepare(`
      INSERT INTO candidates (id, name, email, department, year_of_study, internship_domain, start_date, end_date, source, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual_entry', 'pending')
    `).run(candidateId, name, lowerEmail, department, yearOfStudy || '3rd Year', internshipDomain, startDate || '01 June 2026', endDate || '30 June 2026');

    // 2. Bi-directional Sync: Auto-create User account if not exists
    const existingUser = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(lowerEmail);
    if (!existingUser) {
      const crypto = await import('crypto');
      const passHash = crypto.default.createHash('sha256').update('password123').digest('hex');
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const studentId = `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      db.transaction(() => {
        db.prepare(`
          INSERT INTO users (id, name, email, password_hash, role)
          VALUES (?, ?, ?, ?, 'student')
        `).run(userId, name, lowerEmail, passHash);

        db.prepare(`
          INSERT INTO students (id, user_id, name, email, department, year_of_study)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(studentId, userId, name, lowerEmail, department, yearOfStudy || '3rd Year');
      })();
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, details)
      VALUES (?, 'MANUAL_CANDIDATE_CREATE', ?)
    `).run(`aud_${Date.now()}`, `Created candidate & user account for ${name} (${lowerEmail})`);

    res.status(201).json({ success: true, id: candidateId, message: 'Candidate and student user account created successfully' });
  } catch (error) {
    console.error('Add candidate error:', error);
    res.status(500).json({ error: 'Failed to add candidate: ' + error.message });
  }
});

// 4. PUT /api/admin/candidates/:id - Edit candidate
router.put('/candidates/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, yearOfStudy, internshipDomain, startDate, endDate, status } = req.body;

    db.prepare(`
      UPDATE candidates 
      SET name = ?, email = ?, department = ?, year_of_study = ?, internship_domain = ?, start_date = ?, end_date = ?, status = COALESCE(?, status)
      WHERE id = ?
    `).run(name, email.toLowerCase(), department, yearOfStudy, internshipDomain, startDate, endDate, status, id);

    res.json({ success: true, message: 'Candidate updated successfully' });
  } catch (error) {
    console.error('Update candidate error:', error);
    res.status(500).json({ error: 'Failed to update candidate' });
  }
});

// 5. DELETE /api/admin/candidates/:id - Delete candidate
router.delete('/candidates/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM candidates WHERE id = ?').run(id);
    res.json({ success: true, message: 'Candidate deleted successfully' });
  } catch (error) {
    console.error('Delete candidate error:', error);
    res.status(500).json({ error: 'Failed to delete candidate' });
  }
});

// 6. POST /api/admin/candidates/parse-excel - Upload Excel/CSV, parse & validate
router.post('/candidates/parse-excel', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an Excel (.xlsx, .xls) or CSV file' });
    }

    const rawRows = excelService.parseBuffer(req.file.buffer);
    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty or has no readable rows' });
    }

    const validationReport = excelService.validateCandidateRows(rawRows);
    res.json({
      success: true,
      filename: req.file.originalname,
      ...validationReport
    });
  } catch (error) {
    console.error('Excel parse error:', error);
    res.status(500).json({ error: `Failed to parse Excel file: ${error.message}` });
  }
});

// 7. POST /api/admin/candidates/import - Import validated candidate rows & auto-create User accounts
router.post('/candidates/import', async (req, res) => {
  try {
    const { rows } = req.body;
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No valid candidate rows provided for import' });
    }

    const crypto = await import('crypto');
    const passHash = crypto.default.createHash('sha256').update('password123').digest('hex');

    let importedCount = 0;
    const insertCandidateStmt = db.prepare(`
      INSERT INTO candidates (id, name, email, department, year_of_study, internship_domain, start_date, end_date, source, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'excel_import', 'pending')
    `);

    const insertUserStmt = db.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, password_hash, role)
      VALUES (?, ?, ?, ?, 'student')
    `);

    const insertStudentStmt = db.prepare(`
      INSERT OR IGNORE INTO students (id, user_id, name, email, department, year_of_study)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const row of rows) {
      if (row.isValid) {
        const candId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const studentId = `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const lowerEmail = row.email.toLowerCase().trim();

        insertCandidateStmt.run(
          candId,
          row.name,
          lowerEmail,
          row.department,
          row.yearOfStudy,
          row.internshipDomain,
          row.startDate,
          row.endDate
        );

        // Bi-directional auto user creation
        const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(lowerEmail);
        if (!existing) {
          insertUserStmt.run(userId, row.name, lowerEmail, passHash);
          insertStudentStmt.run(studentId, userId, row.name, lowerEmail, row.department, row.yearOfStudy || '3rd Year');
        }

        importedCount++;
      }
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, details)
      VALUES (?, 'EXCEL_BATCH_IMPORT', ?)
    `).run(`aud_${Date.now()}`, `Imported ${importedCount} candidates via Excel bulk import wizard`);

    res.json({
      success: true,
      importedCount,
      message: `Successfully imported ${importedCount} candidate records`
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import candidates to database' });
  }
});

// 8. GET /api/admin/sample-excel - Download Sample Template Excel
router.get('/sample-excel', (req, res) => {
  try {
    const buffer = excelService.generateSampleExcel();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sample_candidates_template.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Sample excel error:', error);
    res.status(500).json({ error: 'Failed to generate sample Excel' });
  }
});

// 9. POST /api/admin/certificates/generate - Single & Bulk Certificate Generation
router.post('/certificates/generate', async (req, res) => {
  try {
    const { candidateIds, templateId = 'classic-gold', sendEmail = true } = req.body;

    let targetCandidates = [];
    if (candidateIds && Array.isArray(candidateIds) && candidateIds.length > 0) {
      const placeholders = candidateIds.map(() => '?').join(',');
      targetCandidates = db.prepare(`SELECT * FROM candidates WHERE id IN (${placeholders})`).all(...candidateIds);
    } else {
      // Generate for all pending candidates
      targetCandidates = db.prepare("SELECT * FROM candidates WHERE status = 'pending'").all();
    }

    if (targetCandidates.length === 0) {
      return res.status(400).json({ error: 'No pending candidates found to generate certificates for' });
    }

    const results = [];
    const domainPrefixMap = {
      'Cybersecurity': 'CYB',
      'Web Development': 'WEB',
      'Artificial Intelligence': 'AI',
      'Data Science': 'DS'
    };

    for (const cand of targetCandidates) {
      try {
        // Generate unique certificate ID e.g. CERT-2026-CYB-000005
        const domainKey = Object.keys(domainPrefixMap).find(k => cand.internship_domain.includes(k)) || 'GEN';
        const prefix = domainPrefixMap[domainKey] || 'GEN';
        const randomSeq = Math.floor(100000 + Math.random() * 900000);
        const certId = `CERT-2026-${prefix}-${randomSeq}`;
        const certDbId = `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

        // Candidate sanitized filename
        const safeCandidateName = cand.name.replace(/[^a-zA-Z0-9]/g, '_');
        const pdfFilename = `${safeCandidateName}_Certificate.pdf`;

        // Generate PDF
        const pdfBuffer = await pdfService.generateCertificate({
          certificateId: certId,
          recipientName: cand.name,
          department: cand.department,
          yearOfStudy: cand.year_of_study,
          internshipDomain: cand.internship_domain,
          startDate: cand.start_date,
          endDate: cand.end_date,
          templateId
        });

        // Save PDF to Storage
        const storageResult = await storageService.saveCertificate(pdfFilename, pdfBuffer);

        // Save Certificate metadata in DB
        db.prepare(`
          INSERT INTO certificates (
            id, certificate_id, candidate_id, recipient_name, recipient_email, 
            department, year_of_study, internship_domain, start_date, end_date, 
            certificate_number, pdf_path, pdf_url, template_id, status, source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', 'excel_import')
        `).run(
          certDbId,
          certId,
          cand.id,
          cand.name,
          cand.email,
          cand.department,
          cand.year_of_study,
          cand.internship_domain,
          cand.start_date,
          cand.end_date,
          `${prefix}-2026-${randomSeq}`,
          storageResult.path,
          storageResult.url,
          templateId
        );

        // Update candidate status to 'certified'
        db.prepare("UPDATE candidates SET status = 'certified' WHERE id = ?").run(cand.id);

        // Send Email if enabled
        let emailResult = { success: false };
        if (sendEmail) {
          emailResult = await emailService.sendCertificateEmail({
            certificateId: certId,
            recipientEmail: cand.email,
            recipientName: cand.name,
            internshipDomain: cand.internship_domain,
            pdfBuffer,
            pdfFilename
          });
        }

        results.push({
          candidateId: cand.id,
          candidateName: cand.name,
          email: cand.email,
          certificateId: certId,
          pdfFilename,
          pdfUrl: storageResult.url,
          emailSent: emailResult.success,
          status: 'success'
        });
      } catch (genError) {
        console.error(`Certificate generation error for candidate ${cand.name}:`, genError);
        results.push({
          candidateId: cand.id,
          candidateName: cand.name,
          status: 'failed',
          error: genError.message
        });
      }
    }

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, action, details)
      VALUES (?, 'BULK_CERTIFICATE_GENERATION', ?)
    `).run(`aud_${Date.now()}`, `Generated ${results.filter(r => r.status === 'success').length} certificates`);

    res.json({
      success: true,
      totalProcessed: targetCandidates.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
      results
    });
  } catch (error) {
    console.error('Generate certificates error:', error);
    res.status(500).json({ error: 'Failed to process certificate generation batch' });
  }
});

// 10. GET /api/admin/certificates - List all generated certificates
router.get('/certificates', (req, res) => {
  try {
    const certs = db.prepare(`
      SELECT 
        cert.*,
        c.name as candidate_name,
        el.status as email_status,
        el.id as email_log_id,
        el.sent_at as email_sent_at
      FROM certificates cert
      LEFT JOIN candidates c ON cert.candidate_id = c.id
      LEFT JOIN email_logs el ON cert.id = el.certificate_id
      ORDER BY cert.generated_at DESC
    `).all();

    res.json({ certificates: certs });
  } catch (error) {
    console.error('Certificates fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch certificates' });
  }
});

// 11. GET /api/admin/certificates/download-all - Download all certificates as ZIP
router.get('/certificates/download-all', async (req, res) => {
  try {
    const certs = db.prepare("SELECT * FROM certificates WHERE status = 'valid'").all();
    if (certs.length === 0) {
      return res.status(404).json({ error: 'No certificates found to download' });
    }

    const zip = new JSZip();

    for (const cert of certs) {
      const safeName = cert.recipient_name.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `${safeName}_Certificate_${cert.certificate_id}.pdf`;

      // Check if file exists on disk, else re-generate on the fly
      let pdfBuffer = null;
      if (cert.pdf_path) {
        pdfBuffer = await storageService.getCertificate(path.basename(cert.pdf_path));
      }

      if (!pdfBuffer) {
        pdfBuffer = await pdfService.generateCertificate({
          certificateId: cert.certificate_id,
          recipientName: cert.recipient_name,
          department: cert.department,
          yearOfStudy: cert.year_of_study,
          internshipDomain: cert.internship_domain,
          startDate: cert.start_date,
          endDate: cert.end_date,
          templateId: cert.template_id || 'classic-gold'
        });
      }

      zip.file(filename, pdfBuffer);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="InternCert_Batch_Certificates.zip"');
    res.send(zipBuffer);
  } catch (error) {
    console.error('ZIP generation error:', error);
    res.status(500).json({ error: 'Failed to package certificates ZIP' });
  }
});

// 12. GET /api/admin/export/candidates - Export candidates as .xlsx or .csv
router.get('/export/candidates', (req, res) => {
  try {
    const { format = 'xlsx' } = req.query;
    const buffer = excelService.exportCandidates(format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="candidates_export.csv"');
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="candidates_export.xlsx"');
    }

    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export candidates' });
  }
});

// 13. GET /api/admin/email-logs - List email delivery logs
router.get('/email-logs', (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT 
        el.*,
        cert.certificate_id,
        cert.recipient_name,
        cert.internship_domain,
        cert.pdf_path
      FROM email_logs el
      JOIN certificates cert ON el.certificate_id = cert.id
      ORDER BY el.sent_at DESC
    `).all();

    res.json({ logs });
  } catch (error) {
    console.error('Email logs error:', error);
    res.status(500).json({ error: 'Failed to fetch email logs' });
  }
});

// 14. POST /api/admin/emails/:id/retry - Retry failed email delivery
router.post('/emails/:id/retry', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await emailService.retryEmail(id);
    res.json(result);
  } catch (error) {
    console.error('Retry email error:', error);
    res.status(500).json({ error: error.message || 'Failed to retry email delivery' });
  }
});

// 14b. GET /api/admin/emails/status - Check SMTP Configuration & Connection Status
router.get('/emails/status', async (req, res) => {
  try {
    const status = await emailService.testConnection();
    res.json({
      ...status,
      smtpUser: process.env.SMTP_USER || process.env.GMAIL_USER || null,
      smtpHost: process.env.SMTP_HOST || (process.env.SMTP_USER?.includes('gmail') ? 'smtp.gmail.com' : 'Simulator Mode')
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 14c. POST /api/admin/emails/test-send - Send a test email to verify live delivery
router.post('/emails/test-send', async (req, res) => {
  try {
    const { targetEmail } = req.body;
    if (!targetEmail) {
      return res.status(400).json({ error: 'Target email is required' });
    }

    const testPdf = await pdfService.generateCertificate({
      certificateId: 'CERT-TEST-EMAIL-001',
      recipientName: 'Test Recipient',
      department: 'System Verification',
      yearOfStudy: '2026',
      internshipDomain: 'Cybersecurity Virtual Internship',
      startDate: '01 June 2026',
      endDate: '30 June 2026',
      templateId: 'classic-gold'
    });

    const result = await emailService.sendCertificateEmail({
      certificateId: 'CERT-TEST-EMAIL-001',
      recipientEmail: targetEmail,
      recipientName: 'Test Recipient',
      internshipDomain: 'Email Dispatch Verification',
      pdfBuffer: testPdf,
      pdfFilename: 'Test_Certificate.pdf'
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 15. GET /api/admin/audit-logs - View audit trail
router.get('/audit-logs', (req, res) => {
  try {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// =========================================================================
// SUPERADMIN USER & CREDENTIALS MANAGEMENT ENDPOINTS
// =========================================================================

// 16. GET /api/admin/users - List all registered users with role and profile info
router.get('/users', (req, res) => {
  try {
    const users = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        u.created_at,
        s.id as student_id,
        s.department,
        s.year_of_study,
        (SELECT COUNT(*) FROM certificates c WHERE c.recipient_email = u.email) as certificate_count
      FROM users u
      LEFT JOIN students s ON u.id = s.user_id
      ORDER BY u.created_at DESC
    `).all();

    res.json({ users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ error: 'Failed to retrieve registered users' });
  }
});

// 17. POST /api/admin/users - Create new user with assigned role
router.post('/users', (req, res) => {
  try {
    const { name, email, password, role = 'student', department, yearOfStudy } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'A user with this email address already exists' });
    }

    import('crypto').then(({ default: crypto }) => {
      const passHash = crypto.createHash('sha256').update(password).digest('hex');
      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const studentId = `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const assignedRole = ['superadmin', 'admin', 'teacher', 'student'].includes(role) ? role : 'student';

      db.transaction(() => {
        db.prepare(`
          INSERT INTO users (id, name, email, password_hash, role)
          VALUES (?, ?, ?, ?, ?)
        `).run(userId, name, email.toLowerCase(), passHash, assignedRole);

        if (assignedRole === 'student') {
          db.prepare(`
            INSERT INTO students (id, user_id, name, email, department, year_of_study)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(studentId, userId, name, email.toLowerCase(), department || 'Computer Science and Engineering', yearOfStudy || '3rd Year');

          // Bi-directional sync: Also create Candidate entry if not exists
          const existingCand = db.prepare('SELECT id FROM candidates WHERE LOWER(email) = ?').get(email.toLowerCase());
          if (!existingCand) {
            const candId = `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            db.prepare(`
              INSERT INTO candidates (id, name, email, department, year_of_study, internship_domain, start_date, end_date, source, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual_entry', 'pending')
            `).run(candId, name, email.toLowerCase(), department || 'Computer Science and Engineering', yearOfStudy || '3rd Year', 'Cybersecurity Virtual Internship', '01 June 2026', '30 June 2026');
          }
        }

        db.prepare(`
          INSERT INTO audit_logs (id, action, details)
          VALUES (?, 'USER_CREATED', ?)
        `).run(`aud_${Date.now()}`, `Created user ${name} (${email}) with role: ${assignedRole}`);
      })();

      res.status(201).json({ success: true, message: `User ${name} created successfully as ${assignedRole}` });
    }).catch(err => {
      res.status(500).json({ error: 'Crypto error: ' + err.message });
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 18. PUT /api/admin/users/:id - Update user login details, role and credentials
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password, department, yearOfStudy } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User record not found' });
    }

    const crypto = await import('crypto');
    let passHash = user.password_hash;
    if (password && password.trim() !== '') {
      passHash = crypto.default.createHash('sha256').update(password).digest('hex');
    }

    const assignedRole = ['superadmin', 'admin', 'teacher', 'student'].includes(role) ? role : user.role;
    const newEmail = email ? email.toLowerCase() : user.email;
    const newName = name || user.name;

    db.transaction(() => {
      db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, role = ?, password_hash = ?
        WHERE id = ?
      `).run(newName, newEmail, assignedRole, passHash, id);

      // If student profile exists, update it or create one if role changed to student
      const studentProfile = db.prepare('SELECT id FROM students WHERE user_id = ?').get(id);
      if (studentProfile) {
        db.prepare(`
          UPDATE students 
          SET name = ?, email = ?, department = COALESCE(?, department), year_of_study = COALESCE(?, year_of_study)
          WHERE user_id = ?
        `).run(newName, newEmail, department, yearOfStudy, id);
      } else if (assignedRole === 'student') {
        const studentId = `std_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        db.prepare(`
          INSERT INTO students (id, user_id, name, email, department, year_of_study)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(studentId, id, newName, newEmail, department || 'Computer Science and Engineering', yearOfStudy || '3rd Year');
      }

      // Sync candidate record if exists
      db.prepare(`
        UPDATE candidates 
        SET name = ?, email = ?, department = COALESCE(?, department), year_of_study = COALESCE(?, year_of_study)
        WHERE LOWER(email) = ?
      `).run(newName, newEmail, department, yearOfStudy, user.email.toLowerCase());

      db.prepare(`
        INSERT INTO audit_logs (id, action, details)
        VALUES (?, 'USER_UPDATED', ?)
      `).run(`aud_${Date.now()}`, `SuperAdmin updated account ${user.email} (Role: ${assignedRole})`);
    })();

    res.json({ success: true, message: `Account details for ${newName} updated successfully` });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user details: ' + error.message });
  }
});

// 19. DELETE /api/admin/users/:id - Delete a user
router.delete('/users/:id', (req, res) => {
  try {
    const { id } = req.params;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'superadmin' && user.email === 'superadmin@a.com') {
      return res.status(403).json({ error: 'Cannot delete primary root SuperAdmin account' });
    }

    db.transaction(() => {
      db.prepare('DELETE FROM students WHERE user_id = ?').run(id);
      db.prepare('DELETE FROM users WHERE id = ?').run(id);
      db.prepare("INSERT INTO audit_logs (id, action, details) VALUES (?, 'USER_DELETED', ?)")
        .run(`aud_${Date.now()}`, `Deleted user ${user.name} (${user.email})`);
    })();

    res.json({ success: true, message: 'User account removed from database' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// =========================================================================
// SUPERADMIN DIRECT DELETION & DATABASE CLEANUP ENDPOINTS
// =========================================================================

// 20. DELETE /api/admin/certificates/:id - Delete an issued certificate & its storage PDF file
router.delete('/certificates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cert = db.prepare('SELECT * FROM certificates WHERE id = ? OR certificate_id = ?').get(id, id);
    if (!cert) {
      return res.status(404).json({ error: 'Certificate record not found in database' });
    }

    // Delete PDF files from disk storage
    if (cert.pdf_path) {
      await storageService.deleteCertificate(path.basename(cert.pdf_path));
    }
    const safeName = cert.recipient_name.replace(/[^a-zA-Z0-9]/g, '_');
    await storageService.deleteCertificate(`${safeName}_Certificate.pdf`);
    await storageService.deleteCertificate(`${safeName}_Certificate_${cert.certificate_id}.pdf`);

    db.transaction(() => {
      // 1. Delete email logs
      db.prepare('DELETE FROM email_logs WHERE certificate_id = ?').run(cert.id);

      // 2. Delete certificate row
      db.prepare('DELETE FROM certificates WHERE id = ?').run(cert.id);

      // 3. Revert candidate status back to 'pending'
      if (cert.candidate_id) {
        db.prepare("UPDATE candidates SET status = 'pending' WHERE id = ?").run(cert.candidate_id);
      }
      db.prepare("UPDATE candidates SET status = 'pending' WHERE LOWER(email) = ?").run(cert.recipient_email.toLowerCase());

      // 4. Revert student enrollment status if virtual course
      if (cert.student_id && cert.internship_id) {
        db.prepare("UPDATE enrollments SET status = 'in_progress', completion_percentage = 80 WHERE student_id = ? AND internship_id = ?")
          .run(cert.student_id, cert.internship_id);
        db.prepare("DELETE FROM quiz_results WHERE student_id = ? AND internship_id = ?")
          .run(cert.student_id, cert.internship_id);
      }

      // 5. Audit log
      db.prepare("INSERT INTO audit_logs (id, action, details) VALUES (?, 'CERTIFICATE_DELETED', ?)")
        .run(`aud_${Date.now()}`, `SuperAdmin deleted certificate ${cert.certificate_id} (${cert.recipient_name}) and cleared physical file`);
    })();

    res.json({ success: true, message: `Certificate ${cert.certificate_id} and storage PDF files deleted successfully.` });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({ error: 'Failed to delete certificate: ' + error.message });
  }
});

// 21. POST /api/admin/database/clear-certificates - SuperAdmin: Delete all issued certificates and PDF files
router.post('/database/clear-certificates', async (req, res) => {
  try {
    const certCount = db.prepare('SELECT COUNT(*) as count FROM certificates').get().count;

    // Wipe physical PDF files from storage
    await storageService.clearAllStorage();

    db.transaction(() => {
      db.prepare('DELETE FROM email_logs').run();
      db.prepare('DELETE FROM certificates').run();
      db.prepare("UPDATE candidates SET status = 'pending'").run();
      db.prepare("UPDATE enrollments SET status = 'in_progress', completion_percentage = 0").run();
      db.prepare('DELETE FROM quiz_results').run();
      db.prepare('DELETE FROM module_progress').run();

      db.prepare("INSERT INTO audit_logs (id, action, details) VALUES (?, 'PURGE_ALL_CERTIFICATES', ?)")
        .run(`aud_${Date.now()}`, `SuperAdmin purged ${certCount} certificates and wiped physical certificate storage`);
    })();

    res.json({
      success: true,
      deletedCount: certCount,
      message: `Successfully purged ${certCount} certificates from database, deleted all PDF files from storage, and reset candidate records to pending.`
    });
  } catch (error) {
    console.error('Clear certificates error:', error);
    res.status(500).json({ error: 'Failed to clear certificates: ' + error.message });
  }
});

// 22. POST /api/admin/database/reset - SuperAdmin: Clean factory reset of database & files
router.post('/database/reset', async (req, res) => {
  try {
    const { initDatabase } = await import('../database/init-db.js');
    await storageService.clearAllStorage();
    initDatabase(true);

    db.prepare("INSERT INTO audit_logs (id, action, details) VALUES (?, 'DATABASE_FACTORY_RESET', ?)")
      .run(`aud_${Date.now()}`, 'SuperAdmin triggered complete database and storage factory reset');

    res.json({
      success: true,
      message: 'Database and certificate storage have been reset to clean initial state.'
    });
  } catch (error) {
    console.error('Reset database error:', error);
    res.status(500).json({ error: 'Failed to reset database: ' + error.message });
  }
});

export default router;
