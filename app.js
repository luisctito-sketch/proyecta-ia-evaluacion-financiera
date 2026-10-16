
const $ = id => document.getElementById(id);
const clean = s => (s ?? "").toString().replace(/\s+/g," ").trim();
const norm = s => clean(s).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const esc = s => (s ?? "").toString().replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
function parseNum(s){if(s===null||s===undefined||clean(s)==="")return NaN;return Number(String(s).trim().replace(/\./g,"").replace(",","."));}
function money(n){return Number(n||0).toLocaleString("es-BO",{minimumFractionDigits:2,maximumFractionDigits:2});}
function pct(n,d=2){return Number(n||0).toLocaleString("es-BO",{minimumFractionDigits:d,maximumFractionDigits:d})+" %";}
function show(el,cls,html){el.className=`output-box ${cls}`;el.innerHTML=html;el.classList.remove("hidden");}
function hasAny(t,a){const n=norm(t);return a.some(x=>n.includes(norm(x)));}
function firstPerson(t){return t.match(/\b(yo|nosotros|nosotras|calculamos|proyectamos|estimamos|obtenemos|consideramos|evaluamos|utilizamos|nuestro|nuestra)\b/gi)||[];}

const indicators=[
 {id:"van",name:"VAN",main:true,desc:"Valor creado por encima de la TMAR. Criterio: VAN > 0."},
 {id:"tir",name:"TIR",main:true,desc:"Tasa que hace VAN=0. Criterio: TIR > TMAR."},
 {id:"trc",name:"TRC / PRI",main:true,desc:"Tiempo simple de recuperación de la inversión."},
 {id:"dtrc",name:"TRC descontado",main:false,desc:"Recuperación considerando valor del dinero en el tiempo."},
 {id:"bc",name:"B/C",main:false,desc:"VP de beneficios por unidad de VP de costos. Criterio: >1."},
 {id:"roi",name:"ROI",main:false,desc:"Beneficio neto acumulado respecto a la inversión inicial."},
 {id:"tirm",name:"TIRM",main:false,desc:"TIR modificada con tasas de financiamiento/reinversión."},
 {id:"pi",name:"PI",main:false,desc:"VP de flujos futuros netos / inversión inicial. Criterio: >1."},
 {id:"vae",name:"VAE",main:false,desc:"VAN expresado como valor anual equivalente."}
];
$("indicatorSelector").innerHTML=indicators.map(i=>`<label class="fin-indicator ${i.main?"main":""}">
<input type="checkbox" class="ind-check" value="${i.id}" ${i.main?"checked":""}>
<span><b>${i.name}${i.main?'<span class="fin-chip">PRINCIPAL</span>':""}</b><small>${i.desc}</small></span></label>`).join("");

$("loadArteNaturaBtn").addEventListener("click",()=>{
 $("initialInvestment").value="23997";
 $("workingCapital").value="3000";
 $("lifeYears").value="5";
 $("discountRate").value="12";
 $("benefitsYear1").value="13500";
 $("costsYear1").value="3800";
 $("benefitGrowth").value="4";
 $("costGrowth").value="3";
 $("taxRate").value="25";
 $("depreciableBase").value="20997";
 $("residualValue").value="4199.40";
 $("recoverWorkingCapital").value="yes";
 $("assumptionSources").value="Valores didácticos del ejemplo ArteNatura; deben sustituirse por información real del proyecto.";
});

$("useTelecomBtn").addEventListener("click",()=>{
 const n=parseNum($("subscribers").value),tar=parseNum($("monthlyTariff").value),m=parseNum($("serviceMonths").value),cv=parseNum($("variableCostPerUser").value)||0;
 if(![n,tar,m].every(Number.isFinite)||n<0||tar<0||m<=0){show($("telecomOutput"),"bad","Completa abonados, tarifa y meses.");return;}
 const rev=n*tar*m, varCost=n*cv;
 $("benefitsYear1").value=rev.toFixed(2);
 if(varCost>0) $("costsYear1").value=varCost.toFixed(2);
 show($("telecomOutput"),"ok",`<h4>Año 1 calculado desde servicios</h4>
 <p><b>Ingresos/beneficios:</b> ${money(n)} servicios × Bs ${money(tar)} × ${money(m)} meses = <b>Bs ${money(rev)}</b>.</p>
 <p><b>Costo variable anual asociado:</b> Bs ${money(varCost)}${varCost>0?" (copiado a costos año 1)":""}.</p>
 <p class="small">Añade también OPEX fijos: energía, arrendamientos, backhaul, mantenimiento, personal, soporte, licencias u otros que correspondan.</p>`);
});

function inputs(overrides={}){
 const obj={
   I0:parseNum($("initialInvestment").value),
   wc:parseNum($("workingCapital").value)||0,
   n:parseInt($("lifeYears").value||"0",10),
   rate:parseNum($("discountRate").value)/100,
   b1:parseNum($("benefitsYear1").value),
   c1:parseNum($("costsYear1").value),
   gb:parseNum($("benefitGrowth").value)/100,
   gc:parseNum($("costGrowth").value)/100,
   tax:parseNum($("taxRate").value)/100,
   depBase:parseNum($("depreciableBase").value)||0,
   residual:parseNum($("residualValue").value)||0,
   recoverWC:$("recoverWorkingCapital").value==="yes"
 };
 return Object.assign(obj,overrides);
}
function validate(d){
 if(!Number.isFinite(d.I0)||d.I0<=0)return "Ingresa una inversión inicial mayor que cero.";
 if(!Number.isFinite(d.n)||d.n<1)return "Ingresa una vida económica válida.";
 if(!Number.isFinite(d.rate)||d.rate<=-1)return "Ingresa una TMAR/tasa de descuento válida.";
 if(!Number.isFinite(d.b1)||d.b1<0)return "Ingresa beneficios/ingresos del año 1.";
 if(!Number.isFinite(d.c1)||d.c1<0)return "Ingresa costos/gastos del año 1.";
 return "";
}
function buildFlow(d){
 const dep = d.depBase>0 ? Math.max(0,(d.depBase-d.residual)/d.n) : 0;
 let rows=[{
   year:0,benefit:0,cost:0,dep:0,taxable:0,tax:0,netIncome:0,
   residualWC:0,netCF:-d.I0,discounted:-d.I0,cum:-d.I0,cumDisc:-d.I0
 }];
 let cum=-d.I0,cumD=-d.I0;
 for(let t=1;t<=d.n;t++){
   const benefit=d.b1*Math.pow(1+d.gb,t-1);
   const cost=d.c1*Math.pow(1+d.gc,t-1);
   const taxable=benefit-cost-dep;
   const tax=Math.max(0,taxable*d.tax);
   const netIncome=taxable-tax;
   const residualWC=t===d.n ? d.residual+(d.recoverWC?d.wc:0) : 0;
   const netCF=netIncome+dep+residualWC;
   const discounted=netCF/Math.pow(1+d.rate,t);
   cum+=netCF; cumD+=discounted;
   rows.push({year:t,benefit,cost,dep,taxable,tax,netIncome,residualWC,netCF,discounted,cum,cumDisc:cumD});
 }
 return rows;
}
function npv(rate,flows){return flows.reduce((s,f,t)=>s+f/Math.pow(1+rate,t),0);}
function signChanges(flows){
 let last=0,c=0;
 for(const f of flows){const s=f>0?1:f<0?-1:0;if(s&&last&&s!==last)c++;if(s)last=s;}
 return c;
}
function irr(flows){
 if(signChanges(flows)===0)return NaN;
 const f=r=>npv(r,flows);
 let lo=-0.9999, hi=1, flo=f(lo), fhi=f(hi), tries=0;
 while(flo*fhi>0 && hi<1e6 && tries<80){hi*=2;fhi=f(hi);tries++;}
 if(!Number.isFinite(flo)||!Number.isFinite(fhi)||flo*fhi>0)return NaN;
 for(let k=0;k<250;k++){const mid=(lo+hi)/2,fm=f(mid);if(Math.abs(fm)<1e-10)return mid;if(flo*fm<=0){hi=mid;fhi=fm}else{lo=mid;flo=fm}}
 return (lo+hi)/2;
}
function mirr(flows,financeRate,reinvestRate){
 const n=flows.length-1;if(n<=0)return NaN;
 let pvNeg=0,fvPos=0;
 flows.forEach((f,t)=>{
   if(f<0)pvNeg+=f/Math.pow(1+financeRate,t);
   if(f>0)fvPos+=f*Math.pow(1+reinvestRate,n-t);
 });
 if(pvNeg===0||fvPos<=0)return NaN;
 return Math.pow(fvPos/Math.abs(pvNeg),1/n)-1;
}
function payback(rows,discounted=false){
 const key=discounted?"cumDisc":"cum";
 for(let i=1;i<rows.length;i++){
   if(rows[i][key]>=0 && rows[i-1][key]<0){
     const prev=Math.abs(rows[i-1][key]);
     const inflow=discounted?rows[i].discounted:rows[i].netCF;
     return (i-1)+(inflow!==0?prev/inflow:0);
   }
 }
 return NaN;
}
function calcMetrics(d,rows){
 const flows=rows.map(r=>r.netCF), VAN=npv(d.rate,flows), TIR=irr(flows), TIRM=mirr(flows,d.rate,d.rate);
 const trc=payback(rows,false),dtrc=payback(rows,true);
 const pvBenefits=rows.slice(1).reduce((s,r,t)=>s+r.benefit/Math.pow(1+d.rate,t+1),0) + (rows.at(-1).residualWC/Math.pow(1+d.rate,d.n));
 const pvCosts=d.I0 + rows.slice(1).reduce((s,r,t)=>s+(r.cost+r.tax)/Math.pow(1+d.rate,t+1),0);
 const bc=pvCosts!==0?pvBenefits/pvCosts:NaN;
 const roi=d.I0!==0?(rows.slice(1).reduce((s,r)=>s+r.netCF,0)-d.I0)/d.I0:NaN;
 const pvFuture=rows.slice(1).reduce((s,r)=>s+r.netCF/Math.pow(1+d.rate,r.year),0);
 const pi=d.I0!==0?pvFuture/d.I0:NaN;
 const ap=d.rate===0?1/d.n:(d.rate*Math.pow(1+d.rate,d.n))/(Math.pow(1+d.rate,d.n)-1);
 const vae=VAN*ap;
 return {VAN,TIR,TIRM,trc,dtrc,bc,roi,pi,vae,signs:signChanges(flows)};
}
let currentRows=null,currentData=null,currentMetrics=null;

function flowTable(rows){
 return `<table class="cashflow-table"><thead><tr>
 <th>Año</th><th>Beneficios / ingresos</th><th>Costos O&amp;M</th><th>Depreciación</th><th>Utilidad antes impuestos</th><th>Impuestos</th><th>Utilidad neta</th><th>Residual + CT</th><th>Flujo neto</th><th>Flujo descontado</th><th>Acum.</th><th>Acum. descontado</th>
 </tr></thead><tbody>${rows.map(r=>`<tr class="${r.year===0?"total-row":""}">
 <td>${r.year}</td><td class="num">${money(r.benefit)}</td><td class="num">${money(r.cost)}</td><td class="num">${money(r.dep)}</td><td class="num">${money(r.taxable)}</td><td class="num">${money(r.tax)}</td><td class="num">${money(r.netIncome)}</td><td class="num">${money(r.residualWC)}</td><td class="num">${money(r.netCF)}</td><td class="num">${money(r.discounted)}</td><td class="num">${money(r.cum)}</td><td class="num">${money(r.cumDisc)}</td>
 </tr>`).join("")}</tbody></table>`;
}
$("buildCashFlowBtn").addEventListener("click",()=>{
 const d=inputs(),err=validate(d);if(err){$("cashFlowOutput").innerHTML=`<div class="output-box bad">${esc(err)}</div>`;return;}
 const rows=buildFlow(d);currentRows=rows;currentData=d;currentMetrics=calcMetrics(d,rows);
 $("cashFlowOutput").innerHTML=flowTable(rows);
 $("cashFlowComment").classList.remove("hidden");
 $("cashFlowComment").innerHTML=`<b>Comentario obligatorio debajo de la tabla:</b> El flujo inicia con una salida de Bs ${money(d.I0)} en el año 0. Los beneficios y costos se proyectan durante ${d.n} años, incorporando depreciación, impuestos y, en el último año, Bs ${money(rows.at(-1).residualWC)} por valor residual y/o recuperación de capital de trabajo. La interpretación definitiva debe explicar la fuente de cada supuesto y no limitarse a describir que los valores “suben” o “bajan”.`;
});
$("copyCashFlowBtn").addEventListener("click",async()=>{
 if(!currentRows)return;
 const headers=["Año","Beneficios","Costos","Depreciación","UAI","Impuestos","Utilidad neta","Residual+CT","Flujo neto","Flujo descontado","Acum.","Acum. descontado"];
 const text=[headers.join("\t"),...currentRows.map(r=>[r.year,r.benefit,r.cost,r.dep,r.taxable,r.tax,r.netIncome,r.residualWC,r.netCF,r.discounted,r.cum,r.cumDisc].join("\t"))].join("\n");
 await navigator.clipboard.writeText(text);
});

function selected(){return new Set([...document.querySelectorAll(".ind-check:checked")].map(x=>x.value));}
function statusBox(ok,neutral=false){return ok?"decision-good":neutral?"decision-warn":"decision-bad";}
$("calculateIndicatorsBtn").addEventListener("click",()=>{
 const d=inputs(),err=validate(d);if(err){show($("indicatorsOutput"),"bad",esc(err));return;}
 const rows=currentRows&&currentData&&JSON.stringify(d)===JSON.stringify(currentData)?currentRows:buildFlow(d);
 const m=calcMetrics(d,rows);currentRows=rows;currentData=d;currentMetrics=m;
 const sel=selected();let cards=[],comments=[];
 if(sel.has("van")){cards.push(["VAN","Bs "+money(m.VAN),m.VAN>0?"VAN > 0":"VAN ≤ 0"]);comments.push(`VAN: ${m.VAN>0?"genera valor por encima de la TMAR":"no alcanza la rentabilidad mínima exigida"} bajo los supuestos.`);}
 if(sel.has("tir")){cards.push(["TIR",Number.isFinite(m.TIR)?pct(m.TIR*100):"No definida",Number.isFinite(m.TIR)?`TMAR ${pct(d.rate*100)}`:"Revisar flujo"]);comments.push(Number.isFinite(m.TIR)?`TIR: ${m.TIR>d.rate?"supera":"no supera"} la TMAR.`:"TIR: no se obtuvo una raíz interpretable; revisar cambios de signo.");}
 if(sel.has("tirm"))cards.push(["TIRM",Number.isFinite(m.TIRM)?pct(m.TIRM*100):"No definida",`TMAR ${pct(d.rate*100)}`]);
 if(sel.has("trc"))cards.push(["TRC",Number.isFinite(m.trc)?m.trc.toLocaleString("es-BO",{maximumFractionDigits:2})+" años":"No se recupera",`Vida ${d.n} años`]);
 if(sel.has("dtrc"))cards.push(["TRC descontado",Number.isFinite(m.dtrc)?m.dtrc.toLocaleString("es-BO",{maximumFractionDigits:2})+" años":"No se recupera",`Vida ${d.n} años`]);
 if(sel.has("bc"))cards.push(["B/C",Number.isFinite(m.bc)?m.bc.toLocaleString("es-BO",{maximumFractionDigits:3}):"N/A",m.bc>1?"B/C > 1":"B/C ≤ 1"]);
 if(sel.has("roi"))cards.push(["ROI",Number.isFinite(m.roi)?pct(m.roi*100):"N/A","Acumulado del horizonte"]);
 if(sel.has("pi"))cards.push(["PI",Number.isFinite(m.pi)?m.pi.toLocaleString("es-BO",{maximumFractionDigits:3}):"N/A",m.pi>1?"PI > 1":"PI ≤ 1"]);
 if(sel.has("vae"))cards.push(["VAE","Bs "+money(m.vae)+"/año",m.vae>0?"VAE > 0":"VAE ≤ 0"]);
 const overall=(m.VAN>0 && (!Number.isFinite(m.TIR)||m.TIR>d.rate));
 const multiple=m.signs>1?`<div class="stop-box"><b>Advertencia:</b> el flujo cambia de signo ${m.signs} veces. La TIR puede ser múltiple o ambigua; prioriza VAN y TIRM.</div>`:"";
 show($("indicatorsOutput"),overall?"ok":"warn",`<div class="fin-kpis">${cards.map(c=>`<div class="fin-kpi"><span class="k">${esc(c[0])}</span><span class="v">${esc(c[1])}</span><span class="d">${esc(c[2])}</span></div>`).join("")}</div>
 ${multiple}<div class="${statusBox(overall)}"><h4>${overall?"🟢 Evaluación favorable bajo los supuestos":"🟡 La factibilidad no queda demostrada con todos los criterios principales"}</h4>
 <p>La decisión debe justificarse conjuntamente con el flujo, la TMAR, la calidad de las proyecciones y el análisis de sensibilidad. No basta con que un único indicador resulte favorable.</p></div>
 <div class="comment-box"><b>Comentario sugerido para la tabla de indicadores:</b> ${comments.join(" ")} El estudiante debe añadir las implicaciones específicas para su proyecto y explicar por qué la TMAR, vida económica, ingresos y costos utilizados son defendibles.</div>`);
});

function scenarioMetrics(bAdj,cAdj,ratePts){
 const base=inputs();
 const d=inputs({b1:base.b1*(1+bAdj/100),c1:base.c1*(1+cAdj/100),rate:base.rate+ratePts/100});
 const err=validate(d);if(err)return {error:err};
 const rows=buildFlow(d),m=calcMetrics(d,rows);
 return {d,m};
}
$("sensitivityBtn").addEventListener("click",()=>{
 const vals=["pessBenefits","pessCosts","pessRate","optBenefits","optCosts","optRate"].map(id=>parseNum($(id).value));
 if(vals.some(v=>!Number.isFinite(v))){show($("sensitivityOutput"),"bad","Completa los seis valores.");return;}
 const p=scenarioMetrics(vals[0],vals[1],vals[2]),b=scenarioMetrics(0,0,0),o=scenarioMetrics(vals[3],vals[4],vals[5]);
 if(b.error){show($("sensitivityOutput"),"bad",esc(b.error));return;}
 const row=(name,x,desc)=>`<tr><td>${name}</td><td>${esc(desc)}</td><td class="num">Bs ${money(x.m.VAN)}</td><td class="num">${Number.isFinite(x.m.TIR)?pct(x.m.TIR*100):"N/A"}</td><td>${x.m.VAN>0&&(!Number.isFinite(x.m.TIR)||x.m.TIR>x.d.rate)?"Favorable":"Revisar"}</td></tr>`;
 show($("sensitivityOutput"),"ok",`<table class="cashflow-table"><thead><tr><th>Escenario</th><th>Supuestos</th><th>VAN</th><th>TIR</th><th>Decisión</th></tr></thead><tbody>
 ${row("Pesimista",p,`Beneficios ${vals[0]}%; costos ${vals[1]}%; TMAR ${vals[2]>=0?"+":""}${vals[2]} pp`)}
 ${row("Base",b,"Supuestos originales")}
 ${row("Optimista",o,`Beneficios ${vals[3]}%; costos ${vals[4]}%; TMAR ${vals[5]>=0?"+":""}${vals[5]} pp`)}
 </tbody></table><div class="comment-box"><b>Comentario obligatorio:</b> explica si la decisión permanece o no estable ante los escenarios. Los porcentajes deben estar sustentados en variaciones plausibles de demanda, tarifas, costos, contratos, tecnología o mercado.</div>`);
});

$("reviewBtn").addEventListener("click",()=>{
 const t=clean($("chapterText").value);if(!t){show($("reviewOutput"),"bad","Pega el texto.");return;}
 const checks=[
  [hasAny(t,["inversión inicial","inversion inicial","año 0","ano 0"])?"good":"bad","Se identifica la inversión inicial/año 0."],
  [hasAny(t,["flujo de fondos","flujo de efectivo","flujo neto"])?"good":"bad","Existe flujo de fondos antes de los indicadores."],
  [hasAny(t,["tmar","tasa de descuento","costo de oportunidad"])?"good":"bad","Se declara y justifica una tasa de descuento/TMAR."],
  [hasAny(t,["vida económica","vida economica","horizonte"])?"good":"warn","Se declara vida económica/horizonte."],
  [hasAny(t,["depreciación","depreciacion"])?"good":"warn","Se considera depreciación cuando corresponde."],
  [hasAny(t,["valor residual","capital de trabajo"])?"good":"warn","Se considera recuperación final cuando corresponde."],
  [hasAny(t,["van","valor actual neto"])?"good":"warn","Se presenta VAN."],
  [hasAny(t,["tir","tasa interna de retorno"])?"good":"warn","Se presenta TIR."],
  [hasAny(t,["trc","pri","recuperación","recuperacion"])?"good":"warn","Se presenta tiempo de recuperación."],
  [hasAny(t,["sensibilidad","pesimista","optimista"])?"good":"warn","Se complementa con sensibilidad/escenarios."],
  [hasAny(t,["fuente","cotización","cotizacion","estudio de mercado","registro histórico","registro historico"])?"good":"bad","Se sustentan los supuestos y proyecciones."],
  [firstPerson(t).length?"warn":"good",firstPerson(t).length?"Se detecta primera persona; usar redacción impersonal.":"Redacción impersonal."]
 ];
 if(hasAny(t,["van =","tir ="])&&!hasAny(t,["flujo"]))checks.push(["bad","No presentes indicadores sin mostrar primero el flujo de fondos."]);
 const bad=checks.some(x=>x[0]==="bad"),warn=checks.some(x=>x[0]==="warn");
 show($("reviewOutput"),bad?"bad":warn?"warn":"ok",`<h4>${bad?"🟠 REQUIERE REFORMULACIÓN":warn?"🟡 CUMPLE PARCIALMENTE":"🟢 CUMPLE"}</h4><ul>${checks.map(x=>`<li class="status-${x[0]}">${x[1]}</li>`).join("")}</ul>
 <p><b>Control final:</b> cada tabla debe ir seguida de un párrafo interpretativo. El estudiante debe distinguir datos reales de supuestos y no limitarse a copiar los números obtenidos en Excel.</p>`);
});

function deepPrompt(){
 return `ACTÚA COMO REVISOR DE EVALUACIÓN ECONÓMICA-FINANCIERA DE UN PROYECTO DE GRADO DE INGENIERÍA.

REVISA EXCLUSIVAMENTE EL CAPÍTULO V, MÓDULO DE EVALUACIÓN ECONÓMICA-FINANCIERA.

REGLAS:
- Los indicadores deben provenir de un flujo de fondos sustentado.
- Mostrar inversión inicial/año 0 antes de calcular indicadores.
- Distinguir ingresos/beneficios, costos y gastos, depreciación, impuestos, valor residual y capital de trabajo.
- Justificar vida económica y TMAR/tasa de descuento.
- VAN = flujo 0 + VNA de periodos 1..n; no duplicar inversión.
- TIR se calcula sobre todo el rango, incluido el año 0.
- Si el flujo cambia varias veces de signo, advertir posible TIR múltiple/ambigua y priorizar VAN/TIRM.
- TRC simple no considera valor temporal; TRC descontado sí.
- B/C >1; PI >1; VAN >0; TIR/TIRM > TMAR; VAE >0.
- ROI debe indicar si es acumulado o anual.
- Proyección: elegir modelo sencillo, justificable y reproducible; no una curva atractiva sin fundamento.
- Separar datos reales de supuestos.
- Sustentar inversión, beneficios, costos, vida útil, residual y proyecciones.
- Presentar siempre análisis de sensibilidad o escenarios si existe incertidumbre material.
- Debajo de cada tabla debe existir una interpretación técnica-económica.
- En telecomunicaciones, los beneficios pueden provenir de abonados/servicios, tarifas, tráfico/capacidad o ahorros; los costos pueden incluir CAPEX y OPEX de red.
- No inventar datos para forzar factibilidad.
- Redacción científica impersonal.

DATOS DEL PROYECTO:
Título: ${$("projectTitle").value||"[NO INGRESADO]"}
Objetivo General: ${$("generalObjective").value||"[NO INGRESADO]"}
I0: ${$("initialInvestment").value||"[NO INGRESADO]"}
Vida económica: ${$("lifeYears").value||"[NO INGRESADA]"}
TMAR: ${$("discountRate").value||"[NO INGRESADA]"} %
Beneficios año 1: ${$("benefitsYear1").value||"[NO INGRESADOS]"}
Costos año 1: ${$("costsYear1").value||"[NO INGRESADOS]"}
Crecimiento beneficios: ${$("benefitGrowth").value||"[NO INGRESADO]"} %
Crecimiento costos: ${$("costGrowth").value||"[NO INGRESADO]"} %
Impuestos: ${$("taxRate").value||"[NO INGRESADO]"} %
Base depreciable: ${$("depreciableBase").value||"[NO INGRESADA]"}
Valor residual: ${$("residualValue").value||"[NO INGRESADO]"}
Fuentes: ${$("assumptionSources").value||"[NO INGRESADAS]"}

TEXTO DEL ESTUDIANTE:
${$("chapterText").value||"[NO INGRESADO]"}

RESPONDE CON:
1. DICTAMEN: 🟢 CUMPLE / 🟡 CUMPLE PARCIALMENTE / 🟠 REQUIERE REFORMULACIÓN / 🔴 NO CUMPLE / 🔵 FALTA INFORMACIÓN.
2. A. PERTINENCIA DE REALIZAR EVALUACIÓN FINANCIERA.
3. B. INVERSIÓN INICIAL Y CAPITAL DE TRABAJO.
4. C. BENEFICIOS/INGRESOS Y SU PROYECCIÓN.
5. D. COSTOS/GASTOS Y SU PROYECCIÓN.
6. E. DEPRECIACIÓN, IMPUESTOS Y VALOR RESIDUAL.
7. F. VIDA ECONÓMICA Y TMAR.
8. G. FLUJO DE FONDOS.
9. H. VAN.
10. I. TIR/TIRM.
11. J. TRC Y TRC DESCONTADO.
12. K. B/C, ROI, PI Y VAE SI SE USAN.
13. L. COMANDOS/FÓRMULAS DE EXCEL.
14. M. ANÁLISIS DE SENSIBILIDAD.
15. N. INTERPRETACIÓN DE CADA TABLA.
16. O. COHERENCIA CON FACTIBILIDAD/PREFACTIBILIDAD DE SERVICIOS DE TELECOMUNICACIONES, SI CORRESPONDE.
17. P. INFORMACIÓN FALTANTE Y CÓMO CORREGIRLA, SIN INVENTAR DATOS.`;
}
$("copyPromptBtn").addEventListener("click",async()=>{
 await navigator.clipboard.writeText(deepPrompt());
 $("promptStatus").textContent="Prompt copiado.";
 setTimeout(()=>$("promptStatus").textContent="",1600);
});
