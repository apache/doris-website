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

```sql
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)] [FORCE];
```

- This statement only clears the data within a table or partition but preserves the table or partition itself.
- Unlike DELETE, this statement can only clear the specified table or partition as a whole and cannot be added with filter conditions.
- Unlike DELETE, truncating data will not affect query performance.
- The data deleted by this operation can be recovered through the RECOVER statement (for a period of time). See [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER) statement for details. If you execute the command with FORCE, the data will be deleted directly and cannot be recovered. This operation is generally not recommended.
- When using this command, the table status must be NORMAL, which means that tables undergoing SCHEMA CHANGE cannot be truncated.
- This command may cause ongoing imports to fail.

## Examples

**1. Clear the table `tbl` in the `example_db` database**

```sql
TRUNCATE TABLE example_db.tbl;
```

**2. Clear the `p1` and `p2` partitions of the table `tbl`**

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```

**3. Clear the table `tbl` in the `example_db` database with FORCE**

```sql
TRUNCATE TABLE example_db.tbl FORCE;
```
