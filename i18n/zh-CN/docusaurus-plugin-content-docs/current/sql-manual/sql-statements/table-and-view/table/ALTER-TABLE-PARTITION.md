---
{
    "title": "ALTER TABLE PARTITION",
    "language": "zh-CN",
    "description": "该语句用于对有 partition 的 table 进行修改操作。"
}
---

## 描述

该语句用于对有 partition 的 table 进行修改操作。

这个操作是同步的，命令返回表示执行完毕。

语法：

```sql
ALTER TABLE [database.]table alter_clause;
```

partition 的 alter_clause 支持如下几种修改方式

1. 增加分区

语法：

```sql
ADD PARTITION [IF NOT EXISTS] partition_name 
partition_desc ["key"="value"]
[DISTRIBUTED BY HASH (k1[,k2 ...]) [BUCKETS num]]
```

注意：

- partition_desc 支持以下两种写法
  - VALUES LESS THAN [MAXVALUE|("value1", ...)]
  - VALUES [("value1", ...), ("value1", ...))
- 分区为左闭右开区间，如果用户仅指定右边界，系统会自动确定左边界
- 如果没有指定分桶方式，则自动使用建表使用的分桶方式和分桶数。
- 如指定分桶方式，只能修改分桶数，不可修改分桶方式或分桶列。如果指定了分桶方式，但是没有指定分桶数，则分桶数会使用默认值 10，不会使用建表时指定的分桶数。如果要指定分桶数，则必须指定分桶方式。
- ["key"="value"] 部分可以设置分区的一些属性，具体说明见 [CREATE TABLE](./CREATE-TABLE)
- 如果建表时用户未显式创建 Partition，则不支持通过 ALTER 的方式增加分区
- 如果用户使用的是 List Partition 则可以增加 default partition，default partition 将会存储所有不满足其他分区键要求的数据。
  -  ALTER TABLE table_name ADD PARTITION partition_name

2. 删除分区

语法：

```sql
DROP PARTITION [IF EXISTS] partition_name [FORCE]
```

 注意：

- 使用分区方式的表至少要保留一个分区。
- 执行 DROP PARTITION 一段时间内，可以通过 RECOVER 语句恢复被删除的分区。详见 SQL 手册 - 数据库管理-RECOVER 语句
- 如果执行 DROP PARTITION FORCE，则系统不会检查该分区是否存在未完成的事务，分区将直接被删除并且不能被恢复，一般不建议执行此操作

3. 修改分区属性

 语法：

```sql
MODIFY PARTITION p1|(p1[, p2, ...]) SET ("key" = "value", ...)
```

说明：

- 当前支持修改分区的下列属性：
  - storage_medium
  - storage_cooldown_time
  - replication_num 
  - in_memory
-  对于单分区表，partition_name 同表名。

## 示例

1. 增加分区，现有分区 [MIN, 2013-01-01)，增加分区 [2013-01-01, 2014-01-01)，使用默认分桶方式

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2014-01-01");
```

2. 增加分区，使用新的分桶数

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2015-01-01")
DISTRIBUTED BY HASH(k1) BUCKETS 20;
```

3. 增加分区，使用新的副本数

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES LESS THAN ("2015-01-01")
("replication_num"="1");
```

4. 修改分区副本数

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION p1 SET("replication_num"="1");
```

5. 批量修改指定分区

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION (p1, p2, p4) SET("replication_num"="1");
```

6. 批量修改所有分区

```sql
ALTER TABLE example_db.my_table
MODIFY PARTITION (*) SET("storage_medium"="HDD");
```

7. 删除分区

```sql
ALTER TABLE example_db.my_table
DROP PARTITION p1;
```

8. 批量删除分区

```sql
ALTER TABLE example_db.my_table
DROP PARTITION p1,
DROP PARTITION p2,
DROP PARTITION p3;
```

9. 增加一个指定上下界的分区

```sql
ALTER TABLE example_db.my_table
ADD PARTITION p1 VALUES [("2014-01-01"), ("2014-02-01")); 
```

10. 批量增加数字类型和时间类型的分区

```sql
ALTER TABLE example_db.my_table ADD PARTITIONS FROM (1) TO (100) INTERVAL 10;
ALTER TABLE example_db.my_table ADD PARTITIONS FROM ("2023-01-01") TO ("2025-01-01") INTERVAL 1 YEAR;
ALTER TABLE example_db.my_table ADD PARTITIONS FROM ("2023-01-01") TO ("2025-01-01") INTERVAL 1 MONTH;
ALTER TABLE example_db.my_table ADD PARTITIONS FROM ("2023-01-01") TO ("2025-01-01") INTERVAL 1 WEEK;
ALTER TABLE example_db.my_table ADD PARTITIONS FROM ("2023-01-01") TO ("2025-01-01") INTERVAL 1 DAY;
```

## 关键词

```text
ALTER, TABLE, PARTITION, ALTER TABLE
```



