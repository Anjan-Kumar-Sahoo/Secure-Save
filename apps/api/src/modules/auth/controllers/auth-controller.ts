import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { User } from '../models/user-model';
import { otpService } from '../services/otp-service';
import { createError } from '../../../utils/error-handler';

const router = Router();

router.post('/', [
  body('email').isEmail().withMessage('Invalid email'),
  body('email').custom(async (value) => {
    const existingUser = await User.findOne({ email: value });
    if (existingUser) {
      throw new Error('Email already registered');
    }
  })
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    await otpService.sendOtp(email);
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