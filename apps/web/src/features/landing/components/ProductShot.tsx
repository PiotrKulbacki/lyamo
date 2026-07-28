'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useT } from '@web/features/i18n/LocaleProvider';

type ProductShotProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  frameClassName?: string;
  aspectClassName?: string;
  /** Cover (crop) vs contain (full UI visible). Default: cover. */
  objectFit?: 'cover' | 'contain';
  /** Show fake browser chrome. Default: true. Use false for phone frames. */
  showChrome?: boolean;
};

export function ProductShot({
  src,
  alt,
  priority = false,
  className = '',
  frameClassName = '',
  aspectClassName = 'aspect-[16/10]',
  objectFit = 'cover',
  showChrome = true,
}: ProductShotProps) {
  const t = useT();
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`border-warm/15 from-elevated/80 to-surface/90 relative overflow-hidden rounded-2xl border bg-gradient-to-br shadow-[0_0_0_1px_rgba(232,168,73,0.06),0_24px_80px_-32px_rgba(0,0,0,0.85)] ${frameClassName}`}
    >
      {showChrome ? (
        <div
          className="bg-[var(--void)]/80 flex items-center gap-1.5 border-b border-[var(--border)] px-3 py-2.5"
          aria-hidden
        >
          <span className="bg-elevated h-2 w-2 rounded-full" />
          <span className="bg-elevated h-2 w-2 rounded-full" />
          <span className="bg-elevated h-2 w-2 rounded-full" />
        </div>
      ) : null}
      <div className={`relative ${aspectClassName} bg-[var(--void)] ${className}`}>
        {failed ? (
          <div className="text-muted flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em]">
              {t('landing.shot.missing')}
            </p>
            <p className="max-w-sm text-sm opacity-70">{src.replace('/marketing/', '')}</p>
          </div>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 100vw, 1100px"
            className={
              objectFit === 'contain' ? 'object-contain object-top' : 'object-cover object-top'
            }
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
}
