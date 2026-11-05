import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { afterAll, expect, test } from 'vitest';
import { prisma } from '@lyamo/database';
import { POST as login } from '@web/app/api/auth/login/route';
import { POST as register } from '@web/app/api/auth/register/route';
import { POST as forgot } from '@web/app/api/auth/forgot-password/route';
import { POST as resend } from '@web/app/api/auth/resend-verification/route';
import { DUMMY_PASSWORD_HASH } from '@web/features/auth/services/auth.service';
const target = new URL(process.env.DATABASE_URL ?? 'http://invalid');
if (
  process.env.LYAMO_TEST_ENV !== '1' ||
  target.hostname !== '127.0.0.1' ||
  target.pathname !== '/lyamo_security_test' ||
  target.username !== 'lyamo_test'
)
  throw new Error('Use isolated integration runner');
afterAll(() => prisma.$disconnect());
const payload = (email: string) => ({
  email,
  password: 'Synthetic123!',
  confirmPassword: 'Synthetic123!',
  acceptedLegal: true,
});
const request = (body: object) =>
  new Request('http://localhost/api/auth/test', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
test('existing/missing registration and recovery are neutral; measured local timing has no fast existence path', async () => {
  const prefix = randomUUID();
  const cases = [
    ['login', login],
    ['register', register],
    ['forgot', forgot],
    ['resend', resend],
  ] as const;
  try {
    for (const [name, handler] of cases) {
      const existing = `${prefix}-${name}-existing@example.invalid`;
      const missing = `${prefix}-${name}-missing@example.invalid`;
      const user = await prisma.user.create({
        data: { email: existing, passwordHash: DUMMY_PASSWORD_HASH, emailVerifiedAt: new Date() },
      });
      const timings = [[], []] as number[][];
      for (let i = 0; i < 3; i++) {
        const responses: { status: number; error?: string; requiresEmailVerification?: boolean }[] =
          [];
        for (const [index, email] of [
          existing,
          name === 'register' ? `${prefix}-new-${i}@example.invalid` : missing,
        ].entries()) {
          const started = performance.now();
          const response = await handler(request(payload(email)));
          timings[index].push(performance.now() - started);
          const body = await response.json();
          responses.push({
            status: response.status,
            error: body.error,
            requiresEmailVerification: body.requiresEmailVerification,
          });
        }
        expect(responses[0]).toEqual(responses[1]);
        expect(responses[0].status).toBe(name === 'login' ? 401 : name === 'register' ? 201 : 200);
      }
      const measured = timings.map(median);
      console.info('S05 local timing medians (ms)', name, measured.map(Math.round));
      // Tolerates noisy shared CI; actual bcrypt comparison is also exercised on both paths.
      expect(Math.abs(measured[0] - measured[1])).toBeLessThan(
        Math.max(500, Math.min(...measured))
      );
      if (name === 'login')
        expect(Math.min(...measured) / Math.max(...measured)).toBeGreaterThan(0.5);
      else expect(Math.min(...measured)).toBeGreaterThanOrEqual(700);
      expect((await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).passwordHash).toBe(
        DUMMY_PASSWORD_HASH
      );
    }
  } finally {
    await prisma.user.deleteMany({ where: { email: { startsWith: prefix } } });
  }
}, 30000);
