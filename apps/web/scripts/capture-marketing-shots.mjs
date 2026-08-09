/**
 * Capture AI chat marketing screenshot (assumes hero already captured).
 * Usage: node apps/web/scripts/capture-marketing-shots.mjs chat
 */
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../../..');
const outDir = resolve(root, 'apps/web/public/marketing');
const mode = process.argv[2] ?? 'all';

function loadEnv() {
  const envPath = resolve(root, '.env');
  const text = readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function dismissCookies(page) {
  const acceptCookies = page.getByRole('button', {
    name: /akceptuj|accept|zgadzam|wszystkie/i,
  });
  if (await acceptCookies.count()) {
    await acceptCookies
      .first()
      .click()
      .catch(() => {});
    await page.waitForTimeout(400);
  }
}

/** Wait until animated dashboard widgets finish loading. */
async function waitForDashboardReady(page) {
  // Start listening before widgets finish scheduling their fetches.
  const insightsResponse = page
    .waitForResponse((res) => res.url().includes('/api/dashboard/insights') && res.ok(), {
      timeout: 120000,
    })
    .catch(() => null);

  // Donut chart: Recharts renders SVG path segments once data is ready.
  // IMPORTANT: options must be the 3rd arg — 2nd is `arg` in Playwright.
  await page.waitForFunction(
    () => document.querySelectorAll('main svg path').length >= 3,
    undefined,
    { timeout: 90000 }
  );
  console.log('Donut SVG paths ready');

  const insightsRes = await insightsResponse;
  if (insightsRes) {
    console.log('Insights API status:', insightsRes.status());
  } else {
    console.log('Insights API wait timed out — clicking refresh');
    const refresh = page.getByRole('button', {
      name: /Odśwież spostrzeżenie|Refresh insight|Einblick aktualisieren/i,
    });
    if (await refresh.count()) {
      await refresh.first().click();
      await page
        .waitForResponse((res) => res.url().includes('/api/dashboard/insights') && res.ok(), {
          timeout: 120000,
        })
        .catch(() => null);
    }
  }

  // Wait for real insight metric text (not empty / skeleton).
  await page.waitForFunction(
    () => {
      const stillSkeleton =
        Array.from(document.querySelectorAll('main .animate-pulse')).filter((el) =>
          el.className.includes('h-3')
        ).length >= 2;
      if (stillSkeleton) return false;

      // Insight metric uses font-display + font-semibold at text-sm.
      const metrics = Array.from(document.querySelectorAll('main p.font-display.text-sm'));
      return metrics.some((el) => (el.textContent ?? '').trim().length > 5);
    },
    undefined,
    { timeout: 120000 }
  );
  console.log('AI insights content ready');

  // Extra settle time for chart animation / paint
  await page.waitForTimeout(3000);
}

async function main() {
  loadEnv();
  mkdirSync(outDir, { recursive: true });

  const prisma = new PrismaClient();
  const user =
    (await prisma.user.findFirst({
      where: { emailVerifiedAt: { not: null } },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })) ??
    (await prisma.user.findFirst({
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    }));
  if (!user) throw new Error('No users in database — cannot capture authenticated shots.');

  const token = randomBytes(32).toString('hex');
  await prisma.session.create({
    data: {
      userId: user.id,
      token: hashToken(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  const baseUrl = 'http://127.0.0.1:3000';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1100 },
    deviceScaleFactor: 2,
    locale: 'pl-PL',
  });
  const consentValue = encodeURIComponent(
    JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      decidedAt: new Date().toISOString(),
      version: 1,
    })
  );

  await context.addCookies([
    {
      name: 'sec_session',
      value: token,
      domain: '127.0.0.1',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'sec_locale',
      value: 'pl',
      domain: '127.0.0.1',
      path: '/',
      sameSite: 'Lax',
    },
    {
      name: 'sec_cookie_consent',
      value: consentValue,
      domain: '127.0.0.1',
      path: '/',
      sameSite: 'Lax',
    },
  ]);

  const page = await context.newPage();
  page.setDefaultTimeout(180000);

  async function shot(pathSeg, outName, { waitDashboard = false } = {}) {
    await page.goto(`${baseUrl}${pathSeg}`, { waitUntil: 'domcontentloaded' });
    console.log(`${outName} URL:`, page.url());
    if (page.url().includes('/login')) {
      throw new Error(`Auth cookie rejected on ${pathSeg}`);
    }
    await dismissCookies(page);
    if (waitDashboard) {
      console.log('Waiting for donut + AI insights…');
      await waitForDashboardReady(page);
    } else {
      await page.waitForTimeout(6000);
    }
    const main = page.locator('main').first();
    const outPath = resolve(outDir, outName);
    if (await main.count()) {
      await main.screenshot({ path: outPath, type: 'png' });
    } else {
      await page.screenshot({ path: outPath, type: 'png' });
    }
    console.log('Wrote', outName);
  }

  if (mode === 'all' || mode === 'dashboard') {
    await shot('/dashboard', 'hero-dashboard.png', { waitDashboard: true });
  }
  if (mode === 'all' || mode === 'chat') {
    await shot('/chat', 'feature-ai-chat.png');
  }

  await browser.close();
  await prisma.session.deleteMany({ where: { token: hashToken(token) } });
  await prisma.$disconnect();
  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
