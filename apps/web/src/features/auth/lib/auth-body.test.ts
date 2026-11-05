import { expect, test } from 'vitest';
import { readAuthBody, AuthBodyError } from './auth-body';
const request = (body: string, headers = {}) =>
  new Request('https://local.invalid', {
    method: 'POST',
    headers,
    body,
  });
test('bounds streamed bytes even with absent or forged Content-Length', async () => {
  for (const headers of [{}, { 'content-length': '1' }])
    await expect(
      readAuthBody(request(JSON.stringify({ password: 'a'.repeat(17000) }), headers))
    ).rejects.toMatchObject({ status: 413 });
});
test.each(['null', '[]', '1', '{bad'])('rejects non-object or invalid JSON: %s', async (body) => {
  await expect(readAuthBody(request(body))).rejects.toBeInstanceOf(AuthBodyError);
});
test('accepts bounded JSON objects', async () => {
  expect(await readAuthBody(request('{"token":"synthetic"}'))).toEqual({ token: 'synthetic' });
});
