import { Machine, WorkoutEntry } from "../types";

type MotivationTone =
  | "supportive"
  | "competitive"
  | "humorous"
  | "analytical"
  | "empathetic"
  | "celebratory";

type MotivationContext =
  | "first_log"
  | "new_machine"
  | "pain"
  | "big_progress"
  | "improvement"
  | "stable_performance"
  | "performance_drop"
  | "hard_set"
  | "cardio"
  | "saved";

type MotivationVariant = "safe" | "standard" | "playful" | "bold";

type MotivationMessage = {
  id: string;
  textSk: string;
  tone: MotivationTone;
  contextTags: MotivationContext[];
  emojiList: string[];
  priority: number;
  variantLevel: MotivationVariant;
  cooldownSec: number;
  safetyLevel: "normal" | "safe" | "warning";
};

const motivationMessages: MotivationMessage[] = [
  {
    id: "firstlog_001",
    textSk: "Prvy zapis je zaklad. Odteraz uz nehadas, ale progresujes.",
    tone: "supportive",
    contextTags: ["first_log"],
    emojiList: ["📝", "💪"],
    priority: 90,
    variantLevel: "standard",
    cooldownSec: 86400,
    safetyLevel: "normal"
  },
  {
    id: "firstlog_002",
    textSk: "Mame prve data. Svalova matematika sa moze zacat.",
    tone: "analytical",
    contextTags: ["first_log"],
    emojiList: ["🧠", "📊"],
    priority: 82,
    variantLevel: "standard",
    cooldownSec: 86400,
    safetyLevel: "normal"
  },
  {
    id: "newmachine_001",
    textSk: "Novy stroj zapisany. Databaza svalov prave dostala dalsi dielik.",
    tone: "analytical",
    contextTags: ["new_machine"],
    emojiList: ["🧩", "📊"],
    priority: 84,
    variantLevel: "standard",
    cooldownSec: 10800,
    safetyLevel: "normal"
  },
  {
    id: "newmachine_002",
    textSk: "Prvykrat na tomto stroji. Teraz uz mame bod, od ktoreho rasties.",
    tone: "supportive",
    contextTags: ["new_machine"],
    emojiList: ["🌱", "💪"],
    priority: 82,
    variantLevel: "standard",
    cooldownSec: 10800,
    safetyLevel: "normal"
  },
  {
    id: "pain_001",
    textSk: "Toto netlac cez bolest. Uber vahu alebo zmen cvik.",
    tone: "empathetic",
    contextTags: ["pain"],
    emojiList: ["⚠️", "🧠"],
    priority: 100,
    variantLevel: "safe",
    cooldownSec: 21600,
    safetyLevel: "warning"
  },
  {
    id: "pain_002",
    textSk: "Bolest nie je PR. Technika a bezpecie maju prednost.",
    tone: "empathetic",
    contextTags: ["pain"],
    emojiList: ["⚠️", "💛"],
    priority: 95,
    variantLevel: "safe",
    cooldownSec: 21600,
    safetyLevel: "warning"
  },
  {
    id: "bigprog_001",
    textSk: "Velky posun. Toto uz nie je nahoda, ale trend.",
    tone: "celebratory",
    contextTags: ["big_progress"],
    emojiList: ["🚀", "📈"],
    priority: 94,
    variantLevel: "standard",
    cooldownSec: 21600,
    safetyLevel: "normal"
  },
  {
    id: "bigprog_002",
    textSk: "Toto je progres, co sa neda prehliadnut.",
    tone: "celebratory",
    contextTags: ["big_progress"],
    emojiList: ["🎉", "💪"],
    priority: 90,
    variantLevel: "playful",
    cooldownSec: 21600,
    safetyLevel: "normal"
  },
  {
    id: "bigprog_003",
    textSk: "Novy zapis. Stare cislo je historia.",
    tone: "celebratory",
    contextTags: ["big_progress"],
    emojiList: ["🥇", "📈"],
    priority: 92,
    variantLevel: "standard",
    cooldownSec: 21600,
    safetyLevel: "normal"
  },
  {
    id: "bigprog_004",
    textSk: "Svalova matematika vysla. Toto telo si robi poznamky.",
    tone: "humorous",
    contextTags: ["big_progress"],
    emojiList: ["😎", "🔩"],
    priority: 88,
    variantLevel: "playful",
    cooldownSec: 21600,
    safetyLevel: "normal"
  },
  {
    id: "improve_001",
    textSk: "Dnes si posunul cisla. Maly rozdiel, velky smer.",
    tone: "celebratory",
    contextTags: ["improvement"],
    emojiList: ["📈", "💪"],
    priority: 88,
    variantLevel: "standard",
    cooldownSec: 10800,
    safetyLevel: "normal"
  },
  {
    id: "improve_002",
    textSk: "Dnes si bol o krok vpredu pred minulym ja.",
    tone: "supportive",
    contextTags: ["improvement"],
    emojiList: ["👣", "💪"],
    priority: 84,
    variantLevel: "standard",
    cooldownSec: 10800,
    safetyLevel: "normal"
  },
  {
    id: "hardset_001",
    textSk: "Tazke, ale ciste. Presne to chceme.",
    tone: "analytical",
    contextTags: ["hard_set", "stable_performance"],
    emojiList: ["🎯", "✅"],
    priority: 82,
    variantLevel: "safe",
    cooldownSec: 5400,
    safetyLevel: "normal"
  },
  {
    id: "hardset_002",
    textSk: "To bola seria, co mala vlastne pocasie. Dychnut a ideme dalej.",
    tone: "humorous",
    contextTags: ["hard_set"],
    emojiList: ["💪", "🔥"],
    priority: 78,
    variantLevel: "playful",
    cooldownSec: 5400,
    safetyLevel: "normal"
  },
  {
    id: "hardset_003",
    textSk: "Zelezo pochopilo odkaz.",
    tone: "competitive",
    contextTags: ["hard_set"],
    emojiList: ["🔥", "💪"],
    priority: 80,
    variantLevel: "playful",
    cooldownSec: 5400,
    safetyLevel: "normal"
  },
  {
    id: "hardset_004",
    textSk: "Technika drzala. Sila tiez.",
    tone: "analytical",
    contextTags: ["hard_set", "stable_performance"],
    emojiList: ["🎯", "✅"],
    priority: 81,
    variantLevel: "safe",
    cooldownSec: 5400,
    safetyLevel: "normal"
  },
  {
    id: "stable_001",
    textSk: "Stabilny vykon. Dalsi krok moze byt jedno ciste opakovanie navyse.",
    tone: "analytical",
    contextTags: ["stable_performance"],
    emojiList: ["🎯", "📈"],
    priority: 80,
    variantLevel: "standard",
    cooldownSec: 10800,
    safetyLevel: "normal"
  },
  {
    id: "stable_002",
    textSk: "Drzis kvalitu. To je dobry zaklad na dalsi posun.",
    tone: "supportive",
    contextTags: ["stable_performance"],
    emojiList: ["✅", "💪"],
    priority: 78,
    variantLevel: "safe",
    cooldownSec: 10800,
    safetyLevel: "normal"
  },
  {
    id: "drop_001",
    textSk: "Dnes to neodskocilo, ale aj slabsi den je data, nie drama.",
    tone: "supportive",
    contextTags: ["performance_drop"],
    emojiList: ["🌥️", "🧠"],
    priority: 86,
    variantLevel: "safe",
    cooldownSec: 14400,
    safetyLevel: "safe"
  },
  {
    id: "drop_002",
    textSk: "Skontroluj spanok, pauzu a techniku. Zajtra moze byt iny pribeh.",
    tone: "analytical",
    contextTags: ["performance_drop"],
    emojiList: ["🛌", "🎯"],
    priority: 82,
    variantLevel: "safe",
    cooldownSec: 14400,
    safetyLevel: "safe"
  },
  {
    id: "drop_003",
    textSk: "Dnes nemusis vyhrat kazdu seriu. Staci vyhrat navrat do tempa.",
    tone: "supportive",
    contextTags: ["performance_drop"],
    emojiList: ["🔁", "🧱"],
    priority: 84,
    variantLevel: "safe",
    cooldownSec: 14400,
    safetyLevel: "safe"
  },
  {
    id: "cardio_001",
    textSk: "Kardio zapisane. Motor dostal udrzbu, svaly budu vdacne.",
    tone: "supportive",
    contextTags: ["cardio", "saved"],
    emojiList: ["⏱️", "💪"],
    priority: 78,
    variantLevel: "standard",
    cooldownSec: 10800,
    safetyLevel: "normal"
  },
  {
    id: "saved_001",
    textSk: "Ulozene. Dalsi zapis uz trener porovna a zacne mudrovat.",
    tone: "analytical",
    contextTags: ["saved"],
    emojiList: ["📝", "📊"],
    priority: 70,
    variantLevel: "standard",
    cooldownSec: 3600,
    safetyLevel: "normal"
  },
  {
    id: "saved_002",
    textSk: "Hotovo. Dnes si neposuval cas, ale seba.",
    tone: "supportive",
    contextTags: ["saved"],
    emojiList: ["🏁", "👏"],
    priority: 72,
    variantLevel: "standard",
    cooldownSec: 3600,
    safetyLevel: "normal"
  },
  {
    id: "saved_003",
    textSk: "Dnes dobra robota. Telo dostalo dovod rast.",
    tone: "celebratory",
    contextTags: ["saved"],
    emojiList: ["🌱", "💪"],
    priority: 74,
    variantLevel: "standard",
    cooldownSec: 3600,
    safetyLevel: "normal"
  }
];

function getStrengthVolume(entry: WorkoutEntry) {
  if (!entry.weightKg || !entry.sets || !entry.reps) {
    return 0;
  }

  return entry.weightKg * entry.sets * entry.reps;
}

function getCardioScore(entry: WorkoutEntry) {
  if (!entry.durationMin) {
    return 0;
  }

  return entry.durationMin * (entry.speedKph ?? 4) * (1 + (entry.inclinePercent ?? 0) / 20);
}

function hashText(value: string) {
  return value.split("").reduce((hash, char) => {
    return (hash * 31 + char.charCodeAt(0)) >>> 0;
  }, 7);
}

function formatMessage(message: MotivationMessage) {
  return `${message.emojiList.join(" ")} ${message.textSk}`;
}

function pickMessage(context: MotivationContext, seed: string, allowHumor: boolean) {
  const candidates = motivationMessages
    .filter((message) => message.contextTags.includes(context))
    .filter((message) => allowHumor || message.tone !== "humorous")
    .sort((a, b) => b.priority - a.priority);

  if (candidates.length === 0) {
    return motivationMessages.find((message) => message.id === "saved_001") ?? motivationMessages[0];
  }

  const topCandidates = candidates.slice(0, Math.min(3, candidates.length));
  const index = hashText(seed) % topCandidates.length;

  return topCandidates[index];
}

function detectContext({
  machine,
  entry,
  previousEntry,
  totalWorkoutEntries
}: {
  machine?: Machine;
  entry: WorkoutEntry;
  previousEntry?: WorkoutEntry;
  totalWorkoutEntries?: number;
}): MotivationContext {
  if (entry.feeling === "bolest") {
    return "pain";
  }

  if (!previousEntry && !totalWorkoutEntries) {
    return "first_log";
  }

  if (!previousEntry) {
    return "new_machine";
  }

  const isCardio = machine?.muscleGroup === "Kardio";
  const currentScore = isCardio ? getCardioScore(entry) : getStrengthVolume(entry);
  const previousScore = isCardio ? getCardioScore(previousEntry) : getStrengthVolume(previousEntry);

  if (isCardio && currentScore > 0) {
    return "cardio";
  }

  if (!currentScore || !previousScore) {
    return "saved";
  }

  const changeRatio = (currentScore - previousScore) / previousScore;
  const currentRepsTotal = (entry.sets ?? 0) * (entry.reps ?? 0);
  const previousRepsTotal = (previousEntry.sets ?? 0) * (previousEntry.reps ?? 0);

  if (changeRatio >= 0.18) {
    return "big_progress";
  }

  if (changeRatio >= 0.05 || currentRepsTotal > previousRepsTotal) {
    return "improvement";
  }

  if (changeRatio <= -0.05) {
    return "performance_drop";
  }

  if (entry.feeling === "tazke") {
    return "hard_set";
  }

  return "stable_performance";
}

export function buildMotivationMessage({
  machine,
  entry,
  previousEntry,
  totalWorkoutEntries
}: {
  machine?: Machine;
  entry: WorkoutEntry;
  previousEntry?: WorkoutEntry;
  totalWorkoutEntries?: number;
}) {
  const context = detectContext({ machine, entry, previousEntry, totalWorkoutEntries });
  const allowHumor = context !== "pain" && context !== "performance_drop";
  const message = pickMessage(context, `${entry.id}-${machine?.id ?? "unknown"}`, allowHumor);

  return formatMessage(message);
}

export function buildRoutineMotivationMessage(type: "warmup" | "cooldown") {
  const warmupMessages = [
    "🔥 Rozcvicka hotova. Motor bezi, teraz ideme na zelezo.",
    "⚙️ Telo je nahriate. Teraz nech stroje zistia, kto prisiel.",
    "✅ Rozcvicka splnena. Klby dakuju, svaly sa tvaria odvazne.",
    "🚦 Start vybaveny. Teraz prepneme z rezimu cestovania na rezim rastu.",
    "💪 Rozcvicka doma. Ziadne ego, len cisty vykon.",
    "🧠 Telo dostalo signal. Ideme mudro, ale nie makko."
  ];
  const cooldownMessages = [
    "🧘 Schladenie hotove. Regeneracia uz vie, ze ma robotu.",
    "✅ Koniec uhladeny. Svaly dostali trening aj diplomaticky odchod.",
    "🌿 Schladenie zapisane. Zajtra sa ti telo podakuje menej dramaticky.",
    "🛠️ Hotovo. Teraz sa opravuje, rastie a tvari sa, ze nic neboli.",
    "👏 Pekne uzavrete. Trening nie je len start, ale aj dobry pristav.",
    "😌 Schladenie doma. Nervovy system si prave vydychol."
  ];
  const messages = type === "warmup" ? warmupMessages : cooldownMessages;

  return messages[Math.floor(Date.now() / 1000) % messages.length];
}
