// Phone audit: horizontal overflow, elements wider than the screen, and tap targets under 44px.
// Usage: node mobile-audit.mjs [base url]
import { chromium } from '@playwright/test';
const base = process.argv[2] || 'http://127.0.0.1:4390';
const browser = await chromium.launch({ channel: 'chrome' });
for (const width of [320, 360, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 }, isMobile: true, hasTouch: true });
  for (const path of ['/', '/en/']) {
    const page = await ctx.newPage();
    await page.goto(base + path);
    await page.addStyleTag({ content: '*{transition:none!important;animation:none!important} .rv{opacity:1!important;transform:none!important}' });
    const r = await page.evaluate(() => {
      const vw = innerWidth;
      const wide = [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && b.right > vw + 1 && !e.closest('.stage-drift, .foot, .contact'); }).slice(0, 6).map((e) => e.tagName + '.' + String(e.className.baseVal ?? e.className).split(' ')[0] + ' ' + Math.round(e.getBoundingClientRect().right));
      const inlineLink = (e) => e.tagName === 'A' && e.closest('p, li, dd, figcaption') && !e.classList.contains('btn') && getComputedStyle(e).display === 'inline';
      const small = [...document.querySelectorAll('a[href], button, input, select, textarea, label.chip, [role="button"]')]
        .filter((e) => e.offsetParent !== null || e.getClientRects().length)
        .filter((e) => !inlineLink(e))
        .map((e) => { const b = e.getBoundingClientRect(); return { e, w: b.width, h: b.height }; })
        .filter(({ w, h }) => w && h && (w < 44 || h < 44))
        .map(({ e, w, h }) => `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}.${String(e.className.baseVal ?? e.className).split(' ')[0]} "${(e.getAttribute('aria-label') || e.textContent || e.value || '').trim().slice(0, 24)}" ${Math.round(w)}x${Math.round(h)}`);
      const counts = {}; small.forEach((s) => { const k = s.replace(/ "[^"]*"/, '').replace(/ \d+x\d+$/, ''); counts[k] = (counts[k] || 0) + 1; });
      return { overflow: document.documentElement.scrollWidth - vw, wide, smallKinds: counts, examples: [...new Set(small)].slice(0, 30) };
    });
    console.log(`--- ${path} ${width}px  desbordamiento ${r.overflow}px`);
    if (r.wide.length) console.log('  anchos:', r.wide.join(' | '));
    console.log('  objetivos < 44px:', JSON.stringify(r.smallKinds));
    if (width === 390 && path === '/') console.log('  ' + r.examples.join('\n  '));
    await page.close();
  }
  await ctx.close();
}
await browser.close();
