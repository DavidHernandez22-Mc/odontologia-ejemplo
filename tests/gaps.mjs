// Finds tall empty bands: vertical stretches of the page (at full width) with no visible text, image or control.
import { chromium } from '@playwright/test';
const base = process.argv[2] || 'http://127.0.0.1:4390';
const b = await chromium.launch({ channel: 'chrome' });
for (const [w, m] of [[1440, false], [390, true]]) {
  const p = await (await b.newContext({ viewport: { width: w, height: 900 }, isMobile: m })).newPage();
  await p.goto(base + '/');
  await p.addStyleTag({ content: '*{transition:none!important;animation:none!important}.rv{opacity:1!important;transform:none!important}' });
  const r = await p.evaluate(() => {
    const H = document.documentElement.scrollHeight;
    const filled = new Uint8Array(H);
    const els = document.querySelectorAll('h1,h2,h3,p,li,dt,dd,img,svg,a.btn,button,input,select,textarea,table,blockquote,figcaption,.phase-bar,.slip,.sheet');
    els.forEach((e) => { if (e.closest('.stage, .demo-bar, .bar')) return; const r = e.getBoundingClientRect(); if (!r.width || !r.height) return; const y0 = Math.max(0, Math.floor(r.top + scrollY)), y1 = Math.min(H, Math.ceil(r.bottom + scrollY)); for (let y = y0; y < y1; y++) filled[y] = 1; });
    const gaps = []; let s = -1;
    for (let y = 0; y <= H; y++) { if (y < H && !filled[y]) { if (s < 0) s = y; } else if (s >= 0) { if (y - s >= 180) { const el = document.elementFromPoint(innerWidth / 2, 10); gaps.push([s, y - s]); } s = -1; } }
    const where = (y) => { const secs = [...document.querySelectorAll('main section[id], .col > section, footer')]; const hit = secs.filter((sec) => { const r = sec.getBoundingClientRect(); return r.top + scrollY <= y && r.bottom + scrollY > y; }).pop(); return hit ? (hit.id || hit.className.split(' ')[0]) : '?'; };
    return { H, gaps: gaps.map(([y, h]) => `${where(y + h / 2)} @${y}: ${h}px`) };
  });
  console.log(`${w}px  alto total ${r.H}  bandas vacías ≥180px: ${r.gaps.length}\n  ` + r.gaps.join('\n  '));
}
await b.close();
