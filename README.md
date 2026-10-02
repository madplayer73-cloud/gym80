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

## Dalsie kroky

1. Pridat realnu navigaciu a formular pre zapis treningu.
2. Napojit data na Supabase.
3. Pridat upload fotky stroja a manualne potvrdenie zhody.
4. Neskor doplnit automaticky vizualny match.
