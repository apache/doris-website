---
{
    "title": "DROP CATALOG RECYCLE BIN",
    "language": "en"
}
---

## Description

This statement is used to immediately delete databases, tables, or partitions in the recycle bin.

## Syntax

```sql
DROP CATALOG RECYCLE BIN WHERE { 'DbId' = <db_id> | 'TableId' = <table_id> | 'PartitionId' = <partition_id> }
```

## Required Parameters

Delete a database by DbId

**1. `<db_id>`**
> The ID of the database to be immediately deleted.

Delete a table by TableId

**1. `<table_id>`**
> The ID of the table to be immediately deleted.

Delete a partition by PartitionId

**1. `<partition_id>`**
> The ID of the partition to be immediately deleted.

## Access Control Requirements

| Privilege   | Object | Note |
|-------------|--------|------|
| ADMIN_PRIV  |        |      |

## Usage Notes

- When deleting databases, tables, or partitions, the recycle bin will delete them after `catalog_trash_expire_second` seconds (set in `fe.conf`). This statement will delete them immediately.
- `'DbId'`, `'TableId'`, and `'PartitionId'` are case-insensitive and do not distinguish between single and double quotes.
- When deleting a database not in the recycle bin, all tables and partitions with the same `DbId` in the recycle bin will also be deleted. It will only report an error if nothing (database, table, or partition) is deleted. The same applies when deleting a table not in the recycle bin.
- You can query the currently deletable metadata using `SHOW CATALOG RECYCLE BIN`.

## Examples

1. Delete the database, tables, and partitions with DbId `example_db_id`

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'DbId' = example_db_id;
    ```

2. Delete the table and partitions with TableId `example_tbl_id`

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'TableId' = example_tbl_id;
    ```

3. Delete the partition with PartitionId `p1_id`

    ```sql
    DROP CATALOG RECYCLE BIN WHERE 'PartitionId' = p1_id;
    ```