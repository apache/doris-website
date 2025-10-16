---
{
   "title": "RECOVER",
   "language": "en"
}
---

## Description

This statement is used to recover previously deleted databases, tables, or partitions.

It supports recovering specified metadata by name or ID and allows renaming the recovered metadata.

## Syntax:

```sql
RECOVER { DATABASE <db_name> [<db_id>] [AS <new_db_name>] 
        | TABLE [<db_name>.]<table_name> [<table_id>] [AS <new_table_name>] 
        | PARTITION <partition_name> [<partition_id>] FROM [<db_name>.]<table_name> [AS <new_partition_name>] }
```

## Required Parameters

Recover a database

**1. `<db_name>`**
> The name of the database to recover.

Recover a table

**1. `<table_name>`**
> The name of the table to recover.

Recover a partition

**1. `<partition_name>`**
> The name of the partition to recover.

**2. `<table_name>`**
> The name of the table where the partition resides.

## Optional Parameters

Recover a database

**1. `<db_id>`**
> The ID of the database to recover.

**2. `<new_db_name>`**
> The new name of the recovered database.

Recover a table

**1. `<db_name>`**
> The name of the database where the table resides.

**2. `<table_id>`**
> The ID of the table to recover.

**3. `<new_table_name>`**
> The new name of the recovered table.

Recover a partition

**1. `<partition_id>`**
> The ID of the partition to recover.

**2. `<db_name>`**
> The name of the database where the table resides.

**3. `<new_partition_name>`**
> The new name of the recovered partition.

## Access Control Requirements

| Privilege   | Object | Note |
|-------------|--------|------|
| ADMIN_PRIV  |        |      |

## Usage Notes

- This operation can only recover metadata deleted within a certain period. The default is 1 day (configurable via the `catalog_trash_expire_second` parameter in `fe.conf`).
- If no ID is specified when recovering metadata, the last deleted metadata with the same name is recovered by default.
- You can query the currently recoverable metadata using `SHOW CATALOG RECYCLE BIN`.

## Examples

1. Recover a database named `example_db`

    ```sql
    RECOVER DATABASE example_db;
    ```

2. Recover a table named `example_tbl`

    ```sql
    RECOVER TABLE example_db.example_tbl;
    ```

3. Recover a partition named `p1` from the table `example_tbl`

    ```sql
    RECOVER PARTITION p1 FROM example_tbl;
    ```

4. Recover a database with ID `example_db_id` and name `example_db`

    ```sql
    RECOVER DATABASE example_db example_db_id;
    ```

5. Recover a table with ID `example_tbl_id` and name `example_tbl`

    ```sql
    RECOVER TABLE example_db.example_tbl example_tbl_id;
    ```

6. Recover a partition with ID `p1_id` and name `p1` from the table `example_tbl`

    ```sql
    RECOVER PARTITION p1 p1_id FROM example_tbl;
    ```

7. Recover a database with ID `example_db_id` and name `example_db`, and rename it to `new_example_db`

    ```sql
    RECOVER DATABASE example_db example_db_id AS new_example_db;
    ```

8. Recover a table named `example_tbl` and rename it to `new_example_tbl`

    ```sql
    RECOVER TABLE example_db.example_tbl AS new_example_tbl;
    ```

9. Recover a partition with ID `p1_id` and name `p1` from the table `example_tbl`, and rename it to `new_p1`

    ```sql
    RECOVER PARTITION p1 p1_id AS new_p1 FROM example_tbl;
    ```