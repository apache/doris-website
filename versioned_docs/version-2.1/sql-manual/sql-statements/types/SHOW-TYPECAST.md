---
{
    "title": "SHOW TYPECAST",
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

View all type cast under the database. If the user specifies a database, then view the corresponding database, otherwise directly query the database where the current session is located


## Syntax

```sql
SHOW TYPE_CAST [ IN | FROM <db>]
```

## Required Parameters

**1. `<db>`**

The name of the database to query.

## Return Value

| Column Name | Description      |
|-------------|------------------|
| Origin Type | Original Type    |
| Cast Type   | Conversion Type  |

## Access Control Requirements
The user executing this SQL command must have at least the following privileges:

| Privilege      | Object           | Notes                                      |
|----------------|------------------|--------------------------------------------|
| Select_priv    | Database (DB)    | The user or role must have Select_priv on the DB to view all type conversions under the database |


## Usage Notes

If a database is specified by the user, the system will query the specified database; otherwise, it will query the database associated with the current session by default.

## Example

- View all type casts in database TESTDB

```sql
mysql> show type_cast in testDb\G
**************************** 1. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2
**************************** 2. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2
**************************** 3. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2
```

- View all type casts in the current session's database

```sql
SHOW TYPE_CAST;
```
```text
**************************** 1. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2
**************************** 2. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2
**************************** 3. row ******************** ******
Origin Type: TIMEV2
  Cast Type: TIMEV2
```

