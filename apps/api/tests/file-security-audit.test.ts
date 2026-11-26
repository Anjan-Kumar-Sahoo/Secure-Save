import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const state = vi.hoisted(() => ({
  storedFiles: new Map<string, any>(),
  collectionItems: new Map<string, any>(),
  physicalStorage: new Map<string, Buffer>(),
}));

vi.mock('../src/modules/collections/models/file-storage-model', () => ({
  StoredFile: {
    create: vi.fn(async (fileData: any) => {
      const created = { ...fileData, _id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
      state.storedFiles.set(created._id, created);
      return created;
    }),
    findOne: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const file = state.storedFiles.get(_id);
      return file && file.userId === userId ? file : null;
    }),
    findById: vi.fn(async (id: string) => {
      return state.storedFiles.get(id) || null;
    }),
    deleteOne: vi.fn(async ({ _id }: { _id: string }) => {
      state.storedFiles.delete(_id);
      return { acknowledged: true, deletedCount: 1 };
    }),
  },
}));

vi.mock('../src/modules/collections/models/collection-model', () => ({
  Collection: {
    find: vi.fn(),
    create: vi.fn(),
    findOne: vi.fn(),
    findOneAndUpdate: vi.fn(),
    findOneAndDelete: vi.fn(),
  },
  CollectionItem: {
    create: vi.fn(async (itemData: any) => {
      const created = { ...itemData, _id: `item-${Date.now()}` };
      state.collectionItems.set(created._id, created);
      return created;
    }),
    findOneAndDelete: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const item = state.collectionItems.get(_id);
      if (item && item.userId === userId) {
        state.collectionItems.delete(_id);
        return item;
      }
      return null;
    }),
  },
}));

vi.mock('../src/modules/collections/services/file-storage-service', () => ({
  fileStorageService: {
    saveEncryptedFile: vi.fn(async (userId: string, dataBuffer: Buffer) => {
      const storageKey = `${userId}/${Date.now()}-mock.enc`;
      state.physicalStorage.set(storageKey, dataBuffer);
      return { storageKey, size: dataBuffer.length };
    }),
    getEncryptedFile: vi.fn(async (userId: string, storageKey: string) => {
      if (!storageKey.startsWith(userId)) {
        throw new Error('Access denied to file');
      }
      const data = state.physicalStorage.get(storageKey);
      if (!data) throw new Error('File not found on storage');
      return data;
    }),
    deleteFile: vi.fn(async (_userId: string, storageKey: string) => {
      state.physicalStorage.delete(storageKey);
    }),
  },
}));

import { collectionRoutes } from '../src/modules/collections/routes';
import { errorHandler } from '../src/middleware/error-handler';

const app = express();
app.use(express.json({ limit: '60mb' }));
app.use('/api/collections', collectionRoutes);
app.use(errorHandler);

describe('Universal File Security & MIME Audit', () => {
  const secret = process.env.JWT_SECRET || 'default-secret';
  const tokenUserA = jwt.sign({ userId: 'user-audit-A', email: 'userA@example.com' }, secret);
  const tokenUserB = jwt.sign({ userId: 'user-audit-B', email: 'userB@example.com' }, secret);

  beforeEach(() => {
    state.storedFiles.clear();
    state.collectionItems.clear();
    state.physicalStorage.clear();
  });

  const formats = [
    { ext: 'png', mime: 'image/png', content: Buffer.from('\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRtest', 'binary') },
    { ext: 'jpg', mime: 'image/jpeg', content: Buffer.from('\xFF\xD8\xFF\xE0\x00\x10JFIFtest', 'binary') },
    { ext: 'mp3', mime: 'audio/mpeg', content: Buffer.from('ID3\x03\x00\x00\x00\x00\x00testmp3', 'binary') },
    { ext: 'mp4', mime: 'video/mp4', content: Buffer.from('\x00\x00\x00\x18ftypmp42testmp4', 'binary') },
    { ext: 'pdf', mime: 'application/pdf', content: Buffer.from('%PDF-1.4 test pdf content %EOF', 'utf-8') },
    { ext: 'zip', mime: 'application/zip', content: Buffer.from('PK\x03\x04testzipcontent', 'binary') },
    { ext: 'txt', mime: 'text/plain', content: Buffer.from('Hello plain text note content', 'utf-8') },
    { ext: 'dat', mime: 'application/x-custom-binary', content: Buffer.alloc(1024, 0x42) }, // Uncommon binary format
  ];

  for (const fmt of formats) {
    it(`should successfully upload and download file format: ${fmt.ext} (${fmt.mime})`, async () => {
      const mockEncryptedBase64 = fmt.content.toString('base64');
      const fileName = `sample-test-file.${fmt.ext}`;

      const uploadRes = await request(app)
        .post('/api/collections/files/upload')
        .set('Authorization', `Bearer ${tokenUserA}`)
        .send({
          fileName,
          mimeType: fmt.mime,
          encryptedBase64: mockEncryptedBase64,
        });

      expect(uploadRes.status).toBe(200);
      expect(uploadRes.body.success).toBe(true);
      expect(uploadRes.body.data.fileName).toBe(fileName);
      expect(uploadRes.body.data.mimeType).toBe(fmt.mime);
      expect(uploadRes.body.data.fileId).toBeDefined();

      const fileId = uploadRes.body.data.fileId;

      const downloadRes = await request(app)
        .get(`/api/collections/files/${fileId}/download`)
        .set('Authorization', `Bearer ${tokenUserA}`);

      expect(downloadRes.status).toBe(200);
      expect(downloadRes.body.success).toBe(true);
      expect(downloadRes.body.data.encryptedBase64).toBe(mockEncryptedBase64);
      expect(downloadRes.body.data.mimeType).toBe(fmt.mime);
    });
  }

  it('rejects upload exceeding size limit (50MB)', async () => {
    // 51 MB buffer
    const largeBuffer = Buffer.alloc(51 * 1024 * 1024);
    const largeBase64 = largeBuffer.toString('base64');

    const res = await request(app)
      .post('/api/collections/files/upload')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        fileName: 'huge-file.bin',
        mimeType: 'application/octet-stream',
        encryptedBase64: largeBase64,
      });

    expect([400, 413, 500]).toContain(res.status);
    if (res.status === 400) {
      expect(res.body.message).toMatch(/exceeds maximum permitted limit/);
    }
  });

  it('prevents cross-user access to files', async () => {
    const resA = await request(app)
      .post('/api/collections/files/upload')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        fileName: 'secret-a.pdf',
        mimeType: 'application/pdf',
        encryptedBase64: Buffer.from('user-a-secret').toString('base64'),
      });
    const fileId = resA.body.data.fileId;

    const downloadRes = await request(app)
      .get(`/api/collections/files/${fileId}/download`)
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect([400, 404]).toContain(downloadRes.status);
    expect(downloadRes.body.message).toMatch(/File record not found/);
  });

  it('cleans up stored file on collection item deletion', async () => {
    const uploadRes = await request(app)
      .post('/api/collections/files/upload')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .send({
        fileName: 'clean-test.txt',
        mimeType: 'text/plain',
        encryptedBase64: Buffer.from('to-be-deleted').toString('base64'),
      });
    const fileId = uploadRes.body.data.fileId;

    const { CollectionItem } = await import('../src/modules/collections/models/collection-model');
    const item = await CollectionItem.create({
      userId: 'user-audit-A',
      collectionId: 'coll-1',
      itemType: 'file',
      title: 'Item to delete',
      encryptedPayload: 'test',
      encryptionVersion: '1.0',
      fileReferences: [fileId],
    });

    const deleteRes = await request(app)
      .delete(`/api/collections/items/${item._id}`)
      .set('Authorization', `Bearer ${tokenUserA}`);

    expect(deleteRes.status).toBe(200);

    const { StoredFile } = await import('../src/modules/collections/models/file-storage-model');
    const storedCheck = await StoredFile.findById(fileId);
    expect(storedCheck).toBeNull();
  });
});
