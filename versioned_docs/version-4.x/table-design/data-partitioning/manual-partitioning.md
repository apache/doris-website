---
{
    "title": "Manual Partitioning",
    "language": "en",
    "description": "Guide to manual partitioning in Doris: detailed syntax and use cases for Range partitioning, List partitioning, and NULL partitioning, including examples of the four Range partition forms (FIXED RANGE, LESS THAN, BATCH RANGE, MULTI RANGE)."
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenario: Table design / Data partitioning planning -->

Manual partitioning is a partitioning method in which the user explicitly specifies the partition rules at table creation time. This article describes how to use manual partitioning in Doris, including the syntax, use cases, and best practices for Range partitioning, List partitioning, and NULL partitioning.

## Partition column rules

Before using manual partitioning, you need to understand the general rules for partition columns:

-   Partition columns can be one or more columns, and they must be KEY columns.
-   Regardless of the partition column type, partition values must be enclosed in double quotes when written.
-   There is no theoretical upper limit on the number of partitions. However, the default limit is 4096 partitions per table. To exceed this limit, modify the FE configurations `max_multi_partition_num` and `max_dynamic_partition_num`.
-   When a table is created without partitioning, the system automatically generates a single partition with the same name as the table that covers the full value range. This partition is invisible to users and cannot be modified or deleted.
-   You cannot create partitions whose ranges overlap.

## Range partitioning

Range partitioning divides data into different partitions based on the value range of the partition column. The partition column is typically a time column, which makes it easy to manage old and new data.

**Supported column types:** `DATE`, `DATETIME`, `TIMESTAMPTZ`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`.

Range partitioning supports the following four forms, suitable for different scenarios:

| Form | Use case |
|------|----------|
| FIXED RANGE | When you need precise control over the upper and lower bounds of each partition |
| LESS THAN | When you only care about the upper bound of a partition and append partitions in chronological order |
| BATCH RANGE | Batch creation of numeric or time partitions with equal step size |
| MULTI RANGE | Batch creation with different step sizes for different time ranges |

### 1. FIXED RANGE

Defines a left-closed, right-open interval for the partition.

**Syntax:**

```sql
PARTITION BY RANGE(col1[, col2, ...])
(
    PARTITION partition_name1 VALUES [("k1-lower1", "k2-lower1", "k3-lower1",...), ("k1-upper1", "k2-upper1", "k3-upper1", ...)),
    PARTITION partition_name2 VALUES [("k1-lower1-2", "k2-lower1-2", ...), ("k1-upper1-2", MAXVALUE, ))
)
```

**Example:**

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES [("2017-01-01"), ("2017-02-01")),
    PARTITION `p201702` VALUES [("2017-02-01"), ("2017-03-01")),
    PARTITION `p201703` VALUES [("2017-03-01"), ("2017-04-01"))
)
```

### 2. LESS THAN

Defines only the upper bound of the partition; the lower bound is determined by the upper bound of the previous partition.

**Syntax:**

```sql
PARTITION BY RANGE(col1[, col2, ...])
(
    PARTITION partition_name1 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...),
    PARTITION partition_name2 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...)
)
```

**Example:**

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

Creates RANGE partitions for numeric and time types in batch, defining a left-closed, right-open interval for each partition with a specified step size.

**Syntax:**

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

**Example:**

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

Creates RANGE partitions in batch with left-closed, right-open intervals, allowing different step sizes within the same statement.

**Example:**

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

## List partitioning

List partitioning divides data into different partitions based on the enumerated values of the partition column. A row is routed to a partition only if its value matches one of the enumerated values defined for that partition.

**Supported column types:** `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `TIMESTAMPTZ`, `CHAR`, `VARCHAR`.

**Syntax keyword:** Use `VALUES IN (...)` to specify the enumerated values contained in each partition.

### Single-column List partitioning

```sql
PARTITION BY LIST(city)
(
    PARTITION `p_cn` VALUES IN ("Beijing", "Shanghai", "Hong Kong"),
    PARTITION `p_usa` VALUES IN ("New York", "San Francisco"),
    PARTITION `p_jp` VALUES IN ("Tokyo")
)
```

### Multi-column List partitioning

```sql
PARTITION BY LIST(id, city)
(
    PARTITION p1_city VALUES IN (("1", "Beijing"), ("1", "Shanghai")),
    PARTITION p2_city VALUES IN (("2", "Beijing"), ("2", "Shanghai")),
    PARTITION p3_city VALUES IN (("3", "Beijing"), ("3", "Shanghai"))
)
```

## NULL partitioning

Partition columns must be NOT NULL by default. To use a nullable column as a partition column, set the following session variable:

```sql
SET allow_partition_column_nullable = true;
```

Different partition types handle NULL values as follows:

| Partition type | NULL value handling |
|----------|-------------|
| LIST partition | Supports a true NULL partition |
| RANGE partition (with LESS THAN) | NULL values are placed in the smallest LESS THAN partition |
| RANGE partition (without LESS THAN) | NULL values cannot be inserted |

### Scenario 1: LIST partition supports NULL

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

### Scenario 2: RANGE partition routes NULL to the smallest LESS THAN partition

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

### Scenario 3: RANGE partition without LESS THAN cannot accept NULL

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
