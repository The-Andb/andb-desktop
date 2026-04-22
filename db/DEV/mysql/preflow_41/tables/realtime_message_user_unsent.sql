CREATE TABLE `realtime_message_user_unsent` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `message_uid` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NOT NULL COMMENT 'email',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notification_status_to_IDX` (`email`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1