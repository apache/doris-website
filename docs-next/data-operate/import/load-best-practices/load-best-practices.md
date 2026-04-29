---
{
    "title": "导入最佳实践",
    "language": "zh-CN",
    "description": "Doris 数据导入最佳实践：表模型选择、分区分桶、攒批策略、Broker Load 与 Stream Load 并发调优，避免写放大与 OOM。",
    "keywords": [
        "Doris 导入最佳实践",
        "Stream Load 并发",
        "Broker Load 并发",
        "Group Commit 攒批",
        "Random 分桶",
        "Tablet 大小",
        "写放大",
        "Memtable OOM"
    ]
}
---

<!-- 知识类型: 操作建议 / 配置参数 -->
<!-- 适用场景: 数据导入设计 / 性能调优 / 故障预防 -->

本文汇总 Apache Doris 数据导入过程中的关键最佳实践，帮助你在表设计、批次划分、并发控制等环节做出合理选择，规避高频小导入、写放大、Memtable OOM 等常见问题。

## 快速导航

| 关注点 | 推荐做法 | 详情章节 |
| --- | --- | --- |
| 表模型 | 优先使用明细模型 | [表模型选择](#表模型选择) |
| 分区分桶 | 单 tablet 控制在 1–10 GB | [分区分桶配置](#分区分桶配置) |
| Random 分桶 | 开启 `load_to_single_tablet` 提升吞吐 | [Random 分桶导入优化](#random-分桶导入优化) |
| 高频小导入 | 客户端攒批 + Group Commit | [攒批导入](#攒批导入) |
| 单次导入分区数 | 控制少量分区，避免 Memtable 过多 | [分区导入](#分区导入) |
| 大数据量导入 | 分批导入，单批 ≤ 100 GB | [大规模数据分批导入](#大规模数据分批导入) |
| Broker Load 并发 | 拆分压缩/列存文件以并发 | [Broker Load 导入并发数](#broker-load-导入并发数) |
| Stream Load 并发 | 单 BE 并发不超过 128 | [Stream Load 并发导入](#stream-load-并发导入) |

## 表模型选择

建议优先考虑使用明细模型。明细模型在数据导入和查询性能方面相比其他模型都具有优势。

如需了解更多信息，请参考：[数据模型](../../table-design/data-model/intro)。

## 分区分桶配置

建议将单个 tablet 的大小控制在 **1–10 GB** 范围内：

-   **过小的 tablet**：可能导致聚合效果不佳，并增加元数据管理压力；
-   **过大的 tablet**：不利于副本迁移、补齐。

详细请参考：[数据分布](../../table-design/data-partitioning/basic-concepts)。

## Random 分桶导入优化

在使用 Random 分桶时，可以通过设置 `load_to_single_tablet` 为 `true` 来启用单分片导入模式。

该模式在大规模数据导入过程中具有以下收益：

-   提升数据导入的并发度和吞吐量；
-   减少写放大问题。

详细参考：[Random 分桶](../../table-design/data-partitioning/data-bucketing#random-分桶)。

## 攒批导入

针对高频小导入容易触发频繁 compaction、引发严重写放大的问题，建议结合客户端与服务端两种攒批方式：

| 攒批方式 | 适用场景 | 推荐做法 |
| --- | --- | --- |
| 客户端攒批 | 客户端可控的批量写入 | 在客户端将数据攒到 **数 MB 到数 GB** 大小后再发起导入 |
| 服务端攒批 | 高并发、小数据量导入 | 开启 [Group Commit](group-commit-manual.md)，由服务端完成批量提交 |

## 分区导入

每次导入建议只导入**少量分区**的数据。过多的分区同时导入会带来以下问题：

1.  增加内存占用，可能导致性能下降；
2.  Doris 每个 tablet 在内存中存在一个活跃的 Memtable，当活跃 Memtable 占用内存过高时，为避免进程 OOM 会被提前下刷；
3.  提前下刷会产生大量小文件，进一步影响导入性能。

为获得稳定的导入吞吐，应严格控制单次导入涉及的分区数量。

## 大规模数据分批导入

在文件数较多、数据量很大时，建议**分批进行导入**，以降低重试代价并减少对系统资源的冲击。

| 数据来源 | 推荐导入方式 | 单批数据量建议 |
| --- | --- | --- |
| HDFS / 对象存储等远端文件 | Broker Load | 单批 **不超过 100 GB** |
| 本地大数据量文件 | Doris streamloader 工具（自动分批） | 由工具自动控制 |

## Broker Load 导入并发数

不同文件类型对应的并发策略有所不同：

-   **压缩文件 / Parquet / ORC 文件**：建议将文件分割为多个小文件后导入，以实现多并发导入；
-   **非压缩 CSV 与 JSON 文件**：Doris 内部会自动切分文件并并发导入。

并发数策略请参考：[Broker Load 导入配置参数](./import-way/broker-load-manual#导入配置参数)。

## Stream Load 并发导入

Stream Load 的并发受 BE 端线程池参数限制，建议遵循以下阈值：

| 参数 / 阈值 | 推荐值 | 说明 |
| --- | --- | --- |
| 单 BE 并发数 | **不超过 128** | 由 BE 的 `webserver_num_workers` 参数控制；超出可能导致 webserver 线程不够用，影响导入性能 |
| 单 BE 并发数（强限制） | **不应超过 512** | 由 `doris_max_remote_scanner_thread_pool_thread_num` 参数控制；超过该值可能导致 BE 进程卡住 |

## FAQ

### 为什么高频小批量导入会显著影响性能？

高频小导入会导致 Doris 频繁进行 compaction，进而引发严重的写放大问题。建议在客户端攒批至数 MB 至数 GB，或开启 [Group Commit](group-commit-manual.md) 在服务端完成攒批。

### 为什么单次导入不要覆盖过多分区？

每个 tablet 在内存中持有一个活跃 Memtable。当活跃 Memtable 总占用内存过高时，会提前下刷以避免 OOM，从而生成大量小文件并降低导入性能。控制单次导入的分区数量可以缓解该问题。

### tablet 大小为何建议在 1–10 GB？

过小的 tablet 会削弱聚合效果并加重元数据管理压力；过大的 tablet 在副本迁移和补齐时成本更高。1–10 GB 是兼顾导入、查询与副本管理的经验区间。

### Stream Load 并发应如何设置？

单 BE 上的 Stream Load 并发建议不超过 128（受 `webserver_num_workers` 限制），且必须低于 512（受 `doris_max_remote_scanner_thread_pool_thread_num` 限制），否则可能造成 BE 进程卡住。

## Troubleshooting

| 现象 | 可能原因 | 处理建议 |
| --- | --- | --- |
| 导入吞吐低、compaction 频繁 | 高频小批量导入引发写放大 | 客户端攒批，或开启 [Group Commit](group-commit-manual.md) |
| 导入过程中产生大量小文件 | 单次导入覆盖分区过多，Memtable 提前下刷 | 减少单次导入涉及的分区数 |
| BE 进程卡住 | Stream Load 单 BE 并发超过 512 | 降低并发，调整 `doris_max_remote_scanner_thread_pool_thread_num` |
| webserver 线程不够用、Stream Load 慢 | 单 BE 并发超过 128 | 控制并发在 128 以内或调整 `webserver_num_workers` |
| Broker Load 并发低 | 单个压缩 / Parquet / ORC 文件过大且未拆分 | 将大文件拆分为多个小文件后再导入 |
| 单次 Broker Load 失败重试代价大 | 单批数据量过大 | 单批控制在 100 GB 以内并分批提交 |
