
function crearCanvasPNG(){
  if(!lastBentData)throw new Error('Sin imagen bent');
  const PAD=36,HEADER_H=68,IMG_SIZE=640,FOOTER_H=210;
  const W=IMG_SIZE+PAD*2,H=HEADER_H+IMG_SIZE+FOOTER_H;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  ctx.imageSmoothingEnabled=false;
  ctx.fillStyle='#0d0d16';ctx.fillRect(0,0,W,H);
  pintarPatronPuntos(ctx, W, H, 0.018, 10, 0.5);
  ctx.strokeStyle='#cc2233';ctx.lineWidth=4;ctx.strokeRect(2,2,W-4,H-4);
  ctx.fillStyle='#cc2233';ctx.fillRect(4,4,W-8,HEADER_H-4);

  const isoDiam = 42;
  const isoCx = PAD + isoDiam/2;
  const isoCy = 4 + (HEADER_H-4)/2;
  drawIsoOnCanvas(ctx, isoCx, isoCy, isoDiam);

  ctx.fillStyle='#0a0a0f';
  ctx.textBaseline='middle';
  const textoX = PAD + isoDiam + 14;
  ctx.font='bold 20px "IBM Plex Mono",monospace';
  const titulo = `BENT · ${textura.value.toUpperCase()} · SEED ${rebentSeed}`;
  ctx.fillText(titulo, textoX, isoCy - 6);
  ctx.font='bold 11px "IBM Plex Mono",monospace';
  ctx.fillText(`CLAVE ${clefActual==='bass'?'FA':'SOL'} · ${duracionAudio}s · ${bpmActual} BPM`, textoX, isoCy + 12);

  ctx.textAlign='right';
  ctx.font='bold 22px "IBM Plex Mono",monospace';
  ctx.fillText(`${duracionAudio}s`, W-PAD, isoCy);
  ctx.textAlign='left';

  const srcCanvas=document.createElement('canvas');
  srcCanvas.width=256;srcCanvas.height=256;
  srcCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(lastBentData.data),256,256),0,0);
  ctx.drawImage(srcCanvas, PAD, HEADER_H, IMG_SIZE, IMG_SIZE);

  ctx.strokeStyle='#2a2a3f';ctx.lineWidth=1;ctx.beginPath();
  ctx.moveTo(PAD,HEADER_H+IMG_SIZE+16);
  ctx.lineTo(W-PAD,HEADER_H+IMG_SIZE+16);
  ctx.stroke();

  let fy=HEADER_H+IMG_SIZE+46;
  const fIsoDiam = 28;
  const fIsoCx = PAD + fIsoDiam/2;
  const fIsoCy = fy - 6;
  drawIsoOnCanvas(ctx, fIsoCx, fIsoCy, fIsoDiam);

  const fTextoX = PAD + fIsoDiam + 12;
  ctx.fillStyle='#cc2233';ctx.font='bold 15px "IBM Plex Mono",monospace';
  const brand = 'SONOGRAFÍA';
  ctx.fillText(brand, fTextoX, fy);
  const sw=ctx.measureText(brand).width;

  drawIsoOnCanvas(ctx, fTextoX + sw + 12, fy, 12);
  ctx.fillStyle='#9a9aa8';ctx.font='12px "IBM Plex Mono",monospace';
  ctx.fillText('SONOGRAFÍA · ERRORES VISIONOROS · By: 39913', fTextoX + sw + 24, fy);
  fy += 22;

  const _ee = etiquetaEstado();
  ctx.fillStyle='#e8e6f0';ctx.font='12px "IBM Plex Mono",monospace';
  ctx.fillText(`${_ee.textura} · ${_ee.modo} · ${_ee.bpm} BPM · ${_ee.dur}s · CLAVE ${_ee.clef} · TOMA ${_ee.toma === 'vivo' ? 'VIVA' : '1:1'}`, fTextoX, fy);fy+=18;
  ctx.fillStyle='#9a9aa8';ctx.font='11px "IBM Plex Mono",monospace';
  ctx.fillText(`${_ee.escala} · ${_ee.synth} · BANDAS ${_ee.bands} · SEED ${_ee.seed} · ${_ee.notas}N/${_ee.silencios}S${_ee.partial?` · EXPORT ${_ee.rangeA}-${_ee.rangeB}s`:''}`, fTextoX, fy);fy+=18;
  ctx.fillStyle='#6a6a80';ctx.font='10px "IBM Plex Mono",monospace';
  ctx.fillText('SONOGRAFÍA · ERRORES VISIONOROS · By: 39913 · Databending · 2017-2026', fTextoX, fy);

  ctx.textAlign='right';
  ctx.fillStyle='#cc2233';ctx.font='bold 12px "IBM Plex Mono",monospace';
  ctx.fillText(fechaCreacion(), W-PAD, fy);
  ctx.fillStyle='#6a6a80';ctx.font='10px "IBM Plex Mono",monospace';
  ctx.fillText('"El error como materialidad"', W-PAD, fy-18);
  ctx.textAlign='left';

  return canvas;
}

expPng.onclick=()=>{
  try{
    const canvas=crearCanvasPNG();
    canvas.toBlob(blob=>{
      const img=document.createElement('img');img.src=URL.createObjectURL(blob);img.alt='Previsualización PNG';
      abrirPreviewExport('png','PREVISUALIZACIÓN · PNG',
        `Polaroid · ${leyendaEstado(' · ')}`,
        img,blob,nombreArchivo('png')+'.png');
      setStatus('PNG listo');
    },'image/png');
  }catch(e){console.error(e);setStatus('Error PNG: '+e.message,true)}
};

