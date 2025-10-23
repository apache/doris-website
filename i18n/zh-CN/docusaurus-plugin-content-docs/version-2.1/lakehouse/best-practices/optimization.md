---
{
"title": "数据湖查询调优",
"language": "zh-CN"
}
---

本文档主要介绍在针对湖上数据（Hive、Iceberg、Paimon 等）查询的优化手段和优化策略。

## 分区裁剪

通过在查询中指定分区列条件，能够裁减掉不必要的分区，减少需要读取的数据量。

可以通过 `EXPLAIN <SQL>` 来查看 `XXX_SCAN_NODE` 的 `partition` 部分，可以查看分区裁剪是否生效，以及本次查询需要扫描多少分区。

如：

```
0:VPAIMON_SCAN_NODE(88)
    table: paimon_ctl.db.table
    predicates: (user_id[#4] = 431304818)
    inputSplitNum=15775, totalFileSize=951754154566, scanRanges=15775
    partition=203/0
```

## 本地数据缓存

数据缓存（Data Cache）通过缓存最近访问的远端存储系统（HDFS 或对象存储）的数据文件到本地磁盘上，加速后续访问相同数据的查询。

缓存功能默认是关闭的，请参阅 [数据缓存](../data-cache.md) 文档配置并开启。

## HDFS 读取优化

在某些情况下，HDFS 的负载较高可能导致读取某个 HDFS 上的数据副本的时间较长，从而拖慢整体的查询效率。HDFS Client 提供了 Hedged Read 功能。
该功能可以在一个读请求超过一定阈值未返回时，启动另一个读线程读取同一份数据，哪个先返回就是用哪个结果。

注意：该功能可能会增加 HDFS 集群的负载，请酌情使用。

可以通过以下方式开启这个功能：

```
create catalog regression properties (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://172.21.16.47:7004',
    'dfs.client.hedged.read.threadpool.size' = '128',
    'dfs.client.hedged.read.threshold.millis' = "500"
);
```

- `dfs.client.hedged.read.threadpool.size`：表示用于 Hedged Read 的线程数，这些线程由一个 HDFS Client 共享。通常情况下，针对一个 HDFS 集群，BE 节点会共享一个 HDFS Client。

- `dfs.client.hedged.read.threshold.millis`：是读取阈值，单位毫秒。当一个读请求超过这个阈值未返回时，会触发 Hedged Read。

开启后，可以在 Query Profile 中看到相关参数：

- `TotalHedgedRead`：发起 Hedged Read 的次数。

- `HedgedReadWins`：Hedged Read 成功的次数（发起并且比原请求更快返回的次数）

注意，这里的值是单个 HDFS Client 的累计值，而不是单个查询的数值。同一个 HDFS Client 会被多个查询复用。

## Merge IO 优化

针对 HDFS、对象存储等远端存储系统，Doris 会通过 Merge IO 技术来优化 IO 访问。Merge IO 技术，本质上是将多个相邻的小 IO 请求，合并成一个大 IO 请求，这样可以减少 IOPS，增加 IO 吞吐。

比如原始请求需要读取文件 `file1` 的 [0, 10] 和 [20, 50] 两部分数据：

```
Request Range: [0, 10], [20, 50]
```

通过 Merge IO，会合并成一个请求：

```
Request Range: [0, 50]
```

在这个示例中，两次 IO 请求合并为了一次，但同时也多读了一部分数据（10-20 之间的数据）。因此，Merge IO 在降低 IO 次数的同时，可能带来潜在的读放大问题。

通过 Query Profile 可以查看 MergeIO 的具体情况：

```
- MergedSmallIO:
    - MergedBytes: 3.00 GB
    - MergedIO: 424
    - RequestBytes: 2.50 GB
    - RequestIO: 65.555K (65555)
```

其中 `RequestBytes` 和 `RequestIO` 标识原始请求的数据量和请求次数。`MergedBytes` 和 `MergedIO` 标识合并和的请求数据量和请求次数。

如果发现 `MergedBytes` 数据量远大于 `RequestBytes`，则说明读放大比较严重，可以通过下面的参数调整修改：

- `merge_io_read_slice_size_bytes`

    会话变量，自 3.1.3 版本支持。默认为 8MB。如果发现读放大严重，可以将此参数调小，如 64KB。并观察修改后的 IO 请求和查询延迟是否有提升。