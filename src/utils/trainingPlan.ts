import { Machine, MuscleGroup, WorkoutFocus, WorkoutSession } from "../types";

type DailySuggestion = {
  focus: WorkoutFocus;
  title: string;
  explanation: string;
  warmup: string[];
  cooldown: string[];
  coachNote: string;
  durationMin: number;
  warmupMin: number;
  mainWorkoutMin: number;
  addonMin: number;
  cooldownMin: number;
  estimatedCalories: number;
  dataConfidence: "zaciatok" | "ucim sa" | "podla historie";
  highlightedMachines: Machine[];
};

const rotation: Record<WorkoutFocus, WorkoutFocus> = {
  "Vrch tela": "Spodok tela",
  "Spodok tela": "Vrch tela",
  Brucho: "Vrch tela",
  Oddych: "Vrch tela"
};

function getMachinesForFocus(focus: WorkoutFocus, machines: Machine[]) {
  if (focus === "Vrch tela") {
    return machines.filter((machine) =>
      ["Chrbat", "Ramena", "Ruky", "Triceps", "Hrudnik"].includes(machine.muscleGroup)
    );
  }

  if (focus === "Spodok tela") {
    return machines.filter((machine) =>
      ["Nohy", "Brucho"].includes(machine.muscleGroup)
    );
  }

  if (focus === "Brucho") {
    return machines.filter((machine) => machine.muscleGroup === "Brucho");
  }

  return machines.filter((machine) => machine.muscleGroup === "Kardio");
}

function getMachineById(machines: Machine[]) {
  return new Map(machines.map((machine) => [machine.id, machine]));
}

function getRecentSessions(sessions: WorkoutSession[], limit = 4) {
  return sessions.slice(0, limit);
}

function getFocusFromEntries(session: WorkoutSession, machinesById: Map<string, Machine>) {
  const groups = session.entries
    .map((entry) => machinesById.get(entry.machineId)?.muscleGroup)
    .filter(Boolean);

  const upperHits = groups.filter((group) =>
    ["Chrbat", "Ramena", "Ruky", "Triceps", "Hrudnik"].includes(group ?? "")
  ).length;
  const lowerHits = groups.filter((group) =>
    ["Nohy", "Brucho"].includes(group ?? "")
  ).length;

  if (upperHits > lowerHits) {
    return "Vrch tela";
  }

  if (lowerHits > upperHits) {
    return "Spodok tela";
  }

  return session.focus;
}

function getRecentFocusLoad(
  sessions: WorkoutSession[],
  machinesById: Map<string, Machine>
) {
  return getRecentSessions(sessions).reduce(
    (load, session) => {
      const focus = getFocusFromEntries(session, machinesById);
      load[focus] += 1;
      return load;
    },
    {
      "Vrch tela": 0,
      "Spodok tela": 0,
      Brucho: 0,
      Oddych: 0
    } satisfies Record<WorkoutFocus, number>
  );
}

function chooseFocusFromHistory(
  sessions: WorkoutSession[],
  machinesById: Map<string, Machine>
) {
  const latestSession = sessions[0];

  if (!latestSession) {
    return "Vrch tela";
  }

  if (sessions.length < 3) {
    return rotation[getFocusFromEntries(latestSession, machinesById)];
  }

  const load = getRecentFocusLoad(sessions, machinesById);

  if (load["Spodok tela"] < load["Vrch tela"]) {
    return "Spodok tela";
  }

  if (load["Vrch tela"] < load["Spodok tela"]) {
    return "Vrch tela";
  }

  return rotation[getFocusFromEntries(latestSession, machinesById)];
}

function getMachineUseCounts(sessions: WorkoutSession[]) {
  const counts = new Map<string, number>();

  sessions.forEach((session) => {
    session.entries.forEach((entry) => {
      counts.set(entry.machineId, (counts.get(entry.machineId) ?? 0) + 1);
    });
  });

  return counts;
}

function sortMachinesForUser(
  focus: WorkoutFocus,
  machines: Machine[],
  sessions: WorkoutSession[]
) {
  const candidates = getMachinesForFocus(focus, machines);
  const useCounts = getMachineUseCounts(sessions);
  const latestMachineIds = new Set(sessions[0]?.entries.map((entry) => entry.machineId) ?? []);

  return [...candidates].sort((a, b) => {
    const aWasUsedLast = latestMachineIds.has(a.id) ? 1 : 0;
    const bWasUsedLast = latestMachineIds.has(b.id) ? 1 : 0;

    if (aWasUsedLast !== bWasUsedLast) {
      return aWasUsedLast - bWasUsedLast;
    }

    return (useCounts.get(b.id) ?? 0) - (useCounts.get(a.id) ?? 0);
  });
}

function sortBucketMachines(
  machines: Machine[],
  sessions: WorkoutSession[],
  latestMachineIds: Set<string>
) {
  const useCounts = getMachineUseCounts(sessions);

  return [...machines].sort((a, b) => {
    const aWasUsedLast = latestMachineIds.has(a.id) ? 1 : 0;
    const bWasUsedLast = latestMachineIds.has(b.id) ? 1 : 0;

    if (aWasUsedLast !== bWasUsedLast) {
      return aWasUsedLast - bWasUsedLast;
    }

    return (useCounts.get(b.id) ?? 0) - (useCounts.get(a.id) ?? 0);
  });
}

function pickOneFromGroup(
  machines: Machine[],
  group: MuscleGroup | MuscleGroup[],
  sessions: WorkoutSession[],
  latestMachineIds: Set<string>,
  selectedIds: Set<string>
) {
  const groups = Array.isArray(group) ? group : [group];
  const candidates = sortBucketMachines(
    machines.filter((machine) => groups.includes(machine.muscleGroup)),
    sessions,
    latestMachineIds
  );

  return candidates.find((machine) => !selectedIds.has(machine.id));
}

function buildBalancedMachines(
  focus: WorkoutFocus,
  machines: Machine[],
  sessions: WorkoutSession[]
) {
  const fallback = sortMachinesForUser(focus, machines, sessions);
  const latestMachineIds = new Set(sessions[0]?.entries.map((entry) => entry.machineId) ?? []);
  const selectedIds = new Set<string>();
  const selected: Machine[] = [];
  const buckets: Array<MuscleGroup | MuscleGroup[]> =
    focus === "Spodok tela"
      ? ["Nohy", "Brucho", "Nohy", "Brucho"]
      : focus === "Vrch tela"
        ? ["Hrudnik", "Ramena", ["Ruky", "Triceps"], "Chrbat", "Hrudnik", "Ramena"]
        : focus === "Brucho"
          ? ["Brucho"]
          : ["Kardio"];

  buckets.forEach((bucket) => {
    const picked = pickOneFromGroup(
      machines,
      bucket,
      sessions,
      latestMachineIds,
      selectedIds
    );

    if (picked) {
      selectedIds.add(picked.id);
      selected.push(picked);
    }
  });

  fallback.forEach((machine) => {
    if (!selectedIds.has(machine.id)) {
      selectedIds.add(machine.id);
      selected.push(machine);
    }
  });

  return selected;
}

function getDaysSinceLastTraining(workoutDate?: string) {
  if (!workoutDate) {
    return null;
  }

  const latest = new Date(workoutDate).getTime();
  const diff = Date.now() - latest;

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function buildWarmup(nextFocus: WorkoutFocus, warmupMin: number) {
  const warmupMinutes = `${warmupMin}`;

  if (nextFocus === "Spodok tela") {
    return [
      `${warmupMinutes} minut lahkeho bicykla alebo chodze, nech sa kolena prehreju.`,
      "Mobilita bedier, kolien a clenkov 3 az 5 minut.",
      "2 lahke rozcvicovacie serie bez tlaku na maximum."
    ];
  }

  if (nextFocus === "Oddych") {
    return [
      "5 minut pomalej chodze alebo lahkeho bicykla.",
      "Lahke rozhybanie ramien, chrbtice a bedier."
    ];
  }

  return [
    `${warmupMinutes} minut rychlej chodze alebo lahkeho orbitreku.`,
    "Kruzenie ramien, lopatiek a laktov 3 az 5 minut.",
    "2 lahke rozcvicovacie serie na prvom stroji na vrch tela."
  ];
}

function buildCooldown(nextFocus: WorkoutFocus, cooldownMin: number) {
  const cooldownMinutes = `${cooldownMin}`;

  if (nextFocus === "Spodok tela") {
    return [
      `${cooldownMinutes} minut pomalej chodze na ukludnenie tepu.`,
      "Lahke pretiahnutie prednych a zadnych stehien, zadku a lytok."
    ];
  }

  if (nextFocus === "Oddych") {
    return [
      "2 az 3 minuty pomaleho vydychania.",
      "Kratke pretiahnutie chrbta, hrudnika a bedier."
    ];
  }

  return [
    `${cooldownMinutes} minut pomalej chodze alebo bicykla.`,
    "Lahke pretiahnutie hrudnika, chrbta, ramien a ruk."
  ];
}

function buildCoachNote(
  nextFocus: WorkoutFocus,
  latestSession?: WorkoutSession,
  daysSinceLastTraining: number | null = null,
  dataConfidence: DailySuggestion["dataConfidence"] = "zaciatok"
) {
  const dataNote =
    dataConfidence === "podla historie"
      ? "Navrh uz viac vychadza z tvojej zapisanej historie a striedania zataze."
      : dataConfidence === "ucim sa"
        ? "Este mam malo dat, preto kombinujem tvoju historiu s jednoduchym striedanim partii."
        : "Zatial nemam tvoje data, preto je to startovaci navrh.";
  const recoveryNote =
    daysSinceLastTraining !== null && daysSinceLastTraining <= 1
      ? "Kedze dalsi trening ide skoro po sebe, drz tempo kontrolovane a nechaj si rezervu."
      : "Pre rast svalov drz poctive serie, ale nechaj si rezervu 1 az 2 opakovani.";

  if (!latestSession) {
    return `${dataNote} Zacni jednoducho, zapisuj si stroje a AI sa bude zlepsovat s kazdym dalsim treningom.`;
  }

  if (nextFocus === "Spodok tela") {
    return `${dataNote} Dnes dava zmysel spodok tela. Pri kolenach nechod do bolesti, drz kontrolovany rozsah a techniku. ${recoveryNote}`;
  }

  if (nextFocus === "Oddych") {
    return `${dataNote} Za sebou je viac zataze, preto dnes skor lahsi den alebo kardio. ${recoveryNote}`;
  }

  return `${dataNote} Dnes dava zmysel vrch tela. ${recoveryNote}`;
}

function estimatePlannedCalories(
  durationMin: number,
  warmupMin: number,
  cooldownMin: number,
  addonMin: number,
  focus: WorkoutFocus
) {
  const bodyWeightKg = 70;
  const strengthMin = Math.max(0, durationMin - warmupMin - cooldownMin);
  const warmupMet = focus === "Spodok tela" ? 3.5 : 3.2;
  const strengthMet = focus === "Oddych" ? 3 : 3.8;
  const addonMet = 3.6;
  const cooldownMet = 2.5;
  const kcal = (
    (warmupMet * 3.5 * bodyWeightKg * warmupMin) +
    (strengthMet * 3.5 * bodyWeightKg * Math.max(0, strengthMin - addonMin)) +
    (addonMet * 3.5 * bodyWeightKg * addonMin) +
    (cooldownMet * 3.5 * bodyWeightKg * cooldownMin)
  ) / 200;

  return Math.round(kcal);
}

export function buildDailySuggestion(
  sessions: WorkoutSession[],
  machines: Machine[],
  durationMin = 60,
  warmupMin = durationMin >= 90 ? 10 : 8,
  cooldownMin = durationMin >= 90 ? 8 : 5
): DailySuggestion {
  const latestSession = sessions[0];
  const machinesById = getMachineById(machines);
  const daysSinceLastTraining = getDaysSinceLastTraining(latestSession?.workoutDate);
  const dataConfidence: DailySuggestion["dataConfidence"] =
    sessions.length >= 4 ? "podla historie" : sessions.length >= 1 ? "ucim sa" : "zaciatok";

  let nextFocus: WorkoutFocus = chooseFocusFromHistory(sessions, machinesById);

  if (daysSinceLastTraining === 0 && latestSession) {
    nextFocus = getFocusFromEntries(latestSession, machinesById);
  }

  const addonMin = durationMin >= 90 ? 20 : 10;
  const mainWorkoutMin = Math.max(20, durationMin - warmupMin - cooldownMin - addonMin);
  const highlightedMachines = buildBalancedMachines(nextFocus, machines, sessions);
  const estimatedCalories = estimatePlannedCalories(
    durationMin,
    warmupMin,
    cooldownMin,
    addonMin,
    nextFocus
  );
  const explanation =
    nextFocus === "Spodok tela"
      ? "Navrh dnes presuva zataz na nohy a stred tela, ale s ohladom na kolena a kontrolovany rozsah."
      : nextFocus === "Vrch tela"
        ? "Navrh dnes presuva zataz na chrbat, hrudnik, ramena a ruky, aby si rozumne striedal partie."
        : "Dnes skor lahsi den, technicke tempo a kardio bez tlaku na vykon.";

  const title =
    nextFocus === "Spodok tela"
      ? "Dnes: nohy a stred tela"
      : nextFocus === "Vrch tela"
        ? "Dnes: vrch tela"
        : "Dnes: lahsi kardio den";

  return {
    focus: nextFocus,
    title,
    explanation,
    warmup: buildWarmup(nextFocus, warmupMin),
    cooldown: buildCooldown(nextFocus, cooldownMin),
    coachNote: buildCoachNote(
      nextFocus,
      latestSession,
      daysSinceLastTraining,
      dataConfidence
    ),
    durationMin,
    warmupMin,
    mainWorkoutMin,
    addonMin,
    cooldownMin,
    estimatedCalories,
    dataConfidence,
    highlightedMachines
  };
}
