/* RAW Entry — Cover Flow Nivel 1 v.7.113 (doble aplicar post-transicion)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ CARRUSEL REAL: 7 marcos persistentes, uno por card, viajando      ║
   ║ entre slots. El contenido jamás cambia de marco → cero cortes.   ║
   ╚══════════════════════════════════════════════════════════════════╝
   · Slots relativos al centro: -3…+3 (camino corto con módulo).
     0 = geometría del centro con opacity 0 (el marco viaja AL centro
     y se funde con la expansión nativa: continuidad del giro).
     ±1 visibles grandes (±20°), ±2 detrás (±32°, tenues),
     ±3 fuera del viewport (entran/salen deslizándose, jamás "pop").
   · Navegar reasigna slots: CSS interpola left/top/size/ángulo/
     opacidad de TODOS a la vez (.5s). Sin clases de turn, sin snap.
   · El overlay del dial se vela durante el giro (adiós parpadeo en
     la esquina que 007 documentó).
   · ROCOLA: mantener presionada una flecha encadena giros continuos
     (ticker 120ms que respeta _navegando: dispara el siguiente paso
     en cuanto el anterior libera; suelta y se detiene donde va).
   · v7.099 SWAP ATOMICO: navegar llama _hudExpand(destino) DIRECTO.
     La funcion nativa colapsa-sin-reposicionar y expande en la MISMA
     llamada sincrona: _hudExpanded jamas queda null -> el nivel jamas
     cae a 0 entre pasos (la barra de niveles ya no brinca y la rocola
     no se traba — caso 007: niv 1->0->1 en 20.2s/21.4s/22.4s...).
   · v7.099 GEOMETRIA ESTABLE: los marcos solo se dimensionan cuando
     dos lecturas consecutivas del rect central coinciden (±3px).
     Mata las cards "apachurradas" al regresar de nivel 2 (se media
     la card a medio crecer).
   · Clon por marco montado al entrar al rango visible; se refresca
     solo al reentrar (datos al día sin cortes visibles).
   Reglas vigentes: cero escrituras sobre cards reales, cero
   MutationObserver, cero hook de _reposicionarHUD, cortacircuitos.
*/
(function(){
  'use strict';

  try {
    document.documentElement.classList.remove('coverflow-on','cf-on','cf-girando','cf-turn-izq','cf-turn-der','cf-snap','cf-nav');
    document.querySelectorAll('[data-cf],[data-cf-ring],[data-cf-center]').forEach(function(el){
      el.removeAttribute('data-cf'); el.removeAttribute('data-cf-ring'); el.removeAttribute('data-cf-center');
    });
    ['coverflow-css','cf4-css','cf5-css','cf6-css','cf7-css'].forEach(function(id){
      var n=document.getElementById(id); if(n&&n.parentNode) n.parentNode.removeChild(n);
    });
    document.querySelectorAll('.cf-arrows,.cf4-ghost,.cf4-arrow,.cf5-ghost,.cf5-arrow,.cf6-ghost,.cf6-arrow,.cf7-ghost,.cf7-arrow').forEach(function(n){
      if(n.parentNode) n.parentNode.removeChild(n);
    });
  } catch(e){}

  if(window.innerWidth < 900) return;

  var css = document.createElement('style');
  css.id = 'cf7-css';
  css.textContent =
    'html.cf-on .hud-pnl[data-cf-ring]{opacity:0 !important;visibility:hidden !important;'+
      'pointer-events:none !important;transition:opacity .3s ease,visibility 0s linear .3s}'+
    'html.cf-on .hud-pnl:not([data-cf-center]):not([data-cf-ring]){opacity:.3;'+
      'transition:opacity .35s ease}'+
    /* vela del dial durante el giro: adiós parpadeo de esquina */
    'html.cf-nav #dial-overlay{opacity:0 !important;transition:opacity .15s ease !important}'+
    '.cf7-ghost{position:fixed;overflow:hidden;cursor:pointer;'+
      'background:var(--hud-form-bg);'+
      'border:1px solid var(--cf7-col,var(--hud-border));'+
      'background-image:linear-gradient(var(--hud-grid-color) 1px,transparent 1px),'+
        'linear-gradient(90deg,var(--hud-grid-color) 1px,transparent 1px);'+
      'background-size:var(--hud-grid-size) var(--hud-grid-size);'+
      'box-shadow:0 0 30px rgba(0,0,0,.65),0 0 18px var(--cf7-glow,transparent);'+
      'opacity:0;pointer-events:none;'+
      'transform:perspective(1500px) rotateY(var(--rotY,0deg));'+
      'transition:left .5s cubic-bezier(.22,.9,.3,1),top .5s cubic-bezier(.22,.9,.3,1),'+
        'width .5s cubic-bezier(.22,.9,.3,1),height .5s cubic-bezier(.22,.9,.3,1),'+
        'transform .5s cubic-bezier(.22,.9,.3,1),opacity .4s ease}'+
    'html.cf-on .cf7-ghost[data-slot="1"],html.cf-on .cf7-ghost[data-slot="-1"]{'+
      'opacity:.92;pointer-events:auto;z-index:9040}'+
    'html.cf-on .cf7-ghost[data-slot="2"],html.cf-on .cf7-ghost[data-slot="-2"]{'+
      'opacity:.5;pointer-events:auto;z-index:9034}'+
    'html.cf-on .cf7-ghost[data-slot="0"]{opacity:0;pointer-events:none;z-index:9030}'+
    '.cf7-ghost:hover{opacity:1 !important}'+
    '.cf7-wrap{position:absolute;left:0;top:30px;transform-origin:top left;'+
      'pointer-events:none;filter:saturate(.6) brightness(.82);width:100%}'+
    '.cf7-pos{position:absolute;top:8px;left:0;right:0;text-align:center;'+
      'font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
      'color:var(--hud-text-dim);z-index:2;text-shadow:0 0 6px #000;pointer-events:none}'+
    '.cf7-brand{display:flex;flex-direction:column;align-items:center;'+
      'justify-content:center;gap:12px;height:100%;padding:20px}'+
    '.cf7-brand-dot{width:14px;height:14px;border-radius:50%;'+
      'background:var(--cf7-col);box-shadow:0 0 14px var(--cf7-col)}'+
    '.cf7-brand-tit{font-size:16px;font-weight:700;letter-spacing:.1em;'+
      'text-transform:uppercase;color:var(--hud-text);text-align:center}'+
    '.cf7-brand-sub{font-size:11px;color:var(--hud-text-dim);text-align:center}'+
    '.cf7-arrow{position:fixed;top:50%;transform:translateY(-50%);z-index:9060;'+
      'width:42px;height:74px;display:flex;align-items:center;justify-content:center;'+
      'background:rgba(10,7,22,.7);border:1px solid var(--hud-border);'+
      'color:var(--hud-text-dim);font-size:20px;cursor:pointer;user-select:none;'+
      'opacity:0;pointer-events:none;transition:opacity .3s,border-color .2s,color .2s}'+
    'html.cf-on .cf7-arrow{opacity:1;pointer-events:auto}'+
    '.cf7-arrow:hover{border-color:var(--hud-border-hov);color:#fff;box-shadow:0 0 16px var(--hud-glow)}'+
    '.cf7-arrow.izq{left:12px}.cf7-arrow.der{right:12px}';
  document.head.appendChild(css);

  var SIDES = { 'left-1':0,'left-2':1,'right-1':2,'right-2':3 };
  var COLORES = {
    'hud-patrimonio':'#22C55E','hud-necesidades':'#A855F7','hud-bitacora':'#C084FC',
    'hud-financiero':'#22D3EE','hud-activity':'#FB923C','hud-fijos':'#67E8F9','hud-variables':'#A5B4FC'
  };
  var NOMBRES = {
    'hud-patrimonio':['Patrimonio','Saldos y apartados'],
    'hud-bitacora':['Bitácora','Registros de vida'],
    'hud-necesidades':['Necesidades','Pirámide Maslow'],
    'hud-fijos':['Fijos','Pagos recurrentes'],
    'hud-financiero':['Financiero','Flujo del mes'],
    'hud-variables':['Variables','Gastos variables'],
    'hud-activity':['Activity+Logros','Hábitos y rachas']
  };
  var PLACEHOLDERS = /^(VER DETALLE COMPLETO|TABLA Y GRÁFICO AL EXPANDIR|VER ANÁLISIS|ABRIR BITÁCORA|VER RESUMEN FINANCIERO|IR A ACTIVITY CHECK)$/i;
  var MARCOS = {};          // id de card -> marco persistente
  var _fresco = {};         // id -> id del centro cuando se montó (refresh al reentrar)
  var _fallos=0,_muerto=false,_navegando=false;
  var _geoFirma='',_geoTimer=null;
  var _aL=null,_aR=null;

  function esLateral(el){ return !!(el && el._side && (el._side in SIDES)); }
  function anillo(){
    if(!window._hudPanels) return [];
    return window._hudPanels
      .map(function(hp){ return hp.el || hp; })
      .filter(esLateral)
      .sort(function(a,b){
        if(a._side !== b._side) return SIDES[a._side]-SIDES[b._side];
        return (a._order||0)-(b._order||0);
      });
  }

  function marcoDe(cardEl){
    if(MARCOS[cardEl.id]) return MARCOS[cardEl.id];
    var g = document.createElement('div');
    g.className = 'cf7-ghost';
    g.innerHTML = '<div class="cf7-pos"></div><div class="cf7-wrap"></div>';
    var col = COLORES[cardEl.id] || '#8b5cf6';
    g.style.setProperty('--cf7-col', col);
    g.style.setProperty('--cf7-glow', col+'55');
    g.addEventListener('click', function(){
      var d = parseInt(g.getAttribute('data-slot')||'0',10);
      if(d !== 0) navegar(d);
    });
    document.body.appendChild(g);
    MARCOS[cardEl.id] = g;
    return g;
  }
  // Rocola: presionar dispara ya; mantener encadena giros hasta soltar.
  var _rocolaID = null;
  function _rocolaStart(dir){
    _rocolaStop();
    navegar(dir);
    _rocolaID = setInterval(function(){
      if(_muerto){ _rocolaStop(); return; }
      if(!_navegando) navegar(dir);
    }, 120);
  }
  function _rocolaStop(){
    if(_rocolaID){ clearInterval(_rocolaID); _rocolaID = null; }
  }
  function _mkFlecha(clase, simbolo, dir){
    var f = document.createElement('div');
    f.className = 'cf7-arrow ' + clase;
    f.textContent = simbolo;
    f.addEventListener('pointerdown', function(e){
      e.preventDefault();
      try{ f.setPointerCapture(e.pointerId); }catch(e2){}
      _rocolaStart(dir);
    });
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){
      f.addEventListener(ev, _rocolaStop);
    });
    document.body.appendChild(f);
    return f;
  }
  function asegurarFlechas(){
    if(!_aL) _aL = _mkFlecha('izq', '◀', -1);
    if(!_aR) _aR = _mkFlecha('der', '▶', +1);
  }
  window.addEventListener('blur', _rocolaStop);

  function montarClon(g, cardEl, innerW){
    var wrap = g.querySelector('.cf7-wrap');
    wrap.innerHTML = '';
    wrap.style.transform = '';
    var col = COLORES[cardEl.id] || '#8b5cf6';

    function neutralizar(n){
      n.removeAttribute('id'); n.removeAttribute('data-cf-ring'); n.removeAttribute('data-cf-center');
      n.classList.remove('hud-pnl','hud-expanded');
      n.querySelectorAll('[id]').forEach(function(x){ x.removeAttribute('id'); });
      return n;
    }
    function copiarCanvas(o, d){
      try {
        var a=o.querySelectorAll('canvas'), b=d.querySelectorAll('canvas');
        for(var i=0;i<a.length&&i<b.length;i++){
          b[i].width=a[i].width; b[i].height=a[i].height;
          var ctx=b[i].getContext('2d');
          if(ctx&&a[i].width>0) ctx.drawImage(a[i],0,0);
        }
      } catch(e){}
    }

    var expC = cardEl.querySelector('.hud-expanded-content');
    if(expC && expC.textContent.trim().length > 60){
      var info = NOMBRES[cardEl.id] || [cardEl.id,''];
      var shell = document.createElement('div');
      shell.style.cssText='width:'+innerW+'px;pointer-events:none';
      shell.innerHTML = '<div style="display:flex;align-items:center;gap:8px;'+
        'padding:10px 14px 8px;font-size:12px;font-weight:700;letter-spacing:.09em;'+
        'text-transform:uppercase;color:var(--hud-text)">'+
        '<span style="width:9px;height:9px;border-radius:50%;background:'+col+
        ';box-shadow:0 0 8px '+col+'"></span>'+info[0]+'</div>';
      var body = neutralizar(expC.cloneNode(true));
      body.style.cssText='display:block;height:auto;max-height:none;overflow:hidden;'+
        'padding:6px 14px;opacity:1;visibility:visible';
      shell.appendChild(body);
      wrap.appendChild(shell);
      copiarCanvas(expC, body);
      return;
    }
    var c = neutralizar(cardEl.cloneNode(true));
    Array.prototype.slice.call(c.querySelectorAll('*')).forEach(function(n){
      var t = (n.textContent||'').trim();
      if(t.length < 40 && PLACEHOLDERS.test(t) && n.parentNode) n.parentNode.removeChild(n);
    });
    if(c.textContent.trim().length >= 12){
      var wReal = cardEl.getBoundingClientRect().width || 330;
      if(wReal < 50) wReal = 330;
      c.style.cssText='position:static;display:block;width:'+Math.round(wReal)+
        'px;opacity:1;visibility:visible;transform:none;animation:none;'+
        'pointer-events:none;margin:0;left:auto;top:auto';
      wrap.appendChild(c);
      copiarCanvas(cardEl, c);
      var esc = Math.min(1, innerW / wReal);
      if(esc < 1) wrap.style.transform = 'scale('+esc.toFixed(3)+')';
      else c.style.margin = '0 auto';
      return;
    }
    var info2 = NOMBRES[cardEl.id] || [cardEl.id,''];
    wrap.innerHTML = '<div class="cf7-brand"><span class="cf7-brand-dot"></span>'+
      '<span class="cf7-brand-tit">'+info2[0]+'</span>'+
      '<span class="cf7-brand-sub">'+info2[1]+'</span></div>';
    wrap.style.height='100%';
  }

  // Geometría de cada slot relativo al centro.
  function slotGeo(d, r){
    var vw = window.innerWidth;
    var w1 = Math.min(470, Math.max(300, r.width*0.46));
    var h1 = Math.round(r.height*0.88);
    var w2 = Math.round(w1*0.8), h2 = Math.round(h1*0.84);
    var t1 = Math.max(60, r.top + (r.height-h1)/2);
    var t2 = Math.max(60, r.top + (r.height-h2)/2);
    if(d === 0)  return { w:Math.round(r.width), h:Math.round(r.height), top:Math.round(r.top), left:Math.round(r.left), rot:0 };
    if(d === -1) return { w:w1,h:h1,top:t1, left:Math.max(4, r.left - w1 + 28), rot:+20 };
    if(d === +1) return { w:w1,h:h1,top:t1, left:Math.min(vw-w1-4, r.right - 28), rot:-20 };
    if(d === -2) return { w:w2,h:h2,top:t2, left:Math.max(2, r.left - w1 + 28 - Math.round(w2*0.5)), rot:+32 };
    if(d === +2) return { w:w2,h:h2,top:t2, left:Math.min(vw-w2-2, r.right - 28 + Math.round(w1*0.5)), rot:-32 };
    if(d < 0)    return { w:w2,h:h2,top:t2, left:-w2-80, rot:+40 };
    return             { w:w2,h:h2,top:t2, left:vw+80,  rot:-40 };
  }

  var _slots = {};   // id -> slot actual (para q007)

  function aplicar(){
    if(_muerto) return;
    try {
      var h = document.documentElement;
      if(h.classList.contains('niv-warp')) return;
      var centro = window._hudExpanded || null;
      var activo = h.classList.contains('niv-1') && centro && esLateral(centro);

      if(!activo){
        if(_navegando) return;
        if(h.classList.contains('cf-on')) limpiar();
        return;
      }
      var aro = anillo();
      var n = aro.length;
      if(n < 2){ limpiar(); return; }
      var idx = aro.indexOf(centro);
      if(idx < 0){ limpiar(); return; }

      asegurarFlechas();
      aro.forEach(function(el){
        if(el === centro){ el.removeAttribute('data-cf-ring'); el.setAttribute('data-cf-center','1'); }
        else { el.removeAttribute('data-cf-center'); el.setAttribute('data-cf-ring','1'); }
      });

      var r = centro.getBoundingClientRect();
      if(r.width < 300) return;
      // v7.099 — ESTABILIZADOR: solo dimensionar con geometria quieta.
      // Si el rect difiere de la lectura anterior (card aun creciendo,
      // regreso de niv-2, resize), guardar y reintentar en 120ms sin
      // escribir nada. Dos lecturas iguales (±3px) = geometria estable.
      var firma = Math.round(r.left)+','+Math.round(r.top)+','+
                  Math.round(r.width)+','+Math.round(r.height);
      if(_geoFirma !== firma){
        _geoFirma = firma;
        clearTimeout(_geoTimer);
        _geoTimer = setTimeout(aplicar, 120);
        return;
      }

      aro.forEach(function(card, i){
        var d = ((i - idx) % n + n) % n;          // 0..n-1
        if(d > n/2) d -= n;                       // camino corto: -3..+3
        var g = marcoDe(card);
        var q = slotGeo(d, r);
        g.setAttribute('data-slot', String(d));
        g.style.width=q.w+'px'; g.style.height=q.h+'px';
        g.style.left=q.left+'px'; g.style.top=q.top+'px';
        g.style.setProperty('--rotY', q.rot+'deg');
        _slots[card.id] = d;
        // Clon: montar/refrescar al entrar al rango visible
        if(Math.abs(d) <= 2 && d !== 0){
          if(_fresco[card.id] !== centro.id){
            var pos = i+1;
            g.querySelector('.cf7-pos').textContent =
              (d<0 ? '◀ ' : '') + pos + ' / ' + n + (d>0 ? ' ▶' : '');
            // refrescar contenido solo si el wrap está vacío o cambió el centro
            montarClon(g, card, q.w - 4);
            _fresco[card.id] = centro.id;
          }
        }
      });

      h.classList.add('cf-on');
      _fallos = 0;
    } catch(e){
      _fallos++;
      if(_fallos >= 3){
        _muerto = true;
        try{ limpiar(); }catch(e2){}
        console.warn('[CoverFlow] auto-desactivado tras 3 fallos:', e.message);
      }
    }
  }

  function limpiar(){
    var h = document.documentElement;
    h.classList.remove('cf-on','cf-nav');
    document.querySelectorAll('.hud-pnl[data-cf-ring],.hud-pnl[data-cf-center]')
      .forEach(function(el){ el.removeAttribute('data-cf-ring'); el.removeAttribute('data-cf-center'); });
    _slots = {};
  }

  function navegar(delta){
    if(_muerto || _navegando) return;
    var centro = window._hudExpanded;
    if(!centro) return;
    var aro = anillo();
    var idx = aro.indexOf(centro);
    if(idx < 0) return;
    var destino = aro[(idx+delta+aro.length*2) % aro.length];
    if(!destino || destino === centro) return;
    _navegando = true;
    var h = document.documentElement;
    h.classList.add('cf-nav');                    // vela del dial
    try {
      // v7.099 — SWAP ATOMICO: _hudExpand nativo maneja "otra expandida"
      // (colapsa sin reposicionar + expande en la MISMA llamada sincrona).
      // _hudExpanded jamas es null entre medias -> el nivel jamas cae a 0.
      if(typeof window._hudExpand === 'function') window._hudExpand(destino);
      var intentos = 0;
      (function release(){
        intentos++;
        if((window._hudExpanded === destino && h.classList.contains('niv-1')) || intentos > 14){
          _navegando = false;
          aplicar();                              // slots nuevos → todo se desliza
          setTimeout(function(){ h.classList.remove('cf-nav'); }, 140);
        } else setTimeout(release, 60);
      })();
    } catch(e){
      _navegando = false;
      h.classList.remove('cf-nav');
    }
  }

  function hookear(){
    if(typeof window._hudExpand === 'function' && !window._hudExpand._cf4){
      var oe = window._hudExpand;
      var we = function(){
        var r = oe.apply(this, arguments);
        // v7.113b — DOBLE APLICAR: la card expandida tiene transition .42s.
        // Si solo aplicamos a los 90ms, medimos la card a MEDIO crecer y
        // los marcos laterales quedan pequeños. Forzamos reset del
        // estabilizador y un segundo aplicar a los 480ms cuando la
        // animacion ya termino y el rect es el final real.
        setTimeout(aplicar, 90);
        setTimeout(function(){ _geoFirma = ''; aplicar(); }, 480);
        return r;
      };
      we._cf4 = true; window._hudExpand = we;
    }
    if(typeof window._hudCollapse === 'function' && !window._hudCollapse._cf4){
      var oc = window._hudCollapse;
      var wc = function(){
        var r = oc.apply(this, arguments);
        setTimeout(aplicar, 90);
        setTimeout(function(){ _geoFirma = ''; aplicar(); }, 480);
        return r;
      };
      wc._cf4 = true; window._hudCollapse = wc;
    }
    if(!window._hudExpand || !window._hudExpand._cf4) setTimeout(hookear, 400);
  }
  hookear();
  setInterval(aplicar, 500);

  document.addEventListener('keydown', function(e){
    if(_muerto) return;
    if(!document.documentElement.classList.contains('cf-on')) return;
    if(e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    if(e.key === 'ArrowLeft'){ e.preventDefault(); navegar(-1); }
    if(e.key === 'ArrowRight'){ e.preventDefault(); navegar(+1); }
  });

  window._coverflow = {
    estado: function(){
      var aro = anillo();
      return {
        activo: document.documentElement.classList.contains('cf-on'),
        girando: _navegando,
        muerto: _muerto, fallos: _fallos,
        centro: window._hudExpanded ? window._hudExpanded.id : null,
        slots: Object.keys(_slots).map(function(k){
          return k.replace('hud-','').slice(0,3)+':'+_slots[k];
        }).join(' '),
        aro: aro.map(function(el){ return el.id; })
      };
    },
    navegar: navegar
  };
})();
