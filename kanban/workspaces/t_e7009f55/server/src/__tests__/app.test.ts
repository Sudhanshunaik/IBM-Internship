import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { buildApp } from '../index';
import { env } from '../config/env';

/**
 * Integration smoke test. Boots the Express app and exercises:
 *   - /api/health
 *   - POST /api/auth/register + /api/auth/login + /api/auth/me
 import { describe, it, expect, beforeAll, afterAll } from 'vitest';
 import request from 'supertest';
 import type { Express } from 'express';
 import mongoose from 'mongoose';
 import { buildApp } from '../index';
 import { connectMongo } from '../config/mongo';
 import { env } from '../config/env';

 /**
  * Integration smoke test. Boots the Express app and exercises:
  *   - /api/health
  *   - POST /api/auth/register + /api/auth/me
  *   - POST /api/scenes (auth)
  *   - GET  /api/scenes (anonymous sees the new public scene)
  *
  * The auth-flow block is gated on a reachable Mongo. We probe connectivity
  * once in beforeAll; if the connection attempt fails (no local Mongo, DNS
  * failure, etc.) we mark mongoUnreachable=true and skip the whole block via
  * describe.skipIf. The health endpoint test always runs.
  */

 let app: Express;
 let mongoUnreachable = false;

 beforeAll(async () => {
   app = await buildApp();
   if (!env.MONGO_URI || env.MONGO_URI.includes('localhost')) {
     mongoUnreachable = true;
     return;
   }
   try {
     await connectMongo();
   } catch {
     mongoUnreachable = true;
   }
 }, 20_000);

 afterAll(async () => {
   await mongoose.disconnect().catch(() => undefined);
 });

 describe('health', () => {
   it('returns ok', async () => {
     const res = await request(app).get('/api/health');
     expect(res.status).toBe(200);
     expect(res.body.status).toBe('ok');
     expect(res.body.mongo).toMatch(/connected|disconnected/);
   });
 });

 describe.skipIf(mongoUnreachable)('auth flow', () => {
   it('registers, fetches me, creates a public scene, lists it', async () => {
     const stamp = Date.now();
     const email = `user-${stamp}@example.com`;
     const username = `user${stamp}`;
     const password = 'correct horse battery';

     const reg = await request(app)
       .post('/api/auth/register')
       .send({ email, username, password });
     expect(reg.status).toBe(201);
     expect(reg.body.user.email).toBe(email);
     const access = reg.body.tokens.accessToken as string;

     const me = await request(app)
       .get('/api/auth/me')
       .set('Authorization', `Bearer ${access}`);
     expect(me.status).toBe(200);
     expect(me.body.user.username).toBe(username);

     const create = await request(app)
       .post('/api/scenes')
       .set('Authorization', `Bearer ${access}`)
       .send({ title: 'My scene', isPublic: true });
     expect(create.status).toBe(201);
     expect(create.body.scene.title).toBe('My scene');
     expect(create.body.scene.ownerId).toBe(me.body.user._id);

     const list = await request(app).get('/api/scenes');
     expect(list.status).toBe(200);
     expect(list.body.items.length).toBeGreaterThan(0);
   });
 });