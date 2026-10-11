import { Machine, WorkoutEntry } from "../types";
import { selectAvailableWeight } from "./availableWeights";

export type ProgressionAdviceLevel = "success" | "warning" | "danger" | "info";

export type ProgressionAdvice = {
  level: ProgressionAdviceLevel;
  title: string;
  message: string;
  confidenceScore?: number;
  confidenceLabel?: string;
  action?: "increase" | "hold" | "hold_or_reduce" | "modify" | "deload" | "swap_or_stop";
};

function hasStrengthValues(entry?: Pick<WorkoutEntry, "weightKg" | "sets" | "reps">) {
  return Boolean(entry?.weightKg && entry?.sets && entry?.reps);
}

function getRepZone(machine?: Machine) {
  if (machine?.defaultRepMin && machine.defaultRepMax) {
    return { min: machine.defaultRepMin, max: machine.defaultRepMax };
  }

  if (machine?.muscleGroup === "Brucho" || machine?.exerciseType === "isolation") {
    return { min: 10, max: 15 };
  }

  if (machine?.difficulty === "hard") {
    return { min: 6, max: 10 };
  }

  return { min: 8, max: 12 };
}

function getMicroloadStep(machine?: Machine, currentWeight?: number) {
  if (machine?.equipment === "dumbbell" && machine.availableWeightsKg?.length && currentWeight !== undefined) {
    return Math.max(0, (selectAvailableWeight(machine.availableWeightsKg, currentWeight, "increase") ?? currentWeight) - currentWeight);
  }
  if (machine?.microloadStepKg) {
    return machine.microloadStepKg;
  }

  if (machine?.exerciseType === "isolation" || machine?.exerciseType === "core" || machine?.muscleGroup === "Ruky" || machine?.muscleGroup === "Triceps" || machine?.muscleGroup === "Brucho") {
    return 1.25;
  }

  return 2.5;
}

function getEstimatedRir(feeling?: WorkoutEntry["feeling"]) {
  if (feeling === "lahke") {
    return 4;
  }

  if (feeling === "akurat") {
    return 2;
  }

  if (feeling === "tazke") {
    return 0;
  }

  return undefined;
}

function getEstimatedRpe(entry: WorkoutEntry) {
  if (typeof entry.rpe === "number") {
    return entry.rpe;
  }

  if (entry.feeling === "lahke") {
    return 6;
  }

  if (entry.feeling === "akurat") {
    return 8;
  }

  if (entry.feeling === "tazke") {
    return 9.5;
  }

  if (entry.feeling === "bolest") {
    return 10;
  }

  return 8;
}

function getPainLevel(entry: WorkoutEntry) {
  return Math.max(entry.painLevel ?? 0, entry.feeling === "bolest" ? 5 : 0,
    ...(entry.setLogs ?? []).filter((log) => log.completed).map((log) => log.painLevel ?? 0));
}

function getConfidenceLabel(score: number) {
  if (score >= 75) {
    return "vysoka istota";
  }

  if (score >= 45) {
    return "stredna istota";
  }

  return "nizka istota";
}

function getConfidenceScore(entries: WorkoutEntry[]) {
  const recent = entries.slice(0, 4);
  let score = 20;

  score += Math.min(recent.length, 4) * 10;

  const latest = recent[0];

  if (latest) {
    const latestTime = new Date(latest.completedAt).getTime();

    if (!Number.isNaN(latestTime) && Date.now() - latestTime <= 14 * 24 * 60 * 60 * 1000) {
      score += 20;
    }
  }

  if (recent.every((entry) => getPainLevel(entry) === 0)) {
    score += 10;
  }

  if (recent.some((entry) => getPainLevel(entry) >= 3)) {
    score -= 25;
  }

  if (recent.some((entry) => typeof entry.rpe !== "number" && !entry.feeling)) {
    score -= 10;
  }

  return Math.max(10, Math.min(95, score));
}

function withConfidence(
  advice: ProgressionAdvice,
  entries: WorkoutEntry[],
  action: ProgressionAdvice["action"]
): ProgressionAdvice {
  const confidenceScore = getConfidenceScore(entries);

  return {
    ...advice,
    action,
    confidenceScore,
    confidenceLabel: getConfidenceLabel(confidenceScore)
  };
}

function getStrengthEntries(entries: WorkoutEntry[]) {
  return entries.filter(hasStrengthValues)
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

function getDistinctTrainingDays(entries: WorkoutEntry[]) {
  const seen = new Set<string>();
  return entries.filter(entry => {
    const date = new Date(entry.completedAt);
    if (!Number.isFinite(date.getTime())) return false;
    const day = date.toLocaleDateString("sv-SE", {timeZone:"Europe/Bratislava"});
    if (seen.has(day)) return false;
    seen.add(day); return true;
  });
}

// Never compare different grips or exercise variants as a single progression.
export function getComparableEntries(entries: WorkoutEntry[], context: WorkoutEntry) {
  return entries.filter((entry) => entry.machineId === context.machineId &&
    (entry.exerciseVariantId ?? "") === (context.exerciseVariantId ?? "") &&
    (entry.accessoryId ?? "") === (context.accessoryId ?? ""));
}

export function suggestWorkingWeight(entries: WorkoutEntry[], machine: Machine) {
  const latest = getStrengthEntries(entries)[0];
  if (!latest?.weightKg) return undefined;
  const advice = getTrendProgressionAdvice(entries, machine);
  if (advice?.action === "swap_or_stop") return undefined;
  // Assistance weights have inverse semantics; do not apply resistance progression.
  const variant = machine.exerciseVariants?.find((item) => item.id === latest.exerciseVariantId) ?? machine.exerciseVariants?.[0];
  if (variant?.loadType === "assisted") return latest.weightKg;
  const step = getMicroloadStep(machine, latest.weightKg);
  if (machine.equipment === "dumbbell" && machine.availableWeightsKg?.length) {
    const direction = advice?.action === "increase" ? "increase" : advice?.level === "danger" || ["deload", "modify", "hold_or_reduce"].includes(advice?.action ?? "") ? "reduce" : "hold";
    return selectAvailableWeight(machine.availableWeightsKg, latest.weightKg, direction);
  }
  const weight = advice?.action === "increase" ? latest.weightKg + step
    : advice?.level === "danger" || ["deload", "modify", "hold_or_reduce"].includes(advice?.action ?? "")
      ? Math.max(0, latest.weightKg - step) : latest.weightKg;
  return Math.round(weight * 10) / 10;
}

export function getWorkingWeightReason(entries: WorkoutEntry[], machine: Machine) {
  const advice = getTrendProgressionAdvice(entries, machine);
  const weight = suggestWorkingWeight(entries, machine);
  if (!advice) return "Pre tento variant a pomocku este nemam zapisanu vahu. Zadaj vlastnu vychodiskovu vahu; automaticky ju neodhadujem.";
  if (weight === undefined) return advice.message;
  const latest = getStrengthEntries(entries)[0];
  const variant = machine.exerciseVariants?.find((item) => item.id === latest?.exerciseVariantId) ?? machine.exerciseVariants?.[0];
  if (variant?.loadType === "assisted") return `Dopomoc ${weight} kg ponechavam z posledneho zapisu. Menej kg tu znamena tazsi cvik; dopomoc automaticky nezvysujem ani neznizujem.`;
  const action = advice.action === "increase" ? "Dva ciste vykony v hornej hranici pasma potvrdili maly krok hore."
    : ["deload", "modify", "hold_or_reduce"].includes(advice.action ?? "") || advice.level === "danger"
      ? "Posledne vykony, technika alebo bolest hovoria pre nizsiu zataz." : "Zatial potvrd rovnaku vahu; na zvysenie nemam dost podkladov.";
  return `Odporucam ${weight} kg. ${action} Porovnavam iba rovnaky variant a pomocku. Vahu mozes rucne upravit.`;
}

export function getEntryProgressionAdvice(
  entry?: Pick<WorkoutEntry, "weightKg" | "sets" | "reps" | "feeling" | "techniqueQuality">
): ProgressionAdvice | null {
  if (!entry) {
    return null;
  }

  if (!hasStrengthValues(entry)) {
    return null;
  }

  const weight = entry.weightKg ?? 0;
  const sets = entry.sets ?? 0;
  const reps = entry.reps ?? 0;
  const feeling = entry.feeling;

  if (entry.techniqueQuality === "zla") {
    return {
      level: "warning",
      title: "Najprv technika",
      message:
        "Vaha sa nepocita ako plny progres, ked sa technika rozpadla. Nabuduce drz alebo uber a sprav cisty pohyb."
    };
  }

  if (feeling === "bolest") {
    return {
      level: "danger",
      title: "Pozor, bolest nie je progres",
      message:
        "Pri tomto stroji si oznacil bolest. Nabuduce uber vahu, skrat rozsah alebo stroj radsej vymen."
    };
  }

  if (reps <= 5 || (sets <= 3 && reps <= 6)) {
    return {
      level: "danger",
      title: "Uber vahu",
      message:
        `Toto je na rast svalov prilis tazke. Pri ${weight} kg si dal malo opakovani, skus uber a dostat sa aspon na 8 az 10.`
    };
  }

  if (feeling === "tazke" && reps < 8) {
    return {
      level: "warning",
      title: "Zatial nepridavaj",
      message:
        `Pri ${weight} kg to bolo tazke a opakovani bolo malo. Nabuduce radsej zopakuj alebo mierne uber.`
    };
  }

  if (sets >= 4 && reps >= 12 && feeling !== "tazke") {
    return {
      level: "success",
      title: "Pridaj vahu",
      message:
        `Pekne. ${sets} x ${reps} pri ${weight} kg znamena, ze nabuduce skus pridat 1.25 az 2.5 kg. Schwarzenegger sa robi postupne.`
    };
  }

  if (reps >= 8 && reps <= 11) {
    return {
      level: "info",
      title: "Drz tuto vahu",
      message:
        `Toto je dobry rozsah na svaly. Skus najprv dotiahnut opakovania k 12 a az potom pridavaj vahu.`
    };
  }

  return {
    level: "info",
    title: "Zapisuj dalej",
    message:
      "Este potrebujem par treningov, aby som vedel presnejsie povedat, ci pridat alebo ubrat."
  };
}

export function getTrendProgressionAdvice(
  entries: WorkoutEntry[],
  machine?: Machine
): ProgressionAdvice | null {
  const recentEntries = getStrengthEntries(entries);
  const strengthEntries = getDistinctTrainingDays(recentEntries).slice(0, 4);
  const latest = strengthEntries[0];

  if (!latest) {
    return null;
  }

  const confidenceEntries = strengthEntries.slice(0, 4);
  // Deduplication must never hide a painful repeat recorded on the same day.
  const recentDays = new Set(confidenceEntries.map(entry => new Date(entry.completedAt).toLocaleDateString("sv-SE", { timeZone: "Europe/Bratislava" })));
  const maxPainRecent = Math.max(...recentEntries.filter(entry => recentDays.has(new Date(entry.completedAt).toLocaleDateString("sv-SE", { timeZone: "Europe/Bratislava" }))).map(getPainLevel), 0);
  const averageRpeLastTwo = strengthEntries.slice(0, 2).length
    ? strengthEntries.slice(0, 2).reduce((sum, entry) => sum + getEstimatedRpe(entry), 0) /
      strengthEntries.slice(0, 2).length
    : getEstimatedRpe(latest);

  if (maxPainRecent >= 5 || latest.feeling === "bolest") {
    return withConfidence({
      level: "danger",
      title: "Stop alebo vymen cvik",
      message:
        "Pri tomto cviku bola bolest nad bezpecny prah. Dalsi trening radsej zvol alternativu, uber rozsah alebo sa tomu stroju na chvilu vyhni."
    }, confidenceEntries, "swap_or_stop");
  }

  if (maxPainRecent >= 3) {
    return withConfidence({
      level: "warning",
      title: "Uprav cvik",
      message:
        "Bolesť bola mierna az stredna. Dnes uber 5 az 10 %, skrat rozsah a sleduj techniku. Ego nech nevyjednava."
    }, confidenceEntries, "modify");
  }

  const daysSinceLast = (Date.now() - new Date(latest.completedAt).getTime()) / 86400000;
  if (daysSinceLast >= 14) return withConfidence({
    level:"warning", title:"Návrat po prestávke",
    message:`Tento cvik nemáš zapísaný ${Math.floor(daysSinceLast)} dní. Staré výkony teraz nepotvrdzujú zvýšenie váhy. Začni návratovým tréningom s nižšou záťažou a podľa dnešného výkonu ju uprav; toto je konzervatívne pravidlo aplikácie, nie meranie tvojej regenerácie.`
  }, confidenceEntries, "deload");

  const zone = getRepZone(machine);
  const step = getMicroloadStep(machine, latest.weightKg);
  const latestReps = latest.reps ?? 0;
  const latestSets = latest.sets ?? 0;
  const latestWeight = latest.weightKg ?? 0;
  const latestRir = getEstimatedRir(latest.feeling);
  const lastTwo = strengthEntries.slice(0, 2);
  const lastThree = strengthEntries.slice(0, 3);
  const previous = lastTwo[1];

  if (
    latest.techniqueQuality === "zla" ||
    (previous &&
      (latest.weightKg ?? 0) > (previous.weightKg ?? 0) &&
      latest.techniqueQuality &&
      previous.techniqueQuality &&
      latest.techniqueQuality !== "cista" &&
      previous.techniqueQuality === "cista")
  ) {
    return withConfidence({
      level: "warning",
      title: "Kila isli hore, technika dole",
      message:
        "Toto nie je este plny progres. Najprv potvrd rovnaku vahu s cistejsou technikou, potom mozeme pridavat."
    }, confidenceEntries, "hold_or_reduce");
  }
  const allRecentAtTop =
    lastTwo.length >= 2 &&
    lastTwo[0].weightKg === lastTwo[1].weightKg &&
    lastTwo.every((entry) => {
      const logs = entry.setLogs?.filter((log) => log.completed && log.setType !== "warmup");
      return (entry.sets ?? 0) >= 3 && (entry.reps ?? 0) >= zone.max &&
        entry.techniqueQuality !== "zla" && getEstimatedRpe(entry) <= 8.5 &&
        (!entry.setLogs?.length || logs && logs.length >= (entry.sets ?? 0) && logs.every((log) => log.weightKg === latestWeight && (log.reps ?? 0) >= zone.max &&
          (log.painLevel ?? 0) === 0 && log.techniqueQuality !== "zla" && (log.rpe ?? 8) <= 8.5));
    });
  const repeatedBelowZone =
    lastTwo.length >= 2 && lastTwo.every((entry) => (entry.reps ?? 0) < zone.min);
  const threeSessionRegression =
    lastThree.length >= 3 &&
    lastThree[0].weightKg === lastThree[1].weightKg &&
    lastThree[1].weightKg === lastThree[2].weightKg &&
    (lastThree[0].reps ?? 0) < (lastThree[1].reps ?? 0) &&
    (lastThree[1].reps ?? 0) < (lastThree[2].reps ?? 0);
  const averageReps = lastThree.length
    ? Math.round(
        (lastThree.reduce((sum, entry) => sum + (entry.reps ?? 0), 0) / lastThree.length) *
          10
      ) / 10
    : latestReps;

  const variant = machine?.exerciseVariants?.find((item) => item.id === latest.exerciseVariantId) ?? machine?.exerciseVariants?.[0];
  if (variant?.loadType === "assisted") {
    return withConfidence({ level: "info", title: "Dopomoc nie je pracovna vaha",
      message: "Pri tomto cviku menej kg znamena menej dopomoci a tazsi cvik. Dopomoc zatial nemenim automaticky; uprav ju podla cisteho vykonu a rezervy opakovani." }, confidenceEntries, "hold");
  }

  if (threeSessionRegression || (averageRpeLastTwo >= 9.5 && repeatedBelowZone)) {
    return withConfidence({
      level: "warning",
      title: "Mini deload dava zmysel",
      message:
        "Vykon par zapisov po sebe klesa alebo je prilis tazky. Daj o 1 seriu menej a vahu zniz o 5 az 10 %, nech sa telo zase chyti."
    }, confidenceEntries, "deload");
  }

  if (allRecentAtTop && latest.feeling !== "tazke" && latestRir !== 0 && averageRpeLastTwo <= 8.5) {
    if (step === 0) return withConfidence({level:"info",title:"Najvyššia dostupná jednoručka",message:"Vyššiu dostupnú váhu nemáš nastavenú. Potvrď výkon pri rovnakej váhe; nenavrhujem neexistujúcu jednoručku."}, confidenceEntries, "hold");
    return withConfidence({
      level: "success",
      title: "Cas na maly progres",
      message:
        `Posledne zapisy su hore v pasme ${zone.min}-${zone.max} opakovani. Nabuduce skus pridat asi ${step} kg a drz techniku.`
    }, confidenceEntries, "increase");
  }

  if (repeatedBelowZone) {
    return withConfidence({
      level: "danger",
      title: "Vaha je asi prilis tazka",
      message:
        `Dvakrat po sebe si bol pod ${zone.min} opakovaniami. Uber 2.5 az 5 %, alebo si daj dlhsie pauzy. Ego nech caka pri recepcii.`
    }, confidenceEntries, "hold_or_reduce");
  }

  if (latest.feeling === "tazke" && latestReps <= zone.min) {
    return withConfidence({
      level: "warning",
      title: "Zopakuj alebo mierne uber",
      message:
        `Pri ${latestWeight} kg si bol na spodku pasma a bolo to tazke. Ciel je rast svalov, nie bitka o prezitie.`
    }, confidenceEntries, "hold_or_reduce");
  }

  if (latestSets >= 3 && latestReps >= zone.min && latestReps < zone.max) {
    return withConfidence({
      level: "info",
      title: "Buduj opakovania",
      message:
        `Dobry smer. Priemer poslednych zapisov je ${averageReps} opakovani. Drz vahu a najprv sa dopracuj k ${zone.max}.`
    }, confidenceEntries, "hold");
  }

  const fallback = getEntryProgressionAdvice(latest);

  return fallback ? withConfidence(fallback.level === "success" ? {
    level: "info", title: "Potvrd vykon", message: "Zopakuj cisty vykon v hornej hranici pasma aj na dalsom treningu. Potom pridame vahu."
  } : fallback, confidenceEntries, "hold") : fallback;
}

export function getPlannedProgressionAdvice({
  machine,
  latestEntry,
  trendAdvice,
  plannedWeightKg,
  plannedSets,
  plannedReps
}: {
  machine?: Machine;
  latestEntry?: Pick<WorkoutEntry, "weightKg" | "sets" | "reps" | "feeling" | "techniqueQuality">;
  trendAdvice?: ProgressionAdvice | null;
  plannedWeightKg?: number;
  plannedSets?: number;
  plannedReps?: number;
}): ProgressionAdvice | null {
  const latestAdvice = trendAdvice ?? getEntryProgressionAdvice(latestEntry);

  if (latestAdvice?.action === "swap_or_stop" || latestAdvice?.level === "danger" || latestAdvice?.level === "warning") {
    return latestAdvice;
  }

  if (!latestAdvice || !plannedWeightKg || !plannedSets || !plannedReps) {
    return latestAdvice;
  }

  const latestWeight = latestEntry?.weightKg ?? 0;

  if (latestAdvice.level === "success" && plannedWeightKg <= latestWeight) {
    if (machine?.equipment === "dumbbell" && machine.availableWeightsKg?.length) return latestAdvice;
    return {
      level: "warning",
      title: "Skus pridat",
      message:
        `Minule si zvladol ${latestEntry?.sets ?? 0} x ${latestEntry?.reps ?? 0}. Ak chces rast, dnes skus ${latestWeight + 1.25} az ${latestWeight + 2.5} kg.`
    };
  }

  if (latestAdvice.action === "increase" && plannedSets >= 4 && plannedReps >= 12 && plannedWeightKg > latestWeight) {
    return {
      level: "success",
      title: "Dobry plan na progres",
      message:
        "Toto dava logiku: mierne vyssia vaha a stale cielis na poctive opakovania."
    };
  }

  return latestAdvice;
}
