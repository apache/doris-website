---
{
    "title": "ALTER TABLE DISTRIBUTION",
    "language": "zh-CN",
    "description": "该语句用于修改分区表的默认分桶配置。"
}
---

## 描述

该语句用于修改分区表的默认分桶配置。这个操作是同步的，命令返回表示执行完毕。

该语句仅修改**新创建分区**的默认分桶数。已有分区的分桶数保持不变。

语法：

```sql
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(column1[, column2, ...]) BUCKETS { num | AUTO };
ALTER TABLE [database.]table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS { num | AUTO };
```

说明：

- `num`：正整数，指定新分区使用的固定分桶数。
- `AUTO`：由系统根据数据量和集群配置自动决定新分区的分桶数。
- 分桶方式（HASH 或 RANDOM）和分桶列必须与建表时保持一致，仅能修改分桶数。
- 该语句仅适用于**分区表**（RANGE 分区或 LIST 分区）。不支持非分区表。
- 不支持 **Colocate** 表。
- 可以在固定分桶数和 `AUTO` 之间自由切换，并支持多次连续修改。

### 与自动分区（AUTO PARTITION）的联用

对于使用[自动分区](../../../../table-design/data-partitioning/auto-partitioning)的表，在执行 `ALTER TABLE MODIFY DISTRIBUTION` 之后，由数据导入自动创建的新分区将使用新的分桶配置。修改之前已经自动创建的分区保持不变。

例如，某自动分区表原先使用 `BUCKETS 5`，修改为 `BUCKETS 8` 后，后续 INSERT 触发自动创建的新分区将使用 8 个分桶。若进一步修改为 `BUCKETS AUTO`，则新自动创建的分区将由系统自动决定分桶数。

### 与动态分区（Dynamic Partition）的联用

对于使用[动态分区](../../../../table-design/data-partitioning/dynamic-partitioning)的表，在执行 `ALTER TABLE MODIFY DISTRIBUTION` 之后，由动态分区调度器自动创建的新分区将使用新的分桶配置。已有的动态分区保持不变。

注意，动态分区表还支持 `dynamic_partition.buckets` 属性。如果两者同时设置，动态创建的分区将优先使用 `dynamic_partition.buckets` 属性指定的分桶数。若希望动态分区使用表级别的默认分桶数（即通过 `MODIFY DISTRIBUTION` 设置的值），请确保未显式设置 `dynamic_partition.buckets`，或通过 `ALTER TABLE ... SET ("dynamic_partition.buckets" = "...")` 同步更新。

## 示例

1. 将 RANGE 分区、HASH 分桶表的默认分桶数修改为 10

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

之后新增的分区将使用 10 个分桶：

```sql
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 将使用 10 个分桶；已有分区不受影响
```

2. 从固定分桶数切换为 AUTO

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
```

之后新建的分区将由系统自动决定分桶数。

3. 从 AUTO 切换回固定分桶数

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 3;
```

4. 修改 LIST 分区表的默认分桶数

```sql
ALTER TABLE example_db.my_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;
```

5. 修改 RANDOM 分桶表的默认分桶数

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 12;
```

6. 将 RANDOM 分桶表切换为 AUTO

```sql
ALTER TABLE example_db.my_random_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS AUTO;
```

7. 修改自动分区表（RANGE）的默认分桶数

```sql
-- 原表使用 AUTO PARTITION BY RANGE，分桶数为 5
ALTER TABLE example_db.my_auto_range_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 8;

-- 后续 INSERT 触发自动创建的新分区将使用 8 个分桶
INSERT INTO example_db.my_auto_range_table VALUES ('2024-01-03', 3);
```

8. 修改自动分区表（LIST）的默认分桶数

```sql
-- 原表使用 AUTO PARTITION BY LIST，分桶数为 4
ALTER TABLE example_db.my_auto_list_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 7;

-- 后续 INSERT 触发自动创建的新分区将使用 7 个分桶
INSERT INTO example_db.my_auto_list_table VALUES ('ccc', 3);
```

9. 将自动分区表从 AUTO 分桶切换为固定分桶，再切换回 AUTO

```sql
-- 原表建表时使用 BUCKETS AUTO
ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 5;
-- 新分区将使用 5 个分桶

ALTER TABLE example_db.my_auto_auto_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
-- 新分区将恢复为系统自动决定分桶数
```

10. 多次连续修改

```sql
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 4;
ALTER TABLE example_db.my_table ADD PARTITION p2 VALUES LESS THAN ('20');
-- p2 使用 4 个分桶

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS AUTO;
ALTER TABLE example_db.my_table ADD PARTITION p3 VALUES LESS THAN ('30');
-- p3 使用系统自动决定的分桶数

ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 6;
ALTER TABLE example_db.my_table ADD PARTITION p4 VALUES LESS THAN ('40');
-- p4 使用 6 个分桶
```

11. 错误示例

不支持 Colocate 表：

```sql
-- 将会失败，错误信息："Cannot change default bucket number of colocate table"
ALTER TABLE example_db.my_colocate_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

不支持非分区表：

```sql
-- 将会失败，错误信息："Only support change partitioned table's distribution"
ALTER TABLE example_db.my_unpartitioned_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k1) BUCKETS 10;
```

不能更改分桶方式：

```sql
-- 原表使用 HASH 分桶，改为 RANDOM 将会失败
-- 错误信息："Cannot change distribution type"
ALTER TABLE example_db.my_hash_table MODIFY DISTRIBUTION DISTRIBUTED BY RANDOM BUCKETS 10;
```

不能更改分桶列：

```sql
-- 原表使用 HASH(k1)，改为 HASH(k2) 将会失败
-- 错误信息："Cannot assign hash distribution with different distribution cols"
ALTER TABLE example_db.my_table MODIFY DISTRIBUTION DISTRIBUTED BY HASH(k2) BUCKETS 10;
```

## 关键词

```text
ALTER, TABLE, DISTRIBUTION, MODIFY DISTRIBUTION, BUCKETS, ALTER TABLE
```
