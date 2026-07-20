import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../config/logger';

mongoose.set('strictQuery', true);

export async function connectMongo(): Promise<typeof mongoose> {
  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5_000,
    maxPoolSize: 20,
  });
  logger.info({ uri: redactUri(env.MONGO_URI) }, 'mongo connected');
  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

export function mongoConnectionState(): 'connected' | 'disconnected' {
  return mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
}

function redactUri(uri: string): string {
  return uri.replace(/(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@/, '$1$2:***@');
}