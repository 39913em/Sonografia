# SONOGRAFÍA — REBENT híbrido 0–5

- Cargar una imagen inicia en seed 0 / integridad 0%.
- Cada RE-BENT incrementa exactamente un nivel.
- Sólo existen los niveles 0, 1, 2, 3, 4 y 5.
- Seed 5 representa 100% de reincorporación de la capa global de seed de la versión 1.
- Cambiar el modo de FUENTE (RAW/ECHO/PICASSO/SLICE) reinicia el ciclo a seed 0 y vuelve a ejecutar el pipeline.
- La cadena se mantiene concatenada: imagen resultante → audio → eventos → secuencia → partitura → render sonoro → exportaciones.
- Las exportaciones leen el mismo estado de seed e integridad.
- No se modificaron CSS, identidad visual ni estructura estética de la aplicación.
- No se agregó un nuevo control: se reutilizó el badge `seed`.

API:
```js
resetIntensidadProgresiva();
avanzarIntensidadProgresiva();
getNivelProgresivo();
getIntensidadProgresiva();
```
