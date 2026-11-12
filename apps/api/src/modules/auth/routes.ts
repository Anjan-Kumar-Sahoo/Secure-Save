import express from 'express';
import { registerRoutes } from './controllers/auth-controller';
import { otpRoutes } from './controllers/otp-controller';
import { pinRoutes } from './controllers/pin-controller';
import { sessionRoutes } from './controllers/session-controller';

const router = express.Router();

router.use('/register', registerRoutes);
router.use('/otp', otpRoutes);
router.use('/pin', pinRoutes);
router.use('/session', sessionRoutes);

export { router as authRoutes };