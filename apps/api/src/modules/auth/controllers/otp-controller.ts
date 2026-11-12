import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { otpService } from '../services/otp-service';
import { validationErrorHandler } from '../../../utils/error-handler';
import { User } from '../models/user-model';

const router = Router();

router.post('/send', [
  body('email').isEmail().withMessage('Invalid email')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(validationErrorHandler(errors.array()));
    }

    const email = String(req.body.email).trim().toLowerCase();

    const existingUser = await User.findOne({ email });
    if (existingUser?.status === 'active') {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    await otpService.sendOtp(email, 'registration');
    res.json({
      success: true,
      message: 'OTP sent to email'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/verify', [
  body('email').isEmail().withMessage('Invalid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('otp').isNumeric().withMessage('OTP must be numeric')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(validationErrorHandler(errors.array()));
    }

    const email = String(req.body.email).trim().toLowerCase();
    const { otp } = req.body;

    await otpService.verifyOtp(email, otp, 'registration');

    await User.findOneAndUpdate(
      { email },
      { emailVerified: true }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as otpRoutes };