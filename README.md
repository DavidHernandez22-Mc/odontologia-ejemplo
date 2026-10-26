# Clínica Dental Chicó

Sitio de demostración diseñado por David: web bilingüe (español / inglés) de una clínica de odontología estética en Bogotá. HTML, CSS y JavaScript sin dependencias. URL oficial: https://odontologiademo1.netlify.app (`siteUrl` en `src/config.json`).

- Español: `/` · Inglés: `/en/`
- Diseño de sonrisa, implantes, tratamientos, primera visita, mapa interactivo de la boca, precios en COP, precios orientativos en USD para pacientes internacionales, testimonios, preguntas frecuentes y formulario de valoración que se envía por WhatsApp.

## Cómo está organizado

| Archivo | Para qué sirve |
| --- | --- |
| `src/template.html` | La estructura de la página, una sola para los dos idiomas. |
| `src/i18n/es.json`, `src/i18n/en.json` | Todos los textos. Deben tener las mismas claves. |
| `src/config.json` | Datos de la clínica: contacto, WhatsApp, precios COP, tasa COP/USD, precios USD y testimonios. |
| `assets/css/site.css`, `assets/js/site.js` | Estilos e interacción, compartidos por los dos idiomas. |
| `assets/img/` | Fotos en WebP (800 px y tamaño grande). |
| `build.mjs` | Genera `index.html`, `en/index.html`, `sitemap.xml` y `robots.txt`. |

**No edites `index.html` ni `en/index.html` a mano**: se generan. Edita los archivos de `src/` y ejecuta:

```bash
node build.mjs
```

Para solo validar (claves faltantes entre idiomas, textos o precios inexistentes, marcadores sin reemplazar):

```bash
node build.mjs --check
```

## Antes de lanzar

Todo lo que sigue está marcado en `src/config.json`:

- **WhatsApp:** todos los botones abren el WhatsApp de David (`contact.whatsapp`) con el mensaje de la demo (`wa.general` y `js.waDemo` en los textos).
- **Dirección (MUESTRA):** es de muestra.
- **Precios en COP (MUESTRA):** cifras de muestra.
- **Precios en USD:** con `usd: null` se muestra el aproximado calculado desde el precio en pesos con `usdRate.copPerUsd` (hoy 3.160, TRM del 21 de octubre de 2026). Actualiza la tasa cuando cambie, o escribe un precio exacto, como `"usd": 450`.
- **Franja de demostración:** textos en `demo` de cada idioma.
- **Testimonios:** hoy hay 2 ejemplos ilustrativos (`"illustrative": true`), que se muestran con la etiqueta "Ejemplo ilustrativo para la demo". Para una clínica real, cámbialos por testimonios auténticos con autorización escrita del paciente. Formato de cada uno:

```json
{
  "authorized": true,
  "name": "Nombre o iniciales",
  "country": { "es": "Canadá", "en": "Canada" },
  "treatment": { "es": "Carillas de cerámica", "en": "Porcelain veneers" },
  "quote": { "es": "Texto en español", "en": "Text in English" }
}
```


- **Política de datos:** el formulario menciona la política de tratamiento de datos personales; falta publicarla y enlazarla.
- **Equipo, carta, horarios y texto legal del pie de página:** son de muestra.
- **Fotos:** son de referencia (Unsplash), no de pacientes ni del consultorio. Los créditos están en el pie de página.

## Ver en local

```bash
python3 -m http.server 4321
```

Y abre `http://localhost:4321` (español) o `http://localhost:4321/en/` (inglés).
