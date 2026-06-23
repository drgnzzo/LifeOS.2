/* RAW Entry — Loading Web v.7.111 (NEUTRO, sin borde recortado)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ Anillo central simple. NO envuelve api. NO bloquea getAll.        ║
   ║ Sube 0→100 en ~4s, dispara hud-listo, desaparece.                 ║
   ║ El dial y las cards entran cuando hud-listo llega (gracias al     ║
   ║ MutationObserver de raw-overlay v7.107+).                          ║
   ╚══════════════════════════════════════════════════════════════════╝
*/
(function(){
  'use strict';
  if(window.innerWidth < 900) return;

  var _root, _ring, _pct, _nombre, _puntos;
  var _terminado = false;
  var _intervalo = null;
  var _idleTimer = null;
  var SIZE = 320, R_PROG = 110, R_EXT = 128;  // v7.111 SIZE 260→320 para evitar borde recortado
  var C_PROG = 2 * Math.PI * R_PROG;

  // Espectro de colores que va cambiando
  var COLORES = [
    { n:'Sistema',     h:0 },
    { n:'Patrimonio',  h:120 },
    { n:'Financiero',  h:180 },
    { n:'Necesidades', h:280 },
    { n:'Activity',    h:30 }
  ];
  var _idx = 0;

  function colorH(h){ return 'hsl('+h+', 88%, 62%)'; }

  function construir(){
    var st = document.createElement('style');
    st.id = 'loading-cyber-style';
    st.textContent =
      '@keyframes lcScan{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}'+
      '@keyframes lcRotate{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}'+
      '#loading-cyber{font-family:"JetBrains Mono","Fira Code",ui-monospace,Menlo,monospace}'+
      '#loading-cyber .lc-scan{position:absolute;left:0;right:0;height:1px;'+
        'background:linear-gradient(90deg,transparent,currentColor,transparent);'+
        'opacity:.25;mix-blend-mode:lighten;animation:lcScan 2.6s linear infinite}';
    document.head.appendChild(st);

    _root = document.createElement('div');
    _root.id = 'loading-cyber';
    _root.style.cssText = [
      'position:fixed','left:50%','top:50%','transform:translate(-50%,-50%)',
      'width:'+SIZE+'px','height:'+SIZE+'px','z-index:100000','pointer-events:none',
      'color:'+colorH(COLORES[0].h),
      'opacity:0','transition:opacity .55s ease, transform .55s ease'
    ].join(';');

    _root.innerHTML =
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
          'transition:opacity .2s ease, transform .2s ease">'+
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
    _nombre = _root.querySelector('#lc-nombre');
    _pct = _root.querySelector('#lc-pct');
    _puntos = _root.querySelector('#lc-puntos');

    requestAnimationFrame(function(){
      _root.style.opacity = '1';
    });

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

  function pintar(p){
    if(!_ring || !_pct) return;
    var offset = C_PROG * (1 - p / 100);
    _ring.setAttribute('stroke-dashoffset', offset.toFixed(2));
    var n = Math.max(0, Math.min(100, Math.round(p)));
    _pct.textContent = (n < 10 ? '0' : '') + n + '%';
  }

  function cambiarColor(){
    if(_terminado) return;
    _idx = (_idx + 1) % COLORES.length;
    var c = COLORES[_idx];
    _root.style.color = colorH(c.h);
    if(_nombre){
      _nombre.style.opacity = '0';
      setTimeout(function(){
        if(!_nombre) return;
        _nombre.textContent = c.n.toUpperCase();
        _nombre.style.opacity = '1';
      }, 200);
    }
  }

  function terminar(){
    if(_terminado) return;
    _terminado = true;
    if(_intervalo) clearInterval(_intervalo);
    if(_idleTimer) clearInterval(_idleTimer);
    pintar(100);
    _root.style.color = '#22D3EE';
    if(_ring){
      _ring.style.filter = 'drop-shadow(0 0 18px currentColor) drop-shadow(0 0 32px currentColor)';
    }
    setTimeout(function(){
      if(_root){
        _root.style.opacity = '0';
        _root.style.transform = 'translate(-50%,-50%) scale(0.94)';
      }
      // Disparar hud-listo: el MutationObserver de raw-overlay abre el dial
      document.documentElement.classList.add('hud-listo');
    }, 350);
    setTimeout(function(){
      if(_root && _root.parentNode) _root.parentNode.removeChild(_root);
      var st = document.getElementById('loading-cyber-style');
      if(st && st.parentNode) st.parentNode.removeChild(st);
    }, 1500);
  }

  function init(){
    construir();
    var p = 0, cambioColorEn = 25;
    _intervalo = setInterval(function(){
      if(_terminado) return;
      p += 1.2;
      if(p >= cambioColorEn){
        cambiarColor();
        cambioColorEn += 22;
      }
      if(p >= 100){
        clearInterval(_intervalo);
        terminar();
        return;
      }
      pintar(p);
    }, 50);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
