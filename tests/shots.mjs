// Full-page screenshots of every page on phone (390px) and desktop (1440px).
// Usage: node shots.mjs <output folder> [base url]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const out = process.argv[2];
const base = process.argv[3] || 'http://127.0.0.1:4390';
mkdirSync(out, { recursive: true });
const pages = [['es', '/'], ['en', '/en/'], ['404', '/esta-pagina-no-existe']];
const sizes = [['celular', { width: 390, height: 844 }, true], ['escritorio', { width: 1440, height: 900 }, false]];

const browser = await chromium.launch({ channel: 'chrome' });
for (const [sizeName, viewport, mobile] of sizes) {
  const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  await context.route(/https:\/\/(wa\.me|api\.whatsapp\.com)\/.*/, (r) => r.abort());
  for (const [name, path] of pages) {
    const page = await context.newPage();
    const res = await page.goto(base + path, { waitUntil: 'load' });
    await page.addStyleTag({ content: 'html{scroll-behavior:auto!important}' });
    // walk down the page so every entrance animation and lazy image runs, then back to the top
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += Math.round(viewport.height * 0.6)) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(140);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${name}-${sizeName}.png`, fullPage: true });
    console.log(`${name}-${sizeName}.png  status ${res.status()}`);
    await page.close();
  }
  await context.close();
}
await browser.close();
