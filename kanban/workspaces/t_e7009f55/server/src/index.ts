import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'node:http';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectMongo, disconnectMongo, mongoConnectionState } from './config/mongo';
import { errorHandler, notFoundHandler } from './middleware/errors';
import authRoutes from './routes/auth.routes';
import sceneRoutes from './routes/scenes.routes';
import dataSourceRoutes from './routes/datasources.routes';
import dataPointRoutes from './routes/datapoints.routes';
import { createSocketServer, setIo } from './sockets';
import type { HealthResponse } from '@mern-3dviz/shared';

export async function buildApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',').map((s) => s.trim()), credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  app.get('/api/health', (_req, res) => {
    const body: HealthResponse = {
      status: 'ok',
      uptimeSeconds: Math.round(process.uptime()),
      mongo: mongoConnectionState(),
      socket: 'ok',
      version: process.env.npm_package_version ?? '0.1.0',
      timestamp: new Date().toISOString(),
    };
    res.json(body);
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/scenes', sceneRoutes);
  app.use('/api/datasources', dataSourceRoutes);
  app.use('/api/datapoints', dataPointRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function main(): Promise<void> {
  await connectMongo();
  const app = await buildApp();
  const httpServer = createServer(app);
  const io = createSocketServer(httpServer);
  setIo(io);

  httpServer.listen(env.PORT, env.HOST, () => {
    logger.info({ host: env.HOST, port: env.PORT }, 'server listening');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down');
    httpServer.close();
    await disconnectMongo();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT',  () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'unhandledRejection');
  });
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'uncaughtException');
    process.exit(1);
  });
}

// Only run when executed directly. Works under both tsx and compiled Node ESM/CJS
// without depending on `import.meta` or `require.main`.
const invokedPath = process.argv[1] ? process.argv[1].replace(/\\/g, '/') : '';
const filePath = __filename.replace(/\\/g, '/');
if (invokedPath && filePath.endsWith(invokedPath.split('/').pop() ?? '')) {
  main().catch((err) => {
    logger.fatal({ err }, 'fatal boot error');
    process.exit(1);
  });
}