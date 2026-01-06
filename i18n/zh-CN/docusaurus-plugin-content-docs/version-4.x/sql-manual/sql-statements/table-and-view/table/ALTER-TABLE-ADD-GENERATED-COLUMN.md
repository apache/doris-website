---
{
    "title": "ALTER TABLE ADD GENERATED COLUMN",
    "language": "zh-CN",
    "description": "不支持使用 ALTER TABLE ADD COLUMN 增加一个生成列，不支持使用 ALTER TABLE MODIFY COLUMN 修改生成列信息。支持使用 ALTER TABLE 对生成列顺序进行修改，修改生成列名称和删除生成列。"
}
---

## ALTER TABLE 和生成列

不支持使用 ALTER TABLE ADD COLUMN 增加一个生成列，不支持使用 ALTER TABLE MODIFY COLUMN 修改生成列信息。支持使用 ALTER TABLE 对生成列顺序进行修改，修改生成列名称和删除生成列。

不支持的场景报错如下：

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

注意：
修改后的列顺序仍然需要满足生成列建表时的顺序限制。
### RENAME COLUMN

```sql
ALTER TABLE products RENAME COLUMN total_value new_name;
```

注意：
如果表中某列（生成列或者普通列）被其它生成列引用，需要先删除其它生成列后，才能修改此生成列的名称。
### DROP COLUMN

```sql
ALTER TABLE products DROP COLUMN total_value;
```

注意：
如果表中某列（生成列或者普通列）被其它生成列引用，需要先删除其它生成列后，才能删除此被引用的生成列或者普通列。
