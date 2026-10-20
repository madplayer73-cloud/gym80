import { BodyMeasurement } from "../types";

type ParsedScaleData = Partial<Omit<BodyMeasurement, "id" | "date">>;

const number = "([0-9]{1,5}(?:\\s[0-9]{3})?(?:[.,][0-9]{1,2})?)";
const rules: Array<[keyof ParsedScaleData, RegExp[]]> = [
  ["bodyScore", [new RegExp(`sk[oó]re\\s*tela[^0-9]{0,30}${number}`, "i")]],
  ["weightKg", [new RegExp(`sk[oó]re\\s*tela.{0,120}?${number}\\s*kg`, "i"), new RegExp(`hmotnos[tť][^0-9]{0,30}${number}`, "i")]],
  ["basalMetabolismKcal", [new RegExp(`baz[aá]lny\\s*metabolizmus[^0-9]{0,30}${number}`, "i")]],
  ["visceralFat", [new RegExp(`viscer[aá]lny\\s*tuk[^0-9]{0,20}${number}`, "i")]],
  ["bmi", [new RegExp(`bmi[^0-9]{0,12}${number}`, "i")]],
  ["bodyFatPercent", [new RegExp(`telesn[yý]\\s*tuk[^0-9]{0,20}${number}`, "i")]],
  ["muscleMassKg", [new RegExp(`svalstvo[^0-9]{0,20}${number}`, "i")]],
  ["waterPercent", [new RegExp(`voda[^0-9]{0,20}${number}`, "i")]],
  ["proteinPercent", [new RegExp(`bielkoviny[^0-9]{0,20}${number}`, "i")]],
  ["boneMassKg", [new RegExp(`kostn[aá]\\s*hmota[^0-9]{0,20}${number}`, "i")]],
  ["bodyAge", [new RegExp(`telesn[yý]\\s*vek[^0-9]{0,20}${number}`, "i"), new RegExp(`vek[^0-9]{0,10}${number}[^0-9]{0,8}vek`, "i")]],
  ["idealWeightKg", [new RegExp(`ide[aá]lna\\s*v[aá]ha[^0-9]{0,20}${number}`, "i")]],
];

const validRanges: Partial<Record<keyof ParsedScaleData, [number, number]>> = {
  bodyScore: [1, 100], weightKg: [35, 350], basalMetabolismKcal: [500, 4000], visceralFat: [1, 59],
  bmi: [10, 80], bodyFatPercent: [2, 75], muscleMassKg: [5, 150], waterPercent: [20, 80],
  proteinPercent: [5, 40], boneMassKg: [0.5, 10], bodyAge: [5, 120], idealWeightKg: [35, 250]
};

function parseMetricValue(key: keyof ParsedScaleData, raw: string) {
  let value = Number(raw.replace(/\s/g, "").replace(",", "."));
  // The scale uses a very thin comma. OCR sometimes drops it completely,
  // e.g. 19,4 -> 194, 54,49 -> 5449 and 2,92 -> 292.
  if (!/[.,]/.test(raw)) {
    if ((key === "bmi" || key === "bodyFatPercent" || key === "waterPercent" || key === "proteinPercent") && value >= 100) value /= 10;
    if ((key === "weightKg" || key === "muscleMassKg" || key === "boneMassKg" || key === "idealWeightKg") && value >= 100) value /= 100;
  }
  return value;
}

export function parseScaleScreenshotText(text: string): ParsedScaleData {
  // In the body-age row the digit 3 is often recognized as the Slovak letter š.
  const normalized = text.replace(/vek\s*[šs]\s*(?=[0-9])/gi, "vek3").replace(/\s+/g, " ");
  const result: ParsedScaleData = {};
  for (const [key, patterns] of rules) {
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (!match) continue;
      const raw = match[1];
      const value = parseMetricValue(key, raw);
      const range = validRanges[key];
      if (Number.isFinite(value) && (!range || (value >= range[0] && value <= range[1]))) result[key] = value;
      break;
    }
  }
  // A large score number is sometimes omitted by OCR. In that case the next
  // visible value is the body weight, which must not be saved as a score.
  if (result.bodyScore != null && (!Number.isInteger(result.bodyScore) || result.bodyScore === result.weightKg)) {
    delete result.bodyScore;
  }
  return result;
}

export async function recognizeScaleScreenshots(images: string[], onProgress?: (progress: number) => void) {
  const { createWorker, PSM } = await import("tesseract.js");
  let activeImageIndex = 0;
  const worker = await createWorker("slk", 1, {
    logger: message => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        onProgress?.((activeImageIndex + message.progress) / Math.max(images.length, 1));
      }
    }
  });
  try {
    await worker.setParameters({tessedit_pageseg_mode: PSM.SPARSE_TEXT, preserve_interword_spaces:"1"});
    const texts: string[] = [];
    for (let index = 0; index < images.length; index += 1) {
      activeImageIndex = index;
      const result = await worker.recognize(images[index]);
      texts.push(result.data.text);
      onProgress?.((index + 1) / images.length);
    }
    return parseScaleScreenshotText(texts.join("\n"));
  } finally {
    await worker.terminate();
  }
}
