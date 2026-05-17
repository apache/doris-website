---
{
    "title": "Truncate Operation",
    "language": "en",
    "description": "How does Doris TRUNCATE quickly clear table or partition data? This article explains the syntax, parameters, applicable scenarios, usage constraints, data recovery, and a comparison with DELETE.",
    "keywords": [
        "Doris TRUNCATE",
        "clear table data",
        "clear partition data",
        "TRUNCATE TABLE",
        "TRUNCATE PARTITION",
        "FORCE truncate",
        "data recovery RECOVER"
    ]
}
---

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Data cleanup / Test environment reset / Partition data rebuild -->

`TRUNCATE` clears all data in a specified table or partition in one operation, retaining only the table structure and partition definition. Compared with `DELETE`, it does not produce delete versions, so it does not affect subsequent query performance, making it the preferred choice for large-scale cleanup scenarios.

## Quick Navigation

- [When to choose TRUNCATE](#when-to-choose-truncate): Typical applicable scenarios
- [Syntax and parameters](#syntax-and-parameters): Command format description
- [Usage examples](#usage-examples): Common operation demonstrations
- [Usage constraints](#usage-constraints): Restrictions you must know before execution
- [Data recovery](#data-recovery): How to recover from accidental operations
- [TRUNCATE vs DELETE](#truncate-vs-delete): Selection comparison
- [FAQ](#faq): Frequently asked questions

## When to Choose TRUNCATE

`TRUNCATE` is suitable for scenarios that require clearing large amounts of data at once:

- **Test environment reset**: Clear test data in preparation for re-importing.
- **Partition data rebuild**: Clear specified partitions and then rewrite corrected data.
- **Large-scale data cleanup**: Compared with `DELETE`, no version accumulation occurs and query performance is not affected.
- **Cleanup after historical data archiving**: Clear the original table or partition after archiving is complete.

## Syntax and Parameters

### Command Format

```sql
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)] [FORCE];
```

### Parameter Description

| Parameter       | Required | Description                                                                          |
| --------------- | -------- | ------------------------------------------------------------------------------------ |
| `db.`           | No       | Database name. The current database is used when omitted.                            |
| `tbl`           | Yes      | Name of the table to be cleared.                                                     |
| `PARTITION(..)` | No       | Specifies a list of partition names; only these partitions are cleared. When omitted, the entire table is cleared. |
| `FORCE`         | No       | Physically deletes data directly. **Cannot be recovered via RECOVER.** Use with caution. |

## Usage Examples

### 1. Clear an Entire Table

Clear all data in the `tbl` table under `example_db`:

```sql
TRUNCATE TABLE example_db.tbl;
```

### 2. Clear Specified Partitions

Clear only the `p1` and `p2` partitions of the `tbl` table:

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

### 3. Force Clear (Non-Recoverable)

Physically delete the data of `example_db.tbl` directly, bypassing the recycle bin:

```sql
TRUNCATE TABLE example_db.tbl FORCE;
```

:::caution
After using `FORCE`, data cannot be recovered via `RECOVER`. Confirm before executing.
:::

## Usage Constraints

Before executing `TRUNCATE`, confirm the following conditions:

- **Only data is cleared, structure is retained**: The table structure and partition definitions are retained; only data is cleared.
- **Filter conditions are not supported**: You can only clear the entire table or specified partitions. `WHERE` conditions cannot be appended.
- **Table state must be NORMAL**: A table that is performing `SCHEMA CHANGE` cannot be truncated.
- **Affects ongoing imports**: May cause running import tasks to fail. Execute during idle import periods.
- **Recoverable by default**: When `FORCE` is not used, data can be recovered within the retention period via [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER).

## Data Recovery

When `TRUNCATE` is executed without `FORCE`, the cleared data enters the recycle bin and can be recovered within the retention period:

```sql
RECOVER TABLE [db_name.]table_name;
```

For details, see the [RECOVER statement description](../../sql-manual/sql-statements/recycle/RECOVER).

:::tip
The recycle bin retention duration is controlled by the FE configuration item `catalog_trash_expire_second`. Expired data is permanently cleaned up.
:::

## TRUNCATE vs DELETE

Both can be used to delete data, but their applicable scenarios differ significantly:

| Comparison Item              | TRUNCATE                              | DELETE                                                          |
| ---------------------------- | ------------------------------------- | --------------------------------------------------------------- |
| Deletion granularity         | Entire table or entire partition      | Row-level, with optional `WHERE` conditions                     |
| Filtering supported          | No                                    | Yes                                                             |
| Query performance impact     | None                                  | Produces delete versions, affecting query performance           |
| Execution speed              | Extremely fast (metadata-level operation) | Related to the number of matched rows                       |
| Recoverable by default       | Recoverable via `RECOVER` (non-FORCE) | Not directly recoverable                                        |
| Typical scenarios            | Large-scale clearing, partition rebuild | Precise deletion of small amounts of data                     |

**Selection recommendations**:

- To clear an entire table or an entire partition, prefer `TRUNCATE`.
- To delete part of the data based on conditions, use `DELETE`.

## FAQ

### Does TRUNCATE delete the table structure?

No. `TRUNCATE` only clears data. The table structure, partition definitions, indexes, and other metadata are all retained.

### Can data be recovered after TRUNCATE?

- **Without `FORCE`**: Recoverable via `RECOVER` within the retention period.
- **With `FORCE`**: Data is physically deleted and cannot be recovered.

### Can TRUNCATE be performed while a table is undergoing SCHEMA CHANGE?

No. The table state must be `NORMAL`; otherwise, the command reports an error. Wait for SCHEMA CHANGE to complete before executing.

### Does TRUNCATE affect ongoing import tasks?

It may cause ongoing import tasks to fail. Execute during idle import periods, or pause related imports first.

### What is the difference between TRUNCATE and DROP TABLE?

- `TRUNCATE`: Retains the table structure and only clears data.
- `DROP TABLE`: Deletes the table itself, including its structure and data.

### Can only part of the data in a partition be cleared?

No. `TRUNCATE` can only clear an entire table or specified partitions; it does not support row-level filtering. To delete by condition, use [DELETE](./delete-manual).

## Related Documents

- [RECOVER statement](../../sql-manual/sql-statements/recycle/RECOVER): Recover cleared data.
- [DELETE operation](./delete-manual): Delete data based on conditions.
