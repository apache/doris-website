---
{
    "title": "SHOW TABLET",
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

该语句用于显示指定 tablet id 信息（仅管理员使用）。

## 语法

```sql
SHOW TABLET <tablet_id>;
```

## 必选参数

**1. `<tablet_id>`**

> 要显示信息的特定 tablet 的 ID。

## 返回值

使用 `SHOW TABLET <tablet_id>` 时，将返回以下列：

| 列名          | 数据类型 | 说明                                                                   |
|---------------|----------|------------------------------------------------------------------------|
| DbName        | String   | 包含该 tablet 的数据库名称。                                           |
| TableName     | String   | 包含该 tablet 的表名称。                                               |
| PartitionName | String   | 包含该 tablet 的分区名称。                                             |
| IndexName     | String   | 包含该 tablet 的索引名称。                                             |
| DbId          | Int      | 数据库的 ID。                                                          |
| TableId       | Int      | 表的 ID。                                                              |
| PartitionId   | Int      | 分区的 ID。                                                            |
| IndexId       | Int      | 索引的 ID。                                                            |
| IsSync        | Boolean  | 该 tablet 是否与其副本同步。                                           |
| Order         | Int      | tablet 的顺序。                                                        |
| QueryHits     | Int      | 该 tablet 上的查询命中次数。                                           |
| DetailCmd     | String   | 获取有关该 tablet 更详细信息的命令。                                   |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限        | 对象     | 说明                                                                                                                            |
|:------------|:---------|:--------------------------------------------------------------------------------------------------------------------------------|
| Admin_priv  | Database | 需要执行数据库的管理操作，包括管理表、分区和系统级命令。                                                                       |

## 示例

显示特定 tablet 的详细信息：

```sql
SHOW TABLET 10145;
```

```text
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+------------------------------------------------------------+
| DbName | TableName | PartitionName | IndexName | DbId  | TableId | PartitionId | IndexId | IsSync | Order | QueryHits | DetailCmd                                                  |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+------------------------------------------------------------+
| test   | sell_user | sell_user     | sell_user | 10103 | 10143   | 10142       | 10144   | true   | 0     | 0         | SHOW PROC '/dbs/10103/10143/partitions/10142/10144/10145'; |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+------------------------------------------------------------+
```
