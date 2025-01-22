---
{
    "title": "SHOW TABLE ID",
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

### Description

This statement is used to find the corresponding database name, table name according to table id.

## Syntax

```sql
SHOW TABLE <table_id>
```

## Required parameters

**1. `<table_id>`**
> Need to find `<table_id>` of database name, table name table.

## Return value

| Column name (Column) | Type (DataType) | Notes (Notes) |
|:--------------------|:-------------|:----------|
| DbName | String | Database name |
| TableName | String | Table name |
| DbId | String | Database ID |

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege (Privilege) | Object (Object) | Notes (Notes) |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Table (table) | Currently only supports **ADMIN** permissions to perform this operation |

## Examples

- Find the corresponding database name, table name according to the table id

   ```sql
   SHOW TABLE 2261121
   ```

   ```text
   +--------+------------+---------+
   | DbName | TableName  | DbId    |
   +--------+------------+---------+
   | demo   | test_table | 2261034 |
   +--------+------------+---------+
   ```
