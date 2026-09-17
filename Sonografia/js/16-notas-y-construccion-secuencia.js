
function actualizarNotas(){
  if(!eventosSecuencia.length){
    notasEl.innerHTML='<span class="empty">⏺ Sin notas en secuencia</span>';
    return;
  }
  const total = eventosSecuencia.length;
  const show = Math.min(notasShownCount, total);
  let html='';
  for(let i=0;i<show;i++){
    const e = eventosSecuencia[i];
    const b = e.band==='bass'?'B':e.band==='mid'?'M':'A';
    html += `<div class="evt" data-idx="${i}"><span class="idx">${String(i+1).padStart(3,'0')}</span><span class="band">[${b}]</span><span class="time">${e.time.toFixed(2)}s</span><span class="freq">${e.freq.toFixed(1)}Hz</span><span class="note">→ ${e.nom||'—'}</span></div>`;
  }
  if(show < total){
    html += `<button class="load-more" data-action="more">▼ VER +200 (${total-show} restantes)</button>`;
  } else {
    html += `<div class="end-marker">— ${total} notas en secuencia —</div>`;
  }
  notasEl.innerHTML = html;
  const btn = notasEl.querySelector('[data-action="more"]');
  if(btn){
    btn.addEventListener('click', ()=>{
      notasShownCount += 200;
      actualizarNotas();
    });
  }
}

function construirSecuencia(){
  const maxSlots = Math.ceil(duracionAudio / (60/bpmActual/8));
  const material = [];
  let noteCount = 0;
  for(let s=0; s<maxSlots; s++){
    const evs = slots[s] ? slots[s].slice() : [];
    const byBand = {bass:null, mid:null, high:null};
    for(const e of evs){
      if(byBand[e.band]) continue;
      const amp = e.ampNorm!==undefined ? e.ampNorm : 0;
      if(amp <= 0.12) continue;
      const q = cuantizar(e.freq);
      if(q) byBand[e.band] = {...q, slot:s, band:e.band, amp:e.amp, ampNorm:e.ampNorm||0, freqReal:e.freq};
    }
    const slotNotes = [byBand.bass, byBand.mid, byBand.high].filter(n=>n);
    material.push(slotNotes.length ? slotNotes : null);
    if(slotNotes.length) noteCount++;
  }
  lastMaterialLen = material.length;
  lastSilencios = material.length - noteCount;
  return {material, noteCount, slotStart:0, slotEnd:maxSlots};
}

