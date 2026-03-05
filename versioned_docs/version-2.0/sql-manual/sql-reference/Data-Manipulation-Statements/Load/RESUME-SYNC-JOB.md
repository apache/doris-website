---
{
    "title": "RESUME-SYNC-JOB",
    "language": "en"
}
---

## RESUME-SYNC-JOB

### Name

RESUME SYNC JOB

### Description

Resume a resident data synchronization job whose current database has been suspended by `job_name`, and the job will continue to synchronize data from the latest position before the last suspension.

grammar:

```sql
RESUME SYNC JOB [db.]job_name
```

### Example

1. Resume the data synchronization job named `job_name`

    ```sql
    RESUME SYNC JOB `job_name`;
    ```

### Keywords

    RESUME, SYNC, LOAD

### Best Practice

