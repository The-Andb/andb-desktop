CREATE TABLE `realtime_message_attachment` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `message_uid` VARCHAR(100) NOT NULL,
  `file_id` INT DEFAULT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1