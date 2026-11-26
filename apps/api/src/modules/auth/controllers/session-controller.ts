import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { User } from '../models/user-model';

const router = Router();

dotenv.config();

router.post('/lookup', [
  body('email').isEmail().withMessage('Invalid email')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    const email = String(req.body.email).trim().toLowerCase();
    const user = await User.findOne({ email });
    const status = !user
      ? 'not_found'
      : user.status === 'active' && user.emailVerified
        ? 'active'
        : 'pending';

    return res.json({
      success: true,
      data: { status }
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('pin').isLength({ min: 6, max: 6 }).withMessage('PIN must be exactly 6 digits'),
  body('pin').isNumeric().withMessage('PIN must be numeric')
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, pin } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (user.status !== 'active' || !user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Complete registration before logging in'
      });
    }

    const isPinValid = await bcrypt.compare(pin, user.recoveryConfiguration.recoveryKeyEncrypted);
    if (!isPinValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    res.cookie('__Secure-sid', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 3600000
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: { token }
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.clearCookie('__Secure-sid');

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    next(error);
  }
});

export { router as sessionRoutes };