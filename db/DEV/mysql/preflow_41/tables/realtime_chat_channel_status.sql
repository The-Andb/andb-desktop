CREATE TABLE `realtime_chat_channel_status` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `channel_id` INT NOT NULL DEFAULT '0',
  `channel_name` VARCHAR(100) NOT NULL,
  `msg_count` INT NOT NULL DEFAULT '0',
  `last_send_time` DOUBLE(13,3) NOT NULL COMMENT '0. unsent, 1. sent',
  `last_message_uid` VARCHAR(300) NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_last_msg_uid` (`last_message_uid`),
  KEY `idx_last_send_time` (`last_send_time`),
  KEY `notification_status_to_IDX` (`channel_name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1