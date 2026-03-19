CREATE TABLE `ai_collection` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `last_updated` DOUBLE DEFAULT NULL,
  `collection_id` BIGINT DEFAULT NULL,
  `last_long_summary` TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci,
  `total_event` INT DEFAULT NULL,
  `total_note` INT DEFAULT NULL,
  `total_todo` INT DEFAULT NULL,
  `learn_from_last_note_id` INT DEFAULT NULL,
  `learn_from_last_todo_id` INT DEFAULT NULL,
  `learn_from_last_event_id` INT DEFAULT NULL,
  `last_short_summary` TEXT CHARACTER SET latin1 COLLATE latin1_swedish_ci,
  PRIMARY KEY (`id`),
  KEY `ai_collection_collection_id_IDX` (`collection_id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=latin1