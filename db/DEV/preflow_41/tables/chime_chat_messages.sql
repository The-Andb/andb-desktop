CREATE TABLE `chime_chat_messages` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `internal_message_uid` VARCHAR(500) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `channel_id` BIGINT NOT NULL DEFAULT '0',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT '0',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  `user_id` BIGINT NOT NULL,
  `migrate_time` DOUBLE(13,3) NOT NULL DEFAULT '0.000' COMMENT 'create time message from Chime Service',
  PRIMARY KEY (`id`),
  KEY `chime_chat_messages_internal_message_uid_IDX` (`internal_message_uid`,`is_deleted`,`user_id`) USING BTREE,
  KEY `chime_chat_messages_migrate_time_IDX` (`migrate_time`,`channel_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1