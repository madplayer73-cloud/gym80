export function parseAvailableWeights(raw: string): number[] {
  if (!raw.trim()) return [];
  const values = raw.trim().split(/[;\s]+/).map(token => {
    if (!/^\d+(?:[.,]\d+)?$/.test(token)) throw new Error("Váhy oddeľ bodkočiarkou alebo medzerou, napr. 8; 10; 12,5.");
    return Number(token.replace(",", "."));
  });
  if (values.length > 100 || values.some(v => !Number.isFinite(v) || v <= 0 || v > 500)) throw new Error("Zadaj kladné váhy do 500 kg, najviac 100 hodnôt.");
  return [...new Set(values)].sort((a,b) => a-b);
}

export function selectAvailableWeight(weights: number[], current: number, direction: "increase" | "reduce" | "hold") {
  const sorted = [...new Set(weights)].filter(w => Number.isFinite(w) && w > 0).sort((a,b) => a-b);
  if (direction === "increase") return sorted.find(w => w > current) ?? sorted.filter(w => w <= current).at(-1);
  return sorted.filter(w => direction === "reduce" ? w < current : w <= current).at(-1);
}
