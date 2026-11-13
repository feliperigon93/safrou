/* Safrou — camada do app nativo (iOS/Android via Capacitor)
   1) Atualização das bases: compara os arquivos que vêm dentro do app com os publicados
      no servidor (GitHub Pages) e usa o mais novo, guardando no aparelho.
   2) Anúncio (AdMob): banner no rodapé, com o pedido de rastreamento exigido pela Apple. */
(function(){
  const REMOTE='__REMOTE_DATA__'; // trocado no build, ex.: https://usuario.github.io/safrou/data/
  const ADS={iosBanner:'__ADMOB_IOS_BANNER__',androidBanner:'__ADMOB_ANDROID_BANNER__'};
  const hasRemote=/^https:\/\//.test(REMOTE);
  // --- cache simples em IndexedDB ---
  const idb={open(){return new Promise((res,rej)=>{const r=indexedDB.open('bnc-remoto',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})},
    async get(k){try{const d=await this.open();return await new Promise(r=>{const t=d.transaction('kv').objectStore('kv').get(k);t.onsuccess=()=>r(t.result);t.onerror=()=>r(undefined)})}catch(e){return undefined}},
    async set(k,v){try{const d=await this.open();await new Promise(r=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=r;t.onerror=r})}catch(e){}}};
  const _fetch=window.fetch.bind(window);
  let manifestP=null;
  const manifest=()=>manifestP||(manifestP=(hasRemote&&navigator.onLine?_fetch(REMOTE+'manifest.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null):Promise.resolve(null)));
  const ver=d=>d&&(d.gerado||'')||'';
  async function getData(name){
    let best=null;try{const r=await _fetch('data/'+name+'.json');if(r.ok)best=await r.json()}catch(e){}
    const cached=await idb.get('remote:'+name);
    if(cached&&cached.data&&ver(cached.data)>ver(best))best=cached.data;
    const m=await manifest();
    const v=m&&m[name];
    if(v&&v>ver(best)){try{const r=await _fetch(REMOTE+name+'.json',{cache:'no-store'});if(r.ok){const d=await r.json();if(ver(d)>ver(best)){best=d;idb.set('remote:'+name,{data:d})}}}catch(e){}}
    return best;
  }
  window.fetch=async function(u,o){
    if(typeof u==='string'&&/^data\/[a-z_]+\.json$/.test(u)){
      const d=await getData(u.slice(5,-5));
      return new Response(d?JSON.stringify(d):'null',{status:d?200:404,headers:{'content-type':'application/json'}});
    }
    return _fetch(u,o);
  };
  // --- AdMob ---
  document.addEventListener('DOMContentLoaded',async()=>{
    const Cap=window.Capacitor;const slot=document.getElementById('adSlot');
    const AdMob=Cap&&Cap.Plugins&&Cap.Plugins.AdMob;
    const pro=(()=>{try{return localStorage.getItem('bnc:pro')==='1'}catch(e){return false}})();
    if(!AdMob||pro){if(slot)slot.closest('.ad').hidden=true;document.body.style.paddingBottom='calc(66px + env(safe-area-inset-bottom,0px))';return}
    try{
      if(slot)slot.style.border='0';
      await AdMob.initialize({initializeForTesting:false});
      let npa=true;
      try{const st=await AdMob.trackingAuthorizationStatus();let s=st&&st.status;if(s==='notDetermined'){const r=await AdMob.requestTrackingAuthorization();s=(r&&r.status)||(await AdMob.trackingAuthorizationStatus()).status}npa=s!=='authorized'}catch(e){}
      const ios=Cap.getPlatform()==='ios';const id=ios?ADS.iosBanner:ADS.androidBanner;
      const test=!/^ca-app-pub-\d+\/\d+$/.test(id);
      await AdMob.showBanner({adId:test?(ios?'ca-app-pub-3940256099942544/2934735716':'ca-app-pub-3940256099942544/6300978111'):id,adSize:'ADAPTIVE_BANNER',position:'BOTTOM_CENTER',margin:64,isTesting:test,npa});
    }catch(e){console.warn('AdMob',e);if(slot)slot.closest('.ad').hidden=true}
  });
  // links externos abrem no navegador do sistema
  document.addEventListener('click',e=>{const a=e.target.closest&&e.target.closest('a[href^="http"]');if(!a)return;const Br=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Browser;if(Br){e.preventDefault();Br.open({url:a.href})}},true);
})();

/* ---------- Compra "Sem anúncios" (compra única, não consumível) ---------- */
(function(){
  const PRODUTO={ios:'app.safrou.semanuncios',android:'semanuncios'};
  const KEY='bnc:pro';
  const isPro=()=>{try{return localStorage.getItem(KEY)==='1'}catch(e){return false}};
  const setPro=v=>{try{localStorage.setItem(KEY,v?'1':'0')}catch(e){}};
  window.bncIsPro=isPro;
  let produto=null,status='',storeOk=false;
  const plat=()=>window.Capacitor&&window.Capacitor.getPlatform&&window.Capacitor.getPlatform();
  async function tirarAnuncios(){
    const AdMob=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.AdMob;
    try{if(AdMob)await AdMob.removeBanner()}catch(e){}
    const ad=document.querySelector('.ad');if(ad)ad.hidden=true;
    document.body.style.paddingBottom='calc(66px + env(safe-area-inset-bottom,0px))';
    const b=document.getElementById('semAds');if(b)b.hidden=true;
  }
  window.bncAdsAllowed=()=>!isPro();
  function rerender(){const t=document.getElementById('tab-meus');if(t&&t.getAttribute('aria-selected')==='true')t.click()}
  window.bncProCard=function(){
    if(!(window.CdvPurchase&&storeOk))return '';
    if(isPro())return `<div class="procard"><h3>Safrou sem anúncios</h3><p>Obrigado! Sua versão está sem anúncios.</p></div>`;
    const preco=produto&&produto.pricing?produto.pricing.price:'';
    return `<div class="procard"><h3>Remover anúncios</h3><p>Compra única${preco?' de <b>'+preco+'</b>':''}. Vale para sempre neste Apple ID ou conta Google, inclusive em outro celular.</p>
      <div class="btnrow"><button class="btn" id="proBuy" ${produto&&produto.canPurchase!==false?'':'disabled'}>Comprar${preco?' por '+preco:''}</button><button class="btn ghost" id="proRestore">Restaurar compra</button></div>
      <p class="muted" id="proMsg">${status}</p></div>`;
  };
  window.bncProBind=function(){
    const S=window.CdvPurchase&&window.CdvPurchase.store;if(!S)return;
    const buy=document.getElementById('proBuy'),rest=document.getElementById('proRestore'),msg=document.getElementById('proMsg');
    if(buy)buy.onclick=async()=>{const offer=produto&&produto.getOffer&&produto.getOffer();if(!offer){msg.textContent='Produto indisponível no momento. Tente mais tarde.';return}
      buy.disabled=true;msg.textContent='Abrindo a loja…';const err=await offer.order();if(err){buy.disabled=false;msg.textContent=err.code===6777006||/cancel/i.test(err.message||'')?'Compra cancelada.':'Não foi possível concluir: '+(err.message||err.code)}};
    if(rest)rest.onclick=async()=>{rest.disabled=true;msg.textContent='Verificando compras anteriores…';await S.restorePurchases();setTimeout(()=>{if(!isPro()){rest.disabled=false;msg.textContent='Nenhuma compra encontrada para esta conta.'}},4000)};
  };
  document.addEventListener('DOMContentLoaded',async()=>{
    const btn=document.getElementById('semAds');
    if(btn)btn.onclick=()=>{const t=document.getElementById('tab-meus');if(t)t.click();window.scrollTo({top:0,behavior:'smooth'})};
    if(isPro()){tirarAnuncios();}
    const C=window.CdvPurchase;if(!C||!plat()||plat()==='web')return;
    const {store,ProductType,Platform}=C;
    const P=plat()==='ios'?Platform.APPLE_APPSTORE:Platform.GOOGLE_PLAY;const id=plat()==='ios'?PRODUTO.ios:PRODUTO.android;
    store.register([{id,type:ProductType.NON_CONSUMABLE,platform:P}]);
    store.when()
      .productUpdated(p=>{if(p.id===id){produto=p;if(p.owned){setPro(true);tirarAnuncios()}rerender()}})
      .approved(t=>t.finish())
      .finished(t=>{if(t.products&&t.products.some(x=>x.id===id)){setPro(true);status='';tirarAnuncios();rerender()}});
    try{await store.initialize([P]);storeOk=true;produto=store.get(id,P);if(produto&&produto.owned){setPro(true);tirarAnuncios()}
      if(!isPro()&&btn)btn.hidden=false;rerender()}catch(e){console.warn('loja',e)}
  });
})();
