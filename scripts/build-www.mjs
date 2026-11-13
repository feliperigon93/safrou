// Monta a pasta www-build: copia o app, embute fontes locais (funciona offline),
// troca os marcadores (servidor de dados e IDs do AdMob) e gera data/manifest.json.
import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const out=path.join(root,'www-build');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'data'),{recursive:true});fs.mkdirSync(path.join(out,'fonts'),{recursive:true});
const env=process.env;
const owner=(env.GITHUB_REPOSITORY||'').split('/')[0],repo=(env.GITHUB_REPOSITORY||'').split('/')[1];
const REMOTE=env.REMOTE_DATA_URL||(owner&&repo?`https://${owner.toLowerCase()}.github.io/${repo}/data/`:'');
// dados: usa docs/data (atualizado pelo robô mensal) quando for mais novo que www/data
const ver=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8')).gerado||''}catch{return ''}};
const manifest={};
for(const f of fs.readdirSync(path.join(root,'www/data'))){
  if(!f.endsWith('.json'))continue;const a=path.join(root,'www/data',f),b=path.join(root,'docs/data',f);
  const src=fs.existsSync(b)&&ver(b)>ver(a)?b:a;fs.copyFileSync(src,path.join(out,'data',f));manifest[f.replace('.json','')]=ver(src);
}
fs.writeFileSync(path.join(out,'data','manifest.json'),JSON.stringify(manifest));
// fontes
let css='';const fonts=[['inter',[400,500,600,700],'Inter'],['sora',[600,700,800],'Sora'],['jetbrains-mono',[500],'JetBrains Mono']];
for(const [pkg,weights,fam] of fonts){for(const w of weights){
  const file=`${pkg}-latin-${w}-normal.woff2`;const srcf=path.join(root,'node_modules/@fontsource',pkg,'files',file);
  if(fs.existsSync(srcf)){fs.copyFileSync(srcf,path.join(out,'fonts',file));css+=`@font-face{font-family:"${fam}";font-style:normal;font-weight:${w};font-display:swap;src:url(fonts/${file}) format("woff2")}\n`}
  else console.warn('fonte não encontrada',srcf)}}
let html=fs.readFileSync(path.join(root,'www/index.src.html'),'utf8').replace('<!--FONTS-->',`<style>${css}</style>`);
fs.writeFileSync(path.join(out,'index.html'),html);
let js=fs.readFileSync(path.join(root,'www/app-native.js'),'utf8').replace('__REMOTE_DATA__',REMOTE).replace('__ADMOB_IOS_BANNER__',env.ADMOB_IOS_BANNER||'').replace('__ADMOB_ANDROID_BANNER__',env.ADMOB_ANDROID_BANNER||'');
fs.writeFileSync(path.join(out,'app-native.js'),js);
console.log('www-build pronto. Servidor de dados:',REMOTE||'(nenhum)','· manifest',manifest);
