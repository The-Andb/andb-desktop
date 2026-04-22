CREATE TABLE `realtime_user_status` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(200) NOT NULL,
  `last_time_online` DOUBLE(13,3) DEFAULT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `realtime_user_status_UN` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1