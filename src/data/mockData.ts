import { Machine, WorkoutSession } from "../types";

export const mockMachines: Machine[] = [
  {
    id: "leg-extension-seated",
    brand: "Gym80",
    modelName: "Leg Extension",
    displayNameSk: "Predkopávanie v sede",
    category: "Selectorized",
    muscleGroup: "Nohy",
    imageHint: "Seated leg extension with ankle roller pad",
    descriptionSk:
      "Stroj na predkopavanie v sede. Precvičuje hlavne prednu cast stehien.",
    imageAsset: "predkopavanie.jpg",
    setupNoteLabel: "Seat depth"
  },
  {
    id: "leg-curl-seated",
    brand: "Gym80",
    modelName: "Leg Curl",
    displayNameSk: "Zakopávanie v sede",
    category: "Selectorized",
    muscleGroup: "Nohy",
    imageHint: "Seated leg curl with upper and lower roller pads",
    descriptionSk:
      "Stroj na zakopavanie v sede. Precvičuje hlavne zadnu cast stehien.",
    imageAsset: "zakopavanie.jpg",
    setupNoteLabel: "Back pad position"
  },
  {
    id: "standing-calf-raise",
    brand: "Gym80",
    modelName: "Standing Calf Raise",
    displayNameSk: "Výpony na lýtka v stoji",
    category: "Selectorized",
    muscleGroup: "Nohy",
    imageHint: "Standing calf machine with shoulder pads and foot platform",
    descriptionSk:
      "Stroj na vytlacanie cez spicky v stoji. Precvičuje hlavne lytka.",
    imageAsset: "lytka-v-stoji.jpg",
    setupNoteLabel: "Foot stance"
  },
  {
    id: "seated-calf-raise",
    brand: "Gym80",
    modelName: "Seated Calf Raise",
    displayNameSk: "Lýtka v sede",
    category: "Selectorized",
    muscleGroup: "Nohy",
    imageHint: "Seated calf raise with thigh pads",
    descriptionSk:
      "Stroj na vytlacanie cez spicky v sede. Precvičuje hlavne lytka.",
    imageAsset: "lytka-v-sede.jpg",
    setupNoteLabel: "Seat depth"
  },
  {
    id: "forward-calf-raise",
    brand: "Gym80",
    modelName: "Forward Calf Raise",
    displayNameSk: "Lýtka v predklone",
    category: "Plate Loaded",
    muscleGroup: "Nohy",
    imageHint: "Forward leaning calf raise machine",
    descriptionSk:
      "Stroj na vytlacanie cez spicky v predklone. Precvičuje hlavne lytka.",
    imageAsset: "lytka-v-predklone.jpg",
    setupNoteLabel: "Foot stance"
  },
  {
    id: "forward-calf-raise-support",
    brand: "Gym80",
    modelName: "Forward Calf Raise Support",
    displayNameSk: "Lýtka v predklone na opierke",
    category: "Plate Loaded",
    muscleGroup: "Nohy",
    imageHint: "Forward leaning calf raise with support pad",
    descriptionSk:
      "Stroj na vytlacanie cez spicky s oporou tela v predklone. Precvičuje hlavne lytka.",
    imageAsset: "lytka-v-predklone-na-opierke.jpg",
    setupNoteLabel: "Foot stance"
  },
  {
    id: "seated-straight-arm-pulldown",
    brand: "Gym80",
    modelName: "Seated Straight Arm Pulldown",
    displayNameSk: "Sťahovanie vystretými rukami v sede",
    category: "Selectorized",
    muscleGroup: "Chrbat",
    imageHint: "Seated pulldown style machine with straight-arm lever",
    descriptionSk:
      "Stroj na pritahovanie ruk zhora nadol takmer vystretymi pazami. Precvičuje hlavne chrbat a sirku chrbta.",
    imageAsset: "stahovanie biceps-vystretymi-rukami.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "assisted-pull-up-dip",
    brand: "Gym80",
    modelName: "Assisted Pull Up and Dip",
    displayNameSk: "Zhyby a dipy s dopomocou",
    category: "Selectorized",
    muscleGroup: "Chrbat",
    imageHint: "Assisted pull-up and dip machine with kneeling platform",
    descriptionSk:
      "Stroj na zhyby a dipy s dopomocou. Precvičuje hlavne chrbat, hrudnik, ramena a tricepsy podla zvoleneho cviku.",
    imageAsset: "zhyby-a-dipy-s-dopomocou.jpg",
    setupNoteLabel: "Seat depth"
  },
  {
    id: "bodyweight-station",
    brand: "Gym80",
    modelName: "Bodyweight Station",
    displayNameSk: "Bradlá na dipy a zhyby",
    category: "Bodyweight",
    muscleGroup: "Chrbat",
    imageHint: "Bodyweight station for pull-ups and dips",
    descriptionSk:
      "Stanoviste na cvicenie s vlastnou vahou. Da sa pouzit na zhyby, dipy a dalsie cviky na chrbat, hrudnik, ramena a ruky.",
    imageAsset: "bradla-na-dipy-a-zhyby.jpg",
    setupNoteLabel: "Seat depth"
  },
  {
    id: "bodyweight-core-station",
    brand: "Gym80",
    modelName: "Bodyweight Core Station",
    displayNameSk: "Stanoviste na zhyby, dipy a brucho",
    category: "Bodyweight",
    muscleGroup: "Chrbat",
    imageHint: "Bodyweight station for pull-ups, dips and abs",
    descriptionSk:
      "Stanoviste na cvicenie s vlastnou vahou. Da sa pouzit na zhyby, dipy, zdvihy noh na brucho a dalsie cviky na chrbat, hrudnik, ramena, ruky aj brucho.",
    imageAsset: "stanoviste-na-zhyby-dipy-a-brucho.jpg",
    setupNoteLabel: "Seat depth"
  },
  {
    id: "seated-abdominal-machine",
    brand: "Gym80",
    modelName: "Abdominal Machine",
    displayNameSk: "Brusný stroj v sede",
    category: "Selectorized",
    muscleGroup: "Brucho",
    imageHint: "Seated abdominal machine with chest pad and leg support",
    descriptionSk:
      "Stroj na brucho v sede. Precvičuje hlavne priame brusne svaly.",
    imageAsset: "brusny-stroj.jpg",
    setupNoteLabel: "Seat depth"
  },
  {
    id: "torso-rotation-squat",
    brand: "Gym80",
    modelName: "Squat Hip Abduction",
    displayNameSk: "Rozťahovanie nôh v drepe",
    category: "Selectorized",
    muscleGroup: "Nohy",
    imageHint: "Squat machine with outward knee drive",
    descriptionSk:
      "Stroj na drepovy pohyb s roztlacanim noh do stran. Precvičuje hlavne boky stehien, zadok a vonkajsiu cast noh.",
    imageAsset: "roztahovanie-noh-v-drepe.jpg",
    setupNoteLabel: "Seat depth"
  },
  {
    id: "biceps-curl-preacher",
    brand: "Gym80",
    modelName: "Biceps Curl",
    displayNameSk: "Bicepsový zdvih na opierke",
    category: "Selectorized",
    muscleGroup: "Ruky",
    imageHint: "Preacher curl machine with angled arm pad",
    descriptionSk:
      "Stroj na bicepsovy zdvih s opretimi rukami. Precvičuje hlavne bicepsy.",
    imageAsset: "bicepsovy-zdvih.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "preacher-bench",
    brand: "Gym80",
    modelName: "Preacher Bench",
    displayNameSk: "Scottova lavička na biceps",
    category: "Bench",
    muscleGroup: "Ruky",
    imageHint: "Preacher bench for biceps curls",
    descriptionSk:
      "Lavicka na bicepsove zdvihy s oporou ruk. Precvičuje hlavne bicepsy.",
    imageAsset: "scottova-lavicka-na-biceps.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "seated-triceps-press",
    brand: "Gym80",
    modelName: "Seated Triceps Press",
    displayNameSk: "Tricepsovy tlak v sede",
    category: "Selectorized",
    muscleGroup: "Triceps",
    imageHint: "Seated triceps press machine with elbow support and handles",
    descriptionSk:
      "Stroj na tlak rukami nadol v sede. Precvicuje hlavne tricepsy a zadnu cast pazi.",
    imageAsset: "tricepsovy-tlak-v-sede.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "seated-chest-press",
    brand: "Gym80",
    modelName: "Seated Chest Press",
    displayNameSk: "Odtláčanie na hrudník v sede",
    category: "Selectorized",
    muscleGroup: "Hrudnik",
    imageHint: "Seated chest press with two handles",
    descriptionSk:
      "Stroj na odtlacanie v sede. Precvičuje hlavne hrudnik, prednu cast ramien a tricepsy.",
    imageAsset: "odtlacanie-na-hrudnik-v-sede.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "seated-chest-fly",
    brand: "Gym80",
    modelName: "Seated Chest Fly",
    displayNameSk: "Rozpažovanie na hrudník v sede",
    category: "Selectorized",
    muscleGroup: "Hrudnik",
    imageHint: "Seated chest fly machine",
    descriptionSk:
      "Stroj na rozpažovanie v sede. Precvičuje hlavne hrudnik a prednu cast ramien.",
    imageAsset: "rozpazovanie-na-hrudnik-v-sede.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "decline-chest-press",
    brand: "Gym80",
    modelName: "Decline Chest Press",
    displayNameSk: "Tlaky na hrudník nadol v sede",
    category: "Selectorized",
    muscleGroup: "Hrudnik",
    imageHint: "Downward pressing chest machine",
    descriptionSk:
      "Stroj na tlacenie ruk nadol a dopredu v sede. Precvičuje hlavne spodnu cast hrudnika, tricepsy a prednu cast ramien.",
    imageAsset: "tlaky-na-hrudnik-nadol-v-sede.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "incline-chest-press",
    brand: "Gym80",
    modelName: "Incline Chest Press",
    displayNameSk: "Tlaky na hrudník šikmo",
    category: "Plate Loaded",
    muscleGroup: "Hrudnik",
    imageHint: "Incline chest press machine",
    descriptionSk:
      "Stroj na odtlacanie ruk v sikmom smere. Precvičuje hlavne vrchnu cast hrudnika, prednu cast ramien a tricepsy.",
    imageAsset: "tlaky-na-hrudnik-sikmo.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "decline-incline-chest-press",
    brand: "Gym80",
    modelName: "Decline Incline Chest Press",
    displayNameSk: "Tlaky na hrudník šikmo nadol",
    category: "Plate Loaded",
    muscleGroup: "Hrudnik",
    imageHint: "Decline chest press machine",
    descriptionSk:
      "Stroj na odtlacanie ruk v sikmom smere nadol. Precvičuje hlavne spodnu cast hrudnika, prednu cast ramien a tricepsy.",
    imageAsset: "tlaky-na-hrudnik-sikmo-nadol.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "incline-up-chest-press",
    brand: "Gym80",
    modelName: "Incline Up Chest Press",
    displayNameSk: "Tlaky na hrudník hore v sede",
    category: "Plate Loaded",
    muscleGroup: "Hrudnik",
    imageHint: "Upward chest press machine",
    descriptionSk:
      "Stroj na odtlacanie ruk smerom hore v sede. Precvičuje hlavne vrchnu cast hrudnika, prednu cast ramien a tricepsy.",
    imageAsset: "tlaky-na-hrudnik-hore-v-sede.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "lying-chest-press",
    brand: "Gym80",
    modelName: "Lying Chest Press",
    displayNameSk: "Tlaky na hrudník v ľahu",
    category: "Plate Loaded",
    muscleGroup: "Hrudnik",
    imageHint: "Lying chest press machine",
    descriptionSk:
      "Stroj na odtlacanie ruk v lahu na lavicke. Precvičuje hlavne hrudnik, prednu cast ramien a tricepsy.",
    imageAsset: "tlaky-na-hrudnik-v-lahu.jpg",
    setupNoteLabel: "Bench position"
  },
  {
    id: "seated-leg-press",
    brand: "Gym80",
    modelName: "Seated Leg Press",
    displayNameSk: "Tlak nohami v sede",
    category: "Selectorized",
    muscleGroup: "Nohy",
    imageHint: "Seated leg press with foot plate",
    descriptionSk:
      "Stroj na odtlacanie nohami v sede. Precvičuje hlavne predne stehna, zadok a dalsie svaly noh.",
    imageAsset: "tlak-nohami-v-sede.jpg",
    setupNoteLabel: "Back pad position"
  },
  {
    id: "incline-leg-press",
    brand: "Gym80",
    modelName: "Incline Leg Press",
    displayNameSk: "Tlak nohami šikmo",
    category: "Plate Loaded",
    muscleGroup: "Nohy",
    imageHint: "Incline leg press machine",
    descriptionSk:
      "Stroj na odtlacanie nohami v sikmej polohe. Precvičuje hlavne predne stehna, zadok a dalsie svaly noh.",
    imageAsset: "tlak-nohami-sikmo.jpg",
    setupNoteLabel: "Back pad position"
  },
  {
    id: "lying-leg-press",
    brand: "Gym80",
    modelName: "Lying Leg Press",
    displayNameSk: "Tlak nohami v ľahu",
    category: "Plate Loaded",
    muscleGroup: "Nohy",
    imageHint: "Lying leg press machine",
    descriptionSk:
      "Stroj na odtlacanie nohami v lahu. Precvičuje hlavne predne stehna, zadok a dalsie svaly noh.",
    imageAsset: "tlak-nohami-v-lahu.jpg",
    setupNoteLabel: "Back pad position"
  },
  {
    id: "seated-shoulder-press",
    brand: "Gym80",
    modelName: "Seated Shoulder Press",
    displayNameSk: "Tlaky na ramená v sede",
    category: "Selectorized",
    muscleGroup: "Ramena",
    imageHint: "Seated shoulder press machine",
    descriptionSk:
      "Stroj na vytlacanie ruk nad hlavu v sede. Precvičuje hlavne ramena a tricepsy.",
    imageAsset: "tlaky-na-ramena-v-sede.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "incline-shoulder-press",
    brand: "Gym80",
    modelName: "Incline Shoulder Press",
    displayNameSk: "Tlaky na ramená šikmo",
    category: "Plate Loaded",
    muscleGroup: "Ramena",
    imageHint: "Incline shoulder press machine",
    descriptionSk:
      "Stroj na vytlacanie ruk v sikmom smere. Precvičuje hlavne ramena a tricepsy.",
    imageAsset: "tlaky-na-ramena-sikmo.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "seated-shoulder-press-support",
    brand: "Gym80",
    modelName: "Seated Shoulder Press Support",
    displayNameSk: "Tlaky na ramená v sede s opierkou",
    category: "Plate Loaded",
    muscleGroup: "Ramena",
    imageHint: "Seated shoulder press with back support",
    descriptionSk:
      "Stroj na vytlacanie ruk v sede s oporou chrbta. Precvičuje hlavne ramena a tricepsy.",
    imageAsset: "tlaky-na-ramena-v-sede-s-opierkou.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "upward-shoulder-press",
    brand: "Gym80",
    modelName: "Upward Shoulder Press",
    displayNameSk: "Tlaky na ramená nahor šikmo",
    category: "Plate Loaded",
    muscleGroup: "Ramena",
    imageHint: "Upward shoulder press machine",
    descriptionSk:
      "Stroj na vytlacanie ruk nahor v sikmom smere. Precvičuje hlavne ramena a tricepsy.",
    imageAsset: "tlaky-na-ramena-nahor-sikmo.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "back-extension-machine",
    brand: "Gym80",
    modelName: "Back Extension Machine",
    displayNameSk: "Zaklony na spodný chrbát",
    category: "Selectorized",
    muscleGroup: "Chrbat",
    imageHint: "Back extension machine",
    descriptionSk:
      "Stroj na zaklony a spevnenie stredu tela. Precvičuje hlavne spodny chrbat, zadok a zadnu cast stehien.",
    imageAsset: "zaklony-na-spodny-chrbat.jpg",
    setupNoteLabel: "Back pad position"
  },
  {
    id: "hyperextension-bench",
    brand: "Gym80",
    modelName: "Hyperextension Bench",
    displayNameSk: "Hyperextenzná lavička",
    category: "Bench",
    muscleGroup: "Chrbat",
    imageHint: "Hyperextension bench",
    descriptionSk:
      "Lavicka na zaklony a spevnenie stredu tela. Precvičuje hlavne spodny chrbat, zadok a zadnu cast stehien.",
    imageAsset: "hyperextenzna-lavicka.jpg",
    setupNoteLabel: "Back pad position"
  },
  {
    id: "smith-machine",
    brand: "Gym80",
    modelName: "Smith Machine",
    displayNameSk: "Smithov stroj",
    category: "Rack",
    muscleGroup: "Cele telo",
    imageHint: "Smith machine",
    descriptionSk:
      "Vedena velka cinka na viacero cvikov. Da sa pouzit na drepy, tlaky, vypady aj dalsie zakladne cviky.",
    imageAsset: "smithov-stroj.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "squat-rack",
    brand: "Gym80",
    modelName: "Squat Rack",
    displayNameSk: "Drepovací stojan",
    category: "Rack",
    muscleGroup: "Cele telo",
    imageHint: "Squat rack",
    descriptionSk:
      "Stojan na cviky s velkou cinkou. Da sa pouzit na drepy, tlaky, vypady a dalsie zakladne cviky.",
    imageAsset: "drepovaci-stojan.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "cable-station",
    brand: "Gym80",
    modelName: "Cable Station",
    displayNameSk: "Kladky na celé telo",
    category: "Cable",
    muscleGroup: "Cele telo",
    imageHint: "Cable crossover station",
    descriptionSk:
      "Stroj s nastavitelnymi kladkami na vela cvikov. Da sa pouzit na chrbat, hrudnik, ramena, ruky aj nohy podla zvoleneho cviku.",
    imageAsset: "kladky-na-cele-telo.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "cable-tower-dual",
    brand: "Gym80",
    modelName: "Dual Cable Tower",
    displayNameSk: "Kladkova veza",
    category: "Cable",
    muscleGroup: "Cele telo",
    imageHint: "Dual cable station with adjustable pulleys",
    descriptionSk:
      "Univerzalny stroj s dvoma kladkami. Da sa pouzit na chrbat, hrudnik, ramena, ruky aj brucho podla zvoleneho cviku.",
    imageAsset: "kladkova-veza.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "seated-cable-row-low",
    brand: "Gym80",
    modelName: "Seated Cable Row",
    displayNameSk: "Pritah na chrbat v sede",
    category: "Cable",
    muscleGroup: "Chrbat",
    imageHint: "Seated cable row with foot support",
    descriptionSk:
      "Stroj na pritahovanie madiel k telu v sede. Precvicuje hlavne stred chrbta, siroky chrbtovy sval a zadnu cast ramien.",
    imageAsset: "pritah-na-chrbat-v-sede-kladka.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "lat-pulldown-selectorized",
    brand: "Gym80",
    modelName: "Lat Pulldown",
    displayNameSk: "Stahovanie hornej kladky",
    category: "Selectorized",
    muscleGroup: "Chrbat",
    imageHint: "Lat pulldown with thigh pads and wide bar",
    descriptionSk:
      "Stroj na stahovanie tyce zhora k hrudniku v sede. Precvicuje hlavne siroky chrbtovy sval, stred chrbta a bicepsy.",
    imageAsset: "stahovanie-hornej-kladky.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "incline-row-machine",
    brand: "Gym80",
    modelName: "Incline Row Machine",
    displayNameSk: "Príťah na chrbát v predklone",
    category: "Plate Loaded",
    muscleGroup: "Chrbat",
    imageHint: "Incline row machine",
    descriptionSk:
      "Stroj na pritahovanie v predklone s oporou. Precvičuje hlavne chrbat, zadnu cast ramien a bicepsy.",
    imageAsset: "pritah-na-chrbat-v-predklone.jpg",
    setupNoteLabel: "Chest pad height"
  },
  {
    id: "seated-row-machine",
    brand: "Gym80",
    modelName: "Seated Row Machine",
    displayNameSk: "Príťah na chrbát v sede",
    category: "Plate Loaded",
    muscleGroup: "Chrbat",
    imageHint: "Seated row machine",
    descriptionSk:
      "Stroj na pritahovanie ruk k telu v sede. Precvičuje hlavne chrbat, zadnu cast ramien a bicepsy.",
    imageAsset: "pritah-na-chrbat-v-sede.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "supported-row-machine",
    brand: "Gym80",
    modelName: "Supported Row Machine",
    displayNameSk: "Príťah na chrbát na opierke",
    category: "Plate Loaded",
    muscleGroup: "Chrbat",
    imageHint: "Supported row machine with chest pad",
    descriptionSk:
      "Stroj na pritahovanie ruk k telu s oporou hrudnika. Precvičuje hlavne chrbat, zadnu cast ramien a bicepsy.",
    imageAsset: "pritah-na-chrbat-na-opierke.jpg",
    setupNoteLabel: "Chest pad height"
  },
  {
    id: "seated-lat-pulldown",
    brand: "Gym80",
    modelName: "Seated Lat Pulldown",
    displayNameSk: "Sťahovanie kladiek na chrbát v sede",
    category: "Plate Loaded",
    muscleGroup: "Chrbat",
    imageHint: "Plate loaded pulldown machine",
    descriptionSk:
      "Stroj na stahovanie ruk zhora nadol v sede. Precvičuje hlavne chrbat, zadnu cast ramien a bicepsy.",
    imageAsset: "stahovanie-kladiek-na-chrbat-v-sede.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "seated-bar-pulldown",
    brand: "Gym80",
    modelName: "Seated Bar Pulldown",
    displayNameSk: "Sťahovanie tyče na chrbát v sede",
    category: "Plate Loaded",
    muscleGroup: "Chrbat",
    imageHint: "Bar pulldown machine",
    descriptionSk:
      "Stroj na stahovanie tyce zhora nadol v sede. Precvičuje hlavne chrbat, zadnu cast ramien a bicepsy.",
    imageAsset: "stahovanie-tyce-na-chrbat-v-sede.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "lying-leg-curl-machine",
    brand: "Gym80",
    modelName: "Lying Leg Curl",
    displayNameSk: "Zakopávanie v ľahu",
    category: "Plate Loaded",
    muscleGroup: "Nohy",
    imageHint: "Lying leg curl machine",
    descriptionSk:
      "Stroj na zakopavanie noh v lahu. Precvičuje hlavne zadnu cast stehien.",
    imageAsset: "zakopavanie-v-lahu.jpg",
    setupNoteLabel: "Bench position"
  },
  {
    id: "ab-bench",
    brand: "Gym80",
    modelName: "Ab Bench",
    displayNameSk: "Lavička na brucho",
    category: "Bench",
    muscleGroup: "Brucho",
    imageHint: "Ab bench",
    descriptionSk:
      "Lavicka na cviky na brucho a stred tela. Precvičuje hlavne priame brusne svaly.",
    imageAsset: "lavicka-na-brucho.jpg",
    setupNoteLabel: "Seat depth"
  },
  {
    id: "hip-thrust-machine",
    brand: "Gym80",
    modelName: "Hip Thrust Machine",
    displayNameSk: "Hip thrust stroj",
    category: "Plate Loaded",
    muscleGroup: "Nohy",
    imageHint: "Hip thrust machine with back support",
    descriptionSk:
      "Stroj na vytlacanie panvy hore s oporou chrbta. Precvičuje hlavne zadok a zadnu cast stehien.",
    imageAsset: "hip-thrust-stroj.jpg",
    setupNoteLabel: "Bench position"
  },
  {
    id: "supported-chest-press",
    brand: "Gym80",
    modelName: "Supported Chest Press",
    displayNameSk: "Tlaky na hrudník s opierkou",
    category: "Plate Loaded",
    muscleGroup: "Hrudnik",
    imageHint: "Chest press machine with back support",
    descriptionSk:
      "Stroj na odtlacanie ruk dopredu v sede s oporou chrbta. Precvičuje hlavne hrudnik, prednu cast ramien a tricepsy.",
    imageAsset: "tlaky-na-hrudnik-s-opierkou.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "seated-calf-raise-support",
    brand: "Gym80",
    modelName: "Seated Calf Raise Support",
    displayNameSk: "Výpony na lýtka v sede s oporou",
    category: "Plate Loaded",
    muscleGroup: "Nohy",
    imageHint: "Seated calf raise with support",
    descriptionSk:
      "Stroj na vytlacanie cez spicky v sede s oporou stehien. Precvičuje hlavne lytka.",
    imageAsset: "vypony-na-lytka-v-sede-s-oporou.jpg",
    setupNoteLabel: "Foot stance"
  },
  {
    id: "supported-squat-machine",
    brand: "Gym80",
    modelName: "Supported Squat Machine",
    displayNameSk: "Drepovací stroj s opierkou",
    category: "Plate Loaded",
    muscleGroup: "Nohy",
    imageHint: "Supported squat machine",
    descriptionSk:
      "Stroj na drepovy pohyb s oporou tela. Precvičuje hlavne predne stehna, zadok a dalsie svaly noh.",
    imageAsset: "drepovaci-stroj-s-opierkou.jpg",
    setupNoteLabel: "Foot stance"
  },
  {
    id: "dual-platform-leg-press",
    brand: "Gym80",
    modelName: "Dual Platform Leg Press",
    displayNameSk: "Leg press s dvoma plochami",
    category: "Plate Loaded",
    muscleGroup: "Nohy",
    imageHint: "Leg press with dual platforms",
    descriptionSk:
      "Stroj na odtlacanie nohami s dvoma plosinami. Precvičuje hlavne predne stehna, zadok a dalsie svaly noh.",
    imageAsset: "leg-press-s-dvoma-plochami.jpg",
    setupNoteLabel: "Foot stance"
  },
  {
    id: "overhead-shoulder-press-seated",
    brand: "Gym80",
    modelName: "Overhead Shoulder Press Seated",
    displayNameSk: "Tlaky na ramená hore v sede",
    category: "Selectorized",
    muscleGroup: "Ramena",
    imageHint: "Overhead seated shoulder press",
    descriptionSk:
      "Stroj na vytlacanie ruk hore v sede. Precvičuje hlavne ramena a tricepsy.",
    imageAsset: "tlaky-na-ramena-hore-v-sede.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "seated-abduction-machine",
    brand: "Gym80",
    modelName: "Seated Abduction Machine",
    displayNameSk: "Roznožovanie v sede",
    category: "Selectorized",
    muscleGroup: "Nohy",
    imageHint: "Seated hip abduction machine",
    descriptionSk:
      "Stroj na tlacenie noh do stran v sede. Precvičuje hlavne vonkajsiu cast stehien a zadok.",
    imageAsset: "roznozovanie-v-sede.jpg",
    setupNoteLabel: "Seat depth"
  },
  {
    id: "leg-press-45",
    brand: "Gym80",
    modelName: "45 Degree Leg Press",
    displayNameSk: "Tlak nohami 45 stupňov",
    category: "Plate Loaded",
    muscleGroup: "Nohy",
    imageHint: "45 degree leg press",
    descriptionSk:
      "Stroj na odtlacanie nohami v sikmej 45 stupnovej polohe. Precvičuje hlavne predne stehna, zadok a dalsie svaly noh.",
    imageAsset: "tlak-nohami-45-stupnov.jpg",
    setupNoteLabel: "Back pad position"
  },
  {
    id: "seated-biceps-curl",
    brand: "Gym80",
    modelName: "Seated Biceps Curl",
    displayNameSk: "Bicepsový zdvih v sede",
    category: "Plate Loaded",
    muscleGroup: "Ruky",
    imageHint: "Seated biceps curl machine",
    descriptionSk:
      "Stroj na bicepsovy zdvih v sede. Precvičuje hlavne bicepsy a prednu cast ruk.",
    imageAsset: "bicepsovy-zdvih-v-sede.jpg",
    setupNoteLabel: "Seat height"
  },
  {
    id: "treadmill",
    brand: "Gym80",
    modelName: "Treadmill",
    displayNameSk: "Bežecký pás",
    category: "Kardio",
    muscleGroup: "Kardio",
    imageHint: "Treadmill for walking and running",
    descriptionSk:
      "Stroj na chodzu a beh. Pouziva sa na kardio, vytrvalost a spalovanie.",
    imageAsset: "bezecky-pas.jpg",
    setupNoteLabel: "Cardio"
  },
  {
    id: "free-weights-chest",
    brand: "Volne vahy",
    modelName: "Free Weights Chest",
    displayNameSk: "Volne vahy - hrudnik",
    category: "Volne vahy",
    muscleGroup: "Hrudnik",
    imageHint: "Manualny zapis cvikov s volnymi vahami na hrudnik",
    descriptionSk:
      "Manualny zapis cvikov s volnymi vahami na hrudnik. AI odporuca pri naberani svalov vacsinou 3 az 4 serie po 8 az 12 opakovani.",
    setupNoteLabel: "Free weights"
  },
  {
    id: "free-weights-back",
    brand: "Volne vahy",
    modelName: "Free Weights Back",
    displayNameSk: "Volne vahy - chrbat",
    category: "Volne vahy",
    muscleGroup: "Chrbat",
    imageHint: "Manualny zapis cvikov s volnymi vahami na chrbat",
    descriptionSk:
      "Manualny zapis cvikov s volnymi vahami na chrbat. AI odporuca kontrolovany tah, pevny stred tela a 3 az 4 serie po 8 az 12 opakovani.",
    setupNoteLabel: "Free weights"
  },
  {
    id: "free-weights-shoulders",
    brand: "Volne vahy",
    modelName: "Free Weights Shoulders",
    displayNameSk: "Volne vahy - ramena",
    category: "Volne vahy",
    muscleGroup: "Ramena",
    imageHint: "Manualny zapis cvikov s volnymi vahami na ramena",
    descriptionSk:
      "Manualny zapis cvikov s volnymi vahami na ramena. Pri cieli nabrat svaly dava zmysel 3 az 4 serie po 8 az 12 opakovani.",
    setupNoteLabel: "Free weights"
  },
  {
    id: "free-weights-arms",
    brand: "Volne vahy",
    modelName: "Free Weights Arms",
    displayNameSk: "Volne vahy - ruky",
    category: "Volne vahy",
    muscleGroup: "Ruky",
    imageHint: "Manualny zapis cvikov s volnymi vahami na ruky",
    descriptionSk:
      "Manualny zapis cvikov s volnymi vahami na biceps a triceps. AI odporuca 3 az 4 serie po 10 az 12 opakovani.",
    setupNoteLabel: "Free weights"
  },
  {
    id: "free-weights-legs",
    brand: "Volne vahy",
    modelName: "Free Weights Legs",
    displayNameSk: "Volne vahy - nohy",
    category: "Volne vahy",
    muscleGroup: "Nohy",
    imageHint: "Manualny zapis cvikov s volnymi vahami na nohy",
    descriptionSk:
      "Manualny zapis cvikov s volnymi vahami na nohy. Pri kolenach drz kontrolovany rozsah, techniku a nechod do bolesti.",
    setupNoteLabel: "Free weights"
  },
  {
    id: "free-weights-core",
    brand: "Volne vahy",
    modelName: "Free Weights Core",
    displayNameSk: "Volne vahy - brucho",
    category: "Volne vahy",
    muscleGroup: "Brucho",
    imageHint: "Manualny zapis cvikov na brucho a stred tela",
    descriptionSk:
      "Manualny zapis cvikov na brucho a stred tela. AI odporuca kontrolovane tempo a 2 az 4 serie podla narocnosti cviku.",
    setupNoteLabel: "Free weights"
  }
];

export const mockWorkoutSessions: WorkoutSession[] = [];
