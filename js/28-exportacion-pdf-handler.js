
expPdf.onclick=async()=>{
  try{
    setStatus('Generando PDF...');expPdf.disabled=true;
    const blob=await crearPDFBlob();
    const iframe=document.createElement('iframe');
    abrirPreviewExport('pdf','PREVISUALIZACIÓN · PDF',
      `Ficha + partitura paginada · ${leyendaEstado(' · ')}`,
      iframe,blob,nombreArchivo('pdf')+'.pdf');
    iframe.src=exportPreviewUrl;
    setStatus('PDF listo para revisar');
  }catch(e){console.error(e);setStatus('Error PDF: '+e.message,true)}
  expPdf.disabled=false;
};

