'use client';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useT, useLocale } from '@web/features/i18n/LocaleProvider';
import { translateError } from '@shared/features/i18n';

type Entry = { id: string; kind: string; createdAt: string; lastSeenAt: string; current: boolean };
export function SessionsSection({ hasPassword }: { hasPassword: boolean }) {
  const t = useT();
  const { locale } = useLocale();
  const [sessions, setSessions] = useState<Entry[]>([]);
  const [events, setEvents] = useState<Array<{ id: string; kind: string; createdAt: string }>>([]);
  const [googleLinked, setGoogleLinked] = useState(true);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/sessions');
      const data = await response.json();
      if (!response.ok) throw new Error();
      setGoogleLinked(data.googleLinked);
      setSessions(data.sessions);
      setEvents(data.events);
    } catch {
      toast.error(t('auth.errors.generic'));
    }
  }, [t]);
  useEffect(() => {
    void load();
  }, [load]);
  async function mutate(path: string, method: string, body: object) {
    setBusy(true);
    try {
      const response = await fetch(path, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(translateError(data.error, locale));
        return;
      }
      setPassword('');
      if (path.endsWith('reauth')) toast.success(t('security.confirmed'));
      else if (
        'all' in body ||
        ('id' in body && sessions.some((s) => s.id === body.id && s.current))
      )
        window.location.assign('/login');
      await load();
    } catch {
      toast.error(t('auth.errors.networkError'));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="space-y-3 rounded-xl border p-4">
      <h2>{t('security.sessions')}</h2>
      <p>{t('security.description')}</p>
      {sessions.map((s) => (
        <div key={s.id} className="flex flex-wrap items-center gap-3">
          <span>
            {s.kind === 'mobile' ? t('security.mobile') : t('security.web')}{' '}
            {s.current ? t('security.current') : ''} ·{' '}
            {new Date(s.lastSeenAt).toLocaleString(locale)}
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => void mutate('/api/auth/sessions', 'DELETE', { id: s.id })}
          >
            {t('auth.labels.logout')}
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={busy}
        onClick={() => void mutate('/api/auth/sessions', 'DELETE', { all: true })}
      >
        {t('security.logoutAll')}
      </button>
      <h3>{t('security.reauthenticate')}</h3>
      {hasPassword ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void mutate('/api/auth/reauth', 'POST', { password });
          }}
          className="flex flex-wrap gap-3"
        >
          <label>
            {t('auth.labels.currentPassword')}
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={1024}
            />
          </label>
          <button disabled={busy} type="submit">
            {t('security.confirm')}
          </button>
        </form>
      ) : (
        <a href="/api/auth/google?purpose=reauth">{t('auth.labels.continueWithGoogle')}</a>
      )}
      {!googleLinked && <a href="/api/auth/google?purpose=link">{t('security.linkGoogle')}</a>}
      <h3>{t('security.notifications')}</h3>
      {events.map((e) => (
        <p key={e.id}>
          {t(`security.events.${e.kind}`)} · {new Date(e.createdAt).toLocaleString(locale)}
        </p>
      ))}
    </section>
  );
}
