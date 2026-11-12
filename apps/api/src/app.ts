import express from 'express';
import { errorHandler } from './middleware/error-handler';
import { authRoutes } from './modules/auth/routes';
import { cardRoutes } from './modules/cards/routes';
import { bankRoutes } from './modules/bank/routes';
import { passwordRoutes } from './modules/passwords/routes';
import { collectionRoutes } from './modules/collections/routes';

const app = express();

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/collections', collectionRoutes);

app.use(errorHandler);

export default app;