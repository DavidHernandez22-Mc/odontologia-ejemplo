// Lighthouse (mobile) on each page, 3 runs, median per category.
// Usage: node lighthouse.mjs <output json> [base url]
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { writeFileSync } from 'node:fs';

const out = process.argv[2];
const base = process.argv[3] || 'http://127.0.0.1:4390';
const pages = ['/', '/en/'];
const cats = ['performance', 'accessibility', 'best-practices', 'seo'];
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

const summary = {};
for (const path of pages) {
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new'] });
    const r = await lighthouse(base + path, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: cats });
    const lhr = r.lhr;
    runs.push({
      scores: Object.fromEntries(cats.map((c) => [c, Math.round(lhr.categories[c].score * 100)])),
      lcp: lhr.audits['largest-contentful-paint'].numericValue,
      cls: lhr.audits['cumulative-layout-shift'].numericValue,
      tbt: lhr.audits['total-blocking-time'].numericValue,
      fcp: lhr.audits['first-contentful-paint'].numericValue,
      weight: lhr.audits['total-byte-weight'].numericValue,
      failed: Object.values(lhr.audits).filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'manual' && a.scoreDisplayMode !== 'notApplicable').map((a) => `${a.id} (${a.score})`),
    });
    await chrome.kill();
  }
  summary[path] = {
    ...Object.fromEntries(cats.map((c) => [c, median(runs.map((r) => r.scores[c]))])),
    lcp_ms: Math.round(median(runs.map((r) => r.lcp))),
    fcp_ms: Math.round(median(runs.map((r) => r.fcp))),
    tbt_ms: Math.round(median(runs.map((r) => r.tbt))),
    cls: +median(runs.map((r) => r.cls)).toFixed(3),
    peso_kb: Math.round(median(runs.map((r) => r.weight)) / 1024),
    auditorias_bajas: runs[runs.length - 1].failed,
  };
  console.log(path, JSON.stringify(summary[path]));
}
writeFileSync(out, JSON.stringify(summary, null, 2));
