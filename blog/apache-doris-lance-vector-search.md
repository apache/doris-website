---
title: 'Apache Doris and Lance: Inside Distributed Vector Search'
summary: 'How Doris queries Lance datasets with parallel search, prefiltering, late materialization, and SQL analytics, with benchmark results on up to one billion records.'
description: 'A technical look at Apache Doris and Lance integration, including index-aware parallel search, filtering, caching, SQL analysis, and vector search benchmarks.'
keywords:
  - 'Apache Doris'
  - 'Lance'
  - 'vector search'
  - 'prefiltering'
  - 'lakehouse'
date: '2026-10-15'
author: 'Wenqiang Li'
tags:
  - 'Tech Sharing'
image: '/images/blogs/apache-doris-lance-vector-search/cover.jpg'
---
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements. See the NOTICE file
distributed with this work for additional information
regarding copyright ownership. The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License. You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied. See the License for the
specific language governing permissions and limitations
under the License.
-->

Autonomous driving and multimodal search workloads are growing quickly. A query often needs more than the nearest vectors: it must also filter by vehicle type, time, device, or region, then join the results with business data and compute aggregates.

Treating vector search as a separate service adds work to that process. The application retrieves candidates, moves them into a database or analytics engine, and assembles the final result. As datasets grow, data movement and coordination across systems become more expensive.

Doris and Lance divide the work differently. Lance provides multimodal storage and vector and full-text indexes. Doris plans queries, executes them across the cluster, and runs the remaining SQL operations. You can query existing Lance datasets directly and combine filtering, vector search, joins, aggregation, and sorting in one SQL statement.

In a test using autonomous driving data, **Doris + Lance completed vector search with four filters over one billion records in 2.32 seconds, compared with 25.228 seconds for Ray + pylance**, a latency ratio of about 10.87×. The test used Top-K 20,000, 95% recall, enabled caches, and no concurrent queries. The full results and their limitations appear below.

## 1. Architecture

A Lance dataset includes data files, version metadata, data fragments, and indexes. Doris reads that metadata to plan a query. The frontend (FE) plans the work; backends (BEs) read data and execute searches. Search results flow directly into other Doris operators for joins and aggregation.

![Doris FE plans access to Lance datasets, while BEs execute searches and SQL operations alongside business tables](/images/blogs/apache-doris-lance-vector-search/architecture.jpg)

Doris supports two catalog options. Filesystem Catalog discovers datasets through directories; REST Catalog discovers them through a Lance Namespace service. The underlying data can reside on a local filesystem, S3-compatible object storage, or OSS. For ad hoc queries, a file table-valued function (TVF) with Lance format support can access a dataset directly.

Doris exposes vector search through `vector_search()` and Lance full-text search (FTS) through `full_text_search()`. Full-text search supports matching any term (Match OR), all terms (Match AND), or a phrase. Phrase queries require an index that stores token positions. In the default strict coverage mode, all fragments in the selected dataset version must have an index; fragments without an index do not automatically fall back to a flat scan. Both search functions can feed subsequent SQL analysis. Combining vector and text rankings requires explicit result-merging and scoring rules.

A query has three main steps:

1. **Plan the work.** FE reads the schema, dataset version, fragment list, and index coverage. It determines column types, projected columns, and task boundaries. Each query uses a fixed dataset version.
2. **Read and search.** BEs call Lance through lance-c, receive Arrow data, and convert it into Doris Blocks for downstream operators.
3. **Analyze the results.** Results can participate in joins, aggregation, sorting, and pagination, including queries against Doris internal tables or other catalogs.

The application can express retrieval and analysis together instead of implementing a separate round of joins and statistics after fetching Lance results.

## 2. Parallel search

Distributed search starts with task boundaries. Poor boundaries can make tasks read the same index data repeatedly; too few tasks leave BEs underused.

Doris splits search work by Lance **physical index segment**. An index segment and a data fragment are different units: one index segment can cover multiple fragments. Doris reads their mapping before scheduling scan tasks.

![FE assigns physical index segments to parallel ANN tasks and unindexed fragments to flat search, then merges the global Top-K](/images/blogs/apache-doris-lance-vector-search/parallel-search.jpg)

For vector search, FE finds an index matching the vector column and distance metric, then distributes its segments across BEs. Fragments in the selected version that lack index coverage get flat-search tasks, which scan the data directly. Their results join the same final merge.

Doris sorts the returned candidates and selects the global Top-K. Indexed data uses the index, while data outside index coverage still participates in the query. When the index uses approximate nearest neighbor (ANN) search, recall still depends on the index type and search parameters.

Ordinary filtered scans can also use indexes. Some equality, range, `IN`, and array-label predicates can use Lance BTree, Bitmap, or LabelList indexes. Where supported, Doris organizes scans by index segment and also scans data outside index coverage. Eligibility depends on the predicate and index type.

Segment size affects parallel efficiency. Enough segments let multiple BEs share the work; excessive segmentation adds scheduling, index-opening, and merge overhead. Choose a layout based on data distribution, BE count, and query concurrency.

## 3. Filtering before search

Parallelism helps use cluster resources, but reducing the search space can save more work. Filter placement also affects whether a query returns enough results. If you need similar records for a particular vehicle type, searching first and removing other vehicle types afterward may leave fewer than K results.

In `vector_search()` and `full_text_search()`, `filter` specifies the predicate and `prefilter` controls when it runs. **The default is `prefilter=false`.** Set `"prefilter"="true"` explicitly to filter before selecting search candidates.

![Prefiltering restricts the search scope first; postfiltering and an outer WHERE can discard candidates after retrieval](/images/blogs/apache-doris-lance-vector-search/prefiltering.jpg)

This example searches within a vehicle type and region. It uses an illustrative four-dimensional vector and returns Top-20; the benchmark later in this post uses Top-K 20,000. Replace the table, columns, and values with your own, and match the vector dimensions and `metric` to the dataset and index.

```sql
SELECT scene_id, scene_text, resource_uri, _distance
FROM vector_search(
    "table" = "lance_demo.autodrive.scene_samples",
    "column" = "embedding",
    "query_vector" = "[0.12, 0.34, 0.56, 0.78]",
    "top_k" = "20",
    "metric" = "cosine",
    "filter" = "vehicle_type = 'sedan' AND region_code = 'zone_a'",
    "prefilter" = "true",
    "use_index" = "true"
)
ORDER BY _distance ASC, scene_id;
```

With `prefilter=true`, Lance applies the function's filter before selecting candidates. A compatible scalar index can narrow the search; otherwise, evaluating the predicate may still require a scan. The savings depend on index availability and filter selectivity.

With the default `prefilter=false`, Lance selects candidates and then applies the function's `filter`. An outer SQL `WHERE` applies further filtering in Doris. Either can discard retrieved records, leaving fewer than K rows.

For ordinary Lance scans, Doris can push supported SQL predicates into Lance. Some join runtime filters can also become `IN` or range predicates, depending on predicate and type compatibility. With search functions, use `prefilter` explicitly to control the filtering order.

## 4. Reading output columns on demand

Retrieval may need only distances and a few filtering columns, while the final output includes long text, labels, and resource paths. Reading all those columns at the start makes losing candidates incur unnecessary I/O and transfer costs.

For eligible vector and full-text searches, Doris can separate retrieval into two reads: select the results first, then fetch the remaining output columns.

![Phase one carries search columns, row IDs, and scores through Top-K; phase two fetches display columns for selected rows](/images/blogs/apache-doris-lance-vector-search/late-materialization.jpg)

The first read returns the data required for search, filtering, and computation, along with row IDs and distances or scores. After Doris selects the global Top-K, the second read fetches other output columns by row ID.

This saves reads and transfers for columns that can wait until the final result is known. It does not eliminate reads needed for search or filtering. The optimization is especially useful when the final result is small and each record carries substantial text or attributes.

Both reads use the same dataset version, so the retrieved row and its later-fetched contents remain consistent. Doris also supports selecting Lance snapshots by version, time, or named reference for repeatable queries. The [lazy materialization deep dive](/blog/apache-doris-lance-lazy-materialization) explains the implementation.

## 5. Caching and diagnostics

Repeated queries often access the same indexes and files. Caching reduces repeated index loading, metadata parsing, and object storage reads.

Doris shares a Lance Session within each BE. Ordinary scans, vector search, full-text search, and row-ID fetches can reuse the relevant caches in that session.

![Scans, search, and row-ID fetches reuse one BE's Lance session, with index and metadata memory caches and a local data cache](/images/blogs/apache-doris-lance-vector-search/caching.jpg)

Each BE manages its own caches; BEs do not share a Lance cache pool. Cache capacity also accounts for only part of memory use. Scan tasks, prefetching, and sorting need additional memory.

Use `EXPLAIN`, Query Profile, and BE metrics to investigate latency. The plan shows task boundaries. Profile breaks down dataset opening, index loading, remote reads, format conversion, and second-phase column fetches. Index and metadata cache hit rates and occupancy are BE-level statistics and may include multiple queries.

Start by checking whether the query used an index or flat search. Then determine whether filtering, data reads, search, or output-column fetches dominate. See the [Lance Query Profile reference](https://doris.apache.org/docs/dev/lakehouse/best-practices/lance-query-profile/) for metric definitions.

## 6. SQL analysis after retrieval

Search results can participate in SQL like a table. Doris feeds them into joins, aggregation, and sorting. For example, one statement can retrieve similar samples from Lance, join labels from a Doris internal table, and count samples by category.

![An embedding-driven search flows into business joins, SQL analysis, and a curated set of scenes](/images/blogs/apache-doris-lance-vector-search/search-to-analysis.jpg)

The following query retrieves Top-20 samples for the selected vehicle type and region, then joins `internal.demo.scene_labels` to count scene categories. It assumes that `scene_id` is unique in the Lance dataset and that the label table contains one record per `scene_id`. The four-dimensional vector and metric are illustrative and must match your actual data and index.

```sql
WITH candidates AS (
    SELECT scene_id
    FROM vector_search(
        "table" = "lance_demo.autodrive.scene_samples",
        "column" = "embedding",
        "query_vector" = "[0.12, 0.34, 0.56, 0.78]",
        "top_k" = "20",
        "metric" = "cosine",
        "filter" = "vehicle_type = 'sedan' AND region_code = 'zone_a'",
        "prefilter" = "true",
        "use_index" = "true"
    )
    ORDER BY _distance ASC, scene_id
    LIMIT 20
)
SELECT
    COALESCE(l.scene_type, 'Uncategorized') AS scene_type,
    COUNT(*) AS sample_count
FROM candidates c
LEFT JOIN internal.demo.scene_labels l
    ON c.scene_id = l.scene_id
GROUP BY COALESCE(l.scene_type, 'Uncategorized')
ORDER BY sample_count DESC, scene_type;
```

`candidates` defines the search result, `LEFT JOIN` adds categories, and `GROUP BY` counts them. Missing labels and null categories appear as `Uncategorized`. The application receives the aggregate directly.

These counts describe the returned Top-K samples, not the entire dataset. To count the full dataset, scan and aggregate the Lance table directly. Keeping the vehicle and region predicates inside the search function restricts the scope when candidates are selected.

## 7. Benchmark results

The benchmark compares Doris + Lance with Ray + pylance on autonomous driving datasets containing 100 million, 500 million, and one billion records. It covers six query types: vector search alone and vector search with device, time, vehicle type, geographic, or four combined filters.

**All tests used Top-K 20,000, 95% recall, enabled caches, and no concurrency. Times are in seconds.** Ray used four actors at 100 million records and 16 actors at 500 million and one billion. Enabled caches do not imply that every read hit a cache. The available records do not specify the hardware for either system, the Doris BE count, or the timing aggregation method. These results compare elapsed times in this test and should not be treated as a hardware-normalized benchmark.

### One billion records

![Elapsed time for six vector search scenarios at one billion records, comparing Doris with Ray](/images/blogs/apache-doris-lance-vector-search/billion-record-benchmark.png)

| Query | Doris + Lance (s) | Ray + pylance (s) | Latency ratio |
| --- | ---: | ---: | ---: |
| Vector search only | 0.43 | 1.075 | 2.50× |
| Device filter | 0.54 | 1.803 | 3.34× |
| Time filter | 0.73 | 6.044 | 8.28× |
| Vehicle type filter | 0.53 | 1.689 | 3.19× |
| Geographic filter | 1.19 | 12.908 | 10.85× |
| Four combined filters | 2.32 | 25.228 | 10.87× |

At one billion records, geographic filtering and four-filter search took 1.19 and 2.32 seconds with Doris, about 90.8% less time than Ray + pylance. Time-filtered search fell from 6.044 to 0.73 seconds, a latency ratio of about 8.28×.

Index planning, prefiltering, parallel search, and on-demand column reads all contribute to this execution path. The test did not disable those optimizations individually, so it cannot isolate their contributions.

### All test cases

![Heatmap of Ray-to-Doris latency ratios across six query types and three dataset sizes](/images/blogs/apache-doris-lance-vector-search/benchmark-matrix.png)

Each cell below lists **Doris / Ray elapsed time in seconds**.

| Query | 100 million records | 500 million records | 1 billion records |
| --- | ---: | ---: | ---: |
| Vector search only | 0.60 / 0.478 | 0.47 / 0.226 | 0.43 / 1.075 |
| Device filter | 0.64 / 0.847 | 0.50 / 0.594 | 0.54 / 1.803 |
| Time filter | 0.69 / 1.235 | 0.64 / 2.856 | 0.73 / 6.044 |
| Vehicle type filter | 0.71 / 0.797 | 0.52 / 0.583 | 0.53 / 1.689 |
| Geographic filter | 0.73 / 2.138 | 1.00 / 5.955 | 1.19 / 12.908 |
| Four combined filters | 0.96 / 5.171 | 1.67 / 11.927 | 2.32 / 25.228 |

The latency ratio is Ray + pylance time divided by Doris + Lance time; values above one favor Doris. Doris had lower elapsed time in 16 of the 18 cases. For four-filter search, the ratios were about 5.39×, 7.14×, and 10.87× at 100 million, 500 million, and one billion records, respectively.

## 8. Availability and next steps

At the time of the original October 2026 article, this integration was planned for Apache Doris 4.2. The [Lance Catalog documentation](https://doris.apache.org/docs/4.x/lakehouse/catalogs/lance-catalog/) describes its experimental status and compatibility requirements.

Doris integrates Lance throughout query execution: index segments distribute work across BEs, prefiltering narrows the search space, late materialization reduces output-column reads, and caches reuse indexes, metadata, and file contents. Together, these mechanisms let existing Lance datasets support retrieval and SQL analytics without an application-side data assembly step.

The benchmark results show the potential for large vector searches with business filters. Evaluate the gains with your own data, indexes, and deployment. For a broader application example, see [Apache Doris and Lance for Physical AI Analytics](/blog/apache-doris-lance-physical-ai-analytics).
