---
{
    "title": "Restore from Recycle Bin",
    "language": "en",
    "description": "Use the Doris recycle bin to recover databases, tables, or partitions accidentally removed by DROP and avoid data loss. This page covers the full query and restore procedure.",
    "keywords": [
        "Doris recycle bin",
        "data recovery",
        "accidental deletion recovery",
        "RECOVER",
        "SHOW CATALOG RECYCLE BIN",
        "DROP DATABASE recovery",
        "DROP TABLE recovery",
        "DROP PARTITION recovery",
        "DROP FORCE",
        "recycle bin",
        "data recovery",
        "database accidental deletion",
        "partition recovery"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Database / table / partition accidental-deletion recovery / disaster recovery -->

To prevent data disasters caused by accidental operations, Doris provides a recycle bin that supports recovering databases, tables, and partitions that were unintentionally dropped.

When you run `DROP DATABASE/TABLE/PARTITION` without the `FORCE` keyword, Doris does not physically delete the data immediately. Instead, it moves the database, table, or partition to the recycle bin. You can later use the `RECOVER` command to restore the object and make it visible again.

:::warning Note
If you run `DROP ... FORCE`, the data is physically deleted immediately and cannot be restored from the recycle bin.
:::

## Applicable Scenarios

| Scenario | Recoverable | Recommended Action |
| --- | --- | --- |
| Accidentally ran `DROP DATABASE example_db` | Yes | `RECOVER DATABASE example_db` |
| Accidentally ran `DROP TABLE example_db.example_tbl` | Yes | `RECOVER TABLE example_db.example_tbl` |
| Accidentally ran `ALTER TABLE ... DROP PARTITION p1` | Yes | `RECOVER PARTITION p1 FROM example_tbl` |
| Accidentally ran `DROP ... FORCE` | No | Restore from backup |

## Prerequisites

- The current user has the required privileges, such as `ALTER_PRIV`, on the object to be recovered.
- The `DROP` command was executed without `FORCE`.
- The object in the recycle bin has not been manually purged (see [DROP-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/DROP-CATALOG-RECYCLE-BIN)).

## Recovery Workflow Overview

1. Run `SHOW CATALOG RECYCLE BIN` to query recoverable objects in the recycle bin.
2. Choose the matching `RECOVER` command based on the object type (DATABASE / TABLE / PARTITION).
3. After recovery, verify that the object is visible again and the data is intact.

## Query the Recycle Bin

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Confirm that the target object exists in the recycle bin before recovery -->

Before running a recovery operation, confirm that the target object is still in the recycle bin.

```sql
SHOW CATALOG RECYCLE BIN [WHERE NAME [= "name" | LIKE "name_matcher"]];
```

Parameter description:

| Parameter | Description |
| --- | --- |
| `NAME = "name"` | Filter recycle bin objects by exact name |
| `NAME LIKE "name_matcher"` | Filter recycle bin objects by wildcard pattern (supports `%` and `_`) |

For more detailed syntax and best practices, see the [SHOW-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN) command manual. You can also run `HELP SHOW CATALOG RECYCLE BIN` in the MySQL client command line for more help.

## Perform Data Recovery

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data restoration after database / table / partition accidental deletion -->

Choose one of the following commands based on the type of object to recover.

### Recover a Database

Recover the database named `example_db`:

```sql
RECOVER DATABASE example_db;
```

### Recover a Table

Recover the table named `example_tbl` in `example_db`:

```sql
RECOVER TABLE example_db.example_tbl;
```

### Recover a Partition

Recover partition `p1` in the `example_tbl` table:

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

For more detailed `RECOVER` syntax and best practices, see the [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER) command manual. You can also run `HELP RECOVER` in the MySQL client command line for more help.

## FAQ

### Q: What if `RECOVER` reports that the object does not exist?

The object was dropped with `DROP ... FORCE`, so it did not enter the recycle bin and cannot be restored from there. Restore the data from a backup.

### Q: What if `SHOW CATALOG RECYCLE BIN` does not return the target object?

The object has already been purged by `DROP CATALOG RECYCLE BIN` and cannot be recovered. Restore the data from a backup.

### Q: What if recovery reports a permission error?

The current user lacks the required privileges. Have a user with the proper privileges grant the privileges or perform the recovery on your behalf.

### Q: What if no data is returned after recovery?

A new object with the same name has been created and overrides the recovered one. `RENAME` or drop the new object first, then run the recovery again.
