---
{
    "title": "File Cache Internals: Cache Slicing, Multi-Queue Management, Eviction, and Warm-Up",
    "sidebar_label": "File Cache Internals",
    "language": "en",
    "description": "A detailed explanation of Doris file cache slicing, multi-queue management, LRU eviction policy, and warm-up mechanisms to help you understand cache hit rate optimization and scaling best practices.",
    "keywords": ["Doris file cache", "cache slicing", "multi-queue LRU", "cache warm-up", "compute-storage decoupled", "cache eviction", "cache hit rate"]
}
---

<!-- Knowledge type: Architecture principle -->
<!-- When to use: Performance tuning / Troubleshooting / Scaling planning -->

## Basic Principles

<!-- Knowledge type: Operations -->

### Cache Slicing and Prefetch Mechanism

Doris splits target files into slices aligned to **1 MB** boundaries. After each slice is fully downloaded, it is stored as an independent block file on the local file system. This fine-grained slicing avoids wasting space by caching entire large files and enables more precise hit tracking and eviction of hot-spot data.

### Local File Directory Organization

<!-- Knowledge type: Configuration reference -->

Cache data can be distributed across multiple directories on multiple disks. Doris computes a hash of the target file path and uses that hash as the last-level directory component of the block file path. Within the directory, each block file is named by its **offset** in the target file, distributing data evenly across multiple directories.

**Example:** Given a target file path of `/remote/data/datafile1` with a computed hash of `12345`, the corresponding block file path is:

```
/cache/123/12345/<offset>
```

Here `<offset>` is the offset of that block's data within the original file.

### Multi-Queue Mechanism

<!-- Knowledge type: Configuration reference -->

Doris routes cached data into different queues by type to prevent cache pollution and improve hit rates. Queues are listed below from highest to lowest priority:

| Queue | Content | Priority | Notes |
|-------|---------|----------|-------|
| TTL queue | Data with a TTL attribute set | Highest | Data is not evicted while the TTL has not expired. TTL is a table-level attribute; for example, setting it to 3600 means data is retained in cache for up to 1 hour after ingestion. Suitable for small, frequently accessed resident tables that need local persistence. |
| Index queue | Index data (excluding inverted indexes) | High | Used to accelerate query filtering. Inverted indexes are placed in the Normal queue due to their large size. |
| Normal queue | Regular data (no TTL attribute) | Medium | The queue where most data resides. |
| Disposable queue | Temporary data (such as data read during Compaction) | Lowest | Evicted first after use. |

### Eviction Mechanism

<!-- Knowledge type: Operations -->
<!-- When to use: Troubleshooting / Performance tuning -->

#### When Eviction Is Triggered

| Trigger | Description |
|---------|-------------|
| Passive eviction due to insufficient space | Triggered when local disk space or inodes are exhausted, or when cache usage reaches the configured capacity limit. |
| Active eviction at high watermark | When cache usage reaches the high watermark, Doris asynchronously cleans up old cache entries in advance to avoid blocking writes with synchronous eviction. |
| Garbage collection eviction | Proactively cleans up the following stale data: source data from Compaction and Schema Change, data rolled back after a failed import commit, and residual data from `DROP TABLE` or `DROP PARTITION` operations. |
| TTL expiry demotion | When a TTL entry expires, it is demoted into the Normal queue and participates in the normal LRU eviction flow. |

#### Eviction Target Selection Strategy

**Space allocation ratio:** Multiple queues share disk space, and each queue has an independent upper limit on its share (for example, the Normal queue is capped at 40% of total space). When other queues have not yet consumed their allocated share, a queue can use all remaining space. As data of each type grows, the shares gradually approach their configured values.

**Eviction order:** When a queue does not have enough space for a write, Doris evicts data that exceeds the allocation ratio in the following order (within each queue, LRU determines which entries are evicted first):

```
Disposable → Normal → Index → TTL
```

If evicting from the other queues still leaves insufficient space, Doris evicts entries from the target queue itself using LRU.

#### Recommendations to Avoid Hot Data Eviction

- **Reserve sufficient disk space:** Because cache cleanup has some lag, always keep a margin. Based on experience, setting the file cache capacity to approximately **1.5 times** the volume of hot query data achieves a high hit rate.
- **Isolate large queries:** Route large queries to a dedicated cluster to prevent them from occupying cache and degrading the hit rate for other queries.

### Warm-Up Mechanism

<!-- Knowledge type: Operations -->
<!-- When to use: Pre-deployment check / Performance tuning -->

Cache warm-up loads data into the cache in advance so that subsequent queries can hit the local cache directly and achieve better query performance. Doris provides three warm-up methods:

#### Manual Warm-Up

You can initiate a warm-up for a specified table or partition, or by referencing the cache contents of another cluster. The data source is always remote storage (not other BE nodes). The warm-up flow is as follows:

1. You issue a warm-up command. The system converts the target into a set of tablets and dispatches them to the corresponding BEs.
2. Each BE performs a sequential read of all data files for its tablets and writes the data into the local file cache.
3. Tasks are executed in batches of at most **20 GB** each. After each batch completes, a checkpoint is saved, enabling resume on interruption.
4. If a BE goes down or you manually cancel the job, all BEs stop downloading and the warm-up ends.

You can check task status (`FINISHED` / `CANCELLED` / `RUNNING`) and overall progress with `SHOW WARM UP JOB`. When you warm up the same table and partition again, Doris automatically detects existing data and performs an **incremental update** without re-downloading data that is already cached.

#### Warm-Up Triggered by Data Rebalancing

When a tablet is migrated to a new BE due to load rebalancing (from scaling or a node failure), the new BE sends an RPC to the old BE to fetch the cache metadata, then re-downloads the data into its local file cache based on that metadata. The cache data on the old node is proactively evicted when the tablet information is cleaned up, freeing the space.

> **Note:** There is a time window between migration completion and cache download readiness, during which file cache misses may occur.

#### Automatic Warm-Up Across Compute Clusters (Version 3.1+)

<!-- Knowledge type: Architecture principle -->

In a compute-storage decoupled deployment, file caches across multiple compute clusters can be synchronized automatically. Doris provides two synchronization methods:

| Method | When to Use | Description |
|--------|-------------|-------------|
| Periodic warm-up | When real-time data freshness is not critical | Specify a sync interval in the `WARM UP` SQL statement. The job periodically synchronizes incremental data for specified tables and partitions to the target cluster. |
| Ingestion/Compaction-triggered warm-up | When real-time freshness is required | When an ingestion job enters the commit phase, the source cluster BE notifies the corresponding BE in the target cluster to download the newly uploaded data. Compaction completion triggers a similar notification path. FE is responsible for maintaining tablet distribution information for the target cluster. |

---

## Scenario Analysis

<!-- Knowledge type: Operations -->

### Query Scenario

<!-- When to use: Performance tuning / Troubleshooting -->

The file cache processing flow during a query is as follows:

1. **Scanner read request:** After a query arrives, the Scanner component prepares to read the required data files.
2. **Check local cache:** The Scanner first checks the local file cache, matching cache metadata by file path and offset.
3. **Cache hit:** When matching cached data is found, the system returns a set of BlockFile handles, and the Scanner reads data locally without accessing remote storage.
4. **Cache miss:** For ranges that are not in the cache, the Scanner downloads data from remote storage, writes it to the file cache, and then returns it. Space is freed in accordance with the eviction policy.

### Ingestion Scenario

<!-- When to use: Performance tuning -->

The file cache processing flow during data ingestion is as follows:

1. **Upload to remote storage:** Ingested data is first written to remote storage.
2. **Asynchronous write to local cache:** Doris simultaneously writes the data to the local file cache asynchronously, so that queries immediately after ingestion can hit the cache directly.
3. **Cache queue assignment:** Based on data type and TTL attribute, data is written to the corresponding queue (TTL queue, Index queue, or Normal queue).

### Compaction Scenario

<!-- When to use: Performance tuning -->

Doris has two types of Compaction:

- **Cumulative Compaction:** Merges incremental data segments.
- **Base Compaction:** Merges the baseline data version (starting from version 0) with incremental data versions.

The two types of Compaction use different cache write strategies:

| Compaction Type | Cache Write Strategy |
|-----------------|---------------------|
| Cumulative Compaction | Output data is written to the file cache while being uploaded to remote storage, consistent with the ingestion flow, to accelerate subsequent queries. |
| Base Compaction | By default, data is written to the cache only when there is sufficient cache space, to avoid cache pollution from large volumes of cold data. You can force writes by setting the BE parameter `enable_file_cache_keep_base_compaction_output = true`, but this may cause other hot data to be evicted. |

> **Planned:** A future version of Doris will provide an adaptive write strategy based on historical query statistics.

### Cache Loading After Restart

<!-- When to use: Troubleshooting -->

Before version 3.1, the LRU queue order could not be restored after a restart, causing hot data to be evicted and degrading the hit rate.

**Version 3.1 introduces LRU information persistence.** The loading flow is as follows:

1. **Periodic dump:** The order information of each LRU queue is periodically persisted to disk.
2. **Load on restart:** When a node restarts, it reads the dump data from disk to restore the cache queue state.
3. **Full disk scan for completeness:** To fix metadata-disk inconsistencies caused by the dump time window, a full disk scan is performed after restart to ensure data integrity.
4. **Query-triggered concurrent async loading:** During the full disk scan, the BE can still serve queries. If a query targets data that has not been scanned yet, the system loads that data ahead of schedule to reduce query latency.

### Scaling Scenario

<!-- Knowledge type: Configuration reference -->
<!-- When to use: Scaling planning -->

#### Horizontal Scale-Out

Doris migrates tablets to new BE nodes through rebalancing. The target BE re-downloads data to local storage based on the source BE's cache metadata, ensuring that queries on the new node can also hit the file cache.

#### Horizontal Scale-In

After tablet rebalancing, if the cluster's overall file cache capacity falls below the actual volume of cached data, the eviction mechanism automatically removes the excess data.

#### Vertical Scale-Out

| Scale-Out Method | Instructions |
|------------------|-------------|
| Increase single-disk capacity | Run the following command to notify the BE of the space change: `curl http://<BE_IP>:<WEB_PORT>/api/file_cache?op=reset&capacity=<new capacity in bytes>` |
| Add more disks | **Not recommended.** Doris does not currently implement rehashing and does not support rebalancing across disks. Changing the number of cache directories may cause cache lookup failures. If you must add disks, clear the cache and re-warm as needed. |

#### Vertical Scale-In

Reducing disk space also requires running the `reset` command above. When the cache capacity falls below the actual volume of cached data, the eviction mechanism is triggered to clean up data automatically.

#### Warm-Up Considerations After Scaling

Horizontal scale-out and scale-in involve tablet rebalancing operations. **Wait for the migration to stabilize before executing a warm-up** to ensure the warm-up is effective. You can determine whether the migration is complete by monitoring the FE metric `doris_fe_tablet_num`. A flat, stable curve with no fluctuation indicates the migration is finished and it is safe to run a warm-up.

---

## Frequently Asked Questions

<!-- Knowledge type: Troubleshooting -->
<!-- When to use: Troubleshooting / Performance tuning -->

**Q: The cache hit rate is low and query performance has not improved. How do I troubleshoot?**

- Check whether the file cache disk has sufficient remaining space. The recommended cache capacity is at least 1.5 times the volume of hot data.
- Check whether large queries are frequently evicting hot data. Consider isolating large queries.
- A low hit rate for a short period after a restart is normal (LRU recovery takes time). You can run a manual warm-up in advance.

**Q: After scaling out, queries are missing the cache. What should I do?**

- Confirm that tablet rebalancing is complete (the `doris_fe_tablet_num` curve is flat and stable).
- Run a manual warm-up command for the target tables and partitions.
- After horizontal scale-out, data download on new BEs takes time. Cache misses during this period are expected.

**Q: Does Base Compaction cause hot data to be evicted?**

- By default, Base Compaction writes to the cache only when there is sufficient space and does not actively evict hot data.
- If `enable_file_cache_keep_base_compaction_output = true` is enabled, Base Compaction data is force-written to the cache, which may cause hot data to be evicted. Evaluate this trade-off based on your actual workload.

**Q: Is data deleted immediately when its TTL expires?**

- No, it is not deleted immediately. When the TTL expires, the data is demoted to the Normal type and enters the Normal queue to participate in normal LRU eviction. The eviction mechanism ultimately determines when the data is removed.

**Q: Can manual warm-up avoid re-downloading data that is already cached?**

- Yes. When executing a warm-up, Doris automatically identifies already-cached data and performs an incremental download only for new or changed data.
