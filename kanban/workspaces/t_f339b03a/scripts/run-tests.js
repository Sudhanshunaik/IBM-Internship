'use strict';

// Runs every smoke / integration script in test/ sequentially, captures
// stdout/stderr for each, and exits non-zero if any script failed. Designed
// to work without an external MongoDB — negative-path checks still pass
// even when the DB is unreachable.

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const TEST_DIR = path.join(__dirname, '..', 'test');
const files = fs
  .readdirSync(TEST_DIR)
  .filter((f) => f.endsWith('.js'))
  .sort();

if (files.length === 0) {
  console.error('[run-tests] no test files found in', TEST_DIR);
  process.exit(1);
}

const results = [];
let failed = 0;

for (const file of files) {
  const full = path.join(TEST_DIR, file);
  process.stdout.write(`\n=== ${file} ===\n`);
  const res = spawnSync(process.execPath, [full], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    timeout: 60_000,
  });
  const out = (res.stdout || '') + (res.stderr || '');
  process.stdout.write(out);
  const ok = res.status === 0;
  results.push({ file, ok, status: res.status });
  if (!ok) failed += 1;
}

console.log('\n=== summary ===');
for (const r of results) {
  console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.file}  (exit ${r.status})`);
}
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed === 0 ? 0 : 1);