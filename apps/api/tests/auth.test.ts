import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import bcrypt from 'bcryptjs';

const state = vi.hoisted(() => ({
  users: new Map<string, any>(),
  otps: new Map<string, string>(),
}));

vi.mock('../src/modules/auth/models/user-model', () => ({
  User: {
    findOne: vi.fn(async ({ email }: { email: string }) => state.users.get(email) || null),
    create: vi.fn(async (user: any) => {
      const created = { ...user, _id: `user-${Date.now()}` };
      state.users.set(user.email, created);
      return created;
    }),
    findOneAndUpdate: vi.fn(async ({ email }: { email: string }, update: any) => {
      const user = state.users.get(email);
      if (user) {
        Object.assign(user, update.$set || update);
      }
      return user;
    }),
    findByIdAndUpdate: vi.fn(async (id: string, update: any) => {
      for (const user of state.users.values()) {
        if (user._id === id) {
          Object.assign(user, update.$set || update);
          return user;
        }
      }
      return null;
    }),
    findByIdAndDelete: vi.fn(async (id: string) => {
      for (const [email, user] of state.users.entries()) {
        if (user._id === id) {
          state.users.delete(email);
        }
      }
    }),
  },
}));

vi.mock('../src/modules/auth/services/otp-service', () => ({
  otpService: {
    sendOtp: vi.fn(async (email: string) => {
      state.otps.set(email, '123456');
    }),
    verifyOtp: vi.fn(async (email: string, otp: string) => {
      const stored = state.otps.get(email);
      if (stored !== otp) {
        throw new Error('Invalid OTP');
      }
      return true;
    }),
  },
}));

const { default: apiApp } = await import('../src/app');
const { errorHandler } = await import('../src/middleware/error-handler');

const app = express();
app.use(express.json());
app.use(apiApp);
app.use(errorHandler);

describe('Authentication API', () => {
  beforeEach(async () => {
    state.users.clear();
    state.otps.clear();

    // Create an active user with hashed PIN '123456'
    const pinHash = await bcrypt.hash('123456', 10);
    state.users.set('test@example.com', {
      _id: 'user-active-1',
      email: 'test@example.com',
      emailVerified: true,
      status: 'active',
      recoveryConfiguration: {
        recoveryKeyId: 'key-1',
        recoveryKeyVersion: 1,
        recoveryKeyEncrypted: pinHash,
      },
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'newuser@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('OTP sent to email');
    });

    it('should return error for duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('DUPLICATE_ENTRY');
    });
  });

  describe('POST /api/auth/otp/send', () => {
    it('should send OTP for unverified email', async () => {
      const response = await request(app)
        .post('/api/auth/otp/send')
        .send({ email: 'unregistered@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/otp/verify', () => {
    it('should verify valid OTP', async () => {
      state.otps.set('test@example.com', '123456');

      const response = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email: 'test@example.com', otp: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      state.otps.set('test@example.com', '123456');

      const response = await request(app)
        .post('/api/auth/otp/verify')
        .send({ email: 'test@example.com', otp: '999999' });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/session/login', () => {
    it('should login with valid PIN', async () => {
      const response = await request(app)
        .post('/api/auth/session/login')
        .send({ email: 'test@example.com', pin: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject invalid PIN', async () => {
      const response = await request(app)
        .post('/api/auth/session/login')
        .send({ email: 'test@example.com', pin: '654321' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/pin/forgot', () => {
    it('should send OTP for registered email', async () => {
      const response = await request(app)
        .post('/api/auth/pin/forgot')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/session/logout', () => {
    it('should logout and clear session', async () => {
      const response = await request(app)
        .post('/api/auth/session/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
