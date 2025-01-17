---
{
    "title": "DESC TABLE",
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

This statement is used to display the schema information of the specified table.

## Syntax

```sql
DESC[RIBE] [db_name.]table_name [ALL];
```

## Return Value

| column name | description                       |
| -- |-----------------------------------|
| IndexName | Table name                        |
| IndexKeysType | Table Model                       |
| Field | Column Name                       |
| Type | Data Types                        |
| Null | Whether NULL values are allowed |
| Key | Is it a key column                           |
| Default | Default Value                     |
| Extra | Display some additional information                         |
| Visible | Visible                              |
| DefineExpr | Defining Expressions                             |
| WhereClause | Filter Conditions Related Definitions                       |

## Access Control Requirements

Users executing this SQL command must have at least the following privileges:

| Privilege    | Object    | Notes                                                                                         |
|:-------------|:----------|:----------------------------------------------------------------------------------------------|
| SELECT_PRIV  | Table     | When executing DESC, you need to have the SELECT_PRIV privilege on the table being queried    |

## Usage Notes
If ALL is specified, the schema of all indexes (rollup) of the table is displayed.


## Examples

1. Display the Base table schema

```sql
DESC test_table;
```
```text
+---------+-------------+------+-------+---------+-------+
| Field   | Type        | Null | Key   | Default | Extra |
+---------+-------------+------+-------+---------+-------+
| user_id | bigint      | No   | true  | NULL    |       |
| name    | varchar(20) | Yes  | false | NULL    | NONE  |
| age     | int         | Yes  | false | NULL    | NONE  |
+---------+-------------+------+-------+---------+-------+
```

2. Display the schema of all indexes in the table

```sql
DESC demo.test_table ALL;
```

```text
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| IndexName  | IndexKeysType | Field   | Type        | InternalType | Null | Key   | Default | Extra | Visible | DefineExpr | WhereClause |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
| test_table | DUP_KEYS      | user_id | bigint      | bigint       | No   | true  | NULL    |       | true    |            |             |
|            |               | name    | varchar(20) | varchar(20)  | Yes  | false | NULL    | NONE  | true    |            |             |
|            |               | age     | int         | int          | Yes  | false | NULL    | NONE  | true    |            |             |
+------------+---------------+---------+-------------+--------------+------+-------+---------+-------+---------+------------+-------------+
```


