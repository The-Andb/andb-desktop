CREATE TABLE `realtime_message_channel` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `channel_name` VARCHAR(100) NOT NULL,
  `message_uid` VARCHAR(100) NOT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `realtime_message_channel_channel_name_IDX` (`channel_name`) USING BTREE,
  KEY `realtime_message_channel_message_uid_IDX` (`message_uid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1