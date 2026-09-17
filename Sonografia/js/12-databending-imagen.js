function crearBMP(data){
  const w=256,h=256,rowSize=Math.floor((24*w+31)/32)*4,size=54+rowSize*h;
  const b=new Uint8Array(size);
  b[0]=0x42;b[1]=0x4D;b[2]=size&255;b[3]=(size>>8)&255;b[4]=(size>>16)&255;b[5]=(size>>24)&255;
  b[10]=54;b[14]=40;b[18]=w&255;b[19]=(w>>8)&255;b[22]=h&255;b[23]=(h>>8)&255;b[26]=1;b[28]=24;
  let off=54;
  for(let y=h-1;y>=0;y--){
    for(let x=0;x<w;x++){const i=(y*w+x)*4;b[off++]=data.data[i+2];b[off++]=data.data[i+1];b[off++]=data.data[i]}
    for(let p=0;p<rowSize-w*3;p++)b[off++]=0;
  }
  return b;
}

function aplicarTextura(bytes, modo, seed){
  let body = bytes.slice(54);
  const L = body.length;
  const ROW = 768, H = 256, W = 256, BPP = 3;

  function makeRnd(s){
    let x = ((s + 1) * 0x9E3779B1) >>> 0 || 1;
    return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1000000) / 1000000; };
  }

  // ================================================================
  // BASE DEL ARCHIVO SIN NOMBRE (INTACTA)
  // ================================================================
  if(modo === 'original' || modo === 'crudo'){
  }

  else if(modo === 'echo'){
    const out = new Uint8Array(L);
    const offset = 1800 + (seed * 173) % 600;
    for(let i = 0; i < L; i++) out[i] = (body[i] + (body[i - offset] || 0) * 0.5) % 256;
    body = out;
  }

  else if(modo === 'picasso' || modo === 'fragmentacion'){
    const BLK = 32;
    const NBX = W / BLK, NBY = H / BLK, TOTAL = NBX * NBY;
    const BLKROW = BLK * BPP;
    const rnd = makeRnd(seed);
    const order = [];
    for(let i = 0; i < TOTAL; i++) order.push(i);
    for(let i = TOTAL - 1; i > 0; i--){
      const j = Math.floor(rnd() * (i + 1));
      const t = order[i]; order[i] = order[j]; order[j] = t;
    }
    const keepFrac = Math.max(0, 0.30 - seed * 0.05);
    for(let i = 0; i < TOTAL; i++) if(rnd() < keepFrac) order[i] = i;
    const out = new Uint8Array(body);
    for(let dst = 0; dst < TOTAL; dst++){
      const src = order[dst];
      if(src === dst) continue;
      const dx = (dst % NBX) * BLK, dy = Math.floor(dst / NBX) * BLK;
      const sx = (src % NBX) * BLK, sy = Math.floor(src / NBX) * BLK;
      for(let y = 0; y < BLK; y++){
        const dstBase = (dy + y) * ROW + dx * BPP;
        const srcBase = (sy + y) * ROW + sx * BPP;
        for(let b = 0; b < BLKROW; b++) out[dstBase + b] = body[srcBase + b];
      }
    }
    for(let i = 0; i < TOTAL; i++){
      const key = ((i * 73 + seed * 41) ^ (i << 3)) & 0xFF;
      if(key === 0) continue;
      const dx = (i % NBX) * BLK, dy = Math.floor(i / NBX) * BLK;
      for(let y = 0; y < BLK; y++){
        const base = (dy + y) * ROW + dx * BPP;
        for(let b = 0; b < BLKROW; b++) out[base + b] ^= key;
      }
    }
    if(seed > 0){
      const numRot = Math.min(TOTAL, Math.floor(seed * 1.5));
      const tmp = new Uint8Array(BLKROW * BLK);
      for(let k = 0; k < numRot; k++){
        const idx = Math.floor(rnd() * TOTAL);
        const rot = 1 + Math.floor(rnd() * 3);
        const bx = (idx % NBX) * BLK, by = Math.floor(idx / NBX) * BLK;
        for(let y = 0; y < BLK; y++){
          const base = (by + y) * ROW + bx * BPP;
          for(let b = 0; b < BLKROW; b++) tmp[y * BLKROW + b] = out[base + b];
        }
        for(let y = 0; y < BLK; y++){
          for(let x = 0; x < BLK; x++){
            let srcX, srcY;
            if(rot === 1){ srcX = y; srcY = BLK - 1 - x; }
            else if(rot === 2){ srcX = BLK - 1 - x; srcY = BLK - 1 - y; }
            else { srcX = BLK - 1 - y; srcY = x; }
            const srcP = (srcY * BLK + srcX) * BPP;
            const dstBase = (by + y) * ROW + (bx + x) * BPP;
            out[dstBase] = tmp[srcP];
            out[dstBase + 1] = tmp[srcP + 1];
            out[dstBase + 2] = tmp[srcP + 2];
          }
        }
      }
    }
    body = out;
  }

  else if(modo === 'slice'){
    const rnd = makeRnd(seed + 7919);
    const bands = [];
    let yAcc = 0;
    while(yAcc < H){
      const h = Math.max(4, Math.floor(6 + rnd() * (18 + seed * 3)));
      const realH = Math.min(h, H - yAcc);
      bands.push({y: yAcc, h: realH});
      yAcc += realH;
    }
    const N = bands.length;
    const order = [];
    for(let i = 0; i < N; i++) order.push(i);
    for(let i = N - 1; i > 0; i--){
      const j = Math.floor(rnd() * (i + 1));
      const t = order[i]; order[i] = order[j]; order[j] = t;
    }
    const keepFrac = Math.max(0, 0.20 - seed * 0.04);
    for(let i = 0; i < N; i++) if(rnd() < keepFrac) order[i] = i;
    const out = new Uint8Array(body);
    let dstY = 0;
    for(let i = 0; i < N; i++){
      const src = order[i];
      const srcY = bands[src].y;
      const srcH = bands[src].h;
      const realH = Math.min(srcH, H - dstY);
      if(realH <= 0) break;
      const shear = Math.floor((rnd() - 0.5) * (140 + seed * 50));
      const xorKey = (i * 91 + seed * 17) & 0xFF;
      for(let row = 0; row < realH; row++){
        const srcBase = (srcY + row) * ROW;
        const dstBase = (dstY + row) * ROW;
        for(let b = 0; b < ROW; b++){
          const s = (((b + shear) % ROW) + ROW) % ROW;
          out[dstBase + b] = (body[srcBase + s] ^ xorKey) & 0xFF;
        }
      }
      dstY += realH;
    }
    while(dstY < H){
      const srcBase = (H - 1) * ROW;
      const dstBase = dstY * ROW;
      for(let b = 0; b < ROW; b++) out[dstBase + b] = body[srcBase + b];
      dstY++;
    }
    body = out;
  }

  // ================================================================
  // MODOS AÑADIDOS DESDE "CODIGO actualizacion 1"
  // ================================================================

  else if(modo === 'anaglifo'){
    const out = new Uint8Array(L);
    const shift = 3 + Math.min(6, Math.floor(seed * 1.2));
    for(let y = 0; y < H; y++){
      const rowBase = y * ROW;
      for(let x = 0; x < W; x++){
        const dstBase = rowBase + x * BPP;

        const gbX = Math.max(0, x - shift);
        const gbBase = rowBase + gbX * BPP;
        out[dstBase]     = body[gbBase];       // B
        out[dstBase + 1] = body[gbBase + 1];   // G

        const rX = Math.min(W - 1, x + shift);
        const rBase = rowBase + rX * BPP;
        out[dstBase + 2] = body[rBase + 2];    // R
      }
    }
    body = out;
  }

  else if(modo === 'cuatricromia'){
    const out = new Uint8Array(L);
    const dotSize = 3;
    const cInk = [10, 165, 235];
    const mInk = [230, 30, 140];
    const yInk = [250, 225, 20];
    const kInk = [20, 20, 20];

    for(let y = 0; y < H; y++){
      for(let x = 0; x < W; x++){
        const srcBase = y * ROW + x * BPP;
        const rf = body[srcBase + 2] / 255;
        const gf = body[srcBase + 1] / 255;
        const bf = body[srcBase]     / 255;

        const k  = 1 - Math.max(rf, gf, bf);
        const inv = 1 - k;
        const c  = inv > 0 ? (1 - rf - k) / inv : 0;
        const m  = inv > 0 ? (1 - gf - k) / inv : 0;
        const yl = inv > 0 ? (1 - bf - k) / inv : 0;

        const px = x % dotSize, py = y % dotSize;
        const cT = (px + py) / (2 * dotSize);
        const mT = ((dotSize - 1 - px) + py) / (2 * dotSize);
        const yT = (px + (dotSize - 1 - py)) / (2 * dotSize);
        const kT = (Math.abs(px - 1) + Math.abs(py - 1)) / (2 * dotSize);

        let rr = 255, gg = 255, bb = 255;
        if(c  > cT){ rr = rr * cInk[0] / 255; gg = gg * cInk[1] / 255; bb = bb * cInk[2] / 255; }
        if(m  > mT){ rr = rr * mInk[0] / 255; gg = gg * mInk[1] / 255; bb = bb * mInk[2] / 255; }
        if(yl > yT){ rr = rr * yInk[0] / 255; gg = gg * yInk[1] / 255; bb = bb * yInk[2] / 255; }
        if(k  > kT){ rr = rr * kInk[0] / 255; gg = gg * kInk[1] / 255; bb = bb * kInk[2] / 255; }

        out[srcBase]     = bb;
        out[srcBase + 1] = gg;
        out[srcBase + 2] = rr;
      }
    }
    body = out;
  }

  else if(modo === 'aberracion'){
    const out = new Uint8Array(L);
    const shift = 2 + Math.min(5, Math.floor(seed * 0.8));
    for(let y = 0; y < H; y++){
      const rowBase = y * ROW;
      for(let x = 0; x < W; x++){
        const dstBase = rowBase + x * BPP;

        const bX = Math.max(0, x - shift);
        out[dstBase] = body[rowBase + bX * BPP];

        out[dstBase + 1] = body[rowBase + x * BPP + 1];

        const rX = Math.min(W - 1, x + shift);
        out[dstBase + 2] = body[rowBase + rX * BPP + 2];
      }
    }
    body = out;
  }

  else if(modo === 'datamoshing'){
    const out = new Uint8Array(body);
    const rnd = makeRnd(seed + 313);
    const numBlocks = 4 + Math.min(10, Math.floor(seed * 1.5));

    for(let i = 0; i < numBlocks; i++){
      const horizontal = rnd() > 0.4;

      if(horizontal){
        const bh    = Math.max(4, Math.floor(6 + rnd() * 20));
        const y0    = Math.floor(rnd() * (H - bh));
        const shift = Math.floor((rnd() - 0.5) * 60);
        for(let y = y0; y < y0 + bh; y++){
          const rowBase = y * ROW;
          for(let x = 0; x < W; x++){
            const sx = ((x - shift) % W + W) % W;
            const srcBase = rowBase + sx * BPP;
            const dstBase = rowBase + x  * BPP;
            out[dstBase]     = body[srcBase];
            out[dstBase + 1] = body[srcBase + 1];
            out[dstBase + 2] = body[srcBase + 2];
          }
        }
      } else {
        const bw    = Math.max(4, Math.floor(6 + rnd() * 20));
        const x0    = Math.floor(rnd() * (W - bw));
        const shift = Math.floor((rnd() - 0.5) * 60);
        for(let y = 0; y < H; y++){
          const sy = ((y - shift) % H + H) % H;
          const srcBase = sy * ROW + x0 * BPP;
          const dstBase = y  * ROW + x0 * BPP;
          for(let b = 0; b < bw * BPP; b++) out[dstBase + b] = body[srcBase + b];
        }
      }
    }
    body = out;
  }

  else if(modo === 'scanlines'){
    const out = new Uint8Array(body);
    const rnd = makeRnd(seed + 911);
    const noiseIntensity = 0.02 + Math.min(0.06, seed * 0.008);
    const lineAlpha      = 0.15 + Math.min(0.20, seed * 0.02);

    for(let i = 0; i < L; i++){
      if(rnd() < noiseIntensity){
        const delta = Math.floor((rnd() - 0.5) * 60);
        out[i] = Math.max(0, Math.min(255, out[i] + delta));
      }
    }

    for(let y = 0; y < H; y += 3){
      const rowBase = y * ROW;
      for(let b = 0; b < ROW; b++){
        out[rowBase + b] = Math.max(0, out[rowBase + b] * (1 - lineAlpha)) | 0;
      }
    }
    body = out;
  }

  else if(modo === 'corrupcion'){
    const out = new Uint8Array(body);
    const rnd = makeRnd(seed + 577);
    const intensity = 0.003 + Math.min(0.015, seed * 0.002);
    const numCorruptions = Math.floor(L * intensity);

    for(let i = 0; i < numCorruptions; i++){
      const idx = Math.floor(rnd() * L);
      out[idx] = Math.floor(rnd() * 256);
    }

    const numBlocks = 2 + Math.floor(seed * 2);
    for(let k = 0; k < numBlocks; k++){
      const a   = Math.floor(rnd() * L);
      const b   = Math.floor(rnd() * L);
      const len = Math.min(L - a, L - b, 20 + Math.floor(rnd() * 100));
      for(let j = 0; j < len; j++) out[a + j] = body[b + j];
    }
    body = out;
  }

  // ================================================================
  // REBENT HÍBRIDO (CAPA GLOBAL PROGRESIVA) — del archivo sin nombre
  // 0 = comportamiento limpio de la versión actual.
  // 1..4 = reincorporación progresiva de la capa global de v1.
  // 5 = 100% de esa capa global, recuperando sus parámetros máximos.
  // ================================================================
  if(seed > 0){
    const intensidad = Math.max(0, Math.min(1, seed / 5));
    let x = ((seed + 1) * 0x9E3779B1) >>> 0;
    const rnd = () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return ((x >>> 0) % 1000000) / 1000000; };

    const blocks = Math.round(2 + (420 - 2) * intensidad);
    const maxLen = Math.round(24 + (900 - 24) * intensidad);

    for(let k = 0; k < blocks; k++){
      const a   = Math.floor(rnd() * L);
      const len = Math.min(L - a, 6 + Math.floor(rnd() * maxLen));
      const op  = Math.floor(rnd() * 4);

      if(op === 0){
        const b = Math.floor(rnd() * L);
        for(let j = 0; j < len && b + j < L; j++) body[a + j] = body[b + j];
      } else if(op === 1){
        const shMax = Math.max(1, Math.min(len, Math.round(24 + 40 * intensidad)));
        const sh = 1 + Math.floor(rnd() * shMax);
        for(let j = len - 1; j >= sh; j--) body[a + j] = body[a + j - sh];
      } else if(op === 2){
        for(let j = 0; j < len; j++) body[a + j] ^= (1 << Math.floor(rnd() * 8));
      } else {
        for(let j = 0; j < len; j++) body[a + j] ^= ((j + seed) & 0x0F);
      }
    }

    const shift = (seed * 137) % L;
    if(shift > 0){
      const shifted = new Uint8Array(L);
      for(let i = 0; i < L; i++) shifted[i] = body[(i + shift) % L];
      body = shifted;
    }
  }

  const outFinal = new Uint8Array(bytes.length);
  outFinal.set(bytes.slice(0, 54), 0);
  outFinal.set(body, 54);
  return outFinal;
}
