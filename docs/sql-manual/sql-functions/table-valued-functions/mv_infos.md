---
{
    "title": "MV_INFOS",
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

Table function, generating temporary tables for asynchronous materialized views, which can view information about asynchronous materialized views created in a certain database.

This function is used in the from clause.

This funciton is supported since 2.1.0.

## Syntax
```sql
MV_INFOS("database"="<database>")
```

## Required Parameters
**`<database>`**
> Specify the cluster database name to be queried


## Return Value

View mv_infos() Table schema:
```sql
desc function mv_infos("database"="tpch100");
```
```text
+--------------------+---------+------+-------+---------+-------+
| Field              | Type    | Null | Key   | Default | Extra |
+--------------------+---------+------+-------+---------+-------+
| Id                 | BIGINT  | No   | false | NULL    | NONE  |
| Name               | TEXT    | No   | false | NULL    | NONE  |
| JobName            | TEXT    | No   | false | NULL    | NONE  |
| State              | TEXT    | No   | false | NULL    | NONE  |
| SchemaChangeDetail | TEXT    | No   | false | NULL    | NONE  |
| RefreshState       | TEXT    | No   | false | NULL    | NONE  |
| RefreshInfo        | TEXT    | No   | false | NULL    | NONE  |
| QuerySql           | TEXT    | No   | false | NULL    | NONE  |
| EnvInfo            | TEXT    | No   | false | NULL    | NONE  |
| MvProperties       | TEXT    | No   | false | NULL    | NONE  |
| MvPartitionInfo    | TEXT    | No   | false | NULL    | NONE  |
| SyncWithBaseTables | BOOLEAN | No   | false | NULL    | NONE  |
+--------------------+---------+------+-------+---------+-------+
```

The meaning of the fields is as follows:

| Field                  | Type    | Description                                                         |
|------------------------|---------|---------------------------------------------------------------------|
| Id                     | BIGINT  | Materialized view ID                                                |
| Name                   | TEXT    | Materialized view name                                              |
| JobName                | TEXT    | Job name corresponding to the materialized view                      |
| State                  | TEXT    | State of the materialized view                                       |
| SchemaChangeDetail     | TEXT    | Reason for the state change to SchemaChange                         |
| RefreshState           | TEXT    | Refresh state of the materialized view                               |
| RefreshInfo            | TEXT    | Refresh strategy information defined for the materialized view       |
| QuerySql               | TEXT    | SQL query defined for the materialized view                          |
| EnvInfo                | TEXT    | Environment information when the materialized view was created       |
| MvProperties           | TEXT    | Materialized view properties                                         |
| MvPartitionInfo        | TEXT    | Partition information of the materialized view                       |
| SyncWithBaseTables     | BOOLEAN | Whether the data is synchronized with the base table. To check which partition is not synchronized, use [SHOW PARTITIONS](../sql-reference/Show-Statements/SHOW-PARTITIONS.md) |

## Examples

- View all materialized views under db1
    
    ```sql
    mysql> select * from mv_infos("database"="db1");
    ```

- View the materialized view named mv1 under db1

    ```sql
    mysql> select * from mv_infos("database"="db1") where Name = "mv1";
    ```

- View the status of the materialized view named mv1 under db1

    ```sql
    mysql> select State from mv_infos("database"="db1") where Name = "mv1";
   ```
