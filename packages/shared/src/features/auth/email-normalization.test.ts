import { expect, test } from 'vitest';
import { loginSchema, forgotPasswordSchema, normalizeEmail, registerSchema } from './schemas';

test('all email entry points normalize case and whitespace, preserve dots and tags', () => {
  const email = '  Owner.Name+tag@Example.COM  ';
  const expected = 'owner.name+tag@example.com';
  expect(normalizeEmail(email)).toBe(expected);
  expect(loginSchema.parse({ email, password: 'pass' }).email).toBe(expected);
  expect(forgotPasswordSchema.parse({ email }).email).toBe(expected);
  expect(
    registerSchema.parse({ email, password: 'Pass123!', confirmPassword: 'Pass123!' }).email
  ).toBe(expected);
});
