---
{
    "title": "Feature Details",
    "language": "en",
    "description": "Apache Doris CCR (Cross Cluster Replication) feature details: supported operations, sync methods, and version requirements for databases, tables, partitions, data loading, views, materialized views, and more.",
    "keywords": [
        "Doris CCR",
        "Cross Cluster Replication",
        "CCR supported operations",
        "CCR sync methods",
        "Full Sync",
        "Partial Sync",
        "binlog sync",
        "disaster recovery sync",
        "multi-cluster data consistency"
    ]
}
---

The Cross Cluster Replication (CCR) feature in Apache Doris efficiently synchronizes data between multiple Doris clusters. It is commonly used for remote disaster recovery, read/write separation, and business continuity scenarios. This document lists the Doris operations supported by CCR, the corresponding sync methods, and the minimum version requirements, organized by **Database / Table / Data / Partition / View / Materialized View / Others**. Use it to quickly verify compatibility before setting up a CCR job.

<!-- Knowledge type: Compatibility matrix / Capability list -->
<!-- Applicable scenarios: CCR job design / Upstream-downstream version verification / Troubleshooting -->

## Applicable Scenarios

| Scenario                                  | Description                                                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Before setting up a CCR job               | Verify whether the upstream and downstream Doris versions cover the sync capabilities of the target objects (databases, tables, partitions, views, etc.) |
| Planning upstream and downstream clusters | Confirm which table properties, column operations, and partition operations can be synchronized automatically by CCR |
| Troubleshooting CCR job exceptions        | Compare against the list of unsupported or restricted operations to determine whether the exception is caused by an incompatible operation |
| Upgrading a Doris cluster                 | Evaluate the additional sync capabilities introduced after upgrading to versions such as 2.0.15, 2.1.6, 2.1.8, or 3.0.4 |

## Reading Notes

:::note

1. In the Doris Version column, `-` means the feature is supported by Doris 2.0 and later, and by all CCR versions. Doris 2.0.15, 2.1.6, or later is recommended.
2. The version requirements between CCR Syncer and Doris are: Syncer Version >= downstream Doris Version >= upstream Doris Version. Therefore, the upgrade order is: upgrade the Syncer first, then the downstream Doris, and finally the upstream Doris.
3. CCR does not currently support the storage-compute separation mode.

:::

### Sync Method Terminology

CCR uses the following methods to synchronize upstream changes to the downstream. The "Sync Method" column in the tables below uses these terms:

| Sync Method  | Meaning                                                                                              |
| ------------ | ---------------------------------------------------------------------------------------------------- |
| Full Sync    | A full synchronization. The downstream re-fetches a complete copy of the data based on an upstream snapshot. |
| Partial Sync | A partial synchronization. Only changed objects or partitions are synced, avoiding a full sync.       |
| SQL          | The DDL/DML SQL statements executed upstream are replayed on the downstream.                          |
| TXN          | Upstream transactions are synchronized through the transaction records in the binlog. The downstream starts syncing after the transaction becomes visible upstream. |

## Database

### Database Properties

For a database-level job, database properties are synchronized during Full Sync.

| Property               | Supported | Doris version | Sync Method | Description |
| ---------------------- | --------- | ------------- | ----------- | ----------- |
| replication_allocation | Yes       | -             | Full Sync   |             |
| data quota             | No        |               |             |             |
| replica quota          | No        |               |             |             |

### Modifying Database Properties

A CCR job does not synchronize operations that modify database properties.

| Property               | Supported | Can operate upstream | Can operate downstream | Description                                                  |
| ---------------------- | --------- | -------------------- | ---------------------- | ------------------------------------------------------------ |
| replication_allocation | No        | No                   | No                     | Operating independently on either side interrupts the CCR job |
| data quota             | No        | Yes                  | Yes                    |                                                              |
| replica quota          | No        | Yes                  | Yes                    |                                                              |

### Renaming Databases

Renaming is not supported on either the upstream or the downstream. If you do rename, views may stop working.

## Table

<!-- Knowledge type: Compatibility matrix -->
<!-- Applicable scenarios: Table schema design / CCR job planning -->

### Table Properties

| Property                                   | Supported | Doris version | Sync Method | Description                                                                                  |
| ------------------------------------------ | --------- | ------------- | ----------- | -------------------------------------------------------------------------------------------- |
| Table model (duplicate, unique, aggregate) | Yes       | -             | SQL         |                                                                                              |
| Partitioning and bucketing                 | Yes       | -             | SQL         |                                                                                              |
| replication_num                            | Yes       | -             | SQL         |                                                                                              |
| replication_allocation (resource group)    | Yes       | -             | SQL         | The upstream must be consistent with the downstream, and BE tags must match, otherwise the CCR job fails |
| colocate_with                              | No        |               |             |                                                                                              |
| storage_policy                             | No        |               |             |                                                                                              |
| dynamic_partition                          | Yes       | -             | SQL         |                                                                                              |
| storage_medium                             | Yes       | -             | SQL         |                                                                                              |
| auto_bucket                                | Yes       | -             | SQL         |                                                                                              |
| group_commit series                        | Yes       | -             | SQL         |                                                                                              |
| enable_unique_key_merge_on_write           | Yes       | -             | SQL         |                                                                                              |
| enable_single_replica_compaction           | Yes       | -             | SQL         |                                                                                              |
| disable_auto_compaction                    | Yes       | -             | SQL         |                                                                                              |
| compaction_policy                          | Yes       | -             | SQL         |                                                                                              |
| time_series_compaction series              | Yes       | -             | SQL         |                                                                                              |
| binlog series                              | Yes       | -             | SQL         |                                                                                              |
| variant_enable_flatten_nested              | Yes       | -             | SQL         |                                                                                              |
| skip_write_index_on_load                   | Yes       | -             | SQL         |                                                                                              |
| row_store series                           | Yes       | -             | SQL         |                                                                                              |
| seq column                                 | Yes       | -             | SQL         |                                                                                              |
| enable_light_schema_change                 | Yes       | -             | SQL         |                                                                                              |
| compression_type                           | Yes       | -             | SQL         |                                                                                              |
| index                                      | Yes       | -             | SQL         |                                                                                              |
| bloom_filter_columns                       | Yes       | -             | SQL         |                                                                                              |
| bloom_filter_fpp                           | Yes       |               |             |                                                                                              |
| storage_cooldown_time                      | No        |               |             |                                                                                              |
| generated column                           | Yes       | -             | SQL         |                                                                                              |
| auto-increment id                          | No        |               |             | Has issues                                                                                   |

### Basic Table Operations

| Operation      | Supported                                          | Doris version | Sync Method        | Can operate downstream independently        | Description                                                                                                                                                       |
| -------------- | -------------------------------------------------- | ------------- | ------------------ | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| create table   | Yes                                                | -             | SQL / Partial Sync | Operating on tables synced by a CCR job is not supported. | See the table-creation section for properties. SQL sync is used in most cases. Partial Sync is used in specific cases, for example when certain session variables are enabled at table creation or the CREATE TABLE statement contains an inverted index. |
| drop table     | Yes                                                | -             | SQL / Full Sync    | Same as above                               | Before 2.0.15 / 2.1.6: Full Sync. After: SQL.                                                                                                                     |
| rename table   | Not supported for table-level jobs, supported for database-level jobs | 2.1.8 / 3.0.4 | SQL                | Same as above                               | Executing rename in a table-level job stops the CCR job.                                                                                                          |
| replace table  | Yes                                                | 2.1.8 / 3.0.4 | SQL / Full Sync    | Same as above                               | At the database level, SQL sync is used. At the table level, a full sync is triggered.                                                                            |
| truncate table | Yes                                                | -             | SQL                | Same as above                               |                                                                                                                                                                   |
| restore table  | No                                                 |               |                    | Same as above                               |                                                                                                                                                                   |

### Modifying Table Properties

The sync method is SQL.

| Property                   | Supported | Doris version | Can operate upstream | Can operate downstream                                  | Description                                       |
| -------------------------- | --------- | ------------- | -------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| colocate                   | No        |               | Yes                  | No. Triggers Full Sync, and downstream changes are lost. |                                                   |
| distribution type          | No        |               | No                   | Same as above                                           |                                                   |
| dynamic partition          | No        |               | Yes                  | Same as above                                           |                                                   |
| replication_num            | No        |               | No                   | No                                                      |                                                   |
| replication_allocation     | No        |               | No                   |                                                         |                                                   |
| storage policy             | No        |               | No                   | No                                                      |                                                   |
| enable_light_schema_change | No        |               |                      |                                                         | CCR can only synchronize tables with light schema change |
| row_store                  | Yes       | 2.1.8 / 3.0.4 |                      |                                                         | Via Partial Sync                                  |
| bloom_filter_columns       | Yes       | 2.1.8 / 3.0.4 |                      |                                                         | Via Partial Sync                                  |
| bloom_filter_fpp           | Yes       | 2.1.8 / 3.0.4 |                      |                                                         | Via Partial Sync                                  |
| bucket num                 | No        |               | Yes                  | No. Triggers Full Sync, and downstream changes are lost. |                                                   |
| isBeingSynced              | No        |               | No                   | No                                                      |                                                   |
| compaction series properties | No      |               | Yes                  | No. Triggers Full Sync, and downstream changes are lost. |                                                   |
| skip_write_index_on_load   | No        |               | Yes                  | Same as above                                           |                                                   |
| seq column                 | Yes       | -             | Yes                  | No. Triggers Full Sync, and downstream changes are lost. |                                                   |
| delete sign column         | Yes       | -             | Yes                  | Same as above                                           |                                                   |
| comment                    | Yes       | 2.1.8 / 3.0.4 | Yes                  | No. Triggers Full Sync, and downstream changes are lost. |                                                   |

### Column Operations

Column operations on the Base Index of a table:

| Operation         | Supported | Doris version | Sync Method  | Can operate downstream            | Notes |
| ----------------- | --------- | ------------- | ------------ | --------------------------------- | ----- |
| add key column    | Yes       | -             | Partial Sync | No. Interrupts the CCR job.       |       |
| add value column  | Yes       | -             | SQL          | No. Interrupts the CCR job.       |       |
| drop key column   | Yes       | -             | Partial Sync | Same as above                     |       |
| drop value column | Yes       | -             | SQL          | Same as above                     |       |
| modify column     | Yes       | -             | Partial Sync | Same as above                     |       |
| order by          | Yes       | -             | Partial Sync | Same as above                     |       |
| rename            | Yes       | 2.1.8 / 3.0.4 | SQL          | Same as above                     |       |
| comment           | Yes       | 2.1.8 / 3.0.4 | SQL          | Same as above                     |       |

:::note

add/drop value column requires the property `"light_schema_change" = "true"` to be set at table creation.

:::

Column operations on a Rollup Index of a table:

| Operation        | Supported | Doris Version | Sync Method  | Notes                                              |
| ---------------- | --------- | ------------- | ------------ | -------------------------------------------------- |
| add key column   | Yes       | 2.1.8 / 3.0.4 | Partial Sync |                                                    |
| add value column | Yes       | 2.1.8 / 3.0.4 | SQL          | Requires light schema change to be enabled         |
| drop column      | Yes       | 2.1.8 / 3.0.4 | Partial Sync |                                                    |
| modify column    | Unknown   | 2.1.8 / 3.0.4 | Partial Sync | Doris does not support directly modifying the type of a rollup column |
| order by         | Yes       | 2.1.8 / 3.0.4 | Partial Sync |                                                    |

### Rollup

| Operation     | Supported | Doris Version | Sync Method  | Notes |
| ------------- | --------- | ------------- | ------------ | ----- |
| add rollup    | Yes       | 2.1.8 / 3.0.4 | Partial Sync |       |
| drop rollup   | Yes       | 2.1.8 / 3.0.4 | SQL          |       |
| rename rollup | Yes       | 2.1.8 / 3.0.4 | SQL          |       |

### Index

Inverted Index:

| Operation    | Supported | Doris Version | Sync Method  | Notes |
| ------------ | --------- | ------------- | ------------ | ----- |
| create index | Yes       | 2.1.8 / 3.0.4 | Partial Sync |       |
| drop index   | Yes       | 2.1.8 / 3.0.4 | SQL          |       |
| build index  | Yes       | 2.1.8 / 3.0.4 | SQL          |       |

Bloom Filter:

| Operation          | Supported | Doris Version | Sync Method  | Notes                                       |
| ------------------ | --------- | ------------- | ------------ | ------------------------------------------- |
| add bloom filter   | Yes       | 2.1.8 / 3.0.4 | Partial Sync |                                             |
| alter bloom filter | Yes       | 2.1.8 / 3.0.4 | Partial Sync | Refers to modifying bloom_filter_columns    |
| drop bloom filter  | Yes       | 2.1.8 / 3.0.4 | Partial Sync |                                             |

## Data

<!-- Knowledge type: Compatibility matrix -->
<!-- Applicable scenarios: Data loading selection / DML sync troubleshooting -->

### Loading

| Load Method  | Supported                          | Doris version | Sync Method | Can operate downstream                                                                                | Description                                                                                          |
| ------------ | ---------------------------------- | ------------- | ----------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| stream load  | Yes (except for temporary partitions) | -          | TXN         | No. If you load on the downstream, the downstream-loaded data is lost when a Full Sync or Partial Sync is triggered later. | When the upstream transaction becomes visible (that is, when the data becomes visible), a binlog is generated and the downstream starts syncing. |
| broker load  | Yes (except for temporary partitions) | -          | TXN         | Same as above                                                                                         | Same as above                                                                                        |
| routine load | Yes (except for temporary partitions) | -          | TXN         | Same as above                                                                                         | Same as above                                                                                        |
| mysql load   | Yes (except for temporary partitions) | -          | TXN         | Same as above                                                                                         | Same as above                                                                                        |
| group commit | Yes (except for temporary partitions) | 2.1        | TXN         | Same as above                                                                                         | Same as above                                                                                        |

### Data Operations

| Operation                            | Supported                          | Doris version | Sync Method  | Can operate downstream                                                                            | Description                                                                                          |
| ------------------------------------ | ---------------------------------- | ------------- | ------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| delete                               | Yes                                | -             | TXN          | No. If you operate on the downstream, the downstream changes are lost when a Full Sync or Partial Sync is triggered later. | When the upstream transaction becomes visible (that is, when the data becomes visible), a binlog is generated and the downstream starts syncing. |
| update                               | Yes                                | -             | TXN          | Same as above                                                                                     | Same as above                                                                                        |
| insert                               | Yes                                | -             | TXN          | Same as above                                                                                     | Same as above                                                                                        |
| insert into overwrite                | Yes (except for temporary partitions) | 2.1.6      | Partial Sync | Same as above                                                                                     | Same as above                                                                                        |
| insert into overwrite                | Yes (except for temporary partitions) | 2.0        | Full Sync    | Same as above                                                                                     | Same as above                                                                                        |
| Explicit transactions (3.0) begin commit | No                             |               |              |                                                                                                   |                                                                                                      |

## Partition Operations

| Operation          | Supported | Doris version | Sync Method     | Can operate downstream independently                              | Description                                                                                                                              |
| ------------------ | --------- | ------------- | --------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| add partition      | Yes       | -             | SQL             | No. A subsequent Full Sync or Partial Sync causes downstream changes to be lost. | The behavior of the cooldown time property is unknown.                                                                                   |
| add temp partition | No        |               |                 | Same as above                                                     | Backup does not support tmp partition. From Doris 2.1.8 / 3.0.4, you can work around this by modifying the upstream FE configuration: `ignore_backup_tmp_partitions`. |
| drop partition     | Yes       | -             | SQL / Full Sync | Same as above                                                     | Before 2.0.15 / 2.1.6: Full Sync. After: SQL.                                                                                            |
| replace partition  | Yes       | 2.1.7 / 3.0.3 | Partial Sync    | Same as above                                                     | Partial Sync **only supports the replace mode with strict range and non-tmp partition**. Otherwise, a Full Sync is triggered.            |
| modify partition   | No        |               |                 | Same as above                                                     | Refers to modifying the property of a partition.                                                                                         |
| rename partition   | Yes       | 2.1.8 / 3.0.4 | SQL             | Same as above                                                     |                                                                                                                                          |

## View

| Operation   | Supported | Doris version | Sync Method | Notes                                                                              |
| ----------- | --------- | ------------- | ----------- | ---------------------------------------------------------------------------------- |
| create view | Yes       | -             | SQL         | Works when the upstream and downstream names are the same. If the view already exists on the downstream, it is dropped first and then recreated. |
| alter view  | Yes       | 2.1.8 / 3.0.4 | SQL         |                                                                                    |
| drop view   | Yes       | 2.1.8 / 3.0.4 | SQL         |                                                                                    |

:::note

Due to limitations in the Doris implementation, the column name and view name within a view cannot be the same as the database name.

:::

## Materialized View

Synchronous materialized view:

| Operation                | Supported | Doris Version | Sync Method  | Notes                                                                                              |
| ------------------------ | --------- | ------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| create materialized view | Yes       | 2.1.8 / 3.0.4 | Partial Sync | Works when the upstream and downstream names are the same. When the names differ, the view must be manually recreated on the downstream. |
| drop materialized view   | Yes       | 2.1.8 / 3.0.4 | SQL          |                                                                                                    |

Asynchronous materialized view:

| Operation                      | Supported |
| ------------------------------ | --------- |
| create async materialized view | No        |
| alter async materialized view  | No        |
| drop async materialized view   | No        |
| refresh                        | No        |
| pause                          | No        |
| resume                         | No        |

## Statistics

Statistics are not synchronized between the upstream and the downstream. They work independently.

## Others

| Operation        | Supported |
| ---------------- | --------- |
| external table   | No        |
| recycle bin      | No        |
| catalog          | No        |
| workload group   | No        |
| job              | No        |
| function         | No        |
| policy           | No        |
| user             | No        |
| cancel alter job | Yes       |
