'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Bot,
  CalendarClock,
  Coins,
  CreditCard,
  Gauge,
  History,
  LayoutDashboard,
  Lock,
  ScanLine,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import type { BillingCurrency } from '@shared/features/billing';
import {
  BillingCurrencySwitcher,
  readStoredBillingCurrency,
} from '@web/features/billing/components/BillingCurrencySwitcher';
import { PlanPriceDisplay } from '@web/features/billing/components/ProPriceDisplay';
import { useT } from '@web/features/i18n/LocaleProvider';
import { ProductShot } from '@web/features/landing/components/ProductShot';
import { MARKETING_SHOTS } from '@web/features/landing/marketing-assets';

const FREE_PRICE_KEYS: Record<BillingCurrency, string> = {
  PLN: 'landing.pricing.free.pricePln',
  EUR: 'landing.pricing.free.priceEur',
  GBP: 'landing.pricing.free.priceGbp',
  USD: 'landing.pricing.free.priceUsd',
};

const FAQ_KEYS = [
  'bank',
  'free',
  'scanner',
  'split',
  'cycle',
  'currency',
  'chat',
  'photos',
  'delete',
  'mobile',
  'cancel',
] as const;

export function LandingPage() {
  const t = useT();
  const [billingCurrency, setBillingCurrency] = useState<BillingCurrency>('PLN');

  useEffect(() => {
    setBillingCurrency(readStoredBillingCurrency() ?? 'PLN');
  }, []);

  const registerHref = `/register?currency=${billingCurrency}`;

  const whyItems = [
    {
      icon: CalendarClock,
      title: t('landing.why.cycle.title'),
      description: t('landing.why.cycle.description'),
      accent: 'text-warm',
    },
    {
      icon: ScanLine,
      title: t('landing.why.scanner.title'),
      description: t('landing.why.scanner.description'),
      accent: 'text-cool',
    },
    {
      icon: Bot,
      title: t('landing.why.ai.title'),
      description: t('landing.why.ai.description'),
      accent: 'text-warm',
    },
  ] as const;

  const controlItems = [
    {
      icon: Gauge,
      title: t('landing.control.limits.title'),
      description: t('landing.control.limits.description'),
    },
    {
      icon: History,
      title: t('landing.control.history.title'),
      description: t('landing.control.history.description'),
    },
    {
      icon: Coins,
      title: t('landing.control.currency.title'),
      description: t('landing.control.currency.description'),
    },
  ] as const;

  const trustItems = [
    {
      icon: Lock,
      title: t('landing.trust.noBank.title'),
      description: t('landing.trust.noBank.description'),
    },
    {
      icon: ShieldCheck,
      title: t('landing.trust.privacy.title'),
      description: t('landing.trust.privacy.description'),
    },
    {
      icon: CreditCard,
      title: t('landing.trust.payments.title'),
      description: t('landing.trust.payments.description'),
    },
    {
      icon: LayoutDashboard,
      title: t('landing.trust.account.title'),
      description: t('landing.trust.account.description'),
    },
  ] as const;

  const freeFeatures = [
    t('landing.pricing.free.feature1'),
    t('landing.pricing.free.feature2'),
    t('landing.pricing.free.feature3'),
    t('landing.pricing.free.feature4'),
  ];

  const proFeatures = [
    t('landing.pricing.pro.feature1'),
    t('landing.pricing.pro.feature2'),
    t('landing.pricing.pro.feature3'),
    t('landing.pricing.pro.feature4'),
  ];

  const premiumFeatures = [
    t('landing.pricing.premium.feature1'),
    t('landing.pricing.premium.feature2'),
    t('landing.pricing.premium.feature3'),
    t('landing.pricing.premium.feature4'),
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 70% 50% at 50% -10%, rgba(232,168,73,0.14), transparent 55%), radial-gradient(ellipse 50% 40% at 90% 20%, rgba(61,214,195,0.10), transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-warm animate-in fade-in mb-4 font-mono text-xs uppercase tracking-[0.25em] duration-700">
              {t('landing.hero.eyebrow')}
            </p>
            <h1 className="font-display animate-in fade-in slide-in-from-bottom-2 text-4xl font-bold tracking-tight text-[var(--text)] duration-700 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              {t('landing.hero.title')}
            </h1>
            <p className="text-muted animate-in fade-in mt-6 text-lg leading-8 duration-1000">
              {t('landing.hero.subtitle')}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={registerHref} className="btn-primary w-full sm:w-auto">
                {t('landing.hero.ctaPrimary')}
              </Link>
              <a href="#dashboard" className="btn-ghost w-full sm:w-auto">
                {t('landing.hero.ctaSecondary')}
              </a>
            </div>
            <p className="text-muted mt-4 font-mono text-xs tracking-wide">
              {t('landing.hero.trustLine')}
            </p>
          </div>

          <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto mt-14 max-w-5xl duration-1000">
            <ProductShot
              src={MARKETING_SHOTS.heroDashboard.src}
              available={MARKETING_SHOTS.heroDashboard.available}
              alt={t('landing.dashboard.title')}
              priority
              aspectClassName="aspect-[16/9.5]"
            />
          </div>
        </div>
      </section>

      {/* Why Lyamo */}
      <section id="features" className="border-y border-[var(--border)] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--text)]">
              {t('landing.why.title')}
            </h2>
            <p className="text-muted mt-4">{t('landing.why.subtitle')}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {whyItems.map((item) => (
              <article key={item.title} className="panel relative z-10 p-6">
                <item.icon className={`relative z-10 h-6 w-6 ${item.accent}`} aria-hidden />
                <h3 className="font-display relative z-10 mt-4 text-lg font-semibold text-[var(--text)]">
                  {item.title}
                </h3>
                <p className="text-muted relative z-10 mt-3 text-sm leading-6">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard showcase */}
      <section id="dashboard" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="text-cool mb-3 font-mono text-xs uppercase tracking-[0.2em]">
                {t('landing.dashboard.eyebrow')}
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--text)]">
                {t('landing.dashboard.title')}
              </h2>
              <p className="text-muted mt-4 text-base leading-7">
                {t('landing.dashboard.subtitle')}
              </p>
            </div>
            <ProductShot
              src={MARKETING_SHOTS.heroDashboard.src}
              available={MARKETING_SHOTS.heroDashboard.available}
              alt={t('landing.dashboard.title')}
              aspectClassName="aspect-[16/10]"
            />
          </div>
        </div>
      </section>

      {/* Scanner */}
      <section id="scanner" className="border-y border-[var(--border)] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="order-2 lg:order-1">
              <ProductShot
                src={MARKETING_SHOTS.featureScannerSplit.src}
                available={MARKETING_SHOTS.featureScannerSplit.available}
                alt={t('landing.scanner.title')}
                aspectClassName="aspect-[16/10]"
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-warm mb-3 font-mono text-xs uppercase tracking-[0.2em]">
                <ScanLine className="mr-2 inline h-3.5 w-3.5" aria-hidden />
                {t('landing.scanner.eyebrow')}
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--text)]">
                {t('landing.scanner.title')}
              </h2>
              <p className="text-muted mt-4 text-base leading-7">{t('landing.scanner.subtitle')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Chat */}
      <section id="ai" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="text-cool mb-3 font-mono text-xs uppercase tracking-[0.2em]">
                <Bot className="mr-2 inline h-3.5 w-3.5" aria-hidden />
                {t('landing.ai.eyebrow')}
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--text)]">
                {t('landing.ai.title')}
              </h2>
              <p className="text-muted mt-4 text-base leading-7">{t('landing.ai.subtitle')}</p>
            </div>
            <ProductShot
              src={MARKETING_SHOTS.featureAiChat.src}
              available={MARKETING_SHOTS.featureAiChat.available}
              alt={t('landing.ai.title')}
              aspectClassName="aspect-[16/11]"
            />
          </div>
        </div>
      </section>

      {/* Control */}
      <section className="border-y border-[var(--border)] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--text)]">
              {t('landing.control.title')}
            </h2>
            <p className="text-muted mt-4">{t('landing.control.subtitle')}</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {controlItems.map((item) => (
              <article key={item.title} className="panel relative z-10 p-6">
                <item.icon className="text-warm relative z-10 h-5 w-5" aria-hidden />
                <h3 className="font-display relative z-10 mt-4 text-base font-semibold text-[var(--text)]">
                  {item.title}
                </h3>
                <p className="text-muted relative z-10 mt-2 text-sm leading-6">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div>
              <p className="text-warm mb-3 font-mono text-xs uppercase tracking-[0.2em]">
                <Smartphone className="mr-2 inline h-3.5 w-3.5" aria-hidden />
                {t('landing.mobile.eyebrow')}
              </p>
              <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--text)]">
                {t('landing.mobile.title')}
              </h2>
              <p className="text-muted mt-4 text-base leading-7">{t('landing.mobile.subtitle')}</p>
            </div>
            <div className="mx-auto w-full max-w-sm">
              <ProductShot
                src={MARKETING_SHOTS.mobileDashboard.src}
                available={MARKETING_SHOTS.mobileDashboard.available}
                alt={t('landing.mobile.title')}
                aspectClassName="aspect-[9/16]"
                frameClassName="rounded-[1.75rem]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="border-y border-[var(--border)] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--text)]">
              {t('landing.trust.title')}
            </h2>
            <p className="text-muted mt-4">{t('landing.trust.subtitle')}</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustItems.map((item) => (
              <article key={item.title} className="panel relative z-10 p-5">
                <item.icon className="text-cool relative z-10 h-5 w-5" aria-hidden />
                <h3 className="font-display relative z-10 mt-3 text-sm font-semibold text-[var(--text)]">
                  {item.title}
                </h3>
                <p className="text-muted relative z-10 mt-2 text-xs leading-5">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-bold tracking-tight text-[var(--text)]">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-muted mt-4">{t('landing.pricing.subtitle')}</p>
            <div className="mt-6 flex flex-col items-center gap-2">
              <p className="text-muted text-sm font-medium">
                {t('billing.labels.paymentCurrency')}
              </p>
              <BillingCurrencySwitcher value={billingCurrency} onChange={setBillingCurrency} />
            </div>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <article className="panel relative z-10 p-8">
              <p className="text-muted relative z-10 font-mono text-xs uppercase tracking-widest">
                FREE
              </p>
              <h3 className="font-display relative z-10 mt-2 text-3xl font-bold text-[var(--text)]">
                {t(FREE_PRICE_KEYS[billingCurrency])}
              </h3>
              <ul className="text-muted relative z-10 mt-6 space-y-3 text-sm">
                {freeFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-cool shrink-0">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={registerHref} className="btn-ghost relative z-10 mt-8 inline-flex">
                {t('landing.pricing.free.cta')}
              </Link>
            </article>

            <article className="panel border-warm/40 relative z-10 p-8 shadow-[0_0_40px_-20px_rgba(232,168,73,0.35)]">
              <div className="relative z-10 flex items-center justify-between gap-2">
                <p className="text-warm font-mono text-xs uppercase tracking-widest">PRO</p>
                <span className="bg-warm/15 text-warm rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider">
                  {t('landing.pricing.featured')}
                </span>
              </div>
              <PlanPriceDisplay
                plan="PRO"
                currency={billingCurrency}
                className="relative z-10 mt-2"
              />
              <ul className="relative z-10 mt-6 space-y-3 text-sm text-[var(--text)]">
                {proFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-warm shrink-0">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={registerHref} className="btn-primary relative z-10 mt-8 inline-flex">
                {t('landing.pricing.pro.cta')}
              </Link>
            </article>

            <article className="panel border-cool/30 relative z-10 p-8">
              <p className="text-cool relative z-10 font-mono text-xs uppercase tracking-widest">
                PREMIUM
              </p>
              <PlanPriceDisplay
                plan="PREMIUM"
                currency={billingCurrency}
                className="relative z-10 mt-2"
              />
              <ul className="relative z-10 mt-6 space-y-3 text-sm text-[var(--text)]">
                {premiumFeatures.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-cool shrink-0">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href={registerHref} className="btn-primary relative z-10 mt-8 inline-flex">
                {t('landing.pricing.premium.cta')}
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-[var(--border)] py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h2 className="font-display text-center text-3xl font-bold tracking-tight text-[var(--text)]">
            {t('landing.faq.title')}
          </h2>
          <div className="mt-10 space-y-3">
            {FAQ_KEYS.map((key) => (
              <details
                key={key}
                className="panel open:border-warm/25 group relative z-10 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="font-display relative z-10 flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[var(--text)] sm:text-base">
                  {t(`landing.faq.${key}.q`)}
                  <span className="text-muted group-open:text-warm shrink-0 font-mono text-lg leading-none transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="text-muted relative z-10 border-t border-[var(--border)] px-5 py-4 text-sm leading-6">
                  {t(`landing.faq.${key}.a`)}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[var(--border)] py-16">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-[var(--text)]">
            {t('landing.cta.title')}
          </h2>
          <p className="text-muted mt-4">{t('landing.cta.subtitle')}</p>
          <Link href={registerHref} className="btn-primary mt-8 inline-flex">
            {t('landing.cta.button')}
          </Link>
          <p className="text-muted mt-4 font-mono text-xs tracking-wide">
            {t('landing.cta.trustLine')}
          </p>
        </div>
      </section>
    </div>
  );
}
