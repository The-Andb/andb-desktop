CREATE TABLE `calendar_changes_global` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `synctoken` INT UNSIGNED NOT NULL,
  `calendarid` INT UNSIGNED NOT NULL,
  `operation` TINYINT(1) NOT NULL,
  `deleted_calendar_uri` VARCHAR(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `owner_deleted_calendar` VARCHAR(200) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `calendar_changes_global_synctoken_IDX` (`synctoken`) USING BTREE,
  KEY `idx_calendar_changes_global_calendarid_synctoken` (`calendarid`,`synctoken`),
  KEY `idx_calendar_changes_global_owner_synctoken` (`owner_deleted_calendar`,`synctoken`,`calendarid`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1