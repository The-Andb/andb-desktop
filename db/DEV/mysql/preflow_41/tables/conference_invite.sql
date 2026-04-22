CREATE TABLE `conference_invite` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `channel_id` BIGINT NOT NULL,
  `conference_meeting_id` BIGINT NOT NULL,
  `user_id` BIGINT NOT NULL DEFAULT '0' COMMENT 'Id of caller',
  `email` VARCHAR(100) NOT NULL COMMENT 'email of invitee',
  `status` INT NOT NULL DEFAULT '0' COMMENT 'Reply status or invite status',
  `meeting_id` VARCHAR(100) NOT NULL,
  `external_meeting_id` TEXT,
  `meeting_url` TEXT,
  `provider` VARCHAR(45) NOT NULL DEFAULT 'CHIME',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_channel_id_and_meeting_id` (`channel_id`,`meeting_id`),
  KEY `idx_created_date` (`created_date`),
  KEY `idx_updated_date` (`updated_date`),
  UNIQUE KEY `unq_channel_id_meeting_id` (`channel_id`,`meeting_id`,`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1