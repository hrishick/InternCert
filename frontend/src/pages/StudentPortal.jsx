import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Award, BookOpen, CheckCircle2, Clock, 
  ArrowRight, Download, ExternalLink, ShieldCheck, Sparkles, PlayCircle,
  FileCheck2, Lock, ChevronRight, User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CertificateCanvas from '../components/CertificateCanvas';

export default function StudentPortal() {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  const [internships, setInternships] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const allInternships = await api.getInternships();
      setInternships(allInternships);

      if (user && user.role === 'student') {
        const studentId = user.studentId || 'std_01';
        const data = await api.getStudentDashboard(studentId);
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (internshipId) => {
    if (!user) {
      openAuth('login');
      return;
    }
    try {
      const studentId = user.studentId || 'std_01';
      await api.enroll(internshipId, studentId);
      await loadData();
      navigate(`/workspace/${internshipId}`);
    } catch (err) {
      alert(err.message || 'Enrollment failed');
    }
  };

  if (!user || user.role !== 'student') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-10 rounded-2xl border border-slate-800 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-400">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Student Portal Access</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Please log in with your student account or register to enroll in virtual internships and track your certifications.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => openAuth('login')}
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow-brand flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Sign In to Student Account
            </button>
            <button
              onClick={() => openAuth('register')}
              className="px-6 py-3 rounded-xl font-semibold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              Register New Student
            </button>
          </div>
        </div>
      </div>
    );
  }

  const enrollments = dashboardData?.enrollments || [];
  const primaryEnrollment = enrollments.find(e => e.internship_domain?.includes('Cyber')) || enrollments[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Welcome Header */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800/80 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30 font-mono">
              Student Dashboard
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Account: {user.email}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back, <span className="gradient-text-brand">{user.name}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            {user.department || 'Computer Science and Engineering'} • {user.yearOfStudy || '3rd Year'}
          </p>
        </div>

        {/* Status Pill Card */}
        <div className="flex items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
          <div className="w-12 h-12 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400">Active Enrollments</div>
            <div className="text-lg font-bold text-white">{enrollments.length} Programs</div>
          </div>
        </div>
      </div>

      {/* ACTIVE INTERNSHIP PROGRESS SECTION */}
      {primaryEnrollment ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              Current Virtual Internship Track
            </h2>
            <Link
              to={`/workspace/${primaryEnrollment.internship_id}`}
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              Open Interactive Classroom <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                  {primaryEnrollment.internship_domain}
                </span>
                <h3 className="text-xl font-bold text-white mt-1.5">
                  {primaryEnrollment.internship_title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  {primaryEnrollment.internship_description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  to={`/workspace/${primaryEnrollment.internship_id}`}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand flex items-center gap-2 transition-all"
                >
                  <PlayCircle className="w-4 h-4" />
                  {primaryEnrollment.status === 'completed' ? 'Review Modules' : 'Continue Learning'}
                </Link>
              </div>
            </div>

            {/* Completion Percentage Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-300">Overall Track Progress</span>
                <span className="text-brand-400 font-mono text-sm">{primaryEnrollment.completion_percentage}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden p-0.5 border border-slate-800">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 via-brand-500 to-emerald-400 transition-all duration-700"
                  style={{ width: `${Math.max(5, primaryEnrollment.completion_percentage)}%` }}
                />
              </div>
            </div>

            {/* Modules Check-List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {primaryEnrollment.modules?.map((mod, idx) => (
                <div 
                  key={mod.id}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    mod.isCompleted 
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' 
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-slate-400">Module {idx + 1}</span>
                    {mod.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </div>
                  <div className="font-semibold truncate">{mod.title.replace(/^Module \d+:\s*/, '')}</div>
                </div>
              ))}
            </div>

            {/* Certificate Status Alert / Unlock Banner */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              primaryEnrollment.certificate 
                ? 'bg-gradient-to-r from-amber-500/10 via-brand-500/10 to-emerald-500/10 border-amber-500/30' 
                : 'bg-slate-900/80 border-slate-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  primaryEnrollment.certificate 
                    ? 'bg-amber-500/20 text-gold-400 border border-amber-500/40' 
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-sm text-white">
                    {primaryEnrollment.certificate ? '🎉 Official Certificate Awarded!' : 'Certificate of Completion'}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {primaryEnrollment.certificate 
                      ? `ID: ${primaryEnrollment.certificate.certificate_id}` 
                      : 'Complete all 4 modules and achieve ≥70% on final assessment to unlock.'}
                  </div>
                </div>
              </div>

              {primaryEnrollment.certificate ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCert(primaryEnrollment.certificate)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
                    View Certificate
                  </button>

                  <a
                    href={api.getDownloadUrl(primaryEnrollment.certificate.certificate_id)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PDF
                  </a>
                </div>
              ) : (
                <Link
                  to={`/workspace/${primaryEnrollment.internship_id}`}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Locked until completion
                </Link>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="text-center py-8 glass-panel rounded-2xl p-6">
          <p className="text-slate-400 text-sm">You have not enrolled in any internship yet. Choose a program below to begin!</p>
        </div>
      )}

      {/* CERTIFICATE PREVIEW MODAL */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-gold-400" />
                Verified Certificate Preview
              </h3>
              <button
                onClick={() => setSelectedCert(null)}
                className="px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Close
              </button>
            </div>

            <CertificateCanvas certificate={selectedCert} showActions={true} />
          </div>
        </div>
      )}

      {/* ALL AVAILABLE INTERNSHIPS CATALOGUE */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold-400" />
          Explore Available Virtual Internship Cohorts
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {internships.map((intern) => {
            const isEnrolled = enrollments.some(e => e.internship_id === intern.id);
            return (
              <div 
                key={intern.id}
                className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-brand-500/50 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20">
                      {intern.domain}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {intern.duration}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                    {intern.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                    {intern.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    {intern.module_count || 4} Modules
                  </span>

                  {isEnrolled ? (
                    <Link
                      to={`/workspace/${intern.id}`}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1"
                    >
                      Classroom <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(intern.id)}
                      className="px-4 py-2 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand transition-all flex items-center gap-1"
                    >
                      Enroll Now <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
