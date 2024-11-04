---
{
    "title": "Job Scheduler",
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

## Background

In the context of increasingly refined data management needs, scheduled tasks play a crucial role. They are typically applied in the following scenarios:

- **Regular Data Updates:** Periodic data imports and ETL operations reduce manual intervention, improving efficiency and accuracy in data processing.
- **Catalog Integration:** Regular synchronization of external data sources ensures efficient and accurate integration of multi-source data into the target system, meeting complex business analysis requirements.
- **Data Cleanup:** Periodic cleaning of expired/invalid data frees up storage space and prevents performance issues caused by excessive outdated data.

In earlier versions of Apache Doris, meeting the above requirements often depended on external scheduling systems, such as business code-based scheduling or third-party scheduling tools and distributed scheduling platforms. However, these external systems might not meet Doris's flexible scheduling strategies and resource management needs. Additionally, failures in external scheduling systems can increase business risks and require extra maintenance time and effort.

## Job Scheduler

To address these issues, Apache Doris introduced the Job Scheduler feature in version 2.1, enabling autonomous task scheduling with precision down to the second. 

This feature ensures data import completeness and consistency while allowing users to flexibly and conveniently adjust scheduling strategies. Reducing reliance on external systems also decreases system failure risks and maintenance costs, providing a more unified and reliable user experience.

## Features of Doris Job Scheduler

Doris Job Scheduler is a task management system that runs based on preset schedules, triggering predefined operations at specific times or intervals for automated task execution. Key features include:

- **Efficient Scheduling:** Tasks and events can be scheduled within specified intervals, ensuring efficient data processing. The time wheel algorithm ensures precise second-level triggers.
- **Flexible Scheduling:** Multiple scheduling options are available, such as scheduling by minutes, hours, days, or weeks. It supports one-time scheduling and recurring (cyclic) event scheduling, with customizable start and end times for cyclic schedules.
- **Event Pool and High-Performance Processing Queue:** Implemented using Disruptor to achieve a high-performance producer-consumer model, minimizing task execution overload.
- **Traceable Scheduling Records:** Stores the latest task execution records (configurable), which can be viewed with simple commands to ensure traceability.
- **High Availability:** Leveraging Doris’s high-availability mechanisms, Job Scheduler can easily achieve self-recovery and high availability.

**Related Documentation:** [CREATE-JOB](../../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-JOB.md)

## Syntax Overview

A valid Job statement must include the following components:

- **CREATE JOB:** Requires a job name, uniquely identifying the event in the database.
- **ON SCHEDULE Clause:** Specifies the job type, trigger time, and frequency.
    - **AT timestamp:** For one-time events. Executes the job once at the specified date and time. **AT current_timestamp** specifies the current date and time. The job runs immediately upon creation and can be used for asynchronous task creation.
    - **EVERY interval:** For periodic jobs, specifying the execution frequency. Keywords include **WEEK**, **DAY**, **HOUR**, and **MINUTE**.
        - **Interval:** Defines the execution frequency, e.g., **1 DAY** for daily, **1 HOUR** for hourly, **1 MINUTE** for every minute, **1 WEEK** for weekly.
        - **STARTS Clause (optional):** Specifies the start time for the repeating interval. **CURRENT_TIMESTAMP** sets the current date and time. The job runs immediately upon creation.
        - **ENDS Clause (optional):** Specifies the end time for the job event.
- **DO Clause:** Specifies the operation to execute when the job triggers, currently supporting **INSERT** statements.
```sql 
CREATE
JOB
  job_name
  ON SCHEDULE schedule
  [COMMENT 'string']
  DO execute_sql;

schedule: {
    AT timestamp
    | EVERY interval
    [STARTS timestamp ]
    [ENDS timestamp ]
}
interval:
    quantity { WEEK |DAY | HOUR | MINUTE}
```
## Usage Example

```sql
CREATE JOB my_job ON SCHEDULE EVERY 1 MINUTE DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```
This creates a job named "my_job" that executes every minute, importing data from db2.tbl2 into db1.tbl1.

Creating a One-Time Job:
```sql
CREATE JOB my_job ON SCHEDULE AT '2025-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```
This creates a job named "my_job" that executes once at 2025-01-01 00:00:00, importing data from db2.tbl2 into db1.tbl1.

Creating a Periodic Job Without End Time:
```sql

CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE create_time >= days_add(now(), -1);
```
This creates a job named "my_job" that starts on 2025-01-01 00:00:00 and executes every day, importing data from db2.tbl2 into db1.tbl1.

Creating a Periodic Job With End Time:
```sql
CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 00:00:00' ENDS '2026-01-01 00:10:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE create_time >= days_add(now(), -1);
```
This creates a job named "my_job" that starts on 2025-01-01 00:00:00, executes every day, and ends on 2026-01-01 00:10:00, importing data from db2.tbl2 into db1.tbl1.

Using Job for Asynchronous Execution:
```sql
CREATE JOB my_job ON SCHEDULE AT current_timestamp DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```
Since jobs in Doris are created as synchronous tasks but executed asynchronously, this example sets the job as a one-time task with the start time as the current time, suitable for asynchronous tasks like insert into select.
## Automated Data Synchronization with Job Scheduler and Catalog
For instance, in an e-commerce scenario, users often need to extract business data from MySQL and synchronize it to Doris for data analysis, supporting precise marketing activities. The Job Scheduler, combined with Multi Catalog capabilities, can efficiently accomplish periodic data synchronization across data sources.

```sql
CREATE TABLE IF NOT EXISTS user.activity (
    `user_id` INT NOT NULL,
    `date` DATE NOT NULL,
    `city` VARCHAR(20),
    `age` SMALLINT,
    `sex` TINYINT,
    `last_visit_date` DATETIME DEFAULT '1970-01-01 00:00:00',
    `cost` BIGINT DEFAULT '0',
    `max_dwell_time` INT DEFAULT '0',
    `min_dwell_time` INT DEFAULT '99999'
);
INSERT INTO user.activity VALUES
    (10000, '2017-10-01', 'Beijing', 20, 0, '2017-10-01 06:00:00', 20, 10, 10),
    (10000, '2017-10-01', 'Beijing', 20, 0, '2017-10-01 07:00:00', 15, 2, 2),
    (10001, '2017-10-01', 'Beijing', 30, 1, '2017-10-01 17:05:00', 2, 22, 22),
    (10002, '2017-10-02', 'Shanghai', 20, 1, '2017-10-02 12:59:00', 200, 5, 5),
    (10003, '2017-10-02', 'Guangzhou', 32, 0, '2017-10-02 11:20:00', 30, 11, 11),
    (10004, '2017-10-01', 'Shenzhen', 35, 0, '2017-10-01 10:00:00', 100, 3, 3),
    (10004, '2017-10-03', 'Shenzhen', 35, 0, '2017-10-03 10:20:00', 11, 6, 6);
```

| user\_id | date       | city      | age  | sex  | last\_visit\_date   | cost | max\_dwell\_time | min\_dwell\_time |
| -------- | ---------- | --------- | ---- | ---- | ------------------- | ---- | ---------------- | ---------------- |
| 10000    | 2017-10-01 | Beijing   | 20   | 0    | 2017-10-01 06:00    | 20   | 10               | 10               |
| 10000    | 2017-10-01 | Beijing   | 20   | 0    | 2017-10-01 07:00    | 15   | 2                | 2                |
| 10001    | 2017-10-01 | Beijing   | 30   | 1    | 2017-10-01 17:05:45 | 2    | 22               | 22               |
| 10002    | 2017-10-02 | Shanghai  | 20   | 1    | 2017-10-02 12:59:12 | 200  | 5                | 5                |
| 10003    | 2017-10-02 | Guangzhou | 32   | 0    | 2017-10-02 11:20:00 | 30   | 11               | 11               |
| 10004    | 2017-10-01 | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15 | 100  | 3                | 3                |
| 10004    | 2017-10-03 | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22 | 11   | 6                | 6                |


Example Workflow
1. Creating a Doris Table:

```sql
CREATE TABLE IF NOT EXISTS user_activity (
  `user_id` LARGEINT NOT NULL COMMENT "User ID",
  `date` DATE NOT NULL COMMENT "Data import date",
  `city` VARCHAR(20) COMMENT "User city",
  `age` SMALLINT COMMENT "User age",
  `sex` TINYINT COMMENT "User gender",
  `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "Last visit date",
  `cost` BIGINT SUM DEFAULT "0" COMMENT "Total spending",
  `max_dwell_time` INT MAX DEFAULT "0" COMMENT "Max dwell time",
  `min_dwell_time` INT MIN DEFAULT "99999" COMMENT "Min dwell time"
) AGGREGATE KEY(`user_id`, `date`, `city`, `age`, `sex`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);
```
2. Creating a Catalog for the MySQL Database:

```sql
CREATE CATALOG activity PROPERTIES (
  "type"="jdbc",
  "user"="root",
  "password"="123456",
  "jdbc_url" = "jdbc:mysql://127.0.0.1:3306/user?useSSL=false",
  "driver_url" = "mysql-connector-java-5.1.49.jar",
  "driver_class" = "com.mysql.jdbc.Driver"
);
```
3. Importing Data from MySQL to Doris:

- One-Time Scheduling:
```sql

CREATE JOB one_time_load_job ON SCHEDULE AT '2024-08-10 03:00:00' DO INSERT INTO user_activity SELECT * FROM activity.user_activity;
```
- Periodic Scheduling:
```sql
CREATE JOB schedule_load ON SCHEDULE EVERY 1 DAY DO INSERT INTO user_activity SELECT * FROM activity.user_activity WHERE last_visit_date >= days_add(now(), -1);
```
## Design and Implementation
Efficient scheduling often entails substantial resource consumption, especially with high-precision scheduling. Traditional implementations using Java's built-in scheduling capabilities or other libraries may have significant issues with precision and memory usage. To ensure performance while minimizing resource usage, the TimingWheel algorithm is combined with Disruptor to achieve second-level task scheduling.
Technical Details

Using Netty’s HashedWheelTimer to implement the time wheel algorithm, the Job Manager periodically (default every ten minutes) schedules future events into the time wheel. Disruptor constructs a single-producer, multi-consumer model to ensure efficient task triggering without excessive resource usage. The time wheel only triggers tasks and does not execute them directly. For immediate tasks, they are submitted to the respective execution thread pool.

For single-execution events, the event definition is deleted after scheduling. For periodic events, the time wheel’s system events periodically pull the next cycle's execution tasks. This avoids clustering tasks in one bucket, reducing meaningless traversal and improving processing efficiency. For transactional tasks, the Job Scheduler ensures task execution results align with expectations through strong association and callback mechanisms, maintaining data integrity and consistency.
Conclusion

## Future Plans
Doris Job Scheduler is a powerful and flexible task scheduling tool essential for data processing. Beyond common scenarios like data lake analysis and internal ETL, it plays a crucial role in implementing asynchronous materialized views. Asynchronous materialized views store precomputed result sets, and their update frequency is closely tied to source table changes. Frequent updates to source table data necess
