/* RAW Entry — Audio v.8.43 (audio diegético del HUD, opt-in)
   ═══════════════════════════════════════════════════════════════════
   Todo SINTETIZADO con Web Audio API — cero archivos, cero descargas,
   CPU despreciable (corre en el hilo de audio del navegador).

   CAPA 1 · AMBIENTE ESPACIAL BINAURAL:
     · Dos osciladores graves casi idénticos: 110 Hz (izq) y 114 Hz (der)
       → el cerebro percibe un batido de 4 Hz (rango theta: calma).
     · Un pad suave (220 Hz) que respira con un LFO lento.
     · "Viento cósmico": ruido filtrado grave, apenas presente.
   CAPA 2 · SONIDOS DEL HUD (diegéticos):
     · tick al navegar el anillo · chime al expandir · whoosh en el warp
     · ping cuando pasa una onda cósmica
   OPT-IN: botón discreto (los navegadores exigen gesto del usuario).
   La preferencia se recuerda. Apagado = el módulo duerme por completo.
   ═══════════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  if(window.innerWidth < 900) return;

  var ctx = null, master = null, activo = false;
  var _ambNodes = [];

  function _crearCtx(){
    if(ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.0;
    master.connect(ctx.destination);
  }

  // ── CAPA 1: ambiente binaural ──────────────────────────────────────
  function _iniciarAmbiente(){
    // Graves binaurales: 110 Hz izq / 114 Hz der (batido theta de 4 Hz)
    [[110, -1], [114, 1]].forEach(function(par){
      var osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = par[0];
      var g = ctx.createGain(); g.gain.value = 0.05;
      var pan = ctx.createStereoPanner(); pan.pan.value = par[1];
      osc.connect(g); g.connect(pan); pan.connect(master);
      osc.start();
      _ambNodes.push(osc, g, pan);
    });
    // Pad que respira (220 Hz con LFO lento sobre su ganancia)
    var pad = ctx.createOscillator(); pad.type = 'triangle'; pad.frequency.value = 220;
    var padG = ctx.createGain(); padG.gain.value = 0.012;
    var lfo = ctx.createOscillator(); lfo.frequency.value = 0.07;   // ~14s por ciclo
    var lfoG = ctx.createGain(); lfoG.gain.value = 0.008;
    lfo.connect(lfoG); lfoG.connect(padG.gain);
    pad.connect(padG); padG.connect(master);
    pad.start(); lfo.start();
    _ambNodes.push(pad, padG, lfo, lfoG);
    // Viento cósmico: ruido browniano filtrado grave
    var buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    var d = buf.getChannelData(0); var last = 0;
    for(var i=0;i<d.length;i++){ var w = Math.random()*2-1; d[i] = (last + 0.02*w)/1.02; last = d[i]; }
    var noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 260;
    var nG = ctx.createGain(); nG.gain.value = 0.06;
    noise.connect(lp); lp.connect(nG); nG.connect(master);
    noise.start();
    _ambNodes.push(noise, lp, nG);
  }

  // ── CAPA 2: sonidos del HUD (síntesis puntual, se autodestruyen) ──
  function _blip(freq, dur, tipo, gain, freqFin){
    if(!activo || !ctx) return;
    var t = ctx.currentTime;
    var o = ctx.createOscillator(); o.type = tipo || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if(freqFin) o.frequency.exponentialRampToValueAtTime(freqFin, t + dur);
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain || 0.08, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function tick(){ _blip(880, 0.05, 'sine', 0.05); }
  function chime(){ _blip(520, 0.18, 'sine', 0.06); setTimeout(function(){ _blip(780, 0.22, 'sine', 0.05); }, 70); }
  function ping(){ _blip(640, 0.35, 'sine', 0.045, 320); }
  function whoosh(){
    if(!activo || !ctx) return;
    var t = ctx.currentTime;
    var buf = ctx.createBuffer(1, ctx.sampleRate * 0.7, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for(var i=0;i<d.length;i++){ d[i] = Math.random()*2-1; }
    var src = ctx.createBufferSource(); src.buffer = buf;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(180, t);
    bp.frequency.exponentialRampToValueAtTime(2400, t + 0.55);
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.10, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);
    src.connect(bp); bp.connect(g); g.connect(master);
    src.start(t);
  }

  // ── Activar / desactivar ───────────────────────────────────────────
  function activar(){
    _crearCtx();
    if(ctx.state === 'suspended') ctx.resume();
    if(!_ambNodes.length) _iniciarAmbiente();
    activo = true;
    // fade-in suave del master
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.9, ctx.currentTime + 1.8);
    try{ localStorage.setItem('rawAudioOn','1'); }catch(e){}
    _btnRefrescar();
  }
  function desactivar(){
    activo = false;
    if(ctx && master){
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.0, ctx.currentTime + 0.6);
    }
    try{ localStorage.setItem('rawAudioOn','0'); }catch(e){}
    _btnRefrescar();
  }

  // ── Botón discreto (esquina inferior izquierda) ────────────────────
  var _btn = null;
  function _btnRefrescar(){
    if(!_btn) return;
    _btn.innerHTML = activo ? '♪ ON' : '♪ OFF';
    _btn.style.color = activo ? 'var(--acc-violet, #8B5CF6)' : 'var(--hud-text-faint, rgba(200,210,220,0.25))';
  }
  function _crearBoton(){
    _btn = document.createElement('button');
    _btn.id = 'raw-audio-btn';
    _btn.title = 'Audio del HUD (ambiente espacial + sonidos)';
    _btn.style.cssText = [
      'position:fixed','left:14px','bottom:12px','z-index:9500',
      'background:transparent','border:none','cursor:pointer',
      'font-family:"JetBrains Mono",ui-monospace,monospace','font-size:10px',
      'letter-spacing:.14em','padding:6px 8px','opacity:.7',
      'transition:opacity .2s'
    ].join(';');
    _btn.onmouseover = function(){ _btn.style.opacity = '1'; };
    _btn.onmouseout  = function(){ _btn.style.opacity = '.7'; };
    _btn.onclick = function(){ activo ? desactivar() : activar(); };
    document.body.appendChild(_btn);
    _btnRefrescar();
  }

  // ── Ganchos diegéticos (sin envolver funciones delicadas) ──────────
  function _ganchos(){
    // warp: observar la clase niv-warp en <html>
    var _warpPrev = false;
    new MutationObserver(function(){
      var w = document.documentElement.classList.contains('niv-warp');
      if(w && !_warpPrev) whoosh();
      _warpPrev = w;
    }).observe(document.documentElement, { attributes:true, attributeFilter:['class'] });

    // tick de navegación: flechas y clic en cards del anillo
    document.addEventListener('keydown', function(e){
      if(e.key === 'ArrowLeft' || e.key === 'ArrowRight') tick();
    }, { passive:true });
    document.addEventListener('click', function(e){
      if(e.target && e.target.closest && e.target.closest('.cf7-ghost')) tick();
    }, { passive:true });

    // ping de onda cósmica: envolver _ondaCosmica (función simple, seguro)
    var _esperarOnda = setInterval(function(){
      if(typeof window._ondaCosmica === 'function' && !window._ondaCosmica.__conAudio){
        var orig = window._ondaCosmica;
        window._ondaCosmica = function(c){ ping(); return orig(c); };
        window._ondaCosmica.__conAudio = true;
        clearInterval(_esperarOnda);
      }
    }, 500);
  }

  function init(){
    _crearBoton();
    _ganchos();
    // Si el usuario ya lo tenía encendido, reactivar al primer gesto
    // (el navegador no permite audio sin interacción).
    var pref = null;
    try{ pref = localStorage.getItem('rawAudioOn'); }catch(e){}
    if(pref === '1'){
      var arrancar = function(){
        activar();
        document.removeEventListener('pointerdown', arrancar);
        document.removeEventListener('keydown', arrancar);
      };
      document.addEventListener('pointerdown', arrancar, { once:true });
      document.addEventListener('keydown', arrancar, { once:true });
    }
  }

  window.RawAudio = { activar:activar, desactivar:desactivar, tick:tick, chime:chime, ping:ping, whoosh:whoosh };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
