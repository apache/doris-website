---
{
    "title": "Manual partitioning",
    "language": "en"
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


## Partition columns

- Partition columns can be specified as one or multiple columns, and the partition columns must be KEY columns. The usage of multi-column partitioning will be introduced later in the summary section of multi-column partitioning.

- When `allow_partition_column_nullable` is set to true, Range partition supports the use of NULL partition columns. List Partition does not support NULL partition columns at all times.

- Regardless of the type of partition column, double quotes are required when writing partition values.

- There is theoretically no upper limit on the number of partitions. However, each table is limited to 4096 partitions by default. If you want to exceed this limit, you can modify the FE configuration parameters `max_multi_partition_num` and `max_dynamic_partition_num`.

- When creating a table without partitioning, the system will automatically generate a full-range partition with the same name as the table name. This partition is not visible to users and cannot be deleted or modified.

- Overlapping ranges are not allowed when creating partitions.

## RANGE partitioning

Partition columns are usually time columns for convenient management of old and new data. RANGE partitioning supports column types such as `DATE`, `DATETIME`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, and `LARGEINT`.

Partition information supports the following four writing methods:

- `FIXED RANGE`: This method defines the partition as a left-closed, right-open interval.

```sql
PARTITION BY RANGE(col1[, col2, ...])                                                                                                                                                                                                  
(                                                                                                                                                                                                                                      
    PARTITION partition_name1 VALUES [("k1-lower1", "k2-lower1", "k3-lower1",...), ("k1-upper1", "k2-upper1", "k3-upper1", ...)),                                                                                                      
    PARTITION partition_name2 VALUES [("k1-lower1-2", "k2-lower1-2", ...), ("k1-upper1-2", MAXVALUE, ))                                                                                                                                
)                                                                                                                                                                                                                                      
```

For example: 

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES [("2017-01-01"),  ("2017-02-01")),
    PARTITION `p201702` VALUES [("2017-02-01"), ("2017-03-01")),
    PARTITION `p201703` VALUES [("2017-03-01"), ("2017-04-01"))
)
```

- `LESS THAN`: This method only defines the upper bound of the partition. The lower bound is determined by the upper bound of the previous partition.

```sql
PARTITION BY RANGE(col1[, col2, ...])                                                                                                                                                                                                  
(                                                                                                                                                                                                                                      
    PARTITION partition_name1 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...),                                                                                                                                                     
    PARTITION partition_name2 VALUES LESS THAN MAXVALUE | ("value1", "value2", ...)                                                                                                                                                      
)                                                                                                                                                                                                                                      
```

For example:

```sql
PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES LESS THAN ("2017-02-01"),
    PARTITION `p201702` VALUES LESS THAN ("2017-03-01"),
    PARTITION `p201703` VALUES LESS THAN ("2017-04-01")
)

PARTITION BY RANGE(`date`)
(
    PARTITION `p201701` VALUES LESS THAN ("2017-02-01"),
    PARTITION `p201702` VALUES LESS THAN ("2017-03-01"),
    PARTITION `p201703` VALUES LESS THAN ("2017-04-01")
    PARTITION `other` VALUES LESS THAN (MAXVALUE)
)
```

- `BATCH RANGE`: This method batch creates partitions based on ranges of number or time, defining the partitions as left-closed, right-open intervals and setting the step size.

```sql
PARTITION BY RANGE(int_col)                                                                                                                                                                                                            
(                                                                                                                                                                                                                                      
    FROM (start_num) TO (end_num) INTERVAL interval_value                                                                                                                                                                                                   
)

PARTITION BY RANGE(date_col)                                                                                                                                                                                                            
(                                                                                                                                                                                                                                      
    FROM ("start_date") TO ("end_date") INTERVAL num YEAR | num MONTH | num WEEK | num DAY ｜ 1 HOUR                                                                                                                                                                                                   
)                                                                                                                                                                                                                                    
```

For example: 

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

- `MULTI RANGE`: This method batch creates partitions based on range partitioning, defining the partitions as left-closed, right-open intervals. For example:

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

## LIST partitioning

Partition columns based on LIST partitioning support data types such as `BOOLEAN`, `TINYINT`, `SMALLINT`, `INT`, `BIGINT`, `LARGEINT`, `DATE`, `DATETIME`, `CHAR`, and `VARCHAR`. Partition values are enumerated values. Only when the data is one of the enumerated values of the target partition, the partition can be hit.

Partitions support specifying the enumerated values contained in each partition through `VALUES IN (...)`.

For example:

```sql
PARTITION BY LIST(city)
(
    PARTITION `p_cn` VALUES IN ("Beijing", "Shanghai", "Hong Kong"),
    PARTITION `p_usa` VALUES IN ("New York", "San Francisco"),
    PARTITION `p_jp` VALUES IN ("Tokyo")
)
```

LIST partitioning also supports multi-column partitioning, for example:

```sql
PARTITION BY LIST(id, city)
(
    PARTITION p1_city VALUES IN (("1", "Beijing"), ("1", "Shanghai")),
    PARTITION p2_city VALUES IN (("2", "Beijing"), ("2", "Shanghai")),
    PARTITION p3_city VALUES IN (("3", "Beijing"), ("3", "Shanghai"))
)
```

## NULL partitioning

Partition columns based on NULL partitioning must be not null columns by default. If you need to use null columns, set the session variable `allow_partition_column_nullable` to `true`. For LIST partitioning, the NULL partitioning is supported, while for RANGE partitioning, null values will be assigned to the `less than` partition. The columns are as follows:

**LIST partitioning**

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

**RANGE partitioning with the `less than` partition**

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

**RANGE partitioning without the `less than` partition**

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
