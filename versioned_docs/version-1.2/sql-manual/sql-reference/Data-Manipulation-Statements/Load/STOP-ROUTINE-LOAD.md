---
{
    "title": "STOP-ROUTINE-LOAD",
    "language": "en"
}
---

## STOP-ROUTINE-LOAD

### Name

STOP ROUTINE LOAD

### Description

User stops a Routine Load job. A stopped job cannot be rerun.

```sql
STOP ROUTINE LOAD FOR job_name;
```

### Example

1. Stop the routine import job named test1.

    ```sql
    STOP ROUTINE LOAD FOR test1;
    ```

### Keywords

    STOP, ROUTINE, LOAD

### Best Practice

