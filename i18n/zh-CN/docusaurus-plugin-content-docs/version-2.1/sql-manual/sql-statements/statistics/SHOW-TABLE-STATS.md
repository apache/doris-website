---
{
    "title": "SHOW TABLE STATS",
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

该语句用来查看表的统计信息收集概况。

## 语法

```SQL
SHOW TABLE STATS <table_name>;
```

## 必选参数

**1. `<table_name>`**

> 目标表名

## 可选参数

**无**

## 返回值

| 列名 | 说明           |
| -- |--------------|
| updated_rows | 表当前更新行数           |
| query_times |   表被查询次数           |
| row_count | 表当前的总行数           |
| updated_time | 表上次更新时间         |
| columns | 收集过的列列表           |
| trigger |   收集触发方式           |
| new_partition |  是否有新分区首次导入数据           |
| user_inject | 用户是否手动注入了统计信息         |
| enable_auto_analyze | 这张表是否参与统计信息自动收集          |
| last_analyze_time |   上次收集时间          |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | 表（Table）    | 当执行 SHOW 时，需要拥有被查询的表的 SELECT_PRIV 权限 |

## 举例

1. 展示表test1的统计信息概况

```sql
SHOW TABLE STATS test1;
```

```text
+--------------+-------------+-----------+---------------------+------------------------+---------+---------------+-------------+---------------------+---------------------+
| updated_rows | query_times | row_count | updated_time        | columns                | trigger | new_partition | user_inject | enable_auto_analyze | last_analyze_time   |
+--------------+-------------+-----------+---------------------+------------------------+---------+---------------+-------------+---------------------+---------------------+
| 0            | 0           | 100000    | 2025-01-17 16:46:31 | [test1:name, test1:id] | MANUAL  | false         | false       | true                | 2025-02-05 12:17:41 |
+--------------+-------------+-----------+---------------------+------------------------+---------+---------------+-------------+---------------------+---------------------+
```
