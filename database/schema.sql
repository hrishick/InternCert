-- Cloudflare D1 Database Schema for InternCert
-- Automated Internship & Certificate Management Platform

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('superadmin', 'admin', 'teacher', 'student')) NOT NULL DEFAULT 'student',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Students Profile Table
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    year_of_study TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Internships Table
CREATE TABLE IF NOT EXISTS internships (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    description TEXT NOT NULL,
    duration TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT CHECK(status IN ('active', 'archived', 'draft')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Learning Modules Table
CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    internship_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT NOT NULL,
    video_url TEXT,
    module_order INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(internship_id) REFERENCES internships(id) ON DELETE CASCADE
);

-- 5. Student Enrollments Table
CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    internship_id TEXT NOT NULL,
    enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completion_percentage INTEGER DEFAULT 0,
    status TEXT CHECK(status IN ('in_progress', 'completed', 'dropped')) DEFAULT 'in_progress',
    completed_at DATETIME,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    UNIQUE(student_id, internship_id)
);

-- 6. Module Progress Tracking
CREATE TABLE IF NOT EXISTS module_progress (
    id TEXT PRIMARY KEY,
    enrollment_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    completed INTEGER DEFAULT 0, -- 1 for completed
    completed_at DATETIME,
    FOREIGN KEY(enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE CASCADE,
    UNIQUE(enrollment_id, module_id)
);

-- 7. Quiz Questions Table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id TEXT PRIMARY KEY,
    internship_id TEXT,
    module_id TEXT,
    question TEXT NOT NULL,
    options TEXT NOT NULL, -- JSON array of strings
    correct_answer INTEGER NOT NULL, -- Index 0-3
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(internship_id) REFERENCES internships(id) ON DELETE CASCADE,
    FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE CASCADE
);

-- 8. Quiz Results Table
CREATE TABLE IF NOT EXISTS quiz_results (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL,
    internship_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL DEFAULT 10,
    passed INTEGER NOT NULL, -- 1 for passed (>=70%), 0 for failed
    answers_json TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY(internship_id) REFERENCES internships(id) ON DELETE CASCADE
);

-- 9. Candidates Table (for Admin Excel Bulk Import & Manual Entry)
CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    department TEXT NOT NULL,
    year_of_study TEXT NOT NULL,
    internship_domain TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    source TEXT CHECK(source IN ('excel_import', 'manual_entry', 'virtual_course')) DEFAULT 'excel_import',
    status TEXT CHECK(status IN ('pending', 'certified', 'failed')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 10. Certificates Table
CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    certificate_id TEXT UNIQUE NOT NULL, -- e.g. CERT-2026-CYB-000001
    candidate_id TEXT,
    student_id TEXT,
    internship_id TEXT,
    recipient_name TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    department TEXT NOT NULL,
    year_of_study TEXT,
    internship_domain TEXT NOT NULL,
    duration TEXT,
    start_date TEXT,
    end_date TEXT,
    certificate_number TEXT,
    pdf_path TEXT,
    pdf_url TEXT,
    template_id TEXT DEFAULT 'classic-gold',
    qr_code_data TEXT,
    generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT CHECK(status IN ('valid', 'revoked')) DEFAULT 'valid',
    source TEXT DEFAULT 'excel_import',
    FOREIGN KEY(candidate_id) REFERENCES candidates(id) ON DELETE SET NULL,
    FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE SET NULL,
    FOREIGN KEY(internship_id) REFERENCES internships(id) ON DELETE SET NULL
);

-- 11. Email Logs Table
CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    certificate_id TEXT NOT NULL,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    status TEXT CHECK(status IN ('sent', 'failed', 'pending')) DEFAULT 'pending',
    subject TEXT,
    error_message TEXT,
    sent_at DATETIME,
    retry_count INTEGER DEFAULT 0,
    FOREIGN KEY(certificate_id) REFERENCES certificates(id) ON DELETE CASCADE
);

-- 12. Certificate Templates Table
CREATE TABLE IF NOT EXISTS certificate_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    template_path TEXT,
    primary_color TEXT DEFAULT '#1e3a8a',
    accent_color TEXT DEFAULT '#d97706',
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT,
    action TEXT NOT NULL,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON certificates(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_candidate ON certificates(candidate_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_cert ON email_logs(certificate_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
