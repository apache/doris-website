---
{
  "title": "ALTER TABLE ADD GENERATED COLUMN",
  "language": "en"
}
---

The ALTER TABLE ADD COLUMN is not supported for adding a generated column, and the ALTER TABLE MODIFY COLUMN is not supported for modifying generated column information.
The ALTER TABLE syntax is supported for modifying the order of generated columns, modifying the names of generated columns, and deleting generated columns.

The following error is reported for unsupported scenarios:

```sql
mysql> CREATE TABLE test_alter_add_column(a int, b int) properties("replication_num"="1");
Query OK, 0 rows affected (0.14 sec)
mysql> ALTER TABLE test_alter_add_column ADD COLUMN c int AS (a+b);
ERROR 1105 (HY000): errCode = 2, detailMessage = Not supporting alter table add generated columns.
mysql> ALTER TABLE test_alter MODIFY COLUMN c int KEY AS (a+b+1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Not supporting alter table modify generated columns.
```

### REORDER COLUMN

```sql
ALTER TABLE products ORDER BY (product_id, total_value, price, quantity);
```

Note:
The modified column order still needs to meet the order restrictions when generating columns and creating tables.
### RENAME COLUMN

```sql
ALTER TABLE products RENAME COLUMN total_value new_name;
```

Note:
If a column in a table (generated column or common column) is referenced by other generated columns, you need to delete the other generated columns before you can modify the name of this generated column.
### DROP COLUMN

```sql
ALTER TABLE products DROP COLUMN total_value;
```

Note:
If a column in a table (generated column or ordinary column) is referenced by other generated columns, you need to delete the other generated columns first before deleting the referenced generated column or ordinary column.
