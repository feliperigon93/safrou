# Safrou — app iOS (e Android depois)

Projeto Capacitor: o app web do Safrou empacotado como app nativo, com as bases do MAPA dentro dele (funciona offline), atualização mensal automática pelo GitHub e banner do AdMob.

## Estrutura
- `www/index.src.html` e `www/app-native.js`: o app. `www/data/`: bases incluídas no app.
- `scripts/update-data.mjs`: robô que baixa AGROFIT, SIPEAGRO e ZARC e gera `docs/data/`.
- `docs/`: site no GitHub Pages (início, suporte, privacidade e as bases atualizadas que o app baixa).
- `.github/workflows/`: `dados.yml` (todo dia 5), `ios.yml` (gera e envia para o TestFlight), `telas.yml` (telas da loja).
- `loja/`: textos e telas da App Store. `resources/`: ícone e tela de abertura.

## Passo a passo (uma vez só)
1. **Apple Developer Program** (pessoa física, US$ 99/ano): developer.apple.com/programs/enroll — use um Apple ID com verificação em dois fatores.
2. **GitHub**: crie a conta e um repositório **público** chamado `safrou`; envie todos os arquivos desta pasta (arrastar a pasta para a página do repositório funciona).
3. **GitHub Pages**: no repositório, Settings > Pages > Source "Deploy from a branch" > Branch `main`, pasta `/docs`. O site fica em `https://SEU-USUARIO.github.io/safrou/`. Troque `[SEU E-MAIL DE CONTATO]` em `docs/privacidade.html` e `docs/suporte.html`.
4. **App Store Connect** (appstoreconnect.apple.com): Apps > "+" > Novo app > iOS, nome "Safrou", idioma Português (Brasil), Bundle ID `app.safrou` (se não aparecer, crie em developer.apple.com > Identifiers), SKU `safrou`.
5. **Chave de API** (App Store Connect > Usuários e acesso > Integrações > App Store Connect API): gere uma chave com acesso **App Manager**. Anote o **Issuer ID** e o **Key ID** e baixe o arquivo `.p8` (só baixa uma vez).
6. **AdMob** (admob.google.com): adicione o app iOS e crie um bloco de anúncio **Banner**. Anote o **ID do app** (ca-app-pub-…~…) e o **ID do bloco** (ca-app-pub-…/…).
7. **Segredos no GitHub** (Settings > Secrets and variables > Actions > New repository secret):
   - `APPLE_TEAM_ID` — em developer.apple.com > Membership (10 caracteres)
   - `ASC_KEY_ID`, `ASC_ISSUER_ID` — do passo 5
   - `ASC_KEY_P8_BASE64` — o conteúdo do .p8 em base64 (no Windows: `certutil -encode AuthKey_XXXX.p8 saida.txt` e copie o texto sem as linhas BEGIN/END)
   - `ADMOB_IOS_APP_ID`, `ADMOB_IOS_BANNER` — do passo 6
8. **Compra "Remover anúncios"** (App Store Connect > seu app > Monetização > Compras dentro do app > "+"):
   - Tipo: **Não consumível** · Nome de referência: Sem anúncios · **ID do produto: `app.safrou.semanuncios`** (exatamente assim)
   - Preço: escolha a faixa (ex.: R$ 19,90) · Localização em português: nome "Remover anúncios", descrição "Use o app sem anúncios, para sempre."
   - Captura de tela para a revisão: um print da aba Meus com o quadro "Remover anúncios".
   - Antes de vender: em **Negócios** (Agreements), aceite o contrato de **Apps pagos** e preencha banco e impostos. Peça também o **App Store Small Business Program** (taxa de 15%).
   - Na primeira versão, marque a compra para ser enviada **junto com o app** na tela da versão.
9. **Gerar o app**: aba Actions > "Gerar app iOS (TestFlight)" > Run workflow. Em uns 20 minutos a build aparece no TestFlight da App Store Connect.
10. **Testar** no seu iPhone (no TestFlight a compra é de teste e não cobra) pelo app TestFlight, preencher os textos de `loja/textos-app-store.md`, subir as telas e **Enviar para revisão**.

Sem os IDs do AdMob, o app usa anúncios de teste do Google (não pagam). Não publique assim.
