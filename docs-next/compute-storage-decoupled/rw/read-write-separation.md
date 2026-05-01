---
{
    "title": "Read/Write Separation and Primary/Standby Cluster File Cache Warm-Up Configuration Guide",
    "sidebar_label": "Read/Write Separation: File Cache Warm-Up",
    "language": "en",
    "description": "Describes the Doris File Cache active incremental warm-up mechanism, supporting read/write separation and primary/standby cluster architectures, covering warm-up job creation, management, monitoring, and troubleshooting.",
    "keywords": ["read/write separation", "primary/standby cluster", "File Cache warm-up", "compute group sync", "high availability", "cross availability zone"]
}
---

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenarios: Read/write separation deployment / Primary/standby cluster high availability -->

## Background and Applicable Scenarios

To address cache cold-start problems in cross-availability-zone (AZ) high-availability failover and read/write separation scenarios, Doris introduces the **File Cache active incremental warm-up mechanism**. This mechanism ensures that the cache data of a target cluster stays highly consistent with the source cluster, thereby improving query performance, reducing jitter, and accelerating failover response.

This feature applies to the following two typical scenarios:

| Scenario | Description | Core Requirement |
|------|------|----------|
| **Primary/standby cluster high availability** | The standby cluster continuously syncs hot data from the primary cluster and takes over the load quickly when the primary cluster fails. | Minimize failover latency |
| **Read/write separation** | Newly written data in the write cluster is promptly warmed up to the read cluster to avoid queries hitting cold cache. | Reduce read cluster query jitter |

:::tip Version Information
The File Cache active incremental warm-up feature was introduced in Apache Doris **3.1.0**.
:::

---

## Feature Overview

<!-- Knowledge type: Step-by-step operations -->

File Cache active warm-up supports the following two types of cache synchronization:

1. **Event-triggered warm-up**: Automatically triggers synchronization after write operations such as Load, Compaction, and Schema Change complete, reducing query jitter.
2. **Periodic hot-data sync**: Continuously syncs hot-query data to the target cluster through periodic scanning, ensuring stable performance of the standby cluster during primary/standby switchover.

---

## Sync Mode Description

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Warm-up job creation -->

The applicable scenarios for the three sync modes are as follows:

| Mode | Parameter Value | Applicable Scenario |
|------|--------|----------|
| One-time sync | `ONCE` | Manually triggered; suitable for initial warm-up when a new cluster comes online |
| Periodic sync | `PERIODIC` | Scheduled sync of hot data; suitable for continuous warm-keeping scenarios |
| Event-driven sync | `EVENT_DRIVEN` | Automatically triggered after Load, Compaction, or Schema Change operations |

---

## Creating Warm-Up Jobs

<!-- Knowledge type: Step-by-step operations -->
<!-- Applicable scenarios: Warm-up job creation -->

### One-Time Sync

Suitable for manually triggering initial warm-up when a new cluster comes online:

```sql
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>;
```

### Periodic Sync

Suitable for continuously maintaining hot-data synchronization:

```sql
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>
PROPERTIES (
    "sync_mode" = "periodic",
    "sync_interval_sec" = "600"
);
```

- `sync_interval_sec`: The sync interval in seconds, calculated from the last start time. The default value is 600 seconds.

### Event-Driven Sync

Suitable for read/write separation scenarios, where new data is automatically warmed up to the read cluster after a write operation completes:

```sql
WARM UP COMPUTE GROUP <target_cluster> WITH COMPUTE GROUP <source_cluster>
PROPERTIES (
    "sync_mode" = "event_driven",
    "sync_event" = "load"
);
```

- `sync_event`: The type of event that triggers synchronization. Accepted values include `load`, `compaction`, and `schema_change`.

---

## Managing Warm-Up Jobs

<!-- Knowledge type: Step-by-step operations -->
<!-- Applicable scenarios: Job operations and maintenance -->

### Viewing Job List

```sql
-- View all warm-up jobs
SHOW WARM UP JOB;

-- View a specific job
SHOW WARM UP JOB WHERE ID = 12345;
```

Field descriptions for query results:

| Field | Description |
|--------|------|
| `JobId` | Unique ID of the sync job |
| `ComputeGroup` | Name of the target Compute Group |
| `SrcComputeGroup` | Name of the source Compute Group |
| `Type` | Sync type: `CLUSTER` (cluster-level) / `TABLE` (table-level) |
| `SyncMode` | Sync mode: `ONCE` / `PERIODIC(interval_sec)` / `EVENT_DRIVEN(event)` |
| `Status` | Job status: `PENDING` / `RUNNING` / `FINISHED` / `CANCELLED` / `DELETED` |
| `CreateTime` | Time when the job was created |
| `StartTime` | Time of the last start |
| `FinishTime` | Time of the last completion |
| `FinishBatch` | Number of batches completed |
| `AllBatch` | Total number of batches to sync |
| `ErrMsg` | Error message (empty if no error) |

### Canceling a Job

```sql
CANCEL WARM UP JOB WHERE id = 12345;
```

:::caution Note
The current version does not support using `ALTER` to modify an existing job configuration. To change parameters, cancel the job first and then create a new one.
:::

---

## How It Works

<!-- Knowledge type: Architecture decision -->

### Periodic Sync Execution Flow

1. FE registers the job and records the `sync_interval` configuration.
2. FE periodically checks whether the trigger time has been reached, calculated from the last start time.
3. The sync job is triggered, avoiding overlapping executions.
4. After sync completes, the status is recorded and the system waits for the next cycle.

### Event-Driven Sync Execution Flow

1. The user creates an event-driven job, FE registers the job and pushes the configuration to the source cluster BE.
2. The source BE automatically triggers the warm-up logic after events such as Load and Compaction complete.
3. The source BE initiates a sync request to the target BE at the Rowset granularity.
4. After sync completes, the target BE reports the execution status to FE.

### Scheduling and Storage Mechanism

- Sync relationships are persistently stored by FE as `CloudWarmUpJob` objects, supporting concurrent management of multiple jobs.
- Multiple jobs in `PENDING` status are allowed for the same target cluster, but only one job is allowed to be in `RUNNING` status at a time; the remaining jobs queue and wait.
- Sync relationships can be managed by Compute Group name, compatible with cluster renaming and migration operations.

---

## Metrics Monitoring

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

### Periodic Jobs - FE-Side Metrics

| Metric Name | Meaning |
|----------|------|
| `file_cache_warm_up_job_exec_count` | Number of scheduled executions |
| `file_cache_warm_up_job_requested_tablets` | Total number of tablets submitted |
| `file_cache_warm_up_job_finished_tablets` | Number of tablets that completed sync |
| `file_cache_warm_up_job_latest_start_time` | Time of the most recent job start |
| `file_cache_warm_up_job_last_finish_time` | Time of the most recent job completion |

### Periodic Jobs - BE-Side Metrics

| Metric Name | Meaning |
|----------|------|
| `file_cache_once_or_periodic_warm_up_submitted_segment_size` | Size of submitted segment data |
| `file_cache_once_or_periodic_warm_up_finished_segment_size` | Size of completed segment data |
| `file_cache_once_or_periodic_warm_up_submitted_index_num` | Number of submitted indexes |
| `file_cache_once_or_periodic_warm_up_finished_index_num` | Number of completed indexes |

### Event-Driven Jobs - Source BE Metrics

| Metric Name | Meaning |
|----------|------|
| `file_cache_event_driven_warm_up_requested_segment_size` | Size of segment data requested for sync |
| `file_cache_event_driven_warm_up_requested_index_num` | Number of indexes requested for sync |
| `file_cache_warm_up_rowset_last_call_unix_ts` | Timestamp of the last sync request initiated |

### Event-Driven Jobs - Target BE Metrics

| Metric Name | Meaning |
|----------|------|
| `file_cache_event_driven_warm_up_submitted_segment_num` | Number of segments received |
| `file_cache_event_driven_warm_up_finished_segment_num` | Number of segments that completed warm-up |
| `file_cache_warm_up_rowset_last_handle_unix_ts` | Timestamp of the last sync request handled |

---

## FAQ

<!-- Knowledge type: Step-by-step operations -->
<!-- Applicable scenarios: Troubleshooting -->

**Q: Does a sync failure in one round cancel the entire job?**

No. A sync failure in the current round only skips the current execution; the job status remains unchanged and subsequent cycles continue to attempt execution.

**Q: What happens when a periodic job execution times out?**

The system skips the current round after a timeout. The job itself is not deleted, and the next cycle triggers normally.

**Q: Is it supported to sync from multiple source clusters to the same target cluster?**

Yes. For example, cluster A and cluster C can both be configured to sync to cluster B simultaneously (A -> B and C -> B coexist).

**Q: How do you verify that a warm-up job has taken effect?**

You can verify using the following methods:

1. Run `SHOW WARM UP JOB WHERE ID = <job_id>` to check whether `Status` is `RUNNING` or `FINISHED`.
2. Compare `FinishBatch` with `AllBatch` to confirm sync progress.
3. Observe the BE-side metrics of the target cluster and confirm that `finished_segment_num` continues to grow.

**Q: How do you modify the configuration of a sync job (such as adjusting the sync interval)?**

Direct modification is not supported in the current version. You must first run `CANCEL WARM UP JOB WHERE id = <job_id>` to cancel the old job, then create a new job.
