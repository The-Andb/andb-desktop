CREATE TABLE `user_process_invalid_link` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT NOT NULL,
  `username` VARCHAR(255) NOT NULL,
  `object_scanning` TINYINT(1) NOT NULL DEFAULT '0' COMMENT '0: Failed\\n1: Processing\\n2: Completed\\n',
  `email_scanning` TINYINT(1) NOT NULL DEFAULT '0',
  `email_scanned_date` DOUBLE(13,3) DEFAULT NULL,
  `object_scanned_date` DOUBLE(13,3) DEFAULT NULL,
  `notification_scanned_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_updated_date` (`updated_date`),
  UNIQUE KEY `uniq_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1