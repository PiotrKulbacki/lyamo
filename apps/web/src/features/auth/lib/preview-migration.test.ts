import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

test('Preview skips migrations before reading local environment or invoking database tools', () => {
  const script = fileURLToPath(
    new URL('../../../../../../packages/database/scripts/run-migrate-deploy.mjs', import.meta.url)
  );
  const result = spawnSync(process.execPath, [script], {
    env: { NODE_ENV: 'test', VERCEL_ENV: 'preview', PATH: '' },
    encoding: 'utf8',
  });
  expect(result.status).toBe(0);
  expect(result.stderr).toBe('');
  expect(result.stdout).toContain('Skipping migrations in Preview');
});
