// Security headers declared in _headers (applied by the local server the same way Netlify does).
import { test, expect } from '@playwright/test';

test('encabezados de seguridad', async ({ request }) => {
  for (const path of ['/', '/en/', '/assets/js/site.js', '/no-existe']) {
    const h = (await request.get(path)).headers();
    expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(h['content-security-policy']).toContain("default-src 'self'");
    expect(h['strict-transport-security']).toContain('max-age=31536000');
    expect(h['x-content-type-options']).toBe('nosniff');
    expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(h['permissions-policy']).toContain('camera=()');
  }
});

test('la CSP no bloquea nada de la página', async ({ page }) => {
  const violations = [];
  page.on('console', (m) => { if (/Content Security Policy/i.test(m.text())) violations.push(m.text()); });
  await page.goto('/');
  await page.locator('#valoracion').scrollIntoViewIfNeeded();
  await page.waitForLoadState('networkidle');
  expect(violations).toEqual([]);
  await expect(page.locator('html')).toHaveClass(/\bjs\b/); // the inline script ran
});
