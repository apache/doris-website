---
{
    "title": "SHOW LOAD WARNINGS",
    "language": "en"
}
---

## Description

If an import task fails and the error message is `ETL_QUALITY_UNSATISFIED`, it indicates that there are import quality issues. This statement is used to view these import tasks with quality issues.

## Syntax

```sql
SHOW LOAD WARNINGS
[FROM <db_name>]
[
   WHERE
   [LABEL  = [ "<your_label>" ]]
   [LOAD_JOB_ID = ["<job_id>"]]
]
```

## Optional Parameters

**1. `<db_name>`**

> If `db_name` is not specified, the current default database will be used.

**2. `<your_label>`**

> If `LABEL = <your_label>` is used, it will precisely match the specified label.

**3. `<job_id>`**

> If `LOAD_JOB_ID = <job_id>` is specified, it will precisely match the specified JOB_ID.

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Database | Import permissions for the database tables are required. |

## Return Value

Returns the data with quality issues in the import tasks of the specified database.

## Examples

- Display the data with quality issues in the import tasks of the specified database, where the label is specified as "load_demo_20210112".

```sql
SHOW LOAD WARNINGS FROM demo WHERE LABEL = "load_demo_20210112" 
```