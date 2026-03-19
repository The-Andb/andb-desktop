CREATE TABLE `realtime_user_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(200) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `value` TEXT NOT NULL,
  `channel` VARCHAR(200) DEFAULT NULL COMMENT 'apply to all channel if this value is null',
  `created_date` DOUBLE DEFAULT NULL,
  `updated_date` DOUBLE DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_on_email_and_channel` (`email`,`channel`),
  KEY `realtime_settings_email_IDX` (`email`) USING BTREE,
  KEY `realtime_user_settings_channel_id_IDX` (`channel`) USING BTREE,
  UNIQUE KEY `realtime_user_settings_UN` (`email`,`name`,`channel`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1