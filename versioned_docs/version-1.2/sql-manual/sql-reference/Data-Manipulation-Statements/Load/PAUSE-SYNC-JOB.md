---
{
    "title": "PAUSE-SYNC-JOB",
    "language": "en"
}
---

## PAUSE-SYNC-JOB

### Name

PAUSE SYNC JOB

### Description

Pause a running resident data synchronization job in a database via `job_name`. The suspended job will stop synchronizing data and keep the latest position of consumption until it is resumed by the user.

grammar:

```sql
PAUSE SYNC JOB [db.]job_name
```

### Example

1. Pause the data sync job named `job_name`.

    ```sql
    PAUSE SYNC JOB `job_name`;
    ```

### Keywords

    PAUSE, SYNC, JOB

### Best Practice

