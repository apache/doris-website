---
{
    "title": "OceanBase Schema Change Sync",
    "language": "en",
    "sidebar_label": "Schema Change Sync",
    "description": "Learn which OceanBase schema changes are supported by CDC Auto Table Creation Sync, how Doris applies them, and their limitations.",
    "keywords": [
        "OceanBase Schema Change",
        "OceanBase CDC",
        "Auto Table Creation Sync",
        "continuous load",
        "ADD COLUMN",
        "DROP COLUMN"
    ]
}
---

<!-- Knowledge type: Concept -->
<!-- Applicable scenario: Upstream schema changes during OceanBase Auto Table Creation Sync -->

OceanBase Schema Change Sync automatically applies upstream column changes to Doris target tables during continuous load. This capability applies only to [OceanBase CDC with Auto Table Creation](./continuous-load-oceanbase-database.md).

:::caution Experimental feature

OceanBase Schema Change Sync is available as an experimental feature starting from Doris 4.1.4 and supports only MySQL compatibility mode.

:::

OceanBase uses the MySQL CDC schema change processing path, so its supported changes and behavior are the same as for MySQL.

## Supported Schema Changes

| OceanBase operation | Doris behavior |
| --- | --- |
| `ADD COLUMN` | Adds a column with the same name and a type defined by [OceanBase Data Type Mapping](./data-type-mapping-oceanbase.md), and copies the column comment. DEFAULT and `NOT NULL` constraints are not copied, and historical rows are not backfilled. Subsequent rows use the actual values written by OceanBase to the binlog. |
| `DROP COLUMN` | Drops the column with the same name. |

## Considerations

- If an added column already exists or a dropped column does not exist, Doris skips the operation so that retries do not fail the job.
- Column positions specified by `FIRST` and `AFTER` are not synchronized to Doris. New columns are appended after existing Doris columns.
- `CHANGE COLUMN`, `MODIFY COLUMN`, `RENAME COLUMN`, DEFAULT changes, and `NULL` / `NOT NULL` constraint changes are not synchronized automatically.
- Primary key, index, partition, table name, and other table-level schema changes are not synchronized automatically.
- Before an unsupported schema change, pause the continuous load job, change the Doris target table manually, verify that both schemas are compatible, and then resume the job.
- Auto Table Creation Sync enables Schema Change Sync by default. Doris currently does not provide a SQL property to disable it.

## Example

Add a column to an OceanBase source table:

```sql
ALTER TABLE source_db.users ADD COLUMN city VARCHAR(50);
INSERT INTO source_db.users VALUES (2, 'Alice', 'Hangzhou');
```

After the job processes the incremental data, the `city` column appears in the Doris target table:

```sql
DESC target_db.users;
```

```text
+-------+--------------+------+-------+---------+-------+
| Field | Type         | Null | Key   | Default | Extra |
+-------+--------------+------+-------+---------+-------+
| id    | int          | No   | true  | NULL    |       |
| name  | varchar(100) | Yes  | false | NULL    | NONE  |
| city  | varchar(50)  | Yes  | false | NULL    | NONE  |
+-------+--------------+------+-------+---------+-------+
```

## Related Documents

- [OceanBase CDC with Auto Table Creation](./continuous-load-oceanbase-database.md)
- [OceanBase Data Type Mapping](./data-type-mapping-oceanbase.md)
- [Continuous Load Overview](./continuous-load-overview.md)
