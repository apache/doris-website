---
{
    "title": "TOPN 查询优化：ORDER BY LIMIT 加速原理与配置",
    "language": "zh-CN",
    "description": "Doris 如何加速 ORDER BY LIMIT 查询？本文介绍 TOPN 优化原理、适用限制、Session 参数、执行计划检查方法，以及存算分离场景下延迟物化第二阶段的 File Cache 策略。",
    "keywords": ["Doris TOPN 优化", "ORDER BY LIMIT 加速", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "两阶段读取", "File Cache", "RuntimePredicate", "Zonemap 过滤"]
}
---

<!-- 知识类型：概念 + 配置 + 排查 -->
<!-- 适用场景：日志检索、明细查询、排序分页 -->

## 一句话定义

TOPN 查询优化是 Doris 针对 `ORDER BY ... LIMIT n` 类查询的自动加速能力，通过动态过滤、范围裁剪和延迟物化大幅减少扫描与排序开销。

## 阅读前 Checklist

- [ ] 我的 SQL 形如 `SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n`
- [ ] 表类型是 Duplicate 表或 Unique MOW 表（非 MOR）
- [ ] `n` 不大（小于 `topn_opt_limit_threshold`，默认 1024）
- [ ] 期望通过 EXPLAIN 与 Profile 验证优化是否生效

## 典型 SQL 形态

TOPN 查询常见于日志检索等明细场景，Doris 会自动识别并优化：

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- 知识类型：原理 -->
<!-- 适用场景：理解 Doris 内部如何加速 ORDER BY LIMIT -->

## 三大优化点

| 编号 | 优化点 | 原理简述 | 关键收益 |
| :--- | :--- | :--- | :--- |
| 优化 1 | 动态范围过滤（RuntimePredicate） | 排序过程中动态构建排序列范围条件（如 `c1 >= 10000`），下推到扫描 | 利用 Zonemap 索引过滤大量数据甚至整段文件 |
| 优化 2 | Key 前缀短路读取 | 排序字段 `c1, c2` 正好是 Table Key 的前缀时，仅读取数据文件的头部或尾部 n 行 | 大幅减少磁盘读取 |
| 优化 3 | 两阶段延迟物化 | 第一阶段只读排序列完成排序，得到行号后第二阶段再读其它列 | 显著减少需要读取和排序的列数 |

<!-- 知识类型：限制 -->
<!-- 适用场景：判断当前查询能否享受 TOPN 优化 -->

## 适用限制

1. **表类型限制**：仅支持 Duplicate 表和 Unique MOW 表。Unique MOR 表使用此优化可能导致结果错误。
2. **n 值限制**：`n` 过大时优化的内存消耗会显著上升。超过 Session 变量 `topn_opt_limit_threshold` 的 `n` 不会启用优化。

<!-- 知识类型：配置 -->
<!-- 适用场景：调优或关闭 TOPN 优化 -->

## 配置参数

以下四个参数均为 Session Variable，可针对单条 SQL 设置或全局设置。

| 参数 | 默认值 | 作用 | 调优建议 |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | LIMIT n 小于该值才启用 TOPN 优化 | 设为 `0` 可关闭整个 TOPN 优化 |
| `enable_two_phase_read_opt` | true | 是否启用优化 3（两阶段延迟物化） | 设为 `false` 可单独关闭优化 3 |
| `topn_filter_ratio` | 0.5 | LIMIT n 与表总数据的比率阈值 | 当 LIMIT 数量超过表数据一半时不再生成 filter |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | 在存算分离模式下，控制 Doris 内表的延迟物化第二阶段是否在 File Cache miss 时跳过缓存回写 | 仅在第二阶段读取的数据复用率低、容易污染缓存时开启 |

<!-- 知识类型：操作 -->
<!-- 适用场景：验证 TOPN 优化是否启用 -->

## 检查 TOPN 优化是否启用

**目的**：通过执行计划判断当前 SQL 启用了哪些优化点。

**命令**：

```sql
EXPLAIN <your_sql>;
```

**说明**：在 Query Plan 中关注以下标记：

- `TOPN OPT` —— 启用了 **优化 1**（动态范围过滤）
- `VOlapScanNode` 下出现 `SORT LIMIT` —— 启用了 **优化 2**（Key 前缀短路读取）
- `MaterializeNode`（或旧执行计划中的 `OPT TWO PHASE`）—— 启用了 **优化 3**（两阶段延迟物化）

**示例**：

```sql
  1:VTOP-N(137)
  |  order by: @timestamp18 DESC
  |  TOPN OPT
  |  OPT TWO PHASE
  |  offset: 0
  |  limit: 10
  |  distribute expr lists: applicationName5
  |
  0:VOlapScanNode(106)
     TABLE: log_db.log_core_all_no_index(log_core_all_no_index), PREAGGREGATION: ON
     SORT INFO:
          @timestamp18
     SORT LIMIT: 10
     TOPN OPT:1
     PREDICATES: ZYCFC-TRACE-ID4 like '%flowId-1720055220933%'
     partitions=1/8 (p20240704), tablets=250/250, tabletList=1727094,1727096,1727098 ...
     cardinality=345472780, avgRowSize=0.0, numNodes=1
     pushAggOp=NONE
```

<!-- 知识类型：配置 + 操作 + 排查 -->
<!-- 适用场景：存算分离集群控制 TOPN 延迟物化第二阶段的 File Cache 写入 -->

## 控制延迟物化第二阶段的 File Cache 写入

在存算分离集群中，TOPN 延迟物化的第二阶段会按第一阶段选出的行号读取其余列。若少量结果行分散在大量 Segment 中，这些离散读取填充的缓存块可能很少被再次访问，并挤占热点数据的缓存空间。此时可以开启 `enable_topn_lazy_mat_phase2_no_write_file_cache`，让第二阶段在缓存未命中时直接读取远端存储而不回写 File Cache。

该开关不改变查询结果，只改变第二阶段的 File Cache miss 处理方式：

| 设置 | 第二阶段读取行为 |
| :--- | :--- |
| `false`（默认） | 沿用常规的读穿透与回写策略：缓存 miss 时读取远端数据，并将读取的数据写入 File Cache |
| `true` | 仅当本次读取范围被状态为 `DOWNLOADED` 的缓存块完整覆盖时读取本地缓存；只要存在未缓存或尚未下载完成的范围，本次读取范围就直接从远端读取，且不创建或写入缓存块 |

开启该开关时请注意以下边界：

- 只在存算分离模式下生效，并且只控制 Doris 内表的 TOPN 延迟物化第二阶段；当前不控制外表的第二阶段读取。
- 同时支持开启和未开启行存的 Doris 内表。
- 不会清理已有缓存，也不会改变第一阶段、其他查询或其他算子的缓存写入行为。因此，整个查询的 File Cache 写入量仍可能大于 0。
- 若 File Cache 未启用，或者执行计划中没有 `MaterializeNode`，该开关不会产生额外效果。

### 基本使用

以下示例要求使用存算分离集群，BE 已启用 File Cache，并使用具备建表、删表、写入和查询权限的用户执行。先创建一个 Duplicate Key 内表：

```sql
DROP TABLE IF EXISTS topn_file_cache_demo;

CREATE TABLE topn_file_cache_demo (
    id BIGINT NOT NULL,
    event_time DATETIME NOT NULL,
    payload VARCHAR(128) NOT NULL
)
ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "replication_num" = "1",
    "light_schema_change" = "true"
);

INSERT INTO topn_file_cache_demo VALUES
    (1, '2026-01-01 10:00:00', 'alpha'),
    (2, '2026-01-02 10:00:00', 'beta'),
    (3, '2026-01-03 10:00:00', 'gamma');
```

开启 Profile 和第二阶段不回写策略，然后检查执行计划并执行查询：

```sql
SET enable_profile = true;
SET profile_level = 2;
SET enable_sql_cache = false;
SET enable_query_cache = false;
SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;

EXPLAIN SELECT id, payload
FROM topn_file_cache_demo
ORDER BY event_time DESC
LIMIT 2;

SELECT id, payload
FROM topn_file_cache_demo
ORDER BY event_time DESC
LIMIT 2;
```

执行计划中应包含 `MaterializeNode`。查询结果如下；开关开启或关闭不会改变结果：

```text
+----+---------+
| id | payload |
+----+---------+
|  3 | gamma   |
|  2 | beta    |
+----+---------+
2 rows in set
```

如需恢复默认的缓存回写行为，执行：

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;
```

### 通过 Profile 验证缓存策略

将 `profile_level` 设为 `2` 后，在 Query Profile 的 `MaterializeNode` 对应执行算子中查看以下第二阶段专用指标：

| 观测维度 | 聚合指标 | 含义 |
| :--- | :--- | :--- |
| 读取规模 | `TopNLazyMaterializationSecondPhaseRowsRead`、`TopNLazyMaterializationSecondPhaseSegmentsRead` | 第二阶段读取的行数和涉及的 Segment 数 |
| 本地缓存读取 | `TopNLazyMaterializationSecondPhaseLocalIOCount`、`TopNLazyMaterializationSecondPhaseLocalIOBytes`、`TopNLazyMaterializationSecondPhaseLocalIOTime` | 从 File Cache 读取的次数、字节数和耗时 |
| 远端读取 | `TopNLazyMaterializationSecondPhaseRemoteIOCount`、`TopNLazyMaterializationSecondPhaseRemoteIOBytes`、`TopNLazyMaterializationSecondPhaseRemoteIOTime` | 从远端存储读取的次数、字节数和耗时 |
| 跳过缓存 | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | 从远端读取但未写入 File Cache 的次数 |
| 缓存写入 | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`、`TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | 写入 File Cache 的字节数和耗时 |

开启不回写策略后，可以按以下特征确认行为：

| 缓存状态 | 预期指标特征 |
| :--- | :--- |
| 本次读取范围未被完整缓存 | `RemoteIOCount`、`RemoteIOBytes` 和 `SkipCacheIOCount` 大于 0，`WriteCacheBytes` 为 0 |
| 本次读取范围被已下载缓存块完整覆盖 | `LocalIOCount` 和 `LocalIOBytes` 大于 0，`RemoteIOCount`、`RemoteIOBytes` 和 `WriteCacheBytes` 为 0 |

Profile 还提供分 BE 指标。`TopNLazyMaterializationSecondPhasePerBackend` 列出 BE，其他指标在聚合指标名称的 `SecondPhase` 后增加 `PerBackend`，例如 `TopNLazyMaterializationSecondPhasePerBackendRowsRead` 和 `TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes`。各数组按下标与 BE 列表一一对应，并会累计同一查询中多次第二阶段 Fetch 的数据。

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes` 只统计延迟物化第二阶段。若通用 File Cache 指标仍显示写入，请先判断写入是否来自第一阶段或其他算子。有关 Profile 的获取方法，参见 [Query Profile 分析](../query-profile.md)。
:::

<!-- 知识类型：操作 -->
<!-- 适用场景：评估 TOPN 优化的实际收益 -->

## 检查 TOPN 优化执行效果

**目的**：通过对比执行时间和 Profile 指标，确认 TOPN 优化的实际过滤效果。

**步骤**：

1. 将 `topn_opt_limit_threshold` 设为 `0` 关闭优化，记录执行时间。
2. 恢复默认值开启优化，记录执行时间并对比。
3. 在 Query Profile 中搜索 `RuntimePredicate`，关注下表关键指标。

**关键指标**：

| 指标 | 含义 | 期望趋势 |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | 通过 RuntimePredicate 过滤掉的行数 | 越大越好 |
| `NumSegmentFiltered` | 过滤掉的数据文件（Segment）个数 | 越大越好 |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | RuntimePredicate 过滤数据的耗时 | 越小越好 |

> 注意：2.0.3 之前的版本中 `RuntimePredicate` 的指标尚未独立统计，可通过通用 Zonemap 指标大致观察。

**Profile 示例**：

```sql
    SegmentIterator:
          -  BitmapIndexFilterTimer:  46.54us
          -  BlockConditionsFilteredBloomFilterTime:  10.352us
          -  BlockConditionsFilteredDictTime:  7.299us
          -  BlockConditionsFilteredTime:  202.23ms
          -  BlockConditionsFilteredZonemapRuntimePredicateTime:  0ns
          -  BlockConditionsFilteredZonemapTime:  402.917ms
          -  BlockInitSeekCount:  399
          -  BlockInitSeekTime:  11.309ms
          -  BlockInitTime:  215.59ms
          -  BlockLoadTime:  7s567ms
          -  BlocksLoad:  392.97K  (392970)
          -  CachedPagesNum:  0
          -  CollectIteratorMergeTime:  0ns
          -  CollectIteratorNormalTime:  0ns
          -  CompressedBytesRead:  29.76  MB
          -  DecompressorTimer:  427.713ms
          -  ExprFilterEvalTime:  3s930ms
          -  FirstReadSeekCount:  392.921K  (392921)
          -  FirstReadSeekTime:  528.287ms
          -  FirstReadTime:  1s134ms
          -  IOTimer:  51.286ms
          -  InvertedIndexFilterTime:  49.457us
          -  InvertedIndexQueryBitmapCopyTime:  0ns
          -  InvertedIndexQueryBitmapOpTime:  0ns
          -  InvertedIndexQueryCacheHit:  0
          -  InvertedIndexQueryCacheMiss:  0
          -  InvertedIndexQueryTime:  0ns
          -  InvertedIndexSearcherOpenTime:  0ns
          -  InvertedIndexSearcherSearchTime:  0ns
          -  LazyReadSeekCount:  0
          -  LazyReadSeekTime:  0ns
          -  LazyReadTime:  106.952us
          -  NumSegmentFiltered:  0
          -  NumSegmentTotal:  50
          -  OutputColumnTime:  61.987ms
          -  OutputIndexResultColumnTimer:  12.345ms
          -  RawRowsRead:  3.929151M  (3929151)
          -  RowsBitmapIndexFiltered:  0
          -  RowsBloomFilterFiltered:  0
          -  RowsConditionsFiltered:  6.38976M  (6389760)
          -  RowsDictFiltered:  0
          -  RowsInvertedIndexFiltered:  0
          -  RowsKeyRangeFiltered:  0
          -  RowsShortCircuitPredFiltered:  0
          -  RowsShortCircuitPredInput:  0
          -  RowsStatsFiltered:  6.38976M  (6389760)
          -  RowsVectorPredFiltered:  0
          -  RowsVectorPredInput:  0
          -  RowsZonemapRuntimePredicateFiltered:  6.38976M  (6389760)
          -  SecondReadTime:  0ns
          -  ShortPredEvalTime:  0ns
          -  TotalPagesNum:  2.301K  (2301)
          -  UncompressedBytesRead:  137.99  MB
          -  VectorPredEvalTime:  0ns
```

<!-- 知识类型：FAQ -->
<!-- 适用场景：常见疑问与故障排查 -->

## 常见问题（FAQ / Troubleshooting）

**Q1：EXPLAIN 中没有 `TOPN OPT`，可能是哪些原因？**

- LIMIT n 大于 `topn_opt_limit_threshold`（默认 1024）。
- LIMIT n 占表总行数比例超过 `topn_filter_ratio`（默认 0.5）。
- 表是 Unique MOR 表，无法使用该优化。

**Q2：开启优化后 SQL 反而变慢？**

- 检查 `n` 是否过大导致内存开销升高，可适当调小 `topn_opt_limit_threshold`。
- 通过 Profile 中 `RowsZonemapRuntimePredicateFiltered` 确认过滤效果，若过滤行数为 0 则优化未带来收益。

**Q3：如何只关闭优化 3（两阶段读取）而保留优化 1、2？**

设置 `enable_two_phase_read_opt = false` 即可。

**Q4：MOR 表执行 ORDER BY LIMIT 结果不正确？**

确认未在 MOR 表上启用 TOPN 优化。MOR 表请使用 MOW 模型或避免触发该优化路径。

**Q5：开启第二阶段不回写策略后，为什么查询仍有 File Cache 写入？**

该策略只控制 Doris 内表的 TOPN 延迟物化第二阶段。第一阶段、其他算子和外表读取仍可能写入 File Cache。请使用 `TopNLazyMaterializationSecondPhaseWriteCacheBytes` 判断第二阶段是否发生写入，不要使用整个查询的写入量代替该指标。

## 相关参数对照速查

| 想要的效果 | 设置方式 |
| :--- | :--- |
| 完全关闭 TOPN 优化 | `SET topn_opt_limit_threshold = 0;` |
| 仅关闭两阶段延迟物化 | `SET enable_two_phase_read_opt = false;` |
| 放宽 LIMIT 上限以覆盖更多查询 | 适当增大 `topn_opt_limit_threshold` |
| 调整生成 filter 的比率阈值 | 修改 `topn_filter_ratio` |
| 第二阶段缓存 miss 时不回写 File Cache | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| 恢复第二阶段默认的缓存回写行为 | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
