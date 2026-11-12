import express from 'express';
import { getPasswords, createPassword, getPassword, updatePassword, deletePassword } from './controllers/password-controller';
import { authenticateToken } from '../auth/middleware/auth-middleware';

const router = express.Router();

router.get('/', authenticateToken, getPasswords);
router.post('/', authenticateToken, createPassword);
router.get('/:id', authenticateToken, getPassword);
router.put('/:id', authenticateToken, updatePassword);
router.delete('/:id', authenticateToken, deletePassword);

export { router as passwordRoutes };