CREATE TABLE `events` (
	`owner` text NOT NULL,
	`id` text NOT NULL,
	`lead_id` integer NOT NULL,
	`request` text NOT NULL,
	`status` text NOT NULL,
	`result` text,
	`created` integer NOT NULL,
	PRIMARY KEY(`owner`, `id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`owner` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL
);
