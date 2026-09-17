# Arquitectura del proyecto

Este documento detalla, módulo por módulo, la extracción del `<script>` y `<style>`
originales (archivo único de 3214 líneas) hacia archivos independientes por área.

## Garantía de equivalencia

La separación se hizo con un script determinístico que corta el código fuente
exactamente en los puntos donde la sintaxis está en profundidad 0 (fuera de
funciones, objetos, strings o comentarios), preservando el orden original al
cien por ciento. Se verificó, automáticamente:

1. **Reconstrucción byte a byte**: concatenar los 29 archivos de `js/` (o los 14 de
   `css/`) en orden reproduce carácter por carácter el `<script>` (o `<style>`) original.
2. **Validez sintáctica individual**: cada uno de los 29 archivos JS pasa `node --check`
   por sí solo (no dependen de encontrarse concatenados para ser JavaScript válido).
3. **Balance de llaves** en cada hoja de estilos CSS.

No se modificó, reordenó ni reescribió ninguna línea de lógica, marcado o estilo.

## Por qué el orden de los `<script>` en index.html importa

El código original es JavaScript clásico (no ES modules): variables y funciones
viven en un único ámbito global. Los 29 archivos siguen ese mismo modelo — es
el equivalente moderno más fiel sin reescribir el código a módulos ES (lo cual
hubiese significado modificar el código, algo que se pidió evitar). Por eso deben
cargarse **en el orden listado en `index.html`**, que es el mismo orden en que
aparecían originalmente.

## Mapa de módulos JavaScript

| # | Módulo | Responsabilidad |
|---|---|---|
| `01-nucleo-identidad-y-config.js` | **Núcleo: identidad y configuración** | Estado global inicial (duración, clave, seeds, contadores de atmósferas), generador de ruido para el sintetizador, funciones de dibujo del isotipo (canvas y PDF), patrones de puntos decorativos y las constantes musicales base: `ESCALAS`, `NOMBRES`, `UMBRALES`. |
| `02-utilidades-formato-y-etiquetas.js` | **Utilidades de formato y etiquetas** | `fechaCreacion`, `horaCreacion`, `getRango`, `etiquetaEstado`, `slugEstado`, `nombreArchivo`, `leyendaEstado` — todo lo que arma la 'ficha técnica' textual usada en exports y nombres de archivo. |
| `03-referencias-dom.js` | **Referencias DOM** | El helper `$` y la captura de absolutamente todos los elementos del DOM que la app usa (inputs, canvases, botones, paneles, badges...). |
| `04-estado-runtime.js` | **Estado en tiempo de ejecución** | Variables mutables: contexto/buffer de audio, imagen cargada, escala/modo activos, eventos detectados, secuencia, contador de transporte, referencias de notas de la partitura. |
| `05-ui-helpers-basicos.js` | **Helpers de UI básicos** | `getCtx`, `setStatus`, `setEnabled`, `setProgress`, `setDurBadge`, `setSeedBadge` y la restauración del contador de 'tomas vivas' desde `localStorage`. |
| `06-control-toma-fiel-vivo.js` | **Control de toma (fiel / viva)** | `actualizarTomaUI` y el cableado de los botones que alternan entre exportación reproducible ('fiel') e irrepetible ('viva'). |
| `07-motor-transporte-partitura.js` | **Motor de transporte y playhead de partitura** | `stopAllVoices`, `formatTime`, `buildEventosSecuencia`, `ensurePlayheadInSVG`, `capturarPosicionesPartitura`, `updateScorePlayhead`, `hideScorePlayhead` y el listener de scroll que reubica el playhead. |
| `08-contador-y-scrubbing.js` | **Contador de reproducción y scrubbing** | `startCounter`, `stopCounter`, `ensureEventVisible`, `tickCounter` (loop de `requestAnimationFrame`) y el arrastre manual sobre el mapa de eventos: `scrubTo/Start/Move/End`. |
| `09-modal-visor-bent.js` | **Modal visor de imagen 'bent'** | `abrirModal` / `cerrarModal`: amplía a 512×512 el bitmap resultante del databending. |
| `10-motor-sintesis-audio.js` | **Motor de síntesis de audio** | `renderNoteToGain`: el sintetizador Web Audio completo, con todos los tipos de instrumento/textura tímbrica disponibles (incluye los instrumentos 'atmosféricos'). |
| `11-escalas-y-cuantizacion.js` | **Escalas y cuantización** | `construirEscala`, `cuantizar`: arma las notas de la escala activa y ajusta una frecuencia detectada a la nota más cercana según el modo (armónico/híbrido/permisivo). |
| `12-databending-imagen.js` | **Databending de imagen** | `crearBMP` (encabezado BMP crudo de 24 bits) y `aplicarTextura` con sus cuatro modos: crudo, echo, picasso (bloques) y slice (bandas), más el glitch determinístico por seed. |
| `13-bytes-a-audio.js` | **Bytes a audio** | `bytesToAudio`: convierte el buffer de bytes ya corrompido en un `AudioBuffer` reproducible, con crossfade entre ciclos. |
| `14-analisis-fft-espectral.js` | **Análisis FFT / espectral** | `fftReal` (transformada rápida de Fourier real) y los dos analizadores que producen los eventos crudos a partir del audio: `analizar` (offline) y `analizarVivo`. |
| `15-procesamiento-eventos.js` | **Procesamiento de eventos** | `procesarEventos` (filtrado/normalización según bandas y umbral) y `dibujarEventos` (mapa de eventos en canvas). |
| `16-notas-y-construccion-secuencia.js` | **Lista de notas y construcción de secuencia** | `actualizarNotas` (listado incremental en pantalla) y `construirSecuencia` (agrupa eventos en slots rítmicos). |
| `17-notacion-vexflow.js` | **Notación musical (VexFlow)** | `duracionFigura`, `slotSignature`, `crearFiguraVex`, `construirFiguras`, `renderPartitura`: arma compases y dibuja la partitura completa en pantalla. |
| `18-canvas-visualizaciones.js` | **Visualizaciones en canvas** | `dibujarWave`, `dibujarSpec`, `dibujarBent`: forma de onda, espectro y previsualización del bitmap con textura aplicada. |
| `19-render-hibrido.js` | **Render híbrido** | `renderHibridoOffline`, `renderHibridoVivo`, `preRenderHibrido`: combina el audio original con la síntesis de notas, para reproducir y para exportar. |
| `20-reproduccion-y-pipeline-principal.js` | **Reproducción y pipeline principal** | `tocarSecuencia` (dispara la reproducción) y `procesar` (la función orquestadora: corre databending → audio → análisis → secuencia → partitura de punta a punta). |
| `21-carga-imagen-y-controles-ui.js` | **Carga de imagen y controles de UI** | `cargarImagen` y el cableado de *todos* los controles interactivos: input/drag&drop de foto, textura, re-bent, play/stop, escala/modo, bandas, bpm, instrumento, clave, duración, rango de export, `initCollapsibles`, `updateCompactBtn` y el botón de modo compacto. |
| `22-preview-exportacion-modal.js` | **Modal de previsualización de exportación** | `abrirPreviewExport`, `cerrarPreviewExport`, `guardarPreviewExport`: el modal genérico donde se revisa cualquier archivo antes de descargarlo. |
| `23-exportacion-wav.js` | **Exportación WAV** | `encodeWAV`, las 'marcas' de identidad para el preview de WAV/MIDI (`crearPreviewMarcaWAV/MIDI`), `generarFichaASCII` y el manejador `expWav.onclick`. |
| `24-exportacion-midi.js` | **Exportación MIDI** | Manejador `expMidi.onclick`: genera y descarga el archivo MIDI de la secuencia. |
| `25-exportacion-csv.js` | **Exportación CSV** | Manejador `expCsv.onclick`: genera y descarga el listado de eventos en CSV. |
| `26-exportacion-png.js` | **Exportación PNG** | `crearCanvasPNG` y el manejador `expPng.onclick`: compone la ficha visual completa como imagen. |
| `27-exportacion-pdf.js` | **Exportación PDF** | `scoreSliceToPngDataURL` y `crearPDFBlob`: rasteriza la partitura SVG por fragmentos y arma el PDF paginado con ficha técnica. |
| `28-exportacion-pdf-handler.js` | **Manejador del botón PDF** | `expPdf.onclick`: conecta el botón con `crearPDFBlob` y su previsualización. |
| `29-inicializacion.js` | **Inicialización** | Estado inicial con el que arranca la app al cargar la página (escala por defecto, mensaje de estado, controles deshabilitados, badges). |

## Mapa de hojas de estilo

Ver la tabla en `README.md` — cada hoja de estilos corresponde 1 a 1 con un bloque
visual de la interfaz (identidad, cabecera, controles, canvases, modales, footer, etc.).

## Archivos nuevos agregados después de la refactorización inicial

Estos archivos **no forman parte del archivo original** — se agregaron para
dejar el proyecto listo para publicarse (SEO, seguridad, legal, accesibilidad).
Cada uno lo indica en su propio encabezado de comentario.

| Archivo | Qué es |
|---|---|
| `about.html`, `privacidad.html`, `terminos.html`, `404.html` | Páginas institucionales/legales, con la misma identidad visual (masthead, isotipo, paleta, tipografía) que `index.html`, construidas sobre `css/15-paginas-contenido.css` |
| `css/15-paginas-contenido.css` | Tipografía y componentes de lectura larga para las páginas de arriba |
| `css/16-compartir.css` + `js/30-compartir.js` | Widget de compartir (copiar enlace, Web Share nativo, X/Twitter, WhatsApp) en el footer de `index.html` |
| `css/17-breakpoints-adicionales.css` | Breakpoints extra para pantallas muy chicas, aditivos a los 2 que ya traía el CSS original |
| `assets/favicon.*`, `assets/og-image.png` | Favicon e imagen de Open Graph, derivados matemáticamente del isotipo real (`<symbol id="iso-02">`) |
| `scripts/generar_assets_marca.py` | Script que regenera esos assets si cambia la identidad visual (requiere Pillow) |
| `sitemap.xml`, `robots.txt` | SEO básico |
| `_headers` | Cabeceras HTTP de seguridad para hosts que las soportan (Netlify/Cloudflare Pages) |
| `SECURITY.md` | Qué protege la CSP, por qué falta SRI (y cómo agregarlo vos mismo), y la regla sobre API keys |

Los cambios hechos **dentro** de `index.html` para soportar todo esto
(meta tags, favicon, CSP, `aria-label` en los `<canvas>`, el bloque de
navegación/compartir del footer) están señalados con comentarios HTML
`<!-- ... NUEVO ... -->` en el propio archivo.

## Actualización — páginas de contenido rediseñadas (14 sep. 2026)

`about.html`, `privacidad.html`, `terminos.html` y `404.html` se
reconstruyeron para ocupar la pantalla igual que la ventana de
previsualización de exportación (mismo tamaño de caja, mismo borde rojo),
en vez del bloque de texto angosto de la versión anterior. Como ya no usan
el `.masthead` ni el `.footer` grandes de la app principal, ahora cargan
menos CSS:

```
css/01-base-y-fondo.css
css/03-identidad-isotipo-iconos.css
css/15-paginas-contenido.css   ← reescrito por completo
```

`css/16-compartir.css` se reescribió también: el bloque de compartir ya no
vive en el footer del index, sino dentro de `#exportShareRow`, visible solo
cuando la previsualización activa es el PNG (lo controla
`js/22-preview-exportacion-modal.js`, que ahora también expone
`exportShareRow`). `js/30-compartir.js` se reescribió para manejar los 9
botones de esa fila (compartir nativo + 8 redes).
