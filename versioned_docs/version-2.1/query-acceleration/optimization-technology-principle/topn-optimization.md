---
{
    "title": "TOPN Query Optimization",
    "language": "en"
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



TOPN queries refer to queries that involve ORDER BY LIMIT operations, which are common in log retrieval and other detailed query scenarios. Doris automatically optimizes this type of query.

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1,c2 ... LIMIT n
```

## Advantages of TOPN

1. During execution, dynamic range filters are built for the sorting columns (e.g., c1 >= 1000), which automatically apply the preceding conditions when reading data, leveraging zonemap indexes to filter out some rows or even entire files.

2. If the sorting fields c1, c2 are exactly the prefix of the table key, further optimization is applied. When reading data, only the header or tail of the data files is read, reducing the amount of data read to just the n rows needed.

3. SELECT * deferred materialization, during the data reading and sorting process, only the sorting columns are read, not the other columns. After obtaining the row numbers that meet the conditions, the entire data of those n rows needed is read, significantly reducing the amount of data read and sorted.

## Limitations

1. It only applies to DUP and MOW tables, not to MOR and AGG tables.

2. Due to the high memory consumption on very large `n`, it will not take effect if n is greater than `topn_opt_limit_threshold`.

## Configuration and Query Analysis

The following two parameters are session variables that can be set for a specific SQL or globally.

1. `topn_opt_limit_threshold`: This session variable determines whether TOPN optimization is applied. It defaults to 1024, and setting it to 0 disables the optimization.

2. `enable_two_phase_read_optimization`: This session variable determines whether to enable this optimization. It defaults to true, and setting it to false disables the optimization.

3. `topn_filter_ratio`, the ratio between LIMIT n and the total data in the table, the default value is 0.5, which means that if the number of LIMIT is more than half of the data in the table, no filter will be generated.

### Checking if TOPN Query Optimization is Enabled

To confirm if TOPN query optimization is enabled for a particular SQL, you can use the `EXPLAIN` statement to get the query plan. An example is as follows:

- `TOPN OPT` indicates that optimization point 1 is applied.

- `VOlapScanNode` with `SORT LIMIT` indicates optimization point 2 is applied.

- `OPT TWO PHASE` indicates optimization point 3 is applied.

```sql
   1:VTOP-N(137)
   |   order by: @timestamp18 DESC
   |   TOPN OPT
   |   OPT TWO PHASE
   |   offset: 0
   |   limit: 10
   |   distribute expr lists: applicationName5
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

### Checking the Effectiveness of TOPN Query Optimization During Execution

First, set `topn_opt_limit_threshold` to 0 to disable TOPN query optimization and compare the execution time of the SQL with and without optimization enabled.

After enabling TOPN query optimization, search for `RuntimePredicate` in the query profile and focus on the following metrics:

- `RowsZonemapRuntimePredicateFiltered`: The number of rows filtered out, the higher the better.

- `NumSegmentFiltered`: The number of data files filtered out, the higher the better.

- `BlockConditionsFilteredZonemapRuntimePredicateTime`: The time taken to filter data, the lower the better.

Before version 2.0.3, the `RuntimePredicate` metrics were not separated out, and the `Zonemap` metrics can be used as a rough guide.

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
