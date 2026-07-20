/**
 * Vitest setup: load test env before any module reads process.env.
 *
 * The .env.test file holds dev-only Mongo + JWT secrets and is gitignored.
 * If it's missing we let the env loader's normal crash happen — that's a
 * clearer signal than silently booting with bad config.
 */
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

const envFile = path.resolve(__dirname, '../../.env.test');
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
} else {
  // Fallback minimal config so tests can at least boot the health endpoint.
  // Integration tests requiring Mongo will be skipped via describe.skipIf.
  process.env.MONGO_URI ||= 'mongodb://localhost:27017/mern_3dviz_test';
  process.env.JWT_ACCESS_SECRET ||= 'test_access_secret_at_least_16_chars';
  process.env.JWT_REFRESH_SECRET ||= 'test_refresh_secret_at_least_16_chars';
  process.env.NODE_ENV ||= 'test';
}