// Draws every page's link-preview card into public/og/ (1200×630 JPEGs).
//
//   npm run dev      # in one terminal
//   npm run og       # in another (needs Playwright: npm i -D playwright, or a global install)
//
// Each card's vines are grown from its key, so running this again draws the same
// garden; only new pages or changed titles come out different.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// require, so a global Playwright install is found as well as a local one
const { chromium } = createRequire(import.meta.url)('playwright');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.OG_BASE ?? 'http://localhost:3000';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, reducedMotion: 'reduce' });
await page.goto(`${base}/og-card`);
const keys = await page.$$eval('a[data-key]', (as) => as.map((a) => a.dataset.key));
if (!keys.length) throw new Error(`No cards at ${base}/og-card (is the dev server running?)`);

for (const key of keys) {
  await page.goto(`${base}/og-card/${key}`);
  await page.waitForSelector('.og-hero[data-grown]');
  // keep the dev server's own badge out of the picture
  await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
  const file = join(root, 'public/og', `${key}.jpg`);
  mkdirSync(dirname(file), { recursive: true });
  await page.locator('.og-share').screenshot({ path: file, type: 'jpeg', quality: 86 });
  console.log(`public/og/${key}.jpg`);
}
await browser.close();

writeFileSync(join(root, 'src/og/made.json'), JSON.stringify(keys, null, 2) + '\n');
console.log(`${keys.length} cards; src/og/made.json lists them`);
