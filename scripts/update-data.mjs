// Robô de atualização das bases do Safrou (roda no GitHub Actions, todo mês).
// Baixa os dados oficiais do MAPA, gera os JSON no formato do app em docs/data/ e o manifest.json.
// Cada base é independente: se uma falhar, as outras seguem e a versão anterior é mantida.
import fs from 'node:fs';import path from 'node:path';import WebSocket from 'ws';
const OUT=path.resolve('docs/data');fs.mkdirSync(OUT,{recursive:true});
const CKAN='https://dados.agricultura.gov.br/api/3/action/package_show?id=';
const log=(...a)=>console.log(new Date().toISOString().slice(11,19),...a);
const readJSON=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'))}catch{return null}};
const prevOf=name=>readJSON(path.join(OUT,name+'.json'))||readJSON(path.join('www/data',name+'.json'));
const save=(name,obj)=>{fs.writeFileSync(path.join(OUT,name+'.json'),JSON.stringify(obj).replace(/\x96/g,'–').replace(/\x99/g,'™'));log('salvo',name,(fs.statSync(path.join(OUT,name+'.json')).size/1e6).toFixed(2)+' MB')};
async function pkg(id){const r=await fetch(CKAN+id);if(!r.ok)throw new Error('CKAN '+r.status);return (await r.json()).result}
// lê CSV em streaming, linha a linha, respeitando aspas
async function* csvRows(url,sep=';'){
  const r=await fetch(url);if(!r.ok)throw new Error('download '+r.status+' '+url);
  const rd=r.body.pipeThrough(new TextDecoderStream('utf-8')).getReader();let buf='',carry='';
  const parse=l=>{const row=[];let f='',q=false;for(let i=0;i<l.length;i++){const c=l[i];if(q){if(c==='"'){if(l[i+1]==='"'){f+='"';i++}else q=false}else f+=c}else{if(c==='"'&&f.trim()==='')q=true;else if(c===sep){row.push(f);f=''}else f+=c}}row.push(f);return [row,q]};
  for(;;){const {done,value}=await rd.read();if(done)break;buf+=value;let st=0,e;
    while((e=buf.indexOf('\n',st))>=0){let l=carry+buf.slice(st,e).replace(/\r$/,'');st=e+1;const [row,open]=parse(l);if(open){carry=l+'\n';continue}carry='';yield row}
    buf=buf.slice(st)}
  if(buf){const [row]=parse(carry+buf);yield row}
}
const interner=()=>{const S=[],SI=new Map();return {S,s:v=>{v=(v||'').trim().replace(/\s+/g,' ');let i=SI.get(v);if(i===undefined){i=S.length;S.push(v);SI.set(v,i)}return i}}};

// ---------- 1. AGROFIT (defensivos) ----------
async function agrofit(){
  const p=await pkg('sistema-de-agrotoxicos-fitossanitarios-agrofit');
  const res=p.resources.find(r=>/produto formulado/i.test(r.name));if(!res)throw new Error('recurso Produto Formulado não encontrado');
  const prev=prevOf('agrofit');
  if(prev&&prev.fonteModificada===res.last_modified){log('AGROFIT sem mudança');return}
  const {S,s}=interner();const PRI=new Map(),PR=[];const pr=(a,b)=>{const k=a+'|'+b;let i=PRI.get(k);if(i===undefined){i=PR.length;PR.push([s(a),s(b)]);PRI.set(k,i)}return i};
  const P=new Map();let idx=null,n=0;
  for await(const r of csvRows(res.url)){
    if(!idx){const h=r.map(x=>x.replace(/^﻿/,'').trim());idx=Object.fromEntries(h.map((k,i)=>[k,i]));
      for(const k of ['NR_REGISTRO','MARCA_COMERCIAL','FORMULACAO','INGREDIENTE_ATIVO','TITULAR_DE_REGISTRO','CLASSE','MODO_DE_ACAO','CULTURA','PRAGA_NOME_CIENTIFICO','PRAGA_NOME_COMUM','CLASSE_TOXICOLOGICA','CLASSE_AMBIENTAL','ORGANICOS','SITUACAO'])if(idx[k]===undefined)throw new Error('coluna ausente '+k);continue}
    const g=k=>r[idx[k]]||'';if(/^false$/i.test(g('SITUACAO').trim()))continue;n++;
    const reg=g('NR_REGISTRO').trim();let x=P.get(reg);
    if(!x){x={r:reg,m:g('MARCA_COMERCIAL').trim().replace(/\s+/g,' '),f:s(g('FORMULACAO')),ia:g('INGREDIENTE_ATIVO').trim().replace(/\s+/g,' '),t:s(g('TITULAR_DE_REGISTRO')),c:s(g('CLASSE')),mo:s(g('MODO_DE_ACAO')),tx:s(g('CLASSE_TOXICOLOGICA')),am:s(g('CLASSE_AMBIENTAL')),o:s(g('ORGANICOS')),u:new Map()};P.set(reg,x)}
    const cu=s(g('CULTURA'));let set=x.u.get(cu);if(!set){set=new Set();x.u.set(cu,set)}set.add(pr(g('PRAGA_NOME_CIENTIFICO'),g('PRAGA_NOME_COMUM')));
  }
  const prods=[...P.values()].map(x=>({...x,u:[...x.u].map(([c,set])=>[c,[...set]])}));
  if(prods.length<3000)throw new Error('poucos produtos ('+prods.length+'), abortando');
  const out={v:1,fonte:'AGROFIT/MAPA - Produto Formulado',gerado:new Date().toISOString(),fonteModificada:res.last_modified,linhas:n,S,PR,P:prods};
  if(prev&&Array.isArray(prev.P)){const nome=x=>x.m.split(';')[0].trim();const a=new Map(prev.P.map(x=>[x.r,nome(x)])),b=new Map(prods.map(x=>[x.r,nome(x)]));
    const novos=[...b].filter(([r])=>!a.has(r)),saiu=[...a].filter(([r])=>!b.has(r));
    out.mudancas={de:prev.gerado||'',nNovos:novos.length,nRemovidos:saiu.length,novos:novos.slice(0,300),removidos:saiu.slice(0,300)}}
  save('agrofit',out);
}

// ---------- 2. ZARC (janelas de plantio de soja, milho e algodão) ----------
async function zarc(){
  const p=await pkg('tabua-de-risco-zoneamento-agricola-de-risco-climatico');
  const now=new Date();const ini=now.getMonth()>=6?now.getFullYear():now.getFullYear()-1;
  const cands=p.resources.map(r=>({r,m:(r.name||'').match(/Safra (\d{4})\/(\d{4})/)})).filter(x=>x.m).sort((a,b)=>b.m[1]-a.m[1]);
  const pick=cands.find(x=>+x.m[1]===ini)||cands.find(x=>+x.m[1]<=ini);if(!pick)throw new Error('safra ZARC não encontrada');
  const safra=pick.m[1]+'/'+pick.m[2];const prev=prevOf('zarc');
  if(prev&&prev.safra===safra&&prev.fonteModificada===pick.r.last_modified){log('ZARC sem mudança');return}
  const {S,s}=interner();const PAT=[],PI=new Map();const pat=v=>{let i=PI.get(v);if(i===undefined){i=PAT.length;PAT.push(v);PI.set(v,i)}return i};
  const MUN={},R=[];let idx=null,n=0;
  for await(const r of csvRows(pick.r.url)){
    if(!idx){idx=Object.fromEntries(r.map((k,i)=>[k.replace(/^﻿/,'').trim(),i]));continue}
    const g=k=>(r[idx[k]]||'').trim();const c=g('Nome_cultura');if(!c)continue;n++;if(!/soja|milho|algod/i.test(c))continue;
    let d='';for(let k=1;k<=36;k++){const v=g('dec'+k);if(v==='20')d+='2';else if(v==='30')d+='3';else if(v==='40')d+='4';else if(v===''||v==='0')d+='0';else throw new Error('valor inesperado no decêndio: '+v)}
    if(!/[234]/.test(d))continue;const geo=g('geocodigo');if(!MUN[geo])MUN[geo]=[g('UF'),g('municipio')];
    R.push([s(c),+g('Cod_Ciclo')||0,+g('Cod_Solo')||0,+g('Cod_Outros_Manejos')||0,+g('Cod_NM')||0,+g('Cod_Clima')||0,geo,pat(d),s(g('Portaria')),s(g('SafraIni')+'/'+g('SafraFin'))]);
  }
  if(R.length<100000)throw new Error('poucas linhas ZARC ('+R.length+')');
  const out={v:1,fonte:'ZARC/MAPA - Tábua de Risco',safra,gerado:new Date().toISOString(),fonteModificada:pick.r.last_modified,linhas:n,S,PAT,MUN,R};
  const size=JSON.stringify(out).length;if(size>16e6)log('atenção: zarc.json com',(size/1e6).toFixed(1),'MB');
  save('zarc',out);
  const portarias=[...new Set(R.filter(x=>/soja/i.test(S[x[0]])).map(x=>S[x[8]]))];log('portarias de soja:',portarias.length,portarias.slice(0,3).join(', '),'… (confira as faixas de GMR no app se mudarem)');
}

// ---------- 3. SIPEAGRO (fertilizantes registrados) via motor Qlik público ----------
async function sipeagro(){
  const host='mapa-indicadores.agricultura.gov.br',appId='76ef621a-8dc4-48de-8fe0-0aa7e5a47181';
  // pega cookie de sessão anônima da área pública
  const UA={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36','Accept-Language':'pt-BR,pt;q=0.9'};
  const jar=new Map();const jarStr=()=>[...jar].map(([k,v])=>k+'='+v).join('; ');
  let url=`https://${host}/publico/extensions/Fertilizantes/Fertilizantes.html`;
  for(let i=0;i<8;i++){
    const r=await fetch(url,{redirect:'manual',headers:{...UA,...(jar.size?{Cookie:jarStr()}:{})}});
    for(const c of (r.headers.getSetCookie?r.headers.getSetCookie():[])){const kv=c.split(';')[0];const j=kv.indexOf('=');if(j>0)jar.set(kv.slice(0,j).trim(),kv.slice(j+1))}
    const loc=r.headers.get('location');if(r.status<300||r.status>=400||!loc)break;url=new URL(loc,url).href;
  }
  log('SIPEAGRO cookies:',[...jar.keys()].join(',')||'(nenhum)');
  const ws=new WebSocket(`wss://${host}/publico/app/${appId}`,{headers:{...UA,Origin:`https://${host}`,...(jar.size?{Cookie:jarStr()}:{})}});
  ws.on('unexpected-response',(q,res)=>log('SIPEAGRO resposta',res.statusCode,JSON.stringify(res.headers).slice(0,300)));
  let id=0;const pend=new Map();
  ws.on('message',m=>{const d=JSON.parse(m);if(d.id&&pend.has(d.id)){const {res,rej}=pend.get(d.id);pend.delete(d.id);d.error?rej(new Error(JSON.stringify(d.error))):res(d.result)}});
  await new Promise((res,rej)=>{ws.once('open',res);ws.once('error',rej)});
  const call=(handle,method,params=[])=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});ws.send(JSON.stringify({jsonrpc:'2.0',id:i,handle,method,params}))});
  try{
    const doc=(await call(-1,'OpenDoc',[appId])).qReturn.qHandle;
    const Sx='FERTILIZANTE_PROD_SIPE_';
    const dims=[Sx+'NUM_PRODUTO','FERTILIZANTE_ESTAB_SIPE_RAZAO_SOCIAL',Sx+'NM_PRODUTO_SIPE',Sx+'DS_TIPO_FERTILIZANTE',Sx+'NATUREZA_FISICA',Sx+'MODO_APLICACAO',Sx+'DS_CLASSIFICACA',Sx+'DT_CONCESSAO_REGISTRO',Sx+'DS_GARANTIA',Sx+'VL_GARANTIA_COMPONENTE_PROD',Sx+'SG_UNIDADE_MEDIDA_SIPE'];
    const W=dims.length+1;
    const obj=(await call(doc,'CreateSessionObject',[{qInfo:{qType:'x'},qHyperCubeDef:{qDimensions:dims.map(d=>({qDef:{qFieldDefs:[d]},qNullSuppression:false})),qMeasures:[{qDef:{qDef:`Count({<${Sx}SITUACAO_REGISTRO={'Registrado'}>} ${Sx}NUM_PRODUTO)`}}],qSuppressZero:true}}])).qReturn.qHandle;
    const total=(await call(obj,'GetLayout')).qLayout.qHyperCube.qSize.qcy;log('SIPEAGRO linhas',total);
    const {S,s}=interner();const P=new Map();const H=Math.floor(10000/W);
    for(let top=0;top<total;top+=H){
      const pg=await call(obj,'GetHyperCubeData',['/qHyperCubeDef',[{qTop:top,qLeft:0,qWidth:W,qHeight:H}]]);
      for(const row of pg.qDataPages[0].qMatrix){const v=row.map(c=>c.qText==='-'?'':c.qText);const [reg,emp,nome,tipo,nat,modo,cls,dt,g,val,u]=v;
        let p=P.get(reg);if(!p){p={r:reg,e:s(emp),n:s(nome),t:new Set(),f:s(nat),m:new Set(),c:s(cls),d:dt,g:new Map()};P.set(reg,p)}
        p.t.add(s(tipo));p.m.add(s(modo));if(g)p.g.set(g+'|'+u,[s(g),val,s(u)])}
    }
    const out={v:1,fonte:'SIPEAGRO/MAPA - Painel de Indicadores Fertilizantes (produtos registrados)',gerado:new Date().toISOString(),S,P:[...P.values()].map(p=>[p.r,p.e,p.n,[...p.t],p.f,[...p.m],p.c,p.d,[...p.g.values()]])};
    if(out.P.length<50000)throw new Error('poucos produtos SIPEAGRO ('+out.P.length+')');
    save('fertilizantes',out);
  }finally{ws.close()}
}

const etapas=[['AGROFIT',agrofit],['ZARC',zarc],['SIPEAGRO',sipeagro]];
const falhas=[];
for(const [nome,fn] of etapas){try{log('>>',nome);await fn()}catch(e){falhas.push(nome);log('FALHOU',nome,e.message)}}
// manifest com a versão de cada base (docs/data tem prioridade sobre www/data)
const man={};for(const f of new Set([...fs.readdirSync(OUT),...fs.readdirSync('www/data')])){if(!f.endsWith('.json')||f==='manifest.json')continue;const a=readJSON(path.join(OUT,f)),b=readJSON(path.join('www/data',f));const d=(a&&b)?((a.gerado||'')>(b.gerado||'')?a:b):(a||b);if(d)man[f.slice(0,-5)]=d.gerado||'';
  if(!a&&b)fs.copyFileSync(path.join('www/data',f),path.join(OUT,f))}
fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(man));log('manifest',man);
if(falhas.length){log('Bases que falharam:',falhas.join(', '));process.exitCode=falhas.length===etapas.length?1:0}
