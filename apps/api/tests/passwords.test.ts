import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const state = vi.hoisted(() => ({
  passwords: new Map<string, any>(),
}));

vi.mock('../src/modules/passwords/models/password-model', () => ({
  PasswordEntry: {
    find: vi.fn(({ userId }: { userId: string }) => ({
      sort: vi.fn(async () => Array.from(state.passwords.values()).filter((p) => p.userId === userId)),
    })),
    create: vi.fn(async (entry: any) => {
      const created = { ...entry, _id: `pwd-${Date.now()}` };
      state.passwords.set(created._id, created);
      return created;
    }),
    findOne: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const pwd = state.passwords.get(_id);
      return pwd && pwd.userId === userId ? pwd : null;
    }),
    findOneAndUpdate: vi.fn(async ({ _id, userId }: { _id: string; userId: string }, update: any) => {
      const pwd = state.passwords.get(_id);
      if (pwd && pwd.userId === userId) {
        const updated = { ...pwd, ...update };
        state.passwords.set(_id, updated);
        return updated;
      }
      return null;
    }),
    findOneAndDelete: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const pwd = state.passwords.get(_id);
      if (pwd && pwd.userId === userId) {
        state.passwords.delete(_id);
        return pwd;
      }
      return null;
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

describe('Passwords API', () => {
  beforeEach(() => {
    state.passwords.clear();
  });

  describe('GET /api/passwords', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/passwords');
      expect(response.status).toBe(401);
    });

    it('should return user passwords with auth', async () => {
      const response = await request(app)
        .get('/api/passwords')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.passwords)).toBe(true);
    });
  });

  describe('POST /api/passwords', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/passwords').send({ title: 'Test' });
      expect(response.status).toBe(401);
    });

    it('should create password entry with valid data', async () => {
      const response = await request(app)
        .post('/api/passwords')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          encryptedPayload: 'encrypted-payload',
          encryptionVersion: '1',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.password.encryptedPayload).toBe('encrypted-payload');
    });
  });

  describe('GET /api/passwords/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/passwords/1');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/passwords/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).put('/api/passwords/1').send({ title: 'Updated' });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/passwords/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete('/api/passwords/1');
      expect(response.status).toBe(401);
    });
  });
});
