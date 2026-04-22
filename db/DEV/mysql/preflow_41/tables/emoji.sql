CREATE TABLE `emoji` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `shortcut` VARCHAR(100) DEFAULT NULL,
  `unicode` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT 'Unicode value',
  `character` TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cdn_url` TEXT,
  `name` VARCHAR(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `type` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'value = 1 >> smileys and people\nvalue = 2 >> animals and nature\nvalue = 3 >> food and drink\nvalue = 4 >> activities\nvalue = 5 >> travel and places\nvalue = 6 >> objects\nvalue = 7 >> symbols\nvalue = 8 >> flags',
  `description` VARCHAR(255) DEFAULT '',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_shortcut` (`shortcut`),
  UNIQUE KEY `unq_unicode` (`unicode`),
  KEY `unq_updated_date` (`updated_date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='latin1_swedish_ci'