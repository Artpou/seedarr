CREATE TABLE `torrentDownload` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`mediaId` integer,
	`magnetUri` text NOT NULL,
	`infoHash` text NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`progress` real DEFAULT 0 NOT NULL,
	`downloadSpeed` integer DEFAULT 0 NOT NULL,
	`uploadSpeed` integer DEFAULT 0 NOT NULL,
	`downloaded` integer DEFAULT 0 NOT NULL,
	`uploaded` integer DEFAULT 0 NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`numPeers` integer DEFAULT 0 NOT NULL,
	`savePath` text,
	`createdAt` integer NOT NULL,
	`startedAt` integer,
	`completedAt` integer,
	`error` text,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`mediaId`) REFERENCES `media`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `torrentDownload_infoHash_unique` ON `torrentDownload` (`infoHash`);