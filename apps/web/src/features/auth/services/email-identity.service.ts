import { prisma } from '@lyamo/database';
import { normalizeEmail } from '@shared/features/auth/schemas';

export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email);
  const users = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM users WHERE lower(btrim(email)) = ${normalized} LIMIT 2
  `;
  if (users.length > 1) throw new Error('AMBIGUOUS_EMAIL');
  return users[0] ? prisma.user.findUnique({ where: { id: users[0].id } }) : null;
}
