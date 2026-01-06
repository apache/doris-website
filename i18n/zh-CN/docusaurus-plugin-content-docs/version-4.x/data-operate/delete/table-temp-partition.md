---
{
    "title": "临时分区",
    "language": "zh-CN",
    "description": "Doris 支持在分区表中添加临时分区。临时分区与正式分区不同，临时分区不会被常规查询检索到，只有通过特殊查询语句才能查询。"
}
---

Doris 支持在分区表中添加临时分区。临时分区与正式分区不同，临时分区不会被常规查询检索到，只有通过特殊查询语句才能查询。

- 临时分区的分区列与正式分区相同且不可修改。

- 所有临时分区之间的分区范围不可重叠，但临时分区与正式分区的范围可以重叠。

- 临时分区的名称不能与正式分区或其他临时分区重复。

**临时分区的主要应用场景：**

- **原子覆盖写操作**：用户希望重写某一分区的数据，但不希望在删除旧数据和导入新数据之间有数据缺失。此时，可以创建一个临时分区，将新数据导入临时分区后，通过替换操作原子性地替换原有分区。对于非分区表的原子覆盖写操作，请参阅[替换表文档](../../data-operate/delete/atomicity-replace)。

- **修改分桶数**：用户在创建分区时使用了不合适的分桶数，可以创建一个新的临时分区并指定新的分桶数，然后通过 `INSERT INTO` 命令将正式分区的数据导入临时分区，再通过替换操作原子性地替换原有分区。

- **合并或分割分区**：用户希望修改分区范围，如合并两个分区或将一个大分区分割成多个小分区。可以先建立新的临时分区，然后通过 `INSERT INTO` 命令将正式分区的数据导入临时分区，再通过替换操作原子性地替换原有分区。

## 添加临时分区

使用 `ALTER TABLE ADD TEMPORARY PARTITION` 语句添加临时分区：

```sql
ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01");

ALTER TABLE tbl2 ADD TEMPORARY PARTITION tp1 VALUES [("2020-01-01"), ("2020-02-01"));

ALTER TABLE tbl1 ADD TEMPORARY PARTITION tp1 VALUES LESS THAN("2020-02-01")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;

ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai");

ALTER TABLE tbl4 ADD TEMPORARY PARTITION tp1 VALUES IN ((1, "Beijing"), (1, "Shanghai"));

ALTER TABLE tbl3 ADD TEMPORARY PARTITION tp1 VALUES IN ("Beijing", "Shanghai")
("replication_num" = "1")
DISTRIBUTED BY HASH(k1) BUCKETS 5;
```


## 删除临时分区

使用 `ALTER TABLE DROP TEMPORARY PARTITION` 语句删除临时分区：

```sql
ALTER TABLE tbl1 DROP TEMPORARY PARTITION tp1;
```

## 替换正式分区

使用 `ALTER TABLE REPLACE PARTITION` 语句将正式分区替换为临时分区：

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);

ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2, tp3);

ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1, tp2)
PROPERTIES (
  "strict_range" = "false",
  "use_temp_partition_name" = "true"
);
```
替换操作有两个特殊的可选参数：

**1. `strict_range`**

默认为 true。

对于 Range 分区，当该参数为 true 时，所有被替换的正式分区的范围并集需要与替换的临时分区的范围并集完全相同。当置为 false 时，只需保证替换后新的正式分区间的范围不重叠即可。

对于 List 分区，该参数恒为 true。所有被替换的正式分区的枚举值必须与替换的临时分区枚举值完全相同。

**示例 1**

```sql
-- 待替换的分区 p1, p2, p3 的范围 (=> 并集)：
[10, 20), [20, 30), [40, 50) => [10, 30), [40, 50)

-- 替换分区 tp1, tp2 的范围 (=> 并集)：
[10, 30), [40, 45), [45, 50) => [10, 30), [40, 50)

--范围并集相同，则可以使用 tp1 和 tp2 替换 p1, p2, p3。
```

**示例 2**

```sql
-- 待替换的分区 p1 的范围 (=> 并集)：
[10, 50) => [10, 50)

-- 替换分区 tp1, tp2 的范围 (=> 并集)：
[10, 30), [40, 50) => [10, 30), [40, 50)

-- 范围并集不相同，如果 strict_range 为 true，则不可以使用 tp1 和 tp2 替换 p1。如果为 false，且替换后的两个分区范围 [10, 30), [40, 50) 和其他正式分区不重叠，则可以替换。
```

**示例 3**

```sql
-- 待替换的分区 p1, p2 的枚举值 (=> 并集)：
(1, 2, 3), (4, 5, 6) => (1, 2, 3, 4, 5, 6)

-- 替换分区 tp1, tp2, tp3 的枚举值 (=> 并集)：
(1, 2, 3), (4), (5, 6) => (1, 2, 3, 4, 5, 6)

-- 枚举值并集相同，可以使用 tp1，tp2，tp3 替换 p1，p2
```

**示例 4**

```sql
-- 待替换的分区 p1, p2，p3 的枚举值 (=> 并集)：
(("1","beijing"), ("1", "shanghai")), (("2","beijing"), ("2", "shanghai")), (("3","beijing"), ("3", "shanghai")) => (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- 替换分区 tp1, tp2 的枚举值 (=> 并集)：
(("1","beijing"), ("1", "shanghai")), (("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai")) => (("1","beijing"), ("1", "shanghai"), ("2","beijing"), ("2", "shanghai"), ("3","beijing"), ("3", "shanghai"))

-- 枚举值并集相同，可以使用 tp1，tp2 替换 p1，p2，p3
```

**2. `use_temp_partition_name`**

默认为 false。

当该参数为 false，并且待替换的分区和替换分区的个数相同时，替换后的正式分区名称维持不变。

如果为 true，替换后正式分区的名称为替换分区的名称。示例如下：

**示例 1**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1) WITH TEMPORARY PARTITION (tp1);
```

- `use_temp_partition_name` 默认为 false，则在替换后，分区的名称依然为 p1，但相关的数据和属性都替换为 tp1 的。
- 如果 `use_temp_partition_name` 为 true，则在替换后，分区的名称为 tp1，p1 分区不再存在。

**示例 2**

```sql
ALTER TABLE tbl1 REPLACE PARTITION (p1, p2) WITH TEMPORARY PARTITION (tp1);
```

- `use_temp_partition_name` 默认为 false，但因待替换分区的个数与替换分区的个数不同，该参数无效。替换后，分区名称为 tp1，p1 和 p2 不再存在。

:::tip
**替换操作说明：**

分区替换成功后，被替换的分区将被删除且不可恢复。
:::

## 导入临时分区

根据导入方式的不同，指定导入临时分区的语法稍有差别。示例如下：

```sql
INSERT INTO tbl TEMPORARY PARTITION(tp1, tp2, ...) SELECT ....
curl --location-trusted -u root: -H "label:123" -H "temporary_partitions: tp1, tp2, ..." -T testData http://host:port/api/testDb/testTbl/_stream_load    
LOAD LABEL example_db.label1
(
DATA INFILE("hdfs://hdfs_host:hdfs_port/user/palo/data/input/file")
INTO TABLE my_table
TEMPORARY PARTITION (tp1, tp2, ...)
...
)
WITH BROKER hdfs ("username"="hdfs_user", "password"="hdfs_password");
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
TEMPORARY PARTITIONS(tp1, tp2, ...),
WHERE k1 > 100
PROPERTIES
(...)
FROM KAFKA
(...);
```

## 查询临时分区

```sql
SELECT ... FROM
tbl1 TEMPORARY PARTITION(tp1, tp2, ...)
JOIN
tbl2 TEMPORARY PARTITION(tp1, tp2, ...)
ON ...
WHERE ...;
```

## 与其他操作的关系

**DROP**

- 使用 Drop 操作直接删除数据库或表后，可以通过 Recover 命令恢复数据库或表（限定时间内），但临时分区不会被恢复。

- 使用 Alter 命令删除正式分区后，可以通过 Recover 命令恢复分区（限定时间内）。操作正式分区和临时分区无关。

- 使用 Alter 命令删除临时分区后，无法通过 Recover 命令恢复临时分区。

**TRUNCATE**

- 使用 Truncate 命令清空表，表的临时分区会被删除，且不可恢复。

- 使用 Truncate 命令清空正式分区时，不影响临时分区。

- 不可使用 Truncate 命令清空临时分区。

**ALTER**

- 当表存在临时分区时，无法使用 Alter 命令对表进行 Schema Change、Rollup 等变更操作。

- 当表在进行变更操作时，无法对表添加临时分区。