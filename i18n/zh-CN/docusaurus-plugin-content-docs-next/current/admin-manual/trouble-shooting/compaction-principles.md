---
{
    "title": "Compaction 原理",
    "language": "zh-CN",
    "description": "Apache Doris 基于 LSM-Tree 的存储引擎，在数据写入时会顺序追加到新的数据文件中，而不是直接更新原有文件。 这种设计保证了高效的写入性能，但随着时间推移，不同版本、不同大小的数据文件会不断累积，带来以下问题："
}
---

## 1 compaction 的作用

Apache Doris 基于 LSM-Tree 的存储引擎，在数据写入时会顺序追加到新的数据文件中，而不是直接更新原有文件。
 这种设计保证了高效的写入性能，但随着时间推移，不同版本、不同大小的数据文件会不断累积，带来以下问题：
- 查询性能下降：查询时需要在多个文件间做多路归并排序；
- 存储空间浪费：存在过期待删除或重复的数据。
Compaction（数据压缩整理） 正是解决上述问题的关键机制。它会在后台自动合并和重写数据文件，将相同主键或相邻范围的数据聚合到更少、更有序的文件中，并清理已删除或过期的数据。
这样既能保持查询的高性能，也能优化存储空间利用率。
 在 Doris 中，Compaction 是一个 持续且自动运行 的过程，用户无需手动触发。但理解其原理和运行状态，有助于在高并发和大数据量场景下进行性能调优。

### 1.1 提升查询性能

Doris 的数据导入机制是：每次导入会在目标分区的每个 tablet 上生成一个 rowset。
- 每个 rowset 包含 0 到 n 个 segment；
- 每个 segment 对应磁盘上的一个有序文件。
在查询时，存储层需要返回聚合或去重后的结果，因此会对多个 rowset/segment 的数据执行 多路归并排序。
 随着 rowset 数量增加，归并的路数也会增加，从而导致查询效率下降。
Compaction 的作用：
 BE 节点在后台持续合并这些 rowset，减少归并路数，从而提升查询效率。
 Compaction 的执行粒度是 tablet。

### 1.2 清理数据

Compaction 除了提升性能，还承担着数据清理的职责：
1. 清理标记删除的数据
  - Doris 的 DELETE 操作并不会立即删除数据，而是生成一个 delete rowset（仅包含删除谓词，不存储实际数据），在 Compaction 过程中，会根据这些谓词过滤并真正删除符合条件的数据。
  - 对于 Merge-on-Write 类型的表，delete sign 标记的数据也会在 Compaction 阶段被清理。
2. 删除重复数据
  - Aggregate 模型：对相同 key 的行进行聚合；
  - Unique 模型：仅保留相同 key 的最新数据。
这样既能保证数据正确性，又能减少存储空间占用。

## 2. 关键概念

### 2.1 Compaction Score

Compaction Score 是衡量 tablet 数据乱序程度 的指标，同时也是判断 Compaction 优先级的依据。
 它等价于执行查询时该 tablet 需要参与多路归并的路数。
- Score 越高，查询开销越大；
- 因此 Compaction 会优先处理 Score 较高的 tablet。
示例：
"rowsets": [
        "[0-100] 3 DATA NONOVERLAPPING 0200000000001c30804822f519cf378fbe6f162b7de393a6 500.32 MB",
        "[101-101] 2 DATA OVERLAPPING 02000000000021d0804822f519cf378fbe6f162b7de393a6 180.46 MB",
        "[102-102] 1 DATA NONOVERLAPPING 0200000000002211804822f519cf378fbe6f162b7de393a6 50.59 MB"
 ]
- [0-100] 的 rowset 有 3 个 segment，但无重叠 → 占 1 路；
- [101-101] 的 rowset 有 2 个 segment，存在重叠 → 占 2 路；
- [102-102] 的 rowset 占 1 路。
因此该 tablet 的 Compaction Score = 4。

### 2.2 Compaction 类型

- Cumulative Compaction：合并小的增量 rowset，提升合并效率；
- Base Compaction：将某个 rowset 之前的所有 rowset 合并为一个新的 rowset；
- Full Compaction：合并所有 rowset；
- Cumulative Point：划分 Base 与 Cumulative Compaction 的边界点。
理想策略是：先通过 Cumulative Compaction 合并小 rowset，累积到一定规模后再进行 Base Compaction。

## 3. Compaction 策略

### 3.1 Tablet 选择策略

Compaction 的目标是提升查询性能，因此优先选择 Compaction Score 最高的 tablet 进行处理。

### 3.2 Rowset 选择策略

在确定了目标 tablet 后，还需要选择合适的 rowset 进行 Compaction。原则是：
- 在尽量降低 Compaction Score 的同时，减少计算量；
- 控制写放大比例；
- 避免占用过多系统资源。
主要考虑因素：
1. 性价比
  - Cumulative Compaction：参与合并的 rowset 大小不能相差过大，最大 rowset 的大小 ≤ 总量的一半；
  - Base Compaction：Base rowset 与其他候选 rowset 的比例 ≥ 0.3 才会触发。
2. 写放大控制
  - Cumulative Compaction：
    - 候选 rowset 的 Score > 5 才会触发；
    - 数据量超过 promotion size 才会触发。
  - Base Compaction：候选 rowset 的 Score > 5 才会触发。
3. 系统资源控制
  - 单次 Cumulative Compaction 的 rowset 数量 ≤ 1000；
  - 单次 Base Compaction 的 rowset 数量 ≤ 20。

## 4. Compaction 流程

![compaction_workflow](/images/compaction_workflow.png)

Compaction 的执行流程采用 生产者-消费者模型：
1. Tablet 扫描与任务生成
  - Compaction 任务生产者线程定期扫描所有 tablet，计算其 Compaction Score；
  - 每轮从每个磁盘中选出 Score 最高的 tablet；
  - 每 10 轮选择一次 Base Compaction，其余 9 轮为 Cumulative Compaction。
2. 并发控制
  - 判断当前磁盘的 Compaction 任务数是否超过配置上限；
  - 若未超限，则允许该 tablet 进入 Compaction。
3. Rowset 挑选
  - 选择连续且大小差距不大的 rowset 作为输入；
  - 避免因数据量悬殊导致多路归并效率低下。
4. 任务提交
  - 将 tablet 和候选 rowset 封装为 Compaction Task；
  - 根据任务类型（Base / Cumulative）提交到对应线程池队列。
5. 任务执行
  - Compaction 线程池从队列中取出任务；
  - 执行多路归并排序，将多个 rowset 合并为一个新的 rowset。

### 5. Compaction 常见参数
 
|参数名 |含义| 默认值|
|---    |--- |---    |
| tive_compaction_rounds_for_each_base_compaction_round | 每产生多少轮 cumulative compaction task 后产生一次 base compaction task，通过调节这个参数，可以调整 cumulative compaction task 和 base compaction task 的比例 | 9 |
| compaction_task_num_per_fast_disk | 每块 SSD 盘上，最多可以有多少个并发的 compaction task | 8 |
| compaction_task_num_per_disk | 每块 HDD 盘上，最多可以有多少个并发的 compaction task | 4 |
| max_base_compaction_threads | Base compaction 线程池的工作线程数 | 4 |
| max_cumu_compaction_threads | Cumulative compaction 线程池的工作线程数，-1 表示根据磁盘数量决定线程池的数量，每块盘一个线程 | -1 |
| base_compaction_min_rowset_num | 触发 base compaction 的条件，当通过 rowset 的数量触发 compaction 时，满足做 base compaction 的 rowset 数量下限 | 5 |
| base_compaction_max_compaction_score | 一次 base compaction 中，参与 compaction 的 rowset 的 compaction score 的上限 | 20 |
| cumulative_compaction_min_deltas | 一次 cumulative compaction 中，参与 compaction 的 rowset 的 compaction score 的下限 | 5 |
| cumulative_compaction_max_deltas | 一次 cumulative compaction 中，参与 compaction 的 rowset 的 compaction score 的上限 | 1000 |
 


















