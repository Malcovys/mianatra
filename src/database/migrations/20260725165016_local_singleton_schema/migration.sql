-- Corrective migration to move from the provisional multi-profile schema to the
-- final local singleton schema. Existing rows are copied only when every
-- mandatory target constraint can be satisfied without inventing business data.

PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `__new_user_profiles` (
  `id` integer PRIMARY KEY,
  `display_name` text NOT NULL,
  `age` integer NOT NULL,
  `grade` text NOT NULL,
  `series` text,
  `school_name` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  CONSTRAINT `chk_user_profiles_singleton` CHECK (`id` = 1)
);
--> statement-breakpoint
CREATE TABLE `__new_subjects` (
  `id` text PRIMARY KEY,
  `name` text NOT NULL,
  `icon` text NOT NULL,
  `color` text NOT NULL,
  `is_default` integer NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `__new_courses` (
  `id` text PRIMARY KEY,
  `subject_id` text NOT NULL,
  `title` text NOT NULL,
  `grade` text NOT NULL,
  `status` text NOT NULL,
  `summary` text,
  `page_count` integer DEFAULT 0 NOT NULL,
  `last_reviewed_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  CONSTRAINT `fk_courses_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `__new_course_pages` (
  `id` text PRIMARY KEY,
  `course_id` text NOT NULL,
  `local_uri` text NOT NULL,
  `thumbnail_uri` text,
  `page_index` integer NOT NULL,
  `rotation` integer DEFAULT 0 NOT NULL,
  `quality_status` text NOT NULL,
  `created_at` text NOT NULL,
  CONSTRAINT `fk_course_pages_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `__new_course_analyses` (
  `id` text PRIMARY KEY,
  `course_id` text NOT NULL,
  `detected_title` text NOT NULL,
  `detected_subject` text NOT NULL,
  `detected_level` text,
  `raw_json` text NOT NULL,
  `confidence` real,
  `validated_by_user` integer NOT NULL,
  `created_at` text NOT NULL,
  CONSTRAINT `fk_course_analyses_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `__new_concepts` (
  `id` text PRIMARY KEY,
  `course_id` text NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `order_index` integer NOT NULL,
  `created_at` text NOT NULL,
  CONSTRAINT `fk_concepts_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `__new_revision_sheets` (
  `id` text PRIMARY KEY,
  `course_id` text NOT NULL,
  `title` text NOT NULL,
  `summary` text NOT NULL,
  `content_json` text NOT NULL,
  `version` integer NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  CONSTRAINT `fk_revision_sheets_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `__new_exercises` (
  `id` text PRIMARY KEY,
  `course_id` text NOT NULL,
  `concept_id` text NOT NULL,
  `type` text NOT NULL,
  `question` text NOT NULL,
  `expected_answer` text NOT NULL,
  `options_json` text,
  `hint` text,
  `explanation` text NOT NULL,
  `difficulty` integer NOT NULL,
  `generated_from_weakness` integer NOT NULL,
  `created_at` text NOT NULL,
  CONSTRAINT `fk_exercises_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_exercises_concept_id_concepts_id_fk` FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `__new_study_sessions` (
  `id` text PRIMARY KEY,
  `course_id` text NOT NULL,
  `type` text NOT NULL,
  `status` text NOT NULL,
  `current_exercise_index` integer DEFAULT 0 NOT NULL,
  `started_at` text NOT NULL,
  `completed_at` text,
  `duration_seconds` integer DEFAULT 0 NOT NULL,
  `created_at` text NOT NULL,
  CONSTRAINT `fk_study_sessions_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `__new_exercise_attempts` (
  `id` text PRIMARY KEY,
  `exercise_id` text NOT NULL,
  `session_id` text NOT NULL,
  `user_answer` text NOT NULL,
  `is_correct` integer NOT NULL,
  `used_hint` integer NOT NULL,
  `mistake_type` text,
  `response_time_ms` integer,
  `created_at` text NOT NULL,
  CONSTRAINT `fk_exercise_attempts_exercise_id_exercises_id_fk` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_exercise_attempts_session_id_study_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `study_sessions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `__new_concept_progress` (
  `concept_id` text PRIMARY KEY,
  `score` real NOT NULL,
  `status` text NOT NULL,
  `attempts_count` integer DEFAULT 0 NOT NULL,
  `correct_count` integer DEFAULT 0 NOT NULL,
  `last_practiced_at` text,
  `updated_at` text NOT NULL,
  CONSTRAINT `fk_concept_progress_concept_id_concepts_id_fk` FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `__new_session_reports` (
  `id` text PRIMARY KEY,
  `session_id` text NOT NULL,
  `score` real NOT NULL,
  `correct_answers` integer NOT NULL,
  `total_answers` integer NOT NULL,
  `strong_concept_id` text,
  `weak_concept_id` text,
  `summary` text NOT NULL,
  `recommendation` text NOT NULL,
  `created_at` text NOT NULL,
  CONSTRAINT `fk_session_reports_session_id_study_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `study_sessions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_session_reports_strong_concept_id_concepts_id_fk` FOREIGN KEY (`strong_concept_id`) REFERENCES `concepts`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_session_reports_weak_concept_id_concepts_id_fk` FOREIGN KEY (`weak_concept_id`) REFERENCES `concepts`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `__new_recommendations` (
  `id` text PRIMARY KEY,
  `course_id` text,
  `concept_id` text,
  `type` text NOT NULL,
  `title` text NOT NULL,
  `description` text NOT NULL,
  `estimated_minutes` integer NOT NULL,
  `priority` integer NOT NULL,
  `completed_at` text,
  `created_at` text NOT NULL,
  CONSTRAINT `fk_recommendations_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_recommendations_concept_id_concepts_id_fk` FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `__new_app_settings` (
  `key` text PRIMARY KEY,
  `value` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_user_profiles` (
  `id`, `display_name`, `age`, `grade`, `series`, `school_name`, `created_at`, `updated_at`
)
SELECT
  1,
  COALESCE(NULLIF(`display_name`, ''), `first_name`),
  COALESCE(`age`, 0),
  `grade`,
  NULL,
  NULL,
  `created_at`,
  `updated_at`
FROM (
  SELECT * FROM `user_profiles` ORDER BY CASE WHEN `id` = '1' THEN 0 ELSE 1 END, `created_at`, `id` LIMIT 1
);
--> statement-breakpoint
INSERT INTO `__new_subjects` (`id`, `name`, `icon`, `color`, `is_default`, `created_at`)
SELECT `id`, `name`, COALESCE(NULLIF(`icon_name`, ''), 'book'), COALESCE(NULLIF(`color`, ''), '#D94B24'), 0, `created_at`
FROM `subjects`;
--> statement-breakpoint
INSERT INTO `__new_courses` (
  `id`, `subject_id`, `title`, `grade`, `status`, `summary`, `page_count`, `last_reviewed_at`, `created_at`, `updated_at`
)
SELECT
  `courses`.`id`,
  `courses`.`subject_id`,
  `courses`.`title`,
  `courses`.`grade`,
  `courses`.`status`,
  `courses`.`description`,
  (SELECT COUNT(*) FROM `course_pages` WHERE `course_pages`.`course_id` = `courses`.`id`),
  NULL,
  `courses`.`created_at`,
  `courses`.`updated_at`
FROM `courses`
WHERE EXISTS (SELECT 1 FROM `__new_subjects` WHERE `__new_subjects`.`id` = `courses`.`subject_id`);
--> statement-breakpoint
INSERT INTO `__new_course_pages` (
  `id`, `course_id`, `local_uri`, `thumbnail_uri`, `page_index`, `rotation`, `quality_status`, `created_at`
)
SELECT `id`, `course_id`, `image_uri`, NULL, `page_number`, 0, `quality_status`, `created_at`
FROM `course_pages`
WHERE EXISTS (SELECT 1 FROM `__new_courses` WHERE `__new_courses`.`id` = `course_pages`.`course_id`);
--> statement-breakpoint
INSERT INTO `__new_course_analyses` (
  `id`, `course_id`, `detected_title`, `detected_subject`, `detected_level`, `raw_json`, `confidence`, `validated_by_user`, `created_at`
)
SELECT
  `course_analyses`.`id`,
  `course_analyses`.`course_id`,
  COALESCE((SELECT `title` FROM `__new_courses` WHERE `__new_courses`.`id` = `course_analyses`.`course_id`), `course_analyses`.`summary`),
  COALESCE((SELECT `subjects`.`name` FROM `__new_courses` JOIN `__new_subjects` AS `subjects` ON `subjects`.`id` = `__new_courses`.`subject_id` WHERE `__new_courses`.`id` = `course_analyses`.`course_id`), ''),
  NULL,
  `course_analyses`.`key_points_json`,
  NULL,
  0,
  `course_analyses`.`created_at`
FROM `course_analyses`
WHERE EXISTS (SELECT 1 FROM `__new_courses` WHERE `__new_courses`.`id` = `course_analyses`.`course_id`);
--> statement-breakpoint
INSERT INTO `__new_concepts` (`id`, `course_id`, `name`, `description`, `order_index`, `created_at`)
SELECT `id`, `course_id`, `title`, `explanation`, `order_index`, `created_at`
FROM (
  SELECT
    `concepts`.*,
    ROW_NUMBER() OVER (PARTITION BY `course_id` ORDER BY `created_at`, `id`) - 1 AS `order_index`
  FROM `concepts`
  WHERE EXISTS (SELECT 1 FROM `__new_courses` WHERE `__new_courses`.`id` = `concepts`.`course_id`)
);
--> statement-breakpoint
INSERT INTO `__new_revision_sheets` (
  `id`, `course_id`, `title`, `summary`, `content_json`, `version`, `created_at`, `updated_at`
)
SELECT `id`, `course_id`, `title`, `title`, `content_markdown`, `version`, `created_at`, `updated_at`
FROM (
  SELECT
    `revision_sheets`.*,
    ROW_NUMBER() OVER (PARTITION BY `course_id` ORDER BY `created_at`, `id`) AS `version`
  FROM `revision_sheets`
  WHERE EXISTS (SELECT 1 FROM `__new_courses` WHERE `__new_courses`.`id` = `revision_sheets`.`course_id`)
);
--> statement-breakpoint
INSERT INTO `__new_exercises` (
  `id`, `course_id`, `concept_id`, `type`, `question`, `expected_answer`, `options_json`, `hint`, `explanation`, `difficulty`, `generated_from_weakness`, `created_at`
)
SELECT
  `id`,
  `course_id`,
  `concept_id`,
  `type`,
  `prompt`,
  `answer_json`,
  `options_json`,
  NULL,
  COALESCE(`explanation`, ''),
  `difficulty`,
  CASE WHEN `generated_from_weakness` IS NULL THEN 0 ELSE 1 END,
  `created_at`
FROM `exercises`
WHERE `concept_id` IS NOT NULL
  AND EXISTS (SELECT 1 FROM `__new_courses` WHERE `__new_courses`.`id` = `exercises`.`course_id`)
  AND EXISTS (SELECT 1 FROM `__new_concepts` WHERE `__new_concepts`.`id` = `exercises`.`concept_id`);
--> statement-breakpoint
INSERT INTO `__new_study_sessions` (
  `id`, `course_id`, `type`, `status`, `current_exercise_index`, `started_at`, `completed_at`, `duration_seconds`, `created_at`
)
SELECT `id`, `course_id`, `type`, `status`, 0, `started_at`, `completed_at`, 0, `created_at`
FROM `study_sessions`
WHERE EXISTS (SELECT 1 FROM `__new_courses` WHERE `__new_courses`.`id` = `study_sessions`.`course_id`);
--> statement-breakpoint
INSERT INTO `__new_exercise_attempts` (
  `id`, `exercise_id`, `session_id`, `user_answer`, `is_correct`, `used_hint`, `mistake_type`, `response_time_ms`, `created_at`
)
SELECT `id`, `exercise_id`, `session_id`, `answer_json`, `is_correct`, 0, NULL, NULL, `created_at`
FROM `exercise_attempts`
WHERE EXISTS (SELECT 1 FROM `__new_exercises` WHERE `__new_exercises`.`id` = `exercise_attempts`.`exercise_id`)
  AND EXISTS (SELECT 1 FROM `__new_study_sessions` WHERE `__new_study_sessions`.`id` = `exercise_attempts`.`session_id`);
--> statement-breakpoint
INSERT INTO `__new_concept_progress` (
  `concept_id`, `score`, `status`, `attempts_count`, `correct_count`, `last_practiced_at`, `updated_at`
)
SELECT `concept_id`, `mastery_score`, `status`, 0, 0, `last_reviewed_at`, `updated_at`
FROM (
  SELECT
    `concept_progress`.*,
    ROW_NUMBER() OVER (PARTITION BY `concept_id` ORDER BY `updated_at` DESC, `id`) AS `row_number`
  FROM `concept_progress`
  WHERE EXISTS (SELECT 1 FROM `__new_concepts` WHERE `__new_concepts`.`id` = `concept_progress`.`concept_id`)
)
WHERE `row_number` = 1;
--> statement-breakpoint
INSERT INTO `__new_session_reports` (
  `id`, `session_id`, `score`, `correct_answers`, `total_answers`, `strong_concept_id`, `weak_concept_id`, `summary`, `recommendation`, `created_at`
)
SELECT
  `id`,
  `session_id`,
  `score`,
  `correct_count`,
  `total_count`,
  NULL,
  NULL,
  `strengths_json`,
  `weaknesses_json`,
  `created_at`
FROM `session_reports`
WHERE EXISTS (SELECT 1 FROM `__new_study_sessions` WHERE `__new_study_sessions`.`id` = `session_reports`.`session_id`);
--> statement-breakpoint
INSERT INTO `__new_recommendations` (
  `id`, `course_id`, `concept_id`, `type`, `title`, `description`, `estimated_minutes`, `priority`, `completed_at`, `created_at`
)
SELECT
  `id`,
  `course_id`,
  NULL,
  `type`,
  `title`,
  `reason`,
  0,
  0,
  NULL,
  `created_at`
FROM `recommendations`
WHERE `course_id` IS NULL
   OR EXISTS (SELECT 1 FROM `__new_courses` WHERE `__new_courses`.`id` = `recommendations`.`course_id`);
--> statement-breakpoint
INSERT INTO `__new_app_settings` (`key`, `value`, `updated_at`)
SELECT `key`, `value_json`, `updated_at`
FROM `app_settings`;
--> statement-breakpoint
DROP TABLE `exercise_attempts`;
--> statement-breakpoint
DROP TABLE `session_reports`;
--> statement-breakpoint
DROP TABLE `recommendations`;
--> statement-breakpoint
DROP TABLE `concept_progress`;
--> statement-breakpoint
DROP TABLE `exercises`;
--> statement-breakpoint
DROP TABLE `revision_sheets`;
--> statement-breakpoint
DROP TABLE `course_analyses`;
--> statement-breakpoint
DROP TABLE `course_pages`;
--> statement-breakpoint
DROP TABLE `study_sessions`;
--> statement-breakpoint
DROP TABLE `concepts`;
--> statement-breakpoint
DROP TABLE `courses`;
--> statement-breakpoint
DROP TABLE `subjects`;
--> statement-breakpoint
DROP TABLE `user_profiles`;
--> statement-breakpoint
DROP TABLE `app_settings`;
--> statement-breakpoint
ALTER TABLE `__new_user_profiles` RENAME TO `user_profiles`;
--> statement-breakpoint
ALTER TABLE `__new_subjects` RENAME TO `subjects`;
--> statement-breakpoint
ALTER TABLE `__new_courses` RENAME TO `courses`;
--> statement-breakpoint
ALTER TABLE `__new_course_pages` RENAME TO `course_pages`;
--> statement-breakpoint
ALTER TABLE `__new_course_analyses` RENAME TO `course_analyses`;
--> statement-breakpoint
ALTER TABLE `__new_concepts` RENAME TO `concepts`;
--> statement-breakpoint
ALTER TABLE `__new_revision_sheets` RENAME TO `revision_sheets`;
--> statement-breakpoint
ALTER TABLE `__new_exercises` RENAME TO `exercises`;
--> statement-breakpoint
ALTER TABLE `__new_study_sessions` RENAME TO `study_sessions`;
--> statement-breakpoint
ALTER TABLE `__new_exercise_attempts` RENAME TO `exercise_attempts`;
--> statement-breakpoint
ALTER TABLE `__new_concept_progress` RENAME TO `concept_progress`;
--> statement-breakpoint
ALTER TABLE `__new_session_reports` RENAME TO `session_reports`;
--> statement-breakpoint
ALTER TABLE `__new_recommendations` RENAME TO `recommendations`;
--> statement-breakpoint
ALTER TABLE `__new_app_settings` RENAME TO `app_settings`;
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_subjects_name` ON `subjects` (`name`);
--> statement-breakpoint
CREATE INDEX `idx_courses_subject_id` ON `courses` (`subject_id`);
--> statement-breakpoint
CREATE INDEX `idx_courses_status` ON `courses` (`status`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_course_pages_course_page_index` ON `course_pages` (`course_id`, `page_index`);
--> statement-breakpoint
CREATE INDEX `idx_course_pages_course_id` ON `course_pages` (`course_id`);
--> statement-breakpoint
CREATE INDEX `idx_course_analyses_course_id` ON `course_analyses` (`course_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_concepts_course_order_index` ON `concepts` (`course_id`, `order_index`);
--> statement-breakpoint
CREATE INDEX `idx_concepts_course_id` ON `concepts` (`course_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_revision_sheets_course_version` ON `revision_sheets` (`course_id`, `version`);
--> statement-breakpoint
CREATE INDEX `idx_revision_sheets_course_id` ON `revision_sheets` (`course_id`);
--> statement-breakpoint
CREATE INDEX `idx_exercises_course_id` ON `exercises` (`course_id`);
--> statement-breakpoint
CREATE INDEX `idx_exercises_concept_id` ON `exercises` (`concept_id`);
--> statement-breakpoint
CREATE INDEX `idx_exercises_difficulty` ON `exercises` (`difficulty`);
--> statement-breakpoint
CREATE INDEX `idx_study_sessions_course_id` ON `study_sessions` (`course_id`);
--> statement-breakpoint
CREATE INDEX `idx_study_sessions_status` ON `study_sessions` (`status`);
--> statement-breakpoint
CREATE INDEX `idx_exercise_attempts_session_id` ON `exercise_attempts` (`session_id`);
--> statement-breakpoint
CREATE INDEX `idx_exercise_attempts_exercise_id` ON `exercise_attempts` (`exercise_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_session_reports_session_id` ON `session_reports` (`session_id`);
--> statement-breakpoint
CREATE INDEX `idx_recommendations_course_id` ON `recommendations` (`course_id`);
--> statement-breakpoint
CREATE INDEX `idx_recommendations_concept_id` ON `recommendations` (`concept_id`);
--> statement-breakpoint
CREATE INDEX `idx_recommendations_type` ON `recommendations` (`type`);
--> statement-breakpoint
DROP TABLE IF EXISTS `users_table`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;
--> statement-breakpoint
PRAGMA foreign_key_check;
