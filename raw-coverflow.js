/* RAW Entry — Cover Flow Nivel 1 v.7.069
   ╔══════════════════════════════════════════════════════════════════╗
   ║ FASE v7.069 — COVER FLOW DESACTIVADO                             ║
   ╚══════════════════════════════════════════════════════════════════╝
   El v7.067 intentó introducir Cover Flow en el Nivel 1 pero rompía:
     · Las cards superiores (USER, SIM, STATS) desaparecían porque mi
       CSS afectaba TODAS las .hud-pnl no expandidas, no solo las
       laterales-expandibles.
     · El watcher de cambios de nivel no manejaba la transición de
       niv-1 → niv-2 correctamente, dejando .coverflow-on activo en
       momentos equivocados.
     · Los transforms con top:50%/left:50% peleaban con las posiciones
       calculadas por _reposicionarHUD, causando saltos visuales.

   Decisión honesta: revertir Cover Flow. El Nivel 1 vuelve a su
   comportamiento original (card expandida central + el resto del HUD
   visible alrededor). Cuando haya tiempo y cuidado, se rehará desde
   cero respetando estos límites:
     · Solo afectar cards EXPANDIBLES (las del centro/laterales), no
       las cards de barra superior/inferior.
     · No usar top/left absoluto en CSS - usar transform sobre las
       posiciones que _reposicionarHUD ya calcula.
     · Limpiar agresivamente al salir de niv-1 (cambio a niv-0 o niv-2).
*/
(function(){
  'use strict';
  // Limpiar cualquier rastro de v7.067 que pudiera haber quedado
  // en el DOM o en clases. Defensa por si el navegador cacheaba el
  // estado anterior.
  try {
    document.documentElement.classList.remove('coverflow-on');
    var stale = document.querySelectorAll('.cf-lateral, .cf-l1, .cf-l2, .cf-r1, .cf-r2');
    stale.forEach(function(el){
      el.classList.remove('cf-lateral','cf-l1','cf-l2','cf-r1','cf-r2');
    });
    var staleCSS = document.getElementById('coverflow-css');
    if(staleCSS && staleCSS.parentNode) staleCSS.parentNode.removeChild(staleCSS);
  } catch(e){}
})();
