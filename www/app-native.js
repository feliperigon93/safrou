/* Safrou — camada do app nativo (iOS/Android via Capacitor)
   1) Atualização das bases: compara os arquivos que vêm dentro do app com os publicados
      no servidor (GitHub Pages) e usa o mais novo, guardando no aparelho.
   2) Anúncio (AdMob): banner no rodapé, com o pedido de rastreamento exigido pela Apple.
   3) Safrou Pro: assinatura pelo RevenueCat. */
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
    const pro=window.SafBilling?window.SafBilling.isPro():false;
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

/* ---------- Safrou Pro: assinatura (RevenueCat) ----------
   Entitlement "pro" no RevenueCat; pacotes mensal e anual na oferta atual.
   A situação fica guardada no aparelho para funcionar offline até a data de expiração. */
(function(){
  const RC_KEY='__RC_IOS_KEY__'; // trocado no build pelo segredo REVENUECAT_IOS_KEY
  const ENT='pro';
  const LS='saf:pro:v1';
  const plat=()=>window.Capacitor&&window.Capacitor.getPlatform&&window.Capacitor.getPlatform();
  const native=()=>{const p=plat();return p==='ios'||p==='android'};
  const RC=()=>window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Purchases;
  const read=()=>{try{return JSON.parse(localStorage.getItem(LS)||'null')}catch(e){return null}};
  const write=v=>{try{localStorage.setItem(LS,JSON.stringify(v))}catch(e){}};
  const st={ready:false,available:false,packages:{},err:'',busy:false};
  function cachedPro(){
    if(!native()){try{if(localStorage.getItem('saf:dev-pro')==='1')return true}catch(e){}}
    const c=read();if(!c||!c.pro)return false;
    if(!c.until)return true; // sem data = vitalício / não expira
    return Date.now()<new Date(c.until).getTime()+3*864e5; // 3 dias de folga offline
  }
  function applyInfo(r){
    const ci=r&&r.customerInfo?r.customerInfo:r;if(!ci||!ci.entitlements)return;
    const e=ci.entitlements.active&&ci.entitlements.active[ENT];
    const was=cachedPro();
    write(e?{pro:true,until:e.expirationDate||null,produto:e.productIdentifier||'',trial:e.periodType==='TRIAL',checado:new Date().toISOString()}:{pro:false,checado:new Date().toISOString()});
    if(was!==cachedPro())window.dispatchEvent(new Event('saf-pro-change'));
    if(cachedPro())tirarAnuncios();
  }
  async function tirarAnuncios(){
    const AdMob=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.AdMob;
    try{if(AdMob)await AdMob.removeBanner()}catch(e){}
    const ad=document.querySelector('.ad');if(ad)ad.hidden=true;
    document.body.style.paddingBottom='calc(66px + env(safe-area-inset-bottom,0px))';
    const b=document.getElementById('semAds');if(b)b.hidden=true;
  }
  const errMsg=e=>{const m=String((e&&(e.message||e.errorMessage))||e||'');if((e&&(e.userCancelled||e.code==='1'||e.code===1))||/cancel/i.test(m))return 'cancel';return m||'erro desconhecido'};
  window.SafBilling={
    state:st,
    isPro:cachedPro,
    native,
    // Pro só aparece quando a assinatura está configurada (chave do RevenueCat no build)
    enabled:()=>!native()||/^appl_|^goog_/.test(RC_KEY),
    info:()=>read(),
    async init(){
      if(!native()||!RC()||!/^appl_|^goog_/.test(RC_KEY)){st.ready=true;st.err=native()?'Assinaturas ainda não configuradas nesta versão.':'';window.dispatchEvent(new Event('saf-pro-change'));return}
      try{
        await RC().configure({apiKey:RC_KEY});
        try{RC().addCustomerInfoUpdateListener(applyInfo)}catch(e){}
        applyInfo(await RC().getCustomerInfo());
        const o=await RC().getOfferings();const cur=(o&&o.current)||(o&&o.offerings&&o.offerings.current);
        if(cur){st.packages={monthly:cur.monthly||null,annual:cur.annual||null};
          if(!st.packages.monthly&&!st.packages.annual)(cur.availablePackages||[]).forEach(p=>{if(/month|mensal/i.test(p.identifier+p.packageType))st.packages.monthly=p;if(/annual|anual|year/i.test(p.identifier+p.packageType))st.packages.annual=p})}
        st.available=!!(st.packages.monthly||st.packages.annual);
      }catch(e){st.err=String(e&&e.message||e)}
      st.ready=true;window.dispatchEvent(new Event('saf-pro-change'));
    },
    async buy(kind){
      const pkg=st.packages[kind];if(!pkg)return {ok:false,msg:'Plano indisponível no momento. Tente mais tarde.'};
      st.busy=true;
      try{const r=await RC().purchasePackage({aPackage:pkg});applyInfo(r);st.busy=false;return {ok:cachedPro()}}
      catch(e){st.busy=false;const m=errMsg(e);return {ok:false,cancel:m==='cancel',msg:m==='cancel'?'Assinatura cancelada.':'Não foi possível concluir: '+m}}
    },
    async restore(){
      if(!RC())return {ok:false,msg:'Disponível apenas no app.'};
      try{const r=await RC().restorePurchases();applyInfo(r);return {ok:cachedPro(),msg:cachedPro()?'Assinatura restaurada.':'Nenhuma assinatura ativa encontrada para esta conta.'}}
      catch(e){return {ok:false,msg:'Não foi possível restaurar: '+errMsg(e)}}
    },
    async refresh(){if(native()&&RC()&&st.ready&&st.available){try{applyInfo(await RC().getCustomerInfo())}catch(e){}}},
    manage(){const u=plat()==='android'?'https://play.google.com/store/account/subscriptions':'https://apps.apple.com/account/subscriptions';const Br=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.Browser;if(Br)Br.open({url:u});else window.open(u,'_blank')},
    tirarAnuncios
  };
  window.bncAdsAllowed=()=>!cachedPro();
  document.addEventListener('DOMContentLoaded',()=>{
    const btn=document.getElementById('semAds');
    if(btn)btn.onclick=()=>window.SAFPRO&&SAFPRO.paywall();
    if(cachedPro())tirarAnuncios();else if(btn&&native()&&window.SafBilling.enabled())btn.hidden=false;
    window.SafBilling.init();
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)window.SafBilling.refresh()});
  });
})();
