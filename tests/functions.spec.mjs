// Every key function of the site, used the way a visitor would.
// Runs on desktop (1440px) and phone (390px), in Spanish and English.
import { test, expect } from '@playwright/test';

const WA_NUMBER = '573008564773';
const PRIVACY = 'https://david-web.castrod2207.workers.dev/privacidad/';
const L = {
  es: {
    path: '/', h1: 'Clínica Dental Chicó', demoLong: 'Sitio de demostración diseñado por David', demoShort: 'Demo diseñada por David',
    demoMsg: 'Hola David, vi tu demo de la clínica dental y me interesa una web así para mi consultorio.',
    menu: 'Menú', navImplants: 'Implantes', navPrices: 'Precios',
    tooth: 'primera muela de arriba, lado derecho', symptom: 'Me duele al morder o sin razón', plan: 'Endodoncia', price: '$750.000',
    submit: 'Enviar por WhatsApp', errors: ['Escribe tu nombre.', 'Escribe un WhatsApp o un correo para responderte.', 'Escribe el país donde vives.', 'Necesitamos tu autorización para responderte.'],
    name: 'Nombre', contact: 'WhatsApp o correo', country: 'País donde vives', done: 'Tu mensaje está listo.', again: 'Editar mis datos',
    implantsCta: 'Solicitar consulta de implantes', copPrice: '120.000', voiceLabel: 'Ejemplo ilustrativo para la demo', privacy: 'política de privacidad',
  },
  en: {
    path: '/en/', h1: 'Clínica Dental Chicó', demoLong: 'Demo site designed by David', demoShort: 'Demo designed by David',
    demoMsg: "Hi David, I saw your dental clinic demo and I'd like a website like this for my practice.",
    menu: 'Menu', navImplants: 'Implants', navPrices: 'Prices',
    tooth: 'upper right first molar', symptom: 'It hurts when I bite, or for no reason', plan: 'Root canal', price: 'COP 750,000 (≈ US$235)',
    submit: 'Send via WhatsApp', errors: ['Please enter your name.', 'Please enter a WhatsApp number or an email so we can reply.', 'Please enter the country you live in.', 'We need your permission to reply.'],
    name: 'Name', contact: 'WhatsApp or email', country: 'Country you live in', done: 'Your message is ready.', again: 'Edit my details',
    implantsCta: 'Request an implant consultation', copPrice: '120,000', voiceLabel: 'Illustrative example for this demo', privacy: 'privacy policy',
  },
};

// Collect console errors and page crashes for every test; WhatsApp is stubbed so nothing leaves the machine.
test.beforeEach(async ({ page, context }) => {
  page.__errors = [];
  page.on('console', (m) => { if (m.type() === 'error') page.__errors.push(m.text()); });
  page.on('pageerror', (e) => page.__errors.push(String(e)));
  await context.route(/https:\/\/(wa\.me|api\.whatsapp\.com)\/.*/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: 'whatsapp stub' }));
});
test.afterEach(async ({ page }) => {
  // the 404 page itself is reported by the browser as a failed load; that one is expected
  const errors = page.__allow404 ? page.__errors.filter((e) => !/status of 404/.test(e)) : page.__errors;
  expect(errors, 'errores de consola').toEqual([]);
});

const isPhone = (testInfo) => testInfo.project.name === 'celular';
const waText = (href) => decodeURIComponent(new URL(href).searchParams.get('text') || '');

for (const lang of ['es', 'en']) {
  const t = L[lang];

  test.describe(`[${lang}]`, () => {
    test('carga: título principal, franja de demo y una sola h1', async ({ page }, info) => {
      await page.goto(t.path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveAccessibleName(new RegExp(t.h1));
      const bar = page.locator('.demo-bar');
      await expect(bar).toBeVisible();
      if (isPhone(info)) {
        await expect(bar).toContainText(t.demoShort);
        await expect(bar.getByText(t.demoLong)).toBeHidden();
      } else {
        await expect(bar).toContainText(t.demoLong);
        await expect(bar.getByText(t.demoShort)).toBeHidden();
      }
      const demoBtn = bar.getByRole('link');
      expect(await demoBtn.getAttribute('href')).toContain(`wa.me/${WA_NUMBER}`);
      expect(waText(await demoBtn.getAttribute('href'))).toBe(t.demoMsg);
    });

    test('todos los enlaces de WhatsApp van al número y mensaje correctos', async ({ page }) => {
      await page.goto(t.path);
      const hrefs = await page.locator('a[href*="wa.me"]').evaluateAll((as) => as.map((a) => a.href));
      expect(hrefs.length).toBeGreaterThanOrEqual(4);
      for (const h of hrefs) {
        expect(h).toContain(`wa.me/${WA_NUMBER}`);
        expect(waText(h)).toBe(t.demoMsg);
      }
    });

    test('navegación: los enlaces del menú llevan a su sección', async ({ page }, info) => {
      await page.goto(t.path);
      if (isPhone(info)) {
        await page.getByRole('button', { name: t.menu }).click();
        await expect(page.locator('#nav-links')).toBeVisible();
        await page.locator('#nav-links').getByRole('link', { name: t.navPrices, exact: true }).click();
        await expect(page.locator('#nav-links')).toBeHidden();
        await expect(page.locator('#precios')).toBeInViewport();
      } else {
        await page.locator('#nav-links').getByRole('link', { name: t.navImplants, exact: true }).click();
        await expect(page.locator('#implantes')).toBeInViewport();
      }
    });

    test('mapa de la boca: zona + síntoma dan orientación, precio y WhatsApp', async ({ page }) => {
      await page.goto(t.path);
      await page.locator('#mapa').scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: t.tooth, exact: true }).click();
      await page.getByText(t.symptom, { exact: true }).click();
      await expect(page.locator('#r-what')).toHaveText(t.plan);
      await expect(page.locator('#r-price')).toHaveText(t.price);
      await expect(page.locator('#r-tooth')).toContainText(lang === 'es' ? 'Primera muela' : 'Upper right');
      const href = await page.locator('#r-cta').getAttribute('href');
      expect(href).toContain(`wa.me/${WA_NUMBER}`);
      expect(waText(href)).toBe(t.demoMsg);
    });

    test('formulario: valida, abre WhatsApp y permite editar', async ({ page }) => {
      await page.goto(t.path);
      const form = page.locator('#book-form');
      await form.scrollIntoViewIfNeeded();
      await page.getByRole('button', { name: t.submit }).click();
      for (const e of t.errors) await expect(form.getByText(e)).toBeVisible();
      await expect(page.getByLabel(t.name, { exact: true })).toBeFocused();

      await page.getByLabel(t.name, { exact: true }).fill('Ana Prueba');
      await page.getByLabel(t.contact, { exact: true }).fill('+1 305 555 0100');
      await page.getByLabel(t.country, { exact: true }).fill('Canada');
      await page.locator('#f-consent').check();
      const popupPromise = page.waitForEvent('popup');
      await page.getByRole('button', { name: t.submit }).click();
      const popup = await popupPromise;
      expect(popup.url()).toContain(`wa.me/${WA_NUMBER}`);
      expect(waText(popup.url())).toBe(t.demoMsg);
      await popup.close();
      await expect(page.getByText(t.done)).toBeVisible();
      await expect(page.locator('#form-done')).toBeFocused();
    });

    // Error conocido en la línea base: el aviso de confirmación se ve antes de enviar
    // y no se oculta con "Editar mis datos" (un estilo anula el atributo hidden).
    test('formulario: la confirmación solo aparece después de enviar', async ({ page }) => {
      test.fail(process.env.BASELINE === '1', 'Error conocido antes de las mejoras');
      await page.goto(t.path);
      await expect(page.getByText(t.done)).toBeHidden();
      await page.getByLabel(t.name, { exact: true }).fill('Ana Prueba');
      await page.getByLabel(t.contact, { exact: true }).fill('ana@correo.com');
      await page.getByLabel(t.country, { exact: true }).fill('Chile');
      await page.locator('#f-consent').check();
      const popupPromise = page.waitForEvent('popup');
      await page.getByRole('button', { name: t.submit }).click();
      await (await popupPromise).close();
      await expect(page.getByText(t.done)).toBeVisible();
      await page.getByRole('button', { name: t.again }).click();
      await expect(page.getByText(t.done)).toBeHidden();
      await expect(page.getByLabel(t.name, { exact: true })).toBeFocused();
    });

    test('aviso de datos enlaza la política de privacidad', async ({ page }) => {
      await page.goto(t.path);
      const link = page.locator('#book-form').getByRole('link', { name: t.privacy });
      await expect(link).toHaveAttribute('href', PRIVACY);
      await expect(link).toHaveAttribute('target', '_blank');
      await link.click({ modifiers: ['Meta'] }).catch(() => {});
      await expect(page.locator('#f-consent')).not.toBeChecked();
    });

    test('botones de tratamiento preseleccionan el interés del formulario', async ({ page }) => {
      await page.goto(t.path);
      await page.getByRole('link', { name: t.implantsCta }).click();
      await expect(page.locator('#f-interest')).toHaveValue('implants');
      await expect(page.locator('#valoracion')).toBeInViewport();
    });

    test('precios: pesos, aproximado en dólares y tabla internacional', async ({ page }) => {
      await page.goto(t.path);
      await expect(page.locator('#precios')).toContainText(t.copPrice);
      if (lang === 'en') await expect(page.locator('#precios .approx').first()).toContainText('(≈ US$');
      await expect(page.locator('.usd-table tbody tr')).toHaveCount(10);
      await expect(page.locator('.usd-table .usd-value')).toHaveCount(9);
    });

    test('testimonios ilustrativos con su etiqueta', async ({ page }) => {
      await page.goto(t.path);
      const voices = page.locator('#testimonios .voice');
      await expect(voices).toHaveCount(2);
      for (const v of await voices.all()) await expect(v).toContainText(t.voiceLabel);
    });

    test('todas las imágenes cargan y los enlaces internos existen', async ({ page }) => {
      await page.goto(t.path);
      await page.evaluate(() => document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; }));
      await page.waitForFunction(() => !document.querySelector('img[data-src]') && [...document.images].every((i) => i.complete));
      const broken = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.currentSrc || i.src));
      expect(broken).toEqual([]);
      const missing = await page.evaluate(() => [...document.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute('href')).filter((h) => h.length > 1 && !document.querySelector(h)));
      expect(missing).toEqual([]);
    });

    test('con movimiento reducido todo el contenido es visible', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(t.path);
      const hidden = await page.evaluate(() => [...document.querySelectorAll('.rv')].filter((e) => getComputedStyle(e).opacity === '0').length);
      expect(hidden).toBe(0);
    });
  });
}

test('cambio de idioma y memoria de la elección', async ({ page }, info) => {
  await page.goto('/');
  await page.locator('.lang').getByRole('link', { name: 'EN' }).click();
  await expect(page).toHaveURL(/\/en\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.goto('/');
  await expect(page).toHaveURL(/\/en\/$/);
  await page.locator('.lang').getByRole('link', { name: 'ES' }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('la foto fija cambia con la sección (escritorio)', async ({ page }, info) => {
  test.skip(isPhone(info), 'En celular la foto no queda fija');
  await page.goto('/');
  await expect(page.locator('.stage-frame img.is-on')).toHaveAttribute('data-photo', 'sonrisa');
  await page.locator('#tratamientos').scrollIntoViewIfNeeded();
  await page.mouse.wheel(0, 300);
  await expect(page.locator('.stage-frame img.is-on')).not.toHaveAttribute('data-photo', 'sonrisa');
  await expect.poll(() => page.locator('.stage-frame img.is-on').evaluate((i) => i.complete && i.naturalWidth)).toBeGreaterThan(0);
});

test('ruta inexistente: página 404 propia con enlaces al sitio', async ({ page }) => {
  page.__allow404 = true;
  const res = await page.goto('/esta-pagina-no-existe');
  expect(res.status()).toBe(404);
  await expect(page.locator('h1')).toHaveCount(1);
  await page.getByRole('link', { name: 'Ir al inicio' }).click();
  await expect(page).toHaveURL(/127\.0\.0\.1:\d+\/$/);
});

test('favicon disponible', async ({ request }) => {
  for (const f of ['/favicon.svg', '/apple-touch-icon.png']) expect((await request.get(f)).status()).toBe(200);
});

test('las fuentes del sitio cargan desde el propio dominio', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family.replace(/"/g, '')));
  expect(loaded).toEqual(expect.arrayContaining(['Geist', 'Newsreader']));
  const external = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => /fonts\.(googleapis|gstatic)/.test(n)));
  expect(external).toEqual([]);
});
