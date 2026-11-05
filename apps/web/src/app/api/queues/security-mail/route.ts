import { handleCallback } from '@vercel/queue';
import { prisma } from '@lyamo/database';
import { deliverMailJob } from '@web/features/email/services/mail-outbox.service';

export const runtime = 'nodejs';
export const POST = handleCallback<{ id: string }>(
  async ({ id }) => {
    await deliverMailJob(id);
    const job = await prisma.mailJob.findUnique({
      where: { id },
      select: { completedAt: true, expiresAt: true },
    });
    // The queue can deliver before the producing transaction commits.
    if (!job || (!job.completedAt && job.expiresAt > new Date()))
      throw new Error('Mail job pending');
  },
  { retry: () => ({ afterSeconds: 60 }) }
);
