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
    imageAsset: "3001_predkopavanie_1.webp",
    imageAssets: [
      "3001_predkopavanie_2.webp"
    ],
    videoUrl: "https://youtu.be/9v7u3ofd9vA?si=H9BTJo6oTXPxb-kL",
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
    imageAsset: "3003_zakopavanie_1.webp",
    imageAssets: [
      "3003_zakopavanie_2.jpg"
    ],
    videoUrl: "https://youtu.be/hEW553x_QTM?si=5bUpzYpQT31Y-gmP",
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
    imageAsset: "3027_lytka-v-sede_1.webp",
    imageAssets: [
      "3027_lytka-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/kDGYwmHtuxE?si=M-yeYAfEdVI5hhgV",
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
    imageAsset: "4026_lytka-v-predklone_1.webp",
    imageAssets: [
      "4026_lytka-v-predklone_2.jpg"
    ],
    videoUrl: "https://youtu.be/k8PRCiK9BLA?si=zPl3ZE9GzpW-f1pl",
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
    imageAsset: "4337_lytka-v-predklone-na-opierke_1.webp",
    imageAssets: [
      "4337_lytka-v-predklone-na-opierke_2.webp"
    ],
    setupNoteLabel: "Foot stance"
  },
  {
    id: "seated-straight-arm-pulldown",
    brand: "Gym80",
    modelName: "Back Extension",
    displayNameSk: "Zakláňanie dozadu na chrbát",
    category: "Selectorized",
    muscleGroup: "Chrbat",
    imageHint: "Back extension machine with seated support",
    descriptionSk:
      "Stroj na zaklananie dozadu a spevnenie chrbta. Precvicuje hlavne spodny chrbat, zadok a zadnu cast stehien.",
    imageAsset: "3007_zaklananie do zadu na chrbat_1.webp",
    imageAssets: [
      "3007_zaklananie do zadu na chrbat_2.jpg"
    ],
    videoUrl: "https://youtu.be/abyKvjJ2Yuc?si=ERbsOuNAX5Sl6Rjw",
    setupNoteLabel: "Back pad position"
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
    imageAsset: "3017_zhyby-a-dipy-s-dopomocou_1.webp",
    imageAssets: [
      "3017_zhyby-a-dipy-s-dopomocou_2.jpg"
    ],
    videoUrl: "https://youtu.be/L05qvFArXmE?si=4zUJslNv_2X3G2un",
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
    imageAsset: "4021_bradla-na-dipy-a-zhyby_1.webp",
    imageAssets: [
      "4021_bradla-na-dipy-a-zhyby_2.jpg"
    ],
    videoUrl: "https://youtu.be/_kx544pkYJU?si=YvONldPHwE5kUCtO",
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
    imageAsset: "4031_stanoviste-na-zhyby-dipy-a-brucho_1.webp",
    imageAssets: [
      "4031_stanoviste-na-zhyby-dipy-a-brucho_2.jpg"
    ],
    videoUrl: "https://youtu.be/Yozj1b0JC9w?si=dJqVHxbD4Eff1mP0",
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
    imageAsset: "3008_brusny-stroj_1.webp",
    imageAssets: [
      "3008_brusny-stroj_2.jpg"
    ],
    videoUrl: "https://youtu.be/AxhVsJLNNBw?si=u_mtLD9orE9Gqt4p",
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
    imageAssets: [
      "bicepsovy-zdvih-opierka-overview.jpg",
      "bicepsovy-zdvih-opierka-nc.webp"
    ],
    videoUrl: "https://youtu.be/drpIj2RZmEU?si=OJY-EJsF8kiRuMmH",
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
    imageAsset: "3014_tricepsovy tlak v sede_1.webp",
    imageAssets: [
      "3014_tricepsovy tlak v sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/aN0MIGt9R0w?si=-0FBFE0T-M8X7F99",
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
    imageAsset: "3016_odtlacanie-na-hrudnik-v-sede_1.webp",
    imageAssets: [
      "3016_odtlacanie-na-hrudnik-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/wrDFqozJ_c0?si=wNCQK6ZekO887_bf",
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
    imageAsset: "3022_rozpazovanie-na-hrudnik-v-sede_1.webp",
    imageAssets: [
      "3022_rozpazovanie-na-hrudnik-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/KcaZ93f8yww?si=Umlm_9ho4tXHbnl-",
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
    imageAssets: [
      "3036_tlaky-na-hrudnik-nadol-v-sede_1.webp",
      "3036_tlaky-na-hrudnik-nadol-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/iBrnSfp3eVs?si=Ka8BJhVo3PT7gK3z",
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
    imageAsset: "4341_tlaky-na-hrudnik-sikmo_1.webp",
    imageAssets: [
      "4341_tlaky-na-hrudnik-sikmo_2.jpg"
    ],
    videoUrl: "https://youtu.be/OFMGNhhrIT0?si=9YcTaKcxoLor_FJV",
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
    imageAsset: "4346_tlaky-na-hrudnik-sikmo-nadol_1.webp",
    imageAssets: [
      "4346_tlaky-na-hrudnik-sikmo-nadol_2.jpg"
    ],
    videoUrl: "https://youtu.be/Qe8F1xp3oDU?si=trVViqgd6uLK_w1D",
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
    imageAsset: "4335_tlaky-na-hrudnik-hore-v-sede_1.webp",
    imageAssets: [
      "4335_tlaky-na-hrudnik-hore-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/vp6G74LcsqM?si=8KS4Ap_PpQC45ww2",
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
    imageAsset: "4331_tlaky-na-hrudnik-v-lahu_1.webp",
    imageAssets: [
      "4331_tlaky-na-hrudnik-v-lahu_2.jpg"
    ],
    videoUrl: "https://youtu.be/hi4IuKMTGrQ?si=w0b1LHgRWl_Rkll1",
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
    imageAsset: "3030_tlak-nohami-v-sede_1.webp",
    imageAssets: [
      "3030_tlak-nohami-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/b4s_pQTwfz0?si=1grUMmMHXgUR4uc7",
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
    imageAsset: "4159_tlak-nohami-sikmo_2.jpg",
    videoUrl: "https://youtu.be/dE_nadcuD3o?si=WQpxTQFgNUi3Bfb8",
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
    imageAsset: "4324_tlak-nohami-v-lahu_1.webp",
    imageAssets: [
      "4324_tlak-nohami-v-lahu_2.jpg"
    ],
    videoUrl: "https://youtu.be/4PFbqPtTzLo?si=txUCwz6LHNlX1a-y",
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
    imageAsset: "4322_tlaky-na-ramena-v-sede-s-opierkou_1.webp",
    imageAssets: [
      "4322_tlaky-na-ramena-v-sede-s-opierkou_2.jpg"
    ],
    videoUrl: "https://youtu.be/wlRiUzLYobw?si=AUZ40tKBWTq0Xu_X",
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
    imageAsset: "4320_tlaky-na-ramena-nahor-sikmo_1.webp",
    imageAssets: [
      "4320_tlaky-na-ramena-nahor-sikmo_2.jpg"
    ],
    videoUrl: "https://youtu.be/Jm-bQ9AhRlA?si=od2xZvPevk_XDFLc",
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
    imageAsset: "4038_zaklony-na-spodny-chrbat_1.webp",
    imageAssets: [
      "4038_zaklony-na-spodny-chrbat_2.jpg"
    ],
    videoUrl: "https://youtu.be/OmgWCEL-Jpg?si=KuAHGIZbTE4F6-g6",
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
    imageAsset: "4012_kladkova-veza_1.webp",
    videoUrl: "https://youtu.be/nKhFU68Fcjc?si=a5vXHRuHC0HJbuTd",
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
    imageAssets: [
      "4016_pritah-na-chrbat-v-sede-kladka_1.webp"
    ],
    videoUrl: "https://youtu.be/MxIGOHJ8gHQ?si=zXAfK1CLI3c-TGP5",
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
    imageAsset: "4116_stahovanie-hornej-kladky_1.webp",
    videoUrl: "https://youtu.be/MmbKY6FLkLM?si=MslrmbYSoWsxpgjP",
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
    imageAsset: "4018_T_bar_chrbat_1.webp",
    imageAssets: [
      "4018_T_bar_chrbat_2.jpg"
    ],
    videoUrl: "https://youtu.be/ElBu6Pk0Z60?si=b_nwEe6LldRI1t4V",
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
    imageAsset: "4319_pritah-na-chrbat-v-sede_1.webp",
    imageAssets: [
      "4319_pritah-na-chrbat-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/ggCfI3GVRY0?si=3P1_YZtAd4l5wtUX",
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
    imageAsset: "4344_pritah-na-chrbat-na-opierke_1.webp",
    imageAssets: [
      "4344_pritah-na-chrbat-na-opierke_2.jpg"
    ],
    videoUrl: "https://youtu.be/XkN8Ly14j-M?si=gXhcH-wGiojhAs5y",
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
    imageAsset: "4311_stahovanie-kladiek-na-chrbat-v-sede_1.webp",
    imageAssets: [
      "4311_stahovanie-kladiek-na-chrbat-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/r8jqKqruwGU?si=GkV-lzJmsPKslF08",
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
    imageAsset: "4382_stahovanie-tyce-na-chrbat-v-sede_1.webp",
    imageAssets: [
      "4382_stahovanie-tyce-na-chrbat-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/-F7Wnt6HYH8?si=0Chpg9rMRcRVj7tR",
    setupNoteLabel: "Seat height"
  },
  {
    id: "lying-leg-curl-machine",
    brand: "Gym80",
    modelName: "Seated Leg Curl",
    displayNameSk: "Zakopavanie v sede",
    category: "Plate Loaded",
    muscleGroup: "Nohy",
    imageHint: "Seated leg curl machine",
    descriptionSk:
      "Stroj na zakopavanie noh v sede. Precvicuje hlavne zadnu cast stehien.",
    imageAsset: "4336_zakopavanie-v-sede-1.webp",
    imageAssets: [
      "4336_zakopavanie-v-sede-2.jpg"
    ],
    videoUrl: "https://youtu.be/DWt8moqtQIU?si=BoUebHIO4xWdpqVT",
    setupNoteLabel: "Back pad position"
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
    imageAsset: "4307_lavicka-na-brucho_1.webp",
    imageAssets: [
      "4307_lavicka-na-brucho_2.jpg"
    ],
    videoUrl: "https://youtu.be/ZBOYvOwe-2o?si=h3YcG-vzYfvZLobS",
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
    imageAssets: [
      "3012_tlaky-na-hrudnik-s-opierkou_1.webp",
      "3012_tlaky-na-hrudnik-s-opierkou_2.jpg"
    ],
    videoUrl: "https://youtu.be/deSi2MC-UOY?si=FTGguecw1k6CrLe9",
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
    imageAsset: "4352_vypony-na-brucho-v-sede-s-oporou_1.webp",
    imageAssets: [
      "4352_vypony-na-brucho-v-sede-s-oporou_2.jpg"
    ],
    videoUrl: "https://youtu.be/TO5juRMJJkU?si=_jlDF_T4VgISGgFG",
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
    imageAsset: "4353_drepovaci-stroj-s-opierkou_1.webp",
    imageAssets: [
      "4353_drepovaci-stroj-s-opierkou_2.jpg"
    ],
    videoUrl: "https://youtu.be/Oi2dbVxPSiE?si=7Q7RxSMbfzHyr3cp",
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
    imageAsset: "4371_tlaky-na-ramena-hore-v-sede_1.webp",
    imageAssets: [
      "4371_tlaky-na-ramena-hore-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/zfpXmGpL8mA?si=NV7OGNlhxqHyrFqS",
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
    imageAsset: "3028_roznozovanie-v-sede_1.webp",
    imageAssets: [
      "3028_roznozovanie-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/SC2SSQCzvBg?si=WKBBTU3ejJghBEAe",
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
    imageAsset: "4366_bicepsovy-zdvih-v-sede_1.webp",
    imageAssets: [
      "4366_bicepsovy-zdvih-v-sede_2.jpg",
      "4350_bicepsovy-zdvih-v-sede_1.webp",
      "4350_bicepsovy-zdvih-v-sede_2.jpg"
    ],
    videoUrl: "https://youtu.be/V7TLkwJmiEU?si=xoLaPO4YFGPvyh_M",
    setupNoteLabel: "Seat height"
  },
  {
    id: "basic-press-bench",
    brand: "Gym80",
    modelName: "Basic Press Bench",
    displayNameSk: "Lavicka na tlaky",
    category: "Bench",
    muscleGroup: "Hrudnik",
    imageHint: "Flat press bench with barbell rack",
    descriptionSk:
      "Lavicka na tlaky s velkou cinkou. Da sa pouzit hlavne na tlaky na hrudnik a podla uchopu aj na triceps a prednu cast ramien.",
    imageAsset: "4097_basic_press_bench_1.webp",
    imageAssets: [
      "4097_basic_press_bench_2.jpg"
    ],
    videoUrl: "https://youtu.be/rTW67E2R_Pw?si=KnvJzBIzi1imNGuP",
    setupNoteLabel: "Bench position"
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
