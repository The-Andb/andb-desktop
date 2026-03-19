CREATE TABLE `chime_meeting_call_marker` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `from_phone_number` VARCHAR(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `to_phone_number` VARCHAR(100) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `number_call` INT DEFAULT '1',
  `avg_time_duration_call` INT DEFAULT NULL,
  `frequency_of_calls` INT DEFAULT NULL,
  `last_call_time` DOUBLE DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1