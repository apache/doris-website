---
{
    "title": "PQ On-Disk",
    "language": "en",
    "description": "PQ On-Disk is an ANN index mode in Apache Doris for reranking small post-filter candidate sets, storing PQ codes on disk and using a dedicated chunk cache to reduce memory usage."
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

# PQ On-Disk in Apache Doris

`pq_on_disk` is an ANN index type in Doris designed for reranking small candidate sets after scalar filtering. It stores PQ codes on disk in rowid order, keeps only the PQ codebook in memory, and computes approximate distances only for rows that have already passed the filter.

Compared with `ivf` and `ivf_on_disk`, `pq_on_disk` is not a global ANN recall structure. It is designed for queries such as `WHERE user_id = ? ORDER BY l2_distance_approximate(...) LIMIT N`, where the filter first narrows the search scope to a relatively small candidate set and the vector index is then used for fast approximate reranking.

## Why PQ On-Disk

Some vector-search workloads do not need ANN to search the whole segment. Instead, they first use ordinary predicates such as `user_id`, `tag`, or other inverted-index filters to reduce the candidate set, and only then need fast Top-N vector ranking inside that filtered subset.

`pq_on_disk` is designed for this operating point:

- Work on filtered candidate sets, typically thousands to tens of thousands of rows.
- Keep memory footprint low by storing PQ codes on disk.
- Reuse standard SQL distance functions and ANN DDL.
- Avoid the overhead of maintaining a global IVF or graph structure when the candidate set is already known.

## Scope and User Value

Compared with other ANN index types in Doris, `pq_on_disk` focuses on a different problem:

- `hnsw` and `ivf` are optimized for global ANN retrieval across large vector collections.
- `ivf_on_disk` keeps the IVF recall model but moves IVF lists to disk to save memory.
- `pq_on_disk` is optimized for post-filter approximate reranking on small candidate sets.

This makes it useful when:

- The query almost always includes a highly selective scalar filter.
- Rows for the same filter key have good locality.
- Full brute-force distance evaluation on the filtered rows is still too expensive.
- You want lower steady-state memory usage than an in-memory ANN structure.

## User-Facing Interfaces

### 1) Index DDL

Use `index_type="pq_on_disk"` in ANN index properties.

```sql
CREATE TABLE image_pool (
  user_id BIGINT NOT NULL,
  photo_id BIGINT NOT NULL,
  embedding ARRAY<FLOAT> NOT NULL,
  INDEX idx_emb (embedding) USING ANN PROPERTIES (
    "index_type" = "pq_on_disk",
    "metric_type" = "l2_distance",
    "dim" = "768",
    "pq_m" = "96",
    "pq_nbits" = "8"
  )
) ENGINE=OLAP
DUPLICATE KEY(user_id, photo_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 8
PROPERTIES ("replication_num" = "1");
```

Notes:

- `metric_type` supports `l2_distance` and `inner_product`.
- `dim` is required.
- `pq_m` is required.
- `dim` must be divisible by `pq_m`.
- `pq_nbits` is optional and defaults to `8`.
- Query syntax remains the same: `l2_distance_approximate` and `inner_product_approximate`.

### 2) Typical query patterns

Top-N reranking after filtering:

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
ORDER BY l2_distance_approximate(embedding, [0.12, 0.44, 0.33 /* ... */])
LIMIT 20;
```

For inner-product search, sort in descending order:

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
ORDER BY inner_product_approximate(embedding, [0.12, 0.44, 0.33 /* ... */]) DESC
LIMIT 20;
```

Range search is also supported:

```sql
SELECT photo_id
FROM image_pool
WHERE user_id = 10001
  AND l2_distance_approximate(embedding, [0.12, 0.44, 0.33 /* ... */]) < 5.0
ORDER BY photo_id;
```

The most important usage characteristic is that `pq_on_disk` is intended to work with filters. This is the main scenario where it differs from `ivf_on_disk`.

### 3) BE cache configuration

`pq_on_disk` uses a dedicated chunk cache for PQ code data:

- `ann_index_pq_chunk_cache_limit` (default: `60%`)
- `ann_index_pq_chunk_cache_stale_sweep_time_sec` (default: `1800`)

The percentage value of `ann_index_pq_chunk_cache_limit` is based on process-available memory (`mem_limit`), not total machine memory.

## Parameters and Constraints

### Index parameters

| Property | Required | Default | Description |
|---|---|---|---|
| `index_type` | Yes | - | Must be `pq_on_disk`. |
| `metric_type` | Yes | - | `l2_distance` or `inner_product`. |
| `dim` | Yes | - | Vector dimension. |
| `pq_m` | Yes | - | Number of PQ subquantizers. Must divide `dim`. |
| `pq_nbits` | No | `8` | Number of bits per subquantizer code. |

### Training behavior

`pq_on_disk` needs enough rows to train the PQ codebook. The minimum training row count is:

```text
(1 << pq_nbits) * 100
```

Examples:

- `pq_nbits = 8` requires at least `25600` training rows.
- `pq_nbits = 4` requires at least `1600` training rows.

If a segment does not have enough rows to train the PQ index, Doris can fall back to brute-force search for that segment.

## Observability

`pq_on_disk` introduces a dedicated BE cache named `AnnIndexPqChunkCache`.

When troubleshooting, first check whether queries are actually selective enough and whether the PQ chunk cache is large enough to avoid repeated disk reads on hot candidate ranges.

## Usage Notes

- `pq_on_disk` is best suited for selective filter + vector reranking, not global ANN recall.
- It shares the common ANN table constraints in Doris, such as vector column type and ANN expression usage.
- It supports both `l2_distance` and `inner_product`, including Top-N and range-search style predicates.
- Query result ordering follows the metric semantics: `l2_distance_approximate` uses ascending order, while `inner_product_approximate` uses descending order.
- Data locality matters. It works best when rows belonging to the same filter key are physically close, so PQ code reads are more sequential.
- For very small segments or very small training sets, the index may not be built and the query can fall back to brute force.

## Best Practices

1. Choose `pq_on_disk` when the query pattern is usually `filter first, rerank second`.
2. Keep the filter column selective. The smaller the post-filter candidate set, the more suitable `pq_on_disk` becomes.
3. Choose `pq_m` so that `dim / pq_m` is reasonable and easy to manage. A common starting point is to align `pq_m` with the dimensional decomposition you already use in other PQ-based systems.
4. Start with `pq_nbits = 8` unless you have strong reasons to trade recall for smaller code size.
5. Watch cache effectiveness and latency together. If repeated filtered queries are still I/O-heavy, increase `ann_index_pq_chunk_cache_limit` and retest.
6. Validate on real business data before production rollout, especially for recall quality under your actual filter distribution.

## How to Choose Between `ivf_on_disk` and `pq_on_disk`

Use `ivf_on_disk` when:

- You need ANN to search across a large global vector collection.
- Your main tuning model is still `nlist` and `nprobe`.
- Query performance depends on probing a subset of IVF lists.

Use `pq_on_disk` when:

- The query already has a selective scalar filter.
- The candidate set after filtering is relatively small.
- You mainly need fast approximate reranking within filtered rows rather than global ANN recall.

In short, `ivf_on_disk` is a disk-backed global ANN index, while `pq_on_disk` is a disk-backed post-filter reranking index.
