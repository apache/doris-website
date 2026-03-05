---
{
    "title": "Recover from Recycle Bin",
    "language": "en",
    "description": "To avoid disasters caused by accidental operations, Doris supports the recovery of accidentally deleted databases, tables, and partitions."
}
---

## Recover from Recycle Bin

To avoid disasters caused by accidental operations, Doris supports the recovery of accidentally deleted databases, tables, and partitions. After deleting a table or database, Doris does not immediately physically delete the data. When the user executes the `DROP DATABASE/TABLE/PARTITION` command without using `FORCE`, Doris moves the deleted database, table, or partition to the recycle bin. The `RECOVER` command can be used to restore all data of the deleted database, table, or partition from the recycle bin, making it visible again. 

**Note:** If the deletion was performed using `DROP FORCE`, the data will be immediately deleted and cannot be recovered.

### Query Recycle Bin

You can query the Recycle Bin with the following command:

```sql
SHOW CATALOG RECYCLE BIN [WHERE NAME [= "name" | LIKE "name_matcher"]];
```

For more detailed syntax and best practices, please refer to the [SHOW-CATALOG-RECYCLE-BIN](../../sql-manual/sql-statements/recycle/SHOW-CATALOG-RECYCLE-BIN) command manual, You can also type `help SHOW CATALOG RECYCLE BIN` on the MySql client command line for more help.


### Start Data Recovery

To recover deleted data, you can use the following commands:

1. *Recover the database* named `example_db`:

```sql
RECOVER DATABASE example_db;
```

2. *Recover the table* named `example_tbl`:

```sql
RECOVER TABLE example_db.example_tbl;
```

3. *Recover partition* named p1 in table example_tbl:

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

For more detailed syntax and best practices used by RECOVER, please refer to the [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER) command manual, You can also type `HELP RECOVER` on the MySql client command line for more help.
