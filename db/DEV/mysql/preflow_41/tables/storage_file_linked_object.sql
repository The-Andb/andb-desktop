CREATE TABLE `storage_file_linked_object` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `file_uid` VARCHAR(200) NOT NULL,
  `object_uid` VARCHAR(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `object_type` INT NOT NULL,
  `object_id` BIGINT DEFAULT NULL,
  `linked_by` VARCHAR(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `linked_by_object_id_idx` (`linked_by`,`object_id`),
  KEY `storage_file_linked_object_file_uid_IDX` (`file_uid`) USING BTREE,
  KEY `storage_file_linked_object_object_type_IDX` (`object_type`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1