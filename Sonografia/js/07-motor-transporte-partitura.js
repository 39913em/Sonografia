
function stopAllVoices(){
  if(currentSource){try{currentSource.stop()}catch(e){}; currentSource=null;}
  for(const v of activeVoices){
    for(const o of v.osc){try{o.stop()}catch(e){};try{o.disconnect()}catch(e){}}
    try{v.gain.disconnect()}catch(e){}
  }
  activeVoices=[];
  _atmosCount = 0;
  if(playingTimer){clearTimeout(playingTimer);playingTimer=null}
  playingInd.classList.remove('on');
  if(counterRAF){cancelAnimationFrame(counterRAF);counterRAF=null}
}
function formatTime(s){
  if(!isFinite(s)||s<0)s=0;
  const m=Math.floor(s/60),sec=Math.floor(s%60),ds=Math.floor((s*10)%10);
  return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}.${ds}`;
}

function buildEventosSecuencia(){
  const sorted = Object.keys(slots).map(Number).sort((a,b)=>a-b);
  if(!sorted.length) return [];
  const slotDur = 60/bpmActual/8;
  const out = [];
  for(const s of sorted){
    const byBand = {bass:null, mid:null, high:null};
    for(const e of slots[s]){
      if(byBand[e.band]) continue;
      const amp = e.ampNorm !== undefined ? e.ampNorm : 0;
      if(amp <= 0.12) continue;
      const q = cuantizar(e.freq);
      if(q) byBand[e.band] = e;
    }
    for(const band of ['bass','mid','high']){
      const e = byBand[band];
      if(!e) continue;
      const q = cuantizar(e.freq);
      out.push({
        time: s * slotDur,
        slot: s,
        freq: e.freq,
        amp: e.amp,
        ampNorm: e.ampNorm,
        band: e.band,
        nom: q.nom,
        midi: q.midi,
        key: q.key
      });
    }
  }
  return out;
}

function ensurePlayheadInSVG(){
  const svgEl = partituraEl.querySelector('svg');
  if(!svgEl) return null;
  let g = svgEl.querySelector('#playhead-group');
  if(!g){
    const NS = 'http://www.w3.org/2000/svg';
    g = document.createElementNS(NS, 'g');
    g.setAttribute('id', 'playhead-group');
    g.setAttribute('pointer-events', 'none');
    const line = document.createElementNS(NS, 'line');
    line.setAttribute('id', 'playhead-line-svg');
    line.setAttribute('stroke', '#ff2050');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('vector-effect', 'non-scaling-stroke');
    line.style.display = 'none';
    g.appendChild(line);
    const rect = document.createElementNS(NS, 'rect');
    rect.setAttribute('id', 'playhead-rect-svg');
    rect.setAttribute('fill', 'rgba(255,32,80,0.18)');
    rect.setAttribute('stroke', '#ff2050');
    rect.setAttribute('stroke-width', '2');
    rect.setAttribute('rx', '4');
    rect.setAttribute('ry', '4');
    rect.setAttribute('vector-effect', 'non-scaling-stroke');
    rect.style.display = 'none';
    g.appendChild(rect);
    svgEl.appendChild(g);
  }
  return {svgEl, line: g.querySelector('#playhead-line-svg'), rect: g.querySelector('#playhead-rect-svg')};
}

function capturarPosicionesPartitura(){
  partituraNotes=[];
  svgViewBox=null;
  const svgEl=partituraEl.querySelector('svg');
  if(!svgEl||!vfNoteRefs.length)return;
  const vb=svgEl.getAttribute('viewBox');
  if(!vb)return;
  const parts=vb.split(/[\s,]+/).map(Number);
  if(parts.length<4||parts.some(v=>!isFinite(v)))return;
  svgViewBox={x:parts[0],y:parts[1],w:parts[2],h:parts[3]};
  const bySystem=new Map();
  for(const item of vfNoteRefs){
    if(!bySystem.has(item.systemIdx))bySystem.set(item.systemIdx,[]);
    bySystem.get(item.systemIdx).push(item);
  }
  for(const [systemIdx,items] of bySystem){
    items.sort((a,b)=>a.slotStart-b.slotStart);
    const staveBox=items[0].staveBox;
    for(const item of items){
      let x=0;
      try{x=item.note.getAbsoluteX()}catch(e){}
      let yTop=staveBox.y+20,yBot=staveBox.y+staveBox.h-20;
      try{
        const bb=item.note.getBoundingBox();
        if(bb&&bb.w>0&&bb.h>0){yTop=bb.y;yBot=bb.y+bb.h}
      }catch(e){}
      partituraNotes.push({idx:item.globalIdx,x,y:yTop,h:Math.max(1,yBot-yTop),systemIdx,slotStart:item.slotStart,slotEnd:item.slotEnd,staveBox});
    }
  }
  partituraNotes.sort((a,b)=>a.slotStart-b.slotStart);
}

function updateScorePlayhead(currentTime){
  if(!partituraNotes.length || !svgViewBox) return;
  const ref = ensurePlayheadInSVG();
  if(!ref) return;
  const slotDur = 60/bpmActual/8;
  const scoreT = Math.max(0, Math.min(duracionAudio - 0.0001, currentTime));
  const absoluteSlot = scoreT / slotDur;
  let nota = partituraNotes.find(n => absoluteSlot >= n.slotStart && absoluteSlot < n.slotEnd);
  let next = null;
  if(nota){
    const idx = partituraNotes.indexOf(nota);
    next = partituraNotes[idx+1] || null;
  } else {
    const before = partituraNotes.filter(n => n.slotStart <= absoluteSlot).pop();
    const after = partituraNotes.find(n => n.slotStart > absoluteSlot);
    nota = before || after;
    next = after || null;
  }
  if(!nota) return;
  const p = Math.max(0, Math.min(1, (absoluteSlot - nota.slotStart) / Math.max(0.000001, nota.slotEnd - nota.slotStart)));
  let xInterp = nota.x;
  if(next && next.systemIdx === nota.systemIdx){
    xInterp = nota.x + p * (next.x - nota.x);
  } else if(p > 0){
    const staveRight = nota.staveBox.x + nota.staveBox.w - 8;
    xInterp = nota.x + p * Math.max(12, staveRight - nota.x);
  }
  const yTop = nota.staveBox.y;
  const yBot = nota.staveBox.y + nota.staveBox.h;
  const noteY = nota.y;
  const noteH = nota.h;
  ref.line.setAttribute('x1', xInterp);
  ref.line.setAttribute('y1', yTop);
  ref.line.setAttribute('x2', xInterp);
  ref.line.setAttribute('y2', yBot);
  ref.line.style.display = '';
  ref.rect.setAttribute('x', xInterp - 17);
  ref.rect.setAttribute('y', noteY - 2);
  ref.rect.setAttribute('width', 34);
  ref.rect.setAttribute('height', noteH + 4);
  ref.rect.style.display = '';
  const rectBox = ref.svgEl.getBoundingClientRect();
  if(rectBox.height > 0){
    const scaleY = rectBox.height / svgViewBox.h;
    const yPx = (yTop - svgViewBox.y) * scaleY;
    const hPx = (yBot - yTop) * scaleY;
    const now = performance.now();
    if(now - _lastAutoScrollTime > 120){
      const box = partituraEl;
      const margin = 40;
      if(yPx < box.scrollTop + margin){
        box.scrollTop = Math.max(0, yPx - margin);
        _lastAutoScrollTime = now;
      } else if(yPx + hPx > box.scrollTop + box.clientHeight - margin){
        box.scrollTop = yPx + hPx - box.clientHeight + margin;
        _lastAutoScrollTime = now;
      }
    }
  }
}
function hideScorePlayhead(){
  const svgEl = partituraEl.querySelector('svg');
  if(!svgEl) return;
  const line = svgEl.querySelector('#playhead-line-svg');
  const rect = svgEl.querySelector('#playhead-rect-svg');
  if(line) line.style.display = 'none';
  if(rect) rect.style.display = 'none';
}
partituraEl.addEventListener('scroll', ()=>{ if(playheadTime>=0) updateScorePlayhead(playheadTime); }, {passive:true});

