'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-void p-8">
        <div className="panel max-w-md p-8 text-center">
          <h1 className="relative z-10 font-display text-2xl font-bold text-[var(--text)]">
            Something went wrong
          </h1>
          <p className="relative z-10 mt-2 text-sm text-muted">An unexpected error occurred.</p>
          <button type="button" onClick={reset} className="btn-primary relative z-10 mt-6">
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
