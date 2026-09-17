
function construirEscala(nombre){
  const e=ESCALAS[nombre];if(!e)return;
  const notas=[];
  for(let oct=-4;oct<=4;oct++)for(const i of e.intervals){
    const midi=e.root+i+oct*12;
    if(midi>=21&&midi<=108){
      const freq=440*Math.pow(2,(midi-69)/12);
      const nn=NOMBRES[midi%12],oo=Math.floor(midi/12)-1;
      notas.push({midi,freq,nom:nn+oo,key:nn.toLowerCase()+'/'+oo});
    }
  }
  notas.sort((a,b)=>a.midi-b.midi);notasEscala=notas;
}
function cuantizar(freq){
  if(!notasEscala.length)construirEscala(escalaActual);
  let best=null,minD=Infinity;
  for(const n of notasEscala){
    const d=Math.abs(12*Math.log2(freq/n.freq));
    if(d<minD){minD=d;best=n}
  }
  const u=UMBRALES[modoActual]||1.0;
  if(best&&minD<u)return{...best,dist:minD,freqReal:freq};
  return null;
}
