import type { JwtAccessPayload } from '@mern-3dviz/shared';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: JwtAccessPayload;
    }
  }
}

export {};