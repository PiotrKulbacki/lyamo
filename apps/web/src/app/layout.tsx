import { JetBrains_Mono, Outfit } from 'next/font/google';
import { cookies } from 'next/headers';
import { MeshBackground } from '@web/components/MeshBackground';
import { PostHogProvider } from '@web/features/analytics/components/PostHogProvider';
import { VercelAnalytics } from '@web/features/analytics/components/VercelAnalytics';
import { ToastProvider } from '@web/features/auth/components/ToastProvider';
import { CookieConsentProvider } from '@web/features/cookie-consent';
import { LocaleProvider } from '@web/features/i18n/LocaleProvider';
import { QueryProvider } from '@web/features/query/QueryProvider';
import { DEFAULT_LOCALE, isLocale, t } from '@shared/features/i18n';
import { env } from '@web/env';
import { getRequestLocale } from '@web/features/seo/get-request-locale';
import type { Metadata } from 'next';
import './globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();

  return {
    metadataBase: new URL(env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')),
    title: {
      default: 'Lyamo',
      template: '%s | Lyamo',
    },
    description: t('seo.home.description', locale),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('sec_locale')?.value;
  const initialLocale = localeCookie && isLocale(localeCookie) ? localeCookie : DEFAULT_LOCALE;

  return (
    <html
      lang={initialLocale}
      className={`dark ${outfit.variable} ${jetbrains.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <MeshBackground />
        <LocaleProvider initialLocale={initialLocale}>
          <CookieConsentProvider>
            <QueryProvider>
              <PostHogProvider>
                {children}
                <ToastProvider />
                <VercelAnalytics />
              </PostHogProvider>
            </QueryProvider>
          </CookieConsentProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
