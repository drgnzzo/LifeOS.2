/* RAW Entry — Core v.8.34 (Activity: tabla compacta sin corte ni scroll, columnas 400px)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ v6.040 — BOTÓN ACTUALIZAR                                        ║
   ╚══════════════════════════════════════════════════════════════════╝
   · progStart/progDone a prueba de null: el elemento #prog (barra de
     progreso vieja) se retiró al rediseñar la barra en v6.010. Ya no
     lanzan TypeError si no existe — esto desbloquea refreshTodo, que
     fallaba en progStart() antes de buscar datos.

   ── v6.030 — CARRUSEL DEL HOME MÓVIL ──
   · El router _osMostrar('home'), en móvil, hace snap al slide del
     dial del carrusel (window._osCarouselHome) y deja visible el
     board-anverso, que contiene el carrusel: se le quita el
     display:none de origen. El carrusel vive en raw-carousel.js.

   ── v6.020 — ROUTER DE CAPAS + HOME ──
   _osMostrar(seccion) es el router único de navegación de v6:
     · 'home' → el overlay (dial + cards + fondo cósmico).
     · resto  → la .board-face de la sección, con cross-fade.
   _irAPanel es envoltorio de _osMostrar; volverAlAnverso =
   _osMostrar('home'); irABitacora/irAActivity/irANutricion
   reconectadas al router conservando su carga de datos.

   ── Heredado v5.211 ──
   FIX DEFINITIVO fecha amontonada sobre el círculo de check en
   Libros/Movies/Pendientes. infoFlex se selecciona como el div hijo
   que NO es _act-item.
   ── Header original
   DIVISIÓN DEL ARCHIVO — raw-core.js dividido en dos para reducir tamaño:

   - raw-core.js  (este archivo, ~150 KB): API híbrida, iconos del dial,
     _DIAL_ITEMS, _SIMS_NEEDS, configuración base, formularios, utilidades,
     navegación entre paneles, render de Nutrición, popups, toasts.
   - raw-overlay.js (~120 KB): el dial overlay completo — variables del
     dial (_dialOverlay, _dialCanvas, _DC...), _crearDialOverlay con todos
     los paneles HUD, _reposicionarHUD, drawing, animaciones, abrirDial,
     cerrarDial, _aplicarDialPreset, cerrarEntrada, _calcXPNivel y demás
     calculadores derivados, renderSimsBandSimsStyle, _refrescarEspejos.

   ORDEN DE CARGA EN index.html (CRÍTICO):
     1. raw-core.js     ← este archivo
     2. raw-overlay.js  ← cargado INMEDIATAMENTE después
     3. raw-overlay-dnd.js
     4. raw-dashboard.js
     5. raw-logros.js
     6. raw-bitacora.js
     7. raw-carousel.js
   (v6.061: raw-drag.js retirado — el DnD de columnas del anverso viejo
   ya no existe en v6.)

   COMUNICACIÓN ENTRE ARCHIVOS:
   - Funciones: declaradas con `function X(){}` a nivel de archivo → se
     vuelven globales (window.X) automáticamente. raw-overlay.js puede
     llamar a setModoEntrada/_renderTabEntrada/etc. sin imports.
   - raw-core.js puede llamar a abrirDial/cerrarDial/cerrarEntrada/etc.
     en runtime (los handlers se ejecutan después de que ambos cargan).
   - Variables compartidas: window._dialPreset (escrito por las closures
     de _DIAL_ITEMS en raw-core, leído por _aplicarDialPreset en overlay).

   ── Heredado de v5.083 ──
   Proporciones: USER 220px, Stats 340px, Sim al ancho del dial centrado;
   Misión/Nivel con anchos fijos; Logro y Track al ancho del dial.
   Sim como banda horizontal de 9 columnas.
*/
window._apartadosData = window._apartadosData || [];
window._fijosData     = window._fijosData     || [];
(function(){
  if(/iPhone|iPad|iPod|Android.*Mobile/.test(navigator.userAgent)){
    document.documentElement.classList.add('mob');
  }
})();

// ══════════════════════════════════════════
//  API HÍBRIDA
// ══════════════════════════════════════════
const API_URL = 'https://script.google.com/macros/s/AKfycbzeJOsUXaMqDzCBu2MHsvFa01Jf96CUEoScH9cF_SWIfokWrwmcyKIwC_TCPhCAHPUrWg/exec';

const EN_GAS = (function(){
  try { return typeof google!=='undefined'&&typeof google.script!=='undefined'&&typeof google.script.run!=='undefined'; }
  catch(e){ return false; }
})();

function gasRun(fn,...args){
  return new Promise((resolve,reject)=>{
    const runner=google.script.run.withSuccessHandler(resolve).withFailureHandler(e=>{console.error(fn,e);reject(e);});
    if(typeof runner[fn]==='function') runner[fn](...args);
    else reject(new Error('Función no encontrada: '+fn));
  });
}
async function apiGet(action,params={}){
  const url=new URL(API_URL);
  url.searchParams.set('action',action);
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
  const r=await fetch(url); return r.json();
}
async function apiPost(action,data={}){
  const r=await fetch(API_URL,{method:'POST',body:JSON.stringify({action,...data})});
  return r.json();
}

const api = {
  getAll:               ()=>EN_GAS?gasRun('getAll'):apiGet('getAll'),
  getSaldoDia:          (f)=>EN_GAS?gasRun('getSaldoDia',f):apiGet('getSaldoDia',{fecha:f}),
  getListaEstructura:   ()=>EN_GAS?gasRun('getListaEstructura'):apiGet('getListaEstructura'),
  insertarEnRAW:        (d)=>EN_GAS?gasRun('insertarEnRAW',d):apiPost('insertarEnRAW',{data:d}),
  actualizarFijo:       (fila,monto)=>EN_GAS?gasRun('actualizarFijo',fila,monto):apiPost('actualizarFijo',{fila,monto}),
  agregarALista:        (colIndex,valor)=>EN_GAS?gasRun('agregarALista',colIndex,valor):apiPost('agregarALista',{colIndex,valor}),
  marcarLogro:          (fila,val)=>EN_GAS?gasRun('marcarLogro',fila,val):apiPost('marcarLogro',{fila,val}),
  getFijos:             ()=>EN_GAS?gasRun('getFijos'):apiGet('getFijos'),
  getDatosMes:          ()=>EN_GAS?gasRun('getDatosMes'):apiGet('getDatosMes'),
  getGastos:            ()=>EN_GAS?gasRun('getGastos'):apiGet('getGastos'),
  getLogros:            ()=>EN_GAS?gasRun('getLogros'):apiGet('getLogros'),
  getActivityCheck:     ()=>EN_GAS?gasRun('getActivityCheck'):apiGet('getActivityCheck'),
  cargarActivityChecks: (semana)=>EN_GAS?gasRun('cargarActivityChecks',semana):apiGet('cargarActivityChecks',{semana}),
  guardarActivityChecks:(semana,checks)=>EN_GAS?gasRun('guardarActivityChecks',semana,checks):apiPost('guardarActivityChecks',{semana,checks}),
  guardarEnBancos:      (nombre,monto,fecha)=>EN_GAS?gasRun('guardarEnBancos',nombre,monto,fecha):apiPost('guardarEnBancos',{nombre,monto,fecha}),
  getFilaPorId:         (id)=>EN_GAS?gasRun('getFilaPorId',id):apiGet('getFilaPorId',{id}),
  editarFilaRAW:        (fila,datos)=>EN_GAS?gasRun('editarFilaRAW',fila,datos):apiPost('editarFilaRAW',{fila,datos}),
  getPensamientos:      ()=>EN_GAS?gasRun('getPensamientos'):apiGet('getPensamientos'),
  guardarPensamiento:   (d)=>EN_GAS?gasRun('guardarPensamiento',d):apiPost('guardarPensamiento',{datos:d}),
  getRelaciones:        ()=>EN_GAS?gasRun('getRelaciones'):apiGet('getRelaciones'),
  guardarInteraccion:   (d)=>EN_GAS?gasRun('guardarInteraccion',d):apiPost('guardarInteraccion',{datos:d}),
  getSalud:             ()=>EN_GAS?gasRun('getSalud'):apiGet('getSalud'),
  guardarSalud:         (d)=>EN_GAS?gasRun('guardarSalud',d):apiPost('guardarSalud',{datos:d}),
  getApartados:         ()=>EN_GAS?gasRun('getApartados'):apiGet('getApartados'),
  guardarApartado:      (d)=>EN_GAS?gasRun('guardarApartado',d):apiPost('guardarApartado',{datos:d}),
  actualizarApartado:   (fila,estado)=>EN_GAS?gasRun('actualizarApartado',fila,estado):apiPost('actualizarApartado',{fila,estado}),
  getFinancieroAvanzado:()=>EN_GAS?gasRun('getFinancieroAvanzado'):apiGet('getFinancieroAvanzado'),
  getRevision:          (tipo,anio,mes,semana)=>EN_GAS?gasRun('getRevision',tipo,anio,mes,semana):apiGet('getRevision',{tipo,anio,mes,semana}),
  getNecesidades:       (anio,mes,fecha)=>EN_GAS?gasRun('getNecesidades',anio,mes,fecha):apiGet('getNecesidades',{anio,mes,fecha}),
  getFlujoPorMes:       ()=>EN_GAS?gasRun('getFlujoPorMes'):apiGet('getFlujoPorMes'),
  getScoreVida:         ()=>EN_GAS?gasRun('getScoreVida'):apiGet('getScoreVida'),
  enviarSOS:            (d)=>EN_GAS?gasRun('enviarSOS',d):apiPost('enviarSOS',{datos:d}),
  getPatrimonio:        ()=>EN_GAS?gasRun('getPatrimonio'):apiGet('getPatrimonio'),
  getAhorro:            ()=>EN_GAS?gasRun('getAhorro'):apiGet('getAhorro'),
  getEfectivo:          ()=>EN_GAS?gasRun('getEfectivo'):apiGet('getEfectivo'),
  getInversion:         ()=>EN_GAS?gasRun('getInversion'):apiGet('getInversion'),
  guardarAhorro:        (d)=>EN_GAS?gasRun('guardarAhorro',d):apiPost('guardarAhorro',{datos:d}),
  guardarEfectivo:      (d)=>EN_GAS?gasRun('guardarEfectivo',d):apiPost('guardarEfectivo',{datos:d}),
  guardarInversion:     (d)=>EN_GAS?gasRun('guardarInversion',d):apiPost('guardarInversion',{datos:d}),
  setActivityCheck:     (tipo,fila,dia,valor)=>EN_GAS?gasRun('setActivityCheck',tipo,fila,dia,valor):apiPost('setActivityCheck',{tipo,fila,dia,valor}),
  marcarActivityItem:   (tipo,fila,valor)=>EN_GAS?gasRun('marcarActivityItem',tipo,fila,valor):apiPost('marcarActivityItem',{tipo,fila,valor}),
  agregarAActivity:     (tipo,datos)=>EN_GAS?gasRun('agregarAActivity',tipo,datos):apiPost('agregarAActivity',{tipo,datos}),
  resetearElectronics:  ()=>EN_GAS?gasRun('resetearElectronicsHoy'):apiGet('resetearElectronics'),
  getNutricion:         ()=>EN_GAS?gasRun('getNutricion'):apiGet('getNutricion'),
  getMetasNutricion:    ()=>EN_GAS?gasRun('getMetasNutricion'):apiGet('getMetasNutricion'),
  guardarNutricion:     (d)=>EN_GAS?gasRun('guardarNutricion',d):apiPost('guardarNutricion',{datos:d}),
  getEntrenamiento:     ()=>EN_GAS?gasRun('getEntrenamiento'):apiGet('getEntrenamiento'),
  guardarEntrenamiento: (d)=>EN_GAS?gasRun('guardarEntrenamiento',d):apiPost('guardarEntrenamiento',{datos:d}),
  // v6.069 — NOTAS (sticky notes). Hoja NOTAS del Sheet.
  getNotas:             ()=>EN_GAS?gasRun('getNotas'):apiGet('getNotas'),
  guardarNota:          (d)=>EN_GAS?gasRun('guardarNota',d):apiPost('guardarNota',{datos:d}),
  actualizarNota:       (d)=>EN_GAS?gasRun('actualizarNota',d):apiPost('actualizarNota',{datos:d}),
  borrarNota:           (id)=>EN_GAS?gasRun('borrarNota',id):apiPost('borrarNota',{id:id}),
  moverNota:            (id,slot)=>EN_GAS?gasRun('moverNota',id,slot):apiPost('moverNota',{id:id,slot:slot}),
  // v8.5 — Timers (cronómetros). Backend: getTimers / crearTimer / actualizarTimer.
  getTimers:            ()=>EN_GAS?gasRun('getTimers'):apiGet('getTimers'),
  crearTimer:           (datos)=>EN_GAS?gasRun('crearTimer',datos):apiPost('crearTimer',{datos:datos}),
  actualizarTimer:      (clave,campos)=>EN_GAS?gasRun('actualizarTimer',clave,campos):apiPost('actualizarTimer',{clave:clave,campos:campos}),
};
// v8.5 — Exponer api en window para módulos cargados aparte (p.ej. raw-timers).
try { window.api = api; } catch(e){}

// ══════════════════════════════════════════
//  ESTADO
// ══════════════════════════════════════════
const CAMPOS=['fecha','proyecto','contacto','concepto','monto','recurrencia','necesidad','clave'];
const MESES_ES=['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
let sign=1,cats={},proxSel='',contactoSel='',recSel='',necesidadSel='',sheetUrl='';
let _modoEditar=false,_filaEditar=null,_idEditar=null;
let _tabEntrada='nueva';
let datosMes={meses:[],grupos:{}};
let _toast=null;

// ══════════════════════════════════════════
//  PARTÍCULAS
// ══════════════════════════════════════════
(()=>{
  const c=document.getElementById('pts'); if(!c)return;
  const esMob=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const tipos=esMob?['white','white','white','white','white','white']:['blue','blue','blue','cyan','cyan','blue'];
  for(let i=0;i<60;i++){
    const p=document.createElement('div');
    p.className='pt '+tipos[Math.floor(Math.random()*tipos.length)];
    p.style.left=Math.random()*100+'vw';
    p.style.top=(100+Math.random()*120)+'vh';
    p.style.animationName='subir';
    p.style.animationDuration=(10+Math.random()*8)+'s';
    p.style.animationDelay=(Math.random()*12)+'s';
    p.style.animationTimingFunction='linear';
    p.style.animationIterationCount='infinite';
    c.appendChild(p);
  }
})();

function _initMobTablero(){
  const tablero=document.getElementById('mob-tablero');
  const sections=document.getElementById('mob-sections');
  if(tablero) tablero.style.display='none';
  if(sections) sections.style.display='flex';
}

// ══════════════════════════════════════════
//  DIAL — Canvas 2D v5.072
// ══════════════════════════════════════════

var _DIAL_BASE      = 'rgba(18,18,24,0.95)';
var _DIAL_HOVER     = 'rgba(30,30,42,0.98)';
var _DIAL_ACT       = 'rgba(24,24,36,0.98)';
var _DIAL_SBASE     = 'rgba(14,14,20,0.96)';
var _DIAL_SHOV      = 'rgba(26,26,38,0.99)';

// Ícono draw functions subitems
function _icoLibro(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.rect(x-7*k,y-9*k,14*k,18*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();ctx.beginPath();ctx.moveTo(x-7*k,y-2*k);ctx.lineTo(x-1*k,y-9*k);ctx.lineTo(x-1*k,y+5*k);ctx.closePath();ctx.strokeStyle=c;ctx.stroke();}
function _icoMovie(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.rect(x-9*k,y-6*k,18*k,12*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();[-6,-2,2,6].forEach(function(dx){ctx.beginPath();ctx.moveTo(x+dx*k,y-6*k);ctx.lineTo(x+dx*k,y+6*k);ctx.strokeStyle=c;ctx.lineWidth=1.2;ctx.stroke();});}
function _icoPendiente(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y,8*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(x-2.5*k,y-1*k,1.8*k,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();ctx.beginPath();ctx.arc(x+2.5*k,y+1*k,1.8*k,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();}
function _icoAhorro(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y,7*k,Math.PI*.15,Math.PI*2.85);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x+7*k,y-2*k);ctx.lineTo(x+11*k,y-4*k);ctx.lineTo(x+11*k,y+2*k);ctx.fillStyle=c;ctx.fill();}
function _icoEfectivo(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.rect(x-9*k,y-5*k,18*k,10*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x-4*k,y);ctx.lineTo(x+4*k,y);ctx.strokeStyle=c;ctx.lineWidth=2.5;ctx.lineCap='round';ctx.stroke();}
function _icoInversion(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-8*k,y+6*k);ctx.lineTo(x-3*k,y);ctx.lineTo(x+2*k,y+4*k);ctx.lineTo(x+8*k,y-6*k);ctx.strokeStyle=c;ctx.lineWidth=2.2;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();}

// _dialPreset se expone en window para sincronización entre archivos:
// las closures de _DIAL_ITEMS escriben en window._dialPreset; _aplicarDialPreset
// (en raw-overlay.js) lo lee desde window._dialPreset.
window._dialPreset = window._dialPreset || {};

function _icoTexto(label){ return function(ctx,x,y,s,c){ var k=s/22; ctx.font='bold '+Math.round(s*0.38)+'px -apple-system,sans-serif'; ctx.fillStyle=c; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,x,y); }; }

var _DIAL_ITEMS = [
  // ── ACTIVITY ──
  { id:'activity', label:'Activity', accent:'#22d3c8',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-8*k,y+4*k);ctx.lineTo(x-2*k,y-2*k);ctx.lineTo(x+3*k,y+3*k);ctx.lineTo(x+9*k,y-7*k);ctx.strokeStyle=c;ctx.lineWidth=2.4;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();},
    subs:[
      {id:'activity', label:'Ver sección', accent:'#22d3c8', draw:_icoTexto('👁'),
       preset:function(){ window._dialPreset={irA:'irAActivity'}; }},
      {id:'libro',   label:'Libros',     accent:'#ec4899', draw:_icoLibro,
       preset:function(){ window._dialPreset={tab:'libro'}; }},
      {id:'movie',   label:'Movies',     accent:'#f59e0b', draw:_icoMovie,
       preset:function(){ window._dialPreset={tab:'movie'}; }},
      {id:'norut',   label:'Pendientes', accent:'#8b5cf6', draw:_icoPendiente,
       preset:function(){ window._dialPreset={tab:'norut'}; }},
    ]},

  // ── APARTADO ──
  { id:'apartado', label:'Apartado', accent:'#4ade80',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y-2*k,5.5*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x-8*k,y+5*k);ctx.lineTo(x+8*k,y+5*k);ctx.lineTo(x+6*k,y+10*k);ctx.lineTo(x-6*k,y+10*k);ctx.closePath();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();},
    subs:[
      {id:'apartado', label:'Ver sección', accent:'#c4b5fd', draw:_icoTexto('👁'),
       preset:function(){ window._dialPreset={cf:'hud-patrimonio'}; }},
      {id:'apartado', label:'Nuevo', accent:'#4ade80', draw:_icoTexto('➕'),
       preset:function(){ window._dialPreset={tab:'apartado'}; }},
    ]},

  // ── BANCOS ──
  { id:'bancos', label:'Bancos', accent:'#f59e0b',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-9*k,y+7*k);ctx.lineTo(x+9*k,y+7*k);ctx.moveTo(x-6*k,y-1*k);ctx.lineTo(x-6*k,y+7*k);ctx.moveTo(x,y-1*k);ctx.lineTo(x,y+7*k);ctx.moveTo(x+6*k,y-1*k);ctx.lineTo(x+6*k,y+7*k);ctx.moveTo(x-9*k,y-1*k);ctx.lineTo(x+9*k,y-1*k);ctx.moveTo(x-10*k,y-6*k);ctx.lineTo(x,y-12*k);ctx.lineTo(x+10*k,y-6*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();},
    subsGen:function(){
      var ver={id:'bancos', label:'Ver sección', accent:'#f59e0b', draw:_icoTexto('👁'),
        preset:function(){ window._dialPreset={cf:'hud-patrimonio'}; }};
      var bancos=(window._fijosData||[]).filter(function(f){return f.nombre&&f.nombre!=='P';}).slice(0,5);
      var gen=bancos.map(function(f){
        return {id:'bancos', label:f.nombre, accent:'#f59e0b', draw:_icoTexto(f.nombre.slice(0,4)),
          preset:function(){ window._dialPreset={tab:'bancos', banco:f.nombre}; }};
      });
      return [ver].concat(gen);
    }},

  // ── ENTRENAMIENTO ──
  { id:'entrenamiento', label:'Entrena', accent:'#fb923c',
    draw:function(ctx,x,y,s,c){var k=s/22;[[-9,0,3.5],[9,0,3.5]].forEach(function(p){ctx.beginPath();ctx.arc(x+p[0]*k,y+p[1]*k,p[2]*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2.2;ctx.stroke();});ctx.beginPath();ctx.moveTo(x-5*k,y);ctx.lineTo(x+5*k,y);ctx.strokeStyle=c;ctx.lineWidth=3;ctx.lineCap='round';ctx.stroke();},
    subs:[
      {id:'entrenamiento', label:'Ver sección', accent:'#fb923c', draw:_icoTexto('👁'),
       preset:function(){ window._dialPreset={irA:'irABitacora'}; }},
      {id:'entrenamiento', label:'Fuerza',      accent:'#fb923c', draw:_icoTexto('💪'),
       preset:function(){ window._dialPreset={tab:'entrenamiento',tipo:'Fuerza'}; }},
      {id:'entrenamiento', label:'Cardio',       accent:'#f87171', draw:_icoTexto('🏃'),
       preset:function(){ window._dialPreset={tab:'entrenamiento',tipo:'Cardio'}; }},
      {id:'entrenamiento', label:'HIIT',         accent:'#fbbf24', draw:_icoTexto('⚡'),
       preset:function(){ window._dialPreset={tab:'entrenamiento',tipo:'HIIT'}; }},
      {id:'entrenamiento', label:'Flex',         accent:'#86efac', draw:_icoTexto('🧘'),
       preset:function(){ window._dialPreset={tab:'entrenamiento',tipo:'Flexibilidad'}; }},
      {id:'entrenamiento', label:'Deporte',      accent:'#93c5fd', draw:_icoTexto('⚽'),
       preset:function(){ window._dialPreset={tab:'entrenamiento',tipo:'Deporte'}; }},
    ]},

  // ── NUTRICIÓN ──
  { id:'nutricion', label:'Nutrición', accent:'#86efac',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y+2*k,7*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x,y-5*k);ctx.bezierCurveTo(x,y-12*k,x+7*k,y-11*k,x+6*k,y-5*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();},
    subs:[
      {id:'nutricion', label:'Ver sección', accent:'#86efac', draw:_icoTexto('👁'),
       preset:function(){ window._dialPreset={irA:'irANutricion'}; }},
      {id:'nutricion', label:'Desayuno', accent:'#fbbf24', draw:_icoTexto('☀️'),
       preset:function(){ window._dialPreset={tab:'nutricion',momento:'Desayuno'}; }},
      {id:'nutricion', label:'Comida',   accent:'#86efac', draw:_icoTexto('🍽'),
       preset:function(){ window._dialPreset={tab:'nutricion',momento:'Comida'}; }},
      {id:'nutricion', label:'Cena',     accent:'#c4b5fd', draw:_icoTexto('🌙'),
       preset:function(){ window._dialPreset={tab:'nutricion',momento:'Cena'}; }},
      {id:'nutricion', label:'Snack',    accent:'#f0abfc', draw:_icoTexto('🍎'),
       preset:function(){ window._dialPreset={tab:'nutricion',momento:'Snack'}; }},
    ]},

  // ── PATRIMONIO ──
  { id:'patrimonio', label:'Patrimonio', accent:'#c4b5fd',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-10*k,y+8*k);ctx.lineTo(x+10*k,y+8*k);ctx.moveTo(x-6*k,y-1*k);ctx.lineTo(x-6*k,y+8*k);ctx.moveTo(x,y-1*k);ctx.lineTo(x,y+8*k);ctx.moveTo(x+6*k,y-1*k);ctx.lineTo(x+6*k,y+8*k);ctx.moveTo(x-10*k,y-1*k);ctx.lineTo(x+10*k,y-1*k);ctx.moveTo(x-12*k,y-7*k);ctx.lineTo(x,y-13*k);ctx.lineTo(x+12*k,y-7*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();},
    subs:[
      {id:'patrimonio', label:'Ver sección', accent:'#c4b5fd', draw:_icoTexto('👁'),
       preset:function(){ window._dialPreset={cf:'hud-patrimonio'}; }},
      {id:'patrimonio', label:'Banco',     accent:'#4ade80',  draw:_icoAhorro,
       preset:function(){ window._dialPreset={tab:'patrimonio',tipo:'ahorro'}; }},
      {id:'patrimonio', label:'Efectivo',  accent:'#fbbf24',  draw:_icoEfectivo,
       preset:function(){ window._dialPreset={tab:'patrimonio',tipo:'efectivo'}; }},
      {id:'patrimonio', label:'Inversión', accent:'#c4b5fd',  draw:_icoInversion,
       preset:function(){ window._dialPreset={tab:'patrimonio',tipo:'inversion'}; }},
    ]},

  // ── PENSAMIENTO ──
  { id:'pensamiento', label:'Pensa', accent:'#f0abfc',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x-1*k,y-2*k,8*k,Math.PI*.3,Math.PI*2.2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(x+5*k,y+8*k,2.5*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(x+9*k,y+13*k,1.5*k,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();},
    subs:[
      {id:'pensamiento', label:'Ver sección', accent:'#f0abfc', draw:_icoTexto('👁'),
       preset:function(){ window._dialPreset={irA:'irABitacora'}; }},
      {id:'pensamiento', label:'Emoción',   accent:'#ec4899', draw:_icoTexto('💗'),
       preset:function(){ window._dialPreset={tab:'pensamiento',categoria:'Emoción'}; }},
      {id:'pensamiento', label:'Idea',       accent:'#fbbf24', draw:_icoTexto('💡'),
       preset:function(){ window._dialPreset={tab:'pensamiento',categoria:'Idea'}; }},
      {id:'pensamiento', label:'Reflexión',  accent:'#8b5cf6', draw:_icoTexto('🔮'),
       preset:function(){ window._dialPreset={tab:'pensamiento',categoria:'Reflexión'}; }},
      {id:'pensamiento', label:'Decisión',   accent:'#f59e0b', draw:_icoTexto('⚖'),
       preset:function(){ window._dialPreset={tab:'pensamiento',categoria:'Decisión'}; }},
      {id:'pensamiento', label:'Sueño',      accent:'#67e8f9', draw:_icoTexto('💭'),
       preset:function(){ window._dialPreset={tab:'pensamiento',categoria:'Sueño'}; }},
    ]},

  // ── PERSONA ──
  { id:'persona', label:'Persona', accent:'#93c5fd',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x-3*k,y-5*k,4*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(x+5*k,y-7*k,3.2*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=1.8;ctx.stroke();ctx.beginPath();ctx.moveTo(x-12*k,y+10*k);ctx.quadraticCurveTo(x-3*k,y+2*k,x+5*k,y+10*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();ctx.beginPath();ctx.moveTo(x+3*k,y+4*k);ctx.quadraticCurveTo(x+11*k,y,x+14*k,y+10*k);ctx.strokeStyle=c;ctx.lineWidth=1.8;ctx.lineCap='round';ctx.stroke();},
    subs:[
      {id:'persona', label:'+ Energía', accent:'#4ade80', draw:_icoTexto('+'),
       preset:function(){ window._dialPreset={tab:'persona',energia:1}; }},
      {id:'persona', label:'Neutral',   accent:'#94a3b8', draw:_icoTexto('○'),
       preset:function(){ window._dialPreset={tab:'persona',energia:0}; }},
      {id:'persona', label:'− Energía', accent:'#f87171', draw:_icoTexto('−'),
       preset:function(){ window._dialPreset={tab:'persona',energia:-1}; }},
    ]},

  // ── TIMER (v8.5) ── cronómetros que cuentan hacia arriba
  { id:'timer', label:'Timer', accent:'#67e8f9',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y+1*k,8*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x,y+1*k);ctx.lineTo(x,y-4*k);ctx.moveTo(x,y+1*k);ctx.lineTo(x+4*k,y+3*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();ctx.beginPath();ctx.moveTo(x-3*k,y-9*k);ctx.lineTo(x+3*k,y-9*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();},
    subs:[
      {id:'timer', label:'Ver timers', accent:'#67e8f9', draw:_icoTexto('⏱'),
       preset:function(){ window._dialPreset={tab:'timer', accion:'ver'}; }},
      {id:'timer', label:'Nuevo',      accent:'#4ade80', draw:_icoTexto('+'),
       preset:function(){ window._dialPreset={tab:'timer', accion:'nuevo'}; }},
    ]},

  // ── EDITAR ──
  { id:'editar', label:'Editar', accent:'#a5b4fc',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/4);ctx.beginPath();ctx.rect(-2.5*k,-9*k,5*k,16*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();ctx.beginPath();ctx.moveTo(-2.5*k,7*k);ctx.lineTo(0,12*k);ctx.lineTo(2.5*k,7*k);ctx.fillStyle=c;ctx.fill();ctx.restore();},
    accionEspecial:true},

  // ── SALUD ──
  { id:'salud', label:'Salud', accent:'#fca5a5',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x,y+9*k);ctx.bezierCurveTo(x-12*k,y,x-12*k,y-9*k,x,y-4*k);ctx.bezierCurveTo(x+12*k,y-9*k,x+12*k,y,x,y+9*k);ctx.strokeStyle=c;ctx.lineWidth=2.2;ctx.lineJoin='round';ctx.stroke();},
    subs:[
      {id:'salud', label:'Ver sección', accent:'#fca5a5', draw:_icoTexto('👁'),
       preset:function(){ window._dialPreset={irA:'irABitacora'}; }},
      {id:'salud', label:'Cita',        accent:'#67e8f9', draw:_icoTexto('📅'),
       preset:function(){ window._dialPreset={tab:'salud',tipo:'Cita'}; }},
      {id:'salud', label:'Síntoma',     accent:'#f87171', draw:_icoTexto('🤒'),
       preset:function(){ window._dialPreset={tab:'salud',tipo:'Síntoma'}; }},
      {id:'salud', label:'Medicamento', accent:'#a78bfa', draw:_icoTexto('💊'),
       preset:function(){ window._dialPreset={tab:'salud',tipo:'Medicamento'}; }},
      {id:'salud', label:'Resultado',   accent:'#fbbf24', draw:_icoTexto('📋'),
       preset:function(){ window._dialPreset={tab:'salud',tipo:'Resultado'}; }},
      {id:'salud', label:'Vacuna',      accent:'#86efac', draw:_icoTexto('💉'),
       preset:function(){ window._dialPreset={tab:'salud',tipo:'Vacuna'}; }},
    ]},
];


// ══════════════════════════════════════════════════════════════════════
//  El dial overlay (variables, _crearDialOverlay, _reposicionarHUD,
//  drawing, animaciones, abrirDial/cerrarDial, _aplicarDialPreset, etc.)
//  vive en raw-overlay.js — se carga inmediatamente DESPUÉS de raw-core.js.
//
//  Las funciones de raw-overlay.js son globales (declaradas a nivel de
//  archivo, no en IIFE), así que el bloque de formularios de abajo puede
//  llamar a cerrarEntrada(), abrirDial(), cerrarDial(), etc. en runtime.
//
//  Variables compartidas se acceden vía window: window._dialPreset.
// ══════════════════════════════════════════════════════════════════════

function mostrarErrorConexion(msg){
  const d=document.createElement('div');
  d.style.cssText='position:fixed;top:60px;left:8px;right:8px;z-index:9999;background:#EF4444;color:#fff;padding:12px 16px;border-radius:12px;font-size:13px;font-weight:600';
  d.innerHTML='⚠ <b>Error de conexión:</b> '+msg;
  document.body.appendChild(d);
  setTimeout(()=>d.remove(),10000);
}

// ══════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════
function fmtD(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}
function fmtDiaSemana(str){
  if(!str)return'';
  const DIAS=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  const p=str.split('-'); if(p.length!==3)return str;
  const d=new Date(Number(p[0]),Number(p[1])-1,Number(p[2]));
  return DIAS[d.getDay()]+' '+p[2]+'/'+p[1];
}
function fmtMoneda(v){
  if(v===null||v===undefined||v==='')return{txt:'—',cls:'z'};
  const n=Number(v); if(isNaN(n))return{txt:'—',cls:'z'};
  if(n===0)return{txt:'$ 0',cls:'z'};
  const abs='$ '+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
  return n>0?{txt:abs,cls:'pos'}:{txt:'− '+abs,cls:'neg'};
}
function setChip(t,txt){
  ['chip','chip2'].forEach(id=>{ const c=document.getElementById(id); if(c)c.className='hero-chip '+t; });
  ['chip-txt','chip-txt2'].forEach(id=>{ const ct=document.getElementById(id); if(ct)ct.textContent=txt; });
}
function showToast(msg,ok=true){
  const t=document.getElementById('toast');
  t.className='toast '+(ok?'ok':'err');
  t.querySelector('i').className=ok?'fas fa-circle-check':'fas fa-circle-xmark';
  document.getElementById('toast-msg').textContent=msg;
  t.classList.add('show');
  clearTimeout(_toast);
  _toast=setTimeout(()=>t.classList.remove('show'),2800);
}
// v6.040: el elemento #prog (barra de progreso vieja del hero) fue
// retirado al rediseñar la barra superior en v6.010. progStart/progDone
// se vuelven a prueba de null para no lanzar TypeError — el feedback de
// "actualizando" ahora lo da el botón girando + el chip de estado.
function progStart(){const b=document.getElementById('prog');if(b)b.className='prog-bar ind';}
function progDone(){const b=document.getElementById('prog');if(!b)return;b.className='prog-bar';b.style.width='100%';setTimeout(()=>{b.style.width='0%';},400);}

// ══════════════════════════════════════════
//  ACORDEONES
// ══════════════════════════════════════════
function togKard(id){
  const el=document.getElementById(id);if(!el)return;
  const isOpen=(el.style.display!=='none' && el.style.display!=='');
  // v8.17 — fade suave al desplegar/colapsar el detalle (antes era de golpe).
  if(window.RawAnim){
    if(isOpen) window.RawAnim.ocultar(el,{dur:0.18,y:4});
    else       window.RawAnim.mostrar(el,{dur:0.22,y:4,display:'block'});
  } else {
    el.style.display=isOpen?'none':'block';
  }
}
function togSec(hdr){
  const isMob=document.documentElement.classList.contains('mob'); if(!isMob)return;
  const bodyId=hdr.id.replace('-hdr','-body');
  const body=document.getElementById(bodyId);
  const isOpen=body.classList.contains('open');
  body.classList.toggle('open',!isOpen);
  hdr.classList.toggle('open',!isOpen);
}

// ══════════════════════════════════════════
//  CAMPOS NUEVA ENTRADA
// ══════════════════════════════════════════
function activarCampo(id){
  CAMPOS.forEach(f=>{ const el=document.getElementById('cf-'+f); if(el)el.classList.remove('active'); });
  const el=document.getElementById('cf-'+id);
  if(el){ el.classList.add('active'); setTimeout(()=>{ const inp=el.querySelector('input:not([readonly])'); if(inp&&inp.type!=='date')inp.focus(); },50); }
}
function avanzarA(id){ const idx=CAMPOS.indexOf(id); if(idx<CAMPOS.length-1)activarCampo(CAMPOS[idx+1]); }
function marcarDone(id){ const el=document.getElementById('cf-'+id); if(el)el.classList.add('done'); }
function setFieldVal(id,val,empty=false){ const el=document.getElementById('cv-'+id);if(!el)return;el.textContent=val;el.classList.toggle('empty',empty); }
function onFechaChange(){ const v=document.getElementById('fecha').value; marcarDone('fecha'); }
function onClaveChange(){ const v=document.getElementById('clave').value.trim(); setFieldVal('clave',v||'Opcional',!v); }

// ══════════════════════════════════════════
//  CATÁLOGOS
// ══════════════════════════════════════════
function onCats(d){
  cats=d;
  buildOpts('sw-proyecto',d.proyectos,v=>{proxSel=v;setFieldVal('proyecto',v);marcarDone('proyecto');avanzarA('proyecto');});
  buildOpts('sw-contacto',d.contactos,v=>{contactoSel=v;setFieldVal('contacto',v);marcarDone('contacto');avanzarA('contacto');});
  buildOpts('sw-recurrencia',d.recurrencias,v=>{recSel=v;setFieldVal('recurrencia',v);marcarDone('recurrencia');avanzarA('recurrencia');});
  if(d.necesidades&&d.necesidades.length){ buildOptsNecesidad('sw-necesidad',d.necesidades,v=>{necesidadSel=v;setFieldVal('necesidad',v.slice(0,30)+'…');marcarDone('necesidad');avanzarA('necesidad');}); }
  setChip('ok','Listo');
  var chipEl=document.getElementById('chip');
  if(chipEl&&!chipEl._refreshBound){
    chipEl._refreshBound=true; chipEl.style.cursor='pointer'; chipEl.title='Click para actualizar';
    chipEl.addEventListener('click',function(){
      _actData=null; setChip('load','Cargando');
      api.getAll().then(function(d){
        if(!d.ok&&!d.catalogos){ setChip('err','Error'); return; }
        sheetUrl=d.sheetUrl||''; onCats(d.catalogos);
        if(typeof renderApartados==='function') renderApartados(d.apartados||{items:[],totalApartado:0});
        if(typeof renderEntes==='function') renderEntes(d.fijos);
        if(typeof onDatosMes==='function') onDatosMes(d.datosMes);
        if(typeof renderAnualidad==='function') renderAnualidad(d.gastos);
        if(typeof renderLogros==='function') renderLogros(d.logros);
        if(typeof renderNecesidades==='function') renderNecesidades(d.necesidades);
        if(typeof renderNecesidadesInline==='function'){ renderNecesidadesInline(d.necesidades); setTimeout(function(){ if(typeof actualizarNecInline==='function') actualizarNecInline(); },50); }
        if(typeof renderFlujoMensual==='function') renderFlujoMensual(d.flujoPorMes);
        if(d.activityCheck){ _actData=d.activityCheck; if(typeof renderActivity==='function'&&_pantalla==='activity') renderActivity(); }
        if(typeof renderFinancieroAvanzado==='function'&&d.financieroAvanzado) renderFinancieroAvanzado(d.financieroAvanzado);
        if(d.pensamientos){ window._pensamientosData=d.pensamientos; }
        if(d.relaciones){   window._relacionesData=d.relaciones; }
        if(d.salud){        window._saludData=d.salud; }
        if(d.nutricion){    window._nutData=d.nutricion; }
        if(d.entrenamiento){window._entData=d.entrenamiento; }
        if(d.patrimonio){   window._patrimonioData=d.patrimonio; }
        if(d.financieroAvanzado){ window._finData=d.financieroAvanzado; }
        setChip('ok','Listo ↺'); showToast('✓ Datos actualizados');
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();
      }).catch(function(){ setChip('err','Error'); });
    });
  }
}
function buildOptsNecesidad(id,items,cb){
  const w=document.getElementById(id);if(!w)return;w.innerHTML='';
  const COLORES=['#3B82F6','#4ADE80','#F59E0B','#EC4899','#8B5CF6'];
  items.forEach((it,i)=>{
    const b=document.createElement('button');b.className='opt';
    const m=it.match(/^(\d+)\.\s+(\w+)/);
    b.textContent=m?m[1]+'. '+m[2]:it.slice(0,20); b.title=it;
    b.style.borderColor=COLORES[i%5]+'44';
    b.onclick=e=>{e.stopPropagation();w.querySelectorAll('.opt').forEach(x=>x.classList.remove('on'));b.classList.add('on');cb(it);};
    w.appendChild(b);
  });
}
function buildOpts(id,items,cb){
  const w=document.getElementById(id);if(!w)return;w.innerHTML='';
  items.forEach(it=>{
    const b=document.createElement('button');b.className='opt';b.textContent=it;
    b.onclick=e=>{e.stopPropagation();w.querySelectorAll('.opt').forEach(x=>x.classList.remove('on'));b.classList.add('on');cb(it);};
    w.appendChild(b);
  });
}

// ══════════════════════════════════════════
//  POPUP CONCEPTO
// ══════════════════════════════════════════
function abrirConcepto(){ activarCampo('concepto'); renderConceptoPopup(''); document.getElementById('popup-concepto').classList.add('show'); setTimeout(()=>document.getElementById('pop-search').focus(),80); }
function cerrarConcepto(e){ if(e&&e.target!==document.getElementById('popup-concepto'))return; document.getElementById('popup-concepto').classList.remove('show'); document.getElementById('pop-search').value=''; }
function filtrarConcepto(){ renderConceptoPopup(document.getElementById('pop-search').value); }
function renderConceptoPopup(q){
  const items=(cats.conceptos||[]).filter(i=>!q||i.toLowerCase().includes(q.toLowerCase())).sort((a,b)=>a.localeCompare(b,'es',{sensitivity:'base'}));
  const body=document.getElementById('pop-body');
  if(!items.length){body.innerHTML='<div style="text-align:center;padding:24px;color:var(--m)">Sin resultados</div>';return;}
  const actual=document.getElementById('cv-concepto').classList.contains('empty')?'':document.getElementById('cv-concepto').textContent.trim();
  const grupos={};
  items.forEach(it=>{const l=it[0].toUpperCase().replace(/[^A-Z0-9]/,'#');if(!grupos[l])grupos[l]=[];grupos[l].push(it);});
  body.innerHTML=Object.keys(grupos).sort().map(l=>`<div class="pop-grupo-lbl">${l}</div><div class="pop-items">${grupos[l].map(it=>`<div class="pop-item${it===actual?' on':''}" onclick="selConcepto('${it.replace(/'/g,"\\'")}')">${it}</div>`).join('')}</div>`).join('');
}
function selConcepto(val){ setFieldVal('concepto',val);marcarDone('concepto'); document.getElementById('popup-concepto').classList.remove('show'); document.getElementById('pop-search').value=''; avanzarA('concepto'); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape') document.getElementById('popup-concepto').classList.remove('show'); });

// ══════════════════════════════════════════
//  MONTO
// ══════════════════════════════════════════
function setSign(s){ sign=s; document.getElementById('sbp').className='msign'+(s===1?' pos':''); document.getElementById('sbn').className='msign'+(s===-1?' neg':''); upM(); }
function upM(){
  const v=(parseFloat(document.getElementById('monto').value)||0)*sign;
  const {txt,cls}=fmtMoneda(v||null);
  document.getElementById('mprev').textContent=v===0?'$ 0.00':txt;
  document.getElementById('mprev').className='mprev'+(v>0?' pos':v<0?' neg':'');
  setFieldVal('monto',v===0?'$ 0.00':txt,v===0);
  if(v!==0)marcarDone('monto');
}

// ══════════════════════════════════════════
//  SALDO
// ══════════════════════════════════════════
// v6.073 — COMPUERTA DE ARRANQUE.
// Apps Script encola las peticiones del mismo usuario en SERIE: las
// ~8 llamadas GET del arranque (necesidades, revision, nutricion,
// flujo, saldo, notas...) se formaban delante o alrededor de getAll
// y nada pintaba hasta que toda la fila avanzara (20s+).
// Esta compuerta DIFIERE todas las lecturas secundarias hasta que la
// PRIMERA getAll resuelva: arranque = getAll solo (~2s con cache
// caliente), las cards pintan, el resto llena sus paneles despues.
// Escrituras NO se difieren. Salvavidas a 12s.
(function(){
  var DIFERIR = ['getNecesidades','getRevision','getNutricion','getFlujoPorMes',
                 'getNotas','getScoreVida','getSaldoDia','getPensamientos',
                 'getRelaciones','getSalud','getPatrimonio','getApartados',
                 'getFinancieroAvanzado','getActivityCheck','getLogros',
                 'getFijos','getGastos','getDatosMes','getEntrenamiento',
                 'getMetasNutricion','getEventuales','getAhorro','getEfectivo',
                 'getInversion'];
  var _gateAbierta = false;
  var _gateRes;
  var _gate = new Promise(function(res){ _gateRes = res; });
  function abrirGate(){ if(!_gateAbierta){ _gateAbierta = true; _gateRes(); } }
  var origGetAll = api.getAll;
  api.getAll = function(){
    var p = origGetAll.apply(this, arguments);
    if(p && typeof p.then === 'function') p.then(abrirGate, abrirGate);
    return p;
  };
  setTimeout(abrirGate, 12000);
  DIFERIR.forEach(function(fn){
    var orig = api[fn];
    if(typeof orig !== 'function') return;
    api[fn] = function(){
      var args = arguments, self = this;
      if(_gateAbierta) return orig.apply(self, args);
      return _gate.then(function(){ return orig.apply(self, args); });
    };
  });
})();

function consultarSaldo(){
  const fechaEl=document.getElementById('saldo-fecha');
  const f=fechaEl?fechaEl.value:'';
  if(!f) return Promise.resolve();
  const el=document.getElementById('saldo-val');
  if(el){el.className='saldo-val ld';el.textContent='…';}
  return api.getSaldoDia(f).then(r=>{
    if(el){el.textContent=r.display;el.className='saldo-val '+(r.valor>0?'pos':r.valor<0?'neg':'')+' updated';setTimeout(function(){el.classList.remove('updated');},500);}
  }).catch(()=>{if(el){el.className='saldo-val ld';el.textContent='—';}});
}

// ══════════════════════════════════════════
//  GUARDAR
// ══════════════════════════════════════════
function guardar(){
  const fecha=document.getElementById('fecha').value;
  const concepto=document.getElementById('cv-concepto').classList.contains('empty')?'':document.getElementById('cv-concepto').textContent.trim();
  const monto=(parseFloat(document.getElementById('monto').value)||0)*sign;
  if(_modoEditar){
    if(!_filaEditar){mostrarRes(false,'Busca un ID primero');return;}
  } else {
    const errs=[];
    if(!fecha)errs.push('Fecha');if(!proxSel)errs.push('Proyecto');if(!contactoSel)errs.push('Contacto');
    if(!concepto)errs.push('Concepto');if(monto===0)errs.push('Monto');if(!recSel)errs.push('Recurrencia');
    if(errs.length){ mostrarRes(false,'Faltan: '+errs.join(', ')); return; }
  }
  ocultarRes();progStart();setBtn(true);
  const claveVal=document.getElementById('clave').value.trim();
  const payload={fecha,proyecto:proxSel,contacto:contactoSel,concepto,monto,recurrencia:recSel,necesidad:necesidadSel,clave:claveVal};
  const promesa=_modoEditar&&_filaEditar?api.editarFilaRAW(_filaEditar,payload):api.insertarEnRAW(payload);
  promesa.then(r=>{
    progDone();setBtn(false);mostrarRes(r.ok,r.mensaje);showToast(r.ok?'✓ Guardado':'Error al guardar',r.ok);
    if(r.ok){ limpiar(false);consultarSaldo();api.getFijos().then(renderEntes);api.getGastos().then(renderAnualidad);api.getDatosMes().then(onDatosMes);setTimeout(cerrarEntrada,800); }
  }).catch(e=>{progDone();setBtn(false);mostrarRes(false,'Error: '+e.message);showToast('Error',false);});
}
function setBtn(l){ const b=document.getElementById('btnG');if(b)b.disabled=l;const sp=document.getElementById('spin');if(sp)sp.style.display=l?'block':'none';const bi=document.getElementById('bico');if(bi)bi.style.display=l?'none':'inline'; }
function mostrarRes(ok,msg){ const el=document.getElementById('save-res');document.getElementById('res-ico').textContent=ok?'✓':'✗';document.getElementById('res-msg').textContent=msg;el.className='save-res '+(ok?'ok':'err'); }
function ocultarRes(){ document.getElementById('save-res').className='save-res'; }
function limpiar(rf=true){
  if(rf){const fEl=document.getElementById('fecha');if(fEl)fEl.value=fmtD(new Date());}
  ['proyecto','contacto','recurrencia'].forEach(k=>{document.querySelectorAll(`#sw-${k} .opt`).forEach(b=>b.classList.remove('on'));setFieldVal(k,'',true);});
  proxSel='';contactoSel='';recSel='';necesidadSel='';
  document.querySelectorAll('#sw-necesidad .opt').forEach(b=>b.classList.remove('on'));setFieldVal('necesidad','',true);
  document.getElementById('monto').value='';document.getElementById('clave').value='';
  setFieldVal('concepto','',true);setFieldVal('monto','$ 0.00',true);setFieldVal('clave','',true);
  CAMPOS.forEach(f=>{const e=document.getElementById('cf-'+f);if(e)e.classList.remove('done');});
  setSign(1);upM();ocultarRes();activarCampo('fecha');
}
function irASheet(){ var url=sheetUrl||'https://docs.google.com/spreadsheets/d/15T14Hb7tvmv24ZAaC3su1NRtDwVS6-dWbJGxQYUGP1o/edit';window.open(url,'_blank'); }

// ══════════════════════════════════════════
//  SHEETS EMBED
// ══════════════════════════════════════════
const SHEETS_CONFIG=[{id:'raw',label:'RAW',emoji:'📄',gid:'0',spreadsheetId:'15T14Hb7tvmv24ZAaC3su1NRtDwVS6-dWbJGxQYUGP1o'}];

/* ═══════════════════════════════════════════════════════
   NAVEGACIÓN
═══════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════
   ROUTER DE CAPAS v6.020 — _osMostrar()
   ───────────────────────────────────────────────────────────────────
   La app v6 es una sola escena persistente. El router gobierna QUÉ
   capa se ve bajo la barra superior fija:

     · 'home'  → el overlay (dial + cards + fondo cósmico). Es la cara
                 base de la app. Equivale a abrirDial() — sin recons-
                 trucción ni re-animación (v6.000 ya lo garantiza).
     · resto   → la .board-face de esa sección (Logros, Bitácora,
                 Activity, Nutrición, RAW/Sheets). El overlay se oculta
                 con fade vía cerrarDial(); el fondo cósmico sigue vivo
                 detrás. Navegar es solo un cross-fade.

   Las capas se PAUSAN, no se destruyen: una .board-face oculta
   conserva su DOM y su estado. Solo el botón Actualizar refresca datos.

   Las funciones irALogros / irABitacora / irAActivity / irANutricion /
   irASheets / volverAlAnverso son envoltorios delgados sobre este
   router (cada una hace su carga de datos y delega la navegación aquí).
═══════════════════════════════════════════════════════════════════ */
var _panelActual = 'anverso';     // compat: 'anverso' == home
window._osSeccion = 'home';       // sección lógica actual del router

// Mapa sección → { boardId, tabId }
var _OS_SECCIONES = {
  home:      { board:null,             tab:'btn-home'      },
  logros:    { board:'board-logros',   tab:'btn-logros'    },
  bitacora:  { board:'board-bitacora', tab:'btn-maslow'    },
  activity:  { board:'board-activity', tab:'btn-activity'  },
  nutricion: { board:'board-nutricion',tab:'btn-nutricion' },
  notas:     { board:'board-notas',    tab:'btn-notas'     },
  timers:    { board:'board-timers',   tab:'btn-timers'    },
  sos:       { board:'board-sos',      tab:'btn-sos'       },
  sheets:    { board:'board-sheets',   tab:'btn-sheets'    }
};
// Mapa sección → data-tab de la tabbar móvil legacy
var _OS_MOBTAB = {
  home:'entrada', logros:'logros', bitacora:'bitacora',
  activity:'activity', nutricion:'nutricion', notas:'entrada', sos:'entrada', sheets:'entrada'
};

function _osMarcarTabs(seccion){
  // Tabs de la barra superior: limpiar 'active'/'on', marcar el activo.
  document.querySelectorAll('.hud-tab, .btn-flip').forEach(function(b){
    b.classList.remove('active','on');
  });
  var info = _OS_SECCIONES[seccion];
  var tabEl = info && document.getElementById(info.tab);
  if(tabEl) tabEl.classList.add(seccion==='home' ? 'active' : 'active');
  // Tabbar móvil legacy
  var mt = _OS_MOBTAB[seccion] || 'entrada';
  document.querySelectorAll('.mob-tab').forEach(function(t){
    t.classList.toggle('active', t.dataset.tab===mt);
  });
}

/* Router principal */
function _osMostrar(seccion){
  if(!_OS_SECCIONES[seccion]) seccion = 'home';
  window._osSeccion = seccion;
  _panelActual = (seccion==='home') ? 'anverso' : _OS_SECCIONES[seccion].board;

  // v8.29 — FIX RAW trabado: si el router muestra una sección que NO es RAW,
  // limpiar _pantalla. Antes quedaba en 'sheets_raw' al salir de RAW, y la
  // navegación por flechas seguía creyendo que estabas en RAW → trabado.
  if(seccion !== 'raw' && typeof window._pantalla === 'string' &&
     window._pantalla.indexOf('sheets_') === 0){
    if(typeof _setPantalla === 'function') _setPantalla(seccion === 'home' ? 'anverso' : seccion);
    else window._pantalla = (seccion === 'home') ? 'anverso' : seccion;
  }

  // v8.6 — Marca en <html> si estamos en una sección de nivel 2 (no-home).
  // Una regla CSS usa 'os-seccion' para ocultar TODOS los hud-pnl (USER,
  // barra Sim, cards, barra inferior) mientras una board-face está activa.
  // Antes cerrarDial solo les ponía opacity:0 (no display) → reaparecían
  // encima de la sección (p.ej. USER sobre Timers, empujando el contenido).
  if(seccion === 'home'){
    document.documentElement.classList.remove('os-seccion');
  } else {
    document.documentElement.classList.add('os-seccion');
  }

  var board = document.getElementById('board-anverso');

  if(seccion === 'home'){
    // ── HOME = overlay (dial + cards + fondo) ──
    // Ocultar todas las board-face de sección con fade.
    document.querySelectorAll('.board-face:not(.anverso)').forEach(function(f){
      f.classList.remove('active');
    });
    // Resetear inline-styles que board-activity se pone al renderizar.
    var bAct = document.getElementById('board-activity');
    if(bAct){
      bAct.style.position = '';
      bAct.style.top = bAct.style.left = bAct.style.right = bAct.style.bottom = '';
      bAct.style.zIndex = '';
      bAct.style.height = bAct.style.maxHeight = '';
      bAct.style.display = '';
    }
    // El board-anverso permanece oculto: en v6 las cards reales son los
    // paneles HUD del overlay. Se mantiene en el DOM (se retira en v6.050).
    // v6.030: en móvil el board-anverso SÍ se muestra — contiene el
    // carrusel del Home. El carrusel se encarga de que el slide del dial
    // sea un hueco transparente sobre el overlay.
    if(board){
      if(window._osCarouselActivo && window._osCarouselActivo()){
        board.classList.remove('slide-right');
        board.style.display = '';   // v6.032: quitar el display:none de origen
      } else {
        board.classList.add('slide-right');
      }
    }
    // Mostrar el overlay (sin reconstrucción — v6.000).
    if(typeof abrirDial === 'function' && !window._dialVisible){
      abrirDial();
    }
    // v8.2 — HOME ES SIEMPRE NIVEL 0. Forzar la clase niv-0 y reposicionar
    // AQUÍ, pase lo que pase con abrirDial (que solo corre si el dial no
    // estaba visible). Cuando se llega a HOME desde una sección vía flechas,
    // abrirDial NO se ejecuta → la clase podía seguir en niv-2 → las cards
    // laterales NO se purgaban y reaparecían. Forzar niv-0 + reposicionar
    // garantiza que _reposicionarHUD oculte las laterales en HOME.
    document.documentElement.classList.remove('niv-1','niv-2','niv-warp');
    document.documentElement.classList.add('niv-0');
    if(typeof window._reposicionarHUD === 'function'){
      requestAnimationFrame(function(){ window._reposicionarHUD(); });
    }
    // v6.030: en móvil, HOME hace snap al slide del dial del carrusel.
    if(window._osCarouselHome) window._osCarouselHome();
    var dd = document.getElementById('entrada-dropdown');
    if(dd){ dd.classList.remove('show'); dd.style.display='none'; }
  } else {
    // ── SECCIÓN = una board-face a pantalla casi completa ──
    // Cerrar el overlay con su fade (el fondo cósmico sigue vivo).
    if(typeof cerrarDial === 'function' && window._dialVisible){
      cerrarDial();
    }
    if(board){ board.classList.add('slide-right'); }
    // Mostrar solo la board-face destino.
    document.querySelectorAll('.board-face:not(.anverso)').forEach(function(f){
      f.classList.remove('active');
    });
    var dest = document.getElementById(_OS_SECCIONES[seccion].board);
    if(dest){ dest.classList.add('active'); dest.scrollTop = 0; }
  }

  _osMarcarTabs(seccion);
}
window._osMostrar = _osMostrar;

/* Compat: _irAPanel se mantiene como envoltorio sobre el router para
   no romper llamadas existentes (p.ej. irASheets). */
function _irAPanel(boardId, tabKey){
  var sec = 'home';
  Object.keys(_OS_SECCIONES).forEach(function(k){
    if(_OS_SECCIONES[k].board === boardId) sec = k;
  });
  // Toggle: si ya estás en esa sección, volver a Home.
  if(sec !== 'home' && window._osSeccion === sec){ _osMostrar('home'); return; }
  _osMostrar(sec);
}

window.volverAlAnverso = function(){
  _osMostrar('home');
};

window.irABitacora = function(){
  // Toggle: si ya estás en Bitácora, volver a Home.
  if(window._osSeccion === 'bitacora'){ _osMostrar('home'); return; }
  _osMostrar('bitacora');
};

window.irAActivity = function(){
  // Toggle: si ya estás en Activity, volver a Home.
  if(window._osSeccion === 'activity'){ _osMostrar('home'); return; }
  _osMostrar('activity');
  function _doRenderActivity(){
    if(typeof window.renderActivity==='function') window.renderActivity();
  }
  if(window._actData){
    _doRenderActivity();
  } else {
    var cont = document.getElementById('act-container');
    if(cont) cont.innerHTML='<div style="padding:40px;text-align:center;color:rgba(255,255,255,.25)"><i class="fas fa-circle-notch fa-spin" style="font-size:18px;color:#22d3ee"></i></div>';
    if(typeof api!=='undefined'){
      api.getActivityCheck().then(function(d){
        window._actData = d;
        _doRenderActivity();
      }).catch(function(){
        if(cont) cont.innerHTML='<div style="padding:40px;text-align:center;color:rgba(239,68,68,.4);font-size:12px">Error al cargar Activity</div>';
      });
    }
  }
};
window.irANutricion = function(){
  // Toggle: si ya estás en Nutrición, volver a Home.
  if(window._osSeccion === 'nutricion'){ _osMostrar('home'); return; }
  _osMostrar('nutricion');
  // Render INMEDIATO del layout completo (vacío) — luego se llena con datos
  _renderNutLayoutCompleto(null);
  if(typeof api!=='undefined'){
    api.getNutricion().then(function(d){
      window._nutData=d;
      _renderNutLayoutCompleto(d);
    }).catch(function(){
      _renderNutLayoutCompleto(null);
    });
  }
};

// v8.13 — NAVEGACIÓN AL COVERFLOW (nivel 1). A diferencia de las secciones
// de nivel 2 (que usan _osMostrar), las cards del coverflow se centran con
// window._hudExpand(panelEl). Esta función baja al nivel 1 y centra la card
// indicada por su id (p.ej. 'hud-patrimonio'). Usada por los subanillos
// "Ver" de los gajos Patrimonio/Bancos/Apartado.
window.irACoverflow = function(cardId){
  // Si estamos en una sección de nivel 2, primero volver a Home (dial/nivel 0)
  // para que el contexto del coverflow exista.
  if(window._osSeccion && window._osSeccion !== 'home'){
    if(typeof _osMostrar === 'function') _osMostrar('home');
  }
  var card = document.getElementById(cardId);
  if(card && typeof window._hudExpand === 'function'){
    // Pequeño defer: si acabamos de volver a Home, dar un frame para que el
    // overlay del dial quede montado antes de expandir la card.
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        window._hudExpand(card);
      });
    });
  }
};


// v6.069 — NOTAS. Sección de sticky notes 5×5. El módulo raw-notas.js
// monta y gestiona todo; aquí solo se enruta y se le pide montar.
window.irANotas = function(){
  // Toggle: si ya estás en Notas, volver a Home.
  if(window._osSeccion === 'notas'){ _osMostrar('home'); return; }
  _osMostrar('notas');
  if(typeof window._notasMontar === 'function') window._notasMontar();
};

// v8.5 — TIMERS. Sección de cronómetros. El módulo raw-timers.js monta y
// gestiona todo; aquí solo se enruta y se le pide montar/cargar.
window.irATimers = function(){
  if(window._osSeccion === 'timers'){ _osMostrar('home'); return; }
  _osMostrar('timers');
  if(typeof window._timersAlEntrar === 'function') window._timersAlEntrar();
};

// v8.30 — SOS. Sección de emergencia con varios tipos de alerta. Reemplaza
// al botón único de antes: ahora es una sección navegable (con las flechas
// ←/→ como carrusel entre los tipos). El botón SOS de la barra abre aquí.
window.irASOS = function(){
  if(window._osSeccion === 'sos'){ _osMostrar('home'); return; }
  _osMostrar('sos');
  if(typeof window._montarSOS === 'function') window._montarSOS();
};

// Tipos de SOS disponibles. Cada uno con su mensaje y color. Se navegan
// como carrusel dentro de la sección.
window._SOS_TIPOS = [
  { id:'general',  label:'Ayuda general',   icono:'fa-circle-exclamation', color:'#EF4444',
    mensaje:'🚨 Necesito ayuda — enviado desde RAW Entry' },
  { id:'medica',   label:'Emergencia médica', icono:'fa-kit-medical',      color:'#F87171',
    mensaje:'🚑 Emergencia médica — necesito asistencia' },
  { id:'seguridad',label:'Seguridad',        icono:'fa-shield-halved',     color:'#FB923C',
    mensaje:'⚠️ Me siento en peligro — por favor contáctame' },
  { id:'recoger',  label:'Recógeme',         icono:'fa-car',               color:'#67E8F9',
    mensaje:'🚗 ¿Pueden venir por mí? Comparto mi ubicación' },
  { id:'llamada',  label:'Llámame ya',       icono:'fa-phone-volume',      color:'#C4B5FD',
    mensaje:'📞 Necesito que me llamen lo antes posible' }
];
window._sosIdx = 0;

window._montarSOS = function(){
  var board = document.getElementById('board-sos');
  if(!board) return;
  board.innerHTML =
    '<div class="sos-wrap">'+
      '<div class="sos-header">'+
        '<div class="sos-header-l">'+
          '<i class="fas fa-tower-broadcast sos-header-ico"></i>'+
          '<div>'+
            '<div class="sos-header-t">CENTRO SOS</div>'+
            '<div class="sos-header-s">Elige el tipo de alerta que necesitas enviar</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="sos-grid" id="sos-grid"></div>'+
      '<div class="sos-msg" id="sos-msg"></div>'+
    '</div>';
  _sosInyectarCSS();
  window._sosRender();
};

window._sosRender = function(){
  var tipos = window._SOS_TIPOS;
  var grid = document.getElementById('sos-grid');
  if(!grid) return;
  // TABLERO: todas las tarjetas visibles a la vez. Cada una envía su alerta.
  grid.innerHTML = tipos.map(function(t, i){
    return ''+
      '<button class="sos-card" style="--sos-acc:'+t.color+'" onclick="window._sosEnviar('+i+')">'+
        '<div class="sos-card-ico"><i class="fas '+t.icono+'"></i></div>'+
        '<div class="sos-card-label">'+t.label+'</div>'+
        '<div class="sos-card-msg">'+t.mensaje+'</div>'+
        '<div class="sos-card-cta"><i class="fas fa-paper-plane"></i> Enviar</div>'+
      '</button>';
  }).join('');
};

window._sosEnviar = function(idx){
  var t = window._SOS_TIPOS[idx];
  if(!t) return;
  var msgEl = document.getElementById('sos-msg');
  if(msgEl){ msgEl.textContent = 'Enviando '+t.label+'…'; msgEl.className = 'sos-msg activa'; }
  function done(ubicacion){
    if(typeof api !== 'undefined' && api.enviarSOS){
      api.enviarSOS({mensaje:t.mensaje, ubicacion:ubicacion}).then(function(r){
        if(msgEl){
          msgEl.textContent = r.ok ? ('✓ Enviado a '+r.enviados+' contacto(s)') : ('Error: '+r.mensaje);
          msgEl.className = 'sos-msg ' + (r.ok?'ok':'err');
        }
        if(typeof showToast==='function') showToast(r.ok?'🚨 SOS enviado':'Error al enviar SOS', r.ok);
      }).catch(function(){
        if(msgEl){ msgEl.textContent='Error al enviar'; msgEl.className='sos-msg err'; }
      });
    }
  }
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(
      function(pos){ done('https://maps.google.com/?q='+pos.coords.latitude+','+pos.coords.longitude); },
      function(){ done(''); },
      {enableHighAccuracy:true,timeout:15000,maximumAge:0});
  } else done('');
};

function _sosInyectarCSS(){
  if(document.getElementById('sos-styles')) return;
  var st = document.createElement('style');
  st.id = 'sos-styles';
  st.textContent = [
    '.sos-wrap{display:flex;flex-direction:column;height:100%;padding:var(--sp-6);gap:var(--sp-5);box-sizing:border-box}',
    '.sos-header{display:flex;align-items:center;justify-content:space-between;flex-shrink:0}',
    '.sos-header-l{display:flex;align-items:center;gap:var(--sp-3)}',
    '.sos-header-ico{font-size:22px;color:#EF4444;filter:drop-shadow(0 0 8px rgba(239,68,68,.5))}',
    '.sos-header-t{font-size:var(--fs-lg);font-weight:var(--fw-bold);letter-spacing:.18em;color:var(--hud-text)}',
    '.sos-header-s{font-size:var(--fs-xs);color:var(--hud-text-dim);letter-spacing:var(--ls-title);margin-top:2px}',
    '.sos-carrusel{flex:1;display:flex;align-items:center;justify-content:center;min-height:0}',
    '.sos-grid{flex:1;display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:var(--sp-4);'+
      'align-content:start;overflow-y:auto;min-height:0;padding:2px}',
    '.sos-card{border:1px solid color-mix(in srgb,var(--sos-acc) 45%,transparent);'+
      'background:radial-gradient(circle at 50% 0%,color-mix(in srgb,var(--sos-acc) 10%,transparent),var(--hud-panel-bg));'+
      'border-radius:var(--rad-lg);padding:var(--sp-5) var(--sp-4);display:flex;flex-direction:column;'+
      'align-items:center;gap:var(--sp-3);box-shadow:var(--hud-shadow);cursor:pointer;'+
      'font-family:var(--font-ui);text-align:center;transition:transform .12s,box-shadow .12s,border-color .12s}',
    '.sos-card:hover{transform:translateY(-2px);border-color:var(--sos-acc);'+
      'box-shadow:0 0 32px color-mix(in srgb,var(--sos-acc) 30%,transparent),var(--hud-shadow)}',
    '.sos-card:active{transform:translateY(0)}',
    '.sos-card-ico{width:56px;height:56px;border-radius:var(--rad-pill);display:flex;align-items:center;justify-content:center;'+
      'background:color-mix(in srgb,var(--sos-acc) 15%,transparent);border:2px solid var(--sos-acc);'+
      'font-size:24px;color:var(--sos-acc);box-shadow:0 0 20px color-mix(in srgb,var(--sos-acc) 35%,transparent)}',
    '.sos-card-label{font-size:var(--fs-base);font-weight:var(--fw-bold);color:var(--hud-text);letter-spacing:.03em}',
    '.sos-card-msg{font-size:var(--fs-xs);color:var(--hud-text-mid);line-height:1.35}',
    '.sos-card-cta{margin-top:var(--sp-2);padding:8px 18px;border-radius:var(--rad-card);'+
      'background:var(--sos-acc);color:#0a0a12;font-size:var(--fs-xs);font-weight:var(--fw-bold);letter-spacing:.06em;'+
      'text-transform:uppercase;display:flex;align-items:center;gap:6px}',
    '.sos-msg{text-align:center;font-size:var(--fs-sm);min-height:18px;flex-shrink:0;transition:color .2s}',
    '.sos-msg.activa{color:var(--hud-text-dim)}',
    '.sos-msg.ok{color:var(--hud-ok)}',
    '.sos-msg.err{color:var(--hud-err)}'
  ].join('');
  document.head.appendChild(st);
}


// Layout completo de Nutrición: SIEMPRE muestra todos los componentes (KPIs, macros, agua, semana, items)
window._renderNutLayoutCompleto = window._renderNutLayoutCompleto || function(d){
  var body = document.getElementById('nut-panel-body');
  if(!body) return;

  // Extraer datos con fallback a cero
  var hoy   = (d && d.hoy) || {};
  var meta  = (d && d.metas) || { calorias:1800, proteina:150, carbos:180, grasa:60, agua:2.5 };
  var calH  = hoy.calorias  || hoy.cal      || 0;
  var protH = hoy.proteina  || hoy.prot     || 0;
  var carbH = hoy.carbos    || 0;
  var grasH = hoy.grasa     || 0;
  var aguaH = hoy.agua      || 0;
  var fastH = hoy.fasting   || hoy.ayuno    || 0;

  function kpiCard(label, val, metaVal, color, unidad, icon){
    var pct = metaVal>0 ? Math.min(100, Math.round((val/metaVal)*100)) : 0;
    return '<div style="background:rgba(14,8,28,0.92);border:1px solid rgba(140,100,220,0.18);border-radius:12px;padding:14px 16px;'+
      'box-shadow:0 4px 16px rgba(0,0,0,.35)">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
        '<i class="fas '+icon+'" style="font-size:14px;color:'+color+';filter:drop-shadow(0 0 6px '+color+'66)"></i>'+
        '<span style="font-size:10px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45);text-transform:uppercase">'+label+'</span>'+
      '</div>'+
      '<div style="display:flex;align-items:baseline;gap:6px;margin-bottom:8px">'+
        '<span style="font-size:24px;font-weight:800;color:'+color+';font-variant-numeric:tabular-nums;line-height:1">'+val+'</span>'+
        '<span style="font-size:11px;color:rgba(200,208,230,0.40);font-weight:600">/ '+metaVal+' '+unidad+'</span>'+
      '</div>'+
      '<div style="height:4px;background:rgba(6,4,14,0.8);border-radius:2px;overflow:hidden;margin-bottom:4px">'+
        '<div style="height:100%;width:'+pct+'%;background:'+color+';box-shadow:0 0 6px '+color+'80;border-radius:2px;transition:width .8s"></div>'+
      '</div>'+
      '<div style="font-size:10px;color:rgba(200,208,230,0.35);text-align:right;font-variant-numeric:tabular-nums">'+pct+'%</div>'+
    '</div>';
  }

  // Header con fecha de hoy
  var fechaHoy = new Date();
  var fechaStr = String(fechaHoy.getDate()).padStart(2,'0')+'/'+String(fechaHoy.getMonth()+1).padStart(2,'0')+'/'+fechaHoy.getFullYear();
  var lbl = document.getElementById('nut-fecha-lbl');
  if(lbl) lbl.textContent = 'Hoy · '+fechaStr;

  // Macros barra horizontal
  var totalMacros = protH + carbH + grasH;
  var protPct = totalMacros>0 ? Math.round(protH*4/((protH*4+carbH*4+grasH*9))*100) : 33;
  var carbPct = totalMacros>0 ? Math.round(carbH*4/((protH*4+carbH*4+grasH*9))*100) : 34;
  var grasPct = totalMacros>0 ? 100-protPct-carbPct : 33;

  // Mini grid de los últimos 7 días
  var semana = (d && d.semana) || [];
  if(!semana.length){
    semana = [];
    for(var i=6;i>=0;i--){
      var fc = new Date(); fc.setDate(fc.getDate()-i);
      semana.push({ fecha: String(fc.getDate()).padStart(2,'0')+'/'+String(fc.getMonth()+1).padStart(2,'0'),
                    calorias: 0, items: [] });
    }
  }
  var maxCal = Math.max.apply(null, semana.map(function(d){ return d.calorias||0; }).concat([meta.calorias||1800]));

  // Items de hoy (si hay)
  var itemsHoy = (d && d.items) || (hoy.items) || [];

  body.innerHTML =
    '<div style="padding:16px 20px;display:flex;flex-direction:column;gap:14px">'+

      // Fila 1: 4 KPIs principales (calorías, proteína, carbos, grasa)
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px">'+
        kpiCard('Calorías',  Math.round(calH),  meta.calorias,  '#F97316', 'kcal', 'fa-fire')+
        kpiCard('Proteína',  Math.round(protH), meta.proteina,  '#EF4444', 'g',    'fa-drumstick-bite')+
        kpiCard('Carbos',    Math.round(carbH), meta.carbos,    '#FBBF24', 'g',    'fa-wheat-awn')+
        kpiCard('Grasa',     Math.round(grasH), meta.grasa,     '#A855F7', 'g',    'fa-droplet')+
      '</div>'+

      // Fila 2: Distribución macros + Agua + Ayuno
      '<div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:10px">'+

        // Macros pie
        '<div style="background:rgba(14,8,28,0.92);border:1px solid rgba(140,100,220,0.18);border-radius:12px;padding:14px 16px">'+
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
            '<i class="fas fa-chart-pie" style="font-size:14px;color:#A78BFA"></i>'+
            '<span style="font-size:10px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45);text-transform:uppercase">Distribución macros</span>'+
          '</div>'+
          '<div style="display:flex;height:24px;border-radius:6px;overflow:hidden;background:rgba(6,4,14,0.8);margin-bottom:10px">'+
            '<div style="width:'+protPct+'%;background:#EF4444;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;'+
                 (totalMacros===0?'opacity:0.3':'')+'">'+(totalMacros===0?'':protPct+'%')+'</div>'+
            '<div style="width:'+carbPct+'%;background:#FBBF24;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;'+
                 (totalMacros===0?'opacity:0.3':'')+'">'+(totalMacros===0?'':carbPct+'%')+'</div>'+
            '<div style="width:'+grasPct+'%;background:#A855F7;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;'+
                 (totalMacros===0?'opacity:0.3':'')+'">'+(totalMacros===0?'':grasPct+'%')+'</div>'+
          '</div>'+
          '<div style="display:flex;justify-content:space-around;font-size:10px;color:rgba(200,208,230,0.55)">'+
            '<div><span style="color:#EF4444;font-weight:700">●</span> Proteína</div>'+
            '<div><span style="color:#FBBF24;font-weight:700">●</span> Carbos</div>'+
            '<div><span style="color:#A855F7;font-weight:700">●</span> Grasa</div>'+
          '</div>'+
        '</div>'+

        // Agua
        '<div style="background:rgba(14,8,28,0.92);border:1px solid rgba(34,211,238,0.25);border-radius:12px;padding:14px 16px">'+
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
            '<i class="fas fa-glass-water" style="font-size:14px;color:#22D3EE;filter:drop-shadow(0 0 6px rgba(34,211,238,.5))"></i>'+
            '<span style="font-size:10px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45);text-transform:uppercase">Agua</span>'+
          '</div>'+
          '<div style="font-size:24px;font-weight:800;color:#22D3EE;font-variant-numeric:tabular-nums;line-height:1;margin-bottom:4px">'+
            aguaH.toFixed(1)+'<span style="font-size:11px;color:rgba(200,208,230,0.40);font-weight:600;margin-left:4px">/ '+meta.agua+' L</span>'+
          '</div>'+
          '<div style="height:4px;background:rgba(6,4,14,0.8);border-radius:2px;overflow:hidden">'+
            '<div style="height:100%;width:'+(meta.agua>0?Math.min(100,Math.round(aguaH/meta.agua*100)):0)+'%;background:#22D3EE;box-shadow:0 0 6px #22D3EE80;border-radius:2px"></div>'+
          '</div>'+
        '</div>'+

        // Ayuno
        '<div style="background:rgba(14,8,28,0.92);border:1px solid rgba(168,85,247,0.25);border-radius:12px;padding:14px 16px">'+
          '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
            '<i class="fas fa-clock" style="font-size:14px;color:#A855F7"></i>'+
            '<span style="font-size:10px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45);text-transform:uppercase">Ayuno</span>'+
          '</div>'+
          '<div style="font-size:24px;font-weight:800;color:#A855F7;font-variant-numeric:tabular-nums;line-height:1;margin-bottom:4px">'+
            fastH+'<span style="font-size:11px;color:rgba(200,208,230,0.40);font-weight:600;margin-left:4px">h</span>'+
          '</div>'+
          '<div style="font-size:10px;color:rgba(200,208,230,0.35)">'+
            (fastH>=16?'✓ Ayuno largo':fastH>=12?'Ayuno moderado':fastH>0?'Ayuno corto':'Sin registro')+
          '</div>'+
        '</div>'+

      '</div>'+

      // Fila 3: Tendencia 7 días
      '<div style="background:rgba(14,8,28,0.92);border:1px solid rgba(140,100,220,0.18);border-radius:12px;padding:14px 16px">'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">'+
          '<i class="fas fa-chart-line" style="font-size:14px;color:#4ADE80"></i>'+
          '<span style="font-size:10px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45);text-transform:uppercase">Calorías últimos 7 días</span>'+
          '<span style="margin-left:auto;font-size:11px;color:rgba(200,208,230,0.40)">Meta: '+meta.calorias+' kcal</span>'+
        '</div>'+
        '<div style="display:flex;align-items:flex-end;gap:6px;height:80px">'+
        semana.map(function(dia){
          var h = maxCal>0 ? Math.max(2, Math.round((dia.calorias||0)/maxCal*72)) : 2;
          var col = (dia.calorias||0) >= meta.calorias*0.8 ? '#4ADE80' : (dia.calorias||0) >= meta.calorias*0.5 ? '#FBBF24' : 'rgba(140,100,220,0.25)';
          return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">'+
            '<div style="font-size:10px;font-weight:700;color:'+col+';font-variant-numeric:tabular-nums">'+Math.round(dia.calorias||0)+'</div>'+
            '<div style="width:100%;height:'+h+'px;background:'+col+';border-radius:3px 3px 0 0;box-shadow:0 0 4px '+col+'66;min-height:2px"></div>'+
            '<div style="font-size:9px;color:rgba(200,208,230,0.40);font-weight:600">'+dia.fecha+'</div>'+
          '</div>';
        }).join('')+
        '</div>'+
      '</div>'+

      // Fila 4: Items de hoy
      '<div style="background:rgba(14,8,28,0.92);border:1px solid rgba(140,100,220,0.18);border-radius:12px;padding:14px 16px">'+
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">'+
          '<i class="fas fa-utensils" style="font-size:14px;color:#FB923C"></i>'+
          '<span style="font-size:10px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45);text-transform:uppercase">Comidas de hoy</span>'+
          '<span style="margin-left:auto;font-size:11px;color:rgba(200,208,230,0.40)">'+itemsHoy.length+' registro'+(itemsHoy.length===1?'':'s')+'</span>'+
        '</div>'+
        (itemsHoy.length===0
          ? '<div style="padding:24px;text-align:center;color:rgba(200,208,230,0.30);font-size:12px">'+
              '<i class="fas fa-leaf" style="font-size:24px;color:rgba(74,222,128,0.25);margin-bottom:8px;display:block"></i>'+
              'Aún no has registrado comidas hoy.<br><span style="font-size:10px;color:rgba(200,208,230,0.20)">Toca "+ Agregar" arriba para registrar tu primera comida.</span>'+
            '</div>'
          : itemsHoy.map(function(it){
              return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(140,100,220,0.10)">'+
                '<span style="font-size:9px;font-weight:700;padding:3px 8px;border-radius:4px;background:rgba(74,222,128,0.10);border:1px solid rgba(74,222,128,0.25);color:#4ADE80;text-transform:uppercase;letter-spacing:.06em;flex-shrink:0">'+(it.momento||'—')+'</span>'+
                '<span style="flex:1;font-size:13px;color:rgba(220,220,240,0.90);font-weight:500">'+(it.comida||it.alimento||'—')+'</span>'+
                (it.calorias||it.cal?'<span style="font-size:11px;font-weight:700;color:#F97316;flex-shrink:0">'+Math.round(it.calorias||it.cal)+' kcal</span>':'')+
              '</div>';
            }).join('')
        )+
      '</div>'+

    '</div>';
};

/* v6.061: _syncMobTab ELIMINADO. Sincronizaba la barra de tabs inferior
   móvil (mob-tabbar), retirada en v6.050. La navegación móvil vive en
   la barra superior fija; el router _osMostrar ya marca los tabs. */

function irASheets(sheetId){
  sheetId=sheetId||'raw';
  if(typeof _setPantalla==='function'){
    if(_pantalla==='sheets_'+sheetId){volverAlAnverso();return;}
    _setPantalla('sheets_'+sheetId);
  } else {
    _irAPanel('board-sheets','sheets');
  }
  const cfg=SHEETS_CONFIG.find(s=>s.id===sheetId); if(!cfg)return;
  const cont=document.getElementById('sheets-iframe-cont');
  if(cont){ var embedUrl='https://docs.google.com/spreadsheets/d/'+cfg.spreadsheetId+'/htmlview?gid='+cfg.gid+'&widget=true';cont.innerHTML='<iframe src="'+embedUrl+'" style="width:100%;height:100%;border:none;display:block" allowfullscreen scrolling="yes"></iframe>'; }
  const lbl=document.getElementById('sheets-panel-label'); if(lbl)lbl.textContent=cfg.emoji+' '+cfg.label;
  const btn=document.getElementById('sheets-open-btn'); if(btn)btn.href=`https://docs.google.com/spreadsheets/d/${cfg.spreadsheetId}/edit#gid=${cfg.gid}`;
}

// ══════════════════════════════════════════
//  MODO NUEVA / EDITAR (paso 2)
// ══════════════════════════════════════════
function _inyectarToggleModo(){
  if(document.getElementById('toggle-modo-wrap'))return;
  if(!document.getElementById('form-hud-styles')){
    var fs = document.createElement('style');
    fs.id = 'form-hud-styles';
    fs.textContent = [
      '@keyframes formBreath{',
        '0%,100%{box-shadow:0 0 0 1px rgba(140,100,220,0.20),0 0 30px rgba(139,92,246,0.12),0 0 60px rgba(139,92,246,0.06),0 24px 80px rgba(0,0,0,0.85);}',
        '33%{box-shadow:0 0 0 1px rgba(167,139,250,0.45),0 0 40px rgba(139,92,246,0.30),0 0 80px rgba(139,92,246,0.14),0 24px 80px rgba(0,0,0,0.90);}',
        '66%{box-shadow:0 0 0 1px rgba(34,211,238,0.30),0 0 35px rgba(34,211,238,0.18),0 0 70px rgba(34,211,238,0.08),0 24px 80px rgba(0,0,0,0.90);}',
      '}',
      '@keyframes formBorderGlow{',
        '0%,100%{background:linear-gradient(90deg,#7C3AED,#A855F7,#22D3EE);box-shadow:0 0 12px rgba(139,92,246,0.7),0 0 24px rgba(139,92,246,0.3);}',
        '33%{background:linear-gradient(90deg,#A855F7,#22D3EE,#4ADE80);box-shadow:0 0 12px rgba(34,211,238,0.7),0 0 24px rgba(34,211,238,0.3);}',
        '66%{background:linear-gradient(90deg,#22D3EE,#7C3AED,#A855F7);box-shadow:0 0 12px rgba(167,139,250,0.7),0 0 24px rgba(167,139,250,0.3);}',
      '}',
      '@keyframes formScan{0%{top:-2px;opacity:0}3%{opacity:0.6}97%{opacity:0.6}100%{top:100%;opacity:0}}',
      '#sec-entrada{background:rgba(10,7,22,0.97)!important;border:1px solid rgba(140,100,220,0.25)!important;border-radius:16px!important;backdrop-filter:blur(28px) saturate(180%)!important;-webkit-backdrop-filter:blur(28px) saturate(180%)!important;background-image:linear-gradient(rgba(120,80,200,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.018) 1px,transparent 1px)!important;background-size:32px 32px!important;width:440px!important;max-width:96vw!important;animation:formBreath 4s ease-in-out infinite!important;position:relative!important;overflow:hidden!important;}',
      '#sec-entrada::after{content:"";position:absolute;left:0;right:0;height:2px;pointer-events:none;z-index:10;background:linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.4),transparent);animation:formScan 6s linear infinite;}',
      '#entrada-paso2-header{display:flex;align-items:center;gap:12px;padding:16px 20px 14px;border-bottom:1px solid rgba(140,100,220,0.18);background:rgba(18,10,36,0.8);position:relative;overflow:hidden;}',
      '#entrada-paso2-header::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;animation:formBorderGlow 4s ease-in-out infinite;}',
      '#entrada-paso2-titulo{font-size:14px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#C4B5FD;text-shadow:0 0 12px rgba(139,92,246,0.5);flex:1;}',
      '#toggle-modo-wrap{display:flex;gap:2px;padding:10px 16px 0;border-bottom:1px solid rgba(140,100,220,0.12);background:rgba(10,6,22,0.5);overflow-x:auto;}',
      '#toggle-modo-wrap::-webkit-scrollbar{display:none}',
      '.tab-entrada{padding:6px 12px;border:none;border-radius:8px 8px 0 0;background:transparent;color:rgba(200,208,230,0.40);font-family:inherit;font-size:11px;font-weight:600;letter-spacing:.06em;cursor:pointer;transition:all .15s;white-space:nowrap;border-bottom:2px solid transparent;}',
      '.tab-entrada:hover{color:rgba(200,208,230,0.75);background:rgba(139,92,246,0.08);}',
      '.tab-entrada.on{color:#C4B5FD;border-bottom-color:#A855F7;background:rgba(139,92,246,0.12);text-shadow:0 0 8px rgba(139,92,246,0.4);}',
      '.fwrap{padding:16px 20px;display:flex;flex-direction:column;gap:12px;}',
      '.flbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.16em;color:rgba(167,139,250,0.55);margin-bottom:5px;}',
      '.fi{width:100%;box-sizing:border-box;background:rgba(20,12,40,0.7);border:1px solid rgba(140,100,220,0.22);border-radius:10px;color:#E2E8F0;font-family:inherit;font-size:14px;padding:11px 14px;outline:none;transition:border-color .15s,box-shadow .15s;-webkit-appearance:none;}',
      '.fi:focus{border-color:rgba(167,139,250,0.55);box-shadow:0 0 0 3px rgba(139,92,246,0.12),inset 0 0 12px rgba(139,92,246,0.04);}',
      '.fi::placeholder{color:rgba(200,208,230,0.22);}',
      '.fo{display:flex;flex-wrap:wrap;gap:6px;}',
      '.fopt{padding:6px 13px;border-radius:8px;background:rgba(20,12,40,0.6);border:1px solid rgba(140,100,220,0.20);color:rgba(200,208,230,0.55);font-family:inherit;font-size:11px;font-weight:600;cursor:pointer;transition:all .15s;letter-spacing:.04em;}',
      '.fopt:hover{border-color:rgba(167,139,250,0.45);color:rgba(220,220,240,0.85);background:rgba(139,92,246,0.10);}',
      '.fopt.on{background:rgba(139,92,246,0.22);border-color:rgba(167,139,250,0.55);color:#C4B5FD;box-shadow:0 0 8px rgba(139,92,246,0.20);text-shadow:0 0 6px rgba(167,139,250,0.4);}',
      '.fguardar{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 20px;border:none;border-radius:10px;background:linear-gradient(135deg,rgba(109,40,217,0.9),rgba(139,92,246,0.85));border:1px solid rgba(167,139,250,0.4);color:#fff;font-family:inherit;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;width:100%;box-shadow:0 4px 20px rgba(139,92,246,0.3);transition:all .15s;}',
      '.fguardar:hover{background:linear-gradient(135deg,rgba(124,58,237,1),rgba(167,139,250,0.9));box-shadow:0 4px 28px rgba(139,92,246,0.5);transform:translateY(-1px);}',
      '.fguardar:active{transform:translateY(0);}',
      '.fg2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.fg3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}',
      '.fres{font-size:12px;text-align:center;min-height:18px;color:rgba(200,208,230,0.4);}',
      '.fres.ok{color:#4ADE80;text-shadow:0 0 8px rgba(74,222,128,0.4);}',
      '.fres.err{color:#EF4444;}',
      '.fdiv{height:1px;background:linear-gradient(90deg,rgba(139,92,246,0.25),rgba(139,92,246,0.05));margin:2px 0;}',
      '.form-actions{padding:12px 20px 16px!important;border-top:1px solid rgba(140,100,220,0.12)!important;background:rgba(8,4,18,0.5)!important;gap:8px!important;}',
      '#btnG{background:linear-gradient(135deg,rgba(109,40,217,0.9),rgba(139,92,246,0.85))!important;border:1px solid rgba(167,139,250,0.4)!important;box-shadow:0 4px 20px rgba(139,92,246,0.3)!important;border-radius:10px!important;color:#fff!important;font-weight:700!important;letter-spacing:.06em!important;}',
      '#btnG:hover{box-shadow:0 4px 28px rgba(139,92,246,0.5)!important;transform:translateY(-1px)!important;}',
      '.campo-field,.finput{background:rgba(20,12,40,0.7)!important;border:1px solid rgba(140,100,220,0.22)!important;border-radius:10px!important;color:#E2E8F0!important;}',
      '.campo-field:focus,.finput:focus{border-color:rgba(167,139,250,0.55)!important;box-shadow:0 0 0 3px rgba(139,92,246,0.12)!important;outline:none!important;}',
      '.campo-label,.campo-lbl{color:rgba(167,139,250,0.55)!important;font-size:9px!important;font-weight:700!important;letter-spacing:.16em!important;text-transform:uppercase!important;}',
      '.opts{display:flex;flex-wrap:wrap;gap:5px!important;}',
      '.opt{background:rgba(20,12,40,0.6)!important;border:1px solid rgba(140,100,220,0.20)!important;border-radius:8px!important;color:rgba(200,208,230,0.55)!important;font-size:11px!important;font-weight:600!important;padding:6px 12px!important;transition:all .15s!important;}',
      '.opt:hover{border-color:rgba(167,139,250,0.45)!important;color:rgba(220,220,240,0.9)!important;background:rgba(139,92,246,0.10)!important;}',
      '.opt.on{background:rgba(139,92,246,0.22)!important;border-color:rgba(167,139,250,0.55)!important;color:#C4B5FD!important;box-shadow:0 0 8px rgba(139,92,246,0.20)!important;}',
      '#sec-entrada::-webkit-scrollbar{width:4px;}',
      '#sec-entrada::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.3);border-radius:2px;}',
      '#btn-cerrar-entrada,#btnCerrar{background:rgba(30,15,50,0.7)!important;border:1px solid rgba(140,100,220,0.25)!important;border-radius:8px!important;color:rgba(167,139,250,0.7)!important;transition:all .15s!important;}',
      '#btn-cerrar-entrada:hover,#btnCerrar:hover{color:#fff!important;border-color:rgba(167,139,250,0.5)!important;background:rgba(139,92,246,0.15)!important;}',
    ].join('');
    document.head.appendChild(fs);
  }
  const wrap=document.createElement('div');
  wrap.id='toggle-modo-wrap';
  wrap.innerHTML=`
    <button id="btn-tab-nueva"          onclick="setModoEntrada('nueva')"          class="tab-entrada on">+ Nueva</button>
    <button id="btn-tab-editar"         onclick="setModoEntrada('editar')"         class="tab-entrada">✏ Editar</button>
    <button id="btn-tab-pensamiento"    onclick="setModoEntrada('pensamiento')"    class="tab-entrada">💭</button>
    <button id="btn-tab-persona"        onclick="setModoEntrada('persona')"        class="tab-entrada">👥</button>
    <button id="btn-tab-salud"          onclick="setModoEntrada('salud')"          class="tab-entrada">🏥</button>
    <button id="btn-tab-apartado"       onclick="setModoEntrada('apartado')"       class="tab-entrada">💰</button>
    <button id="btn-tab-patrimonio"     onclick="setModoEntrada('patrimonio')"     class="tab-entrada">🏦</button>
    <button id="btn-tab-nutricion"      onclick="setModoEntrada('nutricion')"      class="tab-entrada">🥗</button>
    <button id="btn-tab-entrenamiento"  onclick="setModoEntrada('entrenamiento')"  class="tab-entrada">💪</button>
    <button id="btn-tab-activity"       onclick="setModoEntrada('activity')"       class="tab-entrada">⚡</button>`;
  const body=document.getElementById('sec-entrada-body')||document.getElementById('entrada-paso2')||document.getElementById('wrap-entrada');
  if(body) body.insertBefore(wrap,body.firstChild);

  const idWrap=document.createElement('div');
  idWrap.id='editar-id-wrap'; idWrap.style.cssText='display:none;padding:12px var(--pad) 0;';
  idWrap.innerHTML=`<div style="display:flex;align-items:center;gap:8px"><input type="number" id="editar-id-input" class="finput" placeholder="ID de la fila" onkeydown="if(event.key==='Enter') buscarFilaId()"><button onclick="buscarFilaId()" class="btn-save" style="flex-shrink:0;padding:10px 18px;font-size:13px;border-radius:999px;min-width:80px"><span id="buscar-spin" class="spin-sm" style="display:none"></span>Buscar</button></div><div id="editar-id-msg" style="font-size:11px;margin-top:6px;color:var(--m)"></div>`;
  if(body) body.insertBefore(idWrap,wrap.nextSibling);

  ['pensamiento','persona','salud','apartado','patrimonio','bancos','nutricion','entrenamiento','activity','libro','movie','norut'].forEach(tab=>{
    const tw=document.createElement('div'); tw.id=tab+'-wrap'; tw.style.display='none';
    if(body) body.insertBefore(tw,idWrap.nextSibling);
  });
}

function setModoEntrada(modo){
  _tabEntrada=modo; _modoEditar=(modo==='editar');
  const paso1=document.getElementById('entrada-paso1');
  const paso2=document.getElementById('entrada-paso2');
  if(paso1) paso1.style.display='none';
  if(paso2) paso2.style.display='block';

  const titulos={nueva:'💸 RAW',editar:'✏️ Editar',pensamiento:'💭 Pensamiento',persona:'👥 Persona',salud:'🏥 Salud',apartado:'💰 Apartado',patrimonio:'🏦 Patrimonio',bancos:'🏛️ Bancos',nutricion:'🥗 Nutrición',entrenamiento:'💪 Entrenamiento',activity:'⚡ Activity',libro:'📚 Libro',movie:'🎬 Movie',norut:'📌 Pendiente'};
  const tituloEl=document.getElementById('entrada-paso2-titulo');
  if(tituloEl) tituloEl.textContent=titulos[modo]||modo;

  ['nueva','editar','pensamiento','persona','salud','apartado','patrimonio','bancos','nutricion','entrenamiento','libro','movie','norut','activity'].forEach(t=>{
    const btn=document.getElementById('btn-tab-'+t); if(btn)btn.classList.toggle('on',t===modo);
    const w=document.getElementById(t+'-wrap'); if(w)w.innerHTML='';
  });

  ['editar-id-wrap','pensamiento-wrap','persona-wrap','salud-wrap','apartado-wrap','patrimonio-wrap','bancos-wrap','nutricion-wrap','entrenamiento-wrap','activity-wrap','libro-wrap','movie-wrap','norut-wrap'].forEach(id=>{ const el=document.getElementById(id);if(el)el.style.display='none'; });

  const formActions=document.querySelector('.form-actions');
  if(modo==='nueva'){
    _mostrarCamposBase(true); if(formActions)formActions.style.display='flex';
    const btnG=document.getElementById('btnG'); if(btnG)btnG.innerHTML='<div class="spin-sm" id="spin"></div><i class="fas fa-floppy-disk" id="bico"></i> Guardar';
    _filaEditar=null;_idEditar=null; limpiar(true);
  } else if(modo==='editar'){
    _mostrarCamposBase(true); if(formActions)formActions.style.display='flex';
    const idWrap=document.getElementById('editar-id-wrap'); if(idWrap)idWrap.style.display='block';
    const btnG=document.getElementById('btnG'); if(btnG)btnG.innerHTML='<div class="spin-sm" id="spin"></div><i class="fas fa-pen" id="bico"></i> Actualizar';
    limpiar(false);
  } else {
    _mostrarCamposBase(false); if(formActions)formActions.style.display='none';
    const wrap=document.getElementById(modo+'-wrap');
    if(wrap){
      // v8.17 — fade al aparecer los campos del tipo (antes de golpe).
      if(window.RawAnim) window.RawAnim.mostrar(wrap,{dur:0.22,y:6,display:'block'});
      else wrap.style.display='block';
    }
    _renderTabEntrada(modo);
  }
}

function _mostrarCamposBase(visible){
  ['cf-fecha','cf-proyecto','cf-contacto','cf-concepto','cf-monto','cf-recurrencia','cf-necesidad','cf-clave'].forEach(id=>{ const el=document.getElementById(id);if(el)el.style.display=visible?'':'none'; });
  const saveRes=document.getElementById('save-res'); if(saveRes&&!visible)saveRes.className='save-res';
}

function _renderTabEntrada(tab){
  const wrap=document.getElementById(tab+'-wrap'); if(!wrap)return;
  wrap.innerHTML='';
  if(tab==='pensamiento')        _renderPensamientoForm(wrap);
  else if(tab==='persona')       _renderPersonaForm(wrap);
  else if(tab==='salud')         _renderSaludForm(wrap);
  else if(tab==='apartado')      _renderApartadoForm(wrap);
  else if(tab==='patrimonio')    _renderPatrimonioForm(wrap);
  else if(tab==='bancos')        _renderBancosForm(wrap);
  else if(tab==='nutricion')     _renderNutricionForm(wrap);
  else if(tab==='entrenamiento') _renderEntrenamientoForm(wrap);
  else if(tab==='libro')         _renderLibroForm(wrap);
  else if(tab==='movie')         _renderMovieForm(wrap);
  else if(tab==='norut')         _renderNoRutForm(wrap);
  else if(tab==='activity')      _renderActivityForm(wrap);
}

// ══════════════════════════════════════════
//  ACTIVITY FORM
// ══════════════════════════════════════════
function _renderActivityForm(wrap){
  var cols=[
    {id:'personal',   label:'👤 Personal',   color:'#FB923C'},
    {id:'electronics',label:'💼 Trabajo',     color:'#22D3EE'},
    {id:'libro',      label:'📚 Libro',       color:'#60A5FA'},
    {id:'movie',      label:'🎬 Movie',       color:'#F59E0B'},
    {id:'norut',      label:'📌 Pendiente',   color:'#A855F7'},
  ];
  var colBtns=cols.map(function(c){ return '<button class="fopt" style="border-color:'+c.color+'44;color:'+c.color+'88" onclick="event.stopPropagation();document.querySelectorAll(\'#act-col-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');_onActColChange(\''+c.id+'\')">'+c.label+'</button>'; }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">⚡ ¿Qué quieres agregar?</div>'+
    '<div class="fo" id="act-col-opts">'+colBtns+'</div>'+
    '<input type="hidden" id="act-col-tipo" value="">'+
    '<div id="act-col-extra" style="display:flex;flex-direction:column;gap:10px"></div>'+
    '<button onclick="_guardarActivityForm()" class="fguardar" style="display:none" id="act-btn-guardar"><i class="fas fa-bolt" style="color:#FB923C"></i> Agregar</button>'+
    '<div id="act-res" class="fres"></div>'+
    '</div>';
}

function _onActColChange(tipo){
  document.getElementById('act-col-tipo').value=tipo;
  var extra=document.getElementById('act-col-extra');
  var btn=document.getElementById('act-btn-guardar');
  if(btn)btn.style.display='flex';
  var SIMS_OPTS=['energia','hambre','cuerpo','higiene','mental','disfrute','entorno'];
  var RECS=['Diario','Semanal','Eventual'];
  var recHtml='<div><div class="flbl">Recurrencia</div><div class="fo" id="act-rec-opts">'+RECS.map(function(r){return '<button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'act-rec-opts\');document.getElementById(\'act-rec\').value=\''+r+'\'">'+r+'</button>';}).join('')+'</div><input type="hidden" id="act-rec" value="Diario"></div>';
  if(tipo==='personal'){
    extra.innerHTML='<input type="text" id="act-nombre" class="fi" placeholder="Nombre del hábito…" style="font-size:14px">'+recHtml+'<div><div class="flbl">Categoría Sims</div><div class="fo" id="act-sims-opts">'+SIMS_OPTS.map(function(s){return '<button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'act-sims-opts\');document.getElementById(\'act-sims\').value=\''+s+'\'">'+s+'</button>';}).join('')+'</div><input type="hidden" id="act-sims" value=""></div>';
  } else if(tipo==='electronics'){
    extra.innerHTML='<input type="text" id="act-nombre" class="fi" placeholder="Nombre del check de trabajo…" style="font-size:14px">'+recHtml;
  } else {
    var label=tipo==='libro'?'Título del libro':tipo==='movie'?'Título de la película/serie':'Descripción del pendiente';
    extra.innerHTML='<input type="text" id="act-nombre" class="fi" placeholder="'+label+'" style="font-size:14px">';
  }
}
function _guardarActivityForm(){
  var tipo=document.getElementById('act-col-tipo').value;
  var nombre=(document.getElementById('act-nombre')||{}).value;
  var res=document.getElementById('act-res');
  if(!tipo){res.textContent='Selecciona una columna';res.style.color='var(--err)';return;}
  if(!nombre||!nombre.trim()){res.textContent='Escribe un nombre';res.style.color='var(--err)';return;}
  nombre=nombre.trim(); res.textContent='Guardando…'; res.style.color='var(--m)';
  var datos={nombre:nombre};
  if(tipo==='personal'){datos.recurrencia=(document.getElementById('act-rec')||{}).value||'Diario';datos.sims=(document.getElementById('act-sims')||{}).value||'';}
  if(tipo==='electronics'){datos.recurrencia=(document.getElementById('act-rec')||{}).value||'Diario';datos.bw=datos.recurrencia.toLowerCase();}
  var tipoBack=tipo==='electronics'?'electronics':tipo==='libro'?'libro':tipo==='movie'?'movie':tipo==='norut'?'norut':'personal';
  api.agregarAActivity(tipoBack,datos).then(function(r){
    res.textContent=r.ok?'✓ Agregado':'✗ '+(r.mensaje||'Error');
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){showToast('✓ Agregado a Activity Check');setTimeout(cerrarEntrada,800);}
  }).catch(function(){res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  LIBRO / MOVIE / NORUT
// ══════════════════════════════════════════
function _renderLibroForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">📚 Agregar libro</div>'+
    '<input type="text" id="libro-nombre" class="fi" placeholder="Título del libro" style="font-size:15px">'+
    '<input type="text" id="libro-autor" class="fi" placeholder="Autor (opcional)" style="font-size:13px">'+
    '<button onclick="_guardarLibroForm()" class="fguardar"><i class="fas fa-book-open" style="color:#60A5FA"></i> Guardar libro</button>'+
    '<div id="libro-res" class="fres"></div>'+
    '</div>';
}
function _guardarLibroForm(){
  var nombre=(document.getElementById('libro-nombre')||{}).value;
  if(!nombre||!nombre.trim()){showToast('Escribe el título del libro',false);return;}
  nombre=nombre.trim();
  var res=document.getElementById('libro-res');
  if(res){res.textContent='Guardando…';res.style.color='var(--m)';}
  api.agregarAActivity('libro',{nombre:nombre}).then(function(r){
    if(res){res.textContent=r.ok?'✓ Libro guardado':'Error: '+(r.mensaje||'desconocido');res.style.color=r.ok?'var(--ok)':'var(--err)';}
    if(r.ok){showToast('✓ Libro guardado');document.getElementById('libro-nombre').value='';setTimeout(cerrarEntrada,800);}
  }).catch(function(){if(res){res.textContent='Error al guardar';res.style.color='var(--err)';}});
}

function _renderMovieForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">🎬 Registrar película / serie</div>'+
    '<input type="text" id="movie-nombre" class="fi" placeholder="Título de la película o serie" style="font-size:15px">'+
    '<button onclick="_guardarMovieForm()" class="fguardar"><i class="fas fa-film" style="color:#F59E0B"></i> Guardar película</button>'+
    '<div id="movie-res" class="fres"></div>'+
    '</div>';
}
function _guardarMovieForm(){
  var nombre=(document.getElementById('movie-nombre')||{}).value;
  if(!nombre||!nombre.trim()){showToast('Escribe el título',false);return;}
  nombre=nombre.trim();
  var res=document.getElementById('movie-res');
  if(res){res.textContent='Guardando…';res.style.color='var(--m)';}
  api.agregarAActivity('movie',{nombre:nombre}).then(function(r){
    if(res){res.textContent=r.ok?'✓ Guardado':'Error: '+(r.mensaje||'desconocido');res.style.color=r.ok?'var(--ok)':'var(--err)';}
    if(r.ok){showToast('✓ Movie guardado');document.getElementById('movie-nombre').value='';setTimeout(cerrarEntrada,800);}
  }).catch(function(){if(res){res.textContent='Error al guardar';res.style.color='var(--err)';}});
}

function _renderNoRutForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">📌 Agregar pendiente</div>'+
    '<input type="text" id="norut-nombre" class="fi" placeholder="¿Qué hay que hacer?" style="font-size:15px">'+
    '<button onclick="_guardarNoRutForm()" class="fguardar"><i class="fas fa-thumbtack" style="color:#FBBF24"></i> Agregar pendiente</button>'+
    '<div id="norut-res" class="fres"></div>'+
    '</div>';
}
function _guardarNoRutForm(){
  var nombre=(document.getElementById('norut-nombre')||{}).value;
  if(!nombre||!nombre.trim()){showToast('Escribe el nombre del pendiente',false);return;}
  nombre=nombre.trim();
  var res=document.getElementById('norut-res');
  if(res){res.textContent='Guardando…';res.style.color='var(--m)';}
  api.agregarAActivity('norut',{nombre:nombre}).then(function(r){
    if(res){res.textContent=r.ok?'✓ Pendiente guardado':'Error: '+(r.mensaje||'desconocido');res.style.color=r.ok?'var(--ok)':'var(--err)';}
    if(r.ok){showToast('✓ Pendiente guardado');document.getElementById('norut-nombre').value='';setTimeout(cerrarEntrada,800);}
  }).catch(function(){if(res){res.textContent='Error al guardar';res.style.color='var(--err)';}});
}

// ══════════════════════════════════════════
//  BANCOS
// ══════════════════════════════════════════
function _renderBancosForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">🏛️ Registrar pago / banco</div>'+
    '<input type="text" id="ban-concepto" class="fi" placeholder="Concepto del pago" style="font-size:15px">'+
    '<div class="fg2">'+
      '<div><div class="flbl">Monto ($)</div><input type="number" id="ban-monto" class="fi" placeholder="0.00" step="0.01" style="font-size:20px;font-weight:700;text-align:center;color:#22D3EE"></div>'+
      '<div><div class="flbl">Fecha</div><input type="date" id="ban-fecha" class="fi" style="font-size:13px;color-scheme:dark"></div>'+
    '</div>'+
    '<button onclick="_guardarBanco()" class="fguardar"><i class="fas fa-building-columns" style="color:#22D3EE"></i> Registrar pago</button>'+
    '<div id="ban-res" class="fres"></div>'+
    '</div>';
  setTimeout(function(){
    var f=document.getElementById('ban-fecha');
    if(f&&!f.value){var h=new Date();f.value=h.getFullYear()+'-'+String(h.getMonth()+1).padStart(2,'0')+'-'+String(h.getDate()).padStart(2,'0');}
  },50);
}
function _guardarBanco(){
  var concepto=(document.getElementById('ban-concepto')||{}).value||'';
  var monto=parseFloat((document.getElementById('ban-monto')||{}).value);
  var fecha=(document.getElementById('ban-fecha')||{}).value||'';
  var res=document.getElementById('ban-res');
  if(!concepto.trim()||isNaN(monto)||!fecha){if(res){res.textContent='Completa todos los campos';res.style.color='var(--err)';}return;}
  if(res){res.textContent='Guardando…';res.style.color='var(--m)';}
  api.guardarEnBancos(concepto.trim(),monto,fecha).then(function(r){
    if(res){res.textContent=r.ok?'✓ Guardado':'Error: '+(r.mensaje||'desconocido');res.style.color=r.ok?'var(--ok)':'var(--err)';}
    if(r.ok){showToast('✓ Banco guardado');api.getFijos().then(function(fi){window._fijosData=fi;if(typeof renderEntes==='function')renderEntes(fi);});setTimeout(cerrarEntrada,800);}
  }).catch(function(){if(res){res.textContent='Error';res.style.color='var(--err)';}});
}

// ══════════════════════════════════════════
//  NUTRICIÓN (UNA SOLA VEZ)
// ══════════════════════════════════════════
function _renderNutricionForm(wrap){
  var momentos=['Ayuno','Desayuno','Almuerzo','Comida','Merienda','Cena','Snack'];
  var momBtns=momentos.map(function(m){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#nut-mom-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'nut-momento\').value=\''+m+'\'">'+m+'</button>'; }).join('');
  var fastBtns=[0,12,14,16,18,20].map(function(h){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#nut-fast-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'nut-fast\').value='+h+'">'+(h?h+'h':'Sin ayuno')+'</button>'; }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">🥗 ¿Qué comiste?</div>'+
    '<input type="text" id="nut-comida" class="fi" placeholder="Ej. Huevos con aguacate y café" style="font-size:15px">'+
    '<div><div class="flbl">Momento del día</div><div class="fo" id="nut-mom-opts">'+momBtns+'</div><input type="hidden" id="nut-momento" value=""></div>'+
    '<div class="fg2">'+
      '<div><div class="flbl">Calorías (kcal)</div><input type="number" id="nut-cal" class="fi" placeholder="0" style="font-size:18px;font-weight:700;text-align:center"></div>'+
      '<div><div class="flbl">Proteína (g)</div><input type="number" id="nut-prot" class="fi" placeholder="0" style="font-size:18px;font-weight:700;text-align:center"></div>'+
    '</div>'+
    '<div class="fg3">'+
      '<div><div class="flbl">Carbos (g)</div><input type="number" id="nut-carbos" class="fi" placeholder="0" style="text-align:center"></div>'+
      '<div><div class="flbl">Grasa (g)</div><input type="number" id="nut-grasa" class="fi" placeholder="0" style="text-align:center"></div>'+
      '<div><div class="flbl">Agua (L)</div><input type="number" id="nut-agua" class="fi" placeholder="0.0" step="0.1" style="text-align:center"></div>'+
    '</div>'+
    '<div><div class="flbl">Fasting (horas)</div><div class="fo" id="nut-fast-opts">'+fastBtns+'</div><input type="hidden" id="nut-fast" value="0"></div>'+
    '<input type="text" id="nut-notas" class="fi" placeholder="Notas…" style="font-size:13px">'+
    '<button onclick="_guardarNutricion()" class="fguardar"><i class="fas fa-leaf" style="color:#4ADE80"></i> Guardar nutrición</button>'+
    '<div id="nut-res" class="fres"></div>'+
    '</div>';
}
function _guardarNutricion(){
  var comida=document.getElementById('nut-comida').value.trim();
  var res=document.getElementById('nut-res');
  if(!comida){res.textContent='Escribe qué comiste';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  var datos={comida:comida,momento:(document.getElementById('nut-momento')||{}).value||'',calorias:parseFloat((document.getElementById('nut-cal')||{}).value)||0,proteina:parseFloat((document.getElementById('nut-prot')||{}).value)||0,carbos:parseFloat((document.getElementById('nut-carbos')||{}).value)||0,grasa:parseFloat((document.getElementById('nut-grasa')||{}).value)||0,agua:parseFloat((document.getElementById('nut-agua')||{}).value)||0,fasting:parseFloat((document.getElementById('nut-fast')||{}).value)||0,notas:(document.getElementById('nut-notas')||{}).value||'',fecha:fmtD(new Date())};
  api.guardarNutricion(datos).then(function(r){
    res.textContent=r.ok?'✓ Guardado':'✗ '+(r.mensaje||'Error');
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Nutrición guardada');
      document.getElementById('nut-comida').value='';
      api.getNutricion().then(function(d){
        window._nutData=d;
        if(typeof window.renderNutricion==='function') window.renderNutricion(d);
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();
      }).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(function(){res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  ENTRENAMIENTO (UNA SOLA VEZ)
// ══════════════════════════════════════════
function _renderEntrenamientoForm(wrap){
  var tipos=['Fuerza','Cardio','HIIT','Flexibilidad','Deporte','Caminata'];
  var tipoBtns=tipos.map(function(t){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#ent-tipo-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'ent-tipo\').value=\''+t+'\'">'+t+'</button>'; }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">💪 Registrar sesión</div>'+
    '<div><div class="flbl">Tipo de entrenamiento</div><div class="fo" id="ent-tipo-opts">'+tipoBtns+'</div><input type="hidden" id="ent-tipo" value=""></div>'+
    '<input type="text" id="ent-ejercicio" class="fi" placeholder="Ejercicio (ej. Press banca, Caminata 5km)" style="font-size:14px">'+
    '<div class="fg2">'+
      '<div><div class="flbl">Duración (min)</div><input type="number" id="ent-dur" class="fi" placeholder="0" style="font-size:20px;font-weight:700;text-align:center"></div>'+
      '<div><div class="flbl">Distancia (km)</div><input type="number" id="ent-dist" class="fi" placeholder="0.0" step="0.1" style="font-size:20px;font-weight:700;text-align:center"></div>'+
    '</div>'+
    '<div class="fg3">'+
      '<div><div class="flbl">Series</div><input type="number" id="ent-series" class="fi" placeholder="0" style="text-align:center"></div>'+
      '<div><div class="flbl">Reps</div><input type="number" id="ent-reps" class="fi" placeholder="0" style="text-align:center"></div>'+
      '<div><div class="flbl">Peso (kg)</div><input type="number" id="ent-peso" class="fi" placeholder="0" step="0.5" style="text-align:center"></div>'+
    '</div>'+
    '<input type="text" id="ent-notas" class="fi" placeholder="Notas de la sesión…" style="font-size:13px">'+
    '<button onclick="_guardarEntrenamiento()" class="fguardar"><i class="fas fa-dumbbell" style="color:#FB923C"></i> Guardar sesión</button>'+
    '<div id="ent-res" class="fres"></div>'+
    '</div>';
}
function _guardarEntrenamiento(){
  var ejercicio=document.getElementById('ent-ejercicio').value.trim();
  var res=document.getElementById('ent-res');
  if(!ejercicio){res.textContent='Escribe el ejercicio';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  var datos={tipo:(document.getElementById('ent-tipo')||{}).value||'',ejercicio:ejercicio,duracion:parseFloat((document.getElementById('ent-dur')||{}).value)||0,distancia:parseFloat((document.getElementById('ent-dist')||{}).value)||0,series:parseFloat((document.getElementById('ent-series')||{}).value)||0,reps:parseFloat((document.getElementById('ent-reps')||{}).value)||0,peso:parseFloat((document.getElementById('ent-peso')||{}).value)||0,notas:(document.getElementById('ent-notas')||{}).value||'',fecha:fmtD(new Date())};
  api.guardarEntrenamiento(datos).then(function(r){
    res.textContent=r.ok?'✓ Guardado':'✗ '+(r.mensaje||'Error');
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Entrenamiento guardado');
      document.getElementById('ent-ejercicio').value='';
      api.getEntrenamiento().then(function(d){window._entData=d;if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(function(){res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  PENSAMIENTO (UNA SOLA VEZ)
// ══════════════════════════════════════════
function _renderPensamientoForm(wrap){
  var cats=['Emoción','Idea','Reflexión','Decisión','Sueño'];
  var catColors={'Emoción':'#EC4899','Idea':'#3B82F6','Reflexión':'#8B5CF6','Decisión':'#F59E0B','Sueño':'#06B6D4'};
  var catBtns=cats.map(function(c){
    return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#p-cat-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'p-cat\').value=\''+c+'\'" style="border-color:'+catColors[c]+'33;color:'+catColors[c]+'88">'+c+'</button>';
  }).join('');
  var enBtns=[1,2,3,4,5].map(function(n){
    var col=n<=2?'#EF4444':n<=3?'#F59E0B':'#4ADE80';
    return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#p-en-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'p-energia\').value='+n+'" style="border-color:'+col+'44;color:'+col+'88;min-width:36px;text-align:center">'+n+'</button>';
  }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">💭 ¿En qué estás pensando?</div>'+
    '<textarea id="p-texto" class="fi" rows="4" placeholder="Escribe aquí tu pensamiento…" style="resize:none;line-height:1.6"></textarea>'+
    '<div class="fg2">'+
      '<div><div class="flbl">Categoría</div><div class="fo" id="p-cat-opts">'+catBtns+'</div><input type="hidden" id="p-cat" value=""></div>'+
      '<div><div class="flbl">Energía ⚡</div><div class="fo" id="p-en-opts">'+enBtns+'</div><input type="hidden" id="p-energia" value=""></div>'+
    '</div>'+
    '<div><div class="flbl">Etiquetas</div><input type="text" id="p-etiquetas" class="fi" placeholder="trabajo, familia, proyecto…" style="font-size:13px;padding:9px 14px"></div>'+
    '<button onclick="_guardarPensamiento()" class="fguardar"><i class="fas fa-brain" style="color:#C4B5FD"></i> Guardar pensamiento</button>'+
    '<div id="p-res" class="fres"></div>'+
    '</div>';
}
function _guardarPensamiento(){
  const texto=document.getElementById('p-texto').value.trim();
  const categoria=document.getElementById('p-cat').value;
  const energia=document.getElementById('p-energia').value;
  const etiquetas=document.getElementById('p-etiquetas').value.trim();
  const res=document.getElementById('p-res');
  if(!texto){res.textContent='Escribe algo primero';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  api.guardarPensamiento({texto,categoria,energia:energia||null,etiquetas,fecha:fmtD(new Date())}).then(r=>{
    res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Pensamiento guardado');
      document.getElementById('p-texto').value='';
      document.getElementById('p-etiquetas').value='';
      document.querySelectorAll('#p-cat-opts .fopt,#p-en-opts .fopt').forEach(b=>b.classList.remove('on'));
      document.getElementById('p-cat').value='';
      document.getElementById('p-energia').value='';
      api.getPensamientos().then(function(d){window._pensamientosData=d;if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  PERSONA (UNA SOLA VEZ)
// ══════════════════════════════════════════
function _renderPersonaForm(wrap){
  var tipos=['Familia','Amigo','Pareja','Trabajo','Médico','Otro'];
  var tipoBtns=tipos.map(function(t){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#per-tipo-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'per-tipo\').value=\''+t+'\'">'+t+'</button>'; }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">👥 ¿Con quién interactuaste?</div>'+
    '<input type="text" id="per-nombre" class="fi" placeholder="Nombre de la persona" style="font-size:15px">'+
    '<div><div class="flbl">Tipo de relación</div><div class="fo" id="per-tipo-opts">'+tipoBtns+'</div><input type="hidden" id="per-tipo" value=""></div>'+
    '<div><div class="flbl">Energía de la interacción</div>'+
    '<div class="fo" id="per-energia-opts">'+
      '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#per-energia-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'per-energia\').value=1" style="border-color:#22C55E44;color:#22C55E88">⚡ Positiva</button>'+
      '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#per-energia-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'per-energia\').value=0">— Neutral</button>'+
      '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#per-energia-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'per-energia\').value=-1" style="border-color:#EF444444;color:#EF444488">↓ Negativa</button>'+
    '</div><input type="hidden" id="per-energia" value=""></div>'+
    '<div><div class="flbl">Notas</div><textarea id="per-notas" class="fi" rows="2" placeholder="¿De qué hablaron? ¿Cómo se sintió?" style="resize:none;font-size:13px"></textarea></div>'+
    '<button onclick="_guardarPersona()" class="fguardar"><i class="fas fa-user-check" style="color:#EC4899"></i> Registrar interacción</button>'+
    '<div id="per-res" class="fres"></div>'+
    '</div>';
}
function _guardarPersona(){
  const nombre=document.getElementById('per-nombre').value.trim();
  const tipo=document.getElementById('per-tipo').value;
  const energia=document.getElementById('per-energia').value;
  const notas=document.getElementById('per-notas').value.trim();
  const res=document.getElementById('per-res');
  if(!nombre){res.textContent='Escribe un nombre';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  api.guardarInteraccion({nombre,tipo,energia:energia!==''?Number(energia):0,notas}).then(r=>{
    res.textContent=r.ok?'✓ '+r.mensaje:'✗ '+r.mensaje;
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Interacción guardada');
      document.getElementById('per-nombre').value='';
      document.getElementById('per-notas').value='';
      document.querySelectorAll('#per-tipo-opts .fopt,#per-energia-opts .fopt').forEach(b=>b.classList.remove('on'));
      document.getElementById('per-tipo').value='';
      document.getElementById('per-energia').value='';
      api.getRelaciones().then(function(d){window._relacionesData=d;if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  SALUD (UNA SOLA VEZ)
// ══════════════════════════════════════════
function _renderSaludForm(wrap){
  var tipos=['Cita','Síntoma','Medicamento','Resultado','Vacuna','Chequeo'];
  var tipoBtns=tipos.map(function(t){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#sal-tipo-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'sal-tipo\').value=\''+t+'\'">'+t+'</button>'; }).join('');
  var estados=['Pendiente','Completado','Cancelado'];
  var estBtns=estados.map(function(e){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#sal-est-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'sal-estado\').value=\''+e+'\'">'+e+'</button>'; }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">🏥 Registro de salud</div>'+
    '<div><div class="flbl">Tipo</div><div class="fo" id="sal-tipo-opts">'+tipoBtns+'</div><input type="hidden" id="sal-tipo" value=""></div>'+
    '<input type="text" id="sal-desc" class="fi" placeholder="Descripción (ej. Cita con Dr. García)" style="font-size:14px">'+
    '<div class="fg2">'+
      '<div><div class="flbl">Doctor / Especialista</div><input type="text" id="sal-doctor" class="fi" placeholder="Opcional" style="font-size:13px"></div>'+
      '<div><div class="flbl">Próxima cita</div><input type="date" id="sal-proxima" class="fi" style="font-size:13px;color-scheme:dark"></div>'+
    '</div>'+
    '<div><div class="flbl">Estado</div><div class="fo" id="sal-est-opts">'+estBtns+'</div><input type="hidden" id="sal-estado" value="Pendiente"></div>'+
    '<input type="text" id="sal-notas" class="fi" placeholder="Notas…" style="font-size:13px">'+
    '<button onclick="_guardarSalud()" class="fguardar"><i class="fas fa-heart-pulse" style="color:#EF4444"></i> Guardar registro</button>'+
    '<div id="sal-res" class="fres"></div>'+
    '</div>';
}
function _guardarSalud(){
  var tipo=(document.getElementById('sal-tipo')||{}).value||'';
  var desc=(document.getElementById('sal-desc')||{}).value||'';
  var doctor=(document.getElementById('sal-doctor')||{}).value||'';
  var proxima=(document.getElementById('sal-proxima')||{}).value||'';
  var estado=(document.getElementById('sal-estado')||{}).value||'Pendiente';
  var notas=(document.getElementById('sal-notas')||{}).value||'';
  var res=document.getElementById('sal-res');
  if(!desc.trim()){res.textContent='Escribe una descripción';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  api.guardarSalud({tipo:tipo,descripcion:desc.trim(),doctor:doctor,proxima:proxima,estado:estado,notas:notas,fecha:fmtD(new Date())}).then(function(r){
    res.textContent=r.ok?'✓ Guardado':'✗ '+(r.mensaje||'Error');
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Salud guardada');
      api.getSalud().then(function(d){window._saludData=d;if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(function(){res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  APARTADO
// ══════════════════════════════════════════
function _renderApartadoForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">💰 Nuevo apartado</div>'+
    '<input type="text" id="ap-nombre" class="fi" placeholder="Nombre del apartado" style="font-size:14px">'+
    '<input type="text" id="ap-categoria" class="fi" placeholder="Categoría (Renta, Viaje, Emergencia…)" style="font-size:13px">'+
    '<div class="fg2">'+
      '<div><div class="flbl">Monto</div><input type="number" id="ap-monto" class="fi" placeholder="0.00" step="0.01" style="font-size:18px;font-weight:700;text-align:center;color:#FBBF24"></div>'+
      '<div><div class="flbl">Banco</div><input type="text" id="ap-banco" class="fi" placeholder="BBVA, BEATS…" style="font-size:13px"></div>'+
    '</div>'+
    '<div><div class="flbl">Fecha meta</div><input type="date" id="ap-meta" class="fi" style="font-size:13px;color-scheme:dark"></div>'+
    '<textarea id="ap-notas" class="fi" rows="2" placeholder="Notas…" style="resize:none;font-size:13px"></textarea>'+
    '<button onclick="_guardarApartado()" class="fguardar"><i class="fas fa-lock" style="color:#FBBF24"></i> Guardar apartado</button>'+
    '<div id="ap-res" class="fres"></div>'+
    '</div>';
}
function _guardarApartado(){
  const nombre=document.getElementById('ap-nombre').value.trim();
  const categoria=document.getElementById('ap-categoria').value.trim();
  const monto=parseFloat(document.getElementById('ap-monto').value);
  const banco=document.getElementById('ap-banco').value.trim();
  const meta=document.getElementById('ap-meta').value;
  const notas=document.getElementById('ap-notas').value.trim();
  const res=document.getElementById('ap-res');
  if(!nombre||isNaN(monto)){res.textContent='Nombre y monto requeridos';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  api.guardarApartado({nombre,categoria,monto,banco,meta:meta||null,notas,estado:'Activo'}).then(r=>{
    res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Apartado guardado');
      ['ap-nombre','ap-categoria','ap-monto','ap-banco','ap-meta','ap-notas'].forEach(function(id){var e=document.getElementById(id);if(e) e.value='';});
      api.getApartados().then(function(d){window._apartadosData=d.items||[];if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  PATRIMONIO
// ══════════════════════════════════════════
function _renderPatrimonioForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">🏦 Registrar movimiento</div>'+
    '<div><div class="flbl">Tipo</div><div class="fo" id="pat-tipo-opts">'+
      '<button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'pat-tipo-opts\');document.getElementById(\'pat-tipo\').value=\'ahorro\';_onPatTipoChange()">💳 Banco</button>'+
      '<button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'pat-tipo-opts\');document.getElementById(\'pat-tipo\').value=\'efectivo\';_onPatTipoChange()">💵 Efectivo</button>'+
      '<button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'pat-tipo-opts\');document.getElementById(\'pat-tipo\').value=\'inversion\';_onPatTipoChange()">📈 Inversión</button>'+
    '</div><input type="hidden" id="pat-tipo" value=""></div>'+
    '<input type="text" id="pat-concepto" class="fi" placeholder="Concepto" style="font-size:14px">'+
    '<div class="fg2">'+
      '<div><div class="flbl">Monto</div><input type="number" id="pat-monto" class="fi" placeholder="0.00" step="0.01" style="font-size:18px;font-weight:700;text-align:center"></div>'+
      '<div><div class="flbl">Fecha</div><input type="date" id="pat-fecha" class="fi" style="font-size:13px;color-scheme:dark"></div>'+
    '</div>'+
    '<div id="pat-extra" style="display:flex;flex-direction:column;gap:10px"></div>'+
    '<button onclick="_guardarPatrimonio()" class="fguardar"><i class="fas fa-landmark" style="color:#C4B5FD"></i> Guardar</button>'+
    '<div id="pat-res" class="fres"></div>'+
    '</div>';
  document.getElementById('pat-fecha').value=fmtD(new Date());
}
function _onPatTipoChange(){
  const tipo=document.getElementById('pat-tipo').value;
  const extra=document.getElementById('pat-extra');
  if(!extra)return;
  if(tipo==='ahorro'){
    extra.innerHTML='<input type="text" id="pat-banco" class="fi" placeholder="Banco" style="font-size:13px"><div class="fo" id="pat-mov-opts"><button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'pat-mov-opts\');document.getElementById(\'pat-movtipo\').value=\'Depósito\'">Depósito</button><button class="fopt" onclick="event.stopPropagation();_selOpt(this,\'pat-mov-opts\');document.getElementById(\'pat-movtipo\').value=\'Retiro\'">Retiro</button></div><input type="hidden" id="pat-movtipo" value="Depósito">';
  } else if(tipo==='inversion'){
    extra.innerHTML='<input type="text" id="pat-instrumento" class="fi" placeholder="Instrumento (CETES, GBM…)" style="font-size:13px"><div class="fg2"><input type="text" id="pat-plazo" class="fi" placeholder="Plazo" style="font-size:13px"><input type="number" id="pat-rendimiento" class="fi" placeholder="Rendimiento $" step="0.01" style="font-size:13px"></div>';
  } else { extra.innerHTML=''; }
}
function _guardarPatrimonio(){
  const tipo=document.getElementById('pat-tipo').value;
  const concepto=document.getElementById('pat-concepto').value.trim();
  const monto=parseFloat(document.getElementById('pat-monto').value);
  const fecha=document.getElementById('pat-fecha').value;
  const res=document.getElementById('pat-res');
  if(!tipo){res.textContent='Selecciona un tipo';res.style.color='var(--err)';return;}
  if(!concepto||isNaN(monto)){res.textContent='Concepto y monto requeridos';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  let datos={concepto,monto,fecha}; let promise;
  if(tipo==='ahorro'){
    var bn=document.getElementById('pat-banco'); var mv=document.getElementById('pat-movtipo');
    datos.banco=bn?bn.value.trim():''; datos.tipo=mv?mv.value:'Depósito';
    promise=api.guardarAhorro(datos);
  } else if(tipo==='efectivo'){
    promise=api.guardarEfectivo(datos);
  } else {
    var ins=document.getElementById('pat-instrumento'); var plz=document.getElementById('pat-plazo'); var rd=document.getElementById('pat-rendimiento');
    datos.instrumento=ins?ins.value.trim():'CETES'; datos.plazo=plz?plz.value.trim():''; datos.rendimiento=rd?(parseFloat(rd.value)||0):0;
    promise=api.guardarInversion(datos);
  }
  promise.then(r=>{
    res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){
      showToast('✓ Patrimonio guardado');
      api.getPatrimonio().then(function(d){window._patrimonioData=d;if(typeof renderPatrimonio==='function')renderPatrimonio(d);if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();}).catch(function(){});
      setTimeout(cerrarEntrada,800);
    }
  }).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});
}

// ══════════════════════════════════════════
//  HELPERS COMPARTIDOS
// ══════════════════════════════════════════
function _selOpt(btn,containerId){
  document.querySelectorAll('#'+containerId+' .fopt,#'+containerId+' .opt').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
}

function buscarFilaId(){
  const id=document.getElementById('editar-id-input').value.trim();
  if(!id){document.getElementById('editar-id-msg').textContent='Escribe un ID';return;}
  const spin=document.getElementById('buscar-spin');
  const msg=document.getElementById('editar-id-msg');
  if(spin)spin.style.display='block';
  msg.textContent='Buscando…';msg.style.color='var(--m)';
  api.getFilaPorId(id).then(r=>{
    if(spin)spin.style.display='none';
    if(!r.ok){msg.textContent='✗ '+r.mensaje;msg.style.color='var(--err)';return;}
    _filaEditar=r.fila;_idEditar=r.id;
    msg.textContent='✓ ID '+r.id+' — fila '+r.fila;msg.style.color='var(--ok)';
    document.getElementById('fecha').value=r.fecha||fmtD(new Date());marcarDone('fecha');
    proxSel=r.proyecto;setFieldVal('proyecto',r.proyecto,!r.proyecto);_selectOpt('sw-proyecto',r.proyecto);marcarDone('proyecto');
    contactoSel=r.contacto;setFieldVal('contacto',r.contacto,!r.contacto);_selectOpt('sw-contacto',r.contacto);marcarDone('contacto');
    setFieldVal('concepto',r.concepto,!r.concepto);marcarDone('concepto');
    const m=r.monto||0;sign=m>=0?1:-1;
    document.getElementById('monto').value=Math.abs(m);
    document.getElementById('sbp').className='msign'+(sign===1?' pos':'');
    document.getElementById('sbn').className='msign'+(sign===-1?' neg':'');
    upM();marcarDone('monto');
    recSel=r.recurrencia;setFieldVal('recurrencia',r.recurrencia,!r.recurrencia);_selectOpt('sw-recurrencia',r.recurrencia);marcarDone('recurrencia');
    document.getElementById('clave').value=r.clave||'';setFieldVal('clave',r.clave||'',!r.clave);if(r.clave)marcarDone('clave');
    necesidadSel=r.necesidad||'';if(r.necesidad){setFieldVal('necesidad',r.necesidad.slice(0,30),false);marcarDone('necesidad');}
  }).catch(e=>{if(spin)spin.style.display='none';msg.textContent='Error: '+e.message;msg.style.color='var(--err)';});
}
function _selectOpt(swId,val){
  const w=document.getElementById(swId); if(!w)return;
  w.querySelectorAll('.opt').forEach(b=>{b.classList.toggle('on',b.textContent.trim()===val);});
}

// ══════════════════════════════════════════
//  ENTES
// ══════════════════════════════════════════
function renderEntes(data){
  window._fijosData=data||[];
  const body=document.getElementById('entes-list');
  if(!body) return;
  if(!data||!data.length){body.innerHTML='<div style="padding:16px;color:var(--m);text-align:center">Sin datos</div>';return;}
  const apartadosPorBanco={};let totalApartadosActivos=0;
  (window._apartadosData||[]).forEach(ap=>{if(ap.estado&&ap.estado.toLowerCase()==='usado')return;const banco=(ap.banco||'').trim().toUpperCase();apartadosPorBanco[banco]=(apartadosPorBanco[banco]||0)+(ap.monto||0);totalApartadosActivos+=(ap.monto||0);});
  const total=data.reduce((s,f)=>f.nombre==='P'?s:s+(f.monto||0),0);
  const totalDisponible=total-totalApartadosActivos;
  const {txt:tt,cls:tc}=fmtMoneda(totalDisponible);
  const totalEl=document.getElementById('entes-total');
  if(totalEl){totalEl.textContent=tt;totalEl.className='sec-hdr-val '+tc;}
  const hayExcluidos=data.some(f=>f.nombre==='P');
  body.innerHTML=data.map(f=>{
    const {txt,cls}=fmtMoneda(f.monto);const excluido=f.nombre==='P';
    const bancKey=(f.nombre||'').trim().toUpperCase();const apBanco=apartadosPorBanco[bancKey]||0;
    const disponible=(f.monto||0)-apBanco;const {txt:dTxt}=fmtMoneda(disponible);
    return `<div class="ente-row${excluido?' excluido-total':''}" onclick="togEnteEdit(${f.fila},event)">
      <div class="ente-nombre">${f.nombre}</div>
      <div class="ente-right">
        <div style="text-align:right">
          <div class="ente-monto ${cls}" id="em-${f.fila}">${txt}</div>
          ${!excluido&&apBanco>0?`<div style="font-size:11px;color:var(--m);margin-top:2px">disponible: <span style="color:#4ADE80;font-weight:700;font-size:12px">${dTxt}</span></div>`:''}
        </div>
        <div class="ente-fecha">${fmtDiaSemana(f.fecha)}</div>
      </div>
    </div>
    <div class="ente-edit" id="ee-${f.fila}">
      <input type="number" value="${f.monto!==null?f.monto:''}" step="0.01" inputmode="decimal" id="ei-${f.fila}" placeholder="0.00"
        onkeydown="if(event.key==='Enter')guardarEnte(${f.fila},event);if(event.key==='Escape')togEnteEdit(${f.fila},event)">
      <button class="btn-check" id="ec-${f.fila}" onclick="guardarEnte(${f.fila},event)"><i class="fas fa-check" id="ei-ico-${f.fila}"></i></button>
    </div>`;
  }).join('')+(hayExcluidos?'<div class="ente-excluido-nota">* excluido del total</div>':'');
}
function togEnteEdit(fila, evt){
  // v5.132: hay IDs ee-FILA duplicados en el DOM porque renderEntes y
  // renderPatrimonio generan ambos sus propias filas editables con los
  // mismos IDs. getElementById('ee-3') retorna el PRIMERO del DOM, que
  // puede no ser el visible. Solución: usar el event para encontrar el
  // .ente-row clickeado y de ahí navegar al .ente-edit que le sigue.
  evt = evt || window.event;
  var ee = null;
  if(evt && evt.currentTarget && evt.currentTarget.classList && evt.currentTarget.classList.contains('ente-row')){
    // El elemento clickeado es el .ente-row. El .ente-edit es su hermano siguiente.
    ee = evt.currentTarget.nextElementSibling;
    if(!ee || !ee.classList.contains('ente-edit')) ee = null;
  }
  if(!ee && evt && evt.target){
    // Si currentTarget no funcionó, subir desde target hasta encontrar .ente-row
    var row = evt.target.closest && evt.target.closest('.ente-row');
    if(row){
      var sib = row.nextElementSibling;
      if(sib && sib.classList.contains('ente-edit')) ee = sib;
    }
  }
  // Fallback: getElementById (comportamiento original) — pero ahora solo si
  // no hay event (p.ej. llamada desde teclado de un input específico).
  if(!ee) ee = document.getElementById('ee-'+fila);
  if(!ee) return;
  var isOpen = ee.classList.contains('open');
  // Cerrar TODOS los otros editores antes de abrir
  document.querySelectorAll('.ente-edit.open').forEach(function(e){ e.classList.remove('open'); });
  if(!isOpen){
    ee.classList.add('open');
    // Buscar el input dentro de ESTE ente-edit (no por ID global)
    var inp = ee.querySelector('input[type="number"]');
    if(inp) inp.focus();
  }
}
window.togEnteEdit = togEnteEdit;

function guardarEnte(fila, evt){
  // v5.132: mismo problema — buscar el input dentro del contenedor visible.
  evt = evt || window.event;
  var inp = null;
  if(evt && evt.target){
    var ee = evt.target.closest && evt.target.closest('.ente-edit');
    if(ee) inp = ee.querySelector('input[type="number"]');
  }
  if(!inp) inp = document.getElementById('ei-'+fila);
  if(!inp) return;
  var val = parseFloat(inp.value);
  if(isNaN(val)) return;
  // Buscar el ícono dentro del mismo ente-edit visible
  var ico = null;
  if(evt && evt.target){
    var ee2 = evt.target.closest && evt.target.closest('.ente-edit');
    if(ee2) ico = ee2.querySelector('.btn-check i');
  }
  if(!ico) ico = document.getElementById('ei-ico-'+fila);
  if(ico) ico.className = 'fas fa-circle-notch fa-spin';
  api.actualizarFijo(fila,val).then(function(r){
    if(ico) ico.className = 'fas fa-check';
    if(r.ok){
      // Actualizar TODOS los em-FILA visibles (puede haber duplicados)
      document.querySelectorAll('[id="em-'+fila+'"]').forEach(function(em){
        var fm = fmtMoneda(val);
        em.textContent = fm.txt;
        em.className = 'ente-monto ' + fm.cls;
      });
      // Cerrar TODOS los ente-edit abiertos
      document.querySelectorAll('.ente-edit.open').forEach(function(e){ e.classList.remove('open'); });
      Promise.all([api.getFijos(),api.getApartados(),api.getPatrimonio()]).then(function(arr){
        var fijos=arr[0], apData=arr[1], pat=arr[2];
        if(apData && typeof renderApartados==='function') renderApartados(apData);
        if(typeof renderEntes==='function') renderEntes(fijos);
        if(pat && typeof renderPatrimonio==='function'){ window._patrimonioData=pat; renderPatrimonio(pat); }
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();
      }).catch(function(){
        api.getFijos().then(function(f){ if(typeof renderEntes==='function') renderEntes(f); });
      });
    }
  }).catch(function(){ if(ico) ico.className = 'fas fa-check'; });
}
window.guardarEnte = guardarEnte;

// ══════════════════════════════════════════
//  SOS
// ══════════════════════════════════════════
function activarSOS(){
  const btn=document.getElementById('btn-sos');
  if(btn){btn.disabled=true;btn.textContent='Enviando…';}
  const msg='🚨 Necesito ayuda — enviado desde RAW Entry';
  if(navigator.geolocation){
    navigator.geolocation.getCurrentPosition(function(pos){_doEnviarSOS(msg,'https://maps.google.com/?q='+pos.coords.latitude+','+pos.coords.longitude,btn);},function(){_doEnviarSOS(msg,'',btn);},{enableHighAccuracy:true,timeout:15000,maximumAge:0});
  } else _doEnviarSOS(msg,'',btn);
}
function _doEnviarSOS(mensaje,ubicacion,btn){
  api.enviarSOS({mensaje,ubicacion}).then(r=>{
    showToast(r.ok?'🚨 SOS enviado a '+r.enviados+' contacto(s)':'Error: '+r.mensaje,r.ok);
    if(btn){btn.disabled=false;btn.textContent='🚨 SOS';}
  }).catch(()=>{showToast('Error al enviar SOS',false);if(btn){btn.disabled=false;btn.textContent='🚨 SOS';}});
}

// Tooltip genérico
function initTooltip(){
  var tip=document.getElementById('gtip'); if(!tip) return;
  document.addEventListener('mouseover',function(e){
    var t=e.target.closest('[data-tip]');
    if(!t){tip.classList.remove('show');return;}
    tip.textContent=t.getAttribute('data-tip');
    var r=t.getBoundingClientRect();
    tip.style.left=(r.left+r.width/2-tip.offsetWidth/2)+'px';
    tip.style.top=(r.top-tip.offsetHeight-6+window.scrollY)+'px';
    tip.classList.add('show');
  });
  document.addEventListener('mouseout',function(e){if(!e.target.closest('[data-tip]'))tip.classList.remove('show');});
}

/* ══════════════════════════════════════════
   FALLBACKS — renderActivity y renderNutricion
   Solo se definen si no existen
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function(){
  if(typeof window.renderActivity !== 'function'){
    window.renderActivity = function(){
      var d = window._actData; if(!d) return;
      var WRAP = document.getElementById('act-wrapper') || document.getElementById('board-activity');
      if(!WRAP) return;

      var CAT = {
        personal:    { color:'#A855F7', glow:'rgba(168,85,247,0.4)',  icon:'fa-user',      label:'PERSONAL',    dias:['L','M','W','J','V','S','D'] },
        electronics: { color:'#06B6D4', glow:'rgba(6,182,212,0.4)',   icon:'fa-bolt',      label:'ELECTRONICS', dias:['L','M','W','J','V'] },
        libro:       { color:'#22D3EE', glow:'rgba(34,211,238,0.4)',   icon:'fa-book-open', label:'LIBROS' },
        movie:       { color:'#F97316', glow:'rgba(249,115,22,0.4)',   icon:'fa-film',      label:'MOVIES' },
        norut:       { color:'#EC4899', glow:'rgba(236,72,153,0.4)',   icon:'fa-star',      label:'PENDIENTES' },
      };
      var DLBL = {L:'Lun',M:'Mar',W:'Mié',J:'Jue',V:'Vie',S:'Sáb',D:'Dom'};
      var diaKey = ['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];

      function countDone(items){ return (items||[]).filter(function(it){ return it.completado===true||it.completado==='Sí'||it.completado==='Si'; }).length; }
      function countHabDone(habs){ return (habs||[]).filter(function(h){ return h.checks && Object.values(h.checks).some(Boolean); }).length; }

      var totales = {
        personal:    (d.habitosPersonal||[]).length,    doneP: countHabDone(d.habitosPersonal),
        electronics: (d.habitosElectronics||[]).length, doneE: countHabDone(d.habitosElectronics),
        libro:       (d.libros||[]).length,             doneL: countDone(d.libros),
        movie:       (d.movies||[]).length,             doneM: countDone(d.movies),
        norut:       (d.noRutinarias||[]).length,       doneN: countDone(d.noRutinarias),
      };
      var totalAll  = totales.personal+totales.electronics+totales.libro+totales.movie+totales.norut;
      var doneAll   = totales.doneP+totales.doneE+totales.doneL+totales.doneM+totales.doneN;
      var pctGeneral= totalAll>0?Math.round(doneAll/totalAll*100):0;
      var circ = 2*Math.PI*28;

      function chkCircle(fila, dia, checked, tipo){
        var c = CAT[tipo]; var esH=(dia===diaKey);
        var isChecked = checked===true || (checked&&checked.v);
        var fechaHora = (checked&&checked.fecha) ? checked.fecha : null;
        var tooltip   = isChecked && fechaHora ? 'title="'+fechaHora+'"' : '';
        // v5.210: el círculo lleva SOLO el check — nada de fecha embutida
        // dentro (antes un texto de 5px se amontonaba sobre la esfera). La
        // hora queda accesible en el tooltip (title).
        return '<div class="_act-chk" data-fila="'+fila+'" data-dia="'+dia+'" data-tipo="'+tipo+'"'+
          ' '+tooltip+
          ' style="position:relative;width:22px;height:22px;min-width:22px;border-radius:50%;cursor:pointer;transition:all 200ms;'+
          'border:1.5px solid '+(isChecked?c.color:esH?'rgba(255,255,255,.35)':'rgba(100,80,160,0.3)')+';'+
          'background:'+(isChecked?c.color:'transparent')+';'+
          'box-shadow:'+(isChecked?'0 0 8px '+c.glow+',0 0 4px '+c.glow:'none')+';'+
          'display:flex;align-items:center;justify-content:center">'+
          (isChecked?'<i class="fas fa-check" style="font-size:9px;color:#fff;pointer-events:none"></i>':'')+
        '</div>';
      }

      function chkItem(fila, tipo, done){
        var c = CAT[tipo];
        // v5.209: la fecha de completado YA se muestra después del texto
        // del concepto (en itemList). Antes chkItem también la metía DENTRO
        // del círculo (texto de 5px embutido) — se veía amontonada sobre la
        // esfera. El círculo ahora lleva solo el check; nada de fecha aquí.
        var fechaLocal = '';
        try {
          fechaLocal = localStorage.getItem('actItemDate:'+tipo+':'+fila) || '';
        } catch(e){}
        var tooltip = (done && fechaLocal) ? 'title="'+fechaLocal+'"' : '';
        return '<div class="_act-item" data-fila="'+fila+'" data-tipo="'+tipo+'" '+tooltip+
          ' style="width:24px;height:24px;min-width:24px;border-radius:50%;cursor:pointer;transition:all 200ms;flex-shrink:0;'+
          'border:1.5px solid '+(done?c.color:'#26304A')+';'+
          'background:'+(done?c.color:'transparent')+';'+
          'box-shadow:'+(done?'0 0 8px '+c.glow:'none')+';'+
          'display:flex;align-items:center;justify-content:center">'+
          (done?'<i class="fas fa-check" style="font-size:10px;color:#fff;pointer-events:none;line-height:1"></i>':'')+
        '</div>';
      }

      function kpiPill(tipo, done, total){
        var c = CAT[tipo];
        return '<div style="display:flex;align-items:center;gap:7px;padding:0 16px;border-right:1px solid rgba(140,100,220,0.14)">'+
          '<i class="fas '+c.icon+'" style="font-size:14px;color:'+c.color+';filter:drop-shadow(0 0 6px '+c.glow+')"></i>'+
          '<div><div style="font-size:9px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45);line-height:1">'+c.label+'</div>'+
          '<div style="font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.2">'+
            '<span style="color:'+c.color+'">'+done+'</span>'+
            '<span style="color:rgba(200,208,230,0.25)"> / '+total+'</span>'+
          '</div></div>'+
        '</div>';
      }

      // ── HEADER BAR ──
      var header =
        '<div style="display:flex;align-items:center;background:rgba(10,6,22,0.96);border-bottom:1px solid rgba(140,100,220,0.14);'+
             'height:56px;padding:0 16px;gap:0;flex-shrink:0;overflow:hidden">'+
          '<div onclick="(typeof volverAlAnverso===\'function\'&&volverAlAnverso())"'+
               ' style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;'+
               'background:rgba(14,8,28,0.92);border:1px solid rgba(140,100,220,0.18);border-radius:8px;cursor:pointer;'+
               'margin-right:14px;flex-shrink:0;transition:all .15s">'+
            '<i class="fas fa-arrow-left" style="color:#22D3EE;font-size:13px"></i>'+
          '</div>'+
          '<div style="margin-right:24px;flex-shrink:0">'+
            '<div style="font-size:15px;font-weight:700;letter-spacing:.05em;color:#fff;line-height:1.1">ACTIVITY CHECK</div>'+
            '<div style="font-size:10px;color:rgba(200,208,230,0.45);margin-top:1px">Tu progreso, tu recompensa</div>'+
          '</div>'+
          '<div style="display:flex;align-items:center;flex:1;overflow:hidden">'+
            kpiPill('personal',    totales.doneP, totales.personal)+
            kpiPill('electronics', totales.doneE, totales.electronics)+
            kpiPill('libro',       totales.doneL, totales.libro)+
            kpiPill('movie',       totales.doneM, totales.movie)+
            '<div style="display:flex;align-items:center;gap:7px;padding:0 16px">'+
              '<i class="fas fa-star" style="font-size:14px;color:#EC4899;filter:drop-shadow(0 0 6px rgba(236,72,153,0.4))"></i>'+
              '<div><div style="font-size:9px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45);line-height:1">PENDIENTES</div>'+
              '<div style="font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;line-height:1.2">'+
                '<span style="color:#EC4899">'+totales.doneN+'</span>'+
                '<span style="color:rgba(200,208,230,0.25)"> / '+totales.norut+'</span>'+
              '</div></div>'+
            '</div>'+
          '</div>'+
          '<div style="display:flex;align-items:center;gap:10px;flex-shrink:0;padding-left:16px;border-left:1px solid rgba(140,100,220,0.14)">'+
            '<svg width="48" height="48" viewBox="0 0 64 64">'+
              '<circle cx="32" cy="32" r="28" fill="none" stroke="#26304A" stroke-width="4"/>'+
              '<circle cx="32" cy="32" r="28" fill="none" stroke="#3B82F6" stroke-width="4"'+
                ' stroke-dasharray="'+circ.toFixed(1)+'" stroke-dashoffset="'+(circ*(1-pctGeneral/100)).toFixed(1)+'"'+
                ' stroke-linecap="round" transform="rotate(-90 32 32)"'+
                ' style="filter:drop-shadow(0 0 6px rgba(59,130,246,0.6));transition:stroke-dashoffset .8s"/>'+
              '<text x="32" y="38" text-anchor="middle" font-size="16" font-weight="700" fill="#fff" font-family="system-ui">'+pctGeneral+'%</text>'+
            '</svg>'+
            '<div><div style="font-size:9px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45);margin-bottom:1px">PROGRESO</div>'+
            '<div style="font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.1">'+
              '<span style="color:#3B82F6">'+doneAll+'</span>'+
              '<span style="color:rgba(200,208,230,0.25)"> / '+totalAll+'</span>'+
            '</div></div>'+
          '</div>'+
        '</div>';

      // ── Filtros por columna ──
      var _actFilter = window._actFilter || (window._actFilter = {});
      // v6.072 — por columna: ¿ocultar los completados? Para libro/movie/
      // norut arranca en TRUE (los completados no se ven; el botón dice
      // "Mostrar completos"). Las Pendientes se cierran constantemente,
      // así que por defecto la columna muestra solo lo que falta.
      var _actOcultarDone = window._actOcultarDone || (window._actOcultarDone = {
        libro:true, movie:true, norut:true
      });

      function hexToRgb(hex){
        var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
        return r+','+g+','+b;
      }

      function filterBar(tipo){
        var c = CAT[tipo];
        var cur = _actFilter[tipo] || 'az';
        var BTNS = [
          {k:'az',     ico:'fa-arrow-down-a-z',  tip:'A → Z'},
          {k:'za',     ico:'fa-arrow-up-z-a',    tip:'Z → A'},
          {k:'hoy_si', ico:'fa-circle-check',    tip:'Con check hoy'},
          {k:'hoy_no', ico:'fa-circle',           tip:'Sin check hoy'},
        ];
        // v6.072 — botón de mostrar/ocultar completados. Solo en las
        // columnas libro/movie/norut (las que tienen "completado").
        var toggleDone = '';
        if(tipo==='libro' || tipo==='movie' || tipo==='norut'){
          var oculto = !!_actOcultarDone[tipo];
          toggleDone =
            '<button class="_act-done-toggle" data-tipo="'+tipo+'" '+
            'title="'+(oculto?'Mostrar los completados':'Ocultar los completados')+'" style="'+
            'margin-left:auto;display:flex;align-items:center;gap:5px;height:26px;padding:0 9px;'+
            'border-radius:6px;cursor:pointer;flex-shrink:0;font-size:9px;font-weight:700;'+
            'letter-spacing:.05em;text-transform:uppercase;transition:all .12s;'+
            'border:1px solid '+(oculto?'#26304A':c.color)+';'+
            'background:'+(oculto?'transparent':'rgba('+hexToRgb(c.color)+',0.15)')+';'+
            'color:'+(oculto?'#6A7388':c.color)+';'+
            'box-shadow:'+(oculto?'none':'0 0 8px '+c.glow)+'">'+
            '<i class="fas '+(oculto?'fa-eye':'fa-eye-slash')+'" style="pointer-events:none;font-size:10px"></i>'+
            '<span style="pointer-events:none">'+(oculto?'Mostrar completos':'Ocultar completos')+'</span>'+
            '</button>';
        }
        return '<div class="_act-filter-bar" data-tipo="'+tipo+'" style="'+
          'display:flex;gap:4px;padding:6px 12px;background:rgba(6,4,14,0.95);border-bottom:1px solid rgba(140,100,220,0.14);align-items:center;flex-shrink:0">'+
          '<span style="font-size:9px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.25);text-transform:uppercase;margin-right:4px;flex-shrink:0">Orden</span>'+
          BTNS.map(function(b){
            var on = (cur===b.k);
            return '<button class="_act-filter-btn" data-tipo="'+tipo+'" data-filter="'+b.k+'" title="'+b.tip+'" style="'+
              'width:26px;height:26px;border-radius:6px;border:1px solid '+(on?c.color:'#26304A')+';'+
              'background:'+(on?'rgba('+hexToRgb(c.color)+',0.15)':'transparent')+';'+
              'color:'+(on?c.color:'#4A5266')+';cursor:pointer;font-size:11px;'+
              'display:flex;align-items:center;justify-content:center;transition:all .12s;'+
              'box-shadow:'+(on?'0 0 8px '+c.glow:'none')+';flex-shrink:0">'+
              '<i class="fas '+b.ico+'" style="pointer-events:none"></i></button>';
          }).join('')+
          toggleDone+
        '</div>';
      }

      function applyHabFilter(items, tipo){
        var f = _actFilter[tipo] || 'az';
        var s = items.slice();
        if(f==='az') s.sort(function(a,b){ return a.nombre.localeCompare(b.nombre); });
        else if(f==='za') s.sort(function(a,b){ return b.nombre.localeCompare(a.nombre); });
        else if(f==='hoy_si') s.sort(function(a,b){
          var ac=a.checks&&a.checks[diaKey]?1:0, bc=b.checks&&b.checks[diaKey]?1:0;
          return bc-ac;
        });
        else if(f==='hoy_no') s.sort(function(a,b){
          var ac=a.checks&&a.checks[diaKey]?1:0, bc=b.checks&&b.checks[diaKey]?1:0;
          return ac-bc;
        });
        return s;
      }

      function applyItemFilter(items, tipo){
        var f = _actFilter[tipo] || 'az';
        var s = items.slice();
        var isDone = function(it){ return it.completado===true||it.completado==='Sí'||it.completado==='Si'; };
        if(f==='az') s.sort(function(a,b){ return a.nombre.localeCompare(b.nombre); });
        else if(f==='za') s.sort(function(a,b){ return b.nombre.localeCompare(a.nombre); });
        else if(f==='hoy_si') s.sort(function(a,b){ return (isDone(b)?1:0)-(isDone(a)?1:0); });
        else if(f==='hoy_no') s.sort(function(a,b){ return (isDone(a)?1:0)-(isDone(b)?1:0); });
        // v6.072 — ocultar/mostrar completados por columna.
        if(_actOcultarDone[tipo]){
          // Ocultos: se quitan de la lista (siguen en el Sheet, no borrados).
          s = s.filter(function(it){ return !isDone(it); });
        } else {
          // Mostrados: los completados van SIEMPRE al fondo de la columna,
          // sin perder el orden elegido dentro de cada grupo.
          s.sort(function(a,b){ return (isDone(a)?1:0)-(isDone(b)?1:0); });
        }
        return s;
      }

      function habTable(items, tipo){
        var c = CAT[tipo]; var dias = c.dias;
        if(!items||!items.length) return '<div style="padding:24px;text-align:center;color:rgba(200,208,230,0.25);font-size:12px">Sin hábitos</div>';
        var sorted = applyHabFilter(items, tipo);
        var h = '<table style="width:100%;border-collapse:collapse">';
        h += '<tr><th style="text-align:left;padding:6px 10px;font-size:10px;font-weight:600;letter-spacing:.08em;color:rgba(200,208,230,0.45);border-bottom:1px solid rgba(140,100,220,0.14);position:sticky;top:0;background:rgba(14,8,28,0.95);z-index:1">HÁBITO</th>';
        dias.forEach(function(d){
          var esH=(d===diaKey);
          h += '<th style="text-align:center;padding:6px 4px;font-size:10px;font-weight:'+(esH?700:600)+';'+
               'color:'+(esH?c.color:'#7A8499')+';border-bottom:1px solid rgba(140,100,220,0.14);min-width:26px;'+
               'position:sticky;top:0;background:rgba(14,8,28,0.95);z-index:1;'+
               (esH?'text-shadow:0 0 8px '+c.glow:'')+'">'+(DLBL[d]||d)+'</th>';
        });
        // Columna extra para el botón "limpiar fila"
        h += '<th style="width:28px;padding:6px 4px;border-bottom:1px solid rgba(140,100,220,0.14);position:sticky;top:0;background:rgba(14,8,28,0.95);z-index:1"></th>';
        h += '</tr>';
        sorted.forEach(function(hab){
          var allDone = dias.every(function(dia){ return hab.checks&&hab.checks[dia]; });
          var anyDone = dias.some(function(dia){ return hab.checks&&hab.checks[dia]; });
          h += '<tr class="_hab-row" style="transition:background .15s;cursor:default"'+
               ' onmouseover="this.style.background=\'rgba(25,14,52,0.7)\'" onmouseout="this.style.background=\'transparent\'">'+
               '<td style="padding:8px 10px;border-bottom:1px solid rgba(140,100,220,0.14)">'+
                 (hab.sims||hab.bw?'<div style="font-size:10px;font-weight:600;letter-spacing:.10em;color:rgba(200,208,230,0.25);text-transform:uppercase;margin-bottom:1px">'+(hab.sims||hab.bw)+'</div>':'')+
                 '<div style="font-size:13px;font-weight:500;color:'+(allDone?c.color:'#C8D0E0')+';'+
                 'max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'+
                 (allDone?'text-shadow:0 0 8px '+c.glow:'')+'">' + hab.nombre+'</div>'+
               '</td>';
          dias.forEach(function(dia){
            h += '<td style="text-align:center;padding:6px 2px;border-bottom:1px solid rgba(140,100,220,0.14)">'+
                 chkCircle(hab.fila, dia, hab.checks&&hab.checks[dia], tipo)+'</td>';
          });
          // Botón limpiar fila — solo activo si hay al menos 1 check
          h += '<td style="padding:6px 4px;border-bottom:1px solid rgba(140,100,220,0.14);text-align:center">'+
                 '<button class="_act-clear-row" data-fila="'+hab.fila+'" data-tipo="'+tipo+'"'+
                 ' title="Limpiar todos los checks de esta fila"'+
                 ' style="width:22px;height:22px;border-radius:6px;border:1px solid '+(anyDone?'rgba(239,68,68,0.4)':'rgba(100,80,160,0.15)')+';'+
                 'background:transparent;color:'+(anyDone?'#EF4444':'rgba(100,80,160,0.4)')+';'+
                 'cursor:'+(anyDone?'pointer':'not-allowed')+';font-size:10px;'+
                 'display:flex;align-items:center;justify-content:center;transition:all .12s;margin:0 auto"'+
                 (anyDone?'':'disabled')+'>'+
                 '<i class="fas fa-eraser" style="pointer-events:none"></i>'+
                 '</button>'+
               '</td>';
          h += '</tr>';
        });
        h += '</table>';
        return h;
      }

      function itemList(items, tipo){
        if(!items||!items.length) return '<div style="padding:24px;text-align:center;color:rgba(200,208,230,0.25);font-size:12px">Sin registros</div>';
        var sorted = applyItemFilter(items, tipo);
        function _fmtFecha(f){
          if(!f) return '';
          // formato 'yyyy-MM-dd HH:mm' → 'dd/MMM HH:mm'
          var m = String(f).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
          if(!m) return '';
          var meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
          var d = m[3], mes = meses[parseInt(m[2],10)-1] || '', h = m[4]||'', mm = m[5]||'';
          return d + '/' + mes + (h ? ' ' + h + ':' + mm : '');
        }
        return '<div style="display:flex;flex-direction:column;width:100%">'+
          sorted.map(function(it){
            var done=it.completado===true||it.completado==='Sí'||it.completado==='Si';
            var fechaStr = done && it.fechaCompletado ? _fmtFecha(it.fechaCompletado) : '';
            return '<div class="_item-row" style="display:flex;align-items:center;gap:10px;padding:8px 16px;'+
              'transition:background .15s;border-bottom:1px solid rgba(140,100,220,0.14)"'+
              ' onmouseover="this.style.background=\'rgba(25,14,52,0.7)\'" onmouseout="this.style.background=\'transparent\'">'+
              chkItem(it.fila, tipo, done)+
              '<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:1px">'+
                '<span style="font-size:13px;font-weight:500;color:'+(done?'#4A5266':'#C8D0E0')+';'+
                'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;'+
                'line-height:1.4;word-break:break-word">'+it.nombre+'</span>'+
                (fechaStr ? '<span style="font-size:9px;font-weight:700;letter-spacing:.06em;color:rgba(167,139,250,0.65);font-family:JetBrains Mono,monospace">'+fechaStr+'</span>' : '')+
              '</div>'+
            '</div>';
          }).join('')+'</div>';
      }

      // ── SIDEBAR ──
      function sidebarBar(tipo, done, total){
        var c = CAT[tipo];
        var pct = total>0?Math.round(done/total*100):0;
        return '<div style="margin-bottom:12px">'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px">'+
            '<div style="display:flex;align-items:center;gap:7px">'+
              '<i class="fas '+c.icon+'" style="font-size:11px;color:'+c.color+'"></i>'+
              '<span style="font-size:12px;font-weight:500;color:rgba(220,220,240,0.85)">'+c.label.charAt(0)+c.label.slice(1).toLowerCase()+'</span>'+
            '</div>'+
            '<span style="font-size:12px;font-weight:600;font-variant-numeric:tabular-nums;color:rgba(220,220,240,0.85)">'+done+' / '+total+'</span>'+
          '</div>'+
          '<div style="height:4px;background:rgba(6,4,14,0.95);border-radius:2px;overflow:hidden">'+
            '<div style="height:100%;width:'+pct+'%;background:'+c.color+';border-radius:2px;'+
            'box-shadow:0 0 6px '+c.glow+';transition:width .4s"></div>'+
          '</div>'+
        '</div>';
      }

      var sidebar =
        '<div style="width:260px;flex-shrink:0;display:flex;flex-direction:column;gap:12px;padding:16px;overflow-y:auto">'+
          '<div style="background:rgba(14,8,28,0.92);border:1px solid rgba(140,100,220,0.18);border-radius:12px;padding:16px;'+
               'box-shadow:0 0 0 1px rgba(120,160,255,0.04),0 4px 24px rgba(0,0,0,0.4)">'+
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
              '<i class="fas fa-cube" style="font-size:14px;color:#3B82F6"></i>'+
              '<span style="font-size:10px;font-weight:700;letter-spacing:.12em;color:rgba(200,208,230,0.45)">RECOMPENSA ACTUAL</span>'+
            '</div>'+
            '<div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:4px">Maestro del progreso</div>'+
            '<div style="font-size:11px;color:rgba(200,208,230,0.45);margin-bottom:10px">Completa '+totalAll+' actividades para desbloquear</div>'+
            '<div style="height:4px;background:rgba(6,4,14,0.95);border-radius:2px;overflow:hidden;margin-bottom:5px">'+
              '<div style="height:100%;width:'+pctGeneral+'%;background:linear-gradient(90deg,#7C3AED,#A855F7);border-radius:2px;box-shadow:0 0 6px rgba(59,130,246,0.5);transition:width .8s"></div>'+
            '</div>'+
            '<div style="display:flex;justify-content:flex-end;font-size:11px;font-weight:600;color:#3B82F6;font-variant-numeric:tabular-nums">'+doneAll+' / '+totalAll+'</div>'+
          '</div>'+
          '<div style="background:rgba(14,8,28,0.92);border:1px solid rgba(140,100,220,0.18);border-radius:12px;padding:16px;'+
               'box-shadow:0 0 0 1px rgba(120,160,255,0.04),0 4px 24px rgba(0,0,0,0.4)">'+
            '<div style="font-size:10px;font-weight:700;letter-spacing:.12em;color:rgba(200,208,230,0.45);margin-bottom:14px">CATEGORÍAS</div>'+
            sidebarBar('personal',    totales.doneP, totales.personal)+
            sidebarBar('electronics', totales.doneE, totales.electronics)+
            sidebarBar('libro',       totales.doneL, totales.libro)+
            sidebarBar('movie',       totales.doneM, totales.movie)+
            sidebarBar('norut',       totales.doneN, totales.norut)+
          '</div>'+
          '<div style="background:linear-gradient(135deg,rgba(59,130,246,0.12),rgba(168,85,247,0.08));'+
               'border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:14px">'+
            '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">'+
              '<i class="fas fa-chart-line" style="font-size:13px;color:#3B82F6"></i>'+
              '<span style="font-size:12px;font-weight:700;color:#fff">SIGUE ASÍ</span>'+
            '</div>'+
            '<div style="font-size:11px;color:rgba(200,208,230,0.45);line-height:1.5">'+
              (pctGeneral>=70?'¡Llevas un excelente ritmo! Cada hábito completado te acerca a tu mejor versión.':
               pctGeneral>=40?'Vas bien. Mantén el ritmo y cierra tus anillos hoy.':
               'Empieza pequeño. Un hábito a la vez hace la diferencia.')+
            '</div>'+
          '</div>'+
        '</div>';

      // ── PANEL COL CON SCROLL VERTICAL POR COLUMNA ──
      var colW = {
        personal:    'flex:2 1 0;min-width:400px',
        electronics: 'flex:2 1 0;min-width:400px',
        libro:       'flex:1 1 0;min-width:170px',
        movie:       'flex:1 1 0;min-width:170px',
        norut:       'flex:1 1 0;min-width:170px',
      };
      function panelCol(tipo, inner){
        var c = CAT[tipo];
        var wStyle = colW[tipo] || 'flex:1 1 auto;min-width:200px;max-width:300px';
        // CADA COLUMNA: header + filterBar fija + inner con scroll vertical propio
        return '<div data-panel-tipo="'+tipo+'" style="'+wStyle+';background:rgba(14,8,28,0.92);border:1px solid rgba(140,100,220,0.18);border-radius:12px;'+
               'display:flex;flex-direction:column;overflow:hidden;height:100%;'+
               'box-shadow:0 0 0 1px rgba(120,160,255,0.04),0 4px 24px rgba(0,0,0,0.4)">'+
          '<div style="padding:14px 16px 12px;border-bottom:1px solid rgba(140,100,220,0.14);display:flex;align-items:center;gap:8px;flex-shrink:0">'+
            '<i class="fas '+c.icon+'" style="font-size:14px;color:'+c.color+';filter:drop-shadow(0 0 6px '+c.glow+')"></i>'+
            '<span style="font-size:13px;font-weight:700;letter-spacing:.08em;color:'+c.color+'">'+c.label+'</span>'+
            '<span style="margin-left:auto;font-size:11px;font-weight:600;color:rgba(200,208,230,0.4);font-variant-numeric:tabular-nums">'+
              ((tipo==='personal'?totales.doneP:tipo==='electronics'?totales.doneE:tipo==='libro'?totales.doneL:tipo==='movie'?totales.doneM:totales.doneN))+
              ' / '+
              ((tipo==='personal'?totales.personal:tipo==='electronics'?totales.electronics:tipo==='libro'?totales.libro:tipo==='movie'?totales.movie:totales.norut))+
            '</span>'+
            // v5.209: botón "limpiar TODA la columna" — solo en Personal y
            // Electronics (las que tienen checks de días). Limpia todos los
            // checks de todas las filas de golpe.
            ((tipo==='personal'||tipo==='electronics')
              ? '<button class="_act-clear-all" data-tipo="'+tipo+'" title="Limpiar todos los checks de esta columna" '+
                'style="margin-left:8px;background:transparent;border:1px solid rgba(239,68,68,0.35);'+
                'color:#EF4444;border-radius:6px;width:24px;height:24px;cursor:pointer;flex-shrink:0;'+
                'display:flex;align-items:center;justify-content:center;font-size:10px">'+
                '<i class="fas fa-trash-can" style="pointer-events:none"></i></button>'
              : '')+
          '</div>'+
          // ── filterBar FIJA, fuera del scroll ──
          filterBar(tipo)+
          '<div data-panel-inner style="flex:1;overflow-y:auto;overflow-x:hidden;min-height:0">'+inner+'</div>'+
        '</div>';
      }

      // ── FOOTER BAR ──
      var xpActual = (window._lgr&&window._lgr.xpActual)||0;
      var xpMax    = (window._lgr&&window._lgr.xpNivel)||500;
      var nivel    = (window._lgr&&window._lgr.nivel)||1;
      var xpPct    = xpMax>0?Math.round(xpActual/xpMax*100):0;

      var footer =
        '<div style="display:flex;align-items:center;background:rgba(10,6,22,0.96);border-top:1px solid rgba(140,100,220,0.14);'+
             'height:48px;padding:0;flex-shrink:0">'+
          '<div style="display:flex;align-items:center;gap:10px;flex:1;padding:0 18px;border-right:1px solid rgba(140,100,220,0.14)">'+
            '<div style="width:30px;height:30px;border-radius:7px;background:rgba(6,4,14,0.95);border:1px solid rgba(140,100,220,0.18);'+
                 'display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
              '<span style="font-size:12px;font-weight:800;color:#A78BFA">'+nivel+'</span>'+
            '</div>'+
            '<div style="flex:1;min-width:0">'+
              '<div style="font-size:10px;font-weight:700;color:#fff;margin-bottom:2px;line-height:1">NIVEL '+nivel+
                ' <span style="font-size:9px;color:rgba(200,208,230,0.45);font-weight:500;font-variant-numeric:tabular-nums">'+xpActual+' / '+xpMax+' XP</span></div>'+
              '<div style="height:3px;background:rgba(6,4,14,0.95);border-radius:2px;overflow:hidden">'+
                '<div style="height:100%;width:'+xpPct+'%;background:linear-gradient(90deg,#7C3AED,#A855F7);border-radius:2px;box-shadow:0 0 6px rgba(59,130,246,0.5)"></div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div style="display:flex;align-items:center;gap:9px;flex:1;padding:0 18px;border-right:1px solid rgba(140,100,220,0.14)">'+
            '<i class="fas fa-fire" style="font-size:17px;color:#FB923C;filter:drop-shadow(0 0 8px rgba(251,146,60,0.6))"></i>'+
            '<div><div style="font-size:9px;font-weight:600;letter-spacing:.08em;color:rgba(200,208,230,0.45);line-height:1">RACHA ACTUAL</div>'+
            '<div style="font-size:13px;font-weight:700;color:#FB923C;line-height:1.1">'+doneAll+' actividades</div></div>'+
          '</div>'+
          '<div style="display:flex;align-items:center;gap:9px;flex:1;padding:0 18px;border-right:1px solid rgba(140,100,220,0.14)">'+
            '<i class="fas fa-bullseye" style="font-size:14px;color:#A855F7"></i>'+
            '<div><div style="font-size:9px;font-weight:600;letter-spacing:.08em;color:rgba(200,208,230,0.45);line-height:1">PROGRESO HOY</div>'+
            '<div style="font-size:11px;font-weight:600;color:#fff;margin-top:1px;line-height:1.1">'+
              doneAll+' / '+totalAll+' <span style="color:#A855F7;font-size:10px;font-weight:700">+50 XP</span>'+
            '</div></div>'+
          '</div>'+
          '<div style="display:flex;align-items:center;gap:9px;flex:1;padding:0 18px">'+
            '<div style="width:30px;height:30px;border-radius:7px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);'+
                 'display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
              '<span style="font-size:12px;font-weight:800;color:#A855F7">'+(nivel+1)+'</span>'+
            '</div>'+
            '<div><div style="font-size:9px;font-weight:600;letter-spacing:.08em;color:rgba(200,208,230,0.45);line-height:1">PRÓXIMO NIVEL</div>'+
            '<div style="font-size:11px;font-weight:600;color:rgba(220,220,240,0.85);margin-top:1px;line-height:1.1">'+
              '<span style="color:#A855F7">+500 XP</span> <span style="color:rgba(200,208,230,0.25)">|</span> <span style="color:#22D3EE">+$250</span>'+
            '</div></div>'+
            '<i class="fas fa-box" style="font-size:15px;color:rgba(200,208,230,0.45);margin-left:auto"></i>'+
          '</div>'+
        '</div>';

      // ── LAYOUT: respeta el hero/header superior de la página
      // Calcula la altura disponible restando el offsetTop real del board
      var board = document.getElementById('board-activity');
      if(!board) return;
      board.style.display = 'flex';
      board.style.flexDirection = 'column';
      board.style.background = 'rgba(4,4,14,0.97)';
      board.style.overflow = 'hidden';
      // Limpiar estilos previos que pudiéramos tener
      board.style.position = '';
      board.style.top = board.style.left = board.style.right = board.style.bottom = '';
      board.style.zIndex = '';
      // v6.065: NO imponer height con calc(100vh - ...). El board-activity
      // ya recibe su altura correcta del CSS (height:100% heredado de
      // .board-wrap, que está dimensionado bajo la barra superior). Antes
      // este cálculo con 100vh incluía el área de la barra → la sección
      // se extendía de más y aparecía scroll exterior. El contenedor
      // interno (flex:1;min-height:0) ya gestiona el espacio.
      board.style.height = '';
      board.style.maxHeight = '';

      board.innerHTML =
        header +
        // Contenedor principal: flex:1 con min-height:0 para que sus hijos puedan scrollear
        '<div style="display:flex;gap:8px;padding:8px;flex:1;min-height:0;overflow-x:auto;overflow-y:hidden;align-items:stretch">'+
          '<div style="display:flex;gap:8px;flex:1;min-width:0;align-items:stretch;height:100%">'+
            panelCol('personal',    habTable(d.habitosPersonal||[],    'personal'))+
            panelCol('electronics', habTable(d.habitosElectronics||[], 'electronics'))+
            panelCol('libro',       itemList(d.libros||[],   'libro'))+
            panelCol('movie',       itemList(d.movies||[],   'movie'))+
            panelCol('norut',       itemList(d.noRutinarias||[],'norut'))+
          '</div>'+
          sidebar+
        '</div>'+
        footer;

      // Event delegation
      board.addEventListener('click', function(e){
        // ── Filtros por columna ──
        var fb = e.target.closest('._act-filter-btn');
        if(fb){
          var tipo = fb.dataset.tipo;
          var filt = fb.dataset.filter;
          _actFilter[tipo] = filt;
          var d2 = window._actData;
          if(!d2) return;
          var panelEl = fb.closest('[data-panel-tipo]');
          if(panelEl){
            // Re-renderizar la filterBar (para actualizar el botón activo)
            var oldBar = panelEl.querySelector('._act-filter-bar');
            if(oldBar){
              var tmp = document.createElement('div');
              tmp.innerHTML = filterBar(tipo);
              oldBar.replaceWith(tmp.firstChild);
            }
            // Re-renderizar SOLO el inner (no toca la filterBar fija)
            var inner = panelEl.querySelector('[data-panel-inner]');
            if(inner){
              var isHab = (tipo==='personal'||tipo==='electronics');
              var items = isHab
                ? (tipo==='personal'?d2.habitosPersonal:d2.habitosElectronics)||[]
                : (tipo==='libro'?d2.libros:tipo==='movie'?d2.movies:d2.noRutinarias)||[];
              inner.innerHTML = isHab ? habTable(items, tipo) : itemList(items, tipo);
            }
          }
          return;
        }

        // ── v6.072: Botón mostrar/ocultar completados por columna ──
        var dt = e.target.closest('._act-done-toggle');
        if(dt){
          var tipoDT = dt.dataset.tipo;
          _actOcultarDone[tipoDT] = !_actOcultarDone[tipoDT];
          var d2DT = window._actData;
          if(!d2DT) return;
          var panelDT = dt.closest('[data-panel-tipo]');
          if(panelDT){
            var oldBarDT = panelDT.querySelector('._act-filter-bar');
            if(oldBarDT){
              var tmpDT = document.createElement('div');
              tmpDT.innerHTML = filterBar(tipoDT);
              oldBarDT.replaceWith(tmpDT.firstChild);
            }
            var innerDT = panelDT.querySelector('[data-panel-inner]');
            if(innerDT){
              var itemsDT = (tipoDT==='libro'?d2DT.libros:tipoDT==='movie'?d2DT.movies:d2DT.noRutinarias)||[];
              innerDT.innerHTML = itemList(itemsDT, tipoDT);
            }
          }
          return;
        }
        var clrAll = e.target.closest('._act-clear-all');
        if(clrAll){
          var tipoCA = clrAll.dataset.tipo;
          var d2CA   = window._actData; if(!d2CA) return;
          var arrCA  = tipoCA==='personal'?d2CA.habitosPersonal:d2CA.habitosElectronics;
          if(!arrCA || !arrCA.length) return;
          var diasCA = (CAT[tipoCA].dias||[]);
          // Contar cuántos checks hay para el mensaje de confirmación.
          var totalChecks = 0;
          arrCA.forEach(function(h){
            diasCA.forEach(function(dia){ if(h.checks && h.checks[dia]) totalChecks++; });
          });
          if(totalChecks === 0) return;
          if(!confirm('¿Limpiar TODOS los checks de la columna '+CAT[tipoCA].label+'? ('+totalChecks+' checks). Esta acción no se puede deshacer.')) return;
          // Limpiar en datos + API, fila por fila / día por día.
          arrCA.forEach(function(h){
            diasCA.forEach(function(dia){
              if(h.checks && h.checks[dia]){
                if(typeof api!=='undefined') api.setActivityCheck(tipoCA, h.fila, dia, false);
                h.checks[dia] = false;
              }
            });
          });
          // Re-render visual del inner de esa columna.
          var panelCA = clrAll.closest('[data-panel-tipo]');
          if(panelCA){
            var innerCA = panelCA.querySelector('[data-panel-inner]');
            if(innerCA) innerCA.innerHTML = habTable(arrCA, tipoCA);
          }
          return;
        }

        // ── Botón limpiar fila completa (Personal/Electronics) ──
        var clr = e.target.closest('._act-clear-row');
        if(clr && !clr.disabled){
          var fila = parseInt(clr.dataset.fila);
          var tipo = clr.dataset.tipo;
          var d2   = window._actData; if(!d2) return;
          var arr  = tipo==='personal'?d2.habitosPersonal:d2.habitosElectronics;
          var hab  = (arr||[]).find(function(x){ return x.fila===fila; });
          if(!hab) return;
          // Confirmar
          if(!confirm('¿Limpiar todos los checks de "'+hab.nombre+'"?')) return;
          var diasH = (CAT[tipo].dias||[]);
          // Llamar API para cada día marcado
          diasH.forEach(function(dia){
            if(hab.checks && hab.checks[dia]){
              if(typeof api!=='undefined') api.setActivityCheck(tipo, fila, dia, false);
              hab.checks[dia] = false;
            }
          });
          // Re-render la fila visualmente
          var tr = clr.closest('tr');
          if(tr){
            tr.querySelectorAll('._act-chk').forEach(function(ch){
              ch.style.borderColor = 'rgba(100,80,160,0.3)';
              ch.style.background  = 'transparent';
              ch.style.boxShadow   = 'none';
              ch.removeAttribute('title');
              ch.innerHTML = '';
            });
            var td = tr.querySelector('td:first-child div:last-child');
            if(td){ td.style.color = '#C8D0E0'; td.style.textShadow = 'none'; }
            // Deshabilitar el botón
            clr.disabled = true;
            clr.style.cursor = 'not-allowed';
            clr.style.color  = 'rgba(100,80,160,0.4)';
            clr.style.borderColor = 'rgba(100,80,160,0.15)';
          }
          return;
        }

        // ── Click en check de día (hábito) ──
        var c = e.target.closest('._act-chk');
        if(c){
          var ok = !!c.querySelector('.fa-check');
          var nowChk = !ok;
          var tipo = c.dataset.tipo;
          var cat  = CAT[tipo];
          var ahora = new Date();
          var horaStr = String(ahora.getHours()).padStart(2,'0')+':'+String(ahora.getMinutes()).padStart(2,'0');
          c.style.borderColor = nowChk?cat.color:'rgba(100,80,160,0.3)';
          c.style.background  = nowChk?cat.color:'transparent';
          c.style.boxShadow   = nowChk?'0 0 8px '+cat.glow+',0 0 4px '+cat.glow:'none';
          // v5.210: el círculo lleva SOLO el check. La hora queda en el
          // tooltip (title), no embutida dentro de la esfera.
          if(nowChk){
            c.setAttribute('title', horaStr);
            c.innerHTML = '<i class="fas fa-check" style="font-size:9px;color:#fff;pointer-events:none"></i>';
          } else {
            c.removeAttribute('title');
            c.innerHTML='';
          }
          var row = c.closest('tr');
          if(row){
            var allChks = row.querySelectorAll('._act-chk');
            var allDone = Array.prototype.every.call(allChks, function(ch){ return !!ch.querySelector('.fa-check'); });
            var anyDone = Array.prototype.some.call(allChks, function(ch){ return !!ch.querySelector('.fa-check'); });
            var td = row.querySelector('td:first-child div:last-child');
            if(td) td.style.color = allDone?cat.color:'#C8D0E0';
            if(td) td.style.textShadow = allDone?'0 0 8px '+cat.glow:'none';
            // Habilitar/deshabilitar botón limpiar fila
            var clrBtn = row.querySelector('._act-clear-row');
            if(clrBtn){
              clrBtn.disabled = !anyDone;
              clrBtn.style.cursor = anyDone?'pointer':'not-allowed';
              clrBtn.style.color  = anyDone?'#EF4444':'rgba(100,80,160,0.4)';
              clrBtn.style.borderColor = anyDone?'rgba(239,68,68,0.4)':'rgba(100,80,160,0.15)';
            }
          }
          // Sincronizar dato local
          var d2 = window._actData;
          if(d2){
            var arr2 = tipo==='personal'?d2.habitosPersonal:d2.habitosElectronics;
            var hab2 = (arr2||[]).find(function(x){ return x.fila===parseInt(c.dataset.fila); });
            if(hab2 && hab2.checks) hab2.checks[c.dataset.dia] = nowChk;
          }
          if(typeof api!=='undefined') api.setActivityCheck(tipo, parseInt(c.dataset.fila), c.dataset.dia, nowChk);
          return;
        }

        // ── Click en item simple (libro/movie/norut) ──
        var it = e.target.closest('._act-item');
        if(it){
          var ok = !!it.querySelector('.fa-check');
          var nowDone = !ok;
          var tipo = it.dataset.tipo;
          var fila = parseInt(it.dataset.fila);
          var cat  = CAT[tipo];
          var ahora = new Date();
          var fechaStr = String(ahora.getDate()).padStart(2,'0')+'/'+String(ahora.getMonth()+1).padStart(2,'0');
          // v5.148: fecha completa con hora para mostrar en la card
          var fechaCardStr = fechaStr+' '+String(ahora.getHours()).padStart(2,'0')+':'+String(ahora.getMinutes()).padStart(2,'0');
          // Guardar fecha en localStorage
          try {
            var lsKey = 'actItemDate:'+tipo+':'+fila;
            if(nowDone) localStorage.setItem(lsKey, fechaStr);
            else        localStorage.removeItem(lsKey);
          } catch(e2){}
          it.style.borderColor = nowDone?cat.color:'#26304A';
          it.style.background  = nowDone?cat.color:'transparent';
          it.style.boxShadow   = nowDone?'0 0 8px '+cat.glow:'none';
          // v5.209: el círculo lleva SOLO el check. La fecha se muestra
          // después del texto del concepto (en el span de info), no aquí.
          if(nowDone){
            it.setAttribute('title', fechaStr);
            it.innerHTML = '<i class="fas fa-check" style="font-size:10px;color:#fff;pointer-events:none;line-height:1"></i>';
          } else {
            it.removeAttribute('title');
            it.innerHTML = '';
          }
          var row = it.parentElement;
          var sp  = row&&row.querySelector('span');
          if(sp) sp.style.color = nowDone?'#4A5266':'#C8D0E0';

          // v5.211: actualizar la fecha visual DESPUÉS del nombre del
          // concepto. BUG corregido: antes infoFlex se obtenía con
          // row.querySelector(':scope > div'), que devuelve el PRIMER div
          // hijo de la fila — y ese primer div es el círculo _act-item.
          // El fechaSpan se metía DENTRO del círculo (amontonado sobre el
          // check). Ahora se selecciona explícitamente el div de info: el
          // div hijo que NO es el _act-item.
          if(row){
            var infoFlex = null;
            var hijosDiv = row.querySelectorAll(':scope > div');
            for(var hi=0; hi<hijosDiv.length; hi++){
              if(!hijosDiv[hi].classList.contains('_act-item')){
                infoFlex = hijosDiv[hi]; break;
              }
            }
            if(infoFlex){
              // El primer span es el nombre; el segundo (si existe) la fecha.
              var spans = infoFlex.querySelectorAll(':scope > span');
              var fechaSpan = spans[1];
              if(nowDone){
                if(!fechaSpan){
                  fechaSpan = document.createElement('span');
                  fechaSpan.style.cssText = 'font-size:9px;font-weight:700;letter-spacing:.06em;color:rgba(167,139,250,0.65);font-family:JetBrains Mono,monospace';
                  infoFlex.appendChild(fechaSpan);
                }
                fechaSpan.textContent = fechaCardStr;
                fechaSpan.style.display = '';
              } else if(fechaSpan){
                fechaSpan.style.display = 'none';
              }
            }
          }

          if(row&&row.parentElement){
            if(nowDone) row.parentElement.appendChild(row);
            else        row.parentElement.insertBefore(row, row.parentElement.firstChild);
          }
          // Sincronizar dato local — incluir fechaCompletado para próximo render
          var d2 = window._actData;
          if(d2){
            var arr2 = tipo==='libro'?d2.libros:tipo==='movie'?d2.movies:d2.noRutinarias;
            var item2 = (arr2||[]).find(function(x){ return x.fila===fila; });
            if(item2){
              item2.completado = nowDone;
              item2.fechaCompletado = nowDone ? ahora.toISOString() : null;
            }
          }
          if(typeof api!=='undefined') api.marcarActivityItem(tipo, fila, nowDone);
          // v6.072: si la columna tiene "ocultar completados" activo y el
          // item se acaba de completar, re-renderizar la columna para que
          // desaparezca de la vista (sigue en el Sheet, no se borra).
          if(_actOcultarDone[tipo] && nowDone){
            var panelIT = it.closest('[data-panel-tipo]');
            if(panelIT){
              var innerIT = panelIT.querySelector('[data-panel-inner]');
              if(innerIT && d2){
                var itemsIT = (tipo==='libro'?d2.libros:tipo==='movie'?d2.movies:d2.noRutinarias)||[];
                innerIT.innerHTML = itemList(itemsIT, tipo);
              }
            }
          }
          return;
        }
      });
    };
  }



  if(typeof window.renderNutricion !== 'function'){
    window.renderNutricion = function(data){
      // Delegar al layout completo que siempre muestra todos los componentes
      if(typeof window._renderNutLayoutCompleto === 'function'){
        window._renderNutLayoutCompleto(data);
        return;
      }
      // Fallback simple si por algún motivo el layout no está disponible
      var body=document.getElementById('nut-panel-body'); if(!body) return;
      body.innerHTML='<div style="padding:40px;text-align:center;color:rgba(200,208,230,0.25);font-size:13px">Cargando…</div>';
    };
  }

});