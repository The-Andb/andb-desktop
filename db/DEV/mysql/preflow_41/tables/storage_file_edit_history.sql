CREATE TABLE `storage_file_edit_history` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `file_uid` VARCHAR(255) NOT NULL,
  `user` VARCHAR(100) NOT NULL,
  `edit_details` TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci,
  `base_on_version` INT NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  `apply_to_version` INT DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1