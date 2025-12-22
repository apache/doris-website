---
{
    "title": "DROP CATALOG RECYCLE BIN",
    "language": "zh-CN",
    "description": "该语句用于立即删除回收站中的数据库、表或者分区。"
}
---

## 描述

该语句用于立即删除回收站中的数据库、表或者分区。

## 语法

```sql
DROP CATALOG RECYCLE BIN WHERE { 'DbId' = <db_id> | 'TableId' = <table_id> | 'PartitionId' = <partition_id> }
```

## 必选参数

根据 DbId 删除数据库

**1. `<db_id>`**
> 要立即删除的数据库的 ID。

根据 TableId 删除表

**1. `<table_id>`**
> 要立即删除的表的 ID。

3. 根据 PartitionId 删除分区

**1. `<partition_id>`**
> 要立即删除的分区的 ID。

## 权限控制

| 权限         | 对象 | 说明 |
|------------|----|----|
| ADMIN_PRIV |    |    |

## 注意事项

- 当删除数据库、表或者分区时，回收站会在 `catalog_trash_expire_second`秒后将其删除（在 `fe.conf` 中设置）。此语句将立即删除它们。
- `'DbId'`、 `'TableId'` 和 `'PartitionId'` 大小写不敏感且不区分单引号和双引号。
- 当删除不在回收站中的数据库时，也会删除回收站中具有相同 `DbId` 的所有表和分区。只有在没有删除任何内容（数据库、表或分区）的情况下，它才会报错。当删除不在回收站中的表时，处理方法类似。
- 可以通过 `SHOW CATALOG RECYCLE BIN` 来查询当前可删除的元信息。

## 示例

1. 删除 DbId 为 example_db_id 的数据库、表和分区

  ```sql
  DROP CATALOG RECYCLE BIN WHERE 'DbId' = example_db_id;
  ```

2. 删除 TableId 为 example_tbl_id 的表和分区

  ```sql
  DROP CATALOG RECYCLE BIN WHERE 'TableId' = example_tbl_id;
  ```

3. 删除 id 为 p1_id 的分区

  ```sql
  DROP CATALOG RECYCLE BIN WHERE 'PartitionId' = p1_id;
  ```