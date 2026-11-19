/* Safrou Pro — gerador de PDF próprio (funciona offline, sem bibliotecas).
   A4 em pontos (595 × 842), fontes padrão Helvetica e Helvetica-Bold com codificação WinAnsi,
   retângulos, linhas, texto com quebra de linha e imagem JPEG (logo do profissional). */
const SafPDF=(function(){
  const HR=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  const HB=[278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
  const SPECIAL={'–':0x96,'—':0x97,'•':0x95,'‘':0x91,'’':0x92,'“':0x93,'”':0x94,'…':0x85,'€':0x80,'™':0x99,'‰':0x89};
  const SPW={0x96:556,0x97:1000,0x95:350,0x91:222,0x92:222,0x93:333,0x94:333,0x85:1000,0x80:556,0x99:1000,0x89:1000};
  function encChar(ch){
    if(SPECIAL[ch])return SPECIAL[ch];
    const c=ch.charCodeAt(0);
    if(c>=32&&c<127)return c;
    if(c>=0xA0&&c<=0xFF)return c;
    if(ch==='\t')return 32;
    const b=ch.normalize('NFD').replace(/[̀-ͯ]/g,'');
    if(b&&b.charCodeAt(0)>=32&&b.charCodeAt(0)<127)return b.charCodeAt(0);
    return 63; // ?
  }
  function encode(s){let o='';for(const ch of String(s??''))o+=String.fromCharCode(encChar(ch));return o}
  function cw(code,bold){
    const t=bold?HB:HR;
    if(code>=32&&code<127)return t[code-32];
    if(SPW[code])return SPW[code];
    if(code>=0xC0){const base=String.fromCharCode(code).normalize('NFD').charCodeAt(0);if(base>=32&&base<127)return t[base-32]}
    if(code===0xBA||code===0xAA)return 365;if(code===0xB0)return 400;
    return 556;
  }
  function width(s,bold,size){const e=encode(s);let w=0;for(let i=0;i<e.length;i++)w+=cw(e.charCodeAt(i),bold);return w*size/1000}
  function wrap(s,bold,size,maxW){
    const out=[];
    String(s??'').split('\n').forEach(par=>{
      const words=par.split(/\s+/).filter(Boolean);if(!words.length){out.push('');return}
      let line='';
      for(let w of words){
        const t=line?line+' '+w:w;
        if(width(t,bold,size)<=maxW){line=t;continue}
        if(line)out.push(line);
        while(width(w,bold,size)>maxW&&w.length>1){let k=w.length;while(k>1&&width(w.slice(0,k),bold,size)>maxW)k--;out.push(w.slice(0,k));w=w.slice(k)}
        line=w;
      }
      if(line)out.push(line);
    });
    return out;
  }
  const esc=s=>s.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
  const rgb=hex=>{const h=String(hex||'#000').replace('#','');const n=parseInt(h.length===3?h.split('').map(x=>x+x).join(''):h,16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255].map(v=>v.toFixed(3)).join(' ')};
  const f=n=>(+n).toFixed(2);
  class Doc{
    constructor(){this.W=595.28;this.H=841.89;this.pages=[];this.images=[];this.addPage()}
    addPage(){this.ops=[];this.pages.push(this.ops);return this}
    get pageCount(){return this.pages.length}
    usePage(i){this.ops=this.pages[i]}
    rect(x,y,w,h,o={}){const Y=this.H-y-h;let op='';
      if(o.fill)op+=rgb(o.fill)+' rg ';if(o.stroke)op+=rgb(o.stroke)+' RG '+f(o.lw||0.6)+' w ';
      if(o.r){const r=Math.min(o.r,w/2,h/2),k=0.5523*r,x2=x+w,y2=Y+h;
        op+=`${f(x+r)} ${f(Y)} m ${f(x2-r)} ${f(Y)} l ${f(x2-r+k)} ${f(Y)} ${f(x2)} ${f(Y+r-k)} ${f(x2)} ${f(Y+r)} c ${f(x2)} ${f(y2-r)} l ${f(x2)} ${f(y2-r+k)} ${f(x2-r+k)} ${f(y2)} ${f(x2-r)} ${f(y2)} c ${f(x+r)} ${f(y2)} l ${f(x+r-k)} ${f(y2)} ${f(x)} ${f(y2-r+k)} ${f(x)} ${f(y2-r)} c ${f(x)} ${f(Y+r)} l ${f(x)} ${f(Y+r-k)} ${f(x+r-k)} ${f(Y)} ${f(x+r)} ${f(Y)} c `;}
      else op+=`${f(x)} ${f(Y)} ${f(w)} ${f(h)} re `;
      op+=o.fill&&o.stroke?'B':o.fill?'f':'S';this.ops.push('q '+op+' Q');return this}
    line(x1,y1,x2,y2,o={}){this.ops.push(`q ${rgb(o.color||'#cccccc')} RG ${f(o.lw||0.6)} w ${o.dash?'[2 2] 0 d ':''}${f(x1)} ${f(this.H-y1)} m ${f(x2)} ${f(this.H-y2)} l S Q`);return this}
    // y = linha de base medida a partir do topo
    text(x,y,s,o={}){const size=o.size||10,bold=!!o.bold;let X=x;
      if(o.align==='right')X=x-width(s,bold,size);else if(o.align==='center')X=x-width(s,bold,size)/2;
      this.ops.push(`BT ${rgb(o.color||'#17251B')} rg /${bold?'F2':'F1'} ${f(size)} Tf 1 0 0 1 ${f(X)} ${f(this.H-y)} Tm (${esc(encode(s))}) Tj ET`);return this}
    // texto com quebra; devolve a altura usada
    para(x,y,s,maxW,o={}){const size=o.size||10,lh=o.lh||size*1.35;const ls=wrap(s,!!o.bold,size,maxW);ls.forEach((l,i)=>this.text(x,y+size+i*lh,l,o));return ls.length*lh}
    measure(s,maxW,o={}){const size=o.size||10,lh=o.lh||size*1.35;return wrap(s,!!o.bold,size,maxW).length*lh}
    // jpeg: string binária (latin1) + largura/altura em px
    image(jpeg,pw,ph,x,y,w,h){let i=this.images.findIndex(m=>m.data===jpeg);if(i<0){this.images.push({data:jpeg,w:pw,h:ph});i=this.images.length-1}
      this.ops.push(`q ${f(w)} 0 0 ${f(h)} ${f(x)} ${f(this.H-y-h)} cm /Im${i} Do Q`);return this}
    output(){
      const objs=[];const add=s=>{objs.push(s);return objs.length};
      const catalog=add(null),pagesId=add(null),f1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),f2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
      const imgIds=this.images.map(m=>add(`<< /Type /XObject /Subtype /Image /Width ${m.w} /Height ${m.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${m.data.length} >>\nstream\n${m.data}\nendstream`));
      const xo=imgIds.length?`/XObject << ${imgIds.map((id,i)=>`/Im${i} ${id} 0 R`).join(' ')} >>`:'';
      const kids=[];
      this.pages.forEach(ops=>{const c=ops.join('\n');const cid=add(`<< /Length ${c.length} >>\nstream\n${c}\nendstream`);
        kids.push(add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${f(this.W)} ${f(this.H)}] /Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> ${xo} >> /Contents ${cid} 0 R >>`))});
      objs[catalog-1]=`<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
      objs[pagesId-1]=`<< /Type /Pages /Kids [${kids.map(k=>k+' 0 R').join(' ')}] /Count ${kids.length} >>`;
      let out='%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';const off=[];
      objs.forEach((o,i)=>{off.push(out.length);out+=`${i+1} 0 obj\n${o}\nendobj\n`});
      const xref=out.length;
      out+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+off.map(o=>String(o).padStart(10,'0')+' 00000 n \n').join('');
      out+=`trailer\n<< /Size ${objs.length+1} /Root ${catalog} 0 R /Info << /Producer (Safrou) >> >>\nstartxref\n${xref}\n%%EOF`;
      const u=new Uint8Array(out.length);for(let i=0;i<out.length;i++)u[i]=out.charCodeAt(i)&255;return u;
    }
  }
  // dataURL JPEG -> {data (binária), w, h}
  function jpegFromDataURL(url,w,h){const b=atob(String(url).split(',')[1]||'');return {data:b,w,h}}
  return {Doc,wrap,width,encode,jpegFromDataURL};
})();
/* Safrou Pro — núcleo: estado, estilos, tela de assinatura, abas da área "Meus", compartilhamento. */
const SAFPRO=(function(){
  const S=()=>window.SAF;
  const B=()=>window.SafBilling;
  const $=s=>document.querySelector(s);
  const esc=s=>S().esc(s),norm=s=>S().norm(s),pnum=s=>S().pnum(s),n2=(n,d)=>S().n2(n,d),brl=n=>S().brl(n);
  const ls={get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??d}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const isPro=()=>!!(B()&&B().isPro());
  const native=()=>!!(B()&&B().native());
  const ON=()=>!!(B()&&(!B().enabled||B().enabled()));
  const hoje=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  const fmtD=iso=>{if(!iso)return '';const [y,m,d]=String(iso).slice(0,10).split('-');return d&&m&&y?`${d}/${m}/${y}`:iso};
  const addDias=(iso,n)=>{const d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)};
  const LOCK='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';

  /* ---------- estilos do Pro ---------- */
  const css=`
  .seg{display:flex;gap:4px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:4px;overflow-x:auto}
  .seg button{flex:1 0 auto;border:0;background:none;border-radius:10px;padding:9px 12px;font-weight:600;font-size:14px;color:var(--muted);display:inline-flex;align-items:center;justify-content:center;gap:6px;white-space:nowrap;min-height:40px}
  .seg button[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink)}
  .probadge{justify-self:start;display:inline-flex;align-items:center;gap:4px;background:var(--grain);color:#17251b;font:800 11px/1 var(--f-display);letter-spacing:.02em;padding:4px 7px;border-radius:999px;text-transform:uppercase}
  .proteaser{background:var(--surface);border:1.5px solid var(--grain);border-radius:var(--r);padding:16px;display:grid;gap:10px}
  .proteaser h3{margin:0;font:800 19px/1.15 var(--f-display);letter-spacing:-.02em;text-transform:none;color:var(--ink)}
  .proteaser ul{margin:0;padding-left:18px;display:grid;gap:4px}
  .btn.pro{background:var(--grain);color:#17251b}
  .pw{display:grid;gap:14px}
  .pw h2{margin:0;font:800 30px/1.05 var(--f-display);letter-spacing:-.04em}
  .pwfeat{display:grid;gap:10px;margin:0;padding:0;list-style:none}
  .pwfeat li{display:grid;grid-template-columns:36px 1fr;gap:10px;align-items:start}
  .pwfeat .ic{width:36px;height:36px;border-radius:10px;background:var(--grain);display:flex;align-items:center;justify-content:center;color:#17251b}
  .pwfeat b{display:block}
  .plans{display:grid;gap:10px}
  .plan{display:grid;gap:2px;text-align:left;border:2px solid var(--line);background:var(--surface);border-radius:14px;padding:12px 14px;position:relative}
  .plan[aria-pressed="true"]{border-color:var(--accent);background:var(--accent-soft)}
  .plan b{font:800 18px/1.1 var(--f-display)}
  .plan .tag{position:absolute;right:10px;top:-10px;background:var(--grain);color:#17251b;font:800 11px var(--f-display);padding:4px 8px;border-radius:999px}
  .legal{font-size:12px;color:var(--muted);margin:0}
  .legal a{color:var(--accent)}
  .ffield{display:grid;gap:4px;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:600;min-width:0}
  .ffield input,.ffield select,.ffield textarea{width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--line);border-radius:10px;background:var(--surface-2);font-size:16px;text-transform:none;letter-spacing:0;font-weight:400;color:var(--ink);font-family:var(--f-body)}
  .fgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .fgrid .full{grid-column:1/-1}
  .ritem{border:1px solid var(--line);border-radius:12px;padding:10px 12px;display:grid;gap:8px;background:var(--surface)}
  .ritem .rh{display:flex;justify-content:space-between;gap:8px;align-items:flex-start}
  .ritem .rh b{display:block}
  .rgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
  .rcard{background:var(--surface);border-radius:var(--r);padding:12px 14px;display:grid;gap:6px;box-shadow:0 1px 2px rgba(23,37,27,.07)}
  .rcard .rt{display:flex;justify-content:space-between;gap:8px}
  .logoprev{width:64px;height:64px;border-radius:12px;object-fit:contain;background:var(--surface-2);border:1px solid var(--line)}
  .talhoes{display:flex;gap:6px;flex-wrap:wrap}
  .tl{border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:7px 12px;font-weight:600;font-size:14px}
  .tl[aria-pressed="true"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}
  .apl{border-left:4px solid var(--accent);background:var(--surface);border-radius:12px;padding:10px 12px;display:grid;gap:6px}
  .apl.warn{border-left-color:#c4561c}
  .okband{background:var(--accent-soft);border-radius:12px;padding:10px 12px;font-weight:600}
  .clima{background:var(--surface);border-radius:var(--r);padding:14px 16px;display:grid;gap:10px;box-shadow:0 1px 2px rgba(23,37,27,.07)}
  .clima h3{margin:0;display:flex;align-items:center;gap:8px}
  .semaf{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;border-radius:14px;padding:12px 14px}
  .semaf .dot{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 13px var(--f-display);color:#fff;text-align:center;line-height:1}
  .s0{background:#e3f2e6}.s0 .dot{background:#1e7a3e}
  .s1{background:#fdf1d3}.s1 .dot{background:#b98500}
  .s2{background:#fbe6e1}.s2 .dot{background:#c42b2b}
  .semaf b{font:800 20px/1.1 var(--f-display);letter-spacing:-.02em;display:block}
  .cmet{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
  .cmet div{background:var(--surface-2);border-radius:10px;padding:8px;display:grid;gap:2px;text-align:center}
  .cmet span{font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em}
  .cmet b{font:700 17px var(--f-display);font-variant-numeric:tabular-nums}
  .hstrip{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(30px,1fr);gap:3px;overflow-x:auto;padding-bottom:2px}
  .hstrip div{display:grid;gap:3px;text-align:center;font-size:10.5px;color:var(--muted)}
  .hstrip i{display:block;height:26px;border-radius:5px}
  .h0{background:#1e7a3e}.h1{background:#f4b62a}.h2{background:#c42b2b}
  .blur{filter:blur(3px);pointer-events:none;user-select:none}
  @media (prefers-color-scheme:dark){.s0{background:#17331f}.s1{background:#3a3018}.s2{background:#3a1d1d}}
  `;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

  /* ---------- compartilhar arquivo (PDF) ---------- */
  function b64(u8){let s='';const ch=0x8000;for(let i=0;i<u8.length;i+=ch)s+=String.fromCharCode.apply(null,u8.subarray(i,i+ch));return btoa(s)}
  async function shareFile(bytes,nome,titulo){
    const P=window.Capacitor&&window.Capacitor.Plugins;
    if(native()&&P&&P.Filesystem&&P.Share){
      const w=await P.Filesystem.writeFile({path:nome,data:b64(bytes),directory:'CACHE'});
      await P.Share.share({title:titulo,files:[w.uri],url:w.uri,dialogTitle:titulo});return;
    }
    const blob=new Blob([bytes],{type:'application/pdf'});
    try{const file=new File([blob],nome,{type:'application/pdf'});if(navigator.canShare&&navigator.canShare({files:[file]})){await navigator.share({files:[file],title:titulo});return}}catch(e){if(e&&e.name==='AbortError')return}
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=nome;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},4000);
  }
  const slug=s=>norm(s).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40)||'safrou';

  /* ---------- folha (tela sobreposta) ---------- */
  function openSheet(titulo,html,bind){
    const sh=$('#sheet');
    sh.innerHTML=`<div class="bar"><div class="wrap"><button class="back" id="pback">← Voltar</button><span class="t">${esc(titulo)}</span></div></div><div class="wrap content">${html}</div>`;
    sh.hidden=false;sh.scrollTop=0;document.body.style.overflow='hidden';
    $('#pback').onclick=closeSheet;
    if(bind)bind(sh);
  }
  function closeSheet(){$('#sheet').hidden=true;document.body.style.overflow='';S().render()}

  /* ---------- tela de assinatura ---------- */
  const FEAT=[
    ['<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>','Recomendação técnica em PDF','Com seu nome, CREA e logo. Produtos, doses, calda, ordem de mistura e carência, pronta para o WhatsApp.'],
    ['<path d="M4 19.5V5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-1.5z"/><path d="M8 7h6M8 11h6"/>','Caderno de campo por talhão','Histórico de aplicações, alerta de repetição de grupo de resistência e data liberada para colheita.'],
    ['<path d="M17.7 7.7A2.5 2.5 0 1 1 19.5 12H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>','Condições de pulverização','Vento, Delta T e chuva das próximas 24 h no seu local, com semáforo de pode ou não aplicar.'],
    ['<path d="M3 3l18 18"/><path d="M10.6 5.1A9 9 0 0 1 21 12a9 9 0 0 1-1.6 5.1M6.3 6.3A9 9 0 0 0 12 21a9 9 0 0 0 5.7-2.3"/>','Sem anúncios','Use o app sem banner, em todas as abas.']];
  let plano='annual';
  function priceOf(pkg){const p=pkg&&(pkg.product||pkg.storeProduct);return p?{preco:p.priceString||'',intro:p.introPrice||p.introductoryPrice||null,valor:p.price}:null}
  function introTxt(i){if(!i||(i.price!==0&&i.price!=='0'))return '';const n=i.periodNumberOfUnits||i.cycles||7;const u=String(i.periodUnit||'DAY').toUpperCase();if(u.startsWith('W')&&n===1)return '7 dias grátis';return `${n} ${u.startsWith('W')?(n>1?'semanas':'semana'):u.startsWith('M')?(n>1?'meses':'mês'):(n>1?'dias':'dia')} grátis`}
  function paywall(){
    const bs=B()&&B().state||{};const pk=bs.packages||{};
    const an=priceOf(pk.annual),me=priceOf(pk.monthly);
    if(!an&&me)plano='monthly';
    const economia=an&&me&&an.valor&&me.valor?Math.round((1-an.valor/(me.valor*12))*100):0;
    const trial=introTxt(an&&an.intro)||introTxt(me&&me.intro);
    const ativo=isPro();const info=B()&&B().info&&B().info();
    const planos=(an||me)?`<div class="plans">
      ${an?`<button class="plan" data-plano="annual" aria-pressed="${plano==='annual'}">${economia>0?`<span class="tag">Economize ${economia}%</span>`:''}<b>Anual · ${esc(an.preco)}</b><span class="muted">${introTxt(an.intro)?esc(introTxt(an.intro))+', depois ':''}cobrado uma vez por ano</span></button>`:''}
      ${me?`<button class="plan" data-plano="monthly" aria-pressed="${plano==='monthly'}"><b>Mensal · ${esc(me.preco)}</b><span class="muted">${introTxt(me.intro)?esc(introTxt(me.intro))+', depois ':''}cobrado todo mês</span></button>`:''}
    </div>
    <button class="btn pro" id="pwbuy" style="min-height:52px;font-size:17px">${trial?'Começar '+esc(trial):'Assinar o Safrou Pro'}</button>`
    :`<p class="note">${native()?(bs.ready?'As assinaturas não estão disponíveis agora. Verifique a internet e tente de novo.':'Carregando os planos…'):'A assinatura é feita pelo app Safrou no iPhone. Aqui no navegador você vê como funciona.'}</p>`;
    const html=`<div class="pw">
      <span class="probadge">${LOCK} Safrou Pro</span>
      <h2>${ativo?'Você é Pro! 🌱':'Ferramentas de quem vive o campo'}</h2>
      ${ativo?`<div class="okband">Assinatura ativa${info&&info.until?' até '+fmtD(info.until.slice(0,10)):''}${info&&info.trial?' (período de teste)':''}.</div>`:'<p class="muted" style="margin:0">A consulta continua grátis. O Pro é para quem usa o app no trabalho todo dia.</p>'}
      <ul class="pwfeat">${FEAT.map(([ic,t,d])=>`<li><span class="ic"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ic}</svg></span><span><b>${t}</b><span class="muted">${d}</span></span></li>`).join('')}</ul>
      ${ativo?`<button class="btn ghost" id="pwmanage">Gerenciar assinatura</button>`:planos}
      <p class="muted" id="pwmsg" style="margin:0"></p>
      ${ativo||!native()?'':`<button class="btn ghost" id="pwrestore">Restaurar assinatura</button>`}
      <p class="legal">${trial?'Após o período grátis, a assinatura é cobrada automaticamente. ':''}A assinatura é renovada automaticamente no fim de cada período, pelo mesmo valor, a menos que seja cancelada pelo menos 24 horas antes. O pagamento é feito pela sua conta Apple. Cancele quando quiser em Ajustes › [seu nome] › Assinaturas.
      <br><a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank" rel="noopener">Termos de uso</a> · <a href="https://feliperigon93.github.io/safrou/privacidade.html" target="_blank" rel="noopener">Política de privacidade</a></p>
    </div>`;
    openSheet('Safrou Pro',html,sh=>{
      sh.querySelectorAll('[data-plano]').forEach(b=>b.onclick=()=>{plano=b.dataset.plano;sh.querySelectorAll('[data-plano]').forEach(x=>x.setAttribute('aria-pressed',x===b))});
      const msg=sh.querySelector('#pwmsg');
      const buy=sh.querySelector('#pwbuy');if(buy)buy.onclick=async()=>{buy.disabled=true;msg.textContent='Abrindo a App Store…';const r=await B().buy(plano);buy.disabled=false;msg.textContent=r.ok?'Pronto! O Safrou Pro está ativo.':(r.msg||'');if(r.ok)setTimeout(closeSheet,900)};
      const rest=sh.querySelector('#pwrestore');if(rest)rest.onclick=async()=>{rest.disabled=true;msg.textContent='Verificando…';const r=await B().restore();rest.disabled=false;msg.textContent=r.msg||'';if(r.ok)setTimeout(closeSheet,900)};
      const man=sh.querySelector('#pwmanage');if(man)man.onclick=()=>B().manage();
    });
  }
  window.addEventListener('saf-pro-change',()=>{if($('#sheet').hidden&&S())S().render()});

  /* bloqueio: cartão de convite para quem ainda não é Pro */
  function teaser(titulo,itens){
    return `<div class="proteaser"><span class="probadge">${LOCK} Safrou Pro</span><h3>${esc(titulo)}</h3><ul>${itens.map(i=>`<li>${i}</li>`).join('')}</ul>
      <button class="btn pro" data-paywall>${native()?'Experimentar o Pro':'Conhecer o Safrou Pro'}</button>
      ${native()?'':'<p class="muted" style="margin:0">Disponível no app Safrou para iPhone.</p>'}</div>`;
  }
  const bindTeaser=root=>root.querySelectorAll('[data-paywall]').forEach(b=>b.onclick=paywall);

  /* ---------- abas da área "Meus" ---------- */
  let SUB=ls.get('saf:meussub','fav');
  const SUBS=[['fav','Favoritos'],['rec','Recomendações'],['cad','Caderno']];
  function meusSeg(){if(!ON())return '';return `<div class="seg" role="group" aria-label="Seções">${SUBS.map(([k,t])=>`<button data-sub="${k}" aria-pressed="${SUB===k}">${t}${k!=='fav'&&!isPro()?' '+LOCK:''}</button>`).join('')}</div>
    ${!isPro()&&SUB==='fav'&&native()?`<button class="btn pro" data-paywall style="justify-self:start">Seja Pro · sem anúncios e mais ferramentas</button>`:''}`}
  function meusSegBind(){const v=$('#view');v.querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>{SUB=b.dataset.sub;ls.set('saf:meussub',SUB);S().render()});bindTeaser(v)}
  function renderMeusSub(){
    const v=$('#view');
    if(SUB==='rec')v.innerHTML=meusSeg()+(isPro()?REC.listHtml():teaser('Recomendação técnica em PDF',['Monte a recomendação com produtos, doses e calda','Seu nome, CREA e logo no cabeçalho','Ordem de mistura e carência automáticas','Envie pelo WhatsApp em segundos']));
    else v.innerHTML=meusSeg()+(isPro()?CAD.html():teaser('Caderno de campo por talhão',['Registre cada aplicação por talhão','Alerta quando o mesmo grupo de resistência se repete','Data liberada para colheita pela carência','Exporte o histórico em PDF']));
    meusSegBind();
    if(isPro()){if(SUB==='rec')REC.listBind(v);else CAD.bind(v)}
  }
  window.bncProCard=()=>'';window.bncProBind=()=>{};

  /* ---------- seletor de produtos (recomendação e caderno) ---------- */
  function pickerHtml(id){return `<div class="search"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input id="${id}" type="search" placeholder="Adicionar produto: nome, ativo ou registro" autocomplete="off"></div><div id="${id}-res" class="gen"></div>
    <div class="btnrow"><button class="btn ghost" type="button" data-livre="adj">+ Adjuvante / óleo</button><button class="btn ghost" type="button" data-livre="livre">+ Outro produto</button></div>`}
  function pickerBind(root,id,onPick){
    const inp=root.querySelector('#'+id),res=root.querySelector('#'+id+'-res');let found=[];let t;
    inp.oninput=()=>{clearTimeout(t);t=setTimeout(()=>{found=S().pickResults(inp.value);res.innerHTML=found.map((r,j)=>`<button type="button" data-j="${j}"><b>${esc(r.nome)}</b><span>${esc(r.sub)}</span></button>`).join('')||(inp.value.trim().length>1?'<p class="muted" style="margin:0">Nada encontrado. Use “+ Outro produto”.</p>':'');
      res.querySelectorAll('button').forEach(b=>b.onclick=()=>{const r=found[+b.dataset.j];const pf=S().prefillPreco(r);onPick({tipo:r.tipo,ref:r.ref,nome:r.nome,sub:r.sub,form:r.form,un:pf.un||r.un||'L',dose:pf.dose||'',preco:pf.preco||'',car:''});inp.value='';res.innerHTML=''})},160)};
    root.querySelectorAll('[data-livre]').forEach(b=>b.onclick=()=>onPick({tipo:b.dataset.livre,ref:'',nome:b.dataset.livre==='adj'?'Adjuvante':'Outro produto',sub:'',form:'',un:'L',dose:'',preco:'',car:''}));
  }
  const moasOf=it=>S().itemMoas(it);

  /* ---------- perfil do profissional ---------- */
  const PERFIL_K='saf:perfil:v1';
  const perfil=()=>ls.get(PERFIL_K,{nome:'',titulo:'Engenheiro(a) Agrônomo(a)',crea:'',fone:'',email:'',empresa:'',logo:null});
  function perfilSheet(after){
    const p=perfil();
    openSheet('Meu perfil profissional',`<div class="box"><h3>Aparece no cabeçalho dos PDFs</h3>
      <div class="fgrid">
        <label class="ffield full">Nome completo<input id="pf-nome" value="${esc(p.nome)}" autocomplete="name"></label>
        <label class="ffield full">Título<select id="pf-tit">${['Engenheiro(a) Agrônomo(a)','Técnico(a) Agrícola','Engenheiro(a) Florestal','Técnico(a) em Agropecuária','Consultor(a) Agrícola'].map(t=>`<option ${p.titulo===t?'selected':''}>${t}</option>`).join('')}</select></label>
        <label class="ffield">CREA / CFTA nº<input id="pf-crea" value="${esc(p.crea)}" placeholder="Ex.: MT 123456/D"></label>
        <label class="ffield">Telefone<input id="pf-fone" value="${esc(p.fone)}" inputmode="tel"></label>
        <label class="ffield">E-mail<input id="pf-email" value="${esc(p.email)}" inputmode="email"></label>
        <label class="ffield">Empresa (opcional)<input id="pf-emp" value="${esc(p.empresa)}"></label>
        <div class="ffield full">Logo (opcional)<div style="display:flex;gap:12px;align-items:center">${p.logo?`<img class="logoprev" src="${p.logo.url}" alt="Logo atual">`:''}<label class="btn ghost" style="cursor:pointer">Escolher imagem<input id="pf-logo" type="file" accept="image/*" hidden></label>${p.logo?'<button class="btn ghost" type="button" id="pf-semlogo">Remover</button>':''}</div></div>
      </div>
      <button class="btn" id="pf-salvar">Salvar perfil</button><p class="muted" id="pf-msg" style="margin:0"></p></div>`,sh=>{
      let logo=p.logo;
      sh.querySelector('#pf-logo').onchange=e=>{const f=e.target.files[0];if(!f)return;const img=new Image();img.onload=()=>{const k=Math.min(1,360/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0,c.width,c.height);logo={url:c.toDataURL('image/jpeg',0.88),w:c.width,h:c.height};sh.querySelector('#pf-msg').textContent='Logo carregado. Toque em Salvar.';URL.revokeObjectURL(img.src)};img.src=URL.createObjectURL(f)};
      const sl=sh.querySelector('#pf-semlogo');if(sl)sl.onclick=()=>{logo=null;sh.querySelector('#pf-msg').textContent='Logo removido. Toque em Salvar.'};
      sh.querySelector('#pf-salvar').onclick=()=>{ls.set(PERFIL_K,{nome:sh.querySelector('#pf-nome').value.trim(),titulo:sh.querySelector('#pf-tit').value,crea:sh.querySelector('#pf-crea').value.trim(),fone:sh.querySelector('#pf-fone').value.trim(),email:sh.querySelector('#pf-email').value.trim(),empresa:sh.querySelector('#pf-emp').value.trim(),logo});
        if(after)after();else closeSheet()};
    });
  }

  const api={isPro,paywall,teaser,bindTeaser,openSheet,closeSheet,shareFile,slug,ls,uid,hoje,fmtD,addDias,perfil,perfilSheet,pickerHtml,pickerBind,moasOf,esc,norm,pnum,n2,brl,LOCK,native,
    proOn:ON,meusSub:()=>ON()?SUB:'fav',setSub:s=>{SUB=s;ls.set('saf:meussub',s)},meusSeg,meusSegBind,renderMeusSub};
  return api;
})();
window.SAFPRO=SAFPRO;
/* Safrou Pro — recomendação técnica em PDF */
const REC=(function(){
  const X=SAFPRO,esc=X.esc,pnum=X.pnum,n2=X.n2,brl=X.brl;
  const K='saf:recs:v1';
  const all=()=>X.ls.get(K,[]);
  const save=list=>X.ls.set(K,list);
  const novoNum=()=>{const n=(X.ls.get('saf:recnum',0)||0)+1;X.ls.set('saf:recnum',n);return n};
  function novo(base){
    const C=window.SAF.CAL;
    return Object.assign({id:X.uid(),num:0,criado:X.hoje(),data:X.hoje(),produtor:'',propriedade:'',mun:'',talhao:'',area:C.area||'',cultura:'',alvo:'',vazao:C.vazao||'',tanque:C.tanque||'',itens:[],custo:false,cond:true,obs:''},base||{});
  }
  function fromCalda(){
    const C=window.SAF.CAL;
    const itens=(C.itens||[]).map(it=>({tipo:it.tipo,ref:it.ref,nome:it.nome,sub:it.sub||'',form:it.form||'',un:it.un||'L',dose:it.dose||'',preco:it.preco||'',car:'',obs:''}));
    editar(novo({itens}));
  }
  function listHtml(){
    const p=X.perfil();const L=all().sort((a,b)=>(b.criado+b.id).localeCompare(a.criado+a.id));
    return `<div class="rcard"><div class="rt"><div><b>${p.nome?esc(p.nome):'Seu perfil profissional'}</b><div class="muted">${p.nome?esc([p.titulo,p.crea&&('CREA '+p.crea)].filter(Boolean).join(' · ')):'Nome, CREA e logo que aparecem no PDF'}</div></div><button class="btn ghost" id="r-perfil">${p.nome?'Editar':'Preencher'}</button></div></div>
      <button class="btn" id="r-novo" style="min-height:48px">+ Nova recomendação</button>
      ${L.length?L.map(r=>`<div class="rcard"><div class="rt"><div><b>Nº ${String(r.num||0).padStart(4,'0')} · ${esc(r.produtor||'Sem produtor')}</b><div class="muted">${esc([r.cultura,r.alvo,r.talhao].filter(Boolean).join(' · '))}</div><div class="muted">${X.fmtD(r.data)} · ${r.itens.length} produto${r.itens.length===1?'':'s'}</div></div></div>
        <div class="btnrow"><button class="btn" data-rpdf="${r.id}">PDF</button><button class="btn ghost" data-rabrir="${r.id}">Editar</button><button class="btn ghost" data-rdup="${r.id}">Duplicar</button><button class="btn ghost" data-rcad="${r.id}">Registrar no caderno</button><button class="btn ghost" data-rdel="${r.id}">Excluir</button></div></div>`).join('')
      :`<div class="empty"><h2>Nenhuma recomendação ainda</h2><p>Crie aqui ou na aba <b>Calda</b>, com o botão “Gerar recomendação em PDF”, que já leva os produtos e doses da calda.</p></div>`}`;
  }
  function listBind(v){
    v.querySelector('#r-perfil').onclick=()=>X.perfilSheet();
    v.querySelector('#r-novo').onclick=()=>editar(novo());
    const get=id=>all().find(r=>r.id===id);
    v.querySelectorAll('[data-rabrir]').forEach(b=>b.onclick=()=>editar(get(b.dataset.rabrir)));
    v.querySelectorAll('[data-rpdf]').forEach(b=>b.onclick=()=>gerar(get(b.dataset.rpdf)));
    v.querySelectorAll('[data-rdup]').forEach(b=>b.onclick=()=>{const r=get(b.dataset.rdup);editar({...JSON.parse(JSON.stringify(r)),id:X.uid(),num:0,criado:X.hoje(),data:X.hoje()})});
    v.querySelectorAll('[data-rcad]').forEach(b=>b.onclick=()=>CAD.fromRec(get(b.dataset.rcad)));
    v.querySelectorAll('[data-rdel]').forEach(b=>b.onclick=()=>{if(confirm('Excluir esta recomendação?')){save(all().filter(r=>r.id!==b.dataset.rdel));window.SAF.render()}});
  }
  function editar(r){
    r=JSON.parse(JSON.stringify(r));
    const draw=()=>{
      const area=pnum(r.area),vaz=pnum(r.vazao),tq=pnum(r.tanque);const haTq=vaz>0&&tq>0?tq/vaz:NaN;
      X.openSheet(r.num?`Recomendação nº ${String(r.num).padStart(4,'0')}`:'Nova recomendação',`
      <div class="box"><h3>Área e cliente</h3><div class="fgrid">
        <label class="ffield full">Produtor<input data-f="produtor" value="${esc(r.produtor)}"></label>
        <label class="ffield">Propriedade<input data-f="propriedade" value="${esc(r.propriedade)}"></label>
        <label class="ffield">Município/UF<input data-f="mun" value="${esc(r.mun)}" placeholder="Ex.: Sorriso/MT"></label>
        <label class="ffield">Talhão<input data-f="talhao" value="${esc(r.talhao)}"></label>
        <label class="ffield">Área (ha)<input data-f="area" inputmode="decimal" value="${esc(r.area)}"></label>
        <label class="ffield">Cultura<input data-f="cultura" value="${esc(r.cultura)}" list="dlCult"></label>
        <label class="ffield">Alvo<input data-f="alvo" value="${esc(r.alvo)}" placeholder="Praga, doença ou daninha"></label>
        <label class="ffield full">Data prevista<input data-f="data" type="date" value="${esc(r.data)}"></label>
      </div></div>
      <div class="box"><h3>Produtos e doses</h3>
        ${r.itens.map((it,i)=>`<div class="ritem"><div class="rh"><div><b>${esc(it.nome)}</b><span class="muted">${esc(it.sub||'')}</span> ${X.moasOf(it).map(window.SAF.moaPill).join(' ')}</div><button class="xbtn" type="button" data-idel="${i}" aria-label="Remover ${esc(it.nome)}">×</button></div>
          <div class="rgrid"><label class="ffield">Dose/ha<span class="gin sm"><input data-i="${i}" data-k="dose" inputmode="decimal" value="${esc(it.dose)}"><select data-i="${i}" data-k="un" aria-label="Unidade"><option ${it.un==='L'?'selected':''}>L</option><option ${it.un==='kg'?'selected':''}>kg</option><option ${it.un==='mL'?'selected':''}>mL</option><option ${it.un==='g'?'selected':''}>g</option></select></span></label>
          <label class="ffield">Carência (dias)<input data-i="${i}" data-k="car" inputmode="numeric" value="${esc(it.car)}" placeholder="bula"></label>
          <label class="ffield">R$ por ${esc(it.un==='kg'||it.un==='g'?'kg':'L')}<input data-i="${i}" data-k="preco" inputmode="decimal" value="${esc(it.preco)}" placeholder="opcional"></label></div>
          ${it.tipo==='adj'||it.tipo==='livre'?`<label class="ffield">Nome do produto<input data-i="${i}" data-k="nome" value="${esc(it.nome)}"></label>`:''}
        </div>`).join('')||'<p class="muted" style="margin:0">Adicione os produtos da aplicação.</p>'}
        ${X.pickerHtml('r-busca')}
        <p class="note">Confira dose, carência (intervalo de segurança) e número máximo de aplicações na bula de cada produto.</p>
      </div>
      <div class="box"><h3>Calda</h3><div class="fgrid">
        <label class="ffield">Volume de calda (L/ha)<input data-f="vazao" inputmode="decimal" value="${esc(r.vazao)}"></label>
        <label class="ffield">Tanque (L)<input data-f="tanque" inputmode="decimal" value="${esc(r.tanque)}"></label></div>
        <div class="kpis"><div><span>Cada tanque cobre</span><b>${isFinite(haTq)?n2(haTq,1)+' ha':'—'}</b></div>${area>0&&isFinite(haTq)?`<div><span>Tanques na área</span><b>${n2(area/haTq,1)}</b></div>`:''}</div>
      </div>
      <div class="box"><h3>Opções do PDF</h3>
        <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" data-f="cond" ${r.cond?'checked':''}> Incluir condições recomendadas de aplicação</label>
        <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" data-f="custo" ${r.custo?'checked':''}> Incluir custo estimado por hectare</label>
        <label class="ffield">Observações<textarea data-f="obs" rows="4">${esc(r.obs)}</textarea></label>
      </div>
      <div class="btnrow"><button class="btn" id="r-pdf" style="min-height:48px">Salvar e gerar PDF</button><button class="btn ghost" id="r-salvar">Só salvar</button></div>
      <p class="muted" id="r-msg"></p>`,sh=>{
        const sync=()=>{sh.querySelectorAll('[data-f]').forEach(el=>{r[el.dataset.f]=el.type==='checkbox'?el.checked:el.value});sh.querySelectorAll('[data-i]').forEach(el=>{const it=r.itens[+el.dataset.i];if(it)it[el.dataset.k]=el.value})};
        const redraw=()=>{sync();const y=$s().scrollTop;draw();$s().scrollTop=y};
        sh.querySelectorAll('[data-f="vazao"],[data-f="tanque"],[data-f="area"]').forEach(el=>el.onchange=redraw);
        sh.querySelectorAll('[data-k="un"]').forEach(el=>el.onchange=redraw);
        sh.querySelectorAll('[data-idel]').forEach(b=>b.onclick=()=>{sync();r.itens.splice(+b.dataset.idel,1);redraw()});
        X.pickerBind(sh,'r-busca',it=>{sync();r.itens.push(it);redraw()});
        const salvar=()=>{sync();if(!r.num)r.num=novoNum();const L=all();const i=L.findIndex(x=>x.id===r.id);if(i>=0)L[i]=r;else L.push(r);save(L);return r};
        sh.querySelector('#r-salvar').onclick=()=>{salvar();X.setSub('rec');X.closeSheet();window.SAF.goTab('meus')};
        sh.querySelector('#r-pdf').onclick=async()=>{const m=sh.querySelector('#r-msg');if(!r.itens.length){m.textContent='Adicione pelo menos um produto.';return}salvar();m.textContent='Gerando PDF…';try{await gerar(r);m.textContent='PDF pronto.'}catch(e){m.textContent='Não foi possível gerar o PDF: '+(e.message||e)}};
      });
    };
    const $s=()=>document.getElementById('sheet');
    draw();
  }
  async function gerar(r){
    const p=X.perfil();
    if(!p.nome){X.perfilSheet(()=>gerar(r));return}
    const bytes=pdf(r,p);
    await X.shareFile(bytes,`recomendacao-${String(r.num).padStart(4,'0')}-${X.slug(r.produtor||'safrou')}.pdf`,'Recomendação técnica');
  }
  // ---------- layout do PDF ----------
  function cabecalho(d,p,titulo,sub){
    d.rect(0,0,d.W,92,{fill:'#1E7A3E'});
    let x=40;
    if(p.logo&&p.logo.url){const j=SafPDF.jpegFromDataURL(p.logo.url,p.logo.w,p.logo.h);const s=Math.min(56/p.logo.w,56/p.logo.h);const w=p.logo.w*s,h=p.logo.h*s;d.rect(38,16,60,60,{fill:'#FFFFFF',r:8});d.image(j.data,j.w,j.h,38+(60-w)/2,16+(60-h)/2,w,h);x=110}
    d.text(x,38,p.nome||'',{bold:true,size:15,color:'#FFFFFF'});
    d.text(x,54,[p.titulo,p.crea&&('CREA/CFTA '+p.crea)].filter(Boolean).join(' · '),{size:9.5,color:'#D7F0DC'});
    d.text(x,68,[p.empresa,p.fone,p.email].filter(Boolean).join(' · '),{size:9,color:'#D7F0DC'});
    d.text(d.W-40,38,titulo,{bold:true,size:12,color:'#FFFFFF',align:'right'});
    if(sub)d.text(d.W-40,54,sub,{size:9.5,color:'#F4B62A',align:'right',bold:true});
  }
  function rodape(d,p,txt){const n=d.pageCount;for(let i=0;i<n;i++){d.usePage(i);d.line(40,d.H-34,d.W-40,d.H-34,{color:'#DCE5DA'});d.text(40,d.H-22,txt,{size:7.5,color:'#4F6155'});d.text(d.W-40,d.H-22,`Página ${i+1} de ${n}`,{size:7.5,color:'#4F6155',align:'right'})}}
  function secao(d,y,t){y+=8;d.text(40,y,t.toUpperCase(),{bold:true,size:9.5,color:'#1E7A3E'});d.line(40,y+5,d.W-40,y+5,{color:'#1E7A3E',lw:0.8});return y+18}
  function pdf(r,p){
    const d=new SafPDF.Doc();const L=40,R=d.W-40,CW=R-L;const BOT=d.H-60;
    const num=String(r.num||0).padStart(4,'0');
    cabecalho(d,p,'RECOMENDAÇÃO TÉCNICA',`Nº ${num} · ${X.fmtD(r.criado)}`);
    let y=118;
    const novaPag=need=>{if(y+need>BOT){d.addPage();cabecalho(d,p,'RECOMENDAÇÃO TÉCNICA',`Nº ${num} · continuação`);y=118}};
    // dados
    y=secao(d,y,'Dados da área');
    const campos=[['Produtor',r.produtor],['Propriedade',r.propriedade],['Município/UF',r.mun],['Talhão',r.talhao],['Área',r.area?n2(pnum(r.area),2)+' ha':''],['Cultura',r.cultura],['Alvo',r.alvo],['Data prevista',X.fmtD(r.data)]].filter(c=>c[1]);
    for(let i=0;i<campos.length;i+=2){novaPag(26);[campos[i],campos[i+1]].forEach((c,k)=>{if(!c)return;const x=L+k*(CW/2);d.text(x,y+2,c[0],{size:8,color:'#4F6155'});d.text(x,y+14,String(c[1]),{bold:true,size:10.5})});y+=30}
    y+=4;
    // produtos
    const area=pnum(r.area),vaz=pnum(r.vazao),tq=pnum(r.tanque);const haTq=vaz>0&&tq>0?tq/vaz:NaN;
    novaPag(60);y=secao(d,y,'Produtos e doses');
    const cols=[{t:'Produto',w:CW*0.40},{t:'Dose/ha',w:CW*0.14},{t:'Por tanque',w:CW*0.15},{t:'Total na área',w:CW*0.17},{t:'Carência',w:CW*0.14}];
    const head=()=>{d.rect(L,y,CW,20,{fill:'#F4F7F2'});let x=L+6;cols.forEach(c=>{d.text(x,y+13.5,c.t,{bold:true,size:8.5,color:'#4F6155'});x+=c.w});y+=20};
    head();
    r.itens.forEach((it,i)=>{
      const sub=[it.sub,it.tipo==='def'&&it.ref?'Reg. MAPA '+it.ref:''].filter(Boolean).join(' · ');
      const hN=d.measure(it.nome,cols[0].w-10,{bold:true,size:10,lh:12.5}),hS=sub?d.measure(sub,cols[0].w-10,{size:8,lh:10}):0;
      const h=Math.max(28,hN+hS+12);
      if(y+h>BOT){d.addPage();cabecalho(d,p,'RECOMENDAÇÃO TÉCNICA',`Nº ${num} · continuação`);y=118;head()}
      if(i%2)d.rect(L,y,CW,h,{fill:'#FBFCFA'});
      d.para(L+6,y+4,it.nome,cols[0].w-10,{bold:true,size:10,lh:12.5});
      if(sub)d.para(L+6,y+4+hN,sub,cols[0].w-10,{size:8,lh:10,color:'#4F6155'});
      const dose=pnum(it.dose);let x=L+6+cols[0].w;
      const vals=[dose>0?n2(dose,3)+' '+it.un:'—',dose>0&&isFinite(haTq)?n2(dose*haTq,2)+' '+it.un:'—',dose>0&&area>0?n2(dose*area,2)+' '+it.un:'—',pnum(it.car)>=0&&it.car!==''?it.car+' dias':'ver bula'];
      vals.forEach((t,k)=>{d.text(x,y+16,t,{size:9.5,bold:k===0});x+=cols[k+1].w});
      d.line(L,y+h,R,y+h,{color:'#E3E9E1'});y+=h;
    });
    y+=14;
    // calda
    if(vaz>0||tq>0){novaPag(50);y=secao(d,y,'Calda');
      const cs=[['Volume de calda',vaz>0?n2(vaz,1)+' L/ha':'—'],['Tanque',tq>0?n2(tq,0)+' L':'—'],['Cada tanque cobre',isFinite(haTq)?n2(haTq,1)+' ha':'—'],['Tanques na área',area>0&&isFinite(haTq)?n2(area/haTq,1):'—']];
      cs.forEach((c,k)=>{const x=L+k*(CW/4);d.text(x,y+2,c[0],{size:8,color:'#4F6155'});d.text(x,y+15,c[1],{bold:true,size:11})});y+=34}
    // ordem de mistura
    if(r.itens.length>1){
      const S=window.SAF;const ord=[...r.itens].sort((a,b)=>S.grupoOrdem(a)-S.grupoOrdem(b));
      novaPag(40+ord.length*16);y=secao(d,y,'Ordem de mistura sugerida');
      const passos=['Tanque com metade a 2/3 da água, agitador ligado (corretor de pH, se usar).',...ord.map(it=>`${it.nome} (${S.ORDEM[S.grupoOrdem(it)].g})`),'Complete com água mantendo a agitação.'];
      passos.forEach((t,i)=>{const h=d.measure(t,CW-20,{size:9.5,lh:12.5});novaPag(h+4);d.text(L,y+11,(i+1)+'.',{bold:true,size:9.5,color:'#1E7A3E'});d.para(L+16,y,t,CW-20,{size:9.5,lh:12.5});y+=h+3});
      y+=10;
    }
    // condições
    if(r.cond){const c=['Vento entre 3 e 10 km/h. Evite ventos fortes e também ausência total de vento (risco de inversão térmica).','Delta T entre 2 e 8 °C (temperatura até 30 °C e umidade relativa acima de 55%).','Não aplicar com previsão de chuva próxima ao período indicado na bula.','Faça o teste de mistura em pequena escala antes de preparar o tanque.'];
      novaPag(70);y=secao(d,y,'Condições recomendadas de aplicação');
      c.forEach(t=>{const h=d.measure(t,CW-14,{size:9.5,lh:12.5});novaPag(h+4);d.text(L,y+11,'•',{size:10,color:'#1E7A3E'});d.para(L+12,y,t,CW-14,{size:9.5,lh:12.5});y+=h+3});y+=10}
    // custo
    if(r.custo){const its=r.itens.map(it=>({it,d:pnum(it.dose),p:pnum(it.preco)})).filter(x=>x.d>0&&x.p>0);
      if(its.length){novaPag(40+its.length*16);y=secao(d,y,'Custo estimado');
        let tot=0;its.forEach(x=>{const fat=x.it.un==='mL'||x.it.un==='g'?0.001:1;const c=x.d*fat*x.p;tot+=c;d.text(L,y+11,x.it.nome,{size:9.5});d.text(L+CW*0.62,y+11,brl(x.p)+' por '+(x.it.un==='kg'||x.it.un==='g'?'kg':'L'),{size:9,color:'#4F6155'});d.text(R,y+11,brl(c)+'/ha',{size:9.5,bold:true,align:'right'});y+=16});
        d.line(L,y,R,y,{color:'#DCE5DA'});y+=4;d.text(L,y+12,'Total por hectare',{bold:true,size:10});d.text(R,y+12,brl(tot),{bold:true,size:11,align:'right'});y+=18;
        if(area>0){d.text(L,y+12,`Total para ${n2(area,2)} ha`,{bold:true,size:10});d.text(R,y+12,brl(tot*area),{bold:true,size:11,align:'right'});y+=18}
        d.text(L,y+10,'Valores informados pelo profissional, sujeitos a variação de preço.',{size:7.5,color:'#4F6155'});y+=20}}
    // observações
    if(r.obs&&r.obs.trim()){const h=d.measure(r.obs,CW,{size:9.5,lh:12.5});novaPag(h+30);y=secao(d,y,'Observações');y+=d.para(L,y,r.obs,CW,{size:9.5,lh:12.5})+10}
    // segurança
    const seg='Use os equipamentos de proteção individual (EPI) indicados na bula. Respeite o intervalo de reentrada na área e o intervalo de segurança (carência) até a colheita. Faça a tríplice lavagem e devolva as embalagens vazias no local indicado na nota fiscal.';
    const hs=d.measure(seg,CW-20,{size:8.5,lh:11});novaPag(hs+30);
    d.rect(L,y,CW,hs+16,{fill:'#FDF1D3',r:6});d.para(L+10,y+5,seg,CW-20,{size:8.5,lh:11,color:'#4A3500'});y+=hs+22;
    // assinatura
    if(y+64>d.H-42){d.addPage();cabecalho(d,p,'RECOMENDAÇÃO TÉCNICA',`Nº ${num} · continuação`);y=130}
    d.line(L+CW*0.25,y+22,L+CW*0.75,y+22,{color:'#17251B',lw:0.8});
    d.text(d.W/2,y+35,p.nome||'',{bold:true,size:10,align:'center'});
    d.text(d.W/2,y+47,[p.titulo,p.crea&&('CREA/CFTA '+p.crea)].filter(Boolean).join(' · '),{size:8.5,color:'#4F6155',align:'center'});
    d.text(d.W/2,y+60,'Esta recomendação técnica não substitui o receituário agronômico exigido para a compra de agrotóxicos.',{size:7.5,color:'#4F6155',align:'center'});
    rodape(d,p,'Gerado com o app Safrou · Siga sempre as recomendações da bula e do receituário.');
    return d.output();
  }
  return {listHtml,listBind,editar,novo,fromCalda,gerar,pdf,all};
})();
/* Safrou Pro — caderno de campo por talhão */
const CAD=(function(){
  const X=SAFPRO,esc=X.esc,pnum=X.pnum,n2=X.n2;
  const K='saf:cad:v1';
  const get=()=>X.ls.get(K,{props:[],aps:[]});
  const put=c=>X.ls.set(K,c);
  let sel=X.ls.get('saf:cadsel',{prop:'',tal:''});
  const setSel=s=>{sel=s;X.ls.set('saf:cadsel',s)};
  const talhoes=c=>c.props.flatMap(p=>p.talhoes.map(t=>({...t,prop:p})));
  const findTal=(c,id)=>talhoes(c).find(t=>t.id===id);
  const moasAp=ap=>{const m=new Map();ap.itens.forEach(it=>X.moasOf(it).forEach(x=>m.set(x.key,x)));return [...m.values()]};
  // análise do talhão: repetição de modo de ação e carência
  function analisa(c,tid){
    const aps=c.aps.filter(a=>a.tid===tid).sort((a,b)=>a.data.localeCompare(b.data));
    const al=[];const cont=new Map();const umAno=X.addDias(X.hoje(),-365);
    aps.forEach((ap,i)=>{const ks=moasAp(ap).map(m=>m.key).filter(k=>!/^FRAC M/.test(k));
      if(ap.data>=umAno)ks.forEach(k=>cont.set(k,(cont.get(k)||0)+1));
      if(i>0){const prev=new Set(moasAp(aps[i-1]).map(m=>m.key));const rep=ks.filter(k=>prev.has(k));if(rep.length){ap._rep=rep;al.push(`Aplicação de <b>${X.fmtD(ap.data)}</b> repete ${rep.map(k=>`<b>${esc(k)}</b>`).join(', ')} da aplicação anterior. Alterne o modo de ação.`)}}});
    cont.forEach((n,k)=>{if(n>=3)al.push(`<b>${esc(k)}</b> foi usado ${n} vezes nos últimos 12 meses neste talhão. Confira o máximo de aplicações por safra na bula.`)});
    let lib=null,libProd='';
    aps.forEach(ap=>ap.itens.forEach(it=>{const cd=parseInt(it.car,10);if(cd>=0){const d=X.addDias(ap.data,cd);if(!lib||d>lib){lib=d;libProd=it.nome}}}));
    return {aps,al,lib,libProd};
  }
  function html(){
    const c=get();
    if(!c.props.length)return `<div class="empty"><h2>Comece pela propriedade</h2><p>Cadastre a fazenda e os talhões. Depois registre cada aplicação: o app avisa quando um grupo de resistência se repete e calcula a data liberada para colheita.</p><button class="btn" id="c-novaprop">+ Cadastrar propriedade</button></div>`;
    const ts=talhoes(c);if(!sel.tal||!findTal(c,sel.tal))sel={prop:ts[0]?ts[0].prop.id:c.props[0].id,tal:ts[0]?ts[0].id:''};
    const t=findTal(c,sel.tal);const a=t?analisa(c,t.id):null;const hj=X.hoje();
    return `${c.props.map(p=>`<div class="rcard"><div class="rt"><div><b>${esc(p.nome)}</b><div class="muted">${esc(p.mun||'')}</div></div><button class="btn ghost" data-eprop="${p.id}">Editar</button></div>
      <div class="talhoes">${p.talhoes.map(tl=>`<button class="tl" data-tal="${tl.id}" aria-pressed="${tl.id===sel.tal}">${esc(tl.nome)}${tl.area?` · ${esc(tl.area)} ha`:''}</button>`).join('')}<button class="tl" data-addtal="${p.id}">+ Talhão</button></div></div>`).join('')}
      <button class="btn ghost" id="c-novaprop" style="justify-self:start">+ Outra propriedade</button>
      ${t?`<div class="box"><h3>${esc(t.prop.nome)} · ${esc(t.nome)}${t.cultura?' · '+esc(t.cultura):''}</h3>
        ${a.lib?`<div class="${a.lib>hj?'note':'okband'}">${a.lib>hj?`Carência: colheita liberada a partir de <b>${X.fmtD(a.lib)}</b> (${esc(a.libProd)}).`:`Carência cumprida desde ${X.fmtD(a.lib)}. Liberado para colheita.`}</div>`:''}
        ${a.al.length?`<div class="note">${a.al.map(x=>`<div>⚠ ${x}</div>`).join('')}</div>`:a.aps.length>1?'<div class="okband">Sem repetição de modo de ação entre aplicações seguidas.</div>':''}
        <div class="btnrow"><button class="btn" id="c-novaap">+ Registrar aplicação</button>${a.aps.length?'<button class="btn ghost" id="c-pdf">Exportar PDF</button>':''}</div>
        ${a.aps.length?[...a.aps].reverse().map(ap=>`<div class="apl ${ap._rep?'warn':''}"><div class="rt" style="display:flex;justify-content:space-between;gap:8px"><b>${X.fmtD(ap.data)}</b><span><button class="btn ghost" data-eap="${ap.id}">Editar</button></span></div>
          <div>${ap.itens.map(it=>`${esc(it.nome)}${pnum(it.dose)>0?` <span class="muted">${esc(it.dose)} ${esc(it.un)}/ha</span>`:''}`).join('<br>')}</div>
          <div>${moasAp(ap).map(window.SAF.moaPill).join(' ')||'<span class="muted">sem grupo identificado</span>'}${ap.area?` <span class="muted">· ${esc(ap.area)} ha</span>`:''}${ap.vol?` <span class="muted">· ${esc(ap.vol)} L/ha</span>`:''}</div>
          ${ap.obs?`<div class="muted">${esc(ap.obs)}</div>`:''}</div>`).join(''):'<p class="muted" style="margin:0">Nenhuma aplicação registrada neste talhão.</p>'}
      </div>`:'<p class="muted">Cadastre um talhão para registrar aplicações.</p>'}
      <p class="muted">Grupo de resistência estimado pelo grupo químico do AGROFIT; confirme na bula. O caderno fica salvo neste aparelho, então exporte o PDF de tempos em tempos como cópia.</p>`;
  }
  function bind(v){
    const q=s=>v.querySelector(s);
    q('#c-novaprop')&&(q('#c-novaprop').onclick=()=>propSheet(null));
    v.querySelectorAll('[data-eprop]').forEach(b=>b.onclick=()=>propSheet(b.dataset.eprop));
    v.querySelectorAll('[data-tal]').forEach(b=>b.onclick=()=>{setSel({prop:'',tal:b.dataset.tal});window.SAF.render()});
    v.querySelectorAll('[data-addtal]').forEach(b=>b.onclick=()=>propSheet(b.dataset.addtal,true));
    q('#c-novaap')&&(q('#c-novaap').onclick=()=>apSheet({id:X.uid(),tid:sel.tal,data:X.hoje(),itens:[],area:(findTal(get(),sel.tal)||{}).area||'',vol:'',obs:''}));
    v.querySelectorAll('[data-eap]').forEach(b=>b.onclick=()=>apSheet(get().aps.find(a=>a.id===b.dataset.eap)));
    q('#c-pdf')&&(q('#c-pdf').onclick=()=>pdfTalhao(sel.tal));
  }
  function propSheet(pid,focoTal){
    const c=get();const p=pid?JSON.parse(JSON.stringify(c.props.find(x=>x.id===pid))):{id:X.uid(),nome:'',mun:'',talhoes:[]};
    if(focoTal||!p.talhoes.length)p.talhoes.push({id:X.uid(),nome:'',area:'',cultura:''});
    const draw=()=>X.openSheet(pid?'Editar propriedade':'Nova propriedade',`<div class="box"><div class="fgrid">
        <label class="ffield full">Nome da propriedade<input id="p-nome" value="${esc(p.nome)}" placeholder="Ex.: Fazenda Santa Rita"></label>
        <label class="ffield full">Município/UF<input id="p-mun" value="${esc(p.mun)}"></label></div></div>
      <div class="box"><h3>Talhões</h3>${p.talhoes.map((t,i)=>`<div class="ritem"><div class="fgrid">
        <label class="ffield">Nome<input data-t="${i}" data-k="nome" value="${esc(t.nome)}" placeholder="Ex.: Talhão 3"></label>
        <label class="ffield">Área (ha)<input data-t="${i}" data-k="area" inputmode="decimal" value="${esc(t.area)}"></label>
        <label class="ffield full">Cultura da safra<input data-t="${i}" data-k="cultura" value="${esc(t.cultura)}" list="dlCult"></label></div>
        <button class="btn ghost" type="button" data-tdel="${i}" style="justify-self:start">Remover talhão</button></div>`).join('')}
        <button class="btn ghost" id="p-addt" type="button">+ Talhão</button></div>
      <div class="btnrow"><button class="btn" id="p-salvar">Salvar</button>${pid?'<button class="btn ghost" id="p-del">Excluir propriedade</button>':''}</div><p class="muted" id="p-msg"></p>`,sh=>{
        const sync=()=>{p.nome=sh.querySelector('#p-nome').value.trim();p.mun=sh.querySelector('#p-mun').value.trim();sh.querySelectorAll('[data-t]').forEach(el=>{p.talhoes[+el.dataset.t][el.dataset.k]=el.value.trim()})};
        sh.querySelector('#p-addt').onclick=()=>{sync();p.talhoes.push({id:X.uid(),nome:'',area:'',cultura:''});draw()};
        sh.querySelectorAll('[data-tdel]').forEach(b=>b.onclick=()=>{sync();const t=p.talhoes[+b.dataset.tdel];if(get().aps.some(a=>a.tid===t.id)&&!confirm('Este talhão tem aplicações registradas, que também serão apagadas. Continuar?'))return;p.talhoes.splice(+b.dataset.tdel,1);draw()});
        sh.querySelector('#p-salvar').onclick=()=>{sync();if(!p.nome){sh.querySelector('#p-msg').textContent='Dê um nome à propriedade.';return}
          p.talhoes=p.talhoes.filter(t=>t.nome);const c2=get();const ids=new Set(p.talhoes.map(t=>t.id));const old=c2.props.find(x=>x.id===p.id);
          if(old)old.talhoes.forEach(t=>{if(!ids.has(t.id))c2.aps=c2.aps.filter(a=>a.tid!==t.id)});
          const i=c2.props.findIndex(x=>x.id===p.id);if(i>=0)c2.props[i]=p;else c2.props.push(p);put(c2);
          if(p.talhoes.length&&(!sel.tal||!ids.has(sel.tal)))setSel({prop:p.id,tal:p.talhoes[p.talhoes.length-1].id});
          X.closeSheet()};
        const del=sh.querySelector('#p-del');if(del)del.onclick=()=>{if(!confirm('Excluir a propriedade e todas as aplicações registradas nela?'))return;const c2=get();const ids=new Set(p.talhoes.map(t=>t.id));c2.props=c2.props.filter(x=>x.id!==p.id);c2.aps=c2.aps.filter(a=>!ids.has(a.tid));put(c2);X.closeSheet()};
      });
    draw();
  }
  function apSheet(ap){
    ap=JSON.parse(JSON.stringify(ap));const c=get();
    const draw=()=>X.openSheet('Aplicação',`<div class="box"><div class="fgrid">
        <label class="ffield full">Talhão<select id="a-tid">${talhoes(c).map(t=>`<option value="${t.id}" ${t.id===ap.tid?'selected':''}>${esc(t.prop.nome+' · '+t.nome)}</option>`).join('')}</select></label>
        <label class="ffield">Data<input id="a-data" type="date" value="${esc(ap.data)}"></label>
        <label class="ffield">Área aplicada (ha)<input id="a-area" inputmode="decimal" value="${esc(ap.area)}"></label>
        <label class="ffield">Volume de calda (L/ha)<input id="a-vol" inputmode="decimal" value="${esc(ap.vol)}"></label></div></div>
      <div class="box"><h3>Produtos</h3>${ap.itens.map((it,i)=>`<div class="ritem"><div class="rh"><div><b>${esc(it.nome)}</b><span class="muted">${esc(it.sub||'')}</span> ${X.moasOf(it).map(window.SAF.moaPill).join(' ')}</div><button class="xbtn" type="button" data-idel="${i}" aria-label="Remover ${esc(it.nome)}">×</button></div>
        <div class="rgrid"><label class="ffield">Dose/ha<span class="gin sm"><input data-i="${i}" data-k="dose" inputmode="decimal" value="${esc(it.dose)}"><select data-i="${i}" data-k="un" aria-label="Unidade"><option ${it.un==='L'?'selected':''}>L</option><option ${it.un==='kg'?'selected':''}>kg</option><option ${it.un==='mL'?'selected':''}>mL</option><option ${it.un==='g'?'selected':''}>g</option></select></span></label>
        <label class="ffield">Carência (dias)<input data-i="${i}" data-k="car" inputmode="numeric" value="${esc(it.car)}" placeholder="bula"></label></div></div>`).join('')||'<p class="muted" style="margin:0">Adicione os produtos aplicados.</p>'}
        ${X.pickerHtml('a-busca')}</div>
      <div class="box"><label class="ffield">Observações (clima, equipamento, operador…)<textarea id="a-obs" rows="3">${esc(ap.obs)}</textarea></label></div>
      <div class="btnrow"><button class="btn" id="a-salvar">Salvar aplicação</button>${c.aps.some(a=>a.id===ap.id)?'<button class="btn ghost" id="a-del">Excluir</button>':''}</div><p class="muted" id="a-msg"></p>`,sh=>{
        const sync=()=>{ap.tid=sh.querySelector('#a-tid').value;ap.data=sh.querySelector('#a-data').value||X.hoje();ap.area=sh.querySelector('#a-area').value;ap.vol=sh.querySelector('#a-vol').value;ap.obs=sh.querySelector('#a-obs').value;sh.querySelectorAll('[data-i]').forEach(el=>{ap.itens[+el.dataset.i][el.dataset.k]=el.value})};
        sh.querySelectorAll('[data-idel]').forEach(b=>b.onclick=()=>{sync();ap.itens.splice(+b.dataset.idel,1);draw()});
        X.pickerBind(sh,'a-busca',it=>{sync();ap.itens.push(it);draw()});
        sh.querySelector('#a-salvar').onclick=()=>{sync();if(!ap.itens.length){sh.querySelector('#a-msg').textContent='Adicione pelo menos um produto.';return}
          const c2=get();const i=c2.aps.findIndex(a=>a.id===ap.id);ap.itens.forEach(it=>delete it.preco);if(i>=0)c2.aps[i]=ap;else c2.aps.push(ap);put(c2);setSel({prop:'',tal:ap.tid});X.setSub('cad');X.closeSheet();window.SAF.goTab('meus')};
        const del=sh.querySelector('#a-del');if(del)del.onclick=()=>{if(!confirm('Excluir esta aplicação?'))return;const c2=get();c2.aps=c2.aps.filter(a=>a.id!==ap.id);put(c2);X.closeSheet()};
      });
    draw();
  }
  function fromRec(r){
    const c=get();
    if(!talhoes(c).length){alert('Cadastre primeiro a propriedade e o talhão no Caderno de campo.');X.setSub('cad');window.SAF.render();return}
    const t=talhoes(c).find(t=>X.norm(t.nome)===X.norm(r.talhao))||findTal(c,sel.tal)||talhoes(c)[0];
    apSheet({id:X.uid(),tid:t.id,data:r.data||X.hoje(),area:r.area||t.area||'',vol:r.vazao||'',obs:r.alvo?'Alvo: '+r.alvo:'',itens:r.itens.map(it=>({tipo:it.tipo,ref:it.ref,nome:it.nome,sub:it.sub,form:it.form,un:it.un,dose:it.dose,car:it.car}))});
  }
  function fromCalda(){
    const C=window.SAF.CAL;const c=get();
    if(!talhoes(c).length){X.setSub('cad');window.SAF.goTab('meus');return}
    apSheet({id:X.uid(),tid:sel.tal||talhoes(c)[0].id,data:X.hoje(),area:C.area||'',vol:C.vazao||'',obs:'',itens:(C.itens||[]).map(it=>({tipo:it.tipo,ref:it.ref,nome:it.nome,sub:it.sub||'',form:it.form||'',un:it.un||'L',dose:it.dose||'',car:''}))});
  }
  async function pdfTalhao(tid){
    const p=X.perfil();if(!p.nome){X.perfilSheet(()=>pdfTalhao(tid));return}
    const c=get();const t=findTal(c,tid);if(!t)return;const a=analisa(c,tid);
    const d=new SafPDF.Doc();const L=40,R=d.W-40,CW=R-L,BOT=d.H-60;
    const cab=()=>{d.rect(0,0,d.W,92,{fill:'#1E7A3E'});d.text(40,40,'CADERNO DE CAMPO',{bold:true,size:15,color:'#FFFFFF'});d.text(40,58,`${t.prop.nome} · ${t.nome}${t.area?' · '+t.area+' ha':''}${t.cultura?' · '+t.cultura:''}`,{size:10,color:'#D7F0DC'});
      d.text(R,40,p.nome,{bold:true,size:10.5,color:'#FFFFFF',align:'right'});d.text(R,55,[p.titulo,p.crea&&('CREA/CFTA '+p.crea)].filter(Boolean).join(' · '),{size:8.5,color:'#D7F0DC',align:'right'});d.text(R,69,'Emitido em '+X.fmtD(X.hoje()),{size:8.5,color:'#F4B62A',align:'right',bold:true})};
    cab();let y=118;
    const nova=h=>{if(y+h>BOT){d.addPage();cab();y=118}};
    if(t.prop.mun){d.text(L,y,'Município: '+t.prop.mun,{size:9.5,color:'#4F6155'});y+=16}
    if(a.lib){d.rect(L,y,CW,24,{fill:'#E3F2E6',r:6});d.text(L+10,y+15.5,a.lib>X.hoje()?`Colheita liberada a partir de ${X.fmtD(a.lib)} (carência de ${a.libProd})`:`Carência cumprida desde ${X.fmtD(a.lib)}`,{bold:true,size:9.5,color:'#1E7A3E'});y+=34}
    if(a.al.length){const txt=a.al.map(x=>x.replace(/<[^>]+>/g,''));const h=txt.reduce((s,x)=>s+d.measure(x,CW-24,{size:9,lh:11.5})+3,0)+12;nova(h);d.rect(L,y,CW,h,{fill:'#FDF1D3',r:6});let yy=y+6;txt.forEach(x=>{d.text(L+8,yy+10,'!',{bold:true,size:10,color:'#C4561C'});yy+=d.para(L+18,yy,x,CW-24,{size:9,lh:11.5,color:'#4A3500'})+3});y+=h+12}
    const cols=[{t:'Data',w:CW*0.12},{t:'Produtos e doses',w:CW*0.46},{t:'Grupos',w:CW*0.18},{t:'Área',w:CW*0.1},{t:'Carência',w:CW*0.14}];
    const head=()=>{d.rect(L,y,CW,20,{fill:'#F4F7F2'});let x=L+5;cols.forEach(cc=>{d.text(x,y+13.5,cc.t,{bold:true,size:8.5,color:'#4F6155'});x+=cc.w});y+=20};
    head();
    a.aps.forEach((ap,i)=>{
      const prods=ap.itens.map(it=>`${it.nome}${pnum(it.dose)>0?` (${it.dose} ${it.un}/ha)`:''}`).join('\n');
      const grupos=moasAp(ap).map(m=>m.key).join(', ')||'—';
      const car=ap.itens.map(it=>parseInt(it.car,10)).filter(n=>n>=0);const lib=car.length?X.fmtD(X.addDias(ap.data,Math.max(...car))):'—';
      const extra=ap.obs?'\nObs.: '+ap.obs:'';
      const h=Math.max(d.measure(prods+extra,cols[1].w-8,{size:8.5,lh:11}),d.measure(grupos,cols[2].w-8,{size:8.5,lh:11}))+12;
      if(y+h>BOT){d.addPage();cab();y=118;head()}
      if(i%2)d.rect(L,y,CW,h,{fill:'#FBFCFA'});if(ap._rep)d.rect(L,y,3,h,{fill:'#C4561C'});
      let x=L+5;d.text(x,y+13,X.fmtD(ap.data),{bold:true,size:8.5});x+=cols[0].w;
      d.para(x,y+3,prods+extra,cols[1].w-8,{size:8.5,lh:11});x+=cols[1].w;
      d.para(x,y+3,grupos,cols[2].w-8,{size:8.5,lh:11,bold:true,color:'#7A5200'});x+=cols[2].w;
      d.text(x,y+13,ap.area?ap.area+' ha':'—',{size:8.5});x+=cols[3].w;
      d.text(x,y+13,lib,{size:8.5});
      d.line(L,y+h,R,y+h,{color:'#E3E9E1'});y+=h;
    });
    y+=16;nova(30);d.text(L,y,'Grupos de resistência (FRAC, IRAC, HRAC) estimados pelo grupo químico do AGROFIT. Confirme sempre na bula.',{size:7.5,color:'#4F6155'});
    const n=d.pageCount;for(let i=0;i<n;i++){d.usePage(i);d.line(L,d.H-34,R,d.H-34,{color:'#DCE5DA'});d.text(L,d.H-22,'Gerado com o app Safrou',{size:7.5,color:'#4F6155'});d.text(R,d.H-22,`Página ${i+1} de ${n}`,{size:7.5,color:'#4F6155',align:'right'})}
    await X.shareFile(d.output(),`caderno-${X.slug(t.prop.nome)}-${X.slug(t.nome)}.pdf`,'Caderno de campo');
  }
  return {html,bind,fromRec,fromCalda,apSheet,analisa,get};
})();
/* Safrou Pro — condições de pulverização (previsão MET Norway) e ganchos da aba Calda */
const CLIMA=(function(){
  const X=SAFPRO,esc=X.esc,n2=X.n2;
  const K='saf:clima:v1';
  const UA='Safrou/1.0 suporte.safrou@gmail.com';
  let carregando=false,erro='';
  // temperatura de bulbo úmido (Stull, 2011) e Delta T
  function deltaT(t,rh){const tw=t*Math.atan(0.151977*Math.sqrt(rh+8.313659))+Math.atan(t+rh)-Math.atan(rh-1.676331)+0.00391838*Math.pow(rh,1.5)*Math.atan(0.023101*rh)-4.686035;return t-tw}
  function avalia(h){
    let n=0;const m=[];const up=(k,txt)=>{if(k>n)n=k;m.push(txt)};
    if(h.p>=1)up(2,'chuva prevista');else if(h.p>0.2)up(1,'possibilidade de chuva');
    if(h.w>15)up(2,'vento forte');else if(h.w>10)up(1,'vento acima do ideal');else if(h.w<3)up(1,'vento muito fraco: risco de inversão térmica');
    if(h.dt>10)up(2,'Delta T alto: gotas evaporam');else if(h.dt>8)up(1,'Delta T no limite');else if(h.dt<2)up(1,'Delta T baixo: risco de deriva e escorrimento');
    if(h.t>30&&n<2)up(1,'temperatura acima de 30 °C');
    return {n,m};
  }
  function parse(json){
    const ts=(json&&json.properties&&json.properties.timeseries)||[];const agora=Date.now()-30*60e3;
    return ts.filter(x=>new Date(x.time).getTime()>=agora).slice(0,24).map(x=>{
      const d=x.data.instant.details;const p=x.data.next_1_hours?x.data.next_1_hours.details.precipitation_amount:(x.data.next_6_hours?x.data.next_6_hours.details.precipitation_amount/6:0);
      const h={time:x.time,t:d.air_temperature,rh:d.relative_humidity,w:d.wind_speed*3.6,p:p||0};h.dt=deltaT(h.t,h.rh);const a=avalia(h);h.n=a.n;h.m=a.m;return h});
  }
  async function local(){
    const G=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Geolocation;
    if(X.native()&&G){try{await G.requestPermissions()}catch(e){}const p=await G.getCurrentPosition({enableHighAccuracy:false,timeout:15000,maximumAge:30*60e3});return {lat:p.coords.latitude,lon:p.coords.longitude}}
    return await new Promise((res,rej)=>{if(!navigator.geolocation)return rej(new Error('Localização indisponível'));navigator.geolocation.getCurrentPosition(p=>res({lat:p.coords.latitude,lon:p.coords.longitude}),e=>rej(e),{timeout:15000,maximumAge:30*60e3})});
  }
  async function baixa(lat,lon){
    const url=`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat.toFixed(2)}&lon=${lon.toFixed(2)}`;
    const H=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.CapacitorHttp;
    if(X.native()&&H){const r=await H.get({url,headers:{'User-Agent':UA,'Accept':'application/json'},responseType:'json'});if(r.status!==200)throw new Error('Previsão indisponível ('+r.status+')');return typeof r.data==='string'?JSON.parse(r.data):r.data}
    const r=await fetch(url,{headers:{'Accept':'application/json'}});if(!r.ok)throw new Error('Previsão indisponível ('+r.status+')');return r.json();
  }
  async function atualiza(forcar){
    const c=X.ls.get(K,null);
    if(!forcar&&c&&Date.now()-c.em<90*60e3)return;
    carregando=true;erro='';rerender();
    try{const pos=c&&!forcar&&c.pos?c.pos:await local();const j=await baixa(pos.lat,pos.lon);X.ls.set(K,{em:Date.now(),pos:{lat:+pos.lat.toFixed(2),lon:+pos.lon.toFixed(2)},horas:parse(j)})}
    catch(e){erro=e&&e.code===1?'Permita o acesso à localização para ver a previsão do seu local.':(e&&e.message)||'Não foi possível obter a previsão.'}
    carregando=false;rerender();
  }
  function rerender(){if(window.SAF&&window.SAF.tab==='cal'&&document.getElementById('sheet').hidden){const y=window.scrollY;window.SAF.render();window.scrollTo(0,y)}}
  const hhmm=iso=>{const d=new Date(iso);return String(d.getHours()).padStart(2,'0')+'h'};
  function janelas(hs){const out=[];let ini=null;hs.forEach((h,i)=>{if(h.n===0){if(ini===null)ini=i}else if(ini!==null){out.push([ini,i-1]);ini=null}});if(ini!==null)out.push([ini,hs.length-1]);
    return out.filter(([a,b])=>b-a>=1).slice(0,3).map(([a,b])=>`${hhmm(hs[a].time)}–${String((new Date(hs[b].time).getHours()+1)%24).padStart(2,'0')}h`)}
  const ROT=['Pode aplicar','Atenção','Não aplique'];
  function card(){
    const titulo=`<h3>Condições de pulverização <span class="probadge">Pro</span></h3>`;
    if(!X.isPro())return `<div class="clima">${titulo}
      <div class="blur" aria-hidden="true"><div class="semaf s0"><span class="dot">OK</span><div><b>Pode aplicar</b><span class="muted">Vento 6 km/h · Delta T 5,2 °C</span></div></div></div>
      <p class="muted" style="margin:0">Vento, Delta T, umidade e chuva das próximas 24 horas no seu local, com a indicação de quando pode pulverizar.</p>
      <button class="btn pro" data-paywall>${X.native()?'Desbloquear com o Safrou Pro':'Conhecer o Safrou Pro'}</button></div>`;
    const c=X.ls.get(K,null);
    if(!c||!c.horas||!c.horas.length)return `<div class="clima">${titulo}<p class="muted" style="margin:0">Veja agora se as condições estão boas para pulverizar no seu local.</p>
      <button class="btn" id="cl-ver" ${carregando?'disabled':''}>${carregando?'Buscando previsão…':'Ver condições no meu local'}</button>${erro?`<p class="note">${esc(erro)}</p>`:''}</div>`;
    const h=c.horas[0];const jan=janelas(c.horas);const velho=Date.now()-c.em>3*3600e3;
    return `<div class="clima">${titulo}
      <div class="semaf s${h.n}"><span class="dot">${h.n===0?'OK':h.n===1?'!':'✕'}</span><div><b>${ROT[h.n]} agora</b><span class="muted">${h.m.length?esc(h.m.join(' · ')):'Condições dentro do ideal'}</span></div></div>
      <div class="cmet"><div><span>Vento</span><b>${n2(h.w,0)}</b><span>km/h</span></div><div><span>Delta T</span><b>${n2(h.dt,1)}</b><span>°C</span></div><div><span>Temp.</span><b>${n2(h.t,0)}°</b><span>UR ${n2(h.rh,0)}%</span></div><div><span>Chuva</span><b>${n2(h.p,1)}</b><span>mm/h</span></div></div>
      <div class="hstrip" role="img" aria-label="Próximas 24 horas: verde pode aplicar, amarelo atenção, vermelho não aplique">${c.horas.map(x=>`<div><i class="h${x.n}" title="${hhmm(x.time)}: ${ROT[x.n]}"></i>${hhmm(x.time)}</div>`).join('')}</div>
      <p style="margin:0">${jan.length?`Melhores janelas: <b>${jan.join(' · ')}</b>`:'Sem janela ideal nas próximas 24 horas.'}</p>
      <div class="btnrow" style="align-items:center"><button class="btn ghost" id="cl-at" ${carregando?'disabled':''}>${carregando?'Atualizando…':'Atualizar'}</button><span class="muted" style="font-size:12.5px">${velho?'⚠ ':''}Atualizado às ${new Date(c.em).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · Previsão: MET Norway</span></div>
      ${erro?`<p class="note">${esc(erro)}</p>`:''}
      <p class="muted" style="margin:0;font-size:12.5px">Referência: vento 3–10 km/h, Delta T 2–8 °C, sem chuva. É uma previsão; confira as condições no local antes de aplicar.</p></div>`;
  }
  function bind(v){
    X.bindTeaser(v);
    const ver=v.querySelector('#cl-ver');if(ver)ver.onclick=()=>atualiza(true);
    const at=v.querySelector('#cl-at');if(at)at.onclick=()=>atualiza(true);
    if(X.isPro()){const c=X.ls.get(K,null);if(c&&c.pos&&Date.now()-c.em>90*60e3&&!carregando&&navigator.onLine)atualiza(false)}
  }
  return {card,bind,atualiza,deltaT,avalia};
})();

/* ganchos da aba Calda */
SAFPRO.caldaTop=()=>SAFPRO.proOn()?CLIMA.card():'';
SAFPRO.caldaRecBtn=()=>!SAFPRO.proOn()?'':`<div class="btnrow"><button class="btn ${SAFPRO.isPro()?'':'pro'}" id="k-rec">${SAFPRO.isPro()?'':SAFPRO.LOCK+' '}Gerar recomendação em PDF</button><button class="btn ghost" id="k-cad">${SAFPRO.isPro()?'':SAFPRO.LOCK+' '}Registrar no caderno de campo</button></div>`;
SAFPRO.caldaBind=()=>{
  const v=document.getElementById('view');CLIMA.bind(v);
  const r=v.querySelector('#k-rec');if(r)r.onclick=()=>SAFPRO.isPro()?REC.fromCalda():SAFPRO.paywall();
  const c=v.querySelector('#k-cad');if(c)c.onclick=()=>SAFPRO.isPro()?CAD.fromCalda():SAFPRO.paywall();
};

/* ---------- Plantabilidade: sementes por metro ↔ população por hectare (grátis) ---------- */
const PLANTAB=(function(){
  const X=SAFPRO,esc=X.esc,pnum=X.pnum,n2=X.n2;
  const K='saf:plantab:v1';
  const CULT={Soja:{esp:'50',germ:'85',pms:''},Milho:{esp:'50',germ:'95',pms:'',saco:'60000'},'Algodão':{esp:'90',germ:'80',pms:''},'Feijão':{esp:'45',germ:'85',pms:''},Trigo:{esp:'17',germ:'85',pms:''},Outra:{}};
  let st=Object.assign({cult:'Soja',modo:'pop',esp:'50',pop:'',sem:'',germ:'85',perda:'',pms:'',saco:'',area:''},X.ls.get(K,{}));
  const save=()=>X.ls.set(K,st);
  let SUBP=X.ls.get('saf:plantsub','zarc');
  function seg(){return `<div class="seg" role="group" aria-label="Seções do plantio"><button data-psub="zarc" aria-pressed="${SUBP==='zarc'}">Janela de plantio</button><button data-psub="sem" aria-pressed="${SUBP==='sem'}">Plantabilidade</button></div>`}
  function segBind(){document.querySelectorAll('#view [data-psub]').forEach(b=>b.onclick=()=>{SUBP=b.dataset.psub;X.ls.set('saf:plantsub',SUBP);window.SAF.render();window.scrollTo(0,0)})}
  function calc(){
    const esp=pnum(st.esp);const fator=esp>0?1e6/esp:NaN; // metros lineares por hectare
    const g=pnum(st.germ)>0?pnum(st.germ)/100:1,s=1-(pnum(st.perda)>0?pnum(st.perda)/100:0);const ef=g*s;
    let pl_m,sem_m,pl_ha,sem_ha;
    if(st.modo==='pop'){pl_ha=pnum(st.pop);pl_m=pl_ha/fator;sem_m=pl_m/ef;sem_ha=sem_m*fator}
    else{sem_m=pnum(st.sem);sem_ha=sem_m*fator;pl_m=sem_m*ef;pl_ha=sem_ha*ef}
    const dist=sem_m>0?100/sem_m:NaN;const pms=pnum(st.pms),saco=pnum(st.saco),area=pnum(st.area);
    return {fator,ef,pl_m,sem_m,pl_ha,sem_ha,dist,kg:pms>0?sem_ha*pms/1e6:NaN,sacos:saco>0?sem_ha/saco:NaN,area};
  }
  const ok=n=>isFinite(n)&&n>0;
  function resultado(){
    const r=calc();if(!ok(r.fator))return '<p class="muted" style="margin:0">Informe o espaçamento entre linhas.</p>';
    const temBase=st.modo==='pop'?ok(r.pl_ha):ok(r.sem_m);
    const kp=`<div class="kpis"><div><span>Metros de linha por ha</span><b>${n2(r.fator,0)} m</b><small>10.000 ÷ ${esc(n2(pnum(st.esp)/100,2))} m</small></div></div>`;
    if(!temBase)return kp+`<p class="muted" style="margin:0">${st.modo==='pop'?'Digite a população desejada (plantas por hectare).':'Digite quantas sementes por metro a plantadeira está soltando.'}</p>`;
    const perdasTxt=r.ef<1?`considerando ${n2(r.ef*100,0)}% de aproveitamento (germinação${pnum(st.perda)>0?' e perdas':''})`:'sem descontar germinação';
    const principal=st.modo==='pop'
      ?`<div class="semaf s0" style="grid-template-columns:1fr"><div><span class="muted">Regule a plantadeira para</span><b style="font-size:30px">${n2(r.sem_m,1)} sementes por metro</b><span class="muted">${perdasTxt} · ${n2(r.pl_m,1)} plantas por metro no estande</span></div></div>`
      :`<div class="semaf s0" style="grid-template-columns:1fr"><div><span class="muted">População esperada</span><b style="font-size:30px">${n2(r.pl_ha,0)} plantas/ha</b><span class="muted">${perdasTxt} · ${n2(r.pl_m,1)} plantas por metro</span></div></div>`;
    const area=ok(r.area);
    return kp+principal+`<div class="cmet" style="grid-template-columns:repeat(2,minmax(0,1fr))">
      <div><span>Sementes por ha</span><b>${n2(r.sem_ha,0)}</b></div>
      <div><span>Distância entre sementes</span><b>${n2(r.dist,1)} cm</b></div>
      ${ok(r.kg)?`<div><span>Semente por ha</span><b>${n2(r.kg,1)} kg</b></div>`:''}
      ${ok(r.sacos)?`<div><span>Sacos por ha</span><b>${n2(r.sacos,2)}</b></div>`:''}
      ${area?`<div><span>Sementes na área</span><b>${n2(r.sem_ha*r.area,0)}</b></div>`:''}
      ${area&&ok(r.kg)?`<div><span>Semente na área</span><b>${n2(r.kg*r.area,0)} kg</b></div>`:''}
      ${area&&ok(r.sacos)?`<div><span>Sacos na área</span><b>${n2(Math.ceil(r.sacos*r.area),0)}</b></div>`:''}
    </div>
    <p class="note" style="margin:0">Na conferência a campo: em <b>10 metros</b> de linha você deve contar cerca de <b>${n2(r.sem_m*10,0)} sementes</b> caindo${r.ef<1?` e, depois da emergência, <b>${n2(r.pl_m*10,0)} plantas</b>`:''}.</p>`;
  }
  function render(){
    const v=document.getElementById('view');
    const chip=(k,val,lab)=>`<button class="chip" data-set="${k}" data-val="${esc(val)}" aria-pressed="${String(st[k])===String(val)}">${esc(lab||val)}</button>`;
    v.innerHTML=`${seg()}
    <div class="box calc"><h3>Plantabilidade · sementes por metro</h3>
      <div class="filters">${Object.keys(CULT).map(c=>chip('cult',c)).join('')}</div>
      <div class="ffield">Espaçamento entre linhas (cm)<div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center"><input id="pt-esp" inputmode="decimal" value="${esc(st.esp)}" style="max-width:110px">${['45','50','76','90'].map(e=>chip('esp',e,e+' cm')).join('')}</div></div>
      <div class="seg" role="group" aria-label="Tipo de cálculo"><button data-modo="pop" aria-pressed="${st.modo==='pop'}">Tenho a população</button><button data-modo="sem" aria-pressed="${st.modo==='sem'}">Tenho sementes/metro</button></div>
      <div class="fgrid">
        ${st.modo==='pop'?`<label class="ffield full">População desejada (plantas/ha)<input id="pt-pop" inputmode="numeric" placeholder="Ex.: 280.000" value="${esc(st.pop)}"></label>`
          :`<label class="ffield full">Sementes por metro na plantadeira<input id="pt-sem" inputmode="decimal" placeholder="Ex.: 14" value="${esc(st.sem)}"></label>`}
        <label class="ffield">Germinação (%)<input id="pt-germ" inputmode="decimal" placeholder="Ex.: 85" value="${esc(st.germ)}"></label>
        <label class="ffield">Perdas no campo (%)<input id="pt-perda" inputmode="decimal" placeholder="opcional" value="${esc(st.perda)}"></label>
        <label class="ffield">PMS (g / 1000 sementes)<input id="pt-pms" inputmode="decimal" placeholder="opcional" value="${esc(st.pms)}"></label>
        <label class="ffield">Sementes por saco<input id="pt-saco" inputmode="numeric" placeholder="${st.cult==='Milho'?'Ex.: 60.000':'opcional'}" value="${esc(st.saco)}"></label>
        <label class="ffield full">Área a plantar (ha)<input id="pt-area" inputmode="decimal" placeholder="opcional" value="${esc(st.area)}"></label>
      </div>
      <div id="pt-res" style="display:grid;gap:10px">${resultado()}</div>
      <p class="muted" style="margin:0">Fórmula: metros de linha por hectare = 10.000 ÷ espaçamento (m). Com 50 cm são 20.000 m; com 45 cm, 22.222 m. Plantas/ha = plantas por metro × metros por hectare. A germinação vem do boletim do lote; as perdas cobrem falhas de emergência e de plantio.</p>
    </div>`;
    segBind();
    const upd=()=>{save();const r=document.getElementById('pt-res');if(r)r.innerHTML=resultado()};
    [['pt-esp','esp'],['pt-pop','pop'],['pt-sem','sem'],['pt-germ','germ'],['pt-perda','perda'],['pt-pms','pms'],['pt-saco','saco'],['pt-area','area']].forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.oninput=()=>{st[k]=el.value;upd();if(k==='esp')v.querySelectorAll('[data-set="esp"]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.val===el.value))}});
    v.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{const k=b.dataset.set,val=b.dataset.val;st[k]=val;if(k==='cult'){const c=CULT[val]||{};['esp','germ','pms','saco'].forEach(f=>{if(c[f]!==undefined)st[f]=c[f]})}save();render()});
    v.querySelectorAll('[data-modo]').forEach(b=>b.onclick=()=>{st.modo=b.dataset.modo;save();render()});
  }
  return {seg,segBind,render,sub:()=>SUBP,calc};
})();
SAFPRO.plantSeg=()=>PLANTAB.seg();
SAFPRO.plantSegBind=()=>PLANTAB.segBind();
SAFPRO.plantSub=()=>PLANTAB.sub();
SAFPRO.renderPlantab=()=>PLANTAB.render();
