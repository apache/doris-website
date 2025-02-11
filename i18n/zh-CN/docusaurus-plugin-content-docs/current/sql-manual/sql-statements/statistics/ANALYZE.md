---
{
    "title": "ANALYZE",
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

该语句用于收集统计信息。可以针对表（可以指定具体列）或整个数据库进行列统计信息的收集。

## 语法

```sql
ANALYZE {TABLE <table_name> [ (<column_name> [, ...]) ] | DATABASE <database_name>}
    [ [ WITH SYNC ] [ WITH SAMPLE {PERCENT | ROWS} <sample_rate> ] ];
```

## 必选参数

**1. `<table_name>`**

> 指定的目标表。该参数与`<database_name>`参数必须且只能指定其中之一。

**2. `<database_name>`**

> 指定的目标数据库。该参数与`<table_name>`参数必须且只能指定其中之一。

## 可选参数

**1. `<column_name>`**

> 指定表的目标列。必须是  `table_name`  中存在的列，多个列名称用逗号分隔。

**2. `WITH SYNC`**

> 指定同步执行该ANALYZE语句。不指定时默认后台异步执行。

**3. `WITH SAMPLE {PERCENT | ROWS} <sample_rate>`**

> 指定使用抽样方式收集。当不指定时，默认为全量收集。<sample_rate> 为抽样参数，在PERCENT采样时指定抽样百分比，ROWS采样时指定抽样行数。

## 返回值

| 列名 | 说明           |
| -- |--------------|
| Job_Id | 收集作业的唯一ID           |
| Catalog_Name |   Catalog名           |
| DB_Name | 数据库名           |
| Columns | 收集的列列表         |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                                    |
|:--------------| :------------- |:------------------------------------------------|
| SELECT_PRIV   | 表（Table）    | 当执行 ANALYZE 时，需要拥有被查询的表的 SELECT_PRIV 权限 |

## 举例

1. 对lineitem表按照 10% 的比例采样收集统计数据：

```sql
ANALYZE TABLE lineitem WITH SAMPLE PERCENT 10;
```

2. 对lineitem表按采样 10 万行收集统计数据

```sql
ANALYZE TABLE lineitem WITH SAMPLE ROWS 100000;
```

