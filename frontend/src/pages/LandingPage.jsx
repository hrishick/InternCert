import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Award, ShieldCheck, FileSpreadsheet, GraduationCap, CheckCircle2, 
  ArrowRight, Search, Zap, Lock, Mail, Download, Sparkles, Layers,
  Terminal, BarChart3, ChevronRight, FileCheck, Check, KeyRound
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CertificateCanvas from '../components/CertificateCanvas';

export default function LandingPage() {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  const [verifyInput, setVerifyInput] = useState('');

  const sampleCertificate = {
    certificate_id: 'CERT-2026-CYB-000001',
    recipient_name: 'Alex Rivera',
    department: 'Computer Science and Engineering',
    year_of_study: '3rd Year',
    internship_domain: 'Cybersecurity Virtual Internship',
    start_date: '01 June 2026',
    end_date: '30 June 2026',
    duration: '4 Weeks',
    template_id: 'classic-gold'
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    if (verifyInput.trim()) {
      navigate(`/verify/${verifyInput.trim()}`);
    }
  };

  return (
    <div className="relative overflow-hidden bg-grid-pattern">
      {/* Background radial blurs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-3/4 left-1/4 w-[500px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* HERO SECTION */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-semibold backdrop-blur-md shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Complete • Certify • Verify — Enterprise Credential Engine</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Automated Internship & <br />
            <span className="gradient-text-brand">Certificate Management</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            From virtual internship completion to verifiable bulk certification — completely automated with Cloudflare D1, R2 storage, and dynamic QR verification.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => {
                if (user) {
                  navigate(user.role === 'student' ? '/student' : '/admin');
                } else {
                  openAuth('login');
                }
              }}
              className="px-7 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-brand-600 via-brand-500 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow-brand transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <GraduationCap className="w-5 h-5" />
              Explore Virtual Internships
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (user && ['superadmin', 'admin', 'teacher'].includes(user.role)) {
                  navigate('/admin');
                } else {
                  openAuth('login');
                }
              }}
              className="px-7 py-3.5 rounded-xl font-bold text-sm bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 transition-all flex items-center gap-2 transform hover:-translate-y-0.5"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              Administrative Portal
            </button>
          </div>

          {/* Quick Verifier Search directly on Hero */}
          <div className="pt-8 max-w-xl mx-auto">
            <form onSubmit={handleVerifySubmit} className="relative flex items-center shadow-2xl">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={verifyInput}
                onChange={(e) => setVerifyInput(e.target.value)}
                placeholder="Enter Certificate ID (e.g. CERT-2026-CYB-000001)..."
                className="w-full pl-12 pr-32 py-3.5 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono shadow-inner backdrop-blur-md"
              />
              <button
                type="submit"
                className="absolute right-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-gold-400" />
                Verify
              </button>
            </form>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              Sample verification ID: <button type="button" onClick={() => setVerifyInput('CERT-2026-CYB-000001')} className="text-brand-400 font-mono underline">CERT-2026-CYB-000001</button>
            </p>
          </div>
        </div>
      </section>

      {/* CORE DIFFERENTIATOR: TWO WORKFLOWS HIGHLIGHT */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-400">
            Dual-Workflow Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Two Complete Certificate Generation Workflows
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto mt-3">
            Whether issuing certificates in bulk from Excel datasets or empowering students with virtual courses, InternCert handles the entire lifecycle automatically.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Workflow A: Admin Bulk Excel */}
          <div className="glass-panel p-8 rounded-2xl border border-slate-700/60 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  Official Requirement
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  Workflow A: Admin Bulk Excel Import
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Upload spreadsheets (.xlsx, .xls, .csv), automatically validate candidate records, generate vector PDFs in bulk, dispatch via Gmail API, and download ZIP packages.
            </p>

            <div className="space-y-3 mb-6">
              {[
                'Smart Column Auto-Mapping (Name, Dept, Year, Domain, Dates)',
                'Live Validation Engine (Error alerts, duplicate email filter)',
                'One-Click Batch PDF Generation with Predefined Templates',
                'Individual and Bulk ZIP Certificate Downloads',
                'Integrated Email Dispatch Logs with Instant Retry'
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (user && ['superadmin', 'admin', 'teacher'].includes(user.role)) {
                  navigate('/admin');
                } else {
                  openAuth('login');
                }
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 flex items-center justify-center gap-2 transition-all"
            >
              Open Admin Excel Import Studio
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Workflow B: Student Virtual Internship */}
          <div className="glass-panel p-8 rounded-2xl border border-slate-700/60 relative overflow-hidden group hover:border-brand-500/50 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 font-bold">
                  Innovative Differentiator
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  Workflow B: Student Virtual Internship
                </h3>
              </div>
            </div>

            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Interactive 4-module learning tracks with embedded video/reading, knowledge checkpoints, final graded assessment, and immediate automated certification upon passing (≥70%).
            </p>

            <div className="space-y-3 mb-6">
              {[
                'Self-Paced Learning Modules with Interactive Progress Bar',
                'Cybersecurity, Web Engineering & Applied AI Curriculum',
                'Comprehensive 10-Question Graded Assessment Exam',
                'Automatic Certificate Generation & Database Registration',
                'Instant Public Credential Verification via QR Code'
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                if (user) {
                  navigate(user.role === 'student' ? '/student' : '/admin');
                } else {
                  openAuth('login');
                }
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/40 flex items-center justify-center gap-2 transition-all"
            >
              Start Virtual Internship Track
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* INTERACTIVE HOW IT WORKS TIMELINE */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-gold-400">
            End-To-End Automation
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            How The System Works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          {[
            { step: '01', title: 'Enroll / Upload', desc: 'Students enroll or admins upload candidate Excel spreadsheet.' },
            { step: '02', title: 'Validate / Learn', desc: 'Data validated or student completes interactive modules & quiz.' },
            { step: '03', title: 'Generate PDF', desc: 'Predefined certificate template populated with unique Cert ID.' },
            { step: '04', title: 'Save & Email', desc: 'PDF stored to R2, registered in D1, and dispatched via Gmail API.' },
            { step: '05', title: 'Public Verify', desc: 'Recipients & recruiters scan QR code to verify validity online.' }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel p-5 rounded-xl border border-slate-800 text-center relative hover:border-slate-600 transition-all">
              <div className="w-8 h-8 rounded-lg bg-slate-800 text-brand-400 font-mono font-bold text-xs flex items-center justify-center mx-auto mb-3 border border-slate-700">
                {item.step}
              </div>
              <h4 className="text-sm font-bold text-white mb-1.5">{item.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SAMPLE CERTIFICATE SHOWCASE */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="text-center mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            High-Security Output
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2">
            Verifiable Certificate Standard
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Embedded with anti-tamper QR verification codes, unique IDs, and academic authority seals.
          </p>
        </div>

        <CertificateCanvas certificate={sampleCertificate} showActions={true} />
      </section>
    </div>
  );
}
