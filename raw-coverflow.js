/* RAW Entry — Cover Flow Nivel 1 v.7.092 (intento 4 — arquitectura segura)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ COVER FLOW CIRCULAR INFINITO — diseño "aro lógico + fantasmas"   ║
   ╚══════════════════════════════════════════════════════════════════╝
   POR QUÉ ESTE DISEÑO NO PUEDE ROMPER LA APP (lecciones v7.067/68/82):
   · NO toca NINGUNA card real: ni transforms, ni opacity, ni z-index.
     La card central es la expansión NATIVA de la app, intacta.
   · Las vecinas del aro se representan con FANTASMAS: mini-cards
     propias (título + color de la card real), posicionadas junto a la
     expandida. Elementos míos, control total, riesgo cero.
   · NO hay MutationObserver (chocaba con el watchdog de niveles).
   · NO hay hook recursivo de _reposicionarHUD.
   · Reactividad: wrap NO-recursivo de _hudExpand/_hudCollapse (llama
     al original y agenda un repintado) + intervalo de reconciliación
     idempotente de 500ms (solo escribe si el estado difiere).
   · CORTACIRCUITOS: si aplicar() lanza 3 excepciones, el módulo se
     auto-desactiva y lo reporta en consola. Jamás vuelve a trabar
     una computadora.

   COMPORTAMIENTO (spec de Electronics):
   · UN solo aro con TODAS las laterales-expandibles (7 hoy, n mañana:
     el aro se construye en runtime desde _hudPanels — escalable).
   · Orden del aro: left-1, left-2, right-1, right-2 (por _order).
   · Bucle infinito: tras la última viene la primera (módulo).
   · Cards ORTOGONALES: cero rotateY, cero 3D.
   · Navegación: flechas ◀ ▶ en pantalla, ← → del teclado, y clic
     en los fantasmas. Cada paso: colapsar actual → expandir siguiente
     (API nativa _hudCollapse/_hudExpand — animaciones de la casa).
*/
(function(){
  'use strict';

  // ── Limpiar restos de CUALQUIER intento anterior ──
  try {
    document.documentElement.classList.remove('coverflow-on','cf-on');
    document.querySelectorAll('[data-cf]').forEach(function(el){
      el.removeAttribute('data-cf');
      ['--cf-tx','--cf-rotY','--cf-scale','--cf-op','--cf-blur','--cf-z']
        .forEach(function(v){ el.style.removeProperty(v); });
    });
    ['coverflow-css','cf4-css'].forEach(function(id){
      var n = document.getElementById(id);
      if(n && n.parentNode) n.parentNode.removeChild(n);
    });
    document.querySelectorAll('.cf-arrows,.cf4-ghost,.cf4-arrow').forEach(function(n){
      if(n.parentNode) n.parentNode.removeChild(n);
    });
  } catch(e){}

  if(window.innerWidth < 900) return;   // solo escritorio

  /* ════════════════════════════════════════════════════════════════
     CSS — solo elementos cf4-* (míos). Tokens HUD ya definidos v5.077.
  ════════════════════════════════════════════════════════════════ */
  var css = document.createElement('style');
  css.id = 'cf4-css';
  css.textContent =
    /* v7.092 — las cards del ARO que no son el centro se OCULTAN en
       cf-on (estaban fijas en columnas contradiciendo el carrusel).
       Solo atributo data-cf-ring puesto/quitado por este modulo. */
    'html.cf-on .hud-pnl[data-cf-ring]{opacity:0 !important;'+
      'visibility:hidden !important;pointer-events:none !important;'+
      'transition:opacity .3s ease, visibility 0s linear .3s}'+
    '.cf4-ghost{position:fixed;width:240px;max-width:20vw;z-index:8990;'+
      'background:var(--hud-form-bg);border:1px solid var(--cf4-col,var(--hud-border));'+
      'box-shadow:0 0 22px rgba(0,0,0,.55),0 0 14px var(--cf4-glow,transparent);'+
      'padding:13px 15px;cursor:pointer;user-select:none;opacity:0;'+
      'transform:scale(.92);pointer-events:none;'+
      'transition:opacity .35s ease,transform .35s ease,box-shadow .2s ease;'+
      'display:flex;flex-direction:column;gap:10px;justify-content:center}'+
    'html.cf-on .cf4-ghost{opacity:.78;pointer-events:auto;transform:scale(1)}'+
    '.cf4-ghost:hover{opacity:1 !important;'+
      'box-shadow:0 0 26px rgba(0,0,0,.6),0 0 22px var(--cf4-glow,transparent)}'+
    '.cf4-g-top{display:flex;align-items:center;gap:8px}'+
    '.cf4-g-dot{width:9px;height:9px;border-radius:50%;flex:none;'+
      'background:var(--cf4-col);box-shadow:0 0 8px var(--cf4-col)}'+
    '.cf4-g-tit{font-size:11px;font-weight:700;letter-spacing:.09em;'+
      'text-transform:uppercase;color:var(--hud-text);white-space:nowrap;'+
      'overflow:hidden;text-overflow:ellipsis}'+
    '.cf4-g-sub{font-size:10px;color:var(--hud-text-dim);letter-spacing:.04em}'+
    '.cf4-g-pos{font-size:9px;color:var(--hud-text-faint);letter-spacing:.12em;'+
      'text-transform:uppercase}'+
    '.cf4-arrow{position:fixed;top:50%;transform:translateY(-50%);z-index:8995;'+
      'width:42px;height:74px;display:flex;align-items:center;justify-content:center;'+
      'background:rgba(10,7,22,.7);border:1px solid var(--hud-border);'+
      'color:var(--hud-text-dim);font-size:20px;cursor:pointer;user-select:none;'+
      'opacity:0;pointer-events:none;transition:opacity .3s ease,border-color .2s,color .2s}'+
    'html.cf-on .cf4-arrow{opacity:1;pointer-events:auto}'+
    '.cf4-arrow:hover{border-color:var(--hud-border-hov);color:#fff;'+
      'box-shadow:0 0 16px var(--hud-glow)}'+
    '.cf4-arrow.izq{left:18px}.cf4-arrow.der{right:18px}';
  document.head.appendChild(css);

  /* ════════════════════════════════════════════════════════════════
     ESTADO
  ════════════════════════════════════════════════════════════════ */
  var SIDES = { 'left-1':0, 'left-2':1, 'right-1':2, 'right-2':3 };
  var NOMBRES = {   // título y subtítulo por id de card
    'hud-patrimonio':  ['Patrimonio',     'Saldos y apartados'],
    'hud-bitacora':    ['Bitácora',       'Registros de vida'],
    'hud-necesidades': ['Necesidades',    'Pirámide Maslow'],
    'hud-fijos':       ['Fijos',          'Pagos recurrentes'],
    'hud-financiero':  ['Financiero',     'Flujo del mes'],
    'hud-variables':   ['Variables',      'Gastos variables'],
    'hud-activity':    ['Activity+Logros','Hábitos y rachas']
  };
  var _ghostL = null, _ghostR = null, _arrL = null, _arrR = null;
  var _centroActual = null;       // card expandida del último pintado
  var _fallos = 0;                // cortacircuitos
  var _muerto = false;

  function esLateral(el){
    return !!(el && el._side && (el._side in SIDES));
  }

  // El ARO: se construye fresco en cada uso desde _hudPanels (si mañana
  // agregas cards laterales, entran solas). Orden estable y circular.
  function anillo(){
    if(!window._hudPanels) return [];
    return window._hudPanels
      .map(function(hp){ return hp.el || hp; })
      .filter(esLateral)
      .sort(function(a,b){
        if(a._side !== b._side) return SIDES[a._side] - SIDES[b._side];
        return (a._order||0) - (b._order||0);
      });
  }

  function colorDe(el){
    // El accent vive en el borde/estilos del panel; fallback por id.
    var FALLBACK = {
      'hud-patrimonio':'#22C55E','hud-necesidades':'#A855F7',
      'hud-bitacora':'#C084FC','hud-financiero':'#22D3EE',
      'hud-activity':'#FB923C','hud-fijos':'#67E8F9','hud-variables':'#A5B4FC'
    };
    return FALLBACK[el.id] || '#8b5cf6';
  }

  /* ════════════════════════════════════════════════════════════════
     FANTASMAS Y FLECHAS (creación única, reutilización siempre)
  ════════════════════════════════════════════════════════════════ */
  function _mkGhost(lado){
    var g = document.createElement('div');
    g.className = 'cf4-ghost';
    g.innerHTML =
      '<div class="cf4-g-pos"></div>'+
      '<div class="cf4-g-top"><span class="cf4-g-dot"></span>'+
      '<span class="cf4-g-tit"></span></div>'+
      '<div class="cf4-g-sub"></div>';
    g.addEventListener('click', function(){
      navegar(lado === 'izq' ? -1 : +1);
    });
    document.body.appendChild(g);
    return g;
  }
  function _mkArrow(lado){
    var a = document.createElement('div');
    a.className = 'cf4-arrow ' + lado;
    a.textContent = lado === 'izq' ? '◀' : '▶';
    a.addEventListener('click', function(){
      navegar(lado === 'izq' ? -1 : +1);
    });
    document.body.appendChild(a);
    return a;
  }
  function asegurarUI(){
    if(!_ghostL) _ghostL = _mkGhost('izq');
    if(!_ghostR) _ghostR = _mkGhost('der');
    if(!_arrL)   _arrL   = _mkArrow('izq');
    if(!_arrR)   _arrR   = _mkArrow('der');
  }

  function pintarGhost(g, cardEl, etiqueta){
    var info = NOMBRES[cardEl.id] || [cardEl.id, ''];
    var col = colorDe(cardEl);
    g.style.setProperty('--cf4-col', col);
    g.style.setProperty('--cf4-glow', col + '44');
    g.querySelector('.cf4-g-pos').textContent = etiqueta;
    g.querySelector('.cf4-g-tit').textContent = info[0];
    g.querySelector('.cf4-g-sub').textContent = info[1];
  }

  /* ════════════════════════════════════════════════════════════════
     APLICAR — idempotente. Solo escribe si cambió el centro o el rect.
  ════════════════════════════════════════════════════════════════ */
  function aplicar(){
    if(_muerto) return;
    try {
      var h = document.documentElement;
      var centro = window._hudExpanded || null;
      var activo = h.classList.contains('niv-1') && centro && esLateral(centro);

      if(!activo){
        if(_centroActual !== null || h.classList.contains('cf-on')) limpiar();
        return;
      }

      var aro = anillo();
      if(aro.length < 2){ limpiar(); return; }
      var idx = aro.indexOf(centro);
      if(idx < 0){ limpiar(); return; }

      asegurarUI();
      var n = aro.length;
      var prev = aro[(idx - 1 + n) % n];   // bucle infinito por módulo
      var next = aro[(idx + 1) % n];

      // v7.092 — marcar centro y miembros del aro con ATRIBUTOS (cero
      // estilos sobre cards reales; el CSS de cf-on hace el resto).
      aro.forEach(function(el){
        if(el === centro){
          el.removeAttribute('data-cf-ring');
          el.setAttribute('data-cf-center','1');
        } else {
          el.removeAttribute('data-cf-center');
          el.setAttribute('data-cf-ring','1');
        }
      });

      // Fantasmas estilo CARD VECINA: altos (60% de la central), pegados
      // a sus bordes. Leemos el rect de la central, jamas escribimos en ella.
      var r = centro.getBoundingClientRect();
      if(r.width < 50){ return; }   // aún animando: el próximo tick lo toma
      var gw = Math.min(240, window.innerWidth * 0.20);
      var gh = Math.max(180, r.height * 0.6);
      var gap = 18;
      var top = Math.max(70, r.top + (r.height - gh)/2);
      _ghostL.style.height = gh + 'px';
      _ghostR.style.height = gh + 'px';
      _ghostL.style.left = Math.max(8, r.left - gw - gap) + 'px';
      _ghostL.style.top  = top + 'px';
      _ghostR.style.left = Math.min(window.innerWidth - gw - 8, r.right + gap) + 'px';
      _ghostR.style.top  = top + 'px';

      pintarGhost(_ghostL, prev, '◀ ' + (((idx - 1 + n) % n) + 1) + '/' + n);
      pintarGhost(_ghostR, next, ((idx + 1) % n + 1) + '/' + n + ' ▶');

      h.classList.add('cf-on');
      _centroActual = centro;
      _fallos = 0;
    } catch(e){
      _fallos++;
      if(_fallos >= 3){
        _muerto = true;
        limpiar();
        console.warn('[CoverFlow] auto-desactivado tras 3 fallos:', e.message);
      }
    }
  }

  function limpiar(){
    document.documentElement.classList.remove('cf-on');
    _centroActual = null;
    // v7.092 — retirar atributos del aro (las cards vuelven a la vida
    // normal del nivel; sus estilos jamas fueron tocados).
    document.querySelectorAll('.hud-pnl[data-cf-ring],.hud-pnl[data-cf-center]')
      .forEach(function(el){
        el.removeAttribute('data-cf-ring');
        el.removeAttribute('data-cf-center');
      });
    // Los fantasmas/flechas se ocultan vía CSS (sin .cf-on → opacity 0,
    // pointer-events none). No se destruyen: reutilización sin churn.
  }

  /* ════════════════════════════════════════════════════════════════
     NAVEGAR — gira el aro un paso usando la API NATIVA de la app.
  ════════════════════════════════════════════════════════════════ */
  var _navegando = false;
  function navegar(delta){
    if(_muerto || _navegando) return;
    var centro = window._hudExpanded;
    if(!centro) return;
    var aro = anillo();
    var idx = aro.indexOf(centro);
    if(idx < 0) return;
    var destino = aro[(idx + delta + aro.length) % aro.length];
    if(!destino || destino === centro) return;
    _navegando = true;
    try {
      if(typeof window._hudCollapse === 'function') window._hudCollapse();
      setTimeout(function(){
        try {
          if(typeof window._hudExpand === 'function') window._hudExpand(destino);
        } catch(e){}
        setTimeout(function(){ _navegando = false; aplicar(); }, 120);
      }, 70);
    } catch(e){ _navegando = false; }
  }

  /* ════════════════════════════════════════════════════════════════
     REACTIVIDAD — wraps NO recursivos + reconciliación idempotente.
  ════════════════════════════════════════════════════════════════ */
  function hookear(){
    if(typeof window._hudExpand === 'function' && !window._hudExpand._cf4){
      var oe = window._hudExpand;
      var we = function(){ var r = oe.apply(this, arguments); setTimeout(aplicar, 90); return r; };
      we._cf4 = true; window._hudExpand = we;
    }
    if(typeof window._hudCollapse === 'function' && !window._hudCollapse._cf4){
      var oc = window._hudCollapse;
      var wc = function(){ var r = oc.apply(this, arguments); setTimeout(aplicar, 90); return r; };
      wc._cf4 = true; window._hudCollapse = wc;
    }
    if(!window._hudExpand || !window._hudExpand._cf4) setTimeout(hookear, 400);
  }
  hookear();

  // Reconciliación: barata e idempotente (aplicar solo escribe si hay
  // cambio real). Cubre rutas que no pasan por _hudExpand/_hudCollapse
  // (p. ej. regreso de nivel 2 por warp).
  setInterval(aplicar, 500);

  // Teclado: ← → giran el aro cuando el Cover Flow está activo.
  document.addEventListener('keydown', function(e){
    if(_muerto) return;
    if(!document.documentElement.classList.contains('cf-on')) return;
    if(e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if(e.key === 'ArrowLeft'){ e.preventDefault(); navegar(-1); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); navegar(+1); }
  });

  // API de depuración (regla: pedir datos, no percepciones).
  window._coverflow = {
    estado: function(){
      var aro = anillo();
      return {
        activo: document.documentElement.classList.contains('cf-on'),
        muerto: _muerto,
        fallos: _fallos,
        centro: window._hudExpanded ? window._hudExpanded.id : null,
        aro: aro.map(function(el){ return el.id; })
      };
    },
    navegar: navegar
  };
})();
