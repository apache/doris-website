---
{
    "title": "TOPN 查询优化",
    "language": "zh-CN"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->


TOPN 查询是指下面这种 ORDER BY LIMIT 查询，在日志检索等明细查询场景中很常见，Doris 会自动对这种类型的查询进行优化。

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1,c2 ... LIMIT n
```

## TOPN 查询优化的优化点

1. 执行过程中动态对排序列构建范围过滤条件（比如 c1 >= 10000），读数据时自动带上前面的条件，利用 Zonemap 索引过滤到一些数据甚至文件。

2. 如果排序字段 c1,c2 正好是 Table Key 的前缀，则更进一步优化，读数据的时候只用读数据文件的头部或者尾部 n 行。

3. SELECT * 延迟物化，读数据和排序过程中只读排序列不读其它列，得到符合条件的行号后，再去读那 n 行需要的全部列数据，大幅减少读取和排序的列。


## TOPN 查询优化的限制

1. 只能用于 Duplicate 表和 Unique MOW 表，因为 MOR 表用这个优化可能有结果错误。

2. 对于过大的 `n`，优化内存消耗会很大，所以超过 `topn_opt_limit_threshold` Session 变量的 `n` 不会使用优化。


## 配置参数和查询分析

下面两个参数都是 Session Variable，可以针对某个 SQL 或者全局设置。

1. `topn_opt_limit_threshold`，LIMIT n 小于这个值才会有优化，默认值 1024，将它设置为 0 可以关闭 TOPN 查询优化。

2. `enable_two_phase_read_opt`，是否开启优化 3，默认为 true，可以调为 false 关闭这个优化。

3. `topn_filter_ratio`，LIMIT n 和表总数据的比率，默认值 0.5，表示 LIMIT 数量多于表中数据的一半则不生成 filter 。

### 检查 TOPN 查询优化是否启用

explain SQL 拿到 query plan 可以确认这个 sql 是否启用 TOPN 查询优化，以下面的为例：

- TOPN OPT 代表有优化 1

- VOlapScanNode 下面有 SORT LIMIT 代表有优化 2

- OPT TWO PHRASE 代表有优化 3

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

### 检查 TOPN 查询优化执行时是否有效果

首先，可以将 `topn_opt_limit_threshold` 设置为 0 关闭 TOPN 查询优化，对比开启和关闭优化的 SQL 执行时间。

开启 TOPN 查询优化后，在 Query Profile 中搜索 RuntimePredicate，关注下面几个指标：

- `RowsZonemapRuntimePredicateFiltered` 这个代表过滤掉的行数，越大越好

- `NumSegmentFiltered` 这个代表过滤掉的数据文件个数，越大越好

- `BlockConditionsFilteredZonemapRuntimePredicateTime` 代表过滤数据的耗时，越小越好

注意，2.0.3 之前的版本中 RuntimePredicate 的指标未独立，可以通过 Zonamap 指标大致观察。

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
