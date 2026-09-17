
function renderNoteToGain(ctx,dest,freq,time,dur,vol,instrument){
  const gain=ctx.createGain();gain.connect(dest);
  const v=Math.max(0.001,vol);vol=v;
  const oscs=[];const i=instrument;
  if(!_renderingOffline && ATMOS_INSTS.includes(i)){
    if(_atmosCount >= MAX_ATMOS) return {osc:[], gain};
    _atmosCount++;
    const life = Math.max(dur * 1.5, 0.6) * 1000 + 500;
    setTimeout(()=>{ _atmosCount = Math.max(0, _atmosCount - 1); }, life);
  }
  if(i==='piano'){
    const o1=ctx.createOscillator();o1.type='triangle';o1.frequency.value=freq;
    const o2=ctx.createOscillator();o2.type='sine';o2.frequency.value=freq*2;
    const g2=ctx.createGain();g2.gain.value=0.3;
    const o3=ctx.createOscillator();o3.type='sine';o3.frequency.value=freq*3;
    const g3=ctx.createGain();g3.gain.value=0.1;
    o1.connect(gain);o2.connect(g2);g2.connect(gain);o3.connect(g3);g3.connect(gain);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(vol,time+0.008);
    gain.gain.exponentialRampToValueAtTime(vol*0.3,time+0.15);
    gain.gain.exponentialRampToValueAtTime(0.001,time+dur);
    o1.start(time);o1.stop(time+dur+0.1);o2.start(time);o2.stop(time+dur);o3.start(time);o3.stop(time+dur*0.7);
    oscs.push(o1,o2,o3);
  } else if(i==='pad'){
    const o1=ctx.createOscillator();o1.type='sawtooth';o1.frequency.value=freq;
    const o2=ctx.createOscillator();o2.type='sawtooth';o2.frequency.value=freq*1.005;
    const f=ctx.createBiquadFilter();f.type='lowpass';
    f.frequency.setValueAtTime(400,time);f.frequency.linearRampToValueAtTime(1800,time+dur*0.5);
    f.frequency.linearRampToValueAtTime(600,time+dur);f.Q.value=4;
    o1.connect(f);o2.connect(f);f.connect(gain);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(vol*0.7,time+0.3);
    gain.gain.setValueAtTime(vol*0.7,time+dur*0.6);
    gain.gain.exponentialRampToValueAtTime(0.001,time+dur*1.4);
    o1.start(time);o1.stop(time+dur*1.5);o2.start(time);o2.stop(time+dur*1.5);
    oscs.push(o1,o2);
  } else if(i==='bass'){
    const o1=ctx.createOscillator();o1.type='sine';o1.frequency.value=freq;
    const o2=ctx.createOscillator();o2.type='square';o2.frequency.value=freq;
    const g2=ctx.createGain();g2.gain.value=0.08;
    const lp=ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=400;
    o1.connect(gain);o2.connect(g2);g2.connect(lp);lp.connect(gain);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(vol,time+0.01);
    gain.gain.exponentialRampToValueAtTime(0.001,time+dur);
    o1.start(time);o1.stop(time+dur+0.05);o2.start(time);o2.stop(time+dur+0.05);
    oscs.push(o1,o2);
  } else if(i==='organ'){
    [1,2,3].forEach((h,idx)=>{
      const o=ctx.createOscillator();o.type='sine';o.frequency.value=freq*h;
      const g=ctx.createGain();g.gain.value=[1,0.5,0.25][idx];
      o.connect(g);g.connect(gain);o.start(time);o.stop(time+dur+0.1);oscs.push(o);
    });
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(vol,time+0.02);
    gain.gain.setValueAtTime(vol,time+dur*0.7);gain.gain.exponentialRampToValueAtTime(0.001,time+dur*1.2);
  } else if(i==='chip'){
    const o=ctx.createOscillator();o.type='square';o.frequency.value=freq;
    o.connect(gain);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(vol*0.6,time+0.002);
    gain.gain.setValueAtTime(vol*0.6,time+dur*0.5);gain.gain.linearRampToValueAtTime(0,time+dur*0.6);
    o.start(time);o.stop(time+dur);oscs.push(o);
  } else if(i==='alien'){
    const carrier=ctx.createOscillator();carrier.type='sine';carrier.frequency.value=freq;
    const mod=ctx.createOscillator();mod.type='sine';mod.frequency.value=freq*1.414;
    const modGain=ctx.createGain();modGain.gain.value=freq*2.2;
    mod.connect(modGain);modGain.connect(carrier.frequency);
    const ring=ctx.createOscillator();ring.type='sine';ring.frequency.value=freq*1.618;
    const ringMod=ctx.createGain();ringMod.gain.value=0;
    ring.connect(ringMod.gain);carrier.connect(ringMod);
    const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=freq*2.5;bp.Q.value=14;
    const lfo=ctx.createOscillator();lfo.type='sine';lfo.frequency.value=5.5;
    const lfoG=ctx.createGain();lfoG.gain.value=freq*1.8;
    lfo.connect(lfoG);lfoG.connect(bp.frequency);
    ringMod.connect(bp);bp.connect(gain);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(vol*0.8,time+0.02);
    gain.gain.exponentialRampToValueAtTime(vol*0.5,time+dur*0.4);
    gain.gain.exponentialRampToValueAtTime(0.001,time+dur*1.8);
    const endT=time+dur*2;
    carrier.start(time);carrier.stop(endT);mod.start(time);mod.stop(endT);
    ring.start(time);ring.stop(endT);lfo.start(time);lfo.stop(endT);
    oscs.push(carrier,mod,ring,lfo);
  } else if(i==='data'){
    const o=ctx.createOscillator();o.type='square';o.frequency.value=freq;
    const lfo=ctx.createOscillator();lfo.type='square';lfo.frequency.value=14+Math.random()*12;
    const lfoG=ctx.createGain();lfoG.gain.value=freq*0.04;
    lfo.connect(lfoG);lfoG.connect(o.frequency);
    const shaper=ctx.createWaveShaper();
    const curve=new Float32Array(256);
    for(let k=0;k<256;k++){const x=(k/255)*2-1;curve[k]=Math.round(x*4)/4;}
    shaper.curve=curve;
    const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=freq*1.5;bp.Q.value=9;
    o.connect(shaper);shaper.connect(bp);bp.connect(gain);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(vol*0.7,time+0.001);
    gain.gain.setValueAtTime(vol*0.7,time+dur*0.35);
    gain.gain.linearRampToValueAtTime(vol*0.5,time+dur*0.5);
    gain.gain.linearRampToValueAtTime(0,time+dur*0.85);
    o.start(time);o.stop(time+dur*0.9);lfo.start(time);lfo.stop(time+dur*0.9);
    oscs.push(o,lfo);
  } else if(i==='drone'){
    const actualDur = Math.max(dur * 1.2, 0.45);
    const lp = ctx.createBiquadFilter();
    lp.type='lowpass'; lp.frequency.value=freq*3.5; lp.Q.value=1.5;
    const lfo = ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.13;
    const lfoG = ctx.createGain(); lfoG.gain.value=freq*1.6;
    lfo.connect(lfoG); lfoG.connect(lp.frequency);
    const ratios=[1, 1.005, 0.997, 1.011];
    const types=['sine','triangle','sine','triangle'];
    for(let k=0;k<4;k++){
      const o=ctx.createOscillator();
      o.type=types[k]; o.frequency.value=freq*ratios[k];
      o.connect(lp);
      o.start(time); o.stop(time+actualDur+0.6);
      oscs.push(o);
    }
    lp.connect(gain);
    gain.gain.setValueAtTime(0,time);
    gain.gain.linearRampToValueAtTime(vol*0.45, time+actualDur*0.35);
    gain.gain.setValueAtTime(vol*0.45, time+actualDur*0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time+actualDur+0.55);
    lfo.start(time); lfo.stop(time+actualDur+0.6);
    oscs.push(lfo);
  } else if(i==='air'){
    const actualDur = Math.max(dur * 1.2, 0.4);
    const o1=ctx.createOscillator(); o1.type='sine'; o1.frequency.value=freq*2;
    const noise=ctx.createBufferSource();
    noise.buffer = getNoiseBuf(ctx); noise.loop = true;
    const bp=ctx.createBiquadFilter();
    bp.type='bandpass'; bp.frequency.value=freq*3; bp.Q.value=6;
    const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.35+Math.random()*0.3;
    const lg=ctx.createGain(); lg.gain.value=freq*1.3;
    lfo.connect(lg); lg.connect(bp.frequency);
    o1.connect(bp); noise.connect(bp); bp.connect(gain);
    gain.gain.setValueAtTime(0,time);
    gain.gain.linearRampToValueAtTime(vol*0.4, time+actualDur*0.3);
    gain.gain.setValueAtTime(vol*0.4, time+actualDur*0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time+actualDur+0.35);
    o1.start(time); o1.stop(time+actualDur+0.5);
    noise.start(time); noise.stop(time+actualDur+0.5);
    lfo.start(time); lfo.stop(time+actualDur+0.5);
    oscs.push(o1, noise, lfo);
  } else if(i==='void'){
    const actualDur = Math.max(dur * 1.2, 0.5);
    const o1=ctx.createOscillator(); o1.type='sine'; o1.frequency.value=freq/2;
    const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=freq*1.5;
    const tremAmp=ctx.createGain(); tremAmp.gain.value=0.7;
    const tremLfo=ctx.createOscillator(); tremLfo.type='sine'; tremLfo.frequency.value=0.22;
    const tremDepth=ctx.createGain(); tremDepth.gain.value=0.3;
    tremLfo.connect(tremDepth); tremDepth.connect(tremAmp.gain);
    o1.connect(tremAmp); o2.connect(tremAmp); tremAmp.connect(gain);
    gain.gain.setValueAtTime(0,time);
    gain.gain.linearRampToValueAtTime(vol*0.8, time+actualDur*0.25);
    gain.gain.setValueAtTime(vol*0.8, time+actualDur*0.8);
    gain.gain.exponentialRampToValueAtTime(0.001, time+actualDur+0.5);
    o1.start(time); o1.stop(time+actualDur+0.7);
    o2.start(time); o2.stop(time+actualDur+0.7);
    tremLfo.start(time); tremLfo.stop(time+actualDur+0.7);
    oscs.push(o1, o2, tremLfo);
  } else if(i==='rain'){
    const actualDur = Math.max(dur * 1.2, 0.4);
    const noise=ctx.createBufferSource();
    noise.buffer = getNoiseBuf(ctx); noise.loop = true;
    const bp=ctx.createBiquadFilter();
    bp.type='bandpass'; bp.frequency.value=2000 + Math.random()*1500; bp.Q.value=0.7;
    const hp=ctx.createBiquadFilter();
    hp.type='highpass'; hp.frequency.value=800;
    const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.25+Math.random()*0.2;
    const lg=ctx.createGain(); lg.gain.value=900;
    lfo.connect(lg); lg.connect(bp.frequency);
    noise.connect(bp); bp.connect(hp); hp.connect(gain);
    gain.gain.setValueAtTime(0,time);
    gain.gain.linearRampToValueAtTime(vol*0.5, time+actualDur*0.2);
    gain.gain.setValueAtTime(vol*0.5, time+actualDur*0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, time+actualDur+0.3);
    noise.start(time); noise.stop(time+actualDur+0.4);
    lfo.start(time); lfo.stop(time+actualDur+0.4);
    oscs.push(noise, lfo);
  } else if(i==='choir'){
    const actualDur = Math.max(dur * 1.2, 0.5);
    const vibrato=ctx.createOscillator(); vibrato.type='sine'; vibrato.frequency.value=5.2;
    const vibG=ctx.createGain(); vibG.gain.value=freq*0.01;
    vibrato.connect(vibG);
    const o1=ctx.createOscillator(); o1.type='sine'; o1.frequency.value=freq;
    const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=freq*1.008;
    const o3=ctx.createOscillator(); o3.type='sine'; o3.frequency.value=freq*0.992;
    vibG.connect(o1.frequency); vibG.connect(o2.frequency); vibG.connect(o3.frequency);
    const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=freq*4; lp.Q.value=1;
    o1.connect(lp); o2.connect(lp); o3.connect(lp); lp.connect(gain);
    gain.gain.setValueAtTime(0,time);
    gain.gain.linearRampToValueAtTime(vol*0.4, time+actualDur*0.35);
    gain.gain.setValueAtTime(vol*0.4, time+actualDur*0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time+actualDur+0.5);
    o1.start(time); o1.stop(time+actualDur+0.7);
    o2.start(time); o2.stop(time+actualDur+0.7);
    o3.start(time); o3.stop(time+actualDur+0.7);
    vibrato.start(time); vibrato.stop(time+actualDur+0.7);
    oscs.push(o1,o2,o3,vibrato);
  } else if(i==='cavern'){
    const actualDur = Math.max(dur * 1.2, 0.45);
    const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=freq;
    const del=ctx.createDelay(1.0); del.delayTime.value=0.17;
    const fb=ctx.createGain(); fb.gain.value=0.32;
    const wet=ctx.createGain(); wet.gain.value=0.5;
    const lp=ctx.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=freq*3;
    del.connect(fb); fb.connect(del);
    del.connect(wet); wet.connect(gain);
    o.connect(gain);
    o.connect(lp); lp.connect(del);
    gain.gain.setValueAtTime(0,time);
    gain.gain.linearRampToValueAtTime(vol*0.55, time+actualDur*0.3);
    gain.gain.setValueAtTime(vol*0.55, time+actualDur*0.65);
    gain.gain.exponentialRampToValueAtTime(0.001, time+actualDur+0.5);
    o.start(time); o.stop(time+actualDur+0.6);
    oscs.push(o);
  } else if(i==='glass'){
    const actualDur = Math.max(dur * 1.2, 0.4);
    const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=freq;
    const vib=ctx.createOscillator(); vib.type='sine'; vib.frequency.value=3.2;
    const vibG=ctx.createGain(); vibG.gain.value=freq*0.005;
    vib.connect(vibG); vibG.connect(o.frequency);
    const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=freq*2.01;
    const g2=ctx.createGain(); g2.gain.value=0.18;
    o.connect(gain); o2.connect(g2); g2.connect(gain);
    gain.gain.setValueAtTime(0,time);
    gain.gain.linearRampToValueAtTime(vol*0.55, time+0.04);
    gain.gain.exponentialRampToValueAtTime(vol*0.15, time+actualDur*0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, time+actualDur+0.3);
    o.start(time); o.stop(time+actualDur+0.4);
    o2.start(time); o2.stop(time+actualDur*0.7);
    vib.start(time); vib.stop(time+actualDur+0.4);
    oscs.push(o,o2,vib);
  } else if(i==='hum'){
    const actualDur = Math.max(dur * 1.1, 0.35);
    const o1=ctx.createOscillator(); o1.type='sawtooth'; o1.frequency.value=freq;
    const o2=ctx.createOscillator(); o2.type='sawtooth'; o2.frequency.value=freq*0.5;
    const lp=ctx.createBiquadFilter(); lp.type='lowpass';
    lp.frequency.value=freq*3.5; lp.Q.value=8;
    o1.connect(lp); o2.connect(lp); lp.connect(gain);
    gain.gain.setValueAtTime(0,time);
    gain.gain.linearRampToValueAtTime(vol*0.5, time+actualDur*0.2);
    gain.gain.setValueAtTime(vol*0.5, time+actualDur*0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, time+actualDur+0.25);
    o1.start(time); o1.stop(time+actualDur+0.3);
    o2.start(time); o2.stop(time+actualDur+0.3);
    oscs.push(o1,o2);
  } else if(i==='wind'){
    const actualDur = Math.max(dur * 1.2, 0.4);
    const noise=ctx.createBufferSource();
    noise.buffer = getNoiseBuf(ctx); noise.loop = true;
    const bp=ctx.createBiquadFilter();
    bp.type='bandpass'; bp.frequency.value=600; bp.Q.value=1.5;
    const lfo=ctx.createOscillator(); lfo.type='sine'; lfo.frequency.value=0.4;
    const lg=ctx.createGain(); lg.gain.value=450;
    lfo.connect(lg); lg.connect(bp.frequency);
    const sub=ctx.createOscillator(); sub.type='sine'; sub.frequency.value=freq*0.5;
    const subG=ctx.createGain(); subG.gain.value=0.25;
    noise.connect(bp); bp.connect(gain);
    sub.connect(subG); subG.connect(gain);
    gain.gain.setValueAtTime(0,time);
    gain.gain.linearRampToValueAtTime(vol*0.55, time+actualDur*0.25);
    gain.gain.setValueAtTime(vol*0.55, time+actualDur*0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time+actualDur+0.3);
    noise.start(time); noise.stop(time+actualDur+0.4);
    sub.start(time); sub.stop(time+actualDur+0.4);
    lfo.start(time); lfo.stop(time+actualDur+0.4);
    oscs.push(noise, sub, lfo);
  } else if(i==='pulse'){
    const actualDur = Math.max(dur * 1.1, 0.3);
    const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=freq;
    const tremAmp=ctx.createGain(); tremAmp.gain.value=0.5;
    const tremLfo=ctx.createOscillator(); tremLfo.type='sine'; tremLfo.frequency.value=8+Math.random()*4;
    const tremDepth=ctx.createGain(); tremDepth.gain.value=0.5;
    tremLfo.connect(tremDepth); tremDepth.connect(tremAmp.gain);
    o.connect(tremAmp); tremAmp.connect(gain);
    gain.gain.setValueAtTime(0,time);
    gain.gain.linearRampToValueAtTime(vol*0.65, time+0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time+actualDur+0.2);
    o.start(time); o.stop(time+actualDur+0.3);
    tremLfo.start(time); tremLfo.stop(time+actualDur+0.3);
    oscs.push(o,tremLfo);
  } else {
    const o=ctx.createOscillator();o.type='sine';o.frequency.value=freq;
    o.connect(gain);
    gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(vol,time+0.005);
    gain.gain.exponentialRampToValueAtTime(0.001,time+dur);
    o.start(time);o.stop(time+dur);oscs.push(o);
  }
  return {osc:oscs,gain};
}

