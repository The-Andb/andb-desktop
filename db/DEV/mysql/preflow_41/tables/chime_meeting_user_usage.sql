CREATE TABLE `chime_meeting_user_usage` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `meeting_internet_spent` INT NOT NULL DEFAULT '0' COMMENT 'time in seconds',
  `meeting_dial_outbound_spent` INT NOT NULL DEFAULT '0' COMMENT 'time in seconds',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  `meeting_host_spent` INT NOT NULL DEFAULT '0' COMMENT 'time in seconds',
  PRIMARY KEY (`id`),
  KEY `chime_meeting_user_usage_email_IDX` (`email`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1