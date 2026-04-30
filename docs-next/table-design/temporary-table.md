---
{
    "title": "Temporary Table",
    "language": "en",
    "description": "A Doris temporary table is a session-scoped materialized internal table used to break down complex SQL queries and store intermediate computation results. It is automatically dropped when the session ends, with no manual cleanup required."
}
---

<!-- Knowledge type: Feature -->
<!-- Applicable scenarios: Complex SQL decomposition / Intermediate result staging / Data debugging -->

When working on complex data processing tasks, an effective strategy is to break a large SQL query into multiple steps and temporarily save the result of each step as a materialized table. This approach significantly reduces the complexity of SQL queries and improves the debuggability of the data. However, materialized tables must be cleaned up manually after they have served their purpose. If you choose to use non-materialized temporary tables, Doris currently only supports defining them through the `WITH` clause.

To address these issues, Doris introduces the **Temporary Table** feature. A temporary table is a transiently existing materialized internal table. It simplifies the storage and management of temporary data during complex data processing while further enhancing the flexibility and safety of data processing.

## Core Features

| Feature | Description |
| --- | --- |
| **Session-bound** | A temporary table only exists in the session that created it, and its lifecycle is tightly bound to the current session. When the session ends, all temporary tables created in that session are dropped automatically. |
| **Visible only within the session** | The visibility of a temporary table is strictly limited to the session that created it. Even another session started by the same user at the same time cannot access these temporary tables. |
| **Flexible naming** | The names of temporary tables are not subject to the uniqueness constraint. You can create temporary tables with the same name in different sessions, and you can also create a temporary table with the same name as another internal table. |

:::info Note
Like internal tables, a temporary table must be created under a Database within the Internal Catalog.

If a temporary table and a non-temporary table with the same name exist in the same Database, the temporary table has the highest access priority. Within that session, all queries and operations against tables with that name take effect on the temporary table only (with the exception of creating materialized views).
:::

## Applicable Scenarios

Temporary tables are suitable for the following data processing scenarios:

- **Complex SQL decomposition**: Break a large query into multiple steps and progressively materialize the intermediate results to reduce the complexity of a single SQL statement.
- **Intermediate result staging**: Store intermediate computation results during ETL, data exploration, or report development to avoid repeated computation.
- **Data debugging and verification**: Materialize the result of each step to make it easier to inspect and verify, improving debuggability.
- **Session-isolated data processing**: Scenarios where data needs to be visible within the session and reclaimed automatically when the session ends, avoiding pollution from leftover data.

## Usage

### Create a Temporary Table

Tables of any model can be defined as temporary tables, including the Unique, Aggregate, and Duplicate models. You can create a temporary table by adding the `TEMPORARY` keyword in the following SQL statements:

- [CREATE TABLE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)
- [CREATE TABLE AS SELECT](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)
- [CREATE TABLE LIKE](../sql-manual/sql-statements/table-and-view/table/CREATE-TABLE.md)

### Operate on a Temporary Table

Other usage of temporary tables is essentially the same as that of regular internal tables. Apart from the `CREATE` statements above, other DDL and DML statements do not require the `TEMPORARY` keyword.

## Limitations

- Temporary tables can only be created in the Internal Catalog.
- The ENGINE must be OLAP when creating the table.
- Modifying a temporary table with an Alter statement is not supported.
- Because of their transient nature, creating views and materialized views based on a temporary table is not supported.
- Backing up temporary tables is not supported, and synchronizing temporary tables via CCR / Sync Job is not supported.
- Export, Stream Load, Broker Load, S3 Load, Mysql Load, and Routine Load are not supported.
- When a temporary table is dropped, it is permanently deleted without going to the recycle bin.

