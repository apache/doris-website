---
{
    "title": "Job Scheduler",
    "language": "en",
    "description": "Introduction to Doris Job Scheduler, a built-in task scheduling system that enables automated periodic data imports, ETL operations, and data synchronization with second-level precision."
}
---

## Background

In the context of increasing demands for refined data management, scheduled scheduling plays an important role. It is typically applied in the following scenarios:

- Regular data updates, such as periodic data imports and ETL operations, reducing manual intervention and improving the efficiency and accuracy of data processing.

- Synchronizing external data sources with Catalog to ensure efficient and accurate integration of multi-source data into the target system, meeting complex business analysis needs.

- Regularly cleaning up expired/invalid data to free up storage space and prevent excessive expired/invalid data from impacting system performance.

In versions of Apache Doris prior to 2.1, it was typically necessary to rely on external scheduling systems, such as scheduling via business code or introducing third-party scheduling tools and distributed scheduling platforms to meet the above requirements. However, due to limitations of the external systems themselves, they may not be able to satisfy Doris's requirements for scheduling strategy and resource management flexibility. Additionally, if the external scheduling system fails, it not only increases business risks but also requires additional operational time and manpower to address.

## Job Scheduler

To solve the above problems, Apache Doris introduced the Job Scheduler feature in version 2.1, achieving autonomous task scheduling capabilities with scheduling precision reaching the second level. The introduction of this feature not only ensures the integrity and consistency of data imports but also allows users to flexibly and conveniently adjust scheduling strategies. At the same time, by reducing dependence on external systems, it also lowers the risk of system failures and operational costs, providing community users with a more unified and reliable user experience.

Doris Job Scheduler is a task management system based on preset schedules, capable of triggering predefined operations at specific points in time or at specified time intervals, achieving automated task execution. The Job Scheduler has the following features:
- **Efficient scheduling**: The Job Scheduler can arrange tasks and events within specified time intervals, ensuring the efficiency of data processing. It uses a time wheel algorithm to ensure events can be triggered precisely to the second level.
- **Flexible scheduling**: The Job Scheduler provides multiple scheduling options, such as scheduling at minute, hour, day, or week intervals. It also supports one-time scheduling as well as recurring (periodic) event scheduling, and periodic scheduling can specify start and end times.
- **Event pool and high-performance processing queue**: The Job Scheduler uses Disruptor to implement a high-performance producer-consumer model, maximizing the avoidance of task execution overload.
- **Traceable scheduling records**: The Job Scheduler stores the latest Task execution records (configurable). Task execution records can be viewed through simple commands, ensuring process traceability.
- **High availability**: Leveraging Doris's own high-availability mechanisms, the Job Scheduler can easily achieve self-recovery and high availability.

**Related Documentation:** [CREATE-JOB](../../sql-manual/sql-statements/job/CREATE-JOB.md)


## Syntax Explanation

A valid Job statement must include the following:

- The keyword **CREATE JOB** must be followed by the job name, which uniquely identifies the event in the database.

- The **ON SCHEDULE** clause is used to specify the type, trigger time, and frequency of the Job.

    - **AT timestamp** is used for one-time events. It specifies that the JOB will execute only once at the given date and time, and **AT current_timestamp** specifies the current date and time. Since the JOB is created, it will run immediately and can also be used for asynchronous task creation.

    - **EVERY**: Used for periodic jobs, specifying the execution frequency of the job. A time interval (week, day, hour, minute) must be specified after the keyword.

        - **Interval**: Specifies the frequency of job execution. **1 DAY** means the job executes once a day, **1 HOUR** means once an hour, **1 MINUTE** means once a minute, and **1 WEEK** means once a week.

        - The **EVERY** clause includes an optional **STARTS** clause. After **STARTS** is a timestamp value, which defines the start time for repetition, and **CURRENT_TIMESTAMP** specifies the current date and time. Once the JOB is created, it runs immediately.

        - The **EVERY** clause includes an optional **ENDS** clause. After the **ENDS** keyword is a timestamp value, which defines the time when the JOB event stops running.

- The **DO** clause is used to specify the operation to be performed when the Job is triggered. Currently, only **INSERT** statements are supported.

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

## Examples Below:

```sql
CREATE JOB my_job ON SCHEDULE EVERY 1 MINUTE DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

This statement creates a job named `my_job` that executes once every minute. The operation performed is importing data from `db2.tbl2` into `db1.tbl1`.

## Usage Examples

Create a one-time Job: Execute once at `2025-01-01 00:00:00`, importing data from `db2.tbl2` into `db1.tbl1`.


```sql
CREATE JOB my_job ON SCHEDULE AT '2025-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```
Create a periodic Job without a specified end time: Starting at `2025-01-01 00:00:00`, execute once a day, importing data from `db2.tbl2` into `db1.tbl1`.

```sql
CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE  create_time >=  days_add(now(),-1);
```
Create a periodic Job with a specified end time: Starting at `2025-01-01 00:00:00`, execute once a day, importing data from `db2.tbl2` into `db1.tbl1`, and end at `2026-01-01 00:10:00`.

```sql
CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2025-01-01 00:00:00' ENDS '2026-01-01 00:10:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE create_time >=  days_add(now(),-1);
```

Implementing Asynchronous Execution with Job: Although Jobs in Doris are created as synchronous tasks, their execution process is asynchronous. This feature makes Jobs highly suitable for implementing asynchronous tasks, such as common `INSERT INTO SELECT` operations.

For example, if you need to import data from `db2.tbl2` into `db1.tbl1`, you only need to specify the JOB as a one-time task and set the start time to the current time.

```sql
CREATE JOB my_job ON SCHEDULE AT current_timestamp DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

## Data Automatic Synchronization Based on Catalog and Job Scheduler

Taking an e-commerce scenario as an example, users often need to extract business data from MySQL and synchronize this data into Doris for data analysis, thereby supporting precise marketing activities. The Job Scheduler can work in conjunction with the Multi Catalog data lake capability to efficiently complete periodic data synchronization across data sources.


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
    (10000, '2017-10-01', 'BeiJing', 20, 0, '2017-10-01 06:00:00', 20, 10, 10),
    (10000, '2017-10-01', 'BeiJing', 20, 0, '2017-10-01 07:00:00', 15, 2, 2),
    (10001, '2017-10-01', 'BeiJing', 30, 1, '2017-10-01 17:05:00', 2, 22, 22),
    (10002, '2017-10-02', 'ShangHai', 20, 1, '2017-10-02 12:59:00', 200, 5, 5),
    (10003, '2017-10-02', 'GuangZhou', 32, 0, '2017-10-02 11:20:00', 30, 11, 11),
    (10004, '2017-10-01', 'ShenZhen', 35, 0, '2017-10-01 10:00:00', 100, 3, 3),
    (10004, '2017-10-03', 'ShenZhen', 35, 0, '2017-10-03 10:20:00', 11, 6, 6);
```

| user_id | date      | city | age  | sex  | last_visit_date | cost | max_dwell_time | min_dwell_time |
| ------- | --------- | ---- | ---- | ---- | --------------- | ---- | -------------- | -------------- |
| 10000   | 2017/10/1 | BeiJing | 20   | 0    | 2017/10/1 6:00  | 20   | 10             | 10             |
| 10000   | 2017/10/1 | BeiJing | 20   | 0    | 2017/10/1 7:00  | 15   | 2              | 2              |
| 10001   | 2017/10/1 | BeiJing | 30   | 1    | 2017/10/1 17:05 | 2    | 22             | 22             |
| 10002   | 2017/10/2 | ShangHai | 20   | 1    | 2017/10/2 12:59 | 200  | 5              | 5              |
| 10003   | 2017/10/2 | GuangZhou | 32   | 0    | 2017/10/2 11:20 | 30   | 11             | 11             |
| 10004   | 2017/10/1 | ShenZhen | 35   | 0    | 2017/10/1 10:00 | 100  | 3              | 3              |
| 10004   | 2017/10/3 | ShenZhen | 35   | 0    | 2017/10/3 10:20 | 11   | 6              | 6              |

Using the table above as an example, the user wants to query users who meet specific numerical conditions such as total spending amount, last visit time, gender, and city, and import the information of users who meet these conditions into Doris for subsequent targeted promotions.

1. First, create a Doris table

    ```sql
    CREATE TABLE IF NOT EXISTS user_activity
      (
      `user_id` LARGEINT NOT NULL,
      `date` DATE NOT NULL,
      `city` VARCHAR(20),
      `age` SMALLINT,
      `sex` TINYINT,
      `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00",
      `cost` BIGINT SUM DEFAULT "0",
      `max_dwell_time` INT MAX DEFAULT "0",
      `min_dwell_time` INT MIN DEFAULT "99999"
      )
      AGGREGATE KEY(`user_id`, `date`, `city`, `age`, `sex`)
      DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
      PROPERTIES (
      "replication_allocation" = "tag.location.default: 1"
      );
    ```  
2. Secondly, create a Catalog corresponding to the MySQL database.

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
3. Finally, import MySQL data into Doris. Use the Catalog + Insert Into method to import the full dataset. Since full imports may cause system service fluctuations, it is usually recommended to perform this operation during business off-peak hours.

- One-time scheduling: As shown in the code below, use a one-time task to trigger the full import task at a scheduled time, with the trigger set for 3:00 AM.

    ```sql    
    CREATE JOB one_time_load_job
      ON SCHEDULE
      AT '2024-8-10 03:00:00'
      DO
      INSERT INTO user_activity SELECT * FROM activity.user.activity
    ```  
- Periodic scheduling: Users can also create a periodic scheduling task to update the latest data regularly.

    ```sql    
    CREATE JOB schedule_load
      ON SCHEDULE EVERY 1 DAY
      DO
      INSERT INTO user_activity SELECT * FROM activity.user.activity where last_visit_date >=  days_add(now(),-1)
    ```  
## Design and Implementation

Efficient scheduling often comes with significant resource consumption, and high-precision scheduling is even more demanding. The traditional approach involves using Java's built-in scheduling capabilities—scheduled tasks that access threads periodically—or using various scheduling utility libraries. However, these methods have significant issues in terms of precision and memory usage. To better guarantee performance while reducing resource consumption, we chose to combine the TimingWheel algorithm with Disruptor to achieve second-level task scheduling.

Specifically, we use Netty's `HashedWheelTimer` to implement the Timing Wheel algorithm. The Job Manager periodically (defaulting to every ten minutes) places future events into the timing wheel for scheduling. To ensure efficient task triggering and avoid excessive resource usage, we use Disruptor to build a single-producer, multiple-consumer model. The timing wheel only triggers events but does not execute tasks directly. For tasks that need to be triggered upon expiration, they are placed in the Dispatch thread, which is responsible for distributing the tasks to the appropriate execution thread pool. For tasks that need to be executed immediately, they are directly delivered to the corresponding task execution thread pool.

For one-time events, the event definition is deleted after the task is scheduled. For periodic events, system events in the timing wheel will regularly fetch the tasks for the next execution cycle. This helps avoid large numbers of tasks being concentrated in a single bucket, reducing unnecessary traversals and improving processing efficiency.

For transactional tasks, the Job Scheduler can ensure that the execution results of transactional tasks match expectations through strong associations with transactions and the transaction callback mechanism, thus ensuring data integrity and consistency.


## Future Plans

Doris Job Scheduler is a powerful and flexible task scheduling tool, an essential feature in data processing. In addition to common use cases such as data lake analytics and internal ETL, Job Scheduler also plays a key role in the implementation of asynchronous materialized views. An asynchronous materialized view is a precomputed and stored result set, where the frequency of data updates is closely related to changes in the source tables. When the source table data is updated frequently, periodic refreshing of the materialized view is required to keep its data up-to-date. In version 2.1, we cleverly utilized the JOB scheduling feature to ensure the consistency between materialized views and source table data, significantly reducing the cost of manual intervention.

In the future, Doris Job Scheduler will also support the following features:
- Support for viewing the distribution of tasks executed during different time periods via the UI.
- Support for JOB workflow orchestration, i.e., DAG JOB. This means we can implement internal data warehouse task orchestration, and with the Catalog functionality, it will more efficiently complete data processing and analysis tasks.
- Support for scheduling import tasks, UPDATE, and DELETE operations.

