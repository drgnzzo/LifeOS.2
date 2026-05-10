/* RAW Entry — Overlay v.5.087
   Cambios desde v5.086 (FASE 1 del expansor estilo carrusel):
   - ELIMINADO panel _p6 Navegación (sus acciones siguen disponibles
     en los botones del Hero del header).
   - NUEVO botón ⛶ (expandir) en el header de cada panel, junto al "···".
   - NUEVA mecánica del expansor:
     · Click en ⛶ o en el CTA del pie → el panel crece al CENTRO ocupando
       el área que tenía el dial.
     · El dial se ACHICA y baja a la zona inferior (mini circular ~80px
       arriba de las cards Misión/Nivel).
     · Misión y Nivel se mueven a los lados (Logro y Track desaparecen
       temporalmente con opacity:0).
     · Click en el dial mini → todo regresa al estado normal con animación.
   - Los demás paneles laterales se ACHICAN a 240px y siguen visibles
     (P3a confirmado).
   - Si ya hay un panel expandido y se hace click en otro → INTERCAMBIO
     directo (P-Ca confirmado).
   - DnD DESACTIVADO mientras hay panel expandido (P6 confirmado).
   - Easing: cubic-bezier(.4,1.4,.5,1) — mismo de los anillos del dial (P7).

   Vista expandida (Fase 1): por ahora muestra placeholder con spinner.
   En Fase 2+ traeremos el contenido de Home (Patrimonio expandido,
   Financiero con Identidad, Fijos y Variables con tabla+gráfico,
   Necesidades con radar+distribución).

   ── Heredado v5.086 ──
   Sims needs en 0 si no hay datos, banda Sim en grid 3×3, ancho dial 760px,
   dial centrado, cards inferiores juntas centradas (P1b).
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
    // Color barra: rojo crítico (<30), amarillo medio (30-55), color del need (>55), gris si =0
    var barCol = v === 0 ? 'rgba(120,120,130,0.45)' : (v < 30 ? '#EF4444' : (v < 55 ? '#FBBF24' : col));
    var valCol = v === 0 ? 'rgba(180,184,200,0.50)' : barCol;
    return ''+
      '<div class="hud-need">'+
        '<span class="hud-need-ico" style="color:'+col+';filter:drop-shadow(0 0 4px '+col+'88)">'+s.icon+'</span>'+
        '<span class="hud-need-l">'+s.label+'</span>'+
        '<div class="hud-need-bar-wrap">'+
          '<div class="hud-need-bar" style="width:'+v+'%;background:linear-gradient(90deg,'+barCol+'aa,'+barCol+');box-shadow:0 0 6px '+barCol+'88"></div>'+
        '</div>'+
        '<span class="hud-need-v" style="color:'+valCol+'">'+v+'<span class="max">/100</span></span>'+
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
  _dialCanvas.style.cssText = 'display:block;cursor:pointer;width:min(760px,52vw);height:min(760px,52vw);position:relative;pointer-events:auto;z-index:1';
  _dialCtx = _dialCanvas.getContext('2d');

  _dialOverlay.style.cssText = [
    'position:fixed','inset:0','z-index:9000',
    'display:none','align-items:center','justify-content:center',
    'opacity:0','pointer-events:none',
    'background:radial-gradient(ellipse at center,rgba(80,40,140,0.15) 0%,rgba(4,4,14,0.65) 100%)',
    'backdrop-filter:blur(28px) saturate(160%) brightness(0.68)',
    '-webkit-backdrop-filter:blur(28px) saturate(160%) brightness(0.68)',
  ].join(';');

  // ── Glow ambiental ──
  var _glowEl = document.createElement('div');
  _glowEl.id = 'dial-ambient';
  _glowEl.style.cssText = [
    'position:absolute','inset:0','pointer-events:none','z-index:0',
    'background:radial-gradient(ellipse 600px 600px at 50% 50%, rgba(120,80,200,0.06) 0%, transparent 70%)',
    'animation:dialBreath 4s ease-in-out infinite',
  ].join(';');
  if(!document.getElementById('dial-keyframes')){
    var ks = document.createElement('style');
    ks.id = 'dial-keyframes';
    ks.textContent = [
      '@keyframes dialBreath{0%,100%{opacity:.6;transform:scale(1);}50%{opacity:1;transform:scale(1.08);}}',
      '@keyframes dialGlowPulse{0%,100%{box-shadow:0 0 0 1px rgba(120,80,200,0.08),0 4px 32px rgba(0,0,0,0.5);}50%{box-shadow:0 0 0 1px rgba(140,100,220,0.20),0 4px 48px rgba(80,40,140,0.3),0 0 60px rgba(120,80,200,0.08);}}',
      '.hud-panel-glow{animation:dialGlowPulse 4s ease-in-out infinite;}',
    ].join('');
    document.head.appendChild(ks);
  }
  _dialOverlay.appendChild(_glowEl);

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
      '.hud-pnl.hud-expanded{transition:left .42s cubic-bezier(.4,1.4,.5,1),top .42s cubic-bezier(.4,1.4,.5,1),width .42s cubic-bezier(.4,1.4,.5,1),height .42s cubic-bezier(.4,1.4,.5,1)!important;z-index:9050!important}',
      // Wrapper de contenido expandido (oculto por defecto, visible cuando .hud-expanded)
      '.hud-expanded-content{display:none;flex:1;min-height:0;overflow:auto;padding:14px 18px}',
      '.hud-expanded .hud-expanded-content{display:flex;flex-direction:column;gap:14px}',
      '.hud-expanded .hud-collapsed-content{display:none}',
      // Botón expandir cambia de icono cuando ya está expandido
      '.hud-expanded .hud-h-expand i{transform:rotate(180deg)}',
      '.hud-h-bar{height:1px;margin:0 16px;background:linear-gradient(90deg,var(--ac-50),transparent)}',
      // hero
      '.hud-hero{padding:14px 16px 10px;display:flex;align-items:flex-start;justify-content:space-between;gap:12px}',
      '.hud-hero-l{flex:1;min-width:0}',
      '.hud-hero-lbl{font-size:9px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:rgba(200,208,230,0.40);margin-bottom:6px}',
      '.hud-hero-v{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1;font-family:JetBrains Mono,ui-monospace,monospace}',
      '.hud-hero-v .cents{font-size:18px;opacity:.45;font-weight:700}',
      '.hud-hero-chip{padding:5px 9px;border-radius:7px;font-size:10px;font-weight:800;letter-spacing:.06em;display:flex;flex-direction:column;align-items:flex-end;gap:1px;line-height:1.1;flex-shrink:0}',
      '.hud-hero-chip .chip-sub{font-size:8px;font-weight:600;opacity:.7;text-transform:uppercase;letter-spacing:.10em}',
      // mini-bar (fondo emergencia)
      '.hud-mini{padding:0 16px 14px}',
      '.hud-mini-row{display:flex;align-items:center;justify-content:space-between;font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(200,208,230,0.50);margin-bottom:6px}',
      '.hud-mini-row .v{font-size:11px;font-weight:800;color:var(--ac);letter-spacing:0;text-transform:none;font-family:JetBrains Mono,monospace}',
      '.hud-mini-bar{height:5px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.04)}',
      '.hud-mini-fill{height:100%;border-radius:999px;transition:width .8s ease}',
      // row
      '.hud-row{display:flex;align-items:center;gap:10px;padding:8px 16px}',
      '.hud-row + .hud-row{border-top:1px solid rgba(255,255,255,0.04)}',
      '.hud-row-ico{width:18px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:12px}',
      '.hud-row-l{flex:1;min-width:0;font-size:13px;font-weight:600;color:rgba(220,224,235,0.78);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-row-bar{width:60px;height:3px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;flex-shrink:0}',
      '.hud-row-bar > div{height:100%;width:0;border-radius:999px;transition:width .8s ease}',
      '.hud-row-v{font-size:13px;font-weight:700;letter-spacing:0;flex-shrink:0;text-align:right;min-width:78px;font-family:JetBrains Mono,monospace}',
      // maslow
      '.hud-mas{padding:8px 16px}',
      '.hud-mas + .hud-mas{border-top:1px solid rgba(255,255,255,0.04)}',
      '.hud-mas-top{display:flex;align-items:center;gap:8px;margin-bottom:5px}',
      '.hud-mas-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;animation:hudDotPulse 2.5s ease-in-out infinite}',
      '.hud-mas-l{flex:1;font-size:13px;font-weight:600;color:rgba(220,224,235,0.78);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-mas-v{font-size:12px;font-weight:700;letter-spacing:0;text-align:right;font-family:JetBrains Mono,monospace}',
      '.hud-mas-bar{height:3px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;margin-left:15px}',
      '.hud-mas-bar > div{height:100%;width:0;border-radius:999px;transition:width .9s ease}',
      // need (sims) - layout horizontal: ico + label + barra + valor
      '.hud-need{display:flex;align-items:center;gap:9px;min-width:0;padding:0}',
      '.hud-need-ico{font-size:14px;flex-shrink:0;width:16px;display:flex;align-items:center;justify-content:center;line-height:1}',
      '.hud-need-l{flex-shrink:0;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:rgba(220,224,235,0.65);width:62px}',
      '.hud-need-bar-wrap{flex:1;height:8px;background:rgba(255,255,255,0.08);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);position:relative;min-width:30px;box-shadow:inset 0 1px 2px rgba(0,0,0,0.45)}',
      '.hud-need-bar{height:100%;border-radius:999px;transition:width .8s ease;position:relative;min-width:1px}',
      '.hud-need-bar::after{content:"";position:absolute;top:1px;left:4px;right:4px;height:2px;background:rgba(255,255,255,0.45);border-radius:999px;filter:blur(0.6px)}',
      '.hud-need-v{font-size:10px;font-weight:800;font-family:JetBrains Mono,monospace;flex-shrink:0;text-align:right;line-height:1;min-width:42px}',
      '.hud-need-v .max{opacity:.40;font-weight:700;font-size:8px}',
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
      '.hud-trio-cell .v{font-size:18px;font-weight:800;line-height:1;font-family:JetBrains Mono,monospace}',
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
      '.hud-user{display:flex;align-items:center;gap:14px;padding:14px 16px;height:100%;box-sizing:border-box}',
      '.hud-user-av{width:48px;height:48px;display:flex;align-items:center;justify-content:center;border-radius:0;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);flex-shrink:0;position:relative}',
      '.hud-user-av i{font-size:18px}',
      '.hud-user-c{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}',
      '.hud-user-row1{display:flex;align-items:baseline;gap:10px}',
      '.hud-user-name{font-size:18px;font-weight:800;letter-spacing:.06em;color:#fff}',
      '.hud-user-niv{font-size:11px;font-weight:700;color:rgba(220,224,235,0.65);letter-spacing:.04em}',
      '.hud-user-niv-badge{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:3px;font-size:8px}',
      '.hud-user-bar{height:5px;background:rgba(255,255,255,0.05);border-radius:999px;overflow:hidden;width:100%}',
      '.hud-user-bar > div{height:100%;border-radius:999px;transition:width .8s ease}',
      '.hud-user-xp{font-size:10px;font-weight:700;color:rgba(220,224,235,0.55);text-align:right;font-family:JetBrains Mono,monospace}',
      // sim panel band
      '.hud-sim-h{display:flex;align-items:center;gap:10px;padding:13px 18px 8px}',
      '.hud-sim-h .ico{width:26px;height:26px;border-radius:7px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.hud-sim-h .ico i{font-size:11px}',
      '.hud-sim-h .t{font-size:12px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;flex:1}',
      '.hud-sim-h .meta{font-size:9px;font-weight:700;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.40)}',
      '.hud-sim-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 24px;padding:6px 18px 14px}',
      // stats panel
      '.hud-stats-row{display:flex;align-items:stretch;justify-content:space-around;gap:6px;padding:12px 14px;height:100%;box-sizing:border-box}',
      '.hud-stats-cell{flex:1;display:flex;align-items:center;gap:10px;min-width:0;padding:0 4px}',
      '.hud-stats-cell + .hud-stats-cell{border-left:1px solid rgba(255,255,255,0.06)}',
      '.hud-stats-ico{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0}',
      '.hud-stats-ico i{font-size:15px}',
      '.hud-stats-txt{display:flex;flex-direction:column;gap:1px;min-width:0}',
      '.hud-stats-v{font-size:20px;font-weight:800;line-height:1;font-family:JetBrains Mono,monospace}',
      '.hud-stats-v .max{opacity:.40;font-weight:700;font-size:11px;margin-left:2px}',
      '.hud-stats-l{font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:rgba(220,224,235,0.45)}',
      // bottom cards (mision, logro, nivel)
      '.hud-card{display:flex;align-items:center;gap:12px;padding:13px 16px}',
      '.hud-card-ico{width:42px;height:42px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border-radius:10px}',
      '.hud-card-ico-hex{width:42px;height:42px;display:flex;align-items:center;justify-content:center;flex-shrink:0;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%)}',
      '.hud-card-ico-hex span{font-size:15px;font-weight:800;color:#fff}',
      '.hud-card-ico i{font-size:16px}',
      '.hud-card-c{flex:1;display:flex;flex-direction:column;gap:4px;min-width:0}',
      '.hud-card-h{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.hud-card-l{font-size:9px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}',
      '.hud-card-r{font-size:11px;font-weight:800;font-family:JetBrains Mono,monospace}',
      '.hud-card-sub{font-size:11px;font-weight:600;color:rgba(220,224,235,0.62);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.hud-card-bar{height:6px;background:rgba(255,255,255,0.10);border-radius:999px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);box-shadow:inset 0 1px 2px rgba(0,0,0,0.40)}',
      '.hud-card-bar > div{height:100%;width:0;border-radius:999px;transition:width .8s ease;min-width:1px}',
      '.hud-card-end{font-size:10px;font-weight:800;letter-spacing:.06em;flex-shrink:0;font-family:JetBrains Mono,monospace}',
      // track
      '.hud-track{display:flex;align-items:center;gap:18px;padding:14px 20px;height:100%;box-sizing:border-box}',
      '.hud-track-cur{display:flex;align-items:center;gap:10px;flex-shrink:0}',
      '.hud-track-hex{width:38px;height:38px;display:flex;align-items:center;justify-content:center;clip-path:polygon(25% 4%,75% 4%,100% 50%,75% 96%,25% 96%,0 50%);flex-shrink:0}',
      '.hud-track-hex span{font-size:14px;font-weight:800;color:#fff}',
      '.hud-track-cur-info{display:flex;flex-direction:column;gap:2px}',
      '.hud-track-cur-l{font-size:9px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;color:rgba(220,224,235,0.45)}',
      '.hud-track-cur-v{font-size:13px;font-weight:800;font-family:JetBrains Mono,monospace}',
      '.hud-track-mid{display:flex;align-items:center;gap:8px;flex:1;justify-content:center;flex-wrap:nowrap}',
    ].join('\n');
    document.head.appendChild(ds);
  }

  // ── Helpers de contenido ──
  // Header de panel: icono en caja + título + menú "···"
  function _pH(label, color, icon){
    return '<div class="hud-h" style="--ac:'+color+'">'+
      '<div class="hud-h-ico" style="background:'+_rgba(color,0.14)+';border:1px solid '+_rgba(color,0.40)+';box-shadow:0 0 12px '+_rgba(color,0.20)+'">'+
        '<i class="fas '+icon+'" style="color:'+color+';filter:drop-shadow(0 0 4px '+color+')"></i>'+
      '</div>'+
      '<span class="hud-h-t" style="color:'+color+';text-shadow:0 0 12px '+_rgba(color,0.50)+'">'+label+'</span>'+
      '<button class="hud-h-expand" data-color="'+color+'" title="Expandir" '+
        'style="color:'+color+';text-shadow:0 0 6px '+_rgba(color,0.40)+'">'+
        '<i class="fas fa-up-right-and-down-left-from-center"></i>'+
      '</button>'+
      '<span class="hud-h-k">···</span>'+
    '</div>'+
    '<div class="hud-h-bar" style="--ac-50:'+_rgba(color,0.40)+'"></div>';
  }

  // Pie CTA sutil (link, no banner)
  // Click → expande el panel padre (modo carrusel inline).
  // El parámetro `fn` se ignora ahora — antes navegaba a un panel externo
  // (irAPatrimonio, etc). Mantenemos el parámetro por compat con llamadas existentes.
  function _pCTA(label, color, fn){
    return '<div class="hud-cta hud-cta-expand" style="'+
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
  //  ZONA SUPERIOR
  // ══════════════════════════════════════

  // ── _pUser (top-left): hexágono + USER + Nivel + barra XP ──
  var _pUser = _mkFloatPanel('hud-user','#A78BFA','rgba(167,139,250,0.15)');
  document.body.appendChild(_pUser);
  _pUser.classList.add('hud-pnl');
  _pUser.style.animationDelay = '0s';
  _pUser.style.borderRadius = '14px';
  document.getElementById('hud-user-inner').innerHTML =
    '<div class="hud-user">'+
      '<div class="hud-user-av" style="background:radial-gradient(circle,'+_rgba('#A78BFA',0.22)+','+_rgba('#A78BFA',0.05)+');border:1.5px solid #A78BFA;box-shadow:0 0 16px '+_rgba('#A78BFA',0.45)+',inset 0 0 8px '+_rgba('#A78BFA',0.18)+'">'+
        '<i class="fas fa-user" style="color:#fff;text-shadow:0 0 8px #A78BFA"></i>'+
      '</div>'+
      '<div class="hud-user-c">'+
        '<div class="hud-user-row1">'+
          '<span class="hud-user-name">USER</span>'+
          '<span class="hud-user-niv">Nivel <span id="_hud-user-nivel">1</span></span>'+
          '<span class="hud-user-niv-badge" style="background:'+_rgba('#A78BFA',0.20)+';border:1px solid '+_rgba('#A78BFA',0.45)+';color:#A78BFA"><i class="fas fa-shield-halved"></i></span>'+
        '</div>'+
        '<div class="hud-user-bar"><div id="_hud-user-xpbar" style="background:linear-gradient(90deg,#A78BFA,#C084FC);box-shadow:0 0 6px '+_rgba('#A78BFA',0.55)+'"></div></div>'+
        '<div class="hud-user-xp" id="_hud-user-xp">0 / 1,000 XP</div>'+
      '</div>'+
    '</div>';

  // ── _pSim (top-center): banda Sims, 9 needs en grid 2 cols ──
  var _pSim = _mkFloatPanel('hud-sim-band','#FBBF24','rgba(251,191,36,0.15)');
  document.body.appendChild(_pSim);
  _pSim.classList.add('hud-pnl');
  _pSim.style.animationDelay = '0.4s';
  _pSim.style.borderRadius = '14px';
  document.getElementById('hud-sim-band-inner').innerHTML =
    '<div class="hud-sim-h">'+
      '<div class="ico" style="background:'+_rgba('#FBBF24',0.16)+';border:1px solid '+_rgba('#FBBF24',0.45)+';box-shadow:0 0 12px '+_rgba('#FBBF24',0.30)+'">'+
        '<i class="fas fa-heart-pulse" style="color:#FBBF24"></i>'+
      '</div>'+
      '<span class="t" style="color:#FBBF24;text-shadow:0 0 10px '+_rgba('#FBBF24',0.50)+'">Estado del Sim</span>'+
      '<span class="meta">9 needs</span>'+
    '</div>'+
    '<div id="hud-sim-band-grid" class="hud-sim-grid"></div>';
  if(typeof renderSimsBandSimsStyle === 'function') renderSimsBandSimsStyle('hud-sim-band-grid');

  // ── _pStats (top-right): Energía / Racha / Créditos en 3 cells ──
  var _pStats = _mkFloatPanel('hud-stats','#FBBF24','rgba(251,191,36,0.15)');
  document.body.appendChild(_pStats);
  _pStats.classList.add('hud-pnl');
  _pStats.style.animationDelay = '0.8s';
  _pStats.style.borderRadius = '14px';
  document.getElementById('hud-stats-inner').innerHTML =
    '<div class="hud-stats-row">'+
      // Energía
      '<div class="hud-stats-cell">'+
        '<div class="hud-stats-ico" style="background:'+_rgba('#FBBF24',0.14)+';border:1px solid '+_rgba('#FBBF24',0.40)+';box-shadow:0 0 12px '+_rgba('#FBBF24',0.25)+'">'+
          '<i class="fas fa-bolt" style="color:#FBBF24;filter:drop-shadow(0 0 4px #FBBF24)"></i>'+
        '</div>'+
        '<div class="hud-stats-txt">'+
          '<span class="hud-stats-v" style="color:#FBBF24"><span id="_hud-energia">—</span><span class="max">/100</span></span>'+
          '<span class="hud-stats-l">Energía</span>'+
        '</div>'+
      '</div>'+
      // Racha
      '<div class="hud-stats-cell">'+
        '<div class="hud-stats-ico" style="background:'+_rgba('#FB923C',0.14)+';border:1px solid '+_rgba('#FB923C',0.40)+';box-shadow:0 0 12px '+_rgba('#FB923C',0.25)+'">'+
          '<i class="fas fa-fire" style="color:#FB923C;filter:drop-shadow(0 0 4px #FB923C)"></i>'+
        '</div>'+
        '<div class="hud-stats-txt">'+
          '<span class="hud-stats-v" style="color:#FB923C"><span id="_hud-racha-dias">—</span><span class="max"> días</span></span>'+
          '<span class="hud-stats-l">Racha actual</span>'+
        '</div>'+
      '</div>'+
      // Créditos
      '<div class="hud-stats-cell">'+
        '<div class="hud-stats-ico" style="background:'+_rgba('#22D3EE',0.14)+';border:1px solid '+_rgba('#22D3EE',0.40)+';box-shadow:0 0 12px '+_rgba('#22D3EE',0.25)+'">'+
          '<i class="fas fa-gem" style="color:#22D3EE;filter:drop-shadow(0 0 4px #22D3EE)"></i>'+
        '</div>'+
        '<div class="hud-stats-txt">'+
          '<span id="_hud-creditos" class="hud-stats-v" style="color:#22D3EE">—</span>'+
          '<span class="hud-stats-l">Créditos</span>'+
        '</div>'+
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
    _hero('_hud-saldo','#22C55E','Disponible hoy','_hud-saldo-chip') +
    _miniBar('Fondo emergencia','_hud-fondo-pct','_hud-fondo-bar','#22C55E') +
    _row('BBVA',     '_hud-bbva',  '#4ADE80','_hud-bbva-bar','fa-building-columns') +
    _row('BEATS',    '_hud-beats', '#86EFAC','_hud-beats-bar','fa-credit-card') +
    _row('Efectivo', '_hud-efec',  '#FCD34D',null,'fa-money-bill-wave') +
    _row('Apartados','_hud-apart', '#F59E0B',null,'fa-lock') +
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
    // Ingresos / Egresos lado a lado
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 16px 12px">'+
      '<div style="padding:10px 12px;background:'+_rgba('#22C55E',0.07)+';border:1px solid '+_rgba('#22C55E',0.28)+';border-radius:9px;position:relative;overflow:hidden">'+
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:#22C55E;box-shadow:0 0 8px #22C55E;opacity:.7"></div>'+
        '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#22C55E;margin-bottom:6px;opacity:.85">Ingresos</div>'+
        '<div id="_hud-fin-ing" style="font-size:18px;font-weight:800;color:#22C55E;font-family:JetBrains Mono,monospace;line-height:1;text-shadow:0 0 12px '+_rgba('#22C55E',0.40)+'">—</div>'+
      '</div>'+
      '<div style="padding:10px 12px;background:'+_rgba('#EF4444',0.07)+';border:1px solid '+_rgba('#EF4444',0.28)+';border-radius:9px;position:relative;overflow:hidden">'+
        '<div style="position:absolute;top:0;left:0;right:0;height:2px;background:#EF4444;box-shadow:0 0 8px #EF4444;opacity:.7"></div>'+
        '<div style="font-size:8px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#EF4444;margin-bottom:6px;opacity:.85">Egresos</div>'+
        '<div id="_hud-fin-egr" style="font-size:18px;font-weight:800;color:#EF4444;font-family:JetBrains Mono,monospace;line-height:1;text-shadow:0 0 12px '+_rgba('#EF4444',0.40)+'">—</div>'+
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
    '<div class="hud-track">'+
      '<div class="hud-track-cur">'+
        '<div class="hud-track-hex" style="background:radial-gradient(circle,'+_rgba('#A78BFA',0.22)+','+_rgba('#A78BFA',0.05)+');border:1.5px solid #A78BFA;box-shadow:0 0 16px '+_rgba('#A78BFA',0.45)+',inset 0 0 8px '+_rgba('#A78BFA',0.18)+'">'+
          '<span id="_hud-track-nivel">1</span>'+
        '</div>'+
        '<div class="hud-track-cur-info">'+
          '<span class="hud-track-cur-l">Nivel actual</span>'+
          '<span id="_hud-track-xp" class="hud-track-cur-v" style="color:#A78BFA;text-shadow:0 0 8px '+_rgba('#A78BFA',0.45)+'">0 / 1,000 XP</span>'+
        '</div>'+
      '</div>'+
      '<div class="hud-track-mid"><div id="_hud-track-stops" style="display:flex;align-items:center;gap:6px"></div></div>'+
      '<div style="flex-shrink:0"><i class="fas fa-trophy" style="font-size:20px;color:#A78BFA;filter:drop-shadow(0 0 6px '+_rgba('#A78BFA',0.55)+')"></i></div>'+
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
  _p1._side='left';    _p1._order=0;
  _p2._side='left';    _p2._order=1;
  _p3._side='left';    _p3._order=2;
  _p4._side='right';   _p4._order=0;
  _p5._side='right';   _p5._order=1;
  _pTrack._side='bottom-track';   _pTrack._order=0;
  _pMision._side='bottom-left';   _pMision._order=0;
  _pLogro._side='bottom-center';  _pLogro._order=0;
  _pNivel._side='bottom-right';   _pNivel._order=0;

  var _hudPanels = [
    {el:_pUser},{el:_pSim},{el:_pStats},
    {el:_p1},{el:_p2},{el:_p3},
    {el:_p4},{el:_p5},
    {el:_pTrack},
    {el:_pMision},{el:_pLogro},{el:_pNivel},
  ];

  // ── Reposicionar HUD ──
  function _reposicionarHUD(){
    if(!_dialCanvas||!window._hudPanels) return;
    var r   = _dialCanvas.getBoundingClientRect();
    var vW  = window.innerWidth;
    var vH  = window.innerHeight;
    var GAP = 14;

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
      // Calcular dimensiones del centro: el área que ocupaba el dial
      // Lo ampliamos para aprovechar también un poco más arriba/abajo
      var centerW = Math.min(900, vW - 480);    // ancho central deja columnas laterales
      var centerH = Math.round(vH * 0.55);       // alto central ~55% del viewport
      var topRowBottom = parseFloat(_pUser.style.top || 0) +
                         (_pUser.offsetHeight || 100) + GAP*2;
      var centerY = topRowBottom;
      var centerX = Math.round((vW - centerW) / 2);

      // Posicionar el panel expandido en el centro
      expandedEl.style.transition = 'left .42s cubic-bezier(.4,1.4,.5,1),top .42s cubic-bezier(.4,1.4,.5,1),width .42s cubic-bezier(.4,1.4,.5,1),height .42s cubic-bezier(.4,1.4,.5,1)';
      expandedEl.style.left   = centerX + 'px';
      expandedEl.style.top    = centerY + 'px';
      expandedEl.style.width  = centerW + 'px';
      expandedEl.style.height = centerH + 'px';
      expandedEl.style.minHeight = centerH + 'px';
      expandedEl.style.clipPath = chamferRect;

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
      var leftPanels  = window._hudPanels.filter(function(hp){
        return hp.el._side==='left' && hp.el !== expandedEl;
      });
      var rightPanels = window._hudPanels.filter(function(hp){
        return hp.el._side==='right' && hp.el !== expandedEl;
      });

      var leftX  = GAP;
      var rightX = vW - 240 - GAP;
      function placeColExpanded(panels, x){
        panels.sort(function(a,b){ return a.el._order - b.el._order; });
        var y = topRowBottom;
        panels.forEach(function(hp){
          hp.el.style.transition = 'left .42s cubic-bezier(.4,1.4,.5,1),top .42s cubic-bezier(.4,1.4,.5,1),width .42s cubic-bezier(.4,1.4,.5,1)';
          hp.el.style.left = x + 'px';
          hp.el.style.top  = y + 'px';
          hp.el.style.width = '240px';
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
      var pTrackEx  = getTop('bottom-track')[0];
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
      // (lo mantenemos en su misma posición del modo normal — solo la zona
      // central debajo de la fila top cambia)
      // Posicionamiento del top SIGUE el flujo normal de abajo, así que dejamos
      // que continúe el código siguiente. Pero los paneles laterales y bottom
      // ya están posicionados; debemos retornar.
      return;
    }

    // ── Restaurar estado del dial si veníamos de modo expandido ──
    if(_dialCanvas._wasMini){
      _dialCanvas.style.transition = 'width .42s cubic-bezier(.4,1.4,.5,1),height .42s cubic-bezier(.4,1.4,.5,1)';
      // Siguen las líneas normales de tamaño/posición
    }
    // Limpiar opacidad/pointer-events de Logro y Track al volver
    var pLogroBack = getTop('bottom-center')[0];
    var pTrackBack = getTop('bottom-track')[0];
    if(pLogroBack){ pLogroBack.el.style.opacity = ''; pLogroBack.el.style.pointerEvents = ''; }
    if(pTrackBack){ pTrackBack.el.style.opacity = ''; pTrackBack.el.style.pointerEvents = ''; }
    // Restaurar dial al tamaño/posición normal (fuera del flujo fixed)
    _dialCanvas.style.position   = 'relative';
    _dialCanvas.style.left       = '';
    _dialCanvas.style.top        = '';
    _dialCanvas.style.zIndex     = '1';
    _dialCanvas.style.cursor     = 'pointer';
    _dialCanvas.style.boxShadow  = '';
    _dialCanvas.style.borderRadius = '';
    _dialCanvas.style.width      = 'min(760px,52vw)';
    _dialCanvas.style.height     = 'min(760px,52vw)';
    _dialCanvas.title            = '';
    // Limpiar tamaño/posición forzados de paneles laterales (volverán al flujo)
    window._hudPanels.forEach(function(hp){
      if(hp.el === expandedEl) return;
      // Limpiar height y minHeight forzados (en panel expandido los habíamos puesto)
      hp.el.style.height = '';
      hp.el.style.minHeight = '';
    });

    // ══════════════════════════════════════════
    //  ZONA SUPERIOR — anchos compactos, Sim alineado al ancho del dial
    // ══════════════════════════════════════════
    var topPad  = GAP;
    var topGap  = 14;
    var pUser  = getTop('top-left')[0];
    var pSim   = getTop('top-center')[0];
    var pStats = getTop('top-right')[0];

    // Anchos FIJOS y compactos (no porcentaje del viewport)
    var wUser  = 220;
    var wStats = 340;
    // Sim un poco más ancho que el dial (+15%) para que los labels respiren
    var wSim   = Math.round(r.width * 1.15);
    // Si el viewport es muy estrecho, fallback: solo Sim centrado
    if(vW < (wUser + wStats + wSim + topGap*4 + topPad*2)){
      wUser = 0; wStats = 0;
      wSim = Math.min(Math.round(r.width * 1.15), vW - topPad*2);
    }

    if(pUser && wUser>0){ pUser.el.style.width = wUser+'px'; pUser.el.style.visibility='visible'; }
    else if(pUser){ pUser.el.style.width='0px'; pUser.el.style.opacity='0'; pUser.el.style.visibility='hidden'; }
    if(pSim){ pSim.el.style.width = wSim+'px'; }
    if(pStats && wStats>0){ pStats.el.style.width = wStats+'px'; pStats.el.style.visibility='visible'; }
    else if(pStats){ pStats.el.style.width='0px'; pStats.el.style.opacity='0'; pStats.el.style.visibility='hidden'; }

    // Altura uniforme entre USER, Sim y Stats
    var topMaxH = 0;
    [pUser,pSim,pStats].forEach(function(hp){
      if(hp && hp.el && hp.el.style.width !== '0px'){
        hp.el.style.minHeight = '';
        var h = hp.el.scrollHeight || hp.el.offsetHeight || 90;
        if(h>topMaxH) topMaxH = h;
      }
    });
    if(topMaxH===0) topMaxH = 100;
    [pUser,pSim,pStats].forEach(function(hp){
      if(hp && hp.el && hp.el.style.width !== '0px'){
        hp.el.style.minHeight = topMaxH+'px';
        var inner = hp.el.querySelector(':scope > [id$="-inner"]');
        if(inner){
          inner.style.minHeight = topMaxH+'px';
          inner.style.justifyContent = 'center';
        }
      }
    });

    var topY = topPad;
    // Sim CENTRADO en X igual que el dial
    var simX = Math.round((vW - wSim) / 2);
    if(pSim){
      pSim.el.style.left = simX + 'px';
      pSim.el.style.top  = topY + 'px';
      pSim.el.style.clipPath = chamferRect;
    }
    // USER pegado a la izquierda
    if(pUser && wUser>0){
      pUser.el.style.left = topPad + 'px';
      pUser.el.style.top  = topY + 'px';
      pUser.el.style.clipPath = chamferRect;
    }
    // Stats pegado a la derecha
    if(pStats && wStats>0){
      pStats.el.style.left = (vW - topPad - wStats) + 'px';
      pStats.el.style.top  = topY + 'px';
      pStats.el.style.clipPath = chamferRect;
    }

    // ══════════════════════════════════════════
    //  ZONA INFERIOR — track + 3 cards
    // ══════════════════════════════════════════
    var pTrack  = getTop('bottom-track')[0];
    var pMision = getTop('bottom-left')[0];
    var pLogro  = getTop('bottom-center')[0];
    var pNivel  = getTop('bottom-right')[0];

    var botPad  = GAP;
    var botGap  = 12;

    // P1b: las 3 cards JUNTAS y CENTRADAS como un bloque.
    // Misión y Nivel anchos fijos; Logro al ancho del dial. Si el total
    // excede el viewport, se reparten proporcionales.
    var wMision = 320;
    var wNivel  = 360;
    var wLogro  = Math.round(r.width);
    var totalCards = wMision + wLogro + wNivel + botGap*2;
    if(totalCards > vW - botPad*2){
      var availBot = vW - botPad*2 - botGap*2;
      wMision = Math.round(availBot * 0.25);
      wNivel  = Math.round(availBot * 0.28);
      wLogro  = availBot - wMision - wNivel;
      totalCards = wMision + wLogro + wNivel + botGap*2;
    }

    if(pMision){ pMision.el.style.width = wMision+'px'; }
    if(pLogro){ pLogro.el.style.width = wLogro+'px'; }
    if(pNivel){ pNivel.el.style.width = wNivel+'px'; }

    // Track: ancho EXACTO del dial
    var trackW = Math.round(r.width);
    if(pTrack){ pTrack.el.style.width = trackW+'px'; }

    var botH = 0;
    [pMision,pLogro,pNivel].forEach(function(hp){
      if(hp && hp.el){
        var h = hp.el.scrollHeight || hp.el.offsetHeight || 80;
        if(h>botH) botH = h;
      }
    });
    if(botH===0) botH = 80;
    var trackH = (pTrack && pTrack.el) ? (pTrack.el.scrollHeight || pTrack.el.offsetHeight || 64) : 64;

    var botY = vH - botPad - botH;
    var trackY = botY - trackH - 8;

    if(pTrack){
      pTrack.el.style.left = Math.round((vW - trackW)/2)+'px';
      pTrack.el.style.top  = trackY+'px';
      pTrack.el.style.clipPath = chamferRect;
    }
    // Bloque de 3 cards CENTRADO en el viewport
    var cardsStartX = Math.round((vW - totalCards) / 2);
    if(pMision){
      pMision.el.style.left = cardsStartX + 'px';
      pMision.el.style.top  = botY + 'px';
      pMision.el.style.clipPath = chamferRect;
    }
    if(pLogro){
      pLogro.el.style.left = (cardsStartX + wMision + botGap) + 'px';
      pLogro.el.style.top  = botY + 'px';
      pLogro.el.style.clipPath = chamferRect;
    }
    if(pNivel){
      pNivel.el.style.left = (cardsStartX + wMision + botGap + wLogro + botGap) + 'px';
      pNivel.el.style.top  = botY + 'px';
      pNivel.el.style.clipPath = chamferRect;
    }

    // ══════════════════════════════════════════
    //  COLUMNAS LATERALES — entre fila top y track
    //  IMPORTANTE: las columnas NUNCA invaden zona inferior (botY o trackY)
    // ══════════════════════════════════════════
    // Espacio entre fila top y columnas: APRETADO (antes GAP*2 = 28px → ahora 8px)
    var colTopY    = topY + topMaxH + 8;
    var colBotY    = trackY - 8;
    var colVAvail  = Math.max(200, colBotY - colTopY);

    // Anchos laterales conservadores con cap más bajo (objetivo: 220-260)
    var leftSpace  = r.left;
    var rightSpace = vW - r.right;
    var leftW  = Math.min(Math.max(180, leftSpace  - GAP*2), Math.floor(leftSpace  * 0.85));
    var rightW = Math.min(Math.max(180, rightSpace - GAP*2), Math.floor(rightSpace * 0.85));
    // Cap absoluto: máximo 260px (antes 300)
    leftW  = Math.min(leftW, 260);
    rightW = Math.min(rightW, 260);
    var leftX  = Math.floor((leftSpace  - leftW)  / 2);
    var rightX = r.right + Math.floor((rightSpace - rightW) / 2);

    var leftPanels  = window._hudPanels.filter(function(hp){ return hp.el._side==='left';  });
    var rightPanels = window._hudPanels.filter(function(hp){ return hp.el._side==='right'; });

    function positionCol(panels, x, w, isLeft){
      panels.sort(function(a,b){ return a.el._order - b.el._order; });
      panels.forEach(function(hp){
        hp.el.style.width = w + 'px';
        hp.el.style.left  = x + 'px';
        hp.el.style.top   = '-9999px';
        // Limpiar transform por si quedó de iteración previa
        hp.el.style.transform = '';
      });
      // Medir alturas reales
      var heights = panels.map(function(hp){
        return hp.el.scrollHeight || hp.el.offsetHeight || 200;
      });
      var totalH = heights.reduce(function(s,h){ return s+h+GAP; },0) - GAP;

      var startY, gapBetween;
      if(totalH <= colVAvail){
        // Cabe holgado: arrancar PEGADO arriba (no centrar) para minimizar aire
        startY = colTopY;
        gapBetween = GAP;
      } else {
        // No cabe: arrancar pegado arriba y reducir gap (mínimo 6px)
        startY = colTopY;
        var extra = totalH - colVAvail;
        var gapsCount = panels.length - 1;
        if(gapsCount>0){
          var reducedGap = Math.max(6, GAP - Math.ceil(extra/gapsCount));
          gapBetween = reducedGap;
        } else {
          gapBetween = GAP;
        }
      }

      var curY = startY;
      var chamfer = isLeft ? chamferLeft : chamferRight;
      panels.forEach(function(hp, idx){
        var h = heights[idx];
        hp.el.style.top      = Math.round(curY) + 'px';
        hp.el.style.clipPath = chamfer;
        curY += h + gapBetween;
      });
    }

    positionCol(leftPanels,  leftX,  leftW,  true);
    positionCol(rightPanels, rightX, rightW, false);

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
  document.body.appendChild(_dialOverlay);

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

  function _hudExpand(panelEl){
    if(!panelEl) return;
    if(window._hudExpanded === panelEl){
      // Click sobre el ya expandido → contraer
      _hudCollapse();
      return;
    }
    // Si ya hay otro expandido, contraerlo primero (sin animación, porque vamos
    // a expandir el nuevo y la transición se ejecuta junto).
    if(window._hudExpanded){
      _hudCollapse(/*sinReposicionar=*/true);
    }
    // Asegurar que existe el wrapper de contenido expandido dentro del panel
    var inner = panelEl.querySelector(':scope > [id$="-inner"]');
    if(inner && !inner.querySelector(':scope > .hud-expanded-content')){
      var expContent = document.createElement('div');
      expContent.className = 'hud-expanded-content';
      // Marcador placeholder: se reemplaza cuando lleguen los renders de Fase 2+
      var pid = panelEl.id.replace('hud-','');
      expContent.id = 'hud-' + pid + '-expanded';
      expContent.innerHTML = ''+
        '<div style="display:flex;align-items:center;justify-content:center;'+
          'min-height:200px;color:rgba(220,224,235,0.45);font-size:12px;'+
          'letter-spacing:.10em;text-transform:uppercase;text-align:center;'+
          'flex-direction:column;gap:8px">'+
          '<i class="fas fa-circle-notch fa-spin" style="font-size:18px;opacity:.7"></i>'+
          '<span>Vista expandida — pendiente de cargar contenido</span>'+
        '</div>';
      // Marcar el contenido original como collapsed para que se oculte cuando expandido
      Array.from(inner.children).forEach(function(child){
        if(!child.classList.contains('hud-expanded-content')){
          child.classList.add('hud-collapsed-content');
        }
      });
      inner.appendChild(expContent);
    }
    // Marcar el panel como expandido
    panelEl.classList.add('hud-expanded');
    panelEl._wasSide = panelEl._side;
    panelEl._wasOrder = panelEl._order;
    window._hudExpanded = panelEl;

    // Reposicionar todo (el reposicionador detecta hud-expanded y mueve los paneles)
    if(typeof _reposicionarHUD === 'function') _reposicionarHUD();
  }

  function _hudCollapse(sinReposicionar){
    if(!window._hudExpanded) return;
    var panelEl = window._hudExpanded;
    panelEl.classList.remove('hud-expanded');
    window._hudExpanded = null;
    if(!sinReposicionar && typeof _reposicionarHUD === 'function') _reposicionarHUD();
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

    // ── Patrimonio ──
    var fijosAll = window._fijosData || [];
    var totalDisp = fijosAll.reduce(function(s,f){ return f.nombre==='P'?s:s+(f.monto||0); },0);
    var totalApD  = (window._apartadosData||[]).reduce(function(s,a){
      return a.estado&&a.estado.toLowerCase()==='usado'?s:s+(a.monto||0);
    },0);
    if(totalDisp !== 0) setMoney('_hud-saldo', totalDisp - totalApD);
    var sv = document.getElementById('saldo-val');
    if(sv && sv.textContent && sv.textContent.trim().length>2 && sv.textContent.trim()!=='—'){
      // Si saldo-val ya tiene un valor formateado, parsearlo y aplicar setMoney
      var raw = sv.textContent.trim().replace(/[^\d.\-]/g,'');
      var num = parseFloat(raw);
      if(!isNaN(num)) setMoney('_hud-saldo', num);
    }

    // Chip "+/- X% vs ayer" — compara contra saldo guardado en localStorage
    (function(){
      var chip = document.getElementById('_hud-saldo-chip');
      if(!chip) return;
      var saldoActual = totalDisp - totalApD;
      try{
        var hoy = new Date().toISOString().slice(0,10);
        var prev = JSON.parse(localStorage.getItem('hud:saldoSnap')||'null');
        // Guardar snapshot de hoy si no existe (para comparar mañana)
        if(!prev || prev.fecha !== hoy){
          if(prev && prev.fecha !== hoy){
            // Tenemos snapshot de un día anterior → calcular delta
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
          // Actualizar snapshot
          localStorage.setItem('hud:saldoSnap', JSON.stringify({fecha:hoy, saldo:saldoActual}));
        } else {
          chip.style.display = 'none';
        }
      } catch(e){ chip.style.display = 'none'; }
    })();

    var fijos = window._fijosData || [];
    var maxMonto = fijos.reduce(function(m,f){ return f.nombre!=='P'?Math.max(m,Math.abs(f.monto||0)):m; },1);
    var bbvaSet=false, beatsSet=false;
    fijos.forEach(function(fi){
      if(fi.nombre==='P') return;
      var nl = (fi.nombre||'').toLowerCase();
      if(!bbvaSet && (nl.indexOf('bbva')>=0||nl.indexOf('banco')>=0||nl.indexOf('santan')>=0)){
        set('_hud-bbva', fmt2(fi.monto));
        setW('_hud-bbva-bar', Math.abs(fi.monto||0)/maxMonto*100);
        bbvaSet=true;
      } else if(!beatsSet && (nl.indexOf('beats')>=0||nl.indexOf('nu')>=0||nl.indexOf('hey')>=0||nl.indexOf('spin')>=0)){
        set('_hud-beats', fmt2(fi.monto));
        setW('_hud-beats-bar', Math.abs(fi.monto||0)/maxMonto*100);
        beatsSet=true;
      } else if(nl.indexOf('efectivo')>=0||nl.indexOf('cash')>=0){
        set('_hud-efec', fmt2(fi.monto));
      }
    });
    var bancos = fijos.filter(function(f){ return f.nombre!=='P'; });
    if(!bbvaSet && bancos[0]){ set('_hud-bbva', fmt2(bancos[0].monto)); setW('_hud-bbva-bar', Math.abs(bancos[0].monto||0)/maxMonto*100); }
    if(!beatsSet && bancos[1]){ set('_hud-beats', fmt2(bancos[1].monto)); setW('_hud-beats-bar', Math.abs(bancos[1].monto||0)/maxMonto*100); }

    var totalAp = (window._apartadosData||[]).reduce(function(s,a){
      return a.estado&&a.estado.toLowerCase()==='usado'?s:s+(a.monto||0);
    },0);
    set('_hud-apart', fmt(d.totalApartado || totalAp));

    if(window._patrimonioData && window._patrimonioData.fondo){
      set('_hud-fondo-pct', (window._patrimonioData.fondo.avance||0)+'%');
      setW('_hud-fondo-bar', window._patrimonioData.fondo.avance||0);
    }

    // ── Financiero ──
    var finD = window._finData;
    if(finD && finD.mes){
      setMoney('_hud-fin-exc', finD.mes.excedente);
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
    var nec = d.necesidades || window._necData || {};
    var niveles = nec.niveles || [];
    var totalNec = niveles.reduce(function(s,n){ return s+Math.abs(n.total||0); },0);
    [1,2,3,4,5].forEach(function(n){
      var nv = niveles[n-1] || {total:0};
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
  if(targetSub === _subRingPrevSub){
    _dialActiveSub = -1;
    _subRingPrevSub = -1;
    _subRingProg = 0;
    _dialDraw();
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
  if(_dialVisible) cerrarDial(); else abrirDial();
}

function abrirDial(){
  _crearDialOverlay();
  _dialHovered=-1; _dialSubHov=-1; _dialActiveSub=-1; _dialCentroHov=false; _detenerPulsoCentro();
  if(!_dialBreathRAF){
    (function _breathLoop(){
      _dialBreathT++;
      _dialDraw();
      _dialBreathRAF = requestAnimationFrame(_breathLoop);
    })();
  }

  _dialOverlay.style.opacity = '0';
  _dialOverlay.style.display = 'flex';
  _dialOverlay.style.pointerEvents = 'auto';
  _dialVisible = true;
  requestAnimationFrame(function(){
    _dialOverlay.style.transition = 'opacity 320ms cubic-bezier(.16,1,.3,1)';
    _dialOverlay.style.opacity = '1';
  });
  if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
  if(typeof window._refrescarEspejos==='function') setTimeout(function(){ window._refrescarEspejos(); }, 50);
  // Render banda Sim ya construida — renderizamos AHORA y reposicionamos después
  if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid'); if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
  if(window._hudPanels && window.innerWidth>=900){
    window._hudPanels.forEach(function(hp, i){
      hp.el.style.opacity='0'; hp.el.style.visibility='hidden';
      setTimeout(function(){
        hp.el.style.visibility='visible';
        requestAnimationFrame(function(){ hp.el.style.opacity='1'; });
      }, i * 80);
    });
    // Una vez todos visibles, re-render de barras + reposicionamiento
    // para que la banda Sim recalcule altura con el contenido ya pintado
    var totalDelay = window._hudPanels.length * 80 + 60;
    setTimeout(function(){
      if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid'); if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
      if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
    }, totalDelay);
  } else {
    // Modo compacto / mobile: aun así forzar render+reposicionamiento
    setTimeout(function(){
      if(typeof renderSimsBandSimsStyle==='function') renderSimsBandSimsStyle('hud-sim-band-grid'); if(typeof renderSimsNeeds==='function' && document.getElementById('hud-sim-needs-grid')) renderSimsNeeds('hud-sim-needs-grid');
      if(typeof window._reposicionarHUD==='function') window._reposicionarHUD();
    }, 100);
  }
  var btn=document.getElementById('btn-nueva-entrada');
  if(btn) btn.classList.add('active');
}

function cerrarDial(){
  if(!_dialOverlay){ _dialVisible=false; return; }
  _dialOverlay.style.transition = 'opacity 220ms ease';
  _dialOverlay.style.opacity = '0';
  _dialOverlay.style.pointerEvents = 'none';
  _dialVisible = false; _dialActiveSub=-1; _dialCentroHov=false; _detenerPulsoCentro();
  if(_dialBreathRAF){ cancelAnimationFrame(_dialBreathRAF); _dialBreathRAF=null; _dialBreathT=0; }
  var btn=document.getElementById('btn-nueva-entrada');
  if(btn) btn.classList.remove('active');
  setTimeout(function(){
    if(_dialOverlay && !_dialVisible) _dialOverlay.style.display='none';
    if(window._hudPanels){ window._hudPanels.forEach(function(hp){
      hp.el.style.opacity='0';
      hp.el.style.visibility='hidden';
    }); }
  }, 230);
}

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

  _crearDialOverlay();
  _dialOverlay.style.pointerEvents = 'none';

  _dialCanvas.style.opacity = '0';
  _dialCanvas.style.transition = 'opacity 2000ms ease-out';

  _dialOverlay.style.display = 'flex';
  _dialOverlay.style.opacity = '1';
  _dialVisible = true;
  _dialOverlay.style.pointerEvents = 'auto';

  if(!_dialBreathRAF){
    (function _breathLoopLanding(){
      _dialBreathT++;
      _dialDraw();
      _dialBreathRAF = requestAnimationFrame(_breathLoopLanding);
    })();
  }

  requestAnimationFrame(function(){
    var rb = document.getElementById('render-block');
    if(rb) rb.parentNode.removeChild(rb);
    setTimeout(function(){
      if(typeof _reposicionarHUD==='function') _reposicionarHUD();
      _dialCanvas.style.opacity = '1';
      if(window._hudPanels && window.innerWidth >= 900){
        var shuffledPanels = window._hudPanels.slice().sort(function(){ return Math.random()-0.5; });
        shuffledPanels.forEach(function(hp, i){
          var delay = 1100 + i * 200 + Math.round(Math.random() * 150);
          setTimeout(function(){
            hp.el.style.visibility = 'visible';
            requestAnimationFrame(function(){ hp.el.style.opacity = '1'; });
          }, delay);
        });
      }
    }, 50);
  });

  _dialOverlay.addEventListener('click', function(e){
    if(e.target === _dialOverlay) cerrarDial();
  });
  window.addEventListener('resize', function(){
    if(_dialVisible && typeof _reposicionarHUD==='function') _reposicionarHUD();
  });

  var _origCerrarDial = cerrarDial;
  cerrarDial = function(){
    if(!_dialLandingUsed){
      _dialLandingUsed = true;
      _dialOverlay.style.display = 'none';
      _dialVisible = false;
      _dialActiveSub = -1; _dialCentroHov = false; _detenerPulsoCentro();
      var btn = document.getElementById('btn-nueva-entrada');
      if(btn) btn.classList.remove('active');
      _dialCanvas.style.opacity = '';
      _dialCanvas.style.transition = '';
      var anv = document.getElementById('board-anverso');
      if(anv){
        anv.style.display = '';
        anv.style.visibility = '';
        anv.style.opacity = '1';
      }
      if(window._hudPanels){ window._hudPanels.forEach(function(hp){
        hp.el.style.opacity='0';
        hp.el.style.visibility='hidden';
      }); }
      var splash = document.getElementById('splash-dial');
      if(splash && splash.parentNode) splash.parentNode.removeChild(splash);
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
