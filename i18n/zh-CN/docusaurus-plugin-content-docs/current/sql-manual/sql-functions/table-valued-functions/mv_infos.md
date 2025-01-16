---
{
    "title": "MV_INFOS",
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

表函数，生成异步物化视图临时表，可以查看某个db中创建的异步物化视图信息。

该函数用于 from 子句中。

该函数自 2.1.0 版本支持。

## 语法
```sql
MV_INFOS("database"="<database>")
```

## 必填参数 (Required Parameters)
**`<database>`**
> 指定需要查询的集群数据库名


## 返回值

查看 mv_infos() 表结构
```sql
desc function mv_infos("database"="tpch100");
```
```text
+--------------------+---------+------+-------+---------+-------+
| Field              | Type    | Null | Key   | Default | Extra |
+--------------------+---------+------+-------+---------+-------+
| Id                 | BIGINT  | No   | false | NULL    | NONE  |
| Name               | TEXT    | No   | false | NULL    | NONE  |
| JobName            | TEXT    | No   | false | NULL    | NONE  |
| State              | TEXT    | No   | false | NULL    | NONE  |
| SchemaChangeDetail | TEXT    | No   | false | NULL    | NONE  |
| RefreshState       | TEXT    | No   | false | NULL    | NONE  |
| RefreshInfo        | TEXT    | No   | false | NULL    | NONE  |
| QuerySql           | TEXT    | No   | false | NULL    | NONE  |
| EnvInfo            | TEXT    | No   | false | NULL    | NONE  |
| MvProperties       | TEXT    | No   | false | NULL    | NONE  |
| MvPartitionInfo    | TEXT    | No   | false | NULL    | NONE  |
| SyncWithBaseTables | BOOLEAN | No   | false | NULL    | NONE  |
+--------------------+---------+------+-------+---------+-------+
```

字段含义如下：

| 字段名称                | 类型    | 说明                                                               |
|-------------------------|---------|--------------------------------------------------------------------|
| Id                      | BIGINT  | 物化视图id                                                         |
| Name                    | TEXT    | 物化视图Name                                                       |
| JobName                 | TEXT    | 物化视图对应的job名称                                               |
| State                   | TEXT    | 物化视图状态                                                       |
| SchemaChangeDetail      | TEXT    | 物化视图State变为SchemaChange的原因                                 |
| RefreshState            | TEXT    | 物化视图刷新状态                                                   |
| RefreshInfo             | TEXT    | 物化视图定义的刷新策略信息                                         |
| QuerySql                | TEXT    | 物化视图定义的查询语句                                             |
| EnvInfo                 | TEXT    | 物化视图创建时的环境信息                                           |
| MvProperties            | TEXT    | 物化视属性                                                         |
| MvPartitionInfo         | TEXT    | 物化视图的分区信息                                                 |
| SyncWithBaseTables      | BOOLEAN | 是否和base表数据同步，如需查看哪个分区不同步，请使用[SHOW PARTITIONS](../sql-reference/Show-Statements/SHOW-PARTITIONS.md) |


## 示例

- 查看 db1 下的所有物化视图

    ```sql
    mysql> select * from mv_infos("database"="db1");
    ```

- 查看 db1 下的物化视图名称为 mv1 的物化视图
    
    ```sql
    mysql> select * from mv_infos("database"="db1") where Name = "mv1";
    ```

- 查看 db1 下的物化视图名称为 mv1 的状态
    
    ```sql
    mysql> select State from mv_infos("database"="db1") where Name = "mv1";
    ```
    
