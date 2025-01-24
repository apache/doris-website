---
{
    "title": "KILL CONNECTION",
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

Kill a connection with a specified connection ID. This will also kill the query associated with this connection.

## Syntax

```sql
KILL [ CONNECTION ] <connection_id>
```

## Required Parameters

**<connection_id>**

> The ID of the connection. It can be queried through the SHOW PROCESSLIST statement.

## Access Control Requirements

The user executing this SQL command must be the user who owns the connection or have at least `ADMIN_PRIV` permission.

## Examples

Query `connection_id`:

```sql
show processlist;
```

Result:

```sql
+------------------+----+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+--------------+--------------+
| CurrentConnected | Id | User | Host            | LoginTime           | Catalog  | Db   | Command | Time | State | QueryId                           | Info             | FE           | CloudCluster |
+------------------+----+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+--------------+--------------+
| Yes              | 16 | root | 127.0.0.1:63746 | 2024-11-04 20:18:07 | internal | test | Query   | 0    | OK    | e4d69a1cce81468d-91c9ae32b17540e9 | show processlist | 172.16.123.1 | NULL         |
+------------------+----+------+-----------------+---------------------+----------+------+---------+------+-------+-----------------------------------+------------------+--------------+--------------+
```

Send KILL command:

```sql
KILL CONNECTION 16;
```
