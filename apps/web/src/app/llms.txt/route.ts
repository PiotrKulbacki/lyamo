import { env } from '@web/env';
import { buildLlmsTxt } from '@web/features/seo/llms-txt';

/** /llms.txt for AI assistants (llmstxt.org); built from the same constants as the page. */
export const dynamic = 'force-static';

export function GET() {
  return new Response(buildLlmsTxt(env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
