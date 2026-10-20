import { BodyMeasurement } from "../types";

type ParsedScaleData = Partial<Omit<BodyMeasurement, "id" | "date">>;

const number = "([0-9]{1,5}(?:\\s[0-9]{3})?(?:[.,][0-9]{1,2})?)";
const rules: Array<[keyof ParsedScaleData, RegExp[]]> = [
  ["bodyScore", [new RegExp(`sk[oó]re\\s*tela[^0-9]{0,30}${number}`, "i")]],
  ["weightKg", [new RegExp(`${number}\\s*kg`, "i"), new RegExp(`hmotnos[tť][^0-9]{0,30}${number}`, "i")]],
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

export function parseScaleScreenshotText(text: string): ParsedScaleData {
  const normalized = text.replace(/\s+/g, " ");
  const result: ParsedScaleData = {};
  for (const [key, patterns] of rules) {
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      if (!match) continue;
      const raw = match[1];
      const value = Number(raw.replace(/\s/g, "").replace(",", "."));
      if (Number.isFinite(value)) result[key] = value;
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
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("slk", 1, {
    logger: message => {
      if (message.status === "recognizing text" && typeof message.progress === "number") onProgress?.(message.progress);
    }
  });
  try {
    const texts: string[] = [];
    for (let index = 0; index < images.length; index += 1) {
      const result = await worker.recognize(images[index]);
      texts.push(result.data.text);
      onProgress?.((index + 1) / images.length);
    }
    return parseScaleScreenshotText(texts.join("\n"));
  } finally {
    await worker.terminate();
  }
}
