---
{
    "title": "Job",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

# Job Scheduling

In Doris, a job is a task that runs according to a pre-defined plan. It is used to trigger pre-defined operations at specific times or intervals, helping users automate certain tasks. In terms of functionality, it is similar to scheduled tasks on an operating system (e.g., cron in Linux, Task Scheduler in Windows).

There are two types of jobs in Doris: `ONE_TIME` jobs and `RECURRING` jobs. `ONE_TIME` jobs are triggered at a specified time and are primarily for one-time tasks. The `RECURRING` jobs are triggered at specified intervals and are used for tasks that need to be executed periodically. You can specify the start and end time for `RECURRING` jobs via `STARTS\ENDS`. If no start time is specified, the first execution time of the job will be set to one scheduling period after the current time. If an end time is specified and a task is completed after the end time (or if the next scheduling period exceeds the end time), the job will be updated to the FINISHED state, and no more tasks will be generated.

There are four possible states for a job: `RUNNING`, `STOPPED`, `PAUSED`, and `FINISHED`. The initial state is `RUNNING`. A `RUNNING` job generates tasks based on the pre-defined scheduling period. When a job completes execution and reaches the end time, it transitions to the `FINISHED` state.

- A `RUNNING` job can be paused, meaning it will not generate tasks for the time being.
- A `PAUSED` job can be resumed through the RESUME operation, changing its state to `RUNNING`.
- A `STOPPED` job is triggered by the user. The running tasks will be canceled and then the job will be deleted.
- A `FINISHED` job remains in the system for 24 hours and is then deleted.

A job only describes the task information, and the execution of the job generates tasks. A task can be in one of the following states: `PENDING`, `RUNNING`, `SUCCESS`, `FAILED`, or `CANCELED`.

- `PENDING` means that the trigger time has been reached, but the task is waiting for resources.
- Once resources are allocated, the state of the task changes to `RUNNING`.
- When the task completes successfully or fails, the state changes to `SUCCESS` or `FAILED`, respectively.
- `CANCELED` indicates that the task has been canceled.
- Eventually, the tasks will persist with `SUCCESS` or `FAILED` states; other states can be queried while the task is running but are not visible after a restart.
- Only the latest 100 task records are retained.

## Privilege

- Job scheduling can only be operated with admin privileges currently.

## Syntax

```SQL
CREATE
    JOB
    job_name
    ON SCHEDULE schedule
    [COMMENT 'string']
    DO sql_body;

schedule: {
   AT timestamp 
   | EVERY interval
    [STARTS timestamp ]
    [ENDS timestamp ]
}

interval:
    quantity { WEEK | DAY | HOUR | MINUTE }
```

An effective job statement must include the following:

- The keyword `CREATE JOB` followed by the job name, which uniquely identifies the event within a database. The job name must be globally unique, and if a job with the same name already exists, an error will occur. We reserve the "inner_" prefix for internal system use, so users cannot create job names starting with "inner_".
- The `ON SCHEDULE` clause, which specifies the type of the job and its trigger time and frequency.
- The `DO` clause, which specifies the action to be executed when the job is triggered, typically a SQL statement.

## Example

This is a simple example.

```SQL
CREATE JOB my_job ON SCHEDULE EVERY 1 MINUTE DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

This statement creates a job named "my_job" that executes every minute. The action performed by the job is to import data from "db2.tbl2" into "db1.tbl1".

The `SCHEDULE` statement is used to define the execution time, frequency, and duration of a job. It can be used for either a one-time job or a recurring job.

- **AT timestamp**

Format: 'YYYY-MM-DD HH:MM:SS'

This is used for one-time jobs. It specifies that the job should occur only once at the given date and time. After execution, the job status changes to FINISHED.

- **EVERY**
  - **Interval**

This represents a recurring operation and specifies the frequency of job execution. The keyword should be followed by a time interval, which can be specified in terms of weeks, days, hours, minutes, or seconds. For example, `1 DAY` means the job should be executed once every day, `1 HOUR` means once every hour, `1 MINUTE` means once every minute, and `1 WEEK` means once every week.

- **STARTS timestamp (optional)**

Format: 'YYYY-MM-DD HH:MM:SS'

It specifies the start time of the job. If not specified, the job starts executing from the next occurrence based on the current time. The start time must be later than the current time.

- **ENDS timestamp (optional)**

Format: 'YYYY-MM-DD HH:MM:SS' It specifies the end time of the job. If not specified, the job should execute indefinitely. The end time must be later than the current time. If a start time (`STARTS`) is specified, the end time must be later than the start time.

- **DO**

It specifies the action to be performed when the job is triggered. Currently, it only supports the INSERT INTO internal table operation. We plan to support more operations in the future.

1. Create a one-time job that executes on January 1, 2020, at 00:00:00. The action is to import data from "db2.tbl2" into "db1.tbl1".

```SQL
CREATE JOB my_job ON SCHEDULE AT '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

2. Create a recurring job that executes on January 1, 2020, at 00:00:00. It is executed once a day. The action is to import data from "db2.tbl2" into "db1.tbl1".

```SQL
CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE  create_time =  days_add(now(),-1);
```

3. Create a recurring job that executes on January 1, 2020, at 00:00:00. It is executed once a day. The action is to import data from "db2.tbl2" into "db1.tbl1". It ends on January 1, 2020, at 00:10:00.

```SQL
CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' ENDS '2020-01-01 00:10:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 create_time =  days_add(now(),-1);
```

## INSERT JOB

- Currently, only INSERT INTO internal tables is supported.
- When the next scheduled task time arrives and the current job still has historical tasks running, the current task scheduling will be skipped. Therefore, it is important to have a reasonable execution interval.

## CONFIG

fe.conf

- `job_dispatch_timer_job_thread_num`: The number of threads for dispatching scheduled tasks. The default value is 2. If there are a large number of recurring tasks, this parameter can be increased.
- `job_dispatch_timer_job_queue_size`: The queue size used to store scheduled tasks when there is a backlog of tasks. The default value is 1024. If there are a large number of tasks triggered at the same time, this parameter can be increased. Otherwise, the queue may become full, causing submitted tasks to be blocked and subsequent tasks unable to be submitted.
- `finished_job_cleanup_threshold_time_hour`: The time threshold, measured in hours, for cleaning up completed tasks. The default value is 24 hours.
- `job_insert_task_consumer_thread_num`: The number of threads used for executing INSERT tasks. The value should be greater than 0; otherwise, the default value of 5 will be used.

## Best Practice

- Manage jobs properly to avoid a large number of jobs being triggered simultaneously, thus avoiding task backlogs and system abnomalities.
- Set the execution interval of tasks within a reasonable range and ensure that it is at least greater than the task execution time.

## More help

For further information, refer to the SQL manual for [PAUSE-JOB](https://doris.apache.org/docs/2.0/sql-manual/sql-reference/Data-Definition-Statements/Alter/PAUSE-JOB/), [RESUME-JOB](https://doris.apache.org/docs/2.0/sql-manual/sql-reference/Data-Definition-Statements/Alter/RESUME-JOB/), [DROP-JOB](https://doris.apache.org/docs/sql-manual/sql-reference/Data-Definition-Statements/Drop/DROP-JOB/), [TVF-JOB](https://doris.apache.org/docs/sql-manual/sql-functions/table-functions/job/), and [TVF-TASKS](https://doris.apache.org/docs/sql-manual/sql-functions/table-functions/tasks/).
