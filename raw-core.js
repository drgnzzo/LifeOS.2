/* RAW Entry — Core v.5.056
   Dial rediseñado en Canvas 2D puro.
   Overlay: position:fixed, backdrop-filter:blur, sin caja, sin marco.
   El canvas flota sobre el blur. Sin referencias a dial.html.
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
//  DIAL — Canvas 2D
//  Overlay: position:fixed, blur, sin caja
// ══════════════════════════════════════════

// Definición de sectores con iconos Lucide-style dibujados en canvas
// ══════════════════════════════════════════
//  DIAL — Canvas 2D v3
//  Canvas 800px para que el subanillo quepa
//  Ícono centrado en gajo + texto pequeño debajo (como referencia)
//  Segundo anillo visible sin cortes
// ══════════════════════════════════════════

// Colores de sector — monocromáticos
// Monocromático — profundidad por capas de gris oscuro
// ══════════════════════════════════════════
//  DIAL — Canvas 2D v4
//  Réplica de referencia: gajos 3D con borde iluminado,
//  ícono grande centrado, label uppercase, glow exterior
// ══════════════════════════════════════════

// Colores base — monocromático con acento por sector en ícono
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

// Contexto pre-seleccionado desde el dial — se lee en abrirFormulario
var _dialPreset = {};

// Función helper para íconos de subs simples (texto)
function _icoTexto(label){ return function(ctx,x,y,s,c){ var k=s/22; ctx.font='bold '+Math.round(s*0.38)+'px -apple-system,sans-serif'; ctx.fillStyle=c; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,x,y); }; }

var _DIAL_ITEMS = [
  // ── ACTIVITY — subs: tipo de registro ──
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

  // ── APARTADO — directo al form ──
  { id:'apartado', label:'Apartado', accent:'#4ade80',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.arc(x,y-2*k,5.5*k,0,Math.PI*2);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();ctx.beginPath();ctx.moveTo(x-8*k,y+5*k);ctx.lineTo(x+8*k,y+5*k);ctx.lineTo(x+6*k,y+10*k);ctx.lineTo(x-6*k,y+10*k);ctx.closePath();ctx.strokeStyle=c;ctx.lineWidth=2;ctx.stroke();}},

  // ── BANCOS — subs: banco específico de _fijosData ──
  { id:'bancos', label:'Bancos', accent:'#f59e0b',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.beginPath();ctx.moveTo(x-9*k,y+7*k);ctx.lineTo(x+9*k,y+7*k);ctx.moveTo(x-6*k,y-1*k);ctx.lineTo(x-6*k,y+7*k);ctx.moveTo(x,y-1*k);ctx.lineTo(x,y+7*k);ctx.moveTo(x+6*k,y-1*k);ctx.lineTo(x+6*k,y+7*k);ctx.moveTo(x-9*k,y-1*k);ctx.lineTo(x+9*k,y-1*k);ctx.moveTo(x-10*k,y-6*k);ctx.lineTo(x,y-12*k);ctx.lineTo(x+10*k,y-6*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineCap='round';ctx.lineJoin='round';ctx.stroke();},
    subsGen:function(){
      // Genera subs dinámicamente desde _fijosData al momento de abrir
      var bancos=(window._fijosData||[]).filter(function(f){return f.nombre&&f.nombre!=='P';}).slice(0,5);
      if(!bancos.length) return null;
      return bancos.map(function(f){
        return {id:'bancos', label:f.nombre, accent:'#f59e0b', draw:_icoTexto(f.nombre.slice(0,4)),
          preset:function(){ _dialPreset={tab:'bancos', banco:f.nombre}; }};
      });
    }},

  // ── ENTRENAMIENTO — subs: tipo de entrenamiento ──
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

  // ── NUTRICIÓN — subs: momento del día ──
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

  // ── PATRIMONIO — subs: tipo de movimiento ──
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

  // ── PENSAMIENTO — subs: categoría ──
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

  // ── PERSONA — subs: energía ──
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

  // ── EDITAR — especial: abre input HTML flotante para ID ──
  { id:'editar', label:'Editar', accent:'#a5b4fc',
    draw:function(ctx,x,y,s,c){var k=s/22;ctx.save();ctx.translate(x,y);ctx.rotate(-Math.PI/4);ctx.beginPath();ctx.rect(-2.5*k,-9*k,5*k,16*k);ctx.strokeStyle=c;ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();ctx.beginPath();ctx.moveTo(-2.5*k,7*k);ctx.lineTo(0,12*k);ctx.lineTo(2.5*k,7*k);ctx.fillStyle=c;ctx.fill();ctx.restore();},
    accionEspecial:true},  // abre input ID overlay en vez de subs canvas

  // ── SALUD — subs: tipo de registro ──
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
var _dialCentroHov  = false;   // hover sobre botón RAW
var _dialPulseT     = 0;       // tiempo para animación pulso centro
var _dialRAF        = null;    // requestAnimationFrame del pulso
var _subRingProg    = 0;       // progreso 0→1 de la entrada del subanillo
var _subRingRAF     = null;    // rAF de la animación del subanillo
var _subRingPrevSub = -1;      // qué sector tenía el subanillo activo
var _dialBreathT    = 0;       // tiempo continuo para breathing del dial
var _dialBreathRAF  = null;    // rAF del breathing

// Geometría del dial
var _DC = {
  W:920, H:920, CX:460, CY:460,
  R_IN:90,    // agujero grande — como en referencia
  R_OUT:310,  // anillo principal profundo
  R_SI:328,   // inicio subanillo
  R_SO:420,   // fin subanillo — 460-40=420 margen OK
  GAP:0.022,
};

function _crearDialOverlay(){
  if(_dialOverlay) return;

  _dialOverlay = document.createElement('div');
  _dialOverlay.id = 'dial-overlay';
  _dialOverlay.style.cssText = [
    'position:fixed','inset:0','z-index:9000',
    'display:none','align-items:center','justify-content:center',
    'background:rgba(4,4,10,0.5)',
    'backdrop-filter:blur(24px) saturate(150%)',
    '-webkit-backdrop-filter:blur(24px) saturate(150%)',
  ].join(';');

  _dialCanvas = document.createElement('canvas');
  _dialCanvas.width  = _DC.W;
  _dialCanvas.height = _DC.H;
  _dialCanvas.style.cssText = 'display:block;cursor:pointer;width:min(850px,88vw);height:min(850px,88vw);position:relative;pointer-events:auto;z-index:1';
  _dialCtx = _dialCanvas.getContext('2d');

  // Overlay del dial
  _dialOverlay.style.cssText = [
    'position:fixed','inset:0','z-index:9000',
    'display:none','align-items:center','justify-content:center',
    'opacity:0','pointer-events:none',
    // Fondo atmosférico — viñeta radial + tinte violeta + blur
    'background:radial-gradient(ellipse at center,rgba(80,40,140,0.15) 0%,rgba(4,4,14,0.65) 100%)',
    'backdrop-filter:blur(28px) saturate(160%) brightness(0.68)',
    '-webkit-backdrop-filter:blur(28px) saturate(160%) brightness(0.68)',
  ].join(';');

  // ── Partículas ambientales y glow de breathing ──
  var _glowEl = document.createElement('div');
  _glowEl.id = 'dial-ambient';
  _glowEl.style.cssText = [
    'position:absolute','inset:0','pointer-events:none','z-index:0',
    // Glow central violeta pulsante
    'background:radial-gradient(ellipse 600px 600px at 50% 50%, rgba(120,80,200,0.06) 0%, transparent 70%)',
    'animation:dialBreath 4s ease-in-out infinite',
  ].join(';');
  // Keyframes de breathing
  if(!document.getElementById('dial-keyframes')){
    var ks = document.createElement('style');
    ks.id = 'dial-keyframes';
    ks.textContent = [
      '@keyframes dialBreath{',
        '0%,100%{opacity:.6;transform:scale(1);}',
        '50%{opacity:1;transform:scale(1.08);}',
      '}',
      '@keyframes dialGlowPulse{',
        '0%,100%{box-shadow:0 0 0 1px rgba(120,80,200,0.08),0 4px 32px rgba(0,0,0,0.5);}',
        '50%{box-shadow:0 0 0 1px rgba(140,100,220,0.20),0 4px 48px rgba(80,40,140,0.3),0 0 60px rgba(120,80,200,0.08);}',
      '}',
      '.hud-panel-glow{animation:dialGlowPulse 4s ease-in-out infinite;}',
    ].join('');
    document.head.appendChild(ks);
  }
  _dialOverlay.appendChild(_glowEl);

  // ── HUD PANELS — 6 paneles alrededor del dial ──
  var _hudPanels = [];

  // CSS base compartido
  var _hudBase = [
    'position:fixed','z-index:9001',
    'background:rgba(10,8,22,0.90)',
    'border:1px solid rgba(140,100,220,0.28)',
    'backdrop-filter:blur(18px)','-webkit-backdrop-filter:blur(18px)',
    'clip-path:polygon(12px 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%,0 12px)',
    'opacity:0','visibility:hidden',
    'transition:opacity 500ms ease-out',
    'overflow:hidden',
    'font-family:-apple-system,BlinkMacSystemFont,sans-serif',
    'animation:dialGlowPulse 4s ease-in-out infinite',
  ].join(';');

  function _mkP(id, top, left, w){
    var p = document.createElement('div');
    p.id = id;
    p.style.cssText = _hudBase;
    p.style.top     = top;
    p.style.left    = left;
    p.style.width   = w + 'px';
    p.style.maxHeight = '310px';
    p.style.overflowY = 'auto';
    // Guardar offsets para reposicionamiento dinámico
    p._posTop  = top;
    p._posLeft = left;
    return p;
  }

  // Reposicionar paneles respecto al canvas real en pantalla
  function _reposicionarHUD(){
    if(!_dialCanvas || !window._hudPanels) return;
    var r = _dialCanvas.getBoundingClientRect();
    var cx = r.left + r.width/2;   // centro X del canvas en pantalla
    var cy = r.top  + r.height/2;  // centro Y del canvas en pantalla
    var hw = r.width/2;            // mitad del ancho del canvas
    var GAP = 18;                  // espacio entre canvas y panel

    var positions = [
      // [panelIndex, xFactor, yOffset, ancho]
      // xFactor: -1=izquierda, +1=derecha
      // yOffset: offset desde el centro Y
      {i:0, side:-1, yOff:-230, w:200}, // Patrimonio   top-izq
      {i:1, side: 1, yOff:-230, w:220}, // Financiero   top-der
      {i:2, side:-1, yOff: -60, w:200}, // Necesidades  mid-izq
      {i:3, side: 1, yOff: -60, w:220}, // Activity     mid-der
      {i:4, side:-1, yOff: 130, w:200}, // Bitácora     bot-izq
      {i:5, side: 1, yOff: 130, w:210}, // Navegación   bot-der
    ];

    positions.forEach(function(pos){
      var hp = window._hudPanels[pos.i];
      if(!hp || !hp.el) return;
      var panelW = pos.w;
      var x = pos.side === -1
        ? cx - hw - GAP - panelW  // izquierda del canvas
        : cx + hw + GAP;           // derecha del canvas
      var y = cy + pos.yOff;
      hp.el.style.left = Math.max(8, x) + 'px';
      hp.el.style.top  = Math.max(8, y) + 'px';
      hp.el.style.width = panelW + 'px';
    });
  }
  window._reposicionarHUD = _reposicionarHUD;



  // ── Keyframes HUD ──
  (function(){
    if(document.getElementById('hud-panel-keyframes')) return;
    var ks2 = document.createElement('style');
    ks2.id = 'hud-panel-keyframes';
    ks2.textContent = [
      '@keyframes hudBreath{0%,100%{box-shadow:0 0 0 1px rgba(140,100,220,0.10),0 12px 60px rgba(0,0,0,.75),0 0 30px var(--hud-glow,rgba(139,92,246,0.05))}50%{box-shadow:0 0 0 1px rgba(140,100,220,0.30),0 12px 60px rgba(0,0,0,.85),0 0 60px var(--hud-glow,rgba(139,92,246,0.18))}}',
      '@keyframes hudScan{0%{top:-2px;opacity:0}5%{opacity:.8}95%{opacity:.8}100%{top:100%;opacity:0}}',
      '@keyframes hudAccPulse{0%,100%{opacity:.4;box-shadow:0 0 4px var(--acc,#A855F7)}50%{opacity:1;box-shadow:0 0 12px var(--acc,#A855F7),0 0 24px var(--acc,#A855F7)44}}',
      '@keyframes hudValIn{0%{opacity:0;transform:translateY(4px)}100%{opacity:1;transform:none}}',
      '@keyframes hudBarIn{from{width:0}to{width:var(--bw,0%)}}',
      '@keyframes hudDotPulse{0%,100%{transform:scale(1);opacity:.7}50%{transform:scale(1.5);opacity:1}}',
      // Partículas flotantes del fondo de los panels
      '@keyframes hudFloat{0%,100%{transform:translateY(0) translateX(0);opacity:.3}33%{transform:translateY(-8px) translateX(3px);opacity:.7}66%{transform:translateY(-4px) translateX(-2px);opacity:.5}}',
    ].join('');
    document.head.appendChild(ks2);
  })();

  // ── BASE PANEL — posición fija, glassmorphism, chamfer ──
  function _mkHudPanel(id, side){
    var p = document.createElement('div');
    p.id = id;
    // side: 'left' | 'right' — se posiciona con JS dinámicamente
    p.style.cssText = [
      'position:fixed','z-index:9001',
      'background:rgba(10,7,22,0.82)',
      'border:1px solid rgba(140,100,220,0.20)',
      'backdrop-filter:blur(24px) saturate(180%)',
      '-webkit-backdrop-filter:blur(24px) saturate(180%)',
      'opacity:0','visibility:hidden',
      'transition:opacity 500ms ease-out',
      'overflow:hidden',
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif',
      'animation:hudBreath 4s ease-in-out infinite',
      // Circuit-board pattern
      'background-image:linear-gradient(rgba(120,80,200,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.018) 1px,transparent 1px)',
      'background-size:32px 32px',
    ].join(';');
    p._side = side;
    return p;
  }

  // ── Reposicionar — 1 panel izq + 1 panel der, usando todo el espacio ──
  function _reposicionarHUD(){
    if(!_dialCanvas || !window._hudPanels) return;
    var r = _dialCanvas.getBoundingClientRect();
    var cLeft  = r.left;   // borde izq del canvas
    var cRight = r.right;  // borde der del canvas
    var cTop   = r.top;
    var cBot   = r.bottom;
    var cH     = r.height;
    var vW     = window.innerWidth;
    var vH     = window.innerHeight;
    var GAP    = 16;

    // Panel izquierdo: desde borde izq de pantalla hasta borde izq del canvas
    var leftW  = Math.max(240, cLeft - GAP*2);
    var leftX  = GAP;
    // Panel derecho: desde borde der del canvas hasta borde der de pantalla
    var rightW = Math.max(240, vW - cRight - GAP*2);
    var rightX = cRight + GAP;

    // Altura: casi toda la pantalla, centrado verticalmente con el dial
    var panH   = Math.min(vH - 40, Math.max(cH + 40, 520));
    var panY   = Math.max(20, (vH - panH) / 2);

    window._hudPanels.forEach(function(hp){
      if(!hp || !hp.el) return;
      if(hp.el._side === 'left'){
        hp.el.style.left   = leftX + 'px';
        hp.el.style.width  = leftW + 'px';
        hp.el.style.top    = panY + 'px';
        hp.el.style.height = panH + 'px';
        hp.el.style.maxHeight = panH + 'px';
        hp.el.style.overflowY = 'auto';
        // Chamfer left panel: top-right y bottom-left
        hp.el.style.clipPath = 'polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px))';
      } else {
        hp.el.style.left   = rightX + 'px';
        hp.el.style.width  = rightW + 'px';
        hp.el.style.top    = panY + 'px';
        hp.el.style.height = panH + 'px';
        hp.el.style.maxHeight = panH + 'px';
        hp.el.style.overflowY = 'auto';
        // Chamfer right panel: top-left y bottom-right
        hp.el.style.clipPath = 'polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px)';
      }
    });
  }
  window._reposicionarHUD = _reposicionarHUD;

  // ══════════════════════════════════════
  //  HELPERS VISUALES — v3: panels independientes con breathing
  // ══════════════════════════════════════

  // ── Keyframes específicos de los mini-panels ──
  (function(){
    if(document.getElementById('hud-mini-kf')) return;
    var s=document.createElement('style'); s.id='hud-mini-kf';
    s.textContent=[
      // Breathing con glow de color variable via --pc
      '@keyframes miniBreath{',
        '0%,100%{box-shadow:0 0 0 1px var(--pc-dim,rgba(140,100,220,0.15)),0 8px 32px rgba(0,0,0,0.7),0 0 20px var(--pc-glow,rgba(139,92,246,0.05))}',
        '50%{box-shadow:0 0 0 1px var(--pc-mid,rgba(140,100,220,0.40)),0 8px 40px rgba(0,0,0,0.85),0 0 50px var(--pc-glow,rgba(139,92,246,0.18))}',
      '}',
      // Scan line que recorre el perímetro (top→right→bottom→left)
      '@keyframes perimScan{',
        '0%  {clip-path:inset(0 100% 98% 0)}',     // top izq→der
        '25% {clip-path:inset(0 0 98% 0)}',          // top completo
        '26% {clip-path:inset(0 0 0 98%)}',          // right arriba
        '50% {clip-path:inset(0 0 0 0%)}',            // right completo
        '51% {clip-path:inset(98% 0 0 0)}',           // bottom der→izq
        '75% {clip-path:inset(98% 100% 0 0)}',       // bottom completo
        '76% {clip-path:inset(0 100% 0 0)}',          // left abajo
        '99% {clip-path:inset(0 100% 0 100%)}',      // left completo
        '100%{clip-path:inset(0 100% 98% 0)}',       // reinicio
      '}',
      // Pulso de la línea top de color
      '@keyframes topPulse{0%,100%{opacity:.5;filter:blur(0)}50%{opacity:1;filter:blur(1px)}}',
      // Valor entra
      '@keyframes hudValIn{0%{opacity:0;transform:translateY(3px)}100%{opacity:1;transform:none}}',
      '@keyframes hudDotPulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.5);opacity:1}}',
    ].join('');
    document.head.appendChild(s);
  })();

  // ── Crear un panel flotante independiente ──
  function _mkFloatPanel(id, accentColor, glowColor){
    var p = document.createElement('div');
    p.id  = id;
    p.style.cssText = [
      'position:fixed','z-index:9001',
      'background:rgba(10,7,22,0.88)',
      'border:1px solid rgba(140,100,220,0.22)',
      'backdrop-filter:blur(22px) saturate(170%)',
      '-webkit-backdrop-filter:blur(22px) saturate(170%)',
      'border-radius:14px',
      'opacity:0','visibility:hidden',
      'transition:opacity 500ms ease-out',
      'overflow:hidden',
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif',
      'animation:miniBreath 4s ease-in-out infinite',
      // Circuit pattern
      'background-image:linear-gradient(rgba(120,80,200,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.018) 1px,transparent 1px)',
      'background-size:28px 28px',
    ].join(';');
    // CSS vars para el breathing de color
    p.style.setProperty('--pc-dim',  accentColor.replace(')',',0.18)').replace('rgb','rgba'));
    p.style.setProperty('--pc-mid',  accentColor.replace(')',',0.45)').replace('rgb','rgba'));
    p.style.setProperty('--pc-glow', glowColor);
    p._accent = accentColor;

    // Línea top neón animada
    var top = document.createElement('div');
    top.style.cssText = 'position:absolute;top:0;left:0;right:0;height:2px;'+
      'background:'+accentColor+';'+
      'box-shadow:0 0 10px '+accentColor+',0 0 20px '+glowColor+';'+
      'animation:topPulse 3s ease-in-out infinite;z-index:2';
    p.appendChild(top);

    // Scan perimetral — un div con borde completo que se recorta animado
    var scan = document.createElement('div');
    scan.style.cssText = 'position:absolute;inset:0;border-radius:14px;pointer-events:none;z-index:3;'+
      'border:1.5px solid '+accentColor.replace(')',',0.6)').replace('rgb','rgba')+';'+
      'box-shadow:inset 0 0 8px '+glowColor+';'+
      'animation:perimScan 5s linear infinite';
    p.appendChild(scan);

    // Contenedor de contenido (para no interferir con el scan)
    var inner = document.createElement('div');
    inner.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column';
    inner.id = id+'-inner';
    p.appendChild(inner);

    return p;
  }

  // ── Header del panel ──
  function _pH(label, color, icon){
    return '<div style="display:flex;align-items:center;gap:10px;padding:13px 16px 11px">'+
      '<div style="width:30px;height:30px;border-radius:8px;background:'+color+'18;border:1px solid '+color+'45;'+
        'display:flex;align-items:center;justify-content:center;flex-shrink:0;'+
        'box-shadow:0 0 12px '+color+'30;filter:drop-shadow(0 0 4px '+color+')">'+
        '<i class="fas '+icon+'" style="font-size:12px;color:'+color+'"></i>'+
      '</div>'+
      '<span style="font-size:13px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;'+
        'color:'+color+';text-shadow:0 0 12px '+color+'88">'+label+'</span>'+
    '</div>'+
    '<div style="height:1px;background:linear-gradient(90deg,'+color+'50,rgba(140,100,220,0.08),transparent)"></div>';
  }

  // ── Hero valor grande ──
  function _hero(id, color, sublabel){
    return '<div style="padding:12px 16px 8px">'+
      '<div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;'+
        'color:rgba(200,208,230,0.30);margin-bottom:6px">'+sublabel+'</div>'+
      '<div id="'+id+'" style="font-size:34px;font-weight:800;color:'+color+';letter-spacing:-.03em;line-height:1;'+
        'text-shadow:0 0 24px '+color+'55,0 0 48px '+color+'22;animation:hudValIn .5s ease-out">—</div>'+
    '</div>';
  }

  // ── Fila stat 13px label / 14px valor ──
  function _row(label, id, color, barId, emoji){
    return '<div style="display:flex;align-items:center;gap:10px;padding:9px 16px;'+
      'border-top:1px solid rgba(255,255,255,0.05)">'+
      '<div style="display:flex;align-items:center;gap:7px;flex:1;min-width:0">'+
        (emoji
          ? '<span style="font-size:14px;flex-shrink:0">'+emoji+'</span>'
          : '<div style="width:8px;height:8px;border-radius:50%;background:'+color+';box-shadow:0 0 6px '+color+';flex-shrink:0;animation:hudDotPulse 2.5s ease-in-out infinite"></div>')+
        '<span style="font-size:13px;font-weight:600;color:rgba(210,210,235,0.65);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+label+'</span>'+
      '</div>'+
      (barId
        ? '<div style="width:48px;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden;flex-shrink:0">'+
            '<div id="'+barId+'" style="height:100%;width:0%;background:'+color+';box-shadow:0 0 4px '+color+'80;border-radius:2px;transition:width .8s ease"></div>'+
          '</div>' : '')+
      '<span id="'+id+'" style="font-size:14px;font-weight:700;color:'+color+';font-variant-numeric:tabular-nums;'+
        'flex-shrink:0;text-shadow:0 0 8px '+color+'55;min-width:72px;text-align:right">—</span>'+
    '</div>';
  }

  // ── Duo: 2 valores en cajas ──
  function _duo(id1,lbl1,c1, id2,lbl2,c2){
    return '<div style="display:flex;gap:8px;padding:10px 16px 12px">'+
      '<div style="flex:1;background:'+c1+'12;border:1px solid '+c1+'30;border-radius:10px;padding:12px;position:relative;overflow:hidden">'+
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:'+c1+';opacity:.6;box-shadow:0 0 8px '+c1+'"></div>'+
        '<div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:'+c1+'90;margin-bottom:7px">'+lbl1+'</div>'+
        '<div id="'+id1+'" style="font-size:22px;font-weight:800;color:'+c1+';text-shadow:0 0 14px '+c1+'55;line-height:1">—</div>'+
      '</div>'+
      '<div style="flex:1;background:'+c2+'12;border:1px solid '+c2+'30;border-radius:10px;padding:12px;position:relative;overflow:hidden">'+
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:'+c2+';opacity:.6;box-shadow:0 0 8px '+c2+'"></div>'+
        '<div style="font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:'+c2+'90;margin-bottom:7px">'+lbl2+'</div>'+
        '<div id="'+id2+'" style="font-size:22px;font-weight:800;color:'+c2+';text-shadow:0 0 14px '+c2+'55;line-height:1">—</div>'+
      '</div>'+
    '</div>';
  }

  // ── Maslow bar ──
  function _maslow(label, id, barId, color){
    return '<div style="padding:9px 16px;border-top:1px solid rgba(255,255,255,0.04)">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">'+
        '<div style="width:8px;height:8px;border-radius:50%;background:'+color+';box-shadow:0 0 7px '+color+';flex-shrink:0;animation:hudDotPulse 2.5s ease-in-out infinite"></div>'+
        '<span style="font-size:13px;font-weight:600;color:rgba(210,210,235,0.70);flex:1">'+label+'</span>'+
        '<span id="'+id+'" style="font-size:13px;font-weight:700;color:'+color+';font-variant-numeric:tabular-nums;text-shadow:0 0 6px '+color+'66">—</span>'+
      '</div>'+
      '<div style="height:4px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden;margin-left:16px">'+
        '<div id="'+barId+'" style="height:100%;width:0%;background:'+color+';box-shadow:0 0 6px '+color+'80;border-radius:2px;transition:width .9s ease"></div>'+
      '</div>'+
    '</div>';
  }

  // ── Nav button ──
  function _nav(label, icon, color, fn){
    var b = document.createElement('div');
    b.style.cssText = 'display:flex;align-items:center;gap:12px;padding:11px 16px;cursor:pointer;'+
      'transition:background .15s;border-top:1px solid rgba(255,255,255,0.05)';
    b.innerHTML =
      '<div style="width:30px;height:30px;border-radius:8px;background:'+color+'15;border:1px solid '+color+'35;'+
        'display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 8px '+color+'20">'+
        '<i class="fas '+icon+'" style="font-size:11px;color:'+color+';filter:drop-shadow(0 0 4px '+color+')"></i>'+
      '</div>'+
      '<span style="font-size:13px;font-weight:600;color:rgba(220,220,240,0.75);flex:1">'+label+'</span>'+
      '<i class="fas fa-chevron-right" style="font-size:10px;color:'+color+'60"></i>';
    b.addEventListener('mouseenter',function(){ b.style.background=color+'14'; b.querySelector('span').style.color='#fff'; });
    b.addEventListener('mouseleave',function(){ b.style.background='transparent'; b.querySelector('span').style.color='rgba(220,220,240,0.75)'; });
    b.addEventListener('click',function(e){ e.stopPropagation(); cerrarDial(); if(typeof window[fn]==='function') window[fn](); });
    return b;
  }

  // ══════════════════════════════════════
  //  6 PANELS FLOTANTES INDEPENDIENTES
  //  Izq: Patrimonio / Necesidades / Bitácora
  //  Der: Financiero / Activity+Logros / Navegación
  // ══════════════════════════════════════

  // ── Panel 1: Patrimonio ──
  var _p1 = _mkFloatPanel('hud-patrimonio','#22C55E','rgba(34,197,94,0.15)');
  document.getElementById('hud-patrimonio-inner').innerHTML =
    _pH('Patrimonio','#22C55E','fa-landmark') +
    _hero('_hud-saldo','#22C55E','Disponible hoy') +
    '<div style="padding:0 16px 10px">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:5px">'+
        '<span style="font-size:11px;color:rgba(200,208,230,0.30);text-transform:uppercase;letter-spacing:.10em">Fondo emergencia</span>'+
        '<span id="_hud-fondo-pct" style="font-size:12px;font-weight:700;color:#22C55E">—</span>'+
      '</div>'+
      '<div style="height:5px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden">'+
        '<div id="_hud-fondo-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#22C55E,#4ADE80);box-shadow:0 0 8px rgba(34,197,94,.5);border-radius:3px;transition:width .8s ease"></div>'+
      '</div>'+
    '</div>'+
    _row('BBVA',     '_hud-bbva',  '#4ADE80','_hud-bbva-bar','🏦') +
    _row('BEATS',    '_hud-beats', '#86EFAC','_hud-beats-bar','💳') +
    _row('Efectivo', '_hud-efec',  '#FCD34D',null,'💵') +
    _row('Apartados','_hud-apart', '#F59E0B',null,'🔒') +
    '<div style="height:4px"></div>';

  // ── Panel 2: Necesidades ──
  var _p2 = _mkFloatPanel('hud-necesidades','#A855F7','rgba(168,85,247,0.15)');
  document.getElementById('hud-necesidades-inner').innerHTML =
    _pH('Necesidades','#A855F7','fa-layer-group') +
    _maslow('Fisiológicas',   '_hud-nec-1','_hud-nec-1-bar','#EF4444') +
    _maslow('Seguridad',      '_hud-nec-2','_hud-nec-2-bar','#F59E0B') +
    _maslow('Afiliación',     '_hud-nec-3','_hud-nec-3-bar','#22D3EE') +
    _maslow('Reconocimiento', '_hud-nec-4','_hud-nec-4-bar','#A855F7') +
    _maslow('Autorrealización','_hud-nec-5','_hud-nec-5-bar','#22C55E') +
    '<div style="height:4px"></div>';

  // ── Panel 3: Bitácora ──
  var _p3 = _mkFloatPanel('hud-bitacora','#C084FC','rgba(192,132,252,0.15)');
  document.getElementById('hud-bitacora-inner').innerHTML =
    _pH('Bitácora','#C084FC','fa-book-open') +
    _row('Pensamientos','_hud-pens','#C084FC',null,'💭') +
    _row('Relaciones',  '_hud-rels','#EC4899',null,'👥') +
    _row('Salud',       '_hud-sal', '#EF4444',null,'❤️') +
    _row('Entrenamiento','_hud-ent','#FB923C',null,'💪') +
    '<div style="height:4px"></div>';
  _p3.appendChild(_nav('Abrir Bitácora','fa-book-open','#C084FC','irABitacora'));

  // ── Panel 4: Financiero ──
  var _p4 = _mkFloatPanel('hud-financiero','#22D3EE','rgba(34,211,238,0.15)');
  document.getElementById('hud-financiero-inner').innerHTML =
    _pH('Financiero','#22D3EE','fa-chart-line') +
    _hero('_hud-fin-exc','#22D3EE','Excedente del mes') +
    _duo('_hud-fin-ing','Ingresos','#22C55E','_hud-fin-egr','Egresos','#EF4444') +
    _row('Ahorro %',  '_hud-fin-aho','#FACC15','_hud-aho-bar',null) +
    _row('Runway',    '_hud-runway', '#22D3EE',null,'🛫') +
    _row('Gasto/día','_hud-gastoDia','#A78BFA',null,'📊') +
    '<div style="height:4px"></div>';

  // ── Panel 5: Activity + Logros ──
  var _p5 = _mkFloatPanel('hud-activity','#FB923C','rgba(251,146,60,0.15)');
  document.getElementById('hud-activity-inner').innerHTML =
    _pH('Activity + Logros','#FB923C','fa-bolt') +
    _duo('_hud-act-done','Hábitos hoy','#FB923C','_hud-lgr-done','Logros','#FACC15') +
    '<div style="padding:10px 16px 14px;border-top:1px solid rgba(255,255,255,0.05)">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:7px">'+
        '<div style="display:flex;align-items:center;gap:7px">'+
          '<i class="fas fa-fire" style="font-size:15px;color:#FB923C;filter:drop-shadow(0 0 5px #FB923C)"></i>'+
          '<span style="font-size:13px;font-weight:600;color:rgba(210,210,235,0.55);text-transform:uppercase;letter-spacing:.10em">Racha</span>'+
        '</div>'+
        '<span id="_hud-racha" style="font-size:20px;font-weight:800;color:#FB923C;text-shadow:0 0 10px rgba(251,146,60,.6)">—</span>'+
      '</div>'+
      '<div style="height:5px;background:rgba(255,255,255,0.05);border-radius:3px;overflow:hidden">'+
        '<div id="_hud-racha-bar" style="height:100%;width:25%;background:linear-gradient(90deg,#FB923C,#FCD34D);box-shadow:0 0 8px rgba(251,146,60,.5);border-radius:3px"></div>'+
      '</div>'+
    '</div>';
  _p5.appendChild(_nav('Activity','fa-bolt','#FB923C','irAActivity'));
  _p5.appendChild(_nav('Logros','fa-trophy','#FACC15','irALogros'));

  // ── Panel 6: Navegación ──
  var _p6 = _mkFloatPanel('hud-nav','#A78BFA','rgba(167,139,250,0.12)');
  document.getElementById('hud-nav-inner').innerHTML =
    _pH('Navegación','#A78BFA','fa-compass');
  [
    {label:'Nutrición',    icon:'fa-leaf',         fn:'irANutricion', color:'#4ADE80'},
    {label:'Bitácora',     icon:'fa-book-open',    fn:'irABitacora',  color:'#C084FC'},
    {label:'RAW Sheet',    icon:'fa-table',         fn:'irASheets',    color:'#A5B4FC'},
    {label:'Actualizar',   icon:'fa-rotate-right', fn:'refreshTodo',  color:'#64748B'},
  ].forEach(function(n){ _p6.appendChild(_nav(n.label,n.icon,n.color,n.fn)); });

  // ── Registrar los 6 panels con su lado y orden vertical ──
  // side: 'left'|'right', order: 0=top 1=mid 2=bot
  _p1._side='left';  _p1._order=0;
  _p2._side='left';  _p2._order=1;
  _p3._side='left';  _p3._order=2;
  _p4._side='right'; _p4._order=0;
  _p5._side='right'; _p5._order=1;
  _p6._side='right'; _p6._order=2;

  var _hudPanels = [
    {el:_p1},{el:_p2},{el:_p3},
    {el:_p4},{el:_p5},{el:_p6},
  ];

  // ── Reposicionar: distribuir en columnas izq/der, sin solaparse ──
  function _reposicionarHUD(){
    if(!_dialCanvas||!window._hudPanels) return;
    var r   = _dialCanvas.getBoundingClientRect();
    var cx  = r.left + r.width/2;
    var vW  = window.innerWidth;
    var vH  = window.innerHeight;
    var GAP = 14;
    var leftX  = GAP;
    var leftW  = Math.max(220, r.left - GAP*2);
    var rightX = r.right + GAP;
    var rightW = Math.max(220, vW - r.right - GAP*2);

    // Recoger alturas reales de cada panel para distribuirlos sin solaparse
    var leftPanels  = window._hudPanels.filter(function(hp){ return hp.el._side==='left';  });
    var rightPanels = window._hudPanels.filter(function(hp){ return hp.el._side==='right'; });

    function positionCol(panels, x, w){
      var totalH  = panels.reduce(function(s,hp){ return s + hp.el.offsetHeight + GAP; },0) - GAP;
      var startY  = Math.max(GAP, (vH - totalH)/2);
      var curY    = startY;
      panels.sort(function(a,b){ return a.el._order - b.el._order; });
      panels.forEach(function(hp){
        hp.el.style.left  = x + 'px';
        hp.el.style.width = w + 'px';
        hp.el.style.top   = curY + 'px';
        // chamfer según lado
        hp.el.style.clipPath = x < vW/2
          ? 'polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))'
          : 'polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)';
        curY += hp.el.offsetHeight + GAP;
      });
    }

    positionCol(leftPanels,  leftX,  leftW);
    positionCol(rightPanels, rightX, rightW);
  }
  window._reposicionarHUD = _reposicionarHUD;

  _dialOverlay.appendChild(_dialCanvas);
  document.body.appendChild(_dialOverlay);
  _hudPanels.forEach(function(hp){ document.body.appendChild(hp.el); });

    window._hudPanels = _hudPanels;
  var _navPanel = _pRight;

  // ── Actualizar paneles con datos reales ──
  window._refrescarEspejos = function(datos){
    function fmt(v){
      if(v===null||v===undefined||v==='') return '—';
      var n=Number(v); if(isNaN(n)) return String(v);
      return '$ '+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:0});
    }
    function fmt2(v){ if(v===null||v===undefined||v==='') return '—'; var n=Number(v); if(isNaN(n)) return '—'; return '$ '+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); }
    function set(id,v){ var e=document.getElementById(id); if(e&&v!==undefined&&v!==null) e.textContent=v; }
    function setW(id,pct){ var e=document.getElementById(id); if(e){ e.style.width=Math.min(100,Math.max(0,parseFloat(pct)||0))+'%'; } }

    var d = datos || window._hudDatos || {};

    // Patrimonio
    var sv = document.getElementById('saldo-val');
    if(sv && sv.textContent && sv.textContent.trim()!=='...') set('_hud-saldo', sv.textContent.trim());

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

    // Financiero
    var finD = window._finData;
    if(finD && finD.mes){
      set('_hud-fin-exc', fmt(finD.mes.excedente));
      set('_hud-fin-ing', fmt(finD.mes.ingresos));
      set('_hud-fin-egr', fmt(finD.mes.egresos));
      var aho = finD.metricas && finD.metricas.porcentajeAhorro;
      set('_hud-fin-aho', aho!=null ? Math.round(aho)+'%' : '—');
      setW('_hud-aho-bar', Math.min(100,Math.max(0,aho||0)));
      var run = finD.metricas && finD.metricas.runwayDias;
      set('_hud-runway', run!=null ? run+' dias' : '—');
      var gd = finD.metricas && finD.metricas.gastoPorDiaPromedio;
      set('_hud-gastoDia', gd ? fmt(gd) : '—');
    }

    // Necesidades
    var nec = d.necesidades || {};
    var niveles = nec.niveles || [];
    var totalNec = niveles.reduce(function(s,n){ return s+Math.abs(n.total||0); },0);
    [1,2,3,4,5].forEach(function(n){
      var nv = niveles[n-1] || {total:0};
      var abs = Math.abs(nv.total||0);
      set('_hud-nec-'+n, abs>0 ? fmt(abs) : '—');
      setW('_hud-nec-'+n+'-bar', totalNec>0 ? abs/totalNec*100 : 0);
    });

    // Activity + Logros
    if(window._actData){
      var a = window._actData;
      var totH = (a.habitosPersonal||[]).length+(a.habitosElectronics||[]).length;
      var doneH = (a.habitosPersonal||[]).filter(function(h){ return h.checks&&Object.values(h.checks).some(Boolean); }).length +
                  (a.habitosElectronics||[]).filter(function(h){ return h.checks&&Object.values(h.checks).some(Boolean); }).length;
      set('_hud-act-done', doneH+'/'+totH);
    }
    if(window._logrosData){
      var items = window._logrosData.items||[];
      var doneL = items.filter(function(l){ return l.completado==='Si'||l.completado==='Si'||l.completado===true; }).length;
      set('_hud-lgr-done', doneL+'/'+items.length);
    }

    // Bitacora
    if(window._pensamientosData && window._pensamientosData.items)
      set('_hud-pens', window._pensamientosData.items.length+' pensamientos');
    if(window._relacionesData && window._relacionesData.items)
      set('_hud-rels', window._relacionesData.items.length+' personas');
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
    // ── Click en subanillo ──
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
    // ── Click en anillo principal ──
    var h=_dialHitTest(mx,my,false);
    if(h>=0){
      var item=_DIAL_ITEMS[h];
      // Editar — acción especial: overlay HTML con input de ID
      if(item.accionEspecial){
        _abrirEditarOverlay();
        return;
      }
      // Bancos — subs dinámicos desde _fijosData
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

// Dibuja un sector con borde iluminado en el arco exterior (efecto 3D de referencia)
function _dialDrawSector(ctx,startA,endA,rOut,rIn,fill,accent,isActive){
  var dc=_DC;
  // Centroide del sector para el gradiente
  var midA = (startA+endA)/2;
  var rMid = rIn + (rOut-rIn)*0.65;
  var gx   = dc.CX + rMid*Math.cos(midA);
  var gy   = dc.CY + rMid*Math.sin(midA);

  // Fondo del sector — gradiente radial con tinte del accent
  ctx.beginPath();
  ctx.moveTo(dc.CX+rIn*Math.cos(startA),dc.CY+rIn*Math.sin(startA));
  ctx.arc(dc.CX,dc.CY,rOut,startA,endA);
  ctx.lineTo(dc.CX+rIn*Math.cos(endA),dc.CY+rIn*Math.sin(endA));
  ctx.arc(dc.CX,dc.CY,rIn,endA,startA,true);
  ctx.closePath();

  // Gradiente: centro del sector con tinte de color, bordes oscuros
  var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, (rOut-rIn)*1.1);
  // Parsear accent para extraer RGB — fallback a violeta
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

  // Borde lateral separador
  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1; ctx.stroke();

  // Borde exterior iluminado
  var glowA = isActive ? accent : ('rgba('+ar+','+ag+','+ab+',0.35)');
  var glowW = isActive ? 3.5 : 1.5;
  ctx.save();
  ctx.shadowColor = isActive ? accent : ('rgba('+ar+','+ag+','+ab+',0.5)');
  ctx.shadowBlur  = isActive ? 28 : 12;
  ctx.beginPath();
  ctx.arc(dc.CX,dc.CY,rOut,startA+0.01,endA-0.01);
  ctx.strokeStyle=glowA; ctx.lineWidth=glowW; ctx.stroke();
  ctx.restore();

  // Segundo pass glow en activo/hover
  if(isActive){
    ctx.save();
    ctx.globalAlpha=0.5;
    ctx.shadowColor=accent; ctx.shadowBlur=50;
    ctx.beginPath();
    ctx.arc(dc.CX,dc.CY,rOut,startA+0.01,endA-0.01);
    ctx.strokeStyle=accent; ctx.lineWidth=2; ctx.stroke();
    ctx.restore();
  }

  // Borde interior biselado con tinte
  ctx.beginPath();
  ctx.arc(dc.CX,dc.CY,rIn+1,startA+0.01,endA-0.01);
  ctx.strokeStyle='rgba('+ar+','+ag+','+ab+',0.15)'; ctx.lineWidth=1; ctx.stroke();
}

// ── Dibuja el centro RAW con hover y animación de pulso ──
function _dialDrawCentro(ctx, dc, isHov, pulseT){
  var pulse  = isHov ? (Math.sin(pulseT * 0.08) * 0.5 + 0.5) : 0;
  var glowAmt = isHov ? (30 + pulse * 25) : 14;
  var scaleR  = isHov ? (dc.R_IN + pulse * 6) : dc.R_IN;

  // Halo exterior animado — aparece solo en hover
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
    // Segundo halo más externo, más tenue
    ctx.save();
    ctx.beginPath();
    ctx.arc(dc.CX, dc.CY, scaleR + 14, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(140,120,255,' + (0.12 + pulse*0.15) + ')';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();
  }

  // Fondo gradiente radial
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

  // Borde principal con glow
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

  // Anillo interior secundario
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, scaleR - 11, 0, Math.PI*2);
  ctx.strokeStyle = isHov
    ? 'rgba(160,140,255,' + (0.18 + pulse*0.12) + ')'
    : 'rgba(100,90,200,0.20)';
  ctx.lineWidth = 1; ctx.stroke();

  // ⇄ icono
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

  // RAW label
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

// Animar entrada del subanillo con ease-out
function _animarSubRing(targetSub){
  if(_subRingRAF){ cancelAnimationFrame(_subRingRAF); _subRingRAF=null; }
  // Si es el mismo sector, toggle off con fade rápido
  if(targetSub === _subRingPrevSub){
    _dialActiveSub = -1;
    _subRingPrevSub = -1;
    _subRingProg = 0;
    _dialDraw();
    return;
  }
  // Nuevo sector — resetear y animar entrada
  _dialActiveSub  = targetSub;
  _subRingPrevSub = targetSub;
  _subRingProg    = 0;
  var startTime   = null;
  var DURATION    = 320; // ms
  function step(ts){
    if(!startTime) startTime = ts;
    var elapsed = ts - startTime;
    // ease-out cubic
    var t = Math.min(1, elapsed / DURATION);
    _subRingProg = 1 - Math.pow(1 - t, 3);
    _dialDraw();
    if(t < 1) _subRingRAF = requestAnimationFrame(step);
    else { _subRingRAF = null; _subRingProg = 1; }
  }
  _subRingRAF = requestAnimationFrame(step);
}

function _iniciarPulsoCentro(){
  if(_dialRAF) return;  // ya corriendo
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

  // ── Breathing del dial — glow exterior vivo ──
  var bt = typeof _dialBreathT !== 'undefined' ? _dialBreathT : 0;
  var breathSin  = (Math.sin(bt * 0.025) * 0.5 + 0.5); // 0→1 lento
  var breathSin2 = (Math.sin(bt * 0.018 + 1.2) * 0.5 + 0.5); // desfasado

  // Halo 1 — anillo violeta breathing, alejado del dial
  var HALO_OFF = 18; // offset desde R_OUT
  ctx.save();
  ctx.shadowColor = 'rgba(139,92,246,' + (0.5 + breathSin * 0.5) + ')';
  ctx.shadowBlur  = 60 + breathSin * 40;
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, dc.R_OUT + HALO_OFF, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(167,139,250,' + (0.25 + breathSin * 0.30) + ')';
  ctx.lineWidth   = 2 + breathSin * 2;
  ctx.stroke();
  ctx.restore();

  // Halo 2 — anillo más grande y tenue, desfasado
  ctx.save();
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, dc.R_OUT + HALO_OFF + 16 + breathSin2 * 6, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(120,80,220,' + (0.06 + breathSin2 * 0.10) + ')';
  ctx.lineWidth   = 8;
  ctx.stroke();
  ctx.restore();

  // Arco de acento — rota lentamente, brillante
  ctx.save();
  var arcAngle = bt * 0.003;
  var arcLen   = Math.PI * 0.65;

  // Arco principal cyan — brillante y cercano al dial
  ctx.shadowColor = 'rgba(34,211,238,' + (0.7 + breathSin * 0.3) + ')';
  ctx.shadowBlur  = 20 + breathSin * 30;
  ctx.beginPath();
  var ARC_R = dc.R_OUT + 18; // mismo offset que el halo
  ctx.arc(dc.CX, dc.CY, ARC_R, arcAngle, arcAngle + arcLen);
  ctx.strokeStyle = 'rgba(34,211,238,' + (0.55 + breathSin * 0.40) + ')';
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.stroke();

  // Glow exterior del arco
  ctx.shadowColor = 'rgba(34,211,238,0.5)';
  ctx.shadowBlur  = 40 + breathSin * 20;
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, ARC_R, arcAngle, arcAngle + arcLen);
  ctx.strokeStyle = 'rgba(34,211,238,' + (0.12 + breathSin * 0.18) + ')';
  ctx.lineWidth   = 10;
  ctx.stroke();

  // Arco opuesto violeta
  ctx.shadowColor = 'rgba(167,139,250,' + (0.6 + breathSin2 * 0.3) + ')';
  ctx.shadowBlur  = 18 + breathSin2 * 24;
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, ARC_R, arcAngle+Math.PI, arcAngle+Math.PI+arcLen*0.4);
  ctx.strokeStyle = 'rgba(167,139,250,' + (0.45 + breathSin2 * 0.40) + ')';
  ctx.lineWidth   = 2;
  ctx.stroke();

  // Dots en inicio/fin del arco
  var dotR = ARC_R;
  [arcAngle, arcAngle+arcLen].forEach(function(a){
    ctx.beginPath();
    ctx.arc(dc.CX+dotR*Math.cos(a), dc.CY+dotR*Math.sin(a), 3, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(34,211,238,' + (0.7+breathSin*0.3) + ')';
    ctx.shadowColor = '#22D3EE'; ctx.shadowBlur = 12;
    ctx.fill();
  });
  ctx.restore();

  // ── Anillo principal ──
  for(var i=0;i<N;i++){
    var item   = _DIAL_ITEMS[i];
    var startA = -Math.PI/2 + i*slice + dc.GAP/2;
    var endA   = -Math.PI/2 + (i+1)*slice - dc.GAP/2;
    var midA   = (startA+endA)/2;
    var isHov  = (i===_dialHovered);
    var isAct  = (i===_dialActiveSub);

    // Sector activo/hover se eleva ligeramente (radio mayor)
    var rOut = (isHov||isAct) ? dc.R_OUT+14 : dc.R_OUT;
    var rIn  = dc.R_IN;

    var fill = isAct ? _DIAL_ACT : isHov ? _DIAL_HOVER : _DIAL_BASE;

    _dialDrawSector(ctx,startA,endA,rOut,rIn,fill,item.accent,(isHov||isAct));

    // Centroide — ligeramente más afuera del centro para aprovechar espacio
    var rMid = rIn + (rOut-rIn)*0.54;
    var cx   = dc.CX + rMid*Math.cos(midA);
    var cy   = dc.CY + rMid*Math.sin(midA);

    // Ícono — grande, con glow de color en hover
    var icoS = isHov||isAct ? 52 : 44;
    ctx.save();
    ctx.shadowColor = item.accent;
    ctx.shadowBlur  = isHov||isAct ? 28 : 12;
    item.draw(ctx,cx,cy-8,icoS,item.accent);
    ctx.restore();
    // Segundo pass de glow más intenso en hover/activo
    if(isHov||isAct){
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.shadowColor = item.accent;
      ctx.shadowBlur  = 40;
      item.draw(ctx,cx,cy-8,icoS,item.accent);
      ctx.restore();
    }

    // Label — uppercase, bold, blanco, fuente mediana
    ctx.save();
    ctx.font         = 'bold '+(isHov||isAct?13:11)+'px -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif';
    ctx.fillStyle    = '#ffffff';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor  = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur   = 6;
    ctx.fillText(item.label.toUpperCase(), cx, cy+16);
    ctx.restore();

    // Indicador de sub — línea de acento en arco exterior del sector
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

  // ── Subanillo ──
  if(_dialActiveSub>=0){
    var parent=_DIAL_ITEMS[_dialActiveSub];
    var _subsArr=parent._subsResueltos||parent.subs||[];
    var nSub=_subsArr.length;
    var prog = typeof _subRingProg !== 'undefined' ? _subRingProg : 1;
    if(nSub>0){
      var pmidA  = Math.PI*2*(_dialActiveSub+0.5)/N - Math.PI/2;
      // El spread se expande con el progreso (sale del sector padre)
      var spreadFull = Math.PI*0.48;
      var spread     = spreadFull * prog;
      var subSlice   = spread/nSub;
      var subGap     = 0.020 * prog;
      var subStart   = pmidA - spread/2;
      // El radio exterior crece con el progreso
      var rSIAnim = dc.R_SI;
      var rSOFull = dc.R_SO;
      var rSOAnim = dc.R_SI + (rSOFull - dc.R_SI) * prog;

      ctx.save();
      ctx.globalAlpha = prog; // fade-in global del subanillo
      for(var j=0;j<nSub;j++){
        var sub    = _subsArr[j];
        var sA     = subStart + j*subSlice + subGap/2;
        var eA     = subStart + (j+1)*subSlice - subGap/2;
        var smA    = (sA+eA)/2;
        var isShov = (j===_dialSubHov);
        var rso    = isShov ? rSOAnim+10*prog : rSOAnim;

        // Subanillo: solo glow/borde — sin fondo sólido
        // Trazar el path del sector
        ctx.beginPath();
        ctx.moveTo(dc.CX+rSIAnim*Math.cos(sA), dc.CY+rSIAnim*Math.sin(sA));
        ctx.arc(dc.CX, dc.CY, rso, sA, eA);
        ctx.lineTo(dc.CX+rSIAnim*Math.cos(eA), dc.CY+rSIAnim*Math.sin(eA));
        ctx.arc(dc.CX, dc.CY, rSIAnim, eA, sA, true);
        ctx.closePath();

        // Fondo muy sutil — casi transparente con tinte del color
        var ar2=139,ag2=92,ab2=246;
        var m2=sub.accent&&sub.accent.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        if(m2){ ar2=parseInt(m2[1],16); ag2=parseInt(m2[2],16); ab2=parseInt(m2[3],16); }
        ctx.fillStyle = isShov
          ? 'rgba('+ar2+','+ag2+','+ab2+',0.12)'
          : 'rgba('+ar2+','+ag2+','+ab2+',0.04)';
        ctx.fill();

        // Borde exterior neón
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

        // Borde interior tenue
        ctx.beginPath();
        ctx.arc(dc.CX, dc.CY, rSIAnim+1, sA+0.02, eA-0.02);
        ctx.strokeStyle = 'rgba('+ar2+','+ag2+','+ab2+',0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Ícono y label — solo visibles cuando prog > 0.4
        if(prog > 0.35){
          var iconProg = Math.min(1,(prog-0.35)/0.65); // 0→1 en la segunda mitad
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

  // ── Centro — con hover y pulso ──
  _dialDrawCentro(ctx, dc, _dialCentroHov, _dialPulseT);
}

// ── Overlay HTML para Editar — input de ID antes del form ──
function _abrirEditarOverlay(){
  // Si ya existe, reusar
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
    // HUD panel del design system: fondo oscuro violeta con chamfer
    'background:rgba(15,12,28,0.97)',
    'border:1px solid rgba(140,100,220,0.3)',
    'clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)',
    'box-shadow:0 0 0 1px rgba(120,80,200,0.12),0 0 40px rgba(168,85,247,0.12),0 8px 48px rgba(0,0,0,0.7)',
    'padding:28px 28px 24px',
    'width:360px','max-width:92vw',
    'display:flex','flex-direction:column','gap:16px',
    // Patrón grid interno sutil
    'background-image:linear-gradient(rgba(120,80,200,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.03) 1px,transparent 1px)',
    'background-size:32px 32px',
  ].join(';');

  box.innerHTML =
    // Header con estilo HUD del design system
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

  // Cerrar al click fuera del box
  ov.addEventListener('click', function(e){ if(e.target===ov) ov.style.display='none'; });

  // Focus + enter
  setTimeout(function(){
    var inp = document.getElementById('editar-id-input-dial');
    if(inp){
      inp.focus();
      inp.addEventListener('keydown', function(e){
        if(e.key==='Enter') _confirmarEditarId();
        if(e.key==='Escape') ov.style.display='none';
      });
      // Estilo focus
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
  // Ocultar overlay y abrir form de editar con ID pre-cargado
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
  // Iniciar breathing continuo del dial
  if(!_dialBreathRAF){
    (function _breathLoop(){
      _dialBreathT++;
      _dialDraw();
      _dialBreathRAF = requestAnimationFrame(_breathLoop);
    })();
  }

  // Mostrar overlay con fondo blur siempre
  _dialOverlay.style.opacity = '0';
  _dialOverlay.style.display = 'flex';
  _dialOverlay.style.pointerEvents = 'auto';
  _dialVisible = true;
  requestAnimationFrame(function(){
    _dialOverlay.style.transition = 'opacity 320ms cubic-bezier(.16,1,.3,1)';
    _dialOverlay.style.opacity = '1';
  });
  // Posicionar y actualizar paneles HUD al abrir
  if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
  if(typeof window._refrescarEspejos==='function') setTimeout(function(){ window._refrescarEspejos(); }, 50);
  if(window._hudPanels && window.innerWidth>=900){
    window._hudPanels.forEach(function(hp, i){
      hp.el.style.opacity='0'; hp.el.style.visibility='hidden';
      setTimeout(function(){
        hp.el.style.visibility='visible';
        requestAnimationFrame(function(){ hp.el.style.opacity='1'; });
      }, i * 80);
    });
  }
  var btn=document.getElementById('btn-nueva-entrada');
  if(btn) btn.classList.add('active');
}

function cerrarDial(){
  if(!_dialOverlay){ _dialVisible=false; return; }
  // Fade-out: 220ms luego ocultar
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
      // Fondo del design system del dial: azul-violeta casi negro con viñeta
      'background:radial-gradient(ellipse at center,rgba(80,40,140,0.18) 0%,rgba(4,4,14,0.72) 60%,rgba(0,0,8,0.82) 100%)',
      'backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
      '-webkit-backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
      // Patrón grid sutil en el overlay
      'background-image:radial-gradient(ellipse at center,rgba(80,40,140,0.18) 0%,rgba(4,4,14,0.72) 100%),linear-gradient(rgba(120,80,200,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.03) 1px,transparent 1px)',
      'background-size:auto,48px 48px,48px 48px',
    ].join(';');
    dd.classList.add('show');
    // Cerrar al click fuera del formulario — solo registrar una vez
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
  // ── Aplicar preset del dial con requestIdleCallback ──
  if(_dialPreset && Object.keys(_dialPreset).length){
    var presetSnap = JSON.parse(JSON.stringify(_dialPreset));
    setTimeout(function(){ _aplicarDialPreset(presetSnap); }, 120);
    _dialPreset = {};
  }
}

// Aplica el contexto pre-seleccionado desde el dial al formulario abierto
function _aplicarDialPreset(p){
  // Helper: click en opt button cuyo texto coincide con val
  function selectOpt(swId, val){
    var w=document.getElementById(swId); if(!w) return;
    w.querySelectorAll('.opt').forEach(function(b){
      if(b.textContent.trim()===val){ if(!b.classList.contains('on')) b.click(); }
    });
  }
  // Helper: setear valor en campo hidden o input
  function setVal(id, val){
    var el=document.getElementById('cv-'+id)||document.getElementById(id);
    if(!el) return;
    el.textContent=val; el.value=val;
    el.classList.remove('empty');
  }

  // ── Nutrición: momento del día ──
  if(p.momento){
    selectOpt('sw-momento', p.momento);
    setVal('momento', p.momento);
  }

  // ── Entrenamiento: tipo ──
  if(p.tipo && p.tab==='entrenamiento'){
    selectOpt('sw-tipo-entrena', p.tipo);
    setVal('tipo', p.tipo);
  }

  // ── Salud: tipo de registro ──
  if(p.tipo && p.tab==='salud'){
    selectOpt('sw-tipo-salud', p.tipo);
    setVal('tipo-salud', p.tipo);
  }

  // ── Patrimonio: tipo ──
  if(p.tipo && p.tab==='patrimonio'){
    selectOpt('sw-tipo-patrimonio', p.tipo);
    setVal('tipo-patrimonio', p.tipo);
  }

  // ── Pensamiento: categoría ──
  if(p.categoria){
    selectOpt('sw-cat-pensamiento', p.categoria);
    setVal('categoria', p.categoria);
  }

  // ── Persona: energía ──
  if(p.energia !== undefined){
    var eMap = {1:'Positiva', 0:'Neutral', '-1':'Negativa'};
    var eLabel = eMap[String(p.energia)] || eMap[p.energia];
    if(eLabel){ selectOpt('sw-energia-persona', eLabel); setVal('energia', eLabel); }
  }

  // ── Bancos: banco específico ──
  if(p.banco){
    selectOpt('sw-banco', p.banco);
    setVal('banco', p.banco);
    // Intentar abrir la fila del banco directamente
    var entes=document.querySelectorAll('.ente-nombre');
    entes.forEach(function(el){
      if(el.textContent.trim()===p.banco){
        var row=el.closest('.ente-row'); if(row) row.click();
      }
    });
  }

  // ── Editar: ID de fila — cargar directamente ──
  if(p.tab==='editar' && p.filaId){
    // Poner el ID en el input del form y disparar búsqueda
    setTimeout(function(){
      var inp=document.getElementById('editar-id-input');
      if(inp){ inp.value=p.filaId; if(typeof buscarFilaId==='function') buscarFilaId(); }
    }, 80);
  }

  // ── Activity: tab ──
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

  // ── LANDING: negro → dial → anverso ──
  // El splash negro (#splash-dial) cubre todo — el anverso carga detrás invisible.
  // El dial aparece sobre el splash. Al cerrar el dial, el splash desaparece.

  var _dialLandingUsed = false;

  // Montar el canvas del dial DENTRO del splash — así no hay overlay separado
  _crearDialOverlay();
  // El splash (z-index:8999) tapa el overlay mientras el dial hace fade-in
  // El overlay ya tiene su fondo blur real — no necesita ser transparente
  _dialOverlay.style.pointerEvents = 'none'; // empieza inerte

  // Canvas invisible ANTES de dibujar — así el browser nunca ve el frame visible
  _dialCanvas.style.opacity = '0';
  _dialCanvas.style.transition = 'opacity 2000ms ease-out';

  // Mostrar el overlay
  _dialOverlay.style.display = 'flex';
  _dialOverlay.style.opacity = '1';
  _dialVisible = true;
  _dialOverlay.style.pointerEvents = 'auto';

  // Arrancar breathing desde el landing — igual que abrirDial
  if(!_dialBreathRAF){
    (function _breathLoopLanding(){
      _dialBreathT++;
      _dialDraw();
      _dialBreathRAF = requestAnimationFrame(_breathLoopLanding);
    })();
  }


  // Negro visible primero, luego fade-in con setTimeout garantizado
  requestAnimationFrame(function(){
    var rb = document.getElementById('render-block');
    if(rb) rb.parentNode.removeChild(rb);
    // setTimeout 50ms garantiza que el browser pintó el negro y el canvas opacity:0
    // antes de activar la transición
    setTimeout(function(){
      // ── Posicionar paneles respecto al canvas real ──
      if(typeof _reposicionarHUD==='function') _reposicionarHUD();

      // ── Fade-in del canvas del dial ──
      _dialCanvas.style.opacity = '1';

      // ── Todos los HUD panels entran al azar después del dial ──
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

  // Registrar eventos del dial
  _dialOverlay.addEventListener('click', function(e){
    if(e.target === _dialOverlay) cerrarDial();
  });
  // Re-posicionar paneles en resize
  window.addEventListener('resize', function(){
    if(_dialVisible && typeof _reposicionarHUD==='function') _reposicionarHUD();
  });

  // Patch de cerrarDial: primera vez revela el anverso
  var _origCerrarDial = cerrarDial;
  cerrarDial = function(){
    if(!_dialLandingUsed){
      _dialLandingUsed = true;

      // Ocultar overlay y mostrar anverso inmediatamente
      _dialOverlay.style.display = 'none';
      _dialVisible = false;
      _dialActiveSub = -1; _dialCentroHov = false; _detenerPulsoCentro();
      var btn = document.getElementById('btn-nueva-entrada');
      if(btn) btn.classList.remove('active');

      // Limpiar canvas para aperturas futuras
      _dialCanvas.style.opacity = '';
      _dialCanvas.style.transition = '';

      // Mostrar anverso — quitar display:none y visibility
      var anv = document.getElementById('board-anverso');
      if(anv){
        anv.style.display = '';
        anv.style.visibility = '';
        anv.style.opacity = '1';
      }

      // Ocultar HUD panels — estaban visibles del landing
      if(window._hudPanels){ window._hudPanels.forEach(function(hp){
        hp.el.style.opacity='0';
        hp.el.style.visibility='hidden';
      }); }

      // Quitar splash inmediatamente
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
      api.getPensamientos().then(r=>{ if(typeof renderPensamientos==='function') renderPensamientos(r); setTimeout(function(){ if(window._refrescarEspejos) window._refrescarEspejos(); },200); }).catch(()=>{});
      api.getRelaciones().then(r=>{ if(typeof renderRelaciones==='function') renderRelaciones(r); }).catch(()=>{});
      api.getSalud().then(r=>{ if(typeof renderSalud==='function') renderSalud(r); }).catch(()=>{});
      if(typeof cargarScore==='function') cargarScore();
      api.getPatrimonio().then(r=>{ window._patrimonioData=r; if(typeof renderPatrimonio==='function') renderPatrimonio(r); }).catch(()=>{});
      if(typeof cargarRevision==='function') cargarRevision('mensual',new Date().getFullYear(),new Date().getMonth()+1,null);
      // Pasar datos directamente a los paneles HUD
      window._hudDatos = {
        totalApartado: (d.apartados&&d.apartados.totalApartado) || 0,
        necesidades: d.necesidades || {},
        datosMes: d.datosMes || {},
        financiero: d.financieroAvanzado || {},
      };
      setTimeout(function(){
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos(window._hudDatos);
      }, 600);
      // Segundo intento para datos que llegan async (pensamientos, salud, etc.)
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
        setChip('ok','Listo ↺'); showToast('✓ Datos actualizados');
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
  if(!f) return Promise.resolve();  // retornar Promise para compatibilidad con Promise.all
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
   NAVEGACIÓN — funciones de nav robustas
═══════════════════════════════════════════════════════ */

/* ── NAVEGACIÓN — stubs de fallback
   Solo se definen si el GAS no los inyectó primero.
   El GAS define: irABitacora, irAActivity, irANutricion,
                  volverAlAnverso, _syncMobTab, _setPantalla
   Si corren en GAS → estas líneas no hacen nada (typeof !== 'undefined')
   Si corren localmente → proporcionan navegación básica por CSS
── */

var _panelActual = 'anverso';

// Helper interno — manipula clases CSS directamente
function _irAPanel(boardId, tabKey){
  var esAnverso = (boardId === 'board-anverso');

  // Toggle: si ya estás aquí, vuelve al anverso
  if(!esAnverso && _panelActual === boardId){
    if(typeof volverAlAnverso==='function') volverAlAnverso();
    return;
  }
  _panelActual = esAnverso ? 'anverso' : boardId;

  // Anverso: slide
  var anverso = document.getElementById('board-anverso');
  if(anverso){
    if(esAnverso) anverso.classList.remove('slide-right','slide-left');
    else          anverso.classList.add('slide-right');
  }

  // Paneles secundarios
  document.querySelectorAll('.board-face:not(.anverso)').forEach(function(f){
    f.classList.remove('active');
  });
  if(!esAnverso){
    var dest = document.getElementById(boardId);
    if(dest) dest.classList.add('active');
  }

  // Hero btns
  document.querySelectorAll('.btn-flip').forEach(function(b){ b.classList.remove('active'); });
  var bh = document.getElementById('btn-home');
  if(bh) bh.classList.toggle('on', esAnverso);
  var ids = {'logros':'btn-logros','bitacora':'btn-maslow',
              'activity':'btn-activity','nutricion':'btn-nutricion','sheets':'btn-sheets'};
  var heroBtn = document.getElementById(ids[tabKey] || ('btn-'+tabKey));
  if(heroBtn) heroBtn.classList.add('active');

  // Mob tabs
  document.querySelectorAll('.mob-tab').forEach(function(t){
    t.classList.toggle('active', t.dataset.tab === tabKey);
  });
}

// Cada función solo se define si el GAS no la definió primero
// Stubs como window assignments — el GAS puede sobreescribirlos en cualquier momento
// (function declarations quedan hoisted y no se pueden pisar)
window.volverAlAnverso = window.volverAlAnverso || function(){
  _panelActual = 'anverso';
  var anv = document.getElementById('board-anverso');
  if(anv) anv.classList.remove('slide-right','slide-left');
  document.querySelectorAll('.board-face:not(.anverso)').forEach(function(f){ f.classList.remove('active'); });
  var bh = document.getElementById('btn-home'); if(bh) bh.classList.add('on');
  document.querySelectorAll('.btn-flip').forEach(function(b){ b.classList.remove('active'); });
  document.querySelectorAll('.mob-tab').forEach(function(t){ t.classList.toggle('active', t.dataset.tab==='entrada'); });
  var dd = document.getElementById('entrada-dropdown');
  if(dd){ dd.classList.remove('show'); dd.style.display='none'; }
};

window.irABitacora = window.irABitacora || function(){
  _irAPanel('board-bitacora','bitacora');
};

// irAActivity / irANutricion — window assignment (no hoisting)
window.irAActivity = window.irAActivity || function(){
  _irAPanel('board-activity','activity');
  function _doRenderActivity(){
    if(typeof window.renderActivity==='function') window.renderActivity();
  }
  if(window._actData){
    _doRenderActivity();
  } else {
    // Sin datos — cargar via API y luego renderizar
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
  var body = document.getElementById('nut-panel-body');
  // Mostrar spinner y siempre recargar datos frescos
  if(body) body.innerHTML='<div style="padding:40px;text-align:center;color:rgba(255,255,255,.25)"><i class="fas fa-circle-notch fa-spin" style="font-size:18px;color:#4ade80"></i></div>';
  if(typeof api!=='undefined'){
    api.getNutricion().then(function(d){
      if(typeof window.renderNutricion==='function') window.renderNutricion(d);
      else {
        // Fallback inline si renderNutricion no está disponible aún
        var b = document.getElementById('nut-panel-body'); if(!b) return;
        if(!d||!d.ok){ b.innerHTML='<div style="padding:40px;text-align:center;color:rgba(255,255,255,.25);font-size:13px">Sin registros de nutrición</div>'; return; }
        var dias = d.semana || Object.values(d.dias||{});
        if(!dias.length){ b.innerHTML='<div style="padding:40px;text-align:center;color:rgba(255,255,255,.25);font-size:13px">Sin registros esta semana</div>'; return; }
        var html = '<div style="padding:0 20px 24px;display:flex;flex-direction:column;gap:12px">';
        dias.forEach(function(dia){
          if(!dia.items||!dia.items.length) return;
          html += '<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.35);margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,.06)">'+dia.fecha+'</div>';
          dia.items.forEach(function(it){
            html += '<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04)">' +
              '<span style="font-size:10px;font-weight:600;padding:2px 7px;border:1px solid rgba(140,100,220,.25);color:rgba(167,139,250,.7);text-transform:uppercase;letter-spacing:.06em;flex-shrink:0;border-radius:4px">'+(it.momento||'—')+'</span>' +
              '<span style="flex:1;font-size:13px;color:rgba(255,255,255,.8)">'+(it.alimento||it.comida||'—')+'</span>' +
              (it.cal?'<span style="font-size:11px;font-weight:700;color:#fb923c;flex-shrink:0">'+Math.round(it.cal)+' kcal</span>':'') +
            '</div>';
          });
          html += '</div>';
        });
        html += '</div>';
        b.innerHTML = html;
      }
    }).catch(function(){
      if(body) body.innerHTML='<div style="padding:40px;text-align:center;color:rgba(239,68,68,.4);font-size:12px">Error al cargar Nutrición</div>';
    });
  }
};

window._syncMobTab = window._syncMobTab || function(tabKey){
  document.querySelectorAll('.mob-tab').forEach(function(t){
    t.classList.toggle('active', t.dataset.tab===tabKey);
  });
};




function irASheets(sheetId){
  sheetId=sheetId||'raw';
  // _setPantalla puede no existir localmente — usar _irAPanel
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
  // ── CSS UNIFICADO DE FORMS ──
  if(!document.getElementById('form-hud-styles')){
    var fs = document.createElement('style');
    fs.id = 'form-hud-styles';
    fs.textContent = [
      // Contenedor principal del form
      // Keyframe breathing específico para el form
      '@keyframes formBreath{',
        '0%,100%{',
          'box-shadow:',
            '0 0 0 1px rgba(140,100,220,0.20),',
            '0 0 30px rgba(139,92,246,0.12),',
            '0 0 60px rgba(139,92,246,0.06),',
            '0 24px 80px rgba(0,0,0,0.85);',
        '}',
        '33%{',
          'box-shadow:',
            '0 0 0 1px rgba(167,139,250,0.45),',
            '0 0 40px rgba(139,92,246,0.30),',
            '0 0 80px rgba(139,92,246,0.14),',
            '0 24px 80px rgba(0,0,0,0.90);',
        '}',
        '66%{',
          'box-shadow:',
            '0 0 0 1px rgba(34,211,238,0.30),',
            '0 0 35px rgba(34,211,238,0.18),',
            '0 0 70px rgba(34,211,238,0.08),',
            '0 24px 80px rgba(0,0,0,0.90);',
        '}',
      '}',
      // Borde superior que cambia de color
      '@keyframes formBorderGlow{',
        '0%,100%{background:linear-gradient(90deg,#7C3AED,#A855F7,#22D3EE);box-shadow:0 0 12px rgba(139,92,246,0.7),0 0 24px rgba(139,92,246,0.3);}',
        '33%{background:linear-gradient(90deg,#A855F7,#22D3EE,#4ADE80);box-shadow:0 0 12px rgba(34,211,238,0.7),0 0 24px rgba(34,211,238,0.3);}',
        '66%{background:linear-gradient(90deg,#22D3EE,#7C3AED,#A855F7);box-shadow:0 0 12px rgba(167,139,250,0.7),0 0 24px rgba(167,139,250,0.3);}',
      '}',
      // Scan line vertical que sube por el form
      '@keyframes formScan{',
        '0%{top:-2px;opacity:0}',
        '3%{opacity:0.6}',
        '97%{opacity:0.6}',
        '100%{top:100%;opacity:0}',
      '}',

      '#sec-entrada{',
        'background:rgba(10,7,22,0.97)!important;',
        'border:1px solid rgba(140,100,220,0.25)!important;',
        'border-radius:16px!important;',
        'backdrop-filter:blur(28px) saturate(180%)!important;',
        '-webkit-backdrop-filter:blur(28px) saturate(180%)!important;',
        'background-image:linear-gradient(rgba(120,80,200,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.018) 1px,transparent 1px)!important;',
        'background-size:32px 32px!important;',
        'width:440px!important;max-width:96vw!important;',
        'animation:formBreath 4s ease-in-out infinite!important;',
        'position:relative!important;',
        'overflow:hidden!important;',
      '}',
      // Scan line sobre el form completo
      '#sec-entrada::after{',
        'content:"";',
        'position:absolute;left:0;right:0;height:2px;pointer-events:none;z-index:10;',
        'background:linear-gradient(90deg,transparent,rgba(167,139,250,0.4),rgba(34,211,238,0.4),transparent);',
        'animation:formScan 6s linear infinite;',
      '}',
      // Header del form
      '#entrada-paso2-header{',
        'display:flex;align-items:center;gap:12px;',
        'padding:16px 20px 14px;',
        'border-bottom:1px solid rgba(140,100,220,0.18);',
        'background:rgba(18,10,36,0.8);',
        'position:relative;overflow:hidden;',
      '}',
      '#entrada-paso2-header::before{',
        'content:"";position:absolute;top:0;left:0;right:0;height:2px;',
        'animation:formBorderGlow 4s ease-in-out infinite;',
      '}',
      '#entrada-paso2-titulo{',
        'font-size:14px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;',
        'color:#C4B5FD;text-shadow:0 0 12px rgba(139,92,246,0.5);',
        'flex:1;',
      '}',
      // Tabs de navegación
      '#toggle-modo-wrap{',
        'display:flex;gap:2px;padding:10px 16px 0;',
        'border-bottom:1px solid rgba(140,100,220,0.12);',
        'background:rgba(10,6,22,0.5);',
        'overflow-x:auto;',
      '}',
      '#toggle-modo-wrap::-webkit-scrollbar{display:none}',
      '.tab-entrada{',
        'padding:6px 12px;border:none;border-radius:8px 8px 0 0;',
        'background:transparent;',
        'color:rgba(200,208,230,0.40);',
        'font-family:inherit;font-size:11px;font-weight:600;letter-spacing:.06em;',
        'cursor:pointer;transition:all .15s;white-space:nowrap;',
        'border-bottom:2px solid transparent;',
      '}',
      '.tab-entrada:hover{color:rgba(200,208,230,0.75);background:rgba(139,92,246,0.08);}',
      '.tab-entrada.on{',
        'color:#C4B5FD;border-bottom-color:#A855F7;',
        'background:rgba(139,92,246,0.12);',
        'text-shadow:0 0 8px rgba(139,92,246,0.4);',
      '}',
      // Wrapper de campos
      '.fwrap{padding:16px 20px;display:flex;flex-direction:column;gap:12px;}',
      // Label de campo
      '.flbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.16em;color:rgba(167,139,250,0.55);margin-bottom:5px;}',
      // Input/textarea unificado
      '.fi{',
        'width:100%;box-sizing:border-box;',
        'background:rgba(20,12,40,0.7);',
        'border:1px solid rgba(140,100,220,0.22);',
        'border-radius:10px;',
        'color:#E2E8F0;font-family:inherit;font-size:14px;',
        'padding:11px 14px;',
        'outline:none;',
        'transition:border-color .15s,box-shadow .15s;',
        '-webkit-appearance:none;',
      '}',
      '.fi:focus{',
        'border-color:rgba(167,139,250,0.55);',
        'box-shadow:0 0 0 3px rgba(139,92,246,0.12),inset 0 0 12px rgba(139,92,246,0.04);',
      '}',
      '.fi::placeholder{color:rgba(200,208,230,0.22);}',
      // Opts (botones de selección)
      '.fo{display:flex;flex-wrap:wrap;gap:6px;}',
      '.fopt{',
        'padding:6px 13px;border-radius:8px;',
        'background:rgba(20,12,40,0.6);',
        'border:1px solid rgba(140,100,220,0.20);',
        'color:rgba(200,208,230,0.55);',
        'font-family:inherit;font-size:11px;font-weight:600;',
        'cursor:pointer;transition:all .15s;',
        'letter-spacing:.04em;',
      '}',
      '.fopt:hover{border-color:rgba(167,139,250,0.45);color:rgba(220,220,240,0.85);background:rgba(139,92,246,0.10);}',
      '.fopt.on{',
        'background:rgba(139,92,246,0.22);',
        'border-color:rgba(167,139,250,0.55);',
        'color:#C4B5FD;',
        'box-shadow:0 0 8px rgba(139,92,246,0.20);',
        'text-shadow:0 0 6px rgba(167,139,250,0.4);',
      '}',
      // Botón guardar
      '.fguardar{',
        'display:flex;align-items:center;justify-content:center;gap:8px;',
        'padding:13px 20px;border:none;border-radius:10px;',
        'background:linear-gradient(135deg,rgba(109,40,217,0.9),rgba(139,92,246,0.85));',
        'border:1px solid rgba(167,139,250,0.4);',
        'color:#fff;font-family:inherit;font-size:13px;font-weight:700;',
        'letter-spacing:.08em;text-transform:uppercase;',
        'cursor:pointer;width:100%;',
        'box-shadow:0 4px 20px rgba(139,92,246,0.3);',
        'transition:all .15s;',
      '}',
      '.fguardar:hover{',
        'background:linear-gradient(135deg,rgba(124,58,237,1),rgba(167,139,250,0.9));',
        'box-shadow:0 4px 28px rgba(139,92,246,0.5);',
        'transform:translateY(-1px);',
      '}',
      '.fguardar:active{transform:translateY(0);}',
      // Grid 2 columnas
      '.fg2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}',
      '.fg3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}',
      // Resultado
      '.fres{font-size:12px;text-align:center;min-height:18px;color:rgba(200,208,230,0.4);}',
      '.fres.ok{color:#4ADE80;text-shadow:0 0 8px rgba(74,222,128,0.4);}',
      '.fres.err{color:#EF4444;}',
      // Divisor
      '.fdiv{height:1px;background:linear-gradient(90deg,rgba(139,92,246,0.25),rgba(139,92,246,0.05));margin:2px 0;}',
      // Form actions (guardar/cancelar del form base)
      '.form-actions{',
        'padding:12px 20px 16px!important;',
        'border-top:1px solid rgba(140,100,220,0.12)!important;',
        'background:rgba(8,4,18,0.5)!important;',
        'gap:8px!important;',
      '}',
      // Botón guardar base
      '#btnG{',
        'background:linear-gradient(135deg,rgba(109,40,217,0.9),rgba(139,92,246,0.85))!important;',
        'border:1px solid rgba(167,139,250,0.4)!important;',
        'box-shadow:0 4px 20px rgba(139,92,246,0.3)!important;',
        'border-radius:10px!important;',
        'color:#fff!important;font-weight:700!important;letter-spacing:.06em!important;',
      '}',
      '#btnG:hover{box-shadow:0 4px 28px rgba(139,92,246,0.5)!important;transform:translateY(-1px)!important;}',
      // Campos base heredados
      '.campo-field,.finput{',
        'background:rgba(20,12,40,0.7)!important;',
        'border:1px solid rgba(140,100,220,0.22)!important;',
        'border-radius:10px!important;',
        'color:#E2E8F0!important;',
      '}',
      '.campo-field:focus,.finput:focus{',
        'border-color:rgba(167,139,250,0.55)!important;',
        'box-shadow:0 0 0 3px rgba(139,92,246,0.12)!important;',
        'outline:none!important;',
      '}',
      '.campo-label,.campo-lbl{color:rgba(167,139,250,0.55)!important;font-size:9px!important;font-weight:700!important;letter-spacing:.16em!important;text-transform:uppercase!important;}',
      // Opts legacy
      '.opts{display:flex;flex-wrap:wrap;gap:5px!important;}',
      '.opt{',
        'background:rgba(20,12,40,0.6)!important;',
        'border:1px solid rgba(140,100,220,0.20)!important;',
        'border-radius:8px!important;',
        'color:rgba(200,208,230,0.55)!important;',
        'font-size:11px!important;font-weight:600!important;',
        'padding:6px 12px!important;',
        'transition:all .15s!important;',
      '}',
      '.opt:hover{border-color:rgba(167,139,250,0.45)!important;color:rgba(220,220,240,0.9)!important;background:rgba(139,92,246,0.10)!important;}',
      '.opt.on{',
        'background:rgba(139,92,246,0.22)!important;',
        'border-color:rgba(167,139,250,0.55)!important;',
        'color:#C4B5FD!important;',
        'box-shadow:0 0 8px rgba(139,92,246,0.20)!important;',
      '}',
      // Scroll del form
      '#sec-entrada::-webkit-scrollbar{width:4px;}',
      '#sec-entrada::-webkit-scrollbar-thumb{background:rgba(139,92,246,0.3);border-radius:2px;}',
      // Cerrar btn
      '#btn-cerrar-entrada,#btnCerrar{',
        'background:rgba(30,15,50,0.7)!important;',
        'border:1px solid rgba(140,100,220,0.25)!important;',
        'border-radius:8px!important;',
        'color:rgba(167,139,250,0.7)!important;',
        'transition:all .15s!important;',
      '}',
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

  ['pensamiento','persona','salud','apartado','patrimonio','bancos','nutricion','entrenamiento','activity'].forEach(tab=>{
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

  const titulos={nueva:'💸 RAW',editar:'✏️ Editar',pensamiento:'💭 Pensamiento',persona:'👥 Persona',salud:'🏥 Salud',apartado:'💰 Apartado',patrimonio:'🏦 Patrimonio',bancos:'🏛️ Bancos',nutricion:'🥗 Nutrición',entrenamiento:'💪 Entrenamiento',activity:'⚡ Activity'};
  const tituloEl=document.getElementById('entrada-paso2-titulo');
  if(tituloEl) tituloEl.textContent=titulos[modo]||modo;

  ['nueva','editar','pensamiento','persona','salud','apartado','patrimonio','bancos','nutricion','entrenamiento','libro','movie','norut','activity'].forEach(t=>{
    const btn=document.getElementById('btn-tab-'+t); if(btn)btn.classList.toggle('on',t===modo);
    const w=document.getElementById(t+'-wrap'); if(w)w.innerHTML='';
  });

  ['editar-id-wrap','pensamiento-wrap','persona-wrap','salud-wrap','apartado-wrap'].forEach(id=>{ const el=document.getElementById(id);if(el)el.style.display='none'; });

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
  if(tab==='pensamiento')     _renderPensamientoForm(wrap);
  else if(tab==='persona')    _renderPersonaForm(wrap);
  else if(tab==='salud')      _renderSaludForm(wrap);
  else if(tab==='apartado')   _renderApartadoForm(wrap);
  else if(tab==='patrimonio') _renderPatrimonioForm(wrap);
  else if(tab==='bancos')     _renderBancosForm(wrap);
  else if(tab==='nutricion')  _renderNutricionForm(wrap);
  else if(tab==='entrenamiento') _renderEntrenamientoForm(wrap);
  else if(tab==='libro')      _renderLibroForm(wrap);
  else if(tab==='movie')      _renderMovieForm(wrap);
  else if(tab==='norut')      _renderNoRutForm(wrap);
  else if(tab==='activity')   _renderActivityForm(wrap);
}

// ══════════════════════════════════════════
//  FORMULARIOS DE TABS (sin cambios)
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
  var recHtml='<div><div style="font-size:10px;color:var(--m);margin-bottom:4px">Recurrencia</div><div class="opts" id="act-rec-opts">'+RECS.map(r=>`<button class="opt" onclick="event.stopPropagation();_selOpt(this,'act-rec-opts');document.getElementById('act-rec').value='${r}'">${r}</button>`).join('')+'</div><input type="hidden" id="act-rec" value="Diario"></div>';
  if(tipo==='personal'){
    extra.innerHTML='<input type="text" id="act-nombre" class="fi" placeholder="Nombre del hábito…" style="font-size:14px">'+recHtml+'<div><div style="font-size:10px;color:var(--m);margin-bottom:4px">Categoría Sims</div><div class="opts" id="act-sims-opts">'+SIMS_OPTS.map(s=>`<button class="opt" onclick="event.stopPropagation();_selOpt(this,'act-sims-opts');document.getElementById('act-sims').value='${s}'">${s}</button>`).join('')+'</div><input type="hidden" id="act-sims" value=""></div>';
  } else if(tipo==='electronics'){
    extra.innerHTML='<input type="text" id="act-nombre" class="fi" placeholder="Nombre del check de trabajo…" style="font-size:14px">'+recHtml;
  } else {
    var label=tipo==='libro'?'Título del libro':tipo==='movie'?'Título de la película/serie':'Descripción del pendiente';
    extra.innerHTML='<input type="text" id="act-nombre" class="finput" placeholder="'+label+'" style="font-size:14px;padding:10px 14px">';
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
  if(tipo==='electronics'){datos.recurrencia=(document.getElementById('act-rec')||{}).value||'Diario';}
  var tipoBack=tipo==='electronics'?'electronics':tipo==='libro'?'libro':tipo==='movie'?'movie':tipo==='norut'?'norut':'personal';
  api.agregarAActivity(tipoBack,datos).then(function(r){
    res.textContent=r.ok?'✓ Agregado':'✗ '+(r.mensaje||'Error');
    res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){showToast('✓ Agregado a Activity Check');setTimeout(cerrarEntrada,800);}
  }).catch(function(){res.textContent='Error';res.style.color='var(--err)';});
}

function _guardarNutricion(){
  var comida=document.getElementById('nut-comida').value.trim();
  var res=document.getElementById('nut-res');
  if(!comida){res.textContent='Escribe qué comiste';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  var datos={comida,calorias:parseFloat(document.getElementById('nut-cal')?.value)||0,proteina:parseFloat(document.getElementById('nut-prot')?.value)||0,carbos:parseFloat(document.getElementById('nut-carbos')?.value)||0,grasa:parseFloat(document.getElementById('nut-grasa')?.value)||0,agua:parseFloat(document.getElementById('nut-agua')?.value)||0,fasting:parseFloat(document.getElementById('nut-fast')?.value)||0,notas:document.getElementById('nut-notas')?.value||'',fecha:fmtD(new Date())};
  api.guardarNutricion(datos).then(function(r){
    res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){showToast('✓ Nutrición guardada');document.getElementById('nut-comida').value='';api.getNutricion().then(renderNutricion).catch(function(){});setTimeout(cerrarEntrada,800);}
  }).catch(function(){res.textContent='Error';res.style.color='var(--err)';});
}

function _guardarEntrenamiento(){
  var ejercicio=document.getElementById('ent-ejercicio').value.trim();
  var res=document.getElementById('ent-res');
  if(!ejercicio){res.textContent='Escribe el ejercicio';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  var datos={tipo:document.getElementById('ent-tipo')?.value||'',ejercicio,duracion:parseFloat(document.getElementById('ent-dur')?.value)||0,distancia:parseFloat(document.getElementById('ent-dist')?.value)||0,series:parseFloat(document.getElementById('ent-series')?.value)||0,reps:parseFloat(document.getElementById('ent-reps')?.value)||0,peso:parseFloat(document.getElementById('ent-peso')?.value)||0,notas:document.getElementById('ent-notas')?.value||'',fecha:fmtD(new Date())};
  api.guardarEntrenamiento(datos).then(function(r){
    res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;res.style.color=r.ok?'var(--ok)':'var(--err)';
    if(r.ok){showToast('✓ Entrenamiento guardado');document.getElementById('ent-ejercicio').value='';api.getEntrenamiento().then(renderEntrenamiento).catch(function(){});setTimeout(cerrarEntrada,800);}
  }).catch(function(){res.textContent='Error';res.style.color='var(--err)';});
}

function _renderLibroForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">📚 Agregar libro</div>'+
    '<input type="text" id="libro-nombre" class="fi" placeholder="Título del libro" style="font-size:15px">'+
    '<input type="text" id="libro-autor" class="fi" placeholder="Autor (opcional)" style="font-size:13px">'+
    '<div><div class="flbl">Estado</div><div class="fo" id="libro-estado-opts">'+
      ['Leyendo','Completado','En pausa','Quiero leer'].map(function(s){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#libro-estado-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'libro-estado\').value=\''+s+'\'">'+s+'</button>'; }).join('')+
    '</div><input type="hidden" id="libro-estado" value="Completado"></div>'+
    '<button onclick="_guardarLibroForm()" class="fguardar"><i class="fas fa-book-open" style="color:#60A5FA"></i> Guardar libro</button>'+
    '<div id="libro-res" class="fres"></div>'+
    '</div>';
}
function _guardarLibroForm(){var nombre=document.getElementById('libro-nombre')?.value?.trim();if(!nombre){showToast('Escribe el título del libro',false);return;}var res=document.getElementById('libro-res');if(res)res.textContent='Guardando…';api.marcarActivityItem('libro',nombre,true).then(function(r){if(res)res.textContent=r.ok?'✓ Libro guardado':'Error: '+r.mensaje;if(r.ok){document.getElementById('libro-nombre').value='';if(document.getElementById('libro-autor'))document.getElementById('libro-autor').value='';}}).catch(function(){if(res)res.textContent='Error al guardar';});}

function _renderMovieForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">🎬 Registrar película / serie</div>'+
    '<input type="text" id="movie-nombre" class="fi" placeholder="Título de la película o serie" style="font-size:15px">'+
    '<div><div class="flbl">Estado</div><div class="fo" id="movie-estado-opts">'+
      ['Completado','Viendo','Quiero ver','Abandonado'].map(function(s){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#movie-estado-opts .fopt\').forEach(function(b){b.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'movie-estado\').value=\''+s+'\'">'+s+'</button>'; }).join('')+
    '</div><input type="hidden" id="movie-estado" value="Completado"></div>'+
    '<button onclick="_guardarMovieForm()" class="fguardar"><i class="fas fa-film" style="color:#F59E0B"></i> Guardar película</button>'+
    '<div id="movie-res" class="fres"></div>'+
    '</div>';
}
function _guardarMovieForm(){var nombre=document.getElementById('movie-nombre')?.value?.trim();if(!nombre){showToast('Escribe el título',false);return;}var res=document.getElementById('movie-res');if(res)res.textContent='Guardando…';api.marcarActivityItem('movie',nombre,true).then(function(r){if(res)res.textContent=r.ok?'✓ Guardado':'Error: '+r.mensaje;if(r.ok)document.getElementById('movie-nombre').value='';}).catch(function(){if(res)res.textContent='Error al guardar';});}

function _renderNoRutForm(wrap){
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">📌 Agregar pendiente</div>'+
    '<input type="text" id="norut-nombre" class="fi" placeholder="¿Qué hay que hacer?" style="font-size:15px">'+
    '<div><div class="flbl">Notas</div><textarea id="norut-nota" class="fi" placeholder="Detalles opcionales…" rows="3" style="font-size:13px;resize:none"></textarea></div>'+
    '<button onclick="_guardarNoRutForm()" class="fguardar"><i class="fas fa-thumbtack" style="color:#FBBF24"></i> Agregar pendiente</button>'+
    '<div id="norut-res" class="fres"></div>'+
    '</div>';
}
function _guardarNoRutForm(){var nombre=document.getElementById('norut-nombre')?.value?.trim();if(!nombre){showToast('Escribe el nombre del pendiente',false);return;}var res=document.getElementById('norut-res');if(res)res.textContent='Guardando…';api.marcarActivityItem('norut',nombre,false).then(function(r){if(res)res.textContent=r.ok?'✓ Pendiente guardado':'Error: '+r.mensaje;if(r.ok){document.getElementById('norut-nombre').value='';if(document.getElementById('norut-nota'))document.getElementById('norut-nota').value='';}}).catch(function(){if(res)res.textContent='Error al guardar';});}

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
  // Set fecha hoy
  setTimeout(function(){
    var f=document.getElementById('ban-fecha');
    if(f&&!f.value){var h=new Date();f.value=h.getFullYear()+'-'+String(h.getMonth()+1).padStart(2,'0')+'-'+String(h.getDate()).padStart(2,'0');}
  },50);
}

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
function _guardarPensamiento(){const texto=document.getElementById('p-texto').value.trim();const categoria=document.getElementById('p-cat').value;const energia=document.getElementById('p-energia').value;const etiquetas=document.getElementById('p-etiquetas').value.trim();const res=document.getElementById('p-res');if(!texto){res.textContent='Escribe algo primero';res.style.color='var(--err)';return;}res.textContent='Guardando…';res.style.color='var(--m)';api.guardarPensamiento({texto,categoria,energia:energia||null,etiquetas,fecha:fmtD(new Date())}).then(r=>{res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;res.style.color=r.ok?'var(--ok)':'var(--err)';if(r.ok){showToast('✓ Pensamiento guardado');document.getElementById('p-texto').value='';document.getElementById('p-etiquetas').value='';document.querySelectorAll('#p-cat-opts .opt,#p-energia-opts .opt').forEach(b=>b.classList.remove('on'));document.getElementById('p-cat').value='';document.getElementById('p-energia').value='';setTimeout(cerrarEntrada,800);}}).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});}

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
function _guardarPersona(){const nombre=document.getElementById('per-nombre').value.trim();const tipo=document.getElementById('per-tipo').value;const energia=document.getElementById('per-energia').value;const notas=document.getElementById('per-notas').value.trim();const res=document.getElementById('per-res');if(!nombre){res.textContent='Escribe un nombre';res.style.color='var(--err)';return;}res.textContent='Guardando…';res.style.color='var(--m)';api.guardarInteraccion({nombre,tipo,energia:energia!==''?Number(energia):0,notas}).then(r=>{res.textContent=r.ok?'✓ '+r.mensaje:'✗ '+r.mensaje;res.style.color=r.ok?'var(--ok)':'var(--err)';if(r.ok){showToast('✓ Interacción guardada');document.getElementById('per-nombre').value='';document.getElementById('per-notas').value='';document.querySelectorAll('#per-tipo-opts .opt,#per-energia-opts .opt').forEach(b=>b.classList.remove('on'));document.getElementById('per-tipo').value='';document.getElementById('per-energia').value='';setTimeout(cerrarEntrada,800);}}).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});}

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

function _renderApartadoForm(wrap){
  var bancos=['BBVA','BEATS','Efectivo','Otro'];
  var bancoBtns=bancos.map(function(b){ return '<button class="fopt" onclick="event.stopPropagation();document.querySelectorAll(\'#ap-banco-opts .fopt\').forEach(function(b2){b2.classList.remove(\'on\')});this.classList.add(\'on\');document.getElementById(\'ap-banco\').value=\''+b+'\'">'+b+'</button>'; }).join('');
  wrap.innerHTML=
    '<div class="fwrap">'+
    '<div class="flbl">💰 Nuevo apartado</div>'+
    '<input type="text" id="ap-nombre" class="fi" placeholder="¿Para qué es este apartado?" style="font-size:15px">'+
    '<div class="fg2">'+
      '<div><div class="flbl">Monto ($)</div><input type="number" id="ap-monto" class="fi" placeholder="0.00" step="0.01" style="font-size:20px;font-weight:700;text-align:center;color:#FBBF24"></div>'+
      '<div><div class="flbl">Meta (fecha)</div><input type="date" id="ap-meta" class="fi" style="font-size:13px;color-scheme:dark"></div>'+
    '</div>'+
    '<div><div class="flbl">Banco / Origen</div><div class="fo" id="ap-banco-opts">'+bancoBtns+'</div><input type="hidden" id="ap-banco" value=""></div>'+
    '<input type="text" id="ap-cat" class="fi" placeholder="Categoría (viaje, emergencia, compra…)" style="font-size:13px">'+
    '<button onclick="_guardarApartado()" class="fguardar"><i class="fas fa-lock" style="color:#FBBF24"></i> Crear apartado</button>'+
    '<div id="ap-res" class="fres"></div>'+
    '</div>';
}

function _renderPatrimonioForm(wrap){
  wrap.innerHTML=`<div style="padding:16px var(--pad);display:flex;flex-direction:column;gap:12px"><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--m)">Registrar movimiento</div><div><div style="font-size:10px;color:var(--m);margin-bottom:6px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Tipo</div><div class="opts" id="pat-tipo-opts"><button class="opt" onclick="event.stopPropagation();_selOpt(this,'pat-tipo-opts');document.getElementById('pat-tipo').value='ahorro';_onPatTipoChange()">💳 Banco</button><button class="opt" onclick="event.stopPropagation();_selOpt(this,'pat-tipo-opts');document.getElementById('pat-tipo').value='efectivo';_onPatTipoChange()">💵 Efectivo</button><button class="opt" onclick="event.stopPropagation();_selOpt(this,'pat-tipo-opts');document.getElementById('pat-tipo').value='inversion';_onPatTipoChange()">📈 Inversión</button></div><input type="hidden" id="pat-tipo" value=""></div><input type="text" id="pat-concepto" class="finput" placeholder="Concepto" style="font-size:14px;padding:10px 14px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><div style="font-size:10px;color:var(--m);margin-bottom:4px">Monto</div><input type="number" id="pat-monto" class="finput" placeholder="0.00" step="0.01" inputmode="decimal" style="font-size:16px;padding:10px 12px"></div><div><div style="font-size:10px;color:var(--m);margin-bottom:4px">Fecha</div><input type="date" id="pat-fecha" class="finput" style="font-size:13px;padding:9px 12px"></div></div><div id="pat-extra" style="display:flex;flex-direction:column;gap:8px"></div><button onclick="_guardarPatrimonio()" class="btn-save" style="border-radius:var(--rad-pill)"><i class="fas fa-floppy-disk"></i> Guardar</button><div id="pat-res" style="font-size:12px;text-align:center;color:var(--m)"></div></div>`;
  document.getElementById('pat-fecha').value=fmtD(new Date());
}
function _onPatTipoChange(){const tipo=document.getElementById('pat-tipo').value;const extra=document.getElementById('pat-extra');if(!extra)return;if(tipo==='ahorro'){extra.innerHTML=`<input type="text" id="pat-banco" class="finput" placeholder="Banco" style="font-size:13px;padding:9px 12px"><div class="opts" id="pat-mov-opts"><button class="opt" onclick="event.stopPropagation();_selOpt(this,'pat-mov-opts');document.getElementById('pat-movtipo').value='Depósito'">Depósito</button><button class="opt" onclick="event.stopPropagation();_selOpt(this,'pat-mov-opts');document.getElementById('pat-movtipo').value='Retiro'">Retiro</button></div><input type="hidden" id="pat-movtipo" value="Depósito">`;}else if(tipo==='inversion'){extra.innerHTML=`<input type="text" id="pat-instrumento" class="finput" placeholder="Instrumento (CETES, GBM…)" style="font-size:13px;padding:9px 12px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><input type="text" id="pat-plazo" class="finput" placeholder="Plazo" style="font-size:13px;padding:9px 12px"><input type="number" id="pat-rendimiento" class="finput" placeholder="Rendimiento $" step="0.01" style="font-size:13px;padding:9px 12px"></div>`;}else{extra.innerHTML='';}}
function _guardarPatrimonio(){
  const tipo=document.getElementById('pat-tipo').value;const concepto=document.getElementById('pat-concepto').value.trim();const monto=parseFloat(document.getElementById('pat-monto').value);const fecha=document.getElementById('pat-fecha').value;const res=document.getElementById('pat-res');
  if(!tipo){res.textContent='Selecciona un tipo';res.style.color='var(--err)';return;}if(!concepto||isNaN(monto)){res.textContent='Concepto y monto requeridos';res.style.color='var(--err)';return;}
  res.textContent='Guardando…';res.style.color='var(--m)';
  let datos={concepto,monto,fecha};let promise;
  if(tipo==='ahorro'){datos.banco=document.getElementById('pat-banco')?.value.trim()||'';datos.tipo=document.getElementById('pat-movtipo')?.value||'Depósito';promise=api.guardarAhorro(datos);}
  else if(tipo==='efectivo'){promise=api.guardarEfectivo(datos);}
  else{datos.instrumento=document.getElementById('pat-instrumento')?.value.trim()||'CETES';datos.plazo=document.getElementById('pat-plazo')?.value.trim()||'';datos.rendimiento=parseFloat(document.getElementById('pat-rendimiento')?.value)||0;promise=api.guardarInversion(datos);}
  promise.then(r=>{res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;res.style.color=r.ok?'var(--ok)':'var(--err)';if(r.ok){showToast('✓ Patrimonio guardado');api.getPatrimonio().then(r=>{if(typeof renderPatrimonio==='function')renderPatrimonio(r);}).catch(()=>{});setTimeout(cerrarEntrada,800);}}).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});
}

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
function _guardarPensamiento(){const texto=document.getElementById('p-texto').value.trim();const categoria=document.getElementById('p-cat').value;const energia=document.getElementById('p-energia').value;const etiquetas=document.getElementById('p-etiquetas').value.trim();const res=document.getElementById('p-res');if(!texto){res.textContent='Escribe algo primero';res.style.color='var(--err)';return;}res.textContent='Guardando…';res.style.color='var(--m)';api.guardarPensamiento({texto,categoria,energia:energia||null,etiquetas,fecha:fmtD(new Date())}).then(r=>{res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;res.style.color=r.ok?'var(--ok)':'var(--err)';if(r.ok){showToast('✓ Pensamiento guardado');document.getElementById('p-texto').value='';document.getElementById('p-etiquetas').value='';document.querySelectorAll('#p-cat-opts .opt,#p-energia-opts .opt').forEach(b=>b.classList.remove('on'));document.getElementById('p-cat').value='';document.getElementById('p-energia').value='';setTimeout(cerrarEntrada,800);}}).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});}

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
function _guardarPersona(){const nombre=document.getElementById('per-nombre').value.trim();const tipo=document.getElementById('per-tipo').value;const energia=document.getElementById('per-energia').value;const notas=document.getElementById('per-notas').value.trim();const res=document.getElementById('per-res');if(!nombre){res.textContent='Escribe un nombre';res.style.color='var(--err)';return;}res.textContent='Guardando…';res.style.color='var(--m)';api.guardarInteraccion({nombre,tipo,energia:energia!==''?Number(energia):0,notas}).then(r=>{res.textContent=r.ok?'✓ '+r.mensaje:'✗ '+r.mensaje;res.style.color=r.ok?'var(--ok)':'var(--err)';if(r.ok){showToast('✓ Interacción guardada');document.getElementById('per-nombre').value='';document.getElementById('per-notas').value='';document.querySelectorAll('#per-tipo-opts .opt,#per-energia-opts .opt').forEach(b=>b.classList.remove('on'));document.getElementById('per-tipo').value='';document.getElementById('per-energia').value='';setTimeout(cerrarEntrada,800);}}).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});}

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

function _renderApartadoForm(wrap){wrap.innerHTML=`<div style="padding:16px var(--pad);display:flex;flex-direction:column;gap:12px"><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--m)">Nuevo apartado</div><input type="text" id="ap-nombre" class="finput" placeholder="Nombre del apartado" style="font-size:14px;padding:10px 14px"><input type="text" id="ap-categoria" class="finput" placeholder="Categoría (Renta, Viaje, Emergencia…)" style="font-size:13px;padding:9px 12px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><div style="font-size:10px;color:var(--m);margin-bottom:4px">Monto</div><input type="number" id="ap-monto" class="finput" placeholder="0.00" step="0.01" inputmode="decimal" style="font-size:16px;padding:10px 12px"></div><div><div style="font-size:10px;color:var(--m);margin-bottom:4px">Banco</div><input type="text" id="ap-banco" class="finput" placeholder="BBVA, BEATS…" style="font-size:13px;padding:9px 12px"></div></div><div><div style="font-size:10px;color:var(--m);margin-bottom:4px">Fecha meta</div><input type="date" id="ap-meta" class="finput" style="font-size:13px;padding:9px 12px"></div><textarea id="ap-notas" class="finput" rows="2" placeholder="Notas…" style="resize:none;font-size:13px"></textarea><button onclick="_guardarApartado()" class="btn-save" style="border-radius:var(--rad-pill)"><i class="fas fa-floppy-disk"></i> Guardar apartado</button><div id="ap-res" style="font-size:12px;text-align:center;color:var(--m)"></div></div>`;}
function _guardarApartado(){const nombre=document.getElementById('ap-nombre').value.trim();const categoria=document.getElementById('ap-categoria').value.trim();const monto=parseFloat(document.getElementById('ap-monto').value);const banco=document.getElementById('ap-banco').value.trim();const meta=document.getElementById('ap-meta').value;const notas=document.getElementById('ap-notas').value.trim();const res=document.getElementById('ap-res');if(!nombre||isNaN(monto)){res.textContent='Nombre y monto requeridos';res.style.color='var(--err)';return;}res.textContent='Guardando…';res.style.color='var(--m)';api.guardarApartado({nombre,categoria,monto,banco,meta:meta||null,notas,estado:'Activo'}).then(r=>{res.textContent=r.ok?'✓ Guardado':'✗ '+r.mensaje;res.style.color=r.ok?'var(--ok)':'var(--err)';if(r.ok){showToast('✓ Apartado guardado');document.getElementById('ap-nombre').value='';document.getElementById('ap-categoria').value='';document.getElementById('ap-monto').value='';document.getElementById('ap-banco').value='';document.getElementById('ap-meta').value='';document.getElementById('ap-notas').value='';setTimeout(cerrarEntrada,800);}}).catch(()=>{res.textContent='Error';res.style.color='var(--err)';});}

function _selOpt(btn,containerId){ document.querySelectorAll('#'+containerId+' .opt').forEach(b=>b.classList.remove('on')); btn.classList.add('on'); }

function buscarFilaId(){
  const id=document.getElementById('editar-id-input').value.trim();
  if(!id){document.getElementById('editar-id-msg').textContent='Escribe un ID';return;}
  const spin=document.getElementById('buscar-spin');const msg=document.getElementById('editar-id-msg');
  if(spin)spin.style.display='block';msg.textContent='Buscando…';msg.style.color='var(--m)';
  api.getFilaPorId(id).then(r=>{
    if(spin)spin.style.display='none';
    if(!r.ok){msg.textContent='✗ '+r.mensaje;msg.style.color='var(--err)';return;}
    _filaEditar=r.fila;_idEditar=r.id;msg.textContent='✓ ID '+r.id+' — fila '+r.fila;msg.style.color='var(--ok)';
    document.getElementById('fecha').value=r.fecha||fmtD(new Date());marcarDone('fecha');
    proxSel=r.proyecto;setFieldVal('proyecto',r.proyecto,!r.proyecto);_selectOpt('sw-proyecto',r.proyecto);marcarDone('proyecto');
    contactoSel=r.contacto;setFieldVal('contacto',r.contacto,!r.contacto);_selectOpt('sw-contacto',r.contacto);marcarDone('contacto');
    setFieldVal('concepto',r.concepto,!r.concepto);marcarDone('concepto');
    const m=r.monto||0;sign=m>=0?1:-1;document.getElementById('monto').value=Math.abs(m);
    document.getElementById('sbp').className='msign'+(sign===1?' pos':'');document.getElementById('sbn').className='msign'+(sign===-1?' neg':'');
    upM();marcarDone('monto');
    recSel=r.recurrencia;setFieldVal('recurrencia',r.recurrencia,!r.recurrencia);_selectOpt('sw-recurrencia',r.recurrencia);marcarDone('recurrencia');
    document.getElementById('clave').value=r.clave||'';setFieldVal('clave',r.clave||'',!r.clave);if(r.clave)marcarDone('clave');
    necesidadSel=r.necesidad||'';if(r.necesidad){setFieldVal('necesidad',r.necesidad.slice(0,30),false);marcarDone('necesidad');}
  }).catch(e=>{if(spin)spin.style.display='none';msg.textContent='Error: '+e.message;msg.style.color='var(--err)';});
}
function _selectOpt(swId,val){ const w=document.getElementById(swId);if(!w)return;w.querySelectorAll('.opt').forEach(b=>{b.classList.toggle('on',b.textContent.trim()===val);}); }

// ══════════════════════════════════════════
//  ENTES
// ══════════════════════════════════════════
function renderEntes(data){
  window._fijosData=data||[];
  const body=document.getElementById('entes-list');
  if(!data||!data.length){body.innerHTML='<div style="padding:16px;color:var(--m);text-align:center">Sin datos</div>';return;}
  const apartadosPorBanco={};let totalApartadosActivos=0;
  (window._apartadosData||[]).forEach(ap=>{if(ap.estado&&ap.estado.toLowerCase()==='usado')return;const banco=(ap.banco||'').trim().toUpperCase();apartadosPorBanco[banco]=(apartadosPorBanco[banco]||0)+(ap.monto||0);totalApartadosActivos+=(ap.monto||0);});
  const total=data.reduce((s,f)=>f.nombre==='P'?s:s+(f.monto||0),0);
  const totalDisponible=total-totalApartadosActivos;
  const {txt:tt,cls:tc}=fmtMoneda(totalDisponible);
  document.getElementById('entes-total').textContent=tt;document.getElementById('entes-total').className='sec-hdr-val '+tc;
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
function togEnteEdit(fila){const ee=document.getElementById('ee-'+fila);const isOpen=ee.classList.contains('open');document.querySelectorAll('.ente-edit').forEach(e=>e.classList.remove('open'));if(!isOpen){ee.classList.add('open');document.getElementById('ei-'+fila).focus();}}
function guardarEnte(fila){
  const inp=document.getElementById('ei-'+fila);const val=parseFloat(inp.value);if(isNaN(val))return;
  const ico=document.getElementById('ei-ico-'+fila);ico.className='fas fa-circle-notch fa-spin';
  api.actualizarFijo(fila,val).then(r=>{
    ico.className='fas fa-check';
    if(r.ok){const {txt,cls}=fmtMoneda(val);const em=document.getElementById('em-'+fila);if(em){em.textContent=txt;em.className='ente-monto '+cls;}togEnteEdit(fila);
      Promise.all([api.getFijos(),api.getApartados(),api.getPatrimonio()]).then(([fijos,apData,pat])=>{if(apData&&typeof renderApartados==='function')renderApartados(apData);if(typeof renderEntes==='function')renderEntes(fijos);if(pat&&typeof renderPatrimonio==='function')renderPatrimonio(pat);}).catch(()=>api.getFijos().then(f=>{if(typeof renderEntes==='function')renderEntes(f);}));}
  }).catch(()=>{ico.className='fas fa-check';});
}

// ══════════════════════════════════════════
//  SOS
// ══════════════════════════════════════════
function activarSOS(){
  const btn=document.getElementById('btn-sos');if(btn){btn.disabled=true;btn.textContent='Enviando…';}
  const msg='🚨 Necesito ayuda — enviado desde RAW Entry';
  if(navigator.geolocation){navigator.geolocation.getCurrentPosition(function(pos){_doEnviarSOS(msg,'https://maps.google.com/?q='+pos.coords.latitude+','+pos.coords.longitude,btn);},function(){_doEnviarSOS(msg,'',btn);},{enableHighAccuracy:true,timeout:15000,maximumAge:0});}
  else _doEnviarSOS(msg,'',btn);
}
function _doEnviarSOS(mensaje,ubicacion,btn){
  api.enviarSOS({mensaje,ubicacion}).then(r=>{showToast(r.ok?'🚨 SOS enviado a '+r.enviados+' contacto(s)':'Error: '+r.mensaje,r.ok);if(btn){btn.disabled=false;btn.textContent='🚨 SOS';}}).catch(()=>{showToast('Error al enviar SOS',false);if(btn){btn.disabled=false;btn.textContent='🚨 SOS';}});
}

// Tooltip genérico
function initTooltip(){
  var tip=document.getElementById('gtip');if(!tip)return;
  document.addEventListener('mouseover',function(e){var t=e.target.closest('[data-tip]');if(!t){tip.classList.remove('show');return;}tip.textContent=t.getAttribute('data-tip');var r=t.getBoundingClientRect();tip.style.left=(r.left+r.width/2-tip.offsetWidth/2)+'px';tip.style.top=(r.top-tip.offsetHeight-6+window.scrollY)+'px';tip.classList.add('show');});
  document.addEventListener('mouseout',function(e){if(!e.target.closest('[data-tip]'))tip.classList.remove('show');});
}

/* ── FALLBACKS Activity y Nutrición ── */
document.addEventListener('DOMContentLoaded', function(){

  if(typeof window.renderActivity !== 'function'){
    window.renderActivity = function(){
      var d = window._actData; if(!d) return;
      var WRAP = document.getElementById('act-wrapper') || document.getElementById('board-activity');
      if(!WRAP) return;

      // ── Configuración ──
      var CAT = {
        personal:    { color:'#A855F7', glow:'rgba(168,85,247,0.4)',  icon:'fa-user',      label:'PERSONAL',    dias:['L','M','W','J','V','S','D'] },
        electronics: { color:'#06B6D4', glow:'rgba(6,182,212,0.4)',   icon:'fa-bolt',      label:'ELECTRONICS', dias:['L','M','W','J','V'] },
        libro:       { color:'#22D3EE', glow:'rgba(34,211,238,0.4)',   icon:'fa-book-open', label:'LIBROS' },
        movie:       { color:'#F97316', glow:'rgba(249,115,22,0.4)',   icon:'fa-film',      label:'MOVIES' },
        norut:       { color:'#EC4899', glow:'rgba(236,72,153,0.4)',   icon:'fa-star',      label:'PENDIENTES' },
      };
      var DLBL = {L:'Lun',M:'Mar',W:'Mié',J:'Jue',V:'Vie',S:'Sáb',D:'Dom'};
      var diaKey = ['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];

      // ── Conteos ──
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

      // ── HTML helpers ──
      function chkCircle(fila, dia, checked, tipo){
        var c = CAT[tipo]; var esH=(dia===diaKey);
        // checked puede ser true/false o un objeto {v:true, fecha:'HH:mm'}
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
        return '<div class="_act-item" data-fila="'+fila+'" data-tipo="'+tipo+'"'+
          ' style="width:20px;height:20px;min-width:20px;border-radius:50%;cursor:pointer;transition:all 200ms;flex-shrink:0;'+
          'border:1.5px solid '+(done?c.color:'#26304A')+';'+
          'background:'+(done?c.color:'transparent')+';'+
          'box-shadow:'+(done?'0 0 8px '+c.glow:'none')+';'+
          'display:flex;align-items:center;justify-content:center">'+
          (done?'<i class="fas fa-check" style="font-size:8px;color:#fff;pointer-events:none"></i>':'')+
        '</div>';
      }

      function kpiPill(tipo, done, total){
        var c = CAT[tipo];
        return '<div style="display:flex;align-items:center;gap:8px;padding:0 20px;border-right:1px solid rgba(140,100,220,0.14)">'+
          '<i class="fas '+c.icon+'" style="font-size:16px;color:'+c.color+';filter:drop-shadow(0 0 6px '+c.glow+')"></i>'+
          '<div><div style="font-size:10px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45)">'+c.label+'</div>'+
          '<div style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">'+
            '<span style="color:'+c.color+'">'+done+'</span>'+
            '<span style="color:rgba(200,208,230,0.25)"> / '+total+'</span>'+
          '</div></div>'+
        '</div>';
      }

      // ── HEADER BAR ──
      var header =
        '<div style="display:flex;align-items:center;background:rgba(10,6,22,0.96);border-bottom:1px solid rgba(140,100,220,0.14);'+
             'height:72px;padding:0 20px;gap:0;flex-shrink:0;overflow:hidden">'+
          // Volver
          '<div onclick="_lgrVolver ? _lgrVolver() : (typeof volverAlAnverso===\'function\'&&volverAlAnverso())"'+
               ' style="display:flex;align-items:center;justify-content:center;width:44px;height:44px;'+
               'background:rgba(14,8,28,0.92);border:1px solid rgba(140,100,220,0.18);border-radius:8px;cursor:pointer;'+
               'margin-right:16px;flex-shrink:0;transition:all .15s"'+
               ' onmouseover="this.style.borderColor=\'#3B82F6\'" onmouseout="this.style.borderColor=\'#26304A\'">'+
            '<i class="fas fa-arrow-left" style="color:#22D3EE;font-size:14px"></i>'+
          '</div>'+
          // Título
          '<div style="margin-right:32px;flex-shrink:0">'+
            '<div style="font-size:18px;font-weight:700;letter-spacing:.05em;color:#fff">ACTIVITY CHECK</div>'+
            '<div style="font-size:11px;color:rgba(200,208,230,0.45);margin-top:1px">Tu progreso, tu recompensa</div>'+
          '</div>'+
          // KPIs
          '<div style="display:flex;align-items:center;flex:1;overflow:hidden">'+
            kpiPill('personal',    totales.doneP, totales.personal)+
            kpiPill('electronics', totales.doneE, totales.electronics)+
            kpiPill('libro',       totales.doneL, totales.libro)+
            kpiPill('movie',       totales.doneM, totales.movie)+
            '<div style="display:flex;align-items:center;gap:8px;padding:0 20px">'+
              '<i class="fas fa-star" style="font-size:16px;color:#EC4899;filter:drop-shadow(0 0 6px rgba(236,72,153,0.4))"></i>'+
              '<div><div style="font-size:10px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45)">PENDIENTES</div>'+
              '<div style="font-size:13px;font-weight:600;font-variant-numeric:tabular-nums">'+
                '<span style="color:#EC4899">'+totales.doneN+'</span>'+
                '<span style="color:rgba(200,208,230,0.25)"> / '+totales.norut+'</span>'+
              '</div></div>'+
            '</div>'+
          '</div>'+
          // Anillo progreso
          '<div style="display:flex;align-items:center;gap:14px;flex-shrink:0;padding-left:20px;border-left:1px solid rgba(140,100,220,0.14)">'+
            '<svg width="64" height="64" viewBox="0 0 64 64">'+
              '<circle cx="32" cy="32" r="28" fill="none" stroke="#26304A" stroke-width="4"/>'+
              '<circle cx="32" cy="32" r="28" fill="none" stroke="#3B82F6" stroke-width="4"'+
                ' stroke-dasharray="'+circ.toFixed(1)+'" stroke-dashoffset="'+(circ*(1-pctGeneral/100)).toFixed(1)+'"'+
                ' stroke-linecap="round" transform="rotate(-90 32 32)"'+
                ' style="filter:drop-shadow(0 0 6px rgba(59,130,246,0.6));transition:stroke-dashoffset .8s"/>'+
              '<text x="32" y="37" text-anchor="middle" font-size="14" font-weight="700" fill="#fff" font-family="system-ui">'+pctGeneral+'%</text>'+
            '</svg>'+
            '<div><div style="font-size:9px;font-weight:700;letter-spacing:.10em;color:rgba(200,208,230,0.45);margin-bottom:2px">PROGRESO GENERAL</div>'+
            '<div style="font-size:16px;font-weight:700;font-variant-numeric:tabular-nums">'+
              '<span style="color:#3B82F6">'+doneAll+'</span>'+
              '<span style="color:rgba(200,208,230,0.25)"> / '+totalAll+'</span>'+
            '</div></div>'+
          '</div>'+
        '</div>';

      // ── TABLA HÁBITOS ──
      // ── Estado de filtros por columna ──
      var _actFilter = {};  // {tipo: 'az'|'za'|'hoy_si'|'hoy_no'}

      // ── Filtros bar ──
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
          'display:flex;gap:4px;padding:6px 12px;background:rgba(6,4,14,0.95);border-bottom:1px solid rgba(140,100,220,0.14);align-items:center">'+
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

      function hexToRgb(hex){
        var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
        return r+','+g+','+b;
      }

      // ── Aplicar filtro a lista de hábitos ──
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

      // ── Aplicar filtro a lista de items ──
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
        var h = filterBar(tipo);
        h += '<table style="width:100%;border-collapse:collapse">';
        h += '<tr><th style="text-align:left;padding:6px 16px;font-size:10px;font-weight:600;letter-spacing:.10em;color:rgba(200,208,230,0.45);border-bottom:1px solid rgba(140,100,220,0.14)">HÁBITO</th>';
        dias.forEach(function(d){
          var esH=(d===diaKey);
          h += '<th style="text-align:center;padding:6px 4px;font-size:10px;font-weight:'+(esH?700:600)+';'+
               'color:'+(esH?c.color:'#7A8499')+';border-bottom:1px solid rgba(140,100,220,0.14);min-width:36px;'+
               (esH?'text-shadow:0 0 8px '+c.glow:'')+'">'+(DLBL[d]||d)+'</th>';
        });
        h += '</tr>';
        sorted.forEach(function(hab){
          var allDone = dias.every(function(dia){ return hab.checks&&hab.checks[dia]; });
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
          h += '</tr>';
        });
        h += '</table>';
        return h;
      }

      // ── LISTA ITEMS ──
      function itemList(items, tipo){
        if(!items||!items.length) return '<div style="padding:24px;text-align:center;color:rgba(200,208,230,0.25);font-size:12px">Sin registros</div>';
        var sorted = applyItemFilter(items, tipo);
        return filterBar(tipo)+
          '<div style="display:flex;flex-direction:column;width:100%">'+
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
        '<div style="width:260px;flex-shrink:0;display:flex;flex-direction:column;gap:12px;padding:16px">'+
          // Recompensa
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
          // Categorías
          '<div style="background:rgba(14,8,28,0.92);border:1px solid rgba(140,100,220,0.18);border-radius:12px;padding:16px;'+
               'box-shadow:0 0 0 1px rgba(120,160,255,0.04),0 4px 24px rgba(0,0,0,0.4)">'+
            '<div style="font-size:10px;font-weight:700;letter-spacing:.12em;color:rgba(200,208,230,0.45);margin-bottom:14px">CATEGORÍAS</div>'+
            sidebarBar('personal',    totales.doneP, totales.personal)+
            sidebarBar('electronics', totales.doneE, totales.electronics)+
            sidebarBar('libro',       totales.doneL, totales.libro)+
            sidebarBar('movie',       totales.doneM, totales.movie)+
            sidebarBar('norut',       totales.doneN, totales.norut)+
          '</div>'+
          // Sigue así
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

      // ── PANEL WRAPPER ──
      // Ancho por tipo: hábitos necesitan espacio para checks, listas para texto
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
        return '<div data-panel-tipo="'+tipo+'" style="'+wStyle+';background:rgba(14,8,28,0.92);border:1px solid rgba(140,100,220,0.18);border-radius:12px;'+
               'display:flex;flex-direction:column;overflow:hidden;'+
               'box-shadow:0 0 0 1px rgba(120,160,255,0.04),0 4px 24px rgba(0,0,0,0.4)">'+
          '<div style="padding:14px 16px 12px;border-bottom:1px solid rgba(140,100,220,0.14);display:flex;align-items:center;gap:8px">'+
            '<i class="fas '+c.icon+'" style="font-size:14px;color:'+c.color+';filter:drop-shadow(0 0 6px '+c.glow+')"></i>'+
            '<span style="font-size:13px;font-weight:700;letter-spacing:.08em;color:'+c.color+'">'+c.label+'</span>'+
          '</div>'+
          '<div data-panel-inner style="flex:1;overflow-y:auto">'+inner+'</div>'+
        '</div>';
      }

      // ── FOOTER BAR ──
      var xpActual = (window._lgr&&window._lgr.xpActual)||0;
      var xpMax    = (window._lgr&&window._lgr.xpNivel)||500;
      var nivel    = (window._lgr&&window._lgr.nivel)||1;
      var xpPct    = xpMax>0?Math.round(xpActual/xpMax*100):0;

      var footer =
        '<div style="display:flex;align-items:center;background:rgba(10,6,22,0.96);border-top:1px solid rgba(140,100,220,0.14);'+
             'height:64px;padding:0;flex-shrink:0">'+
          // Nivel + XP
          '<div style="display:flex;align-items:center;gap:12px;flex:1;padding:0 24px;border-right:1px solid rgba(140,100,220,0.14)">'+
            '<div style="width:36px;height:36px;border-radius:8px;background:rgba(6,4,14,0.95);border:1px solid rgba(140,100,220,0.18);'+
                 'display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
              '<span style="font-size:13px;font-weight:800;color:#A78BFA">'+nivel+'</span>'+
            '</div>'+
            '<div style="flex:1">'+
              '<div style="font-size:11px;font-weight:700;color:#fff;margin-bottom:3px">NIVEL '+nivel+
                ' <span style="font-size:10px;color:rgba(200,208,230,0.45);font-weight:500;font-variant-numeric:tabular-nums">'+xpActual+' / '+xpMax+' XP</span></div>'+
              '<div style="height:4px;background:rgba(6,4,14,0.95);border-radius:2px;overflow:hidden">'+
                '<div style="height:100%;width:'+xpPct+'%;background:linear-gradient(90deg,#7C3AED,#A855F7);border-radius:2px;box-shadow:0 0 6px rgba(59,130,246,0.5)"></div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          // Racha
          '<div style="display:flex;align-items:center;gap:10px;flex:1;padding:0 24px;border-right:1px solid rgba(140,100,220,0.14)">'+
            '<i class="fas fa-fire" style="font-size:20px;color:#FB923C;filter:drop-shadow(0 0 8px rgba(251,146,60,0.6))"></i>'+
            '<div><div style="font-size:10px;font-weight:600;letter-spacing:.08em;color:rgba(200,208,230,0.45)">RACHA ACTUAL</div>'+
            '<div style="font-size:16px;font-weight:700;color:#FB923C">'+doneAll+' actividades</div></div>'+
          '</div>'+
          // Misión diaria
          '<div style="display:flex;align-items:center;gap:10px;flex:1;padding:0 24px;border-right:1px solid rgba(140,100,220,0.14)">'+
            '<i class="fas fa-bullseye" style="font-size:16px;color:#A855F7"></i>'+
            '<div><div style="font-size:10px;font-weight:600;letter-spacing:.08em;color:rgba(200,208,230,0.45)">PROGRESO HOY</div>'+
            '<div style="font-size:13px;font-weight:600;color:#fff;margin-top:1px">'+
              doneAll+' / '+totalAll+' <span style="color:#A855F7;font-size:11px;font-weight:700">+50 XP</span>'+
            '</div></div>'+
          '</div>'+
          // Próximo nivel
          '<div style="display:flex;align-items:center;gap:10px;flex:1;padding:0 24px">'+
            '<div style="width:36px;height:36px;border-radius:8px;background:rgba(168,85,247,0.1);border:1px solid rgba(168,85,247,0.3);'+
                 'display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
              '<span style="font-size:13px;font-weight:800;color:#A855F7">'+(nivel+1)+'</span>'+
            '</div>'+
            '<div><div style="font-size:10px;font-weight:600;letter-spacing:.08em;color:rgba(200,208,230,0.45)">PRÓXIMO NIVEL</div>'+
            '<div style="font-size:12px;font-weight:600;color:rgba(220,220,240,0.85);margin-top:1px">'+
              '<span style="color:#A855F7">+500 XP</span> <span style="color:rgba(200,208,230,0.25)">|</span> <span style="color:#22D3EE">+$250</span>'+
            '</div></div>'+
            '<i class="fas fa-box" style="font-size:18px;color:rgba(200,208,230,0.45);margin-left:auto"></i>'+
          '</div>'+
        '</div>';

      // ── RENDER COMPLETO ──
      // Buscar el contenedor correcto
      var board = document.getElementById('board-activity');
      if(!board) return;
      board.style.display = 'flex';
      board.style.flexDirection = 'column';
      board.style.background = 'rgba(4,4,14,0.97)';
      board.style.overflow = 'hidden';

      board.innerHTML =
        header +
        '<div style="display:flex;gap:12px;padding:12px;flex:1;overflow:hidden;min-height:0;align-items:stretch">'+
          '<div style="display:flex;gap:10px;flex:1;overflow-x:auto;overflow-y:hidden;min-width:0;padding-bottom:6px;align-items:stretch;width:100%">'+
            panelCol('personal',    habTable(d.habitosPersonal||[],    'personal'))+
            panelCol('electronics', habTable(d.habitosElectronics||[], 'electronics'))+
            panelCol('libro',       itemList(d.libros||[],   'libro'))+
            panelCol('movie',       itemList(d.movies||[],   'movie'))+
            panelCol('norut',       itemList(d.noRutinarias||[],'norut'))+
          '</div>'+
          sidebar+
        '</div>'+
        footer;

      // ── Event delegation ──
      board.addEventListener('click', function(e){

        // Botón de filtro
        var fb = e.target.closest('._act-filter-btn');
        if(fb){
          var tipo = fb.dataset.tipo;
          var filt = fb.dataset.filter;
          _actFilter[tipo] = filt;
          // Re-renderizar solo el panel afectado
          var d2 = window._actData;
          if(!d2) return;
          var panelEl = fb.closest('[data-panel-tipo]');
          if(panelEl){
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

        // Check día (hábitos)
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
          // Highlight fila si todos marcados
          var row = c.closest('tr');
          if(row){
            var allChks = row.querySelectorAll('._act-chk');
            var allDone = Array.prototype.every.call(allChks, function(ch){ return !!ch.querySelector('.fa-check'); });
            var td = row.querySelector('td:first-child div:last-child');
            if(td) td.style.color = allDone?cat.color:'#C8D0E0';
            if(td) td.style.textShadow = allDone?'0 0 8px '+cat.glow:'none';
          }
          if(typeof api!=='undefined') api.setActivityCheck(tipo, parseInt(c.dataset.fila), c.dataset.dia, nowChk);
          return;
        }
        // Check item (lista)
        var it = e.target.closest('._act-item');
        if(it){
          var ok = !!it.querySelector('.fa-check');
          var nowDone = !ok;
          var tipo = it.dataset.tipo;
          var cat  = CAT[tipo];
          it.style.borderColor = nowDone?cat.color:'#26304A';
          it.style.background  = nowDone?cat.color:'transparent';
          it.style.boxShadow   = nowDone?'0 0 8px '+cat.glow:'none';
          it.innerHTML = nowDone?'<i class="fas fa-check" style="font-size:8px;color:#fff;pointer-events:none"></i>':'';
          var row = it.parentElement;
          var sp  = row&&row.querySelector('span');
          if(sp) sp.style.color = nowDone?'#4A5266':'#C8D0E0';
          // Mover al fondo si completa, arriba si desmarca
          if(row&&row.parentElement){
            if(nowDone) row.parentElement.appendChild(row);
            else        row.parentElement.insertBefore(row, row.parentElement.firstChild);
          }
          if(typeof api!=='undefined') api.setActivityCheck(tipo, parseInt(it.dataset.fila), null, nowDone);
        }
      });
    };
  }

  if(typeof window.renderNutricion !== 'function'){
    window.renderNutricion = function(data){
      var body=document.getElementById('nut-panel-body'); if(!body) return;
      if(!data||!data.ok){body.innerHTML='<div style="padding:40px;text-align:center;color:rgba(200,208,230,0.25);font-size:13px">Sin registros</div>';return;}
      var dias=data.semana||Object.values(data.dias||{});
      if(!dias.length){body.innerHTML='<div style="padding:40px;text-align:center;color:rgba(200,208,230,0.25);font-size:13px">Sin registros</div>';return;}
      var html='<div style="padding:0 20px 24px;display:flex;flex-direction:column;gap:12px">';
      dias.forEach(function(dia){
        if(!dia.items||!dia.items.length) return;
        html+='<div><div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(200,208,230,0.45);margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid rgba(140,100,220,0.14)">'+dia.fecha+'</div>';
        dia.items.forEach(function(it){
          html+='<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid rgba(140,100,220,0.14)">'+
            '<span style="font-size:10px;font-weight:600;padding:2px 7px;border:1px solid rgba(140,100,220,0.18);color:rgba(200,208,230,0.45);text-transform:uppercase;letter-spacing:.06em;flex-shrink:0;border-radius:4px">'+(it.momento||'—')+'</span>'+
            '<span style="flex:1;font-size:13px;color:rgba(220,220,240,0.85)">'+(it.alimento||it.comida||'—')+'</span>'+
            (it.cal?'<span style="font-size:11px;font-weight:700;color:#F97316;flex-shrink:0">'+Math.round(it.cal)+' kcal</span>':'')+
          '</div>';
        });
        html+='</div>';
      });
      html+='</div>';
      body.innerHTML=html;
    };
  }

});  window._refrescarEspejos = function(datos){
    function fmt(v){
      if(v===null||v===undefined||v==='') return '—';
      var n=Number(v); if(isNaN(n)) return String(v);
      return '$ '+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:0});
    }
    function fmt2(v){ if(v===null||v===undefined||v==='') return '—'; var n=Number(v); if(isNaN(n)) return '—'; return '$ '+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); }
    function set(id,v){ var e=document.getElementById(id); if(e&&v!==undefined&&v!==null) e.textContent=v; }
    function setW(id,pct){ var e=document.getElementById(id); if(e){ e.style.width=Math.min(100,Math.max(0,parseFloat(pct)||0))+'%'; } }

    var d = datos || window._hudDatos || {};

    // ── Patrimonio ──
    var sv = document.getElementById('saldo-val');
    if(sv && sv.textContent && sv.textContent.replace(/[—\s]/,'')) set('_hud-saldo', sv.textContent.trim());

    var fijos = window._fijosData || [];
    var maxMonto = fijos.reduce(function(m,f){ return f.nombre!=='P'?Math.max(m,Math.abs(f.monto||0)):m; },1);
    var bbvaSet=false, beatsSet=false;
    fijos.forEach(function(fi){
      if(fi.nombre==='P') return;
      var nl = (fi.nombre||'').toLowerCase();
      if(!bbvaSet && (nl.indexOf('bbva')>=0||nl.indexOf('banco')>=0)){
        set('_hud-bbva', fmt2(fi.monto));
        setW('_hud-bbva-bar', Math.abs(fi.monto||0)/maxMonto*100);
        bbvaSet=true;
      } else if(!beatsSet && (nl.indexOf('beats')>=0||nl.indexOf('nu')>=0||nl.indexOf('hey')>=0||nl.indexOf('spin')>=0)){
        set('_hud-beats', fmt2(fi.monto));
        setW('_hud-beats-bar', Math.abs(fi.monto||0)/maxMonto*100);
        beatsSet=true;
      } else if(nl.indexOf('efectivo')>=0||nl.indexOf('cash')>=0||nl.indexOf('billetera')>=0){
        set('_hud-efec', fmt2(fi.monto));
      }
    });
    // Fallback: primeros 2 bancos si no se encontraron por nombre
    var bancos = fijos.filter(function(f){ return f.nombre!=='P'; });
    if(!bbvaSet && bancos[0]){ set('_hud-bbva', fmt2(bancos[0].monto)); setW('_hud-bbva-bar', Math.abs(bancos[0].monto||0)/maxMonto*100); }
    if(!beatsSet && bancos[1]){ set('_hud-beats', fmt2(bancos[1].monto)); setW('_hud-beats-bar', Math.abs(bancos[1].monto||0)/maxMonto*100); }

    var totalAp = (window._apartadosData||[]).reduce(function(s,a){
      return a.estado&&a.estado.toLowerCase()==='usado'?s:s+(a.monto||0);
    },0);
    set('_hud-apart', fmt(d.totalApartado || totalAp));

    // Fondo emergencia desde patrimonio
    if(window._patrimonioData && window._patrimonioData.fondo){
      var fondo = window._patrimonioData.fondo;
      set('_hud-fondo-pct', (fondo.avance||0)+'%');
      setW('_hud-fondo-bar', fondo.avance||0);
    }

    // ── Financiero ──
    var finD = window._finData;
    if(finD && finD.mes){
      set('_hud-fin-exc', fmt(finD.mes.excedente));
      set('_hud-fin-ing', fmt(finD.mes.ingresos));
      set('_hud-fin-egr', fmt(finD.mes.egresos));
      var aho = finD.metricas && finD.metricas.porcentajeAhorro;
      set('_hud-fin-aho', aho!=null ? Math.round(aho)+'%' : '—');
      setW('_hud-aho-bar', Math.min(100,Math.max(0,aho||0)));
      var run = finD.metricas && finD.metricas.runwayDias;
      set('_hud-runway', run!=null ? run+' días' : '—');
      var gd = finD.metricas && finD.metricas.gastoPorDiaPromedio;
      set('_hud-gastoDia', gd ? fmt(gd) : '—');
    }

    // ── Necesidades ──
    var nec = d.necesidades || {};
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
    // Racha
    var rv = document.querySelector('#_hud-racha');
    if(rv && rv.textContent==='—') set('_hud-racha', '—');

    // ── Bitácora — contar desde datos si DOM vacío ──
    if(window._pensamientosData && window._pensamientosData.items){
      set('_hud-pens', window._pensamientosData.items.length+' pensamientos');
    } else {
      var pEl = document.querySelectorAll('#pensamientos-body > div');
      if(pEl.length) set('_hud-pens', pEl.length+' registros');
    }
    if(window._relacionesData && window._relacionesData.items){
      set('_hud-rels', window._relacionesData.items.length+' personas');
    }
    var salEl = document.querySelectorAll('#salud-body .salud-item');
    if(salEl.length) set('_hud-sal', salEl.length+' registros');
    var entEl = document.querySelectorAll('#entrenamiento-body > div');
    if(entEl.length) set('_hud-ent', entEl.length+' sesiones');
  };
