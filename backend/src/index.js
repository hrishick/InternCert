import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { initDatabase } from './database/init-db.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import internshipsRouter from './routes/internships.js';
import certificatesRouter from './routes/certificates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8787;

// Initialize Database with Schema & Seeds
initDatabase(false);

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static Storage for Certificates
const storagePath = path.resolve(__dirname, '../storage/certificates');
app.use('/storage/certificates', express.static(storagePath));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api', internshipsRouter);
app.use('/api', certificatesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'InternCert Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve Frontend in Production if built
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/storage')) {
      return next();
    }
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.stack || err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 InternCert API Server running on http://localhost:${PORT}`);
  console.log(`⚡ Ready for Cloudflare D1 & R2 integrations`);
  console.log(`=======================================================`);
});

export default app;
