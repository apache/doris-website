---
{
  "title": "QUERY",
  "language": "en"
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

## Description

Query table function (table-valued-function, tvf) can be used to transparently transmit query statements directly to a catalog for data query

Supported by Doris version 2.1.3, currently only transparent query jdbc catalog is supported.
You need to create the corresponding catalog in Doris first.


## Syntax

```sql
QUERY(
    "catalog" = "<catalog>", 
    "query" = "<query_sql>"
  );
```

## Required Parameters
Each parameter in the query table function tvf is a `"key"="value"` pair.

| Field      | Description                                |
|------------|--------------------------------------------|
| `catalog`  | Catalog name, which needs to be filled in according to the name of the catalog. |
| `query`    | The query statement to be executed.       |


## Examples

Can be used with `desc function`

```sql
desc function query("catalog" = "jdbc", "query" = "select * from test.student");
```
```text
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| id    | int  | Yes  | true  | NULL    |       |
| name  | text | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```

Transparent query for tables in jdbc catalog data source

```sql
select * from query("catalog" = "jdbc", "query" = "select * from test.student");
```
```text
+------+---------+
| id   | name    |
+------+---------+
| 1    | alice   |
| 2    | bob     |
| 3    | jack    |
+------+---------+
```
```sql
select * from query("catalog" = "jdbc", "query" = "select * from test.score");
```
```text
+------+---------+
| id   | score   |
+------+---------+
| 1    | 100     |
| 2    | 90      |
| 3    | 80      |
+------+---------+
```

Transparent join query for tables in jdbc catalog data source

```sql
select * from query("catalog" = "jdbc", "query" = "select a.id, a.name, b.score from test.student a join test.score b on a.id = b.id");
```
```
+------+---------+---------+
| id   | name    | score   |
+------+---------+---------+
| 1    | alice   | 100     |
| 2    | bob     | 90      |
| 3    | jack    | 80      |
+------+---------+---------+
```
