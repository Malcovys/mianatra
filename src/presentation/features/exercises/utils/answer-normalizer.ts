export function normalizeAnswer(answer: string) {
  return answer
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*;\s*/g, ";")
    .replace(/\s*,\s*/g, ",");
}
