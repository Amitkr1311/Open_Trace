import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error(' FATAL ERROR: MONGO_URI is not defined in environment variables.');
  process.exit(1);
}

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI as string);
    console.log('Connected to MongoDB successfully');
  } catch (error) {
    console.error(' MongoDB connection error:', error);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn(' MongoDB disconnected');
  });
}
