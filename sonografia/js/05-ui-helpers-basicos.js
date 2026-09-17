
function getCtx(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx}
function setStatus(msg,err){const dot=statusEl.querySelector('.dot');const txt=statusEl.querySelector('span:last-child');if(txt)txt.textContent=msg;if(dot)dot.className='dot'+(msg.includes('...')?' active':'')}
function setEnabled(ok){
  [play,stop,reBent,expMidi,expCsv,expPdf,expPng,expWav].forEach(b=>b.disabled=!ok);
  if(reBent) reBent.disabled=!ok || rebentSeed>=REBENT_MAX;
}
function setProgress(p){if(p===null){progressWrap.style.display='none';return}progressWrap.style.display='block';progressBar.style.width=(p*100).toFixed(1)+'%'}
function setDurBadge(){const t=duracionAudio+'s';if(durBadge)durBadge.textContent=t;if(durBadge2)durBadge2.textContent=t;}
function setSeedBadge(){
  if(seedBadge){
    const integridad=Math.round(getIntensidadProgresiva()*100);
    seedBadge.textContent=`seed ${rebentSeed}/${REBENT_MAX} · ${integridad}%`;
    seedBadge.title=`Semilla del glitch: ${rebentSeed}/${REBENT_MAX} · integridad ${integridad}%`;
  }
}

try{
  const saved = parseInt(localStorage.getItem('sono-toma-vivo-count') || '0', 10);
  if(isFinite(saved) && saved > 0) tomaVivoCount = saved;
}catch(e){}

