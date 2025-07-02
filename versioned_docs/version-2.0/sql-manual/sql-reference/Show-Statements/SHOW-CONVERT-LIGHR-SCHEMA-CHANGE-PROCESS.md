---
{
    "title": "SHOW-CONVERT-LIGHT-SCHEMA-CHANGE-PROCESS",
    "language": "en"
}
---

## SHOW-CONVERT-LIGHT-SCHEMA-CHANGE-PROCESS

### Name

SHOW CONVERT LIGHT SCHEMA CHANGE PROCESS

### Description

This statement is used to show the process of converting light schema change process. should enable config `enable_convert_light_weight_schema_change`.

grammar:

```sql
SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS [FROM db]
```

### Example

1. View the converting process in db named test 

    ```sql
     SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS FROM test;
    ```

2. View the converting process globally

    ```sql
    SHOW CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS;
    ```


### Keywords

    SHOW, CONVERT_LIGHT_SCHEMA_CHANGE_PROCESS

### Best Practice