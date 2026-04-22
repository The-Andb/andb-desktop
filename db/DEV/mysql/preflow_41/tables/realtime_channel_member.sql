CREATE TABLE `realtime_channel_member` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(100) NOT NULL,
  `channel_id` INT NOT NULL,
  `channel_name` VARCHAR(100) DEFAULT NULL,
  `user_id` BIGINT DEFAULT NULL,
  `role` INT NOT NULL DEFAULT '2' COMMENT '  OWNER = 0,\\\\n  VIEWER = 1,\\\\n  EDITOR = 2,',
  `revoke_date` DOUBLE(13,3) DEFAULT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  `channel_key` TEXT,
  `notification_chat` TINYINT(1) NOT NULL DEFAULT '2',
  `notification_call` TINYINT(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_channel_name` (`channel_name`,`email`) USING BTREE,
  KEY `idx_email` (`email`) USING BTREE,
  KEY `notification_channel_member_channel_id_IDX` (`channel_id`) USING BTREE,
  UNIQUE KEY `notification_channel_member_UN` (`email`,`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1