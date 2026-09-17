
let exportPreviewBlob=null;
let exportPreviewName='';
let exportPreviewUrl=null;

function abrirPreviewExport(tipo,titulo,info,contenido,blob,nombre){
  exportPreviewBlob=blob;exportPreviewName=nombre;
  if(exportPreviewUrl)URL.revokeObjectURL(exportPreviewUrl);
  exportPreviewUrl=URL.createObjectURL(blob);
  exportTitle.textContent=titulo;exportInfo.textContent=info||'';
  exportContent.innerHTML='';exportContent.appendChild(contenido);
  if(exportShareRow) exportShareRow.hidden = (tipo !== 'png');
  exportPreview.classList.add('on');
}
function cerrarPreviewExport(){
  exportPreview.classList.remove('on');
  exportContent.innerHTML='';
  if(exportShareRow) exportShareRow.hidden = true;
  if(exportPreviewUrl){URL.revokeObjectURL(exportPreviewUrl);exportPreviewUrl=null}
  exportPreviewBlob=null;exportPreviewName='';
}
function guardarPreviewExport(){
  if(!exportPreviewBlob)return;
  const a=document.createElement('a');
  a.href=exportPreviewUrl||URL.createObjectURL(exportPreviewBlob);
  a.download=exportPreviewName;
  a.style.display='none';
  // Importante para iOS/Android: varios navegadores móviles ignoran en
  // silencio el .click() de un <a download> que no está en el DOM. Hay
  // que insertarlo, hacer click, y recién ahí sacarlo.
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(()=>{if(!exportPreviewUrl)URL.revokeObjectURL(a.href)},1500);
  setStatus(`✅ ${exportPreviewName}`);
}
exportClose.onclick=cerrarPreviewExport;
exportSave.onclick=guardarPreviewExport;
exportPreview.addEventListener('click',e=>{if(e.target===exportPreview)cerrarPreviewExport()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&exportPreview.classList.contains('on'))cerrarPreviewExport()});

