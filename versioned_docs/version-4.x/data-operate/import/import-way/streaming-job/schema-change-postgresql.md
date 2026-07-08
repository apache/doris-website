---
{
    "title": "PostgreSQL Schema Change Sync",
    "language": "en",
    "sidebar_label": "Schema Change Sync",
    "description": "Describes the supported schema changes and synchronization behavior of PostgreSQL CDC Auto Table Creation Sync.",
    "keywords": [
        "PostgreSQL Schema Change",
        "PostgreSQL CDC",
        "Auto Table Creation Sync",
        "Continuous Load",
        "Streaming Job",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during PostgreSQL Auto Table Creation Sync -->

PostgreSQL Schema Change Sync automatically applies upstream PostgreSQL column changes to Doris during continuous load. This capability applies only to [PostgreSQL CDC with Auto Table Creation](./continuous-load-postgresql-database.md). It is not supported by [PostgreSQL CDC with SQL Mapping](./continuous-load-postgresql-table.md).

:::tip

PostgreSQL Schema Change Sync is supported from Doris 4.1.0.

:::

## Supported Schema Changes

| PostgreSQL operation | Doris behavior |
| --- | --- |
| `ADD COLUMN` | Adds a column with the same name and a type defined by the [PostgreSQL Data Type Mapping](./data-type-mapping-postgresql.md). DEFAULT and `NOT NULL` constraints are not copied, and historical rows are not backfilled. Subsequent rows use the actual values written by PostgreSQL to WAL. |
| `DROP COLUMN` | Drops the column with the same name. |

## Considerations

- A PostgreSQL schema change does not propagate immediately when only the DDL is executed. Doris detects and applies the new schema after the changed table receives a subsequent INSERT, UPDATE, or DELETE.
- Automatic schema change synchronization is not supported during the full snapshot phase. Perform upstream schema changes after the full snapshot completes and the job enters the incremental phase.
- If an added column already exists or a dropped column does not exist, Doris skips the operation so that a retry does not fail the job.
- If one schema change adds and drops columns at the same time, Doris treats it as a possible column rename and does not automatically change the target table. This prevents accidental data loss.
- Column renames, column type changes, DEFAULT changes, and `NULL` / `NOT NULL` constraint changes are not synchronized automatically. Pause the continuous load job, change the Doris target table manually, verify that both schemas are compatible, and then resume the job.

## Related Docs

- [PostgreSQL CDC with Auto Table Creation](./continuous-load-postgresql-database.md)
- [PostgreSQL Data Type Mapping](./data-type-mapping-postgresql.md)
- [Continuous Load Overview](./continuous-load-overview.md)
