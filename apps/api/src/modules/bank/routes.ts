import express from 'express';
import { getBanks, createBank, getBank, updateBank, deleteBank, linkCard, unlinkCard } from './controllers/bank-controller';
import { authenticateToken } from '../auth/middleware/auth-middleware';

const router = express.Router();

router.get('/', authenticateToken, getBanks);
router.post('/', authenticateToken, createBank);
router.get('/:id', authenticateToken, getBank);
router.put('/:id', authenticateToken, updateBank);
router.delete('/:id', authenticateToken, deleteBank);
router.post('/:id/link-card', authenticateToken, linkCard);
router.delete('/:id/link-card/:cardId', authenticateToken, unlinkCard);

export { router as bankRoutes };