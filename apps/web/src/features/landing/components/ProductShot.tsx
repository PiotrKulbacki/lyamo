'use client';

import { useState } from 'react';
import Image from 'next/image';
import * as Dialog from '@radix-ui/react-dialog';
import { Expand, X } from 'lucide-react';
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
  /** Click to open a full-size lightbox. */
  expandable?: boolean;
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
  expandable = false,
}: ProductShotProps) {
  const t = useT();
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);

  const imageClassName =
    objectFit === 'contain' ? 'object-contain object-top' : 'object-cover object-top';

  // PNG marketing shots are already sharp 2x captures — skip Next optimizer
  // so text stays crisp in preview and lightbox.
  const unoptimized = src.endsWith('.png');

  const frame = (
    <div
      className={`border-warm/15 from-elevated/80 to-surface/90 relative overflow-hidden rounded-2xl border bg-gradient-to-br shadow-[0_0_0_1px_rgba(232,168,73,0.06),0_24px_80px_-32px_rgba(0,0,0,0.85)] ${frameClassName}`}
    >
      {showChrome ? (
        <div
          className="bg-(--void)/80 border-(--border) flex items-center gap-1.5 border-b px-3 py-2.5"
          aria-hidden
        >
          <span className="bg-elevated h-2 w-2 rounded-full" />
          <span className="bg-elevated h-2 w-2 rounded-full" />
          <span className="bg-elevated h-2 w-2 rounded-full" />
        </div>
      ) : null}
      <div className={`relative ${aspectClassName} bg-(--void) ${className}`}>
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
            unoptimized={unoptimized}
            quality={unoptimized ? undefined : 92}
            sizes={
              expandable ? '(max-width: 1024px) 100vw, 1400px' : '(max-width: 1024px) 100vw, 1200px'
            }
            className={imageClassName}
            onError={() => setFailed(true)}
          />
        )}
        {expandable && !failed ? (
          <div className="from-(--void)/80 pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-3 pb-3 pt-10">
            <span className="text-muted inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em]">
              <Expand className="h-3 w-3" aria-hidden />
              {t('landing.shot.expandHint')}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!expandable || failed) {
    return frame;
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="focus-visible:ring-warm/40 group block w-full cursor-pointer text-left transition hover:brightness-[1.03] focus-visible:outline-none focus-visible:ring-2"
          aria-label={t('landing.shot.expandAria', { alt })}
        >
          {frame}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-void/90 fixed inset-0 z-50 backdrop-blur-sm" />
        <Dialog.Content className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed inset-3 z-50 flex outline-none sm:inset-6 lg:inset-10">
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <Dialog.Description className="sr-only">
            {t('landing.shot.expandHint')}
          </Dialog.Description>
          <div className="border-warm/20 bg-void relative flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border shadow-[0_24px_80px_-24px_rgba(0,0,0,0.9)]">
            <div className="border-(--border) flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3">
              <p className="text-muted truncate font-mono text-xs tracking-wide">{alt}</p>
              <Dialog.Close
                type="button"
                className="text-muted hover:bg-elevated/60 hover:text-(--text) focus-visible:ring-warm/40 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2"
                aria-label={t('landing.shot.close')}
              >
                <X className="h-4 w-4" aria-hidden />
              </Dialog.Close>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
              {/* Native img at full resolution — no Next resize in lightbox */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt} className="mx-auto h-auto w-full max-w-6xl object-contain" />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
