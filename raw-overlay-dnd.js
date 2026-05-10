/* RAW Entry — Overlay Drag & Drop v.5.087

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
  var ALLOWED_SIDES = ['left-1','left-2','right-1','right-2','bottom-left','bottom-center','bottom-right'];
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
  function saveLayout(){
    if(!window._hudPanels) return;
    var layout = { 'left-1':[], 'left-2':[], 'right-1':[], 'right-2':[], bottom:[] };
    window._hudPanels.forEach(function(hp){
      var side = hp.el._side;
      if(isAllowedSide(side)){
        var key = side.indexOf('bottom-') === 0 ? 'bottom' : side;
        layout[key].push({ id: hp.el.id, side: side, order: hp.el._order });
      }
    });
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layout)); } catch(e){}
  }
  function restoreLayout(){
    var saved = loadLayout();
    if(!saved || !window._hudPanels) return;
    var byId = {};
    window._hudPanels.forEach(function(hp){ byId[hp.el.id] = hp; });
    ['left-1','left-2','right-1','right-2','bottom'].forEach(function(zone){
      var entries = saved[zone];
      if(!Array.isArray(entries)) return;
      entries.forEach(function(entry, idx){
        var hp = byId[entry.id];
        if(!hp) return;
        if(entry.side) hp.el._side = entry.side;
        hp.el._order = idx;
      });
    });
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
      return {
        rect: { left:x, right:x+w, top:topY-124, bottom:topY-14, width:w, height:110 },
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
      var gap   = 14;
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
    if(panelEl._dndDraggable) return;
    var side = panelEl._side;
    if(!isAllowedSide(side)) return;

    var header = panelEl.querySelector('.hud-h') || panelEl.querySelector('.hud-card');
    if(!header) return;
    if(header.querySelector('.hud-dnd-handle')) return;

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
      panelEl.style.transform = '';
      document.body.style.cursor = '';
      hideDropIndicator();

      var hover = detectZoneAt(e.clientX, e.clientY);
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
      clearGhostSlots();
      if(typeof window._reposicionarHUD === 'function') window._reposicionarHUD();
      saveLayout();
      requestAnimationFrame(function(){ buildGhostSlots(); });

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

    // Hook _reposicionarHUD para que rebuild slots cada vez que se reposiciona
    if(typeof window._reposicionarHUD === 'function' && !window._reposicionarHUD._dndHooked){
      var origRepos = window._reposicionarHUD;
      window._reposicionarHUD = function(){
        var r = origRepos.apply(this, arguments);
        // Esperar al next frame para que las posiciones estén aplicadas
        requestAnimationFrame(function(){
          // Solo rebuild si no estamos en mitad de un drag
          if(!_state.dragEl) buildGhostSlots();
        });
        return r;
      };
      window._reposicionarHUD._dndHooked = true;
    }

    var resizeT;
    window.addEventListener('resize', function(){
      clearTimeout(resizeT);
      resizeT = setTimeout(function(){
        if(typeof window._reposicionarHUD === 'function') window._reposicionarHUD();
        buildGhostSlots();
      }, 250);
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

  // Hook abrirDial: rebuild slots cuando se abre
  var origAbrir = null;
  var hookT = setInterval(function(){
    if(typeof window.abrirDial !== 'function') return;
    if(origAbrir){ clearInterval(hookT); return; }
    origAbrir = window.abrirDial;
    window.abrirDial = function(){
      var r = origAbrir.apply(this, arguments);
      setTimeout(function(){
        if(_state.initialized) buildGhostSlots();
        else init();
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
    rebuild: buildGhostSlots,
    save: saveLayout,
    load: loadLayout,
    reset: function(){
      try { localStorage.removeItem(STORAGE_KEY); } catch(e){}
      location.reload();
    },
  };
})();
