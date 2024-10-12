---
{
    "title": "别名函数",
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

## 概念介绍

别名函数，是指为函数起一个别名。通过在系统中为一个函数或表达式片段注册一个新的签名，可以达到提升兼容性或增加便利性的目的。

别名函数和其他自定义函数一样，支持两个作用域：`LOCAL` 和 `GLOBAL`。

- `LOCAL`：别名函数注册在当前数据库作用域下。如果需要在其他数据库下使用此别名函数，需要使用它的全限定名称，即 `<所属数据库名>.<函数名>`。

- `GLOBAL`：别名函数注册在全局作用域下。它可以在任意数据库下通过函数名直接访问。

## 使用场景

### 为函数起别名

该场景常见于系统迁移，当用户侧存在已有的、目标为其他数据库系统的查询时，可能在查询中存在一些与 Doris 中某个函数功能一致但名称不同的函数。这时，通过为这个函数定义一个新的别名函数，可以在用户侧无感的情况下完成迁移。

### 简化查询语句

该场景常见于复杂的分析，当书写复杂的查询语句时，可能在一个语句或不同语句中存在大量的重复性表达式片段。这时，通过为这一段复杂的表达式创建一个别名函数，可以简化查询语句，提升书写便利性和可维护性。

## 支持范围

### 表达式要求

当前，别名函数要求指向的真实表达式的根节点必须为函数表达式。

合法的例子：

```sql
-- 创建一个名为 func，参数为 INT, INT 的别名函数，实际指向的表达式为 abs(foo + bar);
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS abs(foo + bar);

-- 创建一个名为 func，参数为 DATETIMEV2(3), INT 的别名函数，实际指向的表达式为 date_trunc(days_sub(foo, bar), 'day')
CREATE ALIAS FUNCTION func(DATETIMEV2(3), INT) WITH PARAMETER (foo, bar) as date_trunc(days_sub(foo, bar), 'day')
```

不合法的例子：

```sql
-- 根表达式不是函数
CREATE ALIAS FUNCTION func(INT, INT) WITH PARAMETER(foo, bar) AS foo + bar;
```

### 参数要求

当前别名函数不支持变长参数，且至少有一个参数。

## 更多内容

除别名函数外，Doris 支持 Java UDF、UDTF 功能，详细信息可参考文档 [Java UDF](../../query-data/udf/java-user-defined-function)。