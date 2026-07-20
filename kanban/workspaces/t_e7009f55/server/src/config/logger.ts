import pino from 'pino';
import { env } from './env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pinoLib: any = (pino as any).default ?? pino;
export const logger = pinoLib({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:HH:MM:ss.l' } }
      : undefined,
});