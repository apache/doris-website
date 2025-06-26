---
{
    "title": "Deleting Data with TRUNCATE Command",
    "language": "en"
}
---

# Truncate

This statement is used to clear the data of a specified table or partition in Doris

## Syntax

```SQL
TRUNCATE TABLE [db.]tbl[ PARTITION(p1, p2, ...)];
```

- This statement only clears the data within a table or partition but preserves the table or partition itself.
- Unlike DELETE, this statement can only clear the specified table or partition as a whole and cannot be added with filter conditions.
- Unlike DELETE, truncating data will not affect query performance.
- The data deleted by this operation can be recovered through the RECOVER statement(for a period of time). See [RECOVER](../../../../sql-manual/sql-statements/Database-Administration-Statements/RECOVER) statement for details. If you execute command with FORCE, the data will be deleted directly and cannot be recovered, this operation is generally not recommended.
- When using this command, the table status must be NORMAL, which means that tables undergoing SCHEMA CHANGE can not be truncated.
- This command may cause ongoing imports to fail.

## Example

1. Truncate the table `tbl` under `example_db`.

```SQL
TRUNCATE TABLE example_db.tbl;
```

2. Truncate partitions `p1` and `p2` of table `tbl`.

```SQL
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

