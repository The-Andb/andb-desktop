CREATE TABLE `group_user` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT DEFAULT NULL,
  `group_name` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `user_id` BIGINT UNSIGNED DEFAULT NULL,
  `username` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `uniq_on_groupId_userId` (`user_id`,`group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1