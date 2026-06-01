/* RAW Entry — Notas (grafo de nodos) v.7.020
   ╔══════════════════════════════════════════════════════════════════╗
   ║ NOTAS — GRAFO DE NODOS  (v7 FASE 3)                              ║
   ╚══════════════════════════════════════════════════════════════════╝
   v7 jubila la cuadrícula fija de 5×5. Las notas pasan a ser NODOS
   arrastrables libres en un lienzo, conectados por líneas. Es el primer
   paso de la "capa cognitiva": un mapa de cómo se conectan tus ideas.

   Cada nota/nodo:
     · id, titulo, cuerpo, color   (igual que v6)
     · x, y                        posición libre en el lienzo
     · conexiones                  lista de IDs de otros nodos

   CREAR UN ENLACE (Opción A — arrastrar la línea):
     Cada nodo tiene un punto-conector en su borde. Arrastras desde ese
     punto, se dibuja una línea elástica, y al soltar sobre otro nodo el
     enlace queda hecho. Soltar fuera de un nodo cancela.

   Persistencia: hoja NOTAS del Sheet (9 columnas) vía getNotas/
   guardarNota/actualizarNota/borrarNota. Respaldo en localStorage.

   Estructura DOM:
     #board-notas
       .notas-header           título + botón "Nueva nota"
       .grafo-wrap             el lienzo
         svg.grafo-lineas      las líneas de conexión (capa de abajo)
         .grafo-nodo           un div por nota (capa de arriba)
*/
(function(){
  'use strict';

  var LS_KEY = 'lifeos_notas_v2';     // v2 = formato grafo

  // Paleta post-it — id → {bg, borde, texto}
  var COLORES = [
    { id:'amarillo', bg:'#FEF3A0', bd:'#E8D86A', tx:'#4A3F12' },
    { id:'rosa',     bg:'#FBC8D8', bd:'#E89BB4', tx:'#4A1F2E' },
    { id:'verde',    bg:'#C3EFB8', bd:'#92D584', tx:'#1F3F18' },
    { id:'azul',     bg:'#B8DDF5', bd:'#85BBE0', tx:'#163040' },
    { id:'naranja',  bg:'#FCD9A8', bd:'#E8B877', tx:'#4A3015' },
    { id:'violeta',  bg:'#D9C8F5', bd:'#B49BE0', tx:'#2E1F4A' }
  ];
  function colorDe(id){
    for(var i=0;i<COLORES.length;i++){ if(COLORES[i].id===id) return COLORES[i]; }
    return COLORES[0];
  }

  var NODO_W = 168, NODO_H = 116;     // tamaño de un nodo
  var SVG_NS = 'http://www.w3.org/2000/svg';

  // Estado: lista de notas. nota = {id,titulo,cuerpo,color,x,y,conexiones}
  var _notas   = [];
  var _cargado = false;

  /* ── Persistencia ────────────────────────────────────────────────── */
  function _guardarLocal(){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(_notas)); }catch(e){}
  }
  function _leerLocal(){
    try{
      var raw = localStorage.getItem(LS_KEY);
      if(!raw) return null;
      var arr = JSON.parse(raw);
      if(Array.isArray(arr)) return arr;
    }catch(e){}
    return null;
  }

  // Normaliza una nota que viene del backend o de localStorage.
  function _normaliza(n, i){
    return {
      id:     n.id || ('n_'+Date.now()+'_'+i),
      titulo: n.titulo || '',
      cuerpo: n.cuerpo || '',
      color:  n.color  || 'amarillo',
      x: (typeof n.x === 'number' && !isNaN(n.x)) ? n.x : null,
      y: (typeof n.y === 'number' && !isNaN(n.y)) ? n.y : null,
      conexiones: Array.isArray(n.conexiones) ? n.conexiones.slice() : []
    };
  }

  // A las notas sin posición (vienen de la v6 con slot) se les da una:
  // un acomodo en rejilla suelta para que no nazcan todas encimadas.
  function _ubicarSinPosicion(){
    var col = 0, fil = 0;
    var MARGEN = 40, GX = NODO_W + 56, GY = NODO_H + 48;
    _notas.forEach(function(n){
      if(n.x == null || n.y == null){
        n.x = MARGEN + col * GX;
        n.y = MARGEN + fil * GY;
        col++;
        if(col >= 4){ col = 0; fil++; }
      }
    });
  }

  // Carga inicial: backend → si falla, localStorage.
  function cargarNotas(){
    if(typeof api!=='undefined' && typeof api.getNotas==='function'){
      api.getNotas().then(function(r){
        var lista = (r && r.notas) ? r.notas : [];
        _notas = lista.map(_normaliza);
        _ubicarSinPosicion();
        _cargado = true;
        _guardarLocal();
        render();
      }).catch(function(){
        var local = _leerLocal();
        if(local) _notas = local.map(_normaliza);
        _ubicarSinPosicion();
        _cargado = true;
        render();
      });
    } else {
      var local = _leerLocal();
      if(local) _notas = local.map(_normaliza);
      _ubicarSinPosicion();
      _cargado = true;
      render();
    }
  }

  /* ── Buscar nota por id ──────────────────────────────────────────── */
  function notaDe(id){
    for(var i=0;i<_notas.length;i++){ if(_notas[i].id===id) return _notas[i]; }
    return null;
  }

  /* ── Operaciones ─────────────────────────────────────────────────── */
  function nuevaNota(){
    // Nace cerca del centro del lienzo visible, con un pequeño desorden
    // para que dos notas seguidas no caigan exactamente en el mismo sitio.
    var wrap = document.querySelector('.grafo-wrap');
    var cx = wrap ? wrap.scrollLeft + wrap.clientWidth/2  - NODO_W/2 : 120;
    var cy = wrap ? wrap.scrollTop  + wrap.clientHeight/2 - NODO_H/2 : 120;
    var jitter = function(){ return (Math.random()-0.5)*120; };
    var nota = {
      id: 'n_'+Date.now()+'_'+Math.floor(Math.random()*1000),
      titulo:'', cuerpo:'', color:'amarillo',
      x: Math.max(10, cx + jitter()),
      y: Math.max(10, cy + jitter()),
      conexiones: []
    };
    _notas.push(nota);
    _cargado = true;
    _guardarLocal();
    render();
    if(typeof api!=='undefined' && typeof api.guardarNota==='function'){
      api.guardarNota(nota).catch(function(){});
    }
    abrirEditor(nota.id);
  }

  // Persiste una nota (posición, texto, color, conexiones).
  function persistir(nota){
    _guardarLocal();
    if(typeof api!=='undefined' && typeof api.actualizarNota==='function'){
      api.actualizarNota(nota).catch(function(){});
    }
  }

  function borrarNota(id){
    var idx = -1;
    for(var i=0;i<_notas.length;i++){ if(_notas[i].id===id){ idx=i; break; } }
    if(idx<0) return;
    _notas.splice(idx,1);
    // Quitar este id de las conexiones de las demás notas.
    _notas.forEach(function(n){
      var p = n.conexiones.indexOf(id);
      if(p>=0){ n.conexiones.splice(p,1); persistir(n); }
    });
    _guardarLocal();
    render();
    if(typeof api!=='undefined' && typeof api.borrarNota==='function'){
      api.borrarNota(id).catch(function(){});
    }
  }

  // Crea (o quita, si ya existía) un enlace entre dos notas.
  function conectar(idA, idB){
    if(idA===idB) return;
    var a = notaDe(idA), b = notaDe(idB);
    if(!a || !b) return;
    var p = a.conexiones.indexOf(idB);
    if(p>=0){
      // Ya estaban conectadas → el gesto las desconecta (toggle).
      a.conexiones.splice(p,1);
    } else {
      a.conexiones.push(idB);
    }
    persistir(a);
    render();
  }

  /* ── Toast ───────────────────────────────────────────────────────── */
  function _toast(msg){
    if(typeof window.showToast==='function'){ window.showToast(msg,false); return; }
    console.warn('[Notas]', msg);
  }

  /* ── Escape de HTML ──────────────────────────────────────────────── */
  function _esc(s){
    return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Editor de nota (modal) ──────────────────────────────────────── */
  function abrirEditor(id){
    var n = notaDe(id);
    if(!n) return;

    var ov = document.createElement('div');
    ov.className = 'nota-editor-ov';

    var col = colorDe(n.color);
    var card = document.createElement('div');
    card.className = 'nota-editor';
    card.style.setProperty('background', col.bg, 'important');
    card.style.setProperty('border-color', col.bd, 'important');
    card.style.setProperty('color', col.tx, 'important');

    var swatches = COLORES.map(function(c){
      return '<button class="nota-sw'+(c.id===n.color?' sel':'')+'" '+
             'data-color="'+c.id+'" style="background:'+c.bg+';border-color:'+c.bd+'"></button>';
    }).join('');

    card.innerHTML =
      '<input class="nota-ed-titulo" type="text" maxlength="60" placeholder="Título" '+
        'value="'+_esc(n.titulo)+'" style="color:'+col.tx+'">'+
      '<textarea class="nota-ed-cuerpo" maxlength="600" placeholder="Escribe tu nota…" '+
        'style="color:'+col.tx+'">'+_esc(n.cuerpo)+'</textarea>'+
      '<div class="nota-ed-colores">'+swatches+'</div>'+
      '<div class="nota-ed-acciones">'+
        '<button class="nota-ed-borrar">Borrar</button>'+
        '<button class="nota-ed-ok">Listo</button>'+
      '</div>';

    ov.appendChild(card);
    document.body.appendChild(ov);

    var inTitulo = card.querySelector('.nota-ed-titulo');
    var inCuerpo = card.querySelector('.nota-ed-cuerpo');

    function cerrar(){
      n.titulo = inTitulo.value.trim();
      n.cuerpo = inCuerpo.value.trim();
      persistir(n);
      render();
      if(ov.parentNode) ov.parentNode.removeChild(ov);
    }

    card.querySelectorAll('.nota-sw').forEach(function(sw){
      sw.addEventListener('click', function(){
        n.color = sw.getAttribute('data-color');
        var c = colorDe(n.color);
        card.style.setProperty('background', c.bg, 'important');
        card.style.setProperty('border-color', c.bd, 'important');
        card.style.setProperty('color', c.tx, 'important');
        inTitulo.style.setProperty('color', c.tx, 'important');
        inCuerpo.style.setProperty('color', c.tx, 'important');
        card.querySelectorAll('.nota-sw').forEach(function(s){
          s.classList.toggle('sel', s===sw);
        });
      });
    });

    card.querySelector('.nota-ed-ok').addEventListener('click', cerrar);
    card.querySelector('.nota-ed-borrar').addEventListener('click', function(){
      if(ov.parentNode) ov.parentNode.removeChild(ov);
      borrarNota(id);
    });
    ov.addEventListener('click', function(e){ if(e.target===ov) cerrar(); });

    setTimeout(function(){ inTitulo.focus(); }, 50);
  }

  /* ── Render del grafo ────────────────────────────────────────────── */
  var _svg = null, _capaNodos = null;

  function render(){
    var wrap = document.querySelector('.grafo-wrap');
    if(!wrap) return;

    // Recrear las dos capas: SVG (líneas) abajo, nodos arriba.
    wrap.innerHTML =
      '<svg class="grafo-lineas" xmlns="'+SVG_NS+'"></svg>'+
      '<div class="grafo-nodos"></div>';
    _svg       = wrap.querySelector('.grafo-lineas');
    _capaNodos = wrap.querySelector('.grafo-nodos');

    // Tamaño del lienzo: cubre todas las notas + margen, mínimo el wrap.
    var maxX = wrap.clientWidth, maxY = wrap.clientHeight;
    _notas.forEach(function(n){
      maxX = Math.max(maxX, (n.x||0) + NODO_W + 80);
      maxY = Math.max(maxY, (n.y||0) + NODO_H + 80);
    });
    _capaNodos.style.width = _svg.style.width = maxX + 'px';
    _capaNodos.style.height = _svg.style.height = maxY + 'px';
    _svg.setAttribute('width', maxX);
    _svg.setAttribute('height', maxY);

    dibujarLineas();

    // Nodos
    _notas.forEach(function(n){
      _capaNodos.appendChild(crearNodo(n));
    });

    _enlazarEventosGlobales();
  }

  // Dibuja una línea por cada conexión entre nodos.
  function dibujarLineas(){
    if(!_svg) return;
    while(_svg.firstChild) _svg.removeChild(_svg.firstChild);
    _notas.forEach(function(a){
      a.conexiones.forEach(function(idB){
        var b = notaDe(idB);
        if(!b) return;
        var x1 = (a.x||0) + NODO_W/2, y1 = (a.y||0) + NODO_H/2;
        var x2 = (b.x||0) + NODO_W/2, y2 = (b.y||0) + NODO_H/2;
        var ln = document.createElementNS(SVG_NS,'line');
        ln.setAttribute('x1',x1); ln.setAttribute('y1',y1);
        ln.setAttribute('x2',x2); ln.setAttribute('y2',y2);
        ln.setAttribute('class','grafo-linea');
        _svg.appendChild(ln);
      });
    });
  }

  // Crea el elemento DOM de un nodo.
  function crearNodo(n){
    var col = colorDe(n.color);
    var nodo = document.createElement('div');
    nodo.className = 'grafo-nodo';
    nodo.setAttribute('data-id', n.id);
    nodo.style.left = (n.x||0) + 'px';
    nodo.style.top  = (n.y||0) + 'px';
    nodo.style.width  = NODO_W + 'px';
    nodo.style.height = NODO_H + 'px';
    nodo.style.setProperty('background', col.bg, 'important');
    nodo.style.setProperty('border-color', col.bd, 'important');
    nodo.style.setProperty('color', col.tx, 'important');

    var cuerpoHTML = n.cuerpo
      ? _esc(n.cuerpo)
      : '<span class="nota-vacia-txt">(nota vacía)</span>';
    nodo.innerHTML =
      (n.titulo ? '<div class="nota-titulo">'+_esc(n.titulo)+'</div>' : '')+
      '<div class="nota-cuerpo">'+cuerpoHTML+'</div>'+
      '<div class="grafo-conector" title="Arrastra para conectar"></div>';

    _enlazarNodo(nodo, n);
    return nodo;
  }

  /* ── Interacción: arrastrar nodo + crear enlaces ─────────────────── */
  var _drag = null;   // arrastre de un nodo
  var _link = null;   // creación de un enlace

  function _enlazarNodo(nodo, n){
    // ── Arrastrar el nodo por su cuerpo ──
    nodo.addEventListener('mousedown', function(e){
      if(e.target.classList.contains('grafo-conector')) return; // eso es enlace
      e.preventDefault();
      var wrap = document.querySelector('.grafo-wrap');
      _drag = {
        nodo: nodo, nota: n,
        offX: e.clientX - nodo.getBoundingClientRect().left,
        offY: e.clientY - nodo.getBoundingClientRect().top,
        movido: false
      };
      nodo.classList.add('arrastrando');
    });

    // Click (sin arrastrar) → abrir editor
    nodo.addEventListener('click', function(e){
      if(nodo._supressClick){ nodo._supressClick = false; return; }
      if(e.target.classList.contains('grafo-conector')) return;
      abrirEditor(n.id);
    });

    // ── Conector: arrastrar para crear un enlace ──
    var conector = nodo.querySelector('.grafo-conector');
    conector.addEventListener('mousedown', function(e){
      e.preventDefault();
      e.stopPropagation();
      var wrap = document.querySelector('.grafo-wrap');
      var x1 = (n.x||0) + NODO_W/2, y1 = (n.y||0) + NODO_H/2;
      // Línea elástica temporal
      var tmp = document.createElementNS(SVG_NS,'line');
      tmp.setAttribute('x1',x1); tmp.setAttribute('y1',y1);
      tmp.setAttribute('x2',x1); tmp.setAttribute('y2',y1);
      tmp.setAttribute('class','grafo-linea grafo-linea-tmp');
      _svg.appendChild(tmp);
      _link = { desde:n, x1:x1, y1:y1, tmp:tmp };
      nodo.classList.add('conectando');
    });
  }

  // Eventos globales de movimiento/soltar (una sola vez por render).
  function _enlazarEventosGlobales(){
    var wrap = document.querySelector('.grafo-wrap');
    if(!wrap || wrap._grafoEventos) return;
    wrap._grafoEventos = true;

    document.addEventListener('mousemove', function(e){
      // Arrastre de nodo
      if(_drag){
        var r = wrap.getBoundingClientRect();
        var x = e.clientX - r.left + wrap.scrollLeft - _drag.offX;
        var y = e.clientY - r.top  + wrap.scrollTop  - _drag.offY;
        x = Math.max(0, x); y = Math.max(0, y);
        _drag.nota.x = x; _drag.nota.y = y;
        _drag.nodo.style.left = x + 'px';
        _drag.nodo.style.top  = y + 'px';
        _drag.movido = true;
        dibujarLineas();   // las líneas siguen al nodo
      }
      // Creación de enlace: la línea elástica sigue al cursor
      if(_link){
        var r2 = wrap.getBoundingClientRect();
        var mx = e.clientX - r2.left + wrap.scrollLeft;
        var my = e.clientY - r2.top  + wrap.scrollTop;
        _link.tmp.setAttribute('x2', mx);
        _link.tmp.setAttribute('y2', my);
      }
    });

    document.addEventListener('mouseup', function(e){
      // Soltar un nodo arrastrado
      if(_drag){
        _drag.nodo.classList.remove('arrastrando');
        if(_drag.movido){
          _drag.nodo._supressClick = true;   // no abrir editor tras mover
          persistir(_drag.nota);
        }
        _drag = null;
      }
      // Soltar un enlace
      if(_link){
        // ¿Se soltó sobre otro nodo?
        var destino = e.target.closest ? e.target.closest('.grafo-nodo') : null;
        if(destino){
          var idB = destino.getAttribute('data-id');
          conectar(_link.desde.id, idB);   // render() redibuja todo
        } else {
          // Soltado en el vacío → cancelar: quitar la línea temporal.
          if(_link.tmp && _link.tmp.parentNode) _link.tmp.parentNode.removeChild(_link.tmp);
        }
        document.querySelectorAll('.grafo-nodo.conectando').forEach(function(x){
          x.classList.remove('conectando');
        });
        _link = null;
      }
    });
  }

  /* ── Montaje de la sección ───────────────────────────────────────── */
  function montar(){
    var board = document.getElementById('board-notas');
    if(!board) return;
    if(board.getAttribute('data-montado')==='1'){ render(); return; }

    board.innerHTML =
      '<div class="notas-header">'+
        '<div class="notas-titulo">'+
          '<i class="fas fa-diagram-project"></i><span>NOTAS</span>'+
        '</div>'+
        '<button class="notas-btn-nueva" id="notas-btn-nueva">'+
          '<i class="fas fa-plus"></i> Nueva nota'+
        '</button>'+
      '</div>'+
      '<div class="grafo-wrap"></div>';

    board.setAttribute('data-montado','1');

    var btn = document.getElementById('notas-btn-nueva');
    if(btn) btn.addEventListener('click', nuevaNota);

    if(!_cargado) cargarNotas();
    else render();
  }

  /* ── API pública para el router ──────────────────────────────────── */
  window._notasMontar = montar;
  window._notasRender = render;

  // Precarga en segundo plano.
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(function(){ if(!_cargado) cargarNotas(); }, 900);
    });
  } else {
    setTimeout(function(){ if(!_cargado) cargarNotas(); }, 900);
  }
})();
