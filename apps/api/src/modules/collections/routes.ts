import express from 'express';
import { getCollections, createCollection, getCollection, updateCollection, deleteCollection } from './controllers/collection-controller';
import { getCollectionItems, createCollectionItem, getCollectionItem, updateCollectionItem, deleteCollectionItem } from './controllers/item-controller';
import { authenticateToken } from '../auth/middleware/auth-middleware';

const router = express.Router();

// Collections
router.get('/', authenticateToken, getCollections);
router.post('/', authenticateToken, createCollection);
router.get('/:id', authenticateToken, getCollection);
router.put('/:id', authenticateToken, updateCollection);
router.delete('/:id', authenticateToken, deleteCollection);

// Collection Items
router.get('/:collectionId/items', authenticateToken, getCollectionItems);
router.post('/:collectionId/items', authenticateToken, createCollectionItem);
router.get('/items/:id', authenticateToken, getCollectionItem);
router.put('/items/:id', authenticateToken, updateCollectionItem);
router.delete('/items/:id', authenticateToken, deleteCollectionItem);

export { router as collectionRoutes };