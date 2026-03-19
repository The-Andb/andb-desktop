CREATE FUNCTION `OTE_cleanupOrphanCollectionNodes`() RETURNS INT BEGIN
  DECLARE nCollectionID    BIGINT(20);
  DECLARE nRootID          BIGINT(20);
  DECLARE nUserID          BIGINT(20);
  DECLARE nType            INT(11);
  DECLARE vEmail           VARCHAR(255);
  DECLARE nActionType      INT(11);
  DECLARE no_more_rows     BOOLEAN;
  DECLARE nCount           INT(11) DEFAULT 0;
  DECLARE nReturn          INT(11);
  DECLARE dDeletedDate     DOUBLE(13,3) DEFAULT unix_timestamp(now(3));
  DECLARE collection_cursor CURSOR FOR
    SELECT c1.id
          ,c1.root_id
          ,c1.user_id
          ,c1.type
          ,u.email
          ,1 AS action_type
      FROM collection c1
      JOIN user u ON (u.id = c1.user_id)
     WHERE c1.root_id > 0
       AND c1.type = 4
       AND NOT EXISTS (
           SELECT 1
             FROM collection c2
            WHERE c2.id = c1.root_id
       )
     UNION ALL
    SELECT c.id
          ,c.root_id
          ,c.user_id
          ,c.type
          ,u.email
          ,2 AS action_type
      FROM collection c
      JOIN user u ON (u.id = c.user_id)
     WHERE c.id = c.root_id
       AND c.type = 4;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET no_more_rows = TRUE;

  OPEN collection_cursor;
  
  collection_loop: LOOP
    FETCH collection_cursor 
     INTO nCollectionID, nRootID, nUserID, nType, vEmail, nActionType;
    
    IF (no_more_rows) THEN
      CLOSE collection_cursor;
      LEAVE collection_loop;
    END IF;

    IF (nActionType = 1) THEN
      DELETE FROM collection
      WHERE id = nCollectionID;
      --
      INSERT INTO deleted_item
             (item_id,        item_type,  user_id, item_uid, is_recovery, created_date, updated_date)
      VALUES (nCollectionID, 'FOLDER', nUserID,      '',           0, dDeletedDate, dDeletedDate);
    ELSEIF (nActionType = 2) THEN
      UPDATE collection
         SET root_id = 0
       WHERE id = nCollectionID;
    END IF;
    
    SET nReturn = m2023_insertAPILastModify('collection', nUserID, dDeletedDate);
    SET dDeletedDate = dDeletedDate + 0.001;
    SET nCount = nCount + 1;
  END LOOP collection_loop;
  
  RETURN nCount;
END