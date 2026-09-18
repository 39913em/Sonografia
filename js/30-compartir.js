
(function () {
 
  const shareCaption = () => `SONOGRAFÍA · Errores Visionoros · By: 39913 — "El error como materialidad"`;

  function currentPngFile() {
    if (!exportPreviewBlob) return null;
    const name = (exportPreviewName || 'sonografia.png');
    try {
      return new File([exportPreviewBlob], name, { type: 'image/png' });
    } catch (e) {
      return null; 
    }
  }

  function abrirIntent(url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  function wire(id, handler) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handler);
  }

  wire('shareNative', async () => {
    const file = currentPngFile();
    const data = { title: 'SONOGRAFÍA', text: shareCaption() };
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      data.files = [file];
    }
    if (navigator.share) {
      try { await navigator.share(data); }
      catch (e) { }
    } else {
      window.prompt('Tu navegador no soporta compartir nativo. Copia el texto y adjunta la imagen descargada a mano:', shareCaption());
    }
  });

  
  const caption = encodeURIComponent(shareCaption());

  wire('shareTwitter', () => abrirIntent(`https://twitter.com/intent/tweet?text=${caption}`));
  wire('shareBluesky', () => abrirIntent(`https://bsky.app/intent/compose?text=${caption}`));
  wire('shareLinkedin', () => abrirIntent(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://TU-USUARIO.github.io/TU-REPOSITORIO/')}&summary=${caption}`));
  wire('shareFacebook', () => abrirIntent(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://TU-USUARIO.github.io/TU-REPOSITORIO/')}&quote=${caption}`));
  wire('shareWhatsapp', () => abrirIntent(`https://wa.me/?text=${caption}`));
  wire('shareReddit', () => abrirIntent(`https://www.reddit.com/submit?url=${encodeURIComponent('https://TU-USUARIO.github.io/TU-REPOSITORIO/')}&title=${caption}`));
  wire('shareThreads', () => abrirIntent(`https://www.threads.net/intent/post?text=${caption}`));

 
  wire('shareSubstack', async () => {
    try {
      await navigator.clipboard.writeText(shareCaption());
      window.open('https://substack.com/notes', '_blank', 'noopener,noreferrer');
    } catch (e) {
      window.prompt('Copia este texto y pégalo en Substack:', shareCaption());
    }
  });
})();
