CREATE TABLE `chime_chat_channel_member` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `member_id` BIGINT NOT NULL,
  `channel_id` BIGINT DEFAULT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `chime_chat_channel_member_channel_id_IDX` (`channel_id`) USING BTREE,
  KEY `chime_chat_channel_member_member_id_IDX` (`member_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1