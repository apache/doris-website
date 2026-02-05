---
{
    "title": "内存问题 FAQ",
    "language": "zh-CN",
    "description": "Doris BE 进程内存分析主要使用 be/log/be.INFO 日志、BE 进程内存监控 (Metrics)、Doris Bvar 统计，如果触发了 OOM Killer 需要收集 dmesg -T 执行结果，如果分析查询或导入任务的内存需要收集 Query Profile，"
}
---

Doris BE 进程内存分析主要使用 `be/log/be.INFO` 日志、BE 进程内存监控 (Metrics)、Doris Bvar 统计，如果触发了 OOM Killer 需要收集 `dmesg -T` 执行结果，如果分析查询或导入任务的内存需要收集 Query Profile，依据这些信息分析常见的内存问题。如果你自行分析无法解决问题，需要向 Doris 开发者们求助，无论使用何种途径（Github 提交 issue，Doris 论坛创建问题，邮件或 WeChat），都请将上述信息添加到你的问题描述中。

首先定位当前观察到的现象属于哪种内存问题，并进一步排查，通常需要先分析进程内存日志，参考 [内存日志分析](./memory-analysis/memory-log-analysis.md)，下面列举常见的内存问题。

## 1 查询和导入内存超限错误

当查询和导入的报错信息中出现 `MEM_LIMIT_EXCEEDED` 时，说明任务因为进程可用内存不足，或任务超过单次执行的内存上限而被 Cancel。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED] xxxx .
```

若报错信息包含 `Process memory not enough`，说明进程可用内存不足，参考 [查询或导入报错进程可用内存不足](./memory-analysis/query-cancelled-after-process-memory-exceeded.md) 进一步分析。

若报错信息中出现 `memory tracker limit exceeded` 时，说明任务超过单次执行内存限制，参考 [查询或导入报错超过单次执行内存限制](./memory-analysis/query-cancelled-after-query-memory-exceeded.md) 进一步分析。

## 2 Doris BE OOM Crash

如果 BE 进程 Crash 后 `log/be.out` 中没有报错信息，执行 `dmesg -T` 如果看到 `Out of memory: Killed process {pid} (doris_be)`，说明触发了 OOM Killer，参考 [OOM Killer Crash 分析](./memory-analysis/oom-crash-analysis.md) 进一步分析。

## 3 内存泄漏

> 如果遇到疑似内存泄漏的现象，最好的解决办法是升级到最新的三位数版本，如果你在用 Doris 2.0，就升级到 Doris 2.0.x 的最新版本，因为大概率其他人也遇到过同样的现象，大部分内存泄漏问题都在版本迭代中被修复。

如果观察到下面的现象，说明可能存在内存泄漏：

- Doris Grafana 或服务器监控发现 Doris BE 进程内存一直线性增长，且集群上任务停止后，内存也不下降。

- Memory Tracker 存在统计缺失，参考 [内存跟踪器](./memory-feature/memory-tracker.md) 中 [Memory Tracker 统计缺失] 章节分析。

内存泄漏通常都伴随着 Memory Tracker 统计缺失，所以分析方法同样参考 [Memory Tracker 统计缺失] 章节。

## 4 Doris BE 进程内存不下降 OR 持续上涨

如果 Doris Grafana 或服务器监控发现 Doris BE 进程内存一直线性增长，且集群上任务停止后，内存也不下降，首先参考 [内存跟踪器](./memory-feature/memory-tracker.md) 中 [Memory Tracker 统计缺失] 章节分析是否存在 Memory Tracker 统计缺失，若 Memory Tracker 存在统计缺失则进一步分析原因。

若 Memory Tracker 不存在统计缺失，统计到了大部分内存，参考 [Overview](./overview.md) 分析 Doris BE 进程不同部分内存占用过大的原因以及减少其内存使用的方法。

## 5 虚拟内存占用大

`Label=process virtual memory` Memory Tracker 显示实时的虚拟内存大小，和 `top -p {pid}` 看到的 Doris BE 进程虚拟内存相同。

```
MemTrackerLimiter Label=process virtual memory, Type=overview, Limit=-1.00 B(-1 B), Used=44.25 GB(47512956928 B), Peak=44.25 GB(47512956928 B)
```

Doris 目前仍存在 Doris BE 进程虚拟内存过大的问题，通常是因为 Jemalloc 保留了大量虚拟内存映射，这也将导致 Jemalloc Metadata 占用过多的内存，参考 [Jemalloc 内存分析](./memory-analysis/jemalloc-memory-analysis.md) 中对 Jemalloc Metadata 内存的分析。

除此之外已知 Doris 的 Join Operator 和 Column 中缺少内存复用，这会导致在某些场景申请更多的虚拟内存，并最终缓存到 Jemalloc Retained 中，目前没有很好的解决办法，建议定期重启 Doris BE 进程。

## 6 BE 进程刚启动后进程内存就很大

这通常是因为 BE 进程启动时加载的元数据内存过大，参考 [Metadata 内存分析](./memory-analysis/metadata-memory-analysis.md) 查看 Doris BE Bvar。

- 如果 `doris_total_tablet_num` 过多，通常是因为表的分区和分桶数量过多，查看 `{fe_host}:{fe_http_port}/System?path=//dbs` 找到 Tablet 数量多的表，一个表的 Tablet 数量等于其分区数量乘以分桶数量，尝试降低其分区和分桶数量。或者删除过时不会被使用的表或分区。

- 如果 `doris_total_rowset_num` 过多，但 Tablet 数量不多，参考 `SHOW-PROC` 文档找到 Rowset 多但 Tablet 不多的表，然后手动触发 Compaction，或者等自动 Compaction 完成，具体参考元数据管理相关文档，通常存在几十万个 Rowset 时，元数据占用几个 GB 是正常现象。

- 如果 `tablet_meta_schema_columns_count` 过大，是 `doris_total_tablet_schema_num` 的成百上千倍，说明集群中存在几百上千列的大宽表，此时相同数量的 Tablet 会占用更多的内存。

## 7 Query 没有复杂算子只是简单的 Scan 数据，却要使用很大的内存

可能是读取 Segment 时打开的 Column Reader、Index Read 占用的内存，参考 [Metadata 内存分析](./memory-analysis/metadata-memory-analysis.md) 查看 Doris BE Bvar 中的 `doris_total_segment_num`、`doris_column_reader_num`、`doris_ordinal_index_memory_bytes`、`doris_zone_map_memory_bytes`、`doris_short_key_index_memory_bytes`的变化，这个现象同样常见于读取大宽表，当打开几十万个 Column Reader 时，内存可能会占用几十 GB。

如果你在 Heap Profile 内存占比大的调用栈中看到 `Segment`，`ColumnReader` 字段，则基本可以确认是读取 Segment 时占用了大量内存。

此时只能通过修改 SQL 降低扫描的数据量，或者降低建表时指定的分桶大小，从而打开更少的 Segment。

## 8. Query Cancel 过程中卡住

> 常见于 Doris 2.1.3 之前

Query 执行期间申请的大部分内存需要等到查询结束时释放，在进程内存充足时通常无需关注查询结束阶段的快或慢，但在进程内存不足时经常会按照一定策略 Cancel 部分 Query，以释放它们的内存，避免进程触发 OOM Killer。此时如果 Query Cancel 过程中卡住，无法及时释放内存，除了会增大触发 OOM Killer 的风险，也可能会导致更多的 Query 因进程内存不足而被 Cancel。

若已知一个 Query 被 Cancel，下面依据这个 QueryID 分析其再 Cancel 过程中是否卡住。首先执行 `grep {queryID} be/log/be.INFO`，找到第一次包含 `Cancel` 关键词的日志，对应时间点就是 Query 被 Cancel 的时间。找到包含 `deregister query/load memory tracker` 关键词的日志，对应的时间点就是 Query Cancel 完成的时间，若最终触发了 OOM Killer，无法找到包含 `deregister query/load memory tracker` 关键词的日志，说明直到 OOM Killer 发生时这个 Query 仍没有 Cancel 完成，通常若 Query Cancel 过程的好时大于 3s，就任务这个 Query 在 Cancel 过程中卡住，需要进一步分析 Query 执行日志。

此外，在执行 `grep {queryID} be/log/be.INFO` 后，若看到包含 `tasks is being canceled and has not been completed yet` 关键词的日志，其后面的 QueryID 列表是表示 Memory GC 时发现这些 Query 正在被 Cancel 但没有 Cancel 完成，此时将跳过这些 Query，继续释放别处的内存，可据此判断 Memory GC 的行为是否符合预期。
