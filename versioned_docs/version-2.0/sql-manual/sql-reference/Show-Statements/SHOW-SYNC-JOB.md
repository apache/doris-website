---
{
    "title": "SHOW-SYNC-JOB",
    "language": "en"
}


---

## SHOW-SYNC-JOB

### Name

SHOW SYNC JOB

### Description

This command is used to currently display the status of resident data synchronization jobs in all databases.

grammar:

```sql
SHOW SYNC JOB [FROM db_name]
```

### Example

1. Display the status of all data synchronization jobs in the current database.

    ```sql
    SHOW SYNC JOB;
    ```

2. Display the status of all data synchronization jobs under the database `test_db`.

    ```sql
    SHOW SYNC JOB FROM `test_db`;
    ```

### Keywords

    SHOW, SYNC, JOB

### Best Practice

