/* RAW Entry — Mobile v.9.5 (constructor móvil + fix render-block)
   ═══════════════════════════════════════════════════════════════════
   Solo corre en html.mob. Construye la tab bar inferior y la hoja
   "Más", y controla qué board-face está visible (.mob-activa).
   REUTILIZA la navegación y los renders existentes (irAActivity,
   irABitacora, etc.) — cero lógica duplicada: los boards son los
   mismos que en desktop, aquí solo cambia el marco.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(!document.documentElement.classList.contains('mob')) return;

  /* Mapa de secciones: id del board + acceso existente + icono/acento.
     Los 5 de la tabbar = lo más usado; el resto vive en la hoja "Más". */
  var SEC = {
    home:      { board:'board-anverso',   ir:function(){ if(typeof volverAlAnverso==='function') volverAlAnverso(); }, ico:'fa-house',              acc:'#94A3B8', label:'Home' },
    bitacora:  { board:'board-bitacora',  ir:function(){ if(typeof irABitacora==='function') irABitacora(); },         ico:'fa-book-open',           acc:'#C4B5FD', label:'Bitácora' },
    raw:       { board:'board-sheets',    ir:function(){ if(typeof irASheets==='function') irASheets('raw'); },        ico:'fa-plus',                acc:'#A78BFA', label:'Entrada' },
    activity:  { board:'board-activity',  ir:function(){ if(typeof irAActivity==='function') irAActivity(); },         ico:'fa-bolt',                acc:'#FB923C', label:'Activity' },
    mas:       { board:null,              ir:null,                                                                     ico:'fa-ellipsis',            acc:'#A5B4FC', label:'Más' },
    /* En la hoja: */
    logros:    { board:'board-logros',    ir:function(){ if(typeof irALogros==='function') irALogros(); },             ico:'fa-trophy',              acc:'#FACC15', label:'Logros' },
    nutricion: { board:'board-nutricion', ir:function(){ if(typeof irANutricion==='function') irANutricion(); },       ico:'fa-utensils',            acc:'#4ADE80', label:'Nutrición' },
    notas:     { board:'board-notas',     ir:function(){ if(typeof irANotas==='function') irANotas(); },               ico:'fa-note-sticky',         acc:'#FEF3A0', label:'Notas' },
    timers:    { board:'board-timers',    ir:function(){ if(typeof irATimers==='function') irATimers(); },             ico:'fa-hourglass-half',      acc:'#67E8F9', label:'Timers' },
    sos:       { board:'board-sos',       ir:function(){ if(typeof irASOS==='function') irASOS(); },                   ico:'fa-circle-exclamation',  acc:'#EF4444', label:'SOS' },
    sheet:     { board:null,              ir:function(){ window.open('https://docs.google.com/spreadsheets/d/15T14Hb7tvmv24ZAaC3su1NRtDwVS6-dWbJGxQYUGP1o/edit','_blank'); }, ico:'fa-table-cells', acc:'#4ADE80', label:'Sheet' }
  };
  var TABBAR = ['home','bitacora','raw','activity','mas'];
  var HOJA   = ['logros','nutricion','notas','timers','sos','sheet'];

  var _tabs = {}, _sheetOv = null, _sheetEl = null;

  /* ── Mostrar una sección: navegar con la función existente y marcar
        la cara activa (nuestro CSS solo muestra .mob-activa). ─────── */
  function mostrar(clave){
    var s = SEC[clave]; if(!s) return;
    if(clave === 'mas'){ _abrirHoja(); return; }
    _cerrarHoja();
    if(s.ir) s.ir();                          // dispara el render existente
    // marcar la cara (con un respiro: algunas ir* montan async)
    setTimeout(function(){ _marcarCara(s.board); _marcarTab(clave); }, 30);
  }
  function _marcarCara(boardId){
    document.querySelectorAll('.board-face.mob-activa')
      .forEach(function(b){ b.classList.remove('mob-activa'); });
    var b = boardId && document.getElementById(boardId);
    if(b){ b.classList.add('mob-activa'); b.scrollTop = 0; }
  }
  function _marcarTab(clave){
    Object.keys(_tabs).forEach(function(k){
      var on = (k === clave) || (k === 'mas' && HOJA.indexOf(clave) >= 0);
      _tabs[k].classList.toggle('on', on);
    });
  }

  /* ── Construcción de la tab bar ───────────────────────────────── */
  function _construirTabbar(){
    var bar = document.createElement('nav');
    bar.className = 'mob-tabbar';
    TABBAR.forEach(function(k){
      var s = SEC[k];
      var b = document.createElement('button');
      b.className = 'mob-tab' + (k === 'raw' ? ' mob-tab-raw' : '');
      b.style.setProperty('--t-acc', s.acc);
      b.innerHTML = (k === 'raw')
        ? '<span class="mob-fab"><i class="fas '+s.ico+'"></i></span><span>'+s.label+'</span>'
        : '<i class="fas '+s.ico+'"></i><span>'+s.label+'</span>';
      b.addEventListener('click', function(){ mostrar(k); });
      bar.appendChild(b);
      _tabs[k] = b;
    });
    document.body.appendChild(bar);
  }

  /* ── Hoja "Más" ───────────────────────────────────────────────── */
  function _construirHoja(){
    _sheetOv = document.createElement('div');
    _sheetOv.className = 'mob-sheet-ov';
    _sheetOv.addEventListener('click', _cerrarHoja);
    _sheetEl = document.createElement('div');
    _sheetEl.className = 'mob-sheet';
    var grid = '<div class="mob-sheet-grip"></div><div class="mob-sheet-grid">';
    HOJA.forEach(function(k){
      var s = SEC[k];
      grid += '<button class="mob-sheet-item" data-sec="'+k+'" style="--i-acc:'+s.acc+'">'+
              '<i class="fas '+s.ico+'"></i><span>'+s.label+'</span></button>';
    });
    grid += '</div>';
    _sheetEl.innerHTML = grid;
    _sheetEl.addEventListener('click', function(e){
      var it = e.target.closest('.mob-sheet-item');
      if(it) mostrar(it.getAttribute('data-sec'));
    });
    document.body.appendChild(_sheetOv);
    document.body.appendChild(_sheetEl);
  }
  function _abrirHoja(){ _sheetOv.classList.add('show'); _sheetEl.classList.add('show'); }
  function _cerrarHoja(){ _sheetOv.classList.remove('show'); _sheetEl.classList.remove('show'); }

  function init(){
    // CRÍTICO: el render-block (que oculta el body al arrancar) lo
    // neutraliza raw-loading… que en móvil NO corre (return temprano).
    // Sin esto, el body quedaría invisible para siempre en móvil.
    var rb = document.getElementById('render-block');
    if(rb){ rb.textContent = 'html,body{background:#07060F !important;}'; }
    var sp = document.getElementById('splash-dial');
    if(sp && sp.parentNode) sp.parentNode.removeChild(sp);
    document.documentElement.classList.add('hud-listo');

    _construirTabbar();
    _construirHoja();
    mostrar('home');
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
