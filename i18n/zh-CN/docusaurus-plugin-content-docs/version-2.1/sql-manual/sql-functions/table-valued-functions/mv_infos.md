---
{
    "title": "MV_INFOS",
    "language": "zh-CN",
    "description": "表函数，生成异步物化视图临时表，可以查看某个 db 中创建的异步物化视图信息。"
}
---

## 描述

表函数，生成异步物化视图临时表，可以查看某个 db 中创建的异步物化视图信息。


## 语法
```sql
MV_INFOS("database"="<database>")
```

## 参数

| 参数              | 描述 |
|-------------------|------|
| **`<database>`** | 字符串，必填。指定需要查询异步物化视图元数据的数据库名。 |

## 返回值

该表函数返回 0 行或多行异步物化视图信息。函数本身不返回 NULL；当对应元数据不可用时，部分字段可能为空或 `NULL`。

| 字段名称                | 类型    | 说明                                                               |
|-------------------------|---------|--------------------------------------------------------------------|
| Id                      | BIGINT  | 物化视图 id                                                         |
| Name                    | TEXT    | 物化视图 Name                                                       |
| JobName                 | TEXT    | 物化视图对应的刷新 job 名称，可用于查询 `jobs("type"="mv")` 和 `tasks("type"="mv")`。 |
| State                   | TEXT    | 物化视图元数据状态。可取值：`INIT`、`NORMAL`、`SCHEMA_CHANGE`。 |
| SchemaChangeDetail      | TEXT    | `State` 变为 `SCHEMA_CHANGE` 的原因。物化视图不处于 schema change 状态时通常为空。 |
| RefreshState            | TEXT    | 最近一次刷新状态。可取值：`INIT`、`SUCCESS`、`FAIL`。 |
| RefreshInfo             | TEXT    | 物化视图定义的刷新策略信息，包括构建方式、刷新方式和触发方式。 |
| QuerySql                | TEXT    | 物化视图定义的查询语句                                             |
| EnvInfo                 | TEXT    | 物化视图创建时的环境信息                                           |
| MvProperties            | TEXT    | 物化视属性                                                         |
| MvPartitionInfo         | TEXT    | 物化视图的分区信息                                                 |
| SyncWithBaseTables      | BOOLEAN | 物化视图数据是否和基表数据同步。如需查看哪个分区不同步，请使用 [SHOW PARTITIONS](../../sql-statements/table-and-view/table/SHOW-PARTITIONS)。 |

`RefreshInfo` 的展示格式为 `BUILD <BuildMode> REFRESH <RefreshMethod> ON <RefreshTrigger> [schedule]`。每一部分的含义见下面的枚举字段说明。

### MV 信息枚举字段说明

查看物化视图定义和健康状态时，下面这些枚举字段最常用：

- `State`：物化视图元数据状态。
  - `INIT`：物化视图已创建，但还没有进入正常可用的元数据状态。
  - `NORMAL`：物化视图元数据正常。大多数情况下应该是这个状态。
  - `SCHEMA_CHANGE`：基表或相关对象的 schema 变更影响了该物化视图。需要查看 `SchemaChangeDetail` 了解原因。此时物化视图通常仍可直接查询，但在刷新成功前可能不能用于透明改写。
- `RefreshState`：最近一次刷新结果状态。
  - `INIT`：还没有记录刷新结果。
  - `SUCCESS`：最近一次刷新成功。
  - `FAIL`：最近一次刷新失败。可以用 `JobName` 查询 `tasks("type"="mv")`，查看失败 task 的 `ErrorMsg`。
- `RefreshInfo.BuildMode`：Doris 什么时候构建物化视图数据。
  - `IMMEDIATE`：创建物化视图后立即构建。
  - `DEFERRED`：创建时不立即构建，需要后续刷新后才有新鲜数据。
- `RefreshInfo.RefreshMethod`：Doris 如何选择要刷新的数据。
  - `COMPLETE`：总是全量刷新物化视图。
  - `AUTO`：Doris 自动判断刷新全部分区还是只刷新变更分区。
- `RefreshInfo.RefreshTrigger`：什么动作触发刷新 task。
  - `MANUAL`：手动触发刷新。
  - `COMMIT`：相关基表数据变更后触发刷新。
  - `SCHEDULE`：按调度周期触发刷新。调度细节会出现在 `RefreshInfo` 的 `ON SCHEDULE` 后面。
- `MvPartitionInfo.partitionType`：物化视图的分区方式。
  - `FOLLOW_BASE_TABLE`：物化视图分区跟随基表分区列。
  - `SELF_MANAGE`：物化视图自己管理分区。

:::info 版本说明

Doris 2.1.x 的 `MvPartitionInfo.partitionType` 支持 `FOLLOW_BASE_TABLE` 和 `SELF_MANAGE`。`EXPR` 分区类型从 Doris 3.0.0 开始支持。

:::

- `SyncWithBaseTables`：物化视图数据是否和基表同步。
  - `1` 或 `true`：已同步。
  - `0` 或 `false`：未完全同步。对于分区物化视图，可以用 `SHOW PARTITIONS FROM <mv_name>` 查看分区级同步状态。


## 示例

查看 `test` 数据库下名为 `mv1` 的物化视图。

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

该结果中：

- `Id` 和 `Name` 标识该物化视图。
- `JobName` 是该物化视图的刷新 job 名称。可以通过该字段继续查询 job 或刷新 task，例如 `select * from jobs("type"="mv") where Name = "inner_mtmv_19494";`。
- `State` 为 `NORMAL`，表示物化视图元数据状态正常。`INIT` 表示物化视图刚创建或初始化中；`SCHEMA_CHANGE` 表示基表 schema 变更影响了该物化视图，此时需要查看 `SchemaChangeDetail`。
- `SchemaChangeDetail` 为空，因为当前 `State` 不是 `SCHEMA_CHANGE`。
- `RefreshState` 为 `SUCCESS`，表示最近一次刷新成功。`INIT` 表示尚未记录成功刷新状态；`FAIL` 表示最近一次刷新失败，此时可使用 `JobName` 查询 `tasks("type"="mv")`，查看失败 task 的 `ErrorMsg`。
- `RefreshInfo` 为 `BUILD DEFERRED REFRESH AUTO ON MANUAL`。`BUILD DEFERRED` 表示创建物化视图时不立即构建；`REFRESH AUTO` 表示 Doris 自动判断刷新全部分区还是部分分区；`ON MANUAL` 表示刷新由手动触发，而不是定时触发。
- `QuerySql` 是物化视图定义的查询 SQL。
- `EnvInfo` 记录物化视图创建时的环境信息。
- `MvProperties` 展示物化视图属性。本例中，分区同步由 `partition_sync_limit=100` 和 `partition_sync_time_unit=YEAR` 控制。
- `MvPartitionInfo` 展示物化视图分区方式。在 Doris 2.1.x 中，`FOLLOW_BASE_TABLE` 表示跟随基表分区列，`SELF_MANAGE` 表示物化视图自己管理分区。`EXPR` 分区类型从 Doris 3.0.0 开始支持。
- `SyncWithBaseTables` 为 `1`，表示物化视图数据和基表数据同步。`0` 表示不完全同步。对于分区物化视图，可使用 `SHOW PARTITIONS FROM <mv_name>` 查看分区级同步状态。

查看该物化视图最近一次刷新 task：

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
