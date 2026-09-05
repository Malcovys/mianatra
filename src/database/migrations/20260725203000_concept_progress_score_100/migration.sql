-- Normalize concept_progress.score to the canonical 0-100 scale.
-- Existing scores in the previous 0-1 scale are converted by multiplying by 100.
-- Existing scores already in 0-100 are preserved. Invalid values fail the migration.

PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TEMP TABLE `__concept_progress_score_guard` (
  `invalid_count` integer NOT NULL CHECK (`invalid_count` = 0)
);
--> statement-breakpoint
INSERT INTO `__concept_progress_score_guard` (`invalid_count`)
SELECT COUNT(*)
FROM `concept_progress`
WHERE `score` < 0 OR `score` > 100;
--> statement-breakpoint
CREATE TABLE `__new_concept_progress` (
  `concept_id` text PRIMARY KEY,
  `score` real NOT NULL,
  `status` text NOT NULL,
  `attempts_count` integer DEFAULT 0 NOT NULL,
  `correct_count` integer DEFAULT 0 NOT NULL,
  `last_practiced_at` text,
  `updated_at` text NOT NULL,
  CONSTRAINT `chk_concept_progress_score_range` CHECK (`score` >= 0 AND `score` <= 100),
  CONSTRAINT `fk_concept_progress_concept_id_concepts_id_fk` FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_concept_progress` (
  `concept_id`, `score`, `status`, `attempts_count`, `correct_count`, `last_practiced_at`, `updated_at`
)
SELECT
  `concept_id`,
  CASE
    WHEN `score` >= 0 AND `score` <= 1 THEN `score` * 100
    ELSE `score`
  END,
  `status`,
  `attempts_count`,
  `correct_count`,
  `last_practiced_at`,
  `updated_at`
FROM `concept_progress`;
--> statement-breakpoint
DROP TABLE `concept_progress`;
--> statement-breakpoint
ALTER TABLE `__new_concept_progress` RENAME TO `concept_progress`;
--> statement-breakpoint
DROP TABLE `__concept_progress_score_guard`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
PRAGMA foreign_key_check;
