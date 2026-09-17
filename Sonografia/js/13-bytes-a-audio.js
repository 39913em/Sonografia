

function bytesToAudio(bytes, ctx, seg){
  const body = bytes.slice(54);
  const bodyLen = body.length;
  const len = Math.floor(ctx.sampleRate * seg);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  let cursor = 0;
  let cycleIdx = 0;
  const FADE = 64;
  while(cursor < len){
    const cycleOffset = (cycleIdx * 7919) % bodyLen;
    const cycleLen = Math.max(1, Math.floor(bodyLen * (1 + Math.sin(cycleIdx * 0.7) * 0.02)));
    const ampDrift = cycleIdx === 0 ? 1 : (1 + Math.sin(cycleIdx * 1.3) * 0.08);
    for(let i = 0; i < cycleLen && cursor < len; i++){
      const srcIdx = (cycleOffset + i) % bodyLen;
      const b = body[srcIdx];
      let env = 1;
      if(i < FADE) env = i / FADE;
      else if(i > cycleLen - FADE) env = Math.max(0, (cycleLen - i) / FADE);
      ch[cursor++] = (b - 128) / 128 * 0.85 * ampDrift * env;
    }
    cycleIdx++;
  }
  return buf;
}

