---
{
    "title": "DESCRIBE",
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

该语句用于展示指定 table 的 schema 信息

## 语法

```sql
DESC[RIBE] [db_name.]table_name [ALL];
```

## 返回值

| 列名 | 说明           |
| -- |--------------|
| IndexName | 表名           |
| IndexKeysType |   表模型           |
| Field | 列名           |
| Type | 数据类型         |
| Null | 是否允许为 NULL 值 |
| Key | 是否为key列      |
| Default | 默认值          |
| Extra | 显示一些额外的信息    |
| Visible | 是否可见         |
| DefineExpr |     定义表达式         |
| WhereClause |     过滤条件 相关的定义         |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                                    |
|:--------------| :------------- |:---------------------------------------------|
| SELECT_PRIV   | 表（Table）    | 当执行 DESC 时，需要拥有被查询的表的 SELECT_PRIV 权限 |

## 注意事项
如果指定 ALL，则显示该 table 的所有 index(rollup) 的 schema


## 举例

1. 显示Base表Schema

```sql
DESC test_table;
```
```text
+---------+-------------+------+-------+---------+-------+
| Field   | Type        | Null | Key   | Default | Extra |
+---------+-------------+------+-------+---------+-------+
| user_id | bigint      | No   | true  | NULL    |       |
| name    | varchar(20) | Yes  | false | NULL    | NONE  |
| age     | int         | Yes  | false | NULL    | NONE  |
+---------+-------------+------+-------+---------+-------+
```

2. 显示表所有 index 的 schema

```sql
DESC demo.test_table ALL;
```

```text
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName  | IndexKeysType | Field   | Type        | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| test_table | DUP_KEYS      | user_id | bigint      | bigint       | No   | true  | NULL    |       | true    |            |             |
|            |               | name    | varchar(20) | varchar(20)  | Yes  | false | NULL    | NONE  | true    |            |             |
|            |               | age     | int         | int          | Yes  | false | NULL    | NONE  | true    |            |             |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
```