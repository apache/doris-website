---
{
"title": "CREATE JOB",
"language": "en"
}

---

## Description

Doris Job is a task that runs according to a set plan. It is used to trigger predefined operations at a specific time or a specified time interval, so as to help us automatically perform some tasks. Functionally, it is similar to the scheduled task on the operating system (such as cron in Linux and scheduled tasks in Windows).

There are two types of jobs: `ONE_TIME` and `RECURRING`. Among them, the `ONE_TIME` type of job will be triggered at a specified time point. It is mainly used for one-time tasks, while the `RECURRING` type of job will be triggered cyclically within a specified time interval. This method is mainly used for periodic tasks.
The `RECURRING` type of job can specify the start time and end time, that is, `STARTS/ENDS`. If the start time is not specified, the default first execution time is the current time + one scheduling cycle. If the end time is specified, the task execution is completed. If the end time is reached (or exceeded, or the next execution cycle will exceed the end time), it will be updated to the FINISHED state, and no more tasks will be generated at this time.

There are 4 states for a job (`RUNNING`, `STOPPED`, `PAUSED`, `FINISHED`). 

The initial state is `RUNNING`. A job in the `RUNNING` state will generate a TASK for execution according to the established scheduling cycle. When the job is completed and reaches the end time, the state changes to `FINISHED`.

A job in the `PAUSED` state can be resumed through the RESUME operation and changed to the RUNNING state.

A job in the `STOPPED` state is actively triggered by the user, and the running job will be canceled and the job will be deleted.

A job in the `FINISHED` state will be retained in the system for 24 hours and will be deleted after 24 hours.

JOB only describes job information. Execution will generate TASK. TASK status is divided into `PENDING`, `RUNNING`, `SUCCEESS`, `FAILED`, `CANCELED`
`PENDING` means that the trigger time has arrived but the resource run is waiting. After the resource is allocated, the status changes to `RUNNING`. Success/failure of execution changes to `SUCCESS`/`FAILED`.
`CANCELED` means cancellation status. TASK persists the final status, i.e. `SUCCESS`/`FAILED`. Other statuses can be checked during operation, but will not be visible if restarted.

## Syntax

```sql
CREATE
    JOB  
    <job_name>
    ON SCHEDULE <schedule>
    [ COMMENT <string> ]
    DO <sql_body> 
```

Where:

```sql
schedule:
  { AT <at_timestamp> | EVERY <interval> [STARTS <start_timestamp> ] [ENDS <end_timestamp> ] }
```

Where:

```sql
interval:
  quantity { WEEK | DAY | HOUR | MINUTE }
```

## Required parameters

**1. `<job_name>`**
> Job name, which identifies a unique event in a db. The job name must be globally unique. If a job with the same name already exists, an error will be reported. We reserve the **inner_** prefix for internal use in the system, so users cannot create names starting with **inner_**.

**2. `<schedule>`**
> The ON SCHEDULE clause specifies the type, triggering time and frequency of the job. It can specify a one-time job or a periodic job.

**3. `<sql_body>`**
> The DO clause specifies the operation to be performed when the job is triggered, that is, a SQL statement.

## Optional parameters

**1. `AT <at_timestamp>`**
> Format: 'YYYY-MM-DD HH:MM:SS', used for **one-time events**, it specifies that the event is executed only once at a given date and time timestamp, and when the execution is completed, the job status will change to FINISHED.

**2. `EVERY <interval>`**
> Indicates a regularly repeated operation, it specifies the execution frequency of the job, and a time interval must be specified after the keyword, which can be days, hours, minutes, seconds, or weeks.

**3. `STARTS <start_timestamp>`**
> Format: 'YYYY-MM-DD HH:MM:SS', used to specify the start time of the job. If not specified, it will be executed from the next time point after the current time. The start time must be greater than the current time.

**4. `ENDS <end_timestamp>`**
> Format: 'YYYY-MM-DD HH:MM:SS', used to specify the end time of the job. If not specified, it means permanent execution. The date must be greater than the current time. If the start time is specified, that is, STARTS, the end time must be greater than the start time.

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege     | Object     | Notes                                                                   |
|:--------------|:-----------|:------------------------------------------------------------------------|
| ADMIN_PRIV    | Database   | Currently only supports **ADMIN** permissions to perform this operation |

## Usage Notes

- TASK only retains the latest 100 records.

- Currently only supports **INSERT internal table** operations, and will support more operations in the future.

- When the next scheduled task time expires, that is, when the task needs to be scheduled for execution, if the current JOB still has historical tasks being executed, the current task scheduling will be skipped. Therefore, it is very important to control a reasonable execution interval.

## Examples

- Create a job named my_job, which is executed once every minute. The operation performed is to import the data in db2.tbl2 into db1.tbl1.

  ```sql
  CREATE JOB my_job ON SCHEDULE EVERY 1 MINUTE DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
  ```

- Create a one-time job that will be executed once at 2020-01-01 00:00:00 to import the data in db2.tbl2 into db1.tbl1.

  ```sql
  CREATE JOB my_job ON SCHEDULE AT '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
  ```

- Create a periodic Job that will start executing at 2020-01-01 00:00:00 and execute once a day. The operation performed is to import the data in db2.tbl2 into db1.tbl1.

  ```sql
  CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE create_time >= days_add(now(),-1);
  ```

- Create a periodic job that will start at 2020-01-01 00:00:00 and execute once a day. The operation is to import the data in db2.tbl2 into db1.tbl1. The job ends at 2020-01-01 00:10:00.

  ```sql
  CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' ENDS '2020-01-01 00:10:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 create_time >= days_add(now(),-1);
  ```

## Best Practices

- Manage jobs reasonably to avoid a large number of jobs being triggered at the same time, which will cause task accumulation and affect the normal operation of the system.
- The task execution interval should be set within a reasonable range, at least greater than the task execution time.

## Related Documents

- [Pause-JOB](../job/PAUSE-JOB.md)
- [Resume-JOB](../job/RESUME-JOB.md)
- [Delete-JOB](../job/DROP-JOB.md)
- [Query-JOB](../../../sql-manual/sql-functions/table-valued-functions/jobs.md)
- [Query-TASKS](../../sql-functions/table-valued-functions/jobs.md)

## CONFIG

**fe.conf**

- job_dispatch_timer_job_thread_num, the number of threads used to distribute timed tasks, the default value is 2, if there are a large number of periodic execution tasks, you can increase this parameter.

- job_dispatch_timer_job_queue_size, the queue size for storing timed tasks when tasks are accumulated, the default value is 1024. If a large number of tasks are triggered at the same time, this parameter can be increased. Otherwise, the queue will be full, and the submitted task will enter a blocked state, which will cause subsequent tasks to fail to submit.

- finished_job_cleanup_threshold_time_hour, the time threshold for cleaning up completed tasks, in hours, the default value is 24 hours.

- job_insert_task_consumer_thread_num = 10; the number of threads used to execute Insert tasks, the value should be greater than 0, otherwise the default value is 5.