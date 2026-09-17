

construirEscala('minor');
setStatus('Sube una imagen');
setEnabled(false);
clefActual = clefSelect.value;
duracionAudio = parseInt(durSelect.value) || 30;
rangeEnd.value = duracionAudio;
setDurBadge();
resetIntensidadProgresiva();
setSeedBadge();
actualizarTomaUI();
