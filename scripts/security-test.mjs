import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import EmbeddedPostgres from 'embedded-postgres';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const mode = process.argv[2];
if (!['integration', 'e2e', 'build', 'quality'].includes(mode)) {
  throw new Error('Expected integration, e2e, build or quality');
}
if (process.versions.node.split('.')[0] !== '26') {
  throw new Error('Use Node 26: nvm use');
}
if ((await readdir(join(root, 'apps/web'))).some((name) => /^\.env($|\.)/.test(name))) {
  throw new Error(
    'Remove apps/web/.env* files before isolated tests; Next.js loads them implicitly'
  );
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

// Deliberately do not inherit DATABASE_URL, credentials or telemetry settings.
const env = Object.fromEntries(
  ['PATH', 'HOME', 'TMPDIR', 'TMP', 'TEMP', 'SystemRoot', 'LANG'].flatMap((key) =>
    process.env[key] ? [[key, process.env[key]]] : []
  )
);
const directory = await mkdtemp(join(tmpdir(), 'lyamo-security-'));
const port = await freePort();
const webPort = await freePort();
const password = randomBytes(24).toString('hex');
const dbUrl = `postgresql://lyamo_test:${password}@127.0.0.1:${port}/lyamo_security_test`;
Object.assign(env, {
  DATABASE_URL: dbUrl,
  DIRECT_DATABASE_URL: dbUrl,
  AUTH_SECRET: randomBytes(32).toString('hex'),
  GOOGLE_CLIENT_ID: 'local-test-disabled',
  GOOGLE_CLIENT_SECRET: 'local-test-disabled',
  NEXT_PUBLIC_APP_URL: `http://127.0.0.1:${webPort}`,
  EXPO_PUBLIC_API_URL: `http://127.0.0.1:${webPort}`,
  LYAMO_TEST_ENV: '1',
  // Only allow the named local browser channel; never inherit arbitrary service settings.
  ...(process.env.LYAMO_TEST_BROWSER_CHANNEL === 'chrome'
    ? { LYAMO_TEST_BROWSER_CHANNEL: 'chrome' }
    : {}),
  NEXT_TELEMETRY_DISABLED: '1',
  TURBO_TELEMETRY_DISABLED: '1',
  ENABLE_AI: 'false',
  NEXT_PUBLIC_ENABLE_AI: 'false',
  CI: 'true',
});

let child;
const pg = new EmbeddedPostgres({
  databaseDir: join(directory, 'postgres'),
  user: 'lyamo_test',
  password,
  port,
  persistent: false,
  postgresFlags: ['-h', '127.0.0.1', '-k', directory],
  onLog: () => {},
  onError: () => {},
});
let started = false;
const stopChild = () => child?.kill('SIGTERM');
process.once('SIGINT', stopChild);
process.once('SIGTERM', stopChild);

async function run(args, cwd = root) {
  await new Promise((resolve, reject) => {
    child = spawn('npm', args, { cwd, env, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      child = undefined;
      if (code === 0) resolve();
      else reject(new Error(`npm ${args.join(' ')} failed (${code ?? signal})`));
    });
  });
}

try {
  await pg.initialise();
  await pg.start();
  started = true;
  const admin = pg.getPgClient('postgres', '127.0.0.1');
  await admin.connect();
  try {
    await admin.query('CREATE DATABASE lyamo_security_test');
  } finally {
    await admin.end();
  }
  const client = pg.getPgClient('lyamo_security_test', '127.0.0.1');
  await client.connect();
  try {
    const result = await client.query(
      'SELECT current_database() AS db, current_user AS role, host(inet_server_addr()) AS host'
    );
    const identity = result.rows[0];
    if (
      identity.db !== 'lyamo_security_test' ||
      identity.role !== 'lyamo_test' ||
      identity.host !== '127.0.0.1'
    ) {
      throw new Error('Unexpected database identity');
    }
    console.log('Verified isolated PostgreSQL 16:', identity);
  } finally {
    await client.end();
  }
  await run(['run', 'db:generate']);
  await run(['run', 'migrate:deploy', '-w', '@lyamo/database']);
  if (mode === 'quality') {
    for (const check of ['format', 'lint', 'typecheck', 'test']) {
      await run(['run', check]);
    }
  } else if (mode === 'integration') {
    await run([
      'exec',
      '-w',
      'web',
      '--',
      'vitest',
      'run',
      '--config',
      'vitest.integration.config.ts',
    ]);
  } else if (mode === 'build') {
    await run(['run', 'build']);
  } else {
    await run(['exec', '--', 'playwright', 'test']);
  }
} finally {
  if (started) await pg.stop();
  await rm(directory, { recursive: true, force: true });
  process.removeListener('SIGINT', stopChild);
  process.removeListener('SIGTERM', stopChild);
}
