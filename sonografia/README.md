# SONOGRAFÍA · 39913 · Proyecto Errores Visionoros

**Imagen → ruido → partitura.** Aplicación web de *databending*: convierte una
fotografía en un archivo de audio corrupto (bit/byte-glitching sobre un BMP
crudo), analiza ese audio y lo traduce en una partitura y secuencia musical
reproducible, exportable a PDF, PNG, WAV, MIDI, CSV y ficha ASCII.

Este repositorio es una **refactorización estructural** de la aplicación
original de un único archivo `.html`, más el conjunto de páginas y
configuraciones necesarias para publicarla de forma profesional y segura.
**El código funcional original no se modificó ni una sola línea** —
únicamente se reorganizó en archivos independientes por área. Puede
verificarse: concatenando los archivos de `css/` (del 01 al 14) y `js/` (del
01 al 29) en el orden en que se cargan desde `index.html` se reconstruye
byte por byte el `<style>` y el `<script>` del archivo original. Todo lo que
se agregó por fuera de eso (páginas legales, SEO, seguridad, compartir) está
señalado explícitamente como nuevo en cada archivo.

## ⚠️ Antes de publicar: reemplaza estos placeholders

El proyecto usa marcadores de posición que **tienes que buscar y reemplazar**
antes de subirlo, porque no puedo inventar tus datos reales:

| Placeholder | Dónde aparece | Reemplazar por |
|---|---|---|
| `TU-USUARIO` / `TU-REPOSITORIO` | `index.html`, `about.html`, `privacidad.html`, `terminos.html`, `sitemap.xml`, `robots.txt` | Tu usuario y nombre de repo de GitHub (o tu dominio propio) |
| `TU-EMAIL-DE-CONTACTO@ejemplo.com` | `privacidad.html`, `terminos.html` | Un email real donde te puedan escribir |
| Enlaces de `social-row` en `index.html` (footer) | `index.html` | Tus redes reales, o borrá las líneas que no uses |

Recomendación: usa buscar-y-reemplazar en todo el proyecto para
`TU-USUARIO.github.io/TU-REPOSITORIO` en un solo paso una vez que sepas la
URL final.

## Cómo ejecutarlo localmente

Es una aplicación 100% estática (sin build, sin dependencias de Node para
correr). Solo hace falta servirla por HTTP:

```bash
python3 -m http.server 8000
# luego abrir http://localhost:8000
```

O usar la extensión "Live Server" de VS Code sobre `index.html`.

## Cómo publicarlo (GitHub Pages)

1. sube esta carpeta completa a un repositorio de GitHub.
2. Configuración del repo → **Pages** → Source: rama principal, carpeta raíz (`/`).
3. GitHub Pages sirve automáticamente `404.html` como página de error — no requiere configuración extra.
4. reemplaza los placeholders de la tabla de arriba con la URL que te asigne GitHub Pages.

## Estructura del proyecto

```
.
├── index.html               La aplicación (marcado + carga de módulos)
├── about.html                Página "Acerca de"
├── privacidad.html           Política de privacidad
├── terminos.html             Términos y condiciones
├── 404.html                  Página de error personalizada
├── sitemap.xml                Mapa del sitio para buscadores
├── robots.txt                 Indica a los buscadores dónde está el sitemap
├── _headers                   Cabeceras de seguridad (Netlify / Cloudflare Pages)
├── SECURITY.md                 Qué se protegió, cómo, y qué falta hacer a mano (SRI)
├── ARCHITECTURE.md             Mapa detallado de cada módulo CSS/JS
├── css/                        Una hoja de estilos por área de interfaz
├── js/                         Un módulo por área funcional
├── assets/                     Favicon e imagen de Open Graph
└── scripts/
    └── generar_assets_marca.py  Regenera favicon/OG si cambia la identidad visual
```

### `css/` y `js/` — la app original, sin tocar

Ver `ARCHITECTURE.md` para el detalle línea a línea. Resumen:

- `css/01-*.css` a `css/14-*.css` y `js/01-*.js` a `js/29-*.js`: **extraídos
  tal cual** del archivo original, verificado con reconstrucción byte a
  byte. Numerados en el orden exacto en que se cargan.
- `css/15-paginas-contenido.css`: estilos para las páginas de texto largo
  (privacidad, términos, about, 404) — **nuevo**, no se usa en `index.html`.
- `css/16-compartir.css`, `js/30-compartir.js`: widget de compartir del
  footer — **nuevo**, aditivo, no depende de ningún módulo original.
- `css/17-breakpoints-adicionales.css`: refinamientos responsive extra para
  pantallas chicas — **nuevo**, complementa (no reemplaza) los 2 breakpoints
  que ya traía el diseño original.

Como los módulos JS son scripts clásicos (no ES modules) que comparten un
mismo ámbito global, **el orden de carga en `index.html` importa** — no lo
alteres sin revisar `ARCHITECTURE.md`.

## Seguridad

Ver **`SECURITY.md`** para el detalle completo. En resumen:

- CSP (Content-Security-Policy) restrictiva, aplicada como `<meta>` (funciona
  en GitHub Pages) y como `_headers` (para Netlify/Cloudflare Pages, con
  cabeceras adicionales que GitHub Pages no soporta).
- Ningún API key, secreto o dato personal en el código (verificado).
- Instrucciones paso a paso para agregar Subresource Integrity (SRI) a los
  3 scripts de CDN — no vienen precargados porque un hash incorrecto rompe
  la app en silencio; el documento explica cómo generarlos vos mismo y
  verificarlos en 2 minutos.

## SEO y redes

- Meta description, Open Graph y Twitter Card en las 5 páginas HTML.
- Favicon (SVG + PNG en varios tamaños) e imagen de Open Graph (1200×630),
  ambos derivados del isotipo real del proyecto — regenerables con
  `scripts/generar_assets_marca.py` si cambia la identidad visual.
- `sitemap.xml` + `robots.txt`.

## Accesibilidad

Los 6 `<canvas>` de la aplicación (imagen original, bitmap con textura,
onda, espectro, mapa de eventos, visor ampliado) tienen `role="img"` +
`aria-label` describiendo qué muestran, para lectores de pantalla.

## Cómo editar de forma segura

- **Cambiar un estilo visual** → editar solo el archivo de `css/` que
  corresponde a esa área (nombres autodescriptivos).
- **Cambiar lógica de una función** → editar solo el archivo de `js/` que la
  contiene (ver tabla en `ARCHITECTURE.md`).
- **Editar los textos legales** → `privacidad.html` / `terminos.html`, son
  HTML plano con las clases de `css/15-paginas-contenido.css`.
- **Cambiar la identidad visual** (colores, isotipo) → los tokens viven en
  `css/01-*.css` a `css/05-*.css`; si tocás el isotipo, corre de nuevo
  `scripts/generar_assets_marca.py` para que el favicon y la imagen de
  Open Graph queden consistentes.

## Créditos / identidad

"SONOGRAFÍA · 39913 · Proyecto Errores Visionoros — El error como método."

## Changelog — 14 de septiembre de 2026

- **Arreglado:** exportación a PDF (CSP incompleta bloqueaba el iframe de previsualización).
- **Arreglado:** descarga de archivos en iOS/Android (el `<a download>` no estaba en el DOM al hacer click).
- **Arreglado:** carga de imagen en iOS (se reemplazó `.click()` programático por `<label for>` nativo).
- **Rediseño completo** de `about.html`, `privacidad.html`, `terminos.html` y `404.html`: ahora ocupan la pantalla igual que la ventana de previsualización de exportación, con el isotipo en grande y mejor aprovechamiento del espacio.
- **Identidad consolidada:** título, slogan ("El error como materialidad"), y crédito de ficha técnica ("SONOGRAFÍA · Errores Visionoros · By: 39913 · Databending · 2017-2026") unificados en index, PDF, PNG, WAV, MIDI y ficha ASCII.
- **Corregido el pleonasmo visual:** el header ya no muestra el isotipo grande *y* el wordmark con su puntito juntos (solo el logotipo completo); el footer ya no repite el wordmark junto al isotipo (solo el ícono).
- El logotipo de arriba a la izquierda funciona como botón de regreso al inicio en todas las páginas (sin anunciarlo con texto).
- **Compartir** reubicado: ya no vive en el footer del index — ahora aparece únicamente dentro de la previsualización del PNG, con compartir nativo (adjunta la imagen si el navegador lo soporta) más enlaces a X, Bluesky, LinkedIn, Facebook, WhatsApp, Reddit, Threads y Substack (estos últimos abren el compositor con el texto listo; la imagen se adjunta a mano tras descargarla, porque no está alojada en ninguna URL pública).
- Footer del index consolidado: About / Privacidad / Términos / Instagram / Archivo de Señal en una sola línea.
- Relleno decorativo (isotipo grande, solo escritorio) en el espacio que quedaba vacío debajo de "Ajustes de traducción" cuando esa columna es más corta que la de datos/partitura.
- Español revisado a neutro (México) en toda la documentación y las páginas — se habían colado formas de voseo rioplatense.
- "HÍBRIDO" restringido exclusivamente al selector de MODO; en Toma/WAV ahora dice "FIEL"/"VIVO"/"WAV".

### Nota sobre iOS y descargas

iOS Safari tiene comportamientos propios del sistema operativo que no se
pueden forzar completamente desde JavaScript: por ejemplo, para ciertos
tipos de archivo puede abrir la previsualización en una pestaña en vez de
disparar un diálogo de "Guardar en Archivos". El arreglo aplicado (insertar
el enlace de descarga en el DOM) corrige el bug real que impedía que la
descarga se disparara; si en algún dispositivo puntual el comportamiento
sigue sin ser el esperado, probablemente sea esta particularidad de iOS y
no un bug de la aplicación.
