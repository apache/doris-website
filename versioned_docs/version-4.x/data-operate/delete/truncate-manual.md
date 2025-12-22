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
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)];
```

- This statement clears the data but retains the table or partition structure.

- Unlike DELETE, TRUNCATE only performs metadata operations, making it faster and not affecting query performance.

- Data removed by this operation cannot be recovered.

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
