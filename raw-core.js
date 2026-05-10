/* RAW Entry — Core v.5.083
   AJUSTES DE PROPORCIONES — alineación de paneles top y bottom con el dial:

   ZONA SUPERIOR (top):
   - USER ahora con ANCHO FIJO 220px (antes 16-20% del viewport → infladísimo)
   - Stats con ANCHO FIJO 340px (antes 24-28% del viewport)
   - Estado del Sim con ancho IGUAL al dial (r.width), NO el resto del viewport.
     Antes: Sim ocupaba topAvail - wUser - wStats → quedaba absurdamente ancho
     en pantallas grandes, estirándose y aplastando la altura proporcional.
   - Sim CENTRADO en X igual que el dial (r.left + (r.width - wSim)/2).
   - USER pegado a la izquierda, Stats pegado a la derecha — sin estirar.

   BANDA SIM:
   - Layout: 9 columnas en una sola fila horizontal (antes grid 2×5).
   - Cada need: top (icono + label) sobre bottom (barra + valor).
   - Padding 8px arriba, gap horizontal 14px entre needs.

   ZONA INFERIOR (bottom):
   - Misión Diaria: ANCHO FIJO 320px (antes 1/3 del viewport ≈ 600+).
   - Nivel Siguiente: ANCHO FIJO 360px.
   - Logro Reciente: ancho IGUAL al dial, CENTRADO en X con el dial.
   - Si no caben los 3 → reparte proporcional.
   - Track: ancho EXACTO del dial (antes min(720,r.width-20)).

   COLUMNAS LATERALES:
   - Cap absoluto bajado de 300px → 260px (objetivo: ~220-240 en pantallas anchas).

   Resultado: paneles del overlay ahora se alinean con el dial central como
   una grilla coherente; nada se estira artificialmente al viewport completo.
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
};

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

var _dialPreset = {};

function _icoTexto(label){ return function(ctx,x,y,s,c){ var k=s/22; ctx.font='bold '+Math.round(s*0.38)+'px -apple-system,sans-serif'; ctx.fillStyle=c; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,x,y); }; }

var _DIAL_ITEMS = [
  // ── ACTIVITY ──
  { id:'activity', label:'Activity', accent:'#22d3c8',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-8*k,y+4*k);ctx.lineTo(x-2*k,y-2*k);ctx.lineTo(x+3*k,y+3*k);ctx.lineTo(x+9*k,y-7*k);ctx.strokeStyle=c;ctx.lineWidth=2.4;ctx.lineJoin='round';ctx.lineCap='round';ctx.stroke();},
    subs:[
      {id:'libro',   label:'Libros',     accent:'#ec4899', draw:_icoLibro,
       preset:function(){ _dialPreset={tab:'libro'}; }},
      {id:'movie',   label:'Movies',     accent:'#f59e0b', draw:_icoMovie,
       preset:function(){ _dialPreset={tab:'movie'}; }},
      {id:'norut',   label:'Pendientes', accent:'#8b5cf6', draw:_icoPendiente,
       preset:function(){ _dialPreset={tab:'norut'}; }},
    ]},

  // ── APARTADO ──
  { id:'apartado', label:'Apartado', accent:'#4ade80',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y-2*k,5.5*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x-8*k,y+5*k);ctx.lineTo(x+8*k,y+5*k);ctx.lineTo(x+6*k,y+10*k);ctx.lineTo(x-6*k,y+10*k);ctx.closePath();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();}},

  // ── BANCOS ──
  { id:'bancos', label:'Bancos', accent:'#f59e0b',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-9*k,y+7*k);ctx.lineTo(x+9*k,y+7*k);ctx.moveTo(x-6*k,y-1*k);ctx.lineTo(x-6*k,y+7*k);ctx.moveTo(x,y-1*k);ctx.lineTo(x,y+7*k);ctx.moveTo(x+6*k,y-1*k);ctx.lineTo(x+6*k,y+7*k);ctx.moveTo(x-9*k,y-1*k);ctx.lineTo(x+9*k,y-1*k);ctx.moveTo(x-10*k,y-6*k);ctx.lineTo(x,y-12*k);ctx.lineTo(x+10*k,y-6*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();},
    subsGen:function(){
      var bancos=(window._fijosData||[]).filter(function(f){return f.nombre&&f.nombre!=='P';}).slice(0,5);
      if(!bancos.length) return null;
      return bancos.map(function(f){
        return {id:'bancos', label:f.nombre, accent:'#f59e0b', draw:_icoTexto(f.nombre.slice(0,4)),
          preset:function(){ _dialPreset={tab:'bancos', banco:f.nombre}; }};
      });
    }},

  // ── ENTRENAMIENTO ──
  { id:'entrenamiento', label:'Entrena', accent:'#fb923c',
    draw:function(ctx,x,y,s,c){var k=s/22;[[-9,0,3.5],[9,0,3.5]].forEach(function(p){ctx.beginPath();ctx.arc(x+p[0]*k,y+p[1]*k,p[2]*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2.2;ctx.stroke();});ctx.beginPath();ctx.moveTo(x-5*k,y);ctx.lineTo(x+5*k,y);ctx.strokeStyle=c;ctx.lineWidth=3;ctx.lineCap='round';ctx.stroke();},
    subs:[
      {id:'entrenamiento', label:'Fuerza',      accent:'#fb923c', draw:_icoTexto('💪'),
       preset:function(){ _dialPreset={tab:'entrenamiento',tipo:'Fuerza'}; }},
      {id:'entrenamiento', label:'Cardio',       accent:'#f87171', draw:_icoTexto('🏃'),
       preset:function(){ _dialPreset={tab:'entrenamiento',tipo:'Cardio'}; }},
      {id:'entrenamiento', label:'HIIT',         accent:'#fbbf24', draw:_icoTexto('⚡'),
       preset:function(){ _dialPreset={tab:'entrenamiento',tipo:'HIIT'}; }},
      {id:'entrenamiento', label:'Flex',         accent:'#86efac', draw:_icoTexto('🧘'),
       preset:function(){ _dialPreset={tab:'entrenamiento',tipo:'Flexibilidad'}; }},
      {id:'entrenamiento', label:'Deporte',      accent:'#93c5fd', draw:_icoTexto('⚽'),
       preset:function(){ _dialPreset={tab:'entrenamiento',tipo:'Deporte'}; }},
    ]},

  // ── NUTRICIÓN ──
  { id:'nutricion', label:'Nutrición', accent:'#86efac',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y+2*k,7*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x,y-5*k);ctx.bezierCurveTo(x,y-12*k,x+7*k,y-11*k,x+6*k,y-5*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();},
    subs:[
      {id:'nutricion', label:'Desayuno', accent:'#fbbf24', draw:_icoTexto('☀️'),
       preset:function(){ _dialPreset={tab:'nutricion',momento:'Desayuno'}; }},
      {id:'nutricion', label:'Comida',   accent:'#86efac', draw:_icoTexto('🍽'),
       preset:function(){ _dialPreset={tab:'nutricion',momento:'Comida'}; }},
      {id:'nutricion', label:'Cena',     accent:'#c4b5fd', draw:_icoTexto('🌙'),
       preset:function(){ _dialPreset={tab:'nutricion',momento:'Cena'}; }},
      {id:'nutricion', label:'Snack',    accent:'#f0abfc', draw:_icoTexto('🍎'),
       preset:function(){ _dialPreset={tab:'nutricion',momento:'Snack'}; }},
    ]},

  // ── PATRIMONIO ──
  { id:'patrimonio', label:'Patrimonio', accent:'#c4b5fd',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-10*k,y+8*k);ctx.lineTo(x+10*k,y+8*k);ctx.moveTo(x-6*k,y-1*k);ctx.lineTo(x-6*k,y+8*k);ctx.moveTo(x,y-1*k);ctx.lineTo(x,y+8*k);ctx.moveTo(x+6*k,y-1*k);ctx.lineTo(x+6*k,y+8*k);ctx.moveTo(x-10*k,y-1*k);ctx.lineTo(x+10*k,y-1*k);ctx.moveTo(x-12*k,y-7*k);ctx.lineTo(x,y-13*k);ctx.lineTo(x+12*k,y-7*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();},
    subs:[
      {id:'patrimonio', label:'Banco',     accent:'#4ade80',  draw:_icoAhorro,
       preset:function(){ _dialPreset={tab:'patrimonio',tipo:'ahorro'}; }},
      {id:'patrimonio', label:'Efectivo',  accent:'#fbbf24',  draw:_icoEfectivo,
       preset:function(){ _dialPreset={tab:'patrimonio',tipo:'efectivo'}; }},
      {id:'patrimonio', label:'Inversión', accent:'#c4b5fd',  draw:_icoInversion,
       preset:function(){ _dialPreset={tab:'patrimonio',tipo:'inversion'}; }},
    ]},

  // ── PENSAMIENTO ──
  { id:'pensamiento', label:'Pensa', accent:'#f0abfc',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x-1*k,y-2*k,8*k,Math.PI*.3,Math.PI*2.2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(x+5*k,y+8*k,2.5*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(x+9*k,y+13*k,1.5*k,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();},
    subs:[
      {id:'pensamiento', label:'Emoción',   accent:'#ec4899', draw:_icoTexto('💗'),
       preset:function(){ _dialPreset={tab:'pensamiento',categoria:'Emoción'}; }},
      {id:'pensamiento', label:'Idea',       accent:'#fbbf24', draw:_icoTexto('💡'),
       preset:function(){ _dialPreset={tab:'pensamiento',categoria:'Idea'}; }},
      {id:'pensamiento', label:'Reflexión',  accent:'#8b5cf6', draw:_icoTexto('🔮'),
       preset:function(){ _dialPreset={tab:'pensamiento',categoria:'Reflexión'}; }},
      {id:'pensamiento', label:'Decisión',   accent:'#f59e0b', draw:_icoTexto('⚖'),
       preset:function(){ _dialPreset={tab:'pensamiento',categoria:'Decisión'}; }},
      {id:'pensamiento', label:'Sueño',      accent:'#67e8f9', draw:_icoTexto('💭'),
       preset:function(){ _dialPreset={tab:'pensamiento',categoria:'Sueño'}; }},
    ]},

  // ── PERSONA ──
  { id:'persona', label:'Persona', accent:'#93c5fd',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x-3*k,y-5*k,4*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.arc(x+5*k,y-7*k,3.2*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=1.8;ctx.stroke();ctx.beginPath();ctx.moveTo(x-12*k,y+10*k);ctx.quadraticCurveTo(x-3*k,y+2*k,x+5*k,y+10*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();ctx.beginPath();ctx.moveTo(x+3*k,y+4*k);ctx.quadraticCurveTo(x+11*k,y,x+14*k,y+10*k);ctx.strokeStyle=c;ctx.lineWidth=1.8;ctx.lineCap='round';ctx.stroke();},
    subs:[
      {id:'persona', label:'+ Energía', accent:'#4ade80', draw:_icoTexto('+'),
       preset:function(){ _dialPreset={tab:'persona',energia:1}; }},
      {id:'persona', label:'Neutral',   accent:'#94a3b8', draw:_icoTexto('○'),
       preset:function(){ _dialPreset={tab:'persona',energia:0}; }},
      {id:'persona', label:'− Energía', accent:'#f87171', draw:_icoTexto('−'),
       preset:function(){ _dialPreset={tab:'persona',energia:-1}; }},
    ]},

  // ── EDITAR ──
  { id:'editar', label:'Editar', accent:'#a5b4fc',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/4);ctx.beginPath();ctx.rect(-2.5*k,-9*k,5*k,16*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();ctx.beginPath();ctx.moveTo(-2.5*k,7*k);ctx.lineTo(0,12*k);ctx.lineTo(2.5*k,7*k);ctx.fillStyle=c;ctx.fill();ctx.restore();},
    accionEspecial:true},

  // ── SALUD ──
  { id:'salud', label:'Salud', accent:'#fca5a5',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x,y+9*k);ctx.bezierCurveTo(x-12*k,y,x-12*k,y-9*k,x,y-4*k);ctx.bezierCurveTo(x+12*k,y-9*k,x+12*k,y,x,y+9*k);ctx.strokeStyle=c;ctx.lineWidth=2.2;ctx.lineJoin='round';ctx.stroke();},
    subs:[
      {id:'salud', label:'Cita',        accent:'#67e8f9', draw:_icoTexto('📅'),
       preset:function(){ _dialPreset={tab:'salud',tipo:'Cita'}; }},
      {id:'salud', label:'Síntoma',     accent:'#f87171', draw:_icoTexto('🤒'),
       preset:function(){ _dialPreset={tab:'salud',tipo:'Síntoma'}; }},
      {id:'salud', label:'Medicamento', accent:'#a78bfa', draw:_icoTexto('💊'),
       preset:function(){ _dialPreset={tab:'salud',tipo:'Medicamento'}; }},
      {id:'salud', label:'Resultado',   accent:'#fbbf24', draw:_icoTexto('📋'),
       preset:function(){ _dialPreset={tab:'salud',tipo:'Resultado'}; }},
      {id:'salud', label:'Vacuna',      accent:'#86efac', draw:_icoTexto('💉'),
       preset:function(){ _dialPreset={tab:'salud',tipo:'Vacuna'}; }},
    ]},
];

var _dialOverlay   = null;
var _dialCanvas    = null;
var _dialCtx       = null;
var _dialHovered   = -1;
var _dialSubHov    = -1;
var _dialActiveSub = -1;
var _dialVisible   = false;
var _dialCentroHov  = false;
var _dialPulseT     = 0;
var _dialRAF        = null;
var _subRingProg    = 0;
var _subRingRAF     = null;
var _subRingPrevSub = -1;
var _dialBreathT    = 0;
var _dialBreathRAF  = null;

var _DC = {
  W:920, H:920, CX:460, CY:460,
  R_IN:90,
  R_OUT:310,
  R_SI:328,
  R_SO:420,
  GAP:0.022,
};

// ══════════════════════════════════════════
//  SIMS NEEDS — config y cálculo
// ══════════════════════════════════════════
var _SIMS_NEEDS = [
  { key:'hambre',   label:'Hambre',   icon:'🍔', color:'#FB923C' },
  { key:'energia',  label:'Energía',  icon:'⚡',  color:'#FBBF24' },
  { key:'cuerpo',   label:'Cuerpo',   icon:'💪', color:'#F87171' },
  { key:'higiene',  label:'Higiene',  icon:'🚿', color:'#67E8F9' },
  { key:'mental',   label:'Mental',   icon:'🧠', color:'#C4B5FD' },
  { key:'disfrute', label:'Disfrute', icon:'🎮', color:'#F0ABFC' },
  { key:'entorno',  label:'Entorno',  icon:'🏠', color:'#86EFAC' },
  { key:'social',   label:'Social',   icon:'👥', color:'#93C5FD' },
  { key:'trabajo',  label:'Trabajo',  icon:'💼', color:'#22D3EE' },
];

function _calcSimsNeeds(){
  // Cada need: 0-100. Mezcla de actividad reciente + datos.
  var n = { hambre:50, energia:50, cuerpo:50, higiene:50, mental:50, disfrute:50, entorno:50, social:50, trabajo:50 };
  var act = window._actData;
  if(act){
    // Hábitos personales con tag sims → suma 12 al need correspondiente si tiene check hoy
    var diaKey = ['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];
    (act.habitosPersonal||[]).forEach(function(h){
      if(h.checks && h.checks[diaKey] && h.sims){
        var k = h.sims.toLowerCase().trim();
        if(n.hasOwnProperty(k)) n[k] = Math.min(100, n[k] + 14);
      }
    });
    // Trabajo: hábitos electronics
    var elecDone = (act.habitosElectronics||[]).filter(function(h){
      return h.checks && h.checks[diaKey];
    }).length;
    var elecTotal = (act.habitosElectronics||[]).length || 1;
    n.trabajo = Math.round(40 + (elecDone/elecTotal)*60);
  }
  // Mental: pensamientos recientes
  if(window._pensamientosData && window._pensamientosData.items){
    var pCount = window._pensamientosData.items.length;
    n.mental = Math.min(100, 40 + Math.min(pCount,10)*6);
  }
  // Social: relaciones recientes
  if(window._relacionesData && window._relacionesData.items){
    var hace7 = new Date(); hace7.setDate(hace7.getDate()-7);
    var recientes = window._relacionesData.items.filter(function(r){
      return r.ultimaVez && new Date(r.ultimaVez) >= hace7;
    }).length;
    n.social = Math.min(100, 30 + recientes*15);
  }
  // Disfrute: logros completados
  if(window._logrosData && window._logrosData.items){
    var done = window._logrosData.items.filter(function(l){
      return l.completado==='Sí'||l.completado===true;
    }).length;
    n.disfrute = Math.min(100, 40 + done*8);
  }
  return n;
}

function renderSimsNeeds(targetId){
  var id = targetId || 'hud-sim-needs-grid';
  var el = document.getElementById(id);
  if(!el){
    // Reintentar 3 veces con espera
    if(!renderSimsNeeds._retry) renderSimsNeeds._retry = 0;
    if(renderSimsNeeds._retry < 5){
      renderSimsNeeds._retry++;
      setTimeout(function(){ renderSimsNeeds(id); }, 100);
    }
    return;
  }
  renderSimsNeeds._retry = 0;
  var needs = _calcSimsNeeds();
  el.innerHTML = _SIMS_NEEDS.map(function(s){
    var v = needs[s.key];
    if(v === undefined || v === null) v = 50; // fallback siempre visible
    var col = s.color;
    var lowCol = v < 30 ? '#EF4444' : (v < 60 ? '#FBBF24' : col);
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:0">'+
      '<div style="font-size:18px;line-height:1;filter:drop-shadow(0 0 6px '+col+'66)">'+s.icon+'</div>'+
      '<div style="font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(220,220,240,0.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">'+s.label+'</div>'+
      '<div style="width:100%;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">'+
        '<div style="height:100%;width:'+v+'%;background:'+lowCol+';box-shadow:0 0 6px '+lowCol+'80;transition:width .6s ease;border-radius:2px"></div>'+
      '</div>'+
      '<div style="font-size:11px;font-weight:800;color:'+lowCol+';font-variant-numeric:tabular-nums;text-shadow:0 0 6px '+lowCol+'55">'+v+'</div>'+
    '</div>';
  }).join('');
}
window.renderSimsNeeds = renderSimsNeeds;

// ══════════════════════════════════════════
//  XP / NIVEL / STATS — derivados de actData/logrosData/etc
// ══════════════════════════════════════════
function _calcXPNivel(){
  var xp = 0;
  // Hábitos completados (cualquier check de la semana)
  var act = window._actData;
  if(act){
    (act.habitosPersonal||[]).forEach(function(h){
      if(h.checks){ Object.keys(h.checks).forEach(function(k){ if(h.checks[k]) xp += 25; }); }
    });
    (act.habitosElectronics||[]).forEach(function(h){
      if(h.checks){ Object.keys(h.checks).forEach(function(k){ if(h.checks[k]) xp += 30; }); }
    });
  }
  // Logros completados
  if(window._logrosData && window._logrosData.items){
    window._logrosData.items.forEach(function(l){
      if(l.completado==='Sí'||l.completado===true) xp += 200;
    });
  }
  // Bitácora: pensamientos, relaciones, salud
  if(window._pensamientosData && window._pensamientosData.items){
    xp += window._pensamientosData.items.length * 8;
  }
  if(window._relacionesData && window._relacionesData.items){
    xp += window._relacionesData.items.length * 12;
  }
  if(window._saludData && window._saludData.items){
    xp += window._saludData.items.length * 15;
  }
  // Cada nivel cuesta 1000 XP base, escalando 250 por nivel: 1000, 1250, 1500, ...
  // Aproximación lineal simple: nivel = floor(xp/1000)+1, xpEnNivel = xp % 1000, meta = 1000
  var nivel = Math.max(1, Math.floor(xp / 1000) + 1);
  var xpActual = xp % 1000;
  var xpMeta = 1000;
  return { xpTotal:xp, nivel:nivel, xpActual:xpActual, xpMeta:xpMeta };
}

function _calcRachaCreditos(){
  // Racha: días consecutivos con al menos 1 hábito personal cumplido (aproximación)
  // Como solo tenemos checks por día de la semana actual, contamos días con check de la semana
  var racha = 0;
  var act = window._actData;
  if(act && act.habitosPersonal){
    var dias = ['L','M','W','J','V','S','D'];
    var hoyIdx = (new Date().getDay()+6)%7;
    // Cuenta días hacia atrás desde hoy mientras haya al menos un check
    for(var i=hoyIdx; i>=0; i--){
      var dk = dias[i];
      var hayCheck = act.habitosPersonal.some(function(h){ return h.checks && h.checks[dk]; });
      if(hayCheck) racha++;
      else break;
    }
  }
  // Créditos: 100 por logro completado + 10 por hábito hoy
  var creditos = 0;
  if(window._logrosData && window._logrosData.items){
    creditos += window._logrosData.items.filter(function(l){ return l.completado==='Sí'||l.completado===true; }).length * 100;
  }
  if(act){
    var diaKey = ['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];
    creditos += (act.habitosPersonal||[]).filter(function(h){ return h.checks && h.checks[diaKey]; }).length * 10;
    creditos += (act.habitosElectronics||[]).filter(function(h){ return h.checks && h.checks[diaKey]; }).length * 15;
  }
  // Energía: derivada del need 'energia' del Sim
  var n = (typeof _calcSimsNeeds==='function') ? _calcSimsNeeds() : { energia:50 };
  var energia = n.energia || 50;
  return { racha:racha, creditos:creditos, energia:energia };
}

function _calcMisionDiaria(){
  // Misión: completar X hábitos de hoy. X = total de hábitos personales hoy.
  var act = window._actData;
  if(!act) return { hechos:0, total:3, label:'Registra 3 hábitos hoy', recompensa:'+50 XP' };
  var diaKey = ['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];
  var hechos = (act.habitosPersonal||[]).filter(function(h){ return h.checks && h.checks[diaKey]; }).length;
  var total  = (act.habitosPersonal||[]).length || 3;
  var meta   = Math.min(total, 3);
  return {
    hechos: Math.min(hechos, meta),
    total: meta,
    label: 'Completa '+meta+' hábitos hoy',
    recompensa: '+'+(meta*25)+' XP',
  };
}

function _calcLogroReciente(){
  // Logro reciente NO completado con mayor avance
  var lg = window._logrosData;
  if(!lg || !lg.items || !lg.items.length) return { titulo:'—', avance:0 };
  var pendientes = lg.items.filter(function(l){ return !(l.completado==='Sí'||l.completado===true); });
  if(!pendientes.length){
    var ult = lg.items[lg.items.length-1];
    return { titulo:(ult && ult.titulo)||'—', avance:100 };
  }
  // Tomar el de mayor avance
  pendientes.sort(function(a,b){ return (b.avance||0)-(a.avance||0); });
  var p = pendientes[0];
  return { titulo:p.titulo||'—', avance:Math.round(p.avance||0) };
}

function _calcNivelSiguiente(){
  var x = _calcXPNivel();
  var pct = Math.round((x.xpActual/x.xpMeta)*100);
  var dots = 8;
  var dotsLlenos = Math.min(dots, Math.round((pct/100)*dots));
  return {
    nivelAct: x.nivel,
    nivelSig: x.nivel+1,
    xpFalta: x.xpMeta - x.xpActual,
    pct: pct,
    dots: dots,
    dotsLlenos: dotsLlenos,
    creditosBonus: 250,
  };
}

// ══════════════════════════════════════════
//  RENDER BANDA SIM ESTILO SIMS (2x5 con barras horizontales)
// ══════════════════════════════════════════
function renderSimsBandSimsStyle(targetId){
  var id = targetId || 'hud-sim-band-grid';
  var el = document.getElementById(id);
  if(!el){
    if(!renderSimsBandSimsStyle._retry) renderSimsBandSimsStyle._retry = 0;
    if(renderSimsBandSimsStyle._retry < 5){
      renderSimsBandSimsStyle._retry++;
      setTimeout(function(){ renderSimsBandSimsStyle(id); }, 100);
    }
    return;
  }
  renderSimsBandSimsStyle._retry = 0;
  var needs = _calcSimsNeeds();
  // Layout: cada need en una fila horizontal compacta — icono + label + barra + valor
  // Estructura: barra ocupa el espacio principal (flex:2), label a la izquierda
  el.innerHTML = _SIMS_NEEDS.map(function(s){
    var v = needs[s.key];
    if(v === undefined || v === null) v = 50;
    var col = s.color;
    var barCol = v < 30 ? '#EF4444' : (v < 55 ? '#FBBF24' : col);
    return ''+
      '<div class="hud-need">'+
        '<div class="hud-need-top">'+
          '<span class="hud-need-ico" style="color:'+col+';filter:drop-shadow(0 0 4px '+col+'88)">'+s.icon+'</span>'+
          '<span class="hud-need-l">'+s.label+'</span>'+
        '</div>'+
        '<div class="hud-need-bot">'+
          '<div class="hud-need-bar-wrap">'+
            '<div class="hud-need-bar" style="width:'+v+'%;background:linear-gradient(90deg,'+barCol+'88,'+barCol+');box-shadow:0 0 6px '+barCol+'80"></div>'+
          '</div>'+
          '<span class="hud-need-v" style="color:'+barCol+'">'+v+'<span class="max">/100</span></span>'+
        '</div>'+
      '</div>';
  }).join('');
}
window.renderSimsBandSimsStyle = renderSimsBandSimsStyle;

function _crearDialOverlay(){
  if(_dialOverlay) return;

  _dialOverlay = document.createElement('div');
  _dialOverlay.id = 'dial-overlay';

  _dialCanvas = document.createElement('canvas');
  _dialCanvas.width  = _DC.W;
  _dialCanvas.height = _DC.H;
  _dialCanvas.style.cssText = 'display:block;cursor:pointer;width:min(720px,50vw);height:min(720px,50vw);position:relative;pointer-events:auto;z-index:1';
  _dialCtx = _dialCanvas.getContext('2d');

  _dialOverlay.style.cssText = [
    'position:fixed','inset:0','z-index:9000',
    'display:none','align-items:center','justify-content:center',
    'opacity:0','pointer-events:none',
    'background:radial-gradient(ellipse at center,rgba(80,40,140,0.15) 0%,rgba(4,4,14,0.65) 100%)',
    'backdrop-filter:blur(28px) saturate(160%) brightness(0.68)',
    '-webkit-backdrop-filter:blur(28px) saturate(160%) brightness(0.68)',
  ].join(';');

  // ── Glow ambiental ──
  var _glowEl = document.createElement('div');
  _glowEl.id = 'dial-ambient';
  _glowEl.style.cssText = [
    'position:absolute','inset:0','pointer-events:none','z-index:0',
    'background:radial-gradient(ellipse 600px 600px at 50% 50%, rgba(120,80,200,0.06) 0%, transparent 70%)',
    'animation:dialBreath 4s ease-in-out infinite',
  ].join(';');
  if(!document.getElementById('dial-keyframes')){
    var ks = document.createElement('style');
    ks.id = 'dial-keyframes';
    ks.textContent = [
      '@keyframes dialBreath{0%,100%{opacity:.6;transform:scale(1);}50%{opacity:1;transform:scale(1.08);}}',
      '@keyframes dialGlowPulse{0%,100%{box-shadow:0 0 0 1px rgba(120,80,200,0.08),0 4px 32px rgba(0,0,0,0.5);}50%{box-shadow:0 0 0 1px rgba(140,100,220,0.20),0 4px 48px rgba(80,40,140,0.3),0 0 60px rgba(120,80,200,0.08);}}',
      '.hud-panel-glow{animation:dialGlowPulse 4s ease-in-out infinite;}',
    ].join('');
    document.head.appendChild(ks);
  }
  _dialOverlay.appendChild(_glowEl);

  // ── Keyframes mini-panels ──
  (function(){
    if(document.getElementById('hud-mini-kf')) return;
    var s=document.createElement('style'); s.id='hud-mini-kf';
    s.textContent=[
      '@keyframes miniBreath{',
        '0%,100%{border-color:var(--pc-dim);box-shadow:0 8px 32px rgba(0,0,0,0.65),0 0 24px var(--pc-glow),inset 0 1px 0 var(--pc-dim);}',
        '50%{border-color:var(--pc-mid);box-shadow:0 8px 40px rgba(0,0,0,0.75),0 0 48px var(--pc-glow),inset 0 1px 0 var(--pc-mid);}',
      '}',
      '@keyframes topPulse{0%,100%{opacity:.6}50%{opacity:1}}',
      '@keyframes hudValIn{0%{opacity:0;transform:translateY(3px)}100%{opacity:1;transform:none}}',
      '@keyframes hudDotPulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.5);opacity:1}}',
    ].join('');
    document.head.appendChild(s);
  })();

  // ── Crear panel flotante ──
  // accentColor: hex (#22C55E). glowColor: rgba string (compat).
  function _mkFloatPanel(id, accentColor, glowColor){
    // Computar versiones rgba del accent (hex → rgba con alpha variable)
    function _ax(a){
      var h = accentColor.replace('#','');
      if(h.length===3) h = h.split('').map(function(c){return c+c;}).join('');
      var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
      return 'rgba('+r+','+g+','+b+','+a+')';
    }
    var p = document.createElement('div');
    p.id  = id;
    p.style.cssText = [
      'position:fixed','z-index:9001',
      'background:rgba(10,7,22,0.92)',
      // Borde principal del COLOR del panel (no genérico violeta)
      'border:1.5px solid '+_ax(0.45),
      'backdrop-filter:blur(22px) saturate(170%)',
      '-webkit-backdrop-filter:blur(22px) saturate(170%)',
      'border-radius:14px',
      'opacity:0','visibility:hidden',
      'transition:opacity 500ms ease-out',
      'overflow:hidden',
      'font-family:Manrope,-apple-system,BlinkMacSystemFont,sans-serif',
      'animation:miniBreath 4s ease-in-out infinite',
      // Glow exterior y sombra base
      'box-shadow:0 8px 32px rgba(0,0,0,0.65),0 0 32px '+_ax(0.18)+',inset 0 1px 0 '+_ax(0.20),
    ].join(';');
    // Variables CSS del color del panel para uso en animación (miniBreath)
    p.style.setProperty('--pc-dim',  _ax(0.30));
    p.style.setProperty('--pc-mid',  _ax(0.65));
    p.style.setProperty('--pc-glow', _ax(0.22));
    p._accent = accentColor;

    // Banda superior luminosa (top accent line)
    var top = document.createElement('div');
    top.style.cssText = 'position:absolute;top:0;left:0;right:0;height:2px;'+
      'background:linear-gradient(90deg,transparent 0%,'+accentColor+' 20%,'+accentColor+' 80%,transparent 100%);'+
      'box-shadow:0 0 12px '+accentColor+',0 0 24px '+_ax(0.50)+';'+
      'animation:topPulse 3s ease-in-out infinite;z-index:2;pointer-events:none';
    p.appendChild(top);

    // Glow interno sutil del color del panel
    var inner_glow = document.createElement('div');
    inner_glow.style.cssText = 'position:absolute;inset:0;border-radius:14px;pointer-events:none;z-index:0;'+
      'box-shadow:inset 0 0 24px '+_ax(0.06)+';'+
      'background:radial-gradient(ellipse at top,'+_ax(0.08)+' 0%,transparent 50%)';
    p.appendChild(inner_glow);

    var inner = document.createElement('div');
    inner.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column';
    inner.id = id+'-inner';
    p.appendChild(inner);

    return p;
  }

  // ══════════════════════════════════════════
  //  SISTEMA DE DISEÑO — tokens y helpers
  // ══════════════════════════════════════════
  // Colores: cada panel tiene un accent. Funciones helper para variantes.
  function _hex2rgb(h){
    h = h.replace('#','');
    if(h.length===3) h = h.split('').map(function(c){return c+c;}).join('');
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
  }
  function _rgba(c, a){
    var rgb = _hex2rgb(c);
    return 'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+a+')';
  }

  // Inyectar fuentes y CSS base de los paneles (una sola vez)
  if(!document.getElementById('hud-design-css')){
    var lk = document.createElement('link');
    lk.rel = 'stylesheet';
    lk.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap';
    document.head.appendChild(lk);
    var ds = document.createElement('style');
    ds.id = 'hud-design-css';
    ds.textContent = [
      '.hud-pnl{font-family:Manrope,-apple-system,BlinkMacSystemFont,sans-serif;color:#E5E7EB}',
      '.hud-pnl .num{font-family:JetBrains Mono,ui-monospace,monospace;font-variant-numeric:tabular-nums}',
      '.hud-pnl .dim{opacity:.45}',
      // header
      '.hud-h{display:flex;align-items:center;gap:10px;padding:14px 16px 12px}',
      '.hud-h-ico{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.hud-h-ico i{font-size:12px}',
      '.hud-h-t{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;flex:1}',
      '.hud-h-k{font-size:14px;font-weight:800;color:rgba(220,220,240,0.35);letter-spacing:.10em;cursor:default;line-height:0}',
      '.hud-h-bar{height:1px;margin:0 16px;background:linear-gradient(90deg,var(--ac-50),transparent)}',
      // hero
      '.hud-hero{padding:14px 16px 10px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}',
      '.hud-hero-l{flex:1;min-width:0}',
      '.hud-hero-lbl{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(200,208,230,0.40);margin-bottom:6px}',
      '.hud-hero-v{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1;font-family:JetBrains Mono,ui-monospace,monospace}',
      '.hud-hero-v .cents{font-size:18px;opacity:.45;font-weight:700}',
      '.hud-hero-chip{padding:5px 9px;border-radius:7px;font-size:10px;font-weight:800;letter-spacing:.06em;display:flex;flex-direction:column;align-items:flex-end;gap:1px;line-height:1.1;flex-shrink:0}',
      '.hud-hero-chip .chip-sub{font-size:8px;font-weight:600;opacity:.7;text-transform:uppercase;letter-spacing:.10em}',
      // mini-bar (fondo emergencia)
      '.hud-mini{padding:0 16px 14px}',
      '.hud-mini-row{display:flex;align-items:center;justify-content:space-between;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(200,208,230,0.50);margin-bottom:6px}',
      '.hud-mini-row .v{font-size:11px;font-weight:800;color:var(--ac);letter-spacing:0;text-transform:none;font-family:JetBrains Mono,monospace}',
      '.hud-mini-bar{height:5px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.04)}',
      '.hud-mini-fill{height:100%;border-radius:999px;transition:width .8s ease}',
      // row
      '.hud-row{display:flex;align-items:center;gap:10px;padding:8px 16px}',
      '.hud-row + .hud-row{border-top:1px solid rgba(255,255,255,0.04)}',
      '.hud-row-ico{width:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px}',
      '.hud-row-l{flex:1;min-width:0;font-size:13px;font-weight:600;color:rgba(220,224,235,0.78);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-row-bar{width:60px;height:3px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;flex-shrink:0}',
      '.hud-row-bar > div{height:100%;width:0;border-radius:999px;transition:width .8s ease}',
      '.hud-row-v{font-size:13px;font-weight:700;letter-spacing:0;flex-shrink:0;text-align:right;min-width:78px;font-family:JetBrains Mono,monospace}',
      // maslow
      '.hud-mas{padding:8px 16px}',
      '.hud-mas + .hud-mas{border-top:1px solid rgba(255,255,255,0.04)}',
      '.hud-mas-top{display:flex;align-items:center;gap:8px;margin-bottom:5px}',
      '.hud-mas-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;animation:hudDotPulse 2.5s ease-in-out infinite}',
      '.hud-mas-l{flex:1;font-size:13px;font-weight:600;color:rgba(220,224,235,0.78);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-mas-v{font-size:12px;font-weight:700;letter-spacing:0;text-align:right;font-family:JetBrains Mono,monospace}',
      '.hud-mas-bar{height:3px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;margin-left:15px}',
      '.hud-mas-bar > div{height:100%;width:0;border-radius:999px;transition:width .9s ease}',
      // need (sims) - una columna por need en fila horizontal
      '.hud-need{display:flex;flex-direction:column;gap:5px;min-width:0}',
      '.hud-need-top{display:flex;align-items:center;gap:6px;min-width:0}',
      '.hud-need-ico{font-size:13px;flex-shrink:0;width:14px;display:flex;align-items:center;justify-content:center;line-height:1}',
      '.hud-need-l{flex:1;font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(220,224,235,0.62);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-need-bot{display:flex;align-items:center;gap:6px;min-width:0}',
      '.hud-need-bar-wrap{flex:1;height:7px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);position:relative;min-width:0;box-shadow:inset 0 1px 2px rgba(0,0,0,0.4)}',
      '.hud-need-bar{height:100%;border-radius:999px;transition:width .8s ease;position:relative}',
      '.hud-need-bar::after{content:"";position:absolute;top:1px;left:4px;right:4px;height:2px;background:rgba(255,255,255,0.40);border-radius:999px;filter:blur(0.6px)}',
      '.hud-need-v{font-size:10px;font-weight:800;font-family:JetBrains Mono,monospace;flex-shrink:0;text-align:right;line-height:1}',
      '.hud-need-v .max{opacity:.40;font-weight:700;font-size:8px}',
      // CTA pie
      '.hud-cta{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;cursor:pointer;border-top:1px solid var(--ac-15);transition:padding .15s,background .15s}',
      '.hud-cta:hover{background:var(--ac-08);padding-left:20px}',
      '.hud-cta .lbl{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}',
      '.hud-cta .chev{font-size:9px;opacity:.7}',
      // duo (Activity+Logros)
      '.hud-trio{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px 16px}',
      '.hud-trio-cell{padding:10px 8px;border-radius:9px;border:1px solid;text-align:left;position:relative;overflow:hidden;background:rgba(255,255,255,0.02)}',
      '.hud-trio-cell .top{position:absolute;top:0;left:0;right:0;height:2px}',
      '.hud-trio-cell .lbl{font-size:8px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;margin-bottom:5px;opacity:.85}',
      '.hud-trio-cell .v{font-size:18px;font-weight:800;line-height:1;font-family:JetBrains Mono,monospace}',
      // racha fires
      '.hud-fires-row{display:flex;align-items:center;gap:8px;padding:10px 16px 14px;border-top:1px solid rgba(255,255,255,0.04)}',
      '.hud-fires-row > i.lead{font-size:14px}',
      '.hud-fires-row .lbl{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:rgba(220,224,235,0.55);flex-shrink:0}',
      '.hud-fires-row .fires{display:flex;align-items:center;gap:5px;flex:1;justify-content:flex-end}',
      '.hud-fires-row .fires i{font-size:13px;color:rgba(120,120,130,0.30)}',
      '.hud-fires-row .fires i.on{color:#FB923C;filter:drop-shadow(0 0 4px #FB923C)}',
      // nav grid 2x3
      '.hud-navg{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 16px}',
      '.hud-navg-it{display:flex;align-items:center;gap:9px;padding:10px;border-radius:9px;border:1px solid;cursor:pointer;transition:transform .15s,box-shadow .15s,background .15s}',
      '.hud-navg-it:hover{transform:translateY(-1px)}',
      '.hud-navg-it .ico{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}',
      '.hud-navg-it .lbl{flex:1;font-size:12px;font-weight:700;color:rgba(220,224,235,0.80);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-navg-it .ch{font-size:9px;opacity:.55}',
      // user panel
      '.hud-user{display:flex;align-items:center;gap:14px;padding:14px 16px;height:100%;box-sizing:border-box}',
      '.hud-user-av{width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:0;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);flex-shrink:0;position:relative}',
      '.hud-user-av i{font-size:18px}',
      '.hud-user-c{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}',
      '.hud-user-row1{display:flex;align-items:baseline;gap:10px}',
      '.hud-user-name{font-size:18px;font-weight:800;letter-spacing:.06em;color:#fff}',
      '.hud-user-niv{font-size:11px;font-weight:700;color:rgba(220,224,235,0.65);letter-spacing:.04em}',
      '.hud-user-niv-badge{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:3px;font-size:8px}',
      '.hud-user-bar{height:5px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;width:100%}',
      '.hud-user-bar > div{height:100%;border-radius:999px;transition:width .8s ease}',
      '.hud-user-xp{font-size:10px;font-weight:700;color:rgba(220,224,235,0.55);text-align:right;font-family:JetBrains Mono,monospace}',
      // sim panel band
      '.hud-sim-h{display:flex;align-items:center;gap:10px;padding:13px 18px 8px}',
      '.hud-sim-h .ico{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.hud-sim-h .ico i{font-size:11px}',
      '.hud-sim-h .t{font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;flex:1}',
      '.hud-sim-h .meta{font-size:9px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.40)}',
      '.hud-sim-grid{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:0 14px;padding:8px 18px 14px}',
      // stats panel
      '.hud-stats-row{display:flex;align-items:stretch;justify-content:space-around;gap:6px;padding:12px 14px;height:100%;box-sizing:border-box}',
      '.hud-stats-cell{flex:1;display:flex;align-items:center;gap:10px;min-width:0;padding:0 4px}',
      '.hud-stats-cell + .hud-stats-cell{border-left:1px solid rgba(255,255,255,0.06)}',
      '.hud-stats-ico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.hud-stats-ico i{font-size:15px}',
      '.hud-stats-txt{display:flex;flex-direction:column;gap:1px;min-width:0}',
      '.hud-stats-v{font-size:20px;font-weight:800;line-height:1;font-family:JetBrains Mono,monospace}',
      '.hud-stats-v .max{opacity:.40;font-weight:700;font-size:11px;margin-left:2px}',
      '.hud-stats-l{font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(220,224,235,0.45)}',
      // bottom cards (mision, logro, nivel)
      '.hud-card{display:flex;align-items:center;gap:12px;padding:13px 16px}',
      '.hud-card-ico{width:42px;height:42px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:10px}',
      '.hud-card-ico-hex{width:42px;height:42px;display:flex;align-items:center;justify-content:center;flex-shrink:0;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%)}',
      '.hud-card-ico-hex span{font-size:15px;font-weight:800;color:#fff}',
      '.hud-card-ico i{font-size:16px}',
      '.hud-card-c{flex:1;display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.hud-card-h{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.hud-card-l{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}',
      '.hud-card-r{font-size:11px;font-weight:800;font-family:JetBrains Mono,monospace}',
      '.hud-card-sub{font-size:11px;font-weight:600;color:rgba(220,224,235,0.62);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-card-bar{height:5px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden}',
      '.hud-card-bar > div{height:100%;width:0;border-radius:999px;transition:width .8s ease}',
      '.hud-card-end{font-size:10px;font-weight:800;letter-spacing:.06em;flex-shrink:0;font-family:JetBrains Mono,monospace}',
      // track
      '.hud-track{display:flex;align-items:center;gap:18px;padding:11px 18px;height:100%;box-sizing:border-box}',
      '.hud-track-cur{display:flex;align-items:center;gap:10px;flex-shrink:0}',
      '.hud-track-hex{width:38px;height:38px;display:flex;align-items:center;justify-content:center;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);flex-shrink:0}',
      '.hud-track-hex span{font-size:14px;font-weight:800;color:#fff}',
      '.hud-track-cur-info{display:flex;flex-direction:column;gap:2px}',
      '.hud-track-cur-l{font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.45)}',
      '.hud-track-cur-v{font-size:13px;font-weight:800;font-family:JetBrains Mono,monospace}',
      '.hud-track-mid{display:flex;align-items:center;gap:8px;flex:1;justify-content:center;flex-wrap:nowrap}',
    ].join('\n');
    document.head.appendChild(ds);
  }

  // ── Helpers de contenido ──
  // Header de panel: icono en caja + título + menú "···"
  function _pH(label, color, icon){
    return '<div class="hud-h" style="--ac:'+color+'">'+
      '<div class="hud-h-ico" style="background:'+_rgba(color,0.14)+';border:1px solid '+_rgba(color,0.40)+';box-shadow:0 0 12px '+_rgba(color,0.20)+'">'+
        '<i class="fas '+icon+'" style="color:'+color+';filter:drop-shadow(0 0 4px '+color+')"></i>'+
      '</div>'+
      '<span class="hud-h-t" style="color:'+color+';text-shadow:0 0 12px '+_rgba(color,0.50)+'">'+label+'</span>'+
      '<span class="hud-h-k">···</span>'+
    '</div>'+
    '<div class="hud-h-bar" style="--ac-50:'+_rgba(color,0.40)+'"></div>';
  }

  // Pie CTA sutil (link, no banner)
  function _pCTA(label, color, fn){
    var clickable = fn && typeof window[fn] === 'function';
    var onclick = clickable ? ('event.stopPropagation();window.'+fn+'();') : '';
    return '<div '+(clickable?('onclick="'+onclick+'"'):'')+' class="hud-cta" style="'+
      '--ac-15:'+_rgba(color,0.12)+';'+
      '--ac-08:'+_rgba(color,0.08)+';'+
      'cursor:'+(clickable?'pointer':'default')+'">'+
      '<span class="lbl" style="color:'+color+';text-shadow:0 0 6px '+_rgba(color,0.40)+'">'+label+'</span>'+
      '<i class="fas fa-chevron-right chev" style="color:'+color+'"></i>'+
    '</div>';
  }

  // Hero financiero: label arriba + número grande + chip a la derecha (opcional)
  function _hero(id, color, sublabel, chipId){
    return '<div class="hud-hero">'+
      '<div class="hud-hero-l">'+
        '<div class="hud-hero-lbl">'+sublabel+'</div>'+
        '<div id="'+id+'" class="hud-hero-v" style="color:'+color+';text-shadow:0 0 24px '+_rgba(color,0.40)+'">—</div>'+
      '</div>'+
      (chipId ? '<div id="'+chipId+'" class="hud-hero-chip" style="display:none"></div>' : '')+
    '</div>';
  }

  // Mini barra (Fondo emergencia, Ahorro %)
  function _miniBar(label, valId, barId, color){
    return '<div class="hud-mini">'+
      '<div class="hud-mini-row" style="--ac:'+color+'">'+
        '<span>'+label+'</span>'+
        '<span class="v" id="'+valId+'" style="color:'+color+'">—</span>'+
      '</div>'+
      '<div class="hud-mini-bar">'+
        '<div id="'+barId+'" class="hud-mini-fill" style="background:linear-gradient(90deg,'+color+','+_rgba(color,0.65)+');box-shadow:0 0 8px '+_rgba(color,0.50)+'"></div>'+
      '</div>'+
    '</div>';
  }

  // Row con icono FA, label y valor
  function _row(label, id, color, barId, faIcon){
    return '<div class="hud-row">'+
      '<span class="hud-row-ico"><i class="fas '+(faIcon||'fa-circle')+'" style="color:'+color+';font-size:'+(faIcon?'11px':'5px')+';filter:drop-shadow(0 0 4px '+color+')"></i></span>'+
      '<span class="hud-row-l">'+label+'</span>'+
      (barId
        ? '<div class="hud-row-bar"><div id="'+barId+'" style="background:'+color+';box-shadow:0 0 4px '+_rgba(color,0.50)+'"></div></div>'
        : '')+
      '<span id="'+id+'" class="hud-row-v" style="color:'+color+'">—</span>'+
    '</div>';
  }

  // Maslow row con dot
  function _maslow(label, id, barId, color){
    return '<div class="hud-mas">'+
      '<div class="hud-mas-top">'+
        '<span class="hud-mas-dot" style="background:'+color+';box-shadow:0 0 7px '+color+'"></span>'+
        '<span class="hud-mas-l">'+label+'</span>'+
        '<span id="'+id+'" class="hud-mas-v" style="color:'+color+'">—</span>'+
      '</div>'+
      '<div class="hud-mas-bar"><div id="'+barId+'" style="background:'+color+';box-shadow:0 0 6px '+_rgba(color,0.50)+'"></div></div>'+
    '</div>';
  }

  // Trio cell (Hábitos / Logros / Racha)
  function _trioCell(id, label, value, color){
    return '<div class="hud-trio-cell" style="border-color:'+_rgba(color,0.30)+';background:'+_rgba(color,0.06)+'">'+
      '<div class="top" style="background:'+color+';box-shadow:0 0 8px '+color+';opacity:.7"></div>'+
      '<div class="lbl" style="color:'+color+'">'+label+'</div>'+
      '<div id="'+id+'" class="v" style="color:'+color+';text-shadow:0 0 10px '+_rgba(color,0.40)+'">'+(value||'—')+'</div>'+
    '</div>';
  }

  // Nav grid item
  function _navG(label, icon, color, fn){
    var b = document.createElement('div');
    b.className = 'hud-navg-it';
    b.style.borderColor = _rgba(color,0.25);
    b.style.background = _rgba(color,0.05);
    b.innerHTML =
      '<div class="ico" style="background:'+_rgba(color,0.14)+';border:1px solid '+_rgba(color,0.35)+'">'+
        '<i class="fas '+icon+'" style="color:'+color+';filter:drop-shadow(0 0 3px '+color+')"></i>'+
      '</div>'+
      '<span class="lbl">'+label+'</span>'+
      '<i class="fas fa-chevron-right ch" style="color:'+color+'"></i>';
    b.addEventListener('mouseenter',function(){ b.style.background = _rgba(color,0.12); b.style.boxShadow = '0 4px 14px '+_rgba(color,0.20); });
    b.addEventListener('mouseleave',function(){ b.style.background = _rgba(color,0.05); b.style.boxShadow = 'none'; });
    b.addEventListener('click',function(e){ e.stopPropagation(); cerrarDial(); if(typeof window[fn]==='function') window[fn](); });
    return b;
  }

  // ══════════════════════════════════════
  //  ZONA SUPERIOR
  // ══════════════════════════════════════

  // ── _pUser (top-left): hexágono + USER + Nivel + barra XP ──
  var _pUser = _mkFloatPanel('hud-user','#A78BFA','rgba(167,139,250,0.15)');
  document.body.appendChild(_pUser);
  _pUser.classList.add('hud-pnl');
  _pUser.style.animationDelay = '0s';
  _pUser.style.borderRadius = '14px';
  document.getElementById('hud-user-inner').innerHTML =
    '<div class="hud-user">'+
      '<div class="hud-user-av" style="background:radial-gradient(circle,'+_rgba('#A78BFA',0.22)+','+_rgba('#A78BFA',0.05)+');border:1.5px solid #A78BFA;box-shadow:0 0 16px '+_rgba('#A78BFA',0.45)+',inset 0 0 8px '+_rgba('#A78BFA',0.18)+'">'+
        '<i class="fas fa-user" style="color:#fff;text-shadow:0 0 8px #A78BFA"></i>'+
      '</div>'+
      '<div class="hud-user-c">'+
        '<div class="hud-user-row1">'+
          '<span class="hud-user-name">USER</span>'+
          '<span class="hud-user-niv">Nivel <span id="_hud-user-nivel">1</span></span>'+
          '<span class="hud-user-niv-badge" style="background:'+_rgba('#A78BFA',0.20)+';border:1px solid '+_rgba('#A78BFA',0.45)+';color:#A78BFA"><i class="fas fa-shield-halved"></i></span>'+
        '</div>'+
        '<div class="hud-user-bar"><div id="_hud-user-xpbar" style="background:linear-gradient(90deg,#A78BFA,#C084FC);box-shadow:0 0 6px '+_rgba('#A78BFA',0.55)+'"></div></div>'+
        '<div class="hud-user-xp" id="_hud-user-xp">0 / 1,000 XP</div>'+
      '</div>'+
    '</div>';

  // ── _pSim (top-center): banda Sims, 9 needs en grid 2 cols ──
  var _pSim = _mkFloatPanel('hud-sim-band','#FBBF24','rgba(251,191,36,0.15)');
  document.body.appendChild(_pSim);
  _pSim.classList.add('hud-pnl');
  _pSim.style.animationDelay = '0.4s';
  _pSim.style.borderRadius = '14px';
  document.getElementById('hud-sim-band-inner').innerHTML =
    '<div class="hud-sim-h">'+
      '<div class="ico" style="background:'+_rgba('#FBBF24',0.16)+';border:1px solid '+_rgba('#FBBF24',0.45)+';box-shadow:0 0 12px '+_rgba('#FBBF24',0.30)+'">'+
        '<i class="fas fa-heart-pulse" style="color:#FBBF24"></i>'+
      '</div>'+
      '<span class="t" style="color:#FBBF24;text-shadow:0 0 10px '+_rgba('#FBBF24',0.50)+'">Estado del Sim</span>'+
      '<span class="meta">9 needs</span>'+
    '</div>'+
    '<div id="hud-sim-band-grid" class="hud-sim-grid"></div>';
  if(typeof renderSimsBandSimsStyle === 'function') renderSimsBandSimsStyle('hud-sim-band-grid');

  // ── _pStats (top-right): Energía / Racha / Créditos en 3 cells ──
  var _pStats = _mkFloatPanel('hud-stats','#FBBF24','rgba(251,191,36,0.15)');
  document.body.appendChild(_pStats);
  _pStats.classList.add('hud-pnl');
  _pStats.style.animationDelay = '0.8s';
  _pStats.style.borderRadius = '14px';
  document.getElementById('hud-stats-inner').innerHTML =
    '<div class="hud-stats-row">'+
      // Energía
      '<div class="hud-stats-cell">'+
        '<div class="hud-stats-ico" style="background:'+_rgba('#FBBF24',0.14)+';border:1px solid '+_rgba('#FBBF24',0.40)+';box-shadow:0 0 12px '+_rgba('#FBBF24',0.25)+'">'+
          '<i class="fas fa-bolt" style="color:#FBBF24;filter:drop-shadow(0 0 4px #FBBF24)"></i>'+
        '</div>'+
        '<div class="hud-stats-txt">'+
          '<span class="hud-stats-v" style="color:#FBBF24"><span id="_hud-energia">—</span><span class="max">/100</span></span>'+
          '<span class="hud-stats-l">Energía</span>'+
        '</div>'+
      '</div>'+
      // Racha
      '<div class="hud-stats-cell">'+
        '<div class="hud-stats-ico" style="background:'+_rgba('#FB923C',0.14)+';border:1px solid '+_rgba('#FB923C',0.40)+';box-shadow:0 0 12px '+_rgba('#FB923C',0.25)+'">'+
          '<i class="fas fa-fire" style="color:#FB923C;filter:drop-shadow(0 0 4px #FB923C)"></i>'+
        '</div>'+
        '<div class="hud-stats-txt">'+
          '<span class="hud-stats-v" style="color:#FB923C"><span id="_hud-racha-dias">—</span><span class="max"> días</span></span>'+
          '<span class="hud-stats-l">Racha actual</span>'+
        '</div>'+
      '</div>'+
      // Créditos
      '<div class="hud-stats-cell">'+
        '<div class="hud-stats-ico" style="background:'+_rgba('#22D3EE',0.14)+';border:1px solid '+_rgba('#22D3EE',0.40)+';box-shadow:0 0 12px '+_rgba('#22D3EE',0.25)+'">'+
          '<i class="fas fa-gem" style="color:#22D3EE;filter:drop-shadow(0 0 4px #22D3EE)"></i>'+
        '</div>'+
        '<div class="hud-stats-txt">'+
          '<span id="_hud-creditos" class="hud-stats-v" style="color:#22D3EE">—</span>'+
          '<span class="hud-stats-l">Créditos</span>'+
        '</div>'+
      '</div>'+
    '</div>';

  // ══════════════════════════════════════
  //  COLUMNA IZQUIERDA
  // ══════════════════════════════════════

  // ── Panel 1: Patrimonio ──
  var _p1 = _mkFloatPanel('hud-patrimonio','#22C55E','rgba(34,197,94,0.15)');
  document.body.appendChild(_p1);
  _p1.classList.add('hud-pnl');
  _p1.style.animationDelay = '0s';
  document.getElementById('hud-patrimonio-inner').innerHTML =
    _pH('Patrimonio','#22C55E','fa-landmark') +
    _hero('_hud-saldo','#22C55E','Disponible hoy','_hud-saldo-chip') +
    _miniBar('Fondo emergencia','_hud-fondo-pct','_hud-fondo-bar','#22C55E') +
    _row('BBVA',     '_hud-bbva',  '#4ADE80','_hud-bbva-bar','fa-building-columns') +
    _row('BEATS',    '_hud-beats', '#86EFAC','_hud-beats-bar','fa-credit-card') +
    _row('Efectivo', '_hud-efec',  '#FCD34D',null,'fa-money-bill-wave') +
    _row('Apartados','_hud-apart', '#F59E0B',null,'fa-lock') +
    _pCTA('Ver detalle completo','#22C55E','irAPatrimonio');

  // ── Panel 2: Necesidades ──
  var _p2 = _mkFloatPanel('hud-necesidades','#A855F7','rgba(168,85,247,0.15)');
  document.body.appendChild(_p2);
  _p2.classList.add('hud-pnl');
  _p2.style.animationDelay = '1.3s';
  document.getElementById('hud-necesidades-inner').innerHTML =
    _pH('Necesidades','#A855F7','fa-wave-square') +
    _maslow('Fisiológicas',   '_hud-nec-1','_hud-nec-1-bar','#EF4444') +
    _maslow('Seguridad',      '_hud-nec-2','_hud-nec-2-bar','#F59E0B') +
    _maslow('Afiliación',     '_hud-nec-3','_hud-nec-3-bar','#22D3EE') +
    _maslow('Reconocimiento', '_hud-nec-4','_hud-nec-4-bar','#A855F7') +
    _maslow('Autorrealización','_hud-nec-5','_hud-nec-5-bar','#22C55E') +
    _pCTA('Ver análisis','#A855F7','irANecesidades');

  // ── Panel 3: Bitácora ──
  var _p3 = _mkFloatPanel('hud-bitacora','#C084FC','rgba(192,132,252,0.15)');
  document.body.appendChild(_p3);
  _p3.classList.add('hud-pnl');
  _p3.style.animationDelay = '2.6s';
  document.getElementById('hud-bitacora-inner').innerHTML =
    _pH('Bitácora','#C084FC','fa-book-open') +
    _row('Pensamientos', '_hud-pens','#C084FC',null,'fa-comment-dots') +
    _row('Relaciones',   '_hud-rels','#EC4899',null,'fa-user-group') +
    _row('Salud',        '_hud-sal', '#EF4444',null,'fa-heart') +
    _row('Nutrición',    '_hud-nut', '#86EFAC',null,'fa-apple-whole') +
    _row('Entrenamiento','_hud-ent', '#FB923C',null,'fa-dumbbell') +
    _pCTA('Abrir Bitácora','#C084FC','irABitacora');

  // ══════════════════════════════════════
  //  COLUMNA DERECHA
  // ══════════════════════════════════════

  // ── Panel 4: Financiero ──
  var _p4 = _mkFloatPanel('hud-financiero','#22D3EE','rgba(34,211,238,0.15)');
  document.body.appendChild(_p4);
  _p4.classList.add('hud-pnl');
  _p4.style.animationDelay = '0.6s';
  document.getElementById('hud-financiero-inner').innerHTML =
    _pH('Financiero','#22D3EE','fa-chart-line') +
    _hero('_hud-fin-exc','#22D3EE','Excedente del mes',null) +
    // Ingresos / Egresos lado a lado
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 16px 12px">'+
      '<div style="padding:10px 12px;background:'+_rgba('#22C55E',0.07)+';border:1px solid '+_rgba('#22C55E',0.28)+';border-radius:9px;position:relative;overflow:hidden">'+
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:#22C55E;box-shadow:0 0 8px #22C55E;opacity:.7"></div>'+
        '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#22C55E;margin-bottom:6px;opacity:.85">Ingresos</div>'+
        '<div id="_hud-fin-ing" style="font-size:18px;font-weight:800;color:#22C55E;font-family:JetBrains Mono,monospace;line-height:1;text-shadow:0 0 12px '+_rgba('#22C55E',0.40)+'">—</div>'+
      '</div>'+
      '<div style="padding:10px 12px;background:'+_rgba('#EF4444',0.07)+';border:1px solid '+_rgba('#EF4444',0.28)+';border-radius:9px;position:relative;overflow:hidden">'+
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:#EF4444;box-shadow:0 0 8px #EF4444;opacity:.7"></div>'+
        '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#EF4444;margin-bottom:6px;opacity:.85">Egresos</div>'+
        '<div id="_hud-fin-egr" style="font-size:18px;font-weight:800;color:#EF4444;font-family:JetBrains Mono,monospace;line-height:1;text-shadow:0 0 12px '+_rgba('#EF4444',0.40)+'">—</div>'+
      '</div>'+
    '</div>'+
    _miniBar('Ahorro %','_hud-fin-aho','_hud-aho-bar','#FACC15') +
    _row('Runway',    '_hud-runway', '#22D3EE',null,'fa-plane-departure') +
    _row('Gasto/día','_hud-gastoDia','#A78BFA',null,'fa-chart-pie') +
    _pCTA('Ver resumen financiero','#22D3EE','irAFinanciero');

  // ── Panel 5: Activity + Logros (3 trio cells + racha con fuegos) ──
  var _p5 = _mkFloatPanel('hud-activity','#FB923C','rgba(251,146,60,0.15)');
  document.body.appendChild(_p5);
  _p5.classList.add('hud-pnl');
  _p5.style.animationDelay = '1.9s';
  document.getElementById('hud-activity-inner').innerHTML =
    _pH('Activity + Logros','#FB923C','fa-bolt') +
    '<div class="hud-trio">'+
      _trioCell('_hud-act-done','Hábitos hoy','—','#FB923C')+
      _trioCell('_hud-lgr-done','Logros','—','#FACC15')+
      _trioCell('_hud-racha','Racha actual','—','#EF4444')+
    '</div>'+
    '<div class="hud-fires-row">'+
      '<i class="fas fa-fire lead" style="color:#FB923C;filter:drop-shadow(0 0 5px #FB923C)"></i>'+
      '<span class="lbl">Racha</span>'+
      '<div id="_hud-racha-fires" class="fires">'+
        '<i class="fas fa-fire"></i><i class="fas fa-fire"></i><i class="fas fa-fire"></i>'+
        '<i class="fas fa-fire"></i><i class="fas fa-fire"></i><i class="fas fa-fire"></i>'+
        '<i class="fas fa-fire"></i>'+
      '</div>'+
    '</div>'+
    _pCTA('Ir a Activity Check','#FB923C','irAActivity');

  // ── Panel 6: Navegación (grid 2x3) ──
  var _p6 = _mkFloatPanel('hud-nav','#A78BFA','rgba(167,139,250,0.12)');
  document.body.appendChild(_p6);
  _p6.classList.add('hud-pnl');
  _p6.style.animationDelay = '3.2s';
  document.getElementById('hud-nav-inner').innerHTML =
    _pH('Navegación','#A78BFA','fa-compass') +
    '<div id="hud-navg-grid" class="hud-navg"></div>';
  var _navGrid = document.getElementById('hud-navg-grid');
  [
    {label:'Activity',   icon:'fa-bolt',         fn:'irAActivity',  color:'#FB923C'},
    {label:'Bitácora',   icon:'fa-book-open',    fn:'irABitacora',  color:'#C084FC'},
    {label:'Logros',     icon:'fa-trophy',       fn:'irALogros',    color:'#FACC15'},
    {label:'RAW Sheet',  icon:'fa-table',        fn:'irASheets',    color:'#A5B4FC'},
    {label:'Nutrición',  icon:'fa-leaf',         fn:'irANutricion', color:'#4ADE80'},
    {label:'Actualizar', icon:'fa-rotate-right', fn:'refreshTodo',  color:'#94A3B8'},
  ].forEach(function(n){ _navGrid.appendChild(_navG(n.label,n.icon,n.color,n.fn)); });

  // ══════════════════════════════════════
  //  ZONA INFERIOR — track + 3 cards
  // ══════════════════════════════════════

  // ── _pTrack: track horizontal de niveles ──
  var _pTrack = _mkFloatPanel('hud-track','#A78BFA','rgba(167,139,250,0.12)');
  document.body.appendChild(_pTrack);
  _pTrack.classList.add('hud-pnl');
  _pTrack.style.animationDelay = '1.0s';
  _pTrack.style.borderRadius = '14px';
  document.getElementById('hud-track-inner').innerHTML =
    '<div class="hud-track">'+
      '<div class="hud-track-cur">'+
        '<div class="hud-track-hex" style="background:radial-gradient(circle,'+_rgba('#A78BFA',0.22)+','+_rgba('#A78BFA',0.05)+');border:1.5px solid #A78BFA;box-shadow:0 0 16px '+_rgba('#A78BFA',0.45)+',inset 0 0 8px '+_rgba('#A78BFA',0.18)+'">'+
          '<span id="_hud-track-nivel">1</span>'+
        '</div>'+
        '<div class="hud-track-cur-info">'+
          '<span class="hud-track-cur-l">Nivel actual</span>'+
          '<span id="_hud-track-xp" class="hud-track-cur-v" style="color:#A78BFA;text-shadow:0 0 8px '+_rgba('#A78BFA',0.45)+'">0 / 1,000 XP</span>'+
        '</div>'+
      '</div>'+
      '<div class="hud-track-mid"><div id="_hud-track-stops" style="display:flex;align-items:center;gap:6px"></div></div>'+
      '<div style="flex-shrink:0"><i class="fas fa-trophy" style="font-size:20px;color:#A78BFA;filter:drop-shadow(0 0 6px '+_rgba('#A78BFA',0.55)+')"></i></div>'+
    '</div>';

  // ── _pMision: Misión Diaria (bottom-left) ──
  var _pMision = _mkFloatPanel('hud-mision','#22D3EE','rgba(34,211,238,0.15)');
  document.body.appendChild(_pMision);
  _pMision.classList.add('hud-pnl');
  _pMision.style.animationDelay = '1.4s';
  _pMision.style.borderRadius = '14px';
  document.getElementById('hud-mision-inner').innerHTML =
    '<div class="hud-card">'+
      '<div class="hud-card-ico" style="background:'+_rgba('#22D3EE',0.14)+';border:1px solid '+_rgba('#22D3EE',0.45)+';box-shadow:0 0 12px '+_rgba('#22D3EE',0.30)+'">'+
        '<i class="fas fa-bullseye" style="color:#22D3EE;filter:drop-shadow(0 0 4px #22D3EE)"></i>'+
      '</div>'+
      '<div class="hud-card-c">'+
        '<div class="hud-card-h">'+
          '<span class="hud-card-l" style="color:#22D3EE;text-shadow:0 0 6px '+_rgba('#22D3EE',0.40)+'">Misión Diaria</span>'+
          '<span id="_hud-mision-progreso" class="hud-card-r" style="color:#22D3EE">0/3</span>'+
        '</div>'+
        '<span id="_hud-mision-label" class="hud-card-sub">Completa 3 hábitos hoy</span>'+
        '<div class="hud-card-bar"><div id="_hud-mision-bar" style="background:linear-gradient(90deg,#22D3EE,#67E8F9);box-shadow:0 0 6px '+_rgba('#22D3EE',0.55)+'"></div></div>'+
      '</div>'+
      '<span id="_hud-mision-recompensa" class="hud-card-end" style="color:#FACC15;text-shadow:0 0 6px '+_rgba('#FACC15',0.40)+'">+50 XP</span>'+
    '</div>';

  // ── _pLogro: Logro Reciente (bottom-center) ──
  var _pLogro = _mkFloatPanel('hud-logro','#FACC15','rgba(250,204,21,0.15)');
  document.body.appendChild(_pLogro);
  _pLogro.classList.add('hud-pnl');
  _pLogro.style.animationDelay = '1.7s';
  _pLogro.style.borderRadius = '14px';
  document.getElementById('hud-logro-inner').innerHTML =
    '<div class="hud-card">'+
      '<div class="hud-card-ico" style="background:'+_rgba('#FACC15',0.14)+';border:1px solid '+_rgba('#FACC15',0.45)+';box-shadow:0 0 12px '+_rgba('#FACC15',0.30)+'">'+
        '<i class="fas fa-star" style="color:#FACC15;filter:drop-shadow(0 0 4px #FACC15)"></i>'+
      '</div>'+
      '<div class="hud-card-c">'+
        '<div class="hud-card-h">'+
          '<span class="hud-card-l" style="color:#FACC15;text-shadow:0 0 6px '+_rgba('#FACC15',0.40)+'">Logro reciente</span>'+
          '<span id="_hud-logro-pct" class="hud-card-r" style="color:#FACC15">0%</span>'+
        '</div>'+
        '<span id="_hud-logro-titulo" class="hud-card-sub">—</span>'+
        '<div class="hud-card-bar"><div id="_hud-logro-bar" style="background:linear-gradient(90deg,#FACC15,#FCD34D);box-shadow:0 0 6px '+_rgba('#FACC15',0.55)+'"></div></div>'+
      '</div>'+
    '</div>';

  // ── _pNivel: Nivel Siguiente (bottom-right) ──
  var _pNivel = _mkFloatPanel('hud-nivel','#A78BFA','rgba(167,139,250,0.15)');
  document.body.appendChild(_pNivel);
  _pNivel.classList.add('hud-pnl');
  _pNivel.style.animationDelay = '2.0s';
  _pNivel.style.borderRadius = '14px';
  document.getElementById('hud-nivel-inner').innerHTML =
    '<div class="hud-card">'+
      '<div class="hud-card-ico-hex" style="background:radial-gradient(circle,'+_rgba('#A78BFA',0.22)+','+_rgba('#A78BFA',0.05)+');border:1.5px solid #A78BFA;box-shadow:0 0 14px '+_rgba('#A78BFA',0.45)+',inset 0 0 8px '+_rgba('#A78BFA',0.18)+'">'+
        '<span id="_hud-nivel-num">2</span>'+
      '</div>'+
      '<div class="hud-card-c">'+
        '<span class="hud-card-l" style="color:#A78BFA;text-shadow:0 0 6px '+_rgba('#A78BFA',0.40)+'">Nivel siguiente</span>'+
        '<div style="display:flex;align-items:baseline;gap:8px;font-family:JetBrains Mono,monospace">'+
          '<span id="_hud-nivel-xp" style="font-size:13px;font-weight:800;color:#A78BFA;text-shadow:0 0 8px '+_rgba('#A78BFA',0.45)+'">+1,000 XP</span>'+
          '<span style="color:rgba(255,255,255,0.18)">|</span>'+
          '<span id="_hud-nivel-bonus" style="font-size:12px;font-weight:700;color:#22D3EE;text-shadow:0 0 6px '+_rgba('#22D3EE',0.40)+'">+$250</span>'+
        '</div>'+
        '<span class="hud-card-sub" style="font-size:10px;color:rgba(220,224,235,0.50)">Recompensas desbloqueadas</span>'+
      '</div>'+
      '<i class="fas fa-gift" style="font-size:20px;color:#A78BFA;flex-shrink:0;filter:drop-shadow(0 0 6px '+_rgba('#A78BFA',0.55)+')"></i>'+
    '</div>';

  _pUser._side='top-left';     _pUser._order=0;
  _pSim._side='top-center';    _pSim._order=0;
  _pStats._side='top-right';   _pStats._order=0;
  _p1._side='left';    _p1._order=0;
  _p2._side='left';    _p2._order=1;
  _p3._side='left';    _p3._order=2;
  _p4._side='right';   _p4._order=0;
  _p5._side='right';   _p5._order=1;
  _p6._side='right';   _p6._order=2;
  _pTrack._side='bottom-track';   _pTrack._order=0;
  _pMision._side='bottom-left';   _pMision._order=0;
  _pLogro._side='bottom-center';  _pLogro._order=0;
  _pNivel._side='bottom-right';   _pNivel._order=0;

  var _hudPanels = [
    {el:_pUser},{el:_pSim},{el:_pStats},
    {el:_p1},{el:_p2},{el:_p3},
    {el:_p4},{el:_p5},{el:_p6},
    {el:_pTrack},
    {el:_pMision},{el:_pLogro},{el:_pNivel},
  ];

  // ── Reposicionar HUD ──
  function _reposicionarHUD(){
    if(!_dialCanvas||!window._hudPanels) return;
    var r   = _dialCanvas.getBoundingClientRect();
    var vW  = window.innerWidth;
    var vH  = window.innerHeight;
    var GAP = 14;

    // Chamfers por posición
    var chamferRect = 'polygon(10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px),0 10px)';
    var chamferLeft  = 'polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))';
    var chamferRight = 'polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)';

    function getTop(side){
      return window._hudPanels.filter(function(hp){ return hp.el._side===side; });
    }

    // ══════════════════════════════════════════
    //  ZONA SUPERIOR — anchos compactos, Sim alineado al ancho del dial
    // ══════════════════════════════════════════
    var topPad  = GAP;
    var topGap  = 14;
    var pUser  = getTop('top-left')[0];
    var pSim   = getTop('top-center')[0];
    var pStats = getTop('top-right')[0];

    // Anchos FIJOS y compactos (no porcentaje del viewport)
    var wUser  = 220;
    var wStats = 340;
    // Sim ocupa el ancho del dial, NO el resto del viewport
    var wSim   = Math.round(r.width);
    // Si el viewport es muy estrecho, fallback: solo Sim centrado
    if(vW < (wUser + wStats + wSim + topGap*4 + topPad*2)){
      wUser = 0; wStats = 0;
      wSim = Math.min(Math.round(r.width), vW - topPad*2);
    }

    if(pUser && wUser>0){ pUser.el.style.width = wUser+'px'; pUser.el.style.visibility='visible'; }
    else if(pUser){ pUser.el.style.width='0px'; pUser.el.style.opacity='0'; pUser.el.style.visibility='hidden'; }
    if(pSim){ pSim.el.style.width = wSim+'px'; }
    if(pStats && wStats>0){ pStats.el.style.width = wStats+'px'; pStats.el.style.visibility='visible'; }
    else if(pStats){ pStats.el.style.width='0px'; pStats.el.style.opacity='0'; pStats.el.style.visibility='hidden'; }

    // Altura uniforme entre USER, Sim y Stats
    var topMaxH = 0;
    [pUser,pSim,pStats].forEach(function(hp){
      if(hp && hp.el && hp.el.style.width !== '0px'){
        hp.el.style.minHeight = '';
        var h = hp.el.scrollHeight || hp.el.offsetHeight || 90;
        if(h>topMaxH) topMaxH = h;
      }
    });
    if(topMaxH===0) topMaxH = 100;
    [pUser,pSim,pStats].forEach(function(hp){
      if(hp && hp.el && hp.el.style.width !== '0px'){
        hp.el.style.minHeight = topMaxH+'px';
        var inner = hp.el.querySelector(':scope > [id$="-inner"]');
        if(inner){
          inner.style.minHeight = topMaxH+'px';
          inner.style.justifyContent = 'center';
        }
      }
    });

    var topY = topPad;
    // Sim CENTRADO en X igual que el dial
    var simX = Math.round(r.left + (r.width - wSim) / 2);
    if(pSim){
      pSim.el.style.left = simX + 'px';
      pSim.el.style.top  = topY + 'px';
      pSim.el.style.clipPath = chamferRect;
    }
    // USER pegado a la izquierda
    if(pUser && wUser>0){
      pUser.el.style.left = topPad + 'px';
      pUser.el.style.top  = topY + 'px';
      pUser.el.style.clipPath = chamferRect;
    }
    // Stats pegado a la derecha
    if(pStats && wStats>0){
      pStats.el.style.left = (vW - topPad - wStats) + 'px';
      pStats.el.style.top  = topY + 'px';
      pStats.el.style.clipPath = chamferRect;
    }

    // ══════════════════════════════════════════
    //  ZONA INFERIOR — track + 3 cards
    // ══════════════════════════════════════════
    var pTrack  = getTop('bottom-track')[0];
    var pMision = getTop('bottom-left')[0];
    var pLogro  = getTop('bottom-center')[0];
    var pNivel  = getTop('bottom-right')[0];

    var botPad  = GAP;
    var botGap  = 14;

    // En el objetivo: Misión a la izquierda con ancho fijo (similar a USER),
    // Logro al centro alineado con el dial, Nivel a la derecha (similar a Stats).
    // Para que no se aplasten en pantallas anchas, capeamos cada uno.
    var wMision = 320;
    var wNivel  = 360;
    // Logro al centro: alineado con el dial
    var wLogro  = Math.round(r.width);
    // Si no caben los 3, repartir proporcional
    var totalNeeded = wMision + wLogro + wNivel + botGap*2 + botPad*2;
    if(totalNeeded > vW){
      var avail = vW - botPad*2 - botGap*2;
      wMision = Math.round(avail * 0.25);
      wNivel  = Math.round(avail * 0.28);
      wLogro  = avail - wMision - wNivel;
    }

    if(pMision){ pMision.el.style.width = wMision+'px'; }
    if(pLogro){ pLogro.el.style.width = wLogro+'px'; }
    if(pNivel){ pNivel.el.style.width = wNivel+'px'; }

    // Track horizontal: ancho EXACTO del dial (no más, no menos)
    var trackW = Math.round(r.width);
    if(pTrack){ pTrack.el.style.width = trackW+'px'; }

    var botH = 0;
    [pMision,pLogro,pNivel].forEach(function(hp){
      if(hp && hp.el){
        var h = hp.el.scrollHeight || hp.el.offsetHeight || 80;
        if(h>botH) botH = h;
      }
    });
    if(botH===0) botH = 80;
    var trackH = (pTrack && pTrack.el) ? (pTrack.el.scrollHeight || pTrack.el.offsetHeight || 64) : 64;

    var botY = vH - botPad - botH;
    var trackY = botY - trackH - 10;

    if(pTrack){
      pTrack.el.style.left = Math.round((vW - trackW)/2)+'px';
      pTrack.el.style.top  = trackY+'px';
      pTrack.el.style.clipPath = chamferRect;
    }
    if(pMision){
      pMision.el.style.left = botPad + 'px';
      pMision.el.style.top  = botY + 'px';
      pMision.el.style.clipPath = chamferRect;
    }
    if(pLogro){
      // Logro centrado en X igual que el dial
      var logroX = Math.round(r.left + (r.width - wLogro) / 2);
      pLogro.el.style.left = logroX + 'px';
      pLogro.el.style.top  = botY + 'px';
      pLogro.el.style.clipPath = chamferRect;
    }
    if(pNivel){
      pNivel.el.style.left = (vW - botPad - wNivel) + 'px';
      pNivel.el.style.top  = botY + 'px';
      pNivel.el.style.clipPath = chamferRect;
    }

    // ══════════════════════════════════════════
    //  COLUMNAS LATERALES — entre fila top y track
    //  IMPORTANTE: las columnas NUNCA invaden zona inferior (botY o trackY)
    // ══════════════════════════════════════════
    // Usamos topMaxH (altura UNIFORME de la fila top) en lugar de scrollHeight max
    var colTopY    = topY + topMaxH + GAP*2;
    var colBotY    = trackY - GAP;     // límite duro: arriba del track
    var colVAvail  = Math.max(200, colBotY - colTopY);

    // Anchos laterales conservadores con cap más bajo (objetivo: 220-260)
    var leftSpace  = r.left;
    var rightSpace = vW - r.right;
    var leftW  = Math.min(Math.max(180, leftSpace  - GAP*2), Math.floor(leftSpace  * 0.85));
    var rightW = Math.min(Math.max(180, rightSpace - GAP*2), Math.floor(rightSpace * 0.85));
    // Cap absoluto: máximo 260px (antes 300)
    leftW  = Math.min(leftW, 260);
    rightW = Math.min(rightW, 260);
    var leftX  = Math.floor((leftSpace  - leftW)  / 2);
    var rightX = r.right + Math.floor((rightSpace - rightW) / 2);

    var leftPanels  = window._hudPanels.filter(function(hp){ return hp.el._side==='left';  });
    var rightPanels = window._hudPanels.filter(function(hp){ return hp.el._side==='right'; });

    function positionCol(panels, x, w, isLeft){
      panels.sort(function(a,b){ return a.el._order - b.el._order; });
      panels.forEach(function(hp){
        hp.el.style.width = w + 'px';
        hp.el.style.left  = x + 'px';
        hp.el.style.top   = '-9999px';
        // Limpiar transform por si quedó de iteración previa
        hp.el.style.transform = '';
      });
      // Medir alturas reales
      var heights = panels.map(function(hp){
        return hp.el.scrollHeight || hp.el.offsetHeight || 200;
      });
      var totalH = heights.reduce(function(s,h){ return s+h+GAP; },0) - GAP;

      var startY, gapBetween;
      if(totalH <= colVAvail){
        // Cabe holgado: centrar verticalmente
        startY = colTopY + (colVAvail - totalH)/2;
        gapBetween = GAP;
      } else {
        // No cabe: arrancar pegado arriba y reducir gap (mínimo 6px) para evitar invasión
        startY = colTopY;
        // Distribuir el sobrante en gaps negativos hasta el mínimo
        var extra = totalH - colVAvail;
        var gapsCount = panels.length - 1;
        if(gapsCount>0){
          var reducedGap = Math.max(6, GAP - Math.ceil(extra/gapsCount));
          gapBetween = reducedGap;
        } else {
          gapBetween = GAP;
        }
      }

      var curY = startY;
      var chamfer = isLeft ? chamferLeft : chamferRight;
      panels.forEach(function(hp, idx){
        var h = heights[idx];
        hp.el.style.top      = Math.round(curY) + 'px';
        hp.el.style.clipPath = chamfer;
        curY += h + gapBetween;
      });
    }

    positionCol(leftPanels,  leftX,  leftW,  true);
    positionCol(rightPanels, rightX, rightW, false);

    // ══════════════════════════════════════════
    //  TRACK STOPS — render dinámico de los hexes del track
    // ══════════════════════════════════════════
    var stopsEl = document.getElementById('_hud-track-stops');
    if(stopsEl && pTrack){
      var xpInfo = (typeof _calcXPNivel==='function') ? _calcXPNivel() : { nivel:1 };
      var n = xpInfo.nivel;
      var stops = [n+1, n+2, n+3];
      var html = '';
      stops.forEach(function(lvl, idx){
        // Línea entre stops
        if(idx>0){
          html += '<div style="width:24px;height:1px;background:linear-gradient(90deg,rgba(167,139,250,0.30),rgba(167,139,250,0.10));position:relative">'+
            '<div style="position:absolute;top:50%;right:-2px;width:5px;height:5px;border-radius:50%;background:#A78BFA;transform:translateY(-50%);box-shadow:0 0 6px #A78BFA"></div>'+
          '</div>';
        } else {
          html += '<div style="width:18px;height:1px;background:linear-gradient(90deg,rgba(167,139,250,0.40),rgba(167,139,250,0.20))"></div>';
        }
        html += '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">'+
          '<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;'+
            'background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.30);'+
            'clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);'+
            'box-shadow:0 0 8px rgba(167,139,250,0.18)">'+
            '<span style="font-size:11px;font-weight:800;color:rgba(220,220,240,0.75)">'+lvl+'</span>'+
          '</div>'+
          '<span style="font-size:8px;font-weight:700;color:rgba(167,139,250,0.60);font-variant-numeric:tabular-nums">+'+(500*(idx+1))+' XP</span>'+
        '</div>';
      });
      stopsEl.innerHTML = html;
    }
  }
  window._reposicionarHUD = _reposicionarHUD;

  _dialOverlay.appendChild(_dialCanvas);
  document.body.appendChild(_dialOverlay);

  window._hudPanels = _hudPanels;

  // ══════════════════════════════════════
  //  REFRESCAR ESPEJOS — incluye Nutrición y banda Sim
  // ══════════════════════════════════════
  window._refrescarEspejos = function(datos){
    function fmt(v){
      if(v===null||v===undefined||v==='') return '—';
      var n=Number(v); if(isNaN(n)) return String(v);
      return '$ '+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:0});
    }
    function fmt2(v){ if(v===null||v===undefined||v==='') return '—'; var n=Number(v); if(isNaN(n)) return '—'; return '$ '+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); }
    function set(id,v){ var e=document.getElementById(id); if(e&&v!==undefined&&v!==null) e.textContent=v; }
    function setW(id,pct){ var e=document.getElementById(id); if(e){ e.style.width=Math.min(100,Math.max(0,parseFloat(pct)||0))+'%'; } }
    // Formatea $X,XXX.<dim>00</dim> en hero (centavos atenuados).
    function setMoney(id,v){
      var e=document.getElementById(id); if(!e) return;
      if(v===null||v===undefined||v==='' || isNaN(Number(v))){ e.textContent='—'; return; }
      var n = Math.abs(Number(v));
      var entero = Math.floor(n).toLocaleString('es-MX');
      var dec = (n.toFixed(2).split('.')[1] || '00');
      e.innerHTML = '$ '+entero+'<span class="cents">.'+dec+'</span>';
    }
    // Money formato corto sin centavos (ingresos/egresos)
    function setMoneyShort(id,v){
      var e=document.getElementById(id); if(!e) return;
      if(v===null||v===undefined||v==='' || isNaN(Number(v))){ e.textContent='—'; return; }
      var n = Math.abs(Number(v));
      e.innerHTML = '$ '+Math.round(n).toLocaleString('es-MX');
    }

    var d = datos || window._hudDatos || {};

    // ── Banda Sim (estilo Sims) ──
    if(typeof renderSimsBandSimsStyle === 'function') renderSimsBandSimsStyle('hud-sim-band-grid');
    // Compatibilidad: si aún hay un grid viejo en la página, refrescarlo también
    if(document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');

    // ── USER / Nivel / XP (top-left) ──
    if(typeof _calcXPNivel === 'function'){
      var xp = _calcXPNivel();
      set('_hud-user-nivel', xp.nivel);
      set('_hud-user-xp', xp.xpActual.toLocaleString('es-MX')+' / '+xp.xpMeta.toLocaleString('es-MX')+' XP');
      setW('_hud-user-xpbar', (xp.xpActual/xp.xpMeta)*100);
      // Track
      set('_hud-track-nivel', xp.nivel);
      set('_hud-track-xp', xp.xpActual.toLocaleString('es-MX')+' / '+xp.xpMeta.toLocaleString('es-MX')+' XP');
      // Nivel Siguiente
      set('_hud-nivel-num', xp.nivel+1);
      set('_hud-nivel-xp', '+'+(xp.xpMeta - xp.xpActual).toLocaleString('es-MX')+' XP');
    }

    // ── Stats (Energía / Racha / Créditos) ──
    if(typeof _calcRachaCreditos === 'function'){
      var rc = _calcRachaCreditos();
      set('_hud-energia', rc.energia);
      set('_hud-racha-dias', rc.racha);
      set('_hud-creditos', rc.creditos.toLocaleString('es-MX'));
      // Panel _p5: trio cell "Racha actual" + iconos de fuego encendidos
      var rachaEl = document.getElementById('_hud-racha');
      if(rachaEl) rachaEl.textContent = rc.racha + 'd';
      var firesEl = document.getElementById('_hud-racha-fires');
      if(firesEl){
        var fires = firesEl.querySelectorAll('i');
        for(var fi=0; fi<fires.length; fi++){
          if(fi < rc.racha){ fires[fi].classList.add('on'); }
          else { fires[fi].classList.remove('on'); }
        }
      }
    }

    // ── Misión Diaria ──
    if(typeof _calcMisionDiaria === 'function'){
      var ms = _calcMisionDiaria();
      set('_hud-mision-progreso', ms.hechos+'/'+ms.total);
      set('_hud-mision-label', ms.label);
      set('_hud-mision-recompensa', ms.recompensa);
      setW('_hud-mision-bar', ms.total>0 ? (ms.hechos/ms.total)*100 : 0);
    }

    // ── Logro Reciente ──
    if(typeof _calcLogroReciente === 'function'){
      var lr = _calcLogroReciente();
      set('_hud-logro-titulo', lr.titulo);
      set('_hud-logro-pct', lr.avance+'%');
      setW('_hud-logro-bar', lr.avance);
    }

    // ── Nivel Siguiente: dots ──
    if(typeof _calcNivelSiguiente === 'function'){
      var ns = _calcNivelSiguiente();
      var dotsEl = document.getElementById('_hud-nivel-dots');
      if(dotsEl){
        var dh = '';
        for(var i=0;i<ns.dots;i++){
          var lleno = i < ns.dotsLlenos;
          dh += '<div style="width:6px;height:6px;border-radius:50%;'+
            'background:'+(lleno?'#A78BFA':'rgba(255,255,255,0.10)')+';'+
            (lleno?'box-shadow:0 0 5px rgba(167,139,250,0.7);':'')+
          '"></div>';
        }
        dotsEl.innerHTML = dh;
      }
    }

    // ── Patrimonio ──
    var fijosAll = window._fijosData || [];
    var totalDisp = fijosAll.reduce(function(s,f){ return f.nombre==='P'?s:s+(f.monto||0); },0);
    var totalApD  = (window._apartadosData||[]).reduce(function(s,a){
      return a.estado&&a.estado.toLowerCase()==='usado'?s:s+(a.monto||0);
    },0);
    if(totalDisp !== 0) setMoney('_hud-saldo', totalDisp - totalApD);
    var sv = document.getElementById('saldo-val');
    if(sv && sv.textContent && sv.textContent.trim().length>2 && sv.textContent.trim()!=='—'){
      // Si saldo-val ya tiene un valor formateado, parsearlo y aplicar setMoney
      var raw = sv.textContent.trim().replace(/[^\d.\-]/g,'');
      var num = parseFloat(raw);
      if(!isNaN(num)) setMoney('_hud-saldo', num);
    }

    // Chip "+/- X% vs ayer" — compara contra saldo guardado en localStorage
    (function(){
      var chip = document.getElementById('_hud-saldo-chip');
      if(!chip) return;
      var saldoActual = totalDisp - totalApD;
      try{
        var hoy = new Date().toISOString().slice(0,10);
        var prev = JSON.parse(localStorage.getItem('hud:saldoSnap')||'null');
        // Guardar snapshot de hoy si no existe (para comparar mañana)
        if(!prev || prev.fecha !== hoy){
          if(prev && prev.fecha !== hoy){
            // Tenemos snapshot de un día anterior → calcular delta
            var delta = saldoActual - prev.saldo;
            var pct = prev.saldo!==0 ? Math.round((delta/Math.abs(prev.saldo))*100) : 0;
            var pos = delta >= 0;
            var col = pos ? '#22C55E' : '#EF4444';
            chip.style.display = 'flex';
            chip.style.background = pos ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)';
            chip.style.border = '1px solid '+(pos ? 'rgba(34,197,94,0.40)' : 'rgba(239,68,68,0.40)');
            chip.style.color = col;
            chip.style.boxShadow = '0 0 10px '+(pos ? 'rgba(34,197,94,0.20)' : 'rgba(239,68,68,0.20)');
            chip.innerHTML = '<span style="font-family:JetBrains Mono,monospace">'+(pos?'+':'')+pct+'%</span>'+
              '<span class="chip-sub">vs ayer</span>';
          } else {
            chip.style.display = 'none';
          }
          // Actualizar snapshot
          localStorage.setItem('hud:saldoSnap', JSON.stringify({fecha:hoy, saldo:saldoActual}));
        } else {
          chip.style.display = 'none';
        }
      } catch(e){ chip.style.display = 'none'; }
    })();

    var fijos = window._fijosData || [];
    var maxMonto = fijos.reduce(function(m,f){ return f.nombre!=='P'?Math.max(m,Math.abs(f.monto||0)):m; },1);
    var bbvaSet=false, beatsSet=false;
    fijos.forEach(function(fi){
      if(fi.nombre==='P') return;
      var nl = (fi.nombre||'').toLowerCase();
      if(!bbvaSet && (nl.indexOf('bbva')>=0||nl.indexOf('banco')>=0||nl.indexOf('santan')>=0)){
        set('_hud-bbva', fmt2(fi.monto));
        setW('_hud-bbva-bar', Math.abs(fi.monto||0)/maxMonto*100);
        bbvaSet=true;
      } else if(!beatsSet && (nl.indexOf('beats')>=0||nl.indexOf('nu')>=0||nl.indexOf('hey')>=0||nl.indexOf('spin')>=0)){
        set('_hud-beats', fmt2(fi.monto));
        setW('_hud-beats-bar', Math.abs(fi.monto||0)/maxMonto*100);
        beatsSet=true;
      } else if(nl.indexOf('efectivo')>=0||nl.indexOf('cash')>=0){
        set('_hud-efec', fmt2(fi.monto));
      }
    });
    var bancos = fijos.filter(function(f){ return f.nombre!=='P'; });
    if(!bbvaSet && bancos[0]){ set('_hud-bbva', fmt2(bancos[0].monto)); setW('_hud-bbva-bar', Math.abs(bancos[0].monto||0)/maxMonto*100); }
    if(!beatsSet && bancos[1]){ set('_hud-beats', fmt2(bancos[1].monto)); setW('_hud-beats-bar', Math.abs(bancos[1].monto||0)/maxMonto*100); }

    var totalAp = (window._apartadosData||[]).reduce(function(s,a){
      return a.estado&&a.estado.toLowerCase()==='usado'?s:s+(a.monto||0);
    },0);
    set('_hud-apart', fmt(d.totalApartado || totalAp));

    if(window._patrimonioData && window._patrimonioData.fondo){
      set('_hud-fondo-pct', (window._patrimonioData.fondo.avance||0)+'%');
      setW('_hud-fondo-bar', window._patrimonioData.fondo.avance||0);
    }

    // ── Financiero ──
    var finD = window._finData;
    if(finD && finD.mes){
      setMoney('_hud-fin-exc', finD.mes.excedente);
      setMoneyShort('_hud-fin-ing', finD.mes.ingresos);
      setMoneyShort('_hud-fin-egr', finD.mes.egresos);
      var aho = finD.metricas && finD.metricas.porcentajeAhorro;
      set('_hud-fin-aho', aho!=null ? Math.round(aho)+'%' : '—');
      setW('_hud-aho-bar', Math.min(100,Math.max(0,aho||0)));
      var run = finD.metricas && finD.metricas.runwayDias;
      set('_hud-runway', run!=null ? run+' días' : '—');
      var gd = finD.metricas && finD.metricas.gastoPorDiaPromedio;
      set('_hud-gastoDia', gd ? fmt(gd) : '—');
    }

    // ── Necesidades ──
    var nec = d.necesidades || window._necData || {};
    var niveles = nec.niveles || [];
    var totalNec = niveles.reduce(function(s,n){ return s+Math.abs(n.total||0); },0);
    [1,2,3,4,5].forEach(function(n){
      var nv = niveles[n-1] || {total:0};
      var abs = Math.abs(nv.total||0);
      set('_hud-nec-'+n, abs>0 ? fmt(abs) : '—');
      setW('_hud-nec-'+n+'-bar', totalNec>0 ? abs/totalNec*100 : 0);
    });

    // ── Activity + Logros ──
    if(window._actData){
      var a = window._actData;
      var totH = (a.habitosPersonal||[]).length+(a.habitosElectronics||[]).length;
      var doneH = (a.habitosPersonal||[]).filter(function(h){ return h.checks&&Object.values(h.checks).some(Boolean); }).length +
                  (a.habitosElectronics||[]).filter(function(h){ return h.checks&&Object.values(h.checks).some(Boolean); }).length;
      set('_hud-act-done', doneH+'/'+totH);
    }
    if(window._logrosData){
      var items = window._logrosData.items||[];
      var doneL = items.filter(function(l){ return l.completado==='Sí'||l.completado===true; }).length;
      set('_hud-lgr-done', doneL+'/'+items.length);
    }

    // ── Bitácora ──
    if(window._pensamientosData && window._pensamientosData.items){
      var np = window._pensamientosData.items.length;
      set('_hud-pens', np ? np+' pensamientos' : '—');
    }
    if(window._relacionesData && window._relacionesData.items){
      var nr = window._relacionesData.items.length;
      set('_hud-rels', nr ? nr+' personas' : '—');
    }
    if(window._saludData && window._saludData.items){
      var ns = window._saludData.items.length;
      set('_hud-sal', ns ? ns+' registros' : '—');
    } else {
      var salItems = document.querySelectorAll('#salud-body .salud-item');
      if(salItems.length) set('_hud-sal', salItems.length+' registros');
    }
    // Nutrición — desde _nutData o desde DOM
    if(window._nutData){
      var nutItems = (window._nutData.items||[]).length || ((window._nutData.semana||[]).reduce(function(s,d){ return s+(d.items||[]).length; },0));
      set('_hud-nut', nutItems ? nutItems+' registros' : '—');
    } else {
      // Precargar datos de Nutrición si aún no existen — sin bloquear, en background
      if(typeof api!=='undefined' && api.getNutricion && !window._nutLoading){
        window._nutLoading = true;
        api.getNutricion().then(function(d){
          window._nutData = d;
          window._nutLoading = false;
          // Actualizar label inmediatamente
          var n = (d && d.items||[]).length || (d && (d.semana||[]).reduce(function(s,x){ return s+(x.items||[]).length; },0)) || 0;
          set('_hud-nut', n ? n+' registros' : '—');
          // Actualizar también la banda Sim si tiene needs que dependen de nutrición
          if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid'); if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
        }).catch(function(){ window._nutLoading = false; });
      }
    }
    // Entrenamiento
    if(window._entData && window._entData.items){
      set('_hud-ent', window._entData.items.length+' sesiones');
    } else {
      var entItems = document.querySelectorAll('#entrenamiento-body [class*="item"]');
      if(entItems.length) set('_hud-ent', entItems.length+' sesiones');
    }
  };

  _dialOverlay.addEventListener('click',function(e){ if(e.target===_dialOverlay) cerrarDial(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&_dialVisible) cerrarDial(); });

  _dialCanvas.addEventListener('mousemove',function(e){
    var r=_dialCanvas.getBoundingClientRect();
    var mx=(e.clientX-r.left)*(_DC.W/r.width);
    var my=(e.clientY-r.top)*(_DC.H/r.height);
    var dx0=mx-_DC.CX,dy0=my-_DC.CY;
    var enCentro=(Math.sqrt(dx0*dx0+dy0*dy0)<_DC.R_IN);
    var h=enCentro?-1:_dialHitTest(mx,my,false);
    var hs=_dialActiveSub>=0&&!enCentro?_dialHitTest(mx,my,true):-1;
    var cambio=(h!==_dialHovered||hs!==_dialSubHov||enCentro!==_dialCentroHov);
    _dialHovered=h; _dialSubHov=hs; _dialCentroHov=enCentro;
    if(cambio){
      if(enCentro){ _iniciarPulsoCentro(); }
      else { _detenerPulsoCentro(); _dialDraw(); }
    }
    _dialCanvas.style.cursor=(h>=0||hs>=0||enCentro)?'pointer':'default';
  });
  _dialCanvas.addEventListener('mouseleave',function(){ _dialHovered=-1;_dialSubHov=-1;_dialCentroHov=false;_detenerPulsoCentro();_dialDraw(); });
  _dialCanvas.addEventListener('click',function(e){
    var r=_dialCanvas.getBoundingClientRect();
    var mx=(e.clientX-r.left)*(_DC.W/r.width);
    var my=(e.clientY-r.top)*(_DC.H/r.height);
    if(_dialActiveSub>=0){
      var hs=_dialHitTest(mx,my,true);
      if(hs>=0){
        var parentItem=_DIAL_ITEMS[_dialActiveSub];
        var activeSubs=parentItem._subsResueltos||parentItem.subs||[];
        var sub=activeSubs[hs];
        if(sub){
          _dialPreset={};
          if(typeof sub.preset==='function') sub.preset();
          cerrarDial();
          abrirFormulario(sub.id);
        }
        return;
      }
    }
    var h=_dialHitTest(mx,my,false);
    if(h>=0){
      var item=_DIAL_ITEMS[h];
      if(item.accionEspecial){
        _abrirEditarOverlay();
        return;
      }
      if(item.subsGen && !item._subsResueltos){
        var gen=item.subsGen();
        item._subsResueltos = gen && gen.length ? gen : null;
      }
      var subsActivos = item._subsResueltos || item.subs;
      if(subsActivos && subsActivos.length){
        _dialSubHov=-1;
        _animarSubRing(h);
      } else {
        _dialPreset={}; cerrarDial(); abrirFormulario(item.id);
      }
    } else {
      var dx=mx-_DC.CX,dy=my-_DC.CY;
      if(Math.sqrt(dx*dx+dy*dy)<_DC.R_IN){ _dialPreset={}; cerrarDial(); abrirFormulario('nueva'); }
    }
  });
}

function _dialHitTest(mx,my,ring){
  var dc=_DC,N=_DIAL_ITEMS.length,slice=Math.PI*2/N;
  var dx=mx-dc.CX,dy=my-dc.CY;
  var dist=Math.sqrt(dx*dx+dy*dy);
  var angle=Math.atan2(dy,dx)+Math.PI/2;
  if(angle<0) angle+=Math.PI*2;
  if(!ring){
    if(dist<dc.R_IN||dist>dc.R_OUT+14) return -1;
    return Math.min(Math.floor(angle/slice),N-1);
  } else {
    if(_dialActiveSub<0) return -1;
    var item=_DIAL_ITEMS[_dialActiveSub];
    var subsActivos=item._subsResueltos||item.subs;
    if(!subsActivos||!subsActivos.length) return -1;
    if(dist<dc.R_SI||dist>dc.R_SO+12) return -1;
    var pmidA=Math.PI*2*(_dialActiveSub+0.5)/N-Math.PI/2;
    var spread=Math.PI*0.50,nSub=subsActivos.length,subSlice=spread/nSub;
    var startA=pmidA-spread/2;
    var absA=Math.atan2(dy,dx);
    var diff=absA-startA;
    while(diff>Math.PI) diff-=Math.PI*2;
    while(diff<-Math.PI) diff+=Math.PI*2;
    if(diff<0||diff>spread) return -1;
    return Math.min(Math.floor(diff/subSlice),nSub-1);
  }
}

function _dialDrawSector(ctx,startA,endA,rOut,rIn,fill,accent,isActive){
  var dc=_DC;
  var midA = (startA+endA)/2;
  var rMid = rIn + (rOut-rIn)*0.65;
  var gx   = dc.CX + rMid*Math.cos(midA);
  var gy   = dc.CY + rMid*Math.sin(midA);

  ctx.beginPath();
  ctx.moveTo(dc.CX+rIn*Math.cos(startA),dc.CY+rIn*Math.sin(startA));
  ctx.arc(dc.CX,dc.CY,rOut,startA,endA);
  ctx.lineTo(dc.CX+rIn*Math.cos(endA),dc.CY+rIn*Math.sin(endA));
  ctx.arc(dc.CX,dc.CY,rIn,endA,startA,true);
  ctx.closePath();

  var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, (rOut-rIn)*1.1);
  var ar=139,ag=92,ab=246;
  var m=accent&&accent.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if(m){ ar=parseInt(m[1],16); ag=parseInt(m[2],16); ab=parseInt(m[3],16); }
  var tint  = isActive ? 0.18 : 0.08;
  var tint2 = isActive ? 0.06 : 0.02;
  grad.addColorStop(0,   'rgba('+ar+','+ag+','+ab+','+tint+')');
  grad.addColorStop(0.5, 'rgba('+ar+','+ag+','+ab+','+tint2+')');
  grad.addColorStop(1,   fill);

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1; ctx.stroke();

  var glowA = isActive ? accent : ('rgba('+ar+','+ag+','+ab+',0.35)');
  var glowW = isActive ? 3.5 : 1.5;
  ctx.save();
  ctx.shadowColor = isActive ? accent : ('rgba('+ar+','+ag+','+ab+',0.5)');
  ctx.shadowBlur  = isActive ? 28 : 12;
  ctx.beginPath();
  ctx.arc(dc.CX,dc.CY,rOut,startA+0.01,endA-0.01);
  ctx.strokeStyle=glowA; ctx.lineWidth=glowW; ctx.stroke();
  ctx.restore();

  if(isActive){
    ctx.save();
    ctx.globalAlpha=0.5;
    ctx.shadowColor=accent; ctx.shadowBlur=50;
    ctx.beginPath();
    ctx.arc(dc.CX,dc.CY,rOut,startA+0.01,endA-0.01);
    ctx.strokeStyle=accent; ctx.lineWidth=2; ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(dc.CX,dc.CY,rIn+1,startA+0.01,endA-0.01);
  ctx.strokeStyle='rgba('+ar+','+ag+','+ab+',0.15)'; ctx.lineWidth=1; ctx.stroke();
}

function _dialDrawCentro(ctx, dc, isHov, pulseT){
  var pulse  = isHov ? (Math.sin(pulseT * 0.08) * 0.5 + 0.5) : 0;
  var glowAmt = isHov ? (30 + pulse * 25) : 14;
  var scaleR  = isHov ? (dc.R_IN + pulse * 6) : dc.R_IN;

  if(isHov){
    ctx.save();
    ctx.shadowColor = 'rgba(165,150,255,0.7)';
    ctx.shadowBlur  = 40 + pulse*20;
    ctx.beginPath();
    ctx.arc(dc.CX, dc.CY, scaleR + 4, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(165,150,255,' + (0.3 + pulse*0.3) + ')';
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(dc.CX, dc.CY, scaleR + 14, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(140,120,255,' + (0.12 + pulse*0.15) + ')';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();
  }

  var g = ctx.createRadialGradient(dc.CX, dc.CY, 0, dc.CX, dc.CY, scaleR);
  if(isHov){
    g.addColorStop(0,   'rgba(40,36,80,0.99)');
    g.addColorStop(0.5, 'rgba(24,22,52,0.99)');
    g.addColorStop(1,   'rgba(10,10,22,0.99)');
  } else {
    g.addColorStop(0,   'rgba(28,28,50,0.98)');
    g.addColorStop(0.6, 'rgba(14,14,28,0.98)');
    g.addColorStop(1,   'rgba(8,8,16,0.98)');
  }
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, scaleR, 0, Math.PI*2);
  ctx.fillStyle = g; ctx.fill();

  ctx.save();
  ctx.shadowColor = isHov ? 'rgba(180,160,255,0.9)' : 'rgba(140,130,255,0.5)';
  ctx.shadowBlur  = isHov ? (glowAmt + pulse*10) : 16;
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, scaleR, 0, Math.PI*2);
  ctx.strokeStyle = isHov
    ? 'rgba(180,160,255,' + (0.8 + pulse*0.2) + ')'
    : 'rgba(120,110,240,0.65)';
  ctx.lineWidth = isHov ? 2.5 : 1.8;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, scaleR - 11, 0, Math.PI*2);
  ctx.strokeStyle = isHov
    ? 'rgba(160,140,255,' + (0.18 + pulse*0.12) + ')'
    : 'rgba(100,90,200,0.20)';
  ctx.lineWidth = 1; ctx.stroke();

  ctx.save();
  ctx.shadowColor = 'rgba(185,180,255,0.9)';
  ctx.shadowBlur  = isHov ? (16 + pulse*12) : 10;
  ctx.font        = '500 ' + (isHov ? 34 : 28) + 'px -apple-system,sans-serif';
  ctx.fillStyle   = isHov
    ? 'rgba(220,210,255,' + (0.9 + pulse*0.1) + ')'
    : 'rgba(165,180,252,0.8)';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⇄', dc.CX, dc.CY - 14);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(180,160,255,0.7)';
  ctx.shadowBlur  = isHov ? (10 + pulse*8) : 6;
  ctx.font        = 'bold ' + (isHov ? 22 : 18) + 'px -apple-system,sans-serif';
  ctx.fillStyle   = isHov ? '#e0d8ff' : '#c4b5fd';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RAW', dc.CX, dc.CY + 14);
  ctx.restore();
}

function _animarSubRing(targetSub){
  if(_subRingRAF){ cancelAnimationFrame(_subRingRAF); _subRingRAF=null; }
  if(targetSub === _subRingPrevSub){
    _dialActiveSub = -1;
    _subRingPrevSub = -1;
    _subRingProg = 0;
    _dialDraw();
    return;
  }
  _dialActiveSub  = targetSub;
  _subRingPrevSub = targetSub;
  _subRingProg    = 0;
  var startTime   = null;
  var DURATION    = 320;
  function step(ts){
    if(!startTime) startTime = ts;
    var elapsed = ts - startTime;
    var t = Math.min(1, elapsed / DURATION);
    _subRingProg = 1 - Math.pow(1 - t, 3);
    _dialDraw();
    if(t < 1) _subRingRAF = requestAnimationFrame(step);
    else { _subRingRAF = null; _subRingProg = 1; }
  }
  _subRingRAF = requestAnimationFrame(step);
}

function _iniciarPulsoCentro(){
  if(_dialRAF) return;
  function loop(){
    _dialPulseT++;
    _dialDraw();
    _dialRAF = requestAnimationFrame(loop);
  }
  _dialRAF = requestAnimationFrame(loop);
}

function _detenerPulsoCentro(){
  if(_dialRAF){ cancelAnimationFrame(_dialRAF); _dialRAF=null; }
  _dialPulseT = 0;
}

function _dialDraw(){
  var ctx=_dialCtx;
  var dc=_DC;
  var N=_DIAL_ITEMS.length;
  var slice=Math.PI*2/N;

  ctx.clearRect(0,0,dc.W,dc.H);

  var bt = typeof _dialBreathT !== 'undefined' ? _dialBreathT : 0;
  var breathSin  = (Math.sin(bt * 0.025) * 0.5 + 0.5);
  var breathSin2 = (Math.sin(bt * 0.018 + 1.2) * 0.5 + 0.5);

  var HALO_OFF = 18;
  ctx.save();
  ctx.shadowColor = 'rgba(139,92,246,' + (0.5 + breathSin * 0.5) + ')';
  ctx.shadowBlur  = 60 + breathSin * 40;
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, dc.R_OUT + HALO_OFF, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(167,139,250,' + (0.25 + breathSin * 0.30) + ')';
  ctx.lineWidth   = 2 + breathSin * 2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, dc.R_OUT + HALO_OFF + 16 + breathSin2 * 6, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(120,80,220,' + (0.06 + breathSin2 * 0.10) + ')';
  ctx.lineWidth   = 8;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  var arcAngle = bt * 0.003;
  var arcLen   = Math.PI * 0.65;

  ctx.shadowColor = 'rgba(34,211,238,' + (0.7 + breathSin * 0.3) + ')';
  ctx.shadowBlur  = 20 + breathSin * 30;
  ctx.beginPath();
  var ARC_R = dc.R_OUT + 18;
  ctx.arc(dc.CX, dc.CY, ARC_R, arcAngle, arcAngle + arcLen);
  ctx.strokeStyle = 'rgba(34,211,238,' + (0.55 + breathSin * 0.40) + ')';
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.stroke();

  ctx.shadowColor = 'rgba(34,211,238,0.5)';
  ctx.shadowBlur  = 40 + breathSin * 20;
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, ARC_R, arcAngle, arcAngle + arcLen);
  ctx.strokeStyle = 'rgba(34,211,238,' + (0.12 + breathSin * 0.18) + ')';
  ctx.lineWidth   = 10;
  ctx.stroke();

  ctx.shadowColor = 'rgba(167,139,250,' + (0.6 + breathSin2 * 0.3) + ')';
  ctx.shadowBlur  = 18 + breathSin2 * 24;
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, ARC_R, arcAngle+Math.PI, arcAngle+Math.PI+arcLen*0.4);
  ctx.strokeStyle = 'rgba(167,139,250,' + (0.45 + breathSin2 * 0.40) + ')';
  ctx.lineWidth   = 2;
  ctx.stroke();

  var dotR = ARC_R;
  [arcAngle, arcAngle+arcLen].forEach(function(a){
    ctx.beginPath();
    ctx.arc(dc.CX+dotR*Math.cos(a), dc.CY+dotR*Math.sin(a), 3, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(34,211,238,' + (0.7+breathSin*0.3) + ')';
    ctx.shadowColor = '#22D3EE'; ctx.shadowBlur = 12;
    ctx.fill();
  });
  ctx.restore();

  for(var i=0;i<N;i++){
    var item   = _DIAL_ITEMS[i];
    var startA = -Math.PI/2 + i*slice + dc.GAP/2;
    var endA   = -Math.PI/2 + (i+1)*slice - dc.GAP/2;
    var midA   = (startA+endA)/2;
    var isHov  = (i===_dialHovered);
    var isAct  = (i===_dialActiveSub);

    var rOut = (isHov||isAct) ? dc.R_OUT+14 : dc.R_OUT;
    var rIn  = dc.R_IN;

    var fill = isAct ? _DIAL_ACT : isHov ? _DIAL_HOVER : _DIAL_BASE;

    _dialDrawSector(ctx,startA,endA,rOut,rIn,fill,item.accent,(isHov||isAct));

    var rMid = rIn + (rOut-rIn)*0.54;
    var cx   = dc.CX + rMid*Math.cos(midA);
    var cy   = dc.CY + rMid*Math.sin(midA);

    var icoS = isHov||isAct ? 52 : 44;
    ctx.save();
    ctx.shadowColor = item.accent;
    ctx.shadowBlur  = isHov||isAct ? 28 : 12;
    item.draw(ctx,cx,cy-8,icoS,item.accent);
    ctx.restore();
    if(isHov||isAct){
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.shadowColor = item.accent;
      ctx.shadowBlur  = 40;
      item.draw(ctx,cx,cy-8,icoS,item.accent);
      ctx.restore();
    }

    ctx.save();
    ctx.font         = 'bold '+(isHov||isAct?13:11)+'px -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif';
    ctx.fillStyle    = '#ffffff';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor  = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur   = 6;
    ctx.fillText(item.label.toUpperCase(), cx, cy+16);
    ctx.restore();

    if(item.subs){
      ctx.save();
      ctx.shadowColor = item.accent;
      ctx.shadowBlur  = isAct ? 12 : 4;
      ctx.beginPath();
      ctx.arc(dc.CX,dc.CY,rOut-2,midA-0.10,midA+0.10);
      ctx.strokeStyle = isAct ? item.accent : item.accent+'99';
      ctx.lineWidth   = isAct ? 4 : 2;
      ctx.lineCap     = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  if(_dialActiveSub>=0){
    var parent=_DIAL_ITEMS[_dialActiveSub];
    var _subsArr=parent._subsResueltos||parent.subs||[];
    var nSub=_subsArr.length;
    var prog = typeof _subRingProg !== 'undefined' ? _subRingProg : 1;
    if(nSub>0){
      var pmidA  = Math.PI*2*(_dialActiveSub+0.5)/N - Math.PI/2;
      var spreadFull = Math.PI*0.48;
      var spread     = spreadFull * prog;
      var subSlice   = spread/nSub;
      var subGap     = 0.020 * prog;
      var subStart   = pmidA - spread/2;
      var rSIAnim = dc.R_SI;
      var rSOFull = dc.R_SO;
      var rSOAnim = dc.R_SI + (rSOFull - dc.R_SI) * prog;

      ctx.save();
      ctx.globalAlpha = prog;
      for(var j=0;j<nSub;j++){
        var sub    = _subsArr[j];
        var sA     = subStart + j*subSlice + subGap/2;
        var eA     = subStart + (j+1)*subSlice - subGap/2;
        var smA    = (sA+eA)/2;
        var isShov = (j===_dialSubHov);
        var rso    = isShov ? rSOAnim+10*prog : rSOAnim;

        ctx.beginPath();
        ctx.moveTo(dc.CX+rSIAnim*Math.cos(sA), dc.CY+rSIAnim*Math.sin(sA));
        ctx.arc(dc.CX, dc.CY, rso, sA, eA);
        ctx.lineTo(dc.CX+rSIAnim*Math.cos(eA), dc.CY+rSIAnim*Math.sin(eA));
        ctx.arc(dc.CX, dc.CY, rSIAnim, eA, sA, true);
        ctx.closePath();

        var ar2=139,ag2=92,ab2=246;
        var m2=sub.accent&&sub.accent.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        if(m2){ ar2=parseInt(m2[1],16); ag2=parseInt(m2[2],16); ab2=parseInt(m2[3],16); }
        ctx.fillStyle = isShov
          ? 'rgba('+ar2+','+ag2+','+ab2+',0.12)'
          : 'rgba('+ar2+','+ag2+','+ab2+',0.04)';
        ctx.fill();

        ctx.save();
        ctx.shadowColor = sub.accent;
        ctx.shadowBlur  = isShov ? 28 : 14;
        ctx.beginPath();
        ctx.arc(dc.CX, dc.CY, rso, sA+0.02, eA-0.02);
        ctx.strokeStyle = isShov
          ? sub.accent
          : 'rgba('+ar2+','+ag2+','+ab2+',0.55)';
        ctx.lineWidth = isShov ? 3 : 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(dc.CX, dc.CY, rSIAnim+1, sA+0.02, eA-0.02);
        ctx.strokeStyle = 'rgba('+ar2+','+ag2+','+ab2+',0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if(prog > 0.35){
          var iconProg = Math.min(1,(prog-0.35)/0.65);
          var srMid = rSIAnim + (rso-rSIAnim)*0.52;
          var scx   = dc.CX + srMid*Math.cos(smA);
          var scy   = dc.CY + srMid*Math.sin(smA);
          var sicoS = (isShov ? 40 : 34) * iconProg;

          ctx.save();
          ctx.globalAlpha = iconProg;
          ctx.shadowColor=sub.accent;
          ctx.shadowBlur=isShov?18*iconProg:7*iconProg;
          sub.draw(ctx,scx,scy-7,sicoS,sub.accent);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = iconProg;
          ctx.font='bold '+(isShov?14:12)+'px -apple-system,BlinkMacSystemFont,sans-serif';
          ctx.fillStyle='#ffffff';
          ctx.textAlign='center';
          ctx.textBaseline='top';
          ctx.shadowColor='rgba(0,0,0,0.9)';
          ctx.shadowBlur=5;
          ctx.fillText(sub.label.toUpperCase(),scx,scy+12);
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }

  _dialDrawCentro(ctx, dc, _dialCentroHov, _dialPulseT);
}

// ── Overlay editar ID ──
function _abrirEditarOverlay(){
  var existing = document.getElementById('editar-id-overlay');
  if(existing){ existing.style.display='flex'; setTimeout(function(){ var inp=document.getElementById('editar-id-input-dial'); if(inp) inp.focus(); },80); return; }

  var ov = document.createElement('div');
  ov.id  = 'editar-id-overlay';
  ov.style.cssText = [
    'position:fixed','inset:0','z-index:9100',
    'display:flex','align-items:center','justify-content:center',
    'background:radial-gradient(ellipse at center,rgba(80,40,140,0.18) 0%,rgba(4,4,14,0.72) 100%)',
    'backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
    '-webkit-backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
  ].join(';');

  var box = document.createElement('div');
  box.style.cssText = [
    'background:rgba(15,12,28,0.97)',
    'border:1px solid rgba(140,100,220,0.3)',
    'clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)',
    'box-shadow:0 0 0 1px rgba(120,80,200,0.12),0 0 40px rgba(168,85,247,0.12),0 8px 48px rgba(0,0,0,0.7)',
    'padding:28px 28px 24px',
    'width:360px','max-width:92vw',
    'display:flex','flex-direction:column','gap:16px',
    'background-image:linear-gradient(rgba(120,80,200,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.03) 1px,transparent 1px)',
    'background-size:32px 32px',
  ].join(';');

  box.innerHTML =
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:4px;padding-bottom:14px;border-bottom:1px solid rgba(140,100,220,0.2)">' +
      '<div style="width:44px;height:44px;border-radius:8px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.35);' +
           'display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 12px rgba(139,92,246,0.25)">' +
        '<i class="fas fa-pen" style="font-size:16px;color:#8B5CF6;filter:drop-shadow(0 0 6px rgba(139,92,246,0.8))"></i>' +
      '</div>' +
      '<div>' +
        '<div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#A78BFA;margin-bottom:2px">EDITAR ENTRADA</div>' +
        '<div style="font-size:12px;color:rgba(212,216,232,0.5);font-weight:500">Ingresa el ID de la fila a editar</div>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
      '<input id="editar-id-input-dial" type="number" min="1" placeholder="142"' +
        ' style="flex:1;background:rgba(20,16,36,0.8);border:1px solid rgba(140,100,220,0.3);' +
        'clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);' +
        'color:#fff;font-size:24px;font-weight:700;padding:12px 16px;outline:none;font-family:inherit;' +
        'text-align:center;-webkit-appearance:none;appearance:none;letter-spacing:.04em">' +
      '<button id="editar-id-btn-dial"' +
        ' style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.35);' +
        'clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);' +
        'color:#A78BFA;font-size:12px;font-weight:700;padding:12px 20px;cursor:pointer;font-family:inherit;' +
        'white-space:nowrap;transition:all .15s;letter-spacing:.08em;text-transform:uppercase">' +
        '<i class="fas fa-search" style="margin-right:6px;font-size:11px"></i>Buscar' +
      '</button>' +
    '</div>' +
    '<div id="editar-id-msg-dial" style="font-size:11px;color:rgba(167,139,250,0.6);min-height:14px;text-align:center;letter-spacing:.04em"></div>';

  ov.appendChild(box);
  document.body.appendChild(ov);

  ov.addEventListener('click', function(e){ if(e.target===ov) ov.style.display='none'; });

  setTimeout(function(){
    var inp = document.getElementById('editar-id-input-dial');
    if(inp){
      inp.focus();
      inp.addEventListener('keydown', function(e){
        if(e.key==='Enter') _confirmarEditarId();
        if(e.key==='Escape') ov.style.display='none';
      });
      inp.addEventListener('focus', function(){
        inp.style.borderColor='rgba(139,92,246,0.8)';
        inp.style.boxShadow='0 0 0 1px rgba(139,92,246,0.35),0 0 16px rgba(139,92,246,0.25)';
        inp.style.background='rgba(25,18,50,0.9)';
      });
      inp.addEventListener('blur',  function(){
        inp.style.borderColor='rgba(140,100,220,0.3)';
        inp.style.boxShadow='none';
        inp.style.background='rgba(20,16,36,0.8)';
      });
    }
    var btn = document.getElementById('editar-id-btn-dial');
    if(btn){
      btn.addEventListener('click', _confirmarEditarId);
      btn.addEventListener('mouseenter', function(){
        btn.style.background='rgba(139,92,246,0.3)';
        btn.style.color='#fff';
        btn.style.boxShadow='0 0 16px rgba(139,92,246,0.3)';
      });
      btn.addEventListener('mouseleave', function(){
        btn.style.background='rgba(139,92,246,0.15)';
        btn.style.color='#A78BFA';
        btn.style.boxShadow='none';
      });
    }
  }, 80);
}

function _confirmarEditarId(){
  var inp = document.getElementById('editar-id-input-dial');
  var msg = document.getElementById('editar-id-msg-dial');
  if(!inp) return;
  var id  = parseInt(inp.value,10);
  if(!id || id < 1){
    msg.textContent='Ingresa un ID válido';
    msg.style.color='#f87171';
    inp.focus(); return;
  }
  msg.textContent='Buscando…'; msg.style.color='rgba(255,255,255,0.4)';
  var ov = document.getElementById('editar-id-overlay');
  if(ov) ov.style.display='none';
  _dialPreset = { tab:'editar', filaId:id };
  cerrarDial();
  abrirFormulario('editar');
}

function toggleEntradaDropdown(){
  if(_dialVisible) cerrarDial(); else abrirDial();
}

function abrirDial(){
  _crearDialOverlay();
  _dialHovered=-1; _dialSubHov=-1; _dialActiveSub=-1; _dialCentroHov=false; _detenerPulsoCentro();
  if(!_dialBreathRAF){
    (function _breathLoop(){
      _dialBreathT++;
      _dialDraw();
      _dialBreathRAF = requestAnimationFrame(_breathLoop);
    })();
  }

  _dialOverlay.style.opacity = '0';
  _dialOverlay.style.display = 'flex';
  _dialOverlay.style.pointerEvents = 'auto';
  _dialVisible = true;
  requestAnimationFrame(function(){
    _dialOverlay.style.transition = 'opacity 320ms cubic-bezier(.16,1,.3,1)';
    _dialOverlay.style.opacity = '1';
  });
  if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
  if(typeof window._refrescarEspejos==='function') setTimeout(function(){ window._refrescarEspejos(); }, 50);
  // Render banda Sim ya construida — renderizamos AHORA y reposicionamos después
  if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid'); if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
  if(window._hudPanels && window.innerWidth>=900){
    window._hudPanels.forEach(function(hp, i){
      hp.el.style.opacity='0'; hp.el.style.visibility='hidden';
      setTimeout(function(){
        hp.el.style.visibility='visible';
        requestAnimationFrame(function(){ hp.el.style.opacity='1'; });
      }, i * 80);
    });
    // Una vez todos visibles, re-render de barras + reposicionamiento
    // para que la banda Sim recalcule altura con el contenido ya pintado
    var totalDelay = window._hudPanels.length * 80 + 60;
    setTimeout(function(){
      if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid'); if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
      if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
    }, totalDelay);
  } else {
    // Modo compacto / mobile: aun así forzar render+reposicionamiento
    setTimeout(function(){
      if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid'); if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
      if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
    }, 100);
  }
  var btn=document.getElementById('btn-nueva-entrada');
  if(btn) btn.classList.add('active');
}

function cerrarDial(){
  if(!_dialOverlay){ _dialVisible=false; return; }
  _dialOverlay.style.transition = 'opacity 220ms ease';
  _dialOverlay.style.opacity = '0';
  _dialOverlay.style.pointerEvents = 'none';
  _dialVisible = false; _dialActiveSub=-1; _dialCentroHov=false; _detenerPulsoCentro();
  if(_dialBreathRAF){ cancelAnimationFrame(_dialBreathRAF); _dialBreathRAF=null; _dialBreathT=0; }
  var btn=document.getElementById('btn-nueva-entrada');
  if(btn) btn.classList.remove('active');
  setTimeout(function(){
    if(_dialOverlay && !_dialVisible) _dialOverlay.style.display='none';
    if(window._hudPanels){ window._hudPanels.forEach(function(hp){
      hp.el.style.opacity='0';
      hp.el.style.visibility='hidden';
    }); }
  }, 230);
}

function abrirFormulario(modo){
  var dd=document.getElementById('entrada-dropdown');
  if(dd){
    dd.style.cssText=[
      'position:fixed','inset:0','z-index:9001',
      'display:flex','align-items:center','justify-content:center',
      'background:radial-gradient(ellipse at center,rgba(80,40,140,0.18) 0%,rgba(4,4,14,0.72) 60%,rgba(0,0,8,0.82) 100%)',
      'backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
      '-webkit-backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
      'background-image:radial-gradient(ellipse at center,rgba(80,40,140,0.18) 0%,rgba(4,4,14,0.72) 100%),linear-gradient(rgba(120,80,200,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.03) 1px,transparent 1px)',
      'background-size:auto,48px 48px,48px 48px',
    ].join(';');
    dd.classList.add('show');
    if(!dd._dialClickOut){
      dd._dialClickOut=true;
      dd.addEventListener('click',function(e){
        if(e.target===dd) cerrarEntrada();
      });
    }
  }
  var inner=document.getElementById('sec-entrada');
  if(inner){
    inner.style.cssText='width:440px;max-width:96vw;max-height:90vh;overflow-y:auto;display:flex;flex-direction:column';
  }
  if(typeof _inyectarToggleModo==='function') _inyectarToggleModo();
  var tabs=document.getElementById('toggle-modo-wrap');
  if(tabs) tabs.style.display='none';
  var p1=document.getElementById('entrada-paso1');
  var p2=document.getElementById('entrada-paso2');
  if(p1) p1.style.display='none';
  if(p2) p2.style.display='block';
  if(typeof setModoEntrada==='function') setModoEntrada(modo);
  if(_dialPreset && Object.keys(_dialPreset).length){
    var presetSnap = JSON.parse(JSON.stringify(_dialPreset));
    setTimeout(function(){ _aplicarDialPreset(presetSnap); }, 120);
    _dialPreset = {};
  }
}

function _aplicarDialPreset(p){
  function selectOpt(swId, val){
    var w=document.getElementById(swId); if(!w) return;
    w.querySelectorAll('.opt').forEach(function(b){
      if(b.textContent.trim()===val){ if(!b.classList.contains('on')) b.click(); }
    });
  }
  function setVal(id, val){
    var el=document.getElementById('cv-'+id)||document.getElementById(id);
    if(!el) return;
    el.textContent=val; el.value=val;
    el.classList.remove('empty');
  }

  if(p.momento){ selectOpt('sw-momento', p.momento); setVal('momento', p.momento); }
  if(p.tipo && p.tab==='entrenamiento'){ selectOpt('sw-tipo-entrena', p.tipo); setVal('tipo', p.tipo); }
  if(p.tipo && p.tab==='salud'){ selectOpt('sw-tipo-salud', p.tipo); setVal('tipo-salud', p.tipo); }
  if(p.tipo && p.tab==='patrimonio'){ selectOpt('sw-tipo-patrimonio', p.tipo); setVal('tipo-patrimonio', p.tipo); }
  if(p.categoria){ selectOpt('sw-cat-pensamiento', p.categoria); setVal('categoria', p.categoria); }
  if(p.energia !== undefined){
    var eMap = {1:'Positiva', 0:'Neutral', '-1':'Negativa'};
    var eLabel = eMap[String(p.energia)] || eMap[p.energia];
    if(eLabel){ selectOpt('sw-energia-persona', eLabel); setVal('energia', eLabel); }
  }
  if(p.banco){
    selectOpt('sw-banco', p.banco);
    setVal('banco', p.banco);
    var entes=document.querySelectorAll('.ente-nombre');
    entes.forEach(function(el){
      if(el.textContent.trim()===p.banco){
        var row=el.closest('.ente-row'); if(row) row.click();
      }
    });
  }
  if(p.tab==='editar' && p.filaId){
    setTimeout(function(){
      var inp=document.getElementById('editar-id-input');
      if(inp){ inp.value=p.filaId; if(typeof buscarFilaId==='function') buscarFilaId(); }
    }, 80);
  }
  if(p.tab && ['libro','movie','norut'].includes(p.tab)){
    var btn=document.getElementById('btn-tab-'+p.tab);
    if(btn && !btn.classList.contains('on')) btn.click();
  }
}

function cerrarEntrada(){
  cerrarDial();
  var dd=document.getElementById('entrada-dropdown');
  var btn=document.getElementById('btn-nueva-entrada');
  if(dd){ dd.classList.remove('show'); dd.style.display='none'; }
  if(btn) btn.classList.remove('active');
  var p1=document.getElementById('entrada-paso1');
  var p2=document.getElementById('entrada-paso2');
  if(p1) p1.style.display='block';
  if(p2) p2.style.display='none';
}

function volverAPaso1(){ cerrarEntrada(); abrirDial(); }
function abrirEntrada(){ abrirDial(); }
function _abrirEntradaLegacy(){ abrirDial(); }
function _posicionarRadial(){}

// ══════════════════════════════════════════
//  GUARDAR BANCO
// ══════════════════════════════════════════
function guardarBanco(){
  const nombre=document.getElementById('banco-nombre').value.trim();
  const monto=parseFloat(document.getElementById('banco-monto').value);
  const fecha=document.getElementById('banco-fecha').value;
  if(!nombre||isNaN(monto)||!fecha){ showToast('Completa todos los campos',false); return; }
  const btn=document.querySelector('#form-banco-wrap .btn-save');
  btn.disabled=true;
  api.guardarEnBancos(nombre,monto,fecha)
    .then(r=>{
      btn.disabled=false;
      if(r.ok){
        showToast('✓ Banco guardado');var sb=document.querySelector('.btn-save');if(sb){sb.classList.add('saved');setTimeout(function(){sb.classList.remove('saved');},1200);}
        document.getElementById('banco-nombre').value='';
        document.getElementById('banco-monto').value='';
        const bfEl=document.getElementById('banco-fecha'); if(bfEl) bfEl.value=fmtD(new Date());
        api.getFijos().then(renderEntes);
      } else { showToast(r.mensaje||'Error',false); }
    })
    .catch(()=>{ btn.disabled=false; showToast('Error al guardar',false); });
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
function togGraf(bodyId){
  var body=document.getElementById(bodyId); if(!body)return;
  var isOpen=body.style.display!=='none';
  body.style.display=isOpen?'none':'block';
  var chevId=bodyId.replace('-body','-chev');
  var chev=document.getElementById(chevId);
  if(chev) chev.style.transform=isOpen?'':'rotate(180deg)';
  if(!isOpen){ setTimeout(function(){ var canvas=body.querySelector('canvas'); if(canvas&&canvas._chart) canvas._chart.resize(); window.dispatchEvent(new Event('resize')); },50); }
}

window.addEventListener('DOMContentLoaded',()=>{
  const hoy=fmtD(new Date());
  const fechaEl=document.getElementById('fecha');
  if(fechaEl) fechaEl.value=hoy;
  _inyectarToggleModo();

  var _dialLandingUsed = false;

  _crearDialOverlay();
  _dialOverlay.style.pointerEvents = 'none';

  _dialCanvas.style.opacity = '0';
  _dialCanvas.style.transition = 'opacity 2000ms ease-out';

  _dialOverlay.style.display = 'flex';
  _dialOverlay.style.opacity = '1';
  _dialVisible = true;
  _dialOverlay.style.pointerEvents = 'auto';

  if(!_dialBreathRAF){
    (function _breathLoopLanding(){
      _dialBreathT++;
      _dialDraw();
      _dialBreathRAF = requestAnimationFrame(_breathLoopLanding);
    })();
  }

  requestAnimationFrame(function(){
    var rb = document.getElementById('render-block');
    if(rb) rb.parentNode.removeChild(rb);
    setTimeout(function(){
      if(typeof _reposicionarHUD==='function') _reposicionarHUD();
      _dialCanvas.style.opacity = '1';
      if(window._hudPanels && window.innerWidth >= 900){
        var shuffledPanels = window._hudPanels.slice().sort(function(){ return Math.random()-0.5; });
        shuffledPanels.forEach(function(hp, i){
          var delay = 1100 + i * 200 + Math.round(Math.random() * 150);
          setTimeout(function(){
            hp.el.style.visibility = 'visible';
            requestAnimationFrame(function(){ hp.el.style.opacity = '1'; });
          }, delay);
        });
      }
    }, 50);
  });

  _dialOverlay.addEventListener('click', function(e){
    if(e.target === _dialOverlay) cerrarDial();
  });
  window.addEventListener('resize', function(){
    if(_dialVisible && typeof _reposicionarHUD==='function') _reposicionarHUD();
  });

  var _origCerrarDial = cerrarDial;
  cerrarDial = function(){
    if(!_dialLandingUsed){
      _dialLandingUsed = true;
      _dialOverlay.style.display = 'none';
      _dialVisible = false;
      _dialActiveSub = -1; _dialCentroHov = false; _detenerPulsoCentro();
      var btn = document.getElementById('btn-nueva-entrada');
      if(btn) btn.classList.remove('active');
      _dialCanvas.style.opacity = '';
      _dialCanvas.style.transition = '';
      var anv = document.getElementById('board-anverso');
      if(anv){
        anv.style.display = '';
        anv.style.visibility = '';
        anv.style.opacity = '1';
      }
      if(window._hudPanels){ window._hudPanels.forEach(function(hp){
        hp.el.style.opacity='0';
        hp.el.style.visibility='hidden';
      }); }
      var splash = document.getElementById('splash-dial');
      if(splash && splash.parentNode) splash.parentNode.removeChild(splash);
    } else {
      _origCerrarDial();
    }
  };

  setChip('load','Cargando');
  api.getAll()
    .then(d=>{
      if(!d.ok&&!d.catalogos){ setChip('err','Error'); mostrarErrorConexion('getAll falló: '+(d.error||'sin datos')); return; }
      sheetUrl=d.sheetUrl||'';
      onCats(d.catalogos);
      if(typeof renderApartados==='function') renderApartados(d.apartados||{items:[],totalApartado:0});
      if(typeof renderEntes==='function') renderEntes(d.fijos);
      if(typeof onDatosMes==='function') onDatosMes(d.datosMes);
      if(typeof renderAnualidad==='function') renderAnualidad(d.gastos);
      if(typeof renderLogros==='function') renderLogros(d.logros);
      if(typeof renderNecesidades==='function') renderNecesidades(d.necesidades);
      if(typeof renderNecesidadesInline==='function'){
        renderNecesidadesInline(d.necesidades);
        setTimeout(function(){ if(typeof actualizarNecInline==='function') actualizarNecInline(); },50);
      }
      if(typeof renderFlujoMensual==='function') renderFlujoMensual(d.flujoPorMes);
      if(d.activityCheck){ _actData=d.activityCheck; }
      if(typeof renderFinancieroAvanzado==='function'&&d.financieroAvanzado) renderFinancieroAvanzado(d.financieroAvanzado);

      // ── Backend v5.006 incluye estos en getAll ──
      if(d.pensamientos){ window._pensamientosData=d.pensamientos; if(typeof renderPensamientos==='function') renderPensamientos(d.pensamientos); }
      if(d.relaciones){   window._relacionesData=d.relaciones;     if(typeof renderRelaciones==='function')   renderRelaciones(d.relaciones); }
      if(d.salud){        window._saludData=d.salud;               if(typeof renderSalud==='function')        renderSalud(d.salud); }
      if(d.nutricion){    window._nutData=d.nutricion;             if(typeof renderNutricion==='function')    renderNutricion(d.nutricion); }
      if(d.entrenamiento){window._entData=d.entrenamiento;         if(typeof renderEntrenamiento==='function')renderEntrenamiento(d.entrenamiento); }
      if(d.patrimonio){   window._patrimonioData=d.patrimonio;     if(typeof renderPatrimonio==='function')   renderPatrimonio(d.patrimonio); }
      if(d.financieroAvanzado){ window._finData=d.financieroAvanzado; }

      // Fallback: si el backend no devuelve estos endpoints (Code.gs viejo), pedirlos sueltos
      if(!d.pensamientos) api.getPensamientos().then(r=>{ window._pensamientosData=r; if(typeof renderPensamientos==='function') renderPensamientos(r); setTimeout(function(){ if(window._refrescarEspejos) window._refrescarEspejos(); },200); }).catch(()=>{});
      if(!d.relaciones)   api.getRelaciones().then(r=>{ window._relacionesData=r; if(typeof renderRelaciones==='function') renderRelaciones(r); }).catch(()=>{});
      if(!d.salud)        api.getSalud().then(r=>{ window._saludData=r; if(typeof renderSalud==='function') renderSalud(r); }).catch(()=>{});
      if(!d.patrimonio)   api.getPatrimonio().then(r=>{ window._patrimonioData=r; if(typeof renderPatrimonio==='function') renderPatrimonio(r); }).catch(()=>{});
      if(!d.financieroAvanzado) api.getFinancieroAvanzado().then(r=>{ window._finData=r; }).catch(()=>{});

      if(typeof cargarScore==='function') cargarScore();
      if(typeof cargarRevision==='function') cargarRevision('mensual',new Date().getFullYear(),new Date().getMonth()+1,null);

      window._hudDatos = {
        totalApartado: (d.apartados&&d.apartados.totalApartado) || 0,
        necesidades: d.necesidades || {},
        datosMes: d.datosMes || {},
        financiero: d.financieroAvanzado || {},
      };
      setTimeout(function(){
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos(window._hudDatos);
      }, 600);
      setTimeout(function(){
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos(window._hudDatos);
      }, 3000);
    })
    .catch(err=>{ setChip('err','Error'); mostrarErrorConexion(err.message); });

  initTooltip();
  _initMobTablero();
  const bfEl=document.getElementById('banco-fecha'); if(bfEl) bfEl.value=fmtD(new Date());
  _initEncomTheme();
});

// ══════════════════════════════════════════
//  ENCOM THEME
// ══════════════════════════════════════════
function _initEncomTheme(){
  if(localStorage.getItem('lifeos_theme')==='encom'){
    document.documentElement.classList.add('encom');
    _updateEncomBtn(true);
  }
}
function toggleEncomTheme(){
  const isEncom=document.documentElement.classList.toggle('encom');
  localStorage.setItem('lifeos_theme',isEncom?'encom':'default');
  _updateEncomBtn(isEncom);
  showToast(isEncom?'⬡ ENCOM MODE ON':'● Default Mode',true);
}
function _updateEncomBtn(active){
  const btn=document.getElementById('btn-encom-toggle'); if(!btn)return;
  btn.title=active?'Desactivar Encom Mode':'Activar Encom Mode';
}
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
function progStart(){const b=document.getElementById('prog');b.className='prog-bar ind';}
function progDone(){const b=document.getElementById('prog');b.className='prog-bar';b.style.width='100%';setTimeout(()=>{b.style.width='0%';},400);}

// ══════════════════════════════════════════
//  ACORDEONES
// ══════════════════════════════════════════
function togKard(id){ const el=document.getElementById(id);if(!el)return;const isOpen=el.style.display==='block';el.style.display=isOpen?'none':'block'; }
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
var _panelActual = 'anverso';

function _irAPanel(boardId, tabKey){
  var esAnverso = (boardId === 'board-anverso');
  if(!esAnverso && _panelActual === boardId){
    if(typeof volverAlAnverso==='function') volverAlAnverso();
    return;
  }
  _panelActual = esAnverso ? 'anverso' : boardId;

  var anverso = document.getElementById('board-anverso');
  if(anverso){
    if(esAnverso) anverso.classList.remove('slide-right','slide-left');
    else          anverso.classList.add('slide-right');
  }

  document.querySelectorAll('.board-face:not(.anverso)').forEach(function(f){
    f.classList.remove('active');
  });
  if(!esAnverso){
    var dest = document.getElementById(boardId);
    if(dest) dest.classList.add('active');
  }

  document.querySelectorAll('.btn-flip').forEach(function(b){ b.classList.remove('active'); });
  var bh = document.getElementById('btn-home');
  if(bh) bh.classList.toggle('on', esAnverso);
  var ids = {'logros':'btn-logros','bitacora':'btn-maslow',
              'activity':'btn-activity','nutricion':'btn-nutricion','sheets':'btn-sheets'};
  var heroBtn = document.getElementById(ids[tabKey] || ('btn-'+tabKey));
  if(heroBtn) heroBtn.classList.add('active');

  document.querySelectorAll('.mob-tab').forEach(function(t){
    t.classList.toggle('active', t.dataset.tab === tabKey);
  });
}

window.volverAlAnverso = window.volverAlAnverso || function(){
  _panelActual = 'anverso';
  var anv = document.getElementById('board-anverso');
  if(anv) anv.classList.remove('slide-right','slide-left');
  document.querySelectorAll('.board-face:not(.anverso)').forEach(function(f){ f.classList.remove('active'); });
  // Resetear estilos inline del board-activity (que se ponen a position:fixed al renderizar)
  var bAct = document.getElementById('board-activity');
  if(bAct){
    bAct.style.position = '';
    bAct.style.top = bAct.style.left = bAct.style.right = bAct.style.bottom = '';
    bAct.style.zIndex = '';
    bAct.style.height = bAct.style.maxHeight = '';
    bAct.style.display = '';
  }
  var bh = document.getElementById('btn-home'); if(bh) bh.classList.add('on');
  document.querySelectorAll('.btn-flip').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.mob-tab').forEach(function(t){ t.classList.toggle('active', t.dataset.tab==='entrada'); });
  var dd = document.getElementById('entrada-dropdown');
  if(dd){ dd.classList.remove('show'); dd.style.display='none'; }
};

window.irABitacora = window.irABitacora || function(){
  _irAPanel('board-bitacora','bitacora');
};

window.irAActivity = window.irAActivity || function(){
  _irAPanel('board-activity','activity');
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
window.irANutricion = window.irANutricion || function(){
  _irAPanel('board-nutricion','nutricion');
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

window._syncMobTab = window._syncMobTab || function(tabKey){
  document.querySelectorAll('.mob-tab').forEach(function(t){
    t.classList.toggle('active', t.dataset.tab===tabKey);
  });
};

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
    const wrap=document.getElementById(modo+'-wrap'); if(wrap)wrap.style.display='block';
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
    return `<div class="ente-row${excluido?' excluido-total':''}" onclick="togEnteEdit(${f.fila})">
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
        onkeydown="if(event.key==='Enter')guardarEnte(${f.fila});if(event.key==='Escape')togEnteEdit(${f.fila})">
      <button class="btn-check" id="ec-${f.fila}" onclick="guardarEnte(${f.fila})"><i class="fas fa-check" id="ei-ico-${f.fila}"></i></button>
    </div>`;
  }).join('')+(hayExcluidos?'<div class="ente-excluido-nota">* excluido del total</div>':'');
}
function togEnteEdit(fila){
  const ee=document.getElementById('ee-'+fila); if(!ee) return;
  const isOpen=ee.classList.contains('open');
  document.querySelectorAll('.ente-edit').forEach(e=>e.classList.remove('open'));
  if(!isOpen){ee.classList.add('open');document.getElementById('ei-'+fila).focus();}
}
function guardarEnte(fila){
  const inp=document.getElementById('ei-'+fila);
  const val=parseFloat(inp.value);
  if(isNaN(val))return;
  const ico=document.getElementById('ei-ico-'+fila);
  ico.className='fas fa-circle-notch fa-spin';
  api.actualizarFijo(fila,val).then(r=>{
    ico.className='fas fa-check';
    if(r.ok){
      const {txt,cls}=fmtMoneda(val);
      const em=document.getElementById('em-'+fila);
      if(em){em.textContent=txt;em.className='ente-monto '+cls;}
      togEnteEdit(fila);
      Promise.all([api.getFijos(),api.getApartados(),api.getPatrimonio()]).then(([fijos,apData,pat])=>{
        if(apData&&typeof renderApartados==='function')renderApartados(apData);
        if(typeof renderEntes==='function')renderEntes(fijos);
        if(pat&&typeof renderPatrimonio==='function'){window._patrimonioData=pat;renderPatrimonio(pat);}
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();
      }).catch(()=>api.getFijos().then(f=>{if(typeof renderEntes==='function')renderEntes(f);}));
    }
  }).catch(()=>{ico.className='fas fa-check';});
}

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
        return '<div class="_act-chk" data-fila="'+fila+'" data-dia="'+dia+'" data-tipo="'+tipo+'"'+
          ' '+tooltip+
          ' style="position:relative;width:22px;height:22px;min-width:22px;border-radius:50%;cursor:pointer;transition:all 200ms;'+
          'border:1.5px solid '+(isChecked?c.color:esH?'rgba(255,255,255,.35)':'rgba(100,80,160,0.3)')+';'+
          'background:'+(isChecked?c.color:'transparent')+';'+
          'box-shadow:'+(isChecked?'0 0 8px '+c.glow+',0 0 4px '+c.glow:'none')+';'+
          'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px">'+
          (isChecked?'<i class="fas fa-check" style="font-size:8px;color:#fff;pointer-events:none"></i>':'')+
          (isChecked&&fechaHora?'<span style="font-size:5px;color:rgba(255,255,255,0.75);pointer-events:none;line-height:1;letter-spacing:0;font-weight:600">'+fechaHora+'</span>':'')+
        '</div>';
      }

      function chkItem(fila, tipo, done){
        var c = CAT[tipo];
        // Recuperar fecha guardada localmente para este check
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
          'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0">'+
          (done?'<i class="fas fa-check" style="font-size:9px;color:#fff;pointer-events:none;line-height:1"></i>':'')+
          (done&&fechaLocal?'<span style="font-size:5px;color:rgba(255,255,255,0.85);pointer-events:none;line-height:1;font-weight:700;margin-top:1px">'+fechaLocal+'</span>':'')+
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
        return s;
      }

      function habTable(items, tipo){
        var c = CAT[tipo]; var dias = c.dias;
        if(!items||!items.length) return '<div style="padding:24px;text-align:center;color:rgba(200,208,230,0.25);font-size:12px">Sin hábitos</div>';
        var sorted = applyHabFilter(items, tipo);
        var h = '<table style="width:100%;border-collapse:collapse">';
        h += '<tr><th style="text-align:left;padding:6px 16px;font-size:10px;font-weight:600;letter-spacing:.10em;color:rgba(200,208,230,0.45);border-bottom:1px solid rgba(140,100,220,0.14);position:sticky;top:0;background:rgba(14,8,28,0.95);z-index:1">HÁBITO</th>';
        dias.forEach(function(d){
          var esH=(d===diaKey);
          h += '<th style="text-align:center;padding:6px 4px;font-size:10px;font-weight:'+(esH?700:600)+';'+
               'color:'+(esH?c.color:'#7A8499')+';border-bottom:1px solid rgba(140,100,220,0.14);min-width:36px;'+
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
               '<td style="padding:8px 16px;border-bottom:1px solid rgba(140,100,220,0.14)">'+
                 (hab.sims||hab.bw?'<div style="font-size:10px;font-weight:600;letter-spacing:.10em;color:rgba(200,208,230,0.25);text-transform:uppercase;margin-bottom:1px">'+(hab.sims||hab.bw)+'</div>':'')+
                 '<div style="font-size:13px;font-weight:500;color:'+(allDone?c.color:'#C8D0E0')+';'+
                 'max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'+
                 (allDone?'text-shadow:0 0 8px '+c.glow:'')+'">' + hab.nombre+'</div>'+
               '</td>';
          dias.forEach(function(dia){
            h += '<td style="text-align:center;padding:6px 4px;border-bottom:1px solid rgba(140,100,220,0.14)">'+
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
        return '<div style="display:flex;flex-direction:column;width:100%">'+
          sorted.map(function(it){
            var done=it.completado===true||it.completado==='Sí'||it.completado==='Si';
            return '<div class="_item-row" style="display:flex;align-items:center;gap:10px;padding:8px 16px;'+
              'transition:background .15s;border-bottom:1px solid rgba(140,100,220,0.14)"'+
              ' onmouseover="this.style.background=\'rgba(25,14,52,0.7)\'" onmouseout="this.style.background=\'transparent\'">'+
              chkItem(it.fila, tipo, done)+
              '<span style="font-size:13px;font-weight:500;color:'+(done?'#4A5266':'#C8D0E0')+';'+
              'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;'+
              'line-height:1.4;word-break:break-word;min-width:0;flex:1">'+it.nombre+'</span>'+
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
        personal:    'flex:2 1 0;min-width:240px',
        electronics: 'flex:2 1 0;min-width:240px',
        libro:       'flex:1 1 0;min-width:180px',
        movie:       'flex:1 1 0;min-width:180px',
        norut:       'flex:1 1 0;min-width:180px',
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
      // Forzar altura disponible: la ventana menos lo que ocupa el hero arriba
      var topOffset = board.getBoundingClientRect().top + window.scrollY;
      // Si el board está oculto temporalmente, usamos 0 como fallback seguro
      if(topOffset < 0 || isNaN(topOffset)) topOffset = 0;
      board.style.height = 'calc(100vh - '+topOffset+'px)';
      board.style.maxHeight = 'calc(100vh - '+topOffset+'px)';

      board.innerHTML =
        header +
        // Contenedor principal: flex:1 con min-height:0 para que sus hijos puedan scrollear
        '<div style="display:flex;gap:8px;padding:8px;flex:1;min-height:0;overflow:hidden;align-items:stretch">'+
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
          if(nowChk){
            c.setAttribute('title', horaStr);
            c.innerHTML = '<i class="fas fa-check" style="font-size:8px;color:#fff;pointer-events:none"></i>'+
              '<span style="font-size:5px;color:rgba(255,255,255,0.75);pointer-events:none;line-height:1;font-weight:600">'+horaStr+'</span>';
            c.style.flexDirection='column';c.style.gap='1px';
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
          // Guardar fecha en localStorage
          try {
            var lsKey = 'actItemDate:'+tipo+':'+fila;
            if(nowDone) localStorage.setItem(lsKey, fechaStr);
            else        localStorage.removeItem(lsKey);
          } catch(e2){}
          it.style.borderColor = nowDone?cat.color:'#26304A';
          it.style.background  = nowDone?cat.color:'transparent';
          it.style.boxShadow   = nowDone?'0 0 8px '+cat.glow:'none';
          it.style.flexDirection='column';
          if(nowDone){
            it.setAttribute('title', fechaStr);
            it.innerHTML = '<i class="fas fa-check" style="font-size:9px;color:#fff;pointer-events:none;line-height:1"></i>'+
              '<span style="font-size:5px;color:rgba(255,255,255,0.85);pointer-events:none;line-height:1;font-weight:700;margin-top:1px">'+fechaStr+'</span>';
          } else {
            it.removeAttribute('title');
            it.innerHTML = '';
          }
          var row = it.parentElement;
          var sp  = row&&row.querySelector('span');
          if(sp) sp.style.color = nowDone?'#4A5266':'#C8D0E0';
          if(row&&row.parentElement){
            if(nowDone) row.parentElement.appendChild(row);
            else        row.parentElement.insertBefore(row, row.parentElement.firstChild);
          }
          // Sincronizar dato local
          var d2 = window._actData;
          if(d2){
            var arr2 = tipo==='libro'?d2.libros:tipo==='movie'?d2.movies:d2.noRutinarias;
            var item2 = (arr2||[]).find(function(x){ return x.fila===fila; });
            if(item2) item2.completado = nowDone;
          }
          if(typeof api!=='undefined') api.marcarActivityItem(tipo, fila, nowDone);
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
