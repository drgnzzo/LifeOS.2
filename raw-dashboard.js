/* RAW Entry — Dashboard v.5.091
   Cambios desde v5.090:
   - REVERTIDO renderSimsPanel() del DASHBOARD: la banda Sim ya no vive ahí.
     Ahora es un STUB que reenvía al renderer del overlay del dial
     (renderSimsBandSimsStyle de raw-core.js, contenedor #hud-sim-band-grid).
   - Eliminadas _SIM_NEEDS_DEF y _calcSimNeedsPanel (la lógica vive en raw-core).
   - Eliminado el listener DOMContentLoaded que pintaba la banda en el dashboard.
   - Si el index.html viejo deja #sim-needs-grid en el DOM, el stub lo vacía una vez.
   - Alias retrocompat: window.renderSimsNeeds = renderSimsPanel.
   ── (heredado de v5.090) ──
   - ELIMINADA renderSimsNeeds() original rota (buscaba #sims-needs-panel inexistente).
   - Las llamadas a renderSimsPanel() en handlers de carga siguen vivas: ahora
     refrescan la banda del overlay si está montada (no-op si no).
*/

// ══════════════════════════════════════════
//  NECESIDADES INLINE — control de período
// ══════════════════════════════════════════
var _necModoHoy = true;

// ── Fallback: NEC_NIVELES se define aquí si GAS no la inyectó ──
if(typeof NEC_NIVELES === 'undefined'){
  // Keys numéricos '1'..'5' — coinciden con lo que devuelve getNecesidades del GAS
  var NEC_NIVELES = [
    { key:'1', label:'Fisiológicas',   color:'#f87171' },
    { key:'2', label:'Seguridad',      color:'#fb923c' },
    { key:'3', label:'Afiliación',     color:'#fbbf24' },
    { key:'4', label:'Reconocimiento', color:'#a3e635' },
    { key:'5', label:'Autorrealización',color:'#34d399' },
  ];
}

// Guard para chart previo
var _radarInlineChart = null;

function actualizarNecInline(forzarMes){
  var anioEl = document.getElementById('nec-inline-anio');
  var mesEl  = document.getElementById('nec-inline-mes');
  var btnHoy = document.getElementById('nec-btn-hoy');
  if(!anioEl) return;

  var a = anioEl.value;
  var m = mesEl ? mesEl.value : '';

  if(m){ _necModoHoy = false; }

  if(btnHoy){
    btnHoy.style.background = _necModoHoy ? 'rgba(139,92,246,.3)' : 'none';
    btnHoy.style.border     = _necModoHoy ? '1px solid rgba(139,92,246,.5)' : '1px solid rgba(255,255,255,.1)';
    btnHoy.style.color      = _necModoHoy ? '#C4B5FD' : 'var(--m)';
    btnHoy.style.fontWeight = _necModoHoy ? '700' : '500';
  }

  var hoyDate  = new Date();
  var mesFinal = _necModoHoy ? String(hoyDate.getMonth()+1) : (m || String(hoyDate.getMonth()+1));

  // Mostrar loading mientras carga
  var _radarWrap = document.getElementById('nec-inline-radar-wrap');
  var _detCont   = document.getElementById('nec-inline-container');
  if(_radarWrap) _radarWrap.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,.3);font-size:11px"><i class="fas fa-circle-notch fa-spin"></i> Cargando...</div>';
  if(_detCont)   _detCont.innerHTML = '';

  api.getNecesidades(a, mesFinal, null).then(function(data){
    _necInlineData = data;
    window._necInlineData = data;
    if(data && data.ok){
      var niveles = data.niveles || [];
      if(!niveles.length || niveles.every(function(n){ return !n.total; })){
        // Datos llegaron pero todos en cero — mostrar aviso útil
        if(_radarWrap) _radarWrap.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(255,255,255,.3);font-size:11px">Sin registros con necesidad asignada este período.<br><span style="font-size:9px;opacity:.6">Los registros RAW deben tener la columna Necesidad en formato "1. Concepto"</span></div>';
        return;
      }
      // Lazy-load Chart.js si hace falta
      if(!window.Chart){
        var s=document.createElement('script');
        s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
        s.onload=function(){ _dibujarNecesidesInlineCompleto(niveles); };
        document.head.appendChild(s);
      } else {
        _dibujarNecesidesInlineCompleto(niveles);
      }
    } else {
      if(_radarWrap) _radarWrap.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(239,68,68,.6);font-size:11px">Error al cargar necesidades</div>';
    }
  }).catch(function(err){
    if(_radarWrap) _radarWrap.innerHTML = '<div style="padding:20px;text-align:center;color:rgba(239,68,68,.5);font-size:11px">Sin conexión</div>';
  });
}

function necVolverHoy(){
  _necModoHoy = true;
  var mesEl = document.getElementById('nec-inline-mes');
  if(mesEl) mesEl.value = '';
  actualizarNecInline();
}

function _initNecInlineSelectors(){
  var anioEl = document.getElementById('nec-inline-anio');
  var mesEl  = document.getElementById('nec-inline-mes');
  if(!anioEl || !mesEl) return;
  anioEl.value = new Date().getFullYear();
  mesEl.value  = '';
  _necModoHoy  = true;
}

// ── Render unificado: radar + distribución + detalle en fila ──
function _dibujarNecesidesInlineCompleto(niveles){
  var radarWrap = document.getElementById('nec-inline-radar-wrap');
  var detCont   = document.getElementById('nec-inline-container');
  if(!radarWrap) return;

  var totalSum = NEC_NIVELES.reduce(function(s,n){
    return s + Math.abs(_dataNivelInline(n.key, niveles).total || 0);
  }, 0);

  // ── SVG pirámide distribución ──
  var pisos    = NEC_NIVELES.slice().reverse();
  var svgPisos = pisos.map(function(niv, i){
    var d   = _dataNivelInline(niv.key, niveles);
    var abs = Math.abs(d.total || 0);
    var pct = totalSum > 0 ? abs / totalSum : 0;
    var w   = Math.max(14, pct * 200);
    var x   = (200 - w) / 2;
    var y   = i * 34;
    var op  = abs === 0 ? 0.15 : 0.85;
    return '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+w.toFixed(1)+'" height="30" rx="4"'+
           ' fill="'+niv.color+'" opacity="'+op+'"/>'+
           '<text x="100" y="'+(y+20).toFixed(1)+'" text-anchor="middle" font-size="9"'+
           ' fill="rgba(255,255,255,.8)" font-family="system-ui" font-weight="600">'+niv.label+'</text>';
  }).join('');

  // ── HTML detalle por nivel ──
  var maxAbs = 1;
  NEC_NIVELES.forEach(function(n){
    var v = Math.abs(_dataNivelInline(n.key, niveles).total || 0);
    if(v > maxAbs) maxAbs = v;
  });

  var detHtml = NEC_NIVELES.slice().reverse().map(function(niv){
    var d    = _dataNivelInline(niv.key, niveles);
    var abs  = Math.abs(d.total || 0);
    var pct  = totalSum > 0 ? (abs / totalSum * 100) : 0;
    var barW = maxAbs > 0 ? (abs / maxAbs * 100) : 0;
    var vacio = abs === 0;
    var tops  = (d.conceptos || []).slice(0, 3).join(', ');
    var status = vacio
      ? '<span style="font-size:9px;color:var(--warn);background:rgba(245,158,11,.1);padding:1px 7px;border-radius:10px;white-space:nowrap">⚠ descuidado</span>'
      : (pct > 40
          ? '<span style="font-size:9px;color:var(--err);background:rgba(239,68,68,.08);padding:1px 7px;border-radius:10px;white-space:nowrap">Alto</span>'
          : '<span style="font-size:9px;color:var(--ok);background:rgba(74,222,128,.08);padding:1px 7px;border-radius:10px;white-space:nowrap">✓ OK</span>');
    return '<div style="margin-bottom:11px">'+
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">'+
        '<div style="display:flex;align-items:center;gap:6px">'+
          '<div style="width:8px;height:8px;border-radius:50%;background:'+(vacio?'rgba(255,255,255,.15)':niv.color)+';flex-shrink:0"></div>'+
          '<span style="font-size:12px;font-weight:600;color:'+(vacio?'var(--m)':'#fff')+'">'+niv.label+'</span>'+
          status+
        '</div>'+
        '<span style="font-size:13px;font-weight:700;color:'+(vacio?'rgba(255,255,255,.2)':niv.color)+';font-variant-numeric:tabular-nums">'+
          (vacio ? '—' : '$ '+abs.toLocaleString('es-MX',{minimumFractionDigits:0}))+
          '<span style="font-size:10px;color:rgba(255,255,255,.3);font-weight:400"> '+Math.round(pct)+'%</span>'+
        '</span>'+
      '</div>'+
      '<div style="height:5px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;margin-bottom:3px">'+
        '<div style="height:100%;width:'+barW.toFixed(1)+'%;background:'+niv.color+';border-radius:3px;opacity:'+(vacio?.15:.9)+';transition:width .5s ease"></div>'+
      '</div>'+
      (tops ? '<div style="font-size:9px;color:rgba(255,255,255,.35);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">↳ '+tops+'</div>' : '')+
    '</div>';
  }).join('');

  // ── Layout: 3 columnas en fila ──
  radarWrap.innerHTML =
    '<div style="display:flex;flex-direction:column;gap:0;width:100%;box-sizing:border-box">'+

      // ── Fila 1: Radar + Pirámide centrados, más grandes ──
      '<div style="display:flex;align-items:flex-start;justify-content:center;gap:32px;padding:20px 16px 18px;border-bottom:1px solid rgba(255,255,255,0.05)">'+

        // Radar
        '<div style="display:flex;flex-direction:column;align-items:center">'+
          '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.10em;'+
               'color:rgba(255,255,255,.3);margin-bottom:10px">Radar</div>'+
          '<canvas id="radar-inline-canvas" width="260" height="260" style="display:block"></canvas>'+
        '</div>'+

        // Pirámide / Distribución SVG
        '<div style="display:flex;flex-direction:column;align-items:center">'+
          '<div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.10em;'+
               'color:rgba(255,255,255,.3);margin-bottom:10px">Distribución</div>'+
          '<svg width="220" height="190" viewBox="0 0 200 170" xmlns="http://www.w3.org/2000/svg" style="display:block">'+svgPisos+'</svg>'+
        '</div>'+

      '</div>'+

      // ── Fila 2: Detalle por nivel (barras) ──
      '<div style="padding:12px 16px 16px">'+
        detHtml+
      '</div>'+

    '</div>';

  // Limpiar contenedor secundario — ya no se usa
  if(detCont) detCont.innerHTML = '';

  // Dibujar radar
  setTimeout(function(){
    var canvas = document.getElementById('radar-inline-canvas');
    if(!canvas || !window.Chart) return;
    var labels  = NEC_NIVELES.map(function(n){ return n.label; });
    var valores = NEC_NIVELES.map(function(n){ return Math.abs(_dataNivelInline(n.key, niveles).total || 0); });
    var colors  = NEC_NIVELES.map(function(n){ return n.color; });
    var maxVal  = Math.max.apply(null, valores.concat([1]));
    var norm    = valores.map(function(v){ return v / maxVal * 100; });
    if(_radarInlineChart){ try{ _radarInlineChart.destroy(); }catch(e){} _radarInlineChart = null; }
    canvas.width=260; canvas.height=260; _radarInlineChart = new Chart(canvas, {
      type: 'radar',
      data: { labels: labels, datasets: [{ data: norm,
        backgroundColor: 'rgba(139,92,246,.15)', borderColor: 'rgba(139,92,246,.7)',
        borderWidth: 2, pointBackgroundColor: colors, pointBorderColor: '#111',
        pointBorderWidth: 2, pointRadius: 5, fill: true }]},
      options: { responsive: false, maintainAspectRatio: false,
        plugins: { legend: {display:false},
          tooltip: { backgroundColor:'rgba(15,23,42,.95)', borderColor:'rgba(255,255,255,.1)', borderWidth:1,
            callbacks: { label: function(ctx){ return ' $'+valores[ctx.dataIndex].toLocaleString('es-MX',{minimumFractionDigits:0}); }}}},
        scales: { r: { min:0, max:100,
          angleLines: {color:'rgba(255,255,255,.06)'}, grid: {color:'rgba(255,255,255,.06)'},
          ticks: {display:false},
          pointLabels: { font:{size:9,weight:'600',family:'system-ui'},
            color: function(ctx){ return colors[ctx.index] || '#94A3B8'; }}}}}
    });
  }, 80);
}

// Stubs compatibles con llamadas antiguas
function _dibujarRadarYPiramideInline(niveles){ _dibujarNecesidesInlineCompleto(niveles); }
function _dibujarPiramideInline(niveles){ /* incluido en _dibujarNecesidesInlineCompleto */ }


// ══════════════════════════════════════════
//  ANUALIDAD (Fijos)
// ══════════════════════════════════════════
function renderAnualidad(data, containerId){
  const body=document.getElementById(containerId||'gastos-body');if(!body)return;
  if(!data.ok||!data.grupos||!data.grupos.length){body.innerHTML='<div style="padding:16px;color:var(--m);text-align:center">Sin datos</div>';return;}
  const esMob=document.documentElement.classList.contains('mob')||window.innerWidth<900;
  if(esMob){
    const mesActualIdx=new Date().getMonth();
    const uid='an'+Date.now();
    const cards=data.grupos.map((g,gi)=>{
      const isPagado=it=>it.pagado==='Sí'||it.pagado==='Si'||it.pagado==='sí';
      const pagados=g.items.filter(isPagado).length;
      const totalHoy=g.items.reduce((s,it)=>{
        if(it.monto===null)return s;
        const claveL=(it.clave||'').toLowerCase();
        const MIDX={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11};
        const m=Object.keys(MIDX).find(k=>claveL.includes(k));
        if(m&&MIDX[m]>mesActualIdx)return s;
        return s+(it.monto||0);
      },0);
      const{txt,cls}=fmtMoneda(totalHoy||null);
      const pct=Math.round(pagados/12*100);
      const cardId=uid+'_'+gi;
      const border=pagados>0?'rgba(34,197,94,.3)':'var(--border)';
      const mesesRows=g.items.map(it=>{
        const pag=isPagado(it);const{txt:mtxt}=fmtMoneda(it.monto);
        return`<div style="display:flex;justify-content:space-between;align-items:center;padding:9px 14px;border-bottom:1px solid rgba(255,255,255,.05)"><span style="font-size:13px;color:var(--m);font-weight:600">${it.clave}</span><span style="font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;color:${pag?'var(--ok)':'var(--err)'}">${pag?'✓ ':''}${mtxt}</span></div>`;
      }).join('');
      return`<div class="kard" style="border-color:${border};cursor:pointer" onclick="togKard('${cardId}')"><div class="kard-name">${g.concepto}<span class="kard-chev" style="float:right;font-size:11px;color:var(--m)">▾</span></div><div class="kard-val ${pagados>0?'pos':cls}">${txt}</div><div class="kard-prog"><div class="kard-prog-fill" style="width:${pct}%"></div></div><div class="kard-meta">${pagados}/12 pagados</div><div id="${cardId}" style="display:none;margin:8px -14px -14px;border-top:1px solid rgba(255,255,255,.08)">${mesesRows}</div></div>`;
    }).join('');
    body.innerHTML=`<div class="cards-grid">${cards}</div>`;
  }else{
    const claves=[...new Set(data.grupos.flatMap(g=>g.items.map(it=>it.clave)))];
    const idx={};data.grupos.forEach(g=>{idx[g.concepto]={};g.items.forEach(it=>idx[g.concepto][it.clave]=it);});
    const mesActual=MESES_ES[new Date().getMonth()];
    const thead=`<tr><th>Concepto</th>${claves.map(c=>{const esA=c.toUpperCase()===mesActual.toUpperCase();return`<th class="${esA?'mes-actual':''}" style="text-align:center">${c}</th>`;}).join('')}</tr>`;
    const tbody=data.grupos.map(g=>{
      const celdas=claves.map(clave=>{
        const it=idx[g.concepto][clave];
        if(!it)return`<td style="text-align:center;color:var(--err);font-size:13px">✗</td>`;
        const{txt,cls}=fmtMoneda(it.monto);
        const pag=it.pagado==='Sí'||it.pagado==='Si'||it.pagado==='sí';
        const esA=clave.toUpperCase()===mesActual.toUpperCase();
        const tieneMonto=it.monto!==null&&it.monto!==0;
        const colorCls=tieneMonto?(pag?'pos':cls):'';
        return`<td class="${colorCls}${esA?' mes-actual':''}" style="text-align:center">${tieneMonto?`<div>${txt}</div>`:`<div style="color:var(--err);font-size:13px">✗</div>`}</td>`;
      }).join('');
      return`<tr><td>${g.concepto}</td>${celdas}</tr>`;
    }).join('');
    body.innerHTML=`<div class="tbl-wrap"><table class="tbl"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;
    requestAnimationFrame(function(){var wrap=body.querySelector('.tbl-wrap');var mesActualEl=body.querySelector('th.mes-actual');var primeraTh=body.querySelector('th');if(wrap&&mesActualEl&&primeraTh)wrap.scrollLeft=mesActualEl.offsetLeft-primeraTh.offsetWidth;});
  }
  initGraficaFijos(data, containerId ? '-'+containerId : '');
}

// ══════════════════════════════════════════
//  GASTOS POR MES
// ══════════════════════════════════════════
function onDatosMes(data){
  datosMes=data;
  // v5.208: exponer en window. El hydrate de la card expandida de
  // Variables (en raw-overlay.js) lee window.datosMes; sin esto, la
  // asignación a la variable local 'datosMes' de raw-core no se veía
  // desde el overlay y la card salía vacía.
  window.datosMes=data;
  renderGastos();
  initGraficas(data);
}
function renderGastos(containerId){
  const body=document.getElementById(containerId||'anualidad-body');
  const data=datosMes;
  if(!data.meses||!data.meses.length){body.innerHTML='<div style="padding:16px;color:var(--m);text-align:center">Sin datos</div>';return;}
  const esMob=document.documentElement.classList.contains('mob')||window.innerWidth<900;
  const mesActual=MESES_ES[new Date().getMonth()];
  if(esMob){
    const entesSet=new Set();
    data.meses.forEach(m=>(data.grupos[m]||[]).forEach(e=>entesSet.add(e.ente)));
    const entes=[...entesSet];
    const idx={};
    data.meses.forEach(mes=>{idx[mes]={};(data.grupos[mes]||[]).forEach(e=>idx[mes][e.ente]={monto:e.monto});});
    const uid2='gs_'+Date.now();
    const cards=entes.map((ente,ei)=>{
      const cardId=uid2+'_'+ei;
      const entesMesActual=['Final','P'];
      let total=0;
      if(entesMesActual.includes(ente)){total=idx[mesActual]?.[ente]?.monto||0;}
      else{data.meses.forEach(m=>{const mIdx=MESES_ES.indexOf(m);if(mIdx<=new Date().getMonth())total+=idx[m]?.[ente]?.monto||0;});}
      const{txt,cls}=fmtMoneda(total||null);
      const mesesHTML=data.meses.map(mes=>{
        const item=idx[mes]?.[ente];
        if(!item||item.monto===null)return'';
        const{txt:mtxt,cls:mcls}=fmtMoneda(item.monto);
        const esActual=mes.toUpperCase()===mesActual.toUpperCase();
        return`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 14px;border-bottom:1px solid rgba(255,255,255,.05);${esActual?'background:rgba(59,130,246,.08)':''}"><span style="font-size:13px;font-weight:${esActual?'700':'500'};color:${esActual?'var(--p)':'var(--m)'}">${mes}${esActual?' 📍':''}</span><span style="font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;color:${mcls==='pos'?'var(--ok)':mcls==='neg'?'var(--err)':'var(--m)'}">${mtxt}</span></div>`;
      }).filter(Boolean).join('');
      return`<div class="kard" style="cursor:pointer" onclick="togKard('${cardId}')"><div class="kard-name">${ente}<span class="kard-chev" style="float:right;font-size:11px;color:var(--m);font-weight:400">▾</span></div><div class="kard-val ${cls}">${txt}</div><div id="${cardId}" style="display:none;margin:8px -14px -14px;border-top:1px solid rgba(255,255,255,.08)">${mesesHTML}</div></div>`;
    }).join('');
    body.innerHTML=`<div class="cards-grid">${cards}</div>`;
  }else{
    const entesSet=new Set();
    data.meses.forEach(m=>(data.grupos[m]||[]).forEach(e=>entesSet.add(e.ente)));
    const entes=[...entesSet];
    const idx={};
    data.meses.forEach(mes=>{idx[mes]={};(data.grupos[mes]||[]).forEach(e=>idx[mes][e.ente]=e.monto);});
    const thead=`<tr><th>Ente</th>${data.meses.map(m=>{const esA=m.toUpperCase()===mesActual.toUpperCase();return`<th class="${esA?'mes-actual':''}" style="text-align:center">${m}</th>`;}).join('')}</tr>`;
    const tbody=entes.map(ente=>{
      const celdas=data.meses.map(mes=>{const{txt,cls}=fmtMoneda(idx[mes]?.[ente]??null);const esA=mes.toUpperCase()===mesActual.toUpperCase();return`<td class="${cls}${esA?' mes-actual':''}" style="text-align:center">${txt}</td>`;}).join('');
      return`<tr><td>${ente}</td>${celdas}</tr>`;
    }).join('');
    body.innerHTML=`<div class="tbl-wrap"><table class="tbl"><thead>${thead}</thead><tbody>${tbody}</tbody></table></div>`;
    requestAnimationFrame(function(){var wrap=body.querySelector('.tbl-wrap');var mesActualEl=body.querySelector('th.mes-actual');var primeraTh=body.querySelector('th');if(wrap&&mesActualEl&&primeraTh)wrap.scrollLeft=mesActualEl.offsetLeft-primeraTh.offsetWidth;});
  }
}

// ══════════════════════════════════════════
//  PANEL LISTA
// ══════════════════════════════════════════
const ICOS=['fa-folder','fa-user','fa-tag','fa-rotate','fa-calendar','fa-star'];
function oPanel(){document.getElementById('panel').classList.add('open');document.getElementById('panel-overlay').classList.add('show');document.body.style.overflow='hidden';cargarPanel();}
function cPanel(){document.getElementById('panel').classList.remove('open');document.getElementById('panel-overlay').classList.remove('show');document.body.style.overflow='';}
function cargarPanel(){const b=document.getElementById('panel-body');b.innerHTML='<div style="text-align:center;padding:24px;color:var(--m)"><i class="fas fa-circle-notch fa-spin" style="color:var(--p);font-size:18px"></i></div>';api.getListaEstructura().then(renderPanel).catch(()=>{});}
function renderPanel(data){
  const b=document.getElementById('panel-body');
  if(!data.columnas||!data.columnas.length){b.innerHTML='<div style="padding:16px;color:var(--m)">Sin columnas</div>';return;}
  b.innerHTML=data.columnas.map((col,idx)=>`<div class="panel-group"><div class="panel-group-hdr"><div class="panel-group-name"><i class="fas ${ICOS[idx]||'fa-circle-dot'}"></i>${col.header}</div><span class="panel-cnt" id="pc-${idx}">${col.count}</span></div><div class="panel-add"><input type="text" id="pi-${idx}" placeholder="Nuevo valor…" onkeydown="if(event.key==='Enter')addItem(${idx})"><button class="btn-add" onclick="addItem(${idx})"><i class="fas fa-plus"></i> Agregar</button></div><div class="panel-chips" id="pchips-${idx}">${col.valores.map(v=>`<span class="chip">${v}</span>`).join('')}</div></div>`).join('');
}
function addItem(idx){
  const inp=document.getElementById('pi-'+idx);const val=inp.value.trim();if(!val)return;
  inp.disabled=true;
  api.agregarALista(idx,val).then(r=>{
    inp.disabled=false;inp.value='';
    if(r.ok){
      const chips=document.getElementById('pchips-'+idx);const ch=document.createElement('span');ch.className='chip new';ch.textContent=val;chips.appendChild(ch);
      const cnt=document.getElementById('pc-'+idx);cnt.textContent=parseInt(cnt.textContent)+1;
      const CMAP={0:'proyectos',1:'contactos',2:'conceptos',3:'recurrencias'};const key=CMAP[idx];
      if(key&&cats[key]&&!cats[key].includes(val)){
        cats[key].push(val);
        if(idx===0)buildOpts('sw-proyecto',cats.proyectos,v=>{proxSel=v;setFieldVal('proyecto',v);marcarDone('proyecto');avanzarA('proyecto');});
        else if(idx===1)buildOpts('sw-contacto',cats.contactos,v=>{contactoSel=v;setFieldVal('contacto',v);marcarDone('contacto');avanzarA('contacto');});
        else if(idx===3)buildOpts('sw-recurrencia',cats.recurrencias,v=>{recSel=v;setFieldVal('recurrencia',v);marcarDone('recurrencia');avanzarA('recurrencia');});
      }
    }
  }).catch(()=>{inp.disabled=false;});
}

// ══════════════════════════════════════════
//  REFRESH
// ══════════════════════════════════════════
function refreshTodo(){
  const btn=document.getElementById('btn-rf');
  if(btn){btn.classList.add('spinning');btn.disabled=true;}
  progStart();setChip('load','Actualizando');
  Promise.all([api.getAll(),consultarSaldo()]).then(([d])=>{
    if(d&&d.catalogos)onCats(d.catalogos);
    if(d&&d.apartados)renderApartados(d.apartados);
    if(d&&d.fijos)renderEntes(d.fijos);
    if(d&&d.datosMes){window.datosMes=d.datosMes;onDatosMes(d.datosMes);}
    if(d&&d.gastos){window._fijosAnualidadData=d.gastos;renderAnualidad(d.gastos);}
    if(d&&d.logros){renderLogros(d.logros);window._logrosData=d.logros;}
    if(d&&d.necesidades){if(typeof renderNecesidadesInline==='function')renderNecesidadesInline(d.necesidades);}
    if(d&&d.flujoPorMes){window._flujoMensualData=d.flujoPorMes;renderFlujoMensual(d.flujoPorMes);}
    if(d&&d.financieroAvanzado){window._finData=d.financieroAvanzado;renderFinancieroAvanzado(d.financieroAvanzado);}
    if(d&&d.activityCheck){window._actData=d.activityCheck;}
    if(d&&d.nutricion)   { window._nutData=d.nutricion;        if(typeof renderNutricion==='function') renderNutricion(d.nutricion); }
    if(d&&d.entrenamiento){ window._entData=d.entrenamiento; }
    api.getPensamientos().then(r=>{window._pensamientosData=r;renderPensamientos(r);renderSimsPanel();}).catch(()=>{});
    api.getRelaciones().then(r=>{window._relacionesData=r;renderRelaciones(r);renderSimsPanel();}).catch(()=>{});
    api.getSalud().then(renderSalud).catch(()=>{});
    api.getPatrimonio().then(function(d){window._patrimonioData=d;renderPatrimonio(d);}).catch(()=>{});
    if(typeof cargarScore==='function')cargarScore();
    cargarRevision('mensual',new Date().getFullYear(),new Date().getMonth()+1,null);
    renderSimsPanel();
    if(btn){btn.classList.remove('spinning');btn.disabled=false;}progDone();showToast('Datos actualizados');
  }).catch((err)=>{
    console.error('refreshTodo falló:', err);
    if(btn){btn.classList.remove('spinning');btn.disabled=false;}
    progDone();
    showToast('Error al actualizar',false);
  });
}

// ══════════════════════════════════════════
//  CFO — Financiero
// ══════════════════════════════════════════
var _finData=null,_revData=null,_revTipo='mensual';

function onRevSelChange(){
  const anio=document.getElementById('rev-sel-anio')?.value||'2026';
  const mes=document.getElementById('rev-sel-mes')?.value||'';
  const semana=document.getElementById('rev-sel-sem')?.value||'';
  const tipo=semana?'semanal':mes?'mensual':'anual';
  cargarRevision(tipo,anio,mes||null,semana||null);
}
function cargarRevision(tipo,anio,mes,semana){
  _revTipo=tipo||'mensual';
  api.getRevision(_revTipo,anio,mes,semana).then(d=>{_revData=d;_renderCFO();}).catch(()=>{});
}
function renderRevision(data){_revData=data;_renderCFO();}
function renderFinancieroAvanzado(data){if(data&&data.ok)_finData=data;_renderCFO();}

function _renderCFO(containerId){
  const fin=_finData||{},m=fin.metricas||{},mes=fin.mes||{},rev=_revData||{},id=rev.identidad||{},ins=rev.insights||[];
  const body=document.getElementById(containerId||'fin-avanzado-body');if(!body)return;
  const fmtM=v=>'$ '+Math.abs(v||0).toLocaleString('es-MX',{minimumFractionDigits:0});
  const fmtM2=v=>'$ '+Math.abs(v||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
  const runway=m.runwayDias,pctAhorro=m.porcentajeAhorro||0,gastoDia=m.gastoPorDiaPromedio||0,saldo=m.saldoActual||0;
  const ingresosMes=mes.ingresos||0,egresosMes=mes.egresos||0,excedente=mes.excedente||0,proy=mes.proyeccion||{};
  const runwayColor=runway===null?'var(--m)':runway<7?'#EF4444':runway<30?'#F59E0B':'#4ADE80';
  const hoy=new Date(),diasMes=new Date(hoy.getFullYear(),hoy.getMonth()+1,0).getDate(),diaActual=hoy.getDate();
  const pctMes=Math.round(diaActual/diasMes*100);
  const pctGasto=ingresosMes>0?Math.round(Math.abs(egresosMes)/ingresosMes*100):0;
  const velColor=pctGasto>pctMes+20?'#EF4444':pctGasto>pctMes+10?'#F59E0B':'#4ADE80';
  const scoreInv=id.scoreInversionista||0,scoreConsum=id.scoreConsumidor||0;
  const tieneRevision=rev.ok&&scoreInv>0;
  const insightsFiltrados=ins.filter(i=>!i.msg.includes('Buen ritmo de ahorro'));

  body.innerHTML=`
    <div style="padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.06)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--m)">SALDO</div>
        <input type="date" id="saldo-fecha" onchange="consultarSaldo()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:20px;color:var(--t);font-family:inherit;font-size:10px;padding:2px 6px;outline:none;cursor:pointer;-webkit-appearance:none">
        <button onclick="consultarSaldo()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:20px;color:var(--m);cursor:pointer;font-size:10px;padding:2px 8px;font-family:inherit;line-height:1.6"><i class="fas fa-arrows-rotate"></i></button>
        <button onclick="irASheet()" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:20px;color:var(--m);cursor:pointer;font-size:10px;padding:2px 8px;font-family:inherit;line-height:1.6"><i class="fas fa-table-cells"></i></button>
      </div>
      <div style="display:flex;align-items:center;gap:0;width:100%">
        <div style="flex:0 0 auto"><div id="saldo-val" style="font-size:34px;font-weight:800;letter-spacing:-.04em;color:${saldo>=0?'#4ADE80':'#EF4444'};line-height:1;white-space:nowrap">${fmtM2(saldo)}</div></div>
        <div style="width:1px;height:32px;background:rgba(255,255,255,.1);margin:0 18px;flex-shrink:0"></div>
        <div style="flex:1;min-width:0"><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--m);margin-bottom:3px">Gasto/día prom.</div><div style="font-size:18px;font-weight:700;color:rgba(255,255,255,.75);letter-spacing:-.02em">${fmtM(gastoDia)}</div></div>
        <div style="width:1px;height:32px;background:rgba(255,255,255,.1);margin:0 18px;flex-shrink:0"></div>
        <div style="flex:1;min-width:0"><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--m);margin-bottom:3px">Runway</div><div style="font-size:18px;font-weight:700;color:${runwayColor};letter-spacing:-.02em">${runway!==null?runway+' días':'—'}</div></div>
        <div style="width:1px;height:32px;background:rgba(255,255,255,.1);margin:0 18px;flex-shrink:0"></div>
        <div style="flex:1;min-width:0"><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--m);margin-bottom:3px">Tasa ahorro</div><div style="font-size:18px;font-weight:700;letter-spacing:-.02em;color:${pctAhorro<0?'#EF4444':pctAhorro<10?'#F59E0B':pctAhorro>=20?'#4ADE80':'#F59E0B'}">${pctAhorro}%</div><div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;overflow:hidden;margin-top:4px"><div style="height:100%;width:${Math.min(100,Math.max(0,pctAhorro))}%;border-radius:2px;background:${pctAhorro<0?'#EF4444':pctAhorro<10?'#F59E0B':'#4ADE80'}"></div></div></div>
      </div>
    </div>
    <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,.06)">
      <div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--m);margin-bottom:10px">ESTE MES · DÍA ${diaActual} DE ${diasMes}</div>
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--m);margin-bottom:3px"><span>Mes transcurrido</span><span style="color:rgba(255,255,255,.5)">${pctMes}%</span></div>
        <div style="height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;margin-bottom:5px"><div style="height:100%;width:${pctMes}%;background:rgba(255,255,255,.2);border-radius:3px"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px"><span style="color:var(--m)">Gasto ejecutado</span><span style="color:${velColor};font-weight:600">${pctGasto}% de ingresos</span></div>
        <div style="height:5px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;margin-bottom:5px"><div style="height:100%;width:${Math.min(100,pctGasto)}%;background:${velColor};border-radius:3px;transition:width .4s"></div></div>
        <div style="font-size:10px;color:${velColor};font-weight:500">${pctGasto>pctMes+20?'⚠ Gastas más rápido de lo que avanza el mes':pctGasto>pctMes+10?'◆ Ritmo de gasto algo elevado':pctGasto>0?'✓ Ritmo proporcional al mes':'—'}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px">
        <div style="background:rgba(74,222,128,.07);border:1px solid rgba(74,222,128,.15);border-radius:8px;padding:8px 10px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(74,222,128,.7);margin-bottom:3px">Ingresos</div><div style="font-size:14px;font-weight:700;color:#4ADE80;font-variant-numeric:tabular-nums">${fmtM(ingresosMes)}</div></div>
        <div style="background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.15);border-radius:8px;padding:8px 10px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(239,68,68,.7);margin-bottom:3px">Egresos</div><div style="font-size:14px;font-weight:700;color:#EF4444;font-variant-numeric:tabular-nums">${fmtM(egresosMes)}</div></div>
        <div style="background:${excedente>=0?'rgba(74,222,128,.07)':'rgba(239,68,68,.07)'};border:1px solid ${excedente>=0?'rgba(74,222,128,.15)':'rgba(239,68,68,.15)'};border-radius:8px;padding:8px 10px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:${excedente>=0?'rgba(74,222,128,.7)':'rgba(239,68,68,.7)'};margin-bottom:3px">Excedente</div><div style="font-size:14px;font-weight:700;color:${excedente>=0?'#4ADE80':'#EF4444'};font-variant-numeric:tabular-nums">${excedente>=0?'+':''}${fmtM(excedente)}</div></div>
      </div>
    </div>
    ${proy.diasRestantes>0?`<div style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.06)"><div style="display:flex;align-items:center;justify-content:space-between"><div><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.07em;color:var(--m);margin-bottom:3px">Proyección fin de mes · ${proy.diasRestantes} días restantes</div><div style="font-size:11px;color:var(--m)">Al ritmo actual de ${fmtM(gastoDia)}/día</div></div><div style="text-align:right"><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--m);margin-bottom:3px">Excedente proyectado</div><div style="font-size:22px;font-weight:800;letter-spacing:-.03em;color:${(proy.excedente||0)>=0?'#4ADE80':'#EF4444'};font-variant-numeric:tabular-nums">${(proy.excedente||0)>=0?'+':''}${fmtM(proy.excedente)}</div></div></div></div>`:''}
    ${tieneRevision?`<div style="padding:10px 16px;border-bottom:1px solid rgba(255,255,255,.06)"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--m)">IDENTIDAD ${rev.periodo?'· '+rev.periodo.inicio+' – '+rev.periodo.fin:''}</div><div style="font-size:9px;color:#C4B5FD;font-weight:600;text-transform:uppercase;letter-spacing:.06em">${(rev.tipo||'').toUpperCase()}</div></div><div><div style="height:8px;border-radius:4px;overflow:hidden;display:flex"><div style="height:100%;width:${scoreInv}%;background:linear-gradient(90deg,#22C55E,#4ADE80);transition:width .6s ease"></div><div style="height:100%;flex:1;background:linear-gradient(90deg,#EF4444,#DC2626)"></div></div><div style="display:flex;justify-content:space-between;margin-top:5px"><div style="display:flex;align-items:center;gap:5px"><div style="width:8px;height:8px;border-radius:50%;background:#4ADE80"></div><span style="font-size:11px;font-weight:700;color:#4ADE80">${scoreInv}% Inversionista</span></div><div style="display:flex;align-items:center;gap:5px"><span style="font-size:11px;font-weight:700;color:#EF4444">${scoreConsum}% Consumidor</span><div style="width:8px;height:8px;border-radius:50%;background:#EF4444"></div></div></div></div></div>`:`<div id="revision-body" style="padding:10px 16px;color:var(--m);font-size:11px;text-align:center;border-bottom:1px solid rgba(255,255,255,.06)">Selecciona período para ver análisis</div>`}
    ${insightsFiltrados.length?`<div style="padding:10px 16px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--m);margin-bottom:8px">💡 INSIGHTS</div><div style="display:flex;flex-direction:column;gap:5px">${insightsFiltrados.map(i=>`<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 10px;border-radius:6px;background:${i.tipo==='alerta'?'rgba(239,68,68,.06)':i.tipo==='positivo'?'rgba(74,222,128,.06)':'rgba(255,255,255,.03)'};border:1px solid ${i.tipo==='alerta'?'rgba(239,68,68,.12)':i.tipo==='positivo'?'rgba(74,222,128,.12)':'rgba(255,255,255,.06)'}"><div style="width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:5px;background:${i.tipo==='alerta'?'#EF4444':i.tipo==='positivo'?'#4ADE80':i.tipo==='identidad'?'#C4B5FD':'var(--m)'}"></div><span style="font-size:12px;line-height:1.5;color:${i.tipo==='alerta'?'#FCA5A5':i.tipo==='positivo'?'#86EFAC':i.tipo==='identidad'?'#C4B5FD':'var(--m)'}">${i.msg}</span></div>`).join('')}</div></div>`:''}`;

  setTimeout(function(){
    const sf=document.getElementById('saldo-fecha');
    if(sf&&!sf.value){const h=new Date();sf.value=h.getFullYear()+'-'+String(h.getMonth()+1).padStart(2,'0')+'-'+String(h.getDate()).padStart(2,'0');}
    if(typeof consultarSaldo==='function')consultarSaldo();
  },50);
}

// ══════════════════════════════════════════
//  RELACIONES · SALUD · APARTADOS · PENSAMIENTOS
// ══════════════════════════════════════════
let _relacionesData=[];
function renderRelaciones(data){
  _relacionesData=(data&&data.items)?data.items:[];
  const body=document.getElementById('relaciones-body');if(!body)return;
  if(!_relacionesData.length){body.innerHTML='<div style="padding:24px;text-align:center;color:var(--m)">Sin relaciones — agrega personas con el tab 👥</div>';return;}
  const sorted=[..._relacionesData].sort((a,b)=>{if(!a.ultimaVez&&!b.ultimaVez)return 0;if(!a.ultimaVez)return 1;if(!b.ultimaVez)return-1;return new Date(b.ultimaVez)-new Date(a.ultimaVez);});
  const hoy=new Date();hoy.setHours(0,0,0,0);
  body.innerHTML=sorted.map(p=>{
    const inicial=(p.nombre||'?')[0].toUpperCase();
    const eClass=p.energia>0?'positivo':p.energia<0?'negativo':'';
    const eColor=p.energia>0?'pos':p.energia<0?'neg':'neu';
    const eLbl=p.energia>0?'+ energía':p.energia<0?'− energía':'neutral';
    let diasStr='';
    if(p.ultimaVez){const diff=Math.floor((hoy-new Date(p.ultimaVez))/86400000);diasStr=diff===0?'Hoy':diff===1?'Ayer':diff+' días';}
    return`<div class="rel-item"><div class="rel-avatar ${eClass}">${inicial}</div><div class="rel-info"><div class="rel-nombre">${p.nombre}${p.sos?' <span style="font-size:10px;color:var(--err)">🚨</span>':''}</div><div class="rel-meta">${p.tipo||''}${diasStr?' · '+diasStr:''}</div></div><div class="rel-energia ${eColor}">${eLbl}</div></div>`;
  }).join('');
}

let _saludData=[];
function renderSalud(data){
  _saludData=(data&&data.items)?data.items:[];
  const body=document.getElementById('salud-body');if(!body)return;
  const proximas=(data&&data.proximas)?data.proximas:[];
  const proxBox=document.getElementById('salud-proximas');
  if(proxBox&&proximas.length){proxBox.innerHTML=proximas.slice(0,3).map(c=>`<div class="proxima-cita"><div style="font-size:11px;font-weight:600;color:var(--warn)">📅 Próxima cita</div><div style="font-size:13px;color:#fff;margin-top:3px">${c.descripcion}</div><div style="font-size:11px;color:var(--m);margin-top:2px">${c.doctor?c.doctor+' · ':''}${c.proxima}</div></div>`).join('');}
  else if(proxBox)proxBox.innerHTML='';
  if(!_saludData.length){body.innerHTML='<div style="padding:24px;text-align:center;color:var(--m)">Sin registros — agrega con el tab 🏥</div>';return;}
  body.innerHTML=_saludData.slice(0,20).map(item=>{
    const bc=['Cita','Síntoma','Medicamento','Resultado','Vacuna'].includes(item.tipo)?item.tipo:'salud-badge-default';
    return`<div class="salud-item"><div><span class="salud-tipo-badge ${bc}">${item.tipo||'—'}</span></div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:600;color:#fff">${item.descripcion}</div><div style="font-size:11px;color:var(--m)">${item.doctor?item.doctor+' · ':''}${item.fecha}</div>${item.notas?`<div style="font-size:11px;color:var(--m);margin-top:2px">${item.notas}</div>`:''}</div><div style="font-size:11px;font-weight:500;color:${item.estado==='Completado'?'var(--ok)':item.estado==='Cancelado'?'var(--err)':'var(--m)'}">${item.estado||''}</div></div>`;
  }).join('');
}

function renderApartados(data){
  window._apartadosData=(data&&data.items)?data.items:[];
  const body=document.getElementById('apartados-list')||document.getElementById('apartados-body');if(!body)return;
  const totalEl=document.getElementById('apartados-total');
  if(totalEl){const{txt,cls}=fmtMoneda(data&&data.totalApartado?data.totalApartado:0);totalEl.textContent=txt;totalEl.className='sec-hdr-val '+cls;}
  if(!(window._apartadosData||[]).length){body.innerHTML='<div style="padding:16px;text-align:center;color:var(--m)">Sin apartados activos</div>';return;}
  const hoy=new Date();hoy.setHours(0,0,0,0);
  body.innerHTML=(window._apartadosData||[]).map(ap=>{
    const{txt:mTxt}=fmtMoneda(ap.monto);const usado=ap.estado&&ap.estado.toLowerCase()==='usado';
    let metaStr='';if(ap.meta){const diff=Math.floor((new Date(ap.meta)-hoy)/86400000);metaStr=diff<0?'Vencido':diff===0?'Hoy':'en '+diff+' días';}
    return`<div class="apartado-item ${usado?'usado':''}"><div class="apartado-icon">💰</div><div class="apartado-info"><div class="apartado-nombre">${ap.nombre}</div><div class="apartado-meta">${ap.banco||''}${ap.banco&&ap.categoria?' · ':''}${ap.categoria||''}${metaStr?' · '+metaStr:''}</div></div><div><div class="apartado-monto">${mTxt}</div>${!usado?`<button onclick="_marcarApartadoUsado(${ap.fila})" style="font-size:10px;padding:3px 10px;border-radius:var(--rad-pill);border:1px solid rgba(74,222,128,.25);background:rgba(74,222,128,.08);color:#4ADE80;cursor:pointer;font-family:inherit;margin-top:5px;display:block" onmouseover="this.style.background='rgba(74,222,128,.2)'" onmouseout="this.style.background='rgba(74,222,128,.08)'">Usar ✓</button>`:'<div style="font-size:10px;color:var(--m);margin-top:4px">Usado</div>'}</div></div>`;
  }).join('');
}
function _marcarApartadoUsado(fila){if(!confirm('¿Marcar este apartado como Usado?'))return;api.actualizarApartado(fila,'Usado').then(r=>{if(r.ok){showToast('✓ Apartado marcado como Usado');api.getApartados().then(renderApartados);}else showToast(r.mensaje||'Error al actualizar',false);}).catch(()=>showToast('Error de conexión',false));}

let _pensamientosData=[];
function renderPensamientos(data){
  _pensamientosData=(data&&data.items)?data.items:[];
  const body=document.getElementById('pensamientos-body');if(!body)return;
  if(!_pensamientosData.length){body.innerHTML='<div style="padding:24px;text-align:center;color:var(--m)">Sin registros — usa el tab 💭 para agregar</div>';return;}
  const CAT_COLORS={'Emoción':'#EC4899','Idea':'#3B82F6','Reflexión':'#8B5CF6','Decisión':'#F59E0B','Sueño':'#06B6D4'};
  body.innerHTML=_pensamientosData.slice(0,30).map(p=>{
    const color=CAT_COLORS[p.categoria]||'var(--m)';
    const energiaIcons=p.energia?'⚡'.repeat(Math.min(p.energia,5)):'';
    return`<div style="padding:12px var(--pad);border-bottom:1px solid rgba(255,255,255,.04)"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><div style="display:flex;align-items:center;gap:8px">${p.categoria?`<span style="font-size:10px;padding:2px 8px;border-radius:var(--rad-pill);background:${color}22;color:${color};font-weight:600;border:1px solid ${color}44">${p.categoria}</span>`:''} ${p.etiquetas?`<span style="font-size:10px;color:var(--m)">${p.etiquetas}</span>`:''}</div><div style="display:flex;align-items:center;gap:8px">${energiaIcons?`<span style="font-size:10px">${energiaIcons}</span>`:''}<span style="font-size:10px;color:var(--m)">${p.fecha}</span></div></div><div style="font-size:13px;color:var(--t);line-height:1.5">${p.texto}</div></div>`;
  }).join('');
}

// ══════════════════════════════════════════
//  GRÁFICAS
// ══════════════════════════════════════════
let grafChart=null,grafData=null;
const GRAF_COLORS={'Final':{line:'#FFFFFF',width:3},'P':{line:'#3B82F6',width:1.5},'M':{line:'#06B6D4',width:1.5},'BW':{line:'#8B5CF6',width:1.5},'Foodies':{line:'#F59E0B',width:1.5},'Blue':{line:'#4ADE80',width:1.5},'Espiritu':{line:'#EF4444',width:1.5},'Espíritu':{line:'#EF4444',width:1.5},'Mercader':{line:'#EC4899',width:1.5},'Aseo':{line:'#FB923C',width:1.5},'Suscripción':{line:'#A78BFA',width:1.5},'Inicio':{line:'#34D399',width:1.5},'∴':{line:'#67E8F9',width:1.5}};
const PALETA_ROTATIVA=['#3B82F6','#06B6D4','#8B5CF6','#F59E0B','#4ADE80','#EF4444','#EC4899','#FB923C','#A78BFA','#34D399','#67E8F9','#FBBF24'];
let _paletaIdx=0;const _colorCache={};
function getEnteColor(ente){if(GRAF_COLORS[ente])return GRAF_COLORS[ente];if(!_colorCache[ente]){_colorCache[ente]={line:PALETA_ROTATIVA[_paletaIdx%PALETA_ROTATIVA.length],width:1.5};_paletaIdx++;}return _colorCache[ente];}
function initGraficas(data, suffix){
  grafData=data;
  if(!window.Chart){const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';s.onload=()=>{setTimeout(function(){mostrarGraficaAnual(suffix);},100);};document.head.appendChild(s);}
  else setTimeout(function(){mostrarGraficaAnual(suffix);},50);
}
function mostrarGraficaAnual(suffix){
  const data=grafData;if(!data||!data.meses||!window.Chart)return;
  const entesSet=new Set();data.meses.forEach(mes=>{(data.grupos[mes]||[]).forEach(e=>entesSet.add(e.ente));});
  const entes=[...entesSet];const idx={};data.meses.forEach(mes=>{idx[mes]={};(data.grupos[mes]||[]).forEach(e=>idx[mes][e.ente]=e.monto);});
  const entesGraf=entes.filter(e=>e!=='BW'&&e!=='Final'&&e!=='Inicio');
  const dsets=entesGraf.map(ente=>{const cfg=getEnteColor(ente);return{label:ente,data:data.meses.map(mes=>{const v=idx[mes]?.[ente];if(v===null||v===undefined)return null;return Math.abs(v);}),borderColor:cfg.line,borderWidth:1.5,pointRadius:3,pointHoverRadius:6,fill:false,tension:0.3,spanGaps:true,order:1};});
  renderChart(data.meses,dsets,'Vista Anual',suffix);
}
function renderChart(labels,datasets,titulo,suffix){
  var sx = suffix||'';
  const loading=document.getElementById('graf-loading'+sx);const canvas=document.getElementById('graf-canvas'+sx);if(!canvas)return;
  if(loading)loading.style.display='none';canvas.style.display='block';
  if(!window._grafCharts) window._grafCharts={};
  if(window._grafCharts[sx]){try{window._grafCharts[sx].destroy();}catch(e){}window._grafCharts[sx]=null;}
  window._grafCharts[sx]=new Chart(canvas,{type:'line',data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(15,23,42,.95)',borderColor:'rgba(59,130,246,.3)',borderWidth:1,titleColor:'#fff',bodyColor:'#94A3B8',padding:10,callbacks:{label:ctx=>{const v=ctx.raw;if(v===null||v===undefined)return null;const fmt=(v<0?'− ':'')+'$ '+Math.abs(v).toLocaleString('es-MX',{minimumFractionDigits:2});return' '+ctx.dataset.label+': '+fmt;}}}},scales:{x:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'#64748B',font:{size:11}}},y:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'#64748B',font:{size:11},callback:v=>'$'+Math.abs(v/1000).toFixed(0)+'k'}}}}});
  const ley=document.getElementById('graf-leyenda'+sx);if(ley)ley.innerHTML=datasets.map(d=>`<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:${d.borderColor};font-weight:${d.label==='Final'?'700':'400'}"><div style="width:16px;height:2px;background:${d.borderColor};border-radius:1px"></div>${d.label}</div>`).join('');
}
let grafFijosChart={};
const FIJOS_COLORS=['#3B82F6','#06B6D4','#8B5CF6','#F59E0B','#4ADE80','#EF4444','#EC4899','#FB923C','#A78BFA','#34D399'];
function initGraficaFijos(data, suffix){if(!data||!data.ok||!data.grupos||!data.grupos.length)return;if(!window.Chart){const wait=setInterval(()=>{if(window.Chart){clearInterval(wait);renderGraficaFijos(data,suffix);}},100);return;}renderGraficaFijos(data,suffix);}
function renderGraficaFijos(data,suffix){
  var sx = suffix||'';
  const loading=document.getElementById('graf-fijos-loading'+sx);const canvas=document.getElementById('graf-fijos-canvas'+sx);const leyenda=document.getElementById('graf-fijos-leyenda'+sx);if(!canvas)return;
  const claves=[...new Set(data.grupos.flatMap(g=>g.items.map(it=>it.clave)))];
  const datasets=data.grupos.map((g,i)=>{const color=FIJOS_COLORS[i%FIJOS_COLORS.length];const puntos=claves.map(clave=>{const it=g.items.find(it=>it.clave===clave);return it&&it.monto!==null?Math.abs(it.monto):null;});return{label:g.concepto,data:puntos,borderColor:color,borderWidth:1.5,pointRadius:3,pointHoverRadius:6,fill:false,tension:0.3,spanGaps:true};});
  if(loading)loading.style.display='none';canvas.style.display='block';
  if(grafFijosChart[sx]){try{grafFijosChart[sx].destroy();}catch(e){}grafFijosChart[sx]=null;}
  grafFijosChart[sx]=new Chart(canvas,{type:'line',data:{labels:claves,datasets},options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(15,23,42,.95)',borderColor:'rgba(6,182,212,.3)',borderWidth:1,titleColor:'#fff',bodyColor:'#94A3B8',padding:10,callbacks:{label:ctx=>{const v=ctx.raw;if(v===null||v===undefined)return null;return' '+ctx.dataset.label+': $ '+Math.abs(v).toLocaleString('es-MX',{minimumFractionDigits:2});}}}},scales:{x:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'#64748B',font:{size:11}}},y:{grid:{color:'rgba(255,255,255,.05)'},ticks:{color:'#64748B',font:{size:11},callback:v=>'$'+Math.abs(v/1000).toFixed(1)+'k'}}}}});
  if(leyenda)leyenda.innerHTML=datasets.map(d=>`<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:${d.borderColor}"><div style="width:16px;height:2px;background:${d.borderColor};border-radius:1px"></div>${d.label}</div>`).join('');
}
function syncFijosHeight(){}
window.addEventListener('DOMContentLoaded',()=>{setTimeout(syncFijosHeight,300);});
window.addEventListener('resize',syncFijosHeight);

// ══════════════════════════════════════════
//  FLUJO MENSUAL
// ══════════════════════════════════════════
function renderFlujoMensual(data, containerId){
  const body=document.getElementById(containerId||'flujo-mensual-body')||document.getElementById('flujo-body');if(!body)return;
  if(!data||!data.meses||!data.meses.length){body.innerHTML='<div style="padding:16px;color:var(--m);text-align:center">Sin datos</div>';return;}
  const rows=data.meses.map(mes=>{
    const g=data.grupos[mes]||{ingresos:0,egresos:0,excedente:null};
    const ingresos=g.ingresos||0,egresos=g.egresos||0,excedente=g.excedente!==undefined?g.excedente:(ingresos+egresos);
    const fmtMXN=v=>'$ '+Math.abs(v).toLocaleString('es-MX',{minimumFractionDigits:2});
    const ingCell=ingresos===0?`<td class="r" style="color:var(--m)">$ 0</td>`:`<td class="r" style="color:var(--ok);font-weight:600">${fmtMXN(ingresos)}</td>`;
    const egrCell=egresos===0?`<td class="r" style="color:var(--m)">$ 0</td>`:`<td class="r" style="color:var(--err);font-weight:600">− ${fmtMXN(Math.abs(egresos))}</td>`;
    const excCell=excedente===0?`<td class="r" style="color:var(--m)">$ 0</td>`:`<td class="r" style="color:${excedente>0?'var(--ok)':'var(--err)'};font-weight:700">${excedente<0?'− ':''}${fmtMXN(excedente)}</td>`;
    return`<tr><td style="font-weight:500;color:var(--t)">${mes}</td>${ingCell}${egrCell}${excCell}</tr>`;
  }).join('');
  body.innerHTML=`<style>#flujo-tbl{width:100%;border-collapse:collapse;font-size:12px}#flujo-tbl th,#flujo-tbl td{padding:7px 10px;border-bottom:1px solid rgba(255,255,255,.05)}#flujo-tbl th{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--m);padding-bottom:6px}#flujo-tbl .r{text-align:right}</style><table id="flujo-tbl"><thead><tr><th>Mes</th><th class="r" style="color:var(--ok)">Ingresos</th><th class="r" style="color:var(--err)">Egresos</th><th class="r">Excedente</th></tr></thead><tbody>${rows}</tbody></table>`;
}

// ══════════════════════════════════════════
//  SCORE DE VIDA
// ══════════════════════════════════════════
let _scoreData=null;
function cargarScore(){
  const body=document.getElementById('score-body');if(!body)return;
  body.innerHTML='<div style="text-align:center;padding:40px;color:var(--m)"><i class="fas fa-circle-notch fa-spin" style="font-size:20px;color:#8B5CF6"></i></div>';
  api.getScoreVida().then(function(d){_scoreData=d;renderScore(d);}).catch(function(e){var b=document.getElementById('score-body');if(b)b.innerHTML='<div style="color:#EF4444;padding:16px;font-size:12px">Error: '+String(e)+'</div>';});
}
function renderScore(data){
  var body=document.getElementById('score-body');if(!body)return;
  if(!data||!data.ok){body.innerHTML='<div style="padding:20px;color:#EF4444;font-size:12px">Sin datos del score</div>';return;}
  var pct=(data.score||{}).total||0,des=(data.score||{}).desglose||{},mx=(data.score||{}).maximos||{dinero:25,habitos:25,salud:20,relaciones:15,mental:15};
  var color=pct>=70?'#4ADE80':pct>=55?'#F59E0B':'#EF4444',estado=(data.score||{}).estado||'';
  var R=54,C=2*Math.PI*R;
  var html='<div style="display:flex;flex-direction:column;align-items:center;padding:20px 16px 8px">';
  html+='<svg width="140" height="140" viewBox="0 0 140 140"><circle cx="70" cy="70" r="'+R+'" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="12"/><circle cx="70" cy="70" r="'+R+'" fill="none" stroke="'+color+'" stroke-width="12" stroke-dasharray="'+C.toFixed(1)+'" stroke-dashoffset="'+(C*(1-pct/100)).toFixed(1)+'" stroke-linecap="round" transform="rotate(-90 70 70)" style="transition:stroke-dashoffset .8s ease"/><text x="70" y="65" text-anchor="middle" font-size="32" font-weight="700" fill="'+color+'" font-family="system-ui">'+pct+'</text><text x="70" y="82" text-anchor="middle" font-size="11" fill="rgba(255,255,255,.4)" font-family="system-ui">/100</text></svg>';
  html+='<div style="font-size:12px;color:rgba(255,255,255,.5);margin-top:4px">'+estado+'</div></div>';
  var msgs=(data.alertas||[]).concat(data.positivos||[]);
  if(msgs.length){html+='<div style="padding:0 16px 8px">';msgs.slice(0,3).forEach(function(m){var c=m.nivel==='critico'?'#EF4444':m.nivel==='positivo'?'#4ADE80':'#F59E0B';html+='<div style="font-size:11px;color:'+c+';padding:2px 0">'+m.area+' '+m.msg+'</div>';});html+='</div>';}
  var areas=[{key:'dinero',label:'Dinero',icon:'💰',color:'#4ADE80',max:mx.dinero||25},{key:'habitos',label:'Hábitos',icon:'⚡',color:'#3B82F6',max:mx.habitos||25},{key:'salud',label:'Salud',icon:'🏥',color:'#EF4444',max:mx.salud||20},{key:'relaciones',label:'Relaciones',icon:'👥',color:'#06B6D4',max:mx.relaciones||15},{key:'mental',label:'Mental',icon:'🧠',color:'#8B5CF6',max:mx.mental||15}];
  html+='<div style="padding:4px 16px 16px">';
  areas.forEach(function(a){var val=des[a.key]||0;var pctA=Math.min(100,Math.round(val/a.max*100));html+='<div style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><span style="font-size:13px;font-weight:600;color:#fff">'+a.icon+' '+a.label+'</span><span style="font-size:13px;font-weight:700;color:'+a.color+'">'+val+'<span style="font-size:10px;color:rgba(255,255,255,.3)">/'+a.max+'</span></span></div><div style="height:5px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden"><div class="score-bar-fill" style="width:'+pctA+'%;background:'+a.color+'"></div></div></div>';});
  html+='</div>';
  body.innerHTML=html;
}

// ══════════════════════════════════════════
//  MASLOW INLINE — vars compartidas
// ══════════════════════════════════════════
var _necInlineData=null,_necInlineVista='piramide';

function renderNecesidadesInline(data){
  if(!data) return;
  _necInlineData = data;
  window._necInlineData = data;
  _initNecInlineSelectors();

  // Si ya tenemos niveles en los datos recibidos, dibujar directo sin nueva llamada a API
  var niveles = data.niveles || [];
  if(niveles.length){
    function _drawWithChart(){
      _dibujarNecesidesInlineCompleto(niveles);
    }
    if(!window.Chart){
      var s=document.createElement('script');
      s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      s.onload=function(){ setTimeout(_drawWithChart, 80); };
      document.head.appendChild(s);
    } else {
      _drawWithChart();
    }
    return;
  }

  // Si no hay niveles en los datos, hacer llamada a API
  if(!window.Chart){
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
    s.onload=function(){ actualizarNecInline(); };
    document.head.appendChild(s);
  } else {
    actualizarNecInline();
  }
}

function _dataNivelInline(key,arr){return(arr||[]).find(function(n){return n.key===key;})||{key:key,total:0,conceptos:[]};}

// ════════════════════════════════════════════════════════════
//  SIM NEEDS — Stub que reenvía al render del OVERLAY del dial
//  (la banda Sim ya NO vive en el dashboard; se eliminaron sec-sim/sec-nav
//   del index.html. La banda vive en _pSim del dial overlay y la pinta
//   renderSimsBandSimsStyle() de raw-core.js.)
// ════════════════════════════════════════════════════════════
function renderSimsPanel(){
  // Si el overlay del dial está montado y abierto, reenviar al renderer del overlay.
  if(typeof window.renderSimsBandSimsStyle === 'function'
     && document.getElementById('hud-sim-band-grid')){
    try { window.renderSimsBandSimsStyle('hud-sim-band-grid'); } catch(_){}
  }
  // Si hubiera quedado el contenedor viejo en el dashboard, lo dejamos vacío.
  var legacy = document.getElementById('sim-needs-grid');
  if(legacy && !legacy._cleared){
    legacy.innerHTML = '';
    legacy._cleared = true;
  }
}

window.renderSimsPanel = renderSimsPanel;
// Alias retrocompat: cualquier código viejo que aún llame renderSimsNeeds()
window.renderSimsNeeds = renderSimsPanel;

// ══════════════════════════════════════════
//  PATRIMONIO
// ══════════════════════════════════════════
function renderPatrimonio(data, containerId){
  var body=document.getElementById(containerId||'patrimonio-body');if(!body)return;
  if(!data||!data.ok){body.innerHTML='<div style="padding:20px;text-align:center;color:var(--m)">Sin datos</div>';return;}
  var fmt=function(v){return'$ '+Math.abs(v||0).toLocaleString('es-MX',{minimumFractionDigits:0});};
  var fmt2=function(v){return'$ '+Math.abs(v||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});};
  var f=data.fondo||{},banco=data.banco||{saldo:0,pct:0,items:[]},fisico=data.fisico||{saldo:0,pct:0,items:[]},inversion=data.inversion||{saldo:0,pct:0,rendimientoTotal:0,items:[]},total=data.total||0;
  var saludColor=f.salud==='ok'?'#4ADE80':f.salud==='warn'?'#F59E0B':'#EF4444';
  var saludLbl=f.salud==='ok'?'Fondo completo':f.salud==='warn'?'Fondo parcial':'Sin fondo';
  var apPorBanco={},totalAp=0;
  (window._apartadosData||[]).forEach(function(ap){if(ap.estado&&ap.estado.toLowerCase()==='usado')return;var b=(ap.banco||'').trim().toUpperCase();apPorBanco[b]=(apPorBanco[b]||0)+(ap.monto||0);totalAp+=(ap.monto||0);});
  var totalDisponible=total-totalAp,totalBruto=total;
  var html='';
  html+='<div style="padding:14px 16px 12px;border-bottom:1px solid rgba(255,255,255,.06)">';
  html+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--m)">Disponible</div>';
  if(totalAp>0)html+='<div style="font-size:10px;color:var(--m);margin-left:auto">Bruto <span style="color:rgba(255,255,255,.4);font-weight:600">'+fmt2(totalBruto)+'</span> − Apartados <span style="color:#F59E0B;font-weight:600">'+fmt(totalAp)+'</span></div>';
  html+='</div><div style="display:flex;align-items:center;width:100%">';
  html+='<div style="flex:0 0 auto"><div style="font-size:34px;font-weight:800;letter-spacing:-.04em;color:#4ADE80;line-height:1;white-space:nowrap">'+fmt2(totalDisponible)+'</div></div>';
  var chipItems=[];
  if((banco.items||[]).length>0){var totalApBanco=0;(banco.items||[]).forEach(function(it){totalApBanco+=apPorBanco[(it.nombre||'').toUpperCase()]||0;});chipItems.push({nombre:'Banco',disp:banco.saldo-totalApBanco,saldo:banco.saldo,color:'#4ADE80',apIt:totalApBanco});}
  if((fisico.items||[]).length>0){var totalApFisico=0;(fisico.items||[]).forEach(function(it){totalApFisico+=apPorBanco[(it.nombre||'').toUpperCase()]||0;});chipItems.push({nombre:'Efectivo',disp:fisico.saldo-totalApFisico,saldo:fisico.saldo,color:'#FBBF24',apIt:totalApFisico});}
  if(inversion.saldo>0)chipItems.push({nombre:'Inversión',disp:inversion.saldo,saldo:inversion.saldo,color:'#C4B5FD',apIt:0});
  chipItems.forEach(function(ch){html+='<div style="width:1px;height:32px;background:rgba(255,255,255,.1);margin:0 16px;flex-shrink:0"></div><div style="flex:1;min-width:0"><div style="font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--m);margin-bottom:3px">'+ch.nombre+'</div><div style="font-size:18px;font-weight:700;color:'+ch.color+';letter-spacing:-.02em;line-height:1">'+fmt(ch.disp)+'</div>'+(ch.apIt>0?'<div style="font-size:10px;color:rgba(255,255,255,.25);margin-top:1px">saldo '+fmt(ch.saldo)+'</div>':'')+'</div>';});
  html+='</div></div>';
  if(totalBruto>0){html+='<div style="margin:0 16px 10px;height:5px;border-radius:3px;overflow:hidden;display:flex;gap:1px">';(banco.items||[]).forEach(function(it){var apIt=apPorBanco[(it.nombre||'').toUpperCase()]||0;var dP=Math.round(((it.monto||0)-apIt)/totalBruto*100);var aP=Math.round(apIt/totalBruto*100);if(dP>0)html+='<div style="width:'+dP+'%;background:#4ADE80"></div>';if(aP>0)html+='<div style="width:'+aP+'%;background:rgba(245,158,11,.4)"></div>';});(fisico.items||[]).forEach(function(it){var pct=Math.round((it.monto||0)/totalBruto*100);if(pct>0)html+='<div style="width:'+pct+'%;background:#FBBF24"></div>';});if(inversion.saldo>0){var pct=Math.round(inversion.saldo/totalBruto*100);if(pct>0)html+='<div style="width:'+pct+'%;background:#8B5CF6"></div>';}html+='</div>';}
  if(f.meta>0){html+='<div style="margin:0 16px 10px;padding:10px 12px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:8px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px"><span style="font-size:11px;color:var(--m)">🎯 Fondo emergencia</span><span style="font-size:12px;font-weight:700;color:'+saludColor+'">'+(f.avance||0)+'% · '+saludLbl+'</span></div><div style="height:4px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;margin-bottom:5px"><div style="height:100%;width:'+Math.min(100,f.avance||0)+'%;background:'+saludColor+';border-radius:2px"></div></div><div style="display:flex;justify-content:space-between;font-size:10px;color:var(--m)"><span>Banco: <b style="color:rgba(255,255,255,.5)">'+fmt(banco.saldo)+'</b></span><span>Meta: <b style="color:rgba(255,255,255,.5)">'+fmt(f.meta)+'</b> · '+(f.meses||0)+' meses</span></div></div>';}
  html+='<div style="border-top:1px solid rgba(255,255,255,.06);margin:2px 0 0"></div>';
  html+='<div style="padding:4px 0 0">';
  var _fijosGlobal=window._fijosData||[];
  if(_fijosGlobal.length){
    var totalFijos=_fijosGlobal.reduce(function(s,fi){return fi.nombre==='P'?s:s+(fi.monto||0);},0);
    var totalDisp=totalFijos-totalAp;var hayP=_fijosGlobal.some(function(fi){return fi.nombre==='P';});
    html+='<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px 6px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--m)">Saldos</div><div style="font-size:16px;font-weight:800;color:#4ADE80;letter-spacing:-.02em">'+fmt2(totalDisp)+'</div></div>';
    _fijosGlobal.forEach(function(fi){
      var excluido=fi.nombre==='P';var bancKey=(fi.nombre||'').trim().toUpperCase();var apBanco=apPorBanco[bancKey]||0;var disp=(fi.monto||0)-apBanco;
      var montoFmt=(fi.monto||0)>=0?'$ '+Math.abs(fi.monto||0).toLocaleString('es-MX',{minimumFractionDigits:2}):'− $ '+Math.abs(fi.monto||0).toLocaleString('es-MX',{minimumFractionDigits:2});
      var montoColor=excluido?'#EF4444':'#4ADE80';
      html+='<div class="ente-row'+(excluido?' excluido-total':'')+'" onclick="togEnteEdit('+fi.fila+',event)" style="padding:10px 16px"><div class="ente-nombre">'+fi.nombre+'</div><div class="ente-right"><div style="text-align:right"><div class="ente-monto" id="em-'+fi.fila+'" style="color:'+montoColor+'">'+montoFmt+'</div>'+((!excluido&&apBanco>0)?'<div style="font-size:11px;color:var(--m);margin-top:1px">disponible: <span style="color:#4ADE80;font-weight:700;font-size:12px">'+fmt(disp)+'</span></div>':'')+'</div><div class="ente-fecha">'+fmtDiaSemana(fi.fecha)+'</div></div></div>';
      html+='<div class="ente-edit" id="ee-'+fi.fila+'"><input type="number" value="'+(fi.monto!==null?fi.monto:'')+'" step="0.01" inputmode="decimal" id="ei-'+fi.fila+'" placeholder="0.00" onkeydown="if(event.key===\'Enter\')guardarEnte('+fi.fila+',event);if(event.key===\'Escape\')togEnteEdit('+fi.fila+',event)"><button class="btn-check" id="ec-'+fi.fila+'" onclick="guardarEnte('+fi.fila+',event)"><i class="fas fa-check" id="ei-ico-'+fi.fila+'"></i></button></div>';
    });
    if(hayP)html+='<div class="ente-excluido-nota">* excluido del total</div>';
  }
  if((window._apartadosData||[]).length){
    html+='<div style="padding:8px 16px 4px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.06);margin-top:4px"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--m)">Apartados</div><span style="font-size:13px;font-weight:700;color:var(--warn)">'+fmt(totalAp)+'</span></div>';
    var hoy=new Date();hoy.setHours(0,0,0,0);
    (window._apartadosData||[]).forEach(function(ap){
      var usado=ap.estado&&ap.estado.toLowerCase()==='usado';var metaStr='';
      if(ap.meta){var diff=Math.floor((new Date(ap.meta)-hoy)/86400000);metaStr=diff<0?'Vencido':diff===0?'Hoy':'en '+diff+' días';}
      html+='<div class="apartado-item '+(usado?'usado':'')+'"><div class="apartado-icon">💰</div><div class="apartado-info"><div class="apartado-nombre">'+ap.nombre+'</div><div class="apartado-meta">'+(ap.banco||'')+(ap.categoria?' · '+ap.categoria:'')+(metaStr?' · '+metaStr:'')+'</div></div><div><div class="apartado-monto">'+fmt(ap.monto)+'</div>'+(!usado?'<button onclick="_marcarApartadoUsado('+ap.fila+')" style="font-size:10px;padding:3px 10px;border-radius:var(--rad-pill);border:1px solid rgba(74,222,128,.25);background:rgba(74,222,128,.08);color:#4ADE80;cursor:pointer;font-family:inherit;margin-top:5px;display:block">Usar ✓</button>':'<div style="font-size:10px;color:var(--m);margin-top:4px">Usado</div>')+'</div></div>';
    });
  }
  html+='</div>';
  body.innerHTML=html;
}
// ══════════════════════════════════════════════════════════════════
//  FIJOS — VISTA EXPANDIDA (mockup v5.193)
//  Rediseño de la card expandida de Fijos. Consume api.getGastos()
//  (data.grupos) y, si existen, los campos nuevos del backend; si no,
//  los deriva. NO reemplaza renderAnualidad (usado en vista normal).
//
//  ─── CONTRATO DE DATOS (lo que el GAS deberia entregar) ───
//  data.grupos[i] = {
//    concepto:  string                       // ya existe
//    estado:    string  (opcional)           // NUEVO. Se normaliza:
//               "activo"|"pendiente"|"inactivo"|"cancelado"
//               (acepta sinonimos/acentos/mayus). Si falta -> derivado.
//    items[j] = { clave:mes, monto:number, pagado:"Sí"/"No" }  // ya existe
//  }
//  Todo lo demas (total mensual, servicios activos, variacion,
//  barras apiladas, tendencia) se DERIVA de lo anterior.
// ══════════════════════════════════════════════════════════════════

// Normaliza el estado a una de 4 claves canonicas. Acepta sinonimos.
function _fijosNormEstado(raw){
  if(raw===null||raw===undefined||raw==='') return null;
  var s=String(raw).toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  if(/activ|cobr|vigent|si\b/.test(s)) return 'activo';
  if(/pend|proxim|por cobrar/.test(s)) return 'pendiente';
  if(/inactiv|pausad|stop|baja/.test(s)) return 'inactivo';
  if(/cancel|elimin/.test(s)) return 'cancelado';
  return null;
}

// Config visual por estado.
var _FIJOS_ESTADOS={
  activo:    {lbl:'Activo',    color:'#4ADE80', dot:'fa-circle'},
  pendiente: {lbl:'Pendiente', color:'#F59E0B', dot:'fa-clock'},
  inactivo:  {lbl:'Inactivo',  color:'#94A3B8', dot:'fa-circle'},
  cancelado: {lbl:'Cancelado', color:'#EF4444', dot:'fa-ban'}
};

// Deriva el estado de un grupo cuando el backend no lo da:
//  - tiene monto en el mes actual y esta pagado -> activo
//  - tiene monto en el mes actual sin pagar     -> pendiente
//  - no tiene monto en ningun mes               -> inactivo
function _fijosEstadoDerivado(g){
  var mesActIdx=new Date().getMonth();
  var MIDX={enero:0,febrero:1,marzo:2,abril:3,mayo:4,junio:5,
    julio:6,agosto:7,septiembre:8,octubre:9,noviembre:10,diciembre:11};
  var itemMesAct=null, tieneAlgunMonto=false;
  (g.items||[]).forEach(function(it){
    if(it.monto!==null&&it.monto!==undefined&&it.monto!==0) tieneAlgunMonto=true;
    var cl=(it.clave||'').toLowerCase();
    var m=Object.keys(MIDX).find(function(k){return cl.indexOf(k)>=0;});
    if(m&&MIDX[m]===mesActIdx) itemMesAct=it;
  });
  var pag=itemMesAct&&(itemMesAct.pagado==='Sí'||itemMesAct.pagado==='Si'||itemMesAct.pagado==='sí');
  if(itemMesAct&&itemMesAct.monto){ return pag?'activo':'pendiente'; }
  if(tieneAlgunMonto) return 'activo';
  return 'inactivo';
}

// Icono FontAwesome sugerido por concepto (heuristico, decorativo).
function _fijosIcono(concepto){
  var c=(concepto||'').toLowerCase();
  if(/renta|casa|hogar/.test(c)) return 'fa-house';
  if(/cfe|luz|electric/.test(c)) return 'fa-bolt';
  if(/gas/.test(c)) return 'fa-fire';
  if(/telcel|movil|cel|telefon/.test(c)) return 'fa-tower-cell';
  if(/izzi|internet|wifi|totalplay|megacable/.test(c)) return 'fa-wifi';
  if(/spotify|musica/.test(c)) return 'fa-music';
  if(/icloud|drive|nube|storage/.test(c)) return 'fa-cloud';
  if(/netflix|hbo|disney|prime|stream/.test(c)) return 'fa-film';
  if(/gym|gimnasio/.test(c)) return 'fa-dumbbell';
  if(/seguro|1917/.test(c)) return 'fa-shield-halved';
  if(/agua/.test(c)) return 'fa-droplet';
  return 'fa-circle-dot';
}

function renderFijosExpandido(data, containerId){
  var body=document.getElementById(containerId||'hud-fijos-tabla');
  if(!body) return;
  if(!data||!data.ok||!data.grupos||!data.grupos.length){
    body.innerHTML='<div style="padding:40px;text-align:center;color:rgba(220,224,235,.4);font-size:12px">Sin datos de gastos fijos</div>';
    return;
  }
  var FC='#67E8F9'; // acento del panel Fijos
  var grupos=data.grupos;
  var claves=[];
  grupos.forEach(function(g){(g.items||[]).forEach(function(it){
    if(claves.indexOf(it.clave)<0) claves.push(it.clave);
  });});
  var mesActual=MESES_ES[new Date().getMonth()];
  var fmt=function(v){
    if(v===null||v===undefined) return '—';
    return '$ '+Math.abs(v).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
  };

  // ── Resolver estado por grupo (backend o derivado) ──
  grupos.forEach(function(g){
    g._estado=_fijosNormEstado(g.estado)||_fijosEstadoDerivado(g);
  });

  // ── Metricas del panel de analisis (derivadas) ──
  var idxMesAct=claves.findIndex(function(c){return c.toUpperCase()===mesActual.toUpperCase();});
  if(idxMesAct<0) idxMesAct=claves.length-1;
  function totalMes(ci){
    if(ci<0) return 0;
    var clave=claves[ci]; var t=0;
    grupos.forEach(function(g){
      var it=(g.items||[]).find(function(x){return x.clave===clave;});
      if(it&&it.monto) t+=Math.abs(it.monto);
    });
    return t;
  }
  var totalActual=totalMes(idxMesAct);
  var totalPrev=totalMes(idxMesAct-1);
  var nActivos=grupos.filter(function(g){return g._estado==='activo';}).length;
  var variacion=totalPrev>0?((totalActual-totalPrev)/totalPrev*100):0;
  var varColor=variacion>0?'#EF4444':variacion<0?'#4ADE80':'#94A3B8';
  var varSigno=variacion>0?'+':'';

  // ── CSS de la vista (scoped con prefijo .fjx-) ──
  var css='<style>'+
    '.fjx{display:flex;gap:16px;align-items:stretch;width:100%;font-family:Manrope,-apple-system,sans-serif}'+
    '.fjx-main{flex:1.35;min-width:0;display:flex;flex-direction:column}'+
    '.fjx-side{flex:0.95;min-width:0;display:flex;flex-direction:column;gap:14px}'+
    '.fjx-tbl-wrap{overflow-x:auto;border:1px solid rgba(255,255,255,.06);border-radius:10px}'+
    '.fjx-tbl{width:100%;border-collapse:collapse;font-size:12px}'+
    '.fjx-tbl th{padding:10px 12px;background:rgba(255,255,255,.03);font-size:9px;font-weight:800;'+
      'letter-spacing:.07em;text-transform:uppercase;color:rgba(220,224,235,.6);'+
      'border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap;text-align:center}'+
    '.fjx-tbl th:first-child,.fjx-tbl th:nth-child(2){text-align:left}'+
    '.fjx-tbl td{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.04);'+
      'white-space:nowrap;text-align:center;font-variant-numeric:tabular-nums}'+
    '.fjx-tbl tr:hover td{background:rgba(255,255,255,.02)}'+
    '.fjx-concepto{display:flex;align-items:center;gap:9px;text-align:left;font-weight:700;color:#fff;font-size:12.5px}'+
    '.fjx-concepto i{width:26px;height:26px;display:flex;align-items:center;justify-content:center;'+
      'border-radius:7px;background:rgba(255,255,255,.05);font-size:11px;flex-shrink:0;color:'+FC+'}'+
    '.fjx-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:999px;'+
      'font-size:9.5px;font-weight:800;letter-spacing:.03em;border:1px solid}'+
    '.fjx-badge i{font-size:6px}'+
    '.fjx-mes-amt{font-weight:700;font-size:11.5px}'+
    '.fjx-check{font-size:13px}'+
    '.fjx-dash{color:rgba(220,224,235,.25)}'+
    '.fjx-tot-row td{background:rgba(103,232,249,.06);border-top:2px solid rgba(103,232,249,.25);'+
      'font-weight:800;border-bottom:none}'+
    '.fjx-tot-row td:first-child{text-align:left;font-size:9px;letter-spacing:.10em;'+
      'text-transform:uppercase;color:'+FC+'}'+
    '.fjx-tot-amt{color:'+FC+';font-size:11.5px}'+
    '.fjx-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);'+
      'border-radius:10px;padding:13px 14px}'+
    '.fjx-stats{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}'+
    '.fjx-stat{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);'+
      'border-radius:10px;padding:12px 11px;display:flex;flex-direction:column;gap:5px}'+
    '.fjx-stat-top{display:flex;align-items:center;gap:7px}'+
    '.fjx-stat-ico{width:24px;height:24px;border-radius:6px;display:flex;align-items:center;'+
      'justify-content:center;font-size:10px;flex-shrink:0}'+
    '.fjx-stat-lbl{font-size:7.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;'+
      'color:rgba(220,224,235,.5);line-height:1.3}'+
    '.fjx-stat-v{font-size:19px;font-weight:800;font-family:JetBrains Mono,monospace;line-height:1}'+
    '.fjx-stat-sub{font-size:9px;color:rgba(220,224,235,.45);font-weight:600}'+
    '.fjx-sec-t{font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;'+
      'color:rgba(220,224,235,.65);margin-bottom:10px}'+
    '.fjx-leg{display:flex;flex-wrap:wrap;gap:8px 12px;margin-top:10px}'+
    '.fjx-leg-it{display:flex;align-items:center;gap:5px;font-size:9.5px;font-weight:600;'+
      'color:rgba(220,224,235,.7)}'+
    '.fjx-leg-dot{width:9px;height:9px;border-radius:3px;flex-shrink:0}'+
    '.fjx-foot{font-size:10px;color:rgba(220,224,235,.4);padding:10px 2px 0;font-weight:600}'+
  '</style>';

  // ── Tabla principal ──
  var thead='<tr><th>Concepto</th><th>Estado</th>'+
    claves.map(function(c){
      var esA=c.toUpperCase()===mesActual.toUpperCase();
      return '<th'+(esA?' style="color:'+FC+'"':'')+'>'+c+'</th>';
    }).join('')+'</tr>';

  var tbody=grupos.map(function(g){
    var est=_FIJOS_ESTADOS[g._estado]||_FIJOS_ESTADOS.inactivo;
    var apagado=(g._estado==='inactivo'||g._estado==='cancelado');
    var badge='<span class="fjx-badge" style="color:'+est.color+';border-color:'+est.color+'40;'+
      'background:'+est.color+'14"><i class="fas '+est.dot+'"></i>'+est.lbl+'</span>';
    var celdas=claves.map(function(clave){
      var it=(g.items||[]).find(function(x){return x.clave===clave;});
      if(!it||it.monto===null||it.monto===undefined){
        return '<td><span class="fjx-dash">—</span></td>';
      }
      var pag=(it.pagado==='Sí'||it.pagado==='Si'||it.pagado==='sí');
      var mesIdx=claves.indexOf(clave);
      // Mes futuro: muestra monto tenue. Mes <= actual: check o reloj.
      if(mesIdx>idxMesAct){
        return '<td><span class="fjx-dash">—</span></td>';
      }
      if(g._estado==='pendiente'&&mesIdx===idxMesAct){
        return '<td><i class="fas fa-clock fjx-check" style="color:#F59E0B"></i></td>';
      }
      if(it.monto&&pag){
        return '<td><i class="fas fa-circle-check fjx-check" style="color:#4ADE80"></i></td>';
      }
      if(it.monto&&!pag){
        return '<td><span class="fjx-mes-amt" style="color:#F59E0B">'+fmt(it.monto)+'</span></td>';
      }
      return '<td><span class="fjx-dash">—</span></td>';
    }).join('');
    // Primera celda de monto = mes actual con su valor visible
    var itAct=(g.items||[]).find(function(x){return x.clave&&x.clave.toUpperCase()===mesActual.toUpperCase();});
    var montoActual=itAct&&itAct.monto?fmt(itAct.monto):'—';
    return '<tr style="opacity:'+(apagado?'.5':'1')+'">'+
      '<td><div class="fjx-concepto"><i class="fas '+_fijosIcono(g.concepto)+'"></i>'+g.concepto+'</div></td>'+
      '<td style="text-align:left">'+badge+'</td>'+
      celdas+'</tr>';
  }).join('');

  // Fila de totales
  var totRow='<tr class="fjx-tot-row"><td>Totales</td><td></td>'+
    claves.map(function(c,ci){
      var t=totalMes(ci);
      return '<td><span class="fjx-tot-amt">'+(t>0?fmt(t):'—')+'</span></td>';
    }).join('')+'</tr>';

  var tablaHTML='<div class="fjx-tbl-wrap"><table class="fjx-tbl">'+
    '<thead>'+thead+'</thead><tbody>'+tbody+totRow+'</tbody></table></div>';

  // ── Panel de analisis (derecha) ──
  var statsHTML='<div class="fjx-stats">'+
    '<div class="fjx-stat">'+
      '<div class="fjx-stat-top">'+
        '<div class="fjx-stat-ico" style="background:'+FC+'1e;color:'+FC+'"><i class="fas fa-coins"></i></div>'+
        '<div class="fjx-stat-lbl">Total fijo<br>mensual</div>'+
      '</div>'+
      '<div class="fjx-stat-v" style="color:'+FC+'">'+fmt(totalActual)+'</div>'+
      '<div class="fjx-stat-sub">en '+mesActual+'</div>'+
    '</div>'+
    '<div class="fjx-stat">'+
      '<div class="fjx-stat-top">'+
        '<div class="fjx-stat-ico" style="background:#3B82F61e;color:#60A5FA"><i class="fas fa-list-check"></i></div>'+
        '<div class="fjx-stat-lbl">Servicios<br>activos</div>'+
      '</div>'+
      '<div class="fjx-stat-v" style="color:#60A5FA">'+nActivos+' <span style="font-size:12px;opacity:.4">/ '+grupos.length+'</span></div>'+
      '<div class="fjx-stat-sub">'+Math.round(nActivos/grupos.length*100)+'% del total</div>'+
    '</div>'+
    '<div class="fjx-stat">'+
      '<div class="fjx-stat-top">'+
        '<div class="fjx-stat-ico" style="background:'+varColor+'1e;color:'+varColor+'"><i class="fas fa-arrow-trend-up"></i></div>'+
        '<div class="fjx-stat-lbl">Variación<br>mensual</div>'+
      '</div>'+
      '<div class="fjx-stat-v" style="color:'+varColor+'">'+varSigno+variacion.toFixed(1)+'%</div>'+
      '<div class="fjx-stat-sub">vs. mes anterior</div>'+
    '</div>'+
  '</div>';

  // Contenedores de graficas (Chart.js los llena en hydrate)
  var graficasHTML=
    '<div class="fjx-card">'+
      '<div class="fjx-sec-t">Composición mensual por categoría</div>'+
      '<div style="height:200px"><canvas id="fjx-bars-canvas"></canvas></div>'+
      '<div class="fjx-leg" id="fjx-bars-leg"></div>'+
    '</div>'+
    '<div class="fjx-card">'+
      '<div class="fjx-sec-t">Tendencia total ('+claves.length+' meses)</div>'+
      '<div style="height:120px"><canvas id="fjx-trend-canvas"></canvas></div>'+
    '</div>';

  body.innerHTML=css+
    '<div class="fjx">'+
      '<div class="fjx-main">'+
        tablaHTML+
        '<div class="fjx-foot">Activo (se cobra) · Pendiente (próximo cobro) · '+
          'Inactivo (pausado) · Cancelado</div>'+
      '</div>'+
      '<div class="fjx-side">'+
        statsHTML+
        graficasHTML+
      '</div>'+
    '</div>';

  // Guardar contexto para que las graficas se pinten en hydrate
  window._fjxCtx={grupos:grupos,claves:claves,FC:FC};
}

// Pinta las dos graficas Chart.js de la vista expandida de Fijos.
function renderFijosGraficas(){
  var ctx=window._fjxCtx;
  if(!ctx||!window.Chart) return;
  var grupos=ctx.grupos, claves=ctx.claves, FC=ctx.FC;
  var PAL=['#34D399','#3B82F6','#8B5CF6','#EF4444','#F59E0B','#EC4899',
           '#06B6D4','#FB923C','#A78BFA','#FACC15','#4ADE80','#67E8F9'];

  // ── Barras apiladas: cada servicio = una serie ──
  var bc=document.getElementById('fjx-bars-canvas');
  if(bc){
    var dsets=grupos.map(function(g,i){
      var color=PAL[i%PAL.length];
      return {
        label:g.concepto,
        data:claves.map(function(clave){
          var it=(g.items||[]).find(function(x){return x.clave===clave;});
          return it&&it.monto?Math.abs(it.monto):0;
        }),
        backgroundColor:color,
        borderRadius:2,
        stack:'fijos'
      };
    });
    if(window._fjxBarsChart){try{window._fjxBarsChart.destroy();}catch(e){}}
    window._fjxBarsChart=new Chart(bc,{
      type:'bar',
      data:{labels:claves.map(function(c){return c.slice(0,3);}),datasets:dsets},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},
          tooltip:{backgroundColor:'rgba(15,23,42,.95)',borderColor:'rgba(103,232,249,.3)',
            borderWidth:1,titleColor:'#fff',bodyColor:'#94A3B8',padding:9,
            callbacks:{label:function(c){return ' '+c.dataset.label+': $ '+
              Math.abs(c.raw).toLocaleString('es-MX',{minimumFractionDigits:2});}}}},
        scales:{x:{stacked:true,grid:{display:false},
            ticks:{color:'#64748B',font:{size:9}}},
          y:{stacked:true,grid:{color:'rgba(255,255,255,.05)'},
            ticks:{color:'#64748B',font:{size:9},
              callback:function(v){return '$'+(v/1000).toFixed(0)+'k';}}}}}
    });
    var leg=document.getElementById('fjx-bars-leg');
    if(leg){
      leg.innerHTML=grupos.map(function(g,i){
        var color=PAL[i%PAL.length];
        return '<div class="fjx-leg-it"><div class="fjx-leg-dot" style="background:'+color+'"></div>'+g.concepto+'</div>';
      }).join('');
    }
  }

  // ── Tendencia: total mensual ──
  var tc=document.getElementById('fjx-trend-canvas');
  if(tc){
    var totales=claves.map(function(clave){
      var t=0;
      grupos.forEach(function(g){
        var it=(g.items||[]).find(function(x){return x.clave===clave;});
        if(it&&it.monto) t+=Math.abs(it.monto);
      });
      return t;
    });
    if(window._fjxTrendChart){try{window._fjxTrendChart.destroy();}catch(e){}}
    window._fjxTrendChart=new Chart(tc,{
      type:'line',
      data:{labels:claves.map(function(c){return c.slice(0,3);}),
        datasets:[{data:totales,borderColor:FC,borderWidth:2,
          pointRadius:3,pointHoverRadius:5,pointBackgroundColor:FC,
          fill:true,backgroundColor:'rgba(103,232,249,.08)',tension:.35}]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{display:false},
          tooltip:{backgroundColor:'rgba(15,23,42,.95)',borderColor:'rgba(103,232,249,.3)',
            borderWidth:1,titleColor:'#fff',bodyColor:'#94A3B8',padding:9,
            callbacks:{label:function(c){return ' Total: $ '+
              Math.abs(c.raw).toLocaleString('es-MX',{minimumFractionDigits:2});}}}},
        scales:{x:{grid:{display:false},ticks:{color:'#64748B',font:{size:9}}},
          y:{grid:{color:'rgba(255,255,255,.05)'},
            ticks:{color:'#64748B',font:{size:9},
              callback:function(v){return '$'+(v/1000).toFixed(0)+'k';}}}}}
    });
  }
}

window.renderFijosExpandido=renderFijosExpandido;
window.renderFijosGraficas=renderFijosGraficas;

// ══════════════════════════════════════════════════════════════════
//  VARIABLES — VISTA EXPANDIDA (mockup v5.200)
//  Rediseño de la card expandida de Variables. Consume datosMes
//  (meses[] + grupos[mes][] con {ente, monto}). NO reemplaza
//  renderGastos (usado en la vista no-expandida).
//
//  ─── CONTRATO DE DATOS (lo que el GAS deberia entregar) ───
//  datosMes = {
//    meses: ["Enero","Febrero",...]              // ya existe
//    grupos: { "Enero": [ {ente:string, monto:number}, ... ], ... }
//  }
//  Campos NUEVOS opcionales por ente (si el GAS los provee se usan,
//  si no se derivan):
//    - categoria: string  // agrupacion del ente; si falta = el ente
//    - icono: string      // clase FontAwesome; si falta = heuristica
//  Stat-cards (gasto total, mayor aumento, tendencia, mayor categoria)
//  se DERIVAN de meses+grupos.
//
//  REGLAS DE NEGOCIO (de LifeOS):
//   - Inicio, Final, Rectificacion, Bancos: se EXCLUYEN de los
//     calculos de stats (no son gasto real).
//   - BW: siempre ingreso.
// ══════════════════════════════════════════════════════════════════

// Entes que no cuentan como gasto variable real.
var _VAR_EXCLUIR=['inicio','final','rectificacion','rectificación','bancos'];
function _varEsExcluido(ente){
  var e=String(ente||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  return _VAR_EXCLUIR.indexOf(e)>=0;
}
function _varEsIngreso(ente){
  return String(ente||'').toUpperCase()==='BW';
}

// Icono FontAwesome por ente (heuristico, decorativo).
function _varIcono(ente){
  var c=(ente||'').toLowerCase();
  if(/inicio/.test(c)) return 'fa-flag';
  if(/final/.test(c)) return 'fa-flag-checkered';
  if(/^bw$/.test(c)) return 'fa-money-bill-trend-up';
  if(/foodies|comida|rest/.test(c)) return 'fa-utensils';
  if(/blue|agua/.test(c)) return 'fa-droplet';
  if(/espiritu|espíritu/.test(c)) return 'fa-heart';
  if(/ciencia/.test(c)) return 'fa-flask';
  if(/aseo|limpieza/.test(c)) return 'fa-broom';
  if(/suscrip/.test(c)) return 'fa-credit-card';
  if(/servicio/.test(c)) return 'fa-wrench';
  if(/^p$/.test(c)) return 'fa-user';
  if(/^m$/.test(c)) return 'fa-m';
  return 'fa-circle-dot';
}

// Paleta por ente — consistente con GRAF_COLORS donde existe.
function _varColor(ente, idx){
  if(typeof GRAF_COLORS!=='undefined' && GRAF_COLORS[ente]) return GRAF_COLORS[ente].line;
  var PAL=['#3B82F6','#06B6D4','#8B5CF6','#F59E0B','#4ADE80','#EF4444',
           '#EC4899','#FB923C','#A78BFA','#34D399','#67E8F9','#FBBF24'];
  return PAL[idx%PAL.length];
}

function renderVariablesExpandido(data, containerId){
  var body=document.getElementById(containerId||'hud-var-tabla');
  if(!body) return;
  if(!data||!data.meses||!data.meses.length){
    body.innerHTML='<div style="padding:40px;text-align:center;color:rgba(220,224,235,.4);font-size:12px">Sin datos de movimientos variables</div>';
    return;
  }
  var VC='#A5B4FC'; // acento del panel Variables
  var meses=data.meses;
  var mesActual=MESES_ES[new Date().getMonth()];
  var fmt=function(v){
    if(v===null||v===undefined) return '—';
    return (v<0?'− ':'')+'$ '+Math.abs(v).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
  };

  // Lista de entes (en orden de aparicion) + indice mes→ente→monto.
  var entes=[];
  var idx={};
  meses.forEach(function(mes){
    idx[mes]={};
    (data.grupos[mes]||[]).forEach(function(e){
      if(entes.indexOf(e.ente)<0) entes.push(e.ente);
      idx[mes][e.ente]=e.monto;
    });
  });

  // ── Metricas derivadas (excluyendo Inicio/Final/Rect/Bancos) ──
  var idxMesAct=meses.findIndex(function(m){return m.toUpperCase()===mesActual.toUpperCase();});
  if(idxMesAct<0) idxMesAct=meses.length-1;
  function gastoMes(mi){
    if(mi<0||mi>=meses.length) return 0;
    var mes=meses[mi], t=0;
    entes.forEach(function(ente){
      if(_varEsExcluido(ente)||_varEsIngreso(ente)) return;
      var v=idx[mes][ente];
      if(typeof v==='number') t+=Math.abs(v);
    });
    return t;
  }
  // Gasto total del rango visible.
  var gastoTotal=0;
  meses.forEach(function(_,mi){ gastoTotal+=gastoMes(mi); });
  // Mayor aumento mes a mes (por ente).
  var mayorAumento={ente:'—',delta:0,de:'',a:''};
  for(var mi=1; mi<meses.length; mi++){
    entes.forEach(function(ente){
      if(_varEsExcluido(ente)) return;
      var prev=idx[meses[mi-1]][ente], cur=idx[meses[mi]][ente];
      if(typeof prev==='number'&&typeof cur==='number'){
        var d=Math.abs(cur)-Math.abs(prev);
        if(d>mayorAumento.delta){
          mayorAumento={ente:ente,delta:d,de:meses[mi-1],a:meses[mi]};
        }
      }
    });
  }
  // Tendencia del mes actual vs anterior.
  var gAct=gastoMes(idxMesAct), gPrev=gastoMes(idxMesAct-1);
  var tendDelta=gAct-gPrev;
  // Mayor categoria (ente con mayor gasto acumulado).
  var acumPorEnte={};
  entes.forEach(function(ente){
    if(_varEsExcluido(ente)||_varEsIngreso(ente)) return;
    var t=0;
    meses.forEach(function(mes){
      var v=idx[mes][ente];
      if(typeof v==='number') t+=Math.abs(v);
    });
    acumPorEnte[ente]=t;
  });
  var mayorCat={ente:'—',total:0};
  Object.keys(acumPorEnte).forEach(function(ente){
    if(acumPorEnte[ente]>mayorCat.total) mayorCat={ente:ente,total:acumPorEnte[ente]};
  });

  // ── CSS scoped (.vrx-) ──
  var css='<style>'+
    '.vrx{display:flex;gap:16px;align-items:stretch;width:100%;font-family:Manrope,-apple-system,sans-serif}'+
    '.vrx-main{flex:1.2;min-width:0;display:flex;flex-direction:column}'+
    '.vrx-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px}'+
    '.vrx-tbl-wrap{overflow-x:auto;border:1px solid rgba(255,255,255,.06);border-radius:10px}'+
    '.vrx-tbl{width:100%;border-collapse:collapse;font-size:12px}'+
    '.vrx-tbl th{padding:10px 12px;background:rgba(255,255,255,.03);font-size:9px;font-weight:800;'+
      'letter-spacing:.07em;text-transform:uppercase;color:rgba(220,224,235,.6);'+
      'border-bottom:1px solid rgba(255,255,255,.08);white-space:nowrap;text-align:center}'+
    '.vrx-tbl th:first-child{text-align:left}'+
    '.vrx-tbl td{padding:9px 12px;border-bottom:1px solid rgba(255,255,255,.04);'+
      'white-space:nowrap;text-align:right;font-variant-numeric:tabular-nums;font-weight:700;font-size:11.5px}'+
    '.vrx-tbl td:first-child{text-align:left}'+
    '.vrx-tbl tr:hover td{background:rgba(255,255,255,.02)}'+
    '.vrx-ente{display:flex;align-items:center;gap:9px;font-weight:700;color:#fff;font-size:12.5px}'+
    '.vrx-ente i{width:24px;height:24px;display:flex;align-items:center;justify-content:center;'+
      'border-radius:6px;background:rgba(255,255,255,.05);font-size:10px;flex-shrink:0}'+
    '.vrx-th-act{color:'+VC+'!important}'+
    '.vrx-pos{color:#4ADE80}.vrx-neg{color:#EF4444}.vrx-zero{color:rgba(220,224,235,.3)}'+
    '.vrx-stats{display:grid;grid-template-columns:1fr 1fr;gap:10px}'+
    '.vrx-stat{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);'+
      'border-radius:10px;padding:12px 12px;display:flex;flex-direction:column;gap:5px}'+
    '.vrx-stat-lbl{font-size:8px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;'+
      'color:rgba(220,224,235,.5)}'+
    '.vrx-stat-v{font-size:18px;font-weight:800;font-family:JetBrains Mono,monospace;line-height:1}'+
    '.vrx-stat-sub{font-size:9px;color:rgba(220,224,235,.45);font-weight:600}'+
    '.vrx-card{background:rgba(255,255,255,.025);border:1px solid rgba(255,255,255,.07);'+
      'border-radius:10px;padding:13px 14px}'+
    '.vrx-sec-t{font-size:10px;font-weight:800;letter-spacing:.10em;text-transform:uppercase;'+
      'color:rgba(220,224,235,.65);margin-bottom:10px}'+
    '.vrx-chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:4px}'+
    '.vrx-chip{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border-radius:999px;'+
      'font-size:10px;font-weight:700;border:1px solid}'+
    '.vrx-chip-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}'+
    '.vrx-foot{font-size:10px;color:rgba(220,224,235,.4);padding:10px 2px 0;font-weight:600}'+
  '</style>';

  // ── Tabla principal ──
  var thead='<tr><th>Concepto</th>'+
    meses.map(function(m){
      var esA=m.toUpperCase()===mesActual.toUpperCase();
      return '<th'+(esA?' class="vrx-th-act"':'')+'>'+m+'</th>';
    }).join('')+'</tr>';

  var tbody=entes.map(function(ente,ei){
    var celdas=meses.map(function(mes){
      var v=idx[mes][ente];
      if(v===null||v===undefined) return '<td><span class="vrx-zero">—</span></td>';
      var cls=v>0?'vrx-pos':v<0?'vrx-neg':'vrx-zero';
      return '<td><span class="'+cls+'">'+fmt(v)+'</span></td>';
    }).join('');
    return '<tr>'+
      '<td><div class="vrx-ente"><i class="fas '+_varIcono(ente)+'" style="color:'+_varColor(ente,ei)+'"></i>'+ente+'</div></td>'+
      celdas+'</tr>';
  }).join('');

  var tablaHTML='<div class="vrx-tbl-wrap"><table class="vrx-tbl">'+
    '<thead>'+thead+'</thead><tbody>'+tbody+'</tbody></table></div>';

  // ── Stat-cards ──
  var tendColor=tendDelta>0?'#EF4444':tendDelta<0?'#4ADE80':'#94A3B8';
  var tendSigno=tendDelta>0?'▲':tendDelta<0?'▼':'—';
  var statsHTML='<div class="vrx-stats">'+
    '<div class="vrx-stat">'+
      '<div class="vrx-stat-lbl">Gasto total ('+meses.length+' meses)</div>'+
      '<div class="vrx-stat-v" style="color:#EF4444">'+fmt(gastoTotal)+'</div>'+
      '<div class="vrx-stat-sub">'+meses[0]+' – '+meses[meses.length-1]+'</div>'+
    '</div>'+
    '<div class="vrx-stat">'+
      '<div class="vrx-stat-lbl">Mayor aumento</div>'+
      '<div class="vrx-stat-v" style="color:#F59E0B">'+(mayorAumento.delta>0?'+ '+fmt(mayorAumento.delta).replace('− ',''):'—')+'</div>'+
      '<div class="vrx-stat-sub">'+mayorAumento.ente+(mayorAumento.de?' ('+mayorAumento.de.slice(0,3)+'→'+mayorAumento.a.slice(0,3)+')':'')+'</div>'+
    '</div>'+
    '<div class="vrx-stat">'+
      '<div class="vrx-stat-lbl">Tendencia ('+mesActual.slice(0,3)+')</div>'+
      '<div class="vrx-stat-v" style="color:'+tendColor+'">'+tendSigno+' '+fmt(Math.abs(tendDelta)).replace('− ','')+'</div>'+
      '<div class="vrx-stat-sub">vs. mes anterior</div>'+
    '</div>'+
    '<div class="vrx-stat">'+
      '<div class="vrx-stat-lbl">Mayor categoría</div>'+
      '<div class="vrx-stat-v" style="color:'+VC+'">'+mayorCat.ente+'</div>'+
      '<div class="vrx-stat-sub">'+fmt(mayorCat.total)+'</div>'+
    '</div>'+
  '</div>';

  // ── Chips de categorias (entes) ──
  var chipsHTML='<div class="vrx-card">'+
    '<div class="vrx-sec-t">Categorías</div>'+
    '<div class="vrx-chips">'+
      entes.map(function(ente,ei){
        var color=_varColor(ente,ei);
        var ico=_varEsExcluido(ente)?' <i class="fas fa-eye-slash" style="font-size:7px;opacity:.6"></i>':'';
        return '<span class="vrx-chip" style="color:'+color+';border-color:'+color+'44;background:'+color+'12">'+
          '<span class="vrx-chip-dot" style="background:'+color+'"></span>'+ente+ico+'</span>';
      }).join('')+
    '</div>'+
  '</div>';

  // ── Grafica de tendencia ──
  var graficaHTML='<div class="vrx-card">'+
    '<div class="vrx-sec-t">Tendencia de gasto</div>'+
    '<div style="height:210px"><canvas id="vrx-trend-canvas"></canvas></div>'+
  '</div>';

  body.innerHTML=css+
    '<div class="vrx">'+
      '<div class="vrx-main">'+
        tablaHTML+
        '<div class="vrx-foot">Inicio · Final · Rectificación · Bancos se excluyen de los cálculos. BW es ingreso.</div>'+
      '</div>'+
      '<div class="vrx-side">'+
        statsHTML+
        graficaHTML+
        chipsHTML+
      '</div>'+
    '</div>';

  window._vrxCtx={meses:meses,entes:entes,idx:idx,VC:VC};
}

// Pinta la grafica de tendencia de Variables (Chart.js, lineas por ente).
function renderVariablesGrafica(){
  var ctx=window._vrxCtx;
  if(!ctx||!window.Chart) return;
  var meses=ctx.meses, entes=ctx.entes, idx=ctx.idx;
  var tc=document.getElementById('vrx-trend-canvas');
  if(!tc) return;

  // Una linea por ente (excluye Inicio/Final para no aplastar la escala).
  var dsets=entes.filter(function(e){
    return !_varEsExcluido(e);
  }).map(function(ente,i){
    var color=_varColor(ente,i);
    return {
      label:ente,
      data:meses.map(function(mes){
        var v=idx[mes][ente];
        return (typeof v==='number')?Math.abs(v):null;
      }),
      borderColor:color,
      backgroundColor:color,
      borderWidth:_varEsIngreso(ente)?2.5:1.5,
      pointRadius:3,
      pointHoverRadius:5,
      fill:false,
      tension:.3,
      spanGaps:true
    };
  });

  if(window._vrxTrendChart){try{window._vrxTrendChart.destroy();}catch(e){}}
  window._vrxTrendChart=new Chart(tc,{
    type:'line',
    data:{labels:meses.map(function(m){return m.slice(0,3);}),datasets:dsets},
    options:{responsive:true,maintainAspectRatio:false,
      interaction:{mode:'index',intersect:false},
      plugins:{legend:{display:false},
        tooltip:{backgroundColor:'rgba(15,23,42,.95)',borderColor:'rgba(165,180,252,.3)',
          borderWidth:1,titleColor:'#fff',bodyColor:'#94A3B8',padding:9,
          callbacks:{label:function(c){
            if(c.raw===null||c.raw===undefined) return null;
            return ' '+c.dataset.label+': $ '+Math.abs(c.raw).toLocaleString('es-MX',{minimumFractionDigits:2});
          }}}},
      scales:{x:{grid:{display:false},ticks:{color:'#64748B',font:{size:9}}},
        y:{grid:{color:'rgba(255,255,255,.05)'},
          ticks:{color:'#64748B',font:{size:9},
            callback:function(v){return '$'+(v/1000).toFixed(0)+'k';}}}}}
  });
}

window.renderVariablesExpandido=renderVariablesExpandido;
window.renderVariablesGrafica=renderVariablesGrafica;