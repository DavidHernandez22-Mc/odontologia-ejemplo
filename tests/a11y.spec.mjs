// Accessibility rules (axe-core, WCAG 2.2 A/AA) on every page, desktop and phone.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const path of ['/', '/en/', '/esta-pagina-no-existe']) {
  test(`accesibilidad ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important} .rv{opacity:1!important;transform:none!important}' });
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const found = r.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    expect(found).toEqual([]);
  });
}

test('teclado: saltar al contenido y elegir un diente con Enter', async ({ page }, info) => {
  test.skip(info.project.name === 'celular', 'Prueba de teclado físico');
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar al contenido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#hero')).toBeFocused();
  const tooth = page.getByRole('button', { name: 'segunda muela de abajo, lado izquierdo', exact: true });
  await tooth.focus();
  const outline = await tooth.locator('rect').evaluate((r) => getComputedStyle(r).stroke);
  expect(outline).toBe('rgb(255, 255, 255)');
  await page.keyboard.press('Enter');
  await expect(tooth).toHaveAttribute('aria-pressed', 'true');
});
