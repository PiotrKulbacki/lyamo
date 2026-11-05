import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, test } from 'vitest';

test('Preview fails before reading local environment or invoking database tools', () => {
  const script = fileURLToPath(
    new URL('../../../../../../packages/database/scripts/run-migrate-deploy.mjs', import.meta.url)
  );
  const result = spawnSync(process.execPath, [script], {
    env: { NODE_ENV: 'test', VERCEL_ENV: 'preview', PATH: '' },
    encoding: 'utf8',
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain('Preview build blocked: database isolation is not confirmed');
  expect(result.stdout).toBe('');
});
