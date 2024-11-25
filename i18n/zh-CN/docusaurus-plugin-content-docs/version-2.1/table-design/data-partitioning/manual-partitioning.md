---
{
    "title": "手动分区",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->


## 分区列

-   分区列可以指定一列或多列，分区列必须为 KEY 列。多列分区的使用方式在后面多列分区小结介绍。
-   PARTITION 列默认必须为 NOT NULL 列，如果需要使用 NULL 列，应设置 session variable `allow_partition_column_nullable = true`。对于 LIST PARTITION，支持真正的 NULL 分区。对于 RANGE PARTITION，NULL 值会被划归**最小的 LESS THAN 分区**。
-   不论分区列是什么类型，在写分区值时，都需要加双引号。
-   分区数量理论上没有上限。但默认限制每张表 4096 个分区，如果想突破这个限制，可以修改 FE 配置`max_multi_partition_num`和`max_dynamic_partition_num `。
-   当不使用分区建表时，系统会自动生成一个和表名同名的，全值范围的分区。该分区对用户不可见，并且不可删改。
-   创建分区时不可添加范围重叠的分区。

## Range 分区

分区列通常为时间列，以方便的管理新旧数据。Range 分区支持的列类型 DATE,  DATETIME, TINYINT, SMALLINT, INT, BIGINT, LARGEINT。

**分区信息，支持四种写法：**            

1.  FIXED RANGE：定义分区的左闭右开区间。  

```sql
PARTITION BY RANGE(col1[, col2, ...])                                                                                                                                                                                                  
(                                                                                                                                                                                                                                      
    PARTITION partition_name1 VALUES [("k1-lower1", "k2-lower1", "k3-lower1",...), ("k1-upper1", "k2-upper1", "k3-upper1", ...)),                                                                                                      
    PARTITION partition_name2 VALUES [("k1-lower1-2", "k2-lower1-2", ...), ("k1-upper1-2", MAXVALUE, ))                                                                                                                                
)                                                                                                                                                                                                                                      
```

示例如下：

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES [("2017-01-01"),  ("2017-02-01")),
    PARTITION `p201702` VALUES [("2017-02-01"), ("2017-03-01")),
    PARTITION `p201703` VALUES [("2017-03-01"), ("2017-04-01"))
)
```

2. LESS THAN：仅定义分区上界。下界由上一个分区的上界决定。 

```sql
PARTITION BY RANGE(col1[, col2, ...])                                                                                                                                                                                                  
(                                                                                                                                                                                                                                      
    PARTITION partition_name1 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...),                                                                                                                                                     
    PARTITION partition_name2 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...)                                                                                                                                                      
)                                                                                                                                                                                                                                      
```

示例如下：

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

## List 分区

分区列支持 `BOOLEAN, TINYINT, SMALLINT, INT, BIGINT, LARGEINT, DATE, DATETIME, CHAR, VARCHAR` 数据类型，分区值为枚举值。只有当数据为目标分区枚举值其中之一时，才可以命中分区。

Partition 支持通过 `VALUES IN (...)` 来指定每个分区包含的枚举值。

举例如下：

```sql
PARTITION BY LIST(city)
(
    PARTITION `p_cn` VALUES IN ("Beijing", "Shanghai", "Hong Kong"),
    PARTITION `p_usa` VALUES IN ("New York", "San Francisco"),
    PARTITION `p_jp` VALUES IN ("Tokyo")
)
```

List 分区也支持多列分区，示例如下：

```sql
PARTITION BY LIST(id, city)
(
    PARTITION p1_city VALUES IN (("1", "Beijing"), ("1", "Shanghai")),
    PARTITION p2_city VALUES IN (("2", "Beijing"), ("2", "Shanghai")),
    PARTITION p3_city VALUES IN (("3", "Beijing"), ("3", "Shanghai"))
)
```

## NULL 分区

> 从 2.1.3 版本开始，Doris 支持以下的 NULL 值分区用法。

PARTITION 列默认必须为 NOT NULL 列，如果需要使用 NULL 列，应设置 session variable `allow_partition_column_nullable = true`。对于 LIST PARTITION，我们支持真正的 NULL 分区。对于 RANGE PARTITION，NULL 值会被划归**最小的 LESS THAN 分区**。分列如下：

1. LIST 分区

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

2. RANGE 分区 —— 归属最小的 LESS THAN 分区

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

3. RANGE 分区 —— 没有 LESS THAN 分区时，无法插入

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
