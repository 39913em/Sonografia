
expMidi.onclick=()=>{
  if(!eventosSecuencia.length){setStatus('Sin notas en secuencia',true);return}
  try{
    if(typeof Midi==='undefined'){setStatus('MIDI no cargado',true);return}
    const r = getRango();
    const midi=new Midi();
    try{midi.header.setTempo(bpmActual)}catch(e){}
    const porBanda={bass:[],mid:[],high:[]};
    for(const e of eventosSecuencia){
      if(e.time < r.a || e.time > r.b) continue;
      if(e.midi!==undefined)porBanda[e.band].push({midi:e.midi,time:e.time-r.a,ampNorm:e.ampNorm});
    }
    let total=0;
    for(const b of ['bass','mid','high']){
      const evs=porBanda[b];if(!evs.length)continue;
      const track=midi.addTrack();
      try{track.name=b.toUpperCase()}catch(e){}
      for(const e of evs){
        try{track.addNote({midi:e.midi,time:e.time,duration:stepDur*2.5,velocity:Math.max(0.12,Math.min(1,(e.ampNorm!==undefined?e.ampNorm:0.5)))});total++}catch(err){}
      }
    }
    if(!total){setStatus('Sin notas en rango',true);return}
    const blob=new Blob([midi.toArray()],{type:'audio/midi'});
    const _ee = etiquetaEstado();
    const box=document.createElement('div');
    box.className='export-summary';
    box.style.width='100%';
    box.innerHTML=`
      Textura: <b>${_ee.textura}</b><br>
      Modo: <b>${_ee.modo}</b><br>
      BPM: <b>${_ee.bpm}</b><br>
      Duración: <b>${_ee.dur}s</b>${_ee.partial?` (export ${_ee.rangeA}s→${_ee.rangeB}s)`:''}<br>
      Escala: <b>${_ee.escala}</b><br>
      Synth de referencia: <b>${_ee.synth}</b><br>
      Clave: <b>${_ee.clef}</b><br>
      Bandas: <b>${_ee.bands}</b><br>
      Seed del glitch: <b>${_ee.seed}</b><br>
      Toma: <b>${_ee.toma === 'vivo' ? 'VIVO' : 'FIEL'}</b><br>
      Total: <b>${total}</b> notas en 3 pistas (BAJO / MEDIO / AGUDO).`;
    const contenido = crearPreviewMarcaMIDI(
      box,
      `${leyendaEstado(' · ')}<br>"El error como materialidad"`
    );
    abrirPreviewExport('midi','PREVISUALIZACIÓN · MIDI',
      `${total} notas · ${leyendaEstado(' · ')}`,
      contenido,blob,nombreArchivo('midi')+'.mid');
  }catch(e){console.error(e);setStatus('Error MIDI: '+e.message,true)}
};

