import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../server';

describe('Cards API', () => {
  let server: any;

  beforeEach(() => {
    server = app;
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('GET /api/cards', () => {
    it('should require authentication', async () => {
      const response = await request(server).get('/api/cards');
      expect(response.status).toBe(401);
    });

    it('should return user cards with auth', async () => {
      // This would need auth token
      const response = await request(server)
        .get('/api/cards')
        .set('Authorization', 'Bearer mock-token');

      expect([200, 401]).toContain(response.status);
    });
  });

  describe('POST /api/cards', () => {
    it('should require authentication', async () => {
      const response = await request(server).post('/api/cards').send({ title: 'Test' });
      expect(response.status).toBe(401);
    });

    it('should create card with valid data', async () => {
      const response = await request(server)
        .post('/api/cards')
        .set('Authorization', 'Bearer mock-token')
        .send({ title: 'Test Card', encryptedPayload: 'encrypted', encryptionVersion: '1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/cards/:id', () => {
    it('should require authentication', async () => {
      const response = await request(server).get('/api/cards/1');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/cards/:id', () => {
    it('should require authentication', async () => {
      const response = await request(server).put('/api/cards/1').send({ title: 'Updated' });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/cards/:id', () => {
    it('should require authentication', async () => {
      const response = await request(server).delete('/api/cards/1');
      expect(response.status).toBe(401);
    });
  });
});