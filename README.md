# Mianatra

## 1. Présentation

Mianatra est une application éducative de démonstration pour lycéens malagasy. Cette coquille MVP présente un parcours complet basé sur des données fictives : onboarding, accueil, cours, fiche de révision, exercices, correction, rapport et profil.

## 2. Prérequis

- Node.js testé dans ce dépôt : `v22.15.0`.
- Version recommandée par `package.json` : `>=22.16.0`.
- npm `11.5.2`.
- Expo CLI local via `npx expo`.
- Expo Go ou un émulateur Android pour une démonstration mobile native.

## 3. Installation

```bash
npm install
```

Créer un fichier `.env` local si nécessaire :

```bash
cp .env.example .env
```

## 4. Lancement

Commande standard :

```bash
npm run start
```

Commande validée pour la démonstration web locale :

```bash
npx expo start --clear --port 8099 --host localhost
```

## 5. Vérifications

```bash
npm run lint
npm run typecheck
npm run db:generate
npx expo export --platform web
```

Aucun script `test` n'est configuré actuellement.

## 6. Parcours de démonstration

Compte de démonstration : Fara, 17 ans, classe de 2nde.

Parcours recommandé :

1. Ouvrir l'onboarding.
2. Valider Fara, 17 ans, 2nde.
3. Arriver sur l'accueil.
4. Ouvrir Mes cours.
5. Ajouter un cours.
6. Afficher les quatre pages de démonstration.
7. Réorganiser ou supprimer/restaurer une page.
8. Compiler les pages.
9. Ouvrir le détail du cours Fonctions du second degré.
10. Ouvrir la fiche de révision.
11. Lancer les exercices.
12. Répondre à une question, consulter la correction, puis terminer la série.
13. Afficher le rapport.
14. Lancer une série ciblée ou ouvrir les résultats.
15. Terminer sur le profil.

Un script plus détaillé est disponible dans `docs/DEMO.md`.

## 7. Base de données locale

La base native utilise SQLite via Expo SQLite et Drizzle. Le client unique est dans `src/database/client.ts` et ouvre `mianatra.db` avec `foreign_keys` et WAL activés.

Le schéma métier est modulaire dans `src/database/schema/` et couvre les tables principales : matières, cours, pages, analyses, concepts, fiches de révision, exercices, sessions, tentatives, progression, rapports, recommandations et paramètres.

Les migrations Drizzle sont dans `src/database/migrations/`. `src/database/migrations/migrations.js` est le bundle utilisé par Expo/React Native pour charger les fichiers `.sql`.

Commandes utiles :

```bash
npm run db:generate
npm run db:studio
```

`drizzle.config.ts` lit `DB_FILE_NAME` depuis `.env` pour Drizzle Studio ou la génération locale. Aucun seed n'est exécuté automatiquement.

Drizzle Studio s'appuie sur le driver expérimental `node:sqlite`. Avec Node `v22.15.0`, Studio peut afficher `stmt.setReturnArrays is not a function`. Utiliser Node `>=22.16.0`, puis relancer :

```bash
npm run db:studio
```

## 8. Limites actuelles

- Données fictives uniquement.
- Modèle métier SQLite prêt côté fondation, mais les écrans de démonstration n'écrivent pas encore dedans.
- Pas de caméra réelle.
- Pas d'import PDF réel.
- Pas d'Ollama ni de génération IA.
- Pas de persistance de session.
- Pas d'authentification distante.

## 9. Problèmes connus

- L'environnement courant utilise Node `v22.15.0`, alors que `package.json` recommande `>=22.16.0`.
- Les migrations SQLite sont chargées sur Android/iOS, mais contournées sur web pour permettre la démonstration avec les données fictives.
- Aucun test automatique n'est configuré ; les contrôles obligatoires sont `lint`, `typecheck` et l'export web.
