// Prints the details behind Lighthouse's weakest audits for one page.
import lighthouse from 'lighthouse';
import * as cl from 'chrome-launcher';
const url = process.argv[2] || 'http://127.0.0.1:4390/';
const c = await cl.launch({ chromeFlags: ['--headless=new'] });
const { lhr } = await lighthouse(url, { port: c.port, logLevel: 'error', onlyCategories: ['performance', 'best-practices'] });
const a = lhr.audits;
const items = (id) => JSON.stringify(a[id]?.details?.items?.slice?.(0, 6) ?? a[id]?.displayValue ?? '').slice(0, 700);
for (const id of (process.argv[3] || 'lcp-breakdown-insight,render-blocking-insight,network-dependency-tree-insight').split(',')) console.log(`== ${id} (${a[id]?.score})\n${items(id)}\n`);
await c.kill();
