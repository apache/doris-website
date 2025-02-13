---
{
    "title": "SHOW COLUMN STATS",
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

## 描述

该语句用来查看表的列统计信息。

## 语法

```SQL
SHOW COLUMN [CACHED] STATS <table_name> [ (<column_name> [, ...]) ];
```

## 必选参数

**1. `<table_name>`**

> 需要展示列统计信息的表名。

## 可选参数

**1. `CACHED`**

> 显示FE缓存中的统计信息。不指定的时候默认显示统计信息表中持久化的信息。

**2. `<column_name>`**

> 指定需要显示的列名。列名在表中必须存在，多个列名之间用逗号分隔。如果不指定，默认显示所有列的信息。

## 返回值

| 列名 | 说明           |
| -- |--------------|
| column_name | 列名           |
| index_name |   列所属的索引名           |
| count | 列的行数           |
| ndv | 列的基数         |
| num_null | 列的空值数           |
| data_size |   列的总数据量           |
| avg_size_byte |  列的平均字节数           |
| min | 列的最小值         |
| max | 列的最大值           |
| method |   收集方式          |
| type | 收集类型           |
| trigger | 触发方式         |
| query_times | 信息被查询次数          |
| updated_time |   信息更新时间           |
| update_rows | 上次收集时数据更新行数           |
| last_analyze_row_count | 上次收集时表的总行数         |
| last_analyze_version | 上次收集时表的版本值         |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | 表（Table）    | 当执行 SHOW 时，需要拥有被查询的表的 SELECT_PRIV 权限 |

## 举例

1. 展示表test1所有列的统计信息

```sql
SHOW COLUMN STATS test1;
```

```text
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
| column_name | index_name | count    | ndv     | num_null | data_size | avg_size_byte | min    | max    | method | type         | trigger | query_times | updated_time        | update_rows | last_analyze_row_count | last_analyze_version |
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
| name        | test1      | 87775.0  | 48824.0 | 0.0      | 351100.0  | 4.0           | '0001' | 'ffff' | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2025-02-05 12:17:08 | 0           | 100000                 | 3                    |
| id          | test1      | 100000.0 | 8965.0  | 0.0      | 351400.0  | 3.514         | 1000   | 9999   | SAMPLE | FUNDAMENTALS | MANUAL  | 0           | 2025-02-05 12:17:41 | 0           | 100000                 | 3                    |
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
```

2. 展示表test1所有列在当前FE缓存中的统计信息

```sql
SHOW COLUMN CACHED STATS test1;
```

```text
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
| column_name | index_name | count    | ndv     | num_null | data_size | avg_size_byte | min    | max    | method | type         | trigger | query_times | updated_time        | update_rows | last_analyze_row_count | last_analyze_version |
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
| name        | test1      | 87775.0  | 48824.0 | 0.0      | 351100.0  | 4.0           | '0001' | 'ffff' | FULL   | FUNDAMENTALS | MANUAL  | 0           | 2025-02-05 12:17:08 | 0           | 100000                 | 3                    |
| id          | test1      | 100000.0 | 8965.0  | 0.0      | 351400.0  | 3.514         | 1000   | 9999   | SAMPLE | FUNDAMENTALS | MANUAL  | 0           | 2025-02-05 12:17:41 | 0           | 100000                 | 3                    |
+-------------+------------+----------+---------+----------+-----------+---------------+--------+--------+--------+--------------+---------+-------------+---------------------+-------------+------------------------+----------------------+
```
