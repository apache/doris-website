---
{
    "title": "CANCEL-RESTORE",
    "language": "en"
}
---

## CANCEL-RESTORE

### Name

CANCEL RESTORE

### Description

This statement is used to cancel an ongoing RESTORE task.

grammar:

```sql
CANCEL RESTORE FROM db_name;
```

Notice:

- When cancellation is around a COMMIT or later stage of recovery, the table being recovered may be rendered inaccessible. At this time, data recovery can only be performed by executing the recovery job again.

### Example

1. Cancel the RESTORE task under example_db.

```sql
CANCEL RESTORE FROM example_db;
```

### Keywords

     CANCEL, RESTORE

### Best Practice
