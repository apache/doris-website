---
{
    "title": "PARTITIONS",
    "language": "en",
    "description": "The table function generates a temporary partition TABLE, which allows you to view the PARTITION list of a certain TABLE."
}
---

## Description

The table function generates a temporary partition TABLE, which allows you to view the PARTITION list of a certain TABLE.

## Syntax

```sql
PARTITIONS(
    "catalog"="<catalog>",
    "database"="<database>",
    "table"="<table>"
)
```

## Required Parameters
| Field            | Description                                      |
|------------------|--------------------------------------------------|
| **`<catalog>`**  | Specify the cluster catalog name to be queried.  |
| **`<database>`** | Specify the cluster database name to be queried. |
| **`<table>`**    | Specify the cluster table name to be queried.    |


## Return Value
| Field                     | Description                                                                 |
|---------------------------|-----------------------------------------------------------------------------|
| PartitionId               | Partition ID                                                                 |
| PartitionName             | Name of the partition                                                         |
| VisibleVersion            | Partition version                                                              |
| VisibleVersionTime        | Time when the partition version was committed                                 |
| State                     | State of the partition                                                         |
| PartitionKey              | Partition key                                                                 |
| Range                     | Range of the partition                                                         |
| DistributionKey           | Distribution key for partitioning                                             |
| Buckets                   | Number of buckets in the partition                                            |
| ReplicationNum            | Number of replicas in the partition                                           |
| StorageMedium             | Storage medium used for the partition                                         |
| CooldownTime              | Cooldown time for the partition                                               |
| RemoteStoragePolicy       | Remote storage policy for the partition                                       |
| LastConsistencyCheckTime  | Time of the last consistency check for the partition                          |
| DataSize                  | Size of the data in the partition                                             |
| IsInMemory                | Whether the partition is stored in memory                                    |
| ReplicaAllocation         | Replication strategy for the partition                                        |
| IsMutable                 | Whether the partition is mutable                                             |
| SyncWithBaseTables        | Whether the partition is synchronized with the base table (for async materialized views) |
| UnsyncTables              | Which base table is unsynchronized (for async materialized view partitions)   |



## Examples
View the partition list of example_table under test in the internal catalog

```sql
select * from partitions("catalog"="internal","database"="test","table"="example_table");
```
```text
+-------------+---------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
|       43209 | p1            |              1 | 2025-01-17 12:35:22 | NORMAL | created_at   | [types: [DATEV2]; keys: [0000-01-01]; ..types: [DATEV2]; keys: [2023-01-01]; ) | id              |      10 |              1 | HDD           | 9999-12-31 23:59:59 |                     | \N                       | 0.000    |          0 | tag.location.default: 1 |         1 |                  1 | \N           |
|       43210 | p2            |              1 | 2025-01-17 12:35:22 | NORMAL | created_at   | [types: [DATEV2]; keys: [2023-01-01]; ..types: [DATEV2]; keys: [2024-01-01]; ) | id              |      10 |              1 | HDD           | 9999-12-31 23:59:59 |                     | \N                       | 0.000    |          0 | tag.location.default: 1 |         1 |                  1 | \N           |
|       43211 | p3            |              1 | 2025-01-17 12:35:22 | NORMAL | created_at   | [types: [DATEV2]; keys: [2024-01-01]; ..types: [DATEV2]; keys: [2025-01-01]; ) | id              |      10 |              1 | HDD           | 9999-12-31 23:59:59 |                     | \N                       | 0.000    |          0 | tag.location.default: 1 |         1 |                  1 | \N           |
|       43212 | p4            |              1 | 2025-01-17 12:35:22 | NORMAL | created_at   | [types: [DATEV2]; keys: [2025-01-01]; ..types: [DATEV2]; keys: [2026-01-01]; ) | id              |      10 |              1 | HDD           | 9999-12-31 23:59:59 |                     | \N                       | 0.000    |          0 | tag.location.default: 1 |         1 |                  1 | \N           |
+-------------+---------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
```

View the partition information with partition name p1 under example_table

```sql
select * from partitions("catalog"="internal","database"="test","table"="example_table") where PartitionName = "p1";
```
```text
+-------------+---------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
|       43209 | p1            |              1 | 2025-01-17 12:35:22 | NORMAL | created_at   | [types: [DATEV2]; keys: [0000-01-01]; ..types: [DATEV2]; keys: [2023-01-01]; ) | id              |      10 |              1 | HDD           | 9999-12-31 23:59:59 |                     | \N                       | 0.000    |          0 | tag.location.default: 1 |         1 |                  1 | \N           |
+-------------+---------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
```

View the partition ID with the partition name p1 under example_table

```sql
select PartitionId from partitions("catalog"="internal","database"="test","table"="example_table") where PartitionName = "p1";
```
```text
+-------------+
| PartitionId |
+-------------+
|       43209 |
+-------------+
```

