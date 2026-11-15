import express from 'express';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bodyParser from 'express';
import { errorHandler } from './middleware/error-handler';
import { authRoutes } from './modules/auth/routes';
import { cardRoutes } from './modules/cards/routes';
import { bankRoutes } from './modules/bank/routes';
import { passwordRoutes } from './modules/passwords/routes';
import { collectionRoutes } from './modules/collections/routes';
import crypto from 'crypto';

dotenv.config();

const app = express();

app.set('trust proxy', 1);

app.use(bodyParser.json({ limit: '10mb' }));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
}));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      origin === 'capacitor://localhost' ||
      origin === 'http://localhost' ||
      origin === 'https://localhost' ||
      origin === 'ionic://localhost'
    ) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true
}));

app.use(rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS) : 60 * 1000,
  limit: process.env.RATE_LIMIT_MAX_REQUESTS ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) : 100
}));

app.use((req, res, next) => {
  const requestId = req.header('X-Request-ID') || crypto.randomUUID();
  res.setHeader('X-Request-ID', requestId);
  next();
});

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Secure Save API is running', timestamp: new Date().toISOString() });
});

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/banks', bankRoutes);
app.use('/api/passwords', passwordRoutes);
app.use('/api/collections', collectionRoutes);

app.use(errorHandler);

export default app;