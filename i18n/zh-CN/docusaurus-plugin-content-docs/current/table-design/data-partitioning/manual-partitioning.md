---
{
    "title": "手动分区",
    "language": "zh-CN",
    "description": "Doris 手动分区使用指南：详解 Range 分区、List 分区、NULL 分区的语法与使用场景，包含 FIXED RANGE、LESS THAN、BATCH RANGE、MULTI RANGE 四种分区写法示例。"
}
---

<!-- 知识类型: 操作步骤 / 配置参数 -->
<!-- 适用场景: 表设计 / 数据分区规划 -->

手动分区是用户在建表时显式指定分区规则的分区方式。本文介绍 Doris 中手动分区的使用方法，包括 Range 分区、List 分区以及 NULL 分区的语法、适用场景和最佳实践。

## 分区列规则

在使用手动分区前，需要了解分区列的通用规则：

-   分区列可以指定一列或多列，分区列必须为 KEY 列。
-   不论分区列是什么类型，在写分区值时，都需要加双引号。
-   分区数量理论上没有上限。但默认限制每张表 4096 个分区，如果想突破这个限制，可以修改 FE 配置 `max_multi_partition_num` 和 `max_dynamic_partition_num`。
-   当不使用分区建表时，系统会自动生成一个和表名同名的、全值范围的分区。该分区对用户不可见，并且不可删改。
-   创建分区时不可添加范围重叠的分区。

## Range 分区

Range 分区按照分区列的取值范围将数据划分到不同分区。分区列通常为时间列，便于管理新旧数据。

**支持的列类型：** `DATE`、`DATETIME`、`TIMESTAMPTZ`、`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`。

Range 分区支持以下四种写法，适用于不同场景：

| 写法 | 适用场景 |
|------|----------|
| FIXED RANGE | 需要精确控制每个分区的上下界 |
| LESS THAN | 仅关心分区上界，按时间顺序追加分区 |
| BATCH RANGE | 数字或时间类型的等步长批量创建 |
| MULTI RANGE | 不同时间段使用不同步长的批量创建 |

### 1. FIXED RANGE

定义分区的左闭右开区间。

**语法：**

```sql
PARTITION BY RANGE(col1[, col2, ...])
(
    PARTITION partition_name1 VALUES [("k1-lower1", "k2-lower1", "k3-lower1",...), ("k1-upper1", "k2-upper1", "k3-upper1", ...)),
    PARTITION partition_name2 VALUES [("k1-lower1-2", "k2-lower1-2", ...), ("k1-upper1-2", MAXVALUE, ))
)
```

**示例：**

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES [("2017-01-01"), ("2017-02-01")),
    PARTITION `p201702` VALUES [("2017-02-01"), ("2017-03-01")),
    PARTITION `p201703` VALUES [("2017-03-01"), ("2017-04-01"))
)
```

### 2. LESS THAN

仅定义分区上界，下界由上一个分区的上界决定。

**语法：**

```sql
PARTITION BY RANGE(col1[, col2, ...])
(
    PARTITION partition_name1 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...),
    PARTITION partition_name2 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...)
)
```

**示例：**

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES LESS THAN ("2017-02-01"),
    PARTITION `p201702` VALUES LESS THAN ("2017-03-01"),
    PARTITION `p201703` VALUES LESS THAN ("2017-04-01"),
    PARTITION `p2018` VALUES [("2018-01-01"), ("2019-01-01")),
    PARTITION `other` VALUES LESS THAN (MAXVALUE)
)
```

### 3. BATCH RANGE

批量创建数字类型和时间类型的 RANGE 分区，定义分区的左闭右开区间，并设定步长。

**语法：**

```sql
PARTITION BY RANGE(int_col)
(
    FROM (start_num) TO (end_num) INTERVAL interval_value
)

PARTITION BY RANGE(date_col)
(
    FROM ("start_date") TO ("end_date") INTERVAL num YEAR | num MONTH | num WEEK | num DAY | 1 HOUR
)
```

**示例：**

```sql
PARTITION BY RANGE(age)
(
    FROM (1) TO (100) INTERVAL 10
)

PARTITION BY RANGE(`date`)
(
    FROM ("2000-11-14") TO ("2021-11-14") INTERVAL 2 YEAR
)
```

### 4. MULTI RANGE

批量创建 RANGE 分区，定义分区的左闭右开区间，支持在同一语句中使用不同的步长。

**示例：**

```sql
PARTITION BY RANGE(col)
(
    FROM ("2000-11-14") TO ("2021-11-14") INTERVAL 1 YEAR,
    FROM ("2021-11-14") TO ("2022-11-14") INTERVAL 1 MONTH,
    FROM ("2022-11-14") TO ("2023-01-03") INTERVAL 1 WEEK,
    FROM ("2023-01-03") TO ("2023-01-14") INTERVAL 1 DAY,
    PARTITION p_20230114 VALUES [('2023-01-14'), ('2023-01-15'))
)
```

## List 分区

List 分区按照分区列的枚举值将数据划分到不同分区。只有当数据为目标分区枚举值其中之一时，才可以命中分区。

**支持的列类型：** `BOOLEAN`、`TINYINT`、`SMALLINT`、`INT`、`BIGINT`、`LARGEINT`、`DATE`、`DATETIME`、`TIMESTAMPTZ`、`CHAR`、`VARCHAR`。

**语法关键字：** 通过 `VALUES IN (...)` 指定每个分区包含的枚举值。

### 单列 List 分区

```sql
PARTITION BY LIST(city)
(
    PARTITION `p_cn` VALUES IN ("Beijing", "Shanghai", "Hong Kong"),
    PARTITION `p_usa` VALUES IN ("New York", "San Francisco"),
    PARTITION `p_jp` VALUES IN ("Tokyo")
)
```

### 多列 List 分区

```sql
PARTITION BY LIST(id, city)
(
    PARTITION p1_city VALUES IN (("1", "Beijing"), ("1", "Shanghai")),
    PARTITION p2_city VALUES IN (("2", "Beijing"), ("2", "Shanghai")),
    PARTITION p3_city VALUES IN (("3", "Beijing"), ("3", "Shanghai"))
)
```

## NULL 分区

PARTITION 列默认必须为 NOT NULL 列。如果需要使用 NULL 列，应设置 session variable：

```sql
SET allow_partition_column_nullable = true;
```

不同分区类型对 NULL 值的处理方式如下：

| 分区类型 | NULL 值处理 |
|----------|-------------|
| LIST 分区 | 支持真正的 NULL 分区 |
| RANGE 分区（含 LESS THAN） | NULL 值归属最小的 LESS THAN 分区 |
| RANGE 分区（无 LESS THAN） | 无法插入 NULL 值 |

### 场景一：LIST 分区支持 NULL

```sql
mysql> create table null_list(
    -> k0 varchar null
    -> )
    -> partition by list (k0)
    -> (
    -> PARTITION pX values in ((NULL))
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.11 sec)

mysql> insert into null_list values (null);
Query OK, 1 row affected (0.19 sec)

mysql> select * from null_list;
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.18 sec)
```

### 场景二：RANGE 分区 NULL 归属最小 LESS THAN 分区

```sql
mysql> create table null_range(
    -> k0 int null
    -> )
    -> partition by range (k0)
    -> (
    -> PARTITION p10 values less than (10),
    -> PARTITION p100 values less than (100),
    -> PARTITION pMAX values less than (maxvalue)
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.12 sec)

mysql> insert into null_range values (null);
Query OK, 1 row affected (0.19 sec)

mysql> select * from null_range partition(p10);
+------+
| k0   |
+------+
| NULL |
+------+
1 row in set (0.18 sec)
```

### 场景三：RANGE 分区无 LESS THAN 时无法插入 NULL

```sql
mysql> create table null_range2(
    -> k0 int null
    -> )
    -> partition by range (k0)
    -> (
    -> PARTITION p200 values [("100"), ("200"))
    -> )
    -> DISTRIBUTED BY HASH(`k0`) BUCKETS 1
    -> properties("replication_num" = "1");
Query OK, 0 rows affected (0.13 sec)

mysql> insert into null_range2 values (null);
ERROR 5025 (HY000): Insert has filtered data in strict mode, tracking_url=......
```
