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
await b.close();srv.close();
