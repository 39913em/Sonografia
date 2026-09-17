
function abrirModal(){
  if(!lastBentData)return;
  const ctx=cBentBig.getContext('2d');
  const bigSize=512;
  const imgData=ctx.createImageData(bigSize,bigSize);
  const origData=lastBentData.data;
  const srcSize=256;
  for(let y=0;y<bigSize;y++){
    for(let x=0;x<bigSize;x++){
      const sx=Math.floor(x/2),sy=Math.floor(y/2);
      const sIdx=(sy*srcSize+sx)*4;
      const dIdx=(y*bigSize+x)*4;
      imgData.data[dIdx]=origData[sIdx];
      imgData.data[dIdx+1]=origData[sIdx+1];
      imgData.data[dIdx+2]=origData[sIdx+2];
      imgData.data[dIdx+3]=255;
    }
  }
  ctx.putImageData(imgData,0,0);
  modalTitle.textContent=`BENT · ${textura.value.toUpperCase()} · ${clefActual==='bass'?'FA':'SOL'}`;
  modalInfo.textContent=`512×512 (2×) · seed ${rebentSeed}`;
  modalBent.classList.add('on');
}
function cerrarModal(){modalBent.classList.remove('on');}
bentClickable.addEventListener('click',abrirModal);
modalClose.addEventListener('click',cerrarModal);
modalBent.addEventListener('click',(e)=>{if(e.target===modalBent)cerrarModal()});
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&modalBent.classList.contains('on'))cerrarModal()});

