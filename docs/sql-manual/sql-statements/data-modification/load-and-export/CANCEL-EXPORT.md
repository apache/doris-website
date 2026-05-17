---
{
    "title": "CANCEL EXPORT",
    "language": "en",
    "description": "This statement is used to undo an export job for the specified label. Or batch undo export jobs via fuzzy matching."
}
---

## Description

This statement is used to undo an export job for the specified label. Or batch undo export jobs via fuzzy matching.

## Syntax  

```sql
CANCEL EXPORT
[ FROM <db_name> ]
WHERE [ LABEL = "<export_label>" | LABEL like "<label_pattern>" | STATE = "<state>" ]
```

## Optional Parameters

**1. `<db_name>`**

  The name of the database to which the exported data task belongs. If omitted, the default is the current database.

**2. `<export_label>`**

  Each import needs to be assigned a unique Label. Stopping this task requires specifying the label.

**3. `<label_pattern>`**

  A label expression for fuzzy matching. If you want to undo multiple EXPORT jobs, you can use `LIKE` for fuzzy matching.

**4. `<state>`**

  state options: `PENDING`,`IN_QUEUE`,`EXPORTING`.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege     | Object    | Notes                                         |
|:--------------|:----------|:----------------------------------------------|
| ALTER_PRIV    | Database  | Requires modification access to the database. |


## Usage Notes

1. Only pending export jobs in PENDING, IN_QUEUE,EXPORTING state can be canceled.
2. When performing batch undo, Doris does not guarantee the atomic undo of all corresponding export jobs. That is, it is possible that only some of the export jobs were successfully undone. The user can view the job status through the SHOW EXPORT statement and try to execute the CANCEL EXPORT statement repeatedly.
3. When the job of the `EXPORTING` state is revoked, part of the data may have been exported to the storage system, and the user needs to process (delete) this section to export data.

## Examples

- Cancel the export job whose label is `example_db_test_export_label` on the database example_db.

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE LABEL = "example_db_test_export_label" and STATE = "EXPORTING";
   ```

- Cancel all export jobs containing example* on the database example*db.

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE LABEL like "%example%";
   ```

- Cancel all export jobs which state are "PENDING"

   ```sql
   CANCEL EXPORT
   FROM example_db
   WHERE STATE = "PENDING";
   ```
