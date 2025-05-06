---
{
    "title": "SHOW TABLETS BELONG",
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

该语句用于显示指定 tablet 及其所属表的信息。

## 语法

```sql
SHOW TABLETS BELONG <tablet_id> [, <tablet_id>]...;
```

## 必选参数

**1. `<tablet_id>`**

> 一个或多个 tablet ID，用逗号分隔。结果中会对重复的 ID 进行去重。

## 返回值

使用 `SHOW TABLETS BELONG <tablet_id> [, <tablet_id>]...` 时，将返回以下列：

| 列名          | 数据类型 | 说明                                                                   |
|---------------|----------|------------------------------------------------------------------------|
| DbName        | String   | 包含该 tablet 的数据库名称。                                           |
| TableName     | String   | 包含该 tablet 的表名称。                                               |
| TableSize     | String   | 表的大小（例如："8.649 KB"）。                                         |
| PartitionNum  | Int      | 表中的分区数量。                                                       |
| BucketNum     | Int      | 表中的分桶数量。                                                       |
| ReplicaCount  | Int      | 表中的副本数量。                                                       |
| TabletIds     | Array    | 属于该表的 tablet ID 列表。                                            |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限        | 对象     | 说明                                                                                                                            |
|:------------|:---------|:--------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv  | Database | 需要执行数据库的管理操作，包括管理表、分区和系统级命令。                                                                       |

## 示例

显示特定 tablet 的信息：

```sql
SHOW TABLETS BELONG 10145;
```

```text
+--------+-----------+-----------+--------------+-----------+--------------+-----------+
| DbName | TableName | TableSize | PartitionNum | BucketNum | ReplicaCount | TabletIds |
+--------+-----------+-----------+--------------+-----------+--------------+-----------+
| test   | sell_user | 8.649 KB  | 1            | 4         | 4            | [10145]   |
+--------+-----------+-----------+--------------+-----------+--------------+-----------+
```

显示多个 tablet 的信息：

```sql
SHOW TABLETS BELONG 27028,78880,78382,27028;
```

```text
+---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
| DbName              | TableName | TableSize | PartitionNum | BucketNum | ReplicaCount | TabletIds      |
+---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
| default_cluster:db1 | kec       | 613.000 B | 379          | 604       | 604          | [78880, 78382] |
| default_cluster:db1 | test      | 1.874 KB  | 1            | 1         | 1            | [27028]        |
+---------------------+-----------+-----------+--------------+-----------+--------------+----------------+
```
