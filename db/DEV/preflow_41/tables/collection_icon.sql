CREATE TABLE `collection_icon` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `shortcut` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
  `cdn_url` TEXT NOT NULL,
  `icon_type` TINYINT(1) NOT NULL DEFAULT '0' COMMENT 'icon_type: the type of the icon\\n\\nvalue  = 0 >> activity (default )\\n\\nvalue = 1 >> travel and place\\n\\nvalue = 2 >> objects ',
  `description` VARCHAR(255) DEFAULT '',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_shortcut` (`shortcut`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='latin1_swedish_ci'