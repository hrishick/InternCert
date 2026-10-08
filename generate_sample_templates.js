import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import excelService from './backend/src/services/excelService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatesDir = path.resolve(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Generate sample Excel
const excelBuffer = excelService.generateSampleExcel();
fs.writeFileSync(path.join(templatesDir, 'sample_candidates.xlsx'), excelBuffer);

// Generate sample CSV
const csvContent = `Candidate Name,Email,Department,Year of Study,Internship Domain,Starting Date,Ending Date
Tanmay Deshmukh,tanmay.d@polytech.edu,Computer Science and Engineering,3rd Year,Cybersecurity Virtual Internship,01 June 2026,30 June 2026
Aakash Banerjee,aakash.b@techinstitute.org,Information Technology,4th Year,Full-Stack Web Engineering Virtual Internship,15 July 2026,30 August 2026
Kavya Ramesh,kavya.ramesh@nationalcollege.edu,Electronics and Communication,3rd Year,Applied AI & Machine Learning Internship,01 August 2026,31 August 2026
Rohan Singhania,rohan.s@apexuniversity.in,Computer Science and Engineering,4th Year,Cybersecurity Virtual Internship,01 June 2026,30 June 2026
Sneha Madhavan,sneha.m@crestengg.edu,Data Science & AI,2nd Year,Applied AI & Machine Learning Internship,01 August 2026,31 August 2026
`;
fs.writeFileSync(path.join(templatesDir, 'sample_candidates.csv'), csvContent);

console.log('✅ Generated sample_candidates.xlsx and sample_candidates.csv in /templates directory');
