---
{
    "title": "查询报错 Memory Tracker Limit Exceeded",
    "language": "zh-CN",
    "description": "当查询或导入的报错信息中出现 MEMLIMITEXCEEDED 且包含 memory tracker limit exceeded 时，说明任务超过单次执行内存限制。"
}
---

当查询或导入的报错信息中出现 `MEM_LIMIT_EXCEEDED` 且包含 `memory tracker limit exceeded` 时，说明任务超过单次执行内存限制。

## 错误信息解析

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED]failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB. backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can `set exec_mem_limit=8G` to change limit, details see be.INFO.
```

错误信息分为两部分：

1. `failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB`：当前正在执行 Query `f78208b15e064527-a84c5c0b04c04fcf` 在尝试申请 1.03 MB 内存的过程中发现查询超过单次执行的内存上限，查询内存上限是 100 MB（Session Variables 中的 `exec_mem_limit`），当前已经使用 99.25 MB，内存峰值是 99.29 MB。

2. `backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can set exec_mem_limit=8G to change limit, details see be.INFO.`：本次内存申请的位置是`VHASH_JOIN_NODE (id=4)`，并提示可通过 `set exec_mem_limit` 来调高单次查询的内存上限。

## 单次执行内存限制和内存超发

`show variables;` 可以查看 Doris Session Veriable，其中的 `exec_mem_limit` 是单次查询和导入的执行内存限制，但从 Doris 1.2 开始支持查询内存超发 (overcommit)，旨在允许查询设置更灵活的内存限制，内存充足时即使查询内存超过上限也不会被 Cancel，所以通常用户无需关注查询内存使用。直到内存不足时，查询会在尝试分配新内存时等待一段时间，此时会基于一定规则优先 Cancel `mem_used` 与 `exec_mem_limit` 比值大的 Query。如果等待过程中内存释放的大小满足需求，查询将继续执行，否则将抛出异常并终止查询。

如果希望关闭查询内存超发，参考 [BE 配置项](../../../config/be-config)，在 `conf/be.conf` 中增加 `enable_query_memory_overcommit=false`，此时单次查询和导入的内存超过 `exec_mem_limit` 即会被 Cancel。如果你希望避免大查询对集群稳定性造成的负面影响，或者希望准确控制集群上的任务执行来保证足够的稳定性，那么可以考虑关闭查询内存超发。

## 查询内存分析

如果需要分析查询的内存使用，参考 [查询内存分析](./query-memory-analysis.md)。

`set enable_profile=true` 开启 Query Profile 后，在任务超过单次执行的内存上限时，在 `be/log/be.INFO` 将打印查询正在申请内存的调用栈，并可以看到查询每个算子当前使用的内存和峰值，参考 [内存日志分析](./memory-log-analysis.md) 分析 `Process Memory Summary` 和 `Memory Tracker Summary`，帮助确认当前查询内存使用是否符合预期。

```sql
Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED]failed alloc size 32.00 MB, memory tracker limit exceeded, tracker label:Query#I
d=41363cb6ba734ad5-bc8720bdf9b3090d, type:query, limit 100.00 MB, peak used 75.32 MB, current used 72.62 MB. backend 10.16.10.8, process memory used 2.33 GB. exec node:<>, can `set exec_mem_limit=8G`
 to change limit, details see be.INFO.
Process Memory Summary:
    os physical memory 375.81 GB. process memory used 2.33 GB(= 2.60 GB[vm/rss] - 280.53 MB[tc/jemalloc_cache] + 0[reserved] + 0B[waiting_refresh]), limit 338.23 GB, soft limit 304.41 GB. sys availab
le memory 337.33 GB(= 337.33 GB[proc/available] - 0[reserved] - 0B[waiting_refresh]), low water mark 6.40 GB, warning water mark 12.80 GB.
Memory Tracker Summary:    MemTrackerLimiter Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Type=query, Limit=100.00 MB(104857600 B), Used=72.62 MB(76146688 B), Peak=75.32 MB(78981248 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=122.00 B(122 B), Peak=122.00 B(122 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=384.00 B(384 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=384.00 B(384 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=21.73 MB(22790276 B), Peak=21.73 MB(22790276 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=2.23 MB(2342912 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=2.23 MB(2342912 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=24.03 MB(25201284 B), Peak=24.03 MB(25201284 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=1.08 MB(1130496 B), Peak=7.17 MB(7520256 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=1.08 MB(1130496 B), Peak=7.17 MB(7520256 B)
```
