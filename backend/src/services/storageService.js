import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storageDir = path.resolve(__dirname, '../../storage/certificates');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

export const storageService = {
  /**
   * Store a generated PDF buffer to storage (Cloudflare R2 or Local Disk)
   * @param {string} filename e.g. "Alex_Rivera_Certificate.pdf"
   * @param {Buffer|Uint8Array} buffer 
   * @returns {Promise<{path: string, url: string, absolutePath: string}>}
   */
  async saveCertificate(filename, buffer) {
    // Sanitize filename to prevent directory traversal
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(storageDir, safeFilename);

    await fs.promises.writeFile(filePath, Buffer.from(buffer));

    return {
      path: `certificates/${safeFilename}`,
      url: `/api/certificates/file/${safeFilename}`,
      absolutePath: filePath
    };
  },

  /**
   * Retrieve certificate buffer
   * @param {string} filename 
   * @returns {Promise<Buffer|null>}
   */
  async getCertificate(filename) {
    if (!filename) return null;
    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(storageDir, safeFilename);

    if (fs.existsSync(filePath)) {
      return await fs.promises.readFile(filePath);
    }
    return null;
  },

  /**
   * Delete a certificate file from disk
   * @param {string} filename 
   */
  async deleteCertificate(filename) {
    if (!filename) return;
    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(storageDir, safeFilename);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  },

  /**
   * Clear all certificate files from storage
   */
  async clearAllStorage() {
    if (fs.existsSync(storageDir)) {
      const files = await fs.promises.readdir(storageDir);
      for (const file of files) {
        if (file.endsWith('.pdf') || file.endsWith('.zip')) {
          await fs.promises.unlink(path.join(storageDir, file));
        }
      }
    }
  },

  /**
   * Check if certificate exists
   * @param {string} filename 
   * @returns {boolean}
   */
  hasCertificate(filename) {
    if (!filename) return false;
    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
    return fs.existsSync(path.join(storageDir, safeFilename));
  },

  getStorageDirectory() {
    return storageDir;
  }
};

export default storageService;
