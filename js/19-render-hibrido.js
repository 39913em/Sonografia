
let lastPlayMode=null;

async function renderHibridoOffline(rango){
  const a = rango ? rango.a : 0;
  const b = rango ? rango.b : duracionAudio;
  const enRango = eventosSecuencia
    .filter(e => e.time >= a && e.time <= b)
    .sort((x,y)=>x.time-y.time);
  const sr = getCtx().sampleRate;
  const totalDur = (b - a) + 1.5;
  const totalSamples = Math.floor(sr * totalDur);
  const finalBuf = new AudioBuffer({length: totalSamples, sampleRate: sr, numberOfChannels: 1});
  const finalCh = finalBuf.getChannelData(0);
  const stepDurLocal = 60/bpmActual/8;
  const evDur = stepDurLocal * 2.5;
  const inst = instrumento.value;
  const CHUNK_SIZE = 60;
  const numChunks = Math.max(1, Math.ceil(enRango.length / CHUNK_SIZE));
  _renderingOffline = true;
  _atmosCount = 0;
  let jitState = (rebentSeed * 0x9E3779B1) >>> 0 || 1;
  const jitRnd = () => { jitState ^= jitState << 13; jitState ^= jitState >>> 17; jitState ^= jitState << 5; return ((jitState >>> 0) % 1000000) / 1000000; };
  try{
    for(let ci = 0; ci < numChunks; ci++){
      const start = ci * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, enRango.length);
      const group = enRango.slice(start, end);
      if(!group.length) continue;
      const t0 = group[0].time - a;
      const tLast = group[group.length-1].time - a;
      const chunkSpan = tLast - t0 + evDur + 0.5 + 0.01;
      const chunkSamples = Math.floor(sr * chunkSpan);
      if(chunkSamples <= 0) continue;
      const offline = new OfflineAudioContext(1, chunkSamples, sr);
      const masterGain = offline.createGain();
      const comp = offline.createDynamicsCompressor();
      comp.threshold.value=-18;comp.knee.value=8;comp.ratio.value=6;
      comp.attack.value=0.003;comp.release.value=0.18;
      masterGain.gain.value=1.55;
      masterGain.connect(comp);comp.connect(offline.destination);
      for(const e of group){
        let tRel = Math.max(0, (e.time - a) - t0);
        tRel += (jitRnd() - 0.5) * 0.003;
        if(tRel < 0) tRel = 0;
        const amp = e.ampNorm!==undefined?e.ampNorm:0.5;
        const v = (VOL_BY_BAND[e.band]||0.6)*(0.34+0.66*amp);
        try{ renderNoteToGain(offline, masterGain, e.freq, tRel, evDur, v, inst); }catch(err){}
      }
      const chunkBuf = await offline.startRendering();
      const chunkCh = chunkBuf.getChannelData(0);
      const startSample = Math.floor(t0 * sr);
      const len = Math.min(chunkCh.length, finalCh.length - startSample);
      for(let i = 0; i < len; i++) finalCh[startSample + i] += chunkCh[i];
      _atmosCount = 0;
    }
  } finally {
    _renderingOffline = false;
    _atmosCount = 0;
  }
  return finalBuf;
}

async function renderHibridoVivo(){
  if(!audioBuffer) throw new Error('Sin buffer de fuente');
  setStatus('🎬 Analizando toma viva...');
  const { eventos: evsVivo } = await analizarVivo(audioBuffer, bpmActual);
  const bands = {bass:chBass.checked, mid:chMid.checked, high:chHigh.checked};
  const filtrados = evsVivo.filter(e => bands[e.band]);
  if(!filtrados.length) throw new Error('Toma viva sin eventos');
  const maxAmp = filtrados.reduce((m,e)=>Math.max(m, e.amp||0), 0) || 1;
  for(const e of filtrados) e.ampNorm = Math.max(0, Math.min(1, (e.amp||0)/maxAmp));
  const sr = 44100;
  const maxTime = Math.max(duracionAudio, ...filtrados.map(e=>e.time), 0);
  const dur = maxTime + 1.5;
  const totalSamples = Math.floor(sr * dur);
  const offline = new OfflineAudioContext(1, totalSamples, sr);
  const masterGain = offline.createGain();
  const comp = offline.createDynamicsCompressor();
  comp.threshold.value=-18; comp.knee.value=8; comp.ratio.value=6;
  comp.attack.value=0.003; comp.release.value=0.18;
  masterGain.gain.value = 1.55;
  masterGain.connect(comp); comp.connect(offline.destination);
  const stepDurLocal = 60/bpmActual/4;
  const inst = instrumento.value;
  const volByBand = {bass:0.68, mid:0.58, high:0.48};
  const ordenados = filtrados.slice().sort((a,b)=>b.amp-a.amp).slice(0, 800).sort((a,b)=>a.time-b.time);
  _renderingOffline = true;
  _atmosCount = 0;
  try {
    for(const e of ordenados){
      const a = e.ampNorm;
      const v = volByBand[e.band]*(0.32+0.68*a);
      const d = stepDurLocal * 0.92;
      try{ renderNoteToGain(offline, masterGain, e.freq, e.time, d, v, inst); }catch(err){}
    }
  } finally {
    _renderingOffline = false;
    _atmosCount = 0;
  }
  setStatus('Renderizando toma viva...');
  return await offline.startRendering();
}

async function preRenderHibrido(){
  const myToken = ++_renderToken;
  audioBufferHibrido = null;
  playScore.disabled = true;
  setStatus('Renderizando...');
  try{
    const buf = await renderHibridoOffline(null);
    if(myToken !== _renderToken){ return; }
    audioBufferHibrido = buf;
    playScore.disabled = false;
    setStatus(`✅ Listo · ${eventosSecuencia.length} notas · ${bpmActual} BPM · seed ${rebentSeed}`);
  }catch(e){
    if(myToken !== _renderToken) return;
    console.error(e);
    setStatus('Error render: '+e.message, true);
  }
}

