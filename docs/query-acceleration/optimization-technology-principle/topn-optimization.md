---
{
    "title": "TOPN Query Optimization: ORDER BY LIMIT Acceleration Principles and Configuration",
    "language": "en",
    "description": "How does Doris accelerate ORDER BY LIMIT queries? This article explains TOPN optimization principles, applicable limitations, session parameters, execution plan inspection methods, and the phase-2 File Cache policy for lazy materialization in storage-compute separation deployments.",
    "keywords": ["Doris TOPN optimization", "ORDER BY LIMIT acceleration", "topn_opt_limit_threshold", "enable_topn_lazy_mat_phase2_no_write_file_cache", "two-phase read", "File Cache", "RuntimePredicate", "Zonemap filtering"]
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

The following four parameters are all session variables. You can set them for a single SQL statement or globally.

| Parameter | Default | Effect | Tuning Suggestion |
| :--- | :--- | :--- | :--- |
| `topn_opt_limit_threshold` | 1024 | TOPN optimization is enabled only when LIMIT n is less than this value | Set to `0` to disable the entire TOPN optimization |
| `enable_two_phase_read_opt` | true | Whether to enable Optimization 3 (two-phase lazy materialization) | Set to `false` to disable Optimization 3 alone |
| `topn_filter_ratio` | 0.5 | Ratio threshold of LIMIT n to total table data | When the LIMIT count exceeds half of the table data, the filter is no longer generated |
| `enable_topn_lazy_mat_phase2_no_write_file_cache` | false | In storage-compute separation mode, controls whether phase 2 of lazy materialization for Doris internal tables skips cache writeback on a File Cache miss | Enable it only when phase-2 reads have low reuse and are likely to pollute the cache |

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
- `MaterializeNode` (or `OPT TWO PHASE` in older execution plans): **Optimization 3** (two-phase lazy materialization) is enabled

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

<!-- Knowledge type: configuration + operation + troubleshooting -->
<!-- Applicable scenarios: controlling File Cache writes during TOPN lazy materialization phase 2 in clusters with storage-compute separation -->

## Control File Cache Writes During Lazy Materialization Phase 2

In a cluster with storage-compute separation, phase 2 of TOPN lazy materialization reads the remaining columns by the row IDs selected in phase 1. When a small number of result rows are scattered across many Segments, the cache blocks populated by these sparse reads may see little reuse and displace hot data. In this case, enable `enable_topn_lazy_mat_phase2_no_write_file_cache` so that phase 2 reads cache misses directly from remote storage without writing them back to File Cache.

This variable does not change query results. It changes only how phase 2 handles File Cache misses:

| Setting | Phase-2 Read Behavior |
| :--- | :--- |
| `false` (default) | Uses the regular read-through and writeback policy: on a cache miss, Doris reads remote data and writes the data to File Cache |
| `true` | Reads local cache only when cache blocks in the `DOWNLOADED` state fully cover the current read range. If any part is uncached or still downloading, Doris reads the entire current range from remote storage without creating or writing cache blocks |

Before enabling this variable, note the following boundaries:

- It takes effect only in storage-compute separation mode and controls only phase 2 of TOPN lazy materialization for Doris internal tables. It currently does not control phase-2 reads for external tables.
- It supports Doris internal tables both with and without row store enabled.
- It neither removes existing cache entries nor changes cache writes made by phase 1, other queries, or other operators. The query's total File Cache writes may therefore still be greater than zero.
- It has no additional effect when File Cache is disabled or when the execution plan does not contain a `MaterializeNode`.

### Basic Usage

The following example requires a cluster with storage-compute separation, File Cache enabled on the BEs, and a user that can create and drop tables and insert and query data in the target database. First, create a Duplicate Key internal table:

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

Enable Profile and the phase-2 no-write policy, inspect the execution plan, and run the query:

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

The execution plan should contain a `MaterializeNode`. The query returns the following result regardless of whether the variable is enabled:

```text
+----+---------+
| id | payload |
+----+---------+
|  3 | gamma   |
|  2 | beta    |
+----+---------+
2 rows in set
```

To restore the default cache writeback behavior, run:

```sql
SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;
```

### Verify the Cache Policy in Profile

After setting `profile_level` to `2`, inspect the following phase-2-specific metrics under the execution operator corresponding to `MaterializeNode` in Query Profile:

| Dimension | Aggregate Metrics | Meaning |
| :--- | :--- | :--- |
| Read scale | `TopNLazyMaterializationSecondPhaseRowsRead`, `TopNLazyMaterializationSecondPhaseSegmentsRead` | Number of rows read and Segments accessed in phase 2 |
| Local cache reads | `TopNLazyMaterializationSecondPhaseLocalIOCount`, `TopNLazyMaterializationSecondPhaseLocalIOBytes`, `TopNLazyMaterializationSecondPhaseLocalIOTime` | Count, bytes, and time of reads from File Cache |
| Remote reads | `TopNLazyMaterializationSecondPhaseRemoteIOCount`, `TopNLazyMaterializationSecondPhaseRemoteIOBytes`, `TopNLazyMaterializationSecondPhaseRemoteIOTime` | Count, bytes, and time of reads from remote storage |
| Cache bypass | `TopNLazyMaterializationSecondPhaseSkipCacheIOCount` | Number of remote reads that were not written to File Cache |
| Cache writes | `TopNLazyMaterializationSecondPhaseWriteCacheBytes`, `TopNLazyMaterializationSecondPhaseWriteCacheIOTime` | Bytes written to File Cache and time spent writing them |

When the no-write policy is enabled, use the following patterns to verify its behavior:

| Cache State | Expected Metric Pattern |
| :--- | :--- |
| The current read range is not fully cached | `RemoteIOCount`, `RemoteIOBytes`, and `SkipCacheIOCount` are greater than 0, while `WriteCacheBytes` is 0 |
| The current read range is fully covered by downloaded cache blocks | `LocalIOCount` and `LocalIOBytes` are greater than 0, while `RemoteIOCount`, `RemoteIOBytes`, and `WriteCacheBytes` are 0 |

Profile also provides per-BE metrics. `TopNLazyMaterializationSecondPhasePerBackend` lists the BEs. The other metric names add `PerBackend` after `SecondPhase`, for example, `TopNLazyMaterializationSecondPhasePerBackendRowsRead` and `TopNLazyMaterializationSecondPhasePerBackendWriteCacheBytes`. Array elements correspond to the BE list by index and accumulate data from multiple phase-2 fetches within the same query.

:::note
`TopNLazyMaterializationSecondPhaseWriteCacheBytes` covers only phase 2 of lazy materialization. If general File Cache metrics still report writes, first determine whether they come from phase 1 or another operator. For information about obtaining a Profile, see [Query Profile Analysis](../query-profile.md).
:::

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

**Q5: Why does the query still write to File Cache after I enable the phase-2 no-write policy?**

The policy controls only phase 2 of TOPN lazy materialization for Doris internal tables. Phase 1, other operators, and external-table reads may still write to File Cache. Use `TopNLazyMaterializationSecondPhaseWriteCacheBytes` to determine whether phase 2 performed cache writes instead of relying on the query's total write volume.

## Quick Reference for Related Parameters

| Desired Effect | Setting |
| :--- | :--- |
| Completely disable TOPN optimization | `SET topn_opt_limit_threshold = 0;` |
| Disable only two-phase lazy materialization | `SET enable_two_phase_read_opt = false;` |
| Relax the LIMIT upper bound to cover more queries | Increase `topn_opt_limit_threshold` appropriately |
| Adjust the ratio threshold for generating the filter | Modify `topn_filter_ratio` |
| Do not write phase-2 cache misses back to File Cache | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = true;` |
| Restore the default phase-2 cache writeback behavior | `SET enable_topn_lazy_mat_phase2_no_write_file_cache = false;` |
