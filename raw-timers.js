/* RAW Entry — Timers v.8.7 (CSS tokenizado: consume el sistema de design tokens unificado)
   ╔══════════════════════════════════════════════════════════════════╗
   ║ MÓDULO TIMERS — cronómetros que cuentan HACIA ARRIBA               ║
   ╚══════════════════════════════════════════════════════════════════╝
   Cronómetros de "tiempo sin / tiempo desde" (sin alcohol, sin THC, etc.)
   que cuentan en vivo desde una fecha de inicio. Cada timer guarda un
   "Mejor tiempo" (récord). Tres piezas:

   1) SECCIÓN (nivel 2, board-timers): cuadrícula de tarjetas-cronómetro
      medianas. Cronómetro grande DÍAS:HH:MM:SS en vivo (tick 1s) +
      desglose meses/años/horas-totales al lado. Récord visible. Botones
      Pausar / Reanudar / Finalizar. SOLO visualización; NO se crean aquí.

   2) FORMULARIO (gajo "Timer" del dial): crea un timer nuevo llenando las
      columnas del Sheet vía crearTimer. Tras crear, el usuario actualiza
      (botón ↻) y entra a la sección para verlo. (Por diseño: NO se crean
      timers dentro de la sección.)

   3) SYNC: getTimers (leer) y actualizarTimer (pausar/reanudar/finalizar)
      contra el backend GAS. Datos en window._timersData.

   Backend (Code.gs, ya desplegado): getTimers / crearTimer / actualizarTimer.
   Hoja TIMERS, clave = 'Tipo|Timer'.
*/
(function(){
  'use strict';

  // ── Estado ───────────────────────────────────────────────────────
  window._timersData = window._timersData || [];
  var _tickRAF = null;        // loop del tick en vivo
  var _tickLast = 0;
  var _seccionMontada = false;

  // ── Utilidades de tiempo ─────────────────────────────────────────
  // Parsea la "Fecha de inicio" del Sheet a timestamp (ms). Acepta ISO,
  // 'yyyy-MM-dd HH:mm:ss', o dd/MM/yyyy. Devuelve null si no se entiende.
  function parseFecha(s){
    if(!s) return null;
    if(s instanceof Date) return s.getTime();
    s = String(s).trim();
    if(!s) return null;
    // Formato del backend GAS: 'd/M/yyyy HH:mm:ss' (o d/M/yyyy). Se prueba
    // PRIMERO porque Date.parse interpreta dd/mm como mm/dd (formato US) y
    // daría una fecha equivocada. Acepta 1-2 dígitos en día y mes.
    var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if(m){
      return new Date(+m[3], +m[2]-1, +m[1], +(m[4]||0), +(m[5]||0), +(m[6]||0)).getTime();
    }
    // ISO u otros formatos que Date.parse entiende bien (yyyy-MM-dd...).
    var t = Date.parse(s);
    if(!isNaN(t)) return t;
    return null;
  }

  // Desglosa milisegundos en componentes para el cronómetro y el desglose.
  function desglosar(ms){
    if(ms < 0) ms = 0;
    var totalSeg  = Math.floor(ms / 1000);
    var seg  = totalSeg % 60;
    var min  = Math.floor(totalSeg / 60) % 60;
    var hora = Math.floor(totalSeg / 3600) % 24;
    var dias = Math.floor(totalSeg / 86400);
    // Desglose legible aproximado (mes = 30.44 días, año = 365.25 días)
    var totalHoras = Math.floor(totalSeg / 3600);
    var anios = totalSeg / (86400 * 365.25);
    var meses = totalSeg / (86400 * 30.44);
    return {
      dias: dias, hora: hora, min: min, seg: seg,
      totalSeg: totalSeg, totalHoras: totalHoras,
      meses: meses, anios: anios
    };
  }

  function pad(n){ return (n < 10 ? '0' : '') + n; }

  // ── Cálculo del tiempo transcurrido de un timer ─────────────────
  // Si está Activo: ahora - inicio. Si Pausado: usa 'transcurrido' guardado.
  function msTranscurrido(t){
    var estado = (t.estado || 'Inactivo').toLowerCase();
    if(estado === 'pausado' || estado === 'inactivo'){
      // 'transcurrido' guardado en segundos o como número
      var g = parseFloat(t.transcurrido);
      if(!isNaN(g)) return g * 1000;
      return 0;
    }
    // Activo: contar desde 'inicio' (o fechaInicio como respaldo)
    var base = parseFecha(t.inicio) || parseFecha(t.fechaInicio);
    if(!base) return 0;
    return Date.now() - base;
  }

  // Mejor tiempo (récord) en ms, para comparar. Acepta segundos o 'Nd Nh'.
  function msMejor(t){
    var s = String(t.mejorTiempo || '').trim();
    if(!s) return 0;
    // número puro = segundos
    var n = parseFloat(s);
    if(!isNaN(n) && /^\d+(\.\d+)?$/.test(s)) return n * 1000;
    // 'Nd' días
    var md = s.match(/(\d+)\s*d/i);
    if(md) return parseInt(md[1],10) * 86400 * 1000;
    return 0;
  }

  // ── API backend ──────────────────────────────────────────────────
  function cargarTimers(cb){
    if(!window.api || !window.api.getTimers){
      // api no listo: reintentar suave
      setTimeout(function(){ cargarTimers(cb); }, 400);
      return;
    }
    window.api.getTimers().then(function(d){
      window._timersData = (d && d.timers) ? d.timers : [];
      if(cb) cb();
      render();
    }).catch(function(){
      if(cb) cb();
    });
  }

  function actualizar(clave, campos, cb){
    if(!window.api || !window.api.actualizarTimer){ if(cb)cb(false); return; }
    window.api.actualizarTimer(clave, campos).then(function(r){
      if(cb) cb(true, r);
      // refrescar tras escribir
      cargarTimers();
    }).catch(function(){ if(cb) cb(false); });
  }

  function crear(datos, cb){
    if(!window.api || !window.api.crearTimer){ if(cb)cb(false); return; }
    window.api.crearTimer(datos).then(function(r){
      if(cb) cb(true, r);
    }).catch(function(e){ if(cb) cb(false, e); });
  }

  // ── Acciones de tarjeta ──────────────────────────────────────────
  function pausar(t){
    var seg = Math.floor(msTranscurrido(t) / 1000);
    actualizar(t.clave, { estado:'Pausado', transcurrido:seg });
  }
  function reanudar(t){
    // Reanudar: nuevo 'inicio' = ahora - transcurrido guardado.
    var g = parseFloat(t.transcurrido) || 0;
    var nuevoInicio = new Date(Date.now() - g*1000);
    actualizar(t.clave, { estado:'Activo', inicio: nuevoInicio.toISOString() });
  }
  function finalizar(t){
    // Guarda récord si superó, y reinicia a cero.
    var logradoSeg = Math.floor(msTranscurrido(t) / 1000);
    var recordSeg  = Math.floor(msMejor(t) / 1000);
    var campos = { estado:'Inactivo', transcurrido:0, inicio:'' };
    if(logradoSeg > recordSeg){
      campos.mejorTiempo = logradoSeg;   // nuevo récord (en segundos)
    }
    if(typeof window._toast === 'function'){
      window._toast(logradoSeg > recordSeg ? '¡Nuevo récord guardado!' : 'Timer reiniciado');
    }
    actualizar(t.clave, campos);
  }

  // ── Render de la sección ─────────────────────────────────────────
  function fmtDesglose(d){
    // Devuelve los tres chips: meses, años, horas totales
    var meses = d.meses >= 1 ? d.meses.toFixed(1) : d.meses.toFixed(2);
    var anios = d.anios >= 0.1 ? d.anios.toFixed(2) : d.anios.toFixed(3);
    return { meses: meses, anios: anios, horas: d.totalHoras.toLocaleString('es-MX') };
  }

  function colorTipo(tipo){
    var mapa = {
      'salud':'#fca5a5', 'mental':'#c4b5fd', 'persona':'#93c5fd',
      'trabajo':'#22d3ee', 'finanzas':'#4ade80', 'habito':'#fb923c'
    };
    return mapa[String(tipo||'').toLowerCase()] || '#a78bfa';
  }

  function render(){
    var cont = document.getElementById('timers-grid');
    if(!cont) return;
    var data = window._timersData || [];

    if(!data.length){
      cont.innerHTML =
        '<div class="tm-empty">'+
          '<div class="tm-empty-ico">⏱</div>'+
          '<div class="tm-empty-t">Sin cronómetros</div>'+
        '</div>';
      return;
    }

    var html = '';
    data.forEach(function(t, i){
      var ms = msTranscurrido(t);
      var d  = desglosar(ms);
      var rec = desglosar(msMejor(t));
      var dg = fmtDesglose(d);
      var acc = colorTipo(t.tipo);
      var estado = (t.estado||'Inactivo').toLowerCase();
      var activo = estado === 'activo';
      var superando = msMejor(t) > 0 && ms > msMejor(t);
      // Progreso hacia el récord (0-100). Si no hay récord, va por el día actual.
      var prog;
      if(msMejor(t) > 0){ prog = Math.min(100, (ms / msMejor(t)) * 100); }
      else { prog = Math.min(100, (d.seg + d.min*60 + d.hora*3600) / 86400 * 100); }
      var dash = 100; // circunferencia base para el anillo (r≈15.9)

      html +=
        '<div class="tm-card'+(activo?' tm-card-on':'')+'" data-clave="'+escAttr(t.clave)+'" style="--tm-acc:'+acc+'">'+
          // Cabecera: tipo · nombre + anillo de progreso
          '<div class="tm-card-head">'+
            '<div class="tm-card-titles">'+
              '<span class="tm-card-tipo"><i class="tm-dot"></i>'+esc(String(t.tipo).toUpperCase())+'</span>'+
              '<span class="tm-card-name">'+esc(t.timer)+'</span>'+
            '</div>'+
            '<div class="tm-ring" title="Progreso hacia tu récord">'+
              '<svg viewBox="0 0 36 36">'+
                '<circle class="tm-ring-bg" cx="18" cy="18" r="15.9"></circle>'+
                '<circle class="tm-ring-fg" cx="18" cy="18" r="15.9" '+
                  'stroke-dasharray="'+dash+'" stroke-dashoffset="'+(dash - dash*prog/100).toFixed(1)+'" data-f="ring"></circle>'+
              '</svg>'+
              '<span class="tm-ring-state '+estado+'" data-f="ringstate">'+
                (activo?'●':estado==='pausado'?'❚❚':'■')+'</span>'+
            '</div>'+
          '</div>'+

          // Cronómetro LED grande: DÍAS : HH : MM : SS
          '<div class="tm-clock'+(superando?' tm-clock-record':'')+'" data-f="clockwrap">'+
            '<span class="tm-seg tm-seg-d" data-f="dias">'+d.dias+'</span>'+
            '<span class="tm-sep">:</span>'+
            '<span class="tm-seg" data-f="hora">'+pad(d.hora)+'</span>'+
            '<span class="tm-sep">:</span>'+
            '<span class="tm-seg" data-f="min">'+pad(d.min)+'</span>'+
            '<span class="tm-sep">:</span>'+
            '<span class="tm-seg" data-f="seg">'+pad(d.seg)+'</span>'+
          '</div>'+
          '<div class="tm-clock-labels"><span>días</span><span>hrs</span><span>min</span><span>seg</span></div>'+

          // Tira de datos: meses · años · horas + récord
          '<div class="tm-data">'+
            '<div class="tm-data-cell"><span class="tm-data-v" data-f="meses">'+dg.meses+'</span><span class="tm-data-l">meses</span></div>'+
            '<div class="tm-data-cell"><span class="tm-data-v" data-f="anios">'+dg.anios+'</span><span class="tm-data-l">años</span></div>'+
            '<div class="tm-data-cell"><span class="tm-data-v" data-f="horas">'+dg.horas+'</span><span class="tm-data-l">horas</span></div>'+
            '<div class="tm-data-cell tm-data-rec">'+
              '<span class="tm-data-v'+(superando?' tm-rec-beat':'')+'">'+(msMejor(t)>0 ? (rec.dias+'d') : '—')+'</span>'+
              '<span class="tm-data-l">'+(superando?'¡récord!':'récord')+'</span>'+
            '</div>'+
          '</div>'+

          // Acciones
          '<div class="tm-actions">'+
            (activo
              ? '<button class="tm-btn tm-btn-pause" data-act="pausar">Pausar</button>'
              : '<button class="tm-btn tm-btn-play" data-act="reanudar">Reanudar</button>')+
            '<button class="tm-btn tm-btn-stop" data-act="finalizar">Finalizar</button>'+
          '</div>'+
        '</div>';

    });
    cont.innerHTML = html;

    // Listeners de acciones (delegación)
    Array.prototype.forEach.call(cont.querySelectorAll('.tm-btn'), function(b){
      b.addEventListener('click', function(){
        var card = b.closest('.tm-card');
        var clave = card && card.getAttribute('data-clave');
        var t = (window._timersData||[]).find(function(x){ return x.clave === clave; });
        if(!t) return;
        var act = b.getAttribute('data-act');
        if(act === 'pausar')    pausar(t);
        else if(act === 'reanudar') reanudar(t);
        else if(act === 'finalizar'){
          if(confirm('¿Finalizar "'+t.timer+'"? Se guardará como récord si superó tu mejor tiempo y se reinicia a cero.'))
            finalizar(t);
        }
      });
    });

    arrancarTick();
  }

  // ── Tick en vivo (solo actualiza los números, no re-renderiza) ──
  function tickUpdate(){
    var cont = document.getElementById('timers-grid');
    if(!cont) return;
    var cards = cont.querySelectorAll('.tm-card');
    if(!cards.length) return;
    cards.forEach(function(card){
      var clave = card.getAttribute('data-clave');
      var t = (window._timersData||[]).find(function(x){ return x.clave === clave; });
      if(!t) return;
      var estado = (t.estado||'Inactivo').toLowerCase();
      // Solo los activos avanzan en vivo.
      var ms = msTranscurrido(t);
      var d  = desglosar(ms);
      var dg = fmtDesglose(d);
      setF(card, 'dias', d.dias);
      setF(card, 'hora', pad(d.hora));
      setF(card, 'min',  pad(d.min));
      setF(card, 'seg',  pad(d.seg));
      setF(card, 'meses', dg.meses);
      setF(card, 'anios', dg.anios);
      setF(card, 'horas', dg.horas);
      // Anillo de progreso (hacia récord, o día actual si no hay récord).
      var ringEl = card.querySelector('[data-f="ring"]');
      if(ringEl){
        var prog;
        if(msMejor(t) > 0){ prog = Math.min(100, (ms / msMejor(t)) * 100); }
        else { prog = Math.min(100, (d.seg + d.min*60 + d.hora*3600) / 86400 * 100); }
        ringEl.setAttribute('stroke-dashoffset', (100 - 100*prog/100).toFixed(1));
      }
      // Marca récord
      var clock = card.querySelector('.tm-clock');
      if(clock){
        var sup = msMejor(t) > 0 && ms > msMejor(t);
        clock.classList.toggle('tm-clock-record', sup);
      }
    });
  }
  function setF(card, f, val){
    var el = card.querySelector('[data-f="'+f+'"]');
    if(el && el.textContent !== String(val)) el.textContent = val;
  }

  function arrancarTick(){
    if(_tickRAF) return;
    (function loop(ts){
      ts = ts || performance.now();
      // 1 tick por segundo basta (cap)
      if(!_tickLast || ts - _tickLast >= 1000){
        _tickLast = ts;
        // Solo si la sección está visible
        var board = document.getElementById('board-timers');
        if(board && board.classList.contains('active') && !document.hidden){
          tickUpdate();
        }
      }
      _tickRAF = requestAnimationFrame(loop);
    })();
  }
  function detenerTick(){
    if(_tickRAF){ cancelAnimationFrame(_tickRAF); _tickRAF = null; _tickLast = 0; }
  }

  // ── Montaje de la sección (board-timers) ─────────────────────────
  function montarSeccion(){
    if(_seccionMontada) return;
    var board = document.getElementById('board-timers');
    if(!board) return;
    board.innerHTML =
      '<div class="tm-wrap">'+
        '<div class="tm-header">'+
          '<div class="tm-header-l">'+
            '<span class="tm-header-ico">⏱</span>'+
            '<div>'+
              '<div class="tm-header-t">TIMERS</div>'+
              '<div class="tm-header-s">Tiempo desde tu último evento</div>'+
            '</div>'+
          '</div>'+
          '<button class="tm-refresh" id="tm-refresh-btn" title="Actualizar timers">↻</button>'+
        '</div>'+
        '<div class="tm-grid" id="timers-grid"></div>'+
      '</div>';
    _seccionMontada = true;

    var rb = document.getElementById('tm-refresh-btn');
    if(rb) rb.addEventListener('click', function(){
      rb.classList.add('tm-spin');
      cargarTimers(function(){ setTimeout(function(){ rb.classList.remove('tm-spin'); }, 400); });
    });

    render();
  }

  // Hook: cuando se entra a la sección timers, montar + cargar.
  window._timersAlEntrar = function(){
    montarSeccion();
    cargarTimers();
    arrancarTick();
  };
  window._timersAlSalir = function(){
    detenerTick();
  };

  // ── FORMULARIO (gajo del dial) ───────────────────────────────────
  // Modal independiente para crear un timer. NO usa el form RAW genérico.
  function abrirFormTimer(presetTipo){
    _limpiarFormDOM();
    var ov = document.createElement('div');
    ov.id = 'tm-form-ov';
    ov.className = 'tm-form-ov';
    ov.innerHTML =
      '<div class="tm-form">'+
        '<div class="tm-form-head">'+
          '<span class="tm-form-ico">⏱</span>'+
          '<span class="tm-form-t">Nuevo cronómetro</span>'+
          '<button class="tm-form-x" id="tm-form-x">✕</button>'+
        '</div>'+
        '<div class="tm-form-body">'+
          '<label class="tm-field">'+
            '<span class="tm-field-l">Tipo</span>'+
            '<input class="tm-input" id="tm-f-tipo" placeholder="Salud, Hábito, Mental…" '+
              'value="'+escAttr(presetTipo||'')+'" autocomplete="off">'+
          '</label>'+
          '<label class="tm-field">'+
            '<span class="tm-field-l">Nombre del timer</span>'+
            '<input class="tm-input" id="tm-f-nombre" placeholder="Sin alcohol, Sin THC…" autocomplete="off">'+
          '</label>'+
          '<label class="tm-field">'+
            '<span class="tm-field-l">Mejor tiempo previo <span class="tm-opt">(opcional)</span></span>'+
            '<input class="tm-input" id="tm-f-record" placeholder="Ej. 30 (días) — déjalo vacío si es nuevo" '+
              'inputmode="numeric" autocomplete="off">'+
          '</label>'+
          '<div class="tm-form-hint">Empieza a contar desde ahora mismo.</div>'+
        '</div>'+
        '<div class="tm-form-actions">'+
          '<button class="tm-btn tm-btn-ghost" id="tm-form-cancel">Cancelar</button>'+
          '<button class="tm-btn tm-btn-create" id="tm-form-ok">Crear y empezar</button>'+
        '</div>'+
        '<div class="tm-form-msg" id="tm-form-msg"></div>'+
      '</div>';
    document.body.appendChild(ov);
    requestAnimationFrame(function(){ ov.classList.add('show'); });

    function close(){ cerrarFormTimer(); }
    document.getElementById('tm-form-x').addEventListener('click', close);
    document.getElementById('tm-form-cancel').addEventListener('click', close);
    ov.addEventListener('click', function(e){ if(e.target === ov) close(); });

    document.getElementById('tm-form-ok').addEventListener('click', function(){
      var tipo   = (document.getElementById('tm-f-tipo').value||'').trim();
      var nombre = (document.getElementById('tm-f-nombre').value||'').trim();
      var record = (document.getElementById('tm-f-record').value||'').trim();
      var msg = document.getElementById('tm-form-msg');
      if(!tipo || !nombre){
        msg.textContent = 'Pon al menos un tipo y un nombre.';
        msg.className = 'tm-form-msg tm-form-msg-err';
        return;
      }
      msg.textContent = 'Creando…';
      msg.className = 'tm-form-msg';
      // El backend espera 'datos' con las columnas. Inicio = ahora.
      var ahora = new Date();
      var datos = {
        tipo: tipo,
        timer: nombre,
        mejorTiempo: record ? (parseInt(record,10)*86400) : '',  // días → seg
        fechaInicio: ahora.toISOString(),
        inicio: ahora.toISOString(),
        transcurrido: 0,
        estado: 'Activo'
      };
      crear(datos, function(ok, r){
        if(ok && (!r || !r.error)){
          msg.textContent = '✓ Creado. Actualiza (↻) en Timers para verlo.';
          msg.className = 'tm-form-msg tm-form-msg-ok';
          setTimeout(function(){ close(); }, 1100);
        } else {
          msg.textContent = 'No se pudo crear'+((r&&r.error)?': '+r.error:'')+'.';
          msg.className = 'tm-form-msg tm-form-msg-err';
        }
      });
    });
  }
  function _limpiarFormDOM(){
    var ov = document.getElementById('tm-form-ov');
    if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
  }
  function cerrarFormTimer(){
    _limpiarFormDOM();
    // v8.6 — Al cerrar el form, regresar al dial (HOME). Antes el form se
    // abría tras cerrarDial() y al cerrarlo quedaba la pantalla en negro sin
    // dial. Volver a HOME reabre el overlay.
    if(typeof window.volverAlAnverso === 'function'){
      try { window.volverAlAnverso(); } catch(e){}
    } else if(typeof window.abrirDial === 'function'){
      try { window.abrirDial(); } catch(e){}
    }
  }
  // Expuesto para el gajo del dial.
  window._abrirFormTimer = abrirFormTimer;

  // ── Helpers de escape ────────────────────────────────────────────
  function esc(s){ return String(s==null?'':s).replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }); }
  function escAttr(s){ return esc(s).replace(/"/g,'&quot;'); }

  // ── Estilos ──────────────────────────────────────────────────────
  function inyectarEstilos(){
    if(document.getElementById('tm-css')) return;
    var st = document.createElement('style');
    st.id = 'tm-css';
    st.textContent = [
      // ── Sección (consume tokens del sistema: raw-tokens.css) ──
      '.tm-wrap{display:flex;flex-direction:column;height:100%;box-sizing:border-box;padding:var(--sp-6) var(--sp-6);overflow-y:auto;gap:var(--sp-5)}',
      '.tm-header{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);flex-shrink:0}',
      '.tm-header-l{display:flex;align-items:center;gap:var(--sp-3)}',
      '.tm-header-ico{font-size:22px;color:var(--acc-cyan);filter:drop-shadow(0 0 8px var(--acc-cyan-glow))}',
      '.tm-header-t{font-size:var(--fs-lg);font-weight:var(--fw-bold);letter-spacing:.18em;color:var(--hud-text)}',
      '.tm-header-s{font-size:var(--fs-xs);color:var(--hud-text-dim);letter-spacing:var(--ls-title);margin-top:2px}',
      '.tm-refresh{width:34px;height:34px;border:1px solid var(--hud-border);background:var(--hud-panel-bg);'+
        'color:var(--hud-text-dim);font-size:var(--fs-base);cursor:pointer;border-radius:var(--rad-chip);transition:all .15s;'+
        'display:flex;align-items:center;justify-content:center}',
      '.tm-refresh:hover{color:var(--hud-text);border-color:var(--hud-border-hov);background:var(--hud-panel-bg-hov)}',
      '.tm-spin{animation:tmSpin .7s linear infinite}',
      '@keyframes tmSpin{to{transform:rotate(360deg)}}',
      '.tm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:var(--sp-4);align-content:start}',
      // ── Tarjeta estilo instrumento ──
      '.tm-card{position:relative;border:1px solid var(--hud-border);'+
        'background:var(--hud-panel-bg);'+
        'border-radius:var(--rad-card);padding:var(--sp-4) var(--sp-4) var(--sp-3);display:flex;flex-direction:column;gap:var(--sp-3);'+
        'box-shadow:var(--hud-shadow);overflow:hidden}',
      '.tm-card::before{content:"";position:absolute;top:0;left:0;right:0;height:2px;'+
        'background:linear-gradient(90deg,transparent,var(--tm-acc),transparent);opacity:.7}',
      '.tm-card-on{border-color:color-mix(in srgb,var(--tm-acc) 40%,transparent)}',
      '.tm-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--sp-3)}',
      '.tm-card-titles{display:flex;flex-direction:column;gap:3px;min-width:0}',
      '.tm-card-tipo{display:flex;align-items:center;gap:5px;font-size:var(--fs-2xs);font-weight:var(--fw-bold);'+
        'letter-spacing:.16em;color:var(--tm-acc)}',
      '.tm-dot{width:5px;height:5px;border-radius:var(--rad-pill);background:var(--tm-acc);box-shadow:0 0 6px var(--tm-acc);flex-shrink:0}',
      '.tm-card-name{font-size:var(--fs-base);font-weight:var(--fw-bold);color:var(--hud-text);letter-spacing:.01em;'+
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      // Anillo de progreso
      '.tm-ring{position:relative;width:38px;height:38px;flex-shrink:0}',
      '.tm-ring svg{width:100%;height:100%;transform:rotate(-90deg)}',
      '.tm-ring-bg{fill:none;stroke:rgba(255,255,255,0.07);stroke-width:2.4}',
      '.tm-ring-fg{fill:none;stroke:var(--tm-acc);stroke-width:2.4;stroke-linecap:round;'+
        'transition:stroke-dashoffset .6s ease;filter:drop-shadow(0 0 3px var(--tm-acc))}',
      '.tm-ring-state{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;'+
        'font-size:var(--fs-2xs);color:var(--tm-acc)}',
      '.tm-ring-state.activo{animation:tmPulse 1.6s ease-in-out infinite}',
      '@keyframes tmPulse{0%,100%{opacity:1}50%{opacity:.35}}',
      // Cronómetro LED (mono)
      '.tm-clock{display:flex;align-items:center;justify-content:center;gap:2px;padding:var(--sp-2) 0 1px;'+
        'font-family:var(--font-mono);line-height:1}',
      '.tm-seg{font-size:var(--fs-2xl);font-weight:var(--fw-num);color:var(--tm-acc);'+
        'text-shadow:0 0 16px color-mix(in srgb,var(--tm-acc) 60%,transparent);'+
        'font-variant-numeric:tabular-nums;letter-spacing:-.01em;min-width:1.2ch;text-align:center}',
      '.tm-seg-d{min-width:1.4ch}',
      '.tm-sep{font-size:var(--fs-xl);font-weight:var(--fw-num);color:rgba(255,255,255,0.18);margin:0 1px}',
      '.tm-clock-record .tm-seg{color:var(--acc-yellow);text-shadow:0 0 16px var(--acc-yellow-glow)}',
      '.tm-clock-labels{display:flex;justify-content:center;gap:2px;padding-bottom:var(--sp-1)}',
      '.tm-clock-labels span{font-size:var(--fs-3xs);font-weight:var(--fw-num);letter-spacing:var(--ls-label);text-transform:uppercase;'+
        'color:var(--hud-text-faint);width:calc(1.2ch + 14px);text-align:center}',
      '.tm-clock-labels span:first-child{width:calc(1.4ch + 14px)}',
      // Tira de datos
      '.tm-data{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;'+
        'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.05);border-radius:var(--rad-chip);overflow:hidden}',
      '.tm-data-cell{display:flex;flex-direction:column;align-items:center;gap:2px;padding:var(--sp-2) var(--sp-1);'+
        'background:var(--hud-bg-deep)}',
      '.tm-data-v{font-size:var(--fs-sm);font-weight:var(--fw-bold);color:var(--hud-text);font-family:var(--font-mono);'+
        'font-variant-numeric:tabular-nums}',
      '.tm-data-l{font-size:var(--fs-3xs);font-weight:var(--fw-num);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--hud-text-faint)}',
      '.tm-data-rec .tm-data-v{color:var(--acc-yellow)}',
      '.tm-rec-beat{color:var(--hud-ok) !important;text-shadow:0 0 8px var(--hud-ok-glow)}',
      // Acciones
      '.tm-actions{display:flex;gap:var(--sp-2);margin-top:2px}',
      '.tm-btn{flex:1;padding:var(--sp-2) var(--sp-3);border-radius:var(--rad-chip);font-size:var(--fs-xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-title);'+
        'cursor:pointer;border:1px solid transparent;transition:all .15s;font-family:var(--font-ui);text-transform:uppercase}',
      '.tm-btn-pause{background:color-mix(in srgb,var(--acc-amber) 12%,transparent);border-color:color-mix(in srgb,var(--acc-amber) 40%,transparent);color:var(--acc-amber)}',
      '.tm-btn-pause:hover{background:color-mix(in srgb,var(--acc-amber) 22%,transparent)}',
      '.tm-btn-play{background:color-mix(in srgb,var(--hud-ok) 12%,transparent);border-color:color-mix(in srgb,var(--hud-ok) 40%,transparent);color:var(--hud-ok)}',
      '.tm-btn-play:hover{background:color-mix(in srgb,var(--hud-ok) 22%,transparent)}',
      '.tm-btn-stop{background:color-mix(in srgb,var(--hud-err) 10%,transparent);border-color:color-mix(in srgb,var(--hud-err) 35%,transparent);color:var(--hud-err)}',
      '.tm-btn-stop:hover{background:color-mix(in srgb,var(--hud-err) 20%,transparent)}',
      // Empty
      '.tm-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:var(--sp-3);padding:60px var(--sp-5);text-align:center}',
      '.tm-empty-ico{font-size:40px;opacity:.5}',
      '.tm-empty-t{font-size:var(--fs-base);font-weight:var(--fw-bold);color:var(--hud-text);letter-spacing:var(--ls-title)}',
      // Formulario modal
      '.tm-form-ov{position:fixed;inset:0;z-index:100050;background:rgba(2,6,16,0.7);backdrop-filter:blur(4px);'+
        'display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}',
      '.tm-form-ov.show{opacity:1}',
      '.tm-form{width:min(420px,92vw);background:var(--hud-form-bg);border:1px solid var(--hud-border-hov);'+
        'border-radius:var(--rad-lg);box-shadow:var(--hud-shadow-md),0 0 40px var(--hud-glow);'+
        'transform:translateY(8px);transition:transform .2s}',
      '.tm-form-ov.show .tm-form{transform:none}',
      '.tm-form-head{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-4) var(--sp-4);border-bottom:1px solid var(--hud-border)}',
      '.tm-form-ico{font-size:var(--fs-lg)}',
      '.tm-form-t{font-size:var(--fs-base);font-weight:var(--fw-bold);letter-spacing:var(--ls-title);color:var(--hud-text);flex:1}',
      '.tm-form-x{background:none;border:none;color:var(--hud-text-dim);font-size:var(--fs-base);cursor:pointer;padding:2px 6px}',
      '.tm-form-x:hover{color:var(--hud-text)}',
      '.tm-form-body{padding:var(--sp-4);display:flex;flex-direction:column;gap:var(--sp-4)}',
      '.tm-field{display:flex;flex-direction:column;gap:6px}',
      '.tm-field-l{font-size:var(--fs-2xs);font-weight:var(--fw-bold);letter-spacing:var(--ls-label);text-transform:uppercase;color:var(--hud-text-dim)}',
      '.tm-opt{font-weight:var(--fw-med);color:var(--hud-text-faint);text-transform:none;letter-spacing:0}',
      '.tm-input{background:rgba(255,255,255,0.04);border:1px solid var(--hud-border);color:var(--hud-text);'+
        'padding:10px 12px;font-size:var(--fs-sm);font-family:var(--font-ui);border-radius:var(--rad-chip);outline:none;transition:border-color .15s}',
      '.tm-input:focus{border-color:var(--hud-border-hov);background:rgba(255,255,255,0.06)}',
      '.tm-form-hint{font-size:var(--fs-xs);color:var(--hud-text-dim)}',
      '.tm-form-actions{display:flex;gap:var(--sp-3);padding:0 var(--sp-4) var(--sp-4)}',
      '.tm-btn-ghost{background:transparent;border-color:rgba(255,255,255,0.15);color:var(--hud-text-dim)}',
      '.tm-btn-ghost:hover{border-color:rgba(255,255,255,0.3);color:var(--hud-text)}',
      '.tm-btn-create{background:color-mix(in srgb,var(--acc-violet) 18%,transparent);border-color:var(--hud-border-hov);color:var(--acc-purple)}',
      '.tm-btn-create:hover{background:color-mix(in srgb,var(--acc-violet) 30%,transparent)}',
      '.tm-form-msg{padding:0 var(--sp-4) var(--sp-4);font-size:var(--fs-xs);min-height:14px}',
      '.tm-form-msg-ok{color:var(--hud-ok)}',
      '.tm-form-msg-err{color:var(--hud-err)}',
    ].join('');
    document.head.appendChild(st);
  }

  // ── Arranque ─────────────────────────────────────────────────────
  function init(){
    inyectarEstilos();
    // Si el board ya existe, montar la sección de una vez (vacía hasta cargar).
    if(document.getElementById('board-timers')) montarSeccion();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
