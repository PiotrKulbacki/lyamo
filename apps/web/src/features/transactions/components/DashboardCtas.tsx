'use client';

import { Plus, Camera } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@web/components/ui/button';
import { useT } from '@web/features/i18n/LocaleProvider';

type ScanQuota = {
  used: number;
  limit: number;
  remaining: number;
};

type DashboardCtasProps = {
  onAddManual: () => void;
  scanQuota: ScanQuota | null;
  plan: 'FREE' | 'PRO';
};

export function DashboardCtas({ onAddManual, scanQuota, plan }: DashboardCtasProps) {
  const t = useT();

  return (
    <section className="flex flex-wrap items-center gap-2">
      <Button type="button" size="default" onClick={onAddManual}>
        <Plus className="h-4 w-4" />
        {t('dashboard.cta.addManual')}
      </Button>

      <Button asChild variant="outline" size="default" className="relative">
        <Link href="/scanner">
          <Camera className="h-4 w-4" />
          {plan === 'FREE' && scanQuota
            ? t('dashboard.cta.scanWithQuota', {
                used: scanQuota.used,
                limit: scanQuota.limit,
              })
            : t('dashboard.cta.scan')}
        </Link>
      </Button>
    </section>
  );
}
