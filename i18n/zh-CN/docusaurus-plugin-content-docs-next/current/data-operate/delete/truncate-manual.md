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
TRUNCATE TABLE [db.]tbl [PARTITION(p1, p2, ...)] [FORCE];
```

- 该语句仅清空表或分区中的数据，但保留表或分区本身。
- 与 DELETE 不同，该语句只能整体清空指定表或分区，不支持附加过滤条件。
- 与 DELETE 不同，TRUNCATE 清空数据不会影响查询性能。
- 该操作删除的数据可通过 RECOVER 语句在一定时间内恢复。详见 [RECOVER](../../sql-manual/sql-statements/recycle/RECOVER) 语句说明。若执行命令时使用 FORCE，数据将被直接删除且不可恢复，通常不建议使用。
- 使用该命令时，表状态必须为 NORMAL，即正在进行 SCHEMA CHANGE 的表不能执行 TRUNCATE。
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

**3. 使用 FORCE 清空 example_db 下的表 tbl**

```sql
TRUNCATE TABLE example_db.tbl FORCE;
```
