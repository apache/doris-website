---
{
    "title": "导入最佳实践",
    "language": "zh-CN",
    "description": "建议优先考虑使用明细模型, 明细模型在数据导入和查询性能方面相比其他模型都具有优势。如需了解更多信息，请参考：数据模型"
}
---

## 表模型选择 

建议优先考虑使用明细模型, 明细模型在数据导入和查询性能方面相比其他模型都具有优势。如需了解更多信息，请参考：[数据模型](../../table-design/data-model/overview)

## 分区分桶配置

建议一个 tablet 的大小在 1-10G 范围内。过小的 tablet 可能导致聚合效果不佳，增加元数据管理压力；过大的 tablet 不利于副本迁移、补齐。详细请参考：[数据分布](../../table-design/data-partitioning/data-distribution)。

## Random 分桶

在使用Random分桶时，可以通过设置load_to_single_tablet为true来启用单分片导入模式。这种模式在大规模数据导入过程中，能够提升数据导入的并发度和吞吐量，减少写放大问题。详细参考：[Random分桶](../../table-design/data-partitioning/data-bucketing#random-分桶)

## 攒批导入

客户端攒批‌：建议将数据在客户端进行攒批（数MB到数GB大小）后再进行导入，高频小导入会频繁做compaction，导致严重的写放大问题。
服务端攒批：对于高并发小数据量导入，建议打开[Group Commit](group-commit-manual.md)，在服务端实现攒批导入。

## 分区导入

每次导入建议只导入少量分区的数据。过多的分区同时导入会增加内存占用，并可能导致性能问题。Doris每个tablet在内存中有一个活跃的Memtable，每个Memtable达到一定大小时才会下刷到磁盘。为了避免进程OOM，当活跃的Memtable占用内存过高时，会提前触发Memtable下刷，导致产生大量小文件，同时会影响导入的性能。

## 大规模数据分批导入

需要导入的文件数较多、数据量很大时，建议分批进行导入，避免导入出错后重试代价太大，同时减少对系统资源的冲击。对 Broker Load 每批次导入的数据量建议不超过100G。对于本地的大数据量文件，可以使用Doris提供的streamloader工具进行导入，该工具会自动进行分批导入。

## Broker Load 导入并发数

压缩文件/Parquet/ORC文件‌：建议将文件分割成多个小文件进行导入，以实现多并发导入。 

非压缩的CSV和JSON文件‌：Doris内部会自动切分文件并并发导入。

并发数策略请参考：[Broker Load导入配置参数](./import-way/broker-load-manual#导入配置参数)

## Stream load并发导入

Stream load单BE上的并发数建议不超过128（由BE的webserver_num_workers参数控制）。过高的并发数可能导致webserver线程数不够用，影响导入性能。特别是当单个BE的并发数超过512（doris_max_remote_scanner_thread_pool_thread_num参数）时，可能会导致BE进程卡住。
