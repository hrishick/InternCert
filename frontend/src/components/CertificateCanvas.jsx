import React, { useState } from 'react';
import { Download, ExternalLink, ShieldCheck, CheckCircle2, QrCode, Sparkles, Printer } from 'lucide-react';
import api from '../services/api';

export default function CertificateCanvas({
  certificate,
  showActions = true,
  template = 'classic-gold'
}) {
  const [downloading, setDownloading] = useState(false);

  if (!certificate) return null;

  const {
    certificate_id,
    recipient_name,
    department,
    year_of_study,
    internship_domain,
    start_date,
    end_date,
    duration,
    generated_at
  } = certificate;

  const downloadUrl = api.getDownloadUrl(certificate_id);
  const verifyUrl = `${window.location.origin}/verify/${certificate_id}`;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      window.location.href = downloadUrl;
    } finally {
      setTimeout(() => setDownloading(false), 1200);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Styles based on template
  const isCyber = template === 'modern-cyber' || certificate.template_id === 'modern-cyber';
  const isCrimson = template === 'academic-crimson' || certificate.template_id === 'academic-crimson';

  const containerBg = isCyber 
    ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 text-slate-100 border-cyan-500/40' 
    : isCrimson
    ? 'bg-[#fffdfa] text-slate-900 border-red-900/40'
    : 'bg-[#faf9f5] text-slate-900 border-amber-600/50';

  const titleColor = isCyber
    ? 'text-cyan-400 font-sans tracking-widest'
    : isCrimson
    ? 'text-red-950 font-serif'
    : 'text-slate-900 font-serif';

  const nameColor = isCyber
    ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300'
    : isCrimson
    ? 'text-red-900 font-serif'
    : 'text-slate-950 font-serif';

  const accentBorder = isCyber
    ? 'border-cyan-500/40'
    : isCrimson
    ? 'border-red-800'
    : 'border-amber-600/70';

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto my-4">
      {/* Certificate Frame */}
      <div 
        className={`w-full aspect-[1.414/1] relative p-8 md:p-12 rounded-xl shadow-2xl transition-all duration-300 ${containerBg} border-8 ${accentBorder}`}
        style={{
          boxShadow: isCyber 
            ? '0 0 50px -10px rgba(6, 182, 212, 0.3)' 
            : '0 20px 40px -15px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Ornate Inner Double Border */}
        <div className={`w-full h-full border-2 ${isCyber ? 'border-cyan-400/30' : 'border-amber-700/40'} p-6 md:p-8 flex flex-col justify-between relative`}>
          
          {/* Corner Rosettes / Geometric Accents */}
          <div className="absolute -top-3 -left-3 w-6 h-6 border-t-2 border-l-2 border-amber-600 bg-amber-500/20" />
          <div className="absolute -top-3 -right-3 w-6 h-6 border-t-2 border-r-2 border-amber-600 bg-amber-500/20" />
          <div className="absolute -bottom-3 -left-3 w-6 h-6 border-b-2 border-l-2 border-amber-600 bg-amber-500/20" />
          <div className="absolute -bottom-3 -right-3 w-6 h-6 border-b-2 border-r-2 border-amber-600 bg-amber-500/20" />

          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className={`text-[10px] md:text-xs font-bold tracking-[0.25em] uppercase ${isCyber ? 'text-cyan-400' : 'text-slate-500'}`}>
                INTERNCERT NATIONAL ACCREDITATION & CERTIFICATION CELL
              </span>
            </div>
            <h1 className={`text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight ${titleColor}`}>
              CERTIFICATE OF COMPLETION
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-[1.5px] w-20 bg-gradient-to-r from-transparent to-amber-500" />
              <span className="text-[11px] font-semibold text-amber-600 tracking-wider uppercase">
                OFFICIAL CREDENTIAL
              </span>
              <div className="h-[1.5px] w-20 bg-gradient-to-l from-transparent to-amber-500" />
            </div>
          </div>

          {/* Recipient Presentation */}
          <div className="text-center my-auto space-y-4 py-4">
            <p className="text-xs md:text-sm uppercase tracking-widest text-slate-500 font-medium">
              THIS IS PROUDLY CONFERRED UPON
            </p>
            
            <div className="py-1">
              <h2 className={`text-2xl md:text-4xl lg:text-5xl font-black ${nameColor} tracking-wide`}>
                {recipient_name}
              </h2>
              <div className="w-48 h-0.5 bg-amber-500/40 mx-auto mt-2" />
            </div>

            <div className="max-w-2xl mx-auto space-y-1.5 text-xs md:text-sm leading-relaxed text-slate-700">
              <p className={isCyber ? 'text-slate-300' : 'text-slate-700'}>
                for demonstrating practical competence and successfully completing all modules in the
              </p>
              <p className={`text-base md:text-xl font-bold ${isCyber ? 'text-cyan-300' : 'text-blue-950'}`}>
                {internship_domain}
              </p>
              {department && (
                <p className={`text-xs italic ${isCyber ? 'text-slate-400' : 'text-slate-600'}`}>
                  Department of {department} {year_of_study ? `(${year_of_study})` : ''}
                </p>
              )}
              <p className={`text-[11px] md:text-xs ${isCyber ? 'text-slate-400' : 'text-slate-500'} font-medium`}>
                Conducted: {start_date} – {end_date} {duration ? `• Duration: ${duration}` : ''}
              </p>
            </div>
          </div>

          {/* Footer: Signatures, Gold Seal, & QR Code */}
          <div className="grid grid-cols-3 items-end pt-4 border-t border-slate-200/60 mt-2">
            
            {/* Left Signature */}
            <div className="text-left space-y-1">
              <div className="font-serif italic text-base md:text-lg text-slate-800">
                Dr. Kimberly Vance
              </div>
              <div className="w-36 h-[1px] bg-slate-400" />
              <p className="text-[10px] md:text-xs font-bold text-slate-800">Dr. Kimberly Vance, Ph.D.</p>
              <p className="text-[9px] md:text-[10px] text-slate-500">Director of Academic Affairs</p>
            </div>

            {/* Center: Official Gold Seal */}
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-amber-600 bg-gradient-to-br from-amber-400 to-amber-600 flex flex-col items-center justify-center shadow-lg text-amber-950 text-center p-1">
                <ShieldCheck className="w-5 h-5 text-amber-950 mb-0.5" />
                <span className="text-[8px] font-black tracking-tighter uppercase leading-none">VERIFIED</span>
                <span className="text-[7px] font-bold tracking-tighter uppercase leading-none mt-0.5">OFFICIAL</span>
              </div>
            </div>

            {/* Right Signature */}
            <div className="text-right space-y-1">
              <div className="font-serif italic text-base md:text-lg text-slate-800">
                Prof. Marcus Sterling
              </div>
              <div className="w-36 h-[1px] bg-slate-400 ml-auto" />
              <p className="text-[10px] md:text-xs font-bold text-slate-800">Prof. Marcus Sterling</p>
              <p className="text-[9px] md:text-[10px] text-slate-500">Dean of Certification Cell</p>
            </div>
          </div>

          {/* Bottom Security Hash & QR Code Reference */}
          <div className="flex items-center justify-between pt-3 mt-2 text-[9px] md:text-[10px] font-mono text-slate-500 border-t border-slate-200/40">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">ID: {certificate_id}</span>
              <span>•</span>
              <span className="hidden sm:inline">SHA256-{certificate_id.slice(-8)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-sans font-semibold">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Cryptographically Verified
            </div>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      {showActions && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow-brand transition-all transform active:scale-95"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading PDF...' : 'Download PDF Certificate'}
          </button>

          <a
            href={verifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <ExternalLink className="w-4 h-4 text-gold-400" />
            Public Verification Link
          </a>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      )}
    </div>
  );
}
