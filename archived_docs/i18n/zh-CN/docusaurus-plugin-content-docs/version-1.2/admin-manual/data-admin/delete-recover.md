---
{
    "title": "数据删除恢复",
    "language": "zh-CN"
}
---

# 数据删除恢复

Doris为了避免误操作造成的灾难，支持对误删除的数据库/表/分区进行数据恢复，在drop table或者 drop database之后，Doris不会立刻对数据进行物理删除，而是在 Trash 中保留一段时间（默认1天，可通过fe.conf中`catalog_trash_expire_second`参数配置），管理员可以通过RECOVER命令对误删除的数据进行恢复。

## 开始数据恢复

1.恢复名为 example_db 的 database

```sql
RECOVER DATABASE example_db;
```

2.恢复名为 example_tbl 的 table

```sql
RECOVER TABLE example_db.example_tbl;
```

3.恢复表 example_tbl 中名为 p1 的 partition

```sql
RECOVER PARTITION p1 FROM example_tbl;
```

## 更多帮助

关于 RECOVER 使用的更多详细语法及最佳实践，请参阅 [RECOVER](../../sql-manual/sql-reference/Database-Administration-Statements/RECOVER.md) 命令手册，你也可以在 MySql 客户端命令行下输入 `HELP RECOVER` 获取更多帮助信息。
