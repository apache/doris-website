---
{
    "title": "TOPN 查询优化：ORDER BY LIMIT 加速原理与配置",
    "language": "zh-CN",
    "description": "Doris 如何加速 ORDER BY LIMIT 查询？本文介绍 TOPN 优化原理、适用限制、Session 参数与执行计划检查方法。",
    "keywords": ["Doris TOPN 优化", "ORDER BY LIMIT 加速", "topn_opt_limit_threshold", "两阶段读取", "RuntimePredicate", "Zonemap 过滤"]
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

以下三个参数均为 Session Variable，可针对单条 SQL 设置或全局设置。

| 参数 | 默认值 | 作用 | 调优建议 |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | LIMIT n 小于该值才启用 TOPN 优化 | 设为 `0` 可关闭整个 TOPN 优化 |
| `enable_two_phase_read_opt` | true | 是否启用优化 3（两阶段延迟物化） | 设为 `false` 可单独关闭优化 3 |
| `topn_filter_ratio` | 0.5 | LIMIT n 与表总数据的比率阈值 | 当 LIMIT 数量超过表数据一半时不再生成 filter |

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
- `OPT TWO PHASE` —— 启用了 **优化 3**（两阶段延迟物化）

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

## 相关参数对照速查

| 想要的效果 | 设置方式 |
| :--- | :--- |
| 完全关闭 TOPN 优化 | `SET topn_opt_limit_threshold = 0;` |
| 仅关闭两阶段延迟物化 | `SET enable_two_phase_read_opt = false;` |
| 放宽 LIMIT 上限以覆盖更多查询 | 适当增大 `topn_opt_limit_threshold` |
| 调整生成 filter 的比率阈值 | 修改 `topn_filter_ratio` |
