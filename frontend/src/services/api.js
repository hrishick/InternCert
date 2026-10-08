const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function handleResponse(res, fallbackMessage = 'Request failed') {
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (err) {
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}: ${res.statusText || 'Backend API endpoint not found. Please ensure the backend server is running and configured.'}`);
    }
    throw new Error('Invalid JSON received from server.');
  }

  if (!res.ok) {
    throw new Error(data.error || data.message || fallbackMessage);
  }
  return data;
}

export const api = {
  // Auth endpoints
  async login(email, password, role) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });
    return handleResponse(res, 'Login failed');
  },

  async register(studentData) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    });
    return handleResponse(res, 'Registration failed');
  },

  async getMe(token) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return handleResponse(res, 'Session expired');
  },

  // Internships & Course Endpoints
  async getInternships() {
    const res = await fetch(`${API_BASE}/internships`);
    const data = await handleResponse(res, 'Failed to fetch internships');
    return data.internships || [];
  },

  async getInternship(id) {
    const res = await fetch(`${API_BASE}/internships/${id}`);
    const data = await handleResponse(res, 'Failed to fetch internship');
    return data.internship;
  },

  async enroll(internshipId, studentId) {
    const res = await fetch(`${API_BASE}/internships/${internshipId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId })
    });
    return handleResponse(res, 'Failed to enroll');
  },

  async getStudentDashboard(studentId) {
    const res = await fetch(`${API_BASE}/student/dashboard?studentId=${studentId}`);
    return handleResponse(res, 'Failed to fetch dashboard');
  },

  async completeModule(moduleId, studentId, internshipId) {
    const res = await fetch(`${API_BASE}/modules/${moduleId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, internshipId })
    });
    return handleResponse(res, 'Failed to update module');
  },

  async getQuiz(internshipId) {
    const res = await fetch(`${API_BASE}/internships/${internshipId}/quiz`);
    return handleResponse(res, 'Failed to load assessment');
  },

  async submitQuiz(internshipId, studentId, answers) {
    const res = await fetch(`${API_BASE}/quizzes/${internshipId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, answers })
    });
    return handleResponse(res, 'Failed to submit quiz');
  },

  // Verification & Certificates
  async verifyCertificate(certificateId) {
    const res = await fetch(`${API_BASE}/verify/${certificateId}`);
    return handleResponse(res, 'Certificate not found');
  },

  getDownloadUrl(certificateId) {
    return `${API_BASE}/certificates/${certificateId}/download`;
  },

  // Admin Endpoints
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`);
    return handleResponse(res, 'Failed to fetch admin stats');
  },

  async getCandidates(params = {}) {
    const qs = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/admin/candidates?${qs}`);
    return handleResponse(res, 'Failed to fetch candidates');
  },

  async createCandidate(candidateData) {
    const res = await fetch(`${API_BASE}/admin/candidates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData)
    });
    return handleResponse(res, 'Failed to create candidate');
  },

  async updateCandidate(id, candidateData) {
    const res = await fetch(`${API_BASE}/admin/candidates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(candidateData)
    });
    return handleResponse(res, 'Failed to update candidate');
  },

  async deleteCandidate(id) {
    const res = await fetch(`${API_BASE}/admin/candidates/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res, 'Failed to delete candidate');
  },

  async parseExcelFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/admin/candidates/parse-excel`, {
      method: 'POST',
      body: formData
    });
    return handleResponse(res, 'Failed to parse Excel file');
  },

  async importCandidates(rows) {
    const res = await fetch(`${API_BASE}/admin/candidates/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });
    return handleResponse(res, 'Failed to import candidate records');
  },

  async generateCertificates(candidateIds, templateId = 'classic-gold', sendEmail = true) {
    const res = await fetch(`${API_BASE}/admin/certificates/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateIds, templateId, sendEmail })
    });
    return handleResponse(res, 'Failed to generate certificates');
  },

  async getCertificates() {
    const res = await fetch(`${API_BASE}/admin/certificates`);
    const data = await handleResponse(res, 'Failed to fetch certificates');
    return data.certificates || [];
  },

  async getEmailLogs() {
    const res = await fetch(`${API_BASE}/admin/email-logs`);
    const data = await handleResponse(res, 'Failed to fetch email logs');
    return data.logs || [];
  },

  async getEmailStatus() {
    const res = await fetch(`${API_BASE}/admin/emails/status`);
    return handleResponse(res, 'Failed to fetch email status');
  },

  async sendTestEmail(targetEmail) {
    const res = await fetch(`${API_BASE}/admin/emails/test-send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail })
    });
    return handleResponse(res, 'Failed to send test email');
  },

  async retryEmail(logId) {
    const res = await fetch(`${API_BASE}/admin/emails/${logId}/retry`, {
      method: 'POST'
    });
    return handleResponse(res, 'Failed to retry email');
  },

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/admin/audit-logs`);
    const data = await handleResponse(res, 'Failed to fetch audit logs');
    return data.logs || [];
  },

  // SuperAdmin User & Role Management
  async getUsers() {
    const res = await fetch(`${API_BASE}/admin/users`);
    const data = await handleResponse(res, 'Failed to fetch registered users');
    return data.users || [];
  },

  async createUser(userData) {
    const res = await fetch(`${API_BASE}/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(res, 'Failed to create user account');
  },

  async updateUser(id, userData) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse(res, 'Failed to update user details');
  },

  async deleteUser(id) {
    const res = await fetch(`${API_BASE}/admin/users/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res, 'Failed to delete user account');
  },

  async deleteCertificate(id) {
    const res = await fetch(`${API_BASE}/admin/certificates/${id}`, {
      method: 'DELETE'
    });
    return handleResponse(res, 'Failed to delete certificate');
  },

  async clearAllCertificates() {
    const res = await fetch(`${API_BASE}/admin/database/clear-certificates`, {
      method: 'POST'
    });
    return handleResponse(res, 'Failed to clear certificates');
  },

  async resetDatabase() {
    const res = await fetch(`${API_BASE}/admin/database/reset`, {
      method: 'POST'
    });
    return handleResponse(res, 'Failed to reset database');
  },

  getDownloadAllZipUrl() {
    return `${API_BASE}/admin/certificates/download-all`;
  },

  async downloadAllZip() {
    const res = await fetch(`${API_BASE}/admin/certificates/download-all`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'No certificates found to download' }));
      throw new Error(err.error || 'Failed to download certificates ZIP');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'InternCert_All_Certificates.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async downloadBatchZip(candidateIds) {
    const res = await fetch(`${API_BASE}/admin/certificates/download-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateIds })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to package selected certificates' }));
      throw new Error(err.error || 'Failed to download selected certificates ZIP');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'InternCert_Selected_Certificates.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  },

  async exportCandidatesFile(format = 'xlsx') {
    const res = await fetch(`${API_BASE}/admin/export/candidates?format=${format}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to export candidates' }));
      throw new Error(err.error || 'Failed to export candidates');
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `candidates_export.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
};

export default api;
