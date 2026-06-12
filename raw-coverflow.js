/* RAW Entry — Cover Flow Nivel 1 v.7.095 (carrusel 5 cards + giro 3D)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ "Estoy dentro del dial y las cards giran a mi alrededor"          ║
   ╚══════════════════════════════════════════════════════════════════╝
   · 5 cards: central (expansión nativa) + 2 marcos por lado. La 2a
     capa asoma detrás de la 1a, más pequeña y profunda.
   · Inclinación rotateY (±16° capa 1, ±26° capa 2) con perspectiva.
   · GIRO direccional: al navegar todo se desliza un slot con rotación
     (cf-turn-izq/der) y re-encaja con snap invisible. Sin fades.
   · CLONES dignos: prefieren .hud-expanded-content si tiene datos;
     si no, compacta SIN placeholders ("Ver detalle completo" etc.);
     si no queda nada, panel de marca (título+color). JAMÁS upscale.
   · Sin recálculo de geometría durante niv-warp (fix "achurradas").
   · La navegación no se libera hasta confirmar niv-1 (fix flash de
     compactas que 007 capturó en 92.2s/128.8s/153.4s).
   · Barras top/bottom atenuadas en cf-on (foco en el carrusel).
   Reglas vigentes: cero escrituras sobre cards reales, cero
   MutationObserver, cero hook de _reposicionarHUD, cortacircuitos.
*/
(function(){
  'use strict';

  try {
    document.documentElement.classList.remove('coverflow-on','cf-on','cf-girando','cf-turn-izq','cf-turn-der','cf-snap');
    document.querySelectorAll('[data-cf],[data-cf-ring],[data-cf-center]').forEach(function(el){
      el.removeAttribute('data-cf'); el.removeAttribute('data-cf-ring'); el.removeAttribute('data-cf-center');
    });
    ['coverflow-css','cf4-css','cf5-css','cf6-css'].forEach(function(id){
      var n=document.getElementById(id); if(n&&n.parentNode) n.parentNode.removeChild(n);
    });
    document.querySelectorAll('.cf-arrows,.cf4-ghost,.cf4-arrow,.cf5-ghost,.cf5-arrow,.cf6-ghost,.cf6-arrow').forEach(function(n){
      if(n.parentNode) n.parentNode.removeChild(n);
    });
  } catch(e){}

  if(window.innerWidth < 900) return;

  /* ════════ CSS ════════ */
  var css = document.createElement('style');
  css.id = 'cf6-css';
  css.textContent =
    'html.cf-on .hud-pnl[data-cf-ring]{opacity:0 !important;visibility:hidden !important;'+
      'pointer-events:none !important;transition:opacity .3s ease,visibility 0s linear .3s}'+
    /* foco: top/bottom atenuadas sin moverlas */
    'html.cf-on .hud-pnl:not([data-cf-center]):not([data-cf-ring]){opacity:.3;'+
      'transition:opacity .35s ease}'+
    /* marcos del carrusel */
    '.cf6-ghost{position:fixed;overflow:hidden;cursor:pointer;'+
      'background:var(--hud-form-bg);'+
      'border:1px solid var(--cf6-col,var(--hud-border));'+
      'background-image:linear-gradient(var(--hud-grid-color) 1px,transparent 1px),'+
        'linear-gradient(90deg,var(--hud-grid-color) 1px,transparent 1px);'+
      'background-size:var(--hud-grid-size) var(--hud-grid-size);'+
      'box-shadow:0 0 30px rgba(0,0,0,.65),0 0 18px var(--cf6-glow,transparent);'+
      'opacity:0;pointer-events:none;'+
      'transform:perspective(1400px) translateX(var(--turnX,0px)) rotateY(var(--rotY,0deg));'+
      'transition:opacity .35s ease,left .38s cubic-bezier(.3,.8,.35,1),'+
        'top .3s ease,width .3s ease,height .3s ease,'+
        'transform .38s cubic-bezier(.3,.8,.35,1)}'+
    'html.cf-on .cf6-ghost.capa-1{opacity:.92;pointer-events:auto;z-index:9040}'+
    'html.cf-on .cf6-ghost.capa-2{opacity:.5;pointer-events:auto;z-index:9034}'+
    '.cf6-ghost:hover{opacity:1 !important}'+
    /* giro: todo se desliza un slot en la dirección */
    'html.cf-turn-der .cf6-ghost{--turnX:-150px}'+
    'html.cf-turn-izq .cf6-ghost{--turnX:150px}'+
    'html.cf-snap .cf6-ghost{transition:none !important}'+
    '.cf6-wrap{position:absolute;left:0;top:30px;transform-origin:top left;'+
      'pointer-events:none;filter:saturate(.6) brightness(.82);width:100%}'+
    '.cf6-pos{position:absolute;top:8px;left:0;right:0;text-align:center;'+
      'font-size:10px;letter-spacing:.14em;text-transform:uppercase;'+
      'color:var(--hud-text-dim);z-index:2;text-shadow:0 0 6px #000;pointer-events:none}'+
    '.cf6-brand{display:flex;flex-direction:column;align-items:center;'+
      'justify-content:center;gap:12px;height:100%;padding:20px}'+
    '.cf6-brand-dot{width:14px;height:14px;border-radius:50%;'+
      'background:var(--cf6-col);box-shadow:0 0 14px var(--cf6-col)}'+
    '.cf6-brand-tit{font-size:16px;font-weight:700;letter-spacing:.1em;'+
      'text-transform:uppercase;color:var(--hud-text);text-align:center}'+
    '.cf6-brand-sub{font-size:11px;color:var(--hud-text-dim);text-align:center}'+
    '.cf6-arrow{position:fixed;top:50%;transform:translateY(-50%);z-index:9060;'+
      'width:42px;height:74px;display:flex;align-items:center;justify-content:center;'+
      'background:rgba(10,7,22,.7);border:1px solid var(--hud-border);'+
      'color:var(--hud-text-dim);font-size:20px;cursor:pointer;user-select:none;'+
      'opacity:0;pointer-events:none;transition:opacity .3s,border-color .2s,color .2s}'+
    'html.cf-on .cf6-arrow{opacity:1;pointer-events:auto}'+
    '.cf6-arrow:hover{border-color:var(--hud-border-hov);color:#fff;box-shadow:0 0 16px var(--hud-glow)}'+
    '.cf6-arrow.izq{left:12px}.cf6-arrow.der{right:12px}';
  document.head.appendChild(css);

  /* ════════ ESTADO ════════ */
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
  var F = {};                       // marcos: L2,L1,R1,R2
  var _cloneIds = {};               // marco -> id clonado
  var _fallos=0,_muerto=false,_navegando=false;
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

  /* ════════ MARCOS ════════ */
  function _mkGhost(clave, lado, capa, pasos){
    var g = document.createElement('div');
    g.className = 'cf6-ghost lado-'+lado+' capa-'+capa;
    g.innerHTML = '<div class="cf6-pos"></div><div class="cf6-wrap"></div>';
    g.addEventListener('click', function(){ navegar(lado==='izq' ? -pasos : +pasos); });
    document.body.appendChild(g);
    F[clave] = g;
    return g;
  }
  function asegurarUI(){
    if(!F.L1) _mkGhost('L1','izq',1,1);
    if(!F.L2) _mkGhost('L2','izq',2,2);
    if(!F.R1) _mkGhost('R1','der',1,1);
    if(!F.R2) _mkGhost('R2','der',2,2);
    if(!_aL){ _aL=document.createElement('div'); _aL.className='cf6-arrow izq'; _aL.textContent='◀';
      _aL.addEventListener('click',function(){ navegar(-1); }); document.body.appendChild(_aL); }
    if(!_aR){ _aR=document.createElement('div'); _aR.className='cf6-arrow der'; _aR.textContent='▶';
      _aR.addEventListener('click',function(){ navegar(+1); }); document.body.appendChild(_aR); }
  }

  // Clon digno: expandido > compacta sin placeholders > panel de marca.
  function montarClon(g, cardEl, etiqueta, innerW){
    var col = COLORES[cardEl.id] || '#8b5cf6';
    g.style.setProperty('--cf6-col', col);
    g.style.setProperty('--cf6-glow', col+'55');
    g.querySelector('.cf6-pos').textContent = etiqueta;
    var wrap = g.querySelector('.cf6-wrap');
    wrap.innerHTML = '';
    wrap.style.transform = '';

    function neutralizar(n){
      n.removeAttribute('id');
      n.removeAttribute('data-cf-ring');
      n.removeAttribute('data-cf-center');
      n.classList.remove('hud-pnl','hud-expanded');
      n.querySelectorAll('[id]').forEach(function(x){ x.removeAttribute('id'); });
      return n;
    }
    function copiarCanvas(origRoot, dupRoot){
      try {
        var o=origRoot.querySelectorAll('canvas'), d=dupRoot.querySelectorAll('canvas');
        for(var i=0;i<o.length&&i<d.length;i++){
          d[i].width=o[i].width; d[i].height=o[i].height;
          var ctx=d[i].getContext('2d');
          if(ctx&&o[i].width>0) ctx.drawImage(o[i],0,0);
        }
      } catch(e){}
    }

    // 1) Contenido EXPANDIDO si tiene datos reales
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

    // 2) Compacta SIN placeholders
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
      var escala = Math.min(1, innerW / wReal);   // JAMÁS upscale
      if(escala < 1) wrap.style.transform = 'scale('+escala.toFixed(3)+')';
      else c.style.margin = '0 auto';
      return;
    }

    // 3) Panel de marca (nunca un esqueleto con "ver detalle")
    var info2 = NOMBRES[cardEl.id] || [cardEl.id,''];
    wrap.innerHTML = '<div class="cf6-brand">'+
      '<span class="cf6-brand-dot"></span>'+
      '<span class="cf6-brand-tit">'+info2[0]+'</span>'+
      '<span class="cf6-brand-sub">'+info2[1]+'</span></div>';
    wrap.style.height='100%';
  }

  /* ════════ APLICAR ════════ */
  function aplicar(){
    if(_muerto) return;
    try {
      var h = document.documentElement;
      if(h.classList.contains('niv-warp')) return;   // geometría en vuelo: no medir
      var centro = window._hudExpanded || null;
      var activo = h.classList.contains('niv-1') && centro && esLateral(centro);

      if(!activo){
        if(_navegando) return;                        // sostener durante el giro
        if(h.classList.contains('cf-on')) limpiar();
        return;
      }

      var aro = anillo();
      if(aro.length < 2){ limpiar(); return; }
      var idx = aro.indexOf(centro);
      if(idx < 0){ limpiar(); return; }

      asegurarUI();
      var n = aro.length;
      var vecinos = {
        L1: aro[(idx-1+n)%n], L2: aro[(idx-2+n)%n],
        R1: aro[(idx+1)%n],   R2: aro[(idx+2)%n]
      };

      aro.forEach(function(el){
        if(el === centro){ el.removeAttribute('data-cf-ring'); el.setAttribute('data-cf-center','1'); }
        else { el.removeAttribute('data-cf-center'); el.setAttribute('data-cf-ring','1'); }
      });

      var r = centro.getBoundingClientRect();
      if(r.width < 300) return;                       // esperar geometría estable
      var w1 = Math.min(470, Math.max(300, r.width*0.46));
      var h1 = Math.round(r.height*0.88);
      var w2 = Math.round(w1*0.8), h2 = Math.round(h1*0.84);
      var t1 = Math.max(60, r.top + (r.height-h1)/2);
      var t2 = Math.max(60, r.top + (r.height-h2)/2);
      var geo = {
        L1: { w:w1,h:h1,top:t1, left: Math.max(4, r.left - w1 + 28),            rot:+16 },
        R1: { w:w1,h:h1,top:t1, left: Math.min(window.innerWidth-w1-4, r.right - 28), rot:-16 },
        L2: { w:w2,h:h2,top:t2, left: Math.max(2, r.left - w1 + 28 - Math.round(w2*0.5)), rot:+26 },
        R2: { w:w2,h:h2,top:t2, left: Math.min(window.innerWidth-w2-2, r.right - 28 + Math.round(w1*0.5)), rot:-26 }
      };
      ['L1','R1','L2','R2'].forEach(function(k){
        var g=F[k], q=geo[k];
        g.style.width=q.w+'px'; g.style.height=q.h+'px';
        g.style.left=q.left+'px'; g.style.top=q.top+'px';
        g.style.setProperty('--rotY', q.rot+'deg');
        if(_cloneIds[k] !== vecinos[k].id){
          var pos = aro.indexOf(vecinos[k])+1;
          var lbl = (k[0]==='L' ? '◀ ' : '') + pos + ' / ' + n + (k[0]==='R' ? ' ▶' : '');
          montarClon(g, vecinos[k], lbl, q.w - 4);
          _cloneIds[k] = vecinos[k].id;
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
    h.classList.remove('cf-on','cf-turn-izq','cf-turn-der','cf-snap');
    document.querySelectorAll('.hud-pnl[data-cf-ring],.hud-pnl[data-cf-center]')
      .forEach(function(el){ el.removeAttribute('data-cf-ring'); el.removeAttribute('data-cf-center'); });
    _cloneIds = {};
    Object.keys(F).forEach(function(k){
      var w=F[k] && F[k].querySelector('.cf6-wrap'); if(w) w.innerHTML='';
    });
  }

  /* ════════ NAVEGAR — giro con confirmación de niv-1 ════════ */
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
    h.classList.add(delta>0 ? 'cf-turn-der' : 'cf-turn-izq');
    try {
      setTimeout(function(){
        try{ if(typeof window._hudCollapse==='function') window._hudCollapse(); }catch(e){}
        setTimeout(function(){
          try{ if(typeof window._hudExpand==='function') window._hudExpand(destino); }catch(e){}
          // No liberar hasta confirmar niv-1 (fix flash de compactas)
          var intentos = 0;
          (function release(){
            intentos++;
            if(h.classList.contains('niv-1') || intentos > 14){
              aplicar();                                   // nuevos vecinos
              h.classList.add('cf-snap');                  // snap invisible
              h.classList.remove('cf-turn-izq','cf-turn-der');
              requestAnimationFrame(function(){
                requestAnimationFrame(function(){
                  h.classList.remove('cf-snap');
                  _navegando = false;
                  aplicar();
                });
              });
            } else setTimeout(release, 60);
          })();
        }, 70);
      }, 130);                                             // se aprecia el arranque del giro
    } catch(e){
      _navegando = false;
      h.classList.remove('cf-turn-izq','cf-turn-der','cf-snap');
    }
  }

  /* ════════ REACTIVIDAD ════════ */
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
        girando: /cf-turn/.test(document.documentElement.className),
        muerto: _muerto, fallos: _fallos,
        centro: window._hudExpanded ? window._hudExpanded.id : null,
        clones: [_cloneIds.L2,_cloneIds.L1,_cloneIds.R1,_cloneIds.R2],
        aro: aro.map(function(el){ return el.id; })
      };
    },
    navegar: navegar
  };
})();
