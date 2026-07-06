/* LifeOS v11.0 — raw-escena.js · MOTOR v10 (byte-idéntico al proto
   CAPA 0d) + integración dual (app real / standalone).
   Requiere three.min.js antes. En app real: cargar AL FINAL,
   después de todos los raw-*.js. */

'use strict';
/* ═══ ESTADO ÚNICO ═══ */
var cam   = { alt:1500, look:0 };   /* SIEMPRE sobre el eje polar (0,alt,0).
   look: 0 = mirando abajo (cenital) · 1 = mirando al horizonte.
   El movimiento es: descender por el eje + ROTAR la mirada en el punto.
   La cámara jamás se va al perímetro. */
var gajos = { lift:0, spread:1 };
var giroMundo = 0;                             /* rotación de la esfera al girar (_esfG) */
var nivel = 0, idx = 0, enTransicion = false;

/* PALETA CANÓNICA del proto (literal) */
var SEC = [
  { id:'patrimonio', t:'PATRIMONIO', s:'Saldos y apartados', ico:'◆', c:'#9BB0FA' },
  { id:'financiero', t:'FINANCIERO', s:'Ingresos y flujo',   ico:'$', c:'#8FA6F8' },
  { id:'variables',  t:'VARIABLES',  s:'Gastos variables',   ico:'≈', c:'#B49DF9' },
  { id:'fijos',      t:'FIJOS',      s:'Pagos recurrentes',  ico:'▣', c:'#7C9EF5' },
  { id:'necesidades',t:'NECESIDADES',s:'Estado del sim',     ico:'♥', c:'#A78BFA' },
  { id:'bitacora',   t:'BITÁCORA',   s:'Pensamientos',       ico:'✎', c:'#C4B5FD' },
  { id:'activity',   t:'ACTIVITY',   s:'Hábitos y logros',   ico:'⚡', c:'#8B87F0' }
];
var N = SEC.length, PASO = 24, RADIO = 780;    /* canon del carrusel CSS */

/* ═══ curva firma ═══ */
var easeFirma=(function(){
  var p1x=.2,p1y=0,p2x=0,p2y=1;
  function bx(t){var u=1-t;return 3*u*u*t*p1x+3*u*t*t*p2x+t*t*t}
  function by(t){var u=1-t;return 3*u*u*t*p1y+3*u*t*t*p2y+t*t*t}
  return function(x){
    if(x<=0)return 0;if(x>=1)return 1;
    var lo=0,hi=1,t=x;
    for(var i=0;i<24;i++){var v=bx(t);
      if(Math.abs(v-x)<1e-4)break;
      if(v<x)lo=t;else hi=t;t=(lo+hi)/2}
    return by(t)};
})();
/* ═══ motor de tweens (un reloj) + disparos por umbral de progreso ═══ */
var _tweens=[];
function tween(dur,onStep,onDone){
  _tweens.push({t0:performance.now(),dur:dur,step:onStep,done:onDone});
}
function correrTweens(now){
  for(var i=_tweens.length-1;i>=0;i--){
    var tw=_tweens[i];
    var p=Math.min(1,(now-tw.t0)/tw.dur);
    tw.step(easeFirma(p),p);
    if(p>=1){_tweens.splice(i,1);if(tw.done)tw.done()}
  }
}
function fase(p,a,b){return Math.max(0,Math.min(1,(p-a)/(b-a)))}

/* ═══ THREE: esfera única + dial + cosmos ═══ */
var renderer=new THREE.WebGLRenderer({canvas:document.getElementById('gl'),
  antialias:true,alpha:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
var scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0x020810,0.00042);
var camera=new THREE.PerspectiveCamera(46,innerWidth/innerHeight,1,9000);
var mundo=new THREE.Group();scene.add(mundo);

/* ── LA ESFERA (una sola; su casquete asoma por el hueco del dial y
     ESE es el hub — spec: "hub = cara superior de la esfera") ── */
function texturaEsfera(){
  var W=2048,H=1024,cv=document.createElement('canvas');cv.width=W;cv.height=H;
  var c=cv.getContext('2d');
  c.fillStyle='#151027';c.fillRect(0,0,W,H);
  /* manchas orgánicas grandes (nada de color sólido) */
  for(var m2=0;m2<26;m2++){
    var x=Math.random()*W,y=Math.random()*H,r=90+Math.random()*280;
    var g=c.createRadialGradient(x,y,0,x,y,r);
    var tono=Math.random()<.5?'109,94,180':'52,42,96';
    g.addColorStop(0,'rgba('+tono+',.16)');g.addColorStop(1,'transparent');
    c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,6.2832);c.fill();
  }
  /* vetas (osciladores no armónicos) */
  c.globalAlpha=.13;c.strokeStyle='#C4B5FD';c.lineWidth=1.6;
  for(var v=0;v<34;v++){
    c.beginPath();var yy=Math.random()*H,ph=Math.random()*7;
    for(var x2=0;x2<=W;x2+=9){
      var y2=yy+Math.sin(x2*.011+ph)*14+Math.sin(x2*.0037+ph*1.7)*26;
      x2===0?c.moveTo(x2,y2):c.lineTo(x2,y2);
    }c.stroke();
  }
  /* retícula técnica sutil (latitudes) */
  c.globalAlpha=.06;c.strokeStyle='#A78BFA';c.lineWidth=1;
  for(var la=0;la<H;la+=54){c.beginPath();c.moveTo(0,la);c.lineTo(W,la);c.stroke()}
  /* granulado */
  c.globalAlpha=.09;c.fillStyle='#C4B5FD';
  for(var i=0;i<2600;i++){
    c.beginPath();c.arc(Math.random()*W,Math.random()*H,Math.random()*1.2,0,6.2832);c.fill();
  }
  c.globalAlpha=1;
  var t=new THREE.CanvasTexture(cv);t.wrapS=THREE.RepeatWrapping;t.anisotropy=4;
  return t;
}
var R_ESF=150;   /* LA ESFERA AL CENTRO: los gajos la rodean; su ecuador
                    (y=0) es el plano del dial y de los PROYECTORES */
var esfera=new THREE.Mesh(
  new THREE.SphereGeometry(R_ESF,80,52),
  new THREE.MeshStandardMaterial({map:texturaEsfera(),
    color:0x8A7BD6,emissive:0x120D26,emissiveIntensity:1.0,
    roughness:.78,metalness:.1}));
esfera.position.y=0;mundo.add(esfera);
esfera.renderOrder=0;

/* anillos del dial en el plano del ECUADOR */
var anillos=[];
[168,392,414].forEach(function(r,k){
  var ring=new THREE.Mesh(new THREE.RingGeometry(r-0.9,r+0.9,128),
    new THREE.MeshBasicMaterial({color:0xA78BFA,transparent:true,
      opacity:k?0.10:0.22,side:THREE.DoubleSide,depthWrite:false}));
  ring.rotation.x=-Math.PI/2;ring.position.y=0;ring.renderOrder=1;
  ring.userData.op=k?0.10:0.22;
  mundo.add(ring);anillos.push(ring);
});
/* (los emisores visibles del nivel 1 son las BARRAS de luz bajo cada
   card — CSS; nada de esferas ni conos en la escena) */

/* ── GAJOS con morph (grid) — geometría COMPARTIDA creada UNA vez ── */
var R1=172,R2=372,ANCHO_ANG=2*Math.PI/N-2*0.045;
var CARD_H=250,CARD_W=170,GM=12,GK=20;
function forma(fr,ft,m,out){
  var r=R1+fr*(R2-R1),a=(ft-.5)*ANCHO_ANG;
  var cx=Math.cos(a)*r-R1,cz=Math.sin(a)*r;
  var rx=fr*CARD_H,rz=(ft-.5)*CARD_W;
  out.x=cx+(rx-cx)*m;out.z=cz+(rz-cz)*m;
}
var geoComp=(function(){
  var g=new THREE.BufferGeometry(),nv=(GM+1)*(GK+1);
  var pos=new Float32Array(nv*3),uv=new Float32Array(nv*2),n=0;
  var nrm=new Float32Array(nv*3);
  for(var i=0;i<=GM;i++)for(var j=0;j<=GK;j++){
    uv[n*2]=i/GM;uv[n*2+1]=j/GK;
    nrm[n*3]=0;nrm[n*3+1]=1;nrm[n*3+2]=0;   /* plano XZ: normal arriba
      — SIN esto el shader iluminado produce NaN por píxel (flicker) */
    n++;
  }
  var idxA=[];
  for(var a=0;a<GM;a++)for(var b=0;b<GK;b++){
    var v0=a*(GK+1)+b,v1=v0+1,v2=v0+(GK+1),v3=v2+1;
    idxA.push(v0,v2,v1,v1,v2,v3);
  }
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('normal',new THREE.BufferAttribute(nrm,3));
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  g.setIndex(idxA);
  return g;
})();
var bordeComp=(function(){
  var pts=[],S=14;
  for(var i=0;i<=S;i++)pts.push([i/S,0]);
  for(var j=0;j<=S;j++)pts.push([1,j/S]);
  for(var i2=S;i2>=0;i2--)pts.push([i2/S,1]);
  for(var j2=S;j2>=0;j2--)pts.push([0,j2/S]);
  var g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(pts.length*3),3));
  g.userData.param=pts;
  return g;
})();
var _p={x:0,z:0},_morphCache=-1;
function morfarGajos(m){
  if(Math.abs(m-_morphCache)<1e-4)return;
  _morphCache=m;
  var pos=geoComp.attributes.position,n=0;
  for(var i=0;i<=GM;i++)for(var j=0;j<=GK;j++){
    forma(i/GM,j/GK,m,_p);pos.setXYZ(n++,_p.x,0,_p.z);
  }
  pos.needsUpdate=true;geoComp.computeBoundingSphere();
  var bp=bordeComp.attributes.position,par=bordeComp.userData.param;
  for(var k=0;k<par.length;k++){
    forma(par[k][0],par[k][1],m,_p);bp.setXYZ(k,_p.x,.6,_p.z);
  }
  bp.needsUpdate=true;
}
/* textura estilo dial canónico: gradiente radial oscuro→color'26',
   filo neón exterior */
function texturaGajo(cHex){
  var S=512,cv=document.createElement('canvas');cv.width=cv.height=S;
  var c=cv.getContext('2d');
  var col=new THREE.Color(cHex),rgb=(col.r*255|0)+','+(col.g*255|0)+','+(col.b*255|0);
  var g=c.createLinearGradient(0,0,S,0);
  g.addColorStop(0,'rgba(14,12,26,.85)');
  g.addColorStop(.8,'rgba(15,13,30,.85)');
  g.addColorStop(1,'rgba('+rgb+',.15)');
  c.fillStyle=g;c.fillRect(0,0,S,S);
  c.shadowColor=cHex;c.shadowBlur=14;
  c.fillStyle='rgba('+rgb+',.75)';c.fillRect(S-4,0,4,S);
  c.shadowBlur=0;
  c.fillStyle='rgba('+rgb+',.2)';c.fillRect((S*.62)|0,0,2,S);
  var t=new THREE.CanvasTexture(cv);t.anisotropy=4;return t;
}
var gajoMeshes=[],gajoPivots=[];
SEC.forEach(function(s,i){
  var col=new THREE.Color(s.c);
  var m=new THREE.Mesh(geoComp,new THREE.MeshStandardMaterial({
    map:texturaGajo(s.c),transparent:true,opacity:.95,
    color:0xBFB4E8,emissive:col,emissiveIntensity:.12,
    roughness:.55,metalness:.2,side:THREE.DoubleSide,depthWrite:false}));
  m.userData.i=i;
  m.renderOrder=2+i;                 /* orden de pintado fijo: sin parpadeo */
  var linea=new THREE.LineLoop(bordeComp,
    new THREE.LineBasicMaterial({color:col,transparent:true,opacity:.7}));
  linea.renderOrder=20+i;            /* los bordes también: empate = flicker */
  m.add(linea);
  var piv=new THREE.Group();
  var ang=(i/N)*Math.PI*2;
  piv.rotation.y=-ang;
  piv.position.set(Math.cos(ang)*R1,1.5,Math.sin(ang)*R1);
  piv.add(m);mundo.add(piv);
  gajoMeshes.push(m);gajoPivots.push(piv);
});
function aplicarGajos(){
  morfarGajos(gajos.lift);
  /* POTENCIA DE LUZ: los gajos son proyección — se atenúan al
     absorberse; jamás vuelan frente a la cámara */
  for(var i=0;i<N;i++){
    var m=gajoMeshes[i];
    m.rotation.z=Math.PI/2*gajos.lift;
    var s=.06+.94*gajos.spread;
    m.scale.set(s,1,1);
    m.material.opacity=.95*gajos.spread;
    m.children[0].material.opacity=.7*gajos.spread;
  }
  /* anillos: potencia mínima persistente en cenital (base canon),
     y cero al ponerse de frente (nunca cruzan la vista) */
  var vAng=Math.max(0,Math.min(1,1-cam.look))*Math.max(0,Math.min(1,(cam.alt-260)/300));
  for(var k=0;k<anillos.length;k++){
    anillos[k].material.opacity=
      anillos[k].userData.op*(.25+.75*gajos.spread)*vAng;
  }
}

/* ── luces (ninguna DENTRO de la esfera) ── */
scene.add(new THREE.AmbientLight(0x2A2244,1.45));
var key=new THREE.DirectionalLight(0xC4B5FD,1.25);
key.position.set(520,640,380);scene.add(key);
var rim=new THREE.DirectionalLight(0x7C6BD8,.6);
rim.position.set(-620,-180,-420);scene.add(rim);

/* ── cosmos ── */
(function(){
  function nube(M,color,size,op){
    var geo=new THREE.BufferGeometry(),pos=new Float32Array(M*3);
    for(var i=0;i<M;i++){
      var r=2400+Math.random()*3400,th=Math.random()*6.2832,
          ph=Math.acos(2*Math.random()-1);
      pos[i*3]=r*Math.sin(ph)*Math.cos(th);
      pos[i*3+1]=r*Math.cos(ph)*.6;
      pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
    }
    geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    scene.add(new THREE.Points(geo,new THREE.PointsMaterial({color:color,
      size:size,transparent:true,opacity:op,sizeAttenuation:true,depthWrite:false})));
  }
  nube(900,0xA7B4FA,2.3,.7);
  nube(70,0xFCD377,2.8,.5);
})();

/* ═══ LABELS del dial (anclas proyectadas) + RAW en el casquete ═══ */
var anclasEl=document.getElementById('anclas');
var anclas=[];
SEC.forEach(function(s,i){
  var pt=new THREE.Object3D();
  pt.position.set((R2-R1)/2,10,0);
  gajoMeshes[i].add(pt);
  var lbl=document.createElement('div');
  lbl.className='ancla';
  lbl.innerHTML='<div class="ancla-inner lbl" style="--c:'+s.c+'">'+
    '<div class="ico">'+s.ico+'</div><div class="t">'+s.t+'</div></div>';
  anclasEl.appendChild(lbl);
  anclas.push({pt:pt,lbl:lbl,i:i});
});
var lblRaw=document.createElement('div');
lblRaw.className='ancla';lblRaw.id='lbl-raw';
lblRaw.innerHTML='<div class="ancla-inner lbl"><div class="t">RAW</div></div>';
anclasEl.appendChild(lblRaw);
var ptRaw=new THREE.Object3D();ptRaw.position.set(0,R_ESF+10,0);mundo.add(ptRaw);
var _v=new THREE.Vector3();
function _setSi(el,prop,valor){    /* escribir SOLO si cambió: sin
  repintados por frame (shimmer del glow del texto) */
  if(el._c===undefined)el._c={};
  if(el._c[prop]!==valor){el._c[prop]=valor;el.style[prop]=valor;}
}
function proyectarAnclas(){
  var W=innerWidth,H=innerHeight;
  var visible=(nivel===0&&!document.documentElement.classList.contains('en-anillo'));
  anclas.forEach(function(a){
    a.pt.getWorldPosition(_v);
    var pr=_v.clone().project(camera),detras=pr.z>1;
    var x=Math.round((pr.x*.5+.5)*W*2)/2, y=Math.round((-pr.y*.5+.5)*H*2)/2;
    var esc=Math.round(Math.max(.25,Math.min(1.6,620/camera.position.distanceTo(_v)))*200)/200;
    var o=((1-gajos.lift)*(detras?0:1)*gajos.spread*(visible||enTransicion?1:0)).toFixed(2);
    _setSi(a.lbl,'transform','translate('+x+'px,'+y+'px) scale('+esc+')');
    _setSi(a.lbl,'opacity',o);
  });
  ptRaw.getWorldPosition(_v);
  var pr2=_v.clone().project(camera);
  _setSi(lblRaw,'transform','translate('+(Math.round((pr2.x*.5+.5)*W*2)/2)+'px,'+
    (Math.round((-pr2.y*.5+.5)*H*2)/2)+'px)');
  _setSi(lblRaw,'opacity',(visible&&!enTransicion&&pr2.z<=1)?'1':'0');
}

/* ═══ cámara Three (sin yaw; giroMundo rota la esfera+dial = _esfG) ═══ */
function aplicarCamara(){
  mundo.rotation.y=giroMundo*Math.PI/180;
  camera.position.set(0,cam.alt,0);           /* fija en el eje polar */
  /* mirada: de casi-abajo a horizonte con leve caída; el sesgo -0.06
     evita la singularidad de mirar exactamente en contra del up */
  var k=cam.look;
  var dy=-1+0.82*k, dz=-0.01-0.99*k;
  camera.lookAt(0, cam.alt+dy*100, dz*100);
}

/* ═══ CARRUSEL CSS (nivel 1) — colocar() DEL PROTO, literal ═══ */
var mundoCSS=document.getElementById('mundoCSS');
var nodos=[];
SEC.forEach(function(s,i){
  var n=document.createElement('div');
  n.className='nodo';
  n.style.setProperty('--c',s.c);
  n.innerHTML='<div class="lift"><div class="barra"></div>'+
    '<div class="card"><div class="ico">'+s.ico+'</div>'+
    '<div class="t">'+s.t+'</div><div class="s">'+s.s+'</div>'+
    '<div class="div"></div>'+
    '<div class="m"><span>REGISTROS</span><b>—</b></div>'+
    '<div class="m"><span>ÚLTIMO</span><b>—</b></div>'+
    '<div class="m"><span>SYNC</span><b>OK</b></div></div></div>';
  n.addEventListener('click',function(){
    if(enTransicion)return;
    if(nivel===1){if(i===idx)irNivel(2);else girarA(i)}
  });
  mundoCSS.appendChild(n);nodos.push(n);
});
function colocar(){
  for(var i=0;i<N;i++){
    var rel=((i-idx)%N+N)%N;
    if(rel>N/2)rel-=N;
    /* LOOP CONTINUO: si el nodo "da la vuelta" (salta de un extremo
       al otro), se recoloca SIN transición — jamás viaja por el
       frente. El círculo no tiene final. */
    var prev=nodos[i]._rel;
    var envuelve=(prev!==undefined&&Math.abs(rel-prev)>N/2);
    nodos[i]._rel=rel;
    if(envuelve)nodos[i].style.transition='none';
    /* ángulo NEGATIVO: rotateY(+θ)+translateZ(-R) cae a la izquierda,
       así que derecha=+rel requiere -θ. Las ±2 usan paso comprimido
       para asomarse ~20% en el borde (5 cards visibles). */
    var mag=Math.min(Math.abs(rel),1)+Math.max(0,Math.abs(rel)-1)*.72;
    var angC=-Math.sign(rel)*mag*PASO;
    nodos[i].style.transform=
      'rotateY('+angC+'deg) translateZ(-'+RADIO+'px)';
    nodos[i].style.setProperty('--dly',(Math.abs(rel)*90)+'ms');
    nodos[i].classList.toggle('lejana',Math.abs(rel)>=2);
    nodos[i].style.opacity=
      document.documentElement.classList.contains('en-anillo')
        ?(Math.abs(rel)>=3?0:Math.abs(rel)===2?0.5:1):'';
    if(envuelve){void nodos[i].offsetWidth;nodos[i].style.transition='';}
  }
}
function _expandir(i){
  for(var k=0;k<N;k++)nodos[k].classList.toggle('expandida',k===i);
}
function lados(){
  var iz=SEC[(idx-1+N)%N],de=SEC[(idx+1)%N];
  var eIz=document.getElementById('sec-izq'),eDe=document.getElementById('sec-der');
  eIz.innerHTML='<span class="fl">◀</span> '+iz.t;
  eDe.innerHTML=de.t+' <span class="fl">▶</span>';
  eIz.style.setProperty('--lc',iz.c);
  eDe.style.setProperty('--lc',de.c);
}
document.getElementById('sec-izq').addEventListener('click',function(){girarA((idx-1+N)%N)});
document.getElementById('sec-der').addEventListener('click',function(){girarA((idx+1)%N)});

/* ═══ GIRAR (canon): cámara quieta; cards se recolocan; la esfera
   gira delta*16° (su iluminación cambia de verdad) ═══ */
function girarA(i){
  if(enTransicion&&nivel!==2&&nivel!==1)return;
  var delta=i-idx;idx=i;
  colocar();
  var g0=giroMundo,g1=giroMundo+delta*16;
  tween(760,function(p){giroMundo=g0+(g1-g0)*p});
  if(nivel===2){
    _expandir(idx);
    var sc2=SEC[idx],pn=document.querySelector('#seccion .panel');
    pn.style.setProperty('--dir',(delta>0?'14px':'-14px'));
    pn.classList.remove('recal');void pn.offsetWidth;pn.classList.add('recal');
    tween(200,function(){},function(){
      document.getElementById('sec-t').textContent=sc2.t;
      pn.style.setProperty('--sc',sc2.c);
      lados();
    });
  }
  estado();
}

/* ═══ NIVELES — timelines paramétricas con umbrales (sin setTimeout) ═══ */
function irNivel(n){
  n=Math.max(0,Math.min(2,n));
  if(n===nivel||enTransicion)return;
  var h=document.documentElement;

  /* 0→1: zoom recto (gajos absorbidos) → giro EN el punto →
     mesh morfa y SE APAGA → cards CSS holoIn (canon) */
  if(nivel===0&&n===1){
    enTransicion=true;nivel=1;h.classList.add('oculta-hud');
    colocar();
    var a0=cam.alt,disparado=false;
    tween(2400,function(e,pRaw){
            /* absorción del dial: 750ms — EXACTO el tiempo del holoIn
         de las cards (metan y salgan al mismo ritmo) */
      var fA=easeFirma(fase(pRaw,0,.3125));
      gajos.spread=1-fA;
      /* el descenso empalma cuando la absorción va terminando */
      cam.alt=a0+(172-a0)*easeFirma(fase(pRaw,.10,.55));
      cam.look=easeFirma(fase(pRaw,.36,.60));
      if(!disparado&&pRaw>=.58){disparado=true;
        h.classList.add('en-anillo');colocar()}
    },function(){enTransicion=false;estado()});
  }
  /* 1→0: espejo canon — holoOut → cenital → alejarse+despliegue */
  if(nivel===1&&n===0){
    enTransicion=true;nivel=0;
    h.classList.add('holo-out');                    /* cards se apagan hacia su barra */
    var quitado=false;
    tween(2400,function(e,pRaw){
      /* reversa exacta: 1) cards se apagan COMPLETAS (su animación
         termina en opacidad 0 congelada) · 2) la mirada rota a cenital
         EN el punto · 3) ascenso recto — solapados como la entrada */
      /* fase 1 (0–.45): SOLO el apagado — cámara congelada hasta que
         el último holograma (card+respaldo+barra) se haya ido */
      cam.look=1-easeFirma(fase(pRaw,.46,.80));
      /* despegue en dos tiempos: te ELEVAS suave mientras giras
         (como pararte) y luego el lanzamiento — sin latigazo */
      cam.alt=172+88*easeFirma(fase(pRaw,.46,.78));
      var fL=easeFirma(fase(pRaw,.72,1));
      if(fL>0)cam.alt=260+(1500-260)*fL;
      if(!quitado&&pRaw>=.47){quitado=true;
        /* switch INVISIBLE: los nodos quedan en 0 sin transición antes
           de soltar las clases — cero fantasmas sobre el regreso */
        for(var q=0;q<N;q++){nodos[q].style.transition='none';
          nodos[q].style.opacity='0'}
        h.classList.remove('en-anillo','holo-out');
        void mundoCSS.offsetWidth;
        for(var q2=0;q2<N;q2++)nodos[q2].style.transition='';
        colocar()}
    },function(){
      /* …y se ENCADENA: el despliegue centrífugo (750ms, mismo ritmo
         que las cards) dispara SOLO cuando el zoom out terminó */
      tween(750,function(e2){gajos.spread=e2;},
        function(){enTransicion=false;h.classList.remove('oculta-hud');estado()});
    });
  }
  /* 1→2: gesto de la card + despliegue de la sección (canon) */
  if(nivel===1&&n===2){
    enTransicion=true;nivel=2;
    _expandir(idx);
    var sc=SEC[idx];
    document.getElementById('sec-t').textContent=sc.t;
    document.querySelector('#seccion .panel').style.setProperty('--sc',sc.c);
    lados();
    tween(300,function(){},function(){
      h.classList.add('en-exp');enTransicion=false;estado()});
    estado();
  }
  /* 2→1: repliegue con flicker (canon) */
  if(nivel===2&&n===1){
    enTransicion=true;nivel=1;
    h.classList.remove('en-exp');h.classList.add('sec-out');
    tween(560,function(e,pRaw){
      if(pRaw>=.45)_expandir(null);   /* la card recibe: des-expande suave */
    },function(){h.classList.remove('sec-out');enTransicion=false;estado()});
    estado();
  }
  estado();
}

/* ═══ entradas ═══ */
var _wheelLock=0;
addEventListener('wheel',function(e){
  var t=Date.now();if(t-_wheelLock<600||enTransicion)return;_wheelLock=t;
  irNivel(nivel+(e.deltaY>0?1:-1));
},{passive:true});
addEventListener('keydown',function(e){
  if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].indexOf(e.key)>=0)e.preventDefault();
  if(enTransicion)return;
  if(e.key==='ArrowDown'){irNivel(nivel+1);return}
  if(e.key==='ArrowUp'||e.key==='Escape'){irNivel(nivel-1);return}
  if(nivel>=1&&e.key==='ArrowRight'){girarA((idx+1)%N)}
  if(nivel>=1&&e.key==='ArrowLeft'){girarA((idx-1+N)%N)}
},{passive:false});
/* clic en gajo (nivel 0): SOLO girarA — canon (sub-anillos van en v10 real) */
var ray=new THREE.Raycaster(),ptr=new THREE.Vector2();
addEventListener('click',function(e){
  if(nivel!==0||enTransicion)return;
  ptr.x=(e.clientX/innerWidth)*2-1;ptr.y=-(e.clientY/innerHeight)*2+1;
  ray.setFromCamera(ptr,camera);
  var hit=ray.intersectObjects(gajoMeshes,false);
  if(hit.length){girarA(hit[0].object.userData.i)}
});
function estado(){
  var nombres=['ÓRBITA · DIAL','ANILLO · '+SEC[idx].t,'INMERSIÓN · '+SEC[idx].t];
  document.getElementById('estado').textContent='NIVEL '+nivel+' · '+nombres[nivel];
  document.getElementById('hint').textContent=nivel===0
    ?'[RUEDA/↓] SUMERGIR · [CLIC] SECTOR'
    :nivel===1?'[←/→] GIRAR · [CLIC/↓] ENTRAR · [↑] EMERGER'
    :'[ESC/↑] EMERGER · [←/→] SECTOR';
}
addEventListener('resize',function(){
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
});

/* ═══ loop ═══ */
var _fpsN=0,_fpsT=performance.now();
morfarGajos(0);colocar();
(function loop(now){
  correrTweens(now);
  aplicarGajos();
  aplicarCamara();
  renderer.render(scene,camera);
  proyectarAnclas();
  _fpsN++;
  if(now-_fpsT>1000){
    document.getElementById('fps').textContent=_fpsN+' fps · '+
      renderer.info.render.triangles+' tris';
    _fpsN=0;_fpsT=now;
  }
  requestAnimationFrame(loop);
})(performance.now());
estado();


/* ═══════════════════════════════════════════════════════════════════
   LifeOS v11.0 — INTEGRACIÓN (apéndice; el motor de arriba es
   byte-idéntico al proto canónico v10 CAPA 0d).
   MODO DUAL:
   · APP REAL (index.html): detecta _OS_SECCIONES → usa api/calculadoras
     existentes de raw-core/raw-overlay, envuelve _osMostrar (home =
     motor, sin dial viejo) y desvía bitácora/activity a sus boards
     reales con formularios.
   · STANDALONE (index-v11.html): api/calcs vienen de raw-escena-api.js.
   Reglas: api.getX SIN envolver · motor SIN editar · hooks por fuera.
   ═══════════════════════════════════════════════════════════════════ */
var APP_REAL = (typeof window._OS_SECCIONES !== 'undefined');
if(APP_REAL) document.documentElement.classList.add('app-real');

/* ═══ BOOT (solo si existe el nodo — standalone; la app real ya
   tiene su loading en raw-loading.js) ═══ */
(function(){
  var b=document.getElementById('boot');
  if(!b) return;
  var braille=['⠋','⠙','⠹','⠸','⠼','⠴','⠦','⠧','⠇','⠏'];
  var el=document.getElementById('boot-spin'),k=0;
  var iv=setInterval(function(){el.textContent=braille[k++%braille.length]},70);
  var lineas=['INICIALIZANDO ESCENA','PROYECTANDO DIAL','ENLAZANDO HOLOGRAMAS'];
  var lEl=document.getElementById('boot-linea'),lk=0;
  var ivL=setInterval(function(){lk++;if(lk<lineas.length)lEl.textContent=lineas[lk]},520);
  var t0=performance.now();
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    var falta=Math.max(0,1400-(performance.now()-t0));
    setTimeout(function(){
      b.classList.add('off');clearInterval(iv);clearInterval(ivL);
      setTimeout(function(){if(b.parentNode)b.parentNode.removeChild(b)},600);
    },falta);
  })});
})();

/* ═══ COUNT-UP (patrón v8-v9) ═══ */
function _fmtNum(v){return Math.round(v).toLocaleString('es-MX')}
function _fmtMXN(v){return '$' + Math.round(v).toLocaleString('es-MX')}
function _esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function countUpTexto(el,target,fmt,sufijo){
  if(!el)return;fmt=fmt||_fmtNum;sufijo=sufijo||'';
  if(!isFinite(target)){el.textContent='—';return}
  tween(900,function(e){el.textContent=fmt(target*e)+sufijo});
}

function _distribuirGetAll(d){
  if(d.activityCheck) window._actData          = d.activityCheck;
  if(d.logros)        window._logrosData        = d.logros;
  if(d.pensamientos)  window._pensamientosData  = d.pensamientos;
  if(d.relaciones)    window._relacionesData    = d.relaciones;
  if(d.salud)         window._saludData         = d.salud;
  window._capa1Data = d;
}

/* ═══ CHIPS HUD — misma info del HOME v9 (calculadoras originales) ═══ */
function poblarChips(){
  if(typeof _calcXPNivel!=='function')return;   /* aún no cargan los módulos */
  var x=_calcXPNivel(),rc=_calcRachaCreditos(),mi=_calcMisionDiaria(),
      lg=_calcLogroReciente(),ns=_calcNivelSiguiente(),needs=_calcSimsNeeds();
  var userL=document.getElementById('chip-user-l');
  if(userL)userL.textContent='USER · Nv '+x.nivel;
  var userV=document.getElementById('chip-user');
  if(userV)countUpTexto(userV,x.xpActual,_fmtNum,' / '+_fmtNum(x.xpMeta)+' XP');
  var keys=Object.keys(needs),act=0,suma=0;
  keys.forEach(function(k){suma+=needs[k];if(needs[k]>0)act++});
  var prom=Math.round(suma/keys.length);
  var simV=document.getElementById('chip-sim');
  if(simV)simV.textContent=act+'/'+keys.length+' needs · '+(prom<30?'LOW':'OK');
  var ercV=document.getElementById('chip-erc');
  if(ercV)countUpTexto(ercV,rc.creditos,function(v){
    return rc.energia+' · '+rc.racha+'d · '+_fmtNum(v)});
  var nivV=document.getElementById('chip-nivel');
  if(nivV)countUpTexto(nivV,x.xpActual,function(v){
    return x.nivel+' · '+_fmtNum(v)+'/'+_fmtNum(x.xpMeta)});
  var misV=document.getElementById('chip-mision');
  if(misV)misV.textContent=mi.hechos+' / '+mi.total;
  var logV=document.getElementById('chip-logro');
  if(logV){var t=lg.titulo||'—';if(t.length>18)t=t.slice(0,17)+'…';
    logV.textContent=t+(lg.avance?' · '+lg.avance+'%':'')}
  var sigV=document.getElementById('chip-signivel');
  if(sigV)countUpTexto(sigV,ns.xpFalta,function(v){return '+'+_fmtNum(v)+' XP'});
}

/* ═══ CARDS + GAJOS CON ESTADO ═══ */
function _metricasSector(d){
  var m={};
  try{var p=d.patrimonio||{};var pi=((p.banco&&p.banco.items)||[]).length+
    ((p.fisico&&p.fisico.items)||[]).length+((p.inversion&&p.inversion.items)||[]).length;
    m.patrimonio={reg:pi,ult:_fmtMXN(p.total||0),n:pi};}catch(e){}
  try{var f=(d.financieroAvanzado&&d.financieroAvanzado.metricas)||{};
    var meses=((d.datosMes&&d.datosMes.meses)||[]).length;
    m.financiero={reg:meses,ult:_fmtMXN(f.saldoActual||0),n:meses};}catch(e){}
  try{var gr=(d.gastos&&d.gastos.grupos)||[];var gi=0,ultF='—';
    gr.forEach(function(g){(g.items||[]).forEach(function(it){gi++;if(it.fecha)ultF=it.fecha})});
    m.variables={reg:gi,ult:ultF,n:gi};}catch(e){}
  try{var fj=d.fijos||[];var tot=0;
    fj.forEach(function(x){tot+=(typeof x.monto==='number'?x.monto:0)});
    m.fijos={reg:fj.length,ult:_fmtMXN(tot),n:fj.length};}catch(e){}
  try{var nv=(d.necesidades&&d.necesidades.niveles)||[];
    m.necesidades={reg:nv.length,ult:String((d.necesidades&&d.necesidades.periodo)||'—').slice(0,14),n:nv.length};}catch(e){}
  try{var pe=(d.pensamientos&&d.pensamientos.items)||[];
    m.bitacora={reg:pe.length,ult:(pe[0]&&String(pe[0].fecha||'—').slice(0,10))||'—',n:pe.length};}catch(e){}
  try{var a=d.activityCheck||{};var hp=(a.habitosPersonal||[]),he=(a.habitosElectronics||[]);
    var diaKey=['L','M','W','J','V','S','D'][(new Date().getDay()+6)%7];
    var hoy=hp.concat(he).filter(function(h){return h.checks&&h.checks[diaKey]}).length;
    m.activity={reg:hp.length+he.length,ult:hoy+' hoy',n:hp.length+he.length};}catch(e){}
  return m;
}
function poblarCards(d){
  var mets=_metricasSector(d);
  var maxN=1;SEC.forEach(function(s){var mm=mets[s.id];if(mm&&mm.n>maxN)maxN=mm.n});
  var intens=[];
  SEC.forEach(function(s,i){
    var mm=mets[s.id];
    var bs=nodos[i].querySelectorAll('.card .m b');
    if(bs.length>=3){
      if(mm){countUpTexto(bs[0],mm.reg);bs[1].textContent=mm.ult;bs[2].textContent='OK';}
      else{bs[0].textContent='—';bs[1].textContent='—';bs[2].textContent='—';}
    }
    intens.push(mm?Math.min(1,mm.n/maxN):0);
  });
  for(var i=0;i<N;i++){   /* escritura ÚNICA, no por frame */
    gajoMeshes[i].material.emissiveIntensity=.12+.26*intens[i];
    gajoMeshes[i].children[0].material.opacity=.55+.35*intens[i];
  }
}
function _marcarSync(txt){
  nodos.forEach(function(n){var bs=n.querySelectorAll('.card .m b');
    if(bs.length>=3)bs[2].textContent=txt});
}

/* ═══ SECCIONES v11 en el panel del motor (sectores SIN board real) ═══ */
var DIAS7=['L','M','W','J','V','S','D'];
function _r11Filas(html){return html||'<div class="v11-vacio">SIN REGISTROS</div>'}
var _v11Render={
  bitacora:function(d){
    var it=((d.pensamientos||{}).items)||[];
    return _r11Filas(it.map(function(p){
      return '<div class="v11-fila"><span class="fecha">'+_esc(String(p.fecha||'').slice(0,10))+'</span>'+
        '<span class="txt">'+_esc(p.texto)+'</span>'+
        (p.categoria?'<span class="tag">'+_esc(p.categoria)+'</span>':'')+
        (p.energia!=null?'<span class="num">'+p.energia+'</span>':'')+'</div>';
    }).join(''));
  },
  activity:function(d){
    var a=d.activityCheck||{};
    function tabla(arr,dias){
      return arr.map(function(h){
        var dots=dias.map(function(dk){
          return '<span class="v11-dot'+(h.checks&&h.checks[dk]?' on':'')+'">'+dk+'</span>'}).join('');
        return '<div class="v11-fila"><span class="txt">'+_esc(h.nombre)+'</span>'+
          '<span class="v11-checks">'+dots+'</span></div>';
      }).join('');
    }
    return '<div class="v11-sub">HÁBITOS PERSONALES · SEMANA</div>'+_r11Filas(tabla(a.habitosPersonal||[],DIAS7))+
      '<div class="v11-sub">ELECTRONICS · L–V</div>'+_r11Filas(tabla(a.habitosElectronics||[],['L','M','W','J','V']));
  },
  patrimonio:function(d){
    var p=d.patrimonio||{};
    function kpi(l,v,s){return '<div class="v11-kpi"><div class="l">'+l+'</div><div class="v">'+v+'</div>'+(s?'<div class="s">'+s+'</div>':'')+'</div>'}
    var f=p.fondo||{};
    return '<div class="v11-grid">'+
      kpi('TOTAL',_fmtMXN(p.total||0))+
      kpi('BANCO',_fmtMXN((p.banco||{}).saldo||0),((p.banco||{}).pct||0)+'%')+
      kpi('FÍSICO',_fmtMXN((p.fisico||{}).saldo||0),((p.fisico||{}).pct||0)+'%')+
      kpi('INVERSIÓN',_fmtMXN((p.inversion||{}).saldo||0),'rend. '+_fmtMXN((p.inversion||{}).rendimientoTotal||0))+
      kpi('FONDO EMERGENCIA',(f.avance||0)+'%',(f.meses||0)+' meses · '+_esc(f.salud||''))+
      '</div>'+
      '<div class="v11-sub">CUENTAS</div>'+
      _r11Filas((((p.banco||{}).items)||[]).concat(((p.fisico||{}).items)||[]).map(function(it){
        return '<div class="v11-fila"><span class="txt">'+_esc(it.nombre||it.concepto||'—')+'</span>'+
          '<span class="num">'+_fmtMXN(it.monto||it.saldo||0)+'</span></div>';}).join(''));
  },
  financiero:function(d){
    var f=d.financieroAvanzado||{};var h=f.hoy||{},s=f.semana||{},m=f.mes||{},mt=f.metricas||{};
    function kpi(l,v,ss){return '<div class="v11-kpi"><div class="l">'+l+'</div><div class="v">'+v+'</div>'+(ss?'<div class="s">'+ss+'</div>':'')+'</div>'}
    return '<div class="v11-grid">'+
      kpi('SALDO ACTUAL',_fmtMXN(mt.saldoActual||0))+
      kpi('HOY',_fmtMXN(h.balance||0),'+'+_fmtMXN(h.ingresos||0)+' / -'+_fmtMXN(h.egresos||0))+
      kpi('SEMANA',_fmtMXN(s.balance||0),'+'+_fmtMXN(s.ingresos||0)+' / -'+_fmtMXN(s.egresos||0))+
      kpi('MES',_fmtMXN(m.excedente||0),'+'+_fmtMXN(m.ingresos||0)+' / -'+_fmtMXN(m.egresos||0))+
      kpi('RUNWAY',(mt.runwayDias!=null?mt.runwayDias+' días':'—'),'gasto/día '+_fmtMXN(mt.gastoPorDiaPromedio||0))+
      kpi('AHORRO',(mt.porcentajeAhorro!=null?mt.porcentajeAhorro+'%':'—'),
        (m.proyeccion?'proy. excedente '+_fmtMXN(m.proyeccion.excedente||0):''))+
      '</div>';
  },
  variables:function(d){
    var gr=((d.gastos||{}).grupos)||[];
    return _r11Filas(gr.map(function(g){
      return '<div class="v11-sub">'+_esc(g.concepto)+'</div>'+
        (g.items||[]).map(function(it){
          return '<div class="v11-fila"><span class="txt">'+_esc(it.clave)+'</span>'+
            '<span class="fecha">'+_esc(it.fecha||'')+'</span>'+
            '<span class="tag">'+_esc(it.pagado||'')+'</span>'+
            '<span class="num">'+(it.monto!=null?_fmtMXN(it.monto):'—')+'</span></div>';
        }).join('');
    }).join(''));
  },
  fijos:function(d){
    var fj=d.fijos||[];
    return _r11Filas(fj.map(function(x){
      return '<div class="v11-fila"><span class="txt">'+_esc(x.nombre)+'</span>'+
        '<span class="fecha">'+_esc(x.fecha||'')+'</span>'+
        '<span class="num">'+(typeof x.monto==='number'?_fmtMXN(x.monto):'—')+'</span></div>';
    }).join(''));
  },
  necesidades:function(d){
    var ne=d.necesidades||{};var nv=ne.niveles||[];
    function kpi(l,v,s){return '<div class="v11-kpi"><div class="l">'+l+'</div><div class="v">'+v+'</div>'+(s?'<div class="s">'+s+'</div>':'')+'</div>'}
    return (ne.periodo?'<div class="v11-sub">PERIODO · '+_esc(ne.periodo)+'</div>':'')+
      '<div class="v11-grid">'+nv.map(function(n){
        return kpi('NIVEL '+_esc(n.key),_fmtMXN(n.total||0),
          ((n.conceptos||[]).length)+' conceptos')}).join('')+'</div>';
  }
};
function _v11RenderSeccion(i){
  var cu=document.getElementById('sec-cuerpo');
  if(!cu)return;
  var d=window._capa1Data;
  if(!d){cu.innerHTML='<div class="v11-vacio">SINCRONIZANDO…</div>';return}
  var fn=_v11Render[SEC[i].id];
  cu.innerHTML=fn?fn(d):'<div class="v11-vacio">SECCIÓN EN CONSTRUCCIÓN</div>';
  cu.scrollTop=0;
}

/* ═══ HOOKS — extienden por FUERA; el motor queda intacto ═══ */
/* Sectores con board REAL en la app (formularios completos) */
var _V11_BOARDS = { bitacora:'bitacora', activity:'activity' };
function _v11BoardAbierto(){
  return document.documentElement.classList.contains('os-seccion');
}
(function(){
  var _irNivelMotor=irNivel,_girarAMotor=girarA;
  irNivel=function(n){
    if(APP_REAL&&_v11BoardAbierto())return;      /* board real abierto: motor en pausa */
    if(APP_REAL&&n===2&&nivel===1&&_V11_BOARDS[SEC[idx].id]){
      _osMostrar(_V11_BOARDS[SEC[idx].id]);      /* desviar a la sección REAL */
      return;
    }
    var prev=nivel;
    _irNivelMotor(n);
    if(nivel===2&&prev!==2)_v11RenderSeccion(idx);
  };
  girarA=function(i){
    if(APP_REAL&&_v11BoardAbierto())return;
    _girarAMotor(i);
    if(nivel===2)tween(200,function(){},function(){_v11RenderSeccion(idx)});
  };
})();

/* ═══ APP REAL: home = motor (el dial viejo NO se abre) ═══ */
if(APP_REAL)(function(){
  var _osMostrarBase=_osMostrar;
  _osMostrar=function(seccion){
    if(!_OS_SECCIONES[seccion])seccion='home';
    if(seccion==='home'){
      /* rutina home SIN abrirDial: boards fuera, clases, tabs — y el
         motor recibe el control (regresa al anillo si venías de board) */
      window._osSeccion='home';
      document.documentElement.classList.remove('os-seccion');
      document.querySelectorAll('.board-face:not(.anverso)').forEach(function(f){
        f.classList.remove('active')});
      var b=document.getElementById('board-anverso');
      if(b)b.classList.add('slide-right');
      document.documentElement.classList.remove('niv-1','niv-2','niv-warp');
      document.documentElement.classList.add('niv-0');
      if(typeof _osMarcarTabs==='function')_osMarcarTabs('home');
      var dd=document.getElementById('entrada-dropdown');
      if(dd){dd.classList.remove('show');dd.style.display='none';}
      if(typeof nivel!=='undefined'&&nivel===2)irNivel(1);
      return;
    }
    _osMostrarBase(seccion);   /* secciones reales tal cual (dial jamás visible → cerrarDial no corre) */
  };
  window._osMostrar=_osMostrar;
  /* Teclas: con un board real abierto, el motor NO debe comerse las
     flechas (inputs/textareas) ni Escape. Captura antes que el motor. */
  window.addEventListener('keydown',function(e){
    if(!_v11BoardAbierto())return;
    if(['ArrowDown','ArrowUp','ArrowLeft','ArrowRight','Escape'].indexOf(e.key)<0)return;
    e.stopPropagation();                          /* el listener del motor no lo ve */
    if(e.key==='Escape'&&!(e.target&&/input|textarea|select/i.test(e.target.tagName))){
      _osMostrar('home');
    }
  },true);
})();

/* ═══ ARRANQUE: getAll directa (el cache del servidor absorbe la doble
   llamada con el refreshTodo de la app; ~200ms en cache-hit) ═══ */
function cargarDatosCapa1(){
  api.getAll().then(function(d){
    if(!d||d.ok===false){_marcarSync('ERR');console.error('getAll:',d&&d.error);return}
    _distribuirGetAll(d);
    poblarChips();
    poblarCards(d);
    if(nivel===2)_v11RenderSeccion(idx);
  }).catch(function(e){_marcarSync('ERR');console.error('getAll falló:',e)});
}
window.refrescarCapa1=cargarDatosCapa1;
cargarDatosCapa1();
