
function actualizarTomaUI(){
  document.querySelectorAll('.toma-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.toma === tomaActual);
  });
  if(tomaHint){
    if(tomaActual === 'vivo'){
      tomaHint.textContent = `irrepetible · tomas: ${tomaVivoCount}`;
      tomaHint.classList.add('vivo');
    } else {
      tomaHint.textContent = 'documento byte a byte';
      tomaHint.classList.remove('vivo');
    }
  }
  if(expWav){
    if(tomaActual === 'vivo'){
      expWav.textContent = '↓ WAV · TOMA VIVA';
      expWav.classList.add('btn-play');
    } else {
      expWav.textContent = '↓ WAV · TOMA FIEL';
      expWav.classList.remove('btn-play');
    }
  }
}
document.querySelectorAll('.toma-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    tomaActual = btn.dataset.toma;
    actualizarTomaUI();
    if(tomaActual === 'vivo'){
      setStatus(`Toma viva activa`);
    } else {
      setStatus(`Toma fiel activa`);
    }
  });
});

