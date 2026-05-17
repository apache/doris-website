---
{
    "title": "File Cache Optimization Best Practices for Read-Write Separation",
    "sidebar_label": "Read-Write Separation: File Cache Optimization",
    "language": "en",
    "description": "How to resolve Cache Miss issues in read-only compute groups and improve query performance stability in Apache Doris compute-storage decoupled deployments with read-write separation, using cache warm-up configuration.",
    "keywords": ["File Cache", "cache warm-up", "read-write separation", "Cache Miss", "compute group", "compute-storage decoupled", "Compaction", "query performance"]
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Performance tuning / Read-write separation deployment -->

In the Apache Doris compute-storage decoupled architecture, when multiple compute groups are deployed to achieve read-write separation, query performance depends heavily on the File Cache hit rate. When a read-only compute group experiences a cache miss (Cache Miss), it must fetch data from remote object storage, which can significantly increase query latency.

This document explains how to reduce cache miss issues caused by **Compaction**, **data ingestion**, and **Schema Change** through cache warm-up and related configuration, thereby ensuring stable query performance on read-only clusters.

## The Core Problem: Cache Invalidation Caused by New Data Versions (Rowsets)

<!-- Knowledge type: Principle explanation -->

In Doris, Compaction, Schema Change, and data ingestion all generate new sets of data files (Rowsets). The write-only compute group caches data to the local File Cache by default during writes, so query performance on that compute group is not affected.

For read-only compute groups, when they synchronize metadata and become aware of new Rowsets, those new data files are not present in the local cache. If a query accesses a new Rowset at that point, a cache miss is triggered, causing performance degradation.

**The core idea: load data into the read-only compute group's cache proactively or intelligently before queries access it.**

## Cache Warm-Up Mechanism Overview

<!-- Knowledge type: Feature overview -->
<!-- Applicable scenario: Pre-deployment planning -->

Cache warm-up is the process of actively loading data from remote storage into the File Cache on BE nodes. Doris provides two primary warm-up approaches:

| Warm-up approach | Applicable scenario | Characteristics |
| --- | --- | --- |
| Active incremental warm-up | Most scenarios where the user has permission to configure warm-up relationships | Intelligent and automated; recommended as the first choice |
| Read-only compute group automatic warm-up | No permission to configure warm-up relationships, or when using non-MoW tables | Lightweight and simple to configure |

### Active Incremental Warm-Up (Recommended)

<!-- Knowledge type: Operational steps -->

By establishing a warm-up relationship between the write compute group and the read-only compute group, when events such as writes or Compaction produce new Rowsets, the system actively notifies and triggers the associated read-only compute groups to perform asynchronous cache warm-up.

For detailed configuration, see [FileCache Active Incremental Warm-Up](./read-write-separation).

### Read-Only Compute Group Automatic Warm-Up

<!-- Knowledge type: Configuration parameters -->

After enabling this configuration on the BE nodes of the read-only compute group, the system automatically triggers an asynchronous warm-up task whenever it detects new Rowsets.

Set the following in `be.conf` on the read-only compute group:

```properties
enable_warmup_immediately_on_new_rowset = true
```

## Mitigating the Impact of Compaction and Schema Change on Query Performance

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Troubleshooting / Performance tuning -->

Background Compaction merges old Rowsets and generates new ones. If the new Rowsets have not been warmed up, query performance on the read-only compute group may fluctuate due to Cache Miss. The following two solutions address this.

### Option 1: Active Incremental Warm-Up + Delayed Commit (Recommended)

This option fundamentally prevents read-only compute groups from querying uncached new Rowsets produced by Compaction or Schema Change.

**How it works:**

1. Configure an active incremental warm-up relationship between the write compute group and the read-only compute group.
2. On the BE nodes of the write compute group, enable the delayed commit feature for Compaction and Schema Change.

Set the following in `be.conf` on the write compute group:

```properties
enable_compaction_delay_commit_for_warm_up = true
```

**Workflow:**

1. A Compaction or Schema Change task completes on the write compute group and generates a new Rowset.
2. The new Rowset is **not committed immediately** (it is invisible to read-only compute groups).
3. The system triggers the associated read-only compute groups to warm up the cache for the new Rowset.
4. Only after all associated read-only compute groups have finished warming up does the new Rowset commit and become visible to all compute groups.

**Advantages:**

- **Seamless transition**: All Compaction results visible to read-only compute groups are already in the cache, so query performance does not fluctuate.
- **High stability**: This is the most robust option for guaranteeing query performance in a read-write separation scenario.

### Option 2: Read-Only Compute Group Automatic Warm-Up + Query Awareness

This option uses intelligent selection at the query layer to skip new Rowsets that have not yet finished warming up where possible.

> **Note**: For Unique Key MoW tables, Rowsets produced by Compaction cannot be skipped due to correctness requirements.

**Implementation steps:**

1. Enable automatic warm-up in `be.conf` on the read-only compute group:

    ```properties
    enable_warmup_immediately_on_new_rowset = true
    ```

2. At query time, enable the warm-up-aware Rowset selection strategy via a session variable or user property.

    Set for the query session:

    ```sql
    SET enable_prefer_cached_rowset = true;
    ```

    Or set as a user property:

    ```sql
    SET property for "jack" enable_prefer_cached_rowset = true;
    ```

**Workflow:**

1. When the read-only compute group detects a new Rowset produced by Compaction, it asynchronously triggers a warm-up task.
2. With `enable_prefer_cached_rowset` enabled, the query executor prefers Rowset versions that have already been warmed up.
3. For new Rowsets that are still being warmed up, the query automatically skips them (without affecting data consistency) and accesses the older, already-cached Rowsets instead.

**Caveats:**

This option is a best-effort strategy. If the old Rowsets corresponding to a new Rowset have already been cleaned up, or if the query must access the latest data version, the query still waits for warm-up to complete or reads the cold data directly.

## Mitigating the Impact of Data Ingestion on Query Performance

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: High-frequency writes / Real-time ingestion performance optimization -->

High-frequency data ingestion (such as `INSERT INTO` and `Stream Load`) continuously generates small new files (Rowsets), causing Cache Miss issues on the read-only compute group. If the business can tolerate second-level or sub-second data latency, the following combined strategy can deliver significant performance improvements at the cost of a minimal reduction in data freshness.

**How it works:** By combining automatic warm-up with a freshness tolerance setting at query time, the query executor intelligently skips the latest data that has not yet finished warming up within a specified time window.

**Implementation steps:**

1. **Enable the warm-up mechanism**: Enable active incremental warm-up on the read-only compute group, or enable automatic warm-up:

    ```properties
    enable_warmup_immediately_on_new_rowset = true
    ```

2. **Set query freshness tolerance**: Set `query_freshness_tolerance_ms` in the query session or user properties on the read-only compute group.

    Set for the query session:

    ```sql
    -- Allow up to 1000 milliseconds (1 second) of data latency
    SET query_freshness_tolerance_ms = 1000;
    ```

    Or set as a user property:

    ```sql
    SET property for "jack" query_freshness_tolerance_ms = 1000;
    ```

**Workflow:**

1. When a query begins execution, it inspects the Rowsets it needs to access.
2. If a Rowset was generated **within the last 1000 ms** and **has not yet finished warming up**, the query executor automatically skips it and accesses older but already-cached data instead.
3. The vast majority of queries hit the cache, avoiding performance degradation caused by reading newly written cold data.

**Fallback behavior:** If a Rowset's warm-up takes longer than the time specified by `query_freshness_tolerance_ms` (for example, more than 1000 ms), the query no longer skips it, falling back to the default behavior of reading cold data directly, to ensure the data eventually becomes visible.

**Advantages:**

- **Significant performance improvement**: For high-throughput write scenarios, this effectively eliminates query performance spikes.
- **High flexibility**: Users can flexibly balance data freshness against query performance based on business requirements.

## Comparison and Selection Guide

<!-- Knowledge type: Architecture selection decision -->

| Option | Applicable scenario | Compaction impact | Schema Change impact | New write data impact |
| --- | --- | --- | --- | --- |
| Active incremental warm-up + delayed commit (+ optional freshness tolerance) | Extremely high query latency requirements; permission to configure warm-up relationships | None | None | Depends on freshness tolerance configuration |
| Read-only compute group automatic warm-up + prefer cached data (+ optional freshness tolerance) | No permission to configure warm-up relationships; ineffective for MoW primary key tables when freshness tolerance is not configured | None | Cache Miss | Depends on freshness tolerance configuration |

By applying the cache warm-up strategies and related configurations described above, you can effectively manage cache behavior in Apache Doris under a read-write separation architecture, minimize performance loss from cache misses, and ensure stable and efficient read-only query workloads.

## Frequently Asked Questions

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Troubleshooting / Operations Q&A -->

**Q: Can active incremental warm-up and read-only compute group automatic warm-up be enabled at the same time?**

Yes. The two are not mutually exclusive. Enabling both increases warm-up coverage. It is recommended to rely primarily on active incremental warm-up, with automatic warm-up as a supplement.

**Q: After enabling delayed commit, when do Compaction results become visible?**

Compaction results are committed and become visible to all compute groups only after all associated read-only compute groups have finished warming up. If warm-up times out, the system forces a commit to prevent the Compaction pipeline from blocking.

**Q: What value should `query_freshness_tolerance_ms` be set to?**

Set the value based on your business tolerance for data latency. A range of 500 to 2000 ms typically balances performance and freshness. If the business has extremely high real-time requirements, it is not recommended to enable this configuration.

**Q: Why can Compaction Rowsets for MoW primary key tables not be skipped?**

The delete semantics of MoW (Merge-on-Write) tables depend on the data version produced after Compaction. Skipping those Rowsets can produce incorrect query results, so the system always reads the latest Rowset.

**Q: Query performance on the read-only compute group suddenly drops. How can I quickly diagnose the cause?**

1. Check the File Cache hit rate metrics in BE monitoring to determine whether there are large numbers of Cache Misses.
2. Confirm whether there have been recent Compaction, Schema Change, or large-batch data ingestion operations.
3. Verify that the warm-up mechanism is correctly configured (`enable_warmup_immediately_on_new_rowset` or active incremental warm-up).
4. Check the execution status of warm-up tasks to confirm whether warm-up is completing normally.
