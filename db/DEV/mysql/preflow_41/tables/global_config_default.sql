CREATE TABLE `global_config_default` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `working_time` json NOT NULL,
  `week_start` INT NOT NULL DEFAULT '0',
  `event_duration` INT NOT NULL DEFAULT '3600',
  `alert_before` INT NOT NULL DEFAULT '0',
  `default_alert_ade` INT DEFAULT '0',
  `snooze_default` INT NOT NULL DEFAULT '900',
  `default_alert_todo` INT DEFAULT '0',
  `due_task` INT NOT NULL DEFAULT '0',
  `task_duration` INT NOT NULL DEFAULT '1800',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC COMMENT='utf8_unicode_ci'