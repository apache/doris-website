---
{
    "title": "PAUSE-ROUTINE-LOAD",
    "language": "en"
}
---

## PAUSE-ROUTINE-LOAD

### Name

PAUSE ROUTINE LOAD

### Description

Used to pause a Routine Load job. A suspended job can be rerun with the RESUME command.

```sql
PAUSE [ALL] ROUTINE LOAD FOR job_name
```

### Example

1. Pause the routine import job named test1.

    ```sql
    PAUSE ROUTINE LOAD FOR test1;
    ```

2. Pause all routine import jobs.

    ```sql
    PAUSE ALL ROUTINE LOAD;
    ```

### Keywords

    PAUSE, ROUTINE, LOAD

### Best Practice

