
function fftReal(input){
  const n=input.length;
  const re=new Float32Array(n),im=new Float32Array(n);
  for(let i=0;i<n;i++)re[i]=input[i];
  for(let i=1,j=0;i<n;i++){
    let bit=n>>1;
    while(j&bit){j^=bit;bit>>=1}
    j^=bit;
    if(i<j){const tr=re[i];re[i]=re[j];re[j]=tr}
  }
  for(let len=2;len<=n;len<<=1){
    const ang=-2*Math.PI/len,wR=Math.cos(ang),wI=Math.sin(ang);
    for(let i=0;i<n;i+=len){
      let cr=1,ci=0;
      for(let j=0;j<len/2;j++){
        const uR=re[i+j],uI=im[i+j];
        const vR=re[i+j+len/2]*cr-im[i+j+len/2]*ci;
        const vI=re[i+j+len/2]*ci+im[i+j+len/2]*cr;
        re[i+j]=uR+vR;im[i+j]=uI+vI;
        re[i+j+len/2]=uR-vR;im[i+j+len/2]=uI-vI;
        const nR=cr*wR-ci*wI;ci=cr*wI+ci*wR;cr=nR;
      }
    }
  }
  const mags=new Float32Array(n/2);
  for(let i=0;i<n/2;i++)mags[i]=Math.sqrt(re[i]*re[i]+im[i]*im[i])/n;
  return mags;
}

async function analizar(buffer,bpm){
  const ch=buffer.getChannelData(0),sr=buffer.sampleRate;
  const fftSize=2048,hop=1024;
  const stepDurLocal=60/bpm/8;
  const totalSamples=Math.floor(sr*buffer.duration);
  const numWin=Math.floor((totalSamples-fftSize)/hop)+1;
  const eventos=[];
  const hann=new Float32Array(fftSize);
  for(let i=0;i<fftSize;i++)hann[i]=0.5*(1-Math.cos(2*Math.PI*i/(fftSize-1)));
  const batchSize=40;
  for(let wStart=0;wStart<numWin;wStart+=batchSize){
    const wEnd=Math.min(wStart+batchSize,numWin);
    for(let w=wStart;w<wEnd;w++){
      const pos=w*hop;
      const win=new Float32Array(fftSize);
      let sum=0;
      for(let i=0;i<fftSize;i++){const v=ch[pos+i]*hann[i];win[i]=v;sum+=v*v}
      const mags=fftReal(win);
      const rms=Math.sqrt(sum/fftSize);
      const peaks=[];
      for(let i=2;i<mags.length-2;i++){
        if(mags[i]>mags[i-1]&&mags[i]>mags[i+1]&&mags[i]>0.010){
          const a=mags[i-1],b=mags[i],c=mags[i+1];
          const denom=a-2*b+c;
          const shift=denom!==0?0.5*(a-c)/denom:0;
          const idx=i+shift;
          const freq=idx*sr/fftSize;
          const amp=Math.max(0,b-0.25*(a-c)*shift);
          if(freq>40&&freq<8000)peaks.push({freq,amp});
        }
      }
      const grupos={bass:[],mid:[],high:[]};
      for(const p of peaks){
        if(p.freq<250)grupos.bass.push(p);
        else if(p.freq<2000)grupos.mid.push(p);
        else grupos.high.push(p);
      }
      const top=[];
      for(const band of ['bass','mid','high']){
        grupos[band].sort((a,b)=>b.amp-a.amp);
        if(grupos[band].length)top.push({...grupos[band][0],band});
      }
      const time=pos/sr;
      const step=Math.round(time/stepDurLocal);
      for(const p of top)eventos.push({time,step,freq:p.freq,amp:p.amp,band:p.band,rms});
    }
    setProgress((wEnd/numWin)*0.95);
    await new Promise(r=>setTimeout(r,0));
  }
  setProgress(1);
  return{eventos,stepDur:stepDurLocal};
}

async function analizarVivo(buffer, bpm){
  const ch = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const fftSize = 2048, hop = 2048;
  const stepDurLocal = 60/bpm/4;
  const totalSamples = Math.floor(sr * buffer.duration);
  const numWin = Math.floor((totalSamples - fftSize)/hop) + 1;
  const eventos = [];
  const hann = new Float32Array(fftSize);
  for(let i=0;i<fftSize;i++) hann[i] = 0.5*(1-Math.cos(2*Math.PI*i/(fftSize-1)));
  const batchSize = 40;
  for(let wStart=0; wStart<numWin; wStart+=batchSize){
    const wEnd = Math.min(wStart+batchSize, numWin);
    for(let w=wStart; w<wEnd; w++){
      const pos = w*hop;
      const win = new Float32Array(fftSize);
      let rms = 0;
      for(let i=0;i<fftSize;i++){ const v=ch[pos+i]*hann[i]; win[i]=v; rms+=v*v; }
      rms = Math.sqrt(rms/fftSize);
      const mags = fftReal(win);
      const peaks = [];
      for(let i=2;i<mags.length-2;i++){
        if(mags[i]>mags[i-1] && mags[i]>mags[i+1] && mags[i]>0.008){
          const a=mags[i-1], b=mags[i], c=mags[i+1];
          const denom = a-2*b+c;
          const shift = denom!==0 ? 0.5*(a-c)/denom : 0;
          const idx = i+shift;
          const freq = idx*sr/fftSize;
          const amp = Math.max(0, b - 0.25*(a-c)*shift);
          if(freq>40 && freq<4000) peaks.push({freq, amp});
        }
      }
      peaks.sort((a,b)=>b.amp-a.amp);
      const time = pos/sr;
      const step = Math.round(time/stepDurLocal);
      const usados = {bass:0, mid:0, high:0};
      const top = [];
      for(const p of peaks){
        let band='mid';
        if(p.freq<250) band='bass';
        else if(p.freq>=2000) band='high';
        if(usados[band] >= 2) continue;
        usados[band]++;
        top.push({...p, band});
        if(top.length >= 6) break;
      }
      for(const p of top) eventos.push({time, step, freq:p.freq, amp:p.amp, band:p.band, rms});
    }
    setProgress((wEnd/numWin)*0.95);
    await new Promise(r=>setTimeout(r,0));
  }
  setProgress(1);
  return { eventos, stepDur: stepDurLocal };
}

