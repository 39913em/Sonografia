
function duracionFigura(slotsCount){
  const tabla=[
    [32,'w',0],[24,'h',1],[16,'h',0],[12,'q',1],[8,'q',0],
    [6,'8',1],[4,'8',0],[3,'16',1],[2,'16',0],[1,'32',0]
  ];
  for(const [consume,base,dots] of tabla){
    if(slotsCount>=consume)return {base,consume,dots};
  }
  return {base:'32',consume:1,dots:0};
}
function slotSignature(slot){
  if(!slot || !slot.length) return '';
  return slot.map(n=>n.midi).sort((a,b)=>a-b).join(',');
}
function crearFiguraVex(VF, slot, figura, esSilencio){
  if(esSilencio){
    const note=new VF.StaveNote({keys:['b/4'],duration:figura.base+'r'});
    for(let d=0;d<figura.dots;d++){ try{note.addDotToAll();}catch(e){} }
    note.__isRest=true;
    return note;
  }
  const keys=[]; const slotKeyIdx=[];
  slot.forEach(n=>{
    let idx=keys.indexOf(n.key);
    if(idx===-1){ idx=keys.length; keys.push(n.key); }
    slotKeyIdx.push(idx);
  });
  const note=new VF.StaveNote({keys, duration:figura.base});
  slot.forEach((n,i)=>{
    if(n.key.includes('#')){
      try{ note.addModifier(new VF.Accidental('#'), slotKeyIdx[i]); }catch(e){}
    }
  });
  for(let d=0;d<figura.dots;d++){ try{note.addDotToAll();}catch(e){} }
  note.__isRest=false;
  return note;
}
function construirFiguras(VF,material,offset,count){
  const figuras=[];
  let i=offset;
  const fin=Math.min(offset+count,material.length);
  while(i<fin){
    const slot=material[i];
    const sig=slotSignature(slot);
    let run=1;
    while(i+run<fin){
      if(slotSignature(material[i+run])===sig) run++;
      else break;
    }
    let restante=run; let cursor=i;
    while(restante>0){
      const figura=duracionFigura(restante);
      const take=Math.min(figura.consume,restante);
      const note=crearFiguraVex(VF, slot, figura, !slot);
      note.__slotStart=cursor;
      note.__slotEnd=cursor+take;
      note.__isRest=!slot;
      figuras.push(note);
      cursor+=take; restante-=take;
    }
    i+=run;
  }
  return figuras;
}

function renderPartitura(){
  scoreHost.innerHTML='';
  vfNoteRefs=[];
  partituraNotes=[];
  systemBoxes=[];
  if(!eventosSecuencia.length){
    partTitle.textContent='SONOGRAFÍA · —';
    partInfo.textContent='0 figuras · ♩ = '+bpmActual+' · '+instrumento.value.toUpperCase();
    lastSeqLen=0;
    scoreHost.innerHTML='<span class="empty">⏺ Sin notas</span>';
    return;
  }
  try{
    const VF=Vex.Flow;
    const datos=construirSecuencia();
    const material=datos.material;
    lastSeqLen=datos.noteCount;
    partTitle.textContent=`SONOGRAFÍA · ${ESCALAS[escalaActual].name.toUpperCase()} · CLAVE ${clefActual==='bass'?'FA':'SOL'}`;
    partInfo.textContent = leyendaEstado(' · ');
    if(!material.length){
      scoreHost.innerHTML='<span class="empty">Sin material cuantizable</span>';
      return;
    }
    const CHUNK=32;
    const systems=[];
    for(let i=0;i<material.length;i+=CHUNK)systems.push(material.slice(i,i+CHUNK));
    const staveWidth=780;
    const systemHeight=112;
    const paddingTop=10;
    const paddingBottom=15;
    const svgW=staveWidth+40;
    const svgH=paddingTop+systems.length*systemHeight+paddingBottom;
    const renderer=new VF.Renderer(scoreHost,VF.Renderer.Backends.SVG);
    renderer.resize(svgW,svgH);
    const ctx=renderer.getContext();
    let globalNoteIdx=0;
    systems.forEach((sys,sIdx)=>{
      const yPos=paddingTop+sIdx*systemHeight;
      const stave=new VF.Stave(10,yPos,staveWidth);
      if(sIdx===0)stave.addClef(clefActual).addTimeSignature('4/4');
      else stave.addClef(clefActual);
      if(sIdx===systems.length-1){try{stave.setEndBarType(VF.Barline.type.END)}catch(e){}}
      stave.setContext(ctx).draw();
      const sysBB=stave.getBoundingBox();
      systemBoxes.push({ idx:sIdx, y:sysBB.y, h:sysBB.h });
      const startSlot=sIdx*CHUNK;
      const vf=construirFiguras(VF,material,startSlot,sys.length);
      const voice=new VF.Voice({num_beats:4,beat_value:4});
      voice.setStrict(false);
      voice.addTickables(vf);
      new VF.Formatter().joinVoices([voice]).format([voice],staveWidth-78);
      voice.draw(ctx,stave);
      const staveBox=stave.getBoundingBox();
      for(const note of vf){
        if(note.__isRest)continue;
        vfNoteRefs.push({
          note,systemIdx:sIdx,staveBox,
          globalIdx:globalNoteIdx++,
          slotStart:datos.slotStart+note.__slotStart,
          slotEnd:datos.slotStart+note.__slotEnd
        });
      }
    });
    const svgEl=partituraEl.querySelector('svg');
    if(svgEl){
      requestAnimationFrame(()=>{
        try{
          let bbox=null;
          try{bbox=svgEl.getBBox()}catch(e){}
          if(!bbox||bbox.width===0){
            const g=svgEl.querySelector('g');
            if(g){try{bbox=g.getBBox()}catch(e){}}
          }
          if(bbox&&bbox.width>0&&bbox.height>0){
            const pad=8;
            const vx=bbox.x-pad,vy=bbox.y-pad,vw=bbox.width+pad*2,vh=bbox.height+pad*2;
            svgEl.setAttribute('viewBox',`${vx} ${vy} ${vw} ${vh}`);
            svgEl.dataset.natW=vw;
            svgEl.dataset.natH=vh;
          }else{
            svgEl.setAttribute('viewBox',`0 0 ${svgW} ${svgH}`);
            svgEl.dataset.natW=svgW;
            svgEl.dataset.natH=svgH;
          }
          svgEl.removeAttribute('width');
          svgEl.removeAttribute('height');
          svgEl.style.width='100%';
          svgEl.style.height='auto';
          svgEl.style.display='block';
          svgEl.style.background='#fff';
          setTimeout(()=>{
            capturarPosicionesPartitura();
            updateScorePlayhead(playheadTime);
          },30);
        }catch(e){console.warn('autofit:',e)}
      });
    }
  }catch(e){
    console.error('VexFlow:',e);
    scoreHost.innerHTML='<span class="empty" style="color:#cc2233">Error</span>';
  }
}

