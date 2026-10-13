---
{
    "title": "Lance Query Profile Reference",
    "sidebar_label": "Lance Query Profile",
    "language": "en",
    "description": "Interpret Apache Doris Lance query profiles: FE metadata and planning, BE index and scan metrics, cache statistics, timing boundaries, and second-phase row-ID fetching.",
    "keywords": [
        "Lance",
        "Query Profile",
        "performance analysis",
        "vector search",
        "index cache"
    ]
}
---

This reference explains Profile metrics for ordinary Lance scans, vector search, full-text search, and second-phase row-ID fetching. For Profile collection, viewing, and general operator analysis, see the [Query Profile Analysis Guide](../../query-acceleration/query-profile.md). Configure Lance access using [Lance Catalog](../catalogs/lance-catalog.mdx).

:::note
Lance Catalog is experimental and supported starting from Apache Doris 4.2. The metrics below depend on the running FE/BE and bundled Lance version.
:::

Enable query profiling before running a Lance query:

```sql
SET enable_profile = true;
```

The following names describe the current Lance instrumentation.

## FE Metadata and Planning

For Catalog queries, including ordinary scans, `COUNT`, vector search, and full-text search, inspect `Lance Metadata Metrics` under `Execution Summary`:

| Timer | Meaning |
|---|---|
| `MetadataReadTime` | Total time for a Catalog metadata read, including table access resolution, Dataset access, and resource cleanup. |
| `TableAccessResolveTime` | Resolve table access, including Namespace access, credentials, and storage options. |
| `DatasetOpenTime` | Open the Dataset on the FE. Historical queries can require more than one open. |
| `VersionResolveTime` | Resolve the requested historical snapshot where needed. |
| `SchemaReadTime` | Read the Arrow schema. |
| `FragmentMetadataReadTime` | Read Fragment metadata and construct row-count descriptors. |
| `FieldIdsReadTime` | Read and map Lance field IDs. |
| `IndexMetadataReadTime` | Discover logical indexes and read index segment metadata. |
| `SplitPlanningTime` | Plan ordinary, metadata-count, vector, or full-text scan splits. |

Each executed operation or step also has a corresponding `Calls` counter, such as `DatasetOpenCalls`. `MetadataReadFailures` and `SplitPlanningFailures` count failed operations, including their elapsed time; they are not counts of failed SQL statements. Unexecuted metadata steps do not create counters. This group accumulates Catalog work across tables and repeated reads within the SQL statement; standalone file TVFs and `SHOW INDEX` do not populate it.

`MetadataReadTime` contains its metadata substeps. `SplitPlanningTime` is measured separately. The generic `External Table Get Table Meta Time`, `External Table Get File Scan Tasks Time`, and `External Table Meta Time` include the corresponding work, so do not add them again to the Lance detail timers or to the enclosing analysis/planning time. FE `DatasetOpenTime` and BE `LanceDatasetOpenTime` describe different processes.

## BE Groups and Statistics Boundaries

In the scan Profile, find `TableReader` → `LanceReader`. Its groups are labels rather than timers; their hierarchy does not make child times additive.

| Group | Content |
|---|---|
| `LanceTiming` | Dataset opening, Scanner configuration and reads, Runtime Filter translation, Arrow conversion, and row-ID fetching. |
| `LanceIO` | Instrumented execution-stream read operations, requests, and bytes. |
| `LanceIndex` | Index object/component loading, cache lookups, comparisons, index opening, and partitions searched. |
| `LanceVectorIndex` | IVF partition selection, vector index deltas, ANN stages, and vector distance computation. |
| `LanceScalarIndex` | Scalar index evaluation, segment search, candidates, fallbacks, and result serialization. |
| `LanceExecutionPlan` | Lance execution-plan sorting, merging, and Take work. |
| `LanceScan` | Fragment/range/row scans, scan-task waiting, and row-ID Prefilter construction. |
| `LanceSearchPlan` | Search segment/Fragment counts assigned to the reader. |
| `LanceDataCache` | Data-file cache and source-storage request bytes for the Dataset handle. |

Doris timers update around their measured calls. Lance execution counters are accumulated from statistics callbacks after streams reach EOF. Failure, cancellation, or early termination can leave execution statistics incomplete. Scanner metrics are pre-registered, including optional native metrics: a zero value can mean that the native path did not report the metric. A missing or zero metric alone does not establish that an index, filter, or I/O path was unused. Metadata-only `COUNT` and row-ID fetching do not use the ordinary Scanner callback path.

Times accumulate across calls and parallel tasks, and can exceed SQL wall time. Read the slowest Scanner together with scheduling, dependency waits, FE result handling, and client latency. Do not sum all Scanners or nested timers to reconstruct query latency.

## Reader Timing

| Timer | Meaning |
|---|---|
| `LanceDatasetOpenTime` | Open the Dataset through the BE's shared Session, including necessary metadata access. Reusing the reader's already-open Dataset does not add another open. |
| `LanceScannerConfigureTime` | Configure the Scanner, projection, filters, callback, and split/search options. Work deferred until reading is measured later. |
| `LanceRuntimeFilterSqlTranslationTime` | Translate/combine Doris Runtime Filters into Lance SQL, including translation-cache lookup. This is not time spent executing the filter. |
| `LanceScannerNextTime` | Cumulative batch-read calls, including initial preparation, index computation, I/O, decoding, and waiting. Excludes the subsequent Arrow-to-Doris conversion. |
| `LanceArrowToDorisBlockTime` | Convert returned Arrow batches into Doris Blocks, for both scanning and row-ID fetching. |

`LanceScannerNextTime` overlaps the internal index, scan, and execution-plan timers below. A large value does not by itself identify storage as the bottleneck.

## I/O, Index Loading, and Cache Lookups

| Counter | Meaning |
|---|---|
| `LanceIOReadOps` | Instrumented read-operation count, not operations per second or an HTTP request count. |
| `LanceIOReadRequests` | Instrumented storage-read request count. Range merging/splitting can make it differ from `LanceIOReadOps`. |
| `LanceIOReadBytes` | Read bytes reported by the execution plan, including instrumented data/index paths. Cache-served reads can be included; this is not measured remote traffic or decoded memory size. |
| `LanceIndexObjectLoads` | Top-level index objects loaded. This is not a segment count or a count of their internal page loads. |
| `LanceIndexComponentsLoaded` | Internal index components loaded, such as pages, partitions, or postings. This is not an index-cache miss counter; loading/merging and instrumentation can give different counts. |
| `LanceIndexCacheHits`, `LanceIndexCacheMisses` | Cache lookups reported by instrumented index paths for this execution. They are distinct from BE-wide Session hit/miss totals. Some streaming paths do not retain loaded content, so persistent misses alone do not establish insufficient cache capacity. |
| `LanceIndexComparisons` | Comparison/lookup work defined by each index implementation. This is not a candidate-row count or a uniform CPU-cost unit across index types. |

These counters apply to the instrumented vector, scalar, and full-text index paths. An index object can remain cached while its pages or partitions need loading. Check cache usage, repeatable cold/warm workloads, and I/O together before increasing capacity. For the separate disk data cache and BE-wide metrics, see [Checking Cache Effectiveness](../catalogs/lance-catalog.mdx#checking-cache-effectiveness).

## Row-ID Prefilter and Scalar Index Work

Row-ID Prefilter metrics describe the loader that consumes row IDs and constructs an allowed-row mask. They do not measure every TVF `filter`, every scalar index lookup, or the final ANN/FTS result count.

| Counter or timer | Meaning |
|---|---|
| `RowIdPrefilterLoads` | Physical row-ID loader executions. Repeated query nodes can perform repeated loads. |
| `RowIdPrefilterInputRows`, `RowIdPrefilterInputBatches` | Non-null input row IDs and batches consumed by the loader. |
| `RowIdPrefilterIds` | Allowed row IDs retained in the constructed mask, accumulated across loaders rather than deduplicated across the query. |
| `RowIdPrefilterLoadTime` | Total loader time, including input polling and mask construction. |
| `RowIdPrefilterInputTime`, `RowIdPrefilterBuildTime` | Input-stream waiting/reading and mask-building time. Both are included in `RowIdPrefilterLoadTime`; do not add the total to its parts. |
| `LanceScalarIndexQueryTime` | Scalar index expression evaluation, potentially including several index searches and set operations. |
| `LanceScalarIndexResultSerializationTime` | Serialize scalar index results for downstream Lance nodes; this is not network serialization or Arrow-to-Doris conversion. |
| `LanceScalarIndexSegmentsRequested`, `LanceScalarIndexSegmentsSearched` | Requests for the explicit scalar-segment path and completed segment evaluations. These are execution counts, not distinct table segments. |
| `LanceScalarIndexSegmentFallbacks` | Explicit scalar-segment acceleration falls back to a full-filter scan within the assigned Fragment scope. A searched segment can also fall back. |
| `LanceScalarIndexCandidateRows` | Candidate-mask size when known, before the reader applies its Fragment scope and full predicate. It is not the SQL result count; zero can also reflect unavailable cardinality. |
| `LanceScalarIndexCandidateEvaluationTime` | Prepare/evaluate/install scalar-segment candidates, including index opening/search and fallback preparation. Excludes the subsequent data scan. |
| `LanceScalarIndexSegmentSearchTime` | Evaluate the selected segment's index expression, including its loading and set operations. Included in `LanceScalarIndexCandidateEvaluationTime`. |

A segment can cover more Fragments than one task reads, and repeated tasks can count the same candidates again. Do not interpret `CandidateRows` as task-local matches. The regular scalar-expression path and explicit segment path have different timers; they need not report the same values. Large masks or repeated segment evaluation can consume CPU and memory even with a warm cache.

## Vector and Execution-Plan Work

| Counter or timer | Meaning |
|---|---|
| `LanceIVFPartitionsConsidered` | IVF partition population considered during selection, accumulated across the selected index deltas. This is not the number of probes executed. |
| `LanceIVFPartitionSelectionTime` | Select IVF partitions for the query. Excludes the surrounding index open. |
| `LanceIndexPartitionsSearched` | Partition searches actually reported by index execution. FTS also reports this metric; interpret it using `LanceSearchType`. It is not a query-wide distinct-partition count. |
| `LanceVectorIndexDeltasSearched` | Vector index deltas submitted to the ANN partition path. This does not prove that every delta completed its search. |
| `LanceIndexOpenTime` | Open an index handle, including cache lookup and metadata access. |
| `LanceIndexPartitionLoadTime`, `LanceIndexPartitionPrepareTime` | Partition loading includes cache lookup, cache-fill waiting, and loading/decoding on a miss. Partition preparation includes loading and filter preparation; these timers overlap. |
| `LanceIndexPrefilterWaitTime` | Wait for the index Prefilter to become ready. This is distinct from building a row-ID mask. |
| `LanceIndexCpuQueueWaitTime` | Wait between submitting a partition search task and starting its CPU work. |
| `LanceIndexSearchTime` | CPU search of a prepared partition, including query preparation and result construction. |
| `LanceIndexQueryPrepareTime` | Construct the distance calculator and query lookup tables. |
| `LanceIndexDistanceTopKTime` | Fused candidate filtering, distance evaluation, and Top-K heap updates. This is not a pure distance-computation or refinement timer. |
| `LanceIndexResultMaterializeTime` | Convert a search-result heap into Arrow arrays/batches. This is not the Doris second-phase output fetch. |
| `LanceANNPartitionExecTime`, `LanceANNSubIndexExecTime`, `LanceANNBatchExecTime` | Instrumented ANN execution-node compute times. These can overlap the detailed index timers. |
| `LanceVectorDistanceComputeTime` | Compute time reported by the vector-distance execution node; it does not cover every indexed distance calculation. |
| `LanceSortComputeTime`, `LanceSortMergeComputeTime`, `LanceTakeExecTime` | Lance execution-node sorting, merging, and Take compute times. These are not Doris TopN or the complete second-phase fetch. |

Partition work runs concurrently and timers can nest or overlap. Do not add `LanceIndexSearchTime` to its query-preparation, distance/Top-K, and result-construction parts. Compare probe counts, CPU-queue waiting, Prefilter waiting, and I/O before changing `nprobes`, `ef`, or `refine_factor`; measure recall as well as latency.

## Planned Work, Scanned Rows, and Output Fetch

| Counter or timer | Meaning |
|---|---|
| `LancePlannedIndexSegmentCount` | Search index segments assigned to the reader, accumulated when splits are configured. Does not prove completed search. |
| `LancePlannedIndexedFragmentCount` | Fragments assigned to indexed vector/full-text search splits. |
| `LancePlannedFlatSearchFragmentCount` | Fragments assigned to vector Flat Search splits. FTS does not register this counter. |
| `LanceFragmentsScanned`, `LanceRowOffsetRangesScanned`, `LanceRowsScanned` | Fragments, row-offset ranges, and rows reported by the FilteredRead path. Not all read paths populate them; they are not table-wide distinct counts or final SQL rows. |
| `LanceScanTaskWaitTime` | FilteredRead consumer waiting for read tasks. This is not Doris Scanner scheduling time or a complete I/O-wait total. |
| `LanceRowIdFetchCalls`, `LanceRowIdFetchRows` | Second-phase `take_rows` calls and rows fetched. |
| `LanceRowIdTakeReadTime` | Create and consume the row-ID Take stream, including deferred reads; excludes Arrow-to-Doris conversion. |
| `LanceRowIdFetchTotalTime` | Total non-empty row-ID fetch processing, including Dataset opening, Take reads, conversion, and result checks. It contains the preceding substeps, and excludes end-to-end RPC/Materialization overhead. |

For search planning, compare `EXPLAIN` fields `lanceSearchIndexSegments`, `lanceSearchIndexFragments`, and `lanceSearchUnindexedFragments` with the `LanceSearchPlan` counters. For ordinary scalar-segment scans, use `lanceGroupingIndexSegments`, `lanceGroupingIndexedFragments`, and `lanceGroupingUnindexedFragments`; these are FE plan fields, not BE Profile counters. Fragment counts are accumulated by task and need not be deduplicated.

Two-phase fetching uses a separate reader and does not register the Scanner execution-statistics callback. Its fetch timers, fetch counts, and `LanceDataCacheBytesReadFromCache`/`LanceDataCacheBytesReadFromRemote` are also reported in Row ID Fetch/Materialization Profile information. A missing `LanceIOReadBytes` there does not mean no I/O occurred. Keep scan and fetch scopes separate, and do not count the same exported fetch statistics twice.

Use `LanceDatasetVersion` and `LanceDatasetUri` to identify the executed snapshot, and `LanceSearchType` to distinguish vector and full-text search. `LanceTopK`, `LanceOffset`, `LanceFtsCoverageMode`, `LanceFtsQueryType`, `LanceFtsMatchOperator`, `LanceFtsMaxFuzzyDistance`, `LanceFtsPhraseSlop`, `LancePushdownFormat`, and Runtime Filter ID entries describe configuration or pushdown state. They are information strings, not additive counters. `LanceTopK` and `LanceOffset` describe the per-split request: for a TVF query with `top_k=K` and `offset=n`, search splits request up to `K+n` candidates with local offset `0`; the final Doris TopN applies the user offset.

