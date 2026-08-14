---
{
    "title": "SHOW TABLET",
    "language": "en",
    "description": "Inspect tablet information: locate a single tablet by its id, or list the replica placement, versions, and data size of every tablet in a table or partition.",
    "keywords": [
        "SHOW TABLET",
        "SHOW TABLETS FROM",
        "Doris tablet information",
        "replica placement",
        "LocalDataSize",
        "RemoteDataSize",
        "CompactionStatus",
        "VersionCount",
        "tablet troubleshooting"
    ]
}
---

## Description

`SHOW TABLET` inspects tablet information (only for administrators) and comes in two forms:

- `SHOW TABLET <tablet_id>`: given a tablet id, look up the database, table, partition, and index it belongs to.
- `SHOW TABLETS FROM <table_name>`: list the replica placement, versions, data size, and compaction status of every tablet in a table or in specific partitions.

The two are often used together: locate a tablet with the first form, then inspect the other replicas in the same partition with the second.

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Replica status troubleshooting / Data skew analysis / Compaction troubleshooting -->

:::info Note

Both statements only support tables in the Internal Catalog. External Catalogs are not supported.

:::

## Syntax

```sql
-- Inspect a single tablet by its id
SHOW TABLET <tablet_id>

-- List every tablet of a table
SHOW TABLETS FROM <table_name>
    [ PARTITIONS ( <partition_name> [, ... ] ) ]
    [ WHERE <where_condition> ]
    [ ORDER BY <column_name> [ ASC | DESC ] [, ... ] ]
    [ LIMIT [ <offset>, ] <row_count> ]
```

## Parameters

### SHOW TABLET

**1. `<tablet_id>`**

> Required. The ID of the tablet to query.

### SHOW TABLETS FROM

**1. `<table_name>`**

> Required. The table name. The `db_name.table_name` form is supported.

**2. `PARTITIONS ( <partition_name> [, ... ] )`**

> Optional. Restricts the result to the given partitions. Without it, all partitions of the table are inspected.

**3. `WHERE <where_condition>`**

> Optional. Filter condition. Only equality comparisons on the following three fields are supported, combined with `AND`:
>
> | Field | Type | Description |
> | --- | --- | --- |
> | `Version` | Integer | Filters by replica version |
> | `BackendId` | Integer | Filters by the BE node ID hosting the replica |
> | `State` | String | Filters by replica state: `NORMAL`, `ROLLUP`, `CLONE`, `DECOMMISSION` |
>
> Other fields, non-equality comparisons, and `OR` all raise an error:
>
> ```text
> Where clause should looks like: Version = "version", or state = "NORMAL|ROLLUP|CLONE|DECOMMISSION", or BackendId = 10000 or compound predicate with operator AND
> ```

**4. `ORDER BY <column_name>`**

> Optional. Sorts by a column of the result. The sort column must be one of the columns listed under "Return Value" below.

**5. `LIMIT [ <offset>, ] <row_count>`**

> Optional. Limits the number of returned rows. Recommended when the table has many tablets.

## Return Value

### SHOW TABLET

| Column        | DataType | Note                                                                   |
|---------------|----------|------------------------------------------------------------------------|
| DbName        | String   | The name of the database that contains the tablet.                     |
| TableName     | String   | The name of the table that contains the tablet.                        |
| PartitionName | String   | The name of the partition that contains the tablet.                    |
| IndexName     | String   | The name of the index that contains the tablet.                        |
| DbId          | Int      | The ID of the database.                                                |
| TableId       | Int      | The ID of the table.                                                   |
| PartitionId   | Int      | The ID of the partition.                                               |
| IndexId       | Int      | The ID of the index.                                                   |
| IsSync        | Boolean  | Whether the tablet is in sync with its replicas.                       |
| Order         | Int      | The order of the tablet within its index.                              |
| QueryHits     | Int      | The number of query hits on this tablet.                               |
| WindowAccessCount | Int  | The number of accesses to this tablet within the sliding statistics window. |
| LastAccessTime| Int      | The timestamp in milliseconds of the last access to this tablet. `0` when never accessed. |
| DetailCmd     | String   | The command to get more detailed information about the tablet.         |

### SHOW TABLETS FROM

Each row corresponds to one replica, so the same `TabletId` appears once per replica.

| Column | DataType | Note |
|---|---|---|
| TabletId | Int | Tablet ID |
| ReplicaId | Int | Replica ID |
| BackendId | Int | ID of the BE node hosting the replica |
| SchemaHash | Int | Schema hash of the replica |
| Version | Int | Current visible version of the replica |
| LstSuccessVersion | Int | The last successfully loaded version |
| LstFailedVersion | Int | The last failed version. `-1` means there is no failed version |
| LstFailedTime | String | Time of the last version failure. `\N` when there is none |
| LocalDataSize | Int | Local data size of the replica in bytes. Usually `0` in compute-storage decoupled mode, see "Data size semantics in decoupled mode" below |
| RemoteDataSize | Int | Remote data size of the replica in bytes |
| RowCount | Int | Row count of the replica |
| State | String | Replica state: `NORMAL`, `ROLLUP`, `CLONE`, `DECOMMISSION` |
| LstConsistencyCheckTime | String | Time of the last consistency check. `\N` when it has never been checked |
| CheckVersion | Int | Version of the last consistency check. `-1` means it has never been checked |
| VisibleVersionCount | Int | Number of visible versions of the replica |
| VersionCount | Int | Total number of versions of the replica. Useful for judging whether compaction is lagging |
| QueryHits | Int | The number of query hits on this replica |
| WindowAccessCount | Int | The number of accesses to this tablet within the sliding statistics window |
| LastAccessTime | Int | The timestamp in milliseconds of the last access to this tablet. `0` when never accessed |
| PathHash | Int | Hash of the data directory hosting the replica |
| Path | String | BE data root directory hosting the replica. Empty when it cannot be resolved |
| MetaUrl | String | HTTP address for inspecting the replica metadata, in the form `http://<be_host>:<be_http_port>/api/meta/header/<tablet_id>` |
| CompactionStatus | String | HTTP address for inspecting the replica compaction status, in the form `http://<be_host>:<be_http_port>/api/compaction/show?tablet_id=<tablet_id>` |
| CooldownReplicaId | Int | Cooldown replica ID. `-1` when tiered storage is not enabled |
| CooldownMetaId | String | Cooldown metadata ID. Empty when tiered storage is not enabled |
| PrimaryBackendId | Int | ID of the primary BE node for this tablet. **Returned only in compute-storage decoupled mode** |

### Data size semantics in decoupled mode

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments -->

:::caution Behavior change (4.0.8)

Starting from version 4.0.8, replica data size in compute-storage decoupled mode is consistently reported with **remote** semantics: data size that the replica statistics do not record as remote is counted into `RemoteDataSize`, and the corresponding `LocalDataSize` is reported as `0`. So in a decoupled cluster you usually see `LocalDataSize` as `0`, with the actual data size in `RemoteDataSize`.

Before 4.0.8, that data size was counted into `LocalDataSize`, which made `SHOW TABLETS`, [`information_schema.partitions`](../../../../admin-manual/system-tables/information_schema/partitions), and [`information_schema.backend_tablets`](../../../../admin-manual/system-tables/information_schema/backend_tablets) contradict each other on local versus remote. The change only adjusts how the size is reported; it does not change where the data is stored or how much there is.

:::

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege  | Object   | Notes                                                                                    |
|:-----------|:---------|:-----------------------------------------------------------------------------------------|
| Admin_priv | Global   | Both statements require the global `ADMIN` privilege. Otherwise an `Access denied` error is raised. |

## Examples

### Inspect a single tablet by its id

```sql
SHOW TABLET 10145;
```

```text
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
| DbName | TableName | PartitionName | IndexName | DbId  | TableId | PartitionId | IndexId | IsSync | Order | QueryHits | WindowAccessCount | LastAccessTime | DetailCmd                                                  |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
| test   | sell_user | sell_user     | sell_user | 10103 | 10143   | 10142       | 10144   | true   | 0     | 0         | 0                 | 0              | SHOW PROC '/dbs/10103/10143/partitions/10142/10144/10145'; |
+--------+-----------+---------------+-----------+-------+---------+-------------+---------+--------+-------+-----------+-------------------+----------------+------------------------------------------------------------+
```

The `SHOW PROC` statement given in the `DetailCmd` column inspects the replicas of that tablet in more detail.

### List every tablet of a table

```sql
SHOW TABLETS FROM example_db.sell_user;
```

### Restrict the result to specific partitions

```sql
SHOW TABLETS FROM example_db.sell_user PARTITIONS(p202601, p202602);
```

### Filter by replica state and hosting node

```sql
SHOW TABLETS FROM example_db.sell_user WHERE State = "NORMAL" AND BackendId = 10003;
```

### Find tablets where compaction is lagging

Sorting by version count descending surfaces the tablets under the most compaction pressure:

```sql
SHOW TABLETS FROM example_db.sell_user ORDER BY VersionCount DESC LIMIT 10;
```

The `CompactionStatus` column in the result is an HTTP address; open it in a browser to inspect the detailed compaction status of that replica.

### Find data skew

Sorting by data size descending quickly surfaces tablets that are noticeably larger than the rest:

```sql
-- Integrated storage-compute mode
SHOW TABLETS FROM example_db.sell_user ORDER BY LocalDataSize DESC LIMIT 10;

-- Compute-storage decoupled mode (data size is reported in RemoteDataSize)
SHOW TABLETS FROM example_db.sell_user ORDER BY RemoteDataSize DESC LIMIT 10;
```
