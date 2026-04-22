CREATE TABLE `storage_file_edit_session` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `user` VARCHAR(200) NOT NULL,
  `edit_token` VARCHAR(255) NOT NULL,
  `version` INT NOT NULL DEFAULT '1',
  `temp_file_path` VARCHAR(255) NOT NULL,
  `file_uid` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `storage_edit_sesions_file_uid_IDX` (`file_uid`) USING BTREE,
  UNIQUE KEY `storage_edit_sesions_UN` (`edit_token`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1