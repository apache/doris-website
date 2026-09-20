---
{
    "title": "MySQL Schema Change Sync",
    "language": "en",
    "sidebar_label": "Schema Change Sync",
    "description": "Describes the supported schema changes and synchronization behavior of MySQL CDC Auto Table Creation Sync.",
    "keywords": [
        "MySQL Schema Change",
        "MySQL CDC",
        "Auto Table Creation Sync",
        "Continuous Load",
        "Streaming Job",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during MySQL Auto Table Creation Sync -->

MySQL Schema Change Sync automatically applies upstream MySQL column changes to Doris during continuous load. This capability applies only to [MySQL CDC with Auto Table Creation](./continuous-load-mysql-database.md). It is not supported by [MySQL CDC with SQL Mapping](./continuous-load-mysql-table.md).

:::tip

MySQL Schema Change Sync is supported from Doris 4.1.4.

:::

## Supported Schema Changes

| MySQL operation | Doris behavior |
| --- | --- |
| `ADD COLUMN` | Adds a column with the same name and a type defined by the [MySQL Data Type Mapping](./data-type-mapping-mysql.md), and copies the column comment. DEFAULT and `NOT NULL` constraints are not copied, and historical rows are not backfilled. Subsequent rows use the actual values written by MySQL to the binlog. |
| `DROP COLUMN` | Drops the column with the same name. |

## Considerations

- If an added column already exists or a dropped column does not exist, Doris skips the operation so that a retry does not fail the job.
- Column positions specified by `FIRST` and `AFTER` are not synchronized to Doris. New columns are appended after the existing Doris columns.
- `CHANGE COLUMN`, `MODIFY COLUMN`, `RENAME COLUMN`, DEFAULT changes, and `NULL` / `NOT NULL` constraint changes are not synchronized automatically. Before performing these operations, pause the continuous load job, change the Doris target table manually, verify that both schemas are compatible, and then resume the job.
- Primary key, index, partition, table name, and other table-level schema changes are not synchronized automatically.
- You can disable automatic schema change synchronization with the Job property `schema_change_enabled` (default `true`, supported since version 4.1.4). The `cdc_stream()` table function (SQL Mapping Sync) always forces this property to `false`.

## Related Docs

- [MySQL CDC with Auto Table Creation](./continuous-load-mysql-database.md)
- [MySQL Data Type Mapping](./data-type-mapping-mysql.md)
- [Continuous Load Overview](./continuous-load-overview.md)
