CREATE TABLE `storage_user_usage` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user` VARCHAR(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `total_size` BIGINT DEFAULT NULL,
  `total_file` BIGINT DEFAULT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `storage_user_usage_UN` (`user`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1