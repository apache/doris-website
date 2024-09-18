---
{
"title": "QUERY",
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

## query

### Name

query

### description

query 表函数（table-valued-function,tvf），可用于将查询语句直接透传到某个 catalog 进行数据查询

:::info note
Doris 2.1.3 版本开始支持，当前仅支持透传查询 jdbc catalog。
需要先在 Doris 中创建对应的 catalog。
:::

#### syntax

```sql
query(
  "catalog" = "catalog_name", 
  "query" = "select * from db_name.table_name where condition"
  );
```

**参数说明**

query表函数 tvf中的每一个参数都是一个 `"key"="value"` 对。
相关参数：
- `catalog`： (必填) catalog名称，需要按照catalog的名称填写。
- `query`： (必填) 需要执行的查询语句。

### Example

使用 query 函数查询 jdbc 数据源中的表

```sql
select * from query("catalog" = "jdbc", "query" = "select * from db_name.table_name where condition");
```

可以配合`desc function`使用

```sql
desc function query("catalog" = "jdbc", "query" = "select * from db_name.table_name where condition");
```

### Keywords

    query, table-valued-function, tvf

### Best Prac

透传查询 jdbc catalog 数据源中的表

```sql
select * from query("catalog" = "jdbc", "query" = "select * from test.student");
+------+---------+
| id   | name    |
+------+---------+
| 1    | alice   |
| 2    | bob     |
| 3    | jack    |
+------+---------+
select * from query("catalog" = "jdbc", "query" = "select * from test.score");
+------+---------+
| id   | score   |
+------+---------+
| 1    | 100     |
| 2    | 90      |
| 3    | 80      |
+------+---------+
```

透传关联查询 jdbc catalog 数据源中的表

```sql
select * from query("catalog" = "jdbc", "query" = "select a.id, a.name, b.score from test.student a join test.score b on a.id = b.id");
+------+---------+---------+
| id   | name    | score   |
+------+---------+---------+
| 1    | alice   | 100     |
| 2    | bob     | 90      |
| 3    | jack    | 80      |
+------+---------+---------+
```
