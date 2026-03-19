CREATE TABLE `deleted_item` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `item_id` BIGINT DEFAULT NULL,
  `item_uid` VARBINARY(1000) DEFAULT NULL,
  `item_type` VARBINARY(50) NOT NULL DEFAULT '',
  `is_recovery` TINYINT UNSIGNED DEFAULT '0',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  `created_sec` BIGINT GENERATED ALWAYS AS (floor(`created_date`)) STORED NOT NULL,
  PRIMARY KEY (`id`,`created_sec`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci
/*!50100 PARTITION BY RANGE (`created_sec`)
(PARTITION p202508 VALUES LESS THAN (1756684800) ENGINE = InnoDB,
 PARTITION p202509 VALUES LESS THAN (1759276800) ENGINE = InnoDB,
 PARTITION p202510 VALUES LESS THAN (1761955200) ENGINE = InnoDB,
 PARTITION p202511 VALUES LESS THAN (1764547200) ENGINE = InnoDB,
 PARTITION p202512 VALUES LESS THAN (1767225600) ENGINE = InnoDB,
 PARTITION p202601 VALUES LESS THAN (1769904000) ENGINE = InnoDB,
 PARTITION p202602 VALUES LESS THAN (1772323200) ENGINE = InnoDB,
 PARTITION p202603 VALUES LESS THAN (1775001600) ENGINE = InnoDB,
 PARTITION p202604 VALUES LESS THAN (1777593600) ENGINE = InnoDB,
 PARTITION p202605 VALUES LESS THAN (1780272000) ENGINE = InnoDB,
 PARTITION p202606 VALUES LESS THAN (1782864000) ENGINE = InnoDB,
 PARTITION p202607 VALUES LESS THAN (1785542400) ENGINE = InnoDB,
 PARTITION pnmax VALUES LESS THAN MAXVALUE ENGINE = InnoDB) */
  KEY `idx_created_date` (`created_sec`),
  KEY `idx_id` (`id`),
  KEY `idx_object_uid_and_object_type` (`item_uid`,`item_type`),
  KEY `idx_user_id_and_type` (`user_id`,`item_type`),
  KEY `idx_user_type_created` (`user_id`,`item_type`,`created_sec`),
  KEY `idx_user_type_created_updated` (`user_id`,`item_type`,`created_sec`,`updated_date`,`id`)
  KEY `unq_on_user_id_and_item_id_and_item_type` (`user_id`,`item_type`,`item_id`,`created_sec`),
  KEY `unq_on_user_id_and_item_uid_and_item_type` (`user_id`,`item_type`,`item_uid`,`created_sec`),