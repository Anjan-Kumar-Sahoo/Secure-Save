import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { User } from '../models/user-model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { otpService } from '../services/otp-service';

const router = Router();

router.post('/forgot', [
  body('email').isEmail().withMessage('Invalid email')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    await otpService.sendOtp(email, 'pin-reset');
    res.json({
      success: true,
      message: 'OTP sent for PIN reset'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/reset', [
  body('email').isEmail().withMessage('Invalid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('otp').isNumeric().withMessage('OTP must be numeric'),
  body('newPin').isLength({ min: 6, max: 6 }).withMessage('PIN must be exactly 6 digits'),
  body('newPin').isNumeric().withMessage('PIN must be numeric'),
  body('confirmPin').isLength({ min: 6, max: 6 }).withMessage('PIN must be exactly 6 digits'),
  body('confirmPin').isNumeric().withMessage('PIN must be numeric'),
  body('confirmPin').custom((value, { req }) => {
    if (value !== req.body.newPin) {
      throw new Error('PINs do not match');
    }
    return true;
  })
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPin } = req.body;

    await otpService.verifyOtp(email, otp, 'pin-reset');

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    const pinHash = await bcrypt.hash(newPin, saltRounds);

    await User.findByIdAndUpdate(user._id, {
      $set: {
        'recoveryConfiguration.recoveryKeyId': 'new-' + Date.now(),
        'recoveryConfiguration.recoveryKeyVersion': user.recoveryConfiguration.recoveryKeyVersion + 1,
        'recoveryConfiguration.recoveryKeyEncrypted': pinHash,
        status: 'active'
      }
    });

    res.json({
      success: true,
      message: 'PIN reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/complete-registration', [
  body('email').isEmail().withMessage('Invalid email'),
  body('pin').isLength({ min: 6, max: 6 }).withMessage('PIN must be exactly 6 digits'),
  body('pin').isNumeric().withMessage('PIN must be numeric'),
  body('confirmPin').isLength({ min: 6, max: 6 }).withMessage('PIN must be exactly 6 digits'),
  body('confirmPin').isNumeric().withMessage('PIN must be numeric'),
  body('confirmPin').custom((value, { req }) => {
    if (value !== req.body.pin) {
      throw new Error('PINs do not match');
    }
    return true;
  })
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, pin } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'User already completed registration'
      });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12');
    const pinHash = await bcrypt.hash(pin, saltRounds);

    await User.findByIdAndUpdate(user._id, {
      'recoveryConfiguration.recoveryKeyId': 'initial-' + Date.now(),
      'recoveryConfiguration.recoveryKeyVersion': 1,
      'recoveryConfiguration.recoveryKeyEncrypted': pinHash,
      status: 'active'
    });

    res.json({
      success: true,
      message: 'Registration completed successfully'
    });
  } catch (error) {
    next(error);
  }
});

export { router as pinRoutes };