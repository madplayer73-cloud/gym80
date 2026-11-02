# Gym80: spánok po 15 minútach

Gym80 je interaktívna aplikácia bez serverových plánovaných úloh a so snapshotom v perzistentnom `/data`. Je vhodná na zastavenie webového kontajnera. Časovač tréningu, formuláre a OCR bežia v prehliadači. Zastavenie servera ich nevymaže; ďalší zápis server automaticky zobudí. Pri zatvorení karty stále platia obvyklé pravidlá ukladania konceptov.

## Smerovanie a oprávnenia

Mobil / Tailscale HTTPS 8444 → nezmenený port hosta 8088 → `gym80-sleep-proxy:8080` → `gym80-web:80`.

Proxy nemá Docker socket. Samostatný `gym80-sleep-agent` ho má, ale nemá publikované porty ani prístup k dátam. Je na izolovanej Docker sieti iba s proxy. Agent poskytuje len `GET /state`, `POST /start`, `POST /stop` pre presný názov `gym80-tracker` (testovací variant `gym80-sleep-test`). Neposkytuje shell, exec, mazanie, zoznam kontajnerov ani nesanitizovaný inspect. Mount `:ro` sám Docker API neobmedzuje: socket stále znamená vysoké oprávnenie agenta, preto jeho nasadenie vyžaduje výslovný súhlas používateľa.

Prístup zostáva na doterajšej súkromnej LAN / Tailscale trase, bez Funnel a router port forwardingu. Proxy kontroluje privátnu zdrojovú IP (neprijíma ju z hlavičky), blokuje cross-site požiadavky označené prehliadačom. Ovládacie POSTy vyžadujú zhodný Origin. Nepridáva nový používateľský účet: používa existujúcu privátnu sieťovú hranicu Gym80. Samotná privátna IP nenahrádza prihlásenie pri verejnom nasadení; takto appku nezverejňovať.

Nabíjačka má vlastný jednoúčelový waker. Jeho úprava by menila inú produkčnú aplikáciu, preto sa nepoužíva na ovládanie Gym80. Obe služby Gym80 sú malé Go procesy zo štandardnej knižnice. Prípadné zdieľanie agenta s ďalšími aplikáciami vyžaduje osobitné zadanie a explicitné rozšírenie allowlistu.

## Aktivita, dáta a ovládanie

- `IDLE_TIMEOUT=900s`; kontrola každých 10 s, tolerancia do 10 s plus čas dokončenia práce. Po prebudení minimálne 60 s ochrana.
- Navigácia, zápisy a dôveryhodné pointer/key/input/scroll udalosti predlžujú čas. Signál z klienta najviac raz za 30 s, bez pravidelného heartbeat.
- Statické súbory, status, healthcheck a automatické GET synchronizačné čítanie čas nepredlžujú. Health a status appku nebudia.
- Celá prebiehajúca požiadavka (vrátane uploadu) blokuje stop cez zámok. Readiness musí potvrdiť `busy:0`; pri chybe readiness sa neuspáva.
- Server zapisuje snapshoty postupne, cez fsync a atomické rename. Pri SIGTERM dokončí požiadavky a zápisy; Docker mu dáva 40 s, agent používa graceful stop s 30 s.
- `gym80-web` má `restart: no`; po reštarte hosta môže ostať spať, proxy aj agent majú `unless-stopped`. Ak už beží, po reštarte proxy dostane nový 15-minútový interval.
- `GET /__sleep/ui`: stav, prebudenie, manuálne uspatie a zapnutie/vypnutie automatiky. Nastavenie je v samostatnom volume `sleep-state`; neobsahuje osobné údaje.
- Keď appka spí, navigácia zobrazí obrazovku prebúdzania; API zápis počká na pripravenosť, bez opakovaného odosielania tela. Pri zlyhaní je zrozumiteľná chyba a možnosť opakovať pokus.
- Tailscale, CasaOS, SSH, databázy a iné aplikácie sa nemenia. Žiadny `pause`, `prune`, mazanie volume ani reboot hosta.

## Testovanie a postup nasadenia

1. Zálohovať pôvodný Compose, image/tag, presnú cestu bind mountu a snapshot. Porovnať hash dát po testoch; testy nesmú ukladať merania do produkcie.
2. `cd sleep && go test -v ./...`; v koreni `node --test tests/sleep.test.cjs`, existujúce trainer/PWA testy, typecheck a build.
3. Najprv izolovaný testovací kontajner `gym80-sleep-test` bez produkčných dát. Overiť stop/start, celý reálny 900 s interval, health polling, zápis, zachovanie dát, výpadok backendu a reštart proxy/agenta. Test host reboot/SSD výpadku na produkcii nevykonávať bez osobitného okna: zdokumentovať ako neoverený, ak sa nesimuloval v izolovanom prostredí.
4. Po schválení prístupu agenta k socketu nasadiť iba stack Gym80. Pred/po skontrolovať RAM a čas wake. Overiť LAN, HTTPS, PWA a nezmenené Tailscale/SSH. Nastavenie HTTPS netreba meniť, port 8088 preberá proxy.
5. Rollback: predchádzajúci Compose a image `gym80-tracker:1.5.0` s pôvodným `8088:80`, rovnakým bind mountom a `unless-stopped`; nasadiť bez mazania dát/volume. Núdzové zobudenie aktuálnej verzie: `docker start gym80-tracker`; vypnutie automatiky cez `/__sleep/ui`. Pri úplnej chybe proxy použiť rollback portu.

## Prevádzkové overenie

Pri odovzdaní doplniť konkrétne vykonané testy, RAM pred/po a trvanie štartu. Úspech unit testov nenahrádza potvrdenie skutočného uspania na CasaOS. Neoznačovať funkciu za nasadenú pred potvrdením živej verzie a výsledku.
