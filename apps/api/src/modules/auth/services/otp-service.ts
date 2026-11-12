import bcrypt from 'bcryptjs';
import { Otp } from '../models/otp-model';
import { sendEmail } from '../utils/email-utils';
import { createError } from '../../../utils/error-handler';

const SALT_ROUNDS = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRY_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 60;

class OtpService {
  async sendOtp(email: string, purpose: string = 'registration'): Promise<void> {
    const { otp, otpHash } = await this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    await this.checkResendCooldown(email, RESEND_COOLDOWN_SECONDS);

    await Otp.create({
      email,
      purpose,
      otpHash,
      expiresAt,
      attempts: 0
    });

    await sendEmail(email, {
      subject: 'Your Secure Save Verification Code',
      template: 'otp-verification',
      data: { otp, expiresAt }
    });
  }

  async verifyOtp(email: string, otp: string, purpose: string): Promise<boolean> {
    const otpRecord = await Otp.findOne({ email, purpose, consumedAt: null });
    if (!otpRecord) {
      throw createError(new Error('Invalid OTP'), 'VerifyOtp');
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.findByIdAndUpdate(otpRecord._id, { consumedAt: new Date() });
      throw createError(new Error('OTP expired'), 'VerifyOtp');
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await Otp.findByIdAndUpdate(otpRecord._id, { consumedAt: new Date() });
      throw createError(new Error('Maximum attempts exceeded'), 'VerifyOtp');
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValid) {
      await Otp.findByIdAndUpdate(otpRecord._id, { $inc: { attempts: 1 } });
      throw createError(new Error('Invalid OTP'), 'VerifyOtp');
    }

    await Otp.findByIdAndUpdate(otpRecord._id, {
      consumedAt: new Date(),
      attempts: 0
    });

    return true;
  }

  private async generateOtp(): Promise<{ otp: string; otpHash: string }> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
    return { otp, otpHash };
  }

  private async checkResendCooldown(email: string, cooldownSeconds: number): Promise<void> {
    const lastOtp = await Otp.findOne({
      email,
      createdAt: { $gte: new Date(Date.now() - cooldownSeconds * 1000) }
    }).sort({ createdAt: -1 });

    if (lastOtp) {
      throw createError(new Error('Please wait before requesting another OTP'), 'OtpService');
    }
  }

  async cleanupExpiredOtps(): Promise<void> {
    await Otp.deleteMany({ consumedAt: { $ne: null } });
  }
}

export const otpService = new OtpService();