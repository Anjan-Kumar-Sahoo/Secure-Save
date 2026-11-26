import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const state = vi.hoisted(() => ({
  cards: new Map<string, any>(),
}));

vi.mock('../src/modules/cards/models/card-model', () => ({
  Card: {
    find: vi.fn(({ userId }: { userId: string }) => ({
      sort: vi.fn(async () => Array.from(state.cards.values()).filter((c) => c.userId === userId)),
    })),
    create: vi.fn(async (card: any) => {
      const created = { ...card, _id: `card-${Date.now()}` };
      state.cards.set(created._id, created);
      return created;
    }),
    findOne: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const card = state.cards.get(_id);
      return card && card.userId === userId ? card : null;
    }),
    findOneAndUpdate: vi.fn(async ({ _id, userId }: { _id: string; userId: string }, update: any) => {
      const card = state.cards.get(_id);
      if (card && card.userId === userId) {
        const updated = { ...card, ...update };
        state.cards.set(_id, updated);
        return updated;
      }
      return null;
    }),
    findOneAndDelete: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const card = state.cards.get(_id);
      if (card && card.userId === userId) {
        state.cards.delete(_id);
        return card;
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

describe('Cards API', () => {
  beforeEach(() => {
    state.cards.clear();
  });

  describe('GET /api/cards', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/cards');
      expect(response.status).toBe(401);
    });

    it('should return user cards with valid auth', async () => {
      const response = await request(app)
        .get('/api/cards')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.cards)).toBe(true);
    });
  });

  describe('POST /api/cards', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/cards').send({ title: 'Test Card' });
      expect(response.status).toBe(401);
    });

    it('should create card with valid data', async () => {
      const response = await request(app)
        .post('/api/cards')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Sapphire Preferred',
          encryptedPayload: 'encrypted-card-payload',
          encryptionVersion: '1',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.card.title).toBe('Sapphire Preferred');
    });
  });

  describe('GET /api/cards/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/cards/nonexistent');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/cards/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).put('/api/cards/card-1').send({ title: 'Updated' });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/cards/:id', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete('/api/cards/card-1');
      expect(response.status).toBe(401);
    });
  });
});
