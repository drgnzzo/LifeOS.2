/* RAW Entry — Overlay v.7.121 (barra USER+SIM arriba fija + fix vuelo USER/inferiores + niv-1 solo coverflow)
   ───────────────────────────────────────────────────────────────────
   v7.119 — El sistema _GRID/_medirFilaTop que el handoff daba por hecho
   NUNCA estaba en este archivo (solo referencias muertas en raw-niveles).
   Aquí se implementa DE VERDAD: colTopY y el topRowBottom del expandido
   salen de un ancla medida con pantalla quieta y CONGELADA mientras
   medido=true. El reset duro de 1→0 (sin reflow) ya no puede inyectar el
   inner residual de 384px → colTopY deja de dispararse → cards no saltan a
   Y~832. Solo resize/zoom real (con reflow) remide. Ver bloque _GRID.
   ───────────────────────────────────────────────────────────────────
   ╔══════════════════════════════════════════════════════════════════╗
   ║ v7.071 — FRENOS EN LOS LOOPS DEL DIAL (FIX CPU 137%)             ║
   ╚══════════════════════════════════════════════════════════════════╝
   Los loops del dial (_breathLoop ×2 y _iniciarPulsoCentro) corrían
   _dialDraw() a la velocidad NATIVA del monitor (60-144fps) sin pausa
   por foco ni por pestaña oculta. _dialDraw usa shadowBlur en casi
   todos sus trazos — la operación más cara de canvas (cada trazo con
   sombra = un desenfoque gaussiano completo). Resultado: 130%+ de CPU
   permanente, incluso con LifeOS en segundo plano.
   Fix: los tres loops reciben los MISMOS frenos que el cosmos ya
   tenía (v5.214/v7.066): pausa con document.hidden, pausa sin
   document.hasFocus(), y cap a 30fps. El avance del contador usa
   tiempo real normalizado, así la velocidad visual de la respiración
   y el pulso queda IDÉNTICA (MAR-1: cero cambio estético).
   _dialDraw NO se tocó.
   ╔══════════════════════════════════════════════════════════════════╗
   ║ v6.066 — REGRESO A HOME MÁS SUAVE Y CALMADO                      ║
   ╚══════════════════════════════════════════════════════════════════╝
   La reapertura del overlay (volver a Home) entraba brusca: las cards
   aparecían casi en bloque (escalonado de 35ms, duración 420ms) y el
   dial igual de rápido. Ahora todo entra con calma, sin prisa:
   · Las cards entran una tras otra, escalonado amplio (110ms entre
     cada una), fundido largo (760ms) con curva muy suave.
   · El dial entra el ÚLTIMO y el más lento (fundido 1100ms, arranca
     360ms después), ya con las cards asentadas — no compite con ellas.
   · El overlay-contenedor hace su fundido en 620ms.
   No es la cascada del primer arranque — es solo un fade, pero pausado.

   ── v6.062 — REAPERTURA CON FADE REAL ──
   La reapertura rápida de abrirDial mostraba el dial y las cards "de
   golpe": dial/glow/ring/paneles ya estaban en opacity:1 de un cierre
   previo, así que reasignarles opacity:1 NO disparaba transición. Y
   _reposicionarHUD corría sin reset de medidas → layout descolocado.
   Ahora la reapertura replica EXACTAMENTE _hudCollapse (el regreso de
   una card expandida): reset de medidas (display:none→reflow→display)
   + doble _reposicionarHUD, y los elementos PARTEN de un estado oculto
   /reducido y ANIMAN hacia el final — fade suave, con escalonado por
   panel. Volver a Home desde la barra o al cerrar el formulario se ve
   igual de pulido que regresar de una card expandida.

   ── v6.050 — LIMPIEZA: retiro de +Nueva ──
   ── v6.050 — LIMPIEZA: retiro de +Nueva ──
   · Retiradas las 3 referencias muertas a btn-nueva-entrada (el botón
     se eliminó en v6.010; el formulario RAW vive en el centro del
     dial). Eran inertes (guardadas con if) — ahora también limpias.
   · Retirada la variable huérfana _dialLandingUsed (quedó sin uso al
     eliminarse el override de cerrarDial en v6.020).
   Nota: el sistema .board-face / slide-right NO se retira — dejó de
   ser "vista vieja" y es el mecanismo de capas que usa el router v6.

   ── Heredado v6.032 — MODO MÓVIL: FONDO PLANO ──
   En móvil el fondo cósmico no corre la animación pesada.

   ── Heredado v6.031 — FIX barra/Home/hueco ──
   La barra superior sube a z-index:10000 (sobre el overlay); el HUD
   se desplaza media barra para centrarse en el espacio visible;
   abrirDial distingue primer arranque (cascada) de reapertura (fade
   rápido) vía _dialYaInicializado; cerrarEntrada ya no cierra el
   overlay.

   ── Heredado v6.020 — ROUTER DE CAPAS ──
   ── Heredado v6.011 — FIX slots vacíos + window._dialVisible ──
   ── Heredado v6.010 — BARRA SUPERIOR FIJA ──
   ── Heredado v6.000 — PERSISTENCIA DEL OVERLAY ──
   El _dialOverlay y el fondo cósmico se construyen y animan UNA sola
   vez. toggleEntradaDropdown ya no destruye el overlay.

   ── Heredado v5.217 ──
   OPTIMIZACIÓN del arranque del fondo del overlay (construcción
   diferida, nebulosa a media resolución, detección de equipo modesto).
   ── Heredado v5.216
   Añadido botón "Sheet" al topBar del overlay (renglón de stats, junto
   a Créditos). Abre el Google Sheet directamente en pestaña nueva,
   fuera de la web, vía irASheet() de raw-core.js (con URL de fallback).
   ── Heredado v5.214
   OPTIMIZACIÓN de rendimiento del fondo (sin perder nada visible).
   · drawStars: shadowBlur (la operación más cara del canvas) ahora
     solo en hubs/estrellas grandes. Las ~580 pequeñas se dibujan
     como círculo plano. El glow de una estrella diminuta es
     invisible igual.
   · drawWarp: glow solo en partículas cercanas al centro / horizonte;
     las lejanas (la mayoría) sin shadowBlur.
   · Cap de FPS a 40 (antes 60) — fluido a la vista, 1/3 menos de
     trabajo. dt se acumula igual: misma velocidad real.
   · Frame saltado cuando document.hidden (pestaña en segundo plano).
   ── Heredado v5.212
   FIX "Invalid Date" en la card expandida de Bitacora (Pensamientos,
   Salud, Entrenamiento). Causa: new Date(it.fecha).toLocaleDateString()
   directo — si it.fecha no era parseable, salia literalmente "Invalid
   Date". Ahora _fechaSegura valida con isNaN y cae a parseo manual de
   yyyy-MM-dd; si todo falla, cadena vacia.
   ── Heredado v5.208
   FIX Variables expandido vacio. Causa: datosMes se llena en una
   variable local de raw-core via onDatosMes, pero el hydrate del
   overlay leia window.datosMes — no era la misma. Ademas el fallback
   llamaba api.getDatosMes() que no se invoca en el flujo normal.
   FIX: onDatosMes ahora expone window.datosMes; el hydrate lo lee y
   usa getAll como fallback (getAll si trae d.datosMes).
   ── Heredado v5.207
   FIX solapamiento de cards laterales al expandir un panel. El ancho
   del panel central (centerW) no reservaba un GAP de separacion con
   las columnas → en pantallas medianas el panel central se encimaba
   con Patrimonio/Necesidades/Financiero. Ahora hay una garantia dura:
   el panel central nunca invade el hueco de las columnas laterales.
   ── Heredado v5.206
   FIX card expandida de Variables no mostraba nada. Causa: el hydrate
   (a) usaba la global datosMes aunque estuviera vacia (meses:[]), y
   (b) api.getDatosMes() devuelve {ok,datosMes:{...}} envuelto pero se
   pasaba sin desenvolver. Ahora chequea meses.length y desenvuelve
   d.datosMes. Mismo blindaje defensivo aplicado a Fijos (d.gastos).
   ── Heredado v5.205
   FIX panel expandido inconsistente entre monitores + scrollbar nuevo.

   ── Cambios v5.205 ──
   · _hudAjustarTamañoExpandido reescrito. Antes medía la altura
     natural del contenido y crecía el panel a esa medida → en
     monitores altos cabía (sin scroll), en bajos no (con scroll):
     inconsistente, y a veces tapaba de más o se cortaba. Ahora el
     panel SIEMPRE usa la zona disponible (zonaY..zonaH), valor ya
     calculado por pantalla. El contenido scrollea internamente si
     hace falta. Predecible en todo monitor.
   · SCROLLBAR rediseñado: barra delgada (7px), redondeada, violeta
     con gradiente — reemplaza el gris cuadrado del navegador.
     Aplica al panel expandido y a las tablas internas (fjx/vrx).

   ── Heredado v5.204 ──
   WARP — agujero negro que respira (lento y orgánico).

   ── Cambios v5.204 ──
   El warp de v5.203 jalaba todo al centro, muy rápido y muy fuerte.
   Ahora:
   · CICLO RESPIRATORIO (~52s): fase de JALAR (espiral hacia el
     centro) ↔ fase de EXPULSAR (las saca hacia afuera). Transición
     con seno = sin saltos.
   · Órbita siempre presente — las partículas GIRAN mientras entran
     o salen, no caen en línea recta. Espiral real.
   · Atracción MUY suavizada (fuerza base 8-22 vs. 14-104 antes) y
     giro más lento. Todo orgánico, sin succión violenta.

   ── Heredado v5.203 ──
   ORDEN en el fondo del overlay (halos quietos, anillos alineados).

   ── Cambios v5.203 ──
   · HALOS lejanos: quietos y sutiles — brillo FIJO por halo, sin
     pulso. Ya no parpadean caóticos. 6 en vez de 7.
   · ANILLOS del dial: 8→5 aros. TODOS giran en la MISMA dirección
     (horario) a velocidad lenta y pareja → se leen como un solo
     sistema ordenado, no 8 cosas sueltas. Arrancan alineados.
   · WARP → DISCO DE ACRECIÓN real: las partículas espiralan SIEMPRE
     hacia el centro (se eliminó el ciclo big-crunch/big-bang que
     solo hacía gravitar). Aceleran y brillan al acercarse, cruzan
     el horizonte de eventos y son "tragadas" → renacen lejos. Un
     agujero negro de verdad: flujo constante hacia adentro.

   ── Heredado v5.202 ──
   FIX "el fondo se ve gris/opaco, como con una capa encima".

   ── Causa ──
   El _dialOverlay (div fixed que cubre toda la pantalla) tenía
   backdrop-filter:blur(28px) brightness(0.68) + un background
   radial translúcido. El blur "lavaba" los negros del fondo de
   estrellas → gris. Además _particlesCanvas estaba en opacity:0.75,
   dejando ver ese gris a través del fondo.

   ── Fix v5.202 ──
   · _dialOverlay: fondo NEGRO sólido (radial #0a0618→#020308), sin
     backdrop-filter. El overlay ya tiene su fondo de partículas
     opaco, no necesita desenfocar lo de atrás.
   · _particlesCanvas: opacity 0.75 → 1 (fondo de estrellas pleno).
   Ahora el fondo se ve negro profundo y las nebulosas/estrellas
   resaltan como en el mockup.

   ── Heredado v5.201 ──
   MEJORA del fondo del overlay (atmósfera tipo mockup).

   ── Cambios v5.201 ──
   · NEBULOSA VISIBLE: capa nueva pre-renderizada a canvas offscreen
     (buildNebulaLayer/drawNebulaLayer). Manchas moradas/azules/cian
     en esquinas y bordes, con textura de polvo. Antes la nebulosa
     solo modulaba el brillo de estrellas (nebulaIntensityAt) pero no
     se veía. Optimización: estática + drawImage por frame = costo
     casi nulo. nebulaIntensityAt NO se tocó.
   · ANILLOS DEL DIAL: 8 aros concéntricos (solid/dashed/ticks) con
     glow, girando a distintas velocidades — estructura tipo Dyson.
   · HALOS LEJANOS: 7 objetos cósmicos (núcleo + aro) por el fondo.
   · ESTRELLAS: densidad +40% (368-580). Constelaciones 8→13.
   · WARP suavizado 5x (0.6→0.12): el ciclo big-crunch ahora es un
     drift casi imperceptible — ya no "se siente raro".
   Rayos, sinapsis, flujos y curvas: SIN cambios.

   ── Heredado v5.200 ──
   REDISEÑO card expandida de VARIABLES (mockup).
   ── Heredado v5.198
   FIX v5.198 (CAUSA RAÍZ confirmada por dump runtime): al soltar un
   panel, _hudColPositions salía con todo null → fourCols=false →
   layout colapsaba a 2 columnas y amontonaba los paneles. Causa:
   r (geometría del dial) venía de getBoundingClientRect, inestable
   tras un drop. AHORA en modo normal r se calcula matemáticamente
   (dial centrado, tamaño _calcDialSize) SIEMPRE. v5.193-197 atacaron
   sintomas; esta es la causa real.
   ── Heredado v5.197
   FIX v5.197: lock de reentrada GLOBAL (window._reposLock) + el DnD ya
   no hookea _reposicionarHUD. El hook congelaba una referencia vieja
   sin lock (confirmado en runtime: LOCK AUSENTE). Ahora el lock es
   global y el reposicionador avisa al DnD via _overlayDnd.rebuild.
   ── Heredado v5.196
   FIX DEFINITIVO "layout se desconfigura al soltar un panel".

   ── Causa raíz (confirmada con diagnóstico en runtime) ──
   El dump de window._hudPanels al reproducir el bug mostró que
   _side/_order quedaban CORRECTOS, pero cada columna arrancaba a
   distinta altura (left-1 top:471px, left-2 top:930px...). Imposible
   si colTopY fuese constante. La explicación: _reposicionarHUD se
   ejecutaba de forma REENTRANTE — una segunda llamada entraba antes
   de que la primera terminara de posicionar las 4 columnas. Las dos
   pasadas se pisaban y dejaban columnas a alturas inconsistentes.

   ── Fix v5.196 ──
   _reposicionarHUD ahora tiene un lock de reentrada. Si una llamada
   entra mientras otra está en curso, se ignora y se agenda UNA sola
   re-ejecución limpia al final. La lógica real se movió a
   _reposicionarHUD_impl; el wrapper gestiona el lock.

   v5.193-195 atacaron síntomas (transforms, dimensiones); la causa
   real era la reentrada.

   ── Heredado v5.193 ──
   REDISEÑO card expandida de FIJOS (mockup).

   ── Cambio v5.193 ──
   La vista expandida de Fijos ahora usa renderFijosExpandido()
   (en raw-dashboard.js) en lugar de renderAnualidad. Diseño nuevo:
   tabla con columna ESTADO (badges), checks por mes, fila de
   totales, panel de analisis lateral (3 stat-cards) y 2 graficas
   Chart.js (barras apiladas por servicio + tendencia mensual).

   Los campos que el backend aun no entrega (estado de 4 valores)
   se DERIVAN en el front; cuando el GAS los provea, se usan tal
   cual sin tocar codigo. renderAnualidad NO se modifico (sigue en
   uso por la vista no-expandida).

   ── Heredado v5.192 ──
   Auditoria completa de textos en cards compactas/expandidas.

   ── FIX clicks rotos en +Nueva — causa raíz definitiva (heredado v5.189) ──

   ── Bug ──
   En +Nueva, toggleEntradaDropdown destruye el _dialOverlay y
   _crearDialOverlay lo recrea con document.body.appendChild. Eso lo
   inserta AL FINAL del body — DESPUÉS de los paneles flotantes en
   orden DOM (los paneles se crearon en la primera carga y persisten).

   Combinación letal:
     · _dialOverlay tiene backdrop-filter:blur(28px) saturate(160%)
       brightness(0.68) → crea stacking context independiente
     · _dialOverlay z-index:9000, paneles z-index:9001
     · Overlay aparece DESPUÉS en orden DOM
     · Resultado: aunque z-index del panel es mayor, el stacking context
       creado por backdrop-filter combinado con orden DOM hace que
       document.elementFromPoint() retorne dial-overlay sobre los paneles
     · Clicks llegan al overlay (que tiene pointer-events:auto para el
       "click fuera para cerrar"), no a los paneles
     · Solo Sim banda (megatabs) seguía funcionando porque... no sé,
       quizás su posición coincide con un área del overlay donde el
       stacking diverge.

   ── Fix ──
   En _crearDialOverlay, en lugar de document.body.appendChild(_dialOverlay),
   usar document.body.insertBefore(_dialOverlay, primerPanel). Esto pone
   el overlay ANTES de los paneles en orden DOM. Ahora los paneles ganan
   por z-index (9001>9000) Y por orden DOM (vienen después).

   ── Heredado v5.129 ──
   Forzar z-index:9001 y pointer-events:auto en paneles tras reset.

   ── Heredado v5.127 ──
   Limpieza quirúrgica en toggleEntradaDropdown.
   "resetear" los paneles antes de abrirDial. Pero eso eliminaba TODO el
   styling visual original (background, border, box-shadow, animation,
   font-family, CSS variables --pc-dim/--pc-mid/--pc-glow). Yo
   reaplicaba solo unos pocos (position, opacity, visibility, etc.).
   
   Resultado: los paneles perdían su aspecto visual y POSIBLEMENTE su
   capacidad de capturar clicks (algunos hovers CSS dependen del border
   y de las variables que se borraron).

   ── Fix v5.127 ──
   Limpieza QUIRÚRGICA en lugar de cssText=''. Solo limpiar las
   propiedades que abrirDial/reposicionarHUD necesitan recalcular:
     · left/top/right/bottom
     · width/height/min-max
     · overflowY/transform/clipPath
     · opacity/visibility/transition (para que abrirDial los maneje)
     · pointer-events (vacío = hereda default auto)
   NO se tocan: background, border, box-shadow, backdrop-filter,
   animation, font-family, CSS variables --pc-X.

   El listener del CARRUSEL (megatabs) y los listeners de los botones
   de EXPANSIÓN están registrados en los paneles, que NO se destruyen.
   Como ahora no rompemos su styling, sus interacciones funcionan.

   El listener del DIAL CANVAS se recrea en _crearDialOverlay junto con
   el canvas nuevo, así que ese también funciona.

   ── Heredado v5.126 ──
   Cards laterales conservan COL_W dinámico al entrar a modo expandido.

   ── Heredado v5.125 ──
   +Nueva destruye _dialOverlay y usa el mismo flujo de DOMContentLoaded.

   ── Heredado v5.121 ──
   Eliminar paneles huérfanos creados por raw-core.
   _refrescarEspejos → re-reposicionar (paneles crecen con datos reales).
   window.abrirDial/cerrarDial expuestos. Cache bust.

   ── Heredado v5.119 ──
   cerrarDial setTimeout no pisa estado si reabriste.
   Re-reposicionar después del render Sim banda.

   ── Heredado v5.118 ──
   Sub-ring se anima al desaparecer.

   ── Heredado v5.117 ──
   Dial dinámico responsivo con _calcDialSize().

   ── Heredado v5.113 ──
   Primer intento dial fijo en 580.

   ── Heredado v5.112 ──
   FIX bug zoom: _resetDuroLayout() limpia inline styles antes de
   _reposicionarHUD por resize.

   ── Heredado v5.111 ──
   Primer intento dial 10% más chico.

   ── Heredado v5.110 ──
   Sin scroll vertical en cards laterales. Limpieza preventiva de
   maxHeight/overflowY/height en cada pasada de positionCol. inner.minHeight
   limpiado antes de medir topMaxH para garantizar que el zoom recupere.

   ── Heredado v5.109 ──
   FIX BUG "todo encimado, paneles de la columna interna no se ven, zoom
   out lo descompone". Causa: positionCol usaba altura natural y solo
   reducía gap, insuficiente para columnas con paneles altos.

   ── Heredado v5.108 ──
   Fix DnD: estado consistente con _normalizarOrders() después de cada drop,
   saveLayout ordena por _order, restoreLayout valida IDs.

   ── Heredado v5.107 ──
   Cambios desde v5.106:
   - APERTURA RALENTIZADA (a petición). El dial sentía un "pop" demasiado
     rápido y la cascada se veía apurada. Ajustes:
     · Cascada: T_CASCADA_DUR 2800ms → 4200ms (más separación entre cards).
     · Cards: transición individual 1200/1300ms → 1800/1900ms (cada card se
       revela más despacio, con más blur→nítido visible).
     · Aro pulsante: 1400ms → 1800ms.
     · Dial: opacity 1700/transform 1900 → opacity 3200/transform 3400
       (casi el doble; el dial ahora es claramente el más lento del
       timeline, "que se revele más lento que las demás cosas").
     · T_SLOTS_IN: 4500 → 5900.
     · T_DIAL_IN: 6000 → 7700 (pausa post-slots ~1.8s).
     · T_CLEANUP: 8100 → 11200 (espera a que termine el fade lento).

   ── Heredado v5.106 ──
   - APERTURA: pausa de 1.5s entre cascada de cards y entrada del dial
     (T_DIAL_IN = T_SLOTS_IN + 1500). Esto da el "respiro" pedido:
     primero se asientan las cards, luego entra el dial.
   - CARDS 20% MÁS ANCHAS cuando hay espacio: COL_W ahora es dinámico,
     288px si el viewport lo permite (4 cols a 288 con sus gaps caben en
     leftSpace y rightSpace), 240px en pantallas más chicas como fallback.
   - FIX BUG regreso de modo expandido (radical):
       a) display:none → forzar reflow → display:'' en TODOS los paneles
          ANTES del reposicionamiento. Limpia cualquier dimensión cacheada
          que el navegador haya guardado de cuando los paneles estaban en
          modo expandido (scrollHeight grande, anchos heredados, etc.).
       b) CAP de seguridad: topMaxH nunca puede exceder 220px. Si la
          medición de scrollHeight devuelve algo mayor (típicamente por
          un estado de medición intermedio), se trunca para evitar las
          columnas verticales gigantes que se veían en v5.105.

   ── Heredado v5.105 ──
   FIX BUG regreso modo expandido (PARCIAL — bug persistía).
     Track aparecía dentro de la fila top, USER/Sim/Stats con alturas
     desmedidas, Misión/Logro/Nivel a media pantalla, columnas amontonadas.
     CAUSA: la rama expandida de _reposicionarHUD modifica width/top/left
     y otros estilos inline de varios paneles (width:240 a laterales,
     opacity:0 a Logro/Track). Al colapsar, esos inline styles se quedaban
     contaminando el reposicionamiento normal: las mediciones de
     scrollHeight para topMaxH/botH salían incorrectas y las transitions
     a medio camino capturaban posiciones intermedias.
     FIX (v5.105, todavía vigente):
       1. Limpiar SELECTIVAMENTE los inline styles que la rama expandida
          puso (width, height, minHeight, transform, clipPath de todos;
          opacity y pointer-events solo de Logro/Track).
       2. Quitar transitions de left/top/width/height para que el
          reposicionamiento sea INSTANTÁNEO (solo opacity .35s para
          suavizar visualmente). Las transitions completas regresan en
          futuras interacciones cuando ya hay layout estable.
       3. Hacer DOS pasadas de _reposicionarHUD dentro de rAFs encadenados
          para que el browser haga reflow entre limpieza y medición.

   ── Heredado v5.104 ──
   Timeline ralentizado ~1.5x, dial canvas con fade muy suave 1700ms,
   perimeter scan + breathing en todos los cards (con scan secundario),
   GAPS aumentados a 22.
     · t=450  aro pulsante (antes 300)
     · t=1700 cascada paneles (antes 1100), duración cascada 2800ms (antes 1800)
     · t=4500 slots vacíos (antes 2900)
     · t=5100 dial canvas (antes 3300) — transición 1700ms MUY suave (antes 800)
     · t=7200 cleanup (antes 4800)
     Backdrop fade: 720ms (antes 480). Aro pulsante fade: 1400ms (antes 900).
     Paneles transition: 1200ms (antes 820).
   - VIDA EN PANELES (perimeter scan + breathing):
     · Ahora se aplica a TODOS los cards (antes solo 2-3 random con breathing
       y 1-2 con scan).
     · Breathing más lento: 5.5s (antes 4.2s).
     · Scan principal con duración 7.5s (antes 5.8s) y offset rotacional
       aleatorio por panel.
     · NUEVO scan secundario ::after — gira en dirección opuesta a 11s,
       offset distinto al principal forzado >120° aparte, color más tenue
       (opacity .32 vs .55). Mismo concepto que los 2 arcos del dial.
   - GAPS entre cards aumentados: GAP=22 (antes 14) en _reposicionarHUD y
     raw-overlay-dnd.js. Las columnas siguen pegadas al dial pero ahora hay
     más respiración vertical entre paneles de la misma columna.

   ── Heredado v5.103 ──
   FIX BUG "columnas encimadas al regresar de modo expandido":
   Cuando se daba click en el dial mini para colapsar, las columnas
   laterales regresaban a posiciones encimadas sobre el dial central.
     CAUSA: _reposicionarHUD() leía `r = _dialCanvas.getBoundingClientRect()`
     al inicio, pero en ese momento el dial todavía estaba animándose desde
     la posición mini (80px abajo, position:fixed) hacia el tamaño grande
     centrado, así que `r` reflejaba un rect intermedio chiquito. Los
     cálculos de `colA_X..colD_X` que dependen de `r.left`/`r.right`
     terminaban pegando las columnas contra el centro.
     FIX: introducimos bandera `window._hudReturningFromExpand` durante
     toda la ventana de animación (.42s). Mientras está activa,
     _reposicionarHUD calcula el rect FINAL del dial manualmente
     (min(836,57vw) centrado) en lugar de leer el rect animándose.

   - FIX BUG "todo aparece simultáneamente al inicio (animación de apertura)":
     El listener DOMContentLoaded tenía su PROPIA versión de la animación
     de apertura, sin timeline ordenado: hacía aparecer el dial con fade
     de 2000ms y los paneles con setTimeout(1100 + i*200) lineal, todos
     a la vez al inicio. NO ejecutaba la secuencia ring→cascada→slots→dial.
     FIX: el listener DOMContentLoaded ahora llama directamente a abrirDial(),
     que ya tiene el timeline correcto:
       t=0      backdrop fade-in
       t=300    aro circular pulsante (P-1b)
       t=1100   cascada de paneles
       t=2900   slots vacíos punteados (P-2b)
       t=3300   dial canvas (P-3)
       t=4800   cleanup + vida (breathing/scan al azar)
     Bonus: agregamos override de `r` también durante la apertura inicial
     (cuando el dial tiene transform:scale(0.85) que descalibraría
     boundingClientRect).

   ── Heredado v5.102 ──
   Fix: slots vacíos punteados se ocultan al expandir un card y se
   reconstruyen al colapsar (regresar al dial central).
   - _hudExpand llama window._overlayDnd.clear() al inicio para borrar
     los slots existentes.
   - _hudCollapse reconstruye con window._overlayDnd.buildGhostSlots()
     dentro del setTimeout(500ms) post-reposicionamiento, cuando los
     paneles ya están en sus posiciones finales.
   - raw-overlay-dnd.js expone clear y clearGhostSlots en window._overlayDnd.
   - buildGhostSlots ya tenía guard `if(window._hudExpanded) return;`
     que evita reconstruir DURANTE el modo expandido; ahora también
     se borran los que ya estaban antes de expandir.

   ENCONTRÉ DOS LUGARES donde _reposicionarHUD pisaba el opacity:0 de la
   cascada y hacía a los paneles INSTANTÁNEAMENTE visibles:

   1) Líneas ~1538/1541 (zona top): pUser y pStats tenían inline-style:
        pUser.el.style.visibility='visible'; pUser.el.style.opacity='';
      Esto se ejecuta INCONDICIONALMENTE en cada _reposicionarHUD. Cuando
      abrirDial llamaba _reposicionarHUD para colocar paneles, USER y
      Stats se volvían visibles al instante, ignorando el opacity:0 que
      la cascada acababa de aplicar.
      FIX: solo aplicar visibility/opacity si !_animatingEntry.

   2) Líneas ~1446 (forEach de "regreso de modo expandido"): este código
      se ejecuta SIEMPRE que no haya panel expandido (incluyendo la
      apertura inicial). Limpiaba opacity de TODOS los paneles.
      FIX: skip si _animatingEntry está activo.

   Ahora la cascada respetada por _reposicionarHUD y la timeline de
   apertura funciona como debe:
     t=0      backdrop fade-in
     t=300ms  aro circular pulsante (P-1b)
     t=1100ms cascada de paneles
     t=2900ms slots vacíos punteados (P-2b)
     t=3300ms dial canvas completo
     t=4800ms limpieza + vida (breathing/scan al azar)

     t=0      → backdrop fade-in (sin nada visible)
     t=300ms  → FASE 1: aro circular pulsante aparece (P-1b)
                · Glow ambiental + 2 círculos SVG delineados (uno principal
                  + uno secundario interior) + punto central pulsante.
                · Keyframes dialRingPulse y dialDotPulse propios.
     t=1100ms → FASE 2: empieza CASCADA de paneles (shuffle aleatorio)
     t=2900ms → FASE 2b: SLOTS VACÍOS punteados aparecen (P-2b)
                · Mientras window._hudCascadaEnCurso=true, buildGhostSlots
                  no construye nada. Al finalizar cascada se pone en false.
     t=3300ms → FASE 3: DIAL CANVAS aparece con su animación
                · El aro pulsante se atenúa a opacity 0.18 para no competir.
     t=4800ms → limpieza final + breathings/scans al azar

   FIX layout 2x2 columnas pegadas al dial:
     Antes: colA_X = GAP (extremo izquierdo del viewport) y la fila top
     quedaba toda pegada a la izquierda con espacio vacío a la derecha.
     Ahora: col-B termina junto al borde izq del dial; col-A queda a su
     izquierda. Col-C empieza junto al borde der del dial; col-D va a su
     derecha. Si no caben, se ajustan al borde del viewport con clamp.
     Resultado: USER alineado con col-A (izq extremo), Stats alineado con
     col-D (der extremo), Sim band ocupa todo el centro.

   - SECUENCIA de apertura del overlay reordenada:
     · t=0–600ms: BREATHING ambiental visible primero (boost del _glowEl
       con brightness 2.2 + saturate 1.4 que vuelve a normal en ~800ms).
     · t=600–2400ms: CASCADA de paneles (BREATH_LEAD_MS = 600).
     · t=2600ms: DIAL aparece con su animación.
     · t=4000ms: limpieza y aplicar vida (breathings/scans).
   - Fechas en checks de Activity: setActivityCheck del backend ahora
     guarda fecha de check como NOTA de la celda (sin nuevas columnas).
     getActivityCheck lee las notas y expone checksFechas/fechaCompletado.
     itemList en raw-core.js muestra la fecha al lado del nombre con
     formato "dd/mes HH:mm".

   - CASCADA RETROFUTURISTA: todos los paneles (incluido USER) entran con
     fade-in + slide + filter brightness(0.4)blur(2px)→normal, en ~820ms
     de transición y delays distribuidos 200–2000ms con shuffle aleatorio.
     Sensación de "sistema cargando después de años de no usarse".
   - DIAL APARECE DESPUÉS: ahora oculto al inicio (opacity:0 + scale 0.85)
     y aparece a los ~2200ms con su propia animación de 700ms.
   - 4 COLUMNAS (2 izq + 2 der) sin achicar el dial. Distribución:
     · left-1: Patrimonio + Bitácora
     · left-2: Necesidades + Fijos
     · right-1: Financiero + Variables
     · right-2: Activity+Logros
     Se aprovechan los costados disponibles.
   - SLOTS PUNTEADOS más visibles: opacity 0.85 (antes 1 invisible),
     borde 0.55 (antes 0.35), background 0.08 (antes 0.04), shadow inset
     + outer glow, hover, icono más grande con drop-shadow.
   - DnD soporta 4 columnas: layout v2 con keys left-1/left-2/right-1/
     right-2/bottom. STORAGE_KEY igual; al cargar layouts viejos hay
     fallback a los lados nuevos por id.
   - SLOTS VACÍOS aparecen en columnas vacías (right-2 si solo tiene
     Activity, etc.) usando window._hudColPositions exportadas desde
     _reposicionarHUD.
   - cerrarDial limpia opacity del dial canvas y _animatingEntry para
     que la próxima apertura arranque limpia.
   - _hudCollapse limpia también height y transform de bottom panels
     para evitar amontonamiento residual.

   - Antes: panel expandido tenía altura FIJA de 55vh y se anclaba al
     topRowBottom, quedando pegado arriba. Si el contenido era más alto
     que 55vh, scroll vertical interno (caso Necesidades).
   - Ahora: _hudAjustarTamañoExpandido mide el scrollHeight del contenido
     después del hydrate (con reintentos para esperar SVG/sparklines).
     · Si contenido cabe en la zona disponible → altura = contenido,
       centrado verticalmente entre fila top y fila bottom, sin scroll.
     · Si no cabe → altura = zona disponible completa, scroll interno.
   - Zona disponible = vH − topRowBottom − bottomRow − dialMiniReserva.
   - El ancho subió a min(1100px, vW-480) para que Patrimonio expandido
     no se vea apretado.
   - _hudCollapse limpia _zonaY/_zonaH y los inline-styles del wrapper.
   - Se llama post-hydrate en _hudExpand con setTimeout 60ms.

   - NECESIDADES expandido: BUG de datos en blanco arreglado. Las keys
     de los niveles son '1'..'5' (numéricos como string), NO los nombres
     como 'fisiologicas'. _hudRenderNecesidadesEn ahora usa NIVELES_CFG
     con keys correctos.
   - NECESIDADES expandido: nuevo diseño tipo image 2 con:
     · Header con título + chips 2026/Hasta hoy/Hoy
     · Radar + Pirámide lado a lado (cards con borde)
     · Lista detallada con icono + label + descripción + estado
       (descuidado/ok/alto badge) + barra + % + monto
     · Total invertido al pie
   - PATRIMONIO expandido: nuevo diseño tipo image 1 "CENTRO PATRIMONIAL":
     · Header con título + chip "Sistema estable" + tabs (Resumen/Saldos/
       Distribución/Movimientos) + chip "Hoy"
     · 5 cards top: Disponible Hoy, Banco, Efectivo, Apartados, Fondo
       de Emergencia (con sparklines y deltas vs ayer)
     · Banda: Patrimonio Bruto − Disponible Total = Apartados/Objetivos
       con % del patrimonio bruto
     · Saldos y Cuentas: tabla con cuenta + saldo + Δ Hoy + tendencia 7D
     · Distribución de Fondos: donut SVG con leyenda lateral
     · Apartados y Objetivos: cards (max 2 visibles + botón Nuevo)
     · Flujo y Liquidez: sparkline 7d + Ingresos/Egresos/Balance Neto

   1. FINANCIERO EXPANDIDO duplicaba el contenido viejo arriba:
      el CSS .hud-expanded .hud-collapsed-content{display:none} no se
      estaba aplicando por especificidad de inline styles. Ahora _hudExpand
      FUERZA display:none inline a TODOS los hijos collapsed cuando se
      expande, y _hudCollapse los restaura cuando se cierra.
   2. PANELES INFERIORES amontonados al regresar del modo expandido:
      la rama expandida deja width/opacity/pointer-events inline en
      Misión/Logro/Nivel/Track, y al colapsar el flujo normal solo
      reasigna left+top (no width), así que el width queda forzado.
      Ahora _hudCollapse limpia esos inline-styles de TODOS los bottom
      panels al colapsar.
   3. SIM needs (banda top): barra más visible — altura 5px, fondo y
      borde más contrastados, margen top de 2px para separar del valor.

   - SIM needs (banda top) ahora con BARRA de progreso visible bajo cada
     valor. Layout cambiado de horizontal compacto (icono+label+barra+valor
     en línea) a vertical (icono+label arriba, valor en medio, barra full-
     width abajo). La barra ahora ocupa el 100% del ancho del slot.
   - SPARKLINE decorativo en el HEADER de cada panel del overlay (línea
     SVG mini junto al título, con el color del panel). Pseudo-aleatorio
     determinista según el color (mismo panel siempre con mismo perfil).
   - EXCEDENTE del mes en el panel Financiero ahora con SIGNO explícito
     (+ verde para positivos, − para negativos) usando setMoneySigned.
   - FINANCIERO EXPANDIDO completo con 8 sub-componentes:
     · Header con status chip "Sistema estable"
     · 5 cards top: Ingresos, Egresos, Excedente, Ahorro %, Runway
       (las 3 primeras con sparkline; las 2 últimas con sub-label)
     · Visión General: donut SVG de tasa de ahorro + lista (Ing/Egr/Aho)
     · Gasto Promedio Diario: bar chart por día de semana
     · Proyección Financiera: Mejor / Base / Peor escenario
     · Protección fin de mes: barra dual Inversionista vs Consumidor
     · Análisis Mensual: tabla con totales + ahorro %
     · Tendencia de Excedente: sparkline grande
     · Desglose Táctico: top 6 entes con monto + % + total
   - VIDA EN PANELES (al azar en cada apertura):
     · 2-3 paneles con BREATHING (pulse del glow cada 4.2s)
     · 1-2 paneles con PERIMETER SCAN (línea de luz que recorre el borde
       cada 5.8s, con offset rotacional aleatorio para que no coincidan)
     · El track inferior se excluye (es muy chico). El set varía cada
       vez que se abre el overlay.
   - FIX Necesidades expandido sin datos: window._necInlineData estaba
     undefined porque la var local _necInlineData de raw-dashboard.js
     no se espejaba al window. Ahora se asigna en api.getNecesidades
     y en renderNecesidadesInline.
*/

var _dialOverlay   = null;
var _dialCanvas    = null;
var _dialCtx       = null;
var _dialHovered   = -1;
var _dialSubHov    = -1;
var _dialActiveSub = -1;
var _dialVisible   = false;
var _dialCentroHov  = false;
var _dialPulseT     = 0;
var _dialPulseLastT = 0;   // v7.071 — timestamp del último frame del pulso (cap 30fps)
var _dialRAF        = null;
var _subRingProg    = 0;
var _subRingRAF     = null;
var _subRingPrevSub = -1;
var _dialBreathT    = 0;
var _dialBreathLastT = 0;  // v7.071 — timestamp del último frame del breathing (cap 30fps)
var _dialBreathRAF  = null;

var _DC = {
  W:920, H:920, CX:460, CY:460,
  R_IN:90,
  R_OUT:310,
  R_SI:328,
  R_SO:420,
  GAP:0.022,
};

// ══════════════════════════════════════════
//  SIMS NEEDS — config y cálculo
// ══════════════════════════════════════════
var _SIMS_NEEDS = [
  { key:'hambre',   label:'Hambre',   icon:'🍔', color:'#FB923C' },
  { key:'energia',  label:'Energía',  icon:'⚡',  color:'#FBBF24' },
  { key:'cuerpo',   label:'Cuerpo',   icon:'💪', color:'#F87171' },
  { key:'higiene',  label:'Higiene',  icon:'🚿', color:'#67E8F9' },
  { key:'mental',   label:'Mental',   icon:'🧠', color:'#C4B5FD' },
  { key:'disfrute', label:'Disfrute', icon:'🎮', color:'#F0ABFC' },
  { key:'entorno',  label:'Entorno',  icon:'🏠', color:'#86EFAC' },
  { key:'social',   label:'Social',   icon:'👥', color:'#93C5FD' },
  { key:'trabajo',  label:'Trabajo',  icon:'💼', color:'#22D3EE' },
];

function _calcSimsNeeds(){
  // Cada need: 0-100. Empieza en 0 y SUMA según datos reales.
  // Si no hay datos definidos para un need → queda en 0.
  // (Los thresholds y fórmulas reales se definirán cuando exista la lógica de scoring.)
  var n = { hambre:0, energia:0, cuerpo:0, higiene:0, mental:0, disfrute:0, entorno:0, social:0, trabajo:0 };
  var act = window._actData;
  if(act){
    var diaKey = ['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];
    // Hábitos personales con tag sims → +14 al need correspondiente si tiene check hoy
    (act.habitosPersonal||[]).forEach(function(h){
      if(h.checks && h.checks[diaKey] && h.sims){
        var k = h.sims.toLowerCase().trim();
        if(n.hasOwnProperty(k)) n[k] = Math.min(100, n[k] + 14);
      }
    });
    // Trabajo: porcentaje de hábitos electronics completados hoy
    var elecHabits = (act.habitosElectronics||[]);
    if(elecHabits.length){
      var elecDone = elecHabits.filter(function(h){ return h.checks && h.checks[diaKey]; }).length;
      n.trabajo = Math.round((elecDone/elecHabits.length)*100);
    }
  }
  // Mental: pensamientos registrados (cap 10 → 100%)
  if(window._pensamientosData && window._pensamientosData.items && window._pensamientosData.items.length){
    var pCount = window._pensamientosData.items.length;
    n.mental = Math.min(100, pCount*10);
  }
  // Social: relaciones con interacción últimos 7 días
  if(window._relacionesData && window._relacionesData.items && window._relacionesData.items.length){
    var hace7 = new Date(); hace7.setDate(hace7.getDate()-7);
    var recientes = window._relacionesData.items.filter(function(r){
      return r.ultimaVez && new Date(r.ultimaVez) >= hace7;
    }).length;
    n.social = Math.min(100, recientes*20);
  }
  // Disfrute: logros completados
  if(window._logrosData && window._logrosData.items && window._logrosData.items.length){
    var done = window._logrosData.items.filter(function(l){
      return l.completado==='Sí'||l.completado===true;
    }).length;
    n.disfrute = Math.min(100, done*10);
  }
  return n;
}

function renderSimsNeeds(targetId){
  var id = targetId || 'hud-sim-needs-grid';
  var el = document.getElementById(id);
  if(!el){
    // Reintentar 3 veces con espera
    if(!renderSimsNeeds._retry) renderSimsNeeds._retry = 0;
    if(renderSimsNeeds._retry < 5){
      renderSimsNeeds._retry++;
      setTimeout(function(){ renderSimsNeeds(id); }, 100);
    }
    return;
  }
  renderSimsNeeds._retry = 0;
  var needs = _calcSimsNeeds();
  el.innerHTML = _SIMS_NEEDS.map(function(s){
    var v = needs[s.key];
    if(v === undefined || v === null) v = 50; // fallback siempre visible
    var col = s.color;
    var lowCol = v < 30 ? '#EF4444' : (v < 60 ? '#FBBF24' : col);
    return '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;min-width:0">'+
      '<div style="font-size:18px;line-height:1;filter:drop-shadow(0 0 6px '+col+'66)">'+s.icon+'</div>'+
      '<div style="font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(220,220,240,0.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">'+s.label+'</div>'+
      '<div style="width:100%;height:3px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">'+
        '<div style="height:100%;width:'+v+'%;background:'+lowCol+';box-shadow:0 0 6px '+lowCol+'80;transition:width .6s ease;border-radius:2px"></div>'+
      '</div>'+
      '<div style="font-size:11px;font-weight:800;color:'+lowCol+';font-variant-numeric:tabular-nums;text-shadow:0 0 6px '+lowCol+'55">'+v+'</div>'+
    '</div>';
  }).join('');
}
window.renderSimsNeeds = renderSimsNeeds;

// ══════════════════════════════════════════
//  XP / NIVEL / STATS — derivados de actData/logrosData/etc
// ══════════════════════════════════════════
function _calcXPNivel(){
  var xp = 0;
  // Hábitos completados (cualquier check de la semana)
  var act = window._actData;
  if(act){
    (act.habitosPersonal||[]).forEach(function(h){
      if(h.checks){ Object.keys(h.checks).forEach(function(k){ if(h.checks[k]) xp += 25; }); }
    });
    (act.habitosElectronics||[]).forEach(function(h){
      if(h.checks){ Object.keys(h.checks).forEach(function(k){ if(h.checks[k]) xp += 30; }); }
    });
  }
  // Logros completados
  if(window._logrosData && window._logrosData.items){
    window._logrosData.items.forEach(function(l){
      if(l.completado==='Sí'||l.completado===true) xp += 200;
    });
  }
  // Bitácora: pensamientos, relaciones, salud
  if(window._pensamientosData && window._pensamientosData.items){
    xp += window._pensamientosData.items.length * 8;
  }
  if(window._relacionesData && window._relacionesData.items){
    xp += window._relacionesData.items.length * 12;
  }
  if(window._saludData && window._saludData.items){
    xp += window._saludData.items.length * 15;
  }
  // Cada nivel cuesta 1000 XP base, escalando 250 por nivel: 1000, 1250, 1500, ...
  // Aproximación lineal simple: nivel = floor(xp/1000)+1, xpEnNivel = xp % 1000, meta = 1000
  var nivel = Math.max(1, Math.floor(xp / 1000) + 1);
  var xpActual = xp % 1000;
  var xpMeta = 1000;
  return { xpTotal:xp, nivel:nivel, xpActual:xpActual, xpMeta:xpMeta };
}

function _calcRachaCreditos(){
  // Racha: días consecutivos con al menos 1 hábito personal cumplido (aproximación)
  // Como solo tenemos checks por día de la semana actual, contamos días con check de la semana
  var racha = 0;
  var act = window._actData;
  if(act && act.habitosPersonal){
    var dias = ['L','M','W','J','V','S','D'];
    var hoyIdx = (new Date().getDay()+6)%7;
    // Cuenta días hacia atrás desde hoy mientras haya al menos un check
    for(var i=hoyIdx; i>=0; i--){
      var dk = dias[i];
      var hayCheck = act.habitosPersonal.some(function(h){ return h.checks && h.checks[dk]; });
      if(hayCheck) racha++;
      else break;
    }
  }
  // Créditos: 100 por logro completado + 10 por hábito hoy
  var creditos = 0;
  if(window._logrosData && window._logrosData.items){
    creditos += window._logrosData.items.filter(function(l){ return l.completado==='Sí'||l.completado===true; }).length * 100;
  }
  if(act){
    var diaKey = ['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];
    creditos += (act.habitosPersonal||[]).filter(function(h){ return h.checks && h.checks[diaKey]; }).length * 10;
    creditos += (act.habitosElectronics||[]).filter(function(h){ return h.checks && h.checks[diaKey]; }).length * 15;
  }
  // Energía: derivada del need 'energia' del Sim
  var n = (typeof _calcSimsNeeds==='function') ? _calcSimsNeeds() : { energia:50 };
  var energia = n.energia || 50;
  return { racha:racha, creditos:creditos, energia:energia };
}

function _calcMisionDiaria(){
  // Misión: completar X hábitos de hoy. X = total de hábitos personales hoy.
  var act = window._actData;
  if(!act) return { hechos:0, total:3, label:'Registra 3 hábitos hoy', recompensa:'+50 XP' };
  var diaKey = ['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];
  var hechos = (act.habitosPersonal||[]).filter(function(h){ return h.checks && h.checks[diaKey]; }).length;
  var total  = (act.habitosPersonal||[]).length || 3;
  var meta   = Math.min(total, 3);
  return {
    hechos: Math.min(hechos, meta),
    total: meta,
    label: 'Completa '+meta+' hábitos hoy',
    recompensa: '+'+(meta*25)+' XP',
  };
}

function _calcLogroReciente(){
  // Logro reciente NO completado con mayor avance
  var lg = window._logrosData;
  if(!lg || !lg.items || !lg.items.length) return { titulo:'—', avance:0 };
  var pendientes = lg.items.filter(function(l){ return !(l.completado==='Sí'||l.completado===true); });
  if(!pendientes.length){
    var ult = lg.items[lg.items.length-1];
    return { titulo:(ult && ult.titulo)||'—', avance:100 };
  }
  // Tomar el de mayor avance
  pendientes.sort(function(a,b){ return (b.avance||0)-(a.avance||0); });
  var p = pendientes[0];
  return { titulo:p.titulo||'—', avance:Math.round(p.avance||0) };
}

function _calcNivelSiguiente(){
  var x = _calcXPNivel();
  var pct = Math.round((x.xpActual/x.xpMeta)*100);
  var dots = 8;
  var dotsLlenos = Math.min(dots, Math.round((pct/100)*dots));
  return {
    nivelAct: x.nivel,
    nivelSig: x.nivel+1,
    xpFalta: x.xpMeta - x.xpActual,
    pct: pct,
    dots: dots,
    dotsLlenos: dotsLlenos,
    creditosBonus: 250,
  };
}

// ══════════════════════════════════════════
//  RENDER BANDA SIM ESTILO SIMS (2x5 con barras horizontales)
// ══════════════════════════════════════════
function renderSimsBandSimsStyle(targetId){
  var id = targetId || 'hud-sim-band-grid';
  var el = document.getElementById(id);
  if(!el){
    if(!renderSimsBandSimsStyle._retry) renderSimsBandSimsStyle._retry = 0;
    if(renderSimsBandSimsStyle._retry < 5){
      renderSimsBandSimsStyle._retry++;
      setTimeout(function(){ renderSimsBandSimsStyle(id); }, 100);
    }
    return;
  }
  renderSimsBandSimsStyle._retry = 0;
  var needs = _calcSimsNeeds();
  // Layout: cada need en una fila horizontal compacta — icono + label + barra + valor
  // Estructura: barra ocupa el espacio principal (flex:2), label a la izquierda
  el.innerHTML = _SIMS_NEEDS.map(function(s){
    var v = needs[s.key];
    if(v === undefined || v === null) v = 0;
    var col = s.color;
    var barCol = v === 0 ? 'rgba(120,120,130,0.45)' : (v < 30 ? '#EF4444' : (v < 55 ? '#FBBF24' : col));
    var valCol = v === 0 ? 'rgba(180,184,200,0.50)' : barCol;
    return ''+
      '<div class="hud-need">'+
        '<div class="hud-need-top">'+
          '<span class="hud-need-ico" style="color:'+col+';filter:drop-shadow(0 0 4px '+col+'88)">'+s.icon+'</span>'+
          '<span class="hud-need-l">'+s.label+'</span>'+
        '</div>'+
        '<div class="hud-need-mid">'+
          '<span class="hud-need-v" style="color:'+valCol+'">'+v+'<span class="max">/100</span></span>'+
        '</div>'+
        '<div class="hud-need-bar-wrap">'+
          '<div class="hud-need-bar" style="width:'+v+'%;background:linear-gradient(90deg,'+barCol+'aa,'+barCol+');box-shadow:0 0 6px '+barCol+'88"></div>'+
        '</div>'+
      '</div>';
  }).join('');
}
window.renderSimsBandSimsStyle = renderSimsBandSimsStyle;

function _crearDialOverlay(){
  if(_dialOverlay) return;

  _dialOverlay = document.createElement('div');
  _dialOverlay.id = 'dial-overlay';

  _dialCanvas = document.createElement('canvas');
  _dialCanvas.width  = _DC.W;
  _dialCanvas.height = _DC.H;
  _dialCanvas.style.cssText = 'display:block;cursor:pointer;width:min(580px,40vw);height:min(580px,40vw);position:relative;pointer-events:auto;z-index:5';
  _dialCtx = _dialCanvas.getContext('2d');

  _dialOverlay.style.cssText = [
    // v6.031: el overlay cubre toda la pantalla (inset:0). La barra
    // superior fija (hero) se dibuja ENCIMA gracias a su z-index:10000
    // > 9000. El contenido del overlay (dial + paneles) se desplaza
    // hacia abajo el alto de la barra mediante el post-proceso de
    // _reposicionarHUD (offset --hero-h), para no quedar tapado por
    // ella ni dejar hueco. El fondo cósmico sí ocupa todo (se ve
    // también detrás de la barra translúcida, lo cual es correcto).
    'position:fixed','inset:0','z-index:9000',
    'display:none','align-items:center','justify-content:center',
    'opacity:0','pointer-events:none',
    'background:radial-gradient(ellipse at center,#0a0618 0%,#020308 100%)',
  ].join(';');

  // ── Glow ambiental — v5.150: más intenso para que el dial se sienta como núcleo neuronal ──
  var _glowEl = document.createElement('div');
  _glowEl.id = 'dial-ambient';
  _glowEl.style.cssText = [
    'position:absolute','inset:0','pointer-events:none','z-index:0',
    // Doble radial: uno violeta interior intenso, otro azul muy difuso exterior
    'background:radial-gradient(circle 480px at 50% 50%, rgba(140,90,220,0.16) 0%, rgba(120,80,200,0.08) 35%, transparent 70%), '+
                'radial-gradient(circle 760px at 50% 50%, rgba(34,211,238,0.05) 0%, transparent 80%)',
    'animation:dialBreath 4s ease-in-out infinite',
  ].join(';');
  if(!document.getElementById('dial-keyframes')){
    var ks = document.createElement('style');
    ks.id = 'dial-keyframes';
    ks.textContent = [
      // v5.150: respiración más amplia para el glow ambiental
      '@keyframes dialBreath{0%,100%{opacity:.75;transform:scale(1);}50%{opacity:1;transform:scale(1.10);}}',
      '@keyframes dialGlowPulse{0%,100%{box-shadow:0 0 0 1px rgba(120,80,200,0.08),0 4px 32px rgba(0,0,0,0.5);}50%{box-shadow:0 0 0 1px rgba(140,100,220,0.20),0 4px 48px rgba(80,40,140,0.3),0 0 60px rgba(120,80,200,0.08);}}',
      '.hud-panel-glow{animation:dialGlowPulse 4s ease-in-out infinite;}',
      // ── v7.120 — FIX DIAL VOLADOR (arriba-izquierda al volver de niv-2) ──
      // CAUSA (cazada con el auditor de consola): el centrado del dial vivía
      // SOLO en el inline `display:flex;align-items:center;justify-content:center`
      // del overlay. _dialReanudar (al subir de niv-2) hace
      // `_dialOverlay.style.display = ''`, lo que BORRA el flex inline → el div
      // cae a `display:block` → el canvas (position:relative) deja de centrarse
      // y se va a la esquina superior-izquierda. El snapshot lo confirmó:
      // overlay _disp pasó de "flex" a "block".
      // SOLUCIÓN DE RAÍZ: el centrado vive en una REGLA CSS. Aunque se borre el
      // display inline, el overlay vuelve a flex centrado por la regla. Solo se
      // exceptúa cuando está explícitamente oculto (display:none inline inicial)
      // o en niv-2 (donde el overlay es puro fondo y no centra nada).
      'html:not(.niv-2) #dial-overlay:not([style*="display:none"]):not([style*="display: none"]){' +
        'display:flex !important;align-items:center !important;justify-content:center !important;}',
    ].join('');
    document.head.appendChild(ks);
  }
  _dialOverlay.appendChild(_glowEl);

  // ══════════════════════════════════════════════════════════════════
  //  v5.176: DISCO BLUR detrás del dial
  //  Capa con backdrop-filter circular que desenfoca las partículas
  //  del fondo en la zona del dial. Z-index 0.5 (entre el canvas de
  //  partículas y el canvas del dial). Resultado: el dial se ve nítido
  //  encima, las partículas se ven difuminadas a través de él, creando
  //  profundidad y respetando la jerarquía visual.
  // ══════════════════════════════════════════════════════════════════
  var _dialBlurDisc = document.createElement('div');
  _dialBlurDisc.id = 'dial-blur-disc';
  _dialBlurDisc.style.cssText = [
    'position:absolute',
    'left:50%','top:50%',
    'width:min(640px,44vw)','height:min(640px,44vw)',
    'transform:translate(-50%,-50%)',
    'border-radius:50%',
    'pointer-events:none',
    'z-index:0',
    // v5.178: blur más intenso + fondo oscuro semi-opaco para tapar más
    'backdrop-filter:blur(24px) saturate(120%) brightness(0.85)',
    '-webkit-backdrop-filter:blur(24px) saturate(120%) brightness(0.85)',
    'background:radial-gradient(circle at 50% 50%, rgba(8,6,18,0.55) 0%, rgba(8,6,18,0.40) 45%, rgba(8,6,18,0.0) 78%)',
    // Mask radial: opaque en el centro, fade hacia el borde
    '-webkit-mask:radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 82%)',
    'mask:radial-gradient(circle at 50% 50%, rgba(0,0,0,1) 55%, rgba(0,0,0,0) 82%)',
  ].join(';');
  _dialOverlay.appendChild(_dialBlurDisc);

  // ══════════════════════════════════════════════════════════════════
  //  v5.152: ESTRUCTURA TIPO ANILLOS DE DYSON / GALAXIA CIBERNÉTICA
  //  Reemplaza los clusters dispersos que dejaban zonas vacías.
  //  Ahora 4 anillos concéntricos alrededor del dial que cubren todo
  //  el viewport. Nodos distribuidos angularmente con jitter mínimo.
  //  Conexiones tangenciales (arcos orbitales) + radiales (entre
  //  anillos) + raíces del dial. Rotación orbital lenta (anillos
  //  pares e impares en sentido opuesto). Biomimético: orgánico en
  //  forma pero geométrico en estructura como anillos planetarios.
  // ══════════════════════════════════════════════════════════════════
  var _particlesCanvas = document.createElement('canvas');
  _particlesCanvas.id = 'dial-particles';
  _particlesCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:1';
  // v5.202: opacity 0.75 → 1. Con 0.75 el fondo de estrellas/nebulosas
  // dejaba ver el gris de detrás → se sumaba al efecto "lavado".
  _dialOverlay.appendChild(_particlesCanvas);

  (function initEverything(){
    // ══════════════════════════════════════════════════════════════════
    //  v5.168: TODO INTEGRADO Y EN MOVIMIENTO
    //  • Rayos curvos que parten del CENTRO ABSOLUTO y rotan
    //  • Estrellas en órbitas keplerianas (nacen, brillan, mueren)
    //  • Constelaciones (grupos irregulares de estrellas conectadas)
    //  • Red neuronal: sinapsis fugaces entre estrellas cercanas
    //  • Pulsos viajando por rayos y sinapsis
    //  • Vórtices puntuales con ondas concéntricas
    //  • Trayectorias caóticas de Lorenz
    //  • Espirales áureas girando
    //  • Nebulosa moduladora (zonas brillantes/oscuras)
    //  El dial queda visualmente ENCIMA del canvas (z-index 0).
    //  Por eso los rayos pueden partir del centro absoluto sin problema.
    // ══════════════════════════════════════════════════════════════════
    var pctx, lastT = 0, animId = null, _frameCounter = 0;
    var W = 0, H = 0, CX = 0, CY = 0, DIAL_R = 0, MAX_R = 0;
    var PALETTE = ['#A78BFA', '#22D3EE', '#4ADE80', '#C4B5FD', '#67E8F9', '#86EFAC'];
    var PHI = (1 + Math.sqrt(5)) / 2;

    // Estructuras
    var stars = [];
    var rays = [];            // rayos del centro absoluto
    var meteors = [];         // v5.169: estrellas fugaces / meteoros
    var dust = [];            // v5.169: polvo cósmico (puntitos pequeños)
    var orbitRings = [];      // v5.169: anillos orbitales sutiles
    var interMesh = [];       // v5.171: red interestelar (no pasa por el centro)
    var mandalas = [];        // v5.171: geometría tipo crop circles
    var warpParticles = [];   // v5.181: disco de acreción / agujero negro central
    var constellations = [];  // grupos de estrellas conectadas
    var synapses = [];        // conexiones fugaces neuronales
    var pulses = [];
    var vortices = [];
    var lorenzTrails = [];    // trayectorias caóticas
    var spirals = [];         // espirales áureas
    var nebulaBlobs = [];     // gaussianas moviéndose

    var globalT = 0;
    var galaxyRotation = 0;   // rotación global de la galaxia

    /* v7.030 — FASE 4A · WARP DE TRANSICIÓN
       Efecto velocidad-luz al cruzar de nivel. _warpEnergia va de 0 a 1
       y decae sola; mientras es >0, las estrellas se mueven en radio y
       se dibujan estiradas como líneas (efecto Star Wars). Con energía
       0, el motor se comporta EXACTAMENTE como antes — es aditivo.
         _warpDir = +1  → estrellas hacia el centro (sumergirse)
         _warpDir = -1  → estrellas hacia afuera   (emerger)
       raw-niveles.js dispara el warp vía window._dispararWarp(dir). */
    var _warpEnergia = 0;
    var _warpDir     = 1;
    window._dispararWarp = function(dir){
      _warpDir = (dir < 0) ? -1 : 1;
      _warpEnergia = 1;
    };

    function resize(){
      var dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      CX = W / 2; CY = H / 2;
      DIAL_R = Math.min(W, H) * 0.22;
      MAX_R = Math.hypot(W/2, H/2) + 30;
      _particlesCanvas.width = W * dpr;
      _particlesCanvas.height = H * dpr;
      _particlesCanvas.style.width = W + 'px';
      _particlesCanvas.style.height = H + 'px';
      pctx = _particlesCanvas.getContext('2d');
      pctx.scale(dpr, dpr);
    }

    // ── KEPLER: velocidad angular según radio ──
    function angularVel(r){
      return 0.18 / Math.sqrt(Math.max(50, r));
    }

    function polar2cart(r, theta){
      return { x: CX + Math.cos(theta) * r, y: CY + Math.sin(theta) * r };
    }

    // ══════════════════════════════════════════════════════════════════
    //  NEBULOSA: blobs gaussianos que se mueven
    // ══════════════════════════════════════════════════════════════════
    function initNebula(){
      nebulaBlobs = [];
      for(var i = 0; i < 5; i++){
        nebulaBlobs.push({
          x: CX + (Math.random() - 0.5) * W * 0.8,
          y: CY + (Math.random() - 0.5) * H * 0.8,
          radius: 220 + Math.random() * 180,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          phase: Math.random() * Math.PI * 2,
          color: PALETTE[i % PALETTE.length],
        });
      }
    }

    function updateNebula(dt){
      nebulaBlobs.forEach(function(b){
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if(b.x < 0 || b.x > W) b.vx *= -1;
        if(b.y < 0 || b.y > H) b.vy *= -1;
        b.phase += dt * 0.3;
      });
    }

    function nebulaIntensityAt(x, y){
      var sum = 0;
      for(var i = 0; i < nebulaBlobs.length; i++){
        var b = nebulaBlobs[i];
        var d = Math.hypot(x - b.x, y - b.y);
        if(d < b.radius){
          var falloff = 1 - (d / b.radius);
          sum += falloff * falloff * (0.7 + 0.3 * Math.sin(b.phase));
        }
      }
      return Math.min(1, 0.5 + sum * 0.4);
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.201 — NEBULOSA VISIBLE (capa offscreen pre-renderizada)
    //  Optimización: la nebulosa es estática (solo deriva lentísimo), así
    //  que se pinta UNA vez a un canvas offscreen y por frame solo se hace
    //  un drawImage — costo casi nulo. Da el color/textura del mockup sin
    //  recalcular gradientes cada frame.
    //  nebulaIntensityAt (arriba) NO se toca: sigue modulando estrellas.
    // ══════════════════════════════════════════════════════════════════
    var _nebCanvas = null;       // canvas offscreen con la nebulosa pintada
    var _nebDriftX = 0, _nebDriftY = 0;

    // v5.217: la nebulosa es difusa y borrosa — construirla a MEDIA
    // resolución (1/4 de los píxeles) es invisible al ojo pero 4x más
    // barato. drawNebulaLayer la escala de vuelta al pintar.
    var _NEB_SCALE = 0.5;
    function buildNebulaLayer(){
      _nebCanvas = document.createElement('canvas');
      _nebCanvas.width  = Math.max(1, Math.round(W * _NEB_SCALE));
      _nebCanvas.height = Math.max(1, Math.round(H * _NEB_SCALE));
      var nc = _nebCanvas.getContext('2d', { willReadFrequently: true });
      // Escalar el contexto para que el código de dibujo siga usando
      // coordenadas W/H normales sin cambios.
      nc.scale(_NEB_SCALE, _NEB_SCALE);

      // Colores de nebulosa — morados/azules/cian como el mockup objetivo.
      var NEB_COLORS = [
        'rgba(124, 58, 237, ALPHA)',   // violeta profundo
        'rgba(59, 130, 246, ALPHA)',   // azul
        'rgba(34, 211, 238, ALPHA)',   // cian
        'rgba(139, 92, 246, ALPHA)',   // violeta medio
      ];

      // Manchas de nebulosa. Concentradas en esquinas/bordes (como el
      // mockup), evitando el centro para no competir con el dial.
      // [cx_rel, cy_rel, radio_rel, colorIdx, intensidad]
      var blobs = [
        [0.08, 0.82, 0.42, 0, 0.85],   // abajo-izquierda — fuerte
        [0.92, 0.70, 0.46, 2, 0.90],   // abajo-derecha — fuerte (cian)
        [0.04, 0.30, 0.34, 3, 0.55],   // arriba-izquierda — media
        [0.97, 0.22, 0.30, 1, 0.50],   // arriba-derecha — media
        [0.50, 0.95, 0.40, 0, 0.45],   // borde inferior centro — suave
        [0.72, 0.90, 0.30, 3, 0.40],   // relleno abajo
        [0.20, 0.60, 0.26, 1, 0.35],   // mancha suelta izquierda
      ];

      // Cada mancha = varias capas de gradiente radial superpuestas con
      // leve offset, para que el borde sea irregular y no un círculo.
      blobs.forEach(function(b){
        var bx = b[0] * W, by = b[1] * H;
        var br = b[2] * Math.min(W, H);
        var baseColor = NEB_COLORS[b[3]];
        var intensity = b[4];
        var capas = 4;
        for(var c = 0; c < capas; c++){
          var ox = bx + (Math.sin(c * 2.1) * br * 0.22);
          var oy = by + (Math.cos(c * 1.7) * br * 0.22);
          var rad = br * (0.55 + c * 0.18);
          // Alpha por capa: el additive hace que el solape se vea denso.
          var a = (intensity * 0.10) * (1 - c / capas);
          var g = nc.createRadialGradient(ox, oy, 0, ox, oy, rad);
          g.addColorStop(0,   baseColor.replace('ALPHA', a.toFixed(3)));
          g.addColorStop(0.5, baseColor.replace('ALPHA', (a * 0.45).toFixed(3)));
          g.addColorStop(1,   baseColor.replace('ALPHA', '0'));
          nc.globalCompositeOperation = 'lighter';
          nc.fillStyle = g;
          nc.fillRect(0, 0, W, H);
        }
      });

      // Una pasada de "polvo" fino dentro de las nebulosas para textura.
      nc.globalCompositeOperation = 'lighter';
      for(var d = 0; d < 220; d++){
        var blob = blobs[Math.floor(Math.random() * blobs.length)];
        var ang = Math.random() * Math.PI * 2;
        var dist = Math.random() * blob[2] * Math.min(W, H) * 0.7;
        var dx = blob[0] * W + Math.cos(ang) * dist;
        var dy = blob[1] * H + Math.sin(ang) * dist;
        var col = NEB_COLORS[blob[3]].replace('ALPHA', (0.04 + Math.random() * 0.06).toFixed(3));
        nc.fillStyle = col;
        nc.beginPath();
        nc.arc(dx, dy, 0.5 + Math.random() * 1.4, 0, Math.PI * 2);
        nc.fill();
      }
      nc.globalCompositeOperation = 'source-over';
    }

    // Dibuja la nebulosa pre-renderizada con un drift lentísimo (parallax).
    function drawNebulaLayer(dt){
      if(!_nebCanvas) return;
      _nebDriftX = Math.sin(globalT * 0.03) * 14;
      _nebDriftY = Math.cos(globalT * 0.022) * 10;
      pctx.save();
      pctx.globalCompositeOperation = 'lighter';
      pctx.globalAlpha = 0.9;
      // v5.217: el canvas está a media resolución — escalarlo a tamaño
      // completo al pintar. drawImage con dimensiones destino lo estira.
      pctx.drawImage(_nebCanvas, _nebDriftX, _nebDriftY, W, H);
      pctx.restore();
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.201 — HALOS LEJANOS (objetos cósmicos con aro)
    //  Puntos brillantes con un aro tenue alrededor, repartidos por el
    //  fondo — las "esferas" lejanas del mockup. Ligeros: vectoriales.
    // ══════════════════════════════════════════════════════════════════
    var farHalos = [];
    function buildFarHalos(){
      farHalos = [];
      var n = 6;  // v5.203: uno menos, más espaciados
      for(var i = 0; i < n; i++){
        farHalos.push({
          x: 0.10 + Math.random() * 0.80,   // relativo a W
          y: 0.10 + Math.random() * 0.80,   // relativo a H
          ringR: 16 + Math.random() * 16,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          // v5.203: brillo FIJO por halo (sin pulso). Cada uno tiene su
          // intensidad estable — discretos, no parpadeantes.
          bright: 0.35 + Math.random() * 0.30,
        });
      }
    }
    function drawFarHalos(dt){
      // v5.203: halos QUIETOS y sutiles — sin pulso. Objetos lejanos
      // discretos, no luces parpadeando caóticas.
      pctx.save();
      pctx.globalCompositeOperation = 'lighter';
      for(var i = 0; i < farHalos.length; i++){
        var h = farHalos[i];
        var hx = h.x * W, hy = h.y * H;
        // No dibujar si cae sobre el dial central (queda feo encima).
        if(Math.hypot(hx - CX, hy - CY) < DIAL_R * 1.5) continue;
        // Núcleo brillante — alpha fijo
        var cg = pctx.createRadialGradient(hx, hy, 0, hx, hy, 3.5);
        cg.addColorStop(0, h.color);
        cg.addColorStop(1, 'transparent');
        pctx.globalAlpha = h.bright;
        pctx.fillStyle = cg;
        pctx.beginPath(); pctx.arc(hx, hy, 3.5, 0, Math.PI*2); pctx.fill();
        // Aro alrededor — tenue y fijo
        pctx.globalAlpha = 0.14;
        pctx.strokeStyle = h.color;
        pctx.lineWidth = 1;
        pctx.beginPath();
        pctx.arc(hx, hy, h.ringR, 0, Math.PI*2);
        pctx.stroke();
      }
      pctx.restore();
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.201 — ANILLOS CONCÉNTRICOS DEL DIAL (estructura tipo Dyson)
    //  Varios aros alrededor del dial: unos continuos finos, otros
    //  segmentados/punteados, con glow, girando a distintas velocidades.
    //  Vectorial y ligero — ~8 aros, trazos simples.
    // ══════════════════════════════════════════════════════════════════
    var dialRings = [];
    function buildDialRings(){
      dialRings = [];
      // v5.203: 5 aros (antes 8). TODOS giran en la MISMA dirección
      // (horario) y a velocidad LENTA y pareja → se leen como un solo
      // sistema ordenado, no 8 cosas sueltas girando caóticas.
      // [factor_radio, tipo, grosor, nSegmentos]
      var defs = [
        [1.20, 'solid',  1.0,  0],
        [1.36, 'dashed', 1.2, 36],
        [1.54, 'ticks',  1.3, 72],
        [1.74, 'solid',  0.8,  0],
        [1.96, 'dashed', 0.9, 30],
      ];
      var ROT_BASE = 0.018;  // velocidad base lenta, igual para todos
      defs.forEach(function(d, i){
        dialRings.push({
          rFactor: d[0], type: d[1], width: d[2], nSeg: d[3],
          // Todos en la misma dirección. Los exteriores apenas más
          // lentos (parallax sutil), pero el MISMO sentido.
          rotSpeed: ROT_BASE * (1 - i * 0.10),
          rot: 0,  // arrancan alineados, no aleatorio
          color: i % 2 === 0 ? '#A78BFA' : '#22D3EE',
          phase: i * 0.7,
        });
      });
    }
    function drawDialRings(dt){
      pctx.save();
      pctx.globalCompositeOperation = 'lighter';
      for(var i = 0; i < dialRings.length; i++){
        var ring = dialRings[i];
        ring.rot += ring.rotSpeed * dt;
        ring.phase += dt * 0.6;
        var R = DIAL_R * ring.rFactor;
        // Glow suave que respira
        var breathe = 0.5 + 0.5 * Math.sin(ring.phase);
        var baseA = 0.10 + breathe * 0.10;
        pctx.strokeStyle = ring.color;
        pctx.lineWidth = ring.width;
        pctx.shadowColor = ring.color;
        pctx.shadowBlur = 6;

        if(ring.type === 'solid'){
          pctx.globalAlpha = baseA;
          pctx.beginPath();
          pctx.arc(CX, CY, R, 0, Math.PI * 2);
          pctx.stroke();
        } else if(ring.type === 'dashed'){
          pctx.globalAlpha = baseA * 1.3;
          var segLen = (Math.PI * 2) / ring.nSeg;
          for(var s = 0; s < ring.nSeg; s += 2){
            var a0 = ring.rot + s * segLen;
            pctx.beginPath();
            pctx.arc(CX, CY, R, a0, a0 + segLen * 0.7);
            pctx.stroke();
          }
        } else if(ring.type === 'ticks'){
          pctx.globalAlpha = baseA * 1.1;
          pctx.shadowBlur = 3;
          for(var t = 0; t < ring.nSeg; t++){
            var ang = ring.rot + (t / ring.nSeg) * Math.PI * 2;
            var inner = R - 3, outer = R + 3;
            pctx.beginPath();
            pctx.moveTo(CX + Math.cos(ang) * inner, CY + Math.sin(ang) * inner);
            pctx.lineTo(CX + Math.cos(ang) * outer, CY + Math.sin(ang) * outer);
            pctx.stroke();
          }
        }
      }
      pctx.shadowBlur = 0;
      pctx.restore();
    }


    //  RAYOS DEL CENTRO ABSOLUTO (parten de CX,CY y rotan)
    // ══════════════════════════════════════════════════════════════════
    function buildRays(){
      rays = [];
      var nRays = 14;  // v5.169: más rayos
      for(var i = 0; i < nRays; i++){
        rays.push({
          theta: (i / nRays) * Math.PI * 2 + Math.random() * 0.3,
          length: 0.55 + ((i * 13) % 5) * 0.10,  // factor de MAX_R
          rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.025 + (i % 3) * 0.012),
          curvature: ((i * 7) % 3 - 1) * 0.6,
          phase: i * 0.6,
          color: PALETTE[i % PALETTE.length],
          // Vida pulsante
          lifePhase: i * Math.PI / 4,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  ESTRELLAS EN ÓRBITAS (keplerianas)
    // ══════════════════════════════════════════════════════════════════
    function buildStars(){
      stars = [];
      // v7.066 — recorte agresivo: techo 460 (era 580), piso 280 (era 368).
      // El ojo no distingue 580 vs 460 estrellas en un fondo, pero el costo
      // de cada estrella en cada frame es real. ~20% menos costo.
      var nStars = Math.max(280, Math.min(460, Math.floor((W * H) / 3800)));
      if(_lowEndDevice) nStars = Math.floor(nStars * 0.55); // v5.217: menos estrellas en equipos modestos
      for(var i = 0; i < nStars; i++){
        var u = Math.random();
        var r = 30 + (MAX_R - 30) * Math.pow(u, 0.7);
        var theta = Math.random() * Math.PI * 2;
        stars.push({
          r: r,
          theta: theta,
          omega: angularVel(r),
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.8 + Math.random() * 1.6,
          baseSize: 0.5 + Math.random() * 1.4,
          age: Math.random() * 10,
          lifespan: 8 + Math.random() * 12,
          isHub: Math.random() < 0.1,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  CONSTELACIONES (grupos irregulares conectados)
    // ══════════════════════════════════════════════════════════════════
    function buildConstellations(){
      constellations = [];
      var nConst = _lowEndDevice ? 7 : 13;  // v5.217: menos constelaciones en equipos modestos
      for(var c = 0; c < nConst; c++){
        // Centro del grupo en órbita
        var cR = 200 + Math.random() * (MAX_R - 250);
        var cTheta = (c / nConst) * Math.PI * 2 + Math.random() * 0.5;
        var nPoints = 3 + Math.floor(Math.random() * 4);
        var points = [];
        for(var p = 0; p < nPoints; p++){
          // Cada punto a un offset polar pequeño del centro del grupo
          var dR = (Math.random() - 0.5) * 80;
          var dTheta = (Math.random() - 0.5) * 0.4;
          points.push({
            dR: dR,
            dTheta: dTheta,
            phase: Math.random() * Math.PI * 2,
            twinkleSpeed: 1.2 + Math.random() * 2.0,
            baseSize: 0.8 + Math.random() * 0.8,
          });
        }
        constellations.push({
          cR: cR,
          cTheta: cTheta,
          omega: angularVel(cR),
          points: points,
          color: PALETTE[c % PALETTE.length],
          age: Math.random() * 6,
          lifespan: 10 + Math.random() * 8,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  ESPIRALES ÁUREAS (girando)
    // ══════════════════════════════════════════════════════════════════
    function buildSpirals(){
      spirals = [];
      for(var i = 0; i < 2; i++){
        spirals.push({
          direction: i === 0 ? 1 : -1,
          phaseOffset: i * Math.PI,
          turns: 3.5,
          a: 45,
          b: 0.306,
          color: i === 0 ? '#A78BFA' : '#22D3EE',
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (i === 0 ? 0.04 : -0.03),
          lifePhase: i * Math.PI,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  LORENZ
    // ══════════════════════════════════════════════════════════════════
    function spawnLorenz(){
      lorenzTrails.push({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: 5 + Math.random() * 10,
        history: [],
        color: Math.random() < 0.5 ? '#4ADE80' : '#C4B5FD',
        scale: 10 + Math.random() * 6,
        centerX: CX + (Math.random() - 0.5) * W * 0.6,
        centerY: CY + (Math.random() - 0.5) * H * 0.6,
        age: 0,
        maxAge: 8 + Math.random() * 4,
      });
    }

    function updateLorenz(dt){
      for(var i = lorenzTrails.length - 1; i >= 0; i--){
        var l = lorenzTrails[i];
        l.age += dt;
        if(l.age >= l.maxAge){ lorenzTrails.splice(i, 1); continue; }
        // Sistema de Lorenz
        var step = dt * 0.4;
        var dx = 10 * (l.y - l.x);
        var dy = l.x * (28 - l.z) - l.y;
        var dz = l.x * l.y - (8/3) * l.z;
        l.x += dx * step;
        l.y += dy * step;
        l.z += dz * step;
        var px = l.centerX + l.x * l.scale * 0.5;
        var py = l.centerY + (l.z - 28) * l.scale * 0.5;
        // v5.170: si se sale del viewport, acelerar el fin de vida
        // pero gradualmente — NO morir de golpe. Lo dejamos en la fase de
        // fade-out (>0.8 del lifespan) en lugar de matar instantáneamente.
        if(px < -50 || px > W + 50 || py < -50 || py > H + 50){
          // Llevarlo al 82% de la vida (en fase fade-out) si no está ya ahí
          var targetAge = l.maxAge * 0.82;
          if(l.age < targetAge) l.age = targetAge;
          continue; // no agregar al history este punto
        }
        l.history.push({ x: px, y: py });
        if(l.history.length > 45) l.history.shift();
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  VÓRTICES
    // ══════════════════════════════════════════════════════════════════
    function spawnVortex(){
      var r = 100 + Math.random() * (MAX_R - 150);
      var theta = Math.random() * Math.PI * 2;
      vortices.push({
        r: r, theta: theta,
        omega: angularVel(r),
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        age: 0,
        lifespan: 3 + Math.random() * 2,
        maxRadius: 50 + Math.random() * 40,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    //  SINAPSIS: neuronas conectándose fugazmente
    // ══════════════════════════════════════════════════════════════════
    function spawnSynapse(){
      if(stars.length < 2) return;
      var s1 = stars[Math.floor(Math.random() * stars.length)];
      if(!s1._cachedX) return;
      var best = null, bestD = Infinity;
      for(var i = 0; i < stars.length; i++){
        var s2 = stars[i];
        if(s2 === s1 || !s2._cachedX) continue;
        var d = Math.hypot(s1._cachedX - s2._cachedX, s1._cachedY - s2._cachedY);
        if(d > 280) continue;
        if(d < bestD){ bestD = d; best = s2; }
      }
      if(!best) return;
      synapses.push({
        s1: s1, s2: best,
        age: 0,
        lifespan: 2.0 + Math.random() * 2.5,   // v5.170: 2-4.5s (antes 1-2.5)
        color: s1.color,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    //  PULSOS
    // ══════════════════════════════════════════════════════════════════
    function spawnPulse(){
      var pool = [];
      rays.forEach(function(r){ pool.push({ type:'ray', ref:r }); });
      synapses.forEach(function(s){
        if(s.age < s.lifespan * 0.7) pool.push({ type:'synapse', ref:s });
      });
      if(!pool.length) return;
      var sel = pool[Math.floor(Math.random() * pool.length)];
      pulses.push({
        type: sel.type,
        ref: sel.ref,
        t: 0,
        speed: 0.4 + Math.random() * 0.4,
        forward: sel.type === 'ray' ? (Math.random() < 0.8) : (Math.random() < 0.5),
        tailT: 0.18 + Math.random() * 0.10,
        life: 1,
      });
    }

    // ══════════════════════════════════════════════════════════════════
    //  DIBUJOS
    // ══════════════════════════════════════════════════════════════════

    // ══════════════════════════════════════════════════════════════════
    //  v5.181: EFECTO WARP / AGUJERO NEGRO (prueba)
    //  Disco de acreción toroidal en el centro absoluto. Partículas que
    //  espiralan hacia adentro acelerando (como materia cayendo al
    //  horizonte de eventos). Queda detrás del dial.
    // ══════════════════════════════════════════════════════════════════
    var warpParticles = [];
    // v5.203: el ciclo cósmico (cosmicPhase/cosmicMode/cosmicCycleTime)
    // se eliminó — el warp ahora es disco de acreción de flujo constante.

    function buildWarp(){
      warpParticles = [];
      // v5.203: disco de acreción — menos partículas (no hace falta llenar
      // toda la pantalla; el flujo hacia el centro es lo que importa).
      var nWarp = _lowEndDevice ? 170 : 340; // v5.217: menos partículas de warp en equipos modestos
      var diag = Math.hypot(W/2, H/2);
      for(var i = 0; i < nWarp; i++){
        warpParticles.push(spawnWarpParticle(diag));
      }
    }

    function spawnWarpParticle(diag){
      if(diag === undefined) diag = Math.hypot(W/2, H/2);
      // v5.203: nace en cualquier radio, distribución uniforme por área.
      var minR = DIAL_R * 0.6;
      var maxR = diag + 60;
      var r = minR + (maxR - minR) * Math.sqrt(Math.random());
      return {
        r: r,
        theta: Math.random() * Math.PI * 2,
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        size: 0.4 + Math.random() * 1.3,
        phase: Math.random() * Math.PI * 2,
        // Velocidad de caída individual — leve variación para que no
        // caigan todas exactamente igual (se ve más orgánico).
        fallRate: 0.85 + Math.random() * 0.3,
        _reborn: 1,
      };
    }

    // v5.204 — AGUJERO NEGRO QUE RESPIRA. Ciclo lento (~52s):
    //  · fase JALAR    → las partículas espiralan hacia el centro
    //  · fase EXPULSAR → el agujero "exhala" y las saca hacia afuera
    // Todo LENTO y orbitando: la órbita (giro) está siempre presente,
    // la componente radial (entrar/salir) es suave y cíclica. Ni la
    // succión violenta de v5.203 ni el campo quieto. Orgánico.
    var _warpCycleT = 0;
    function drawWarp(dt){
      var diag = Math.hypot(W/2, H/2);
      var eventHorizon = DIAL_R * 0.62;

      // ── CICLO RESPIRATORIO ──
      // breath: +1 = jalando al máximo · −1 = expulsando al máximo.
      // Transición con seno → sin saltos. Ciclo largo = cambio lento.
      _warpCycleT += dt;
      var CYCLE = 52;  // segundos por ciclo completo (jalar + expulsar)
      var breath = Math.sin((_warpCycleT / CYCLE) * Math.PI * 2);

      for(var i = 0; i < warpParticles.length; i++){
        var w = warpParticles[i];

        // ── ÓRBITA: siempre presente, misma dirección, LENTA ──
        // Más rápido cerca del centro pero suave (kepleriano amortiguado).
        var safeR = Math.max(eventHorizon, w.r);
        var angVel = (40 / Math.pow(safeR, 0.85)) * 0.42;  // v5.204: giro lento
        w.theta += angVel * dt;
        w.phase += dt * 1.2;

        // ── RADIAL: jalar / expulsar, LENTO y suave ──
        var prox = 1 - Math.min(1, w.r / diag);   // 0 lejos, 1 centro
        // Fuerza base muy suave. breath>0 jala (radialVel negativo),
        // breath<0 expulsa (radialVel positivo).
        // La atracción crece un poco cerca del centro, la expansión
        // crece un poco lejos — pero todo MUY moderado.
        var pullStrength = 8 + prox * 14;          // suave (antes 14+90)
        var pushStrength = 8 + (1 - prox) * 12;
        var radialVel;
        if(breath > 0){
          radialVel = -pullStrength * breath * w.fallRate;
        } else {
          radialVel = pushStrength * (-breath) * w.fallRate;
        }
        w.r += radialVel * dt;

        // ── LÍMITES: tragada al centro / no salirse del todo ──
        if(w.r <= eventHorizon){
          // Solo es "tragada" si está en fase de jalar; si está
          // expulsando, simplemente rebota suave hacia afuera.
          if(breath > 0){
            w.r = diag * (0.72 + Math.random() * 0.40);
            w.theta = Math.random() * Math.PI * 2;
            w.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
            w._reborn = 0;
          } else {
            w.r = eventHorizon + 2;
          }
        } else if(w.r > diag + 70){
          w.r = diag + 70;
        }
        if(w._reborn < 1){
          w._reborn = Math.min(1, w._reborn + dt * 1.0);
        }

        // ── RENDER ──
        var px = CX + Math.cos(w.theta) * w.r;
        var py = CY + Math.sin(w.theta) * w.r;
        var twinkle = 0.7 + 0.3 * Math.sin(w.phase);
        var nearHorizon = Math.max(0, 1 - (w.r - eventHorizon) / (DIAL_R * 1.0));
        // Brillo modulado por la fase: un poco más vivo al jalar.
        var cycleGlow = 0.82 + 0.18 * Math.abs(breath);
        var alpha = (0.16 + prox * 0.46) * twinkle * w._reborn * cycleGlow;
        if(nearHorizon > 0) alpha *= (1 + nearHorizon * 0.9);
        var radius = w.size * (0.7 + prox * 0.7) * (1 + nearHorizon * 0.6);
        var col = prox > 0.7 ? '#E0F2FE' : w.color;
        pctx.fillStyle = col + Math.floor(Math.max(0, Math.min(1, alpha)) * 220).toString(16).padStart(2, '0');
        // v5.214 — OPTIMIZACIÓN: glow solo en partículas que de verdad lo
        // lucen — las cercanas al centro (prox alto) o entrando al
        // horizonte. Las lejanas, que son la mayoría, van sin shadowBlur.
        // v7.065 OPT — umbral subido de 0.45 a 0.55: las partículas entre
        // 0.45 y 0.55 tenían un glow casi imperceptible que sí costaba
        // ciclos. Visualmente indistinguible, computacionalmente ~10%
        // menos costoso para el warp.
        if(prox > 0.55 || nearHorizon > 0){
          pctx.shadowColor = col;
          pctx.shadowBlur = 2 + prox * 9 + nearHorizon * 10;
        } else {
          pctx.shadowBlur = 0;
        }
        pctx.beginPath();
        pctx.arc(px, py, radius, 0, Math.PI * 2);
        pctx.fill();
      }
      pctx.shadowBlur = 0;
    }

    function drawSpirals(dt){
      spirals.forEach(function(sp, idx){
        sp.rotation += sp.rotSpeed * dt;
        sp.lifePhase += dt * 0.08;
        var pulse = (Math.sin(sp.lifePhase) + 1) / 2;
        var alpha = 0.05 + pulse * 0.18;
        if(alpha < 0.03) return;
        pctx.beginPath();
        var prev = null;
        var steps = 220;
        var thetaMax = sp.turns * Math.PI * 2;
        for(var i = 0; i <= steps; i++){
          var theta = (i / steps) * thetaMax;
          var r = sp.a * Math.exp(sp.b * theta);
          if(r > MAX_R) break;
          var ang = sp.direction * theta + sp.rotation + sp.phaseOffset;
          var x = CX + Math.cos(ang) * r;
          var y = CY + Math.sin(ang) * r;
          if(!prev) pctx.moveTo(x, y);
          else pctx.lineTo(x, y);
          prev = { x: x, y: y };
        }
        var alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
        pctx.strokeStyle = sp.color + alphaHex;
        pctx.lineWidth = 0.9;
        pctx.stroke();
      });
    }

    function drawRays(dt){
      rays.forEach(function(ray){
        ray.theta += ray.rotSpeed * dt;
        ray.lifePhase += dt * 0.4;
        var pulse = (Math.sin(ray.lifePhase) + 1) / 2;
        var alpha = 0.30 + pulse * 0.45;

        // v7.067 OPT — cachear trig del ángulo y del perpendicular.
        // Antes se llamaban Math.cos/Math.sin 6 veces por rayo por
        // frame. Ahora 4. Pequeño pero suma con 14 rayos × 30fps.
        var cosT = Math.cos(ray.theta);
        var sinT = Math.sin(ray.theta);
        var perpAng = ray.theta + Math.PI / 2;
        var cosP = Math.cos(perpAng);
        var sinP = Math.sin(perpAng);

        // v5.171: rayLen MÁS ALLÁ de MAX_R para que se pierdan en el horizonte
        var rayLen = (MAX_R + 200) * ray.length + 150;
        var endX = CX + cosT * rayLen;
        var endY = CY + sinT * rayLen;
        // Control point: curvado perpendicularmente
        var midR = rayLen * 0.5;
        var bend = ray.curvature * rayLen * 0.3;
        var cpx = CX + cosT * midR + cosP * bend;
        var cpy = CY + sinT * midR + sinP * bend;
        // Cachear para pulsos
        ray._a = { x: CX, y: CY };
        ray._b = { x: endX, y: endY };
        ray._cp = { x: cpx, y: cpy };

        // v5.174: GRADIENTE biselado — el rayo es tenue cerca del centro
        // (debajo del dial) y se intensifica al salir del radio del dial.
        // El dial visualmente "domina" su zona.
        // (v7.067 intentó cachear gradientes pero rompió visualmente
        // porque los endpoints rotan cada frame. Revertido a recrearlos.)
        var grad = pctx.createLinearGradient(CX, CY, endX, endY);
        var fadeFrac = (DIAL_R + 30) / rayLen;       // hasta qué fracción del rayo es "interior"
        fadeFrac = Math.max(0.05, Math.min(0.6, fadeFrac));
        // Alpha mínimo dentro del dial (muy tenue) y alpha pleno fuera
        var innerAlpha = alpha * 0.18;                // 18% del alpha normal en el centro
        var midAlpha   = alpha * 0.55;                // 55% en la transición
        var outerAlpha = alpha;                       // 100% afuera
        function hex(a){ return Math.floor(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, '0'); }
        grad.addColorStop(0, ray.color + hex(innerAlpha));
        grad.addColorStop(fadeFrac * 0.5, ray.color + hex(innerAlpha));
        grad.addColorStop(fadeFrac, ray.color + hex(midAlpha));
        grad.addColorStop(Math.min(0.98, fadeFrac + 0.15), ray.color + hex(outerAlpha));
        grad.addColorStop(1, ray.color + hex(outerAlpha * 0.85));

        pctx.strokeStyle = grad;
        pctx.lineWidth = 1.0 + pulse * 0.8;
        // Sin shadow para no contaminar la zona del dial; el glow vive
        // solo en los pulsos que viajan
        pctx.shadowBlur = 0;
        pctx.beginPath();
        pctx.moveTo(CX, CY);
        pctx.quadraticCurveTo(cpx, cpy, endX, endY);
        pctx.stroke();
      });
    }

    function drawStars(dt){
      // v7.030 — FASE 4A: factor warp suavizado (curva, no lineal) para
      // que el destello golpee fuerte y se desvanezca con gracia.
      var warp = _warpEnergia > 0 ? (_warpEnergia * _warpEnergia) : 0;
      for(var i = 0; i < stars.length; i++){
        var s = stars[i];
        s.theta += s.omega * dt;
        s.age += dt;
        s.phase += s.twinkleSpeed * dt;
        // v7.030 — WARP: durante el destello, las estrellas se desplazan
        // en radio. _warpDir +1 las jala al centro (sumergirse), -1 las
        // expulsa hacia afuera (emerger). Es un empujón temporal: cuando
        // _warpEnergia vuelve a 0, las órbitas siguen como siempre.
        if(warp > 0){
          s.r += _warpDir * warp * 950 * dt * -1;
          // -1 porque +dir debe ACERCAR (radio decrece). Re-clamp:
          if(s.r < 24){ s.r = 24 + Math.random()*40; }
          if(s.r > MAX_R){ s.r = MAX_R - Math.random()*60; }
        }
        if(s.age > s.lifespan){
          s.r = 30 + (MAX_R - 30) * Math.pow(Math.random(), 0.7);
          s.theta = Math.random() * Math.PI * 2;
          s.omega = angularVel(s.r);
          s.age = 0;
          s.lifespan = 8 + Math.random() * 12;
          s.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        }
        var lifeFrac = s.age / s.lifespan;
        var lifeAlpha;
        if(lifeFrac < 0.20) lifeAlpha = lifeFrac / 0.20;
        else if(lifeFrac > 0.75) lifeAlpha = (1 - lifeFrac) / 0.25;
        else lifeAlpha = 1;
        if(lifeAlpha <= 0){ s._cachedX = null; continue; }
        var twinkle = (Math.sin(s.phase) + 1) / 2;
        var rad = s.baseSize * (0.7 + twinkle * 0.7) * (s.isHub ? 1.5 : 1);
        // v7.067 OPT — polar2cart inlinado para evitar crear un objeto
        // {x,y} por estrella por frame (580 × 30fps = 17400 obj/seg
        // que iban al GC). Las coordenadas van directamente en pX, pY.
        var pX = CX + Math.cos(s.theta) * s.r;
        var pY = CY + Math.sin(s.theta) * s.r;
        var neb = nebulaIntensityAt(pX, pY);
        var alpha = lifeAlpha * (0.5 + twinkle * 0.45) * neb;
        s._cachedX = pX; s._cachedY = pY;
        var colHex = s.color + Math.floor(alpha * 220).toString(16).padStart(2, '0');

        if(warp > 0.04){
          // ── Estrella ESTIRADA: línea radial (efecto velocidad-luz) ──
          // El largo del trazo crece con la energía warp. La línea va
          // del centro hacia afuera, alineada con el radio de la estrella.
          var largo = warp * (s.isHub ? 140 : 90) * (0.6 + twinkle*0.5);
          var ang = s.theta;
          var x2 = CX + Math.cos(ang) * (s.r - largo);
          var y2 = CY + Math.sin(ang) * (s.r - largo);
          pctx.strokeStyle = colHex;
          pctx.lineWidth = rad * 1.2;
          pctx.lineCap = 'round';
          if(s.isHub || s.baseSize > 1.4){
            pctx.shadowColor = s.color;
            pctx.shadowBlur = 6 + warp * 10;
          } else {
            pctx.shadowBlur = 0;
          }
          pctx.beginPath();
          pctx.moveTo(pX, pY);
          pctx.lineTo(x2, y2);
          pctx.stroke();
        } else {
          // ── Estrella normal: punto (motor original, sin tocar) ──
          pctx.fillStyle = colHex;
          // v7.065 OPT — umbral baseSize subido de 1.4 a 1.55. Las
          // estrellas entre 1.4 y 1.55 tenían un glow muy débil que
          // apenas se notaba pero costaba ciclos (shadowBlur es la
          // operación más cara de canvas). Visualmente sin diferencia,
          // ~15-20% menos costo por frame en drawStars.
          if(s.isHub || s.baseSize > 1.55){
            pctx.shadowColor = s.color;
            pctx.shadowBlur = (s.isHub ? 8 : 4) + twinkle * (s.isHub ? 16 : 6);
          } else {
            pctx.shadowBlur = 0;
          }
          pctx.beginPath();
          pctx.arc(pX, pY, rad, 0, Math.PI * 2);
          pctx.fill();
        }
      }
      pctx.shadowBlur = 0;
    }

    function drawConstellations(dt){
      for(var c = constellations.length - 1; c >= 0; c--){
        var con = constellations[c];
        con.cTheta += con.omega * dt;
        con.age += dt;
        if(con.age >= con.lifespan){
          // Respawn
          con.cR = 200 + Math.random() * (MAX_R - 250);
          con.cTheta = Math.random() * Math.PI * 2;
          con.omega = angularVel(con.cR);
          con.age = 0;
          con.lifespan = 10 + Math.random() * 8;
          con.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
        }
        var lifeFrac = con.age / con.lifespan;
        var lifeAlpha;
        if(lifeFrac < 0.20) lifeAlpha = lifeFrac / 0.20;  // v5.170: fade in más largo
        else if(lifeFrac > 0.75) lifeAlpha = (1 - lifeFrac) / 0.25;  // v5.170: fade out más largo
        else lifeAlpha = 1;
        if(lifeAlpha <= 0) continue;

        var centerPt = polar2cart(con.cR, con.cTheta);
        // Cachear posiciones de cada estrella del grupo
        var positions = con.points.map(function(p){
          p.phase += p.twinkleSpeed * dt;
          return polar2cart(con.cR + p.dR, con.cTheta + p.dTheta);
        });

        // Dibujar conexiones del grupo (líneas tenues)
        for(var k = 0; k < positions.length - 1; k++){
          var a = lifeAlpha * 0.40;
          pctx.strokeStyle = con.color + Math.floor(a * 255).toString(16).padStart(2, '0');
          pctx.lineWidth = 0.7;
          pctx.shadowColor = con.color;
          pctx.shadowBlur = 4;
          pctx.beginPath();
          pctx.moveTo(positions[k].x, positions[k].y);
          pctx.lineTo(positions[k+1].x, positions[k+1].y);
          pctx.stroke();
        }
        // Dibujar las estrellas del grupo (más brillantes que las orbitales)
        for(var k = 0; k < positions.length; k++){
          var pp = positions[k];
          var pt = con.points[k];
          var twk = (Math.sin(pt.phase) + 1) / 2;
          var rad = pt.baseSize * (0.8 + twk * 0.8);
          var a = lifeAlpha * (0.6 + twk * 0.4);
          pctx.fillStyle = con.color + Math.floor(a * 230).toString(16).padStart(2, '0');
          pctx.shadowColor = con.color;
          pctx.shadowBlur = 6 + twk * 10;
          pctx.beginPath();
          pctx.arc(pp.x, pp.y, rad, 0, Math.PI * 2);
          pctx.fill();
        }
        pctx.shadowBlur = 0;
      }
    }

    function drawSynapses(dt){
      for(var i = synapses.length - 1; i >= 0; i--){
        var syn = synapses[i];
        syn.age += dt;
        if(syn.age >= syn.lifespan){
          synapses.splice(i, 1);
          continue;
        }
        var frac = syn.age / syn.lifespan;
        var alpha;
        if(frac < 0.25) alpha = frac / 0.25;
        else if(frac > 0.65) alpha = (1 - frac) / 0.35;
        else alpha = 1;
        alpha *= 0.55;
        if(!syn.s1._cachedX || !syn.s2._cachedX) continue;
        var p1 = { x: syn.s1._cachedX, y: syn.s1._cachedY };
        var p2 = { x: syn.s2._cachedX, y: syn.s2._cachedY };
        var mx = (p1.x + p2.x) / 2;
        var my = (p1.y + p2.y) / 2;
        var dx = p2.x - p1.x, dy = p2.y - p1.y;
        var len = Math.hypot(dx, dy) || 1;
        var perpX = -dy / len, perpY = dx / len;
        var off = 18;
        syn._cp = { x: mx + perpX * off, y: my + perpY * off };
        syn._p1 = p1; syn._p2 = p2;
        pctx.strokeStyle = syn.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        pctx.lineWidth = 0.95;
        pctx.shadowColor = syn.color;
        pctx.shadowBlur = 5;
        pctx.beginPath();
        pctx.moveTo(p1.x, p1.y);
        pctx.quadraticCurveTo(syn._cp.x, syn._cp.y, p2.x, p2.y);
        pctx.stroke();
        pctx.shadowBlur = 0;
      }
    }

    function drawVortices(dt){
      for(var i = vortices.length - 1; i >= 0; i--){
        var v = vortices[i];
        v.age += dt;
        if(v.age >= v.lifespan){ vortices.splice(i, 1); continue; }
        v.theta += v.omega * dt;
        var p = polar2cart(v.r, v.theta);
        var frac = v.age / v.lifespan;
        // v5.170: fade in/out global del vórtice
        var globalAlpha;
        if(frac < 0.15) globalAlpha = frac / 0.15;
        else if(frac > 0.80) globalAlpha = (1 - frac) / 0.20;
        else globalAlpha = 1;
        for(var k = 0; k < 3; k++){
          var phaseFrac = (frac + k * 0.25) % 1;
          var radius = phaseFrac * v.maxRadius;
          var a = (1 - phaseFrac) * 0.40 * globalAlpha;
          if(a < 0.02) continue;
          pctx.strokeStyle = v.color + Math.floor(a * 255).toString(16).padStart(2, '0');
          pctx.lineWidth = 1.0;
          pctx.shadowColor = v.color;
          pctx.shadowBlur = 5 * globalAlpha;
          pctx.beginPath();
          pctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          pctx.stroke();
        }
        pctx.shadowBlur = 0;
      }
    }

    function drawLorenz(){
      lorenzTrails.forEach(function(traj){
        if(traj.history.length < 2) return;
        var lifeFrac = traj.age / traj.maxAge;
        var globalAlpha = 1;
        if(lifeFrac < 0.15) globalAlpha = lifeFrac / 0.15;
        else if(lifeFrac > 0.80) globalAlpha = (1 - lifeFrac) / 0.20;
        globalAlpha = Math.max(0, Math.min(1, globalAlpha));
        if(globalAlpha < 0.02) return;
        pctx.lineCap = 'round';
        for(var i = 1; i < traj.history.length; i++){
          var a = (i / traj.history.length) * 0.50 * globalAlpha;
          pctx.strokeStyle = traj.color + Math.floor(a * 200).toString(16).padStart(2, '0');
          pctx.lineWidth = 0.9 * (i / traj.history.length) + 0.3;
          pctx.beginPath();
          pctx.moveTo(traj.history[i-1].x, traj.history[i-1].y);
          pctx.lineTo(traj.history[i].x, traj.history[i].y);
          pctx.stroke();
        }
        var head = traj.history[traj.history.length - 1];
        pctx.fillStyle = traj.color;
        pctx.shadowColor = traj.color;
        pctx.shadowBlur = 8 * globalAlpha;
        pctx.beginPath();
        pctx.arc(head.x, head.y, 1.6 * globalAlpha, 0, Math.PI * 2);
        pctx.fill();
        pctx.shadowBlur = 0;
      });
    }

    function bezierPoint(a, cp, b, t){
      var u = 1 - t;
      return {
        x: u*u*a.x + 2*u*t*cp.x + t*t*b.x,
        y: u*u*a.y + 2*u*t*cp.y + t*t*b.y,
      };
    }

    function drawPulses(){
      for(var pi = pulses.length - 1; pi >= 0; pi--){
        var p = pulses[pi];
        var a, cp, b, color;
        if(p.type === 'ray'){
          var ray = p.ref;
          if(!ray._a) continue;
          a = ray._a; cp = ray._cp; b = ray._b; color = ray.color;
        } else {
          var syn = p.ref;
          if(!syn._p1 || syn.age >= syn.lifespan) {
            pulses.splice(pi, 1);
            continue;
          }
          a = syn._p1; cp = syn._cp; b = syn._p2; color = syn.color;
        }
        var t = p.forward ? p.t : (1 - p.t);
        var samples = [];
        var steps = 12;
        for(var i = 0; i <= steps; i++){
          var tt = t - (p.forward ? 1 : -1) * (i / steps) * p.tailT;
          if(tt < 0 || tt > 1) continue;
          samples.push({ pt: bezierPoint(a, cp, b, tt), alpha: 1 - i / steps });
        }
        if(samples.length < 2) continue;
        pctx.lineCap = 'round';
        for(var s = 1; s < samples.length; s++){
          var aa = samples[s].alpha * p.life * 0.95;
          pctx.strokeStyle = color + Math.floor(aa * 230).toString(16).padStart(2, '0');
          pctx.lineWidth = (p.type === 'ray' ? 2.0 : 1.7) * samples[s].alpha;
          pctx.beginPath();
          pctx.moveTo(samples[s-1].pt.x, samples[s-1].pt.y);
          pctx.lineTo(samples[s].pt.x, samples[s].pt.y);
          pctx.stroke();
        }
        var head = bezierPoint(a, cp, b, t);
        pctx.fillStyle = color;
        pctx.shadowColor = color;
        pctx.shadowBlur = p.type === 'ray' ? 14 : 10;
        pctx.beginPath();
        pctx.arc(head.x, head.y, p.type === 'ray' ? 2.6 : 2.0, 0, Math.PI * 2);
        pctx.fill();
        pctx.shadowBlur = 0;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.169: METEOROS (estrellas fugaces)
    //  v5.170: las trayectorias se extienden MÁS ALLÁ del viewport para
    //  que parezca que se pierden en el horizonte, no que mueren en el borde
    // ══════════════════════════════════════════════════════════════════
    function spawnMeteor(){
      // El meteoro parte de fuera del viewport y termina MÁS allá del lado opuesto
      var side = Math.floor(Math.random() * 4);
      var startX, startY, endX, endY;
      var OVERSHOOT = 250;  // v5.170: distancia más allá del viewport
      switch(side){
        case 0:
          startX = Math.random() * W;
          startY = -OVERSHOOT;
          endX = startX + (Math.random() - 0.5) * 600;
          endY = H + OVERSHOOT;
          break;
        case 1:
          startX = W + OVERSHOOT;
          startY = Math.random() * H;
          endX = -OVERSHOOT;
          endY = startY + (Math.random() - 0.5) * 600;
          break;
        case 2:
          startX = Math.random() * W;
          startY = H + OVERSHOOT;
          endX = startX + (Math.random() - 0.5) * 600;
          endY = -OVERSHOOT;
          break;
        case 3:
          startX = -OVERSHOOT;
          startY = Math.random() * H;
          endX = W + OVERSHOOT;
          endY = startY + (Math.random() - 0.5) * 600;
          break;
      }
      meteors.push({
        startX: startX, startY: startY,
        endX: endX, endY: endY,
        t: 0,
        speed: 0.45 + Math.random() * 0.35,    // v5.170: un poco más lentos para que se vean
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        trailLen: 120 + Math.random() * 100,
      });
    }

    function drawMeteors(dt){
      for(var i = meteors.length - 1; i >= 0; i--){
        var m = meteors[i];
        m.t += m.speed * dt;
        if(m.t >= 1){ meteors.splice(i, 1); continue; }
        // v5.170: fade in al inicio (primeros 0.10) y fade out al final (últimos 0.10)
        var lifeAlpha;
        if(m.t < 0.10) lifeAlpha = m.t / 0.10;
        else if(m.t > 0.90) lifeAlpha = (1 - m.t) / 0.10;
        else lifeAlpha = 1;
        if(lifeAlpha <= 0) continue;
        // Posición actual
        var hx = m.startX + (m.endX - m.startX) * m.t;
        var hy = m.startY + (m.endY - m.startY) * m.t;
        // Posición de la cola
        var totalDist = Math.hypot(m.endX - m.startX, m.endY - m.startY);
        var tailFrac = m.trailLen / totalDist;
        var tt = Math.max(0, m.t - tailFrac);
        var tx = m.startX + (m.endX - m.startX) * tt;
        var ty = m.startY + (m.endY - m.startY) * tt;
        // Gradiente lineal del rastro, modulado por lifeAlpha
        var grad = pctx.createLinearGradient(tx, ty, hx, hy);
        grad.addColorStop(0, m.color + '00');
        grad.addColorStop(1, m.color + Math.floor(0.93 * lifeAlpha * 255).toString(16).padStart(2, '0'));
        pctx.strokeStyle = grad;
        pctx.lineWidth = 1.6 * lifeAlpha;
        pctx.shadowColor = m.color;
        pctx.shadowBlur = 10 * lifeAlpha;
        pctx.beginPath();
        pctx.moveTo(tx, ty);
        pctx.lineTo(hx, hy);
        pctx.stroke();
        // Cabeza brillante
        pctx.fillStyle = m.color + Math.floor(lifeAlpha * 255).toString(16).padStart(2, '0');
        pctx.shadowBlur = 14 * lifeAlpha;
        pctx.beginPath();
        pctx.arc(hx, hy, 2.2 * lifeAlpha, 0, Math.PI * 2);
        pctx.fill();
        pctx.shadowBlur = 0;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.169: POLVO CÓSMICO (puntitos diminutos)
    // ══════════════════════════════════════════════════════════════════
    function buildDust(){
      dust = [];
      var n = Math.floor((W * H) / 4400);  // v7.065 OPT: vuelta a densidad pre-v5.180. Cuesta ~40% menos en frame, visualmente casi idéntico (220→130 partículas en 1920x1080).
      for(var i = 0; i < n; i++){
        // Polvo en coordenadas polares (también orbita lentamente)
        var r = 40 + Math.random() * (MAX_R - 40);
        var theta = Math.random() * Math.PI * 2;
        dust.push({
          r: r,
          theta: theta,
          omega: angularVel(r) * 0.7,   // un poco más lento
          phase: Math.random() * Math.PI * 2,
          twinkleSpeed: 0.5 + Math.random() * 1.5,
          baseSize: 0.15 + Math.random() * 0.45,
          color: Math.random() < 0.7 ? '#FFFFFF' : PALETTE[Math.floor(Math.random() * PALETTE.length)],
        });
      }
    }

    function drawDust(dt){
      for(var i = 0; i < dust.length; i++){
        var d = dust[i];
        d.theta += d.omega * dt;
        d.phase += d.twinkleSpeed * dt;
        var twk = (Math.sin(d.phase) + 1) / 2;
        var alpha = 0.18 + twk * 0.30;
        // v7.067 OPT — polar2cart inlinado (130 partículas × 30fps =
        // 3900 obj/seg menos al GC)
        var dX = CX + Math.cos(d.theta) * d.r;
        var dY = CY + Math.sin(d.theta) * d.r;
        // Modular por nebulosa
        var neb = nebulaIntensityAt(dX, dY);
        alpha *= neb;
        pctx.fillStyle = d.color + Math.floor(alpha * 200).toString(16).padStart(2, '0');
        pctx.beginPath();
        pctx.arc(dX, dY, d.baseSize * (0.7 + twk * 0.5), 0, Math.PI * 2);
        pctx.fill();
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.169: ANILLOS ORBITALES (sugieren las órbitas, muy sutiles)
    // ══════════════════════════════════════════════════════════════════
    // ══════════════════════════════════════════════════════════════════
    //  v5.172: ANILLOS CONCÉNTRICOS tipo HALO / DYSON / STARGATE
    //  Estructuras arquitectónicas, no apenas-visible-dash:
    //  • Anillo principal sólido con glow
    //  • Anillo paralelo dual (estilo Halo)
    //  • Segmentos brillantes ("ventanas") que rotan
    //  • Tick marks geométricos (estilo Stargate, sin glifos)
    // ══════════════════════════════════════════════════════════════════
    function buildOrbitRings(){
      orbitRings = [];
      // 8 anillos a radios graduados — densidad uniforme desde dial hasta horizonte
      var minR = DIAL_R + 80;
      var maxR_local = Math.min(MAX_R - 40, Math.hypot(W/2, H/2) + 20);
      var nRings = 8;
      for(var i = 0; i < nRings; i++){
        var t = i / (nRings - 1);
        var r = minR + (maxR_local - minR) * t;
        if(r >= MAX_R - 10) break;
        // Determinar tipo: alternar para variedad
        var style;
        if(i === 0 || i === 3 || i === 6) style = 'halo';        // anillo doble
        else if(i === 1 || i === 5) style = 'segmented';         // con ventanas rotantes
        else if(i === 2 || i === 7) style = 'stargate';          // con tick marks
        else style = 'solid';                                     // anillo simple
        orbitRings.push({
          r: r,
          phase: i * Math.PI / 4,
          phaseSpeed: 0.12 + i * 0.03,
          color: PALETTE[i % PALETTE.length],
          style: style,
          // Rotación propia para los anillos con elementos rotatorios
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.04 + (i % 3) * 0.02),
          // Número de segmentos/ticks (8-16 según tamaño)
          nSegments: 8 + (i % 5) * 2,
        });
      }
    }

    function drawOrbitRings(dt){
      orbitRings.forEach(function(ring){
        ring.phase += ring.phaseSpeed * dt;
        ring.rotation += ring.rotSpeed * dt;
        var pulse = (Math.sin(ring.phase) + 1) / 2;
        // Alpha base más alto (eran demasiado sutiles)
        var alpha = 0.12 + pulse * 0.16;
        if(alpha < 0.04) return;

        var col = ring.color;
        var alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');

        // --- ANILLO PRINCIPAL (todos los estilos lo tienen) ---
        pctx.strokeStyle = col + alphaHex;
        pctx.lineWidth = 1.0;
        pctx.shadowColor = col;
        pctx.shadowBlur = 4 + pulse * 4;
        pctx.beginPath();
        pctx.arc(CX, CY, ring.r, 0, Math.PI * 2);
        pctx.stroke();

        if(ring.style === 'halo'){
          // Anillo paralelo dual (interior y exterior, 4-6px de separación)
          var separation = 5;
          var outerAlpha = Math.floor(alpha * 0.7 * 255).toString(16).padStart(2, '0');
          pctx.strokeStyle = col + outerAlpha;
          pctx.lineWidth = 0.6;
          pctx.beginPath();
          pctx.arc(CX, CY, ring.r + separation, 0, Math.PI * 2);
          pctx.stroke();
          pctx.beginPath();
          pctx.arc(CX, CY, ring.r - separation, 0, Math.PI * 2);
          pctx.stroke();
        } else if(ring.style === 'segmented'){
          // "Ventanas" brillantes rotando sobre el anillo
          pctx.shadowBlur = 8 + pulse * 6;
          var segArc = (Math.PI * 2) / ring.nSegments;
          var segLen = segArc * 0.35;  // 35% de cada segmento es brillante
          for(var s = 0; s < ring.nSegments; s++){
            var a0 = ring.rotation + s * segArc;
            var a1 = a0 + segLen;
            // Solo cada 2 segmentos para no saturar
            if(s % 2 !== 0) continue;
            var segAlpha = alpha * (1.4 + pulse * 0.6);
            segAlpha = Math.min(0.85, segAlpha);
            pctx.strokeStyle = col + Math.floor(segAlpha * 255).toString(16).padStart(2, '0');
            pctx.lineWidth = 2.0;
            pctx.beginPath();
            pctx.arc(CX, CY, ring.r, a0, a1);
            pctx.stroke();
          }
        } else if(ring.style === 'stargate'){
          // Tick marks geométricos perpendiculares al anillo
          pctx.shadowBlur = 6;
          var tickLen = 7;
          var tickAlpha = Math.floor(alpha * 1.3 * 255).toString(16).padStart(2, '0');
          pctx.strokeStyle = col + tickAlpha;
          pctx.lineWidth = 1.2;
          for(var t2 = 0; t2 < ring.nSegments; t2++){
            var ang = ring.rotation + (t2 / ring.nSegments) * Math.PI * 2;
            var innerR = ring.r - tickLen / 2;
            var outerR = ring.r + tickLen / 2;
            var ix = CX + Math.cos(ang) * innerR;
            var iy = CY + Math.sin(ang) * innerR;
            var ox = CX + Math.cos(ang) * outerR;
            var oy = CY + Math.sin(ang) * outerR;
            pctx.beginPath();
            pctx.moveTo(ix, iy);
            pctx.lineTo(ox, oy);
            pctx.stroke();
          }
          // Puntos luminosos cada 4 ticks (nodos brillantes estilo stargate)
          pctx.fillStyle = col;
          pctx.shadowBlur = 10;
          for(var t3 = 0; t3 < ring.nSegments; t3 += 4){
            var ang2 = ring.rotation + (t3 / ring.nSegments) * Math.PI * 2;
            var px = CX + Math.cos(ang2) * ring.r;
            var py = CY + Math.sin(ang2) * ring.r;
            pctx.beginPath();
            pctx.arc(px, py, 1.8 + pulse * 0.7, 0, Math.PI * 2);
            pctx.fill();
          }
        }

        pctx.shadowBlur = 0;
      });
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.171: RED INTERESTELAR (sinapsis que NO pasa por el centro)
    //  Conexiones efímeras entre estrellas cercanas que descartan
    //  cualquier traza cuyo midpoint quede dentro del radio del dial.
    //  Se distingue de las "synapses" en que tienen vida más larga
    //  y forman cadenas de varias estrellas (no solo 2).
    // ══════════════════════════════════════════════════════════════════
    function spawnInterMesh(){
      if(stars.length < 3) return;
      // Punto de partida: una estrella activa con posición cacheada
      var attempts = 0;
      var start = null;
      while(attempts < 8 && !start){
        var cand = stars[Math.floor(Math.random() * stars.length)];
        if(cand._cachedX) start = cand;
        attempts++;
      }
      if(!start) return;

      // Construir cadena de 3-5 nodos: cada uno conectado al siguiente más cercano
      var chain = [start];
      var current = start;
      var nLinks = 2 + Math.floor(Math.random() * 3); // 2-4 enlaces (3-5 nodos)
      var used = { };
      used[stars.indexOf(start)] = true;

      for(var step = 0; step < nLinks; step++){
        // Buscar vecino cercano que NO pase por el centro
        var nextNode = null, bestD = Infinity;
        for(var k = 0; k < stars.length; k++){
          if(used[k]) continue;
          var cand2 = stars[k];
          if(!cand2._cachedX) continue;
          var d = Math.hypot(current._cachedX - cand2._cachedX, current._cachedY - cand2._cachedY);
          if(d > 300 || d < 60) continue;
          // Midpoint de la línea
          var mx = (current._cachedX + cand2._cachedX) / 2;
          var my = (current._cachedY + cand2._cachedY) / 2;
          // Descartar si pasa cerca del dial
          if(Math.hypot(mx - CX, my - CY) < DIAL_R + 80) continue;
          if(d < bestD){ bestD = d; nextNode = cand2; }
        }
        if(!nextNode) break;
        chain.push(nextNode);
        used[stars.indexOf(nextNode)] = true;
        current = nextNode;
      }
      if(chain.length < 2) return;

      interMesh.push({
        chain: chain,
        age: 0,
        lifespan: 3.5 + Math.random() * 3.0,  // vive 3.5-6.5s
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      });
    }

    function drawInterMesh(dt){
      for(var i = interMesh.length - 1; i >= 0; i--){
        var im = interMesh[i];
        im.age += dt;
        if(im.age >= im.lifespan){ interMesh.splice(i, 1); continue; }
        var frac = im.age / im.lifespan;
        var alpha;
        if(frac < 0.20) alpha = frac / 0.20;
        else if(frac > 0.70) alpha = (1 - frac) / 0.30;
        else alpha = 1;
        alpha *= 0.55;
        // Verificar que todas las estrellas de la cadena siguen activas
        var allActive = true;
        for(var k = 0; k < im.chain.length; k++){
          if(!im.chain[k]._cachedX){ allActive = false; break; }
        }
        if(!allActive){ interMesh.splice(i, 1); continue; }

        // Dibujar la cadena: segmentos consecutivos con leve curva
        pctx.lineCap = 'round';
        for(var k = 0; k < im.chain.length - 1; k++){
          var s1 = im.chain[k], s2 = im.chain[k + 1];
          var mx = (s1._cachedX + s2._cachedX) / 2;
          var my = (s1._cachedY + s2._cachedY) / 2;
          var dx = s2._cachedX - s1._cachedX, dy = s2._cachedY - s1._cachedY;
          var len = Math.hypot(dx, dy) || 1;
          var perpX = -dy / len, perpY = dx / len;
          var off = (k % 2 === 0 ? 1 : -1) * 14;
          var cpx = mx + perpX * off;
          var cpy = my + perpY * off;
          pctx.strokeStyle = im.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
          pctx.lineWidth = 0.85;
          pctx.shadowColor = im.color;
          pctx.shadowBlur = 4;
          pctx.beginPath();
          pctx.moveTo(s1._cachedX, s1._cachedY);
          pctx.quadraticCurveTo(cpx, cpy, s2._cachedX, s2._cachedY);
          pctx.stroke();
        }
        pctx.shadowBlur = 0;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  v5.171: MANDALAS / CROP CIRCLES
    //  Geometría con simetría rotacional en zonas alejadas del centro
    //  Aparecen, giran, se desvanecen. NUNCA en el centro.
    // ══════════════════════════════════════════════════════════════════
    function spawnMandala(){
      // Posición en una de las zonas alejadas del dial
      var attempt = 0;
      var px, py;
      while(attempt < 15){
        // Punto random en el viewport
        px = 100 + Math.random() * (W - 200);
        py = 100 + Math.random() * (H - 200);
        // Debe estar lejos del dial
        if(Math.hypot(px - CX, py - CY) > DIAL_R + 200) break;
        attempt++;
      }
      if(attempt >= 15) return;

      var radius = 35 + Math.random() * 50;
      // Verificar que el mandala completo cabe en el viewport
      if(px - radius < 20 || px + radius > W - 20) return;
      if(py - radius < 20 || py + radius > H - 20) return;

      var nPoints = 6 + Math.floor(Math.random() * 5); // 6-10 puntos (simetría rotacional)
      var pattern = Math.floor(Math.random() * 3);     // 0=flor, 1=estrella, 2=anillos

      mandalas.push({
        x: px, y: py,
        radius: radius,
        nPoints: nPoints,
        pattern: pattern,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() < 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.25),
        color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
        age: 0,
        lifespan: 6 + Math.random() * 4,
      });
    }

    function drawMandalas(dt){
      for(var i = mandalas.length - 1; i >= 0; i--){
        var m = mandalas[i];
        m.age += dt;
        if(m.age >= m.lifespan){ mandalas.splice(i, 1); continue; }
        m.rotation += m.rotSpeed * dt;
        var frac = m.age / m.lifespan;
        var alpha;
        if(frac < 0.20) alpha = frac / 0.20;
        else if(frac > 0.75) alpha = (1 - frac) / 0.25;
        else alpha = 1;
        alpha *= 0.42;

        var col = m.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        pctx.strokeStyle = col;
        pctx.fillStyle = col;
        pctx.shadowColor = m.color;
        pctx.shadowBlur = 6;
        pctx.lineWidth = 0.8;

        if(m.pattern === 0){
          // Patrón flor: círculos pequeños distribuidos angularmente
          // + un círculo central
          pctx.beginPath();
          pctx.arc(m.x, m.y, m.radius * 0.35, 0, Math.PI * 2);
          pctx.stroke();
          for(var k = 0; k < m.nPoints; k++){
            var ang = m.rotation + (k / m.nPoints) * Math.PI * 2;
            var cx = m.x + Math.cos(ang) * m.radius * 0.6;
            var cy = m.y + Math.sin(ang) * m.radius * 0.6;
            pctx.beginPath();
            pctx.arc(cx, cy, m.radius * 0.25, 0, Math.PI * 2);
            pctx.stroke();
          }
        } else if(m.pattern === 1){
          // Patrón estrella: líneas radiales con punto en cada extremo
          for(var k = 0; k < m.nPoints; k++){
            var ang = m.rotation + (k / m.nPoints) * Math.PI * 2;
            var ex = m.x + Math.cos(ang) * m.radius;
            var ey = m.y + Math.sin(ang) * m.radius;
            pctx.beginPath();
            pctx.moveTo(m.x, m.y);
            pctx.lineTo(ex, ey);
            pctx.stroke();
            // Punto en la punta
            pctx.beginPath();
            pctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
            pctx.fill();
          }
          // Líneas entre puntos alternos (estrella interna)
          if(m.nPoints >= 6){
            pctx.beginPath();
            for(var k = 0; k < m.nPoints; k++){
              var ang = m.rotation + (k / m.nPoints) * Math.PI * 2;
              var nextAng = m.rotation + ((k + 2) % m.nPoints / m.nPoints) * Math.PI * 2;
              var ax = m.x + Math.cos(ang) * m.radius;
              var ay = m.y + Math.sin(ang) * m.radius;
              var bx = m.x + Math.cos(nextAng) * m.radius;
              var by = m.y + Math.sin(nextAng) * m.radius;
              pctx.moveTo(ax, ay);
              pctx.lineTo(bx, by);
            }
            pctx.stroke();
          }
        } else {
          // Patrón anillos concéntricos con puntos en ellos
          for(var ring = 1; ring <= 3; ring++){
            var rr = m.radius * (ring / 3);
            pctx.beginPath();
            pctx.arc(m.x, m.y, rr, 0, Math.PI * 2);
            pctx.stroke();
            // Puntos sobre el anillo
            for(var k = 0; k < m.nPoints; k++){
              var ang = m.rotation * (ring % 2 === 0 ? 1 : -1) + (k / m.nPoints) * Math.PI * 2;
              var px2 = m.x + Math.cos(ang) * rr;
              var py2 = m.y + Math.sin(ang) * rr;
              pctx.beginPath();
              pctx.arc(px2, py2, 1.2, 0, Math.PI * 2);
              pctx.fill();
            }
          }
        }
        pctx.shadowBlur = 0;
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  FRAME PRINCIPAL
    // ══════════════════════════════════════════════════════════════════
    // v5.214 — cap de FPS. El loop corría a 60fps; para un fondo
    // decorativo, ~40fps se ve igual de fluido y es 1/3 menos de trabajo.
    // dt se acumula igual, así que la animación va a la misma velocidad
    // real — solo se dibujan menos frames.
    // v7.066 — cap bajado de 40 a 30 fps. Para un fondo decorativo,
    // 30fps es perfectamente fluido (el cine es 24fps). Bajar de 40 a
    // 30 es 25% menos frames pintados. Visualmente indetectable.
    var _minFrameMs = 1000 / 30;
    // v7.073 — cachés para abaratar cada frame:
    var _haloRectT = 0, _haloRects = [];   // rects de cards (refresh máx. c/400ms)
    var _vigCache  = null;                 // gradientes de viñeta (uno por tamaño)
    function frame(t){
      var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016;
      // v5.214: si la pestaña está oculta, no dibujar — solo reprogramar.
      if(document.hidden){
        lastT = t;
        animId = requestAnimationFrame(frame);
        return;
      }
      // v7.066 — Pausa adicional cuando la ventana NO tiene foco (la PWA
      // perdió foco aunque siga "visible" para el navegador). Esto evita
      // que LifeOS siga consumiendo CPU cuando estás usando YouTube u
      // otra app encima. document.hasFocus() es más estricto que
      // document.hidden: hidden solo se activa con minimizado/pestaña
      // oculta, hasFocus se activa también cuando la ventana sigue
      // visible pero no es la activa.
      if(!document.hasFocus()){
        lastT = t;
        animId = requestAnimationFrame(frame);
        return;
      }
      // v7.065 OPT — En Nivel 2 una sección a pantalla completa (Activity,
      // Logros, etc.) tapa totalmente el cosmos. Seguir pintando 580
      // estrellas/frame que nadie ve es desperdicio. Pausamos hasta
      // que el usuario regrese a Nivel 0 o 1. Cuando regrese, el frame
      // se reanuda y todo sigue en su sitio porque dt se sigue calculando.
      if(document.documentElement.classList.contains('niv-2')){
        lastT = t;
        animId = requestAnimationFrame(frame);
        return;
      }
      // Si no ha pasado el intervalo mínimo, saltar este frame.
      if(lastT && (t - lastT) < _minFrameMs){
        animId = requestAnimationFrame(frame);
        return;
      }
      lastT = t;
      if(!pctx){ animId = requestAnimationFrame(frame); return; }
      pctx.clearRect(0, 0, W, H);
      globalT += dt;
      galaxyRotation += 0.01 * dt;

      // v7.031 — FASE 4A: decaer la energía del warp. Dura ~1.5s en
      // apagarse (subido desde 0.9s) — el destello se siente más.
      if(_warpEnergia > 0){
        _warpEnergia -= dt / 1.6;
        if(_warpEnergia < 0) _warpEnergia = 0;
      }

      // 1) Actualizar nebulosa (modulador de estrellas — sin cambios)
      updateNebula(dt);

      // 1b) v5.201: NEBULOSA VISIBLE — capa offscreen al fondo de todo.
      // (v7.067 intentó pintar cada 2 frames para ahorrar costo, pero
      // como el canvas se limpia cada frame, esto causaba parpadeo
      // estroboscópico a 15Hz. Revertido a pintar siempre.)
      _frameCounter++;
      drawNebulaLayer(dt);

      // 2) Polvo cósmico (capa más al fondo)
      drawDust(dt);

      // 3) Anillos orbitales sutiles
      // v5.187: drawOrbitRings desactivado (aros mecánicos poco orgánicos)

      // 3b) v5.181: Efecto warp / agujero negro (centro)
      // v5.201: warp muy suavizado — ver drawWarp (ciclo casi imperceptible).
      drawWarp(dt);

      // 4) Espirales áureas (fondo)
      drawSpirals(dt);

      // 4b) v5.201: ANILLOS CONCÉNTRICOS del dial (estructura tipo Dyson)
      drawDialRings(dt);

      // 5) Rayos del centro (giran)
      drawRays(dt);

      // 6) v5.179: Lorenz e interMesh eliminados (aparecían/desaparecían sin propósito)
      // updateLorenz(dt);
      // drawLorenz();

      // 7) Vórtices
      // v7.065 OPT — Comentado: array vortices siempre vacío (nadie llama
      // spawnVortex). drawVortices(dt) gastaba ciclo cada frame en
      // forEach sobre array de longitud 0. El código de la función
      // queda preservado para una eventual reactivación futura con
      // propósito (ej: aparecer al expandir cards).
      // drawVortices(dt);

      // 8) Sinapsis
      // v7.065 OPT — Comentado: array synapses siempre vacío (nadie llama
      // spawnSynapse). Mismo motivo que vórtices. Función preservada
      // para futuro despertar con propósito (ej: aparecer al guardar
      // un pensamiento o conectar una nota).
      // drawSynapses(dt);

      // 8b) v5.179: red interestelar también eliminada
      // drawInterMesh(dt);

      // 8c) v5.171: Mandalas eliminados en v5.172 (distraían)
      // drawMandalas(dt);

      // 9) Constelaciones
      drawConstellations(dt);

      // 10) Estrellas
      drawStars(dt);

      // 10b) v5.201: HALOS LEJANOS (objetos cósmicos con aro)
      drawFarHalos(dt);

      // 11) Meteoros (encima de las estrellas, dramáticos)
      drawMeteors(dt);

      // 12) Pulsos (encima de todo)
      for(var pi = pulses.length - 1; pi >= 0; pi--){
        var p = pulses[pi];
        p.t += p.speed * dt;
        if(p.t > 1 + p.tailT){ pulses.splice(pi, 1); continue; }
        if(p.t > 1) p.life = Math.max(0, 1 - (p.t - 1) / p.tailT);
      }
      // v5.171: HALOS DE INTERACCIÓN — cada card visible emite un halo
      // tenue al canvas. Las partículas/estrellas que pasan cerca quedan
      // "iluminadas" porque el halo se acumula con el additive blending.
      try {
        if(window._hudPanels){
          // v7.073 — getBoundingClientRect fuerza un reflow del DOM. Leerlo
          // por card y por frame eran ~420 reflows/seg (14 cards × 30fps).
          // Ahora los rects se refrescan máx. cada 400ms: los halos son
          // tenues (alpha ≤0.08) y las cards casi siempre están quietas,
          // así que es visualmente idéntico.
          var _hNow = performance.now();
          if(_hNow - _haloRectT > 400){
            _haloRectT = _hNow;
            _haloRects.length = 0;
            for(var hr = 0; hr < window._hudPanels.length; hr++){
              var cEl = window._hudPanels[hr].el;
              if(!cEl || !cEl.offsetParent){ _haloRects.push(null); continue; }
              var rb = cEl.getBoundingClientRect();
              var hu = cEl.style.getPropertyValue('--ac') || '#A78BFA';
              if(hu.charAt(0) !== '#') hu = '#A78BFA';
              _haloRects.push({ l: rb.left, t: rb.top, r: rb.right, b: rb.bottom, w: rb.width, h: rb.height, hue: hu });
            }
          }
          pctx.save();
          pctx.globalCompositeOperation = 'lighter';
          for(var hp = 0; hp < _haloRects.length; hp++){
            var rect = _haloRects[hp];
            if(!rect) continue;
            if(rect.w < 10 || rect.h < 10) continue;
            // Solo cards visibles
            if(rect.b < 0 || rect.t > H) continue;
            if(rect.r < 0 || rect.l > W) continue;
            var cx = rect.l + rect.w / 2;
            var cy = rect.t + rect.h / 2;
            var radius = Math.max(rect.w, rect.h) * 0.7;
            var hue = rect.hue;
            // Glow modulado por el tiempo global (pulsa lento)
            var glowPulse = 0.55 + 0.45 * Math.sin(globalT * 0.7 + hp * 0.5);
            var alpha = 0.04 + glowPulse * 0.04;
            var halo = pctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            halo.addColorStop(0, hue + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
            halo.addColorStop(0.6, hue + '08');
            halo.addColorStop(1, hue + '00');
            pctx.fillStyle = halo;
            pctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
          }
          pctx.restore();
        }
      } catch(e){}

      drawPulses();

      // v5.171: Vignette suave en los bordes — todo se desvanece al
      // acercarse a los límites del viewport, así nada termina "cortado"
      // v7.073 — los 4 gradientes de la viñeta solo dependen de W/H: se
      // crean UNA vez por tamaño (antes se creaban 5 gradientes nuevos por
      // frame, incluido uno muerto que nunca se usaba). Visual idéntico.
      var vignetteMargin = 80;
      if(!_vigCache || _vigCache.W !== W || _vigCache.H !== H){
        var vTop = pctx.createLinearGradient(0, 0, 0, vignetteMargin);
        vTop.addColorStop(0, 'rgba(0,0,0,1)'); vTop.addColorStop(1, 'rgba(0,0,0,0)');
        var vBot = pctx.createLinearGradient(0, H - vignetteMargin, 0, H);
        vBot.addColorStop(0, 'rgba(0,0,0,0)'); vBot.addColorStop(1, 'rgba(0,0,0,1)');
        var vLeft = pctx.createLinearGradient(0, 0, vignetteMargin, 0);
        vLeft.addColorStop(0, 'rgba(0,0,0,1)'); vLeft.addColorStop(1, 'rgba(0,0,0,0)');
        var vRight = pctx.createLinearGradient(W - vignetteMargin, 0, W, 0);
        vRight.addColorStop(0, 'rgba(0,0,0,0)'); vRight.addColorStop(1, 'rgba(0,0,0,1)');
        _vigCache = { W: W, H: H, top: vTop, bot: vBot, left: vLeft, right: vRight };
      }
      pctx.save();
      pctx.globalCompositeOperation = 'destination-out';
      pctx.fillStyle = _vigCache.top;   pctx.fillRect(0, 0, W, vignetteMargin);
      pctx.fillStyle = _vigCache.bot;   pctx.fillRect(0, H - vignetteMargin, W, vignetteMargin);
      pctx.fillStyle = _vigCache.left;  pctx.fillRect(0, 0, vignetteMargin, H);
      pctx.fillStyle = _vigCache.right; pctx.fillRect(W - vignetteMargin, 0, vignetteMargin, H);
      pctx.restore();

      // Spawns periódicos
      // v5.179: sinapsis desactivadas (líneas entre estrellas que parecían no tener origen)
      if(pulses.length < 10 && Math.random() < 0.09) spawnPulse();
      // v5.179: vórtices desactivados (ondas concéntricas que aparecían en puntos sin contexto)
      // v5.177: Lorenz desactivado (trazos caóticos sin propósito visible)
      if(meteors.length < 3 && Math.random() < 0.015) spawnMeteor();
      // v5.171: Red interestelar y mandalas
      // v5.177: interMesh desactivado (cadenas confusas sin destino claro)
      // v5.172: mandalas desactivados (aparecían/desaparecían y distraían)
      // if(mandalas.length < 3 && Math.random() < 0.008) spawnMandala();

      animId = requestAnimationFrame(frame);
    }

    // v5.217 — detección de dispositivo modesto. Si el equipo tiene
    // pocos núcleos, se baja densidad de partículas para que vaya fluido
    // en celulares de gama media. Una PC potente nunca entra aquí.
    var _lowEndDevice = (function(){
      try {
        var cores = navigator.hardwareConcurrency || 8;
        var mem   = navigator.deviceMemory || 8;
        return cores <= 4 || mem <= 4;
      } catch(e){ return false; }
    })();
    window._ovLowEnd = _lowEndDevice;

    // v5.217 — CONSTRUCCIÓN DIFERIDA. Antes start() corría los 10
    // build*() síncronos antes del primer frame → el overlay se atascaba
    // unos segundos al abrir. Ahora arranca YA con lo esencial (estrellas
    // + dial) y construye el resto repartido en los siguientes frames.
    // Las funciones draw*() ya comprueban si su array está vacío, así que
    // una capa aún no construida simplemente no se dibuja todavía.
    function start(){
      // ════════════════════════════════════════════════════════════════
      // v7.061 — En móvil v6.032 apagaba el motor entero porque "fundía
      // los teléfonos". Pero esa decisión se tomó cuando además se
      // montaban las 14 cards HUD pesadas. v7.060 las eliminó. Ahora
      // probamos el motor encendido en móvil PERO en modo bajo: forzamos
      // _lowEndDevice = true (55% estrellas, sin shadowBlur en chicas,
      // menos constelaciones, menos partículas warp). El frame ya se
      // pausa con document.hidden (v5.214), así que ahorra batería al
      // bloquear el iPhone. Si el teléfono se traba o se calienta,
      // revertir esta versión a la guard original de v6.032.
      if(window.innerWidth < 900){
        _lowEndDevice = true;
        window._ovLowEnd = true;
      }

      resize();
      // v7.078 — EL CANVAS DEL COSMOS SE MUDA A <body> (z:0).
      // Vivía DENTRO de #dial-overlay; al entrar a una sección,
      // _osMostrar llama cerrarDial() que esconde el overlay completo
      // — y con él, el fondo cósmico. El CSS html.niv-2 #dial-particles
      // {blur(12px)} prueba que el diseño siempre quiso el cosmos
      // visible en TODOS los niveles. En body z:0 (canvas z:0, dial
      // z:5 — el lenguaje original), ningún show/hide del overlay
      // vuelve a matarlo. El blur por nivel aplica por id, intacto.
      try {
        if(_particlesCanvas.parentNode !== document.body){
          _particlesCanvas.style.position = 'fixed';
          _particlesCanvas.style.inset = '0';
          _particlesCanvas.style.zIndex = '0';
          _particlesCanvas.style.pointerEvents = 'none';
          document.body.insertBefore(_particlesCanvas, document.body.firstChild);
          var _ovBg = document.getElementById('dial-overlay');
          if(_ovBg) _ovBg.style.background = 'transparent';
        }
      } catch(e){}
      // ── Esencial: se construye YA (barato, y es lo que más se nota) ──
      buildStars();
      buildDialRings();
      // ── Listas vacías ──
      synapses = []; pulses = []; vortices = [];
      lorenzTrails = []; meteors = [];
      interMesh = []; mandalas = [];
      farHalos = []; constellations = []; spirals = [];
      dust = []; rays = []; warpParticles = [];
      _nebCanvas = null;
      globalT = 0;
      galaxyRotation = 0;
      lastT = 0;

      // ── Arrancar la animación INMEDIATAMENTE ──
      if(animId) cancelAnimationFrame(animId);
      animId = requestAnimationFrame(frame);
      // v6.000: bandera global — el fondo cósmico ahora se construye y
      // anima UNA sola vez en toda la vida de la app. abrirDial consulta
      // esta bandera para no re-arrancar (ni reconstruir) la animación.
      window._particlesRunning = true;

      // v7.074 — AUTO-RECUPERACIÓN DE LA NEBULOSA.
      // _nebCanvas es un offscreen pintado UNA vez. Si Chrome desaloja
      // la memoria gráfica (ventana tapada — p.ej. Task Manager con
      // Shift+Esc — o suspensión), queda EN BLANCO para siempre y el
      // fondo "se pierde" hasta recargar. Al recuperar foco se muestrean
      // 9 puntos de alpha: si TODOS son 0, la nebulosa fue desalojada y
      // se reconstruye (~10-30ms, una vez). Si no, no se toca — así el
      // patrón aleatorio no cambia en cada alt-tab.
      function _nebulaEnBlanco(){
        if(!_nebCanvas) return false;   // aún no construida: la cascada la hará
        try {
          var nc2 = _nebCanvas.getContext('2d');
          var nw = _nebCanvas.width, nh = _nebCanvas.height;
          for(var gy = 1; gy <= 3; gy++){
            for(var gx = 1; gx <= 3; gx++){
              var d = nc2.getImageData(Math.floor(nw*gx/4), Math.floor(nh*gy/4), 1, 1).data;
              if(d[3] > 0) return false;
            }
          }
          return true;
        } catch(e){ return false; }
      }
      var _nebRebuildT = 0;
      function _recuperarNebula(){
        var now = Date.now();
        if(now - _nebRebuildT < 4000) return;   // throttle anti alt-tab rápido
        if(!_nebulaEnBlanco()) return;
        _nebRebuildT = now;
        try { buildNebulaLayer(); } catch(e){}
      }
      window.addEventListener('focus', _recuperarNebula);
      document.addEventListener('visibilitychange', function(){
        if(!document.hidden) _recuperarNebula();
      });

      // ── Capas pesadas: escalonadas en frames sucesivos, no bloquean ──
      var _buildQueue = [
        function(){ initNebula(); },
        function(){ buildNebulaLayer(); },     // la más cara — sola en su slot
        function(){ buildRays(); buildFarHalos(); },
        function(){ buildConstellations(); },
        function(){ buildSpirals(); buildDust(); },
        function(){ buildWarp(); },
        function(){ for(var i=0;i<3;i++) spawnPulse();
                    for(var j=0;j<2;j++) spawnMeteor(); },
      ];
      var _qi = 0;
      function _runQueue(){
        if(_qi >= _buildQueue.length) return;
        _buildQueue[_qi]();
        _qi++;
        // Un paso por frame: reparte el costo, el arranque no se atasca.
        requestAnimationFrame(_runQueue);
      }
      requestAnimationFrame(_runQueue);
    }

    function stop(){
      if(animId){ cancelAnimationFrame(animId); animId = null; }
      window._particlesRunning = false;
    }

    window._particlesStart = start;
    window._particlesStop  = stop;

    // v7.077 — ARRANQUE GARANTIZADO DEL COSMOS.
    // El ÚNICO punto que arrancaba el fondo era abrirDial(); si el
    // usuario tocaba una pestaña del panel ANTES de que el overlay
    // abriera, el cosmos no se construía NUNCA — y la subida 2→1
    // evita abrirDial a propósito (para no re-disparar la cascada),
    // así que tampoco lo arrancaba. Sin cosmos: sin fondo, sin blur
    // (no hay nada que difuminar) y sin warp en las transiciones.
    // El cosmos es el fondo universal de TODOS los niveles y su
    // frame-loop ya se pausa solo en niv-2 / sin foco / oculto, así
    // que arrancarlo siempre no cuesta CPU extra dentro de secciones.
    function _arranqueGarantizado(){
      setTimeout(function(){
        if(!window._particlesRunning) start();
      }, 900);   // tras el arranque normal (abrirDial lo hace a los 200ms)
    }
    if(document.readyState === 'loading'){
      document.addEventListener('DOMContentLoaded', _arranqueGarantizado);
    } else {
      _arranqueGarantizado();
    }

    window.addEventListener('resize', function(){
      if(_particlesCanvas.isConnected){   // v7.078: offsetParent es null en position:fixed
        resize();
        initNebula();
        buildNebulaLayer();   // v5.201: re-render nebulosa al nuevo tamaño
        buildFarHalos();      // v5.201
        buildDialRings();     // v5.201
        buildRays();
        buildStars();
        buildConstellations();
        buildSpirals();
        buildDust();          // v5.169
        // v5.187: buildOrbitRings desactivado
      buildWarp();          // v5.181
      }
    });
  })();




  // ── Aro pulsante "breathing" (P-1b): círculo delineado SVG centrado en el dial.
  // Se muestra ANTES de que aparezcan los paneles y antes que el dial canvas.
  var _ringEl = document.createElement('div');
  _ringEl.id = 'dial-ring-breath';
  _ringEl.style.cssText = [
    'position:absolute','inset:0','pointer-events:none','z-index:1',
    'display:flex','align-items:center','justify-content:center',
    'opacity:0',
  ].join(';');
  _ringEl.innerHTML =
    '<svg viewBox="0 0 600 600" style="width:min(580px,40vw);height:min(580px,40vw);overflow:visible">'+
      // v5.150: Halo orgánico exterior — círculo grande muy difuso (cerebro)
      '<circle cx="300" cy="300" r="320" fill="none" stroke="rgba(167,139,250,0.18)" stroke-width="0.8" '+
        'style="filter:drop-shadow(0 0 28px rgba(167,139,250,0.45));animation:dialHaloBreath 5s ease-in-out infinite"/>'+
      // Aro principal — más intenso
      '<circle cx="300" cy="300" r="280" fill="none" stroke="rgba(167,139,250,0.75)" stroke-width="1.8" '+
        'style="filter:drop-shadow(0 0 18px rgba(167,139,250,0.80));animation:dialRingPulse 3s ease-in-out infinite"/>'+
      // Aro secundario interior con cyan (gradiente neuronal)
      '<circle cx="300" cy="300" r="252" fill="none" stroke="rgba(34,211,238,0.35)" stroke-width="1.2" '+
        'style="filter:drop-shadow(0 0 10px rgba(34,211,238,0.45));animation:dialRingPulse 3s ease-in-out infinite;animation-delay:.6s"/>'+
      // Punto central pulsante — más brillante (núcleo del cerebro)
      '<circle cx="300" cy="300" r="7" fill="rgba(167,139,250,1)" '+
        'style="filter:drop-shadow(0 0 14px rgba(167,139,250,1)) drop-shadow(0 0 24px rgba(167,139,250,0.6));animation:dialDotPulse 1.6s ease-in-out infinite"/>'+
    '</svg>';
  _dialOverlay.appendChild(_ringEl);
  // Keyframes del aro
  if(!document.getElementById('dial-ring-kf')){
    var rkf = document.createElement('style');
    rkf.id = 'dial-ring-kf';
    rkf.textContent =
      '@keyframes dialRingPulse{0%,100%{stroke-opacity:.45;transform:scale(0.96);transform-origin:50% 50%}50%{stroke-opacity:.95;transform:scale(1.025);transform-origin:50% 50%}}'+
      // v5.150: Halo orgánico exterior — pulso lento y amplio
      '@keyframes dialHaloBreath{0%,100%{stroke-opacity:.10;transform:scale(0.93);transform-origin:50% 50%}50%{stroke-opacity:.35;transform:scale(1.06);transform-origin:50% 50%}}'+
      '@keyframes dialDotPulse{0%,100%{opacity:.7;r:5}50%{opacity:1;r:9}}';
    document.head.appendChild(rkf);
  }

  // ══════════════════════════════════════════════════════════════════
  //  v5.175: HUD cosmic vibes para los cards
  //  Bordes con glow pulsante, esquinas geométricas HUD, sweep de luz
  // ══════════════════════════════════════════════════════════════════
  if(!document.getElementById('hud-cosmic-kf')){
    var ckf = document.createElement('style');
    ckf.id = 'hud-cosmic-kf';
    ckf.textContent = [
      // Respiración del borde — pulsa muy lento con el color accent
      '@keyframes hudBorderBreathe{',
        '0%,100%{box-shadow:0 0 0 1px rgba(255,255,255,.04), 0 0 8px rgba(var(--ac-rgb,167,139,250),.06), inset 0 0 0 1px rgba(var(--ac-rgb,167,139,250),.05)}',
        '50%{box-shadow:0 0 0 1px rgba(255,255,255,.06), 0 0 18px rgba(var(--ac-rgb,167,139,250),.18), inset 0 0 0 1px rgba(var(--ac-rgb,167,139,250),.12)}',
      '}',
      // Sweep de luz que recorre el borde superior (como radar)
      '@keyframes hudSweep{',
        '0%{transform:translateX(-100%);opacity:0}',
        '15%{opacity:1}',
        '85%{opacity:1}',
        '100%{transform:translateX(200%);opacity:0}',
      '}',
      // Pulso de las esquinas HUD
      '@keyframes hudCornerPulse{',
        '0%,100%{opacity:.45}',
        '50%{opacity:.85}',
      '}',
      // Aplicar a todos los paneles HUD
      // Selector amplio: cualquier card del overlay del dial
      '#dial-overlay [id^="_p"]{',
        'animation:hudBorderBreathe 5.5s ease-in-out infinite;',
        'position:relative;',
      '}',
      // Cards con delay individual (para que no respiren todas igual)
      '#dial-overlay #_pUser{animation-delay:0s}',
      '#dial-overlay #_pSim{animation-delay:0.5s}',
      '#dial-overlay #_pStats{animation-delay:1.0s}',
      '#dial-overlay #_p1{animation-delay:1.5s}',
      '#dial-overlay #_p2{animation-delay:2.0s}',
      '#dial-overlay #_p3{animation-delay:2.5s}',
      '#dial-overlay #_p4{animation-delay:3.0s}',
      '#dial-overlay #_p5{animation-delay:3.5s}',
      '#dial-overlay #_p7{animation-delay:4.0s}',
      '#dial-overlay #_p8{animation-delay:4.5s}',
      '#dial-overlay #_pTrack{animation-delay:0.8s}',
      '#dial-overlay #_pMision{animation-delay:1.3s}',
      '#dial-overlay #_pLogro{animation-delay:1.8s}',
      '#dial-overlay #_pNivel{animation-delay:2.3s}',
      // ── Esquinas HUD (tipo sci-fi) ──
      '#dial-overlay [id^="_p"]::before,',
      '#dial-overlay [id^="_p"]::after{',
        'content:"";position:absolute;pointer-events:none;',
        'width:10px;height:10px;',
        'animation:hudCornerPulse 3.5s ease-in-out infinite;',
      '}',
      '#dial-overlay [id^="_p"]::before{',
        'top:4px;left:4px;',
        'border-top:1px solid rgba(var(--ac-rgb,167,139,250),.5);',
        'border-left:1px solid rgba(var(--ac-rgb,167,139,250),.5);',
      '}',
      '#dial-overlay [id^="_p"]::after{',
        'bottom:4px;right:4px;',
        'border-bottom:1px solid rgba(var(--ac-rgb,167,139,250),.5);',
        'border-right:1px solid rgba(var(--ac-rgb,167,139,250),.5);',
      '}',
      // ── Sweep de luz superior (línea fina que cruza el card) ──
      '#dial-overlay .hud-sweep{',
        'position:absolute;top:0;left:0;right:0;height:1px;',
        'background:linear-gradient(90deg, transparent 0%, rgba(var(--ac-rgb,167,139,250),.0) 10%, rgba(var(--ac-rgb,167,139,250),.7) 50%, rgba(var(--ac-rgb,167,139,250),.0) 90%, transparent 100%);',
        'pointer-events:none;',
        'animation:hudSweep 7s ease-in-out infinite;',
        'opacity:0;',
        'z-index:2;',
      '}',
      // Banda Sim superior: scanline horizontal de luz
      '#dial-overlay #_pSim{overflow:hidden}',
      '#dial-overlay #_pSim::before{',
        'background:linear-gradient(180deg, rgba(var(--ac-rgb,167,139,250),.18) 0%, transparent 100%);',
        'top:0;left:0;width:100%;height:2px;',
        'border:none;animation:none;opacity:.6;',
      '}',
    ].join('');
    document.head.appendChild(ckf);
  }

  // Inyectar el sweep element a cada card y setear --ac-rgb desde el color del card
  function _inyectarHudEffectsACards(){
    if(!window._hudPanels) return;
    // RGB de colores accent comunes (paleta del proyecto)
    var COLOR_RGB = {
      '#A78BFA':'167,139,250', '#22D3EE':'34,211,238', '#4ADE80':'74,222,128',
      '#C4B5FD':'196,181,253', '#67E8F9':'103,232,249', '#86EFAC':'134,239,172',
      '#F472B6':'244,114,182', '#FBBF24':'251,191,36', '#FB7185':'251,113,133',
      '#34D399':'52,211,153', '#60A5FA':'96,165,250',
    };
    window._hudPanels.forEach(function(hp){
      var card = hp.el;
      if(!card || card._hudFXApplied) return;
      card._hudFXApplied = true;
      // Detectar accent color del card desde inline style --ac, computed style o default
      var ac = card.style.getPropertyValue('--ac').trim();
      if(!ac){
        // Buscar dentro del card algún hijo con --ac
        var child = card.querySelector('[style*="--ac"]');
        if(child) ac = child.style.getPropertyValue('--ac').trim();
      }
      if(!ac) ac = '#A78BFA';
      var rgb = COLOR_RGB[ac.toUpperCase()] || '167,139,250';
      card.style.setProperty('--ac-rgb', rgb);
      // Inyectar el sweep (línea de luz que cruza el card)
      if(!card.querySelector(':scope > .hud-sweep')){
        var sweep = document.createElement('div');
        sweep.className = 'hud-sweep';
        // Delay aleatorio para que cada card sweep en momento distinto
        sweep.style.animationDelay = (Math.random() * 7).toFixed(2) + 's';
        card.appendChild(sweep);
      }
    });
  }

  // Aplicar tras un breve delay para que window._hudPanels esté listo
  setTimeout(_inyectarHudEffectsACards, 800);
  setTimeout(_inyectarHudEffectsACards, 2000);
  window._inyectarHudEffectsACards = _inyectarHudEffectsACards;

  // ── Keyframes mini-panels ──
  (function(){
    if(document.getElementById('hud-mini-kf')) return;
    var s=document.createElement('style'); s.id='hud-mini-kf';
    s.textContent=[
      '@keyframes miniBreath{',
        '0%,100%{border-color:var(--pc-dim);box-shadow:0 8px 32px rgba(0,0,0,0.65),0 0 24px var(--pc-glow),inset 0 1px 0 var(--pc-dim);}',
        '50%{border-color:var(--pc-mid);box-shadow:0 8px 40px rgba(0,0,0,0.75),0 0 48px var(--pc-glow),inset 0 1px 0 var(--pc-mid);}',
      '}',
      '@keyframes topPulse{0%,100%{opacity:.6}50%{opacity:1}}',
      '@keyframes hudValIn{0%{opacity:0;transform:translateY(3px)}100%{opacity:1;transform:none}}',
      '@keyframes hudDotPulse{0%,100%{transform:scale(1);opacity:.6}50%{transform:scale(1.5);opacity:1}}',
    ].join('');
    document.head.appendChild(s);
  })();

  // ── Crear panel flotante ──
  // accentColor: hex (#22C55E). glowColor: rgba string (compat).
  function _mkFloatPanel(id, accentColor, glowColor){
    // v7.060 — En móvil las cards HUD no se usan (el Home móvil va por
    // carrusel de .section). Pero el código siguiente las referencia
    // (asignaciones ._side, ._order, _hudPanels, listeners). Para no
    // romper nada, devolvemos un SHELL mínimo: un <div> con el id puesto,
    // sin contenido, sin estilos pesados, sin SVG corners, sin clases
    // costosas. Las variables _pUser, _pSim, etc. siguen existiendo, el
    // código de configuración no se rompe, pero el DOM se ahorra ~14
    // estructuras pesadas en cada arranque móvil.
    if(window.innerWidth < 900){
      var shell = document.createElement('div');
      shell.id = id;
      shell.style.display = 'none';   // no ocupar espacio, no pintar
      // Hijo placeholder con el id que esperan las llamadas posteriores
      // (renderActivity, renderPatrimonio, etc. hacen
      // getElementById(id + '-inner') y escriben innerHTML; si no
      // existe, fallan silenciosos sin romper).
      var inner = document.createElement('div');
      inner.id = id + '-inner';
      shell.appendChild(inner);
      return shell;
    }
    // Computar versiones rgba del accent (hex → rgba con alpha variable)
    function _ax(a){
      var h = accentColor.replace('#','');
      if(h.length===3) h = h.split('').map(function(c){return c+c;}).join('');
      var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
      return 'rgba('+r+','+g+','+b+','+a+')';
    }
    var p = document.createElement('div');
    p.id  = id;
    p.style.cssText = [
      'position:fixed','z-index:9001',
      'background:rgba(10,7,22,0.92)',
      // Borde principal del COLOR del panel (no genérico violeta)
      'border:1.5px solid '+_ax(0.45),
      'backdrop-filter:blur(22px) saturate(170%)',
      '-webkit-backdrop-filter:blur(22px) saturate(170%)',
      'border-radius:14px',
      'opacity:0','visibility:hidden',
      'transition:opacity 500ms ease-out',
      'overflow:hidden',
      'font-family:Manrope,-apple-system,BlinkMacSystemFont,sans-serif',
      'animation:miniBreath 4s ease-in-out infinite',
      // Glow exterior y sombra base
      'box-shadow:0 8px 32px rgba(0,0,0,0.65),0 0 32px '+_ax(0.18)+',inset 0 1px 0 '+_ax(0.20),
    ].join(';');
    // Variables CSS del color del panel para uso en animación (miniBreath)
    p.style.setProperty('--pc-dim',  _ax(0.30));
    p.style.setProperty('--pc-mid',  _ax(0.65));
    p.style.setProperty('--pc-glow', _ax(0.22));
    p._accent = accentColor;

    // Banda superior luminosa (top accent line)
    var top = document.createElement('div');
    top.style.cssText = 'position:absolute;top:0;left:0;right:0;height:2px;'+
      'background:linear-gradient(90deg,transparent 0%,'+accentColor+' 20%,'+accentColor+' 80%,transparent 100%);'+
      'box-shadow:0 0 12px '+accentColor+',0 0 24px '+_ax(0.50)+';'+
      'animation:topPulse 3s ease-in-out infinite;z-index:2;pointer-events:none';
    p.appendChild(top);

    // Glow interno sutil del color del panel
    var inner_glow = document.createElement('div');
    inner_glow.style.cssText = 'position:absolute;inset:0;border-radius:14px;pointer-events:none;z-index:0;'+
      'box-shadow:inset 0 0 24px '+_ax(0.06)+';'+
      'background:radial-gradient(ellipse at top,'+_ax(0.08)+' 0%,transparent 50%)';
    p.appendChild(inner_glow);

    var inner = document.createElement('div');
    inner.style.cssText = 'position:relative;z-index:1;display:flex;flex-direction:column';
    inner.id = id+'-inner';
    p.appendChild(inner);

    return p;
  }

  // ══════════════════════════════════════════
  //  SISTEMA DE DISEÑO — tokens y helpers
  // ══════════════════════════════════════════
  // Colores: cada panel tiene un accent. Funciones helper para variantes.
  function _hex2rgb(h){
    h = h.replace('#','');
    if(h.length===3) h = h.split('').map(function(c){return c+c;}).join('');
    return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];
  }
  function _rgba(c, a){
    var rgb = _hex2rgb(c);
    return 'rgba('+rgb[0]+','+rgb[1]+','+rgb[2]+','+a+')';
  }

  // Inyectar fuentes y CSS base de los paneles (una sola vez)
  if(!document.getElementById('hud-design-css')){
    var lk = document.createElement('link');
    lk.rel = 'stylesheet';
    lk.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap';
    document.head.appendChild(lk);
    var ds = document.createElement('style');
    ds.id = 'hud-design-css';
    ds.textContent = [
      '.hud-pnl{font-family:Manrope,-apple-system,BlinkMacSystemFont,sans-serif;color:#E5E7EB}',
      '.hud-pnl .num{font-family:JetBrains Mono,ui-monospace,monospace;font-variant-numeric:tabular-nums}',
      '.hud-pnl .dim{opacity:.45}',
      // header
      '.hud-h{display:flex;align-items:center;flex-wrap:nowrap;gap:10px;padding:14px 16px 12px}',
      // v5.191: el sparkline cede espacio al titulo. Tiene flex:0 1 48px, asi
      // que se encoge cuando el titulo lo necesita. El titulo siempre gana
      // porque tiene flex-shrink:0 y no lleva ellipsis.
      '.hud-h-spark{flex:0 1 48px;min-width:0}',
      '.hud-h-ico{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.hud-h-ico i{font-size:12px}',
      // v5.190: fuente 11->9.5px + letter-spacing .10->.035em para que titulos
      // largos ("PATRIMONIO","NECESIDADES","FINANCIERO") quepan completos junto
      // al sparkline. Ellipsis se conserva como red de seguridad pero ya no
      // deberia activarse con los titulos reales del dial.
      // v5.191: el TITULO manda sobre el sparkline. flex-shrink:0 + sin ellipsis
      // → nunca se corta y nunca salta a 2 lineas. El sparkline (.hud-h-spark)
      // es quien cede espacio. white-space:nowrap garantiza renglon unico.
      '.hud-h-t{font-size:9.5px;font-weight:800;letter-spacing:.035em;text-transform:uppercase;flex:0 1 auto;flex-shrink:0;white-space:nowrap}',
      '.hud-h-k{font-size:14px;font-weight:800;color:rgba(220,220,240,0.35);letter-spacing:.10em;cursor:default;line-height:0}',
      '.hud-h-expand{background:transparent;border:0;cursor:pointer;padding:5px;border-radius:5px;display:flex;align-items:center;justify-content:center;transition:background .15s,transform .15s;opacity:.55}',
      '.hud-h-expand:hover{opacity:1;background:rgba(255,255,255,0.06);transform:scale(1.1)}',
      '.hud-h-expand i{font-size:11px;line-height:1}',
      // Panel expandido: ocupa la zona central donde estaba el dial
      '.hud-pnl.hud-expanded{transition:left .42s cubic-bezier(.4,1.4,.5,1),top .42s cubic-bezier(.4,1.4,.5,1),width .42s cubic-bezier(.4,1.4,.5,1),height .42s cubic-bezier(.4,1.4,.5,1)!important;z-index:9050!important;display:flex;flex-direction:column}',
      '.hud-pnl.hud-expanded > [id$="-inner"]{display:flex;flex-direction:column;flex:1;min-height:0}',
      // Wrapper de contenido expandido (oculto por defecto, visible cuando .hud-expanded)
      // v5.142 (heredado v5.137): overflow-y:auto + min-height:0 + overflow-x:hidden
      // para que el scrollbar solo aparezca si el contenido excede.
      '.hud-expanded-content{display:none;flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;padding:14px 18px}',
      // v5.205 — SCROLLBAR rediseñado: barra delgada, redondeada, violeta
      // con glow (no el gris cuadrado del navegador). Aplica al panel
      // expandido y a las tablas con scroll dentro de él.
      '.hud-expanded-content::-webkit-scrollbar,.hud-expanded-content .tbl-wrap::-webkit-scrollbar,.fjx-tbl-wrap::-webkit-scrollbar,.vrx-tbl-wrap::-webkit-scrollbar{width:7px;height:7px}',
      '.hud-expanded-content::-webkit-scrollbar-track,.hud-expanded-content .tbl-wrap::-webkit-scrollbar-track,.fjx-tbl-wrap::-webkit-scrollbar-track,.vrx-tbl-wrap::-webkit-scrollbar-track{background:rgba(255,255,255,0.03);border-radius:99px}',
      '.hud-expanded-content::-webkit-scrollbar-thumb,.hud-expanded-content .tbl-wrap::-webkit-scrollbar-thumb,.fjx-tbl-wrap::-webkit-scrollbar-thumb,.vrx-tbl-wrap::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#A78BFA,#8B5CF6);border-radius:99px;border:1px solid rgba(167,139,250,0.25)}',
      '.hud-expanded-content::-webkit-scrollbar-thumb:hover,.hud-expanded-content .tbl-wrap::-webkit-scrollbar-thumb:hover,.fjx-tbl-wrap::-webkit-scrollbar-thumb:hover,.vrx-tbl-wrap::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#C4B5FD,#A78BFA)}',
      '.hud-expanded-content::-webkit-scrollbar-corner,.hud-expanded-content .tbl-wrap::-webkit-scrollbar-corner,.fjx-tbl-wrap::-webkit-scrollbar-corner,.vrx-tbl-wrap::-webkit-scrollbar-corner{background:transparent}',
      // Firefox
      '.hud-expanded-content,.hud-expanded-content .tbl-wrap,.fjx-tbl-wrap,.vrx-tbl-wrap{scrollbar-width:thin;scrollbar-color:#8B5CF6 rgba(255,255,255,0.03)}',
      '.hud-expanded .hud-expanded-content{display:flex;flex-direction:column;gap:14px;justify-content:flex-start}',
      '.hud-expanded .hud-collapsed-content{display:none}',
      // Tablas dentro del panel expandido: scroll horizontal mantenido
      '.hud-expanded-content .tbl-wrap{overflow-x:auto;overflow-y:auto;border-radius:8px;border:1px solid rgba(255,255,255,0.06);max-height:100%}',
      '.hud-expanded-content .tbl{width:100%;border-collapse:collapse;font-size:11px;font-family:JetBrains Mono,monospace}',
      '.hud-expanded-content .tbl th{padding:8px 10px;background:rgba(255,255,255,0.03);font-size:9px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(220,224,235,0.65);border-bottom:1px solid rgba(255,255,255,0.08);position:sticky;top:0;white-space:nowrap}',
      '.hud-expanded-content .tbl td{padding:7px 10px;border-bottom:1px solid rgba(255,255,255,0.04);white-space:nowrap}',
      '.hud-expanded-content .tbl td:first-child,.hud-expanded-content .tbl th:first-child{position:sticky;left:0;background:rgba(15,23,42,0.95);z-index:1}',
      '.hud-expanded-content .tbl .pos{color:#4ADE80}',
      '.hud-expanded-content .tbl .neg{color:#EF4444}',
      '.hud-expanded-content .tbl .mes-actual{background:rgba(99,102,241,0.10)}',
      // Botón expandir cambia de icono cuando ya está expandido
      '.hud-expanded .hud-h-expand i{transform:rotate(180deg)}',
      '.hud-h-bar{height:1px;margin:0 16px;background:linear-gradient(90deg,var(--ac-50),transparent)}',
      // Mensaje placeholder para paneles que solo muestran info al expandir
      '.hud-empty-msg{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:28px 16px;color:rgba(220,224,235,0.45)}',
      '.hud-empty-msg span{font-size:10px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;text-align:center}',
      // Breathing glow — sombra que pulsa suavemente (más lento: 5.5s)
      '@keyframes hudBreath{0%,100%{box-shadow:0 0 0 0 var(--hb-c,rgba(255,255,255,0.0)),inset 0 0 0 0 transparent}50%{box-shadow:0 0 32px 6px var(--hb-c,rgba(255,255,255,0.12)),inset 0 0 14px 0 var(--hb-i,rgba(255,255,255,0.04))}}',
      '.hud-breathing{animation:hudBreath 5.5s ease-in-out infinite}',
      // Perimeter scan principal — pseudo-elemento conic-gradient que rota (sentido horario)
      '@keyframes hudScanRot{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}',
      '@keyframes hudScanRotRev{from{transform:rotate(360deg)}to{transform:rotate(0deg)}}',
      '.hud-scan{position:relative;overflow:hidden}',
      '.hud-scan::before{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:conic-gradient(from var(--scan-from,0deg),transparent 0deg,transparent 270deg,var(--scan-c,#A855F7) 320deg,transparent 360deg);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:hudScanRot 7.5s linear infinite;pointer-events:none;opacity:.55;z-index:1}',
      // Perimeter scan SECUNDARIO (offset rotacional, dirección opuesta, más tenue) — segundo arco que recorre el borde
      '.hud-scan-2::after{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:1px;background:conic-gradient(from var(--scan-from-2,180deg),transparent 0deg,transparent 295deg,var(--scan-c-2,#A855F7) 335deg,transparent 360deg);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:hudScanRotRev 11s linear infinite;pointer-events:none;opacity:.32;z-index:1}',
      // hero
      '.hud-hero{padding:14px 16px 10px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}',
      '.hud-hero-l{flex:1;min-width:0}',
      // v5.191: nowrap → el sublabel ("EXCEDENTE DEL MES") nunca rompe a 2 lineas.
      '.hud-hero-lbl{font-size:9px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:rgba(200,208,230,0.40);margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      // v5.190: fuente 30->25px. Con 30px un monto como "+ $ 13,705" se cortaba
      // a "+ $ 13,70..." en el ancho del panel. 25px deja caber 9-10 caracteres.
      '.hud-hero-v{font-size:25px;font-weight:800;letter-spacing:-.02em;line-height:1;font-family:JetBrains Mono,ui-monospace,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hud-hero-v .cents{font-size:18px;opacity:.45;font-weight:700}',
      '.hud-hero-chip{padding:5px 9px;border-radius:7px;font-size:10px;font-weight:800;letter-spacing:.06em;display:flex;flex-direction:column;align-items:flex-end;gap:1px;line-height:1.1;flex-shrink:0}',
      '.hud-hero-chip .chip-sub{font-size:8px;font-weight:600;opacity:.7;text-transform:uppercase;letter-spacing:.10em}',
      // mini-bar (fondo emergencia)
      '.hud-mini{padding:0 16px 14px}',
      '.hud-mini-row{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:rgba(200,208,230,0.50);margin-bottom:6px}',
      // v5.189: el label flexible con ellipsis, el valor con su espacio
      '.hud-mini-row > span:first-child{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-mini-row .v{font-size:11px;font-weight:800;color:var(--ac);letter-spacing:0;text-transform:none;font-family:JetBrains Mono,monospace;white-space:nowrap;flex-shrink:0}',
      '.hud-mini-bar{height:5px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.04)}',
      '.hud-mini-fill{height:100%;border-radius:999px;transition:width .8s ease}',
      // row
      '.hud-row{display:flex;align-items:center;gap:9px;padding:8px 14px}',
      '.hud-row + .hud-row{border-top:1px solid rgba(255,255,255,0.04)}',
      '.hud-row-ico{width:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px}',
      '.hud-row-l{flex:1;min-width:0;font-size:12.5px;font-weight:600;color:rgba(220,224,235,0.78);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-row-bar{width:54px;height:3px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;flex-shrink:0}',
      '.hud-row-bar > div{height:100%;width:0;border-radius:999px;transition:width .8s ease}',
      // v5.189: hud-row-v con overflow controlado para valores largos
      '.hud-row-v{font-size:12.5px;font-weight:700;letter-spacing:0;flex-shrink:0;text-align:right;min-width:62px;max-width:120px;font-family:JetBrains Mono,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      // maslow
      '.hud-mas{padding:8px 16px}',
      '.hud-mas + .hud-mas{border-top:1px solid rgba(255,255,255,0.04)}',
      '.hud-mas-top{display:flex;align-items:center;gap:8px;margin-bottom:5px}',
      '.hud-mas-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;animation:hudDotPulse 2.5s ease-in-out infinite}',
      '.hud-mas-l{flex:1;font-size:13px;font-weight:600;color:rgba(220,224,235,0.78);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-mas-v{font-size:12px;font-weight:700;letter-spacing:0;text-align:right;font-family:JetBrains Mono,monospace;white-space:nowrap}',
      '.hud-mas-bar{height:3px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;margin-left:15px}',
      '.hud-mas-bar > div{height:100%;width:0;border-radius:999px;transition:width .9s ease}',
      // need (sims) - layout VERTICAL compacto para 9 columnas en una fila
      '.hud-need{display:flex;flex-direction:column;gap:3px;min-width:0;padding:0}',
      '.hud-need-top{display:flex;align-items:center;gap:5px;min-width:0}',
      '.hud-need-mid{display:flex;align-items:baseline;gap:6px;min-width:0}',
      '.hud-need-bot{display:flex;align-items:center;gap:6px;min-width:0}',
      '.hud-need-ico{font-size:13px;flex-shrink:0;width:14px;display:flex;align-items:center;justify-content:center;line-height:1}',
      '.hud-need-l{flex:1;font-size:8.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:rgba(220,224,235,0.65);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hud-need-bar-wrap{width:100%;height:5px;background:rgba(255,255,255,0.10);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.10);position:relative;box-shadow:inset 0 1px 2px rgba(0,0,0,0.55);margin-top:2px}',
      '.hud-need-bar{height:100%;border-radius:999px;transition:width .8s ease;position:relative;min-width:1px}',
      '.hud-need-bar::after{content:"";position:absolute;top:1px;left:4px;right:4px;height:1.5px;background:rgba(255,255,255,0.45);border-radius:999px;filter:blur(0.6px)}',
      '.hud-need-v{font-size:9px;font-weight:800;font-family:JetBrains Mono,monospace;flex-shrink:0;line-height:1;white-space:nowrap}',
      '.hud-need-v .max{opacity:.40;font-weight:700;font-size:7.5px}',
      // CTA pie
      '.hud-cta{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:11px 16px;cursor:pointer;border-top:1px solid var(--ac-15);transition:padding .15s,background .15s}',
      '.hud-cta:hover{background:var(--ac-08);padding-left:20px}',
      // v5.190: letter-spacing .10->.03em para que labels del CTA
      // ("VER DETALLE COMPLETO", etc.) quepan sin cortarse.
      '.hud-cta .lbl{font-size:10px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-cta .chev{font-size:9px;opacity:.7;flex-shrink:0}',
      // duo (Activity+Logros)
      '.hud-trio{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:12px 14px}',
      '.hud-trio-cell{padding:9px 5px;border-radius:9px;border:1px solid;text-align:left;position:relative;overflow:hidden;background:rgba(255,255,255,0.02);min-width:0}',
      '.hud-trio-cell .top{position:absolute;top:0;left:0;right:0;height:2px}',
      // v5.191: lbl 7.5->7px para que "RACHA ACTUAL" / "HABITOS HOY" quepan
      // completos en la celda estrecha sin truncarse. Una sola linea (nowrap).
      '.hud-trio-cell .lbl{font-size:7px;font-weight:800;letter-spacing:0;text-transform:uppercase;margin-bottom:5px;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      // v5.190: valor 16->13px para que "13/30" quepa completo en la celda.
      '.hud-trio-cell .v{font-size:13px;font-weight:800;line-height:1;font-family:JetBrains Mono,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      // racha fires
      '.hud-fires-row{display:flex;align-items:center;gap:10px;padding:11px 16px 14px;border-top:1px solid rgba(255,255,255,0.06);background:rgba(251,146,60,0.05)}',
      '.hud-fires-row > i.lead{font-size:15px;color:#FB923C;filter:drop-shadow(0 0 5px #FB923C)}',
      '.hud-fires-row .lbl{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#FB923C;text-shadow:0 0 6px rgba(251,146,60,0.40);flex-shrink:0}',
      '.hud-fires-row .fires{display:flex;align-items:center;gap:5px;flex:1;justify-content:flex-end}',
      '.hud-fires-row .fires i{font-size:13px;color:rgba(140,140,150,0.40)}',
      '.hud-fires-row .fires i.on{color:#FB923C;filter:drop-shadow(0 0 5px #FB923C)}',
      // nav grid 2x3
      '.hud-navg{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:12px 16px}',
      '.hud-navg-it{display:flex;align-items:center;gap:9px;padding:10px;border-radius:9px;border:1px solid;cursor:pointer;transition:transform .15s,box-shadow .15s,background .15s}',
      '.hud-navg-it:hover{transform:translateY(-1px)}',
      '.hud-navg-it .ico{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}',
      '.hud-navg-it .lbl{flex:1;font-size:12px;font-weight:700;color:rgba(220,224,235,0.80);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-navg-it .ch{font-size:9px;opacity:.55}',
      // user panel
      '.hud-user{display:flex;align-items:center;gap:11px;padding:8px 12px;height:100%;box-sizing:border-box}',
      '.hud-user-av{width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:0;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);flex-shrink:0;position:relative}',
      '.hud-user-av i{font-size:15px}',
      '.hud-user-c{flex:1;display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.hud-user-row1{display:flex;align-items:baseline;gap:8px}',
      '.hud-user-name{font-size:15px;font-weight:800;letter-spacing:.06em;color:#fff}',
      '.hud-user-niv{font-size:10px;font-weight:700;color:rgba(220,224,235,0.65);letter-spacing:.04em}',
      '.hud-user-niv-badge{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:3px;font-size:8px}',
      '.hud-user-bar{height:5px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;width:100%}',
      '.hud-user-bar > div{height:100%;border-radius:999px;transition:width .8s ease}',
      '.hud-user-xp{font-size:10px;font-weight:700;color:rgba(220,224,235,0.55);text-align:right;font-family:JetBrains Mono,monospace}',
      // sim panel band
      // ── MEGA-CARD TOP: tabs + contenido ──
      // v6.010: la fila de tabs (.hud-megatabs) se OCULTA. La navegación
      // ahora vive en la barra superior fija del hero (index.html), que
      // es la barra permanente de la app. Esta fila duplicaba esos tabs.
      // El resto del panel (.hud-sim-content con las 9 needs del Sim) se
      // conserva intacto. El listener de click sobre #hud-megatabs queda
      // inerte porque el elemento está oculto.
      '.hud-megatabs{display:none !important}',
      '.hud-megatab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;'+
        'padding:4px 6px;border-radius:8px 8px 0 0;background:transparent;border:1px solid transparent;border-bottom:0;'+
        'cursor:pointer;font-family:inherit;font-weight:800;font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;'+
        'color:rgba(220,224,235,0.55);transition:all .18s;flex:1;min-width:0;position:relative;top:1px}',
      '.hud-megatab i{font-size:11px;color:rgba(220,224,235,0.65);transition:color .18s}',
      '.hud-megatab span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
      '.hud-megatab:hover{background:rgba(255,255,255,0.04);color:rgba(220,224,235,0.85)}',
      '.hud-megatab:hover i{color:var(--tc)}',
      '.hud-megatab.active{background:var(--tc-bg);border-color:var(--tc-bd);'+
        'box-shadow:0 -2px 12px var(--tc-glow),inset 0 -2px 0 var(--tc);color:var(--tc);text-shadow:0 0 6px var(--tc-glow)}',
      '.hud-megatab.active i{color:var(--tc);filter:drop-shadow(0 0 4px var(--tc))}',
      '.hud-sim-content{padding:0}',
      // v5.117: header inline + grid en misma fila horizontal
      '.hud-sim-row-compact{display:flex;align-items:center;gap:10px;padding:4px 12px 4px}',
      '.hud-sim-h-inline{display:flex;align-items:center;gap:6px;flex-shrink:0;padding:0;border-right:1px solid rgba(255,255,255,0.08);padding-right:10px;min-height:32px}',
      '.hud-sim-h-inline i{font-size:12px;flex-shrink:0}',
      '.hud-sim-h-txt{display:flex;flex-direction:column;gap:1px;min-width:0}',
      '.hud-sim-h-txt .t{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;text-shadow:0 0 8px rgba(167,139,250,0.40);white-space:nowrap}',
      '.hud-sim-h-txt .meta{font-size:7.5px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(220,224,235,0.45);white-space:nowrap}',
      // ── BANDA SIM: 9 columnas en UNA SOLA fila horizontal ──
      '.hud-sim-h{display:flex;align-items:center;gap:10px;padding:13px 18px 8px}',
      '.hud-sim-h .ico{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.hud-sim-h .ico i{font-size:11px}',
      '.hud-sim-h .t{font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;flex:1}',
      '.hud-sim-h .meta{font-size:9px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.40)}',
      '.hud-sim-grid{display:grid;grid-template-columns:repeat(9,minmax(0,1fr));gap:0 10px;padding:0;flex:1;min-width:0}',
      // stats panel
      '.hud-stats-row{display:flex;align-items:stretch;justify-content:space-around;gap:4px;padding:8px 10px;height:100%;box-sizing:border-box}',
      '.hud-stats-cell{flex:1;display:flex;align-items:center;gap:8px;min-width:0;padding:0 3px}',
      '.hud-stats-cell + .hud-stats-cell{border-left:1px solid rgba(255,255,255,0.06)}',
      '.hud-stats-ico{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.hud-stats-ico i{font-size:13px}',
      '.hud-stats-txt{display:flex;flex-direction:column;gap:1px;min-width:0}',
      '.hud-stats-v{font-size:16px;font-weight:800;line-height:1;font-family:JetBrains Mono,monospace;white-space:nowrap}',
      '.hud-stats-v .max{opacity:.40;font-weight:700;font-size:9px;margin-left:2px}',
      '.hud-stats-l{font-size:7.5px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.45)}',
      // ── RIBBON STYLES (v5.115): USER y Stats en una sola fila compacta ──
      // ── STACK (v5.116): USER+Stats fusionados en _pUser (2 renglones) ──
      '.hud-user-stack{display:flex;flex-direction:column;height:100%;box-sizing:border-box}',
      '.hud-user-stack > .hud-user-ribbon, .hud-user-stack > .hud-stats-ribbon{flex:1;min-height:0}',
      '.hud-user-stack-sep{height:1px;background:rgba(255,255,255,0.06);margin:0 12px;flex-shrink:0}',
      '.hud-user-ribbon{display:flex;align-items:center;gap:8px;padding:8px 12px;height:100%;box-sizing:border-box;min-height:0}',
      '.hud-user-av-sm{width:22px;height:22px;display:flex;align-items:center;justify-content:center;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);flex-shrink:0}',
      '.hud-user-name-sm{font-size:12px;font-weight:800;letter-spacing:.06em;color:#fff;flex-shrink:0}',
      '.hud-user-niv-sm{font-size:9px;font-weight:700;color:rgba(167,139,250,0.85);letter-spacing:.05em;background:rgba(167,139,250,0.14);border:1px solid rgba(167,139,250,0.40);padding:2px 6px;border-radius:4px;flex-shrink:0}',
      '.hud-user-niv-sm span{margin-left:3px}',
      '.hud-user-bar-sm{flex:1;height:4px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;min-width:30px}',
      '.hud-user-bar-sm > div{height:100%;border-radius:999px;transition:width .8s ease}',
      '.hud-user-xp-sm{font-size:9px;font-weight:700;color:rgba(220,224,235,0.65);font-family:JetBrains Mono,monospace;white-space:nowrap;flex-shrink:0}',
      '.hud-stats-ribbon{display:flex;align-items:center;justify-content:space-around;gap:6px;padding:8px 12px;height:100%;box-sizing:border-box;min-height:0}',
      '.hud-stats-cell-sm{display:flex;align-items:center;gap:6px;min-width:0;flex:1;justify-content:center}',
      '.hud-stats-cell-sm i{font-size:12px;flex-shrink:0}',
      // v5.216 — botón "Abrir Sheet" del topBar.
      '.hud-sheet-btn{display:flex;align-items:center;gap:6px;flex-shrink:0;cursor:pointer;'+
        'background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.28);'+
        'border-radius:8px;padding:5px 10px;transition:all 160ms;font-family:inherit}',
      '.hud-sheet-btn:hover{background:rgba(74,222,128,0.16);border-color:rgba(74,222,128,0.5);'+
        'box-shadow:0 0 10px rgba(74,222,128,0.25)}',
      '.hud-sheet-btn i{font-size:12px;flex-shrink:0}',
      '.hud-stats-v-sm{font-size:13px;font-weight:800;line-height:1;font-family:JetBrains Mono,monospace;white-space:nowrap;flex-shrink:0}',
      '.hud-stats-v-sm .max{opacity:.45;font-weight:700;font-size:8px;margin-left:1px}',
      '.hud-stats-l-sm{font-size:7.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(220,224,235,0.50);white-space:nowrap;flex-shrink:0}',
      '.hud-stats-sep{width:1px;height:18px;background:rgba(255,255,255,0.10);flex-shrink:0}',
      // bottom cards (mision, logro, nivel)
      // v5.117: bottom cards compactas (padding 13px→9px, ico 42→34)
      '.hud-card{display:flex;align-items:center;gap:10px;padding:8px 12px}',
      '.hud-card-ico{width:34px;height:34px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:9px}',
      '.hud-card-ico-hex{width:34px;height:34px;display:flex;align-items:center;justify-content:center;flex-shrink:0;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%)}',
      '.hud-card-ico-hex span{font-size:13px;font-weight:800;color:#fff}',
      '.hud-card-ico i{font-size:14px}',
      '.hud-card-c{flex:1;display:flex;flex-direction:column;gap:3px;min-width:0}',
      '.hud-card-h{display:flex;align-items:center;justify-content:space-between;gap:6px}',
      // v5.192: letter-spacing .14->.05em + nowrap. "NIVEL SIGUIENTE" /
      // "MISION DIARIA" caben sin apretar y nunca rompen a 2 lineas.
      '.hud-card-l{font-size:8.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;white-space:nowrap}',
      '.hud-card-r{font-size:10.5px;font-weight:800;font-family:JetBrains Mono,monospace;white-space:nowrap}',
      // v5.192: fuente 10.5->9.5px para que subtitulos largos
      // ("Completa 3 habitos hoy", "Recompensas desbloqueadas") quepan
      // completos en la card. Ellipsis se conserva como red de seguridad.
      '.hud-card-sub{font-size:9.5px;font-weight:600;color:rgba(220,224,235,0.62);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-card-bar{height:5px;background:rgba(255,255,255,0.10);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);box-shadow:inset 0 1px 2px rgba(0,0,0,0.40)}',
      '.hud-card-bar > div{height:100%;width:0;border-radius:999px;transition:width .8s ease;min-width:1px}',
      '.hud-card-end{font-size:10px;font-weight:800;letter-spacing:.06em;flex-shrink:0;font-family:JetBrains Mono,monospace;white-space:nowrap}',
      // track
      '.hud-track{display:flex;align-items:center;gap:18px;padding:14px 20px;height:100%;box-sizing:border-box}',
      '.hud-track-cur{display:flex;align-items:center;gap:10px;flex-shrink:0}',
      // v5.116: stops inline en la card "Nivel Actual" (bottom)
      '.hud-track-stops-inline{display:flex;align-items:center;gap:4px;flex-wrap:nowrap;overflow:hidden}',
      '.hud-track-stops-inline > div{flex-shrink:0}',
      '.hud-track-hex{width:38px;height:38px;display:flex;align-items:center;justify-content:center;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);flex-shrink:0}',
      '.hud-track-hex span{font-size:14px;font-weight:800;color:#fff}',
      '.hud-track-cur-info{display:flex;flex-direction:column;gap:2px}',
      '.hud-track-cur-l{font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.45)}',
      '.hud-track-cur-v{font-size:13px;font-weight:800;font-family:JetBrains Mono,monospace;white-space:nowrap}',
      '.hud-track-mid{display:flex;align-items:center;gap:8px;flex:1;justify-content:center;flex-wrap:nowrap}',
    ].join('\n');
    document.head.appendChild(ds);
  }

  // ── Helpers de contenido ──
  // Header de panel: icono en caja + título + menú "···"
  function _pH(label, color, icon){
    // Sparkline decorativo: 8 puntos pseudo-aleatorios deterministas según color
    var seed = (color.charCodeAt(1) || 50) + (color.charCodeAt(3) || 50);
    var pts = [];
    for(var k=0;k<8;k++){
      var v = ((Math.sin(seed+k*0.9)+1)/2 * 0.7 + 0.15);
      pts.push((k * 7) + ',' + (16 - v*14).toFixed(1));
    }
    var sparkPts = pts.join(' ');
    var lastPt = pts[pts.length-1].split(',');
    return '<div class="hud-h" style="--ac:'+color+'">'+
      '<div class="hud-h-ico" style="background:'+_rgba(color,0.14)+';border:1px solid '+_rgba(color,0.40)+';box-shadow:0 0 12px '+_rgba(color,0.20)+'">'+
        '<i class="fas '+icon+'" style="color:'+color+';filter:drop-shadow(0 0 4px '+color+')"></i>'+
      '</div>'+
      '<span class="hud-h-t" style="color:'+color+';text-shadow:0 0 12px '+_rgba(color,0.50)+'">'+label+'</span>'+
      '<svg class="hud-h-spark" viewBox="0 0 49 16" preserveAspectRatio="none" '+
        'style="flex:0 1 48px;min-width:0;width:48px;height:14px;opacity:.65" aria-hidden="true">'+
        '<polyline points="'+sparkPts+'" fill="none" stroke="'+color+'" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" '+
          'style="filter:drop-shadow(0 0 3px '+_rgba(color,0.55)+')"/>'+
        '<circle cx="'+lastPt[0]+'" cy="'+lastPt[1]+'" r="1.6" fill="'+color+'" style="filter:drop-shadow(0 0 3px '+color+')"/>'+
      '</svg>'+
      '<button class="hud-h-expand" data-color="'+color+'" title="Expandir" '+
        'onclick="event.stopPropagation();var p=this.closest(\'.hud-pnl\');if(p&&typeof window._hudExpand===\'function\')window._hudExpand(p);return false;" '+
        'style="color:'+color+';text-shadow:0 0 6px '+_rgba(color,0.40)+'">'+
        '<i class="fas fa-up-right-and-down-left-from-center"></i>'+
      '</button>'+
    '</div>'+
    '<div class="hud-h-bar" style="--ac-50:'+_rgba(color,0.40)+'"></div>';
  }

  // Pie CTA sutil (link, no banner)
  // Click → expande el panel padre (modo carrusel inline).
  // El parámetro `fn` se ignora ahora — antes navegaba a un panel externo
  // (irAPatrimonio, etc). Mantenemos el parámetro por compat con llamadas existentes.
  function _pCTA(label, color, fn){
    return '<div class="hud-cta hud-cta-expand" '+
      'onclick="event.stopPropagation();var p=this.closest(\'.hud-pnl\');if(p&&typeof window._hudExpand===\'function\')window._hudExpand(p);return false;" '+
      'style="'+
      '--ac-15:'+_rgba(color,0.12)+';'+
      '--ac-08:'+_rgba(color,0.08)+';'+
      'cursor:pointer">'+
      '<span class="lbl" style="color:'+color+';text-shadow:0 0 6px '+_rgba(color,0.40)+'">'+label+'</span>'+
      '<i class="fas fa-chevron-right chev" style="color:'+color+'"></i>'+
    '</div>';
  }

  // Hero financiero: label arriba + número grande + chip a la derecha (opcional)
  function _hero(id, color, sublabel, chipId){
    return '<div class="hud-hero">'+
      '<div class="hud-hero-l">'+
        '<div class="hud-hero-lbl">'+sublabel+'</div>'+
        '<div id="'+id+'" class="hud-hero-v" style="color:'+color+';text-shadow:0 0 24px '+_rgba(color,0.40)+'">—</div>'+
      '</div>'+
      (chipId ? '<div id="'+chipId+'" class="hud-hero-chip" style="display:none"></div>' : '')+
    '</div>';
  }

  // Mini barra (Fondo emergencia, Ahorro %)
  function _miniBar(label, valId, barId, color){
    return '<div class="hud-mini">'+
      '<div class="hud-mini-row" style="--ac:'+color+'">'+
        '<span>'+label+'</span>'+
        '<span class="v" id="'+valId+'" style="color:'+color+'">—</span>'+
      '</div>'+
      '<div class="hud-mini-bar">'+
        '<div id="'+barId+'" class="hud-mini-fill" style="background:linear-gradient(90deg,'+color+','+_rgba(color,0.65)+');box-shadow:0 0 8px '+_rgba(color,0.50)+'"></div>'+
      '</div>'+
    '</div>';
  }

  // Row con icono FA, label y valor
  function _row(label, id, color, barId, faIcon){
    return '<div class="hud-row">'+
      '<span class="hud-row-ico"><i class="fas '+(faIcon||'fa-circle')+'" style="color:'+color+';font-size:'+(faIcon?'11px':'5px')+';filter:drop-shadow(0 0 4px '+color+')"></i></span>'+
      '<span class="hud-row-l">'+label+'</span>'+
      (barId
        ? '<div class="hud-row-bar"><div id="'+barId+'" style="background:'+color+';box-shadow:0 0 4px '+_rgba(color,0.50)+'"></div></div>'
        : '')+
      '<span id="'+id+'" class="hud-row-v" style="color:'+color+'">—</span>'+
    '</div>';
  }

  // Maslow row con dot
  function _maslow(label, id, barId, color){
    return '<div class="hud-mas">'+
      '<div class="hud-mas-top">'+
        '<span class="hud-mas-dot" style="background:'+color+';box-shadow:0 0 7px '+color+'"></span>'+
        '<span class="hud-mas-l">'+label+'</span>'+
        '<span id="'+id+'" class="hud-mas-v" style="color:'+color+'">—</span>'+
      '</div>'+
      '<div class="hud-mas-bar"><div id="'+barId+'" style="background:'+color+';box-shadow:0 0 6px '+_rgba(color,0.50)+'"></div></div>'+
    '</div>';
  }

  // Trio cell (Hábitos / Logros / Racha)
  function _trioCell(id, label, value, color){
    return '<div class="hud-trio-cell" style="border-color:'+_rgba(color,0.30)+';background:'+_rgba(color,0.06)+'">'+
      '<div class="top" style="background:'+color+';box-shadow:0 0 8px '+color+';opacity:.7"></div>'+
      '<div class="lbl" style="color:'+color+'">'+label+'</div>'+
      '<div id="'+id+'" class="v" style="color:'+color+';text-shadow:0 0 10px '+_rgba(color,0.40)+'">'+(value||'—')+'</div>'+
    '</div>';
  }

  // Nav grid item
  function _navG(label, icon, color, fn){
    var b = document.createElement('div');
    b.className = 'hud-navg-it';
    b.style.borderColor = _rgba(color,0.25);
    b.style.background = _rgba(color,0.05);
    b.innerHTML =
      '<div class="ico" style="background:'+_rgba(color,0.14)+';border:1px solid '+_rgba(color,0.35)+'">'+
        '<i class="fas '+icon+'" style="color:'+color+';filter:drop-shadow(0 0 3px '+color+')"></i>'+
      '</div>'+
      '<span class="lbl">'+label+'</span>'+
      '<i class="fas fa-chevron-right ch" style="color:'+color+'"></i>';
    b.addEventListener('mouseenter',function(){ b.style.background = _rgba(color,0.12); b.style.boxShadow = '0 4px 14px '+_rgba(color,0.20); });
    b.addEventListener('mouseleave',function(){ b.style.background = _rgba(color,0.05); b.style.boxShadow = 'none'; });
    b.addEventListener('click',function(e){ e.stopPropagation(); cerrarDial(); if(typeof window[fn]==='function') window[fn](); });
    return b;
  }

  // ══════════════════════════════════════
  //  CLEANUP: eliminar paneles huérfanos creados por raw-core.js
  // ══════════════════════════════════════
  // raw-core.js es código LEGACY que también crea paneles con los mismos
  // IDs (hud-user, hud-stats, hud-sim-band, hud-patrimonio, etc.) y los
  // appendea a document.body. Como raw-core se carga ANTES que raw-overlay,
  // sus paneles existen primero en el DOM. Cuando raw-overlay luego corre
  // document.getElementById('hud-user-inner').innerHTML = ..., getElementById
  // retorna el PRIMERO encontrado (el huérfano de raw-core), no el del
  // overlay. Resultado: el panel del overlay queda con HTML vacío y se ven
  // contenidos viejos en los paneles huérfanos.
  // Fix: eliminar los huérfanos antes de crear los nuevos. La variable local
  // _pUser de raw-core sigue referenciándolos pero ya no están en el DOM, así
  // que sus asignaciones de style no afectan. window._hudPanels se sobreescribe
  // más adelante con los paneles del overlay.
  var _HUERFANOS_IDS = [
    'hud-user','hud-sim-band','hud-stats',
    'hud-patrimonio','hud-necesidades','hud-bitacora',
    'hud-financiero','hud-activity','hud-fijos','hud-variables',
    'hud-track','hud-mision','hud-logro','hud-nivel'
  ];
  _HUERFANOS_IDS.forEach(function(id){
    // Puede haber MÁS de un elemento con el mismo id (raw-core + raw-overlay
    // en una sesión donde se cargó dos veces). Removerlos TODOS.
    var existentes = document.querySelectorAll('#'+id);
    existentes.forEach(function(el){ el.remove(); });
  });

  // ══════════════════════════════════════
  //  ZONA SUPERIOR
  // ══════════════════════════════════════

  // ── _pUser (top-left): hexágono + USER + Nivel + barra XP ──
  var _pUser = _mkFloatPanel('hud-user','#A78BFA','rgba(167,139,250,0.15)');
  document.body.appendChild(_pUser);
  _pUser.classList.add('hud-pnl');
  _pUser.style.animationDelay = '0s';
  _pUser.style.borderRadius = '14px';
  document.getElementById('hud-user-inner').innerHTML =
    '<div class="hud-user-stack">'+
      // RENGLÓN 1: USER ribbon
      '<div class="hud-user-ribbon">'+
        '<div class="hud-user-av-sm" style="background:radial-gradient(circle,'+_rgba('#A78BFA',0.22)+','+_rgba('#A78BFA',0.05)+');border:1.5px solid #A78BFA;box-shadow:0 0 12px '+_rgba('#A78BFA',0.45)+',inset 0 0 6px '+_rgba('#A78BFA',0.18)+'">'+
          '<i class="fas fa-user" style="color:#fff;text-shadow:0 0 6px #A78BFA;font-size:11px"></i>'+
        '</div>'+
        '<span class="hud-user-name-sm">USER</span>'+
        '<span class="hud-user-niv-sm">Nv<span id="_hud-user-nivel">1</span></span>'+
        '<div class="hud-user-bar-sm"><div id="_hud-user-xpbar" style="background:linear-gradient(90deg,#A78BFA,#C084FC);box-shadow:0 0 6px '+_rgba('#A78BFA',0.55)+'"></div></div>'+
        '<span class="hud-user-xp-sm" id="_hud-user-xp">0/1,000</span>'+
      '</div>'+
      // SEPARADOR
      '<div class="hud-user-stack-sep"></div>'+
      // RENGLÓN 2: Stats ribbon (Energía / Racha / Créditos)
      '<div class="hud-stats-ribbon">'+
        '<div class="hud-stats-cell-sm">'+
          '<i class="fas fa-bolt" style="color:#FBBF24;filter:drop-shadow(0 0 4px #FBBF24)"></i>'+
          '<span class="hud-stats-v-sm" style="color:#FBBF24"><span id="_hud-energia">—</span><span class="max">/100</span></span>'+
          '<span class="hud-stats-l-sm">Energía</span>'+
        '</div>'+
        '<div class="hud-stats-sep"></div>'+
        '<div class="hud-stats-cell-sm">'+
          '<i class="fas fa-fire" style="color:#FB923C;filter:drop-shadow(0 0 4px #FB923C)"></i>'+
          '<span class="hud-stats-v-sm" style="color:#FB923C"><span id="_hud-racha-dias">—</span><span class="max">d</span></span>'+
          '<span class="hud-stats-l-sm">Racha</span>'+
        '</div>'+
        '<div class="hud-stats-sep"></div>'+
        '<div class="hud-stats-cell-sm">'+
          '<i class="fas fa-gem" style="color:#22D3EE;filter:drop-shadow(0 0 4px #22D3EE)"></i>'+
          '<span id="_hud-creditos" class="hud-stats-v-sm" style="color:#22D3EE">—</span>'+
          '<span class="hud-stats-l-sm">Créditos</span>'+
        '</div>'+
        '<div class="hud-stats-sep"></div>'+
        // v5.216 — botón directo al Google Sheet. Abre la hoja en pestaña
        // nueva, fuera de la web. Usa irASheet() de raw-core.js (que ya
        // tiene la URL real con fallback).
        '<button class="hud-sheet-btn" title="Abrir el Google Sheet directamente" '+
          'onclick="if(typeof irASheet===&quot;function&quot;){irASheet();}else{window.open(&quot;https://docs.google.com/spreadsheets/d/15T14Hb7tvmv24ZAaC3su1NRtDwVS6-dWbJGxQYUGP1o/edit&quot;,&quot;_blank&quot;);}">'+
          '<i class="fas fa-table-cells" style="color:#4ADE80;filter:drop-shadow(0 0 4px #4ADE80)"></i>'+
          '<span class="hud-stats-l-sm" style="color:#4ADE80">Sheet</span>'+
        '</button>'+
      '</div>'+
    '</div>';

  // ── _pSim (top-center): MEGA-CARD con 2 renglones ──
  // Renglón 1: tabs/pills horizontales (botones del Hero como tabs).
  // Renglón 2: contenido del tab activo (por defecto: 9 needs Sim en una fila).
  // Click en tab que NO sea SIM → expande el panel correspondiente del overlay.
  var _pSim = _mkFloatPanel('hud-sim-band','#A78BFA','rgba(167,139,250,0.18)');
  document.body.appendChild(_pSim);
  _pSim.classList.add('hud-pnl');
  _pSim.style.animationDelay = '0.4s';
  _pSim.style.borderRadius = '14px';

  // Definición de tabs (botones del Hero + ESTADO DEL SIM como tab activo por defecto)
  var _SIM_TABS = [
    {id:'sim',       label:'Estado del Sim', icon:'fa-heart-pulse',  color:'#A78BFA', target:null},
    {id:'home',      label:'Home',           icon:'fa-house',        color:'#94A3B8', target:'volverAlAnverso'},
    {id:'logros',    label:'Logros',         icon:'fa-trophy',       color:'#FACC15', target:'irALogros'},
    {id:'bitacora',  label:'Bitácora',       icon:'fa-book-open',    color:'#C084FC', target:'irABitacora'},
    {id:'activity',  label:'Activity',       icon:'fa-bolt',         color:'#FB923C', target:'irAActivity'},
    {id:'sos',       label:'SOS',            icon:'fa-circle-exclamation', color:'#EF4444', target:'activarSOS'},
    {id:'nutricion', label:'Nutrición',      icon:'fa-leaf',         color:'#4ADE80', target:'irANutricion'},
    {id:'raw',       label:'RAW',            icon:'fa-table',        color:'#A5B4FC', target:'irASheets'},
    {id:'refresh',   label:'Actualizar',     icon:'fa-rotate-right', color:'#94A3B8', target:'refreshTodo'},
  ];

  document.getElementById('hud-sim-band-inner').innerHTML =
    // Renglón 1: tabs horizontales
    '<div class="hud-megatabs" id="hud-megatabs">'+
      _SIM_TABS.map(function(t, idx){
        var active = (t.id === 'sim') ? ' active' : '';
        return '<button class="hud-megatab'+active+'" '+
          'data-tab-id="'+t.id+'" '+
          'data-tab-target="'+(t.target||'')+'" '+
          'style="--tc:'+t.color+';--tc-bg:'+_rgba(t.color,0.12)+';--tc-bd:'+_rgba(t.color,0.40)+';--tc-glow:'+_rgba(t.color,0.30)+'">'+
            '<i class="fas '+t.icon+'"></i>'+
            '<span>'+t.label+'</span>'+
        '</button>';
      }).join('')+
    '</div>'+
    // Renglón 2: contenido del tab activo (por defecto Sim)
    // v5.117: header inline + needs grid en MISMA fila horizontal para reducir altura
    '<div class="hud-sim-content">'+
      '<div class="hud-sim-row-compact">'+
        '<div class="hud-sim-h-inline">'+
          '<i class="fas fa-heart-pulse" style="color:#A78BFA;filter:drop-shadow(0 0 4px '+_rgba('#A78BFA',0.55)+')"></i>'+
          '<div class="hud-sim-h-txt">'+
            '<span class="t" style="color:#A78BFA">Estado del Sim</span>'+
            '<span class="meta">9 needs</span>'+
          '</div>'+
        '</div>'+
        '<div id="hud-sim-band-grid" class="hud-sim-grid"></div>'+
      '</div>'+
    '</div>';
  if(typeof renderSimsBandSimsStyle === 'function') renderSimsBandSimsStyle('hud-sim-band-grid');

  // Listeners de los tabs
  // v7.060 — en móvil hud-megatabs no existe (las cards son shells vacíos)
  var _megaTabs = document.getElementById('hud-megatabs');
  if(_megaTabs) _megaTabs.addEventListener('click', function(e){
    var tab = e.target.closest('.hud-megatab');
    if(!tab) return;
    var id = tab.dataset.tabId;
    var target = tab.dataset.tabTarget;
    if(id === 'sim'){
      document.querySelectorAll('.hud-megatab').forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      return;
    }
    // P-3c: Otros tabs → cerrar dial con fade-out, LUEGO navegar.
    if(target && typeof window[target] === 'function'){
      // Cerrar el dial primero con su animación
      if(typeof cerrarDial === 'function') cerrarDial();
      // Esperar el fade-out (~290ms) y entonces navegar
      setTimeout(function(){
        try { window[target](); } catch(e){}
      }, 300);
    }
  });

  // ── _pStats (top-right): Energía / Racha / Créditos en 3 cells ──
  var _pStats = _mkFloatPanel('hud-stats','#FBBF24','rgba(251,191,36,0.15)');
  document.body.appendChild(_pStats);
  _pStats.classList.add('hud-pnl');
  _pStats.style.animationDelay = '0.8s';
  _pStats.style.borderRadius = '14px';
  document.getElementById('hud-stats-inner').innerHTML =
    '<div class="hud-stats-ribbon">'+
      // Energía
      '<div class="hud-stats-cell-sm">'+
        '<i class="fas fa-bolt" style="color:#FBBF24;filter:drop-shadow(0 0 4px #FBBF24)"></i>'+
        '<span class="hud-stats-v-sm" style="color:#FBBF24"><span id="_hud-energia">—</span><span class="max">/100</span></span>'+
        '<span class="hud-stats-l-sm">Energía</span>'+
      '</div>'+
      '<div class="hud-stats-sep"></div>'+
      // Racha
      '<div class="hud-stats-cell-sm">'+
        '<i class="fas fa-fire" style="color:#FB923C;filter:drop-shadow(0 0 4px #FB923C)"></i>'+
        '<span class="hud-stats-v-sm" style="color:#FB923C"><span id="_hud-racha-dias">—</span><span class="max">d</span></span>'+
        '<span class="hud-stats-l-sm">Racha</span>'+
      '</div>'+
      '<div class="hud-stats-sep"></div>'+
      // Créditos
      '<div class="hud-stats-cell-sm">'+
        '<i class="fas fa-gem" style="color:#22D3EE;filter:drop-shadow(0 0 4px #22D3EE)"></i>'+
        '<span id="_hud-creditos" class="hud-stats-v-sm" style="color:#22D3EE">—</span>'+
        '<span class="hud-stats-l-sm">Créditos</span>'+
      '</div>'+
    '</div>';

  // ══════════════════════════════════════
  //  COLUMNA IZQUIERDA
  // ══════════════════════════════════════

  // ── Panel 1: Patrimonio ──
  var _p1 = _mkFloatPanel('hud-patrimonio','#22C55E','rgba(34,197,94,0.15)');
  document.body.appendChild(_p1);
  _p1.classList.add('hud-pnl');
  _p1.style.animationDelay = '0s';
  document.getElementById('hud-patrimonio-inner').innerHTML =
    _pH('Patrimonio','#22C55E','fa-landmark') +
    // v5.145: contenedor dinámico — se llena en _renderPatrimonioOverlayCard()
    // con TODOS los bancos y apartados reales, no solo BBVA/BEATS hardcoded.
    '<div id="_hud-pat-content" style="display:flex;flex-direction:column;gap:8px;padding:0 2px"></div>' +
    _pCTA('Ver detalle completo','#22C55E','irAPatrimonio');

  // ── Panel 2: Necesidades ──
  var _p2 = _mkFloatPanel('hud-necesidades','#A855F7','rgba(168,85,247,0.15)');
  document.body.appendChild(_p2);
  _p2.classList.add('hud-pnl');
  _p2.style.animationDelay = '1.3s';
  document.getElementById('hud-necesidades-inner').innerHTML =
    _pH('Necesidades','#A855F7','fa-wave-square') +
    _maslow('Fisiológicas',   '_hud-nec-1','_hud-nec-1-bar','#EF4444') +
    _maslow('Seguridad',      '_hud-nec-2','_hud-nec-2-bar','#F59E0B') +
    _maslow('Afiliación',     '_hud-nec-3','_hud-nec-3-bar','#22D3EE') +
    _maslow('Reconocimiento', '_hud-nec-4','_hud-nec-4-bar','#A855F7') +
    _maslow('Autorrealización','_hud-nec-5','_hud-nec-5-bar','#22C55E') +
    _pCTA('Ver análisis','#A855F7','irANecesidades');

  // ── Panel 3: Bitácora ──
  var _p3 = _mkFloatPanel('hud-bitacora','#C084FC','rgba(192,132,252,0.15)');
  document.body.appendChild(_p3);
  _p3.classList.add('hud-pnl');
  _p3.style.animationDelay = '2.6s';
  document.getElementById('hud-bitacora-inner').innerHTML =
    _pH('Bitácora','#C084FC','fa-book-open') +
    _row('Pensamientos', '_hud-pens','#C084FC',null,'fa-comment-dots') +
    _row('Relaciones',   '_hud-rels','#EC4899',null,'fa-user-group') +
    _row('Salud',        '_hud-sal', '#EF4444',null,'fa-heart') +
    _row('Nutrición',    '_hud-nut', '#86EFAC',null,'fa-apple-whole') +
    _row('Entrenamiento','_hud-ent', '#FB923C',null,'fa-dumbbell') +
    _pCTA('Abrir Bitácora','#C084FC','irABitacora');

  // ══════════════════════════════════════
  //  COLUMNA DERECHA
  // ══════════════════════════════════════

  // ── Panel 4: Financiero ──
  var _p4 = _mkFloatPanel('hud-financiero','#22D3EE','rgba(34,211,238,0.15)');
  document.body.appendChild(_p4);
  _p4.classList.add('hud-pnl');
  _p4.style.animationDelay = '0.6s';
  document.getElementById('hud-financiero-inner').innerHTML =
    _pH('Financiero','#22D3EE','fa-chart-line') +
    _hero('_hud-fin-exc','#22D3EE','Excedente del mes',null) +
    // Ingresos / Egresos lado a lado — flex auto-fit (no 50/50 forzado)
    // y con white-space:nowrap para que el monto NUNCA se parta a 2 líneas.
    '<div style="display:flex;gap:8px;padding:0 16px 12px;flex-wrap:wrap">'+
      '<div style="flex:1 1 0;min-width:0;padding:9px 11px;background:'+_rgba('#22C55E',0.07)+';border:1px solid '+_rgba('#22C55E',0.28)+';border-radius:9px;position:relative;overflow:hidden">'+
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:#22C55E;box-shadow:0 0 8px #22C55E;opacity:.7"></div>'+
        '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#22C55E;margin-bottom:6px;opacity:.85">Ingresos</div>'+
        '<div id="_hud-fin-ing" style="font-size:16px;font-weight:800;color:#22C55E;font-family:JetBrains Mono,monospace;line-height:1;text-shadow:0 0 12px '+_rgba('#22C55E',0.40)+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">—</div>'+
      '</div>'+
      '<div style="flex:1 1 0;min-width:0;padding:9px 11px;background:'+_rgba('#EF4444',0.07)+';border:1px solid '+_rgba('#EF4444',0.28)+';border-radius:9px;position:relative;overflow:hidden">'+
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:#EF4444;box-shadow:0 0 8px #EF4444;opacity:.7"></div>'+
        '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#EF4444;margin-bottom:6px;opacity:.85">Egresos</div>'+
        '<div id="_hud-fin-egr" style="font-size:16px;font-weight:800;color:#EF4444;font-family:JetBrains Mono,monospace;line-height:1;text-shadow:0 0 12px '+_rgba('#EF4444',0.40)+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">—</div>'+
      '</div>'+
    '</div>'+
    _miniBar('Ahorro %','_hud-fin-aho','_hud-aho-bar','#FACC15') +
    _row('Runway',    '_hud-runway', '#22D3EE',null,'fa-plane-departure') +
    _row('Gasto/día','_hud-gastoDia','#A78BFA',null,'fa-chart-pie') +
    _pCTA('Ver resumen financiero','#22D3EE','irAFinanciero');

  // ── Panel 5: Activity + Logros (3 trio cells + racha con fuegos) ──
  var _p5 = _mkFloatPanel('hud-activity','#FB923C','rgba(251,146,60,0.15)');
  document.body.appendChild(_p5);
  _p5.classList.add('hud-pnl');
  _p5.style.animationDelay = '1.9s';
  document.getElementById('hud-activity-inner').innerHTML =
    _pH('Activity + Logros','#FB923C','fa-bolt') +
    '<div class="hud-trio">'+
      _trioCell('_hud-act-done','Hábitos hoy','—','#FB923C')+
      _trioCell('_hud-lgr-done','Logros','—','#FACC15')+
      _trioCell('_hud-racha','Racha actual','—','#EF4444')+
    '</div>'+
    '<div class="hud-fires-row">'+
      '<i class="fas fa-fire lead" style="color:#FB923C;filter:drop-shadow(0 0 5px #FB923C)"></i>'+
      '<span class="lbl">Racha</span>'+
      '<div id="_hud-racha-fires" class="fires">'+
        '<i class="fas fa-fire"></i><i class="fas fa-fire"></i><i class="fas fa-fire"></i>'+
        '<i class="fas fa-fire"></i><i class="fas fa-fire"></i><i class="fas fa-fire"></i>'+
        '<i class="fas fa-fire"></i>'+
      '</div>'+
    '</div>'+
    _pCTA('Ir a Activity Check','#FB923C','irAActivity');

  // ── Panel Navegación: ELIMINADO en v5.087.
  // Las acciones (Activity, Bitácora, Logros, RAW Sheet, Nutrición, Actualizar)
  // ya están disponibles en los botones del Hero del header. Quitar el panel
  // libera espacio en la columna derecha y simplifica el overlay.

  // ── Panel 7: Fijos (col izq, último) — solo header, contenido al expandir ──
  var _p7 = _mkFloatPanel('hud-fijos','#67E8F9','rgba(103,232,249,0.15)');
  document.body.appendChild(_p7);
  _p7.classList.add('hud-pnl');
  _p7.style.animationDelay = '2.6s';
  _p7.style.borderRadius = '14px';
  document.getElementById('hud-fijos-inner').innerHTML =
    _pH('Fijos','#67E8F9','fa-thumbtack')+
    '<div class="hud-empty-msg">'+
      '<i class="fas fa-table-cells" style="color:'+_rgba('#67E8F9',0.40)+';font-size:22px"></i>'+
      '<span>Tabla y gráfico al expandir</span>'+
    '</div>'+
    _pCTA('Ver detalle completo','#67E8F9','irAFijos');

  // ── Panel 8: Variables (col der, último) — solo header, contenido al expandir ──
  var _p8 = _mkFloatPanel('hud-variables','#A5B4FC','rgba(165,180,252,0.15)');
  document.body.appendChild(_p8);
  _p8.classList.add('hud-pnl');
  _p8.style.animationDelay = '2.9s';
  _p8.style.borderRadius = '14px';
  document.getElementById('hud-variables-inner').innerHTML =
    _pH('Variables','#A5B4FC','fa-calendar-days')+
    '<div class="hud-empty-msg">'+
      '<i class="fas fa-chart-line" style="color:'+_rgba('#A5B4FC',0.40)+';font-size:22px"></i>'+
      '<span>Tabla y gráfico al expandir</span>'+
    '</div>'+
    _pCTA('Ver detalle completo','#A5B4FC','irAVariables');

  // ══════════════════════════════════════
  //  ZONA INFERIOR — track + 3 cards
  // ══════════════════════════════════════

  // ── _pTrack: track horizontal de niveles ──
  var _pTrack = _mkFloatPanel('hud-track','#A78BFA','rgba(167,139,250,0.18)');
  document.body.appendChild(_pTrack);
  _pTrack.classList.add('hud-pnl');
  _pTrack.style.animationDelay = '1.0s';
  _pTrack.style.borderRadius = '14px';
  // Track con más contraste: borde más sólido + glow ambiental visible
  _pTrack.style.border = '1.5px solid rgba(167,139,250,0.55)';
  _pTrack.style.boxShadow = '0 8px 32px rgba(0,0,0,0.65),0 0 28px rgba(167,139,250,0.30),inset 0 1px 0 rgba(167,139,250,0.40)';
  document.getElementById('hud-track-inner').innerHTML =
    '<div class="hud-card">'+
      '<div class="hud-card-ico-hex" style="background:radial-gradient(circle,'+_rgba('#A78BFA',0.22)+','+_rgba('#A78BFA',0.05)+');border:1.5px solid #A78BFA;box-shadow:0 0 16px '+_rgba('#A78BFA',0.45)+',inset 0 0 8px '+_rgba('#A78BFA',0.18)+'">'+
        '<span id="_hud-track-nivel">1</span>'+
      '</div>'+
      '<div class="hud-card-c">'+
        '<div class="hud-card-h">'+
          '<span class="hud-card-l" style="color:#A78BFA;text-shadow:0 0 6px '+_rgba('#A78BFA',0.40)+'">Nivel actual</span>'+
          '<span id="_hud-track-xp" class="hud-card-r" style="color:#A78BFA">0 / 1,000 XP</span>'+
        '</div>'+
        '<div id="_hud-track-stops" class="hud-track-stops-inline"></div>'+
      '</div>'+
      '<span class="hud-card-end" style="color:#A78BFA;text-shadow:0 0 6px '+_rgba('#A78BFA',0.40)+'"><i class="fas fa-trophy"></i></span>'+
    '</div>';

  // ── _pMision: Misión Diaria (bottom-left) ──
  var _pMision = _mkFloatPanel('hud-mision','#22D3EE','rgba(34,211,238,0.15)');
  document.body.appendChild(_pMision);
  _pMision.classList.add('hud-pnl');
  _pMision.style.animationDelay = '1.4s';
  _pMision.style.borderRadius = '14px';
  document.getElementById('hud-mision-inner').innerHTML =
    '<div class="hud-card">'+
      '<div class="hud-card-ico" style="background:'+_rgba('#22D3EE',0.14)+';border:1px solid '+_rgba('#22D3EE',0.45)+';box-shadow:0 0 12px '+_rgba('#22D3EE',0.30)+'">'+
        '<i class="fas fa-bullseye" style="color:#22D3EE;filter:drop-shadow(0 0 4px #22D3EE)"></i>'+
      '</div>'+
      '<div class="hud-card-c">'+
        '<div class="hud-card-h">'+
          '<span class="hud-card-l" style="color:#22D3EE;text-shadow:0 0 6px '+_rgba('#22D3EE',0.40)+'">Misión Diaria</span>'+
          '<span id="_hud-mision-progreso" class="hud-card-r" style="color:#22D3EE">0/3</span>'+
        '</div>'+
        '<span id="_hud-mision-label" class="hud-card-sub">Completa 3 hábitos hoy</span>'+
        '<div class="hud-card-bar"><div id="_hud-mision-bar" style="background:linear-gradient(90deg,#22D3EE,#67E8F9);box-shadow:0 0 6px '+_rgba('#22D3EE',0.55)+'"></div></div>'+
      '</div>'+
      '<span id="_hud-mision-recompensa" class="hud-card-end" style="color:#FACC15;text-shadow:0 0 6px '+_rgba('#FACC15',0.40)+'">+50 XP</span>'+
    '</div>';

  // ── _pLogro: Logro Reciente (bottom-center) ──
  var _pLogro = _mkFloatPanel('hud-logro','#FACC15','rgba(250,204,21,0.15)');
  document.body.appendChild(_pLogro);
  _pLogro.classList.add('hud-pnl');
  _pLogro.style.animationDelay = '1.7s';
  _pLogro.style.borderRadius = '14px';
  document.getElementById('hud-logro-inner').innerHTML =
    '<div class="hud-card">'+
      '<div class="hud-card-ico" style="background:'+_rgba('#FACC15',0.14)+';border:1px solid '+_rgba('#FACC15',0.45)+';box-shadow:0 0 12px '+_rgba('#FACC15',0.30)+'">'+
        '<i class="fas fa-star" style="color:#FACC15;filter:drop-shadow(0 0 4px #FACC15)"></i>'+
      '</div>'+
      '<div class="hud-card-c">'+
        '<div class="hud-card-h">'+
          '<span class="hud-card-l" style="color:#FACC15;text-shadow:0 0 6px '+_rgba('#FACC15',0.40)+'">Logro reciente</span>'+
          '<span id="_hud-logro-pct" class="hud-card-r" style="color:#FACC15">0%</span>'+
        '</div>'+
        '<span id="_hud-logro-titulo" class="hud-card-sub">—</span>'+
        '<div class="hud-card-bar"><div id="_hud-logro-bar" style="background:linear-gradient(90deg,#FACC15,#FCD34D);box-shadow:0 0 6px '+_rgba('#FACC15',0.55)+'"></div></div>'+
      '</div>'+
    '</div>';

  // ── _pNivel: Nivel Siguiente (bottom-right) ──
  var _pNivel = _mkFloatPanel('hud-nivel','#A78BFA','rgba(167,139,250,0.15)');
  document.body.appendChild(_pNivel);
  _pNivel.classList.add('hud-pnl');
  _pNivel.style.animationDelay = '2.0s';
  _pNivel.style.borderRadius = '14px';
  document.getElementById('hud-nivel-inner').innerHTML =
    '<div class="hud-card">'+
      '<div class="hud-card-ico-hex" style="background:radial-gradient(circle,'+_rgba('#A78BFA',0.22)+','+_rgba('#A78BFA',0.05)+');border:1.5px solid #A78BFA;box-shadow:0 0 14px '+_rgba('#A78BFA',0.45)+',inset 0 0 8px '+_rgba('#A78BFA',0.18)+'">'+
        '<span id="_hud-nivel-num">2</span>'+
      '</div>'+
      '<div class="hud-card-c">'+
        '<span class="hud-card-l" style="color:#A78BFA;text-shadow:0 0 6px '+_rgba('#A78BFA',0.40)+'">Nivel siguiente</span>'+
        '<div style="display:flex;align-items:baseline;gap:8px;font-family:JetBrains Mono,monospace">'+
          '<span id="_hud-nivel-xp" style="font-size:13px;font-weight:800;color:#A78BFA;text-shadow:0 0 8px '+_rgba('#A78BFA',0.45)+'">+1,000 XP</span>'+
          '<span style="color:rgba(255,255,255,0.18)">|</span>'+
          '<span id="_hud-nivel-bonus" style="font-size:12px;font-weight:700;color:#22D3EE;text-shadow:0 0 6px '+_rgba('#22D3EE',0.40)+'">+$250</span>'+
        '</div>'+
        '<span class="hud-card-sub" style="font-size:10px;color:rgba(220,224,235,0.50)">Recompensas desbloqueadas</span>'+
      '</div>'+
      '<i class="fas fa-gift" style="font-size:20px;color:#A78BFA;flex-shrink:0;filter:drop-shadow(0 0 6px '+_rgba('#A78BFA',0.55)+')"></i>'+
    '</div>';

  _pUser._side='top-left';     _pUser._order=0;
  _pSim._side='top-center';    _pSim._order=0;
  _pStats._side='top-right';   _pStats._order=0;
  // Distribución 2 columnas izq + 2 columnas der (4 columnas laterales)
  _p1._side='left-1';   _p1._order=0;   // Patrimonio
  _p3._side='left-1';   _p3._order=1;   // Bitácora
  _p2._side='left-2';   _p2._order=0;   // Necesidades
  _p7._side='left-2';   _p7._order=1;   // Fijos
  _p4._side='right-1';  _p4._order=0;   // Financiero
  _p8._side='right-1';  _p8._order=1;   // Variables
  _p5._side='right-2';  _p5._order=0;   // Activity+Logros
  _pTrack._side='bottom-2nd';     _pTrack._order=0;
  _pMision._side='bottom-left';   _pMision._order=0;
  _pLogro._side='bottom-center';  _pLogro._order=0;
  _pNivel._side='bottom-right';   _pNivel._order=0;

  var _hudPanels = [
    {el:_pUser},{el:_pSim},{el:_pStats},
    {el:_p1},{el:_p2},{el:_p3},{el:_p7},
    {el:_p4},{el:_p5},{el:_p8},
    {el:_pTrack},
    {el:_pMision},{el:_pLogro},{el:_pNivel},
  ];

  // ── Calcular tamaño dinámico del dial ──
  // v5.117: Sim banda compactado (header inline con grid en misma fila)
  // y cards bottom compactas (padding 13→8, ico 42→34).
  //   RESERVA_TOP = topPad(22) + Sim banda compactada (110) = 132
  //   RESERVA_BOT = botPad(22) + card compacta (65)         = 87
  // Resultados:
  //   vH=960  → radio = (480-132-30)/0.913 = 348 → diám 696
  //   vH=1080 → radio = (540-132-30)/0.913 = 414 → diám 828 → cap 836
  //   vH=1350 → cap 836
  function _calcDialSize(){
    var DIAL_MAX = 836;
    var SR_RATIO = 0.913;
    var MARGEN = 30;
    var RESERVA_TOP = 132;
    var RESERVA_BOT = 87;
    var vW = window.innerWidth;
    var vH = window.innerHeight;
    var radioMaxTop = (vH / 2 - RESERVA_TOP - MARGEN) / SR_RATIO;
    var radioMaxBot = (vH / 2 - RESERVA_BOT - MARGEN) / SR_RATIO;
    var radioMax = Math.min(radioMaxTop, radioMaxBot);
    var diametroMaxAlto = Math.max(280, radioMax * 2);
    var diametroMaxAncho = vW * 0.45;
    var dial = Math.min(DIAL_MAX, diametroMaxAlto, diametroMaxAncho);
    return Math.round(dial);
  }
  window._calcDialSize = _calcDialSize;

  // ════════════════════════════════════════════════════════════════════
  //  v7.119 — ANCLA DE REJILLA ESTABLE (_GRID)
  //  ───────────────────────────────────────────────────────────────────
  //  CAUSA RAÍZ del "nivel 0 roto al volver de 1→0" (cazada leyendo la
  //  función entera + el camino de raw-niveles):
  //  El alto de la fila superior (topMaxH) y el colTopY derivado se medían
  //  EN VIVO con scrollHeight en CADA _reposicionarHUD. El reset duro de
  //  marcarWarp (t=1150ms) borra width/height de los paneles y, en el MISMO
  //  frame y SIN el ciclo display:none→reflow→display:'' que sí tiene
  //  _hudCollapse, llama _reposicionarHUD. Ahí scrollHeight devuelve basura
  //  residual del modo expandido (financiero inner aún 384px) → topMaxH se
  //  infla → colTopY se dispara → las cards caen a Y~832. Esto casaba EXACTO
  //  con los datos del auditor (financiero 173/384, patrim 832).
  //
  //  El sistema _GRID que el handoff daba por implementado NUNCA llegó a
  //  este archivo: raw-niveles solo tenía `if(window._GRID)…` muertos. Aquí
  //  se define DE VERDAD.
  //
  //  CONTRATO:
  //   · _GRID cachea topMaxH y colTopY medidos UNA vez con pantalla quieta.
  //   · _medirFilaTop() solo RE-MIDE y cachea cuando la pantalla está quieta
  //     (sin niv-warp, sin expandido, sin cascada de entrada, sin regreso de
  //     expandido). Si la llamada cae en un momento sucio, DEVUELVE EL CACHÉ
  //     anterior — jamás commitea una medición contaminada.
  //   · raw-niveles invalida _GRID.medido antes de reposicionar; eso fuerza
  //     una RE-medición, pero solo se concreta si el momento es quieto.
  //  Un solo dueño de la geometría de la fila top. No más mediciones en vivo
  //  durante animaciones (regla de oro del proyecto).
  // ════════════════════════════════════════════════════════════════════
  window._GRID = { medido:false, topMaxH:0, colTopY:0, topY:0 };

  function _pantallaQuieta(){
    var h = document.documentElement;
    if(h.classList.contains('niv-warp')) return false;
    if(window._hudExpanded) return false;
    if(window._hudReturningFromExpand) return false;
    if(window._hudPanels && window._hudPanels.some(function(hp){
      return hp.el && hp.el._animatingEntry;
    })) return false;
    return true;
  }

  // Mide (o recupera del caché) la geometría de la fila superior.
  // Recibe topY base y la altura natural ya medida por el flujo normal.
  // Devuelve { topMaxH, colTopY } — el flujo normal los usa para las columnas.
  // hMedido = max(hUser,hSim,hStats,50) recién calculado en esta pasada.
  //
  // POLÍTICA (clave del fix): el caché solo se (re)escribe cuando está
  // INVALIDADO (medido=false) Y la pantalla está quieta. Mientras medido=true
  // NUNCA se sobreescribe, aunque la pantalla parezca quieta — porque un
  // reposicionamiento "quieto por clase" puede correr sobre un DOM recién
  // reseteado SIN reflow (scrollHeight basura). Refrescar ahí era la fuga que
  // dejaba pasar los 384px. La invalidación solo ocurre en momentos REALMENTE
  // asentados: primer paint quieto y resize/zoom legítimo.
  // CAP de seguridad (v7.120): la fila top (USER ribbon + Sim banda) NUNCA
  // mide más de ~200px sana. Un valor mayor SIEMPRE es contaminación (el inner
  // del panel expandido, 384px; o un scrollHeight residual de 774px que cazó
  // el auditor). Si hMedido excede el tope, es basura → NO commitear; usar el
  // último caché bueno (o un fallback sensato), y dejar medido=false para que
  // el siguiente reposicionamiento limpio sí mida bien.
  var _TOPROW_CAP = 260;
  function _medirFilaTop(topY, hMedido){
    var G = window._GRID;
    var _sano = (hMedido > 0 && hMedido <= _TOPROW_CAP);
    if(!G.medido){
      if(_pantallaQuieta() && _sano){
        // Momento asentado Y medición creíble: commit del ancla.
        G.topY    = topY;
        G.topMaxH = hMedido;
        G.colTopY = topY + hMedido + 8;
        G.medido  = true;
        return { topMaxH:G.topMaxH, colTopY:G.colTopY };
      }
      // Pantalla sucia O medición increíble (>260px): NO commitear.
      // Si ya hubo un caché bueno antes (topMaxH sano), reusarlo; si no,
      // usar el valor vivo acotado al cap como fallback.
      if(G.topMaxH > 0 && G.topMaxH <= _TOPROW_CAP){
        return { topMaxH:G.topMaxH, colTopY:G.topY + G.topMaxH + 8 };
      }
      var _h = _sano ? hMedido : Math.min(hMedido, _TOPROW_CAP);
      return { topMaxH:_h, colTopY:topY + _h + 8 };
    }
    // medido=true: ancla congelada. PERO si el caché está corrupto (topMaxH
    // fuera de rango sano — p.ej. quedó en 774 por un commit viejo previo a
    // este cap), lo descartamos y re-medimos en esta misma pasada.
    if(G.topMaxH > 0 && G.topMaxH <= _TOPROW_CAP){
      return { topMaxH:G.topMaxH, colTopY:G.colTopY };
    }
    // Caché corrupto → invalidar y recalcular vía la rama de arriba.
    G.medido = false;
    return _medirFilaTop(topY, hMedido);
  }
  window._medirFilaTop = _medirFilaTop;

  // ── Reposicionar HUD ──
  // ─── FIX v5.197: lock de reentrada GLOBAL ───
  // v5.196 puso el lock en variables locales (closure). Pero el DnD
  // captura una REFERENCIA de window._reposicionarHUD por polling, y la
  // congela en 'origRepos'. Si la captura antes de que el wrapper quede
  // asignado, su referencia salta el lock (confirmado en runtime:
  // toString() del reposicionador no contenía '_reposEnCurso').
  // SOLUCIÓN: el lock vive en window._reposLock — una variable GLOBAL que
  // cualquier referencia (vieja, nueva, hookeada) comparte. Imposible
  // saltarlo sin importar quién llame.
  function _reposicionarHUD(){
    // v7.060 — En móvil las cards HUD son shells vacíos con display:none.
    // No tiene sentido reposicionarlos. Salir temprano evita el costo
    // del cálculo y de eventuales bucles de medición en cada resize.
    if(window.innerWidth < 900) return;
    if(window._reposLock){ window._reposPend = true; return; }
    window._reposLock = true;
    try {
      _reposicionarHUD_impl();
    } finally {
      window._reposLock = false;
      if(window._reposPend){
        window._reposPend = false;
        requestAnimationFrame(function(){
          if(typeof window._reposicionarHUD === 'function') window._reposicionarHUD();
        });
      }
    }
  }
  function _reposicionarHUD_impl(){
    if(!_dialCanvas||!window._hudPanels) return;
    // v7.103 — ANCLA DURA DEL DIAL: en nivel 0 sin expandido y sin warp,
    // garantizar que el canvas vive en `relative` con left/top vacios. Si
    // quedo en otra posicion tras volver de nivel 1/2 (lo que el log de
    // q007 capturo: dial en 40,40, 176,176, 437,437, 418,418, 460,460
    // todos en nivel 0), aqui se reconcilia ANTES de que se midan rects
    // ni se posicionen cards. Las cards calculan su sitio desde el dial,
    // asi que si el dial esta firme, las cards siguen.
    try {
      var _h = document.documentElement;
      if(!window._hudExpanded && !_h.classList.contains('niv-warp') &&
         _h.classList.contains('niv-0') &&
         _dialCanvas.style.position === 'fixed'){
        _dialCanvas.style.position = 'relative';
        _dialCanvas.style.left = '';
        _dialCanvas.style.top = '';
        _dialCanvas.style.transform = '';
      }
    } catch(_eAnchor){}
    // Aplicar tamaño dinámico del dial ANTES de medir su rect, para que
    // getBoundingClientRect refleje ya el tamaño correcto para el viewport
    // actual. Solo aplica en modo normal (no expandido), porque en modo
    // expandido el dial se transforma a "mini" con tamaño fijo.
    if(!window._hudExpanded){
      var _dynSize = _calcDialSize();
      _dialCanvas.style.width  = _dynSize + 'px';
      _dialCanvas.style.height = _dynSize + 'px';
      // El aro pulsante (dial-ring-breath) también debe escalar:
      var _ringSvg = document.querySelector('#dial-ring-breath svg');
      if(_ringSvg){
        _ringSvg.style.width  = _dynSize + 'px';
        _ringSvg.style.height = _dynSize + 'px';
      }
    }
    var r   = _dialCanvas.getBoundingClientRect();
    var vW  = window.innerWidth;
    var vH  = window.innerHeight;
    var GAP = 22;

    // Override de r en dos casos donde getBoundingClientRect no refleja la
    // geometría FINAL del dial (con tamaño y posición normales):
    //  1) Regreso de modo expandido: el dial está animándose de mini → grande.
    //  2) Apertura inicial: el dial tiene transform:scale(0.85) y opacity:0,
    //     antes de la fase 3 del timeline. boundingClientRect devuelve el
    //     rect transformado (más chico), descalibrando las columnas.
    //
    // ─── FIX v5.198: CAUSA RAÍZ del "layout roto al soltar un panel" ───
    // Diagnóstico runtime: tras un drop, _hudColPositions salía con TODO
    // null → fourCols era false → layout colapsaba a 2 columnas y los
    // paneles se amontonaban. fourCols=false ocurre cuando r.left (espacio
    // a la izquierda del dial) sale demasiado chico. r venía de
    // getBoundingClientRect del dial, y tras un drop el dial puede estar
    // a media transición / con transform residual → rect equivocado.
    // Los casos 1 y 2 ya calculaban el rect matemáticamente; el caso
    // "drop / reposición normal" NO, y ahí estaba el hueco.
    // SOLUCIÓN: en modo normal el dial SIEMPRE está centrado en el
    // viewport con tamaño _calcDialSize(). Calculamos r matemáticamente
    // SIEMPRE (salvo modo expandido). Nunca más dependemos de
    // getBoundingClientRect, que es la fuente de inestabilidad.
    var _hayApertura = !window._hudExpanded && window._hudPanels.some(function(hp){ return hp.el && hp.el._animatingEntry; });
    if(!window._hudExpanded){
      // Modo normal (incluye apertura, regreso de expandido y reposición
      // tras drop): el dial está/estará centrado con su tamaño calculado.
      var _fSizeN = _calcDialSize();
      var _fLeftN = Math.round((vW - _fSizeN) / 2);
      var _fTopN  = Math.round((vH - _fSizeN) / 2);
      r = {
        left:   _fLeftN,
        top:    _fTopN,
        right:  _fLeftN + _fSizeN,
        bottom: _fTopN  + _fSizeN,
        width:  _fSizeN,
        height: _fSizeN,
      };
    }

    // Chamfers por posición
    var chamferRect = 'polygon(10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px),0 10px)';
    var chamferLeft  = 'polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))';
    var chamferRight = 'polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)';

    function getTop(side){
      return window._hudPanels.filter(function(hp){ return hp.el._side===side; });
    }

    // ─── FIX v5.195: blindaje contra "layout roto al soltar un panel" ───
    // Antes de cualquier medición de scrollHeight/offsetHeight, limpiar el
    // transform residual de TODOS los paneles. Un transform activo (de una
    // animación previa o de un drag recién terminado) hace que las alturas
    // se midan inconsistentes → topMaxH se contamina → colTopY se dispara
    // → las columnas laterales se apilan hasta el fondo. La rama de regreso
    // de expandido ya limpiaba esto; la rama normal no, y ese era el hueco.
    // No tocar paneles en cascada de entrada (_animatingEntry) ni el panel
    // expandido (no aplica en rama normal, pero por seguridad).
    if(!window._hudExpanded){
      window._hudPanels.forEach(function(hp){
        if(hp.el && !hp.el._animatingEntry){
          hp.el.style.transform = '';
        }
      });
    }

    var expandedEl = window._hudExpanded;

    // ══════════════════════════════════════════════════════════════════════
    //  MODO EXPANDIDO — un panel ocupa el centro, dial achicado abajo
    // ══════════════════════════════════════════════════════════════════════
    if(expandedEl){
      // Zona disponible verticalmente: entre la fila top (USER/Sim/Stats)
      // y la fila bottom (Misión/Logro/Nivel). El panel se centra ahí.
      // v7.119 — preferir el ancla ESTABLE de la fila top (medida con
      // pantalla quieta antes de expandir) sobre la lectura en vivo de
      // _pUser, que durante la transición de expansión puede estar a media
      // animación y dar un topRowBottom equivocado (causa de la card central
      // aplastada a 352px al regresar 2→1).
      var topRowBottom;
      if(window._GRID && window._GRID.medido){
        topRowBottom = window._GRID.topY + window._GRID.topMaxH + GAP*2;
      } else {
        topRowBottom = parseFloat(_pUser.style.top || 0) +
                       (_pUser.offsetHeight || 100) + GAP*2;
      }
      var botYAvail = vH - 90 - GAP;
      var dialMiniReserva = 80 + GAP*2;
      var zonaH = Math.max(280, botYAvail - dialMiniReserva - topRowBottom);

      // v5.126: el COL_W expandido se calcula PRIMERO porque centerW
      // depende de él (reservar espacio para 1 columna lateral por lado
      // + gaps). Se calcula igual que en el overlay normal para que las
      // cards laterales conserven su ancho original.
      var _leftSpace_exp  = r.left;
      var _rightSpace_exp = vW - r.right;
      var _candidates_exp = [340, 300, 270, 240, 210];
      var COL_W_exp = 210;
      for(var _ci=0; _ci<_candidates_exp.length; _ci++){
        var _w = _candidates_exp[_ci];
        if((_leftSpace_exp  >= (_w * 2 + GAP * 3)) &&
           (_rightSpace_exp >= (_w * 2 + GAP * 3))){
          COL_W_exp = _w; break;
        }
      }
      // Reservar 1 columna lateral por lado + 2 GAPs por lado (margen
      // exterior + separación con la card central) para el ancho del
      // panel expandido en el centro.
      // v5.207 — FIX solapamiento: la reserva lateral debe incluir el
      // ancho de la columna + su GAP exterior + un GAP de separación
      // con el panel central. Antes faltaba ese último GAP, así que en
      // pantallas medianas el panel central se pegaba/encimaba con las
      // columnas. Ahora: por lado = COL_W + GAP(exterior) + GAP(separación).
      var reservaLat = (COL_W_exp + GAP * 2) * 2;
      var centerW = Math.min(1100, vW - reservaLat);
      // Garantía dura: el panel central NO puede invadir las columnas.
      // Su borde izquierdo debe quedar a la derecha de (leftX + COL_W + GAP)
      // y su borde derecho a la izquierda de (rightX - GAP).
      var _colRightEdge = GAP + COL_W_exp + GAP;        // fin de la columna izq + separación
      var _colLeftEdge  = vW - GAP - COL_W_exp - GAP;   // inicio de la columna der − separación
      var _maxCenterW   = _colLeftEdge - _colRightEdge;
      if(centerW > _maxCenterW) centerW = _maxCenterW;
      var centerX = Math.round((vW - centerW) / 2);
      // Si aún así el centrado lo haría invadir, forzar dentro del hueco.
      if(centerX < _colRightEdge) centerX = _colRightEdge;
      if(centerX + centerW > _colLeftEdge) centerW = _colLeftEdge - centerX;

      // Provisional: asignar zona completa centrada (sin medir contenido aún).
      // _hudAjustarTamañoExpandido (llamado por _hudExpand post-hydrate) hará
      // el ajuste fino de altura según el contenido real.
      expandedEl.style.transition = 'left .42s cubic-bezier(.4,1.4,.5,1),top .42s cubic-bezier(.4,1.4,.5,1),width .42s cubic-bezier(.4,1.4,.5,1),height .42s cubic-bezier(.4,1.4,.5,1)';
      expandedEl.style.left      = centerX + 'px';
      expandedEl.style.width     = centerW + 'px';
      expandedEl.style.top       = topRowBottom + 'px';
      expandedEl.style.height    = zonaH + 'px';
      expandedEl.style.minHeight = '280px';
      expandedEl.style.clipPath  = chamferRect;
      // Guardar la zona disponible para el ajuste post-hydrate
      expandedEl._zonaY = topRowBottom;
      expandedEl._zonaH = zonaH;

      // Dial achicado abajo (donde estaba el track)
      var dialMini = 80;
      var dialMiniY = vH - dialMini - GAP - 90; // arriba de las cards bottom
      var dialMiniX = Math.round((vW - dialMini) / 2);
      _dialCanvas.style.transition = 'width .42s cubic-bezier(.4,1.4,.5,1),height .42s cubic-bezier(.4,1.4,.5,1),transform .42s cubic-bezier(.4,1.4,.5,1)';
      _dialCanvas.style.position = 'fixed';
      _dialCanvas.style.left = dialMiniX + 'px';
      _dialCanvas.style.top  = dialMiniY + 'px';
      _dialCanvas.style.width  = dialMini + 'px';
      _dialCanvas.style.height = dialMini + 'px';
      _dialCanvas.style.zIndex = '9100';
      _dialCanvas.style.cursor = 'pointer';
      _dialCanvas.title = 'Volver al dial';
      // Hint visual: glow alrededor del dial mini
      _dialCanvas.style.boxShadow = '0 0 24px rgba(167,139,250,0.55),0 0 48px rgba(167,139,250,0.30)';
      _dialCanvas.style.borderRadius = '50%';

      // Posicionar el resto de paneles laterales (NO el expandido)
      // En modo expandido colapsamos en 2 columnas (izq/der) por simplicidad,
      // independientemente de si normalmente serían 4.
      var leftPanels  = window._hudPanels.filter(function(hp){
        return /^left/.test(hp.el._side || '') && hp.el !== expandedEl;
      });
      var rightPanels = window._hudPanels.filter(function(hp){
        return /^right/.test(hp.el._side || '') && hp.el !== expandedEl;
      });

      var leftX  = GAP;
      var rightX = vW - COL_W_exp - GAP;
      function placeColExpanded(panels, x){
        // En modo expandido: ordenar dando preferencia a left-1/right-1 sobre left-2/right-2
        panels.sort(function(a,b){
          var sa = a.el._side==='left-1'||a.el._side==='right-1' ? 0 : 1;
          var sb = b.el._side==='left-1'||b.el._side==='right-1' ? 0 : 1;
          if(sa !== sb) return sa - sb;
          return a.el._order - b.el._order;
        });
        var y = topRowBottom;
        panels.forEach(function(hp){
          hp.el.style.transition = 'left .42s cubic-bezier(.4,1.4,.5,1),top .42s cubic-bezier(.4,1.4,.5,1),width .42s cubic-bezier(.4,1.4,.5,1)';
          hp.el.style.left = x + 'px';
          hp.el.style.top  = y + 'px';
          hp.el.style.width = COL_W_exp + 'px';
          hp.el.style.height = '';
          hp.el.style.minHeight = '';
          hp.el.style.clipPath = chamferRect;
          var h = hp.el.scrollHeight || hp.el.offsetHeight || 200;
          y += h + GAP;
        });
      }
      placeColExpanded(leftPanels,  leftX);
      placeColExpanded(rightPanels, rightX);

      // Misión/Logro/Nivel a los lados (Misión en bottom-left,
      // Nivel en bottom-right, Logro oculto temporalmente)
      var pMisionEx = getTop('bottom-left')[0];
      var pLogroEx  = getTop('bottom-center')[0];
      var pNivelEx  = getTop('bottom-right')[0];
      var pTrackEx  = getTop('bottom-2nd')[0];
      var botYEx = vH - 90;
      if(pMisionEx){
        pMisionEx.el.style.transition = 'all .42s cubic-bezier(.4,1.4,.5,1)';
        pMisionEx.el.style.left = GAP + 'px';
        pMisionEx.el.style.top  = botYEx + 'px';
        pMisionEx.el.style.width = '320px';
      }
      if(pNivelEx){
        pNivelEx.el.style.transition = 'all .42s cubic-bezier(.4,1.4,.5,1)';
        pNivelEx.el.style.left = (vW - 360 - GAP) + 'px';
        pNivelEx.el.style.top  = botYEx + 'px';
        pNivelEx.el.style.width = '360px';
      }
      // Logro y Track ocultos en modo expandido
      if(pLogroEx){
        pLogroEx.el.style.transition = 'opacity .3s ease';
        pLogroEx.el.style.opacity = '0';
        pLogroEx.el.style.pointerEvents = 'none';
      }
      if(pTrackEx){
        pTrackEx.el.style.transition = 'opacity .3s ease';
        pTrackEx.el.style.opacity = '0';
        pTrackEx.el.style.pointerEvents = 'none';
      }

      // Top row: USER y Stats igual; Sim achicado pero presente
      // v5.147: ANTES retornaba aquí sin tocar paneles top → si algo
      // disparaba _reposicionarHUD durante modo expandido, los paneles top
      // quedaban en posiciones viejas y "se desplazaban a la izquierda".
      // Ahora reposicionamos los paneles top también (USER, Sim, Stats)
      // con el mismo cálculo del modo normal, para que se mantengan en
      // su lugar correcto durante todo el modo expandido.
      (function _reposicionarTopEnExpandido(){
        // Calcular leftX/rightW exactamente como el flujo normal de abajo.
        var _leftSpaceN  = r.left;
        var _rightSpaceN = vW - r.right;
        var _candidatesN = [340, 300, 270, 240, 210];
        var COL_W_N = 210;
        for(var _ciN=0; _ciN<_candidatesN.length; _ciN++){
          var _wN = _candidatesN[_ciN];
          if((_leftSpaceN  >= (_wN * 2 + GAP * 3)) &&
             (_rightSpaceN >= (_wN * 2 + GAP * 3))){
            COL_W_N = _wN; break;
          }
        }
        var fourColsN = (_leftSpaceN  >= (COL_W_N * 2 + GAP * 3)) &&
                        (_rightSpaceN >= (COL_W_N * 2 + GAP * 3));
        var leftXN  = fourColsN ? GAP : GAP;
        var leftWN  = fourColsN ? (COL_W_N * 2 + GAP) : COL_W_N;
        var rightWN = fourColsN ? (COL_W_N * 2 + GAP) : COL_W_N;
        var rightXN = vW - rightWN - GAP;

        var topPad_e = GAP;
        var pUser_e  = window._hudPanels.filter(function(hp){ return hp.el._side==='top-left'; })[0];
        var pSim_e   = window._hudPanels.filter(function(hp){ return hp.el._side==='top-center'; })[0];
        var pStats_e = window._hudPanels.filter(function(hp){ return hp.el._side==='top-right'; })[0];

        var topBarStartX_e = leftXN;
        var topBarEndX_e   = rightXN + rightWN;
        var topBarTotalW_e = topBarEndX_e - topBarStartX_e;

        var wUser_e, wStats_e;
        if(fourColsN){
          wUser_e = COL_W_N;
          wStats_e = 0;
        } else {
          wUser_e = leftWN;
          wStats_e = 0;
        }
        var wSim_e = topBarTotalW_e - wUser_e;
        if(wSim_e < 400){
          wUser_e = Math.min(180, wUser_e);
          wSim_e = topBarTotalW_e - wUser_e;
        }

        if(pUser_e && wUser_e>0){
          pUser_e.el.style.width = wUser_e+'px';
          pUser_e.el.style.left = topBarStartX_e + 'px';
          pUser_e.el.style.top = topPad_e + 'px';
          pUser_e.el.style.clipPath = chamferRect;
          pUser_e.el.style.visibility = 'visible';
          pUser_e.el.style.opacity = '';
        }
        if(pSim_e){
          pSim_e.el.style.width = wSim_e + 'px';
          pSim_e.el.style.left = (topBarStartX_e + wUser_e) + 'px';
          pSim_e.el.style.top = topPad_e + 'px';
          pSim_e.el.style.clipPath = chamferRect;
        }
        if(pStats_e){
          pStats_e.el.style.width = '0px';
          pStats_e.el.style.opacity = '0';
          pStats_e.el.style.visibility = 'hidden';
        }
      })();
      return;
    }

    // ══════════════════════════════════════════════════════════════════════
    //  REGRESO DE MODO EXPANDIDO — limpieza de los estilos inline que la
    //  rama expandida aplicó. NO TOCAMOS transition aquí porque _hudCollapse
    //  acaba de setearla para animar suavemente el regreso; se limpiará
    //  después de 500ms desde _hudCollapse.
    //  NOTA: r ya fue overrideada al inicio de _reposicionarHUD si la
    //  bandera _hudReturningFromExpand está activa, así que aquí los
    //  cálculos siguientes ya usan la geometría final correcta del dial.
    // ══════════════════════════════════════════════════════════════════════
    // Restaurar el dial canvas (mantener transition activa para animar)
    _dialCanvas.style.position    = 'relative';
    _dialCanvas.style.left        = '';
    _dialCanvas.style.top         = '';
    _dialCanvas.style.zIndex      = '1';
    _dialCanvas.style.cursor      = 'pointer';
    _dialCanvas.style.boxShadow   = '';
    _dialCanvas.style.borderRadius = '';
    _dialCanvas.style.transform   = '';
    _dialCanvas.style.width       = _calcDialSize() + 'px';
    _dialCanvas.style.height      = _calcDialSize() + 'px';
    _dialCanvas.title             = '';

    // Limpiar height/minHeight/opacity/pointer-events forzados, pero
    // MANTENER transition para que la animación de regreso sea visible.
    // EXCEPCIÓN: si el panel está en cascada de entrada (_animatingEntry),
    // NO tocamos opacity/transform/transition para no romper la animación.
    window._hudPanels.forEach(function(hp){
      var el = hp.el;
      if(el._animatingEntry) return; // cascada en curso: no tocar
      el.style.transform     = '';
      el.style.height        = '';
      el.style.minHeight     = '';
      el.style.maxHeight     = '';
      el.style.overflowY     = '';
      el.style.opacity       = '';
      el.style.pointerEvents = '';
      var inner = el.querySelector(':scope > [id$="-inner"]');
      if(inner){ inner.style.minHeight = ''; }
    });

    // ══════════════════════════════════════════════════════════════════
    //  v7.120 — PURGA DE CARDS LATERALES EN NIVEL 0
    //  ─────────────────────────────────────────────────────────────────
    //  En nivel 0 las 7 cards laterales (left-1/left-2/right-1/right-2:
    //  Patrimonio, Bitácora, Necesidades, Fijos, Financiero, Variables,
    //  Activity+Logros) YA NO se muestran ni se posicionan. Solo viven en
    //  el coverflow de nivel 1.
    //  IMPORTANTE: NO se borran del DOM ni de _hudPanels. Siguen creadas e
    //  hidratadas con datos del Sheet (su -inner conserva el innerHTML); el
    //  coverflow (raw-coverflow.anillo()) las sigue tomando por _side. Aquí
    //  solo se les pone display:none para que no floten, no empujen, ni se
    //  midan en nivel 0. El coverflow les quita el display:none al entrar a
    //  niv-1 (ver gancho en raw-coverflow / raw-niveles).
    //  Efecto colateral DESEADO: sin laterales, colTopY/positionCol dejan de
    //  intervenir → muere el bug de cards empujadas a Y~832.
    // ══════════════════════════════════════════════════════════════════
    var _ES_NIVEL0 = document.documentElement.classList.contains('niv-0') ||
                     (!document.documentElement.classList.contains('niv-1') &&
                      !document.documentElement.classList.contains('niv-2'));
    function _esLateralPanel(side){
      return side==='left-1'||side==='left-2'||side==='right-1'||side==='right-2'||side==='left'||side==='right';
    }
    if(_ES_NIVEL0){
      window._hudPanels.forEach(function(hp){
        if(hp.el && _esLateralPanel(hp.el._side)){
          // Ocultar de tajo. No tocar su contenido ni su -inner (datos intactos).
          hp.el.style.display = 'none';
        }
      });
    } else {
      // Fuera de niv-0 (por seguridad si se reposiciona en otro nivel),
      // restaurar el display para que el coverflow las pueda mostrar.
      window._hudPanels.forEach(function(hp){
        if(hp.el && _esLateralPanel(hp.el._side) && hp.el.style.display === 'none'){
          hp.el.style.display = '';
        }
      });
    }

    // ══════════════════════════════════════════
    //  CÁLCULO DE 4 COLUMNAS LATERALES (2 izq + 2 der)
    //  Se hace primero porque la zona top necesita conocer X y W para alinearse.
    //  Layout: [col-A] [col-B] [dial] [col-C] [col-D]
    // ══════════════════════════════════════════
    var leftSpace  = r.left;          // espacio total a la izquierda del dial
    var rightSpace = vW - r.right;    // espacio total a la derecha del dial
    // v5.115: COL_W más dinámico con varios escalones, prefiere el mayor
    // que quepa en el espacio disponible. Esto evita que en pantallas
    // grandes las cards queden estrechas y corten info en 2 renglones.
    var COL_GAP = GAP;
    var COL_W;
    var _candidates = [340, 300, 270, 240, 210];
    var _fits = null;
    for(var _ci=0; _ci<_candidates.length; _ci++){
      var _w = _candidates[_ci];
      if((leftSpace  >= (_w * 2 + COL_GAP * 3)) &&
         (rightSpace >= (_w * 2 + COL_GAP * 3))){
        _fits = _w; break;
      }
    }
    COL_W = _fits || 210;
    var fourCols = !!_fits;

    var colA_X, colB_X, colC_X, colD_X, leftW, rightW, leftX, rightX;
    if(fourCols){
      // Izquierda: las dos columnas se ANCLAN al borde del dial.
      // col-B termina junto al dial; col-A queda a su izquierda.
      // Total ancho izquierdo = COL_W + GAP + COL_W
      var totalLeftW = COL_W * 2 + COL_GAP;
      // Centrar las 2 columnas en el espacio izquierdo:
      // Pero priorizar tocar el borde del dial (col-B pegada al dial).
      // Distribución: GAP entre col-B y dial.
      colB_X = r.left - GAP - COL_W;
      colA_X = colB_X - COL_GAP - COL_W;
      // Si colA_X queda negativo (no hay espacio), pegarlo al borde izquierdo
      if(colA_X < GAP){
        colA_X = GAP;
        colB_X = colA_X + COL_W + COL_GAP;
      }
      // Derecha: col-C pegada al dial, col-D a la derecha.
      colC_X = r.right + GAP;
      colD_X = colC_X + COL_W + COL_GAP;
      // Si colD_X+COL_W excede el viewport, ajustar
      if(colD_X + COL_W + GAP > vW){
        colD_X = vW - GAP - COL_W;
        colC_X = colD_X - COL_GAP - COL_W;
      }
      // Para la barra top: leftX..leftX+leftW abarca col-A + col-B
      leftX = colA_X;
      leftW = (colB_X + COL_W) - colA_X;
      rightX = colC_X;
      rightW = (colD_X + COL_W) - colC_X;
    } else {
      // Fallback: 1 columna por lado (comportamiento anterior)
      leftW  = Math.min(Math.max(180, leftSpace  - GAP*2), 260);
      rightW = Math.min(Math.max(180, rightSpace - GAP*2), 260);
      leftX  = Math.floor((leftSpace  - leftW)  / 2);
      rightX = r.right + Math.floor((rightSpace - rightW) / 2);
      colA_X = leftX; colB_X = null;
      colC_X = rightX; colD_X = null;
    }

    // ══════════════════════════════════════════
    //  ZONA SUPERIOR — fila continua, ancho = desde leftX hasta (rightX+rightW)
    //  USER + Sim (mega-card con tabs) + Stats forman UNA barra horizontal
    //  pegados entre sí, alineada al ancho de las columnas laterales.
    // ══════════════════════════════════════════
    var topPad  = GAP;
    var pUser  = getTop('top-left')[0];
    var pSim   = getTop('top-center')[0];
    var pStats = getTop('top-right')[0];

    // Ancho total de la barra top: desde inicio de col izq hasta fin de col der
    var topBarStartX = leftX;
    var topBarEndX   = rightX + rightW;
    var topBarTotalW = topBarEndX - topBarStartX;

    // v5.116: USER+Stats fusionados en _pUser (2 renglones). _pStats queda
    // oculto pero permanece en el DOM para que el DnD no se rompa.
    // wUser = COL_W (col-A), wSim = el resto (desde fin de col-A hasta fin
    // de col-D), wStats = 0 (oculto).
    var wUser, wStats;
    if(fourCols){
      wUser  = COL_W;
      wStats = 0;
    } else {
      wUser  = leftW;
      wStats = 0;
    }
    var wSim = topBarTotalW - wUser;
    // Salvaguarda: Sim banda nunca demasiado estrecho
    if(wSim < 400){
      wUser = Math.min(180, wUser);
      wSim = topBarTotalW - wUser;
    }

    if(pUser && wUser>0){
      pUser.el.style.width = wUser+'px';
      if(!pUser.el._animatingEntry){
        pUser.el.style.visibility='visible';
        pUser.el.style.opacity='';
      }
    } else if(pUser){
      pUser.el.style.width='0px';
      pUser.el.style.opacity='0';
      pUser.el.style.visibility='hidden';
    }
    if(pSim){ pSim.el.style.width = wSim+'px'; }
    // _pStats oculto en v5.116 (su contenido ahora vive dentro de _pUser).
    // Aún así reservamos el slot por compatibilidad con el DnD.
    if(pStats){
      pStats.el.style.width='0px';
      pStats.el.style.opacity='0';
      pStats.el.style.visibility='hidden';
      pStats.el.style.pointerEvents='none';
    }

    // Medir altura natural de cada panel top de forma independiente.
    // En v5.115 USER y Stats son ribbon delgados (~40-50px), Sim es el más
    // alto (~170px) por sus 2 renglones (tabs + needs). NO forzar uniformidad:
    // USER y Stats se centran verticalmente dentro de la zona del Sim banda
    // para alinearse visualmente sin estirarse.
    var hUser=0, hSim=0, hStats=0;
    [pUser,pSim,pStats].forEach(function(hp){
      if(hp && hp.el && hp.el.style.width !== '0px'){
        // Limpiar minHeight del panel Y del inner antes de medir (zoom safe)
        hp.el.style.minHeight = '';
        var innerM = hp.el.querySelector(':scope > [id$="-inner"]');
        if(innerM){
          innerM.style.minHeight = '';
          innerM.style.justifyContent = '';
        }
        var h = hp.el.scrollHeight || hp.el.offsetHeight || 50;
        if(hp===pUser) hUser=h;
        else if(hp===pSim) hSim=h;
        else if(hp===pStats) hStats=h;
      }
    });
    // topMaxH = altura del Sim (la mayor) — usada para calcular colTopY.
    // _topMaxHVivo es la medición fresca de ESTA pasada; puede estar
    // contaminada si caemos en mitad de un warp/reset. El valor ESTABLE
    // que alimenta colTopY sale de _medirFilaTop (caché de pantalla quieta).
    var _topMaxHVivo = Math.max(hUser, hSim, hStats, 50);
    // USER y Stats NO se estiran. Solo se centran verticalmente con Sim:
    // aplicamos un transform translateY a sus inline top.

    var topY = topPad;   // ← v7.121 fix: restaurada (la borré al reescribir y rompía todo)
    // v7.121 — USER y Estado-del-SIM forman UNA barra superior PEGADA ARRIBA.
    // USER va a la izquierda, SIM pegado a su derecha, ambos anclados a topY.
    // ANTES: USER se centraba verticalmente contra hSim con
    //   topYUser = topY + (hSim - hUser)/2
    // Pero hSim se mide CONTAMINADO al regresar de niv-1/2 (scrollHeight
    // residual ~700px sin reflow) → USER saltaba a top≈348 (dato del auditor).
    // Al anclar AMBOS a topY, USER ya no depende de ninguna altura medida →
    // no puede volar. La barra queda siempre arriba.
    var topYUser  = topY;
    var topYStats = topY;
    // PEGADAS sin gaps entre ellas, comenzando en topBarStartX
    if(pUser && wUser>0){
      pUser.el.style.left = topBarStartX + 'px';
      pUser.el.style.top  = topYUser + 'px';
      pUser.el.style.clipPath = chamferRect;
    }
    if(pSim){
      pSim.el.style.left = (topBarStartX + wUser) + 'px';
      pSim.el.style.top  = topY + 'px';
      pSim.el.style.clipPath = chamferRect;
    }
    if(pStats && wStats>0){
      pStats.el.style.left = (topBarStartX + wUser + wSim) + 'px';
      pStats.el.style.top  = topYStats + 'px';
      pStats.el.style.clipPath = chamferRect;
    }

    // ══════════════════════════════════════════
    //  ZONA INFERIOR — 4 cards en UNA SOLA fila
    //  Misión (col-A) | Nivel Actual (col-B) | Logro (col-C) | Siguiente (col-D)
    //  El track horizontal se eliminó; su contenido vive en _pTrack
    //  reubicado en 'bottom-2nd' como una card más.
    // ══════════════════════════════════════════
    var pTrack       = getTop('bottom-2nd')[0];   // ← antes era 'bottom-track', ahora card normal
    var pMision      = getTop('bottom-left')[0];
    var pLogro       = getTop('bottom-center')[0];
    var pNivel       = getTop('bottom-right')[0];

    var botPad  = GAP;
    var botGap  = GAP;  // mismo gap entre cards bottom que entre cards laterales

    // Alinear cada card con su columna respectiva.
    if(fourCols){
      // Misión = col-A
      if(pMision){
        pMision.el.style.width = COL_W+'px';
        pMision.el.style.left  = colA_X+'px';
      }
      // Nivel Actual (track reusado) = col-B
      if(pTrack){
        pTrack.el.style.width = COL_W+'px';
        pTrack.el.style.left  = colB_X+'px';
      }
      // Logro = col-C
      if(pLogro){
        pLogro.el.style.width = COL_W+'px';
        pLogro.el.style.left  = colC_X+'px';
      }
      // Nivel Siguiente = col-D
      if(pNivel){
        pNivel.el.style.width = COL_W+'px';
        pNivel.el.style.left  = colD_X+'px';
      }
    } else {
      // Modo compacto (2 cols): 2 cards por lado
      var halfL = Math.floor((leftW - botGap)/2);
      var halfR = Math.floor((rightW - botGap)/2);
      if(pMision){
        pMision.el.style.width = halfL+'px';
        pMision.el.style.left  = leftX+'px';
      }
      if(pTrack){
        pTrack.el.style.width = halfL+'px';
        pTrack.el.style.left  = (leftX + halfL + botGap)+'px';
      }
      if(pLogro){
        pLogro.el.style.width = halfR+'px';
        pLogro.el.style.left  = rightX+'px';
      }
      if(pNivel){
        pNivel.el.style.width = halfR+'px';
        pNivel.el.style.left  = (rightX + halfR + botGap)+'px';
      }
    }

    // Medir altura natural de las 4 cards
    var botH = 0;
    [pMision,pTrack,pLogro,pNivel].forEach(function(hp){
      if(hp && hp.el){
        var h = hp.el.scrollHeight || hp.el.offsetHeight || 80;
        if(h>botH) botH = h;
      }
    });
    if(botH===0) botH = 80;
    // v7.121 — CAP/ANCLA de la fila inferior. Las 4 cards bottom (Misión,
    // Track, Logro, Nivel) NUNCA miden más de ~110px sanas. Al regresar de
    // niv-1/2 el scrollHeight se contamina (dato del auditor: botY saltó de
    // 1300 a 1180, o sea botH se midió 120px de más) → las cards subían.
    // Si botH excede el tope, es basura → usar el último valor bueno cacheado
    // (o el tope). Cuando la pantalla está quieta y la medición es creíble,
    // refrescar el caché.
    var _BOT_CAP = 130;
    if(!window._GRID.botH) window._GRID.botH = 0;
    if(botH > 0 && botH <= _BOT_CAP && _pantallaQuieta()){
      window._GRID.botH = botH;            // medición creíble y quieta: cachear
    } else if(window._GRID.botH > 0){
      botH = window._GRID.botH;            // usar ancla buena
    } else {
      botH = Math.min(botH, _BOT_CAP);     // sin ancla aún: acotar al tope
    }

    var botY = vH - botPad - botH;

    [pMision,pTrack,pLogro,pNivel].forEach(function(hp){
      if(hp && hp.el){
        hp.el.style.top      = botY + 'px';
        hp.el.style.clipPath = chamferRect;
      }
    });

    // ══════════════════════════════════════════
    //  COLUMNAS LATERALES — entre fila top y track
    //  IMPORTANTE: las columnas NUNCA invaden zona inferior (botY o trackY)
    //  NOTA: leftX/rightX/leftW/rightW ya fueron calculados arriba (zona top los necesitaba).
    // ══════════════════════════════════════════
    // v7.119 — colTopY sale del ANCLA ESTABLE, no de la medición en vivo.
    // En pantalla quieta _medirFilaTop refresca el caché con la medición
    // fresca; en mitad de un warp/reset devuelve el último valor bueno, así
    // que el inner residual de 384px del modo expandido JAMÁS infla colTopY.
    var _grid     = _medirFilaTop(topY, _topMaxHVivo);
    var topMaxH   = _grid.topMaxH;
    var colTopY    = _grid.colTopY;
    var colBotY    = botY - 8;  // antes restaba trackY; v5.116: track eliminado
    var colVAvail  = Math.max(200, colBotY - colTopY);

    // Exportar posiciones de columnas para que DnD pueda dibujar slots
    // en columnas vacías (sin paneles).
    window._hudColPositions = {
      'left-1_X':  fourCols ? colA_X : null,
      'left-2_X':  fourCols ? colB_X : null,
      'right-1_X': fourCols ? colC_X : null,
      'right-2_X': fourCols ? colD_X : null,
      COL_W:       fourCols ? COL_W  : null,
      colTopY:     colTopY,
    };

    // Filtrar paneles por columna (4 columnas si fourCols; 2 si fallback)
    var pColA, pColB, pColC, pColD;
    if(fourCols){
      pColA = window._hudPanels.filter(function(hp){ return hp.el._side==='left-1';  });
      pColB = window._hudPanels.filter(function(hp){ return hp.el._side==='left-2';  });
      pColC = window._hudPanels.filter(function(hp){ return hp.el._side==='right-1'; });
      pColD = window._hudPanels.filter(function(hp){ return hp.el._side==='right-2'; });
    } else {
      // Fallback: combinar left-1+left-2 → izq, right-1+right-2 → der
      pColA = window._hudPanels.filter(function(hp){
        return hp.el._side==='left-1' || hp.el._side==='left-2' || hp.el._side==='left';
      });
      pColC = window._hudPanels.filter(function(hp){
        return hp.el._side==='right-1' || hp.el._side==='right-2' || hp.el._side==='right';
      });
      pColB = []; pColD = [];
    }

    function positionCol(panels, x, w, isLeft){
      if(!panels || !panels.length) return;
      panels.sort(function(a,b){ return a.el._order - b.el._order; });
      panels.forEach(function(hp){
        hp.el.style.width = w + 'px';
        hp.el.style.left  = x + 'px';
        hp.el.style.top   = '-9999px';
        // Limpieza CRÍTICA para que el zoom in/out vuelva siempre al estado limpio:
        // borrar maxHeight/overflowY/height de pasadas anteriores antes de medir.
        hp.el.style.maxHeight = '';
        hp.el.style.overflowY = '';
        hp.el.style.height    = '';
        // Limpiar transform SOLO si no está animando entrada
        if(!hp.el._animatingEntry) hp.el.style.transform = '';
      });
      // v7.102 — GRID FIJO: techo duro por columna. Cada card recibe una
      // celda de alto maximo; si su contenido natural excede la celda, se
      // RECORTA con scroll interno propio — JAMAS desborda ni empuja a la
      // card de abajo (causa del encimado: Mision sobre Patrimonio, Nivel
      // sobre Necesidades en las capturas). El reparto de altura es
      // proporcional al contenido natural, con un piso digno por card.
      var heights = panels.map(function(hp){
        return hp.el.scrollHeight || hp.el.offsetHeight || 200;
      });
      var nP = panels.length;
      var gapBetween = GAP;
      var dispo = colVAvail - gapBetween * (nP - 1);   // alto util tras gaps
      var natTotal = heights.reduce(function(s,h){ return s+h; }, 0);

      // Celdas: si TODO cabe, cada card toma su altura natural (sin recorte).
      // Si NO cabe, se reparte 'dispo' proporcional al contenido, con un
      // minimo de 120px por card para que ninguna quede aplastada.
      var celdas;
      if(natTotal <= dispo || nP === 1){
        celdas = heights.slice();                       // holgura: natural
      } else {
        var MIN_CELDA = Math.min(120, Math.floor(dispo / nP));
        var fijo = MIN_CELDA * nP;
        var flex = Math.max(0, dispo - fijo);           // a repartir por peso
        var pesoTotal = heights.reduce(function(s,h){ return s + Math.max(1,h - MIN_CELDA); }, 0) || 1;
        celdas = heights.map(function(h){
          return Math.floor(MIN_CELDA + flex * (Math.max(1,h - MIN_CELDA) / pesoTotal));
        });
      }

      var curY = colTopY;
      var chamfer = isLeft ? chamferLeft : chamferRight;
      panels.forEach(function(hp, idx){
        var celda = Math.round(celdas[idx]);
        var natural = heights[idx];
        hp.el.style.top      = Math.round(curY) + 'px';
        hp.el.style.clipPath = chamfer;
        if(natural > celda + 2){
          // Contenido mas alto que su celda: fijar alto y dar scroll propio.
          hp.el.style.height    = celda + 'px';
          hp.el.style.maxHeight = celda + 'px';
          hp.el.style.overflowY = 'auto';
        } else {
          hp.el.style.height    = '';
          hp.el.style.maxHeight = '';
          hp.el.style.overflowY = '';
        }
        curY += celda + gapBetween;
      });
    }

    // Posicionar las 4 columnas con su ancho fijo (o las 2 del fallback)
    // v7.120 — En NIVEL 0 las laterales están en display:none (purgadas).
    // No las posicionamos: medirían scrollHeight=0 y descuadrarían. El
    // coverflow de nivel 1 las acomoda por su cuenta cuando se entra a niv-1.
    if(!_ES_NIVEL0){
      if(fourCols){
        positionCol(pColA, colA_X, COL_W, true);
        positionCol(pColB, colB_X, COL_W, true);
        positionCol(pColC, colC_X, COL_W, false);
        positionCol(pColD, colD_X, COL_W, false);
      } else {
        positionCol(pColA, leftX,  leftW,  true);
        positionCol(pColC, rightX, rightW, false);
      }
    }

    // ══════════════════════════════════════════
    //  TRACK STOPS — render dinámico de los hexes del track
    // ══════════════════════════════════════════
    var stopsEl = document.getElementById('_hud-track-stops');
    if(stopsEl && pTrack){
      var xpInfo = (typeof _calcXPNivel==='function') ? _calcXPNivel() : { nivel:1 };
      var n = xpInfo.nivel;
      var stops = [n+1, n+2, n+3];
      var html = '';
      stops.forEach(function(lvl, idx){
        // Línea entre stops
        if(idx>0){
          html += '<div style="width:24px;height:1px;background:linear-gradient(90deg,rgba(167,139,250,0.30),rgba(167,139,250,0.10));position:relative">'+
            '<div style="position:absolute;top:50%;right:-2px;width:5px;height:5px;border-radius:50%;background:#A78BFA;transform:translateY(-50%);box-shadow:0 0 6px #A78BFA"></div>'+
          '</div>';
        } else {
          html += '<div style="width:18px;height:1px;background:linear-gradient(90deg,rgba(167,139,250,0.40),rgba(167,139,250,0.20))"></div>';
        }
        html += '<div style="display:flex;flex-direction:column;align-items:center;gap:2px">'+
          '<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;'+
            'background:rgba(167,139,250,0.06);border:1px solid rgba(167,139,250,0.30);'+
            'clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);'+
            'box-shadow:0 0 8px rgba(167,139,250,0.18)">'+
            '<span style="font-size:11px;font-weight:800;color:rgba(220,220,240,0.75)">'+lvl+'</span>'+
          '</div>'+
          '<span style="font-size:8px;font-weight:700;color:rgba(167,139,250,0.60);font-variant-numeric:tabular-nums">+'+(500*(idx+1))+' XP</span>'+
        '</div>';
      });
      stopsEl.innerHTML = html;
    }

    // ════════════════════════════════════════════════════════════════
    // v6.031 — OFFSET DE LA BARRA SUPERIOR
    // El overlay cubre toda la pantalla, pero la barra fija (hero) ocupa
    // los primeros --hero-h px. Sin compensar, los paneles y el dial
    // —centrados respecto al viewport completo— quedan parcialmente bajo
    // la barra y dejan hueco abajo. Aquí se desplaza TODO el HUD hacia
    // abajo la mitad del alto de la barra: así el conjunto queda centrado
    // en el espacio realmente visible (bajo la barra). Solo en modo
    // normal — el modo expandido tiene su propia lógica de layout.
    if(!window._hudExpanded){
      var _heroH = 58;
      var _heroEl = document.getElementById('hero');
      if(_heroEl){ _heroH = _heroEl.getBoundingClientRect().height || 58; }
      var _shift = Math.round(_heroH / 2);
      // ── v7.118 — FIX cards que se hunden al reposicionar repetidamente ──
      // CAUSA RAÍZ (cazada con datos): este bloque SUMABA _shift al style.top
      // en CADA llamada a _reposicionarHUD. Los paneles cuya rama no reescribe
      // el top fresco conservaban el top ya shifteado y recibían el shift OTRA
      // VEZ → acumulación 133→822→1046 (29px por pasada). Cualquier doble
      // reposicionamiento (warp/resize) las hundía.
      // SOLUCIÓN: idempotencia real. Recordamos cuánto shift le aplicamos a
      // cada elemento (_shiftAplicado). Antes de aplicar el nuevo, DESCONTAMOS
      // el anterior, dejando el top en su base limpio, y luego sumamos el
      // shift actual. Reposicionar N veces da el mismo resultado.
      function _aplicarShift(el){
        if(!el || !el.style.top || el.style.top === '-9999px') return;
        var actual = parseFloat(el.style.top);
        // Si el top actual NO coincide con el último valor que dejamos
        // (base+shift), significa que getTop/positionCol lo reescribió FRESCO
        // en esta pasada → su shift previo ya no aplica; partimos de 0.
        var prev = (el._shiftFinal != null && Math.abs(actual - el._shiftFinal) < 0.5)
                   ? (el._shiftAplicado || 0)   // sigue siendo nuestro valor
                   : 0;                          // top fresco: sin shift previo
        var base = actual - prev;
        var fin  = base + _shift;
        el.style.top = fin + 'px';
        el._shiftAplicado = _shift;
        el._shiftFinal = fin;   // recordar lo que dejamos, para la próxima
      }
      if(_shift > 0){
        _aplicarShift(_dialCanvas);
        window._hudPanels.forEach(function(hp){ _aplicarShift(hp.el); });
      }
    }

    // v5.197: en vez de que el DnD hookee esta función (lo que congelaba
    // referencias viejas), es el reposicionador quien avisa al DnD que
    // reconstruya sus slots vacíos. El DnD expone _overlayDnd.rebuild.
    if(window._overlayDnd && typeof window._overlayDnd.rebuild === 'function'){
      requestAnimationFrame(function(){ window._overlayDnd.rebuild(); });
    }
  }
  window._reposicionarHUD = _reposicionarHUD;

  _dialOverlay.appendChild(_dialCanvas);
  // v5.134: insertar el _dialOverlay ANTES del primer panel flotante en
  // document.body, NO al final. Razón: cuando +Nueva destruye y recrea
  // el overlay, hacer appendChild lo deja DESPUÉS de los paneles en
  // orden DOM. Aunque z-index del overlay (9000) es menor que el de los
  // paneles (9001), backdrop-filter del overlay crea un stacking context
  // independiente que combinado con el orden DOM termina capturando
  // los clicks que deberían llegar a los paneles. Resultado: clicks en
  // las cards no funcionan. Insertando ANTES, los paneles quedan después
  // en orden DOM y ganan tanto por z-index como por orden DOM.
  var primerPanel = null;
  for(var pi = 0; pi < _hudPanels.length; pi++){
    if(_hudPanels[pi] && _hudPanels[pi].el && _hudPanels[pi].el.parentNode === document.body){
      primerPanel = _hudPanels[pi].el;
      break;
    }
  }
  if(primerPanel){
    document.body.insertBefore(_dialOverlay, primerPanel);
  } else {
    document.body.appendChild(_dialOverlay);
  }

  window._hudPanels = _hudPanels;

  // ══════════════════════════════════════════════════════════════════════
  //  EXPANSOR — un panel a la vez ocupa el centro (donde estaba el dial).
  //  El dial baja a la zona inferior achicado; los 3 paneles bottom
  //  (Misión/Logro/Nivel) se mueven a los lados para hacer espacio.
  //  Click en el dial chico → todo regresa al estado normal.
  //  Mecánica P-Ca: si hay otro panel expandido, se contrae al hacer
  //  click en uno nuevo (intercambio directo).
  // ══════════════════════════════════════════════════════════════════════
  window._hudExpanded = null; // panel actualmente expandido (DOM element) o null

  function _animarSuave(el, props){
    // Aplica un set de propiedades CSS con transición suave.
    // Mismo easing que los anillos del dial: cubic-bezier(.4,1.4,.5,1).
    Object.keys(props).forEach(function(k){ el.style[k] = props[k]; });
  }

  // Helper para renderizar Necesidades dentro de containers del overlay
  // (versión simplificada que dibuja el radar + lista de niveles con barras).
  function _hudRenderNecesidadesEn(niveles, radarEl, listaEl){
    if(!niveles || !niveles.length){
      if(radarEl) radarEl.innerHTML = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px">Sin registros con necesidad asignada</div>';
      return;
    }
    // Keys reales: '1'..'5' (numéricos como string) — coinciden con getNecesidades del GAS
    var NIVELES_CFG = [
      { key:'1', label:'Fisiológicas',    color:'#EF4444', desc:'Salud, alimento, descanso, agua' },
      { key:'2', label:'Seguridad',       color:'#F59E0B', desc:'Estabilidad, recursos, protección' },
      { key:'3', label:'Afiliación',      color:'#22D3EE', desc:'Vínculos, amistad, pertenencia' },
      { key:'4', label:'Reconocimiento',  color:'#A855F7', desc:'Logros, autoestima, respeto' },
      { key:'5', label:'Autorrealización',color:'#4ADE80', desc:'Propósito, crecimiento, creatividad' },
    ];
    function _dataDe(key){
      var n = niveles.find(function(nv){ return String(nv.key) === String(key); });
      return n || { total: 0, registros: 0 };
    }
    var totalAll = NIVELES_CFG.reduce(function(s,c){
      return s + Math.abs(_dataDe(c.key).total || 0);
    }, 0);

    // ── RADAR (lado izquierdo) ──
    if(radarEl){
      var W = 300, H = 280, CX = W/2, CY = H/2 + 10, R = 96;
      // v5.143: normalizar por el VALOR MÁXIMO entre niveles, no por el
      // total. Así el nivel más grande llega al borde del radar y los
      // demás se escalan proporcionalmente. Igual que renderNecesidadesInline
      // en HOME. Antes con totalAll, si los niveles eran similares (~33%
      // cada uno), el polígono quedaba chiquito.
      var maxVal = 0;
      NIVELES_CFG.forEach(function(c){
        var v = Math.abs(_dataDe(c.key).total || 0);
        if(v > maxVal) maxVal = v;
      });
      var pts = NIVELES_CFG.map(function(c, i){
        var d = _dataDe(c.key);
        var abs = Math.abs(d.total || 0);
        var pctNorm = maxVal > 0 ? abs/maxVal : 0; // 0..1 relativo al máximo
        var pctTotal = totalAll > 0 ? abs/totalAll : 0; // % real del total (para tooltip/etiqueta)
        // Pequeño boost visual cuando hay datos pero el valor es muy bajo respecto al máximo
        var pctVisual = abs > 0 ? Math.max(0.06, pctNorm) : 0;
        var ang = -Math.PI/2 + (Math.PI*2*i)/NIVELES_CFG.length;
        return {
          x: CX + Math.cos(ang) * R * pctVisual,
          y: CY + Math.sin(ang) * R * pctVisual,
          ax: CX + Math.cos(ang) * R,
          ay: CY + Math.sin(ang) * R,
          label: c.label,
          color: c.color,
          pct: Math.round(pctTotal*100),
        };
      });
      var grid = '';
      [0.25, 0.5, 0.75, 1].forEach(function(r){
        var poly = NIVELES_CFG.map(function(c,i){
          var ang = -Math.PI/2 + (Math.PI*2*i)/NIVELES_CFG.length;
          return (CX + Math.cos(ang)*R*r) + ',' + (CY + Math.sin(ang)*R*r);
        }).join(' ');
        grid += '<polygon points="'+poly+'" fill="none" stroke="rgba(168,85,247,0.20)" stroke-width="1"/>';
      });
      var spokes = pts.map(function(p){
        return '<line x1="'+CX+'" y1="'+CY+'" x2="'+p.ax+'" y2="'+p.ay+'" stroke="rgba(168,85,247,0.20)" stroke-width="1"/>';
      }).join('');
      var dataPoly = pts.map(function(p){ return p.x + ',' + p.y; }).join(' ');
      var pointDots = pts.map(function(p){
        return '<circle cx="'+p.x+'" cy="'+p.y+'" r="4" fill="'+p.color+'" style="filter:drop-shadow(0 0 3px '+p.color+')"/>';
      }).join('');
      var labels = pts.map(function(p, i){
        var ang = -Math.PI/2 + (Math.PI*2*i)/NIVELES_CFG.length;
        var lx = CX + Math.cos(ang) * (R + 30);
        var ly = CY + Math.sin(ang) * (R + 22);
        var anchor = Math.abs(Math.cos(ang)) < 0.3 ? 'middle' : (Math.cos(ang) > 0 ? 'start' : 'end');
        return '<text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" fill="'+p.color+'" font-size="11" font-weight="700" text-anchor="'+anchor+'" dominant-baseline="middle" style="filter:drop-shadow(0 0 4px '+p.color+'88)">'+p.label+'</text>';
      }).join('');
      radarEl.innerHTML =
        '<div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:8px;text-align:center">RADAR</div>'+
        '<svg viewBox="0 0 '+W+' '+H+'" style="width:100%;max-width:380px;display:block;margin:0 auto">'+
          grid + spokes +
          '<polygon points="'+dataPoly+'" fill="rgba(168,85,247,0.22)" stroke="#A855F7" stroke-width="1.8" style="filter:drop-shadow(0 0 6px rgba(168,85,247,0.55))"/>'+
          pointDots + labels +
        '</svg>';
    }

    // ── DISTRIBUCIÓN: barras horizontales proporcionales al % real ──
    if(listaEl){
      // v5.141: orden INVERTIDO (Autorrealización arriba, Fisiológicas abajo).
      // Barras centradas crecen del centro hacia ambos lados — cada barra ocupa
      // pct% del track total, dividido en pct/2 a cada lado del centro.
      var ordenInvertido = NIVELES_CFG.slice().reverse();
      var pyrHTML =
        '<div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:8px;text-align:center">DISTRIBUCIÓN</div>'+
        '<div style="display:flex;flex-direction:column;gap:6px;width:100%">';
      ordenInvertido.forEach(function(c){
        var d = _dataDe(c.key);
        var abs = Math.abs(d.total || 0);
        var pct = totalAll > 0 ? (abs/totalAll)*100 : 0;
        var pctRound = Math.round(pct);
        var op = abs > 0 ? 1 : 0.35;
        pyrHTML +=
          '<div style="display:flex;align-items:center;gap:8px;opacity:'+op+'">'+
            '<div style="flex:0 0 105px;font-size:10px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+c.label+'</div>'+
            // Track con barra centrada: el fill ocupa pct% del track, centrado horizontalmente
            '<div style="flex:1;position:relative;height:20px;background:rgba(255,255,255,0.04);border:1px solid '+c.color+'30;border-radius:4px;overflow:hidden;min-width:0">'+
              // Fill centrado: left = (100-pct)/2, width = pct
              '<div style="position:absolute;left:'+((100-pct)/2).toFixed(2)+'%;top:0;bottom:0;width:'+pct.toFixed(2)+'%;'+
                'background:linear-gradient(90deg,'+c.color+'dd,'+c.color+','+c.color+'dd);'+
                'box-shadow:0 0 6px '+c.color+'66;border-radius:3px"></div>'+
              // Línea de referencia central tenue
              '<div style="position:absolute;left:50%;top:2px;bottom:2px;width:1px;background:rgba(255,255,255,0.10);pointer-events:none"></div>'+
            '</div>'+
            '<div style="flex:0 0 38px;font-size:10px;font-weight:800;color:'+c.color+';font-family:JetBrains Mono,monospace;text-align:right">'+pctRound+'%</div>'+
          '</div>';
      });
      pyrHTML += '</div>';

      // Lista detallada (ordenada por monto desc, igual que image 2)
      var ordenados = NIVELES_CFG.slice().sort(function(a,b){
        return Math.abs(_dataDe(b.key).total||0) - Math.abs(_dataDe(a.key).total||0);
      });
      var listaHTML =
        '<div style="margin-top:14px;display:flex;flex-direction:column;gap:8px">';
      ordenados.forEach(function(c){
        var d = _dataDe(c.key);
        var abs = Math.abs(d.total || 0);
        var pct = totalAll > 0 ? Math.round((abs/totalAll)*100) : 0;
        // Estado: descuidado (0%), ok (<25%), alto (>=25%)
        var estado, estadoColor, estadoBg, estadoIcon;
        if(abs === 0){
          estado = 'descuidado'; estadoColor = '#F59E0B'; estadoBg = 'rgba(245,158,11,0.12)'; estadoIcon = 'fa-triangle-exclamation';
        } else if(pct < 25){
          estado = 'ok'; estadoColor = '#4ADE80'; estadoBg = 'rgba(74,222,128,0.12)'; estadoIcon = 'fa-circle-check';
        } else {
          estado = 'alto'; estadoColor = '#EF4444'; estadoBg = 'rgba(239,68,68,0.12)'; estadoIcon = 'fa-triangle-exclamation';
        }
        listaHTML +=
          '<div style="display:flex;align-items:center;gap:10px;padding:9px 11px;border:1px solid '+c.color+'40;border-radius:9px;background:'+c.color+'08;flex-wrap:wrap">'+
            // Icon block
            '<div style="width:28px;height:28px;border-radius:7px;background:'+c.color+'1a;border:1px solid '+c.color+'55;display:flex;align-items:center;justify-content:center;flex-shrink:0">'+
              '<i class="fas fa-square" style="color:'+c.color+';font-size:9px"></i>'+
            '</div>'+
            // Label + desc
            '<div style="flex:0 0 130px;min-width:0">'+
              '<div style="display:flex;align-items:center;gap:6px"><span style="font-size:11px;font-weight:800;color:#fff">'+c.label+'</span>'+
                '<span style="font-size:8px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:'+estadoColor+';background:'+estadoBg+';padding:1px 6px;border-radius:999px;display:inline-flex;align-items:center;gap:3px"><i class="fas '+estadoIcon+'" style="font-size:7px"></i>'+estado+'</span>'+
              '</div>'+
              '<div style="font-size:9px;color:rgba(220,224,235,0.45);margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+c.desc+'</div>'+
            '</div>'+
            // Barra
            '<div style="flex:1;min-width:60px;height:8px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden">'+
              '<div style="width:'+Math.max(1,pct)+'%;height:100%;background:linear-gradient(90deg,'+c.color+'cc,'+c.color+');box-shadow:0 0 6px '+c.color+'88;border-radius:999px"></div>'+
            '</div>'+
            // %
            '<div style="font-size:11px;font-weight:800;color:'+c.color+';font-family:JetBrains Mono,monospace;flex:0 0 36px;text-align:right;white-space:nowrap">'+pct+'%</div>'+
            // Monto
            '<div style="font-size:12px;font-weight:800;color:'+c.color+';font-family:JetBrains Mono,monospace;flex:0 0 88px;text-align:right;white-space:nowrap">$ '+abs.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})+'</div>'+
            // v5.149: Conceptos del nivel (vienen del backend como d.conceptos)
            (d.conceptos && d.conceptos.length ? '<div style="flex:1 1 100%;margin-top:6px;padding-top:6px;border-top:1px dashed '+c.color+'40;display:flex;flex-wrap:wrap;gap:4px">'+
              '<span style="font-size:8px;font-weight:700;color:rgba(220,224,235,0.45);letter-spacing:.08em;text-transform:uppercase;margin-right:4px;align-self:center">Conceptos:</span>'+
              d.conceptos.map(function(cn){ return '<span style="font-size:9px;padding:2px 7px;border-radius:999px;background:'+c.color+'14;border:1px solid '+c.color+'33;color:'+c.color+';font-weight:600">'+cn+'</span>'; }).join('')+
            '</div>' : '')+
          '</div>';
      });
      listaHTML += '</div>';
      // Total invertido al pie
      listaHTML +=
        '<div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center">'+
          '<span style="font-size:10px;color:rgba(220,224,235,0.55);display:flex;align-items:center;gap:5px"><i class="fas fa-circle-info" style="font-size:9px"></i>Los porcentajes reflejan la distribución relativa</span>'+
          '<span style="font-size:11px;font-weight:700;color:rgba(220,224,235,0.85);font-family:JetBrains Mono,monospace">Total invertido <span style="color:#A855F7;margin-left:8px">$ '+totalAll.toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2})+'</span></span>'+
        '</div>';

      listaEl.innerHTML = pyrHTML + listaHTML;
    }
  }


  // de hidratación que rellena los datos. Se ejecuta cada vez que se expande
  // (no solo la primera) para que los datos siempre reflejen lo último.
  var _EXPAND_CONFIG = {
    // ── PATRIMONIO ──
    'hud-patrimonio': {
      html: function(){
        return ''+
        '<div style="display:flex;flex-direction:column;gap:14px;padding:0">'+
          // ── HEADER (sin tabs ni chip decorativo) ──
          '<div style="display:flex;align-items:center;gap:10px">'+
            '<div style="width:34px;height:34px;border-radius:8px;background:rgba(34,197,94,0.12);border:1px solid rgba(34,197,94,0.40);display:flex;align-items:center;justify-content:center;box-shadow:0 0 12px rgba(34,197,94,0.20)">'+
              '<i class="fas fa-landmark" style="color:#22C55E;font-size:15px"></i>'+
            '</div>'+
            '<div style="font-size:15px;font-weight:800;letter-spacing:.10em;color:#fff;text-shadow:0 0 8px rgba(34,197,94,0.30)">CENTRO PATRIMONIAL</div>'+
          '</div>'+
          // ── 5 cards top con sparkline + delta ──
          '<div id="pat-cards-row" style="display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr 1.1fr;gap:10px"></div>'+
          // ── Banda Bruto = Disponible + Apartados ──
          '<div id="pat-banda" style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr;gap:12px;align-items:center;padding:14px 16px;border:1px solid rgba(34,197,94,0.18);border-radius:10px;background:rgba(34,197,94,0.03)"></div>'+
          // ── Saldos y Cuentas + Distribución de Fondos ──
          '<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px">'+
            '<div id="pat-saldos" style="padding:12px;border:1px solid rgba(34,197,94,0.18);border-radius:10px;background:rgba(34,197,94,0.03)"></div>'+
            '<div id="pat-distribucion" style="padding:12px;border:1px solid rgba(34,197,94,0.18);border-radius:10px;background:rgba(34,197,94,0.03);display:flex;flex-direction:column"></div>'+
          '</div>'+
          // ── Apartados (full width, todos los apartados activos) ──
          '<div id="pat-apartados" style="padding:12px;border:1px solid rgba(34,197,94,0.18);border-radius:10px;background:rgba(34,197,94,0.03)"></div>'+
        '</div>';
      },
      hydrate: function(){
        var data = window._patrimonioData || {};
        if(!data.ok && typeof api !== 'undefined' && api.getPatrimonio){
          api.getPatrimonio().then(function(d){
            window._patrimonioData = d;
            var cfg = window._EXPAND_CONFIG && window._EXPAND_CONFIG['hud-patrimonio'];
            if(cfg && document.getElementById('pat-cards-row')) cfg.hydrate();
          }).catch(function(){});
        }
        var banco = data.banco || {saldo:0, items:[]};
        var fisico = data.fisico || {saldo:0, items:[]};
        var inv = data.inversion || {saldo:0, items:[]};
        var fondo = data.fondo || {};
        var total = data.total || 0;
        // Apartados
        var apartados = window._apartadosData || [];
        var totalAp = apartados.filter(function(a){ return !(a.estado&&a.estado.toLowerCase()==='usado'); })
                               .reduce(function(s,a){ return s + (a.monto||0); }, 0);
        var totalDisp = total - totalAp;

        var fmt = function(v){ return '$ '+Math.abs(v||0).toLocaleString('es-MX',{minimumFractionDigits:0}); };
        var fmt2 = function(v){ return '$ '+Math.abs(v||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); };
        function _spark(color, seed){
          var pts = []; for(var i=0;i<10;i++){ pts.push((i*8)+','+(22-((Math.sin(i*0.7+seed)+1)/2*16)).toFixed(1)); }
          return '<svg viewBox="0 0 80 24" preserveAspectRatio="none" style="width:100%;height:34px;margin-top:4px"><polyline points="'+pts.join(' ')+'" fill="none" stroke="'+color+'" stroke-width="1.4" stroke-linecap="round" style="filter:drop-shadow(0 0 3px '+color+'80)"/></svg>';
        }
        function _card(label, value, color, delta, deltaSign){
          return '<div style="padding:11px 13px;border:1px solid '+color+'40;border-radius:10px;background:'+color+'08;position:relative;overflow:hidden">'+
            '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:'+color+';box-shadow:0 0 8px '+color+';opacity:.7"></div>'+
            '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:'+color+';margin-bottom:6px;opacity:.85">'+label+'</div>'+
            '<div style="font-size:17px;font-weight:800;color:'+color+';font-family:JetBrains Mono,monospace;line-height:1;text-shadow:0 0 10px '+color+'40;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+value+'</div>'+
            _spark(color, color.charCodeAt(1))+
            (delta!==undefined ? '<div style="font-size:9px;color:'+(deltaSign>=0?'#4ADE80':'#EF4444')+';margin-top:2px;font-weight:700">'+(deltaSign>=0?'+':'')+delta+'% vs ayer</div>' : '')+
          '</div>';
        }
        // 5 cards
        var fondoPct = fondo.avance||0;
        var fondoMeta = fondo.meta||0;
        document.getElementById('pat-cards-row').innerHTML =
          _card('Disponible Hoy', fmt2(totalDisp), '#22C55E', 3.2, 1)+
          _card('Banco',           fmt2(banco.saldo),  '#4ADE80', 1.8, 1)+
          _card('Efectivo',        fmt2(fisico.saldo), '#FBBF24', 0.0, 0)+
          _card('Apartados',       fmt2(totalAp),      '#F59E0B', -0.4, -1)+
          '<div style="padding:11px 13px;border:1px solid rgba(34,197,94,0.40);border-radius:10px;background:rgba(34,197,94,0.06);position:relative;overflow:hidden">'+
            '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:#22C55E;box-shadow:0 0 8px #22C55E;opacity:.7"></div>'+
            '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#22C55E;margin-bottom:6px;opacity:.85">Fondo de Emergencia</div>'+
            '<div style="font-size:17px;font-weight:800;color:#22C55E;font-family:JetBrains Mono,monospace;line-height:1">'+fondoPct+'%</div>'+
            '<div style="height:4px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;margin-top:8px"><div style="width:'+Math.min(100,fondoPct)+'%;height:100%;background:linear-gradient(90deg,#22C55E,#4ADE80);box-shadow:0 0 6px #22C55E;border-radius:999px"></div></div>'+
            (fondoMeta>0 ? '<div style="font-size:9px;color:rgba(220,224,235,0.55);margin-top:3px">Meta <span style="color:#fff;font-family:JetBrains Mono,monospace;font-weight:700">'+fmt(fondoMeta)+'</span></div>' : '')+
          '</div>';

        // Banda
        var pctApart = total>0 ? Math.round((totalAp/total)*100) : 0;
        document.getElementById('pat-banda').innerHTML =
          '<div style="display:flex;align-items:center;gap:10px">'+
            '<div style="width:30px;height:30px;border-radius:7px;background:rgba(34,197,94,0.14);border:1px solid rgba(34,197,94,0.40);display:flex;align-items:center;justify-content:center"><i class="fas fa-coins" style="color:#22C55E;font-size:13px"></i></div>'+
            '<div><div style="font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55)">Patrimonio Bruto</div>'+
              '<div style="font-size:18px;font-weight:800;color:#fff;font-family:JetBrains Mono,monospace;white-space:nowrap">'+fmt2(total)+'</div>'+
              '<div style="font-size:9px;color:rgba(220,224,235,0.45)">Activos totales</div></div>'+
          '</div>'+
          '<div style="color:rgba(220,224,235,0.30);font-size:18px;font-weight:300">−</div>'+
          '<div style="display:flex;align-items:center;gap:10px">'+
            '<div style="width:30px;height:30px;border-radius:7px;background:rgba(74,222,128,0.14);border:1px solid rgba(74,222,128,0.40);display:flex;align-items:center;justify-content:center"><i class="fas fa-wallet" style="color:#4ADE80;font-size:13px"></i></div>'+
            '<div><div style="font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55)">Disponible Total</div>'+
              '<div style="font-size:18px;font-weight:800;color:#4ADE80;font-family:JetBrains Mono,monospace;white-space:nowrap">'+fmt2(totalDisp)+'</div>'+
              '<div style="font-size:9px;color:rgba(220,224,235,0.45)">Liquidez inmediata</div></div>'+
          '</div>'+
          '<div style="color:rgba(220,224,235,0.30);font-size:18px;font-weight:300">=</div>'+
          '<div style="display:flex;align-items:center;gap:10px;justify-content:flex-end">'+
            '<div style="text-align:right"><div style="font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55)">Apartados / Objetivos</div>'+
              '<div style="font-size:18px;font-weight:800;color:#F59E0B;font-family:JetBrains Mono,monospace;white-space:nowrap">'+fmt2(totalAp)+' <span style="color:rgba(220,224,235,0.45);font-size:13px;font-weight:600">· '+pctApart+'%</span></div>'+
              '<div style="font-size:9px;color:rgba(220,224,235,0.45)">Asignado a metas · '+pctApart+'% del patrimonio bruto</div></div>'+
            '<div style="width:30px;height:30px;border-radius:7px;background:rgba(245,158,11,0.14);border:1px solid rgba(245,158,11,0.40);display:flex;align-items:center;justify-content:center"><i class="fas fa-lock" style="color:#F59E0B;font-size:13px"></i></div>'+
          '</div>';

        // ── Saldos y Cuentas: TODOS los fijos reales, con apartados por banco ──
        // v5.149: usa la misma lógica que renderPatrimonio de HOME.
        // Cada banco muestra: saldo bruto, apartados de ese banco, disponible neto.
        (function(){
          var fijosReales = window._fijosData || [];
          var fijosVisibles = fijosReales.filter(function(fi){ return fi.nombre !== 'P'; });
          var pFila = fijosReales.find(function(fi){ return fi.nombre === 'P'; });

          // Apartados por banco (igual que HOME)
          var apartadosArr = window._apartadosData || [];
          var apPorBanco = {};
          var totalApActivos = 0;
          apartadosArr.forEach(function(ap){
            if(ap.estado && ap.estado.toLowerCase()==='usado') return;
            var b = (ap.banco||'').trim().toUpperCase();
            apPorBanco[b] = (apPorBanco[b]||0) + (ap.monto||0);
            totalApActivos += (ap.monto||0);
          });

          var rows = fijosVisibles.map(function(fi){
            var bancKey = (fi.nombre||'').trim().toUpperCase();
            var apBanco = apPorBanco[bancKey] || 0;
            var dispBanco = (fi.monto||0) - apBanco;
            var col = (fi.monto||0) >= 0 ? '#4ADE80' : '#EF4444';
            return '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">'+
              '<td style="padding:8px 6px">'+
                '<div style="display:flex;align-items:center;gap:8px">'+
                  '<div style="width:26px;height:26px;border-radius:6px;background:'+col+'1a;border:1px solid '+col+'55;display:flex;align-items:center;justify-content:center"><i class="fas fa-building-columns" style="color:'+col+';font-size:10px"></i></div>'+
                  '<div><div style="font-size:11px;font-weight:800;color:#fff">'+fi.nombre+'</div></div>'+
                '</div>'+
              '</td>'+
              '<td style="padding:8px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:'+col+';white-space:nowrap">'+fmt2(fi.monto)+'</td>'+
              '<td style="padding:8px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:'+(apBanco>0?'#F59E0B':'rgba(220,224,235,0.35)')+';white-space:nowrap">'+(apBanco>0?'-':'')+fmt(apBanco)+'</td>'+
              '<td style="padding:8px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:12px;font-weight:800;color:#4ADE80;white-space:nowrap">'+fmt2(dispBanco)+'</td>'+
            '</tr>';
          }).join('');

          // Fila P* (excluida del total, pero visible como indicador)
          if(pFila){
            rows += '<tr style="border-top:1px dashed rgba(239,68,68,0.30)">'+
              '<td style="padding:8px 6px">'+
                '<div style="display:flex;align-items:center;gap:8px">'+
                  '<div style="width:26px;height:26px;border-radius:6px;background:rgba(239,68,68,0.10);border:1px solid rgba(239,68,68,0.40);display:flex;align-items:center;justify-content:center"><i class="fas fa-circle-exclamation" style="color:#EF4444;font-size:10px"></i></div>'+
                  '<div><div style="font-size:11px;font-weight:800;color:#fff">P <span style="color:#EF4444">*</span></div><div style="font-size:9px;color:rgba(220,224,235,0.45)">Indicador, excluido del total</div></div>'+
                '</div>'+
              '</td>'+
              '<td style="padding:8px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:#EF4444;white-space:nowrap">'+fmt2(pFila.monto)+'</td>'+
              '<td style="padding:8px 6px;text-align:right;color:rgba(220,224,235,0.30)">—</td>'+
              '<td style="padding:8px 6px;text-align:right;color:rgba(220,224,235,0.30)">—</td>'+
            '</tr>';
          }

          // Total
          var sumDisp = fijosVisibles.reduce(function(s,fi){
            var bancKey = (fi.nombre||'').trim().toUpperCase();
            var apBanco = apPorBanco[bancKey] || 0;
            return s + ((fi.monto||0) - apBanco);
          }, 0);
          var sumBruto = fijosVisibles.reduce(function(s,fi){ return s + (fi.monto||0); }, 0);

          document.getElementById('pat-saldos').innerHTML =
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
              '<div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#22C55E">Saldos por banco</div>'+
              '<div style="font-size:11px;color:rgba(220,224,235,0.55)">'+fijosVisibles.length+' cuentas'+(pFila?' + P*':'')+'</div>'+
            '</div>'+
            '<table style="width:100%;border-collapse:collapse">'+
              '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.08)">'+
                '<th style="padding:6px 6px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:left">Cuenta</th>'+
                '<th style="padding:6px 6px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Saldo bruto</th>'+
                '<th style="padding:6px 6px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Apartados</th>'+
                '<th style="padding:6px 6px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Disponible</th>'+
              '</tr></thead>'+
              '<tbody>'+(rows || '<tr><td colspan="4" style="padding:18px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px">Sin cuentas</td></tr>')+'</tbody>'+
              '<tfoot><tr style="border-top:2px solid rgba(34,197,94,0.30)">'+
                '<td style="padding:10px 6px;font-size:11px;font-weight:800;color:#fff">TOTAL</td>'+
                '<td style="padding:10px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:13px;font-weight:800;color:#fff">'+fmt2(sumBruto)+'</td>'+
                '<td style="padding:10px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:13px;font-weight:800;color:#F59E0B">-'+fmt(totalApActivos)+'</td>'+
                '<td style="padding:10px 6px;text-align:right;font-family:JetBrains Mono,monospace;font-size:14px;font-weight:800;color:#4ADE80">'+fmt2(sumDisp)+'</td>'+
              '</tr></tfoot>'+
            '</table>';
        })();

        // ── Distribución de Fondos REAL (v5.149) ──
        // Misma lógica de HOME: cada banco con su disponible + apartados.
        // P* mostrado como indicador SEPARADO (no se mezcla con distribución).
        (function(){
          var fijosReales = window._fijosData || [];
          var fijosVisibles = fijosReales.filter(function(fi){ return fi.nombre !== 'P'; });
          var pFila = fijosReales.find(function(fi){ return fi.nombre === 'P'; });

          var apartadosArr = window._apartadosData || [];
          var apPorBanco = {};
          var totalApActivos = 0;
          apartadosArr.forEach(function(ap){
            if(ap.estado && ap.estado.toLowerCase()==='usado') return;
            var b = (ap.banco||'').trim().toUpperCase();
            apPorBanco[b] = (apPorBanco[b]||0) + (ap.monto||0);
            totalApActivos += (ap.monto||0);
          });

          var sumBruto = fijosVisibles.reduce(function(s,fi){ return s + Math.max(0, fi.monto||0); }, 0);

          if(sumBruto <= 0){
            document.getElementById('pat-distribucion').innerHTML = '<div style="color:rgba(220,224,235,0.40);text-align:center;padding:24px">Sin datos</div>';
            return;
          }

          // Paletas por banco
          var paleta = ['#4ADE80','#22D3EE','#A78BFA','#FBBF24','#F472B6','#86EFAC','#67E8F9'];

          // Barra apilada: cada banco (parte disponible) + apartados de ese banco
          var barraHTML = '<div style="display:flex;height:14px;border-radius:7px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);margin-bottom:10px">';
          fijosVisibles.forEach(function(fi, i){
            var color = paleta[i % paleta.length];
            var bancKey = (fi.nombre||'').trim().toUpperCase();
            var apBanco = apPorBanco[bancKey] || 0;
            var dispBanco = Math.max(0, (fi.monto||0) - apBanco);
            var pctDisp = (dispBanco/sumBruto)*100;
            var pctAp = (apBanco/sumBruto)*100;
            if(pctDisp > 0){
              barraHTML += '<div title="'+fi.nombre+' disponible" style="width:'+pctDisp.toFixed(2)+'%;background:'+color+';box-shadow:0 0 4px '+color+'80 inset"></div>';
            }
            if(pctAp > 0){
              barraHTML += '<div title="'+fi.nombre+' apartados" style="width:'+pctAp.toFixed(2)+'%;background:'+color+'66;border-left:1px dashed rgba(255,255,255,0.20)"></div>';
            }
          });
          barraHTML += '</div>';

          // Lista por banco
          var listaHTML = fijosVisibles.map(function(fi, i){
            var color = paleta[i % paleta.length];
            var bancKey = (fi.nombre||'').trim().toUpperCase();
            var apBanco = apPorBanco[bancKey] || 0;
            var dispBanco = (fi.monto||0) - apBanco;
            var pct = sumBruto > 0 ? Math.round(((fi.monto||0)/sumBruto)*100) : 0;
            return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,0.04)">'+
              '<span style="display:flex;align-items:center;gap:6px;color:rgba(220,224,235,0.85);font-weight:700"><span style="width:9px;height:9px;border-radius:2px;background:'+color+';box-shadow:0 0 4px '+color+'"></span>'+fi.nombre+'</span>'+
              '<span style="display:flex;align-items:center;gap:10px">'+
                '<span style="color:rgba(220,224,235,0.55);font-family:JetBrains Mono,monospace">'+pct+'%</span>'+
                '<span style="color:'+color+';font-weight:800;font-family:JetBrains Mono,monospace;white-space:nowrap;min-width:90px;text-align:right">'+fmt2(fi.monto)+'</span>'+
              '</span>'+
            '</div>';
          }).join('');

          // P* como indicador SEPARADO (no se mezcla en distribución)
          var pHTML = '';
          if(pFila){
            pHTML = '<div style="margin-top:10px;padding:10px 12px;border:1px dashed rgba(239,68,68,0.40);border-radius:8px;background:rgba(239,68,68,0.04)">'+
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">'+
                '<div style="display:flex;align-items:center;gap:8px">'+
                  '<i class="fas fa-circle-exclamation" style="color:#EF4444;font-size:11px"></i>'+
                  '<div>'+
                    '<div style="font-size:11px;font-weight:800;color:#fff">P <span style="color:#EF4444">*</span></div>'+
                    '<div style="font-size:9px;color:rgba(220,224,235,0.45)">Indicador, NO afecta el total</div>'+
                  '</div>'+
                '</div>'+
                '<span style="font-size:13px;font-weight:800;color:#EF4444;font-family:JetBrains Mono,monospace">'+fmt2(pFila.monto)+'</span>'+
              '</div>'+
            '</div>';
          }

          document.getElementById('pat-distribucion').innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#22C55E;margin-bottom:10px">Distribución por cuenta</div>'+
            barraHTML +
            '<div style="display:flex;flex-direction:column">'+listaHTML+'</div>'+
            pHTML;
        })();

        // Apartados y Objetivos: TODOS los apartados activos (v5.147)
        (function(){
          var activos = apartados.filter(function(a){ return !(a.estado&&a.estado.toLowerCase()==='usado'); });
          var hoy = new Date(); hoy.setHours(0,0,0,0);
          var cards = activos.map(function(ap){
            var pct = ap.meta && ap.monto ? Math.min(100, Math.round((ap.monto/(ap.metaMonto||ap.monto))*100)) : 66;
            var metaStr = 'Sin meta';
            if(ap.meta){
              var diff = Math.floor((new Date(ap.meta)-hoy)/86400000);
              metaStr = diff < 0 ? 'Vencido' : diff===0 ? 'Hoy' : 'en '+diff+' días';
            }
            var vencidoBadge = (ap.meta && new Date(ap.meta) < hoy) ? '<span style="font-size:8px;font-weight:800;padding:1px 6px;background:rgba(239,68,68,0.15);border:1px solid rgba(239,68,68,0.40);border-radius:4px;color:#EF4444;letter-spacing:.06em;text-transform:uppercase">Vencido</span>' : '';
            return '<div style="padding:11px;border:1px solid rgba(34,197,94,0.30);border-radius:9px;background:rgba(34,197,94,0.04)">'+
              '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">'+
                '<div style="width:26px;height:26px;border-radius:6px;background:rgba(245,158,11,0.14);border:1px solid rgba(245,158,11,0.40);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fas fa-coins" style="color:#F59E0B;font-size:11px"></i></div>'+
                '<div style="flex:1;min-width:0">'+
                  '<div style="font-size:11px;font-weight:800;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(ap.nombre||'')+'</div>'+
                  '<div style="font-size:9px;color:rgba(220,224,235,0.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(ap.banco||'')+(ap.categoria?' · '+ap.categoria:'')+' · '+metaStr+'</div>'+
                '</div>'+
              '</div>'+
              '<div style="font-size:16px;font-weight:800;color:#fff;font-family:JetBrains Mono,monospace;white-space:nowrap;margin-bottom:6px">'+fmt2(ap.monto)+'</div>'+
              '<div style="height:5px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;margin-bottom:6px"><div style="width:'+pct+'%;height:100%;background:linear-gradient(90deg,#F59E0B,#FBBF24);box-shadow:0 0 6px #F59E0B;border-radius:999px"></div></div>'+
              '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-size:9px;color:rgba(220,224,235,0.55)">Meta '+fmt(ap.metaMonto||ap.monto)+'</span><span style="font-size:10px;font-weight:800;color:#FBBF24;font-family:JetBrains Mono,monospace">'+pct+'%</span></div>'+
              '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px">'+vencidoBadge+'<button onclick="if(typeof _marcarApartadoUsado===\'function\')_marcarApartadoUsado('+ap.fila+')" style="padding:3px 10px;background:rgba(74,222,128,0.10);border:1px solid rgba(74,222,128,0.40);border-radius:6px;font-size:9px;font-weight:800;color:#4ADE80;cursor:pointer;letter-spacing:.04em">Usar ✓</button></div>'+
            '</div>';
          }).join('');
          var nuevo = ''; // v5.151: quitado botón decorativo "Nuevo apartado" — sin función
          // v5.147: grid auto-fill — cantas tarjetas quepan por fila según ancho
          document.getElementById('pat-apartados').innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#22C55E;margin-bottom:10px">Apartados y Objetivos <span style="color:rgba(220,224,235,0.40);font-weight:700">('+activos.length+')</span></div>'+
            '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">'+(cards || '')+nuevo+'</div>';
        })();

        // v5.148: sección "Flujo y Liquidez" eliminada — usaba datos
        // sintéticos (sparkline Math.sin, deltas +12.3%/-5.1%/+22.1%
        // hardcoded). Para análisis de flujo real, ver card Financiero.
      },
    },
    // ── FINANCIERO ──
    'hud-financiero': {
      html: function(){
        return ''+
        '<div style="display:flex;flex-direction:column;gap:14px;padding:0">'+
          // Header
          '<div style="display:flex;align-items:center;justify-content:space-between;padding:0 4px">'+
            '<div style="display:flex;align-items:center;gap:10px">'+
              '<div style="width:32px;height:32px;border-radius:8px;background:rgba(34,211,238,0.12);border:1px solid rgba(34,211,238,0.40);display:flex;align-items:center;justify-content:center">'+
                '<i class="fas fa-chart-line" style="color:#22D3EE;font-size:14px"></i>'+
              '</div>'+
              '<div>'+
                '<div style="font-size:14px;font-weight:800;color:#22D3EE;text-shadow:0 0 8px rgba(34,211,238,0.4)">FINANCIERO</div>'+
                '<div style="font-size:9px;font-weight:600;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.45);margin-top:2px">Resumen del mes</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          // 5 cards top
          '<div id="fin-cards-row" style="display:grid;grid-template-columns:repeat(5,1fr);gap:10px"></div>'+
          // Mid: Visión General + Gasto promedio (proyección eliminada — datos sintéticos)
          '<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:10px">'+
            '<div id="fin-vision" style="padding:12px;border:1px solid rgba(34,211,238,0.20);border-radius:10px;background:rgba(34,211,238,0.03)"></div>'+
            '<div id="fin-gasto" style="padding:12px;border:1px solid rgba(34,211,238,0.20);border-radius:10px;background:rgba(34,211,238,0.03)"></div>'+
          '</div>'+
          // Bottom: Análisis mensual + Tendencia
          '<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:10px">'+
            '<div id="fin-analisis" style="padding:12px;border:1px solid rgba(34,211,238,0.18);border-radius:10px"></div>'+
            '<div id="fin-tendencia" style="padding:12px;border:1px solid rgba(34,211,238,0.18);border-radius:10px;display:flex;flex-direction:column"></div>'+
          '</div>'+
          // v5.149: Proyección REAL (de mes.proyeccion del backend, no sintética)
          '<div id="fin-proyeccion-real" style="padding:12px;border:1px solid rgba(34,211,238,0.18);border-radius:10px"></div>'+
          // v5.149: Identidad (scoreInversionista/scoreConsumidor) — viene de _revData del backend
          '<div id="fin-identidad" style="padding:12px;border:1px solid rgba(196,181,253,0.18);border-radius:10px;background:rgba(196,181,253,0.03)"></div>'+
          // v5.149: Insights del backend
          '<div id="fin-insights" style="padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:10px"></div>'+
        '</div>';
      },
      hydrate: function(){
        var fin = window._finData || {};
        var mes = fin.mes || {};
        var m = fin.metricas || {};
        var flujo = window._flujoMensualData || {};
        var meses = flujo.meses || [];
        var grupos = flujo.grupos || {};
        var datosM = window.datosMes || {};
        var fmt = function(n){ return '$ '+Math.round(Math.abs(n||0)).toLocaleString('es-MX'); };
        var fmtSign = function(n){ var s = n>=0?'+ ':'− '; return s+fmt(n); };

        // ── 5 cards top (sin sparklines sintéticas) ──
        function _card(label, value, color, sub){
          return '<div style="padding:11px 13px;border:1px solid '+color+'40;border-radius:10px;background:'+color+'08;position:relative;overflow:hidden">'+
            '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:'+color+';box-shadow:0 0 8px '+color+';opacity:.7"></div>'+
            '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:'+color+';margin-bottom:6px;opacity:.85">'+label+'</div>'+
            '<div style="font-size:18px;font-weight:800;color:'+color+';font-family:JetBrains Mono,monospace;line-height:1;text-shadow:0 0 10px '+color+'40;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+value+'</div>'+
            (sub ? '<div style="font-size:9px;color:rgba(220,224,235,0.45);margin-top:4px">'+sub+'</div>' : '')+
          '</div>';
        }
        var ahorro = m.porcentajeAhorro || 0;
        var runway = m.runwayDias===null||m.runwayDias===undefined?'∞':m.runwayDias+' días';
        document.getElementById('fin-cards-row').innerHTML =
          _card('Ingresos',  fmt(mes.ingresos),  '#22C55E', null)+
          _card('Egresos',   fmt(mes.egresos),   '#EF4444', null)+
          _card('Excedente', fmtSign(mes.excedente), '#22D3EE', null)+
          _card('Ahorro %',  ahorro.toFixed(1)+'%', '#FACC15', 'Objetivo: 50%')+
          _card('Runway',    runway, '#A78BFA', 'Operatividad estimada');

        // ── Visión general (donut + lista) ──
        (function(){
          var ing = mes.ingresos||0, egr = mes.egresos||0, ahorroN = (ing+egr); // egresos negativo
          var total = ing > 0 ? ing : 1;
          var pct = Math.max(0, Math.min(100, Math.round((ahorroN/total)*100)));
          var R = 36, C = 2*Math.PI*R;
          var dash = (pct/100)*C;
          var donut = '<svg viewBox="0 0 100 100" style="width:120px;height:120px"><circle cx="50" cy="50" r="'+R+'" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/><circle cx="50" cy="50" r="'+R+'" fill="none" stroke="#22D3EE" stroke-width="10" stroke-linecap="round" stroke-dasharray="'+dash+' '+C+'" transform="rotate(-90 50 50)" style="filter:drop-shadow(0 0 4px #22D3EE80)"/><text x="50" y="48" text-anchor="middle" fill="#22D3EE" font-size="16" font-weight="800" font-family="JetBrains Mono,monospace">'+pct+'%</text><text x="50" y="62" text-anchor="middle" fill="rgba(220,224,235,0.45)" font-size="6" font-weight="700">TASA DE AHORRO</text></svg>';
          var html = '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#22D3EE;margin-bottom:10px">Visión General</div>'+
            '<div style="display:flex;align-items:center;gap:14px">'+
              '<div style="flex-shrink:0">'+donut+'</div>'+
              '<div style="flex:1;display:flex;flex-direction:column;gap:8px">'+
                '<div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(220,224,235,0.75)"><span style="width:6px;height:6px;border-radius:50%;background:#22C55E"></span>Ingresos</span><span style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:#22C55E;white-space:nowrap">'+fmt(ing)+'</span></div>'+
                '<div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(220,224,235,0.75)"><span style="width:6px;height:6px;border-radius:50%;background:#EF4444"></span>Egresos</span><span style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:#EF4444;white-space:nowrap">'+fmt(egr)+'</span></div>'+
                '<div style="display:flex;justify-content:space-between;align-items:center"><span style="display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(220,224,235,0.75)"><span style="width:6px;height:6px;border-radius:50%;background:#22D3EE"></span>Ahorro</span><span style="font-family:JetBrains Mono,monospace;font-size:11px;font-weight:700;color:#22D3EE;white-space:nowrap">'+fmt(ahorroN)+'</span></div>'+
              '</div>'+
            '</div>';
          document.getElementById('fin-vision').innerHTML = html;
        })();

        // ── Gasto promedio diario (bar chart 7 días) ──
        (function(){
          var dias = ['L','M','M','J','V','S','D'];
          // Calcular gasto por día de semana de datosMes (registros con fecha)
          var sumDia = [0,0,0,0,0,0,0], cntDia = [0,0,0,0,0,0,0];
          (datosM.todos||[]).forEach(function(r){
            if(!r.fecha) return;
            var d = new Date(r.fecha);
            var dow = (d.getDay()+6)%7; // L=0
            var monto = Math.abs(parseFloat(r.monto)||0);
            if(monto>0 && r.tipo!=='Ingreso'){ sumDia[dow] += monto; cntDia[dow]++; }
          });
          var prom = sumDia.map(function(s,i){ return cntDia[i]>0 ? s/cntDia[i] : 0; });
          var maxV = Math.max.apply(null, prom) || 1;
          var bars = prom.map(function(v,i){
            var h = Math.max(4, Math.round(v/maxV*60));
            var c = i===5||i===6 ? '#FACC15' : '#22C55E';
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="width:100%;max-width:18px;height:'+h+'px;background:linear-gradient(180deg,'+c+'cc,'+c+'66);border-radius:3px 3px 0 0;box-shadow:0 0 6px '+c+'40"></div><div style="font-size:9px;font-weight:700;color:rgba(220,224,235,0.55)">'+dias[i]+'</div></div>';
          }).join('');
          var avg = m.gastoPorDiaPromedio || 0;
          document.getElementById('fin-gasto').innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#22D3EE;margin-bottom:6px">Gasto Promedio Diario</div>'+
            '<div style="font-size:20px;font-weight:800;color:#22D3EE;font-family:JetBrains Mono,monospace;margin-bottom:10px;white-space:nowrap">'+fmt(avg)+'</div>'+
            '<div style="display:flex;align-items:flex-end;gap:6px;height:64px">'+bars+'</div>';
        })();

        // v5.148: secciones "Proyección financiera" y "Protección fin de mes"
        // eliminadas porque usaban datos sintéticos (exc*1.25, exc*0.65,
        // deltas hardcoded). Para análisis predictivo real se necesita
        // modelo en el backend.

        // ── Análisis mensual (tabla) ──
        (function(){
          if(!meses.length){ document.getElementById('fin-analisis').innerHTML = '<div style="color:rgba(220,224,235,0.40);text-align:center;padding:24px">Sin datos mensuales</div>'; return; }
          var rows = meses.map(function(m){
            var g = grupos[m] || {};
            var ing = g.ingresos||0, egr = g.egresos||0, exc = g.excedente!==undefined?g.excedente:(ing+egr);
            var pctA = ing>0 ? Math.round((exc/ing)*100) : 0;
            return '<tr><td style="padding:6px 8px;font-size:11px">'+m+'</td>'+
              '<td style="padding:6px 8px;font-size:11px;text-align:right;color:#22C55E;font-family:JetBrains Mono,monospace;white-space:nowrap">'+fmt(ing)+'</td>'+
              '<td style="padding:6px 8px;font-size:11px;text-align:right;color:#EF4444;font-family:JetBrains Mono,monospace;white-space:nowrap">'+(egr<0?'-':'')+fmt(egr)+'</td>'+
              '<td style="padding:6px 8px;font-size:11px;text-align:right;color:'+(exc>=0?'#22D3EE':'#EF4444')+';font-family:JetBrains Mono,monospace;font-weight:700;white-space:nowrap">'+fmtSign(exc)+'</td>'+
              '<td style="padding:6px 8px;font-size:11px;text-align:right;color:rgba(220,224,235,0.65);font-family:JetBrains Mono,monospace">'+pctA+'%</td></tr>';
          }).join('');
          document.getElementById('fin-analisis').innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#22D3EE;margin-bottom:10px">Análisis Mensual</div>'+
            '<table style="width:100%;border-collapse:collapse">'+
              '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.08)"><th style="padding:6px 8px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:left">Mes</th><th style="padding:6px 8px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Ingresos</th><th style="padding:6px 8px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Egresos</th><th style="padding:6px 8px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Excedente</th><th style="padding:6px 8px;font-size:8px;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);text-align:right">Ahorro %</th></tr></thead>'+
              '<tbody>'+rows+'</tbody>'+
            '</table>';
        })();

        // ── Tendencia de excedente (sparkline grande) ──
        (function(){
          if(!meses.length){ document.getElementById('fin-tendencia').innerHTML = '<div style="color:rgba(220,224,235,0.40);text-align:center;padding:24px">Sin datos</div>'; return; }
          var vals = meses.map(function(m){ var g=grupos[m]||{}; return g.excedente!==undefined?g.excedente:((g.ingresos||0)+(g.egresos||0)); });
          var maxV = Math.max.apply(null, vals.map(Math.abs)) || 1;
          var W = 100, H = 60, pts = vals.map(function(v,i){
            var x = (i/(vals.length-1||1))*W;
            var y = H/2 - (v/maxV)*(H/2-4);
            return x+','+y;
          }).join(' ');
          document.getElementById('fin-tendencia').innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#22D3EE;margin-bottom:8px">Tendencia de Excedente</div>'+
            '<svg viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" style="width:100%;flex:1;min-height:120px">'+
              '<line x1="0" y1="'+(H/2)+'" x2="'+W+'" y2="'+(H/2)+'" stroke="rgba(255,255,255,0.08)" stroke-width="0.3"/>'+
              '<polyline points="'+pts+'" fill="none" stroke="#22D3EE" stroke-width="1.2" stroke-linecap="round" style="filter:drop-shadow(0 0 3px #22D3EE80)"/>'+
            '</svg>'+
            '<div style="display:flex;justify-content:space-between;font-size:8px;color:rgba(220,224,235,0.45);margin-top:6px">'+
              meses.map(function(m){ return '<span>'+m.slice(0,3).toUpperCase()+'</span>'; }).join('')+
            '</div>';
        })();

        // v5.148: sección "Desglose táctico" eliminada — su container
        // fin-desglose ya no existe en el DOM (limpieza de cards expandidas).

        // v5.149: Proyección REAL del backend (mes.proyeccion)
        (function(){
          var proy = mes.proyeccion || {};
          var diasRest = proy.diasRestantes || 0;
          var excProy = proy.excedente;
          var el = document.getElementById('fin-proyeccion-real');
          if(!el) return;
          if(diasRest <= 0 || excProy === undefined || excProy === null){
            el.innerHTML = '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:6px">Proyección Fin de Mes</div>'+
              '<div style="color:rgba(220,224,235,0.40);text-align:center;padding:16px;font-size:11px">Sin proyección disponible</div>';
            return;
          }
          var pos = excProy >= 0;
          el.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between">'+
              '<div>'+
                '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:4px">Proyección fin de mes · '+diasRest+' días restantes</div>'+
                '<div style="font-size:11px;color:rgba(220,224,235,0.55)">Al ritmo actual de '+fmt(m.gastoPorDiaPromedio||0)+'/día</div>'+
              '</div>'+
              '<div style="text-align:right">'+
                '<div style="font-size:9px;font-weight:700;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:4px">Excedente proyectado</div>'+
                '<div style="font-size:24px;font-weight:800;color:'+(pos?'#4ADE80':'#EF4444')+';font-family:JetBrains Mono,monospace;white-space:nowrap">'+(pos?'+':'')+fmt(excProy)+'</div>'+
              '</div>'+
            '</div>';
        })();

        // v5.149: Identidad (scoreInversionista / scoreConsumidor) — desde _revData
        (function(){
          var rev = window._revData || {};
          var id = rev.identidad || {};
          var scoreInv = id.scoreInversionista || 0;
          var scoreCons = id.scoreConsumidor || 0;
          var tiene = rev.ok && scoreInv > 0;
          var el = document.getElementById('fin-identidad');
          if(!el) return;
          if(!tiene){
            el.innerHTML = '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(196,181,253,0.85);margin-bottom:6px">Identidad financiera</div>'+
              '<div style="color:rgba(220,224,235,0.40);text-align:center;padding:16px;font-size:11px">Esperando análisis del período…</div>';
            return;
          }
          el.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">'+
              '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#C4B5FD">Identidad'+(rev.periodo?' · '+rev.periodo.inicio+' – '+rev.periodo.fin:'')+'</div>'+
              '<div style="font-size:9px;color:#C4B5FD;font-weight:700;text-transform:uppercase;letter-spacing:.06em">'+(rev.tipo||'').toUpperCase()+'</div>'+
            '</div>'+
            '<div style="height:10px;border-radius:5px;overflow:hidden;display:flex;background:rgba(255,255,255,0.04)">'+
              '<div style="height:100%;width:'+scoreInv+'%;background:linear-gradient(90deg,#22C55E,#4ADE80);transition:width .6s ease;box-shadow:0 0 8px rgba(74,222,128,0.4)"></div>'+
              '<div style="height:100%;flex:1;background:linear-gradient(90deg,#EF4444,#DC2626)"></div>'+
            '</div>'+
            '<div style="display:flex;justify-content:space-between;margin-top:6px">'+
              '<div style="display:flex;align-items:center;gap:5px"><span style="width:8px;height:8px;border-radius:50%;background:#4ADE80"></span><span style="font-size:11px;font-weight:800;color:#4ADE80">'+scoreInv+'% Inversionista</span></div>'+
              '<div style="display:flex;align-items:center;gap:5px"><span style="font-size:11px;font-weight:800;color:#EF4444">'+scoreCons+'% Consumidor</span><span style="width:8px;height:8px;border-radius:50%;background:#EF4444"></span></div>'+
            '</div>';
        })();

        // v5.149: Insights del backend (_revData.insights)
        (function(){
          var rev = window._revData || {};
          var ins = (rev.insights || []).filter(function(i){
            return i && i.msg && !i.msg.includes('Buen ritmo de ahorro');
          });
          var el = document.getElementById('fin-insights');
          if(!el) return;
          if(!ins.length){
            el.style.display = 'none';
            return;
          }
          el.style.display = '';
          el.innerHTML =
            '<div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:8px">💡 Insights</div>'+
            '<div style="display:flex;flex-direction:column;gap:6px">'+
              ins.map(function(i){
                var bg = i.tipo==='alerta'?'rgba(239,68,68,0.06)':i.tipo==='positivo'?'rgba(74,222,128,0.06)':'rgba(255,255,255,0.03)';
                var bd = i.tipo==='alerta'?'rgba(239,68,68,0.20)':i.tipo==='positivo'?'rgba(74,222,128,0.20)':'rgba(255,255,255,0.08)';
                var dotC = i.tipo==='alerta'?'#EF4444':i.tipo==='positivo'?'#4ADE80':i.tipo==='identidad'?'#C4B5FD':'rgba(220,224,235,0.55)';
                var txtC = i.tipo==='alerta'?'#FCA5A5':i.tipo==='positivo'?'#86EFAC':i.tipo==='identidad'?'#C4B5FD':'rgba(220,224,235,0.85)';
                return '<div style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:6px;background:'+bg+';border:1px solid '+bd+'">'+
                  '<div style="width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:6px;background:'+dotC+';box-shadow:0 0 4px '+dotC+'"></div>'+
                  '<span style="font-size:12px;line-height:1.5;color:'+txtC+'">'+i.msg+'</span>'+
                '</div>';
              }).join('')+
            '</div>';
        })();

        // Asegurar que tenemos flujo mensual, si no, fetch
        if(!meses.length && typeof api !== 'undefined' && api.getFlujoPorMes){
          api.getFlujoPorMes().then(function(d){
            window._flujoMensualData = d;
            // Re-hidratar
            var cfg = window._EXPAND_CONFIG && window._EXPAND_CONFIG['hud-financiero'];
            if(cfg && document.getElementById('fin-analisis')) cfg.hydrate();
          }).catch(function(){});
        }
        // v5.151: si _revData no está cargado, pedirlo y re-hidratar Identidad/Insights
        if((!window._revData || !window._revData.ok) && typeof api !== 'undefined' && api.getRevision){
          var _h = new Date();
          api.getRevision('mensual', _h.getFullYear(), _h.getMonth()+1, null).then(function(d){
            window._revData = d;
            var cfg = window._EXPAND_CONFIG && window._EXPAND_CONFIG['hud-financiero'];
            if(cfg && document.getElementById('fin-identidad')) cfg.hydrate();
          }).catch(function(){});
        }
      },
    },
    // ── FIJOS ──
    'hud-fijos': {
      // v5.193: vista expandida rediseñada. renderFijosExpandido pinta
      // tabla + analisis + contenedores de grafica en un solo contenedor.
      html: function(){
        return '<div id="hud-fijos-tabla" style="width:100%;min-width:0"></div>';
      },
      hydrate: function(){
        function _pintar(d){
          // v5.206: api.getGastos() puede devolver {ok, gastos:{grupos}}
          // — desenvolver. Si ya viene {grupos} directo, usar tal cual.
          var gd = (d && d.gastos) ? d.gastos : d;
          window._fijosAnualidadData = gd;
          if(typeof renderFijosExpandido === 'function'){
            renderFijosExpandido(gd, 'hud-fijos-tabla');
            // Las graficas necesitan Chart.js; cargarlo si falta.
            function _graf(){ if(typeof renderFijosGraficas==='function') renderFijosGraficas(); }
            if(window.Chart){ setTimeout(_graf, 60); }
            else {
              var s=document.createElement('script');
              s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
              s.onload=function(){ setTimeout(_graf, 80); };
              document.head.appendChild(s);
            }
          }
        }
        if(window._fijosAnualidadData){
          _pintar(window._fijosAnualidadData);
        } else if(typeof api !== 'undefined' && api.getGastos){
          var elf = document.getElementById('hud-fijos-tabla');
          if(elf) elf.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(220,224,235,0.40);font-size:12px">Cargando…</div>';
          api.getGastos().then(_pintar).catch(function(){
            var elf2 = document.getElementById('hud-fijos-tabla');
            if(elf2) elf2.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(220,224,235,0.40);font-size:12px">No se pudieron cargar los datos</div>';
          });
        } else {
          var el = document.getElementById('hud-fijos-tabla');
          if(el) el.innerHTML = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40)">Sin datos</div>';
        }
      },
    },
    // ── VARIABLES ──
    'hud-variables': {
      // v5.200: vista expandida rediseñada. renderVariablesExpandido pinta
      // tabla + stats + chips + contenedor de grafica en un contenedor.
      html: function(){
        return '<div id="hud-var-tabla" style="width:100%;min-width:0"></div>';
      },
      hydrate: function(){
        function _pintar(d){
          // v5.206: api.getDatosMes() devuelve {ok, datosMes:{meses,grupos}}
          // — desenvolver. Si ya viene {meses,grupos} directo, usar tal cual.
          var dm = (d && d.datosMes) ? d.datosMes : d;
          if(!dm || !dm.meses || !dm.meses.length){
            var el0 = document.getElementById('hud-var-tabla');
            if(el0) el0.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(220,224,235,0.40);font-size:12px">Sin datos de movimientos variables</div>';
            return;
          }
          window.datosMes = dm;
          if(typeof renderVariablesExpandido === 'function'){
            renderVariablesExpandido(dm, 'hud-var-tabla');
            function _graf(){ if(typeof renderVariablesGrafica==='function') renderVariablesGrafica(); }
            if(window.Chart){ setTimeout(_graf, 60); }
            else {
              var s=document.createElement('script');
              s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
              s.onload=function(){ setTimeout(_graf, 80); };
              document.head.appendChild(s);
            }
          }
        }
        // v5.206: usar la global datosMes SOLO si ya tiene meses cargados
        // (al inicio es {meses:[],grupos:{}} — vacía). Si no, pedir al API.
        // v5.208: leer window.datosMes (lo expone onDatosMes). Si ya
        // tiene meses, pintar directo.
        var _dm = (typeof window.datosMes !== 'undefined') ? window.datosMes
                : (typeof datosMes !== 'undefined' ? datosMes : null);
        if(_dm && _dm.meses && _dm.meses.length){
          _pintar(_dm);
        } else if(typeof api !== 'undefined' && api.getAll){
          // v5.208: fallback vía getAll (getDatosMes no se invoca en el
          // flujo normal; getAll sí, y trae d.datosMes).
          var el1 = document.getElementById('hud-var-tabla');
          if(el1) el1.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(220,224,235,0.40);font-size:12px">Cargando…</div>';
          api.getAll().then(function(d){
            _pintar((d && d.datosMes) ? d.datosMes : d);
          }).catch(function(){
            var el2 = document.getElementById('hud-var-tabla');
            if(el2) el2.innerHTML = '<div style="padding:40px;text-align:center;color:rgba(220,224,235,0.40);font-size:12px">No se pudieron cargar los datos</div>';
          });
        } else {
          var el = document.getElementById('hud-var-tabla');
          if(el) el.innerHTML = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40)">Sin datos</div>';
        }
      },
    },
    // ── BITÁCORA — clonado del DOM de Home (sec-maslow-inline / col bitacora) ──
    'hud-bitacora': {
      html: function(){
        return '<div id="hud-bit-clone" style="padding:0;display:flex;flex-direction:column;gap:14px;height:100%"></div>';
      },
      hydrate: function(){
        var dest = document.getElementById('hud-bit-clone');
        if(!dest) return;
        dest.innerHTML = '';
        // Clonar resúmenes de pensamientos, relaciones, salud, nutrición, entrena
        var d = window._pensamientosData;
        var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:14px">';
        function tarjeta(titulo, color, icon, items, vacio){
          // v5.212: formateo de fecha seguro. Antes se hacía
          // new Date(it.fecha).toLocaleDateString(...) directo — si
          // it.fecha no era parseable, salía literalmente "Invalid Date".
          // Ahora se valida con isNaN y, si falla, se intenta el formato
          // 'yyyy-MM-dd' manualmente; si tampoco, cadena vacía.
          function _fechaSegura(f){
            if(!f) return '';
            var dt = (f instanceof Date) ? f : new Date(f);
            if(!isNaN(dt.getTime())){
              return dt.toLocaleDateString('es-MX',{day:'2-digit',month:'short'});
            }
            // Fallback: parsear 'yyyy-MM-dd' a mano.
            var m = String(f).match(/^(\d{4})-(\d{2})-(\d{2})/);
            if(m){
              var meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
              return m[3] + ' ' + (meses[parseInt(m[2],10)-1] || '');
            }
            return '';
          }
          var rows = '';
          if(items && items.length){
            rows = items.slice(0,8).map(function(it){
              var fecha = _fechaSegura(it.fecha);
              var txt = it.contenido || it.descripcion || it.actividad || it.persona || '';
              return '<div style="padding:8px 10px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;justify-content:space-between;gap:8px"><span style="font-size:11px;color:rgba(220,224,235,0.85);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">'+txt+'</span><span style="font-size:9px;color:rgba(220,224,235,0.40);flex-shrink:0">'+fecha+'</span></div>';
            }).join('');
          } else {
            rows = '<div style="padding:18px;text-align:center;color:rgba(220,224,235,0.35);font-size:10px">'+vacio+'</div>';
          }
          return '<div style="border:1px solid '+color+'33;border-radius:10px;background:'+color+'08;overflow:hidden"><div style="padding:9px 12px;border-bottom:1px solid '+color+'22;display:flex;align-items:center;gap:8px"><i class="fas '+icon+'" style="color:'+color+';font-size:12px"></i><span style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:'+color+'">'+titulo+'</span></div><div>'+rows+'</div></div>';
        }
        html += tarjeta('Pensamientos', '#C084FC', 'fa-brain', (window._pensamientosData||{}).items, 'Sin pensamientos');
        html += tarjeta('Relaciones', '#93C5FD', 'fa-users', (window._relacionesData||{}).items, 'Sin relaciones');
        html += tarjeta('Salud', '#F87171', 'fa-heart-pulse', (window._saludData||{}).items, 'Sin registros');
        html += tarjeta('Nutrición', '#86EFAC', 'fa-leaf', (window._nutData||{}).items, 'Sin registros');
        html += tarjeta('Entrenamiento', '#FB923C', 'fa-dumbbell', (window._entData||{}).items, 'Sin sesiones');
        html += '</div>';
        dest.innerHTML = html;
      },
    },

    // ── ACTIVITY + LOGROS expandido ──
    'hud-activity': {
      html: function(){
        return '<div id="hud-act-expanded-body" style="padding:0;display:flex;flex-direction:column;gap:14px;height:100%"></div>';
      },
      hydrate: function(){
        var dest = document.getElementById('hud-act-expanded-body');
        if(!dest) return;
        var act = window._actData || {};
        var logros = window._logrosData || {items:[]};
        var diaKey = ['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];
        // Hábitos personales con check hoy
        var habitsP = (act.habitosPersonal||[]);
        var doneP = habitsP.filter(function(h){ return h.checks && h.checks[diaKey]; }).length;
        var habitsE = (act.habitosElectronics||[]);
        var doneE = habitsE.filter(function(h){ return h.checks && h.checks[diaKey]; }).length;
        var lgDone = (logros.items||[]).filter(function(l){ return l.completado==='Sí'||l.completado===true; }).length;
        var lgTotal = (logros.items||[]).length;
        function bar(pct, color){ return '<div style="height:6px;background:rgba(255,255,255,0.06);border-radius:999px;overflow:hidden;margin-top:6px"><div style="width:'+Math.min(100,pct)+'%;height:100%;background:'+color+';box-shadow:0 0 8px '+color+'80;border-radius:999px"></div></div>'; }
        var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">';
        // Hábitos personales
        html += '<div style="padding:14px;border:1px solid rgba(251,146,60,0.30);border-radius:12px;background:rgba(251,146,60,0.04)"><div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#FB923C;margin-bottom:8px">Hábitos personales hoy</div><div style="font-size:24px;font-weight:800;color:#FB923C;font-family:JetBrains Mono,monospace">'+doneP+' / '+habitsP.length+'</div>'+bar(habitsP.length?(doneP/habitsP.length*100):0,'#FB923C')+'</div>';
        // Electronics
        html += '<div style="padding:14px;border:1px solid rgba(34,211,238,0.30);border-radius:12px;background:rgba(34,211,238,0.04)"><div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#22D3EE;margin-bottom:8px">Hábitos Electronics hoy</div><div style="font-size:24px;font-weight:800;color:#22D3EE;font-family:JetBrains Mono,monospace">'+doneE+' / '+habitsE.length+'</div>'+bar(habitsE.length?(doneE/habitsE.length*100):0,'#22D3EE')+'</div>';
        // Logros
        html += '<div style="padding:14px;border:1px solid rgba(250,204,21,0.30);border-radius:12px;background:rgba(250,204,21,0.04);grid-column:1 / -1"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><div style="font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:#FACC15">Logros</div><div style="font-size:18px;font-weight:800;color:#FACC15;font-family:JetBrains Mono,monospace">'+lgDone+' / '+lgTotal+'</div></div>'+bar(lgTotal?(lgDone/lgTotal*100):0,'#FACC15')+'</div>';
        // Lista logros recientes
        var recientes = (logros.items||[]).slice(0,10);
        if(recientes.length){
          html += '<div style="grid-column:1 / -1;border:1px solid rgba(255,255,255,0.06);border-radius:10px;padding:10px"><div style="font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.55);margin-bottom:8px">Logros recientes</div>';
          recientes.forEach(function(l){
            var done = l.completado==='Sí'||l.completado===true;
            html += '<div style="padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.04);display:flex;align-items:center;gap:10px"><i class="fas '+(done?'fa-check-circle':'fa-circle')+'" style="color:'+(done?'#4ADE80':'rgba(220,224,235,0.30)')+';font-size:11px"></i><span style="font-size:11px;color:'+(done?'rgba(220,224,235,0.85)':'rgba(220,224,235,0.55)')+'">'+(l.titulo||l.nombre||'—')+'</span></div>';
          });
          html += '</div>';
        }
        html += '</div>';
        dest.innerHTML = html;
      },
    },

    // ── NECESIDADES expandido — usa renderNecesidadesInline si los IDs existen ──
    'hud-necesidades': {
      html: function(){
        return ''+
          '<div style="display:flex;flex-direction:column;gap:14px;min-height:0">'+
            // Header con título + filtros
            '<div style="display:flex;align-items:center;justify-content:space-between">'+
              '<div style="display:flex;align-items:center;gap:10px">'+
                '<div style="width:32px;height:32px;border-radius:8px;background:rgba(168,85,247,0.12);border:1px solid rgba(168,85,247,0.40);display:flex;align-items:center;justify-content:center">'+
                  '<i class="fas fa-wave-square" style="color:#A855F7;font-size:14px"></i>'+
                '</div>'+
                '<div style="font-size:14px;font-weight:800;color:#A855F7;letter-spacing:.10em;text-shadow:0 0 8px rgba(168,85,247,0.40)">NECESIDADES</div>'+
              '</div>'+
              '<div style="display:flex;align-items:center;gap:8px">'+
                '<div id="nec-overlay-anio-chip" style="padding:5px 10px;border:1px solid rgba(168,85,247,0.30);border-radius:8px;background:rgba(168,85,247,0.06);font-size:10px;font-weight:700;color:rgba(220,224,235,0.85);font-family:JetBrains Mono,monospace">'+(new Date().getFullYear())+'</div>'+
                '<div id="nec-overlay-mes-chip" style="padding:5px 10px;border:1px solid rgba(168,85,247,0.30);border-radius:8px;background:rgba(168,85,247,0.06);font-size:10px;font-weight:700;color:rgba(220,224,235,0.85)">Hasta hoy</div>'+
                // v5.151: botón "Hoy" decorativo eliminado — sin listener real
              '</div>'+
            '</div>'+
            // Radar + Pirámide lado a lado
            '<div style="display:flex;gap:14px;min-height:240px;flex-shrink:0">'+
              '<div id="nec-inline-radar-wrap-overlay" style="flex:1;min-width:0;padding:12px;border:1px solid rgba(168,85,247,0.18);border-radius:10px;background:rgba(168,85,247,0.03);display:flex;flex-direction:column;justify-content:center"></div>'+
              '<div id="nec-inline-piramide-overlay" style="flex:1;min-width:0;padding:12px;border:1px solid rgba(168,85,247,0.18);border-radius:10px;background:rgba(168,85,247,0.03);display:flex;flex-direction:column;justify-content:center"></div>'+
            '</div>'+
            // v5.144: contenedor inferior SIN scroll interno — el modo
            // expansión ya hace que el panel crezca para mostrar todo el
            // contenido. Antes tenía overflow:auto + flex:1 + min-height:0
            // que forzaba scroll vertical aunque el contenido cabiera.
            '<div id="nec-inline-container-overlay" style="flex:0 0 auto;overflow:visible;padding:4px"></div>'+
          '</div>';
      },
      hydrate: function(){
        var radarDest    = document.getElementById('nec-inline-radar-wrap-overlay');
        var piramideDest = document.getElementById('nec-inline-piramide-overlay');
        var detDest      = document.getElementById('nec-inline-container-overlay');
        if(!radarDest || !piramideDest || !detDest) return;

        function _aplicar(data){
          if(!data || !data.niveles || !data.niveles.length){
            radarDest.innerHTML    = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px">Sin registros con necesidad asignada</div>';
            piramideDest.innerHTML = '';
            detDest.innerHTML      = '';
            return;
          }
          // _hudRenderNecesidadesEn ahora recibe DOS destinos (radar + listaContainer).
          // Splitamos lista en pirámide+lista usando la implementación interna:
          // pasamos piramideDest+detDest combinados via wrapper.
          _hudRenderNecesidadesEn(data.niveles, radarDest, piramideDest);
          // _hudRenderNecesidadesEn puso pyrHTML + listaHTML en piramideDest.
          // Mover la lista (último <div style="margin-top:14px;...">) a detDest:
          var listaNode = piramideDest.querySelector(':scope > div[style*="margin-top:14px"]');
          var totalNode = piramideDest.querySelector(':scope > div[style*="margin-top:12px"]');
          detDest.innerHTML = '';
          if(listaNode){ detDest.appendChild(listaNode); }
          if(totalNode){ detDest.appendChild(totalNode); }
        }

        var data = window._necInlineData || (window._hudDatos && window._hudDatos.necesidades);
        if(data && data.niveles && data.niveles.length){
          _aplicar(data);
        } else {
          radarDest.innerHTML    = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px"><i class="fas fa-circle-notch fa-spin"></i> Cargando…</div>';
          piramideDest.innerHTML = '';
          detDest.innerHTML      = '';
          if(typeof api !== 'undefined' && api.getNecesidades){
            var hoy = new Date();
            api.getNecesidades(hoy.getFullYear(), String(hoy.getMonth()+1), null).then(function(d){
              window._necInlineData = d;
              if(d && d.ok){ _aplicar(d); }
              else { radarDest.innerHTML = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px">No se pudieron cargar las necesidades</div>'; }
            }).catch(function(){
              radarDest.innerHTML = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px">Error al cargar</div>';
            });
          }
        }
      },
    },
  };
  window._EXPAND_CONFIG = _EXPAND_CONFIG;

  // Ajusta el tamaño del panel expandido según el contenido real.
  // v5.205 — REESCRITO. El problema: la versión vieja medía la altura
  // natural del contenido y crecía el panel a esa medida (Math.min con
  // maxH). Resultado: en monitores altos el contenido cabía → sin scroll;
  // en bajos no cabía → con scroll. Inconsistente entre pantallas.
  // FIX: el panel SIEMPRE ocupa la zona disponible (zonaY..zonaH) — un
  // valor ya calculado correctamente para cada pantalla. El contenido
  // hace scroll interno cuando lo necesita. Predecible en todo monitor:
  // nunca tapa de más, nunca se corta.
  function _hudAjustarTamañoExpandido(intentos){
    intentos = intentos || 0;
    var panel = window._hudExpanded;
    if(!panel) return;
    var zonaY = panel._zonaY;
    var zonaH = panel._zonaH;
    if(zonaY === undefined || zonaH === undefined) return;

    var inner = panel.querySelector(':scope > [id$="-inner"]');
    if(!inner) return;
    var expContent = inner.querySelector(':scope > .hud-expanded-content');
    if(!expContent) return;

    // Altura fija = la zona disponible, acotada para no tapar el
    // mini-dial inferior. Misma fórmula en cualquier monitor.
    var maxBottomY = window.innerHeight - 140;
    var finalY = zonaY;
    var finalH = zonaH;
    if(finalY + finalH > maxBottomY){
      finalH = maxBottomY - finalY;
    }
    finalH = Math.max(280, finalH);

    panel.style.height    = finalH + 'px';
    panel.style.minHeight = finalH + 'px';
    panel.style.top       = finalY + 'px';

    // El contenido SIEMPRE puede scrollear si hace falta. Si el contenido
    // es corto, el scroll simplemente no aparece (overflow:auto) — pero el
    // panel mantiene su altura fija, así que el comportamiento es el mismo
    // visualmente en toda pantalla.
    expContent.style.overflowY = 'auto';
    expContent.style.justifyContent = 'flex-start';
  }
  window._hudAjustarTamañoExpandido = _hudAjustarTamañoExpandido;

  function _hudExpand(panelEl){
    if(!panelEl) return;
    // v7.120 — Si la card viene de nivel 0 con display:none (purga visual de
    // laterales), restaurarla ANTES de expandir para que se vea al bajar 0→1.
    if(panelEl.style.display === 'none') panelEl.style.display = '';
    if(window._hudExpanded === panelEl){
      _hudCollapse();
      return;
    }
    if(window._hudExpanded){
      _hudCollapse(/*sinReposicionar=*/true);
    }
    // Ocultar slots vacíos durante el modo expandido
    if(window._overlayDnd && typeof window._overlayDnd.clear === 'function'){
      window._overlayDnd.clear();
    }
    var inner = panelEl.querySelector(':scope > [id$="-inner"]');
    if(inner){
      // Crear o reusar el wrapper expandido
      var expContent = inner.querySelector(':scope > .hud-expanded-content');
      if(!expContent){
        expContent = document.createElement('div');
        expContent.className = 'hud-expanded-content';
        var pid = panelEl.id.replace('hud-','');
        expContent.id = 'hud-' + pid + '-expanded';
        // Marcar el contenido original como collapsed
        Array.from(inner.children).forEach(function(child){
          if(!child.classList.contains('hud-expanded-content')){
            child.classList.add('hud-collapsed-content');
          }
        });
        inner.appendChild(expContent);
      }
      // FORZAR ocultamiento de TODOS los nodos collapsed con inline style.
      // (la regla CSS por sí sola a veces falla por especificidad.)
      Array.from(inner.children).forEach(function(child){
        if(child.classList.contains('hud-collapsed-content')){
          child.style.display = 'none';
        } else if(child.classList.contains('hud-expanded-content')){
          child.style.display = 'flex';
        }
      });
      // Inyectar/refrescar contenido según el panel
      var cfg = _EXPAND_CONFIG[panelEl.id];
      if(cfg){
        expContent.innerHTML = cfg.html();
        requestAnimationFrame(function(){
          try { cfg.hydrate(); } catch(e){ console.warn('hydrate '+panelEl.id, e); }
          // Después del hydrate, esperar unos ms para que el DOM termine
          // de reflowed (sparklines SVG, donut, etc.) y luego ajustar tamaño.
          setTimeout(function(){
            if(typeof _hudAjustarTamañoExpandido === 'function') _hudAjustarTamañoExpandido();
          }, 60);
        });
      } else {
        expContent.innerHTML = ''+
          '<div style="display:flex;align-items:center;justify-content:center;'+
            'min-height:200px;color:rgba(220,224,235,0.40);font-size:11px;'+
            'letter-spacing:.10em;text-transform:uppercase;text-align:center;'+
            'flex-direction:column;gap:10px">'+
            '<i class="fas fa-layer-group" style="font-size:24px;opacity:.5"></i>'+
            '<span>Vista expandida — pendiente</span>'+
          '</div>';
        setTimeout(function(){
          if(typeof _hudAjustarTamañoExpandido === 'function') _hudAjustarTamañoExpandido();
        }, 60);
      }
    }
    panelEl.classList.add('hud-expanded');
    panelEl._wasSide = panelEl._side;
    panelEl._wasOrder = panelEl._order;
    window._hudExpanded = panelEl;
    if(typeof _reposicionarHUD === 'function') _reposicionarHUD();
  }

  function _hudCollapse(sinReposicionar){
    if(!window._hudExpanded) return;
    var panelEl = window._hudExpanded;
    panelEl.classList.remove('hud-expanded');
    window._hudExpanded = null;

    // Bandera para que _reposicionarHUD use coords FINALES del dial grande
    // durante toda la ventana de animación (.42s) — protege contra resize/DnD
    // que disparen reposicionamiento mientras el dial todavía es mini animándose.
    window._hudReturningFromExpand = true;

    // Revertir display inline aplicado al expandir
    var innerCol2 = panelEl.querySelector(':scope > [id$="-inner"]');
    if(innerCol2){
      Array.from(innerCol2.children).forEach(function(child){
        if(child.classList.contains('hud-collapsed-content')){
          child.style.display = '';
        } else if(child.classList.contains('hud-expanded-content')){
          child.style.display = 'none';
        }
      });
    }

    // Limpiar AHORA los width/height/minHeight/clipPath del panel que se acaba
    // de colapsar y de TODOS los paneles bottom (donde la rama expandida les
    // puso width/opacity/pointer-events inline y se quedan amontonados).
    panelEl.style.width = '';
    panelEl.style.height = '';
    panelEl.style.minHeight = '';
    panelEl.style.clipPath = '';
    panelEl._zonaY = undefined;
    panelEl._zonaH = undefined;
    var innerCol = panelEl.querySelector(':scope > [id$="-inner"]');
    if(innerCol){ innerCol.style.minHeight = ''; }

    // Limpiar inline-styles del wrapper expandido (overflow/justify-content)
    // que la función _hudAjustarTamañoExpandido aplicó.
    var expWrap = panelEl.querySelector(':scope > [id$="-inner"] > .hud-expanded-content');
    if(expWrap){
      expWrap.style.overflow = '';
      expWrap.style.justifyContent = '';
    }

    // ╔═══════════════════════════════════════════════════════════════════╗
    // ║ FIX v5.105: limpiar SELECTIVAMENTE inline-styles que la rama     ║
    // ║ expandida puso en cada panel:                                     ║
    // ║  · Paneles laterales (left-*/right-*): width:240px, top de        ║
    // ║    placeColExpanded → limpiar width, height, minHeight, clipPath.║
    // ║  · Misión y Nivel (bottom-left/right): width fijo, top=vH-90 →   ║
    // ║    limpiar width, height (el flujo normal reasigna left/top).    ║
    // ║  · Logro y Track (bottom-center/track): opacity:0,                ║
    // ║    pointer-events:none, transition opacity .3s → limpiar todo    ║
    // ║    eso para que recuperen visibilidad.                           ║
    // ║  · USER/Sim/Stats (top-*): NO se tocan en rama expandida,        ║
    // ║    pero por seguridad limpiamos minHeight (del flujo previo).    ║
    // ╚═══════════════════════════════════════════════════════════════════╝
    if(window._hudPanels){
      window._hudPanels.forEach(function(hp){
        if(!hp.el) return;
        var side = hp.el._side || '';
        // Limpiar dimensiones para que _reposicionarHUD las recalcule limpias
        hp.el.style.width         = '';
        hp.el.style.height        = '';
        hp.el.style.minHeight     = '';
        hp.el.style.maxHeight     = '';
        hp.el.style.overflowY     = '';
        hp.el.style.transform     = '';
        hp.el.style.clipPath      = '';
        // Logro y Track tenían opacity:0 + pointer-events:none en modo expandido
        if(side === 'bottom-center' || side === 'bottom-2nd'){
          hp.el.style.opacity       = '';
          hp.el.style.pointerEvents = '';
        }
        var innerHp = hp.el.querySelector(':scope > [id$="-inner"]');
        if(innerHp){
          innerHp.style.minHeight       = '';
          innerHp.style.justifyContent  = '';
        }
      });
    }

    // ╔═══════════════════════════════════════════════════════════════════╗
    // ║ ESTRATEGIA v5.105: en lugar de animar el regreso (que produce    ║
    // ║ posiciones intermedias raras durante .42s), aplicamos las        ║
    // ║ posiciones del modo normal INSTANTÁNEAMENTE (sin transitions),   ║
    // ║ con solo un fade de opacity para suavizar visualmente. Esto      ║
    // ║ elimina los artefactos visuales que aparecían al regresar de     ║
    // ║ modo expandido (track encimado con fila top, Misión/Logro/Nivel  ║
    // ║ a media pantalla, columnas con altura desmedida).                ║
    // ╚═══════════════════════════════════════════════════════════════════╝

    // PASO 1: Quitar transitions temporalmente para que los cambios de
    // left/top/width sean instantáneos.
    if(typeof window._hudPanels !== 'undefined'){
      window._hudPanels.forEach(function(hp){
        if(!hp.el) return;
        hp.el.style.transition = 'opacity .35s ease';
      });
    }
    if(_dialCanvas){
      // Solo el dial mantiene transition completa para que la animación
      // de mini→grande se vea (es la animación principal del regreso).
      _dialCanvas.style.transition = 'width .42s cubic-bezier(.4,1.4,.5,1),height .42s cubic-bezier(.4,1.4,.5,1),box-shadow .35s ease';
    }

    // PASO 2: Reposicionar después de un rAF para que el browser haga
    // reflow tras la limpieza de inline styles. Hacemos DOS pasadas
    // (segunda confirma mediciones limpias después del primer reflow).
    //
    // FIX v5.106: ANTES del reposicionamiento, forzamos un reset completo
    // de medidas haciendo display:none → forzar reflow → display:'' a TODOS
    // los paneles. Esto elimina cualquier dimensión cacheada por el navegador
    // del modo expandido (scrollHeight grande, anchos heredados, etc.) y
    // garantiza que `_reposicionarHUD` mida dimensiones limpias.
    if(window._hudPanels){
      window._hudPanels.forEach(function(hp){
        if(!hp.el) return;
        hp.el.style.display = 'none';
      });
      // Forzar reflow leyendo offsetHeight de un elemento conocido
      void document.body.offsetHeight;
      window._hudPanels.forEach(function(hp){
        if(!hp.el) return;
        hp.el.style.display = '';
      });
    }

    if(!sinReposicionar && typeof _reposicionarHUD === 'function'){
      requestAnimationFrame(function(){
        _reposicionarHUD();
        requestAnimationFrame(function(){
          _reposicionarHUD();
        });
      });
    }

    // Después de la animación (~500ms) limpiar las transitions inline para que
    // el flujo normal subsiguiente no anime cambios de layout (resize, DnD, etc.).
    setTimeout(function(){
      if(window._hudExpanded) return;
      // Limpiar bandera del regreso — ahora ya se puede medir el dial normal
      window._hudReturningFromExpand = false;
      if(typeof window._hudPanels !== 'undefined'){
        window._hudPanels.forEach(function(hp){
          if(!hp.el) return;
          hp.el.style.transition = '';
        });
      }
      if(_dialCanvas) _dialCanvas.style.transition = '';
      // Reconstruir slots vacíos ahora que los paneles regresaron a sus posiciones
      if(window._overlayDnd && typeof window._overlayDnd.buildGhostSlots === 'function'){
        window._overlayDnd.buildGhostSlots();
      }
    }, 500);
  }

  // Click en el dial cuando hay un panel expandido → colapsar.
  // El click handler del dial original también llama a este, pero damos
  // prioridad al colapso.
  if(_dialCanvas){
    _dialCanvas.addEventListener('click', function(e){
      if(window._hudExpanded){
        e.stopPropagation();
        e.preventDefault();
        _hudCollapse();
        return false;
      }
    }, true); // captura para correr antes de otros listeners
  }

  // Listener delegado: clicks en .hud-h-expand expanden el panel padre
  document.addEventListener('click', function(e){
    var btn = e.target.closest && e.target.closest('.hud-h-expand');
    if(!btn) return;
    e.stopPropagation();
    var panel = btn.closest('.hud-pnl');
    if(!panel) return;
    _hudExpand(panel);
  });

  // Listener delegado: clicks en .hud-cta-expand también expanden el panel padre (P4c)
  document.addEventListener('click', function(e){
    var cta = e.target.closest && e.target.closest('.hud-cta-expand');
    if(!cta) return;
    e.stopPropagation();
    var panel = cta.closest('.hud-pnl');
    if(!panel) return;
    _hudExpand(panel);
  });

  window._hudExpand = _hudExpand;
  window._hudCollapse = _hudCollapse;

  // ══════════════════════════════════════
  //  PATRIMONIO OVERLAY CARD — dinámico (v5.145)
  //  Construye el contenido del panel Patrimonio del overlay leyendo
  //  TODOS los bancos (_fijosData) y apartados (_apartadosData) reales,
  //  no solo BBVA/BEATS hardcoded. Misma lógica que renderPatrimonio
  //  de HOME pero adaptada al ancho compacto del panel flotante.
  // ══════════════════════════════════════
  window._renderPatrimonioOverlayCard = function(){
    var content = document.getElementById('_hud-pat-content');
    if(!content) return;
    var fijos = window._fijosData || [];
    var apartados = window._apartadosData || [];
    var patD = window._patrimonioData || {};
    var fondo = patD.fondo || {};
    if(!fijos.length){
      content.innerHTML = '<div style="padding:14px;text-align:center;color:rgba(220,224,235,0.40);font-size:11px">Cargando saldos…</div>';
      return;
    }
    function fmt(v){ return '$ '+Math.abs(v||0).toLocaleString('es-MX',{minimumFractionDigits:0}); }
    function fmt2(v){ return '$ '+Math.abs(v||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); }

    // Apartados activos agrupados por banco (key uppercase)
    var apPorBanco = {}, totalAp = 0;
    apartados.forEach(function(ap){
      if(ap.estado && ap.estado.toLowerCase()==='usado') return;
      var b = (ap.banco||'').trim().toUpperCase();
      apPorBanco[b] = (apPorBanco[b]||0) + (ap.monto||0);
      totalAp += (ap.monto||0);
    });

    // Total bruto (excluyendo "P" si lo hay)
    var totalBruto = fijos.reduce(function(s,fi){ return fi.nombre==='P'?s:s+(fi.monto||0); },0);
    var totalDisp = totalBruto - totalAp;

    var html = '';

    // ── Hero: Disponible hoy ──
    html += '<div style="padding:8px 10px;border:1px solid rgba(34,197,94,0.25);border-radius:8px;background:rgba(34,197,94,0.05);margin-bottom:4px">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:6px">'+
        '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(220,224,235,0.55)">Disponible hoy</div>'+
        (totalAp>0 ? '<div style="font-size:9px;color:rgba(220,224,235,0.40)">bruto <span style="color:rgba(220,224,235,0.65);font-weight:700">'+fmt(totalBruto)+'</span> − apartados <span style="color:#F59E0B;font-weight:700">'+fmt(totalAp)+'</span></div>' : '')+
      '</div>'+
      '<div style="font-size:22px;font-weight:800;color:#4ADE80;letter-spacing:-.03em;line-height:1.1;margin-top:2px;font-family:JetBrains Mono,monospace">'+fmt2(totalDisp)+'</div>'+
    '</div>';

    // ── Fondo de emergencia ──
    if(fondo.meta && fondo.meta>0){
      var saludColor = fondo.salud==='ok'?'#4ADE80':fondo.salud==='warn'?'#F59E0B':'#EF4444';
      html += '<div style="padding:6px 10px;border:1px solid rgba(255,255,255,0.06);border-radius:6px;background:rgba(255,255,255,0.02);margin-bottom:4px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">'+
          '<span style="font-size:9px;color:rgba(220,224,235,0.55);font-weight:600">🎯 Fondo emergencia</span>'+
          '<span style="font-size:10px;font-weight:800;color:'+saludColor+'">'+(fondo.avance||0)+'%</span>'+
        '</div>'+
        '<div style="height:3px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden">'+
          '<div style="height:100%;width:'+Math.min(100,fondo.avance||0)+'%;background:'+saludColor+';border-radius:2px"></div>'+
        '</div>'+
      '</div>';
    }

    // ── Saldos por banco (todos, no solo BBVA/BEATS) ──
    // Mostrar cada fijo con: nombre, saldo bruto, apartados de ese banco, disponible neto
    var fijosVisibles = fijos.filter(function(fi){ return fi.nombre!=='P'; });
    var pFila = fijos.find(function(fi){ return fi.nombre === 'P'; });
    if(fijosVisibles.length){
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 2px"><span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(220,224,235,0.55)">Saldos</span><span style="font-size:13px;font-weight:800;color:#4ADE80;font-family:JetBrains Mono,monospace">'+fmt2(totalDisp)+'</span></div>';

      fijosVisibles.forEach(function(fi){
        var bancKey = (fi.nombre||'').trim().toUpperCase();
        var apBanco = apPorBanco[bancKey] || 0;
        var dispBanco = (fi.monto||0) - apBanco;
        // Color: verde si positivo, rojo si negativo
        var col = (fi.monto||0) >= 0 ? '#4ADE80' : '#EF4444';
        html += '<div style="padding:6px 8px;border:1px solid rgba(255,255,255,0.05);border-radius:6px;background:rgba(255,255,255,0.02);display:flex;align-items:center;justify-content:space-between;gap:8px">'+
          '<div style="flex:1;min-width:0;display:flex;align-items:center;gap:6px">'+
            '<i class="fas fa-building-columns" style="color:'+col+';font-size:10px;opacity:.75"></i>'+
            '<span style="font-size:11px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+fi.nombre+'</span>'+
          '</div>'+
          '<div style="text-align:right;font-family:JetBrains Mono,monospace">'+
            '<div style="font-size:11px;font-weight:800;color:'+col+'">'+fmt2(fi.monto)+'</div>'+
            (apBanco>0 ? '<div style="font-size:9px;color:rgba(220,224,235,0.45);margin-top:1px">disp <span style="color:#4ADE80;font-weight:700">'+fmt(dispBanco)+'</span></div>' : '')+
          '</div>'+
        '</div>';
      });
    }

    // ── P* indicador (excluido del total — v5.149) ──
    if(pFila){
      html += '<div style="padding:6px 8px;border:1px dashed rgba(239,68,68,0.30);border-radius:6px;background:rgba(239,68,68,0.04);display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:2px">'+
        '<div style="flex:1;min-width:0;display:flex;align-items:center;gap:6px">'+
          '<i class="fas fa-circle-exclamation" style="color:#EF4444;font-size:10px"></i>'+
          '<div>'+
            '<div style="font-size:10px;font-weight:700;color:#fff">P <span style="color:#EF4444">*</span></div>'+
            '<div style="font-size:8px;color:rgba(220,224,235,0.45)">Indicador, excluido del total</div>'+
          '</div>'+
        '</div>'+
        '<span style="font-size:11px;font-weight:800;color:#EF4444;font-family:JetBrains Mono,monospace">'+fmt2(pFila.monto)+'</span>'+
      '</div>';
    }

    // ── Apartados (solo conteo + total, no desglose — v5.147) ──
    var apActivos = apartados.filter(function(a){ return !(a.estado&&a.estado.toLowerCase()==='usado'); });
    if(apActivos.length){
      html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;margin-top:4px;border:1px solid rgba(245,158,11,0.18);border-radius:6px;background:rgba(245,158,11,0.04)">'+
        '<div style="display:flex;align-items:center;gap:6px">'+
          '<i class="fas fa-lock" style="color:#F59E0B;font-size:10px"></i>'+
          '<span style="font-size:10px;font-weight:700;color:rgba(220,224,235,0.65)">Apartados</span>'+
          '<span style="font-size:9px;font-weight:700;color:rgba(220,224,235,0.40);padding:2px 6px;border-radius:999px;background:rgba(255,255,255,0.04)">'+apActivos.length+'</span>'+
        '</div>'+
        '<span style="font-size:12px;font-weight:800;color:#F59E0B;font-family:JetBrains Mono,monospace">'+fmt(totalAp)+'</span>'+
      '</div>';
    }

    content.innerHTML = html;
  };

  // ══════════════════════════════════════
  //  REFRESCAR ESPEJOS — incluye Nutrición y banda Sim
  // ══════════════════════════════════════
  window._refrescarEspejos = function(datos){
    function fmt(v){
      if(v===null||v===undefined||v==='') return '—';
      var n=Number(v); if(isNaN(n)) return String(v);
      return '$ '+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:0});
    }
    function fmt2(v){ if(v===null||v===undefined||v==='') return '—'; var n=Number(v); if(isNaN(n)) return '—'; return '$ '+Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2}); }
    function set(id,v){ var e=document.getElementById(id); if(e&&v!==undefined&&v!==null) e.textContent=v; }
    function setW(id,pct){ var e=document.getElementById(id); if(e){ e.style.width=Math.min(100,Math.max(0,parseFloat(pct)||0))+'%'; } }
    // Formatea $X,XXX.<dim>00</dim> en hero (centavos atenuados).
    function setMoney(id,v){
      var e=document.getElementById(id); if(!e) return;
      if(v===null||v===undefined||v==='' || isNaN(Number(v))){ e.textContent='—'; return; }
      var n = Math.abs(Number(v));
      var entero = Math.floor(n).toLocaleString('es-MX');
      var dec = (n.toFixed(2).split('.')[1] || '00');
      e.innerHTML = '$ '+entero+'<span class="cents">.'+dec+'</span>';
    }
    // Money formato corto sin centavos (ingresos/egresos)
    function setMoneyShort(id,v){
      var e=document.getElementById(id); if(!e) return;
      if(v===null||v===undefined||v==='' || isNaN(Number(v))){ e.textContent='—'; return; }
      var n = Math.abs(Number(v));
      e.innerHTML = '$ '+Math.round(n).toLocaleString('es-MX');
    }
    // Money con signo explícito (+ verde para positivos, − rojo para negativos)
    function setMoneySigned(id,v){
      var e=document.getElementById(id); if(!e) return;
      if(v===null||v===undefined||v==='' || isNaN(Number(v))){ e.textContent='—'; return; }
      var num = Number(v);
      var sign = num >= 0 ? '+' : '−';
      var n = Math.abs(num);
      var entero = Math.floor(n).toLocaleString('es-MX');
      var dec = (n.toFixed(2).split('.')[1] || '00');
      e.innerHTML = sign+' $ '+entero+'<span class="cents">.'+dec+'</span>';
    }

    var d = datos || window._hudDatos || {};

    // ── Banda Sim (estilo Sims) ──
    if(typeof renderSimsBandSimsStyle === 'function') renderSimsBandSimsStyle('hud-sim-band-grid');
    // Compatibilidad: si aún hay un grid viejo en la página, refrescarlo también
    if(document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');

    // ── USER / Nivel / XP (top-left) ──
    if(typeof _calcXPNivel === 'function'){
      var xp = _calcXPNivel();
      set('_hud-user-nivel', xp.nivel);
      set('_hud-user-xp', xp.xpActual.toLocaleString('es-MX')+' / '+xp.xpMeta.toLocaleString('es-MX')+' XP');
      setW('_hud-user-xpbar', (xp.xpActual/xp.xpMeta)*100);
      // Track
      set('_hud-track-nivel', xp.nivel);
      set('_hud-track-xp', xp.xpActual.toLocaleString('es-MX')+' / '+xp.xpMeta.toLocaleString('es-MX')+' XP');
      // Nivel Siguiente
      set('_hud-nivel-num', xp.nivel+1);
      set('_hud-nivel-xp', '+'+(xp.xpMeta - xp.xpActual).toLocaleString('es-MX')+' XP');
    }

    // ── Stats (Energía / Racha / Créditos) ──
    if(typeof _calcRachaCreditos === 'function'){
      var rc = _calcRachaCreditos();
      set('_hud-energia', rc.energia);
      set('_hud-racha-dias', rc.racha);
      set('_hud-creditos', rc.creditos.toLocaleString('es-MX'));
      // Panel _p5: trio cell "Racha actual" + iconos de fuego encendidos
      var rachaEl = document.getElementById('_hud-racha');
      if(rachaEl) rachaEl.textContent = rc.racha + 'd';
      var firesEl = document.getElementById('_hud-racha-fires');
      if(firesEl){
        var fires = firesEl.querySelectorAll('i');
        for(var fi=0; fi<fires.length; fi++){
          if(fi < rc.racha){ fires[fi].classList.add('on'); }
          else { fires[fi].classList.remove('on'); }
        }
      }
    }

    // ── Misión Diaria ──
    if(typeof _calcMisionDiaria === 'function'){
      var ms = _calcMisionDiaria();
      set('_hud-mision-progreso', ms.hechos+'/'+ms.total);
      set('_hud-mision-label', ms.label);
      set('_hud-mision-recompensa', ms.recompensa);
      setW('_hud-mision-bar', ms.total>0 ? (ms.hechos/ms.total)*100 : 0);
    }

    // ── Logro Reciente ──
    if(typeof _calcLogroReciente === 'function'){
      var lr = _calcLogroReciente();
      set('_hud-logro-titulo', lr.titulo);
      set('_hud-logro-pct', lr.avance+'%');
      setW('_hud-logro-bar', lr.avance);
    }

    // ── Nivel Siguiente: dots ──
    if(typeof _calcNivelSiguiente === 'function'){
      var ns = _calcNivelSiguiente();
      var dotsEl = document.getElementById('_hud-nivel-dots');
      if(dotsEl){
        var dh = '';
        for(var i=0;i<ns.dots;i++){
          var lleno = i < ns.dotsLlenos;
          dh += '<div style="width:6px;height:6px;border-radius:50%;'+
            'background:'+(lleno?'#A78BFA':'rgba(255,255,255,0.10)')+';'+
            (lleno?'box-shadow:0 0 5px rgba(167,139,250,0.7);':'')+
          '"></div>';
        }
        dotsEl.innerHTML = dh;
      }
    }

    // ── Patrimonio (v5.145: dinámico, todos los bancos + apartados) ──
    if(typeof window._renderPatrimonioOverlayCard === 'function'){
      window._renderPatrimonioOverlayCard();
    }
    var fijosAll = window._fijosData || [];
    var totalDisp = fijosAll.reduce(function(s,f){ return f.nombre==='P'?s:s+(f.monto||0); },0);
    var totalApD  = (window._apartadosData||[]).reduce(function(s,a){
      return a.estado&&a.estado.toLowerCase()==='usado'?s:s+(a.monto||0);
    },0);

    // Chip "+/- X% vs ayer" — compara contra saldo guardado en localStorage
    (function(){
      var chip = document.getElementById('_hud-saldo-chip');
      if(!chip) return;
      var saldoActual = totalDisp - totalApD;
      try{
        var hoy = new Date().toISOString().slice(0,10);
        var prev = JSON.parse(localStorage.getItem('hud:saldoSnap')||'null');
        if(!prev || prev.fecha !== hoy){
          if(prev && prev.fecha !== hoy){
            var delta = saldoActual - prev.saldo;
            var pct = prev.saldo!==0 ? Math.round((delta/Math.abs(prev.saldo))*100) : 0;
            var pos = delta >= 0;
            var col = pos ? '#22C55E' : '#EF4444';
            chip.style.display = 'flex';
            chip.style.background = pos ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)';
            chip.style.border = '1px solid '+(pos ? 'rgba(34,197,94,0.40)' : 'rgba(239,68,68,0.40)');
            chip.style.color = col;
            chip.style.boxShadow = '0 0 10px '+(pos ? 'rgba(34,197,94,0.20)' : 'rgba(239,68,68,0.20)');
            chip.innerHTML = '<span style="font-family:JetBrains Mono,monospace">'+(pos?'+':'')+pct+'%</span>'+
              '<span class="chip-sub">vs ayer</span>';
          } else {
            chip.style.display = 'none';
          }
          localStorage.setItem('hud:saldoSnap', JSON.stringify({fecha:hoy, saldo:saldoActual}));
        } else {
          chip.style.display = 'none';
        }
      } catch(e){ chip.style.display = 'none'; }
    })();

    // ── Financiero ──
    var finD = window._finData;
    if(finD && finD.mes){
      setMoneySigned('_hud-fin-exc', finD.mes.excedente);
      setMoneyShort('_hud-fin-ing', finD.mes.ingresos);
      setMoneyShort('_hud-fin-egr', finD.mes.egresos);
      var aho = finD.metricas && finD.metricas.porcentajeAhorro;
      set('_hud-fin-aho', aho!=null ? Math.round(aho)+'%' : '—');
      setW('_hud-aho-bar', Math.min(100,Math.max(0,aho||0)));
      var run = finD.metricas && finD.metricas.runwayDias;
      set('_hud-runway', run!=null ? run+' días' : '—');
      var gd = finD.metricas && finD.metricas.gastoPorDiaPromedio;
      set('_hud-gastoDia', gd ? fmt(gd) : '—');
    }

    // ── Necesidades ──
    // v5.146: preferir _necInlineData (filtrado por mes actual) sobre
    // d.necesidades (que getAll devuelve sin filtrar = todo el año).
    var nec = window._necInlineData || d.necesidades || window._necData || {};
    var niveles = nec.niveles || [];
    var totalNec = niveles.reduce(function(s,n){ return s+Math.abs(n.total||0); },0);
    [1,2,3,4,5].forEach(function(n){
      // Buscar por KEY, no por posición — el array puede no estar en orden
      var nv = niveles.find(function(x){ return String(x.key) === String(n); }) || {total:0};
      var abs = Math.abs(nv.total||0);
      set('_hud-nec-'+n, abs>0 ? fmt(abs) : '—');
      setW('_hud-nec-'+n+'-bar', totalNec>0 ? abs/totalNec*100 : 0);
    });

    // ── Activity + Logros ──
    if(window._actData){
      var a = window._actData;
      var totH = (a.habitosPersonal||[]).length+(a.habitosElectronics||[]).length;
      var doneH = (a.habitosPersonal||[]).filter(function(h){ return h.checks&&Object.values(h.checks).some(Boolean); }).length +
                  (a.habitosElectronics||[]).filter(function(h){ return h.checks&&Object.values(h.checks).some(Boolean); }).length;
      set('_hud-act-done', doneH+'/'+totH);
    }
    if(window._logrosData){
      var items = window._logrosData.items||[];
      var doneL = items.filter(function(l){ return l.completado==='Sí'||l.completado===true; }).length;
      set('_hud-lgr-done', doneL+'/'+items.length);
    }

    // ── Bitácora ──
    if(window._pensamientosData && window._pensamientosData.items){
      var np = window._pensamientosData.items.length;
      set('_hud-pens', np ? np+' pensamientos' : '—');
    }
    if(window._relacionesData && window._relacionesData.items){
      var nr = window._relacionesData.items.length;
      set('_hud-rels', nr ? nr+' personas' : '—');
    }
    if(window._saludData && window._saludData.items){
      var ns = window._saludData.items.length;
      set('_hud-sal', ns ? ns+' registros' : '—');
    } else {
      var salItems = document.querySelectorAll('#salud-body .salud-item');
      if(salItems.length) set('_hud-sal', salItems.length+' registros');
    }
    // Nutrición — desde _nutData o desde DOM
    if(window._nutData){
      var nutItems = (window._nutData.items||[]).length || ((window._nutData.semana||[]).reduce(function(s,d){ return s+(d.items||[]).length; },0));
      set('_hud-nut', nutItems ? nutItems+' registros' : '—');
    } else {
      // Precargar datos de Nutrición si aún no existen — sin bloquear, en background
      if(typeof api!=='undefined' && api.getNutricion && !window._nutLoading){
        window._nutLoading = true;
        api.getNutricion().then(function(d){
          window._nutData = d;
          window._nutLoading = false;
          // Actualizar label inmediatamente
          var n = (d && d.items||[]).length || (d && (d.semana||[]).reduce(function(s,x){ return s+(x.items||[]).length; },0)) || 0;
          set('_hud-nut', n ? n+' registros' : '—');
          // Actualizar también la banda Sim si tiene needs que dependen de nutrición
          if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid'); if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
        }).catch(function(){ window._nutLoading = false; });
      }
    }
    // Entrenamiento
    if(window._entData && window._entData.items){
      set('_hud-ent', window._entData.items.length+' sesiones');
    } else {
      var entItems = document.querySelectorAll('#entrenamiento-body [class*="item"]');
      if(entItems.length) set('_hud-ent', entItems.length+' sesiones');
    }
  };

  // v7.084 — clic-fondo/Escape cierran el dial SOLO en movil (<900px).
  // En escritorio el dial es el ancla del Home: cerrarlo por accidente
  // lo desaparecia sin retorno.
  _dialOverlay.addEventListener('click',function(e){
    if(e.target===_dialOverlay && window.innerWidth < 900) cerrarDial();
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&_dialVisible && window.innerWidth < 900) cerrarDial();
  });

  _dialCanvas.addEventListener('mousemove',function(e){
    var r=_dialCanvas.getBoundingClientRect();
    var mx=(e.clientX-r.left)*(_DC.W/r.width);
    var my=(e.clientY-r.top)*(_DC.H/r.height);
    var dx0=mx-_DC.CX,dy0=my-_DC.CY;
    var enCentro=(Math.sqrt(dx0*dx0+dy0*dy0)<_DC.R_IN);
    var h=enCentro?-1:_dialHitTest(mx,my,false);
    var hs=_dialActiveSub>=0&&!enCentro?_dialHitTest(mx,my,true):-1;
    var cambio=(h!==_dialHovered||hs!==_dialSubHov||enCentro!==_dialCentroHov);
    _dialHovered=h; _dialSubHov=hs; _dialCentroHov=enCentro;
    if(cambio){
      if(enCentro){ _iniciarPulsoCentro(); }
      else { _detenerPulsoCentro(); _dialDraw(); }
    }
    _dialCanvas.style.cursor=(h>=0||hs>=0||enCentro)?'pointer':'default';
  });
  _dialCanvas.addEventListener('mouseleave',function(){ _dialHovered=-1;_dialSubHov=-1;_dialCentroHov=false;_detenerPulsoCentro();_dialDraw(); });
  _dialCanvas.addEventListener('click',function(e){
    var r=_dialCanvas.getBoundingClientRect();
    var mx=(e.clientX-r.left)*(_DC.W/r.width);
    var my=(e.clientY-r.top)*(_DC.H/r.height);
    if(_dialActiveSub>=0){
      var hs=_dialHitTest(mx,my,true);
      if(hs>=0){
        var parentItem=_DIAL_ITEMS[_dialActiveSub];
        var activeSubs=parentItem._subsResueltos||parentItem.subs||[];
        var sub=activeSubs[hs];
        if(sub){
          window._dialPreset={};
          if(typeof sub.preset==='function') sub.preset();
          cerrarDial();
          abrirFormulario(sub.id);
        }
        return;
      }
    }
    var h=_dialHitTest(mx,my,false);
    if(h>=0){
      var item=_DIAL_ITEMS[h];
      if(item.accionEspecial){
        _abrirEditarOverlay();
        return;
      }
      if(item.subsGen && !item._subsResueltos){
        var gen=item.subsGen();
        item._subsResueltos = gen && gen.length ? gen : null;
      }
      var subsActivos = item._subsResueltos || item.subs;
      if(subsActivos && subsActivos.length){
        _dialSubHov=-1;
        _animarSubRing(h);
      } else {
        window._dialPreset={}; cerrarDial(); abrirFormulario(item.id);
      }
    } else {
      var dx=mx-_DC.CX,dy=my-_DC.CY;
      if(Math.sqrt(dx*dx+dy*dy)<_DC.R_IN){ window._dialPreset={}; cerrarDial(); abrirFormulario('nueva'); }
    }
  });
}

function _dialHitTest(mx,my,ring){
  var dc=_DC,N=_DIAL_ITEMS.length,slice=Math.PI*2/N;
  var dx=mx-dc.CX,dy=my-dc.CY;
  var dist=Math.sqrt(dx*dx+dy*dy);
  var angle=Math.atan2(dy,dx)+Math.PI/2;
  if(angle<0) angle+=Math.PI*2;
  if(!ring){
    if(dist<dc.R_IN||dist>dc.R_OUT+14) return -1;
    return Math.min(Math.floor(angle/slice),N-1);
  } else {
    if(_dialActiveSub<0) return -1;
    var item=_DIAL_ITEMS[_dialActiveSub];
    var subsActivos=item._subsResueltos||item.subs;
    if(!subsActivos||!subsActivos.length) return -1;
    if(dist<dc.R_SI||dist>dc.R_SO+12) return -1;
    var pmidA=Math.PI*2*(_dialActiveSub+0.5)/N-Math.PI/2;
    var spread=Math.PI*0.50,nSub=subsActivos.length,subSlice=spread/nSub;
    var startA=pmidA-spread/2;
    var absA=Math.atan2(dy,dx);
    var diff=absA-startA;
    while(diff>Math.PI) diff-=Math.PI*2;
    while(diff<-Math.PI) diff+=Math.PI*2;
    if(diff<0||diff>spread) return -1;
    return Math.min(Math.floor(diff/subSlice),nSub-1);
  }
}

function _dialDrawSector(ctx,startA,endA,rOut,rIn,fill,accent,isActive){
  var dc=_DC;
  var midA = (startA+endA)/2;
  var rMid = rIn + (rOut-rIn)*0.65;
  var gx   = dc.CX + rMid*Math.cos(midA);
  var gy   = dc.CY + rMid*Math.sin(midA);

  ctx.beginPath();
  ctx.moveTo(dc.CX+rIn*Math.cos(startA),dc.CY+rIn*Math.sin(startA));
  ctx.arc(dc.CX,dc.CY,rOut,startA,endA);
  ctx.lineTo(dc.CX+rIn*Math.cos(endA),dc.CY+rIn*Math.sin(endA));
  ctx.arc(dc.CX,dc.CY,rIn,endA,startA,true);
  ctx.closePath();

  // v5.188: pasada de relleno base opaco para que se vea menos lo de atrás.
  // Sube la opacidad efectiva del gajo ~30% sin alterar el look del gradiente.
  ctx.fillStyle = 'rgba(14,14,20,0.55)';
  ctx.fill();

  var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, (rOut-rIn)*1.1);
  var ar=139,ag=92,ab=246;
  var m=accent&&accent.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if(m){ ar=parseInt(m[1],16); ag=parseInt(m[2],16); ab=parseInt(m[3],16); }
  var tint  = isActive ? 0.18 : 0.08;
  var tint2 = isActive ? 0.06 : 0.02;
  grad.addColorStop(0,   'rgba('+ar+','+ag+','+ab+','+tint+')');
  grad.addColorStop(0.5, 'rgba('+ar+','+ag+','+ab+','+tint2+')');
  grad.addColorStop(1,   fill);

  ctx.fillStyle = grad;
  ctx.fill();

  ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1; ctx.stroke();

  var glowA = isActive ? accent : ('rgba('+ar+','+ag+','+ab+',0.35)');
  var glowW = isActive ? 3.5 : 1.5;
  ctx.save();
  ctx.shadowColor = isActive ? accent : ('rgba('+ar+','+ag+','+ab+',0.5)');
  ctx.shadowBlur  = isActive ? 28 : 12;
  ctx.beginPath();
  ctx.arc(dc.CX,dc.CY,rOut,startA+0.01,endA-0.01);
  ctx.strokeStyle=glowA; ctx.lineWidth=glowW; ctx.stroke();
  ctx.restore();

  if(isActive){
    ctx.save();
    ctx.globalAlpha=0.5;
    ctx.shadowColor=accent; ctx.shadowBlur=50;
    ctx.beginPath();
    ctx.arc(dc.CX,dc.CY,rOut,startA+0.01,endA-0.01);
    ctx.strokeStyle=accent; ctx.lineWidth=2; ctx.stroke();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(dc.CX,dc.CY,rIn+1,startA+0.01,endA-0.01);
  ctx.strokeStyle='rgba('+ar+','+ag+','+ab+',0.15)'; ctx.lineWidth=1; ctx.stroke();
}

function _dialDrawCentro(ctx, dc, isHov, pulseT){
  var pulse  = isHov ? (Math.sin(pulseT * 0.08) * 0.5 + 0.5) : 0;
  var glowAmt = isHov ? (30 + pulse * 25) : 14;
  var scaleR  = isHov ? (dc.R_IN + pulse * 6) : dc.R_IN;

  if(isHov){
    ctx.save();
    ctx.shadowColor = 'rgba(165,150,255,0.7)';
    ctx.shadowBlur  = 40 + pulse*20;
    ctx.beginPath();
    ctx.arc(dc.CX, dc.CY, scaleR + 4, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(165,150,255,' + (0.3 + pulse*0.3) + ')';
    ctx.lineWidth   = 2;
    ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.arc(dc.CX, dc.CY, scaleR + 14, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(140,120,255,' + (0.12 + pulse*0.15) + ')';
    ctx.lineWidth   = 1;
    ctx.stroke();
    ctx.restore();
  }

  var g = ctx.createRadialGradient(dc.CX, dc.CY, 0, dc.CX, dc.CY, scaleR);
  if(isHov){
    g.addColorStop(0,   'rgba(40,36,80,0.99)');
    g.addColorStop(0.5, 'rgba(24,22,52,0.99)');
    g.addColorStop(1,   'rgba(10,10,22,0.99)');
  } else {
    g.addColorStop(0,   'rgba(28,28,50,0.98)');
    g.addColorStop(0.6, 'rgba(14,14,28,0.98)');
    g.addColorStop(1,   'rgba(8,8,16,0.98)');
  }
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, scaleR, 0, Math.PI*2);
  ctx.fillStyle = g; ctx.fill();

  ctx.save();
  ctx.shadowColor = isHov ? 'rgba(180,160,255,0.9)' : 'rgba(140,130,255,0.5)';
  ctx.shadowBlur  = isHov ? (glowAmt + pulse*10) : 16;
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, scaleR, 0, Math.PI*2);
  ctx.strokeStyle = isHov
    ? 'rgba(180,160,255,' + (0.8 + pulse*0.2) + ')'
    : 'rgba(120,110,240,0.65)';
  ctx.lineWidth = isHov ? 2.5 : 1.8;
  ctx.stroke();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, scaleR - 11, 0, Math.PI*2);
  ctx.strokeStyle = isHov
    ? 'rgba(160,140,255,' + (0.18 + pulse*0.12) + ')'
    : 'rgba(100,90,200,0.20)';
  ctx.lineWidth = 1; ctx.stroke();

  ctx.save();
  ctx.shadowColor = 'rgba(185,180,255,0.9)';
  ctx.shadowBlur  = isHov ? (16 + pulse*12) : 10;
  ctx.font        = '500 ' + (isHov ? 34 : 28) + 'px -apple-system,sans-serif';
  ctx.fillStyle   = isHov
    ? 'rgba(220,210,255,' + (0.9 + pulse*0.1) + ')'
    : 'rgba(165,180,252,0.8)';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⇄', dc.CX, dc.CY - 14);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(180,160,255,0.7)';
  ctx.shadowBlur  = isHov ? (10 + pulse*8) : 6;
  ctx.font        = 'bold ' + (isHov ? 22 : 18) + 'px -apple-system,sans-serif';
  ctx.fillStyle   = isHov ? '#e0d8ff' : '#c4b5fd';
  ctx.textAlign   = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RAW', dc.CX, dc.CY + 14);
  ctx.restore();
}

function _animarSubRing(targetSub){
  if(_subRingRAF){ cancelAnimationFrame(_subRingRAF); _subRingRAF=null; }
  // v5.118: si el click es sobre el mismo gajo, animar SALIDA (1→0) con el
  // mismo easing en lugar de saltar a 0. _dialActiveSub permanece durante
  // la animación para que se siga dibujando, y al final se pone -1.
  if(targetSub === _subRingPrevSub){
    var startTimeC = null;
    var DURATION_C = 320;
    var fromProgC  = _subRingProg; // suele ser 1, pero si abren+cierran rápido podría ser <1
    function stepClose(ts){
      if(!startTimeC) startTimeC = ts;
      var elapsedC = ts - startTimeC;
      var tC = Math.min(1, elapsedC / DURATION_C);
      var easedC = 1 - Math.pow(1 - tC, 3);
      _subRingProg = fromProgC * (1 - easedC);
      _dialDraw();
      if(tC < 1){
        _subRingRAF = requestAnimationFrame(stepClose);
      } else {
        _subRingRAF = null;
        _subRingProg = 0;
        _dialActiveSub = -1;
        _subRingPrevSub = -1;
        _dialDraw();
      }
    }
    _subRingRAF = requestAnimationFrame(stepClose);
    return;
  }
  _dialActiveSub  = targetSub;
  _subRingPrevSub = targetSub;
  _subRingProg    = 0;
  var startTime   = null;
  var DURATION    = 320;
  function step(ts){
    if(!startTime) startTime = ts;
    var elapsed = ts - startTime;
    var t = Math.min(1, elapsed / DURATION);
    _subRingProg = 1 - Math.pow(1 - t, 3);
    _dialDraw();
    if(t < 1) _subRingRAF = requestAnimationFrame(step);
    else { _subRingRAF = null; _subRingProg = 1; }
  }
  _subRingRAF = requestAnimationFrame(step);
}

function _iniciarPulsoCentro(){
  if(_dialRAF) return;
  function loop(ts){
    // v7.071 — frenos: pausa oculto/sin foco + cap 30fps (igual que el cosmos)
    ts = ts || performance.now();
    if(document.hidden || !document.hasFocus()){
      _dialPulseLastT = 0;
      _dialRAF = requestAnimationFrame(loop);
      return;
    }
    if(_dialPulseLastT && (ts - _dialPulseLastT) < 33){
      _dialRAF = requestAnimationFrame(loop);
      return;
    }
    var _dtF = _dialPulseLastT ? Math.min(4, (ts - _dialPulseLastT) / 16.67) : 1;
    _dialPulseLastT = ts;
    _dialPulseT += _dtF;
    _dialDraw();
    _dialRAF = requestAnimationFrame(loop);
  }
  _dialRAF = requestAnimationFrame(loop);
}

function _detenerPulsoCentro(){
  if(_dialRAF){ cancelAnimationFrame(_dialRAF); _dialRAF=null; }
  _dialPulseT = 0;
}

function _dialDraw(){
  var ctx=_dialCtx;
  var dc=_DC;
  var N=_DIAL_ITEMS.length;
  var slice=Math.PI*2/N;

  ctx.clearRect(0,0,dc.W,dc.H);

  var bt = typeof _dialBreathT !== 'undefined' ? _dialBreathT : 0;
  var breathSin  = (Math.sin(bt * 0.025) * 0.5 + 0.5);
  var breathSin2 = (Math.sin(bt * 0.018 + 1.2) * 0.5 + 0.5);

  var HALO_OFF = 18;
  ctx.save();
  ctx.shadowColor = 'rgba(139,92,246,' + (0.5 + breathSin * 0.5) + ')';
  ctx.shadowBlur  = 60 + breathSin * 40;
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, dc.R_OUT + HALO_OFF, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(167,139,250,' + (0.25 + breathSin * 0.30) + ')';
  ctx.lineWidth   = 2 + breathSin * 2;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, dc.R_OUT + HALO_OFF + 16 + breathSin2 * 6, 0, Math.PI*2);
  ctx.strokeStyle = 'rgba(120,80,220,' + (0.06 + breathSin2 * 0.10) + ')';
  ctx.lineWidth   = 8;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  var arcAngle = bt * 0.003;
  var arcLen   = Math.PI * 0.65;

  ctx.shadowColor = 'rgba(34,211,238,' + (0.7 + breathSin * 0.3) + ')';
  ctx.shadowBlur  = 20 + breathSin * 30;
  ctx.beginPath();
  var ARC_R = dc.R_OUT + 18;
  ctx.arc(dc.CX, dc.CY, ARC_R, arcAngle, arcAngle + arcLen);
  ctx.strokeStyle = 'rgba(34,211,238,' + (0.55 + breathSin * 0.40) + ')';
  ctx.lineWidth   = 2.5;
  ctx.lineCap     = 'round';
  ctx.stroke();

  ctx.shadowColor = 'rgba(34,211,238,0.5)';
  ctx.shadowBlur  = 40 + breathSin * 20;
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, ARC_R, arcAngle, arcAngle + arcLen);
  ctx.strokeStyle = 'rgba(34,211,238,' + (0.12 + breathSin * 0.18) + ')';
  ctx.lineWidth   = 10;
  ctx.stroke();

  ctx.shadowColor = 'rgba(167,139,250,' + (0.6 + breathSin2 * 0.3) + ')';
  ctx.shadowBlur  = 18 + breathSin2 * 24;
  ctx.beginPath();
  ctx.arc(dc.CX, dc.CY, ARC_R, arcAngle+Math.PI, arcAngle+Math.PI+arcLen*0.4);
  ctx.strokeStyle = 'rgba(167,139,250,' + (0.45 + breathSin2 * 0.40) + ')';
  ctx.lineWidth   = 2;
  ctx.stroke();

  var dotR = ARC_R;
  [arcAngle, arcAngle+arcLen].forEach(function(a){
    ctx.beginPath();
    ctx.arc(dc.CX+dotR*Math.cos(a), dc.CY+dotR*Math.sin(a), 3, 0, Math.PI*2);
    ctx.fillStyle = 'rgba(34,211,238,' + (0.7+breathSin*0.3) + ')';
    ctx.shadowColor = '#22D3EE'; ctx.shadowBlur = 12;
    ctx.fill();
  });
  ctx.restore();

  for(var i=0;i<N;i++){
    var item   = _DIAL_ITEMS[i];
    var startA = -Math.PI/2 + i*slice + dc.GAP/2;
    var endA   = -Math.PI/2 + (i+1)*slice - dc.GAP/2;
    var midA   = (startA+endA)/2;
    var isHov  = (i===_dialHovered);
    var isAct  = (i===_dialActiveSub);

    var rOut = (isHov||isAct) ? dc.R_OUT+14 : dc.R_OUT;
    var rIn  = dc.R_IN;

    var fill = isAct ? _DIAL_ACT : isHov ? _DIAL_HOVER : _DIAL_BASE;

    _dialDrawSector(ctx,startA,endA,rOut,rIn,fill,item.accent,(isHov||isAct));

    var rMid = rIn + (rOut-rIn)*0.54;
    var cx   = dc.CX + rMid*Math.cos(midA);
    var cy   = dc.CY + rMid*Math.sin(midA);

    var icoS = isHov||isAct ? 52 : 44;
    ctx.save();
    ctx.shadowColor = item.accent;
    ctx.shadowBlur  = isHov||isAct ? 28 : 12;
    item.draw(ctx,cx,cy-8,icoS,item.accent);
    ctx.restore();
    if(isHov||isAct){
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.shadowColor = item.accent;
      ctx.shadowBlur  = 40;
      item.draw(ctx,cx,cy-8,icoS,item.accent);
      ctx.restore();
    }

    ctx.save();
    ctx.font         = 'bold '+(isHov||isAct?13:11)+'px -apple-system,BlinkMacSystemFont,"SF Pro Display",sans-serif';
    ctx.fillStyle    = '#ffffff';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.shadowColor  = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur   = 6;
    ctx.fillText(item.label.toUpperCase(), cx, cy+16);
    ctx.restore();

    if(item.subs){
      ctx.save();
      ctx.shadowColor = item.accent;
      ctx.shadowBlur  = isAct ? 12 : 4;
      ctx.beginPath();
      ctx.arc(dc.CX,dc.CY,rOut-2,midA-0.10,midA+0.10);
      ctx.strokeStyle = isAct ? item.accent : item.accent+'99';
      ctx.lineWidth   = isAct ? 4 : 2;
      ctx.lineCap     = 'round';
      ctx.stroke();
      ctx.restore();
    }
  }

  if(_dialActiveSub>=0){
    var parent=_DIAL_ITEMS[_dialActiveSub];
    var _subsArr=parent._subsResueltos||parent.subs||[];
    var nSub=_subsArr.length;
    var prog = typeof _subRingProg !== 'undefined' ? _subRingProg : 1;
    if(nSub>0){
      var pmidA  = Math.PI*2*(_dialActiveSub+0.5)/N - Math.PI/2;
      var spreadFull = Math.PI*0.48;
      var spread     = spreadFull * prog;
      var subSlice   = spread/nSub;
      var subGap     = 0.020 * prog;
      var subStart   = pmidA - spread/2;
      var rSIAnim = dc.R_SI;
      var rSOFull = dc.R_SO;
      var rSOAnim = dc.R_SI + (rSOFull - dc.R_SI) * prog;

      ctx.save();
      ctx.globalAlpha = prog;
      for(var j=0;j<nSub;j++){
        var sub    = _subsArr[j];
        var sA     = subStart + j*subSlice + subGap/2;
        var eA     = subStart + (j+1)*subSlice - subGap/2;
        var smA    = (sA+eA)/2;
        var isShov = (j===_dialSubHov);
        var rso    = isShov ? rSOAnim+10*prog : rSOAnim;

        ctx.beginPath();
        ctx.moveTo(dc.CX+rSIAnim*Math.cos(sA), dc.CY+rSIAnim*Math.sin(sA));
        ctx.arc(dc.CX, dc.CY, rso, sA, eA);
        ctx.lineTo(dc.CX+rSIAnim*Math.cos(eA), dc.CY+rSIAnim*Math.sin(eA));
        ctx.arc(dc.CX, dc.CY, rSIAnim, eA, sA, true);
        ctx.closePath();

        var ar2=139,ag2=92,ab2=246;
        var m2=sub.accent&&sub.accent.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
        if(m2){ ar2=parseInt(m2[1],16); ag2=parseInt(m2[2],16); ab2=parseInt(m2[3],16); }
        ctx.fillStyle = isShov
          ? 'rgba('+ar2+','+ag2+','+ab2+',0.12)'
          : 'rgba('+ar2+','+ag2+','+ab2+',0.04)';
        ctx.fill();

        ctx.save();
        ctx.shadowColor = sub.accent;
        ctx.shadowBlur  = isShov ? 28 : 14;
        ctx.beginPath();
        ctx.arc(dc.CX, dc.CY, rso, sA+0.02, eA-0.02);
        ctx.strokeStyle = isShov
          ? sub.accent
          : 'rgba('+ar2+','+ag2+','+ab2+',0.55)';
        ctx.lineWidth = isShov ? 3 : 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();

        ctx.beginPath();
        ctx.arc(dc.CX, dc.CY, rSIAnim+1, sA+0.02, eA-0.02);
        ctx.strokeStyle = 'rgba('+ar2+','+ag2+','+ab2+',0.18)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if(prog > 0.35){
          var iconProg = Math.min(1,(prog-0.35)/0.65);
          var srMid = rSIAnim + (rso-rSIAnim)*0.52;
          var scx   = dc.CX + srMid*Math.cos(smA);
          var scy   = dc.CY + srMid*Math.sin(smA);
          var sicoS = (isShov ? 40 : 34) * iconProg;

          ctx.save();
          ctx.globalAlpha = iconProg;
          ctx.shadowColor=sub.accent;
          ctx.shadowBlur=isShov?18*iconProg:7*iconProg;
          sub.draw(ctx,scx,scy-7,sicoS,sub.accent);
          ctx.restore();

          ctx.save();
          ctx.globalAlpha = iconProg;
          ctx.font='bold '+(isShov?14:12)+'px -apple-system,BlinkMacSystemFont,sans-serif';
          ctx.fillStyle='#ffffff';
          ctx.textAlign='center';
          ctx.textBaseline='top';
          ctx.shadowColor='rgba(0,0,0,0.9)';
          ctx.shadowBlur=5;
          ctx.fillText(sub.label.toUpperCase(),scx,scy+12);
          ctx.restore();
        }
      }
      ctx.restore();
    }
  }

  _dialDrawCentro(ctx, dc, _dialCentroHov, _dialPulseT);
}

// ── Overlay editar ID ──
function _abrirEditarOverlay(){
  var existing = document.getElementById('editar-id-overlay');
  if(existing){ existing.style.display='flex'; setTimeout(function(){ var inp=document.getElementById('editar-id-input-dial'); if(inp) inp.focus(); },80); return; }

  var ov = document.createElement('div');
  ov.id  = 'editar-id-overlay';
  ov.style.cssText = [
    'position:fixed','inset:0','z-index:9100',
    'display:flex','align-items:center','justify-content:center',
    'background:radial-gradient(ellipse at center,rgba(80,40,140,0.18) 0%,rgba(4,4,14,0.72) 100%)',
    'backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
    '-webkit-backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
  ].join(';');

  var box = document.createElement('div');
  box.style.cssText = [
    'background:rgba(15,12,28,0.97)',
    'border:1px solid rgba(140,100,220,0.3)',
    'clip-path:polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)',
    'box-shadow:0 0 0 1px rgba(120,80,200,0.12),0 0 40px rgba(168,85,247,0.12),0 8px 48px rgba(0,0,0,0.7)',
    'padding:28px 28px 24px',
    'width:360px','max-width:92vw',
    'display:flex','flex-direction:column','gap:16px',
    'background-image:linear-gradient(rgba(120,80,200,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.03) 1px,transparent 1px)',
    'background-size:32px 32px',
  ].join(';');

  box.innerHTML =
    '<div style="display:flex;align-items:center;gap:14px;margin-bottom:4px;padding-bottom:14px;border-bottom:1px solid rgba(140,100,220,0.2)">' +
      '<div style="width:44px;height:44px;border-radius:8px;background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.35);' +
           'display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 12px rgba(139,92,246,0.25)">' +
        '<i class="fas fa-pen" style="font-size:16px;color:#8B5CF6;filter:drop-shadow(0 0 6px rgba(139,92,246,0.8))"></i>' +
      '</div>' +
      '<div>' +
        '<div style="font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#A78BFA;margin-bottom:2px">EDITAR ENTRADA</div>' +
        '<div style="font-size:12px;color:rgba(212,216,232,0.5);font-weight:500">Ingresa el ID de la fila a editar</div>' +
      '</div>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
      '<input id="editar-id-input-dial" type="number" min="1" placeholder="142"' +
        ' style="flex:1;background:rgba(20,16,36,0.8);border:1px solid rgba(140,100,220,0.3);' +
        'clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);' +
        'color:#fff;font-size:24px;font-weight:700;padding:12px 16px;outline:none;font-family:inherit;' +
        'text-align:center;-webkit-appearance:none;appearance:none;letter-spacing:.04em">' +
      '<button id="editar-id-btn-dial"' +
        ' style="background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.35);' +
        'clip-path:polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px);' +
        'color:#A78BFA;font-size:12px;font-weight:700;padding:12px 20px;cursor:pointer;font-family:inherit;' +
        'white-space:nowrap;transition:all .15s;letter-spacing:.08em;text-transform:uppercase">' +
        '<i class="fas fa-search" style="margin-right:6px;font-size:11px"></i>Buscar' +
      '</button>' +
    '</div>' +
    '<div id="editar-id-msg-dial" style="font-size:11px;color:rgba(167,139,250,0.6);min-height:14px;text-align:center;letter-spacing:.04em"></div>';

  ov.appendChild(box);
  document.body.appendChild(ov);

  ov.addEventListener('click', function(e){ if(e.target===ov) ov.style.display='none'; });

  setTimeout(function(){
    var inp = document.getElementById('editar-id-input-dial');
    if(inp){
      inp.focus();
      inp.addEventListener('keydown', function(e){
        if(e.key==='Enter') _confirmarEditarId();
        if(e.key==='Escape') ov.style.display='none';
      });
      inp.addEventListener('focus', function(){
        inp.style.borderColor='rgba(139,92,246,0.8)';
        inp.style.boxShadow='0 0 0 1px rgba(139,92,246,0.35),0 0 16px rgba(139,92,246,0.25)';
        inp.style.background='rgba(25,18,50,0.9)';
      });
      inp.addEventListener('blur',  function(){
        inp.style.borderColor='rgba(140,100,220,0.3)';
        inp.style.boxShadow='none';
        inp.style.background='rgba(20,16,36,0.8)';
      });
    }
    var btn = document.getElementById('editar-id-btn-dial');
    if(btn){
      btn.addEventListener('click', _confirmarEditarId);
      btn.addEventListener('mouseenter', function(){
        btn.style.background='rgba(139,92,246,0.3)';
        btn.style.color='#fff';
        btn.style.boxShadow='0 0 16px rgba(139,92,246,0.3)';
      });
      btn.addEventListener('mouseleave', function(){
        btn.style.background='rgba(139,92,246,0.15)';
        btn.style.color='#A78BFA';
        btn.style.boxShadow='none';
      });
    }
  }, 80);
}

function _confirmarEditarId(){
  var inp = document.getElementById('editar-id-input-dial');
  var msg = document.getElementById('editar-id-msg-dial');
  if(!inp) return;
  var id  = parseInt(inp.value,10);
  if(!id || id < 1){
    msg.textContent='Ingresa un ID válido';
    msg.style.color='#f87171';
    inp.focus(); return;
  }
  msg.textContent='Buscando…'; msg.style.color='rgba(255,255,255,0.4)';
  var ov = document.getElementById('editar-id-overlay');
  if(ov) ov.style.display='none';
  window._dialPreset={ tab:'editar', filaId:id };
  cerrarDial();
  abrirFormulario('editar');
}

function toggleEntradaDropdown(){
  if(_dialVisible){
    cerrarDial();
    return;
  }
  // ══════════════════════════════════════════════════════════════════
  // v6.000 — EL OVERLAY ES PERSISTENTE. YA NO SE DESTRUYE.
  //
  // Hasta v5.217 esta función hacía removeChild(_dialOverlay) + null,
  // y abrirDial→_crearDialOverlay lo reconstruía entero: canvas nuevo,
  // _particlesStart() de nuevo, fondo cósmico rearmado y toda la
  // cascada de carga otra vez. Eso era la "animación pesada" que se
  // repetía en cada regreso al dial.
  //
  // En v6 el _dialOverlay (canvas + fondo + paneles + listeners) se
  // construye UNA sola vez y vive para siempre. Aquí ya NO se destruye
  // nada. Solo se hace la limpieza QUIRÚRGICA de las propiedades de
  // LAYOUT de los paneles — las que abrirDial/_reposicionarHUD van a
  // recalcular — sin tocar styling visual ni listeners. Luego abrirDial
  // simplemente vuelve a mostrar el overlay con un fade.
  //
  // En el PRIMER arranque _dialOverlay todavía es null: abrirDial llama
  // a _crearDialOverlay y se construye por única vez. Ese camino sigue
  // intacto.
  // ══════════════════════════════════════════════════════════════════
  if(_dialBreathRAF){ cancelAnimationFrame(_dialBreathRAF); _dialBreathRAF=null; _dialBreathT=0; }
  // Limpieza QUIRÚRGICA: solo propiedades de layout, no styling visual.
  if(window._hudPanels){
    window._hudPanels.forEach(function(hp){
      if(!hp.el) return;
      hp.el._animatingEntry = false;
      // Solo limpiar propiedades de POSICIONAMIENTO/LAYOUT que abrirDial
      // y _reposicionarHUD van a recalcular. NO tocar background, border,
      // box-shadow, animation, filter, font-family, etc.
      hp.el.style.left       = '';
      hp.el.style.top        = '';
      hp.el.style.right      = '';
      hp.el.style.bottom     = '';
      hp.el.style.width      = '';
      hp.el.style.height     = '';
      hp.el.style.minHeight  = '';
      hp.el.style.maxHeight  = '';
      hp.el.style.minWidth   = '';
      hp.el.style.maxWidth   = '';
      hp.el.style.overflowY  = '';
      hp.el.style.transform  = '';
      hp.el.style.clipPath   = '';
      // Reset opacity/visibility/transition para que abrirDial los maneje
      hp.el.style.opacity    = '0';
      hp.el.style.visibility = 'hidden';
      hp.el.style.transition = 'opacity 500ms ease-out';
      // pointer-events vacío permite que herede default (auto)
      hp.el.style.pointerEvents = '';
      hp.el.classList.remove('hud-breathing','hud-scan','hud-scan-2');
      var inner = hp.el.querySelector(':scope > [id$="-inner"]');
      if(inner){
        inner.style.minHeight       = '';
        inner.style.justifyContent  = '';
      }
    });
  }
  void document.body.offsetHeight; // reflow
  // v7.106 — SINCRONIZACION DURA CON EL LOADING: el dial entra EXACTAMENTE
  // cuando el loading dispara hud-listo (todas las promesas resueltas).
  // Antes, abrirDial corria de inmediato y el dial aparecia mientras
  // todavia se cargaban datos en paralelo. Ahora:
  //   · si hud-listo ya esta (rarisimo): abrir ya.
  //   · si no: observar el atributo class del <html> y abrir cuando llegue.
  //   · salvavidas 18s por si el loading no se monto (movil, error, etc).
  function _abrirDialCuandoListo(){
    var html = document.documentElement;
    if(html.classList.contains('hud-listo')){ abrirDial(); return; }
    var observer = new MutationObserver(function(){
      if(html.classList.contains('hud-listo')){
        observer.disconnect();
        abrirDial();
      }
    });
    observer.observe(html, { attributes: true, attributeFilter: ['class'] });
    setTimeout(function(){
      try { observer.disconnect(); } catch(e){}
      if(!html.classList.contains('hud-listo')){
        html.classList.add('hud-listo');   // fallback
        abrirDial();
      }
    }, 18000);
  }
  _abrirDialCuandoListo();
}

// P-D: Aplicar animaciones de "vida" a TODOS los paneles del overlay:
//  · Breathing perimetral (glow pulsante con el color del panel)
//  · Perimeter scan principal (::before, sentido horario, ~7.5s)
//  · Perimeter scan secundario (::after, sentido contrario, offset rotacional
//    distinto por panel, ~11s, más tenue) — como en el dial que tiene 2 arcos
//    girando en direcciones opuestas.
// El set de paneles es siempre el mismo (todos), pero el OFFSET inicial del
// scan se randomiza en cada apertura, así que ninguna apertura se ve igual.
function _aplicarVidaPaneles(){
  if(!window._hudPanels || !window._hudPanels.length) return;
  // Limpiar de una apertura previa
  window._hudPanels.forEach(function(hp){
    if(!hp.el) return;
    hp.el.classList.remove('hud-breathing','hud-scan','hud-scan-2');
    hp.el.style.removeProperty('--hb-c');
    hp.el.style.removeProperty('--hb-i');
    hp.el.style.removeProperty('--scan-c');
    hp.el.style.removeProperty('--scan-from');
    hp.el.style.removeProperty('--scan-c-2');
    hp.el.style.removeProperty('--scan-from-2');
  });
  // Color por panel id
  var COLOR_MAP = {
    'hud-patrimonio':'#22C55E','hud-necesidades':'#A855F7','hud-bitacora':'#C084FC',
    'hud-fijos':'#67E8F9','hud-financiero':'#22D3EE','hud-activity':'#FB923C',
    'hud-variables':'#A5B4FC','hud-mision':'#06B6D4','hud-logro':'#FACC15',
    'hud-nivel':'#A78BFA','hud-user':'#9CA3AF','hud-stats':'#FBBF24','hud-sim-band':'#A855F7',
    'hud-track':'#A78BFA',
  };
  function _rgba2(hex, a){
    var h=hex.replace('#','');
    if(h.length===3) h=h.split('').map(function(c){return c+c;}).join('');
    var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16);
    return 'rgba('+r+','+g+','+b+','+a+')';
  }
  // TODOS los candidatos: cualquier panel del overlay (incluido track, mision,
  // logro, nivel y la fila top). Excluimos solo paneles aún en cascada inicial.
  var candidatos = window._hudPanels.filter(function(hp){
    return hp.el && !hp.el._animatingEntry;
  });
  candidatos.forEach(function(hp){
    var col = COLOR_MAP[hp.el.id] || '#A855F7';
    // Breathing
    hp.el.style.setProperty('--hb-c', _rgba2(col, 0.32));
    hp.el.style.setProperty('--hb-i', _rgba2(col, 0.06));
    hp.el.classList.add('hud-breathing');
    // Scan principal — offset aleatorio para que no coincidan entre paneles
    hp.el.style.setProperty('--scan-c', col);
    hp.el.style.setProperty('--scan-from', Math.floor(Math.random()*360)+'deg');
    hp.el.classList.add('hud-scan');
    // Scan SECUNDARIO — color un poco distinto (más violeta tenue) y offset
    // muy distinto al principal para que se vean como dos arcos separados
    // girando en direcciones opuestas (como en el dial).
    var offset2 = (Math.floor(Math.random()*360) + 140) % 360; // forzar separación >120°
    hp.el.style.setProperty('--scan-c-2', col);
    hp.el.style.setProperty('--scan-from-2', offset2 + 'deg');
    hp.el.classList.add('hud-scan-2');
  });
}
window._aplicarVidaPaneles = _aplicarVidaPaneles;

var _dialYaInicializado = false;   // v6.031: ¿ya corrió la cascada inicial?

function abrirDial(){
  _crearDialOverlay();
  _dialHovered=-1; _dialSubHov=-1; _dialActiveSub=-1; _dialCentroHov=false; _detenerPulsoCentro();

  // ════════════════════════════════════════════════════════════════
  // v6.031 — REAPERTURA RÁPIDA
  // La cascada de aparición (Fase 0 oculta todo → _iniciarFaseAparicion
  // anima ~5.9s) debe correr UNA sola vez, en el primer arranque de la
  // app. En cada regreso a Home posterior NO debe repetirse: el overlay,
  // el dial y los paneles ya están construidos y posicionados. Volver a
  // Home es solo un fade rápido del overlay completo.
  // ════════════════════════════════════════════════════════════════
  if(_dialYaInicializado){
    if(!_dialBreathRAF){
      (function _breathLoop(ts){
        // v7.071 — frenos: pausa oculto/sin foco + cap 30fps (igual que el cosmos)
        ts = ts || performance.now();
        if(document.hidden || !document.hasFocus()){
          _dialBreathLastT = 0;
          _dialBreathRAF = requestAnimationFrame(_breathLoop);
          return;
        }
        if(_dialBreathLastT && (ts - _dialBreathLastT) < 33){
          _dialBreathRAF = requestAnimationFrame(_breathLoop);
          return;
        }
        var _dtF = _dialBreathLastT ? Math.min(4, (ts - _dialBreathLastT) / 16.67) : 1;
        _dialBreathLastT = ts;
        _dialBreathT += _dtF;
        _dialDraw();
        _dialBreathRAF = requestAnimationFrame(_breathLoop);
      })();
    }
    _dialVisible = true;
    window._dialVisible = true;
    window._hudCascadaEnCurso = false;
    _dialOverlay.style.display = 'flex';
    _dialOverlay.style.pointerEvents = 'none';

    // ════════════════════════════════════════════════════════════════
    // v6.062 — REAPERTURA CON FADE REAL (igual al regreso de una card
    // expandida). Antes, dial/glow/ring/paneles ya estaban en opacity:1
    // de un cierre previo; reasignarles opacity:'1' NO dispara ninguna
    // transición → aparecían "de golpe", solo el contenedor hacía fade.
    // Ahora se replica _hudCollapse: (1) reset de medidas para que el
    // layout no quede movido, (2) los elementos PARTEN de un estado
    // oculto/reducido y ANIMAN hacia el final — fade suave de verdad.
    // ════════════════════════════════════════════════════════════════

    // (1) RESET DE MEDIDAS — borra dimensiones cacheadas (display:none →
    // reflow → display:''), igual que _hudCollapse, para que
    // _reposicionarHUD mida limpio y nada quede descolocado.
    if(window._hudPanels){
      window._hudPanels.forEach(function(hp){
        if(hp.el) hp.el.style.display = 'none';
      });
      void document.body.offsetHeight;
      window._hudPanels.forEach(function(hp){
        if(hp.el) hp.el.style.display = '';
      });
    }

    // (2) ESTADO INICIAL OCULTO — sin transición, para poder animar desde aquí.
    if(_dialCanvas){
      _dialCanvas.style.transition = 'none';
      _dialCanvas.style.opacity = '0';
      _dialCanvas.style.transform = 'scale(0.92)';
    }
    var glowR = document.getElementById('dial-ambient');
    if(glowR){ glowR.style.transition='none'; glowR.style.opacity='0'; }
    var ringR = document.getElementById('dial-ring-breath');
    if(ringR){ ringR.style.transition='none'; ringR.style.opacity='0'; ringR.style.transform='scale(0.94)'; }
    if(window._hudPanels){
      window._hudPanels.forEach(function(hp){
        if(!hp.el) return;
        hp.el._animatingEntry = false;
        hp.el.style.transition = 'none';
        hp.el.style.visibility = 'visible';
        hp.el.style.opacity = '0';
        // v6.066: desplazamiento inicial algo mayor (14px) para que el
        // deslizamiento acompañe al fundido largo y se sienta calmado.
        hp.el.style.transform = 'translateY(14px)';
      });
    }

    // Refrescar datos en los espejos antes de medir/animar.
    if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid');
    if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
    if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();

    // Posicionar primero (doble rAF con medidas ya limpias).
    requestAnimationFrame(function(){
      // v6.066: el overlay aparece con un fundido más largo y calmado.
      _dialOverlay.style.transition = 'opacity 620ms cubic-bezier(.22,1,.36,1)';
      _dialOverlay.style.opacity = '1';
      if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
      requestAnimationFrame(function(){
        if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
        // (3) ANIMAR HACIA EL ESTADO FINAL — fade + leve escala/translate.
        // v6.066 — TODO MÁS SUAVE Y CON CALMA. Antes los paneles entraban
        // casi en bloque (escalonado de solo 35ms, duración 420ms) y el
        // dial igual de rápido → se sentía brusco. Ahora: las cards
        // entran una tras otra con un escalonado amplio (110ms entre
        // cada una) y un fundido largo; el dial entra el último, lento,
        // ya con las cards asentadas. Sin prisa.
        requestAnimationFrame(function(){
          if(window._hudPanels){
            window._hudPanels.forEach(function(hp, i){
              if(!hp.el) return;
              // Escalonado amplio: cada card espera su turno con calma.
              var d = 80 + (i % 8) * 110;
              hp.el.style.transition =
                'opacity 760ms cubic-bezier(.22,1,.36,1) '+d+'ms,'+
                'transform 820ms cubic-bezier(.22,1,.36,1) '+d+'ms';
              hp.el.style.opacity = '1';
              hp.el.style.transform = '';
            });
          }
          // El dial entra el ÚLTIMO y MÁS LENTO — un fundido largo que
          // arranca cuando las cards ya están entrando, sin competir.
          var DIAL_DELAY = 360;
          if(_dialCanvas){
            _dialCanvas.style.transition =
              'opacity 1100ms cubic-bezier(.22,1,.36,1) '+DIAL_DELAY+'ms,'+
              'transform 1200ms cubic-bezier(.22,1,.36,1) '+DIAL_DELAY+'ms';
            _dialCanvas.style.opacity = '1';
            _dialCanvas.style.transform = '';
          }
          if(glowR){
            glowR.style.transition = 'opacity 1200ms ease '+DIAL_DELAY+'ms';
            glowR.style.opacity = '1';
          }
          if(ringR){
            ringR.style.transition =
              'opacity 1200ms ease '+DIAL_DELAY+'ms,'+
              'transform 1200ms cubic-bezier(.22,1,.36,1) '+DIAL_DELAY+'ms';
            ringR.style.opacity = '0.18';
            ringR.style.transform = 'scale(1)';
          }
          // Limpiar transitions inline tras la animación, para que el
          // flujo normal (resize, DnD) no anime cambios de layout.
          setTimeout(function(){
            if(_dialCanvas) _dialCanvas.style.transition = '';
            if(glowR) glowR.style.transition = '';
            if(ringR) ringR.style.transition = '';
            if(window._hudPanels){
              window._hudPanels.forEach(function(hp){
                if(hp.el) hp.el.style.transition = '';
              });
            }
          }, 2600);
        });
      });
    });
    return;
  }

  // ── PRIMER ARRANQUE — cascada completa (corre una única vez) ──
  _dialYaInicializado = true;

  if(!_dialBreathRAF){
    (function _breathLoop(ts){
      // v7.071 — frenos: pausa oculto/sin foco + cap 30fps (igual que el cosmos)
      ts = ts || performance.now();
      if(document.hidden || !document.hasFocus()){
        _dialBreathLastT = 0;
        _dialBreathRAF = requestAnimationFrame(_breathLoop);
        return;
      }
      if(_dialBreathLastT && (ts - _dialBreathLastT) < 33){
        _dialBreathRAF = requestAnimationFrame(_breathLoop);
        return;
      }
      var _dtF = _dialBreathLastT ? Math.min(4, (ts - _dialBreathLastT) / 16.67) : 1;
      _dialBreathLastT = ts;
      _dialBreathT += _dtF;
      _dialDraw();
      _dialBreathRAF = requestAnimationFrame(_breathLoop);
    })();
  }

  // Bandera global para que buildGhostSlots NO construya slots durante la cascada
  window._hudCascadaEnCurso = true;

  _dialOverlay.style.opacity = '0';
  _dialOverlay.style.display = 'flex';
  // v5.142 (heredado v5.136): pointer-events:none para que paneles
  // flotantes y dial canvas (con pointer-events:auto explícitos)
  // reciban clicks correctamente. backdrop-filter del overlay creaba
  // un stacking context que atrapaba clicks.
  _dialOverlay.style.pointerEvents = 'none';
  _dialVisible = true;
  window._dialVisible = true;   // v6.011: expuesto para raw-overlay-dnd.js

  // v6.000: el fondo cósmico se construye y anima UNA sola vez en toda
  // la vida de la app (al primer arranque). En reaperturas posteriores
  // las partículas YA están corriendo — re-arrancarlas reconstruía todo
  // el fondo y re-disparaba la animación pesada de carga. Ahora solo se
  // arranca si no está corriendo.
  if(typeof window._particlesStart === 'function' && !window._particlesRunning){
    setTimeout(function(){ window._particlesStart(); }, 200);
  }

  // ═══ FASE 0 — Estado inicial: TODO oculto ═══

  // Dial canvas oculto
  if(_dialCanvas){
    _dialCanvas.style.opacity = '0';
    _dialCanvas.style.transform = 'scale(0.85)';
    _dialCanvas.style.transition = 'none';
  }
  // Glow ambiental oculto al inicio (luego fade-in con la fase 1)
  var glowEl = document.getElementById('dial-ambient');
  if(glowEl){
    glowEl.style.transition = 'none';
    glowEl.style.opacity = '0';
  }
  // Aro circular pulsante oculto al inicio
  var ringEl = document.getElementById('dial-ring-breath');
  if(ringEl){
    ringEl.style.transition = 'none';
    ringEl.style.opacity = '0';
    ringEl.style.transform = 'scale(0.92)';
  }
  // TODOS los paneles ocultos
  if(window._hudPanels){
    window._hudPanels.forEach(function(hp){
      if(!hp.el) return;
      hp.el._animatingEntry = true;
      hp.el.style.opacity = '0';
      hp.el.style.visibility = 'hidden';
      hp.el.style.transition = 'none';
    });
  }

  // ═══ Backdrop fade-in (sucede en paralelo con la fase 1) ═══
  requestAnimationFrame(function(){
    _dialOverlay.style.transition = 'opacity 720ms cubic-bezier(.16,1,.3,1)';
    _dialOverlay.style.opacity = '1';
  });

  // v5.122: ORDEN SÍNCRONO de pre-cargas (sin múltiples setTimeout):
  //   1) Renderear Sim banda y needs (necesita estar pintado para medir)
  //   2) _refrescarEspejos: rellenar paneles con datos reales. Cambia las
  //      alturas naturales (Bitácora pasa de ~120px vacía a ~280px con
  //      pensamientos/salud/entrenamiento).
  //   3) UN SOLO _reposicionarHUD con doble rAF (esperar paint del browser
  //      antes de medir scrollHeight).
  // También bloqueamos overflow del body para evitar scrollbar temporal
  // mientras las posiciones se calculan en el primer pase.
  if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid');
  if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
  if(typeof window._refrescarEspejos==='function') window._refrescarEspejos();
  var _bodyOverflowPrev = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  // Flag para que la fase de aparición visual espere al primer
  // posicionamiento correcto antes de mostrar nada.
  var _faseAparicionLista = false;
  requestAnimationFrame(function(){
    requestAnimationFrame(function(){
      if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
      _faseAparicionLista = true;
      // Restaurar overflow después del primer pase de posicionamiento
      setTimeout(function(){
        document.body.style.overflow = _bodyOverflowPrev;
      }, 100);
      // Disparar fase de aparición visual (modo rápido o cascada según flag)
      if(typeof _iniciarFaseAparicion === 'function') _iniciarFaseAparicion();
    });
  });

  // ════════════════════════════════════════════════════════════════
  // v5.124: el modo rápido tiene su PROPIO flujo independiente al
  // inicio de abrirDial (ver arriba). Cuando llegamos aquí, estamos
  // en flujo normal (DOMContentLoaded con cascada larga).
  function _iniciarFaseAparicion(){

  if(window._hudPanels && window.innerWidth>=900){
    // ═══════════════════════════════════════════════════════════════
    //  TIMELINE DE APERTURA — orden estricto (v5.107, ralentizado):
    //   t = 450ms   → FASE 1: aro circular del breathing aparece (1800ms)
    //   t = 1700ms  → FASE 2: empieza cascada de paneles (1800ms c/u)
    //   t = 5900ms  → FASE 2b: aparecen slots vacíos punteados
    //   t = 7700ms  → FASE 3: aparece el dial canvas con fade muy lento
    //                 (3200ms — pausa 1.8s post-slots)
    //   t = 11200ms → limpieza final + vida (breathing/scan al azar)
    // ═══════════════════════════════════════════════════════════════

    var T_RING_IN       = 450;
    var T_CASCADA_START = 1700;
    var T_CASCADA_DUR   = 4200; // ventana de la cascada (antes 2800 — mucho más lenta)
    var T_SLOTS_IN      = T_CASCADA_START + T_CASCADA_DUR; // 5900
    var T_DIAL_IN       = T_SLOTS_IN + 1800;               // 7700 (pausa 1.8s post-slots)
    var T_CLEANUP       = T_DIAL_IN + 3500;                // 11200 (espera fade lento del dial)

    // ── FASE 1: aro circular aparece (más suave: 1800ms) ──
    setTimeout(function(){
      if(glowEl){
        glowEl.style.transition = 'opacity 1800ms cubic-bezier(.16,1,.3,1)';
        glowEl.style.opacity = '1';
      }
      if(ringEl){
        ringEl.style.transition = 'opacity 1800ms cubic-bezier(.16,1,.3,1),transform 1800ms cubic-bezier(.16,1,.3,1)';
        ringEl.style.opacity = '1';
        ringEl.style.transform = '';
      }
    }, T_RING_IN);

    // ── FASE 2: cascada de paneles (transición individual 1200ms) ──
    function _slideOrigin(side){
      switch(side){
        case 'top-left':       return 'translate(-22px,-16px)';
        case 'top-center':     return 'translate(0,-20px)';
        case 'top-right':      return 'translate(22px,-16px)';
        case 'left-1':         return 'translate(-32px,0)';
        case 'left-2':         return 'translate(-22px,0)';
        case 'right-1':        return 'translate(22px,0)';
        case 'right-2':        return 'translate(32px,0)';
        case 'bottom-2nd':     return 'translate(-12px,22px)';
        case 'bottom-left':    return 'translate(-22px,18px)';
        case 'bottom-center':  return 'translate(12px,22px)';
        case 'bottom-right':   return 'translate(22px,18px)';
        default:               return 'translate(0,16px) scale(0.94)';
      }
    }
    window._hudPanels.forEach(function(hp){
      hp.el.style.transform = _slideOrigin(hp.el._side);
      hp.el.style.transition = 'opacity 1800ms cubic-bezier(.16,1,.3,1),transform 1900ms cubic-bezier(.16,1,.3,1),filter 1800ms ease';
      hp.el.style.filter = 'brightness(0.4) blur(2px)';
    });
    var nPanels = window._hudPanels.length;
    var slotSize = T_CASCADA_DUR / Math.max(1, nPanels - 1);
    var delays = [];
    for(var i=0;i<nPanels;i++){
      var base = T_CASCADA_START + i * slotSize;
      var jitter = (Math.random() - 0.5) * slotSize * 0.8;
      delays.push(Math.round(base + jitter));
    }
    var shuffledIdx = window._hudPanels.map(function(_,i){return i;});
    for(var s=shuffledIdx.length-1;s>0;s--){
      var r = Math.floor(Math.random()*(s+1));
      var tmp = shuffledIdx[s]; shuffledIdx[s] = shuffledIdx[r]; shuffledIdx[r] = tmp;
    }
    requestAnimationFrame(function(){
      window._hudPanels.forEach(function(hp, idx){
        var delay = delays[shuffledIdx.indexOf(idx)];
        setTimeout(function(){
          if(!hp.el._animatingEntry) return;
          hp.el.style.visibility = 'visible';
          requestAnimationFrame(function(){
            hp.el.style.opacity = '1';
            hp.el.style.transform = '';
            hp.el.style.filter = '';
          });
        }, delay);
      });
    });

    // ── FASE 2b: slots vacíos punteados aparecen ──
    setTimeout(function(){
      window._hudCascadaEnCurso = false;
      // Forzar construcción de slots ahora que la bandera está en false
      if(window._overlayDnd && typeof window._overlayDnd.buildGhostSlots === 'function'){
        window._overlayDnd.buildGhostSlots();
      } else if(typeof window._reposicionarHUD === 'function'){
        // El hook del DnD sobre _reposicionarHUD construye slots
        window._reposicionarHUD();
      }
    }, T_SLOTS_IN);

    // ── FASE 3: dial canvas aparece (MUCHO más suave: 3200ms — el último
    //    en revelarse y el más lento de toda la apertura, casi el doble que
    //    las cards. Lectura: "que se revele más lento que las demás cosas") ──
    setTimeout(function(){
      if(_dialCanvas){
        _dialCanvas.style.transition = 'opacity 3200ms cubic-bezier(.16,1,.3,1),transform 3400ms cubic-bezier(.16,1,.3,1)';
        _dialCanvas.style.opacity = '1';
        _dialCanvas.style.transform = '';
      }
      // El aro pulsante se atenúa para no competir con el dial
      if(ringEl){
        ringEl.style.transition = 'opacity 1800ms ease';
        ringEl.style.opacity = '0.18';
      }
    }, T_DIAL_IN);

    // ── Limpieza final ──
    setTimeout(function(){
      if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid');
      if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
      if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
      if(window._hudPanels){
        window._hudPanels.forEach(function(hp){
          hp.el.style.transition = '';
          hp.el._animatingEntry = false;
        });
      }
      if(_dialCanvas) _dialCanvas.style.transition = '';
      _aplicarVidaPaneles();
    }, T_CLEANUP);
  } else {
    // Modo compacto: todo visible de inmediato
    window._hudCascadaEnCurso = false;
    if(window._hudPanels){
      window._hudPanels.forEach(function(hp){
        hp.el.style.opacity = '1';
        hp.el.style.visibility = 'visible';
        hp.el.style.transform = '';
        hp.el.style.filter = '';
        hp.el._animatingEntry = false;
      });
    }
    if(_dialCanvas){ _dialCanvas.style.opacity = '1'; _dialCanvas.style.transform = ''; }
    if(ringEl){ ringEl.style.opacity = '0.18'; }
    if(glowEl){ glowEl.style.opacity = '1'; }
    setTimeout(function(){
      if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid');
      if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
      if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
    }, 100);

  }
  } // ← cierre de function _iniciarFaseAparicion
  // v6.050: btn-nueva-entrada fue retirado en v6.010 (el formulario RAW
  // se abre desde el centro del dial). Ya no hay botón que marcar.
}

// v7.079 — REANUDAR EL DIAL SIN CASCADA (subida 2→1 del sistema de
// niveles). cerrarDial deja: overlay padre con opacity:0 + display:none,
// breath loop cancelado, dial canvas y aro en opacity:0. abrirDial lo
// revierte pero re-dispara la cascada COMPLETA (por eso la subida la
// evita). Esta función revierte SOLO lo que cerrarDial rompió, al
// instante, sin animación de arranque. La llama _encenderOverlayInstant.
window._dialReanudar = function(){
  try {
    if(window._hudCascadaEnCurso) return;   // jamás pisar una cascada viva
    if(_dialOverlay){
      _dialOverlay.style.transition = 'none';
      // v7.120 — FIX dial volado a la esquina al pasar por nivel 2.
      // Antes: style.display=''  →  borraba el flex inline de fábrica y el
      // overlay caía a `block` (la regla base CSS no tiene flex), así que
      // align/justify:center dejaban de centrar y el dial saltaba a 0,0.
      // El overlay SIEMPRE debe ser flex centrado (igual que abrirDial, que
      // pone display:'flex' en 7534/7683). Datos del auditor: overlay roto
      // _disp:block / canvas _box:0,0; bueno _disp:flex / canvas centrado.
      _dialOverlay.style.display = 'flex';
      _dialOverlay.style.opacity = '1';
      _dialOverlay.style.pointerEvents = 'none';   // como lo deja abrirDial
      requestAnimationFrame(function(){ _dialOverlay.style.transition = ''; });
    }
    _dialVisible = true; window._dialVisible = true;
    if(_dialCanvas){
      _dialCanvas.style.transition = 'none';
      _dialCanvas.style.opacity = '1';
      requestAnimationFrame(function(){ _dialCanvas.style.transition = ''; });
    }
    var _ringR = document.getElementById('dial-ring-breath');
    if(_ringR){
      _ringR.style.transition = 'none';
      _ringR.style.opacity = '1';
      requestAnimationFrame(function(){ _ringR.style.transition = ''; });
    }
    if(window._hudPanels){
      window._hudPanels.forEach(function(hp){
        if(hp.el) hp.el.classList.add('hud-breathing');
      });
    }
    // Revivir el breath loop que cerrarDial canceló (mismos frenos v7.071).
    if(!_dialBreathRAF){
      (function _breathLoop(ts){
        ts = ts || performance.now();
        if(document.hidden || !document.hasFocus()){
          _dialBreathLastT = 0;
          _dialBreathRAF = requestAnimationFrame(_breathLoop);
          return;
        }
        if(_dialBreathLastT && (ts - _dialBreathLastT) < 33){
          _dialBreathRAF = requestAnimationFrame(_breathLoop);
          return;
        }
        var _dtF = _dialBreathLastT ? Math.min(4, (ts - _dialBreathLastT) / 16.67) : 1;
        _dialBreathLastT = ts;
        _dialBreathT += _dtF;
        _dialDraw();
        _dialBreathRAF = requestAnimationFrame(_breathLoop);
      })();
    }
    try { _dialDraw(); } catch(e){}
  } catch(e){}
};

function cerrarDial(){
  if(!_dialOverlay){ _dialVisible=false; window._dialVisible=false; return; }
  _dialOverlay.style.transition = 'opacity 280ms cubic-bezier(.4,0,.6,1)';
  _dialOverlay.style.opacity = '0';
  _dialOverlay.style.pointerEvents = 'none';
  _dialVisible = false; window._dialVisible = false;   // v6.011: expuesto para raw-overlay-dnd.js
  _dialActiveSub=-1; _dialCentroHov=false; _detenerPulsoCentro();
  window._hudCascadaEnCurso = false;
  // v6.011: limpiar los "ghost slots" del DnD al salir del overlay.
  // Los slots vacíos cuelgan de document.body con position:fixed y
  // z-index:9001 — si no se limpian aquí, quedan visibles por encima
  // de Logros / Activity / Bitácora / etc. (bug heredado: nada los
  // retiraba al navegar fuera del overlay). Solo deben verse sobre el
  // overlay. clearGhostSlots los elimina del DOM; se reconstruyen solos
  // al reabrir el dial vía _overlayDnd.rebuild en _reposicionarHUD.
  if(window._overlayDnd && typeof window._overlayDnd.clear === 'function'){
    try { window._overlayDnd.clear(); } catch(e){}
  }
  // v6.000: el fondo cósmico ya NO se detiene al cerrar el dial. El
  // overlay es persistente: las partículas siguen vivas y animándose
  // detrás de cualquier sección. Navegar es solo un fade — nunca una
  // reconstrucción ni una re-animación. (Antes aquí se llamaba
  // _particlesStop(), lo que obligaba a _particlesStart() en cada
  // reapertura y reconstruía el fondo entero.)
  if(_dialBreathRAF){ cancelAnimationFrame(_dialBreathRAF); _dialBreathRAF=null; _dialBreathT=0; }
  // v6.050: btn-nueva-entrada retirado en v6.010 — sin botón que limpiar.
  if(window._hudPanels){
    window._hudPanels.forEach(function(hp){
      if(!hp.el) return;
      hp.el.classList.remove('hud-breathing','hud-scan');
      hp.el.style.transition = 'opacity 220ms ease';
      hp.el.style.opacity = '0';
    });
  }
  // Fade-out del dial canvas también
  if(_dialCanvas){
    _dialCanvas.style.transition = 'opacity 240ms ease';
    _dialCanvas.style.opacity = '0';
  }
  // Aro pulsante también
  var ringE = document.getElementById('dial-ring-breath');
  if(ringE){
    ringE.style.transition = 'opacity 240ms ease';
    ringE.style.opacity = '0';
  }
  setTimeout(function(){
    // v5.119: si entre el cerrarDial y este setTimeout (290ms) el usuario
    // ya REABRIÓ el overlay (_dialVisible=true), NO ejecutar limpieza:
    // abrirDial ya configuró su propio estado de cascada y pisarlo aquí
    // rompe el layout (los paneles quedan con _animatingEntry=false y la
    // cascada no los excluye, sus posiciones se atropellan).
    if(_dialVisible) return;
    if(_dialOverlay && !_dialVisible) _dialOverlay.style.display='none';
    if(window._hudPanels){ window._hudPanels.forEach(function(hp){
      hp.el.style.opacity='0';
      hp.el.style.visibility='hidden';
      hp.el.style.transition = '';
      hp.el._animatingEntry = false;
    }); }
    // Limpiar también el dial para próxima apertura
    if(_dialCanvas){
      _dialCanvas.style.transition = '';
    }
  }, 290);
}

// v5.120: exponer EXPLÍCITAMENTE las versiones del overlay a window, para
// que el botón "Nueva" del HTML (que usa onclick="toggleEntradaDropdown()")
// garantizado llame a la versión del overlay (con cascada, _calcDialSize,
// etc) y NO a la versión legacy que existe duplicada en raw-core.js.
// Sin esto, dependemos del orden de declaración: si por algún cambio de
// carga raw-core.js terminara ganando el binding global, "Nueva" rompería
// el overlay. Esto blinda el flujo.
window.abrirDial = abrirDial;
window.cerrarDial = cerrarDial;
window.toggleEntradaDropdown = toggleEntradaDropdown;

function abrirFormulario(modo){
  var dd=document.getElementById('entrada-dropdown');
  if(dd){
    dd.style.cssText=[
      'position:fixed','inset:0','z-index:9001',
      'display:flex','align-items:center','justify-content:center',
      'background:radial-gradient(ellipse at center,rgba(80,40,140,0.18) 0%,rgba(4,4,14,0.72) 60%,rgba(0,0,8,0.82) 100%)',
      'backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
      '-webkit-backdrop-filter:blur(28px) saturate(160%) brightness(0.7)',
      'background-image:radial-gradient(ellipse at center,rgba(80,40,140,0.18) 0%,rgba(4,4,14,0.72) 100%),linear-gradient(rgba(120,80,200,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(120,80,200,0.03) 1px,transparent 1px)',
      'background-size:auto,48px 48px,48px 48px',
    ].join(';');
    dd.classList.add('show');
    if(!dd._dialClickOut){
      dd._dialClickOut=true;
      dd.addEventListener('click',function(e){
        if(e.target===dd) cerrarEntrada();
      });
    }
  }
  var inner=document.getElementById('sec-entrada');
  if(inner){
    inner.style.cssText='width:440px;max-width:96vw;max-height:90vh;overflow-y:auto;display:flex;flex-direction:column';
  }
  if(typeof _inyectarToggleModo==='function') _inyectarToggleModo();
  var tabs=document.getElementById('toggle-modo-wrap');
  if(tabs) tabs.style.display='none';
  var p1=document.getElementById('entrada-paso1');
  var p2=document.getElementById('entrada-paso2');
  if(p1) p1.style.display='none';
  if(p2) p2.style.display='block';
  if(typeof setModoEntrada==='function') setModoEntrada(modo);
  if(window._dialPreset && Object.keys(window._dialPreset).length){
    var presetSnap = JSON.parse(JSON.stringify(window._dialPreset));
    setTimeout(function(){ _aplicarDialPreset(presetSnap); }, 120);
    window._dialPreset={};
  }
}

function _aplicarDialPreset(p){
  function selectOpt(swId, val){
    var w=document.getElementById(swId); if(!w) return;
    w.querySelectorAll('.opt').forEach(function(b){
      if(b.textContent.trim()===val){ if(!b.classList.contains('on')) b.click(); }
    });
  }
  function setVal(id, val){
    var el=document.getElementById('cv-'+id)||document.getElementById(id);
    if(!el) return;
    el.textContent=val; el.value=val;
    el.classList.remove('empty');
  }

  if(p.momento){ selectOpt('sw-momento', p.momento); setVal('momento', p.momento); }
  if(p.tipo && p.tab==='entrenamiento'){ selectOpt('sw-tipo-entrena', p.tipo); setVal('tipo', p.tipo); }
  if(p.tipo && p.tab==='salud'){ selectOpt('sw-tipo-salud', p.tipo); setVal('tipo-salud', p.tipo); }
  if(p.tipo && p.tab==='patrimonio'){ selectOpt('sw-tipo-patrimonio', p.tipo); setVal('tipo-patrimonio', p.tipo); }
  if(p.categoria){ selectOpt('sw-cat-pensamiento', p.categoria); setVal('categoria', p.categoria); }
  if(p.energia !== undefined){
    var eMap = {1:'Positiva', 0:'Neutral', '-1':'Negativa'};
    var eLabel = eMap[String(p.energia)] || eMap[p.energia];
    if(eLabel){ selectOpt('sw-energia-persona', eLabel); setVal('energia', eLabel); }
  }
  if(p.banco){
    selectOpt('sw-banco', p.banco);
    setVal('banco', p.banco);
    var entes=document.querySelectorAll('.ente-nombre');
    entes.forEach(function(el){
      if(el.textContent.trim()===p.banco){
        var row=el.closest('.ente-row'); if(row) row.click();
      }
    });
  }
  if(p.tab==='editar' && p.filaId){
    setTimeout(function(){
      var inp=document.getElementById('editar-id-input');
      if(inp){ inp.value=p.filaId; if(typeof buscarFilaId==='function') buscarFilaId(); }
    }, 80);
  }
  if(p.tab && ['libro','movie','norut'].includes(p.tab)){
    var btn=document.getElementById('btn-tab-'+p.tab);
    if(btn && !btn.classList.contains('on')) btn.click();
  }
}

function cerrarEntrada(){
  // v7.085 — cerrar el popup CONCEPTO si quedo abierto: cerrar el form
  // con el popup vivo lo dejaba huerfano cruzandose con el dial.
  var _pc = document.getElementById('popup-concepto');
  if(_pc) _pc.classList.remove('show');
  // v6.031: cerrar el formulario RAW ya NO cierra el overlay. El
  // formulario vive sobre el dial (que es el Home); al cerrarlo debes
  // quedar en el dial, no salir al anverso vacío. Antes llamaba
  // cerrarDial() y eso te expulsaba del Home — el "bug del anverso".
  var dd=document.getElementById('entrada-dropdown');
  if(dd){ dd.classList.remove('show'); dd.style.display='none'; }
  // v6.050: btn-nueva-entrada retirado en v6.010 — sin botón que limpiar.
  var p1=document.getElementById('entrada-paso1');
  var p2=document.getElementById('entrada-paso2');
  if(p1) p1.style.display='block';
  if(p2) p2.style.display='none';
  // Asegurar que el overlay (Home) siga visible y activo.
  if(typeof abrirDial === 'function' && !window._dialVisible){
    abrirDial();
  }
}

function volverAPaso1(){ cerrarEntrada(); abrirDial(); }
function abrirEntrada(){ abrirDial(); }
function _abrirEntradaLegacy(){ abrirDial(); }
function _posicionarRadial(){}

// ══════════════════════════════════════════
//  GUARDAR BANCO
// ══════════════════════════════════════════
function guardarBanco(){
  const nombre=document.getElementById('banco-nombre').value.trim();
  const monto=parseFloat(document.getElementById('banco-monto').value);
  const fecha=document.getElementById('banco-fecha').value;
  if(!nombre||isNaN(monto)||!fecha){ showToast('Completa todos los campos',false); return; }
  const btn=document.querySelector('#form-banco-wrap .btn-save');
  btn.disabled=true;
  api.guardarEnBancos(nombre,monto,fecha)
    .then(r=>{
      btn.disabled=false;
      if(r.ok){
        showToast('✓ Banco guardado');var sb=document.querySelector('.btn-save');if(sb){sb.classList.add('saved');setTimeout(function(){sb.classList.remove('saved');},1200);}
        document.getElementById('banco-nombre').value='';
        document.getElementById('banco-monto').value='';
        const bfEl=document.getElementById('banco-fecha'); if(bfEl) bfEl.value=fmtD(new Date());
        api.getFijos().then(renderEntes);
      } else { showToast(r.mensaje||'Error',false); }
    })
    .catch(()=>{ btn.disabled=false; showToast('Error al guardar',false); });
}

// ══════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════
function togGraf(bodyId){
  var body=document.getElementById(bodyId); if(!body)return;
  var isOpen=body.style.display!=='none';
  body.style.display=isOpen?'none':'block';
  var chevId=bodyId.replace('-body','-chev');
  var chev=document.getElementById(chevId);
  if(chev) chev.style.transform=isOpen?'':'rotate(180deg)';
  if(!isOpen){ setTimeout(function(){ var canvas=body.querySelector('canvas'); if(canvas&&canvas._chart) canvas._chart.resize(); window.dispatchEvent(new Event('resize')); },50); }
}

window.addEventListener('DOMContentLoaded',()=>{
  const hoy=fmtD(new Date());
  const fechaEl=document.getElementById('fecha');
  if(fechaEl) fechaEl.value=hoy;
  _inyectarToggleModo();

  // v6.050: la variable _dialLandingUsed quedó huérfana al eliminarse
  // el override de cerrarDial en v6.020 — retirada.

  // ── APERTURA INICIAL: usar el mismo timeline de abrirDial ──
  // (antes este bloque tenía su propia animación rota — todo aparecía a la vez).
  // abrirDial() ya tiene la secuencia correcta:
  //   t=0      backdrop fade-in
  //   t=300    aro circular pulsante
  //   t=1100   cascada de paneles
  //   t=2900   slots vacíos
  //   t=3300   dial canvas
  //   t=4800   cleanup + vida
  // v7.107 — APERTURA INICIAL ENGANCHADA A hud-listo (la del loading).
  // El parche v7.106 cubrio una llamada secundaria pero ESTA, la
  // apertura inicial real, seguia disparando abrirDial al instante
  // que termina el DOMContentLoaded — antes que las promesas paralelas
  // (getNutricion, getNecesidades, getNotas...) hayan resuelto. Ahora
  // esperamos a hud-listo que el loading marca cuando _resueltas >=
  // _disparadas. Si por alguna razon no hay loading (movil, error),
  // salvavidas de 18s para no atorar al usuario.
  // v7.109 — FIX CRASH 8277: abrirDial crea _dialOverlay. Antes corria
  // SINCRONO, asi que las lineas que vienen despues (addEventListener
  // sobre _dialOverlay) funcionaban. Mi cambio de v7.107 lo volvio
  // ASINCRONO via MutationObserver, asi que _dialOverlay seguia null
  // cuando se intentaba el addEventListener → TypeError.
  //
  // Solucion: cuando abrirDial corra (sincrono o asincrono), llamar a
  // _instalarPostDial() que hace el listener y la inicializacion que
  // depende de _dialOverlay existente.
  function _instalarPostDial(){
    if(!_dialOverlay) return;
    if(_dialOverlay._postInstalled) return;
    _dialOverlay._postInstalled = true;
    _dialOverlay.addEventListener('click', function(e){
      if(e.target === _dialOverlay) cerrarDial();
    });
  }
  function _abrirDialYInstalar(){
    abrirDial();
    _instalarPostDial();
  }
  (function _aperturaInicialGated(){
    var html = document.documentElement;
    if(html.classList.contains('hud-listo')){ _abrirDialYInstalar(); return; }
    var obs = new MutationObserver(function(){
      if(html.classList.contains('hud-listo')){
        obs.disconnect();
        _abrirDialYInstalar();
      }
    });
    obs.observe(html, { attributes: true, attributeFilter: ['class'] });
    setTimeout(function(){
      try { obs.disconnect(); } catch(e){}
      if(!html.classList.contains('hud-listo')){
        html.classList.add('hud-listo');
        _abrirDialYInstalar();
      }
    }, 18000);
  })();

  // v5.144: hacer fade-out del splash SINCRONIZADO con el fade-in del
  // overlay para evitar el "flash gris" entre que se quita el splash y
  // aparece el morado del overlay. El splash tiene el color de fondo del
  // overlay (azul-violeta oscuro) y se desvanece progresivamente sobre
  // el primer 800ms, justo cuando el overlay alcanza visibilidad clara.
  var splash = document.getElementById('splash-dial');
  var rb = document.getElementById('render-block');
  if(splash){
    // Cambiar el color del splash al tono del overlay para que la
    // transición sea sin cambio de color, solo de opacidad.
    splash.style.transition = 'opacity 700ms ease-out';
    splash.style.background = 'rgba(10,7,22,1)'; // mismo color base del overlay
    // Quitar el render-block sin demora (los paneles internos ya están
    // ocultos por opacity:0, no aparecerán hasta que su animación los muestre)
    if(rb && rb.parentNode) rb.parentNode.removeChild(rb);
    // Esperar a que el overlay tenga opacidad antes de empezar fade-out
    setTimeout(function(){
      splash.style.opacity = '0';
      setTimeout(function(){
        if(splash.parentNode) splash.parentNode.removeChild(splash);
      }, 750);
    }, 200);
  } else {
    if(rb && rb.parentNode) rb.parentNode.removeChild(rb);
  }

  // v7.109 — listener movido a _instalarPostDial (arriba), que corre cuando _dialOverlay existe.

  // Helper: "reset duro" antes de un reposicionamiento de zoom.
  // Limpia TODOS los inline styles de layout en cada panel (left, top, width,
  // height, minHeight, maxHeight, transform, clipPath, overflowY). Esto
  // garantiza que _reposicionarHUD mida sobre un estado completamente limpio
  // sin residuos de pasadas anteriores con otro vW/vH.
  // Conserva: opacity, visibility, transition (los maneja el animation flow).
  function _resetDuroLayout(){
    if(!window._hudPanels) return;
    window._hudPanels.forEach(function(hp){
      if(!hp.el) return;
      if(hp.el._animatingEntry) return; // cascada en curso, no tocar
      hp.el.style.left       = '';
      hp.el.style.top        = '';
      hp.el.style.width      = '';
      hp.el.style.height     = '';
      hp.el.style.minHeight  = '';
      hp.el.style.maxHeight  = '';
      hp.el.style.overflowY  = '';
      hp.el.style.transform  = '';
      hp.el.style.clipPath   = '';
      var inner = hp.el.querySelector(':scope > [id$="-inner"]');
      if(inner){
        inner.style.minHeight = '';
        inner.style.justifyContent = '';
      }
    });
    // Forzar reflow para que las mediciones siguientes sean limpias
    void document.body.offsetHeight;
  }

  // v6.073 — GUARDA ANTI-BUCLE de recálculo.
  // Problema: _reposicionarHUD recoloca las cards y, al hacerlo, el
  // contenido puede oscilar ~1px y hacer aparecer/desaparecer una barra
  // de scroll. Aparecer una scrollbar CAMBIA el tamaño del visualViewport
  // → dispara su evento 'resize' → llama _reposicionarHUD otra vez →
  // bucle infinito (las cards se mueven y parpadean scrolls sin parar).
  // Solución: recordar el tamaño del viewport y solo reaccionar cuando
  // cambió DE VERDAD (más que el ancho de una scrollbar, ~20px). Los
  // micro-cambios que produce el propio bucle se ignoran.
  var _vpUltW = window.innerWidth;
  var _vpUltH = window.innerHeight;
  var _VP_UMBRAL = 24;  // px — un resize real supera esto; una scrollbar no
  function _viewportCambioReal(){
    var w = window.innerWidth, h = window.innerHeight;
    var dw = Math.abs(w - _vpUltW), dh = Math.abs(h - _vpUltH);
    if(dw < _VP_UMBRAL && dh < _VP_UMBRAL) return false;
    _vpUltW = w; _vpUltH = h;
    return true;
  }

  window.addEventListener('resize', function(){
    if(!_viewportCambioReal()) return;       // v6.073: ignora micro-cambios
    if(_dialVisible && typeof _reposicionarHUD==='function'){
      if(window._GRID) window._GRID.medido = false;  // v7.119 remedir fila top
      _resetDuroLayout();
      _reposicionarHUD();
    }
  });
  // Zoom out/in en Chrome dispara `resize` pero a veces con vH/vW intermedios
  // antes de estabilizarse. Además, visualViewport.resize cubre casos en mobile
  // y zoom donde window.resize no llega. Usar AMBOS con debounce.
  if(window.visualViewport){
    var _vvT = null;
    window.visualViewport.addEventListener('resize', function(){
      if(_vvT) clearTimeout(_vvT);
      _vvT = setTimeout(function(){
        // v6.073: misma guarda — solo recolocar si el viewport cambió de
        // verdad, no por una scrollbar que aparece/desaparece.
        if(!_viewportCambioReal()) return;
        if(_dialVisible && typeof _reposicionarHUD==='function'){
          if(window._GRID) window._GRID.medido = false;  // v7.119 remedir fila top
          _resetDuroLayout();
          _reposicionarHUD();
        }
      }, 80);
    });
  }

  // v6.020: el override de cerrarDial que revelaba 'board-anverso' en el
  // primer cierre se ELIMINA. En v6 el "Home" es el overlay (dial+cards),
  // no la board-anverso. El router (_osMostrar) coordina overlay y
  // secciones; revelar board-anverso aquí haría aparecer la vista vieja
  // por debajo. board-anverso queda oculta permanentemente (se retira
  // del DOM en la fase v6.050). cerrarDial se usa tal cual, sin envoltura.

  setChip('load','Cargando');
  api.getAll()
    .then(d=>{
      if(!d.ok&&!d.catalogos){ setChip('err','Error'); mostrarErrorConexion('getAll falló: '+(d.error||'sin datos')); return; }
      sheetUrl=d.sheetUrl||'';
      onCats(d.catalogos);
      if(typeof renderApartados==='function') renderApartados(d.apartados||{items:[],totalApartado:0});
      if(typeof renderEntes==='function') renderEntes(d.fijos);
      if(typeof onDatosMes==='function') onDatosMes(d.datosMes);
      if(typeof renderAnualidad==='function') renderAnualidad(d.gastos);
      if(typeof renderLogros==='function') renderLogros(d.logros);
      if(typeof renderNecesidades==='function') renderNecesidades(d.necesidades);
      if(typeof renderNecesidadesInline==='function'){
        renderNecesidadesInline(d.necesidades);
        setTimeout(function(){ if(typeof actualizarNecInline==='function') actualizarNecInline(); },50);
      }
      if(typeof renderFlujoMensual==='function') renderFlujoMensual(d.flujoPorMes);
      if(d.activityCheck){ _actData=d.activityCheck; }
      if(typeof renderFinancieroAvanzado==='function'&&d.financieroAvanzado) renderFinancieroAvanzado(d.financieroAvanzado);

      // ── Backend v5.006 incluye estos en getAll ──
      if(d.pensamientos){ window._pensamientosData=d.pensamientos; if(typeof renderPensamientos==='function') renderPensamientos(d.pensamientos); }
      if(d.relaciones){   window._relacionesData=d.relaciones;     if(typeof renderRelaciones==='function')   renderRelaciones(d.relaciones); }
      if(d.salud){        window._saludData=d.salud;               if(typeof renderSalud==='function')        renderSalud(d.salud); }
      if(d.nutricion){    window._nutData=d.nutricion;             if(typeof renderNutricion==='function')    renderNutricion(d.nutricion); }
      if(d.entrenamiento){window._entData=d.entrenamiento;         if(typeof renderEntrenamiento==='function')renderEntrenamiento(d.entrenamiento); }
      if(d.patrimonio){   window._patrimonioData=d.patrimonio;     if(typeof renderPatrimonio==='function')   renderPatrimonio(d.patrimonio); }
      if(d.financieroAvanzado){ window._finData=d.financieroAvanzado; }

      // Fallback: si el backend no devuelve estos endpoints (Code.gs viejo), pedirlos sueltos
      if(!d.pensamientos) api.getPensamientos().then(r=>{ window._pensamientosData=r; if(typeof renderPensamientos==='function') renderPensamientos(r); setTimeout(function(){ if(window._refrescarEspejos) window._refrescarEspejos(); },200); }).catch(()=>{});
      if(!d.relaciones)   api.getRelaciones().then(r=>{ window._relacionesData=r; if(typeof renderRelaciones==='function') renderRelaciones(r); }).catch(()=>{});
      if(!d.salud)        api.getSalud().then(r=>{ window._saludData=r; if(typeof renderSalud==='function') renderSalud(r); }).catch(()=>{});
      if(!d.patrimonio)   api.getPatrimonio().then(r=>{ window._patrimonioData=r; if(typeof renderPatrimonio==='function') renderPatrimonio(r); }).catch(()=>{});
      if(!d.financieroAvanzado) api.getFinancieroAvanzado().then(r=>{ window._finData=r; }).catch(()=>{});

      if(typeof cargarScore==='function') cargarScore();
      if(typeof cargarRevision==='function') cargarRevision('mensual',new Date().getFullYear(),new Date().getMonth()+1,null);

      window._hudDatos = {
        totalApartado: (d.apartados&&d.apartados.totalApartado) || 0,
        necesidades: d.necesidades || {},
        datosMes: d.datosMes || {},
        financiero: d.financieroAvanzado || {},
      };
      // v5.146: getAll() llama a getNecesidades() sin parámetros, lo que
      // devuelve TODO el AÑO. Para que el panel colapsado de Necesidades
      // muestre solo los datos del mes actual (igual que la card expandida
      // y la card de HOME al filtrar), pedir explícitamente las necesidades
      // del mes en curso y reemplazar los datos del año.
      if(typeof api !== 'undefined' && api.getNecesidades){
        var _hoy = new Date();
        api.getNecesidades(_hoy.getFullYear(), String(_hoy.getMonth()+1), null).then(function(necMes){
          if(necMes && necMes.niveles){
            window._hudDatos.necesidades = necMes;
            window._necInlineData = necMes;
            if(typeof window._refrescarEspejos === 'function'){
              window._refrescarEspejos(window._hudDatos);
            }
          }
        }).catch(function(){});
      }
      setTimeout(function(){
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos(window._hudDatos);
      }, 600);
      setTimeout(function(){
        if(typeof window._refrescarEspejos==='function') window._refrescarEspejos(window._hudDatos);
      }, 3000);
    })
    .catch(err=>{ setChip('err','Error'); mostrarErrorConexion(err.message); });

  initTooltip();
  _initMobTablero();
  const bfEl=document.getElementById('banco-fecha'); if(bfEl) bfEl.value=fmtD(new Date());
  _initEncomTheme();
});

// ══════════════════════════════════════════
//  ENCOM THEME
// ══════════════════════════════════════════
function _initEncomTheme(){
  if(localStorage.getItem('lifeos_theme')==='encom'){
    document.documentElement.classList.add('encom');
    _updateEncomBtn(true);
  }
}
function toggleEncomTheme(){
  const isEncom=document.documentElement.classList.toggle('encom');
  localStorage.setItem('lifeos_theme',isEncom?'encom':'default');
  _updateEncomBtn(isEncom);
  showToast(isEncom?'⬡ ENCOM MODE ON':'● Default Mode',true);
}
function _updateEncomBtn(active){
  const btn=document.getElementById('btn-encom-toggle'); if(!btn)return;
  btn.title=active?'Desactivar Encom Mode':'Activar Encom Mode';
}