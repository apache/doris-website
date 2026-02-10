---
{
    "title": "元数据内存分析",
    "language": "zh-CN",
    "description": "Doris BE 在内存中的元数据（Metadata）包括 Tablet、Rowset、Segment、TabletSchema、ColumnReader、PrimaryKeyIndex、BloomFilterIndex 等数据结构，"
}
---

Doris BE 在内存中的元数据（Metadata）包括 `Tablet`、`Rowset`、`Segment`、`TabletSchema`、`ColumnReader`、`PrimaryKeyIndex`、`BloomFilterIndex` 等数据结构，有关 Doris BE 元数据的更多介绍参考文档 [Doris 存储结构设计解析](https://blog.csdn.net/ucanuup_/article/details/115004829)。

## Metadata 查看方法

目前 Memory Tracker 没有准确统计 Doris BE 的元数据内存大小，通过查看 Doris BE Bvar 和 Doris BE Metrics 中的一些 Counter 去估算元数据内存大小，或者使用 Heap Profile 进一步分析。

### Doris BE Bvar

Web 页面 `http://{be_host}:{brpc_port}/vars` 可以看到 Bvar 统计的一些元数据相关指标。

```
- `doris_total_tablet_num`：所有 Tablet 的数量。
- `doris_total_rowset_num`：所有 Rowset 的数量。
- `doris_total_segment_num`：所有打开的 Segment 数量。
- `doris_total_tablet_schema_num`：所有 Tablet Schema 的数量。
- `tablet_schema_cache_count`：Tablet Schema 被 Cache 的数量。
- `tablet_meta_schema_columns_count`：所有 Tablet Schema 中 Column 的数量。
- `tablet_schema_cache_columns_count`：Tablet Schema 中 Column 被 Cache 的数量。
- `doris_column_reader_num`：打开的 Column Reader 数量。
- `doris_column_reader_memory_bytes`：打开的 Column Reader 占用内存的字节数。
- `doris_ordinal_index_memory_bytes`：打开的 Ordinal Index 占用内存的字节数。
- `doris_zone_map_memory_bytes`：打开的 ZoneMap Index 占用内存的字节数。
- `doris_short_key_index_memory_bytes`：打开的 Short Key Index 占用内存的字节数。
- `doris_pk/index_reader_bytes`：累计的 Primary Key Index Reader 占用内存的字节数，这不是实时的统计值，期待被修复。
- `doris_pk/index_reader_pages`：同上，统计的累计值。
- `doris_pk/index_reader_cached_pages`：同上，统计的累计值。
- `doris_pk/index_reader_pagindex_reader_pk_pageses`：同上，统计的累计值。
- `doris_primary_key_index_memory_bytes`：同上，统计的累计值。
```

### Doris BE Metrics

Web 页面 `http://{be_host}:{be_web_server_port}/metrics` 可以看到 BE 进程内存监（Metrics）中的一些元数据指标。其中 Metadata Cache 相关指标参考 [Cache 内存分析](./doris-cache-memory-analysis.md)。

```
- `doris_be_all_rowsets_num`：所有 Rowset 的数量。
- `doris_be_all_segments_num`：所有 Segment 数量。
```

### 使用 Heap Profile 分析元数据内存

如果上面使用 Doris BE Bvar 和 Metrics 无法准确定位内存位置，若集群方便重启，并且现象可以被复现，参考 [Heap Profile 内存分析](./heap-profile-memory-analysis.md) 分析 Metadata 内存。

现象复现后，如果你在 Heap Profile 内存占比大的调用栈中看到 `Tablet`， `Segment`，`TabletSchema`、`ColumnReader` 字段，则基本可以确认是元数据占用了大量内存。
