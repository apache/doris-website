---
{
    "title": "Performance Benchmarks",
    "language": "en",
    "description": "Doris CCR performance benchmark report based on the TPC-H 1T dataset, covering sync latency for full sync, incremental sync, and Flink write scenarios.",
    "keywords": [
        "Doris CCR performance",
        "CCR sync latency",
        "cross-cluster replication performance",
        "full sync duration",
        "incremental sync latency",
        "Flink real-time sync lag",
        "TPC-H 1T benchmark"
    ]
}
---

<!-- Knowledge type: Performance benchmark -->
<!-- Applicable scenarios: CCR evaluation / sync latency expectations / capacity planning -->

This document summarizes the sync performance benchmarks of Apache Doris CCR (Cross Cluster Replication) under the default configuration. The tests cover three typical scenarios: **full sync**, **incremental sync**, and **Flink real-time write sync**. The results can serve as a reference for capacity planning and SLA evaluation.

If you face scenarios such as **high network latency** or **high-throughput writes**, see the [Operations Manual](manual) for parameter tuning.

## Applicable Scenarios

| Scenario | Metrics of Interest | Corresponding Section |
|----------|---------------------|------------------------|
| Evaluate whether CCR meets the business SLA | Sync latency, first-time sync duration | Full Sync Performance Test, Incremental Sync Performance Test |
| Evaluate real-time data replication capability | Real-time write lag | Flink Sync Performance Test |
| Capacity planning for cross-cluster migration | Full initialization duration | Full Sync Performance Test |
| Baseline reference before tuning | Throughput and latency under default configuration | All test conclusions |

## Test Environment

### Test Dataset

- **Dataset**: TPC-H 1T

### Test Cluster Configuration

The upstream and downstream clusters use identical specifications:

| Item | Upstream Configuration | Downstream Configuration |
|------|------------------------|---------------------------|
| FE   | 2 cores, 16 GB         | 2 cores, 16 GB            |
| BE   | 3 nodes, 16 cores, 64 GB, 3*500 GB per node | 3 nodes, 16 cores, 64 GB, 3*500 GB per node |

---

## Incremental Sync Performance Test

<!-- Knowledge type: Performance benchmark -->
<!-- Applicable scenarios: Evaluate incremental sync latency -->

**Test goal**: Measure the time gap between an upstream write completing and the data becoming visible downstream after a sync relationship is established.

### Test Steps

1. Create the TPC-H 1T database and table definitions on the upstream cluster.
2. Create a sync task for the TPC-H 1T database.
3. Wait for the TPC-H 1T data import to complete, and record the completion time.
4. Wait for the downstream sync to complete, and record the completion time.

### Test Conclusion

Incremental sync time gap: **33 seconds**.

---

## Full Sync Performance Test

<!-- Knowledge type: Performance benchmark -->
<!-- Applicable scenarios: Evaluate first-time sync / data migration duration -->

**Test goal**: Measure the total time from creating a new sync task to the downstream data becoming fully visible, given that the upstream already holds the complete 1T dataset.

### Test Steps

1. Create the TPC-H 1T database and table definitions on the upstream cluster, complete the data import, and record the completion time.
2. Create a sync task for the TPC-H 1T database.
3. Wait for the downstream sync to complete, and record the completion time.

### Test Conclusion

Full sync time gap: **6 minutes 1 second**.

---

## Flink Sync Performance Test

<!-- Knowledge type: Performance benchmark -->
<!-- Applicable scenarios: Evaluate CCR sync lag under real-time streaming writes -->

**Test goal**: Measure the real-time gap (lag) between downstream sync progress and upstream write progress when the upstream is continuously writing through Flink.

### Test Steps

1. The upstream imports 100,000,000 rows using Flink.
2. Create the sync task for the database and tables.
3. At each stage, observe the difference between the downstream sync completion time and the upstream import completion time (for example: 1,000,000 rows, 2,000,000 rows, and so on).
4. Record the completion time of the last upstream import.
5. Record the downstream sync completion time.

### Test Conclusion

The **lag time** at each stage stays within `5 seconds`.

---

## Summary of Test Conclusions

| Test Scenario | Data Scale | Sync Latency / Duration |
|---------------|------------|--------------------------|
| Incremental sync | TPC-H 1T | 33 seconds |
| Full sync | TPC-H 1T | 6 minutes 1 second |
| Flink real-time sync | 100 million rows streamed | Lag at each stage ≤ 5 seconds |

> The numbers above are measured under the **default cluster configuration** listed on this page. In real production environments, sync performance depends on cluster specifications, network bandwidth, the number of tablets, and the business write pattern. For further optimization, see the [Operations Manual](manual).
