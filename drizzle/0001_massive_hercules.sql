CREATE TABLE `api_keys` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(255) NOT NULL,
	`userId` int NOT NULL,
	`status` enum('active','revoked','expired') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp NOT NULL,
	`usageCount` int NOT NULL DEFAULT 0,
	`plan` varchar(64) NOT NULL DEFAULT 'basic',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_key_unique` UNIQUE(`key`)
);
