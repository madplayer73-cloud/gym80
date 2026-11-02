# Overenie nasadenia 1.6.0 – 2. 11. 2026

Nasadená verzia: Gym80 1.6.0, runtime zdrojový commit `05c4948` (implementácia `dd3fcd7`). Produkčný stack Gym80 v Portaineri, bez zmeny ostatných aplikácií a bez zmeny Tailscale Serve trás.

## Vykonané kontroly

- 43 trainer testov, 3 PWA testy, 2 Node integračné/klientské testy a 7 Go behaviorálnych testov prešli. Typecheck, Go vet a webový build prešli.
- Izolovaný stack `gym80-sleep-acceptance`, testovací kontajner `gym80-sleep-test`, port LAN 18088, samostatné volumes, iba syntetické údaje.
- Manuálne uspatie skončilo riadnym ukončením kontajnera (exit 0).
- Reštart proxy pri spiacej appke ju neprebudil. Vypnuté automatické uspávanie prežilo reštart v perzistentnom nastavení. Automatika potom znovu zapnutá.
- Reštart testovacieho Docker agenta počas časovaného testu neporušil následné uspatie/prebudenie.
- Celý interval 900 s sa testoval v reálnom čase. Stav sa čítal každých 15 s, spolu s health endpointom. Posledné pozorovanie `idle` bolo pri 903 s, `stopped` pri 918 s. Pozorovaný interval obsahuje 10-sekundový interval controllera a 15-sekundové vzorkovanie testu; nejde o presný čas samotného Docker stop.
- Následný API prístup prebudil appku za 3061 ms a vrátil rovnaký uložený testovací údaj.
- Skutočný nedokončený PUT upload zabránil manuálnemu uspatiu (409); po dokončení sa celý údaj uložil a znovu načítal.
- Testovacie prostredie po overení zastavené cez Portainer. Jeho volumes a obrazy sa nemažú; nejde o bežiacu produkčnú službu.
- Produkčné údaje zálohované pred zmenou do `/data/gym80-before-sleep-20261102.json` a ešte raz tesne pred nasadením do `/data/gym80-before-sleep-deploy-20261102.json`. Po nasadení a pred otvorením hlavného UI bol dátový súbor bajtovo zhodný s poslednou zálohou.
- Produkčný stack obsahuje `gym80-tracker`, `gym80-sleep-proxy`, `gym80-sleep-agent`. Verejný port aplikácie vlastní iba proxy, agent nemá publikovaný port.
- Pôvodná HTTPS adresa `https://casaos.tailbeb6ab.ts.net:8444/` funguje. Cez HTTPS bolo overené manuálne uspatie, automatické prebudenie otvorením hlavnej adresy, verzia 1.6.0 a načítanie existujúcej histórie. Ovládacie POSTy fungujú cez Tailscale s kontrolou Origin.
- Mobilné menu overené pri šírke 390 px; ovládanie spánku je dostupné a panel sa dá posúvať. Testovací lokálny náhľad a jeho procesy boli ukončené.
- Pri odovzdaní Gym80 ponechané spať so zapnutou automatikou. Samotné otvorené ovládanie `/__sleep/ui` ho nebudí.
- Po nasadení zostali dostupné HTTPS ovládanie, Portainer a naslúchajúci SSH port 22. Tailscale, SSH ani iné produkčné aplikácie sa nekonfigurovali.

## Pamäť a hranice overenia

V testovacom Dockeri mala proxy podľa grafu Portainera približne 5 MB a agent približne 2,5 MB. Pôvodný Node server mal pred zmenou VmRSS 18 704 kB. Tieto údaje používajú rozdielne metriky; presnú čistú úsporu fyzickej RAM z nich nemožno odvodiť. Zastavený aplikačný proces RAM neužíva, stále bežiaci wake mechanizmus má vlastnú réžiu.

Celý host sa nereštartoval a neodpájal sa SSD. Tieto deštruktívne prevádzkové simulácie nie sú overené na produkcii. Kernelové OOM logy sa z existujúceho Tailscale kontajnera nedali čítať (`dmesg: Operation not permitted`); nepridávali sa kvôli tomu oprávnenia. Testy a úspešné nasadenie nenahrádzajú takýto systémový audit.

Automatické uspávanie sa týka iba Gym80. Pridanie ďalších aplikácií vyžaduje samostatné posúdenie ich úloh, dát a explicitné rozšírenie konfigurácie.
