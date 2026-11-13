// Ajusta o Info.plist do projeto iOS: AdMob, rastreamento (ATT), criptografia e nome.
import fs from 'node:fs';import plist from 'plist';
const f='ios/App/App/Info.plist';const p=plist.parse(fs.readFileSync(f,'utf8'));
p.CFBundleDisplayName='Safrou';
p.GADApplicationIdentifier=process.env.ADMOB_IOS_APP_ID||'ca-app-pub-3940256099942544~1458002511'; // ID de teste se não houver
p.NSUserTrackingUsageDescription='Usamos esta permissão só para mostrar anúncios mais relevantes. O app funciona normalmente se você não permitir.';
p.ITSAppUsesNonExemptEncryption=false;
p.UIRequiresFullScreen=false;
// redes de anúncio do Google (lista mínima recomendada pelo AdMob)
p.SKAdNetworkItems=[{SKAdNetworkIdentifier:'cstr6suwn9.skadnetwork'}];
fs.writeFileSync(f,plist.build(p));console.log('Info.plist ajustado');
