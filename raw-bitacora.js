/* ═══════════════════════════════════════════════════════════════════
   RAW Entry — Bitácora Renderer v.5.072
   Renderiza la pantalla full-screen de Bitácora con layout estilo
   Activity Check: 5 columnas Trello + sidebar + footer.

   Datos consumidos (poblados por raw-dashboard.js):
   - window._pensamientosData   (api.getPensamientos)
   - window._relacionesData     (api.getRelaciones)
   - window._saludData          (renderSalud lo asigna localmente)
   - window._nutricionData      (puede no estar todavía)
   - window._entrenamientoData  (puede no estar todavía)

   El renderer es defensivo: si un dato falta, muestra empty state.
═══════════════════════════════════════════════════════════════════ */

(function(){
  'use strict';

  // ── Helpers ──
  var fmt   = function(v){ return v==null||v===''?'—':String(v); };
  var escH  = function(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };
  function fechaCorta(d){
    if(!d) return '';
    try {
      var dt = (d instanceof Date) ? d : new Date(d);
      if(isNaN(dt.getTime())) return String(d);
      var dd = String(dt.getDate()).padStart(2,'0');
      var mm = String(dt.getMonth()+1).padStart(2,'0');
      return dd+'/'+mm;
    } catch(e){ return String(d); }
  }
  function diasDesde(d){
    if(!d) return null;
    try{
      var hoy = new Date(); hoy.setHours(0,0,0,0);
      var dt = new Date(d); dt.setHours(0,0,0,0);
      return Math.floor((hoy - dt) / 86400000);
    } catch(e){ return null; }
  }
  function fechaIsHoy(d){
    if(!d) return false;
    var diff = diasDesde(d);
    return diff === 0;
  }
  function dentroSemanaActual(d){
    if(!d) return false;
    var diff = diasDesde(d);
    return diff !== null && diff >= 0 && diff <= 6;
  }
  function dentroMesActual(d){
    if(!d) return false;
    try{
      var hoy = new Date();
      var dt  = new Date(d);
      return dt.getMonth()===hoy.getMonth() && dt.getFullYear()===hoy.getFullYear();
    } catch(e){ return false; }
  }

  // ── Datos por tipo ──
  function getDatosBit(){
    return {
      pensamientos:  ((window._pensamientosData)  && window._pensamientosData.items)  || [],
      relaciones:    ((window._relacionesData)    && window._relacionesData.items)    || [],
      salud:         ((window._saludData)         && (window._saludData.items||window._saludData)) || [],
      nutricion:     ((window._nutricionData)     && (window._nutricionData.items||window._nutricionData.semana)) || [],
      entrenamiento: ((window._entrenamientoData) && (window._entrenamientoData.items||window._entrenamientoData)) || [],
    };
  }

  // ── CARD RENDERERS ──

  function cardPensamiento(p){
    var energia = p.energia ? '⚡'.repeat(Math.min(parseInt(p.energia)||0, 5)) : '';
    var cat     = p.categoria || '—';
    var tags    = p.etiquetas || '';
    var fecha   = fechaCorta(p.fecha);
    var texto   = escH(p.texto || '');
    return '<div class="bit-card bit-card-pens">'+
      '<div class="bit-card-top">'+
        '<span class="bit-card-badge">'+escH(cat)+'</span>'+
        '<span class="bit-card-meta-r">'+escH(fecha)+'</span>'+
      '</div>'+
      '<div class="bit-card-body">'+texto+'</div>'+
      (tags || energia ?
        '<div class="bit-card-bottom">'+
          '<span class="bit-card-bottom-l">'+(tags ? '<span class="bit-card-tag">'+escH(tags)+'</span>' : '')+'</span>'+
          (energia ? '<span class="bit-card-bottom-r"><span class="bit-card-energia">'+energia+'</span></span>' : '')+
        '</div>'
      : '') +
    '</div>';
  }

  function cardRelacion(r){
    var inicial = (r.nombre||'?').charAt(0).toUpperCase();
    var diff    = diasDesde(r.ultimaVez);
    var diasStr = diff===null ? '—' : diff===0 ? 'Hoy' : diff===1 ? 'Ayer' : diff+' d';
    var energiaCls = r.energia>0?'pos':r.energia<0?'neg':'neu';
    var energiaLbl = r.energia>0?'+ ENERGÍA':r.energia<0?'− ENERGÍA':'NEUTRAL';
    return '<div class="bit-card bit-card-rel">'+
      '<div class="bit-card-avatar">'+escH(inicial)+'</div>'+
      '<div class="bit-card-rel-info">'+
        '<div class="bit-card-rel-name">'+escH(r.nombre||'—')+
          (r.sos ? ' <span style="color:#EF4444;font-size:9px">🚨</span>' : '')+
        '</div>'+
        '<div class="bit-card-rel-meta">'+escH(r.tipo||'—')+' · '+escH(diasStr)+'</div>'+
      '</div>'+
      '<span class="bit-card-rel-energia '+energiaCls+'">'+energiaLbl+'</span>'+
    '</div>';
  }

  function cardSalud(s){
    var TIPOS_COLOR = {
      'Cita':         '#22D3EE',
      'Síntoma':      '#EF4444',
      'Medicamento':  '#A78BFA',
      'Resultado':    '#67E8F9',
      'Vacuna':       '#86EFAC',
      'Chequeo':      '#FB923C',
    };
    var color = TIPOS_COLOR[s.tipo] || 'var(--acc-rose)';
    var estado = (s.estado||'').toLowerCase();
    return '<div class="bit-card">'+
      '<div class="bit-card-top">'+
        '<span class="bit-card-sal-tipo" style="background:'+color+'18;border:1px solid '+color+'48;color:'+color+'">'+escH(s.tipo||'—')+'</span>'+
        '<span class="bit-card-meta-r">'+escH(fechaCorta(s.fecha))+'</span>'+
      '</div>'+
      '<div class="bit-card-body" style="-webkit-line-clamp:3">'+escH(s.descripcion||'—')+'</div>'+
      '<div class="bit-card-bottom">'+
        '<span class="bit-card-bottom-l">'+
          (s.doctor ? '<span class="bit-card-sal-doc">'+escH(s.doctor)+'</span>' : '')+
        '</span>'+
        '<span class="bit-card-bottom-r">'+
          (estado ? '<span class="bit-card-sal-estado '+estado+'">'+escH(s.estado)+'</span>' : '')+
        '</span>'+
      '</div>'+
    '</div>';
  }

  function cardNutricion(n){
    // Soporta dos formatos: item suelto o agrupado por día
    if(n.items && Array.isArray(n.items)){
      // es un objeto día con array de items — desplegar primero
      return n.items.map(function(it){ return _cardNutItem(it, n.fecha); }).join('');
    }
    return _cardNutItem(n, n.fecha);
  }
  function _cardNutItem(it, fechaDia){
    var momento = it.momento || '—';
    var alimento = it.alimento || it.comida || '—';
    var cal = it.cal || it.calorias;
    return '<div class="bit-card">'+
      '<div class="bit-card-top">'+
        '<span class="bit-card-badge">'+escH(momento)+'</span>'+
        '<span class="bit-card-meta-r">'+escH(fechaCorta(it.fecha||fechaDia))+'</span>'+
      '</div>'+
      '<div class="bit-card-body">'+escH(alimento)+'</div>'+
      (cal ?
        '<div class="bit-card-bottom">'+
          '<span class="bit-card-bottom-l"></span>'+
          '<span class="bit-card-bottom-r"><span class="bit-card-energia">'+Math.round(cal)+' kcal</span></span>'+
        '</div>'
      : '')+
    '</div>';
  }

  function cardEntrenamiento(e){
    var dur  = e.duracion ? e.duracion+' min' : '';
    var dist = e.distancia ? e.distancia+' km' : '';
    var meta = [dur, dist].filter(Boolean).join(' · ');
    var detalle = '';
    if(e.series && e.reps){
      detalle = e.series+'×'+e.reps+(e.peso?' · '+e.peso+'kg':'');
    }
    return '<div class="bit-card">'+
      '<div class="bit-card-top">'+
        '<span class="bit-card-badge">'+escH(e.tipo||'—')+'</span>'+
        '<span class="bit-card-meta-r">'+escH(fechaCorta(e.fecha))+'</span>'+
      '</div>'+
      '<div class="bit-card-body">'+escH(e.ejercicio||'—')+'</div>'+
      (meta || detalle ?
        '<div class="bit-card-bottom">'+
          '<span class="bit-card-bottom-l">'+escH(meta)+'</span>'+
          (detalle ? '<span class="bit-card-bottom-r"><span class="bit-card-energia">'+escH(detalle)+'</span></span>' : '')+
        '</div>'
      : '')+
    '</div>';
  }

  // ── Renderer principal ──
  function renderBitacoraPanel(){
    var board = document.getElementById('board-bitacora');
    if(!board) return;

    var datos = getDatosBit();

    // ── Pintar cards en cada columna ──
    pintarColumna('bit-col-pensamientos',  datos.pensamientos.slice(0,30),  cardPensamiento);
    pintarColumna('bit-col-relaciones',    datos.relaciones.slice(0,30),    cardRelacion);
    pintarColumna('bit-col-salud',         datos.salud.slice(0,30),         cardSalud);
    pintarColumna('bit-col-nutricion',     aplanarNutricion(datos.nutricion).slice(0,30), cardNutricion);
    pintarColumna('bit-col-entrenamiento', datos.entrenamiento.slice(0,30), cardEntrenamiento);

    // ── Stats header ──
    var counts = {
      pens: datos.pensamientos.length,
      rels: datos.relaciones.length,
      sal:  datos.salud.length,
      nut:  aplanarNutricion(datos.nutricion).length,
      ent:  datos.entrenamiento.length,
    };
    // "X / Y" en stats — X es esta semana, Y es total
    setText('bit-stat-pens-d', countSemana(datos.pensamientos));   setText('bit-stat-pens-t', counts.pens);
    setText('bit-stat-rels-d', countSemanaRel(datos.relaciones));  setText('bit-stat-rels-t', counts.rels);
    setText('bit-stat-sal-d',  countSemana(datos.salud));          setText('bit-stat-sal-t',  counts.sal);
    setText('bit-stat-nut-d',  countSemana(aplanarNutricion(datos.nutricion))); setText('bit-stat-nut-t', counts.nut);
    setText('bit-stat-ent-d',  countSemana(datos.entrenamiento));  setText('bit-stat-ent-t',  counts.ent);

    // ── Anillo de progreso semanal ──
    var totalSem = countSemana(datos.pensamientos) +
                   countSemanaRel(datos.relaciones) +
                   countSemana(datos.salud) +
                   countSemana(aplanarNutricion(datos.nutricion)) +
                   countSemana(datos.entrenamiento);
    var totalGral = counts.pens + counts.rels + counts.sal + counts.nut + counts.ent;
    var pctSem = totalGral > 0 ? Math.round(totalSem/Math.max(totalGral,7)*100) : 0;
    pctSem = Math.min(100, pctSem);

    setText('bit-prog-d', totalSem);
    setText('bit-prog-t', totalGral);
    var ring = document.getElementById('bit-ring-fill');
    if(ring){
      var C = 2*Math.PI*28;
      ring.setAttribute('stroke-dasharray',  C.toFixed(2));
      ring.setAttribute('stroke-dashoffset', (C*(1-pctSem/100)).toFixed(2));
    }
    setText('bit-ring-pct', pctSem+'%');

    // ── Sidebar ──
    setText('bit-sb-total', totalSem);
    var diasActivos = contarDiasActivos(datos);
    setText('bit-sb-dias', diasActivos);
    var resumenPct = Math.round(diasActivos/7*100);
    var fill = document.getElementById('bit-sb-resumen-fill');
    if(fill) fill.style.width = resumenPct+'%';

    // Por sección
    var maxCount = Math.max(counts.pens, counts.rels, counts.sal, counts.nut, counts.ent, 1);
    setText('bit-sb-pens', counts.pens); setBar('bit-sb-pens-bar', counts.pens/maxCount*100);
    setText('bit-sb-rels', counts.rels); setBar('bit-sb-rels-bar', counts.rels/maxCount*100);
    setText('bit-sb-sal',  counts.sal);  setBar('bit-sb-sal-bar',  counts.sal/maxCount*100);
    setText('bit-sb-nut',  counts.nut);  setBar('bit-sb-nut-bar',  counts.nut/maxCount*100);
    setText('bit-sb-ent',  counts.ent);  setBar('bit-sb-ent-bar',  counts.ent/maxCount*100);

    // Tip motivacional
    var tipMsg = totalSem >= 14
      ? '¡Excelente registro! Estás documentando tu vida con consistencia. Eso es oro para el futuro.'
      : totalSem >= 7
      ? 'Vas bien. Intenta cubrir al menos 3 secciones diferentes hoy para tener una bitácora completa.'
      : 'Empieza pequeño. Un registro a la vez hace la diferencia.';
    var tipEl = document.getElementById('bit-sb-tip-msg');
    if(tipEl) tipEl.textContent = tipMsg;

    // ── Footer ──
    setText('bit-foot-dias',  diasActivos);
    setText('bit-foot-racha', calcularRacha(datos));
    setText('bit-foot-mes',   contarMes(datos));
  }

  // ── Helpers de pintado ──
  function setText(id, val){
    var el = document.getElementById(id);
    if(el) el.textContent = val;
  }
  function setBar(id, pct){
    var el = document.getElementById(id);
    if(el) el.style.width = Math.max(0, Math.min(100, pct))+'%';
  }

  function pintarColumna(colId, items, renderer){
    var el = document.getElementById(colId);
    if(!el) return;
    if(!items || !items.length){
      // empty state ya está en HTML, mantenerlo
      return;
    }
    el.innerHTML = items.map(renderer).join('');
  }

  function aplanarNutricion(arr){
    // Si viene agrupado por día, aplanar a items individuales
    var out = [];
    (arr||[]).forEach(function(d){
      if(d && d.items && Array.isArray(d.items)){
        d.items.forEach(function(it){ out.push(Object.assign({fecha:d.fecha}, it)); });
      } else {
        out.push(d);
      }
    });
    return out;
  }

  // ── Conteos ──
  function countSemana(arr){
    return (arr||[]).filter(function(it){ return dentroSemanaActual(it.fecha); }).length;
  }
  function countSemanaRel(arr){
    return (arr||[]).filter(function(it){ return dentroSemanaActual(it.ultimaVez); }).length;
  }
  function contarMes(datos){
    var n = 0;
    n += (datos.pensamientos||[]).filter(function(it){ return dentroMesActual(it.fecha); }).length;
    n += (datos.relaciones||[]).filter(function(it){ return dentroMesActual(it.ultimaVez); }).length;
    n += (datos.salud||[]).filter(function(it){ return dentroMesActual(it.fecha); }).length;
    n += aplanarNutricion(datos.nutricion).filter(function(it){ return dentroMesActual(it.fecha); }).length;
    n += (datos.entrenamiento||[]).filter(function(it){ return dentroMesActual(it.fecha); }).length;
    return n;
  }
  function contarDiasActivos(datos){
    // Días únicos (de los últimos 7) con al menos 1 registro
    var dias = new Set();
    function add(d){
      if(!d || !dentroSemanaActual(d)) return;
      try{
        var dt = new Date(d);
        if(isNaN(dt.getTime())) return;
        dt.setHours(0,0,0,0);
        dias.add(dt.toISOString().slice(0,10));
      } catch(e){}
    }
    (datos.pensamientos||[]).forEach(function(it){ add(it.fecha); });
    (datos.relaciones||[]).forEach(function(it){ add(it.ultimaVez); });
    (datos.salud||[]).forEach(function(it){ add(it.fecha); });
    aplanarNutricion(datos.nutricion).forEach(function(it){ add(it.fecha); });
    (datos.entrenamiento||[]).forEach(function(it){ add(it.fecha); });
    return dias.size;
  }
  function calcularRacha(datos){
    // Días consecutivos (hacia atrás desde hoy) con al menos 1 registro
    var diasMap = {};
    function add(d){
      if(!d) return;
      try{
        var dt = new Date(d);
        if(isNaN(dt.getTime())) return;
        dt.setHours(0,0,0,0);
        diasMap[dt.toISOString().slice(0,10)] = true;
      } catch(e){}
    }
    (datos.pensamientos||[]).forEach(function(it){ add(it.fecha); });
    (datos.relaciones||[]).forEach(function(it){ add(it.ultimaVez); });
    (datos.salud||[]).forEach(function(it){ add(it.fecha); });
    aplanarNutricion(datos.nutricion).forEach(function(it){ add(it.fecha); });
    (datos.entrenamiento||[]).forEach(function(it){ add(it.fecha); });

    var hoy = new Date(); hoy.setHours(0,0,0,0);
    var racha = 0;
    for(var i=0; i<60; i++){
      var d = new Date(hoy); d.setDate(hoy.getDate()-i);
      var key = d.toISOString().slice(0,10);
      if(diasMap[key]) racha++;
      else if(i>0) break; // permitir hueco solo si es hoy
    }
    return racha;
  }

  // ── Hook: re-render cuando se abre Bitácora ──
  // Wrapper de irABitacora que re-pinta después de mostrar el panel
  var _origIrABitacora = window.irABitacora;
  window.irABitacora = function(){
    if(typeof _origIrABitacora === 'function') _origIrABitacora();
    setTimeout(renderBitacoraPanel, 60);
  };

  // Si el usuario ya está en Bitácora cuando llegan datos nuevos, repintar
  window._renderBitacoraPanel = renderBitacoraPanel;

  // Render inicial defensivo: si Bitácora ya está visible al cargar, pintar
  if(document.readyState === 'complete' || document.readyState === 'interactive'){
    setTimeout(function(){
      var board = document.getElementById('board-bitacora');
      if(board && board.classList.contains('active')) renderBitacoraPanel();
    }, 200);
  } else {
    document.addEventListener('DOMContentLoaded', function(){
      setTimeout(function(){
        var board = document.getElementById('board-bitacora');
        if(board && board.classList.contains('active')) renderBitacoraPanel();
      }, 200);
    });
  }

})();
