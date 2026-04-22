CREATE TABLE `subscription` (
  `id` VARCHAR(255) NOT NULL DEFAULT '',
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `price` FLOAT NOT NULL DEFAULT '0',
  `period` INT NOT NULL DEFAULT '0',
  `auto_renew` INT NOT NULL DEFAULT '0',
  `description` VARCHAR(255) NOT NULL DEFAULT '',
  `subs_type` INT NOT NULL DEFAULT '0',
  `order_number` INT NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COMMENT='utf8_unicode_ci'