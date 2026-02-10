---
{
    "title": "SHOW DELETE",
    "language": "en",
    "description": "This statement is used to display the historical delete tasks that have been successfully executed"
}
---

## Description

This statement is used to display the historical delete tasks that have been successfully executed

## Syntax

```sql
SHOW DELETE [FROM <db_name>]
```

## Optional Parameters
**<db_name>** : The name of the database to be displayed

## Return Value
| Column            | Description                                                                      |
|-------------------|----------------------------------------------------------------------------------|
| `TableName`       | The name of the table where the delete operation was executed.                   |
| `PartitionName`   | The name of the partition affected by the delete operation.                      |
| `CreateTime`      | The timestamp when the delete operation was issued.                              |
| `DeleteCondition` | The condition used for the delete operation, specifying which rows were deleted. |
| `State`           | The status of the delete operation                                               |


## Example

1. Go to the test database to view all historical delete tasks
     ```sql
    show delete;
    ```
    ```text
    +---------------+---------------+---------------------+-----------------+----------+
    | TableName     | PartitionName | CreateTime          | DeleteCondition | State    |
    +---------------+---------------+---------------------+-----------------+----------+
    | iceberg_table | *             | 2025-03-14 15:53:32 | id EQ "1"       | FINISHED |
    +---------------+---------------+---------------------+-----------------+----------+
    ```

2. Display all historical delete tasks of database database

     ```sql
     show delete from tpch;
     ```
     ```
     +-----------+---------------+---------------------+-------------------+----------+
     | TableName | PartitionName | CreateTime          | DeleteCondition   | State    |
     +-----------+---------------+---------------------+-------------------+----------+
     | customer  | *             | 2025-03-14 15:45:19 | c_custkey EQ "18" | FINISHED |
     +-----------+---------------+---------------------+-------------------+----------+
     ```

