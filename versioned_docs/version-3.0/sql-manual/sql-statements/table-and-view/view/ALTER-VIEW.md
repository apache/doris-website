---
{
  "title": "ALTER VIEW",
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

This statement is used to modify the definition of a logical view.

## Syntax

```sql
ALTER VIEW [<db_name>.]<view_name> 
 [(<column_definition>)]
AS <query_stmt>
```

Where:
```sql
column_definition:
    <column_name> [COMMENT '<comment>'] [,...]
```

## Required Parameters

**1. `<view_name>`**
> The identifier (i.e., name) of the view to be modified.

**2. `<query_stmt>`**
> The SELECT query statement that defines the view.

## Optional Parameters

**1. `<db_name>`**
> The name of the database where the view resides. If not specified, the current database is used by default.

**2. `<column_definition>`**
> The column definitions of the view.  
> Where:  
> **1. `<column_name>`**  
> Column name.  
> **2. `<comment>`**  
> Column comment.

## Access Control Requirements

| Privilege     | Object   | Notes                                                                 |
|---------------|----------|-----------------------------------------------------------------------|
| ALTER_PRIV   | View     | ALTER_PRIV privilege is required on the view being modified.         |
| SELECT_PRIV  | Table, View | SELECT_PRIV privilege is required on the tables, views, or materialized views being queried. |

## Example

1. Modify the view `example_view` on `example_db`

  ```sql
  ALTER VIEW example_db.example_view
  (
    c1 COMMENT "column 1",
    c2 COMMENT "column 2",
    c3 COMMENT "column 3"
  )
  AS SELECT k1, k2, SUM(v1) FROM example_table 
  GROUP BY k1, k2
  ```