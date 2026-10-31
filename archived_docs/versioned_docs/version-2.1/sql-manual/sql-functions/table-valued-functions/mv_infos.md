---
{
    "title": "MV_INFOS",
    "language": "en",
    "description": "Table function, generating temporary tables for asynchronous materialized views,"
}
---

## Description

Table function, generating temporary tables for asynchronous materialized views, which can view information about asynchronous materialized views created in a certain database.

## Syntax
```sql
MV_INFOS("database"="<database>")
```

## Parameters

| Parameter        | Description |
|------------------|-------------|
| **`<database>`** | Required. String type. Name of the database whose asynchronous materialized view metadata you want to query. |

## Return Value

This table function returns zero or more rows describing asynchronous materialized views. The function itself does not return NULL. Individual fields can be empty or `NULL` when the corresponding metadata is unavailable.

| Field                  | Type    | Description                                                         |
|------------------------|---------|---------------------------------------------------------------------|
| Id                     | BIGINT  | Materialized view ID                                                |
| Name                   | TEXT    | Materialized view name                                              |
| JobName                | TEXT    | Name of the refresh job corresponding to the materialized view. It can be used to query `jobs("type"="mv")` and `tasks("type"="mv")`. |
| State                  | TEXT    | Metadata state of the materialized view. Possible values: `INIT`, `NORMAL`, and `SCHEMA_CHANGE`. |
| SchemaChangeDetail     | TEXT    | Reason why `State` becomes `SCHEMA_CHANGE`. Empty when the materialized view is not in schema change state. |
| RefreshState           | TEXT    | State of the latest refresh. Possible values: `INIT`, `SUCCESS`, and `FAIL`. |
| RefreshInfo            | TEXT    | Refresh strategy defined for the materialized view, including build mode, refresh method, and trigger mode. |
| QuerySql               | TEXT    | SQL query defined for the materialized view                          |
| EnvInfo                | TEXT    | Environment information when the materialized view was created       |
| MvProperties           | TEXT    | Materialized view properties                                         |
| MvPartitionInfo        | TEXT    | Partition information of the materialized view                       |
| SyncWithBaseTables     | BOOLEAN | Whether the data of the materialized view is synchronized with its base tables. To check which partition is not synchronized, use [SHOW PARTITIONS](../../sql-statements/table-and-view/table/SHOW-PARTITIONS). |

`RefreshInfo` is displayed as `BUILD <BuildMode> REFRESH <RefreshMethod> ON <RefreshTrigger> [schedule]`. The meaning of each part is described in the enum section below.

### MV info enum fields

The following enum fields are commonly used when checking materialized view definitions and health:

- `State`: metadata state of the materialized view.
  - `INIT`: the materialized view has been created but has not reached normal usable metadata state yet.
  - `NORMAL`: the materialized view metadata is normal. This is the expected state in most cases.
  - `SCHEMA_CHANGE`: a schema change on a base table or related object affected this materialized view. Check `SchemaChangeDetail` for the reason. The materialized view can usually be queried directly, but it may not be available for transparent rewrite until it is refreshed successfully.
- `RefreshState`: result state of the latest refresh.
  - `INIT`: no refresh result has been recorded yet.
  - `SUCCESS`: the latest refresh finished successfully.
  - `FAIL`: the latest refresh failed. Use `JobName` to query `tasks("type"="mv")` and check the failed task's `ErrorMsg`.
- `RefreshInfo.BuildMode`: when Doris builds the materialized view data.
  - `IMMEDIATE`: build the materialized view immediately after creation.
  - `DEFERRED`: do not build it at creation time. The materialized view needs a later refresh before it has fresh data.
- `RefreshInfo.RefreshMethod`: how Doris chooses data to refresh.
  - `COMPLETE`: always refresh the materialized view completely.
  - `AUTO`: Doris decides whether to refresh all partitions or only changed partitions.
- `RefreshInfo.RefreshTrigger`: what triggers refresh tasks.
  - `MANUAL`: refresh is triggered manually.
  - `COMMIT`: refresh is triggered by data changes on related base tables.
  - `SCHEDULE`: refresh is triggered by a schedule. The schedule details appear after `ON SCHEDULE` in `RefreshInfo`.
- `MvPartitionInfo.partitionType`: how the materialized view is partitioned.
  - `FOLLOW_BASE_TABLE`: materialized view partitions follow a base table partition column.
  - `SELF_MANAGE`: the materialized view manages its own partitions.

:::info Version

Doris 2.1.x supports `FOLLOW_BASE_TABLE` and `SELF_MANAGE` for `MvPartitionInfo.partitionType`. The `EXPR` partition type is supported since Doris 3.0.0.

:::

- `SyncWithBaseTables`: whether materialized view data is synchronized with base tables.
  - `1` or `true`: synchronized.
  - `0` or `false`: not fully synchronized. For partitioned materialized views, use `SHOW PARTITIONS FROM <mv_name>` to check partition-level synchronization.

## Examples

View a materialized view under database `test`.

```sql
select *
from mv_infos("database"="test")
where Name = "mv1"\G
```
```text
*************************** 1. row ***************************
                Id: 19494
              Name: mv1
           JobName: inner_mtmv_19494
             State: NORMAL
SchemaChangeDetail:
      RefreshState: SUCCESS
       RefreshInfo: BUILD DEFERRED REFRESH AUTO ON MANUAL
          QuerySql: SELECT `internal`.`test`.`user`.`k2`, `internal`.`test`.`user`.`k3` FROM `internal`.`test`.`user`
           EnvInfo: EnvInfo{ctlId='0', dbId='16813'}
      MvProperties: {partition_sync_limit=100, partition_sync_time_unit=YEAR}
   MvPartitionInfo: MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=user, relatedCol='k2', partitionCol='k2'}
SyncWithBaseTables: 1
```

In this result:

- `Id` and `Name` identify the materialized view.
- `JobName` is the refresh job name for this materialized view. Use it to query the job or refresh tasks, for example `select * from jobs("type"="mv") where Name = "inner_mtmv_19494";`.
- `State` is `NORMAL`, which means the materialized view metadata is normal. `INIT` means the materialized view has just been created or initialized. `SCHEMA_CHANGE` means a schema change on a base table affected this materialized view; in this state, check `SchemaChangeDetail`.
- `SchemaChangeDetail` is empty because `State` is not `SCHEMA_CHANGE`.
- `RefreshState` is `SUCCESS`, which means the latest refresh succeeded. `INIT` means no successful refresh state has been recorded yet. `FAIL` means the latest refresh failed; query `tasks("type"="mv")` with `JobName` to find the failed task and its `ErrorMsg`.
- `RefreshInfo` is `BUILD DEFERRED REFRESH AUTO ON MANUAL`. `BUILD DEFERRED` means the materialized view was not built immediately at creation time. `REFRESH AUTO` means Doris decides whether to refresh all partitions or only changed partitions. `ON MANUAL` means refresh is triggered manually rather than by a schedule.
- `QuerySql` is the query definition of the materialized view.
- `EnvInfo` records the environment information when the materialized view was created.
- `MvProperties` shows the properties of the materialized view. In this example, partition synchronization is limited by `partition_sync_limit=100` and `partition_sync_time_unit=YEAR`.
- `MvPartitionInfo` shows how the materialized view is partitioned. In Doris 2.1.x, `FOLLOW_BASE_TABLE` means the materialized view follows a base table partition column, and `SELF_MANAGE` means the materialized view manages its own partitions. The `EXPR` partition type is supported since Doris 3.0.0.
- `SyncWithBaseTables` is `1`, which means the materialized view data is synchronized with its base tables. `0` means it is not fully synchronized. For partitioned materialized views, use `SHOW PARTITIONS FROM <mv_name>` to check partition-level synchronization.

To view the latest refresh task of this materialized view:

```sql
select TaskId, JobName, MvName, Status, ErrorMsg, CreateTime, FinishTime
from tasks("type"="mv")
where JobName = "inner_mtmv_19494"
order by CreateTime desc
limit 1;
```
```text
+-----------------+------------------+--------+---------+----------+---------------------+---------------------+
| TaskId          | JobName          | MvName | Status  | ErrorMsg | CreateTime          | FinishTime          |
+-----------------+------------------+--------+---------+----------+---------------------+---------------------+
| 437156301250803 | inner_mtmv_19494 | mv1    | SUCCESS |          | 2025-01-07 22:13:48 | 2025-01-07 22:17:45 |
+-----------------+------------------+--------+---------+----------+---------------------+---------------------+
```
