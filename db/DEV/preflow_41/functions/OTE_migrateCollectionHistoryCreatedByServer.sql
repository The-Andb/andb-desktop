CREATE FUNCTION `OTE_migrateCollectionHistoryCreatedByServer`() RETURNS INT BEGIN
    DECLARE no_more_rows      boolean;
    DECLARE nCount            INT DEFAULT 0;
    DECLARE nReturn           INT DEFAULT 0;
    DECLARE nChID             BIGINT(20);
    DECLARE usr_cursor CURSOR FOR
    # Start of: main script;
    SELECT ch.id
      FROM conference_history ch
     WHERE ch.status IN (14,20,21)
       AND ch.created_by_server = 0
     ;

    # END of: main script
   DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
   --
   OPEN usr_cursor;
   usr_loop: LOOP
     -- start LOOP usr_cursor
     FETCH usr_cursor 
      INTO nChID;
     -- stop LOOP WHEN no_more_rows
     IF (no_more_rows) THEN
       CLOSE usr_cursor;
       LEAVE usr_loop;
     END IF;
     # main UPDATE
     UPDATE conference_history ch
        SET ch.created_by_server = 1
      WHERE ch.id = nChID
        AND ch.created_by_server = 0;
     --
     SET nCount = nCount + 1;
      # main UPDATE
     --
   END LOOP usr_loop;
   --
RETURN nCount;
END