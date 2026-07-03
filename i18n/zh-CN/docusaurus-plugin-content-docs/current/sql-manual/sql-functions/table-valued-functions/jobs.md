---
{
    "title": "JOBS",
    "language": "zh-CN",
    "description": "表函数，生成任务临时表，可以查看某个任务类型中的 job 信息。"
}
---

## 描述

表函数，生成任务临时表，可以查看某个任务类型中的 job 信息。

## 语法

```sql
JOBS(
    "type"="<type>"
)
```

## 必填参数 (Required Parameters)
| 字段名          | 描述                                                            |
|--------------|---------------------------------------------------------------|
| **`<type>`** | 任务的类型：<br/> `insert`：insert into 类型的任务。 <br/> `mv`：物化视图类型的任务。 |


## 返回值

- **`jobs("type"="insert")`** insert 类型的 job 返回值
    
    | 字段名             | 描述                           |
    |--------------------|--------------------------------|
    | Id                 | job id                        |
    | Name               | job 名称                       |
    | Definer            | job 定义者                     |
    | ExecuteType        | 执行类型                       |
    | RecurringStrategy  | 循环策略                       |
    | Status             | job 状态                       |
    | ExecuteSql         | 执行 SQL                       |
    | CreateTime         | job 创建时间                   |
    | SucceedTaskCount   | 成功任务数量                   |
    | FailedTaskCount    | 失败任务数量                   |
    | CanceledTaskCount  | 取消任务数量                   |
    | Comment            | job 注释                       |


- **`jobs("type"="mv")`** MV 类型的 job 返回值
    
    | 字段名              | 描述                                 |
    |---------------------|--------------------------------------|
    | Id                  | job ID。对于 MV job，该字段对应 `tasks("type"="mv").JobId`。 |
    | Name                | job 名称。对于 MV job，该字段对应 `mv_infos("database"="...").JobName` 和 `tasks("type"="mv").JobName`。 |
    | MvId                | 该 job 维护的物化视图 ID。 |
    | MvName              | 该 job 维护的物化视图名称。 |
    | MvDatabaseId        | 物化视图所属数据库 ID。 |
    | MvDatabaseName      | 物化视图所属数据库名称。 |
    | ExecuteType         | job 执行类型。MV job 可取值为 `MANUAL` 和 `RECURRING`。`MANUAL` 表示刷新 task 由手动刷新、提交触发或系统内部事件触发；`RECURRING` 表示按周期调度刷新。 |
    | RecurringStrategy   | 根据 `ExecuteType` 生成的调度描述。`MANUAL TRIGGER` 表示该 job 不按定时器自动运行；`EVERY ... STARTS ... [ENDS ...]` 表示周期调度。 |
    | Status              | job 状态。可取值：`PENDING` 表示等待调度；`RUNNING` 表示 job 可生成 task；`PAUSED` 表示 job 已暂停且可恢复；`STOPPED` 表示 job 已停止且不可恢复；`FINISHED` 表示 job 已结束。 |
    | CreateTime          | job 创建时间。 |

### MV job 枚举字段说明

查看物化视图刷新 job 时，下面这些枚举字段最常用：

- `ExecuteType`：job 创建刷新 task 的方式。
  - `MANUAL`：job 不按自己的定时器运行。只有手动刷新、提交触发刷新或系统触发刷新时，才会创建 task。
  - `RECURRING`：job 按调度周期运行，会周期性创建刷新 task。
- `RecurringStrategy`：根据 `ExecuteType` 生成的可读调度规则。
  - `MANUAL TRIGGER`：job 不按周期调度。`ExecuteType` 为 `MANUAL` 时通常显示这个值。
  - `EVERY <interval> <unit> STARTS <time> [ENDS <time>]`：job 按周期调度。例如 `EVERY 10 MINUTE STARTS 2025-01-17 14:42:53`。
- `Status`：job 自身当前状态。
  - `PENDING`：job 正在等待调度。
  - `RUNNING`：job 处于运行状态，可以创建刷新 task。
  - `PAUSED`：job 已暂停。恢复前不会创建新的刷新 task。
  - `STOPPED`：job 已停止，不能恢复。
  - `FINISHED`：job 已结束。对于长期存在的物化视图刷新 job 不常见，但通用 job 框架中可能出现。

对于物化视图，一个物化视图对应一个刷新 job，一个刷新 job 可以创建多个刷新 task。可以用 `jobs("type"="mv").Name` 关联 `mv_infos("database"="...").JobName` 和 `tasks("type"="mv").JobName`。


## 示例

查看某个物化视图的刷新 job。

```sql
select *
from jobs("type"="mv")
where MvDatabaseName = "test" and MvName = "mv1"\G
```
```text
*************************** 1. row ***************************
               Id: 19508
             Name: inner_mtmv_19494
             MvId: 19494
           MvName: mv1
     MvDatabaseId: 16016
   MvDatabaseName: test
      ExecuteType: MANUAL
RecurringStrategy: MANUAL TRIGGER
           Status: RUNNING
       CreateTime: 2025-01-07 22:13:31
```

该结果中：

- `Id` 是物化视图刷新 job ID，与 `tasks("type"="mv")` 中的 `JobId` 相同。
- `Name` 是物化视图刷新 job 名称，与 `mv_infos("database"="test")` 和 `tasks("type"="mv")` 中的 `JobName` 相同。
- `MvId` 和 `MvName` 标识该 job 维护的物化视图。
- `MvDatabaseId` 和 `MvDatabaseName` 标识物化视图所属数据库。
- `ExecuteType` 为 `MANUAL`，表示该 job 不按自身定时器运行。当物化视图被手动刷新、提交触发刷新或系统触发刷新时，才会生成刷新 task。
- `RecurringStrategy` 为 `MANUAL TRIGGER`，与 `ExecuteType = MANUAL` 对应。如果是定时刷新的物化视图，该字段会显示为 `EVERY ... STARTS ...`。
- `Status` 为 `RUNNING`，表示该 job 可以生成刷新 task。如果为 `PAUSED`，需要先恢复物化视图 job，才会继续产生新 task。
- `CreateTime` 表示该物化视图刷新 job 的创建时间。

查看该 job 生成的刷新 task：

```sql
select *
from tasks("type"="mv")
where JobName = "inner_mtmv_19494"
order by CreateTime desc;
```

查看所有 insert 任务的 job

```sql
select * from jobs("type"="insert");
```
```text
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| Id             | Name           | Definer | ExecuteType | RecurringStrategy                          | Status  | ExecuteSql                                                   | CreateTime          | SucceedTaskCount | FailedTaskCount | CanceledTaskCount | Comment |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| 78533940810334 | insert_tab_job | root    | RECURRING   | EVERY 10 MINUTE STARTS 2025-01-17 14:42:53 | RUNNING | INSERT INTO test.insert_tab SELECT * FROM test.example_table | 2025-01-17 14:32:53 | 0                | 0               | 0                 |         |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
```
