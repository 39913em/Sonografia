function tocarSecuencia(startOffset=0){
  if(!audioBufferHibrido){
    setStatus('Renderizando, espera...', true);
    return;
  }
  try{
    const ctx=getCtx();
    if(ctx.state==='suspended') ctx.resume();
    if(currentSource){try{currentSource.stop()}catch(e){}; currentSource=null;}
    try{
      if(source){try{source.stop()}catch(e){}; source=null;}
    }catch(e){}
    const newSource = ctx.createBufferSource();
    newSource.buffer = audioBufferHibrido;
    newSource.connect(ctx.destination);
    const durBuf = audioBufferHibrido.duration;
    const offset = Math.max(0, Math.min(startOffset, durBuf - 0.001));
    const playDur = Math.max(0.01, durBuf - offset);
    const now = ctx.currentTime + 0.03;
    newSource.start(now, offset, playDur);
    currentSource = newSource;
    audioStartTime = now - offset;
    totalReproDuration = durBuf;
    setStatus(`🎵 SECUENCIA · ${eventosSecuencia.length} notas · ${instrumento.value}`);
    playingInd.classList.add('on');
    lastPlayMode='seq';
    const totalDur = duracionAudio + 0.5;
    const eventList = eventosSecuencia.map((e,i) => ({
      start: e.time,
      end: e.time + (60/bpmActual/8)*2.5,
      eventIndex: i
    }));
    startCounter(totalDur, eventList, startOffset, 'seq');
    playingTimer=setTimeout(()=>{
      playingInd.classList.remove('on');
      if(currentSource){try{currentSource.stop()}catch(e){}; currentSource=null;}
      playheadTime=0;
    },(totalDur-startOffset+0.5)*1000);
  }catch(e){console.error(e);setStatus('Error: '+e.message,true)}
}

async function procesar(){
  if(!imageData||procesando)return;
  procesando=true;
  setStatus(`Procesando ${duracionAudio}s...`);
  setEnabled(false);setProgress(0);
  try{
    const ctx=getCtx();
    audioBufferHibrido=null;
    if(typeof _renderToken!=='undefined') _renderToken++;
    if(typeof playScore!=='undefined' && playScore) playScore.disabled=true;
    let bmp=crearBMP(imageData);
    const modo=textura.value;
    bmp=aplicarTextura(bmp,modo,rebentSeed);
    lastBmpBytes = bmp;
    audioBuffer=bytesToAudio(bmp,ctx,duracionAudio);
    dibujarWave(cWave);
    const bpm=parseInt(bpmInput.value)||128;
    bpmActual=bpm;
    const{eventos:evs,stepDur:sd}=await analizar(audioBuffer,bpm);
    eventos=evs;stepDur=sd;
    const maxAmp=eventos.reduce((m,e)=>Math.max(m,e.amp||0),0)||1;
    for(const e of eventos)e.ampNorm=Math.max(0,Math.min(1,(e.amp||0)/maxAmp));
    const ch=audioBuffer.getChannelData(0);
    const spec=fftReal(ch.slice(0,2048));
    dibujarSpec(cSpec,spec);
    dibujarBent(audioBuffer, bmp);
    procesarEventos();
    setEnabled(true);
  }catch(e){console.error(e);setStatus('Error: '+e.message,true);setEnabled(true)}
  setProgress(null);procesando=false;
}