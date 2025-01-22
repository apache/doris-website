---
{
    "title": "SHOW QUERY STATS",
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

该语句用于展示数据库中历史查询命中的库表列的情况

## 语法

```sql
SHOW QUERY STATS [ { [FOR <db_name>] | [FROM <table_name>] } ] [ALL] [VERBOSE]];
```

## 可选参数

**1. `<db_name>`**

> 若填写表示展示数据库的命中情况

**2. `<table_name>`**

> 若填写表示查询某表的查询命中情况

**3. `ALL`**

> ALL 可以指定是否展示所有 index 的查询命中情况

**4. `VERBOSE`**

> VERBOSE 可以展示更详细的命中情况

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）          |
|:--------------|:-----------|:-------------------|
| SELECT_PRIV         | DATABASE   | 需要对查询的数据库有 SELECT 权限 |

## 注意事项

- 支持查询数据库和表的历史查询命中情况，重启 fe 后数据会重置，每个 fe 单独统计。

- 通过 FOR DATABASE 和 FROM TABLE 可以指定查询数据库或者表的命中情况，后面分别接数据库名或者表名。

- ALL 和 VERBOSE 可以展示更详细的命中情况，这两个参数可以单独使用，也可以一起使用，但是必须放在最后 而且只能用在表的查询上。

- 如果没有 use 任何数据库那么直接执行`SHOW QUERY STATS` 将展示所有数据库的命中情况。

- 命中结果中可能有两列：QueryCount 表示该列被查询次数，FilterCount 表示该列作为 where 条件被查询的次数。

## 示例

```sql
show query stats from baseall
```

```text
 +-------+------------+-------------+
 | Field | QueryCount | FilterCount |
 +-------+------------+-------------+
 | k0    | 0          | 0           |
 | k1    | 0          | 0           |
 | k2    | 0          | 0           |
 | k3    | 0          | 0           |
 | k4    | 0          | 0           |
 | k5    | 0          | 0           |
 | k6    | 0          | 0           |
 | k10   | 0          | 0           |
 | k11   | 0          | 0           |
 | k7    | 0          | 0           |
 | k8    | 0          | 0           |
 | k9    | 0          | 0           |
 | k12   | 0          | 0           |
 | k13   | 0          | 0           |
 +-------+------------+-------------+
```

```sql
select k0, k1,k2, sum(k3) from baseall  where k9 > 1 group by k0,k1,k2
```

```text
 +------+------+--------+-------------+
 | k0   | k1   | k2     | sum(`k3`)   |
 +------+------+--------+-------------+
 |    0 |    6 |  32767 |        3021 |
 |    1 |   12 |  32767 | -2147483647 |
 |    0 |    3 |   1989 |        1002 |
 |    0 |    7 | -32767 |        1002 |
 |    1 |    8 |    255 |  2147483647 |
 |    1 |    9 |   1991 | -2147483647 |
 |    1 |   11 |   1989 |       25699 |
 |    1 |   13 | -32767 |  2147483647 |
 |    1 |   14 |    255 |         103 |
 |    0 |    1 |   1989 |        1001 |
 |    0 |    2 |   1986 |        1001 |
 |    1 |   15 |   1992 |        3021 |
 +------+------+--------+-------------+
```

 ```sql
show query stats from baseall;
```

```text
 +-------+------------+-------------+
 | Field | QueryCount | FilterCount |
 +-------+------------+-------------+
 | k0    | 1          | 0           |
 | k1    | 1          | 0           |
 | k2    | 1          | 0           |
 | k3    | 1          | 0           |
 | k4    | 0          | 0           |
 | k5    | 0          | 0           |
 | k6    | 0          | 0           |
 | k10   | 0          | 0           |
 | k11   | 0          | 0           |
 | k7    | 0          | 0           |
 | k8    | 0          | 0           |
 | k9    | 1          | 1           |
 | k12   | 0          | 0           |
 | k13   | 0          | 0           |
 +-------+------------+-------------+
```

```sql
show query stats from baseall all
```

```text
 +-----------+------------+
 | IndexName | QueryCount |
 +-----------+------------+
 | baseall   | 1          |
 +-----------+------------+
```

```sql
show query stats from baseall all verbose
```

```text
 +-----------+-------+------------+-------------+
 | IndexName | Field | QueryCount | FilterCount |
 +-----------+-------+------------+-------------+
 | baseall   | k0    | 1          | 0           |
 |           | k1    | 1          | 0           |
 |           | k2    | 1          | 0           |
 |           | k3    | 1          | 0           |
 |           | k4    | 0          | 0           |
 |           | k5    | 0          | 0           |
 |           | k6    | 0          | 0           |
 |           | k10   | 0          | 0           |
 |           | k11   | 0          | 0           |
 |           | k7    | 0          | 0           |
 |           | k8    | 0          | 0           |
 |           | k9    | 1          | 1           |
 |           | k12   | 0          | 0           |
 |           | k13   | 0          | 0           |
 +-----------+-------+------------+-------------+
```

```sql
show query stats for test_query_db
```

```text
 +----------------------------+------------+
 | TableName                  | QueryCount |
 +----------------------------+------------+
 | compaction_tbl             | 0          |
 | bigtable                   | 0          |
 | empty                      | 0          |
 | tempbaseall                | 0          |
 | test                       | 0          |
 | test_data_type             | 0          |
 | test_string_function_field | 0          |
 | baseall                    | 1          |
 | nullable                   | 0          |
 +----------------------------+------------+
```

```sql
show query stats
```

```text
 +-----------------+------------+
 | Database        | QueryCount |
 +-----------------+------------+
 | test_query_db   | 1          |
 +-----------------+------------+
```
