import type { CoursePageAnalysisInput } from "../schemas/course-page-analysis.schema";

export function buildCoursePageAnalysisPrompt(input: CoursePageAnalysisInput) {
  const subjectHint = input.knownSubject ? `Matiere connue: ${input.knownSubject}.` : "Matiere connue: non fournie.";
  const gradeHint = input.knownGrade ? `Niveau connu: ${input.knownGrade}.` : "Niveau connu: non fourni.";
  const instructions = input.additionalInstructions ? `Consignes supplementaires: ${input.additionalInstructions}.` : "Consignes supplementaires: aucune.";

  return [
    "Analyse uniquement le contenu visible sur cette page de cours.",
    "N'invente aucune information absente de l'image.",
    "Reponds en francais.",
    "Retourne uniquement du JSON valide, sans Markdown, sans commentaire et sans texte autour.",
    "Respecte exactement le schema demande et n'ajoute aucune propriete inconnue.",
    "Separe clairement les notions, definitions, formules, exemples, dates et mots cles.",
    "Si la page est floue, incomplete, coupee ou illisible, ajoute un avertissement explicite dans warnings.",
    "Utilise une chaine vide dans les tableaux ou null uniquement lorsque l'information est absente selon le champ.",
    subjectHint,
    gradeHint,
    instructions,
    `Index de page: ${input.pageIndex}.`,
    "Schema JSON exact attendu:",
    JSON.stringify({
      detectedTitle: "titre non vide",
      detectedSubject: "matiere non vide",
      detectedLevel: null,
      concepts: [{ name: "nom non vide", description: null }],
      definitions: [],
      formulas: [],
      examples: [],
      dates: [],
      keywords: [],
      partialSummary: "",
      warnings: [],
      confidence: null,
    }),
  ].join("\n");
}
