import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initDatabase(forceSeed = false) {
  console.log('[DB] Initializing database schema...');
  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  const seedPath = path.resolve(__dirname, '../../../database/seed.sql');

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schemaSql);
  console.log('[DB] Schema applied successfully.');

  // Check if users exist or force seed
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0 || forceSeed) {
    console.log('[DB] Seeding database with demo data...');
    const seedSql = fs.readFileSync(seedPath, 'utf8');
    db.exec(seedSql);
    console.log('[DB] Seed data populated successfully.');
  } else {
    console.log(`[DB] Database already populated (${userCount.count} users found).`);
  }
}

// If run directly via CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initDatabase(true);
}
