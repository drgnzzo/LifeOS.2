/* RAW Entry — Loading Web v.7.108 (honesto en tiempo real)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ Anillo cyber central. UNA funcion a la vez. La que esta cargando  ║
   ║ AHORA mismo se muestra; cuando termina, salta a otra que tambien  ║
   ║ este en vuelo. Si nada esta cargando, el anillo se queda quieto   ║
   ║ esperando. Cero fantasmas: solo lo que realmente esta computando. ║
   ║ Al final: "COMPUTO COMPLETADO" 2s → dial entra → cards en cascada.║
   ║ Fondo cosmico SIEMPRE visible (no se apaga el body).               ║
   ╚══════════════════════════════════════════════════════════════════╝
*/
(function(){
  'use strict';
  if(window.innerWidth < 900) return;

  // ── Mapeo api.getX → nombre visible ──
  // Cada api real que se dispara se muestra con su nombre amigable.
  var NOMBRES = {
    getAll:           'Sistema',
    getFijos:         'Fijos',
    getGastos:        'Gastos',
    getDatosMes:      'Financiero',
    getActivityCheck: 'Activity',
    getNutricion:     'Nutricion',
    getEntrenamiento: 'Entrena',
    getPensamientos:  'Pensa',
    getRelaciones:    'Relaciones',
    getSalud:         'Salud',
    getApartados:     'Apartado',
    getPatrimonio:    'Patrimonio',
    getNecesidades:   'Necesidades',
    getRevision:      'Revision',
    getSaldoDia:      'Saldo',
    getNotas:         'Notas'
  };

  // Lista para repartir colores del espectro (orden estable: el orden
  // determina el color, asi cada funcion siempre tiene el mismo tono).
  var ORDEN = Object.keys(NOMBRES);
  function colorAt(nombreApi){
    var idx = ORDEN.indexOf(nombreApi);
    if(idx < 0) idx = 0;
    var h = Math.round(280 * (idx / (ORDEN.length - 1)));
    return 'hsl(' + h + ', 88%, 62%)';
  }

  // ── Estado ──
  var _root, _ring, _ringExt, _nombre, _pct, _puntos;
  var _enVuelo = {};        // { apiName: { startedAt, color, nombre } }
  var _disparadas = 0, _resueltas = 0;
  var _actualApi = null;     // la api que se muestra en pantalla ahora
  var _actualStart = 0;
  var _actualDuracion = 0;   // duracion estimada de la actual (~tiempo cargado)
  var _terminado = false;
  var _intervaloRender = null;
  var _idleTimer = null;
  var _puntosTimer = null;
  var SIZE = 260, R_PROG = 110, R_EXT = 128, C_PROG = 2 * Math.PI * R_PROG;
  var _esperaIdleDesde = 0;  // si no hay nada cargando, cuanto llevamos esperando
  var _arranqueT0 = performance.now();

  // ── Construir UI ──
  function construir(){
    var st = document.createElement('style');
    st.id = 'loading-cyber-style';
    st.textContent =
      '@keyframes lcScan{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}'+
      '@keyframes lcInterf{0%,100%{opacity:.08}45%{opacity:.18}55%{opacity:.06}}'+
      '@keyframes lcRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'+
      '#loading-cyber{font-family:"JetBrains Mono","Fira Code",ui-monospace,Menlo,monospace}'+
      '#loading-cyber .lc-grid{position:absolute;inset:0;border-radius:50%;overflow:hidden;'+
        'opacity:.08;pointer-events:none;mix-blend-mode:lighten;'+
        'background:repeating-linear-gradient(0deg,currentColor 0 1px,transparent 1px 8px);'+
        'animation:lcInterf 3.2s ease-in-out infinite}'+
      '#loading-cyber .lc-scan{position:absolute;left:0;right:0;height:1px;'+
        'background:linear-gradient(90deg,transparent,currentColor,transparent);'+
        'opacity:.25;mix-blend-mode:lighten;animation:lcScan 2.6s linear infinite}'+
      '#loading-cyber.completado{color:#22D3EE !important}';
    document.head.appendChild(st);

    _root = document.createElement('div');
    _root.id = 'loading-cyber';
    var col0 = colorAt('getAll');
    _root.style.cssText = [
      'position:fixed','left:50%','top:50%','transform:translate(-50%,-50%)',
      'width:'+SIZE+'px','height:'+SIZE+'px','z-index:100000','pointer-events:none',
      'color:'+col0,
      'opacity:0','transition:opacity .45s ease, transform .45s ease'
    ].join(';');

    _root.innerHTML =
      '<div class="lc-grid"></div>'+
      '<div class="lc-scan" style="top:48%"></div>'+
      '<svg width="'+SIZE+'" height="'+SIZE+'" viewBox="0 0 '+SIZE+' '+SIZE+'" '+
        'style="position:absolute;inset:0">'+
        '<circle cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+(R_EXT+8)+'" '+
          'fill="none" stroke="currentColor" stroke-width="1" opacity="0.18"/>'+
        '<g stroke="currentColor" stroke-width="1" opacity="0.45">'+
          dibujarMarcas(SIZE/2, SIZE/2, R_EXT-2, R_EXT+4, 48)+
        '</g>'+
        '<circle id="lc-ext" cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+R_EXT+'" '+
          'fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.55" '+
          'stroke-dasharray="3 18" '+
          'style="transform-origin:50% 50%;animation:lcRotate 14s linear infinite"/>'+
        '<circle cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+R_PROG+'" '+
          'fill="none" stroke="currentColor" stroke-width="3" opacity="0.18"/>'+
        '<circle id="lc-ring" cx="'+(SIZE/2)+'" cy="'+(SIZE/2)+'" r="'+R_PROG+'" '+
          'fill="none" stroke="currentColor" stroke-width="4" '+
          'stroke-linecap="round" '+
          'stroke-dasharray="'+C_PROG.toFixed(2)+'" '+
          'stroke-dashoffset="'+C_PROG.toFixed(2)+'" '+
          'transform="rotate(-90 '+(SIZE/2)+' '+(SIZE/2)+')" '+
          'style="transition:stroke-dashoffset .2s linear, stroke .35s ease; '+
            'filter:drop-shadow(0 0 8px currentColor)"/>'+
        '<g stroke="currentColor" stroke-width="1" opacity="0.35">'+
          dibujarMarcas(SIZE/2, SIZE/2, R_PROG-10, R_PROG-4, 24)+
        '</g>'+
      '</svg>'+
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;'+
        'align-items:center;justify-content:center;gap:8px;text-align:center;'+
        'pointer-events:none">'+
        '<div id="lc-nombre" style="font-size:12px;font-weight:600;'+
          'letter-spacing:0.32em;color:currentColor;text-transform:uppercase;'+
          'text-shadow:0 0 14px currentColor;font-family:inherit;'+
          'transition:opacity .2s ease, transform .2s ease, filter .2s ease">'+
          'INICIANDO'+
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

    requestAnimationFrame(function(){
      _root.style.opacity = '1';
    });

    var p = 0;
    _puntosTimer = setInterval(function(){
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

  function pintar(p){
    if(!_ring || !_pct) return;
    var offset = C_PROG * (1 - p / 100);
    _ring.setAttribute('stroke-dashoffset', offset.toFixed(2));
    var n = Math.max(0, Math.min(100, Math.round(p)));
    _pct.textContent = (n < 10 ? '0' : '') + n + '%';
  }

  // ── Cambiar a una nueva funcion (la que esta cargando ahora) ──
  function mostrarFuncion(apiName){
    if(_terminado || !apiName || apiName === _actualApi) return;
    _actualApi = apiName;
    _actualStart = performance.now();
    // Estimacion conservadora: 1.6s. Se ajusta segun lo que tarde.
    _actualDuracion = 1600;
    var col = colorAt(apiName);
    var nombre = (NOMBRES[apiName] || apiName).toUpperCase();
    if(_nombre){
      _nombre.style.filter = 'blur(2px)';
      _nombre.style.opacity = '0';
      _nombre.style.transform = 'translateX(-3px)';
    }
    if(_pct){
      _pct.style.filter = 'blur(1px)';
      _pct.style.opacity = '0.3';
    }
    setTimeout(function(){
      if(_terminado) return;
      _root.style.color = col;
      if(_nombre){
        _nombre.textContent = nombre;
        _nombre.style.transform = 'translateX(3px)';
        _nombre.style.opacity = '1';
        _nombre.style.filter = '';
        setTimeout(function(){
          if(_nombre) _nombre.style.transform = 'translateX(0)';
        }, 60);
      }
      if(_pct){
        _pct.style.opacity = '1';
        _pct.style.filter = '';
      }
      pintar(0);
    }, 180);
  }

  // ── Render loop: actualiza % de la funcion actual + busca cambios ──
  function loopRender(){
    if(_terminado) return;
    var ahora = performance.now();

    // ¿La actual sigue en vuelo? Si no, buscar otra que SI lo este.
    if(!_actualApi || !_enVuelo[_actualApi]){
      var siguiente = elegirSiguiente();
      if(siguiente){
        mostrarFuncion(siguiente);
        _esperaIdleDesde = 0;
      } else {
        // Nada esta cargando ahora mismo. Marcar inicio de espera.
        if(!_esperaIdleDesde) _esperaIdleDesde = ahora;
      }
    }

    // Pintar progreso de la actual: simulado pero coherente.
    // 0→90% en su duracion estimada; el 90→100 lo da el momento de
    // su resolucion real.
    if(_actualApi && _enVuelo[_actualApi]){
      var t = (ahora - _actualStart) / _actualDuracion;
      if(t > 0.9) t = 0.9 + (t - 0.9) * 0.1;  // asintota a 90%+
      pintar(Math.min(90, t * 100));
    }

    // ¿Terminamos? Si _disparadas > 0 y _resueltas >= _disparadas
    // Y han pasado al menos 800ms desde el inicio (evitar falsos
    // positivos en arranques muy rapidos antes de disparar nada).
    if(_disparadas > 0 && _resueltas >= _disparadas &&
       (ahora - _arranqueT0) > 800){
      pintar(100);
      terminar();
    }
  }

  function elegirSiguiente(){
    // Prioriza: 1) la que lleva menos tiempo en vuelo (mas nueva).
    var mejor = null, mejorT = -1;
    for(var k in _enVuelo){
      var dt = performance.now() - _enVuelo[k].startedAt;
      if(dt > mejorT){ mejor = k; mejorT = dt; }
    }
    return mejor;
  }

  // ── Engancharse a TODAS las api.getX ──
  function engancharApi(){
    if(!window.api){ return setTimeout(engancharApi, 50); }
    Object.keys(window.api).forEach(function(k){
      var fn = window.api[k];
      if(typeof fn !== 'function' || k.indexOf('get') !== 0) return;
      if(fn._lcEnvuelto) return;
      var envuelto = function(){
        var p = fn.apply(this, arguments);
        if(p && typeof p.then === 'function'){
          _disparadas++;
          _enVuelo[k] = { startedAt: performance.now() };
          var finalizar = function(){
            // Cuando esta funcion termine, ajustar la duracion REAL
            // (para que la proxima vez que se llame, la estimacion sea mejor).
            if(_enVuelo[k]){
              var dur = performance.now() - _enVuelo[k].startedAt;
              if(_actualApi === k){
                // Si era la actual, completar al 100 visualmente.
                pintar(100);
              }
              delete _enVuelo[k];
            }
            _resueltas++;
          };
          p.then(finalizar, finalizar);
        }
        return p;
      };
      envuelto._lcEnvuelto = true;
      window.api[k] = envuelto;
    });
  }

  // ── Terminar: COMPUTO COMPLETADO 2s → dial → cards ──
  function terminar(){
    if(_terminado) return;
    _terminado = true;
    if(_intervaloRender) clearInterval(_intervaloRender);
    if(_puntosTimer) clearInterval(_puntosTimer);
    if(_idleTimer) clearInterval(_idleTimer);

    // Cyan final + texto "COMPUTO COMPLETADO"
    _root.classList.add('completado');
    _root.style.color = '#22D3EE';
    pintar(100);
    if(_ring){
      _ring.style.filter = 'drop-shadow(0 0 18px currentColor) drop-shadow(0 0 32px currentColor)';
    }
    if(_nombre){
      _nombre.style.filter = 'blur(2px)';
      _nombre.style.opacity = '0';
    }
    if(_pct){
      _pct.style.filter = 'blur(2px)';
      _pct.style.opacity = '0';
    }
    if(_puntos) _puntos.style.opacity = '0';

    // 280ms despues: mostrar texto grande "COMPUTO COMPLETADO"
    setTimeout(function(){
      if(!_root) return;
      var bloque = document.createElement('div');
      bloque.id = 'lc-completado';
      bloque.style.cssText = [
        'position:absolute','inset:0','display:flex','align-items:center',
        'justify-content:center','flex-direction:column','gap:10px',
        'font-family:"JetBrains Mono","Fira Code",ui-monospace,monospace',
        'pointer-events:none',
        'opacity:0','transition:opacity .5s ease, transform .5s ease',
        'transform:scale(0.96)'
      ].join(';');
      bloque.innerHTML =
        '<div style="font-size:13px;letter-spacing:0.4em;color:#22D3EE;'+
          'text-transform:uppercase;text-shadow:0 0 16px #22D3EE">'+
          'computo completado</div>'+
        '<div style="font-size:11px;letter-spacing:0.3em;color:rgba(34,211,238,.55);'+
          'text-transform:uppercase">sistema en linea</div>';
      _root.appendChild(bloque);
      requestAnimationFrame(function(){
        bloque.style.opacity = '1';
        bloque.style.transform = 'scale(1)';
      });
    }, 280);

    // 2s de texto + 200ms fade out
    setTimeout(function(){
      if(_root){
        _root.style.opacity = '0';
        _root.style.transform = 'translate(-50%,-50%) scale(0.94)';
      }
      // SOLO AHORA: liberar hud-listo (dial entra)
      document.documentElement.classList.add('hud-listo');
    }, 2300);

    // Limpieza
    setTimeout(function(){
      if(_root && _root.parentNode) _root.parentNode.removeChild(_root);
      var st = document.getElementById('loading-cyber-style');
      if(st && st.parentNode) st.parentNode.removeChild(st);
    }, 3200);
  }

  // ── Arranque ──
  function init(){
    construir();
    engancharApi();
    _intervaloRender = setInterval(loopRender, 60);

    // Mientras nada se dispare aun, mostrar "Iniciando"
    pintar(0);

    // Salvavidas: 22s sin terminar → forzar
    setTimeout(function(){
      if(!_terminado){
        if(_disparadas === 0){
          // ni siquiera arranco el api → marcar fallback
          _resueltas = 1; _disparadas = 1;
        } else {
          _resueltas = _disparadas;
        }
      }
    }, 22000);
  }

  // NO apagamos el body — el cosmos debe estar visible desde el inicio.
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
