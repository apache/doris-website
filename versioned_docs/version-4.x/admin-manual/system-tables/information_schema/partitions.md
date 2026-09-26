---
{
    "title": "partitions",
    "language": "en",
    "description": "Show the Partition status of all tables in the database."
}
---

## Overview

Show the Partition status of all tables in the database.

## Database

`information_schema`

## Table Information

| Column Name                   | Type          | Description                          |
| ----------------------------- | ------------- | ------------------------------------ |
| PARTITION_ID	                | bigint        | Partitinon ID                        |
| TABLE_CATALOG                 | varchar(64)   | Catalog name                         |
| TABLE_SCHEMA                  | varchar(64)   | Database name                        |
| TABLE_NAME                    | varchar(64)   | Table name                           |
| PARTITION_NAME                | varchar(64)   | Partition name                       |
| SUBPARTITION_NAME             | varchar(64)   | Always empty                         |
| PARTITION_ORDINAL_POSITION    | int           | Ordinal position of the partition    |
| SUBPARTITION_ORDINAL_POSITION | int           | Always empty                         |
| PARTITION_METHOD              | varchar(13)   | Partition method                     |
| SUBPARTITION_METHOD           | varchar(13)   | Always empty                         |
| PARTITION_EXPRESSION          | varchar(2048) | Partition expression                 |
| SUBPARTITION_EXPRESSION       | varchar(2048) | Always empty                         |
| PARTITION_DESCRIPTION         | text          | Partition description                |
| TABLE_ROWS                    | bigint        |                                      |
| AVG_ROW_LENGTH                | bigint        |                                      |
| DATA_LENGTH                   | bigint        |                                      |
| MAX_DATA_LENGTH               | bigint        |                                      |
| INDEX_LENGTH                  | bigint        |                                      |
| DATA_FREE                     | bigint        |                                      |
| CREATE_TIME                   | bigint        |                                      |
| UPDATE_TIME                   | datetime      |                                      |
| CHECK_TIME                    | datetime      |                                      |
| CHECKSUM                      | bigint        |                                      |
| PARTITION_COMMENT             | text          |                                      |
| NODEGROUP                     | varchar(256)  |                                      |
| TABLESPACE_NAME               | varchar(268)  |                                      |
| LOCAL_DATA_SIZE               | text	        | Partition local data size. Usually `0` in compute-storage decoupled mode, see below |
| REMOTE_DATA_SIZE              | text          | Partition remote data size (cloud)   |
| STATE                         | text	        | Partition state                      |
| REPLICA_ALLOCATION  	        | text	        | distribution of replicas of a tablet. `NULL` in compute-storage decoupled mode |
| REPLICA_NUM                   | int 	        | replicas num                         |
| STORAGE_POLICY                | text          | Storage policy                       |
| STORAGE_MEDIUM                | text          | Storage medium                       |
| COOLDOWN_TIME_MS              | text          | Cooldown time                        |
| LAST_CONSISTENCY_CHECK_TIME   | text          | Last consistency check time          |
| BUCKET_NUM                    | int           | Partition bucket num                 |
| COMMITTED_VERSION             | bigint        | Last commited version                |
| VISIBLE_VERSION               | bigint        | Current visible version              |
| PARTITION_KEY                 | text          | Partition key                        |
| RANGE                         | text          | Partition range(min max value)       |
| DISTRIBUTION                  | text          | Distribution type                    |

## Data size semantics in compute-storage decoupled mode

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments / Partition data size statistics -->

:::caution Behavior change (4.0.8)

Starting from version 4.0.8, partition data size in compute-storage decoupled mode is consistently reported with **remote** semantics: data size that the replica statistics do not record as remote is counted into `REMOTE_DATA_SIZE`, and the corresponding `LOCAL_DATA_SIZE` is reported as `0`. So in a decoupled cluster you usually see `LOCAL_DATA_SIZE` as `0`, with the actual partition data size in `REMOTE_DATA_SIZE`.

Before 4.0.8, that data size was counted into `LOCAL_DATA_SIZE`, which made `information_schema.partitions`, [`SHOW TABLETS`](../../../sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET), and [`information_schema.backend_tablets`](./backend_tablets) contradict each other on local versus remote. The change only adjusts how the size is reported; it does not change where the data is stored or how much there is.

The same change makes `REPLICA_ALLOCATION` in `information_schema.partitions` display as `NULL` in decoupled mode (previously the internal placeholder `\N`). Replica placement is managed by the decoupled architecture itself and no longer follows the replica allocation semantics of the integrated mode.

:::

When computing the actual space a partition occupies, use `REMOTE_DATA_SIZE` in decoupled mode:

```sql
SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    PARTITION_NAME,
    LOCAL_DATA_SIZE,
    REMOTE_DATA_SIZE
FROM information_schema.partitions
WHERE TABLE_SCHEMA = 'your_db';
```
