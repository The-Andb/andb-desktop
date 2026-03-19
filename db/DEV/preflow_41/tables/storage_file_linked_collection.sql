CREATE TABLE `storage_file_linked_collection` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `collection_id` BIGINT NOT NULL,
  `collection_type` VARCHAR(100) NOT NULL,
  `file_uid` VARCHAR(200) NOT NULL,
  `linked_by` VARCHAR(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sflc_collection_id` (`collection_id`),
  KEY `idx_sflc_collection_id_file_uid` (`collection_id`,`file_uid`),
  KEY `idx_sflc_collection_type` (`collection_type`),
  KEY `idx_sflc_file_uid` (`file_uid`),
  KEY `idx_sflc_file_uid_id` (`file_uid`,`id`),
  KEY `idx_sflc_linked_by` (`linked_by`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1