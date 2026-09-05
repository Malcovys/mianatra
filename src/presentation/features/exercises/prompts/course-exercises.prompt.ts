import type { Concept, Course, CourseAnalysis, Subject } from "@/src/db";

type BuildCourseExercisesPromptInput = {
  course: Course;
  subject: Subject;
  analysis: CourseAnalysis;
  concepts: Concept[];
  requestedCount: number;
};

export function buildCourseExercisesPrompt(input: BuildCourseExercisesPromptInput) {
  return `
Tu dois générer ${input.requestedCount} exercices initiaux exploitables pour ce cours.

Règles impératives :
- utilise un français clair et pédagogique ;
- sois fidèle au cours fourni ;
- n'invente aucune information absente des données ;
- réponds uniquement avec un objet JSON valide ;
- n'ajoute aucune clôture Markdown ;
- n'ajoute aucune propriété inconnue ;
- ne mets aucune image, URI, clé ou donnée secrète dans le résultat ;
- utilise seulement les types "multiple_choice", "true_false", "short_answer" ou "numeric" ;
- n'utilise pas les types "explanation" ou "graph_reading" ;
- mets "generatedFromWeakness" à false pour tous les exercices ;
- mets une difficulté entière entre 1 et 3 ;
- rattache chaque exercice à un concept existant en utilisant son nom exact dans "conceptReference" ;
- si plusieurs concepts existent, couvre au moins deux concepts différents ;
- pour un QCM, fournis au moins deux options distinctes et mets la réponse attendue dans les options ;
- pour vrai/faux, utilise une réponse attendue équivalente à vrai ou faux ;
- ne duplique pas les questions.

Format JSON attendu :
{
  "exercises": [
    {
      "type": "multiple_choice",
      "question": "question non vide",
      "expectedAnswer": "réponse non vide",
      "options": ["option A", "option B"],
      "hint": null,
      "explanation": "explication non vide",
      "conceptReference": "nom exact du concept",
      "difficulty": 1,
      "generatedFromWeakness": false
    }
  ]
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
