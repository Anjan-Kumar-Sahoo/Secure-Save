import express from 'express';
import { registerRoutes } from './controllers/auth-controller';
import { otpRoutes } from './controllers/otp-controller';
import { pinRoutes } from './controllers/pin-controller';
import { sessionRoutes } from './controllers/session-controller';
import { vaultKeyRoutes } from './controllers/vault-key-controller';

const router = express.Router();

router.use('/register', registerRoutes);
router.use('/otp', otpRoutes);
router.use('/pin', pinRoutes);
router.use('/session', sessionRoutes);
router.use('/vault-keys', vaultKeyRoutes);

export { router as authRoutes };