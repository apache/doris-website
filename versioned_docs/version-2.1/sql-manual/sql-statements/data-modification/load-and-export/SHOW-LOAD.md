---
{
    "title": "SHOW LOAD",
    "language": "en"
}
---

## Description

This statement is used to display the execution status of the specified import task.

## Syntax

```sql
SHOW LOAD
[FROM <db_name>]
[
   WHERE
   [LABEL  = [ "<your_label>" | LIKE "<label_matcher>"]]
   [ STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " } ]
]
[ORDER BY { <col_name> | <expr> | <position> }]
[LIMIT <limit>[OFFSET <offset>]];
```

## Optional Parameters

**1. `<db_name>`**

> If `db_name` is not specified, the current default database will be used.

**2. `<label_matcher>`**

> When using `LABEL LIKE = "<label_matcher>"`, it will match import tasks whose labels contain `label_matcher`.

**3. `<your_label>`**

> When using `LABEL = "<your_label>"`, it will precisely match the specified label.

**4. STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " }**

> Specifying `PENDING` means matching jobs with the `LOAD = "PENDING"` status. The same applies to other status keywords.

**5. `<col_name>`**

> Specify the column name in the result set for sorting.

**6. `<expr>`**

> Use an expression for sorting.

**7. `<position>`**

> Sort by the position of the column in the `SELECT` list (starting from 1).

**8. `<limit>`**

> If `LIMIT` is specified, it will display `limit` matching records. Otherwise, all records will be displayed.

**9. `<offset>`**

> Specify to start displaying query results from the offset `offset`. By default, the offset is 0.

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege | Object | Notes |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Database | Import permissions for the database tables are required. |

## Return Value

Returns the detailed status of the specified import task.

## Examples

1. Display all import tasks in the default database.

    ```sql
    SHOW LOAD;
    ```

2. Display import tasks in the specified database where the label contains the string "2014_01_02", and show the oldest 10 tasks.

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
    ```

3. Display import tasks in the specified database with the specified label "load_example_db_20140102" and sort them in descending order by `LoadStartTime`.

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" ORDER BY LoadStartTime DESC;
    ```

4. Display import tasks in the specified database with the specified label "load_example_db_20140102", the state "loading", and sort them in descending order by `LoadStartTime`.

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" AND STATE = "loading" ORDER BY LoadStartTime DESC;
    ```

5. Display import tasks in the specified database, sort them in descending order by `LoadStartTime`, and start displaying 10 query results from offset 5.

    ```sql
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 5,10;
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 10 offset 5;
    ```

6. Command to check the import status during small - batch imports.

    ```text
    curl --location-trusted -u {user}:{passwd} http://{hostname}:{port}/api/{database}/_load_info?label={labelname}
    ```