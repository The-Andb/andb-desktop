CREATE TABLE `collection_card` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `collection_id` BIGINT UNSIGNED NOT NULL,
  `object_uid` VARBINARY(1000) DEFAULT NULL,
  `object_type` VARBINARY(50) NOT NULL,
  `object_href` TEXT COLLATE utf8mb4_unicode_ci,
  `account_id` BIGINT UNSIGNED DEFAULT '0',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_collection_cards_on_account_id` (`account_id`),
  KEY `idx_collection_cards_on_collection_id` (`collection_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci