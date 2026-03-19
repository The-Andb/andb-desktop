CREATE TABLE `realtime_channel` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(200) NOT NULL,
  `uid` VARCHAR(255) DEFAULT NULL,
  `title` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '""',
  `type` enum('CONFERENCE','COLLECTION') NOT NULL DEFAULT 'CONFERENCE',
  `internal_channel_id` BIGINT NOT NULL COMMENT 'Collection id or conference_channel id',
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  `channel_key` TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci,
  `patch_time` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_patch_time` (`patch_time`),
  KEY `idx_type_and_uid` (`type`,`uid`),
  UNIQUE KEY `realtime_channel_UN` (`name`),
  KEY `unq_on_type_and_internal_id` (`type`,`internal_channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1