/* RAW Entry — Overlay Drag & Drop v.5.197
   FIX v5.197: hook de _reposicionarHUD ELIMINADO (congelaba referencia
   vieja sin lock → layout roto al soltar). buildGhostSlots se invoca
   ahora desde el reposicionador via _overlayDnd.rebuild.
   ── Heredado v5.195

   ── FIX v5.195: "el layout se desconfigura al soltar un panel" ──
   El fix de fondo va en raw-overlay.js (_reposicionarHUD limpia
   transforms residuales antes de medir). Aqui, en onUp:
   - Se limpian TODAS las dimensiones inline del panel movido
     (transform, width, height, maxHeight, overflowY, left, top)
     para que _reposicionarHUD lo mida desde cero.
   - Se revirtio el requestAnimationFrame de v5.193: _reposicionarHUD
     se llama de forma SINCRONA. Ya fuerza reflow internamente al leer
     scrollHeight, y el rAF dejaba una ventana visible de layout roto.

   ── Heredado v5.142 ──
   FIX BUG "layout se rompe al soltar una card". Causa raíz: 3 bugs
     combinados en persistencia y reordenamiento:
     1. saveLayout iteraba en orden de declaración de _hudPanels en lugar
        de ordenar por _order. Resultado: el array guardado quedaba
        desordenado respecto al estado real, así que al recargar quedaba
        mal.
     2. restoreLayout usaba `idx` del array (orden de iteración) en lugar
        de `entry.order`, pisando el orden correcto guardado.
     3. Al cambiar de side durante un drop, el código mutaba _side y _order
        del oldSide pero podía dejar el dragEl con un _order viejo o
        colisionando con otro panel del newSide hasta que applyReorder
        corriera. Si applyReorder fallaba o devolvía insertAt fuera de
        rango, quedaba estado inconsistente.
   - FIX: nuevo _normalizarOrders() que recorre TODAS las zonas y reasigna
     _order=0..N-1 secuencialmente. Se llama al final de cada drop (en
     onUp) y antes de saveLayout y restoreLayout. Garantía: el estado
     interno siempre es consistente.
   - saveLayout ahora ordena por _order antes de push al array guardado.
   - restoreLayout ahora valida que todos los IDs del layout guardado
     existan en _hudPanels actuales; si encuentra basura, descarta todo
     el localStorage para empezar limpio.
   - onUp: el transform inline del dragEl se limpia DESPUÉS del cambio
     de estado y junto con el _reposicionarHUD, no antes. Esto elimina
     el "salto visual" donde el panel volvía a su pos vieja y luego se
     movía a la nueva.

   ── Heredado v5.087 ──
   Cambios desde v5.086:
   - Slots vacíos: z-index 9001 (antes 8995, debajo del overlay y por eso
     no se veían). Border 2px dashed @35 (antes @22), fondo @04 (antes @025).
   - Hook a window._reposicionarHUD: cada vez que se llama, los slots se
     reconstruyen con las nuevas posiciones (antes solo en abrirDial/resize).
   - DnD DESACTIVADO cuando window._hudExpanded está seteado (Fase 1
     del expansor). Tampoco se pintan slots en modo expandido.

   ── Funcionalidad heredada v5.086 ──
   Drag-and-drop específico del overlay del dial, independiente de raw-drag.js
   (que maneja HOME). Cada panel tiene handle ≡ en el header. Reordenamiento
   dentro de su zona o a slots vacíos. Persistencia en localStorage
   ('lifeos_overlay_layout_v1'). Drop indicator durante drag.

   ORDEN DE CARGA: después de raw-overlay.js. */

(function(){
  var STORAGE_KEY = 'lifeos_overlay_layout_v1';

  // Slots vacíos por zona. Si bajas la cantidad, no aparecen ghosts.
  var SLOTS_CONFIG = {
    'left-1':  3,
    'left-2':  3,
    'right-1': 3,
    'right-2': 3,
    bottom:    3,
  };
  // Lados válidos para drag-and-drop
  var ALLOWED_SIDES = ['left-1','left-2','right-1','right-2','bottom-left','bottom-2nd','bottom-center','bottom-right'];
  function isAllowedSide(s){ return ALLOWED_SIDES.indexOf(s) !== -1; }

  var _state = {
    initialized: false,
    dragEl: null,
    dragSide: null,
    dragOrder: null,
  };
  var _ghostSlots = [];
  var _dropIndicator = null;

  // ═══ CSS ═══
  function injectCSS(){
    if(document.getElementById('hud-dnd-css')) return;
    var s = document.createElement('style');
    s.id = 'hud-dnd-css';
    s.textContent = [
      '.hud-dnd-handle{display:inline-flex;align-items:center;justify-content:center;'+
        'width:18px;height:18px;border-radius:4px;cursor:grab;opacity:.45;'+
        'transition:opacity .15s,background .15s;flex-shrink:0;margin-right:4px}',
      '.hud-dnd-handle:hover{opacity:.95;background:rgba(255,255,255,0.06)}',
      '.hud-dnd-handle:active{cursor:grabbing;opacity:1}',
      '.hud-dnd-handle i{font-size:10px;color:rgba(220,224,235,0.55)}',
      '.hud-dragging{opacity:.35;cursor:grabbing!important;z-index:9100!important}',
      '.hud-dragging *{pointer-events:none}',
      '.hud-empty-slot{position:fixed;z-index:9001;border-radius:14px;'+
        'border:2px dashed rgba(167,139,250,0.55);background:rgba(167,139,250,0.08);'+
        'display:flex;align-items:center;justify-content:center;'+
        'opacity:0;transition:opacity .35s ease,border-color .2s,background .2s;'+
        'pointer-events:none;'+
        'box-shadow:inset 0 0 18px rgba(167,139,250,0.10),0 0 16px rgba(167,139,250,0.10)}',
      '.hud-empty-slot.visible{opacity:0.85;pointer-events:auto}',
      '.hud-empty-slot:hover{opacity:1;border-color:rgba(167,139,250,0.80)}',
      '.hud-empty-slot.drop-target{border-color:rgba(167,139,250,0.95);'+
        'background:rgba(167,139,250,0.18);'+
        'box-shadow:0 0 32px rgba(167,139,250,0.50),inset 0 0 24px rgba(167,139,250,0.25)}',
      '.hud-empty-slot-inner{display:flex;flex-direction:column;align-items:center;'+
        'gap:6px;color:rgba(167,139,250,0.75);text-align:center}',
      '.hud-empty-slot-inner i{font-size:20px;filter:drop-shadow(0 0 6px rgba(167,139,250,0.55))}',
      '.hud-empty-slot-inner span{font-size:9px;font-weight:800;letter-spacing:.16em;'+
        'text-transform:uppercase}',
      '.hud-drop-indicator{position:fixed;z-index:9050;height:3px;'+
        'background:linear-gradient(90deg,transparent,#A78BFA,transparent);'+
        'box-shadow:0 0 12px rgba(167,139,250,0.7),0 0 24px rgba(167,139,250,0.4);'+
        'border-radius:2px;pointer-events:none}',
    ].join('\n');
    document.head.appendChild(s);
  }

  // ═══ Persistencia ═══
  function loadLayout(){
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    } catch(e){ return null; }
  }
  // Normaliza _order de todos los paneles en cada zona para que sean
  // 0..N-1 secuenciales sin huecos ni colisiones. Llamar después de cualquier
  // cambio (drop) para que el estado quede siempre consistente.
  function _normalizarOrders(){
    if(!window._hudPanels) return;
    var zonas = {};
    window._hudPanels.forEach(function(hp){
      var side = hp.el._side;
      if(!isAllowedSide(side)) return;
      if(!zonas[side]) zonas[side] = [];
      zonas[side].push(hp);
    });
    Object.keys(zonas).forEach(function(side){
      var arr = zonas[side];
      // Ordenar por _order actual (si hay empate, mantener orden de _hudPanels).
      arr.sort(function(a,b){
        var oa = (typeof a.el._order === 'number') ? a.el._order : 999;
        var ob = (typeof b.el._order === 'number') ? b.el._order : 999;
        return oa - ob;
      });
      arr.forEach(function(hp, idx){ hp.el._order = idx; });
    });
  }
  function saveLayout(){
    if(!window._hudPanels) return;
    // PRIMERO normalizar para garantizar que guardamos un estado consistente.
    _normalizarOrders();
    var layout = { 'left-1':[], 'left-2':[], 'right-1':[], 'right-2':[], bottom:[] };
    // Construir un array de todos los paneles allowed, agrupados por side,
    // ORDENADOS por su _order (no por su orden en _hudPanels, que es el
    // orden de declaración).
    var grupos = {};
    window._hudPanels.forEach(function(hp){
      var side = hp.el._side;
      if(!isAllowedSide(side)) return;
      if(!grupos[side]) grupos[side] = [];
      grupos[side].push(hp);
    });
    Object.keys(grupos).forEach(function(side){
      grupos[side].sort(function(a,b){ return a.el._order - b.el._order; });
      grupos[side].forEach(function(hp){
        var key = side.indexOf('bottom-') === 0 ? 'bottom' : side;
        layout[key].push({ id: hp.el.id, side: side, order: hp.el._order });
      });
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch(e){}
  }
  function restoreLayout(){
    var saved = loadLayout();
    if(!saved || !window._hudPanels) return;
    var byId = {};
    window._hudPanels.forEach(function(hp){ byId[hp.el.id] = hp; });

    // Validar que el layout guardado solo contenga IDs de paneles existentes.
    // Si encontramos un ID inválido, descartamos el layout entero (puede estar
    // corrupto por cambios de versión).
    var todoOk = true;
    ['left-1','left-2','right-1','right-2','bottom'].forEach(function(zone){
      var entries = saved[zone];
      if(!Array.isArray(entries)) return;
      entries.forEach(function(entry){
        if(!entry || !entry.id || !byId[entry.id]) todoOk = false;
        // Si el side guardado no es válido, también es corrupto
        if(entry && entry.side && !isAllowedSide(entry.side)) todoOk = false;
      });
    });
    if(!todoOk){
      try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
      return;
    }

    // Aplicar: para cada zona, ordenar por entry.order (NO por idx del array),
    // y reasignar _order de manera secuencial 0..N-1 al final.
    ['left-1','left-2','right-1','right-2','bottom'].forEach(function(zone){
      var entries = (saved[zone] || []).slice();
      entries.sort(function(a,b){
        return (a.order||0) - (b.order||0);
      });
      entries.forEach(function(entry, idx){
        var hp = byId[entry.id];
        if(!hp) return;
        if(entry.side) hp.el._side = entry.side;
        hp.el._order = idx;
      });
    });
    // Normalizar al final por si quedaron paneles fuera del layout guardado
    // (ej. paneles nuevos agregados en una versión nueva del overlay).
    _normalizarOrders();
  }

  // ═══ Slots vacíos ═══
  function clearGhostSlots(){
    _ghostSlots.forEach(function(s){ if(s.parentNode) s.parentNode.removeChild(s); });
    _ghostSlots = [];
  }

  function buildGhostSlots(){
    clearGhostSlots();
    if(!window._hudPanels) return;
    if(!window._dialVisible && !document.getElementById('dial-overlay')) return;
    if(window._hudExpanded) return;
    // Mientras la cascada de apertura está en curso, NO mostrar slots vacíos.
    // Se construirán al final cuando _hudCascadaEnCurso pase a false.
    if(window._hudCascadaEnCurso) return;

    function lastPanelInfo(side){
      var ps = window._hudPanels.filter(function(hp){ return hp.el._side === side; });
      if(!ps.length) return null;
      ps.sort(function(a,b){ return a.el._order - b.el._order; });
      var last = ps[ps.length-1].el;
      var rect = last.getBoundingClientRect();
      return { rect: rect, count: ps.length, lastEl: last };
    }

    // Para columnas vacías (sin paneles), necesitamos calcular su posición
    // usando los datos de _reposicionarHUD (colA_X, colB_X, colC_X, colD_X)
    // que se guardan en window._hudColPositions.
    function emptyColInfo(side){
      var cp = window._hudColPositions;
      if(!cp) return null;
      var x = cp[side+'_X'], w = cp.COL_W, topY = cp.colTopY;
      if(x === undefined || w === undefined || topY === undefined) return null;
      // Simular rect del último panel en y=topY-gap-slotH (para que el primer slot quede en topY)
      // gap=22 (sync con _reposicionarHUD), slotH=110 → top = topY - 22 - 110 = topY - 132
      return {
        rect: { left:x, right:x+w, top:topY-132, bottom:topY-22, width:w, height:110 },
        count: 0,
        lastEl: null
      };
    }

    // Slots laterales 4 columnas
    ['left-1','left-2','right-1','right-2'].forEach(function(side){
      var info = lastPanelInfo(side) || emptyColInfo(side);
      if(!info) return;
      var needed = SLOTS_CONFIG[side] - info.count;
      if(needed <= 0) return;
      var slotH = 110;
      var gap   = 22;  // mismo GAP que _reposicionarHUD (v5.104)
      var w     = info.rect.width;
      var x     = info.rect.left;
      var y     = info.rect.bottom + gap;
      var trackEl = document.getElementById('hud-track');
      var maxBottom = trackEl ? (trackEl.getBoundingClientRect().top - gap) : (window.innerHeight - 40);
      for(var i=0; i<needed; i++){
        if(y + slotH > maxBottom) break;
        var slot = document.createElement('div');
        slot.className = 'hud-empty-slot';
        slot.dataset.side = side;
        slot.dataset.slotIndex = String(info.count + i);
        slot.style.left   = x + 'px';
        slot.style.top    = y + 'px';
        slot.style.width  = w + 'px';
        slot.style.height = slotH + 'px';
        slot.innerHTML = '<div class="hud-empty-slot-inner">'+
          '<i class="fas fa-circle-plus"></i>'+
          '<span>Slot vacío</span>'+
        '</div>';
        document.body.appendChild(slot);
        _ghostSlots.push(slot);
        y += slotH + gap;
        (function(s){ requestAnimationFrame(function(){ s.classList.add('visible'); }); })(slot);
      }
    });
  }

  // ═══ Drop indicator ═══
  function showDropIndicator(y, x, w){
    if(!_dropIndicator){
      _dropIndicator = document.createElement('div');
      _dropIndicator.className = 'hud-drop-indicator';
      document.body.appendChild(_dropIndicator);
    }
    _dropIndicator.style.left  = x + 'px';
    _dropIndicator.style.top   = y + 'px';
    _dropIndicator.style.width = w + 'px';
    _dropIndicator.style.display = 'block';
  }
  function hideDropIndicator(){
    if(_dropIndicator) _dropIndicator.style.display = 'none';
  }

  // ═══ Lógica de reorder ═══
  function findDropTarget(side, mouseY){
    var ps = window._hudPanels.filter(function(hp){
      return hp.el._side === side && hp.el !== _state.dragEl;
    });
    ps.sort(function(a,b){ return a.el._order - b.el._order; });
    for(var i=0; i<ps.length; i++){
      var rect = ps[i].el.getBoundingClientRect();
      var mid  = rect.top + rect.height/2;
      if(mouseY < mid) return { insertAt: i, ref: ps[i] };
    }
    return { insertAt: ps.length, ref: ps[ps.length-1] || null };
  }

  function applyReorder(side, dragEl, insertAt){
    var dragHp = window._hudPanels.find(function(hp){ return hp.el === dragEl; });
    if(!dragHp) return;
    var ps = window._hudPanels.filter(function(hp){
      return hp.el._side === side && hp.el !== dragEl;
    });
    ps.sort(function(a,b){ return a.el._order - b.el._order; });
    ps.splice(insertAt, 0, dragHp);
    ps.forEach(function(hp, idx){ hp.el._order = idx; });
  }

  function moveToSlot(dragEl, slotEl){
    var newSide = slotEl.dataset.side;
    var dragHp = window._hudPanels.find(function(hp){ return hp.el === dragEl; });
    if(!dragHp) return;
    var oldSide = dragHp.el._side;
    if(oldSide === newSide) return;
    dragHp.el._side = newSide;
    var newSideCount = window._hudPanels.filter(function(hp){
      return hp.el._side === newSide;
    }).length;
    dragHp.el._order = newSideCount - 1; // queda al final
    var oldZone = window._hudPanels.filter(function(hp){ return hp.el._side === oldSide; });
    oldZone.sort(function(a,b){ return a.el._order - b.el._order; });
    oldZone.forEach(function(hp, idx){ hp.el._order = idx; });
  }

  // ═══ Hacer un panel arrastrable ═══
  function makeDraggable(panelEl){
    var side = panelEl._side;
    if(!isAllowedSide(side)) return;

    var header = panelEl.querySelector('.hud-h') || panelEl.querySelector('.hud-card');
    if(!header) return;

    // v5.142: idempotente. Si ya existe el handle, garantizar el flag y salir.
    if(header.querySelector('.hud-dnd-handle')){
      panelEl._dndDraggable = true;
      return;
    }

    var handle = document.createElement('div');
    handle.className = 'hud-dnd-handle';
    handle.title = 'Arrastrar';
    handle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
    header.insertBefore(handle, header.firstChild);

    handle.addEventListener('mousedown', function(e){
      e.stopPropagation();
      e.preventDefault();
      startDrag(panelEl, e);
    });

    panelEl._dndDraggable = true;
  }

  // ═══ Drag con mouse ═══
  function startDrag(panelEl, downEvt){
    if(_state.dragEl) return;
    // P6: Drag desactivado mientras hay un panel expandido
    if(window._hudExpanded) return;
    _state.dragEl    = panelEl;
    _state.dragSide  = panelEl._side;
    _state.dragOrder = panelEl._order;

    panelEl.classList.add('hud-dragging');
    document.body.style.cursor = 'grabbing';
    buildGhostSlots();

    var startX = downEvt.clientX;
    var startY = downEvt.clientY;

    function onMove(e){
      var dx = e.clientX - startX;
      var dy = e.clientY - startY;
      panelEl.style.transform = 'translate('+dx+'px,'+dy+'px)';

      _ghostSlots.forEach(function(s){ s.classList.remove('drop-target'); });
      var hover = detectZoneAt(e.clientX, e.clientY);
      if(hover && hover.type === 'slot'){
        hover.el.classList.add('drop-target');
        hideDropIndicator();
      } else if(hover && hover.type === 'panel'){
        var target = findDropTarget(hover.side, e.clientY);
        if(target.ref){
          var rect = target.ref.el.getBoundingClientRect();
          var midY = rect.top + rect.height/2;
          var lineY = (e.clientY < midY) ? rect.top - 6 : rect.bottom + 3;
          showDropIndicator(lineY, rect.left, rect.width);
        } else {
          hideDropIndicator();
        }
      } else {
        hideDropIndicator();
      }
    }

    function onUp(e){
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      panelEl.classList.remove('hud-dragging');
      document.body.style.cursor = '';
      hideDropIndicator();

      // NO limpiamos transform aún — eso causa un "salto visual" donde el
      // panel regresa a su pos vieja y luego _reposicionarHUD lo mueve a la
      // nueva. En su lugar: detectar zona, aplicar cambios, limpiar transform
      // junto con el reposicionamiento (que da la posición final correcta).

      // Para detectZoneAt necesitamos quitar el transform temporalmente,
      // porque getBoundingClientRect del panel arrastrado incluye el offset
      // de translate y podría devolverse a sí mismo como hover (aunque está
      // excluido del bucle de panels, sus bounds podrían afectar el detect
      // de slots si se solapan).
      var savedTransform = panelEl.style.transform;
      panelEl.style.transform = '';
      var hover = detectZoneAt(e.clientX, e.clientY);
      panelEl.style.transform = savedTransform;

      if(hover){
        if(hover.type === 'slot'){
          moveToSlot(panelEl, hover.el);
        } else if(hover.type === 'panel'){
          // Si zona destino distinta, cambiar side primero
          if(hover.side !== panelEl._side){
            var dragHp = window._hudPanels.find(function(hp){ return hp.el === panelEl; });
            if(dragHp){
              var oldSide = dragHp.el._side;
              dragHp.el._side = hover.side;
              var oldZone = window._hudPanels.filter(function(hp){ return hp.el._side === oldSide; });
              oldZone.sort(function(a,b){ return a.el._order - b.el._order; });
              oldZone.forEach(function(hp, idx){ hp.el._order = idx; });
            }
          }
          var target = findDropTarget(hover.side, e.clientY);
          applyReorder(hover.side, panelEl, target.insertAt);
        }
      }

      // GARANTÍA DE CONSISTENCIA: normalizar TODOS los orders de TODAS las
      // zonas después del cambio. Esto elimina cualquier colisión de _order
      // (dos paneles con mismo side+order) o hueco que pueda haber quedado
      // por mutaciones intermedias.
      _normalizarOrders();

      clearGhostSlots();

      // ─── FIX v5.193+v5.195: "layout se desconfigura al soltar" ───
      // _reposicionarHUD mide scrollHeight de cada panel para apilarlos. Si
      // el panel arrastrado conserva transform o el width/height de su
      // columna ANTERIOR, se mide mal → toda la columna se apila mal.
      // Limpiar TODAS las dimensiones inline del panel movido para que
      // _reposicionarHUD lo mida desde cero. positionCol reasigna después.
      panelEl.style.transform = '';
      panelEl.style.width     = '';
      panelEl.style.height    = '';
      panelEl.style.maxHeight = '';
      panelEl.style.overflowY = '';
      panelEl.style.left      = '';
      panelEl.style.top       = '';

      // v5.195: reposicionar de forma SÍNCRONA. _reposicionarHUD ya fuerza
      // reflow internamente al leer scrollHeight, así que no hace falta
      // esperar un frame; hacerlo asíncrono dejaba una ventana donde el
      // layout se veía roto. Llamada directa = aterrizaje inmediato.
      if(typeof window._reposicionarHUD === 'function') window._reposicionarHUD();
      saveLayout();
      buildGhostSlots();

      _state.dragEl = null;
      _state.dragSide = null;
      _state.dragOrder = null;
    }

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  function detectZoneAt(x, y){
    for(var i=0; i<_ghostSlots.length; i++){
      var slot = _ghostSlots[i];
      var rect = slot.getBoundingClientRect();
      if(x>=rect.left && x<=rect.right && y>=rect.top && y<=rect.bottom){
        return { type:'slot', el:slot };
      }
    }
    if(!window._hudPanels) return null;
    for(var j=0; j<window._hudPanels.length; j++){
      var hp = window._hudPanels[j];
      if(hp.el === _state.dragEl) continue;
      if(!isAllowedSide(hp.el._side)) continue;
      var pr = hp.el.getBoundingClientRect();
      if(x>=pr.left && x<=pr.right && y>=pr.top && y<=pr.bottom){
        return { type:'panel', el:hp.el, side:hp.el._side };
      }
    }
    return null;
  }

  // ═══ Init ═══
  function init(){
    if(_state.initialized) return;
    if(window.innerWidth < 900) return;
    if(!window._hudPanels) return;

    injectCSS();
    restoreLayout();
    window._hudPanels.forEach(function(hp){ makeDraggable(hp.el); });
    if(typeof window._reposicionarHUD === 'function') window._reposicionarHUD();
    requestAnimationFrame(function(){
      requestAnimationFrame(buildGhostSlots);
    });

    // v5.197: hook ELIMINADO. Antes envolvíamos window._reposicionarHUD
    // capturando su referencia en 'origRepos'. Pero el polling de init
    // podía capturar esa referencia ANTES de que raw-overlay.js asignara
    // su versión final (con el lock de reentrada) → el DnD llamaba una
    // versión vieja sin lock → layout roto al soltar (confirmado en
    // runtime). Ya no se hookea: buildGhostSlots se invoca explícitamente
    // donde hace falta (onUp ya lo hace tras _reposicionarHUD; el resize
    // y abrirDial también). No envolver = no congelar referencias viejas.

    // Nota: el listener de resize/zoom lo maneja raw-overlay.js (con
    // _resetDuroLayout + _reposicionarHUD). Aquí solo escuchamos para
    // reconstruir los slots vacíos después de que las posiciones queden
    // estabilizadas. Debounce más largo para esperar al overlay.
    var resizeT;
    window.addEventListener('resize', function(){
      clearTimeout(resizeT);
      resizeT = setTimeout(function(){
        if(!_state.dragEl) buildGhostSlots();
      }, 300);
    });

    _state.initialized = true;
  }

  // Polling: esperar a que el overlay esté montado
  var pollT = setInterval(function(){
    if(window._hudPanels && window._reposicionarHUD){
      clearInterval(pollT);
      requestAnimationFrame(function(){
        requestAnimationFrame(init);
      });
    }
  }, 200);

  // Hook abrirDial: rebuild slots cuando se abre + reaplica makeDraggable
  var origAbrir = null;
  var hookT = setInterval(function(){
    if(typeof window.abrirDial !== 'function') return;
    if(origAbrir){ clearInterval(hookT); return; }
    origAbrir = window.abrirDial;
    window.abrirDial = function(){
      var r = origAbrir.apply(this, arguments);
      setTimeout(function(){
        if(_state.initialized){
          // v5.142: re-aplicar makeDraggable a TODOS los paneles en CADA
          // apertura del dial. Idempotente: si el handle ya existe no se
          // recrea. Garantiza que si por algún motivo se perdieron los
          // handles (recreo de paneles, HTML re-rendered, etc.) vuelvan
          // a estar. Esto resuelve el bug "drag-drop no funciona después
          // de abrir +Nueva".
          if(window._hudPanels){
            window._hudPanels.forEach(function(hp){ makeDraggable(hp.el); });
          }
          buildGhostSlots();
        } else {
          init();
        }
      }, 600);
      return r;
    };
    clearInterval(hookT);
  }, 200);

  // Hook cerrarDial: limpiar slots
  var origCerrar = null;
  var hookT2 = setInterval(function(){
    if(typeof window.cerrarDial !== 'function') return;
    if(origCerrar){ clearInterval(hookT2); return; }
    origCerrar = window.cerrarDial;
    window.cerrarDial = function(){
      clearGhostSlots();
      hideDropIndicator();
      return origCerrar.apply(this, arguments);
    };
    clearInterval(hookT2);
  }, 200);

  // Debug global
  window._overlayDnd = {
    // v5.197: rebuild seguro — no reconstruye si hay un drag en curso
    // (los slots se reconstruyen solos al terminar el drop, en onUp).
    rebuild: function(){ if(!_state.dragEl) buildGhostSlots(); },
    buildGhostSlots: buildGhostSlots,
    clear: clearGhostSlots,
    clearGhostSlots: clearGhostSlots,
    save: saveLayout,
    load: loadLayout,
    reset: function(){
      try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
      location.reload();
    },
  };
})();