# Seguridad

SONOGRAFÍA · 39913 es una aplicación 100% estática: no tiene servidor, no
tiene base de datos, no tiene login ni formularios que envíen datos a
ningún lado. Eso reduce mucho la superficie de ataque real. Esto documenta
qué se protegió y por qué, y qué queda como tarea manual tuya.

## 1. Content-Security-Policy (CSP)

Se agregó una CSP en dos lugares:

- **`<meta http-equiv="Content-Security-Policy">` dentro de `index.html`**
  (y de las páginas `about.html`, `privacidad.html`, `terminos.html`,
  `404.html`). Funciona en cualquier hosting, incluido GitHub Pages, que no
  permite configurar cabeceras HTTP reales.
- **Archivo `_headers`**, con la misma política más un par de cabeceras
  extra (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`). Solo lo leen hosts como Netlify o Cloudflare
  Pages — GitHub Pages lo ignora sin romper nada.

La política solo permite scripts propios más los tres CDN de los que ya
dependía la app (jsDelivr, unpkg, cdnjs); todo lo demás (`object-src`,
`base-uri`, etc.) queda restringido a `'self'` o bloqueado.

**Un detalle a tener en cuenta:** `style-src` incluye `'unsafe-inline'`.
Esto es necesario porque el HTML original usa atributos `style="..."` en
varios elementos (y el propio JS genera algunos al vuelo, como el tamaño
del isotipo). Sacar `'unsafe-inline'` de estilos requeriría reescribir esas
partes del código, algo que evitamos a propósito para no tocar la lógica
original. El riesgo real de esto es bajo: permite inyectar estilos, no
scripts.

## 2. Subresource Integrity (SRI) — pendiente, a propósito

Lo ideal es que los 3 `<script src="https://.../...">` de `index.html`
(VexFlow, @tonejs/midi, jsPDF) tengan un atributo `integrity="sha384-..."`
+ `crossorigin="anonymous"`. Esto evita que, si alguna de esas CDNs fuera
comprometida algún día, el navegador ejecute un archivo distinto al que
esperás.

**No incluimos los hashes nosotros** porque no pudimos verificarlos contra
el archivo exacto servido en esa URL con total certeza desde este entorno
— y un hash SRI incorrecto no "falla silenciosamente": bloquea la carga
del script entero y rompe la partitura/exportación MIDI/exportación PDF.
Preferimos dejarte el paso final a vos, que sí puedes verificarlo en tu
propio navegador. Es rápido:

1. anda a **[www.srihash.org](https://www.srihash.org)**.
2. pega cada una de estas URLs, una por una, y copia el `integrity` que te genera:
   - `https://cdn.jsdelivr.net/npm/vexflow@4.2.3/build/cjs/vexflow.js`
   - `https://unpkg.com/@tonejs/midi@2.0.28/build/midi.js`
   - `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`
3. En `index.html`, agrega `integrity="..."` y `crossorigin="anonymous"` a cada `<script>` correspondiente.
4. Recargá la app y confirma que la partitura, el MIDI y el PDF se siguen generando bien (si algo se rompe, el hash no coincide — volvé a generarlo).

(jsDelivr también muestra el hash `integrity` automáticamente en su propio
buscador de paquetes, como alternativa a srihash.org.)

## 3. API keys y datos personales

Revisamos todo el código (JS y CSS) buscando claves, tokens, contraseñas o
datos personales hardcodeados: **no hay ninguno**. Nada que ocultar hoy.

Regla para el futuro, si alguna vez conectás un servicio real (traducción,
IA, analíticas con API propia, etc.): **una API key nunca va en código que
corre en el navegador**, porque cualquiera puede abrir las herramientas de
desarrollador y leerla. Si necesitás una key, hace falta un backend o una
función serverless (Cloudflare Workers, Netlify Functions, Vercel
Functions, etc.) que la guarde como variable de entorno y actúe de
intermediario entre el navegador y el servicio real.

## 4. Qué NO aplica acá (y por qué)

- **Inyección SQL, robo de sesión, fuerza bruta de login:** no hay base de
  datos, no hay sesiones, no hay login.
- **CSRF:** no hay formularios que muten estado en un servidor.
- **Banner de cookies:** la app no usa cookies (solo `localStorage` para un
  contador interno, que no requiere aviso legal en la mayoría de las
  jurisdicciones).

Si en el futuro se agrega un backend, analíticas, o cualquier cosa que
recopile datos, esta sección y `privacidad.html` deben actualizarse antes
de ese cambio.

## Changelog de seguridad — 14 de septiembre de 2026

**Bug crítico corregido: el PDF no se generaba.** La CSP no incluía
`frame-src`, y por defecto eso cae a `default-src 'self'` — que no permite
que un `<iframe>` navegue a una URL `blob:`. La previsualización del PDF usa
justamente eso (`iframe.src = URL.createObjectURL(blob)`), así que el
navegador bloqueaba en silencio la carga del PDF ya generado (por eso
fallaba *solo* el PDF: PNG usa `<img>` e WAV usa `<audio>`, ambos ya
cubiertos por `img-src`/`media-src blob:`). Se agregó:

```
frame-src 'self' blob:;
child-src 'self' blob:;
```

**Bug corregido: la descarga fallaba en iOS y en algunos Android.** La
función que dispara la descarga creaba un `<a download>` y llamaba
`.click()` sin insertarlo en el DOM. Varios navegadores móviles ignoran ese
click en silencio si el elemento no está adjunto al documento. Se corrigió
insertando el `<a>` en `document.body` antes del click y quitándolo después
(ver `js/22-preview-exportacion-modal.js`).

**Bug corregido: la carga de imagen no abría el selector en iOS.** El botón
de subir imagen llamaba a `fileInput.click()` sobre un `<input type="file">`
con `display:none` — iOS Safari suele ignorar ese `.click()` programático.
Se reemplazó por un `<label for="file">` nativo (y lo mismo para el botón
"CAMBIAR" con `fileChange`), que activa el selector de forma confiable sin
depender de JavaScript.

