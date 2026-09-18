
function startCounter(duration,eventList,startOffset=0,mode='seq'){
  if(counterRAF){cancelAnimationFrame(counterRAF);counterRAF=null}
  audioStartTime = getCtx().currentTime - startOffset;
  counterDuration=duration;
  counterEventList=eventList||[];
  totalReproDuration=duration;
  playerPanel.classList.add('on');
  timeTotal.textContent=`/ ${formatTime(duration)}`;
  tickCounter();
}
function stopCounter(){
  if(counterRAF){cancelAnimationFrame(counterRAF);counterRAF=null}
  document.querySelectorAll('.notas-box .evt.playing').forEach(el=>el.classList.remove('playing'));
  if(!scrubbing){
    currentNote.innerHTML='<span class="label">NOTA</span><span class="val">—</span><span class="freq"></span>';
    progressBar2.style.width='0%';
    timeCurrent.textContent='00:00.0';
    playheadTime=0;
    dibujarEventos(0);
    hideScorePlayhead();
  }
}
function ensureEventVisible(el){
  const box=notasEl;
  const boxRect=box.getBoundingClientRect();
  const elRect=el.getBoundingClientRect();
  const margin=8;
  if(elRect.top < boxRect.top + margin){
    box.scrollTop += (elRect.top - boxRect.top) - margin;
  } else if(elRect.bottom > boxRect.bottom - margin){
    box.scrollTop += (elRect.bottom - boxRect.bottom) + margin;
  }
}
function tickCounter(){
  if(scrubbing)return;
  const elapsed = getCtx().currentTime - audioStartTime;
  playheadTime=Math.max(0, Math.min(elapsed,counterDuration));
  timeCurrent.textContent=formatTime(playheadTime);
  progressBar2.style.width=Math.min(100,(playheadTime/counterDuration)*100)+'%';
  if(counterEventList.length){
    let current=null;
    for(let i=0;i<counterEventList.length;i++){
      const ce=counterEventList[i];
      if(elapsed>=ce.start&&elapsed<ce.end){current=ce;break}
    }
    document.querySelectorAll('.notas-box .evt.playing').forEach(el=>el.classList.remove('playing'));
    if(current){
      if(current.eventIndex < notasShownCount){
        const el=document.querySelector(`.notas-box .evt[data-idx="${current.eventIndex}"]`);
        if(el){el.classList.add('playing'); ensureEventVisible(el);}
      } else {
        notasShownCount = Math.min(eventosSecuencia.length, current.eventIndex + 100);
        actualizarNotas();
        setTimeout(()=>{
          const el2=document.querySelector(`.notas-box .evt[data-idx="${current.eventIndex}"]`);
          if(el2){el2.classList.add('playing'); ensureEventVisible(el2);}
        },10);
      }
      const ev=eventosSecuencia[current.eventIndex];
      if(ev){
        currentNote.innerHTML=`<span class="label">NOTA</span><span class="val">${ev.nom || '—'}</span><span class="freq">${ev.freq.toFixed(1)}Hz · ${ev.band.toUpperCase()}</span>`;
      }
    }
    dibujarEventos(elapsed);
  }
  updateScorePlayhead(elapsed);
  if(elapsed<counterDuration+0.1){counterRAF=requestAnimationFrame(tickCounter)}
  else{stopCounter(); if(currentSource){try{currentSource.stop()}catch(e){}; currentSource=null;}}
}

function scrubTo(clientX){
  const rect=cEvents.getBoundingClientRect();
  const x=Math.max(0,Math.min(1,(clientX-rect.left)/rect.width));
  const totalTime=counterDuration||duracionAudio;
  playheadTime=x*totalTime;
    pausedAt=0;

  timeCurrent.textContent=formatTime(playheadTime);
  if(totalTime) progressBar2.style.width=Math.min(100,(playheadTime/totalTime)*100)+'%';
  dibujarEventos(playheadTime);
  let closest=null,minDist=0.4;
  for(const e of eventosSecuencia){
    const d=Math.abs(e.time-playheadTime);
    if(d<minDist){minDist=d;closest=e}
  }
  if(closest){
    currentNote.innerHTML=`<span class="label">NOTA</span><span class="val">${closest.nom || '—'}</span><span class="freq">${closest.freq.toFixed(1)}Hz · ${closest.band.toUpperCase()}</span>`;
  } else {
    currentNote.innerHTML='<span class="label">NOTA</span><span class="val">—</span><span class="freq"></span>';
  }
  updateScorePlayhead(playheadTime);
}
function scrubStart(e){
  if(!eventosSecuencia.length) return;
  if(e.type==='touchstart'||e.buttons===1){
    scrubbing=true;
    wasPlaying=playingInd.classList.contains('on');
    if(wasPlaying){
      if(currentSource){try{currentSource.stop()}catch(err){};currentSource=null}
      if(playingTimer){clearTimeout(playingTimer);playingTimer=null}
      if(counterRAF){cancelAnimationFrame(counterRAF);counterRAF=null}
      playingInd.classList.remove('on');
    } else {
      playerPanel.classList.add('on');
    }
    const clientX = e.clientX !== undefined ? e.clientX : (e.touches&&e.touches[0]?e.touches[0].clientX:0);
    scrubTo(clientX);
    e.preventDefault();
  }
}
function scrubMove(e){
  if(!scrubbing) return;
  const clientX = e.clientX !== undefined ? e.clientX : (e.touches&&e.touches[0]?e.touches[0].clientX:0);
  scrubTo(clientX);
  e.preventDefault();
}
function scrubEnd(){
  if(!scrubbing) return;
  scrubbing=false;
  if(wasPlaying){
    wasPlaying=false;
    if(lastPlayMode==='seq') tocarSecuencia(playheadTime);
  }
}
cEvents.addEventListener('mousedown',scrubStart);
document.addEventListener('mousemove',scrubMove);
document.addEventListener('mouseup',scrubEnd);
cEvents.addEventListener('touchstart',scrubStart,{passive:false});
document.addEventListener('touchmove',scrubMove,{passive:false});
document.addEventListener('touchend',scrubEnd);

