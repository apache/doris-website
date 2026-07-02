---
{
    "title": "TASKS",
    "language": "zh-CN",
    "description": "表函数，生成 tasks 临时表，可以查看当前 doris 集群中的 job 产生的 tasks 信息。"
}
---

## 描述

表函数，生成 tasks 临时表，可以查看当前 doris 集群中的 job 产生的 tasks 信息。

## 语法
```sql
TASKS(
    "type"="<type>"
)
```

## 参数
| 参数          | 描述                                                            |
|--------------|---------------------------------------------------------------|
| **`<type>`** | 任务的类型：<br/> `insert`：insert into 类型的任务。 <br/> `mv`：物化视图类型的任务。 |


## 返回值

该表函数返回 0 行或多行结果。函数本身不返回 NULL；当对应 task 元数据不可用时，部分字段可能为空、`NULL` 或 `\N`。

- **`tasks("type"="insert")`** insert 类型的 tasks 返回值

  | 参数          | 描述                      |
  |--------------|---------------------------|
  | **TaskId**   | task id                   |
  | **JobId**    | job id                    |
  | **JobName**  | job 名称                   |
  | **Label**    | label                     |
  | **Status**   | task 状态                  |
  | **ErrorMsg** | task 失败信息              |
  | **CreateTime**| task 创建时间             |
  | **FinishTime**| task 结束时间             |
  | **TrackingUrl**| task tracking url        |
  | **LoadStatistic**| task 统计信息           |
  | **User**     | 执行用户                   |



- **`tasks("type"="mv")`** MV 类型的 tasks 返回值

  | 参数          | 描述                           |
  |-----------------------|--------------------------------|
  | **TaskId**            | 刷新任务的唯一 ID。每次物化视图刷新都会生成一条新的 task 记录。 |
  | **JobId**             | 生成该 task 的 job ID，对应 `jobs("type"="mv").Id`。 |
  | **JobName**           | 生成该 task 的 job 名称，对应 `mv_infos("database"="...").JobName` 和 `jobs("type"="mv").Name`。 |
  | **MvId**              | 该 task 刷新的物化视图 ID。 |
  | **MvName**            | 该 task 刷新的物化视图名称。 |
  | **MvDatabaseId**      | 物化视图所属数据库 ID。 |
  | **MvDatabaseName**    | 物化视图所属数据库名称。 |
  | **Status**            | task 状态。可取值：`PENDING` 表示等待运行；`RUNNING` 表示正在运行；`SUCCESS` 表示运行成功；`FAILED` 表示运行失败；`CANCELED` 表示已取消。 |
  | **ErrorMsg**          | 当 `Status` 为 `FAILED` 或 `CANCELED` 时记录错误信息；运行成功时通常为空。 |
  | **CreateTime**        | task 记录创建时间。 |
  | **StartTime**         | task 开始运行时间。如果 task 尚未开始，可能为 `\N`。 |
  | **FinishTime**        | task 结束时间。如果 task 仍在等待或运行，可能为 `\N`。 |
  | **DurationMs**        | task 运行耗时，单位毫秒，按 `FinishTime - StartTime` 计算。如果 task 尚未结束，可能为 `\N`。 |
  | **TaskContext**       | task 触发方式和用户刷新参数的 JSON 字符串。常见字段包括 `triggerMode`、`partitions` 和 `isComplete`。`triggerMode` 可取值为 `MANUAL`、`COMMIT`、`SYSTEM`。 |
  | **RefreshMode**       | 该 task 实际执行的刷新范围。可取值：`COMPLETE` 表示刷新全部物化视图分区；`PARTIAL` 表示只刷新部分分区；`NOT_REFRESH` 表示没有分区需要刷新。 |
  | **NeedRefreshPartitions** | JSON 数组，记录本次 task 需要刷新的物化视图分区。空数组表示没有分区需要刷新。 |
  | **CompletedPartitions** | JSON 数组，记录本次 task 已成功刷新的分区。可与 `NeedRefreshPartitions` 对比判断是否全部完成。 |
  | **Progress**          | task 刷新进度，格式为 `百分比 (已完成分区数/需刷新分区数)`，例如 `100.00% (1/1)`。没有分区需要刷新时可能为 `\N`。 |
  | **LastQueryId**       | 刷新 task 执行 SQL 的 query ID。排查 task 失败或耗时时，可用该 ID 搜索 FE 或 BE 日志。没有执行刷新 SQL 时可能为空。该字段从 Doris 3.0.0 开始支持。 |

### MV task 枚举字段说明

查看物化视图刷新 task 时，下面这些枚举字段最常用：

- `Status`：task 生命周期状态。
  - `PENDING`：task 已创建，但还没有开始执行，正在等待调度或资源。
  - `RUNNING`：task 正在执行。
  - `SUCCESS`：task 执行成功。
  - `FAILED`：task 执行失败。优先查看 `ErrorMsg`；如果 `LastQueryId` 不为空，可以用它搜索日志。
  - `CANCELED`：task 在完成前被取消。
- `TaskContext.triggerMode`：该 task 是因为什么原因创建的。
  - `MANUAL`：由手动刷新命令创建，例如 `REFRESH MATERIALIZED VIEW`。
  - `COMMIT`：由相关基表数据变更触发创建。
  - `SYSTEM`：由系统内部动作创建，例如创建物化视图时的初始构建。
- `TaskContext.isComplete`：刷新请求是否要求全量刷新。
  - `true`：请求 Doris 刷新全部物化视图分区。
  - `false`：请求不强制全量刷新，Doris 可以根据分区新鲜度判断实际刷新范围。
- `RefreshMode`：task 检查分区后选择的实际刷新范围。
  - `COMPLETE`：选择刷新该物化视图的全部分区。
  - `PARTIAL`：只选择刷新部分物化视图分区。
  - `NOT_REFRESH`：没有分区需要刷新。此时 `NeedRefreshPartitions` 通常为空，`Progress` 可能为 `\N`。

:::info 版本说明

`LastQueryId` 从 Doris 3.0.0 开始支持，Doris 2.1.x 没有该字段。

:::


## 示例

查看某个物化视图最近一次刷新 task。

```sql
select *
from tasks("type"="mv")
where MvDatabaseName = "test" and MvName = "mv1"
order by CreateTime desc
limit 1\G
```
```text
*************************** 1. row ***************************
               TaskId: 437156301250803
                JobId: 19508
              JobName: inner_mtmv_19494
                 MvId: 19494
               MvName: mv1
         MvDatabaseId: 16016
       MvDatabaseName: test
               Status: SUCCESS
             ErrorMsg:
           CreateTime: 2025-01-07 22:13:48
            StartTime: 2025-01-07 22:13:48
           FinishTime: 2025-01-07 22:17:45
           DurationMs: 236985
          TaskContext: {"triggerMode":"MANUAL","partitions":[],"isComplete":false}
          RefreshMode: COMPLETE
NeedRefreshPartitions: ["p_20210101_MAXVALUE","p_20200101_20210101"]
  CompletedPartitions: ["p_20210101_MAXVALUE","p_20200101_20210101"]
             Progress: 100.00% (2/2)
          LastQueryId: 7965b4ddce8a4480-8884e9701679c1c4
```

该结果中：

- `TaskId` 表示这次刷新执行的唯一 ID。每次刷新都会生成不同的 task。
- `JobId` 和 `JobName` 标识该 task 所属的物化视图刷新 job。可以通过 `select * from jobs("type"="mv") where Name = "inner_mtmv_19494";` 查询 job。
- `MvId`、`MvName`、`MvDatabaseId`、`MvDatabaseName` 标识该 task 刷新的物化视图。
- `Status` 为 `SUCCESS`，表示 task 执行成功。如果为 `FAILED`，优先查看 `ErrorMsg`。
- `CreateTime`、`StartTime`、`FinishTime`、`DurationMs` 分别表示 task 创建时间、开始运行时间、结束时间和运行耗时。
- `TaskContext` 表示该 task 是手动触发的。`partitions: []` 表示刷新命令没有指定分区列表。
- `RefreshMode` 为 `COMPLETE`，表示本次 task 刷新了该物化视图需要刷新的全部分区。
- `NeedRefreshPartitions` 列出本次需要刷新的两个分区，`CompletedPartitions` 列出同样两个分区，说明需要刷新的分区都已完成。
- `Progress` 为 `100.00% (2/2)`，也表示两个需要刷新的分区都已完成。
- `LastQueryId` 是刷新 SQL 的 query ID。排查 task 失败或耗时时，可以用该 ID 搜索 Doris 日志。

:::info 备注

task 记录默认保存和展示数量由 FE 配置项 `max_persistence_task_count` 控制，默认值为 100。超过该数量时，旧 task 记录会被丢弃。如果该值小于 1，则不持久化 task 记录。修改该配置后需要重启 FE 生效。

:::

查看所有 insert 任务的 tasks
```sql
select * from tasks("type"="insert");
```
```text
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
| TaskId         | JobId          | JobName        | Label                         | Status  | ErrorMsg | CreateTime          | StartTime           | FinishTime          | TrackingUrl | LoadStatistic | User |
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
| 79133848479750 | 78533940810334 | insert_tab_job | 78533940810334_79133848479750 | SUCCESS |          | 2025-01-17 14:42:54 | 2025-01-17 14:42:54 | 2025-01-17 14:42:54 |             |               | root |
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
```
