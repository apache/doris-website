---
{
    "title": "Read Write Separation",
    "language": "en"
}
---

# File Cache Active Incremental Warm-Up

## Background

To support cross-availability zone (AZ) high-availability cluster architectures and read-write separation architectures, Doris introduces the **File Cache Active Incremental Warm-Up Mechanism**. This mechanism ensures that the target cluster's cached data remains highly consistent with the source cluster, thereby improving query performance, reducing jitter, and speeding up response time during failover.

Application scenarios include:

- **Primary-Standby Cluster Architecture**: Ensures that the standby cluster can quickly take over the load when the primary cluster fails.
- **Read-Write Separation Architecture**: Ensures that newly written data is promptly cached in the read cluster.

---

## Feature Overview

File Cache active warm-up mainly supports synchronization of the following two types of caches:

1. **Import Data Cache Synchronization**  
   - Covers data generated after write operations such as Load, Compaction, and Schema Change.
   - Supports **event-triggered synchronization** to reduce query jitter.

2. **Query Data Cache Synchronization**  
   - Supports **periodic synchronization** to keep hot query data in a ready state in the target cluster.
   - Ensures standby cluster performance remains stable during primary-standby switchovers.

---

## Key Features

### Synchronization Modes

| Mode            | Description |
|-----------------|-------------|
| One-Time Sync (`ONCE`)     | Suitable for manual triggers, e.g., preheating a newly launched cluster |
| Periodic Sync (`PERIODIC`) | Suitable for regular synchronization of query data |
| Event-Driven Sync (`EVENT_DRIVEN`) | Suitable for automatic triggering after Load, Compaction, or Schema Change operations |

### WARM UP Syntax Extensions

```sql
-- One-time synchronization
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>;

-- Periodic synchronization
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>
PROPERTIES (
    "sync_mode" = "periodic",
    "sync_interval_sec" = "600"
);

-- Event-triggered synchronization
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

---

## Warm-Up Job Management

### Viewing Jobs

```sql
SHOW WARM UP JOB;
SHOW WARM UP JOB WHERE ID = 12345;
```

| Column Name     | Description |
|-----------------|-------------|
| JobId           | Unique job ID |
| ComputeGroup    | Target Compute Group |
| SrcComputeGroup | Source Compute Group |
| Type            | Type: CLUSTER / TABLE |
| SyncMode        | ONCE / PERIODIC(x) / EVENT_DRIVEN(x) |
| Status          | PENDING / RUNNING / FINISHED / CANCELLED / DELETED |
| CreateTime      | Creation time |
| StartTime       | Last start time |
| FinishTime      | Last finish time |
| FinishBatch     | Number of completed batches |
| AllBatch        | Total batches to sync |
| ErrMsg          | Error message (if any) |

### Cancelling Jobs

```sql
CANCEL WARM UP JOB WHERE id = 12345;
```

> **Note:** The current version does not support ALTER. To modify configuration, cancel the job and recreate it.

---

## Working Principle

### Periodic Synchronization Process

1. FE registers the job and sets `sync_interval`.
2. FE periodically checks if the trigger time has been reached (based on the last start time).
3. Starts the synchronization job (avoiding overlapping executions).
4. Records status after completion and waits for the next cycle.

### Event-Triggered Synchronization Process

1. The user creates an event-triggered job, FE registers the job and sends it to the source cluster BE.
2. Source BE automatically triggers warm-up after Load, Compaction, or similar events.
3. Sends synchronization requests to the target BE (at Rowset granularity).
4. After completion, BE reports status back to FE.

---

## Storage and Scheduling Mechanism

- Synchronization relationships are stored by FE as `CloudWarmUpJob`, supporting multi-job management.
- Multiple **Pending Jobs** are allowed for the same target cluster, but only one **Running Job** is allowed at a time; others will queue.
- Supports managing synchronization relationships using CLUSTER NAME, including cluster renaming/migration.

---

## Internal API Design

```java
CacheHotspotManager {
    long createJob(WarmUpClusterStmt stmt);
    void cancel(long jobId);
}

WarmUpClusterStmt(String dstClusterName, String srcClusterName, boolean isForce,
                  Map<String, String> properties);
```

---

## Metrics Monitoring

### Periodic Jobs - FE Side

| Metric Name | Description |
|-------------|-------------|
| file_cache_warm_up_job_exec_count | Number of scheduling executions |
| file_cache_warm_up_job_requested_tablets | Number of tablets submitted |
| file_cache_warm_up_job_finished_tablets | Number of tablets completed |
| file_cache_warm_up_job_latest_start_time | Most recent start time |
| file_cache_warm_up_job_last_finish_time | Most recent finish time |

### Periodic Jobs - BE Side

| Metric Name | Description |
|-------------|-------------|
| file_cache_once_or_periodic_warm_up_submitted_segment_size | Size of segments submitted |
| file_cache_once_or_periodic_warm_up_finished_segment_size | Size of segments completed |
| file_cache_once_or_periodic_warm_up_submitted_index_num | Number of indexes submitted |
| file_cache_once_or_periodic_warm_up_finished_index_num | Number of indexes completed |

### Event-Triggered Jobs - Source BE

| Metric Name | Description |
|-------------|-------------|
| file_cache_event_driven_warm_up_requested_segment_size | Size of segments requested |
| file_cache_event_driven_warm_up_requested_index_num | Number of indexes requested |
| file_cache_warm_up_rowset_last_call_unix_ts | Last request timestamp |

### Event-Triggered Jobs - Target BE

| Metric Name | Description |
|-------------|-------------|
| file_cache_event_driven_warm_up_submitted_segment_num | Number of segments received |
| file_cache_event_driven_warm_up_finished_segment_num | Number of segments completed |
| file_cache_warm_up_rowset_last_handle_unix_ts | Last processing timestamp |

---

## FAQ

1. **Will a job be canceled entirely if it fails?**  
   No, it will only skip the current sync, and the next cycle will continue.

2. **Do periodic jobs support timeout cancellation?**  
   Yes, after timeout, the current round will be skipped but the job itself remains.

3. **Can multiple clusters sync to the same cluster?**  
   Yes, e.g., A -> B and C -> B can exist simultaneously.

---

## Version Information

This feature is introduced in Apache Doris version 3.1.0.
