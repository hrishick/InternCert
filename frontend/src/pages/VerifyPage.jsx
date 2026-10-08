import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, CheckCircle2, AlertTriangle, Search, Download, 
  Award, ExternalLink, Calendar, Building, Sparkles, Lock, ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import CertificateCanvas from '../components/CertificateCanvas';

export default function VerifyPage() {
  const { certificateId } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState(certificateId || '');
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (certificateId) {
      performVerification(certificateId);
    }
  }, [certificateId]);

  const performVerification = async (idToVerify) => {
    if (!idToVerify || !idToVerify.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.verifyCertificate(idToVerify.trim());
      setVerificationResult(data);
    } catch (err) {
      setVerificationResult({ valid: false, status: 'ERROR', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/verify/${searchId.trim()}`);
      performVerification(searchId.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gold-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-gold-400 shadow-glow-gold">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-extrabold text-white">
          Public Certificate Verification Registry
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          Verify the authenticity, issuance credentials, and institutional accreditation of any InternCert credential in real time.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 shadow-xl">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Certificate ID (e.g. CERT-2026-CYB-000001)..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow-brand transition-all shrink-0"
          >
            {loading ? 'Verifying...' : 'Verify Now'}
          </button>
        </form>
      </div>

      {/* VERIFICATION RESULT CARD */}
      {searched && (
        <div className="space-y-6 animate-fadeIn">
          {verificationResult?.valid ? (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border-2 border-emerald-500/40 shadow-glow-brand space-y-6">
              
              {/* Status Ribbon */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                        Official Status
                      </span>
                      <span className="text-xs text-emerald-400 font-mono font-bold">
                        VALID & ACCREDITED
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                      Certificate Officially Verified
                    </h2>
                  </div>
                </div>

                <a
                  href={api.getDownloadUrl(verificationResult.certificateId)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
              </div>

              {/* Credential Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-mono text-[10px] uppercase">Candidate Name</span>
                  <div className="text-base font-bold text-white">{verificationResult.recipientName}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-mono text-[10px] uppercase">Certificate Identifier</span>
                  <div className="text-base font-bold text-brand-400 font-mono">{verificationResult.certificateId}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-mono text-[10px] uppercase">Program / Domain</span>
                  <div className="font-semibold text-slate-200">{verificationResult.internshipDomain}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-mono text-[10px] uppercase">Department / Discipline</span>
                  <div className="font-semibold text-slate-200">{verificationResult.department}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-mono text-[10px] uppercase">Internship Duration</span>
                  <div className="font-semibold text-slate-200 font-mono">{verificationResult.duration}</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-slate-400 font-mono text-[10px] uppercase">Issuing Authority</span>
                  <div className="font-semibold text-slate-200">{verificationResult.issuingAuthority}</div>
                </div>
              </div>

              {/* Cryptographic Proof Strip */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Lock className="w-3.5 h-3.5 text-gold-400" />
                    Cryptographic Signature Hash:
                  </span>
                  <span className="text-emerald-400">Verified Match</span>
                </div>
                <div className="p-2 rounded bg-slate-900 font-mono text-[11px] text-brand-300 break-all border border-slate-800">
                  {verificationResult.cryptographicHash}
                </div>
              </div>

              {/* Interactive Certificate Canvas View */}
              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">
                  Official Conferred Document Preview
                </h3>
                <CertificateCanvas
                  certificate={{
                    certificate_id: verificationResult.certificateId,
                    recipient_name: verificationResult.recipientName,
                    department: verificationResult.department,
                    internship_domain: verificationResult.internshipDomain,
                    duration: verificationResult.duration,
                    start_date: verificationResult.startDate,
                    end_date: verificationResult.endDate,
                    template_id: verificationResult.templateId || 'classic-gold'
                  }}
                  showActions={false}
                />
              </div>

            </div>
          ) : (
            <div className="glass-panel p-8 rounded-2xl border-2 border-rose-500/40 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                Certificate Verification Failed
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                {verificationResult?.message || `No valid certificate was found matching ID "${searchId}". Please check the spelling or contact the issuing authority.`}
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setSearchId('CERT-2026-CYB-000001')}
                  className="text-xs text-brand-400 underline font-mono"
                >
                  Try Demo ID: CERT-2026-CYB-000001
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security & Privacy Notice */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed text-center">
        🔒 <strong>Public Verification Privacy Standard</strong>: In accordance with academic privacy protocols, this verifier confirms credential authenticity without exposing confidential student identifiers, personal phone records, or internal passwords.
      </div>

    </div>
  );
}
