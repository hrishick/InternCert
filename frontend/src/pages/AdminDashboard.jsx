import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Award, Users, Mail, CheckCircle2, AlertTriangle, 
  Upload, Download, RefreshCw, Search, Plus, Trash2, Edit2, ExternalLink, 
  Sparkles, FileCheck, Layers, Eye, ShieldCheck, Check, Clock, X, BarChart3,
  UserCheck, KeyRound, ShieldAlert, Lock, UserPlus, RotateCcw, Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CertificateCanvas from '../components/CertificateCanvas';

export default function AdminDashboard() {
  const { user, openAuth } = useAuth();
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState('candidates'); // 'candidates' | 'users' | 'import' | 'certificates' | 'emails' | 'audit'
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Selection
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDomain, setFilterDomain] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // Excel Import state
  const [uploadFile, setUploadFile] = useState(null);
  const [parsingExcel, setParsingExcel] = useState(false);
  const [validationReport, setValidationReport] = useState(null);
  const [importingCandidates, setImportingCandidates] = useState(false);

  // Certificate Generation Progress Modal
  const [generatingCerts, setGeneratingCerts] = useState(false);
  const [genProgress, setGenProgress] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('classic-gold');

  // Candidate Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [candidateFormData, setCandidateFormData] = useState({
    name: '',
    email: '',
    department: 'Computer Science and Engineering',
    yearOfStudy: '3rd Year',
    internshipDomain: 'Cybersecurity Virtual Internship',
    startDate: '01 June 2026',
    endDate: '30 June 2026'
  });

  // User Management Modals (SuperAdmin)
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [userModalMode, setUserModalMode] = useState('create'); // 'create' | 'edit'
  const [editingUserId, setEditingUserId] = useState(null);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    department: 'Computer Science and Engineering',
    yearOfStudy: '3rd Year'
  });

  // Certificate Preview Modal
  const [previewCert, setPreviewCert] = useState(null);

  // Email Status & Test state
  const [emailStatus, setEmailStatus] = useState(null);
  const [testEmailTarget, setTestEmailTarget] = useState('');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);

  const isSuperAdmin = user?.role === 'superadmin' || user?.role === 'admin';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    loadAllData();
  }, [searchTerm, filterDomain, filterStatus]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        api.getAdminStats(),
        api.getCandidates({ search: searchTerm, domain: filterDomain, status: filterStatus }),
        api.getCertificates(),
        api.getEmailLogs(),
        api.getAuditLogs(),
        isSuperAdmin ? api.getUsers() : Promise.resolve([])
      ]);

      if (results[0].status === 'fulfilled') setStats(results[0].value);
      if (results[1].status === 'fulfilled') setCandidates(results[1].value?.candidates || []);
      if (results[2].status === 'fulfilled') setCertificates(results[2].value || []);
      if (results[3].status === 'fulfilled') setEmailLogs(results[3].value || []);
      if (results[4].status === 'fulfilled') setAuditLogs(results[4].value || []);
      if (results[5].status === 'fulfilled') setUsersList(results[5].value || []);

      try {
        const emailStat = await api.getEmailStatus();
        setEmailStatus(emailStat);
      } catch (e) {
        console.error('Failed to load email status:', e);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 1. Handle Excel Upload & Parse
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadFile(file);
    setParsingExcel(true);
    setValidationReport(null);

    try {
      const report = await api.parseExcelFile(file);
      setValidationReport(report);
    } catch (err) {
      alert('Excel parsing error: ' + err.message);
    } finally {
      setParsingExcel(false);
    }
  };

  // 2. Commit Valid Rows to Database
  const handleImportValidRows = async () => {
    if (!validationReport?.rows) return;
    setImportingCandidates(true);
    try {
      const res = await api.importCandidates(validationReport.rows);
      alert(res.message);
      setValidationReport(null);
      setUploadFile(null);
      await loadAllData();
      setActiveTab('candidates');
    } catch (err) {
      alert('Import failed: ' + err.message);
    } finally {
      setImportingCandidates(false);
    }
  };

  // 3. Batch Certificate Generation
  const handleBatchGenerate = async (candidateIds = []) => {
    const targetIds = candidateIds.length > 0 ? candidateIds : selectedCandidateIds;
    setGeneratingCerts(true);
    setGenProgress({ status: 'Processing batch generation...', count: targetIds.length || 'All Pending' });

    try {
      const result = await api.generateCertificates(targetIds, selectedTemplate, true);
      setGenProgress({
        status: 'Completed',
        successful: result.successful,
        failed: result.failed,
        total: result.totalProcessed,
        results: result.results
      });
      await loadAllData();
      setSelectedCandidateIds([]);
    } catch (err) {
      alert('Certificate generation failed: ' + err.message);
      setGeneratingCerts(false);
    }
  };

  // 4. Retry Failed Email
  const handleRetryEmail = async (logId) => {
    try {
      const res = await api.retryEmail(logId);
      alert(res.message);
      await loadAllData();
    } catch (err) {
      alert('Email retry failed: ' + err.message);
    }
  };

  // 4b. Send Live Test Email
  const handleSendTestEmail = async (e) => {
    e.preventDefault();
    if (!testEmailTarget) {
      alert('Please enter a target recipient email address');
      return;
    }
    setSendingTestEmail(true);
    try {
      const res = await api.sendTestEmail(testEmailTarget);
      alert(res.live 
        ? `✅ LIVE EMAIL SENT!\n\nSuccessfully delivered test certificate with PDF attachment to ${testEmailTarget} via SMTP!\nPlease check your inbox and spam folder.`
        : `Simulated test email logged for ${testEmailTarget}.\n(To dispatch live emails directly to your Gmail/inbox, add SMTP_USER and SMTP_PASS in .env)`);
      setTestEmailTarget('');
      await loadAllData();
    } catch (err) {
      alert('Test email failed: ' + err.message);
    } finally {
      setSendingTestEmail(false);
    }
  };

  // 5. Add candidate manually
  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    try {
      await api.createCandidate(candidateFormData);
      setAddModalOpen(false);
      setCandidateFormData({
        name: '',
        email: '',
        department: 'Computer Science and Engineering',
        yearOfStudy: '3rd Year',
        internshipDomain: 'Cybersecurity Virtual Internship',
        startDate: '01 June 2026',
        endDate: '30 June 2026'
      });
      await loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  // 6. User Management Handlers (SuperAdmin)
  const openCreateUserModal = () => {
    setUserModalMode('create');
    setEditingUserId(null);
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      department: 'Computer Science and Engineering',
      yearOfStudy: '3rd Year'
    });
    setUserModalOpen(true);
  };

  const openEditUserModal = (u) => {
    setUserModalMode('edit');
    setEditingUserId(u.id);
    setUserFormData({
      name: u.name,
      email: u.email,
      password: '', // Blank unless resetting
      role: u.role,
      department: u.department || 'Computer Science and Engineering',
      yearOfStudy: u.year_of_study || '3rd Year'
    });
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    try {
      if (userModalMode === 'create') {
        if (!userFormData.password) {
          alert('Password is required for new user creation');
          return;
        }
        await api.createUser(userFormData);
        alert(`User ${userFormData.name} created successfully!`);
      } else {
        await api.updateUser(editingUserId, userFormData);
        alert(`User ${userFormData.name} details updated successfully!`);
      }
      setUserModalOpen(false);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.email === 'superadmin@a.com') {
      alert('Cannot delete the root SuperAdmin account');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user account "${u.name}" (${u.email})?`)) return;
    try {
      await api.deleteUser(u.id);
      await loadAllData();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (!window.confirm('Are you sure you want to delete this candidate record?')) return;
    try {
      await api.deleteCandidate(id);
      await loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCertificate = async (id, certNumber) => {
    if (!window.confirm(`Are you sure you want to delete certificate ${certNumber || id}? The file will be removed from disk storage and the candidate status will revert to pending.`)) return;
    try {
      const res = await api.deleteCertificate(id);
      await loadAllData();
      alert(res.message || 'Certificate deleted successfully.');
    } catch (err) {
      alert(err.message || 'Failed to delete certificate');
    }
  };

  const handleClearAllCertificates = async () => {
    if (!window.confirm('⚠️ WARNING: Are you sure you want to PURGE ALL issued certificates and DELETE all generated PDF files from disk storage? Candidate records will be reset to pending.')) return;
    try {
      const res = await api.clearAllCertificates();
      await loadAllData();
      alert(res.message || 'All certificates and storage files purged.');
    } catch (err) {
      alert(err.message || 'Failed to purge certificates');
    }
  };

  const handleResetDatabase = async () => {
    if (!window.confirm('⚠️ FACTORY RESET: Are you sure you want to reset the database and file storage back to clean initial demo state?')) return;
    try {
      const res = await api.resetDatabase();
      await loadAllData();
      alert(res.message || 'Database reset successfully.');
    } catch (err) {
      alert(err.message || 'Failed to reset database');
    }
  };

  const handleDownloadAllZip = async () => {
    setDownloadingZip(true);
    try {
      await api.downloadAllZip();
    } catch (err) {
      alert(err.message || 'Failed to download certificates ZIP archive.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleDownloadSelectedZip = async () => {
    if (!selectedCandidateIds.length) {
      alert('Please select at least one candidate from the table below.');
      return;
    }
    setDownloadingZip(true);
    try {
      await api.downloadBatchZip(selectedCandidateIds);
    } catch (err) {
      alert(err.message || 'Failed to download selected certificates ZIP archive.');
    } finally {
      setDownloadingZip(false);
    }
  };

  const handleExportCandidates = async (format = 'xlsx') => {
    try {
      await api.exportCandidatesFile(format);
    } catch (err) {
      alert(err.message || 'Failed to export candidate records.');
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedCandidateIds(candidates.map(c => c.id));
    } else {
      setSelectedCandidateIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedCandidateIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (!user || !['superadmin', 'admin', 'teacher'].includes(user.role)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="glass-panel p-10 rounded-2xl border border-slate-800 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Administrative Access Required</h2>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Please sign in with a SuperAdmin, Administrator, or Faculty account to access this console.
          </p>
          <button
            onClick={() => openAuth('login')}
            className="px-6 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-glow-brand"
          >
            Sign In with Staff Account
          </button>
        </div>
      </div>
    );
  }

  const metrics = stats?.metrics || {
    totalCandidates: candidates.length,
    totalInternships: 3,
    completedInternships: candidates.filter(c => c.status === 'certified').length,
    totalCertificates: certificates.length,
    emailsSent: emailLogs.filter(e => e.status === 'sent').length,
    failedEmails: emailLogs.filter(e => e.status === 'failed').length,
    deliveryRate: 98
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono uppercase ${
              user.role === 'superadmin' ? 'bg-amber-500/20 text-gold-300 border border-amber-500/30' :
              user.role === 'teacher' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
            }`}>
              {user.role === 'superadmin' ? 'SuperAdmin Control Console' : (user.role === 'teacher' ? 'Faculty Instructor Console' : 'Admin Control Center')}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Logged in: {user.email}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Automated Certificate & Candidate Management
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('import')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow-brand flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            Bulk Import Excel
          </button>

          <button
            onClick={handleDownloadAllZip}
            disabled={downloadingZip}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Download className={`w-4 h-4 text-gold-400 ${downloadingZip ? 'animate-bounce' : ''}`} />
            {downloadingZip ? 'Packaging ZIP...' : 'Download All ZIP'}
          </button>

          <button
            onClick={() => handleExportCandidates('xlsx')}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Export Candidates
          </button>

          <button
            onClick={loadAllData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* METRIC STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Total Candidates', value: metrics.totalCandidates, icon: Users, color: 'text-brand-400', bg: 'bg-brand-500/10' },
          { label: 'Active Cohorts', value: metrics.totalInternships, icon: Layers, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
          { label: 'Completed', value: metrics.completedInternships, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Certs Generated', value: metrics.totalCertificates, icon: Award, color: 'text-gold-400', bg: 'bg-amber-500/10' },
          { label: 'Emails Sent', value: metrics.emailsSent, icon: Mail, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Failed Deliveries', value: metrics.failedEmails, icon: AlertTriangle, color: metrics.failedEmails > 0 ? 'text-rose-400' : 'text-slate-400', bg: 'bg-rose-500/10' }
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400 truncate">{item.label}</span>
                <div className={`p-1.5 rounded-lg ${item.bg}`}>
                  <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                </div>
              </div>
              <div className="text-xl font-extrabold text-white font-mono">{item.value}</div>
            </div>
          );
        })}
      </div>

      {/* TAB NAVIGATION */}
      <div className="flex border-b border-slate-800 space-x-1 sm:space-x-4 overflow-x-auto">
        {[
          { id: 'candidates', label: 'Candidate Registry', icon: Users, badge: candidates.length },
          { id: 'users', label: 'User & Role Management', icon: UserCheck, badge: usersList.length > 0 ? usersList.length : null, superAdminOnly: true },
          { id: 'import', label: 'Bulk Excel Import Wizard', icon: FileSpreadsheet, highlight: true },
          { id: 'certificates', label: 'Issued Certificates', icon: Award, badge: certificates.length },
          { id: 'emails', label: 'Email Dispatcher Logs', icon: Mail, badge: emailLogs.filter(e => e.status === 'failed').length > 0 ? `${emailLogs.filter(e => e.status === 'failed').length} Failed` : null },
          { id: 'audit', label: 'Audit Trail', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-3 sm:px-4 text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                isActive 
                  ? 'border-brand-500 text-white font-bold' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : ''}`} />
              <span>{tab.label}</span>
              {tab.superAdminOnly && !isSuperAdmin && (
                <Lock className="w-3 h-3 text-slate-500" />
              )}
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  tab.badge.toString().includes('Failed') ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB: USERS & ROLE MANAGEMENT (SUPERADMIN) */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {!isSuperAdmin ? (
            <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">SuperAdmin Authorization Required</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Your role (<strong>{user.role}</strong>) grants access to candidate records and student lists, but modifying database user credentials and assigning roles requires SuperAdmin privileges.
              </p>
            </div>
          ) : (
            <>
              {/* Controls Strip */}
              <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-gold-400" />
                    Registered Database Users & Role Assignments
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    SuperAdmin can update login credentials, reset passwords, and assign roles (SuperAdmin, Admin, Teacher, Student).
                  </p>
                </div>

                <button
                  onClick={openCreateUserModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow-brand flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  Create New User
                </button>
              </div>

              {/* Users Table */}
              <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
                      <tr>
                        <th className="p-3.5">User Name</th>
                        <th className="p-3.5">Login Email</th>
                        <th className="p-3.5">Assigned Role</th>
                        <th className="p-3.5">Department / Year</th>
                        <th className="p-3.5">Certificates</th>
                        <th className="p-3.5">Registered Date</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {usersList.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 font-bold text-white flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono text-brand-300">
                              {u.name.charAt(0)}
                            </div>
                            <span>{u.name}</span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-400">{u.email}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                              u.role === 'superadmin' ? 'bg-amber-500/20 text-gold-300 border border-amber-500/30' :
                              u.role === 'teacher' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                              u.role === 'admin' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                              'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3.5 text-slate-300">
                            {u.department ? `${u.department} (${u.year_of_study || 'N/A'})` : <span className="text-slate-500 italic">Staff Account</span>}
                          </td>
                          <td className="p-3.5 font-mono text-brand-300 font-semibold">
                            {u.certificate_count || 0}
                          </td>
                          <td className="p-3.5 font-mono text-slate-400 text-[11px]">{u.created_at}</td>
                          <td className="p-3.5 text-right space-x-1.5">
                            <button
                              onClick={() => openEditUserModal(u)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold inline-flex items-center gap-1"
                              title="Update Login & Role"
                            >
                              <Edit2 className="w-3 h-3" /> Edit
                            </button>
                            {u.email !== 'superadmin@a.com' && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                                title="Delete user"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SuperAdmin Database & Storage Operations Panel */}
              <div className="glass-panel p-5 rounded-xl border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-900 space-y-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-400" />
                      SuperAdmin Database & File Storage Controls
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Administrative purge controls to delete generated certificate PDF files from disk or reset database to clean factory demo state.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleClearAllCertificates}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all"
                      title="Delete all issued certificates and PDF files from disk"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                      Purge Issued Certificates & Files
                    </button>

                    <button
                      onClick={handleResetDatabase}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-all"
                      title="Factory reset entire database and clear all storage files"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                      Factory Reset Database
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: CANDIDATES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          
          {/* Controls Strip */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search name, email, department..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending Certification</option>
                <option value="certified">Certified</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedCandidateIds.length > 0 && (
                <button
                  onClick={handleDownloadSelectedZip}
                  disabled={downloadingZip}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-glow-gold"
                  title="Download certificates of selected candidates as ZIP"
                >
                  <Download className={`w-3.5 h-3.5 ${downloadingZip ? 'animate-bounce' : ''}`} />
                  Download Selected ZIP ({selectedCandidateIds.length})
                </button>
              )}

              <button
                onClick={() => setAddModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Candidate
              </button>

              <button
                onClick={() => handleBatchGenerate(selectedCandidateIds)}
                disabled={generatingCerts}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-glow-brand flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-300" />
                Generate Certificates {selectedCandidateIds.length > 0 ? `(${selectedCandidateIds.length})` : '(All Pending)'}
              </button>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3.5 w-10 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedCandidateIds.length === candidates.length && candidates.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-slate-700 text-brand-600 focus:ring-0"
                      />
                    </th>
                    <th className="p-3.5">Candidate Name</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Internship Domain</th>
                    <th className="p-3.5">Dates</th>
                    <th className="p-3.5">Certificate</th>
                    <th className="p-3.5">Email Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {candidates.map((cand) => {
                    const isSelected = selectedCandidateIds.includes(cand.id);
                    const isCertified = cand.status === 'certified' || !!cand.certificate_id;

                    return (
                      <tr key={cand.id} className={`hover:bg-slate-800/40 transition-colors ${isSelected ? 'bg-brand-900/10' : ''}`}>
                        <td className="p-3.5 text-center">
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(cand.id)}
                            className="rounded border-slate-700 text-brand-600 focus:ring-0"
                          />
                        </td>
                        <td className="p-3.5 font-bold text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-mono text-brand-300">
                            {cand.name.charAt(0)}
                          </div>
                          <span>{cand.name}</span>
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">{cand.email}</td>
                        <td className="p-3.5 text-slate-300">
                          {cand.department} <span className="text-[10px] text-slate-500">({cand.year_of_study})</span>
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700 font-mono">
                            {cand.internship_domain}
                          </span>
                        </td>
                        <td className="p-3.5 text-[11px] text-slate-400 font-mono">
                          {cand.start_date} – {cand.end_date}
                        </td>
                        <td className="p-3.5">
                          {isCertified && (cand.certificate_id || cand.cert_db_id) ? (
                            <button
                              onClick={() => setPreviewCert({
                                certificate_id: cand.certificate_id || cand.cert_db_id,
                                recipient_name: cand.name,
                                department: cand.department,
                                year_of_study: cand.year_of_study,
                                internship_domain: cand.internship_domain,
                                start_date: cand.start_date,
                                end_date: cand.end_date,
                                duration: '4 Weeks'
                              })}
                              className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1 hover:bg-emerald-500/20"
                            >
                              <Award className="w-3 h-3" />
                              {cand.certificate_id || 'CERTIFIED'}
                            </button>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="p-3.5">
                          {cand.email_status === 'sent' ? (
                            <span className="text-emerald-400 flex items-center gap-1 font-mono text-[10px]">
                              <Check className="w-3 h-3" /> Delivered
                            </span>
                          ) : cand.email_status === 'failed' ? (
                            <span className="text-rose-400 flex items-center gap-1 font-mono text-[10px]">
                              <AlertTriangle className="w-3 h-3" /> Failed
                            </span>
                          ) : (
                            <span className="text-slate-500 font-mono text-[10px]">Queued</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          {!isCertified ? (
                            <button
                              onClick={() => handleBatchGenerate([cand.id])}
                              className="px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-semibold"
                            >
                              Generate
                            </button>
                          ) : (
                            <a
                              href={api.getDownloadUrl(cand.certificate_id || cand.cert_db_id || cand.id)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-semibold inline-flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" /> PDF
                            </a>
                          )}
                          <button
                            onClick={() => handleDeleteCandidate(cand.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                            title="Delete candidate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BULK EXCEL IMPORT WIZARD */}
      {/* ========================================================================= */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  Excel Bulk Ingestion
                </span>
                <h2 className="text-xl font-bold text-white mt-1">
                  Upload Candidate Dataset (.xlsx, .xls, .csv)
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  The system automatically reads headers, normalizes column names, validates emails and dates, and detects duplicates.
                </p>
              </div>

              {/* Sample Excel Download Button */}
              <a
                href={api.getSampleExcelUrl()}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Download Sample Excel Template
              </a>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
              }}
              className="border-2 border-dashed border-slate-700 hover:border-brand-500/60 rounded-2xl p-8 text-center bg-slate-950/40 transition-all cursor-pointer group"
              onClick={() => document.getElementById('excel-file-input').click()}
            >
              <input
                id="excel-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                }}
              />

              <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-400 mb-4 group-hover:scale-105 transition-transform">
                <FileSpreadsheet className="w-8 h-8" />
              </div>

              <h3 className="text-sm font-bold text-white mb-1">
                {uploadFile ? uploadFile.name : 'Click or drag & drop Excel/CSV file here'}
              </h3>
              <p className="text-xs text-slate-400">
                Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv) up to 10MB
              </p>

              {parsingExcel && (
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-brand-400 font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Parsing spreadsheet and running validation engine...
                </div>
              )}
            </div>

            {/* VALIDATION PREVIEW REPORT */}
            {validationReport && (
              <div className="space-y-6 pt-4 border-t border-slate-800">
                
                {/* Metric Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-xs text-slate-400">Total Rows Found</div>
                    <div className="text-xl font-bold text-white font-mono">{validationReport.totalRows}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                    <div className="text-xs text-emerald-400">Valid Rows</div>
                    <div className="text-xl font-bold text-emerald-300 font-mono">{validationReport.validRows}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
                    <div className="text-xs text-rose-400">Invalid Rows</div>
                    <div className="text-xl font-bold text-rose-300 font-mono">{validationReport.invalidRows}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                    <div className="text-xs text-amber-400">Duplicate Rows</div>
                    <div className="text-xl font-bold text-amber-300 font-mono">{validationReport.duplicateRows}</div>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">
                      Live Parsed Data Preview & Error Diagnostics
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {validationReport.validRows} of {validationReport.totalRows} ready to import
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/60 text-slate-400 font-mono sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="p-3 w-12 text-center">Row</th>
                          <th className="p-3">Candidate Name</th>
                          <th className="p-3">Email Address</th>
                          <th className="p-3">Department</th>
                          <th className="p-3">Internship Domain</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-300">
                        {validationReport.rows?.map((r) => (
                          <tr key={r.rowIndex} className={r.isValid ? 'hover:bg-slate-900/50' : 'bg-rose-950/15'}>
                            <td className="p-3 text-center font-mono text-slate-500">{r.rowIndex}</td>
                            <td className="p-3 font-semibold text-white">{r.name || <span className="text-rose-400 italic">Missing</span>}</td>
                            <td className="p-3 font-mono text-slate-400">{r.email || <span className="text-rose-400 italic">Missing</span>}</td>
                            <td className="p-3">{r.department || <span className="text-rose-400 italic">Missing</span>}</td>
                            <td className="p-3">{r.internshipDomain || <span className="text-rose-400 italic">Missing</span>}</td>
                            <td className="p-3">
                              {r.isValid ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                                  ✓ Valid
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono">
                                    ✗ Errors
                                  </span>
                                  <div className="text-[10px] text-rose-400">{r.errors.join(', ')}</div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Import Action Bar */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setValidationReport(null);
                      setUploadFile(null);
                    }}
                    className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel & Upload Another File
                  </button>

                  <button
                    onClick={handleImportValidRows}
                    disabled={importingCandidates || validationReport.validRows === 0}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-brand-600 hover:from-emerald-500 hover:to-brand-500 text-white shadow-glow-brand flex items-center gap-2"
                  >
                    {importingCandidates ? 'Importing Candidate Records...' : `Import ${validationReport.validRows} Valid Candidates`}
                    <Check className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ISSUED CERTIFICATES */}
      {/* ========================================================================= */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-gold-400" />
                Verifiable Issued Certificates Registry
              </h2>
              <p className="text-[11px] text-slate-400">
                All generated PDF certificates stored on disk with cryptographic seals and QR verifiability.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isSuperAdmin && certificates.length > 0 && (
                <button
                  onClick={handleClearAllCertificates}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5 transition-all"
                  title="Purge all certificates from database and delete PDF files from disk storage"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Purge All Certificates & Files
                </button>
              )}

              <button
                onClick={handleDownloadAllZip}
                disabled={downloadingZip}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${downloadingZip ? 'animate-bounce' : ''}`} />
                {downloadingZip ? 'Packaging All ZIP...' : 'Download All as ZIP'}
              </button>
            </div>
          </div>

          {certificates.length === 0 ? (
            <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center space-y-3">
              <Award className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">No Certificates Issued Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Certificates appear here automatically when candidates complete their virtual internship assessment or when batch generated via Excel.
              </p>
              <button
                onClick={() => setActiveTab('candidates')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white"
              >
                View Pending Candidates
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {certificates.map((cert) => (
                <div 
                  key={cert.id}
                  className="glass-panel p-5 rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-gold-400 border border-amber-500/30">
                        {cert.certificate_id}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono">
                        ✓ {cert.status.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">
                      {cert.recipient_name}
                    </h3>

                    <p className="text-xs text-brand-300 font-medium">
                      {cert.internship_domain}
                    </p>

                    <p className="text-[11px] text-slate-400">
                      {cert.department} • {cert.start_date} – {cert.end_date}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setPreviewCert(cert)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-gold-400" />
                        Preview
                      </button>

                      <a
                        href={api.getDownloadUrl(cert.certificate_id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    </div>

                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteCertificate(cert.id, cert.certificate_id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                        title="Delete certificate record and remove PDF file from disk"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EMAIL DISPATCHER LOGS */}
      {/* ========================================================================= */}
      {activeTab === 'emails' && (
        <div className="space-y-4">
          
          {/* SMTP Configuration & Test Strip */}
          <div className="glass-panel p-5 rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-emerald-400" />
                    Email Dispatcher & SMTP Server
                  </h3>
                  {emailStatus?.configured ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Live SMTP Active ({emailStatus.smtpHost})
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                      Simulator Mode (Configure .env for Live SMTP)
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Automated delivery of high-resolution PDF certificates with QR verification links directly to student inboxes.
                </p>
              </div>

              {/* Quick Test Email Form */}
              <form onSubmit={handleSendTestEmail} className="flex items-center gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter email to test (e.g. your_email@gmail.com)"
                  value={testEmailTarget}
                  onChange={(e) => setTestEmailTarget(e.target.value)}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-brand-500 min-w-[240px]"
                />
                <button
                  type="submit"
                  disabled={sendingTestEmail}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
                >
                  <Mail className={`w-3.5 h-3.5 ${sendingTestEmail ? 'animate-spin' : ''}`} />
                  {sendingTestEmail ? 'Sending...' : 'Send Test Certificate'}
                </button>
              </form>
            </div>
          </div>

          <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Real-time Delivery & Retry Logs
                </h4>
                <p className="text-[10px] text-slate-400">
                  Track delivery timestamps, recipient inboxes, and retry failed transmissions with 1 click.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Recipient</th>
                    <th className="p-3.5">Certificate ID</th>
                    <th className="p-3.5">Subject</th>
                    <th className="p-3.5">Delivery Status</th>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {emailLogs.map((log) => {
                    const isSent = log.status === 'sent';

                    return (
                      <tr key={log.id} className="hover:bg-slate-800/40">
                        <td className="p-3.5">
                          <div className="font-semibold text-white">{log.recipient_name || log.recipient_email}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.recipient_email}</div>
                        </td>
                        <td className="p-3.5 font-mono text-brand-300">{log.certificate_id}</td>
                        <td className="p-3.5 text-slate-300 truncate max-w-xs">{log.subject}</td>
                        <td className="p-3.5">
                          {isSent ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono">
                              ✓ Sent
                            </span>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-mono">
                                ✗ Failed
                              </span>
                              <div className="text-[10px] text-rose-400 max-w-xs">{log.error_message}</div>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400 text-[11px]">{log.sent_at}</td>
                        <td className="p-3.5 text-right">
                          {!isSent && (
                            <button
                              onClick={() => handleRetryEmail(log.id)}
                              className="px-3 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white text-[10px] font-semibold flex items-center gap-1 ml-auto"
                            >
                              <RefreshCw className="w-3 h-3" /> Retry Email
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: AUDIT TRAIL */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            System Audit Trail & Cryptographic Security Log
          </h3>

          <div className="space-y-3">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start justify-between gap-4 text-xs font-mono">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-brand-400 font-bold uppercase">{log.action}</span>
                    <span className="text-[10px] text-slate-500">{log.created_at}</span>
                  </div>
                  <div className="text-slate-300 font-sans">{log.details}</div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {log.ip_address || '192.168.1.50'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: SUPERADMIN CREATE / EDIT USER */}
      {/* ========================================================================= */}
      {userModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gold-400" />
                {userModalMode === 'create' ? 'Create New User Account' : 'Edit User Credentials & Role'}
              </h3>
              <button onClick={() => setUserModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  placeholder="e.g. Alex Rivera"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  placeholder="email@a.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {userModalMode === 'create' ? 'Password' : 'New Password (leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  placeholder={userModalMode === 'create' ? '••••••••' : 'Enter new password to reset'}
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Role</label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                >
                  <option value="superadmin">SuperAdmin (Full Root Control)</option>
                  <option value="admin">Administrator</option>
                  <option value="teacher">Teacher / Faculty (Candidates & Certs Access Only)</option>
                  <option value="student">Student (Portal & Virtual Internships)</option>
                </select>
              </div>

              {userFormData.role === 'student' && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                    <input
                      type="text"
                      value={userFormData.department}
                      onChange={(e) => setUserFormData({ ...userFormData, department: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Year of Study</label>
                    <select
                      value={userFormData.yearOfStudy}
                      onChange={(e) => setUserFormData({ ...userFormData, yearOfStudy: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-glow-brand"
              >
                {userModalMode === 'create' ? 'Create User Account' : 'Save User Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD CANDIDATE MANUALLY */}
      {/* ========================================================================= */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" />
                Add Candidate Manually
              </h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCandidate} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-[11px] text-indigo-200 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  💡 <strong>Bi-directional Sync:</strong> Creating this candidate will automatically provision their student login credentials (Password: <code className="font-mono text-white bg-slate-900 px-1 py-0.5 rounded">password123</code>).
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Candidate Name</label>
                <input
                  type="text"
                  required
                  value={candidateFormData.name}
                  onChange={(e) => setCandidateFormData({ ...candidateFormData, name: e.target.value })}
                  placeholder="e.g. Vikramaditya Roy"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={candidateFormData.email}
                  onChange={(e) => setCandidateFormData({ ...candidateFormData, email: e.target.value })}
                  placeholder="name@college.edu"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    required
                    value={candidateFormData.department}
                    onChange={(e) => setCandidateFormData({ ...candidateFormData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Year of Study</label>
                  <input
                    type="text"
                    required
                    value={candidateFormData.yearOfStudy}
                    onChange={(e) => setCandidateFormData({ ...candidateFormData, yearOfStudy: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Internship Domain</label>
                <select
                  value={candidateFormData.internshipDomain}
                  onChange={(e) => setCandidateFormData({ ...candidateFormData, internshipDomain: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                >
                  <option value="Cybersecurity Virtual Internship">Cybersecurity Virtual Internship</option>
                  <option value="Full-Stack Web Engineering Virtual Internship">Full-Stack Web Engineering Virtual Internship</option>
                  <option value="Applied AI & Machine Learning Internship">Applied AI & Machine Learning Internship</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Start Date</label>
                  <input
                    type="text"
                    value={candidateFormData.startDate}
                    onChange={(e) => setCandidateFormData({ ...candidateFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">End Date</label>
                  <input
                    type="text"
                    value={candidateFormData.endDate}
                    onChange={(e) => setCandidateFormData({ ...candidateFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand"
              >
                Save Candidate Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: BATCH GENERATION PROGRESS */}
      {/* ========================================================================= */}
      {generatingCerts && genProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Batch Certificate Generator</h3>
                <p className="text-xs text-slate-400">Processing vector PDF creation & email dispatch</p>
              </div>
            </div>

            {genProgress.status !== 'Completed' ? (
              <div className="space-y-3 py-4 text-center">
                <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-mono text-slate-300">{genProgress.status}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between">
                  <div className="text-xs text-emerald-300 font-semibold">
                    ✓ {genProgress.successful} Certificates Generated Successfully
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-400">100% DONE</span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5">
                  {genProgress.results?.map((res, i) => (
                    <div key={i} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono flex items-center justify-between">
                      <span className="text-slate-200">{res.candidateName}</span>
                      <span className="text-brand-400">{res.certificateId}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <a
                    href={api.getDownloadAllZipUrl()}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand flex items-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Download All Certificates ZIP
                  </a>

                  <button
                    onClick={() => {
                      setGeneratingCerts(false);
                      setGenProgress(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CERTIFICATE PREVIEW */}
      {/* ========================================================================= */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-gold-400" />
                Certificate Preview ({previewCert.certificate_id})
              </h3>
              <button
                onClick={() => setPreviewCert(null)}
                className="px-3 py-1 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Close
              </button>
            </div>

            <CertificateCanvas certificate={previewCert} showActions={true} />
          </div>
        </div>
      )}

    </div>
  );
}
