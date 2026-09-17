/* ═══════════════════════════════════════════════════════════════
   SONOGRAFÍA · 39913 · ERRORES VISIONOROS
   Módulo: 27-exportacion-pdf.js
   ───────────────────────────────────────────────────────────────
EXPORTACIÓN PDF: rasterizado de fragmentos de la partitura SVG a PNG
y construcción completa del PDF (ficha técnica + partitura paginada).
   ───────────────────────────────────────────────────────────────
   Extraído tal cual del archivo original, sin alterar una sola línea
   de código. El orden de carga de los módulos en index.html reproduce
   exactamente el orden del script original.
   ═══════════════════════════════════════════════════════════════ */

function scoreSliceToPngDataURL(svgEl, vx, vy, vw, cropH, scale=4){
  return new Promise((resolve,reject)=>{
    try{
      const clone=svgEl.cloneNode(true);
      const gClone = clone.querySelector('#playhead-group');
      if(gClone) gClone.parentNode.removeChild(gClone);
      clone.removeAttribute('width');
      clone.removeAttribute('height');
      clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
      clone.setAttribute('viewBox',`${vx} ${vy} ${vw} ${cropH}`);
      clone.setAttribute('width', vw);
      clone.setAttribute('height', cropH);
      const svgData=new XMLSerializer().serializeToString(clone);
      const url=URL.createObjectURL(new Blob([svgData],{type:'image/svg+xml;charset=utf-8'}));
      const img=new Image();
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        canvas.width=Math.ceil(vw*scale);
        canvas.height=Math.ceil(cropH*scale);
        const c=canvas.getContext('2d');
        c.fillStyle='#fff';c.fillRect(0,0,canvas.width,canvas.height);
        c.drawImage(img,0,0,canvas.width,canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('No se pudo leer el SVG'))};
      img.src=url;
    }catch(e){reject(e)}
  });
}

async function crearPDFBlob(){
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({unit:'mm',format:'a4'});
  const W=210,H=297;
  const ROJO=[204,34,51],AZUL=[26,58,138],NEGRO=[10,10,15],BLANCO=[232,230,240],GRIS=[154,154,168];
  const r = getRango();

  // página 1 · fondo oscuro
  doc.setFillColor(...NEGRO);doc.rect(0,0,W,H,'F');

  // cabecera roja
  doc.setFillColor(...ROJO);doc.rect(0,0,W,24,'F');

  // patrón de puntos blancos sobre la cabecera roja · muy tenue
  pintarPatronPuntosPDF(doc, 0, 0, W, 24, 0.18, 4, 0.25, [255,255,255]);

  drawIsoOnPDF(doc, 14, 12, 8);

  doc.setTextColor(...NEGRO);doc.setFont('courier','bold');doc.setFontSize(18);
  doc.text('SONOGRAFÍA', 22, 12);
  doc.setFontSize(8);doc.setFont('courier','normal');
  doc.text('IMAGEN → RUIDO → PARTITURA', 22, 18);
  doc.setFontSize(7);doc.setFont('courier','bold');
  doc.text('PROYECTO ERRORES VISIONOROS · 39913', W-10, 12, {align:'right'});
  doc.setFont('courier','normal');
  doc.text('OBRA SONORA · DATABENDING', W-10, 16, {align:'right'});
  doc.setFont('courier','bold');
  doc.text('"EL ERROR COMO MÉTODO"', W-10, 20, {align:'right'});

  // ficha
  doc.setFillColor(...AZUL);doc.rect(10,30,W-20,20,'F');
  doc.setTextColor(...BLANCO);doc.setFont('courier','bold');doc.setFontSize(9);doc.text('FICHA TÉCNICA',12,36);
  const _ee = etiquetaEstado();
  doc.setFont('courier','normal');doc.setFontSize(7);
  doc.text(`Textura: ${_ee.textura}`,12,42);
  doc.text(`Modo: ${_ee.modo}`,80,42);
  doc.text(`BPM: ${_ee.bpm}`,140,42);
  doc.text(`Dur: ${_ee.dur}s`,12,47);
  doc.text(`Escala: ${_ee.escala}`,55,47);
  doc.text(`Synth: ${_ee.synth}`,100,47);
  doc.text(`Clave: ${_ee.clef}`,155,47);
  doc.text(`Seed: ${_ee.seed}`,12,52);
  doc.text(`Toma: ${_ee.toma === 'vivo' ? 'VIVA' : '1:1 FIEL'}`,100,52);
  if(_ee.partial){
    doc.setTextColor(...ROJO);doc.setFont('courier','bold');doc.setFontSize(7);
    doc.text(`EXPORT: ${_ee.rangeA}s → ${_ee.rangeB}s`,155,52);
  }

  let y=56;
  for(const [label,canvas,h] of [['FORMA DE ONDA',cWave,14],['ESPECTRO',cSpec,14]]){
    doc.setTextColor(...BLANCO);doc.setFont('courier','bold');doc.setFontSize(9);doc.text('▸ '+label,10,y);y+=2;
    try{doc.addImage(canvas.toDataURL('image/png'),'PNG',10,y+2,W-20,h)}catch(e){}
    y+=20;
  }
  const tiempoMapa=playheadTime;
  dibujarEventos(0);
  try{doc.setTextColor(...BLANCO);doc.setFont('courier','bold');doc.setFontSize(9);doc.text('▸ MAPA DE EVENTOS',10,y);y+=2;doc.addImage(cEvents.toDataURL('image/png'),'PNG',10,y+2,W-20,32);y+=38}catch(e){}
  dibujarEventos(tiempoMapa);
  doc.setFont('courier','bold');doc.setFontSize(9);doc.text('▸ EVENTOS DESTACADOS',10,y);y+=2;doc.setFont('courier','normal');doc.setFontSize(6.5);
  const evsEnRango = eventosSecuencia.filter(e=>e.time>=r.a && e.time<=r.b);
  const evs=evsEnRango.slice(0,55);
  for(let i=0;i<evs.length;i++){
    const e=evs[i],yy=y+3+i*3.1;if(yy>H-30)break;
    doc.setTextColor(...ROJO);doc.text(String(i+1).padStart(2,'0'),10,yy);doc.setTextColor(...GRIS);doc.text(`[${e.band[0].toUpperCase()}]`,17,yy);doc.text(`${e.time.toFixed(2)}s`,24,yy);
    doc.setTextColor(...BLANCO);doc.text(`${e.freq.toFixed(1).padStart(7,' ')}Hz`,42,yy);doc.setTextColor(...AZUL);doc.text(`→ ${e.nom||'—'}`,78,yy);
  }

  // pie
  doc.setFillColor(...ROJO);doc.rect(0,H-20,W,20,'F');
  pintarPatronPuntosPDF(doc, 0, H-20, W, 20, 0.18, 4, 0.25, [255,255,255]);
  drawIsoOnPDF(doc, 14, H-10, 7);
  doc.setTextColor(...NEGRO);doc.setFont('courier','bold');doc.setFontSize(8);doc.text('SONOGRAFÍA', 20, H-12);
  doc.setFont('courier','normal');doc.setFontSize(6);doc.text('ERRORES VISIONOROS · By: 39913 · Databending · 2017-2026',20,H-7);
  doc.setFont('courier','bold');doc.setFontSize(7);doc.text(`FECHA: ${fechaCreacion()} · PÁGINA 1`,W-10,H-11,{align:'right'});
  doc.setFont('courier','normal');doc.text('"El error como materialidad"',W-10,H-6,{align:'right'});

  // páginas de partitura
  const svgEl=partituraEl.querySelector('svg');
  if(!svgEl || !systemBoxes.length){
    return doc.output('blob');
  }
  const vbRaw=svgEl.getAttribute('viewBox')||'';
  const parts=vbRaw.split(/[\s,]+/).map(Number);
  let vx=0,vy=0,vw=800,vh=300;
  if(parts.length===4 && parts.every(isFinite)){
    vx=parts[0];vy=parts[1];vw=parts[2];vh=parts[3];
  }
  const marginX=12;
  const availW=W-marginX*2;
  const availH=H-40;
  const scaleX=availW/vw;
  const sysSvgH=systemBoxes[0].h || 112;
  const sysMm=sysSvgH*scaleX;
  let sysPerPage=Math.max(1, Math.floor((availH-14)/(sysMm*1.10)));
  sysPerPage=Math.min(sysPerPage, 10);
  const pages=[];
  for(let i=0;i<systemBoxes.length;i+=sysPerPage){
    pages.push(systemBoxes.slice(i, i+sysPerPage));
  }
  for(let pi=0; pi<pages.length; pi++){
    doc.addPage();
    doc.setFillColor(255,255,255);doc.rect(0,0,W,H,'F');
    doc.setDrawColor(42,42,63);doc.setLineWidth(0.7);doc.rect(7,7,W-14,H-14);
    drawIsoOnPDF(doc, W-14, 15, 6);
    let top;
    if(pi===0){
      doc.setFont('times','bold');doc.setTextColor(...NEGRO);doc.setFontSize(13);
      doc.text(`SONOGRAFÍA · ${ESCALAS[escalaActual].name.toUpperCase()}`,12,16);
      doc.setFont('times','italic');doc.setFontSize(7.5);doc.setTextColor(80,80,80);
      doc.text(leyendaEstado(' · '), 12, 21);
      doc.setFont('times','normal');doc.setFontSize(8);doc.setTextColor(51,51,51);
      doc.text(`${lastSeqLen} notas · ♩ = ${bpmActual} · CLAVE ${clefActual==='bass'?'FA':'SOL'} · ${instrumento.value.toUpperCase()}`,12,25.5);
      doc.setDrawColor(221,221,221);doc.setLineWidth(0.35);doc.line(12,28,W-12,28);
      top=32;
    } else {
      doc.setFont('times','bold');doc.setTextColor(...NEGRO);doc.setFontSize(10);
      doc.text(`SONOGRAFÍA · ${ESCALAS[escalaActual].name.toUpperCase()} · cont.`,12,14);
      doc.setFont('times','normal');doc.setFontSize(7);doc.setTextColor(120,120,120);
      doc.text(`Clave ${clefActual==='bass'?'FA':'SOL'} · ♩ = ${bpmActual} · ${duracionAudio}s · seed ${rebentSeed} · ${instrumento.value.toUpperCase()} · BANDAS ${etiquetaEstado().bands}`,12,18.5);
      doc.setDrawColor(221,221,221);doc.setLineWidth(0.35);doc.line(12,21,W-12,21);
      top=24;
    }
    const grp=pages[pi];
    const yStart=Math.max(vy, grp[0].y - 8);
    const lastSys=grp[grp.length-1];
    const yEnd=Math.min(vy+vh, lastSys.y + lastSys.h + 8);
    const cropH=Math.max(20, yEnd - yStart);
    try{
      const dataURL=await scoreSliceToPngDataURL(svgEl, vx, yStart, vw, cropH, 4);
      const pngImg=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=dataURL});
      const availH2 = H - top - 12;
      const rr=Math.min(availW/pngImg.width, availH2/pngImg.height);
      const fw=pngImg.width*rr, fh=pngImg.height*rr;
      const yPos = top + (availH2 - fh)/2;
      doc.addImage(pngImg,'PNG',(W-fw)/2, yPos, fw, fh);
    }catch(err){
      console.warn('score slice',err);
      doc.setTextColor(200,60,60);doc.setFont('courier','normal');doc.setFontSize(8);
      doc.text('[Error al rasterizar la partitura de esta página]',12,top+6);
    }
    doc.setFont('courier','normal');doc.setFontSize(6.5);doc.setTextColor(...GRIS);
    doc.text(`SONOGRAFÍA · 39913 · Errores Visionoros · PÁGINA ${pi+2}/${pages.length+1}`,W/2,H-6,{align:'center'});
  }
  return doc.output('blob');
}
