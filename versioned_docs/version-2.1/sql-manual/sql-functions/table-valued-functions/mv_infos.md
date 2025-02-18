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

## Syntax
```sql
MV_INFOS("database"="<database>")
```

## Required Parameters
**`<database>`**
> Specify the cluster database name to be queried


## Return Value

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
| SyncWithBaseTables     | BOOLEAN | Whether the data is synchronized with the base table. To check which partition is not synchronized, use [SHOW PARTITIONS](../../sql-statements/table-and-view/table/SHOW-PARTITIONS) |

## Examples

View all materialized views under test

```sql
select * from mv_infos("database"="test");
```
```text
+-------+--------------------------+------------------+--------+--------------------+--------------+---------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
| Id    | Name                     | JobName          | State  | SchemaChangeDetail | RefreshState | RefreshInfo                           | QuerySql                                                                                                                                                         | MvProperties                                              | MvPartitionInfo                                                                                           | SyncWithBaseTables |
+-------+--------------------------+------------------+--------+--------------------+--------------+---------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
| 19494 | mv1                      | inner_mtmv_19494 | NORMAL |                    | SUCCESS      | BUILD DEFERRED REFRESH AUTO ON MANUAL | SELECT `internal`.`test`.`user`.`k2`, `internal`.`test`.`user`.`k3` FROM `internal`.`test`.`user`                                                                      | {partition_sync_limit=100, partition_sync_time_unit=YEAR} | MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=user, relatedCol='k2', partitionCol='k2'} |                  1 |
| 21788 | test_tablet_type_mtmv_mv | inner_mtmv_21788 | NORMAL |                    | SUCCESS      | BUILD DEFERRED REFRESH AUTO ON MANUAL | SELECT `internal`.`test`.`test_tablet_type_mtmv_table`.`k2`, `internal`.`test`.`test_tablet_type_mtmv_table`.`k3` from `internal`.`test`.`test_tablet_type_mtmv_table` | {}                                                        | MTMVPartitionInfo{partitionType=SELF_MANAGE}                                                              |                  0 |
+-------+--------------------------+------------------+--------+--------------------+--------------+---------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
```

View the materialized view named mv1 under test

```sql
select * from mv_infos("database"="test") where Name = "mv1";
```
```text
+-------+------+------------------+--------+--------------------+--------------+---------------------------------------+---------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
| Id    | Name | JobName          | State  | SchemaChangeDetail | RefreshState | RefreshInfo                           | QuerySql                                                                                    | MvProperties                                              | MvPartitionInfo                                                                                           | SyncWithBaseTables |
+-------+------+------------------+--------+--------------------+--------------+---------------------------------------+---------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
| 19494 | mv1  | inner_mtmv_19494 | NORMAL |                    | SUCCESS      | BUILD DEFERRED REFRESH AUTO ON MANUAL | SELECT `internal`.`test`.`user`.`k2`, `internal`.`test`.`user`.`k3` FROM `internal`.`test`.`user` | {partition_sync_limit=100, partition_sync_time_unit=YEAR} | MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=user, relatedCol='k2', partitionCol='k2'} |                  1 |
+-------+------+------------------+--------+--------------------+--------------+---------------------------------------+---------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
```