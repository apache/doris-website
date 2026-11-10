---
title: 'Apache Doris and Lance: How Lazy Materialization Speeds Up Vector Search'
summary: 'Two-phase reads defer wide output columns until after TopN. Explore the query plan, row-ID fetch path, and a 104-million-row benchmark with roughly sixfold speedups.'
description: 'How Apache Doris implements lazy materialization for Lance using column dependency analysis, pinned snapshots, distributed row-ID fetches, and two-phase reads.'
keywords:
  - 'Apache Doris'
  - 'Lance'
  - 'lazy materialization'
  - 'two-phase reads'
  - 'vector search'
date: '2026-10-28'
author: 'Wenqiang Li'
tags:
  - 'Tech Sharing'
image: '/images/blogs/apache-doris-lance-lazy-materialization/cover.jpg'
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

Autonomous driving, knowledge-base retrieval, and multimodal search queries often perform several tasks at once: find similar records, apply business filters, and return text and attributes. As datasets grow, latency depends on both retrieval speed and how much data the execution pipeline reads, processes, and transfers.

The [previous article](/blog/apache-doris-lance-vector-search) described a billion-record test in which vector search with four filters took 2.32 seconds with Doris + Lance and 25.228 seconds with Ray + pylance, a latency ratio of about 10.87×. At the same scale, Doris + Lance took 0.43 seconds for vector search alone and 0.73 seconds with a time filter.

Query planning, parallel search, prefiltering, on-demand column reads, and caching work together in that execution path. This article focuses on **lazy materialization**, also called **two-phase reading**. It defers columns needed only for final output until after TopN, so candidates that are later discarded do not incur the full cost of reading and transferring their contents.

## Why read some columns later?

Suppose a Lance knowledge-base table contains `id`, `title`, `body`, and `embedding`. This query returns the 20 most relevant documents:

```sql
SELECT id, title, body, _distance
FROM vector_search(
    "table" = "lance_catalog.demo.documents",
    "column" = "embedding",
    "query_vector" = "[0.1, 0.2, 0.3, 0.4]",
    "metric" = "l2",
    "top_k" = "20"
)
ORDER BY _distance ASC;
```

The four-dimensional vector is illustrative; use a vector and distance metric compatible with your dataset and index.

The query needs all four output values, but at different times. `_distance` must exist before ranking. In this example, `title` and `body` are needed only for display, so they can wait until the result is selected. Whether the business `id` can wait depends on its use in filtering, sorting, or other computation.

Reading the complete body during candidate generation makes losing documents incur I/O, decoding, and transfer costs. Distributed execution increases that cost: multiple search splits produce local candidates that Doris merges into a global TopN. Some candidates never reach the final result, yet their eagerly loaded bodies have already passed through Arrow conversion, Block transfers, and sorting.

Lazy materialization changes the order: **select results using the required information, then fetch the remaining contents for those rows**. Wide columns, such as long document bodies and rich attributes, offer the largest opportunity to save work.

![Early materialization ranks complete candidate rows, while two-phase reading ranks IDs and scores before fetching selected payloads](/images/blogs/apache-doris-lance-lazy-materialization/eager-vs-two-phase.jpg)

## How the two phases work together

Doris's optimizer, distributed execution framework, and Lance's row-level reads cooperate on this optimization. FE identifies output columns that can be deferred and adds a materialization node to the physical plan. BEs perform search, filtering, and TopN, then use the retained row locators to fetch the remaining columns in batches.

| Phase | Main work | Data carried |
| --- | --- | --- |
| Phase 1: select results | Generate candidates and perform required filtering and ranking | Required early columns, distance or score, and hidden row locators |
| Phase 2: complete the output | Fetch columns by row ID and restore result order | Deferred output columns for selected rows |

![FE plans a pinned snapshot; BEs run parallel search, global TopN, and materialization against that Lance dataset version](/images/blogs/apache-doris-lance-lazy-materialization/distributed-architecture.jpg)

For an eligible query, the flow is:

```text
Lance search splits
  → required early columns + score/distance + hidden row locator
  → Doris filtering / local TopN / exchange / global TopN
  → Materialize: batch row-ID fetch
  → restore result order and assemble output
```

The exact positions of TopN, Exchange, Project, and Filter depend on the plan. The key is that deferred columns stay out of the candidate stream until the optimized TopN has selected rows.

That design raises two implementation questions: which columns can wait, and how can Doris retrieve them accurately afterward?

## Phase 1: read only the required columns

### Trace column dependencies

Eligibility depends on how a column is used. Even a large body column must be read early if an early filter or sort needs its value.

During Nereids physical-plan postprocessing, `LazyMaterializeTopN` starts from TopN's output slots and traces each column's origin. `MaterializeProbeVisitor` walks down the plan to check whether sorting, filtering, or another operator needs the column early, and whether it traces back to an original column that supports row-ID fetching.

Sort keys need values before TopN. Columns used by residual Doris-side filters need values before those filters. Expressions evaluated early by Project also constrain their input columns. The optimizer tracks aliases and original-column dependencies so pruning one output does not remove an input still needed by another.

![Distance and residual-filter columns remain in phase one, while an output-only body column can be fetched after global TopN](/images/blogs/apache-doris-lance-lazy-materialization/column-eligibility.jpg)

| Column use | Treatment | Reason |
| --- | --- | --- |
| Vector `_distance` or full-text `_score` | Keep in retrieval and ranking | These values are generated by search and cannot be fetched as ordinary stored columns |
| Doris-side sort keys or residual-filter inputs | Read early | Operators need actual values to select candidates |
| Inputs to expressions evaluated early | Retain according to expression dependencies | The expression needs those inputs |
| Top-level columns used only for output, such as `title` and `body` | Defer when eligible | They can be fetched from the original dataset after selection |

### Prune projections and retain locators

Once eligible columns are identified, `LazySlotPruning` adjusts scan and upstream outputs. It removes deferred columns from the early flow and adds a hidden global row-locator column. The optimizer then constructs `PhysicalLazyMaterialize`, recording the columns to fetch, their source relations, and each relation's locator column.

On the BE, `LanceTableReader` creates a scanner using the pruned projection. When a later fetch is needed, it calls `lance_scanner_with_row_id(scanner, true)` to request native Lance row IDs. A converter wraps them in an internal Doris locator that can travel across operators and BEs.

The candidate can therefore omit its body while retaining enough information to retrieve it later.

## Phase 2: fetch the selected contents

After TopN selects rows, the second phase retrieves their remaining output columns. It must preserve snapshot consistency and result order while organizing efficient reads.

### Pin the snapshot and locate the row

Lance returns native `uint64` row IDs. Doris wraps each in a versioned internal locator containing the source BE, a query-local mapping ID, and the Lance row ID.

The mapping ID identifies a saved scan context; it is not a physical filename. A Lance row ID is also not simply a row number in a Parquet or ORC file.

The saved context contains the dataset URI, pinned version, and storage access options. Phase two restores those values through the mapping and opens the same dataset snapshot. The snapshot version belongs to the context and does not need to be repeated in every locator.

**Both phases must interpret row IDs against the same snapshot.** If phase one selects a row from version V, phase two must fetch from V rather than opening `latest`. `LanceTableReader::read_by_row_ids` therefore requires a fixed version and opens the dataset through the shared `LanceSessionManager`.

### Route requests and fetch in batches

The materialization operator decodes the hidden locators and groups `multiget_data_v2` requests by source BE. The receiving BE resolves the saved scan context, then sorts and deduplicates row IDs within each mapping to form a batch request.

![Selected rows carry BE IDs, mapping IDs, and Lance row IDs; grouped requests resolve the pinned snapshot, fetch rows, and restore output order](/images/blogs/apache-doris-lance-lazy-materialization/row-id-fetch.jpg)

In the Lance-specific path, `RowIdStorageReader` uses `LanceTableReader::read_by_row_ids` to call the dataset-level API. It fetches columns by row ID without recreating a normal `FileScanner` to scan the candidate-producing fragment:

```cpp
lance_dataset_take_rows(
    dataset,
    row_ids.data(),
    row_ids.size(),
    projected_columns,
    &arrow_stream
);
```

`projected_columns` contains only the columns needed in phase two. The SDK returns an `ArrowArrayStream`. Doris imports it into a `RecordBatchReader`, consumes batches, and converts them into Doris Blocks.

Some Lance reads happen only while the Arrow stream is consumed. Measuring fetch time must therefore include both the API call and subsequent `ReadNext` calls. The shared session can reuse relevant metadata and data caches, but phase two still pays for dataset opening, row-ID requests, storage reads, decoding, and conversion.

### Restore order and assemble output

Sorting and deduplicating row IDs changes the storage-read order, and responses from different BEs can arrive in any order. Doris maintains mappings from output positions to fetch positions and source BEs, then assembles the returned values in TopN's original output order.

A duplicate row ID within a fetch group can be read once and mapped to multiple output positions. The implementation also checks requested versus returned row counts, column lengths, and row counts across BE responses. These checks keep fetched values aligned with row identity, the snapshot, and ranking.

## Where the savings come from

Lazy materialization reduces early reads of wide output columns for candidates that will be discarded.

A simple model illustrates the potential. Suppose search splits produce C candidates, the final result contains K rows, and each row has W bytes of deferrable output columns:

```text
Early payload volume ≈ C × W
Deferred payload volume ≈ K × W
Avoided payload volume ≈ (C − K) × W
```

This describes logical output-column volume. It excludes index reads and vector reranking and does not equal bytes downloaded from object storage. Page or block read amplification, compression, caching, row locators, and fetch RPCs all affect actual cost.

For example, if 16 splits each produce 20 candidates, the final result keeps 20 rows, and each body is 4 KiB:

| Read strategy | Logical body volume |
| --- | ---: |
| Read bodies early for all 320 candidates | 320 × 4 KiB = 1.25 MiB |
| Fetch bodies only for the final 20 rows | 20 × 4 KiB = 80 KiB |

The logical body volume falls to **1/16**. This is an explanatory model, not a measured speedup or object storage transfer reduction.

The savings can affect several stages:

- **Reading and decoding:** losing candidates do not require early reads and decoding of deferred columns.
- **Transfers and memory movement:** smaller intermediate Blocks reduce network traffic and memory copying.
- **Sorting:** wide columns no longer travel through TopN with every candidate.

| More likely to benefit | Gains may be limited |
| --- | --- |
| Wide output columns and a small final Top-K | Only distances, scores, or a few narrow columns are returned |
| Many candidates from multiple splits | Candidate count is already close to final result count |
| Columns are needed only for display | Most columns participate in early filters, sorting, or computation |
| Reads, decoding, or transfers are expensive | ANN computation, reranking, prefiltering, or queueing dominates |

With `OFFSET`, each search split may need to produce `top_k + offset` candidates even though only `top_k` rows are returned. Lazy materialization can avoid fetching output columns for skipped rows, but it does not remove candidate generation, sorting, or skipping.

The net gain depends on the work saved relative to the extra fetch, RPC, and result-reassembly costs.

## Benchmark: two-phase reads on and off

An internal benchmark compared the same queries with two-phase reading disabled and enabled. Vector search alone, vector search with a time filter, and vector search with time and sensor-array filters all fell from tens of seconds to single-digit seconds.

### Test setup

The test used a build based on `doris-4.1.5-release-c7f95adaaa` with **104,343,874 rows**. That build identifier describes the test environment; it does not establish availability in a standard 4.1.5 release. The cluster had one FE and two BEs. Each BE had 32 CPU cores, 128 GB RAM, and 1 TB of storage. Both scalar and vector indexes had 15 index segments.

All three queries used `vector_search`, sorted by L2 distance, set `nprobes=128`, `use_index=true`, and `top_k=20000`, and returned every column, including the vector. The sensor query filtered an array for Pandar128.

The test toggled `enable_lance_lazy_materialization`. The cluster restarted before each group, and each SQL statement ran three consecutive times. Below, **cold** means the first execution after restart; **min** means the minimum of the three executions. Speedup is disabled time divided by enabled time.

### First execution: 4.74× to 6.29× faster

![First-execution times with lazy materialization disabled and enabled across three vector search queries](/images/blogs/apache-doris-lance-lazy-materialization/first-execution-benchmark.png)

| Query | Disabled (s) | Enabled (s) | Speedup |
| --- | ---: | ---: | ---: |
| Vector search only | 41.877 | 8.839 | 4.74× |
| Vector + time filter | 33.805 | 5.565 | 6.07× |
| Vector + time + sensor-array filter | 31.208 | 4.962 | 6.29× |

Elapsed time fell by about **78.9% to 84.1%**, including queries that combined filtering with two-phase reads.

### Minimum of three executions: 6.49× to 6.64× faster

![Minimum times from three executions with lazy materialization disabled and enabled across the same three queries](/images/blogs/apache-doris-lance-lazy-materialization/minimum-time-benchmark.png)

| Query | Disabled (s) | Enabled (s) | Speedup |
| --- | ---: | ---: | ---: |
| Vector search only | 39.630 | 6.110 | 6.49× |
| Vector + time filter | 31.950 | 4.901 | 6.52× |
| Vector + time + sensor-array filter | 28.377 | 4.275 | 6.64× |

The minimum times fell by about **84.6% to 84.9%**. The improvement was present in both first and repeated executions.

### Why these queries benefited

These queries both ranked candidates and returned full rows, including vectors. Multiple search tasks produced candidates, but only some survived the global Top-K. Reading output-only columns early made losing candidates incur unnecessary reads, decoding, and transfers.

Two-phase reading defers that work. Phase one carries search, filter, and sort inputs plus row locators. Phase two completes the selected rows. The amount of full-output processing therefore follows the final result more closely than the intermediate candidate count.

The experiment shows that even a Top-K of 20,000 can benefit when the query returns all columns. Actual gains depend on the workload and the balance between saved work and second-phase overhead.

## Availability

At the time of the original article, this capability was planned for the upcoming Apache Doris 4.2 release. Consult the [Lance Catalog documentation](https://doris.apache.org/docs/4.x/lakehouse/catalogs/lance-catalog/) for release support and compatibility.

Lazy materialization connects three pieces: the optimizer identifies output columns that can wait, distributed execution carries stable locators, and Lance fetches selected contents by native row ID from a pinned snapshot. For retrieval applications that return rich text and attributes, this brings column reads closer to the final result size and avoids spending work on discarded candidates.
