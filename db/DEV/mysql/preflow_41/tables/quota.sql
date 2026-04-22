CREATE TABLE `quota` (
  `username` VARCHAR(255) NOT NULL,
  `bytes` BIGINT NOT NULL DEFAULT '0',
  `messages` INT NOT NULL DEFAULT '0',
  `cal_bytes` BIGINT NOT NULL DEFAULT '0',
  `card_bytes` BIGINT NOT NULL DEFAULT '0',
  `file_bytes` BIGINT NOT NULL DEFAULT '0',
  `num_sent` INT NOT NULL DEFAULT '0',
  `file_common_bytes` BIGINT NOT NULL DEFAULT '0',
  `qa_bytes` BIGINT NOT NULL DEFAULT '0',
  `file_comment_bytes` BIGINT NOT NULL DEFAULT '0',
  `file_chat_bytes` BIGINT NOT NULL DEFAULT '0',
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'