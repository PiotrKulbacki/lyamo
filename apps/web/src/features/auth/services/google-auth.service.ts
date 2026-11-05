import { Prisma, prisma } from '@lyamo/database';
import { getFinancialMonthStartDayFromDate } from '@shared/features/billing/financial-month';
import { type GoogleProfile } from '@web/features/auth/lib/google-oidc';
import { generateToken, hashToken } from '@web/features/auth/lib/tokens';
import { SESSION_DURATION_MS } from '@web/features/auth/types';

export class GoogleAccountConflict extends Error {}

// Never attach an identity to a pre-existing user by matching their email.
// A unique email or sub race retries the entire serializable transaction.
export async function createGoogleSession(profile: GoogleProfile): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          const account = await tx.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: 'google',
                providerAccountId: profile.providerAccountId,
              },
            },
            include: { user: true },
          });
          let user = account?.user;
          if (!user) {
            const matches = await tx.$queryRaw<Array<{ id: string }>>`
            SELECT id FROM users WHERE lower(btrim(email)) = ${profile.email} LIMIT 1
          `;
            if (matches.length) throw new GoogleAccountConflict();
            if (!profile.authoritativeEmail) throw new Error('GOOGLE_EMAIL_CHALLENGE_REQUIRED');
            const now = new Date();
            user = await tx.user.create({
              data: {
                email: profile.email,
                name: profile.name,
                avatarUrl: profile.avatarUrl,
                emailVerifiedAt: now,
                lastQuotaResetAt: now,
                financialMonthStartDay: getFinancialMonthStartDayFromDate(now),
                accounts: {
                  create: { provider: 'google', providerAccountId: profile.providerAccountId },
                },
              },
            });
          }
          // Existing Google identities stay attached to their original user even
          // if Google changes the email. Never promote a legacy unverified user.
          if (!user.emailVerifiedAt) throw new GoogleAccountConflict();
          const token = generateToken();
          await tx.session.create({
            data: {
              userId: user.id,
              token: hashToken(token),
              expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
            },
          });
          return token;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2034'].includes(error.code) &&
        attempt < 2
      )
        continue;
      throw error;
    }
  }
  throw new Error('GOOGLE_CONFLICT');
}
