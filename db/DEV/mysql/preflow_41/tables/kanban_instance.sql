CREATE TABLE `kanban_instance` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'user_id of member',
  `collection_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID record of table collection - shared by the owner ',
  `kanban_id` BIGINT UNSIGNED NOT NULL COMMENT 'ID record of table kanban',
  `archive_status` INT DEFAULT '0' COMMENT 'Archive status: 0: not archive, 1: archived',
  `archived_time` DOUBLE(13,3) DEFAULT '0.000',
  `sort_by_type` TINYINT UNSIGNED NOT NULL DEFAULT '0',
  `order_number` DECIMAL(20,10) DEFAULT '0.0000000000',
  `order_update_time` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `created_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_collection_id` (`collection_id`),
  KEY `idx_kanban_id` (`kanban_id`),
  KEY `idx_updated_date` (`updated_date`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1