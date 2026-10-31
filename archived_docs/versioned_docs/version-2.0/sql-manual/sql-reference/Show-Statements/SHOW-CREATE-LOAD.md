---
{
    "title": "SHOW-CREATE-LOAD",
    "language": "en"
}
---

## SHOW-CREATE-LOAD

### Name

SHOW CREATE LOAD

### Description

This statement is used to demonstrate the creation statement of a import job.

grammar:

```sql
SHOW CREATE LOAD for load_name;
```

illustrate:

-  `load_name`: import job name

### Example

1. Show the creation statement of the specified import job under the default db

    ```sql
    SHOW CREATE LOAD for test_load
    ```

### Keywords

    SHOW, CREATE, LOAD

### Best Practice

