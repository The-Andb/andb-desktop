CREATE TABLE `realtime_message_user_status` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `message_uid` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL COMMENT 'email',
  `status` TINYINT NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_status_to_IDX` (`email`) USING BTREE,
  KEY `realtime_message_user_status_status_IDX` (`status`) USING BTREE,
  UNIQUE KEY `realtime_message_user_status_UN` (`message_uid`,`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1