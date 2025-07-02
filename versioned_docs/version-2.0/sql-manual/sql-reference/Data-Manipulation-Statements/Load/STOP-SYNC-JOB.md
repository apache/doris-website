---
{
    "title": "STOP-SYNC-JOB",
    "language": "en"
}
---

## STOP-SYNC-JOB

### Name

STOP SYNC JOB

### Description

Stop a non-stop resident data synchronization job in a database by `job_name`.

grammar:

```sql
STOP SYNC JOB [db.]job_name
```

### Example

1. Stop the data sync job named `job_name`

    ```sql
    STOP SYNC JOB `job_name`;
    ```

### Keywords

    STOP, SYNC, JOB

### Best Practice

