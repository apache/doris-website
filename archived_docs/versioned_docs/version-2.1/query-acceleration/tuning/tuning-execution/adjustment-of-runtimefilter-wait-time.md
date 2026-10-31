---
{
    "title": "Adjustment of RuntimeFilter Wait Time",
    "language": "en",
    "description": "In actual production scenarios, there may be performance issues caused by unreasonable RuntimeFilter wait times."
}
---

# Adjustment of RuntimeFilter Wait Time

## Overview

In actual production scenarios, there may be performance issues caused by unreasonable RuntimeFilter wait times. RuntimeFilter is a query optimization technique that generates filter conditions at runtime, thereby avoiding scanning irrelevant data. This optimization method can significantly reduce I/O operations and computational load, thus accelerating query execution. The following sections introduce several common cases to help with optimization in data skew scenarios.

## Case: Too Short RuntimeFilter Wait Time

Refer to the following Profile information:

```SQL
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

From the Profile, we can see that `WaitForRuntimeFilter: 1000ms`. Here, the RuntimeFilter waited for 1000ms, but this ScanOperator did not receive the corresponding RuntimeFilter, and `RuntimeFilterState = NOT_READY`.

```SQL
 RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
 RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```

So, the corresponding RuntimeFilters with ids 6 and 7 were not received. By locating the Join that generates the RuntimeFilter through the Profile, we found that the Join took time:

```SQL
  HASH_JOIN_OPERATOR (id=26, nereids_id=37948):
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
                - MemoryUsage: sum, avg, max, min 
                  - PeakMemoryUsage: sum 0.00, avg 0.00, max 0.00, min 0.00 
                  - ProbeKeyArena: sum 0.00, avg 0.00, max 0.00, min 0.00 
                - OpenTime: avg 45.985us, max 45.985us, min 45.985us
                - ProbeRows: sum 0, avg 0, max 0, min 0
                - ProjectionTime: avg 211.930us, max 211.930us, min 211.930us
                - RowsProduced: sum 1, avg 1, max 1, min 1
                - WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 1sec780ms, max 1sec780ms, min 1sec780ms
```

It can be seen that this Join took approximately `1sec780ms`, so the RuntimeFilter did not wait in 1s. Therefore, the RuntimeFilter wait time was adjusted:

```SQL
set runtime_filter_wait_time_ms = 3000;
```

After the adjustment, the query time was reduced from 5s to 2s.

## Summary

The wait time of RuntimeFilter needs to be defined according to the scenario. Doris is undergoing some adaptive optimization and transformation. Use the EXPLAIN and PROFILE tools to observe the execution bottleneck, locate the corresponding problem, and modify the RuntimeFilter wait time through SQL Hint to avoid the impact of the corresponding problem on performance.
