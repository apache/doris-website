---
{
    "title": "查询报错 Process Memory Not Enough",
    "language": "zh-CN",
    "description": "当 Query 的报错信息中出现 MEMLIMITEXCEEDED 且包含 Process memory not enough 时，说明因为进程可用内存不足被 Cancel。"
}
---

当 Query 的报错信息中出现 `MEM_LIMIT_EXCEEDED` 且包含 `Process memory not enough` 时，说明因为进程可用内存不足被 Cancel。

首先解析错误信息，确认 Cancel 的原因、Cancel 时 Query 自身使用的内存大小、以及进程的内存状态。Query 被 Cancel 的原因通常有如下三种：

1. 被 Cancel 的 Query 自身内存过大。

2. 被 Cancel 的 Query 自身内存较小，有其他内存更大的 Query 存在。

3. 全局共享的 Cahce、元数据等内存过大，或者查询和导入任务之外的其他任务内存过大

## 错误信息解析

进程可用内存不足分为两种情况，一是进程当前内存超出配置的内存上限，二是系统剩余可用内存低于水位线。存在三个路径会 Cancel 查询等任务：

- 如果报错信息包含`cancel top memory used`，说明任务在内存 Full GC 中被 Cancel。

- 如果报错信息包含`cancel top memory overcommit`，说明任务在内存 Minor GC 中被 Cancel。

- 如果报错信息包含`Allocator sys memory check failed`，说明任务从 `Doris Allocator` 申请内存失败后被 Cancel。


在对下面报错信息的解析后，

- 若查询和导入自身使用的内存占到进程内存的很大比例，参考 [ Query 自身内存过大] 分析查询和导入的内存使用，尝试调整参数或优化 SQL 来减少执行需要的内存。

- 若任务自身使用的内存很少，参考 [查询和导入之外的进程内存过大] 尝试减少进程其他位置的内存使用，从而保留更多的内存用于查询等任务执行。

有关内存限制和水位线计算方法、内存 GC 的更多介绍见 [内存控制策略](./../memory-feature/memory-control-strategy.md)

### 1 在内存 Full GC 中被 Cancel

若 BE 进程内存超过进程内存上限（MemLimit）或系统剩余可用内存低于内存低水位线 (LowWaterMark) 时触发 Full GC，此时会优先 Cancel 内存最大的任务。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory used query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB. Execute again after enough memory, details see be.INFO.
```

错误信息解析：

1. `(10.16.10.8)`: 查询过程中内存不足的 BE 节点。

2. `query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB`：当前被 cancel 的 queryID，Query 本身使用了 866.97 MB 内存。

3. `process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB` 进程内存超限的原因，此处是 BE 进程使用的物理内存 3.12 GB 超过了 3.01 GB 的 MemLimit，当前操作系统剩余可供 BE 使用的内存为 191.25 GB 仍高于 LowWaterMark 3.20 GB。

### 2 在内存 Minor GC 中被 Cancel

若 Doris BE 进程内存超过进程内存软限（SoftMemLimit）或系统剩余可用内存低于内存警告水位线（WarningWaterMark）时触发 Minor GC，此时会优先 Cancel 内存超限比例最大的 Query。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory overcommit query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 2.12 GB exceed soft limit 2.71 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB. Execute again after enough memory, details see be.INFO.
```

错误信息解析：

`process memory used 3.12 GB exceed soft limit 6.02 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB` 进程内存超限的原因，此处是当前操作系统剩余可供 BE 使用的内存为 3.25 GB 低于 WarningWaterMark 6.40 GB, BE 进程使用的物理内存 2.12 GB 没有超过 2.71 GB 的 SoftMemLimit。

### 3 从 Allocator 申请内存失败

Doris BE 的大内存申请都会通过 `Doris Allocator` 分配，并在分配时检查内存大小，如果进程可用内存不足则会抛出异常和尝试 Cancel 当前 Query。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator sys memory check failed: Cannot alloc:4294967296, consuming tracker:<Query#Id=457efb1fdae74d3b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:<>, process memory used 2.23 GB exceed limit 3.01 GB or sys available memory 181.67 GB less than low water mark 3.20 GB.
```

错误信息解析：

1. `consuming tracker:<Query#Id=457efb1fdae74d3b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:VAGGREGATION_NODE (id=7)>`：当前被 Cancel 的 queryID，Query 当前使用了 386704704 Bytes 内存，Query 内存峰值为 405956032 Bytes，正在执行的算子为 `VAGGREGATION_NODE (id=7)>`。

2. `Cannot alloc:4294967296`: 当前申请 4 GB 内存时失败，因为当前进程内存 2.23 GB 加上 4 GB 将大于 3.01 GB 的 MemLimit。

## 被 Cancel 的 Query 自身内存过大

参考 [查询内存分析](./query-memory-analysis.md) 或 [导入内存分析](./load-memory-analysis.md) 分析查询和导入的内存使用，尝试调整参数或优化 SQL 来减少执行需要的内存。

需要注意的是，若任务从 Allocator 申请内存失败后被 Cancel，`Cannot alloc` 或 `try alloc` 显示 Query 当前正在申请的内存过大，此时需要关注此处的内存申请是否合理，在 `be/log/be.INFO` 搜索 `Allocator sys memory check failed` 可以找到申请内存的栈。

## 被 Cancel 的 Query 自身内存较小，有其他内存更大的 Query 存在

通常是因为内存更大的 Query 在 Cancel 阶段卡住，无法及时释放内存。Full GC 会先按照内存从大到小的顺序 Cancel Query，再按照内存从大到小的顺序 Cancel Load。若 Query 在内存 Full GC 中被 Cancel，但此时 BE 进程中存在其他 Query 的内存大于当前被 Cancel 的 Query，需要关注这些更大内存的 Query 是否在 Cancel 过程中卡住。

首先执行 `grep {queryID} be/log/be.INFO` 找到 Query 被 Cancel 的时间点，然后在上下文搜索 `Memory Tracker Summary` 找到进程内存统计日志，若 `Memory Tracker Summary` 中存在使用内存更大的 Query 存在。执行 `grep {更大内存的queryID} be/log/be.INFO` 确认是否有 `Cancel` 关键词的日志，对应时间点就是 Query 被 Cancel 的时间，若该 Query 同样被 Cancel，且这个更大内存的 Query 被 Cancel 的时间点和当前 Query 被 Cancel 的时间点不同，参考 [内存问题 FAQ](../../../trouble-shooting/memory-management/memory-issue-faq) 中 [Query Cancel 过程中卡住] 分析这个更大内存的 Query 是否在 Cacnel 过程中卡住。有关 `Memory Tracker Summary` 的分析参考 [内存日志分析](./memory-log-analysis.md)。

## 查询和导入任务之外的进程内存过大

尝试定位内存位置并考虑减少内存使用，保留更多的内存用于查询和导入执行。

任务因进程可用内存不足被 Cancel 的时间点可以在 `be/log/be.INFO` 中找到进程内存统计日志，执行 `grep queryID be/log/be.INFO` 找到 Query 被 Cancel 的时间点，然后在上下文搜索 `Memory Tracker Summary` 找到进程内存统计日志，然后参考 [内存日志分析](./memory-log-analysis.md) 中 [进程内存统计日志分析] 章节进一步分析。在分析前先参考 [内存跟踪器](./../memory-feature/memory-tracker.md) 中 [Memory Tracker 统计缺失] 章节分析 Memory Tracker 是否存在统计缺失。

若 Memory Tracker 存在统计缺失，则参考 [Memory Tracker 统计缺失] 章节进一步分析。否则 Memory Tracker 统计了大部分内存，不存在统计缺失，参考 [Overview](./../overview.md) 分析 Doris BE 进程不同部分内存占用过大的原因以及减少其内存使用的方法。
