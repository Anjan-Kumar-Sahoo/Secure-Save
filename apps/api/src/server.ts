import express from 'express';
import { connectDatabase } from './config/database';
import apiApp from './app';

const app = express();

app.use(apiApp);

const PORT = process.env.PORT || 3000;

const startServer = async (): Promise<void> => {
  await connectDatabase();
  app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
  });
};

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;