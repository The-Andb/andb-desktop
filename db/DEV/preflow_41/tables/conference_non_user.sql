CREATE TABLE `conference_non_user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `meeting_config` json NOT NULL,
  `external_attendee` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `join_token` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `meeting_id` VARCHAR(500) NOT NULL,
  `attendee_id` VARCHAR(300) NOT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `conference_non_user_extenal_attendee_IDX` (`external_attendee`,`join_token`),
  FULLTEXT KEY `conference_non_user_meeting_id_attendee_idIDX` (`meeting_id`,`attendee_id`),
  KEY `conference_non_user_meeting_id_IDX` (`meeting_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1