---
{
    "title": "CANCEL-LOAD",
    "language": "en"
}
---

## CANCEL-LOAD

### Name

CANCEL LOAD

### Description

This statement is used to undo an import job for the specified label. Or batch undo import jobs via fuzzy matching

```sql
CANCEL LOAD
[FROM db_name]
WHERE [LABEL = "load_label" | LABEL like "label_pattern" | STATE = "PENDING/ETL/LOADING"]
```

Notice: Cancel by State is supported since 1.2.0.

### Example

1. Cancel the import job whose label is `example_db_test_load_label` on the database example_db

    ```sql
    CANCEL LOAD
    FROM example_db
    WHERE LABEL = "example_db_test_load_label";
    ```

2. Cancel all import jobs containing example* on the database example*db.

    ```sql
    CANCEL LOAD
    FROM example_db
    WHERE LABEL like "example_";
    ```



3. Cancel all import jobs which state are "LOADING"

   ```sql
   CANCEL LOAD
   FROM example_db
   WHERE STATE = "loading";
   ```


:::tip 提示
该功能自 Apache Doris  1.2 版本起支持
:::

### Keywords

     CANCEL, LOAD

### Best Practice

1. Only pending import jobs in PENDING, ETL, LOADING state can be canceled.
2. When performing batch undo, Doris does not guarantee the atomic undo of all corresponding import jobs. That is, it is possible that only some of the import jobs were successfully undone. The user can view the job status through the SHOW LOAD statement and try to execute the CANCEL LOAD statement repeatedly.

