CREATE TABLE `storage_colla_document` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `uid` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `name` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
  `last_version` BIGINT DEFAULT '0',
  `object_type` VARCHAR(255) DEFAULT NULL,
  `object_id` BIGINT DEFAULT NULL,
  `object_uid` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `created_date` DOUBLE DEFAULT NULL,
  `updated_date` DOUBLE DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `storage_colla_document_object_type_IDX` (`object_type`) USING BTREE,
  KEY `storage_colla_document_object_type_object_id_IDX` (`object_type`,`object_id`) USING BTREE,
  KEY `storage_colla_document_object_type_object_uid_IDX` (`object_type`,`object_uid`) USING BTREE,
  KEY `storage_colla_document_uid_IDX` (`uid`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1