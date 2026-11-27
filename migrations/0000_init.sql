CREATE TABLE `blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`start` text NOT NULL,
	`end` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`checkin` text NOT NULL,
	`checkout` text NOT NULL,
	`nights` integer NOT NULL,
	`guests` integer NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`contact_method` text NOT NULL,
	`message` text,
	`total` integer NOT NULL,
	`payment_option` integer NOT NULL,
	`amount_due` integer NOT NULL,
	`amount_paid` integer DEFAULT 0 NOT NULL,
	`payment_method` text NOT NULL,
	`price_details` text NOT NULL,
	`cancellation_days` integer NOT NULL,
	`hold_expires_at` integer NOT NULL,
	`owner_notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_code_unique` ON `bookings` (`code`);--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_token_unique` ON `bookings` (`token`);--> statement-breakpoint
CREATE INDEX `bookings_dates` ON `bookings` (`checkin`,`checkout`);