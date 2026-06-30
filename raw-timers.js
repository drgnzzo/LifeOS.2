/* RAW Entry — Timers v.8.5
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
    // Intento directo
    var t = Date.parse(s);
    if(!isNaN(t)) return t;
    // dd/MM/yyyy [HH:mm[:ss]]
    var m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if(m){
      return new Date(+m[3], +m[2]-1, +m[1], +(m[4]||0), +(m[5]||0), +(m[6]||0)).getTime();
    }
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
          '<div class="tm-empty-t">Aún no hay cronómetros</div>'+
          '<div class="tm-empty-s">Crea uno desde el gajo <b>Timer</b> del dial. '+
          'Después actualiza con ↻ y aparecerá aquí.</div>'+
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

      html +=
        '<div class="tm-card" data-clave="'+escAttr(t.clave)+'" style="--tm-acc:'+acc+'">'+
          '<div class="tm-card-head">'+
            '<div class="tm-card-titles">'+
              '<span class="tm-card-tipo">'+esc(t.tipo)+'</span>'+
              '<span class="tm-card-name">'+esc(t.timer)+'</span>'+
            '</div>'+
            '<span class="tm-badge tm-badge-'+estado+'">'+
              (activo?'En curso':estado==='pausado'?'Pausado':'Detenido')+
            '</span>'+
          '</div>'+

          // Cronómetro grande DÍAS : HH : MM : SS
          '<div class="tm-clock'+(superando?' tm-clock-record':'')+'">'+
            '<div class="tm-unit tm-unit-d"><span class="tm-v" data-f="dias">'+d.dias+'</span><span class="tm-l">días</span></div>'+
            '<span class="tm-colon">:</span>'+
            '<div class="tm-unit"><span class="tm-v" data-f="hora">'+pad(d.hora)+'</span><span class="tm-l">hrs</span></div>'+
            '<span class="tm-colon">:</span>'+
            '<div class="tm-unit"><span class="tm-v" data-f="min">'+pad(d.min)+'</span><span class="tm-l">min</span></div>'+
            '<span class="tm-colon">:</span>'+
            '<div class="tm-unit"><span class="tm-v" data-f="seg">'+pad(d.seg)+'</span><span class="tm-l">seg</span></div>'+
          '</div>'+

          // Desglose meses / años / horas totales
          '<div class="tm-breakdown">'+
            '<div class="tm-bd"><span class="tm-bd-v" data-f="meses">'+dg.meses+'</span><span class="tm-bd-l">meses</span></div>'+
            '<div class="tm-bd"><span class="tm-bd-v" data-f="anios">'+dg.anios+'</span><span class="tm-bd-l">años</span></div>'+
            '<div class="tm-bd"><span class="tm-bd-v" data-f="horas">'+dg.horas+'</span><span class="tm-bd-l">horas tot.</span></div>'+
          '</div>'+

          // Récord
          '<div class="tm-record">'+
            '<span class="tm-record-l">Mejor tiempo</span>'+
            '<span class="tm-record-v">'+
              (msMejor(t)>0 ? (rec.dias+'d '+pad(rec.hora)+'h') : '—')+
            '</span>'+
            (superando ? '<span class="tm-record-flag">¡superándolo!</span>' : '')+
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
        '<div class="tm-foot">Para crear un cronómetro nuevo, usa el gajo '+
          '<b>Timer</b> del dial. Aquí solo los ves y controlas.</div>'+
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
    cerrarFormTimer();
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
  function cerrarFormTimer(){
    var ov = document.getElementById('tm-form-ov');
    if(ov && ov.parentNode) ov.parentNode.removeChild(ov);
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
      // Wrap de la sección
      '.tm-wrap{display:flex;flex-direction:column;height:100%;box-sizing:border-box;padding:22px 26px;overflow-y:auto;gap:18px}',
      '.tm-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-shrink:0}',
      '.tm-header-l{display:flex;align-items:center;gap:12px}',
      '.tm-header-ico{font-size:22px;filter:drop-shadow(0 0 8px rgba(167,139,250,0.5))}',
      '.tm-header-t{font-size:16px;font-weight:800;letter-spacing:.18em;color:#f0f4f8}',
      '.tm-header-s{font-size:11px;color:rgba(220,224,235,0.5);letter-spacing:.04em;margin-top:2px}',
      '.tm-refresh{width:34px;height:34px;border:1px solid rgba(167,139,250,0.3);background:rgba(139,92,246,0.08);'+
        'color:rgba(220,224,235,0.7);font-size:15px;cursor:pointer;border-radius:0;transition:all .15s;'+
        'display:flex;align-items:center;justify-content:center}',
      '.tm-refresh:hover{color:#fff;border-color:rgba(167,139,250,0.6);background:rgba(139,92,246,0.16)}',
      '.tm-spin{animation:tmSpin .7s linear infinite}',
      '@keyframes tmSpin{to{transform:rotate(360deg)}}',
      // Grid de tarjetas medianas: responsive
      '.tm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;align-content:start}',
      // Tarjeta
      '.tm-card{position:relative;border:1px solid rgba(167,139,250,0.22);background:rgba(12,10,24,0.6);'+
        'padding:16px 18px;display:flex;flex-direction:column;gap:13px;'+
        'box-shadow:0 4px 24px rgba(0,0,0,0.4),inset 0 0 0 1px rgba(255,255,255,0.02);'+
        'border-top:2px solid var(--tm-acc)}',
      '.tm-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}',
      '.tm-card-titles{display:flex;flex-direction:column;gap:2px;min-width:0}',
      '.tm-card-tipo{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--tm-acc);opacity:.85}',
      '.tm-card-name{font-size:15px;font-weight:800;color:#f0f4f8;letter-spacing:.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.tm-badge{font-size:8.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;padding:3px 7px;border-radius:0;white-space:nowrap;flex-shrink:0}',
      '.tm-badge-activo{background:rgba(74,222,128,0.14);color:#4ade80;border:1px solid rgba(74,222,128,0.4)}',
      '.tm-badge-pausado{background:rgba(245,158,11,0.14);color:#f59e0b;border:1px solid rgba(245,158,11,0.4)}',
      '.tm-badge-inactivo{background:rgba(148,163,184,0.12);color:rgba(220,224,235,0.5);border:1px solid rgba(148,163,184,0.3)}',
      // Cronómetro grande
      '.tm-clock{display:flex;align-items:flex-end;justify-content:center;gap:4px;padding:6px 0 2px;'+
        'font-family:"JetBrains Mono",monospace}',
      '.tm-clock-record .tm-v{color:#facc15;text-shadow:0 0 12px rgba(250,204,21,0.5)}',
      '.tm-unit{display:flex;flex-direction:column;align-items:center;gap:2px;min-width:0}',
      '.tm-v{font-size:30px;font-weight:800;line-height:1;color:var(--tm-acc);text-shadow:0 0 14px var(--tm-acc);'+
        'font-variant-numeric:tabular-nums;transition:color .3s}',
      '.tm-unit-d .tm-v{font-size:34px}',
      '.tm-l{font-size:8px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:rgba(220,224,235,0.4)}',
      '.tm-colon{font-size:24px;font-weight:700;color:rgba(220,224,235,0.25);align-self:flex-start;margin-top:2px;line-height:1}',
      // Desglose
      '.tm-breakdown{display:flex;justify-content:space-around;gap:8px;padding:9px 0;'+
        'border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05)}',
      '.tm-bd{display:flex;flex-direction:column;align-items:center;gap:1px}',
      '.tm-bd-v{font-size:14px;font-weight:800;color:#e8ecf4;font-family:"JetBrains Mono",monospace;font-variant-numeric:tabular-nums}',
      '.tm-bd-l{font-size:8px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(220,224,235,0.38)}',
      // Récord
      '.tm-record{display:flex;align-items:center;gap:8px}',
      '.tm-record-l{font-size:9px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(220,224,235,0.4)}',
      '.tm-record-v{font-size:12px;font-weight:800;color:#facc15;font-family:"JetBrains Mono",monospace}',
      '.tm-record-flag{font-size:9px;font-weight:800;color:#4ade80;margin-left:auto;letter-spacing:.04em}',
      // Acciones
      '.tm-actions{display:flex;gap:8px;margin-top:2px}',
      '.tm-btn{flex:1;padding:8px 10px;border-radius:0;font-size:11px;font-weight:800;letter-spacing:.06em;'+
        'cursor:pointer;border:1px solid transparent;transition:all .15s;font-family:inherit;text-transform:uppercase}',
      '.tm-btn-pause{background:rgba(245,158,11,0.12);border-color:rgba(245,158,11,0.4);color:#f59e0b}',
      '.tm-btn-pause:hover{background:rgba(245,158,11,0.22)}',
      '.tm-btn-play{background:rgba(74,222,128,0.12);border-color:rgba(74,222,128,0.4);color:#4ade80}',
      '.tm-btn-play:hover{background:rgba(74,222,128,0.22)}',
      '.tm-btn-stop{background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.35);color:#ef4444}',
      '.tm-btn-stop:hover{background:rgba(239,68,68,0.2)}',
      // Empty + foot
      '.tm-empty{grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:10px;padding:60px 20px;text-align:center}',
      '.tm-empty-ico{font-size:40px;opacity:.5}',
      '.tm-empty-t{font-size:15px;font-weight:800;color:#e8ecf4;letter-spacing:.04em}',
      '.tm-empty-s{font-size:12px;color:rgba(220,224,235,0.5);max-width:380px;line-height:1.5}',
      '.tm-foot{flex-shrink:0;font-size:11px;color:rgba(220,224,235,0.4);text-align:center;padding-top:4px}',
      // Formulario modal
      '.tm-form-ov{position:fixed;inset:0;z-index:100050;background:rgba(2,6,16,0.7);backdrop-filter:blur(4px);'+
        'display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s}',
      '.tm-form-ov.show{opacity:1}',
      '.tm-form{width:min(420px,92vw);background:rgba(12,10,24,0.97);border:1px solid rgba(167,139,250,0.4);'+
        'box-shadow:0 24px 80px rgba(0,0,0,0.7),0 0 40px rgba(139,92,246,0.15);'+
        'transform:translateY(8px);transition:transform .2s}',
      '.tm-form-ov.show .tm-form{transform:none}',
      '.tm-form-head{display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid rgba(255,255,255,0.07)}',
      '.tm-form-ico{font-size:18px}',
      '.tm-form-t{font-size:14px;font-weight:800;letter-spacing:.06em;color:#f0f4f8;flex:1}',
      '.tm-form-x{background:none;border:none;color:rgba(220,224,235,0.5);font-size:16px;cursor:pointer;padding:2px 6px}',
      '.tm-form-x:hover{color:#fff}',
      '.tm-form-body{padding:18px;display:flex;flex-direction:column;gap:14px}',
      '.tm-field{display:flex;flex-direction:column;gap:6px}',
      '.tm-field-l{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:rgba(220,224,235,0.6)}',
      '.tm-opt{font-weight:600;color:rgba(220,224,235,0.35);text-transform:none;letter-spacing:0}',
      '.tm-input{background:rgba(255,255,255,0.04);border:1px solid rgba(167,139,250,0.25);color:#f0f4f8;'+
        'padding:10px 12px;font-size:13px;font-family:inherit;border-radius:0;outline:none;transition:border-color .15s}',
      '.tm-input:focus{border-color:rgba(167,139,250,0.6);background:rgba(255,255,255,0.06)}',
      '.tm-form-hint{font-size:11px;color:rgba(220,224,235,0.45)}',
      '.tm-form-actions{display:flex;gap:10px;padding:0 18px 18px}',
      '.tm-btn-ghost{background:transparent;border-color:rgba(255,255,255,0.15);color:rgba(220,224,235,0.7)}',
      '.tm-btn-ghost:hover{border-color:rgba(255,255,255,0.3);color:#fff}',
      '.tm-btn-create{background:rgba(139,92,246,0.18);border-color:rgba(167,139,250,0.55);color:#c4b5fd}',
      '.tm-btn-create:hover{background:rgba(139,92,246,0.3)}',
      '.tm-form-msg{padding:0 18px 16px;font-size:11px;min-height:14px}',
      '.tm-form-msg-ok{color:#4ade80}',
      '.tm-form-msg-err{color:#ef4444}',
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
