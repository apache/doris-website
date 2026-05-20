---
{
    "title": "TOPN Query Optimization: ORDER BY LIMIT Acceleration Principles and Configuration",
    "language": "en",
    "description": "How does Doris accelerate ORDER BY LIMIT queries? This article explains TOPN optimization principles, applicable limitations, session parameters, and execution plan inspection methods.",
    "keywords": ["Doris TOPN optimization", "ORDER BY LIMIT acceleration", "topn_opt_limit_threshold", "two-phase read", "RuntimePredicate", "Zonemap filtering"]
}
---

<!-- Knowledge type: concept + configuration + troubleshooting -->
<!-- Applicable scenarios: log search, detail query, sorted pagination -->

## One-Sentence Definition

TOPN query optimization is Doris's automatic acceleration capability for `ORDER BY ... LIMIT n` queries. It significantly reduces scan and sort overhead through dynamic filtering, range pruning, and lazy materialization.

## Pre-Reading Checklist

- [ ] My SQL has the form `SELECT ... FROM t WHERE ... ORDER BY c1, c2 ... LIMIT n`
- [ ] The table type is a Duplicate table or a Unique MOW table (not MOR)
- [ ] `n` is small (less than `topn_opt_limit_threshold`, default 1024)
- [ ] You want to verify whether the optimization is in effect via EXPLAIN and Profile

## Typical SQL Pattern

TOPN queries are common in detail-query scenarios such as log search. Doris automatically recognizes and optimizes them:

```sql
SELECT * FROM tablex WHERE xxx ORDER BY c1, c2 ... LIMIT n
```

<!-- Knowledge type: principle -->
<!-- Applicable scenarios: understanding how Doris internally accelerates ORDER BY LIMIT -->

## Three Optimization Points

| No. | Optimization | Principle | Key Benefit |
| :--- | :--- | :--- | :--- |
| Optimization 1 | Dynamic range filtering (RuntimePredicate) | During sorting, dynamically build range conditions on the sort columns (such as `c1 >= 10000`) and push them down to the scan | Use the Zonemap index to filter out large amounts of data, even entire files |
| Optimization 2 | Key-prefix short-circuit read | When the sort fields `c1, c2` are exactly a prefix of the table key, only read the first or last n rows of the data file | Significantly reduces disk reads |
| Optimization 3 | Two-phase lazy materialization | The first phase reads only the sort columns to complete sorting and obtain row numbers; the second phase reads the other columns | Significantly reduces the number of columns that need to be read and sorted |

<!-- Knowledge type: limitation -->
<!-- Applicable scenarios: determining whether the current query can benefit from TOPN optimization -->

## Applicable Limitations

1. **Table type limitation**: Only Duplicate tables and Unique MOW tables are supported. Using this optimization on a Unique MOR table may produce incorrect results.
2. **n value limitation**: When `n` is too large, the memory consumption of the optimization rises significantly. The optimization is not enabled when `n` exceeds the session variable `topn_opt_limit_threshold`.

<!-- Knowledge type: configuration -->
<!-- Applicable scenarios: tuning or disabling TOPN optimization -->

## Configuration Parameters

The following three parameters are all session variables. You can set them for a single SQL statement or globally.

| Parameter | Default | Effect | Tuning Suggestion |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | TOPN optimization is enabled only when LIMIT n is less than this value | Set to `0` to disable the entire TOPN optimization |
| `enable_two_phase_read_opt` | true | Whether to enable Optimization 3 (two-phase lazy materialization) | Set to `false` to disable Optimization 3 alone |
| `topn_filter_ratio` | 0.5 | Ratio threshold of LIMIT n to total table data | When the LIMIT count exceeds half of the table data, the filter is no longer generated |

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: verifying whether TOPN optimization is enabled -->

## Check Whether TOPN Optimization Is Enabled

**Purpose**: Use the execution plan to determine which optimization points are enabled for the current SQL.

**Command**:

```sql
EXPLAIN <your_sql>;
```

**Description**: Look for the following markers in the Query Plan:

- `TOPN OPT`: **Optimization 1** (dynamic range filtering) is enabled
- `SORT LIMIT` under `VOlapScanNode`: **Optimization 2** (key-prefix short-circuit read) is enabled
- `OPT TWO PHASE`: **Optimization 3** (two-phase lazy materialization) is enabled

**Example**:

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

<!-- Knowledge type: operation -->
<!-- Applicable scenarios: evaluating the actual benefit of TOPN optimization -->

## Check the Execution Effect of TOPN Optimization

**Purpose**: Confirm the actual filtering effect of TOPN optimization by comparing execution time and Profile metrics.

**Steps**:

1. Set `topn_opt_limit_threshold` to `0` to disable the optimization, and record the execution time.
2. Restore the default value to enable the optimization, record the execution time, and compare.
3. Search for `RuntimePredicate` in the Query Profile and pay attention to the key metrics in the table below.

**Key Metrics**:

| Metric | Meaning | Expected Trend |
| :--- | :--- | :--- |
| `RowsZonemapRuntimePredicateFiltered` | Number of rows filtered out by RuntimePredicate | The larger, the better |
| `NumSegmentFiltered` | Number of data files (Segments) filtered out | The larger, the better |
| `BlockConditionsFilteredZonemapRuntimePredicateTime` | Time taken by RuntimePredicate to filter data | The smaller, the better |

> Note: In versions before 2.0.3, the metrics for `RuntimePredicate` are not yet tracked separately. You can roughly observe them through the general Zonemap metrics.

**Profile Example**:

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

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: common questions and troubleshooting -->

## Frequently Asked Questions (FAQ / Troubleshooting)

**Q1: `TOPN OPT` is not present in EXPLAIN. What might be the reasons?**

- LIMIT n is greater than `topn_opt_limit_threshold` (default 1024).
- The ratio of LIMIT n to the total number of rows in the table exceeds `topn_filter_ratio` (default 0.5).
- The table is a Unique MOR table, which cannot use this optimization.

**Q2: The SQL becomes slower after the optimization is enabled. Why?**

- Check whether `n` is too large, causing increased memory overhead. You can lower `topn_opt_limit_threshold` appropriately.
- Confirm the filtering effect via `RowsZonemapRuntimePredicateFiltered` in the Profile. If the filtered row count is 0, the optimization brings no benefit.

**Q3: How can I disable only Optimization 3 (two-phase read) while keeping Optimizations 1 and 2?**

Set `enable_two_phase_read_opt = false`.

**Q4: An ORDER BY LIMIT query on a MOR table returns incorrect results. Why?**

Confirm that TOPN optimization is not enabled on the MOR table. For MOR tables, use the MOW model or avoid triggering this optimization path.

## Quick Reference for Related Parameters

| Desired Effect | Setting |
| :--- | :--- |
| Completely disable TOPN optimization | `SET topn_opt_limit_threshold = 0;` |
| Disable only two-phase lazy materialization | `SET enable_two_phase_read_opt = false;` |
| Relax the LIMIT upper bound to cover more queries | Increase `topn_opt_limit_threshold` appropriately |
| Adjust the ratio threshold for generating the filter | Modify `topn_filter_ratio` |
