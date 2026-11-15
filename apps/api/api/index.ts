import type { Request, Response } from 'express';
import apiApp from '../src/app';
import { connectDatabase } from '../src/config/database';

let databaseConnection: Promise<void> | undefined;

const ensureDatabaseConnection = (): Promise<void> => {
  if (!databaseConnection) {
    databaseConnection = connectDatabase().catch(error => {
      databaseConnection = undefined;
      throw error;
    });
  }

  return databaseConnection;
};

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    await ensureDatabaseConnection();
    apiApp(req, res);
  } catch (error) {
    console.error('Failed to initialize API request:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}
