/* RAW Entry — Overlay v.5.159
   FIX clicks rotos en +Nueva — causa raíz definitiva.

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
var _dialRAF        = null;
var _subRingProg    = 0;
var _subRingRAF     = null;
var _subRingPrevSub = -1;
var _dialBreathT    = 0;
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
  _dialCanvas.style.cssText = 'display:block;cursor:pointer;width:min(580px,40vw);height:min(580px,40vw);position:relative;pointer-events:auto;z-index:1';
  _dialCtx = _dialCanvas.getContext('2d');

  _dialOverlay.style.cssText = [
    'position:fixed','inset:0','z-index:9000',
    'display:none','align-items:center','justify-content:center',
    'opacity:0','pointer-events:none',
    'background:radial-gradient(ellipse at center,rgba(80,40,140,0.15) 0%,rgba(4,4,14,0.65) 100%)',
    'backdrop-filter:blur(28px) saturate(160%) brightness(0.68)',
    '-webkit-backdrop-filter:blur(28px) saturate(160%) brightness(0.68)',
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
    ].join('');
    document.head.appendChild(ks);
  }
  _dialOverlay.appendChild(_glowEl);

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
  _particlesCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.55';
  _dialOverlay.appendChild(_particlesCanvas);

  (function initNeural(){
    var pctx, nodes, edges, pulses, lastT = 0, animId = null;
    var W = 0, H = 0, CX = 0, CY = 0, DIAL_R = 0;
    var PALETTE = ['#A78BFA', '#22D3EE', '#4ADE80', '#C4B5FD', '#67E8F9', '#86EFAC'];

    // ── v5.154: Capas matemáticas ──────────────────────────────────
    // Geometría Euclidiana: hexágonos áureos rotando lento detrás del dial
    // Vorticial: campo de velocidad rotacional que afecta nodos sutilmente
    // Caos: atractor de Clifford genera trazos lentos en el fondo
    var _euclideanRot = 0;           // fase de rotación de geometría sagrada
    var _vortexT = 0;                // tiempo del campo vortex
    var _chaosPath = [];             // historial de puntos del atractor
    var _chaosX = 0.1, _chaosY = 0;  // estado del atractor de Clifford
    var CLIFFORD = { a: -1.4, b: 1.6, c: 1.0, d: 0.7 }; // parámetros estables
    var PHI = (1 + Math.sqrt(5)) / 2; // razón áurea

    function resize(){
      var dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      CX = W / 2; CY = H / 2;
      DIAL_R = Math.min(W, H) * 0.22;
      _particlesCanvas.width = W * dpr;
      _particlesCanvas.height = H * dpr;
      _particlesCanvas.style.width = W + 'px';
      _particlesCanvas.style.height = H + 'px';
      pctx = _particlesCanvas.getContext('2d');
      pctx.scale(dpr, dpr);
    }

    // ══════════════════════════════════════════════════════════════════
    //  ESTRUCTURA TIPO ANILLO DE DYSON / GALAXIA CIBERNÉTICA
    //  4 anillos concéntricos alrededor del dial. Cada anillo tiene nodos
    //  distribuidos angularmente con jitter mínimo (cubre TODA el área).
    //  Conexiones radiales (dial → afuera) + tangenciales (entre nodos
    //  vecinos del mismo anillo, en arco curvo).
    // ══════════════════════════════════════════════════════════════════
    // ══════════════════════════════════════════════════════════════════
    //  v5.158: MALLADO DENSO SIMÉTRICO + CONSTELACIONES IRREGULARES
    //  • Anillos uniformes (no ease-out) → sin huecos crecientes hacia afuera
    //  • Más radios y más anillos → cobertura completa sin saturar
    //  • Tangenciales con curvatura angular real (arcos siguiendo circunferencia)
    //  • Constelaciones superpuestas: patrones irregulares tipo mapa estelar
    //  • Estrellas de fondo dispersas para llenar zonas residuales
    // ══════════════════════════════════════════════════════════════════
    function buildNetwork(){
      nodes = [];
      edges = [];
      pulses = [];

      // Número de "radios" — más densidad angular para que no haya huecos visibles
      var nRadii = Math.max(20, Math.min(28, Math.floor(Math.min(W, H) / 55)));

      // Anillos: distribución UNIFORME (no ease-out) para densidad constante radial
      var diag = Math.hypot(W/2, H/2);
      var minR = DIAL_R + 75;
      var maxR = diag + 30;
      var nRings = 7;             // más anillos para llenar el espacio sin huecos

      // Offset angular global aleatorio inicial
      var globalAngleOffset = Math.random() * (Math.PI * 2 / nRadii);

      var ringDefs = [];
      for(var ri = 0; ri < nRings; ri++){
        // Uniforme: ri / (nRings - 1)
        var t = ri / (nRings - 1);
        var r = minR + (maxR - minR) * t;
        var color = PALETTE[ri % PALETTE.length];
        ringDefs.push({ r: r, color: color, ringIdx: ri, nodes: [] });
      }

      // Crear nodos: por cada radio, un nodo en cada anillo, mismo ángulo base
      for(var ai = 0; ai < nRadii; ai++){
        var baseAngle = globalAngleOffset + (ai / nRadii) * Math.PI * 2;
        for(var ri2 = 0; ri2 < nRings; ri2++){
          var rd = ringDefs[ri2];
          var angle = baseAngle;
          var r = rd.r;
          var x = CX + Math.cos(angle) * r;
          var y = CY + Math.sin(angle) * r;
          if(x < -40 || x > W + 40 || y < -40 || y > H + 40){
            rd.nodes.push(null);
            continue;
          }
          // Hubs simétricos: cada 4 radios en anillos selectos
          var isHub = (ai % 4 === 0) && (ri2 === 1 || ri2 === Math.floor(nRings/2) + 1);
          var node = {
            x: x, y: y,
            angle: angle,
            baseAngle: angle,
            radialIdx: ai,
            ringR: rd.r,
            ringIdx: ri2,
            color: rd.color,
            phase: ai * 0.4 + ri2 * 0.7,
            speed: 0.45 + (ri2 * 0.08),
            baseR: isHub ? 1.7 : 0.85,
            isHub: isHub,
          };
          rd.nodes.push(node);
          nodes.push(node);
        }
      }

      // ── TANGENCIALES con curvatura angular real (arco siguiendo el anillo) ──
      // En lugar de Bézier al CP afuera, hacemos arc real con 3 puntos
      // intermedios sobre el anillo (suficiente para que se vea como curva)
      ringDefs.forEach(function(rd){
        for(var i = 0; i < nRadii; i++){
          var a = rd.nodes[i];
          var b = rd.nodes[(i + 1) % nRadii];
          if(!a || !b) continue;
          // CP en el punto medio angular, EXACTAMENTE al radio del anillo
          // (no afuera) — esto hace que la curva siga la circunferencia
          var midAngle = a.angle + (Math.PI * 2 / nRadii) / 2;
          var cpx = CX + Math.cos(midAngle) * rd.r;
          var cpy = CY + Math.sin(midAngle) * rd.r;
          edges.push({
            a: a, b: b,
            cp: { x: cpx, y: cpy },
            color: rd.color,
            type: 'tangential',
            ringIdx: rd.ringIdx,
          });
        }
      });

      // ── RADIALES entre anillos adyacentes (sistemáticas) ──
      for(var ai2 = 0; ai2 < nRadii; ai2++){
        for(var ri3 = 0; ri3 < nRings - 1; ri3++){
          var n1 = ringDefs[ri3].nodes[ai2];
          var n2 = ringDefs[ri3 + 1].nodes[ai2];
          if(!n1 || !n2) continue;
          var mx = (n1.x + n2.x) / 2;
          var my = (n1.y + n2.y) / 2;
          // Curvatura mínima alternada por radio
          var dx = n2.x - n1.x, dy = n2.y - n1.y;
          var len = Math.hypot(dx, dy) || 1;
          var perpX = -dy / len, perpY = dx / len;
          var off = (ai2 % 2 === 0 ? 1 : -1) * 4;
          edges.push({
            a: n1, b: n2,
            cp: { x: mx + perpX * off, y: my + perpY * off },
            color: n1.color,
            type: 'radial',
            ringIdx: ri3,
          });
        }
      }

      // ── RAÍCES del dial → primer anillo (una por radio) ──
      for(var ai3 = 0; ai3 < nRadii; ai3++){
        var firstNode = ringDefs[0].nodes[ai3];
        if(!firstNode) continue;
        var ang = firstNode.angle;
        var ox = CX + Math.cos(ang) * DIAL_R;
        var oy = CY + Math.sin(ang) * DIAL_R;
        var virtualOrigin = { x: ox, y: oy, color: firstNode.color, isVirtual: true };
        var mx = (ox + firstNode.x) / 2;
        var my = (oy + firstNode.y) / 2;
        edges.push({
          a: virtualOrigin, b: firstNode,
          cp: { x: mx, y: my },
          color: firstNode.color,
          type: 'root',
          ringIdx: 0,
        });
      }

      // ── v5.158: CONSTELACIONES IRREGULARES ──
      // Capa superpuesta al mallado de anillos. Patrones de 3-6 puntos
      // con forma irregular (no circular) y líneas finas conectándolos.
      // Distribuidas en zonas del viewport.
      buildConstellations();

      // ── v5.158: ESTRELLAS DE FONDO ──
      // Puntos pequeños dispersos por zonas residuales (no conectados)
      buildBackgroundStars();
    }

    // Constelaciones: grupos irregulares con líneas tipo mapa estelar
    function buildConstellations(){
      var nConst = 6; // número de constelaciones
      var diagH = Math.hypot(W/2, H/2);

      for(var c = 0; c < nConst; c++){
        // Posición del centro de la constelación en una zona del viewport
        // (división en sectores angulares para distribución equitativa)
        var sectorAngle = (c / nConst) * Math.PI * 2 + Math.random() * 0.4;
        var sectorDist = diagH * (0.45 + Math.random() * 0.4); // entre 45% y 85% de la diagonal
        var ccx = CX + Math.cos(sectorAngle) * sectorDist;
        var ccy = CY + Math.sin(sectorAngle) * sectorDist;
        // Limitar al viewport
        ccx = Math.max(60, Math.min(W - 60, ccx));
        ccy = Math.max(60, Math.min(H - 60, ccy));

        var color = PALETTE[c % PALETTE.length];
        // Número irregular de puntos en esta constelación
        var nPoints = 3 + Math.floor(Math.random() * 4); // 3-6
        var points = [];
        for(var p = 0; p < nPoints; p++){
          // Distribución irregular alrededor del centro: NO circular
          // Combinación de ángulo random + radio variable
          var ang = Math.random() * Math.PI * 2;
          var radDist = 25 + Math.random() * 55; // distancia variable del centro
          var px = ccx + Math.cos(ang) * radDist;
          var py = ccy + Math.sin(ang) * radDist;
          // Mantener dentro del viewport
          px = Math.max(20, Math.min(W - 20, px));
          py = Math.max(20, Math.min(H - 20, py));
          // No invadir el dial
          if(Math.hypot(px - CX, py - CY) < DIAL_R + 30) continue;
          var star = {
            x: px, y: py,
            color: color,
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 0.4,
            baseR: 0.9 + Math.random() * 0.7,
            isConstellation: true,
            twinkleSpeed: 1.5 + Math.random() * 2.0, // titilan más rápido (estrella)
          };
          // No es Hub ni nodo regular: es una estrella
          points.push(star);
          nodes.push(star);
        }
        if(points.length < 2) continue;

        // Conectar los puntos en patrón irregular: cada punto al SIGUIENTE
        // formando una línea poligonal (no cerrada). Esto da el aspecto de
        // constelación clásica (Osa Mayor, Cassiopeia, etc.)
        for(var pp = 0; pp < points.length - 1; pp++){
          var s1 = points[pp];
          var s2 = points[pp + 1];
          edges.push({
            a: s1, b: s2,
            cp: { x: (s1.x + s2.x)/2, y: (s1.y + s2.y)/2 }, // línea casi recta
            color: color,
            type: 'constellation',
            ringIdx: -1,
          });
        }
        // Conexión extra opcional: cierre del último al primero (forma cerrada)
        // Solo para algunas constelaciones (asterismos cerrados)
        if(points.length >= 4 && Math.random() < 0.4){
          var first = points[0];
          var last = points[points.length - 1];
          edges.push({
            a: last, b: first,
            cp: { x: (last.x + first.x)/2, y: (last.y + first.y)/2 },
            color: color,
            type: 'constellation',
            ringIdx: -1,
          });
        }
      }
    }

    // Estrellas de fondo: puntos pequeños sin conexión, dispersos
    function buildBackgroundStars(){
      var nStars = Math.floor((W * H) / 32000); // densidad ~1 estrella por 32k px²
      nStars = Math.max(10, Math.min(30, nStars));
      for(var s = 0; s < nStars; s++){
        var sx = 30 + Math.random() * (W - 60);
        var sy = 30 + Math.random() * (H - 60);
        // No invadir dial
        if(Math.hypot(sx - CX, sy - CY) < DIAL_R + 25) continue;
        nodes.push({
          x: sx, y: sy,
          color: '#FFFFFF',
          phase: Math.random() * Math.PI * 2,
          speed: 0.2 + Math.random() * 0.5,
          baseR: 0.3 + Math.random() * 0.5,
          isBgStar: true,
        });
      }
    }

    // ══════════════════════════════════════════════════════════════════
    //  ECUACIONES Y CAOS — v5.154
    //  • Espirales logarítmicas (golden ratio φ) superpuestas al campo
    //  • Atractor de Lorenz discretizado → trayectorias caóticas
    //  • Vórtices locales: nodos cerca de hubs reciben deflexión rotacional
    //  • Perturbación fractal (Koch-like) sutil en algunas tangenciales
    // ══════════════════════════════════════════════════════════════════
    var PHI = (1 + Math.sqrt(5)) / 2;          // golden ratio
    var spirals = [];                           // espirales logarítmicas
    var chaosTrajectories = [];                 // partículas Lorenz
    var vortices = [];                          // centros de vórtice

    function initEquations(){
      spirals = [];
      chaosTrajectories = [];
      vortices = [];

      // 2 espirales áureas: una horaria, otra antihoraria, fase desplazada
      for(var s = 0; s < 2; s++){
        spirals.push({
          direction: s === 0 ? 1 : -1,
          phaseOffset: s * Math.PI,
          turns: 3.2,                            // 3+ vueltas completas
          // r = a · e^(b·θ) con b derivado de φ: cot(α) donde α=ángulo áureo
          a: DIAL_R + 18,
          b: 0.306 * (s === 0 ? 1 : 0.85),       // ≈ ln(φ)/(π/2) ajustado
          color: s === 0 ? '#A78BFA' : '#22D3EE',
          rotation: Math.random() * Math.PI * 2, // ángulo inicial
          rotSpeed: (s === 0 ? 0.015 : -0.012),  // rotación lenta
        });
      }

      // Vórtices: ubicar en 2-3 hubs aleatorios
      var hubsArr = nodes.filter(function(n){ return n.isHub; });
      for(var v = 0; v < Math.min(3, hubsArr.length); v++){
        var h = hubsArr[Math.floor(Math.random() * hubsArr.length)];
        if(vortices.some(function(vx){ return vx.hub === h; })) continue;
        vortices.push({
          hub: h,
          strength: 0.4 + Math.random() * 0.5,
          radius: 90 + Math.random() * 40,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // 2 trayectorias caóticas (Lorenz attractor proyectado a 2D)
      for(var c = 0; c < 2; c++){
        chaosTrajectories.push(makeLorenzTraj(c));
      }
    }

    function makeLorenzTraj(idx){
      // v5.155: respawn en zona con menor densidad de pulsos activos
      var cx = CX, cy = CY;
      if(pulses && pulses.length > 0){
        // Probar 6 candidatos aleatorios, elegir el más alejado del pulso más cercano
        var best = null, bestDist = -1;
        for(var k = 0; k < 6; k++){
          var tx = CX + (Math.random() - 0.5) * (W * 0.7);
          var ty = CY + (Math.random() - 0.5) * (H * 0.7);
          // Distancia al pulso más cercano
          var minD = Infinity;
          for(var pi = 0; pi < pulses.length; pi++){
            var pp = pulses[pi];
            var pt = bezierPoint(pp.edge.a, pp.edge.cp, pp.edge.b, pp.t);
            var d = Math.hypot(tx - pt.x, ty - pt.y);
            if(d < minD) minD = d;
          }
          if(minD > bestDist){ bestDist = minD; best = { x: tx, y: ty }; }
        }
        if(best){ cx = best.x; cy = best.y; }
      } else {
        cx = CX + (Math.random() - 0.5) * (W * 0.5);
        cy = CY + (Math.random() - 0.5) * (H * 0.5);
      }
      return {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: 5 + Math.random() * 10,
        history: [],
        color: (idx === 0 || (typeof idx === 'undefined' && Math.random() < 0.5)) ? '#4ADE80' : '#C4B5FD',
        scale: 12 + Math.random() * 6,
        centerX: cx,
        centerY: cy,
        sigma: 10, rho: 28, beta: 8/3,
        // v5.155: vida útil — fade in/out y luego respawn
        age: 0,
        maxAge: 7 + Math.random() * 5, // 7-12 segundos
      };
    }

    function stepLorenz(traj, dt){
      // v5.155: avanzar edad, marcar para respawn si excede vida útil
      traj.age += dt;
      if(traj.age >= traj.maxAge){
        // Reemplazar con nueva trayectoria en zona despejada
        var idx = chaosTrajectories.indexOf(traj);
        if(idx >= 0) chaosTrajectories[idx] = makeLorenzTraj(idx);
        return;
      }
      // Sistema clásico de Lorenz:
      var step = dt * 0.4;
      var dx = traj.sigma * (traj.y - traj.x);
      var dy = traj.x * (traj.rho - traj.z) - traj.y;
      var dz = traj.x * traj.y - traj.beta * traj.z;
      traj.x += dx * step;
      traj.y += dy * step;
      traj.z += dz * step;
      var px = traj.centerX + traj.x * traj.scale * 0.5;
      var py = traj.centerY + (traj.z - traj.rho) * traj.scale * 0.5;
      // Si se sale del viewport: respawn inmediato
      if(px < 0 || px > W || py < 0 || py > H){
        var idx2 = chaosTrajectories.indexOf(traj);
        if(idx2 >= 0) chaosTrajectories[idx2] = makeLorenzTraj(idx2);
        return;
      }
      traj.history.push({ x: px, y: py });
      // v5.155: trail más corto (50 puntos) y descarte progresivo
      if(traj.history.length > 50) traj.history.shift();
    }

    function drawChaosTrajectories(){
      chaosTrajectories.forEach(function(traj){
        if(traj.history.length < 2) return;
        // v5.155: fade-in al spawn, fade-out cerca del fin de vida
        var lifeFrac = traj.age / traj.maxAge;
        var globalAlpha = 1;
        if(lifeFrac < 0.15) globalAlpha = lifeFrac / 0.15;           // fade-in
        else if(lifeFrac > 0.75) globalAlpha = (1 - lifeFrac) / 0.25; // fade-out
        globalAlpha = Math.max(0, Math.min(1, globalAlpha));
        if(globalAlpha < 0.02) return;

        pctx.lineCap = 'round';
        pctx.lineJoin = 'round';
        for(var i = 1; i < traj.history.length; i++){
          var a = (i / traj.history.length) * 0.55 * globalAlpha;
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
        pctx.arc(head.x, head.y, 1.5 * globalAlpha, 0, Math.PI * 2);
        pctx.fill();
        pctx.shadowBlur = 0;
      });
    }

    function drawSpirals(t){
      spirals.forEach(function(sp, idx){
        sp.rotation += sp.rotSpeed * 0.016;
        // v5.155: pulsación de visibilidad — cada espiral late con periodo distinto.
        // Pasa de casi invisible a ligeramente visible y de regreso.
        if(sp.lifePhase === undefined) sp.lifePhase = idx * Math.PI;
        sp.lifePhase += 0.006; // periodo ~17 seg
        var pulse = (Math.sin(sp.lifePhase) + 1) / 2; // 0..1
        var alpha = pulse * 0.18; // máximo 0.18 (antes era 0.14 constante)
        if(alpha < 0.02) return;

        pctx.beginPath();
        var maxR = Math.hypot(W/2, H/2);
        var prev = null;
        var steps = 220;
        var thetaMax = sp.turns * Math.PI * 2;
        for(var i = 0; i <= steps; i++){
          var theta = (i / steps) * thetaMax;
          var r = sp.a * Math.exp(sp.b * theta);
          if(r > maxR) break;
          var ang = sp.direction * theta + sp.rotation + sp.phaseOffset;
          var x = CX + Math.cos(ang) * r;
          var y = CY + Math.sin(ang) * r;
          if(!prev) pctx.moveTo(x, y);
          else pctx.lineTo(x, y);
          prev = { x: x, y: y };
        }
        var alphaHex = Math.floor(alpha * 255).toString(16).padStart(2, '0');
        pctx.strokeStyle = sp.color + alphaHex;
        pctx.lineWidth = 0.8;
        pctx.stroke();
      });
    }

    function applyVortexDeflection(){
      // v5.155: la deflexión se REINICIA cada vez (no acumula permanentemente).
      // Cada nodo tiene un baseAngle. Los vórtices crean un offset temporal.
      // Cuando se aleja del vórtice o este "se mueve", el nodo se relaja a baseAngle.
      vortices.forEach(function(vx){
        vx.phase += 0.015;
      });
      // Decay: cada nodo de ANILLO vuelve poco a poco a su baseAngle
      nodes.forEach(function(n){
        if(n.isConstellation || n.isBgStar) return;
        if(n.baseAngle === undefined) n.baseAngle = n.angle;
        var deviation = n.angle - n.baseAngle;
        while(deviation > Math.PI) deviation -= Math.PI * 2;
        while(deviation < -Math.PI) deviation += Math.PI * 2;
        n.angle -= deviation * 0.008;
      });
      // Aplicar influencia activa de cada vórtice (solo a nodos de anillo)
      vortices.forEach(function(vx){
        nodes.forEach(function(n){
          if(n === vx.hub || n.isConstellation || n.isBgStar) return;
          var dx = n.x - vx.hub.x, dy = n.y - vx.hub.y;
          var d = Math.hypot(dx, dy);
          if(d > vx.radius || d < 5) return;
          var influence = (1 - d / vx.radius) * vx.strength * 0.0008;
          n.angle += influence;
        });
      });
      // Recalcular posiciones (solo nodos de anillo)
      nodes.forEach(function(n){
        if(n.isConstellation || n.isBgStar) return;
        n.x = CX + Math.cos(n.angle) * n.ringR;
        n.y = CY + Math.sin(n.angle) * n.ringR;
      });
    }

    function drawVortexHints(){
      // Hint visual: aro tenue rotando alrededor del centro del vórtice
      vortices.forEach(function(vx){
        for(var i = 0; i < 3; i++){
          var ringR = (i + 1) * 18;
          if(ringR > vx.radius) break;
          var ang = vx.phase + i * 0.8;
          pctx.beginPath();
          pctx.arc(vx.hub.x, vx.hub.y, ringR, ang, ang + Math.PI * 1.3);
          pctx.strokeStyle = vx.hub.color + '20';
          pctx.lineWidth = 0.5;
          pctx.stroke();
        }
      });
    }

    function bezierPoint(a, cp, b, t){
      var u = 1 - t;
      return {
        x: u*u*a.x + 2*u*t*cp.x + t*t*b.x,
        y: u*u*a.y + 2*u*t*cp.y + t*t*b.y,
      };
    }

    // Spawn pulso por una edge. v5.155: detecta zonas vacías —
    // de varios candidatos elige el que esté más lejos de pulsos existentes.
    function spawnPulse(){
      if(!edges.length) return;
      var r = Math.random();
      var pool = [];
      if(r < 0.40) pool = edges.filter(function(e){ return e.type === 'root'; });
      else if(r < 0.75) pool = edges.filter(function(e){ return e.type === 'tangential'; });
      else pool = edges.filter(function(e){ return e.type === 'radial'; });
      if(!pool.length) pool = edges;

      // Elegir entre 4 candidatos el más alejado de pulsos activos
      var bestEdge = null, bestScore = -1;
      var nCand = Math.min(4, pool.length);
      for(var k = 0; k < nCand; k++){
        var cand = pool[Math.floor(Math.random() * pool.length)];
        // Punto medio de la edge candidata
        var mid = bezierPoint(cand.a, cand.cp, cand.b, 0.5);
        // Distancia mínima al pulso activo más cercano
        var minD = Infinity;
        for(var pi = 0; pi < pulses.length; pi++){
          var pp = pulses[pi];
          var pt = bezierPoint(pp.edge.a, pp.edge.cp, pp.edge.b, pp.t);
          var dd = Math.hypot(mid.x - pt.x, mid.y - pt.y);
          if(dd < minD) minD = dd;
        }
        if(minD > bestScore){ bestScore = minD; bestEdge = cand; }
      }
      var edge = bestEdge || pool[0];
      var forward = edge.type === 'root' ? (Math.random() < 0.85) : (Math.random() < 0.5);
      pulses.push({
        edge: edge,
        t: 0,
        speed: 0.35 + Math.random() * 0.40,
        forward: forward,
        life: 1,
        color: edge.color,
        tailT: 0.18 + Math.random() * 0.12,
        isRoot: edge.type === 'root',
      });
    }

    function drawEdge(e){
      var alphaHex = '22';
      var lw = 0.7;
      if(e.type === 'root'){
        // v5.159: raíces SIEMPRE visibles a 360° (alpha más alto, líneas más gruesas)
        alphaHex = '88';
        lw = 1.4;
      }
      else if(e.type === 'tangential'){ alphaHex = '2a'; lw = 0.9; }
      else if(e.type === 'constellation'){
        alphaHex = '38';
        lw = 0.6;
      }
      pctx.strokeStyle = e.color + alphaHex;
      pctx.lineWidth = lw;
      pctx.beginPath();
      pctx.moveTo(e.a.x, e.a.y);
      pctx.quadraticCurveTo(e.cp.x, e.cp.y, e.b.x, e.b.y);
      pctx.stroke();
    }

    function drawPulse(p){
      var e = p.edge;
      var t = p.forward ? p.t : (1 - p.t);
      var samples = [];
      var steps = 12;
      for(var i = 0; i <= steps; i++){
        var tt = t - (p.forward ? 1 : -1) * (i / steps) * p.tailT;
        if(tt < 0 || tt > 1) continue;
        var pt = bezierPoint(e.a, e.cp, e.b, tt);
        samples.push({ pt: pt, alpha: 1 - (i / steps) });
      }
      if(samples.length < 2) return;
      pctx.lineCap = 'round';
      pctx.lineJoin = 'round';
      for(var s = 1; s < samples.length; s++){
        var a = samples[s].alpha * p.life * 0.95;
        pctx.strokeStyle = p.color + Math.floor(a * 220).toString(16).padStart(2, '0');
        pctx.lineWidth = (p.isRoot ? 2.2 : 1.7) * samples[s].alpha;
        pctx.beginPath();
        pctx.moveTo(samples[s-1].pt.x, samples[s-1].pt.y);
        pctx.lineTo(samples[s].pt.x, samples[s].pt.y);
        pctx.stroke();
      }
      var head = bezierPoint(e.a, e.cp, e.b, t);
      pctx.fillStyle = p.color;
      pctx.shadowColor = p.color;
      pctx.shadowBlur = p.isRoot ? 16 : 10;
      pctx.beginPath();
      pctx.arc(head.x, head.y, p.isRoot ? 2.6 : 2.1, 0, Math.PI * 2);
      pctx.fill();
      pctx.shadowBlur = 0;
    }

    function frame(t){
      var dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 0.016;
      lastT = t;
      if(!pctx){ animId = requestAnimationFrame(frame); return; }
      pctx.clearRect(0, 0, W, H);

      // 0a) Espirales áureas de fondo (debajo de todo)
      drawSpirals(t);

      // 0b) Hints visuales de vórtices
      drawVortexHints();

      // 1) Dibujar edges en 2 pasadas:
      //    primero las no-root (fondo del mallado),
      //    luego las roots encima para que las trayectorias del centro
      //    sean siempre claramente visibles a 360° (v5.159)
      for(var ei = 0; ei < edges.length; ei++){
        if(edges[ei].type !== 'root') drawEdge(edges[ei]);
      }
      for(var er = 0; er < edges.length; er++){
        if(edges[er].type === 'root') drawEdge(edges[er]);
      }

      // 1b) Vórtices: deflexión angular sobre nodos cercanos
      applyVortexDeflection();

      // 2) Rotación orbital + render de nodos
      for(var ni = 0; ni < nodes.length; ni++){
        var n = nodes[ni];
        // Solo los nodos de anillos rotan; constelaciones y bg-stars son fijos
        if(!n.isConstellation && !n.isBgStar){
          var dir = n.ringIdx % 2 === 0 ? 1 : -1;
          var angVel = dir * 0.018 / (1 + n.ringIdx * 0.35);
          n.angle += angVel * dt;
          n.baseAngle = (n.baseAngle || n.angle) + angVel * dt;
          n.x = CX + Math.cos(n.angle) * n.ringR;
          n.y = CY + Math.sin(n.angle) * n.ringR;
        }

        // Pulso visual del nodo
        n.phase += (n.twinkleSpeed || n.speed) * dt;
        var pulse = (Math.sin(n.phase) + 1) / 2;
        var r, alpha, blur;
        if(n.isBgStar){
          // Estrellas de fondo: muy pequeñas, titileo blanco
          r = n.baseR * (0.7 + pulse * 0.6);
          alpha = 0.3 + pulse * 0.5;
          blur = 2 + pulse * 4;
        } else if(n.isConstellation){
          // Estrellas de constelación: más prominentes, titileo más fuerte
          r = n.baseR * (0.8 + pulse * 0.8);
          alpha = 0.5 + pulse * 0.5;
          blur = 4 + pulse * 8;
        } else {
          // Nodos de anillo
          r = n.baseR + pulse * (n.isHub ? 1.8 : 1.2);
          alpha = 0.4 + pulse * 0.5;
          blur = (n.isHub ? 10 : 6) + pulse * (n.isHub ? 14 : 8);
        }
        pctx.fillStyle = n.color + Math.floor(alpha * 220).toString(16).padStart(2, '0');
        pctx.shadowColor = n.color;
        pctx.shadowBlur = blur;
        pctx.beginPath();
        pctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        pctx.fill();
      }
      pctx.shadowBlur = 0;

      // Recalcular las curvas de edges porque los nodos se movieron
      // (solo recalcular control points de tangenciales y radiales si los nodos rotan)
      // Para eficiencia: aceptamos un pequeño desfase. Las curvas siguen viéndose bien.

      // 3) Avanzar pulsos
      for(var pi = pulses.length - 1; pi >= 0; pi--){
        var p = pulses[pi];
        p.t += p.speed * dt;
        if(p.t > 1 + p.tailT){ pulses.splice(pi, 1); continue; }
        if(p.t > 1){ p.life = Math.max(0, 1 - (p.t - 1) / p.tailT); }
        drawPulse(p);
      }

      // 4) Spawn — v5.153: densidad reducida para no saturar
      if(pulses.length < 10 && Math.random() < 0.06){
        spawnPulse();
      }

      // 5) Lorenz attractor: avanzar y dibujar trayectorias caóticas
      chaosTrajectories.forEach(function(traj){
        stepLorenz(traj, dt);
      });
      drawChaosTrajectories();

      animId = requestAnimationFrame(frame);
    }

    function start(){
      resize();
      buildNetwork();
      initEquations(); // v5.154: espirales áureas, vórtices, Lorenz
      // Pre-spawn: poblar el campo desde el principio
      for(var i = 0; i < 4; i++){
        var e = edges[Math.floor(Math.random() * edges.length)];
        if(!e) continue;
        pulses.push({
          edge: e,
          t: Math.random(),
          speed: 0.35 + Math.random() * 0.4,
          forward: e.type === 'root' ? true : (Math.random() < 0.5),
          life: 1,
          color: e.color,
          tailT: 0.20,
          isRoot: e.type === 'root',
        });
      }
      lastT = 0;
      if(animId) cancelAnimationFrame(animId);
      animId = requestAnimationFrame(frame);
    }

    function stop(){
      if(animId){ cancelAnimationFrame(animId); animId = null; }
    }

    window._particlesStart = start;
    window._particlesStop  = stop;

    window.addEventListener('resize', function(){
      if(_particlesCanvas.offsetParent !== null){
        resize();
        buildNetwork();
        initEquations();
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
      '.hud-h{display:flex;align-items:center;gap:10px;padding:14px 16px 12px}',
      '.hud-h-ico{width:28px;height:28px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.hud-h-ico i{font-size:12px}',
      '.hud-h-t{font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;flex:1}',
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
      '.hud-hero-lbl{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(200,208,230,0.40);margin-bottom:6px}',
      '.hud-hero-v{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1;font-family:JetBrains Mono,ui-monospace,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.hud-hero-v .cents{font-size:18px;opacity:.45;font-weight:700}',
      '.hud-hero-chip{padding:5px 9px;border-radius:7px;font-size:10px;font-weight:800;letter-spacing:.06em;display:flex;flex-direction:column;align-items:flex-end;gap:1px;line-height:1.1;flex-shrink:0}',
      '.hud-hero-chip .chip-sub{font-size:8px;font-weight:600;opacity:.7;text-transform:uppercase;letter-spacing:.10em}',
      // mini-bar (fondo emergencia)
      '.hud-mini{padding:0 16px 14px}',
      '.hud-mini-row{display:flex;align-items:center;justify-content:space-between;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(200,208,230,0.50);margin-bottom:6px}',
      '.hud-mini-row .v{font-size:11px;font-weight:800;color:var(--ac);letter-spacing:0;text-transform:none;font-family:JetBrains Mono,monospace;white-space:nowrap}',
      '.hud-mini-bar{height:5px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.04)}',
      '.hud-mini-fill{height:100%;border-radius:999px;transition:width .8s ease}',
      // row
      '.hud-row{display:flex;align-items:center;gap:10px;padding:8px 16px}',
      '.hud-row + .hud-row{border-top:1px solid rgba(255,255,255,0.04)}',
      '.hud-row-ico{width:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px}',
      '.hud-row-l{flex:1;min-width:0;font-size:13px;font-weight:600;color:rgba(220,224,235,0.78);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-row-bar{width:60px;height:3px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;flex-shrink:0}',
      '.hud-row-bar > div{height:100%;width:0;border-radius:999px;transition:width .8s ease}',
      '.hud-row-v{font-size:13px;font-weight:700;letter-spacing:0;flex-shrink:0;text-align:right;min-width:78px;font-family:JetBrains Mono,monospace;white-space:nowrap}',
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
      '.hud-cta{display:flex;align-items:center;justify-content:space-between;padding:11px 16px;cursor:pointer;border-top:1px solid var(--ac-15);transition:padding .15s,background .15s}',
      '.hud-cta:hover{background:var(--ac-08);padding-left:20px}',
      '.hud-cta .lbl{font-size:10px;font-weight:800;letter-spacing:.16em;text-transform:uppercase}',
      '.hud-cta .chev{font-size:9px;opacity:.7}',
      // duo (Activity+Logros)
      '.hud-trio{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:12px 16px}',
      '.hud-trio-cell{padding:10px 8px;border-radius:9px;border:1px solid;text-align:left;position:relative;overflow:hidden;background:rgba(255,255,255,0.02)}',
      '.hud-trio-cell .top{position:absolute;top:0;left:0;right:0;height:2px}',
      '.hud-trio-cell .lbl{font-size:8px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;margin-bottom:5px;opacity:.85}',
      '.hud-trio-cell .v{font-size:18px;font-weight:800;line-height:1;font-family:JetBrains Mono,monospace;white-space:nowrap}',
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
      '.hud-megatabs{display:flex;align-items:stretch;gap:4px;padding:4px 8px 0;border-bottom:1px solid rgba(255,255,255,0.06)}',
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
      '.hud-card-l{font-size:8.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}',
      '.hud-card-r{font-size:10.5px;font-weight:800;font-family:JetBrains Mono,monospace;white-space:nowrap}',
      '.hud-card-sub{font-size:10.5px;font-weight:600;color:rgba(220,224,235,0.62);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
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
        'style="width:48px;height:14px;flex-shrink:0;opacity:.65" aria-hidden="true">'+
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
  document.getElementById('hud-megatabs').addEventListener('click', function(e){
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

  // ── Reposicionar HUD ──
  function _reposicionarHUD(){
    if(!_dialCanvas||!window._hudPanels) return;
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
    // Para detectar caso 2 miramos si _dialCanvas tiene transform inline o si
    // hay paneles con _animatingEntry (apertura en curso). En ambos casos
    // calculamos el rect final del dial centrado en el viewport.
    var _hayApertura = !window._hudExpanded && window._hudPanels.some(function(hp){ return hp.el && hp.el._animatingEntry; });
    if(window._hudReturningFromExpand && !window._hudExpanded){
      var _fSize = _calcDialSize();
      var _fLeft = Math.round((vW - _fSize) / 2);
      var _fTop  = Math.round((vH - _fSize) / 2);
      r = {
        left:   _fLeft,
        top:    _fTop,
        right:  _fLeft + _fSize,
        bottom: _fTop  + _fSize,
        width:  _fSize,
        height: _fSize,
      };
    } else if(_hayApertura){
      // Durante la apertura inicial el dial tiene scale(0.85) y boundingClientRect
      // devuelve un rect chico. Usar el rect final del dial al tamaño normal.
      var _fSize2 = _calcDialSize();
      var _fLeft2 = Math.round((vW - _fSize2) / 2);
      var _fTop2  = Math.round((vH - _fSize2) / 2);
      r = {
        left:   _fLeft2,
        top:    _fTop2,
        right:  _fLeft2 + _fSize2,
        bottom: _fTop2  + _fSize2,
        width:  _fSize2,
        height: _fSize2,
      };
    }

    // Chamfers por posición
    var chamferRect = 'polygon(10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px),0 10px)';
    var chamferLeft  = 'polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,14px 100%,0 calc(100% - 14px))';
    var chamferRight = 'polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)';

    function getTop(side){
      return window._hudPanels.filter(function(hp){ return hp.el._side===side; });
    }

    var expandedEl = window._hudExpanded;

    // ══════════════════════════════════════════════════════════════════════
    //  MODO EXPANDIDO — un panel ocupa el centro, dial achicado abajo
    // ══════════════════════════════════════════════════════════════════════
    if(expandedEl){
      // Zona disponible verticalmente: entre la fila top (USER/Sim/Stats)
      // y la fila bottom (Misión/Logro/Nivel). El panel se centra ahí.
      var topRowBottom = parseFloat(_pUser.style.top || 0) +
                         (_pUser.offsetHeight || 100) + GAP*2;
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
      var reservaLat = (COL_W_exp + GAP*2) * 2;
      var centerW = Math.min(1100, vW - reservaLat);
      var centerX = Math.round((vW - centerW) / 2);

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
    var topMaxH = Math.max(hUser, hSim, hStats, 50);
    // USER y Stats NO se estiran. Solo se centran verticalmente con Sim:
    // aplicamos un transform translateY a sus inline top.

    var topY = topPad;
    // Sim banda toma su altura natural. USER y Stats se centran verticalmente
    // contra el Sim banda calculando un top ajustado:
    //   top_user = topY + (hSim - hUser)/2
    // así sus centros verticales coinciden.
    var topYUser  = topY + Math.max(0, Math.round((hSim - hUser) / 2));
    var topYStats = topY + Math.max(0, Math.round((hSim - hStats) / 2));
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
    var colTopY    = topY + topMaxH + 8;
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
      // Medir alturas naturales SIN forzar maxHeight (sin scroll vertical).
      // Si la suma excede colVAvail, los paneles se extienden hacia abajo
      // libremente y pueden solaparse con la zona del track. Es preferible
      // a tener scroll interno en cada panel, que se siente mal.
      var heights = panels.map(function(hp){
        return hp.el.scrollHeight || hp.el.offsetHeight || 200;
      });
      var totalH = heights.reduce(function(s,h){ return s+h+GAP; },0) - GAP;

      // Gap entre paneles: GAP normal. Si no cabe, reducir un poco
      // (sin llegar a 0) para minimizar el overflow.
      var gapBetween = GAP;
      if(totalH > colVAvail && panels.length > 1){
        var extra = totalH - colVAvail;
        var gapsCount = panels.length - 1;
        gapBetween = Math.max(8, GAP - Math.ceil(extra / gapsCount));
      }

      var curY = colTopY;
      var chamfer = isLeft ? chamferLeft : chamferRight;
      panels.forEach(function(hp, idx){
        var h = heights[idx];
        hp.el.style.top      = Math.round(curY) + 'px';
        hp.el.style.clipPath = chamfer;
        curY += h + gapBetween;
      });
    }

    // Posicionar las 4 columnas con su ancho fijo (o las 2 del fallback)
    if(fourCols){
      positionCol(pColA, colA_X, COL_W, true);
      positionCol(pColB, colB_X, COL_W, true);
      positionCol(pColC, colC_X, COL_W, false);
      positionCol(pColD, colD_X, COL_W, false);
    } else {
      positionCol(pColA, leftX,  leftW,  true);
      positionCol(pColC, rightX, rightW, false);
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
      html: function(){
        return ''+
          // v5.149: sin overflow:auto en tabla — la card crece dinámica
          '<div style="display:flex;gap:14px;align-items:stretch;min-height:400px">'+
            '<div id="hud-fijos-tabla" style="flex:1.1;min-width:0;display:flex;align-items:flex-start"></div>'+
            '<div id="hud-fijos-grafica" style="flex:0.9;min-width:0;display:flex;flex-direction:column;min-height:300px;justify-content:flex-start">'+
              '<div id="graf-fijos-loading-hud-fijos-tabla" style="text-align:center;padding:24px;color:rgba(220,224,235,0.40)">Cargando gráfica…</div>'+
              '<canvas id="graf-fijos-canvas-hud-fijos-tabla" style="display:none;min-height:280px"></canvas>'+
              '<div id="graf-fijos-leyenda-hud-fijos-tabla" style="display:flex;flex-wrap:wrap;gap:6px;padding:8px 0"></div>'+
            '</div>'+
          '</div>';
      },
      hydrate: function(){
        if(typeof renderAnualidad === 'function' && window._fijosAnualidadData){
          renderAnualidad(window._fijosAnualidadData, 'hud-fijos-tabla');
        } else if(typeof api !== 'undefined' && api.getGastos){
          api.getGastos().then(function(d){
            window._fijosAnualidadData = d;
            renderAnualidad(d, 'hud-fijos-tabla');
          }).catch(function(){});
        } else {
          var el = document.getElementById('hud-fijos-tabla');
          if(el) el.innerHTML = '<div style="padding:24px;text-align:center;color:rgba(220,224,235,0.40)">Sin datos</div>';
        }
      },
    },
    // ── VARIABLES ──
    'hud-variables': {
      html: function(){
        return ''+
          '<div style="display:flex;gap:14px;flex:1;min-height:0;align-items:stretch">'+
            '<div id="hud-var-tabla" style="flex:1.1;min-width:0;overflow:auto;display:flex;align-items:center"></div>'+
            '<div id="hud-var-grafica" style="flex:0.9;min-width:0;display:flex;flex-direction:column;min-height:0;justify-content:center">'+
              '<div id="graf-loading-hud-var-tabla" style="text-align:center;padding:24px;color:rgba(220,224,235,0.40)">Cargando gráfica…</div>'+
              '<canvas id="graf-canvas-hud-var-tabla" style="display:none;flex:1;min-height:200px;max-height:100%"></canvas>'+
              '<div id="graf-leyenda-hud-var-tabla" style="display:flex;flex-wrap:wrap;gap:6px;padding:8px 0"></div>'+
            '</div>'+
          '</div>';
      },
      hydrate: function(){
        if(typeof renderGastos === 'function' && typeof datosMes !== 'undefined' && datosMes && datosMes.meses){
          renderGastos('hud-var-tabla');
          if(typeof initGraficas === 'function') initGraficas(datosMes, '-hud-var-tabla');
        } else if(typeof api !== 'undefined' && api.getDatosMes){
          api.getDatosMes().then(function(d){
            window.datosMes = d;
            renderGastos('hud-var-tabla');
            if(typeof initGraficas === 'function') initGraficas(d, '-hud-var-tabla');
          }).catch(function(){});
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
          var rows = '';
          if(items && items.length){
            rows = items.slice(0,8).map(function(it){
              var fecha = it.fecha ? new Date(it.fecha).toLocaleDateString('es-MX',{day:'2-digit',month:'short'}) : '';
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

    // v5.147: medir altura natural del contenido sin restricciones
    panel.style.height = 'auto';
    panel.style.minHeight = '0';
    expContent.style.overflow = 'visible';
    expContent.style.justifyContent = 'flex-start';
    expContent.style.height = 'auto';
    expContent.style.flex = 'none';

    // Forzar reflow
    var contentNaturalH = panel.scrollHeight;

    // Restaurar flex
    expContent.style.flex = '';
    expContent.style.height = '';

    // Si la medición fue muy chica, contenido aún no listo — reintentar
    if(contentNaturalH < 100 && intentos < 8){
      panel.style.height = zonaH + 'px';
      panel.style.minHeight = '280px';
      setTimeout(function(){ _hudAjustarTamañoExpandido(intentos+1); }, 100);
      return;
    }

    // v5.147: el panel CRECE para mostrar todo su contenido sin scroll interno.
    // Limitamos solo al viewport (vh - margen) para no salirse de pantalla.
    var maxH = window.innerHeight - 80; // margen para barra superior + bottom
    contentNaturalH = Math.max(280, contentNaturalH);
    var finalH = Math.min(contentNaturalH, maxH);

    // Centrar el panel verticalmente respecto a la zona disponible si cabe ahí,
    // o subirlo hasta ~40px del top si necesita más espacio que zonaH.
    var finalY;
    if(contentNaturalH <= zonaH){
      // Cabe en la zona normal: centrar dentro
      finalY = zonaY + Math.max(0, Math.round((zonaH - finalH)/2));
    } else {
      // Necesita más alto: subir y dejar margen mínimo del top
      finalY = Math.max(80, zonaY - Math.round((finalH - zonaH)/2));
      // Si aún se sale por abajo, ajustar
      if(finalY + finalH > window.innerHeight - 20){
        finalY = Math.max(80, window.innerHeight - 20 - finalH);
      }
    }

    panel.style.height = finalH + 'px';
    panel.style.minHeight = finalH + 'px';
    panel.style.top = finalY + 'px';

    // v5.147: solo poner scroll si el contenido NATURAL es mayor que el viewport
    // (no que zonaH). Lo normal es que contenido<=maxH y NO haya scroll.
    if(contentNaturalH <= maxH){
      expContent.style.overflow = 'visible';
      expContent.style.justifyContent = 'flex-start';
    } else {
      expContent.style.overflow = 'auto';
      expContent.style.justifyContent = 'flex-start';
    }
  }
  window._hudAjustarTamañoExpandido = _hudAjustarTamañoExpandido;

  function _hudExpand(panelEl){
    if(!panelEl) return;
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

  _dialOverlay.addEventListener('click',function(e){ if(e.target===_dialOverlay) cerrarDial(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'&&_dialVisible) cerrarDial(); });

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
  function loop(){
    _dialPulseT++;
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
  // v5.127: hacer que +Nueva produzca el mismo estado que DOMContentLoaded.
  //
  // En la PRIMERA carga: _dialOverlay=null. Después abrirDial llama
  // _crearDialOverlay que crea canvas+glow+ring Y REGISTRA todos los
  // listeners del dial. Los paneles _pUser etc. ya existen en el DOM
  // desde el IIFE inicial, con todos sus listeners (megatabs, expand
  // buttons, etc.) ya registrados al momento de su creación.
  //
  // En +Nueva: _dialOverlay existe con su canvas y sus listeners ya
  // registrados. Si NO destruyo _dialOverlay, los listeners siguen
  // funcionando pero el canvas tiene estilos residuales que rompen el
  // primer _reposicionarHUD. Si SÍ destruyo _dialOverlay, _crearDialOverlay
  // recrea canvas+listeners → todo bien por ese lado.
  //
  // Los paneles NO se tocan (sus listeners siguen vivos). Solo limpio
  // QUIRÚRGICAMENTE las propiedades de posicionamiento que abrirDial
  // necesita resetear (left/top/width/etc.). NO tocar cssText ni los
  // estilos visuales (background/border/animation), porque eso rompe
  // el aspecto de los paneles y los listeners CSS-driven (hovers, etc.)
  if(_dialOverlay && _dialOverlay.parentNode){
    _dialOverlay.parentNode.removeChild(_dialOverlay);
  }
  _dialOverlay = null;
  _dialCanvas  = null;
  _dialCtx     = null;
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
  abrirDial();
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

function abrirDial(){
  _crearDialOverlay();
  _dialHovered=-1; _dialSubHov=-1; _dialActiveSub=-1; _dialCentroHov=false; _detenerPulsoCentro();

  // v5.125: el modo rápido fue eliminado. +Nueva ahora destruye el
  // overlay y deja que abrirDial corra IGUAL que en DOMContentLoaded.

  // ── FLUJO NORMAL (cascada larga, igual para DOMContentLoaded y +Nueva) ──

  if(!_dialBreathRAF){
    (function _breathLoop(){
      _dialBreathT++;
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

  // v5.149: iniciar animación de partículas/circuit-board
  if(typeof window._particlesStart === 'function'){
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
  var btn=document.getElementById('btn-nueva-entrada');
  if(btn) btn.classList.add('active');
}

function cerrarDial(){
  if(!_dialOverlay){ _dialVisible=false; return; }
  _dialOverlay.style.transition = 'opacity 280ms cubic-bezier(.4,0,.6,1)';
  _dialOverlay.style.opacity = '0';
  _dialOverlay.style.pointerEvents = 'none';
  _dialVisible = false; _dialActiveSub=-1; _dialCentroHov=false; _detenerPulsoCentro();
  window._hudCascadaEnCurso = false;
  // v5.149: detener animación de partículas
  if(typeof window._particlesStop === 'function'){
    setTimeout(function(){ window._particlesStop(); }, 320);
  }
  if(_dialBreathRAF){ cancelAnimationFrame(_dialBreathRAF); _dialBreathRAF=null; _dialBreathT=0; }
  var btn=document.getElementById('btn-nueva-entrada');
  if(btn) btn.classList.remove('active');
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
  cerrarDial();
  var dd=document.getElementById('entrada-dropdown');
  var btn=document.getElementById('btn-nueva-entrada');
  if(dd){ dd.classList.remove('show'); dd.style.display='none'; }
  if(btn) btn.classList.remove('active');
  var p1=document.getElementById('entrada-paso1');
  var p2=document.getElementById('entrada-paso2');
  if(p1) p1.style.display='block';
  if(p2) p2.style.display='none';
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

  var _dialLandingUsed = false;

  // ── APERTURA INICIAL: usar el mismo timeline de abrirDial ──
  // (antes este bloque tenía su propia animación rota — todo aparecía a la vez).
  // abrirDial() ya tiene la secuencia correcta:
  //   t=0      backdrop fade-in
  //   t=300    aro circular pulsante
  //   t=1100   cascada de paneles
  //   t=2900   slots vacíos
  //   t=3300   dial canvas
  //   t=4800   cleanup + vida
  abrirDial();

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

  _dialOverlay.addEventListener('click', function(e){
    if(e.target === _dialOverlay) cerrarDial();
  });
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

  window.addEventListener('resize', function(){
    if(_dialVisible && typeof _reposicionarHUD==='function'){
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
        if(_dialVisible && typeof _reposicionarHUD==='function'){
          _resetDuroLayout();
          _reposicionarHUD();
        }
      }, 80);
    });
  }

  var _origCerrarDial = cerrarDial;
  cerrarDial = function(){
    if(!_dialLandingUsed){
      _dialLandingUsed = true;
      // El primer cierre desde el landing usa el mismo fade-out del cerrarDial
      // estándar para que se vea suave. Antes era un cierre instantáneo (display:none)
      // y se veía corte. Llamamos a la implementación original.
      var anv = document.getElementById('board-anverso');
      if(anv){
        anv.style.display = '';
        anv.style.visibility = '';
        anv.style.opacity = '1';
      }
      _origCerrarDial();
    } else {
      _origCerrarDial();
    }
  };

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