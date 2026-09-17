

function fechaCreacion(){
  const d=new Date();
  const dd=String(d.getDate()).padStart(2,'0');
  const mm=String(d.getMonth()+1).padStart(2,'0');
  const yy=String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
}
function horaCreacion(){
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
}
function getRango(){
  const rs = (typeof rangeStart!=='undefined' && rangeStart) ? rangeStart.value : 0;
  const re = (typeof rangeEnd!=='undefined' && rangeEnd) ? rangeEnd.value : duracionAudio;
  let a = Math.max(0, Math.min(duracionAudio, parseFloat(rs) || 0));
  let b = parseFloat(re);
  if(!isFinite(b)) b = duracionAudio;
  b = Math.max(a + 1, Math.min(duracionAudio, b));
  return { a, b };
}
function etiquetaEstado(){
  const bands = [];
  if(chBass.checked) bands.push('B');
  if(chMid.checked) bands.push('M');
  if(chHigh.checked) bands.push('A');
  const r = getRango();
  const partial = (r.a > 0) || (r.b < duracionAudio);
  return {
    textura:(textura.value || 'raw').toUpperCase(),
    modo:(modoActual || 'hibrido').toUpperCase(),
    bpm:bpmActual, dur:duracionAudio,
    escala:(ESCALAS[escalaActual]?.name || '—').toUpperCase(),
    synth:(instrumento.value || '—').toUpperCase(),
    bands:bands.join('') || '∅',
    clef:clefActual === 'bass' ? 'FA' : 'SOL',
    notas:lastSeqLen || 0, silencios:lastSilencios || 0, total:lastMaterialLen || 0,
    rangeA:r.a, rangeB:r.b, partial,
    seed:rebentSeed,
    integridad:Math.round(getIntensidadProgresiva()*100),
    toma:tomaActual
  };
}
function slugEstado(e){
  const clean = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
  const base = [clean(e.textura),clean(e.modo),e.bpm,e.dur+'s',clean(e.escala),clean(e.synth),clean(e.bands),clean(e.clef)];
  if(e.seed > 0) base.push('s'+e.seed);
  if(e.partial) base.push(`r${e.rangeA}-${e.rangeB}s`);
  return base.join('-');
}
function nombreArchivo(tipo){
  const e = etiquetaEstado();
  return `Sonograph39913-${tipo}-${slugEstado(e)}-${fechaCreacion()}`;
}
function leyendaEstado(sep=' · '){
  const e = etiquetaEstado();
  const parts = [
    e.textura, e.modo, `${e.bpm} BPM`, `${e.dur}s`, e.escala, e.synth,
    `CLAVE ${e.clef}`, `BANDAS ${e.bands}`,
    `SEED ${e.seed}/5`, `INTEGRIDAD ${e.integridad}%`,
    `${e.notas} NOTAS / ${e.silencios} SILENCIOS`
  ];
  if(e.partial) parts.push(`EXPORT ${e.rangeA}s→${e.rangeB}s`);
  return parts.join(sep);
}

