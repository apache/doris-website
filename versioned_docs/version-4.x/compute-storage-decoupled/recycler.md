---
title: Compute-Storage Decoupled Data Recycling (Recycler) — Principles, Configuration, and Tuning
sidebar_label: Data Recycling (Recycler)
description: Introduces the Recycler data recycling mechanism in the Doris compute-storage decoupled architecture, including the mark-for-deletion principle, retention protection, monitoring metrics, and common tuning scenarios.
keywords: [Doris, compute-storage decoupled, data recycling, Recycler, mark-for-deletion, garbage collection, storage space, tuning]
---

<!-- Knowledge type: Architecture principles + Operational configuration -->
<!-- Applicable scenarios: Compute-storage decoupled deployment / Storage space management / Troubleshooting -->

Doris compute-storage decoupled architecture uses a **Mark-for-Deletion** strategy for data recycling. A dedicated Recycler component periodically scans marked metadata entries and deletes the corresponding object files in batches, achieving the best balance among performance, safety, and resource utilization.

## Comparison of Data Recycling Strategies

<!-- Knowledge type: Architecture selection decision -->

The three common data recycling strategies each have their trade-offs. Doris compute-storage decoupled architecture chooses the mark-for-deletion approach:

| Strategy | Trigger | Advantages | Disadvantages |
|----------|---------|------------|---------------|
| **Synchronous deletion** | Immediately deletes metadata and files when a delete command is executed | Simple to implement | Slow response, high risk, no buffer period |
| **Reconciliation deletion (reverse)** | Periodically scans all files, identifies unreferenced files, and deletes them in batches | Can clean up orphaned files | Must traverse all files; high I/O overhead |
| **Mark-for-deletion (forward)** | Only marks metadata on deletion; background process periodically scans marks and deletes files | Fast response, buffer period, high efficiency | Brief storage redundancy |

### Advantages of Mark-for-Deletion

Compared to other approaches, mark-for-deletion has the following advantages:

- **Fast response**: `DROP TABLE` only marks the meta KV as deleted without waiting for file I/O, so the user gets an immediate response and large-table deletion is non-blocking.
- **Efficient batch processing**: The background process handles file deletion in periodic batches, reducing the number of system calls and improving overall I/O efficiency.
- **Protection against accidental operations**: A buffer period exists before files are actually deleted. Accidentally dropped tables can be recovered within this buffer period, significantly reducing the risk of human error.
- **Transactional safety**: The mark operation is a lightweight metadata modification. Atomicity is easier to guarantee, reducing data inconsistency caused by system failures.
- **Load balancing**: File deletion can be performed during system idle periods, avoiding heavy I/O resource consumption during business peak hours.

## How Recycler Works

<!-- Knowledge type: Architecture principles -->

Recycler is an independently deployed component responsible for periodically reclaiming expired garbage files. A single Recycler can recycle multiple instances simultaneously, but the same instance can only be handled by one Recycler at a time.

### Mark-for-Deletion Workflow

Whenever a `DROP` command is executed or the system generates garbage data (such as rowsets that have been merged by compaction), the corresponding meta KV is marked as `recycled` status. Recycler periodically scans recycle KVs in instances and executes the following sequence:

1. Delete the corresponding object files (segment files, etc.)
2. Delete the recycle KV

Files are deleted before metadata to ensure a safe deletion order, preventing the situation where metadata is already deleted but files remain.

### Hierarchical Recycling Structure

<!-- Knowledge type: Operational steps -->

Data recycling is executed hierarchically from top to bottom. Using `DROP TABLE` as an example:

```
Table
 └─ Partition (delete recycle partition KV)
     └─ Tablet (delete recycle tablet KV)
         └─ Rowset (delete recycle rowset KV)
             └─ Segment files (actual object files, the final deletion unit)
```

During recycling, multiple types of tasks run concurrently, including `recycle_indexes`, `recycle_partition`, `recycle_compacted_rowsets`, `recycle_txn`, and others. A level's recycle KV is deleted only after all child items at that level have been successfully deleted.

### Retention Protection Mechanism

Each KV of an object pending recycling records a retention time. When Recycler scans, it calculates the retention time and **does not delete objects that have not yet expired**.

This mechanism provides protection against accidental operations: if a user accidentally drops a table, Recycler will not delete its data before the retention time expires, giving the user an opportunity to recover the data during that period.

### Reliability Guarantees

<!-- Knowledge type: Architecture principles -->

**Staged deletion**: Data files are deleted first, then metadata, and finally the KVs for indexes or partitions, ensuring a safe deletion order.

**Lease protection mechanism**: Each Recycler must acquire a lease before starting recycling, and a background thread renews the lease periodically. Only when a lease expires or the status is IDLE can a new Recycler take over, guaranteeing that only one Recycler recycles a given instance at a time and preventing data inconsistency caused by concurrent recycling.

### Multi-Layer Check Mechanism (Checker)

<!-- Knowledge type: Architecture principles -->

Recycler implements a multi-layer mutual check mechanism (checker) among FE metadata, MS KV, and object files. The checker performs bidirectional checks in the background across all Recycler KVs, object files, and FE in-memory metadata.

Using segment file KV and object file checks as an example:

| Check direction | Check content |
|-----------------|---------------|
| **Forward check** | Scans all KVs and verifies whether the corresponding segment files exist and whether the corresponding segment information is present in FE memory |
| **Reverse check** | Scans all segment files and verifies whether each has a corresponding KV and whether the corresponding segment information exists in FE memory |

If any under-recycled or over-recycled cases occur, the checker captures the relevant information. Operations personnel can manually delete excess garbage files based on the checker report, or rely on object versioning to recover accidentally deleted files.

Forward and reverse checks for segment files, idx files, and delete bitmap metadata are currently supported, with plans to extend coverage to all metadata.

## Monitoring Metrics

<!-- Knowledge type: Observability -->
<!-- Applicable scenarios: Performance monitoring / Troubleshooting -->

All monitoring metrics can be observed in real time on the **MS dashboard**.

### Key Monitoring Questions

| Question | Corresponding metric |
|----------|---------------------|
| Bytes recycled per second, quantity recycled per second for each object type | `recycler_instance_recycle_bytes_per_ms`, `recycler_instance_recycle_time_per_resource` |
| Amount of data and time elapsed per recycling round | `recycler_instance_last_round_recycled_bytes`, `recycler_instance_last_round_recycle_elpased_ts` |
| Amount of data recycled / pending recycling | `recycler_instance_last_round_recycled_num`, `recycler_instance_last_round_to_recycle_num` |
| Recycling status per storage backend | `recycler_vault_recycle_status` |
| Time of last success / failure | `recycler_instance_recycle_last_success_ts`, `recycler_instance_recycle_end_ts` |
| Next estimated recycling time | `recycler_instance_next_ts` |

### Full Metrics List

| Variable name | Metrics name | Dimensions / labels | Description |
|---------------|--------------|---------------------|-------------|
| `g_bvar_recycler_vault_recycle_status` | `recycler_vault_recycle_status` | instance_id, resource_id, status | Counts the status of vault recycling operations by instance ID, resource ID, and status |
| `g_bvar_recycler_vault_recycle_task_concurrency` | `recycler_vault_recycle_task_concurrency` | instance_id, resource_id | Counts the concurrency of vault file recycling tasks by instance ID and resource ID |
| `g_bvar_recycler_instance_last_round_recycled_num` | `recycler_instance_last_round_recycled_num` | instance_id, resource_type | Number of objects recycled in the most recent round |
| `g_bvar_recycler_instance_last_round_to_recycle_num` | `recycler_instance_last_round_to_recycle_num` | instance_id, resource_type | Number of objects to be recycled in the most recent round |
| `g_bvar_recycler_instance_last_round_recycled_bytes` | `recycler_instance_last_round_recycled_bytes` | instance_id, resource_type | Amount of data recycled in the most recent round (bytes) |
| `g_bvar_recycler_instance_last_round_to_recycle_bytes` | `recycler_instance_last_round_to_recycle_bytes` | instance_id, resource_type | Amount of data to be recycled in the most recent round (bytes) |
| `g_bvar_recycler_instance_last_round_recycle_elpased_ts` | `recycler_instance_last_round_recycle_elpased_ts` | instance_id, resource_type | Time elapsed for the most recent recycling operation (ms) |
| `g_bvar_recycler_instance_recycle_round` | `recycler_instance_recycle_round` | instance_id, resource_type | Round number of the recycling operation |
| `g_bvar_recycler_instance_recycle_time_per_resource` | `recycler_instance_recycle_time_per_resource` | instance_id, resource_type | Time required to recycle each resource (ms); `-1` indicates not recycled |
| `g_bvar_recycler_instance_recycle_bytes_per_ms` | `recycler_instance_recycle_bytes_per_ms` | instance_id, resource_type | Bytes recycled per millisecond; `-1` indicates not recycled |
| `g_bvar_recycler_instance_recycle_total_num_since_started` | `recycler_instance_recycle_total_num_since_started` | instance_id, resource_type | Total number of objects recycled since Recycler started |
| `g_bvar_recycler_instance_recycle_total_bytes_since_started` | `recycler_instance_recycle_total_bytes_since_started` | instance_id, resource_type | Total amount of data recycled since Recycler started (bytes) |
| `g_bvar_recycler_instance_running_counter` | `recycler_instance_running_counter` | — | Current number of instances being recycled |
| `g_bvar_recycler_instance_last_round_recycle_duration` | `recycler_instance_last_round_recycle_duration` | instance_id | Total time for the most recent recycling round |
| `g_bvar_recycler_instance_next_ts` | `recycler_instance_next_ts` | instance_id | Estimated next recycling time based on `recycle_interval_seconds` |
| `g_bvar_recycler_instance_recycle_st_ts` | `recycler_instance_recycle_start_ts` | instance_id | Start time of the overall recycling process |
| `g_bvar_recycler_instance_recycle_ed_ts` | `recycler_instance_recycle_end_ts` | instance_id | End time of the overall recycling process |
| `g_bvar_recycler_instance_recycle_last_success_ts` | `recycler_instance_recycle_last_success_ts` | instance_id | Time of the last successful recycling |

## Configuration Parameters

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Deployment tuning / Performance optimization -->

The following are commonly used configuration parameters for Recycler:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `recycle_interval_seconds` | `3600` | Recycling interval (seconds) |
| `retention_seconds` | `259200` (3 days) | General retention time, applicable to all objects without individually configured retention times |
| `recycle_concurrency` | `16` | Maximum number of instances a single Recycler can recycle simultaneously |
| `compacted_rowset_retention_seconds` | `1800` | Retention time for rowsets that have been merged by compaction (seconds) |
| `dropped_index_retention_seconds` | `10800` | Retention time for deleted indexes (seconds) |
| `dropped_partition_retention_seconds` | `10800` | Retention time for deleted partitions (seconds) |
| `recycle_whitelist` | `""` | Recycling whitelist; enter instance IDs (comma-separated); recycles all instances if empty |
| `recycle_blacklist` | `""` | Recycling blacklist; enter instance IDs (comma-separated); recycles all instances if empty |
| `instance_recycler_worker_pool_size` | `32` | Concurrency for object I/O operations (list, delete, etc.) |
| `recycle_pool_parallelism` | `40` | Concurrency for recycling tasks (`recycle_tablet`, `recycle_rowset`, etc.) |
| `enable_checker` | `false` | Whether to enable the forward checker |
| `enable_inverted_check` | `false` | Whether to enable the reverse checker |
| `check_object_interval_seconds` | `43200` (12 hours) | Execution interval for the checker (seconds) |
| `enable_recycler_stats_metrics` | `false` | Whether to enable Recycler observability metrics |
| `recycler_storage_vault_white_list` | `""` | Storage backend whitelist; enter vault names (comma-separated); recycles all vaults if empty |

## Common Tuning Scenarios

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

### Recycling Speed Is Too Slow

**Goal**: Accelerate garbage data cleanup and free up storage space.

**Adjustments**:

1. Increase concurrency:
    - `recycle_concurrency` (default 16): increase the number of instances recycled simultaneously.
    - `instance_recycler_worker_pool_size` (default 32): increase concurrency for object I/O operations.
    - `recycle_pool_parallelism` (default 40): increase concurrency for recycling tasks.
2. Shorten the recycling interval: reduce `recycle_interval_seconds` from the default 3600 seconds, for example to 1800 seconds.
3. Use the whitelist: use `recycle_whitelist` to prioritize recycling of important instances.

### Recycling Pressure Interferes with Business

**Goal**: Reduce Recycler interference with business operations.

**Adjustments**:

1. Reduce concurrency: decrease `recycle_concurrency`, `instance_recycler_worker_pool_size`, and `recycle_pool_parallelism` appropriately.
2. Extend the recycling interval: increase `recycle_interval_seconds`, for example to 7200 seconds.
3. Use the blacklist: use `recycle_blacklist` to temporarily exclude high-load instances.

### Storage Space Is Insufficient and Cleanup Needs to Be Accelerated

**Goal**: Free up storage space as quickly as possible.

**Adjustments**:

1. Shorten the general retention time: reduce `retention_seconds` from the default 259200 seconds (3 days).
2. Shorten retention time for specific object types:
    - `compacted_rowset_retention_seconds` (default 1800 seconds) can be reduced appropriately.
    - `dropped_index_retention_seconds` and `dropped_partition_retention_seconds` (default 10800 seconds) can be adjusted as needed.
3. Selectively recycle storage backends: use `recycler_storage_vault_white_list` to prioritize cleanup of specific vaults.

### Retention Time Needs to Be Extended to Prevent Accidental Deletion

**Goal**: Preserve a longer buffer period for accidental operation recovery.

**Adjustments**:

1. Increase `retention_seconds`, for example to 604800 seconds (7 days).
2. Adjust parameters such as `dropped_partition_retention_seconds` individually based on the importance of each object type.

### Enable Monitoring and Consistency Checks

**Goal**: Improve observability and investigate potential data consistency issues.

**Adjustments**:

1. Enable observability metrics: set `enable_recycler_stats_metrics = true`.
2. Enable check mechanisms:
    - `enable_checker = true` (forward check)
    - `enable_inverted_check = true` (reverse check)
3. Adjust `check_object_interval_seconds` (default 43200 seconds) to an appropriate check frequency.

### Certain Instances Have Abnormal Recycling

**Goal**: Temporarily isolate problematic instances to avoid affecting the recycling of other instances.

**Adjustments**:

1. Add the abnormal instance ID to `recycle_blacklist` to temporarily skip it.
2. Add instance IDs that need priority processing to `recycle_whitelist`.
3. Use `recycler_storage_vault_white_list` to selectively recycle specific storage backends.

### Large Table Deletion Causes Recycling Task Backlog

**Goal**: Quickly clear the accumulated recycling task backlog.

**Adjustments**:

1. Temporarily increase concurrency parameters (`recycle_concurrency`, `recycle_pool_parallelism`) to clear the backlog.
2. Use the whitelist to prioritize instances with severe backlogs.
3. If necessary, deploy multiple Recycler instances to share the load.

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting / Common errors -->

### Long-Running Queries Encounter "404 File Not Found" Errors

**Symptom**: A query runs for a long time. During this period, the tablet undergoes compaction, and the merged rowsets have been recycled by Recycler. The query reports `404 file not found` when accessing those rowsets.

**Cause**: The default value of `compacted_rowset_retention_seconds` is 1800 seconds (30 minutes). If a query runs longer than this value, the required rowset files may already have been deleted.

**Solution**: Increase `compacted_rowset_retention_seconds` based on the execution time of the longest queries in the cluster. For scenarios with long-running queries, setting it to 7200 seconds or longer is recommended.

### How to Confirm That Data Recycling Is Proceeding Normally

**Approach**:

1. Enable `enable_recycler_stats_metrics = true` and check the `recycler_instance_last_round_recycle_duration` and `recycler_instance_recycle_last_success_ts` metrics on the MS dashboard.
2. If `recycler_instance_recycle_last_success_ts` has not been updated for a long time, recycling may be stuck. Investigate the logs.

### How to Investigate Suspected Data Consistency Issues

**Approach**:

1. Ensure `enable_checker = true` and `enable_inverted_check = true`.
2. Shorten `check_object_interval_seconds` appropriately to increase check frequency.
3. Observe anomalies found by the checker on the MS dashboard.
4. Manually handle excess garbage files based on the checker report, or use object versioning to recover accidentally deleted files.

---

> **Note**: The tuning recommendations above must be evaluated in combination with the actual cluster scale, storage capacity, and business characteristics. It is recommended to closely monitor system load and business impact during tuning, and to adjust parameters gradually to find the optimal configuration.
