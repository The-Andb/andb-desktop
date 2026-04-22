CREATE TABLE `last_reaction` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `reaction_id` BIGINT NOT NULL,
  `channel_id` BIGINT DEFAULT NULL,
  `message_uid` VARCHAR(45) DEFAULT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `channel_id_UNIQUE` (`channel_id`),
  UNIQUE KEY `reaction_id_UNIQUE` (`reaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1