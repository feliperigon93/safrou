// Gera as telas da App Store (iPhone 6,9": 1320 x 2868) a partir do app montado em www-build.
import {chromium} from 'playwright';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(process.env.WWW||'www-build'),out=path.resolve('loja/telas');fs.mkdirSync(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.woff2':'font/woff2'};
const srv=http.createServer((q,r)=>{let u=decodeURIComponent(q.url.split('?')[0]);if(u==='/')u='/index.html';const f=path.join(root,u);if(fs.existsSync(f)){r.setHeader('content-type',types[path.extname(f)]||'application/octet-stream');fs.createReadStream(f).pipe(r)}else{r.statusCode=404;r.end()}}).listen(8790);
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:440,height:956},deviceScaleFactor:3});
const shot=async n=>{await pg.waitForTimeout(600);await pg.screenshot({path:path.join(out,n+'.png')});console.log('tela',n)};
await pg.goto('http://127.0.0.1:8790/');await pg.waitForTimeout(4000);
await pg.fill('#q','azoxistrobina');await pg.waitForTimeout(800);await shot('1-defensivos');
await pg.click('.card >> nth=0');await pg.waitForTimeout(500);await pg.fill('#d-preco','95');await pg.fill('#d-dose','0,3');await pg.fill('#d-area','200');await pg.locator('.calcd').scrollIntoViewIfNeeded();await shot('2-ficha-custo');await pg.click('#back');
await pg.click('#tab-fol');await pg.waitForTimeout(3000);await pg.click('.chip.fmodo[data-m="foliar"]');await pg.click('.chip.nut[data-n="B"]');await pg.click('.chip.nut[data-n="Zn"]');await shot('3-fertilizantes');
await pg.click('#tab-cal');await pg.fill('#k-vel','12');await pg.waitForTimeout(300);await pg.fill('#k-esp','50');await pg.waitForTimeout(300);await pg.fill('#k-bico','0,8');await pg.waitForTimeout(400);await pg.click('#k-usar');await pg.fill('#k-tq','2000');await pg.waitForTimeout(300);await shot('4-calda');
await pg.click('#tab-plan');await pg.waitForTimeout(5000);await pg.selectOption('#z-cult','Soja');await pg.waitForTimeout(300);await pg.selectOption('#z-uf','MT');await pg.waitForTimeout(300);await pg.fill('#z-mun','Sorriso');await pg.dispatchEvent('#z-mun','change');await pg.waitForTimeout(800);await pg.evaluate(()=>{document.querySelectorAll('details.zad').forEach(d=>d.open=false);const z=document.querySelector('.zleg')||document.querySelector('.zcard');if(z){z.scrollIntoView({block:'start'});window.scrollBy(0,-90)}});await shot('5-plantio');
await pg.evaluate(()=>{localStorage.setItem('fav:v1',JSON.stringify({'d:22820':{nome:'Across',em:1},'d:28817':{nome:'Adante Xtra',em:2},'d:16625':{nome:'Adiconstar',em:3}}));
  localStorage.setItem('estoque:v1',JSON.stringify({'d:22820':{qtd:'40',min:'60',un:'L'},'d:28817':{qtd:'120',min:'50',un:'L'},'d:16625':{qtd:'35',min:'20',un:'L'}}));
  localStorage.setItem('calcd2:22820',JSON.stringify({preco:'95',un:'L',dose:'0,3'}));localStorage.setItem('calcd2:28817',JSON.stringify({preco:'120',un:'L',dose:'0,2'}));localStorage.setItem('calcd2:16625',JSON.stringify({preco:'88',un:'L',dose:'0,3'}));});
await pg.reload();await pg.waitForTimeout(4000);await pg.click('#tab-meus');await pg.waitForTimeout(1500);await pg.evaluate(()=>window.scrollTo(0,0));await shot('6-meus');
// ---- versões com frase de destaque (para a App Store) ----
const font=(pkg,w)=>{const f=path.resolve('node_modules/@fontsource',pkg,'files',`${pkg}-latin-${w}-normal.woff2`);return fs.existsSync(f)?`url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')})`:'local("Arial")'};
const css=`@font-face{font-family:Sora;font-weight:800;src:${font('sora',800)}}@font-face{font-family:Inter;font-weight:500;src:${font('inter',500)}}`;
const DESTAQUES=[
  ['1-defensivos','Mais de 4 mil defensivos na palma da mão','Dados oficiais do MAPA, funciona sem internet'],
  ['2-ficha-custo','Saiba o custo por hectare antes de comprar','Compare genéricos pelo R$ por kg de ativo'],
  ['3-fertilizantes','Ache o adubo certo em segundos','Filtre por nutriente, modo de aplicação e empresa'],
  ['4-calda','Calibre o pulverizador e monte a calda','Volume por hectare, tanque e ordem de mistura'],
  ['5-plantio','Plante na janela certa','ZARC por município, ciclo e tipo de solo'],
  ['6-meus','Seu estoque sempre na mão','Favoritos, valor em estoque e aviso de reposição'],
];
const pd=await b.newPage({viewport:{width:440,height:956},deviceScaleFactor:3});
for(const [n,titulo,sub] of DESTAQUES){
  const f=path.join(out,n+'.png');if(!fs.existsSync(f))continue;
  const img=fs.readFileSync(f).toString('base64');
  await pd.setContent(`<!doctype html><html><head><style>${css}
  html,body{margin:0;width:440px;height:956px;overflow:hidden;background:#1E7A3E;font-family:Inter,sans-serif}
  .top{padding:58px 34px 0;text-align:center}
  .tag{display:inline-block;background:#F4B62A;color:#17251B;font:800 13px Sora,sans-serif;letter-spacing:-.02em;padding:6px 14px;border-radius:999px;margin-bottom:16px}
  h1{margin:0;color:#fff;font:800 31px/1.12 Sora,sans-serif;letter-spacing:-.035em}
  p{margin:12px 0 0;color:#D7F0DC;font:500 16px/1.35 Inter,sans-serif}
  .phone{position:absolute;left:50%;top:240px;transform:translateX(-50%);width:330px;border:9px solid #17251B;border-radius:44px;overflow:hidden;background:#17251B;box-shadow:0 24px 50px rgba(0,0,0,.35)}
  .phone img{display:block;width:100%;border-radius:35px}
  </style></head><body><div class="top"><span class="tag">safrou!</span><h1>${titulo}</h1><p>${sub}</p></div><div class="phone"><img src="data:image/png;base64,${img}"></div></body></html>`);
  await pd.waitForTimeout(300);await pd.screenshot({path:path.join(out,'destaque-'+n+'.png')});console.log('destaque',n);
}
await b.close();srv.close();
