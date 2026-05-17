---
{
    "title": "Query Schema Action",
    "language": "en",
    "description": "The Query Schema Action can return the table creation statement for the given SQL-related table. Can be used to test some query scenarios locally."
}
---

# Query Schema Action


## Request

```
POST /api/query_schema/<ns_name>/<db_name>
```

## Description

The Query Schema Action can return the table creation statement for the given SQL-related table. Can be used to test some query scenarios locally.

The API was released in version 1.2.
    
## Path parameters

* `<db_name>`

    Specify the database name. This database will be considered as the default database for the current session, and will be used if the table name in SQL does not qualify the database name.

## Query parameters

None

## Request body

```
text/plain

sql
```

* "sql" field is the SQL string.

## Response

* Return value

    ```
    CREATE TABLE `tbl1` (
      `k1` int(11) NULL,
      `k2` int(11) NULL
    ) ENGINE=OLAP
    DUPLICATE KEY(`k1`, `k2`)
    COMMENT 'OLAP'
    DISTRIBUTED BY HASH(`k1`) BUCKETS 3
    PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "in_memory" = "false",
    "storage_format" = "V2",
    "disable_auto_compaction" = "false"
    );
    
    CREATE TABLE `tbl2` (
      `k1` int(11) NULL,
      `k2` int(11) NULL
    ) ENGINE=OLAP
    DUPLICATE KEY(`k1`, `k2`)
    COMMENT 'OLAP'
    DISTRIBUTED BY HASH(`k1`) BUCKETS 3
    PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "in_memory" = "false",
    "storage_format" = "V2",
    "disable_auto_compaction" = "false"
    );
    ```

## Example

1. Write the SQL in local file 1.sql

    ```
    select tbl1.k2 from tbl1 join tbl2 on tbl1.k1 = tbl2.k1;
    ```
    
2. Use curl to get the table creation statement.

    ```
    curl -X POST -H 'Content-Type: text/plain'  -uroot: http://127.0.0.1:8030/api/query_schema/internal/db1 -d@1.sql
    ```