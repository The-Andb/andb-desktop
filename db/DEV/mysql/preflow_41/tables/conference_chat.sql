CREATE TABLE `conference_chat` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `parent_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL,
  `conference_member_id` BIGINT NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `message_uid` VARBINARY(1000) NOT NULL,
  `message_text` TEXT NOT NULL,
  `message_type` TINYINT(1) NOT NULL DEFAULT '0',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_updated_date` (`updated_date`),
  KEY `idx_user_id` (`user_id`),
  UNIQUE KEY `unq_on_userId_msgUid` (`user_id`,`message_uid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1