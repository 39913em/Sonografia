
function encodeWAV(audioBuffer){
  const numChannels=audioBuffer.numberOfChannels;
  const sampleRate=audioBuffer.sampleRate;
  const length=audioBuffer.length;
  const dataLength=length*numChannels*2;
  const buffer=new ArrayBuffer(44+dataLength);
  const view=new DataView(buffer);
  const ws=(off,str)=>{for(let i=0;i<str.length;i++)view.setUint8(off+i,str.charCodeAt(i))};
  ws(0,'RIFF');view.setUint32(4,36+dataLength,true);ws(8,'WAVE');
  ws(12,'fmt ');view.setUint32(16,16,true);view.setUint16(20,1,true);
  view.setUint16(22,numChannels,true);view.setUint32(24,sampleRate,true);
  view.setUint32(28,sampleRate*numChannels*2,true);view.setUint16(32,numChannels*2,true);
  view.setUint16(34,16,true);ws(36,'data');view.setUint32(40,dataLength,true);
  const channels=[];
  for(let i=0;i<numChannels;i++)channels.push(audioBuffer.getChannelData(i));
  let peak=0;
  for(const data of channels)for(let i=0;i<data.length;i++)peak=Math.max(peak,Math.abs(data[i]));
  const norm=peak>0.001?Math.min(3,0.95/peak):1;
  let offset=44;
  for(let i=0;i<length;i++){
    for(let ch=0;ch<numChannels;ch++){
      let sample=channels[ch][i]*norm;
      sample=Math.max(-1,Math.min(1,sample));
      view.setInt16(offset,sample<0?sample*0x8000:sample*0x7FFF,true);
      offset+=2;
    }
  }
  return new Blob([buffer],{type:'audio/wav'});
}

function crearPreviewMarcaWAV(subtitulo, metaLineas, audioEl){
  const wrap = document.createElement('div');
  wrap.className = 'export-brand-block';
  const head = document.createElement('div');
  head.innerHTML = `<svg class="iso iso-hero" viewBox="0 0 40 40"><use href="#iso-02"/></svg>`;
  head.style.cssText = 'display:flex;justify-content:center;margin-top:10px';
  wrap.appendChild(head);
  const line = document.createElement('div');
  line.style.cssText = 'font-size:11px;letter-spacing:3px;color:#9a9aa8;text-transform:uppercase;text-align:center;line-height:1.8';
  line.innerHTML = subtitulo;
  wrap.appendChild(line);
  const body = document.createElement('div');
  body.className = 'export-brand-body';
  body.appendChild(audioEl);
  wrap.appendChild(body);
  const foot = document.createElement('div');
  foot.className = 'export-brand-footer';
  foot.innerHTML = metaLineas;
  wrap.appendChild(foot);
  return wrap;
}

function crearPreviewMarcaMIDI(contenidoBox, metaLineas){
  const wrap = document.createElement('div');
  wrap.className = 'export-brand-block';
  const head = document.createElement('div');
  head.innerHTML = `<svg class="iso iso-hero" viewBox="0 0 40 40"><use href="#iso-02"/></svg>`;
  head.style.cssText = 'display:flex;justify-content:center;margin-top:10px';
  wrap.appendChild(head);
  const line = document.createElement('div');
  line.style.cssText = 'font-size:11px;letter-spacing:3px;color:#9a9aa8;text-transform:uppercase;text-align:center;line-height:1.8';
  line.innerHTML = 'ARCHIVO MIDI · 3 PISTAS';
  wrap.appendChild(line);
  const body = document.createElement('div');
  body.className = 'export-brand-body';
  body.appendChild(contenidoBox);
  wrap.appendChild(body);
  const foot = document.createElement('div');
  foot.className = 'export-brand-footer';
  foot.innerHTML = metaLineas;
  wrap.appendChild(foot);
  return wrap;
}

function generarFichaASCII(totalEventos, rango){
  const e = etiquetaEstado();
  const ancho = 58;
  const rep = (c, n) => c.repeat(Math.max(0, n));
  const pad = (label, valor) => {
    const l = String(label);
    const v = String(valor);
    const total = l.length + v.length;
    const sep = Math.max(1, ancho - total);
    return `${l}${' '.repeat(sep)}${v}`;
  };
  const linea = (s) => `  │ ${String(s).padEnd(ancho)} │`;
  const lineaCentrada = (s) => {
    const left = Math.max(0, Math.floor((ancho - s.length) / 2));
    const right = Math.max(0, ancho - s.length - left);
    return `  │ ${' '.repeat(left)}${s}${' '.repeat(right)} │`;
  };
  const lineaVacia = () => `  │ ${' '.repeat(ancho)} │`;
  const sep = `  ├${rep('─', ancho+2)}┤`;
  const top = `  ┌${rep('─', ancho+2)}┐`;
  const bot = `  └${rep('─', ancho+2)}┘`;
  const fecha = fechaCreacion();
  const hora = horaCreacion();
  const bannerAncho = ancho + 4;
  const bannerTop = `╔${rep('═', bannerAncho)}╗`;
  const bannerBot = `╚${rep('═', bannerAncho)}╝`;
  const bannerLine = (txt) => `║ ${String(txt).padEnd(bannerAncho-2)} ║`;
  const bannerLineCentrada = (txt) => {
    const inner = bannerAncho - 2;
    const left = Math.max(0, Math.floor((inner - txt.length) / 2));
    const right = Math.max(0, inner - txt.length - left);
    return `║ ${' '.repeat(left)}${txt}${' '.repeat(right)} ║`;
  };

  

  const rangoTxt = e.partial ? `${e.rangeA}s → ${e.rangeB}s` : `0s → ${e.dur}s`;
  const tomasTxt = tomaActual === 'vivo' ? `VIVO · #${String(tomaVivoCount).padStart(3,'0')}` : '1:1 FIEL';

  const lineas = [];
  lineas.push('');
  lineas.push(bannerTop);
  lineas.push(bannerLineCentrada(''));
  lineas.push(bannerLineCentrada('SONOGRAFIA'));
  lineas.push(bannerLineCentrada('ERRORES VISIONOROS · By: 39913'));
  lineas.push(bannerLineCentrada('EL ERROR COMO MATERIALIDAD'));
  lineas.push(bannerLineCentrada(''));
  lineas.push(bannerLineCentrada('BY: 39913 · DATABENDING · 2017-2026'));
  lineas.push(bannerLineCentrada('EXPORT: CSV DATA · RAW SIN CUANTIZAR'));
  lineas.push(bannerBot);
  lineas.push('');
  
  lineas.push('');
  lineas.push(top);
  lineas.push(lineaCentrada('FICHA TECNICA'));
  lineas.push(sep);
  lineas.push(linea(pad('TEXTURA', e.textura)));
  lineas.push(linea(pad('MODO', e.modo)));
  lineas.push(linea(pad('BPM', e.bpm)));
  lineas.push(linea(pad('DURACION', e.dur + 's')));
  lineas.push(linea(pad('ESCALA', e.escala)));
  lineas.push(linea(pad('SYNTH', e.synth)));
  lineas.push(linea(pad('CLAVE', e.clef)));
  lineas.push(linea(pad('BANDAS', e.bands)));
  lineas.push(linea(pad('SEED', e.seed)));
  lineas.push(linea(pad('NOTAS', e.notas)));
  lineas.push(linea(pad('SILENCIOS', e.silencios)));
  lineas.push(linea(pad('RANGO', rangoTxt)));
  lineas.push(linea(pad('TOMA', tomasTxt)));
  lineas.push(sep);
  lineas.push(linea(pad('EVENTOS RAW', totalEventos)));
  lineas.push(linea(pad('FECHA', fecha)));
  lineas.push(linea(pad('HORA', hora)));
  lineas.push(bot);
  lineas.push('');
  lineas.push('  ── CSV DATA ────────────────────────────────────────────');
  lineas.push('');
  return lineas.join('\n');
}

expWav.onclick=async()=>{
  if(!eventosSecuencia.length){setStatus('Sin notas en secuencia',true);return}
  try{
    expWav.disabled=true;
    if(tomaActual === 'vivo'){
      setStatus('Renderizando toma viva...');
      let buf;
      try{ buf = await renderHibridoVivo(); }
      catch(err){
        console.error(err);
        setStatus('Error toma viva: '+err.message, true);
        expWav.disabled=false;
        return;
      }
      tomaVivoCount++;
      try{ localStorage.setItem('sono-toma-vivo-count', String(tomaVivoCount)); }catch(e){}
      actualizarTomaUI();
      const blob = encodeWAV(buf);
      const audio = document.createElement('audio');
      audio.controls = true; audio.autoplay = true;
      audio.src = URL.createObjectURL(blob);
      audio.style.width = 'min(760px,100%)';
      const tomaNum = String(tomaVivoCount).padStart(3,'0');
      const titulo = `PREVISUALIZACIÓN · TOMA VIVA #${tomaNum}`;
      const info = `${buf.duration.toFixed(1)}s · 44.1kHz · irrepetible · synth ${instrumento.value.toUpperCase()} · ♩=${bpmActual}`;
      const contenido = crearPreviewMarcaWAV(
        `TOMA VIVA #${tomaNum} · ${buf.duration.toFixed(1)}s · 44.1 kHz · síntesis en vivo`,
        `${leyendaEstado(' · ')}<br>"El error como materialidad" `,
        audio
      );
      abrirPreviewExport('wav', titulo, info, contenido, blob, nombreArchivo('wav') + `-toma${tomaNum}.wav`);
      setStatus(`🎬 Toma viva #${tomaNum} lista · ${(blob.size/1024/1024).toFixed(1)} MB`);
    } else {
      setStatus('Renderizando WAV...');
      const r = getRango();
      const full = (r.a === 0) && (r.b >= duracionAudio);
      let buf;
      if(full && audioBufferHibrido){ buf = audioBufferHibrido; }
      else { buf = await renderHibridoOffline(r); }
      const blob=encodeWAV(buf);
      const audio=document.createElement('audio');
      audio.controls=true;audio.autoplay=true;audio.src=URL.createObjectURL(blob);
      audio.style.width='min(760px,100%)';
      const contenido = crearPreviewMarcaWAV(
        `TOMA 1:1 FIEL · ${buf.duration.toFixed(1)}s · documento reproducible`,
        `${leyendaEstado(' · ')}<br>"El error como materialidad" `,
        audio
      );
      abrirPreviewExport('wav','PREVISUALIZACIÓN · WAV',
        `${buf.duration.toFixed(1)}s · ${leyendaEstado(' · ')}`,
        contenido,blob,nombreArchivo('wav')+'.wav');
      setStatus(`WAV listo · ${(blob.size/1024/1024).toFixed(1)} MB`);
    }
  }catch(e){
    console.error(e);
    setStatus('Error WAV: '+e.message,true);
  }
  expWav.disabled=false;
};

