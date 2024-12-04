---
{
    "title": "DROP STATS",
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

Delete statistics information for the specified table and columns. If no column names are specified, the statistics information for all columns will be deleted.

## Syntax

```sql
DROP STATS <table_name> [ <column_names> ]
```

Where:

```sql
column_names
  :
  (<column_name>, [ <column_name>... ])
```

## ## Required Parameters

**<table_name>**

> The identifier (name) of the table.

## Optional Parameters

**<column_names>**

> List of column identifiers (names).

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| DROP_PRIV | Table  |       |

## Examples

- Delete statistics information for all columns in table1

  ```sql
  DROP STATS table1
  ```
- Delete statistics information for col1 and col2 in table1

  ```sql
  DROP STATS table1 (col1, col2)
  ```