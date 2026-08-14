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

Self-host verzia bezi bez Netlify prihlasenia. Treningy sa zatial ukladaju lokalne v prehliadaci, kym doplnime vlastny Google login a databazu.

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

Volitelne je pripraveny aj `docker-compose.pocketbase.yml` pre buduci vlastny cloud login a databazu mimo Netlify.

## Dalsie kroky

1. Pridat realnu navigaciu a formular pre zapis treningu.
2. Napojit data na Supabase.
3. Pridat upload fotky stroja a manualne potvrdenie zhody.
4. Neskor doplnit automaticky vizualny match.
