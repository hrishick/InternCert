import { Award, ShieldCheck, ExternalLink, Mail, Cloud, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800/80 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-glow-brand">
                <Award className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl text-white">
                Intern<span className="text-brand-500">Cert</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated Internship Lifecycle & High-Security Certificate Generation Platform. Designed for modern universities, edtech enterprises, and virtual cohorts.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              All Systems Operational
            </div>
          </div>

          {/* Core Architecture */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Cloud className="w-3.5 h-3.5 text-brand-400" />
              Cloud Architecture
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                Cloudflare Workers & Pages
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                Cloudflare D1 SQL Database
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Cloudflare R2 Object Storage
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Gmail API OAuth 2.0 Engine
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
              Platform Modules
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/student" className="hover:text-brand-400 transition-colors">
                  Cybersecurity Virtual Internship
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-emerald-400 transition-colors">
                  Bulk Excel Candidate Import
                </Link>
              </li>
              <li>
                <Link to="/verify" className="hover:text-gold-400 transition-colors">
                  Cryptographic Certificate Verifier
                </Link>
              </li>
              <li>
                <Link to="/verify/CERT-2026-CYB-000001" className="hover:text-slate-200 transition-colors">
                  Sample Certificate (ID: CYB-000001)
                </Link>
              </li>
            </ul>
          </div>

          {/* Compliance & Security */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">
              Security & Compliance
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Protected by SHA-256 anti-tamper hashes, dynamic QR codes, sanitized filenames, and strict role-based access control.
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              🔒 Zero Plaintext Passwords • OAuth 2.0 Security
            </div>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 InternCert Platform. Built for Hackathon Excellence.</p>
          <div className="flex items-center gap-6">
            <span>Production Ready</span>
            <span>Cloudflare Native</span>
            <span className="text-brand-400 font-semibold">Complete. Certify. Verify.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
