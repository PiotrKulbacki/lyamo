import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUserFromSession } from '@web/features/auth/services/auth.service';
import { LandingPage } from '@web/features/landing/components/LandingPage';
import { buildPageMetadata } from '@web/features/seo/build-page-metadata';

export async function generateMetadata(): Promise<Metadata> {
  return buildPageMetadata({
    path: '/',
    titleKey: 'seo.home.title',
    descriptionKey: 'seo.home.description',
    absoluteTitle: true,
  });
}

export default async function HomePage() {
  const user = await getUserFromSession();
  if (user) {
    redirect('/dashboard');
  }

  return <LandingPage />;
}
