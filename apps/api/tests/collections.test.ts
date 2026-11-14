import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const state = vi.hoisted(() => ({
  collections: new Map<string, any>(),
  items: new Map<string, any>(),
}));

vi.mock('../src/modules/collections/models/collection-model', () => ({
  Collection: {
    find: vi.fn(({ userId }: { userId: string }) => ({
      sort: vi.fn(async () => Array.from(state.collections.values()).filter((c) => c.userId === userId)),
    })),
    create: vi.fn(async (col: any) => {
      const created = { ...col, _id: `col-${Date.now()}` };
      state.collections.set(created._id, created);
      return created;
    }),
    findOne: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const col = state.collections.get(_id);
      return col && col.userId === userId ? col : null;
    }),
    findOneAndUpdate: vi.fn(async ({ _id, userId }: { _id: string; userId: string }, update: any) => {
      const col = state.collections.get(_id);
      if (col && col.userId === userId) {
        const updated = { ...col, ...update };
        state.collections.set(_id, updated);
        return updated;
      }
      return null;
    }),
    findOneAndDelete: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const col = state.collections.get(_id);
      if (col && col.userId === userId) {
        state.collections.delete(_id);
        return col;
      }
      return null;
    }),
  },
  CollectionItem: {
    find: vi.fn(({ collectionId, userId }: { collectionId: string; userId: string }) => ({
      sort: vi.fn(async () =>
        Array.from(state.items.values()).filter((i) => i.collectionId === collectionId && i.userId === userId)
      ),
    })),
    create: vi.fn(async (item: any) => {
      const created = { ...item, _id: `item-${Date.now()}` };
      state.items.set(created._id, created);
      return created;
    }),
    findOne: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const item = state.items.get(_id);
      return item && item.userId === userId ? item : null;
    }),
    findOneAndUpdate: vi.fn(async ({ _id, userId }: { _id: string; userId: string }, update: any) => {
      const item = state.items.get(_id);
      if (item && item.userId === userId) {
        const updated = { ...item, ...update };
        state.items.set(_id, updated);
        return updated;
      }
      return null;
    }),
    findOneAndDelete: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const item = state.items.get(_id);
      if (item && item.userId === userId) {
        state.items.delete(_id);
        return item;
      }
      return null;
    }),
    deleteMany: vi.fn(async ({ collectionId, userId }: { collectionId: string; userId: string }) => {
      for (const [id, item] of state.items.entries()) {
        if (item.collectionId === collectionId && item.userId === userId) {
          state.items.delete(id);
        }
      }
    }),
  },
}));

const { default: apiApp } = await import('../src/app');
const { errorHandler } = await import('../src/middleware/error-handler');

const app = express();
app.use(express.json());
app.use(apiApp);
app.use(errorHandler);

const secret = process.env.JWT_SECRET || 'default-secret';
const validToken = jwt.sign({ userId: 'user-123', email: 'user@example.com' }, secret, { expiresIn: '1h' });

describe('Collections API', () => {
  beforeEach(() => {
    state.collections.clear();
    state.items.clear();
  });

  describe('GET /api/collections', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/collections');
      expect(response.status).toBe(401);
    });

    it('should return collections with auth', async () => {
      const response = await request(app)
        .get('/api/collections')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.collections)).toBe(true);
    });
  });

  describe('POST /api/collections', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/collections').send({ title: 'Test' });
      expect(response.status).toBe(401);
    });

    it('should create collection with valid data', async () => {
      const response = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Personal Documents', description: 'Important docs' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.collection.title).toBe('Personal Documents');
    });
  });

  describe('GET /api/collections/:id/items', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/collections/1/items');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/collections/:id/items', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/collections/1/items').send({ title: 'Test' });
      expect(response.status).toBe(401);
    });

    it('should create collection item with valid data', async () => {
      const response = await request(app)
        .post('/api/collections/col-1/items')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          itemType: 'text',
          title: 'Encrypted Note',
          encryptedPayload: 'secret',
          encryptionVersion: '1',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.item.title).toBe('Encrypted Note');
    });
  });
});
