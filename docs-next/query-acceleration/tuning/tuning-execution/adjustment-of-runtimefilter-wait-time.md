---
{
    "title": "RuntimeFilter Wait Time Tuning: Resolving NOT_READY and Slow Queries",
    "sidebar_label": "RuntimeFilter Tuning",
    "language": "en",
    "description": "Queries slow because RuntimeFilter wait timeout did not take effect? This article uses Profile to locate the NOT_READY state and explains how to adjust runtime_filter_wait_time_ms.",
    "keywords": ["Doris RuntimeFilter", "runtime_filter_wait_time_ms", "RuntimeFilterState NOT_READY", "WaitForRuntimeFilter", "Query Tuning"]
}
---

<!-- Knowledge type: Tuning guide -->
<!-- Applicable scenario: Query performance issues caused by unreasonable (too short / too long) RuntimeFilter wait time -->

**RuntimeFilter** is a query optimization technique: at runtime, it generates filter conditions from the right-hand table of a Join and pushes them down to the left-hand table scan stage, thereby reducing I/O and computation.

When the RuntimeFilter wait time is set unreasonably (too short), the left-hand table scan may start before the filter is generated, causing the optimization to fail and the query to slow down.

This article uses a real Profile case to explain how to locate and resolve this issue.

## Applicability Checklist

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Determine whether RuntimeFilter wait time needs to be adjusted -->

Before adjusting the wait time, confirm the following:

- The query executes slowly and contains a Join operation.
- You have obtained the execution plan and execution profile through `EXPLAIN` / `PROFILE`.
- The Profile contains the `WaitForRuntimeFilter` field.
- The RuntimeFilter state is `NOT_READY`, or the Join build time is greater than the current wait time.

## Key Parameters

<!-- Knowledge type: Parameter configuration -->
<!-- Applicable scenario: Adjust RuntimeFilter wait time -->

| Parameter | Default | Description |
| --- | --- | --- |
| `runtime_filter_wait_time_ms` | 1000 ms | The maximum time the left-hand table scan waits for the RuntimeFilter to be generated. After this time, it gives up waiting and scans directly. |

How to set it (Session level):

```sql
SET runtime_filter_wait_time_ms = 3000;
```

## Case: Wait Time Too Short Causes RuntimeFilter Not Ready

<!-- Knowledge type: Case analysis -->
<!-- Applicable scenario: Diagnose RuntimeFilter NOT_READY issues through Profile -->

### Step 1: Observe the Wait State from ScanOperator

Refer to the following Profile information:

```sql
OLAP_SCAN_OPERATOR (id=22. nereids_id=1764. table name = test_doris(test_doris)):(ExecTime: 62.870ms)
               - RuntimeFilters: : RuntimeFilter: (id = 6, type = minmax, need_local_merge: true, is_broadcast: false, build_bf_cardinality: false, RuntimeFilter: (id = 7, type = in_or_bloomfilter, need_local_merge: true, is_broadcast: false, build_bf_cardinality: false,
               - PushDownPredicates: []
               - KeyRanges: ScanKeys:ScanKey=[null(-9223372036854775808) : 9223372036854775807]
               - TabletIds: [1732763414173, 1732763414187, 1732763414201, 1732763414215]
               - UseSpecificThreadToken: False
               - AcquireRuntimeFilterTime: 969ns
               - BlocksProduced: 1.829K (1829)
               - CloseTime: 0ns
               - ExecTime: 62.870ms
               - InitTime: 75.703us
               - KeyRangesNum: 0
               - MaxScannerThreadNum: 32
               - MemoryUsage:
                 - PeakMemoryUsage: 0.00
               - NumScanners: 32
               - OpenTime: 19.276ms
               - ProcessConjunctTime: 30.360us
               - ProjectionTime: 0ns
               - RowsProduced: 7.433056M (7433056)
               - RowsRead: 0
               - RuntimeFilterInfo:
               - ScannerWorkerWaitTime: 0ns
               - TabletNum: 4
               - TotalReadThroughput: 0
               - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: 0ns
               - WaitForRuntimeFilter: 1000ms
              RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
              RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```

Key signals:

- `WaitForRuntimeFilter: 1000ms`: The scan operator has waited for 1000ms.
- `RuntimeFilterState = NOT_READY`: RuntimeFilters 6 and 7 are still not ready.
- `IsPushDown = false`: The filters could not be pushed down to the scan stage.

### Step 2: Locate the Join That Generates the RuntimeFilters

```sql
RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```

Find the Join operator that generates RuntimeFilters 6 and 7 in the Profile:

```sql
HASH_JOIN_OPERATOR (id=26 , nereids_id=37948):
                - PlanInfo
                   - join op: RIGHT OUTER JOIN(PARTITIONED)[]
                   - equal join conjunct: (id = ID)
                   - runtime filters: RF006[min_max] <- ID(6418/8192/1048576), RF007[in_or_bloom] <- ID(6418/8192/1048576)
                   - cardinality=6,418
                   - vec output tuple id: 27
                   - output tuple id: 27
                   - vIntermediate tuple ids: 25
                   - hash output slot ids: 396 398 399 400 401 402 403 404 405 406 407 408 409 410 411 412 413 447
                   - projections: USER_ID
                   - project output tuple id: 27
                - BlocksProduced: sum 1, avg 1, max 1, min 1
                - CloseTime: avg 10.111us, max 10.111us, min 10.111us
                - ExecTime: avg 364.497us, max 364.497us, min 364.497us
                - InitTime: avg 26.653us, max 26.653us, min 26.653us
                - MemoryUsage: sum , avg , max , min
                  - PeakMemoryUsage: sum 0.00 , avg 0.00 , max 0.00 , min 0.00
                  - ProbeKeyArena: sum 0.00 , avg 0.00 , max 0.00 , min 0.00
                - OpenTime: avg 45.985us, max 45.985us, min 45.985us
                - ProbeRows: sum 0, avg 0, max 0, min 0
                - ProjectionTime: avg 211.930us, max 211.930us, min 211.930us
                - RowsProduced: sum 1, avg 1, max 1, min 1
                - WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 1sec780ms, max 1sec780ms, min 1sec780ms
```

`WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: 1sec780ms` indicates that the Join build takes about **1.78s**, which exceeds the default RuntimeFilter wait time of 1s. As a result, the ScanOperator cannot wait for the filter.

### Step 3: Increase the Wait Time

- **Goal**: Allow the scan operator to wait until the RuntimeFilter is generated, so that pushdown is triggered.
- **Command**:

  ```sql
  SET runtime_filter_wait_time_ms = 3000;
  ```

- **Explanation**: Adjust the wait limit from 1000ms to 3000ms to cover the 1.78s Join build time.

### Step 4: Verify the Effect

After the adjustment, the query time dropped from **5s to 2s**.

## Diagnostic Workflow Comparison

<!-- Knowledge type: Method comparison -->
<!-- Applicable scenario: Quickly select a diagnostic path -->

| Symptom | Possible Cause | Recommended Action |
| --- | --- | --- |
| `RuntimeFilterState = NOT_READY` and `WaitForRuntimeFilter` is close to the limit | Wait time too short, slow Join build | Increase `runtime_filter_wait_time_ms` |
| `RuntimeFilterState = READY` and `IsPushDown = true` | Filter has taken effect | No adjustment needed |
| `Ignored = true` | Filter has poor selectivity and is automatically ignored | Check Join selectivity; do not force enable |
| Scan stage idles for a long time | Wait time too long, filter has low value | Reduce `runtime_filter_wait_time_ms` appropriately |

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Troubleshoot RuntimeFilter-related questions -->

**Q1: Is a larger `runtime_filter_wait_time_ms` always better?**

No. A wait that is too long causes the left-hand table scan to idle for an extended period, which slows down the query instead. It is recommended to increase the value moderately based on the Join build time (`WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time`).

**Q2: How to determine whether the RuntimeFilter actually takes effect?**

Check the `RuntimeFilterState` and `IsPushDown` fields of the RuntimeFilter in the Profile. `READY` and `IsPushDown = true` indicate that it is in effect.

**Q3: What if it is still NOT_READY after the adjustment?**

Check whether the right-hand table of the Join has a deeper bottleneck (such as data skew or slow Shuffle), or consider using a SQL Hint to disable RuntimeFilters that are ineffective for this query.

**Q4: Can this parameter be set globally?**

Yes, but it is recommended to adjust it at the Session level or for a single SQL through a Hint, to avoid affecting other queries globally.

## Summary

<!-- Knowledge type: Key takeaways -->
<!-- Applicable scenario: Practical recap -->

- The RuntimeFilter wait time should be set in conjunction with the Join build time. There is no one-size-fits-all value.
- Use `EXPLAIN` and `PROFILE` to locate the `NOT_READY` state and the Join time.
- Use `SET runtime_filter_wait_time_ms` or a SQL Hint to adjust the wait time.
- Doris is continuously advancing adaptive optimization, and the need for manual intervention with this parameter will gradually decrease in the future.
