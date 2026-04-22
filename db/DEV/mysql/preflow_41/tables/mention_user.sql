CREATE TABLE `mention_user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `mention_text` VARCHAR(100) NOT NULL COMMENT '@metionText',
  `user_id` BIGINT NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_mention_text_and_email` (`mention_text`,`email`),
  KEY `idx_updated_date` (`updated_date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1