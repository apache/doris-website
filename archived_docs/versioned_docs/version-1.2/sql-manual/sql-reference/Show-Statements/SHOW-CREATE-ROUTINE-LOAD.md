---
{
    "title": "SHOW-CREATE-ROUTINE-LOAD",
    "language": "en"
}
---

## SHOW-CREATE-ROUTINE-LOAD

### Name

SHOW CREATE ROUTINE LOAD

### Description

This statement is used to demonstrate the creation statement of a routine import job.

The kafka partition and offset in the result show the currently consumed partition and the corresponding offset to be consumed.

grammar:

```sql
SHOW [ALL] CREATE ROUTINE LOAD for load_name;
```

illustrate:

1. `ALL`: optional parameter, which means to get all jobs, including historical jobs
2. `load_name`: routine import job name

### Example

1. Show the creation statement of the specified routine import job under the default db

    ```sql
    SHOW CREATE ROUTINE LOAD for test_load
    ```

### Keywords

    SHOW, CREATE, ROUTINE, LOAD

### Best Practice

