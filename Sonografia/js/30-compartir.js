
(function () {
  // Este módulo solo actúa dentro del modal de previsualización, y solo
  // cuando lo que se está previsualizando es el PNG (ver js/22, que
  // muestra/oculta #exportShareRow según el tipo de exportación).
  // exportPreviewBlob / exportPreviewName están definidos en js/22.

  const shareCaption = () => `SONOGRAFÍA · Errores Visionoros · By: 39913 — "El error como materialidad"`;

  function currentPngFile() {
    if (!exportPreviewBlob) return null;
    const name = (exportPreviewName || 'sonografia.png');
    try {
      return new File([exportPreviewBlob], name, { type: 'image/png' });
    } catch (e) {
      return null; // Safari viejo sin soporte de File() con blobs — se cae a los enlaces de texto
    }
  }

  function abrirIntent(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function wire(id, handler) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handler);
  }

  // ── Compartir nativo (adjunta la imagen real cuando el navegador lo soporta) ──
  wire('shareNative', async () => {
    const file = currentPngFile();
    const data = { title: 'SONOGRAFÍA', text: shareCaption() };
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      data.files = [file];
    }
    if (navigator.share) {
      try { await navigator.share(data); }
      catch (e) { /* el usuario canceló el share sheet, no es un error */ }
    } else {
      window.prompt('Tu navegador no soporta compartir nativo. Copia el texto y adjunta la imagen descargada a mano:', shareCaption());
    }
  });

  // ── Redes con intent web de texto/enlace (no aceptan adjuntar el archivo
  //    directamente porque la imagen no está alojada en ninguna URL pública:
  //    se genera en tu navegador). Abren el compositor con el texto listo;
  //    la imagen hay que adjuntarla a mano después de descargarla. ──
  const caption = encodeURIComponent(shareCaption());

  wire('shareTwitter', () => abrirIntent(`https://twitter.com/intent/tweet?text=${caption}`));
  wire('shareBluesky', () => abrirIntent(`https://bsky.app/intent/compose?text=${caption}`));
  wire('shareLinkedin', () => abrirIntent(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://TU-USUARIO.github.io/TU-REPOSITORIO/')}&summary=${caption}`));
  wire('shareFacebook', () => abrirIntent(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://TU-USUARIO.github.io/TU-REPOSITORIO/')}&quote=${caption}`));
  wire('shareWhatsapp', () => abrirIntent(`https://wa.me/?text=${caption}`));
  wire('shareReddit', () => abrirIntent(`https://www.reddit.com/submit?url=${encodeURIComponent('https://TU-USUARIO.github.io/TU-REPOSITORIO/')}&title=${caption}`));
  wire('shareThreads', () => abrirIntent(`https://www.threads.net/intent/post?text=${caption}`));

  // Substack no tiene un intent web oficial de "compartir" — copiamos el
  // texto al portapapeles para pegarlo en una Nota o en el editor.
  wire('shareSubstack', async () => {
    try {
      await navigator.clipboard.writeText(shareCaption());
      window.open('https://substack.com/notes', '_blank', 'noopener,noreferrer');
    } catch (e) {
      window.prompt('Copia este texto y pégalo en Substack:', shareCaption());
    }
  });
})();
