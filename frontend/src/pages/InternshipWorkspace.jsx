import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  BookOpen, CheckCircle2, Award, PlayCircle, HelpCircle, ArrowLeft, 
  ArrowRight, ShieldCheck, Download, Sparkles, RefreshCw, FileText, Check, AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CertificateCanvas from '../components/CertificateCanvas';

export default function InternshipWorkspace() {
  const { id: internshipId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [internship, setInternship] = useState(null);
  const [activeTab, setActiveTab] = useState(0); // 0-3 for modules, 4 for Final Assessment
  const [completedModules, setCompletedModules] = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [loading, setLoading] = useState(true);
  const [awardedCert, setAwardedCert] = useState(null);

  useEffect(() => {
    loadWorkspace();
  }, [internshipId, user]);

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const data = await api.getInternship(internshipId);
      setInternship(data);

      const quizData = await api.getQuiz(internshipId);
      setQuizQuestions(quizData.questions || []);

      if (user && user.role === 'student') {
        const studentId = user.studentId || 'std_01';
        const dashboard = await api.getStudentDashboard(studentId);
        const enrollment = dashboard.enrollments.find(e => e.internship_id === internshipId);
        
        if (enrollment) {
          const completedIds = enrollment.modules.filter(m => m.isCompleted).map(m => m.id);
          setCompletedModules(completedIds);
          if (enrollment.quizResult) {
            setQuizResult(enrollment.quizResult);
          }
          if (enrollment.certificate) {
            setAwardedCert(enrollment.certificate);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load workspace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteModule = async (moduleId) => {
    if (!user) return;
    try {
      const studentId = user.studentId || 'std_01';
      await api.completeModule(moduleId, studentId, internshipId);
      setCompletedModules(prev => [...new Set([...prev, moduleId])]);

      // Move to next module or assessment
      if (activeTab < (internship.modules?.length || 4) - 1) {
        setActiveTab(prev => prev + 1);
      } else {
        setActiveTab(internship.modules?.length || 4); // Go to final quiz
      }
    } catch (err) {
      alert('Failed to mark module complete: ' + err.message);
    }
  };

  const handleAnswerSelect = (qId, optionIdx) => {
    setQuizAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleSubmitQuiz = async () => {
    if (Object.keys(quizAnswers).length < quizQuestions.length) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }

    setSubmittingQuiz(true);
    try {
      const studentId = user.studentId || 'std_01';
      const result = await api.submitQuiz(internshipId, studentId, quizAnswers);
      setQuizResult(result);

      if (result.passed) {
        // Trigger celebratory confetti safely
        try {
          if (typeof confetti === 'function') {
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 }
            });
          }
        } catch (confettiErr) {
          console.warn('Confetti animation skipped:', confettiErr);
        }

        if (result.certificate) {
          setAwardedCert(result.certificate);
        }
      }
    } catch (err) {
      alert('Failed to submit quiz: ' + err.message);
    } finally {
      setSubmittingQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">Loading virtual classroom workspace...</p>
      </div>
    );
  }

  if (!internship) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-slate-400">Internship curriculum not found.</p>
        <Link to="/student" className="text-brand-400 underline mt-4 inline-block">Return to Student Portal</Link>
      </div>
    );
  }

  const modules = internship.modules || [];
  const isAssessmentTab = activeTab >= modules.length;
  const currentModule = modules[activeTab];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/student"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
                {internship.domain}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {internship.duration} Track
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
              {internship.title}
            </h1>
          </div>
        </div>

        {/* Progress pill */}
        <div className="flex items-center gap-2 text-xs font-mono bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
          <span className="text-slate-400">Track Progress:</span>
          <span className="text-brand-400 font-bold">
            {Math.round((completedModules.length / modules.length) * 80) + (awardedCert ? 20 : 0)}%
          </span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Modules & Assessment Navigation */}
        <div className="lg:col-span-1 space-y-3">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 px-2">
              Curriculum Modules
            </h3>

            {modules.map((mod, idx) => {
              const isDone = completedModules.includes(mod.id);
              const isCurrent = activeTab === idx;

              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveTab(idx)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                    isCurrent 
                      ? 'bg-brand-600/20 border border-brand-500/40 text-white font-semibold' 
                      : 'bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center font-mono text-[10px] ${
                      isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="truncate">{mod.title.replace(/^Module \d+:\s*/, '')}</span>
                  </div>

                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <PlayCircle className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
              );
            })}

            {/* Final Assessment Tab */}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveTab(modules.length)}
                className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between gap-2 ${
                  isAssessmentTab 
                    ? 'bg-amber-500/20 border border-amber-500/40 text-gold-300 font-semibold shadow-glow-gold' 
                    : 'bg-slate-900/80 hover:bg-slate-800/90 text-gold-400/90 border border-amber-500/20'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-gold-400 shrink-0" />
                  <div>
                    <div className="font-bold">Final Assessment</div>
                    <div className="text-[10px] text-slate-400 font-mono">10 Questions (70% to Pass)</div>
                  </div>
                </div>

                {awardedCert ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Sparkles className="w-4 h-4 text-gold-400 shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Content Area: Module View or Assessment Form */}
        <div className="lg:col-span-3">
          
          {!isAssessmentTab && currentModule && (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
              
              {/* Module Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono text-brand-400 font-semibold">
                    Module {activeTab + 1} of {modules.length}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                    {currentModule.title}
                  </h2>
                </div>

                <button
                  onClick={() => handleCompleteModule(currentModule.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                    completedModules.includes(currentModule.id)
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow-brand'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {completedModules.includes(currentModule.id) ? 'Completed (Click to Retake)' : 'Mark Module Completed'}
                </button>
              </div>

              {/* Video Player Embed Area */}
              {currentModule.video_url && (
                <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
                  <iframe
                    src={currentModule.video_url}
                    title={currentModule.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
              )}

              {/* Module Description & Content */}
              <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Module Overview & Objectives
                  </h4>
                  <p className="text-xs text-slate-300">{currentModule.description}</p>
                </div>

                <div className="p-6 rounded-xl bg-slate-950/80 border border-slate-800/80 font-mono text-xs whitespace-pre-line text-slate-200 leading-normal">
                  {currentModule.content}
                </div>
              </div>

              {/* Next Navigation Footer */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <button
                  disabled={activeTab === 0}
                  onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                >
                  ← Previous Module
                </button>

                <button
                  onClick={() => handleCompleteModule(currentModule.id)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-2 shadow-glow-brand"
                >
                  Mark Complete & Continue →
                </button>
              </div>
            </div>
          )}

          {/* FINAL ASSESSMENT MODE */}
          {isAssessmentTab && (
            <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-8">
              
              {/* Assessment Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-gold-300 font-bold">
                      Graded Evaluation
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Passing Criteria: 70% (7/10 Correct)
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mt-1">
                    Comprehensive Final Assessment
                  </h2>
                </div>

                {quizResult && (
                  <div className={`px-4 py-2 rounded-xl border font-mono text-xs font-bold flex items-center gap-2 ${
                    quizResult.passed 
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300' 
                      : 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                  }`}>
                    {quizResult.passed ? <Check className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    Score: {quizResult.score}% ({quizResult.passed ? 'PASSED' : 'RETRY REQUIRED'})
                  </div>
                )}
              </div>

              {/* CELEBRATION CERTIFICATE BOX UPON PASSING */}
              {awardedCert && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/30 via-slate-900 to-emerald-950/30 border-2 border-amber-500/50 shadow-glow-gold space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-gold-400 font-bold text-sm">
                        <Sparkles className="w-5 h-5" />
                        Official Certificate Issued
                      </div>
                      <h3 className="text-xl font-extrabold text-white">
                        Congratulations, {user?.name}!
                      </h3>
                      <p className="text-xs text-slate-300">
                        You have successfully completed the <strong>{internship.title}</strong>. Your credential is verified and logged.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={api.getDownloadUrl(awardedCert.certificate_id)}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-glow-gold flex items-center gap-2 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF
                      </a>
                      <Link
                        to={`/verify/${awardedCert.certificate_id}`}
                        target="_blank"
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4 text-gold-400" />
                        Verify
                      </Link>
                    </div>
                  </div>

                  {/* Certificate Canvas Render */}
                  <div className="pt-2">
                    <CertificateCanvas certificate={awardedCert} showActions={false} />
                  </div>
                </div>
              )}

              {/* 10 Graded Questions */}
              <div className="space-y-6">
                {quizQuestions.map((q, qIndex) => {
                  const selectedOpt = quizAnswers[q.id];

                  return (
                    <div key={q.id} className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-sm text-white">
                          <span className="text-brand-400 font-mono mr-2">Q{qIndex + 1}.</span>
                          {q.question}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {q.options?.map((opt, optIdx) => {
                          const isSelected = selectedOpt === optIdx;

                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleAnswerSelect(q.id, optIdx)}
                              className={`p-3 rounded-lg text-left text-xs border transition-all flex items-center gap-2.5 ${
                                isSelected 
                                  ? 'bg-brand-600/20 border-brand-500 text-brand-200 font-medium' 
                                  : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] ${
                                isSelected ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-600 text-slate-500'
                              }`}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">
                  {Object.keys(quizAnswers).length} of {quizQuestions.length} Questions Answered
                </span>

                <button
                  onClick={handleSubmitQuiz}
                  disabled={submittingQuiz}
                  className="px-6 py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-emerald-600 to-brand-600 hover:from-emerald-500 hover:to-brand-500 text-white shadow-glow-brand transition-all flex items-center gap-2"
                >
                  {submittingQuiz ? 'Grading Assessment & Generating Certificate...' : 'Submit Final Assessment'}
                  <Sparkles className="w-4 h-4 text-gold-300" />
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
