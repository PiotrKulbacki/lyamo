import { beforeEach, expect, test, vi } from 'vitest';
const storage = vi.hoisted(() => ({
  access: null as string | null,
  refresh: null as string | null,
}));
vi.mock('react-native-toast-message', () => ({ default: { show: vi.fn() } }));
vi.mock('@mobile/env', () => ({ env: { EXPO_PUBLIC_API_URL: 'https://synthetic.invalid' } }));
vi.mock('@mobile/features/auth/lib/token-storage', () => ({
  getAccessToken: async () => storage.access,
  getRefreshToken: async () => storage.refresh,
  saveTokens: async (access: string, refresh: string) => {
    storage.access = access;
    storage.refresh = refresh;
  },
  clearTokens: async () => {
    storage.access = null;
    storage.refresh = null;
  },
}));
import {
  loginUser,
  refreshCurrentUser,
  logoutUser,
  resetPassword,
  changePassword,
} from './auth.service';
const fetchMock = vi.fn();
const user = { id: 'synthetic-user', email: 'test@example.invalid' };
const reply = (data: object, status = 200) => new Response(JSON.stringify(data), { status });
beforeEach(() => {
  storage.access = null;
  storage.refresh = null;
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
test('mobile login, concurrent refresh/lost response, password change and logout persist replacement credentials', async () => {
  fetchMock.mockResolvedValueOnce(
    reply({ user, accessToken: 'access-1', refreshToken: 'refresh-1' })
  );
  expect((await loginUser({ email: user.email, password: 'synthetic-password' })).ok).toBe(true);
  fetchMock.mockRejectedValueOnce(new Error('lost response'));
  fetchMock.mockResolvedValueOnce(
    reply({ user, accessToken: 'access-2', refreshToken: 'refresh-2' })
  );
  expect(await Promise.all([refreshCurrentUser(), refreshCurrentUser()])).toEqual([user, user]);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(JSON.parse(fetchMock.mock.calls[1]![1].body).refreshToken).toBe('refresh-1');
  expect(JSON.parse(fetchMock.mock.calls[2]![1].body).refreshToken).toBe('refresh-1');
  expect(storage.refresh).toBe('refresh-2');
  fetchMock.mockResolvedValueOnce(
    reply({ ok: true, accessToken: 'access-3', refreshToken: 'refresh-3' })
  );
  expect(
    await changePassword({ currentPassword: 'old', newPassword: 'new', confirmPassword: 'new' })
  ).toBe(true);
  expect(storage.refresh).toBe('refresh-3');
  fetchMock.mockResolvedValueOnce(reply({ success: true }));
  await logoutUser();
  expect(storage.access).toBeNull();
  expect(storage.refresh).toBeNull();
});
test('recovery accepts success, revoked refresh clears storage and network failure preserves retry credentials', async () => {
  fetchMock.mockResolvedValueOnce(reply({ ok: true }));
  expect(
    await resetPassword({ token: 'synthetic-reset', password: 'new', confirmPassword: 'new' })
  ).toBe(true);
  storage.refresh = 'retry-token';
  fetchMock.mockRejectedValue(new Error('offline'));
  expect(await refreshCurrentUser()).toBeNull();
  expect(storage.refresh).toBe('retry-token');
  fetchMock.mockReset().mockResolvedValueOnce(reply({ error: 'auth.errors.sessionExpired' }, 401));
  expect(await refreshCurrentUser()).toBeNull();
  expect(storage.refresh).toBeNull();
});
