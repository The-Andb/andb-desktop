CREATE TABLE `email_filing` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `collection_id` BIGINT UNSIGNED NOT NULL,
  `account_id` BIGINT UNSIGNED DEFAULT '0',
  `priority` TINYINT DEFAULT '0',
  `email_subject` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `frequency_used` INT DEFAULT '0',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_collection_id` (`collection_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1