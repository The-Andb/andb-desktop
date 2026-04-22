CREATE FUNCTION `OTE_migrateAgileSortStatus`() RETURNS INT BEGIN
  --
  DECLARE nID              BIGINT(20);
  DECLARE vStatus          VARCHAR(25);
  DECLARE nOrderNumber     DOUBLE(20,10);
  DECLARE no_more_rows     boolean;
  DECLARE nCount           INT(11) DEFAULT 0;
  DECLARE agile_cursor CURSOR FOR
  # Start of: main query
  SELECT ags.id
        ,ags.order_number
      -- ,ags.user_id
      -- ,ags.collection_id
      -- ,ags.object_uid
      -- ,ags.object_type
      ,ct.status
    FROM sort_agile ags
    JOIN collection co ON (co.id = ags.collection_id)
    JOIN calendarinstances ci ON (ci.uri = co.calendar_uri)
    JOIN calendarobjects cobj ON (cobj.calendarid = ci.calendarid AND cobj.uid = ags.object_uid)
    JOIN cal_todo ct ON (ct.uid = ags.object_uid AND cobj.uid = ct.uid)
   WHERE (ags.status IS NULL OR ags.server_order_number IS NULL)
     AND ags.object_type = 'VTODO'
--      AND ags.object_uid = "42e4a7d0-1eec-4a7c-a1c8-ee4104f3d030"
ORDER BY ags.id;
  # END of: main query
  DECLARE CONTINUE handler FOR NOT found SET no_more_rows = TRUE;
  --
  OPEN agile_cursor;
  agile_loop: LOOP
    --
    FETCH agile_cursor 
     INTO nID, vStatus, nOrderNumber;
    --
    IF (no_more_rows) THEN
      CLOSE agile_cursor;
      LEAVE agile_loop;
    END IF;
    # main UPDATE
    UPDATE sort_agile ags
       SET ags.status = ifnull(ags.status, vStatus)
          ,ags.server_order_number = ifnull(ags.server_order_number, nOrderNumber)
       WHERE ags.id = nID;
    # main UPDATE
    SET nCount = nCount + 1;
  END LOOP agile_loop;
  --
  RETURN nCount;
  --
END