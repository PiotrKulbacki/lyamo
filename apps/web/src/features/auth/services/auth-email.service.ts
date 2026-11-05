import { sendTransactionalEmail } from '@web/features/email/services/brevo.service';
import { buildResetPasswordEmail } from '@web/features/email/templates/reset-password';
import { buildVerifyEmail } from '@web/features/email/templates/verify-email';
import { captureServerException } from '@web/lib/sentry-server';

export async function sendPasswordResetEmail(params: {
  email: string;
  token: string;
  locale?: string | null;
  name?: string | null;
}): Promise<boolean> {
  try {
    const copy = buildResetPasswordEmail({
      token: params.token,
      locale: params.locale,
      name: params.name,
    });
    const result = await sendTransactionalEmail({
      to: params.email,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
    });

    return result.ok;
  } catch {
    captureServerException(new Error('Password reset email failed'), {
      scope: 'auth.email.passwordReset',
    });
    return false;
  }
}

export async function sendEmailVerificationEmail(params: {
  registrationExpiresAt?: Date | null;
  email: string;
  token: string;
  locale?: string | null;
  name?: string | null;
}): Promise<boolean> {
  try {
    const copy = buildVerifyEmail({
      registrationExpiresAt: params.registrationExpiresAt,
      token: params.token,
      locale: params.locale,
      name: params.name,
    });
    const result = await sendTransactionalEmail({
      to: params.email,
      subject: copy.subject,
      text: copy.text,
      html: copy.html,
    });

    return result.ok;
  } catch {
    captureServerException(new Error('Verification email failed'), {
      scope: 'auth.email.emailVerification',
    });
    return false;
  }
}
