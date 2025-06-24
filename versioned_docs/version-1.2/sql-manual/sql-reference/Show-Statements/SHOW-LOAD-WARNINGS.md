---
{
    "title": "SHOW-LOAD-WARNINGS",
    "language": "en"
}
---

## SHOW-LOAD-WARNINGS

### Name

SHOW LOAD WARNINGS

### Description

If the import task fails and the error message is `ETL_QUALITY_UNSATISFIED`, it means that there is an import quality problem. If you want to see these import tasks with quality problems, change the statement to complete this operation.

grammar:

```sql
SHOW LOAD WARNINGS
[FROM db_name]
[
    WHERE
    [LABEL[="your_label"]]
    [LOAD_JOB_ID = ["job id"]]
]
```

1) If db_name is not specified, the current default db is used
1) If LABEL = is used, it matches the specified label exactly
1) If LOAD_JOB_ID is specified, match the specified JOB ID exactly

### Example

1. Display the data with quality problems in the import task of the specified db, and specify the label as "load_demo_20210112"

    ```sql
    SHOW LOAD WARNINGS FROM demo WHERE LABEL = "load_demo_20210112"
    ```

### Keywords

    SHOW, LOAD, WARNINGS

### Best Practice

