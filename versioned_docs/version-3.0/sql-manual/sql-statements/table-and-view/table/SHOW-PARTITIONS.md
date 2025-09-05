---
{
    "title": "SHOW PARTITIONS",
    "language": "en"
}

---

## Descriptions

This statement is used to display partition information. It supports both Internal catalog and Hive Catalog.

For `Hive Catalog`:

It supports returning all partitions, including multi-level partitions.
## Syntax

```sql
SHOW [ TEMPORARY ] PARTITIONS
    FROM [ <db_name>. ] <table_name>
    [ <where_clause> ]
    [ ORDER BY <order_by_key> ]
    [ LIMIT <limit_rows> ];
```

## Required Parameters
**1. `<table_name>`**

The name of the table for which partition information needs to be viewed must be specified.


## Optional Parameters
**1. `TEMPORARY`**

Whether to query the information of temporary partitions.

**2. `<db_name>`**

The name of the database for which partition information needs to be viewed must be specified.

**3. `<where_clause>`**

Filter conditions, supporting filtering on columns such as PartitionId, PartitionName, State, Buckets, ReplicationNum, LastConsistencyCheckTime, etc.

Please note that:
1. Currently, the where clause only supports the `=`, `!=`, `like` operator for string type PartitionName, State. For the other columns only support operators such as `=`, `!=`, `>`, `<`, `>=`, `<=`.
2. When using the above operators in the where clause, the column name needs to be on the left side.
3. Where clause can contains `AND`.

**4. `<order_by_key>`**

Sorting conditions, supporting sorting on columns such as PartitionId, PartitionName, State, Buckets, ReplicationNum, LastConsistencyCheckTime, etc.

**5. `<limit_rows>`**

The maximum number of rows returned.

## Return Value
| Columns                  | DataType | Note                                                                                                                                                          |
|--------------------------|----------|---------------------------------------------------------------------------------------------------------------------------------------------------------------|
| PartitionId              | bigint   | Partition ID                                                                                                                                                  |
| PartitionName            | varchar  | Partition Name                                                                                                                                                |
| VisibleVersion           | int      | The maximum VisibleVersion of the tablets in this partition.                                                                                                  |
| VisibleVersionTime       | datetime | The time of the most recent VisibleVersion in this partition.                                                                                                 |
| State                    | varchar  | The State of this partition                                                                                                                                   |
| PartitionKey             | datetime | The partition key of this  partition                                                                                                                          |
| Range                    | datetime | The Range of this partition                                                                                                                                   |
| DistributionKey          | varchar  | The distribution key of this  partition                                                                                                                       |
| Buckets                  | int      | The bucket num of this partition                                                                                                                              |
| ReplicationNum           | int      | The replica num of this partition                                                                                                                             |
| StorageMedium            | varchar  | The storage medium of this partition                                                                                                                          |
| CooldownTime             | datetime | The cooldown time of this partition. If there is no hot-cold separation, the value of this field is [9999-12-31 23:59:59], which means it is always hot data. |
| RemoteStoragePolicy      | varchar  | The remote storage policy of this partition.                                                                                                                  |
| LastConsistencyCheckTime | datetime | The time of the last partition consistency check for this partition.                                                                                          |
| DataSize                 | int      | The data size under this partition.                                                                                                                           |
| IsInMemory               | boolean  | Whether it is an in-memory partition, the default is false.                                                                                                   |
| ReplicaAllocation        | varchar  | The replica distribution strategy of this partition.                                                                                                          |
| IsMutable                | boolean  | Whether the partition is mutable, the default is true.                                                                                                        |
| SyncWithBaseTables       | boolean  | Whether the partition is synchronized with the data of the base table.                                                                                        |
| UnsyncTables             | varchar  | Whether the partition is a partition of an unsynchronized table.                                                                                              |


## Access Control Requirements
The SHOW permission for the table to be viewed is required.



## Examples

1. Show all non-temporary partition information for a specified table in a specified database.

```sql
SHOW PARTITIONS FROM t_agg;
```
```text
+-------------+---------------+----------------+---------------------+--------+--------------+-------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------+----------------+---------------------+--------+--------------+-------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 170307      | t_agg         | 4              | 2024-11-05 16:13:40 | NORMAL |              |       | k1              | 1       | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 806.000 B | false      | tag.location.default: 1 | true      | true               | NULL         |
+-------------+---------------+----------------+---------------------+--------+--------------+-------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```
2. Show all temporary partition information for a specified table in a specified database.

```sql
SHOW TEMPORARY PARTITIONS FROM t_temp;
```
```text
+-------------+---------------+----------------+---------------------+--------+--------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                                                    | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------+----------------+---------------------+--------+--------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
| 828863      | tp2020        | 1              | 2025-01-22 16:19:50 | NORMAL | create_time  | [types: [DATETIMEV2]; keys: [2020-01-01 00:00:00]; ..types: [DATETIMEV2]; keys: [2021-01-01 00:00:00]; ) | reference_no    | 1       | 1              | SSD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      | true               | NULL         |
+-------------+---------------+----------------+---------------------+--------+--------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
```

3. Show the information of a specified non-temporary partition for a specified table in a specified database, and filter the results.

```sql
SHOW PARTITIONS FROM t_agg WHERE PartitionName = "p2024";
```
```text
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName | VisibleVersion | VisibleVersionTime  | State  | PartitionKey    | Range                                                                                                    | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 169851      | p2024         | 2              | 2024-11-05 14:14:29 | NORMAL | idp_create_time | [types: [DATETIMEV2]; keys: [2024-01-01 00:00:00]; ..types: [DATETIMEV2]; keys: [2025-01-01 00:00:00]; ) | idp_es_id       | 3       | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 27.396 KB | false      | tag.location.default: 1 | true      | true               | NULL         |
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

4. Show the information of the latest non-temporary partition for a specified table in a specified database.

```sql
SHOW PARTITIONS FROM t_agg ORDER BY PartitionId DESC LIMIT 1;
```
```text
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName | VisibleVersion | VisibleVersionTime  | State  | PartitionKey    | Range                                                                                                    | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
| 169866      | p2025         | 1              | 2024-11-05 14:13:56 | NORMAL | idp_create_time | [types: [DATETIMEV2]; keys: [2025-01-01 00:00:00]; ..types: [DATETIMEV2]; keys: [2026-01-01 00:00:00]; ) | idp_es_id       | 3       | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000    | false      | tag.location.default: 1 | true      | true               | NULL         |
+-------------+---------------+----------------+---------------------+--------+-----------------+----------------------------------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+----------+------------+-------------------------+-----------+--------------------+--------------+
```

