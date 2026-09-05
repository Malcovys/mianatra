import type { Concept, Course, CourseAnalysis, Subject } from "@/src/db";

type BuildRevisionSheetPromptInput = {
  course: Course;
  subject: Subject;
  analysis: CourseAnalysis;
  concepts: Concept[];
};

export function buildRevisionSheetPrompt(input: BuildRevisionSheetPromptInput) {
  return `
Tu dois générer une fiche de révision minimale en français clair et pédagogique.

Règles impératives :
- sois fidèle au cours fourni ;
- n'invente aucune information absente des données ;
- réponds uniquement avec un objet JSON valide ;
- n'ajoute aucune clôture Markdown ;
- n'ajoute aucune propriété inconnue ;
- ne mets aucune image, URI, clé ou donnée secrète dans le résultat ;
- le résumé doit être concis ;
- les notions importantes doivent être cohérentes avec la liste de concepts fournie ;
- les définitions doivent être simples ;
- les formules doivent apparaître uniquement si elles sont présentes dans l'analyse ;
- les exemples doivent être utiles pour réviser ;
- ajoute les erreurs fréquentes probables uniquement si elles découlent du cours ;
- ajoute les points essentiels à retenir.

Format JSON attendu :
{
  "title": "titre non vide",
  "summary": "résumé non vide",
  "keyConcepts": ["concept"],
  "definitions": ["définition"],
  "formulas": ["formule"],
  "examples": ["exemple"],
  "commonMistakes": ["erreur fréquente"],
  "importantPoints": ["point important"]
}

Cours :
${JSON.stringify({
  id: input.course.id,
  title: input.course.title,
  summary: input.course.summary,
  grade: input.course.grade,
  subject: input.subject.name,
  analysis: {
    detectedTitle: input.analysis.detectedTitle,
    detectedSubject: input.analysis.detectedSubject,
    detectedLevel: input.analysis.detectedLevel,
    rawJson: input.analysis.rawJson,
  },
  concepts: input.concepts.map((concept) => ({
    name: concept.name,
    description: concept.description,
    orderIndex: concept.orderIndex,
  })),
})}
`.trim();
}
