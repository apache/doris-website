---
{
    "title": "CANCEL-EXPORT",
    "language": "en"
}
---

## CANCEL-EXPORT 

### Name

<version since="1.2.2"></version>

CANCEL EXPORT 

### Description

This statement is used to undo an export job for the specified label. Or batch undo export jobs via fuzzy matching

```sql
CANCEL EXPORT 
[FROM db_name]
WHERE [LABEL = "export_label" | LABEL like "label_pattern" | STATE = "PENDING/IN_QUEUE/EXPORTING"]
```

### Example

1. Cancel the export job whose label is `example_db_test_export_label` on the database example_db

    ```sql
    CANCEL EXPORT
    FROM example_db
    WHERE LABEL = "example_db_test_export_label" and STATE = "EXPORTING";
    ```

2. Cancel all export jobs containing example* on the database example*db.

    ```sql
    CANCEL EXPORT
    FROM example_db
    WHERE LABEL like "%example%";
    ```

3. Cancel all export jobs which state are "PENDING"

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE STATE = "PENDING";
   ```

### Keywords

     CANCEL, EXPORT

### Best Practice

1. Only pending export jobs in PENDING, IN_QUEUE,EXPORTING state can be canceled.
2. When performing batch undo, Doris does not guarantee the atomic undo of all corresponding export jobs. That is, it is possible that only some of the export jobs were successfully undone. The user can view the job status through the SHOW EXPORT statement and try to execute the CANCEL EXPORT statement repeatedly.
3. When the job of the `EXPORTING` state is revoked, part of the data may have been exported to the storage system, and the user needs to process (delete) this section to export data.
