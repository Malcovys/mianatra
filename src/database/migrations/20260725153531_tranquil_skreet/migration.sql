CREATE TABLE `app_settings` (
	`id` text PRIMARY KEY,
	`key` text NOT NULL,
	`value_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `concept_progress` (
	`id` text PRIMARY KEY,
	`profile_id` text NOT NULL,
	`concept_id` text NOT NULL,
	`status` text NOT NULL,
	`mastery_score` integer NOT NULL,
	`last_reviewed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_concept_progress_profile_id_user_profiles_id_fk` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_concept_progress_concept_id_concepts_id_fk` FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `concepts` (
	`id` text PRIMARY KEY,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`explanation` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_concepts_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `course_analyses` (
	`id` text PRIMARY KEY,
	`course_id` text NOT NULL,
	`summary` text NOT NULL,
	`key_points_json` text NOT NULL,
	`weaknesses_json` text NOT NULL,
	`model_version` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_course_analyses_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `course_pages` (
	`id` text PRIMARY KEY,
	`course_id` text NOT NULL,
	`page_number` integer NOT NULL,
	`image_uri` text NOT NULL,
	`extracted_text` text,
	`quality_status` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_course_pages_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` text PRIMARY KEY,
	`profile_id` text NOT NULL,
	`subject_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`grade` text NOT NULL,
	`status` text NOT NULL,
	`cover_image_uri` text,
	`source_uri` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`archived_at` text,
	CONSTRAINT `fk_courses_profile_id_user_profiles_id_fk` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_courses_subject_id_subjects_id_fk` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE CASCADE ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE `exercise_attempts` (
	`id` text PRIMARY KEY,
	`session_id` text NOT NULL,
	`exercise_id` text NOT NULL,
	`answer_json` text NOT NULL,
	`is_correct` integer NOT NULL,
	`score` integer NOT NULL,
	`attempted_at` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_exercise_attempts_session_id_study_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `study_sessions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_exercise_attempts_exercise_id_exercises_id_fk` FOREIGN KEY (`exercise_id`) REFERENCES `exercises`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `exercises` (
	`id` text PRIMARY KEY,
	`course_id` text NOT NULL,
	`concept_id` text,
	`type` text NOT NULL,
	`prompt` text NOT NULL,
	`options_json` text,
	`answer_json` text NOT NULL,
	`explanation` text,
	`difficulty` integer NOT NULL,
	`generated_from_weakness` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_exercises_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_exercises_concept_id_concepts_id_fk` FOREIGN KEY (`concept_id`) REFERENCES `concepts`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `recommendations` (
	`id` text PRIMARY KEY,
	`profile_id` text NOT NULL,
	`course_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`reason` text NOT NULL,
	`payload_json` text NOT NULL,
	`dismissed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_recommendations_profile_id_user_profiles_id_fk` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_recommendations_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE SET NULL
);
--> statement-breakpoint
CREATE TABLE `revision_sheets` (
	`id` text PRIMARY KEY,
	`course_id` text NOT NULL,
	`title` text NOT NULL,
	`content_markdown` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_revision_sheets_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session_reports` (
	`id` text PRIMARY KEY,
	`session_id` text NOT NULL,
	`score` integer NOT NULL,
	`correct_count` integer NOT NULL,
	`total_count` integer NOT NULL,
	`strengths_json` text NOT NULL,
	`weaknesses_json` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_session_reports_session_id_study_sessions_id_fk` FOREIGN KEY (`session_id`) REFERENCES `study_sessions`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `study_sessions` (
	`id` text PRIMARY KEY,
	`profile_id` text NOT NULL,
	`course_id` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`started_at` text NOT NULL,
	`completed_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	CONSTRAINT `fk_study_sessions_profile_id_user_profiles_id_fk` FOREIGN KEY (`profile_id`) REFERENCES `user_profiles`(`id`) ON UPDATE CASCADE ON DELETE CASCADE,
	CONSTRAINT `fk_study_sessions_course_id_courses_id_fk` FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE CASCADE ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `subjects` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`color` text,
	`icon_name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`id` text PRIMARY KEY,
	`first_name` text NOT NULL,
	`display_name` text,
	`grade` text NOT NULL,
	`age` integer,
	`avatar_uri` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_app_settings_key` ON `app_settings` (`key`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_concept_progress_profile_concept` ON `concept_progress` (`profile_id`,`concept_id`);--> statement-breakpoint
CREATE INDEX `idx_concept_progress_profile_id` ON `concept_progress` (`profile_id`);--> statement-breakpoint
CREATE INDEX `idx_concept_progress_concept_id` ON `concept_progress` (`concept_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_concepts_course_slug` ON `concepts` (`course_id`,`slug`);--> statement-breakpoint
CREATE INDEX `idx_concepts_course_id` ON `concepts` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_course_analyses_course_id` ON `course_analyses` (`course_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_course_pages_course_page` ON `course_pages` (`course_id`,`page_number`);--> statement-breakpoint
CREATE INDEX `idx_course_pages_course_id` ON `course_pages` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_courses_profile_id` ON `courses` (`profile_id`);--> statement-breakpoint
CREATE INDEX `idx_courses_subject_id` ON `courses` (`subject_id`);--> statement-breakpoint
CREATE INDEX `idx_courses_status` ON `courses` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_exercise_attempts_session_exercise` ON `exercise_attempts` (`session_id`,`exercise_id`);--> statement-breakpoint
CREATE INDEX `idx_exercise_attempts_session_id` ON `exercise_attempts` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_exercise_attempts_exercise_id` ON `exercise_attempts` (`exercise_id`);--> statement-breakpoint
CREATE INDEX `idx_exercises_course_id` ON `exercises` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_exercises_concept_id` ON `exercises` (`concept_id`);--> statement-breakpoint
CREATE INDEX `idx_exercises_difficulty` ON `exercises` (`difficulty`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_profile_id` ON `recommendations` (`profile_id`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_course_id` ON `recommendations` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_recommendations_type` ON `recommendations` (`type`);--> statement-breakpoint
CREATE INDEX `idx_revision_sheets_course_id` ON `revision_sheets` (`course_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_session_reports_session_id` ON `session_reports` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_session_reports_session_id` ON `session_reports` (`session_id`);--> statement-breakpoint
CREATE INDEX `idx_study_sessions_profile_id` ON `study_sessions` (`profile_id`);--> statement-breakpoint
CREATE INDEX `idx_study_sessions_course_id` ON `study_sessions` (`course_id`);--> statement-breakpoint
CREATE INDEX `idx_study_sessions_status` ON `study_sessions` (`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_subjects_slug` ON `subjects` (`slug`);--> statement-breakpoint
CREATE INDEX `idx_subjects_name` ON `subjects` (`name`);--> statement-breakpoint
CREATE INDEX `idx_user_profiles_grade` ON `user_profiles` (`grade`);
