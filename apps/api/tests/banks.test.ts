import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const state = vi.hoisted(() => ({
  banks: new Map<string, any>(),
  cards: new Map<string, any>(),
}));

vi.mock('../src/modules/bank/models/bank-model', () => ({
  BankDetail: {
    find: vi.fn(({ userId }: { userId: string }) => ({
      sort: vi.fn(async () => Array.from(state.banks.values()).filter((b) => b.userId === userId)),
    })),
    create: vi.fn(async (bank: any) => {
      const created = { ...bank, linkedCardIds: [], _id: `bank-${Date.now()}` };
      state.banks.set(created._id, created);
      return created;
    }),
    findOne: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const bank = state.banks.get(_id);
      return bank && bank.userId === userId ? bank : null;
    }),
    findOneAndUpdate: vi.fn(async ({ _id, userId }: { _id: string; userId: string }, update: any) => {
      const bank = state.banks.get(_id);
      if (bank && bank.userId === userId) {
        const updated = { ...bank, ...update };
        state.banks.set(_id, updated);
        return updated;
      }
      return null;
    }),
    findOneAndDelete: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const bank = state.banks.get(_id);
      if (bank && bank.userId === userId) {
        state.banks.delete(_id);
        return bank;
      }
      return null;
    }),
    findByIdAndUpdate: vi.fn(async (id: string, update: any) => {
      const bank = state.banks.get(id);
      if (bank) {
        if (update.$push?.linkedCardIds) {
          bank.linkedCardIds = bank.linkedCardIds || [];
          bank.linkedCardIds.push(update.$push.linkedCardIds);
        }
        if (update.$pull?.linkedCardIds) {
          bank.linkedCardIds = (bank.linkedCardIds || []).filter((c: string) => c !== update.$pull.linkedCardIds);
        }
      }
      return bank;
    }),
  },
}));

vi.mock('../src/modules/cards/models/card-model', () => ({
  Card: {
    findOne: vi.fn(async ({ _id, userId }: { _id: string; userId: string }) => {
      const card = state.cards.get(_id);
      return card && card.userId === userId ? card : null;
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

describe('Bank Details API', () => {
  beforeEach(() => {
    state.banks.clear();
    state.cards.clear();
    state.cards.set('card-1', { _id: 'card-1', userId: 'user-123', title: 'Test Card' });
  });

  describe('GET /api/banks', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/banks');
      expect(response.status).toBe(401);
    });

    it('should return bank details with auth', async () => {
      const response = await request(app)
        .get('/api/banks')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.banks)).toBe(true);
    });
  });

  describe('POST /api/banks', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/banks').send({ title: 'Test' });
      expect(response.status).toBe(401);
    });

    it('should create bank entry with valid data', async () => {
      const response = await request(app)
        .post('/api/banks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          title: 'Chase Checking',
          encryptedPayload: 'encrypted-bank-data',
          encryptionVersion: '1',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/banks/:id/link-card', () => {
    it('should require authentication', async () => {
      const response = await request(app).post('/api/banks/1/link-card').send({ cardId: '1' });
      expect(response.status).toBe(401);
    });

    it('should link card to bank', async () => {
      // First create bank
      const bankRes = await request(app)
        .post('/api/banks')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ title: 'Bank', encryptedPayload: 'data', encryptionVersion: '1' });

      const bankId = bankRes.body.data.bank._id;

      const response = await request(app)
        .post(`/api/banks/${bankId}/link-card`)
        .set('Authorization', `Bearer ${validToken}`)
        .send({ cardId: 'card-1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/banks/:id/link-card/:cardId', () => {
    it('should require authentication', async () => {
      const response = await request(app).delete('/api/banks/1/link-card/1');
      expect(response.status).toBe(401);
    });
  });
});
