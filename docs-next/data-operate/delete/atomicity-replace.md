---
{
    "title": "Atomic Table Replacement",
    "language": "en",
    "description": "Doris atomic table replacement: rewrite or swap an entire OLAP table in one step using ALTER TABLE REPLACE WITH TABLE, avoiding any data-availability gap.",
    "keywords": [
        "Doris atomic table replacement",
        "ALTER TABLE REPLACE WITH TABLE",
        "OLAP full-table rewrite",
        "swap parameter",
        "table data swap",
        "rewrite without downtime"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Full-table rewrite / table data swap / data update without downtime -->

Doris supports atomic replacement between two OLAP tables. A single `ALTER TABLE` statement performs a table-name swap or a full-table replacement, avoiding the query-availability gap that comes with the traditional "drop first, then load" approach.

## Applicable scenarios

When a workload needs to rewrite all data in a table without exposing an intermediate "empty data" state, use atomic table replacement.

| Scenario | Recommended approach |
| :--- | :--- |
| Full-table rewrite (such as offline full backfill) | Use `CREATE TABLE LIKE` to create a new table, load the new data, and atomically replace the old table |
| Replace only a specific partition | See [Temporary Partition](../delete/table-temp-partition) |
| Keep the old table for rollback | Use `swap = true`. The old table data is moved under the new table name |
| No need to keep the old table after replacement | Use `swap = false`. The old table is deleted directly |

## Operational steps

<!-- Knowledge type: Operational steps -->

Take "replacing the old table `tbl1` with new data" as an example. The standard procedure is:

1. Create a new table based on the schema of the old table:

    ```sql
    CREATE TABLE tbl2 LIKE tbl1;
    ```

2. Load the new data into the new table `tbl2`.
3. Run the atomic replacement:

    ```sql
    ALTER TABLE tbl1 REPLACE WITH TABLE tbl2
    [PROPERTIES('swap' = 'true')];
    ```

4. Confirm the result based on the `swap` parameter (see below for details).

## Syntax

```sql
ALTER TABLE [db.]tbl1 REPLACE WITH TABLE tbl2
[PROPERTIES('swap' = 'true')];
```

Meaning: replace table `tbl1` with table `tbl2`. The `swap` parameter controls how the old table is handled after replacement.

### Behavior of the swap parameter

| swap value | Data of tbl1 after replacement | State of tbl2 after replacement | Typical use |
| :--- | :--- | :--- | :--- |
| `true` (default) | The original data of tbl2 | Retained, and contains the original data of tbl1 (the two tables are swapped) | Keep the old data for rollback or comparison |
| `false` | The original data of tbl2 | Deleted and unrecoverable | Only the new data is needed; the old table can be discarded |

## How it works

Atomic replacement merges several DDL steps into one atomic operation. Externally, it appears as an instantaneous switch.

- When `swap = true`:

    1. Rename table B to table A.
    2. Rename table A to table B.

- When `swap = false`:

    1. Drop table A.
    2. Rename table B to table A.

Because these steps run as an atomic transaction at the metadata layer, external queries do not observe any intermediate state.

## Notes

- Replacement is supported only between two **OLAP tables**. Other table types are not supported.
- The system **does not validate that the two tables have identical schemas**. You must ensure schema compatibility yourself.
- When `swap = false`, the replaced old table is dropped directly and **cannot be recovered**. Use this option with care.
- Replacement **does not change permission settings**, because permissions are checked by table name. After replacement, the new table automatically inherits the permissions associated with the original table name.

## FAQ

**Q1: Are queries that are already running during the replacement affected?**

A: Replacement is an atomic operation at the metadata layer. Queries that have already been issued complete on the original table data; new queries hit the data after replacement.

**Q2: Can two tables with different columns, indexes, or partitions be replaced?**

A: Yes. The system does not validate schema consistency, but you should keep schemas compatible. Otherwise, downstream queries and applications may fail because of column-name or type changes.

**Q3: Can the original table data be recovered after replacement?**

A: When `swap = true`, the original table data is preserved under the original `tbl2` name and can be recovered. When `swap = false`, the original table has been dropped and cannot be recovered.

**Q4: Can atomic replacement be used on partitions?**

A: Yes. Use the [Temporary Partition](../delete/table-temp-partition) feature for partition-level atomic overwrite.

## Related documents

- [Temporary Partition](../delete/table-temp-partition): partition-level atomic overwrite
- `CREATE TABLE LIKE`: quickly create a new table based on an existing table schema
