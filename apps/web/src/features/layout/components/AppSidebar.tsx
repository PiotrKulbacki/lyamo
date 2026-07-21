'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { translateError } from '@shared/features/i18n';
import { LoadingSpinner } from '@web/components/ui/loading-spinner';
import { useAppUser } from '@web/features/auth/components/AppUserProvider';
import { useLocale, useT } from '@web/features/i18n/LocaleProvider';
import { LocaleSwitcher } from '@web/features/layout/components/LocaleSwitcher';
import { LyamoLogo } from '@web/features/layout/components/LyamoLogo';
import { fetchDashboard } from '@web/features/query/fetchers';
import { queryKeys } from '@web/features/query/query-keys';
import { isAiEnabledOnClient } from '@web/lib/ai-feature';

const NAV_ITEMS = [
  { href: '/dashboard', key: 'layout.nav.dashboard', requiresAi: false },
  { href: '/history', key: 'layout.nav.history', requiresAi: false },
  { href: '/scanner', key: 'layout.nav.scanner', requiresAi: true },
  { href: '/chat', key: 'layout.nav.chat', requiresAi: true },
  { href: '/settings', key: 'layout.nav.settings', requiresAi: false },
] as const;

type AppSidebarProps = {
  userName: string | null;
  userEmail: string;
  userPlan: 'FREE' | 'PRO' | 'PREMIUM';
};

export function AppSidebar({ userName, userEmail, userPlan }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAppUser();
  const t = useT();
  const { locale } = useLocale();
  const menuId = useId();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setPendingHref(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  function prefetchRoute(href: string) {
    router.prefetch(href);

    if (href === '/dashboard') {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.dashboard(user.id),
        queryFn: () => fetchDashboard(),
      });
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        toast.error(translateError('auth.errors.generic', locale));
        return;
      }

      toast.success(t('auth.success.logout'));
      router.push('/login');
      router.refresh();
    } catch {
      toast.error(t('auth.errors.networkError'));
    } finally {
      setIsLoggingOut(false);
    }
  }

  const initials = (userName ?? userEmail).slice(0, 2).toUpperCase();
  const aiEnabled = isAiEnabledOnClient();
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.requiresAi || aiEnabled);

  function renderNav(compact = false) {
    return (
      <nav className={`flex flex-1 flex-col gap-1 px-3 ${compact ? 'py-3' : 'py-4'}`}>
        {visibleNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));
          const isPending = pendingHref === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setPendingHref(item.href)}
              onMouseEnter={() => prefetchRoute(item.href)}
              onFocus={() => prefetchRoute(item.href)}
              className={`inline-flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 font-mono text-sm transition ${
                isActive
                  ? 'bg-warm/10 text-warm'
                  : 'text-muted hover:bg-elevated/50 hover:text-[var(--text)]'
              } ${isPending ? 'pointer-events-none opacity-70' : ''}`}
              aria-busy={isPending || undefined}
            >
              <span>{t(item.key)}</span>
              {isPending ? <LoadingSpinner className="h-3.5 w-3.5 shrink-0" /> : null}
            </Link>
          );
        })}
      </nav>
    );
  }

  function renderFooter() {
    return (
      <div className="border-t border-[var(--border)] px-4 py-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="from-warm/20 to-cool/20 text-warm flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br font-mono text-sm font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[var(--text)]">
              {userName ?? userEmail}
            </p>
            <p className="text-muted truncate font-mono text-xs">{userPlan}</p>
          </div>
        </div>

        <div className="mb-3">
          <LocaleSwitcher className="auth-input mt-0 w-full py-2 text-sm" />
        </div>

        <button
          type="button"
          disabled={isLoggingOut}
          onClick={() => void handleLogout()}
          className="text-glow hover:bg-glow/10 inline-flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 font-mono text-sm transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoggingOut && <LoadingSpinner />}
          {t('auth.labels.logout')}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="relative z-40 md:hidden">
        <header className="bg-surface/90 sticky top-0 flex h-14 items-center justify-between border-b border-[var(--border)] px-4 backdrop-blur-md">
          <Link href="/dashboard" className="group inline-flex">
            <LyamoLogo markClassName="h-8 w-8" />
          </Link>
          <button
            type="button"
            className="text-muted hover:bg-elevated/50 inline-flex items-center justify-center rounded-lg border border-[var(--border)] p-2 transition hover:text-[var(--text)]"
            aria-label={mobileOpen ? t('layout.aria.closeMenu') : t('layout.aria.openMenu')}
            aria-expanded={mobileOpen}
            aria-controls={menuId}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </header>

        {mobileOpen ? (
          <>
            <button
              type="button"
              aria-label={t('layout.aria.closeMenu')}
              className="bg-void/70 animate-in fade-in fixed inset-x-0 bottom-0 top-14 z-30 cursor-default backdrop-blur-sm duration-200"
              onClick={() => setMobileOpen(false)}
            />
            <div
              id={menuId}
              role="dialog"
              aria-modal="true"
              aria-label={t('layout.aria.openMenu')}
              className="bg-surface animate-in fade-in slide-in-from-top-2 fixed inset-x-0 top-14 z-40 flex max-h-[calc(100dvh-3.5rem)] flex-col overflow-y-auto border-b border-[var(--border)] shadow-xl duration-200"
            >
              {renderNav(true)}
              {renderFooter()}
            </div>
          </>
        ) : null}
      </div>

      <aside className="bg-surface/80 sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[var(--border)] backdrop-blur-md md:flex">
        <div className="border-b border-[var(--border)] px-4 py-5">
          <Link href="/dashboard" className="group inline-flex">
            <LyamoLogo markClassName="h-9 w-9" />
          </Link>
        </div>
        {renderNav()}
        {renderFooter()}
      </aside>
    </>
  );
}
