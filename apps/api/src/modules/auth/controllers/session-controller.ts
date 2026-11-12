import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

const router = Router();

dotenv.config();

router.post('/login', [
  body('email').isEmail().withMessage('Invalid email'),
  body('pin').isLength({ min: 4, max: 6 }).withMessage('PIN must be 4-6 digits'),
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