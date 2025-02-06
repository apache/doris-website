---
{
    "title": "SHOW DATA",
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

`SHOW DATA` 语句用于展示数据量、副本数量以及统计行数信息。该语句具有以下功能：

- 可以展示当前数据库下所有表的数据量和副本数量
- 可以展示指定表的物化视图数据量、副本数量和统计行数
- 可以展示数据库的配额使用情况
- 支持按照数据量、副本数量等进行排序

## 语法

```sql
SHOW DATA [ FROM [<db_name>.]<table_name> ] [ ORDER BY <order_by_clause> ];
```

其中：

```sql
order_by_clause:
    <column_name> [ ASC | DESC ] [ , <column_name> [ ASC | DESC ] ... ]
```

## 可选参数

**1. `FROM [<db_name>.]<table_name>`**

> 指定要查看的表名。可以包含数据库名称。
>
> 如果不指定此参数，则展示当前数据库下所有表的数据信息。

**2. `ORDER BY <order_by_clause>`**

> 指定结果集的排序方式。
>
> 可以对任意列进行升序（ASC）或降序（DESC）排序。
>
> 支持多列组合排序。

## 返回值

根据不同查询场景，返回以下结果集：

- 不指定 FROM 子句时（展示数据库级别信息）：

| 列名 | 说明 |
|------|------|
| DbId | 数据库 ID |
| DbName | 数据库名称 |
| Size | 数据库总数据量 |
| RemoteSize | 远程存储数据量 |
| RecycleSize | 回收站数据量 |
| RecycleRemoteSize | 回收站远程存储数据量 |

- 指定 FROM 子句时（展示表级别信息）：

| 列名 | 说明 |
|------|------|
| TableName | 表名 |
| IndexName | 索引（物化视图）名称 |
| Size | 数据大小 |
| ReplicaCount | 副本数量 |
| RowCount | 统计行数（仅在查看具体表时显示）|

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                           |
| :---------------- | :------------- | :-------------------------------------- |
| SELECT            | 表（Table）    | 需要对查看的表有 SELECT 权限            |

## 注意事项

- 数据量统计包含所有副本的总数据量
- 副本数量包含表的所有分区以及所有物化视图的副本数量
- 统计行数时，以多个副本中行数最大的那个副本为准
- 结果集中的 `Total` 行表示汇总数据
- 结果集中的 `Quota` 行表示当前数据库设置的配额
- 结果集中的 `Left` 行表示剩余配额
- 如果需要查看各个 Partition 的大小，请使用 `SHOW PARTITIONS` 命令

## 示例

- 展示所有数据库的数据量信息：

    ```sql
    SHOW DATA;
    ```

    ```
    +-------+-----------------------------------+--------+------------+-------------+-------------------+
    | DbId  | DbName                            | Size   | RemoteSize | RecycleSize | RecycleRemoteSize |
    +-------+-----------------------------------+--------+------------+-------------+-------------------+
    | 21009 | db1                               | 0      | 0          | 0           | 0                 |
    | 22011 | regression_test_inverted_index_p0 | 72764  | 0          | 0           | 0                 |
    | Total | NULL                              | 118946 | 0          | 0           | 0                 |
    +-------+-----------------------------------+--------+------------+-------------+-------------------+
    ```

- 展示当前数据库下所有表的数据量信息：

    ```sql
    USE db1;
    SHOW DATA;
    ```

    ```text
    +-----------+-------------+--------------+
    | TableName | Size        | ReplicaCount |
    +-----------+-------------+--------------+
    | tbl1      | 900.000 B   | 6            |
    | tbl2      | 500.000 B   | 3            |
    | Total     | 1.400 KB    | 9            |
    | Quota     | 1024.000 GB | 1073741824   |
    | Left      | 1021.921 GB | 1073741815   |
    +-----------+-------------+--------------+
    ```

- 展示指定表的详细数据量信息：

    ```sql
    SHOW DATA FROM example_db.test;
    ```

    ```text
    +-----------+-----------+-----------+--------------+----------+
    | TableName | IndexName | Size      | ReplicaCount | RowCount |
    +-----------+-----------+-----------+--------------+----------+
    | test      | r1        | 10.000MB  | 30           | 10000    |
    |           | r2        | 20.000MB  | 30           | 20000    |
    |           | test2     | 50.000MB  | 30           | 50000    |
    |           | Total     | 80.000    | 90           |          |
    +-----------+-----------+-----------+--------------+----------+
    ```

- 按照副本数量降序、数据量升序排序：

    ```sql
    SHOW DATA ORDER BY ReplicaCount DESC, Size ASC;
    ```

    ```text
    +-----------+-------------+--------------+
    | TableName | Size        | ReplicaCount |
    +-----------+-------------+--------------+
    | table_c   | 3.102 KB    | 40           |
    | table_d   | .000        | 20           |
    | table_b   | 324.000 B   | 20           |
    | table_a   | 1.266 KB    | 10           |
    | Total     | 4.684 KB    | 90           |
    | Quota     | 1024.000 GB | 1073741824   |
    | Left      | 1024.000 GB | 1073741734   |
    +-----------+-------------+--------------+
    ```
