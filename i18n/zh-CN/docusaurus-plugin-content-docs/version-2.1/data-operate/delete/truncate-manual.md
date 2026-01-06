---
{
    "title": "Truncate 操作",
    "language": "zh-CN",
    "description": "该语句用于清空指定表和分区的数据。"
}
---

该语句用于清空指定表和分区的数据。

## 语法

```sql
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)];
```

- 该语句清空数据，但保留表或分区结构。

- 与 DELETE 不同，TRUNCATE 仅进行元数据操作，速度快且不会影响查询性能。

- 该操作删除的数据不可恢复。

- 表状态需为 NORMAL，不能有正在进行的 SCHEMA CHANGE 等操作。

- 该命令可能会导致正在进行的导入任务失败。

## 示例

**1. 清空 example_db 下的表 tbl**

```sql
TRUNCATE TABLE example_db.tbl;
```

**2. 清空表 tbl 的 p1 和 p2 分区**

```sql
TRUNCATE TABLE tbl PARTITION(p1, p2);
```
