import * as oidc from 'openid-client';
import { emailSchema } from '@shared/features/auth/schemas';
import { env } from '@web/env';

export const GOOGLE_ISSUER = 'https://accounts.google.com';
export const googleCallbackUrl = () => `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;
let configuration: Promise<oidc.Configuration> | undefined;

export function getGoogleConfiguration() {
  configuration ??= oidc
    .discovery(
      new URL(GOOGLE_ISSUER),
      env.GOOGLE_CLIENT_ID,
      { client_secret: env.GOOGLE_CLIENT_SECRET, id_token_signed_response_alg: 'RS256' },
      oidc.ClientSecretPost(env.GOOGLE_CLIENT_SECRET),
      { execute: [oidc.enableNonRepudiationChecks], timeout: 10 }
    )
    .catch((error: unknown) => {
      configuration = undefined;
      throw error;
    });
  return configuration;
}

export type GoogleProfile = {
  providerAccountId: string;
  email: string;
  authoritativeEmail: boolean;
  name: string | null;
  avatarUrl: string | null;
};
export type GoogleChecks = { state: string; nonce: string; codeVerifier: string };

export async function getGoogleOAuthUrl(
  checks: GoogleChecks,
  config?: oidc.Configuration
): Promise<URL> {
  return oidc.buildAuthorizationUrl(config ?? (await getGoogleConfiguration()), {
    redirect_uri: googleCallbackUrl(),
    scope: 'openid email profile',
    state: checks.state,
    nonce: checks.nonce,
    code_challenge: await oidc.calculatePKCECodeChallenge(checks.codeVerifier),
    code_challenge_method: 'S256',
  });
}

export async function exchangeGoogleCode(
  url: URL,
  checks: GoogleChecks,
  config?: oidc.Configuration
): Promise<GoogleProfile> {
  const tokens = await oidc.authorizationCodeGrant(
    config ?? (await getGoogleConfiguration()),
    url,
    {
      expectedState: checks.state,
      expectedNonce: checks.nonce,
      pkceCodeVerifier: checks.codeVerifier,
      idTokenExpected: true,
    }
  );
  const claims = tokens.claims();
  if (
    !claims ||
    typeof claims.sub !== 'string' ||
    !claims.sub ||
    claims.sub.length > 255 ||
    claims.email_verified !== true ||
    (claims.azp !== undefined && claims.azp !== env.GOOGLE_CLIENT_ID) ||
    (Array.isArray(claims.aud) && claims.aud.length > 1 && claims.azp !== env.GOOGLE_CLIENT_ID)
  )
    throw new Error('INVALID_GOOGLE_PROFILE');
  const email = emailSchema.parse(claims.email);
  // Google is authoritative only for Gmail or a verified Workspace domain.
  const authoritativeEmail =
    email.endsWith('@gmail.com') || (typeof claims.hd === 'string' && claims.hd.length > 0);
  return {
    providerAccountId: claims.sub,
    email,
    authoritativeEmail,
    name: typeof claims.name === 'string' ? claims.name.slice(0, 100) : null,
    avatarUrl:
      typeof claims.picture === 'string' && claims.picture.startsWith('https://')
        ? claims.picture
        : null,
  };
}
