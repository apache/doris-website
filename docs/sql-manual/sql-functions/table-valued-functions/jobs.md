---
{
    "title": "JOBS",
    "language": "en",
    "description": "Table function, generating a temporary task table, which can view job information in a certain task type."
}
---

## Description

Table function, generating a temporary task table, which can view job information in a certain task type.

## Syntax

```sql
JOBS(
    "type"="<type>"
)
```

## Required Parameters
| Field         | Description                                                                                   |
|---------------|-----------------------------------------------------------------------------------------------|
| **`<type>`**  | The type of the job: <br/> `insert`: Insert into type job. <br/> `mv`: Materialized view job. |



## Return Value

-  **`jobs("type"="insert")`** Job return value of type insert

    | Field              | Description                |
    |--------------------|----------------------------|
    | Id                 | Job ID                     |
    | Name               | Job name                   |
    | Definer            | Job definer                |
    | ExecuteType        | Execution type             |
    | RecurringStrategy  | Recurring strategy         |
    | Status             | Job status                 |
    | ExecuteSql         | Execution SQL              |
    | CreateTime         | Job creation time          |
    | SucceedTaskCount   | Number of successful tasks |
    | FailedTaskCount    | Number of failed tasks     |
    | CanceledTaskCount  | Number of canceled tasks   |
    | Comment            | Job comment                |


- **`jobs("type"="mv")`** MV type job return value

    | Field                | Description                                                 |
    |----------------------|-------------------------------------------------------------|
    | Id                   | Job ID. For MV jobs, it corresponds to `tasks("type"="mv").JobId`. |
    | Name                 | Job name. For MV jobs, it corresponds to `mv_infos("database"="...").JobName` and `tasks("type"="mv").JobName`. |
    | MvId                 | ID of the materialized view maintained by this job. |
    | MvName               | Name of the materialized view maintained by this job. |
    | MvDatabaseId         | ID of the database that contains the materialized view. |
    | MvDatabaseName       | Name of the database that contains the materialized view. |
    | ExecuteType          | Job execution type. For MV jobs, possible values are `MANUAL` and `RECURRING`. `MANUAL` means refresh tasks are triggered manually, by commit, or by internal events. `RECURRING` means refresh tasks are scheduled periodically. |
    | RecurringStrategy    | Scheduling description derived from `ExecuteType`. `MANUAL TRIGGER` means the job does not run on a timer. `EVERY ... STARTS ... [ENDS ...]` means the job runs periodically. |
    | Status               | Job status. Possible values: `PENDING` means the job is waiting for scheduling; `RUNNING` means the job can produce tasks; `PAUSED` means the job is paused and can be resumed; `STOPPED` means the job has been stopped and cannot be resumed; `FINISHED` means the job has finished. |
    | CreateTime           | Time when the job was created. |

### MV job enum fields

The following enum fields are commonly used when checking materialized view refresh jobs:

- `ExecuteType`: how the job creates refresh tasks.
  - `MANUAL`: the job does not run on its own timer. A task is created only when a refresh is triggered manually, by commit, or by the system.
  - `RECURRING`: the job runs on a schedule and periodically creates refresh tasks.
- `RecurringStrategy`: human-readable scheduling rule generated from `ExecuteType`.
  - `MANUAL TRIGGER`: the job is not scheduled periodically. This is the usual value when `ExecuteType` is `MANUAL`.
  - `EVERY <interval> <unit> STARTS <time> [ENDS <time>]`: the job is scheduled periodically. For example, `EVERY 10 MINUTE STARTS 2025-01-17 14:42:53`.
- `Status`: current state of the job itself.
  - `PENDING`: the job is waiting to be scheduled.
  - `RUNNING`: the job is active and can create refresh tasks.
  - `PAUSED`: the job is paused. It will not create new refresh tasks until it is resumed.
  - `STOPPED`: the job has been stopped and cannot be resumed.
  - `FINISHED`: the job has finished. This is uncommon for long-lived MV refresh jobs, but it can appear in the generic job framework.

For materialized views, one materialized view has one refresh job, and one refresh job can create many refresh tasks. Use `jobs("type"="mv").Name` to connect the job to `mv_infos("database"="...").JobName` and `tasks("type"="mv").JobName`.


## Examples

View the refresh job of a materialized view.

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

In this result:

- `Id` is the MV refresh job ID. It is the same value as `JobId` in `tasks("type"="mv")`.
- `Name` is the MV refresh job name. It is the same value as `JobName` in `mv_infos("database"="test")` and `tasks("type"="mv")`.
- `MvId` and `MvName` identify the materialized view maintained by this job.
- `MvDatabaseId` and `MvDatabaseName` identify the database that contains the materialized view.
- `ExecuteType` is `MANUAL`, so this job does not run by its own timer. A refresh task is created when the materialized view is manually refreshed, refreshed on commit, or triggered by the system.
- `RecurringStrategy` is `MANUAL TRIGGER`, which matches `ExecuteType = MANUAL`. For a scheduled materialized view, this field is displayed as `EVERY ... STARTS ...`.
- `Status` is `RUNNING`, so the job can generate refresh tasks. If it is `PAUSED`, resume the materialized view job before expecting new tasks.
- `CreateTime` is the time when this MV refresh job was created.

To view the tasks generated by this job, use the job name:

```sql
select *
from tasks("type"="mv")
where JobName = "inner_mtmv_19494"
order by CreateTime desc;
```

View all insert jobs
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
