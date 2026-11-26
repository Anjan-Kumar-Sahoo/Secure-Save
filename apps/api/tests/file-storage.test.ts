import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const state = vi.hoisted(() => ({
  storedFiles: new Map<string, any>(),
}));

vi.mock('../src/modules/collections/models/file-storage-model', () => ({
  StoredFile: {
    create: vi.fn(async (fileData: any) => {
      const created = { ...fileData, _id: `file-${Date.now()}` };
      state.storedFiles.set(created._id, created);
      return created;
    }),
    findOne: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const file = state.storedFiles.get(_id);
      return file && file.userId === userId ? file : null;
    }),
  },
}));

vi.mock('../src/modules/collections/services/file-storage-service', () => ({
  fileStorageService: {
    saveEncryptedFile: vi.fn(async (userId: string, dataBuffer: Buffer) => ({
      storageKey: `${userId}/test-key.enc`,
      size: dataBuffer.length,
    })),
    getEncryptedFile: vi.fn(async (userId: string, storageKey: string) => {
      return Buffer.from('TEST_ENCRYPTED_BINARY_PAYLOAD_12345');
    }),
    deleteFile: vi.fn(async () => {}),
  },
}));

import { collectionRoutes } from '../src/modules/collections/routes';

const app = express();
app.use(express.json());
app.use('/api/collections', collectionRoutes);

describe('Universal Encrypted File Storage API', () => {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const token = jwt.sign({ userId: 'user-storage-123', email: 'filetest@example.com' }, secret);

  beforeEach(() => {
    state.storedFiles.clear();
  });

  it('should upload an arbitrary encrypted file and retrieve it cleanly', async () => {
    const sampleEncryptedPayload = Buffer.from('TEST_ENCRYPTED_BINARY_PAYLOAD_12345').toString('base64');

    const uploadRes = await request(app)
      .post('/api/collections/files/upload')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileName: 'confidential_contract.pdf',
        mimeType: 'application/pdf',
        encryptedBase64: sampleEncryptedPayload,
      });

    expect(uploadRes.status).toBe(200);
    expect(uploadRes.body.success).toBe(true);
    expect(uploadRes.body.data.fileName).toBe('confidential_contract.pdf');
    expect(uploadRes.body.data.fileId).toBeDefined();

    const fileId = uploadRes.body.data.fileId;

    // Retrieve file
    const downloadRes = await request(app)
      .get(`/api/collections/files/${fileId}/download`)
      .set('Authorization', `Bearer ${token}`);

    expect(downloadRes.status).toBe(200);
    expect(downloadRes.body.success).toBe(true);
    expect(downloadRes.body.data.fileName).toBe('confidential_contract.pdf');
    expect(downloadRes.body.data.encryptedBase64).toBe(sampleEncryptedPayload);
  });

  it('should reject unauthenticated upload requests', async () => {
    const res = await request(app)
      .post('/api/collections/files/upload')
      .send({
        fileName: 'unauth.txt',
        encryptedBase64: 'dGVzdA=='
      });

    expect(res.status).toBe(401);
  });
});
