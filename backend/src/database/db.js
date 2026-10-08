import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory
const dataDir = path.resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'interncert.sqlite');
const rawDb = new DatabaseSync(dbPath);

// Execute pragmas
rawDb.exec('PRAGMA foreign_keys = ON;');

// Helper to convert any BigInt in query results to Number for seamless JSON serialization
function sanitizeResult(val) {
  if (val === null || val === undefined) return val;
  if (typeof val === 'bigint') return Number(val);
  if (Array.isArray(val)) return val.map(sanitizeResult);
  if (typeof val === 'object') {
    const sanitized = {};
    for (const [k, v] of Object.entries(val)) {
      sanitized[k] = typeof v === 'bigint' ? Number(v) : v;
    }
    return sanitized;
  }
  return val;
}

// Create friendly wrapper API
export const db = {
  exec(sql) {
    return rawDb.exec(sql);
  },
  prepare(sql) {
    const stmt = rawDb.prepare(sql);
    return {
      get(...params) {
        const row = stmt.get(...params);
        return sanitizeResult(row);
      },
      all(...params) {
        const rows = stmt.all(...params);
        return sanitizeResult(rows);
      },
      run(...params) {
        const res = stmt.run(...params);
        return sanitizeResult(res);
      }
    };
  },
  transaction(fn) {
    return (...args) => {
      rawDb.exec('BEGIN TRANSACTION;');
      try {
        const result = fn(...args);
        rawDb.exec('COMMIT;');
        return result;
      } catch (err) {
        rawDb.exec('ROLLBACK;');
        throw err;
      }
    };
  }
};

export default db;
