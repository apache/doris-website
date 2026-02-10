---
{
    "title": "RuntimeFilter 的等待时间调整",
    "language": "zh-CN",
    "description": "实际生产场景会遇到因为 RuntimeFilter 等待时间不合理，引起的性能问题的情况。RuntimeFilter 是一种查询优化技术，它通过运行时生成过滤条件，从而避免了对无关数据的扫描。这种优化方式能够大幅减少 I/O 操作和计算量，进而加速查询执行。下面介绍几种常见的案例，"
}
---

# RuntimeFilter 的等待时间调整

## 概述

实际生产场景会遇到因为 RuntimeFilter 等待时间不合理，引起的性能问题的情况。RuntimeFilter 是一种查询优化技术，它通过运行时生成过滤条件，从而避免了对无关数据的扫描。这种优化方式能够大幅减少 I/O 操作和计算量，进而加速查询执行。下面介绍几种常见的案例，帮助在数据倾斜场景下进行调优。。

## 案例：RuntimeFilter 等待时间过短

参考下面 Profile 的信息：

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

从 Profile 中可以看到：`WaitForRuntimeFilter: 1000ms`。这里 RuntimeFilter 等待了 1000ms，但是这个 ScanOperator 并没有等到对应的 RuntimeFilter，`RuntimeFilterState = NOT_READY`。

```SQL
 RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
 RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```

所以这里对应的 RuntimeFilter 的 id 6 和 7 都没有等到。通过 Profile 定位到生成 RuntimeFilter 的 Join，发现 Join 耗时

```SQL
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

可以看到这个 Join 耗时大概是`1sec780ms`，所以 RuntimeFilter 在 1s 内并没有等到。于是调整 RuntimeFilter 的等待时间：

```SQL
set runtime_filter_wait_time_ms = 3000;
```

调整之后，查询耗时从 5s 降低到 2s。

## 总结

RuntimeFilter 的等待时间需要根据场景定义，Doris 正在进行一些自适应的优化改造。通过 EXPLAIN 和 PROFILE 工具观察查询执行瓶颈，定位对应问题，通过 SQL HINT 修改 RuntimeFilter 等待时间，规避对应问题对性能的影响。