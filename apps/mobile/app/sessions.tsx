import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { DEFAULT_LOCALE, t } from '@shared/features/i18n';
import { apiRequest, showError } from '@mobile/features/auth/services/auth.service';
import { useAuth } from '@mobile/features/auth/hooks/useAuth';
type Session = { id: string; kind: string; lastSeenAt: string; current: boolean };
export default function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [busy, setBusy] = useState(false);
  const { logout } = useAuth();
  const locale = DEFAULT_LOCALE;
  const load = useCallback(async () => {
    const result = await apiRequest<{ sessions: Session[] }>('/api/auth/sessions');
    if (result.error) showError(result.error);
    else setSessions(result.data?.sessions ?? []);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function revoke(session?: Session) {
    setBusy(true);
    try {
      const result = await apiRequest('/api/auth/sessions', {
        method: 'DELETE',
        body: JSON.stringify(session ? { id: session.id } : { all: true }),
      });
      if (result.error) {
        showError(result.error);
        return;
      }
      if (!session || session.current) await logout();
      else await load();
    } finally {
      setBusy(false);
    }
  }
  return (
    <ScrollView contentContainerStyle={{ padding: 24, gap: 16 }}>
      <Text>{t('security.sessions', locale)}</Text>
      <Text>{t('security.description', locale)}</Text>
      {sessions.map((session) => (
        <Pressable key={session.id} disabled={busy} onPress={() => void revoke(session)}>
          <Text>
            {t(session.kind === 'mobile' ? 'security.mobile' : 'security.web', locale)}{' '}
            {session.current ? t('security.current', locale) : ''} ·{' '}
            {new Date(session.lastSeenAt).toLocaleString(locale)} ·{' '}
            {t('auth.labels.logout', locale)}
          </Text>
        </Pressable>
      ))}
      <Pressable disabled={busy} onPress={() => void revoke()}>
        <Text>{t('security.logoutAll', locale)}</Text>
      </Pressable>
    </ScrollView>
  );
}
