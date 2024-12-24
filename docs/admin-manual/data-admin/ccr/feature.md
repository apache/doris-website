---
{
    "title": "Feature Details",
    "language": "en-US"
}
---

The Cross-Cluster Replication (CCR) feature in Doris is primarily used to efficiently synchronize data across multiple clusters, enhancing business continuity and disaster recovery. CCR supports various operations in Doris, ensuring data consistency across different clusters. Below are the details of the main Doris operations supported by CCR.

:::note

1. The `-` in Doris Version indicates Doris 2.0 or higher versions, supporting all CCR versions. It is recommended to use Doris 2.0.15 or 2.1.6 or later versions.
2. CCR Syncer and Doris version requirements: Syncer Version >= downstream Doris Version >= upstream Doris Version. Therefore, first upgrade Syncer, then the downstream Doris, and finally the upstream Doris.

:::

## Database

### Database Properties

Database-level tasks synchronize database properties during Full Sync.

| Property              | Supported | Doris Version | Sync Method   | Description |
| --------------------- | --------- | ------------- | ------------ | ----------- |
| replication_allocation | Supported | -             | Full Sync    |             |
| data quota            | Not Supported |           |              |             |
| replica quota         | Not Supported |           |              |             |

### Modifying Database Properties

CCR tasks do not synchronize database property modification operations.

| Property              | Supported | Upstream Can Modify | Downstream Can Modify | Description                       |
| --------------------- | --------- | ------------------ | -------------------- | --------------------------------- |
| replication_allocation | Not Supported | No                 | No                   | Modifications cause CCR task failure |
| data quota            | Not Supported | Yes                | Yes                  |                                   |
| replica quota         | Not Supported | Yes                | Yes                  |                                   |

### Renaming Database

Renaming is not supported for upstream and downstream. Doing so might cause views to stop working.

## Table

### Table Properties

| Property                             | Supported | Doris Version | Sync Method | Description |
| ------------------------------------ | --------- | ------------- | ----------- | ----------- |
| Table model (duplicate, unique, aggregate) | Supported | -             | SQL         |             |
| Partition and bucket                | Supported | -             | SQL         |             |
| replication_num                     | Supported | -             | SQL         |             |
| replication_allocation (resource group) | Supported | -             | SQL         | Upstream and downstream must match; BE tags must match, otherwise the CCR task will fail |
| colocate_with                        | Not Supported |           |             |             |
| storage_policy                       | Not Supported |           |             |             |
| dynamic_partition                    | Supported | -             | SQL         |             |
| storage_medium                       | Supported | -             | SQL         |             |
| auto_bucket                          | Supported | -             | SQL         |             |
| group_commit series                  | Supported | -             | SQL         |             |
| enable_unique_key_merge_on_write     | Supported | -             | SQL         |             |
| enable_single_replica_compaction     | Supported | -             | SQL         |             |
| disable_auto_compaction              | Supported | -             | SQL         |             |
| compaction_policy                    | Supported | -             | SQL         |             |
| time_series_compaction series        | Supported | -             | SQL         |             |
| binlog series                        | Supported | -             | SQL         |             |
| variant_enable_flatten_nested        | Supported | -             | SQL         |             |
| skip_write_index_on_load             | Supported | -             | SQL         |             |
| row_store series                     | Supported | -             | SQL         |             |
| seq column                           | Supported | -             | SQL         |             |
| enable_light_schema_change           | Supported | -             | SQL         |             |
| compression_type                     | Supported | -             | SQL         |             |
| index                                 | Supported | -             | SQL         |             |
| bloom_filter_columns                 | Supported | -             | SQL         |             |
| bloom_filter_fpp                     | Supported |               |             |             |
| storage_cooldown_time                | Not Supported |           |             |             |
| generated column                     | Supported | -             | SQL         |             |
| Auto-increment ID                    | Not Supported |           |             | Issues with this feature            |

### Basic Table Operations

| Operation       | Supported | Doris Version | Sync Method | Downstream Can Operate Independently | Description |
| --------------- | --------- | ------------- | ----------- | ----------------------------------- | ----------- |
| create table    | Supported | -             | SQL/Partial Sync | No                                  | Table creation synced by SQL or partial sync depending on certain settings |
| drop table      | Supported | -             | SQL/Full Sync   | No                                  | 2.0.15/2.1.6 and earlier use Full Sync, later use SQL |
| rename table    | Not Supported | 2.1.8/3.0.4  | SQL             | No                                  | Renaming will stop the CCR task |
| replace table   | Supported | 2.1.8/3.0.4  | SQL/Full Sync   | No                                  | Full Sync triggered for table-level tasks |
| truncate table  | Supported | -             | SQL             | No                                  |             |
| restore table   | Not Supported |             |               |                                    |             |

### Modifying Table Properties

Sync method is SQL.

| Property                | Supported | Doris Version | Upstream Can Modify | Downstream Can Modify | Description                              |
| ----------------------- | --------- | ------------- | ------------------ | --------------------- | ---------------------------------------- |
| colocate                | Not Supported |             | Yes                | No                    | Triggering Full Sync causes data loss at downstream |
| distribution type       | Not Supported |             | No                 | No                    |                                          |
| dynamic partition       | Not Supported |             | Yes                | No                    |                                          |
| replication_num         | Not Supported |             | No                 | No                    |                                          |
| replication_allocation  | Not Supported |             | No                 |                       |                                          |
| storage policy          | Not Supported |             | No                 | No                    |                                          |
| enable_light_schema_change | Not Supported |             |                    |                       | CCR can only sync light schema changes |
| row_store               | Supported | 2.1.8/3.0.4  |                    |                       | Through Partial Sync                     |
| bloom_filter_columns    | Supported | 2.1.8/3.0.4  |                    |                       | Through Partial Sync                     |
| bloom_filter_fpp        | Supported | 2.1.8/3.0.4  |                    |                       | Through Partial Sync                     |
| bucket num              | Not Supported |             | Yes                | No                    |                                          |
| isBeingSynced           | Not Supported |             | No                 | No                    |                                          |
| compaction series       | Not Supported |             | Yes                | No                    |                                          |
| skip_write_index_on_load | Not Supported |             | Yes                | No                    |                                          |
| seq column              | Supported | -             | Yes                | No                    |                                          |
| delete sign column      | Supported | -             | Yes                | No                    |                                          |
| comment                 | Supported | 2.1.8/3.0.4  | Yes                | No                    |                                          |

### Column Operations

Base Index Column Operations

| Operation             | Supported | Doris Version | Sync Method      | Downstream Can Operate Independently | Description |
| --------------------- | --------- | ------------- | ---------------- | ----------------------------------- | ----------- |
| add key column         | Supported | -             | Partial Sync     | No                                  |             |
| add value column       | Supported | -             | SQL              | No                                  |             |
| drop key column        | Supported | -             | Partial Sync     | No                                  |             |
| drop value column      | Supported | -             | SQL              | No                                  |             |
| modify column          | Supported | -             | Partial Sync     | No                                  |             |
| order by               | Supported | -             | Partial Sync     | No                                  |             |
| rename                 | Supported | 2.1.8/3.0.4  | SQL              | No                                  |             |
| comment                | Supported | 2.1.8/3.0.4  | SQL              | No                                  |             |

:::note

`add/drop value column` requires setting `"light_schema_change" = "true"` during table creation.

:::

Rollup Index Column Operations

| Operation             | Supported | Doris Version | Sync Method    | Description |
| --------------------- | --------- | ------------- | -------------- | ----------- |
| add key column         | Supported | 2.1.8/3.0.4  | Partial Sync   |             |
| add value column       | Supported | 2.1.8/3.0.4  | SQL            | Needs light schema change enabled |
| drop column            | Supported | 2.1.8/3.0.4  | Partial Sync   |             |
| modify column          | Unknown   | 2.1.8/3.0.4  | Partial Sync   | Doris does not support directly modifying rollup column types |
| order by               | Supported | 2.1.8/3.0.4  | Partial Sync   |             |

### Rollup Operations

| Operation             | Supported | Doris Version | Sync Method    | Description |
| --------------------- | --------- | ------------- | -------------- | ----------- |
| add rollup            | Supported | 2.1.8/3.0.4

  | Partial Sync   |             |
| drop rollup           | Supported | 2.1.8/3.0.4  | SQL            |             |
| rename rollup         | Supported | 2.1.8/3.0.4  | SQL            |             |

### Index Operations

Inverted Index

| Operation             | Supported | Doris Version | Sync Method    | Description |
| --------------------- | --------- | ------------- | -------------- | ----------- |
| create index          | Supported | 2.1.8/3.0.4  | Partial Sync   |             |
| drop index            | Supported | 2.1.8/3.0.4  | SQL            |             |
| build index           | Supported | 2.1.8/3.0.4  | SQL            |             |

Bloom Filter

| Operation             | Supported | Doris Version | Sync Method    | Description |
| --------------------- | --------- | ------------- | -------------- | ----------- |
| add bloom filter       | Supported | 2.1.8/3.0.4  | Partial Sync   |             |
| alter bloom filter     | Supported | 2.1.8/3.0.4  | Partial Sync   | Refers to modifying `bloom_filter_columns` |
| drop bloom filter      | Supported | 2.1.8/3.0.4  | Partial Sync   |             |

## Data

### Import Operations

| Import Method        | Supported | Doris Version | Sync Method | Downstream Can Operate Independently | Description |
| -------------------- | --------- | ------------- | ----------- | ----------------------------------- | ----------- |
| stream load          | Supported (except temp partitions) | - | TXN | No | Data is visible when the upstream transaction is committed |
| broker load          | Supported (except temp partitions) | - | TXN | No | Same as stream load |
| routine load         | Supported (except temp partitions) | - | TXN | No | Same as stream load |
| mysql load           | Supported (except temp partitions) | - | TXN | No | Same as stream load |
| group commit         | Supported (except temp partitions) | 2.1 | TXN | No | Same as stream load |

### Data Operations

| Operation        | Supported | Doris Version | Sync Method  | Downstream Can Operate Independently | Description |
| ---------------- | --------- | ------------- | ----------- | ----------------------------------- | ----------- |
| delete           | Supported | -             | TXN         | No                                  | Data is visible in binlog when committed, downstream starts syncing |
| update           | Supported | -             | TXN         | No                                  | Same as delete |
| insert           | Supported | -             | TXN         | No                                  | Same as delete |
| insert into overwrite | Supported (except temp partitions) | 2.1.6 | Partial Sync | No | Same as insert |
| insert into overwrite | Supported (except temp partitions) | 2.0 | Full Sync | No | Same as insert |

### Partition Operations

| Operation        | Supported | Doris Version | Sync Method | Downstream Can Operate Independently | Description |
| ---------------- | --------- | ------------- | ----------- | ----------------------------------- | ----------- |
| add partition    | Supported | -             | SQL         | No                                  | Triggers Full Sync or Partial Sync, causing data loss in downstream |
| add temp partition | Not Supported |           |             | No                                  | Temporary partitions not supported for backup; workaround in newer versions |
| drop partition   | Supported | -             | SQL/Full Sync | No                                  | 2.0.15/2.1.6 and earlier use Full Sync, later use SQL |
| replace partition | Supported | 2.1.7/3.0.3  | Partial Sync | No                                  | Only supports strict range and non-tmp partitions for replace |
| modify partition | Not Supported |           |             | No                                  | Modifying partition properties is not supported |
| rename partition | Supported | 2.1.8/3.0.4  | SQL         | No                                  |             |

### View Operations

| Operation       | Supported | Doris Version | Sync Method | Description |
| --------------- | --------- | ------------- | ----------- | ----------- |
| create view     | Supported | -             | SQL         | Works if upstream and downstream names match |
| alter view      | Supported | 2.1.8/3.0.4  | SQL         |             |
| drop view       | Supported | 2.1.8/3.0.4  | SQL         |             |

:::note

Due to Doris limitations, column names or view names cannot match the database name.

:::

### Materialized Views

Synchronized Materialized View

| Operation               | Supported | Doris Version | Sync Method    | Description |
| ----------------------- | --------- | ------------- | -------------- | ----------- |
| create materialized view | Supported | 2.1.8/3.0.4  | Partial Sync   | Same name at upstream and downstream works; different names require manual rebuild at downstream |
| drop materialized view   | Supported | 2.1.8/3.0.4  | SQL            |             |

Asynchronous Materialized View

| Operation                | Supported |
| ------------------------ | --------- |
| create async materialized view | Not Supported |
| alter async materialized view  | Not Supported |
| drop async materialized view   | Not Supported |
| refresh                     | Not Supported |
| pause                       | Not Supported |
| resume                      | Not Supported |

## Statistics

Statistics are not synchronized between upstream and downstream, and work independently.

## Other Operations

| Operation        | Supported |
| ---------------- | --------- |
| external table   | Not Supported |
| recycle bin      | Not Supported |
| catalog          | Not Supported |
| workload group   | Not Supported |
| job              | Not Supported |
| function         | Not Supported |
| policy           | Not Supported |
| user             | Not Supported |
| cancel alter job | Supported |
