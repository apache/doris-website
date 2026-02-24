---
{
    "title": "CREATE JOB",
    "language": "zh-CN",
    "description": "Doris Job 是根据既定计划运行的任务，用于在特定时间或指定时间间隔触发预定义的操作，从而帮助我们自动执行一些任务。从功能上来讲，它类似于操作系统上的 定时任务（如：Linux 中的 cron、Windows 中的计划任务）。"
}
---

## 描述

Doris Job 是根据既定计划运行的任务，用于在特定时间或指定时间间隔触发预定义的操作，从而帮助我们自动执行一些任务。从功能上来讲，它类似于操作系统上的
定时任务（如：Linux 中的 cron、Windows 中的计划任务）。

Job 有两种类型：`ONE_TIME` 和 `RECURRING`。其中 `ONE_TIME` 类型的 Job 会在指定的时间点触发，它主要用于一次性任务，而 `RECURRING` 类型的 Job 会在指定的时间间隔内循环触发，此方式主要用于周期性执行的任务。
`RECURRING` 类型的 Job 可指定开始时间，结束时间，即 `STARTS/ENDS`, 如果不指定开始时间，则默认首次执行时间为当前时间 加 一次调度周期。如果指定结束时间，则 task 执行完成如果达到结束时间（或超过，或下次执行周期会超过结束时间）则更新为 FINISHED 状态，此时不会再产生 Task。

JOB 共 4 种状态（`RUNNING`,`STOPPED`,`PAUSED`,`FINISHED`），初始状态为 RUNNING，RUNNING 状态的 JOB 会根据既定的调度周期去生成 TASK 执行，Job 执行完成达到结束时间则状态变更为 `FINISHED`.

`PAUSED` 状态的 JOB 可以通过 RESUME 操作来恢复运行，更改为 `RUNNING` 状态。

`STOPPED` 状态的 JOB 由用户主动触发，此时会 Cancel 正在运行中的作业，然后删除 JOB。

`Finished` 状态的 JOB 会保留在系统中 24 H，24H 后会被删除。

JOB 只描述作业信息，执行会生成 TASK，TASK 状态分为 `PENDING`，`RUNNING`，`SUCCEESS`,`FAILED`,`CANCELED`.
`PENDING` 表示到达触发时间了但是等待资源 RUN，分配到资源后状态变更为 `RUNNING`，执行成功/失败即变更为 `SUCCESS`/`FAILED`.
`CANCELED` 即取消状态，TASK 持久化最终状态，即 `SUCCESS`/`FAILED`，其他状态运行中可以查到，但是如果重启则不可见。

## 语法

```sql

CREATE
    JOB  
    <job_name>
    ON SCHEDULE <schedule>
    [ COMMENT <string> ]
    DO <sql_body> 
```

其中：

```sql
schedule:
    {  AT <at_timestamp> | EVERY <interval> [STARTS <start_timestamp> ] [ENDS <end_timestamp> ]  }
```

其中：

```sql
interval:
    quantity { WEEK | DAY | HOUR | MINUTE }
```

## 必选参数

**1. `<job_name>`**
> 作业名称，它在一个 db 中标识唯一事件。JOB 名称必须是全局唯一的，如果已经存在同名的 JOB，则会报错。我们保留了 **inner_** 前缀在系统内部使用，因此用户不能创建以 **inner_** 开头的名称。

**2. `<schedule>`**
> ON SCHEDULE 子句，指定了 Job 作业的类型和触发时间以及频率，它可以指定一次性作业或者周期性作业。

**3. `<sql_body>`**
> DO 子句，它指定了 Job 作业触发时需要执行的操作，即一条 SQL 语句。

## 可选参数

**1. `AT <at_timestamp>`**
> 格式：'YYYY-MM-DD HH:MM:SS', 用于**一次性事件**，它指定事件仅在 给定的日期和时间执行一次 timestamp，当执行完成后，JOB 状态会变更为 FINISHED。

**2. `EVERY <interval>`**
> 表示定期重复操作，它指定了作业的执行频率，关键字后面要指定一个时间间隔，该时间间隔可以是天、小时、分钟、秒、周。

**3. `STARTS <start_timestamp>`**
> 格式：'YYYY-MM-DD HH:MM:SS',用于指定作业的开始时间，如果没有指定，则从当前时间的下一个时间点开始执行。开始时间必须大于当前时间。

**4. `ENDS <end_timestamp>`**
> 格式：'YYYY-MM-DD HH:MM:SS', 用于指定作业的结束时间，如果没有指定，则表示永久执行。该日期必须大于当前时间，如果指定了开始时间，即 STARTS，则结束时间必须大于开始时间。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）               |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV    | 数据库（DB）    | 目前仅支持 **ADMIN** 权限执行此操作 |

## 注意事项

- TASK 只保留最新的 100 条记录。

- 目前仅支持 **INSERT 内表** 操作，后续会支持更多的操作。

- 当下一个计划任务时间到期，即需要调度任务执行时，如果当前 JOB 仍有历史任务正在执行，则会跳过当前任务调度。因此控制一个合理的执行间隔非常重要。

## 示例

- 创建一个名为 my_job 的作业，每分钟执行一次，执行的操作是将 db2.tbl2 中的数据导入到 db1.tbl1 中。

    ```sql
    CREATE JOB my_job ON SCHEDULE EVERY 1 MINUTE DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
    ```

- 创建一个一次性的 Job，它会在 2020-01-01 00:00:00 时执行一次，执行的操作是将 db2.tbl2 中的数据导入到 db1.tbl1 中。
    
    ```sql
    CREATE JOB my_job ON SCHEDULE AT '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
    ```

- 创建一个周期性的 Job，它会在 2020-01-01 00:00:00 时开始执行，每天执行一次，执行的操作是将 db2.tbl2 中的数据导入到 db1.tbl1 中。

    ```sql
    CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE  create_time >=  days_add(now(),-1);
    ```
  
- 创建一个周期性的 Job，它会在 2020-01-01 00:00:00 时开始执行，每天执行一次，执行的操作是将 db2.tbl2 中的数据导入到 db1.tbl1 中，该 Job 在 2020-01-01 00:10:00 时结束。

    ```sql
    CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' ENDS '2020-01-01 00:10:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 create_time >=  days_add(now(),-1);
    ```

## 最佳实践

- 合理的进行 Job 的管理，避免大量的 Job 同时触发，导致任务堆积，从而影响系统的正常运行。
- 任务的执行间隔应该设置在一个合理的范围，至少应该大于任务执行时间。

## 相关文档

- [暂停-JOB](../job/PAUSE-JOB.md)
- [恢复-JOB](../job/RESUME-JOB.md)
- [删除-JOB](../job/DROP-JOB.md)
- [查询-JOB](../../../sql-manual/sql-functions/table-valued-functions/jobs.md)
- [查询-TASKS](../../sql-functions/table-valued-functions/jobs.md)

## CONFIG

**fe.conf**

- job_dispatch_timer_job_thread_num, 用于分发定时任务的线程数，默认值 2，如果含有大量周期执行任务，可以调大这个参数。

- job_dispatch_timer_job_queue_size, 任务堆积时用于存放定时任务的队列大小，默认值 1024. 如果有大量任务同一时间触发，可以调大这个参数。否则会导致队列满，提交任务会进入阻塞状态，从而导致后续任务无法提交。

- finished_job_cleanup_threshold_time_hour, 用于清理已完成的任务的时间阈值，单位为小时，默认值为 24 小时。

- job_insert_task_consumer_thread_num = 10;用于执行 Insert 任务的线程数，值应该大于 0，否则默认为 5.


