CREATE TABLE `chime_chat_member` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `app_instance_user_arn` TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci,
  `internal_user_id` BIGINT DEFAULT NULL,
  `internal_user_email` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `chime_chat_member_UN` (`internal_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1