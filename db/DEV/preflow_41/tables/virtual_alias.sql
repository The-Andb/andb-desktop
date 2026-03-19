CREATE TABLE `virtual_alias` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `domain_id` BIGINT UNSIGNED NOT NULL,
  `source` VARCHAR(100) NOT NULL,
  `destination` VARCHAR(9000) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_domain_id` (`domain_id`),
  KEY `idx_source` (`source`) USING BTREE,
  CONSTRAINT `cst_virtual_domain_by_domain_id` FOREIGN KEY (`domain_id`) REFERENCES `virtual_domain` (`id`) ON DELETE CASCADE ON UPDATE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_general_ci'