CREATE TABLE `accounts_config` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uid` VARCHAR(150) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `password` VARCHAR(150) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `email` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `refreshToken` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `accessToken` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `expire_time` INT NOT NULL,
  `server_address` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `con_type` TINYINT UNSIGNED DEFAULT '1' COMMENT '1: Login via Oauth2 Account',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1