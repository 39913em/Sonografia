
function dibujarWave(c){
  const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  if(!audioBuffer)return;
  const data=audioBuffer.getChannelData(0);
  ctx.strokeStyle='#cc2233';ctx.lineWidth=1.3;ctx.beginPath();
  const step=Math.floor(data.length/c.width);
  for(let x=0;x<c.width;x++){const y=(data[x*step]*0.5+0.5)*c.height;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y)}
  ctx.stroke();
}
function dibujarSpec(c,spec){
  const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  if(!spec)return;
  const max=Math.max(...spec,1e-9);
  ctx.fillStyle='#1a3a8a';
  for(let x=0;x<c.width;x++){
    const idx=Math.floor(x/c.width*spec.length);
    const h=(spec[idx]/max)*c.height;
    ctx.fillRect(x,c.height-h,1.5,h);
  }
  ctx.fillStyle='#cc2233';
  for(let x=0;x<c.width;x+=6){
    const idx=Math.floor(x/c.width*spec.length);
    const h=(spec[idx]/max)*c.height;
    if(h>c.height*0.65)ctx.fillRect(x,c.height-h,2,2);
  }
}
function dibujarBent(audioBuf, bmpBytes){
  const ctx=cBent.getContext('2d');
  const data=audioBuf.getChannelData(0);
  const body = bmpBytes.slice(54);
  const ROW=768;
  const img=ctx.createImageData(256,256);
  for(let i=0;i<256*256;i++){
    const s=data[i%data.length],v=Math.floor((s*0.5+0.5)*255);
    const row = Math.floor(i/256);
    const col = i%256;
    const srcRow = 255 - row;
    const off = srcRow*ROW + col*3;
    const b = body[off]||0, g = body[off+1]||0, r = body[off+2]||0;
    img.data[i*4]   = (r + v*0.4) % 256;
    img.data[i*4+1] = (g ^ v) & 0xFF;
    img.data[i*4+2] = v;
    img.data[i*4+3] = 255;
  }
  ctx.putImageData(img,0,0);
  lastBentData={data:new Uint8ClampedArray(img.data)};
}

