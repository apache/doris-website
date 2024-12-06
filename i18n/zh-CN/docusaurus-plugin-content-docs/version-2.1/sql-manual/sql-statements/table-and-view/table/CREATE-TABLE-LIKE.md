---
{
    "title": "CREATE TABLE LIKE",
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

该语句用于创建一个表结构和另一张表完全相同的空表，同时也能够可选复制一些 rollup。 

语法：

```sql
CREATE [EXTERNAL] TABLE [IF NOT EXISTS] [database.]table_name LIKE [database.]table_name [WITH ROLLUP (r1,r2,r3,...)]
```

说明：

- 复制的表结构包括 Column Definition、Partitions、Table Properties 等 
- 用户需要对复制的原表有`SELECT`权限 
- 支持复制 MySQL 等外表 
- 支持复制 OLAP Table 的 rollup

## 示例

1. 在 test1 库下创建一张表结构和 table1 相同的空表，表名为 table2

    说明：
    - 复制的表结构包括 Column Definition、Partitions、Table Properties 等 
    - 用户需要对复制的原表有`SELECT`权限 
    - 支持复制 MySQL 等外表 
    - 支持复制 OLAP Table 的 rollup

## 示例


1. 在 test1 库下创建一张表结构和 table1 相同的空表，表名为 table2

    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1
    ```

2. 在 test2 库下创建一张表结构和 test1.table1 相同的空表，表名为 table2

    ```sql
    CREATE TABLE test2.table2 LIKE test1.table1
    ```

3. 在 test1 库下创建一张表结构和 table1 相同的空表，表名为 table2，同时复制 table1 的 r1，r2 两个 rollup

    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1 WITH ROLLUP (r1,r2)
    ```

4. 在 test1 库下创建一张表结构和 table1 相同的空表，表名为 table2，同时复制 table1 的所有 rollup

    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1 WITH ROLLUP
    ```

5. 在 test2 库下创建一张表结构和 test1.table1 相同的空表，表名为 table2，同时复制 table1 的 r1，r2 两个 rollup


    ```sql
    CREATE TABLE test2.table2 LIKE test1.table1 WITH ROLLUP (r1,r2)
    ```

6. 在 test2 库下创建一张表结构和 test1.table1 相同的空表，表名为 table2，同时复制 table1 的所有 rollup


    ```sql
    CREATE TABLE test2.table2 LIKE test1.table1 WITH ROLLUP
    ```

7. 在 test1 库下创建一张表结构和 MySQL 外表 table1 相同的空表，表名为 table2


    ```sql
    CREATE TABLE test1.table2 LIKE test1.table1
    ```

## 关键词

    CREATE, TABLE, LIKE

## 最佳实践

