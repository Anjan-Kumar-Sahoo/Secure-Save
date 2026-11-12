import bcrypt from 'bcryptjs';
import { Otp } from '../models/otp-model';
import { sendEmail } from '../utils/email-utils';
import { AppError } from '../../../utils/error-handler';

const SALT_ROUNDS = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRY_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 60;

const otpError = (message: string, statusCode: number, code: string): AppError =>
  new AppError(message, statusCode, code, 'OtpService');

class OtpService {
  async sendOtp(email: string, purpose: string = 'registration'): Promise<void> {
    const { otp, otpHash } = await this.generateOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);

    await this.checkResendCooldown(email, RESEND_COOLDOWN_SECONDS);

    const otpRecord = await Otp.create({
      email,
      purpose,
      otpHash,
      expiresAt,
      attempts: 0
    });

    try {
      await sendEmail(email, {
        subject: 'Your Secure Save Verification Code',
        template: 'otp-verification',
        data: { otp, expiresAt }
      });
    } catch (error) {
      await Otp.findByIdAndDelete(otpRecord._id);
      throw error;
    }
  }

  async verifyOtp(email: string, otp: string, purpose: string): Promise<boolean> {
    const otpRecord = await Otp.findOne({ email, purpose, consumedAt: null });
    if (!otpRecord) {
      throw otpError('Invalid OTP', 400, 'INVALID_OTP');
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.findByIdAndUpdate(otpRecord._id, { consumedAt: new Date() });
      throw otpError('OTP expired', 400, 'OTP_EXPIRED');
    }

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await Otp.findByIdAndUpdate(otpRecord._id, { consumedAt: new Date() });
      throw otpError('Maximum attempts exceeded', 429, 'OTP_ATTEMPTS_EXCEEDED');
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValid) {
      await Otp.findByIdAndUpdate(otpRecord._id, { $inc: { attempts: 1 } });
      throw otpError('Invalid OTP', 400, 'INVALID_OTP');
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
      throw otpError('Please wait before requesting another OTP', 429, 'OTP_COOLDOWN');
    }
  }

  async cleanupExpiredOtps(): Promise<void> {
    await Otp.deleteMany({ consumedAt: { $ne: null } });
  }
}

export const otpService = new OtpService();