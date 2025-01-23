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
ALTER VIEW [db_name.]<view_name> 
 ([column_definition])
AS <query_stmt>
```

Where:
```sql
column_definition:
    column_name [COMMENT 'comment'] [,...]
```

## Required Parameters

**<view_name>**
> The identifier (i.e., name) of the view; it must be unique within the database where the view is created.  
> The identifier must start with a letter character (if Unicode name support is enabled, it can be a character in any language) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My View`).  
> The identifier cannot use reserved keywords.  
> For more details, see identifier requirements and reserved keywords.

**<query_stmt>**
> The SELECT query statement that defines the view.

## Optional Parameters

**<db_name>**
> The name of the database where the view resides. If not specified, the current database is used by default.

**<column_definition>**
> The column definitions of the view.

## Access Control Requirements

| Privilege     | Object  | Notes                                 |
|---------------|---------|---------------------------------------------|
| Alter_priv    | View    | Alter_priv privilege is required on the view being modified. |
| Select_Priv   | Table, View | Select_Priv privilege is required on the tables, views, or materialized views being queried. |

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
