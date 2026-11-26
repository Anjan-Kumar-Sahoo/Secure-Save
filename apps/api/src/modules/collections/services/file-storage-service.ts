import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Local disk storage directory for encrypted files
const UPLOAD_ROOT = process.env.STORAGE_DIR
  ? path.resolve(process.env.STORAGE_DIR)
  : path.resolve(__dirname, '../../../../uploads/vault');

// Ensure directory exists
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

export const fileStorageService = {
  /**
   * Save an encrypted file buffer or stream to disk
   */
  async saveEncryptedFile(userId: string, dataBuffer: Buffer): Promise<{ storageKey: string; size: number }> {
    // Generate safe collision-free key
    const safeKey = `${crypto.randomUUID()}-${Date.now()}.enc`;
    const userDir = path.join(UPLOAD_ROOT, userId.replace(/[^a-zA-Z0-9_-]/g, ''));
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const filePath = path.join(userDir, safeKey);
    await fs.promises.writeFile(filePath, dataBuffer);

    return {
      storageKey: path.join(path.basename(userDir), safeKey).replace(/\\/g, '/'),
      size: dataBuffer.length,
    };
  },

  /**
   * Read encrypted file buffer
   */
  async getEncryptedFile(userId: string, storageKey: string): Promise<Buffer> {
    // Prevent directory traversal attacks
    const sanitizedKey = path.normalize(storageKey).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = path.join(UPLOAD_ROOT, sanitizedKey);

    // Verify key belongs to the user's directory
    const userPrefix = userId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!sanitizedKey.startsWith(userPrefix)) {
      throw new Error('Access denied to file');
    }

    if (!fs.existsSync(fullPath)) {
      throw new Error('File not found on storage');
    }

    return fs.promises.readFile(fullPath);
  },

  /**
   * Delete an encrypted file
   */
  async deleteFile(userId: string, storageKey: string): Promise<void> {
    try {
      const sanitizedKey = path.normalize(storageKey).replace(/^(\.\.[\/\\])+/, '');
      const fullPath = path.join(UPLOAD_ROOT, sanitizedKey);

      const userPrefix = userId.replace(/[^a-zA-Z0-9_-]/g, '');
      if (sanitizedKey.startsWith(userPrefix) && fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (e) {
      console.warn('Could not delete storage file:', storageKey, e);
    }
  }
};
