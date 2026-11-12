import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

interface AuthRequest extends Request {
  userId?: string;
  email?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.['__Secure-sid'] || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret);
    if (typeof decoded === 'string' || !decoded.userId || !decoded.email) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.userId = decoded.userId;
    req.email = decoded.email;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export { AuthRequest };