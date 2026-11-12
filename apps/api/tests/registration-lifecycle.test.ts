import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppError } from '../src/middleware/error-handler';

const state = vi.hoisted(() => ({
  users: new Map<string, any>(),
  lastOtpAt: 0,
  otpConsumed: false,
  otpExpired: false,
  smtpFailure: false,
}));

const applyUpdate = (user: any, update: any) => {
  const changes = update.$set || update;
  for (const [path, value] of Object.entries(changes)) {
    const segments = path.split('.');
    let target = user;
    segments.slice(0, -1).forEach((segment) => {
      target[segment] ||= {};
      target = target[segment];
    });
    target[segments[segments.length - 1]] = value;
  }
};

vi.mock('../src/modules/auth/models/user-model', () => ({
  User: {
    findOne: vi.fn(async ({ email }: { email: string }) => state.users.get(email) || null),
    create: vi.fn(async (user: any) => {
      const created = { ...user, _id: user.email };
      state.users.set(user.email, created);
      return created;
    }),
    findByIdAndDelete: vi.fn(async (id: string) => {
      state.users.delete(id);
    }),
    findOneAndUpdate: vi.fn(async ({ email }: { email: string }, update: any) => {
      const user = state.users.get(email);
      if (user) applyUpdate(user, update);
      return user;
    }),
    findByIdAndUpdate: vi.fn(async (id: string, update: any) => {
      const user = state.users.get(id);
      if (user) applyUpdate(user, update);
      return user;
    }),
  },
}));

vi.mock('../src/modules/auth/services/otp-service', () => ({
  otpService: {
    sendOtp: vi.fn(async (email: string) => {
      if (state.smtpFailure) throw new Error('SMTP unavailable');
      if (Date.now() - state.lastOtpAt < 60_000) {
        throw new AppError('Please wait before requesting another OTP', 429, 'OTP_COOLDOWN');
      }
      state.lastOtpAt = Date.now();
      state.otpConsumed = false;
    }),
    verifyOtp: vi.fn(async () => {
      if (state.otpExpired) throw new AppError('OTP expired', 400, 'OTP_EXPIRED');
      if (state.otpConsumed) throw new AppError('Invalid OTP', 400, 'INVALID_OTP');
      state.otpConsumed = true;
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

describe('registration lifecycle', () => {
  beforeEach(() => {
    state.users.clear();
    state.lastOtpAt = 0;
    state.otpConsumed = false;
    state.otpExpired = false;
    state.smtpFailure = false;
  });

  it('completes email, OTP, PIN, and login transitions', async () => {
    const email = 'lifecycle@example.com';

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({ email });
    expect(registerResponse.status).toBe(200);
    expect(registerResponse.headers['x-request-id']).toEqual(expect.any(String));
    expect(state.users.get(email).status).toBe('pending');

    const verifyResponse = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, otp: '123456' });
    expect(verifyResponse.status).toBe(200);
    expect(state.users.get(email).emailVerified).toBe(true);
    expect(state.users.get(email).status).toBe('pending');

    const completeResponse = await request(app)
      .post('/api/auth/pin/complete-registration')
      .send({ email, pin: '123456', confirmPin: '123456' });
    expect(completeResponse.status).toBe(200);
    expect(state.users.get(email).status).toBe('active');

    const loginResponse = await request(app)
      .post('/api/auth/session/login')
      .send({ email, pin: '123456' });
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.token).toEqual(expect.any(String));
  });

  it('rejects duplicate registration and enforces resend cooldown', async () => {
    const email = 'duplicate@example.com';
    await request(app).post('/api/auth/register').send({ email });

    const duplicateResponse = await request(app)
      .post('/api/auth/register')
      .send({ email });
    expect(duplicateResponse.status).toBe(409);

    const resendResponse = await request(app)
      .post('/api/auth/otp/send')
      .send({ email });
    expect(resendResponse.status).toBe(429);
  });

  it('does not leave a pending user after SMTP delivery fails', async () => {
    const email = 'smtp-failure@example.com';
    state.smtpFailure = true;

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email });

    expect(response.status).toBe(500);
    expect(state.users.has(email)).toBe(false);
  });

  it('rejects invalid and expired OTPs without advancing registration', async () => {
    const email = 'otp-errors@example.com';
    await request(app).post('/api/auth/register').send({ email });

    state.otpConsumed = true;
    const invalidResponse = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, otp: '000000' });
    expect(invalidResponse.status).toBe(400);
    expect(state.users.get(email).status).toBe('pending');

    state.otpConsumed = false;
    state.otpExpired = true;
    const expiredResponse = await request(app)
      .post('/api/auth/otp/verify')
      .send({ email, otp: '123456' });
    expect(expiredResponse.status).toBe(400);
    expect(state.users.get(email).status).toBe('pending');
  });
});
