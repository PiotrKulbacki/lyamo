'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FolderOpen, ImageIcon, X, ZoomIn } from 'lucide-react';
import { toast } from 'sonner';
import { translateError } from '@shared/features/i18n';
import { useLocale, useT } from '@web/features/i18n/LocaleProvider';
import { cn } from '@web/lib/utils';

export type ReceiptArchiveDocument = {
  receiptGroupId: string;
  receiptImageUrl: string;
  previewUrl: string;
  description: string | null;
  date: string;
  totalAmount: number;
  currency: string;
};

type MonthBucket = {
  key: string;
  year: number;
  month: number;
  documents: ReceiptArchiveDocument[];
};

type DayBucket = {
  key: string;
  day: number;
  month: number;
  documents: ReceiptArchiveDocument[];
};

type ReceiptArchiveProps = {
  refreshKey?: number;
};

function formatMoney(amount: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function groupDocumentsByMonth(documents: ReceiptArchiveDocument[]): MonthBucket[] {
  const buckets = new Map<string, MonthBucket>();

  for (const document of documents) {
    const date = new Date(document.date);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, '0')}`;

    const bucket = buckets.get(key) ?? {
      key,
      year,
      month,
      documents: [],
    };

    bucket.documents.push(document);
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((left, right) => {
    if (left.year !== right.year) {
      return right.year - left.year;
    }

    return right.month - left.month;
  });
}

function groupDocumentsByDay(documents: ReceiptArchiveDocument[]): DayBucket[] {
  const buckets = new Map<string, DayBucket>();

  for (const document of documents) {
    const date = new Date(document.date);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const key = `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}`;

    const bucket = buckets.get(key) ?? {
      key,
      day,
      month,
      documents: [],
    };

    bucket.documents.push(document);
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((left, right) => {
    if (left.month !== right.month) {
      return right.month - left.month;
    }

    return right.day - left.day;
  });
}

function ArchiveSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="bg-elevated h-32 animate-pulse rounded-2xl" />
      ))}
    </div>
  );
}

function ReceiptPreviewModal({
  document,
  locale,
  onClose,
}: {
  document: ReceiptArchiveDocument;
  locale: string;
  onClose: () => void;
}) {
  const t = useT();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('scanner.archive.previewTitle')}
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-[var(--surface)] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
          aria-label={t('scanner.archive.closePreview')}
        >
          <X className="h-4 w-4" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={document.previewUrl}
          alt={document.description ?? t('scanner.archive.untitledDocument')}
          className="max-h-[70vh] w-full bg-black/5 object-contain"
        />
        <div className="border-t border-[var(--border)] p-4">
          <p className="font-display text-lg font-semibold text-[var(--text)]">
            {document.description ?? t('scanner.archive.untitledDocument')}
          </p>
          <p className="text-muted mt-1 text-sm">
            {formatMoney(document.totalAmount, document.currency, locale)}
          </p>
        </div>
      </div>
    </div>
  );
}

function DocumentCard({
  document,
  locale,
  onPreview,
}: {
  document: ReceiptArchiveDocument;
  locale: string;
  onPreview: (document: ReceiptArchiveDocument) => void;
}) {
  const t = useT();
  const title = document.description ?? t('scanner.archive.untitledDocument');

  return (
    <article className="bg-elevated/60 hover:border-[var(--cool)]/40 group overflow-hidden rounded-xl border border-[var(--border-cool)] transition hover:shadow-md">
      <button
        type="button"
        onClick={() => onPreview(document)}
        className="relative block w-full overflow-hidden"
        aria-label={t('scanner.archive.previewAction', { name: title })}
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-[var(--surface)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={document.previewUrl}
            alt={title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
          <ZoomIn className="h-4 w-4" />
        </span>
      </button>

      <div className="space-y-3 p-3">
        <div>
          <p className="truncate text-sm font-semibold text-[var(--text)]">{title}</p>
          <p className="text-muted mt-0.5 text-xs">
            {formatMoney(document.totalAmount, document.currency, locale)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onPreview(document)}
            className="btn-ghost h-8 px-3 text-xs"
          >
            <ImageIcon className="mr-1.5 h-3.5 w-3.5" />
            {t('scanner.archive.previewActionShort')}
          </button>
          <Link
            href={`/history?receiptGroupId=${encodeURIComponent(document.receiptGroupId)}`}
            className="btn-ghost inline-flex h-8 items-center px-3 text-xs"
          >
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            {t('scanner.archive.viewTransactions')}
          </Link>
        </div>
      </div>
    </article>
  );
}

export function ReceiptArchive({ refreshKey = 0 }: ReceiptArchiveProps) {
  const t = useT();
  const { locale } = useLocale();
  const [documents, setDocuments] = useState<ReceiptArchiveDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openMonthKey, setOpenMonthKey] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<ReceiptArchiveDocument | null>(null);

  const monthBuckets = useMemo(() => groupDocumentsByMonth(documents), [documents]);

  const loadArchive = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/receipts/archive');
      const data = (await response.json()) as {
        documents?: ReceiptArchiveDocument[];
        error?: string;
      };

      if (!response.ok) {
        toast.error(translateError(data.error ?? 'scanner.archive.errors.loadFailed', locale));
        return;
      }

      setDocuments(data.documents ?? []);
    } catch {
      toast.error(t('auth.errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  }, [locale, t]);

  useEffect(() => {
    void loadArchive();
  }, [loadArchive, refreshKey]);

  return (
    <section className="panel relative z-10 p-6">
      <div className="relative z-10">
        <h2 className="font-display text-lg font-semibold text-[var(--text)]">
          {t('scanner.archive.title')}
        </h2>
        <p className="text-muted mt-1 text-sm">{t('scanner.archive.subtitle')}</p>
      </div>

      <div className="relative z-10 mt-6">
        {isLoading ? (
          <ArchiveSkeleton />
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border-cool)] py-12 text-center">
            <span className="bg-cool/10 text-cool flex h-14 w-14 items-center justify-center rounded-2xl">
              <FolderOpen className="h-7 w-7" />
            </span>
            <p className="mt-4 max-w-sm text-sm font-medium text-[var(--text)]">
              {t('scanner.archive.emptyTitle')}
            </p>
            <p className="text-muted mt-1 max-w-sm text-sm">{t('scanner.archive.emptyHint')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {monthBuckets.map((month) => {
              const isOpen = openMonthKey === month.key;
              const dayBuckets = groupDocumentsByDay(month.documents);

              return (
                <div
                  key={month.key}
                  className="bg-[var(--surface)]/40 overflow-hidden rounded-2xl border border-[var(--border-cool)]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenMonthKey(isOpen ? null : month.key)}
                    className="hover:bg-elevated/40 flex w-full items-center gap-4 p-4 text-left transition sm:p-5"
                    aria-expanded={isOpen}
                  >
                    <span className="bg-cool/10 text-cool flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
                      <FolderOpen className="h-6 w-6" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-display block text-xl font-bold tracking-tight text-[var(--text)]">
                        {String(month.month).padStart(2, '0')} / {month.year}
                      </span>
                      <span className="text-muted mt-0.5 block text-sm">
                        {t('scanner.archive.documentCount', { count: month.documents.length })}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'text-muted text-sm transition-transform duration-300',
                        isOpen && 'rotate-180'
                      )}
                    >
                      ▾
                    </span>
                  </button>

                  <div
                    className={cn(
                      'grid transition-[grid-template-rows] duration-300 ease-in-out',
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="space-y-6 border-t border-[var(--border)] px-4 pb-5 pt-4 sm:px-5">
                        {dayBuckets.map((day) => (
                          <div key={day.key}>
                            <h3 className="text-muted mb-3 text-xs font-semibold uppercase tracking-wide">
                              {day.key}
                            </h3>
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                              {day.documents.map((document) => (
                                <DocumentCard
                                  key={document.receiptGroupId}
                                  document={document}
                                  locale={locale}
                                  onPreview={setPreviewDocument}
                                />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewDocument && (
        <ReceiptPreviewModal
          document={previewDocument}
          locale={locale}
          onClose={() => setPreviewDocument(null)}
        />
      )}
    </section>
  );
}
