import { BodyMeasurement } from "../types";
import type { Line, PSM, Rectangle } from "tesseract.js";

type ParsedScaleData = Partial<Omit<BodyMeasurement, "id" | "date">>;

// Values present on the three regular Mi Fitness scale screenshots. Waist is
// deliberately manual; ideal weight appears only when the final page is lower.
export const scaleScreenshotMetricKeys: Array<keyof ParsedScaleData> = [
  "bodyScore", "weightKg", "waterPercent", "basalMetabolismKcal", "visceralFat",
  "bmi", "bodyFatPercent", "muscleMassKg", "proteinPercent", "boneMassKg", "bodyAge"
];

const number = "([0-9]{1,5}(?:\\s[0-9]{3})?(?:[.,][0-9]{1,2})?)(?![0-9.,])";
const rules: Array<[keyof ParsedScaleData, RegExp[]]> = [
  ["bodyScore", [new RegExp(`sk[oó]re\\s*tela[^0-9]{0,30}([0-9]{1,3})(?![0-9.,])`, "i")]],
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
    if ((key === "weightKg" || key === "muscleMassKg" || key === "boneMassKg" || key === "idealWeightKg") && value > validRanges[key]![1]) value /= 100;
  }
  return value;
}

export function parseScaleScreenshotText(text: string): ParsedScaleData {
  // In the body-age row the digit 3 is often recognized as the Slovak letter š.
  const normalized = text.replace(/vek\s*[šs]\s*(?=[0-9])/gi, "vek3").replace(/\s+/g, " ");
  const result: ParsedScaleData = {};
  for (const [key, patterns] of rules) {
    for (const pattern of patterns) {
      // Only punctuation/whitespace may separate a label from its value.
      // In particular, "Váš štandardný ... je 1469" is not the measured BMR.
      const strictPattern = new RegExp(pattern.source.replace(/\[\^0-9\]/g, "[\\s:;=–—-]"), pattern.flags);
      const match = normalized.match(strictPattern);
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

// Two independent reads must agree. A bigger number or more decimal places is
// not evidence of correctness; disagreements stay empty for manual review.
export function mergeScaleReadings(...readings: ParsedScaleData[]): ParsedScaleData {
  const result: ParsedScaleData = {};
  for (const key of [...scaleScreenshotMetricKeys, "idealWeightKg" as const]) {
    const votes = new Map<number, number>();
    for (const reading of readings) {
      const value = reading[key];
      if (value != null) votes.set(value, (votes.get(value) ?? 0) + 1);
    }
    const winners = [...votes].filter(([, count]) => count >= 2);
    if (winners.length === 1) result[key] = winners[0][0];
  }
  return result;
}

const plain = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const rowLabel = /\b(?:bazalny\s+metabolizmus|visceralny\s+tuk|bmi|telesny\s+tuk|svalstvo|voda|bielkoviny|kostna\s+hmota|idealna\s+vaha|vek(?=[\dsš\s]))/i;

export function scaleReadingRegions(lines: Line[]): Array<{ rectangle: Rectangle; score: boolean }> {
  const regions: Array<{ rectangle: Rectangle; score: boolean }> = [];
  for (const line of lines) {
    const text = plain(line.text);
    const score = /skore\s+tela/.test(text);
    const match = text.match(rowLabel);
    // Exclude explanatory sentences and reference values, not just numbers.
    if (!score && (!match || /[a-z]{3}/.test(text.slice(0, match.index)))) continue;
    const firstWord = line.words.find(word => /^(?:skore|bazalny|visceralny|bmi|telesny|svalstvo|voda|bielkoviny|kostna|idealna|vek)/.test(plain(word.text)));
    if (!firstWord) continue;
    let left = Math.max(0, firstWord.bbox.x0 - 4);
    const top = Math.max(0, line.bbox.y0 - 4);
    let right = line.bbox.x1;
    let bottom = line.bbox.y1;
    if (score) {
      // Score is large and sits between its title and the weight, independent
      // of where this panel appears in the screenshot.
      const weight = lines.find(item => item.bbox.y0 > line.bbox.y1 && item.bbox.y0 < line.bbox.y1 + (line.bbox.y1 - line.bbox.y0) * 12 && /\d.*kg/i.test(item.text));
      if (!weight) continue;
      // Large score digits are wider than the title. Never crop to title width.
      const sidePadding = (line.bbox.x1 - firstWord.bbox.x0) / 2;
      left = Math.max(0, Math.min(firstWord.bbox.x0, weight.bbox.x0) - sidePadding);
      right = Math.max(right, weight.bbox.x1) + sidePadding;
      bottom = weight.bbox.y1;
    }
    regions.push({score, rectangle: {left, top, width: right - left + 4, height: bottom - top + 4}});
  }
  return regions;
}

export async function recognizeScaleScreenshots(images: string[], onProgress?: (progress: number) => void) {
  const { createWorker, PSM } = await import("tesseract.js");
  let activeImageIndex = 0;
  let completed = 0;
  let lastProgress = 0;
  const report = (value: number) => { lastProgress = Math.max(lastProgress, value); onProgress?.(lastProgress); };
  const worker = await createWorker("slk", 1, {
    // Keep the tested language model separate from old cached OCR versions.
    cachePath: "gym80-scale-slk-v2",
    langPath: "https://cdn.jsdelivr.net/npm/@tesseract.js-data/slk/4.0.0_best_int",
    logger: message => {
      if (message.status === "recognizing text" && typeof message.progress === "number") {
        report(Math.min(0.95, completed + message.progress * 0.02));
      }
    }
  });
  try {
    const output: ParsedScaleData = {};
    for (activeImageIndex = 0; activeImageIndex < images.length; activeImageIndex += 1) {
      await worker.setParameters({tessedit_pageseg_mode: PSM.AUTO, preserve_interword_spaces:"1"});
      const page = await worker.recognize(images[activeImageIndex], {}, {text: true, blocks: true});
      const primary = parseScaleScreenshotText(page.data.text);
      const lines = (page.data.blocks ?? []).flatMap(block => block.paragraphs.flatMap(paragraph => paragraph.lines));
      const regions = scaleReadingRegions(lines);
      const readRegions = async (mode: PSM) => {
        const texts: string[] = [];
        for (const region of regions) {
          await worker.setParameters({tessedit_pageseg_mode: region.score ? PSM.SINGLE_BLOCK : mode});
          const result = await worker.recognize(images[activeImageIndex], {rectangle: region.rectangle});
          texts.push(result.data.text);
        }
        return parseScaleScreenshotText(texts.join("\n"));
      };
      const rows = await readRegions(PSM.SINGLE_LINE);
      // Also run when both first reads missed the same field entirely.
      await worker.setParameters({tessedit_pageseg_mode: PSM.SPARSE_TEXT});
      const sparse = await worker.recognize(images[activeImageIndex]);
      const verified = mergeScaleReadings(primary, rows, parseScaleScreenshotText(sparse.data.text));
      for (const key of Object.keys(verified) as Array<keyof ParsedScaleData>) {
        if (output[key] != null && output[key] !== verified[key]) throw new Error("Fotografie obsahujú rozdielne merania.");
        output[key] = verified[key];
      }
      completed = ((activeImageIndex + 1) / images.length) * 0.95;
      report(completed);
    }
    report(1);
    return output;
  } finally {
    await worker.terminate();
  }
}
