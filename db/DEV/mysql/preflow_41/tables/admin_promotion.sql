CREATE TABLE `admin_promotion` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `allow_pre_signup` TINYINT UNSIGNED NOT NULL DEFAULT '0',
  `signup_type` VARCHAR(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL DEFAULT '' COMMENT '1: yearly pro, 2: monthly pro, 3: yearly premium, 4: monthly premium, 5: standard',
  `promotion_expired` DOUBLE(13,3) NOT NULL DEFAULT '0.000',
  `description` VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  `promotion_type` TINYINT NOT NULL COMMENT '1=''register_based'', 2=''coupon_based'', 3=''referral_based''',
  `promotion_value` VARCHAR(100) DEFAULT NULL,
  `priority` TINYINT NOT NULL DEFAULT '-1' COMMENT 'smaller number means higher priority',
  `is_active` TINYINT NOT NULL DEFAULT '1',
  `created_date` DOUBLE(13,3) NOT NULL,
  `updated_date` DOUBLE(13,3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'