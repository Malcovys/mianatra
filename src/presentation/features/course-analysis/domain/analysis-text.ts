export function normalizeAnalysisText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}
