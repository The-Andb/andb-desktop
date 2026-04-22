CREATE TABLE `audit_log` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `table_name` VARCHAR(100) DEFAULT NULL,
  `operation` enum('INSERT','UPDATE','DELETE') DEFAULT NULL,
  `record_id` BIGINT DEFAULT NULL,
  `old_data` json DEFAULT NULL,
  `new_data` json DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1