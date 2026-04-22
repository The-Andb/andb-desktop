CREATE TABLE `collection_system` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'string, this is the name of system collection',
  `type` TINYINT UNSIGNED NOT NULL COMMENT 'Email = 1 >> it allows the user can filter email only , Calendar = 2 >> it allows the user can filter event object only , ToDo''s = 3 >> it allows the user can filter ToDo object only , Contacts = 4 >> it allows the user can filter contact object only , Notes = 5 >> it allows the user can filter Note object only , Websites = 6  >> it allows the user can filter URL bookmark object only , Files = 7  >> it allows the user can filter Cloud File object only , Organizer = 8  >> it allows the user can filter: Event, ToDo, Note, Contact, URL bookmark, Cloud',
  `enable_mini_month` TINYINT UNSIGNED DEFAULT '0' COMMENT 'allow the user enable mini month',
  `enable_quick_view` TINYINT UNSIGNED DEFAULT '0' COMMENT 'allow the user enable week view ',
  `show_mini_month` TINYINT(1) DEFAULT '1' COMMENT 'allow the user can show/hide the mini month',
  `local_filter` json DEFAULT NULL,
  `sub_filter` json DEFAULT NULL,
  `is_default` TINYINT UNSIGNED DEFAULT '0' COMMENT '0 = user system collection (default ), 1 = default system collection (server will generate >> Email, Event, ToDo''s, Notes, Contacts, Files, Bookmarks, Organizer)',
  `created_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `updated_date` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `checksum` VARCHAR(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `checksum_UNIQUE` (`checksum`),
  KEY `idx_name` (`name`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci