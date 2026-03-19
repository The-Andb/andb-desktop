CREATE TABLE `realtime_user_usage` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL,
  `message_size_usage` INT NOT NULL DEFAULT '0',
  `message_count` INT NOT NULL DEFAULT '0',
  `channel_count` INT NOT NULL DEFAULT '0',
  `attachment_size_usage` INT NOT NULL DEFAULT '0',
  `attachment_count` INT NOT NULL DEFAULT '0',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1