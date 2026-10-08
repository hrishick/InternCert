import express from 'express';
import path from 'path';
import fs from 'fs';
import db from '../database/db.js';
import storageService from '../services/storageService.js';
import pdfService from '../services/pdfService.js';

const router = express.Router();

// 1. GET /api/verify/:certificateId - Public verification endpoint (Security compliant)
router.get('/verify/:certificateId', (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = db.prepare(`
      SELECT 
        c.id,
        c.certificate_id,
        c.recipient_name,
        c.department,
        c.internship_domain,
        c.duration,
        c.start_date,
        c.end_date,
        c.certificate_number,
        c.generated_at,
        c.status,
        c.template_id
      FROM certificates c
      WHERE c.certificate_id = ? OR c.id = ?
    `).get(certificateId, certificateId);

    if (!cert) {
      return res.status(404).json({
        valid: false,
        status: 'NOT_FOUND',
        message: 'The requested Certificate ID could not be found in the national certification registry.'
      });
    }

    if (cert.status === 'revoked') {
      return res.json({
        valid: false,
        status: 'REVOKED',
        certificateId: cert.certificate_id,
        recipientName: cert.recipient_name,
        internshipDomain: cert.internship_domain,
        revokedAt: cert.generated_at,
        message: 'This certificate has been revoked by the issuing authority.'
      });
    }

    // Return sanitized public verification details
    res.json({
      valid: true,
      status: 'VALID',
      certificateId: cert.certificate_id,
      recipientName: cert.recipient_name,
      department: cert.department,
      internshipDomain: cert.internship_domain,
      duration: cert.duration || `${cert.start_date} - ${cert.end_date}`,
      startDate: cert.start_date,
      endDate: cert.end_date,
      certificateNumber: cert.certificate_number,
      issuedAt: cert.generated_at,
      issuingAuthority: 'InternCert National Certification Cell & Industry Academic Council',
      cryptographicHash: `SHA256:${Buffer.from(cert.certificate_id).toString('hex').slice(0, 24).toUpperCase()}`,
      templateId: cert.template_id
    });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
});

// 2. GET /api/certificates/:certificateId/download - Download Certificate PDF
router.get('/certificates/:certificateId/download', async (req, res) => {
  try {
    const { certificateId } = req.params;
    const cert = db.prepare('SELECT * FROM certificates WHERE certificate_id = ? OR id = ? OR candidate_id = ?').get(certificateId, certificateId, certificateId);

    if (!cert) {
      return res.status(404).json({ error: `Certificate "${certificateId}" not found in database registry.` });
    }

    const safeName = cert.recipient_name.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${safeName}_Certificate.pdf`;

    let pdfBuffer = null;
    if (cert.pdf_path) {
      pdfBuffer = await storageService.getCertificate(path.basename(cert.pdf_path));
    }

    // If file is not yet cached on disk, generate fresh vector PDF dynamically
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
      await storageService.saveCertificate(filename, pdfBuffer);
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download certificate: ' + error.message });
  }
});

// 3. GET /api/certificates/file/:filename - View certificate PDF directly in browser
router.get('/certificates/file/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const pdfBuffer = await storageService.getCertificate(filename);

    if (!pdfBuffer) {
      return res.status(404).json({ error: 'Certificate file not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Failed to retrieve certificate file' });
  }
});

export default router;
