---
{
    "title": "Deleting Data with TRUNCATE Command",
    "language": "en",
    "description": "Use this statement to clear data from a specified table and its partitions."
}
---

# Truncate

Use this statement to clear data from a specified table and its partitions.

## Syntax

```SQL
TRUNCATE TABLE [db.]tbl[ PARTITION(p1, p2, ...)] FORCE?;
```

- This statement only clears the data within a table or partition but preserves the table or partition itself.
- Unlike DELETE, this statement can only clear the specified table or partition as a whole and cannot be added with filter conditions.
- Unlike DELETE, truncating data will not affect query performance.
- The data deleted by this operation can be recovered through the RECOVER statement(for a period of time). See [RECOVER](../../../../sql-manual/sql-statements/Database-Administration-Statements/RECOVER) statement for details. If you execute command with FORCE, the data will be deleted directly and cannot be recovered, this operation is generally not recommended.
- When using this command, the table status must be NORMAL, which means that tables undergoing SCHEMA CHANGE can not be truncated.
- This command may cause ongoing imports to fail.

- The table status must be NORMAL, and there should be no ongoing SCHEMA CHANGE operations.

- This command may cause ongoing import tasks to fail.

## Examples

**1. Clear the table `tbl` in the `example_db` database**

```sql
TRUNCATE TABLE example_db.tbl;
```

**2. Clear the `p1` and `p2` partitions of the table `tbl`**

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

3. Truncate the table `tbl` under `example_db` FORCE.

```SQL
TRUNCATE TABLE example_db.tbl FORCE;
```
