CREATE TABLE `storage_colla_document_version` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uid` VARCHAR(200) NOT NULL,
  `name` VARCHAR(255) DEFAULT NULL,
  `document_uid` VARCHAR(255) DEFAULT NULL,
  `has_snapshot` TINYINT(1) DEFAULT NULL,
  `snapshot_path` VARCHAR(255) DEFAULT NULL,
  `created_date` DOUBLE DEFAULT NULL,
  `updated_date` DOUBLE DEFAULT NULL,
  `start_time` DOUBLE DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1