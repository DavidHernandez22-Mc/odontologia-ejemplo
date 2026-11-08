// Genera las páginas en español (/) e inglés (/en/) a partir de una sola plantilla.
// Uso: node build.mjs          (genera)
//      node build.mjs --check  (solo valida, no escribe)
// Sin dependencias. Node 18+.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(root, p), 'utf8');
const checkOnly = process.argv.includes('--check');

const cfg = JSON.parse(read('src/config.json'));
const template = read('src/template.html');
const dicts = { es: JSON.parse(read('src/i18n/es.json')), en: JSON.parse(read('src/i18n/en.json')) };
const errors = [];

// Ancho real de la variante grande de cada imagen (la pequeña siempre es 800px).
const IMAGES = {
  'sonrisa-vertical': [1600, 2400], 'consultorio-ventana': [1400, 2100], 'alineadores': [1400, 1000],
  'radiografias': [1600, 1067], 'espejo': [1400, 1866], 'consultorio-madera': [1600, 1067],
  'sonrisa-risa': [1600, 2400], 'sonrisa-detalle': [1600, 2400], 'implante-mano': [1400, 2100],
  'implante-modelo': [1600, 1200],
};

// 1. Los dos idiomas deben tener exactamente las mismas claves.
function keys(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keys(v, prefix + k + '.') : [prefix + k]);
}
const esKeys = new Set(keys(dicts.es));
const enKeys = new Set(keys(dicts.en));
for (const k of esKeys) if (!enKeys.has(k)) errors.push(`Falta en en.json: ${k}`);
for (const k of enKeys) if (!esKeys.has(k)) errors.push(`Falta en es.json: ${k}`);

const lookup = (obj, path) => path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const escAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const escText = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function render(lang) {
  const t = dicts[lang];
  const other = lang === 'es' ? 'en' : 'es';
  const urlEs = cfg.siteUrl + '/';
  const urlEn = cfg.siteUrl + '/en/';
  const special = {
    lang, base: lang === 'es' ? '' : '../',
    url: lang === 'es' ? urlEs : urlEn, urlEs, urlEn,
    altUrl: lang === 'es' ? 'en/' : '../', altLang: other,
  };
  const nf = new Intl.NumberFormat(t.js.numberLocale);
  const cop = (key) => {
    const n = cfg.pricesCop[key];
    if (typeof n !== 'number') { errors.push(`[${lang}] precio COP inexistente: ${key}`); return ''; }
    return n;
  };
  const rate = cfg.usdRate.copPerUsd;
  const usdApprox = (n) => { const v = n / rate; return v < 100 ? Math.round(v) : Math.round(v / 5) * 5; };
  const usdNf = new Intl.NumberFormat('en-US');
  // In English, peso prices carry the approximate dollar amount in brackets.
  const approx = (n) => (t.js.approx ? t.js.approx.replace('{n}', usdNf.format(usdApprox(n))) : '');
  const copText = (key) => t.js.copFormat.replace('{n}', nf.format(cop(key))) + approx(cop(key));
  const wa = (key) => {
    const msg = lookup(t, key);
    if (typeof msg !== 'string') errors.push(`[${lang}] mensaje de WhatsApp inexistente: ${key}`);
    return escAttr(`https://wa.me/${cfg.contact.whatsapp}?text=${encodeURIComponent(msg || '')}`);
  };

  // 2. {{clave}} → texto del idioma, {{cfg.x}} → configuración, o un valor especial.
  let html = template.replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
    if (key in special) return special[key];
    const v = key.startsWith('cfg.') ? lookup(cfg, key.slice(4)) : lookup(t, key);
    if (v === undefined || typeof v === 'object') { errors.push(`[${lang}] clave inexistente: ${key}`); return ''; }
    return v;
  });

  // 3. [[directivas]] para imágenes, precios, WhatsApp y bloques generados.
  html = html.replace(/\[\[(\w+)(?::([^\]]*))?\]\]/g, (_, name, arg = '') => {
    switch (name) {
      case 'img': {
        const [file, altKey, sizes, attrs = ''] = arg.split('|');
        const dim = IMAGES[file];
        if (!dim) { errors.push(`imagen sin registrar: ${file}`); return ''; }
        const alt = lookup(t, 'alt.' + altKey);
        if (alt === undefined) errors.push(`[${lang}] texto alternativo inexistente: alt.${altKey}`);
        const b = `${special.base}assets/img/${file}`;
        return `<img src="${b}-800.webp" srcset="${b}-800.webp 800w, ${b}-lg.webp ${dim[0]}w" sizes="${sizes}" width="${dim[0]}" height="${dim[1]}" alt="${escAttr(alt || '')}" decoding="async" ${attrs}>`;
      }
      case 'cop': {
        const b = `<b data-n="${cop(arg)}">${nf.format(cop(arg))}</b>`;
        return t.js.approx ? `<span class="price-val">${b}<span class="approx">${approx(cop(arg))}</span></span>` : b;
      }
      case 'privacyUrl': return escAttr(cfg.contact.privacyUrl);
      case 'rate': return `${nf.format(rate)} COP (${cfg.usdRate.date[lang]})`;
      case 'copText': return copText(arg);
      case 'wa': return wa(arg);
      case 'usdRows': return cfg.pricesUsd.items.map((it) => {
        const label = t.intl.items[it.id];
        const unit = t.intl.units[it.unit];
        if (!label || !unit) errors.push(`[${lang}] precio USD sin texto: ${it.id}/${it.unit}`);
        let value;
        if (typeof it.usd === 'number') value = `<span class="usd-value">US$ ${usdNf.format(it.usd)}</span>`;
        else if (it.cop) value = `<span class="usd-value">≈ US$ ${usdNf.format(usdApprox(cop(it.cop)))}</span><span class="usd-approx">${t.intl.approx}</span>`;
        else if (it.unit === 'plan') value = `<span class="usd-plan">${t.intl.planBased}</span>`;
        else value = `<span class="usd-pending" data-pending="usd">${t.intl.pending}</span>`;
        return `<tr><th scope="row">${label}<span class="unit-m">${unit}</span></th><td>${unit}</td><td class="num">${value}</td></tr>`;
      }).join('\n          ');
      case 'testimonials': {
        // Real testimonials need authorized: true. Demo ones need illustrative: true and always carry a visible label.
        const items = (cfg.testimonials.items || []).filter((x) => x.authorized === true || x.illustrative === true);
        if (items.length) {
          return items.map((x, i) => `<figure class="voice rv rv--up" style="--i:${i}">${x.illustrative ? `<p class="voice-label">${t.voices.illustrative}</p>` : ''}<blockquote><p>${escText(x.quote[lang])}</p></blockquote><figcaption>${[x.name, x.country?.[lang], x.treatment?.[lang]].filter(Boolean).map(escText).join(' · ')}</figcaption></figure>`).join('\n      ');
        }
        const note = `<p class="voices-empty rv rv--up" style="--i:2">${t.voices.emptyNote} <a class="link" href="#valoracion">${t.nav.contact}</a></p>`;
        return note;
      }
      // Version stamp so browsers fetch new CSS/JS after each change instead of a cached copy.
      case 'ver': return createHash('sha1').update(read('assets/' + arg)).digest('hex').slice(0, 8);
      case 'pageData': return JSON.stringify({
        lang, whatsapp: cfg.contact.whatsapp, cop: cfg.pricesCop, usdRate: rate, js: t.js,
      }).replace(/</g, '\\u003c');
      default: errors.push(`directiva desconocida: ${name}`); return '';
    }
  });

  const left = html.match(/\{\{[^}]*\}\}|\[\[[^\]]*\]\]/g);
  if (left) errors.push(`[${lang}] marcadores sin reemplazar: ${left.join(', ')}`);
  return html;
}

const out = { 'index.html': render('es'), 'en/index.html': render('en') };

out['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${['/', '/en/'].map((p) => `  <url>
    <loc>${cfg.siteUrl}${p}</loc>
    <xhtml:link rel="alternate" hreflang="es" href="${cfg.siteUrl}/"/>
    <xhtml:link rel="alternate" hreflang="en" href="${cfg.siteUrl}/en/"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${cfg.siteUrl}/"/>
  </url>`).join('\n')}
</urlset>
`;
// Page for any address that does not exist (Netlify serves /404.html automatically).
const t404 = dicts.es;
out['404.html'] = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Página no encontrada · ${cfg.brand}</title>
<meta name="robots" content="noindex">
<meta name="theme-color" content="#1f4a40">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/site.css">
</head>
<body class="page-404">
<div class="demo-bar" role="region" aria-label="${t404.demo.label}">
  <p class="demo-text"><span class="demo-a">${t404.demo.a}</span><span class="demo-short">${t404.demo.short}</span></p>
</div>
<main class="nf">
  <p class="nf-brand">${cfg.brand}</p>
  <h1 class="head">Esta página no existe</h1>
  <p class="nf-lead">Puede que el enlace esté mal escrito o que la página se haya movido.</p>
  <p class="nf-lead" lang="en">This page doesn't exist. The link may be mistyped, or the page may have moved.</p>
  <p class="nf-actions"><a class="btn" href="/">Ir al inicio <span class="arrow" aria-hidden="true">→</span></a> <a class="btn btn--ghost" href="/en/" lang="en">Go to the English site</a></p>
</main>
</body>
</html>
`;
out['robots.txt'] = `User-agent: *\nAllow: /\n\nSitemap: ${cfg.siteUrl}/sitemap.xml\n`;

if (errors.length) {
  console.error('La compilación falló:\n- ' + [...new Set(errors)].join('\n- '));
  process.exit(1);
}
if (!checkOnly) {
  for (const [file, content] of Object.entries(out)) {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), content);
  }
}
const pending = cfg.pricesUsd.items.filter((i) => i.usd == null && !i.cop && i.unit !== 'plan').length;
console.log(`${checkOnly ? 'Validación correcta' : 'Generado'}: ${Object.keys(out).join(', ')}. ${esKeys.size} textos por idioma. Precios USD pendientes: ${pending}. Testimonios reales: ${(cfg.testimonials.items || []).filter((x) => x.authorized === true).length}, ilustrativos: ${(cfg.testimonials.items || []).filter((x) => x.illustrative === true).length}.`);
