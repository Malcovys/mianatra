// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import m0000 from './20260725114524_quick_golden_guardian/migration.sql';
import m0001 from './20260725153531_tranquil_skreet/migration.sql';
import m0002 from './20260725165016_local_singleton_schema/migration.sql';
import m0003 from './20260725203000_concept_progress_score_100/migration.sql';

export default {
  journal: {
    entries: [
      { idx: 0, when: 20260725114524, tag: "20260725114524_quick_golden_guardian", breakpoints: true },
      { idx: 1, when: 20260725153531, tag: "20260725153531_tranquil_skreet", breakpoints: true },
      { idx: 2, when: 20260725165016, tag: "20260725165016_local_singleton_schema", breakpoints: true },
      { idx: 3, when: 20260725203000, tag: "20260725203000_concept_progress_score_100", breakpoints: true },
    ],
  },
  migrations: {
    "20260725114524_quick_golden_guardian": m0000,
    "20260725153531_tranquil_skreet": m0001,
    "20260725165016_local_singleton_schema": m0002,
    "20260725203000_concept_progress_score_100": m0003,
  },
};
