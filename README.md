# InternCert — Automated Internship & Certificate Management Platform

> **"Complete. Certify. Verify."**  
> An enterprise-grade, Cloudflare-native platform engineered for universities, edtech providers, and virtual cohorts that completely automates internship completion tracking, bulk Excel ingestion, high-security vector PDF certificate generation, Gmail delivery, and cryptographic verification.

---

## 🌟 Dual-Workflow Architecture

InternCert uniquely unifies two certificate generation engines:

```
                               ┌─────────────────────────────────────────────────────────┐
                               │                 INTERNCERT PLATFORM                     │
                               └──────────────────────────┬──────────────────────────────┘
                                                          │
                    ┌─────────────────────────────────────┴─────────────────────────────────────┐
                    ▼                                                                           ▼
┌───────────────────────────────────────┐                                   ┌───────────────────────────────────────┐
│     WORKFLOW A: ADMIN BULK EXCEL      │                                   │    WORKFLOW B: STUDENT VIRTUAL TRACK  │
├───────────────────────────────────────┤                                   ├───────────────────────────────────────┤
│ 1. Upload .xlsx / .xls / .csv         │                                   │ 1. Student self-enrolls in course     │
│ 2. Smart column auto-mapping          │                                   │ 2. Interactive learning modules (1-4) │
│ 3. Row-by-row validation & duplicates │                                   │ 3. Comprehensive 10-question quiz     │
│ 4. Batch vector PDF generation        │                                   │ 4. Passing score (≥70%) achieved      │
│ 5. Automated Gmail API dispatch       │                                   │ 5. Immediate auto certificate issued  │
│ 6. Download individual / ZIP archives │                                   │ 6. QR verification & PDF download     │
└───────────────────┬───────────────────┘                                   └───────────────────┬───────────────────┘
                    │                                                                           │
                    └─────────────────────────────────────┬─────────────────────────────────────┘
                                                          ▼
                                        ┌───────────────────────────────────┐
                                        │   PUBLIC VERIFICATION REGISTRY    │
                                        │      /verify/{certificateId}      │
                                        └───────────────────────────────────┘
```

---

## 🚀 Key Features

- 📑 **Smart Excel & CSV Ingestion**: Flexible header detection (`Candidate Name`, `Student Name`, `Full Name`, `Department`, `Discipline`, `Dates`), error highlighting, and duplicate email filtering.
- 🎨 **Predefined Vector Certificate Templates**: High-resolution, vector-rendered certificates in Landscape A4 (Classic Gold Crest, Modern Cyber Tech, Academic Crimson) with dynamic fonts, borders, gold seals, and signatures.
- 📱 **Embedded Dynamic QR Code & Unique IDs**: Every certificate features a cryptographically traceable ID (e.g. `CERT-2026-CYB-000001`) and live QR code pointing to public verification.
- 🎓 **Interactive Virtual Internship Classroom**: 4 hands-on modules (Network Security, Linux Privilege Management, Web Security & OWASP Top 10, Incident Response) with video embeds and interactive completion tracking.
- 📝 **Graded Assessment Engine**: 10-question evaluation with automatic scoring and instant certificate issuance upon passing (≥70%).
- 🛡️ **Public Verification Registry**: Instant credential validation displaying recipient, program, dates, issuing authority, and SHA-256 hash without exposing private phone/passwords.
- ✉️ **Gmail API OAuth 2.0 Dispatcher**: Professional email delivery with attached PDFs, fallback simulation mode, delivery logs, and 1-click retry.
- 📦 **Bulk ZIP Packaging**: Export all candidate certificates in a single sanitized ZIP archive.
- 📊 **Executive Admin Analytics**: Real-time charts for certificate generation trends, domain breakdown, and email delivery rates.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite 6, Tailwind CSS, Lucide Icons, Canvas Confetti |
| **Backend API** | Node.js 24 / Cloudflare Workers REST API |
| **Database** | Cloudflare D1 / SQLite (WAL mode, Foreign Keys) |
| **Object Storage** | Cloudflare R2 / Local Disk Storage Abstraction |
| **PDF Engine** | `pdf-lib` + `qrcode` (100% pure JS, Edge & Worker compatible) |
| **Excel Parser** | `xlsx` (SheetJS) |
| **Email Engine** | Google Cloud Gmail API (OAuth 2.0) + Delivery Simulator |
| **Packaging** | `jszip` for bulk ZIP generation |

---

## ⚡ Quick Start & Local Execution

### Prerequisites
- Node.js `v20+` or `v24+`
- npm `v10+`

### 1. Clone & Install Dependencies
```bash
cd Hackathon
npm install
```

### 2. Seed Database
```bash
npm run seed
```

### 3. Start Frontend & Backend Concurrently
```bash
npm run dev
```

- **Frontend Application**: `http://localhost:5173`
- **Backend REST API**: `http://localhost:8787`

---

## 🔑 Initial System Accounts

All accounts use default password: `password123`

| Role | Email | Password | Permissions |
|---|---|---|---|
| **SuperAdmin** | `superadmin@a.com` | `password123` | Full root access: User & Role Management, Credentials reset, Batch Certification, Excel Ingestion, Analytics |
| **Faculty / Teacher** | `teacher@a.com` | `password123` | Students & candidate progress access, certificate generation, email logs (User ID modification restricted) |
| **Student** | `student@a.com` | `password123` | Student learning workspace, interactive modules, final assessment exam, verified certificate download |

---

## 🧪 Hackathon Demonstration Flow

1. **Explore Landing Page**:
   - Open `http://localhost:5173/`.
   - Test the **Public Verifier** input with `CERT-2026-CYB-000001` or `CERT-2026-WEB-000002`.

2. **Student Virtual Internship Flow**:
   - Click **"Demo Student"** to log in as *Arun Kumar*.
   - View current track progress (e.g. 40%).
   - Enter **Cybersecurity Virtual Internship** classroom.
   - Complete modules and switch to **Final Assessment**.
   - Answer all 10 questions and click **Submit Final Assessment**.
   - 🎉 Enjoy the celebration confetti burst and view your newly issued certificate!
   - Click **Download PDF** to inspect the vector PDF.

3. **Admin Bulk Excel Import Flow**:
   - Click **"Demo Admin"** to log in as *Prof. Sarah Jenkins*.
   - Go to **Bulk Excel Import Wizard** tab.
   - Click **Download Sample Excel Template** (or upload `templates/sample_candidates.xlsx`).
   - Observe live column mapping, valid row badges, and error diagnostics.
   - Click **Import Valid Candidates**.
   - Click **Generate Certificates** to batch-produce PDF certificates.
   - Click **Download All ZIP** to download the bundled ZIP archive.
   - Inspect **Email Dispatcher Logs** and test **Retry Email** on any simulated failure.

---

## 📁 Repository Structure

```
Hackathon/
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Footer, AuthModal, CertificateCanvas
│   │   ├── pages/            # LandingPage, StudentPortal, InternshipWorkspace, AdminDashboard, VerifyPage
│   │   ├── context/          # AuthContext (1-click demo logins)
│   │   └── services/         # api.js
│   ├── index.html
│   └── vite.config.js
├── backend/
│   ├── src/
│   │   ├── database/         # db.js, init-db.js
│   │   ├── routes/           # auth.js, admin.js, internships.js, certificates.js
│   │   ├── services/         # pdfService.js, excelService.js, emailService.js, storageService.js
│   │   └── index.js
│   └── wrangler.toml         # Cloudflare Workers, D1 & R2 configuration
├── database/
│   ├── schema.sql            # Complete D1 schema
│   └── seed.sql              # Rich demo seed dataset
├── templates/
│   ├── sample_candidates.xlsx
│   └── sample_candidates.csv
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CLOUDFLARE_DEPLOYMENT.md
│   └── GMAIL_OAUTH_SETUP.md
├── test_flows.js             # Automated 15-point end-to-end verification script
└── README.md
```

---

## 📜 License
MIT © 2026 InternCert Platform • National Internship & Certification Cell
