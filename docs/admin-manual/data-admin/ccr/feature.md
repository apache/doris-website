---
{
    "title": "Feature Details",
    "language": "en-US"
}
---

`-` Indicates Doris version 2.0 and above, all versions of CCR. It is recommended to use Doris version 2.0.15 or 2.1.6 or newer.

## Database

### Database Properties

Database-level tasks will synchronize the properties of the database during Full Sync.

| Property                | Supported | Doris version | CCR version | Sync Method | Description |
|------------------------|-----------|---------------|-------------|-------------|-------------|
| replication_allocation  | Supported | -             | -           | FULL SYNC   |             |
| data quota              | Not supported |           |             |             |             |
| replica quota           | Not supported |           |             |             |             |

### Modify Database Properties

CCR tasks do not synchronize operations that modify database properties.

| Property                | Supported | Can upstream operate | Can downstream operate | Description                              |
|------------------------|-----------|----------------------|------------------------|------------------------------------------|
| replication_allocation  | Not supported | No               | No                     | Operations by upstream and downstream will cause CCR tasks to be interrupted |
| data quota              | Not supported | Yes              | Yes                    |                                          |
| replica quota           | Not supported | Yes              | Yes                    |                                          |

### Rename Database

Renaming is not supported for upstream and downstream; doing so may cause views to stop working.

## Table
### Table Properties

| Property                                      | Supported | Doris version | CCR version | Sync Method | Description                                                     |
|-----------------------------------------------|-----------|---------------|-------------|-------------|---------------------------------------------------------------|
| Table Model (duplicate, unique, aggregate)    | Supported | -             | -           | SQL         |                                                               |
| Partitioning and Bucketing                     | Supported | -             | -           | SQL         |                                                               |
| replication_num                               | Supported | -             | -           | SQL         |                                                               |
| replication_allocation (resource group)      | Supported | -             | -           | SQL         | Upstream must be consistent with downstream; BE tags must be consistent, otherwise CCR tasks will fail |
| colocate_with                                 | Not supported |           |             |             |                                                               |
| storage_policy                                | Not supported |           |             |             |                                                               |
| dynamic_partition                             | Supported | -             | -           | SQL         |                                                               |
| storage_medium                                | Supported | -             | -           | SQL         |                                                               |
| auto_bucket                                   | Supported | -             | -           | SQL         |                                                               |
| group_commit series                           | Supported | -             | -           | SQL         |                                                               |
| enable_unique_key_merge_on_write              | Supported | -             | -           | SQL         |                                                               |
| enable_single_replica_compaction              | Supported | -             | -           | SQL         |                                                               |
| disable_auto_compaction                       | Supported | -             | -           | SQL         |                                                               |
| compaction_policy                             | Supported | -             | -           | SQL         |                                                               |
| time_series_compaction series                 | Supported | -             | -           | SQL         |                                                               |
| binlog series                                 | Supported | -             | -           | SQL         | To be confirmed                                               |
| variant_enable_flatten_nested                 | Supported | -             | -           | SQL         |                                                               |
| skip_write_index_on_load                      | Supported | -             | -           | SQL         |                                                               |
| row_store series                              | Supported | -             | -           | SQL         |                                                               |
| seq column                                    | Supported | -             | -           | SQL         |                                                               |
| enable_light_schema_change                    | Supported | -             | -           | SQL         |                                                               |
| compression_type                              | Supported | -             | -           | SQL         |                                                               |
| index                                         | Supported | -             | -           | SQL         |                                                               |
| bloom_filter_columns                          | Supported | -             | -           | SQL         |                                                               |
| bloom_filter_fpp                              | Not supported |           |             |             |                                                               |
| storage_cooldown_time                         | Not supported |           |             |             |                                                               |
| generated column                              | Supported | -             | -           | SQL         |                                                               |
| auto-increment id                             | Not supported |           |             |             | Issues exist                                               |

### Basic Table Operations

| Operation       | Supported                        | Doris version           | CCR version | Sync Method                           | Can downstream operate separately | Description                                  |
|-----------------|---------------------------------|-------------------------|-------------|---------------------------------------|-----------------------------------|----------------------------------------------|
| create table    | Supported                       | -                       | -           | SQL                                   | Not supported for tables synchronized by CCR tasks. | Reference properties for creating tables      |
| drop table      | Supported                       | -                       | -           | Before 2.0.15/2.1.6: Full Sync, after: SQL | Same as above                     |                                              |
| rename table    | Table-level tasks do not support database-level tasks | master (2.0/2.1 not supported) |             | SQL                                   | Same as above                     | Table-level task rename will cause CCR tasks to stop |
| replace table   | Not supported                   |                         |             |                                       | Same as above                     |                                              |
| truncate table   | Supported                       | -                       |             | SQL                                   | Same as above                     |                                              |
| restore table    | Unknown                         |                         |             |                                       | Same as above                     |                                              |

### Modify Table Properties

Sync method is SQL.

| Property                       | Supported | Doris version | CCR version | Can upstream operate | Can downstream operate                           | Description                                    |
|-------------------------------|-----------|---------------|-------------|----------------------|-------------------------------------------------|------------------------------------------------|
| colocate                       | Not supported |           |             | Yes                  | No                                              |                                                 |
| distribution type              | Not supported |           |             | No                   | Same as above                                   |                                                 |
| dynamic partition              | Not supported |           |             | Yes                  | Same as above                                   |                                                 |
| replication_num                | Not supported |           |             | No                   | No                                              |                                                 |
| replication_allocation         | Not supported |           |             | No                   |                                                 |                                                 |
| storage policy                 | Not supported |           |             | No                   | No                                              |                                                 |
| enable_light_schema_change     | Not supported |           |             |                      |                                                 | CCR can only synchronize lightweight schema changes of tables. |
| row_store                      | Unknown     |           |             |                      |                                                 |                                                 |
| bloom_filter_columns           | Unknown     |           |             |                      |                                                 |                                                 |
| bucket num                     | Not supported |           |             | Yes                  | No                                              |                                                 |
| isBeingSyced                   | Not supported |           |             | No                   | No                                              |                                                 |
| compaction series properties    | Not supported |           |             | Yes                  | No, triggering full sync downstream operations will cause data loss |                                                 |
| skip_write_index_on_load       | Not supported |           |             | Yes                  | Same as above                                   |                                                 |
| seq column                     | Supported   | -             | -           | Yes                  | No, triggering full sync downstream operations will cause data loss |                                                 |
| delete sign column             | Supported   | -             | -           | Yes                  | Same as above                                   |                                                 |
| comment                        | Not supported |           |             | Yes                  | No, triggering full sync downstream operations will cause data loss |                                                 |

### Column Operations

Column operations on Base Index in the table.

| Operation          | Supported | Doris version | CCR version | Sync Method                | Can downstream operate            | Remarks                            |
|-------------------|-----------|---------------|-------------|-----------------------------|-----------------------------------|-----------------------------------|
| add key column     | Supported | -             | -           | Database-level task Partial Sync, Table-level task Partial Sync | No                                |                                   |
| add value column   | Supported | -             | -           | SQL                         | No                                |                                   |
| drop key column    | Supported | -             | -           | Database-level task Partial Sync, Table-level task Partial Sync | Same as above                     |                                   |
| drop value column   | Supported | -             | -           | SQL                         | Same as above                     |                                   |
| modify column      | Supported | -             | -           | Full Sync / Partial Sync    | Same as above                     | Will attempt to delete the downstream table before starting |
| order by           | Supported | -             | -           | Full Sync / Partial Sync    | Same as above                     | Will attempt to delete the downstream table before starting |
| rename             |           |               |             |                             | Same as above                     |                                   |
| comment            | Not supported |           |             |                             | Same as above                     |                                   |


Column operations on Rollup Index in the table.

| Operation          | Supported | Remarks              |
|-------------------|-----------|---------------------|
| add column        | Unknown   | Causes CCR task interruption |
| drop column       | Unknown   | Same as above        |
| modify column     | Unknown   | Same as above        |
| order by          | Unknown   | Same as above        |


### Rollup

| Operation          | Supported | Remarks         |
|-------------------|-----------|------------------|
| add rollup        | Not supported |                |
| drop rollup       | Not supported |                |
| rename rollup     | Not supported | CCR task interruption |

### Index


Inverted Index

| Operation         | Supported             | Remarks     |
|-------------------|----------------------|-------------|
| create index      | Not supported         | Unknown impact |
| drop index        | Unknown               | Unknown impact |


Bloom Filter

| Operation         | Supported             | Remarks     |
|-------------------|----------------------|-------------|
| add bloom filter   | Not supported         | Unknown impact |
| alter bloom filter | Not supported         | Unknown impact |
| drop bloom filter  | Not supported         | Unknown impact |

## Data

### Import

| Import Method     | Supported             | Doris version | CCR version | Sync Method | Can downstream operate                                             | Description                                                 |
|-------------------|----------------------|---------------|-------------|-------------|-------------------------------------------------------------------|-------------------------------------------------------------|
| stream load       | Supported (except for temporary partitions) | -             | -           | TXN         | No, if downstream imports, subsequent triggers of full or Partial Sync will cause data loss | Upstream transactions are visible, i.e., data is visible when generating binlog, downstream starts syncing. |
| broker load       | Supported (except for temporary partitions) | -             | -           | TXN         | Same as above                                                     | Same as above                                             |
| routine load      | Supported (except for temporary partitions) | -             | -           | TXN         | Same as above                                                     | Same as above                                             |
| mysql load        | Supported (except for temporary partitions) | -             | -           | TXN         | Same as above                                                     | Same as above                                             |
| group commit      | Supported (except for temporary partitions) | 2.1           | 2.1         | TXN         | Same as above                                                     | Same as above                                             |

### Data Operations

| Operation                      | Supported             | Doris version | CCR version | Sync Method     | Can downstream operate                                             | Description                                                 |
|-------------------------------|----------------------|---------------|-------------|------------------|-------------------------------------------------------------------|-------------------------------------------------------------|
| delete                        | Supported             | -             | -           | TXN              | No, if downstream operates, subsequent triggers of full or Partial Sync will cause data loss | Upstream transactions are visible, i.e., data is visible when generating binlog, downstream starts syncing. |
| update                        | Supported             | -             | -           | TXN              | Same as above                                                     | Same as above                                             |
| insert                        | Supported             | -             | -           | TXN              | Same as above                                                     | Same as above                                             |
| insert into overwrite         | Supported (except for temporary partitions) | 2.1.6         |             | Partial Sync     | Same as above                                                     | Same as above                                             |
| insert into overwrite         | Supported (except for temporary partitions) | 2.0           |             | full sync        | Same as above                                                     | Same as above                                             |
| Explicit transaction (3.0) begin commit | Not supported |               |             |                  |                                                                   |                                                             |

## Partition Operations

| Operation               | Supported                        | Doris version | CCR version | Sync Method            | Can downstream operate separately                                        | Description                                                         |
|------------------------|---------------------------------|---------------|-------------|------------------------|-------------------------------------------------------------------------|---------------------------------------------------------------------|
| add partition          | Supported                       | -             | -           | SQL                    | No, subsequent triggers of Full Sync or Partial Sync will cause downstream operations to be lost | cooldown time property and its behavior unknown                     |
| add temp partition     | Not supported                   |               |             |                        | Same as above                                                           |                                                                     |
| drop partition         | Supported                       | -             | -           | Before 2.0.15/2.1.6: Full Sync, after: SQL | Same as above                                                           |                                                                     |
| replace partition      | Supported                       |               |             | Partial Sync           | Same as above                                                           | Partial Sync **only supports strict range and non-temp partition replace method**, otherwise it will trigger Full Sync. |
| modify partition       | Not supported                   | Not released   | Not released | SQL                    | Same as above                                                           |                                                                     |
| rename partition       | Table-level tasks do not support database-level tasks | Not released   | Not released | SQL                    | Same as above                                                           | Table-level task rename will cause CCR tasks to stop                |

## View

| Operation        | Supported | Doris version | CCR version | Sync Method | Remarks                             |
|------------------|-----------|---------------|-------------|-------------|-------------------------------------|
| create view      | Supported | -             | -           | SQL         | Can work when upstream and downstream have the same name. |
| alter view       | Not supported |           |             |             | No binlog                           |
| drop view        | Not supported |           |             |             |                                     |


## Materialized View

Synchronous Materialized View

| Operation                     | Supported | Remarks                                                         |
|-------------------------------|-----------|----------------------------------------------------------------|
| create materialized view      | Unknown   | Can work when upstream and downstream have the same name; if different names, downstream needs to manually recreate the view. |
| drop materialized view        | Unknown   |                                                                |


Asynchronous Materialized View

| Operation                           | Supported |
|-------------------------------------|-----------|
| create async materialized view      | Not supported |
| alter async materialized view       | Not supported |
| drop async materialized view        | Not supported |
| refresh                             | Not supported |
| pause                               | Not supported |
| resume                              | Not supported |


## Statistics

Not synchronized between upstream and downstream, work independently.

## Others

| Operation             | Supported |
|-----------------------|-----------|
| external table        | Not supported |
| recycle bin           | Not supported |
| catalog               | Not supported |
| workload group        | Not supported |
| job                   | Not supported |
| function              | Not supported |
| policy                | Not supported |
| user                  | Not supported |
| cancel alter job      | Supported   |