import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { User } from '../models/user-model';
import { otpService } from '../services/otp-service';
import { createError, validationErrorHandler } from '../../../utils/error-handler';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = Router();

router.post('/', [
  body('email').isEmail().withMessage('Invalid email')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(validationErrorHandler(errors.array()));
    }

    const email = String(req.body.email).trim().toLowerCase();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered',
        code: 'DUPLICATE_ENTRY'
      });
    }

    const placeholderPin = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12);
    const pendingUser = await User.create({
      email,
      emailVerified: false,
      status: 'pending',
      recoveryConfiguration: {
        recoveryKeyId: `pending-${Date.now()}`,
        recoveryKeyVersion: 0,
        recoveryKeyEncrypted: placeholderPin
      }
    });

    try {
      await otpService.sendOtp(email);
    } catch (error) {
      await User.findByIdAndDelete(pendingUser._id);
      throw error;
    }

    res.json({
      success: true,
      message: 'OTP sent to email',
      data: { email }
    });
  } catch (error) {
    next(createError(error as Error, 'Register'));
  }
});

export { router as registerRoutes };