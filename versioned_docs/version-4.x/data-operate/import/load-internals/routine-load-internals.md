---
{
    "title": "Routine Load Internals and Best Practices",
    "language": "en"
}
---

## 1. Overview

Routine Load is designed for continuously consuming Kafka data and writing it into Apache Doris. Users can create Routine Load Jobs to automatically subscribe to specified Kafka Topics. Its core features include:

- **High Availability:** Supports 24/7 uninterrupted Kafka data consumption with automatic recovery after failures.

- **Low Latency:** Kafka messages can achieve second-level visibility.

- **Exactly-Once Semantics:** Ensures Kafka data consumption without loss or duplication, achieving exactly-once processing.

This document provides an in-depth analysis of the implementation principles, best practices for typical scenarios, and troubleshooting approaches for common issues to help users get started quickly and operate efficiently.

## 2. Implementation Principles

Kafka data exists in streaming form, while Doris consumes Kafka streaming data in a "micro-batch" manner. After creating a routine load job, the system splits it into multiple tasks for concurrent execution based on the configured concurrency level. Each task is responsible for consuming data from specific partitions in the Kafka topic. Each task corresponds to one transaction, and after completion, a new task is generated to continue consuming the next batch of data. The following sections explain this from three perspectives: job/task scheduling, Exactly-Once semantics implementation, and multi-table writing from a single stream.

### 2.1 Job and Task Scheduling

Routine Load employs a two-level scheduling approach:

- **Job Scheduling:** Responsible for task splitting, failure recovery, and lifecycle management.

- **Task Scheduling:** Responsible for distributing specific data fetching, transformation, and writing operations to BE nodes for execution.

#### 2.1.1 Job Scheduling

Job State Machine:

| State         | Description                                           |
| ------------- | ----------------------------------------------------- |
| NEED_SCHEDULE | Waiting for initial scheduling or requiring reschedule |
| RUNNING       | Normal consumption in progress                        |
| PAUSED        | Actively or abnormally paused, can auto-recover      |
| CANCELLED     | Terminated due to unrecoverable errors like database/table deletion |
| STOPPED       | Manually stopped and unrecoverable                   |

Based on different job states, the scheduling thread performs the following actions every cycle (10s):

- **NEED_SCHEDULE:** Retrieves topic metadata (partition count, starting offset) and splits tasks according to:

```Plain
taskNum = min(topic_partition_num,
              desired_concurrent_number,
              max_routine_load_task_concurrent_num)
```

Places tasks into `needScheduleTasksQueue` waiting for the task scheduling thread to begin scheduling.

- **RUNNING:** Periodically retrieves topic metadata and immediately reschedules if partition count changes.

- **PAUSED:** To ensure job high availability, an auto-resume mechanism is introduced. In cases of unexpected pauses, the Routine Load Scheduler thread attempts to automatically recover jobs. For unexpected Kafka-side failures or other non-functional situations, the auto-recovery mechanism ensures that after Kafka recovery, import jobs can continue normal operation without manual intervention. Note that there are three situations that will not auto-recover:
  - User manually executes PAUSE ROUTINE LOAD command.
  - Data quality issues exist.
  - Unrecoverable situations, such as database/table deletion.

  Except for the above three situations, all other paused jobs will attempt auto-recovery.

- **CANCELLED / STOPPED:** Delayed resource cleanup.

#### 2.1.2 Task Scheduling

**Scheduling Conditions**

- Task has not reached the end of partition, meaning there is still data to consume, to avoid ineffective resource occupation.

- If EOF was reached in the last execution, a new round of scheduling will only be initiated if more than `max_batch_interval` has passed since the last execution start. This aims to appropriately batch data when consumption speed exceeds production speed, preventing generation of too many small transactions.

**Load Balancing Strategy**

1. Prioritize selecting BE nodes with the fewest currently running Tasks.

2. If multiple BEs have the same Task count, prioritize reusing nodes with cached Kafka Consumers to reduce initialization overhead.

**Batch Boundaries**

A current task ends when any of the following conditions is met:

- Reaches the time limit defined by `max_batch_interval`.

- Reaches the row count defined by `max_batch_rows`.

- Reaches the byte size defined by `max_batch_size`.

- Reads Kafka EOF, i.e., consumes to the end of the stream.

After task completion, the transaction is committed and a new task is immediately generated and placed in the queue for the next scheduling cycle, enabling continuous consumption.

### **2.2 Exactly-Once Semantics**

Routine Load ensures Kafka data is neither lost nor duplicated through a dual mechanism of "persistent consumption progress" + "commit validation".

#### **2.2.1 Persistent Consumption Progress**

Each task writes consumption progress along with transaction information to the FE's edit log during transaction commit, utilizing Berkeley DB JE to synchronize to all FE Followers. Progress information remains accurate after Master switching/restart.

#### **2.2.2 Commit Validation**

When a Job is rescheduled due to manual pause, master switching, or topic metadata changes, there may be brief scenarios where two tasks concurrently consume the same partition. To prevent duplicate writes:

- Each Job maintains `routineLoadTaskInfoList` in memory.

- Before committing, tasks verify whether they are still in the `routineLoadTaskInfoList`, otherwise the commit is rejected.

### 2.3 Multi-Table Writing from Single Stream

Multi-table writing allows a single Routine Load Job to write to multiple target tables simultaneously. The core process is as follows:

1. Planning Phase: Since target tables cannot be completely determined when creating the Job, execution plans are delayed to runtime, with BE dynamically obtaining them from FE Master.

2. Data Caching: BE first caches data in local multi-table pipes. If 200 records are cached, or 5 new tables that haven't requested execution plans yet, an execution plan request is initiated and executed to prevent data backlog.

3. Execution Plan Reuse: Within the same transaction, cached execution plans are reused; between transactions, new requests are made to ensure metadata timeliness.

## 3. Best Practices

Routine Load default parameters satisfy most scenarios. Manual tuning is needed in the following three situations:

| Scenario                    | Recommended Parameter Modifications                        |
| --------------------------- | ---------------------------------------------------------- |
| Low latency requirements    | Reduce `max_batch_interval` from default 60s              |
| Small data volume, resource-sensitive | Reduce `desired_concurrent_number`                |
| High throughput            | Increase `max_batch_interval` from default 60s to 120-180s |

## 4. Common Issue Troubleshooting

### 4.1 Data Backlog

1. Check task status through `SHOW ROUTINE LOAD\G`:

- Whether State is `RUNNING`; if other status, check `ReasonOfStateChanged` field for reasons.

- Whether OtherMsg contains error information.

2. Use BE logs to determine if throughput limit has been reached

    Search for `consumer group done` logs, where `left_time / left_rows / left_bytes` shows the first triggered threshold, allowing targeted increases to `max_batch_size` or `max_batch_rows`:

    ```C++
    consumer group done: 894fc32d5b9d3e93-7387a02da6dafd88. consume time(ms)=34004, received rows=2679540, received bytes=2147484043, eos: 0, left_time: 25996, left_rows: 17320460, left_bytes: -395, blocking get time(us): 949236, blocking put time(us): 28730419, id=69616a41fc064f1e-a93ff0ddd217f0a0, job_id=48121487, txn_id=61763720, label=ods_hq_market_unique_jobs_0-48121487-69616a41fc064f1e-a93ff0ddd217f0a0-61763720, elapse(s)=34
    ```

    In the above example, `left_bytes: -395` indicates that the batch ended due to reaching `max_batch_size` limit within 34 seconds. In this case, you can appropriately increase `max_batch_size` to allow single batches to reach full capacity within `max_batch_interval`, thus improving throughput.

3. Increase Concurrency and Throughput

- Increase `desired_concurrent_number` to match the number of Topic Partitions.

- Moderately increase `max_batch_interval` (e.g., 120s ~ 180s) / `max_batch_size` / `max_batch_rows` to improve single transaction data volume, increase single batch data volume, and reduce transaction overhead.

### 4.2 Task Abnormal Pause

Routine Load has built-in auto-recovery mechanisms, and most unexpected pauses will be retried. If tasks remain in PAUSED state and cannot auto-recover, execute `SHOW ROUTINE LOAD` and troubleshoot:

- Whether `PAUSE ROUTINE LOAD` was manually executed.

- Whether data quality issues exist (such as format errors, missing fields).

- Whether Kafka data has expired with `out of range` errors.
