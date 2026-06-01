/* RAW Entry — Loading Web v.7.064
   ╔══════════════════════════════════════════════════════════════════╗
   ║ FASE v7.064 — ARRANQUE FLUIDO EN WEB                             ║
   ╚══════════════════════════════════════════════════════════════════╝
   El problema: al arrancar la app en web, el navegador tiene que:
     1. Construir el dial y el cosmos.
     2. Construir 14 cards HUD con SVG corners, estilos, listeners.
     3. Llamar 8 endpoints de Apps Script en paralelo (~3-6 segundos).
     4. Renderizar los datos en cada card.
   Todo eso peleando por el mismo hilo. Resultado: web se siente lenta
   los primeros segundos. En móvil esto no pasa porque las cards son
   shells vacíos (v7.060) — el cosmos se respira limpio.

   La solución: aplicar el patrón móvil al arranque web.
     · Las cards .hud-pnl nacen con opacity:0 + pointer-events:none.
     · Una BARRA DE PROGRESO sutil arriba del dial indica "cargando".
     · Cuando los datos llegan (api.getAll() resuelve), la barra hace
       un destello breve, el <html> recibe la clase .hud-listo, y las
       cards aparecen con una CASCADA suave (cada una con un retraso
       de 80ms — sensación orquestada, no popping).
   Solo escritorio. Móvil ya está bien.

   La barra es "honesta-de-mentira": avanza con curva suave fingiendo
   progreso real. No mide computo, pero el usuario tampoco lo nota —
   solo nota que la app SE SIENTE viva en vez de quieta.
*/
(function(){
  'use strict';

  // Solo escritorio. Móvil tiene su propia experiencia fluida.
  if(window.innerWidth < 900) return;

  // ── Estado ──
  var _barra;
  var _pista;
  var _progreso = 0;        // 0 a 100
  var _terminado = false;
  var _rafProgreso = 0;

  /* ── Construir la UI ──────────────────────────────────────────── */
  function construirBarra(){
    // Pista fina arriba (estilo Apple/Linear)
    _pista = document.createElement('div');
    _pista.id = 'loading-track';
    _pista.style.cssText = [
      'position:fixed','top:0','left:0','right:0','height:2px',
      'background:rgba(139,92,246,0.06)','z-index:100000',
      'pointer-events:none','transition:opacity .55s ease'
    ].join(';');

    _barra = document.createElement('div');
    _barra.id = 'loading-bar';
    _barra.style.cssText = [
      'position:absolute','top:0','left:0','height:100%','width:0%',
      'background:linear-gradient(90deg, rgba(167,139,250,0.85) 0%, rgba(34,211,238,0.85) 100%)',
      'box-shadow:0 0 14px rgba(167,139,250,0.6)',
      'transition:width .35s cubic-bezier(.4,0,.2,1)'
    ].join(';');
    _pista.appendChild(_barra);
    document.body.appendChild(_pista);
  }

  /* ── Avance simulado ─────────────────────────────────────────────
     Curva: avanza rápido al principio, va frenando al acercarse al
     90%, y se queda esperando ahí hasta que el evento real "terminado"
     llegue. Así, si los datos tardan más de lo esperado, la barra no
     se queda fija — sigue moviéndose despacio. */
  function paso(){
    if(_terminado) return;
    var t = _progreso / 100;
    var velocidad;
    if(t < 0.30)      velocidad = 1.6;   // arranque vivo
    else if(t < 0.65) velocidad = 0.85;
    else if(t < 0.85) velocidad = 0.35;
    else              velocidad = 0.08;  // casi en suspenso al final
    _progreso = Math.min(92, _progreso + velocidad);
    if(_barra) _barra.style.width = _progreso + '%';
    _rafProgreso = setTimeout(paso, 90);
  }

  /* ── Terminar con destello ──────────────────────────────────────
     Sube la barra a 100% rápido, hace un parpadeo de luz, y luego
     desvanece la pista entera. */
  function terminar(){
    if(_terminado) return;
    _terminado = true;
    clearTimeout(_rafProgreso);
    if(_barra){
      _barra.style.transition = 'width .35s cubic-bezier(.4,0,.2,1), box-shadow .35s';
      _barra.style.width = '100%';
      _barra.style.boxShadow = '0 0 24px rgba(167,139,250,0.95), 0 0 48px rgba(167,139,250,0.5)';
    }
    // Disparar la cascada de cards: clase .hud-listo en <html>
    setTimeout(function(){
      document.documentElement.classList.add('hud-listo');
    }, 220);
    // Desvanecer la pista
    setTimeout(function(){
      if(_pista) _pista.style.opacity = '0';
    }, 700);
    setTimeout(function(){
      if(_pista && _pista.parentNode) _pista.parentNode.removeChild(_pista);
    }, 1400);
  }

  /* ── Hook: detectar cuándo los datos están listos ───────────────
     La forma más segura sin tocar raw-core/raw-dashboard: envolver
     api.getAll() para que cuando resuelva, terminemos el loading. */
  function engancharApi(){
    if(!window.api || typeof window.api.getAll !== 'function'){
      // Reintenta — api se define dentro del closure de raw-core,
      // puede no estar lista al primer instante.
      return setTimeout(engancharApi, 60);
    }
    if(window.api.getAll._loadingEnvuelto) return;
    var orig = window.api.getAll;
    var envuelto = function(){
      var p = orig.apply(this, arguments);
      // Cuando termina la PRIMERA carga, disparamos terminar().
      // Las siguientes llamadas (refrescos) no relanzan loading.
      if(p && typeof p.then === 'function' && !envuelto._yaDisparado){
        envuelto._yaDisparado = true;
        p.then(function(){ terminar(); })
         .catch(function(){ terminar(); });   // aun con error, quitar barra
      }
      return p;
    };
    envuelto._loadingEnvuelto = true;
    window.api.getAll = envuelto;
  }

  /* ── Arranque ────────────────────────────────────────────────── */
  function init(){
    construirBarra();
    paso();
    engancharApi();
    // Salvavidas: si por lo que sea api.getAll no se llamó en 14s,
    // terminamos solos para no dejar al usuario con la barra para siempre.
    setTimeout(function(){
      if(!_terminado) terminar();
    }, 14000);
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
