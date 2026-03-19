CREATE TABLE `chime_chat_channel` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `internal_channel_id` BIGINT NOT NULL,
  `channel_arn` VARCHAR(2000) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `internal_channel_type` TINYINT(1) NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  `user_id` BIGINT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `chime_chat_channel_internal_channel_type_IDX` (`internal_channel_type`,`internal_channel_id`) USING BTREE,
  UNIQUE KEY `chime_chat_channel_UN` (`internal_channel_id`,`internal_channel_type`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1