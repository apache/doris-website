---
{
    "title": "Compaction 优化",
    "language": "zh-CN",
    "description": "Doris 通过类似 LSM-Tree 的结构写入数据，在后台通过 Compaction 机制不断将小文件合并成有序的大文件，同时也会处理数据的删除、更新等操作。适当的调整 Compaction 的策略，可以极大地提升导入效率和查询效率。"
}
---

Doris 通过类似 LSM-Tree 的结构写入数据，在后台通过 Compaction 机制不断将小文件合并成有序的大文件，同时也会处理数据的删除、更新等操作。适当的调整 Compaction 的策略，可以极大地提升导入效率和查询效率。
Doris 提供如下几种 compaction 方式进行调优：


## Vertical compaction



:::note
自 Doris 1.2.2 版本起支持 Vertical compaction
:::

Vertical compaction 是 Doris 1.2.2 版本中实现的新的 Compaction 算法，用于解决大宽表场景下的 Compaction 执行效率和资源开销问题。可以有效降低 Compaction 的内存开销，并提升 Compaction 的执行速度。

实际测试中，Vertical compaction 使用内存仅为原有 compaction 算法的 1/10，同时 compaction 速率提升 15%。

Vertical compaction 中将按行合并的方式改变为按列组合并，每次参与合并的粒度变成列组，降低单次 compaction 内部参与的数据量，减少 compaction 期间的内存使用。

开启和配置方法 (BE 配置)：
- `enable_vertical_compaction = true` 可以开启该功能

- `vertical_compaction_num_columns_per_group = 5` 每个列组包含的列个数，经测试，默认 5 列一组 compaction 的效率及内存使用较友好

- `vertical_compaction_max_segment_size` 用于配置 vertical compaction 之后落盘文件的大小，默认值 268435456(字节)


## Segment compaction
Segment compaction 主要应对单批次大数据量的导入场景。和 Vertical compaction 的触发机制不同，Segment compaction 是在导入过程中，针对一批次数据内，多个 Segment 进行的合并操作。这种机制可以有效减少最终生成的 Segment 数量，避免 -238（OLAP_ERR_TOO_MANY_SEGMENTS）错误的出现。
Segment compaction 有以下特点：

- 可以减少导入产生的 segment 数量

- 合并过程与导入过程并行，不会额外增加导入时间

- 导入过程中的内存和计算资源的使用量会有增加，但因为平摊在整个导入过程中所以涨幅较低

- 经过 Segment compaction 后的数据在进行后续查询以及标准 compaction 时会有资源和性能上的优势

开启和配置方法 (BE 配置)：

- `enable_segcompaction = true` 可以使能该功能

- `segcompaction_batch_size` 用于配置合并的间隔。默认 10 表示每生成 10 个 segment 文件将会进行一次 segment compaction。一般设置为 10 - 30，过大的值会增加 segment compaction 的内存用量。

如有以下场景或问题，建议开启此功能：

- 导入大量数据触发 OLAP_ERR_TOO_MANY_SEGMENTS (errcode -238) 错误导致导入失败。此时建议打开 segment compaction 的功能，在导入过程中对 segment 进行合并控制最终的数量。

- 导入过程中产生大量的小文件：虽然导入数据量不大，但因为低基数数据，或因为内存紧张触发 memtable 提前下刷，产生大量小 segment  文件也可能会触发 OLAP_ERR_TOO_MANY_SEGMENTS 导致导入失败。此时建议打开该功能。

- 导入大量数据后立即进行查询：刚导入完成、标准 compaction 还没有完成工作时，此时 segment 文件过多会影响后续查询效率。如果用户有导入后立即查询的需求，建议打开该功能。

- 导入后标准 compaction 压力大：segment compaction 本质上是把标准 compaction 的一部分压力放在了导入过程中进行处理，此时建议打开该功能。

不建议使用的情况：
- 导入操作本身已经耗尽了内存资源时，不建议使用 segment compaction 以免进一步增加内存压力使导入失败。

关于 segment compaction 的实现和测试结果可以查阅[此链接](https://github.com/apache/doris/pull/12866)。


## 单副本 compaction

:::caution 已废弃
单副本 compaction 功能已废弃，并自 Doris 4.1.2 版本起移除。原因是其对端副本的选择存在数据正确性风险：拉取 compaction 结果的副本需要基于周期性刷新的副本信息来选择拉取的对象和版本，而各副本的版本推进又相互独立，这一选择可能基于过期的集群状态做出，从而引发难以察觉的数据不一致。不建议开启该功能。`enable_single_replica_compaction` 属性在 Doris 4.x 中已被删除。
:::

默认情况下，多个副本的 compaction 是独立进行的，每个副本在都需要消耗 CPU 和 IO 资源。开启单副本 compaction 后，在一个副本进行 compaction 后，其他几个副本拉取 compaction 后的文件，因此 CPU 资源只需要消耗 1 次，节省了 N - 1 倍 CPU 消耗（N 是副本数）。

单副本 compaction 在表的 PROPERTIES 中通过参数 `enable_single_replica_compaction` 指定，默认为 false 不开启，设置为 true 开启。

该参数可以在建表时指定，或者通过 `ALTER TABLE table_name SET("enable_single_replica_compaction" = "true")` 来修改。

## Compaction 策略

Compaction 策略决定什么时候将哪些小文件合并成大文件。Doris 当前提供了 2 种 compaction 策略，通过表属性的 `compaction_policy` 参数指定。

### size_based compaction 策略

size_based compaction 策略是默认策略，对大多数场景适用。

```
"compaction_policy" = "size_based"
```

### time_series compaction 策略

time_series compaction 策略是为日志、时序等场景优化的策略。它利用时序数据具有时间局部性的特点，将相邻时间写入的小文件合并成大文件，每个文件只会参与一次 compaction 就合并成比较大的文件，减少反复 compaction 带来的写放大。

```
"compaction_policy" = "time_series"
```

time_series compaction 策略在下面 3 个条件任意一个满足的时候触发小文件合并：
- 未合并的文件大小超过 `time_series_compaction_goal_size_mbytes` (默认 1GB)
- 未合并的文件个数超过 `time_series_compaction_file_count_threshold` (默认 2000)
- 距离上次合并的时间超过 `time_series_compaction_time_threshold_seconds` (默认 1 小时)

上述参数在表的 PROPERTIES 中设置，可以在建表时指定，或者通过 `ALTER TABLE table_name SET("name" = "value")` 修改。


## Compaction 并发控制

Compaction 在后台执行需要消耗 CPU 和 IO 资源，可以通过控制 compaction 并发线程数来控制资源消耗。

compaction 并发线程数在 BE 的配置文件中配置，包括下面几个：
- `max_base_compaction_threads`：base compaction 的线程数，默认是 4
- `max_cumu_compaction_threads`：cumulative compaction 的线程数，默认是 -1，表示每块盘 1 个线程
- `max_single_replica_compaction_threads`：单副本 compaction 拉取数据文件的线程数，默认是 10

## MOW 大 Tablet 的 Compaction 内存开销 {#mow-compaction-memory}

Unique Key 模型的写时合并（Merge-on-Write，MOW）表在执行 Compaction 时，需要在内存中维护行号转换映射（rowid conversion map），将输入 Rowset 中的行位置对应到输出 Rowset 中的新位置，以便更新 delete bitmap。对于行数较多的 Tablet，尤其是包含大量历史数据的 Base Compaction，这部分内存可能很大，导致 Compaction 因内存不足而失败。

### 内存如何随行数增长

该映射为参与合并的输入 Segment 中的每一条物理行预分配一个槽位，记录目标 Segment 的位置和目标行号。每个槽位包含两个 32 位整数，主体约占 8 字节，因此可以按以下公式估算：

```text
映射主体内存 ≈ 本次参与合并的输入物理行数之和 × 8 字节
```

输入物理行数包括尚未通过 Compaction 清理的历史版本。即使某条旧行已被标记删除、最终不会写入输出 Rowset，预分配的槽位仍然占用内存，因此不能直接用查询返回的有效行数来估算。该映射会保留到 Compaction 任务结束，不会随着每个读取批次的完成而释放。

这只是映射主体的估算值，实际 Compaction 还需要容器、读取缓冲、写入缓冲和索引等内存。Tablet 的压缩后数据大小与物理行数没有固定比例，窄表或压缩率较高的表，即使磁盘体积不大，也可能产生较大的映射。

### 计算示例

假设某个 MOW Tablet 的 Base Rowset 包含 10 亿条物理行，本次 Base Compaction 还需要合并包含 1 亿条物理行的增量 Rowset。即使这 1 亿条增量全部更新已有 Key，最终只输出 10 亿条有效记录，映射仍需要按输入的 11 亿条物理行分配：

```text
本次输入物理行数 = 10 亿 + 1 亿 = 11 亿
映射主体内存 ≈ 11 亿 × 8 字节 = 8.8 × 10^9 字节 ≈ 8.2 GiB
```

如果同一 BE 同时运行 4 个输入规模相同的 Compaction 任务，仅这些映射的主体就约占 32.8 GiB，尚未包含其他 Compaction 内存及查询、导入等任务的内存。以上为计算示例，实际占用取决于各任务的输入规模和并发情况。

### 排查和处理建议

- 建表或新增分区时，除压缩后数据大小外，还应根据预计行数合理设置分区、分桶，并选择分布均匀的分桶键，避免单个 Tablet 积累过多行。参见[数据分桶](../../table-design/data-partitioning/data-bucketing.md)。已有分区的分桶数不能直接修改，处理已有超大 Tablet 时需评估重建表并迁移数据的方案。
- 内存紧张时，可适当降低 Base Compaction 并发，为单个任务保留更多可用内存。降低并发只能减少同一 BE 上多个任务叠加的内存峰值，不能减小单个任务的映射；如果单个映射本身已超过可用内存，仅降低并发仍可能失败。
- Vertical Compaction、较小的 `compaction_batch_size` 或较少的 `vertical_compaction_num_columns_per_group` 可以降低读取和列组处理的内存，但不能减少完整行号映射的大小。`compaction_memory_bytes_limit` 用于估算读取批次大小，并非行号映射或整个 Compaction 任务的内存硬上限。
