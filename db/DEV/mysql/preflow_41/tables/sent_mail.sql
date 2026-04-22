CREATE TABLE `sent_mail` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `message_id` TEXT COLLATE utf8mb4_unicode_ci,
  `predicted_next_uid` INT DEFAULT NULL,
  `email_subject` TEXT COLLATE utf8mb4_unicode_ci,
  `link_item_id` TEXT COLLATE utf8mb4_unicode_ci,
  `filing_item_id` INT DEFAULT NULL,
  `tracking_period` INT DEFAULT NULL,
  `sending_status` INT DEFAULT NULL,
  `account` TEXT COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci