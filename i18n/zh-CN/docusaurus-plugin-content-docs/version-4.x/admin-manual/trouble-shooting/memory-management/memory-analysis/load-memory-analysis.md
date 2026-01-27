---
{
    "title": "导入内存分析",
    "language": "zh-CN",
    "description": "Doris 数据导入分为 Fragment 读取和 Channel 写入两个阶段，其中 Fragment 和查询的 Fragment 执行逻辑相同，不过 Stream Load 通常只有 Scan Operator。Channel 主要将数据写入临时的数据结构 Memtable，"
}
---

Doris 数据导入分为 Fragment 读取和 Channel 写入两个阶段，其中 Fragment 和查询的 Fragment 执行逻辑相同，不过 Stream Load 通常只有 Scan Operator。Channel 主要将数据写入临时的数据结构 Memtable，然后 Delta Writer 将数据压缩后写入文件。

## 导入内存查看

如果任何地方看到 `Label=load, Type=overview` Memory Tracker 的值较大，说明导入内存使用多。

```
MemTrackerLimiter Label=load, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

Doris 导入的内存分为两部分，第一部分是 Fragment 执行使用的内存，第二部分是 MemTable 的构造和下刷过程中使用的内存。

在 BE web 页面 `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` 中找到 `Label=AllMemTableMemory, Parent Label=DetailsTrackerSet` 的 Memory Tracker 是这台 BE 结点上所有导入任务构造和下刷 `MemTable` 使用的内存。报错进程内存超限或可用内存不足时，在 `be.INFO` 日志中 `Memory Tracker Summary` 也可以找到这个 Memory Tracker。

```
MemTracker Label=AllMemTableMemory, Parent Label=DetailsTrackerSet, Used=25.08 MB(26303456 B), Peak=25.08 MB(26303456 B)
```

## 导入内存分析

如果 ``Label=AllMemTableMemory` 的值很小，则导入任务主要使用内存的位置是执行 Fragment，分析方式和 [查询内存分析](./query-memory-analysis.md) 相同，此处不再赘述。

如果 `Label=AllMemTableMemory` 的值很大，则可能 MemTable 下刷不及时，可以考虑减小 `be.conf` 中 `load_process_max_memory_limit_percent` 和 `load_process_soft_mem_limit_percent` 的值，这可以让 MemTable 更频繁的下刷，从而在内存中缓存的 MemTable 更少，但写入的文件数量会变多，如果写入了太多的小文件会增加 Compaction 的压力，如果 Compaction 不及时将导致元数据内存变大，查询变慢，甚至文件数量超出限制后导入将报错。

在导入执行过程中查看 BE Web 页面 `/mem_tracker?type=load`，依据 `Label=MemTableManualInsert` 和 `Label=MemTableHookFlush` 两组 Memory Tracker 的值，可以定位 `MemTable` 内存使用大的 `LoadID` 和 `TabltID`。
