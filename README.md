# Gym80 Tracker MVP

Mobilny prototyp aplikacie pre evidenciu treningov na strojoch Gym80.

## Co je hotove

- Expo/React Native kostra projektu
- domovska obrazovka s navrhom dalsieho treningu
- katalog strojov
- detail stroja s poslednym vykonom a historiou
- historia treningov
- mock data pripravene na neskorsie napojenie na databazu
- pripraveny repository layer pre buduce Supabase napojenie
- pripraveny AI coach stub pre buducu integraciu OpenAI API

## Osobne funkcie fitka

- Detail stroja: `Moje nastavenie stroja` uklada sedadlo, opierku, polohu kladky a vlastny uchop nezavisle od treningovej poznamky. Zobrazuje aj minulu vahu pre zvoleny cvik a pomocku.
- Rozpracovane hodnoty a serie sa priebezne ukladaju na danom zariadeni. Obnovia sa po navrate alebo reloade; do historie sa zapisu az cez `Ulozit dnesny vykon`. Koncepty sa neposielaju do cloudu ani exportu.
- Domov: `Moje treningy A / B` umoznuje ulozit vlastne stroje a poradie. Trener meni objem podla pripravenosti, ale nepridava nahodne stroje. Zakazane alebo docasne blokovane cviky vynecha.
- Historia: progres sa porovnava zvlast pre kazdy variant a pomocku, vratane opakovani pri rovnakej vahe. Pri dopomoci mensie cislo znamena tazsi cvik.
- Historia: zapis telesnej hmotnosti a volitelneho obvodu pasa, prehlad poslednych 12 merani. Zapis na rovnaky datum aktualizuje existujuce meranie.
- Kalorie bez rozcvicky su len orientacny odhad: pouzivaju hmotnost platnu v den treningu a ulozeny cas, ak je dostupny. Bez hmotnosti odhad nezobrazujeme; starsie treningy maju cas odhadnuty zo serii.
- Nastavenia strojov, rozpisy A/B a merania su zahrnute v existujucej cloud zalohe a JSON exporte. Starsi export bez tychto poli ich nevymaze.

Overenie logiky: `npm.cmd run test:trainer`; typov: `npm.cmd run typecheck`; web export: `npm.cmd run build:web`.

## Navrhovany stack

- Expo + React Native
- Supabase pre auth, databazu a storage
- OpenAI API pre odporucanie treningu a neskor foto-match

## Ako spustit

V tomto prostredi nie je momentalne dostupny funkcny `npm` alebo `npx`, preto som pripravil projekt manualne.

Ked budes mat lokalne prostredie s Node package managerom:

```bash
npm install
npm run start
```

## ZimaBoard / Portainer

Self-host verzia bezi bez Netlify prihlasenia. Docker compose spusti jeden kontajner, ktory zobrazuje appku aj uklada historiu. Cez Tailscale bezime v CasaOS rezime: jedna spolocna zaloha historie v subore `zima-data/sync/gym80.json` bez prihlasovania. Google doplnime az vtedy, ked budeme chciet verejnu HTTPS domenu a viac oddelenych pouzivatelov.

Lokálne overenie buildu:

```bash
npm.cmd run build:web
```

Spustenie cez Docker:

```bash
docker compose up -d --build
```

Po spusteni bude appka dostupna na:

```text
http://IP_ZIMABOARDU:8088
```

Pre tvoju siet:

```text
http://192.168.31.193:8088
```

CasaOS sync API je schovane pod rovnakou adresou:

```text
http://192.168.31.193:8088/sync/gym80
```

## Inštalácia z Chrome (PWA)

Web obsahuje manifest, ikony 192/512 px, režim `standalone` a tlačidlo inštalácie, ktoré sa zobrazí po udalosti `beforeinstallprompt`.
Chrome vyžaduje dôveryhodné HTTPS. Na adrese `http://100.x.x.x:8088` bude inštalácia stále nedostupná.

Pre súkromný prístup možno použiť Tailscale Serve na CasaOS:

```bash
tailscale serve status
tailscale serve --bg --https=8444 http://127.0.0.1:8088
```

Pred zmenou skontroluj existujúce nastavenie Serve a prípadnú obsadenosť portu 8444.
Príkaz musí bežať v hostiteľovi alebo v Tailscale kontajneri, z ktorého je dostupný port 8088.
Ak HTTPS/MagicDNS ešte nie je povolené, Tailscale môže vyžiadať potvrdenie v jeho administračnej konzole.
Nepoužívaj Funnel; Gym80 má zostať dostupný iba v súkromnej sieti Tailscale.

Potom otvor adresu `https://<názov-zariadenia>.<tailnet>.ts.net:8444` vypísanú príkazom a v Chrome zvoľ **Inštalovať**.
Na novej HTTPS adrese sa história načíta z rovnakého CasaOS servera. Neodoslané lokálne koncepty zostávajú viazané na pôvodnú adresu; rozpracovaný tréning dokonči pred prechodom.

Service worker neukladá tréningy, merania, API odpovede ani aplikačné balíky do cache. Pri výpadku spojenia zobrazí iba stránku s možnosťou skúsiť pripojenie znova. Úpravy aplikácie sa načítajú pri ďalšom spustení/obnovení stránky.

Overenie: `npm run test:pwa` a `npm run build:web`.

## Dalsie kroky

1. Pridat realnu navigaciu a formular pre zapis treningu.
2. Napojit data na Supabase.
3. Pridat upload fotky stroja a manualne potvrdenie zhody.
4. Neskor doplnit automaticky vizualny match.
