---
{
    "title": "Routine Load Principles and Best Practices",
    "language": "en",
    "description": "An in-depth analysis of how Apache Doris Routine Load consumes Kafka, including its Exactly Once semantics, tuning parameters, and common troubleshooting methods.",
    "keywords": [
        "Routine Load",
        "Apache Doris Kafka import",
        "Doris streaming load",
        "Exactly Once",
        "Kafka topic consumption",
        "data backlog troubleshooting",
        "max_batch_interval",
        "desired_concurrent_number",
        "out of range"
    ]
}
---

<!-- Knowledge type: Architecture principles + Configuration parameters + Troubleshooting -->
<!-- Applicable scenarios: Understanding streaming load principles / Performance tuning / Troubleshooting -->

## 1. Overview

Routine Load continuously consumes data from Kafka and writes it into Apache Doris. By creating a Routine Load Job, you can automatically subscribe to a specified Kafka topic. Its core features include:

- **High availability:** Supports 7x24 uninterrupted consumption of Kafka data, and can automatically resume operation after a failure.
- **Low latency:** Kafka messages can become visible within seconds.
- **Exactly Once semantics:** Ensures that Kafka data is consumed without loss or duplication, achieving exactly-once consumption.

This document provides an in-depth analysis of its implementation principles, presents best practices for typical scenarios, and offers troubleshooting approaches for common issues, helping you get started quickly and operate it efficiently.

Recommended reading paths:

1. To understand the working mechanism, read [Implementation Principles](#2-implementation-principles).
2. To optimize performance, read [Best Practices](#3-best-practices).
3. To troubleshoot issues, read [Common Troubleshooting](#4-common-troubleshooting).

## 2. Implementation Principles

<!-- Knowledge type: Architecture principles -->

Kafka data exists as a stream, and Doris consumes Kafka streaming data in a "micro-batch" manner. After a Routine Load Job is created, the system splits it into multiple Tasks for concurrent execution based on the configured concurrency. Each Task is responsible for consuming data from specific partitions of the Kafka topic. Each Task corresponds to a transaction, and after execution completes, a new Task is generated to continue consuming the next batch of data.

The following sections cover three dimensions:

- The scheduling mechanism for Jobs and Tasks
- How Exactly Once semantics are implemented
- The execution flow for one-stream-multi-table writing

### 2.1 Job and Task Scheduling

Routine Load adopts a two-level scheduling model:

| Scheduling Level | Responsibility                                                                |
| ---------------- | ----------------------------------------------------------------------------- |
| **Job scheduling**  | Responsible for task splitting, failure recovery, and lifecycle management |
| **Task scheduling** | Responsible for dispatching the actual data fetching, transformation, and writing operations to BE nodes for execution |

#### 2.1.1 Job Scheduling

**Job State Machine**

| State          | Meaning                                                          |
| -------------- | ---------------------------------------------------------------- |
| NEED_SCHEDULE  | Waiting for the first scheduling or needs to be rescheduled      |
| RUNNING        | Consuming normally                                               |
| PAUSED         | Paused either actively or due to an exception, can auto-resume   |
| CANCELLED      | Terminated due to unrecoverable errors such as the database or table being dropped |
| STOPPED        | Manually stopped and cannot be recovered                         |

**Scheduling Behavior**

Each scheduling cycle (10s), the scheduling thread performs the following actions based on the Job state:

- **NEED_SCHEDULE:** Fetches topic metadata (number of partitions, starting offsets), splits Tasks according to the following formula, and places them into `needScheduleTasksQueue` to wait for the Task scheduling thread to start scheduling them:

    ```Plain
    taskNum = min(topic_partition_num,
                  desired_concurrent_number,
                  max_routine_load_task_concurrent_num)
    ```

- **RUNNING:** Periodically fetches topic metadata, and immediately reschedules if the number of partitions changes.

- **PAUSED:** To ensure high availability of the Job, an auto-resume mechanism is introduced. In the case of an unexpected pause, the Routine Load Scheduler thread attempts to automatically resume the Job. For unexpected Kafka downtime or other situations where Kafka cannot work, the auto-resume mechanism ensures that, after Kafka recovers, the load Job can continue to run normally without manual intervention. Note that there are three situations where the Job will **not** auto-resume:

    1. The user manually executes the `PAUSE ROUTINE LOAD` command.
    2. There are data quality issues.
    3. Situations that cannot be auto-recovered, such as the database or table being dropped.

    Apart from these three situations, all other paused Jobs will attempt to auto-resume.

- **CANCELLED / STOPPED:** Resources are reclaimed with a delay.

#### 2.1.2 Task Scheduling

**Scheduling Conditions**

Task scheduling requires meeting one of the following conditions:

- The Task has not yet read to the end of the partition, meaning there is still data to consume, to avoid wasting resources.
- If the previous run already read to EOF, the time since the last execution started must exceed `max_batch_interval` before a new round of scheduling is initiated. The purpose is to accumulate batches appropriately when consumption speed exceeds production speed, preventing too many small transactions from being generated.

**Load Balancing Strategy**

The scheduler selects BE nodes to execute Tasks in the following order:

1. Prefer BEs that are currently running the fewest Tasks.
2. If multiple BEs have the same Task count, prefer nodes that have a cached Kafka Consumer to reduce initialization overhead.

**Batch Boundary**

The current Task ends when any of the following conditions is met:

- The time defined by `max_batch_interval` is reached.
- The number of rows defined by `max_batch_rows` is reached.
- The byte size defined by `max_batch_size` is reached.
- Kafka EOF is read, meaning consumption reaches the end of the stream.

After a Task ends, the transaction is committed, and a new Task is immediately generated and placed into the queue to wait for the next scheduling, achieving continuous consumption.

### 2.2 Exactly Once Semantics

<!-- Knowledge type: Architecture principles -->

Routine Load ensures Kafka data is consumed without loss or duplication through a dual mechanism of "persisting consumption progress" plus "commit verification."

#### 2.2.1 Persisting Consumption Progress

When each Task commits its transaction, it writes the consumption progress along with the transaction information into the FE edit log, and uses Berkeley DB JE to synchronize this to all FE Followers. After Master switching or restart, the progress information remains accurate.

#### 2.2.2 Commit Verification

When a Job is rescheduled due to manual pause, master switching, or topic metadata changes, two Tasks may briefly consume the same partition concurrently. To prevent duplicate writes:

- Each Job maintains `routineLoadTaskInfoList` in memory.
- Before committing, a Task verifies that it is still in `routineLoadTaskInfoList`; otherwise, the commit is rejected.

### 2.3 One-Stream-Multi-Table Writing

One-stream-multi-table is used to write to multiple target tables simultaneously from a single Routine Load Job. The core flow is as follows:

1. **Planning phase:** Because target tables cannot be fully determined when the Job is created, the execution plan is deferred to runtime, where the BE dynamically requests it from the FE Master.
2. **Data caching:** The BE first caches data in a local multi-table pipe. If 200 records are cached, or if there are 5 new tables that have not yet requested an execution plan, the BE initiates an execution plan request and executes it, preventing data backlog.
3. **Execution plan reuse:** Within the same transaction, cached execution plans are reused, while new plans are requested between transactions to ensure metadata freshness.

## 3. Best Practices

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Performance tuning -->

The default parameters of Routine Load satisfy the vast majority of scenarios. Manual tuning is only required in the following three typical scenarios:

| Scenario                          | Recommended Parameter Changes                                       |
| --------------------------------- | ------------------------------------------------------------------- |
| Low-latency requirements          | Reduce `max_batch_interval` from the default 60s                    |
| Small data volume, resource-sensitive | Reduce `desired_concurrent_number`                              |
| High throughput                   | Increase `max_batch_interval` from the default 60s to 120-180s      |

## 4. Common Troubleshooting

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Routine Load exception troubleshooting -->

### 4.1 Data Backlog

Follow these three steps to identify the cause of data backlog and optimize:

**Step 1: Check Task Status**

Use `SHOW ROUTINE LOAD\G` to check Task status, focusing on:

- Whether `State` is `RUNNING`. If it is in another state, check the `ReasonOfStateChanged` field for the reason.
- Whether there is any error message in `OtherMsg`.

**Step 2: Determine Whether the Throughput Limit Has Been Reached**

Use BE logs to determine whether the throughput limit has been reached. Search for `consumer group done` log entries; the `left_time / left_rows / left_bytes` values show which threshold was triggered first, so you can correspondingly increase `max_batch_size` or `max_batch_rows`:

```C++
consumer group done: 894fc32d5b9d3e93-7387a02da6dafd88. consume time(ms)=34004, received rows=2679540, received bytes=2147484043, eos: 0, left_time: 25996, left_rows: 17320460, left_bytes: -395, blocking get time(us): 949236, blocking put time(us): 28730419, id=69616a41fc064f1e-a93ff0ddd217f0a0, job_id=48121487, txn_id=61763720, label=ods_hq_market_unique_jobs_0-48121487-69616a41fc064f1e-a93ff0ddd217f0a0-61763720, elapse(s)=34
```

In the example above, `left_bytes: -395` indicates that the batch ended within 34 seconds because `max_batch_size` reached its limit. In this case, you can increase `max_batch_size` appropriately so that a single batch is loaded as fully as possible within `max_batch_interval`, improving throughput.

**Step 3: Increase Concurrency and Throughput**

- Increase `desired_concurrent_number` to match the number of partitions in the topic.
- Moderately increase `max_batch_interval` (such as 120s to 180s), `max_batch_size`, or `max_batch_rows` to enlarge the data volume per transaction, increase the data volume per batch, and reduce transaction overhead.

### 4.2 Task Unexpectedly Paused

Routine Load has a built-in auto-resume mechanism, and most unexpected pauses are retried. If a Task remains in `PAUSED` and cannot auto-resume, run `SHOW ROUTINE LOAD` and investigate in the following directions:

- Whether `PAUSE ROUTINE LOAD` was manually executed.
- Whether there are data quality issues (such as format errors or missing fields).
- Whether the Kafka data has expired, with an `out of range` error.

## 5. FAQ

<!-- Knowledge type: FAQ -->

**Q1: How does Routine Load guarantee Exactly Once semantics?**

Through two mechanisms: (1) When each Task commits its transaction, the consumption progress is written to the FE edit log and synchronized to all FE Followers via Berkeley DB JE. (2) Before committing, a Task verifies that it is still in `routineLoadTaskInfoList`; otherwise, the commit is rejected, avoiding concurrent duplicate writes.

**Q2: Will a Job in PAUSED state auto-resume?**

Most unexpected pauses will auto-resume. However, the following three situations will **not** auto-resume: manually executing `PAUSE ROUTINE LOAD`, data quality issues, and unrecoverable errors such as the database or table being dropped.

**Q3: What determines the number of Tasks?**

It is determined by the following formula: `taskNum = min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)`.

**Q4: When should `max_batch_interval` be increased?**

In high-throughput scenarios, increasing it from the default 60s to 120s-180s allows for a larger data volume per transaction, reducing transaction overhead and improving overall throughput.

**Q5: What does the `out of range` error in the log mean?**

It means the data to be consumed in Kafka has expired (cleaned up by the Kafka retention policy), causing the consumption offset to become invalid. You need to check the Kafka topic's retention period, or reset the starting offset for Routine Load consumption.
