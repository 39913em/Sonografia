
let audioCtx=null,audioBuffer=null,source=null;
let imageData=null,notasEscala=[],escalaActual='minor',modoActual='hibrido',procesando=false;
let eventos=[],eventosFiltrados=[],eventosSecuencia=[],slots={},stepDur=60/128/8,bpmActual=128;
let activeVoices=[];
let playingTimer=null;
let rebentSeed=0;
const REBENT_MAX=5;

function resetIntensidadProgresiva(){
  rebentSeed=0;
  return rebentSeed;
}

function avanzarIntensidadProgresiva(){
  rebentSeed=Math.min(REBENT_MAX,rebentSeed+1);
  return rebentSeed;
}

function getNivelProgresivo(){
  return rebentSeed;
}

function getIntensidadProgresiva(){
  return rebentSeed/REBENT_MAX;
}
let lastSeqLen=0;
let lastBentData=null;
let lastBmpBytes=null;
let notasShownCount=200;

let audioBufferHibrido = null;
let currentSource = null;
let audioStartTime = 0;
let _renderToken = 0;

let counterRAF=null,counterDuration=0,counterEventList=[];
let playheadTime=0;
let scrubbing=false;
let wasPlaying=false;

let vfNoteRefs = [];
let partituraNotes = [];
let svgViewBox = null;
let totalReproDuration = 0;

let _lastAutoScrollTime = 0;

