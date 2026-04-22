CREATE TABLE `permission` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `feature_id` INT DEFAULT NULL,
  `role_id` INT DEFAULT NULL,
  `permission_value` INT DEFAULT NULL COMMENT 'sum of total permistion granted',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1