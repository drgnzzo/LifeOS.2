/* RAW Entry — Loading Web v.7.105 (rayas sutiles + espera total)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ Cada funcion corre su PROPIO 0→100%. Termina, glitch de            ║
   ║ interferencia, arranca la siguiente desde 0 con nuevo color.       ║
   ║ Espectro infrarrojo→ultravioleta repartido entre N funciones.      ║
   ║ Tipografia tipo terminal monoespaciada en TODO el HUD del loading. ║
   ║ Fondo del cosmos y el loading entran con fade suave (cero golpes). ║
   ║ Lineas de interferencia y scanlines detras del anillo (cyber).     ║
   ╚══════════════════════════════════════════════════════════════════╝
*/
(function(){
  'use strict';
  if(window.innerWidth < 900) return;

  // ── Funciones a mostrar (orden de aparicion visual) ──
  var FUNCIONES = [
    'Patrimonio',
    'Necesidades',
    'Bitacora',
    'Fijos',
    'Financiero',
    'Variables',
    'Activity'
  ];

  // ── Espectro infrarrojo → ultravioleta ──
  function colorAt(idx, total){
    if(total <= 1) return 'hsl(280, 80%, 62%)';
    var h = Math.round(280 * (idx / (total - 1)));
    return 'hsl(' + h + ', 88%, 62%)';
  }

  // ── Estado ──
  var _root, _ring, _ringExt, _nombre, _pct, _puntos, _scanlines;
  var _idx = 0;
  var _pctActual = 0;
  var _terminado = false;
  var _apiResuelto = false;
  var _intervaloProgreso = null;
  var _idleTimer = null;
  var SIZE = 260, R_PROG = 110, R_EXT = 128, C_PROG = 2 * Math.PI * R_PROG, C_EXT = 2 * Math.PI * R_EXT;

  // ── Fade global del fondo + loading ──
  // Apaga el body al inicio; lo enciende cuando ya pinto el loading.
  function fadeInicial(){
    var st = document.createElement('style');
    st.id = 'loading-fade-style';
    st.textContent =
      'html.lc-prepare body{opacity:0;transition:opacity .6s ease}'+
      'html.lc-ready  body{opacity:1}';
    document.head.appendChild(st);
    document.documentElement.classList.add('lc-prepare');
  }
  function quitarFadeInicial(){
    document.documentElement.classList.remove('lc-prepare');
    document.documentElement.classList.add('lc-ready');
  }

  // ── Construir UI ──
  function construir(){
    // Fuente terminal solo dentro del loading (excepcion local)
    var st = document.createElement('style');
    st.id = 'loading-cyber-style';
    st.textContent =
      '@keyframes lcScan{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}'+
      '@keyframes lcInterf{0%,100%{opacity:.10}45%{opacity:.30}55%{opacity:.08}}'+
      '@keyframes lcRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'+
      '#loading-cyber{font-family:"JetBrains Mono","Fira Code",ui-monospace,Menlo,monospace}'+
      // v7.105 — rayas mas sutiles: paso 8px (era 4), opacity .08 (era .16),
      // mix-blend-mode:lighten para que NO oscurezcan el texto del centro.
      '#loading-cyber .lc-grid{position:absolute;inset:0;border-radius:50%;overflow:hidden;'+
        'opacity:.08;pointer-events:none;mix-blend-mode:lighten;'+
        'background:repeating-linear-gradient(0deg,currentColor 0 1px,transparent 1px 8px);'+
        'animation:lcInterf 3.2s ease-in-out infinite}'+
      // Scanline: mas tenue, sin blur, mix-blend lighten.
      '#loading-cyber .lc-scan{position:absolute;left:0;right:0;height:1px;'+
        'background:linear-gradient(90deg,transparent,currentColor,transparent);'+
        'opacity:.25;mix-blend-mode:lighten;animation:lcScan 2.6s linear infinite}';
    document.head.appendChild(st);

    _root = document.createElement('div');
    _root.id = 'loading-cyber';
    var col0 = colorAt(0, FUNCIONES.length);
    _root.style.cssText = [
      'position:fixed','left:50%','top:50%','transform:translate(-50%,-50%)',
      'width:'+SIZE+'px','height:'+SIZE+'px','z-index:100000','pointer-events:none',
      'color:'+col0,
      'opacity:0','transition:opacity .55s ease, transform .55s ease'
    ].join(';');

    _root.innerHTML =
      // Interferencia horizontal (scanlines tenues recortados al circulo)
      '<div class="lc-grid"></div>'+
      // Scanline horizontal que cruza
      '<div class="lc-scan" style="top:48%"></div>'+
      // SVG con anillos
      '<svg width="'+SIZE+'" height="'+SIZE+'" viewBox="0 0 '+SIZE+' '+SIZE+'" '+
        'style="position:absolute;inset:0">'+
        // Anillo exterior tenue, decorativo (orbita)
        '<circle cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+(R_EXT+8)+'" '+
          'fill="none" stroke="currentColor" stroke-width="1" opacity="0.18"/>'+
        // Anillo exterior con marcas tipo radar
        '<g stroke="currentColor" stroke-width="1" opacity="0.45">'+
          dibujarMarcas(SIZE/2, SIZE/2, R_EXT-2, R_EXT+4, 48)+
        '</g>'+
        // Anillo exterior animado (rotando, decorativo)
        '<circle id="lc-ext" cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+R_EXT+'" '+
          'fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.55" '+
          'stroke-dasharray="3 18" '+
          'style="transform-origin:50% 50%;animation:lcRotate 14s linear infinite"/>'+
        // Pista del progreso (tenue)
        '<circle cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+R_PROG+'" '+
          'fill="none" stroke="currentColor" stroke-width="3" opacity="0.18"/>'+
        // Anillo de progreso real (el que avanza con el %)
        '<circle id="lc-ring" cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+R_PROG+'" '+
          'fill="none" stroke="currentColor" stroke-width="4" '+
          'stroke-linecap="round" '+
          'stroke-dasharray="'+C_PROG.toFixed(2)+'" '+
          'stroke-dashoffset="'+C_PROG.toFixed(2)+'" '+
          'transform="rotate(-90 '+(SIZE/2)+' '+(SIZE/2)+')" '+
          'style="transition:stroke-dashoffset .35s cubic-bezier(.3,.8,.4,1); '+
            'filter:drop-shadow(0 0 8px currentColor)"/>'+
        // Marcas internas tipo dial
        '<g stroke="currentColor" stroke-width="1" opacity="0.35">'+
          dibujarMarcas(SIZE/2, SIZE/2, R_PROG-10, R_PROG-4, 24)+
        '</g>'+
      '</svg>'+
      // Texto centrado: nombre + porcentaje + puntos
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;'+
        'align-items:center;justify-content:center;gap:8px;text-align:center;'+
        'pointer-events:none">'+
        '<div id="lc-nombre" style="font-size:12px;font-weight:600;'+
          'letter-spacing:0.32em;color:currentColor;text-transform:uppercase;'+
          'text-shadow:0 0 14px currentColor;font-family:inherit;'+
          'transition:opacity .2s ease, transform .2s ease, filter .2s ease">'+
          FUNCIONES[0].toUpperCase()+
        '</div>'+
        '<div id="lc-pct" style="font-size:44px;font-weight:400;'+
          'color:currentColor;letter-spacing:0.06em;'+
          'text-shadow:0 0 14px currentColor;'+
          'font-variant-numeric:tabular-nums;line-height:1;'+
          'font-family:inherit">00%</div>'+
        '<div id="lc-puntos" style="font-size:14px;letter-spacing:0.5em;'+
          'color:currentColor;opacity:0.7;height:16px;font-family:inherit">...</div>'+
      '</div>';

    document.body.appendChild(_root);
    _ring = _root.querySelector('#lc-ring');
    _ringExt = _root.querySelector('#lc-ext');
    _nombre = _root.querySelector('#lc-nombre');
    _pct = _root.querySelector('#lc-pct');
    _puntos = _root.querySelector('#lc-puntos');

    // Pintar entrada suave
    requestAnimationFrame(function(){
      _root.style.opacity = '1';
      _root.style.transform = 'translate(-50%,-50%) scale(1)';
      quitarFadeInicial();
    });

    // Animar puntos
    var p = 0;
    _idleTimer = setInterval(function(){
      if(!_puntos) return;
      p = (p + 1) % 4;
      _puntos.textContent = '.'.repeat(p) + '\u00a0'.repeat(3 - p);
    }, 350);
  }

  function dibujarMarcas(cx, cy, r1, r2, n){
    var out = '';
    for(var i = 0; i < n; i++){
      var ang = (i / n) * Math.PI * 2 - Math.PI / 2;
      var x1 = cx + r1 * Math.cos(ang);
      var y1 = cy + r1 * Math.sin(ang);
      var x2 = cx + r2 * Math.cos(ang);
      var y2 = cy + r2 * Math.sin(ang);
      out += '<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" '+
              'x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'"/>';
    }
    return out;
  }

  // ── Pintar % en anillo + numero ──
  function pintar(p){
    if(!_ring || !_pct) return;
    var offset = C_PROG * (1 - p / 100);
    _ring.setAttribute('stroke-dashoffset', offset.toFixed(2));
    var n = Math.max(0, Math.min(100, Math.round(p)));
    _pct.textContent = (n < 10 ? '0' : '') + n + '%';
  }

  // ── Cambiar a la funcion siguiente con glitch ──
  function siguienteFuncion(){
    if(_terminado) return;
    // Glitch out (interferencia): el % se "rompe", anillo destella
    if(_nombre){
      _nombre.style.filter = 'blur(2px) hue-rotate(60deg)';
      _nombre.style.opacity = '0';
      _nombre.style.transform = 'translateX(-3px)';
    }
    if(_pct){
      _pct.style.filter = 'blur(1px)';
      _pct.style.opacity = '0.3';
    }
    if(_ring) _ring.style.filter = 'drop-shadow(0 0 14px currentColor) drop-shadow(0 0 22px currentColor)';

    setTimeout(function(){
      if(_terminado) return;
      _idx = (_idx + 1) % FUNCIONES.length;
      _pctActual = 0;
      var col = colorAt(_idx, FUNCIONES.length);
      // currentColor en el root cambia → todo (ring/text/glow) cambia a la vez
      _root.style.color = col;
      if(_nombre){
        _nombre.textContent = FUNCIONES[_idx].toUpperCase();
        _nombre.style.transform = 'translateX(3px)';
        // Reset visual
        _nombre.style.opacity = '1';
        _nombre.style.filter = '';
      }
      if(_pct){
        _pct.style.opacity = '1';
        _pct.style.filter = '';
      }
      pintar(0);
      setTimeout(function(){
        if(_nombre) _nombre.style.transform = 'translateX(0)';
        if(_ring) _ring.style.filter = 'drop-shadow(0 0 8px currentColor)';
      }, 60);
    }, 240);
  }

  // ── Avance del % de la funcion actual ──
  // Cada funcion sube 0→100 en ~1.4s con curva suave. Al llegar a 100,
  // pausa breve y salta a la siguiente (glitch). Si api ya resolvio y
  // ya estamos en la ultima funcion, termina.
  function pasoProgreso(){
    if(_terminado) return;
    // Velocidad: lleva una funcion completa a 100 en ~1.4s (~17 pasos a 90ms)
    var v = 6;
    _pctActual = Math.min(100, _pctActual + v);
    pintar(_pctActual);
    if(_pctActual >= 100){
      // v7.105 — TERMINAR solo si TODO el arranque resolvio (no solo getAll).
      // getAll dispara otras 7 promesas en paralelo (getNutricion,
      // getNecesidades, getNotas, getRevision, getSaldoDia, etc).
      // El HAR mostro que la mas lenta es ~3.1s, no 1.3s de getAll.
      // Esperamos _resueltas >= _disparadas para garantizar que el dial
      // entra cuando TODO esta listo de verdad.
      var todoListo = _apiResuelto && _disparadas > 0 && _resueltas >= _disparadas;
      if(todoListo && _idx === FUNCIONES.length - 1){
        clearInterval(_intervaloProgreso);
        terminar();
        return;
      }
      // Si no, pasa a la siguiente con glitch (sigue cyclando)
      clearInterval(_intervaloProgreso);
      setTimeout(function(){
        siguienteFuncion();
        _intervaloProgreso = setInterval(pasoProgreso, 90);
      }, 380);
    }
  }

  // ── Terminar (api resolvio Y la ultima funcion llego al 100) ──
  function terminar(){
    if(_terminado) return;
    _terminado = true;
    if(_intervaloProgreso) clearInterval(_intervaloProgreso);
    if(_idleTimer) clearInterval(_idleTimer);
    // Destello final
    if(_ring){
      _ring.style.filter = 'drop-shadow(0 0 18px currentColor) drop-shadow(0 0 32px currentColor)';
    }
    setTimeout(function(){
      document.documentElement.classList.add('hud-listo');
      if(_root){
        _root.style.opacity = '0';
        _root.style.transform = 'translate(-50%,-50%) scale(0.92)';
      }
    }, 260);
    setTimeout(function(){
      if(_root && _root.parentNode) _root.parentNode.removeChild(_root);
      var st = document.getElementById('loading-cyber-style');
      if(st && st.parentNode) st.parentNode.removeChild(st);
      var st2 = document.getElementById('loading-fade-style');
      if(st2 && st2.parentNode) st2.parentNode.removeChild(st2);
    }, 1500);
  }

  // ── Engancharse a TODAS las llamadas api.* del arranque ──
  // Contamos cuantas promesas se disparan y cuantas resuelven. El %
  // de cada funcion visible avanza coherente con ese ratio: si el
  // 60% de las promesas resolvio, todas las funciones (en conjunto)
  // han avanzado el 60% en la realidad. La funcion VISIBLE actual
  // muestra su 0→100 sincronizada con ese ratio.
  var _disparadas = 0, _resueltas = 0;
  function engancharApi(){
    if(!window.api){ return setTimeout(engancharApi, 50); }
    // Envolver TODAS las funciones api.getX como contador
    Object.keys(window.api).forEach(function(k){
      var fn = window.api[k];
      if(typeof fn !== 'function' || k.indexOf('get') !== 0) return;
      if(fn._lcEnvuelto) return;
      var envuelto = function(){
        var p = fn.apply(this, arguments);
        if(p && typeof p.then === 'function'){
          _disparadas++;
          p.then(function(){ _resueltas++; })
           .catch(function(){ _resueltas++; });
        }
        return p;
      };
      envuelto._lcEnvuelto = true;
      window.api[k] = envuelto;
    });
    // Tambien marcar resuelto cuando getAll termine (senal explicita)
    if(window.api.getAll && !window.api.getAll._loadingEnvuelto){
      var origAll = window.api.getAll;
      var envAll = function(){
        var p = origAll.apply(this, arguments);
        if(p && typeof p.then === 'function' && !envAll._ya){
          envAll._ya = true;
          p.then(function(){ _apiResuelto = true; })
           .catch(function(){ _apiResuelto = true; });
        }
        return p;
      };
      envAll._loadingEnvuelto = true;
      // Preservar el wrapper del contador
      if(window.api.getAll._lcEnvuelto) envAll._lcEnvuelto = true;
      window.api.getAll = envAll;
    }
  }

  // ── Arranque ──
  function init(){
    construir();
    _intervaloProgreso = setInterval(pasoProgreso, 90);
    engancharApi();
    // Salvavidas: 18s sin api → terminar para no atascar al usuario
    setTimeout(function(){
      if(!_terminado){ _apiResuelto = true; terminar(); }
    }, 18000);
  }

  fadeInicial();
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
