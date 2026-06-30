/* RAW Entry — Sistema de Niveles v.7.118  (reset duro + grid invalidado al 1→0)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ v7.075 — WATCHDOG v2: FONDO CORRECTO EN TODOS LOS NIVELES       ║
   ╚══════════════════════════════════════════════════════════════════╝
   Bug 1: el blur de niveles (clases niv-0/1/2 en <html>) se quedaba
   PEGADO al volver a Home. Causa: la transición por scroll sí llama
   aplicarProfundidad(), pero hay caminos que cambian el nivel sin
   pasar por ahí (cerrar la card expandida con clic, botón HOME, el
   wrapper de _osMostrar que fuerza nivel 1). El <html> se quedaba
   con niv-1/niv-2 estando visualmente en nivel 0 → blur fijo.
   Bug 2: al picar rápido entre pestañas, el Home quedaba vacío —
   cards/dial con opacity:0 + visibility:hidden inline (residuo del
   apagado instantáneo de nivel 2 cuyo backup capturó valores en
   plena transición).
   Fix: WATCHDOG cada 600ms (solo escritorio) que (a) sincroniza la
   clase niv-X con nivelReal() — la fuente de verdad que ya existía —
   y (b) en Home, restaura elementos con la firma exacta del apagado
   N2. No toca transforms, ni _reposicionarHUD, ni el motor cósmico.
   ╔══════════════════════════════════════════════════════════════════╗
   ║ NAVEGACIÓN POR PROFUNDIDAD — los 3 niveles encadenados            ║
   ╚══════════════════════════════════════════════════════════════════╝
   v7 reemplaza los saltos sueltos (clic en card, clic en pestaña) por
   un EJE DE PROFUNDIDAD continuo. Bajar = sumergirse, subir = emerger.

     NIVEL 0  →  Overlay: dial + cards compactas      (la superficie)
     NIVEL 1  →  Card expandida (modo carrusel)       (profundizar)
     NIVEL 2  →  Sección a pantalla completa          (el núcleo)

   FASE 1 = solo la MECÁNICA. Este módulo NO reescribe el overlay ni el
   router: los ORQUESTA. Invoca funciones que YA existen en v6:
     · Nivel 0→1 : window._hudExpand(panelFinanciero)
     · Nivel 1→0 : window._hudCollapse()
     · Nivel 1→2 : window._osMostrar('activity')
     · Nivel 2→1 : window._osMostrar('home') + reexpandir card
   Si algo falla, el problema vive AQUÍ y en ningún otro archivo. v6
   sigue intacto debajo.

   ── MEDIDOR DE INTENCIÓN ──
   El nivel no cambia con un toquecito de scroll. Hay un medidor 0..100
   que se llena acumulando scroll hacia adentro y se vacía hacia afuera.
   Solo al llegar a 100 se cruza de nivel. Si sueltas a medio camino,
   el medidor se devuelve a 0 (efecto liga). Cruzar es una DECISIÓN.

   ── 3 FORMAS DE NAVEGAR (todas mueven el mismo medidor) ──
   · Scroll del mouse / trackpad.
   · Wheel circular estilo iPod (abajo-derecha).
   · Barra vertical de nivel con marcador (lado derecho).

   ── ENGANCHE EN SECCIONES ──
   Dentro de una sección con scroll propio (Activity Check), el scroll
   de NIVEL solo "engancha" cuando el scroll interno ya llegó al tope.
   Primero se scrollea el contenido; solo al límite, sube de nivel.

   FASE 1: solo escritorio (>=900px). En móvil manda raw-carousel.js.
   FASE 1: mecánica, sin las transiciones de inmersión vistosas (Fase 2).
*/
(function(){
  'use strict';

  var MOB_BP = 900;                       // <900px = móvil → no actúa
  function esEscritorio(){ return window.innerWidth >= MOB_BP; }

  // ── Configuración de los niveles ──
  var NIVEL_MIN = 0, NIVEL_MAX = 2;
  var CARD_ENTRADA = 'hud-financiero';     // card que se expande al bajar a N1
  var SECCION_N2   = 'activity';           // sección del Nivel 2

  // ── Estado ──
  var _nivel    = 0;        // nivel actual (0,1,2)
  var _medidor  = 0;        // 0..100 — acumulador de intención
  var _dir      = 0;        // dirección de la última acumulación (+1 adentro, -1 afuera)
  var _bloqueado = false;   // true mientras una transición de nivel está en curso
  var _ligaRAF  = 0;        // rAF del efecto liga (devolver el medidor a 0)
  var _ultScrollTS = 0;     // timestamp del último evento de scroll

  // Cuánto scroll hace falta para cruzar (más alto = hay que empujar más)
  // v7.003: umbral 64 → 30. Con PASO_SCROLL ~7, cruzar toma unos 4-5
  // giros de rueda. Punto fluido pero con una pizca de intención (no
  // un toque accidental). Si aún se siente duro, revisar LIGA_VEL.
  var UMBRAL       = 30;
  var PASO_SCROLL  = 7;     // cuánto suma cada "tick" de rueda
  var LIGA_VEL     = 4;     // velocidad de retorno del medidor a 0

  /* ════════════════════════════════════════════════════════════════
     LECTURA DEL ESTADO REAL DE v6
     El módulo no asume nada: pregunta al overlay/router en qué está.
  ════════════════════════════════════════════════════════════════ */
  // Deriva el nivel real observando v6, por si algo cambió por fuera
  // (p.ej. el usuario tocó una pestaña directamente).
  function nivelReal(){
    if(window._osSeccion && window._osSeccion !== 'home') return 2;
    if(window._hudExpanded) return 1;
    return 0;
  }

  // Sincroniza _nivel con la realidad antes de cada operación.
  function sync(){
    var real = nivelReal();
    if(real !== _nivel){
      _nivel = real;
      _medidor = 0;
      pintarBarra();
    }
  }

  /* ════════════════════════════════════════════════════════════════
     TRANSICIONES — invocan las funciones que YA existen en v6
  ════════════════════════════════════════════════════════════════ */
  function panelEntrada(){
    return document.getElementById(CARD_ENTRADA);
  }

  /* ── FASE 2 — el efecto de inmersión ──────────────────────────────
     Pinta la "profundidad" del nivel actual sin pelear transforms con
     v6: se usa solo filter:blur + opacity + clases CSS. v6 nunca toca
     filter, así que no hay conflicto.
       Nivel 0 → fondo nítido, dial nítido.       (la superficie)
       Nivel 1 → fondo con blur leve, dial difuso. (te sumergiste)
       Nivel 2 → fondo más borroso aún.            (el núcleo)
     El <html> recibe una clase niv-0/1/2 y el CSS hace el resto. */
  function aplicarProfundidad(nivel){
    var h = document.documentElement;
    h.classList.remove('niv-0','niv-1','niv-2');
    h.classList.add('niv-' + nivel);
  }

  /* v7.031 — marca la ventana de transición con la clase niv-warp en
     <html>. El CSS solo aplica el "jalón en Z" de secciones y card
     expandida MIENTRAS esta clase está puesta — fuera de ella manda v6
     y todo queda en su sitio. Se quita sola tras la animación (.95s). */
  var _warpClaseTO = 0;
  function marcarWarp(){
    var h = document.documentElement;
    h.classList.add('niv-warp');
    if(_warpClaseTO) clearTimeout(_warpClaseTO);
    _warpClaseTO = setTimeout(function(){
      h.classList.remove('niv-warp');
      // v7.081 — al cerrar el warp limpiamos los transforms inline que
      // el CSS de niv-warp pudo dejar inertes en el dial. Sin esto, al
      // volver a niv-0 desde niv-2 (clic en pestaña + scroll arriba),
      // el dial quedaba pegado arriba-izquierda con el ultimo transform.
      var ov = document.getElementById('dial-overlay');
      if(ov){
        // v7.092 — SOLO limpiar el overlay. Borrar los transforms de los
        // HIJOS (v7.081) era un error: el dial se CENTRA con un transform
        // inline calculado por JS; al borrarlo caia a la esquina
        // superior-izquierda. Ese era el origen del dial descolocado.
        ov.style.transform = '';
        ov.style.opacity = '';
      }
      // v7.117 — REPOSICIONAR INTELIGENTE tras warp:
      //   · Si nivel destino es 1 CON card expandida → si reposicionar
      //     (caso Cover Flow regresando de 2→1, card aplastada en 352px).
      //   · Si nivel destino es 0 SIN card expandida → si reposicionar
      //     (caso 1→0 o 2→0 ya estaba en v7.084, lo mantenemos).
      //   · Caso especial: NIVEL 0 con _pUser.style.top fuera de rango
      //     normal (>200px) indica valores corruptos del warp; reposicionar
      //     para recuperar layout.
      // El motivo del bug raiz de v7.116: llamar _reposicionarHUD durante
      // transicion a niv-0 capturaba _pUser en posicion intermedia (291px)
      // y rompia todo. Ahora solo lo llamamos cuando es seguro y util.
      var _nivDestino = h.className.match(/niv-(\d)/);
      _nivDestino = _nivDestino ? _nivDestino[1] : null;
      var _enNivel1ConExpand = (_nivDestino === '1') && !!window._hudExpanded;
      var _enNivel0SinExpand = (_nivDestino === '0') && !window._hudExpanded;

      // v7.118 — RESET DURO en nivel 0, AQUÍ (pantalla ya quieta tras el
      // warp de 1150ms). Antes lo hacíamos antes del warp y se contaminaba.
      // Al llegar a niv-0, los paneles conservaban dimensiones residuales
      // del modo expandido (financiero alto 193 con inner 384 → descuadre,
      // cards a Y=806). Limpiamos width/height/transform de TODOS los
      // paneles no-expandidos e invalidamos el grid, justo antes de
      // reposicionar, para que se recalculen desde cero en sus celdas.
      if(_enNivel0SinExpand){
        if(window._GRID) window._GRID.medido = false;
        (window._hudPanels || []).forEach(function(hp){
          if(!hp || !hp.el) return;
          if(hp.el.classList.contains('hud-expanded')) return;
          hp.el.style.width     = '';
          hp.el.style.height    = '';
          hp.el.style.minHeight = '';
          hp.el.style.maxHeight = '';
          hp.el.style.transform = '';
          hp.el.style.clipPath  = '';
          hp.el._zonaY = undefined;
          hp.el._zonaH = undefined;
          var inner = hp.el.querySelector(':scope > [id$="-inner"]');
          if(inner){ inner.style.minHeight = ''; inner.style.maxHeight = ''; }
        });
      }

      if((_enNivel1ConExpand || _enNivel0SinExpand) &&
         typeof window._reposicionarHUD === 'function'){
        try { window._reposicionarHUD(); } catch(e){}
        if(_enNivel1ConExpand && typeof window._hudAjustarTamañoExpandido === 'function'){
          try { window._hudAjustarTamañoExpandido(); } catch(e){}
        }
      }
    }, 1150);
  }

  /* ── v7.041 — NIVEL 2: cruce limpio ───────────────────────────────
     mostrarSeccionN2: apaga el overlay de forma INSTANTÁNEA (sin el
     fade de 280ms de cerrarDial, que es lo que hacía parpadear el dial)
     y muestra la board-face de Activity. El fondo cósmico es un canvas
     aparte y NO se apaga — sigue vivo, así que el warp se ve.
     ocultarSeccionN2: lo inverso — oculta la sección y re-enciende el
     overlay instantáneo, sin cascada. */
  function _apagarOverlayInstant(){
    // v7.047 — los IDs de los hijos del overlay no coincidían con los
    // que yo asumía (no es 'dial-canvas' sino sin id; no es 'dial-ring'
    // sino 'dial-ring-breath'; no es 'dial-glow' sino 'dial-ambient').
    // Mi apagado no apagaba nada → el dial seguía visible. Solución:
    // apagar TODOS los hijos directos del overlay EXCEPTO el canvas de
    // partículas (el fondo cósmico, que es el único que debe quedarse).
    var ov = document.getElementById('dial-overlay');
    if(ov){
      Array.prototype.forEach.call(ov.children, function(child){
        if(child.id === 'dial-particles') return;   // el fondo SE QUEDA
        if(!child._n2Backup){
          // v7.076 — si el apagado atrapa al elemento a MEDIA animación
          // (opacity '0' / visibility 'hidden' inline), NO memorizar ese
          // estado: el restore lo dejaría invisible para siempre ("todo
          // en blanco" al subir de Nivel 2 tras entrar por pestaña). El
          // destino correcto de restauración es su estado de stylesheet.
          var _op = child.style.opacity, _vi = child.style.visibility;
          if(_op !== '' && parseFloat(_op) < 0.05) _op = '';
          if(_vi === 'hidden') _vi = '';
          child._n2Backup = {
            transition: child.style.transition,
            opacity: _op,
            visibility: _vi
          };
        }
        child.style.transition = 'none';
        child.style.opacity = '0';
        child.style.visibility = 'hidden';
      });
      // Overlay queda visible (para el fondo) pero no captura clics.
      ov.style.pointerEvents = 'none';
    }
    // Apagar todas las cards HUD (que cuelgan de <body>).
    document.querySelectorAll('.hud-pnl').forEach(function(p){
      if(!p._n2Backup){
        // v7.076 — mismo saneo que los hijos del overlay: jamás
        // memorizar un estado invisible/inerte como destino de restore.
        var _pop = p.style.opacity, _pvi = p.style.visibility, _ppe = p.style.pointerEvents;
        if(_pop !== '' && parseFloat(_pop) < 0.05) _pop = '';
        if(_pvi === 'hidden') _pvi = '';
        if(_ppe === 'none') _ppe = '';
        p._n2Backup = {
          transition: p.style.transition,
          opacity: _pop,
          pointerEvents: _ppe,
          visibility: _pvi
        };
      }
      p.style.transition = 'none';
      p.style.opacity = '0';
      p.style.pointerEvents = 'none';
      p.style.visibility = 'hidden';
    });
    window._dialVisible = false;
  }
  function _encenderOverlayInstant(){
    // v7.047 — restaurar TODOS los hijos del overlay (excepto el canvas
    // de partículas que nunca se apagó) usando el backup que guardamos.
    var ov = document.getElementById('dial-overlay');
    if(ov){
      Array.prototype.forEach.call(ov.children, function(child){
        if(child.id === 'dial-particles') return;
        if(child._n2Backup){
          child.style.transition = 'none';
          child.style.opacity    = child._n2Backup.opacity || '';
          child.style.visibility = child._n2Backup.visibility || '';
          delete child._n2Backup;
          requestAnimationFrame(function(){
            requestAnimationFrame(function(){ child.style.transition = ''; });
          });
        } else {
          child.style.opacity = '';
          child.style.visibility = '';
        }
      });
      ov.style.pointerEvents = 'none';   // v7.084 — abrirDial deja el overlay en 'none' A PROPOSITO (no atrapa clics; sus hijos si). Restaurar '' activaba el clic-en-fondo que cierra el dial sin retorno.
    }
    // Restaurar las cards HUD.
    document.querySelectorAll('.hud-pnl').forEach(function(p){
      if(p._n2Backup){
        p.style.transition    = p._n2Backup.transition || '';
        p.style.opacity       = p._n2Backup.opacity || '';
        p.style.pointerEvents = p._n2Backup.pointerEvents || '';
        p.style.visibility    = p._n2Backup.visibility || '';
        delete p._n2Backup;
      } else {
        p.style.opacity = '';
        p.style.pointerEvents = '';
        p.style.visibility = '';
      }
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){ p.style.transition = ''; });
      });
    });
    window._dialVisible = true;
    window._hudCascadaEnCurso = false;
    // v7.079 — cerrarDial deja el OVERLAY PADRE en display:none +
    // opacity:0 y cancela el breath loop del dial; restaurar hijos no
    // basta. _dialReanudar (raw-overlay) revierte exactamente eso.
    if(typeof window._dialReanudar === 'function') window._dialReanudar();
  }

  function mostrarSeccionN2(){
    // v7.052 — Datos de consola revelaron: board-activity queda active y
    // visible, _actData existe, PERO act-container desaparece y la sección
    // queda VACÍA. Causa: renderActivity reescribe el innerHTML de
    // board-activity, pero por timing no terminaba de correr/pintar.
    // Fix: montar la sección Y forzar el render explícitamente, con
    // reintentos que verifican que la board tenga contenido real.
    if(window._hudExpanded && typeof window._hudCollapse === 'function'){
      window._hudCollapse();
    }
    _apagarOverlayInstant();

    function montarYRender(){
      // Montar la board-face de Activity directamente (sin el toggle de
      // irAActivity, que puede rebotar a 'home').
      window._osSeccion = 'home';            // evita el toggle
      if(typeof window._osMostrar === 'function'){
        window._osMostrar('activity');       // monta la sección
      }
      // Forzar el render. renderActivity reescribe board-activity con las
      // columnas. _actData ya existe (lo confirmamos), así que pinta.
      if(typeof window.renderActivity === 'function'){
        try{ window.renderActivity(); }catch(e){ console.warn('renderActivity falló:', e); }
      }
    }

    requestAnimationFrame(function(){
      montarYRender();
      // Reintentos: si board-activity sigue sin contenido real (solo el
      // spinner o vacío), volver a renderizar. Cubre el caso de que los
      // datos o el DOM no estuvieran listos en el primer intento.
      [120, 350, 700, 1200].forEach(function(ms){
        setTimeout(function(){
          var board = document.getElementById('board-activity');
          var vacio = !board || board.children.length === 0 ||
                      board.innerHTML.indexOf('fa-spin') >= 0 ||
                      board.querySelector('#act-container');
          if(vacio){ montarYRender(); }
          _apagarOverlayInstant();   // y mantener cards/dial apagados
        }, ms);
      });
    });
  }

  function ocultarSeccionN2(){
    // v7.049b — RE-DISEÑO DE LA SUBIDA 2→1.
    // _osMostrar('home') llama internamente a abrirDial(), y eso reinicia
    // el ciclo de aparición del overlay desde cero — disparando la
    // CASCADA de partículas que sube desde abajo (la animación de
    // arranque de v6). Por eso al volver de Nivel 2 no veías el dial:
    // estabas viendo la cascada de re-arranque.
    // Solución: hacer la inversión A MANO sin tocar _osMostrar/abrirDial.
    // (1) Quitar .active de la sección.
    // (2) Marcar _osSeccion='home' y re-marcar tabs.
    // (3) Avisar al carrusel móvil si aplica.
    // (4) Re-expandir la card ANTES del re-encendido (para que el dial
    //     no aparezca pelón un instante).
    // (5) Re-encender los hijos del overlay y las cards desde el backup.
    //     Sin abrirDial, sin cascada.
    var faces = document.querySelectorAll('.board-face:not(.anverso)');
    faces.forEach(function(f){ f.classList.remove('active'); });
    window._osSeccion = 'home';
    if(typeof window._osMarcarTabs === 'function'){
      try{ window._osMarcarTabs('home'); }catch(e){}
    }
    if(typeof window._osCarouselHome === 'function'){
      try{ window._osCarouselHome(); }catch(e){}
    }
    // Suprimir cualquier cascada futura.
    window._hudCascadaEnCurso = false;
    // Re-expandir la card ANTES de encender el overlay (si no, el dial
    // aparece pelón sin card encima un instante).
    if(typeof window._hudExpand === 'function' && !window._hudExpanded){
      var p = panelEntrada();
      if(p) window._hudExpand(p);
    }
    // v7.118 — marcar el aro de inmediato para ocultar las cards laterales
    // antes de que el overlay las muestre crudas (bug 28 paneles fantasma).
    if(window._coverflow && typeof window._coverflow.marcarAro === 'function'){
      try { window._coverflow.marcarAro(); } catch(e){}
    }
    // Pequeño respiro y encender el overlay limpio.
    setTimeout(function(){
      _encenderOverlayInstant();
      window._hudCascadaEnCurso = false;
      if(window._coverflow && typeof window._coverflow.marcarAro === 'function'){
        try { window._coverflow.marcarAro(); } catch(e){}
      }
    }, 50);
    // Plan B: si por timing la card no quedó expandida, reexpandirla.
    setTimeout(function(){
      if(!window._hudExpanded && typeof window._hudExpand === 'function'){
        var p2 = panelEntrada();
        if(p2) window._hudExpand(p2);
      }
      window._hudCascadaEnCurso = false;
      if(window._coverflow && typeof window._coverflow.marcarAro === 'function'){
        try { window._coverflow.marcarAro(); } catch(e){}
      }
    }, 300);
  }

  // Render de Activity Check sin pasar por irAActivity (que cierra el
  // dial con su fade). Carga los datos si no están y llama a renderActivity.
  function renderActivityN2(){
    function pinta(){
      if(typeof window.renderActivity === 'function') window.renderActivity();
    }
    if(window._actData){
      pinta();
    } else if(typeof api !== 'undefined' && api.getActivityCheck){
      var cont = document.getElementById('act-container');
      if(cont) cont.innerHTML =
        '<div style="padding:40px;text-align:center;color:rgba(255,255,255,.25)">'+
        '<i class="fas fa-circle-notch fa-spin" style="font-size:18px;color:#22d3ee"></i></div>';
      api.getActivityCheck().then(function(d){
        window._actData = d;
        pinta();
      }).catch(function(){
        if(cont) cont.innerHTML =
          '<div style="padding:40px;text-align:center;color:rgba(239,68,68,.4);font-size:12px">'+
          'Error al cargar Activity</div>';
      });
    }
  }

  /* ── v7.022 — SANEAMIENTO DE CARDS ────────────────────────────────
     Las cards compactas, por diseño de v6, NUNCA llevan scroll vertical
     propio (se extienden libremente). Pero _hudExpand le pone
     overflow-y:auto al contenido expandido, y según el camino que se
     tome (expandir A, luego B, abrir el dial, cambiar de nivel...) ese
     overflow puede quedar PEGADO en la card al volver — y aparece un
     scroll fantasma, a veces un "segundo scroll", que sube y baja solo.
     raw-niveles.js encadena _hudExpand/_hudCollapse de formas que v6 no
     hacía a mano, así que destapa esos caminos sucios.
     Este saneamiento fuerza el estado limpio de TODAS las cards
     compactas y de su contenido interno. No toca v6: solo limpia
     inline-styles residuales. */
  function sanearCards(){
    var paneles = window._hudPanels || [];
    paneles.forEach(function(hp){
      if(!hp || !hp.el) return;
      // Si la card está expandida, v6 la gestiona — no se toca.
      if(hp.el.classList.contains('hud-expanded')) return;
      hp.el.style.overflowY = '';
      hp.el.style.overflowX = '';
      hp.el.style.maxHeight = '';
      var inner = hp.el.querySelector(':scope > [id$="-inner"]');
      if(inner){
        inner.style.overflowY = '';
        inner.style.maxHeight = '';
        // El wrapper .hud-expanded-content que crea _hudExpand: si quedó
        // en el DOM con overflow residual, se le quita (oculto, pero su
        // overflow puede filtrarse como un segundo scroll fantasma).
        var exp = inner.querySelector(':scope > .hud-expanded-content');
        if(exp){
          exp.style.overflowY = '';
          exp.style.maxHeight = '';
        }
      }
    });
  }

  // Baja un nivel (más profundo).
  function bajarNivel(){
    if(_bloqueado) return;
    sync();
    if(_nivel >= NIVEL_MAX) return;
    _bloqueado = true;

    // v7.030 — FASE 4A: warp hacia el CENTRO al sumergirse.
    if(typeof window._dispararWarp === 'function') window._dispararWarp(1);

    if(_nivel === 0){
      // 0 → 1 : expandir la card de entrada
      var p = panelEntrada();
      if(p && typeof window._hudExpand === 'function' && !window._hudExpanded){
        window._hudExpand(p);
      }
      _nivel = 1;
    } else if(_nivel === 1){
      // 1 → 2 : mostrar la sección a pantalla completa.
      // v7.041 — La board-face vive dentro de .app (z-index:2); el
      // overlay es z-index:9000. Si el overlay queda visible, TAPA la
      // sección — por eso v6 lo cierra. El cierre no es el problema; el
      // problema era CÓMO: el flashazo del dial y la cascada. Aquí el
      // overlay se apaga LIMPIO e instantáneo (sin su fade de 280ms que
      // hacía parpadear el dial), la cascada se suprime, y el fondo
      // cósmico —que es un canvas aparte— sigue vivo: el warp se ve.
      marcarWarp();
      window._hudCascadaEnCurso = false;   // que abrirDial no relance cascada
      mostrarSeccionN2();
      _nivel = 2;
    }
    finTransicion();
  }

  // Sube un nivel (hacia la superficie).
  function subirNivel(){
    if(_bloqueado) return;
    sync();
    if(_nivel <= NIVEL_MIN) return;
    _bloqueado = true;

    // v7.030 — FASE 4A: warp hacia AFUERA al emerger.
    if(typeof window._dispararWarp === 'function') window._dispararWarp(-1);

    if(_nivel === 2){
      // 2 → 1 : ocultar la sección y volver a la card expandida.
      // v7.040 — REDISEÑO. El overlay NUNCA se cerró (el 1→2 ya no lo
      // cierra), así que aquí no hay que reabrirlo: solo se oculta la
      // board-face de la sección y se reexpande la card. Sin _osMostrar,
      // sin abrirDial, sin cascada.
      marcarWarp();
      ocultarSeccionN2();   // v7.042: ya reexpande la card por dentro
      _nivel = 1;
    } else if(_nivel === 1){
      // 1 → 0 : colapsar la card → overlay normal.
      // v7.031: el colapso de v6 es casi instantáneo, así que el warp
      // regresivo no se apreciaba. Se marca niv-warp y se RE-dispara el
      // warp del fondo con un pequeño desfase, para que el destello de
      // emerger acompañe al colapso y se sienta el regreso.
      marcarWarp();
      if(window._hudExpanded && typeof window._hudCollapse === 'function'){
        window._hudCollapse();
      }
      // v7.118 — invalidar el grid para que el reposicionamiento post-warp
      // (a los 1150ms, ya con pantalla quieta) remida la fila top limpia.
      // El reset duro de paneles se hace ALLÁ, no aquí, para no contaminar
      // durante la ventana del warp.
      if(window._GRID) window._GRID.medido = false;
      if(typeof window._dispararWarp === 'function'){
        setTimeout(function(){ window._dispararWarp(-1); }, 120);
      }
      _nivel = 0;
    }
    finTransicion();
  }

  // Tras lanzar una transición: resetear medidor y liberar el lock.
  function finTransicion(){
    _medidor = 0;
    _dir = 0;
    aplicarProfundidad(_nivel);   // FASE 2: pinta la inmersión del nivel
    pintarBarra();
    // v7.022 — al volver a la superficie (Nivel 0), sanear las cards:
    // quita cualquier scroll fantasma que haya quedado pegado tras
    // expandir/colapsar. Se hace dos veces — justo después y al cerrar
    // la animación de v6 — para cubrir el momento en que v6 termina de
    // reposicionar y podría dejar un overflow residual.
    if(_nivel === 0){
      sanearCards();
      setTimeout(sanearCards, 480);
      setTimeout(sanearCards, 780);
    }
    // Lock generoso: cubre la animación de v6 (~600ms) para que no se
    // encadenen transiciones por inercia del scroll.
    setTimeout(function(){ _bloqueado = false; }, 1100);
  }

  /* ════════════════════════════════════════════════════════════════
     EL MEDIDOR DE INTENCIÓN
  ════════════════════════════════════════════════════════════════ */
  // Suma intención en una dirección (+1 adentro / -1 afuera).
  function acumular(dir, fuerza){
    if(_bloqueado) return;
    sync();

    // Límites: no acumular hacia adentro en el nivel más profundo, ni
    // hacia afuera en la superficie.
    if(dir > 0 && _nivel >= NIVEL_MAX) return;
    if(dir < 0 && _nivel <= NIVEL_MIN) return;

    // Si cambió la dirección, el medidor se reinicia: cambiar de idea
    // a media inmersión no "acredita" el progreso anterior.
    if(dir !== _dir){
      _medidor = 0;
      _dir = dir;
    }

    _medidor += fuerza;
    _ultScrollTS = Date.now();
    cancelarLiga();

    if(_medidor >= UMBRAL){
      // ¡Cruzó! El usuario empujó lo suficiente: es una decisión.
      if(dir > 0) bajarNivel();
      else        subirNivel();
    } else {
      pintarBarra();
      programarLiga();
    }
  }

  // Efecto liga: si dejas de hacer scroll sin llegar a 100, el medidor
  // se devuelve a 0 suavemente. "No, no quería cruzar."
  function programarLiga(){
    cancelarLiga();
    _ligaRAF = requestAnimationFrame(function tick(){
      // Solo retrocede si pasó un instante sin scroll nuevo.
      // v7.003: margen subido 90 → 180ms — entre giro y giro de rueda
      // el medidor ya no se vacía tan rápido; acumular se siente fluido.
      if(Date.now() - _ultScrollTS < 180){
        _ligaRAF = requestAnimationFrame(tick);
        return;
      }
      _medidor -= LIGA_VEL;
      if(_medidor <= 0){
        _medidor = 0;
        _dir = 0;
        pintarBarra();
        _ligaRAF = 0;
        return;
      }
      pintarBarra();
      _ligaRAF = requestAnimationFrame(tick);
    });
  }
  function cancelarLiga(){
    if(_ligaRAF){ cancelAnimationFrame(_ligaRAF); _ligaRAF = 0; }
  }

  /* ════════════════════════════════════════════════════════════════
     ENGANCHE EN SECCIONES — scroll interno antes que scroll de nivel
  ════════════════════════════════════════════════════════════════ */
  // ¿El scroll debe mover el contenido de la sección, o ya llegó al
  // tope y puede enganchar el cambio de nivel? Devuelve true si el
  // evento de scroll YA es "de nivel".
  // v7.051 — Busca, desde `target` hacia arriba por los ancestros, el
  // primer contenedor que realmente puede scrollear en la dirección
  // dada. Devuelve null si ninguno scrollea (entonces el scroll es de
  // nivel). Esto es mucho más fiable que buscar "cualquier hijo con
  // scroll" en el DOM, porque usa el elemento bajo el cursor.
  function _contenedorScrolleable(target, dir, limite){
    var el = target;
    while(el && el !== limite && el !== document.body){
      var puedeScroll = el.scrollHeight > el.clientHeight + 2;
      if(puedeScroll){
        var estilo = getComputedStyle(el).overflowY;
        if(estilo === 'auto' || estilo === 'scroll'){
          var arriba = el.scrollTop <= 0;
          var abajo  = el.scrollTop + el.clientHeight >= el.scrollHeight - 2;
          // Si en la dirección del scroll AÚN hay recorrido, este
          // contenedor se queda el scroll (no es de nivel).
          if(dir < 0 && !arriba) return el;
          if(dir > 0 && !abajo)  return el;
          // Si ya está en el tope en esa dirección, seguir subiendo por
          // si un ancestro todavía puede scrollear; si ninguno puede,
          // será scroll de nivel.
        }
      }
      el = el.parentElement;
    }
    return null;
  }

  function scrollEsDeNivel(dir, target){
    // En Nivel 0 no hay scroll interno relevante → siempre de nivel.
    if(_nivel === 0) return true;

    // En Nivel 1 (card expandida) o Nivel 2 (sección), buscar desde el
    // elemento bajo el cursor un contenedor que aún pueda scrollear en
    // la dirección pedida. Si lo hay → scroll de contenido (no de
    // nivel). Si no → scroll de nivel.
    var limite = (_nivel === 1)
      ? (window._hudExpanded || document.body)
      : (document.querySelector('.board-face.active') || document.body);

    if(target){
      var sc = _contenedorScrolleable(target, dir, limite.parentElement || document.body);
      if(sc) return false;   // hay scroll de contenido pendiente
    }
    return true;             // nada que scrollear → cambio de nivel
  }

  /* ════════════════════════════════════════════════════════════════
     ENTRADA 1 — SCROLL DE RUEDA / TRACKPAD
  ════════════════════════════════════════════════════════════════ */
  function onWheel(e){
    if(!esEscritorio()) return;
    if(_bloqueado) return;

    var dir = e.deltaY > 0 ? 1 : -1;   // abajo = adentro, arriba = afuera

    // Si el scroll todavía es "de contenido" (sección sin llegar al
    // tope), no lo tocamos: que la sección scrollee normal.
    // v7.051: pasamos e.target — el elemento bajo el cursor — para
    // encontrar el contenedor scrolleable REAL, no adivinar en el DOM.
    if(!scrollEsDeNivel(dir, e.target)) return;

    // Es scroll de nivel: lo consumimos para que no scrollee la página.
    e.preventDefault();
    var fuerza = Math.min(PASO_SCROLL * 1.5,
                          PASO_SCROLL * (Math.abs(e.deltaY) / 100 + 0.5));
    acumular(dir, fuerza);
  }

  /* ════════════════════════════════════════════════════════════════
     ENTRADA 2 — BARRA VERTICAL DE NIVEL  (lado derecho)
     Indica el nivel actual + el llenado del medidor. Arrastrable y
     clickable para saltar de nivel manualmente.
  ════════════════════════════════════════════════════════════════ */
  var _barra = null, _barraFill = null, _barraMarcador = null, _barraStops = [];

  function construirBarra(){
    if(_barra) return;
    _barra = document.createElement('div');
    _barra.id = 'niv-barra';
    _barra.className = 'niv-barra';

    // Riel + relleno de intención
    var riel = document.createElement('div');
    riel.className = 'niv-riel';
    _barraFill = document.createElement('div');
    _barraFill.className = 'niv-fill';
    riel.appendChild(_barraFill);

    // 3 paradas (niveles 0,1,2)
    var labels = ['Superficie','Carrusel','Sección'];
    for(var i=0;i<=NIVEL_MAX;i++){
      var stop = document.createElement('button');
      stop.className = 'niv-stop';
      stop.setAttribute('data-nivel', String(i));
      stop.setAttribute('title', 'Nivel '+i+' — '+labels[i]);
      (function(n){
        stop.addEventListener('click', function(){ irANivel(n); });
      })(i);
      riel.appendChild(stop);
      _barraStops.push(stop);
    }

    // Marcador (la posición actual)
    _barraMarcador = document.createElement('div');
    _barraMarcador.className = 'niv-marcador';
    riel.appendChild(_barraMarcador);

    _barra.appendChild(riel);
    document.body.appendChild(_barra);

    // Arrastre del marcador
    hacerArrastrable(riel);
  }

  // Salta directo a un nivel (clic en una parada). Mueve nivel por
  // nivel para respetar las animaciones de v6.
  function irANivel(destino){
    if(_bloqueado) return;
    sync();
    destino = Math.max(NIVEL_MIN, Math.min(NIVEL_MAX, destino));
    if(destino === _nivel) return;
    var paso = destino > _nivel ? bajarNivel : subirNivel;
    paso();
    // Si falta más de un nivel, encadenar tras el lock.
    if(destino !== _nivel){
      var faltan = Math.abs(destino - nivelReal());
      if(faltan > 0){
        setTimeout(function(){ irANivel(destino); }, 780);
      }
    }
  }

  // Arrastre vertical del riel → acumula intención según el movimiento.
  function hacerArrastrable(riel){
    var arrastrando = false, yPrev = 0;
    riel.addEventListener('mousedown', function(e){
      if(e.target.classList.contains('niv-stop')) return; // clic en parada
      arrastrando = true; yPrev = e.clientY;
      e.preventDefault();
    });
    window.addEventListener('mousemove', function(e){
      if(!arrastrando) return;
      var dy = e.clientY - yPrev;
      yPrev = e.clientY;
      if(Math.abs(dy) < 1) return;
      // Arrastrar hacia abajo = profundizar.
      acumular(dy > 0 ? 1 : -1, Math.min(PASO_SCROLL*1.4, Math.abs(dy)*0.9));
    });
    window.addEventListener('mouseup', function(){ arrastrando = false; });
  }

  // Repinta la barra: posición del marcador + relleno del medidor.
  function pintarBarra(){
    if(!_barra) return;
    // Marca la parada activa
    _barraStops.forEach(function(s, i){
      s.classList.toggle('on', i === _nivel);
    });
    // El marcador se posiciona en el nivel actual (0 = arriba).
    var pct = (_nivel / NIVEL_MAX) * 100;
    _barraMarcador.style.top = pct + '%';
    // El relleno muestra el medidor de intención, en la dirección actual.
    var frac = Math.max(0, Math.min(1, _medidor / UMBRAL));
    if(_dir > 0){
      // Profundizando: el relleno crece hacia abajo desde el nivel actual.
      _barraFill.style.top = pct + '%';
      _barraFill.style.height = (frac * (100/NIVEL_MAX)) + '%';
    } else if(_dir < 0){
      // Emergiendo: crece hacia arriba.
      var destPct = ((_nivel-1) / NIVEL_MAX) * 100;
      _barraFill.style.top = (pct - frac*(100/NIVEL_MAX)) + '%';
      _barraFill.style.height = (frac * (100/NIVEL_MAX)) + '%';
    } else {
      _barraFill.style.height = '0%';
    }
  }

  /* ════════════════════════════════════════════════════════════════
     ENTRADA 3 — WHEEL CIRCULAR estilo iPod  (abajo-derecha)
     Girar el dedo/ratón en círculo sobre la rueda acumula intención.
     Girar horario = profundizar; antihorario = emerger.
  ════════════════════════════════════════════════════════════════ */
  var _wheel = null;

  function construirWheel(){
    if(_wheel) return;
    _wheel = document.createElement('div');
    _wheel.id = 'niv-wheel';
    _wheel.className = 'niv-wheel';
    _wheel.innerHTML =
      '<div class="niv-wheel-ring"></div>'+
      '<div class="niv-wheel-hub"><span class="niv-wheel-lvl">0</span></div>'+
      '<div class="niv-wheel-hint">NIVEL</div>';
    document.body.appendChild(_wheel);

    var ring = _wheel.querySelector('.niv-wheel-ring');
    var girando = false, angPrev = 0, acumAng = 0;

    function angDe(e){
      var r = ring.getBoundingClientRect();
      var cx = r.left + r.width/2, cy = r.top + r.height/2;
      return Math.atan2(e.clientY - cy, e.clientX - cx);
    }
    ring.addEventListener('mousedown', function(e){
      girando = true; angPrev = angDe(e); acumAng = 0;
      _wheel.classList.add('activo');
      e.preventDefault();
    });
    window.addEventListener('mousemove', function(e){
      if(!girando) return;
      var a = angDe(e);
      var d = a - angPrev;
      // Normalizar el salto de -π..π
      if(d >  Math.PI) d -= 2*Math.PI;
      if(d < -Math.PI) d += 2*Math.PI;
      angPrev = a;
      acumAng += d;
      // Cada ~0.35 rad de giro = un tick de intención.
      while(Math.abs(acumAng) >= 0.35){
        var dir = acumAng > 0 ? 1 : -1;   // horario = profundizar
        acumular(dir, PASO_SCROLL);
        acumAng -= dir * 0.35;
      }
    });
    window.addEventListener('mouseup', function(){
      girando = false;
      if(_wheel) _wheel.classList.remove('activo');
    });
  }

  function pintarWheel(){
    if(!_wheel) return;
    var lvl = _wheel.querySelector('.niv-wheel-lvl');
    if(lvl) lvl.textContent = String(_nivel);
    var ring = _wheel.querySelector('.niv-wheel-ring');
    if(ring){
      // El anillo se ilumina proporcional al medidor.
      var frac = Math.max(0, Math.min(1, _medidor / UMBRAL));
      ring.style.setProperty('--niv-frac', frac.toFixed(3));
    }
  }

  /* ════════════════════════════════════════════════════════════════
     PINTADO UNIFICADO
  ════════════════════════════════════════════════════════════════ */
  var _pintarOrig = pintarBarra;
  pintarBarra = function(){
    _pintarOrig();
    pintarWheel();
  };

  /* ════════════════════════════════════════════════════════════════
     ARRANQUE
  ════════════════════════════════════════════════════════════════ */
  function init(){
    if(!esEscritorio()) return;   // FASE 1: solo escritorio

    construirBarra();
    construirWheel();
    _nivel = nivelReal();
    aplicarProfundidad(_nivel);   // FASE 2: estado de inmersión inicial
    pintarBarra();

    // v7.022 — envolver _hudCollapse: tras CUALQUIER colapso de card
    // (venga del sistema de niveles o de un clic directo en v6), sanear
    // las cards para que no quede scroll fantasma. Se preserva el
    // _hudCollapse original intacto; solo se le añade el saneo después.
    if(typeof window._hudCollapse === 'function' && !window._hudCollapse._saneado){
      var _collapseOrig = window._hudCollapse;
      var envuelto = function(){
        var r = _collapseOrig.apply(this, arguments);
        // El colapso de v6 reposiciona con un pequeño desfase; sanear
        // un par de veces cubre ese momento.
        sanearCards();
        setTimeout(sanearCards, 460);
        return r;
      };
      envuelto._saneado = true;
      window._hudCollapse = envuelto;
    }

    // v7.049b — SINCRONIZAR _nivel CON LA NAVEGACIÓN DE v6.
    // Si el usuario navega con la barra superior (clic en Activity,
    // Logros, etc.), _osMostrar y irAActivity se ejecutan SIN pasar por
    // mi bajarNivel. El sistema cree que sigue en Nivel 1 y al hacer
    // scroll hacia arriba todo se rompe (sube de un "Nivel 1" virtual
    // mientras la app está en una sección a pantalla completa).
    // Solución: envolver _osMostrar para que cuando el usuario salte a
    // una sección, _nivel se actualice a 2; cuando vuelva a 'home', a 1.
    if(typeof window._osMostrar === 'function' && !window._osMostrar._sincronizado){
      var _osMostrarOrig = window._osMostrar;
      var _osMostrarEnv = function(seccion){
        var nivelAntes = _nivel;
        var r = _osMostrarOrig.apply(this, arguments);
        // v7.054 — Cuando el usuario navega por la barra superior, no
        // basta con actualizar _nivel: hay que aplicar el flujo COMPLETO
        // del nivel — clase niv-* en <html>, apagar cards y dial,
        // ajustar z-index del overlay. Si no, queda un estado podrido:
        // _nivel=2 pero <html> sin niv-2, overlay con z-index 9000
        // tapando todo → pantalla gris al hacer click.
        if(seccion === 'home'){
          if(nivelAntes === 2){
            _nivel = 1;
            // Aplicar el flujo limpio de regreso (sin el _osMostrar('home')
            // que ya corrió arriba). Solo restauramos el overlay y cards.
            window._hudCascadaEnCurso = false;
            _encenderOverlayInstant();
            aplicarProfundidad(1);
            pintarBarra();
          }
        } else if(seccion){
          if(nivelAntes < 2){
            _nivel = 2;
            // Aplicar el flujo limpio de bajada (sin volver a montar la
            // sección, ya la montó _osMostrar arriba). Apagamos cards y
            // dial, marcamos profundidad.
            if(window._hudExpanded && typeof window._hudCollapse === 'function'){
              window._hudCollapse();
            }
            _apagarOverlayInstant();
            // Re-apagar varias veces por si v6 reposiciona cards.
            setTimeout(_apagarOverlayInstant, 50);
            setTimeout(_apagarOverlayInstant, 200);
            setTimeout(_apagarOverlayInstant, 500);
            aplicarProfundidad(2);
            pintarBarra();
          }
        }
        return r;
      };
      _osMostrarEnv._sincronizado = true;
      window._osMostrar = _osMostrarEnv;
    }

    // El wheel debe capturar el scroll del documento. passive:false
    // para poder hacer preventDefault cuando el scroll es "de nivel".
    window.addEventListener('wheel', onWheel, { passive:false });

    // Si cambia el tamaño y pasa a móvil, ocultar la UI de niveles.
    window.addEventListener('resize', function(){
      var on = esEscritorio();
      if(_barra) _barra.style.display = on ? '' : 'none';
      if(_wheel) _wheel.style.display = on ? '' : 'none';
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(init, 1000);   // tras el arranque del overlay
    });
  } else {
    setTimeout(init, 1000);
  }

  /* ════════════════════════════════════════════════════════════════
     v7.072 — WATCHDOG DE PROFUNDIDAD
     Cada 600ms (solo escritorio): sincroniza la clase niv-X del <html>
     con el nivel real, y auto-repara cards invisibles en Home.
     Costo: despreciable (una lectura de classList; el heal solo corre
     en nivel 0 y solo toca elementos con la firma exacta del apagado
     instantáneo de N2: opacity:'0' + visibility:'hidden' inline).
  ════════════════════════════════════════════════════════════════ */
  var _watchT0 = Date.now();   // v7.078 — gracia post-load para el heal
  var _dialDesvTick = 0;       // v7.101 — doble-tick del dial desviado
  setInterval(function(){
    if(!esEscritorio()) return;
    if(document.hidden) return;
    if(_bloqueado) return;   // v7.075 — jamás interferir con una transición en curso

    // v7.093 — DIAL ATORADO EN FIXED (caso 007 #1): al expandir, el
    // nivel 1 pone el canvas del dial en position:fixed (miniatura).
    // Los regresos por warp o por bajada rapida 2->1->0 no ejecutan la
    // restauracion a 'relative', y el canvas queda fixed sin left/top:
    // pegado a la esquina del viewport (centro ~418,418 evidenciado por
    // el espia). Reconciliacion: en nivel 0, dial visible, sin
    // expansion, si el canvas sigue 'fixed' -> devolverlo a 'relative'
    // para que el flex del overlay lo centre. Idempotente.
    // v7.101 — BUG MORTAL CORREGIDO: este bloque usaba `real` ANTES de
    // su declaracion (hoisting -> undefined): el heal v7.093 JAMAS
    // corrio ni una sola vez. Ahora lee el nivel directamente.
    var realDial = nivelReal();
    if(realDial === 0 && window._dialVisible === true && !window._hudExpanded){
      var _ovD = document.getElementById('dial-overlay');
      var _cvD = _ovD ? _ovD.querySelector('canvas:not(#dial-particles)') : null;
      if(_cvD && _cvD.style.position === 'fixed'){
        _cvD.style.position = 'relative';
        _cvD.style.left = '';
        _cvD.style.top = '';
        _cvD.style.zIndex = '1';
        _dialDesvTick = 0;
      } else if(_cvD && !document.documentElement.classList.contains('niv-warp') &&
                !document.documentElement.classList.contains('cf-nav')){
        // v7.101 — DIAL A MEDIO CRECER (caso 007 #2, log 142.9s): la
        // animacion de restauracion 1->0 quedo interrumpida y el canvas
        // quedo 'relative' pero chico y en la esquina (86,86->374,374,
        // congelado lejos de su centro 960,503). Deteccion: centro del
        // canvas desviado >80px del centro del overlay durante DOS ticks
        // consecutivos (jamas tocar una animacion legitima en curso).
        // Cura: soltar los estilos inline del medio-crecimiento; el
        // layout nativo del overlay lo recoloca y redimensiona solo.
        var _rc = _cvD.getBoundingClientRect();
        var _ro = _ovD.getBoundingClientRect();
        var _dx = (_rc.left+_rc.width/2) - (_ro.left+_ro.width/2);
        var _dy = (_rc.top+_rc.height/2) - (_ro.top+_ro.height/2);
        if(Math.sqrt(_dx*_dx+_dy*_dy) > 80){
          _dialDesvTick++;
          if(_dialDesvTick >= 2){
            _cvD.style.transform = '';
            _cvD.style.width = '';
            _cvD.style.height = '';
            _cvD.style.left = '';
            _cvD.style.top = '';
            _dialDesvTick = 0;
          }
        } else {
          _dialDesvTick = 0;
        }
      }
    }

    // v7.085 — POPUP CONCEPTO huerfano (ahora SI en el watchdog; en
    // v7.084 quedo por error dentro de bajarNivel y solo corria al
    // bajar de nivel). El popup solo tiene sentido con el form RAW
    // abierto: si quedo con .show sin form, cerrarlo.
    var _popC = document.getElementById('popup-concepto');
    if(_popC && _popC.classList.contains('show')){
      var _dd = document.getElementById('entrada-dropdown');
      if(!_dd || !_dd.classList.contains('show')){
        _popC.classList.remove('show');
      }
    }

    // v7.077 — el cosmos es el fondo de TODOS los niveles. Si por
    // cualquier camino no está corriendo (p.ej. pestaña tocada antes
    // de que abrirDial arrancara), arrancarlo. Su frame-loop se pausa
    // solo en niv-2, así que esto nunca agrega CPU dentro de secciones.
    if(typeof window._particlesStart === 'function' && !window._particlesRunning){
      window._particlesStart();
    }

    // (a) Sincronizar la clase de profundidad con la realidad.
    var real = nivelReal();
    var h = document.documentElement;
    if(!h.classList.contains('niv-' + real)){
      _nivel = real;
      aplicarProfundidad(real);
      pintarBarra();
    }

    // (b) v7.075 — FONDO CORRECTO EN AMBOS SENTIDOS.
    // Nivel 0 y 1: el overlay (dial, cards) debe estar ENCENDIDO —
    // auto-reparar elementos con la firma del apagado N2.
    // Nivel 2: el overlay debe estar APAGADO — si una sección está a
    // pantalla completa y el overlay sigue visible (entrada por
    // pestaña que se saltó el flujo), apagarlo.
    var ov = document.getElementById('dial-overlay');
    if(real <= 1 && !window._hudCascadaEnCurso
       && window._dialVisible === true
       && document.documentElement.classList.contains('hud-listo')){
      // v7.084 — DOS GUARDS CRITICOS:
      // 1) _dialVisible===true: si el dial esta LEGITIMAMENTE cerrado
      //    (form RAW abierto via cerrarDial), los hijos del overlay en
      //    opacity:0 son correctos. El heal los resucitaba detras del
      //    form a los ~1.2s ('aparecen y nadie los llama').
      // 2) hud-listo: jamas reparar antes de la primera apertura (el
      //    estado inicial es opacity:0 legitimo; repararlo encendia el
      //    dial DE GOLPE sin fade).

      // v7.078 — heal con 5 ticks de persistencia (3s) + 12s de gracia
      // tras el load. El heal de 2 ticks mataba los fades LEGÍTIMOS de
      // la cascada de apertura (~2.5s) → el dial entraba "de golpe".
      // Ninguna animación legítima persiste 3 segundos en opacity:0.
      if(Date.now() - _watchT0 < 12000) return;
      var heal = function(el){
        var invisible = (el.style.opacity === '0');
        if(!invisible){ el._healPend = 0; return; }
        el._healPend = (el._healPend || 0) + 1;
        if(el._healPend < 5) return;
        el._healPend = 0;
        el.style.transition = 'none';
        el.style.opacity = '';
        el.style.visibility = '';
        el.style.pointerEvents = '';
        requestAnimationFrame(function(){ el.style.transition = ''; });
      };
      document.querySelectorAll('.hud-pnl').forEach(heal);
      if(ov){
        Array.prototype.forEach.call(ov.children, function(child){
          if(child.id === 'dial-particles') return;
          heal(child);
        });
        // v7.084 — flip de pointerEvents/_dialVisible ELIMINADO.
        // Corrompia la bandera: con el form RAW abierto ponia
        // _dialVisible=true sin dial visible -> cerrarEntrada veia
        // !_dialVisible falso -> abrirDial() jamas corria -> dial
        // muerto sin retorno. 'none' es el estado correcto siempre.
      }
    } else if(real === 2 && ov){
      // v7.076 — SOLO apagar si una sección está REALMENTE visible en
      // el DOM (.board-face.active). Si _osSeccion dice "sección" pero
      // ninguna face está activa, es un desync de estado: apagar aquí
      // sería declarar la guerra al flujo de subida (pantalla en
      // blanco). En desync, no tocar nada.
      if(document.querySelector('.board-face.active:not(.anverso)')){
        var visible = false;
        for(var vi = 0; vi < ov.children.length; vi++){
          var ch = ov.children[vi];
          if(ch.id === 'dial-particles') continue;
          if(ch.style.opacity !== '0' || ch.style.visibility !== 'hidden'){ visible = true; break; }
        }
        if(visible && typeof _apagarOverlayInstant === 'function'){
          _apagarOverlayInstant();
        }
      }
    }
  }, 600);

  // API pública mínima (para depurar o para fases siguientes).
  window._niveles = {
    bajar:  bajarNivel,
    subir:  subirNivel,
    irA:    irANivel,
    estado: function(){ return { nivel:_nivel, medidor:_medidor }; }
  };

  // v7.100 — TECLADO DE NIVELES: ArrowUp emerge (hacia nivel 0),
  // ArrowDown se sumerge (hacia nivel 2). Mismas funciones que la
  // barra manual (warp, lock _bloqueado y pintado incluidos gratis).
  // Guards: jamas en movil, jamas escribiendo en un input, jamas con
  // el form RAW o el popup CONCEPTO abiertos (ahi el teclado es para
  // capturar datos, no para viajar).
  document.addEventListener('keydown', function(e){
    if(e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    if(window.innerWidth < 900) return;
    if(e.target && /input|textarea|select/i.test(e.target.tagName)) return;
    var dd = document.getElementById('entrada-dropdown');
    if(dd && dd.classList.contains('show')) return;
    var pc = document.getElementById('popup-concepto');
    if(pc && pc.classList.contains('show')) return;
    e.preventDefault();
    if(e.key === 'ArrowUp') subirNivel();
    else bajarNivel();
  });
})();
