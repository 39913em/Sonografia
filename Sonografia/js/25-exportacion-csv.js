

expCsv.onclick=()=>{
  if(!eventos.length){setStatus('Sin eventos',true);return}
  try{
    const r = getRango();
    let csv='time,step,freq_hz,amplitude,band\n';
    let n=0;
    for(const e of eventos){
      if(e.time < r.a || e.time > r.b) continue;
      csv+=`${e.time.toFixed(4)},${e.step},${e.freq.toFixed(2)},${e.amp},${e.band}\n`;
      n++;
    }
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const ficha = generarFichaASCII(n, r);
    const previewTexto = ficha + csv;
    const pre=document.createElement('pre');
    pre.className='export-text';
    pre.textContent = previewTexto;
    abrirPreviewExport('csv','PREVISUALIZACIÓN · CSV · DATA',
      `${n} eventos RAW · ${leyendaEstado(' · ')}`,
      pre,blob,nombreArchivo('csv')+'.csv');
  }catch(e){console.error(e);setStatus('Error CSV: '+e.message,true)}
};

