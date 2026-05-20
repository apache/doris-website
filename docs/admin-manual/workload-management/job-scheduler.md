---
{
    "title": "Job Scheduler",
    "sidebar_label": "Job Scheduler",
    "language": "en",
    "description": "Apache Doris Job Scheduler supports second-level scheduled task scheduling without external scheduling systems. It enables automated operations such as periodic data ingestion, ETL, and multi-source synchronization.",
    "keywords": ["Job Scheduler", "scheduled task", "task scheduling", "scheduled scheduling", "data synchronization", "ETL", "Doris scheduled task"]
}
---

<!-- Knowledge type: Feature overview + Procedure -->

## Overview

The **Job Scheduler** built into Apache Doris is a task management system that runs on a predefined plan. It automatically triggers SQL operations at specified time points or at fixed intervals, without depending on any external scheduling tool. Starting from version 2.1, the Job Scheduler provides second-level scheduling precision.

**Typical use cases:**

- Periodic data ingestion and ETL processing, reducing manual intervention
- Periodic synchronization across multiple data sources together with Multi-Catalog
- Periodic cleanup of expired or invalid data to free up storage
- Periodic refresh of asynchronous materialized views

**Core features:**

| Feature | Description |
|------|------|
| Second-level precision | Uses the TimingWheel algorithm to deliver event triggering at second-level precision |
| Flexible scheduling | Supports both one-time and recurring scheduling, with optional start and end times for recurring jobs |
| High-performance queue | Builds a high-performance producer-consumer model on Disruptor to avoid execution overload |
| Traceable execution records | Retains recent Task execution records (with a configurable count) that you can query through commands |
| High availability | Relies on Doris's own high-availability mechanism and supports automatic failure recovery |

**Related documentation:** [CREATE JOB](../../sql-manual/sql-statements/job/CREATE-JOB)

---

## Syntax

<!-- Knowledge type: Reference -->

A complete Job creation statement consists of the following three parts:

```sql
CREATE JOB job_name
    ON SCHEDULE schedule
    [COMMENT 'string']
    DO execute_sql;

schedule: {
    AT timestamp
    | EVERY interval
      [STARTS timestamp]
      [ENDS timestamp]
}

interval:
    quantity { WEEK | DAY | HOUR | MINUTE }
```

**Syntax components:**

| Clause | Description |
|------|------|
| `CREATE JOB job_name` | Specifies the Job name, which uniquely identifies the task within a database |
| `ON SCHEDULE AT timestamp` | One-time scheduling: executes once at the specified time point. Use `CURRENT_TIMESTAMP` to execute immediately |
| `ON SCHEDULE EVERY interval` | Recurring scheduling: executes repeatedly at the specified interval |
| `STARTS timestamp` | (Optional) Start time of a recurring schedule. Use `CURRENT_TIMESTAMP` to start immediately |
| `ENDS timestamp` | (Optional) End time of a recurring schedule |
| `DO execute_sql` | The SQL statement to execute when triggered (currently only INSERT statements are supported) |

**Supported units for interval:** `WEEK`, `DAY`, `HOUR`, `MINUTE`

---

## Examples

<!-- Knowledge type: Procedure -->

### One-time task

Run once at 2025-01-01 00:00:00 to load data from `db2.tbl2` into `db1.tbl1`:

```sql
CREATE JOB my_job
    ON SCHEDULE AT '2025-01-01 00:00:00'
    DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

### Recurring task (without an end time)

Starting from 2025-01-01 00:00:00, run an incremental load once per day:

```sql
CREATE JOB my_job
    ON SCHEDULE EVERY 1 DAY
    STARTS '2025-01-01 00:00:00'
    DO INSERT INTO db1.tbl1
       SELECT * FROM db2.tbl2
       WHERE create_time >= days_add(now(), -1);
```

### Recurring task (with an end time)

Run a daily load starting from 2025-01-01 and stop automatically at 2026-01-01 00:10:00:

```sql
CREATE JOB my_job
    ON SCHEDULE EVERY 1 DAY
    STARTS '2025-01-01 00:00:00'
    ENDS '2026-01-01 00:10:00'
    DO INSERT INTO db1.tbl1
       SELECT * FROM db2.tbl2
       WHERE create_time >= days_add(now(), -1);
```

### Asynchronous execution

Jobs are created synchronously in Doris, but the actual execution runs asynchronously. This makes Jobs suitable for asynchronous tasks such as long-running `INSERT INTO SELECT` operations.

Set the start time to `CURRENT_TIMESTAMP`, and the Job runs asynchronously immediately after creation:

```sql
CREATE JOB my_job
    ON SCHEDULE AT CURRENT_TIMESTAMP
    DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
```

---

## Automatic data synchronization with Catalog and Job Scheduler

<!-- Knowledge type: Procedure -->

Consider an e-commerce scenario where you need to periodically extract business data from MySQL and synchronize it to Doris for analytics that supports precision marketing. The Job Scheduler can work together with Multi-Catalog to efficiently perform periodic data synchronization across data sources.

**Step 1: Prepare the MySQL source data**

Assume the following user activity table exists in MySQL:

```sql
CREATE TABLE IF NOT EXISTS user.activity (
    `user_id`        INT      NOT NULL,
    `date`           DATE     NOT NULL,
    `city`           VARCHAR(20),
    `age`            SMALLINT,
    `sex`            TINYINT,
    `last_visit_date` DATETIME DEFAULT '1970-01-01 00:00:00',
    `cost`           BIGINT   DEFAULT '0',
    `max_dwell_time` INT      DEFAULT '0',
    `min_dwell_time` INT      DEFAULT '99999'
);

INSERT INTO user.activity VALUES
    (10000, '2017-10-01', 'Beijing',   20, 0, '2017-10-01 06:00:00', 20,  10, 10),
    (10000, '2017-10-01', 'Beijing',   20, 0, '2017-10-01 07:00:00', 15,  2,  2),
    (10001, '2017-10-01', 'Beijing',   30, 1, '2017-10-01 17:05:00', 2,   22, 22),
    (10002, '2017-10-02', 'Shanghai',  20, 1, '2017-10-02 12:59:00', 200, 5,  5),
    (10003, '2017-10-02', 'Guangzhou', 32, 0, '2017-10-02 11:20:00', 30,  11, 11),
    (10004, '2017-10-01', 'Shenzhen',  35, 0, '2017-10-01 10:00:00', 100, 3,  3),
    (10004, '2017-10-03', 'Shenzhen',  35, 0, '2017-10-03 10:20:00', 11,  6,  6);
```

| user_id | date       | city      | age | sex | last_visit_date     | cost | max_dwell_time | min_dwell_time |
|---------|------------|-----------|-----|-----|---------------------|------|----------------|----------------|
| 10000   | 2017-10-01 | Beijing   | 20  | 0   | 2017-10-01 06:00:00 | 20   | 10             | 10             |
| 10000   | 2017-10-01 | Beijing   | 20  | 0   | 2017-10-01 07:00:00 | 15   | 2              | 2              |
| 10001   | 2017-10-01 | Beijing   | 30  | 1   | 2017-10-01 17:05:00 | 2    | 22             | 22             |
| 10002   | 2017-10-02 | Shanghai  | 20  | 1   | 2017-10-02 12:59:00 | 200  | 5              | 5              |
| 10003   | 2017-10-02 | Guangzhou | 32  | 0   | 2017-10-02 11:20:00 | 30   | 11             | 11             |
| 10004   | 2017-10-01 | Shenzhen  | 35  | 0   | 2017-10-01 10:00:00 | 100  | 3              | 3              |
| 10004   | 2017-10-03 | Shenzhen  | 35  | 0   | 2017-10-03 10:20:00 | 11   | 6              | 6              |

The goal is to query users that match conditions on spending amount, visit time, gender, and city, and load them into Doris for downstream precision recommendation.

**Step 2: Create the target table in Doris**

```sql
CREATE TABLE IF NOT EXISTS user_activity (
    `user_id`        LARGEINT NOT NULL COMMENT "User id",
    `date`           DATE     NOT NULL COMMENT "Data ingestion date",
    `city`           VARCHAR(20)      COMMENT "User city",
    `age`            SMALLINT         COMMENT "User age",
    `sex`            TINYINT          COMMENT "User gender",
    `last_visit_date` DATETIME REPLACE DEFAULT "1970-01-01 00:00:00" COMMENT "Last visit time",
    `cost`           BIGINT SUM DEFAULT "0"     COMMENT "Total spending",
    `max_dwell_time` INT    MAX DEFAULT "0"     COMMENT "Maximum dwell time",
    `min_dwell_time` INT    MIN DEFAULT "99999" COMMENT "Minimum dwell time"
)
AGGREGATE KEY(`user_id`, `date`, `city`, `age`, `sex`)
DISTRIBUTED BY HASH(`user_id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

**Step 3: Create the MySQL Catalog**

```sql
CREATE CATALOG activity PROPERTIES (
    "type"       = "jdbc",
    "user"       = "root",
    "password"   = "123456",
    "jdbc_url"   = "jdbc:mysql://127.0.0.1:3306/user?useSSL=false",
    "driver_url" = "mysql-connector-java-5.1.49.jar",
    "driver_class" = "com.mysql.jdbc.Driver"
);
```

**Step 4: Create scheduling Jobs to perform data synchronization**

Full loads can cause system fluctuations, so they are typically scheduled during off-peak hours such as early morning.

- **One-time scheduling** (full load, triggered once at 3:00 AM):

    ```sql
    CREATE JOB one_time_load_job
        ON SCHEDULE AT '2024-08-10 03:00:00'
        DO INSERT INTO user_activity
           SELECT * FROM activity.user.activity;
    ```

- **Recurring scheduling** (daily incremental synchronization of the latest data):

    ```sql
    CREATE JOB schedule_load
        ON SCHEDULE EVERY 1 DAY
        DO INSERT INTO user_activity
           SELECT * FROM activity.user.activity
           WHERE last_visit_date >= days_add(now(), -1);
    ```

---

## Design and implementation

<!-- Knowledge type: Concept -->

High-precision scheduling brings the challenge of high resource consumption. Traditional Java scheduled-thread solutions fall short in both scheduling precision and memory usage. To address this, the Job Scheduler combines the **TimingWheel algorithm with Disruptor** to deliver performance while keeping resource usage low.

**Core mechanisms:**

1. **Timing wheel triggering**: The timing wheel algorithm is implemented with Netty's `HashedWheelTimer`. The Job Manager preloads future events into the timing wheel for scheduling every ten minutes (default).
2. **Disruptor dispatch**: The timing wheel only triggers events; it does not execute tasks directly. Due tasks first enter the Dispatch thread, which then forwards them to the corresponding execution thread pool. Tasks that need immediate execution are delivered directly to the execution thread pool.
3. **Event lifecycle management**: One-time tasks have their event definitions deleted automatically after scheduling completes. For recurring tasks, the timing wheel periodically pulls the execution plan for the next cycle, which avoids piling up many tasks in the same bucket and improves processing efficiency.
4. **Transactional consistency**: For transactional tasks, the Job Scheduler uses strong association with transactions and a callback mechanism to ensure that task execution results match expectations and that data integrity is preserved.

---

## Roadmap

<!-- Knowledge type: Roadmap -->

The Job Scheduler also plays a key role in asynchronous materialized view scenarios. When the source table data changes frequently, the Job Scheduler periodically triggers materialized view refresh to keep the view consistent with the source.

The following capabilities are planned for future releases:

- **Visualized task distribution**: A UI to view the distribution of task executions across different time windows.
- **DAG workflow orchestration**: Support for JOB workflow orchestration (DAG JOB) so that data warehouse task dependencies can be orchestrated inside Doris. Combined with Catalog, this enables more efficient data processing and analysis.
- **Broader operation support**: Support for scheduled scheduling of operations such as UPDATE and DELETE.
