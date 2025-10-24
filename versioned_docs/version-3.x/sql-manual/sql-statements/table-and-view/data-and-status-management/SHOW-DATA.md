---
{
    "title": "SHOW DATA",
    "language": "en"
}
---

## Description

The `SHOW DATA` statement is used to display information about data volume, replica count, and row statistics. This statement has the following functionalities:

- It can display the data volume and replica count for all tables in the current database.
- It can show the data volume, replica count, and row statistics for a specified table's materialized views.
- It can display the quota usage of the database.
- It supports sorting by data volume, replica count, etc.

## Syntax

```sql
SHOW DATA [ FROM [<db_name>.]<table_name> ] [ ORDER BY <order_by_clause> ];
```

Where:

```sql
order_by_clause:
    <column_name> [ ASC | DESC ] [ , <column_name> [ ASC | DESC ] ... ]
```

## Optional Parameters

**1. `FROM [<db_name>.]<table_name>`**

> Specifies the name of the table to view. The database name can be included.
>
> If this parameter is not specified, it will display data information for all tables in the current database.

**2. `ORDER BY <order_by_clause>`**

> Specifies the sorting method for the result set.
>
> Any column can be sorted in ascending (ASC) or descending (DESC) order.
>
> Supports multi-column combination sorting.

## Return Values

Depending on different query scenarios, the following result sets are returned:

- When the `FROM` clause is not specified (displaying database-level information):

| Column Name      | Description                          |
|------------------|--------------------------------------|
| DbId             | Database ID                          |
| DbName           | Database name                        |
| Size             | Total data volume of the database    |
| RemoteSize       | Remote storage data volume           |
| RecycleSize      | Recycle bin data volume              |
| RecycleRemoteSize| Recycle bin remote storage volume    |

- When the `FROM` clause is specified (displaying table-level information):

| Column Name      | Description                          |
|------------------|--------------------------------------|
| TableName        | Table name                           |
| IndexName        | Index (materialized view) name      |
| Size             | Data size                            |
| ReplicaCount     | Replica count                        |
| RowCount         | Row statistics (shown only when viewing a specific table) |

## Access Control Requirements

Users executing this SQL command must have at least the following permissions:

| Privilege       | Object      | Notes                                         |
| :-------------- | :---------- | :-------------------------------------------- |
| SELECT          | Table       | SELECT permission is required for viewing the table. |

## Usage Notes

- The data volume statistics include the total data volume of all replicas.
- The replica count includes all partitions and replicas of all materialized views for the table.
- When counting rows, it considers the maximum row count among multiple replicas.
- The `Total` row in the result set indicates aggregated data.
- The `Quota` row in the result set indicates the current quota set for the database.
- The `Left` row in the result set indicates remaining quota.
- If you need to view the size of each partition, use the `SHOW PARTITIONS` command.

## Examples

- Display data volume information for all databases:

    ```sql
    SHOW DATA;
    ```

    ```
    +-------+-----------------------------------+--------+------------+-------------+-------------------+
    | DbId  | DbName                            | Size   | RemoteSize | RecycleSize | RecycleRemoteSize |
    +-------+-----------------------------------+--------+------------+-------------+-------------------+
    | 21009 | db1                               | 0      | 0          | 0           | 0                 |
    | 22011 | regression_test_inverted_index_p0 | 72764  | 0          | 0           | 0                 |
    | Total | NULL                              | 118946 | 0          | 0           | 0                 |
    +-------+-----------------------------------+--------+------------+-------------+-------------------+
    ```

- Display data volume information for all tables in the current database:

    ```sql
    USE db1;
    SHOW DATA;
    ```

    ```text
    +-----------+-------------+--------------+
    | TableName | Size        | ReplicaCount |
    +-----------+-------------+--------------+
    | tbl1      | 900.000 B   | 6            |
    | tbl2      | 500.000 B   | 3            |
    | Total     | 1.400 KB    | 9            |
    | Quota     | 1024.000 GB | 1073741824   |
    | Left      | 1021.921 GB | 1073741815   |
    +-----------+-------------+--------------+
    ```

- Display detailed data volume information for a specified table:

    ```sql
    SHOW DATA FROM example_db.test;
    ```

    ```text
    +-----------+-----------+-----------+--------------+----------+
    | TableName | IndexName | Size      | ReplicaCount | RowCount |
    +-----------+-----------+-----------+--------------+----------+
    | test      | r1        | 10.000MB  | 30           | 10000    |
    |           | r2        | 20.000MB  | 30           | 20000    |
    |           | test2     | 50.000MB  | 30           | 50000    |
    |           | Total     | 80.000MB  | 90           |          |
    +-----------+-----------+-----------+--------------+----------+
    ```

- Sort by replica count in descending order and by data volume in ascending order:

    ```sql
    SHOW DATA ORDER BY ReplicaCount DESC, Size ASC;
    ```

    ```text
    +-----------+-------------+--------------+
    | TableName | Size        | ReplicaCount |
    +-----------+-------------+--------------+
    | table_c   | 3.102 KB    | 40           |
    | table_d   | .000        | 20           |
    | table_b   |=324.000 B   |=20           |
    |=table_a   |=1.266 KB   |=10           |
    |=Total     |=4.684 KB   |=90           |
   |=Quota     |=1024.000 GB |=1073741824   |
   |=Left      |=1024.000 GB |=1073741734   |
   +-----------+-------------+--------------+
   ```
