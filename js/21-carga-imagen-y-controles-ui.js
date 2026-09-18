
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
  if(currentSource){try{currentSource.stop()}catch(e){}; currentSource=null;}
  if(typeof playingTimer!=='undefined' && playingTimer){clearTimeout(playingTimer); playingTimer=null;}
  if(typeof playingInd!=='undefined' && playingInd) playingInd.classList.remove('on');
  if(typeof stopAllVoices==='function') stopAllVoices();
  if(typeof hideScorePlayhead==='function') hideScorePlayhead();
  if(source)try{source.stop()}catch(e){}
  source=ctx.createBufferSource();source.buffer=audioBuffer;source.connect(ctx.destination);
  const offset = Math.max(0, Math.min(playheadTime||0, audioBuffer.duration - 0.001));
  source.start(ctx.currentTime + 0.03, offset);
  setStatus(`▶ Ruido ${duracionAudio}s desde ${offset.toFixed(1)}s`);
};

stop.onclick=()=>{if(source)try{source.stop()}catch(e){};setStatus('⏹')};
playScore.onclick=()=>{
  const desde = pausedAt > 0 ? pausedAt : (playheadTime||0);
  pausedAt = 0;
  tocarSecuencia(desde);
};
pauseScore.onclick=()=>{
  if(!playingInd.classList.contains('on')) return;
  pausedAt = playheadTime;
  if(currentSource){try{currentSource.stop()}catch(e){}; currentSource=null;}
  if(counterRAF){cancelAnimationFrame(counterRAF);counterRAF=null;}
  if(playingTimer){clearTimeout(playingTimer);playingTimer=null;}
  playingInd.classList.remove('on');
  setStatus(`⏸ Pausa en ${pausedAt.toFixed(1)}s`);
};
stopMelody.onclick=()=>{
  pausedAt = 0;
  if(currentSource){try{currentSource.stop()}catch(e){}; currentSource=null;}
  if(counterRAF){cancelAnimationFrame(counterRAF);counterRAF=null;}
  if(playingTimer){clearTimeout(playingTimer);playingTimer=null;}
  playingInd.classList.remove('on');
  stopAllVoices();
  if(typeof stopCounter==='function') stopCounter();
  else { hideScorePlayhead(); playheadTime=0; }
  setStatus('⏹ Melodía detenida');
};

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

