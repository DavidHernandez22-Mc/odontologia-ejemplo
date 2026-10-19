# Odontología Ejemplo

Web bilingüe (español / inglés) de una clínica de odontología estética en Bogotá. HTML, CSS y JavaScript sin dependencias, publicada en GitHub Pages.

- Español: `/` · Inglés: `/en/`
- Diseño de sonrisa, implantes, tratamientos, primera visita, mapa interactivo de la boca, precios en COP, precios orientativos en USD para pacientes internacionales, testimonios, preguntas frecuentes y formulario de valoración que se envía por WhatsApp.

## Cómo está organizado

| Archivo | Para qué sirve |
| --- | --- |
| `src/template.html` | La estructura de la página, una sola para los dos idiomas. |
| `src/i18n/es.json`, `src/i18n/en.json` | Todos los textos. Deben tener las mismas claves. |
| `src/config.json` | Datos de la clínica: contacto, WhatsApp, precios COP, precios USD y testimonios. |
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

- **Contacto (EJEMPLO):** teléfono, WhatsApp, correo y dirección son de muestra.
- **Precios en COP (EJEMPLO):** cifras de muestra.
- **Precios en USD (PENDIENTE):** `usd: null` se muestra como "Por confirmar". Escribe el número (por ejemplo `"usd": 450`) cuando la clínica lo defina. No uses conversiones automáticas.
- **Testimonios (PENDIENTE):** solo con autorización escrita del paciente. Formato de cada uno:

```json
{
  "authorized": true,
  "name": "Nombre o iniciales",
  "country": { "es": "Canadá", "en": "Canada" },
  "treatment": { "es": "Carillas de cerámica", "en": "Porcelain veneers" },
  "quote": { "es": "Texto en español", "en": "Text in English" }
}
```

  Cuando haya al menos uno, pon `"showFormatPreview": false`.

- **Política de datos:** el formulario menciona la política de tratamiento de datos personales; falta publicarla y enlazarla.
- **Equipo, carta, horarios y textos legales (REPS):** son de ejemplo.
- **Fotos:** son de referencia (Unsplash), no de pacientes ni del consultorio. Los créditos están en el pie de página.

## Ver en local

```bash
python3 -m http.server 4321
```

Y abre `http://localhost:4321` (español) o `http://localhost:4321/en/` (inglés).
