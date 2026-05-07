/* ═══════════════════════════════════════════════════════
   RAW LOGROS — Panel rediseñado estilo dial
   Cards con glow de color por categoría, header con nivel/XP,
   sidebar completados + categorías + recompensa por nivel
   v2.0 · Mismo lenguaje visual que el dial
═══════════════════════════════════════════════════════ */

/* ── Inyectar estilos del panel ── */
(function _inyectarEstilosLogros(){
  if(document.getElementById('logros-styles')) return;
  var s = document.createElement('style');
  s.id = 'logros-styles';
  s.textContent = `
/* ── PANEL LOGROS WRAPPER ── */
#board-logros {
  display:flex;flex-direction:column;overflow:hidden;
  background:rgba(4,4,14,0.97);
  background-image:
    linear-gradient(rgba(120,80,200,.028) 1px,transparent 1px),
    linear-gradient(90deg,rgba(120,80,200,.028) 1px,transparent 1px);
  background-size:48px 48px;
}

/* ── HEADER ── */
#lgr-header {
  display:flex;align-items:center;gap:20px;
  padding:14px 24px 12px;
  background:rgba(10,8,22,0.95);
  border-bottom:1px solid rgba(140,100,220,0.18);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
  flex-shrink:0;flex-wrap:wrap;
}

/* Nivel circular */
#lgr-nivel-badge {
  width:64px;height:64px;
  border-radius:50%;
  background:rgba(20,14,40,0.9);
  border:2px solid rgba(139,92,246,0.5);
  box-shadow:0 0 20px rgba(139,92,246,0.25),inset 0 0 12px rgba(139,92,246,0.08);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  flex-shrink:0;
  animation:logrosBadgePulse 3s ease-in-out infinite;
}
@keyframes logrosBadgePulse {
  0%,100%{ box-shadow:0 0 16px rgba(139,92,246,0.2); border-color:rgba(139,92,246,0.4); }
  50%    { box-shadow:0 0 28px rgba(139,92,246,0.5); border-color:rgba(167,139,250,0.8); }
}
#lgr-nivel-num  { font-size:20px; font-weight:800; color:#A78BFA; letter-spacing:-.02em; line-height:1; text-shadow:0 0 10px rgba(167,139,250,0.7); }
#lgr-nivel-lbl  { font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:#7A8499; margin-top:1px; }

/* Progreso general */
#lgr-progreso-wrap { flex:1; min-width:200px; }
#lgr-progreso-titulo { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:rgba(255,255,255,0.35); margin-bottom:6px; }
#lgr-progreso-bar-wrap {
  height:5px;
  background:#1A2238;
  border-radius:3px;
  overflow:hidden;
  position:relative;
}
#lgr-progreso-bar {
  height:100%;
  background:linear-gradient(90deg,#7C3AED,#A855F7);
  box-shadow:0 0 8px rgba(139,92,246,0.6);
  transition:width 1s cubic-bezier(.4,0,.2,1);
  border-radius:2px;
}
#lgr-progreso-txt { display:flex; justify-content:space-between; margin-top:5px; }
#lgr-progreso-frac { font-size:12px; font-weight:700; color:#fff; }
#lgr-prox-recompensa { font-size:11px; color:rgba(255,255,255,0.4); }
#lgr-prox-xp { font-size:12px; font-weight:700; color:#A855F7; }
#lgr-prox-dinero { font-size:12px; font-weight:700; color:#10B981; }

/* Filtros y ordenamiento */
#lgr-filtros {
  display:flex; align-items:center; gap:8px; flex-wrap:wrap;
  margin-left:auto;
}
.lgr-select {
  background:rgba(20,14,40,0.8);
  border:1px solid rgba(140,100,220,0.25);
  border-radius:8px;
  color:#C8D0E0;
  font-family:inherit;font-size:12px;font-weight:500;
  padding:6px 12px;height:36px;outline:none;cursor:pointer;
  letter-spacing:.02em;
  -webkit-appearance:none;appearance:none;
  transition:border-color .15s;
}
.lgr-select:hover { border-color:rgba(167,139,250,0.6); color:#fff; }
.lgr-select option { background:rgba(15,10,30,0.98); color:#fff; }

.lgr-pill-group { display:flex;gap:2px;background:rgba(20,14,40,0.8);padding:3px;border:1px solid rgba(140,100,220,0.22);border-radius:8px; }
.lgr-pill {
  padding:4px 10px;height:30px;
  font-size:11px;font-weight:600;
  text-transform:uppercase;letter-spacing:.08em;
  background:none;border:none;border-radius:6px;
  color:#7A8499;
  cursor:pointer;font-family:inherit;transition:all .12s;
}
.lgr-pill:hover { color:#fff; background:rgba(139,92,246,0.12); }
.lgr-pill.on    { background:rgba(139,92,246,0.2); color:#fff; border:1px solid rgba(167,139,250,0.4); }

.lgr-btn-volver {
  display:flex;align-items:center;gap:6px;
  padding:6px 14px;height:36px;
  background:rgba(20,14,40,0.8);border:1px solid rgba(140,100,220,0.25);border-radius:8px;
  color:#C4B5FD;font-family:inherit;
  font-size:12px;font-weight:600;
  text-transform:uppercase;letter-spacing:.08em;
  cursor:pointer;transition:all .15s;
}
.lgr-btn-volver:hover { border-color:rgba(167,139,250,0.6); color:#fff; background:rgba(139,92,246,0.15); }
.lgr-btn-done {
  display:flex;align-items:center;gap:5px;
  padding:5px 12px;height:36px;
  background:rgba(20,14,40,0.8);border:1px solid rgba(140,100,220,0.25);border-radius:8px;
  color:#C8D0E0;font-family:inherit;font-size:12px;font-weight:500;
  text-transform:uppercase;letter-spacing:.06em;
  cursor:pointer;transition:all .15s;
}
.lgr-btn-done:hover { border-color:rgba(167,139,250,0.5); color:#fff; }
.lgr-btn-done.on { border-color:rgba(167,139,250,0.5); color:#fff; background:rgba(139,92,246,0.18); }

/* ── BODY — grid + sidebar ── */
#lgr-body {
  display:grid;
  grid-template-columns:1fr 360px;
  gap:0;
  flex:1;
  overflow:hidden;
}

/* ── GRID DE CARDS ── */
#lgr-grid-wrap {
  overflow-y:auto;overflow-x:hidden;
  padding:16px 20px 24px;
  background:transparent;
}
#lgr-grid-wrap::-webkit-scrollbar { width:4px; }
#lgr-grid-wrap::-webkit-scrollbar-thumb { background:rgba(139,92,246,0.3); border-radius:2px; }

#inv-grid-full {
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
  gap:8px;
}

/* ── CARD DE LOGRO ── */
.lgr-card {
  position:relative;display:flex;flex-direction:column;align-items:stretch;
  background:rgba(14,10,28,0.75);
  border:1px solid rgba(140,100,220,0.20);
  border-radius:16px;
  backdrop-filter:blur(10px);
  -webkit-backdrop-filter:blur(10px);
  cursor:pointer;
  transition:transform .2s cubic-bezier(.16,1,.3,1),box-shadow .2s,border-color .15s,background .15s;
  overflow:hidden;user-select:none;
  backdrop-filter:blur(8px);
  clip-path:polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px);
}
/* Zona ícono — 2/3 superiores de la card, como RL */
.lgr-ico-wrap {
  width:100%;
  height:110px;
  display:flex;
  align-items:center;
  justify-content:center;
  position:relative;
  flex-shrink:0;
  background:radial-gradient(ellipse at 50% 60%, rgba(25,16,50,0.92) 0%, rgba(6,4,14,1) 100%);
}
/* Zona info — franja inferior compacta */
.lgr-info {
  width:100%;
  padding:9px 10px 10px;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:4px;
  background:rgba(10,6,22,0.94);
  border-top:1px solid rgba(140,100,220,0.15);
}
.lgr-card::before {
  content:'';
  position:absolute;
  top:0; left:0; right:0;
  height:2px;
  background:var(--lgr-color, rgba(255,255,255,0.2));
  box-shadow:0 0 8px var(--lgr-color, rgba(255,255,255,0.2));
  opacity:0.7;
  transition:opacity .2s;
}
/* Esquinas estilo dial */
.lgr-card::after {
  content:'';
  position:absolute;
  bottom:0; right:0;
  width:8px; height:8px;
  border-bottom:2px solid var(--lgr-color, rgba(255,255,255,0.2));
  border-right:2px solid var(--lgr-color, rgba(255,255,255,0.2));
  opacity:0.5;
}
.lgr-card:hover {
  transform:translateY(-3px) scale(1.02);
  background:rgba(28,16,56,0.85);
  border-color:var(--lgr-color,rgba(167,139,250,0.5));
  box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 20px rgba(139,92,246,0.12);
}
.lgr-card:hover::before { opacity:1; }
.lgr-card.done {
  background:rgba(10,18,12,0.90);
  border-color:rgba(255,255,255,0.14);
}
.lgr-card.done::before { opacity:1; box-shadow:0 0 12px rgba(0,255,136,0.5); }
.lgr-card.activo {
  border-color:rgba(251,191,36,0.3);
}

.lgr-desc {
  font-size:9px; color:rgba(255,255,255,0.3); text-align:center;
  line-height:1.4; max-width:100%;
  display:-webkit-box; -webkit-line-clamp:1; -webkit-box-orient:vertical; overflow:hidden;
  letter-spacing:.01em;
}


/* Candado */
.lgr-lock {
  position:absolute; top:6px; right:8px;
  font-size:10px; color:rgba(255,255,255,0.18);
}
.lgr-card.done .lgr-lock { display:none; }

/* Ícono */
.lgr-ico {
  width:64px; height:64px;
  display:flex; align-items:center; justify-content:center;
  transition:filter .2s, transform .2s, opacity .2s;
  opacity:.35;
  color:var(--lgr-color, rgba(255,255,255,0.5));
}
.lgr-ico svg {
  width:64px; height:64px;
  fill:var(--lgr-color, rgba(255,255,255,0.5));
  filter:none;
  transition:filter .2s, transform .2s;
  /* stroke para look outline */
  stroke:none;
}
.lgr-card.done .lgr-ico,
.lgr-card:hover .lgr-ico {
  opacity:1;
  transform:scale(1.06);
}
.lgr-card.done .lgr-ico svg,
.lgr-card:hover .lgr-ico svg {
  filter:drop-shadow(0 0 14px var(--lgr-color)) drop-shadow(0 0 4px var(--lgr-color));
}

/* Nombre */
.lgr-nombre {
  font-size:12px; font-weight:600;
  text-align:center; color:#C8D0E0;
  line-height:1.35; width:100%;
  letter-spacing:0;
  display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;
}
.lgr-card.done .lgr-nombre { color:#fff; font-weight:700; }
.lgr-card.done .lgr-nombre { color:#fff; }

/* Precio */
.lgr-precio {
  font-size:14px; font-weight:700;
  font-variant-numeric:tabular-nums;
  color:#fff;
  letter-spacing:-.01em;
}
.lgr-card.done .lgr-precio {
  color:#10B981;
  text-shadow:0 0 8px rgba(16,185,129,0.5);
}
.lgr-card.done .lgr-precio { color:var(--lgr-color, #00ff88); text-shadow:0 0 6px var(--lgr-color, rgba(0,255,136,0.4)); }

/* Badge (ACTIVO, DENTISTA, etc.) */
.lgr-badge {
  font-size:8px; font-weight:700; text-transform:uppercase; letter-spacing:.08em;
  padding:2px 7px;
  background:rgba(251,191,36,0.12);
  border:1px solid rgba(251,191,36,0.3);
  color:#fbbf24;
}

/* Progreso 0/1 */
.lgr-progress-row {
  display:flex; align-items:center; gap:6px; width:100%;
  margin-top:2px;
}
.lgr-progress-bar {
  flex:1; height:2px;
  background:rgba(255,255,255,0.06);
  overflow:hidden;
}
.lgr-progress-fill {
  height:100%;
  background:var(--lgr-color, rgba(255,255,255,0.3));
  box-shadow:0 0 4px var(--lgr-color, rgba(255,255,255,0.3));
  transition:width .6s ease;
}
.lgr-progress-txt {
  font-size:9px; font-weight:600; color:rgba(255,255,255,0.28);
  flex-shrink:0; letter-spacing:.02em;
}
.lgr-card.done .lgr-progress-txt { color:var(--lgr-color, #00ff88); }

/* Badge completado */
.lgr-done-badge {
  position:absolute;top:6px;left:8px;
  font-size:9px;font-weight:700;
  padding:2px 7px;border-radius:5px;
  background:rgba(34,197,94,0.15);border:1px solid rgba(34,197,94,0.4);
  color:#22C55E;letter-spacing:.08em;display:none;
}
.lgr-card.done .lgr-done-badge { display:block; }

/* ── SIDEBAR ── */
#lgr-sidebar {
  overflow-y:auto;
  border-left:1px solid rgba(140,100,220,0.18);
  display:flex;
  flex-direction:column;
  gap:0;
  background:rgba(10,6,22,0.95);
  backdrop-filter:blur(12px);
  -webkit-backdrop-filter:blur(12px);
}
#lgr-sidebar::-webkit-scrollbar { width:3px; }
#lgr-sidebar::-webkit-scrollbar-thumb { background:rgba(139,92,246,0.3); border-radius:2px; }

.lgr-sidebar-section {
  border-bottom:1px solid rgba(140,100,220,0.12);
  flex-shrink:0;
}
.lgr-sidebar-title {
  padding:12px 16px 10px;
  font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;
  color:rgba(167,139,250,0.6);
  display:flex;align-items:center;justify-content:space-between;gap:8px;
  border-bottom:1px solid rgba(140,100,220,0.12);
}
.lgr-sidebar-title i { color:#7A8499;font-size:12px; }

/* Completados lista */
.lgr-completado-item {
  display:flex; align-items:center; gap:10px;
  padding:11px 16px;
  border-bottom:1px solid rgba(255,255,255,0.05);
  transition:background .12s;
  cursor:default;
}
.lgr-completado-item:hover { background:rgba(139,92,246,0.06); }
.lgr-completado-nombre { flex:1; font-size:12px; font-weight:700; color:rgba(255,255,255,0.85); min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.lgr-completado-monto  { font-size:13px; font-weight:800; color:#4ADE80; text-shadow:0 0 6px rgba(74,222,128,0.35); flex-shrink:0; font-variant-numeric:tabular-nums; }
.lgr-completado-meta   { font-size:9px; color:rgba(255,255,255,0.3); }
.lgr-completado-btn {
  font-size:9px; padding:2px 8px;
  background:rgba(139,92,246,0.08); border:1px solid rgba(139,92,246,0.25);
  color:rgba(167,139,250,0.8); cursor:pointer; font-family:inherit; font-weight:600;
  border-radius:0; letter-spacing:.04em; transition:all .12s; flex-shrink:0;
}
.lgr-completado-btn:hover { background:rgba(139,92,246,0.2); color:#fff; }
/* Navegación completados */
.lgr-nav-btns { display:flex; gap:4px; margin-left:auto; }
.lgr-nav-btn {
  width:22px; height:22px;
  background:rgba(20,10,40,0.6); border:1px solid rgba(139,92,246,0.22);
  color:rgba(167,139,250,0.7); cursor:pointer; font-size:10px;
  display:flex; align-items:center; justify-content:center;
  transition:all .12s;
}
.lgr-nav-btn:hover { background:rgba(139,92,246,0.15); color:#fff; }

/* Categorías */
.lgr-cat-item {
  display:flex;align-items:center;gap:10px;
  padding:10px 16px;
  border-bottom:1px solid #1E2740;
  cursor:pointer;transition:background .15s;
}
.lgr-cat-item:hover { background:rgba(139,92,246,0.06); }
.lgr-cat-item.on    { background:rgba(139,92,246,0.12); }
.lgr-cat-ico {
  width:28px;height:28px;border-radius:6px;
  background:rgba(30,16,60,0.8);
  display:flex;align-items:center;justify-content:center;
  font-size:13px;flex-shrink:0;
}
.lgr-cat-nombre { flex:1;font-size:12px;font-weight:500;color:#C8D0E0; }
.lgr-cat-item.on .lgr-cat-nombre { color:#fff;font-weight:600; }
.lgr-cat-prog-wrap { width:52px;height:3px;background:#1A2238;flex-shrink:0;border-radius:2px;overflow:hidden; }
.lgr-cat-prog-fill { height:100%;border-radius:2px;background:var(--cat-color,#3B82F6);box-shadow:0 0 4px var(--cat-color,rgba(59,130,246,.5)); }
.lgr-cat-frac { font-size:11px;font-weight:600;color:#7A8499;flex-shrink:0;min-width:28px;text-align:right;font-variant-numeric:tabular-nums; }

/* Recompensa por nivel */
.lgr-recompensa {
  padding:14px 16px 18px;
  display:flex;flex-direction:column;gap:10px;
}
.lgr-recompensa-nivel { font-size:12px;font-weight:600;color:#7A8499; }
.lgr-recompensa-items { display:flex;gap:8px;align-items:center;flex-wrap:wrap; }
.lgr-recompensa-chip {
  display:flex;align-items:center;gap:6px;
  padding:6px 12px;
  background:rgba(139,92,246,0.12);border:1px solid rgba(139,92,246,0.3);border-radius:8px;
  font-size:13px;font-weight:700;color:#A78BFA;
}
.lgr-recompensa-chip.verde {
  background:rgba(16,185,129,0.1);border-color:rgba(16,185,129,0.3);color:#10B981;
}
.lgr-recompensa-bar-wrap { height:4px;background:#1A2238;overflow:hidden;border-radius:2px; }
.lgr-recompensa-bar { height:100%;background:linear-gradient(90deg,#7C3AED,#A855F7);box-shadow:0 0 8px rgba(139,92,246,.5);transition:width .8s ease;border-radius:2px; }

/* Tip bar */
#lgr-tip {
  position:sticky;bottom:0;
  display:flex;align-items:center;gap:10px;
  padding:8px 24px;height:50px;
  background:rgba(10,6,22,0.97);
  border-top:1px solid rgba(140,100,220,0.18);
  backdrop-filter:blur(12px);
  font-size:13px;color:#C8D0E0;
  flex-shrink:0;
}
#lgr-tip .lgr-tip-badge {
  background:rgba(139,92,246,0.15);border:1px solid rgba(139,92,246,0.35);
  color:#A78BFA;font-size:10px;font-weight:700;padding:3px 10px;
  letter-spacing:.10em;flex-shrink:0;border-radius:6px;
}
#lgr-tip-txt { flex:1; }
.lgr-tip-nav { display:flex; gap:3px; flex-shrink:0; }
.lgr-tip-nav-btn {
  width:20px; height:20px;
  background:rgba(0,0,0,0.5); border:1px solid rgba(255,255,255,0.10);
  color:rgba(255,255,255,0.4); cursor:pointer; font-size:9px;
  display:flex; align-items:center; justify-content:center;
  transition:all .12s;
}
.lgr-tip-nav-btn:hover { border-color:rgba(167,139,250,0.4); color:#C4B5FD; }

/* Responsive */
@media(max-width:899px){
  #lgr-body { grid-template-columns:1fr !important; }
  #lgr-sidebar { border-left:none; border-top:1px solid rgba(255,255,255,0.10); max-height:380px; }
  #lgr-header { padding:10px 14px 8px; gap:10px; }
  #lgr-nivel-badge { width:52px; height:52px; }
  #lgr-nivel-num { font-size:17px; }
  #inv-grid-full { grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:6px; }
  #lgr-grid-wrap { padding:10px 12px 16px; }
}
  `;
  document.head.appendChild(s);
})();

/* ── Estado global del panel ── */
var _lgr = {
  items:       [],
  orden:       'az',
  mostrarDone: true,
  filProy:     '',
  filGrupo:    '',
  filCat:      '',
  nivel:       1,
  xpActual:    0,
  xpNivel:     500,
  pagComp:     0,
  perPagComp:  6,
  tipIdx:      0,
  tips: [
    'Completa logros para ganar XP y subir de nivel. ¡Cada nivel desbloquea mejores recompensas!',
    'Los logros activos tienen un proyecto o fecha asignada. ¡Priorízalos!',
    'Filtra por categoría para enfocarte en un área a la vez.',
    'Revisa la sección de recompensas para saber qué ganas en el próximo nivel.',
  ],
};

var _CATEGORIAS_LOGROS = [
  { key:'Salud',          ico:'❤️',  color:'#f87171' },
  { key:'Educación',      ico:'📚',  color:'#60a5fa' },
  { key:'Tecnología',     ico:'💻',  color:'#22d3ee' },
  { key:'Hogar',          ico:'🏠',  color:'#a78bfa' },
  { key:'Personal',       ico:'✨',  color:'#f0abfc' },
  { key:'Entretenimiento',ico:'🎮',  color:'#fb923c' },
  { key:'Misceláneos',    ico:'📦',  color:'#94a3b8' },
];

/* ── Color por categoría ── */
/* Paleta neón determinística por nombre (design system) */
var _NEON_PAL=[
  '#FACC15','#22D3EE','#A855F7','#3B82F6','#F97316',
  '#EF4444','#22C55E','#EC4899','#34D399','#C084FC','#F59E0B'
];
var _NEON_GLOW=[
  'rgba(250,204,21,.5)','rgba(34,211,238,.5)','rgba(168,85,247,.5)',
  'rgba(59,130,246,.5)','rgba(249,115,22,.5)','rgba(239,68,68,.5)',
  'rgba(34,197,94,.5)','rgba(236,72,153,.5)','rgba(52,211,153,.5)',
  'rgba(192,132,252,.5)','rgba(245,158,11,.5)'
];
function _lgrNeonForName(name){
  var h=0,s=String(name||'');
  for(var i=0;i<s.length;i++) h=((h<<5)-h+s.charCodeAt(i))|0;
  var idx=Math.abs(h)%_NEON_PAL.length;
  return {c:_NEON_PAL[idx],glow:_NEON_GLOW[idx]};
}
function _lgrColor(cat){ return _lgrNeonForName(cat).c; }

/* ── XP/Nivel desde datos ── */
function _lgrCalcularNivel(items){
  var completados = (items||[]).filter(function(l){ return _lgrIsDone(l); });
  var xpTotal = completados.reduce(function(acc,l){ return acc+(parseInt(l.xp)||50); }, 0);
  // 500 XP por nivel, escalando
  var nivel=1, xpAcc=0;
  while(xpAcc+nivel*500<=xpTotal){ xpAcc+=nivel*500; nivel++; }
  _lgr.nivel    = nivel;
  _lgr.xpActual = xpTotal - xpAcc;
  _lgr.xpNivel  = nivel*500;
}


/* ── Sistema de íconos SVG outline con glow — estilo futurista ── */
var _LGR_SVG = {
  // Categorías base
  'Salud':       '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>',
  'Educación':   '<path d="M12 3L1 9l4 2.18V17h2v-4.82l2 1.09V17c0 1.66 2.24 3 5 3s5-1.34 5-3v-3.73l3-1.64L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 16c0 .55-1.79 1-4 1s-4-.45-4-1v-2.27l4 2.18 4-2.18V16z"/>',
  'Tecnología':  '<path d="M20 18c1.1 0 1.99-.9 1.99-2L22 6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>',
  'Hogar':       '<path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>',
  'Personal':    '<path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>',
  'Entretenimiento':'<path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5S14.67 12 15.5 12s1.5.67 1.5 1.5S16.33 15 15.5 15zm3-3c-.83 0-1.5-.67-1.5-1.5S17.67 9 18.5 9s1.5.67 1.5 1.5S19.33 12 18.5 12z"/>',
  'Accesorios':  '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z"/>',
  'Audio':       '<path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>',
  'Baño':        '<path d="M21 10H7V6.83C7.56 6.4 8 5.74 8 5c0-1.1-.9-2-2-2s-2 .9-2 2c0 .74.44 1.4 1 1.83V21h2v-3h14v3h2V12c0-1.1-.9-2-2-2zM12 17H9v-5h3v5zm4 0h-3v-5h3v5zm4 0h-3v-5h3v5z"/>',
  'Computación': '<path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6zm8 9c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>',
  'Consumible':  '<path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05h-5V1h-1.97v4.05h-4.97l.3 2.34c1.71.47 3.31 1.32 4.27 2.26 1.44 1.42 2.43 2.89 2.43 5.29v8.05zM1 21.99V21h15.03v.99c0 .55-.45 1-1.01 1H2.01c-.56 0-1.01-.45-1.01-1zm15.03-7H1v-2h15.03v2zm0-4H1v-2h15.03v2z"/>',
  'Ejercicio':   '<path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>',
  'Ropa':        '<path d="M4.5 4.5L9 3l3 3 3-3 4.5 1.5-2 5.5H16v9H8v-9H5.5l-1-5.5zM12 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>',
  'Misceláneos': '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
  // Conceptos específicos (keywords en nombre)
  'laptop':      '<path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>',
  'telefono':    '<path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>',
  'iphone':      '<path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4zM13 18h-2v-2h2v2zm0-4h-2V9h2v5z"/>',
  'ropa':        '<path d="M4.5 4.5L9 3l3 3 3-3 4.5 1.5-2 5.5H16v9H8v-9H5.5l-1-5.5z"/>',
  'zapato':      '<path d="M5 16.5c0 .83.67 1.5 1.5 1.5h11c.83 0 1.5-.67 1.5-1.5v-1c0-.83-.67-1.5-1.5-1.5h-11c-.83 0-1.5.67-1.5 1.5v1zM8.5 7c-2.49 0-4.5 2.01-4.5 4.5S6.01 16 8.5 16h8.5c1.1 0 2-.9 2-2v-5H10V8.5C10 7.67 9.33 7 8.5 7z"/>',
  'diente':      '<path d="M12 2a5 5 0 0 0-5 5c0 1.17.41 2.24 1.07 3.09L7 22h2l1-4h4l1 4h2l-1.07-11.91A5 5 0 0 0 17 7a5 5 0 0 0-5-5zm0 8a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>',
  'cobija':      '<path d="M7 16l-4-4 4-4 1.41 1.41L5.83 12l2.58 2.59L7 16zm10 0l4-4-4-4-1.41 1.41L18.17 12l-2.58 2.59L17 16zM8.76 21h2.07l4.38-18h-2.07z"/>',
  'lentes':      '<path d="M12 4c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 16c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zm3-9h-2V9h-2v2H9v2h2v2h2v-2h2v-2z"/>',
  'camara':      '<path d="M12 15.2c-1.77 0-3.2-1.43-3.2-3.2 0-1.77 1.43-3.2 3.2-3.2 1.77 0 3.2 1.43 3.2 3.2 0 1.77-1.43 3.2-3.2 3.2zM20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>',
  'mueble':      '<path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>',
  'musica':      '<path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/>',
  'reloj':       '<path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>',
  'paraguas':    '<path d="M13 21.5c0 .83-.67 1.5-1.5 1.5S10 22.33 10 21.5V12H8v9.5C8 23.43 9.57 25 11.5 25S15 23.43 15 21.5V12h-2v9.5zM12 2C6.48 2 2 6.48 2 12h20c0-5.52-4.48-10-10-10z"/>',
  'default':     '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>',
};

function _lgrGetSvgPath(nombre, cat){
  var n = (nombre||'').toLowerCase();
  // Buscar keyword específica primero
  var keywords = [
    ['iphone','iphone'],['celular','telefono'],['telefon','telefono'],
    ['laptop','laptop'],['comput','laptop'],['tablet','laptop'],
    ['camara','camara'],['camara','camara'],
    ['zapato','zapato'],['tenis','zapato'],['calzado','zapato'],
    ['ropa','ropa'],['playera','ropa'],['camisa','ropa'],['pantalon','ropa'],
    ['cobija','cobija'],['sabana','cobija'],['almohada','cobija'],['colchon','cobija'],
    ['diente','diente'],['dental','diente'],['ortodo','diente'],
    ['lentes','lentes'],['anteojos','lentes'],['gafas','lentes'],
    ['mueble','mueble'],['silla','mueble'],['mesa','mueble'],['sofa','mueble'],
    ['musica','musica'],['itunes','musica'],['spotify','musica'],
    ['reloj','reloj'],['watch','reloj'],
    ['paraguas','paraguas'],['ventilador','mueble'],
    ['mochila','accesorios'],['bolsa','accesorios'],
  ];
  for(var i=0;i<keywords.length;i++){
    if(n.indexOf(keywords[i][0])>=0) return _LGR_SVG[keywords[i][1]]||_LGR_SVG[cat]||_LGR_SVG.default;
  }
  return _LGR_SVG[cat]||_LGR_SVG.default;
}

function _lgrCatIco(cat, nombre){
  // Retorna HTML del SVG con el path correcto
  var path = _lgrGetSvgPath(nombre||'', cat);
  return '__SVG__'+path+'__/SVG__';  // marker para render
}

/* ── Inferir categoría desde el concepto y proyecto ── */
function _lgrInferirCat(concepto, proyecto){
  var c = (concepto||'').toLowerCase();
  var p = (proyecto||'').toLowerCase();
  if(/salud|médic|doctor|cita|dent|medic|farma|gym|ejercic|deport/.test(c+p)) return 'Salud';
  if(/libro|curso|clase|estudio|educaci|aprend|certif/.test(c+p)) return 'Educación';
  if(/celular|comput|laptop|tablet|audifon|teclado|mouse|camara|tech|electron/.test(c+p)) return 'Tecnología';
  if(/ropa|camisa|pantalon|zapato|playera|chamarra|tenis|vestido|traje/.test(c+p)) return 'Ropa';
  if(/hogar|mueble|cocina|sala|cama|baño|limpieza|casa/.test(c+p)) return 'Hogar';
  if(/viaje|vuelo|hotel|restaur|comida|cena|café|entretenim|cine|juego/.test(c+p)) return 'Entretenimiento';
  if(/accesorio|bolsa|mochila|maleta|reloj|lentes/.test(c+p)) return 'Accesorios';
  return 'Misceláneos';
}

function _lgrIsDone(l){ var v=String(l.completado||'').trim(); return v==='Sí'||v==='Si'||v==='sí'||v==='si'||v==='1'||l.completado===true; }

/* ── RENDER PRINCIPAL ── */
function renderLogros(data){
  _lgr.items = (data&&data.items) ? data.items : (Array.isArray(data)?data:[]);
  window._logrosData = { items:_lgr.items };
  _lgrCalcularNivel(_lgr.items);
  _lgrMontarShell();
  _lgrPintarHeader();
  _lgrPintarGrid();
  _lgrPintarSidebar();
  _lgrPintarTip();
  _lgrPoblarFiltros();
}

/* ── MONTAR ESTRUCTURA DEL PANEL ── */
function _lgrMontarShell(){
  var board = document.getElementById('board-logros');
  if(!board) return;

  // Limpiar contenido previo excepto el div original
  board.innerHTML = '';

  // Header
  board.insertAdjacentHTML('beforeend', `
    <div id="lgr-header">
      <div id="lgr-nivel-badge">
        <div id="lgr-nivel-num">${_lgr.nivel}</div>
        <div id="lgr-nivel-lbl">Nivel</div>
      </div>
      <div id="lgr-progreso-wrap">
        <div id="lgr-progreso-titulo">Progreso general</div>
        <div id="lgr-progreso-bar-wrap"><div id="lgr-progreso-bar" style="width:0%"></div></div>
        <div id="lgr-progreso-txt">
          <span id="lgr-progreso-frac">—</span>
          <span id="lgr-prox-recompensa">Próxima recompensa: <span id="lgr-prox-xp"></span> <span id="lgr-prox-dinero"></span></span>
        </div>
      </div>
      <div id="lgr-filtros">
        <select class="lgr-select" id="reverso-fil-proyecto" onchange="pintarReverso()">
          <option value="">Proyecto</option>
        </select>
        <select class="lgr-select" id="reverso-fil-grupo" onchange="pintarReverso()">
          <option value="">Contacto</option>
        </select>
        <div class="lgr-pill-group">
          <button class="lgr-pill on" id="lord-az"   onclick="setOrdenLogros('az')">A–Z</button>
          <button class="lgr-pill"    id="lord-desc" onclick="setOrdenLogros('monto-desc')">$ ↓</button>
          <button class="lgr-pill"    id="lord-asc"  onclick="setOrdenLogros('monto')">$ ↑</button>
        </div>
        <button class="lgr-btn-done on" id="reverso-tog-done" onclick="toggleReversoMostrarDone()">
          <i class="fas fa-check-circle" style="font-size:10px"></i> Completados
        </button>
        <button class="lgr-btn-volver" onclick="volverAlAnverso()">
          <i class="fas fa-chevron-left" style="font-size:10px"></i> Volver
        </button>
      </div>
    </div>
  `);

  // Body
  board.insertAdjacentHTML('beforeend', `
    <div id="lgr-body">
      <div id="lgr-grid-wrap">
        <div id="inv-grid-full"></div>
      </div>
      <div id="lgr-sidebar"></div>
    </div>
  `);

  // Tip bar
  board.insertAdjacentHTML('beforeend', `
    <div id="lgr-tip">
      <span class="lgr-tip-badge">TIP</span>
      <i class="fas fa-rotate-right" style="font-size:10px;color:rgba(0,255,136,0.5)"></i>
      <span id="lgr-tip-txt"></span>
      <div class="lgr-tip-nav">
        <button class="lgr-tip-nav-btn" onclick="_lgrTipPrev()">‹</button>
        <button class="lgr-tip-nav-btn" onclick="_lgrTipNext()">›</button>
      </div>
    </div>
  `);
}

/* ── HEADER ── */
function _lgrPintarHeader(){
  var items    = _lgr.items;
  var total    = items.length;
  var hechos   = items.filter(_lgrIsDone).length;
  var pct      = total>0 ? Math.round(hechos/total*100) : 0;
  var bar      = document.getElementById('lgr-progreso-bar');
  var frac     = document.getElementById('lgr-progreso-frac');
  var xpEl     = document.getElementById('lgr-prox-xp');
  var dinEl    = document.getElementById('lgr-prox-dinero');
  var nivEl    = document.getElementById('lgr-nivel-num');
  if(bar)  setTimeout(function(){ bar.style.width=pct+'%'; },80);
  if(frac) frac.textContent = hechos+' / '+total;
  if(xpEl) xpEl.textContent = '+500 XP';
  if(dinEl){ dinEl.textContent = '+ $250'; }
  if(nivEl) nivEl.textContent = _lgr.nivel;
}

/* ── FILTROS — poblar opciones ── */
function _lgrPoblarFiltros(){
  var items = _lgr.items;
  var proyEl   = document.getElementById('reverso-fil-proyecto');
  var grupoEl  = document.getElementById('reverso-fil-grupo');
  if(!proyEl||!grupoEl) return;
  var proyectos = [...new Set(items.map(function(l){return l.proyecto||'';}).filter(Boolean))].sort();
  var grupos    = [...new Set(items.map(function(l){return l.contacto||'';}).filter(Boolean))].sort();
  proyectos.forEach(function(p){ var o=document.createElement('option');o.value=p;o.textContent=p;proyEl.appendChild(o); });
  grupos.forEach(function(g){ var o=document.createElement('option');o.value=g;o.textContent=g;grupoEl.appendChild(o); });
}

/* ── GRID ── */
function pintarReverso(){ _lgrPintarGrid(); _lgrPintarSidebar(); }

function _lgrPintarGrid(){
  var grid = document.getElementById('inv-grid-full');
  if(!grid) return;

  var filProy  = (document.getElementById('reverso-fil-proyecto')||{}).value||'';
  var filGrupo = (document.getElementById('reverso-fil-grupo')||{}).value||'';
  var filCat   = _lgr.filCat;

  var items = _lgr.items.slice();

  // Filtros
  if(filProy)  items = items.filter(function(l){ return (l.proyecto||'')==filProy; });
  if(filGrupo) items = items.filter(function(l){ return (l.contacto||'')==filGrupo; });
  if(filCat)   items = items.filter(function(l){ return _lgrInferirCat(l.concepto||l.descripcion||'', l.proyecto||'')==filCat; });
  if(!_lgr.mostrarDone) items = items.filter(function(l){ return !_lgrIsDone(l); });

  // Orden
  items.sort(function(a,b){
    if(_lgr.orden==='az') return (a.concepto||a.descripcion||'').localeCompare(b.concepto||b.descripcion||'','es');
    var ma=parseFloat(String(a.ie||'0').replace(/[^0-9.\-]/g,''))||0;
    var mb=parseFloat(String(b.ie||'0').replace(/[^0-9.\-]/g,''))||0;
    return _lgr.orden==='monto-desc' ? mb-ma : ma-mb;
  });

  grid.innerHTML = '';
  if(!items.length){
    grid.innerHTML='<div style="grid-column:1/-1;padding:40px;text-align:center;color:rgba(0,255,136,0.3);font-size:12px;letter-spacing:.08em">SIN RESULTADOS</div>';
    return;
  }

  items.forEach(function(l){
    var done   = _lgrIsDone(l);
    // Campos reales del GAS
    var nombre = l.concepto||l.descripcion||l.id||'—';
    var cat    = _lgrInferirCat(nombre, l.proyecto||'');
    var color  = _lgrColor(cat);
    var ie     = l.ie;
    var precioFmt = (ie!==null&&ie!==undefined&&ie!=='') ?
      '$ '+parseFloat(String(ie).replace(/[^0-9.\-]/g,'')).toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:0}) : '';
    var prog   = done ? 1 : 0;
    var activo = l.proyecto;
    var desc   = (l.descripcion&&l.descripcion!==nombre) ? l.descripcion : '';
    var ico    = _lgrCatIco(cat, nombre);

    var card = document.createElement('div');
    card.className = 'lgr-card' + (done?' done':'') + (activo?' activo':'');
    var neon=_lgrNeonForName&&_lgrNeonForName(l.nombre||l.concepto||'');
card.style.setProperty('--lgr-color', neon?neon.c:color);
card.style.setProperty('--lgr-color-glow', neon?neon.glow:'rgba(120,160,255,0.3)');
    card.setAttribute('data-id', l.id||nombre||'');

    card.innerHTML =
      // ── Zona ícono — protagonista (RL style) ──
      '<div class="lgr-ico-wrap">' +
        '<div class="lgr-lock"><i class="fas fa-lock"></i></div>' +
        (done?'<div class="lgr-done-badge">✓</div>':'') +
        (ico.indexOf('__SVG__')>=0 ?
        '<div class="lgr-ico"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;fill:none">'+ico.replace('__SVG__','').replace('__/SVG__','')+'</svg></div>' :
        '<div class="lgr-ico">'+ico+'</div>') +
        // Línea de acento en borde inferior del ícono
        '<div style="position:absolute;bottom:0;left:0;right:0;height:2px;background:var(--lgr-color);box-shadow:0 0 10px var(--lgr-color);opacity:'+(done?1:.28)+'"></div>' +
      '</div>' +
      // ── Info inferior: nombre + monto + badges + progreso ──
      '<div class="lgr-info">' +
        '<div class="lgr-nombre">'+escH(nombre)+'</div>' +
        (precioFmt?'<div class="lgr-precio">'+escH(precioFmt)+'</div>':'') +
        // Badge de proyecto activo (como ACTIVO / DENTISTA en la imagen)
        (activo&&!done?'<div class="lgr-badge">'+escH(activo)+'</div>':'') +
        // Descripción breve si existe
        (desc?'<div class="lgr-desc">'+escH(desc)+'</div>':'') +
        // Fecha si completado
        (done&&l.fecha?'<div style="font-size:8px;color:rgba(255,255,255,0.3);text-align:center">'+escH(l.fecha)+'</div>':'') +
        '<div class="lgr-progress-row">' +
          '<div class="lgr-progress-bar"><div class="lgr-progress-fill" style="width:'+(prog*100)+'%;background:var(--lgr-color);box-shadow:0 0 4px var(--lgr-color)"></div></div>' +
          '<div class="lgr-progress-txt">'+(done?'1':'0')+'/1</div>' +
        '</div>' +
      '</div>';

    card.addEventListener('click', function(){ _lgrCardClick(l); });
    grid.appendChild(card);
  });
}

function _lgrCardClick(l){
  // Usar api.marcarLogro (la función real del sistema)
  var _marcar = (typeof api!=='undefined' && typeof api.marcarLogro==='function')
    ? function(fila,val){ return api.marcarLogro(fila,val); }
    : (typeof marcarLogro==='function' ? marcarLogro : null);

  if(_lgrIsDone(l)){
    if(!l.fila){ return; }
    if(!confirm('\u00bfDesmarcar "'+(l.concepto||l.id||'este logro')+'"?')) return;
    // Feedback visual inmediato
    l.completado='No';
    _lgrCalcularNivel(_lgr.items);
    _lgrPintarGrid(); _lgrPintarSidebar(); _lgrPintarHeader();
    // Persistir en GAS
    if(_marcar) _marcar(l.fila,'No');
    return;
  }

  // Pendiente → marcar completado
  if(!l.fila){ return; }
  // Feedback inmediato
  l.completado='S\u00ed';
  _lgrCalcularNivel(_lgr.items);
  _lgrPintarGrid(); _lgrPintarSidebar(); _lgrPintarHeader();
  // Persistir en GAS
  if(_marcar){
    _marcar(l.fila,'S\u00ed');
  } else if(typeof completarLogro==='function'){
    completarLogro(l.id||l.concepto||'');
  }
}

/* ── SIDEBAR ── */
function _lgrPintarSidebar(){
  var sb = document.getElementById('lgr-sidebar');
  if(!sb) return;
  sb.innerHTML='';

  // Sección completados
  var done = _lgr.items.filter(_lgrIsDone);
  var inicio= _lgr.pagComp * _lgr.perPagComp;
  var pag   = done.slice(inicio, inicio+_lgr.perPagComp);
  var totalPags = Math.ceil(done.length/_lgr.perPagComp);

  var secComp = document.createElement('div');
  secComp.className='lgr-sidebar-section';
  var titComp='<div class="lgr-sidebar-title"><i class="fas fa-trophy"></i> Completados'
    +(totalPags>1?'<div class="lgr-nav-btns"><button class="lgr-nav-btn" onclick="_lgrCompPrev()">‹</button><button class="lgr-nav-btn" onclick="_lgrCompNext()">›</button></div>':'')
    +'</div>';
  var itemsComp = pag.map(function(l){
    var nombre_c = l.concepto||l.descripcion||l.id||'—';
    var fmt = (l.ie!==null&&l.ie!==undefined&&l.ie!=='') ? '$ '+parseFloat(String(l.ie).replace(/[^0-9.\-]/g,'')).toLocaleString('es-MX',{minimumFractionDigits:0,maximumFractionDigits:0}) : '';
    var fecha = l.fecha||'';
    var cat = _lgrInferirCat(nombre_c, l.proyecto||'');
    return '<div class="lgr-completado-item">' +
      '<div style="flex:1;min-width:0">' +
        '<div class="lgr-completado-nombre">'+escH(nombre_c)+'</div>' +
        '<div class="lgr-completado-meta">'+escH(cat+(fecha?' · '+fecha:''))+'</div>' +
      '</div>' +
      (fmt?'<div class="lgr-completado-monto">'+escH(fmt)+'</div>':'') +
      '<button class="lgr-completado-btn" onclick="_lgrRevertirDesdeSidebar('+l.fila+')">Revertir</button>' +
    '</div>';
  }).join('');
  if(!pag.length) itemsComp='<div style="padding:12px 14px;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:.06em">Sin completados</div>';
  secComp.innerHTML = titComp+itemsComp;
  sb.appendChild(secComp);

  // Sección categorías
  var secCat = document.createElement('div');
  secCat.className='lgr-sidebar-section';
  secCat.innerHTML='<div class="lgr-sidebar-title"><i class="fas fa-layer-group"></i> Categorías</div>';

  _CATEGORIAS_LOGROS.forEach(function(c){
    var todos    = _lgr.items.filter(function(l){ return _lgrInferirCat(l.concepto||l.descripcion||'', l.proyecto||'')===c.key; });
    var hechos   = todos.filter(_lgrIsDone).length;
    if(!todos.length) return;
    var pctCat   = todos.length>0 ? Math.round(hechos/todos.length*100) : 0;
    var isOn     = _lgr.filCat===c.key;
    var el = document.createElement('div');
    el.className = 'lgr-cat-item'+(isOn?' on':'');
    el.style.setProperty('--cat-color', c.color);
    el.innerHTML =
      '<span class="lgr-cat-ico">'+c.ico+'</span>'+
      '<span class="lgr-cat-nombre">'+escH(c.key)+'</span>'+
      '<div class="lgr-cat-prog-wrap"><div class="lgr-cat-prog-fill" style="width:'+pctCat+'%;background:'+c.color+';box-shadow:0 0 4px '+c.color+'"></div></div>'+
      '<span class="lgr-cat-frac">'+hechos+'/'+todos.length+'</span>';
    el.addEventListener('click', function(){
      _lgr.filCat = isOn?'':c.key;
      _lgrPintarGrid(); _lgrPintarSidebar();
    });
    secCat.appendChild(el);
  });
  sb.appendChild(secCat);

  // Sección recompensa por nivel
  var proxNivel = _lgr.nivel+1;
  var pctXP = _lgr.xpNivel>0 ? Math.round(_lgr.xpActual/_lgr.xpNivel*100) : 0;
  var secRec = document.createElement('div');
  secRec.className='lgr-sidebar-section';
  secRec.innerHTML =
    '<div class="lgr-sidebar-title"><i class="fas fa-gift"></i> Recompensa por nivel</div>'+
    '<div class="lgr-recompensa">'+
      '<div class="lgr-recompensa-nivel">Nivel '+proxNivel+' · '+_lgr.xpActual+' / '+_lgr.xpNivel+' XP</div>'+
      '<div class="lgr-recompensa-items">'+
        '<div class="lgr-recompensa-chip"><i class="fas fa-bolt" style="font-size:10px"></i> +500 XP</div>'+
        '<div class="lgr-recompensa-chip verde"><i class="fas fa-dollar-sign" style="font-size:10px"></i> +$250</div>'+
        '<div style="margin-left:auto;font-size:18px">📦</div>'+
      '</div>'+
      '<div class="lgr-recompensa-bar-wrap"><div class="lgr-recompensa-bar" style="width:'+pctXP+'%"></div></div>'+
    '</div>';
  sb.appendChild(secRec);
}

/* ── TIP BAR ── */
function _lgrPintarTip(){
  var el = document.getElementById('lgr-tip-txt');
  if(el) el.textContent = _lgr.tips[_lgr.tipIdx % _lgr.tips.length];
}
function _lgrTipPrev(){ _lgr.tipIdx=(_lgr.tipIdx-1+_lgr.tips.length)%_lgr.tips.length; _lgrPintarTip(); }
function _lgrTipNext(){ _lgr.tipIdx=(_lgr.tipIdx+1)%_lgr.tips.length; _lgrPintarTip(); }

/* ── CONTROLES ── */
function setOrdenLogros(o){
  _lgr.orden=o;
  ['az','desc','asc'].forEach(function(k){
    var el=document.getElementById('lord-'+k);
    if(el) el.classList.remove('on');
  });
  var mapa={'az':'az','monto-desc':'desc','monto':'asc'};
  var el=document.getElementById('lord-'+mapa[o]);
  if(el) el.classList.add('on');
  _lgrPintarGrid();
}
function toggleReversoMostrarDone(){
  _lgr.mostrarDone=!_lgr.mostrarDone;
  var btn=document.getElementById('reverso-tog-done');
  if(btn) btn.classList.toggle('on',_lgr.mostrarDone);
  _lgrPintarGrid();
}
function resetReverso(){
  _lgr.filCat=''; _lgr.mostrarDone=true; _lgr.orden='az';
  var pEl=document.getElementById('reverso-fil-proyecto');
  var gEl=document.getElementById('reverso-fil-grupo');
  if(pEl) pEl.value=''; if(gEl) gEl.value='';
  setOrdenLogros('az');
  _lgrPintarGrid(); _lgrPintarSidebar();
}
function _lgrCompPrev(){ _lgr.pagComp=Math.max(0,_lgr.pagComp-1); _lgrPintarSidebar(); }
function _lgrCompNext(){
  var done=_lgr.items.filter(_lgrIsDone).length;
  var maxPag=Math.ceil(done/_lgr.perPagComp)-1;
  _lgr.pagComp=Math.min(maxPag,_lgr.pagComp+1); _lgrPintarSidebar();
}

/* ── NAVEGACIÓN ── */
function _lgrVolver(){
  // Usar la función nativa si existe, sino activar el anverso directamente
  if(typeof volverAlAnverso==='function'){ volverAlAnverso(); return; }
  document.querySelectorAll('.board-face').forEach(function(f){ f.classList.remove('active'); });
  var anv=document.getElementById('board-anverso');
  if(anv) anv.classList.add('active');
  if(typeof _syncMobTab==='function') _syncMobTab('entrada');
}

function irALogros(){
  // Toggle: si ya estás en logros, vuelve al anverso
  var board = document.getElementById('board-logros');
  if(board && board.classList.contains('active')){
    if(typeof volverAlAnverso==='function') volverAlAnverso();
    return;
  }
  if(typeof _syncMobTab==='function') _syncMobTab('logros');
  document.querySelectorAll('.board-face:not(.anverso)').forEach(function(f){ f.classList.remove('active'); });
  // Ocultar anverso
  var anv = document.getElementById('board-anverso');
  if(anv) anv.classList.add('slide-right');
  if(board){ board.classList.add('active'); board.scrollTop=0; }
  // Marcar btn activo
  document.querySelectorAll('.btn-flip').forEach(function(b){ b.classList.remove('active'); });
  var btn = document.getElementById('btn-logros'); if(btn) btn.classList.add('active');
  var bh  = document.getElementById('btn-home');   if(bh)  bh.classList.remove('on');
  if(_lgr.items.length===0 && window._logrosData) renderLogros(window._logrosData);
}

/* ── HELPER ── */
function escH(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function _lgrRevertirDesdeSidebar(fila){
  var l = _lgr.items.find(function(it){ return it.fila===fila; });
  if(!l) return;
  if(!confirm('\u00bfDesmarcar "'+(l.concepto||'este logro')+'"?')) return;
  l.completado='No';
  _lgrCalcularNivel(_lgr.items);
  _lgrPintarGrid(); _lgrPintarSidebar(); _lgrPintarHeader();
  if(typeof api!=='undefined' && typeof api.marcarLogro==='function'){
    api.marcarLogro(fila,'No');
  }
}
