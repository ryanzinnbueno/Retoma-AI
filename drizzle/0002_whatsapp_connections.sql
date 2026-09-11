CREATE TABLE `whatsapp_connections` (
	`owner` text PRIMARY KEY NOT NULL,
	`waba_id` text NOT NULL,
	`phone_number_id` text NOT NULL,
	`display_phone` text,
	`business_name` text,
	`access_token` text NOT NULL,
	`created` integer NOT NULL,
	`updated` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `whatsapp_connections_phone_number_id_unique` ON `whatsapp_connections` (`phone_number_id`);
