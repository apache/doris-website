---
{
    "title": "SHOW BUILD INDEX",
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

Check the status of index build tasks.

## Syntax

```sql
SHOW BUILD INDEX [ (FROM | IN) <database_name>
[ where_clause ] [ sort_clause ] [ limit_clause ] ] 
```

Where:

```sql
where_clause
  : WHERE <output_column_name = value>
```

Where:

```sql
sort_clause
  :
   ORDER BY <output_column_name>
```

Where:

```sql
limit_clause
  :
   LIMIT <n>
```
## Optional Parameters

**`<database_name>`**

> Specifies the identifier (name) of the database, which must be unique within its cluster.
>
> The identifier must start with a letter character (or any language character if unicode name support is enabled) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My Object`).
>
> Identifiers cannot use reserved keywords.
>
> For more details, see Identifier Requirements and Reserved Keywords.


**`<WHERE output_column_name = value>`**

> Specifies the output filter condition, where output_column_name must be in the output field list.

**`<ORDER BY output_column_name>`**

> Specifies the output sort column, where output_column_name must be in the output field list.

**`LIMIT <n>`**

> Specifies the limit on the number of output rows, where n must be a number.

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege | Object   | Notes |
| :-------- | :------- | :---- |
| SHOW_PRIV | Database |       |

## Usage Notes

- Currently only valid for inverted indexes, not other indexes such as bloomfilter index.
- Currently only valid for the integrated storage and computing mode, not valid for the separated storage and computing mode.

## Examples

- View all index build tasks

  ```sql
  SHOW BUILD INDEX
  ```

- View index build tasks for database database1

  ```sql
  SHOW BUILD INDEX FROM database1
  ```

- View index build tasks for table table1

  ```sql
  SHOW BUILD INDEX WHERE TableName = 'table1'
  ```

- View index build tasks for table table1, sorted by JobId and taking the first 10 rows

  ```sql
  SHOW BUILD INDEX WHERE TableName = 'table1' ORDER BY JobId LIMIT 10
  ```