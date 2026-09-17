
function cargarImagen(file){
  const reader=new FileReader();
  reader.onload=e=>{
    const img=new Image();
    img.onload=()=>{
      const ctx=cOrig.getContext('2d');
      ctx.clearRect(0,0,256,256);ctx.drawImage(img,0,0,256,256);
      imageData=ctx.getImageData(0,0,256,256);
      filenameEl.textContent=`⏺ ${file.name}`;
      emptyState.style.display='none';loadedState.style.display='block';
      resetIntensidadProgresiva();setSeedBadge();procesar();
    };
    img.onerror=()=>setStatus('Error imagen',true);
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

fileInput.onchange=e=>{if(e.target.files.length)cargarImagen(e.target.files[0])};
fileChange.onchange=e=>{if(e.target.files.length)cargarImagen(e.target.files[0])};
dropZone.ondragover=e=>{e.preventDefault();dropZone.style.borderColor='#cc2233'};
dropZone.ondragleave=()=>{dropZone.style.borderColor='#2a2a3f'};
dropZone.ondrop=e=>{e.preventDefault();dropZone.style.borderColor='#2a2a3f';if(e.dataTransfer.files.length)cargarImagen(e.dataTransfer.files[0])};
/* La apertura del selector de archivos ahora la maneja el <label for="file">
   / <label for="fileChange"> nativo del HTML (ver index.html), no un
   .click() programático: en iOS Safari el .click() sobre un input
   display:none suele ser ignorado en silencio, mientras que la activación
   por <label> funciona siempre, sea cual sea el estilo del input. */
textura.onchange=()=>{
  if(!imageData)return;
  resetIntensidadProgresiva();
  setSeedBadge();
  procesar();
};
reBent.onclick=()=>{
  if(!imageData || rebentSeed>=REBENT_MAX)return;
  avanzarIntensidadProgresiva();
  setSeedBadge();
  procesar();
};

play.onclick=()=>{
  if(!audioBuffer)return;
  const ctx=getCtx();if(ctx.state==='suspended')ctx.resume();
  if(source)try{source.stop()}catch(e){}
  source=ctx.createBufferSource();source.buffer=audioBuffer;source.connect(ctx.destination);source.start();
  setStatus(`▶ Ruido ${duracionAudio}s`);
};
stop.onclick=()=>{if(source)try{source.stop()}catch(e){};setStatus('⏹')};
playScore.onclick=()=>tocarSecuencia(0);
stopMelody.onclick=()=>{stopAllVoices();hideScorePlayhead();setStatus('⏹ Melodía detenida')};

modoSelect.onchange=()=>{modoActual=modoSelect.value;if(eventos.length)procesarEventos()};
escalaSelect.onchange=()=>{escalaActual=escalaSelect.value;construirEscala(escalaActual);if(eventos.length)procesarEventos()};
[chBass,chMid,chHigh].forEach(ch=>{ch.onchange=()=>{if(eventos.length)procesarEventos()}});
bpmInput.onchange=()=>{
  bpmActual=parseInt(bpmInput.value)||128;
  stepDur=60/bpmActual/8;
  if(eventos.length){for(const e of eventos)e.step=Math.round(e.time/stepDur);procesarEventos()}
};
instrumento.onchange=()=>{
  setStatus(`🎛️ ${instrumento.options[instrumento.selectedIndex].text}`);
  if(eventosSecuencia.length) preRenderHibrido();
};
clefSelect.onchange=()=>{
  clefActual=clefSelect.value;
  if(eventos.length)renderPartitura();
  setStatus(`🎼 Clave ${clefActual==='bass'?'FA':'SOL'}`);
};
durSelect.onchange=()=>{
  duracionAudio = parseInt(durSelect.value)||30;
  if((parseFloat(rangeEnd.value)||0) > duracionAudio) rangeEnd.value = duracionAudio;
  if((parseFloat(rangeStart.value)||0) >= duracionAudio) rangeStart.value = 0;
  setDurBadge();
  if(imageData) procesar();
  setStatus(`⏱ Duración ${duracionAudio}s`);
};
rangeStart.onchange=()=>{
  const r = getRango();
  rangeStart.value = r.a;
  if((parseFloat(rangeEnd.value)||0) < r.a+1) rangeEnd.value = Math.min(duracionAudio, r.a+1);
  if(eventos.length) renderPartitura();
};
rangeEnd.onchange=()=>{
  const r = getRango();
  rangeEnd.value = r.b;
  if(eventos.length) renderPartitura();
};

function initCollapsibles(){
  document.querySelectorAll('details.collapse-section').forEach(det=>{
    const key = det.dataset.key;
    if(!key) return;
    const saved = localStorage.getItem('sono-collapse-'+key);
    if(saved === '0') det.removeAttribute('open');
    else if(saved === '1') det.setAttribute('open','');
    det.addEventListener('toggle', ()=>{
      localStorage.setItem('sono-collapse-'+key, det.open ? '1' : '0');
      updateCompactBtn();
      if(det.open && det.dataset.key === 'partitura'){
        setTimeout(()=>{ capturarPosicionesPartitura(); updateScorePlayhead(playheadTime); }, 30);
      }
      if(det.open && det.dataset.key === 'eventos'){
        actualizarNotas();
      }
    });
  });
  updateCompactBtn();
}
function updateCompactBtn(){
  if(!compactBtn) return;
  const opened = document.querySelectorAll('details.collapse-section[open]');
  if(opened.length === 0) compactBtn.textContent = '⊞ EXPANDIR';
  else compactBtn.textContent = '⊟ COMPACTO';
}
compactBtn.onclick = ()=>{
  const all = document.querySelectorAll('details.collapse-section');
  const opened = document.querySelectorAll('details.collapse-section[open]');
  const collapseAll = opened.length > 0;
  all.forEach(det=>{
    if(collapseAll) det.removeAttribute('open');
    else det.setAttribute('open','');
  });
  updateCompactBtn();
  if(!collapseAll){
    setTimeout(()=>{ capturarPosicionesPartitura(); updateScorePlayhead(playheadTime); }, 50);
  }
};
initCollapsibles();

