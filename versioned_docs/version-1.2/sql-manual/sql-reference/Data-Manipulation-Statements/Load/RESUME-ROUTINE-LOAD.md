---
{
    "title": "RESUME-ROUTINE-LOAD",
    "language": "en"
}
---

## RESUME-ROUTINE-LOAD

### Name

RESUME ROUTINE LOAD

### Description

Used to restart a suspended Routine Load job. The restarted job will continue to consume from the previously consumed offset.

```sql
RESUME [ALL] ROUTINE LOAD FOR job_name
```

### Example

1. Restart the routine import job named test1.

    ```sql
    RESUME ROUTINE LOAD FOR test1;
    ```

2. Restart all routine import jobs.

    ```sql
    RESUME ALL ROUTINE LOAD;
    ```

### Keywords

    RESUME, ROUTINE, LOAD

### Best Practice

