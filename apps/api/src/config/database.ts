import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || (
  process.env.NODE_ENV === 'production'
    ? ''
    : 'mongodb://localhost:27017/secure-save'
);

export const connectDatabase = async (): Promise<void> => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI must be configured in production');
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error(
      'MongoDB Atlas connection error. Verify MONGODB_URI and allow the Render service in Atlas Network Access:',
      error
    );
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('Disconnected from MongoDB Atlas');
};

export const getConnection = (): typeof mongoose => mongoose;

export interface DatabaseStats {
  connections: number;
  collections: number;
  host: string;
}

export const getDatabaseStats = async (): Promise<DatabaseStats> => {
  const database = mongoose.connection.db;
  if (!database) {
    throw new Error('Database connection is not initialized');
  }
  const stats = await database.stats();
  return {
    connections: mongoose.connections.length,
    collections: await database.collections().then(c => c.length),
    host: mongoose.connections[0].host
  };
};