CREATE TABLE `comment_mention` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `comment_id` INT NOT NULL,
  `mention_user_id` INT NOT NULL COMMENT '@metionText',
  `created_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_comment_id` (`comment_id`),
  KEY `idx_user_id` (`mention_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1