import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../src/server';

describe('Collections API', () => {
  let server: any;

  beforeEach(() => {
    server = app;
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('GET /api/collections', () => {
    it('should require authentication', async () => {
      const response = await request(server).get('/api/collections');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/collections', () => {
    it('should require authentication', async () => {
      const response = await request(server).post('/api/collections').send({ title: 'Test' });
      expect(response.status).toBe(401);
    });

    it('should create collection with valid data', async () => {
      const response = await request(server)
        .post('/api/collections')
        .set('Authorization', 'Bearer mock-token')
        .send({ title: 'Personal Documents' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/collections/:id/items', () => {
    it('should require authentication', async () => {
      const response = await request(server).get('/api/collections/1/items');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/collections/:id/items', () => {
    it('should require authentication', async () => {
      const response = await request(server).post('/api/collections/1/items').send({ title: 'Test' });
      expect(response.status).toBe(401);
    });

    it('should create collection item with valid data', async () => {
      const response = await request(server)
        .post('/api/collections/1/items')
        .set('Authorization', 'Bearer mock-token')
        .send({ itemType: 'text', title: 'Test Item' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});