---
{
"title": "SHOW ALTER TABLE MATERIALIZED VIEW",
"language": "en"
}
---

## Description

This command is used to check the execution status of the materialized view creation job submitted via statement [CREATE-MATERIALIZED-VIEW](../../../sql-statements/table-and-view/materialized-view/CREATE-MATERIALIZED-VIEW.md)

> This statement is equivalent to `SHOW ALTER TABLE ROLLUP`;

## Syntax

```sql
SHOW ALTER TABLE MATERIALIZED VIEW
[FROM <database>]
[<where_clause>]
[ORDER BY <order_by_key> [, ...]]
[LIMIT <limit_rows> [ OFFSET <offset_rows>]]
```

## Optional Parameters

**1. `FROM <database>`**

> View jobs under the specified database. If not specified, the current database will be used.

**2. `<where_clause>`**

> You can filter the result columns, and currently, only the following columns are supported for filtering:
- TableName: Only supports equality filtering.
- State: Only supports equality filtering.
- Createtime/FinishTime: Supports =, >=, <=, >, <, !=.

**3. `ORDER BY`**

> You can sort the result set by any column.

**4. `LIMIT <limit_rows> [ OFFSET <offset_rows>]`**

> For pagination queries.

## Return Value

| Column                 | Note                                                        |
|--------------------|-------------------------------------------------------------|
| JobId               | Job unique ID.                                              |
| TableName               | Base table name.                                            |
| CreateTime        | Job creation time.                                          |
| FinishTime           | Job finish time.                                            |
| BaseIndexName          | Base table name.                                            |
| RollupIndexName            | Materialized view name.                                     |
| RollupId | The unique ID of the materialized view.                     |
| TransactionId               | See the description of the State field                      |
| State           | Job status.                                                 |
| Msg          | Error msg                                                   |
| Progress          | Progress of the assignment. Here, progress refers to the "number of completed tablets / total number of tablets". The creation of materialized views is performed on a tablet granularity basis. |
| Timeout          | Job timeout duration, measured in seconds.                                                 |

State Description:
- PENDING: The job is in preparation.

- WAITING_TXN: Before officially starting to generate materialized view data, the system will wait for the ongoing import transactions on the current table to complete. The TransactionId field indicates the ID of the transaction currently being waited for. The job will actually start once all imports with transaction IDs prior to this one have been completed.

- RUNNING: The job is currently in progress.

- FINISHED: The job has been successfully completed.

- CANCELLED: The job failed to run.

## Access Control Requirements

The user who executes this SQL must have at least the following permissions:

| Privilege  | Object | Notes |
|------------|--------|----|
| ALTER_PRIV | table  |    |

## Examples

1. View materialized view jobs under the database example_db.

   ```sql
   SHOW ALTER TABLE MATERIALIZED VIEW FROM example_db;
   ```

