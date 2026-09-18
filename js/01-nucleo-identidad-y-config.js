
let duracionAudio = 30;
const VOL_BY_BAND = {bass:0.78, mid:0.68, high:0.58};
let clefActual = 'treble';
let lastMaterialLen = 0;
let lastSilencios = 0;
let systemBoxes = [];

let tomaActual = 'fiel';
let tomaVivoCount = 0;

let _atmosCount = 0;
const MAX_ATMOS = 80;
const ATMOS_INSTS = ['drone','air','void','rain','choir','cavern','glass','wind'];
let _renderingOffline = false;
let _noiseBuf = null;
function getNoiseBuf(ctx){
  if(!_noiseBuf || _noiseBuf.sampleRate !== ctx.sampleRate){
    const len = Math.floor(ctx.sampleRate * 3);
    _noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = _noiseBuf.getChannelData(0);
    for(let i=0;i<len;i++) d[i] = Math.random()*2 - 1;
  }
  return _noiseBuf;
}

function drawIsoOnCanvas(ctx, cx, cy, size){
  const scale = size / 20;
  const r = size / 2;
  ctx.save();
  ctx.fillStyle = '#cc2233';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI*2);
  ctx.fill();
  ctx.fillStyle = '#e8e9e8';
  const dots = [
    [20,14.4],[20,17.2],[20,20],[20,22.8],[20,25.6],
    [17,17.2],[17,20],[17,22.8],
    [23,17.2],[23,20],[23,22.8],
    [14.5,20],[25.5,20]
  ];
  const dotR = Math.max(0.6, 0.7*scale);
  for(const [sx,sy] of dots){
    const px = cx + (sx-20)*scale;
    const py = cy + (sy-20)*scale;
    ctx.beginPath();
    ctx.arc(px, py, dotR, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.fillStyle = '#cc2233';
  const redDots = [[5,20],[7.5,20],[32.5,20],[35,20]];
  for(const [sx,sy] of redDots){
    const px = cx + (sx-20)*scale;
    const py = cy + (sy-20)*scale;
    ctx.beginPath();
    ctx.arc(px, py, dotR, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

function drawIsoOnPDF(doc, x, y, size){
  const scale = size / 20;
  const r = size / 2;
  doc.setFillColor(204,34,51);
  doc.circle(x, y, r, 'F');
  doc.setFillColor(232,233,232);
  const dotR = Math.max(0.15, 0.7*scale);
  const dots = [
    [20,14.4],[20,17.2],[20,20],[20,22.8],[20,25.6],
    [17,17.2],[17,20],[17,22.8],
    [23,17.2],[23,20],[23,22.8],
    [14.5,20],[25.5,20]
  ];
  for(const [sx,sy] of dots){
    doc.circle(x + (sx-20)*scale, y + (sy-20)*scale, dotR, 'F');
  }
  doc.setFillColor(204,34,51);
  const redDots = [[5,20],[7.5,20],[32.5,20],[35,20]];
  for(const [sx,sy] of redDots){
    doc.circle(x + (sx-20)*scale, y + (sy-20)*scale, dotR, 'F');
  }
}

function isoHTML(sizePx, extraStyle){
  return `<svg class="iso" viewBox="0 0 40 40" style="width:${sizePx}px;height:${sizePx}px;flex-shrink:0;${extraStyle||''}"><use href="#iso-02"/></svg>`;
}

function pintarPatronPuntos(ctx, W, H, opacidad, spacing, radio){
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${opacidad})`;
  for(let x = 4; x < W; x += spacing){
    for(let y = 4; y < H; y += spacing){
      const offset = ((Math.floor(y / spacing)) % 2 === 0) ? 0 : spacing / 2;
      ctx.beginPath();
      ctx.arc(x + offset, y, radio, 0, Math.PI*2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function pintarPatronPuntosPDF(doc, x0, y0, w, h, opacidad, spacing, radio, colorRGB){
  try{
    const gs = doc.GState({opacity: opacidad});
    doc.setGState(gs);
    doc.setFillColor(...colorRGB);
    for(let yy = y0; yy < y0 + h; yy += spacing){
      const offset = (Math.floor((yy - y0) / spacing) % 2 === 0) ? 0 : spacing / 2;
      for(let xx = x0 + offset; xx < x0 + w; xx += spacing){
        doc.circle(xx, yy, radio, 'F');
      }
    }
    doc.setGState(doc.GState({opacity: 1}));
  }catch(e){  }
}

const ESCALAS = {
  minor: { name:'Pentatónica', intervals:[0,3,5,7,10], root:57 },
  blues: { name:'Blues', intervals:[0,3,5,6,7,10], root:57 },
  chromatic: { name:'Cromática', intervals:[0,1,2,3,4,5,6,7,8,9,10,11], root:57 },
  major: { name:'Mayor', intervals:[0,2,4,7,9], root:57 }
};
const NOMBRES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const UMBRALES = { armonico: 0.5, hibrido: 1.0, permisivo: 2.0 };

