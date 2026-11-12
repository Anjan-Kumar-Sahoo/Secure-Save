import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../server';

describe('Bank Details API', () => {
  let server: any;

  beforeEach(() => {
    server = app;
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('GET /api/banks', () => {
    it('should require authentication', async () => {
      const response = await request(server).get('/api/banks');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/banks', () => {
    it('should require authentication', async () => {
      const response = await request(server).post('/api/banks').send({ title: 'Test' });
      expect(response.status).toBe(401);
    });

    it('should create bank entry with valid data', async () => {
      const response = await request(server)
        .post('/api/banks')
        .set('Authorization', 'Bearer mock-token')
        .send({ title: 'Chase Checking', encryptedPayload: 'encrypted', encryptionVersion: '1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/banks/:id/link-card', () => {
    it('should require authentication', async () => {
      const response = await request(server).post('/api/banks/1/link-card').send({ cardId: '1' });
      expect(response.status).toBe(401);
    });

    it('should link card to bank', async () => {
      const response = await request(server)
        .post('/api/banks/1/link-card')
        .set('Authorization', 'Bearer mock-token')
        .send({ cardId: '1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/banks/:id/link-card/:cardId', () => {
    it('should require authentication', async () => {
      const response = await request(server).delete('/api/banks/1/link-card/1');
      expect(response.status).toBe(401);
    });

    it('should unlink card from bank', async () => {
      const response = await request(server)
        .delete('/api/banks/1/link-card/1')
        .set('Authorization', 'Bearer mock-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});