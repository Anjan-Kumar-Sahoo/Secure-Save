import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../server';

describe('Passwords API', () => {
  let server: any;

  beforeEach(() => {
    server = app;
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('GET /api/passwords', () => {
    it('should require authentication', async () => {
      const response = await request(server).get('/api/passwords');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/passwords', () => {
    it('should require authentication', async () => {
      const response = await request(server).post('/api/passwords').send({ title: 'Test' });
      expect(response.status).toBe(401);
    });

    it('should create password entry with valid data', async () => {
      const response = await request(server)
        .post('/api/passwords')
        .set('Authorization', 'Bearer mock-token')
        .send({ title: 'Gmail', encryptedPayload: 'encrypted', encryptionVersion: '1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/passwords/:id', () => {
    it('should require authentication', async () => {
      const response = await request(server).get('/api/passwords/1');
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/passwords/:id', () => {
    it('should require authentication', async () => {
      const response = await request(server).put('/api/passwords/1').send({ title: 'Updated' });
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/passwords/:id', () => {
    it('should require authentication', async () => {
      const response = await request(server).delete('/api/passwords/1');
      expect(response.status).toBe(401);
    });
  });
});