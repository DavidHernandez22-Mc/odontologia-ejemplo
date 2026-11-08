// SEO basics on both language versions.
import { test, expect } from '@playwright/test';

const SITE = 'https://odontologiademo1.netlify.app';
for (const [lang, path] of [['es', '/'], ['en', '/en/']]) {
  test(`SEO ${lang}`, async ({ page, request }) => {
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('h1')).toHaveCount(1);
    const title = await page.title();
    expect(title).toContain('Clínica Dental Chicó');
    expect(title.length).toBeLessThanOrEqual(60);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc.length).toBeGreaterThan(50);
    expect(desc.length).toBeLessThanOrEqual(160);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', SITE + path);
    for (const h of ['es', 'en', 'x-default']) await expect(page.locator(`link[rel="alternate"][hreflang="${h}"]`)).toHaveCount(1);
    for (const p of ['og:title', 'og:description', 'og:url', 'og:image', 'og:locale']) await expect(page.locator(`meta[property="${p}"]`)).toHaveCount(1);
    const og = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(og.startsWith(SITE)).toBe(true);
    expect((await request.get(new URL(og).pathname)).status()).toBe(200);
    const imgsWithoutAlt = await page.locator('img:not([alt])').count();
    expect(imgsWithoutAlt).toBe(0);
  });
}

test('sitemap y robots', async ({ request }) => {
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain(`<loc>${SITE}/</loc>`);
  expect(sitemap).toContain(`<loc>${SITE}/en/</loc>`);
  expect(sitemap).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  expect(await (await request.get('/robots.txt')).text()).toContain(`Sitemap: ${SITE}/sitemap.xml`);
});
