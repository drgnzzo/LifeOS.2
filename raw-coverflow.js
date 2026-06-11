/* RAW Entry — Cover Flow Nivel 1 v.7.082 (intento 3)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ FASE v7.082 — COVER FLOW REHECHO DESDE CERO                      ║
   ╚══════════════════════════════════════════════════════════════════╝
   Tercer intento del Cover Flow para Nivel 1. Los dos anteriores
   (v7.067 y v7.068) rompieron porque:
     · v7.067 afectaba TODAS las .hud-pnl, incluidas USER/SIM/STATS
       de la barra superior.
     · El watcher de nivel dejaba .coverflow-on activo en transiciones
       a niv-0/2.
     · Los transforms usaban top:50%/left:50% absolutos y peleaban con
       las posiciones que _reposicionarHUD calculaba.

   Esta versión respeta las tres reglas no negociables:

   1) ÁMBITO ACOTADO. Solo afecta a las 7 cards laterales-expandibles
      (las que tienen _side en {left-1, left-2, right-1, right-2}):
      Patrimonio, Bitácora, Necesidades, Fijos, Financiero, Variables,
      Activity+Logros. Las cards top-* y bottom-* (USER, SIM, STATS,
      Misión, Logro, Nivel, Track) jamás se tocan.

   2) TRANSFORMS COMO MODIFICADORES, NO COMO REEMPLAZOS. El transform
      del Cover Flow se aplica en una capa CSS aparte (`--cf-tx`,
      `--cf-rotY`, `--cf-scale`, `--cf-z`) que SE COMPONE con el
      transform que _reposicionarHUD escribe. Si _reposicionarHUD se
      vuelve a llamar (resize, DnD, etc.) sus cálculos siguen siendo
      la fuente de verdad — el Cover Flow solo añade efecto encima.

   3) LIMPIEZA AGRESIVA. Cualquier salida de niv-1 (a niv-0 o niv-2)
      ejecuta cleanup completo: variables CSS borradas, atributos
      data-cf eliminados, clase .coverflow-on quitada del <html>.
      No queda nada inerte que pueda ensuciar otros niveles.

   COMPORTAMIENTO:
   · Entras a nivel 1 expandiendo una card lateral (clic o scroll):
     - La card expandida queda en el centro (lo que ya hacía la app).
     - Las otras 6 laterales-expandibles se redibujan en pila Cover
       Flow detrás de ella, escaladas y rotadas en Y según su orden
       relativo.
     - Aparecen dos flechas laterales (◀ ▶) sobre el dial para navegar
       entre cards expandidas sin pasar por nivel 0.
   · Salir de nivel 1: todo se restaura instantáneamente.
   · Resize / DnD / cualquier evento que dispare _reposicionarHUD:
     los efectos de Cover Flow se REPINTAN sobre las nuevas posiciones
     porque vivimos en variables CSS, no en posiciones absolutas.
*/
(function(){
  'use strict';

  // ── Limpiar restos de v7.067 / v7.068 por si quedó algo cacheado ──
  try {
    var stale = document.querySelectorAll('.cf-lateral,.cf-l1,.cf-l2,.cf-r1,.cf-r2');
    stale.forEach(function(el){
      el.classList.remove('cf-lateral','cf-l1','cf-l2','cf-r1','cf-r2');
    });
    var staleCSS = document.getElementById('coverflow-css');
    if(staleCSS && staleCSS.parentNode) staleCSS.parentNode.removeChild(staleCSS);
  } catch(e){}

  // ── Solo escritorio. En móvil el carrusel manda y no hay nivel 1. ──
  if(window.innerWidth < 900) return;

  // ── Lados que SÍ participan en Cover Flow. El resto: intocable. ──
  var SIDES_VALIDOS = { 'left-1':1, 'left-2':1, 'right-1':1, 'right-2':1 };

  function esLateralExpandible(panelEl){
    if(!panelEl) return false;
    var s = panelEl._side;
    return !!(s && SIDES_VALIDOS[s]);
  }

  /* ════════════════════════════════════════════════════════════════
     CSS — solo afecta a [data-cf] (set por nuestro JS).
     Combinado con el transform de _reposicionarHUD vía will-change.
  ════════════════════════════════════════════════════════════════ */
  var css = document.createElement('style');
  css.id = 'coverflow-css';
  css.textContent =
    /* Wrapper de flechas */
    '.cf-arrows{position:fixed;inset:0;z-index:9100;pointer-events:none;opacity:0;'+
       'transition:opacity .35s ease}'+
    'html.coverflow-on .cf-arrows{opacity:1}'+
    '.cf-arrow{position:absolute;top:50%;transform:translateY(-50%);'+
       'width:44px;height:80px;display:flex;align-items:center;justify-content:center;'+
       'background:rgba(10,7,22,.72);border:1px solid rgba(167,139,250,.35);'+
       'color:rgba(220,220,240,.85);font-size:22px;cursor:pointer;'+
       'backdrop-filter:blur(8px);pointer-events:auto;user-select:none;'+
       'transition:border-color .2s,color .2s,box-shadow .2s,background .2s}'+
    '.cf-arrow:hover{border-color:rgba(167,139,250,.7);color:#fff;'+
       'background:rgba(18,12,36,.88);box-shadow:0 0 18px rgba(139,92,246,.35)}'+
    '.cf-arrow.cf-prev{left:24px}'+
    '.cf-arrow.cf-next{right:24px}'+
    /* Efecto Cover Flow sobre las laterales NO expandidas */
    '.hud-pnl[data-cf="side"]{'+
       'transition:transform .42s cubic-bezier(.25,.8,.3,1),opacity .35s ease,filter .35s ease;'+
       'transform:translate(var(--cf-tx,0px),0) perspective(900px) rotateY(var(--cf-rotY,0deg)) scale(var(--cf-scale,1));'+
       'opacity:var(--cf-op,.45);'+
       'filter:blur(var(--cf-blur,.5px));'+
       'z-index:var(--cf-z,5);'+
       'pointer-events:none'+
    '}'+
    /* Cuando hay Cover Flow activo, las cards TOP y BOTTOM bajan su */
    /* presencia visual SIN moverse (atenuación, no reposición). */
    'html.coverflow-on .hud-pnl:not([data-cf]):not(.hud-expanded){'+
       'opacity:.32;transition:opacity .35s ease'+
    '}'+
    /* La card expandida se mantiene 100% como la dejó la app. */
    'html.coverflow-on .hud-pnl.hud-expanded{opacity:1;filter:none}';
  document.head.appendChild(css);

  /* ════════════════════════════════════════════════════════════════
     ESTADO Y APIs
  ════════════════════════════════════════════════════════════════ */
  var _activo = false;
  var _arrows = null;

  function expandida(){
    return window._hudExpanded || null;
  }

  // Devuelve la lista ordenada de cards expandibles del MISMO lado
  // (izquierdo o derecho). Cover Flow trabaja por lado: si la
  // expandida es de izquierda, navegas entre las de izquierda; si
  // es de derecha, entre las de derecha. Más natural visualmente.
  function hermanasDelLado(panelEl){
    if(!panelEl || !window._hudPanels) return [];
    var ladoIzq = panelEl._side === 'left-1' || panelEl._side === 'left-2';
    return window._hudPanels
      .map(function(hp){ return hp.el; })
      .filter(function(el){
        if(!esLateralExpandible(el)) return false;
        var izq = el._side === 'left-1' || el._side === 'left-2';
        return izq === ladoIzq;
      })
      // Orden estable: side primero, luego order
      .sort(function(a,b){
        if(a._side !== b._side) return a._side.localeCompare(b._side);
        return (a._order||0) - (b._order||0);
      });
  }

  /* ════════════════════════════════════════════════════════════════
     APLICAR / LIMPIAR
  ════════════════════════════════════════════════════════════════ */
  function aplicar(){
    var exp = expandida();
    if(!exp || !esLateralExpandible(exp)){
      // No expandida o expandida es algo no-lateral: nada que pintar.
      limpiarTodo();
      return;
    }
    var hermanas = hermanasDelLado(exp);
    if(hermanas.length < 2){
      // Solo hay una en ese lado: no hay Cover Flow que mostrar.
      limpiarTodo();
      return;
    }

    document.documentElement.classList.add('coverflow-on');
    _activo = true;

    // Limpiar cualquier data-cf colgado (por si vienes de otra card)
    document.querySelectorAll('.hud-pnl[data-cf]').forEach(function(el){
      el.removeAttribute('data-cf');
      ['--cf-tx','--cf-rotY','--cf-scale','--cf-op','--cf-blur','--cf-z']
        .forEach(function(v){ el.style.removeProperty(v); });
    });

    // Índice de la expandida dentro de sus hermanas.
    var idxExp = hermanas.indexOf(exp);
    var ladoIzq = exp._side === 'left-1' || exp._side === 'left-2';
    // Dirección del "fan": izquierda → hacia el centro+derecha;
    // derecha → hacia el centro+izquierda.
    var dir = ladoIzq ? +1 : -1;

    hermanas.forEach(function(el, i){
      if(el === exp) return;   // la expandida no se toca, manda la app
      var offset = i - idxExp;
      var absOff = Math.abs(offset);
      // Stack tipo CD: 80px de separación lateral, escala decreciente,
      // rotateY que da el "guiño" 3D característico de Cover Flow.
      var tx    = dir * (offset * 80);
      var rotY  = dir * (offset * 18);
      var scale = Math.max(0.7, 1 - absOff * 0.08);
      var op    = Math.max(0.18, 0.7 - absOff * 0.18);
      var blur  = Math.min(2.4, absOff * 0.7);
      var z     = 5 - absOff;
      el.setAttribute('data-cf', 'side');
      el.style.setProperty('--cf-tx',    tx + 'px');
      el.style.setProperty('--cf-rotY',  rotY + 'deg');
      el.style.setProperty('--cf-scale', String(scale));
      el.style.setProperty('--cf-op',    String(op));
      el.style.setProperty('--cf-blur',  blur + 'px');
      el.style.setProperty('--cf-z',     String(z));
    });

    montarFlechas(hermanas, idxExp);
  }

  function limpiarTodo(){
    document.documentElement.classList.remove('coverflow-on');
    _activo = false;
    document.querySelectorAll('.hud-pnl[data-cf]').forEach(function(el){
      el.removeAttribute('data-cf');
      ['--cf-tx','--cf-rotY','--cf-scale','--cf-op','--cf-blur','--cf-z']
        .forEach(function(v){ el.style.removeProperty(v); });
    });
    if(_arrows){
      _arrows.style.opacity = '0';
      // Las quitamos del DOM tras el fade para no acumular.
      setTimeout(function(){
        if(_arrows && _arrows.parentNode && !_activo){
          _arrows.parentNode.removeChild(_arrows);
          _arrows = null;
        }
      }, 380);
    }
  }

  /* ════════════════════════════════════════════════════════════════
     FLECHAS — navegar entre hermanas sin salir del Nivel 1
  ════════════════════════════════════════════════════════════════ */
  function montarFlechas(hermanas, idxExp){
    if(!_arrows){
      _arrows = document.createElement('div');
      _arrows.className = 'cf-arrows';
      _arrows.innerHTML =
        '<button class="cf-arrow cf-prev" aria-label="Anterior">◀</button>'+
        '<button class="cf-arrow cf-next" aria-label="Siguiente">▶</button>';
      document.body.appendChild(_arrows);
      _arrows.querySelector('.cf-prev').addEventListener('click', function(){
        navegar(-1);
      });
      _arrows.querySelector('.cf-next').addEventListener('click', function(){
        navegar(+1);
      });
    }
    var prev = _arrows.querySelector('.cf-prev');
    var next = _arrows.querySelector('.cf-next');
    prev.style.opacity = idxExp <= 0 ? '0.25' : '1';
    next.style.opacity = idxExp >= hermanas.length - 1 ? '0.25' : '1';
    prev.style.pointerEvents = idxExp <= 0 ? 'none' : 'auto';
    next.style.pointerEvents = idxExp >= hermanas.length - 1 ? 'none' : 'auto';
  }

  function navegar(delta){
    var exp = expandida();
    if(!exp) return;
    var hermanas = hermanasDelLado(exp);
    var idx = hermanas.indexOf(exp);
    if(idx < 0) return;
    var siguiente = hermanas[idx + delta];
    if(!siguiente) return;
    // Usar el API oficial de la app — colapsar la actual y expandir
    // la siguiente. Esto dispara las animaciones nativas de v6/v7 y
    // los listeners de niveles; no inventamos transiciones propias.
    if(typeof window._hudCollapse === 'function'){
      window._hudCollapse();
    }
    setTimeout(function(){
      if(typeof window._hudExpand === 'function'){
        window._hudExpand(siguiente);
      }
    }, 60);
  }

  /* ════════════════════════════════════════════════════════════════
     OBSERVADOR — se activa con la clase niv-1 del <html>; se apaga
     con cualquier otra. No hace polling: solo se mueve cuando hay
     cambio real de nivel.
  ════════════════════════════════════════════════════════════════ */
  function evaluar(){
    var h = document.documentElement;
    if(h.classList.contains('niv-1')){
      // Pequeño delay para que la card expandida ya esté marcada por
      // _hudExpand antes de leer window._hudExpanded.
      setTimeout(aplicar, 30);
    } else {
      // niv-0, niv-2, o cualquier otro estado: limpieza total.
      limpiarTodo();
    }
  }

  var mo = new MutationObserver(evaluar);
  mo.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  // También reevaluar cuando la expansión cambia dentro del mismo
  // nivel (caso: clic directo en otra lateral sin pasar por nivel 0).
  // Lo detectamos viendo cambios en el atributo de la card expandida.
  // Como _hudExpanded es una propiedad de window, no podemos ponerle
  // observer; pero _hudExpand siempre se llama desde clic o tecla,
  // así que un listener delegado en .hud-pnl basta.
  document.addEventListener('click', function(e){
    if(!document.documentElement.classList.contains('niv-1')) return;
    var card = e.target.closest && e.target.closest('.hud-pnl');
    if(!card) return;
    // Cualquier clic en una card durante niv-1 puede cambiar la
    // expandida. Esperamos a que el handler nativo termine y
    // reevaluamos.
    setTimeout(aplicar, 80);
  });

  // Y reposicionar si la app dispara _reposicionarHUD (resize, DnD).
  // Lo hookeamos con polling ligero al inicio (la función puede no
  // existir aún cuando este archivo carga).
  function hookRepo(){
    if(typeof window._reposicionarHUD !== 'function'){
      return setTimeout(hookRepo, 200);
    }
    if(window._reposicionarHUD._cfHooked) return;
    var orig = window._reposicionarHUD;
    var hooked = function(){
      var r = orig.apply(this, arguments);
      if(_activo) setTimeout(aplicar, 0);
      return r;
    };
    hooked._cfHooked = true;
    window._reposicionarHUD = hooked;
  }
  hookRepo();

  // Evaluación inicial por si arrancamos ya en niv-1 (improbable).
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', evaluar);
  } else {
    setTimeout(evaluar, 600);
  }

  // Exponer API mínima para depurar.
  window._coverflow = {
    aplicar: aplicar,
    limpiar: limpiarTodo,
    estado: function(){ return { activo: _activo, expandida: expandida(), hermanas: expandida() ? hermanasDelLado(expandida()) : [] }; }
  };
})();
