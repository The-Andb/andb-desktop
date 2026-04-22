CREATE TABLE `chime_meeting_caller` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `phone_number` VARCHAR(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `provision_date` DOUBLE DEFAULT NULL,
  `release_date` DOUBLE DEFAULT NULL,
  `status` INT DEFAULT NULL COMMENT '1: in use, 2: locked, 3: released',
  `phone_number_id` VARCHAR(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1