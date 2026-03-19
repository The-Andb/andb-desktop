CREATE TABLE `feature` (
  `id` BIGINT NOT NULL,
  `method` VARCHAR(100) NOT NULL,
  `api_name` VARCHAR(255) NOT NULL,
  `endpoint` TEXT NOT NULL,
  `parent_id` BIGINT NOT NULL DEFAULT '0' COMMENT 'same with group of permistions, can be group of 5-10',
  `permission_value` INT NOT NULL,
  `order_number` DOUBLE(13,3) NOT NULL,
  `created_by` VARCHAR(100) DEFAULT NULL COMMENT 'email of creator',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_name_method` (`api_name`,`method`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1