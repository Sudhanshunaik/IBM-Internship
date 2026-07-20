import 'dotenv/config';
import { z } from 'zod';

/**
 * Centralized environment loader.
 * Validates once at boot. Anything missing crashes startup loudly.
 */

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 chars'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 chars'),
  JWT_ACCESS_TTL_SEC: z.coerce.number().int().positive().default(900),         // 15 min
  JWT_REFRESH_TTL_SEC: z.coerce.number().int().positive().default(60 * 60 * 24 * 14), // 14 days

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),

  COOKIE_SECURE: z.coerce.boolean().default(false),
  COOKIE_DOMAIN: z.string().default('localhost'),

  SOCKET_PATH: z.string().default('/socket.io'),
  SOCKET_PING_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
  SOCKET_PING_INTERVAL_MS: z.coerce.number().int().positive().default(25_000),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;