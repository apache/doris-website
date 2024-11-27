---
{
    "title": "DESC FUNCTION",
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

利用 `desc function table_valued_function` 获取对应表值函数的 Schema 信息。

## 语法

```sql
DESC FUNCTION <table_valued_function>
```

## 必选参数

1. `<table_valued_function>`: 表值函数的名字，如 CATALOGS。支持的表值函数列表，请参阅“[表值函数](../../../sql-manual/sql-functions/table-valued-functions/s3/)”章节

## 示例

查询表值函数 CATALOGS 的信息：

```sql
DESC FUNCTION catalogs();
```

结果如下：

```sql
+-------------+--------+------+-------+---------+-------+
| Field       | Type   | Null | Key   | Default | Extra |
+-------------+--------+------+-------+---------+-------+
| CatalogId   | bigint | No   | false | NULL    | NONE  |
| CatalogName | text   | No   | false | NULL    | NONE  |
| CatalogType | text   | No   | false | NULL    | NONE  |
| Property    | text   | No   | false | NULL    | NONE  |
| Value       | text   | No   | false | NULL    | NONE  |
+-------------+--------+------+-------+---------+-------+
```