CREATE TABLE `reference_photos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`originalFilename` varchar(255),
	`mimeType` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reference_photos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sticker_packs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`referencePhotoId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `sticker_packs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stickers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`packId` int NOT NULL,
	`fileKey` varchar(512) NOT NULL,
	`fileUrl` text NOT NULL,
	`emotion` varchar(100) NOT NULL,
	`prompt` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `stickers_id` PRIMARY KEY(`id`)
);
