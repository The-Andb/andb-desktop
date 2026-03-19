CREATE TABLE `storage_share` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `file_uid` VARCHAR(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `user` VARCHAR(300) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `channel_id` BIGINT DEFAULT NULL,
  `channel` VARCHAR(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `shared_by` VARCHAR(200) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `channel_type` VARCHAR(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `shared_with_role` VARCHAR(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'viewer: role has read and access file info\r\neditor: role has  viewer role permissons and write permission\r\nadmin: role has editor role permissions and delete permission',
  `created_date` DOUBLE(13,3) DEFAULT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `share_UN` (`file_uid`,`channel_id`,`channel_type`),
  UNIQUE KEY `share_UN_USER` (`file_uid`,`user`),
  KEY `storage_share_channel_id_IDX` (`channel_id`,`channel_type`) USING BTREE,
  KEY `storage_share_user_IDX` (`user`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci