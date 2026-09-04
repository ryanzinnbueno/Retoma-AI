CREATE TABLE `extension_links` (
	`owner` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`created` integer NOT NULL,
	`last_used` integer,
	`revoked` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `extension_links_token_hash_unique` ON `extension_links` (`token_hash`);