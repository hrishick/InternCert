-- 1. Users (default password: 'password123')
INSERT OR REPLACE INTO users (id, name, email, password_hash, role, created_at) VALUES
('usr_superadmin', 'Super Administrator', 'superadmin@a.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'superadmin', '2026-09-01 10:00:00'),
('usr_teacher', 'Prof. Marcus Sterling', 'teacher@a.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'teacher', '2026-09-05 11:00:00'),
('usr_student_01', 'Alex Rivera', 'student@a.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'student', '2026-09-10 11:30:00');

-- 2. Students
INSERT OR REPLACE INTO students (id, user_id, name, email, department, year_of_study, created_at) VALUES
('std_01', 'usr_student_01', 'Alex Rivera', 'student@a.com', 'Computer Science and Engineering', '3rd Year', '2026-09-10 11:30:00');

-- 3. Internships
INSERT OR REPLACE INTO internships (id, title, domain, description, duration, start_date, end_date, status, created_at) VALUES
('intern_cyb_01', 'Cybersecurity Virtual Internship', 'Cybersecurity', 'Comprehensive hands-on training covering network security, threat modeling, web vulnerability assessment, and security incident response protocols.', '4 Weeks', '01 June 2026', '30 June 2026', 'active', '2026-08-01 09:00:00'),
('intern_web_02', 'Full-Stack Web Engineering Virtual Internship', 'Web Development', 'Master modern web development architecture with React, Node.js, RESTful microservices, and Cloud Native deployments.', '6 Weeks', '15 July 2026', '30 August 2026', 'active', '2026-08-05 09:00:00'),
('intern_ai_03', 'Applied AI & Machine Learning Internship', 'Artificial Intelligence', 'Practical machine learning pipeline development, data engineering, model evaluation, and LLM orchestration.', '4 Weeks', '01 August 2026', '31 August 2026', 'active', '2026-08-10 09:00:00');

-- 4. Modules for Cybersecurity
INSERT OR REPLACE INTO modules (id, internship_id, title, description, content, video_url, module_order, created_at) VALUES
('mod_cyb_01', 'intern_cyb_01', 'Module 1: Network Security Fundamentals', 'Understand OSI model security, TCP/IP vulnerabilities, packet analysis, firewalls, and cryptographic protocols (TLS/SSL).', '### Introduction to Network Defense\n\nNetwork security involves protecting the usability and integrity of network infrastructure and data. In this module, you will learn:\n\n1. **Network Layer Attacks**: ARP spoofing, IP fragmentation attacks, and SYN flood denial of service.\n2. **Defensive Architectures**: Stateful packet inspection firewalls, DMZ topologies, and Intrusion Detection Systems (Snort/Suricata).\n3. **Cryptographic Foundations**: Public Key Infrastructure (PKI), TLS 1.3 handshakes, and Perfect Forward Secrecy.\n\n```bash\n# Practical Wireshark Filter Example\ntcp.flags.syn == 1 and tcp.flags.ack == 0\n```\n\nEnsure you understand how to analyze packet captures before proceeding to the module review quiz.', 'https://www.youtube-nocookie.com/embed/bPVaOlJ6ln0', 1, '2026-08-01 10:00:00'),

('mod_cyb_02', 'intern_cyb_01', 'Module 2: Linux Security & Privilege Management', 'Deep dive into Linux kernel security mechanisms, file permissions, PAM authentication, SELinux policies, and hardening server baselines.', '### Linux Hardening & Auditing\n\nLinux is the backbone of production cloud servers. Mastering kernel privileges and system logs is vital for cybersecurity analysts.\n\nKey Concepts:\n- **POSIX Permissions & ACLs**: `chmod`, `chown`, SUID/SGID bit risks, and sticky bits.\n- **Audit Framework (auditd)**: Monitoring file access, syscall tracing, and user escalation.\n- **SSH Hardening**: Ed25519 keys, disabling root passwords, fail2ban integration.\n\n```bash\n# Audit SUID binaries for privilege escalation\nfind / -perm -4000 -type f -exec ls -la {} \\; 2>/dev/null\n```', 'https://www.youtube-nocookie.com/embed/lZAoFs75_cs', 2, '2026-08-01 10:30:00'),

('mod_cyb_03', 'intern_cyb_01', 'Module 3: Web Application Security & OWASP Top 10', 'Analyze SQL Injection, Cross-Site Scripting (XSS), CSRF, SSRF, Broken Access Control, and modern API security practices.', '### OWASP Top 10 Vulnerabilities\n\nWeb applications are the most targeted attack vector. In this module we deconstruct the highest severity web vulnerabilities:\n\n1. **Injection Flaws (SQLi & Command Injection)**: Prevention via Parameterized Queries and ORMs.\n2. **Broken Object Level Authorization (BOLA/IDOR)**: Enforcing strict tenant and ownership checks on every API endpoint.\n3. **Cross-Site Scripting (Stored & Reflected XSS)**: Content Security Policy (CSP) headers, input sanitization, and output encoding.\n4. **Server-Side Request Forgery (SSRF)**: Whitelisting outbound connections and blocking cloud metadata service access (`169.254.169.254`).', 'https://www.youtube-nocookie.com/embed/_jKylhJtPmI', 3, '2026-08-01 11:00:00'),

('mod_cyb_04', 'intern_cyb_01', 'Module 4: Security Incident Response & Forensics', 'Learn NIST SP 800-61 incident handling lifecycle, memory forensics, log correlation with SIEM, and containment strategies.', '### NIST Incident Handling Lifecycle\n\nWhen a breach occurs, structured incident response minimizes impact and preserves evidentiary integrity:\n\n1. **Preparation**: Tooling, communication channels, playbook definitions.\n2. **Detection & Analysis**: Log correlation, SIEM alert triage, memory dump capture (`volatility`).\n3. **Containment & Eradication**: Network isolation, token revocation, vulnerability patching.\n4. **Post-Incident Activity**: Lessons learned root cause analysis documentation.\n\nComplete this module to unlock the Comprehensive Final Assessment.', 'https://www.youtube-nocookie.com/embed/inWWhr5tnEA', 4, '2026-08-01 11:30:00');

-- 5. Final Assessment Questions for Cybersecurity (10 questions, 70% passing)
INSERT OR REPLACE INTO quiz_questions (id, internship_id, module_id, question, options, correct_answer) VALUES
('q_01', 'intern_cyb_01', 'mod_cyb_01', 'Which protocol provides secure encrypted transport for web traffic using public key cryptography and symmetric session keys?', '["HTTP", "HTTPS / TLS", "Telnet", "FTP"]', 1),
('q_02', 'intern_cyb_01', 'mod_cyb_01', 'What type of attack involves an attacker placing themselves between a client and a gateway by poisoning ARP caches?', '["SQL Injection", "Man-in-the-Middle (ARP Spoofing)", "Buffer Overflow", "Cross-Site Scripting"]', 1),
('q_03', 'intern_cyb_01', 'mod_cyb_02', 'In Linux file permissions, what security risk is introduced when an executable file has the SUID bit set and is owned by root?', '["The file cannot be read by anyone", "Any user running the file executes it with root privileges", "The file is automatically deleted upon execution", "The kernel disables networking"]', 1),
('q_04', 'intern_cyb_01', 'mod_cyb_02', 'Which authentication framework in Linux provides centralized modular control over password policies and login authentication?', '["PAM (Pluggable Authentication Modules)", "systemd", "cron", "rsyslog"]', 0),
('q_05', 'intern_cyb_01', 'mod_cyb_03', 'What is the primary and most effective defense against SQL Injection vulnerabilities in modern web applications?', '["Base64 encoding all inputs", "Parameterized queries / Prepared Statements", "Client-side regex validation", "Using HTTP POST instead of GET"]', 1),
('q_06', 'intern_cyb_01', 'mod_cyb_03', 'Which HTTP response header helps mitigate Cross-Site Scripting (XSS) by restricting the sources from which scripts can load?', '["Content-Type", "Access-Control-Allow-Origin", "Content-Security-Policy", "X-Powered-By"]', 2),
('q_07', 'intern_cyb_01', 'mod_cyb_03', 'What IP address is commonly targeted in cloud environments during Server-Side Request Forgery (SSRF) attacks to steal instance metadata credentials?', '["127.0.0.1", "192.168.1.1", "169.254.169.254", "10.0.0.1"]', 2),
('q_08', 'intern_cyb_01', 'mod_cyb_04', 'According to NIST SP 800-61, what is the first operational phase when an active cyber incident is identified?', '["Containment, Eradication, and Recovery", "Preparation", "Detection & Analysis", "Post-Incident Review"]', 2),
('q_09', 'intern_cyb_01', 'mod_cyb_04', 'Which tool is widely used by incident responders for volatile memory (RAM) artifact analysis and forensic investigation?', '["Wireshark", "Volatility Framework", "Nmap", "John the Ripper"]', 1),
('q_10', 'intern_cyb_01', 'mod_cyb_04', 'What is the recommended immediate containment strategy for a workstation exhibiting active ransomware lateral movement?', '["Format all hard drives immediately", "Isolate the host from the network while preserving system memory state", "Reboot the machine multiple times", "Send an email alert to the entire organization"]', 1);

-- 6. Candidates (Realistic initial records for Excel & Admin workflow)
INSERT OR REPLACE INTO candidates (id, name, email, department, year_of_study, internship_domain, start_date, end_date, source, status, created_at) VALUES
('cand_student_01', 'Alex Rivera', 'student@a.com', 'Computer Science and Engineering', '3rd Year', 'Cybersecurity', '01 June 2026', '30 June 2026', 'virtual_course', 'certified', '2026-09-01 10:00:00'),
('cand_001', 'Arun Kumar', 'arun.kumar@university.edu', 'Computer Science and Engineering', '3rd Year', 'Cybersecurity', '01 June 2026', '30 June 2026', 'excel_import', 'pending', '2026-09-01 10:00:00'),
('cand_002', 'Priya Sundaram', 'priya.sundaram@techcollege.edu', 'Information Technology', '4th Year', 'Web Development', '15 July 2026', '30 August 2026', 'excel_import', 'certified', '2026-09-01 10:00:00'),
('cand_003', 'Rahul Krishnan', 'rahul.k@institute.ac.in', 'Electronics and Communication', '3rd Year', 'Cybersecurity', '01 June 2026', '30 June 2026', 'excel_import', 'certified', '2026-09-01 10:00:00'),
('cand_004', 'Divya Sharma', 'divya.sharma@engg.edu', 'Computer Science and Engineering', '4th Year', 'Artificial Intelligence', '01 August 2026', '31 August 2026', 'excel_import', 'certified', '2026-09-01 10:00:00'),
('cand_005', 'Karthik Raja', 'karthik.raja@apexuniv.edu', 'Information Science', '3rd Year', 'Cybersecurity', '01 June 2026', '30 June 2026', 'excel_import', 'pending', '2026-09-05 11:20:00'),
('cand_006', 'Ananya Deshmukh', 'ananya.d@polytech.ac.in', 'Computer Engineering', '2nd Year', 'Web Development', '15 July 2026', '30 August 2026', 'excel_import', 'pending', '2026-09-05 11:20:00'),
('cand_007', 'Siddharth Varma', 'siddharth.v@globaltech.edu', 'Electrical and Electronics', '4th Year', 'Cybersecurity', '01 June 2026', '30 June 2026', 'excel_import', 'pending', '2026-09-05 11:20:00'),
('cand_008', 'Sneha Patel', 'sneha.patel@nationaluniv.edu', 'Computer Science and Engineering', '3rd Year', 'Artificial Intelligence', '01 August 2026', '31 August 2026', 'manual_entry', 'pending', '2026-09-10 14:00:00'),
('cand_009', 'Vikramaditya Roy', 'vikram.roy@stateinst.ac.in', 'Mechanical Engineering (IoT Specialization)', '4th Year', 'Cybersecurity', '01 June 2026', '30 June 2026', 'excel_import', 'pending', '2026-09-12 09:30:00'),
('cand_010', 'Meera Nambiar', 'meera.n@crestuniv.edu', 'Information Technology', '3rd Year', 'Web Development', '15 July 2026', '30 August 2026', 'excel_import', 'pending', '2026-09-15 16:45:00');

-- 7. Certificate Templates
INSERT OR REPLACE INTO certificate_templates (id, name, description, template_path, primary_color, accent_color, active, created_at) VALUES
('classic-gold', 'Classic Gold Crest', 'Traditional prestigious academic design featuring navy royal borders, gold foil seal accents, and dual institutional signatures.', 'templates/classic-gold.svg', '#0f172a', '#d97706', 1, '2026-08-01 00:00:00'),
('modern-cyber', 'Modern Cyber Tech', 'High-tech dark futuristic theme with cyan and violet gradient geometry, QR authenticity watermark, and cryptographic hash verification bar.', 'templates/modern-cyber.svg', '#090d16', '#06b6d4', 1, '2026-08-01 00:00:00'),
('academic-crimson', 'Academic Crimson Excellence', 'Classic university certificate layout with rich crimson header ribbon, ornate border corner flourishes, and formal typography.', 'templates/academic-crimson.svg', '#450a0a', '#dc2626', 1, '2026-08-01 00:00:00');

-- 8. Pre-Generated Verified Certificates
INSERT OR REPLACE INTO certificates (id, certificate_id, candidate_id, student_id, internship_id, recipient_name, recipient_email, department, year_of_study, internship_domain, duration, start_date, end_date, certificate_number, pdf_path, pdf_url, template_id, qr_code_data, generated_at, status, source) VALUES
('cert_001', 'CERT-2026-CYB-000001', 'cand_student_01', 'std_01', 'intern_cyb_01', 'Alex Rivera', 'student@a.com', 'Computer Science and Engineering', '3rd Year', 'Cybersecurity Virtual Internship', '4 Weeks', '01 June 2026', '30 June 2026', 'CYB-2026-000001', 'certificates/Alex_Rivera_Certificate.pdf', '/api/certificates/CERT-2026-CYB-000001/download', 'classic-gold', 'https://interncert.org/verify/CERT-2026-CYB-000001', '2026-09-02 14:30:00', 'valid', 'virtual_course'),

('cert_002', 'CERT-2026-WEB-000002', 'cand_002', NULL, 'intern_web_02', 'Priya Sundaram', 'priya.sundaram@techcollege.edu', 'Information Technology', '4th Year', 'Full-Stack Web Engineering Virtual Internship', '6 Weeks', '15 July 2026', '30 August 2026', 'WEB-2026-000002', 'certificates/Priya_Sundaram_Certificate.pdf', '/api/certificates/CERT-2026-WEB-000002/download', 'classic-gold', 'https://interncert.org/verify/CERT-2026-WEB-000002', '2026-09-02 14:32:00', 'valid', 'excel_import'),

('cert_003', 'CERT-2026-CYB-000003', 'cand_003', NULL, 'intern_cyb_01', 'Rahul Krishnan', 'rahul.k@institute.ac.in', 'Electronics and Communication', '3rd Year', 'Cybersecurity Virtual Internship', '4 Weeks', '01 June 2026', '30 June 2026', 'CYB-2026-000003', 'certificates/Rahul_Krishnan_Certificate.pdf', '/api/certificates/CERT-2026-CYB-000003/download', 'modern-cyber', 'https://interncert.org/verify/CERT-2026-CYB-000003', '2026-09-02 14:35:00', 'valid', 'excel_import'),

('cert_004', 'CERT-2026-AI-000004', 'cand_004', NULL, 'intern_ai_03', 'Divya Sharma', 'divya.sharma@engg.edu', 'Computer Science and Engineering', '4th Year', 'Applied AI & Machine Learning Internship', '4 Weeks', '01 August 2026', '31 August 2026', 'AI-2026-000004', 'certificates/Divya_Sharma_Certificate.pdf', '/api/certificates/CERT-2026-AI-000004/download', 'academic-crimson', 'https://interncert.org/verify/CERT-2026-AI-000004', '2026-09-02 14:38:00', 'valid', 'excel_import');

-- 9. Email Logs
INSERT OR REPLACE INTO email_logs (id, certificate_id, recipient_email, recipient_name, status, subject, error_message, sent_at, retry_count) VALUES
('elog_001', 'cert_001', 'student@a.com', 'Alex Rivera', 'sent', 'Congratulations! Your Cybersecurity Internship Certificate', NULL, '2026-09-02 14:30:15', 0),
('elog_002', 'cert_002', 'priya.s@example.com', 'Priya Sundaram', 'sent', 'Congratulations! Your Full-Stack Web Internship Certificate', NULL, '2026-09-02 14:32:20', 0),
('elog_003', 'cert_003', 'rahul.k@example.com', 'Rahul Krishnan', 'sent', 'Congratulations! Your Cybersecurity Internship Certificate', NULL, '2026-09-02 14:35:10', 0),
('elog_004', 'cert_004', 'divya.sharma@engg.edu', 'Divya Sharma', 'failed', 'Congratulations! Your Applied AI Certificate', 'SMTP connection timeout to recipient gateway. Rate limit triggered.', '2026-09-02 14:38:25', 1);

-- 10. Audit Logs
INSERT OR REPLACE INTO audit_logs (id, admin_id, action, details, ip_address, created_at) VALUES
('aud_001', 'usr_superadmin', 'EXCEL_BATCH_IMPORT', 'Imported 10 candidates from cohort_2026_q2.xlsx', '192.168.1.50', '2026-09-01 10:05:00'),
('aud_002', 'usr_superadmin', 'BULK_CERTIFICATE_GENERATION', 'Generated 4 PDF certificates (CERT-000001 to CERT-000004)', '192.168.1.50', '2026-09-02 14:40:00'),
('aud_003', 'usr_superadmin', 'EMAIL_DISPATCH_BATCH', 'Dispatched 4 certificate delivery emails via Gmail API OAuth2', '192.168.1.50', '2026-09-02 14:42:00');
