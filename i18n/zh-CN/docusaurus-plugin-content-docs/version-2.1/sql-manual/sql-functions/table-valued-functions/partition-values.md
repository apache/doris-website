---
{
"title": "partition_values",
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

表函数，生成分区值临时表，可以查看某个 TABLE 的分区值列表。

该函数用于 FROM 子句中，仅支持 hive 表

## 语法

```sql
PARTITION_VALUES(
    "catalog"="<catalog>",
    "database"="<database>",
    "table"="<table>"
)
```

## 必填参数 (Required Parameters)
| 字段               | 描述                                       |
|------------------|------------------------------------------|
| `<catalog>`  | 指定需要查询的集群 catalog 名。                     |
| `<database>` | 指定需要查询的集群数据库名。                           |
| `<table>`    | 指定需要查询的集群表名。                             |

## 返回值

要查的表有几个分区字段，该表就有几列

## 示例

hive3 CATALOG 下 multi_catalog 的 text_partitioned_columns 的建表语句如下：

```sql
CREATE TABLE `text_partitioned_columns`(
  `t_timestamp` timestamp)
PARTITIONED BY (
 `t_int` int,
 `t_float` float,
 `t_string` string)
```

数据如下：

```text
mysql> select * from text_partitioned_columns;
+----------------------------+-------+---------+----------+
| t_timestamp                | t_int | t_float | t_string |
+----------------------------+-------+---------+----------+
| 2023-01-01 00:00:00.000000 |  NULL |     0.1 | test1    |
| 2023-01-02 00:00:00.000000 |  NULL |     0.2 | test2    |
| 2023-01-03 00:00:00.000000 |   100 |     0.3 | test3    |
+----------------------------+-------+---------+----------+
```

查看 hive3 CATALOG 下 multi_catalog 的 text_partitioned_columns 的分区值列表

```sql
select * from partition_values("catalog"="hive3", "database" = "multi_catalog","table" = "text_partitioned_columns");
```
```text
+-------+---------+----------+
| t_int | t_float | t_string |
+-------+---------+----------+
|   100 |     0.3 | test3    |
|  NULL |     0.2 | test2    |
|  NULL |     0.1 | test1    |
+-------+---------+----------+
```
