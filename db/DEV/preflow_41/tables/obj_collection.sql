CREATE TABLE `obj_collection` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `object_uid` VARBINARY(1000) NOT NULL,
  `object_type` VARBINARY(50) NOT NULL,
  `collection_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='latin1_swedish_ci'