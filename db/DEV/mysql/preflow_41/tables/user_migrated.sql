CREATE TABLE `user_migrated` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  `status` TINYINT UNSIGNED DEFAULT '0' COMMENT '0 >> Init, 1 >> Waiting to Push Queue, 2 >> Pushed to Queue, 3 >> TimeOut',
  `percent` DOUBLE(5,2) DEFAULT NULL,
  `migrate_date` datetime NOT NULL,
  `created_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uniq_username` (`username`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC