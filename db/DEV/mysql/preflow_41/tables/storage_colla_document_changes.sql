CREATE TABLE `storage_colla_document_changes` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) DEFAULT NULL,
  `start_time` BIGINT DEFAULT NULL,
  `update_count` INT DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `file_path` VARCHAR(300) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `has_snapshot` TINYINT DEFAULT NULL,
  `snapshot_path` VARCHAR(255) DEFAULT NULL,
  `name` VARCHAR(100) DEFAULT NULL,
  `doc_uid` VARCHAR(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `storage_colla_document_changes_doc_uid_IDX` (`doc_uid`) USING BTREE,
  KEY `storage_colla_document_changes_start_time_IDX` (`start_time`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1