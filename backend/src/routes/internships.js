import express from 'express';
import db from '../database/db.js';
import pdfService from '../services/pdfService.js';
import storageService from '../services/storageService.js';
import emailService from '../services/emailService.js';

const router = express.Router();

// 1. GET /api/internships - List all available virtual internships
router.get('/internships', (req, res) => {
  try {
    const internships = db.prepare(`
      SELECT 
        i.*,
        (SELECT COUNT(*) FROM modules m WHERE m.internship_id = i.id) as module_count,
        (SELECT COUNT(*) FROM enrollments e WHERE e.internship_id = i.id) as enrollment_count
      FROM internships i
      WHERE i.status = 'active'
      ORDER BY i.created_at ASC
    `).all();

    res.json({ internships });
  } catch (error) {
    console.error('Internships list error:', error);
    res.status(500).json({ error: 'Failed to retrieve internships' });
  }
});

// 2. GET /api/internships/:id - Get details of single internship with modules
router.get('/internships/:id', (req, res) => {
  try {
    const { id } = req.params;
    const internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(id);

    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    const modules = db.prepare(`
      SELECT id, title, description, content, video_url, module_order 
      FROM modules 
      WHERE internship_id = ? 
      ORDER BY module_order ASC
    `).all(id);

    res.json({ internship: { ...internship, modules } });
  } catch (error) {
    console.error('Internship details error:', error);
    res.status(500).json({ error: 'Failed to fetch internship details' });
  }
});

// 3. POST /api/internships/:id/enroll - Student enrolls in an internship
router.post('/internships/:id/enroll', (req, res) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID is required to enroll' });
    }

    const internship = db.prepare('SELECT id FROM internships WHERE id = ?').get(id);
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    // Check existing enrollment
    const existing = db.prepare('SELECT * FROM enrollments WHERE student_id = ? AND internship_id = ?').get(studentId, id);
    if (existing) {
      return res.json({ success: true, enrollment: existing, message: 'Already enrolled' });
    }

    const enrollmentId = `enr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO enrollments (id, student_id, internship_id, completion_percentage, status)
      VALUES (?, ?, ?, 0, 'in_progress')
    `).run(enrollmentId, studentId, id);

    const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(enrollmentId);
    res.status(201).json({ success: true, enrollment, message: 'Successfully enrolled' });
  } catch (error) {
    console.error('Enroll error:', error);
    res.status(500).json({ error: 'Failed to enroll in internship' });
  }
});

// 4. GET /api/student/dashboard - Retrieve student profile, active courses, progress, & certificate
router.get('/student/dashboard', (req, res) => {
  try {
    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ error: 'Student ID query parameter is required' });
    }

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    // Get enrollments with module completion details
    const enrollments = db.prepare(`
      SELECT 
        e.*,
        i.title as internship_title,
        i.domain as internship_domain,
        i.description as internship_description,
        i.duration as internship_duration,
        i.start_date as start_date,
        i.end_date as end_date
      FROM enrollments e
      JOIN internships i ON e.internship_id = i.id
      WHERE e.student_id = ?
    `).all(studentId);

    // Populate module progress & certificates for each enrollment
    const enrichedEnrollments = enrollments.map(enr => {
      const allModules = db.prepare('SELECT id, title, description, module_order FROM modules WHERE internship_id = ? ORDER BY module_order ASC').all(enr.internship_id);
      const completedModules = db.prepare(`
        SELECT module_id FROM module_progress WHERE enrollment_id = ? AND completed = 1
      `).all(enr.id).map(r => r.module_id);

      const quizResult = db.prepare(`
        SELECT * FROM quiz_results WHERE student_id = ? AND internship_id = ? ORDER BY completed_at DESC LIMIT 1
      `).get(studentId, enr.internship_id);

      const certificate = db.prepare(`
        SELECT * FROM certificates WHERE student_id = ? AND internship_id = ? AND status = 'valid'
      `).get(studentId, enr.internship_id);

      return {
        ...enr,
        modules: allModules.map(m => ({
          ...m,
          isCompleted: completedModules.includes(m.id)
        })),
        quizResult: quizResult || null,
        certificate: certificate || null
      };
    });

    res.json({
      student,
      enrollments: enrichedEnrollments
    });
  } catch (error) {
    console.error('Student dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch student dashboard' });
  }
});

// 5. POST /api/modules/:id/complete - Mark module completed & update progress percentage
router.post('/modules/:id/complete', (req, res) => {
  try {
    const { id: moduleId } = req.params;
    const { studentId, internshipId } = req.body;

    if (!studentId || !internshipId) {
      return res.status(400).json({ error: 'Student ID and Internship ID are required' });
    }

    let enrollment = db.prepare('SELECT id FROM enrollments WHERE student_id = ? AND internship_id = ?').get(studentId, internshipId);
    if (!enrollment) {
      const enrId = `enr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.prepare("INSERT INTO enrollments (id, student_id, internship_id, completion_percentage, status) VALUES (?, ?, ?, 0, 'in_progress')")
        .run(enrId, studentId, internshipId);
      enrollment = { id: enrId };
    }

    // Upsert module progress
    const progId = `prog_${enrollment.id}_${moduleId}`;
    db.prepare(`
      INSERT OR REPLACE INTO module_progress (id, enrollment_id, module_id, completed, completed_at)
      VALUES (?, ?, ?, 1, datetime('now'))
    `).run(progId, enrollment.id, moduleId);

    // Calculate new completion percentage
    const totalModules = db.prepare('SELECT COUNT(*) as count FROM modules WHERE internship_id = ?').get(internshipId).count;
    const completedCount = db.prepare(`
      SELECT COUNT(*) as count FROM module_progress WHERE enrollment_id = ? AND completed = 1
    `).get(enrollment.id).count;

    const quizPassed = db.prepare('SELECT passed FROM quiz_results WHERE student_id = ? AND internship_id = ? AND passed = 1').get(studentId, internshipId);

    // Modules count for 80% weight, final quiz counts for 20%
    const modulePercent = totalModules > 0 ? Math.round((completedCount / totalModules) * 80) : 80;
    const finalPercent = modulePercent + (quizPassed ? 20 : 0);

    db.prepare('UPDATE enrollments SET completion_percentage = ? WHERE id = ?').run(finalPercent, enrollment.id);

    res.json({
      success: true,
      moduleId,
      completedCount,
      totalModules,
      completionPercentage: finalPercent
    });
  } catch (error) {
    console.error('Module complete error:', error);
    res.status(500).json({ error: 'Failed to record module progress' });
  }
});

// 6. GET /api/internships/:id/quiz - Get Assessment questions
router.get('/internships/:id/quiz', (req, res) => {
  try {
    const { id } = req.params;
    const questions = db.prepare('SELECT id, module_id, question, options FROM quiz_questions WHERE internship_id = ?').all(id);

    // Parse options from JSON string
    const formatted = questions.map(q => ({
      ...q,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
    }));

    res.json({
      internshipId: id,
      totalQuestions: formatted.length,
      passingScorePercent: 70,
      questions: formatted
    });
  } catch (error) {
    console.error('Quiz fetch error:', error);
    res.status(500).json({ error: 'Failed to retrieve quiz questions' });
  }
});

// 7. POST /api/quizzes/:id/submit - Submit Final Assessment & Automatic Certificate Generation!
router.post('/quizzes/:id/submit', async (req, res) => {
  try {
    const { id: internshipId } = req.params;
    const { studentId, answers } = req.body; // answers is an object/array: { [qId]: selectedIndex }

    if (!studentId || !answers) {
      return res.status(400).json({ error: 'Student ID and answers are required' });
    }

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const internship = db.prepare('SELECT * FROM internships WHERE id = ?').get(internshipId);
    if (!internship) {
      return res.status(404).json({ error: 'Internship not found' });
    }

    // Grade assessment
    const questions = db.prepare('SELECT id, correct_answer FROM quiz_questions WHERE internship_id = ?').all(internshipId);
    let correctCount = 0;

    for (const q of questions) {
      const studentAns = answers[q.id];
      if (studentAns !== undefined && parseInt(studentAns) === q.correct_answer) {
        correctCount++;
      }
    }

    const total = questions.length || 10;
    const scorePercent = Math.round((correctCount / total) * 100);
    const passed = scorePercent >= 70;

    // Record quiz result
    const quizResultId = `qres_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.prepare(`
      INSERT INTO quiz_results (id, student_id, internship_id, score, total_questions, passed, answers_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(quizResultId, studentId, internshipId, scorePercent, total, passed ? 1 : 0, JSON.stringify(answers));

    let generatedCertificate = null;

    // IF PASSED: Automatically complete enrollment & GENERATE CERTIFICATE!
    if (passed) {
      // 1. Update enrollment to completed (100%)
      db.prepare(`
        UPDATE enrollments 
        SET completion_percentage = 100, status = 'completed', completed_at = datetime('now')
        WHERE student_id = ? AND internship_id = ?
      `).run(studentId, internshipId);

      // 2. Find or Create linked candidate record
      let cand = db.prepare('SELECT id FROM candidates WHERE LOWER(email) = ?').get(student.email.toLowerCase());
      let candId = cand ? cand.id : `cand_std_${student.id}`;

      if (cand) {
        db.prepare("UPDATE candidates SET status = 'certified', internship_domain = ? WHERE id = ?")
          .run(internship.title, cand.id);
      } else {
        db.prepare(`
          INSERT INTO candidates (id, name, email, department, year_of_study, internship_domain, start_date, end_date, source, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'virtual_course', 'certified')
        `).run(candId, student.name, student.email.toLowerCase(), student.department, student.year_of_study, internship.title, internship.start_date, internship.end_date);
      }

      // 3. Check if certificate already exists
      let existingCert = db.prepare('SELECT * FROM certificates WHERE student_id = ? AND internship_id = ?').get(studentId, internshipId);

      const prefix = internship.domain.includes('Cyber') ? 'CYB' : (internship.domain.includes('Web') ? 'WEB' : 'AI');
      const randomSeq = Math.floor(100000 + Math.random() * 900000);
      const certId = existingCert ? existingCert.certificate_id : `CERT-2026-${prefix}-${randomSeq}`;
      const certDbId = existingCert ? existingCert.id : `cert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const safeStudentName = student.name.replace(/[^a-zA-Z0-9]/g, '_');
      const pdfFilename = `${safeStudentName}_Certificate.pdf`;

      // Generate high-resolution PDF
      const pdfBuffer = await pdfService.generateCertificate({
        certificateId: certId,
        recipientName: student.name,
        department: student.department,
        yearOfStudy: student.year_of_study,
        internshipDomain: internship.title,
        startDate: internship.start_date,
        endDate: internship.end_date,
        templateId: 'classic-gold'
      });

      // Save PDF to Cloudflare R2 / Storage
      const storageResult = await storageService.saveCertificate(pdfFilename, pdfBuffer);

      if (!existingCert) {
        // 4. Record Certificate in Database with candidate_id linked
        db.prepare(`
          INSERT INTO certificates (
            id, certificate_id, candidate_id, student_id, internship_id, recipient_name, recipient_email,
            department, year_of_study, internship_domain, duration, start_date, end_date,
            certificate_number, pdf_path, pdf_url, template_id, status, source
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'classic-gold', 'valid', 'virtual_course')
        `).run(
          certDbId,
          certId,
          candId,
          student.id,
          internship.id,
          student.name,
          student.email.toLowerCase(),
          student.department,
          student.year_of_study,
          internship.title,
          internship.duration,
          internship.start_date,
          internship.end_date,
          `${prefix}-2026-${randomSeq}`,
          storageResult.path,
          storageResult.url
        );

        // 5. Dispatch Email via Gmail API / Simulator
        await emailService.sendCertificateEmail({
          certificateId: certId,
          recipientEmail: student.email,
          recipientName: student.name,
          internshipDomain: internship.title,
          pdfBuffer,
          pdfFilename
        });

        // 6. Log in audit trail
        db.prepare("INSERT INTO audit_logs (id, action, details) VALUES (?, 'AUTO_CERT_ISSUED', ?)")
          .run(`aud_${Date.now()}`, `Automatically issued ${certId} to student ${student.name} upon passing assessment (${scorePercent}%)`);

        existingCert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(certDbId);
      } else {
        // Update existing cert to ensure candidate_id and pdf_path are current
        db.prepare(`
          UPDATE certificates 
          SET candidate_id = ?, pdf_path = ?, pdf_url = ?, status = 'valid'
          WHERE id = ?
        `).run(candId, storageResult.path, storageResult.url, existingCert.id);

        existingCert = db.prepare('SELECT * FROM certificates WHERE id = ?').get(existingCert.id);
      }

      generatedCertificate = existingCert;
    }

    res.json({
      success: true,
      score: scorePercent,
      correctCount,
      totalQuestions: total,
      passed,
      certificate: generatedCertificate,
      message: passed 
        ? '🎉 Congratulations! You have successfully passed the assessment and your verified certificate has been issued!'
        : `Assessment score: ${scorePercent}%. You need at least 70% to receive certification. You may retry the assessment.`
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    res.status(500).json({ error: 'Failed to process assessment submission' });
  }
});

export default router;
