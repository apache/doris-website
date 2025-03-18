---
{
    "title": "Feature Details",
    "language": "en-US"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

The Cross-Cluster Replication (CCR) feature in Doris is primarily used for efficiently synchronizing data between multiple clusters, thereby enhancing business continuity and disaster recovery capabilities. CCR supports various operations in Doris, ensuring data consistency across different clusters. Below are the details of the main Doris operations supported by CCR.

:::note

1. The `-` in Doris Version indicates Doris version 2.0 and above, all versions of CCR. It is recommended to use Doris version 2.0.15 or 2.1.6 or later.
2. Version requirements for CCR Syncer and Doris: Syncer Version >= Downstream Doris Version >= Upstream Doris Version. Therefore, upgrade Syncer first, then the downstream Doris, and finally the upstream Doris.
3. CCR currently does not support the separation of storage and computation.

:::

## Database

### Database Properties

Database-level jobs will synchronize the properties of the database during Full Sync.

| Property                | Supported | Doris Version | Sync Method | Description |
| ----------------------- | --------- | ------------- | ----------- | ----------- |
| replication_allocation  | Supported | -             | Full Sync   |             |
| data quota              | Not Supported |           |             |             |
| replica quota           | Not Supported |           |             |             |

### Modify Database Properties

CCR jobs do not synchronize operations that modify database properties.

| Property                | Supported | Can Upstream Operate | Can Downstream Operate | Description                              |
| ----------------------- | --------- | -------------------- | ---------------------- | ---------------------------------------- |
| replication_allocation  | Not Supported | No                 | No                     | Operations on both sides will cause CCR jobs to be interrupted |
| data quota              | Not Supported | Yes                | Yes                    |                                          |
| replica quota           | Not Supported | Yes                | Yes                    |                                          |

### Rename Database

Renaming is not supported for upstream and downstream; if done, it may cause views to stop working.

## Table
### Table Properties

| Property                                      | Supported | Doris Version | Sync Method | Description                                                     |
| --------------------------------------------- | --------- | ------------- | ----------- | -------------------------------------------------------------- |
| Table Model (duplicate, unique, aggregate)    | Supported | -             | SQL         |                                                                |
| Partition and Bucketing                        | Supported | -             | SQL         |                                                                |
| replication_num                               | Supported | -             | SQL         |                                                                |
| replication_allocation (resource group)       | Supported | -             | SQL         | Upstream must be consistent with downstream, BE tags must match; otherwise, CCR jobs will fail |
| colocate_with                                 | Not Supported |           |             |                                                                |
| storage_policy                                 | Not Supported |           |             |                                                                |
| dynamic_partition                              | Supported | -             | SQL         |                                                                |
| storage_medium                                 | Supported | -             | SQL         |                                                                |
| auto_bucket                                    | Supported | -             | SQL         |                                                                |
| group_commit series                           | Supported | -             | SQL         |                                                                |
| enable_unique_key_merge_on_write              | Supported | -             | SQL         |                                                                |
| enable_single_replica_compaction              | Supported | -             | SQL         |                                                                |
| disable_auto_compaction                       | Supported | -             | SQL         |                                                                |
| compaction_policy                             | Supported | -             | SQL         |                                                                |
| time_series_compaction series                 | Supported | -             | SQL         |                                                                |
| binlog series                                 | Supported | -             | SQL         |                                                                |
| skip_write_index_on_load                      | Supported | -             | SQL         |                                                                |
| row_store series                               | Supported | -             | SQL         |                                                                |
| seq column                                    | Supported | -             | SQL         |                                                                |
| enable_light_schema_change                    | Supported | -             | SQL         |                                                                |
| compression_type                              | Supported | -             | SQL         |                                                                |
| index                                         | Supported | -             | SQL         |                                                                |
| bloom_filter_columns                          | Supported | -             | SQL         |                                                                |
| bloom_filter_fpp                              | Supported |               |             |                                                                |
| storage_cooldown_time                         | Not Supported |           |             |                                                                |
| generated column                               | Supported | -             | SQL         |                                                                |
| auto-increment id                             | Not Supported |           |             | Has issues                                                   |

### Basic Table Operations

| Operation      | Supported | Doris Version | Sync Method | Can Downstream Operate Independently | Description |
| -------------- | --------- | ------------- | ----------- | ------------------------------------ | ----------- |
| create table   | Supported | -             | SQL/Partial Sync | Cannot operate on tables synchronized by CCR jobs. | Refer to the properties for creating tables; in most cases, use SQL for synchronization; for some operations, such as when users set certain session variables or when the create table statement includes inverted indexes, use partial sync |
| drop table     | Supported | -             | SQL/Full Sync | Same as above | Before 2.0.15/2.1.6: Full Sync, after: SQL |
| rename table   | Table-level jobs do not support database-level jobs | 2.1.8/3.0.4 | SQL | Same as above | Table-level job renames will cause CCR jobs to stop |
| replace table  | Supported | 2.1.8/3.0.4 | SQL/Full Sync | Same as above | Use SQL for database-level synchronization; table-level triggers full synchronization |
| truncate table | Supported | -             | SQL | Same as above | |
| restore table  | Not Supported | | | Same as above | |

### Modify Table Properties

The synchronization method is SQL.

| Property                       | Supported | Doris Version | Can Upstream Operate | Can Downstream Operate | Description                                    |
| ------------------------------ | --------- | ------------- | -------------------- | ---------------------- | ---------------------------------------------- |
| colocate                       | Not Supported |           | Yes                  | No                     | Triggering full sync on downstream operations will cause data loss |
| distribution type              | Not Supported |           | No                   | Same                   |                                                |
| dynamic partition              | Not Supported |           | Yes                  | Same                   |                                                |
| replication_num                | Not Supported |           | No                   | No                     |                                                |
| replication_allocation         | Not Supported |           | No                   |                        |                                                |
| storage policy                 | Not Supported |           | No                   | No                     |                                                |
| enable_light_schema_change     | Not Supported |           |                      |                        | CCR can only synchronize lightweight schema changes. |
| row_store                      | Supported | 2.1.8/3.0.4 |                      |                        | Through Partial Sync |
| bloom_filter_columns           | Supported | 2.1.8/3.0.4 |                      |                        | Through Partial Sync |
| bloom_filter_fpp               | Supported | 2.1.8/3.0.4 |                      |                        | Through Partial Sync |
| bucket num                     | Not Supported |           | Yes                  | No                     | Triggering full sync on downstream operations will cause data loss |
| isBeingSynced                  | Not Supported |           | No                   | No                     |                                                |
| compaction series properties    | Not Supported |           | Yes                  | No                     | Triggering full sync on downstream operations will cause data loss |
| skip_write_index_on_load       | Not Supported |           | Yes                  | Same                   |                                                |
| seq column                     | Supported | -             | Yes                  | No                     | Triggering full sync on downstream operations will cause data loss |
| delete sign column             | Supported | -             | Yes                  | Same                   |                                                |
| comment                        | Supported | 2.1.8/3.0.4 | Yes                  | No                     | Triggering full sync on downstream operations will cause data loss |

### Column Operations

Column operations on Base Index in the table.

| Operation          | Supported | Doris Version | Sync Method           | Can Downstream Operate | Remarks                            |
| ------------------ | --------- | ------------- | --------------------- | ---------------------- | ---------------------------------- |
| add key column     | Supported | -             | Partial Sync          | No                     |                                    |
| add value column   | Supported | -             | SQL                   | No                     |                                    |
| drop key column    | Supported | -             | Partial Sync          | Same                   |                                    |
| drop value column  | Supported | -             | SQL                   | Same                   |                                    |
| modify column      | Supported | -             | Partial Sync          | Same                   |                                    |
| order by           | Supported | -             | Partial Sync          | Same                   |                                    |
| rename             | Supported | 2.1.8/3.0.4  | SQL                   | Same                   |                                    |
| comment            | Supported | 2.1.8/3.0.4  | SQL                   | Same                   |                                    |

:::note

Adding/dropping value columns requires setting the property `"light_schema_change" = "true"` when creating the table.

:::

Column operations on Rollup Index in the table.

| Operation          | Supported | Doris Version | Sync Method           | Remarks              |
| ------------------ | --------- | ------------- | --------------------- | -------------------- |
| add key column     | Supported | 2.1.8/3.0.4  | Partial Sync          |                      |
| add value column   | Supported | 2.1.8/3.0.4  | SQL                   | Requires enabling lightning schema change |
| drop column        | Supported | 2.1.8/3.0.4  | Partial Sync          |                      |
| modify column      | Unknown   | 2.1.8/3.0.4  | Partial Sync          | Doris does not support directly modifying rollup column types |
| order by           | Supported | 2.1.8/3.0.4  | Partial sync          |                      |

### Rollup

| Operation          | Supported | Doris Version | Sync Method           | Remarks         |
| ------------------ | --------- | ------------- | --------------------- | ---------------- |
| add rollup         | Supported | 2.1.8/3.0.4  | Partial Sync          |                  |
| drop rollup        | Supported | 2.1.8/3.0.4  | SQL                   |                  |
| rename rollup      | Supported | 2.1.8/3.0.4  | SQL                   |                  |

### Index

Inverted Index

| Operation         | Supported | Doris Version | Sync Method           | Remarks     |
| ------------------ | --------- | ------------- | --------------------- | ----------- |
| create index      | Supported | 2.1.8/3.0.4  | Partial Sync          |             |
| drop index        | Supported | 2.1.8/3.0.4  | SQL                   |             |
| build index       | Supported | 2.1.8/3.0.4  | SQL                   |             |

Bloom Filter

| Operation         | Supported | Doris Version | Sync Method           | Remarks     |
| ------------------ | --------- | ------------- | --------------------- | ----------- |
| add bloom filter   | Supported | 2.1.8/3.0.4  | Partial Sync          |             |
| alter bloom filter | Supported | 2.1.8/3.0.4  | Partial Sync          | This refers to modifying bloom_filter_columns |
| drop bloom filter  | Supported | 2.1.8/3.0.4  | Partial Sync          |             |

## Data

### Import

| Import Method     | Supported             | Doris Version | Sync Method | Can Downstream Operate                                             | Description                                                 |
| ------------------ | -------------------- | ------------- | ----------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| stream load        | Supported (except for temporary partitions) | -             | TXN         | No, if downstream imports, subsequent triggers of full or Partial Sync will cause data loss | Upstream transactions are visible, i.e., data is visible when generating binlog, downstream starts syncing. |
| broker load        | Supported (except for temporary partitions) | -             | TXN         | Same                                                         | Same                                                      |
| routine load       | Supported (except for temporary partitions) | -             | TXN         | Same                                                         | Same                                                      |
| mysql load         | Supported (except for temporary partitions) | -             | TXN         | Same                                                         | Same                                                      |
| group commit       | Supported (except for temporary partitions) | 2.1           | TXN         | Same                                                         | Same                                                      |

### Data Operations

| Operation                      | Supported             | Doris Version | Sync Method     | Can Downstream Operate                                             | Description                                                 |
| ------------------------------- | -------------------- | ------------- | ---------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| delete                          | Supported             | -             | TXN              | No, if downstream operates, subsequent triggers of full or Partial Sync will cause data loss | Upstream transactions are visible, i.e., data is visible when generating binlog, downstream starts syncing. |
| update                          | Supported             | -             | TXN              | Same                                                         | Same                                                      |
| insert                          | Supported             | -             | TXN              | Same                                                         | Same                                                      |
| insert into overwrite           | Supported (except for temporary partitions) | 2.1.6         | Partial Sync | Same                                                         | Same                                                      |
| insert into overwrite           | Supported (except for temporary partitions) | 2.0           | full sync    | Same                                                         | Same                                                      |
| Explicit transaction (3.0) begin commit | Not Supported |               |                  |                                                              |                                                          |

## Partition Operations

| Operation               | Supported                        | Doris Version | Sync Method            | Can Downstream Operate Independently                                        | Description                                                         |
| ----------------------- | ------------------------------- | ------------- | ---------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| add partition           | Supported                       | -             | SQL                    | No, subsequent triggers of Full Sync or Partial Sync will cause downstream operations to be lost | Cooldown time property and its behavior are unknown |
| add temp partition      | Not Supported                   |               |                        | Same                                                         | Backup does not support temp partition; starting from Doris 2.1.8/3.0.4, you can modify upstream FE configuration: `ignore_backup_tmp_partitions` to bypass this issue |
| drop partition          | Supported                       | -             | SQL/Full Sync          | Same                                                         | Before 2.0.15/2.1.6: Full Sync, after: SQL |
| replace partition       | Supported                       | 2.1.7/3.0.3  | Partial Sync           | Same                                                         | Partial Sync **only supports strict range and non-temp partition replace method**, otherwise it will trigger Full Sync. |
| modify partition        | Not Supported                   |               |                        | Same                                                         | Refers to modifying the property of the partition |
| rename partition        | Supported                       | 2.1.8/3.0.4  | SQL                    | Same                                                         | |

## Views

| Operation        | Supported | Doris Version | Sync Method | Remarks                             |
| ---------------- | --------- | ------------- | ----------- | ---------------------------------- |
| create view      | Supported | -             | SQL         | Can work when upstream and downstream have the same name; if downstream already exists, it will be deleted before creation |
| alter view       | Supported | 2.1.8/3.0.4  | SQL         |                                    |
| drop view        | Supported | 2.1.8/3.0.4  | SQL         |                                    |

::: note

Due to limitations in Doris implementation, column names/view names in views cannot be the same as database names.

:::

## Materialized Views

Synchronizing materialized views

| Operation                     | Supported | Doris Version | Sync Method | Remarks                                                         |
| ----------------------------- | --------- | ------------- | ----------- | -------------------------------------------------------------- |
| create materialized view      | Supported | 2.1.8/3.0.4  | Partial Sync | Can work when upstream and downstream have the same name; if different names, downstream needs to manually rebuild the view. |
| drop materialized view        | Supported | 2.1.8/3.0.4  | SQL         |                                                              |


Asynchronous materialized views

| Operation                           | Supported |
| ----------------------------------- | --------- |
| create async materialized view      | Not Supported |
| alter async materialized view       | Not Supported |
| drop async materialized view        | Not Supported |
| refresh                             | Not Supported |
| pause                               | Not Supported |
| resume                              | Not Supported |

## Statistics

Not synchronized between upstream and downstream, operate independently.

## Others

| Operation             | Supported |
| --------------------- | --------- |
| external table        | Not Supported |
| recycle bin           | Not Supported |
| catalog               | Not Supported |
| workload group        | Not Supported |
| job                   | Not Supported |
| function              | Not Supported |
| policy                | Not Supported |
| user                  | Not Supported |
| cancel alter job      | Supported |
