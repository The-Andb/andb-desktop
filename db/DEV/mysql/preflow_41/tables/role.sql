CREATE TABLE `role` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` INT NOT NULL DEFAULT '0' COMMENT '0: nomal, 1: super admin',
  `order_number` DOUBLE(13,3) NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1