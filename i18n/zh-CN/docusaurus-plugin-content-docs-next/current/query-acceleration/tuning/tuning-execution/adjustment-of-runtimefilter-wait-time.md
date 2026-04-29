---
{
    "title": "RuntimeFilter 等待时间调整：解决 NOT_READY 与查询变慢",
    "language": "zh-CN",
    "description": "RuntimeFilter 等待超时未生效导致查询变慢？本文通过 Profile 定位 NOT_READY 状态，并给出 runtime_filter_wait_time_ms 调整方法。",
    "keywords": ["Doris RuntimeFilter", "runtime_filter_wait_time_ms", "RuntimeFilterState NOT_READY", "WaitForRuntimeFilter", "查询调优"]
}
---

# RuntimeFilter 等待时间调整：解决 NOT_READY 与查询变慢

<!-- 知识类型：调优指南 -->
<!-- 适用场景：因 RuntimeFilter 等待时间不合理（过短/过长）导致的查询性能问题 -->

## 概述

<!-- 知识类型：概念说明 -->
<!-- 适用场景：理解 RuntimeFilter 与等待时间的作用 -->

**RuntimeFilter** 是一种查询优化技术：在运行时根据 Join 右表生成过滤条件，下推到左表扫描阶段，从而减少 I/O 与计算量。

当 RuntimeFilter 的等待时间设置不合理（过短）时，左表扫描可能在过滤器生成前就已开始，导致优化失效、查询变慢。

本文通过一个真实 Profile 案例，介绍如何定位与解决该问题。

## 适用前提 Checklist

<!-- 知识类型：前置条件 -->
<!-- 适用场景：判断是否需要调整 RuntimeFilter 等待时间 -->

在调整等待时间前，请确认：

- [ ] 查询执行较慢，且包含 Join 操作
- [ ] 已通过 `EXPLAIN` / `PROFILE` 获取执行计划与执行剖析
- [ ] Profile 中存在 `WaitForRuntimeFilter` 字段
- [ ] RuntimeFilter 状态为 `NOT_READY` 或 Join 构建耗时大于当前等待时间

## 关键参数

<!-- 知识类型：参数配置 -->
<!-- 适用场景：调整 RuntimeFilter 等待时间 -->

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `runtime_filter_wait_time_ms` | 1000 ms | 左表扫描等待 RuntimeFilter 生成的最大时间，超过则放弃等待并直接扫描 |

设置方式（Session 级）：

```sql
SET runtime_filter_wait_time_ms = 3000;
```

## 案例：等待时间过短导致 RuntimeFilter 未就绪

<!-- 知识类型：案例分析 -->
<!-- 适用场景：通过 Profile 诊断 RuntimeFilter NOT_READY 问题 -->

### 步骤 1：从 ScanOperator 中观察等待状态

参考下面 Profile 信息：

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

关键信号：

- `WaitForRuntimeFilter: 1000ms`：扫描算子已等待 1000ms。
- `RuntimeFilterState = NOT_READY`：RuntimeFilter 6、7 仍未就绪。
- `IsPushDown = false`：过滤器未能下推到扫描阶段。

### 步骤 2：定位生成 RuntimeFilter 的 Join

```sql
RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```

通过 Profile 找到生成 RuntimeFilter 6、7 的 Join 算子：

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

`WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: 1sec780ms` 表明 Join 构建耗时约 **1.78s**，超出 RuntimeFilter 默认等待时间 1s，因此 ScanOperator 等不到过滤器。

### 步骤 3：调大等待时间

- **目的**：让扫描算子等到 RuntimeFilter 生成完成，从而触发下推。
- **命令**：

  ```sql
  SET runtime_filter_wait_time_ms = 3000;
  ```

- **说明**：将等待上限从 1000ms 调整为 3000ms，覆盖 1.78s 的 Join 构建时间。

### 步骤 4：验证效果

调整后，该查询耗时从 **5s 降低到 2s**。

## 诊断流程对比

<!-- 知识类型：方法对比 -->
<!-- 适用场景：快速选择诊断路径 -->

| 现象 | 可能原因 | 处理建议 |
| --- | --- | --- |
| `RuntimeFilterState = NOT_READY` 且 `WaitForRuntimeFilter` 接近上限 | 等待时间过短，Join 构建慢 | 调大 `runtime_filter_wait_time_ms` |
| `RuntimeFilterState = READY` 且 `IsPushDown = true` | 过滤器已生效 | 无需调整 |
| `Ignored = true` | 过滤器选择性差，被自动忽略 | 检查 Join 选择性，无需强行启用 |
| 扫描阶段长时间空等 | 等待时间过长，过滤器价值不高 | 适当调小 `runtime_filter_wait_time_ms` |

## FAQ

<!-- 知识类型：常见问题 -->
<!-- 适用场景：排查 RuntimeFilter 相关疑问 -->

**Q1：`runtime_filter_wait_time_ms` 设置越大越好吗？**

不是。等待过长会让左表扫描长时间空等，反而拖慢查询。建议根据 Join 构建耗时 (`WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time`) 适当上调。

**Q2：如何判断 RuntimeFilter 是否真正生效？**

查看 Profile 中 RuntimeFilter 的 `RuntimeFilterState` 与 `IsPushDown` 字段。`READY` 且 `IsPushDown = true` 表示生效。

**Q3：调整后仍然 NOT_READY 怎么办？**

检查 Join 右表是否有更深层的瓶颈（如数据倾斜、Shuffle 慢），或考虑通过 SQL Hint 关闭对该查询无效的 RuntimeFilter。

**Q4：该参数可以全局设置吗？**

可以，但建议优先在 Session 或单条 SQL 中通过 Hint 调整，避免全局影响其他查询。

## 总结

<!-- 知识类型：要点回顾 -->
<!-- 适用场景：实战记忆 -->

- RuntimeFilter 等待时间需结合 Join 构建耗时进行设置，没有放之四海而皆准的取值。
- 通过 `EXPLAIN` 与 `PROFILE` 定位 `NOT_READY` 状态及 Join 耗时。
- 通过 `SET runtime_filter_wait_time_ms` 或 SQL Hint 调整等待时间。
- Doris 正在持续推进自适应优化，未来该参数的人工干预需求会逐步降低。
