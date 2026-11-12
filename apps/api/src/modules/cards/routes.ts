import express from 'express';
import { getCards, createCard, getCard, updateCard, deleteCard } from './controllers/card-controller';
import { authenticateToken } from '../auth/middleware/auth-middleware';

const router = express.Router();

router.get('/', authenticateToken, getCards);
router.post('/', authenticateToken, createCard);
router.get('/:id', authenticateToken, getCard);
router.put('/:id', authenticateToken, updateCard);
router.delete('/:id', authenticateToken, deleteCard);

export { router as cardRoutes };