
function procesarEventos(){
  const bands={bass:chBass.checked,mid:chMid.checked,high:chHigh.checked};
  eventosFiltrados=eventos.filter(e=>bands[e.band]);
  slots={};
  for(const e of eventosFiltrados){if(!slots[e.step])slots[e.step]=[];slots[e.step].push(e)}
  eventosSecuencia = buildEventosSecuencia();
  notasShownCount = 200;
  statEventos.innerHTML = `<span class="ico-inline">⌜</span>${eventosFiltrados.length} RAW`;
  statSecuencia.innerHTML = `<span class="ico-inline">♪</span>${eventosSecuencia.length} notas secuencia`;
  statSlots.innerHTML = `<span class="ico-inline">▦</span>${Object.keys(slots).length} slots`;
  statBass.textContent=`B: ${eventosSecuencia.filter(e=>e.band==='bass').length}`;
  statMid.textContent=`M: ${eventosSecuencia.filter(e=>e.band==='mid').length}`;
  statHigh.textContent=`A: ${eventosSecuencia.filter(e=>e.band==='high').length}`;
  const maxT=eventosSecuencia.length?Math.max(...eventosSecuencia.map(e=>e.time)):0;
  statDuracion.innerHTML = `<span class="ico-inline">◷</span>${maxT.toFixed(1)}s`;
  eventosHint.textContent = `· ${eventosSecuencia.length} notas en secuencia`;
  dibujarEventos(playheadTime);actualizarNotas();renderPartitura();
  preRenderHibrido();
}

function dibujarEventos(currentTime){
  const ctx=cEvents.getContext('2d');
  const W=cEvents.width,H=cEvents.height;
  ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
  if(!eventosSecuencia.length){ctx.fillStyle='#333';ctx.font='10px monospace';ctx.fillText('sin eventos',10,H/2);return}
  const maxTime=duracionAudio;
  const fMin=Math.log(40),fMax=Math.log(8000);
  ctx.strokeStyle='#14141e';ctx.lineWidth=1;
  const octavas=[50,100,200,400,800,1600,3200,6400];
  for(const f of octavas){
    const y=H-((Math.log(f)-fMin)/(fMax-fMin))*H;
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
    ctx.fillStyle='#2a2a3f';ctx.font='8px monospace';ctx.fillText(f+'Hz',3,y-1);
  }
  for(let t=0;t<=maxTime;t+=5){
    const x=(t/maxTime)*W;
    ctx.strokeStyle='#14141e';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();
    ctx.fillStyle='#2a2a3f';ctx.fillText(t+'s',x+2,9);
  }
  const colors={bass:'#cc2233',mid:'#3a60ff',high:'#20d4a0'};
  for(const e of eventosSecuencia){
    const x=(e.time/maxTime)*W;
    const y=H-((Math.log(Math.max(40,e.freq))-fMin)/(fMax-fMin))*H;
    const a=e.ampNorm!==undefined?e.ampNorm:Math.min(1,(e.amp||0)/255);
    const r=1+a*3.5;
    ctx.fillStyle=colors[e.band];ctx.globalAlpha=0.35+0.65*a;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  if(currentTime>0&&currentTime<maxTime){
    const xNow=(currentTime/maxTime)*W;
    ctx.strokeStyle='#ffffff';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(xNow,0);ctx.lineTo(xNow,H);ctx.stroke();
    ctx.fillStyle='#ffffff';
    ctx.beginPath();ctx.moveTo(xNow-5,H);ctx.lineTo(xNow+5,H);ctx.lineTo(xNow,H-9);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(xNow-5,0);ctx.lineTo(xNow+5,0);ctx.lineTo(xNow,9);ctx.closePath();ctx.fill();
  }
  ctx.font='8px monospace';
  ctx.fillStyle='#cc2233';ctx.fillText('● BAJO',W-180,9);
  ctx.fillStyle='#3a60ff';ctx.fillText('● MEDIO',W-125,9);
  ctx.fillStyle='#20d4a0';ctx.fillText('● AGUDO',W-70,9);
}

