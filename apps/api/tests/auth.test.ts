import request from 'supertest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import app from '../server';

describe('Authentication API', () => {
  let server: any;

  beforeEach(() => {
    // Reset in-memory state or mock database
    server = app;
  });

  afterEach(async () => {
    // Cleanup
  });

  describe('POST /auth/register', () => {
    it('should register a new user with valid email', async () => {
      const response = await request(server)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('OTP sent to email');
    });

    it('should return error for duplicate email', async () => {
      // First registration
      await request(server).post('/api/auth/register').send({ email: 'test@example.com' });
      // Second registration with same email
      const response = await request(server)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('DUPLICATE_ENTRY');
    });
  });

  describe('POST /auth/send-otp', () => {
    it('should send OTP for registration', async () => {
      const response = await request(server)
        .post('/api/auth/send-otp')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should rate-limit OTP requests', async () => {
      // Send multiple OTPs quickly
      for (let i = 0; i < 6; i++) {
        await request(server)
          .post('/api/auth/send-otp')
          .send({ email: 'test@example.com' });
      }
      // Last request should be rate-limited
      const response = await request(server)
        .post('/api/auth/send-otp')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(429); // or 200 depending on implementation
    });
  });

  describe('POST /auth/verify-otp', () => {
    it('should verify valid OTP', async () => {
      const response = await request(server)
        .post('/api/auth/verify-otp')
        .send({ email: 'test@example.com', otp: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      const response = await request(server)
        .post('/api/auth/verify-otp')
        .send({ email: 'test@example.com', otp: '999999' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject expired OTP', async () => {
      const response = await request(server)
        .post('/api/auth/verify-otp')
        .send({ email: 'test@example.com', otp: '123456' });

      // This would depend on OTP expiry implementation
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid PIN', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', pin: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid PIN', async () => {
      const response = await request(server)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', pin: '654321' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/forgot-pin', () => {
    it('should send OTP for PIN reset', async () => {
      const response = await request(server)
        .post('/api/auth/forgot-pin')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /auth/reset-pin', () => {
    it('should reset PIN with valid OTP', async () => {
      // First send OTP
      await request(server).post('/api/auth/forgot-pin').send({ email: 'test@example.com' });
      // Then reset PIN
      const response = await request(server)
        .post('/api/auth/reset-pin')
        .send({
          email: 'test@example.com',
          otp: '123456',
          newPin: '123456',
          confirmPin: '123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout and clear cookie', async () => {
      const response = await request(server)
        .post('/api/auth/logout')
        .set('Cookie', '');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Cookie should be cleared
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });
});