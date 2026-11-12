import express from 'express';
import { register } from './controllers/auth-controller';
import { sendOtp, verifyOtp } from './controllers/otp-controller';
import { createPin, loginPin, forgotPin, resetPin } from './controllers/pin-controller';
import { refreshToken, logout } from './controllers/session-controller';
import { authenticateToken } from '../middleware/auth-middleware';

const router = express.Router();

router.post('/register', register);
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/complete-registration', authenticateToken, createPin);
router.post('/login', loginPin);
router.post('/refresh', refreshToken);
router.post('/logout', authenticateToken, logout);
router.post('/forgot-pin', forgotPin);
router.post('/reset-pin', resetPin);

export { router as authRoutes };