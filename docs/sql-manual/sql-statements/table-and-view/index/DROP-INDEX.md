---
{
    "title": "DROP INDEX",
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

This statement is used to delete an index with a specified name from a table. Currently, only bitmap indexes are supported.

## Syntax

```sql
DROP INDEX [IF EXISTS] index_name ON [db_name.]table_name;
```

## Required Parameters

- `index_name`: The name of the index.
- `table_name`: The name of the table to which the index belongs.

## Optional Parameters

- `db_name`: The database name, optional. If not specified, the current database is used by default.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege            | Object             | Notes                                         |
|:---------------------|:-------------------|:----------------------------------------------|
| ALTER_PRIV           | Table              | DROP INDEX is an ALTER operation on the table |

## Examples

- drop index

   ```sql
   DROP INDEX IF NOT EXISTS index_name ON table1 ;
   ```

