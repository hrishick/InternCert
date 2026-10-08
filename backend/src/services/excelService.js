import * as XLSX from 'xlsx';
import db from '../database/db.js';

// Helper to normalize header keys
function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Map column names flexibly
function mapRowKeys(row) {
  const mapped = {
    name: '',
    email: '',
    department: '',
    yearOfStudy: '',
    internshipDomain: '',
    startDate: '',
    endDate: ''
  };

  for (const [key, value] of Object.entries(row)) {
    const norm = normalizeHeader(key);
    const val = String(value || '').trim();

    if (/^(candidatename|studentname|fullname|name|candidate)$/i.test(norm)) {
      mapped.name = val;
    } else if (/^(email|emailaddress|emailid|mail|studentemail)$/i.test(norm)) {
      mapped.email = val.toLowerCase();
    } else if (/^(department|discipline|dept|branch|stream|course)$/i.test(norm)) {
      mapped.department = val;
    } else if (/^(yearofstudy|year|academicyear|batch|graduatingyear)$/i.test(norm)) {
      mapped.yearOfStudy = val;
    } else if (/^(internshipdomain|domain|internshipprogram|internshiptitle|internship|track|program)$/i.test(norm)) {
      mapped.internshipDomain = val;
    } else if (/^(startingdate|startdate|from|start|commencementdate)$/i.test(norm)) {
      mapped.startDate = val;
    } else if (/^(endingdate|enddate|to|end|completiondate)$/i.test(norm)) {
      mapped.endDate = val;
    }
  }

  return mapped;
}

// Simple email validator regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const excelService = {
  /**
   * Parse uploaded Excel or CSV buffer
   * @param {Buffer} buffer 
   * @returns {Array<Object>}
   */
  parseBuffer(buffer) {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    return rawRows;
  },

  /**
   * Validate raw parsed rows and identify errors / duplicates
   * @param {Array<Object>} rawRows 
   * @returns {Object} validation report
   */
  validateCandidateRows(rawRows) {
    const existingEmails = new Set(
      db.prepare('SELECT email FROM candidates').all().map(r => r.email.toLowerCase())
    );

    const rows = [];
    let validCount = 0;
    let invalidCount = 0;
    let duplicateCount = 0;
    const seenBatchEmails = new Set();

    rawRows.forEach((rawRow, index) => {
      const mapped = mapRowKeys(rawRow);
      const errors = [];
      let isDuplicate = false;

      // 1. Validate Name
      if (!mapped.name || mapped.name.length < 2) {
        errors.push('Candidate name is missing or too short');
      }

      // 2. Validate Email
      if (!mapped.email) {
        errors.push('Email address is missing');
      } else if (!EMAIL_REGEX.test(mapped.email)) {
        errors.push(`Invalid email format: "${mapped.email}"`);
      } else if (existingEmails.has(mapped.email) || seenBatchEmails.has(mapped.email)) {
        isDuplicate = true;
        errors.push('Duplicate candidate email found in database or batch');
      }

      if (mapped.email) {
        seenBatchEmails.add(mapped.email);
      }

      // 3. Validate Department
      if (!mapped.department) {
        errors.push('Department / Discipline is missing');
      }

      // 4. Validate Year of Study
      if (!mapped.yearOfStudy) {
        errors.push('Year of study is missing');
      }

      // 5. Validate Domain
      if (!mapped.internshipDomain) {
        errors.push('Internship domain is missing');
      }

      // 6. Validate Dates
      if (!mapped.startDate) {
        errors.push('Starting date is missing');
      }
      if (!mapped.endDate) {
        errors.push('Ending date is missing');
      }

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
      } else if (isDuplicate) {
        duplicateCount++;
      } else {
        invalidCount++;
      }

      rows.push({
        rowIndex: index + 1,
        ...mapped,
        isValid,
        isDuplicate,
        errors
      });
    });

    return {
      totalRows: rawRows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      duplicateRows: duplicateCount,
      rows
    };
  },

  /**
   * Export candidate list with certificates and email status to Excel / CSV
   * @param {'xlsx'|'csv'} format 
   * @returns {Buffer}
   */
  exportCandidates(format = 'xlsx') {
    const candidates = db.prepare(`
      SELECT 
        c.id as Candidate_ID,
        c.name as Candidate_Name,
        c.email as Email,
        c.department as Department,
        c.year_of_study as Year_of_Study,
        c.internship_domain as Internship_Domain,
        c.start_date as Starting_Date,
        c.end_date as Ending_Date,
        c.source as Source,
        c.status as Completion_Status,
        cert.certificate_id as Certificate_ID,
        cert.status as Certificate_Status,
        el.status as Email_Status,
        el.sent_at as Email_Sent_At
      FROM candidates c
      LEFT JOIN certificates cert ON c.id = cert.candidate_id
      LEFT JOIN email_logs el ON cert.id = el.certificate_id
      ORDER BY c.created_at DESC
    `).all();

    const worksheet = XLSX.utils.json_to_sheet(candidates);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates_Report');

    if (format === 'csv') {
      return XLSX.write(workbook, { type: 'buffer', bookType: 'csv' });
    }
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  },

  /**
   * Generate a sample Excel workbook for immediate hackathon demo import
   * @returns {Buffer}
   */
  generateSampleExcel() {
    const sampleData = [
      {
        "Candidate Name": "Tanmay Deshmukh",
        "Email": "tanmay.d@polytech.edu",
        "Department": "Computer Science and Engineering",
        "Year of Study": "3rd Year",
        "Internship Domain": "Cybersecurity Virtual Internship",
        "Starting Date": "01 June 2026",
        "Ending Date": "30 June 2026"
      },
      {
        "Candidate Name": "Aakash Banerjee",
        "Email": "aakash.b@techinstitute.org",
        "Department": "Information Technology",
        "Year of Study": "4th Year",
        "Internship Domain": "Full-Stack Web Engineering Virtual Internship",
        "Starting Date": "15 July 2026",
        "Ending Date": "30 August 2026"
      },
      {
        "Candidate Name": "Kavya Ramesh",
        "Email": "kavya.ramesh@nationalcollege.edu",
        "Department": "Electronics and Communication",
        "Year of Study": "3rd Year",
        "Internship Domain": "Applied AI & Machine Learning Internship",
        "Starting Date": "01 August 2026",
        "Ending Date": "31 August 2026"
      },
      {
        "Candidate Name": "Rohan Singhania",
        "Email": "rohan.s@apexuniversity.in",
        "Department": "Computer Science and Engineering",
        "Year of Study": "4th Year",
        "Internship Domain": "Cybersecurity Virtual Internship",
        "Starting Date": "01 June 2026",
        "Ending Date": "30 June 2026"
      },
      {
        "Candidate Name": "Sneha Madhavan",
        "Email": "sneha.m@crestengg.edu",
        "Department": "Data Science & Artificial Intelligence",
        "Year of Study": "2nd Year",
        "Internship Domain": "Applied AI & Machine Learning Internship",
        "Starting Date": "01 August 2026",
        "Ending Date": "31 August 2026"
      },
      {
        "Candidate Name": "Invalid Demo Row",
        "Email": "invalid-email-format",
        "Department": "Civil Engineering",
        "Year of Study": "",
        "Internship Domain": "Cybersecurity",
        "Starting Date": "",
        "Ending Date": "30 June 2026"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidates');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
};

export default excelService;
