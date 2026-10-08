# System Architecture & Technical Specifications

## 1. High-Level Architecture Overview

InternCert is designed with a modern, cloud-native architecture optimized for Cloudflare Workers, Cloudflare D1 (Serverless SQLite), and Cloudflare R2 (S3-compatible object storage).

```
[ Browser Client / React 18 + Vite ]
         │
         │ (HTTP REST / JSON / Multipart)
         ▼
[ Cloudflare Pages / Edge Network ]
         │
         ▼
[ Cloudflare Workers API Gateway ]
   ├── Auth Middleware (JWT & SHA-256)
   ├── Excel Ingestion Engine (SheetJS XLSX)
   ├── Vector PDF Generator (pdf-lib + QR Code)
   ├── Gmail API OAuth 2.0 Dispatcher
   └── ZIP Packaging Service (JSZip)
         │
         ├───▶ [ Cloudflare D1 Database (SQLite WAL) ]
         │       ├── users, students, internships, modules
         │       ├── enrollments, quiz_questions, quiz_results
         │       └── candidates, certificates, email_logs, audit_logs
         │
         └───▶ [ Cloudflare R2 / Storage Bucket ]
                 └── /certificates/{Safe_Name}_Certificate.pdf
```

## 2. Cloudflare D1 Database Schema Design

- **`users` & `students`**: Role-based access control (Admin vs Student).
- **`internships` & `modules`**: Multi-tenant virtual courses with ordered learning units.
- **`enrollments` & `module_progress`**: Granular per-module completion percentage calculation.
- **`quiz_questions` & `quiz_results`**: Graded assessments with automated pass/fail criteria (≥70%).
- **`candidates`**: Admin cohort records imported from spreadsheets or enrolled from courses.
- **`certificates`**: High-security certificate records storing unique ID, duration, PDF path, and verification status.
- **`email_logs`**: Full delivery audit trail with error codes and retry counters.
- **`audit_logs`**: Administrative action tracking with IP addresses.

## 3. Pure JavaScript PDF Generation Engine

To ensure 100% compatibility with Cloudflare Workers edge runtime (where native binaries like Chromium or Puppeteer cannot run), the PDF generation engine is built entirely on `pdf-lib` and `qrcode`:
- Generates Landscape A4 documents (842 x 595.28 points).
- Embeds standard vector fonts (Times-Roman, Helvetica, Courier).
- Draws vector guilloche patterns, gold foil borders, and institutional rosettes.
- Dynamically encodes the live verification URL into a High-Error-Correction QR Code.
- Embeds anti-tamper verification hashes (`SHA256-XXXXXXXX`).
- Generates sanitized, human-readable filenames (`Arun_Kumar_Certificate.pdf`).

## 4. Security & Privacy Guardrails

1. **Path Traversal Protection**: All filenames are sanitized with `/^[^a-zA-Z0-9._-]/g` prior to disk/R2 writes.
2. **Public Verification Privacy**: The `/verify/:id` endpoint exposes only necessary academic credentials (Name, Domain, Dates, Status, Issuer) and explicitly omits private student identifiers, phones, or credentials.
3. **OAuth 2.0 Gmail Dispatch**: Uses refresh tokens and MIME multipart transmission; no Gmail passwords are ever stored.
